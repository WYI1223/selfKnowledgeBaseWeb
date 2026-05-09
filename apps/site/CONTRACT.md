# apps/site Contract

## Public surface

- Routes:
  - `/` — notes index
  - `/notes/{slug}` — rendered note
- MDX component blocks: `src/components.ts` exports `componentsMap`, the static-site
  PascalCase MDX tag map consumed by note pages.
- Content collection schema: `src/content.config.ts` imports `frontmatterSchema` from `@skb/content-types`. apps/site MUST NOT redefine the schema inline (single-authority rule per `packages/content-types/CONTRACT.md`).
- Theme: light / dark, controlled via `<html data-theme="dark">`. Persistent toggle button in the top-right corner of every page.

## Search index

- Stack: PageFind 1.5.0+ through `astro-pagefind` 1.8.6+. `astro.config.mjs`
  registers the adapter so `astro build` emits `dist/pagefind/` after static
  HTML generation. ADR-0012 prose was aligned to the current `dist/pagefind/`
  path (without the historical `_` prefix) at v0.1.1 amendment 2026-05-03
  (Wave 4 Stage B B1a); the semantic contract (post-build hook + build
  artifact) is unchanged.
- UI surface: `src/components/SearchBox.astro` renders the SSR-safe
  `<div id="search">` mount point and lazy browser script that constructs
  `@pagefind/default-ui` with `resetStyles: false`. The dedicated `/search`
  route embeds that component through `BaseLayout`, and the global header links
  to `/search`.
- Word-level result filter: `apps/site/src/lib/word-level-match.ts` exposes
  `isWordLevelMatch(query, content, locale?)`; `SearchBox.astro` wires it via
  `@pagefind/default-ui` `processTerm` + `processResult` callbacks plus a
  `MutationObserver` that applies `[data-skb-word-level-mismatch="true"]` to
  substring-only-match list item ancestors (CSS `display: none`) and patches the
  `.pagefind-ui__message` count display. This restores the ADR-0012 v0.1.1
  criterion 4 paired discriminator at runtime; PagefindUI's index-time
  tokenization is unchanged.
- A11y guarantee: search input labeling, keyboard result navigation, and result
  ARIA semantics come from `@pagefind/default-ui` defaults. apps/site may wrap
  the surface, but it must not replace those defaults with a custom UI unless a
  follow-up contract update preserves equivalent keyboard and screen-reader
  behavior. The B1b word-level wrapper is post-render result filtering only
  (DOM `data-*` attribute + CSS `display: none`); it does not replace any
  `@pagefind/default-ui` ARIA, keyboard, or screen-reader behavior. Hidden
  mismatched results are removed from the visible result count via
  `.pagefind-ui__message` text replacement so screen readers do not announce
  stale totals.
- `/search` render-safety: `astro build` must emit the `/search` HTML before
  `dist/pagefind/` exists. The page contains only the static mount point plus a
  client-side script and stylesheet reference; the browser loads PageFind's
  runtime and index after first paint. This satisfies ADR-0012 out-of-scope
  #C4(a) for D3 without introducing SSR or blocking static generation.
- Bundle-size budget: PageFind runtime + initial search-route index chunks must
  stay <= 120 kB gzip at first paint. D2 has no `/search` route yet, so D3 must
  re-measure the user-facing route after UI integration.
- Index-size budget: the complete `dist/pagefind/` directory must stay <= 30 kB
  uncompressed for the current 2-note corpus and <= 300 kB uncompressed at the
  100-note projection. Projection formula:
  `ceil(current_dist_pagefind_bytes / current_note_count * 100)`.
- Measurement commands:

  ```bash
  pnpm --filter=@skb/site build
  test -f apps/site/dist/pagefind/pagefind-entry.json
  du -sb apps/site/dist/pagefind
  ```

- Current D2 measurement (sample-blocks + sample-mdx-note + index = 3 indexed
  pages): `dist/pagefind/` ~= 200 kB uncompressed (Pagefind runtime + UI
  bundles + 3 note fragments). The index is small relative to pagefind's
  runtime/UI assets; corpus growth dominates fragment bytes only.
- Cache-bust mechanism: PageFind emits content-hash chunk filenames, including
  fragment files under `dist/pagefind/fragment/`. Rebuilding after note content
  changes produces new chunk names/bytes, so CDN or proxy stale-cache reuse of an
  old index is avoided without client-side reindexing.

## Grid layout (Wave 5)

- W5-1 source of truth: `packages/block-foundation/CONTRACT.md` owns the grid
  dimension invariant for `BlockGridPosition`, `COL_SNAPS`,
  `proseGridDefaults`, and the grid geometry helpers. apps/site is a consumer
  and must not redefine those data-model rules.
- Selector contract: `apps/site/src/styles/grid.css` is the single authority
  for the SSR-phase `.skb-grid` container CSS. Notes routes must wrap rendered
  block content in `.skb-grid`; they must not hand-roll page-local grid styles.
