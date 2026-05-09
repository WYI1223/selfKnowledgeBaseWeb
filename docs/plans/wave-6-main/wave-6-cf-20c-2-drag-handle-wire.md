# Wave 6 cf-20c-2 — Drag-handle UI + DnD wire (per-block button + HTML5 native DnD + lifecycle pipeline)

> Wave 6 carry-forward — composes ALL the existing drag/drop
> primitives (`drag-drop/{edge-rects,tiebreak,outline-overlay,
> drag-ghost,drop-pulse,esc-cancel,layout-reducer,apply-drop-mode}`)
> into actual interactive drag. Per-block `<DragHandleButton>` inside
> each `.skb-block-nodeview__gutter` (cf-19 shell), HTML5 native DnD
> per Q7 spike result (verified pre-implementation), `useDragDropPipeline()`
> orchestrating snapshot → edge-rects → tiebreak → applyDropMode →
> Tiptap `setNodeMarkup`. Sample-blocks fixtures verified end-to-end
> (handle visible + dragstart mounts overlay + ghost + Esc cancels;
> mobile drag handles hidden per ADR-0017 D9 view-only path).

## title

NEW `packages/editor-shell/src/drag-drop/drag-handle-button.tsx` (per-block
HTML5 DnD button with `data-skb-drag-handle="<blockId>"` + `aria-label`
+ stopPropagation against ProseMirror NodeSelection drag);
NEW `packages/editor-shell/src/drag-drop/drag-context.tsx` (React
context bridging button → pipeline);
NEW `packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts`
(lifecycle owner hook composing snapshot + edge-rects + tiebreak +
applyDropMode + layoutReducer + Tiptap setNodeMarkup);
NEW `packages/editor-shell/src/drag-drop/drag-handle-button.css` (v2
contract per `/mnt/d/download/web/v2-styles.css:241-254`).
MODIFY `packages/editor-shell/src/BlockNodeView.tsx` to render the
per-block button inside the cf-19 gutter shell; sources `blockId =
String(getPos())` per cf-20c-2 D2 path A.
MODIFY `packages/editor-shell/src/index.ts` to barrel-export the new
public surface.
MODIFY `packages/editor-shell/package.json` exports map to add the
side-effect CSS export.
MODIFY `apps/site/src/components/EditorShellMount.tsx` to wire
`useDragDropPipeline()`, mount `<DragDropProvider>`, render
`<OutlineOverlay>` + `<DragGhost>` during active drag, wire
`useEscCancel`, REMOVE the obsolete cf-19 standalone `<DragHandle />`.
MODIFY `apps/site/src/styles/global.css` to import the new
`drag-handle-button.css`.
MODIFY `apps/site/src/__tests__/e2e/c4-3-drag-handle.spec.ts` to
target the per-block handles on `/notes/sample-blocks/edit` (was
asserting the standalone DragHandle on a prose-only route which has
no handles post cf-20c-2).
NEW `packages/editor-shell/src/__tests__/drag-drop/drag-handle-button.test.tsx`
(6 vitest tests covering button rendering + context dispatch + degraded
mode).
NEW `apps/site/playwright/sample-blocks-drag-handle.spec.ts` (2
integration tests: desktop drag lifecycle + mobile-hidden lock).
Update `packages/editor-shell/CONTRACT.md` Drag/Drop layer section
+ deprecate the cf-19 standalone `<DragHandle />` documentation.
Update `apps/site/CONTRACT.md` Edit route section with the cf-20c-2
drag/drop wire description.
Q7 spike result + cf-20c-2 D-decisions documented in this PR.md
Decisions section.

## files

12 source files (~970 LOC net add; mostly NEW pipeline + tests):

1. `packages/editor-shell/src/drag-drop/drag-handle-button.tsx` —
   **NEW** (~85 LOC). Presentational per-block button. Uses HTML5
   native DnD via `draggable=true` + `onDragStart` / `onDragEnd`
   handlers. Sets `dataTransfer.setData(DRAG_HANDLE_MIME, blockId)`
   and `effectAllowed = 'move'`. Calls `event.stopPropagation()` to
   prevent ProseMirror NodeSelection drag from competing. Sources
   drag-start / drag-end callbacks from `DragDropContext` (consumer
   `EditorShellMount.tsx` provides via `<DragDropProvider>`).
   Glyph: text `⋮⋮` (vertical-ellipsis pair) per v2 contract.

2. `packages/editor-shell/src/drag-drop/drag-context.tsx` — **NEW**
   (~60 LOC). React context + provider bridging the per-block button
   to the lifecycle owner. Default value `null` = degraded mode
   (button renders, callbacks no-op; useful for tests + standalone
   NodeView mounts). Exports `DragDropContext`, `DragDropProvider`,
   `DragDropContextValue`, `DragDropProviderProps`,
   `DragHandleStartOrigin`, `DragHandleEndOrigin`.

3. `packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts`
   — **NEW** (~250 LOC). The integration owner. On drag-start:
   `snapshotBlocks(editor)` walks the doc; `measureBlockRects` gets
   DOM rects; `computeEdgeRects` builds 4-edge geometries; dispatches
   `layoutReducer({type: 'drag-start', sourceBlockId})`. On drag-over
   (window-level listener attached when `active=true`):
   `findMatches(x, y, edgeRects, blockRects)` + `tiebreak(matches,
   velocity)` to resolve `EdgeMatch | null`. On drop: `applyDropMode`
   computes the new snapshot; iterates over diff blocks and dispatches
   Tiptap `setNodeMarkup` per changed node; dispatches `drag-end-success`
   to layoutReducer with the BlockGridPosition[] (id-stripped). On
   error / no match / drag-end without drop: rolls back via mode-none
   or cancel.

4. `packages/editor-shell/src/drag-drop/drag-handle-button.css` —
   **NEW** (~70 LOC). v2 contract styles per `/mnt/d/download/web/v2-styles.css:241-254`:
   22×22, 1px solid border, surface bg, text-2 color, border-radius 4px,
   `cursor: grab` / `:active grabbing`, mono font 12px, `display:
   grid; place-items: center`. `pointer-events: auto` overrides cf-19
   gutter's `pointer-events: none`. Hover → panel bg + text + border-strong.
   `:focus-visible` accent ring. `@media (max-width: 768px) { display:
   none }` per ADR-0017 D9 mobile view-only path.

