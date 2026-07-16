import json
from google import genai
from google.genai import types

from app.config import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)


def call_llm(prompt: str, max_tokens: int = 2048) -> str:
    """Calls Gemini and forces strict JSON output — no markdown fences to strip."""
    response = _client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=max_tokens,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    return response.text


def parse_json_response(raw_text: str) -> dict:
    """Gemini's JSON mode returns clean JSON directly, but we still guard
    against edge cases (empty response, stray whitespace)."""
    return json.loads(raw_text.strip())