- **Read-route wrapper contract (Wave 6 cf-20b R2 2026-05-09 structural fix)**:
  `apps/site/src/pages/notes/[...slug].astro` MUST emit a single combined
  wrapper `<div class="skb-grid skb-prose">` around `<Content components={...}/>`
  so MDX-emitted children (`.skb-block-static` from the 5-light-block adapter
  + 3 heavy `.astro` wrappers, plus prose `<p>` / `<h2>` / `<ul>`) become
  DIRECT grid items. Pre-R2 the route used two nested wrappers
  `<div class="skb-grid"><div class="skb-prose"><Content/></div></div>` —
  `.skb-block-static` was a GRANDCHILD of `.skb-grid` and the inline
  `style="grid-column: 1 / span 12"` emitted by the cf-20b adapters was
  structurally INERT (no grid-item context). codex-pr-reviewer-55 R2
  caught this. The combined wrapper safe because `apps/site/src/styles/prose.css`
  rules all target descendants (`.skb-prose p`, `.skb-prose .b-callout`,
  etc.); no rule targets `.skb-prose` itself, so adding it to the same
  element as `.skb-grid` creates no rule conflict. Regression-lock: the
  `apps/site/src/__tests__/grid-css.test.ts` "wraps MDX content" test
  asserts BOTH the combined `<div class="skb-grid skb-prose">` presence
  AND the absence of the pre-R2 separate `<div class="skb-prose">` wrapper.
  The `apps/site/playwright/sample-blocks-grid-layout.spec.ts` read-route
  spec adds two structural assertions per kind wrapper: (i) parent
  `display === 'grid'` (proves grid context), (ii) `getBoundingClientRect()`
  width > 90% of grid container width (proves the colSpan=12 claim
  materialises in layout). Computed-style-only assertions are insufficient
  because the browser reports the inline `gridColumn` value verbatim even
  when the parent is `display: block` (the cf-20b R0+R1 false-positive
  class).
- Responsive breakpoints mirror ADR-0016 D5:

  | Viewport | Columns | Rendering semantics |
  | --- | ---: | --- |
  | `>= 1024px` desktop | 12 | Full `COL_SNAPS` ladder applies. |
  | `768px-1024px` tablet | 6 | Effective snaps reduce to 2 / 3 / 6. |
  | `< 768px` mobile | 1 | Blocks stack in one column. |

- Mobile override: `.skb-grid` switches to `grid-template-columns: 1fr`, and
  direct children render with `grid-column: 1`. This is a rendering-only
  preview path: `rowSpan='auto'` is derived for layout, but persisted
  `rowSpan` values are unchanged per ADR-0016 D5.
- **Mobile inline-style override (Wave 6 cf-20b R1 hotfix 2026-05-09)**:
  cf-20b emits inline `style="grid-column: ${col} / span ${colSpan}"` on
  every `.skb-block-static` (read route) and `.skb-block-nodeview` (edit
  route) wrapper to lock per-block desktop placement. Inline style beats
  media-query CSS per CSS specificity, so the existing
  `@media (max-width: 768px) .skb-grid > * { grid-column: 1 }` rule
  did NOT collapse blocks to 1-col on mobile — codex-pr-reviewer-55 R1
  caught a 12× horizontal overflow at 375×812 viewport (scrollWidth=6450px).
  The hotfix adds 4 mobile-scoped rules with `!important` (intentional
  and documented; the mobile-preview contract per ADR-0016 D5 +
  ADR-0017 D9 mobile view-only path requires beating the cf-20b desktop
  placement intent in a single, scoped media query):
  1. `grid-column: 1 / -1 !important` on `.skb-grid > *`,
     `.skb-grid .ProseMirror > *`, `.skb-grid .skb-block-static`,
     `.skb-grid .skb-block-nodeview` — collapses every block wrapper to
     1-col regardless of inline style. Selector list covers BOTH read
     route (`.skb-block-static` is nested in `.skb-prose`, NOT a direct
     child of `.skb-grid`) AND edit route
     (`.skb-block-nodeview` nested in `.ProseMirror`).
  2. `min-width: 0 !important` on the same selector list — CSS Grid's
     default `min-width: auto` resolves to each item's `min-content`
     (the largest unbreakable child). The sample-blocks fixture
     contains `<pre>` Python code (6392px wide unbreakable text),
     `<svg>` NN-Viz topology (6400px), and `<iframe>` PDF viewers
     (6424px) — any one pushes the 1fr grid track to 6.4k px and
     bypasses the viewport-width constraint. `min-width: 0` lets grid
     items shrink below content min-content; the inner block CSS
     (`.skb-code-pre { overflow-x: auto }` etc.) handles the long-line
     scroll within the now-collapsed card.
  3. `max-width: 100% !important` on `.skb-grid .heavy-block-skeleton` —
     `@skb/heavy-block-boundary` SSR-emits `style="width:600px;min-height:400px"`
     on the inner skeleton (per ADR-0014 D5 heavyBoundaryDimensions);
     600px exceeds 343px mobile viewport. Cap at parent width on
     mobile only; desktop SSR fallback dims (per ADR-0014 W4-1 zero-
     layout-shift) are unaffected.
  4. `overflow-x: auto` on `.skb-grid .skb-block-static`,
     `.skb-grid .skb-block-nodeview` — defense-in-depth so even if a
     future inner element extends past the wrapper's right edge, the
     overflow stays contained within the wrapper rather than scrolling
     the page itself.

  Regression lock spec:
  `apps/site/playwright/sample-blocks-grid-layout.spec.ts:"cf-20b R1: mobile (≤768px) viewport"`
  asserts computed `grid-column === '1 / -1'` on every BlockKind wrapper +
  `document.documentElement.scrollWidth ≤ 393px` (viewport + scrollbar slack).
