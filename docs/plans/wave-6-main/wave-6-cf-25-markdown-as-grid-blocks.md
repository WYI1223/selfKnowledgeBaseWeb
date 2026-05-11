# Wave 6 cf-25 — Markdown chunks as first-class grid blocks (paragraph / heading / list / blockquote / etc. become Markdown wrapper-blocks; cf-19 chrome + cf-20a-e affordances + cf-22 a11y inherited)

> Wave 6 carry-forward — closes the user-stated gap "edit mode 还是
> 一个大块 markdown，不是像 v2 那样每个功能块就一个 block，整个
> 12×n 面板都可以容纳不同 block。Markdown 应该是一个独立的
> block。底层 12 格栅应当像 LEGO 底板，只承载 block 和布局，不
> handle 功能 — 你没学到。Grid 也没做完。"
>
> Empirical baseline (BEFORE state captured at PLAN time via
> mcp playwright on /notes/sample-blocks/edit at 1280×900):
> - 36 top-level grid children inside `.ProseMirror`
> - 21 of those are bare `p` / `h2` / `ul` HTML prose elements with
>   `grid-column: 1 / -1` (CSS fallback rule from cf-20b grid.css);
>   they have ZERO chrome, ZERO drag handle, ZERO kebab menu, ZERO
>   per-kind hue stripe, ZERO resize affordances
> - 15 are `.react-renderer.node-{kind}` outer wrappers from cf-19
>   ReactNodeViewRenderer, each containing one `.skb-block-nodeview`
>   inner div with the full cf-19 chrome + cf-20c-2 drag + cf-20d
>   resize + cf-20e kebab affordances
> - Visual evidence: `docs/audits/screenshots/wave-6-cf-25-before-edit-1280-current-gap.png`
>   (raw)  +  `docs/audits/screenshots/wave-6-cf-25-before-edit-1280-gap-highlighted.png`
>   (red dashed outline + pink wash on the 21 unwrapped prose blocks)
>
> The grid IS a LEGO baseboard (cf-20b D11.1 amendment lands
> `display: grid` on `.ProseMirror`), but only component blocks
> (callout / componentCode / image / math / pdf / jupyter / nn-viz /
> agent-flow) bring their own per-block-citizen wrapper. Prose
> chunks ride the fallback `:not([style*="grid-column"])` selector
> as full-width unwrapped baseline rows. cf-25 promotes consecutive
> prose to **first-class Markdown wrapper-blocks** so every chunk
> gets its own `.skb-block-nodeview` chrome, individual grid
> placement, drag handle, kebab menu, and resize affordances —
> identical affordance surface to component blocks. The 12-col
> baseboard then truly carries any mix of (markdown, callout,
> image, code, math, ...) at any (col, row, colSpan, rowSpan)
> arrangement, matching v2's mental model.

## title

Promote prose-level markdown content (paragraph / heading / list /
blockquote / horizontalRule / codeBlock that's NOT a component
block) into first-class **Markdown wrapper-blocks** with grid
attrs `{col, colSpan, row?, rowSpan='auto'}` and the cf-19/20a-e
affordance suite. Architecturally **Path B** (per the user's
brief and the v2 reference at `/mnt/d/download/web/v2-app.jsx:265,309,315-316`):
ONE new node type `markdown` carries a chunk of inline-prose
mdast as its inner content (NOT extending paragraph/heading/list
individually). At parse time, mdx-bridge groups consecutive
top-level prose nodes into one `markdown` per chunk; at
serialize time, `markdown` unwraps back to its inline mdast
children, preserving byte-equivalent round-trip per ADR-0016 D7
+ mdx-bridge round-trip invariant. Grid attrs default to `col=1,
colSpan=12, rowSpan='auto'` (the existing
`mdxComponent === 'Markdown'` isProse hook in mdx-bridge already
supports this — the team pre-built this seam at Wave 5 C.2-3.5).
The `markdown` Tiptap node uses Tiptap's `content: 'block+'`
(NOT atom) so paragraph / heading / list nodes from the inline
mdast continue to live as ProseMirror children with full inline
editing; only the OUTER wrapper carries grid attrs + chrome. This
preserves all StarterKit prose extensions (input rules, marks,
inline formatting toolbar) without rewriting them.

