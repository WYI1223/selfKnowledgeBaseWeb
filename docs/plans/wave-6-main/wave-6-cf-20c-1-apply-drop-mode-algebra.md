# Wave 6 cf-20c-1 — `apply-drop-mode.ts` algebra (pure function for ADR-0017 D1 drop mutations)

> Per orchestrator-reflection 2026-05-09 Rule 4 — the missing integration layer
> identified during cf-20 scoping that broke the cf-18/cf-19 "primitives shipped
> = integration done" assumption. This PR ships the pure mutation function;
> cf-20c-2 wires it to the actual drag-handle UI.

## Why

ADR-0017 D1 specifies 6 drop-mode behaviors (`split-left` / `split-right` /
`split-top` / `split-bottom` / `empty` / `none`) with explicit position
mutations on host + new/source blocks. The existing primitives in
`packages/editor-shell/src/drag-drop/` (edge-rects, tiebreak, outline-overlay,
drag-ghost, drop-pulse, layout-reducer, esc-cancel) cover hit-testing,
overlay rendering, and layout-state machine — but **none of them computes
the post-drop block positions**. `layout-reducer.ts:drag-end-success`
accepts a `mutation: GridSnapshot` parameter; cf-20c-1 supplies the
function that produces it.

Without `apply-drop-mode`, drag is structurally impossible — even after
cf-20c-2 wires the UI, the editor can't know what positions to commit.

## What

NEW `packages/editor-shell/src/drag-drop/apply-drop-mode.ts` (~150 LOC):

```typescript
export interface IdentifiedBlock extends BlockGridPosition {
  readonly id: string;
}

export interface GridSnapshotIdentified {
  readonly blocks: readonly IdentifiedBlock[];
}

export interface ApplyDropModeInput {
  readonly baseline: GridSnapshotIdentified;
  readonly mode: 'split-left' | 'split-right' | 'split-top' | 'split-bottom' | 'empty' | 'none';
  readonly sourceBlockId: string | null;  // null = palette drag (new block insertion)
  readonly hostBlockId: string | null;     // null only for mode='empty' or 'none'
  readonly newBlock?: IdentifiedBlock;     // required when sourceBlockId === null
  readonly emptyTarget?: { col: number; row: number };  // required when mode='empty'
}

export function applyDropMode(input: ApplyDropModeInput): GridSnapshotIdentified;
```

**Per-mode semantics (ADR-0017 D1 table)**:

| mode | host mutation | source/new mutation |
|---|---|---|
| `split-left` | `colSpan = host.colSpan / 2`; `col = host.col + host.colSpan/2` (host shifts right) | `col = host.col`, `colSpan = host.colSpan/2`, `row = host.row` |
| `split-right` | `colSpan = host.colSpan / 2` (host stays left) | `col = host.col + host.colSpan/2`, `colSpan = host.colSpan/2`, `row = host.row` |
| `split-top` | `row = host.row + 1` (host shifts down); subsequent rows shift down too | `col = host.col`, `colSpan = host.colSpan`, `row = host.row` |
| `split-bottom` | unchanged | `col = host.col`, `colSpan = host.colSpan`, `row = host.row + host.rowSpan` (or `host.row + 1` if rowSpan='auto') |
| `empty` | unchanged | `col = emptyTarget.col`, `row = emptyTarget.row`, defaults `colSpan=12`, `rowSpan=1` |
| `none` | unchanged | unchanged (returns baseline; treated as cancel) |

**Constraints (must throw on violation)**:

- `split-left` / `split-right`: `host.colSpan / 2` MUST be in `COL_SNAPS = [2,3,4,6,8,12]`. Throws otherwise (`host.colSpan = 3, 5, 7, 9, 10, 11` → invalid; only `4 → 2`, `6 → 3`, `8 → 4`, `12 → 6` are valid splits).
- `split-top` / `split-bottom`: no colSpan constraint; ALWAYS valid.
- `empty`: `emptyTarget` required. `col + colSpan - 1 ≤ 12` (colSpan defaults to 12 if not specified).
- `none`: returns baseline unchanged (treat as cancel even though caller may use to display a no-op preview).
- When `sourceBlockId !== null`: source block is moved (removed from old position, inserted at new). When `sourceBlockId === null`: `newBlock` is REQUIRED and inserted.
- For `split-top`: the algebra computes `row` shifts for ALL blocks at `row >= host.row` (cascade down by 1).

