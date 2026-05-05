# C.2-6 — resize UX 实施 (col-ruler + size-tooltip + COL_SNAPS snap; per ADR-0017 D9 + ADR-0016 D6 Q4)

> **Wave 5 Stage C.2 7th implementation PR** of the locked 13-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.1 row C.2-6). Lands the
> **editor-shell side resize UX layer** per ADR-0017 D9 (col-ruler浮顶
> 6 stop highlight + size-tooltip cursor-offset fixed-position + fraction
> string display + mobile 1-col view-only branch) plus the long-promised
> ADR-0016 D6 Q4 absorbtion `effectiveColSnaps(viewportCols)` block-
> foundation authority. C.2-1 (mdx-bridge serialize, squash `e54497d`) +
> C.2-2 (block-foundation grid primitives, squash `b15ba24`) + C.2-3
> (Astro renderer grid + Responsive 12/6/1, squash `2586328`) + C.2-3.5
> (mdx-bridge hard-throw flip, squash `b019a31`) + C.2-4 (editor-shell
> grid container + `useAutoRowSpan` hook, squash `de13d15`) + C.2-5
> (drag/drop UX 3 modules, squash `2df71b6`) all merged. C.2-6 wires
> the **editor-side resize UX layer** as 2 NEW pure modules under
> `packages/editor-shell/src/resize/` plus barrel re-exports + 2
> CONTRACT.md edits (block-foundation + editor-shell) + the
> `effectiveColSnaps` helper + tests addition to block-foundation. The
> **resize-handle DOM emission + pointer event wiring** is **NOT** in
> scope here (deferred to C.2-8 layoutReducer + drag/drop event-loop
> wiring per Wave 5 plan v1.1 row C.2-8). C.2-6 ships the visual
> feedback primitives (col-ruler + size-tooltip) + the snap-set
> authority + the colSpan→fraction pure helper. **PRE-COMMIT CLAUDE
> REVIEW (D1 stage 4) FIRES** per `## D2 trigger judgment` (Row 1
> CONTRACT.md change in BOTH `@skb/block-foundation` and
> `@skb/editor-shell` + Row 5 cross-package boundary contract change
> since the resize layer is the editor-shell consumer of the new
> `effectiveColSnaps` block-foundation export).

## title

Wire the **editor-side resize UX layer** in `@skb/editor-shell` per
ADR-0017 D9 (col-ruler浮顶 + size-tooltip cursor-offset + 6-stop
highlight + fraction string + mobile 1-col view-only branch) + ADR-0016
D6 Q4 absorbtion `effectiveColSnaps(viewportCols)` block-foundation
authority. 2 NEW pure modules in editor-shell + 1 NEW helper in
block-foundation grid-math + 3 NEW vitest suites + 4 modified files
(2 barrel + 2 CONTRACT.md) = 9 source/test files + PR.md self = 10
whitelist entries.

Specifically:

1. MODIFIED `packages/block-foundation/src/grid-math.ts` (~30-50 LOC
   delta). Add `effectiveColSnaps(viewportCols: 12 | 6 | 1):
   readonly number[]` per ADR-0016 D6 Q4 absorbtion verbatim mapping:

   ```typescript
   export function effectiveColSnaps(
     viewportCols: 12 | 6 | 1,
   ): readonly number[] {
     switch (viewportCols) {
       case 12: return [2, 3, 4, 6, 8, 12] as const; // 1/6, 1/4, 1/3, 1/2, 2/3, full
       case 6:  return [2, 3, 6] as const;            // 1/3, 1/2, full of 6-col
       case 1:  return [1] as const;                   // forced full (1-col mobile)
     }
   }
   ```

   File-head JSDoc cites ADR-0016 D6 Q4 absorbtion verbatim. The
   `viewportCols: 12 | 6 | 1` literal-union input parameter type
   provides exhaustiveness at compile time (no runtime fallback throw
   needed; tsc enforces only-3-allowed-values at the call site).

   **Rationale for adding to block-foundation here (scope refinement
   per Wave 5 plan v1.1 D4)**: ADR-0016 D6 Q4 absorbtion (Pre-A2 lock)
   already locked `effectiveColSnaps` as block-foundation authority.
   C.2-2 (squash `b15ba24`) shipped 5 grid-math helpers
   (`effectiveCellHeight` / `effectiveColWidth` / `effectiveRowSpan` /
   `validateGridPosition` / `isAutoRowSpan` + `GridGeometry` +
   `DEFAULT_GRID_GEOMETRY`) but missed `effectiveColSnaps`. C.2-6
   col-ruler MUST consume `effectiveColSnaps` for cursor-stop
   highlighting; either implement locally in editor-shell (ADR-0006
   class 4 single-authority violation; algorithmic constants must
   reside at one source per memory
   `feedback_cross_package_consumer_pattern`) OR add to block-
   foundation now (correct authority placement). Decision: ADD here.
   Single-package detail OF AN ALREADY-LOCKED HELPER per ADR-0016 D6
   Q4; no PR count widening; no success criteria shift; no cross-
   package new boundary — block-foundation was always the authority.

   **Mobile 1-col path note**: the function returns `[1]` per ADR-0016
   D6 Q4 verbatim (forced full); this is the snap-set authority. The
   col-ruler component (file 3 below) separately returns `null` on
   `totalCols === 1` per ADR-0017 D9 view-only mobile branch. The two
   layers are orthogonal: `effectiveColSnaps(1) === [1]` answers "what
   snaps are valid in 1-col viewport" (1 — full only), while the
   col-ruler render path answers "do we draw a UI ruler" (no — mobile
   is view-only). Both are correct simultaneously.

2. MODIFIED `packages/block-foundation/CONTRACT.md` (~10-15 LOC delta).
   Add `effectiveColSnaps(viewportCols)` to the `## Public surface`
   section list per ADR-0016 D6 Q4 + Wave 5 D6 invariant. One-line
   bullet form parallel to the existing 5 grid-math helpers (e.g.,
   `effectiveCellHeight(rowSpan, geometry?)` line at L23).

3. NEW `packages/editor-shell/src/resize/col-ruler.tsx` (~80-130 LOC).
   React component rendering 6 / 3 / 0 col-snap stop markers at the
   top of the grid container during active resize. Public API:

   ```typescript
   export interface ColRulerProps {
     activeStops: readonly number[]; // from effectiveColSnaps(viewportCols)
     hoveredStop: number | null;     // current cursor-targeted snap value
     totalCols: number;               // 12 / 6 / 1
     gap?: number;                    // default 14 (= GAP from block-foundation)
     className?: string;
   }
   export function ColRuler(props: ColRulerProps): JSX.Element | null;
   ```

   Renders `<div class="skb-col-ruler">` containing N child
   `<span class="skb-col-ruler-stop">` markers (one per `activeStops`
   entry); the stop with `value === hoveredStop` receives the
   `skb-col-ruler-stop--active` modifier class. Stop highlight color
   `oklch(58% 0.16 35 / 0.4)` per ADR-0017 D9 line 311 verbatim
   (NOT yet from design-tokens; inline-style or static class only;
   forward-pointer comment to ADR-0018 + Stage C.3 token migration).

   **Mobile 1-col path** (`totalCols === 1`): component returns `null`
   per ADR-0017 D9 view-only mobile branch (line 326 — col-ruler hide).
   This is checked BEFORE consuming `activeStops`; so even when callers
   pass `effectiveColSnaps(1) === [1]`, the col-ruler does not render.

   **`gap` default**: defaults to `14` (numerically equal to the
   `GAP = 14` from `@skb/editor-shell` `drag-drop/edge-rects.ts`
   barrel + `apps/site/src/styles/grid.css` `--gap: 14px` C.2-3
   authority). Recommended consumer pattern: pass
   `DEFAULT_GRID_GEOMETRY.gap` from `@skb/block-foundation` (single-
   authority) at the call site. File-head JSDoc cites ADR-0017 D9 +
   ADR-0016 D6 Q4 + the `--gap` cross-package consumer parity
   (per memory `feedback_cross_package_consumer_pattern`).

   NO `_gridAttrsExplicit` reference (Q2 v1.1 mechanical guard per
   AC#13). NO React hooks beyond inline-style memoisation (kept pure-
   functional render).

4. NEW `packages/editor-shell/src/resize/size-tooltip.tsx` (~70-110
   LOC). React component rendering a fixed-position tooltip near the
   cursor during active resize. Public API:

   ```typescript
   export interface SizeTooltipProps {
     cursorX: number;     // current cursor screen position (px)
     cursorY: number;
     fraction: string;    // '1/2', '2/3', 'full', etc.
     rowSpan?: number;    // optional; if defined, append "· N rows"
     className?: string;
   }
   export function SizeTooltip(props: SizeTooltipProps): JSX.Element;

   export function colSpanToFraction(
     colSpan: number,
     totalCols: number,
   ): string;
   ```

   Renders `<div class="skb-size-tooltip" style={{position: 'fixed',
   left: cursorX + 12, top: cursorY - 8}}>` per ADR-0017 D9 line 312
   "fixed 浮在 cursor 右上角 (cursor + offset)" — interpretation
   locked at +12px right (horizontal offset away from cursor) and
   −8px up (vertical offset above cursor). Inner text: the
   `fraction` string, optionally followed by `' · ' + rowSpan + ' rows'`
   when `rowSpan` is provided per ADR-0017 D9 line 312 "y 轴拖时加
   '· N rows'".

   **`colSpanToFraction(colSpan, totalCols)` pure helper exported
   alongside**. Mapping (locked in this PR per ADR-0017 D9 line 312
   verbatim `'1/2', '2/3', 'full'` examples):

   | colSpan | totalCols=12 | totalCols=6 | totalCols=1 |
   | ------- | ------------ | ----------- | ----------- |
   | 12      | `'full'`     | (n/a)       | (n/a)       |
   | 8       | `'2/3'`      | (n/a)       | (n/a)       |
   | 6       | `'1/2'`      | `'full'`    | (n/a)       |
   | 4       | `'1/3'`      | (n/a)       | (n/a)       |
   | 3       | `'1/4'`      | `'1/2'`     | (n/a)       |
   | 2       | `'1/6'`      | `'1/3'`     | (n/a)       |
   | 1       | (n/a)        | (n/a)       | `'full'`    |

   Implementation: pure function, no DOM access, returns lowercase
   ASCII slash-fraction string OR `'full'` (per ADR-0017 D9 verbatim
   `'full'` token, NOT `'1'` or `'12 cols'`). Out-of-table
   (colSpan, totalCols) pairs throw an `Error` (defensive — callers
   only ever produce in-table values via `effectiveColSnaps`). NO
   side effects. NO `_gridAttrsExplicit` reference.

   File-head JSDoc cites ADR-0017 D9 + the v0.3 user共识 `[1/6, 1/4,
   1/3, 1/2, 2/3, full]` ladder note (ADR-0016 D6 line 250).