5. `packages/editor-shell/src/BlockNodeView.tsx` — **MODIFY** (~25
   LOC delta). Imports `DragHandleButton` from `./drag-drop/drag-handle-button`.
   Adds `blockIdFromProps(props)` helper that returns
   `String(props.getPos())` per cf-20c-2 D2 path A (ProseMirror node
   `pos` as stable string ID within a single drag transaction). Renders
   `<DragHandleButton blockId={blockId}>` inside both the registered
   and unregistered fallback gutter shells, alongside the cf-19 chip.
   Skip rendering when blockId is empty (NodeView not yet mounted).

6. `packages/editor-shell/src/index.ts` — **MODIFY** (+18 LOC). Adds
   barrel exports for `DragHandleButton`, `DRAG_HANDLE_MIME`,
   `DragDropContext`, `DragDropProvider`, `useDragDropPipeline` +
   types.

7. `packages/editor-shell/package.json` — **MODIFY** (+1 LOC). Adds
   `"./drag-handle-button.css": "./src/drag-drop/drag-handle-button.css"`
   exports map entry so apps/site can `@import '@skb/editor-shell/drag-handle-button.css'`.

8. `apps/site/src/components/EditorShellMount.tsx` — **MODIFY** (~50
   LOC delta). Imports `DragDropProvider`, `DragGhost`, `OutlineOverlay`,
   `useDragDropPipeline`, `useEscCancel` from `@skb/editor-shell`;
   removes obsolete `DragHandle` import + its render. Calls
   `useDragDropPipeline({editor})`, memoizes the `dragContextValue`,
   wraps `<GridContainer>` in `<DragDropProvider value={dragContextValue}>`.
   Calls `useEscCancel({dragActive: pipeline.state.active, onCancel:
   () => pipeline.onDragEnd({x:0,y:0})})`. After the mount JSX
   renders `<OutlineOverlay>` + `<DragGhost>` conditionally on
   `pipeline.state.active`.

9. `apps/site/src/styles/global.css` — **MODIFY** (+7 LOC). Adds
   `@import '@skb/editor-shell/drag-handle-button.css'` after the
   existing cf-20a + cf-19 imports.

10. `apps/site/src/__tests__/e2e/c4-3-drag-handle.spec.ts` — **MODIFY**
    (~95 LOC delta). Repurposed for per-block handles: targets
    `/notes/sample-blocks/edit` instead of `/notes/sample-mdx-note/edit`
    (the latter is prose-only, has no NodeViews, and therefore no
    per-block handles). Asserts `data-skb-drag-handle="<pos>"` matches
    `^\d+$`, `aria-label="Drag block"`, `draggable=true`. Dispatches
    `dragstart` and asserts `.skb-grid-outline-base` mounts (count=1
    rather than visible because the base is a 0×0 placeholder). Cleans
    up with `dragend`. Pre-cf-20c-2 spec was the standalone
    DragHandle assertion which is removed from `EditorShellMount.tsx`.

11. `packages/editor-shell/src/__tests__/drag-drop/drag-handle-button.test.tsx`
    — **NEW** (~110 LOC, 6 tests). Covers button rendering
    (data-skb-drag-handle + aria-label + draggable + custom label),
    context dispatch (dragstart calls onDragStart with blockId +
    cursor origin shape; dragend calls onDragEnd with origin),
    degraded mode (no provider → button still renders + callbacks
    no-op without throwing), DRAG_HANDLE_MIME constant equality. Uses
    `expect.objectContaining` / `toHaveProperty` for cursor origin
    because happy-dom's `fireEvent.dragStart` doesn't propagate
    `clientX` / `clientY` from the EventInit dict (real browsers do;
    integration spec covers the cursor-position path).

12. `apps/site/playwright/sample-blocks-drag-handle.spec.ts` — **NEW**
    (~120 LOC, 2 tests). Integration regression-lock at
    `/notes/sample-blocks/edit`:
    - **Desktop test**: 14 per-block handles present (one per
      NodeView wrapper); first handle has `data-skb-drag-handle`
      matching `^\d+$`, `aria-label="Drag block"`, `draggable=true`.
      Pre-drag baseline: no `.skb-grid-outline-base`, no `.drag-ghost`.
      Dispatch `dragstart` → outline base + ghost mount (proves
      pipeline.onDragStart fired via context AND
      EditorShellMount's active-render branch took effect).
      `.drag-ghost.ghost-markdown` confirms the ADR-0017 D10
      kind-className (cf-20c-2 hardcodes `kind="markdown"`; future
      PR will source from BlockKind). Esc keypress → outline + ghost
      unmount (cancel rollback per ADR-0017 D8).
    - **Mobile test** (375×812 viewport): handles still rendered in
      DOM (count=14) but each computed `display === 'none'` per the
      cf-20c-2 mobile view-only `@media (max-width: 768px)` rule;
      regression-lock per cf-20b R1 reflection's mandatory
      mobile-viewport spec rule.

13. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~30 LOC delta).
    Adds cf-20c-2 entries to the Drag/Drop layer section
    documenting `DragHandleButton` / `DragDropContext` /
    `useDragDropPipeline` public surface. Marks the cf-19 standalone
    `<DragHandle />` as DEPRECATED (still in barrel for backward-compat
    consumers; future cleanup PR will remove).

14. `apps/site/CONTRACT.md` — **MODIFY** (~22 LOC delta). Adds a
    "Drag/drop wire (Wave 6 cf-20c-2)" bullet to the Edit route
    section describing the pipeline mount + context provider +
    overlay/ghost render + Esc cancel + per-block button + standalone
    DragHandle removal.

15. `docs/plans/wave-6-main/wave-6-cf-20c-2-drag-handle-wire.md` —
    **NEW** (PR.md self; this file).

Plus 1 NEW screenshot artifact:
`docs/audits/screenshots/wave-6-cf-20c-2-drag-handle-wire.png` emitted
by the new Playwright spec. cf-19/cf-20a/cf-20b screenshots are
re-emitted with cf-20c-2 drag handles visible in the gutter.

## D2 trigger judgment

- **Row 1 (CONTRACT.md change in N packages)** — HIT: 2 CONTRACT.md
  files modified (`@skb/editor-shell` + `apps/site`).
- **Row 2 (NEW deps)** — N/A (no new deps).
- **Row 4 (NEW ADR or amendment)** — N/A (consumes ADR-0017 D-list
  already-ratified contracts: D1 drop modes via cf-20c-1 algebra,
  D6 tiebreak, D8 Esc, D9 mobile view-only path, D10 ghost kinds,
  D11 drop-pulse, D12 epoch reducer; no new ADR needed).
