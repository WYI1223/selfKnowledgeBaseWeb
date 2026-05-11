# Wave 7 interaction prototype — drag/resize/delete/insert + gravity toggle + 3 grid-engine extensions

> Successor to PR #120 (`wave-7-grid-redesign`). The static theme
> prototype validated mental models; this PR adds **interactive**
> drag/resize/delete/insert so user can actually drive grid-engine ops
> through all 3 themes and feel the UX. Engine gets 3 small extensions
> driven by user feedback during the prototype session.

## title

Make the `/grid-prototype?variant={A,B,C}` route fully interactive
(HTML5 DnD for move + palette-to-canvas insert, pointer events for
6-axis resize, × button for delete). Extend `@skb/grid-engine` with
3 user-feedback fixes: `maxEmptyRectContaining` (hole-fill anchors to
hole top-left, not cursor), `transformBlock` (atomic move+resize for
left/top-edge resize), and `OpOptions.gravity` (toggle Option A on/off
for free-placement mode).

## files

**Engine — 3 new public-surface extensions (already shipped via PR #120
public exports; these add features within the contract):**

- `packages/grid-engine/src/intent.ts` (MOD ~95 LOC)
  - NEW `maxEmptyRectContaining(state, col, row, capW, capH)` — finds
    the maximal axis-aligned empty rectangle CONTAINING the cursor
    cell, clamped by cap dimensions. Replaces the cursor-anchored
    growth that was wrong (cursor in middle of 6×4 hole would shrink
    to cursor → bottom-right corner; now it fills the hole).
  - `maxEmptyRectAt` retained as `@deprecated` shim for prior tests.
  - `inferDropIntent` rewired to use the new function; `intent.col` +
    `intent.row` are now the HOLE's top-left, not cursor coords.
- `packages/grid-engine/src/ops.ts` (MOD ~50 LOC)
  - NEW `OpOptions = { gravity?: boolean }` type.
  - NEW `transformBlock(state, id, changes, options)` — atomic
    move+resize. Left/top-edge resize needs to change col + colSpan
    (or row + rowSpan) in one transaction; separate moveBlock +
    resizeBlock isn't atomic if second fails.
  - All 4 existing ops (insertBlock / moveBlock / resizeBlock /
    deleteBlock) accept `OpOptions` — default `{ gravity: true }`
    preserves Option A invariant, `{ gravity: false }` skips the
    `applyGravity` pass for free-placement (Powerpoint-style) mode.
- `packages/grid-engine/src/index.ts` — exports `transformBlock`,
  `maxEmptyRectContaining`, `OpOptions`.
- `packages/grid-engine/src/__tests__/transform-and-options.test.ts`
  (NEW ~210 LOC) — 9 tests across the 3 extensions:
  - 3 hole-fill scenarios (cursor middle of large hole, cursor in
    top-left of bounded hole, cursor on occupied = reject)
  - 2 transformBlock scenarios (left-edge resize succeeds, rejected
    when overlap)
  - 4 gravity-toggle scenarios (insert/delete/resize with
    `{gravity:false}` + default preserves Option A)

**Prototype — new interaction layer (all under `_grid-prototype/`):**

- `apps/site/src/components/_grid-prototype/useGridInteraction.ts`
  (NEW ~270 LOC) — shared interaction hook. Owns GridState +
  drag/resize state + gravity toggle. Returns:
  - `state`, `ops` (insertAt/move/resize/transform/remove/reset)
  - `drag` (active, payload, cursorCell, intent)
  - `resize` (active, blockId, axis, preview col/row/w/h)
  - `gravityEnabled` + `setGravityEnabled`
  - `blockDragProps(block)` — wires HTML5 native drag (move source)
  - `paletteDragProps(kind)` — wires HTML5 native drag (insert source)
  - `canvasDropProps(slotSize)` — wires drop target (compute cell
    from pointer, call inferDropIntent for ghost preview, dispatch
    insertAt / move on drop)
  - `beginResize(e, block, axis, slotSize)` — pointer-events lifecycle
    for 6 resize axes (right, left, top, bottom, corner, top-left)
    using transformBlock for atomic position+size mutation.
