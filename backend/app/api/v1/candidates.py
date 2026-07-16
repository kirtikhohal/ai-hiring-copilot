import json

from fastapi import APIRouter, HTTPException

from app.llm.client import call_llm, parse_json_response
from app.llm.prompt_loader import load_prompt
from app.models.schemas import (
    RankingResponse,
    CandidateRanking,
    SkillGapResponse,
    CandidateStateUpdate,
    MappingCreate,
    MappingStateUpdate,
    RequirementAssociation,
    CandidateAssociations,
    CandidateDirectoryItem,
    CandidateDirectoryResponse,
)
from app.services.skill_gap_service import run_skill_gap
from app.db import crud

router = APIRouter()


def _association(jd_id: str, state: str, primary: bool, mapping_id=None) -> RequirementAssociation:
    """Build a candidate↔requirement association with its client/project labels."""
    row = crud.get_jd_row(jd_id)
    role_title = (row.get("role_title") if row else "") or "Untitled role"
    project = crud.get_project(row["project_id"]) if row and row.get("project_id") else None
    return RequirementAssociation(
        mapping_id=mapping_id,
        jd_id=jd_id,
        role_title=role_title,
        project_id=project["id"] if project else None,
        project_name=(project.get("name") if project else "") or "",
        client_name=(project.get("client_name") if project else "") or "",
        company_name=(project.get("company_name") if project else "") or "",
        type=(project.get("type") if project else "") or "",
        state=state,
        primary=primary,
    )


def _score_resume(jd: dict, resume: dict) -> dict:
    resume_for_scoring = {
        k: v for k, v in resume["parsed"].items()
        if k not in ("candidate_name", "email", "phone")
    }
    prompt = load_prompt(
        "rank_candidate",
        jd_json=json.dumps(jd),
        resume_json=json.dumps(resume_for_scoring),
    )
    raw_response = call_llm(prompt)
    try:
        result = parse_json_response(raw_response)
        # Validate shape here (not just valid JSON) so a well-formed-but-wrong
        # response can't KeyError into an uncaught 500 downstream.
        return {
            "hiring_score": int(result["hiring_score"]),
            "rationale": result.get("rationale", ""),
        }
    except Exception as e:
        print(f"[candidates] bad LLM ranking for {resume['filename']}: {e!r}\nraw_response={raw_response!r}")
        raise HTTPException(
            status_code=502,
            detail=f"LLM returned an unparseable ranking for {resume['filename']}.",
        )


def _build_ranking_response(jd_id: str, resumes: list) -> RankingResponse:
    extra = crud.mapping_counts_by_resume()  # resume_id -> # extra requirement links

    # Home candidates (scored for this requirement) + candidates cross-mapped
    # in from another requirement (carry the mapping's own score + state), so a
    # candidate added to this requirement actually shows up in its list.
    home = [r for r in resumes if r.get("hiring_score") is not None]
    mapped_in = crud.get_mapped_in_candidates(jd_id)
    home_ids = {r["resume_id"] for r in home}
    merged = home + [m for m in mapped_in if m["resume_id"] not in home_ids]

    rankings = [
        CandidateRanking(
            resume_id=r["resume_id"],
            candidate_name=r["parsed"].get("candidate_name", "Unknown"),
            hiring_score=r.get("hiring_score") or 0,
            rationale=r.get("rationale") or "",
            skills=r["parsed"].get("skills") or [],
            years=r["parsed"].get("total_experience_years"),
            education=r["parsed"].get("education") or "",
            has_file=bool(r.get("file_path")),
            source=r.get("source") or "external",
            state=r.get("state") or "profile_imported",
            opportunities=1 + extra.get(r["resume_id"], 0),
            shared=bool(r.get("shared")),
        )
        for r in merged
    ]
    rankings.sort(key=lambda r: r.hiring_score, reverse=True)
    return RankingResponse(jd_id=jd_id, ranked_candidates=rankings)


@router.post("/rank/{jd_id}", response_model=RankingResponse)
def score_candidates(jd_id: str):
    """Scores any resumes under jd_id that don't have a score yet, persists
    the result to Supabase, and returns the full ranked list. Safe to call
    repeatedly — already-scored resumes are skipped, so it never re-spends
    LLM calls on a project that's already been ranked."""
    jd = crud.get_jd(jd_id)
    if jd is None:
        raise HTTPException(status_code=404, detail="jd_id not found.")

    resumes = crud.get_resumes(jd_id)
    if not resumes:
        raise HTTPException(status_code=404, detail="No resumes uploaded for this jd_id yet.")

    for resume in resumes:
        if resume.get("hiring_score") is not None:
            continue
        result = _score_resume(jd, resume)
        crud.update_resume_score(resume["resume_id"], result["hiring_score"], result["rationale"])
        resume["hiring_score"] = result["hiring_score"]
        resume["rationale"] = result["rationale"]

    return _build_ranking_response(jd_id, resumes)


@router.get("/rank/{jd_id}", response_model=RankingResponse)
def get_ranking(jd_id: str):
    """Reads persisted scores only — no LLM calls. Candidates that haven't
    been scored yet (POST not called) are simply omitted."""
    jd = crud.get_jd(jd_id)
    if jd is None:
        raise HTTPException(status_code=404, detail="jd_id not found.")

    resumes = crud.get_resumes(jd_id)
    return _build_ranking_response(jd_id, resumes)