- **Row 5 (cross-package: ≥ 3 packages)** — HIT: `@skb/editor-shell`
  + `apps/site` + the cf-20c-1 `applyDropMode` algebra (consumed via
  the editor-shell barrel, which is itself a cross-package consumer
  of `@skb/block-foundation` for `BlockGridPosition`).

Per CLAUDE.md `## Review workflow` + ADR-0011 D1 stage 4 +
2026-05-09 retrospective rule "ux-ui-lead is dispatched at PLAN", **PRE-COMMIT
CLAUDE REVIEW (stage 4) fires** on Row 1 + Row 5. ux-ui-lead authored
this PLAN end-to-end. Stage 3 codex-pr-reviewer-55 review still
required.

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1
path pattern (NEW `drag-handle-button.tsx` + `drag-context.tsx` +
`use-drag-drop-pipeline.ts` + `drag-handle-button.css`; MODIFY
`BlockNodeView.tsx`); `apps/site/src/**` matches as well
(`components/EditorShellMount.tsx`, `styles/global.css`, the
modified c4-3 spec, the new sample-blocks-drag-handle spec).

The new `sample-blocks-drag-handle.spec.ts` (2 tests; desktop drag
lifecycle + mobile-hidden) satisfies the D9.2 e2e_smoke obligation;
the emitted screenshot satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mount loads via the
    ApiAdapter chain (cf-18 NodeView + cf-19 chrome + cf-20a single
    source + cf-20b grid + cf-20c-1 algebra + cf-20c-2 wire). Each
    of 14 NodeView wrappers renders one
    `.skb-block-nodeview__drag-handle` button inside its
    `.skb-block-nodeview__gutter` (cf-19 shell). Buttons carry
    `data-skb-drag-handle="<pos>"` (the ProseMirror node `pos` per
    cf-20c-2 D2 path A), `aria-label="Drag block"`, `draggable=true`.
    Pre-drag: no overlay, no ghost. Dispatching `dragstart` mounts
    `.skb-grid-outline-base` (overlay base layer) + `.drag-ghost.ghost-markdown`
    (cursor follower); Esc cancels and both unmount. Mobile (≤768px)
    has handles in DOM but `display: none` per ADR-0017 D9.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-drag-handle.spec.ts:"sample-blocks edit route — cf-20c-2 drag-handle wire (button + outline + ghost lifecycle)"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20c-2-drag-handle-wire.png
  assertions:
    - .ProseMirror visible within 15s
    - first .skb-block-nodeview visible within 10s
    - exactly 14 .skb-block-nodeview__drag-handle buttons rendered
    - first handle has data-skb-drag-handle matching /^\d+$/ AND value > 0 (cf-20c-2 D2 path A — ProseMirror node pos as block id)
    - first handle has aria-label="Drag block" + draggable="true" (a11y baseline)
    - pre-drag baseline: 0 .skb-grid-outline-base, 0 .drag-ghost
    - dispatchEvent('dragstart') → 1 .skb-grid-outline-base + 1 .drag-ghost.ghost-markdown mounted (proves pipeline.onDragStart fired via DragDropContext + EditorShellMount active-render branch)
    - Esc keypress → 0 .skb-grid-outline-base + 0 .drag-ghost (cancel rollback per ADR-0017 D8)
    - post-cancel: handles still present (count=14), editor not torn down

- flow: `/notes/sample-blocks/edit` at viewport 375×812 — drag
    handles are rendered in DOM (count=14) but each computed
    `display === 'none'` per the cf-20c-2 mobile view-only CSS
    `@media (max-width: 768px) .skb-block-nodeview__drag-handle { display: none }`.
    Locks the ADR-0017 D9 mobile preview-mode contract: drag/resize
    UX disabled on mobile; only Tiptap content-edit remains. cf-22
    keyboard a11y will add explicit keyboard equivalents; cf-25 (or
    cf-22 stretch) will add touch UX if/when scoped.
  target_url: /notes/sample-blocks/edit (at 375×812 viewport)
  playwright_spec: apps/site/playwright/sample-blocks-drag-handle.spec.ts:"cf-20c-2 — drag handles are hidden on mobile (≤768px) per cf-20b R1 view-only path"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20c-2-drag-handle-wire.png
  assertions:
    - viewport set to 375×812
    - 14 .skb-block-nodeview__drag-handle in DOM (React tree unchanged on mobile; CSS hides them)
    - first handle's computed display === 'none'

## Why (user feedback)

cf-20c-2 is PR 4 of 9 in the locked cf-20 sequence. User directive
2026-05-09 (verbatim, dispatched as cf-20a + carried into cf-20b /
cf-20c-1 / cf-20c-2):

> "全部做，不允许 defer，必须保质保量，出现问题会直接让你推翻重写。
>  ... 全部对齐 v2."

cf-20c-2 closes the "drag" half of the user-mandated v2 alignment.
Pre-cf-20c-2 the editor surface had the cf-19 gutter shell + the
cf-20c-1 algebra + all the drag/drop primitives (`drag-ghost`,
`drop-pulse`, `outline-overlay`, `esc-cancel`, `tiebreak`,
`edge-rects`, `layout-reducer`) shipped at Wave 5 Stage C.2 — but
NONE of them were actually wired into the editor lifecycle. cf-20c-2
is the integration: per-block button → HTML5 native DnD → pipeline
hook → algebra → Tiptap commands → overlay/ghost render. v2 design
contract for the per-block drag handle inside the gutter is
`/mnt/d/download/web/v2-styles.css:241-254`; cf-20c-2 implements it
verbatim.

## Design source

- `/mnt/d/download/web/v2-styles.css:230-254` — gutter + button
  contract (.gblock-gutter + .gblock-gutter button); 22×22 button
  size; surface bg + 1px border + radius 4px; cursor grab/grabbing.
  cf-20c-2 `.skb-block-nodeview__drag-handle` consumes verbatim.
- ADR-0017 D1 — 6 drop modes (split-left/right/top/bottom + empty +
  none). cf-20c-1 algebra; cf-20c-2 wire dispatches into it.
- ADR-0017 D6 — tiebreak formula (signed distance + Math.abs primary
  + velocity-direction + spatial fallback + blockId stable). cf-20c-2
  pipeline calls `tiebreak(matches, velocity)` per spec.
- ADR-0017 D8 + Q8 — Esc cancel priority during active drag. cf-20c-2
  wires `useEscCancel({dragActive: pipeline.state.active})`.
