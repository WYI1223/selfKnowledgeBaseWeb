"""Shared pytest fixtures."""
from __future__ import annotations

import pytest
from argon2 import PasswordHasher
from fastapi.testclient import TestClient

from app import pages as pages_mod
from app.main import create_app


@pytest.fixture
def auth_password_hash(monkeypatch: pytest.MonkeyPatch) -> str:
    """Set up test admin/password env + return hash."""
    ph = PasswordHasher()
    h = ph.hash("secret")
    monkeypatch.setenv("SKB_USERNAME", "admin")
    monkeypatch.setenv("SKB_PASSWORD_HASH", h)
    monkeypatch.setenv("SKB_JWT_SECRET", "test-secret-not-for-production")
    return h


@pytest.fixture
def client(auth_password_hash: str) -> TestClient:
    return TestClient(create_app())


@pytest.fixture
def auth_token(client: TestClient) -> str:
    resp = client.post(
        "/v1/auth/login",
        json={"username": "admin", "password": "secret"},
    )
    assert resp.status_code == 200
    return resp.json()["accessToken"]


@pytest.fixture
def authed_client(client: TestClient, auth_token: str) -> TestClient:
    client.headers["Authorization"] = f"Bearer {auth_token}"
    return client


@pytest.fixture
def temp_content_root(tmp_path, monkeypatch: pytest.MonkeyPatch):
    """Redirect pages.CONTENT_ROOT to a tmp dir for isolated CRUD tests."""
    notes_root = tmp_path / "content" / "notes"
    notes_root.mkdir(parents=True)
    monkeypatch.setattr(pages_mod, "CONTENT_ROOT", notes_root)
    return notes_root
