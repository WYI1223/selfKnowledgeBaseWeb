# Wave 7 Phase 2B.1 — grid-engine adapter (additive prep)

> Lays the foundation for Phase 2B.2 (full `applyDropMode` cutover)
> by adding the `@skb/grid-engine` ↔ Tiptap snapshot bridge in
> `packages/editor-shell` per [ADR-0020](../../decisions/ADR-0020-grid-engine-contract.md)
> D2. **Additive only** — no behavior change; existing 4-mode
> `applyDropMode` path stays live.

## title

Add `grid-engine-adapter.ts` to `packages/editor-shell` exposing
`toEngineState` (snapshot → GridState bridge with 1-based ↔ 0-based
col/row translation + grid-auto-flow row-packing for blocks missing
explicit row), `cursorToEngineCoord` (pixel cursor → engine
(col, row) clamped to bounds), `intentForMove` / `intentForInsert`
(grid-engine `inferDropIntent` wrappers), and `commitMoveAtCursor` /
`commitInsertAtCursor` (engine op → Tiptap setNodeMarkup batch). Also
export a NEW `commitDropAtCursor` from `commit-drop.ts` alongside the
existing `commitDropAtMatch`. 15 vitest contract tests cover the
adapter surface; the 4-mode `applyDropMode` path stays the live
pipeline pending Phase 2B.2.

## files

### Adapter (NEW)

- `packages/editor-shell/src/drag-drop/grid-engine-adapter.ts` —
  - `toEngineState(snapshot)` — Tiptap SerializedBlock[] → engine GridState
    with row-packing pass for blocks where `row === undefined`
  - `engineBlockToEditorAttrs(block)` — reverse translation for
    setNodeMarkup writes (engine 0-based → editor 1-based)
  - `cursorToEngineCoord(x, y, rect, oneFrPx, rowPx)` — pixel cursor →
    `{col, row}` clamped to engine bounds
  - `intentForMove(state, sourceId, cursorCol, cursorRow)` — drop intent
    for a MOVE op (source-removed baseline + size preserved)
  - `intentForInsert(state, kind, cursorCol, cursorRow)` — drop intent
    for a palette INSERT op
  - `commitMoveAtCursor(editor, snapshot, sourceId, col, row)` —
    transformBlock with gravity → setNodeMarkup batch
  - `commitInsertAtCursor(editor, snapshot, newId, kind, col, row)` —
    insertBlock with gravity → setNodeMarkup batch
  - `nodeNameToKind(nodeName)` — Tiptap node-name → BlockKind mapper

### commit-drop.ts surgical add

- `packages/editor-shell/src/drag-drop/commit-drop.ts` —
  - Keep `commitDropAtMatch` (4-mode `applyDropMode` path) byte-for-byte
  - Add `commitDropAtCursor` (grid-engine path) alongside

### Workspace wire

- `packages/editor-shell/package.json` — add `"@skb/grid-engine": "workspace:*"`
- `packages/editor-shell/tsconfig.json` — add `{ path: "../grid-engine" }`
- `packages/editor-shell/src/index.ts` — barrel-export the adapter surface

### Tests

- `packages/editor-shell/src/__tests__/drag-drop/grid-engine-adapter.test.ts`
  — 15 tests:
  - 4 `toEngineState` (explicit row, implicit row packing, node-name kind
    mapping, unknown name fallback)
  - 1 `engineBlockToEditorAttrs` reverse
  - 5 `cursorToEngineCoord` (top-left, row pitch, max-clamp, min-clamp,
    unbounded row growth)
  - 3 `intentForMove` (own area available, missing source, reject on overlap)
  - 2 `intentForInsert` (empty cell, occupied cell)

## ui_touch

`true` — file paths fall under `packages/editor-shell/src/` per
check-ui-touch.ts. But this PR is PURELY ADDITIVE: no consumer of the
adapter exists yet, so zero visual or behavior diff in the editor.
Existing cf-25 markdown-block coverage remains the regression test
for the live (applyDropMode) pipeline.

## e2e_smoke

- flow: existing drag/resize/duplicate flows on markdown blocks
  continue to operate via the live `applyDropMode` pipeline (cf-25
  behavioral coverage; this PR does not change the live path).
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks-behavior.spec.ts
  assertions:
    - AC3-2a/2b/2c (drag/resize/duplicate) still PASS
    - AC3-3a (palette drag insert) still PASS
    - No new public-surface call sites use commitDropAtCursor yet

## Acceptance

executor: orchestrator-self (additive prep; no codex needed)
reviewer: CI gates (lint + typecheck + test + build + size-check + lychee + e2e-coverage)
contract_changes:
  - NEW exports from `@skb/editor-shell`:
    `commitInsertAtCursor`, `commitMoveAtCursor`, `cursorToEngineCoord`,
    `engineBlockToEditorAttrs`, `intentForInsert`, `intentForMove`,
    `toEngineState`, `commitDropAtCursor`, `EngineCommitResult` type
  - NEW workspace dep: `@skb/grid-engine`
  - Existing `applyDropMode` / `commitDropAtMatch` exports unchanged
new_adr: NONE — ADR-0020 D2 already locks the engine contract; this PR
implements the bridge
risk_class: D2 row 1 (cross-module contract addition). Purely additive;
no consumers of the new surface in production code yet. PRE-COMMIT
CLAUDE REVIEW skipped per bootstrap-scope rule.

## Out of scope (deferred to Phase 2B.2 — next PR)

- Rewiring `commit-drop.ts` / `commit-external-drop.ts` /
  `use-pointer-drag-listeners.ts` / `use-drag-drop-pipeline.ts` /
  `keyboard-drag-mode.ts` to consume the adapter
- Replacing `EdgeMatch` / `tiebreak` / `edge-rects` 4-zone tracking
  with cursor → grid-coord helper
- Deleting `apply-drop-mode.ts` + `tiebreak.ts` + `edge-rects.ts` +
  their tests (~860 LOC)
- Updating Outline overlay + drag-ghost + drop-pulse for the new
  intent-based preview shape
- Updating Playwright AC#1-#5 (4-mode classification specs) with
  REMOVED-IN-WAVE-7-PHASE-2B markers
- UX user-visible behavior change (split-with-shrink → hole-fill
  placement)

## Process

1. ✓ Adapter signature designed to match the user-validated PR #121
   prototype pattern (cursor → coord → inferDropIntent → op)
2. ✓ 1-based ↔ 0-based col/row translation handled at the adapter
   boundary (ADR-0016 D2 editor convention vs ADR-0020 D1 engine convention)
3. ✓ grid-auto-flow row-packing pass for blocks missing explicit row
   (CSS analog; future setNodeMarkup will write back explicit rows)
4. ✓ 15 adapter contract tests pass
5. ✓ Full `pnpm check` 46/46 pass; no live-path regression
6. **THIS PR** — commit + CI gate

## Honest scope

5 files modified + 2 files created, ~+440 / -2 LOC net add.
- adapter source: 260 LOC
- adapter tests: 169 LOC
- commit-drop.ts: +30 LOC (commitDropAtCursor)
- package.json + tsconfig + index.ts: 4 lines
- Largest single file `grid-engine-adapter.ts` 263 LOC (well under 300
  soft warn / 500 hard fail)
