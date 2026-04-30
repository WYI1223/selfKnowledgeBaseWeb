"""Single-user JWT auth per spec §1.2; CONVENTIONS.md §6 (auth) + §1 (/v1) + §5 (errors)."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError

from .errors import AuthFailedError, AuthTokenExpiredError, AuthTokenInvalidError
from .schemas import COMMON_PROBLEM_RESPONSES, LoginRequest, LoginResponse

router = APIRouter(prefix="/v1/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")
_ph = PasswordHasher()

JWT_ALGO = "HS256"
JWT_TTL_HOURS = 12


def _settings() -> tuple[str, str, str]:
    user = os.environ["SKB_USERNAME"]
    pw_hash = os.environ["SKB_PASSWORD_HASH"]
    secret = os.environ["SKB_JWT_SECRET"]
    return user, pw_hash, secret


@router.post("/login", response_model=LoginResponse, responses=COMMON_PROBLEM_RESPONSES)
def login(req: LoginRequest) -> LoginResponse:
    expected_user, expected_hash, secret = _settings()
    if req.username != expected_user:
        raise AuthFailedError("invalid credentials")
    try:
        _ph.verify(expected_hash, req.password)
    except VerifyMismatchError as exc:
        raise AuthFailedError("invalid credentials") from exc
    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_TTL_HOURS)
    payload = {"sub": req.username, "exp": exp}
    token = jwt.encode(payload, secret, algorithm=JWT_ALGO)
    return LoginResponse(access_token=token)


def require_user(token: str = Depends(oauth2_scheme)) -> str:
    expected_user, _, secret = _settings()
    try:
        data = jwt.decode(token, secret, algorithms=[JWT_ALGO])
    except ExpiredSignatureError as exc:
        raise AuthTokenExpiredError("token has expired; please log in again") from exc
    except JWTError as exc:
        raise AuthTokenInvalidError("token is malformed or signature mismatch") from exc
    sub = data.get("sub")
    if not isinstance(sub, str) or sub != expected_user:
        raise AuthTokenInvalidError("token sub mismatch or missing")
    return sub