The new `@skb/block-markdown` package follows the
ui-default + core-definition + propsSchema pattern of the existing
8 component blocks (per `packages/block-callout/CONTRACT.md`
template; cf-19/20a singularity contract). Its `coreName` is
`markdown` (kebab-cased Tiptap node name; matches MDX tag
MDX tag `Markdown`); its propsSchema is the strict 4-field grid attrs
schema (no inner content props — content is ProseMirror children,
NOT a string prop). Its EditorView is a tiny passthrough wrapping
Tiptap's `NodeViewContent` element (the standard content-projection element)
so the editor renders editable inner prose; its RenderView (used
by the read route via mdx-bridge's `getJsxDispatch`) renders the
markdown source via the same StarterKit extension chain (or a
dedicated remark→react renderer to keep the read route
react-only).

Wire `markdown` into `BlockAffordanceKind` union as the
9th kind. Apply the cf-19 per-kind 2px top stripe (color: a NEW
`--accent-prose` token, hue 80° = warm-canvas / off-white per
ADR-0018 v0.5 D3 hue family taxonomy; matches v2 reference
markdown block neutrality vs colorful component blocks). Add
PALETTE_SIDEBAR_ITEMS row + PaletteModal row + slash-menu row.
Sample-blocks fixture rewrites to demonstrate **mixed grid
arrangement**: a heading block at `col={1} colSpan={6}` paired
with an image block at `col={7} colSpan={6}` on the same row,
proving the 12-col baseboard carries arbitrary block mixes.

cf-23 D8 zero-affordance read-route lock is preserved: read route
`/notes/[slug]` renders `markdown` content as plain prose
inside `.skb-block-static` chrome (border + radius + per-kind
stripe), but emits ZERO drag/kebab/resize affordances. cf-20b
grid placement applies identically (the `.skb-block-static`
wrapper consumes `extractGridPosition` per the existing mdx-adapter
pattern).

## files

22 source files + 5 doc files = 27 files total (~1,150 LOC net
add — large PR; bulk is the new block package + parse/serialize
chunking + ProseMirror NodeViewContent wrapper + Playwright spec):

### A. New `@skb/block-markdown` package (8 files, ~280 LOC)

1. `packages/block-markdown/package.json` — **NEW** (~25 LOC).
   Mirrors `packages/block-callout/package.json`. Exports
   `./core`, `./ui-default`, `.` (barrel). Peer-deps on
   `@skb/block-foundation`, `react`, `@tiptap/react`.

2. `packages/block-markdown/CONTRACT.md` — **NEW** (~80 LOC).
   Per ADR-0006 contract template + cf-19 chrome + cf-20a paired
   selector + cf-25 D5 markdown-as-prose-wrapper rationale + the
   ProseMirror `content: 'block+'` schema choice + round-trip
   invariant cross-link to mdx-bridge CONTRACT.

3. `packages/block-markdown/src/index.ts` — **NEW** (~10 LOC).
   Barrel re-exports core + ui-default symbols.

4. `packages/block-markdown/src/core/core-definition.ts` — **NEW**
   (~30 LOC). Per `packages/block-callout/src/core/core-definition.ts`
   shape:
   - `coreName: 'markdown'`
   - `mdxComponent: 'Markdown'` (matches the existing mdx-bridge
     isProse discriminator AND the existing test fixtures)
   - `propsSchema`: `z.object({ col, row?, colSpan, rowSpan }).strict()`
     where `rowSpan: z.union([z.number().int().positive(), z.literal('auto')])`
     (mirrors the existing 8 blocks' grid-attrs subset MINUS the
     content-specific fields; `rowSpan='auto'` is THE prose default)

5. `packages/block-markdown/src/core/parse.ts` — **NEW** (~40 LOC).
   `parseMarkdown(node: MdastJsxElement)` — mdx-bridge dispatch
   handler. Reads `node.children` (the inline mdast inside
   `<Markdown>...</Markdown>`) and emits a `TiptapNode` with
   `type: 'markdown', content: <inline mdast → tiptap
   converted via the existing mdastBlockToTiptap recursion>`.
   Re-uses the existing recursive `mdastBlockToTiptap` helper
   (extract to a re-exported helper in mdx-bridge per D5 below).

6. `packages/block-markdown/src/core/serialize.ts` — **NEW**
   (~40 LOC). `serializeMarkdown(node: TiptapNode)` — converts
   the markdown's inner ProseMirror nodes back to mdast
   children via the existing recursive `tiptapBlockToMdast` helper
   (also extracted to a re-exported helper in mdx-bridge per D5).
   Returns an `MdastJsxElement` with `name: 'Markdown'` + grid
   attrs only (NO content attrs; content lives as `children`).

7. `packages/block-markdown/src/ui-default/markdown-view.tsx` —
   **NEW** (~50 LOC). Two React components per block-callout
   ui-default pattern:
   - `MarkdownEditorView` — wraps Tiptap's `NodeViewContent`
     element so the inner ProseMirror children render with full inline
     editing. The `data-skb-block-host="markdown"` attr
     lets the cf-20a paired-selector chrome apply; no inner CSS
     beyond a `.skb-prose` namespace class so the StarterKit-
     emitted h1/h2/h3/p/ul/ol/blockquote inherit the existing
     prose typography (`packages/design-tokens/CONTRACT.md`
     prose hierarchy already defines this).
   - `MarkdownRenderView` — used by mdx-bridge's read-route
     dispatch. Reads inner content as already-rendered React
     prose (mdx-bridge composes via the Markdown JSX element whose
     children are the rendered inline tree); render is just
     `<div class="skb-prose">{children}</div>`. The
     `.skb-block-static` wrapper added by `makeMdxAdapter`
     provides chrome.

8. `packages/block-markdown/src/ui-default/markdown.css` — **NEW**
   (~10 LOC). Single rule: `.skb-prose { /* nothing — inherits
   global prose styles */ }`. The cf-19 stripe color comes from
   the `block-chrome.css` per-kind selector added in item 16
   below.

### B. Modify mdx-bridge (3 files, ~120 LOC delta)

9. `packages/mdx-bridge/src/parse.ts` — **MODIFY** (~80 LOC
   delta). Three changes:
   - **Chunking pass**: BEFORE the existing `blocks.map(...)`
     iteration, fold consecutive non-JSX prose blocks
     (paragraph / heading / list / blockquote / code /
     thematicBreak) into one `mdxJsxFlowElement` synthetic node
     with `name: 'Markdown'` carrying the original prose nodes
     as `children`. JSX flow elements (mdxJsxFlowElement) break
     the chunk; yaml frontmatter already extracted earlier.
   - **Existing `mdastBlockToTiptap` STAYS as the recursive
     inline-converter** (used by item 5 to convert the inner
     prose); export it from mdx-bridge so block-markdown can
     consume it without duplicating the algorithm. NO behavior
     change for non-prose JSX flow elements.
   - **Add `Markdown` to the JSX dispatch table** so
     `mdastJsxFlowElementToTiptap` routes the synthetic
     synthetic Markdown element to `parseMarkdown` (item 5). The
     dispatch already keys off `mdxComponent` name; adding the
     row + the `mdxComponent === 'Markdown'` isProse branch is
     load-bearing already (parse.ts:217).

10. `packages/mdx-bridge/src/serialize.ts` — **MODIFY** (~30
    LOC delta). Two changes:
    - **Markdown unwrapping pass**: AFTER the existing
      block-by-block serialize, synthetic Markdown blocks
      with no non-default grid attrs (col=1, colSpan=12, no row,
      rowSpan='auto') unwrap back to bare prose mdast (no
      Markdown JSX wrapper in the output). When the
      Markdown block has explicit grid attrs (e.g. `col=1
      colSpan=6` from the user resize/drag), it emits the
      `Markdown col={N} colSpan={N}>...</Markdown` JSX wrapper. This keeps
      backwards-compatible MDX output for legacy files while
      letting cf-25 grid-positioned markdown round-trip.
    - **Export `tiptapBlockToMdast` recursive helper** so
      block-markdown's serialize.ts can consume it (item 6).

11. `packages/mdx-bridge/src/dispatch-table.ts` — **MODIFY**
    (~10 LOC delta). Add `Markdown` row to the canonical
    dispatch list (currently 8 entries for callout / componentCode
    / image / math / pdf / jupyter / nn-viz / agent-flow).
    The row's parse + serialize handlers come from
    `@skb/block-markdown/core` per registry-wire item 13.

### C. Modify editor-shell (4 files, ~80 LOC delta)

12. `packages/editor-shell/src/registry-wire.tsx` — **MODIFY**
    (~30 LOC delta). Three changes:
    - Extend `BlockAffordanceKind` union with `'markdown'`
      (alphabetical position: between 'jupyter' and 'math' in
      the source file)
    - Add `BLOCK_KIND_OPTIONS` row: `{ kind: 'markdown',
      label: 'Markdown', mdxComponent: 'Markdown' }`
    - Add `defaultBlockAttrs.markdown = { col: 1,
      colSpan: 12, rowSpan: 'auto' }` (NO content-prop fields;
      content comes from ProseMirror children, NOT attrs)
    - Add `jsxDispatches` row:
      `['Markdown', 'markdown', parseMarkdown, serializeMarkdown]`
    - Modify `createBlockExtension` so when
      `option.kind === 'markdown'`:
      - `group: 'block'` (UNCHANGED)
      - `atom: false` (vs `true` for the 8 component blocks —
        markdown holds editable inner content)
      - `content: 'block+'` (one or more block nodes as content)
      - `defining: true` (so backspace at start unwraps
        gracefully per ProseMirror schema convention)
      - `addNodeView` returns the same `makeBlockNodeView` factory
        — the factory ALREADY handles all kinds via `nodeName`
        lookup; the new bit is the EditorView component renders
        a `NodeViewContent` element instead of static props (per item 7
        MarkdownEditorView contract)

13. `packages/editor-shell/src/registerBlocks.ts` — **MODIFY**
    (~5 LOC delta). Register `@skb/block-markdown` core +
    ui-default alongside the existing 8 (the function name
    `registerBlocks` already iterates a list; just add to the
    list + import).

14. `packages/editor-shell/src/BlockNodeView.tsx` — **MODIFY**
    (~20 LOC delta). The factory already handles all kinds via
    `nodeName` lookup (no kind-specific branching). cf-25 needs
    ONE addition: when `node.type.name === 'markdown'`,
    the body section renders `NodeViewContent /` (NOT
    `EditorView props={editorProps} /`). Implement via a
    sibling code-path inside the existing factory:
    ```
    if (nodeName === 'markdown') {
      return <NodeViewWrapper ...><gutter/>
        <div class="skb-block-nodeview__body">
          <NodeViewContent class="skb-prose" />
        </div>
        <ResizeHandles .../>
      </NodeViewWrapper>;
    }
    // else existing component-block path unchanged
    ```
    The gutter shell + drag-handle + kebab + ResizeHandles +
    grid placement style ALL stay identical to the component-
    block path. ONLY the body content rendering differs.

15. `packages/editor-shell/src/palette-sidebar.tsx` — **MODIFY**
    (~15 LOC delta). Add the markdown entry to
    `PALETTE_SIDEBAR_ITEMS` between callout and image:
    `{ kind: 'markdown', label: 'Markdown', glyph: '¶',
    description: 'Heading · paragraph · list · quote' }`. The
    palette renders this as the 9th item.

### D. Modify chrome + tokens (2 files, ~15 LOC delta)

16. `packages/editor-shell/src/block-chrome.css` — **MODIFY**
    (~10 LOC delta). Add the `markdown` per-kind 2px top
    stripe rule (per cf-19 D2 contract):
    ```
    .skb-block-nodeview[data-skb-block-kind='markdown'],
    .skb-block-static[data-skb-block-kind='markdown'] {
      border-top: 2px solid var(--accent-prose, oklch(75% 0.04 80));
    }
    ```
    Hue 80° = warm-neutral canvas family per ADR-0018 v0.5 D3
    (intentionally LESS saturated than the 8 colorful component
    kinds so prose feels like the document substrate, not an
    accent block).

17. `packages/design-tokens/src/tokens.css` — **MODIFY** (~3
    LOC delta). Add `--accent-prose: oklch(75% 0.04 80);` to
    `:root`. Inline cite comment
    `/* Wave 6 cf-25 D6 per ADR-0018 v0.9 */`.

### E. Modify sample fixture (1 file, demonstrates mixed grid)

18. `content/notes/sample-blocks/index.mdx` — **MODIFY** (~30
    LOC delta). Demonstrate cf-25 mixed-grid mental model:
    - Wrap the existing prose chunks in the Markdown JSX element
      with `col={1} colSpan={12}` defaults (visually
      identical to the BEFORE state because each gets full row)
    - Add ONE NEW row demonstrating side-by-side: a heading
      block at `col={1} colSpan={6}` paired with an image at
      `col={7} colSpan={6}`:
      ```
      <Markdown col={1} colSpan={6}>
        ## Side-by-side demo
        Text on the left half.
      </Markdown>

      <Image col={7} colSpan={6} rowSpan={1}
             src="/sample-assets/diagram-small.png"
             alt="..." />
      ```
    - This row is the EVIDENCE that the 12-col baseboard
      carries mixed block kinds at arbitrary placements.

### F. Tests (4 files, ~360 LOC)

19. `packages/block-markdown/src/__tests__/parse-serialize.test.ts`
    — **NEW** (~120 LOC). Round-trip cases:
    - Single paragraph → markdown → byte-equivalent paragraph
    - Multi-paragraph chunk → ONE markdown with 2 inner
      paragraphs → byte-equivalent multi-paragraph
    - Heading + paragraph + list → ONE markdown with mixed
      inner block content → byte-equivalent
    - Grid-positioned `Markdown col={1} colSpan={6}>...</Markdown`
      → markdown with `attrs.col=1, colSpan=6` → emits the
      `Markdown col={N}...>...</Markdown` wrapper on serialize
    - Default-grid Markdown content → unwraps on serialize
      to bare prose (no Markdown wrapper in MDX output)
      — backward-compat invariant for legacy MDX files
    - Inline mark + link + emphasis nested inside markdown
      → preserved through round-trip

20. `packages/mdx-bridge/src/__tests__/markdown-chunking.test.ts`
    — **NEW** (~80 LOC). The new chunking pass:
    - Two consecutive paragraphs → ONE markdown
    - Paragraph + JSX flow element + paragraph → THREE blocks
      (chunk break around the JSX)
    - Heading at start + paragraph + list → ONE markdown
      (all 3 are prose nodes)
    - Mixed prose + thematicBreak → still ONE chunk
      (thematicBreak is prose)
    - Empty doc → no markdown emitted
    - Doc with ONLY a JSX flow element → no markdown emitted

21. `packages/editor-shell/src/__tests__/registry-wire.test.ts`
    — **MODIFY** (~20 LOC delta). Existing test asserts
    BLOCK_KIND_OPTIONS has 8 entries; update to 9. Add row
    asserting `markdown` kind has `mdxComponent: 'Markdown'`
    and the extension's `atom === false` (vs all 8 others
    `atom === true`).

