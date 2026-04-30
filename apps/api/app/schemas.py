"""Pydantic schemas; openapi-typescript derives TS types from these.

Per CONVENTIONS.md §4: JSON body camelCase via alias_generator=to_camel.
populate_by_name=True lets clients send snake_case or camelCase.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    """Base model with camelCase JSON aliasing per CONVENTIONS.md §4."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


# ===== Auth =====


class LoginRequest(_CamelModel):
    username: str
    password: str


class LoginResponse(_CamelModel):
    access_token: str
    token_type: str = "bearer"


# ===== Pages =====


class PageWriteRequest(_CamelModel):
    """Full-replacement write per CONVENTIONS.md §2 (PUT semantics)."""

    content: str = Field(..., description="full MDX body, frontmatter included")
    commit_message: str | None = None


class PageReadResponse(_CamelModel):
    slug: str
    content: str
    last_modified: datetime


class PageWriteResponse(_CamelModel):
    """Returned by PUT /v1/pages/{slug}; status 200 (replace) or 201 (create)."""

    slug: str
    last_modified: datetime
    commit_sha: str | None = None


# ===== RFC 7807 Problem Details lite (CONVENTIONS.md §5) =====


class ProblemDetails(_CamelModel):
    type: str
    title: str
    detail: str
    status: int
    instance: str | None = None
    errors: list[dict] | None = None


# Reusable OpenAPI `responses=` block so every protected endpoint documents its
# RFC 7807 error variants. Wave 4 codegen for packages/api-client uses this to
# emit typed error parsing on the TS side.
COMMON_PROBLEM_RESPONSES: dict[int | str, dict] = {
    400: {"model": ProblemDetails, "description": "Validation or path-traversal error"},
    401: {"model": ProblemDetails, "description": "Missing or invalid bearer token"},
    404: {"model": ProblemDetails, "description": "Resource not found"},
    422: {"model": ProblemDetails, "description": "Request body validation error"},
    500: {"model": ProblemDetails, "description": "Internal error"},
}