@router.get("/all", response_model=CandidateDirectoryResponse)
def candidate_directory():
    """Flat list of every candidate (with requirement + client labels) — the
    data source for the global search bar."""
    items = [CandidateDirectoryItem(**c) for c in crud.candidate_directory()]
    return CandidateDirectoryResponse(candidates=items)


@router.get("/{resume_id}/skill-gap", response_model=SkillGapResponse)
def skill_gap(resume_id: str, refresh: bool = False):
    """Returns the cached skill-gap analysis if one exists; only calls the LLM
    on the first request (or when refresh=true is passed)."""
    resume = crud.get_resume(resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="resume_id not found.")

    name = resume["parsed"].get("candidate_name", "Unknown")

    if not refresh and resume.get("skill_gap"):
        return SkillGapResponse(resume_id=resume_id, candidate_name=name, **resume["skill_gap"])

    jd = crud.get_jd(resume["jd_id"])
    if jd is None:
        raise HTTPException(status_code=404, detail="JD for this resume not found.")

    try:
        result = run_skill_gap(jd, resume["parsed"])
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))

    cached = {
        "matched_required_skills": result.get("matched_required_skills", []),
        "missing_required_skills": result.get("missing_required_skills", []),
        "matched_preferred_skills": result.get("matched_preferred_skills", []),
        "missing_preferred_skills": result.get("missing_preferred_skills", []),
        "gap_summary": result.get("gap_summary", ""),
    }
    crud.update_resume_fields(resume_id, {"skill_gap": cached})
    return SkillGapResponse(resume_id=resume_id, candidate_name=name, **cached)


# ---- Lifecycle state ----

VALID_STATES = {
    "profile_imported",
    "ai_matching",
    "matched",
    "shortlisted",
    "interview_scheduled",
    "selected",
    "rejected",
    "on_hold",
    "idle",
}


@router.patch("/{resume_id}/state")
def update_candidate_state(resume_id: str, req: CandidateStateUpdate):
    if req.state not in VALID_STATES:
        raise HTTPException(status_code=400, detail=f"Unknown state '{req.state}'.")
    if crud.get_resume(resume_id) is None:
        raise HTTPException(status_code=404, detail="resume_id not found.")
    crud.set_resume_state(resume_id, req.state)
    return {"resume_id": resume_id, "state": req.state}


# ---- Cross-requirement mappings ----

@router.get("/{resume_id}/mappings", response_model=CandidateAssociations)
def get_candidate_mappings(resume_id: str):
    """All requirements this candidate is associated with: their home
    requirement (primary) plus any cross-mapped ones."""
    resume = crud.get_resume(resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="resume_id not found.")

    associations = [_association(resume["jd_id"], resume.get("state") or "profile_imported", True)]
    for m in crud.list_mappings_for_resume(resume_id):
        associations.append(_association(m["jd_id"], m.get("state") or "shortlisted", False, m["id"]))

    return CandidateAssociations(
        resume_id=resume_id,
        candidate_name=resume["parsed"].get("candidate_name", "Unknown"),
        source=resume.get("source") or "external",
        associations=associations,
    )


@router.post("/{resume_id}/mappings", response_model=CandidateAssociations)
def add_candidate_mapping(resume_id: str, req: MappingCreate):
    resume = crud.get_resume(resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="resume_id not found.")
    if req.jd_id == resume["jd_id"]:
        raise HTTPException(status_code=400, detail="Candidate already belongs to that requirement.")
    if any(m["jd_id"] == req.jd_id for m in crud.list_mappings_for_resume(resume_id)):
        raise HTTPException(status_code=409, detail="Candidate is already mapped to that requirement.")

    jd = crud.get_jd(req.jd_id)
    if jd is None:
        raise HTTPException(status_code=404, detail="Requirement (jd_id) not found.")

    # Score the candidate against the target requirement so they slot into that
    # requirement's ranked list with a real, JD-specific score. If scoring
    # fails, still create the mapping (it just won't have a score yet).
    scored = None
    try:
        scored = _score_resume(jd, resume)
    except HTTPException as e:
        print(f"[candidates.add_candidate_mapping] scoring failed: {e.detail!r}")

    crud.add_candidate_mapping(
        resume_id,
        req.jd_id,
        req.state,
        hiring_score=scored["hiring_score"] if scored else None,
        rationale=scored["rationale"] if scored else None,
    )
    return get_candidate_mappings(resume_id)


@router.patch("/mappings/{mapping_id}")
def update_mapping_state(mapping_id: str, req: MappingStateUpdate):
    if req.state not in VALID_STATES:
        raise HTTPException(status_code=400, detail=f"Unknown state '{req.state}'.")
    if crud.get_mapping(mapping_id) is None:
        raise HTTPException(status_code=404, detail="mapping not found.")
    crud.set_mapping_state(mapping_id, req.state)
    return {"mapping_id": mapping_id, "state": req.state}


@router.delete("/mappings/{mapping_id}")
def remove_mapping(mapping_id: str):
    crud.delete_mapping(mapping_id)
    return {"ok": True}