5. NEW `packages/block-foundation/src/__tests__/grid-math.test.ts`
   (or modify if already exists at C.2-2 squash `b15ba24`; ~50-80
   LOC delta). Add 4 test cases for `effectiveColSnaps`:
   - 12-col returns `[2, 3, 4, 6, 8, 12]`.
   - 6-col returns `[2, 3, 6]`.
   - 1-col returns `[1]`.
   - Returned array is `readonly` / non-mutable (defensive copy
     verification: caller pushing to result MUST throw or be
     no-op via `as const` immutability).

6. NEW `packages/editor-shell/src/__tests__/resize/col-ruler.test.tsx`
   (~80-120 LOC). Vitest + happy-dom + @testing-library/react covering
   8 scenarios per ADR-0017 D9 spec:
   - 12-col `activeStops = [2,3,4,6,8,12]` renders 6 stops.
   - 6-col `activeStops = [2,3,6]` renders 3 stops.
   - 1-col `totalCols === 1` returns `null` (no DOM emitted).
   - `hoveredStop = 6` matching one of the stops applies
     `skb-col-ruler-stop--active` class to the corresponding stop.
   - `hoveredStop = null` applies no `--active` modifier.
   - `hoveredStop` not in `activeStops` (spurious) applies no
     `--active` modifier (defensive: render does NOT crash).
   - Default `gap = 14` is used when omitted.
   - Unmount cleanup leaves no DOM nodes attached.

7. NEW `packages/editor-shell/src/__tests__/resize/size-tooltip.test.tsx`
   (~60-90 LOC). Vitest + happy-dom + @testing-library/react covering
   8 scenarios per ADR-0017 D9 spec:
   - `fraction = '1/2'` no `rowSpan` renders text `'1/2'` only.
   - `fraction = 'full'` `rowSpan = 3` renders text `'full · 3 rows'`.
   - Inline style includes `position: fixed`.
   - Inline style `left = cursorX + 12` exact arithmetic.
   - Inline style `top = cursorY - 8` exact arithmetic.
   - `colSpanToFraction(12, 12) === 'full'`.
   - `colSpanToFraction(8, 12) === '2/3'` and
     `colSpanToFraction(6, 12) === '1/2'` and
     `colSpanToFraction(4, 12) === '1/3'` and
     `colSpanToFraction(3, 12) === '1/4'` and
     `colSpanToFraction(2, 12) === '1/6'`.
   - `colSpanToFraction(6, 6) === 'full'` and
     `colSpanToFraction(3, 6) === '1/2'` and
     `colSpanToFraction(2, 6) === '1/3'` and
     `colSpanToFraction(1, 1) === 'full'`.
   - `colSpanToFraction(5, 12)` (out-of-table) throws.

   (Suite final count per `## test_cases` enumeration below; one of
   these bullets condenses two assertions per `it(...)` block.)

8. MODIFIED `packages/editor-shell/src/index.ts` (~5-8 LOC delta).
   Add barrel re-exports for `ColRuler`, `ColRulerProps` (from
   `./resize/col-ruler`); `SizeTooltip`, `SizeTooltipProps`,
   `colSpanToFraction` (from `./resize/size-tooltip`). Existing 16
   exports preserved (no regression on the A2-A5 `EditorShell` +
   register + saveLoad + proseExtensions barrel + C.2-4 `GridContainer`
   + `useAutoRowSpan` + C.2-5 `EDGE_W` + `GAP` + `EdgeRect` +
   `BlockLayout` + `computeEdgeRects` + `EdgeMatch` + `DragVelocity` +
   `tiebreak` + `findMatches` + `OutlineOverlay` + `OutlineOverlayProps`).

   **NOT re-exported**: `effectiveColSnaps` from
   `@skb/block-foundation`. Consumers must import from block-foundation
   directly per the existing precedent (e.g., `proseExtensions` is
   re-exported via barrel for legacy A2-era ergonomics; `BlockGridPosition`
   / `COL_SNAPS` / `validateGridPosition` etc. are consumed direct).
   Avoid expanding the editor-shell barrel surface for foundation
   helpers — keeps the dep boundary explicit.

9. MODIFIED `packages/editor-shell/CONTRACT.md` (~50-80 LOC delta).
   Extend the existing `## Grid layout (Wave 5)` section (added at
   C.2-4 then extended at C.2-5 with the `### Drag/Drop layer (C.2-5)`
   subsection) with a NEW subsection `### Resize layer (C.2-6)`.
   Section contents:
   - 2-module public surface: `col-ruler.tsx` (`ColRuler`,
     `ColRulerProps`) + `size-tooltip.tsx` (`SizeTooltip`,
     `SizeTooltipProps`, `colSpanToFraction`).
   - Forward-pointer to `@skb/block-foundation` `effectiveColSnaps`
     authority — col-ruler consumes the snap-set; not re-exported via
     editor-shell barrel.
   - ADR-0017 D9 cite (col-ruler + size-tooltip spec; mobile 1-col
     view-only branch; resize handle visibility rules).
   - Forward-pointer to ADR-0018 + Stage C.3 for the
     `oklch(58% 0.16 35 / 0.4)` stop-highlight color → token migration.
   - Forward-pointer: resize-handle DOM emission +  pointer event
     wiring deferred to C.2-8 (layoutReducer + drag/drop event-loop)
     per Wave 5 plan v1.1 row C.2-8; C.2-6 ships visual feedback
     primitives + snap-set authority only (no mutation, no resize-
     handle mount).
   - Q2 v1.1 absorbtion downstream-must-not-reuse 锁 (parallel to
     C.2-4 + C.2-5 invariant): "resize modules MUST NOT reference
     `_gridAttrsExplicit` (mdx-bridge transitional marker, removed
     at Wave 5 plan v1.1 row C.2-3.5 hard-throw flip end-state,
     squash `b019a31`)."
   - Cross-package consumer parity prose: "`gap` parameter default
     `14` MUST stay byte-equal to `apps/site/src/styles/grid.css`
     `--gap: 14px` (C.2-3 authority, squash `2586328`) +
     `@skb/block-foundation` `DEFAULT_GRID_GEOMETRY.gap` (C.2-2
     authority, squash `b15ba24`) + `@skb/editor-shell`
     `drag-drop/edge-rects.ts` `GAP = 14` (C.2-5 authority, squash
     `2df71b6`). 4-source single algorithmic constant per memory
     `feedback_cross_package_consumer_pattern`."

10. PR.md self-listed per ADR-0006 D8 strict-whitelist.

NEW vitest suites run under `pnpm --filter @skb/editor-shell test` +
`pnpm --filter @skb/block-foundation test`. NO new npm dependency
(vitest + happy-dom + @testing-library/react ALREADY devDep'd at
editor-shell A2; vitest at block-foundation since Wave 1; reuses).

The 8 `@skb/block-*` packages are NOT touched (resize is editor-side
host concern per ADR-0017 + ADR-0016 D11). `@skb/mdx-bridge` is NOT
touched (C.2-3.5 hard-throw end-state already locked at squash
`b019a31`). `@skb/heavy-block-boundary` is NOT touched. `apps/site/`
is NOT touched (C.2-3 / Stage C.4 scope). NO change to design-tokens
(C.3 scope; ADR-0017 D11 token integration deferred to Stage C.3).
NO sample MDX backfill (C.2-3.5 / C.2-9 scope). NO new ADR file (D2
row 4 NOT hit per Wave 5 plan v1.1 §497-516 ROW 4 门槛规则;
`effectiveColSnaps` was ALREADY-LOCKED at ADR-0016 D6 Q4 absorbtion
Pre-A2 — this PR is the IMPLEMENTATION not the D-list amendment;
ADR-0017 D9 already authorises col-ruler + size-tooltip surface).

LOCKED implementation path: **ADR-0016 D6 Q4 absorbtion verbatim
mapping** for `effectiveColSnaps` (12 → `[2,3,4,6,8,12]`; 6 →
`[2,3,6]`; 1 → `[1]`); **ADR-0017 D9 verbatim** for col-ruler stop
emission + size-tooltip cursor-offset + fraction string + mobile
1-col view-only branch. Path "ship resize-handle DOM emission OR
pointer event wiring OR layoutReducer mutation now" is
**EXPLICITLY FORBIDDEN** in this PR (reason in Risk register row 1;
LOC budget would balloon ≥ 800 LOC, scope creeps into C.2-8 territory
per Wave 5 plan v1.1 row C.2-8).

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

10 canonical files at PLAN time. NO `package.json` change (no new
dep; all needed devDeps already at A2 / Wave 1 lock). NO
`pnpm-lock.yaml` change. NO `tsconfig.json` change (no new path or
reference; `@skb/block-foundation` already declared as runtime dep
+ tsconfig reference at A3). NO change to the 8 `@skb/block-*`
packages. NO change to `@skb/mdx-bridge`. NO change to
`@skb/heavy-block-boundary`. NO change to `@skb/kernel-*` (3
packages). NO change to `apps/site/**`. NO change to
`packages/design-tokens/**`. NO new ADR file (D2 row 4 NOT hit per
Wave 5 plan v1.1 §497-516 ROW 4 门槛规则; `effectiveColSnaps`
already authorised by ADR-0016 D6 Q4; col-ruler + size-tooltip
already authorised by ADR-0017 D9). PR.md self-listed.

Whitelist (exhaustive; codex executor MUST stage exactly these 10
paths and no others — per ADR-0006 D8 explicit-file-list staging
discipline + memory `feedback_git_operator_explicit_stage`):

1. `packages/block-foundation/src/grid-math.ts` (MODIFIED — add
   `effectiveColSnaps`)
2. `packages/block-foundation/CONTRACT.md` (MODIFIED — add
   `effectiveColSnaps` bullet to `## Public surface`)
3. `packages/block-foundation/src/__tests__/grid-math.test.ts`
   (NEW or MODIFIED — depends on C.2-2 squash `b15ba24` state;
   codex executor checks at exec time and either modifies or
   creates the file)
4. `packages/editor-shell/src/resize/col-ruler.tsx` (NEW)
5. `packages/editor-shell/src/resize/size-tooltip.tsx` (NEW)
6. `packages/editor-shell/src/__tests__/resize/col-ruler.test.tsx`
   (NEW)
