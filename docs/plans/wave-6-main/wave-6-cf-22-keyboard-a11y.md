# Wave 6 cf-22 — Drag + Resize + Kebab keyboard a11y (WCAG 2.1.1 / 2.4.3 / 2.4.7 / 4.1.3)

> Wave 6 carry-forward — adds keyboard-mode parity to all 3 cf-20
> per-block affordances (drag / resize / kebab) per WCAG 2.1
> Guidelines 2.1.1 (Keyboard) + 2.4.3 (Focus Order) + 2.4.7 (Focus
> Visible) + 4.1.3 (Status Messages). All affordances become
> keyboard-reachable + arrow-key-operable; an `aria-live="polite"`
> region announces drag/resize/kebab state changes for screen
> readers.
>
> Per orchestrator-decision Q2 of original cf-20 sequence: keyboard
> a11y is IN scope (was suggested defer in cf-20c-1 scoping; user
> said no defer). cf-22 establishes the keyboard contract via
> ADR-0017 D13 amendment (per Q1 below).
>
> v2-design-granularity §"心智模型" intent is "拖拽抽屉 + 边框拖
> 拽吸附宽度" pointer-only. cf-22 documents the keyboard mode
> EXPLICITLY as parity (NOT a degraded subset) — orchestrator
> Q2 amendment.

## title

