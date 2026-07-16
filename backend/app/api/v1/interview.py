import json
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.llm.client import call_llm, parse_json_response
from app.llm.prompt_loader import load_prompt
from app.models.schemas import (
    InterviewQuestionsRequest,
    InterviewQuestionsResponse,
    InterviewSummaryRequest,
    InterviewSummaryResponse,
    TranscriptExtractResponse,
)
from app.services.skill_gap_service import run_skill_gap, strip_pii
from app.utils.pdf_extractor import extract_text_from_pdf_bytes
from app.db import crud

router = APIRouter()


@router.post("/questions", response_model=InterviewQuestionsResponse)
def generate_questions(request: InterviewQuestionsRequest, refresh: bool = False):
    """Returns cached questions if present; only calls the LLM on the first
    request (or when refresh=true). Reuses the cached skill-gap analysis so a
    fresh generation costs one call, not two."""
    resume = crud.get_resume(request.resume_id)
    if resume is None or resume["jd_id"] != request.jd_id:
        raise HTTPException(status_code=404, detail="resume_id not found for this jd_id.")

    name = resume["parsed"].get("candidate_name", "Unknown")

    if not refresh and resume.get("interview_questions"):
        return InterviewQuestionsResponse(
            resume_id=request.resume_id, candidate_name=name, **resume["interview_questions"]
        )

    jd = crud.get_jd(request.jd_id)
    if jd is None:
        raise HTTPException(status_code=404, detail="jd_id not found.")

    # Reuse the cached skill-gap if we already have it; only compute otherwise.
    missing = None
    if resume.get("skill_gap"):
        missing = resume["skill_gap"].get("missing_required_skills", [])
    if missing is None:
        try:
            gap = run_skill_gap(jd, resume["parsed"])
        except ValueError as e:
            raise HTTPException(status_code=502, detail=str(e))
        missing = gap.get("missing_required_skills", [])
        crud.update_resume_fields(request.resume_id, {"skill_gap": {
            "matched_required_skills": gap.get("matched_required_skills", []),
            "missing_required_skills": gap.get("missing_required_skills", []),
            "matched_preferred_skills": gap.get("matched_preferred_skills", []),
            "missing_preferred_skills": gap.get("missing_preferred_skills", []),
            "gap_summary": gap.get("gap_summary", ""),
        }})

    prompt = load_prompt(
        "interview_questions",
        jd_json=json.dumps(jd),
        resume_json=json.dumps(strip_pii(resume["parsed"])),
        missing_skills_json=json.dumps(missing),
    )
    raw_response = call_llm(prompt)

    try:
        result = parse_json_response(raw_response)
    except Exception as e:
        print(f"[interview.generate_questions] failed to parse LLM response: {e!r}\nraw_response={raw_response!r}")
        raise HTTPException(status_code=502, detail="LLM returned unparseable interview questions.")

    cached = {
        "technical_questions": result.get("technical_questions", []),
        "behavioral_questions": result.get("behavioral_questions", []),
    }
    crud.update_resume_fields(request.resume_id, {"interview_questions": cached})
    return InterviewQuestionsResponse(resume_id=request.resume_id, candidate_name=name, **cached)


@router.post("/transcript/extract", response_model=TranscriptExtractResponse)
def extract_transcript(file: UploadFile = File(...)):
    """Extract raw text from an uploaded interview-transcript PDF so it can be
    dropped into the summary flow — the same LLM summarization then runs on it,
    exactly as if the recruiter had pasted the text."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Transcript must be a PDF file.")

    text = extract_text_from_pdf_bytes(file.file.read())
    if not text:
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from that PDF (it may be scanned/image-only).",
        )
    return TranscriptExtractResponse(text=text)


@router.get("/summary/{jd_id}", response_model=Optional[InterviewSummaryResponse])
def get_summary(jd_id: str):
    """Returns the last stored summary for this project (transcript + result),
    or null if none has been generated yet. No LLM call."""
    cached = crud.get_jd_cache(jd_id, "interview_summary")
    if not cached:
        return None
    return InterviewSummaryResponse(**cached["result"], transcript=cached.get("transcript", ""))


@router.post("/summary", response_model=InterviewSummaryResponse)
def summarize_interview(request: InterviewSummaryRequest, refresh: bool = False):
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty.")

    jd = crud.get_jd(request.jd_id)
    if jd is None:
        raise HTTPException(status_code=404, detail="jd_id not found.")

    # Same transcript already summarized → return it, no new call (unless refresh).
    cached = crud.get_jd_cache(request.jd_id, "interview_summary")
    if not refresh and cached and cached.get("transcript") == request.transcript:
        return InterviewSummaryResponse(**cached["result"], transcript=request.transcript)

    prompt = load_prompt(
        "interview_summary",
        jd_json=json.dumps(jd),
        transcript=request.transcript,
    )
    raw_response = call_llm(prompt)

    try:
        result = parse_json_response(raw_response)
    except Exception as e:
        print(f"[interview.summarize_interview] failed to parse LLM response: {e!r}\nraw_response={raw_response!r}")
        raise HTTPException(status_code=502, detail="LLM returned an unparseable summary.")

    payload = {
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "summary": result.get("summary", ""),
        "recommended_verdict": result.get("recommended_verdict", ""),
    }
    crud.update_jd_fields(request.jd_id, {"interview_summary": {"transcript": request.transcript, "result": payload}})
    return InterviewSummaryResponse(**payload, transcript=request.transcript)