7. `packages/editor-shell/src/__tests__/resize/size-tooltip.test.tsx`
   (NEW)
8. `packages/editor-shell/src/index.ts` (MODIFIED — barrel additions)
9. `packages/editor-shell/CONTRACT.md` (MODIFIED — new
   `### Resize layer (C.2-6)` subsection)
10. `docs/plans/wave-5-main/C.2-6-resize-ux.md` (NEW; this PR.md)

## test_cases

TDD-front authoritative list. Each test case names a vitest `it(...)`
description (input fixture + expected assertion + file location). The
TDD-front discipline per ADR-0011 D1 stage 2 + memory
`feedback_codex_spark_lint_gap` requires the codex-generic-executor
to **land all test files first** (red), then implementation files
(green), verifying via `pnpm --filter @skb/block-foundation test` +
`pnpm --filter @skb/editor-shell test`.

### Suite 1: `packages/block-foundation/src/__tests__/grid-math.test.ts` (`effectiveColSnaps` cases — append to existing C.2-2 file)

4 test cases per ADR-0016 D6 Q4 absorbtion verbatim mapping:

1. **TC1.1 — `effectiveColSnaps(12)` returns `[2, 3, 4, 6, 8, 12]`**
   (ADR-0016 D6 Q4 line 259). Input: `effectiveColSnaps(12)`.
   Expected: `expect(effectiveColSnaps(12)).toEqual([2, 3, 4, 6, 8, 12])`.
   Location:
   `grid-math.test.ts > effectiveColSnaps > 12-col returns 6 stops`.

2. **TC1.2 — `effectiveColSnaps(6)` returns `[2, 3, 6]`**
   (ADR-0016 D6 Q4 line 260). Input: `effectiveColSnaps(6)`.
   Expected: `expect(effectiveColSnaps(6)).toEqual([2, 3, 6])`.
   Location:
   `grid-math.test.ts > effectiveColSnaps > 6-col returns 3 stops`.

3. **TC1.3 — `effectiveColSnaps(1)` returns `[1]`** (ADR-0016 D6 Q4
   line 261; mobile 1-col forced full). Input: `effectiveColSnaps(1)`.
   Expected: `expect(effectiveColSnaps(1)).toEqual([1])`. Location:
   `grid-math.test.ts > effectiveColSnaps > 1-col returns forced full`.

4. **TC1.4 — return value is readonly / immutable**. Input:
   `const r = effectiveColSnaps(12); /* attempt mutation */`.
   Expected: TypeScript `readonly number[]` typed and behaviour
   asserted via `expect(Object.isFrozen(r)).toBe(true)` (per
   `as const` literal-tuple immutability). Location:
   `grid-math.test.ts > effectiveColSnaps > result is readonly`.

(Suite 1 final count: 4 cases — TC1.1 to TC1.4. Existing
`grid-math.test.ts` C.2-2 cases preserved unchanged.)

### Suite 2: `packages/editor-shell/src/__tests__/resize/col-ruler.test.tsx`

8 test cases per ADR-0017 D9 spec:

1. **TC2.1 — 12-col activeStops renders 6 stop spans** (ADR-0017 D9
   line 311 + ADR-0016 D6 Q4 12-col mapping). Input:
   `<ColRuler activeStops={[2,3,4,6,8,12]} hoveredStop={null}
   totalCols={12} />`. Expected: rendered tree contains exactly 6
   span elements (HTML `span` tag) with class
   `skb-col-ruler-stop`. Location:
   `col-ruler.test.tsx > ColRuler > 12-col renders 6 stops`.

2. **TC2.2 — 6-col activeStops renders 3 stop spans**. Input:
   `<ColRuler activeStops={[2,3,6]} hoveredStop={null} totalCols={6} />`.
   Expected: 3 stop spans. Location:
   `col-ruler.test.tsx > ColRuler > 6-col renders 3 stops`.

3. **TC2.3 — 1-col mobile path returns null** (ADR-0017 D9 line 326
   col-ruler hide). Input: `<ColRuler activeStops={[1]} hoveredStop={null}
   totalCols={1} />`. Expected: rendered output is `null` (no DOM
   emitted; assert via `expect(container.firstChild).toBeNull()`).
   Location:
   `col-ruler.test.tsx > ColRuler > 1-col mobile returns null`.

4. **TC2.4 — `hoveredStop = 6` applies active class on matching span**
   (ADR-0017 D9 line 311 stop highlight). Input: `<ColRuler
   activeStops={[2,3,4,6,8,12]} hoveredStop={6} totalCols={12} />`.
   Expected: exactly 1 element with class
   `skb-col-ruler-stop--active`; that element corresponds to the
   stop value 6. Location:
   `col-ruler.test.tsx > ColRuler > hoveredStop applies active class`.

5. **TC2.5 — `hoveredStop = null` applies no active modifier**.
   Input: same as TC2.1 but `hoveredStop={null}`. Expected: zero
   elements with `--active` modifier. Location:
   `col-ruler.test.tsx > ColRuler > null hoveredStop no active class`.

6. **TC2.6 — `hoveredStop` not in `activeStops` is a graceful no-op**
   (defensive rendering). Input: `<ColRuler activeStops={[2,3,4,6,8,12]}
   hoveredStop={5} totalCols={12} />` (5 is not in `activeStops`).
   Expected: render does not throw; zero elements with `--active`
   modifier. Location:
   `col-ruler.test.tsx > ColRuler > unknown hoveredStop no-op`.

7. **TC2.7 — Default `gap = 14` when omitted**. Input: `<ColRuler
   activeStops={[2,3,4,6,8,12]} hoveredStop={null} totalCols={12} />`
   (gap omitted). Expected: rendered DOM (or component prop /
   inline-style audit) reflects `gap === 14` default behaviour
   (assertion approach: snapshot of stop layout positions or assert
   via inline style `--gap: 14px` if applied). Location:
   `col-ruler.test.tsx > ColRuler > default gap is 14`.

8. **TC2.8 — Unmount cleanup leaves no DOM nodes**. Input: render
   then `unmount()`. Expected: no DOM nodes attached to
   `document.body` post-unmount. Location:
   `col-ruler.test.tsx > ColRuler > unmount cleanup leaves no nodes`.

(Suite 2 final count: 8 cases — TC2.1 to TC2.8.)

### Suite 3: `packages/editor-shell/src/__tests__/resize/size-tooltip.test.tsx`

12 test cases per ADR-0017 D9 spec + `colSpanToFraction` mapping
table:

1. **TC3.1 — `fraction = '1/2'` no `rowSpan` renders text `'1/2'`**
   (ADR-0017 D9 line 312 fraction string). Input: `<SizeTooltip
   cursorX={100} cursorY={50} fraction="1/2" />`. Expected: rendered
   text content is exactly `'1/2'` (no rowSpan suffix). Location:
   `size-tooltip.test.tsx > SizeTooltip > fraction only no rowSpan`.

2. **TC3.2 — `fraction = 'full'` `rowSpan = 3` renders text
   `'full · 3 rows'`** (ADR-0017 D9 line 312 "y 轴拖时加 '· N rows'").
   Input: `<SizeTooltip cursorX={100} cursorY={50} fraction="full"
   rowSpan={3} />`. Expected: rendered text content includes both
   `'full'` and `'· 3 rows'` (separator middot per locked verbatim
   spec). Location:
   `size-tooltip.test.tsx > SizeTooltip > fraction with rowSpan suffix`.

3. **TC3.3 — Inline style `position: fixed`** (ADR-0017 D9 line 312
   "fixed 浮在 cursor 右上角"). Input: same as TC3.1. Expected: root
   element inline `style.position === 'fixed'`. Location:
   `size-tooltip.test.tsx > SizeTooltip > position is fixed`.

4. **TC3.4 — Inline style `left = cursorX + 12`** (cursor + 12px
   right offset per locked spec). Input: `cursorX = 100`. Expected:
   inline `style.left === '112px'` (12px horizontal offset from
   cursor). Location:
   `size-tooltip.test.tsx > SizeTooltip > left is cursorX plus 12`.

5. **TC3.5 — Inline style `top = cursorY - 8`** (cursor − 8px up
   offset per locked spec). Input: `cursorY = 50`. Expected: inline
   `style.top === '42px'` (8px vertical offset above cursor).
   Location:
   `size-tooltip.test.tsx > SizeTooltip > top is cursorY minus 8`.

6. **TC3.6 — `colSpanToFraction(12, 12) === 'full'`** (ADR-0017 D9
   line 312 verbatim `'full'`). Input: `colSpanToFraction(12, 12)`.
   Expected: `'full'`. Location:
   `size-tooltip.test.tsx > colSpanToFraction > 12 of 12 is full`.

7. **TC3.7 — `colSpanToFraction(8, 12) === '2/3'`**. Input:
   `colSpanToFraction(8, 12)`. Expected: `'2/3'`. Location:
   `size-tooltip.test.tsx > colSpanToFraction > 8 of 12 is 2/3`.

8. **TC3.8 — `colSpanToFraction(6, 12) === '1/2'` and
   `colSpanToFraction(4, 12) === '1/3'` and
   `colSpanToFraction(3, 12) === '1/4'` and
   `colSpanToFraction(2, 12) === '1/6'`** (12-col ladder per
   ADR-0016 D6 v0.3 user共识 line 250). 4 sub-assertions in one
   `it(...)` block. Location:
   `size-tooltip.test.tsx > colSpanToFraction > 12-col ladder fractions`.

9. **TC3.9 — `colSpanToFraction(6, 6) === 'full'`** (6-col forced
   full). Input: `colSpanToFraction(6, 6)`. Expected: `'full'`.
   Location:
   `size-tooltip.test.tsx > colSpanToFraction > 6 of 6 is full`.

10. **TC3.10 — `colSpanToFraction(3, 6) === '1/2'` and
    `colSpanToFraction(2, 6) === '1/3'`** (6-col ladder). 2
    sub-assertions in one `it(...)` block. Location:
    `size-tooltip.test.tsx > colSpanToFraction > 6-col ladder fractions`.

11. **TC3.11 — `colSpanToFraction(1, 1) === 'full'`** (1-col mobile
    forced full). Input: `colSpanToFraction(1, 1)`. Expected:
    `'full'`. Location:
    `size-tooltip.test.tsx > colSpanToFraction > 1 of 1 is full`.

