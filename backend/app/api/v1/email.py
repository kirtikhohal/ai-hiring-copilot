from fastapi import APIRouter, HTTPException

from app.llm.client import call_llm, parse_json_response
from app.llm.prompt_loader import load_prompt
from app.models.schemas import EmailDraftRequest, EmailDraftResponse, EmailSendRequest, MessageResponse
from app.db import crud
from app.utils.email_sender import send_email, EmailNotConfigured

router = APIRouter()

VALID_DECISIONS = {"next_round", "rejection"}

# Sending an email advances the candidate's lifecycle for that requirement.
DECISION_STATE = {"next_round": "interview_scheduled", "rejection": "rejected"}


@router.post("/draft", response_model=EmailDraftResponse)
def draft_email(request: EmailDraftRequest, refresh: bool = False):
    """Returns the cached draft for this decision if present; only calls the
    LLM the first time each decision ("next_round"/"rejection") is requested,
    or when refresh=true is passed."""
    if request.decision not in VALID_DECISIONS:
        raise HTTPException(
            status_code=400,
            detail=f"decision must be one of {sorted(VALID_DECISIONS)}.",
        )

    resume = crud.get_resume(request.resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="resume_id not found.")

    name = resume["parsed"].get("candidate_name", "Candidate")
    to_email = resume["parsed"].get("email", "")
    drafts = resume.get("email_drafts") or {}

    if not refresh and request.decision in drafts:
        d = drafts[request.decision]
        return EmailDraftResponse(
            resume_id=request.resume_id, candidate_name=name, to_email=to_email,
            subject=d.get("subject", ""), body=d.get("body", ""),
        )

    jd = crud.get_jd(request.jd_id)
    if jd is None:
        raise HTTPException(status_code=404, detail="jd_id not found.")

    # The persisted ranking rationale gives the model just enough context to
    # personalize the email without re-running any analysis.
    context_notes = resume.get("rationale") or "No screening notes available."

    prompt = load_prompt(
        "email_draft",
        candidate_name=name,
        role_title=jd.get("role_title", "the role"),
        decision=request.decision,
        context_notes=context_notes,
    )
    raw_response = call_llm(prompt)

    try:
        result = parse_json_response(raw_response)
    except Exception as e:
        print(f"[email.draft_email] failed to parse LLM response: {e!r}\nraw_response={raw_response!r}")
        raise HTTPException(status_code=502, detail="LLM returned an unparseable email draft.")

    draft = {"subject": result.get("subject", ""), "body": result.get("body", "")}
    drafts = {**drafts, request.decision: draft}
    crud.update_resume_fields(request.resume_id, {"email_drafts": drafts})

    return EmailDraftResponse(
        resume_id=request.resume_id, candidate_name=name, to_email=to_email,
        subject=draft["subject"], body=draft["body"],
    )


@router.post("/send", response_model=MessageResponse)
def send_candidate_email(request: EmailSendRequest):
    """Actually send the outreach email to the candidate, then advance their
    lifecycle state for this requirement (next_round → Interview Scheduled,
    rejection → Rejected)."""
    if request.decision not in VALID_DECISIONS:
        raise HTTPException(status_code=400, detail="Invalid decision.")

    resume = crud.get_resume(request.resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="resume_id not found.")
    to_email = resume["parsed"].get("email", "")
    if not to_email:
        raise HTTPException(
            status_code=422,
            detail="No email address was parsed from this candidate's resume, so it can't be emailed.",
        )

    try:
        send_email(to_email, request.subject, request.body)
    except EmailNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[email.send_candidate_email] send failed: {e!r}")
        raise HTTPException(status_code=502, detail=f"Could not send the email: {e}")

    # Advance the lifecycle for the exact requirement this email was for.
    new_state = DECISION_STATE[request.decision]
    if resume["jd_id"] == request.jd_id:
        crud.set_resume_state(request.resume_id, new_state)
    else:
        mapping = next(
            (m for m in crud.list_mappings_for_resume(request.resume_id) if m["jd_id"] == request.jd_id),
            None,
        )
        if mapping:
            crud.set_mapping_state(mapping["id"], new_state)

    return MessageResponse(message="Email sent to " + to_email + ".")