NEW `packages/editor-shell/src/a11y/live-announcer.tsx` (~80 LOC) —
shared `aria-live="polite"` region rendered once at the editor
mount level + an `useAnnounce` hook that pipelines call to push
messages. NEW `a11y/use-focus-return.ts` (~90 LOC) — generalizes
the focus-snap-and-restore pattern from `useEscCancel` (per WCAG
2.4.3). NEW `a11y/keyboard-step.ts` (~110 LOC) pure helpers
`keyboardSnapStep(currentColSpan, direction, activeColSnaps)` for
resize axis ±1 snap-step (per cf-22 D2 snap-step decision) and
`keyboardGridStep(currentCol, direction, totalCols)` for drag arrow
±1 grid cell. NEW `a11y/announce-format.ts` (~70 LOC) pure helpers
formatting drag/resize/kebab status messages per WCAG 4.1.3.
MODIFY `packages/editor-shell/src/drag-drop/drag-handle-button.tsx`
(~50 LOC delta) to add `onKeyDown` handler — Enter/Space enters
keyboard-drag mode via new `ctx.onDragStartKeyboard(blockId)`
context method; existing pointer drag path untouched. MODIFY
`drag-drop/drag-context.tsx` (~10 LOC delta) to expose the new
keyboard-drag start callback. MODIFY
`drag-drop/use-drag-drop-pipeline.ts` (~75 LOC delta) to add the
keyboard-mode lifecycle: `onDragStartKeyboard` snapshots blocks +
sets a virtual cursor at the source block's center + sets
`state.keyboardActive = true`; window-level keydown listener handles
Arrow keys (synthesizes cursor moves through the existing
edge-rect/tiebreak/applyDropMode pipeline) + Enter (commit) +
Tab (commit and move focus). MODIFY
`packages/editor-shell/src/resize/resize-handles.tsx` (~70 LOC
delta) — convert `<div>` handles to `<button>` (keyboard-focusable
+ AT-reachable); remove the wrapper's `aria-hidden`; add
`aria-label`s ("Resize block width", "Resize block height", "Resize
block width and height"); add `onKeyDown` for Enter/Space-to-enter
keyboard-resize-mode. MODIFY `resize/resize-context.tsx` (~10 LOC
delta) to expose `onResizeStartKeyboard` callback. MODIFY
`resize/use-resize-pipeline.ts` (~60 LOC delta) — add
`onResizeStartKeyboard(blockId, axis)` lifecycle: snapshot the
block + set a virtual snap state at the current colSpan/rowSpan +
set `state.keyboardActive = true`; window-level keydown listener
handles Arrow keys (snap-step via `keyboardSnapStep` for right/
corner colSpan; integer ±1 for bottom/corner rowSpan) + Enter
(commit) + Tab (commit). MODIFY
`packages/editor-shell/src/kebab/kebab-menu.tsx` (~95 LOC delta) —
add ArrowDown/ArrowUp keyboard nav between items + ArrowRight to
enter Change-kind sub-menu + ArrowLeft to exit + Enter activates;
auto-focus first item on menu open; manage focus refs. MODIFY
`packages/editor-shell/src/index.ts` to barrel-export the new a11y
public surface. MODIFY
`apps/site/src/components/EditorShellMount.tsx` (~40 LOC delta) to
mount `<LiveAnnouncer>` once + wire `useAnnounce` into the 3
pipeline event surfaces (drag-end-success, resize-commit, kebab-
action). MODIFY `docs/decisions/ADR-0017-drag-drop-ux.md` (NEW D13
section, ~120 LOC) — documents the keyboard a11y contract per Q1
amendment decision. NEW
`apps/site/playwright/sample-blocks-keyboard-a11y.spec.ts` (~280
LOC, 6 tests: drag keyboard / resize keyboard / kebab keyboard /
focus return / announcer messages / Esc cancel from each mode).
NEW vitest unit
`packages/editor-shell/src/__tests__/a11y/keyboard-step.test.ts`
(~120 LOC) covering the pure snap-step + grid-step math. NEW
vitest unit `__tests__/a11y/announce-format.test.ts` (~80 LOC).
Update `editor-shell/CONTRACT.md` + `apps/site/CONTRACT.md` per
ADR-0006 #6 sister-doc rule.

## files

20 source files (~1450 LOC net add; mid-complexity per
orchestrator estimate — keyboard adds a parallel input mode but
doesn't change the underlying pipeline state machine):

1. `packages/editor-shell/src/a11y/live-announcer.tsx` — **NEW**
   (~80 LOC). React component `<LiveAnnouncer/>` renders a single
   `aria-live="polite" aria-atomic="true"` region (off-screen via
   sr-only CSS). Exports `useAnnounce()` hook returning a stable
   `announce(message: string)` callback. Internally maintains a
   message queue + 100ms throttle so rapid arrow-key-spam doesn't
   flood AT (announces only the LATEST message after 100ms quiet
   per the WCAG 4.1.3 polite cadence).

2. `packages/editor-shell/src/a11y/use-focus-return.ts` — **NEW**
   (~90 LOC). Hook `useFocusReturn(active, restoreEl?)` snapshots
   `document.activeElement` when `active` transitions
   `false → true`; restores focus when `active` transitions
   `true → false`. Generalizes the existing focus-snap-and-restore
   pattern from `useEscCancel` (the WCAG 2.4.3 contract); cf-22
   keyboard-drag + keyboard-resize use it explicitly to ensure
   focus returns to the originating handle button.

3. `packages/editor-shell/src/a11y/keyboard-step.ts` — **NEW**
   (~110 LOC). Pure helpers (no React, no DOM):
   - `keyboardSnapStep(currentColSpan, direction, activeColSnaps)`
     → next valid snap. `direction = 'left' | 'right'`. Returns
     the snap immediately smaller (`left`) or larger (`right`)
     than `currentColSpan` from `activeColSnaps`. Clamps at the
     bounds of the snap set.
   - `keyboardGridStep(currentCol, direction, totalCols)` → next
     valid col. Direction `left`/`right`/`up`/`down`. For
     left/right: ±1 col clamped to `[1, totalCols - colSpan + 1]`.
     For up/down: pass through (caller decides if vertical drag
     is meaningful).
   - `keyboardRowStep(currentRowSpan, direction)` → integer ±1
     rowSpan clamped to ≥ 1.

4. `packages/editor-shell/src/a11y/announce-format.ts` — **NEW**
   (~70 LOC). Pure helpers formatting WCAG 4.1.3 status messages:
   - `formatDragMove(blockKind, col, totalCols)` →
     `"Block ${kind} at column ${col} of ${totalCols}"`
   - `formatResizeChange(axis, value, fraction)` →
     `"Resized to ${fraction} width"` for right/corner;
     `"Resized to ${value} rows tall"` for bottom; both fields for
     corner.
   - `formatDragCommit(blockKind, col)` →
     `"Moved ${kind} block to column ${col}"`
   - `formatDragCancel()` → `"Move cancelled, block restored"`
   - `formatKebabAction(action, blockKind)` → `"${action}d ${kind} block"`

5. `packages/editor-shell/src/drag-drop/drag-handle-button.tsx` —
   **MODIFY** (~50 LOC delta). Adds `onKeyDown` handler:
   - Enter / Space → call `ctx.onDragStartKeyboard?.(blockId)` (NEW
     context method) + preventDefault to stop button-click
     fallback.
   - All other keys → no-op (let the button handle Tab natively).
   The existing `dragstart` / `dragend` HTML5 DnD path remains
   untouched (keyboard mode is a SEPARATE entry point per cf-22
   D3 separate-modes decision).

6. `packages/editor-shell/src/drag-drop/drag-context.tsx` —
   **MODIFY** (~10 LOC delta). Adds optional method to
   `DragDropContextValue`:
   - `onDragStartKeyboard?: (blockId: string) => void` —
     consumer wires to `pipeline.onDragStartKeyboard`.

7. `packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts`
   — **MODIFY** (~75 LOC delta). Adds keyboard-drag lifecycle:
   - `onDragStartKeyboard(blockId)` — snapshot blocks (same as
     pointer path); compute virtual cursor at source block's
     center; set `state.keyboardActive = true`; set `state.cursor`
     so OutlineOverlay + DragGhost mount; **focus snapshot is
     saved AT the originating drag-handle button** (per WCAG 2.4.3).
   - Window keydown listener (when `keyboardActive`):
     - Arrow keys → synthesize cursor delta via `keyboardGridStep`;
       update `state.cursor`; re-run `findMatches` + `tiebreak` →
       `setActiveMatch` (drives OutlineOverlay accent). Calls
       `announce(formatDragMove(...))` after each.
     - Enter / Tab → trigger the existing drop logic
       (applyDropMode + setNodeMarkup + dropEpoch pulse). Reset
       `keyboardActive`. Calls `announce(formatDragCommit(...))`.
     - Esc → already handled by `useEscCancel` (existing); calls
       `announce(formatDragCancel())` via the consumer.
   - The pointer drag path (`onDragStart`) still wins if both
     are simultaneously triggered (mouse pointerdown sets
     `state.active = true` + `keyboardActive = false` defensively).
   - Returns extended type with `keyboardActive: boolean` field.

8. `packages/editor-shell/src/resize/resize-handles.tsx` —
   **MODIFY** (~70 LOC delta). Two structural changes:
   - Convert `<div>` handles to `<button type="button">`
     (keyboard-focusable + AT-reachable). Add `aria-label` per
     axis ("Resize block width" / "Resize block height" / "Resize
     block width and height").
   - Remove `aria-hidden: true` from the wrapper (was hiding the
     handles from AT in cf-20d).
   - Add `onKeyDown` per handle: Enter/Space →
     `ctx.onResizeStartKeyboard?.(blockId, axis)` (NEW context
     method).
   - Add `tabIndex={0}` (default for `<button>` so omitted, but
     documented).

9. `packages/editor-shell/src/resize/resize-context.tsx` —
   **MODIFY** (~10 LOC delta). Adds optional method:
   - `onResizeStartKeyboard?: (blockId: string, axis: ResizeAxis) => void`

10. `packages/editor-shell/src/resize/use-resize-pipeline.ts` —
    **MODIFY** (~60 LOC delta). Adds keyboard-resize lifecycle:
    - `onResizeStartKeyboard(blockId, axis)` — snapshot the block
      (mirror the pointer path); set `state.snapColSpan` /
      `snapRowSpan` to the block's CURRENT values; set
      `state.keyboardActive = true`. Focus snapshot at the
      originating handle.
    - Window keydown listener (when `keyboardActive`):
      - Arrow keys (right/corner → left/right adjusts colSpan via
        `keyboardSnapStep`; bottom/corner → up/down adjusts
        rowSpan via `keyboardRowStep`). Calls
        `announce(formatResizeChange(...))`.
      - Enter / Tab → trigger commit path (same as pointerup);
        invokes `onCommitSuccess` for the dropEpoch pulse reuse.
      - Esc → handled by useEscCancel; cancels without commit.
    - Returns extended type with `keyboardActive: boolean`.

11. `packages/editor-shell/src/kebab/kebab-menu.tsx` —
    **MODIFY** (~95 LOC delta). Adds full keyboard navigation:
    - On menu mount, focus the FIRST item programmatically (so
      Enter/Space-opening from kebab button immediately lands
      focus on Delete).
    - ArrowDown / ArrowUp move focus through items (cycle at
      bounds).
    - Enter activates the focused item.
    - ArrowRight on "Change kind…" expands sub-menu + focuses
      first sub-item.
    - ArrowLeft from a sub-item collapses sub-menu + returns
      focus to "Change kind…".
    - Esc closes the menu (handled at KebabButton already).
    - Refs array tracks each item's button DOM node for
      programmatic focus.

12. `packages/editor-shell/src/index.ts` — **MODIFY** (~12 LOC
    delta). Adds barrel exports for `LiveAnnouncer`, `useAnnounce`,
    `useFocusReturn`, `keyboardSnapStep`, `keyboardGridStep`,
    `keyboardRowStep`, `formatDragMove`, `formatResizeChange`,
    `formatDragCommit`, `formatDragCancel`, `formatKebabAction`.

13. `apps/site/src/components/EditorShellMount.tsx` — **MODIFY**
    (~40 LOC delta). Mounts `<LiveAnnouncer/>` once next to the
    `<DragDropProvider>`. Uses `useAnnounce` to push messages from
    the 3 pipeline event surfaces:
    - drag-end-success → `formatDragCommit(...)`
    - resize commit success → `formatResizeChange(...)`
    - kebab action → `formatKebabAction(...)`
    Wires `onDragStartKeyboard` + `onResizeStartKeyboard` callbacks
    on the existing `dragContextValue` + `resizeContextValue`
    memos.

14. `docs/decisions/ADR-0017-drag-drop-ux.md` — **MODIFY** (NEW
    D13 section ~120 LOC). Documents the keyboard a11y contract:
    - Keyboard-mode parity (NOT degraded subset) per orchestrator
      Q2.
    - Mouse + keyboard modes are SEPARATE (mid-mouse-drag, keyboard
      arrow keys are no-op; mid-keyboard-drag, mouse pointerdown
      ends keyboard mode). Per cf-22 D3.
    - Arrow key delta = snap-step (resize) / 1 grid cell (drag).
      Per cf-22 D2.
    - WCAG mapping: 2.1.1 (all functionality keyboard-operable);
      2.4.3 (focus returns to originating handle); 2.4.7 (visible
      focus on all controls); 4.1.3 (aria-live announcements).

15. `packages/editor-shell/src/__tests__/a11y/keyboard-step.test.ts`
    — **NEW** (~120 LOC, ~10 vitest cases). Covers
    `keyboardSnapStep` (left/right at boundaries + interior +
    empty snap set fallback) + `keyboardGridStep` (clamp at
    `[1, totalCols - colSpan + 1]`) + `keyboardRowStep` (clamp ≥ 1).

16. `packages/editor-shell/src/__tests__/a11y/announce-format.test.ts`
    — **NEW** (~80 LOC, ~6 vitest cases). Covers
    `formatDragMove`/`formatResizeChange`/`formatDragCommit`/
    `formatDragCancel`/`formatKebabAction` for the 3 axis variants
    + the 4 kebab actions.

17. `apps/site/playwright/sample-blocks-keyboard-a11y.spec.ts` —
    **NEW** (~280 LOC, 6 integration tests):
    - **Test 1 (drag keyboard)**: Tab to first drag-handle; Enter
      starts keyboard-drag; ArrowRight 3× moves cursor 3 cells;
      Enter commits → assert source's gridColumn `col` mutated +
      DropPulse anchor mounts; focus returns to drag handle.
    - **Test 2 (resize keyboard)**: Tab to first right-handle;
      Enter starts keyboard-resize; ArrowLeft 1× shrinks colSpan
      to next-smaller snap (e.g. 12 → 8); Enter commits → assert
      gridColumn matches `1 / span 8`; focus returns to right
      handle.
    - **Test 3 (kebab keyboard)**: Tab to first kebab; Enter
      opens menu (3 items); ArrowDown → focus on Duplicate;
      ArrowDown → focus on Change kind…; ArrowRight expands
      sub-menu + focuses first sub-item; Enter activates → assert
      block kind mutated to first kind in sub-menu.
    - **Test 4 (focus return after Esc)**: open kebab menu → Esc
      → focus is on kebab button. Enter keyboard-drag → Esc →
      focus is on drag handle.
    - **Test 5 (announcer)**: assert
      `[data-skb-live-announcer]` element present; after a
      keyboard-drag commit, its textContent contains "Moved" +
      column number.
    - **Test 6 (mobile-hidden)**: at 375×812, all keyboard-
      reachable handles still have `display: none` (mobile
      view-only contract per ADR-0017 D9 — keyboard mode follows
      the same gate).

18. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~80 LOC
    delta). Adds A11y subsection in editor-shell Public surface
    block documenting:
    - LiveAnnouncer / useAnnounce contract.
    - useFocusReturn pattern (cf-22 generalization of
      `useEscCancel` focus-snap-and-restore).
    - keyboardSnapStep / keyboardGridStep / keyboardRowStep
      pure-helper math.
    - announce-format formatters.
    - Drag/Resize keyboard mode lifecycle (keyboard-active
      separate from pointer-active per cf-22 D3).
    - Kebab keyboard nav (ArrowDown/Up/Left/Right + Enter + Esc).

19. `apps/site/CONTRACT.md` — **MODIFY** (~30 LOC delta). Adds
    "Keyboard a11y wire (Wave 6 cf-22)" bullet to the Edit route
    section.

20. `docs/plans/wave-6-main/wave-6-cf-22-keyboard-a11y.md` —
    **NEW** (PR.md self; this file).

Plus 1 NEW screenshot artifact:
`docs/audits/screenshots/wave-6-cf-22-keyboard-a11y.png` emitted
by the new Playwright spec.

## D2 trigger judgment

- **Row 1 (CONTRACT.md change in N packages)** — HIT: 2
  CONTRACT.md files modified.
- **Row 2 (NEW deps)** — N/A.
- **Row 4 (NEW ADR or amendment)** — HIT (per cf-22 D1): ADR-0017
  amendment with NEW D13 section.
- **Row 5 (cross-package: ≥ 3 packages)** — HIT.

Per CLAUDE.md `## Review workflow` + ADR-0011 D1 stage 4 +
2026-05-09 retrospective rule "ux-ui-lead is dispatched at PLAN",
**PRE-COMMIT CLAUDE REVIEW (stage 4) fires** on Row 1 + Row 4 +
Row 5. ux-ui-lead authored this PLAN end-to-end. Stage 3
codex-pr-reviewer-55 review still required.

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1
path pattern (NEW `a11y/{live-announcer.tsx, use-focus-return.ts,
keyboard-step.ts, announce-format.ts}`, MODIFY drag-drop/resize/
kebab modules); `apps/site/src/**` matches as well.

The new Playwright spec satisfies D9.2 e2e_smoke obligation; the
emitted screenshot satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mount loads via the ApiAdapter
    chain. Tab key reaches each per-block control sequentially:
    drag handle → kebab → resize handles. Enter/Space activates
    each: drag handle enters keyboard-drag-mode (OutlineOverlay
    + DragGhost mount; arrow keys move source through cells); kebab
    opens menu (first item auto-focused; ArrowDown/Up navigate;
    ArrowRight expands sub-menu); resize handle enters keyboard-
    resize-mode (col/row span adjusts via arrows). Enter commits;
    Esc cancels + restores focus to originating handle per WCAG
    2.4.3. `aria-live="polite"` region announces drag move/commit,
    resize change, and kebab actions per WCAG 4.1.3.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-keyboard-a11y.spec.ts:"sample-blocks edit route — cf-22 keyboard a11y (drag + resize + kebab keyboard mode + focus return + announcer)"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-22-keyboard-a11y.png
  assertions:
    - .ProseMirror visible within 15s
    - Tab focuses .skb-block-nodeview__drag-handle (the first
      keyboard-reachable per-block control)
    - Enter on drag-handle: pipeline.state.keyboardActive becomes
      true; .skb-grid-outline-base mounts; .drag-ghost mounts
    - ArrowRight 3×: source's `cursor.x` advances by 3 grid cells
      worth + OutlineOverlay activeMatch updates
    - Enter commits: source's gridColumn col attr mutated;
      [data-skb-drop-pulse-anchor] mounts; focus returns to
      drag-handle
    - Tab to first .gblock-handle.right; Enter starts keyboard-
      resize; ArrowLeft snaps colSpan from 12 to 8 (next-smaller
      COL_SNAP); Enter commits; gridColumn === '1 / span 8'
    - Tab to kebab; Enter opens menu; ArrowDown 2×; Enter
      activates "Change kind…" → sub-menu first item focused
    - [data-skb-live-announcer] element present; after a commit
      its textContent contains "Moved" / "Resized" / "Deleted"
      (per the 3 commit paths)

- flow: `/notes/sample-blocks/edit` at viewport 375×812 (mobile per
    ADR-0017 D9). All keyboard handles still present in DOM but
    each has `display: none` per the cf-22 mobile @media rule
    (matches cf-20c-2 / cf-20d / cf-20e mobile view-only).
  target_url: /notes/sample-blocks/edit (at 375×812 viewport)
  playwright_spec: apps/site/playwright/sample-blocks-keyboard-a11y.spec.ts:"cf-22 keyboard handles hidden on mobile (≤768px) per ADR-0017 D9"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-22-keyboard-a11y.png
  assertions:
    - viewport set to 375×812
    - .skb-block-nodeview__drag-handle count > 0; first computed `display === 'none'`
    - .gblock-handle.right count > 0; first computed `display === 'none'`
    - .skb-block-nodeview__kebab count > 0; first computed `display === 'none'`

## Why (user feedback)

cf-22 is PR 7 of 9 in the locked cf-20 sequence. User directive
2026-05-09 (verbatim, dispatched as cf-20a + carried through):

> "全部做，不允许 defer，必须保质保量"

Keyboard a11y was suggested defer in cf-20c-1 scoping (Q2 of
original sequence); user rejected the defer + required parity.
cf-22 closes the WCAG 2.1 conformance gap that cf-20c-2 / cf-20d /
cf-20e collectively opened (each shipped pointer-only handles).

## Design source

- **WCAG 2.1 Guidelines** consumed verbatim per orchestrator brief:
  - **2.1.1 Keyboard (Level A)**: All functionality of the content
    is operable through a keyboard interface without requiring
    specific timings for individual keystrokes. cf-22 ships
    keyboard-mode parity for drag + resize + kebab.
  - **2.4.3 Focus Order (Level A)**: If a Web page can be
    navigated sequentially and the navigation sequences affect
    meaning or operation, focusable components receive focus in
    an order that preserves meaning and operability. cf-22 ships
    `useFocusReturn` ensuring focus returns to the originating
    handle after commit/cancel.
  - **2.4.7 Focus Visible (Level AA)**: Any keyboard operable
    user interface has a mode of operation where the keyboard
    focus indicator is visible. The cf-19 chrome already provides
    `:focus-visible` accent ring; cf-22 verifies all new
    keyboard-reachable controls inherit + adds explicit
    `:focus-visible` rules where missing.
  - **4.1.3 Status Messages (Level AA)**: Status messages can be
    programmatically determined through role or properties such
    that they can be presented to the user by assistive
    technologies without receiving focus. cf-22 ships
    `<LiveAnnouncer/>` with `aria-live="polite"` per the
    canonical WCAG 4.1.3 implementation pattern.
- ADR-0017 D8 — existing global Esc cancel semantics; cf-22
  `useFocusReturn` is the WCAG 2.4.3 generalization of D8's
  focus-snap-and-restore pattern.
- ADR-0017 D9 — mobile view-only contract; cf-22 keyboard-handles
  inherit the `@media (max-width: 768px) { display: none }` rule
  (consistent with cf-20c-2 + cf-20d + cf-20e mobile patterns).
- v2-design-granularity §"心智模型" — pointer-only intent;
  documented EXPLICITLY in cf-22 D1 ADR amendment that keyboard
  is parity (NOT degraded subset).
- cf-20c-2 R3 dropEpoch pattern — keyboard commits reuse the same
  success-pulse infrastructure (the field is generic
  "rapid-action animation isolation" per the R3 reflection).
- cf-20e D8 — kebab Esc-to-close pattern; cf-22 extends with
  Arrow key navigation between menu items.

## Decisions

### D1 — ADR-0017 amendment with NEW D13 (keyboard a11y) — NOT a separate ADR

**Open question Q1 from dispatch brief**: ADR-0017 amend (D13
keyboard) OR new ADR-0019 (keyboard a11y standalone)?

**Decision**: ADR-0017 amendment with NEW D13 section. Rationale:
1. Keyboard mode is INTRINSIC to the drag/resize UX, not
   orthogonal — the same pipelines (drag / resize) gain a
   parallel keyboard-mode entry point but share all downstream
   logic (snapshot / edge-rect / tiebreak / applyDropMode /
   setNodeMarkup / dropEpoch pulse).
2. ADR-0017 already includes D8 (Esc cancel) which is a
   keyboard concern; adding D13 (full keyboard parity) belongs
   in the same architectural document for discoverability.
3. ADR-0019 already exists as wave-5-close (unrelated).
   Creating ADR-0020 just for keyboard would split the drag/
   resize design doc into two places.

**Note**: cf-22 dispatch brief's wording "amend ADR-0017 with new
D13 lock OR creating a NEW ADR-0019 keyboard a11y" was based on a
stale ADR-numbering assumption — ADR-0019 is taken. The choice
collapses to ADR-0017 D13 amendment (only viable path).

### D2 — Arrow-key delta = snap-step (NOT 1 cell movement) for resize; 1-cell for drag

**Open question Q2 from dispatch brief**: Arrow key = 1 cell
movement vs 1 snap-step movement.

**Decision**: snap-step for resize, 1-cell for drag. Rationale:
1. Resize: mouse drag's release-snap behavior already maps
   continuous deltas to discrete COL_SNAPS; keyboard parity
   means each Arrow key advances to the next valid snap (not
   1 col which would land on invalid spans like colSpan=5).
   `keyboardSnapStep` finds the next snap immediately
   smaller/larger than current.
2. Drag: the drop position is a `col` index (1..totalCols), which
   is itself the smallest grid unit. ArrowRight/Left ±1 col
   matches the user's mental model ("nudge one cell over"). For
   row drag (vertical), ArrowDown/Up moves to the row above/
   below the current one (the grid is sparse — most rows are
   defined by content, so vertical drag moves between sibling
   blocks; cf-22 ships left/right baseline + `up/down` is a
   pass-through to next/prev sibling block per existing tiebreak
   logic).

### D3 — Mouse + keyboard modes are SEPARATE (no mid-drag bridge)

**Open question Q3 from dispatch brief**: combined mouse+keyboard
mid-drag (bridge) vs separate modes.

**Decision**: separate modes. Rationale:
1. State machine simplicity: each pipeline has ONE active mode
   at a time (`active = pointer || keyboardActive`). Bridging
   modes mid-drag introduces edge cases (which set of arrow keys
   wins? does mouse pointerup commit a keyboard-mode delta?).
2. User mental model: when you start dragging with mouse, you're
   "in mouse mode"; keyboard arrow keys are no-op until mouse
   release. When you start with keyboard (Enter on handle),
   you're "in keyboard mode"; mouse pointerdown elsewhere ends
   keyboard mode + restores focus.
3. cf-22 implementation: `state.keyboardActive` is a separate
   flag from `state.active` (the pointer-active). The pipeline
   sets both to false on commit/cancel to ensure clean reset.
   Mid-mouse-drag: `keyboardActive` stays false (Arrow handlers
   gate on `keyboardActive`). Mid-keyboard-drag: a mouse
   pointerdown anywhere triggers `onDragEnd({x:0, y:0})` which
   resets the pipeline (per the existing pointercancel cleanup
   path).

Document in D13 ADR amendment.

### D4 — `<button>` elements for handles (NOT `role="application"` on .ProseMirror)

**Open question Q4 from dispatch brief**: `role="application"` vs
`role="textbox"` on .ProseMirror.

**Decision**: keep ProseMirror's default role (textbox-like for
content-editable). Convert resize handles from `<div>` to
`<button>`; drag-handle is already `<button>`; kebab is already
`<button>`. Rationale:
1. `<button>` elements natively capture Enter/Space/Tab; AT
   announces them as buttons; no role override needed.
2. Arrow keys are handled by WINDOW-level listeners ONLY when the
   pipeline is in `keyboardActive` state — they don't fire when
   focus is on the editor surface (so ProseMirror's text-editing
   keymap is preserved).
3. `role="application"` would suppress AT's reading mode for the
   ENTIRE editor surface — a heavy intervention that interferes
   with text-content reading. cf-22 keeps the application-role
   model OUT.

Per cf-22 D4 documentation in D13 ADR amendment.

### D5 R1 amendment — Tab in active keyboard-mode = sync commit-or-cancel (NO preventDefault; browser advances focus naturally)

**R1 finding F3 (codex-pr-reviewer-55 round 1, 2026-05-10)**:
pre-R1 `keydown` handlers in keyboard-drag-mode + keyboard-
resize-mode IGNORED Tab. The browser's default Tab behavior would
fire AFTER the handler returned, advancing focus while
`keyboardActive=true` remained — leaving the pipeline in an
inconsistent state (subsequent arrow keys outside the originating
handle would still fire as if the user was still in
keyboard-drag-mode).

**Decision (R1)**: Tab in active keyboard-mode = synchronous
`commit()`. Shift+Tab in active keyboard-mode = synchronous
`cancel()`. NEITHER calls `event.preventDefault()` so the browser
advances focus naturally after the handler returns. This:
1. Cleans up `keyboardActive` (commit/cancel both reset to false).
2. Preserves WCAG 2.4.3 focus order (browser Tab walk continues
   normally after exit).
3. Mirrors Esc semantics (sync cancel + restore focus) but with a
   focus-walk twist (Esc returns to originating handle; Tab moves
   forward through the page).

Applied to BOTH `keyboard-drag-mode.ts` + `keyboard-resize-mode.ts`
keydown handlers. Playwright spec test "cf-22 R1 F3 — Tab in
keyboard-drag commits + resets keyboardActive + focus advances"
locks the contract.

### D5 R2 amendment — useEscCancel reason flag (skip focus-restore on tab-commit/tab-cancel)

**R2 finding F3 (codex-pr-reviewer-55 round 2, 2026-05-10)**: R1
F3 fix was 80% complete. The Tab keydown handler synchronously
fires commit/cancel + flips `keyboardActive: true → false` without
preventDefault, which is correct. BUT the sibling `useEscCancel`
hook ALSO consumes `keyboardActive` (via the
`active || keyboardActive` predicate). Its `useEffect` snapshots
`document.activeElement` on the `false → true` flip and refocuses
that element on the `true → false` flip, **regardless of whether
the deactivation reason was Esc OR Tab**. So the sequence was:

1. Tab pressed → handler runs `commit()` → `keyboardActive` flips false.
2. Browser's natural Tab focus-advance fires (handler did NOT preventDefault).
3. React commits the `keyboardActive: false` state → `useEscCancel`'s
   effect runs → restores focus to the snapshotted originating handle.
4. **Tab focus-advance is undone**.

The R1 Playwright lock at `sample-blocks-keyboard-a11y.spec.ts:480`
asserted only `commit happened` + `overlay cleanup`; it did NOT
assert `document.activeElement` actually moved past the handle.
The test passed by accident.

**Decision (R2)**: introduce an explicit reason flag on
`useEscCancel`. The hook now exposes:
- `EscDeactivationReason = 'esc-cancel' | 'commit' | 'pointer-up' | 'tab-commit' | 'tab-cancel'`
- `EscCancelHandle.markDeactivationReason(reason)` returned from the hook.
- The hook's deactivation `useEffect` checks the reason; for
  `'tab-commit'` / `'tab-cancel'` it SKIPS focus restoration so the
  browser's natural Tab focus-advance is preserved.
- The reason is one-shot — reset to `'esc-cancel'` (the default,
  matching the hook's primary purpose) after each deactivation
  cycle.

Drag + resize keyboard pipelines now accept an optional
`markEscDeactivationReason: (reason: 'tab-commit' | 'tab-cancel') => void`
option. The `EditorShellMountInner.tsx` consumer wires this through
a ref-based indirection (the hook's return is captured AFTER the
pipeline construction; a stable callback closures over the ref).
On Tab keydown, both keyboard pipelines call
`markEscDeactivationReason('tab-commit' | 'tab-cancel')` BEFORE
their commit/cancel state flip. Esc-originated cancels keep the
default reason and continue restoring focus to the originating
handle (existing behavior preserved).

Strengthened Playwright locks:
- `cf-22 R1 F3 + R2 F3 — Tab in keyboard-drag commits + resets
  keyboardActive + focus advances PAST originating handle` —
  asserts `document.activeElement.outerHTML !== originatingHandleHTML`.
- `cf-22 R2 F3 — Tab in keyboard-resize commits colSpan + focus
  advances PAST originating handle` — same contract for resize.

### D5 — Esc cancel + focus return to originating handle (verify all 3 paths)

**Open question Q5 from dispatch brief**: cancel-without-commit
cleanup paths.

**Decision**: cf-22 verifies all 3 paths via the new
`useFocusReturn` hook (a generalization of the existing
`useEscCancel` focus-snap-and-restore):
- Drag keyboard: `onDragStartKeyboard(blockId)` snapshots
  `document.activeElement` (which is the drag-handle button); on
  drag-end-cancel OR drag-end-success the snapshot is restored.
- Resize keyboard: `onResizeStartKeyboard(blockId, axis)`
  snapshots `document.activeElement` (which is the resize-handle
  button); on resize-end-cancel OR resize-commit the snapshot is
  restored.
- Kebab menu close: when menu closes (Esc OR action commit), the
  KebabButton's `wrapperRef` programmatically calls
  `kebabButtonRef.current?.focus()` to return focus.

Test 4 of the Playwright spec covers all 3 paths.

### D6 R1 amendment — `<LiveAnnouncer>` provider/consumer split + 6 useCallback announce wirings (silent-scaffolding gap fix)

**R1 finding F1 (codex-pr-reviewer-55 round 1, 2026-05-10)**:
pre-R1 the `<LiveAnnouncer>` was mounted inside
`EditorShellMount.tsx` AND the format helpers
(`formatDragMove`/`formatDragCommit`/`formatDragCancel`/
`formatResizeChange`/`formatResizeCancel`/`formatKebabAction`)
existed in `announce-format.ts` BUT no caller invoked them. The
live region existed; nothing spoke into it. Silent WCAG 4.1.3
violation that all 6 a11y unit tests passed because they verified
the helpers in isolation, never the wiring.

**Decision (R1)**: split `EditorShellMount.tsx` into outer
`<LiveAnnouncer>` provider (39 LOC) + inner consumer
`EditorShellMountInner.tsx` (445 LOC). The inner component calls
`useAnnounce()` — possible only because it's inside the provider's
React-context scope. Six `useCallback` factories
(`onAnnounceDragMove` / `onAnnounceDragCommit` /
`onAnnounceDragCancel` / `onAnnounceResizeChange` /
`onAnnounceResizeCancel` / `onAnnounceKebab`) wrap the format
helpers + push messages through `announce()`. They wire into:
- `useDragDropPipeline({onAnnounceMove, onAnnounceCommit, onAnnounceCancel})`
- `useResizePipeline({onAnnounceChange, onAnnounceCancel})`
- `makeKebabDelete(editor, onAnnounceKebab)` /
  `makeKebabDuplicate(editor, setLast, onAnnounceKebab)` /
  `makeKebabChangeKind(editor, onAnnounceKebab)` factories.

The pipelines now invoke the callbacks at the appropriate
mutation-success / cancel sites (after `setNodeMarkup` /
`commitDropAtMatch` / commit close).

Operational rule landed (cf-22 R1 reflection rule #19):
**Scaffolding (helpers / hooks / components) MUST have a verified
consumer in the same PR**. Exporting + unit-testing the helper is
NOT the contract; the consumer wiring is.

### D6 — `<LiveAnnouncer/>` mounted ONCE at the editor mount level (NOT per-pipeline)

The `aria-live` region is a single shared element. Mounting one
per pipeline (drag + resize + kebab) would:
1. Cause AT to announce duplicate messages if 2 pipelines fire
   simultaneously (rare but possible).
2. Inflate the DOM with 3 sr-only divs.

**Decision**: cf-22 mounts `<LiveAnnouncer/>` once inside
`EditorShellMount.tsx` at the same scope as `<DragDropProvider>` /
`<ResizeProvider>` / `<KebabProvider>`. The `useAnnounce()` hook
uses React context to push messages into the single queue.
Throttle: the announcer maintains a 100ms quiet window — only the
LATEST message after 100ms of silence is rendered (so rapid arrow-
key spam doesn't flood AT).

### D7 R1 amendment — Drag keyboard mode tracks `{col, row}` grid-coords directly (NO synthesized pixel cursor; commit writes `setNodeMarkup({col, row?})` directly)

**R1 finding F2 (codex-pr-reviewer-55 round 1, 2026-05-10)**:
pre-R1 keyboard-drag-mode synthesized a 60px pixel cursor
(`{x: blockRect.x + 60 * arrowDelta, y: blockRect.y}`) and reused
the pointer-mode tiebreak / `applyDropMode` to compute the drop
target. This was viewport-dependent — on the tablet 6-col grid
(48px col + 16px gap) a 60px arrow step cleared less than one cell
and the user could lose alignment. Worse, the keyboard-commit went
through the same `commitDropAtMatch` path as a pointer drop,
implying that arrow keys synthesize pointer-mode semantics — but
the ADR-0017 D13 keyboard-parity contract explicitly says the
keyboard mode produces grid-coord mutations directly.

**Decision (R1)**: keyboard-drag-mode tracks `{col, row}` grid
coordinates directly via:
1. `KeyboardDragSnapshot` interface captured at `onDragStartKeyboard`:
   `{blockId, startCol, startRow, colSpan, rowSpan, hasRowAttr}`.
2. Pipeline state `keyboardCol` + `keyboardRow` initialized from
   `sourceBlock.{col, row}`.
3. ArrowLeft/Right handlers call `keyboardGridStep(keyboardCol,
   direction, totalCols, colSpan)` which returns the next valid
   col index (clamped to `[1, totalCols - colSpan + 1]`).
4. ArrowUp/Down handlers call NEW `keyboardGridRowStep(keyboardRow,
   direction)` which returns row ±1 (clamped to ≥ 1).
5. Enter / Tab commit writes `setNodeMarkup({col: keyboardCol, ...
   (hasRowAttr ? {row: keyboardRow} : {})})` directly via Tiptap
   tr.setNodeMarkup. NO `applyDropMode`. NO `commitDropAtMatch`.
   NO synthesized pixel cursor.
6. dropEpoch infrastructure reuse from cf-22 D7 stays — keyboard
   commit still calls `setLastDroppedBlockId/Rect` + `dropEpoch++`
   for the success-pulse.

The `totalCols` value is now an explicit option on
`useDragDropPipeline` (default 12); `EditorShellMountInner`
passes the responsive `totalCols` from `useResponsiveCols`.

Playwright spec test "cf-22 R1 F2 — keyboard-drag ArrowRight +
Enter commits to col=2 EXACTLY (grid-coord, NOT pixel-derived)"
locks the contract via a colSpan=6 fixture (so ArrowRight has
room to advance from col=1 → col=2 in a 6-span block on a 12-col
grid).

### D7 — Reuse cf-20c-2 R3 dropEpoch infrastructure for keyboard-commit success-pulse

Keyboard-mode commits (drag + resize) fire the SAME success-pulse
as pointer-mode commits via `pipeline.setLastDroppedFromExternal`
per cf-20c-2 R3 + cf-20d D3 + cf-20e D6 pattern. The dropEpoch
field is the canonical "rapid-action animation isolation" pattern;
cf-22 keyboard-commit becomes the FOURTH action that exercises it
(joining drag-pointer-commit + resize-pointer-commit + kebab-
duplicate). Zero design cost — just one line at the keyboard
commit site.

### D8 — Kebab menu auto-focus first item on open (WCAG 2.4.3 + canonical menu pattern)

When the kebab menu opens via Enter/Space on the kebab button,
focus moves automatically to the first menu item (Delete). This
matches Notion / standard menu patterns + satisfies WCAG 2.4.3
focus order. Implementation: `useEffect` in `KebabMenu` calls
`firstItemRef.current?.focus()` on mount.

When the menu closes via Esc OR by clicking outside OR by
selecting an item, focus returns to the kebab BUTTON (not back
to the previous focus target like the editor surface) — so
keyboard users can re-open the menu by pressing Enter/Space again
without re-Tabbing.

## Acceptance

```bash
# AC-1: ADR-0011 D9 ui_touch detects on the right files
pnpm exec tsx scripts/check-ui-touch.ts \
  --files packages/editor-shell/src/a11y/live-announcer.tsx \
          packages/editor-shell/src/a11y/keyboard-step.ts \
          packages/editor-shell/src/drag-drop/drag-handle-button.tsx \
          packages/editor-shell/src/resize/resize-handles.tsx \
          packages/editor-shell/src/kebab/kebab-menu.tsx \
          apps/site/src/components/EditorShellMount.tsx 2>&1 | tail -3
# Expected: ui_touch=true
```

```bash
# AC-2: editor-shell + apps/site test suites green
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 265+ passed (cf-20e 249 + cf-22 ~16 new vitest cases)
pnpm --filter @skb/site test 2>&1 | grep -E 'Tests'
# Expected: 78 passed | 1 skipped (carried)
```

```bash
# AC-3: targeted Playwright passes (a11y spec + carried; post-R2 expanded set)
pnpm --filter @skb/site exec playwright test \
  playwright/sample-blocks-keyboard-a11y.spec.ts \
  playwright/sample-blocks-kebab-menu.spec.ts \
  playwright/sample-blocks-resize-handles.spec.ts \
  playwright/sample-blocks-drag-handle.spec.ts \
  playwright/sample-blocks-edit-loads.spec.ts \
  --reporter=line --workers=1 2>&1 | tail -3
# Expected: 27 passed (11 cf-22 incl. 4 R1+R2 tests + 5 cf-20e + 6 cf-20d + 4 cf-20c-2 + 1 edit-loads)
```

```bash
# AC-4: full apps/site Playwright suite passes (post-R2)
pnpm --filter @skb/site exec playwright test --reporter=line --workers=1 2>&1 | tail -3
# Expected: 79 passed | 14 skipped | 0 failed (was 78 in pre-R2; +1 new R2 resize-Tab test)
# Note: cf-20d/cf-20e tests have a known intermittent flake under full-suite ordering;
# pass in isolation. R2 changes are unrelated.
```

```bash
# AC-5: pnpm check exit 0
pnpm check
# Expected: all 41 tasks successful
```

```bash
# AC-6: cf-22 source surface lands at the expected paths
test -f packages/editor-shell/src/a11y/live-announcer.tsx && echo OK
test -f packages/editor-shell/src/a11y/use-focus-return.ts && echo OK
test -f packages/editor-shell/src/a11y/keyboard-step.ts && echo OK
test -f packages/editor-shell/src/a11y/announce-format.ts && echo OK
# Expected: 4× "OK"
```

```bash
# AC-7: barrel exports the new public surface
grep -cE 'LiveAnnouncer|useAnnounce|useFocusReturn|keyboardSnapStep|keyboardGridStep|keyboardRowStep|formatDragMove|formatResizeChange' packages/editor-shell/src/index.ts
# Expected: ≥ 8
```

```bash
# AC-8: ADR-0017 D13 amendment landed
grep -cE '### D13 — Keyboard a11y' docs/decisions/ADR-0017-drag-drop-ux.md
# Expected: 1
```

```bash
# AC-9: resize handles converted to <button> (cf-22 D4)
grep -cE "createElement\\('button'" packages/editor-shell/src/resize/resize-handles.tsx
# Expected: ≥ 1 (the handles use <button> not <div>)
grep -cE "'aria-hidden': true" packages/editor-shell/src/resize/resize-handles.tsx
# Expected: 0 (the wrapper aria-hidden was removed per cf-22 D4)
```

```bash
# AC-10: ADR-0017 D9 mobile view-only path locked for keyboard handles
# Keyboard handles are the SAME DOM elements as pointer handles (just gain
# new event listeners); mobile @media rules from cf-20c-2 / cf-20d / cf-20e
# already hide them. Verify no NEW mobile-violating CSS.
grep -cE '@media \(max-width: 768px\)' packages/editor-shell/src/a11y/live-announcer.tsx 2>/dev/null
# Expected: 0 (announcer is sr-only; not mobile-gated; AT works on mobile)
```

```bash
# AC-11: cf-20c-2 R3 dropEpoch reuse for keyboard-commit (per cf-22 D7)
grep -cE 'setLastDroppedFromExternal|onCommitSuccess' \
  packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts \
  packages/editor-shell/src/resize/use-resize-pipeline.ts
# Expected: ≥ 4 (each pipeline references the dropEpoch field at both pointer + keyboard commit sites)
```

```bash
# AC-12: byte-snapshot fixture isolation (cf-20c-2 R3 F1 pattern)
grep -cE 'execSync|git checkout|git restore|git reset' apps/site/playwright/sample-blocks-keyboard-a11y.spec.ts
# Expected: 0
grep -cE 'readFileSync|writeFileSync' apps/site/playwright/sample-blocks-keyboard-a11y.spec.ts
# Expected: ≥ 2
```

## Reflection landing

This PR appends two entries to
`docs/orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md`
per the 2026-05-09 retrospective process rule:

1. **cf-22 initial entry**: what surprised ux-ui-lead during the
   first round (the parallel input mode forced a `keyboardActive`
   separate from `active` in BOTH pipelines — a structural change
   that touched cf-20c-2 + cf-20d in addition to the new a11y
   modules; the WCAG 4.1.3 throttle window for aria-live; the
   structural change of converting resize handles from `<div>` to
   `<button>` removed the wrapper's `aria-hidden` which had been
   silently breaking AT discoverability since cf-20d).

2. **cf-22 R1 entry**: 3 codex-pr-reviewer-55 R1 findings (F1
   silent-scaffolding announcer, F2 pixel-cursor instead of
   grid-coord, F3 ignored Tab) → operational rule #19
   "Scaffolding MUST have verified consumer in same PR"
   (Exporting + unit-testing the helper is NOT the contract; the
   consumer wiring is). The R1 findings traced to a common
   anti-pattern: ux-ui-lead built infrastructure (announcer +
   format helpers + keyboardSnapStep + KeyboardDragSnapshot
   types) and verified each in isolation, but did not verify the
   end-to-end consumer wiring at the mount-component level. cf-22
   R1 fix splits `EditorShellMount.tsx` into outer-provider +
   inner-consumer, wires 6 announce callbacks, rewrites
   keyboard-drag-mode.ts to track grid-coords directly, adds Tab
   handlers in both keyboard pipelines.

3. **cf-22 R2 entry**: 1 codex-pr-reviewer-55 R2 finding — F3
   incomplete because the sibling `useEscCancel` hook (consuming
   `keyboardActive` for Esc cancellation) ALSO restored focus on
   the `keyboardActive: true → false` flip regardless of whether
   the deactivation was Esc-originated OR Tab-originated, undoing
   the browser's natural Tab focus advance. Test passed by
   accident (asserted commit + overlay cleanup but NOT focus
   position). Operational rule #23 landed: "When a feature toggles
   a state flag (active → inactive), audit ALL hooks that consume
   that flag for unintended side effects on the new flip path".
   Fix: reason flag (`tab-commit` / `tab-cancel`) on
   `useEscCancel` skips focus restore for Tab-originated flips.
   Strengthened spec asserts `document.activeElement.outerHTML`
   actually moved past originating handle.

## Out-of-scope

Items NOT in cf-22 scope but referenced for context:
- **Touch-screen gestures (long-press to enter drag mode, etc.)**:
  cf-22 is keyboard-only. Touch a11y deferred to cf-25 per
  ADR-0017 D9 mobile view-only contract.
- **Voice control (Talon Voice / Dragon)**: keyboard mode is the
  prerequisite (voice control synthesizes keyboard events); cf-22
  delivers the prerequisite. No separate voice-specific code.
- **Screen reader live-region throttle tuning**: cf-22 ships a
  100ms quiet window; user-testing may amend in a future cf-22+
  PR if AT verbosity is too low/high.
- **Full keyboard text-content editing inside blocks**: ProseMirror
  already provides this via its content-editable surface. cf-22
  doesn't touch the inner-block text editing path.

## Related

- [cf-20e PR.md](wave-6-cf-20e-kebab-menu.md) — kebab menu wire +
  Esc cancel pattern that cf-22 extends with arrow-key navigation.
- [cf-20d PR.md](wave-6-cf-20d-resize-handles.md) — resize wire +
  `<div>` handles that cf-22 converts to `<button>`.
- [cf-20c-2 PR.md](wave-6-cf-20c-2-drag-handle-wire.md) — drag wire
  + DragHandleButton that cf-22 extends with `onKeyDown` for
  keyboard-drag entry.
- [ADR-0017 D8 + D9](../../decisions/ADR-0017-drag-drop-ux.md) —
  Esc cancel semantics + mobile view-only that cf-22 D13
  amendment composes with.
- [ADR-0011 D9](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pre-commit Claude review trigger (Row 1 + Row 4 + Row 5 hit) +
  ui_touch / e2e_smoke gates.
- [orchestrator-reflections 2026-05-09](../../orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md)
  — 19 process rules applied (artifact-checklist, doc-honesty,
  byte-snapshot tests, dropEpoch reuse, mechanical doc-drift
  grep, multi-field invariant enumeration, parallel input mode
  separation per cf-22 D3).
