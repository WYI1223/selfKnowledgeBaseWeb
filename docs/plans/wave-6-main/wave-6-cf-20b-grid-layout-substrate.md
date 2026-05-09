# Wave 6 cf-20b — Editor-surface 12-col CSS Grid substrate (`.ProseMirror` → grid + per-block placement + ADR-0016 v0.2 D11.1 amendment)

> Wave 6 carry-forward — promotes the editor surface to the v2 12-col
> CSS Grid model per `/mnt/d/download/web/v2-styles.css:137-147`
> `.doc { display: grid; grid-template-columns: repeat(12, ...); ...; gap: var(--gap) }`,
> with per-block `style.gridColumn` / `style.gridRow` derived from
> `node.attrs.{col, colSpan, rowSpan}` per ADR-0016 D2 + ADR-0016 v0.2
> D11.1 amendment (NEW; this PR ships the amendment + the
> implementation atomically). Sample-blocks fixtures are all
> `colSpan=12` so visually this is a no-op verified by the new
> `sample-blocks-grid-layout.spec.ts` Playwright lock; the value is
> the substrate cf-20c-2 drag/cf-20d resize will mutate.

## title

Add a NEW `packages/editor-shell/src/grid-style.ts` module exporting
`gridPlacementStyle(pos) → CSSProperties` + `gridPlacementStyleAttr(pos) → string`
(Astro inline-style serializer) + `extractGridPosition(attrs) → GridPlacementInput | null`
(defensive coercion). Modify `apps/site/src/styles/grid.css` to add
the editor-surface two-level grid rules per ADR-0016 v0.2 D11.1
amendment: `.skb-grid > .skb-editor-content { grid-column: 1 / -1 }`
and `.skb-grid .ProseMirror { display: grid; grid-template-columns:
repeat(12, minmax(0, 1fr)); grid-auto-rows: minmax(var(--row-h), auto);
gap: var(--gap); grid-auto-flow: row; white-space: normal }`. Modify
`packages/editor-shell/src/EditorShell.tsx` to ALWAYS apply the
`skb-editor-content` className to `<EditorContent>` so the grid CSS
rule can target it. Modify `packages/editor-shell/src/BlockNodeView.tsx`
to read `node.attrs.{col, row?, colSpan, rowSpan}` and apply
`gridPlacementStyle()` to the `.skb-block-nodeview` wrapper. Modify
`apps/site/src/lib/mdx-adapter.ts` to extract grid position from MDX
flat props and apply `gridPlacementStyle()` to the `.skb-block-static`
wrapper (5 light blocks). Modify the 3 heavy block Astro wrappers
(`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`) to apply
`gridPlacementStyleAttr()` to the `.skb-block-static` shell (the
deep-subpath import `@skb/editor-shell/src/grid-style.ts` AVOIDS
pulling the editor-shell barrel into Astro SSR — barrel pulls
React/Tiptap/TF.js transitively and breaks `astro build`). Add
ADR-0016 v0.2 D11.1 amendment section locking the editor-surface
two-level grid model + the prose-interleave decision (full per
`proseGridDefaults`) + the arrow-key visual-vs-source-order
limitation note. Update `packages/editor-shell/CONTRACT.md` and
`apps/site/CONTRACT.md` with the new public surface + grid model.
Update `apps/site/src/__tests__/grid-css.test.ts` with assertions
locking the cf-20b CSS rules. Add NEW
`packages/editor-shell/src/__tests__/grid-style.test.ts` (20 vitest
tests covering the formula). Add NEW
`apps/site/playwright/sample-blocks-grid-layout.spec.ts` (2 tests
locking edit + read route grid placement). `--row-h` and `--gap`
tokens already in `packages/design-tokens/src/tokens.css:79-80` (no
add needed; verified during PLAN per Q8).

## files

13 source files (~470 LOC; mostly NEW grid-style module + grid.css
extension + test specs):

1. `packages/editor-shell/src/grid-style.ts` — **NEW** (~115 LOC).
   Single source of the `BlockGridPosition → CSSProperties` formula
   per ADR-0016 D2. Exports: `GridPlacementInput`, `GridPlacementOptions`,
   `gridPlacementStyle`, `gridPlacementStyleAttr`, `extractGridPosition`.
   Three consumers (BlockNodeView.tsx editor + mdx-adapter.ts
   light-block read + 3 heavy-block .astro wrappers) all import from
   here so the formula stays byte-equal across paths.

2. `packages/editor-shell/src/__tests__/grid-style.test.ts` — **NEW**
   (~145 LOC, 20 tests). Covers the formula for the canonical
   full-width fixture, explicit row + colSpan combos, `rowSpan='auto'`
   substitution with default and caller-provided `autoRowSpan`,
   defensive `extractGridPosition` validation (missing fields, invalid
   col, invalid rowSpan, ignored extra props), and cross-consumer
   parity (`gridPlacementStyleAttr` byte-equal to
   `gridPlacementStyle` JSX-spread form).

3. `packages/editor-shell/src/index.ts` — **MODIFY** (+5 LOC).
   Adds barrel exports for the 3 helper functions + 2 type interfaces.

4. `packages/editor-shell/src/EditorShell.tsx` — **MODIFY** (~10 LOC).
   `<EditorContent>` always gets `className="skb-editor-content"`
   (concat with consumer className when supplied). Required so the
   apps/site grid CSS rule `.skb-grid > .skb-editor-content` can
   target it.

5. `packages/editor-shell/src/BlockNodeView.tsx` — **MODIFY** (~25
   LOC). Imports `extractGridPosition` + `gridPlacementStyle` from
   the local `./grid-style` module. Both the registered-UI path AND
   the unregistered-fallback path now apply `style={wrapperStyle}` to
   the `<NodeViewWrapper>`. When `node.attrs` is missing required grid
   fields (test mounts without grid-attr defaults), wrapperStyle is
   undefined and the parent CSS fallback
   `.skb-grid .ProseMirror > *:not([style*="grid-column"])` paints
   full-width.