12. **TC3.12 — out-of-table (colSpan, totalCols) throws** (defensive).
    Input: `colSpanToFraction(5, 12)` (5 not in 12-col COL_SNAPS).
    Expected: throws `Error`. Location:
    `size-tooltip.test.tsx > colSpanToFraction > out of table throws`.

(Suite 3 final count: 12 cases — TC3.1 to TC3.12.)

**Suite total: 4 + 8 + 12 = 24 vitest cases**. All MUST PASS at AC#15
(`pnpm --filter @skb/block-foundation test` + `pnpm --filter
@skb/editor-shell test` both exit 0).

## contracts_affected

- `packages/block-foundation/CONTRACT.md` — **MODIFIED** (one-line
  bullet add for `effectiveColSnaps(viewportCols)` to the
  `## Public surface` section per ADR-0016 D6 Q4 absorbtion
  authority + Wave 5 D6 invariant). D2 row 1 hit. Per ADR-0016
  §502 sister-doc-sync — same-PR-with-implementation site for the
  `effectiveColSnaps` public surface bullet.

- `packages/editor-shell/CONTRACT.md` — **MODIFIED** (NEW subsection
  `### Resize layer (C.2-6)` added under the existing `## Grid
  layout (Wave 5)` section, parallel to the C.2-5
  `### Drag/Drop layer (C.2-5)` subsection). D2 row 1 hit
  (CONTRACT.md change). Per ADR-0017 §502 sister-doc-sync — this PR
  is the documented same-PR-with-implementation sync site for the
  resize public surface (2-module export anchor +
  `effectiveColSnaps` consumer pattern + cross-package consumer
  parity declaration to `apps/site/src/styles/grid.css` `--gap: 14px`
  C.2-3 authority + `@skb/block-foundation` `DEFAULT_GRID_GEOMETRY.gap`
  C.2-2 authority + `@skb/editor-shell` `drag-drop/edge-rects.ts`
  `GAP = 14` C.2-5 authority).

- `packages/mdx-bridge/CONTRACT.md` — **NOT** modified. C.2-3.5
  hard-throw flip end-state already locked at squash `b019a31`;
  C.2-6 cites the v1.1 plan amendment + the C.2-3.5 squash as the
  contract-active end-state in its CONTRACT.md resize subsection
  Q2 v1.1 absorbtion downstream-must-not-reuse note.

- `apps/site/CONTRACT.md` — **NOT** modified. C.2-3 already shipped
  the `## Grid layout (Wave 5)` section with `.skb-grid` selector
  authority + 12/6/1 breakpoint table + `--gap: 14px` CSS variable
  at PR squash `2586328`. C.2-6 cross-references
  `apps/site/src/styles/grid.css` line 12 as one of the four
  cross-package consumer parity sources for the `gap = 14` default
  in the col-ruler component but does NOT modify
  `apps/site/CONTRACT.md` (consumer side only).

- `packages/heavy-block-boundary/CONTRACT.md` — **NOT** modified
  (C.2-7 scope; ADR-0014 v0.5 amendment).

- `packages/design-tokens/**` — **NOT** modified. ADR-0017 D9
  `oklch(58% 0.16 35 / 0.4)` stop-highlight color is deferred to
  ADR-0018 (Pre-A4) Stage C.3 token migration. C.2-6 ships only the
  structural CSS class names (`skb-col-ruler`, `skb-col-ruler-stop`,
  `skb-col-ruler-stop--active`, `skb-size-tooltip`) without token
  values; downstream Stage C.3 PR will style them.

- 8 `@skb/block-*` CONTRACT.md files — **NOT** modified (resize is a
  host-side concern per ADR-0017 + ADR-0016 D11 Tiptap inside / grid
  outside 分层).

D2 row 5 (boundary contract change) hit because the new
`packages/editor-shell/CONTRACT.md` `### Resize layer (C.2-6)`
subsection codifies the editor-side resize public surface that
downstream consumers will depend on:

- C.2-8 (layoutReducer + resize-handle DOM emission + pointer event
  wiring) consumes `colSpanToFraction` as the display-string source
  for resize feedback during active drag-resize event loop; consumes
  `ColRuler` + `SizeTooltip` as the visual feedback components mounted
  during resize phase.
- C.2-9 (responsive 12/6/1 transition reducer) consumes
  `effectiveColSnaps(viewportCols)` from `@skb/block-foundation` for
  the T1 colSpan adapt path per ADR-0016 D5 line 217 (block-foundation
  authority + editor-shell consumer).
- Stage C.4 wire-up at `apps/site/src/pages/notes/[slug]/edit.astro`
  mount site consumes `ColRuler` + `SizeTooltip` React components +
  the cross-package `--gap: 14px` parity constraint via the new
  CONTRACT.md prose.

Plus D2 row 1 hit on BOTH `@skb/block-foundation/CONTRACT.md` AND
`@skb/editor-shell/CONTRACT.md` (rare double-row-1 hit; both
public-surface anchors codify new exports in the same PR).

PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES.

## adr_touched

NONE (D2 row 4 NOT hit per Wave 5 plan v1.1 §497-516 ROW 4 门槛规则).
ADR-0016 D6 Q4 absorbtion (line 254-263 `effectiveColSnaps` mapping)
+ ADR-0017 D9 (line 308-331 col-ruler + size-tooltip + mobile 1-col
view-only) already authorise the entire surface (Pre-A2 ADR-0016 lock
+ Pre-A3 ADR-0017 lock; both squashes already merged before Wave 5
plan v1.1 amendment 2026-05-04). PR cites ADR-0016 D6 Q4 + ADR-0017
D9 anchors in source JSDoc + CONTRACT.md resize subsection + this
PR.md but does NOT amend either ADR.

ADR-0017 D8 (Esc cancel) + D10 (drag-ghost) + D11 (drop-pulse) +
D12 (layoutEpoch reducer) are deferred to C.2-8 (per Wave 5 plan
v1.1 row C.2-8) — out of scope here. Forward-pointers in source +
CONTRACT.md note the deferral.

ADR-0017 D9 resize-handle DOM emission rules (line 319-322 — kind-
based handle visibility for `right` / `bottom` / `corner` handles) +
mobile 1-col disable path (line 324-329 — handle / col-ruler /
size-tooltip / drag-handle hide) are partially in scope here:
- IN SCOPE: col-ruler render path returns `null` when `totalCols
  === 1`; size-tooltip pure component (consumer chooses when to
  render); pure render-time visual primitives only.
- OUT OF SCOPE: resize-handle DOM emission per kind; pointer event
  wiring; `.skb-grid--mobile` className state machine; deferred to
  C.2-8 + C.2-9 per Wave 5 plan v1.1.

ADR-0016 D11 (Tiptap inside / grid outside 分层) + W5-1 invariant
`BlockGridPosition` shape consumer + D5 mobile 1-col forced path +
D6 COL_SNAPS authority are all referenced by the C.2-6 resize
layer — not amended.

ADR-0018 (v2 visual migration) Pre-A4 design-lock owns the design
tokens (`--accent-soft` consumed by the eventual styled col-ruler
stop highlight); C.2-6 ships only structural class name +
`oklch(...)` inline literal — not amended.

ADR-0014 v0.5 amendment (heavy-block boundary
`heavyBoundaryDimensions` 联动 colSpan / rowSpan during resize) is
on the C.2-7 row — out of scope here.

ADR-0006 class 6 (sister-doc sync) is operationally satisfied (NOT
amended).

**Wave 5 plan v1.1 row C.2-3.5 hard-throw flip** is referenced as the
contract-active end-state anchor for the resize layer's
`_gridAttrsExplicit` mechanical-guard prose (per AC#13; per
CONTRACT.md new subsection); this PR.md cites the v1.1 amendment +
C.2-3.5 squash `b019a31` but does NOT amend the plan or the ADR.

## acceptance

16 verifiable acceptance criteria. Each is a single shell command
producing an objectively checkable result. ACCEPT-stage pr-writer
(D1 stage 6) re-runs all 16 against the post-commit working tree.

### AC#1 — `effectiveColSnaps` exported from block-foundation grid-math.ts

```bash
test -f packages/block-foundation/src/grid-math.ts && \
  grep -F 'export function effectiveColSnaps' \
    packages/block-foundation/src/grid-math.ts | wc -l
```

Expected: `≥ 1`. Verifies the new helper exists at the locked
authority site (block-foundation per ADR-0016 D6 Q4).

### AC#2 — `effectiveColSnaps` mapping byte-equal to ADR-0016 D6 Q4

```bash
grep -F '[2, 3, 4, 6, 8, 12]' packages/block-foundation/src/grid-math.ts | wc -l
grep -F '[2, 3, 6]' packages/block-foundation/src/grid-math.ts | wc -l
grep -E '\[1\][^,]' packages/block-foundation/src/grid-math.ts | wc -l
```

Expected: each `≥ 1`. Verifies the verbatim 12-col / 6-col / 1-col
mapping per ADR-0016 D6 Q4 lines 259-261. (Mobile 1-col returns
`[1]` per ADR verbatim, not `[]`.)

### AC#3 — `block-foundation/CONTRACT.md` lists `effectiveColSnaps` in `## Public surface`

```bash
grep -F 'effectiveColSnaps' packages/block-foundation/CONTRACT.md | wc -l
```

Expected: `≥ 1`. Verifies the public-surface bullet add.

### AC#4 — `col-ruler.tsx` exists + exports `ColRuler` + `ColRulerProps`

```bash
test -f packages/editor-shell/src/resize/col-ruler.tsx && \
  grep -F 'export function ColRuler' \
    packages/editor-shell/src/resize/col-ruler.tsx | wc -l && \
  grep -E '^export (interface|type) ColRulerProps' \
    packages/editor-shell/src/resize/col-ruler.tsx | wc -l
```

Expected: each `≥ 1`. Verifies the React component + props type.

### AC#5 — `size-tooltip.tsx` exists + exports `SizeTooltip` + `SizeTooltipProps` + `colSpanToFraction`

```bash
test -f packages/editor-shell/src/resize/size-tooltip.tsx && \
  grep -F 'export function SizeTooltip' \
    packages/editor-shell/src/resize/size-tooltip.tsx | wc -l && \
  grep -E '^export (interface|type) SizeTooltipProps' \
    packages/editor-shell/src/resize/size-tooltip.tsx | wc -l && \
  grep -F 'export function colSpanToFraction' \
    packages/editor-shell/src/resize/size-tooltip.tsx | wc -l
```

Expected: each `≥ 1`. Verifies the file + 3 named exports.

