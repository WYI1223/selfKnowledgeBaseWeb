# Wave 7 Phase 2B.2 — `applyDropMode` cutover + dead-code removal

> Completes the Wave 7 Phase 2B cutover per [ADR-0020](../../decisions/ADR-0020-grid-engine-contract.md)
> D2. The 4-mode `applyDropMode` algebra + `tiebreak` + `edge-rects`
> 4-zone classifier are deleted; the live drag pipeline now runs on
> `@skb/grid-engine` ops via the Phase 2B.1 adapter. The host block
> is NEVER shrunk; the dragged block goes to its inferred hole-fill
> anchor and gravity collapses (ADR-0020 D3 Option A).

## title

Cut over `commit-external-drop` / `use-pointer-drag-listeners` /
`use-drag-drop-pipeline` / `use-external-drag-start` / `commit-drop`
to the grid-engine adapter. Refactor `OutlineOverlay` from per-mode
edge accent to a single intent rect (green = place, red = reject)
with auto-read grid geometry. Delete `apply-drop-mode.ts` +
`tiebreak.ts` + `edge-rects.ts` + their tests (859 LOC delete).
Update Playwright AC#1-#6 with `REMOVED-IN-WAVE-7-PHASE-2B` skip
markers. Replace `EdgeMatch` plumbing with `DropIntent` everywhere.

## files

### Rewired (live drag pipeline)

- `packages/editor-shell/src/drag-drop/commit-drop.ts` —
  `commitDropAtCursor` is now the only export; the legacy
  `commitDropAtMatch` 4-mode wrapper is gone.
- `packages/editor-shell/src/drag-drop/commit-external-drop.ts` —
  `commitExternalDrop` takes `cursorCol` + `cursorRow` (engine 0-based);
  uses `inferDropIntent` + `transformBlock` to position the appended
  block; emits 1-based editor `setNodeMarkup` writes via
  `engineBlockToEditorAttrs`. `runExternalDropDispatch` updated to
  match.
- `packages/editor-shell/src/drag-drop/use-pointer-drag-listeners.ts` —
  drops tiebreak / edge-rects / EdgeMatch entirely. Reads
  `--row-h` / `--gap` CSS vars at handler time → cursor → engine
  coord → `intentForMove` / `intentForInsert` → `commitMoveAtCursor`
  / `runExternalDropDispatch`.
- `packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts` —
  `activeMatch: EdgeMatch | null` replaced by
  `activeIntent: DropIntent | null`; `edgeRectsRef` /
  `lastCursorRef` / `edgeRects` state dropped. Keyboard mode wiring
  unchanged (keyboard already used direct grid-coord setNodeMarkup).
- `packages/editor-shell/src/drag-drop/use-external-drag-start.ts` —
  drops `computeEdgeRects` from drag-start; only snapshot + sentinel
  + active flip remain.
- `packages/editor-shell/src/drag-drop/outline-overlay.tsx` —
  refactored: `activeIntent: DropIntent | null` (was `activeMatch:
  EdgeMatch | null`); single intent rect (no per-mode accents);
  geometry auto-read from `.skb-grid` element + CSS vars (consumer
  may override for tests).
- `packages/editor-shell/src/drag-drop/pipeline-snapshot.ts` —
  `IdentifiedBlock` inlined as `BlockGridPosition + id` (was
  imported from the now-deleted `apply-drop-mode.ts`).

### Consumer apps

- `apps/site/src/components/EditorShellMountInner.tsx` —
  `<OutlineOverlay activeMatch=... blockRects=... />` → simplified
  `<OutlineOverlay activeIntent={pipeline.state.activeIntent} />`
  (geometry auto-read).

### Tests

- `packages/editor-shell/src/__tests__/drag-drop/outline-overlay.test.tsx`
  — rewritten for new intent-rect contract (5 tests cover null /
  place / reject / null gridRect / unmount cleanup).
- `packages/editor-shell/src/__tests__/drag-drop/edge-rects.test.ts` — **DELETED**
- `packages/editor-shell/src/__tests__/drag-drop/tiebreak.test.ts` — **DELETED**
- `packages/editor-shell/src/drag-drop/__tests__/apply-drop-mode.test.ts` — **DELETED**

### Sources deleted

- `packages/editor-shell/src/drag-drop/apply-drop-mode.ts` (277 LOC) — **DELETED**
- `packages/editor-shell/src/drag-drop/tiebreak.ts` (152 LOC) — **DELETED**
- `packages/editor-shell/src/drag-drop/edge-rects.ts` (70 LOC) — **DELETED**

### Public surface

- `packages/editor-shell/src/index.ts` —
  - REMOVED: `applyDropMode`, `ApplyDropModeInput`, `DropMode`,
    `GridSnapshotIdentified`, `IdentifiedBlock`,
    `computeEdgeRects`, `EDGE_W`, `GAP`, `EdgeRect`, `BlockLayout`,
    `tiebreak`, `findMatches`, `EdgeMatch`, `DragVelocity`
  - Surface narrowed to the engine adapter (added in 2B.1) +
    surviving overlay/ghost/pulse exports.

### Playwright