22. `apps/site/playwright/sample-blocks-markdown-blocks.spec.ts`
    — **NEW** (~140 LOC). End-to-end:
    - Load `/notes/sample-blocks/edit`; assert at least 1
      `[data-skb-block-kind='markdown']` chrome wrapper
    - Assert ZERO bare `p` / `h2` / `ul` HTML direct children
      of `.ProseMirror` (the cf-25 invariant: every prose chunk
      lives inside a markdown)
    - Drag a markdown by its drag-handle to a different
      grid position; assert the doc reorders + autosave fires
    - Resize a markdown from `colSpan=12` to `colSpan=6`
      via the cf-20d resize handle; assert the grid attr updates
      AND the cf-19 chrome reflows
    - Trigger kebab Delete on a markdown; assert the
      block disappears AND surrounding blocks reflow
    - Trigger kebab Duplicate; assert a copy appears with the
      same inner prose
    - Click the new "Markdown" item in PaletteSidebar; assert
      a new empty markdown appears at end-of-doc
    - Read route `/notes/sample-blocks` parity: every
      `[data-skb-block-kind='markdown']` `.skb-block-static`
      wrapper renders identical inner prose to the edit route
      (cf-23 D8 zero-affordance lock — ZERO drag-handle / kebab /
      resize-handles in the read DOM)
    - Side-by-side fixture row: `[data-skb-block-kind='markdown']`
      at `col=1 colSpan=6` lives at `(viewport>=1024) ? same row :
      stacked` next to the image block at `col=7 colSpan=6`

### G. Doc files (5 files, ~280 LOC delta)

23. `docs/decisions/ADR-0017-drag-drop-ux.md` — **MODIFY** (~50
    LOC delta). Amendment header bumps v0.4 → v0.5. NEW D15
    "Markdown wrapper-block drag-drop semantics":
    - Markdown blocks share the per-block drag pipeline (NO
      special branch — `markdown` is one of the
      `BlockAffordanceKind` kinds, drag-handle gutter is the
      same React component, applyDropMode is identical)
    - Drag SOURCE on markdown text uses the gutter button as
      drag affordance (not the inner text — selecting text inside
      a markdown block stays the inline-editing selection
      gesture; dragging starts from the gutter)
    - applyDropMode INSERT mode for markdown works same
      as component blocks; no kind-specific code path needed

24. `docs/decisions/ADR-0018-v2-visual-migration.md` — **MODIFY**
    (~80 LOC delta). Amendment header bumps v0.8 → v0.9. NEW
    D11 "Markdown wrapper-block visual contract":
    - **D11.a**: `markdown` is the 9th block kind sharing
      the cf-19 `.gblock` chrome via cf-20a paired-selector
      `.skb-block-nodeview, .skb-block-static`
    - **D11.b**: Per-kind 2px stripe color is `--accent-prose`
      (NEW token, hue 80° warm-neutral canvas) per
      ADR-0018 v0.5 D3 hue family taxonomy. Intentionally less
      saturated than the 8 colorful kinds — prose IS the
      document substrate, NOT an accent block
    - **D11.c**: Inner content rendering — markdown blocks
      render their inner ProseMirror children (paragraph /
      heading / list / blockquote) inside a `.skb-prose`
      namespace; existing prose typography + design tokens
      from `packages/design-tokens/CONTRACT.md` apply (no NEW
      typography rules)
    - **D11.d**: Mixed-grid demonstration — sample-blocks
      fixture (cf-25 item 18) ships ONE row with a markdown
      at `col=1 colSpan=6` paired with an image block at
      `col=7 colSpan=6`. This is the visible proof of the
      LEGO-baseboard mental model