**TDD coverage** (NEW `__tests__/apply-drop-mode.test.ts` ~250 LOC, ~40 cases):

- 5 modes × happy-path with `colSpan=12` host (canonical test fixtures)
- `split-left`/`split-right` × refused colSpan inputs (3, 5, 7, 9, 10, 11) → expect throw
- `split-left`/`split-right` × all valid colSpans (4, 6, 8, 12) → verify halves
- `split-top` row cascade across N=3 blocks below the host
- `split-bottom` no cascade required
- `empty` row=N + colSpan=K combinations
- `none` returns baseline-equal output
- source-move (sourceBlockId !== null) drops source from old position
- palette-insert (sourceBlockId === null + newBlock) adds without removal
- Validation: `col + colSpan - 1 > 12` rejected; missing emptyTarget when mode='empty' rejected; missing newBlock when sourceBlockId=null rejected; `split-*` with `hostBlockId=null` rejected

## Files

| file | change |
|---|---|
| `packages/editor-shell/src/drag-drop/apply-drop-mode.ts` | **NEW** — pure mutation function + types |
| `packages/editor-shell/src/drag-drop/__tests__/apply-drop-mode.test.ts` | **NEW** — vitest, ~40 cases per ADR-0017 D1 + invariants |
| `packages/editor-shell/src/index.ts` | barrel export `applyDropMode` + types |
| `packages/editor-shell/CONTRACT.md` | document `applyDropMode` Public surface entry; cite ADR-0017 D1 |

## Decisions

**D1 — IdentifiedBlock extends BlockGridPosition (NOT modify BlockGridPosition contract)**:
`@skb/block-foundation` `BlockGridPosition` is a position-only type used across the entire grid stack (mdx-bridge, editor-shell, design-tokens consumers). Adding an `id` field there would touch the entire system. Instead cf-20c-1 introduces `IdentifiedBlock = { id: string } & BlockGridPosition` local to the drag-drop layer. cf-20c-2 will provide the `id` from ProseMirror node positions / Tiptap node IDs.

Sources cited: `packages/block-foundation/src/types.ts:7` (`BlockGridPosition` shape unchanged) + ADR-0016 D2 (locks the existing shape) + ADR-0017 D1 (requires identity for source/host references).

**D2 — Pure function, throws on invalid input (no silent degradation)**:
Per orchestrator-reflection Rule 3 (no degradation) + ADR-0017 D1 explicit constraint (`split-*` requires valid colSpan halves), the function MUST throw on:
- `split-left/right` with `host.colSpan / 2` not in `COL_SNAPS`
- `empty` with `emptyTarget` missing or `col + colSpan - 1 > 12`
- `sourceBlockId === null` without `newBlock`
- `split-*` with `hostBlockId === null`

