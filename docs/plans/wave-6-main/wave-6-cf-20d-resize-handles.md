# Wave 6 cf-20d — Resize handles (right + bottom + corner) + ColRuler / RowLadder / SizeTooltip mounts + drop-pulse on resize-commit

> Wave 6 carry-forward — composes the existing `<ColRuler>` /
> `<SizeTooltip>` resize primitives + a NEW `<RowLadder>` per
> `/mnt/d/download/web/v2-styles.css:359-385` into per-block resize
> handles. 3 handle variants (right / bottom / corner) per
> v2-styles.css:266-311 + ADR-0017 D9 visibility contract; commit-on-
> release semantics per v2's `.gblock.resizing` body-hidden treatment.
> Right-edge snaps to `effectiveColSnaps(viewportCols)` per ADR-0016
> D6 + Q4 (12-col → [2,3,4,6,8,12]; mobile → handles entirely
> hidden). Bottom + corner appear only on non-prose `gridKind` per
> D9. Drop-pulse on resize-commit reuses cf-20c-2's `dropEpoch`
> React-key remount pattern (canonical "rapid-action animation
> isolation" landed in cf-20c-2 R3 reflection).

## title

NEW `packages/editor-shell/src/resize/resize-handles.tsx` (~95 LOC)
emitting 3 `<div class="gblock-handle right|bottom|corner">` per
ADR-0017 D9 + v2-styles.css:266-311; NEW `resize/use-resize-pipeline.ts`
(~280 LOC) — lifecycle owner mirroring cf-20c-2's
`use-drag-drop-pipeline.ts` shape (mousedown → mousemove → mouseup
→ snap → setNodeMarkup → drop-pulse); NEW `resize/resize-context.tsx`
(~55 LOC) React context bridging per-block handles to the pipeline;
NEW `resize/resize-snap.ts` (~85 LOC) pure helpers for cursor-delta
→ snap target (right-edge: nearest of `effectiveColSnaps`;
bottom-edge: nearest integer rowSpan ≥ 1); NEW `resize/row-ladder.tsx`
(~75 LOC) per v2-styles.css:359-385 right-margin ladder (visible
during bottom-edge resize); NEW `resize/resize-handles.css` (~125
LOC) — v2 .gblock-handle.* + .col-ruler + .row-ladder + .size-tooltip
+ .gblock.resizing styles. MODIFY
`packages/editor-shell/src/BlockNodeView.tsx` (~15 LOC delta) to
render `<ResizeHandles blockId={pos} />` + apply
`.skb-block-nodeview--resizing` CSS modifier when context's
`resizingBlockId === blockId`. MODIFY `BlockNodeView.css` (~25 LOC
delta) for `.skb-block-nodeview--resizing { outline + body-hidden }`
per v2 `.gblock.resizing`. MODIFY
`packages/editor-shell/src/index.ts` to barrel-export the new
public surface. MODIFY `packages/editor-shell/package.json` to add
`./resize-handles.css` exports map entry. MODIFY
`apps/site/src/components/EditorShellMount.tsx` (~50 LOC delta) to
mount `useResizePipeline()` + `<ResizeProvider>` + render
`<ColRuler>` / `<RowLadder>` / `<SizeTooltip>` overlays during
active resize + reuse the cf-20c-2 `<DropPulseAtRect>` mount via
the existing `dropEpoch` pattern (resize-commit fires the SAME
pulse field as drag-commit so users see consistent
"action-succeeded" feedback). MODIFY `apps/site/src/styles/global.css`
to import `resize-handles.css`. NEW
`apps/site/playwright/sample-blocks-resize-handles.spec.ts` (~210
LOC, 3 tests: handle visibility / right-edge resize commit /
mobile-hidden lock) consuming the cf-20c-2 byte-snapshot fixture
isolation pattern. NEW vitest unit
`packages/editor-shell/src/__tests__/resize/resize-snap.test.ts`
covering the pure snap math. Update `editor-shell/CONTRACT.md` +
`apps/site/CONTRACT.md` per ADR-0006 #6 sister-doc rule.

## files

15 source files (~1100 LOC net add; matches cf-20c-2's complexity
profile — drag and resize are similarly intricate compositions of
existing primitives + pipeline + context + handles + overlay):

1. `packages/editor-shell/src/resize/resize-handles.tsx` — **NEW**
   (~95 LOC). Per-block presentational component renders 3 handles:
   - `<div class="gblock-handle right" data-skb-resize-axis="right">`
     (always rendered when not mobile)
   - `<div class="gblock-handle bottom" data-skb-resize-axis="bottom">`
     (rendered only when `gridKind !== 'prose'` per ADR-0017 D9)
   - `<div class="gblock-handle corner" data-skb-resize-axis="corner">`
     (rendered only when `gridKind !== 'prose'` per D9)
   Handles use `pointer-events: auto` to opt back into events
   (the cf-19 gutter shell baseline is `pointer-events: none`).
   Each handle's `onPointerDown` calls
   `context.onResizeStart(blockId, axis, {x, y})` from `ResizeContext`.

2. `packages/editor-shell/src/resize/use-resize-pipeline.ts` —
   **NEW** (~280 LOC). Lifecycle owner hook. Mirrors cf-20c-2
   `use-drag-drop-pipeline.ts` shape (snapshot at start, mutate at
   commit, NEVER mid-drag — per the cf-20c-2 R1 reflection rule).
   On resize-start: reads source NodeView pos + initial col/colSpan/
   rowSpan + bounding rect; sets `state.resizing = true` + axis +
   blockId. On pointermove (window-level): computes cursor delta vs
   start position; `resize-snap.ts` resolves snap target for the
   axis; updates `state.cursorX/Y/snapColSpan/snapRowSpan` so
   overlays render. On pointerup: snap-commit via
   `editor.commands.command(({tr}) => tr.setNodeMarkup(...))`;
   triggers `dropEpoch` increment + 2-rAF re-measure for landed-rect
   pulse (reuses cf-20c-2 `lastDroppedBlockId`/`lastDroppedRect`/
   `dropEpoch` fields — pulse is generic "action-succeeded", not
   drag-specific). Esc cancel via `useEscCancel` rolls back without
   mutation.

3. `packages/editor-shell/src/resize/resize-context.tsx` — **NEW**
   (~55 LOC). React context bridging per-block presentational
   handles to lifecycle owner (`useResizePipeline()` mounted at
   `EditorShellMount.tsx`). Mirrors cf-20c-2 `drag-context.tsx`
   exactly. Provider value: `{ onResizeStart(blockId, axis, origin),
   onResizeEnd(origin), resizingBlockId, resizingAxis }`. Default
   null = degraded mode (handles render but pointerdown is no-op).

4. `packages/editor-shell/src/resize/resize-snap.ts` — **NEW**
   (~85 LOC). Pure helpers — no React, no DOM:
   - `snapToColSpan(cursorDeltaX: number, startColSpan: number,
     containerWidth: number, gap: number, totalCols: number,
     activeSnaps: readonly number[]): { colSpan, fraction }` —
     converts pixel delta to "raw colSpan", snaps to nearest valid
     COL_SNAP per ADR-0016 D6 round-to-nearest-snap, returns the
     final colSpan + fraction string for `<SizeTooltip>` (consumes
     existing `colSpanToFraction(colSpan, totalCols)`).
   - `snapToRowSpan(cursorDeltaY: number, startRowSpan: number,
     rowH: number, gap: number): number` — converts pixel delta to
     "raw rows", snaps to nearest integer ≥ 1.
   Math derived from ADR-0016 D9 W5-1 invariant
   (`height = rowSpan * rowH + (rowSpan - 1) * gap`).

5. `packages/editor-shell/src/resize/row-ladder.tsx` — **NEW**
   (~75 LOC). Renders the right-margin ladder per
   `/mnt/d/download/web/v2-styles.css:359-385`. Props:
   `{ rowCount: number, activeRow: number | null, blockRect:
   DOMRectReadOnly }`. Renders a `position: fixed` container
   anchored to the resizing block's right edge (rect.right +
   small offset); each `.rung` is a row-h tall + gap-bottom; the
   `activeRow` rung gets `.active` class (1.5px solid accent).