### AC#6 — col-ruler `oklch(58% 0.16 35 / 0.4)` stop-highlight color cited verbatim per ADR-0017 D9

```bash
grep -F 'oklch(58% 0.16 35 / 0.4)' \
  packages/editor-shell/src/resize/col-ruler.tsx | wc -l
```

Expected: `≥ 1`. Verifies the ADR-0017 D9 line 311 verbatim color
literal is present in the source (forward-pointer to ADR-0018 + Stage
C.3 token migration also expected as JSDoc comment but is harder to
grep cleanly; AC#6 covers the literal).

### AC#7 — `colSpanToFraction` 'full' token cited verbatim per ADR-0017 D9

```bash
grep -F "'full'" packages/editor-shell/src/resize/size-tooltip.tsx | wc -l
```

Expected: `≥ 1`. Verifies the `'full'` lowercase ASCII string literal
is present (NOT `'1'` or `'12 cols'`) — per ADR-0017 D9 line 312
verbatim `'1/2', '2/3', 'full'` examples.

### AC#8 — All 3 source files (2 NEW + 1 MODIFIED) cite ADR-0017 D9 OR ADR-0016 D6 in JSDoc

```bash
grep -F 'ADR-0016' packages/block-foundation/src/grid-math.ts | wc -l
grep -F 'ADR-0017' packages/editor-shell/src/resize/col-ruler.tsx | wc -l
grep -F 'ADR-0017' packages/editor-shell/src/resize/size-tooltip.tsx | wc -l
```

Expected: each `≥ 1`. Verifies file-head JSDoc cross-references to
the authoritative ADRs (per ADR-0006 class 6 sister-doc sync). Note:
`grid-math.ts` likely already cites ADR-0016 from the C.2-2 authoring;
the new `effectiveColSnaps` JSDoc adds at minimum a D6 Q4 cite.

### AC#9 — `index.ts` barrel re-exports resize public surface

```bash
grep -F 'ColRuler' packages/editor-shell/src/index.ts | wc -l
grep -F 'SizeTooltip' packages/editor-shell/src/index.ts | wc -l
grep -F 'colSpanToFraction' packages/editor-shell/src/index.ts | wc -l
```

Expected: each `≥ 1`. Verifies the barrel re-exports landed (5
identifiers across 3 lines: `ColRuler`, `ColRulerProps`,
`SizeTooltip`, `SizeTooltipProps`, `colSpanToFraction`; the 3 grep
keywords cover them all).

### AC#10 — `index.ts` preserves existing 16 exports (no regression)

```bash
grep -F 'EditorShell' packages/editor-shell/src/index.ts | wc -l
grep -F 'registerBlocks' packages/editor-shell/src/index.ts | wc -l
grep -F 'registerKernels' packages/editor-shell/src/index.ts | wc -l
grep -F 'saveToMdx' packages/editor-shell/src/index.ts | wc -l
grep -F 'loadFromMdx' packages/editor-shell/src/index.ts | wc -l
grep -F 'proseExtensions' packages/editor-shell/src/index.ts | wc -l
grep -F 'GridContainer' packages/editor-shell/src/index.ts | wc -l
grep -F 'useAutoRowSpan' packages/editor-shell/src/index.ts | wc -l
grep -F 'computeEdgeRects' packages/editor-shell/src/index.ts | wc -l
grep -F 'tiebreak' packages/editor-shell/src/index.ts | wc -l
grep -F 'OutlineOverlay' packages/editor-shell/src/index.ts | wc -l
```

Expected: each `≥ 1`. Verifies no regression on the prior A2-A5 +
C.2-4 + C.2-5 = 16 exports (EditorShell + EditorShellProps +
registerBlocks + registerKernels + saveToMdx + loadFromMdx +
SaveLoadOptions + proseExtensions + GridContainer + GridContainerProps
+ useAutoRowSpan + EDGE_W + GAP + EdgeRect + BlockLayout +
computeEdgeRects + EdgeMatch + DragVelocity + tiebreak + findMatches
+ OutlineOverlay + OutlineOverlayProps).

### AC#11 — `editor-shell/CONTRACT.md` has `### Resize layer (C.2-6)` subsection

```bash
grep -E '^### Resize layer \(C\.2-6\)' \
  packages/editor-shell/CONTRACT.md | wc -l
```

Expected: `≥ 1`. Verifies the new subsection header is present
under the existing `## Grid layout (Wave 5)` section, parallel to
the C.2-5 `### Drag/Drop layer (C.2-5)` subsection.

### AC#12 — `editor-shell/CONTRACT.md` cross-package parity prose

```bash
grep -F 'apps/site/src/styles/grid.css' \
  packages/editor-shell/CONTRACT.md | wc -l
grep -F 'DEFAULT_GRID_GEOMETRY.gap' \
  packages/editor-shell/CONTRACT.md | wc -l
```

Expected: each `≥ 1`. Verifies the cross-package consumer parity
prose listing the four authority sites (`apps/site/src/styles/grid.css`
`--gap: 14px` + `@skb/block-foundation` `DEFAULT_GRID_GEOMETRY.gap` +
`@skb/editor-shell` `drag-drop/edge-rects.ts` `GAP = 14` + the new
col-ruler `gap` parameter default 14) per memory
`feedback_cross_package_consumer_pattern`.

### AC#13 — Resize source has NO `_gridAttrsExplicit` symbol (Q2 v1.1 mechanical guard)

```bash
grep -RF '_gridAttrsExplicit' packages/editor-shell/src/resize/ | wc -l
```

Expected: `0`. Verifies the C.2-1 to C.2-3 era mdx-bridge defensive-
default marker is NOT referenced from the new resize modules (per
Wave 5 plan v1.1 R14 absorbtion amendment 2026-05-05; C.2-4 + C.2-5
established the same-pattern mechanical guard, C.2-6 extends it to
the resize layer).

### AC#14 — `editor-shell/CONTRACT.md` cites Wave 5 plan v1.1 row C.2-3.5

```bash
grep -F 'C.2-3.5' packages/editor-shell/CONTRACT.md | wc -l
```

Expected: `≥ 3` (one from C.2-4 prior section, one from C.2-5
drag/drop subsection, one from C.2-6 new resize subsection).
Verifies the Q2 v1.1 absorbtion downstream-must-not-reuse 锁
(CRITICAL constraint on hard-throw end-state at squash `b019a31`).

### AC#15 — `pnpm --filter @skb/block-foundation test` + `pnpm --filter @skb/editor-shell test` PASS

```bash
pnpm --filter @skb/block-foundation test
pnpm --filter @skb/editor-shell test
```

Expected: both exit 0. All existing test cases continue to PASS plus
the 4 new `effectiveColSnaps` cases in `grid-math.test.ts` + 8 new
`col-ruler.test.tsx` cases + 12 new `size-tooltip.test.tsx` cases =
24 new vitest cases. No skipped tests.

### AC#16 — `pnpm check:affected` PASS (lint + typecheck + test + build + size)

```bash
pnpm check:affected
```

Expected: exit 0. Lint + typecheck + test + build + size-check all
PASS for `@skb/block-foundation` + `@skb/editor-shell` + any package
transitively affected. Per memory `feedback_codex_spark_lint_gap`
— orchestrator independently runs `pnpm --filter @skb/editor-shell
lint` to catch lint-only issues; per memory
`feedback_git_operator_ci_verification` — uncached `pnpm --filter
@skb/editor-shell typecheck` is also re-run independently because
turbo cache + vitest miss tsc errors.

PR.md self-listed in this whitelist (AC#16 + listed in the
`## files` section as item 10) per ADR-0006 D8.

## verification required

The following commands run by orchestrator-self at D1 stage 4
(PRE-COMMIT CLAUDE REVIEW) and re-run by pr-writer at D1 stage 6
(ACCEPT). All 16 ACs (above) plus the D1 stage-3 codex-pr-reviewer-55
8-class checklist, plus the following augmented checks:

- `pnpm --filter @skb/block-foundation typecheck` PASS (uncached;
  per memory `feedback_git_operator_ci_verification`).
- `pnpm --filter @skb/editor-shell typecheck` PASS (uncached).
- `pnpm --filter @skb/block-foundation lint` PASS (per memory
  `feedback_codex_spark_lint_gap`).
- `pnpm --filter @skb/editor-shell lint` PASS.
- `pnpm --filter @skb/block-foundation build` PASS — `dist/`
  regenerates with `effectiveColSnaps` typed emit.
- `pnpm --filter @skb/editor-shell build` PASS — `dist/` regenerates
  with the 2 new resize modules typed emit.
- `pnpm size-check` PASS — every new source file under 500 LOC
  (col-ruler.tsx ~120 / size-tooltip.tsx ~100; both well under cap).
- `git diff --cached --stat` post-staging shows exactly the 10
  whitelisted files (no incidental snapshot / `pnpm-lock.yaml` /
  cache contamination — per memory
  `feedback_git_operator_explicit_stage`).
- Cross-package consumer parity check (per memory
  `feedback_cross_package_consumer_pattern`):

  ```bash
  grep -F 'gap = 14' packages/block-foundation/src/grid-math.ts
  grep -F 'GAP = 14' packages/editor-shell/src/drag-drop/edge-rects.ts
  grep -F -- '--gap: 14px' apps/site/src/styles/grid.css
  ```

  All three must produce a hit — algorithmic constants are
  byte-equal at source authorities.
- Manual sanity (post-build): no consumer wire-up at C.2-6 (the
  resize UX layer mount site lands at C.2-8 reducer wiring + C.4
  Stage wire-up per Wave 5 plan v1.1); editor-shell standalone
  build verifies the API surface is well-formed.
- Post-merge auto-merge-script verification (per memory
  `feedback_gh_pr_ci_conclusion_vs_status`): orchestrator post-merge
  CI verification MUST use `gh run view --json conclusion` parsing
  `conclusion === "SUCCESS"` (NOT `status === "COMPLETED"` which
  marks runs that may have failed). See `## executor` Stage 7
  ACCEPT note.

## Plan-challenger absorbtion

NOT APPLICABLE for an implementation PR per ADR-0011 D7. The Wave 5
plan v1.1 row C.2-6 + ADR-0017 D9 + ADR-0016 D6 Q4 absorbtion notes
+ ADR-0006 8-class audit checklist are the authoritative inputs. No
plan-challenger dispatch occurred at PLAN stage; the Wave 5 plan was
already plan-challenger-vetted at Pre-A5 lock + v1.1 R14 amendment
2026-05-05; ADR-0017 was already plan-challenger-vetted at Pre-A3
lock; ADR-0016 D6 Q4 absorbtion was already plan-challenger-vetted
at Pre-A2 lock.

**Open questions surfaced during PLAN draft** (none blocking lock;
all resolved IN FAVOR of the PLAN as written):

- Should `effectiveColSnaps(1)` return `[1]` or `[]`? **Resolved**:
  `[1]` per ADR-0016 D6 Q4 line 261 verbatim mapping (`return [1]
  as const; // forced full (1-col mobile path)`). The orchestrator
  briefing hint suggested `[]` (mobile view-only), but the ADR says
  `[1]`. The semantic is consistent: `effectiveColSnaps(viewportCols)`
  answers "what colSpan values are valid in this viewport" — for
  1-col mobile, the only valid colSpan is 1 (forced full). The
  separate question "do we render a col-ruler UI" is answered by the
  col-ruler component returning `null` on `totalCols === 1` (per
  ADR-0017 D9 line 326). The two layers are orthogonal.

- Should `colSpanToFraction(12, 12)` return `'full'`, `'1'`, or
  `'12 cols'`? **Resolved**: `'full'` per ADR-0017 D9 line 312
  verbatim `'1/2', '2/3', 'full'` examples. `'1'` would conflict
  with the fraction string format (`'1/N'` parses as one-Nth, not
  whole). `'12 cols'` would be verbose + locale-dependent. `'full'`
  is the locked value.

- Should `colSpanToFraction` accept any `(colSpan, totalCols)` pair
  or only the `effectiveColSnaps` set? **Resolved**: throws on
  out-of-table inputs per locked spec (defensive). Callers only
  ever produce in-table values via `effectiveColSnaps`; out-of-
  table input signals a logic bug and surfaces fail-loud.

- Should the size-tooltip cursor offset be locked at `+12px / -8px`
  or use a different magnitude? **Resolved**: `+12px right / -8px up`
  per ADR-0017 D9 line 312 "fixed 浮在 cursor 右上角 (cursor +
  offset)" — `(+12, -8)` is the locked interpretation in this PR.
  The sign convention: positive `left` offset moves rightward
  (CSS coordinate); negative `top` offset moves upward (CSS
  coordinate `top` is from screen origin top, so smaller `top`
  = higher on screen). The choice of magnitude is small enough to
  hover near the cursor without obscuring the resize handle, large
  enough to clear the cursor sprite (~32px). Locked.

