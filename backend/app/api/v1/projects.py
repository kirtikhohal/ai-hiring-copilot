from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.db import crud
from app.utils.parallel import gather
from app.models.schemas import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectListResponse,
    DesignationSummary,
)

router = APIRouter()


def _designation(jd: dict, stats_by_jd: dict) -> DesignationSummary:
    stats = stats_by_jd.get(jd["id"], {})
    return DesignationSummary(
        jd_id=jd["id"],
        role_title=jd.get("role_title") or "Untitled role",
        resume_count=stats.get("resume_count", 0),
        top_score=stats.get("top_score"),
        shortlisted=stats.get("shortlisted", 0),
        created_at=jd.get("created_at"),
    )


@router.get("", response_model=ProjectListResponse)
def list_projects():
    """Every project with its designations (JDs) nested underneath. Legacy JDs
    that predate the projects feature are grouped under a synthetic
    'Unassigned' project so nothing disappears from the dashboard."""
    # Three independent queries run concurrently instead of back-to-back.
    projects, jds, stats_by_jd = gather(
        crud.list_projects, crud.list_jds_full, crud.get_resume_stats_bulk
    )

    by_project: dict = {}
    for jd in jds:
        by_project.setdefault(jd.get("project_id"), []).append(jd)

    known_ids = {p["id"] for p in projects}
    out = [
        ProjectResponse(
            id=p["id"],
            name=p.get("name") or "Untitled project",
            type=p.get("type") or "client",
            client_name=p.get("client_name") or "",
            company_name=p.get("company_name") or "",
            created_at=p.get("created_at"),
            designations=[_designation(jd, stats_by_jd) for jd in by_project.get(p["id"], [])],
        )
        for p in projects
    ]

    # Orphans: JDs with no project_id, or pointing at a project row that's gone.
    orphans = [
        jd
        for pid, jds_in in by_project.items()
        if pid is None or pid not in known_ids
        for jd in jds_in
    ]
    if orphans:
        out.append(
            ProjectResponse(
                id="",
                name="Unassigned job openings",
                type="none",
                designations=[_designation(jd, stats_by_jd) for jd in orphans],
            )
        )

    return ProjectListResponse(projects=out)


@router.post("", response_model=ProjectResponse)
def create_project(req: ProjectCreateRequest, current_user: dict = Depends(get_current_user)):
    ptype = req.type if req.type in ("client", "internal") else "client"
    if ptype == "client" and not req.client_name.strip():
        raise HTTPException(status_code=400, detail="Client name is required for a client project.")

    # Internal projects use the recruiter's organization as the company.
    company_name = "" if ptype == "client" else (current_user.get("org") or "")
    client_name = req.client_name.strip() if ptype == "client" else ""

    project = crud.create_project(
        name=req.name.strip(),
        type=ptype,
        client_name=client_name,
        company_name=company_name,
    )
    return ProjectResponse(
        id=project["id"],
        name=project["name"],
        type=project["type"],
        client_name=project.get("client_name") or "",
        company_name=project.get("company_name") or "",
        created_at=project.get("created_at"),
        designations=[],
    )


@router.delete("/{project_id}")
def delete_project(project_id: str):
    """Delete a project and everything under it (job openings, candidates, mappings)."""
    if crud.get_project(project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    crud.delete_project(project_id)
    return {"ok": True}
