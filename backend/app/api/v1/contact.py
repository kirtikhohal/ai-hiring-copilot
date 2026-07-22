from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.schemas import ContactRequest, MessageResponse
from app.utils.email_sender import send_email, EmailNotConfigured

router = APIRouter()


@router.post("", response_model=MessageResponse)
def submit_contact(req: ContactRequest):
    if not req.message.strip() or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email and message are required.")

    subject = f"[Hazel contact] {req.topic or 'Message'} — {req.email}"
    body = (
        f"Topic: {req.topic or '(none)'}\n"
        f"From: {req.email}\n\n"
        f"{req.message}"
    )
    try:
        # Delivered to the team inbox (the configured sender); Reply-To lets the
        # team reply straight to the sender.
        send_email(settings.email_from, subject, body, reply_to=req.email.strip())
    except EmailNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[contact.submit_contact] email send failed: {e!r}")
        raise HTTPException(status_code=502, detail=f"Could not send your message: {e}")

    return MessageResponse(message="Thanks! Your message has been sent.")