- Per-block `gridColumn` / `gridRow` style emission landed at Wave 6 cf-20b
  (2026-05-09). Light-block read route: `apps/site/src/lib/mdx-adapter.ts`
  consumes `extractGridPosition` + `gridPlacementStyle` from
  `@skb/editor-shell/src/grid-style.ts` and applies inline style to the
  `.skb-block-static` wrapper. Heavy-block read route: the 3 Astro wrappers
  (`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`) consume
  `gridPlacementStyleAttr` for inline `style="..."` strings. Edit route:
  `BlockNodeView.tsx` reads `node.attrs.{col, colSpan, rowSpan}` and applies
  `gridPlacementStyle` to the `.skb-block-nodeview` wrapper.
- Transitional fallback (Wave 5 C.2-3 → cf-20b cleanup): MDX children inside
  `.skb-grid` without an inline `style` attribute matching `grid-column` get
  `grid-column: 1 / -1` via `.skb-grid > *:not([style*="grid-column"])` so
  unstyled prose remains full-width readable. cf-20b extends this fallback
  to the inner `.ProseMirror` grid as well so prose nodes (`<p>`, `<h2>`,
  `<ul>`) inside the editor become full-width grid items by default.
  `grid-auto-rows` uses `minmax(var(--row-h), auto)` so content height drives
  row height rather than clamping to 48px.
- **Editor-route two-level grid lock (Wave 6 cf-20b; ADR-0016 v0.2 D11.1
  amendment)**: when `.skb-grid` wraps Tiptap's `<EditorContent>`, the
  intermediate `.skb-editor-content` div spans `grid-column: 1 / -1` so the
  inner `.ProseMirror` element inherits the full container width. The
  `.ProseMirror` element is **itself** styled `display: grid;
  grid-template-columns: repeat(12, ...)` so per-block NodeView wrappers
  (`.skb-block-nodeview`, which sit at depth 3 under `.skb-grid`) become
  grid items at the correct level. This is the editor-mount equivalent of
  the read-route Astro `<Content>` flat-children layout. v2 contract
  source: `/mnt/d/download/web/v2-styles.css:137-147`.
- Architectural pointers: ADR-0016 D8 defines the Astro renderer `.skb-grid`
  wrapper, D9 defines the SSR vs hydration phase split, D11 keeps Tiptap inside
  blocks while the grid stays outside, ADR-0016 v0.2 D11.1 amendment locks
  the editor-surface two-level grid (cf-20b 2026-05-09), and ADR-0017 D11 is
  the downstream visual feedback scope referenced by the grid architecture.

## Edit route (Wave 5)

- Route surface: `/notes/{slug}/edit` renders the C.4-prelude editor mount for
  each non-draft note slug. It coexists with the read-only `/notes/{slug}`
  catch-all route at `src/pages/notes/[...slug].astro`; the edit route lives at
  `src/pages/notes/[...slug]/edit.astro` so nested slugs render canonical
  unescaped paths.
- Mount component: `src/pages/notes/[...slug]/edit.astro` imports
  `src/components/EditorShellMount.astro`, which mounts
  `EditorShellMount.tsx` as a React island with `client:only="react"`. This
  avoids SSR for the Tiptap-dependent editor surface and passes the note body as
  `initialMdx` for first-visit edits before localStorage has a saved state.