25. `packages/mdx-bridge/CONTRACT.md` — **MODIFY** (~50 LOC
    delta). Sections "Markdown wrapper-block parse path" + "Markdown
    wrapper-block round-trip invariant":
    - Document the chunking-pass contract (consecutive prose
      nodes → ONE Markdown wrapper)
    - Document the unwrap-on-default-grid contract (legacy
      MDX backward-compat)
    - Document the grid-attr round-trip for `<Markdown col={N}
      colSpan={N}>` wrappers
    - Cross-link `@skb/block-markdown/CONTRACT.md`

26. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~30 LOC
    delta). Public surface section:
    - Add `markdown` to BlockAffordanceKind union
      documentation (count: 8 → 9)
    - Note the `atom: false, content: 'block+'` schema choice
      vs the 8 atom-block kinds
    - Cross-link block-markdown package + ADR-0017 v0.5 D15 +
      ADR-0018 v0.9 D11

27. `apps/site/CONTRACT.md` — **MODIFY** (~20 LOC delta).
    "Block kinds rendered" section: add markdown row.
    The `apps/site/src/lib/mdx-adapter.ts:BlockKindForChrome`
    union also needs to extend (separate item below — calling
    out the type implication).

### H. Cleanup (1 file, ~5 LOC delta)

(Note: `apps/site/src/lib/mdx-adapter.ts` BlockKindForChrome
union extension counts toward item 27 above since it's the
contract-aligned change.)

## ui_touch

`true` — every visual surface receives changes:
- `.skb-block-nodeview` chrome gains a 9th per-kind stripe color
- `.skb-block-static` chrome gains the same 9th per-kind stripe
- 21 currently-unwrapped prose elements in
  `/notes/sample-blocks/edit` become 21 (or fewer, depending
  on chunking) chrome-wrapped Markdown blocks
- Sample-blocks fixture introduces a side-by-side mixed-grid row
- New PALETTE_SIDEBAR_ITEMS entry visible on the left rail
- New slash-menu entry visible when typing `/markdown`

The 5-viewport AFTER visual sweep at EXECUTE stage emits 5 archive
screenshots (edit at 1440/1280/1024/768/375) plus 1 BEFORE
reference (`wave-6-cf-25-before-edit-1280-current-gap.png` already
captured during PLAN — see "Visual demo" section below) plus 1
gap-highlighted BEFORE reference
(`wave-6-cf-25-before-edit-1280-gap-highlighted.png` — captured
during PLAN with the 21 unwrapped prose elements outlined).

## e2e_smoke

cf-25 ships TWO Playwright spec files (split per the 500 LOC hard
cap; both register the standard cf-22 R3 fixture-leak protocol):

- `apps/site/playwright/sample-blocks-markdown-blocks.spec.ts` —
  STRUCTURAL specs (presence, count, palette parity, read-route
  chrome, side-by-side measurement, kebab guard, kebab Delete).
- `apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts`
  — BEHAVIORAL specs (drag, resize, duplicate, palette drag-drop,
  read/edit parity, responsive viewport sweep).

### Flow 1 — every prose chunk wraps as a markdown block (structural invariant)

target_url: /notes/sample-blocks/edit
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts:"AC3-1 — every top-level prose chunk wraps as a markdown block (NO bare p/h2/ul under .ProseMirror)"
screenshot_archive: docs/audits/screenshots/wave-6-cf-25-after-edit-1280.png

assertions:
  - `[data-skb-block-kind='markdown']` count ≥ 1
  - direct child `p` / `h2` / `ul` HTML element count under
    `.ProseMirror` === 0
  - every `markdown` wrapper has `.skb-block-nodeview__gutter`
    with drag-handle + kebab button (sub-asserted by AC3-2)

### Flow 2 — drag/resize/duplicate behavioral specs (cf-25 R2 F6)

target_url: /notes/sample-blocks/edit
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts:"AC3-2a — drag a markdown block to another block triggers cf-20c-2 split + announcer fires Moved"
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts:"AC3-2b — right-edge resize on a markdown block mutates colSpan + fires Resized"
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts:"AC3-2c — kebab Duplicate on a markdown block inserts a copy with same kind + content"
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts:"AC3-7 (cf-25 R1 F4 mutation) — kebab Delete on a markdown block decrements count + autosave persists"
screenshot_archive: docs/audits/screenshots/wave-6-cf-25-after-edit-1280.png