6. `apps/site/src/styles/grid.css` — **MODIFY** (~70 LOC delta in
   cf-20b R0; +40 LOC in cf-20b R1 hotfix; was 56 LOC at R0 baseline,
   now ~155 LOC). cf-20b R0 adds the editor-surface grid rules:
   `.skb-grid > .skb-editor-content { grid-column: 1 / -1 }` (so the
   intermediate Tiptap host div spans the outer grid full-width and
   the inner `.ProseMirror` element inherits container width) and
   `.skb-grid .ProseMirror { display: grid; ... }` (the inner 12-col
   grid). Extends the existing `:not([style*="grid-column"])`
   fallback selector list to also cover `.skb-grid .ProseMirror > *`
   so prose nodes inside the editor (`<p>`, `<h2>`, `<ul>`) without
   explicit grid placement render full-width by default. **R1 hotfix
   (per D9)**: extends the `@media (max-width: 768px)` block with
   4 mobile-scoped rules: `grid-column: 1 / -1 !important` +
   `min-width: 0 !important` on `.skb-grid > *, .skb-grid .ProseMirror > *,
   .skb-grid .skb-block-static, .skb-grid .skb-block-nodeview` (selector
   list covers BOTH wrapper depths since `.skb-block-static` is nested
   in `.skb-prose`, NOT a direct grid child); `max-width: 100% !important`
   on `.skb-grid .heavy-block-skeleton`; `overflow-x: auto` on the
   wrapper classes for defense-in-depth. `!important` is intentional
   per D9 — beats cf-20b inline `style="grid-column: ..."` which
   would otherwise leak desktop placement into mobile viewport
   producing 12× horizontal overflow.

7. `apps/site/src/lib/mdx-adapter.ts` — **MODIFY** (~20 LOC delta).
   Imports `extractGridPosition` + `gridPlacementStyle` from the
   deep-subpath `@skb/editor-shell/src/grid-style.ts` (NOT the
   barrel, because the barrel pulls React/Tiptap/TF.js transitively
   and breaks `astro build` SSR with `require is not defined in ES
   module scope`). The wrapper now applies `style={wrapperStyle}` to
   the `.skb-block-static` div when `extractGridPosition` returns a
   valid position; the `.skb-grid > *:not([style*="grid-column"])`
   read-route fallback handles the null path.

8. `apps/site/src/components/Jupyter.astro` — **MODIFY** (~10 LOC).
   Imports `extractGridPosition` + `gridPlacementStyleAttr` from the
   deep-subpath `@skb/editor-shell/src/grid-style.ts`. Applies the
   computed `style={styleAttr}` to the existing `.skb-block-static`
   shell.

9. `apps/site/src/components/NnViz.astro` — **MODIFY** (~10 LOC).
   Same pattern with `data-skb-block-kind="nn-viz"`.

10. `apps/site/src/components/AgentFlow.astro` — **MODIFY** (~10 LOC).
    Same pattern with `data-skb-block-kind="agent-flow"`.

11. `apps/site/src/__tests__/grid-css.test.ts` — **MODIFY** (~25
    LOC). Adds assertions locking the cf-20b `.skb-grid > .skb-editor-content`
    + `.skb-grid .ProseMirror` rules + the extended fallback selector
    + the inner-grid `display: grid + grid-template-columns: repeat(12, ...)
    + grid-auto-flow: row` block. Also asserts the inner grid does
    NOT use `grid-auto-flow: dense` (per ADR-0016 D1 contract).

12. `apps/site/playwright/sample-blocks-grid-layout.spec.ts` —
    **NEW in cf-20b R0** (~225 LOC, 2 tests). Edit-route test verifies all 3
    layers: outer `.skb-grid` is 12-col grid; inner `.ProseMirror`
    is 12-col grid with each cell > 10px wide (catches the cf-20b R0
    `display: contents` bug where Chrome computed 12 zero-width
    columns); each `.skb-block-nodeview[data-skb-block-kind="<kind>"]`
    has explicit `gridColumn` (NOT `auto`). Read-route test asserts
    `.skb-block-static` carries inline `grid-column: 1 / span 12`
    style emitted by the mdx-adapter / Astro wrappers. Emits
    screenshot to `docs/audits/screenshots/wave-6-cf-20b-sample-blocks-grid-layout.png`.
    **R1 hotfix +1 test (~50 LOC delta; total now ~275 LOC, 3 tests)**:
    `cf-20b R1: mobile (≤768px) viewport — blocks force-fill 1-col
    regardless of inline grid-column` resizes viewport to 375×812,
    asserts (a) computed `grid-column === '1 / -1'` on every BlockKind
    wrapper (catches inline-style override leak per D9), (b)
    `document.documentElement.scrollWidth ≤ 393px` (catches horizontal
    overflow with 18px scrollbar slack). Locks the immediate symptom
    AND the underlying CSS specificity contract.

13. `docs/decisions/ADR-0016-grid-data-model.md` — **MODIFY** (~115
    LOC delta). Adds the v0.2 D11.1 amendment section after D11
    documenting: the trigger (D8 covers Astro static-render only;
    D11 covers prose-data-flow only; editor-mount path was a silent
    gap), the two-level grid decision (outer `.skb-grid` + inner
    `.ProseMirror`), the per-block placement formula, the
    `gridPlacementStyle` / `gridPlacementStyleAttr` /
    `extractGridPosition` shared-helper authority table (3 consumers,
    1 source), the prose-interleave decision (full per
    `proseGridDefaults`), the arrow-key visual-vs-source-order
    limitation, the out-of-Tiptap mutation discipline reaffirmation,
    the SSR-vs-hydration phase note (cf-20b emits final placement at
    SSR; no fallback dims needed), and the sister-doc sync list. The
    ADR header `状态` field is updated to record the v0.2 amendment.

14. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~85 LOC delta).
    Updates the existing "Grid layout (Wave 5)" section's
    `GridContainer` description to note the cf-20b editor-mount usage
    (no longer "deferred"). Adds two NEW subsections at the end of
    that section: "Editor-surface grid lock (Wave 6 cf-20b; ADR-0016
    v0.2 D11.1 amendment)" documenting the two-level grid + the
    arrow-key limitation; "Grid placement helpers (Wave 6 cf-20b;
    shared single source)" documenting the new `gridPlacementStyle`
    / `gridPlacementStyleAttr` / `extractGridPosition` public surface
    + the deep-subpath import requirement for Astro SSR.

15. `apps/site/CONTRACT.md` — **MODIFY** (~25 LOC delta). Updates
    the "Grid layout (Wave 5)" bullet list: replaces the C.2-3
    "container-only / deferred to C.2-4" bullet with the cf-20b
    landing description; extends the transitional fallback bullet
    to mention `.skb-grid .ProseMirror > *` covers prose-inside-editor;
    adds a NEW "Editor-route two-level grid lock" bullet documenting
    the `.skb-grid > .skb-editor-content` + `.skb-grid .ProseMirror`
    cf-20b rules; adds the ADR-0016 v0.2 D11.1 amendment forward
    pointer to the architectural-pointers list.

16. `docs/plans/wave-6-main/wave-6-cf-20b-grid-layout-substrate.md`
    — **NEW** (PR.md self; this file).