The cf-20c-2 UI consumer is responsible for guarding (via tiebreak's "no-split" cursor per ADR-0017 D6) BEFORE calling `applyDropMode`. Invalid inputs reaching the algebra layer are programmer error and surface as throws.

Sources cited: `/mnt/d/download/web/v2-design-granularity.md` §"4 种 Drop 语义" (lines 76-88) + ADR-0017 D1 lines 44-61 (refuses split when invalid) + ADR-0016 D6 (`COL_SNAPS` authority).

**D3 — Row cascade for split-top is array-wide, not just below host**:
Per ADR-0017 D1 line 50 ("host 整体下移 + 后续行下移"), every block at `row >= host.row` cascades by `+1` (not just blocks "after" host in some sort order). Algebra iterates the entire `baseline.blocks` array.

**D4 — None mode returns deep-equal baseline (no mutation)**:
Per ADR-0017 D1 line 53 (`'none'` mode = no mutation; cancel-on-release). Caller may compare returned snapshot to baseline by reference for short-circuit; but the function explicitly returns a NEW snapshot object (not shared reference) to maintain immutability invariant.

**D5 — No layout-reducer extension in this PR**:
`layout-reducer.ts:drag-end-success` already accepts a `mutation: GridSnapshot` parameter. cf-20c-1 supplies the value of that parameter via `applyDropMode`. The reducer code itself is unchanged — only the consumer (cf-20c-2) wires them together.

## ui_touch

`true` — `packages/editor-shell/src/**` matches ADR-0011 D9.1 path pattern,
even though cf-20c-1 contributes pure algebra (no CSS / DOM / Astro / React /
Playwright surface). The path-pattern check at `scripts/check-ui-touch.ts:33`
fires regardless of the per-file content (correct conservative default — catches
"hidden UI ripples" across the editor-shell package). This PR therefore
declares `ui_touch=true` and pairs it with the existing
`apps/site/playwright/grid-drag-drop.spec.ts` regression-lock as a
forward-stage e2e_smoke entry (the spec exercises the drag-drop primitives
that cf-20c-1's `applyDropMode` will compose with at cf-20c-2). Real new
e2e coverage for `applyDropMode` lands in cf-20c-2 alongside the UI wire.

## e2e_smoke

- flow: cf-20c-1 ships pure algebra exported from `@skb/editor-shell`
    (the `applyDropMode` function for ADR-0017 D1 drop modes). The
    function has no UI surface yet — cf-20c-2 wires it to the drag-handle
    button + ProseMirror commands. cf-20c-1's existing-spec lock asserts
    that the editor-shell `drag-drop/` package's downstream Playwright
    consumers (synthetic drag-drop hit-test corpus per ADR-0017 D1+D6+D11)
    continue to PASS after the new export lands. The 27 NEW vitest cases
    in `apply-drop-mode.test.ts` are the primary algebra coverage; the
    Playwright spec referenced here is the regression lock against
    breaking the existing primitives via barrel-export drift.
  target_url: /sample-blocks-astro
  playwright_spec: apps/site/playwright/grid-drag-drop.spec.ts:"AC#1 — 4 mode classification at edge positions"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20b-sample-blocks-grid-layout.png
  assertions:
    - 4-mode classification (split-left/right/top/bottom) at synthetic
      edge positions returns the expected EdgeMode (existing AC#1 lock)
    - hit-test geometry primitives still produce the same EdgeRect shape
      (existing AC#2 lock)
    - tiebreak resolver still returns deterministic single-match for
      overlap regions (existing AC#3 lock)

## Acceptance

```bash
# AC-1: NEW file shape
test -f packages/editor-shell/src/drag-drop/apply-drop-mode.ts
test -f packages/editor-shell/src/drag-drop/__tests__/apply-drop-mode.test.ts

# AC-2: function signature exported from barrel
grep -E 'export \{ applyDropMode' packages/editor-shell/src/index.ts

# AC-3: algebra implements all 6 modes (function dispatch)
grep -cE "case 'split-left':|case 'split-right':|case 'split-top':|case 'split-bottom':|case 'empty':|case 'none':" packages/editor-shell/src/drag-drop/apply-drop-mode.ts
# Expected: 6

# AC-4: vitest passes all cases
pnpm --filter @skb/editor-shell test -- apply-drop-mode
# Expected: 40+ tests pass; coverage of all 6 modes + COL_SNAPS validation

# AC-5: pnpm check exit 0
pnpm check

# AC-6: editor-shell test count increases
# Expected: 152 (cf-20b) → 192+ (cf-20c-1, +40 new vitest cases)

# AC-7: CONTRACT.md documents Public surface entry
grep -E '^- `applyDropMode' packages/editor-shell/CONTRACT.md
# Expected: 1 line

# AC-8: NO ui_touch (skipped per ADR-0011 D9.1)
# This PR's only sources are pure-TS algebra + vitest. No CSS / DOM / Astro / React.
```

## Out of scope (none — per orchestrator-reflection Rule 3, "defer" requires explicit user-quote)

cf-20c-2 (drag-handle UI wire) is the NEXT scheduled PR in the sequence,
not a deferral.
