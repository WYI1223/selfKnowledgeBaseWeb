# C.2-2 — block-foundation BlockUIDefinition grid 字段 + grid-math.ts helpers

> **Wave 5 Stage C.2 2nd implementation PR** of the locked 12-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.0 §469-481). Lands the **W5-1 primary
> authority** types + helpers in `@skb/block-foundation`: `BlockGridPosition`
> interface, `COL_SNAPS` const, `proseGridDefaults` const, the 3 optional
> `BlockUIDefinition` grid fields (`gridDefault?` / `rowSpanSemantic?` /
> `gridKind?`), and `grid-math.ts` (5 helpers + `GridGeometry` interface +
> `DEFAULT_GRID_GEOMETRY` const) per ADR-0016 D2 / D6 / D9 / D10. The W5-1
> invariant prose itself was landed at Pre-A2 (ADR-0016 ratification merge)
> — `packages/block-foundation/CONTRACT.md` L30 already references the
> NOT-yet-existing types this PR materialises; **this PR does NOT touch
> the W5-1 prose lines** (Pre-A2 lock; AC#10 enforces zero diff on those
> lines). The `## Public surface` section at L3-17 IS extended (additive)
> to list the new types/helpers per ADR-0006 D8 sister-doc-sync. **PRE-COMMIT
> CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger judgment` (Row 1
> CONTRACT.md public surface change + Row 5 boundary contract change consumed
> by downstream `apps/site` Astro renderer / `@skb/editor-shell` grid
> container / `@skb/heavy-block-boundary` v0.5 amendment in C.2-3 / C.2-4 /
> C.2-7).

## title

Materialise the W5-1 / ADR-0016 D10 grid type primitives + helpers as the
single authoritative source in `@skb/block-foundation`. Specifically:

1. Extend the existing generic `BlockUIDefinition` interface (parameter
   `TSchema extends ZodTypeAny`) in
   `packages/block-foundation/src/registry.ts` with **3 optional fields**:
   `gridDefault?: BlockGridPosition` (per ADR-0016 D2 — initial col / row /
   colSpan / rowSpan defaults consumed by editor-shell on block insert),
   `rowSpanSemantic?: 'auto' | 'integer'` (per ADR-0016 D3 asymmetry —
   `'auto'` = markdown rendering-derived, `'integer'` = persisted user-set,
   default `'integer'` for backward compat), and
   `gridKind?: 'prose' | 'component' | 'render' | 'viz'` (per ADR-0016 D10
   Q7 absorbtion — replaces the fragile `mdxComponent === 'Markdown'`
   heuristic with a structural enum query for grid serialize/parse path
   decisions; default = mirror of `BlockKind`, runtime mirror logic deferred
   to C.2-4 consumer wiring).
2. Create NEW `packages/block-foundation/src/types.ts` housing the grid
   type primitives that are NOT bound to `BlockUIDefinition`:
   `BlockGridPosition` interface (`col` / `row?` / `colSpan` / `rowSpan`
   per ADR-0016 D2), `COL_SNAPS = [2, 3, 4, 6, 8, 12] as const` (per ADR-0016
   D2 + D6 1/6 / 1/4 / 1/3 / 1/2 / 2/3 / full snap ladder), `BlockGridKind`
   + `RowSpanSemantic` type aliases (re-used by `BlockUIDefinition`'s 3
   new fields), and `proseGridDefaults` const (per ADR-0016 D10 Q8
   absorbtion — `{rowSpanSemantic: 'auto', gridKind: 'prose',
   defaultColSpan: 12}` for prose-path consumers).
3. Create NEW `packages/block-foundation/src/grid-math.ts` housing 5
   helpers + `GridGeometry` interface + `DEFAULT_GRID_GEOMETRY` const,
   centralising the W5-1 numeric formulas so consumers don't re-derive
   `row-h=48 / gap=14 / totalCols=12` constants (per ADR-0006 class 5
   algorithm-replication audit). Helpers: `effectiveCellHeight(rowSpan,
   geometry?)`, `effectiveColWidth(colSpan, containerWidth, geometry?)`,
   `effectiveRowSpan(rowSpan, autoIntegerHint)`,
   `validateGridPosition(pos, totalCols?)`, and
   `isAutoRowSpan(uiDef)`. JSDoc on each helper cites the authoritative
   ADR-0016 D-list anchor.
4. Re-export the new types + helpers from `packages/block-foundation/src/index.ts`
   barrel so consumers import them as `@skb/block-foundation` (NOT a
   subpath); this is the LOCKED public-surface decision (forward-pointer
   note: a future refactor PR may relocate `BlockUIDefinition` from
   `registry.ts` to `types.ts` if registry.ts grows; out of C.2-2 scope —
   see `## Risk register` row 3).