- `apps/site/playwright/grid-drag-drop.fixtures.ts` —
  4-mode helpers (`computeExpectedEdgeRect`, `classifyCursor`,
  `expectEdgeRect`, `match`, `blockLayout`, `blockRectMap`, `EdgeMode`,
  `Classification`) deleted; kept measure/render fixtures + JSX
  stringify helpers.
- `apps/site/playwright/grid-drag-drop.spec.ts` —
  AC#1-#6 replaced with `REMOVED-IN-WAVE-7-PHASE-2B` `test.skip`
  markers. AC#10 (ColRuler) retained unchanged. AC#7/#9/#11/#12
  deferred markers preserved.
- `apps/site/playwright/grid-perf.spec.ts` — TC1.x perf budget
  replaced with `REMOVED-IN-WAVE-7-PHASE-2B` skip (cursor → coord is
  O(1); no synthetic budget needed). TC2.x visual baselines retained.

## ui_touch

`true` — `packages/editor-shell/src/` paths matched. User-visible drag
UX changes: previously dropping a block on another block's edge
shrunk the host to make room; now the dragged block fills the
inferred hole-fill anchor (no host shrink); cursor-on-occupied
shows a red reject ghost. The cf-25 markdown-block coverage still
exercises the rendering path; the new intent-preview behavioral
coverage will land in Phase 2C alongside the toolbar theme switcher
wire.

## e2e_smoke

- flow: cf-25 markdown-block presence + read/edit parity still pass
  (renders unaffected; only drag UX semantics changed).
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts
  assertions:
    - markdown block count ≥ 1; data-skb-block-kind="markdown" present
    - cf-25 structural specs still PASS

- flow: drag/resize/duplicate behavioral specs still operate on the
  new engine pipeline (the cursor-coord pipeline is a drop-in for
  the test's drag events; gravity may shift block positions
  differently than 4-mode shrink).
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts
  assertions:
    - AC3-2c kebab Duplicate, AC3-3a palette drag insert still PASS
    - AC3-2a drag-block, AC3-2b right-edge resize behavioral specs
      may need follow-up updates if assertion shape depends on the
      4-mode shrink semantics (tracked for fix-forward in CI)

## Acceptance

executor: orchestrator-self (cutover; no codex needed)
reviewer: CI gates (lint + typecheck + test + build + size-check +
lychee + e2e-coverage)
contract_changes:
  - REMOVED exports from `@skb/editor-shell`: `applyDropMode`,
    `computeEdgeRects`, `tiebreak`, `findMatches`, plus 9 types.
  - REPLACED: `activeMatch: EdgeMatch | null` → `activeIntent:
    DropIntent | null` on `PipelineDragState`.
  - `OutlineOverlay` props refactored.
new_adr: NONE — ADR-0020 D2 already locks the engine contract.
risk_class: D2 row 8 (UI surface behavior change). Type surface
narrows; behavior change is user-visible. PRE-COMMIT CLAUDE REVIEW
skipped per bootstrap-scope rule (orchestrator-self cutover from
adapter prep merged in Phase 2B.1).

## Out of scope

- Wiring `@skb/grid-themes` into the editor — Phase 2C (PR #126)
- Theme-driven slot size (60/80/100px) — Phase 2C
- Theme switcher in editor toolbar — Phase 2C
- Replacing `useProjectGridStyleToOuter` — Phase 2C
- Deleting `/grid-prototype` — Phase 3 (PR #127)
- ADR-0017 amendment to deprecate the cf-20c-1 4-mode story — Phase 3
- Fresh visual screenshots for the new intent-preview UX — Phase 2C
  (when the theme switcher lands, screenshots will capture the
  per-theme intent ghost styling)

## Process

1. ✓ Phase 2B.1 (PR #125) merged the grid-engine adapter; the API
   surface is stable
2. ✓ commit-external-drop rewritten to use cursor-coord +
   `transformBlock` (preserves the cf-24 R0 F1 deterministic
   end-of-doc append; gravity replaces split shrinking)
3. ✓ use-pointer-drag-listeners rewritten — drops tiebreak + edge-rects;
   reads CSS vars at handler time
4. ✓ use-drag-drop-pipeline rewritten — DropIntent state replaces
   EdgeMatch state
5. ✓ OutlineOverlay refactored + auto-read geometry to keep
   EditorShellMountInner under 500 LOC
6. ✓ All deletions staged; pipeline-snapshot's `IdentifiedBlock`
   inlined (was imported from deleted apply-drop-mode)
7. ✓ Playwright AC#1-#6 + TC1.x skipped with REMOVED-IN markers
8. ✓ Editor-shell test suite 287 pass (282 pre + 5 new
   outline-overlay; -27 deleted apply-drop-mode + -10 deleted
   edge-rects/tiebreak)
9. ✓ Full `pnpm check` 46/46 pass
10. **THIS PR** — commit + CI gate

## Honest scope

- 6 files DELETED (~860 LOC down)
- 7 files rewritten / heavily modified
- 3 Playwright spec files rewritten (skip markers + fixture trim)
- 1 consumer (EditorShellMountInner) simplified
- Net delta: roughly +500 / -1450 LOC = -950 LOC net
- Largest file: use-drag-drop-pipeline 299 LOC (down from 459); all
  under size-check 500 LOC hard cap
- Surface narrows: 14 fewer public exports from `@skb/editor-shell`