assertions:
  - drag markdown A over markdown B's right edge: source's
    `gridColumn` mutates (proves applyDropMode + setNodeMarkup
    ran); DropPulse anchor mounts; announcer textContent contains
    'Moved markdown block'
  - right-edge resize markdown from colSpan=12 inward: gridColumn
    snaps to one of `[2, 3, 4, 6, 8]` per ADR-0016 D6 COL_SNAPS;
    DropPulse anchor mounts; announcer textContent contains 'Resized'
    (resize announcer formatter omits the kind name per cf-22
    formatResize design — kind-agnostic message)
  - kebab Duplicate on a markdown: block count +1; the duplicated
    block (immediately after source per ProseMirror tr.insert) has
    identical `.skb-prose` body text as the source; DropPulse mounts
  - kebab Delete on a markdown: block count -1; autosave POST lands
    on disk before the trailing fixture restore (cf-22 R3 #26 lesson)

### Flow 3 — palette drag/drop external-source pipeline (cf-25 R2 F6)

target_url: /notes/sample-blocks/edit
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts:"AC3-3 — palette has 9 items (was 8 pre-cf-25); markdown is one of them"
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts:"AC3-3a — palette Markdown item drag → drop on grid inserts a new markdown block + announcer fires Inserted"
screenshot_archive: docs/audits/screenshots/wave-6-cf-25-after-edit-1024.png

assertions:
  - palette has exactly 9 items (was 8 pre-cf-25); 1 carries
    `[data-skb-palette-kind="markdown"]`
  - dragstart on palette markdown item → dragover on `.skb-grid` →
    drop on `.skb-grid` (single shared DataTransfer per cf-24 R0
    F3 pattern): markdown count +1; announcer textContent contains
    'Inserted markdown block'

### Flow 4 — read/edit parity (cf-25 R2 F6)

target_url: /notes/sample-blocks + /notes/sample-blocks/edit
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts:"AC3-4 — read route renders markdown blocks with chrome but ZERO affordances (cf-23 D8 lock)"
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts:"AC3-4a — read/edit parity: explicit-wrapper markdown blocks have same gridColumn + body text on both routes"
screenshot_archive: docs/audits/screenshots/wave-6-cf-25-after-read-1280.png

assertions:
  - read route ZERO `.skb-block-nodeview__drag-handle` /
    `.skb-block-nodeview__kebab` / `.gblock-handle` (cf-23 D8 lock)
  - read route `.skb-block-static[data-skb-block-kind='markdown']`
    count === edit route's explicit-wrapper markdown count
    (default-grid prose chunks unwrap per cf-25 D5; only explicit
    wrappers carry chrome on the read route)
  - each explicit markdown block has matching computed
    `gridColumn` + matching `.skb-prose` body text on both routes
    (no escaping divergence)

### Flow 5 — responsive viewport sweep (cf-25 R2 F6)

target_url: /notes/sample-blocks/edit
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts:"AC3-5 — side-by-side mixed-grid row: markdown(col=1 colSpan=6) + image(col=7 colSpan=6) at IDENTICAL top (viewport ≥ 1024)"
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts:"AC3-5a — viewport 1280px: mixed-grid placement + no horizontal overflow"
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts:"AC3-5a — viewport 1024px: mixed-grid placement + no horizontal overflow"
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts:"AC3-5a — viewport 768px: mixed-grid placement + no horizontal overflow"
screenshot_archive: docs/audits/screenshots/wave-6-cf-25-after-edit-mixed-row.png

assertions:
  - viewport 1280: side-by-side markdown (col=1 colSpan=6) +
    image (col=7 colSpan=6) at IDENTICAL `top` ±2px; markdown
    `left` < image `left` (markdown to the left)
  - viewport 1024: same side-by-side invariant (cf-20b grid still
    12 columns at 1024)
  - viewport 768: cf-20b 6→1 col flatten — markdown + image stack
    vertically (image `top` > markdown `top` + 10px)
  - all 3 viewports: `document.documentElement.scrollWidth ===
    window.innerWidth` (no horizontal overflow per cf-23 D10)

### Flow 6 — D10 lossy-conversion guard (cf-25 R1 F3)

target_url: /notes/sample-blocks/edit
playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts:"AC3-6 (cf-25 R1 F3) — kebab on a markdown block HIDES the Change-kind submenu (D10 lossy-conversion guard)"

assertions:
  - kebab on a markdown block: Delete + Duplicate items present;
    Change-kind submenu ABSENT (`[data-skb-kebab-action="change-kind-toggle"]`
    count === 0); UI guard prevents lossy markdown ↔ component
    conversion per cf-25 D10. Defense-in-depth: action handler
    (`EditorShellKebabActions.makeKebabChangeKind`) also no-ops
    when source or target is markdown.

## D-decisions (orchestrator-locked at PLAN time)

### D1 — Path B (markdown wrapper) chosen over Path A (extend each prose node-type)

**Path A** (extend Paragraph + Heading + BulletList + … with
grid attrs + per-type NodeView):
- 6+ Tiptap node-type extensions to author + maintain
- 6+ new BlockAffordanceKind enum entries (`prose-paragraph`,
  `prose-heading`, `prose-list`, …)
- 6+ MDX serialize variants (`<Paragraph col={N}>...</Paragraph>`,
  `<Heading col={N}>...</Heading>`)
- BREAKS the existing mdx-bridge `mdxComponent === 'Markdown'`
  isProse seam — would replace it with N seams
- MORE granular control (each heading independently
  drag/resize/place) but at significant complexity cost

**Path B** (one markdown wrapper per chunk; selected):
- 1 NEW Tiptap node type (`markdown`)
- 1 NEW BlockAffordanceKind entry
- 1 MDX wrapper tag `<Markdown ...>...</Markdown>` (already in
  the mdx-bridge dispatch hook + tests)
- Inner prose continues to use StarterKit Paragraph/Heading/List
  EXACTLY AS-IS — zero changes to inline editing behavior, input
  rules, marks, toolbar
- Matches v2 reference EXACTLY: `block.kind === 'markdown'` in
  `/mnt/d/download/web/v2-app.jsx:265,309,315-316` is one block
  type carrying a chunk; v2 does NOT have per-heading or
  per-paragraph block kinds
- Re-uses the pre-built `mdxComponent === 'Markdown'` isProse
  seam (mdx-bridge parse.ts:217 + serialize.ts:185 + grid-rtt
  + grid-defensive tests at line 27/40/55/63)
- TRADE-OFF: granularity is at chunk level not per-element;
  user can split a chunk via a future "split block" gesture
  if needed (not in cf-25 scope; scope limited to placement
  affordances)

Path B chosen. Granularity argument: the user's mental model
("each functional block is one block") naturally maps to
chunks, not per-element. A 5-line markdown chunk is ONE
content unit; splitting it into 5 paragraph blocks would
fragment focus + clutter the gutter.

### D2 — Block-kind union expansion: `markdown` joins BlockAffordanceKind alongside the 8 existing kinds

ALTERNATIVE (rejected): a separate `ProseBlockKind` axis. Would
require parallel switch-statements in cf-19 stripe rules,
cf-20c-2 drag pipeline, cf-20d resize, cf-20e kebab, cf-22 a11y.
The 8 existing kinds already share BlockAffordanceKind; the
9th (markdown) shares the SAME affordance suite (drag, kebab,
resize, palette). Union expansion is the lowest-friction path.

### D3 — Grid attrs schema unchanged: `{col, row?, colSpan, rowSpan}` per ADR-0016 D2 — NO new schema fields

The existing 4-field schema is sufficient. The ONLY schema-side
nuance is `rowSpan: number | 'auto'` for prose (the existing
`isProse` discriminator); cf-25 adds the `'auto'` variant to
`block-markdown`'s propsSchema (cf. block-callout's
`rowSpan: z.number().int().positive()` integer-only). Reuses
the existing `useAutoRowSpan` hook (cf-20b/c) for content-derived
row sizing.

### D4 — Default attrs on schema-load (existing notes): `col=1, colSpan=12, rowSpan='auto'`

Matches the user's "looks the same by default" requirement.
A pre-cf-25 MDX file with no Markdown wrapper still parses
to the same visual layout because the chunking-pass folds
prose into one `markdown` per chunk with default grid
attrs (full-width, 'auto' row).

### D5 — MDX wrapper tag `<Markdown col={N} colSpan={N}>...</Markdown>` ONLY emitted when grid attrs are non-default

**On parse**:
- Bare prose (no wrapper) → folded into `markdown` with
  default attrs (existing chunking pass per item 9)
- `<Markdown ...>...</Markdown>` wrapper → routed to
  `parseMarkdown` per existing isProse dispatch path

**On serialize**:
- `markdown` with default attrs (col=1, colSpan=12, no row,
  rowSpan='auto') → unwraps to bare prose mdast (NO Markdown
  wrapper in MDX output)
- `markdown` with non-default attrs → emits
  `<Markdown col={N} colSpan={N}>...</Markdown>` wrapper

**Backward compat**: legacy MDX files with bare prose still
parse + serialize byte-equivalent (no wrapper introduced).
ROUND-TRIP invariant: bare-prose-in → markdown(default
attrs) → bare-prose-out. Critical for mdx-bridge's
fixture-driven round-trip tests; cf-25 ships a NEW fixture in
the round-trip suite covering this.

### D6 — Prose node-types covered: paragraph, heading (h1-h6), bulletList, orderedList, blockquote, codeBlock (NON-component), thematicBreak

The chunking pass folds these node types as "prose" (= eligible
for markdown wrapping). Excluded: `mdxJsxFlowElement` (each
JSX flow element is its own block per existing dispatch); `code`
mdast nodes are PROSE codeBlock (≠ the Code component block
which arrives as `mdxJsxFlowElement`). Ambiguity check: mdast's
`code` type IS the fenced-code-block from markdown source
(triple-backtick fenced); component blocks use the Code JSX tag and
arrive as `mdxJsxFlowElement` with `name: 'Code'`. The two are
unambiguous at the mdast level. Lists: WHOLE list (not list-item)
becomes prose — list-item granularity would fragment the list
visually.

### D7 — NodeView reuse: SAME `makeBlockNodeView` factory with ONE kind-specific branch for `NodeViewContent` vs `EditorView props={...}`

The factory ALREADY routes by `nodeName`; the cf-25 addition
is one early-return branch when `nodeName === 'markdown'`
that swaps the body content from `EditorView props={...} /` to
`NodeViewContent class='skb-prose' /`. ALL other gutter / drag /
kebab / resize / chrome wiring stays IDENTICAL. The 8 component
blocks continue through the existing path unchanged (regression
net: every cf-19/20a-e/22 spec stays byte-equivalent).

