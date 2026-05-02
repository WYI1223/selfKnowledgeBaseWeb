# Structure audit — Wave 3 close (2026-05-02)

> codex-structure-auditor audit dispatched per ADR-0013 close ceremony.
> Audit log: `/tmp/codex-runs/2026-05-02-wave-3-close-structure.txt`
> (kept off-tree per memory `feedback_codex_audit_log_recursion.md`).
> This file = orchestrator-curated summary of codex findings. Codex's
> attempt to write the file directly was blocked by sandbox read-only
> at the audit-time of dispatch.

## Findings

### 1. ADR-0008 D1 dead-dep violations

✅ **0 violations** at HEAD `4deb5cb` (down from 2 at the structure-2026-05.md baseline). Wave 3 prep PR #2 (block-code + block-image typed THEME_TOKENS via theme-tokens.ts importing ColorTokenName) closed F3.

Programmatic verification (codex auditor):
```
TOTAL_VIOLATIONS 0
```
across all 21 packages.

### 2. New cross-package single-authority invariants (Wave 3 additions)

| # | Invariant | Authority | Consumer |
|---|---|---|---|
| W3-1 | mdx-bridge JSX dispatch via `registerJsxDispatch` + `getJsxDispatch` (option (b) per block-foundation/CONTRACT.md:28 forbidding parseMdx hooks) | `packages/mdx-bridge/src/dispatch-table.ts` | 8 block packages register at `beforeAll` in tests + apps/editor production composition |
| W3-2 | ADR-0012 search index acceptance criteria 1-5 (bundle ≤120k / index ≤300k / reindex on update / CJK regression / astro-pagefind ≥1.8.6) | `docs/decisions/ADR-0012-search-index-stack.md` | apps/site/CONTRACT.md `## Search index` section + apps/site source surface |
| W3-3 | `@skb/editor-shell` Stage 3 composition authority (registerBlocks + registerKernels + saveLoad wiring) | `packages/editor-shell/src/{registerBlocks,registerKernels,saveLoad}.ts` | apps/editor + apps/site composition; tests verify cast asymmetry + adapter defaults |

### 3. apps/site src tree stability

✅ Clean. Wave 3 additions:
- `src/components/SearchBox.astro` (D3) — SSR-safe mount + lazy script
- `src/pages/search.astro` (D3) — uses BaseLayout
- `src/components.ts` (C1+C3) — adapter wrappers + heavy-block placeholders
- `src/__tests__/search-cjk.test.ts` + `search-reindex.test.ts` (D2) — CJK structural + reindex regression
- `src/__tests__/search-ui.test.ts` (D3) — built HTML markup verification
- `src/types/pagefind-default-ui.d.ts` (D3) — type stub for transitive default-ui import

Heavy blocks (Jupyter/NnViz/AgentFlow) intentionally remain SSR placeholders with `data-deferred="wave-4"` attribute per ADR-0014 candidate scope.

### 4. packages/* tree

✅ 21 packages at HEAD `4deb5cb`; **no rename / move / split during Wave 3** (integration-only wave; refactorer subagent not dispatched). Additive changes confined to:
- `packages/mdx-bridge/src/dispatch-table.ts` (B1 NEW)
- `packages/mdx-bridge/src/__tests__/fixtures/22-callout..29-agent-flow.mdx` (B2-B8 NEW × 8)
- `packages/mdx-bridge/CONTRACT.md` `## Canonicalization rules` section (B2)
- `packages/editor-shell/` Stage A scaffold + 4 source files

### 5. docs/decisions/ ADR roster

13 ADR files (ADR-0001..ADR-0013) at HEAD `4deb5cb`. **`docs/decisions/README.md` index is stale** (stops at ADR-0010). Wave 4 follow-up: refresh README index to include ADR-0011, ADR-0012, ADR-0013. (Small docs PR; not blocking Wave 4 scope.)

### 6. content/notes/__test_cjk__ fixtures

⚠️ With `draft: false`, the 2 CJK test fixtures (`zh-note/` + `laptop/`) enter the production content collection at build time. PageFind's `astro build` post-hook indexes them; they appear in dist/notes/__test_cjk__/. This is **acceptable for Wave 3** because:
- Tests REQUIRE indexed CJK content for the playwright spec to exercise (D3 TC3a positive + the dropped TC3b inverse)
- `__test_cjk__` prefix marks them clearly as test-only
- They're CJK-only (visually distinct from English content)

**Wave 4 cleanup recommendation**: move test fixtures out of `content/notes/` (e.g., `apps/site/test-fixtures/cjk/` symlinked into `content/notes/__test_cjk__/` only during test runs OR a build-time content-collection filter for `draft: __test_*`). Document in ADR-0014 candidate scope OR a small Wave 4 follow-up PR.

## Wave 4 follow-ups (binding)

- **(a)** docs/decisions/README.md index refresh (small docs PR, ~10 LOC)
- **(b)** content/notes/__test_cjk__ relocation OR build-time content-collection filter (small Wave 4 PR)

## Audit dispatch metadata

- Profile: `codex-structure-auditor`
- Dispatched: 2026-05-02 (Wave 3 close ceremony, ADR-0013)
- Off-tree raw audit log: `/tmp/codex-runs/2026-05-02-wave-3-close-structure.txt` (codex attempted to write `docs/audits/structure-2026-05-wave-3-close.md` directly but sandbox read-only blocked the write; orchestrator transcribed findings from the codex stdout summary into this file)
- Codex tokens: 187,526
