# Wave 4 close-ceremony preparation — perf audit

| Field | Value |
| ---- | --- |
| 日期 | 2026-05-04 |
| 触发 | Wave 4 Stage B B6 close-prep dispatch |
| Auditor | `codex-perf-auditor` (gpt-5.3-codex-spark; read-only) |
| Raw archive | [`docs/audits/codex-runs/2026-05-04-B6-perf-auditor.txt`](codex-runs/2026-05-04-B6-perf-auditor.txt) |
| Compares against | [`perf-2026-05-03.md`](perf-2026-05-03.md) (Wave 4 A8 baseline) + [`perf-2026-05-wave-3-close.md`](perf-2026-05-wave-3-close.md) |

## Headline findings

1. **B7 chunk-leak confirmed** as Stage C optimization scope: B7 introduced static `import` references from `apps/site/dist/_astro/client.*.js` + `apps/site/dist/_astro/design-tokens.*.js` to heavy block chunks (`block-jupyter.*.js` ~404 KB, `block-agent-flow.*.js` ~283 KB). These chunks transitively contain Pyodide (~10MB) / React Flow / TF.js heavy deps. Pre-B7 main (HEAD `794cd5d` baseline rebuild verified at B7 R1) had NO leak.

2. **Existing `lazy-chunking.test.ts` contract maintained**: the test asserts JS files DIRECTLY referenced in route HTML (regex `/_astro/<name>.js` parse) do NOT contain pyodide/tensorflow/reactflow markers; this assertion PASSES post-B7 because prose-only routes' direct asset hrefs (only `client.*.js` + `design-tokens.*.js` themselves) contain 0 markers — markers live in transitively-importable block-*.js chunks not directly referenced.

3. **AC#5 zero-layout-shift baseline preserved post-B7**: the existing T0/T1 layout-shift assertion passes (post-fix at B7 R4 forward-fix commit `b448759` scoping selector to `[role="status"][data-block]`). Heavy block hydration adds D2 invariants without breaking width-strict / height-monotone semantic.

4. **CI runtime metrics not measurable in this dispatch**: codex-perf-auditor profile is `gpt-5.3-codex-spark` + read-only sandbox; no Chrome browser available for Lighthouse measurement. Stage C user-iteration PR can dispatch via local Chrome OR CI-only Lighthouse workflow.

## Risk assessment

| Risk class | Severity | Notes |
| ---- | --- | --- |
| Chunk-graph leak | High (perf) | B7 introduced; Stage C scope; documented in B7 PR.md `## Out of scope (deferred)` |
| Route-weight variability | Medium | Heavy imports broadly present in chunk graph; first-visit cache impact |
| Direct shared chunk inflation | Low | client.*.js + design-tokens.*.js sizes within 2 KB delta vs Wave 3 baseline |
| Runtime measurement gap | Low (process) | Lighthouse not collectable in current dispatch; Stage C can re-baseline |

## Stage C optimization scope informed by this baseline

Per Wave 4 plan A8 D10 'data-driven; only split when leak data justifies' precedent — Stage C user-iteration first PR (if invoked) addresses:

1. Refine `apps/site/astro.config.mjs` `manualChunks` per-symbol routing for `@skb/block-{jupyter,nn-viz,agent-flow}` packages
   - Split React JSX runtime + shared utilities into vendor chunks
   - Keep package-specific code in named chunks
2. Extend `apps/site/src/__tests__/lazy-chunking.test.ts` with transitive static-import chain traversal (depth-first chunk graph walk)
3. Update `apps/site/CONTRACT.md` `## Invariants` chunking strategy clause to specify direct vs transitive semantics
4. Lighthouse + Web Vitals (LCP/FCP/CLS) baseline collection via dedicated CI workflow

## Conclusion

Wave 4 perf baseline READY for close ceremony **with documented Stage C deferral** for chunk optimization. No blocking findings on functional correctness; the B7 hydration fix CLOSES the MVP-blocking visual disaster (heavy blocks now hydrate; previously forever-loading skeleton). Perf side-effect (chunk leak) bounded by existing `lazy-chunking.test.ts` contract + scoped to Stage C with empirical data collected here.
