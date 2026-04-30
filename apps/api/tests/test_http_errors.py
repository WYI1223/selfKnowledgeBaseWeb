"""Framework-raised HTTPExceptions and unhandled exceptions must follow
CONVENTIONS.md §5 RFC 7807 Problem Details lite shape, AND preserve framework
headers (WWW-Authenticate per RFC 7235, Allow per RFC 7231) — across BOTH the
framework path (http_exception_to_problem_details) and the SkbError path
(skb_error_handler).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.main import create_app


@pytest.fixture
def client_with_boom_route(auth_password_hash: str) -> TestClient:
    """App with an extra route that always raises a non-HTTPException, used to
    verify the Exception → 500 RFC 7807 catch-all handler.
    """
    app = create_app()

    @app.get("/_test/boom")
    def boom() -> None:
        raise RuntimeError("boom")

    return TestClient(app, raise_server_exceptions=False)


def test_unknown_route_returns_problem_details(client: TestClient) -> None:
    resp = client.get("/v1/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/not-found"
    assert body["status"] == 404
    assert body["title"] == "Not Found"
    assert body["detail"]
    assert body["instance"]


def test_method_not_allowed_returns_problem_details(client: TestClient) -> None:
    resp = client.delete("/v1/auth/login")
    assert resp.status_code == 405
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/method-not-allowed"
    assert body["status"] == 405
    assert body["title"] == "Method Not Allowed"


def test_root_path_returns_problem_details(client: TestClient) -> None:
    """Sanity: even the bare `/` 404 (no root route) goes through the handler."""
    resp = client.get("/")
    assert resp.status_code == 404
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/not-found"


def test_legacy_no_v1_prefix_returns_problem_details(client: TestClient) -> None:
    """`/auth/login` (missing /v1 prefix) is a 404 per CONVENTIONS.md §1."""
    resp = client.post("/auth/login", json={"username": "x", "password": "y"})
    assert resp.status_code == 404
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/not-found"


def test_unhandled_exception_returns_500_problem_details(
    client_with_boom_route: TestClient,
) -> None:
    """Bug-class exceptions (RuntimeError etc.) MUST also be RFC 7807."""
    resp = client_with_boom_route.get("/_test/boom")
    assert resp.status_code == 500
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/internal-error"
    assert body["status"] == 500
    assert body["title"] == "Internal error"
    # CONVENTIONS.md §5: detail must NOT leak stack/exception class
    assert "RuntimeError" not in body.get("detail", "")
    assert "boom" not in body.get("detail", "")


def test_missing_token_response_includes_www_authenticate_header(
    client: TestClient,
) -> None:
    """RFC 7235 §3.1: 401 from OAuth2PasswordBearer MUST include WWW-Authenticate."""
    resp = client.get("/v1/pages/sample-mdx-note")
    assert resp.status_code == 401
    assert resp.headers.get("WWW-Authenticate") == "Bearer"
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/auth-token-missing"


def test_method_not_allowed_response_includes_allow_header(client: TestClient) -> None:
    """RFC 7231 §7.4.1: 405 MUST include Allow header listing valid methods."""
    resp = client.delete("/v1/auth/login")
    assert resp.status_code == 405
    allow = resp.headers.get("Allow", "")
    assert "POST" in allow
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/method-not-allowed"


def test_invalid_token_response_includes_www_authenticate_header(
    client: TestClient,
) -> None:
    """RFC 7235 §3.1: AuthTokenInvalidError 401 must include WWW-Authenticate.

    Symmetric to the OAuth2-framework 401 path; emitted by skb_error_handler,
    not http_exception_to_problem_details.
    """
    resp = client.get(
        "/v1/pages/sample",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert resp.status_code == 401
    assert resp.headers.get("WWW-Authenticate") == "Bearer"
    assert resp.json()["type"] == "https://skb.local/errors/auth-token-invalid"


def test_expired_token_response_includes_www_authenticate_header(
    client: TestClient,
) -> None:
    """RFC 7235 §3.1: AuthTokenExpiredError 401 must include WWW-Authenticate."""
    expired = jwt.encode(
        {"sub": "admin", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
        "test-secret-not-for-production",
        algorithm="HS256",
    )
    resp = client.get(
        "/v1/pages/sample",
        headers={"Authorization": f"Bearer {expired}"},
    )
    assert resp.status_code == 401
    assert resp.headers.get("WWW-Authenticate") == "Bearer"
    assert resp.json()["type"] == "https://skb.local/errors/auth-token-expired"


def test_wrong_password_response_includes_www_authenticate_header(
    client: TestClient,
) -> None:
    """RFC 7235 §3.1: AuthFailedError 401 must include WWW-Authenticate."""
    resp = client.post(
        "/v1/auth/login",
        json={"username": "admin", "password": "wrong"},
    )
    assert resp.status_code == 401
    assert resp.headers.get("WWW-Authenticate") == "Bearer"
    assert resp.json()["type"] == "https://skb.local/errors/auth-failed"


def test_openapi_documents_problem_details_for_error_responses(
    client: TestClient,
) -> None:
    """Wave 4 codegen needs error responses typed in OpenAPI per endpoint."""
    spec = client.get("/openapi.json").json()
    for path in ("/v1/auth/login", "/v1/pages/{slug}"):
        for method in spec["paths"][path]:
            responses = spec["paths"][path][method]["responses"]
            for code in ("401", "404", "422", "500"):
                assert code in responses, (
                    f"{method.upper()} {path} missing {code} in OpenAPI responses"
                )
                schema = responses[code]["content"]["application/json"]["schema"]
                ref = schema.get("$ref", "")
                assert ref.endswith("/ProblemDetails"), (
                    f"{method.upper()} {path} {code} response not typed as "
                    f"ProblemDetails (got: {schema})"
                )
