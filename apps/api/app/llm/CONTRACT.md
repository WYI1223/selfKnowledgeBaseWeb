# apps/api/llm Contract

## Public surface

- `LLMProvider` (ABC): `stream(messages, *, tools=None, system=None) -> AsyncIterator[dict]`
- `ChatMessage` (Protocol): `{role: str, content: str}`

`stream` yields SSE-shaped event dicts: `{"type": "text" | "tool_use" | "stop", ...}`. Concrete shape per event type will be pinned in Phase 2b alongside the first concrete provider.

## Invariants

- **`apps/api` code MUST NOT** `import anthropic` / `import openai` / similar vendor SDKs directly
- All LLM calls go through an `LLMProvider` instance
- Phase 1 freezes the interface; Phase 2b adds concrete implementations

## Phase 2b implementations

- `AnthropicProvider` (Anthropic Python SDK)
- Future: `OpenAIProvider`, `GeminiProvider`, `LocalProvider` (Ollama/LM Studio)

## Modifying this file

Changing the `stream` signature (parameters or return shape) is a contract break; requires ADR + sync of every concrete provider impl + every agent_bridge call site.

## Related

- [Spec §2.6](../../../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-tools/CONTRACT.md](../../../../packages/agent-tools/CONTRACT.md) (Track F)
- Parent contract [`../CONTRACT.md`](../CONTRACT.md)