Plus 1 NEW screenshot artifact:
`docs/audits/screenshots/wave-6-cf-20b-sample-blocks-grid-layout.png`
(emitted by the new Playwright spec). The cf-19 hotfix screenshot +
cf-20a read-route screenshot are also re-emitted with cf-20b grid
placement applied (same byte deltas as cf-20a's full visual run).

## D2 trigger judgment

- **Row 1 (CONTRACT.md change in N packages)** — HIT: 2 CONTRACT.md
  files modified (`@skb/editor-shell` + `apps/site`).
- **Row 2 (NEW deps)** — N/A (no new deps).
- **Row 4 (NEW ADR or amendment)** — HIT: ADR-0016 v0.2 D11.1
  amendment shipped IN this PR (atomic with implementation per
  user directive "no defer / no degradation"). The amendment lives
  inline in `ADR-0016-grid-data-model.md` rather than as a separate
  ADR-0019 because cf-20b is purely an editor-surface implementation
  of D11's existing "Tiptap inside / grid outside" layering — D11.1
  fills the silent gap between D8 (Astro static render) and D11
  (prose mutation discipline) without rewriting either.
- **Row 5 (cross-package: ≥ 3 packages)** — HIT: 3 packages touched
  (`@skb/editor-shell` + `apps/site` + design-tokens via verified
  consumption — no design-tokens source modification, but
  cross-package consumption of `--row-h` / `--gap` is locked).

Per CLAUDE.md `## Review workflow` + ADR-0011 D1 stage 4 + the
2026-05-09 retrospective rule "ux-ui-lead is dispatched at PLAN, not
REVIEW", **PRE-COMMIT CLAUDE REVIEW (stage 4) fires** on Row 1 + Row
4 + Row 5 (any of these triggers stage 4 alone). ux-ui-lead authored
this PLAN end-to-end. Stage 3 codex-pr-reviewer-55 review still
required.

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1
path pattern (NEW `grid-style.ts` + MODIFY `BlockNodeView.tsx` +
MODIFY `EditorShell.tsx`); `apps/site/src/**` matches as well
(`styles/grid.css`, `lib/mdx-adapter.ts`, the 3 `components/*.astro`,
the modified grid-css test, and the new Playwright spec).

The new `sample-blocks-grid-layout.spec.ts` spec (which BOTH probes
the edit route via `.ProseMirror` grid + the read route via
`.skb-block-static` grid) satisfies the D9.2 e2e_smoke obligation;
the emitted screenshot satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mount loads via the
    ApiAdapter chain (cf-18 NodeView wiring + cf-19 v0.2 wrapper
    chrome + cf-20a chrome single source + cf-20b grid placement).
    The outer `<GridContainer>` is `display: grid` with 12 cols; the
    intermediate `.skb-editor-content` div spans `grid-column: 1 / -1`;
    the inner `.ProseMirror` element is itself `display: grid` with
    12 cols; per-block NodeView wrappers `.skb-block-nodeview` carry
    inline `grid-column: 1 / span 12; grid-row: span 1` derived from
    `node.attrs.{col, colSpan, rowSpan}` via `gridPlacementStyle`.
    Sample-blocks fixtures are all colSpan=12 so visually identical
    to cf-20a; the substrate is what cf-20c-2 drag will mutate.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-grid-layout.spec.ts:"sample-blocks edit route — .ProseMirror is a 12-col grid + per-block grid-column applied (cf-20b D11.1 amendment)"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20b-sample-blocks-grid-layout.png
  assertions:
    - .ProseMirror visible within 15s
    - editor textContent length > 50 within 10s
    - first .skb-block-nodeview visible within 10s
    - outer .skb-grid: display=grid, gridAutoFlow=row, 12 grid template columns, width > 100px
    - inner .ProseMirror: display=grid, gridAutoFlow=row, 12 grid template columns each > 10px wide (catches cf-20b R0 zero-width-column bug), width > 100px
    - intermediate .skb-editor-content has gridColumn=1 / -1
    - all 8 kind wrappers (.skb-block-nodeview[data-skb-block-kind=…]) have gridColumn ≠ auto, MATCHES /(span 12|\/\s*13)/, width > 90% of editor width

- flow: `/notes/sample-blocks` (read route) renders 14
    `.skb-block-static` wrappers (5 light via mdx-adapter + 3 heavy
    via Astro wrappers + multiple instances per kind from fixture).
    Each carries inline `grid-column: 1 / span 12; grid-row: span 1`
    style emitted at SSR time (verifiable via grep on built HTML).
    The wrapper combines `.skb-grid` + `.skb-prose` on a single
    element (cf-20b R2 — was 2 nested wrappers pre-R2; combination
    makes MDX children real grid items per ADR-0016 v0.2 D11.1).
    cf-20b R2 spec asserts both inline-style presence AND structural
    grid-item-ness via parent `display: grid` + `getBoundingClientRect()`
    width matching the colSpan claim.
  target_url: /notes/sample-blocks
  playwright_spec: apps/site/playwright/sample-blocks-grid-layout.spec.ts:"sample-blocks read route — .skb-block-static carries grid-column derived from MDX attrs"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20b-sample-blocks-grid-layout.png
  assertions:
    - first .skb-block-static visible within 15s
    - outer .skb-grid: display=grid, gridAutoFlow=row, 12 grid template columns, width > 100px
    - all 8 kind wrappers (.skb-block-static[data-skb-block-kind=…]) have inline style attribute matching /grid-column:\s*1\s*\/\s*span\s+12/
    - all 8 kind wrappers have computed gridColumn ≠ auto, MATCHES /(span 12|\/\s*13)/
    - **STRUCTURAL (cf-20b R2)**: parent of every wrapper has computed display === 'grid' (catches the cf-20b R0/R1 false-positive class where computed gridColumn was set but parent was display:block, making the inline style inert)
    - **STRUCTURAL (cf-20b R2)**: bounding-rect width of every wrapper > 90% of grid container width (matches the colSpan=12 claim)

- flow: `/notes/sample-blocks` at viewport
    `375×812` (mobile preview path per ADR-0016 D5 + ADR-0017 D9)
    must collapse every block wrapper to a single column regardless
    of cf-20b's inline `style="grid-column: 1 / span 12"`. Pre-R1
    the inline style beat the existing media-query rule per CSS
    specificity, producing a 12× horizontal overflow
    (`scrollWidth=6450px` when viewport=343px). R1 hotfix adds 4
    mobile-scoped `!important` rules per D9 to beat the inline
    style + cap heavy-block placeholders + add overflow-x scroll
    defense-in-depth.
  target_url: /notes/sample-blocks
  playwright_spec: apps/site/playwright/sample-blocks-grid-layout.spec.ts:"cf-20b R1: mobile (≤768px) viewport — blocks force-fill 1-col regardless of inline grid-column"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20b-sample-blocks-grid-layout.png
  assertions:
    - viewport set to 375×812
    - first .skb-block-static visible within 15s
    - all 8 BlockKind wrappers have computed gridColumn === '1 / -1' (NOT '1 / span 12')
    - document.documentElement.scrollWidth ≤ 393px (viewport + scrollbar slack)

## Why (user feedback)

cf-20b is PR 2 of 9 in the locked cf-20 sequence. User directive
2026-05-09 (verbatim, dispatched as cf-20a + carried into cf-20b):

> "全部做，不允许 defer，必须保质保量，出现问题会直接让你推翻重写。
>  ... 全部对齐 v2."

cf-20a closed the chrome single-source half (border / radius / per-kind
stripe). cf-20b closes the layout substrate half: the 12-col grid that
the v2 design contract specifies in `/mnt/d/download/web/v2-styles.css:137-147`
(`.doc { display: grid; grid-template-columns: repeat(12, ...); ...;
grid-auto-flow: row; gap: var(--gap) }`). Pre-cf-20b the editor surface
had `.skb-grid` wrapping `<EditorContent>` but the actual block
NodeViews sat at depth 3 (under `.skb-grid` → `.skb-editor-content` →
`.ProseMirror` → blocks) so the outer grid layout never reached them.
cf-20b extends the grid one level deeper (the `.ProseMirror` element
itself becomes a 12-col grid) so block placement reaches the right DOM
depth. Sample-blocks fixtures all use `colSpan=12` so this is visually
a no-op today; the value is the substrate that cf-20c-2 drag and
cf-20d resize will MUTATE.

## Design source

- `/mnt/d/download/web/v2-styles.css:137-147` — canonical
  `.doc { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: var(--row-h); grid-auto-flow: row; gap: var(--gap);
  position: relative }` block. cf-20b applies this contract verbatim
  to BOTH the outer `.skb-grid` (existing) AND the inner `.ProseMirror`
  (NEW per D11.1 amendment).
- `/mnt/d/download/web/v2-styles.css:21-22` — `--row-h: 48px;
  --gap: 14px` token definitions. Already in
  `packages/design-tokens/src/tokens.css:79-80` per ADR-0018 D1
  layout-tokens lock; verified present at PLAN time per Q8 (no add
  needed).
- `/mnt/d/download/web/v2-styles.css:157-170` — `.gblock { position:
  relative; ...; transition: ..., grid-column 180ms ..., grid-row
  180ms ... }` block. The `grid-column` / `grid-row` transition
  callout is forward-compat for cf-20c-2 drag (cf-20b ships the
  static placement only; transitions land when drag-end commits new
  positions).
- `/mnt/d/download/web/v2-design-granularity.md:137-146` "Grid 流动
  ：row 不 dense（保留空格）" — gatekeeper-canonical decision that
  `grid-auto-flow: row` (NOT `dense`) is hard-locked because "不要替
  用户排版" (don't auto-arrange the user's layout). cf-20b's inner
  `.ProseMirror` rule consumes `grid-auto-flow: row` exactly per
  this contract; the new `grid-css.test.ts` assertion explicitly
  rejects `grid-auto-flow: dense` to lock the rule against drift.
- `/mnt/d/download/web/v2-design-granularity.md:148-156` "响应式" —
  desktop 12 / tablet 6 / mobile 1. cf-20b adds the editor-surface
  grid; mobile 1-col responsive switch is already covered by the
  existing `@media (max-width: 768px)` rule in `grid.css` and ALSO
  applies to the cf-20b inner `.ProseMirror` grid via the cascading
  `--total-cols: 1` + `grid-template-columns: 1fr` override + the
  extended `:not([style*="grid-column"])` fallback. cf-20b doesn't
  add new responsive breakpoints — it inherits the existing ones.
- ADR-0016 D2 — `BlockGridPosition` shape `{col, row?, colSpan,
  rowSpan: number | 'auto'}`. cf-20b's `gridPlacementStyle` formula
  consumes this shape verbatim per the D2 CSS application block.
- ADR-0016 D8 — Astro renderer grid layout (read route). cf-20b
  fills in the missing per-block style emission (D8 says "每个 block
  渲染加 `style={{ gridColumn, gridRow }}` 由 D2 公式生成" but the
  pre-cf-20b apps/site adapters didn't actually do this). cf-20b's
  `mdx-adapter.ts` + 3 Astro wrappers + helpers in `grid-style.ts`
  ship the emission.
- ADR-0016 D10 — `proseGridDefaults` const. cf-20b's prose-interleave
  decision (Q4 answer) consumes this: prose nodes inside `.ProseMirror`
  get the `defaultColSpan: 12` full-width fallback via the
  `:not([style*="grid-column"])` rule.
- ADR-0016 D11 — Tiptap inside / grid outside layering. cf-20b's
  D11.1 amendment EXTENDS D11 (not replaces): mutation discipline
  unchanged ("grid attrs are passive data on NodeView wrappers";
  cf-20b reads attrs at render time but never writes back through
  the NodeView attr API).
- ADR-0017 D9 — `.skb-grid--mobile` mobile 1-col view-only path.
  cf-20b's editor-surface grid inherits this via the existing
  responsive media query in `grid.css`; cf-20b doesn't extend or
  modify the mobile path.

## Decisions

### D1 — Editor-surface grid placement: inner `.ProseMirror` is itself a 12-col grid (vs `display: contents` flattening)

Three options were considered for "where does the `display: grid`
rule go" (the orchestrator's open question Q):

- **Option (a)**: `.ProseMirror` itself is `display: grid`. NodeView
  wrappers + prose nodes (Tiptap's direct children) become grid
  items. ProseMirror's selection / cursor / arrow-key navigation
  works because PM operates on schema/document order, not visual
  layout.
- **Option (b)**: wrap `.ProseMirror` in a `<div class="skb-grid">`
  outside it. Doesn't reach NodeView wrappers (they're STILL nested
  inside `.ProseMirror`).
- **Option (c)**: `display: contents` on the wrappers between
  `.skb-grid` and the actual block elements so the blocks bubble
  up to be `.skb-grid` direct children. Tried first; **discarded
  because CSS selectors operate on the DOM tree (NOT the layout
  tree)**, so `.skb-grid > *:not([style*="grid-column"])` doesn't
  match `.ProseMirror` when the intermediate `.skb-editor-content`
  is `display: contents`. Computed `grid-template-columns` came out
  as 12 zero-width columns (catches `pmGTC: "0px 0px ... 0px 0px"`
  in browser dev tools).

cf-20b chose **Option (a)**, with the addition that the
intermediate `.skb-editor-content` div spans `grid-column: 1 / -1`
so the inner `.ProseMirror` element inherits the full container
width to compute its own 1fr columns from. This is the two-level
grid: outer `.skb-grid` (existing read-route grid + the editor-mount
`<GridContainer>`) is a 12-col grid for read-route blocks AND the
editor-host div; inner `.ProseMirror` is a 12-col grid for editor
NodeViews + prose nodes. v2 contract source unchanged
(`.doc { display: grid; ... }` lines 137-147); we just apply it at
two depths.

The new `sample-blocks-grid-layout.spec.ts` Playwright spec asserts
both depths' `display: grid` AND that each inner column has width >
10px (regression lock against the cf-20b R0 `display: contents` bug).

### D2 — `EditorShell` always emits `skb-editor-content` className (concat with consumer className)

The grid CSS rule `.skb-grid > .skb-editor-content { grid-column: 1 / -1 }`
needs a stable class to target. Three options:

- **Option (a)**: hard-code the class always; concat with consumer's
  optional className. Picked.
- **Option (b)**: rely on `EditorShellMount.tsx` to pass `className="skb-editor-content"`.
  Couples the editor-shell PUBLIC surface to a CSS implementation
  detail in apps/site; if a future consumer forgets to pass it,
  silent grid-collapse breakage.
- **Option (c)**: use a `data-` attribute (`data-skb-editor-content`).
  CSS selector `.skb-grid > [data-skb-editor-content]` works but is
  less idiomatic; mostly stylistic preference.

Picked (a). The base class is structural (NOT theme), can never
collide with consumer styling, and the concat preserves consumer
extension.

### D3 — Prose interleave: full per `proseGridDefaults` (Q4 answer)

ADR-0016 D10 already declares `proseGridDefaults = { rowSpanSemantic:
'auto', gridKind: 'prose', defaultColSpan: 12 }`. cf-20b honors this
verbatim: prose nodes (`<p>`, `<h1>`, `<h2>`, `<ul>`) inside
`.ProseMirror` participate in the grid as full-width items via the
`:not([style*="grid-column"])` fallback rule (which cf-20b extends
to also cover `.skb-grid .ProseMirror > *`).

Rejected alternative: only grid the component-block range, keep
prose in flow. This would split the editor surface into "grid zones"
+ "flow zones" — non-trivial DOM manipulation (have to wrap each
block-cluster in a separate grid container) AND breaks ProseMirror's
single-document-tree model. cf-20b avoids this by treating prose as
"just another grid item with default colSpan=12".

### D4 — Arrow-key visual ≠ source-order limitation accepted (NOT mitigated in cf-20b)

When two adjacent blocks have `colSpan ≤ 6` and sit visually
side-by-side in the 12-col grid (e.g., a callout `colSpan=6` left
+ a code block `colSpan=6` right), ProseMirror's `ArrowDown` from
the left block goes to the next prose node in **document order**,
NOT to the visually-above-right block. This is inherent to
ProseMirror — its schema knows about node order, not visual layout.

cf-20b accepts this limitation. cf-22 (keyboard a11y; PR 7 of 9 in
the cf-20 sequence) MAY add a custom keymap that maps visual
navigation to document jumps when grid columns differ. Documented in
both the editor-shell CONTRACT.md "Editor-surface grid lock" section
AND the ADR-0016 v0.2 D11.1 amendment section so end users + future
test authors don't assume Word-like cursor behavior.

(Sample-blocks fixtures all use `colSpan=12` so this limitation
isn't visible in the current Playwright assertions; cf-20d resize
PR will introduce side-by-side blocks and may need a new spec
covering the navigation contract.)

### D5 — `--row-h` / `--gap` already in design-tokens (Q8 answer); NO add needed

Pre-PLAN expectation per the orchestrator's brief: "grep `--row-h`
and `--gap` in `packages/design-tokens/src/tokens.css`. If missing,
ADD with values `--row-h: 48px` and `--gap: 14px`". Grep at PLAN
time confirmed both tokens present at lines 79-80 of `tokens.css`
(per ADR-0018 D1 layout-tokens lock from Wave 5 Stage C.3-1).
cf-20b doesn't touch design-tokens.

### D6 — Deep-subpath import for Astro SSR consumers (NOT the editor-shell barrel)

The 5-light-block adapter (`apps/site/src/lib/mdx-adapter.ts`) and
the 3 heavy-block Astro wrappers (`apps/site/src/components/{Jupyter,
NnViz,AgentFlow}.astro`) all need `extractGridPosition` and the
grid-style helpers. Two import paths possible:

- **Option (a)**: import from the barrel: `import { extractGridPosition }
  from '@skb/editor-shell'`. **Discarded**: the barrel transitively
  loads block packages, kernel-registry, mdx-bridge, react-flow,
  @tensorflow/tfjs etc. — fine for the React-side editor mount, but
  catastrophic for Astro SSR which doesn't provide CommonJS
  fallbacks. `astro build` fails with `require is not defined in
  ES module scope` from the TF.js Node platform adapter at
  `block-nn-viz_*.mjs:7346`.
- **Option (b)**: deep-subpath: `import { extractGridPosition }
  from '@skb/editor-shell/src/grid-style.ts'`. The `.ts` extension
  is required for TypeScript module resolution in the Astro context
  per the `editor-shell/package.json` exports `./src/*` glob (which
  supports `.ts` filename resolution); the editor-shell barrel still
  re-exports the same helpers for the React-side editor consumer
  (which DOES include the editor-shell barrel anyway).

Picked (b). The deep subpath pattern is already established in the
codebase: `apps/site/playwright/grid-{drag-drop,perf}.spec.ts` and
`grid-drag-drop.fixtures.ts` use the same `@skb/editor-shell/src/<X>.ts`
form for similar reasons (per cf-19 R2 lesson). The trade-off is
that future renames inside `editor-shell/src/` need to update both
the barrel re-export AND the deep-subpath consumers in apps/site.
The lock test for this drift is the apps/site `pnpm typecheck`
failing on the missing module; covered by `pnpm check` in CI.

### D7 — `gridPlacementStyle` returns React `CSSProperties`; NEW `gridPlacementStyleAttr` returns Astro inline string

Two consumers each:

- React-side (`BlockNodeView.tsx`, `mdx-adapter.ts`) wants
  `CSSProperties` to spread into JSX `style={...}`.
- Astro-side (`Jupyter.astro` etc.) wants an inline string for
  `<div style={...}>` (Astro's prop serialization for the `style`
  attribute requires either an object — for which Astro emits
  `style="key1:val1;key2:val2"` — OR a string passed through verbatim).

Both forms are exported and call the same internal formula. The
new vitest case "gridPlacementStyleAttr is byte-equal to the
JSX-spread form" locks the byte-equality so the two forms can never
drift.

### D8 — `extractGridPosition` is defensive: returns null on missing/invalid required fields

mdx-bridge per ADR-0016 D7 hard-throws on missing col/colSpan in
non-prose blocks (Wave 5 plan v1.1 row C.2-3.5 R14 amendment).
However, cf-20b's `BlockNodeView.tsx` runs in many contexts beyond
mdx-bridge-validated input — test mounts, blocks inserted via the
slash menu BEFORE the C.2-9 grid-attr defaults backfill, third-party
extensions, etc. The defensive `extractGridPosition(attrs) → null`
return path lets the wrapper render correctly (no crash, no broken
NodeView) when grid attrs are missing; the parent CSS fallback
`.skb-grid .ProseMirror > *:not([style*="grid-column"])` paints
full-width.

The parallel design choice in `mdx-adapter.ts` is the same: when
`rest` (the flat MDX prop spread) lacks col/colSpan/rowSpan, the
wrapper still emits the `.skb-block-static` class but no inline
style; the read-route fallback rule paints full-width. The
`grid-defensive.test.ts` cases in mdx-bridge already cover the
mdx-bridge throw path; cf-20b's defensive `extractGridPosition`
covers the post-parse-defensive editor path.

### D10 — Read-route wrapper combines `.skb-grid` + `.skb-prose` on a single element (cf-20b R2 structural fix 2026-05-09)

**Trigger**: codex-pr-reviewer-55 R2 verdict on cf-20b R1. Codex's
structural finding: pre-R2 `apps/site/src/pages/notes/[...slug].astro`
emitted nested wrappers `<div class="skb-grid"><div class="skb-prose"><Content/></div></div>`.
The MDX `<Content components={componentsMap}>` expansion placed
`.skb-block-static` wrappers as children of the INNER `<div class="skb-prose">`,
NOT the outer `.skb-grid`. So `.skb-block-static` was a GRANDCHILD
of `.skb-grid` and **not a real grid item** — the inline
`style="grid-column: 1 / span 12"` emitted by `mdx-adapter.ts` /
the 3 heavy `.astro` wrappers was structurally INERT.

The cf-20b R0+R1 read-route Playwright spec only asserted **computed
`gridColumn`** style, which CAN be `1 / span 12` even when the
element isn't a grid item (computed style ignores parent context).
The test FALSE-POSITIVE PASSED while the actual layout was never
gridded — same `display: contents` selector-vs-layout-tree class as
cf-20b R0, applied at the wrong tree depth.

ADR-0016 D11.1 amendment claims read-route uses grid placement.
Pre-R2 this was false. Two fix paths considered:

- **Path (A) STRUCTURAL** — make `.skb-block-static` ACTUALLY a
  grid item. Combine the wrappers: `<div class="skb-grid skb-prose"><Content/></div>`.
  Pre-condition: `.skb-prose` is a typography container — every
  `.skb-prose` rule in `apps/site/src/styles/prose.css` targets a
  DESCENDANT (`.skb-prose p`, `.skb-prose .b-callout`, etc.); no
  rule targets `.skb-prose` itself. So adding it to the same
  element as `.skb-grid` creates no rule conflict; the grid layout
  applies AND prose typography cascades to children.

- **Path (B) DOCUMENTATION** — amend ADR-0016 D11.1 + the read-route
  spec to acknowledge the read route doesn't actually grid-place
  blocks. Inline `grid-column` becomes documentation/forward-compat
  only.

cf-20b R2 picks **Path (A)** because (a) ADR-0016 D11.1 amendment
explicitly claims read-route uses grid placement (path B would
require an ADR back-amendment which is more disruptive than a
1-line Astro template change); (b) cf-20c-2 drag/cf-20d resize will
need actual grid-item context on the read-route wrappers anyway
(future blocks may have `colSpan != 12` even on read route once
the user can author grid layouts in the editor); (c) the structural
fix is genuinely tiny — combining two class names on one element.

**Implementation** (1 source file + 1 test file + 1 PR.md decision):

1. `apps/site/src/pages/notes/[...slug].astro` — replace the nested
   wrappers with a single `<div class="skb-grid skb-prose"><Content components={...}/></div>`.
   The `<h1>{note.data.title}</h1>` stays OUTSIDE the wrapper (not a
   grid item; the page heading lives in document flow).

2. `apps/site/src/__tests__/grid-css.test.ts` — replace the
   "wraps MDX content while keeping the title outside the grid"
   test with the cf-20b R2 version that asserts the COMBINED
   wrapper presence (`<div class="skb-grid skb-prose">`) AND
   asserts the pre-R2 separate `<div class="skb-prose">` wrapper
   is GONE (regression lock).

3. `apps/site/playwright/sample-blocks-grid-layout.spec.ts` —
   strengthen the read-route test with TWO new structural assertions
   per kind wrapper: (i) parent computed `display === 'grid'`
   (catches the cf-20b R0+R1 false-positive class — proves the
   wrapper is actually a grid item, not just has gridColumn style);
   (ii) bounding-rect width > 90% of grid container width (catches
   inert grid-column style — proves the inline 1/12 span actually
   materialises in layout).

**Out-of-scope safety**: `.skb-grid` mobile responsive rules
(cf-20b R1 hotfix `@media (max-width: 768px)`) continue to apply
unchanged — the combined wrapper is still `.skb-grid`, the
`!important` overrides still target the same selectors.

**Test gap caught**: cf-20b R0+R1 spec asserted computed CSS only.
A grid item that's not actually in a grid context still reports
the inline gridColumn style verbatim (the browser doesn't know to
"erase" the value when the parent isn't grid). The R2 fix adds
TWO orthogonal structural assertions: (a) parent.display === 'grid'
(proves grid context), (b) bounding-rect width matches colSpan
claim (proves the grid context honors the placement). Either alone
could pass on a non-grid layout; both together catch every
real-world variant of the bug class.

### D9 — Mobile inline-style override needs `!important` + selector list covering both wrapper depths (cf-20b R1 hotfix 2026-05-09)

**Trigger**: codex-pr-reviewer-55 R1 verdict on cf-20b. Probe at
viewport 375×812 caught `document.documentElement.scrollWidth=6450px`
(12× horizontal overflow) on `/notes/sample-blocks` because:

1. cf-20b emits inline `style="grid-column: 1 / span 12; grid-row: span 1"`
   on every `.skb-block-static` (read route via mdx-adapter + 3 heavy
   Astro wrappers) and `.skb-block-nodeview` (edit route via
   `BlockNodeView.tsx`) wrapper to lock per-block desktop placement
   (this is the cf-20b D1 + D7 contract — single-source
   `gridPlacementStyle` formula across 3 consumers).
2. The pre-existing `@media (max-width: 768px) .skb-grid > * { grid-column: 1 }`
   rule could NOT beat the cf-20b inline style per CSS specificity
   (inline always wins over selector match). So `colSpan=12` blocks
   retained their 12-cell width even though the grid switched to `1fr`.
3. Result: `1fr` track stretched to fit content (bypassing the
   intent of mobile collapse), grid container reported
   `grid-template-columns: "6434px"`, and 14 sample-blocks fixtures
   all stacked at 6434px = horizontal overflow.

**The fix has 4 parts** (all inside the existing `@media (max-width: 768px)`
block in `apps/site/src/styles/grid.css`; ~40 LOC total):

**Part 1: `grid-column: 1 / -1 !important`** on selector list
`.skb-grid > *, .skb-grid .ProseMirror > *, .skb-grid .skb-block-static, .skb-grid .skb-block-nodeview`.
The selector list includes BOTH structural wrapper classes by name
(NOT just direct children) because the read-route DOM nests
`.skb-block-static` INSIDE `.skb-prose` (the `notes/[...slug].astro`
template wraps `<Content>` in `<div class="skb-prose">`), so it's
NOT a direct grid child. Initial fix attempt with only `.skb-grid > *`
missed this case; my own probe + the regression test caught it
during R1 implementation.

**Part 2: `min-width: 0 !important`** on the same selector list.
Even with `grid-column: 1 / -1`, CSS Grid's default `min-width: auto`
resolves to each item's `min-content` (the largest unbreakable
child). Sample-blocks contains `<pre class="skb-code-pre">` Python
code (6392px wide unbreakable text per its own intrinsic min-content),
`<svg class="skb-agent-flow-svg">` topology (6400px viewBox), and
PDF `<iframe>` (6424px). Any one of these pushed the 1fr grid track
to ~6.4k px, bypassing the 1fr-to-viewport-width constraint.
`min-width: 0` lets grid items shrink below their content
min-content; the inner block CSS (`.skb-code-pre { overflow-x: auto }`
etc.) handles long-line scroll within the now-collapsed card.

**Part 3: `max-width: 100% !important`** on `.skb-grid .heavy-block-skeleton`.
The `@skb/heavy-block-boundary` package SSR-emits
`<div class="heavy-block-skeleton" style="width:600px;min-height:400px">`
(per ADR-0014 D5 heavyBoundaryDimensions). 600px exceeds the 343px
mobile viewport by ~257px. The inline `width:600px` is on the inner
element, not the wrapper, so it bypasses our wrapper's `min-width: 0`.
Cap at parent width on mobile only; desktop SSR fallback dims (per
ADR-0014 W4-1 zero-layout-shift) are unaffected. Wave 5 ADR-0014
v0.5 amendment will dynamically derive heavy dimensions from grid
colSpan/rowSpan post-hydration; this mobile cap is forward-compat.

**Part 4: `overflow-x: auto`** on `.skb-grid .skb-block-static, .skb-grid .skb-block-nodeview`.
Defense-in-depth so even if a future inner element extends past the
wrapper's right edge (e.g., new heavy block kind, syntax-highlighted
long line that lacks its own `overflow-x: auto`), the overflow stays
contained within the wrapper rather than scrolling the page itself.
Block-level inner CSS (`.skb-code-pre { overflow-x: auto }`,
`.skb-agent-flow-canvas { overflow: hidden }`) continues to apply
within the wrapper bounds.

**Why `!important` is documented + intentional, NOT an anti-pattern**:
cf-20b's inline-style emission is the desktop placement contract per
ADR-0016 v0.2 D11.1 amendment. Without the inline style, the grid
couldn't actually place blocks at their `{col, colSpan}` positions.
The mobile override per ADR-0016 D5 + ADR-0017 D9 mobile view-only
path REQUIRES beating that desktop placement intent in a single,
scoped media query — there's no alternative selector specificity
that beats inline style without `!important`. Documented in
`apps/site/CONTRACT.md` "Mobile inline-style override" subsection so
future readers understand WHY this is the only `!important` use in
the apps/site CSS.

**Regression lock**:
`apps/site/playwright/sample-blocks-grid-layout.spec.ts:"cf-20b R1: mobile (≤768px) viewport"`
(~50 LOC, 1 test). Asserts (a) computed `grid-column === '1 / -1'`
on every BlockKind wrapper at viewport 375×812 (catches "inline-style
override leak"), (b) `document.documentElement.scrollWidth ≤ 393px`
(catches horizontal overflow with 18px scrollbar slack). Locks both
the immediate symptom AND the underlying CSS specificity contract.

## Acceptance

```bash
# AC-1: ADR-0011 D9 ui_touch detects on the right files
pnpm exec tsx scripts/check-ui-touch.ts \
  --files packages/editor-shell/src/grid-style.ts \
          packages/editor-shell/src/BlockNodeView.tsx \
          packages/editor-shell/src/EditorShell.tsx \
          apps/site/src/styles/grid.css \
          apps/site/src/lib/mdx-adapter.ts \
          apps/site/src/components/Jupyter.astro 2>&1 | tail -3
# Expected: ui_touch=true
```

```bash
# AC-2: `--row-h` / `--gap` design tokens still present at design-tokens
# (Q8 verified at PLAN time; this AC locks the pre-existing state so a
# future tokens.css edit that drops them gets caught here)
grep -cE '^\s*--row-h:\s*48px;' packages/design-tokens/src/tokens.css
# Expected: 1
grep -cE '^\s*--gap:\s*14px;' packages/design-tokens/src/tokens.css
# Expected: 1
```

```bash
# AC-3: editor-surface two-level grid CSS rules present
grep -E '^\.skb-grid > \.skb-editor-content \{' apps/site/src/styles/grid.css | wc -l
# Expected: 1
grep -E '^\.skb-grid \.ProseMirror \{' apps/site/src/styles/grid.css | wc -l
# Expected: 1
# The inner .ProseMirror grid uses the same template + flow rules
# as the outer .skb-grid (single-source-of-truth on grid model).
grep -A 6 '^\.skb-grid \.ProseMirror \{' apps/site/src/styles/grid.css | grep -cE 'grid-template-columns: repeat\(12, minmax\(0, 1fr\)\)'
# Expected: 1
grep -A 6 '^\.skb-grid \.ProseMirror \{' apps/site/src/styles/grid.css | grep -cE 'grid-auto-flow: row'
# Expected: 1
```

```bash
# AC-4: extended fallback selector covers prose-inside-editor
grep -cE '\.skb-grid \.ProseMirror > \*:not\(\[style\*="grid-column"\]\)' apps/site/src/styles/grid.css
# Expected: 1
```

```bash
# AC-5: SSR-emitted HTML carries grid placement on all 8 .skb-block-static
# wrappers (confirms the mdx-adapter + Astro wrappers route attrs through
# gridPlacementStyle / gridPlacementStyleAttr correctly)
pnpm --filter @skb/site build 2>&1 | tail -3
# Expected: build succeeds
grep -oE 'class="skb-block-static" data-skb-block-kind="[a-zA-Z-]+" style="[^"]*grid-column[^"]*"' apps/site/dist/notes/sample-blocks/index.html | wc -l
# Expected: ≥ 11 (at least the 11 light-block + 3 heavy-block wrappers; React's serialization may differ from Astro's by whitespace)
```

```bash
# AC-6: editor-shell + apps/site test suites green (152 + 78 with
# new grid-style.test.ts + grid-css.test.ts cf-20b assertions)
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 152 passed
pnpm --filter @skb/site test 2>&1 | grep -E 'Tests'
# Expected: 78 passed | 1 skipped
```

```bash
# AC-7: targeted Playwright passes (edit + read grid layout specs +
# cf-20b R1 mobile regression lock)
pnpm --filter @skb/site exec playwright test \
  playwright/sample-blocks-grid-layout.spec.ts \
  playwright/sample-blocks-edit-loads.spec.ts \
  playwright/sample-blocks-read.spec.ts \
  --reporter=line --workers=1 2>&1 | tail -3
# Expected: 5 passed (3 in sample-blocks-grid-layout: edit + read + cf-20b R1 mobile; +2 carried specs)
```

```bash
# AC-8: full apps/site Playwright suite passes (visual baseline diff < 5%)
pnpm --filter @skb/site exec playwright test --reporter=line --workers=1 2>&1 | tail -3
# Expected: 53 passed | 14 skipped | 0 failed (was 50 in cf-20a; +3 new specs in cf-20b: edit + read + R1 mobile)
```

```bash
# AC-9: pnpm check exit 0
pnpm check
# Expected: all 41 tasks successful
```

```bash
# AC-10: chrome stripe single source still holds (cf-20a regression lock)
grep -lE 'border-top: 2px solid var\(--accent-' \
  $(find packages apps -name '*.css' -not -path '*/node_modules/*' -not -path '*/dist/*')
# Expected: exactly packages/editor-shell/src/block-chrome.css (cf-20a invariant preserved)
```

```bash
# AC-11: ADR-0016 v0.2 D11.1 amendment present + status field updated
grep -cE '^### D11\.1 — Editor-surface grid lock' docs/decisions/ADR-0016-grid-data-model.md
# Expected: 1
grep -cE 'v0\.2 cf-20b D11\.1 amendment 2026-05-09' docs/decisions/ADR-0016-grid-data-model.md
# Expected: 1
```

```bash
# AC-12 (cf-20b R1 hotfix lock): mobile (≤768px) viewport collapses
# every block wrapper to 1-col regardless of cf-20b inline grid-column;
# document scrollWidth fits viewport (no horizontal overflow). The
# fix uses 4 mobile-scoped !important rules per D9 — one of the only
# !important uses in apps/site CSS, deliberate + documented.
pnpm --filter @skb/site exec playwright test \
  playwright/sample-blocks-grid-layout.spec.ts \
  -g "cf-20b R1: mobile" \
  --reporter=line --workers=1 2>&1 | tail -3
# Expected: 1 passed
grep -cE '!important;' apps/site/src/styles/grid.css
# Expected: 3 (grid-column + min-width + max-width — all declarations
#            end with `!important;`; overflow-x doesn't need !important
#            because no inline overflow-x style competes for it)
```

## Reflection landing

This PR appends one entry to
`docs/orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md`
per the 2026-05-09 retrospective process rule. The entry documents:
the cf-20b R0 `display: contents` debugging story (CSS selector tree
vs layout tree distinction, cost = 1 R-cycle), the Q8 token-already-present
finding (saved an unnecessary design-tokens edit + cross-package
sister-doc sweep), the deep-subpath import requirement for Astro SSR
(reused cf-19 R2 pattern; established as repeatable rule for any
editor-shell helper that crosses the React/Astro boundary), and the
prose-interleave decision rationale (full interleave per
`proseGridDefaults` was the cleanest choice; alternatives all
required splitting the editor into "grid zones" + "flow zones").

## Out-of-scope

(none — per the 2026-05-09 retrospective Rule 3 "Defer requires
explicit user approval, not orchestrator's"; user explicitly
disapproved deferral via "不允许 defer". The remaining 7 PRs in the
cf-20 sequence — cf-20c-1 algebra + cf-20c-2 drag UI + cf-20d resize
+ cf-20e kebab + cf-22 keyboard a11y + cf-23 read-mode unification +
cf-24 sidebar — are scheduled work, not "out-of-scope" deferrals.
Each is a NEW dispatch on its own branch with its own PR.md.)

## Related

- [cf-20a PR.md](wave-6-cf-20a-stripe-cleanup-single-source.md) —
  closed the chrome single-source half. cf-20b consumes the
  `.skb-block-static` wrapper that cf-20a introduced AND extends the
  same single-source pattern to grid placement (the `gridPlacementStyle`
  helper is to grid what `block-chrome.css` is to chrome).
- [cf-19 PR.md](wave-6-cf-19-editor-block-visual-identity.md) —
  shipped the editor `.skb-block-nodeview` wrapper that cf-20b adds
  `style.gridColumn` to.
- [cf-15b PR.md](wave-6-cf-15b-block-code-rename.md) — `code` →
  `componentCode` BlockKind rename; cf-20b's
  `data-skb-block-kind="componentCode"` selector preserves the
  internal-name semantic (chip label still collapses to `code` on
  the editor; data-attr uses internal name).
- [ADR-0016 D2 + D8 + D10 + D11 + v0.2 D11.1 amendment](../../decisions/ADR-0016-grid-data-model.md) —
  grid data model + editor-surface grid lock (this PR's amendment).
- [ADR-0017 D9](../../decisions/ADR-0017-drag-drop-ux.md) —
  `.skb-grid--mobile` mobile 1-col view-only path (inherited
  unchanged by cf-20b).
- [ADR-0018 D1](../../decisions/ADR-0018-v2-visual-migration.md) —
  layout tokens (`--row-h`, `--gap`) authority. cf-20b consumes
  via cascade; no token modification.
- [ADR-0011 D1 stage 4 + D9](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pre-commit Claude review trigger (Row 1 + Row 4 + Row 5 hit) +
  ui_touch / e2e_smoke gates.
- [ADR-0006 #6](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — sister-doc-sync rule (editor-shell + apps/site CONTRACTs +
  ADR-0016 amendment all updated in same PR).
- [orchestrator-reflections 2026-05-09](../../orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md)
  — process rules driving cf-20b (ux-ui-lead at PLAN, no defer, cite
  v2 source lines, append reflection entry).
- v2-styles.css `.doc { display: grid; ... }` lines 137-147 + `--row-h`
  / `--gap` lines 21-22 + `.gblock { ...; transition: grid-column,
  grid-row }` lines 157-170 — direct visual contract source for
  cf-20b's grid model.
- v2-design-granularity.md "Grid 流动：row 不 dense" lines 137-146
  — gatekeeper-locked decision on `grid-auto-flow: row` (NOT dense)
  consumed by cf-20b's CSS lock test.
