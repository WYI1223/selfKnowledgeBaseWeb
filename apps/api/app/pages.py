"""Page CRUD per CONVENTIONS.md.

Resource: page = MDX file at content/notes/{slug}/index.mdx.
Endpoint: GET/PUT /v1/pages/{slug} (Wave 1: GET + PUT only; DELETE in Phase 2/2b).
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, Response, status

from .auth import require_user
from .errors import PageNotFoundError, PathTraversalBlockedError
from .schemas import (
    COMMON_PROBLEM_RESPONSES,
    PageReadResponse,
    PageWriteRequest,
    PageWriteResponse,
)

router = APIRouter(prefix="/v1/pages", tags=["pages"])

CONTENT_ROOT = Path(__file__).resolve().parents[3] / "content" / "notes"
SLUG_PATTERN = re.compile(r"^[a-z0-9-]+$")


def _safe_slug_path(slug: str) -> Path:
    """Validate slug + return absolute path to its index.mdx (CONVENTIONS.md §1)."""
    if not SLUG_PATTERN.match(slug):
        raise PathTraversalBlockedError(
            f"slug must match [a-z0-9-]+ ; got {slug!r}"
        )
    target = (CONTENT_ROOT / slug / "index.mdx").resolve()
    root = CONTENT_ROOT.resolve()
    if root not in target.parents:
        raise PathTraversalBlockedError("slug escapes content/notes/ root")
    return target


@router.get("/{slug}", response_model=PageReadResponse, responses=COMMON_PROBLEM_RESPONSES)
def read_page(slug: str, _user: str = Depends(require_user)) -> PageReadResponse:
    target = _safe_slug_path(slug)
    if not target.is_file():
        raise PageNotFoundError(f"page {slug!r} does not exist")
    return PageReadResponse(
        slug=slug,
        content=target.read_text(encoding="utf-8"),
        last_modified=datetime.fromtimestamp(target.stat().st_mtime, tz=timezone.utc),
    )


@router.put(
    "/{slug}",
    response_model=PageWriteResponse,
    responses={
        201: {"model": PageWriteResponse, "description": "New page created"},
        **COMMON_PROBLEM_RESPONSES,
    },
)
def replace_page(
    slug: str,
    body: PageWriteRequest,
    response: Response,
    _user: str = Depends(require_user),
) -> PageWriteResponse:
    """PUT covers create + replace (CONVENTIONS.md §2).

    Create returns 201 + Location header; replace returns 200.
    """
    target = _safe_slug_path(slug)
    is_new = not target.exists()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(body.content, encoding="utf-8")
    if is_new:
        response.status_code = status.HTTP_201_CREATED
        response.headers["Location"] = f"/v1/pages/{slug}"
    return PageWriteResponse(
        slug=slug,
        last_modified=datetime.fromtimestamp(target.stat().st_mtime, tz=timezone.utc),
        commit_sha=None,
    )
