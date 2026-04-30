"""Global RFC 7807 Problem Details error handlers (CONVENTIONS.md §5)."""
from __future__ import annotations

from http import HTTPStatus

from fastapi import Request
from fastapi.responses import JSONResponse


class SkbError(Exception):
    status_code: int = 500
    error_type: str = "https://skb.local/errors/internal-error"
    title: str = "Internal error"

    def __init__(self, detail: str = "") -> None:
        self.detail = detail
        super().__init__(detail)


class AuthFailedError(SkbError):
    status_code = 401
    error_type = "https://skb.local/errors/auth-failed"
    title = "Authentication failed"


class AuthTokenExpiredError(SkbError):
    status_code = 401
    error_type = "https://skb.local/errors/auth-token-expired"
    title = "Token expired"


class AuthTokenInvalidError(SkbError):
    status_code = 401
    error_type = "https://skb.local/errors/auth-token-invalid"
    title = "Token invalid"


class PageNotFoundError(SkbError):
    status_code = 404
    error_type = "https://skb.local/errors/page-not-found"
    title = "Page not found"


class PathTraversalBlockedError(SkbError):
    status_code = 400
    error_type = "https://skb.local/errors/path-traversal-blocked"
    title = "Path traversal blocked"


async def skb_error_handler(request: Request, exc: SkbError) -> JSONResponse:
    # RFC 7235 §3.1: every 401 response (regardless of which handler emits it)
    # MUST include WWW-Authenticate. Symmetric to http_exception_to_problem_details
    # in main.py — the framework path forwards exc.headers, but SkbError 401s
    # (auth-failed / auth-token-invalid / auth-token-expired) build the response
    # from class attributes, so we set the header explicitly here.
    headers: dict[str, str] | None = None
    if exc.status_code == HTTPStatus.UNAUTHORIZED:
        headers = {"WWW-Authenticate": "Bearer"}
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": exc.error_type,
            "title": exc.title,
            "detail": exc.detail,
            "status": exc.status_code,
            "instance": str(request.url),
        },
        headers=headers,
    )