- Persistence (Wave 6 Stage B.4 update per ADR-0018 v0.6 D13): the island
  uses **`ApiAdapter` primary + `LocalStorageAdapter` fallback** from the
  `@skb/editor-shell` save-adapter public surface.
  - **load**: `ApiAdapter.load()` issued first against
    `/api/notes/{slug}`. On `null` (HTTP 404 — no saved state) OR a thrown
    non-2xx, the mount falls through to `LocalStorageAdapter.load()`. If
    both return `null` the editor seeds from `initialMdx`.
  - **save**: `ApiAdapter.save()` POSTs the `NoteState` to
    `/api/notes/{slug}` after the 800ms debounce. On
    `{ ok: false, error }` the mount additionally writes to
    `LocalStorageAdapter` as a backup so the user's edit survives a
    network blip — the user-visible save indicator still reflects the
    primary failure (`status: 'error'`). On `{ ok: true }` only the
    server file is written.
  - The localStorage key prefix is `skb-note:{slug}`, distinct from the
    design-tokens `skb-theme` key.
  - Closing the user-reported "/notes/<slug> and /notes/<slug>/edit don't
    sync" gap: with the server file as primary source of truth, a save
    via the edit route writes back to `content/notes/<slug>/index.mdx`
    + sibling `state.json`, and the next visit to the read route renders
    the persisted MDX body.
- See sister-doc:
  [packages/editor-shell/CONTRACT.md § NoteSaveAdapter (Wave 5; contract hardened at C.4-1)](../../packages/editor-shell/CONTRACT.md).