### D8 — Drag pipeline: NO special branch; markdown IS a per-block drag source

The cf-20c-2 drag pipeline keys off `blockId` (ProseMirror pos);
markdown blocks have their own pos like component blocks
do. drag-start on a markdown fires the same
`useDragDropPipeline` flow; applyDropMode treats it as one of
the existing kinds (no kind-specific drop logic in cf-20c-1
algebra; positions are kind-agnostic).

Q: drag handle vs text-selection conflict?
A: drag-handle button is in the gutter (NOT inside the editable
text area). Selecting prose text inside the markdown
stays the inline-selection gesture; dragstart begins from the
gutter button only. v2 reference uses the same pattern.

### D9 — Resize: cf-20d colSpan + rowSpan resize works on markdown

ColSpan resize: works identically to component blocks
(setNodeMarkup updates the colSpan attr). RowSpan resize:
markdown's natural rowSpan is `'auto'` (computed by
`useAutoRowSpan` from content height); a manual rowSpan resize
SETS the attr to an integer, OVERRIDING the auto behavior. This
matches the v2 reference: `block.rowSpan === 'auto' ? autoSpan :
block.rowSpan` (`/mnt/d/download/web/v2-app.jsx:310`). cf-25
implements the override path: when user drags the bottom-edge
resize handle, the rowSpan attr writes an integer; the `'auto'`
default re-engages only after a kebab "Reset row size" action
(NEW kebab item — out of cf-25 scope, deferred to cf-25b if user
demand emerges).

### D10 — Kebab: existing 3 actions (Delete, Duplicate, Change-kind) work on markdown with caveats

