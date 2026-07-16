import io
import os
import zipfile
from datetime import date

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import List

from app.utils.file_utils import validate_batch_upload, save_bytes
from app.utils.pdf_extractor import extract_text_from_pdf
from app.llm.client import call_llm, parse_json_response
from app.llm.prompt_loader import load_prompt
from app.models.schemas import ResumeUploadResponse, ResumeUploadResponseItem, ResumeParsed
from app.db import crud
from app.config import settings

router = APIRouter()

MAX_RESUMES_PER_BATCH = 20


def _extract_pdfs_from_zip(filename: str, content: bytes):
    try:
        archive = zipfile.ZipFile(io.BytesIO(content))
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail=f"{filename} is not a valid ZIP file.")

    extracted = []
    with archive:
        for entry in archive.namelist():
            if entry.endswith("/") or not entry.lower().endswith(".pdf"):
                continue
            extracted.append((os.path.basename(entry), archive.read(entry)))
    return extracted


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resumes(
    jd_id: str = Form(...),
    files: List[UploadFile] = File(...),
    source: str = Form("external"),
):
    source = source if source in ("internal", "external") else "external"
    if crud.get_jd(jd_id) is None:
        raise HTTPException(status_code=404, detail="jd_id not found. Upload a JD first.")

    # Accept a mix of individual PDFs and ZIP archives — expand any ZIPs into
    # their contained PDFs before processing, so both upload modes share the
    # exact same parsing path below.
    resume_files = []  # list of (filename, bytes)
    for file in files:
        if not validate_batch_upload(file.filename):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF or ZIP file.")

        content = await file.read()
        if file.filename.lower().endswith(".zip"):
            resume_files.extend(_extract_pdfs_from_zip(file.filename, content))
        else:
            resume_files.append((file.filename, content))

    if not resume_files:
        raise HTTPException(status_code=400, detail="No PDF resumes found in the upload.")
    if len(resume_files) > MAX_RESUMES_PER_BATCH:
        raise HTTPException(
            status_code=400,
            detail=f"Too many resumes ({len(resume_files)}) — max {MAX_RESUMES_PER_BATCH} per batch.",
        )

    results = []

    for filename, content in resume_files:
        saved_path = save_bytes(content, filename, settings.UPLOAD_DIR)
        text = extract_text_from_pdf(saved_path)

        if not text:
            raise HTTPException(status_code=422, detail=f"Could not extract text from {filename}.")

        prompt = load_prompt("parse_resume", content=text, current_date=date.today().isoformat())
        raw_response = call_llm(prompt)

        try:
            parsed_dict = parse_json_response(raw_response)
        except Exception as e:
            print(f"[resumes.upload_resumes] failed to parse LLM response for {filename}: {e!r}\nraw_response={raw_response!r}")
            raise HTTPException(status_code=502, detail=f"LLM returned an unparseable response for {filename}.")

        parsed = ResumeParsed(**parsed_dict)
        resume_id = crud.save_resume(
            jd_id, filename, parsed.model_dump(), file_path=saved_path, source=source
        )

        results.append(
            ResumeUploadResponseItem(resume_id=resume_id, filename=filename, parsed=parsed)
        )

    return ResumeUploadResponse(jd_id=jd_id, resumes=results)


@router.get("/{resume_id}/file")
def get_resume_file(resume_id: str, download: bool = False):
    """Serve the original resume PDF — inline for quick-view, or as an
    attachment when download=true."""
    resume = crud.get_resume(resume_id)
    if resume is None or not resume.get("file_path") or not os.path.exists(resume["file_path"]):
        raise HTTPException(status_code=404, detail="No stored resume file for this candidate.")
    name = (resume["parsed"].get("candidate_name") or resume.get("filename") or "resume").replace(" ", "_")
    if not name.lower().endswith(".pdf"):
        name = f"{name}.pdf"
    disposition = "attachment" if download else "inline"
    return FileResponse(
        resume["file_path"],
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{name}"'},
    )
