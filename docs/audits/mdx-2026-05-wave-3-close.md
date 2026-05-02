# MDX audit — Wave 3 close (2026-05-02)

> codex-mdx-doctor audit dispatched per ADR-0013 close ceremony. Audit
> log: `/tmp/codex-runs/2026-05-02-wave-3-close-mdx.txt` (1.16 MB, kept
> off-tree per memory `feedback_codex_audit_log_recursion.md`). This
> file = orchestrator-curated summary of codex findings.

## Findings

### 1. content/notes/ round-trip verification

| File | RTT byte-equivalence | RTT semantic-equivalence |
|---|---|---|
| `sample-mdx-note/index.mdx` | **FAIL** (list bullets `-` → `*` normalization in serializer) | PASS |
| `__test_cjk__/zh-note/index.mdx` | PASS | PASS |
| `__test_cjk__/laptop/index.mdx` | PASS | PASS |
| `sample-blocks/index.mdx` | **PARSE ERROR** (`mdx-bridge: unsupported block type "mdxFlowExpression"`) | N/A |

**Wave 4 carry-over**: `sample-blocks/index.mdx` contains MDX JSX comment blocks (`{/* ... */}`) that the mdx-bridge parser doesn't recognize. This was masked during Wave 3 because apps/site uses Astro/MDX-compiler at build time, not mdx-bridge round-trip. Add to Wave 4 ADR-0014 candidate scope OR a new Wave 4 mdx-bridge follow-up: extend mdx-bridge to either (a) drop `mdxFlowExpression` nodes during parse OR (b) round-trip them as opaque text blocks.

The list-bullet normalization (`sample-mdx-note`) is a known mdx-bridge canonicalization rule (B-stage codified in `packages/mdx-bridge/CONTRACT.md` §"Canonicalization rules"); not a Wave 3 regression.

### 2. mdx-bridge fixture set

✅ Stage B fixtures `22-callout.mdx` … `29-agent-flow.mdx` all present (1 minimum per block × 8 blocks). Structurally complete.

### 3. Dispatch table + test helper coverage

✅ `packages/mdx-bridge/src/__tests__/round-trip.test.ts` defines all 8 `ensure<X>Dispatch` helpers (Callout/Code/Image/Math/Pdf/Jupyter/NnViz/AgentFlow), all invoked in `beforeAll`. Dispatch-table API shape consistent with `dispatch-table.ts` post-B1 implementation.

### 4. CONTRACT.md canonicalization section

✅ Matches current serializer behavior. Stage B prose codification (B2 Canonicalization rules section) survives Wave 3 unchanged.

### 5. sample-blocks fixture state

✅ `content/notes/sample-blocks/index.mdx` remains `draft: false` (C3-set) and references all 8 block names (Callout / Code / Image / Math / Pdf / Jupyter / NnViz / AgentFlow). This is the canonical apps/site smoke fixture for Stage C validation.

## Wave 4 follow-ups (binding)

- **(a)** Extend mdx-bridge parser to handle `mdxFlowExpression` (JSX comment blocks) — sample-blocks RTT-fail blocking. Gate with a regression test fixture under `packages/mdx-bridge/src/__tests__/fixtures/`.
- **(b)** Document the `-` → `*` list-bullet normalization more prominently in mdx-bridge CONTRACT (currently buried in canonicalization section). Wave 1 / Wave 2 corpus uses `-`; mdx-bridge persists `*`. Some content authors may need to be aware.

## Audit dispatch metadata

- Profile: `codex-mdx-doctor`
- Dispatched: 2026-05-02 (Wave 3 close ceremony, ADR-0013)
- Off-tree raw audit log: `/tmp/codex-runs/2026-05-02-wave-3-close-mdx.txt` (1.16 MB; not committed)
- Codex tokens: 103,325