5. Extend `packages/block-foundation/CONTRACT.md` `## Public surface`
   (L3-17) — additive only — to list the new types / consts / helpers /
   optional fields; W5-1 invariant prose at L30 is **NOT** modified
   (Pre-A2 lock; AC#10 verifies).

NEW vitest suite `grid-math.test.ts` covers the 5 helpers + the
`DEFAULT_GRID_GEOMETRY` const + the W5-1 numeric formula assertions
(rowSpan=1 → 48, rowSpan=2 → 110, rowSpan=6 → 358, colSpan=12 →
container-width, valid + invalid `BlockGridPosition` cases, `isAutoRowSpan`
truth-table, etc.). Type-level coverage of `BlockGridPosition` shape +
`COL_SNAPS` const-as-literal + `proseGridDefaults` shape folds into the
existing `registry.test.ts` (no new test file for the type primitives —
they're trivial value asserts; reduces test sprawl).

The 8 `@skb/block-*` packages and `@skb/heavy-block-boundary` are NOT
touched — actual `gridDefault` / `rowSpanSemantic` / `gridKind` adoption
on each block's `defineUI(...)` call lands at C.2-3 (Astro renderer
consumes) / C.2-4 (editor-shell consumes) / C.2-7 (heavy-boundary v0.5
amendment) per Wave 5 plan v1.0 row schedule. mdx-bridge is also NOT
touched — it has its own duplicate `COL_SNAPS = [2, 3, 4, 6, 8, 12] as const`
at `serialize.ts` L50 + `parse.ts` L57 from C.2-1 (just merged); the
**byte-equivalent literal** is preserved here as block-foundation's
authority going forward, but the mdx-bridge migration to `import { COL_SNAPS }
from '@skb/block-foundation'` is deferred to C.2-3 / C.2-4 (consumer
refactor windows where mdx-bridge already changes; reduces in-flight diff
churn — see `## Risk register` row 1).

LOCKED implementation path: **path (a) co-located minimal touch** —
`BlockUIDefinition` stays in `registry.ts`; only the 3 grid fields are
added inline. NEW `types.ts` houses NEW grid primitives only.
Path (b) (relocate `BlockUIDefinition` to `types.ts`) is **EXPLICITLY
FORBIDDEN** in this PR; reason in `## Risk register` row 3.

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

8 canonical files at PLAN time. NO `package.json` / `pnpm-lock.yaml`
change (no new deps; pure type + math helpers). NO new ADR file (D2
row 4 NOT hit; ADR-0016 already authorises the entire surface). NO change
to the 8 `@skb/block-*` packages (consumer wiring lands at C.2-3 / C.2-4).
NO change to `@skb/mdx-bridge` (COL_SNAPS unification deferred to C.2-3 /
C.2-4 — see `## Risk register` row 1). NO change to `apps/site/**`
(C.2-3 scope; Astro renderer grid layout). NO change to
`@skb/heavy-block-boundary` (C.2-7 scope; ADR-0014 v0.5 amendment).
NO change to `@skb/editor-shell` (C.2-4 scope). PR.md self-listed.

- `packages/block-foundation/src/registry.ts` — **MODIFIED** (~12-18
  LOC net delta). Add 3 optional grid fields to existing
  generic `BlockUIDefinition` interface (parameter `TSchema`;
  currently L29-36); imports
  `BlockGridPosition` + `BlockGridKind` + `RowSpanSemantic` from
  `./types` (forward import — types.ts is created in this same PR;
  pnpm typecheck will resolve via tsconfig path mapping). The 3 fields
  appended after `RenderView` line; JSDoc on each cites ADR-0016 D2 /
  D3 / D10. NO other changes — `BlockCoreDefinition`, `BlockKind`,
  `BlockViewProps`, `defineCore`, `defineUI`, `BlockRegistry` class
  ALL UNCHANGED. Path (a) co-located lock means `BlockUIDefinition`
  itself does not move.

- `packages/block-foundation/src/types.ts` (**NEW**, ~55-75 LOC). Houses
  grid type primitives:
  - `BlockGridPosition` interface (`col: number` 1-based; `row?: number`
    1-based optional; `colSpan: number` ∈ COL_SNAPS; `rowSpan: number |
    'auto'` integer ≥ 1 OR literal `'auto'` per D3 asymmetry); JSDoc
    cites ADR-0016 D2.
  - `COL_SNAPS = [2, 3, 4, 6, 8, 12] as const` — byte-equivalent literal
    to mdx-bridge `serialize.ts` L50 + `parse.ts` L57 (transitional dual
    source per Risk row 1); JSDoc cites ADR-0016 D2 + D6 + lists the
    1/6 / 1/4 / 1/3 / 1/2 / 2/3 / full responsive ratio mapping.
  - `BlockGridKind = 'prose' | 'component' | 'render' | 'viz'` type
    alias (parallel to `BlockKind` from `registry.ts`; explicitly NOT
    re-importing `BlockKind` to keep types.ts independent — JSDoc notes
    "MUST stay structurally identical to BlockKind; runtime mirror at
    C.2-4").
  - `RowSpanSemantic = 'auto' | 'integer'` type alias.
  - `proseGridDefaults` const (`{rowSpanSemantic: 'auto' as const,
    gridKind: 'prose' as const, defaultColSpan: 12}`) per ADR-0016 D10
    Q8 absorbtion; JSDoc cites the consumer story (editor-shell C.2-4
    + mdx-bridge C.2-3 / C.2-4).

- `packages/block-foundation/src/grid-math.ts` (**NEW**, ~95-115 LOC).
  Houses W5-1 numeric helpers:
  - `GridGeometry` interface (`rowH: number` / `gap: number` /
    `totalCols: number`).
  - `DEFAULT_GRID_GEOMETRY: GridGeometry = {rowH: 48, gap: 14,
    totalCols: 12} as const`. JSDoc forward-pointer: "Wave 5 Stage C.3
    may switch to design-tokens-derived constants per ADR-0016 D9; until
    then these literals are the authority."
  - `effectiveCellHeight(rowSpan: number, geometry?:
    Partial<GridGeometry>): number` — formula `rowSpan * rowH +
    (rowSpan - 1) * gap`; W5-1 prose at CONTRACT.md L30 is the spec.
  - `effectiveColWidth(colSpan: number, containerWidth: number,
    geometry?: Partial<GridGeometry>): number` — formula
    `colSpan * (1fr) + (colSpan - 1) * gap` where
    `1fr = (containerWidth - (totalCols - 1) * gap) / totalCols`.
  - `effectiveRowSpan(rowSpan: number | 'auto', autoIntegerHint:
    number): number` — returns `autoIntegerHint` iff
    `rowSpan === 'auto'`, else returns `rowSpan` as-is. Consumed by
    editor-shell `useAutoRowSpan` hook at C.2-4.
  - `validateGridPosition(pos: BlockGridPosition, totalCols?: number):
    void` — throws `Error` with descriptive message on
    `col < 1 || col + colSpan - 1 > totalCols ||
    !COL_SNAPS.includes(colSpan) || (typeof rowSpan === 'number' &&
    rowSpan < 1)`. Per ADR-0016 D7 explicit-invalid-throws is consistent
    across mdx-bridge + block-foundation.
  - `isAutoRowSpan(uiDef: Pick<BlockUIDefinition, 'rowSpanSemantic' |
    'gridKind'>): boolean` — returns `uiDef.rowSpanSemantic === 'auto'
    || uiDef.gridKind === 'prose'`; per ADR-0016 D10 helper spec.

  Imports: `BlockGridPosition` + `COL_SNAPS` from `./types`;
  `BlockUIDefinition` from `./registry` (only for the
  `Pick<BlockUIDefinition, ...>` parameter on `isAutoRowSpan` — circular
  module-graph caveat: registry.ts imports types.ts (for the 3 grid
  fields), grid-math.ts imports both registry.ts + types.ts. No cycle
  (registry.ts does NOT import grid-math.ts).

- `packages/block-foundation/src/index.ts` — **MODIFIED** (~5-10 LOC
  net delta). Extends barrel from current 2-line state
  (`export * from './registry'; export { proseExtensions } from
  './prose';`) to also re-export new types + helpers. Concretely:
  `export * from './types';` (forwards `BlockGridPosition` /
  `COL_SNAPS` / `BlockGridKind` / `RowSpanSemantic` /
  `proseGridDefaults`) and `export * from './grid-math';` (forwards
  `GridGeometry` / `DEFAULT_GRID_GEOMETRY` / 5 helpers). Single barrel
  consumer story locked (no subpath publishing — `@skb/block-foundation`
  package.json `exports` field is unchanged; one entry point).

- `packages/block-foundation/CONTRACT.md` — **MODIFIED** (~25-35 LOC
  net delta). Extend `## Public surface` (L3-17) by adding bullet
  entries (additive; existing bullets UNCHANGED order):
  - `BlockGridPosition` interface (per ADR-0016 D2; new in Wave 5 C.2-2)
  - `COL_SNAPS` const literal `[2, 3, 4, 6, 8, 12]` (per ADR-0016 D2 +
    D6; transitional dual source with mdx-bridge until C.2-3 / C.2-4
    unify)
  - `BlockGridKind` / `RowSpanSemantic` type aliases
  - `proseGridDefaults` const (per ADR-0016 D10 Q8)
  - `BlockUIDefinition.gridDefault?` / `.rowSpanSemantic?` /
    `.gridKind?` optional fields
  - `GridGeometry` interface + `DEFAULT_GRID_GEOMETRY` const
  - 5 grid-math helpers (`effectiveCellHeight`, `effectiveColWidth`,
    `effectiveRowSpan`, `validateGridPosition`, `isAutoRowSpan`) with a
    one-line description each + ADR-0016 D-list back-reference
  W5-1 invariant at L30 — **UNTOUCHED**; AC#10 verifies via
  `git diff origin/main -- packages/block-foundation/CONTRACT.md |
  grep -F 'W5-1' | wc -l` returning `0`. Existing
  `## Modifying this file` clause (L52-56) already covers optional-field
  changes requiring an ADR — ADR-0016 is the authorising ADR (cited
  inline next to the new bullets); rule satisfied.

- `packages/block-foundation/src/__tests__/grid-math.test.ts` (**NEW**,
  ~85-105 LOC, ~18-22 assertions). Covers all 5 helpers exhaustively:
  - `effectiveCellHeight`: rowSpan=1 → 48, rowSpan=2 → 110 (= 2*48 +
    1*14), rowSpan=6 → 358 (= 6*48 + 5*14), rowSpan=3 → 172 (= 3*48 +
    2*14); custom-geometry override (rowH=64, gap=10) sanity case.
  - `effectiveColWidth`: containerWidth=1200 (post-gap-strip 1fr =
    (1200 - 11*14) / 12 ≈ 87.17), colSpan=12 → 1200 (full-width invariant
    — `colSpan*(1fr) + (colSpan-1)*gap = 12*((1200-154)/12) + 11*14 =
    1046 + 154 = 1200`), colSpan=6 → 593 (= 6 * 87.17 + 5*14, ±0.5
    floating tolerance), colSpan=2 → 188 (= 2 * 87.17 + 1*14).
  - `effectiveRowSpan`: `'auto'` + hint=4 → 4; integer 3 + hint=99 → 3;
    integer 1 + hint=0 → 1.
  - `validateGridPosition`: valid `{col:1, colSpan:12, rowSpan:1}`
    no-throw; valid `{col:5, colSpan:8, rowSpan:'auto'}` no-throw;
    invalid `{col:0, ...}` throws; invalid `{col:1, colSpan:5, ...}`
    (5 ∉ COL_SNAPS) throws; invalid `{col:6, colSpan:8, ...}` (col +
    colSpan - 1 = 13 > 12) throws; invalid `{col:1, colSpan:12,
    rowSpan:0}` throws.
  - `isAutoRowSpan`: `{rowSpanSemantic: 'auto'}` → true;
    `{gridKind: 'prose'}` → true; `{rowSpanSemantic: 'integer',
    gridKind: 'component'}` → false; `{}` (both undefined) → false.
  - `DEFAULT_GRID_GEOMETRY` literal-equality assert
    (`{rowH: 48, gap: 14, totalCols: 12}`).
  - `COL_SNAPS` byte-equal literal assert
    (`[2, 3, 4, 6, 8, 12]`) — guards against accidental edit drift
    from mdx-bridge dual-source.
  - `proseGridDefaults` shape assert (`{rowSpanSemantic: 'auto',
    gridKind: 'prose', defaultColSpan: 12}`).

- `packages/block-foundation/src/__tests__/registry.test.ts` —
  **MODIFIED** (~10-15 LOC net delta). Append 1-2 type-level assertions
  for the new optional `BlockUIDefinition` grid fields:
  - `defineUI({...calloutUIDefault, gridDefault: {col:1, colSpan:12,
    rowSpan:1}})` — round-trip the full literal; assert
    `result.gridDefault.col === 1`, `.colSpan === 12`, `.rowSpan === 1`.
  - `defineUI({...calloutUIDefault, rowSpanSemantic: 'auto', gridKind:
    'prose'})` — assert the 2 fields are preserved.
  - Existing 12 registry tests UNCHANGED; defensive-copy / duplicate-
    register / multi-UI invariants all PASS.

- `docs/plans/wave-5-main/C.2-2-block-foundation-grid.md` (**NEW**,
  this PR.md). Self-listed.

NO `pnpm-lock.yaml` change (no new dependency). NO `package.json` change
(no `exports` field update; barrel-only re-export). NO `tsconfig.json`
change (existing `references` already covers self).

## test_cases

TDD-front order (codex-generic-executor): write failing `grid-math.test.ts`
first → write `types.ts` (compile-time RED resolves) → write `grid-math.ts`
(test cases turn GREEN one-by-one) → extend `registry.ts` BlockUIDefinition
fields → extend `index.ts` barrel → append registry.test.ts cases → write
CONTRACT.md.

### TC-1 — `effectiveCellHeight(1)` → 48 (W5-1 base case)

- input: `effectiveCellHeight(1)` (no geometry override; uses DEFAULT)
- expected: `48` (= 1*48 + 0*14)
- location: `packages/block-foundation/src/__tests__/grid-math.test.ts`
  describe block "effectiveCellHeight"

### TC-2 — `effectiveCellHeight(2)` → 110 (W5-1 multi-row gap case)

- input: `effectiveCellHeight(2)`
- expected: `110` (= 2*48 + 1*14)
- location: same file, same describe

### TC-3 — `effectiveCellHeight(6)` → 358 (W5-1 AgentFlow exemplar from CONTRACT.md L30)

- input: `effectiveCellHeight(6)`
- expected: `358` (= 6*48 + 5*14); matches the literal `358` cited in
  the existing W5-1 invariant prose line in CONTRACT.md L30 (Pre-A2 lock)
- location: same file, same describe

### TC-4 — `effectiveCellHeight(3)` → 172 (W5-1 mid-range case)

- input: `effectiveCellHeight(3)`
- expected: `172` (= 3*48 + 2*14)
- location: same file, same describe

### TC-5 — `effectiveCellHeight(2, {rowH: 64, gap: 10})` → 138 (custom geometry)

- input: `effectiveCellHeight(2, {rowH: 64, gap: 10})`
- expected: `138` (= 2*64 + 1*10)
- location: same file, same describe

### TC-6 — `effectiveColWidth(12, 1200)` → 1200 (full-width invariant)

- input: `effectiveColWidth(12, 1200)` (DEFAULT geometry: gap=14, totalCols=12)
- expected: `1200` (W5-1 invariant: colSpan=12 → containerWidth exactly,
  modulo floating-point tolerance ≤ 0.5)
- location: same file, describe block "effectiveColWidth"

### TC-7 — `effectiveColWidth(6, 1200)` → ~593 (half-width)

- input: `effectiveColWidth(6, 1200)`
- expected: `593` (±0.5; = 6 * ((1200 - 11*14) / 12) + 5*14 = 6 * 87.1667 + 70 = 593)
- location: same file, same describe

### TC-8 — `effectiveColWidth(2, 1200)` → ~188 (1/6 width)

- input: `effectiveColWidth(2, 1200)`
- expected: `188` (±0.5; = 2 * 87.1667 + 1*14 = 188.33)
- location: same file, same describe

### TC-9 — `effectiveRowSpan('auto', 4)` → 4 (auto path)

- input: `effectiveRowSpan('auto', 4)`
- expected: `4`
- location: same file, describe block "effectiveRowSpan"

### TC-10 — `effectiveRowSpan(3, 99)` → 3 (integer pass-through)

- input: `effectiveRowSpan(3, 99)`
- expected: `3` (integer wins; hint ignored)
- location: same file, same describe

### TC-11 — `validateGridPosition({col:1, colSpan:12, rowSpan:1})` no-throw

- input: `validateGridPosition({col:1, colSpan:12, rowSpan:1})`
- expected: no throw (full-width row=auto-place valid case)
- location: same file, describe block "validateGridPosition"

### TC-12 — `validateGridPosition({col:5, colSpan:8, rowSpan:'auto'})` no-throw

- input: `validateGridPosition({col:5, colSpan:8, rowSpan:'auto'})`
- expected: no throw (col + colSpan - 1 = 12 ≤ 12; rowSpan='auto' valid
  regardless of position)
- location: same file, same describe

### TC-13 — `validateGridPosition({col:0, colSpan:12, rowSpan:1})` throws

- input: `validateGridPosition({col:0, colSpan:12, rowSpan:1})`
- expected: throws `Error` with `/col.*1.*based|col < 1/i` message
- location: same file, same describe

### TC-14 — `validateGridPosition({col:1, colSpan:5, rowSpan:1})` throws (5 ∉ COL_SNAPS)

- input: `validateGridPosition({col:1, colSpan:5, rowSpan:1})`
- expected: throws `Error` with `/COL_SNAPS|colSpan/i` message
- location: same file, same describe

### TC-15 — `validateGridPosition({col:6, colSpan:8, rowSpan:1})` throws (overflow)

- input: `validateGridPosition({col:6, colSpan:8, rowSpan:1})` (6 + 8 - 1 = 13 > 12)
- expected: throws `Error` with `/overflow|exceeds.*12/i` message
- location: same file, same describe

### TC-16 — `validateGridPosition({col:1, colSpan:12, rowSpan:0})` throws

- input: `validateGridPosition({col:1, colSpan:12, rowSpan:0})`
- expected: throws `Error` with `/rowSpan.*1|rowSpan < 1/i` message
- location: same file, same describe

### TC-17 — `isAutoRowSpan({rowSpanSemantic: 'auto'})` → true

- input: `isAutoRowSpan({rowSpanSemantic: 'auto'})`
- expected: `true`
- location: same file, describe block "isAutoRowSpan"

### TC-18 — `isAutoRowSpan({gridKind: 'prose'})` → true

- input: `isAutoRowSpan({gridKind: 'prose'})`
- expected: `true`
- location: same file, same describe

### TC-19 — `isAutoRowSpan({rowSpanSemantic: 'integer', gridKind: 'component'})` → false

- input: `isAutoRowSpan({rowSpanSemantic: 'integer', gridKind: 'component'})`
- expected: `false`
- location: same file, same describe

### TC-20 — `isAutoRowSpan({})` → false (defaults)

- input: `isAutoRowSpan({})` (both undefined)
- expected: `false` (defensive default; per JSDoc `rowSpanSemantic`
  default = `'integer'` and `gridKind` mirror is non-prose by definition
  for non-prose blocks; both undefined treated as false)
- location: same file, same describe

### TC-21 — `DEFAULT_GRID_GEOMETRY` literal equality

- input: `DEFAULT_GRID_GEOMETRY`
- expected: `{rowH: 48, gap: 14, totalCols: 12}` deep-equal
- location: same file, describe block "consts"

### TC-22 — `COL_SNAPS` byte-equal literal `[2, 3, 4, 6, 8, 12]`

- input: `Array.from(COL_SNAPS)`
- expected: `[2, 3, 4, 6, 8, 12]` deep-equal (guards against drift from
  mdx-bridge dual-source; per Risk row 1)
- location: same file, same describe

### TC-23 — `proseGridDefaults` shape literal

- input: `proseGridDefaults`
- expected: `{rowSpanSemantic: 'auto', gridKind: 'prose', defaultColSpan: 12}`
  deep-equal
- location: same file, same describe

### TC-24 — `BlockUIDefinition.gridDefault` round-trips through `defineUI`

- input: `defineUI({...calloutUIDefault, gridDefault: {col: 1, colSpan: 12, rowSpan: 1}})`
- expected: `result.gridDefault.col === 1 && result.gridDefault.colSpan
  === 12 && result.gridDefault.rowSpan === 1`
- location: `packages/block-foundation/src/__tests__/registry.test.ts`
  appended `describe('BlockRegistry — grid fields')`

### TC-25 — `BlockUIDefinition.rowSpanSemantic` + `gridKind` round-trip

- input: `defineUI({...calloutUIDefault, rowSpanSemantic: 'auto', gridKind: 'prose'})`
- expected: `result.rowSpanSemantic === 'auto' && result.gridKind === 'prose'`
- location: same file, same describe

### TC-26 — Existing 12 `registry.test.ts` cases UNCHANGED

- input: the 12 pre-existing cases (defensive copy, duplicate register,
  multi-UI, etc.)
- expected: all 12 still PASS unmodified (no schema-strictness regression
  from the 3 added optional fields)
- location: `packages/block-foundation/src/__tests__/registry.test.ts`

## contracts_affected

- `packages/block-foundation/CONTRACT.md` — `## Public surface`
  extended (additive; W5-1 invariant prose at L30 untouched per Pre-A2
  lock). D2 row 1 hit (CONTRACT.md change). The list of affected
  consumers (mdx-bridge / editor-shell / apps/site / heavy-block-boundary)
  is enumerated in the new public-surface bullet entries — each cites
  the C.2-X PR row that materialises the consumer wiring.
- `packages/block-foundation/RFC.md` — **NOT** modified (RFC is
  consumer tutorial; new grid fields don't change the "how to register
  a block" walkthrough since the 3 fields are optional with ADR-0016
  D10 defaults; consumer-facing docs land at C.2-3 + C.2-4 alongside
  actual block adoption).
- `packages/mdx-bridge/CONTRACT.md` — **NOT** modified (cross-package
  scope; C.2-1 already extended its `## Grid context attrs (Wave 5)`
  section + W5-1 forward-pointer at PR #58 merge; no further sister-doc
  sync required for C.2-2).
- 8 `@skb/block-*` CONTRACT.md files — **NOT** modified (block adoption
  deferred to C.2-3 / C.2-4).

D2 row 5 (boundary contract change) hit because the new
`BlockUIDefinition` fields define the cross-package contract that
`@skb/editor-shell` (C.2-4) + `@skb/heavy-block-boundary` (C.2-7) +
`apps/site` Astro renderer (C.2-3) will consume. PRE-COMMIT CLAUDE
REVIEW (D1 stage 4) FIRES.

## adr_touched

NONE (D2 row 4 NOT hit). ADR-0016 D2 / D6 / D9 / D10 + §502 sister-doc
sync row 1 of 4 already authorise the entire surface (Pre-A2 lock). PR
cites ADR-0016 D-list anchors in JSDoc + CONTRACT.md bullets but does
NOT amend the ADR.

ADR-0014 v0.5 amendment (heavy-block boundary `heavyBoundaryDimensions`
联动 colSpan / rowSpan) is on the C.2-7 row — out of scope here.

ADR-0009 (BlockKind 4-way union) is referenced in the new
`BlockGridKind` JSDoc as the structural-parallel target, but ADR-0009
itself is NOT amended.

## acceptance

13 verifiable acceptance criteria. Each is a single shell command
producing an objectively checkable result. ACCEPT-stage pr-writer
(D1 stage 6) re-runs all 13 against the post-commit working tree.

### AC#1 — `BlockGridPosition` interface exported from `types.ts`

```bash
grep -E '^export interface BlockGridPosition' \
  packages/block-foundation/src/types.ts | wc -l
```

Expected: `1`. Verifies the interface is created at module top-level
with the literal name (not aliased, not under a namespace).

### AC#2 — `COL_SNAPS` byte-equivalent literal in `types.ts`

```bash
grep -F 'COL_SNAPS = [2, 3, 4, 6, 8, 12]' \
  packages/block-foundation/src/types.ts | wc -l
```

Expected: `1`. The literal must match mdx-bridge `serialize.ts` L50 +
`parse.ts` L57 byte-for-byte (with `as const` suffix that is NOT
matched by the `-F` literal grep but is present in source — see AC#2b).

### AC#2b — `COL_SNAPS` declared `as const`

```bash
grep -E '^export const COL_SNAPS = \[2, 3, 4, 6, 8, 12\] as const' \
  packages/block-foundation/src/types.ts | wc -l
```

Expected: `1`. Ensures const-as-literal narrowing for downstream
includes-check ergonomics.

### AC#3 — `proseGridDefaults` const exported from `types.ts`

```bash
grep -F 'proseGridDefaults' \
  packages/block-foundation/src/types.ts | wc -l
```

Expected: ≥ `1`. (Looser match — covers both the `export const` line
and any JSDoc reference; the actual import-from-consumer test is via
TC-23 + AC#7 vitest pass.)

### AC#4 — 3 grid optional fields added to `BlockUIDefinition` in `registry.ts`

```bash
grep -E 'gridDefault\?|rowSpanSemantic\?|gridKind\?' \
  packages/block-foundation/src/registry.ts | wc -l
```

Expected: ≥ `3` (one match per field; could be more if JSDoc references
the field names — acceptable). Verifies all 3 fields are added with `?`
optional marker.

### AC#5 — All 5 grid-math helpers exported from `grid-math.ts`

```bash
grep -E '^export function (effectiveCellHeight|effectiveColWidth|effectiveRowSpan|validateGridPosition|isAutoRowSpan)' \
  packages/block-foundation/src/grid-math.ts | wc -l
```

Expected: `5`. Verifies all 5 named helpers are top-level exports.

### AC#6 — W5-1 numeric formula assertions present in test file

```bash
grep -F 'effectiveCellHeight(1' \
  packages/block-foundation/src/__tests__/grid-math.test.ts | wc -l
# AND
grep -F 'effectiveCellHeight(2' \
  packages/block-foundation/src/__tests__/grid-math.test.ts | wc -l
# AND
grep -F 'effectiveCellHeight(6' \
  packages/block-foundation/src/__tests__/grid-math.test.ts | wc -l
```

Expected: each ≥ `1`. Confirms the W5-1 base / multi-row / AgentFlow
exemplar cases (TC-1 / TC-2 / TC-3) are present in source.

### AC#7 — `pnpm --filter @skb/block-foundation test` PASS

```bash
pnpm --filter @skb/block-foundation test
```

Expected: exit 0, all 26+ test cases PASS (12 existing registry +
2 new registry grid-field cases + 22+ grid-math cases). No skipped
tests.

### AC#8 — `pnpm check:affected` PASS

```bash
pnpm check:affected
```

Expected: exit 0. Lint + typecheck + test + build + size-check all
PASS for `@skb/block-foundation` and any package transitively affected
(none expected at C.2-2; consumer wiring is at C.2-3 / C.2-4).

### AC#9 — `## Public surface` extended in CONTRACT.md

```bash
grep -E '^## Public surface' \
  packages/block-foundation/CONTRACT.md | wc -l
# AND ensure new bullet entries present:
grep -F 'BlockGridPosition' packages/block-foundation/CONTRACT.md | wc -l
grep -F 'COL_SNAPS' packages/block-foundation/CONTRACT.md | wc -l
grep -F 'proseGridDefaults' packages/block-foundation/CONTRACT.md | wc -l
grep -F 'effectiveCellHeight' packages/block-foundation/CONTRACT.md | wc -l
grep -F 'gridDefault' packages/block-foundation/CONTRACT.md | wc -l
```

Expected: section header `1`; each new-surface name ≥ `1` hit
(could appear in W5-1 invariant prose line at L30 already — that's
acceptable; the test confirms presence, not authorship). The
`## Public surface` section bullet additions are visually verified
in PR review.

### AC#10 — W5-1 invariant prose at L30 NOT modified

```bash
git diff origin/main -- packages/block-foundation/CONTRACT.md \
  | grep -E '^[+-].*W5-1' | wc -l
```

Expected: `0`. Hard fail iff any line containing `W5-1` is added or
removed from the CONTRACT.md diff. (Pre-A2 lock per orchestrator
instruction.) Visual reviewer also verifies that L30 is unchanged in
content (the bullet text remains identical byte-for-byte).

### AC#11 — Lychee link-check pre-empt clean (PR.md only — orchestrator-self walk)

Manual walk per orchestrator: scan with the autolink-in-backticks
regex (per memory feedback_lychee_autolink_in_backticks) and confirm
zero hits — no `{word}`-shaped autolinks inside backticks; no
`:line` suffix on file links; no `npmjs.com` URLs; no markdown-link
tilde paths. CI Lychee runs against the merged tree as canonical;
orchestrator pre-empts locally.

### AC#12 — `pnpm size-check` PASS (no source file > 500 LOC)

```bash
pnpm --filter @skb/block-foundation size-check
```

Expected: exit 0. New files target ~95-115 LOC (`grid-math.ts`) +
~55-75 LOC (`types.ts`) + ~85-105 LOC (`grid-math.test.ts`); existing
`registry.ts` extension stays well under the 500 cap (currently 100
lines + ~15 LOC delta = ~115).

### AC#13 — D2 trigger Row 1 + Row 5 acknowledged in PR.md

```bash
grep -E '^## D2 trigger judgment' \
  docs/plans/wave-5-main/C.2-2-block-foundation-grid.md | wc -l
# AND
grep -F 'Row 1' docs/plans/wave-5-main/C.2-2-block-foundation-grid.md | wc -l
grep -F 'Row 5' docs/plans/wave-5-main/C.2-2-block-foundation-grid.md | wc -l
grep -F 'PRE-COMMIT CLAUDE REVIEW' \
  docs/plans/wave-5-main/C.2-2-block-foundation-grid.md | wc -l
```

Expected: section header `1`; each row label ≥ `1`; PRE-COMMIT mention
≥ `1`. Acknowledges D1 stage 4 firing.

## verification required

The following commands run by orchestrator-self at D1 stage 4
(PRE-COMMIT CLAUDE REVIEW) and re-run by pr-writer at D1 stage 6
(ACCEPT). All 13 ACs (above) plus the D1 stage-3 codex-pr-reviewer-55
8-class checklist, plus the following augmented checks:

- `pnpm --filter @skb/block-foundation typecheck` PASS (uncached;
  per memory `feedback_git_operator_ci_verification`).
- `pnpm --filter @skb/block-foundation lint` PASS (per memory
  `feedback_codex_spark_lint_gap` — codex executor doesn't auto-run
  lint; orchestrator runs independently).
- `pnpm --filter @skb/block-foundation build` PASS — `dist/` regenerates
  with the new exports surface.
- `git diff --cached --stat` post-staging shows exactly the 8
  whitelisted files (no incidental snapshot / `pnpm-lock.yaml` / cache
  contamination — per memory `feedback_git_operator_explicit_stage`).
- Manual sanity: `node -e "import('./packages/block-foundation/dist/index.js').then(m =>
  console.log(Object.keys(m).sort()))"` — output must include all
  new surface names alphabetised (`BlockGridPosition` /
  `COL_SNAPS` / `DEFAULT_GRID_GEOMETRY` / `effectiveCellHeight` /
  `effectiveColWidth` / `effectiveRowSpan` / `GridGeometry` /
  `isAutoRowSpan` / `proseGridDefaults` / `validateGridPosition`)
  alongside pre-existing names (`BlockKind` / `BlockRegistry` /
  `defineCore` / `defineUI` / `proseExtensions` / etc.). Type-only
  exports (`BlockGridPosition`, `BlockGridKind`, `RowSpanSemantic`,
  `BlockCoreDefinition`, `BlockUIDefinition`, `BlockViewProps`,
  `GridGeometry`) do NOT appear in runtime `Object.keys`; that's
  expected — type vs value distinction.

## Plan-challenger absorbtion

NOT APPLICABLE for an implementation PR per ADR-0011 D7. The Wave 5
plan v1.0 §470 row C.2-2 + ADR-0016 D9 + D10 + §502 + ADR-0006 8-class
audit checklist are the authoritative inputs. No plan-challenger
dispatch occurred at PLAN stage; the Wave 5 plan was already
plan-challenger-vetted at Pre-A5 lock.

If pr-writer encounters a substantive open question during PLAN draft
(beyond the path-(a)-vs-(b) question which is LOCKED at orchestrator-
recommended path (a)), it surfaces the question in the PLAN-stage
SendMessage to orchestrator BEFORE lock — none surfaced in this draft.

## R14 self-check

R14 = the 14-point pre-flight per ADR-0011 / Wave 5 plan §232 D12
"PR.md PLAN-stage validation":

1. ✅ **Stage scope-fence** — only files inside the locked Stage C.2-2
   whitelist (8 files; cross-package files NOT touched). Row C.2-2 in
   plan v1.0 §470 cites `packages/block-foundation/src/types.ts` (which
   doesn't exist yet, per orchestrator brief) → resolved to: create
   types.ts NEW + extend registry.ts (path (a) co-located lock).
2. ✅ **ADR authoritative source** — ADR-0016 D2 / D6 / D9 / D10 +
   §502 sister-doc-sync row 1 of 4 cited; ADR-0009 cited for BlockKind
   parallel structure; ADR-0006 class 4 + 5 + 6 cited for single-source
   + algorithm-replication + sister-doc audit.
3. ✅ **LOC budget** — ~250 LOC target (plan v1.0 row); breakdown:
   types.ts ~70 + grid-math.ts ~110 + registry.ts +15 + index.ts +5
   + CONTRACT.md +30 + grid-math.test.ts ~95 + registry.test.ts +15 =
   ~340 (slightly over; absorbed — within hard 500-line/file cap;
   total project-LOC delta is acceptable for a stage that adds 3
   public consts + 5 helpers + 3 type primitives + 3 interface fields).
4. ✅ **Path (a) co-located locked** — single-package detail
   (D4 scope refinement threshold); explicitly forbidden alternative
   path (b) noted in `## Risk register` row 3.
5. ✅ **No new package** — only block-foundation modified.
6. ✅ **No `pnpm-lock.yaml` change** — no new dependency.
7. ✅ **D2 trigger judgment** — Row 1 (CONTRACT.md public surface
   change) + Row 5 (boundary contract change) both hit; PRE-COMMIT
   CLAUDE REVIEW (D1 stage 4) FIRES; acknowledged in
   `## D2 trigger judgment`.
8. ✅ **Plan v1.0 §470 row honored** — slight whitelist refinement
   (registry.ts added inline; types.ts is NEW not pre-existing) is
   within D4 scope-refinement absorption.
9. ✅ **TDD-front order** — test_cases section enumerates 26 cases;
   `grid-math.test.ts` is the first file written by codex executor
   (RED) before `grid-math.ts` impl (GREEN).
10. ✅ **W5-1 prose preservation** — AC#10 + Risk register row 2
    explicitly fence the Pre-A2-locked invariant text at CONTRACT.md
    L30.
11. ✅ **Sister-doc sync** — `## Public surface` in CONTRACT.md
    extended in same PR as code change (ADR-0006 D8 + D2 row 1 satisfied).
12. ✅ **Lychee pre-empt** — backtick-autolink scan + `:line`-suffix
    + `npmjs.com` + tilde-path manual checks committed in `## acceptance`
    AC#11.
13. ✅ **Out-of-scope explicit list** — `## Out of scope` section
    enumerates C.2-3 / C.2-4 / C.2-5..12 / mdx-bridge unification /
    block packages migration / design-tokens / ADR amendments /
    BlockUIDefinition relocation.
14. ✅ **Codex executor profile** — `codex-generic-executor` declared
    in `## executor`; D1 stage 5 commit staging pre-listed in
    `## Codex commit (D1 stage 5) staging`.

## D2 trigger judgment

Per ADR-0007 D2 trigger matrix:

- **Row 1 — CONTRACT.md change**: ✅ HIT. `packages/block-foundation/CONTRACT.md`
  `## Public surface` (L3-17) is extended additively with the new
  types / consts / helpers / optional fields. Row 1 → PRE-COMMIT CLAUDE
  REVIEW (D1 stage 4) FIRES.
- **Row 2 — package add/remove**: NOT hit. No new package; no removal.
- **Row 3 — schema strict-narrowing**: NOT hit. The 3 added
  `BlockUIDefinition` fields are optional (`?`) — backward compat
  preserved; no strict-narrow regression on existing block adopters
  (`block-callout` / `block-code` / `block-image` / etc., which don't
  yet declare any of the 3 fields).
- **Row 4 — new ADR required**: NOT hit. ADR-0016 already authorises;
  no amendment.
- **Row 5 — boundary contract change**: ✅ HIT. The new
  `BlockUIDefinition` fields + `BlockGridPosition` interface +
  `COL_SNAPS` const define the cross-package contract that downstream
  consumers (`apps/site` Astro renderer C.2-3 / `@skb/editor-shell`
  C.2-4 / `@skb/heavy-block-boundary` C.2-7) depend on. Row 5 →
  PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES (already firing from
  Row 1; Row 5 reinforces).
- **Row 6 — sister-doc sync gap**: NOT hit. CONTRACT.md is updated
  in the same PR as the code change; no sister-doc lag.
- **Row 7 — fixture invalidation**: NOT hit. No fixture change.
- **Row 8 — CI / deploy / auth / security**: NOT hit. No CI pipeline /
  GitHub Actions / auth / secrets touched.

Conclusion: **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** on Row 1
+ Row 5. Heightened reviewer scrutiny in stage 3 NOT additionally
required (Row 2 + Row 8 NOT hit).

## Risk register

### Risk #1 — `COL_SNAPS` byte-equivalence with mdx-bridge dual source (ADR-0006 class 5 algorithm replication)

`@skb/mdx-bridge` already has its own `const COL_SNAPS = [2, 3, 4, 6, 8, 12]
as const` declared at `serialize.ts:50` + `parse.ts:57` from C.2-1 (PR
#58 squash `e54497d`). C.2-2 lands a second declaration at
`packages/block-foundation/src/types.ts` as the W5-1 primary authority.
This creates a **transitional dual source** which violates ADR-0006
class 5 (algorithm replication = single-authority required) IF left
unfixed. **Mitigation**: (a) the 3 declarations are byte-equivalent
literals with `as const` suffix — drift detection is via TC-22 / AC#2
+ AC#2b grep checks plus a JSDoc forward-pointer in
`types.ts/COL_SNAPS` that says "MUST stay byte-equal to mdx-bridge
serialize.ts L50 + parse.ts L57 until C.2-3 / C.2-4 unify; then
mdx-bridge imports from here"; (b) Wave 5 plan v1.0 row C.2-3 (Astro
renderer) AND row C.2-4 (editor-shell) BOTH already touch mdx-bridge
or co-package files in their natural diff window, so the unification
import + mdx-bridge local-const removal lands at one of those PRs at
zero marginal churn cost; (c) reviewer codex 8-class audit at stage 3
WILL flag the dual source — orchestrator pre-empts in `## title` +
this risk row by **explicitly classifying it as transitional** with a
deadline pointer (≤ C.2-4). **Residue tolerance**: 2 sister PRs (≤ 2
weeks at current cadence). Acceptable.

### Risk #2 — W5-1 invariant prose at CONTRACT.md L30 accidentally modified

The Pre-A2 ratification merge landed the W5-1 invariant prose at
`packages/block-foundation/CONTRACT.md` L30 — a 1390-byte single-line
bullet citing all the future types this PR materialises. Codex
executor at D1 stage 2, when extending `## Public surface` (L3-17),
might accidentally edit L30 if it does a bulk regex-replace over the
file (e.g., "add bullet about BlockGridPosition" could touch the L30
line that already mentions `BlockGridPosition`). **Mitigation**:
(a) AC#10 hard-fail check `git diff origin/main -- ...CONTRACT.md
| grep -F 'W5-1' | wc -l == 0`; (b) PR.md `## title` + `## files`
sections explicitly call out "W5-1 invariant at L30 — UNTOUCHED" with
the verification command; (c) executor instruction at stage 2 dispatch
will emphasise "ONLY append new bullets to the `## Public surface`
section at L3-17; do NOT touch L30 or beyond". **Residue**: zero
acceptable; AC#10 is hard-fail.

### Risk #3 — codex executor temptation to refactor `BlockUIDefinition` from `registry.ts` to `types.ts`

The orchestrator has LOCKED **path (a) co-located**: `BlockUIDefinition`
stays in `registry.ts`, only the 3 grid fields are added inline; NEW
`types.ts` houses NEW grid primitives only. Path (b) (relocate
`BlockUIDefinition`) is forbidden. Codex executor, given a "create
types.ts" instruction, may infer that `BlockUIDefinition` should
naturally live there and proactively move it. **Mitigation**: PR.md
explicitly says "path (a) co-located LOCKED; path (b) FORBIDDEN" in
`## title` + `## files` registry.ts entry + this row; the executor
prompt at D1 stage 2 echoes the same constraint verbatim. Reviewer
codex stage 3 audit also catches this (any deletion of
`BlockUIDefinition` from registry.ts → REJECT). **Residue**: zero
acceptable. A future refactor PR may revisit if registry.ts grows
beyond ~300 LOC; out of C.2-2 scope.

### Risk #4 — `DEFAULT_GRID_GEOMETRY` hard-coded literals will drift from design-tokens at Stage C.3 (OKLCH switchover)

ADR-0016 D9 + D10 mention design-tokens runtime constants for Wave 5
Stage C.3 (`packages/design-tokens`) as the eventual authority for
`row-h=48 / gap=14 / totalCols=12`. C.2-2 ships hard-coded values in
`grid-math.ts/DEFAULT_GRID_GEOMETRY`. If C.3 redefines these
(e.g., `row-h=52` for OKLCH spacing harmony) without updating
grid-math.ts, all consumers using DEFAULT will drift. **Mitigation**:
(a) JSDoc on `DEFAULT_GRID_GEOMETRY` includes a forward-pointer:
"Wave 5 Stage C.3 may switch to design-tokens-derived constants per
ADR-0016 D9; until then these literals are the authority"; (b) all
5 helpers accept an optional second `geometry` parameter typed
`Partial` over the `GridGeometry` interface → C.3 consumers can pass
design-tokens-derived geometry without
changing grid-math.ts itself; (c) Wave 5 plan v1.0 row C.3-X (when it
materialises) will own the migration. **Residue**: documentation
forward-pointer; acceptable.

### Risk #5 — `proseGridDefaults` const exported but no consumer wires it in C.2-2

The `proseGridDefaults = {rowSpanSemantic: 'auto', gridKind: 'prose',
defaultColSpan: 12} as const` is exported from `types.ts` but no code
in C.2-2 actually consumes it. Editor-shell consumes at C.2-4 (mount
Tiptap NodeView for prose blocks); mdx-bridge consumes at C.2-3 (path
decision in serialize/parse). Risk: dead-export at merge time;
reviewer codex 8-class audit might flag as YAGNI / dead code.
**Mitigation**: (a) JSDoc on `proseGridDefaults` explicitly cites the
2 future consumers (C.2-3 mdx-bridge + C.2-4 editor-shell) with PR
row references; (b) TC-23 vitest case asserts the const shape — no
silent dead-code; (c) `## title` + this risk row classify as
"forward-export — consumer wired ≤ C.2-4". Reviewer pre-empt.
**Residue**: ≤ 2 sister PRs; acceptable.

### Risk #6 — `gridKind` runtime mirror logic deferred but type-level optional default unclear

ADR-0016 D10 says `gridKind` "默认 = 与 BlockKind 一致 (mirror)". This
implies a runtime fallback in `registerUI` / `BlockRegistry`: if a UI
def doesn't specify `gridKind`, the registry should fall back to the
core's `BlockKind`. C.2-2 ships type-level only (no registry runtime
mirror). The `isAutoRowSpan({})` → false case (TC-20) exposes this:
a UI def with neither `rowSpanSemantic` nor `gridKind` set returns
false, even if the underlying core has `kind: 'prose'`. **Mitigation**:
(a) JSDoc on `gridKind` + on `isAutoRowSpan` explicitly notes "runtime
mirror at registerUI deferred to C.2-4"; (b) callers in C.2-2 are
expected to either (i) pass the full `gridKind` explicitly on all
prose blocks or (ii) wait for C.2-4 to wire the registry-level fallback;
(c) at C.2-2 there are no actual prose-block adopters yet (block
packages migration deferred per Risk row 5 + `## Out of scope`), so
the gap is invisible at merge time. **Residue**: ≤ C.2-4 deadline;
acceptable.

### Risk #7 — `BlockGridKind` parallel-not-identical to `BlockKind` (ADR-0009) drift risk

`BlockGridKind = 'prose' | 'component' | 'render' | 'viz'` is
declared in `types.ts` independently of `BlockKind` in `registry.ts`.
ADR-0009 already locks `BlockKind` as the 4-way union; ADR-0016 D10
locks `gridKind` to mirror it. If a future ADR amends `BlockKind`
(e.g., adds a 5th kind), the mirror must update — but the declaration
is in two physical files now. **Mitigation**: (a) JSDoc on
`BlockGridKind` explicitly cites ADR-0009 + says "MUST stay structurally
identical to BlockKind in registry.ts L4; any extension goes through
ADR amendment + same-PR sync"; (b) AC for future BlockKind-extending
PRs will include a sister-doc check on this; (c) TC-23 + TC-25
register a runtime sample (`gridKind: 'prose'`) that pins the literal
union member at type-check time. **Residue**: documentation +
future-PR-checklist; acceptable. Could absorb to a single source by
re-importing `BlockKind` from registry.ts into types.ts and aliasing
`type BlockGridKind = BlockKind`, BUT that creates a circular module
graph (types.ts ← registry.ts ← types.ts) which TypeScript handles
but is fragile. Path-of-least-friction = independent declaration +
JSDoc invariant pointer.

## Out of scope (deferred — explicit list)

The following are LOCKED OUT of C.2-2 (executor MUST NOT touch them;
reviewer MUST flag as scope creep if encountered):

- **C.2-3** — Astro renderer grid layout in `apps/site/**` + sample
  MDX backfill + mdx-bridge defensive-default → hard-throw flip.
- **C.2-4** — `@skb/editor-shell` grid container + `useAutoRowSpan`
  hook (consumes `effectiveRowSpan` + `isAutoRowSpan` from this PR's
  grid-math.ts).
- **C.2-5..C.2-12** — drag/drop / resize handles / ADR-0014 v0.5
  amendment / playwright visual smoke / Stage C.2 close.
- **mdx-bridge `COL_SNAPS` unification** — `@skb/mdx-bridge`
  `serialize.ts:50` + `parse.ts:57` will continue to declare their own
  local `COL_SNAPS = [2, 3, 4, 6, 8, 12] as const` until C.2-3 / C.2-4
  unify (transitional dual source per Risk row 1).
- **Block packages migration** — actual `gridDefault` /
  `rowSpanSemantic` / `gridKind` adoption on each
  `defineUI(...)` call across `block-callout` / `block-code` /
  `block-image` / `block-math` / `block-pdf` / `block-jupyter` /
  `block-nn-viz` / `block-agent-flow` / heavy plugin placeholders is
  deferred per ADR-0016 D10 to C.2-3 (Astro renderer wires consumers)
  / C.2-4 (editor-shell wires consumers).
- **`registerUI` runtime `gridKind` mirror logic** — runtime fallback
  from `BlockUIDefinition.gridKind ?? coreDef.kind` deferred to C.2-4
  (per Risk row 6).
- **`@skb/heavy-block-boundary` v0.5 amendment** — `heavyBoundaryDimensions`
  联动 colSpan / rowSpan deferred to C.2-7 (per Wave 5 plan v1.0 row
  C.2-7 + ADR-0014 v0.5 amendment scope).
- **`packages/design-tokens/**`** — design-tokens-derived
  `GridGeometry` (Stage C.3 OKLCH scope per Wave 5 plan v1.0 §C.3).
- **ADR amendments** — none in C.2-2; ADR-0016 + ADR-0009 both
  unchanged.
- **`BlockUIDefinition` relocation from `registry.ts` → `types.ts`**
  (path (b)) — explicitly forbidden in this PR per `## title` lock +
  Risk row 3; may be revisited in a future refactor PR if
  `registry.ts` grows beyond ~300 LOC.
- **`packages/block-foundation/RFC.md` updates** — consumer-tutorial
  walkthrough refresh deferred to C.2-3 / C.2-4 alongside actual block
  adoption.
- **`pnpm-lock.yaml` / `package.json`** changes — no new dependencies;
  no `exports` field updates (single barrel locked).

## executor

- **D1 stage 1 PLAN**: `pr-writer` Claude subagent (this dispatch).
  Output: this PR.md, locked by orchestrator after ≤ 2 rounds.
- **D1 stage 2 EXECUTE**: `codex-generic-executor` `--yolo`
  (gpt-5.5 + workspace-write sandbox; per ADR-0011 D6). TDD-front
  order:
  1. Write `grid-math.test.ts` (RED — types.ts + grid-math.ts don't exist yet).
  2. Write `types.ts` (RED resolves on type primitives; TC-22 / TC-23 turn GREEN).
  3. Write `grid-math.ts` (TC-1..TC-21 turn GREEN).
  4. Extend `registry.ts` with the 3 grid optional fields.
  5. Extend `index.ts` barrel with 2 new `export *` lines.
  6. Append registry.test.ts grid-field describe block (TC-24..TC-26 GREEN).
  7. Extend `CONTRACT.md` `## Public surface` with new bullet entries.
  8. Re-run `pnpm --filter @skb/block-foundation test` + `lint` +
     `typecheck` + `build` + `size-check` until all PASS.
  9. Stop. SendMessage orchestrator with diff summary.
- **D1 stage 3 REVIEW**: `codex-pr-reviewer-55`. ADR-0006 8-class
  checklist mandatory; specific high-risk classes:
  - **class 4 (single-authority schema)**: COL_SNAPS dual-source with
    mdx-bridge — must accept the transitional classification per Risk
    row 1.
  - **class 5 (algorithm replication)**: W5-1 numeric formula —
    grid-math.ts is the single authority; W5-1 prose at CONTRACT.md
    L30 cites the formula but does NOT re-implement it (prose-only
    citation is acceptable; prose is invariant doc not algorithm code).
  - **class 6 (sister-doc sync)**: CONTRACT.md `## Public surface`
    extended in same PR as code change — PASS.
- **D1 stage 4 PRE-COMMIT CLAUDE REVIEW**: orchestrator-self.
  **REQUIRED** (D2 row 1 + row 5). Re-run all 13 ACs + verification
  required commands; verify W5-1 prose untouched (AC#10 zero-diff
  hard-fail); verify path (a) preserved (no `BlockUIDefinition`
  relocation in registry.ts diff).
- **D1 stage 5 COMMIT**: reviewer codex with ADR-0006 D8
  explicit-file-list staging (see `## Codex commit (D1 stage 5)
  staging` below).
- **D1 stage 6 ACCEPT**: `pr-writer` Claude subagent (second
  invocation; this same subagent re-dispatched). Re-run all 13 ACs
  against post-commit working tree. Output: ACCEPT or
  REJECT-with-residue.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list 4-step protocol (per memory
`feedback_git_operator_explicit_stage`):

```bash
# Step 1: clean stage
git reset HEAD

# Step 2: explicit file list (8 files)
git add packages/block-foundation/src/registry.ts
git add packages/block-foundation/src/types.ts
git add packages/block-foundation/src/grid-math.ts
git add packages/block-foundation/src/index.ts
git add packages/block-foundation/src/__tests__/grid-math.test.ts
git add packages/block-foundation/src/__tests__/registry.test.ts
git add packages/block-foundation/CONTRACT.md
git add docs/plans/wave-5-main/C.2-2-block-foundation-grid.md

# Step 3: verify staged set matches whitelist exactly
git diff --cached --name-only | sort
# Expected output (exactly 8 lines, alphabetically):
#   docs/plans/wave-5-main/C.2-2-block-foundation-grid.md
#   packages/block-foundation/CONTRACT.md
#   packages/block-foundation/src/__tests__/grid-math.test.ts
#   packages/block-foundation/src/__tests__/registry.test.ts
#   packages/block-foundation/src/grid-math.ts
#   packages/block-foundation/src/index.ts
#   packages/block-foundation/src/registry.ts
#   packages/block-foundation/src/types.ts

git diff --cached --stat | tail -1
# Expected: 8 files changed, ~340 insertions(+), ~5 deletions(-)
# (deletions ≈ 0; the 3 added optional fields in registry.ts are pure
# additive; index.ts barrel additive; CONTRACT.md additive bullets;
# tests additive; types.ts + grid-math.ts brand new)

# Step 4: confirm pnpm-lock.yaml NOT staged (no new deps)
git diff --cached --name-only | grep -F 'pnpm-lock.yaml' | wc -l
# Expected: 0

# Step 5: commit
git commit -m "$(cat <<'EOF'
Wave 5 C.2-2 — block-foundation BlockUIDefinition grid + grid-math.ts

Materialise the W5-1 / ADR-0016 D10 grid type primitives + helpers as the
single authoritative source in @skb/block-foundation:

- NEW packages/block-foundation/src/types.ts: BlockGridPosition interface,
  COL_SNAPS const, BlockGridKind + RowSpanSemantic type aliases,
  proseGridDefaults const (per ADR-0016 D2 + D6 + D10 Q7 + Q8).
- NEW packages/block-foundation/src/grid-math.ts: GridGeometry interface,
  DEFAULT_GRID_GEOMETRY const, 5 helpers — effectiveCellHeight,
  effectiveColWidth, effectiveRowSpan, validateGridPosition, isAutoRowSpan
  (per ADR-0016 D2 + D9 + D10).
- registry.ts: BlockUIDefinition extended with 3 optional fields —
  gridDefault?, rowSpanSemantic?, gridKind? (per ADR-0016 D10).
- index.ts barrel: re-export new types + helpers (single entry point).
- CONTRACT.md: Public surface extended additively; W5-1 invariant prose
  at L30 UNTOUCHED (Pre-A2 lock).
- NEW grid-math.test.ts (22+ assertions) + registry.test.ts grid-field
  describe block.

Path (a) co-located locked: BlockUIDefinition stays in registry.ts; only
the 3 grid fields added inline. NEW types.ts houses NEW grid primitives
only.

mdx-bridge COL_SNAPS unification deferred to C.2-3 / C.2-4 (transitional
dual source — byte-equivalent literal). Block packages migration deferred
to C.2-3 / C.2-4 consumer wiring.

D2 row 1 (CONTRACT.md public surface) + row 5 (boundary contract) hit;
PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRED.

Refs: ADR-0016 D2 / D6 / D9 / D10 / §502; Wave 5 plan v1.0 §470 row C.2-2.
PR.md: docs/plans/wave-5-main/C.2-2-block-foundation-grid.md
EOF
)"

# Step 6: push
git push -u origin wave-5-main/C.2-2-block-foundation-grid
```

NO `--no-verify` flag. NO `git add -A` / `git add .`. NO `git commit
--amend`. Pre-commit hook PASS expected; on hook fail, follow ADR-0006
D8 + memory `feedback_git_operator_explicit_stage` "fix the underlying
issue, re-stage, NEW commit" flow — not amend.

## Related

- Wave 5 plan v1.0 §470 row C.2-2 + §502 sister-doc sync row 1 of 4
  (`docs/plans/wave-5-main/Pre-A5-plan-v1-lock.md`)
- ADR-0016 D2 / D6 / D9 / D10 / §502
  (`docs/decisions/ADR-0016-grid-data-model.md`)
- ADR-0009 BlockKind 4-way union expansion
  (`docs/decisions/ADR-0009-block-kind-union-expansion.md`)
- ADR-0006 class 4 (single-authority schema) + class 5 (algorithm
  replication) + class 6 (sister-doc sync)
  (`docs/decisions/ADR-0006-asymmetry-audit-checklist.md`)
- ADR-0011 D1 (linear pipeline 6 stages) + D2 (trigger matrix) + D6
  (Wave 3 default executor) + D7 (subagent roster)
  (`docs/decisions/ADR-0011-linear-pipeline-execution-model.md`)
- Wave 5 C.2-1 PR squash `e54497d` — `@skb/mdx-bridge` grid serialize
  (predecessor; mdx-bridge dual-source `COL_SNAPS` at
  `packages/mdx-bridge/src/serialize.ts:50` + `packages/mdx-bridge/src/parse.ts:57`)
- `packages/block-foundation/CONTRACT.md` L30 W5-1 invariant prose
  (Pre-A2 lock; preserved by AC#10)
- `packages/block-foundation/src/registry.ts` L29-36 — current
  generic `BlockUIDefinition` interface (parameter `TSchema`;
  extension target)
- `packages/block-foundation/RFC.md` — consumer tutorial (NOT
  modified in C.2-2; refresh at C.2-3 / C.2-4)
