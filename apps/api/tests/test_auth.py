"""Single-user password + JWT auth (spec §1.2 + CONVENTIONS.md §1/§4/§5/§6)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt


def test_login_with_correct_password_returns_jwt(client: TestClient) -> None:
    resp = client.post("/v1/auth/login", json={"username": "admin", "password": "secret"})
    assert resp.status_code == 200
    body = resp.json()
    assert "accessToken" in body and len(body["accessToken"]) > 20
    assert body["tokenType"] == "bearer"


def test_login_with_wrong_password_returns_401_problem_details(client: TestClient) -> None:
    resp = client.post("/v1/auth/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401
    body = resp.json()
    assert body["type"].startswith("https://skb.local/errors/")
    assert body["type"] == "https://skb.local/errors/auth-failed"
    assert body["title"]
    assert body["status"] == 401


def test_login_with_unknown_username_returns_401_problem_details(client: TestClient) -> None:
    resp = client.post("/v1/auth/login", json={"username": "nobody", "password": "secret"})
    assert resp.status_code == 401
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/auth-failed"


def test_protected_endpoint_requires_token(client: TestClient) -> None:
    resp = client.get("/v1/pages/sample-mdx-note")
    assert resp.status_code == 401
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/auth-token-missing"
    assert body["status"] == 401


def test_protected_endpoint_rejects_invalid_token(client: TestClient) -> None:
    resp = client.get(
        "/v1/pages/sample-mdx-note",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert resp.status_code == 401
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/auth-token-invalid"


def test_login_validation_error_returns_problem_details(client: TestClient) -> None:
    resp = client.post("/v1/auth/login", json={"username": "admin"})
    assert resp.status_code == 422
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/validation-error"
    assert body["status"] == 422
    assert isinstance(body.get("errors"), list)


def test_token_with_wrong_sub_rejected(client: TestClient) -> None:
    """Defense-in-depth: signed-but-wrong-sub token must be rejected.

    Single-user contract: only the user named SKB_USERNAME may authenticate.
    A token signed with the right secret but bearing a different `sub` must
    NOT authenticate.
    """
    forged = jwt.encode(
        {
            "sub": "alice",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        "test-secret-not-for-production",
        algorithm="HS256",
    )
    resp = client.get(
        "/v1/pages/sample-mdx-note",
        headers={"Authorization": f"Bearer {forged}"},
    )
    assert resp.status_code == 401
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/auth-token-invalid"


def test_token_with_missing_sub_rejected(client: TestClient) -> None:
    """A signed token with no `sub` claim must be rejected."""
    forged = jwt.encode(
        {"exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        "test-secret-not-for-production",
        algorithm="HS256",
    )
    resp = client.get(
        "/v1/pages/sample-mdx-note",
        headers={"Authorization": f"Bearer {forged}"},
    )
    assert resp.status_code == 401
    body = resp.json()
    assert body["type"] == "https://skb.local/errors/auth-token-invalid"
