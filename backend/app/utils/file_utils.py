import os
import uuid
from fastapi import UploadFile

ALLOWED_EXTENSIONS = {".pdf"}
ALLOWED_BATCH_EXTENSIONS = {".pdf", ".zip"}


def validate_pdf(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def validate_batch_upload(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_BATCH_EXTENSIONS


def save_bytes(content: bytes, original_filename: str, dest_dir: str) -> str:
    os.makedirs(dest_dir, exist_ok=True)
    ext = os.path.splitext(original_filename)[1].lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(dest_dir, safe_name)

    with open(dest_path, "wb") as f:
        f.write(content)

    return dest_path


def save_upload_file(upload_file: UploadFile, dest_dir: str) -> str:
    return save_bytes(upload_file.file.read(), upload_file.filename, dest_dir)