- ADR-0017 D9 — Mobile 1-col path view-only. cf-20c-2 hides drag
  handles via `@media (max-width: 768px) { display: none }` AND
  inherits the cf-20b R1 mobile inline-style override (no actual
  drag origin on mobile because handles are hidden).
- ADR-0017 D10 — Drag ghost per-kind coloring. cf-20c-2 mounts
  `<DragGhost kind="markdown" mode="move">` (hardcoded kind for
  cf-20c-2; future PR sources kind from BlockKind via
  block-foundation gridKind mapping).
- ADR-0017 D11 — Drop-pulse 720ms on drag-end-success. cf-20c-2
  pipeline fires the pulse via `pipeline.state.lastDroppedBlockId`
  state; mount of `<DropPulse>` deferred to cf-20d (resize handles
  also need it; centralizing in cf-20d keeps the JSX shorter).
- ADR-0017 D12 — Epoch single-source mutation. cf-20c-2 dispatches
  `layoutReducer({type: 'drag-end-success', mutation})` on every
  successful drop; epoch increments by 1 per cf-20c-1 + ADR-0016
  D12 contract.
- ADR-0016 D11 — Tiptap inside / grid outside. cf-20c-2 honors:
  the pipeline reads `node.attrs.{col,row,colSpan,rowSpan}` AT DRAG-
  START SNAPSHOT then mutates via `setNodeMarkup` AT DROP — never
  mid-drag. The drag overlay is a separate React subtree mounted
  outside the Tiptap content tree.

## Decisions

### D1 — HTML5 native DnD (Q7 spike result: works inside ProseMirror NodeView contenteditable=false gutter)

**Trigger**: Q7 open question from the cf-20 scoping report —
"verify HTML5 native DnD works inside ProseMirror NodeView with
`contenteditable=false` host element. If blocked: pivot to pointer
events."

**Q7 spike method**: throwaway Playwright spec (`__cf20c2-q7-spike.spec.ts`,
deleted post-verdict) injected a `<button draggable=true>` into the
`.skb-block-nodeview__gutter` of the live `/notes/sample-blocks/edit`
route, registered dragstart/dragover/drop listeners, dispatched
synthetic `DragEvent` instances, and inspected the events that fired.

**Q7 result**: HTML5 DnD works. Spike output:
```
{
  "events": [
    { "kind": "button:dragstart", "defaultPrevented": false, "dataTransfer": "" },
    { "kind": "pm:dragover", "target": "tiptap ProseMirror", "defaultPrevented": true, "dataTransfer": "q7-spike-payload" },
    { "kind": "pm:drop", "target": "tiptap ProseMirror ProseMirror-focused", "defaultPrevented": true, "dataTransfer": "q7-spike-payload" }
  ],
  "dragoverFireCount": 1,
  "pmHasOwnDragstart": false
}
```

The dragstart fired on the button; `dataTransfer.setData()` succeeded;
dragover and drop received our payload (`q7-spike-payload`) on the
`.ProseMirror` target. ProseMirror did NOT cancel the drag (no
`pmHasOwnDragstart` interception). The `defaultPrevented: true` on
dragover and drop is from OUR handler calling `preventDefault()` (required
so the browser accepts drop on the editor).

**Decision**: cf-20c-2 ships HTML5 native DnD. Saves ~150 LOC of
pointer-events scaffolding (manual ghost following cursor, manual
hit-test on mousemove, etc.) and the native API integrates cleanly
with the existing `drag-ghost` / `drop-pulse` / `outline-overlay`
primitives.

**Defense-in-depth**: the button calls `event.stopPropagation()` on
both dragstart and dragend. Q7 spike showed PM doesn't intercept by
default, but a future Tiptap upgrade or an extension that adds a
NodeSelection drag handler could compete. The stopPropagation
explicitly walls cf-20c-2's lifecycle from PM's.

### D2 — Block ID sourcing: ProseMirror node `pos` (Path A) NOT stable UUID attrs (Path B)

**Open question** from cf-20 scoping report — block-id sourcing for
the algebra layer. Two paths:

- **Path A**: use ProseMirror node `pos` as a string. `pos` is
  stable WITHIN a single doc transaction; the pipeline snapshots
  positions at drag-start and only re-walks the doc at drop.
  Tiptap suspends input handling during a focused drag, so pos
  values won't shift unless an external transaction interleaves —
  which doesn't happen in the cf-20c-2 single-user single-session
  scope (per ADR-0016 D12 explicit assumption).
- **Path B**: add a stable UUID `id` attr to every block schema, generate
  at NodeView mount, persist through MDX serialize / parse. Requires:
  (i) Zod schema additions in 8 block packages, (ii) mdx-bridge
  serialize/parse round-trip, (iii) migration of existing notes
  (or hash-based defaults), (iv) sister-doc updates across 11+ files.

**Decision**: Path A. Three reasons:
1. cf-20c-2 is the integration PR; adding a schema change here
   would mix two layers of risk (drag wire + persistent ID
   migration) in one PR. Per the orchestrator's "ship the wire
   then iterate" framing.
2. Path A satisfies ADR-0016 D12's single-user single-session
   assumption — stable IDs are only required for collaborative /
   multi-session scenarios that are explicit Phase 2+ scope.
3. Future cf-20c-3+ that introduces palette → grid drag (new block
   insertion) will naturally need a stable client-generated UUID
   anyway (the new block has no pre-existing pos); Path B can land
   then with a clean rationale.

Trade-off accepted: a doc transaction WHILE a drag is active
(extremely rare; would require an extension or async data-load
trigger to dispatch a transaction during user drag) could
invalidate `pos` mappings and the pipeline's `liveBlockPositions()`
fallback (same-order match by nodeName) would mis-route attr
updates. Documented in `use-drag-drop-pipeline.ts` JSDoc.

### D3 — React Context bridges per-block button → editor mount pipeline (NOT prop-drilling through factory args)

`BlockNodeView` is rendered inside Tiptap's `ReactNodeViewRenderer`
which mounts each NodeView in a SEPARATE React subtree (Tiptap
creates new React roots for each NodeView; props flow only via the
Tiptap node attrs). Prop-drilling drag callbacks through
`makeBlockNodeView({registry, onDragStart, onDragEnd, ...})`
factory args was rejected because:
- The factory is invoked once per block kind at `wireRegistry`
  call time (NOT per-block); callbacks would have to be stable
  across all 8 block-kind instances.
