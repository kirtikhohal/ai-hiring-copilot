import json
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings


class EmailNotConfigured(RuntimeError):
    """Raised when a send is attempted but the chosen provider isn't configured."""


def send_email(to: str, subject: str, body: str, reply_to: str | None = None) -> None:
    """Send a plain-text email via the configured provider.

    EMAIL_PROVIDER=smtp    -> classic SMTP (needs open SMTP ports)
    EMAIL_PROVIDER=brevo   -> Brevo HTTP API (works over HTTPS/443)
    EMAIL_PROVIDER=sendgrid-> SendGrid HTTP API (works over HTTPS/443)
    """
    if not settings.email_configured:
        raise EmailNotConfigured(
            "Email is not configured. Set EMAIL_PROVIDER and the matching "
            "credentials (SMTP_* , BREVO_API_KEY, or SENDGRID_API_KEY) in the "
            "backend .env."
        )
    if not to:
        raise ValueError("No recipient address.")

    provider = (settings.EMAIL_PROVIDER or "smtp").lower()
    if provider == "brevo":
        _send_brevo(to, subject, body, reply_to)
    elif provider == "sendgrid":
        _send_sendgrid(to, subject, body, reply_to)
    else:
        _send_smtp(to, subject, body, reply_to)


# ---- SMTP ----

def _send_smtp(to: str, subject: str, body: str, reply_to: str | None) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((settings.SMTP_FROM_NAME, settings.email_from))
    msg["To"] = to
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.send_message(msg)


# ---- HTTP helpers ----

def _post_json(url: str, headers: dict, payload: dict) -> tuple[int, str]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST", headers={**headers, "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:300]}")
    except Exception as e:  # timeout, DNS, TLS, etc.
        raise RuntimeError(str(e))


def _send_brevo(to: str, subject: str, body: str, reply_to: str | None) -> None:
    payload = {
        "sender": {"email": settings.email_from, "name": settings.SMTP_FROM_NAME},
        "to": [{"email": to}],
        "subject": subject,
        "textContent": body,
    }
    if reply_to:
        payload["replyTo"] = {"email": reply_to}
    status, resp = _post_json(
        "https://api.brevo.com/v3/smtp/email",
        {"api-key": settings.BREVO_API_KEY, "accept": "application/json"},
        payload,
    )
    if status not in (200, 201, 202):
        raise RuntimeError(f"Brevo error {status}: {resp[:300]}")


def _send_sendgrid(to: str, subject: str, body: str, reply_to: str | None) -> None:
    payload = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": settings.email_from, "name": settings.SMTP_FROM_NAME},
        "subject": subject,
        "content": [{"type": "text/plain", "value": body}],
    }
    if reply_to:
        payload["reply_to"] = {"email": reply_to}
    status, resp = _post_json(
        "https://api.sendgrid.com/v3/mail/send",
        {"Authorization": f"Bearer {settings.SENDGRID_API_KEY}"},
        payload,
    )
    if status not in (200, 201, 202):
        raise RuntimeError(f"SendGrid error {status}: {resp[:300]}")
