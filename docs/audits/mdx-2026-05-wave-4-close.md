# Wave 4 close-ceremony — mdx-doctor audit (light addendum)

| Field | Value |
| ---- | --- |
| 日期 | 2026-05-04 |
| 触发 | Wave 4 close ceremony per ADR-0015 |
| Method | Light addendum (NOT fresh codex dispatch); references wave-4-prep audit + acknowledges C-1/C-2 NO-OP delta |
| Baseline reference | [`mdx-2026-05-wave-4-prep.md`](mdx-2026-05-wave-4-prep.md) (B6 dispatch; codex-mdx-doctor; PR #46 squash `525e6c2`) |

## Why light addendum vs fresh codex dispatch

Per ADR-0015 R18: wave-4-prep mdx-doctor audit ran at B6 (post-Stage-B; pre-C-1/C-2). Between wave-4-prep dispatch and Wave 4 close:

- **C-2 (PR #47)**: ships static JSON data file. Does NOT touch `mdx-bridge`. Does NOT touch any block package's `core/parse.ts` / `core/serialize.ts` (the RTT authority surfaces). Does NOT touch any of the 8 component-block fixtures.
- **C-1 (PR #48)**: 1-LOC delta in `packages/block-jupyter/src/ui-default/Jupyter.tsx` (UI-default surface, NOT core-parse/serialize). Does NOT touch `mdx-bridge`. Does NOT touch any fixture.

**No mdx-bridge source change in Wave 4 main pipeline post-B6 prep audit.** RTT round-trip integrity is unchanged from wave-4-prep finding.

## C-1/C-2 delta verification (manual scan)

- **8 component-block RTT integrity** (`mdxToTiptap → tiptapToMdx` byte-equivalence): UNCHANGED. C-1/C-2 do not touch fixture files (`packages/block-*/src/__tests__/`) or `packages/mdx-bridge/`.
- **Per-call BlockRegistry injection** (Wave 3 D-list B1; documented in wave-4-prep §3): UNCHANGED.
- **Editor-shell BlockRegistry forwarding** (`packages/editor-shell/src/saveLoad.ts`): UNCHANGED.
- **`_mdast`-stripped equivalence**: UNCHANGED.

## Wave 5 mdx-doctor baseline informed by Wave 4 close

Per ADR-0015 D3 Wave 5 deferred items + reframe v2 scope:

1. **mdx-bridge col/row/colSpan/rowSpan serialization** (Wave 5 ADR-0016 scope; grid 数据模型): `mdx-bridge` will gain new serialize/parse handling for grid layout attributes. Major surface change; Wave 5 mdx-doctor needs fresh codex dispatch when ADR-0016 ships.
2. **Heavy block plugin tier MDX representation** (Wave 5 reframe scope): if heavy blocks become "🔌 plugin" placeholders, MDX representation may simplify (props schema unchanged but UI render path swap). Likely no mdx-bridge contract change but worth verification at Wave 5 ADR-0014 v0.4 amendment.
3. **No mdx-bridge fixture additions** in Wave 4 (8 component blocks unchanged across Wave 3 close → Wave 4 close = wave-4-prep finding); Wave 5 may add fixtures if new block kinds introduced (TBD at Wave 5 plan-draft).

## Conclusion

Wave 4 mdx-bridge contract at HEAD `de39e07` is **byte-equivalent to wave-4-prep at HEAD `525e6c2`** because C-1/C-2 do NOT touch any mdx-bridge surface. **All RTT invariants PASS. No regressions.** Wave 3 close ratification carries forward unchanged through Wave 4.

Wave 5 起手 audit recommendation: fresh codex-mdx-doctor dispatch at Wave 5 ADR-0016 grid 数据模型 lock to verify mdx-bridge col/row/colSpan/rowSpan serialization integrity. Pre-Wave-5 baseline = this Wave 4 close addendum.