- `apps/site/src/components/_grid-prototype/shared-overlays.tsx`
  (NEW ~145 LOC) — theme-agnostic overlay components: DeleteButton,
  ResizeHandle (single axis), ResizeHandles (renders all 6), DropGhost
  (green=valid, red=invalid), ResizePreview (blue dashed rect during
  resize). Variants spread these into their themed block shells so
  none of them re-implement interaction chrome.
- `apps/site/src/components/_grid-prototype/MiniPalette.tsx` (NEW
  ~110 LOC) — floating top-right panel with 9 kind chips (draggable
  to canvas for hole-fill insert) + Gravity toggle checkbox + Reset
  button.
- `apps/site/src/components/_grid-prototype/GridPrototype.tsx` (MOD)
  — now owns `useGridInteraction()` and passes the result to each
  variant. Theme switch preserves state (same blocks, different
  render).
- `apps/site/src/components/_grid-prototype/variants/Variant{A,B,C}.tsx`
  (MOD) — each variant now accepts `{ interaction }` prop, spreads
  `canvasDropProps` on canvas root, `blockDragProps` on each block,
  renders `DeleteButton` + `ResizeHandles` + `DropGhost` +
  `ResizePreview` from shared overlays. Theme-specific styling
  preserved.

## ui_touch

`true` — `apps/site/src/components/_grid-prototype/**.tsx` changes +
new files under `apps/site/src/`. The route remains `/grid-prototype`
(unchanged from PR #120). Only access is by direct URL — unlinked
from production UI.

## e2e_smoke

- flow: `/grid-prototype?variant={A,B,C}` mounts the React island
  for all 3 themes without hydration errors after the interaction
  refactor. Same spec as PR #120 (we don't add Playwright coverage of
  drag/drop interaction itself — it's a prototype validation route).
  target_url: /grid-prototype
  playwright_spec: apps/site/playwright/grid-prototype-themes.spec.ts:"Wave 7 prep — /grid-prototype?variant=A mounts the React island without errors"
  assertions:
    - All 3 variants (A/B/C) mount without page errors
    - Floating switcher chip + MiniPalette both visible (interaction layer hydrated)
    - No console.error during hydration

## Acceptance

executor: orchestrator-self (continuation of PR #120 prototype work;
no codex executor needed for prototype iterations)
reviewer: CI gates only (lint + typecheck + test + build + size-check
+ lychee + e2e-coverage-check)
contract_changes: `@skb/grid-engine` adds 3 new exports — additive,
no breaking changes to PR #120's public surface
new_adr: NOT in this PR — ADR-0019 follows in PR #122 (covers the
locked engine contract including these 3 new exports + the Theme
interface spec) BEFORE Phase 1 (theme infrastructure package)
implementation begins
risk_class: D2 row 2-ish (engine public surface extension) — but
purely additive, default behavior preserves Option A from PR #120,
no consumers in production yet. PRE-COMMIT CLAUDE REVIEW skipped per
bootstrap-scope rule (same as PR #120).

## Out of scope

- ADR-0019 grid-engine contract lock — PR #122
- `@skb/grid-themes` package — PR #123 (Phase 1 implementation)
- Production editor integration — Phase 2 (multiple PRs)
- Prototype cleanup — Phase 3 (after editor migrated)

## Next-step plan (per orchestrator + user agreement 2026-05-11)

```
PR #120 (merged) — wave-7-grid-redesign: @skb/grid-engine package +
                   static 3-theme prototype + design doc
PR #121 (this)  — wave-7-prototype-interaction: drag/resize/delete +
                   gravity toggle + 3 engine extensions
PR #122         — ADR-0019: lock grid-engine contract + Theme spec
PR #123         — Phase 1: @skb/grid-themes package + 3 production
                   themes + storage layer + theme switcher (NOT yet
                   wired to editor)
PR #124         — Phase 2A: rowSpan='auto' → discrete migration
PR #125         — Phase 2B: replace applyDropMode with grid-engine
                   ops in editor-shell; add gravity
PR #126         — Phase 2C: replace useProjectGridStyleToOuter with
                   theme-driven grid placement; wire theme switcher
PR #127         — Phase 3: delete prototype + add Playwright coverage
                   for editor themes + ADR amendments
```

## Honest scope

12 files / +391 LOC net add. Engine extensions ~140 LOC; prototype
interaction layer ~525 LOC NEW; variant updates ~440 LOC mod (mostly
refactor to consume shared overlays).