- **Delete**: works identically; removes the markdown
- **Duplicate**: copies the markdown + inner prose;
  identical to component-block duplicate (the existing
  `makeKebabDuplicate` uses Tiptap's `insertContentAt(end,
  node.toJSON())`)
- **Change-kind**: cf-20e Change-kind currently swaps the kind
  attr + applies new `defaultBlockAttrs` for the new kind.
  Markdown ↔ component-block swap is LOSSY (prose content
  doesn't map to component props; component props don't map
  to prose content). cf-25 LIMITS Change-kind on markdown:
  the menu hides the action OR shows it disabled with a
  tooltip "Change-kind not supported on Markdown blocks (would
  drop prose content)". Implementation: the existing
  `makeKebabChangeKind` reads the source kind; cf-25 adds an
  early-return when `sourceKind === 'markdown'`. NEW
  `disabledReason` field on the action item surfaces the tooltip.

### D11 — Keyboard a11y: cf-22 LiveAnnouncer + grid-coord drag work identically on markdown

The cf-22 LiveAnnouncer announces drag/resize/kebab actions by
kind label. cf-25 adds the `markdown` → "Markdown" label
mapping in `BLOCK_KIND_OPTIONS` (item 12) — this is the single
source consumed by cf-22's `formatDragMove`, `formatResize`,
`formatKebabAction`. No new format functions; existing format
helpers consume the new label.

### D12 — Read-route cf-23 D8 zero-affordance lock preserved: markdown renders `.skb-block-static` chrome with ZERO drag/kebab/resize affordances

The mdx-adapter (apps/site/src/lib/mdx-adapter.ts) wraps each
read-route block in `.skb-block-static` chrome. cf-25 extends
`BlockKindForChrome` with `'markdown'`; the adapter wraps
the inner Markdown render component (item 7
`MarkdownRenderView`) in the chrome. ZERO drag-handle / kebab
button / resize-handles emitted (those are editor-shell only;
mdx-adapter renders pure passive chrome). Regression net:
existing `notes-route-d8-zero-affordance.spec.ts` MUST keep
passing AND a NEW assertion in cf-25 spec (item 22) extends
the zero-affordance check to count markdown blocks.

### D13 — Palette: PaletteSidebar + PaletteModal + slash-menu all gain the Markdown item

The palette already lists 8 kinds; cf-25 makes it 9. Each surface
already iterates `BLOCK_KIND_OPTIONS`; the addition propagates
automatically once item 12's union expansion lands. Glyph: `¶`
(pilcrow) per D11.b ADR-0018 v0.9 amendment (intentionally
neutral typographic mark — distinguishes from the 8 colorful
component glyphs).

### D14 — Sample fixture (`content/notes/sample-blocks/index.mdx`): demonstrate mixed grid arrangement

The sample fixture is the canonical visual proof. cf-25 MUST add
ONE row demonstrating a markdown at `col=1 colSpan=6` paired
with a non-markdown block (image at `col=7 colSpan=6`) on the
same grid row. Without this, the AFTER screenshot visually looks
identical to BEFORE (every block defaults to full-width). The
side-by-side row is THE proof of the LEGO-baseboard mental model.

## Acceptance criteria (AC list)

1. **AC-1 PLAN/EXECUTE separation**: PR.md locked + visual demo
   screenshots (BEFORE state) exist BEFORE EXECUTE; orchestrator
   approves lock.

2. **AC-2 vitest test suite passes**: `pnpm test --filter=@skb/block-markdown
   --filter=@skb/mdx-bridge --filter=@skb/editor-shell` includes:
   - existing tests UNCHANGED count (regression net)
   - NEW parse-serialize.test.ts (6+ round-trip cases)
   - NEW markdown-chunking.test.ts (6+ chunking cases)
   - registry-wire.test.ts updated for 9 kinds

3. **AC-3 Playwright suite passes**: `pnpm --filter @skb/site exec
   playwright test` includes:
   - sample-blocks-markdown-blocks.spec.ts: 5 named test cases
     per e2e_smoke section
   - cf-22 + cf-20c-2 + cf-20d + cf-20e + cf-23 + cf-24 specs:
     all pass UNCHANGED (per D7 + D8 + D12 regression nets)
   - notes-route-d8-zero-affordance.spec.ts: extended to cover
     markdown kind (per D12)

4. **AC-4 typecheck passes**: `pnpm typecheck` clean — esp.
   BlockAffordanceKind union expansion + BlockKindForChrome
   union expansion + propsSchema export from block-markdown.

5. **AC-5 lint passes**: `pnpm lint` clean — esp. no `max-lines`
   warning (block-markdown source files target ≤80 LOC each;
   parse.ts/serialize.ts target ≤120/130 with the new chunking
   pass).

6. **AC-6 size-check passes**: every new file ≤500 LOC.

7. **AC-7 link-check passes**: lychee scan of NEW PR.md +
   ADR-0017 v0.5 D15 + ADR-0018 v0.9 D11 + CONTRACT updates
   reports no broken links. NO autolink-in-backticks patterns
   (per memory `feedback_lychee_autolink_in_backticks.md`).

8. **AC-8 visual archive emitted**: 5 NEW AFTER screenshots
   `wave-6-cf-25-after-edit-{1280,1024,768,375,1440}.png` +
   side-by-side mixed-row screenshot
   `wave-6-cf-25-after-edit-mixed-row.png` + read-route
   `wave-6-cf-25-after-read-1280.png` + 2 BEFORE screenshots
   already created during PLAN (`wave-6-cf-25-before-edit-1280-current-gap.png`
   + `wave-6-cf-25-before-edit-1280-gap-highlighted.png`).

9. **AC-9 build passes**: `pnpm build` (apps/site Astro + all
   packages) clean.

10. **AC-10 mdx-bridge round-trip invariant preserved**: NEW
    fixture in `packages/mdx-bridge/src/__tests__/fixtures/`
    covering bare-prose-in → markdown(default) →
    bare-prose-out byte-equivalence. Existing fixtures
    (01-paragraph.mdx through 06-nested-inline.mdx) all
    continue to round-trip byte-equivalent — they're all bare
    prose, so they fold into markdown(default) on parse
    AND unwrap to bare prose on serialize. Cite ADR-0016 D7
    end-state lock.

11. **AC-11 ADR-0011 D2 schema fields**: this PR.md has
    `title` + `files` + `acceptance` + `executor:` set per the
    D1 pipeline schema. Executor: `ux-ui-lead` (visual single
    authority per agent-contract.md) + `codex-generic-executor`
    (for the parse/serialize chunking + tests). Reviewer:
    `codex-pr-reviewer-55` + orchestrator stage 4 PRE-COMMIT
    CLAUDE REVIEW (D2 row 1 contract change + row 4 ADR
    amendment + row 2 NEW package addition fires this stage).

12. **AC-12 9th block kind verified**: `git grep -nE
    "BlockAffordanceKind|BLOCK_KIND_OPTIONS"` returns the new
    `markdown` entry across registry-wire.tsx + the 9
    kinds in `BLOCK_KIND_OPTIONS` array (length === 9). The
    palette renders 9 items at runtime (Playwright assertion).

13. **AC-13 cf-23 D8 zero-affordance lock preserved**: read
    route mounts markdown with `.skb-block-static` chrome
    + ZERO drag-handle / kebab / resize-handles in the read
    DOM. The existing
    `apps/site/playwright/notes-route-d8-zero-affordance.spec.ts`
    extends to cover markdown.

14. **AC-14 backward compatibility for legacy MDX**: any pre-cf-25
    MDX file with bare prose (no Markdown JSX wrapper) parses +
    serializes byte-equivalent. Test corpus: every file under
    `packages/mdx-bridge/src/__tests__/fixtures/` PLUS
    `content/notes/*/index.mdx` for each existing note that
    isn't `sample-blocks` (which intentionally introduces
    Markdown JSX wrappers in cf-25 item 18).

15. **AC-15 v2 mental model verified**: the side-by-side mixed-grid
    row in sample-blocks fixture (markdown col=1 colSpan=6
    + image col=7 colSpan=6) shows on the AFTER screenshot at
    1280 viewport with both blocks at IDENTICAL `top` ±2px
    (Playwright assertion in spec case 5). This is the visible
    proof per user's "整个 12×n 面板都可以容纳不同 block".

## Plan-challenger absorbtion (locked at PLAN)

Q1: Why Path B (one wrapper per chunk) instead of Path A (per-prose-element block)?
A1: v2 reference uses Path B exactly (`block.kind === 'markdown'`
holds a content string per chunk). The pre-built mdx-bridge
isProse seam (`mdxComponent === 'Markdown'`) is also Path B —
team already chose this direction at Wave 5 C.2-3.5. Path A
would require 6+ new BlockAffordanceKind variants, 6+ Tiptap
node-type extensions, 6+ MDX serializer variants, all to
preserve granularity that the user's "one functional block per
unit" mental model doesn't actually need.

Q2: Won't users want to drag a single heading independent of its surrounding paragraphs?
A2: Possibly, but the user's brief explicitly said "Markdown
should be a separate block" (singular). cf-25 ships chunk-level
granularity. A future "split markdown at cursor" gesture
(via slash-command `/split` or kebab "Split block here") can
fragment a chunk into multiple smaller markdowns if user
demand emerges. cf-25 deliberately defers this — splitting is
SEPARATE feature; cf-25 scope is "make prose grid-citizen".

Q3: How does ProseMirror's `content: 'block+'` interact with the cf-20b grid?
A3: The OUTER `markdown` node is the grid item (gets
`grid-column` from the cf-20b BlockNodeView wrapper style). The
INNER paragraph/heading/list nodes are NOT grid items — they're
ProseMirror children inside the markdown's content area.
The body container `<div class="skb-block-nodeview__body">`
sets `display: block` (existing CSS), so inner prose flows
naturally with text-flow layout. No grid-on-grid nesting.

Q4: What if an editor user types a slash inside a markdown, expecting the slash menu?
A4: The existing slash-menu listener (cf-21? cf-15?) attaches
to the editor at the document level, not to specific node types.
Typing `/` inside markdown content fires the slash menu
identically to typing in the legacy bare-prose context. The
selected slash-menu kind inserts the new block AT THE CURRENT
SELECTION (per existing `insertBlockKind` behavior); for a
markdown, that means the new block lands as a sibling
AFTER the markdown OR as an inner child depending on
ProseMirror's split-at-cursor semantics. cf-25 acceptance: this
behavior is OBSERVED + documented in spec case (TBD during TDD-write);
if surprising, fix-forward in cf-25b.

Q5: How does the chunking pass handle a doc starting with a JSX flow element (e.g. a Callout JSX element at line 1)?
A5: The chunking pass folds CONSECUTIVE prose nodes; a JSX flow
element breaks the chunk. A doc starting with the Callout JSX element then
prose then the Image JSX element then prose produces: [Callout block,
markdown(prose), Image block, markdown(prose)]. Empty
prose between two JSX flow elements produces no markdown
(zero-content chunks are dropped by the chunking pass).

Q6: Round-trip invariant: a doc with bare prose between two component blocks. Does it preserve byte-equivalence after a full read-write-read cycle?
A6: YES per AC-10. The bare prose folds to markdown(default
attrs) on parse; serializes back to bare prose on the unwrap
pass (default attrs trigger unwrap per D5). Round-trip is
byte-equivalent. Pinned in the new mdx-bridge fixture (item 23).

Q7: What about Markdown MDX tags with SOFT-newline content that violate ProseMirror's child schema?
A7: parseMarkdown (item 5) calls the recursive
mdastBlockToTiptap on each child of the JSX element — same
recursion the bare-prose path uses. ProseMirror children that
fail the schema (e.g. text node directly inside markdown,
which requires `block+`) wrap in an implicit paragraph per
ProseMirror's `defining: true` schema rule. Standard ProseMirror
behavior; tested via the parse-serialize round-trip.

Q8: Will `useAutoRowSpan` infinite-loop on a markdown with reflowable inner content?
A8: cf-20b/c `useAutoRowSpan` already handles reflow via 3-stage
jitter convergence (per use-auto-row-span.test.ts). The
markdown case is no different from a tall content block;
the hook's existing convergence logic applies.

Q9: Performance — every prose chunk now has a React component, NodeView lifecycle, drag/resize listeners, kebab portal. Does cf-25 regress edit-mode FCP/LCP?
A9: Potential concern. Mitigation:
- The 36-element BEFORE state already has 15 React components
  (the component blocks); cf-25 adds 6-8 more (one per prose
  chunk). 21 → 8 wrappers is a NET REDUCTION in DOM weight per
  block (the wrappers consolidate the 21 unwrapped elements).
- BlockNodeView is already heavily memoized (cf-20c-2 R2).
- React profiling pass at TDD-write phase to confirm no regression.
- Hard limit: if FCP regresses >100ms at viewport 1280,
  cf-25 is REWORKED (defer to fix-forward); orchestrator reviews
  the perf measurement at PRE-COMMIT CLAUDE REVIEW stage.

## Process (orchestrator EXECUTE flow per ADR-0011 D1)

1. **Stage 1 PLAN**: this PR.md + visual demo (DONE pre-lock).
2. **Stage 2 EXECUTE**: orchestrator dispatches `ux-ui-lead`
   subagent to author the visual layer (block-markdown
   ui-default + block-chrome.css per-kind stripe + ADR-0018
   v0.9 D11 amendment + sample-blocks fixture mixed-row).
   Then dispatches `codex-generic-executor` for the chunking
   + parse/serialize + ProseMirror schema layer (mdx-bridge
   chunking pass + parse.ts/serialize.ts edits + block-markdown
   core + registry-wire union expansion + tests). TDD-front:
   write tests → write impl. The codex-block-generator scaffolder
   may be useful for the block-markdown package skeleton (it
   templates against block-callout per its established pattern).
3. **Stage 3 REVIEW**: `codex-pr-reviewer-55` 9-point checklist;
   special attention to the round-trip invariant (AC-10 + AC-14).
4. **Stage 4 PRE-COMMIT CLAUDE REVIEW**: orchestrator self
   (D2 row 1 contract change + row 4 new ADR sections + row 2
   NEW package addition).
5. **Stage 5 COMMIT**: reviewer codex commits per ADR-0006 D8
   explicit-file-list staging.
6. **Stage 6 ACCEPT**: pr-writer subagent verifies diff matches
   acceptance: block above.

## Acceptance (D2 schema)

executor: ux-ui-lead + codex-generic-executor (split per visual
layer vs chunking/parse layer)
reviewer: codex-pr-reviewer-55 + orchestrator (stage 4 fires
per D2 row 1 + row 4 + row 2)
contract_changes: yes — `packages/mdx-bridge/CONTRACT.md` round-trip
section + `packages/editor-shell/CONTRACT.md` BlockAffordanceKind
union + `apps/site/CONTRACT.md` block kinds list +
`packages/block-markdown/CONTRACT.md` (NEW)
new_adr: ADR-0017 v0.5 D15 + ADR-0018 v0.9 D11 (amendments to
existing ADRs, not new ADR files)
risk_class: D2 row 1 (contract change) + row 4 (ADR amendment)
+ row 2 (NEW package `@skb/block-markdown`) → fires PRE-COMMIT
CLAUDE REVIEW
new_package: `@skb/block-markdown` — joins the 8-package block-*
family at parity (per `packages/block-callout` template)

## Honest scope estimate

22 source files + 5 doc files = 27 files total. ~1,150 LOC net
add. Estimated effort: 4-6 hours focused work post-lock. Risk
factors (LARGER than typical Wave 6 carry-forward PR):
- Round-trip invariant complexity (AC-10 + AC-14): chunking
  pass + unwrap-on-default pass must be perfectly inverse; one
  fixture mismatch breaks the entire mdx-bridge contract. May
  require multiple R-rounds.
- ProseMirror schema interaction: `markdown` with
  `content: 'block+'` is a schema modification that interacts
  with backspace-at-start, enter-creates-paragraph, slash-menu
  insert-position behaviors. Edge cases likely to surface during
  Playwright spec authoring.
- StarterKit Markdown extension interaction: tiptap-markdown
  serializer (in `prose-extensions.ts`) may double-serialize
  prose if not coordinated with the mdx-bridge chunking pass.
  Pre-EXECUTE spike needed.
- 9th BlockAffordanceKind expansion touches 4 packages
  (block-markdown NEW + mdx-bridge + editor-shell + apps/site)
  + 5 doc files; high cross-package coordination.
- Sample-blocks fixture rewrite + grid-rtt + grid-defensive
  tests in mdx-bridge MUST be updated together; partial updates
  break CI.

Multi-R rounds expected (predict 3-5 R-rounds before lock-PASS).
The cf-22 7-R + cf-23 5-R + cf-24 3-R history suggests cf-25
is in the 4-6-R range given the schema-change scope.

## Branch state

Cut from: `main` at `46de87c` (Wave 6 cf-24 squash-merged at
2026-05-10) — orchestrator/git-operator action; ux-ui-lead does
NOT cut branches per agent-contract.md `Forbidden: git_commit`.
Branch: `wave-6-cf-25-markdown-as-grid-blocks`
Diff vs main: PLAN-only at this point (the 2 BEFORE screenshots
under `docs/audits/screenshots/` are net-add; no source files
changed).

## Visual demo (BEFORE state, pre-lock)

- Current edit route at 1280 (raw):
  `docs/audits/screenshots/wave-6-cf-25-before-edit-1280-current-gap.png`
- Same view with the 21 unwrapped prose elements outlined
  in red dashed border + pink wash so the gap is visually
  obvious:
  `docs/audits/screenshots/wave-6-cf-25-before-edit-1280-gap-highlighted.png`

Visual gap (per BEFORE screenshots + DOM inventory):
- 36 top-level grid children inside `.ProseMirror`
- 15 are `.react-renderer.node-{kind}` wrappers around
  `.skb-block-nodeview` (the 8 component-block kinds with
  cf-19/20a-e affordances) — these look correct
- 21 are bare `p` / `h2` / `ul` HTML prose elements with
  CSS-fallback `grid-column: 1 / -1` — these are the gap; ZERO
  chrome, ZERO drag handle, ZERO kebab, ZERO per-kind hue
  stripe, ZERO resize affordances; the user perceives these as
  "one big block" because they have no visual block-citizen
  identity

cf-25 promotes those 21 unwrapped prose elements to (~6-8)
chunk-level `markdown` wrappers, each with the full cf-19
chrome + cf-20a-e affordance suite + cf-22 a11y + cf-23 D8
read-route lock + cf-24 PaletteSidebar item.

## Related

- [ADR-0017 v0.4 → v0.5 D15 amendment](../../decisions/ADR-0017-drag-drop-ux.md) — markdown wrapper-block drag semantics (no special branch)
- [ADR-0018 v0.8 → v0.9 D11 amendment](../../decisions/ADR-0018-v2-visual-migration.md) — markdown visual contract + `--accent-prose` token
- [ADR-0016 D2 + D7](../../decisions/ADR-0016-grid-data-model.md) — grid attrs schema authority + end-state lock
- [cf-19 PR.md](wave-6-cf-19-editor-block-visual-identity.md) — `.gblock` chrome + per-kind stripe (cf-25 adds 9th)
- [cf-20a PR.md](wave-6-cf-20a-stripe-cleanup-single-source.md) — paired `.skb-block-nodeview, .skb-block-static` selector (cf-25 inherits)
- [cf-20b PR.md](wave-6-cf-20b-grid-layout-substrate.md) — `.ProseMirror` is a 12-col grid (cf-25 makes prose first-class grid items)
- [cf-22 PR.md](wave-6-cf-22-keyboard-a11y.md) — LiveAnnouncer + grid-coord drag (cf-25 inherits via shared formatter)
- [cf-23 PR.md](wave-6-cf-23-read-mode-unification.md) — D8 zero-affordance read-route lock (cf-25 preserves)
- [cf-24 PR.md](wave-6-cf-24-component-library-sidebar.md) — PaletteSidebar (cf-25 adds 9th item)
- [agent-contract.md ux-ui-lead](../../../agent-contract.md) — visual single authority per ADR-0011 D7
- v2 reference: `/mnt/d/download/web/v2-app.jsx:265,309,315-316` (`block.kind === 'markdown'` Path B mental model)
- v2 styles: `/mnt/d/download/web/v2-styles.css` (existing `.gblock` chrome consumed by cf-19/20a)
- v2 markdown renderer: `/mnt/d/download/web/proto-markdown.jsx` (inline syntax reference; NOT a direct port — cf-25 uses StarterKit + tiptap-markdown for inline editing)
- mdx-bridge isProse seam: `packages/mdx-bridge/src/parse.ts:217` + `packages/mdx-bridge/src/serialize.ts:185` (existing pre-built hook cf-25 consumes)