- Should the col-ruler mobile branch render the ruler with stops
  hidden, or return `null` entirely? **Resolved**: `return null`
  per ADR-0017 D9 line 326 "col-ruler hide". No DOM emitted at
  all. This is structurally cleaner than rendering an
  `aria-hidden` ruler with stops hidden; React reconciliation skips
  the entire subtree.

- Should `effectiveColSnaps` be re-exported via the `@skb/editor-shell`
  barrel? **Resolved**: NO — consumers import from
  `@skb/block-foundation` directly. The editor-shell barrel does
  re-export `proseExtensions` from block-foundation as legacy A2-era
  ergonomics, but the W5+ pattern is explicit imports from the
  authority package. AC#9 + AC#10 only check the editor-shell
  resize-layer surface (5 identifiers); `effectiveColSnaps` is
  consumed cross-package.

## R14 self-check

R14 = the 14-point pre-flight per ADR-0011 / Wave 5 plan §232 D12
"PR.md PLAN-stage validation":

1. Stage scope-fence — only files inside the locked Stage C.2-6
   whitelist (10 files; cross-package files NOT touched beyond the
   already-locked-helper `effectiveColSnaps` add to block-foundation).
   Row C.2-6 in plan v1.1 cites
   `packages/editor-shell/src/resize/{col-ruler,size-tooltip}.tsx`
   (NEW) + tests; this PR adds 2 source + 1 modified
   (`block-foundation/src/grid-math.ts`) + 3 test + 4 modified
   (block-foundation barrel via grid-math + 2 CONTRACT.md +
   editor-shell barrel) + PR.md self.

   **Scope expansion justification**: the `effectiveColSnaps` add
   to block-foundation is a single-package detail OF AN ALREADY-
   LOCKED HELPER per ADR-0016 D6 Q4 (Pre-A2 lock; R-fix lacuna at
   C.2-2 squash `b15ba24`). Per Wave 5 plan v1.1 D4 scope-refinement
   threshold: implementing an already-locked helper at its
   already-locked authority site IS NOT scope expansion — it is the
   IMPLEMENTATION of a Pre-A2 design decision. Alternative
   (implement locally in editor-shell) would violate ADR-0006 class
   4 single-authority + memory
   `feedback_cross_package_consumer_pattern`.

2. TDD-front discipline — `## test_cases` section enumerates 24
   vitest test cases (4 + 8 + 12) before any implementation file
   per ADR-0011 D1 stage 2; codex-generic-executor MUST land tests
   first (red), then impl (green).

3. Cross-package consumer parity — per memory
   `feedback_cross_package_consumer_pattern`. The `gap = 14` constant
   in 4 authority sites
   (`apps/site/src/styles/grid.css` `--gap: 14px` C.2-3 + 
   `@skb/block-foundation` `DEFAULT_GRID_GEOMETRY.gap` C.2-2 +
   `@skb/editor-shell` `drag-drop/edge-rects.ts` `GAP = 14` C.2-5 +
   the new C.2-6 `gap` parameter default) is byte-equal-checked at
   the verification block. Drift is the algorithmic-replication
   failure mode the memory codifies.

4. Q2 v1.1 mechanical guard — AC#13 grep proves zero
   `_gridAttrsExplicit` references in the new
   `packages/editor-shell/src/resize/` directory; CONTRACT.md
   subsection cites Wave 5 plan v1.1 row C.2-3.5 hard-throw flip
   end-state (squash `b019a31`).

5. Codex spark lint gap — per memory `feedback_codex_spark_lint_gap`
   — orchestrator-self runs `pnpm --filter @skb/block-foundation
   lint` + `pnpm --filter @skb/editor-shell lint` post-codex
   independently before authorising commit; verification block
   enumerates this.

6. Codex audit-log self-recursion — per memory
   `feedback_codex_audit_log_recursion` — codex executor invocation
   pipes audit log to `/tmp/codex-runs/...` first, NOT directly to
   `docs/audits/codex-runs/...`; orchestrator copies post-completion.

7. Lychee discipline — per memories
   `feedback_lychee_autolink_in_backticks` +
   `feedback_lychee_line_anchor` + `feedback_lychee_npmjs_403` +
   `feedback_lychee_user_local_paths`. PR.md uses no
   angle-bracketed-word-shape autolinks inside backticks; no
   `:line` suffix on file links; no `npmjs.com` URLs; no
   markdown-link tilde paths. Pre-empt grep:

   ```bash
   grep -nE '`[^`]*<\w+>[^`]*`' \
     docs/plans/wave-5-main/C.2-6-resize-ux.md
   ```

   Expected: zero matches. CI Lychee runs against the merged tree
   as canonical; orchestrator pre-empts locally.

8. WE-009 multi-worker lint contamination — per memory
   `feedback_multi_worker_lint_contamination`. C.2-6 is single-PR
   serial work (no concurrent worker B); standard lockfile
   isolation suffices. orchestrator runs `pnpm --filter
   @skb/block-foundation` + `pnpm --filter @skb/editor-shell`
   filtered scope to avoid neighbouring package lint contamination.

9. PR Reviewer authority at HEAD — per memory
   `feedback_pr_reviewer_authority_at_head`. ADR-0017 D9 + ADR-0016
   D6 Q4 + memory references are read at HEAD `2df71b6` for this
   PR.md draft; not from earlier review-report quotes.

10. WE-011 active-writer break WE-009 — per memory
    `feedback_active_writer_break_we009`. C.2-6 scope is
    `packages/block-foundation/` (1 helper add) + `packages/editor-shell/`
    (2 NEW modules + barrel + CONTRACT.md edit) only; siblings
    (`packages/block-*` / `packages/mdx-bridge` /
    `packages/heavy-block-boundary` / `apps/site/`) are quiescent
    for the duration of this PR.

11. WSL2 chromium launch — per memory
    `feedback_wsl2_chromium_launch`. C.2-6 vitest suite uses
    happy-dom (no Playwright); WSL2 chromium launch issue does NOT
    apply. Future C.2-8 + Stage C.4 PR may wire Playwright; not
    here.

12. Wave 3 main pipeline auto-merge — per memory
    `feedback_wave3_auto_merge`. orchestrator post-merge uses `gh
    pr merge --squash --delete-branch` once ACCEPT-PASS + all CI
    SUCCESS (with the post-merge `conclusion = "SUCCESS"`
    correctness check per memory
    `feedback_gh_pr_ci_conclusion_vs_status`).

13. R14 defer-chain — per memory
    `feedback_r14_defer_chain_plan_amendment`. C.2-6 is a fresh
    PR off main `2df71b6` (post C.2-5 merge); no defer-chain
    residue carried over. Open questions in
    `## Plan-challenger absorbtion` resolved IN FAVOR of plan; no
    follow-up tracked as residue.

14. gh PR CI conclusion vs status — per memory
    `feedback_gh_pr_ci_conclusion_vs_status`. The `## executor`
    Stage 7 ACCEPT block names `gh run view --json conclusion`
    parsing `conclusion === "SUCCESS"` (NOT `status === "COMPLETED"`);
    orchestrator post-merge auto-merge script will use the hardened
    pattern.

## D2 trigger judgment

ADR-0011 D2 v0.1.1 trigger row evaluation for C.2-6:

- **Row 1 (CONTRACT change)** — **HIT (double)**. BOTH
  `packages/block-foundation/CONTRACT.md` AND
  `packages/editor-shell/CONTRACT.md` modified in this PR.
  block-foundation: 1-bullet add for `effectiveColSnaps` to the
  `## Public surface` section. editor-shell: NEW
  `### Resize layer (C.2-6)` subsection under `## Grid layout (Wave 5)`
  parallel to C.2-5's `### Drag/Drop layer (C.2-5)` subsection. Per
  ADR-0016 §502 + ADR-0017 §502 sister-doc-sync — same-PR-with-
  implementation sync sites for both contracts.

- **Row 2 (package add/remove)** — **NOT HIT**. No new package; no
  package removal. `packages/editor-shell/src/resize/` is a new
  directory under the existing `@skb/editor-shell` package.