6. `packages/editor-shell/src/resize/resize-handles.css` — **NEW**
   (~125 LOC). v2 contract verbatim:
   - `.gblock-handle` base (position: absolute; opacity: 0;
     transition: opacity 120ms; pointer-events: auto so the handle
     opts back in over the cf-19 gutter's pointer-events: none)
   - `.gblock-handle.right` per v2:266-280 (top: 8px; bottom: 8px;
     right: -7px; width: 14px; cursor: ew-resize; ::before 3×36px
     bar)
   - `.gblock-handle.bottom` per v2:282-296 (left: 8px; right: 8px;
     bottom: -7px; height: 14px; cursor: ns-resize; ::before 36×3px
     bar)
   - `.gblock-handle.corner` per v2:298-311 (bottom + right -7px;
     14×14; cursor: nwse-resize; ::before 8×8 with right + bottom
     borders)
   - hover/active states swap to var(--accent)
   - `.skb-block-nodeview:hover .gblock-handle, .gblock-handle.active
     { opacity: 1 }` (handle visibility on hover OR active resize)
   - `.skb-col-ruler` + `.skb-col-ruler-stop` styles per v2:325-357
     (the cf-19 `<ColRuler>` already emits these classes; cf-20d
     just provides the actual CSS rules — pre-cf-20d it was a no-op
     style import slot)
   - `.skb-size-tooltip` per v2:314-322 (text-on-dark pill)
   - `.skb-row-ladder` + `.skb-row-ladder-rung` per v2:359-385
   - `.skb-block-nodeview--resizing` per v2 `.gblock.resizing`
     (outline 1.5px dashed accent + transition: none) + body-hidden
     descendant `.skb-block-nodeview--resizing .skb-block-nodeview__body
     { visibility: hidden }`
   - `@media (max-width: 768px)` mobile path: `.gblock-handle,
     .skb-col-ruler, .skb-row-ladder, .skb-size-tooltip { display:
     none }` per ADR-0017 D9 + cf-20b R1 mobile precedent

7. `packages/editor-shell/src/BlockNodeView.tsx` — **MODIFY**
   (~20 LOC delta). Renders `<ResizeHandles blockId={blockId}
   gridKind={ctx.gridKind}/>` BELOW the `__body` div (handles are
   absolutely positioned outside the body for proper edge placement
   per v2 negative offsets like `right: -7px`). Reads
   `resizingBlockId` from `ResizeContext` and applies
   `.skb-block-nodeview--resizing` modifier class via the existing
   `nodeViewClassName()` helper (extended to take a third
   `isResizing` boolean).

8. `packages/editor-shell/src/BlockNodeView.css` — **MODIFY** (~25
   LOC delta). Adds `.skb-block-nodeview--resizing` CSS rule per
   v2 `.gblock.resizing`. Inline-style precedence guards (per
   cf-20b R1's `!important` precedent for inline-grid overrides):
   the resizing-state outline must beat the cf-19 hover/selected
   border-color, so `outline` (NOT `border-color`) is used —
   outlines paint above borders without conflicting with the
   stripe.

9. `packages/editor-shell/src/index.ts` — **MODIFY** (~10 LOC
   delta). Adds barrel exports for `ResizeHandles`,
   `useResizePipeline`, `ResizeContext`/`ResizeProvider`,
   `RowLadder`, `snapToColSpan`/`snapToRowSpan`, `ResizeAxis` type.

10. `packages/editor-shell/package.json` — **MODIFY** (+1 LOC).
    Adds `"./resize-handles.css": "./src/resize/resize-handles.css"`
    exports map entry.

11. `apps/site/src/components/EditorShellMount.tsx` — **MODIFY**
    (~55 LOC delta). Mounts `useResizePipeline({ editor })`,
    memoizes `resizeContextValue`, wraps `<GridContainer>` in
    `<ResizeProvider>` (NESTED inside the existing
    `<DragDropProvider>` so per-block components can read both
    contexts independently). When `resize.state.active` is true,
    renders `<ColRuler>` / `<SizeTooltip>` (and `<RowLadder>` only
    when axis is bottom/corner) as siblings of the editor surface.
    The cf-20c-2 `<DropPulseAtRect>` already mounts on `lastDroppedRect
    !== null` — resize-commit reuses the SAME pulse field via the
    pipeline writing into `lastDroppedBlockId`/`lastDroppedRect`/
    `dropEpoch` (the "drop pulse" is conceptually generic
    "action-succeeded pulse"; cf-20c-2 R3's dropEpoch React-key
    pattern remounts cleanly across rapid resize commits per the
    R3 reflection rule).

12. `apps/site/src/styles/global.css` — **MODIFY** (+7 LOC). Adds
    `@import '@skb/editor-shell/resize-handles.css'` after the
    cf-20c-2 `drag-handle-button.css` import.

13. `packages/editor-shell/src/__tests__/resize/resize-snap.test.ts`
    — **NEW** (~110 LOC). Vitest covering the pure
    `snapToColSpan` / `snapToRowSpan` helpers: snap-up/snap-down/
    keep-current/clamp-to-1/clamp-to-12/respect-viewport-snaps
    (12-col → [2,3,4,6,8,12]; 6-col → [2,3,6]; 1-col → [1] from
    `effectiveColSnaps` per ADR-0016 D6 Q4).

14. `apps/site/playwright/sample-blocks-resize-handles.spec.ts` —
    **NEW** (~210 LOC, 3 integration tests with byte-snapshot
    fixture isolation per cf-20c-2 R3 F1 pattern):
    - **Test 1 (handle visibility)**: 8 BlockKind wrappers each
      render `<div class="gblock-handle right">` (count=8 .right
      handles). Hover triggers opacity=1. The 8 component blocks
      all get bottom + corner (no prose blocks in sample-blocks
      fixture's NodeView surface).
    - **Test 2 (right-edge resize commit)**: pointerdown on first
      callout's right handle → pointermove cursor leftward by ~40%
      of grid width → pointerup. Asserts source's gridColumn
      mutates from `1 / span 12` to a smaller span (snapped to
      `[8, 6, 4, 3, 2]` from COL_SNAPS); `[data-skb-drop-pulse-anchor]`
      mounts (cf-20c-2 R3 dropEpoch reuse — SAME pulse element
      used by drag-commit). Reuses cf-20c-2's `requestAnimationFrame`
      barrier between pointermove and pointerup per the cf-20c-2
      R1 reflection rule (React-state-driven event chains require
      rAF gap).
    - **Test 3 (mobile-hidden lock)**: at 375×812 viewport, all
      `.gblock-handle.*` elements have computed `display === 'none'`
      per the cf-20d mobile @media rule. Pre-cf-20b R1 `!important`
      precedent confirmed the @media rule is sufficient (no
      higher-specificity inline style competes for handles).
    Spec uses `test.beforeAll(snapshotMdxBytes)` +
    `test.afterAll(restoreMdxBytes)` per cf-20c-2 R3 F1 — NEVER
    `git checkout` (destroys uncommitted user edits).

15. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~50 LOC delta).
    Adds resize layer subsection in the Drag/Drop layer block
    documenting `useResizePipeline` / `ResizeHandles` /
    `ResizeContext`/`Provider` / `RowLadder` / `snapToColSpan` /
    `snapToRowSpan` public surface. Documents the resize
    commit-on-release model (D2 below) + reuse of cf-20c-2's
    drop-pulse infrastructure.

16. `apps/site/CONTRACT.md` — **MODIFY** (~25 LOC delta). Adds
    "Resize handles wire (Wave 6 cf-20d)" bullet to the Edit route
    section describing the pipeline mount + provider + overlay
    renders + per-axis behavior + mobile-hidden contract.

17. `docs/plans/wave-6-main/wave-6-cf-20d-resize-handles.md` —
    **NEW** (PR.md self; this file).

Plus 1 NEW screenshot artifact:
`docs/audits/screenshots/wave-6-cf-20d-resize-handles.png` emitted
by the new Playwright spec.

## D2 trigger judgment

- **Row 1 (CONTRACT.md change in N packages)** — HIT: 2 CONTRACT.md
  files modified (`@skb/editor-shell` + `apps/site`).
- **Row 2 (NEW deps)** — N/A (no new deps).
- **Row 4 (NEW ADR or amendment)** — N/A (consumes ADR-0017 D7+D9 +
  ADR-0016 D2/D6/D10 already-ratified contracts; no new ADR).
- **Row 5 (cross-package: ≥ 3 packages)** — HIT: `@skb/editor-shell`
  + `apps/site` + the cf-20c-2 dropEpoch field consumer (same
  package) + ADR-0016 D6 `effectiveColSnaps` from
  `@skb/block-foundation`.

Per CLAUDE.md `## Review workflow` + ADR-0011 D1 stage 4 +
2026-05-09 retrospective rule "ux-ui-lead is dispatched at PLAN",
**PRE-COMMIT CLAUDE REVIEW (stage 4) fires** on Row 1 + Row 5.
ux-ui-lead authored this PLAN end-to-end. Stage 3
codex-pr-reviewer-55 review still required.

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1
path pattern (NEW `resize/{resize-handles.tsx, use-resize-pipeline.ts,
resize-context.tsx, resize-snap.ts, row-ladder.tsx, resize-handles.css}`,
MODIFY `BlockNodeView.tsx` + `BlockNodeView.css`); `apps/site/src/**`
matches as well (`components/EditorShellMount.tsx`, `styles/global.css`,
new Playwright spec).

The new `sample-blocks-resize-handles.spec.ts` (3 integration tests)
satisfies the D9.2 e2e_smoke obligation; the emitted screenshot
satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mount loads via the ApiAdapter
    chain (cf-18 NodeView wiring + cf-19 chrome + cf-20a single
    source + cf-20b grid + cf-20c-2 drag wire + cf-20d resize wire).
    Each of 14 NodeView wrappers renders 3 resize handles
    (right + bottom + corner) inside the wrapper at the negative
    offset positions per v2-styles.css:266-311 (right: -7px; bottom:
    -7px; corner at bottom-right). Hover on a handle raises opacity
    from 0 to 1 + accent color on the bar. Pre-resize: no
    `.skb-block-nodeview--resizing`, no `.skb-col-ruler`, no
    `.skb-row-ladder`. Pointerdown on right handle initiates
    resize: source wrapper gets `.skb-block-nodeview--resizing`
    (body-visibility hidden + dashed accent outline);
    `<ColRuler>` mounts above the grid; `<SizeTooltip>` follows
    cursor with current fraction (`'1/2'`, `'1/3'`, etc.). Pointerup
    snaps to nearest `effectiveColSnaps`, dispatches Tiptap
    setNodeMarkup, fires drop-pulse via cf-20c-2's reused
    `dropEpoch` field. Esc cancel rolls back per ADR-0017 D8.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-resize-handles.spec.ts:"sample-blocks edit route — cf-20d resize-handles wire (handle visibility + right-edge commit + drop-pulse reuse)"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20d-resize-handles.png
  assertions:
    - .ProseMirror visible within 15s
    - first .skb-block-nodeview visible within 10s
    - 14+ `.gblock-handle.right` rendered (one per NodeView wrapper); 14+ `.gblock-handle.bottom`; 14+ `.gblock-handle.corner` (sample-blocks fixtures all non-prose)
    - first handle has `data-skb-resize-axis="right"` + `cursor: ew-resize` computed
    - pre-resize: 0 `.skb-block-nodeview--resizing`; 0 `.skb-col-ruler`; 0 `.skb-row-ladder`
    - pointerdown on right handle: 1 `.skb-block-nodeview--resizing`; 1 `.skb-col-ruler` mounted above grid
    - pointermove leftward + pointerup: source's gridColumn changes from `1 / span 12` to a smaller span ∈ {`1 / span 8`, `1 / span 6`, `1 / span 4`, `1 / span 3`, `1 / span 2`} per ADR-0016 D6 round-to-nearest-snap
    - post-commit: 1 `[data-skb-drop-pulse-anchor]` mounted (cf-20c-2 dropEpoch field reuse)
    - Esc cancel during active resize: 0 `.skb-block-nodeview--resizing`, 0 `.skb-col-ruler`; source's gridColumn reverts to pre-resize value

- flow: `/notes/sample-blocks/edit` at viewport 375×812 (mobile
    preview path per ADR-0017 D9 + cf-20b R1 mobile lock). All
    resize handles rendered in DOM but each has computed
    `display === 'none'`. Pointer interactions on handle area do
    not initiate resize (no .skb-block-nodeview--resizing appears).
    Per the D9 contract: mobile = preview-mode + content-edit only;
    desktop = full author mode.
  target_url: /notes/sample-blocks/edit (at 375×812 viewport)
  playwright_spec: apps/site/playwright/sample-blocks-resize-handles.spec.ts:"cf-20d resize handles hidden on mobile (≤768px) per ADR-0017 D9"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20d-resize-handles.png
  assertions:
    - viewport set to 375×812
    - .gblock-handle.right count > 0 in DOM (React tree unchanged)
    - first .gblock-handle.right computed `display === 'none'`
    - same for .bottom + .corner

## Why (user feedback)

cf-20d is PR 5 of 9 in the locked cf-20 sequence. User directive
2026-05-09 (verbatim, dispatched as cf-20a + carried into cf-20b /
cf-20c-1 / cf-20c-2 / cf-20d):

> "全部做，不允许 defer，必须保质保量，出现问题会直接让你推翻重写。
>  ... 全部对齐 v2."

cf-20c-2 closed the drag half. cf-20d closes the resize half — the
v2 contract specifies right-edge / bottom-edge / corner handles per
v2-styles.css:266-311 + col-ruler/row-ladder/size-tooltip overlays
per :324-385. Pre-cf-20d the editor surface had per-block drag but
no resize affordance — colSpan/rowSpan attrs could only be set via
direct MDX editing. cf-20d makes resize a first-class user action
matching the v2 mockup.

## Design source

- `/mnt/d/download/web/v2-styles.css:256-311` — `.gblock-handle.*`
  contract (right/bottom/corner geometries; opacity transitions;
  hover + active states; cursor types). cf-20d
  `resize-handles.css` consumes verbatim.
- `/mnt/d/download/web/v2-styles.css:313-322` — `.size-tooltip`
  contract. cf-20d uses the existing `<SizeTooltip>` component
  shipping with these styles applied via `.skb-size-tooltip`
  className.
- `/mnt/d/download/web/v2-styles.css:324-357` — `.col-ruler`
  contract (12-col grid above doc; stops at `effectiveColSnaps`
  positions). cf-20d uses the existing `<ColRuler>` component;
  CSS lands here in `resize-handles.css`.
- `/mnt/d/download/web/v2-styles.css:359-385` — `.row-ladder`
  contract (right-margin 26px ladder; rungs at row-h heights).
  NEW `<RowLadder>` component implements this; CSS in
  `resize-handles.css`.
- `/mnt/d/download/web/v2-styles.css:172-176` —
  `.gblock.resizing` body-hidden + dashed accent outline contract.
  cf-20d's `.skb-block-nodeview--resizing` modifier class implements
  this verbatim.
- ADR-0017 D9 — col-ruler + size-tooltip + per-axis handle
  visibility rules + mobile view-only. cf-20d implements all 4
  required artifacts (right always; bottom/corner per gridKind;
  mobile hidden via @media).
- ADR-0017 D7 — `useAutoRowSpan` hook for prose rowSpan='auto'
  (rendering-derived). cf-20d resize on prose: bottom + corner
  handles HIDDEN per D9 (right handle still appears — colSpan IS
  user-set even on prose).
- ADR-0017 D8 — Esc cancel semantics. cf-20d wires `useEscCancel`
  with `dragActive: pipeline.state.active` mirroring cf-20c-2.
- ADR-0017 D11 — drop-pulse 720ms green halo on success. cf-20d
  reuses the cf-20c-2 `lastDroppedBlockId`/`lastDroppedRect`/
  `dropEpoch` infrastructure — pulse fires on resize-commit too
  (the field is conceptually generic "action-succeeded pulse";
  the JSDoc/CONTRACT.md prose at cf-20c-2 already used "drop"
  terminology but the visual contract per D11 is identical for
  resize commit).
- ADR-0016 D2 — `BlockGridPosition` shape. cf-20d's pipeline
  mutates `colSpan` (right-edge) + `rowSpan` (bottom-edge) +
  BOTH (corner) but NEVER `col` or `row` (those are positional
  fields owned by drag per cf-20c-2).
- ADR-0016 D6 — `COL_SNAPS = [2,3,4,6,8,12]` + `effectiveColSnaps`.
  cf-20d consumes via existing `block-foundation` export.
- ADR-0016 D10 — `BlockUIDefinition.gridKind`. cf-20d reads
  `gridKind` to decide bottom/corner handle rendering. Defensive
  default = `'component'` (handles render) when undefined; sample-
  blocks fixtures all 8 are non-prose so all get full handle set.

## Decisions

### D1 — Commit-on-release semantics (NOT real-time visual update during pointermove)

**Open question Q1 from dispatch brief**: real-time visual update
(block visually grows during drag) vs commit-on-release (snap to
final on mouseup).

**v2 contract evidence at `/mnt/d/download/web/v2-styles.css:172-176`**:

```css
.gblock.resizing {
  outline: 1.5px dashed var(--accent); outline-offset: 2px;
  transition: none;
}
.gblock.resizing > .gblock-body { visibility: hidden; }
```

`.gblock-body { visibility: hidden }` during resize is a strong
signal: the v2 design intent is COMMIT-ON-RELEASE. The body is
hidden during pointermove so the user sees only the dashed
outline + size feedback (col-ruler + size-tooltip) — the actual
content doesn't reflow until the mutation lands.

**Decision**: cf-20d ships commit-on-release per v2 contract. The
pipeline computes the snap target on every pointermove (so col-ruler
stop highlight + size-tooltip text update live), but only dispatches
Tiptap setNodeMarkup on pointerup. The `.skb-block-nodeview--resizing`
modifier hides the body throughout. Rationale per v2:
1. Preserves user focus on the size feedback (col-ruler stops + size
   pill) rather than mid-resize content reflow distraction.
2. Avoids triggering N rAF mutation cycles during pointermove (one
   commit instead of one-per-frame).
3. Consistent with cf-20c-2's "snapshot at start, mutate at commit,
   NEVER mid-drag" pattern landed in R1 reflection — drag and resize
   share the discipline.

### D2 — `gridKind === 'prose'` check for bottom + corner handle visibility (per ADR-0017 D9)

ADR-0017 D9 line 321: bottom + corner handles ONLY on
`render`/`viz`/`component` kinds; prose blocks get NEITHER (rowSpan
is content-driven via `useAutoRowSpan` per ADR-0017 D7, so there's
no integer rowSpan to mutate via resize).

**Implementation**:
- `<ResizeHandles blockId={...} gridKind={...}/>` accepts a
  `gridKind?: 'prose' | 'component' | 'render' | 'viz'` prop.
- Right handle ALWAYS rendered (per D9 line 320: "所有 block 都有").
- Bottom + corner ONLY when `gridKind !== 'prose'`.

**Defensive default for missing gridKind**: per ADR-0016 D10,
`gridKind` is optional on `BlockUIDefinition` (defaults to
`undefined` for the 8 existing block packages — none of them set
it). cf-20d treats `undefined` as `'component'` (renders bottom +
corner) because all 8 sample-blocks fixtures are non-prose
component/render/viz blocks. Future prose blocks (markdown via
`proseExtensions` per ADR-0016 D10) won't reach `<ResizeHandles>`
at all because they don't render through `BlockNodeView` — they
render as native ProseMirror prose nodes (paragraphs/headings)
without the wrapper.

### D3 — Reuse cf-20c-2 `dropEpoch` infrastructure for resize-commit pulse (NOT separate `resizeEpoch`)

**Open question implied by cf-20c-2 R3 reflection**: should resize
commit fire its own pulse epoch, or reuse drag's?

**Decision**: REUSE. The cf-20c-2 R3 dropEpoch React-key pattern is
explicitly designed for "rapid-action animation isolation" — the
"action" is generic, not drag-specific. Resize-commit triggers the
same `lastDroppedBlockId`/`lastDroppedRect`/`dropEpoch` fields via
the resize pipeline calling into the drag pipeline's setter
methods... actually no, they're separate hook instances. Cleanest:

The cf-20c-2 `useDragDropPipeline` hook owns the pulse fields. The
cf-20d `useResizePipeline` hook needs to fire a pulse too. Two
options:

- **Option A**: extract pulse state into a third sibling hook
  `useActionPulse()` consumed by both pipelines + the consumer.
- **Option B**: cf-20d pipeline accepts an `onCommitSuccess(blockId,
  liveRect)` callback as an option; consumer wires it to the drag
  pipeline's pulse setter.

**Decision: Option B** — cf-20d implementation is simpler (just a
callback prop), and the consumer (`EditorShellMount.tsx`) is already
the pulse-mount owner. Adding a `useActionPulse()` extraction is
nice but speculative; cf-20e (kebab) might not need pulses at all.
Option B keeps the cf-20c-2 dropEpoch field as the single
canonical pulse state; resize-commit just writes into it via the
consumer-supplied callback.

`useResizePipeline({ editor, onCommitSuccess })` where
`onCommitSuccess` is invoked at pointerup post-mutation; consumer
implements:
```ts
onCommitSuccess: (blockId, liveRect) => dragPipeline.setLastDroppedFromExternal(blockId, liveRect)
```
where `setLastDroppedFromExternal` is a NEW method on
`useDragDropPipeline` that wraps the existing internal setter +
dropEpoch increment.

### D4 — Resize source-lift: NOT applied (block stays visible per v2 .gblock.resizing)

**Open question Q3 from dispatch brief**: should resizing block
keep visual presence vs lift like drag?

v2-styles.css `.gblock.resizing` keeps the block VISIBLE (outline +
body-hidden), unlike v2's drag source which uses
`visibility: hidden` per ADR-0017 D6 line 247. Resize is a "size-
adjust this same block" action; drag is a "move this block
elsewhere" action. The semantic distinction is:
- Drag: source disappears so the user sees the destination preview.
- Resize: source stays in-place; user sees the new size emerge from
  the dashed outline + size feedback.

**Decision**: cf-20d's `.skb-block-nodeview--resizing` ONLY applies
the outline + body-visibility-hidden rules per v2 `.gblock.resizing`.
NO `visibility: hidden` on the wrapper itself (which would hide the
outline too). NO `pointer-events: none` on the wrapper (the user
needs the handles to remain interactive during the active resize —
the cf-20d pipeline relies on continued pointer events at the
window level, not on the handle, so technically the handle can lose
pointer-events during active resize, but the outline + cursor-style
feedback needs to remain).

### D5 — Pointer events (mousedown/mousemove/mouseup) NOT HTML5 DnD

cf-20c-2 ships HTML5 native DnD per Q7 spike. Resize is different —
HTML5 DnD is designed for "pick up and move", not "click-and-drag-
to-resize". Resize uses standard pointer events:
- `onPointerDown` on the handle → captures pointer + initiates pipeline
- `pointermove` listener on `window` (added at pointerdown,
  removed at pointerup) → updates cursor state + snap target
- `pointerup` listener on `window` → commits + cleanup

This is the canonical browser pattern for drag-to-resize (no DnD
ghost, no setData, no dragover lifecycle). Pointer events are
cleaner and more precise for resize.

**Pointer capture**: `event.target.setPointerCapture(event.pointerId)`
on pointerdown ensures all subsequent pointer events route to the
handle even if cursor leaves the bounding box. Released
automatically on pointerup.

### D6 — Round-to-nearest-snap (NOT round-up) for ADR-0016 D6 Q4 absorbtion

ADR-0016 D6 Q4 absorbtion offers two snap kinds: `round-up` (default)
or `round-to-nearest-snap`. cf-20d picks **round-to-nearest-snap**:
- v2 demo uses round-to-nearest (cursor between 1/3 and 1/2 snaps to
  whichever is closer, not always up).
- More intuitive UX: the cursor "falls into" the nearest valid stop.
- ADR's "round-up" default was for keyboard-based resize where step-
  one-up makes sense; for cursor-driven resize, nearest is better.

**Implementation**: `snapToColSpan(cursorDeltaX, ...)` computes raw
colSpan from delta then iterates `activeSnaps` array picking the
snap with smallest `|cursorColSpan - snap|`. For ties, round-up
(to honor the ADR default tiebreak).

### D7 — Pointer-events: auto override on the handle (cf-19 gutter precedent)

The cf-19 gutter has `pointer-events: none` (so cursor passes through
to the underlying body content). cf-20c-2's `<DragHandleButton>`
opts back in via `pointer-events: auto`. cf-20d's `<ResizeHandles>`
do the same — each `.gblock-handle.*` rule includes
`pointer-events: auto`.

The handles render outside the body (negative offsets like
`right: -7px`), so they're not inside the gutter shell — they
shouldn't conflict with the gutter rule. But defense-in-depth:
explicit `pointer-events: auto` on each handle CSS rule documents
the intent.

### D8 — Reuse cf-20c-2 byte-snapshot fixture isolation pattern (NEVER `git checkout` per cf-20c-2 R3 F1)

The new `sample-blocks-resize-handles.spec.ts` mutates the
sample-blocks MDX file via the cf-20d wire's setNodeMarkup →
tiptapToMdx → ApiAdapter.save chain (same as cf-20c-2). Per
cf-20c-2 R3 F1 reflection rule "tests that touch repository files
MUST snapshot bytes, NEVER use git operations", the spec MUST use
`readFileSync`/`writeFileSync` byte snapshots in `beforeAll`/
`afterAll`. The implementation is a near-copy of cf-20c-2's pattern
in `sample-blocks-drag-handle.spec.ts`.

## Acceptance

```bash
# AC-1: ADR-0011 D9 ui_touch detects on the right files
pnpm exec tsx scripts/check-ui-touch.ts \
  --files packages/editor-shell/src/resize/resize-handles.tsx \
          packages/editor-shell/src/resize/use-resize-pipeline.ts \
          packages/editor-shell/src/resize/resize-snap.ts \
          packages/editor-shell/src/BlockNodeView.tsx \
          apps/site/src/components/EditorShellMount.tsx \
          apps/site/src/styles/global.css 2>&1 | tail -3
# Expected: ui_touch=true
```

```bash
# AC-2: editor-shell + apps/site test suites green
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 186+ passed (cf-20c-2 carried + cf-20d resize-snap unit cases)
pnpm --filter @skb/site test 2>&1 | grep -E 'Tests'
# Expected: 78 passed | 1 skipped (carried)
```

```bash
# AC-3: targeted Playwright passes (resize spec + carried)
pnpm --filter @skb/site exec playwright test \
  playwright/sample-blocks-resize-handles.spec.ts \
  playwright/sample-blocks-drag-handle.spec.ts \
  playwright/sample-blocks-edit-loads.spec.ts \
  --reporter=line --workers=1 2>&1 | tail -3
# Expected: 8 passed (3 new cf-20d + 4 cf-20c-2 + 1 edit-loads)
```

```bash
# AC-4: full apps/site Playwright suite passes
pnpm --filter @skb/site exec playwright test --reporter=line --workers=1 2>&1 | tail -3
# Expected: 60 passed | 14 skipped | 0 failed (was 57 in cf-20c-2; +3 new resize specs)
```

```bash
# AC-5: pnpm check exit 0
pnpm check
# Expected: all 41 tasks successful
```

```bash
# AC-6: cf-20d source surface lands at the expected paths
test -f packages/editor-shell/src/resize/resize-handles.tsx && echo OK
test -f packages/editor-shell/src/resize/use-resize-pipeline.ts && echo OK
test -f packages/editor-shell/src/resize/resize-context.tsx && echo OK
test -f packages/editor-shell/src/resize/resize-snap.ts && echo OK
test -f packages/editor-shell/src/resize/row-ladder.tsx && echo OK
test -f packages/editor-shell/src/resize/resize-handles.css && echo OK
# Expected: 6× "OK"
```

```bash
# AC-7: barrel exports the new public surface
grep -cE 'ResizeHandles|useResizePipeline|ResizeProvider|RowLadder|snapToColSpan' packages/editor-shell/src/index.ts
# Expected: ≥ 5
```

```bash
# AC-8: v2 .gblock.resizing body-hidden contract preserved (commit-on-release D1 lock)
grep -cE '\.skb-block-nodeview--resizing' packages/editor-shell/src/BlockNodeView.css
# Expected: ≥ 2 (the wrapper rule + the body descendant rule)
grep -cE 'visibility: hidden' packages/editor-shell/src/BlockNodeView.css
# Expected: ≥ 2 (1 from cf-20c-2 R2 source-lift + 1 from cf-20d resize body-hidden)
```

```bash
# AC-9: cf-20c-2 chrome single source still holds (cf-20a + cf-20c-2 invariants preserved)
grep -lE 'border-top: 2px solid var\(--accent-' \
  $(find packages apps -name '*.css' -not -path '*/node_modules/*' -not -path '*/dist/*')
# Expected: exactly packages/editor-shell/src/block-chrome.css
grep -cE '!important;' apps/site/src/styles/grid.css
# Expected: 3 (cf-20b R1 mobile inline-style override invariant)
```

```bash
# AC-10: ADR-0017 D9 mobile view-only path locked for resize handles
grep -cE '@media \(max-width: 768px\).*display: none' packages/editor-shell/src/resize/resize-handles.css
# Expected: ≥ 1 (the mobile @media rule hiding handles per ADR-0017 D9)
```

```bash
# AC-11: cf-20c-2 R3 dropEpoch reuse (NOT a separate resizeEpoch)
grep -cE 'resizeEpoch|setLastDroppedFromExternal|onCommitSuccess' \
  packages/editor-shell/src/resize/use-resize-pipeline.ts \
  packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts
# Expected: ≥ 2 (one in resize pipeline as the option, one in drag pipeline as the new external setter)
```

```bash
# AC-12: byte-snapshot fixture isolation (cf-20c-2 R3 F1 pattern; NEVER git checkout)
grep -cE 'execSync|git checkout|git restore|git reset' apps/site/playwright/sample-blocks-resize-handles.spec.ts
# Expected: 0 (zero git operations in test code per cf-20c-2 R3 F1 rule)
grep -cE 'readFileSync|writeFileSync' apps/site/playwright/sample-blocks-resize-handles.spec.ts
# Expected: ≥ 2 (snapshot in beforeAll + restore in afterAll)
```

## Reflection landing

This PR appends one entry to
`docs/orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md`
per the 2026-05-09 retrospective process rule. The entry documents
what surprised ux-ui-lead during cf-20d (resize state shape vs
drag state shape — both have similar lifecycle but resize is
mousedown-on-handle vs drag is dragstart-anywhere; the
commit-on-release model felt different from drag's commit-on-drop;
the dropEpoch reuse worked cleanly per cf-20c-2 R3 reflection
expectation), and what changed mental model.

## Out-of-scope

(none — per the 2026-05-09 retrospective Rule 3 "Defer requires
explicit user approval, not orchestrator's"; user explicitly
disapproved deferral via "不允许 defer". The remaining 4 PRs in the
cf-20 sequence — cf-20e kebab + cf-22 keyboard a11y + cf-23
read-mode unification + cf-24 sidebar — are scheduled work, not
"out-of-scope" deferrals.)

Items NOT in cf-20d scope but referenced for context:
- **Touch device resize**: same as cf-20c-2 Q4 deferred to
  cf-22/cf-25 (touch UX bundles drag + resize together).
- **Keyboard resize a11y** (arrow keys ±1 snap step + Enter commit
  + Esc cancel): cf-22 scope.
- **`useAutoRowSpan` integration on resize-canceled prose blocks**:
  prose has no resize handles per D2, so no integration needed.
- **Per-axis ghost / preview rectangle during resize** (v2 demo
  shows a preview-block outline at the destination size): not
  required by ADR-0017 D9; the body-hidden + outline contract is
  sufficient. Future cf-23+ visual polish PR may add.

## Related

- [cf-20c-2 PR.md](wave-6-cf-20c-2-drag-handle-wire.md) — drag wire.
  cf-20d reuses the dropEpoch infrastructure + byte-snapshot fixture
  isolation pattern + DragDropProvider pattern (renamed
  ResizeProvider).
- [cf-20c-1 PR.md](wave-6-cf-20c-1-apply-drop-mode-algebra.md) —
  pure mutation algebra. cf-20d's pipeline doesn't compose
  applyDropMode (drop modes are split-* / empty / none; resize is
  pure colSpan/rowSpan mutation on the same block). cf-20d has its
  own `resize-snap.ts` pure helpers analogous to applyDropMode but
  much simpler.
- [cf-20b PR.md](wave-6-cf-20b-grid-layout-substrate.md) — grid
  substrate. cf-20d reads `node.attrs.{col,colSpan,rowSpan}` via
  the same `extractGridPosition` helper.
- [cf-19 PR.md](wave-6-cf-19-editor-block-visual-identity.md) —
  shipped the `.skb-block-nodeview` wrapper that cf-20d adds
  resize handles to.
- [ADR-0017 D7 + D9](../../decisions/ADR-0017-drag-drop-ux.md) —
  resize feedback contract + per-kind handle visibility + mobile
  view-only.
- [ADR-0016 D2 + D6 + D10](../../decisions/ADR-0016-grid-data-model.md)
  — BlockGridPosition shape + COL_SNAPS + gridKind authority.
- [ADR-0011 D1 stage 4 + D9](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pre-commit Claude review trigger (Row 1 + Row 5 hit) +
  ui_touch / e2e_smoke gates.
- [orchestrator-reflections 2026-05-09](../../orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md)
  — process rules driving cf-20d (ADR > dispatch brief; ADR-derived
  feature artifact-checklist; CONTRACT.md/JSDoc honesty;
  byte-snapshot test isolation; doc-drift mechanical grep;
  dropEpoch reuse; rapid-action animation isolation).
- v2-styles.css `.gblock-handle.*` lines 256-311 + `.col-ruler` /
  `.size-tooltip` / `.row-ladder` lines 313-385 + `.gblock.resizing`
  lines 172-176 — direct visual contract source for cf-20d.
