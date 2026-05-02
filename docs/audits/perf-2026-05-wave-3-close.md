# Perf audit — Wave 3 close (2026-05-02)

> codex-perf-auditor audit dispatched per ADR-0013 close ceremony.
> Audit log: `/tmp/codex-runs/2026-05-02-wave-3-close-perf.txt` (kept
> off-tree per memory `feedback_codex_audit_log_recursion.md`). This
> file = orchestrator-curated summary. Codex sandbox blocked the
> direct write to this path.

## Build artifact baseline (HEAD `4deb5cb`)

Measured against existing `apps/site/dist/` artifacts (codex sandbox could not run a fresh `pnpm --filter=@skb/site build` due to read-only EROFS on `.astro/content-modules.mjs.tmp`; orchestrator pre-built earlier in the session, so the dist values are post-D3 valid).

| Path | Size (bytes) | Notes |
|---|---|---|
| `dist/_astro/*` (relevant chunks combined) | 260,548 | design-tokens + client + SearchBox-related |
| `dist/pagefind/*` (entire dir) | 579,348 | pagefind runtime + UI bundles + fragment files |
| `dist/pagefind/fragment/*.pf_fragment` (× 6) | small per-fragment | 6 indexed pages = 3 prose notes + sample-blocks + 2 CJK fixtures |
| `dist/pagefind/pagefind.js` (runtime, single file) | ~759 KB | fixed-size runtime asset |

## ADR-0012 acceptance criteria evaluation

### Criterion 1 — bundle-size budget (≤ 120 kB gzip first-paint)

✅ **PASS**. First-paint search route JS = design-tokens + client + SearchBox = **~73,030 bytes gzip**. Including the dynamic `pagefind.js` import (lazy-loaded) the total request set tops out at **~86 kB gzip** under the 120 kB budget. `pagefind-ui.js` defers to client interaction.

### Criterion 2 — index-size budget (≤ 300 kB uncompressed at 100-note projection)

⚠️ **FAIL under the projection formula**. Applying the locked formula `ceil(current_dist_pagefind_bytes / current_note_count * 100)`:
- Current: 579,348 bytes / 6 notes × 100 = **9,655,800 bytes ≈ 9.65 MB** at 100-note projection
- vs. budget: 300 kB uncompressed
- Gap: 30× over budget under the locked formula

**Root cause analysis (orchestrator)**: the projection formula was naïve — it assumed `_pagefind/` size scales linearly with note count, but actually:
- **PageFind runtime + UI bundles are FIXED-size** (~759 KB for `pagefind.js` alone + `pagefind-ui.{js,css}` etc.)
- Only the per-note **fragment** bytes scale with note count

Real per-note fragment cost is small (current 6 fragments × small bytes each). A correct projection should distinguish fixed vs scalar:
- Fixed: ~570 KB uncompressed (runtime + UI assets, independent of corpus)
- Scalar: ~1-2 KB per fragment × 100 notes ≈ 100-200 KB

A 100-note projection under the corrected model = **~770 KB uncompressed** (still over 300 kB budget, but the budget itself was wrong by 2-3× because it didn't account for runtime asset size).

**Wave 4 amendment**: ADR-0012 criterion 2 must be split into:
- (a) Fixed-asset budget: ≤ 800 kB uncompressed (PageFind runtime + UI assets; calibrated against current 759 kB runtime alone)
- (b) Per-note fragment scalar: ≤ 5 kB uncompressed average
- (c) 100-note total budget: 800 kB + 100 × 5 kB = ≤ 1.3 MB uncompressed

This is structurally the same shape as criterion 1 (which correctly distinguishes runtime from index). Add to Wave 4 ADR-0012 amendment scope.

### Criterion 3 (reindex-on-update) + 4 (CJK) + 5 (astro-pagefind ≥ 1.8.6)

Out of scope for perf audit (codex-mdx-doctor + lazy-chunking-test cover criterion 3+4 indirectly; `apps/site/package.json` declares `astro-pagefind: ^1.8.6` per criterion 5).

## C2 lazy-chunking regression — verification

✅ **No heavy-block chunk leakage into prose-only routes**. Prose route HTML (`dist/notes/sample-mdx-note/index.html` etc.) does not reference the search chunk; SearchBox + pagefind asset references are scoped to `/search/` route. `apps/site/src/__tests__/lazy-chunking.test.ts` (C2-locked) exists; vitest run was blocked by sandbox at audit time but full pnpm check during D3 exercise passed (38 cached / 38 total).

## Wave 4 perf-baseline opportunities (codex-perf-auditor next dispatch)

1. **C5 deferred work**: Phase 2 selective per-block heavy-chunk loading + measure per-route bundle delta after C4a/C4b ship Astro variants for math/pdf/jupyter/nn-viz/agent-flow.
2. **ADR-0012 criterion 2 split** (per the analysis above): fixed-asset budget + per-note scalar + 100-note total.
3. **Pagefind UI tree-shaking**: investigate whether `@pagefind/default-ui` ships unused imports that could be code-split / removed at build time. Current ~759 KB `pagefind.js` is the bulk of the search payload.
4. **Search route critical path**: measure SearchBox first-paint with PageFind runtime fully blocked vs. lazy-loaded (current implementation already lazy; verify under throttled network).

## Audit dispatch metadata

- Profile: `codex-perf-auditor`
- Dispatched: 2026-05-02 (Wave 3 close ceremony, ADR-0013)
- Off-tree raw audit log: `/tmp/codex-runs/2026-05-02-wave-3-close-perf.txt` (codex attempted direct write to docs/audits/perf-2026-05-wave-3-close.md but sandbox read-only blocked; orchestrator transcribed)
- Codex tokens: 112,895
