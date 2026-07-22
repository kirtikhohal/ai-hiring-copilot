from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db import crud
from app.utils.security import decode_access_token

# auto_error=False so we can return our own 401 message instead of the
# default "Not authenticated" when the header is missing.
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    user = crud.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists.")
    return user