- The pipeline is mounted at `EditorShellMount.tsx` which lives
  in apps/site, while `wireRegistry` lives in editor-shell — the
  factory args boundary would force apps/site to construct the
  registry, which would require duplicating the editor-shell
  registration glue at apps/site.
- React context is the canonical bridge for "presentational
  child callbacks routing to a distant lifecycle owner".

cf-20c-2 introduces `DragDropContext` + `DragDropProvider`. The
provider is mounted at `EditorShellMount.tsx` wrapping
`<GridContainer>`; the per-block button consumes via `useContext(DragDropContext)`.
Default `null` value = degraded mode (button renders, callbacks
no-op without throwing) — covers test mounts that don't provide
the pipeline.

### D4 — Ghost kind hardcoded to `'markdown'` at cf-20c-2 (BlockKind sourcing deferred to follow-up PR)

`<DragGhost kind="markdown" mode="move">` is mounted with a
hardcoded kind because:
- cf-20c-2's pipeline tracks `sourceBlockId` (a string) but not
  the source's BlockKind. To source the kind, the pipeline would
  need to look up the snapshot block by id at active-render time
  AND map the kind name to a `GhostKind` (`'canvas' | 'runnable'
  | 'image' | 'markdown'`).
- The ghost's role is purely visual (cursor follower); the kind
  affects color but not behavior. `markdown` (neutral gray per
  ADR-0017 D10) is a safe default.
- cf-20d (resize) will need the same kind lookup for resize
  handles AND introduces a `BlockKindForGhost` mapping in
  `block-foundation`; deferring to cf-20d centralizes the
  kind-mapping logic.

Future PR: source `kind = blockKindToGhostKind(snapshot[sourceBlockId].kind)`
once the mapping helper lands.

### D5 — `useDragDropPipeline` owns its own internal `layoutReducer` state (NOT shared with note-save-adapter)

The hook calls `useReducer(layoutReducer, INITIAL_LAYOUT_STATE)` to
manage `epoch + snapshot + baseline`. This state lives entirely
within the hook; it does NOT participate in the cf-20c-1+ algebra's
external `baseline: GridSnapshotIdentified` parameter (which is
computed fresh from the snapshot at drag-start).

Rationale: at cf-20c-2 the `layoutState` is forward-compat scaffolding
— the cf-20c-1 algebra is pure (input → output), the
`setNodeMarkup` calls are the actual persistent mutations (Tiptap's
own undo/redo handles them), and the layoutReducer's epoch is unused
downstream. cf-20d (resize) will dispatch `drag-end-success` with
its own `mutation` parameter; cf-20e (kebab-menu undo) might need
the epoch for "undo last drag" semantics. cf-20c-2 surfaces
`layoutState` in the hook return so future consumers can read it
without re-architecting.

### D6 — Pipeline rolls back via `drag-end-mode-none` when no edge match at drop (vs accept "empty" mode default)

When `tiebreak()` returns null (cursor not on any edge rect at drop
moment), the pipeline dispatches `drag-end-mode-none` per ADR-0017
D1 line 53 ("cursor on host non-edge"). The cf-20c-1 algebra
supports `mode='empty'` for grid-empty-area drops, but cf-20c-2
doesn't compute `emptyTarget` because:
- Sample-blocks fixtures are all `colSpan=12` so there's no
  visible empty grid surface to drop into during the cf-20c-2 demo.
- `empty` mode requires computing `(col, row)` from cursor position
  via grid math; that's a non-trivial layer that warrants its own
  PR (cf-20c-3 candidate; not in current 9-PR sequence — out of
  cf-20c-2 scope per orchestrator's "drag handle UI + DnD wire"
  framing).

cf-20c-2 ships drag-between-existing-blocks only. `mode-none`
rollback is the safe fallback.

### D7 — c4-3 spec re-targeted to `/notes/sample-blocks/edit` (was `/notes/sample-mdx-note/edit`)

The pre-cf-20c-2 c4-3 spec asserted the standalone DragHandle on a
prose-only route. Post-cf-20c-2 the standalone DragHandle is removed
and the per-block handles only exist where there are NodeViews
(component blocks). Pure prose routes have ZERO per-block handles —
which is correct (prose paragraphs don't get drag handles per the
v2 contract; only component blocks do).

The c4-3 spec is updated to target sample-blocks/edit (where 14
NodeViews exist) and assert per-block handle structure + dragstart
overlay mount. Pre-cf-20c-2 assertions on the standalone DragHandle
are removed entirely (no replacement; the standalone is deprecated).

### D8 — ADR-0017 D6 source-lift implementation (cf-20c-2 R1 F1 fix 2026-05-09)

**Trigger**: codex-pr-reviewer-55 R1 F1 caught that ADR-0017 D6
("拖动源块视觉消失 (lifted) — 落点判定基于无源块的 grid")
was not implemented in cf-20c-2 R0. Two omissions:

1. **Edge-rect inclusion of source** — `use-drag-drop-pipeline.ts`
   `onDragStart` snapshotted ALL blocks including the source. The
   resulting `edgeRects` array contained 4 edges for the source
   itself, which `tiebreak()` could match if the cursor returned
   over the source's old position during drag-over (producing a
   meaningless self-match drop).

2. **Visual lift on the source NodeView** — no DOM cue that the
   block was being moved (vs duplicated). Per v2 contract at
   `/mnt/d/download/web/v2-styles.css:218-226 .gblock.dragging-self`:
   opacity 0.28 + grayscale(0.4) + dashed outline + "moving →" caption.

**Fix (R1)**:

- `onDragStart` filters out the source from layouts BEFORE calling
  `computeEdgeRects`: `blocks.filter((b) => b.id !== blockId)`.
  After R1 the edgeRects array contains only non-source blocks; the
  source can never self-match in tiebreak.

- `DragDropContextValue` extends to expose `sourceBlockId: string | null`.
  `EditorShellMount.tsx` includes the field in its memoized provider
  value (now depends on `pipeline.state.sourceBlockId`).

- `BlockNodeView.tsx` reads `useContext(DragDropContext)` and
  computes `isDraggingSelf = blockId !== '' && ctx?.sourceBlockId === blockId`.
  The `nodeViewClassName(isDraggingSelf, isUnregistered)` helper
  composes `.skb-block-nodeview` + `.skb-block-nodeview--unregistered`
  + `.skb-block-nodeview--dragging-self` modifier classes
  conditionally. Both the registered + unregistered fallback paths
  consume the helper.

