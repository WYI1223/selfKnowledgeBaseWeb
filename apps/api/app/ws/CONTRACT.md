# apps/api/ws Contract

## Public surface

- `WS /v1/ws/` — single endpoint. Wave 1: only `{"type": "ping"}` → `{"type": "pong"}` is meaningful; all other messages are echoed back as `{"type": "echo", "received": <whatever>}`.

## Wire protocol (Wave 1 stub)

~~~json
// client → server
{ "type": "ping" }
{ "type": "<any>", "data": "..." }

// server → client
{ "type": "pong" }
{ "type": "echo", "received": <whatever> }
~~~

All messages are JSON objects with a top-level `type` string field (CONVENTIONS.md §8).

## Phase 2b expansion

Phase 2b upgrades this endpoint to `agent_bridge`: bidirectional JSON-RPC where Custom Tools running in the browser editor can be invoked from the server side, and vice versa. The `type` field convention remains; new types will be added (`tool_call`, `tool_result`, `state_delta`, etc.). Detailed protocol will be defined in the Phase 2b plan.

## Modifying this file

- Adding a new `type` value: backwards-compatible if existing types unchanged; add a test to `tests/test_ws_protocol.py`
- Removing/renaming an existing `type` value: contract break, requires ADR + sync of all clients

## Related

- Spec §2.6 (`../../../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md`)
- Parent contract [`../CONTRACT.md`](../CONTRACT.md)
- [CONVENTIONS.md §8 WebSocket](../../CONVENTIONS.md)
