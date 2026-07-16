import json

from app.llm.client import call_llm, parse_json_response
from app.llm.prompt_loader import load_prompt


def strip_pii(parsed_resume: dict) -> dict:
    return {
        k: v for k, v in parsed_resume.items()
        if k not in ("candidate_name", "email", "phone")
    }


def run_skill_gap(jd: dict, parsed_resume: dict) -> dict:
    """Runs the skill-gap prompt for one candidate against one JD.
    Raises ValueError if the LLM response can't be parsed — callers map
    that to an HTTP 502."""
    prompt = load_prompt(
        "skill_gap",
        jd_json=json.dumps(jd),
        resume_json=json.dumps(strip_pii(parsed_resume)),
    )
    raw_response = call_llm(prompt)
    try:
        return parse_json_response(raw_response)
    except Exception as e:
        print(f"[skill_gap_service] failed to parse LLM response: {e!r}\nraw_response={raw_response!r}")
        raise ValueError("LLM returned an unparseable skill gap analysis.")
