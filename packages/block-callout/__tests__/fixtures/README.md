# block-callout fixtures

Wave 2 占位 fixture (编号 10-12)。Wave 3 `mdx-bridge` routing table PR 落地时，
`mdx-bridge-eng` 把这些 fixture 移交到 `packages/mdx-bridge/__tests__/fixtures/`
并配 byte-equivalent round-trip 测试（参见 `mdx-bridge/CONTRACT.md` 的 RTT invariant）。

| Fixture | 覆盖 |
|---|---|
| `10-callout-note.input.mdx` | 最小 callout（variant=note，无 title，单行 prose） |
| `11-callout-with-title.input.mdx` | 带 title（variant=tip） |
| `12-callout-nested-prose.input.mdx` | 嵌套 prose（bold / link / list 在 callout 内） |

编号空间见 [Wave 2 plan §Task C1 Step 7](../../../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
（10-12 callout / 13 block-code / 14 block-image / ...）。
