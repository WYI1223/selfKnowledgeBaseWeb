# Wave 6 cf-24 — Component library sidebar (left-rail palette per v2 reference; edit-route-only; HTML5 DnD insert + Cmd+K modal preserved)

> Wave 6 carry-forward — closes the user-stated "把侧边
> Component library sidebar 补全，全部按照 web 文件夹里的风格来"
> gap. cf-23 D9 D10 explicitly forward-pointed cf-24 as the owner
> of "v2-style left-rail palette + top-bar editor chrome" (ADR-0018
> v0.7 D9 §"范围边界" line 826). The current edit route at
> `/notes/[slug]/edit` mounts an EditorShellMount which hosts the
> editor + drag/resize/kebab/keyboard a11y pipelines but has NO
> left-rail palette; v2 reference (`/mnt/d/download/web/Block Editor v2.html`
> + `v2-app.jsx:108-159` + `v2-styles.css:38-100`) shows a 230px
> persistent left rail with a workspace pill, a "Drag to insert"
> section listing 4 categorized block-kind cards (each with glyph
> tile + label + description), and a tips/hint card pinned at
> bottom. cf-24 ships the persistent rail + drag-to-insert wire
> + ADR-0017 D14 amendment (external-source DnD path through
> `applyDropMode`) + the cf-23 D10 width-parity-lock resolution
> (read-route stays 1180px max-width; edit-route swaps to a
> two-column shell where `<aside class="palette">` consumes 230px
> + the EXISTING `<main class="notes-doc-wrap">` flex-1 fills the
> remainder). The existing `Cmd+K` modal Palette component (used by Wave
> 6 affordances tests + slash-menu siblings) STAYS as a separate
> overlay surface (renamed `PaletteModal` to disambiguate); the new
> persistent rail is `PaletteSidebar`.

## title

