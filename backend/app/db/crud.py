import os
from typing import List, Optional

from app.db.supabase_client import get_client

JD_FIELDS = [
    "role_title",
    "required_skills",
    "preferred_skills",
    "min_experience_years",
    "education_requirements",
    "key_responsibilities",
]

RESUME_FIELDS = [
    "candidate_name",
    "email",
    "phone",
    "total_experience_years",
    "skills",
    "education",
    "work_history_summary",
    "certifications",
]

# Columns needed to build a resume list / ranking. Deliberately excludes the
# large cached-LLM jsonb columns (skill_gap, interview_questions, email_drafts)
# so listing candidates doesn't transfer megabytes of unused data over the wire.
RESUME_LIST_COLUMNS = ", ".join(
    [
        "id",
        "jd_id",
        "filename",
        "file_path",
        "hiring_score",
        "rationale",
        "source",
        "state",
        *RESUME_FIELDS,
    ]
)


def save_jd(
    parsed: dict,
    raw_text: str = "",
    project_id: Optional[str] = None,
    file_path: Optional[str] = None,
) -> str:
    row = {field: parsed.get(field) for field in JD_FIELDS}
    row["raw_text"] = raw_text
    if project_id:
        row["project_id"] = project_id
    if file_path:
        row["file_path"] = file_path
    result = get_client().table("jds").insert(row).execute()
    return result.data[0]["id"]


def get_jd_raw_text(jd_id: str) -> Optional[str]:
    result = get_client().table("jds").select("raw_text").eq("id", jd_id).execute()
    if not result.data:
        return None
    return result.data[0].get("raw_text") or ""


def get_jd(jd_id: str) -> Optional[dict]:
    result = get_client().table("jds").select("*").eq("id", jd_id).execute()
    if not result.data:
        return None
    row = result.data[0]
    return {field: row[field] for field in JD_FIELDS}


def get_jd_row(jd_id: str) -> Optional[dict]:
    """The full JD row (incl. project_id, file_path) — used for context and
    file serving, distinct from get_jd() which returns only the parsed fields."""
    result = get_client().table("jds").select("*").eq("id", jd_id).execute()
    return result.data[0] if result.data else None


def get_jd_rows(ids: List[str]) -> dict:
    """Batch-fetch JD rows by id in a single query -> {id: row}."""
    ids = list({i for i in ids if i})
    if not ids:
        return {}
    rows = get_client().table("jds").select("*").in_("id", ids).execute().data
    return {r["id"]: r for r in rows}


def get_projects_by_ids(ids: List[str]) -> dict:
    """Batch-fetch projects by id in a single query -> {id: row}."""
    ids = list({i for i in ids if i})
    if not ids:
        return {}
    rows = get_client().table("projects").select("*").in_("id", ids).execute().data
    return {r["id"]: r for r in rows}