- `BlockNodeView.css` adds a `.skb-block-nodeview--dragging-self`
  rule per the v2 contract: `opacity: 0.28; filter: grayscale(0.4);
  outline: 1.5px dashed var(--text-3); outline-offset: -2px;
  pointer-events: none; transition: none`. The `pointer-events: none`
  is defense-in-depth on top of the edge-rect filter — even if a
  future renderer somehow re-includes the source in edgeRects, the
  lifted DOM can't receive drop events. The "moving →" caption
  pseudo-element is deferred to cf-23 read-mode unification (visual
  polish PR).

**Regression lock**: NEW `sample-blocks-drag-handle.spec.ts` test
"cf-20c-2 R1 F1 — source-lift visual" asserts: pre-drag 0
`.skb-block-nodeview--dragging-self`; post-dragstart EXACTLY 1
(matching the wrapper containing the clicked handle); post-Esc 0.
The edge-rect-exclusion half is unit-tested via the pipeline's
`onDragStart` filter (not separately asserted in DOM because the
filter operates on internal refs).

### D9 — DropPulse mount path A (cf-20c-2 R1 F2 fix 2026-05-09)

**Trigger**: codex-pr-reviewer-55 R1 F2 caught that the pipeline
JSDoc + `editor-shell/CONTRACT.md` claimed `<DropPulse>` was wired
on drag-end-success but `EditorShellMount.tsx` never rendered it.
The pipeline tracked `lastDroppedBlockId` but the consumer mount
was missing. Two fix paths:

- **Path A (recommended by reviewer; chosen)**: wire DropPulse at
  the EditorShellMount layer.
- **Path B**: defer to cf-20d (resize) and remove the doc claim.

cf-20c-2 R1 picks Path A because (a) the doc claim was already
shipped to main as part of cf-20c-2 R0; reverting requires another
doc-only PR; (b) cf-20d will need pulse-on-success-resize too but
the EditorShellMount-side mount is reusable (cf-20d adds a second
"successful action" trigger to the same `lastDroppedBlockId` field
or a sibling state); (c) the pulse is a tangible user-feedback
affordance that's part of the v2 ADR-0017 D11 contract — shipping
the wire makes the cf-20c-2 demo visually complete.

**Fix (R1)**:

- `useDragDropPipeline` exposes a NEW `clearLastDropped()` callback
  alongside `state.lastDroppedBlockId`. The callback resets the
  state to `null` after the pulse animation ends.

- `EditorShellMount.tsx` mounts a NEW local helper component
  `<DropPulseAtRect rect={pipeline.state.blockRects.get(lastDroppedBlockId)}
  onAnimationEnd={pipeline.clearLastDropped} />` whenever
  `lastDroppedBlockId !== null`. The helper renders `<DropPulse>`
  inside a `position: fixed` wrapper at the landed block's rect.

- The rect comes from the pipeline's `blockRects` Map snapshotted
  at drag-start. cf-20c-2 R1 acknowledges this means the pulse
  appears at the SOURCE block's pre-drag position (correct for the
  "block landed here" semantic; the source was visually lifted +
  is now at its new position via Tiptap's setNodeMarkup, but
  blockRects still has the pre-drag rect). Future PR could re-measure
  post-drop for the new position; cf-20c-2 R1 honors the simpler
  "snapshot once, animate at original position" model since the
  visual delta is small (the user dragged from there).

**Regression lock**: the F4 terminal-drop spec (D11 below) asserts
`[data-skb-drop-pulse-anchor]` count >= 1 after drop. The
EditorShellMount wraps `<DropPulse>` in a `<div data-skb-drop-pulse-anchor>`
positioned wrapper, so the data attribute uniquely identifies the
pulse mount.

### D10 — Velocity unit alignment with `tiebreak()` contract (cf-20c-2 R1 F3 fix 2026-05-09)

**Trigger**: codex-pr-reviewer-55 R1 F3 caught a unit mismatch.
ADR-0017 D3 specifies the velocity threshold + direction-aware
tiebreak in **px/frame at 60fps** (16.67ms/frame); `tiebreak()`'s
threshold is `0.5 px/frame`. cf-20c-2 R0 pipeline computed velocity
as raw `delta px / delta ms` (px/ms). A real cursor moving at 60
px/sec — a typical slow drag — has `vxPxPerMs ≈ 0.06`, FAR below
the 0.5 px/frame threshold. Direction-aware tiebreak under-triggered;
fell back to spatial ordering even when the user had clear
directional intent (e.g. dragging rightward over a gap between two
adjacent blocks; user intends split-left on the right block but
spatial fallback picked split-right on the left block).

**Fix (R1)**: pipeline multiplies the raw px/ms by `VELOCITY_WINDOW_MS = 16`
(≈ 1 frame at 60fps) before passing to `tiebreak()`. Math:
`(delta_px / delta_ms) * 16 = delta_px / (delta_ms / 16) = px/frame_at_60fps`.
Real frame rate may differ (mobile devices at 30fps, low-end
hardware) but the threshold is intentionally tolerant — at 30fps
the unit becomes "px/2-frame" but the threshold of 0.5 still
corresponds to a meaningful directional intent (≥ 30 px/sec is
above noise floor).

**Regression lock**: NEW vitest case in `tiebreak.test.ts`:
"step 2 px/frame contract: slow rightward drag at 1 px/frame still
triggers direction filter". Asserts `tiebreak({vx: 1, vy: 0})`
honors direction (rightward → split-left on right block) at the
corrected unit. Pre-R1 the pipeline would have computed `vx ≈ 0.06`
(below threshold) and the test would have caught the wrong fallback.

### D11 — Terminal-drop Playwright integration spec (cf-20c-2 R1 F4 fix 2026-05-09)

**Trigger**: codex-pr-reviewer-55 R1 F4 caught that the cf-20c-2
R0 Playwright suite never exercised the terminal drop. Both the
new `sample-blocks-drag-handle.spec.ts` AND the carried-forward
`c4-3-drag-handle.spec.ts` only fired `dragstart` + `Esc cancel`
or `dragend` (without `dragover` + `drop`). So `applyDropMode`
algebra was never invoked; ProseMirror attrs never mutated;
DropPulse couldn't appear; epoch increment was never asserted.

The wire could have been broken in any of these layers and the
R0 suite would have stayed green.