Add `apps/site/src/components/PaletteSidebar.tsx` (Astro client
island wrapping a new PaletteSidebar component exported from
`@skb/editor-shell`) that renders the v2-styled persistent left
rail on the edit route only. Modify `apps/site/src/layouts/BaseLayout.astro`
to accept a NEW optional prop `palette?: boolean = false` (mirror
of cf-23's `wide` opt-in pattern); when `palette` truthy, the
layout swaps from a single main element to a `flex` shell with
an `aside.palette-rail` (230px fixed-width via
`var(--palette-w)`) + the existing main element (flex-1, inherits the `wide`
notes-doc-wrap container at 1180px max-width — the rail does NOT
contend for doc-width). Modify
`apps/site/src/pages/notes/[...slug]/edit.astro` to pass
`<BaseLayout palette wide title={...}>` (read route at
`apps/site/src/pages/notes/[...slug].astro` does NOT pass palette
— per D2 below). Author NEW
`packages/editor-shell/src/palette-sidebar.tsx` (~180 LOC, persistent
rail React component) consuming `BLOCK_KIND_OPTIONS` + a NEW
`PALETTE_SIDEBAR_ITEMS` enriched array with `{ kind, label,
glyph, description }` per BLOCK_KIND_OPTIONS member. Each item
renders as a `<button class="pal-item">` with `draggable`
attribute setting `application/x-block-kind` MIME + a transparent
1×1 GIF drag image (per v2-app.jsx:131-141 protocol). Click also
inserts the block at end-of-document (keyboard-accessible
fallback per cf-22 a11y). Add NEW
`packages/editor-shell/src/drag-drop/external-drop-source.ts`
(~80 LOC) defining the external-source drag MIME contract +
typed dataTransfer marshalling helpers (`writeBlockKindToDataTransfer`
/ `readBlockKindFromDataTransfer`). Modify
`packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts`
to detect external-source drops via the new MIME (separate code
path from per-block drag — external source has no `sourceBlockId`,
so commitDropAtMatch CANNOT be reused; insert via
`insertBlockKind` at `dropTarget.col` / `dropTarget.row` / with
default `colSpan` from the kind's defaults). Author NEW
`packages/editor-shell/src/drag-drop/__tests__/external-drop-source.test.ts`
(MIME marshalling + safe-fallback on missing data). Add NEW
`apps/site/playwright/sample-blocks-palette-sidebar.spec.ts`
(~150 LOC) with 5 test cases:

1. **Visible on edit, hidden on read** — read route 0
   `[data-skb-palette-sidebar]`; edit route exactly 1.
2. **Renders 8 block-kind items** — each with kind label visible
   + glyph + description; matches `BLOCK_KIND_OPTIONS` length.
3. **Click inserts block** — click the "Callout" item; the main element
   gets a new `data-skb-block-kind="callout"` element appended.
4. **Drag inserts block** — drag the "Image" item over the grid;
   release at empty slot; new `data-skb-block-kind="image"` block
   appears at the drop position.
5. **Keyboard a11y** — Tab focuses palette items in DOM order;
   Enter on focused item inserts (LiveAnnouncer fires the cf-22
   `formatKebabAction('insert', kind)` analog).

Add NEW `apps/site/playwright/notes-route-width-parity.spec.ts`
amendment (extend, do NOT replace cf-23 spec) — at viewports
1280 / 1024, the main element width on read route is the locked cf-23
value AND the main element width on edit route is `read.main.width −
var(--palette-w) − var(--palette-gap)` within ±2px (where
palette-w = 230 + palette-gap = 0; the rail is OUTSIDE the
1180px doc-wrap, so edit-route MAIN width equals read MAIN width
MINUS rail-only). At 768 / 375 the palette is hidden via media
query (per D8 below) so width-parity reverts to cf-23 strict
parity. Author NEW visual archive screenshots at 4 viewports for
the edit route only (read route unchanged from cf-23):
`docs/audits/screenshots/wave-6-cf-24-after-edit-{1280,1024,768,375}.png`.

Amend `docs/decisions/ADR-0017-drag-drop-ux.md` to v0.4 with NEW
D14 "External-source drag protocol" documenting (a) MIME contract
`application/x-block-kind` (b) external-source drop has no
`sourceBlockId` so `applyDropMode` mutation receives a sentinel
INSERT marker rather than a swap (c) backwards compatibility:
existing per-block drag path unchanged (d) the v2-reference
parity rationale.

Amend `docs/decisions/ADR-0018-v2-visual-migration.md` to v0.8 with
NEW D10 "Edit-route palette-rail visual contract" documenting
(a) 230px fixed-width rail via `var(--palette-w)` token (NEW in
`@skb/design-tokens`) (b) palette items consume v2 `.pal-item`
visual identity (`oklch` border/bg/glyph hues already present)
(c) cf-23 D10 width-parity lock resolution: edit-route main width
= read-route main width MINUS rail width (parity is for
DOC-CONTENT not viewport-edge) (d) responsive: rail collapsed to
display:none below 768px (cf-20b 6→1 col breakpoint already
forces single-column edit; rail consumes too much real-estate at
that scale) (e) the existing Cmd+K modal Palette component (renamed
`PaletteModal`) stays as a separate surface for power users +
keyboard-only flows.

Update `apps/site/CONTRACT.md` "Layout shell" section (added by
cf-23) with the NEW `palette?: boolean` prop. Update
`packages/editor-shell/CONTRACT.md` "Public surface" with the
new PaletteSidebar export + the renamed PaletteModal (was
`Palette` named export) + the external-source drag MIME contract. Add 1
NEW design-tokens token: `--palette-w: 230px` to
`packages/design-tokens/src/tokens.css` :root with companion
ADR-0018 v0.8 D10.a citation comment.

## files

13 source files (~720 LOC net add — moderate-large PR; the bulk
is the new sidebar component + external-drop wire + Playwright
spec):

1. `packages/editor-shell/src/palette-sidebar.tsx` — **NEW**
   (~180 LOC). Persistent left-rail React component. Exports
   `PaletteSidebar` + `PaletteSidebarProps` + `PALETTE_SIDEBAR_ITEMS`.
   Mirrors v2-app.jsx:116-159 visual structure (workspace pill
   placeholder + "Drag to insert" h4 + 8 `<button class="pal-item">`
   cards + "Tips" hint card pinned `margin-top: auto`). Each
   item: `draggable={true}`, `onDragStart` writes
   `application/x-block-kind` MIME via the new
   `writeBlockKindToDataTransfer` helper (per D5), `onClick` calls
   `insertBlockKind(editor, kind)` for click-to-insert (cf-22
   keyboard a11y parity). Glyph mapping per D4 below (NOT the
   v2 4-category set; SKB has 8 atom-block kinds + needs
   per-kind glyphs).

2. `packages/editor-shell/src/drag-drop/external-drop-source.ts`
   — **NEW** (~80 LOC). External-source MIME contract:
   - `EXTERNAL_DROP_MIME = 'application/x-block-kind'` constant
   - `writeBlockKindToDataTransfer(dt: DataTransfer, kind: BlockAffordanceKind): void`
     — sets MIME + transparent drag image
   - `readBlockKindFromDataTransfer(dt: DataTransfer): BlockAffordanceKind | null`
     — parses MIME with `BLOCK_KIND_OPTIONS` whitelist (returns
     null on unknown / missing — never throws; Q4 absorbtion =
     palette-side typo or extension page-injection cannot crash
     the editor)
   - `EXTERNAL_DROP_SENTINEL = '__external_palette__' as const` —
     pipeline distinguishes `sourceBlockId === EXTERNAL_DROP_SENTINEL`
     branch (vs per-block id; D7 below)

3. `packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts`
   — **MODIFY** (~80 LOC delta). Add `setExternalDragKind(kind: BlockAffordanceKind | null)`
   imperative trigger called by `PaletteSidebar` `onDragStart`.
   When external-drag-kind set:
   - `dispatchLayout({ type: 'drag-start', sourceBlockId: EXTERNAL_DROP_SENTINEL })`
   - skip the per-block snapshot rect computation for the source
     (no source); rebuild edge-rects from the FULL block list
     (no source-lift)
   - on drop: `commitDropAtMatch` is BYPASSED in favor of
     `insertBlockKind(editor, kind)` followed by `setNodeMarkup`
     to write the `applyDropMode`-derived `{ col, row, colSpan,
     rowSpan }` onto the freshly-inserted block (the inserted
     block goes at end-of-doc by default; we then mutate its
     grid position to match the drop slot).
   - DO NOT TOUCH the per-block drag path; per-block code path
     stays IDENTICAL byte-for-byte
   - announce: `formatKebabAction('insert', kind)` + new
     `formatExternalDragMove(kind, col, totalCols)` (NEW format
     in `packages/editor-shell/src/a11y/announce-format.ts`)
   - keyboard mode for external drag is OUT OF SCOPE for cf-24
     (D9 below); only pointer drag from palette is supported

4. `packages/editor-shell/src/a11y/announce-format.ts` — **MODIFY**
   (~25 LOC delta). Add `formatExternalDragMove(blockKind, col,
   totalCols)` + `formatExternalDragCommit(blockKind, col)` per
   the cf-22 LiveAnnouncer message style (e.g. "Inserting Callout
   at column 3 of 12"). Add corresponding test rows in
   `packages/editor-shell/src/__tests__/a11y/announce-format.test.ts`
   (~15 LOC delta).

5. `packages/editor-shell/src/index.ts` — **MODIFY** (~10 LOC
   delta). Export `PaletteSidebar` + `PaletteSidebarProps` +
   `PALETTE_SIDEBAR_ITEMS` + the renamed `PaletteModal` (was
   `Palette`). The `Palette` named export is REMOVED in this
   PR (single-step rename — both surfaces are first-class permanent
   per D3; the modal is not deprecated, only renamed). Touch
   ALL existing `Palette` import sites in this same PR
   (1 site: `EditorShellMountInner.tsx:434`; 1 test:
   `affordances.test.ts:5+47`). Export
   `EXTERNAL_DROP_MIME` + `writeBlockKindToDataTransfer` +
   `readBlockKindFromDataTransfer` + `EXTERNAL_DROP_SENTINEL`
   from external-drop-source.ts.

6. `packages/editor-shell/src/__tests__/affordances.test.ts` —
   **MODIFY** (~10 LOC delta). The existing palette test asserts
   `palette opens with Ctrl+K and lists the 8 block kinds`;
   update import from `Palette` → `PaletteModal` (the alias
   keeps the old import alive too, but the test should use the
   canonical NEW name).

7. `packages/editor-shell/src/__tests__/drag-drop/external-drop-source.test.ts`
   — **NEW** (~90 LOC). Tests:
   - `writeBlockKindToDataTransfer` sets MIME + dropEffect copy
   - `readBlockKindFromDataTransfer` returns kind for valid MIME,
     null for missing, null for unknown kind name
   - `BLOCK_KIND_OPTIONS` whitelist check rejects 'evil-kind'
     (security — palette items are user-controlled in extension
     scenarios, so the read MUST validate against the registry)
   - sentinel string `EXTERNAL_DROP_SENTINEL` is distinct from
     any uuid pattern Tiptap might generate (negative test)

8. `apps/site/src/layouts/BaseLayout.astro` — **MODIFY**
   (~30 LOC delta). Add new optional prop
   `palette?: boolean = false`. When `palette` truthy:
   - Body wraps in `<div class="layout-with-palette">` (display:
     flex, height: 100vh)
   - Render `<aside id="palette-rail" class="palette-rail">`
     with `client:only` slot for the React PaletteSidebar component
     (mounted by EditorShellMount per D11 below — keeps the
     editor instance singleton)
   - `<main class={mainClassName} style={mainStyle}>` lives
     INSIDE the flex shell; mainClassName already includes
     `notes-doc-wrap` from cf-23 D9 wide path
   - When `palette` falsy: existing single-main-element flow
     unchanged (read route + `/`, `/search` continue to use the
     non-palette layout, no contention with cf-23 D9)
   - CSS: a NEW small block in the same file's `<style is:global>`
     OR add to `apps/site/src/styles/global.css` (decision deferred
     to D6) defining `.layout-with-palette` flex shell +
     `.palette-rail` 230px width (consumes `--palette-w`) +
     media query `@media (max-width: 768px) { .palette-rail
     { display: none; } }` per D8 mobile-collapse
   - Header/nav unchanged — header sits ABOVE the flex shell,
     palette begins below (per v2 `.app` shell `display: flex;
     height: 100%` consumes the FULL viewport, not just below
     the header; we deviate per D10 below)

9. `apps/site/src/pages/notes/[...slug]/edit.astro` — **MODIFY**
   (~2 LOC delta). Pass `<BaseLayout title={...} wide palette>`
   so the layout flips into 2-column flex shell mode. No other
   change.

10. `apps/site/src/components/EditorShellMountInner.tsx` —
    **MODIFY** (~40 LOC delta). Mount a PaletteSidebar instance
    via React portal targeting `#palette-rail` (the aside slot
    from BaseLayout). The portal pattern keeps `editor` +
    `pipeline` SINGLETON state with the editor mount (no
    duplicate Tiptap Editor instance, no duplicate
    `useDragDropPipeline` state machine). Implementation per
    cf-24 D11 contract:
    - `useState<HTMLElement | null>` for `paletteSlot`
    - `useEffect(() => { setPaletteSlot(document.getElementById
      ('palette-rail')); }, [editor])` resolves at hydration
      time (slot exists when BaseLayout was passed `palette`
      prop; absent on read route + non-notes routes)
    - Render: `{paletteSlot && editor && createPortal(
      <PaletteSidebar editor={editor}
      onDragKindChange={pipeline.setExternalDragKind} />,
      paletteSlot)}` — both guards required
    - Graceful degradation: slot absent → portal no-ops; editor
      null (pre-create / post-destroy) → portal no-ops;
      PaletteModal Cmd+K still works in either case (lives in
      the natural React tree alongside Toolbar).
    - Add `pipeline.setExternalDragKind` to the
      useDragDropPipeline return type (item 3 already covers
      this). Imperative trigger called by PaletteSidebar
      onDragStart.

11. `apps/site/playwright/sample-blocks-palette-sidebar.spec.ts`
    — **NEW** (~150 LOC). 5 test cases per "title" section
    above. Selectors: `[data-skb-palette-sidebar]` (root),
    `[data-skb-palette-item][data-skb-palette-kind=KIND]` (KIND ∈ BLOCK_KIND_OPTIONS)
    (per-item).

12. `apps/site/playwright/notes-route-width-parity.spec.ts` —
    **MODIFY** (~60 LOC delta). cf-23 spec measured `read.main`
    === `edit.main` ±2px at 4 viewports. cf-24 amendment per
    D9 Option A flex-sibling layout (3 bands):
    - **Band 1** (viewport ≥ 1410; rail + 1180-cap both fit):
      strict parity `edit.main.width = read.main.width = 1180`
      ±2px. NOTE: Standard 4-viewport set 1280/1024/768/375
      does NOT include any Band 1 viewport; spec adds an OPTIONAL
      Band 1 row at viewport 1440 to demonstrate the parity-
      restored behavior at desktop wide.
    - **Band 2** (1024 ≤ viewport < 1410; rail visible, cap may
      not bind on edit):
      - 1280: `edit.main.width ≈ read.main.width − 230` ±2px
        (read saturates at 1180 cap; edit at `1280 - 230 -
        margins(96) ≈ 954`; difference = `1180 - 954 = 226`).
        EMPIRICAL value locked at TDD-write phase — orchestrator
        directive: re-measure + lock as numeric absolute target.
      - 1024: `edit.main.width ≈ read.main.width − 230` ±2px
        (neither route's cap binds; both lose `margins(96)`
        symmetrically; rail is the only differentiator).
        EMPIRICAL value locked at TDD-write.
    - **Band 3** (viewport < 1024; rail hidden via media query):
      - 768: strict parity `edit.main.width = read.main.width`
        ±2px (cf-23 contract intact)
      - 375: strict parity (cf-23 contract intact)
    Add a NEW assertion: `aside.palette-rail` `display` computed
    style is `none` at 768/375 (visible at 1280/1024 + Band 1).
    The spec captures the Band-2 numeric targets DURING TDD-write
    (via Playwright `page.evaluate(() => main.getBoundingClientRect().width)`
    measurement) + locks them as absolute targets per cf-23 D10
    precedent (intentional regression net for future Tailwind
    config changes per cf-23 D10 "Neutral consequence" line).

13. `docs/decisions/ADR-0017-drag-drop-ux.md` — **MODIFY** (NEW
    D14 section, ~80 LOC delta). Amendment header bumps version
    v0.3 → v0.4. D14 "External-source drag protocol":
    - MIME contract `application/x-block-kind`
    - sentinel `EXTERNAL_DROP_SENTINEL` differentiating
      external-source from per-block drag in the pipeline state
    - external-source bypasses `commitDropAtMatch` (no
      `sourceBlockId` to swap), uses `insertBlockKind +
      setNodeMarkup(grid attrs)` instead
    - per-block drag path unchanged (regression net = the cf-22
      keyboard a11y spec + cf-20c-2 drag-handle spec MUST keep
      passing byte-equivalent)
    - keyboard-mode external drag = OUT OF SCOPE cf-24 (D9
      below); deferred to cf-25+ if needed
    - sister-doc updates: `packages/editor-shell/CONTRACT.md`

14. `docs/decisions/ADR-0018-v2-visual-migration.md` — **MODIFY**
    (NEW D10 section, ~110 LOC delta). Amendment header bumps
    v0.7 → v0.8. D10 "Edit-route palette-rail visual contract":
    - **D10.a**: 230px fixed-width rail via `--palette-w` token
      (NEW in `packages/design-tokens/src/tokens.css`)
    - **D10.b**: `.pal-item` v2 visual identity (border / bg /
      glyph hues all consume EXISTING ADR-0018 v0.5 D1 tokens
      `--accent-soft` / `--canvas-soft` / 145°-runnable / 60°-image;
      no NEW hue tokens)
    - **D10.c**: cf-23 D9-D10 width-parity lock RESOLUTION
      (Option A flex-sibling layout per cf-24 D9; 3 bands
      enumerated in cf-24 PR.md). Parity is for DOC-CONTENT
      widths at viewports where rail fits (Band 1, ≥1410); rail
      consumes 230px at 1024-1409 (Band 2; main shrinks); rail
      hidden at <1024 (Band 3; cf-23 strict parity restored).
      Document is intentional UX trade-off (editor user trades
      doc-wrap width for always-visible insert affordances).
    - **D10.d**: Mobile collapse @ 768px (display:none rail;
      consistent with cf-20b grid responsive 6→1 col flatten).
      Mobile insertion UX falls back to PaletteModal (Cmd+K).
    - **D10.e**: PaletteSidebar + PaletteModal coexist
      PERMANENTLY (NOT a deprecation chain). Sidebar = mouse-
      first discoverability + always-visible. Modal = power-
      user keyboard (Cmd+K) + the ONLY palette surface at
      < 768px viewports. Pattern precedent: VSCode (Cmd+P
      command bar + activity bar), Notion (Cmd+/ block menu +
      sidebar block library).
    - Sister-doc updates: `apps/site/CONTRACT.md` Layout shell;
      `packages/editor-shell/CONTRACT.md` Public surface;
      `packages/design-tokens/src/tokens.css` `--palette-w`;
      `packages/design-tokens/CONTRACT.md` token catalog.

    NOTE on D-numbering: ADR-0018 baseline (v0.5) shipped D1-D8.
    v0.6 (Wave 6 Stage B) appended D9-D16 prefixed with "v0.6 D9"
    .. "v0.6 D16". v0.7 (cf-23) appended a NEW "v0.7 D9" — same
    raw number but in a new versioned namespace per ADR-0018's
    amendment convention. v0.8 (cf-24) appends "v0.8 D10".
    The PR.md's local D1-D11 are a SEPARATE namespace specific
    to this PR (cf-24 internal decisions); the v0.8 D10 is the
    canonical ADR section name.

15. `apps/site/CONTRACT.md` — **MODIFY** (~30 LOC delta). Layout
    shell section: add `palette?: boolean` documentation +
    cross-ref ADR-0018 v0.8 D10 + the 4-viewport rail
    measurement table (rail width 230 / 230 / hidden / hidden).

16. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~40 LOC
    delta). Public surface: add `PaletteSidebar` row +
    `PaletteModal` rename row (was `Palette`; ATOMIC rename, no
    back-compat alias per cf-24 D3) + external-drop helper
    exports + cross-ref ADR-0017 v0.4 D14 + ADR-0018 v0.8 D10.e
    "two surfaces permanent".

17. `packages/design-tokens/src/tokens.css` — **MODIFY** (~3 LOC
    delta). Add `--palette-w: 230px;` to `:root` block. Inline
    cite comment `/* Wave 6 cf-24 D10.a per ADR-0018 v0.8 */`.

18. `packages/design-tokens/CONTRACT.md` — **MODIFY** (~5 LOC
    delta). Token catalog: add `--palette-w` row.

## D-decisions (orchestrator-locked at PLAN time)

### D1 — Palette scope: drag-and-drop INSERT + click-INSERT, no search/filter

v2 reference spec (`v2-styles.css:60-79` `.pal-item` cursor: grab
+ `v2-app.jsx:128-150` draggable + onDragStart MIME write) is
explicitly drag-to-insert, NOT a visual-only catalog. cf-24
matches: each item is `draggable={true}` + writes
`application/x-block-kind` MIME on dragstart. Click is the
keyboard-accessible fallback (per cf-22 a11y precedent —
draggable-only items violate WCAG 2.1.1 keyboard operability;
the v2 reference does not address this so cf-24 ratifies the
fallback). Search/filter is OUT OF SCOPE (only 8 kinds; v2
reference has no search; YAGNI).

### D2 — Palette mounted on EDIT route only (read route unchanged)

Read route is the published-document viewer; affordances (drag
handles, kebab menu, palette) are editor-mode chrome only per
cf-23 D8 zero-affordance lock. Adding palette to the read route
would (a) break cf-23 D8 spec (b) confuse readers who can't
"insert" a block on a read-only page (c) increase read-route
hydration cost. Edit route only.

### D3 — Existing `Palette` (Cmd+K modal) renamed to `PaletteModal`; both surfaces are PERMANENT first-class siblings

The existing `packages/editor-shell/src/palette.tsx` is a
keyboard-triggered modal overlay (Cmd+K) that lists 8 block
kinds in a centered dialog. It is consumed by:
- `apps/site/src/components/EditorShellMountInner.tsx:434`
  (where the `Palette` JSX element is rendered with editor +
  kinds props)
- `packages/editor-shell/src/__tests__/affordances.test.ts:5+47`

It serves a DIFFERENT use case from the cf-24 sidebar: power-user
keyboard-driven insertion (palette pops at cursor position via
modal). cf-24 sidebar = always-visible drag-source. Both surfaces
coexist PERMANENTLY (Notion command bar + sidebar, VSCode
command palette + activity bar). The Cmd+K modal stays useful
when the rail is hidden — at viewports < 768px (D8 rail-hidden
breakpoint), in future zen-mode toggles, or for keyboard-only
flows that prefer at-cursor insertion over end-of-doc append.

cf-24 ships:
- Rename existing component file `palette.tsx` → `palette-modal.tsx`
  + rename exported symbol `Palette` → `PaletteModal`
- NO deprecation alias; the rename is a single atomic step. All
  3 import sites (1 site + 1 test) update in the SAME PR
- New `PaletteSidebar` ships alongside; both are listed as
  first-class permanent exports in CONTRACT.md "Public surface"
- ADR-0018 v0.8 D10.e ratifies the two-surface UX as intentional
  (NOT a transitional state)

Rationale for dropping the original "deprecation alias" idea:
the alias would imply the modal is going away, but the modal is
the ONLY palette surface at < 768px viewports per D8 — it is
load-bearing for mobile insertion UX. Permanence is the correct
model.

### D4 — 8-item palette (per BLOCK_KIND_OPTIONS; NOT the v2 4-category collapsed set)

v2 reference shows 4 high-level kinds: markdown / canvas /
runnable / image. SKB has 8 atom-block kinds:
callout / componentCode / image / math / pdf / jupyter / nn-viz
/ agent-flow. Each is a distinct registered Tiptap node with
a distinct mdxComponent. Collapsing into v2's 4-bucket model
loses information (user can't insert a Math block by dragging
"runnable code"). cf-24 ships 8 items, each with a kind-specific
glyph. Glyph mapping (per D10.b ADR-0018):

| kind          | glyph | hue              | desc                        |
| ------------- | ----- | ---------------- | --------------------------- |
| callout       | !     | --accent (35°)   | Note · tip · warning · danger |
| componentCode | `</>` | 145° (runnable)  | TS · JS · Python · syntax-highlighted |
| image         | ◨     | 60° (image)      | Photo · figure · diagram    |
| math          | ∑     | 215° (canvas)    | KaTeX inline + display      |
| pdf           | 📄    | 60° (image)      | Embedded PDF + page select  |
| jupyter       | ▶     | 145° (runnable)  | Live notebook cell          |
| nn-viz        | ◇     | 215° (canvas)    | Neural network diagram      |
| agent-flow    | ⤳     | 215° (canvas)    | Agent step graph            |

Hue assignment maps SKB kinds onto v2 reference's existing
4-color hue palette (v2-styles.css:80-82). NOT introducing new
hues — re-uses the v2 token system.

### D5 — Insert mechanism: HTML5 DnD via `application/x-block-kind` MIME

Matches v2-app.jsx:135 protocol exactly (`e.dataTransfer.setData
('application/x-block-kind', it.id)`). Pipeline detects external
source via the MIME read at dragover/drop time. Sentinel
`EXTERNAL_DROP_SENTINEL` differentiates external drops from
per-block drops in the pipeline state machine (per-block has a
real `sourceBlockId` UUID; external uses the sentinel string).
On commit: `insertBlockKind(editor, kind)` appends a new node at
end of doc; `setNodeMarkup` then writes the `applyDropMode`-derived
`{col, row, colSpan, rowSpan}` to position it. ALTERNATIVE
considered + rejected: writing the new node directly at the
desired position via `editor.chain().insertContentAt(pos, {...})`
— rejected because pos calculation is brittle for atom-block
grid model; the append + setNodeMarkup pattern is what
`makeKebabDuplicate` (cf-20e) already uses, providing precedent.

### D6 — CSS lives in `apps/site/src/styles/global.css` (NOT inline `<style is:global>`)

The `.layout-with-palette` flex shell + `.palette-rail` rules
are page-shell CSS, conceptually adjacent to the existing
`grid.css` + `prose.css` / `global.css`. Adding to `global.css`
keeps inline style-block markup in BaseLayout.astro empty (the
existing FOUC bridge inline script is the only inline content per
cf-23). Selector `.palette-rail` is the v2 `.palette` analog;
SKB-prefix omitted because the rail is wholly OWNED by SKB
layouts (no third-party collision risk inside our app shell).

### D7 — Per-block drag path UNCHANGED — regression net via cf-22 + cf-20c-2 specs

The pipeline modification adds an external-source CODE PATH
gated on `sourceBlockId === EXTERNAL_DROP_SENTINEL`; existing
per-block path (when `sourceBlockId` is a real UUID) reaches the
same code IDENTICAL byte-for-byte. Regression net:
- `apps/site/playwright/sample-blocks-keyboard-a11y.spec.ts` (cf-22) — keyboard drag still works
- `apps/site/playwright/sample-blocks-drag-handle.spec.ts` (cf-20c-2) — pointer drag still works
- `apps/site/playwright/sample-blocks-resize-handles.spec.ts` (cf-20d) — unrelated, should be untouched
- `packages/editor-shell/src/__tests__/drag-drop/use-drag-drop-pipeline.test.ts` (existing) — pipeline state machine unchanged for per-block path

CI gates BOTH the new external-drop spec AND the existing per-
block specs.

### D8 — Mobile/tablet: palette `display:none` below 768px (matches cf-20b 6→1 col flatten)

cf-20b `useResponsiveCols` + `grid.css:97-110` already collapse
the editor to 1-column at 768px. Showing a 230px rail at that
viewport eats >60% horizontal real-estate for an empty gesture
(can't drag-to-position when there's only 1 col). Hide the rail
via `@media (max-width: 768px) { .palette-rail { display: none; } }`.
Future cf-25+ MAY add a hamburger-toggle drawer for mobile
insertion if user feedback demands it; cf-24 deliberately
skips that scope.

### D9 — Read route width-parity lock RESOLUTION (cf-23 D10 amendment, Option A — flex-sibling layout)

cf-23 D10 spec asserted `read.main.width === edit.main.width` ±2px
at 4 viewports. cf-24 BREAKS strict parity at viewports where the
230px rail is visible. The layout is **Option A flex-sibling**
(orchestrator-locked refinement #1): `<aside class="palette-rail">`
+ `<main class="notes-doc-wrap">` are direct flex children of a
flex-row container; main retains `max-width: 1180px` from cf-23
D9; rail consumes a fixed 230px; main gets the remainder up to
the cap. The math has THREE bands depending on the viewport:

**Band 1 — viewport ≥ 1410** (rail 230 + main 1180 + container
padding all fit; main saturates at the 1180 cap):
- `edit.main.width = 1180` ±2px
- `read.main.width = 1180` ±2px
- **Strict parity preserved** (both routes show full doc-wrap)

**Band 2 — 1024 ≤ viewport < 1410** (rail consumes 230 + container
padding; main gets `viewport - 230 - margins`, BELOW the 1180 cap):
- `edit.main.width = viewport - 230 - margins` (flex-1 fills the
  remainder of the parent after the fixed-width rail; the cap
  doesn't bind)
- `read.main.width = min(1180, viewport - margins)` (cf-23
  unchanged: at 1280 read fills toward 1180 cap; at 1024 read
  saturates at viewport-margins because cap doesn't bind)
- Difference is NOT a fixed 230 — it depends on whether the
  read-route cap binds at the viewport in question.

**Band 3 — viewport < 1024 (768 / 375)**: rail hidden via
`@media (max-width: 768px) { .palette-rail { display: none; } }`
per D8. Edit reverts to single-main-element layout (the flex
container collapses naturally because aside is `display:none`):
- `edit.main.width = read.main.width` ±2px
- **Strict parity preserved (cf-23 contract intact)**

**Spec assertion shape** (in `notes-route-width-parity.spec.ts`
amendment):
- Test rows are PARAMETRIZED by viewport. Each row asserts the
  RIGHT band formula above. Exact target widths are MEASURED
  during EXECUTE TDD-write phase + locked into the spec as
  numeric absolute targets (orchestrator directive: "Re-measure
  actual edit.main widths during EXECUTE TDD-write phase + lock
  the band targets in the spec").
- Pseudo-spec for the 4 standard viewports:
  - 1280 viewport (Band 2; cap doesn't bind on edit): assert
    `edit.main.width ≈ read.main.width − 230` ±2px (because
    `read.main` saturates at 1180 cap and `edit.main` is
    `1280 - 230 - margins ≈ 1050 - margins`; the EMPIRICAL
    measured value is locked at TDD-write)
  - 1024 viewport (Band 2; cap doesn't bind on either route):
    assert `edit.main.width ≈ read.main.width − 230` ±2px
    (both lose `margins` symmetrically; the rail is the only
    differentiator)
  - 768 viewport (Band 3): strict parity per cf-23
  - 375 viewport (Band 3): strict parity per cf-23
- The spec is UPDATED at TDD-write to the empirical values; the
  band formula is the AUTHORITATIVE rule. Numeric targets in
  the spec are verifications of the formula, not independent
  truths.

**Margins definition**: `margins` = horizontal padding consumed
by the wide-path container className (`px-4` = 16px each side at
< lg breakpoint, `lg:px-12` = 48px each side at ≥ 1024px). At
1280 (≥lg): `margins = 96`. At 1024 (≥lg boundary): `margins = 96`.
At 768 (<lg): `margins = 32`. At 375 (<lg): `margins = 32`.

**Conceptual reframe** (ratified in ADR-0018 v0.8 D10.c): the cf-23
parity contract was "DOC-CONTENT widths agree across read/edit so
identical block layouts render identically". cf-24 preserves that
INTENT — at viewports where rail fits (Band 1), both routes show
identical 1180px doc-wrap. At narrower viewports (Band 2), edit
gets less doc-wrap because the rail is a first-class affordance;
read keeps the wider doc because there is no rail to consume
viewport. This is intentional: the editor user TRADES doc-wrap
width for the convenience of always-visible insert affordances.

**ALTERNATIVES considered + rejected**:
- Option B (position:fixed overlay): rail floats above content;
  main width unchanged from read. Rejected: content occluded
  under the rail (can't hover/select underneath); v2 reference
  is flex-shell not overlay; z-index brittleness.
- Option C (smaller doc-wrap cap on edit, e.g. 950px): edit and
  read use DIFFERENT doc-wrap caps; visually creates a fixed
  ~230px gap at all viewports ≥ Band 1. Rejected: introduces
  TWO doc-wrap cap values (1180 read vs 950 edit), doubling
  the number of cf-23 D9 invariants; identical block widths
  would require viewport-specific css; complexity not worth
  the visual symmetry win.
- Option A (chosen): rail + main are flex siblings; main keeps
  the 1180 cap; rail consumes 230 fixed. Single doc-wrap cap
  invariant; simpler spec; matches v2 reference layout
  semantically.

### D10 — Header/nav stays ABOVE the flex shell (NOT v2-style topbar inside main)

v2 reference uses `display: flex; height: 100%` on `.app` and
puts the TOPBAR inside `.main` (above `.scroller`). SKB has an
existing site-wide header/nav (apps/site BaseLayout.astro
:97-106) carrying brand link + Search link + ThemeToggle. cf-24
keeps that header as-is OUTSIDE the flex shell:

```
┌──────────────────────────────────────┐
│ <header> SelfKnowledgeBaseWeb · Search · 🌙 │  ← unchanged
├──────────────────────────────────────┤
│ <aside class="palette-rail">         │
│   pal-item · pal-item · ...          │  ← cf-24 NEW
│                                       │
│  <main class="notes-doc-wrap">       │
│   doc title · 12-col grid · ...      │  ← editor (existing)
│  </main>                             │
└──────────────────────────────────────┘
```

This deviates from v2 reference (which has no global nav). cf-23
D9 explicitly noted "Outer chrome (`header` + `nav` + theme
toggle) 不动" — cf-24 carries forward that decision. v2's topbar
(breadcrumb · share button) is a DIFFERENT widget; cf-24 does
NOT add it (out of scope; breadcrumb implies multi-doc nav which
SKB's `[...slug]` route already implies).

### D11 — Sidebar mounted via React portal from EditorShellMountInner with explicit graceful-degradation semantics

The palette needs a live `editor` instance to call
`insertBlockKind`. The editor is created inside
`EditorShellMountInner` (the React island mounted by Astro
through the EditorShellMount client island). BaseLayout.astro is
server-rendered Astro and CANNOT directly host the React
component. Pattern: BaseLayout renders an empty
`aside.palette-rail` slot with id `palette-rail`;
EditorShellMountInner uses `createPortal` to render a
PaletteSidebar instance into that slot. This keeps the editor +
pipeline state singleton (no duplicate Tiptap Editor instance,
no duplicate `useDragDropPipeline` state machine).

**Implementation contract** (locked at PLAN per orchestrator
refinement #3 — graceful degradation explicit):

```
useEffect(() => {
  // Resolve slot at hydration time. BaseLayout server-renders
  // the slot only when palette={true} prop was passed; on
  // routes that don't pass palette (read route, /, /search),
  // the slot is absent and the portal MUST gracefully no-op.
  const slot = document.getElementById('palette-rail');
  if (!slot) {
    // Slot absent — palette gracefully degrades to "not
    // rendered". Cmd+K modal Palette still works (separate
    // component lives in the natural EditorShellMountInner
    // React tree).
    setPaletteSlot(null);
    return;
  }
  setPaletteSlot(slot);
}, [editor]);  // re-resolve on editor change (defensive;
              // editor identity is stable post-mount but the
              // dep ensures we re-check after any remount)

// In render:
{paletteSlot && editor && createPortal(
  <PaletteSidebar
    editor={editor}
    onDragKindChange={pipeline.setExternalDragKind}
  />,
  paletteSlot
)}
```

**Graceful degradation invariants**:
1. Slot absent → portal no-ops; PaletteModal (Cmd+K) still works
2. Editor null (pre-create or post-destroy) → portal no-ops; the
   sidebar would have nothing to insert into anyway
3. Re-mount of EditorShellMountInner (e.g. slug navigation)
   triggers useEffect cleanup + re-resolve; no stale portal
   targets persist

**Why not direct sibling render** (orchestrator-considered + rejected):
adding PaletteSidebar as a JSX sibling of EditModeBanner /
Toolbar / EditorShell inside EditorShellMountInner would put the
sidebar INSIDE the main element flow. The v2 reference layout +
Option A flex-sibling layout (D9) require the rail to be a flex
sibling of main, not nested inside it. Restructuring the entire
EditorShellMountInner JSX tree to expose a "rail slot" beside
the editor would force every consumer (today only one site, but
future apps may consume EditorShellMountInner) to wrap in the
flex shell. Portal localizes the layout coupling to BaseLayout
+ EditorShellMountInner contract (slot ID + portal target),
keeping EditorShellMountInner's internal JSX tree unchanged for
non-palette consumers (read route + tests).

ALTERNATIVE considered + rejected: making PaletteSidebar an
independent Astro client island that imports its own editor
reference via window-level singleton. Rejected because (a)
window-level state breaks SSR cleanliness (b) editor instance
is owned by EditorShellMountInner; sharing across islands
requires a global store (Zustand / Jotai) which is overkill
(c) portal is the React-canonical solution for "render in a
DOM target outside the natural component tree".

**Spec coverage**: AC-3 case 1 ("Visible on edit, hidden on
read") implicitly tests the graceful-degradation: read route
does NOT pass `palette` to BaseLayout → no slot → no portal →
ZERO `[data-skb-palette-sidebar]` matches. Edit route passes
`palette` → slot present → portal renders → exactly 1
`[data-skb-palette-sidebar]` match.

## Acceptance criteria (AC list)

1. **AC-1 PLAN/EXECUTE separation**: PR.md locked + visual demo
   screenshots exist BEFORE EXECUTE; orchestrator approves lock.

2. **AC-2 vitest test suite passes**: `pnpm test --filter=@skb/editor-shell`
   includes:
   - existing tests UNCHANGED count (regression net)
   - NEW external-drop-source.test.ts (4 cases per D7)
   - announce-format.test.ts gains 2 new format rows

3. **AC-3 Playwright suite passes**: `pnpm --filter @skb/site exec playwright test`
   includes:
   - sample-blocks-palette-sidebar.spec.ts: 5 test cases
   - notes-route-width-parity.spec.ts: amended per cf-24 D9
     Option A flex-sibling 3-band model: Band 3 (768/375; rail
     hidden) preserves cf-23 strict parity; Band 2 (1024/1280;
     rail visible) asserts band-formula `edit.main.width ≈
     read.main.width − 230` ±2px with EMPIRICAL absolute targets
     locked at TDD-write phase per orchestrator directive; the
     spec MAY add an OPTIONAL Band 1 row at 1440 to demonstrate
     cap-saturation parity-restored behavior
   - cf-22 + cf-20c-2 + cf-20d + cf-20e specs: all pass UNCHANGED
     (per-block code path regression net per D7)

4. **AC-4 typecheck passes**: `pnpm typecheck` clean (ApiAdapter
   + react-dom createPortal + new external-drop-source types
   + PaletteSidebarProps).

5. **AC-5 lint passes**: `pnpm lint` clean — esp. no `max-lines`
   warning (palette-sidebar.tsx target ≤180 LOC, hard limit
   500).

6. **AC-6 size-check passes**: every new file ≤500 LOC.

7. **AC-7 link-check passes**: lychee scan of NEW PR.md +
   ADR-0017 v0.4 D14 + ADR-0018 v0.8 D10 + CONTRACT updates
   reports no broken links. NO autolink-in-backticks
   patterns (per memory `feedback_lychee_autolink_in_backticks.md` —
   angle-bracket-word inside code spans triggers lychee's autolink
   scanner; PR.md MUST NOT contain that shape).

8. **AC-8 visual archive emitted**: 4 NEW screenshots
   `wave-6-cf-24-after-edit-{1280,1024,768,375}.png` + 2 BEFORE
   screenshots already created during PLAN
   (`wave-6-cf-24-before-v2-reference-1280.png` +
   `wave-6-cf-24-before-current-edit-1280.png`).

9. **AC-9 build passes**: `pnpm build` (apps/site Astro + all
   packages) clean.

10. **AC-10 cf-23 D10 width-parity SPEC AMENDMENT (not delete)**:
    `notes-route-width-parity.spec.ts` REMAINS in place; its
    assertions are EXTENDED (not removed) to handle palette
    visible/hidden conditions per D9. cf-23 contract is not
    deleted; it is refined.

11. **AC-11 ADR-0011 D2 schema fields**: this PR.md has
    `title` + `files` + `acceptance` + `executor:` set per the
    D1 pipeline schema. Executor: `ux-ui-lead` (visual single
    authority per agent-contract.md) + `codex-generic-executor`
    (for the pipeline + tests). Reviewer: `codex-pr-reviewer-55`
    + orchestrator stage 4 PRE-COMMIT CLAUDE REVIEW (D2 row 1
    contract change + row 4 ADR amendment fires this stage).

12. **AC-12 atomic rename verified**: `Palette` named export is
    REMOVED from `packages/editor-shell/src/index.ts`; ZERO
    occurrences of `Palette` (as a JSX element name OR import
    name) remain in the working tree post-EXECUTE per
    `git grep -nE '\\bPalette\\b' -- '*.ts' '*.tsx'` returning
    only `PaletteModal` / `PaletteSidebar` / `PaletteSidebarProps`
    / `PALETTE_SIDEBAR_ITEMS` matches. NO deprecation alias
    (per D3 — both palette surfaces are permanent first-class).

13. **AC-13 keyboard a11y parity**: palette items are
    HTML button elements (NOT div elements with `role="button"`)
    so default Tab focus works; Enter triggers click handler
    (insertBlockKind);
    LiveAnnouncer fires the cf-22 announce message. Manual
    verification + Playwright assertion in AC-3 spec case 5.

## Plan-challenger absorbtion (locked at PLAN)

Q1: Why both PaletteSidebar AND keep PaletteModal?
A1: Two surfaces for two flows. Sidebar = mouse-first
discoverability + always-visible categorization. Modal = power-
user keyboard-first (Cmd+K) at-cursor insertion. v2 reference
+ Notion + VSCode all coexist this pair. Rename disambiguates.

Q2: Why portal pattern instead of duplicate editor instance?
A2: Multiple Editor instances in the same DOM crash Tiptap
schema validation (collisions on extension singletons). Portal
is canonical React solution for this exact problem.

Q3: Why `application/x-block-kind` MIME instead of internal
React state?
A3: HTML5 DnD requires DataTransfer for cross-document drop
correctness (extension panels, future split-pane editor). MIME
is the v2 reference protocol; matching it = the path of least
deviation cost. Internal state would still need DataTransfer
for the dragImage anyway.

Q4: Why whitelist BLOCK_KIND_OPTIONS in
readBlockKindFromDataTransfer?
A4: Browser extensions or page injections can write arbitrary
MIME values. Without validation, an attacker writing
`application/x-block-kind` = `eval('...')` could trigger code
execution if our pipeline blindly trusts the value. Whitelist =
defense in depth.

Q5: Why hide palette at 768/375 instead of making it a hamburger?
A5: cf-20b already collapses grid to 1 col at 768. A 1-col
editor + 230px rail = ~145px content area at 768px viewport,
unusable. cf-24 punts the mobile-first insertion UX to cf-25+
if user demand emerges. YAGNI.

Q6: Why 8 items not 4-category collapsed?
A6: Each SKB block kind has distinct propsSchema + MDX
component; collapsing loses dispatch information (user can't
insert Math via "runnable" category). v2 reference's 4 buckets
were a designer's mockup of category-style UX; SKB ships
explicit kind selection per existing slash-menu + Cmd+K modal
patterns.

Q7: Why announce format `formatExternalDragMove` SEPARATE from
`formatDragMove`?
A7: cf-22 `formatDragMove` reads "Moving Callout to column 3 of
12" (existing block being moved). External drag reads
"Inserting Callout at column 3 of 12" — different verb, different
user model. Separate format keeps message clarity per WCAG
4.1.3.

Q8: What about touch / mobile drag?
A8: Out of scope (per ADR-0017 D9). Rail is hidden < 768px so
the question doesn't arise on mobile viewports. Tablet (768-
1023) still has rail visible AND HTML5 native DnD on touch is
unreliable; touch users will use click-to-insert (cf-22 keyboard
parity precedent — click acts as a synonym for Enter on focused
item). Spec case 3 covers this.

## Orchestrator refinement absorbtion (R1, locked 2026-05-10)

Three refinements requested between PLAN-draft v0 and lock-ready v1:

**Refinement #1 (CRITICAL) — D9 width-parity math correction**:
v0 said `edit.main = read.main − 230` at all rail-visible
viewports, which assumes the read main is wider than the edit
main by exactly the rail width. The math fails because read.main
caps at 1180 (cf-23 D9 max-width) and the cap may or may not bind
depending on viewport. v1 D9 enumerates 3 BANDS:
- Band 1 (viewport ≥ 1410): rail + 1180-cap fits → strict parity
  preserved at 1180
- Band 2 (1024 ≤ viewport < 1410): rail visible; main shrinks
  below cap on edit; the simple `read - 230` formula is approximate
  (read may saturate at cap while edit does not)
- Band 3 (viewport < 1024): rail hidden → cf-23 strict parity
  intact

EMPIRICAL Band 2 numeric targets are MEASURED at TDD-write phase
+ locked into the spec as absolute numbers (cf-23 D10 precedent
— intentional regression net for future Tailwind config changes).
ABSORBED.

**Refinement #2 — D3 wording contradiction**:
v0 said both "both surfaces coexist" AND "deprecation alias for
one PR cycle" — contradictory. v1 D3 chose option (a) per
orchestrator recommendation: both surfaces are PERMANENT
first-class siblings. NO deprecation alias. The Cmd+K modal is
load-bearing for mobile insertion UX (rail hidden < 768px).
Atomic rename `Palette` → `PaletteModal` in the same PR; all
import sites updated together. AC-12 rewritten as "atomic rename
verified" with `git grep` invariant. ABSORBED.

**Refinement #3 — D11 portal pattern with explicit graceful
degradation**:
v0 D11 used the portal pattern but did not document the slot-
absent failure mode (read route does not pass `palette` prop →
no slot → portal must no-op). v1 D11 adds explicit useEffect
implementation contract + 3 graceful-degradation invariants
(slot absent / editor null / re-mount). v1 also documents why
direct sibling render in EditorShellMountInner was rejected
(would couple all consumers to the flex shell layout; portal
localizes the coupling to the BaseLayout slot ID + Mount
contract). Spec coverage explicit: AC-3 case 1 implicitly tests
graceful degradation. ABSORBED.

**Approval gates per orchestrator directive**: D1 / D2 / D4 / D5 /
D6 / D7 / D8 / D10 stand as v0; D3 / D9 / D11 absorb the
refinements above; both ADR-0017 v0.4 D14 (DnD external-source
protocol) AND ADR-0018 v0.8 D10 (palette-rail visual contract)
amendments LOCKED in this PR (NOT optional alternatives — both
are required per orchestrator directive on amendment scope).

## Process (orchestrator EXECUTE flow per ADR-0011 D1)

1. **Stage 1 PLAN**: this PR.md + visual demo (DONE pre-lock).
2. **Stage 2 EXECUTE**: orchestrator dispatches `ux-ui-lead`
   subagent to author the visual layer (PaletteSidebar.tsx +
   palette-rail CSS + ADR-0018 v0.8 D10 amendment). Then
   dispatches `codex-generic-executor` for the pipeline +
   test layer (external-drop-source.ts + use-drag-drop-pipeline.ts
   modification + announce-format.ts + tests). TDD-front: write
   tests → write impl.
3. **Stage 3 REVIEW**: `codex-pr-reviewer-55` 9-point checklist.
4. **Stage 4 PRE-COMMIT CLAUDE REVIEW**: orchestrator self
   (D2 row 1 contract change + row 4 new ADR sections).
5. **Stage 5 COMMIT**: reviewer codex commits per ADR-0006 D8
   explicit-file-list staging.
6. **Stage 6 ACCEPT**: pr-writer subagent verifies diff matches
   acceptance: block above.

## Acceptance (D2 schema)

executor: ux-ui-lead + codex-generic-executor (split per visual
layer vs pipeline layer)
reviewer: codex-pr-reviewer-55 + orchestrator (stage 4 fires per
D2 row 1 + row 4)
contract_changes: yes — `apps/site/CONTRACT.md` Layout shell
extension + `packages/editor-shell/CONTRACT.md` public surface
extension + `packages/design-tokens/CONTRACT.md` token catalog
extension
new_adr: ADR-0017 v0.4 D14 + ADR-0018 v0.8 D10 (amendments to
existing ADRs, not new ADR files)
risk_class: D2 row 1 (contract change) + row 4 (ADR amendment) →
fires PRE-COMMIT CLAUDE REVIEW

## Honest scope estimate

13 source files + 4 doc files = 17 files total. ~720 LOC net
add. Estimated effort: 3-4 hours focused work post-lock. Risk
factors:
- React portal target timing (BaseLayout.astro server-renders
  the slot; EditorShellMountInner client-mount must wait for
  hydration to find the slot — useEffect + ref-or-querySelector
  with retry needed)
- HTML5 DnD across iframe-style React tree boundaries (palette
  + editor share docroot in cf-24 design, so this should be
  fine, but if portal target lives outside the body element
  would break)
- Width-parity spec amendment must NOT regress cf-23 strict
  parity at hidden-rail viewports (D8 + D9)

## Branch state

Cut from: `main` at 5ea03cb (Wave 6 cf-23 squash-merged at
2026-05-10)
Branch: `wave-6-cf-24-component-library-sidebar`
Diff vs main: empty (PLAN-only at this point)

## Visual demo (BEFORE state, pre-lock)

- v2 reference 1280: `docs/audits/screenshots/wave-6-cf-24-before-v2-reference-1280.png`
- current edit route 1280: `docs/audits/screenshots/wave-6-cf-24-before-current-edit-1280.png`

Visual gap: v2 reference shows the persistent left rail with
workspace pill + 4 large drag-cards + tips card. Current edit
route has NO sidebar — header + edit-mode banner + toolbar +
content take the full 1180px doc-wrap with no rail.

## Related

- [ADR-0017 v0.3 → v0.4 D14 amendment](../../decisions/ADR-0017-drag-drop-ux.md) — external-source drag protocol
- [ADR-0018 v0.7 → v0.8 D10 amendment](../../decisions/ADR-0018-v2-visual-migration.md) — palette-rail visual contract
- [cf-23 PR.md](wave-6-cf-23-read-mode-unification.md) — cf-23 D10 width-parity lock that this PR amends
- v2 reference: local file at `~/download/web/Block Editor v2.html` (resolved from `/mnt/d/download/web/`) — visual source of truth (local-only designer mock; NOT a published URL)
- v2 source: `/mnt/d/download/web/v2-app.jsx` lines 108-159 (palette component) + 590-740 (drag-protocol + drop wire)
- v2 styles: `/mnt/d/download/web/v2-styles.css` lines 38-100 (the `.app` / `.palette` / `.pal-item` visual contract)
- [agent-contract.md ux-ui-lead](../../../agent-contract.md) — visual single authority per ADR-0011 D7
