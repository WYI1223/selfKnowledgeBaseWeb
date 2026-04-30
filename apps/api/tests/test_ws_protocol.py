"""WS endpoint smoke tests (Wave 1 ping/pong + echo) + protocol-error
robustness for non-object / malformed frames per CONVENTIONS.md §8.
"""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_ws_ping_pong(client: TestClient) -> None:
    with client.websocket_connect("/v1/ws/") as ws:
        ws.send_json({"type": "ping"})
        msg = ws.receive_json()
        assert msg == {"type": "pong"}


def test_ws_echo_for_unknown_type(client: TestClient) -> None:
    with client.websocket_connect("/v1/ws/") as ws:
        payload = {"type": "agent_call", "data": "future-protocol"}
        ws.send_json(payload)
        msg = ws.receive_json()
        assert msg == {"type": "echo", "received": payload}


def test_ws_rejects_non_object_array_frame(client: TestClient) -> None:
    """Array JSON is valid JSON but not a {type: ...} object — must NOT crash."""
    with client.websocket_connect("/v1/ws/") as ws:
        ws.send_json([1, 2, 3])
        msg = ws.receive_json()
        assert msg["type"] == "error"
        assert "object" in msg["detail"].lower()
        # Connection still alive: ping must still work afterwards.
        ws.send_json({"type": "ping"})
        assert ws.receive_json() == {"type": "pong"}


def test_ws_rejects_non_object_scalar_frame(client: TestClient) -> None:
    with client.websocket_connect("/v1/ws/") as ws:
        ws.send_json("hello")
        msg = ws.receive_json()
        assert msg["type"] == "error"


def test_ws_rejects_non_object_null_frame(client: TestClient) -> None:
    with client.websocket_connect("/v1/ws/") as ws:
        ws.send_json(None)
        msg = ws.receive_json()
        assert msg["type"] == "error"


def test_ws_rejects_malformed_json(client: TestClient) -> None:
    """Garbage bytes must not crash the connection."""
    with client.websocket_connect("/v1/ws/") as ws:
        ws.send_text("not-json {{{")
        msg = ws.receive_json()
        assert msg["type"] == "error"
        assert "json" in msg["detail"].lower()
