"""Pages CRUD: /v1 prefix, camelCase, RFC 7807 errors, 201+Location, slug-safe."""
from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient


def test_get_existing_page_returns_camel_case_body(
    authed_client: TestClient, temp_content_root: Path
) -> None:
    page_dir = temp_content_root / "transformer-attention"
    page_dir.mkdir()
    (page_dir / "index.mdx").write_text("# Hello\n", encoding="utf-8")

    resp = authed_client.get("/v1/pages/transformer-attention")
    assert resp.status_code == 200
    body = resp.json()
    assert body["slug"] == "transformer-attention"
    assert body["content"] == "# Hello\n"
    assert "lastModified" in body
    assert "last_modified" not in body  # camelCase only


def test_get_missing_page_returns_404_problem_details(
    authed_client: TestClient, temp_content_root: Path
) -> None:
    resp = authed_client.get("/v1/pages/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/page-not-found"
    assert body["status"] == 404


def test_put_creates_new_page_returns_201_with_location(
    authed_client: TestClient, temp_content_root: Path
) -> None:
    resp = authed_client.put(
        "/v1/pages/new-page",
        json={"content": "---\ntitle: New\n---\n\nbody\n"},
    )
    assert resp.status_code == 201
    assert resp.headers["Location"] == "/v1/pages/new-page"
    body = resp.json()
    assert body["slug"] == "new-page"
    assert body["commitSha"] is None
    assert (temp_content_root / "new-page" / "index.mdx").read_text() == \
        "---\ntitle: New\n---\n\nbody\n"


def test_put_replaces_existing_page_returns_200(
    authed_client: TestClient, temp_content_root: Path
) -> None:
    page_dir = temp_content_root / "existing"
    page_dir.mkdir()
    (page_dir / "index.mdx").write_text("old\n", encoding="utf-8")

    resp = authed_client.put("/v1/pages/existing", json={"content": "new\n"})
    assert resp.status_code == 200
    assert "Location" not in resp.headers
    assert (page_dir / "index.mdx").read_text() == "new\n"


def test_invalid_slug_returns_400_problem_details(
    authed_client: TestClient, temp_content_root: Path
) -> None:
    resp = authed_client.get("/v1/pages/Has_Underscore")
    assert resp.status_code == 400
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/path-traversal-blocked"


def test_put_validation_error_returns_problem_details(
    authed_client: TestClient, temp_content_root: Path
) -> None:
    resp = authed_client.put("/v1/pages/some-slug", json={})
    assert resp.status_code == 422
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/validation-error"
    assert isinstance(body.get("errors"), list)


def test_put_accepts_camel_case_commit_message(
    authed_client: TestClient, temp_content_root: Path
) -> None:
    resp = authed_client.put(
        "/v1/pages/with-message",
        json={"content": "x\n", "commitMessage": "initial"},
    )
    assert resp.status_code == 201


def test_put_accepts_snake_case_commit_message_via_populate_by_name(
    authed_client: TestClient, temp_content_root: Path
) -> None:
    """populate_by_name=True (CONVENTIONS.md §4): snake_case input also accepted."""
    resp = authed_client.put(
        "/v1/pages/with-snake",
        json={"content": "x\n", "commit_message": "initial"},
    )
    assert resp.status_code == 201
