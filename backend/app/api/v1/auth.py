import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.api.deps import get_current_user
from app.config import settings
from app.db import crud
from app.models.schemas import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserPublic,
    ProfileUpdateRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)
from app.utils.file_utils import save_bytes
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_reset_token,
    decode_reset_token,
)
from app.utils.email_sender import send_email

router = APIRouter()

AVATAR_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
AVATAR_SUBDIR = os.path.join(settings.UPLOAD_DIR, "avatars")


def _to_public(user: dict) -> UserPublic:
    return UserPublic(
        id=user["id"],
        full_name=user.get("full_name", ""),
        username=user["username"],
        email=user["email"],
        position=user.get("position", ""),
        org=user.get("org") or "",
        org_city=user.get("org_city") or "",
        org_country=user.get("org_country") or "",
        avatar_url=user.get("avatar_url"),
    )


@router.post("/register", response_model=UserPublic)
def register(req: RegisterRequest):
    """Creates the account and returns it. Does NOT issue a token — the user
    signs in afterwards via /login."""
    if crud.get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    if crud.get_user_by_username(req.username):
        raise HTTPException(status_code=409, detail="That username is already taken.")

    user = crud.create_user(
        full_name=req.full_name.strip(),
        username=req.username.strip(),
        email=req.email.strip().lower(),
        position=req.position,
        org=req.org_name.strip(),
        org_city=req.org_city.strip(),
        org_country=req.org_country.strip(),
        password_hash=hash_password(req.password),
    )
    return _to_public(user)


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    user = crud.get_user_by_identifier(req.identifier.strip())
    # Same generic error whether the account is missing or the password is
    # wrong — don't reveal which accounts exist.
    if user is None or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email/username or password.")
    token = create_access_token(user["id"])
    return AuthResponse(token=token, user=_to_public(user))


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest):
    # Always return the same message regardless of whether the account exists,
    # so this endpoint can't be used to enumerate registered emails.
    generic = MessageResponse(
        message="If an account exists for that email, a reset link has been sent."
    )
    email = req.email.strip().lower()
    user = crud.get_user_by_email(email)
    if user:
        token = create_reset_token(user["id"])
        link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
        body = (
            f"Hi {user.get('full_name') or 'there'},\n\n"
            "We received a request to reset your Hazel password. Use the link "
            "below to choose a new one — it expires in 30 minutes.\n\n"
            f"{link}\n\n"
            "If you didn't request this, you can safely ignore this email.\n\n"
            "— Hazel Hiring Copilot"
        )
        try:
            send_email(email, "Reset your Hazel password", body)
        except Exception as e:  # never leak send failures to the caller
            print(f"[auth.forgot_password] email send failed: {e!r}")
    return generic


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest):
    user_id = decode_reset_token(req.token)
    if not user_id or crud.get_user_by_id(user_id) is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    crud.update_user(user_id, {"password_hash": hash_password(req.password)})
    return MessageResponse(message="Your password has been reset. You can now sign in.")


@router.get("/me", response_model=UserPublic)
def me(current_user: dict = Depends(get_current_user)):
    return _to_public(current_user)


@router.post("/avatar", response_model=UserPublic)
async def upload_avatar(
    file: UploadFile = File(...), current_user: dict = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in AVATAR_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Avatar must be a PNG, JPG, WEBP, or GIF image.",
        )
    saved_path = save_bytes(await file.read(), file.filename, AVATAR_SUBDIR)
    # Public URL served by the StaticFiles mount in main.py.
    avatar_url = "/uploads/avatars/" + os.path.basename(saved_path)
    user = crud.update_user(current_user["id"], {"avatar_url": avatar_url})
    return _to_public(user)


@router.patch("/profile", response_model=UserPublic)
def update_profile(
    req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)
):
    updates: dict = {}

    if req.username is not None and req.username.strip() != current_user["username"]:
        if crud.get_user_by_username(req.username.strip()):
            raise HTTPException(status_code=409, detail="That username is already taken.")
        updates["username"] = req.username.strip()

    if req.email is not None and req.email.strip().lower() != current_user["email"]:
        if crud.get_user_by_email(req.email.strip().lower()):
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        updates["email"] = req.email.strip().lower()

    if req.full_name is not None:
        updates["full_name"] = req.full_name.strip()
    if req.position is not None:
        updates["position"] = req.position
    if req.org is not None:
        updates["org"] = req.org.strip()
    if req.org_city is not None:
        updates["org_city"] = req.org_city.strip()
    if req.org_country is not None:
        updates["org_country"] = req.org_country.strip()

    if not updates:
        return _to_public(current_user)

    user = crud.update_user(current_user["id"], updates)
    return _to_public(user)
