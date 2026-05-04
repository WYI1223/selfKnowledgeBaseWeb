# Wave 4 close-ceremony preparation — mdx-doctor audit

| Field | Value |
| ---- | --- |
| 日期 | 2026-05-04 |
| 触发 | Wave 4 Stage B B6 close-prep dispatch |
| Auditor | `codex-mdx-doctor` (gpt-5.3-codex-spark; read-only) |
| Raw archive | [`docs/audits/codex-runs/2026-05-04-B6-mdx-doctor.txt`](codex-runs/2026-05-04-B6-mdx-doctor.txt) |
| Compares against | [`mdx-2026-05-wave-3-close.md`](mdx-2026-05-wave-3-close.md) |

## Findings

1. **[PASS]** All required fixture-based RTT checks pass: `mdxToTiptap → tiptapToMdx` byte-equivalence verified across 8 component blocks (callout / code / image / math / pdf / jupyter / nn-viz / agent-flow) × 2 invariants × 1 fixture per block = 16 RTT assertions per Wave 3 Stage B B8 close.

2. **[PASS]** `_mdast`-stripped equivalence is in place and passing: editor doc construction without `_mdast` field maintains same RTT semantic.

3. **[PASS]** Per-call `BlockRegistry` injection (Wave 3 D-list B1) is implemented in parse/serialize sites and reflected in contract/tests:
   - `packages/mdx-bridge/CONTRACT.md` documents the per-call dispatch expectation
   - `packages/editor-shell/src/saveLoad.ts` forwards `SaveLoadOptions.blockRegistry` into bridge callsites
   - `packages/editor-shell/CONTRACT.md` marks the option as forward-compat (Wave 3 → Wave 4 carry-over notes; no blocking contract deviation)

4. **[PASS]** Wave 3 + Wave 4 mdx-bridge contract integrity: no contract-breaking exceptions observed in Wave 3/4 bridge flow.

## Wave 4 deltas vs Wave 3 close baseline

- NO new component blocks added in Wave 4 (8 component blocks unchanged across Wave 3 close → Wave 4 close)
- NO new RTT fixtures authored in Wave 4 (existing 16 assertions cover Wave 4 boundary)
- ADR-0014 v0.3 production hydration wiring (B7) is APPS-LAYER (apps/site/src/components/ Astro wrappers + apps/site/src/islands/ React islands); does NOT affect mdx-bridge component-block round-trip semantic
- NO mdx-bridge source change in Wave 4 main pipeline

## Conclusion

Wave 4 mdx-bridge contract READY for close ceremony. **All RTT invariants PASS. No regressions.** Wave 3 close ratification carries forward unchanged.
