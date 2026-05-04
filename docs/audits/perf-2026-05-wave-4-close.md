# Wave 4 close-ceremony — perf audit (light addendum)

| Field | Value |
| ---- | --- |
| 日期 | 2026-05-04 |
| 触发 | Wave 4 close ceremony per ADR-0015 |
| Method | Light addendum (NOT fresh codex dispatch); references wave-4-prep audit + acknowledges C-1/C-2 NO-OP delta |
| Baseline reference | [`perf-2026-05-wave-4-prep.md`](perf-2026-05-wave-4-prep.md) (B6 dispatch; codex-perf-auditor; PR #46 squash `525e6c2`) |

## Why light addendum vs fresh codex dispatch

Per ADR-0015 R18: wave-4-prep perf audit ran at B6 (post-Stage-B; pre-C-1/C-2). Between wave-4-prep dispatch and Wave 4 close:

- **C-2 (PR #47)**: 1.7 KB static JSON data file under `apps/site/public/sample-assets/models/mlp-mnist.json`. Astro auto-copies `public/**` to `dist/**` byte-identical; **does NOT enter any JS chunk**. Zero impact on chunk graph.
- **C-1 (PR #48)**: 1-LOC delta in `packages/block-jupyter/src/ui-default/Jupyter.tsx` (string literal `'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'` ~50 bytes). The string is added inside the existing `block-jupyter` chunk. **No new chunk. No `astro.config.mjs` change. No `manualChunks` modification.** The CI-skipped integration test (`packages/kernel-pyodide/src/__tests__/boot.integration.test.ts`) does NOT ship to dist (test files excluded by Astro/Vite).

Neither change affects the perf-auditor's dimensions: chunk graph structure unchanged; per-chunk byte counts shift by <100 bytes (well within measurement noise); `lazy-chunking.test.ts` regression test passes (verified at C-1 commit).

## C-1/C-2 delta verification (manual scan)

- **Chunk-graph leak**: B7 introduced the static-import leak (per wave-4-prep §1); C-1/C-2 do NOT add new leak edges. Wave 4 close inherits the wave-4-prep chunk-leak finding **as Wave 5 deferred item** (per ADR-0015 D3 Stage C residue: C-4 B7 chunk-leak measure).
- **Direct shared chunk inflation**: `client.*.js` + `design-tokens.*.js` sizes within wave-4-prep ±2 KB delta. C-1's ~50-byte string addition is well under measurement noise.
- **AC#5 zero-layout-shift**: B7 forward-fix commit `b448759` (selector scope to `[role="status"][data-block]`) preserved at HEAD; playwright spec PASS at C-1 visual-smoke CI run.
- **Runtime metrics**: Lighthouse / Web Vitals not collected (per wave-4-prep §4 Lighthouse-not-collectable note); Wave 5 起手 should land Lighthouse CI workflow.

## Wave 5 perf baseline informed by Wave 4 close

Per ADR-0015 D3 Stage C residue + Wave 5 4-子阶段 plan-draft scope:

1. **C-4 chunk-leak optimization** (carried to Wave 5): refine `apps/site/astro.config.mjs` `manualChunks` per-symbol routing for `@skb/block-{jupyter,nn-viz,agent-flow}`; extend `lazy-chunking.test.ts` with transitive static-import chain traversal
2. **Lighthouse + Web Vitals CI workflow** (NEW Wave 5 scope): dedicated CI workflow for runtime perf measurement
3. **Heavy block plugin tier perf shift** (Wave 5 reframe): if Jupyter/NnViz/AgentFlow swap from real boot (C-1's Pyodide CDN path) to "🔌 plugin" placeholder UI, the chunk-graph profile changes substantively; Wave 5 perf audit will need fresh baseline

## Conclusion

Wave 4 perf baseline at HEAD `de39e07` is **byte-equivalent (in audit terms) to wave-4-prep at HEAD `525e6c2`** plus the documented C-1/C-2 NO-OP delta. **No blocking findings on functional correctness; perf side-effect (B7 chunk leak) bounded by existing `lazy-chunking.test.ts` contract + scoped to Wave 5 per ADR-0015 D3.**

Wave 5 起手 audit recommendation: fresh codex-perf-auditor dispatch at Wave 5 Pre-A close to re-baseline against grid + drag/drop bundle impact + plugin placeholder UI shift per ADR-0015 D6.