- **Drag/drop wire (Wave 6 cf-20c-2 2026-05-09)**: `EditorShellMount.tsx`
  mounts `useDragDropPipeline({editor})` as the lifecycle owner of
  per-block drag operations. The hook returns `{state, layoutState,
  onDragStart, onDragEnd, clearLastDropped}`; the mount wraps
  `<GridContainer>` in `<DragDropProvider value={{onDragStart, onDragEnd,
  sourceBlockId}}>` so the per-block `<DragHandleButton>` rendered
  inside each `.skb-block-nodeview__gutter` (cf-19 shell, cf-20c-2
  button drop-in via `BlockNodeView.tsx`) can dispatch up to the
  pipeline via React context AND so `BlockNodeView` can read
  `sourceBlockId` to apply the `.skb-block-nodeview--dragging-self`
  modifier class for the ADR-0017 D6 source-lift visual (cf-20c-2 R2
  F1 fix 2026-05-09 — `visibility: hidden + pointer-events: none` per
  ADR-0017 D6 line 247 verbatim; replaces R1's v2-demo
  opacity/grayscale model that D6 line 255 explicitly rejects).
  When `state.active` is true the mount renders `<OutlineOverlay>`
  (active-edge dashed accent) AND `<DragGhost kind="markdown" mode="move">`
  (cursor follower) as siblings of the editor surface. When
  `state.lastDroppedBlockId !== null && state.lastDroppedRect !== null`
  (cf-20c-2 R2 F2 fix 2026-05-09 — replaces R1's snapshot-rect model)
  the mount additionally renders `<DropPulseAtRect rect={lastDroppedRect}
  onAnimationEnd={clearLastDropped} />` — a `position: fixed` wrapper
  at the landed block's POST-DROP bounding rect (re-measured by the
  pipeline via `editor.view.nodeDOM(livePos).getBoundingClientRect()`
  AFTER Tiptap setNodeMarkup commits + 2 rAFs for React commit +
  browser layout pass) per ADR-0017 D11 line 344 ("源块进入新 grid
  位置 + outline fade-out 完成"); the 720ms keyframe fires; on
  `onAnimationEnd` the pipeline's `clearLastDropped()` resets both
  `lastDroppedBlockId` AND `lastDroppedRect` for the next cycle. `useEscCancel` is wired with `dragActive:
  state.active` so the global Escape key rolls the drag back to the
  S0 snapshot per ADR-0017 D8. The cf-19 standalone floating
  `<DragHandle />` is removed — per-block handles are the sole drag
  affordance post cf-20c-2. Mobile (≤768px) hides drag handles via
  `display: none` per ADR-0017 D9 mobile view-only path; the hook's
  `state.active` stays false on mobile because no dragstart can fire
  from a hidden button.
  Regression-lock specs:
  `apps/site/playwright/sample-blocks-drag-handle.spec.ts` covers
  desktop drag lifecycle (handles present + dragstart mounts overlay
  + ghost; Esc cancel unmounts both), source-lift visual (cf-20c-2 R2
  F1: dragstart applies `.skb-block-nodeview--dragging-self` to source
  only AND computed `visibility === 'hidden'` AND
  `pointer-events === 'none'`; Esc removes), terminal drop (cf-20c-2
  R2 F3+F4 strict: dragstart → dragover-edge → drop mutates source's
  gridColumn EXACTLY from `1 / span 12` to `7 / span 6` AND target
  reciprocally to `1 / span 6` AND DropPulse anchor mounts AND its
  rect matches the post-drop source rect within 1px sub-pixel
  tolerance per ADR-0017 D11 line 344), AND mobile-hidden
  assertion.
- **Resize handles wire (Wave 6 cf-20d 2026-05-09; R1 + R2 fixes 2026-05-09)**:
  `EditorShellMount.tsx` additionally mounts `useResizePipeline({editor,
  totalCols: viewportCols, activeColSnaps: effectiveColSnaps(viewportCols),
  onCommitSuccess})` as the lifecycle owner of per-block resize gestures
  (R1 F1 fix: `viewportCols` derives from `useResponsiveCols` per ADR-0016
  D5; pre-R1 was hardcoded `12`/`effectiveColSnaps(12)` which gave tablet
  users wrong snap stops. R2 F1 amendment: hook switched from min-width
  to max-width matchMedia queries to match grid.css verbatim — pre-R2 the
  hook had off-by-one at exact 1024/768 boundaries). The hook returns
  `{state, onResizeStart, onResizeEnd}`; the mount nests
  `<ResizeProvider value={{onResizeStart, onResizeEnd, resizingBlockId,
  resizingAxis}}>` INSIDE the cf-20c-2 `<DragDropProvider>` so per-block
  components can read both contexts independently. The mount also passes
  `viewportCols` to `<GridContainer>` so the existing
  `.skb-grid--mobile` className emission per ADR-0017 D9 fires at
  viewport=1 (was `undefined` pre-R1). Each `.skb-block-nodeview` emits 3
  resize handles (right + bottom + corner per
  `/mnt/d/download/web/v2-styles.css:256-311`) via `<ResizeHandles
  blockId gridKind?>` rendered inside `BlockNodeView.tsx`. Right handle is
  always rendered; bottom + corner are gated by `gridKind !== 'prose'` per
  ADR-0017 D9 (defensive default: render-all-3 for the 8 sample-blocks
  fixtures which have `gridKind === undefined`). When `state.active` is true
  the mount renders `<ColRuler>` (above grid via fixed-position anchor on
  the source block's top edge), `<SizeTooltip>` (cursor follower with
  fraction text per `colSpanToFraction`), and `<RowLadder>` (right-margin
  ladder, only on bottom + corner axes). On commit (pointerup with snap
  changed), the pipeline calls `setNodeMarkup` on the live PM position and
  invokes `onCommitSuccess(blockId, liveRect)` 2 rAFs post-mutation;
  consumer routes this to `pipeline.setLastDroppedFromExternal(...)` so the
  resize success-pulse mounts via the SAME cf-20c-2 `<DropPulseAtRect>`
  + `dropEpoch` infrastructure (cf-20d D3 reuse: dropEpoch is generic
  "rapid-action animation isolation", not drag-specific). The pipeline's
  attr-write path (R1 F2 + F3 + R2 F2 fixes) snapshots the block's `col`
  AND preserves the original `rowSpan` attr (could be `'auto'` on prose);
  `snapToColSpan` filters overflowing snaps via `snap <= totalCols -
  startCol + 1` per ADR-0016 D2 invariant; `buildResizeNextAttrs` performs
  axis-aware attr write so right-only resize NEVER touches `rowSpan`
  (preserves `'auto'`), bottom-only NEVER touches `colSpan`, corner writes
  both. R2 F2 amendment: pipeline detects
  `startCol + startColSpan - 1 > totalCols` UNCONDITIONALLY before
  setNodeMarkup (regardless of axis) and normalizes
  `colSpan = max(1, totalCols - startCol + 1)` into the same transaction
  as the user's intended axis mutation — recovers persisted-overflow
  state (e.g. block saved at desktop becomes invalid at tablet viewport)
  in a single atomic write. console.warn emitted for operator visibility. `useEscCancel` is wired with `dragActive: resize.state.active` so
  Escape rolls the resize back without mutation per ADR-0017 D8. The v2
  `.gblock.resizing` outline + body-hidden contract per
  v2-styles.css:172-176 is implemented by the `.skb-block-nodeview--resizing`
  modifier in `BlockNodeView.css`. Mobile (≤768px) hides ALL resize
  affordances (.gblock-handle / .skb-col-ruler / .skb-row-ladder /
  .skb-size-tooltip) via `display: none` per ADR-0017 D9 view-only contract.
  Regression-lock spec:
  `apps/site/playwright/sample-blocks-resize-handles.spec.ts` covers
  handle visibility (14 right + 14 bottom + 14 corner per sample-blocks
  fixture), right-edge resize commit (gridColumn mutates from
  `1 / span 12` to `1 / span N` where N ∈ {2, 3, 4, 6, 8} per ADR-0016 D6
  round-to-nearest-snap + dropEpoch reuse mounts the success-pulse anchor),
  R1 F1 tablet snap-set lock (at viewport=900px the 6-col grid forces
  N ∈ {2, 3, 6}), R2 F2 persisted-overflow normalization lock (block
  with persisted col=4 colSpan=6 at tablet viewport: bottom-only resize
  normalizes colSpan to 3 = max(1, 6-4+1) in same setNodeMarkup
  transaction), AND mobile-hidden lock at 375×812 viewport. Uses
  byte-snapshot fixture isolation per cf-20c-2 R3 F1 (NEVER `git checkout`
  in test code). Pointer-event boilerplate consolidated into
  `apps/site/playwright/helpers/resize-pointer-events.ts`
  (`dispatchResizeGesture` + rAF barriers) so each test is focused on
  assertions, not the pointerdown→rAF→pointermove→rAF→pointerup→2-rAF
  sequence boilerplate.
- Block registry: C.4-2 verified that `EditorShellMount.tsx` constructs a
  route-local `BlockRegistry` and calls `registerBlocks` from
  `@skb/editor-shell`, whose helper registers all 8 Wave 2 block definitions
  (5 light blocks plus the 3 heavy plugin-placeholder blocks). The 3 heavy
  blocks render the ADR-0014 v0.4 plugin-placeholder tier, so the MVP edit
  mount may register them without loading real heavy runtimes.
- Kernel registry boundary: C.4-2 verifies the route consumes the
  `@skb/editor-shell` MVP registry surface after C.4-prelude. The upstream
  `registerKernels` helper remains the `KernelRegistry` wire point; the edit
  route does not eagerly start a kernel or add a route-local execution surface
  until a user insertion/execution affordance exists.
- Save trigger: the island uses an 800ms `setTimeout` debounce around
  `saveToMdx` and the primary/fallback save chain
  (`ApiAdapter.save()` then optional `LocalStorageAdapter.save()` backup
  on primary failure), and increments the persisted note version per
  ADR-0018 D8 before each save. `layoutEpoch` synchronization is deferred
  to a future Phase 2+ amendment per ADR-0019 D3 deferred item #1.
- Forward pointer: C.4-3 owns palette / slash / drag-handle / toolbar assembly
  and the explicit drag interaction verification for the ADR-0017 drag UX
  modules. Full UI assembly and e2e coverage land across C.4-1 through C.4-5;
  v2 visual identity lands at Stage C.3. ADR-0018 D8 remains the save-path
  interface freeze for this route.

## Invariants

- **Static-first build with carved-out server endpoints** (spec §1.8 constraint #3, amended by ADR-0018 v0.6 D11+D12 for Wave 6 Stage B): every note + index route is prerendered to static HTML at `astro build`. Server-side handling is restricted to the `apps/site/src/pages/api/notes/[...slug].ts` persistence endpoint codified under `## Runtime persistence`, which sets `export const prerender = false` so only that route runs server-side at runtime. The Node standalone adapter exists to host that one endpoint; introducing additional non-prerendered routes requires a CONTRACT.md amendment + ADR-0018 amendment.
- **Default zero JavaScript** (Astro islands): only components annotated with `client:*` hydrate. Wave 1 shipped `ThemeToggle (client:load)`; Wave 4 B7 adds the 3 heavy block islands below.
- **No hand-rolled visual values** (ADR-0003 / spec §2.6 invariant #5): `tailwind.config.ts` MUST consume `@skb/design-tokens/tailwind-preset` via `presets: [...]`. Hard-coded `#hex`, `rgb(...)`, or pixel literals in any source file under `src/` are rejected by `pr-gate`.
- **FOUC inline script ↔ design-tokens `STORAGE_KEY` literal sync**: the inline `<script is:inline>` in `BaseLayout.astro` reads `localStorage.getItem('skb-theme')` literally. The design-tokens package owns the canonical `STORAGE_KEY = 'skb-theme'` constant; renaming it requires updating BOTH packages in the same PR. The inline script cannot import the constant — it must run before any module loads to prevent FOUC.
- **FOUC inline script must NOT write localStorage** (ADR-0003 D6): the script only reads + applies. Writes are reserved for manual user action via `useTheme.setTheme` / `toggle`. This preserves the property "system OS theme change is reflected on next visit unless the user has explicitly chosen a theme."
- **FOUC boot-theme algorithm MUST be byte-equivalent to `getInitialTheme()`** from `@skb/design-tokens` in BOTH happy-path AND exception handling:
  1. STRICT-whitelist saved value (`saved === 'light' || saved === 'dark'`); fall through to `matchMedia('(prefers-color-scheme: dark)')` otherwise. A truthy-coerce check (e.g. `saved ? saved === 'dark' : ...`) diverges for invalid / case-mismatched / legacy localStorage values and produces a hydration flash on first paint.
  2. The `try/catch` MUST wrap ONLY the `localStorage.getItem` call. `matchMedia` + DOM apply MUST run AFTER the catch handler. A wide-scope `try/catch` swallows the `matchMedia` path on Safari Private Mode / iOS WebView with storage restrictions / browsers with localStorage disabled — producing light when system pref is dark, i.e. a hydration flash.
  Both rules are enforced by `src/__tests__/fouc-script.test.ts`, which extracts the IIFE from `BaseLayout.astro` and asserts equivalence against `getInitialTheme()` for a 16-row saved-value × system-preference corpus + 2 storage-throws × system-preference rows + an explicit truthy-coerce regression assertion.
- **Content frontmatter schema is owned by `@skb/content-types`**: apps/site imports `frontmatterSchema` and uses it directly in `defineCollection`. Inline schema redefinition is a contract break (content-types CONTRACT.md single-authority invariant). When the schema needs new optional fields, update `@skb/content-types` and let it propagate.
- **Component-block rendering**: MDX component blocks are wired only through
  `componentsMap` in `src/components.ts`, and `pages/notes/[...slug].astro`
  passes that map per page via `<Content components={componentsMap} />`.
  The map must expose exactly the 8 canonical PascalCase keys `Callout`,
  `Code`, `Image`, `Math`, `Pdf`, `Jupyter`, `NnViz`, and `AgentFlow`.
  Values for the 5 light keys (`Callout` / `Code` / `Image` / `Math` /
  `Pdf`) wrap the corresponding block package `*RenderView` exports via
  the `makeMdxAdapter(RenderView, kind)` from `./lib/mdx-adapter.ts`.
  The `kind` arg is the BlockKind literal (`callout`, `componentCode`,
  `image`, `math`, `pdf`); the adapter wraps the inner component in
  `<div class="skb-block-static" data-skb-block-kind="<kind>">` so the
  static read route gets the v2 `.gblock` chrome (border / radius /
  hover / per-kind 2px stripe) from the shared
  `@skb/editor-shell/src/block-chrome.css` module — single source of
  truth with the editor-mount path's `.skb-block-nodeview` wrapper
  (Wave 6 cf-20a 2026-05-09). Values for the 3 heavy keys (`Jupyter` /
  `NnViz` / `AgentFlow`) reference Astro wrappers under
  `./components/{Kind}.astro` per ADR-0014 v0.3 D10 (production
  hydration boundary) — the wrappers render React islands with
  `client:load` directives wrapped in their own
  `<div class="skb-block-static" data-skb-block-kind="<kebab-kind>">`
  shell so the heavy-block read path also resolves the same chrome. In Wave 5 (ADR-0014 v0.4 amendment)
  those islands render the `plugin-placeholder` tier — a static React
  shell satisfying the SSR + hydration boundary contract without
  dynamic-importing real runtimes. The `plugin-real-runtime` tier
  (Phase 2+) restores the `HeavyBlockBoundary` + dynamic `load()` chain.
  Editor-only (`*EditorView`) exports are never wired into componentsMap
  because apps/site is a read-only static renderer.
- **Chunking strategy / heavy-block taxonomy**: `src/components.ts` keeps the
  5 light blocks (`Callout`, `Code`, `Image`, `Math`, `Pdf`) eager-imported
  because their default render surfaces are small and shared by common prose
  routes. The 3 heavy blocks (`Jupyter` with Pyodide at roughly 10 MB,
  `NnViz` with TF.js at roughly 3 MB, and `AgentFlow` with React Flow at
  roughly 500 KB) must stay behind the production hydration boundary codified
  by ADR-0014 v0.3 D10: `componentsMap` maps those PascalCase keys to
  `.astro` wrappers under `src/components/`, each wrapper renders its matching
  React island from `src/islands/` with `client:load`, and each island
  closure-captures its `heavyBoundaryDimensions` import plus the dynamic
  `await import('@skb/block-*/ui-default')` load function. Heavy blocks must
  not use `client:only`, because the SSR skeleton is part of the
  zero-layout-shift contract. `astro.config.mjs` pins those heavy imports with Rollup
  `manualChunks` names (`block-jupyter`, `block-nn-viz`, `block-agent-flow`)
  for stable debug and regression-test filenames; the hint is not the
  correctness layer. `src/__tests__/lazy-chunking.test.ts` is the locking
  bundle-grep regression: prose-only route chunks must not contain `pyodide`,
  `tensorflow`, or `reactflow`, and the 3 heavy chunks must remain distinct.
  Wave 5 ships the `plugin-placeholder` tier — `block-jupyter` /
  `block-nn-viz` / `block-agent-flow` `ui-default` modules are NOT
  dynamic-imported by the islands at v0.4, so the prose-only chunk-leak
  guarantees are trivially satisfied. The `manualChunks` pins remain in
  `astro.config.mjs` as forward-compat seams for the `plugin-real-runtime`
  tier.
- **Pyodide CDN hosting (Jupyter heavy block)**: **Phase 2+ plugin-real-runtime
  tier forward-pointer** — at v0.4 the
  Jupyter island is a placeholder and does NOT load Pyodide; the CDN
  allowlist below applies when the future `plugin-real-runtime` tier
  (ADR-0014 next amendment) restores the dynamic load chain. The apps/site
  Jupyter island (`src/islands/JupyterIsland.tsx` → `@skb/block-jupyter/ui-default`
  → `PyodideAdapter`) loads the Pyodide runtime + the default libraries
  (`numpy` / `pandas` / `matplotlib`) from
  `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/` (jsdelivr CDN; Pyodide
  core download + auto-resolved `.whl` packages share this base URL).
  The version segment `v0.27.7` is string-hardcoded at the
  `new PyodideAdapter({ boot: { indexURL } })` call site in
  `packages/block-jupyter/src/ui-default/Jupyter.tsx` and MUST stay
  byte-equal to the resolved `pyodide` version of the
  `packages/kernel-pyodide` package (currently `pyodide@0.27.7` per
  `pnpm-lock.yaml`). Future Pyodide upgrades MUST update both places in
  the same PR (regression-grep: `cdn.jsdelivr.net/pyodide/v` literal must
  match the resolved dep version). No CSP is configured at apps/site
  today; if a CSP is added later, `cdn.jsdelivr.net` must be allowlisted
  under `script-src` / `connect-src` (deferred to a CSP-introduction PR).

## Runtime persistence

### Server endpoints (Wave 6 Stage B path-(b))

- `/api/notes/[...slug]` is the apps/site-origin persistence endpoint selected
  by ADR-0018 v0.6 D11+D12. It is an Astro API route with
  `export const prerender = false`, so it stays server-only while existing note
  pages remain prerendered.
- The endpoint persists `NoteState` across two files in
  `content/notes/<slug>/`:
  - `index.mdx` — the canonical content file owned by `@skb/content-types`.
    The MDX body is replaced with `NoteState.mdxSource` on each save; existing
    YAML frontmatter is preserved verbatim (no fields added or modified).
  - `state.json` — a sibling sidecar carrying only persistence metadata
    `{ "lastModified": number, "version": number }`. Wave 6 Stage B holds the
    `@skb/content-types` frontmatter authority invariant by keeping these
    fields out of the MDX frontmatter; extending the frontmatter schema to
    cover `lastModified` / `version` would require a coordinated
    `@skb/content-types` amendment + ADR-0018 follow-up.
- `GET /api/notes/<slug>` reads `index.mdx`, splits frontmatter from body, and
  reads the sibling `state.json` sidecar if present. It returns JSON
  `{ mdxSource, lastModified, version }`. When the sidecar is absent (notes
  that have never been saved through the endpoint), `lastModified` falls back
  to the MDX file `mtimeMs` and `version` falls back to `1`. Missing
  `index.mdx` returns `{ ok: false, error }` with HTTP 404.
- `POST /api/notes/<slug>` accepts `NoteState` JSON with string `mdxSource`,
  numeric `lastModified`, and numeric `version`. The endpoint reads the
  existing `index.mdx`, preserves its frontmatter verbatim, replaces the body
  with `state.mdxSource`, and writes the supplied `lastModified` + `version`
  to the sibling `state.json` sidecar. It returns `{ ok: true }` on success.
  Invalid request bodies return HTTP 400. POST against a missing `index.mdx`
  returns HTTP 404 — the endpoint refuses to create new notes, because a
  body-only POST cannot supply the `title` / `date` / `tags` / `draft`
  frontmatter required by the `@skb/content-types` schema; new-note creation
  is out of Wave 6 Stage B scope. Filesystem failures return HTTP 500. All
  error responses use `{ ok: false, error: string }`.
- `astro.config.mjs` must keep the Node standalone adapter configured for local
  preview/runtime endpoint execution. Astro 5.18 removed the old
  `output: "hybrid"` literal; the supported `output: "static"` default now
  provides mixed prerendered pages plus non-prerendered server endpoints.
- The separate `apps/api` server path remains the Phase 3+ path-(a) alternative
  for multi-user collaboration, auth boundaries, or separate deployment
  topology. Wave 6 Stage B path-(b) does not add that server.

## Modifying this file

Update this file when changing route structure, content frontmatter shape, build output format, or the theme-control mechanism. Any modification to this file triggers `pr-gate` 5.5 review (CONTRACT.md is a high-risk surface per the agent-contract).

## Related

- [Design spec §1.1 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [ADR-0003 headless / presentational split](../../docs/decisions/ADR-0003-headless-presentational-split.md) — D5 (light + dark Phase 1) / D6 (manual-only persistence)
- [@skb/block-agent-flow contract](../../packages/block-agent-flow/CONTRACT.md)
- [@skb/block-callout contract](../../packages/block-callout/CONTRACT.md)
- [@skb/block-code contract](../../packages/block-code/CONTRACT.md)
- [@skb/block-image contract](../../packages/block-image/CONTRACT.md)
- [@skb/block-jupyter contract](../../packages/block-jupyter/CONTRACT.md)
- [@skb/block-math contract](../../packages/block-math/CONTRACT.md)
- [@skb/block-nn-viz contract](../../packages/block-nn-viz/CONTRACT.md)
- [@skb/block-pdf contract](../../packages/block-pdf/CONTRACT.md)
- [@skb/design-tokens contract](../../packages/design-tokens/CONTRACT.md)
- [agent-contract.md `editor-integrator`](../../agent-contract.md)
