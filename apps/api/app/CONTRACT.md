# apps/api Contract

## Public surface

- `POST /v1/auth/login` — single-user password login, returns JWT (12h TTL)
- `GET /v1/pages/{slug}` — read page MDX content (slug `[a-z0-9-]+`)
- `PUT /v1/pages/{slug}` — create or replace page; create returns 201 + `Location`, replace returns 200
- `WS /v1/ws/` — Wave 1 stub (ping/pong + echo); Wave 2b implements agent_bridge

Detailed constraints (HTTP methods / status codes / JSON shape / error format) live in [CONVENTIONS.md](../CONVENTIONS.md).

## Invariants

- Single user: `SKB_USERNAME` / `SKB_PASSWORD_HASH` / `SKB_JWT_SECRET` come from env, no registration flow
- Slug character set strictly `[a-z0-9-]+` — enforced by `_safe_slug_path`, blocks `..` and `/`
- Resource mapping: page slug `transformer-attention` → file `content/notes/transformer-attention/index.mdx`
- JWT TTL 12h; secret in env, never committed
- **JSON bodies are camelCase** (CONVENTIONS.md §4) via Pydantic `alias_generator=to_camel`
- **Errors uniformly RFC 7807 Problem Details lite shape** (CONVENTIONS.md §5) via global `SkbError` handler
- LLM access goes through the `LLMProvider` ABC only — no direct `import anthropic` etc. (see [llm/CONTRACT.md](llm/CONTRACT.md))

## Modifying this file

- Add endpoint: extend `schemas.py` + add tests + strictly follow [CONVENTIONS.md](../CONVENTIONS.md); this file + OpenAPI auto-sync
- Change auth flow: contract break, requires ADR + sync site auth-client
- Violating CONVENTIONS.md (hardcoded snake_case fields, missing /v1 prefix, raw HTTPException error shape) is a pr-gate reject

## Related

- Spec §1.1 / §2.6 (`../../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md`)
- API constraint contract (`../CONVENTIONS.md`)
- ADR-0005 ratify (`../../../docs/decisions/ADR-0005-api-conventions.md`)
- [ws/CONTRACT.md](ws/CONTRACT.md)
- [llm/CONTRACT.md](llm/CONTRACT.md)