- **Row 3 (≥1 npm dep change)** — **NOT HIT**. NO `package.json` /
  `pnpm-lock.yaml` change. All needed devDeps already at A2 / Wave 1
  lock.

- **Row 4 (NEW ADR required)** — **NOT HIT** per Wave 5 plan v1.1
  §497-516 ROW 4 门槛规则. ADR-0016 D6 Q4 absorbtion (Pre-A2 lock)
  + ADR-0017 D9 (Pre-A3 lock) already authorise the entire surface.
  `effectiveColSnaps` was ALREADY-LOCKED at ADR-0016 D6 Q4
  absorbtion (C.2-2 squash `b15ba24` shipped 5 of 6 grid-math
  helpers; this PR adds the 6th + reorganizes the test file). No
  D-list amendment needed; no new ADR.

- **Row 5 (cross ≥3 packages OR boundary contract change)** — **HIT**.
  `packages/editor-shell/CONTRACT.md` boundary contract extended
  (resize layer public surface);
  `packages/block-foundation/CONTRACT.md` boundary contract
  extended (`effectiveColSnaps` public surface bullet). Resize
  layer is the editor-side consumer of `effectiveColSnaps` from
  `@skb/block-foundation` + the cross-package consumer parity to
  `apps/site/src/styles/grid.css` `--gap: 14px` (C.2-3 authority);
  downstream consumers C.2-8 (layoutReducer + resize-handle DOM) +
  C.2-9 (responsive reducer) + Stage C.4 (mount site wire-up)
  depend on this surface.

- **Row 6 (deploy / CI / security touched)** — **NOT HIT**. No CI
  config / deploy / auth change.

- **Row 7 (≥3 reviewers required)** — **NOT HIT** by file-count
  triage. C.2-6 is 10-file serial work; D1 stage 3
  codex-pr-reviewer-55 + D1 stage 4 PRE-COMMIT CLAUDE REVIEW
  (orchestrator-self) suffice.

- **Row 8 (high-risk class: deploy / auth / security)** — **NOT HIT**.

**Verdict**: Row 1 (double) + Row 5 HIT → **PRE-COMMIT CLAUDE
REVIEW (D1 stage 4) FIRES**. ADR-0006 8-point checklist mandatory
at codex review (D1 stage 3) per ADR-0011 D6. orchestrator runs
PRE-COMMIT CLAUDE REVIEW between stage 3 PASS and stage 5 commit
— same-model echo-chamber mitigation per ADR-0011 D2 design
rationale.

## Risk register

8 known risks — pre-flight mitigations enumerated. Stage 3 codex
review + Stage 4 PRE-COMMIT CLAUDE REVIEW evaluate each.

### Row 1 — resize-handle DOM emission + pointer event wiring premature shipping

**Risk**: codex-generic-executor pulls extra ADR-0017 D9 surface
forward into C.2-6 (resize handle `.gblock-handle.right` /
`.bottom` / `.corner` DOM emission per kind; pointer
`mousedown/move/up` event wiring; `.skb-grid--mobile` className
state machine). LOC budget balloons ≥ 800; scope creeps into
C.2-8 / C.2-9 row.

**Mitigation**: PR.md `## title` LOCKED implementation path block
explicitly forbids the over-eager scope. AC#13 + the file-list
whitelist constrain to 2 source modules + 1 helper add. Stage 3
codex review checks the diff stays inside the 10-file whitelist.
PR.md `## adr_touched` block enumerates explicit deferrals.

### Row 2 — `effectiveColSnaps(1)` returns `[]` instead of `[1]`

**Risk**: codex-generic-executor reads the orchestrator briefing
hint (`1 → [] (mobile view-only)`) instead of ADR-0016 D6 Q4 line
261 verbatim (`return [1] as const`). Mobile 1-col path then has
zero valid snaps + size-tooltip cannot resolve a fraction string
+ downstream `T1 colSpan adapt` (ADR-0016 D5) clamping breaks
because there is no snap to clamp to.

**Mitigation**: AC#2 grep `[1]` (single-element bracket regex).
TC1.3 vitest. Source JSDoc cites ADR-0016 D6 Q4 verbatim. PR.md
`## Plan-challenger absorbtion` Open Question #1 explicitly
documents the `[1]` decision + reasoning.

### Row 3 — `colSpanToFraction(12, 12)` returns `'1'` or `'12 cols'`

**Risk**: codex-generic-executor authors `'1'` (matching `1/1`
mathematical interpretation) or `'12 cols'` (verbose) instead of
`'full'` per ADR-0017 D9 line 312 verbatim. Downstream
size-tooltip text reads non-canonically; user UI feels
inconsistent across viewports.

**Mitigation**: TC3.6 + TC3.9 + TC3.11 all assert `'full'` for
12/12, 6/6, 1/1 inputs. AC#7 grep `'full'`. PR.md `##
Plan-challenger absorbtion` Open Question #2 explicitly documents
the `'full'` decision + reasoning.

### Row 4 — Mobile col-ruler renders DOM instead of returning null

**Risk**: codex authors a render path that emits an
`aria-hidden="true"` empty wrapper div for `totalCols === 1` instead
of returning `null`. Per ADR-0017 D9 line 326 "col-ruler hide" the
correct behavior is no DOM emission.

**Mitigation**: TC2.3 asserts `container.firstChild === null`.
Source JSDoc cites ADR-0017 D9 line 326 verbatim. PR.md `##
Plan-challenger absorbtion` Open Question #5 documents the
`return null` decision.

### Row 5 — Size-tooltip cursor-offset arithmetic sign error

**Risk**: codex authors `top: cursorY + 8` (downward offset) or
`left: cursorX - 12` (leftward offset) instead of `(cursorX + 12,
cursorY - 8)` (right + up offset per ADR-0017 D9 verbatim "cursor
+ offset" 右上角 — 右 means right, 上 means up). User cursor
overlap with tooltip + visual noise.

**Mitigation**: TC3.4 + TC3.5 assert exact arithmetic
(`'112px'` for cursor 100 + 12; `'42px'` for cursor 50 - 8). PR.md
`## Plan-challenger absorbtion` Open Question #4 documents the
sign convention reasoning (CSS top is screen-origin-from-top, so
smaller top = higher on screen).

### Row 6 — `_gridAttrsExplicit` mechanical guard fails post-codex

**Risk**: codex-generic-executor copies a snippet from `mdx-bridge/`
(C.2-1/C.2-2/C.2-3 era) that references `_gridAttrsExplicit`,
violating Q2 v1.1 absorbtion downstream-must-not-reuse rule.

**Mitigation**: AC#13 grep proves zero references in the new
resize directory. Stage 3 codex review + Stage 4 PRE-COMMIT CLAUDE
REVIEW both check.

### Row 7 — Lychee autolink-in-backticks regression in PR.md

**Risk**: PR.md prose contains an angle-bracketed-word shape
inside backticks. Lychee parses as autolink and fails the
link-check. Pre-empted by R14 self-check item 7 grep at PR.md
draft time.

**Mitigation**: R14 item 7 grep pre-empt; orchestrator scans
before push. PR.md author (this draft) self-checked: no
angle-bracketed-word-shape autolinks inside backticks. The
`<div class="..." />` JSX-style prose in test case sections
uses a single quote / backslash escape pattern — verify post-draft.

### Row 8 — Out-of-table `colSpanToFraction` input fails silently

**Risk**: codex authors a fall-through default (e.g., return
`'???'` or empty string `''`) instead of throwing on out-of-table
inputs. Downstream UI shows nonsense fraction string; the bug
surfaces only at user-facing visual; debug trace is mute.

**Mitigation**: TC3.12 asserts the fail-loud throw. Source JSDoc
documents the throw. PR.md `## Plan-challenger absorbtion` Open
Question #3 documents the defensive-throw decision.

## Out of scope

Explicitly out of scope per ADR-0017 D-list deferrals + Wave 5
plan v1.1 row C.2-7 / C.2-8 / C.2-9 / Stage C.3 / Stage C.4
enumeration:

- **Resize-handle DOM emission per kind** (`.gblock-handle.right`
  for all blocks at `effectiveCols >= 6`; `.bottom` / `.corner`
  only for `kind === 'render' | 'viz' | 'component'` excluding
  prose; ADR-0017 D9 line 319-322) — deferred to **C.2-8** per
  Wave 5 plan v1.1 row C.2-8 (the resize-handle DOM is co-mounted
  with the layoutReducer + drag/drop event-loop wiring).

- **Pointer event wiring** (`mousedown` on resize handle →
  `mousemove` cursor velocity → `mouseup` snap-and-commit; emits
  `layoutMutation { source: 'resize' }` per ADR-0017 D9 line 317)
  — deferred to **C.2-8**.

- **`.skb-grid--mobile` className state machine** (per ADR-0017 D9
  line 326 — `effectiveCols === 1` toggles
  `display: none` on resize handles + drag handles; per memory
  `feedback_active_writer_break_we009` siblings quiescent
  constraint) — deferred to **C.2-9** responsive transition
  reducer PR.

- **Snap-and-commit reducer path** (resize落定值 must snap to
  `effectiveColSnaps`; non-snap rejected per ADR-0016 D6 line 271
  "非 snap 值永远不入持久化"; UI displays snap反馈 + 方向记录 per
  ADR-0017 D9 line 314) — deferred to **C.2-8** (requires
  layoutReducer + drag-active flag).

- **Markdown rowSpan='auto' freeze during resize** (ADR-0017 D6
  Q7 absorbtion — `frozenRowSpan` snapshot at resize-start;
  ResizeObserver ignored during resize-over) — deferred to
  **C.2-8** (requires drag/resize-active flag).

- **`layoutReducer` + `layoutEpoch` impl** (ADR-0017 D12 +
  ADR-0016 D12) — deferred to **C.2-8**.

- **drag-ghost** (ADR-0017 D10) + **drop-pulse** (ADR-0017 D11) +
  **Esc cancel** (ADR-0017 D8) + **Source block lift mode**
  (ADR-0017 D6) — all deferred to **C.2-8** per Wave 5 plan v1.1
  row C.2-8.

- **Touch / mobile drag and resize** (touchstart/touchmove/
  touchend listeners; ADR-0017 D9 line 331 explicit OUT OF SCOPE
  for Wave 5; mobile is preview-mode + Tiptap content-edit only)
  — out of Wave 5 entirely; Phase 2+.

- **Token application** (`--accent`, `--accent-soft`,
  `--accent-success` for col-ruler / size-tooltip / drop-pulse /
  drag-ghost coloring; ADR-0018 design-tokens) — deferred to
  **Stage C.3** (token integration PR).