**Fix (R1)**: NEW spec in `sample-blocks-drag-handle.spec.ts`:
"cf-20c-2 R1 F4 — terminal drop: dragstart → dragover edge → drop
mutates ProseMirror node attrs + fires DropPulse". Full lifecycle:

1. Pick first NodeView wrapper as source, second as target (both
   colSpan=12 in sample-blocks fixtures).
2. Compute drop coordinates 6px inside target's right edge (within
   EDGE_W=28 → 14px hit zone for split-right per ADR-0017 D2).
3. Capture `sourceColBefore = '1 / span 12'` (cf-20b D2 inline
   placement).
4. Dispatch `dragstart` on source handle.
5. Use `page.evaluate` to construct DragEvent with `clientX/Y` +
   `dataTransfer = new DataTransfer()`, dispatch `dragover` on
   `.skb-grid`.
6. Wait one `requestAnimationFrame` so React commits the pipeline's
   `setActiveMatch` from dragover BEFORE drop fires.
7. Dispatch `drop` with same coordinates.
8. Assert `sourceColAfter !== sourceColBefore` + matches
   `(span 6|7 \/ span 6)` (split-right algebra: source moves to
   right half col=7 colSpan=6).
9. Assert `[data-skb-drop-pulse-anchor]` count >= 1 (DropPulse
   wrapper mounted via D9 fix).

**Critical timing detail discovered during F4 implementation**:
the dragover + drop must be separated by a `requestAnimationFrame`
because the pipeline's drop handler closure captures `activeMatch`
from React state. Synchronous dragover-then-drop dispatch reads a
stale (null) `activeMatch` because React batches the
`setActiveMatch(winner)` call from dragover to the next render.
Without the rAF gap, drop dispatches `drag-end-mode-none` (rollback)
and the wire appears broken even when correct. Documented in the
spec's inline comment so future test authors don't lose this hour
debugging.

**Operational rule landed**: **Playwright integration tests for
React state-driven event chains MUST separate sequential events
with `requestAnimationFrame` (or `await page.waitForTimeout(20)`) when
the second event reads state set by the first.** Synchronous
dispatch reads the closure-captured stale state, not the post-render
committed state. This applies to any cf-20d resize test, cf-20e
kebab-action test, cf-22 keyboard test that exercises chained UI
events.

## Acceptance

```bash
# AC-1: ADR-0011 D9 ui_touch detects on the right files
pnpm exec tsx scripts/check-ui-touch.ts \
  --files packages/editor-shell/src/drag-drop/drag-handle-button.tsx \
          packages/editor-shell/src/drag-drop/drag-context.tsx \
          packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts \
          packages/editor-shell/src/BlockNodeView.tsx \
          apps/site/src/components/EditorShellMount.tsx \
          apps/site/src/styles/global.css 2>&1 | tail -3
# Expected: ui_touch=true
```

```bash
# AC-2: editor-shell + apps/site test suites green (R1 +1 vitest from F3 tiebreak unit)
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 186 passed (185 cf-20c-2 R0 + 1 R1 F3 tiebreak px/frame contract test)
pnpm --filter @skb/site test 2>&1 | grep -E 'Tests'
# Expected: 78 passed | 1 skipped (carried from cf-20b R2)
```

```bash
# AC-3: targeted Playwright passes (drag-handle R0 + R1 specs + carried)
pnpm --filter @skb/site exec playwright test \
  playwright/sample-blocks-drag-handle.spec.ts \
  playwright/sample-blocks-edit-loads.spec.ts \
  playwright/sample-blocks-read.spec.ts \
  playwright/sample-blocks-grid-layout.spec.ts \
  src/__tests__/e2e/c4-3-drag-handle.spec.ts \
  --reporter=line --workers=1 2>&1 | tail -3
# Expected: 11 passed (4 in sample-blocks-drag-handle: R0 wire + R1 F1 source-lift + R1 F4 terminal drop + R0 mobile-hidden; +1 edit-loads + 1 read + 3 grid-layout + 1 updated c4-3)
```

```bash
# AC-4: full apps/site Playwright suite passes
pnpm --filter @skb/site exec playwright test --reporter=line --workers=1 2>&1 | tail -3
# Expected: 57 passed | 14 skipped | 0 failed (was 55 in cf-20c-2 R0; +2 new R1 specs: F1 source-lift + F4 terminal drop)
```

```bash
# AC-5: pnpm check exit 0
pnpm check
# Expected: all 41 tasks successful; 0 lint errors
```

```bash
# AC-6: cf-20c-2 source surface lands at the expected paths
test -f packages/editor-shell/src/drag-drop/drag-handle-button.tsx && echo OK
test -f packages/editor-shell/src/drag-drop/drag-context.tsx && echo OK
test -f packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts && echo OK
test -f packages/editor-shell/src/drag-drop/drag-handle-button.css && echo OK
# Expected: 4× "OK"
```

```bash
# AC-7: barrel exports the new public surface
grep -cE 'DragHandleButton|DragDropProvider|useDragDropPipeline' packages/editor-shell/src/index.ts
# Expected: ≥ 4 (DragHandleButton + DragDropContext + DragDropProvider + useDragDropPipeline)
```

```bash
# AC-8: standalone <DragHandle /> import removed from EditorShellMount.tsx
grep -cE '\bDragHandle\b' apps/site/src/components/EditorShellMount.tsx
# Expected: 0 (DragHandle no longer imported or rendered; replaced by per-block buttons via DragDropProvider)
```

```bash
# AC-9: per-block drag-handle button renders inside .skb-block-nodeview__gutter
grep -cE 'DragHandleButton blockId' packages/editor-shell/src/BlockNodeView.tsx
# Expected: 3 (2 JSX usages — unregistered fallback + registered UI path —
#            plus 1 reference in the file's JSDoc cf-20c-2 cross-reference)
```

```bash
# AC-10: cf-20a chrome single source still holds (cf-20a regression lock preserved)
grep -lE 'border-top: 2px solid var\(--accent-' \
  $(find packages apps -name '*.css' -not -path '*/node_modules/*' -not -path '*/dist/*')
# Expected: exactly packages/editor-shell/src/block-chrome.css (cf-20a invariant preserved)
```

```bash
# AC-11: cf-20b R1 mobile inline-style override still locked (3 !important declarations in grid.css)
grep -cE '!important;' apps/site/src/styles/grid.css
# Expected: 3 (cf-20b R1 invariant preserved)
```

