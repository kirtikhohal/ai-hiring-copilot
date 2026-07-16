import os

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from app.utils.file_utils import validate_pdf, save_upload_file
from app.utils.pdf_extractor import extract_text_from_pdf
from app.llm.client import call_llm, parse_json_response
from app.llm.prompt_loader import load_prompt
from app.models.schemas import (
    JDUploadResponse,
    JDParsed,
    JDListResponse,
    JDSummary,
    BiasReportResponse,
    ProjectContext,
)
from app.db import crud
from app.config import settings

router = APIRouter()


def _project_context(jd_row: dict) -> ProjectContext:
    """Build the Client/Internal + project-name context for a JD row."""
    pid = jd_row.get("project_id")
    if not pid:
        return ProjectContext()
    project = crud.get_project(pid)
    if not project:
        return ProjectContext()
    return ProjectContext(
        project_id=pid,
        project_name=project.get("name") or "",
        type=project.get("type") or "",
        client_name=project.get("client_name") or "",
        company_name=project.get("company_name") or "",
    )


@router.get("", response_model=JDListResponse)
def list_jds():
    jds = crud.list_jds()
    # One bulk query for every project's resume stats instead of one query
    # per JD (was N+1 → now 2 queries total, regardless of project count).
    stats_by_jd = crud.get_resume_stats_bulk()
    projects = [
        JDSummary(
            jd_id=jd["id"],
            role_title=jd.get("role_title") or "Untitled role",
            resume_count=stats_by_jd.get(jd["id"], {}).get("resume_count", 0),
            top_score=stats_by_jd.get(jd["id"], {}).get("top_score"),
            created_at=jd.get("created_at"),
        )
        for jd in jds
    ]
    return JDListResponse(projects=projects)


@router.get("/{jd_id}", response_model=JDUploadResponse)
def get_jd(jd_id: str):
    row = crud.get_jd_row(jd_id)
    if row is None:
        raise HTTPException(status_code=404, detail="jd_id not found.")
    parsed = {field: row.get(field) for field in crud.JD_FIELDS}
    has_file = bool(row.get("file_path")) and os.path.exists(row["file_path"])
    return JDUploadResponse(
        jd_id=jd_id,
        parsed=JDParsed(**parsed),
        project=_project_context(row),
        has_file=has_file,
    )


@router.get("/{jd_id}/file")
def get_jd_file(jd_id: str, download: bool = False):
    """Serve the original JD PDF — inline for quick-view, or as an attachment
    when download=true."""
    row = crud.get_jd_row(jd_id)
    if not row or not row.get("file_path") or not os.path.exists(row["file_path"]):
        raise HTTPException(status_code=404, detail="No stored JD file for this designation.")
    name = (row.get("role_title") or "job-description").replace(" ", "_")
    disposition = "attachment" if download else "inline"
    return FileResponse(
        row["file_path"],
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{name}.pdf"'},
    )


@router.post("/upload", response_model=JDUploadResponse)
def upload_jd(file: UploadFile = File(...), project_id: str = Form(None)):
    if not validate_pdf(file.filename):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    saved_path = save_upload_file(file, settings.UPLOAD_DIR)
    text = extract_text_from_pdf(saved_path)

    if not text:
        raise HTTPException(status_code=422, detail="Could not extract text from the PDF.")

    prompt = load_prompt("parse_jd", content=text)
    raw_response = call_llm(prompt)

    try:
        parsed_dict = parse_json_response(raw_response)
    except Exception as e:
        print(f"[jd.upload_jd] failed to parse LLM response: {e!r}\nraw_response={raw_response!r}")
        raise HTTPException(status_code=502, detail="LLM returned an unparseable response.")

    parsed = JDParsed(**parsed_dict)
    jd_id = crud.save_jd(
        parsed.model_dump(),
        raw_text=text,
        project_id=project_id or None,
        file_path=saved_path,
    )

    row = crud.get_jd_row(jd_id)
    return JDUploadResponse(
        jd_id=jd_id,
        parsed=parsed,
        project=_project_context(row) if row else ProjectContext(),
        has_file=True,
    )


@router.get("/{jd_id}/bias", response_model=BiasReportResponse)
def detect_jd_bias(jd_id: str, refresh: bool = False):
    """Returns the cached bias report if one exists; only calls the LLM on the
    first request (or when refresh=true is passed)."""
    if not refresh:
        cached = crud.get_jd_cache(jd_id, "bias_report")
        if cached:
            return BiasReportResponse(jd_id=jd_id, **cached)

    raw_text = crud.get_jd_raw_text(jd_id)
    if raw_text is None:
        raise HTTPException(status_code=404, detail="jd_id not found.")
    if not raw_text:
        raise HTTPException(
            status_code=422,
            detail="No raw JD text stored for this project (uploaded before bias detection existed). Re-upload the JD to enable bias scanning.",
        )

    prompt = load_prompt("bias_detection", content=raw_text)
    raw_response = call_llm(prompt)

    try:
        result = parse_json_response(raw_response)
    except Exception as e:
        print(f"[jd.detect_jd_bias] failed to parse LLM response: {e!r}\nraw_response={raw_response!r}")
        raise HTTPException(status_code=502, detail="LLM returned an unparseable bias report.")

    cached = {
        "bias_flags": result.get("bias_flags", []),
        "overall_risk": result.get("overall_risk", "low"),
    }
    crud.update_jd_fields(jd_id, {"bias_report": cached})
    return BiasReportResponse(jd_id=jd_id, **cached)