- **Astro renderer / `apps/site/` mount site wire-up** — deferred
  to **Stage C.4** wire-up PRs.

- **Playwright `performance.now()` 60fps budget assertion** for
  resize tick (ADR-0017 AC#6) — deferred to **Stage C.4**
  (Playwright setup + WSL2 chromium launch path resolution per
  memory `feedback_wsl2_chromium_launch`).

- **Modal canvas resize internal behavior** — out of Wave 5
  entirely; Phase 2+ (ADR-0019+).

- **CRDT/OT collaborative editing** — out of Wave 5 entirely;
  Phase 2+ per ADR-0016 D12 + ADR-0017 D12 single-user
  single-session assumption.

- **Heavy block boundary skeleton during resize transit**
  (ADR-0014 v0.5 amendment — `heavyBoundaryDimensions` 联动
  colSpan / rowSpan) — deferred to **C.2-7** per Wave 5 plan v1.1
  row C.2-7.

- **`apps/site/src/styles/grid.css` styling for col-ruler stop
  highlight or size-tooltip background** — deferred to **Stage C.3**
  ADR-0018 token migration. C.2-6 ships only structural class
  names + the `oklch(...)` literal in the col-ruler source per
  ADR-0017 D9 verbatim.

## executor

`codex-generic-executor` per ADR-0011 D6 + Wave 5 plan v1.1 row
C.2-6 column 4. Stage 2 D1 EXECUTE. Approval policy: `never`.
Sandbox: `workspace-write`. Audit log: pipe to
`/tmp/codex-runs/2026-05-05-C.2-6-resize-ux.txt` first per memory
`feedback_codex_audit_log_recursion`; orchestrator copies to
`docs/audits/codex-runs/2026-05-05-C.2-6-resize-ux.txt` after exec
completes (head -50 + R21 grep verdicts if log > 500 KB).

Codex prompt synthesis: orchestrator-self walks PR.md sections
`## title` + `## files` (whitelist) + `## test_cases` (TDD-front
24 cases) + `## acceptance` (16 ACs) into the
codex-generic-executor stdin prompt; codex executor MUST land
tests first (red), then impl (green), then verify all 16 ACs
locally before SendMessage to orchestrator.

Per memory `feedback_codex_stdin` — pipe `< /dev/null` to `codex
exec` invocation to avoid stdin-hang.

Per memory `feedback_orchestrator_owns_approval` — codex profile
uses `approval_policy = "never"`; orchestrator-self is the only
human-in-the-loop interface.

### Stage 7 ACCEPT post-commit verification (orchestrator-self after pr-writer ACCEPT-PASS)

Per memory `feedback_gh_pr_ci_conclusion_vs_status` (codified
2026-05-05): orchestrator's auto-merge script MUST use:

```bash
gh pr view "$PR_URL" --json statusCheckRollup --jq \
  '[.statusCheckRollup[] | select(.conclusion != null) | .conclusion] | unique'
```

Acceptance: result `["SUCCESS"]` (single-element array) — all
non-null `conclusion` values are `"SUCCESS"`. NOT
`status === "COMPLETED"` (which would also accept failed runs).

Once PASS, `gh pr merge "$PR_URL" --squash --delete-branch` per
memory `feedback_wave3_auto_merge` (user 2026-05-01 authorization).

Post-merge: `git checkout main && git pull` then update
`docs/plans/active.md` row C.2-6 from `WIP` to `MERGED` plus the
new squash hash (separate fast-follow PR per active.md sync
discipline).

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging discipline + memory
`feedback_git_operator_explicit_stage` 4-step protocol:

```bash
# Step 1: reset HEAD to clean staging area (race-proof against concurrent
# stagers; single-PR serial work but discipline is universal).
git reset HEAD

# Step 2: explicit add (no -A / no .) — exactly the 10 whitelisted files.
git add packages/block-foundation/src/grid-math.ts \
        packages/block-foundation/CONTRACT.md \
        packages/block-foundation/src/__tests__/grid-math.test.ts \
        packages/editor-shell/src/resize/col-ruler.tsx \
        packages/editor-shell/src/resize/size-tooltip.tsx \
        packages/editor-shell/src/__tests__/resize/col-ruler.test.tsx \
        packages/editor-shell/src/__tests__/resize/size-tooltip.test.tsx \
        packages/editor-shell/src/index.ts \
        packages/editor-shell/CONTRACT.md \
        docs/plans/wave-5-main/C.2-6-resize-ux.md

# Step 3: verify --cached --stat shows exactly 10 entries; no
# pnpm-lock.yaml; no incidental snapshot file.
git diff --cached --stat
# Expected: 10 files; expected line-delta totals roughly:
#   grid-math.ts                 +40 LOC (MODIFIED)
#   block-foundation CONTRACT.md +12 LOC (MODIFIED)
#   grid-math.test.ts            +60 LOC (MODIFIED — append cases)
#   col-ruler.tsx                ~120 LOC (NEW)
#   size-tooltip.tsx             ~100 LOC (NEW)
#   col-ruler.test.tsx           ~110 LOC (NEW)
#   size-tooltip.test.tsx        ~85 LOC (NEW)
#   index.ts                     +6 LOC (MODIFIED)
#   editor-shell CONTRACT.md     +65 LOC (MODIFIED)
#   C.2-6-resize-ux.md           ~870 LOC (NEW; this PR.md)

# Step 4: commit (NO --amend; new commit per WE-009 worker-side
# memory).
git commit -m "Wave 5 C.2-6 — resize UX (col-ruler + size-tooltip + effectiveColSnaps; per ADR-0017 D9 + ADR-0016 D6 Q4) (7 of 12 Stage C.2)

Implements ADR-0017 D9 col-ruler stop-highlight + size-tooltip cursor-
offset fraction-string + mobile 1-col view-only branch, plus the
ADR-0016 D6 Q4 absorbtion effectiveColSnaps(viewportCols) helper
landing at the block-foundation authority site (R-fix lacuna at C.2-2
squash b15ba24).

* 1 helper add to packages/block-foundation/src/grid-math.ts:
  effectiveColSnaps(12 | 6 | 1) -> readonly number[].
* 2 NEW pure modules under packages/editor-shell/src/resize/:
  - col-ruler.tsx (stop-set render; mobile null branch)
  - size-tooltip.tsx (cursor-offset fixed position; colSpanToFraction)
* 3 vitest cases extended (1 file modified at block-foundation; 2
  NEW files at editor-shell); 24 new cases total (4 + 8 + 12).
* Barrel re-exports added to packages/editor-shell/src/index.ts.
* CONTRACT.md extended (block-foundation: 1-bullet add to Public
  surface; editor-shell: NEW Resize layer (C.2-6) subsection under
  Grid layout (Wave 5)).

Resize-handle DOM emission + pointer event wiring + .skb-grid--mobile
state machine deferred to C.2-8 / C.2-9 per Wave 5 plan v1.1.

Per ADR-0016 D6 Q4 + ADR-0017 D9; ADR-0016 D11 (Tiptap inside / grid
outside); Wave 5 plan v1.1 row C.2-6.

Co-authored-by: codex-generic-executor"
```

Reviewer codex (D1 stage 5; reviewer = `codex-pr-reviewer-55`)
performs the actual commit + push under `codex exec --yolo --profile
codex-pr-reviewer-55` — NOT pr-writer (per ADR-0011 D7 forbidden-
permission rule for pr-writer subagent). orchestrator dispatches
the reviewer codex with the PR.md as input.

## Related

- [ADR-0017 D9](../../decisions/ADR-0017-drag-drop-ux.md)
  — Resize UX design lock; C.2-6 implements the col-ruler +
  size-tooltip + mobile 1-col view-only branch surface.
- [ADR-0016 D6 Q4 + D5 + D11](../../decisions/ADR-0016-grid-data-model.md)
  — `effectiveColSnaps(viewportCols)` authority + 1-col mobile
  forced path + Tiptap inside / grid outside layering.
- [ADR-0011 D1 / D2 / D6](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — Linear pipeline; D2 row 1 + row 5 trigger judgment; D6 codex
  patterns (codex-generic-executor + codex-pr-reviewer-55).
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — 8-class checklist + explicit-file-list commit staging.
- [Wave 5 plan v1.1 row C.2-6](v1.1-plan-amendment-r14.md)
  — Wave 5 plan amendment R14 lock; row C.2-6 cite.
- [Wave 5 plan Pre-A2 ADR-0016 lock](Pre-A2-adr-0016-grid-data-model.md)
  — Pre-A2 ADR design-lock PR; D6 Q4 absorbtion locked the
  `effectiveColSnaps(viewportCols)` authority.
- [Wave 5 plan Pre-A3 ADR-0017 lock](Pre-A3-adr-0017-drag-drop-ux.md)
  — Pre-A3 ADR design-lock PR; D9 locked the col-ruler +
  size-tooltip + mobile 1-col view-only surface.
- [C.2-5 drag/drop UX](C.2-5-drag-drop-ux.md)
  — Sibling C.2 PR; squash `2df71b6`. Established the
  `### Drag/Drop layer (C.2-5)` subsection in editor-shell
  CONTRACT.md that C.2-6 parallels with the
  `### Resize layer (C.2-6)` subsection.
- [C.2-4 editor-shell grid container](C.2-4-editor-shell-grid.md)
  — Sibling C.2 PR; squash `de13d15`. Established the
  `## Grid layout (Wave 5)` section in editor-shell CONTRACT.md.
- [C.2-3.5 mdx-bridge hard-throw flip](C.2-3.5-mdx-bridge-hard-throw-flip.md)
  — Sibling C.2 PR; squash `b019a31`. Established the
  contract-active end-state for `_gridAttrsExplicit` removal that
  C.2-6 honors via the AC#13 mechanical guard.
- [C.2-3 Astro renderer grid + Responsive 12/6/1](C.2-3-astro-grid.md)
  — Sibling C.2 PR; squash `2586328`. Established the
  `apps/site/src/styles/grid.css` `--gap: 14px` authority that
  C.2-6 cross-references for consumer parity (one of four
  authority sites for `gap = 14`).
- [C.2-2 block-foundation grid primitives](C.2-2-block-foundation-grid.md)
  — Sibling C.2 PR; squash `b15ba24`. Established 5 of 6
  `grid-math.ts` helpers + `DEFAULT_GRID_GEOMETRY.gap`; C.2-6
  adds the 6th helper `effectiveColSnaps`.