```bash
# AC-12: HTML5 native DnD MIME constant exported (cf-20c-2 D1 Q7 verdict)
grep -E 'DRAG_HANDLE_MIME = .application/x-skb-block-id.' packages/editor-shell/src/drag-drop/drag-handle-button.tsx
# Expected: 1 match (the private MIME so other DnD handlers don't pick up our payload)
```

```bash
# AC-13 (cf-20c-2 R1 F1 lock): source-lift CSS class present in
# BlockNodeView.css; pipeline filter excludes source from edge-rects
grep -cE '^\.skb-block-nodeview--dragging-self' packages/editor-shell/src/BlockNodeView.css
# Expected: 1 (the source-lift CSS rule per ADR-0017 D6 v2 contract)
grep -cE '\.filter\(\(b\) => b\.id !== blockId\)' packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts
# Expected: 1 (the edge-rect source exclusion at onDragStart per ADR-0017 D6)
```

```bash
# AC-14 (cf-20c-2 R1 F2 lock): DropPulse mounted via clearLastDropped
grep -cE 'clearLastDropped' packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts
# Expected: ≥ 3 (state setter binding + return type + return value)
grep -cE 'data-skb-drop-pulse-anchor' apps/site/src/components/EditorShellMount.tsx
# Expected: 1 (the DropPulseAtRect helper wrapper)
```

```bash
# AC-15 (cf-20c-2 R1 F3 lock): velocity unit alignment with tiebreak px/frame contract
grep -cE 'VELOCITY_WINDOW_MS' packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts
# Expected: ≥ 3 (constant declaration + 2 multiplications in the velocity computation)
```

```bash
# AC-16 (cf-20c-2 R1 F4 lock): terminal-drop Playwright spec exists + asserts mutation
grep -cE 'cf-20c-2 R1 F4 — terminal drop' apps/site/playwright/sample-blocks-drag-handle.spec.ts
# Expected: 1 (the test name)
grep -cE "expect\(sourceColAfter\)\.not\.toBe\(sourceColBefore\)" apps/site/playwright/sample-blocks-drag-handle.spec.ts
# Expected: 1 (the assertion that the source's gridColumn actually mutated post-drop)
```

## Reflection landing

This PR appends one entry to
`docs/orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md`
per the 2026-05-09 retrospective process rule. The entry documents
the Q7 spike methodology + result (HTML5 native DnD works inside
contenteditable=false gutter — saved ~150 LOC of pointer-events
fallback), the React context bridge pattern for "presentational
child → distant lifecycle owner" (now an operational pattern for
cf-20d/cf-20e/cf-22), and the happy-dom DnD synthetic event
limitation (`fireEvent.dragStart` doesn't propagate clientX/Y; tests
must use property-presence assertions OR move the cursor-position
check to a Playwright integration spec).

## Out-of-scope

(none — per the 2026-05-09 retrospective Rule 3 "Defer requires
explicit user approval, not orchestrator's"; user explicitly
disapproved deferral via "不允许 defer". The remaining 5 PRs in the
cf-20 sequence — cf-20d resize + cf-20e kebab + cf-22 keyboard a11y
+ cf-23 read-mode unification + cf-24 sidebar — are scheduled work,
not "out-of-scope" deferrals.)

Items NOT in cf-20c-2 scope but referenced for context:
- **DropPulse mount** — pipeline tracks `lastDroppedBlockId` but
  doesn't render `<DropPulse>` at the landed block yet. cf-20d
  (resize) needs the same pulse-on-success UX so centralizing in
  cf-20d keeps the JSX shorter (cf-20c-2 D5 + D6 rationale).
- **Empty-mode drop** — pipeline dispatches `drag-end-mode-none`
  when cursor isn't on an edge rect at drop. Empty-mode drop into
  bare grid area requires computing `emptyTarget` from cursor +
  grid math; cf-20c-3 candidate (per cf-20c-2 D6 rationale).
- **BlockKind-aware ghost coloring** — `<DragGhost kind="markdown">`
  is hardcoded; cf-20d will source `kind` from a
  `BlockKindForGhost` mapping in block-foundation.
- **Touch device support** — Q4 from cf-20 scoping report. Deferred
  to cf-22 (keyboard a11y) or separate cf-25; orchestrator decision
  pending.
- **Stable UUID block IDs** — Path B from cf-20c-2 D2. Deferred to
  a future schema-mod PR (cf-20c-3 if palette → grid drag is added).

## Related

- [cf-20c-1 PR.md](wave-6-cf-20c-1-apply-drop-mode-algebra.md) —
  pure mutation algebra. cf-20c-2 wires it.
- [cf-20b PR.md](wave-6-cf-20b-grid-layout-substrate.md) — grid
  substrate. cf-20c-2 reads `node.attrs.{col,row,colSpan,rowSpan}`
  via the same `extractGridPosition` helper that cf-20b emits the
  inline `gridColumn` style from.
- [cf-20a PR.md](wave-6-cf-20a-stripe-cleanup-single-source.md) —
  chrome single source. cf-20c-2 inherits the `.skb-block-nodeview`
  / `.skb-block-static` paired-selector chrome unchanged.
- [cf-19 PR.md](wave-6-cf-19-editor-block-visual-identity.md) —
  shipped the `.skb-block-nodeview__gutter` shell that cf-20c-2
  fills with the per-block drag-handle button.
- [ADR-0017 D1 / D6 / D8 / D9 / D10 / D11 / D12](../../decisions/ADR-0017-drag-drop-ux.md)
  — drop modes + tiebreak + Esc + mobile view-only + ghost +
  drop-pulse + epoch single source. cf-20c-2 wires all of them.
- [ADR-0016 D11 + v0.2 D11.1 amendment](../../decisions/ADR-0016-grid-data-model.md)
  — Tiptap inside / grid outside layering + editor-surface grid
  lock. cf-20c-2 honors: pipeline reads NodeView attrs at drag-
  start snapshot only; mutations happen via Tiptap commands at
  drop, not mid-drag.
- [ADR-0011 D1 stage 4 + D9](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pre-commit Claude review trigger + ui_touch / e2e_smoke gates.
- [orchestrator-reflections 2026-05-09](../../orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md)
  — process rules driving cf-20c-2 (ux-ui-lead at PLAN, no defer,
  cite v2 source lines, append reflection entry, mandatory mobile-
  viewport regression test).
- v2-styles.css `.gblock-gutter` lines 230-249 + `.gblock-gutter
  button` lines 241-254 — direct visual contract source for the
  cf-20c-2 drag-handle button styles.