def list_jds() -> List[dict]:
    result = (
        get_client()
        .table("jds")
        .select("id, role_title, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_resume_stats(jd_id: str) -> dict:
    result = (
        get_client()
        .table("resumes")
        .select("hiring_score")
        .eq("jd_id", jd_id)
        .execute()
    )
    scores = [r["hiring_score"] for r in result.data if r.get("hiring_score") is not None]
    return {
        "resume_count": len(result.data),
        "top_score": max(scores) if scores else None,
    }


def get_resume_stats_bulk() -> dict:
    """Per-JD {resume_count, top_score, shortlisted} for ALL openings in a
    couple of queries. Shortlisted counts both home candidates in the
    'shortlisted' state and candidates cross-mapped into this opening as
    shortlisted."""
    result = get_client().table("resumes").select("jd_id, hiring_score, state").execute()
    stats: dict = {}

    def entry_for(jd_id):
        return stats.setdefault(jd_id, {"resume_count": 0, "top_score": None, "shortlisted": 0})

    for row in result.data:
        entry = entry_for(row["jd_id"])
        entry["resume_count"] += 1
        score = row.get("hiring_score")
        if score is not None and (entry["top_score"] is None or score > entry["top_score"]):
            entry["top_score"] = score
        if (row.get("state") or "") == "shortlisted":
            entry["shortlisted"] += 1

    # Candidates cross-mapped INTO an opening count toward that opening's totals
    # (count, top score, shortlisted) — they show in its ranked list, so the
    # dashboard/clients/internal numbers must include them.
    maps = get_client().table("candidate_mappings").select("jd_id, state, hiring_score").execute()
    for m in maps.data:
        entry = entry_for(m["jd_id"])
        entry["resume_count"] += 1
        score = m.get("hiring_score")
        if score is not None and (entry["top_score"] is None or score > entry["top_score"]):
            entry["top_score"] = score
        if (m.get("state") or "") == "shortlisted":
            entry["shortlisted"] += 1

    return stats


def save_resume(
    jd_id: str,
    filename: str,
    parsed: dict,
    file_path: Optional[str] = None,
    source: str = "external",
) -> str:
    row = {field: parsed.get(field) for field in RESUME_FIELDS}
    row["jd_id"] = jd_id
    row["filename"] = filename
    row["source"] = source
    row["state"] = "profile_imported"
    if file_path:
        row["file_path"] = file_path
    result = get_client().table("resumes").insert(row).execute()
    return result.data[0]["id"]


def get_resumes(jd_id: str) -> List[dict]:
    result = (
        get_client()
        .table("resumes")
        .select(RESUME_LIST_COLUMNS)
        .eq("jd_id", jd_id)
        .execute()
    )
    return [
        {
            "resume_id": row["id"],
            "filename": row["filename"],
            "file_path": row.get("file_path"),
            "hiring_score": row.get("hiring_score"),
            "rationale": row.get("rationale"),
            "source": row.get("source") or "external",
            "state": row.get("state") or "profile_imported",
            "parsed": {field: row[field] for field in RESUME_FIELDS},
        }
        for row in result.data
    ]


def get_resume(resume_id: str) -> Optional[dict]:
    result = get_client().table("resumes").select("*").eq("id", resume_id).execute()
    if not result.data:
        return None
    row = result.data[0]
    return {
        "resume_id": row["id"],
        "jd_id": row["jd_id"],
        "filename": row["filename"],
        "file_path": row.get("file_path"),
        "hiring_score": row.get("hiring_score"),
        "rationale": row.get("rationale"),
        "source": row.get("source") or "external",
        "state": row.get("state") or "profile_imported",
        # Cached LLM outputs (jsonb) — None until first computed.
        "skill_gap": row.get("skill_gap"),
        "interview_questions": row.get("interview_questions"),
        "email_drafts": row.get("email_drafts"),
        "parsed": {field: row[field] for field in RESUME_FIELDS},
    }


def update_resume_score(resume_id: str, hiring_score: int, rationale: str) -> None:
    # Scoring only ever runs on an unscored resume, so advancing the lifecycle
    # to "matched" here won't clobber a later manual state (shortlisted, etc.).
    get_client().table("resumes").update(
        {"hiring_score": hiring_score, "rationale": rationale, "state": "matched"}
    ).eq("id", resume_id).execute()


def set_resume_state(resume_id: str, state: str) -> None:
    get_client().table("resumes").update({"state": state}).eq("id", resume_id).execute()


# ---- Candidate ↔ requirement mappings (a candidate on multiple requirements) ----

def add_candidate_mapping(
    resume_id: str,
    jd_id: str,
    state: str = "shortlisted",
    hiring_score=None,
    rationale=None,
) -> dict:
    row = {"resume_id": resume_id, "jd_id": jd_id, "state": state}
    if hiring_score is not None:
        row["hiring_score"] = hiring_score
    if rationale is not None:
        row["rationale"] = rationale
    result = get_client().table("candidate_mappings").insert(row).execute()
    return result.data[0]


def get_mapped_in_candidates(jd_id: str) -> List[dict]:
    """Candidates cross-mapped INTO this requirement from another one — shaped
    like get_resumes() rows so they can be merged into the ranked list, but
    carrying the mapping's own score + lifecycle state."""
    maps = (
        get_client().table("candidate_mappings").select("*").eq("jd_id", jd_id).execute().data
    )
    if not maps:
        return []
    resume_ids = list({m["resume_id"] for m in maps})
    rows = (
        get_client()
        .table("resumes")
        .select(RESUME_LIST_COLUMNS)
        .in_("id", resume_ids)
        .execute()
        .data
    )
    by_id = {r["id"]: r for r in rows}
    out = []
    for m in maps:
        r = by_id.get(m["resume_id"])
        if not r:
            continue
        out.append(
            {
                "resume_id": r["id"],
                "filename": r["filename"],
                "file_path": r.get("file_path"),
                "hiring_score": m.get("hiring_score"),
                "rationale": m.get("rationale"),
                "source": r.get("source") or "external",
                "state": m.get("state") or "shortlisted",
                "mapping_id": m["id"],
                "shared": True,
                "parsed": {field: r[field] for field in RESUME_FIELDS},
            }
        )
    return out


def get_mapping(mapping_id: str) -> Optional[dict]:
    result = (
        get_client().table("candidate_mappings").select("*").eq("id", mapping_id).execute()
    )
    return result.data[0] if result.data else None


def list_mappings_for_resume(resume_id: str) -> List[dict]:
    result = (
        get_client()
        .table("candidate_mappings")
        .select("*")
        .eq("resume_id", resume_id)
        .execute()
    )
    return result.data


def set_mapping_state(mapping_id: str, state: str) -> None:
    get_client().table("candidate_mappings").update({"state": state}).eq(
        "id", mapping_id
    ).execute()


def delete_mapping(mapping_id: str) -> None:
    get_client().table("candidate_mappings").delete().eq("id", mapping_id).execute()


def candidate_directory() -> List[dict]:
    """Every candidate flattened with its requirement + client/project labels —
    powers the global search."""
    resumes = (
        get_client()
        .table("resumes")
        .select("id, candidate_name, jd_id, state, source")
        .execute()
        .data
    )
    jds = get_client().table("jds").select("id, role_title, project_id").execute().data
    projects = get_client().table("projects").select("*").execute().data
    jd_by = {j["id"]: j for j in jds}
    proj_by = {p["id"]: p for p in projects}
    out = []
    for r in resumes:
        j = jd_by.get(r["jd_id"]) or {}
        p = proj_by.get(j.get("project_id")) or {}
        out.append(
            {
                "resume_id": r["id"],
                "candidate_name": r.get("candidate_name") or "Unknown",
                "jd_id": r["jd_id"],
                "role_title": j.get("role_title") or "",
                "project_name": p.get("name") or "",
                "client_name": p.get("client_name") or "",
                "company_name": p.get("company_name") or "",
                "type": p.get("type") or "",
                "state": r.get("state") or "profile_imported",
                "source": r.get("source") or "external",
            }
        )
    return out


def _remove_file(path):
    """Best-effort delete of a stored upload file; never fails the request."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"[crud._remove_file] could not remove {path!r}: {e!r}")


def delete_resume(resume_id: str) -> None:
    """Delete one candidate: its cross-opening mappings, stored file, and row."""
    client = get_client()
    row = client.table("resumes").select("file_path").eq("id", resume_id).execute().data
    client.table("candidate_mappings").delete().eq("resume_id", resume_id).execute()
    client.table("resumes").delete().eq("id", resume_id).execute()
    if row:
        _remove_file(row[0].get("file_path"))


def remove_candidate_from_opening(resume_id: str, jd_id: str) -> str:
    """Remove a candidate from ONE opening only (leaving their other openings
    intact). Returns 'missing' | 'unlinked' | 'rehomed' | 'deleted'.

    - opening is a cross-mapping        -> delete just that mapping ('unlinked')
    - opening is home, has other links  -> promote a mapping to home ('rehomed')
    - opening is home, no other links   -> full delete of the candidate ('deleted')
    """
    client = get_client()
    rows = client.table("resumes").select("id, jd_id").eq("id", resume_id).execute().data
    if not rows:
        return "missing"
    if rows[0]["jd_id"] != jd_id:
        client.table("candidate_mappings").delete().eq("resume_id", resume_id).eq(
            "jd_id", jd_id
        ).execute()
        return "unlinked"

    mappings = list_mappings_for_resume(resume_id)
    if mappings:
        m = mappings[0]  # promote another opening to be this candidate's new home
        client.table("resumes").update(
            {
                "jd_id": m["jd_id"],
                "hiring_score": m.get("hiring_score"),
                "rationale": m.get("rationale"),
                "state": m.get("state") or "shortlisted",
            }
        ).eq("id", resume_id).execute()
        client.table("candidate_mappings").delete().eq("id", m["id"]).execute()
        return "rehomed"

    delete_resume(resume_id)
    return "deleted"


def delete_jd(jd_id: str) -> None:
    """Delete a job opening: its home candidates (+ their mappings), any
    candidates mapped INTO it, the stored JD file, and the row."""
    client = get_client()
    rows = client.table("resumes").select("id, file_path").eq("jd_id", jd_id).execute().data
    resume_ids = [r["id"] for r in rows]
    if resume_ids:
        client.table("candidate_mappings").delete().in_("resume_id", resume_ids).execute()
    client.table("candidate_mappings").delete().eq("jd_id", jd_id).execute()
    client.table("resumes").delete().eq("jd_id", jd_id).execute()
    jd = client.table("jds").select("file_path").eq("id", jd_id).execute().data
    client.table("jds").delete().eq("id", jd_id).execute()
    for r in rows:
        _remove_file(r.get("file_path"))
    if jd:
        _remove_file(jd[0].get("file_path"))


def delete_project(project_id: str) -> None:
    """Delete a project and everything under it (openings, candidates, mappings)."""
    client = get_client()
    jd_rows = client.table("jds").select("id, file_path").eq("project_id", project_id).execute().data
    jd_ids = [j["id"] for j in jd_rows]
    if jd_ids:
        res_rows = client.table("resumes").select("id, file_path").in_("jd_id", jd_ids).execute().data
        resume_ids = [r["id"] for r in res_rows]
        if resume_ids:
            client.table("candidate_mappings").delete().in_("resume_id", resume_ids).execute()
        client.table("candidate_mappings").delete().in_("jd_id", jd_ids).execute()
        client.table("resumes").delete().in_("jd_id", jd_ids).execute()
        client.table("jds").delete().in_("id", jd_ids).execute()
        for r in res_rows:
            _remove_file(r.get("file_path"))
        for j in jd_rows:
            _remove_file(j.get("file_path"))
    client.table("projects").delete().eq("id", project_id).execute()


def mapping_counts_by_resume() -> dict:
    """{resume_id: number_of_extra_requirement_mappings} in one query, for the
    'N opportunities' badge in ranked lists."""
    result = get_client().table("candidate_mappings").select("resume_id").execute()
    counts: dict = {}
    for row in result.data:
        counts[row["resume_id"]] = counts.get(row["resume_id"], 0) + 1
    return counts


def update_resume_fields(resume_id: str, updates: dict) -> None:
    """Persist arbitrary columns on a resume (used for cached LLM outputs)."""
    get_client().table("resumes").update(updates).eq("id", resume_id).execute()


def get_jd_cache(jd_id: str, field: str):
    """Read a single cached jsonb column (e.g. bias_report, interview_summary)."""
    result = get_client().table("jds").select(field).eq("id", jd_id).execute()
    if not result.data:
        return None
    return result.data[0].get(field)


def update_jd_fields(jd_id: str, updates: dict) -> None:
    get_client().table("jds").update(updates).eq("id", jd_id).execute()


# ---- Projects (Client / Internal containers for designations) ----

PROJECT_FIELDS = ["id", "name", "type", "client_name", "company_name", "created_at"]


def create_project(name: str, type: str, client_name: str, company_name: str) -> dict:
    row = {
        "name": name,
        "type": type,
        "client_name": client_name or None,
        "company_name": company_name or None,
    }
    result = get_client().table("projects").insert(row).execute()
    return result.data[0]


def get_project(project_id: str) -> Optional[dict]:
    result = (
        get_client().table("projects").select("*").eq("id", project_id).execute()
    )
    return result.data[0] if result.data else None


def list_projects() -> List[dict]:
    result = (
        get_client()
        .table("projects")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def list_jds_full() -> List[dict]:
    """All JDs with the fields needed to group them under projects."""
    result = (
        get_client()
        .table("jds")
        .select("id, role_title, created_at, project_id")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def count_projects() -> int:
    result = get_client().table("jds").select("id", count="exact").execute()
    return result.count or 0


def count_resumes() -> int:
    result = get_client().table("resumes").select("id", count="exact").execute()
    return result.count or 0


# ---- Users / auth ----

def create_user(
    full_name: str,
    username: str,
    email: str,
    position: str,
    org: str,
    org_city: str,
    org_country: str,
    password_hash: str,
) -> dict:
    row = {
        "full_name": full_name,
        "username": username,
        "email": email,
        "position": position,
        "org": org,
        "org_city": org_city,
        "org_country": org_country,
        "password_hash": password_hash,
    }
    result = get_client().table("users").insert(row).execute()
    return result.data[0]


def get_user_by_id(user_id: str) -> Optional[dict]:
    result = get_client().table("users").select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None


def get_user_by_email(email: str) -> Optional[dict]:
    result = get_client().table("users").select("*").eq("email", email).execute()
    return result.data[0] if result.data else None


def get_user_by_username(username: str) -> Optional[dict]:
    result = get_client().table("users").select("*").eq("username", username).execute()
    return result.data[0] if result.data else None


def get_user_by_identifier(identifier: str) -> Optional[dict]:
    """Look up a user by email first, then username — for email-or-username login.
    Two parameterized .eq() queries (never string-interpolated) keep this safe."""
    return get_user_by_email(identifier) or get_user_by_username(identifier)


def update_user(user_id: str, updates: dict) -> dict:
    result = get_client().table("users").update(updates).eq("id", user_id).execute()
    return result.data[0]
