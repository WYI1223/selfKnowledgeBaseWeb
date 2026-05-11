# @skb/block-markdown Contract

Wave 6 cf-25 — the 9th BlockAffordanceKind. Promotes prose-level
markdown chunks (paragraph / heading / list / blockquote /
horizontalRule / codeBlock) into first-class grid blocks with the
full cf-19/20a-e + cf-22 a11y + cf-23 D8 read-route lock + cf-24
PaletteSidebar affordance suite.

Mental model (per cf-25 PR.md D1, "Path B"): the 12-col grid is the
LEGO baseboard; every content unit (component blocks AND markdown
chunks) is one block citizen with its own grid placement, drag
handle, kebab menu, and resize affordances. Match v2 reference's
`block.kind === 'markdown'` model from `/mnt/d/download/web/v2-app.jsx:265,309,315-316`.

## Public surface

Four entries (mirrors block-callout):

- `.` (root barrel) — re-export `./core` + `./ui-default`
- `./core` — headless layer
  - `markdownCore: BlockCoreDefinition<typeof propsSchema>` —
    `name='markdown'` / `kind='prose'` / `mdxComponent='Markdown'`
  - `serializeMarkdown(node) → mdxJsxFlowElement` — Tiptap → mdast
    (passthrough wrapper; grid attrs added by mdx-bridge upstream
    per cf-25 D5)
  - `parseMarkdown(mdast) → TiptapNode` — mdast → Tiptap
    (passthrough wrapper; mdx-bridge recurses children separately)
  - Types: `MarkdownProps` / `MarkdownTiptapNode` / `MarkdownMdastJsxElement`
- `./ui-default` — presentational layer
  - `markdownUiDefault: BlockUIDefinition<typeof markdownCore.propsSchema>`
    — `coreName='markdown'` / `uiId='default'` / `gridKind='prose'`
    / `rowSpanSemantic='auto'`
  - `MarkdownEditorView` / `MarkdownRenderView` —
    `ComponentType<BlockViewProps<typeof markdownCore.propsSchema>>`
- `./ui-default/markdown.css` — minimal inner-prose layout (margin
  reset for first/last child); cf-19 chrome lives in
  `@skb/editor-shell/src/block-chrome.css` per cf-20a single-source

`propsSchema` shape (see `src/core/core-definition.ts`):

```typescript
z.object({
  col: z.number().int().min(1).max(12),
  row: z.number().int().min(1).optional(),
  colSpan: z.number().int().positive(),
  rowSpan: z.union([z.number().int().positive(), z.literal('auto')]),
}).strict()
```

NOTE: NO content-prop fields. Markdown content lives as ProseMirror
children (Tiptap NodeViewContent), NOT as a string prop. The
schema captures only grid attrs.

## Invariants

Inherits from [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)
(Defensive copy / Schema strictness / Default UI lookup / Serialize-parse
hook ownership).

block-markdown specific invariants:

- **`coreName='markdown'` (kebab/lowercase)**: `markdownCore.name`
  fixed; matches the existing test fixture stubs at
  `packages/mdx-bridge/src/__tests__/grid-{rtt,defensive}.test.ts`
- **`mdxComponent='Markdown'` (PascalCase)**: matches the existing
  mdx-bridge `mdxComponent === 'Markdown'` isProse seam at
  `packages/mdx-bridge/src/parse.ts:217` + `serialize.ts:185`
- **`kind: 'prose'`**: per ADR-0016 D10 `BlockGridKind` taxonomy —
  the only block in the registry currently using this kind; the 8
  component blocks are `kind: 'component'`
- **`rowSpan: 'auto'` accepted**: unique among 9 block kinds;
  enables the existing `mdx-bridge` isProse seam to omit `rowSpan`
  on serialize (per ADR-0016 D3)
- **NodeView mount via NodeViewContent**: cf-25 D7 — the
  `editor-shell/BlockNodeView.tsx` factory short-circuits the
  markdown case to render `<NodeViewContent>` directly. Inner
  prose (paragraph / heading / list) is StarterKit-managed
  ProseMirror children, NOT block-markdown's responsibility
- **NO atom**: the markdown Tiptap node has `atom: false` +
  `content: 'block+'` per cf-25 D7; this is the ONLY non-atom
  block in the registry (the 8 component blocks are all `atom: true`)
- **Headless self-contained**: `core/` does NOT import any React /
  Tiptap UI modules; only depends on `@skb/block-foundation` +
  `zod` (ADR-0003 D1)
- **propsSchema single authority**: only in
  `src/core/core-definition.ts`; ui-default / serialize / parse /
  tests all import via `markdownCore.propsSchema`

## cf-25 round-trip contract (mdx-bridge integration)

mdx-bridge's parse + serialize have a SPECIAL chunking + unwrap
pass for markdown blocks per cf-25 D5:

- **Parse chunking pass**: consecutive top-level prose mdast nodes
  (paragraph / heading / list / blockquote / code / thematicBreak)
  fold into ONE synthetic `mdxJsxFlowElement{name:'Markdown'}`
  with the prose nodes as `children`. JSX flow elements break
  the chunk.
- **Serialize unwrap-on-default pass**: `markdown` Tiptap nodes
  with default grid attrs (col=1, no row, colSpan=12,
  rowSpan='auto') unwrap to bare prose mdast (NO `<Markdown>`
  wrapper in the MDX output). Non-default grid attrs emit the
  `<Markdown ...>...</Markdown>` JSX wrapper.

These passes are mdx-bridge's responsibility, NOT block-markdown's
core hooks. The hooks only handle the JSX wrapper element
parse/serialize at the dispatch boundary.

**Round-trip invariant**: bare-prose-in → markdown(default attrs)
→ bare-prose-out (byte-equivalent). Pinned by the existing
mdx-bridge round-trip test (`round-trip.test.ts`) over fixtures
01-paragraph through 06-nested-inline + cf-25's new
`30-markdown-grid.mdx` fixture for the wrapper-grid round-trip.

## Modifying this file / package

`markdownCore` public fields (`name` / `kind` / `propsSchema` /
`mdxComponent`) require an ADR for any change (sync with
mdx-bridge isProse seam + editor-shell BlockAffordanceKind union
+ apps/site mdx-adapter `BlockKindForChrome` extension).

`serializeMarkdown` / `parseMarkdown` signature changes require
mdx-bridge chunking-pass / unwrap-pass coordination (strong
coupling per the cf-25 PR.md round-trip invariant).

## Related

- [@skb/block-foundation CONTRACT](../block-foundation/CONTRACT.md) — `BlockCoreDefinition` authority
- [@skb/block-callout CONTRACT](../block-callout/CONTRACT.md) — template clone source (cf-25 mirrors structure)
- [@skb/mdx-bridge CONTRACT](../mdx-bridge/CONTRACT.md) — chunking + unwrap pass + round-trip invariant
- [ADR-0016 D2 + D3 + D7 + D10](../../docs/decisions/ADR-0016-grid-substrate.md) — grid attrs schema + isProse + grid-kind taxonomy
- [ADR-0017 v0.5 D15](../../docs/decisions/ADR-0017-drag-drop-ux.md) — markdown drag semantics (no special branch)
- [ADR-0018 v0.9 D11](../../docs/decisions/ADR-0018-v2-visual-migration.md) — markdown visual contract + `--accent-prose` token
- [cf-25 PR.md](../../docs/plans/wave-6-main/wave-6-cf-25-markdown-as-grid-blocks.md)
