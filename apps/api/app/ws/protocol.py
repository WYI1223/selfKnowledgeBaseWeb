"""WebSocket protocol endpoint. Wave 1: handshake + ping/pong + echo only.

Spec §2.6 mandatory item #3: build the channel + protocol skeleton now;
Phase 2b implements agent_bridge bidirectional tool calls on top.

All inbound messages MUST be JSON objects with a top-level `type` string field
(CONVENTIONS.md §8). Non-object frames or malformed JSON receive a structured
error reply rather than crashing the connection.
"""
from __future__ import annotations

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/v1/ws", tags=["ws"])


@router.websocket("/")
async def ws_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json(
                    {"type": "error", "detail": "invalid JSON frame"}
                )
                continue
            if not isinstance(msg, dict):
                await websocket.send_json(
                    {"type": "error", "detail": "expected JSON object with 'type' field"}
                )
                continue
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                await websocket.send_json({"type": "echo", "received": msg})
    except WebSocketDisconnect:
        pass
