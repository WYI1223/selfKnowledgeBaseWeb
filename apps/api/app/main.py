"""FastAPI app factory. Single instance lives in apps/api at runtime."""
from __future__ import annotations

from http import HTTPStatus

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from .auth import router as auth_router
from .errors import SkbError, skb_error_handler
from .pages import router as pages_router
from .ws import router as ws_router

# Per-status RFC 7807 `type` URI map (CONVENTIONS.md §5).
# OAuth2PasswordBearer raises HTTPException(401) for missing tokens, so 401
# maps to auth-token-missing (matches CONVENTIONS.md §5 enumerated list).
_HTTP_STATUS_TYPE_URI: dict[int, str] = {
    401: "https://skb.local/errors/auth-token-missing",
    404: "https://skb.local/errors/not-found",
    405: "https://skb.local/errors/method-not-allowed",
}
_HTTP_DEFAULT_TYPE_URI = "https://skb.local/errors/http-error"


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Map Pydantic validation 422 to RFC 7807 lite (CONVENTIONS.md §5)."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "type": "https://skb.local/errors/validation-error",
            "title": "Validation error",
            "detail": "request body did not match expected schema",
            "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "instance": str(request.url),
            "errors": exc.errors(),
        },
    )


async def http_exception_to_problem_details(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """Render every framework-raised HTTPException as RFC 7807 (CONVENTIONS.md §5).

    Catches Starlette/FastAPI built-in cases (404 unknown route, 405 method
    mismatch, 401 missing Bearer token from OAuth2PasswordBearer, etc.).
    Domain errors raised by app code use SkbError + skb_error_handler instead.

    Preserves framework-set headers (WWW-Authenticate on 401 per RFC 7235 §3.1,
    Allow on 405 per RFC 7231 §7.4.1).
    """
    type_uri = _HTTP_STATUS_TYPE_URI.get(exc.status_code, _HTTP_DEFAULT_TYPE_URI)
    title = HTTPStatus(exc.status_code).phrase
    detail = str(exc.detail) if exc.detail else title
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": type_uri,
            "title": title,
            "detail": detail,
            "status": exc.status_code,
            "instance": str(request.url),
        },
        headers=exc.headers,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all 500 handler. Ensures CONVENTIONS.md §5 holds for ALL 4xx/5xx,
    not just framework- or app-raised structured errors.

    Detail is intentionally generic — no stack/exception class leak per
    CONVENTIONS.md §5 ("不暴露栈"). Server log keeps full trace.
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "https://skb.local/errors/internal-error",
            "title": "Internal error",
            "detail": "An unexpected error occurred",
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "instance": str(request.url),
        },
    )


def create_app() -> FastAPI:
    app = FastAPI(title="skb-api", version="0.0.0")
    # Starlette's add_exception_handler signature is invariant in the exception
    # type; passing concrete Exception subclasses is the documented FastAPI
    # pattern, so we silence the type check.
    app.add_exception_handler(SkbError, skb_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(HTTPException, http_exception_to_problem_details)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)
    app.include_router(auth_router)
    app.include_router(pages_router)
    app.include_router(ws_router)
    return app


app = create_app()
