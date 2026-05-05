# C.2-5 — drag/drop UX 实施 (ADR-0017 D5 选项 1 + D3 tiebreak + D4 outline overlay)

> **Wave 5 Stage C.2 6th implementation PR** of the locked 13-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.1 §469-498 + R14 amendment). Lands
> the **editor-shell side** drag/drop UX layer per ADR-0017 D5 option 1
> (pre-computed edge rects + distance tiebreak) + D3 tiebreak distance
> formula (with velocity-direction priority + ε=0.5px/frame jitter
> suppression + spatial fallback + blockId lexicographic stable terminator)
> + D4 outline overlay scheme A (static base + per-affected-block dashed
> accent overlay). C.2-1 (mdx-bridge serialize, squash `e54497d`) +
> C.2-2 (block-foundation grid primitives, squash `b15ba24`) + C.2-3
> (Astro renderer grid + Responsive 12/6/1, squash `2586328`) + C.2-3.5
> (mdx-bridge hard-throw flip, squash `b019a31`) + C.2-4 (editor-shell
> grid container + `useAutoRowSpan` hook, squash `de13d15`) all merged.
> C.2-5 wires the **editor-side drag/drop UX layer** as 3 NEW pure
> modules under `packages/editor-shell/src/drag-drop/` plus barrel
> re-exports + CONTRACT.md `### Drag/Drop layer (C.2-5)` subsection
> under the existing `## Grid layout (Wave 5)` section. **layoutReducer
> + `layoutEpoch` reducer impl** is **NOT** in scope here (deferred to
> C.2-8 per Wave 5 plan v1.1 row C.2-8); drag/drop emits geometric data
> + visual feedback only. **drag-ghost (ADR-0017 D10) + drop-pulse
> (ADR-0017 D11) + Esc cancel global handler (ADR-0017 D8) + layoutEpoch
> reducer (ADR-0017 D12)** are also deferred to C.2-8. **PRE-COMMIT
> CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger judgment`
> (Row 1 NEW CONTRACT.md drag/drop subsection + public surface anchor +
> Row 5 boundary contract change since the drag/drop layer is the
> editor-shell consumer of `BlockGridPosition` from C.2-2 + cross-
> references the `apps/site/src/styles/grid.css` `--gap: 14px`
> authority via the `EDGE_W = 28 = 2 * GAP = 14` mathematical-coupling
> invariant).

## title

Wire the **editor-side drag/drop UX layer** in `@skb/editor-shell` per
ADR-0017 D2 (`EDGE_W = 28` half-in/half-out) + D3 tiebreak distance
formula + D4 outline overlay scheme A + D5 option 1 pre-computed edge
rects (n=30 ≤ 0.05ms/frame budget). 3 NEW pure modules + 3 NEW vitest
suites + 2 modified files (barrel + CONTRACT.md) = 8 source/test files
+ PR.md self = 9 whitelist entries.

Specifically:

1. NEW `packages/editor-shell/src/drag-drop/edge-rects.ts` (~120-180
   LOC). Pure module computing 4 edge rects per snapshot grid block
   (`split-left` / `split-right` / `split-top` / `split-bottom`) per
   ADR-0017 D2 + D5 option 1 lines 217-230. Exports `EDGE_W = 28`,
   `GAP = 14`, `EdgeRect` type, `BlockLayout` input type, and pure
   function `computeEdgeRects(blocks: BlockLayout[]): EdgeRect[]`.
   `EDGE_W = 2 * GAP` mathematical-coupling invariant locked at
   module head with explicit cross-reference to
   `apps/site/src/styles/grid.css` `--gap: 14px` (C.2-3 authority,
   PR squash `2586328`). Per-block 4-edge geometry per ADR-0017 D5
   `computeEdgeRects` reference impl lines 222-230 verbatim:

   ```typescript
   left:   { x: block.left - EDGE_W / 2,  y: block.top, width: EDGE_W, height: block.height }
   right:  { x: block.right - EDGE_W / 2, y: block.top, width: EDGE_W, height: block.height }
   top:    { x: block.left, y: block.top - EDGE_W / 2,  width: block.width, height: EDGE_W }
   bottom: { x: block.left, y: block.bottom - EDGE_W / 2, width: block.width, height: EDGE_W }
   ```

   Pure function: takes `BlockLayout[]` (each `{ blockId, rect:
   DOMRectReadOnly }`), returns flat `EdgeRect[]` with 4 entries per
   input block (4n rects total). NO DOM mutation. NO React. NO
   `_gridAttrsExplicit` reference (Q2 v1.1 mechanical guard per AC#12).
   File-head JSDoc cites ADR-0017 D2 + D5 + the
   `apps/site/src/styles/grid.css` C.2-3 GAP authority.

2. NEW `packages/editor-shell/src/drag-drop/tiebreak.ts` (~150-220
   LOC). Implements `tiebreak(matches, velocity)` per ADR-0017 D3
   lines 111-157 verbatim TypeScript reference impl (signed
   `distance` scalar via 距离公式表 + `Math.abs` sort key + velocity
   主轴方向优先 with ε=0.5px/frame jitter suppression + spatial
   fallback by `block.left` / `block.top` + `blockId.localeCompare`
   final stable terminator). Exports `EdgeMatch` type (with `distance:
   number` signed scalar field + `blockBounds: { left: number; top:
   number }` for spatial fallback), `DragVelocity` type (`{ vx: number;
   vy: number }` px/frame at 16ms), `tiebreak(matches: EdgeMatch[],
   velocity: DragVelocity): EdgeMatch | null` function, and helper
   `findMatches(cursorX, cursorY, edgeRects, blockRects)` that converts
   `(cursor, EdgeRect[], blockBounds-map)` into `EdgeMatch[]` filtered
   by the closed `abs(signedDistance) ≤ 14` hit threshold (per ADR-0017
   D3 距离公式表 + Q2 absorbtion `EDGE_W / 2 = 14` closed interval).

   Algorithm step ordering per ADR-0017 D3 lines 111-157:
   - **Step 1**: closest by `Math.abs(distance)`; if unique winner,
     return it.
   - **Step 2**: if speed = `Math.hypot(velocity.vx, velocity.vy) >
     0.5`, dominant axis = `Math.abs(velocity.vx) > Math.abs(
     velocity.vy) ? 'x' : 'y'`; dominant sign = `Math.sign(...)`;
     direction-filter: `vx>0 → split-left wins on next-edge`, `vx<0
     → split-right wins`, `vy>0 → split-top wins`, `vy<0 →
     split-bottom wins`. If filtered list non-empty, return first.
   - **Step 3** (spatial fallback when speed ≤ 0.5 px/frame): sort
     by `aIsX ? blockBounds.left : blockBounds.top` ascending; tie
     breaks via `blockId.localeCompare` (lexicographic stable).

   File-head JSDoc cites ADR-0017 D3 + the closed-interval Q2
   absorbtion + the ε=0.5 jitter-suppression Q3 absorbtion. NO
   `_gridAttrsExplicit` reference (Q2 v1.1 guard).

3. NEW `packages/editor-shell/src/drag-drop/outline-overlay.tsx`
   (~100-150 LOC). React component implementing ADR-0017 D4 scheme A
   (static base + per-affected-block dashed accent overlay).
   `OutlineOverlay` consumes the `tiebreak()` result `EdgeMatch | null`
   plus `blockRects: Map<string, DOMRectReadOnly>` and renders one of
   4 dashed-line accent overlay positions per active mode:
   `split-left` highlights the block's left edge; `split-right` the
   right edge; `split-top` the top edge; `split-bottom` the bottom
   edge. When `activeMatch === null`, only the static base
   `<div class="skb-grid-outline-base" />` is emitted (no dashed
   accent). The base + accent elements both carry `pointer-events:
   none` per ADR-0017 D4 Q4 absorbtion CSS block (z-index 30 for
   `new` outline; the `host` and `shifted-block` outlines are
   deferred to C.2-8 per Wave 5 plan v1.1 row C.2-8 — drop-pulse +
   drag-ghost layer; C.2-5 ships only the **active accent** overlay
   matching the cursor position, not the full 3-class layered system).

   Public signature:

   ```typescript
   export interface OutlineOverlayProps {
     activeMatch: EdgeMatch | null;
     blockRects: Map<string, DOMRectReadOnly>;
     className?: string;
   }
   export function OutlineOverlay(props: OutlineOverlayProps): JSX.Element;
   ```

   Internal computed positions per active mode:
   - `split-left`: accent overlay at `(block.left, block.top, 4,
     block.height)` (4px-wide vertical dashed line).
   - `split-right`: accent overlay at `(block.right - 4, block.top,
     4, block.height)`.
   - `split-top`: accent overlay at `(block.left, block.top, block.width, 4)`.
   - `split-bottom`: accent overlay at `(block.left, block.bottom - 4,
     block.width, 4)`.

   Z-index above grid blocks (per ADR-0017 D4 Q4 absorbtion CSS
   z-index: 30 for `new` outline). Static base element CSS class
   `skb-grid-outline-base`; accent CSS class `skb-grid-outline-accent
   skb-grid-outline-accent--{mode}` for mode-specific styling hooks.
   Tokens are deferred to ADR-0018 (Stage C.3); C.2-5 ships only the
   structural class names + inline `position: absolute` style for
   geometry. NO `_gridAttrsExplicit` reference (Q2 v1.1 guard).
   File-head JSDoc cites ADR-0017 D4 + Q4 absorbtion CSS block.

4. NEW `packages/editor-shell/src/__tests__/drag-drop/edge-rects.test.ts`
   (~80-120 LOC). Vitest covering 8 scenarios per ADR-0017 D2 + D5
   option 1 spec:
   - Single-block 4-edge geometry: 4 rects emitted with correct
     `(x, y, width, height)` per the lines 222-230 verbatim
     reference impl.
   - Multi-block adjacent (gap = 14): 2 blocks side-by-side with
     14px horizontal gap; right-edge of left block + left-edge of
     right block overlap by 14px in the gap region.
   - 4 input blocks → 16 EdgeRect output (4 per block).
   - Empty input `[]` → empty output `[]`.
   - `EDGE_W === 28` constant export check.
   - `GAP === 14` constant export check.
   - `EDGE_W === 2 * GAP` mathematical-coupling invariant assertion
     (per ADR-0017 D2 lines 70-79).
   - Edge-rect `width` / `height` invariants per mode (top/bottom
     rects: `width = block.width, height = EDGE_W`; left/right:
     `width = EDGE_W, height = block.height`).

5. NEW `packages/editor-shell/src/__tests__/drag-drop/tiebreak.test.ts`
   (~150-220 LOC). Vitest covering 11 scenarios per ADR-0017 D3 lines
   111-157:
   - Single match → returned as-is.
   - Empty matches array → `null`.
   - Multi-match in gap region: cursor offset by 4 vs 10 → distance-4
     wins.
   - Velocity-based tiebreak with `vx > 0` (cursor moving right) +
     equal absolute distance → `split-left` on right block wins.
   - Velocity-based tiebreak with `vx < 0` → `split-right` on left
     block wins.
   - Velocity-based tiebreak with `vy > 0` (cursor moving down) +
     equal vertical distance → `split-top` on lower block wins.
   - Velocity-based tiebreak with `vy < 0` → `split-bottom` on upper
     block wins.
   - ε=0.5 jitter suppression: `velocity = (0.4, 0)` (below
     threshold) → spatial fallback path (NOT velocity path).
   - Spatial fallback: equal absolute distance + zero velocity +
     two `split-left` candidates → smaller `block.left` wins.
   - Spatial fallback for y-axis modes: `split-top` candidates →
     smaller `block.top` wins.
   - `blockId.localeCompare` final stable terminator: equal distance
     + zero velocity + identical `block.left` → lexicographic
     ascending by `blockId`.
   - `findMatches()` closed-interval `abs(signedDistance) ≤ 14` hit
     threshold: cursor at `EDGE_W / 2 = 14` exactly → hit; at
     `14.01` → miss (per ADR-0017 D3 距离公式表 + Q2 absorbtion).

6. NEW `packages/editor-shell/src/__tests__/drag-drop/outline-overlay.test.tsx`
   (~60-90 LOC). Vitest + happy-dom + @testing-library/react. Covers:
   - `activeMatch === null` → renders only `<div
     class="skb-grid-outline-base">` (no accent element).
   - `split-left` active match → accent element rendered with
     `--mode = split-left` className suffix.
   - `split-right` / `split-top` / `split-bottom` modes each
     render with correct mode-specific className suffix.
   - Geometry assertion per active mode: inline style `position:
     absolute` + correct `(left, top, width, height)` from the
     `blockRects.get(activeMatch.blockId)` lookup.
   - Unmount cleanup: no leaked DOM nodes after `unmount()`.

7. MODIFIED `packages/editor-shell/src/index.ts` (~5-10 LOC delta).
   Add barrel re-exports for `EDGE_W`, `GAP`, `EdgeRect`, `BlockLayout`,
   `computeEdgeRects` (from `./drag-drop/edge-rects`); `EdgeMatch`,
   `DragVelocity`, `tiebreak`, `findMatches` (from
   `./drag-drop/tiebreak`); `OutlineOverlay`, `OutlineOverlayProps`
   (from `./drag-drop/outline-overlay`). Existing 11 exports
   preserved (no regression on the A2-A5 EditorShell + register +
   saveLoad + proseExtensions + C.2-4 GridContainer +
   useAutoRowSpan barrel surface).

8. MODIFIED `packages/editor-shell/CONTRACT.md` (~50-90 LOC delta).
   Extend the existing `## Grid layout (Wave 5)` section (added at
   C.2-4) with a NEW subsection `### Drag/Drop layer (C.2-5)`. Section
   contents:
   - 3-module public surface: `edge-rects.ts` (constants + pure
     function), `tiebreak.ts` (algorithm + helper), `outline-overlay.tsx`
     (React component).
   - `EDGE_W = 28` + `GAP = 14` mathematical-coupling invariant
     prose: "**Drag/drop edge-width is coupled to grid `--gap` via
     `EDGE_W = 2 * GAP`.** The 28px half-in/half-out edge width per
     ADR-0017 D2 ensures that 14px gap regions between adjacent
     blocks fully overlap edge-rects from both neighbours, eliminating
     the dead-zone where cursor in gap would miss all edges. Cross-
     package consumer parity: `apps/site/src/styles/grid.css` line 12
     (`--gap: 14px`, C.2-3 authority, PR squash `2586328`) MUST stay
     byte-equal to the `GAP = 14` exported from
     `packages/editor-shell/src/drag-drop/edge-rects.ts`. Drift =
     algorithm replication failure per memory
     `feedback_cross_package_consumer_pattern`."
   - Forward-pointer prose to ADR-0017 D2 (`EDGE_W = 28` math) +
     D3 (tiebreak distance formula with velocity + spatial fallback
     + lexicographic stable terminator) + D4 (outline overlay scheme
     A; only `new` outline accent in C.2-5; `host` + `shifted-block`
     outlines deferred to C.2-8) + D5 (option 1 pre-computed edge
     rects) + D8 / D10 / D11 / D12 deferral note (Esc cancel +
     drag-ghost + drop-pulse + layoutEpoch reducer = C.2-8 scope).
   - Forward-pointer to ADR-0016 D11 (Tiptap inside / grid outside
     分层) + W5-1 invariant `BlockGridPosition` shape consumer.
   - **Q2 v1.1 absorbtion downstream-must-reference 锁 (CRITICAL)**:
     "drag/drop modules MUST NOT reference `_gridAttrsExplicit`
     (mdx-bridge transitional marker, removed at Wave 5 plan v1.1
     row C.2-3.5 hard-throw flip end-state, squash `b019a31`).
     ADR-0016 D2 defaults (`col=1, colSpan=12, rowSpan=1`) MAY be
     consumed as React-side defensive-rendering defaults at the
     `BlockLayout` input boundary if a NodeView attr arrives unset,
     orthogonal to mdx-bridge's hard-throw enforcement."
   - Forward-pointer: `layoutReducer` + `layoutEpoch` impl deferred
     to C.2-8 (per Wave 5 plan v1.1 row C.2-8); C.2-5 emits visual
     feedback + geometric primitives only (no mutation).

9. PR.md self-listed per ADR-0006 D8 strict-whitelist.

NEW vitest suites runs under `pnpm --filter @skb/editor-shell test`. NO
new npm dependency (vitest + happy-dom + @testing-library/react ALREADY
devDep'd at editor-shell A2; reuses).

The 8 `@skb/block-*` packages are NOT touched (drag/drop is editor-side
host concern per ADR-0017 + ADR-0016 D11). `@skb/mdx-bridge` is NOT
touched (C.2-3.5 hard-throw end-state already locked at squash
`b019a31`). `@skb/block-foundation` is NOT touched (C.2-2 W5-1 invariant
authority; `BlockGridPosition` consumed transitively via C.2-4-already-
declared `@skb/block-foundation` workspace dep). `apps/site/src/styles/grid.css`
is NOT touched (C.2-3 authority; cross-package consumer parity locked
via the new CONTRACT.md `EDGE_W = 2 * GAP` invariant prose). NO change
to design-tokens (C.3 scope; ADR-0017 D11 token integration deferred
there). NO sample MDX backfill (C.2-3.5 / C.2-9 scope). NO new ADR
file (D2 row 4 NOT hit per Wave 5 plan v1.1 §455+ ROW 4 门槛规则; ADR-0017
already authorises the entire surface).

LOCKED implementation path: **ADR-0017 D5 option 1 (pre-computed edge
rects + distance tiebreak)**. Path "wire grid-cell index (option 2) OR
DOM-native event dispatch (option 3) now" is **EXPLICITLY FORBIDDEN**
per ADR-0017 D5 lines 234-242 — option 2/3 deferred to Phase 2+ when
n ≥ 500 blocks. Path "ship layoutReducer + drag-ghost + Esc handler +
drop-pulse + full 3-class outline overlay layered system" is
**EXPLICITLY FORBIDDEN** in this PR (reason in Risk register row 1;
LOC budget would balloon ≥ 1200 LOC, scope creeps into C.2-8 territory).

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

9 canonical files at PLAN time. NO `package.json` change (no new dep;
all needed devDeps already at A2 lock — `vitest` + `happy-dom` +
`@testing-library/react` + `@tiptap/react`). NO `pnpm-lock.yaml` change.
NO `tsconfig.json` change (no new path / reference; `@skb/block-foundation`
already declared as runtime dep + tsconfig reference at A3). NO change
to the 8 `@skb/block-*` packages. NO change to `@skb/mdx-bridge`. NO
change to `@skb/block-foundation`. NO change to `@skb/heavy-block-boundary`.
NO change to `@skb/kernel-*` (3 packages). NO change to `apps/site/**`.
NO change to `packages/design-tokens/**`. NO new ADR file (D2 row 4 NOT
hit per Wave 5 plan v1.1 §455+ ROW 4 门槛规则; ADR-0017 already
authorises). PR.md self-listed.

Whitelist (exhaustive; codex executor MUST stage exactly these 9 paths
and no others — per ADR-0006 D8 explicit-file-list staging discipline +
memory `feedback_git_operator_explicit_stage`):

1. `packages/editor-shell/src/drag-drop/edge-rects.ts` (NEW)
2. `packages/editor-shell/src/drag-drop/tiebreak.ts` (NEW)
3. `packages/editor-shell/src/drag-drop/outline-overlay.tsx` (NEW)
4. `packages/editor-shell/src/__tests__/drag-drop/edge-rects.test.ts` (NEW)
5. `packages/editor-shell/src/__tests__/drag-drop/tiebreak.test.ts` (NEW)
6. `packages/editor-shell/src/__tests__/drag-drop/outline-overlay.test.tsx` (NEW)
7. `packages/editor-shell/src/index.ts` (MODIFIED — barrel additions)
8. `packages/editor-shell/CONTRACT.md` (MODIFIED — new
   `### Drag/Drop layer (C.2-5)` subsection)
9. `docs/plans/wave-5-main/C.2-5-drag-drop-ux.md` (NEW; this PR.md)

## test_cases

TDD-front authoritative list. Each test case names a vitest `it(...)`
description (input fixture + expected assertion + file location). The
TDD-front discipline per ADR-0011 D1 stage 2 + memory
`feedback_codex_spark_lint_gap` requires the codex-generic-executor to
**land all test files first** (red), then implementation files (green),
verifying via `pnpm --filter @skb/editor-shell test`.

### Suite 1: `packages/editor-shell/src/__tests__/drag-drop/edge-rects.test.ts`

8 test cases per ADR-0017 D2 + D5 option 1 spec:

1. **TC1.1 — `EDGE_W` constant equals 28** (ADR-0017 D2 line 66 lock).
   Input: import { `EDGE_W` } from
   '../../drag-drop/edge-rects'. Expected:
   `expect(EDGE_W).toBe(28)`. Location:
   `edge-rects.test.ts > EDGE_W constant > equals 28`.

2. **TC1.2 — `GAP` constant equals 14** (ADR-0017 D2 line 67 +
   `apps/site/src/styles/grid.css` line 12 cross-package consumer
   parity). Input: import { `GAP` } from
   '../../drag-drop/edge-rects'. Expected: `expect(GAP).toBe(14)`.
   Location: `edge-rects.test.ts > GAP constant > equals 14`.

3. **TC1.3 — `EDGE_W === 2 * GAP` mathematical-coupling invariant**
   (ADR-0017 D2 lines 70-79). Input: import both constants. Expected:
   `expect(EDGE_W).toBe(2 * GAP)`. Location:
   `edge-rects.test.ts > coupling invariant > EDGE_W = 2 * GAP`.

4. **TC1.4 — single-block 4-edge geometry** (ADR-0017 D5 lines
   222-230 verbatim reference impl). Input: 1 block at
   `{ blockId: 'b1', rect: DOMRectReadOnly(100, 200, 300, 100) }`
   (left=100, top=200, width=300, height=100; right=400, bottom=300).
   Expected: 4 EdgeRects emitted with `mode` ∈
   `{split-left, split-right, split-top, split-bottom}` and
   geometry per the lines 222-230 formula:
   - left: x=100-14=86, y=200, w=28, h=100
   - right: x=400-14=386, y=200, w=28, h=100
   - top: x=100, y=200-14=186, w=300, h=28
   - bottom: x=100, y=300-14=286, w=300, h=28
   Location: `edge-rects.test.ts > computeEdgeRects > single block emits 4 rects`.

5. **TC1.5 — multi-block (4 inputs → 16 outputs)**. Input: 4
   blocks at distinct positions. Expected:
   `expect(computeEdgeRects(blocks).length).toBe(16)`; each block's
   `blockId` appears exactly 4 times (once per mode). Location:
   `edge-rects.test.ts > computeEdgeRects > 4 blocks emit 16 rects`.

6. **TC1.6 — adjacent blocks gap=14 overlap** (ADR-0017 D2 lines
   70-72 sweet spot prose). Input: block A at `(0, 0, 100, 50)`
   (right=100); block B at `(114, 0, 100, 50)` (left=114, gap=14).
   Expected: A's `split-right` rect spans `x ∈ [86, 114]`; B's
   `split-left` rect spans `x ∈ [100, 128]`; intersection
   `[100, 114]` width 14 = gap (full overlap in gap region).
   Location:
   `edge-rects.test.ts > computeEdgeRects > adjacent blocks fully overlap in gap`.

7. **TC1.7 — empty input → empty output**. Input: `[]`. Expected:
   `expect(computeEdgeRects([])).toEqual([])`. Location:
   `edge-rects.test.ts > computeEdgeRects > empty input returns empty`.

8. **TC1.8 — per-mode width/height invariants**. Input: 1 block at
   `(50, 50, 200, 100)`. Expected: top + bottom rects have
   `width === block.width === 200` and `height === EDGE_W === 28`;
   left + right rects have `width === EDGE_W === 28` and
   `height === block.height === 100`. Location:
   `edge-rects.test.ts > computeEdgeRects > per-mode w/h invariants`.

### Suite 2: `packages/editor-shell/src/__tests__/drag-drop/tiebreak.test.ts`

11 test cases per ADR-0017 D3 lines 111-157 verbatim algorithm:

1. **TC2.1 — empty matches → null**. Input: `tiebreak([], { vx: 0, vy: 0 })`.
   Expected: `null`. Location:
   `tiebreak.test.ts > tiebreak > empty matches returns null`.

2. **TC2.2 — single match → returned as-is**. Input: 1 EdgeMatch
   `{ blockId: 'b1', mode: 'split-left', distance: 4, blockBounds: {left: 0, top: 0} }`.
   Expected: returns the single EdgeMatch (referential identity).
   Location: `tiebreak.test.ts > tiebreak > single match returned as-is`.

3. **TC2.3 — closest by abs(distance) wins, distinct distances**.
   Input: 2 EdgeMatches with distances 4 and 10. Expected: returns
   distance-4 match. Location:
   `tiebreak.test.ts > tiebreak > step 1 closest wins`.

4. **TC2.4 — abs(signedDistance) sort, signed != absolute**. Input:
   2 EdgeMatches with `distance = -8` and `distance = 4`. Expected:
   returns `distance = 4` (since `abs(-8) = 8 > abs(4) = 4`).
   Location: `tiebreak.test.ts > tiebreak > step 1 uses abs not signed`.

5. **TC2.5 — velocity vx > 0 picks split-left on right block at tied
   distance** (ADR-0017 D3 line 130 + lines 162-167 prose). Input:
   2 EdgeMatches both with `distance = 7`, modes `split-right` (left
   block) and `split-left` (right block); velocity `(vx: 5, vy: 0)`.
   Expected: returns the `split-left` match. Location:
   `tiebreak.test.ts > tiebreak > step 2 vx>0 prefers split-left`.

6. **TC2.6 — velocity vx < 0 picks split-right on left block**.
   Input: same fixture as TC2.5 but `velocity = (-5, 0)`. Expected:
   returns the `split-right` match. Location:
   `tiebreak.test.ts > tiebreak > step 2 vx<0 prefers split-right`.

7. **TC2.7 — velocity vy > 0 picks split-top on lower block**.
   Input: 2 EdgeMatches both `distance = 7`, modes `split-bottom`
   (upper block) + `split-top` (lower block); velocity `(0, 5)`.
   Expected: returns the `split-top` match. Location:
   `tiebreak.test.ts > tiebreak > step 2 vy>0 prefers split-top`.

8. **TC2.8 — ε=0.5 jitter suppression** (ADR-0017 D3 line 122 + 160).
   Input: tied distance 7 + tied modes `split-left` on 2 different
   blocks; velocity `(0.4, 0.3)` → `Math.hypot(0.4, 0.3) = 0.5` →
   NOT > 0.5 → falls to spatial fallback path (NOT velocity path).
   Expected: spatial-fallback winner (smaller `block.left`), NOT
   velocity-direction winner. Location:
   `tiebreak.test.ts > tiebreak > step 3 epsilon 0.5 falls to spatial`.

9. **TC2.9 — spatial fallback x-axis modes by block.left** (ADR-0017
   D3 line 142 + 148-149). Input: 2 `split-left` matches with tied
   distance 4 + zero velocity; `blockBounds.left = 0` and
   `blockBounds.left = 100`. Expected: returns the `block.left = 0`
   match. Location:
   `tiebreak.test.ts > tiebreak > step 3 spatial x-axis smaller left wins`.

10. **TC2.10 — spatial fallback y-axis modes by block.top**. Input:
    2 `split-top` matches with tied distance 4 + zero velocity;
    `blockBounds.top = 0` and `blockBounds.top = 100`. Expected:
    returns the `block.top = 0` match. Location:
    `tiebreak.test.ts > tiebreak > step 3 spatial y-axis smaller top wins`.

11. **TC2.11 — `blockId.localeCompare` final stable terminator**
    (ADR-0017 D3 line 155). Input: 2 `split-left` matches with tied
    distance + zero velocity + identical `blockBounds.left`;
    `blockId = 'b2'` and `blockId = 'b1'`. Expected: returns
    `blockId = 'b1'` (lexicographic ascending). Location:
    `tiebreak.test.ts > tiebreak > step 3 blockId localeCompare stable`.

12. **TC2.12 — `findMatches` closed-interval `abs(d) ≤ 14`** (ADR-0017
    D3 距离公式表 hit 条件 column + Q2 absorbtion). Input: cursor at
    cursor offset such that one EdgeRect has `abs(signedDistance) =
    14` (boundary), one has `15` (miss), one has `13` (hit). Expected:
    returned `EdgeMatch[]` length = 2 (boundary 14 + interior 13);
    miss 15 excluded. Location:
    `tiebreak.test.ts > findMatches > closed interval abs<=14`.

(Suite 2 final count: 12 cases — TC2.1-TC2.12.)

### Suite 3: `packages/editor-shell/src/__tests__/drag-drop/outline-overlay.test.tsx`

5 test cases per ADR-0017 D4 scheme A + Q4 absorbtion CSS block:

1. **TC3.1 — `activeMatch === null` renders only static base**
   (ADR-0017 D4 lines 174-176). Input: `<OutlineOverlay
   activeMatch={null} blockRects={new Map()} />`. Expected: rendered
   tree contains exactly 1 `<div class="skb-grid-outline-base" />`
   element; no element matches `.skb-grid-outline-accent`. Location:
   `outline-overlay.test.tsx > OutlineOverlay > null match renders base only`.

2. **TC3.2 — `split-left` mode renders accent at left edge**
   (ADR-0017 D4 line 178-180 prose). Input: `activeMatch = {
   blockId: 'b1', mode: 'split-left', distance: 4, blockBounds: ... }`;
   `blockRects = new Map([['b1', DOMRectReadOnly(100, 50, 200, 80)]])`.
   Expected: 1 `<div class="skb-grid-outline-accent
   skb-grid-outline-accent--split-left">` rendered with inline style
   `position: absolute; left: 100px; top: 50px; width: 4px; height:
   80px`. Location:
   `outline-overlay.test.tsx > OutlineOverlay > split-left renders left-edge accent`.

3. **TC3.3 — `split-right` / `split-top` / `split-bottom` modes
   each render with correct className suffix + geometry**. Input:
   3 sequential renders with modes `split-right` / `split-top` /
   `split-bottom`. Expected: each renders the corresponding
   `--split-right` / `--split-top` / `--split-bottom` className suffix
   + correct geometry per the C.2-5 § scope-fence "Internal computed
   positions per active mode" specification (right: `x = right - 4`;
   top: `y = top, h = 4`; bottom: `y = bottom - 4, h = 4`). Location:
   `outline-overlay.test.tsx > OutlineOverlay > 3 remaining modes render correctly`.

4. **TC3.4 — missing `blockId` in `blockRects` Map → no accent
   element rendered**. Input: `activeMatch = { blockId: 'unknown',
   mode: 'split-left', ... }`; `blockRects = new Map()` (empty).
   Expected: only base element rendered (graceful degradation; no
   throw). Location:
   `outline-overlay.test.tsx > OutlineOverlay > unknown blockId falls back to base only`.

5. **TC3.5 — unmount cleanup**. Input: render then `unmount()`.
   Expected: no DOM nodes attached to `document.body` post-unmount.
   Location:
   `outline-overlay.test.tsx > OutlineOverlay > unmount cleanup leaves no nodes`.

(Suite 3 final count: 5 cases — TC3.1-TC3.5.)

**Suite total: 8 + 12 + 5 = 25 vitest cases**. All MUST PASS at AC#13
(`pnpm --filter @skb/editor-shell test` exit 0).

## contracts_affected

- `packages/editor-shell/CONTRACT.md` — NEW subsection `### Drag/Drop
  layer (C.2-5)` added under the existing `## Grid layout (Wave 5)`
  section (which was added at C.2-4). D2 row 1 hit (CONTRACT.md
  change). Per ADR-0017 §502 sister-doc-sync — this PR is the
  documented same-PR-with-implementation sync site for the
  drag/drop public surface (3-module export anchor + `EDGE_W = 28
  = 2 * GAP = 14` mathematical-coupling invariant prose +
  cross-package consumer parity to `apps/site/src/styles/grid.css`
  `--gap: 14px` C.2-3 authority).

- `packages/block-foundation/CONTRACT.md` — **NOT** modified. The
  W5-1 invariant prose at L41 + `BlockGridPosition` type authority
  (Pre-A2 ADR-0016 D2 lock + C.2-2 type materialisation) is the
  **target** of cross-package consumer pointers from C.2-5 source
  JSDoc + the new CONTRACT.md drag/drop subsection forward-pointer;
  source-of-truth text unchanged. drag/drop modules consume
  `BlockGridPosition` shape transitively via the existing
  `@skb/block-foundation` workspace dep (no new dep).

- `packages/mdx-bridge/CONTRACT.md` — **NOT** modified. C.2-3.5
  hard-throw flip end-state already locked at squash `b019a31`;
  C.2-5 cites the v1.1 plan amendment + the C.2-3.5 squash as the
  contract-active end-state in its CONTRACT.md drag/drop subsection
  Q2 v1.1 absorbtion downstream-must-not-reuse note.

- `apps/site/CONTRACT.md` — **NOT** modified. C.2-3 already shipped
  the `## Grid layout (Wave 5)` section there with `.skb-grid`
  selector authority + 12/6/1 breakpoint table + `--gap: 14px` CSS
  variable at PR squash `2586328`. C.2-5 cross-references
  `apps/site/src/styles/grid.css` line 12 as the cross-package
  consumer parity source for the `GAP = 14` constant exported from
  `packages/editor-shell/src/drag-drop/edge-rects.ts` but does NOT
  modify `apps/site/CONTRACT.md` (consumer side only).

- `packages/heavy-block-boundary/CONTRACT.md` — **NOT** modified
  (C.2-7 scope; ADR-0014 v0.5 amendment).

- `packages/design-tokens/**` — **NOT** modified. ADR-0017 D11
  drop-pulse `--accent-success` token + D4 outline overlay
  `--accent` / `--accent-soft` tokens are all deferred to ADR-0018
  (Pre-A4) Stage C.3 implementation. C.2-5 ships only the structural
  CSS class names (`skb-grid-outline-base`,
  `skb-grid-outline-accent--{mode}`) without token values; downstream
  Stage C.3 PR will style them.

- 8 `@skb/block-*` CONTRACT.md files — **NOT** modified (drag/drop
  is a host-side concern per ADR-0017 + ADR-0016 D11 Tiptap inside /
  grid outside 分层).

D2 row 5 (boundary contract change) hit because the new
`packages/editor-shell/CONTRACT.md` `### Drag/Drop layer (C.2-5)`
subsection codifies the editor-side drag/drop public surface that
downstream consumers will depend on:
- C.2-8 (layoutReducer + layoutEpoch + drop-pulse + drag-ghost +
  Esc cancel) consumes `EdgeMatch` from `tiebreak.ts` as input to
  the reducer mutation pipeline.
- C.2-9 (responsive 12/6/1 transition reducer) consumes the
  `EDGE_W = 2 * GAP` mathematical-coupling invariant prose +
  `computeEdgeRects` for ResizeObserver-driven re-computation
  (per ADR-0017 D4 Q5 absorbtion Reflow / resize invalidation block).
- Stage C.4 wire-up at `apps/site/src/pages/notes/[slug]/edit.astro`
  mount site consumes `OutlineOverlay` React component + the
  cross-package `--gap: 14px` parity constraint via the new
  CONTRACT.md prose.

PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES.

## adr_touched

NONE (D2 row 4 NOT hit per Wave 5 plan v1.1 §455+ ROW 4 门槛规则).
ADR-0017 D2 (`EDGE_W = 28` half-in/half-out math; lines 63-79) +
D3 (tiebreak distance formula; lines 81-167) + D4 (outline overlay
scheme A; lines 172-213) + D5 (option 1 pre-computed edge rects;
lines 215-242) + Q2 / Q3 / Q4 absorbtion notes already authorise the
entire surface (Pre-A3 lock; squash already merged before Wave 5
plan v1.1 amendment 2026-05-04). PR cites ADR-0017 D-list anchors
in source JSDoc + CONTRACT.md drag/drop subsection + this PR.md but
does NOT amend the ADR.

ADR-0017 D8 (Esc cancel) + D10 (drag-ghost) + D11 (drop-pulse) +
D12 (layoutEpoch reducer) are deferred to C.2-8 (per Wave 5 plan
v1.1 row C.2-8) — out of scope here. Forward-pointers in source +
CONTRACT.md note the deferral.

ADR-0016 D11 (Tiptap inside / grid outside 分层 architectural
rationale) + W5-1 invariant `BlockGridPosition` shape consumer +
D12 layoutReducer schema (impl deferred C.2-8) are all referenced
by the C.2-5 drag/drop layer — not amended.

ADR-0018 (v2 visual migration) Pre-A4 design-lock owns the design
tokens (`--accent`, `--accent-soft`, `--accent-success`) consumed by
the eventual styled outline overlay + drop-pulse + drag-ghost; C.2-5
ships only structural class names — not amended.

ADR-0014 v0.5 amendment (heavy-block boundary
`heavyBoundaryDimensions` 联动 colSpan / rowSpan during drag transit)
is on the C.2-7 row — out of scope here.

ADR-0006 class 6 (sister-doc sync) is operationally satisfied (NOT
amended).

**Wave 5 plan v1.1 row C.2-3.5 hard-throw flip** is referenced as the
contract-active end-state anchor for the drag/drop layer's
`_gridAttrsExplicit` mechanical-guard prose (per AC#12; per CONTRACT.md
new subsection); this PR.md cites the v1.1 amendment + C.2-3.5 squash
`b019a31` but does NOT amend the plan or the ADR.

## acceptance

16 verifiable acceptance criteria. Each is a single shell command
producing an objectively checkable result. ACCEPT-stage pr-writer (D1
stage 6) re-runs all 16 against the post-commit working tree.

### AC#1 — `edge-rects.ts` exists + exports `computeEdgeRects` + `EDGE_W` + `GAP`

```bash
test -f packages/editor-shell/src/drag-drop/edge-rects.ts && \
  grep -F 'export function computeEdgeRects' \
    packages/editor-shell/src/drag-drop/edge-rects.ts | wc -l && \
  grep -E '^export const EDGE_W' \
    packages/editor-shell/src/drag-drop/edge-rects.ts | wc -l && \
  grep -E '^export const GAP' \
    packages/editor-shell/src/drag-drop/edge-rects.ts | wc -l
```

Expected: each `≥ 1`. Verifies the file exists AND the named exports
exist.

### AC#2 — `tiebreak.ts` exists + exports `tiebreak` + `findMatches` + types

```bash
test -f packages/editor-shell/src/drag-drop/tiebreak.ts && \
  grep -F 'export function tiebreak' \
    packages/editor-shell/src/drag-drop/tiebreak.ts | wc -l && \
  grep -F 'export function findMatches' \
    packages/editor-shell/src/drag-drop/tiebreak.ts | wc -l && \
  grep -E '^export (interface|type) EdgeMatch' \
    packages/editor-shell/src/drag-drop/tiebreak.ts | wc -l && \
  grep -E '^export (interface|type) DragVelocity' \
    packages/editor-shell/src/drag-drop/tiebreak.ts | wc -l
```

Expected: each `≥ 1`. Verifies the file + 4 named exports.

### AC#3 — `outline-overlay.tsx` exists + exports `OutlineOverlay` + props

```bash
test -f packages/editor-shell/src/drag-drop/outline-overlay.tsx && \
  grep -F 'export function OutlineOverlay' \
    packages/editor-shell/src/drag-drop/outline-overlay.tsx | wc -l && \
  grep -E '^export (interface|type) OutlineOverlayProps' \
    packages/editor-shell/src/drag-drop/outline-overlay.tsx | wc -l
```

Expected: each `≥ 1`. Verifies the React component + props type.

### AC#4 — `EDGE_W = 28` + `GAP = 14` byte-equal to grid.css authority

```bash
grep -E '^export const EDGE_W\s*=\s*28' \
  packages/editor-shell/src/drag-drop/edge-rects.ts | wc -l
grep -E '^export const GAP\s*=\s*14' \
  packages/editor-shell/src/drag-drop/edge-rects.ts | wc -l
grep -F -- '--gap: 14px' apps/site/src/styles/grid.css | wc -l
```

Expected: each `≥ 1`. Verifies the cross-package consumer parity per
memory `feedback_cross_package_consumer_pattern` — the editor-shell
exported `GAP = 14` MUST stay byte-equal to the
`apps/site/src/styles/grid.css` `--gap: 14px` C.2-3 authority. Drift
between source authorities is the algorithm-replication failure mode
the memory codifies.

### AC#5 — `EDGE_W === 2 * GAP` mathematical-coupling invariant cited in source

```bash
grep -F 'EDGE_W = 2 * GAP' \
  packages/editor-shell/src/drag-drop/edge-rects.ts | wc -l
```

Expected: `≥ 1`. Verifies the file-head JSDoc + comment cites the
ADR-0017 D2 lines 70-79 mathematical-coupling invariant prose.

### AC#6 — All 3 source files cite ADR-0017 in JSDoc

```bash
grep -F 'ADR-0017' packages/editor-shell/src/drag-drop/edge-rects.ts | wc -l
grep -F 'ADR-0017' packages/editor-shell/src/drag-drop/tiebreak.ts | wc -l
grep -F 'ADR-0017' packages/editor-shell/src/drag-drop/outline-overlay.tsx | wc -l
```

Expected: each `≥ 1`. Verifies file-head JSDoc cross-references to
the authoritative ADR (per ADR-0006 class 6 sister-doc sync).

### AC#7 — `index.ts` barrel re-exports drag/drop public surface

```bash
grep -F 'EDGE_W' packages/editor-shell/src/index.ts | wc -l
grep -F 'GAP' packages/editor-shell/src/index.ts | wc -l
grep -F 'computeEdgeRects' packages/editor-shell/src/index.ts | wc -l
grep -F 'tiebreak' packages/editor-shell/src/index.ts | wc -l
grep -F 'findMatches' packages/editor-shell/src/index.ts | wc -l
grep -F 'OutlineOverlay' packages/editor-shell/src/index.ts | wc -l
grep -F 'EdgeMatch' packages/editor-shell/src/index.ts | wc -l
grep -F 'DragVelocity' packages/editor-shell/src/index.ts | wc -l
```

Expected: each `≥ 1`. Verifies the barrel re-exports landed.

### AC#8 — `index.ts` preserves existing 11 exports (no regression)

```bash
grep -F 'EditorShell' packages/editor-shell/src/index.ts | wc -l
grep -F 'registerBlocks' packages/editor-shell/src/index.ts | wc -l
grep -F 'registerKernels' packages/editor-shell/src/index.ts | wc -l
grep -F 'saveToMdx' packages/editor-shell/src/index.ts | wc -l
grep -F 'loadFromMdx' packages/editor-shell/src/index.ts | wc -l
grep -F 'SaveLoadOptions' packages/editor-shell/src/index.ts | wc -l
grep -F 'proseExtensions' packages/editor-shell/src/index.ts | wc -l
grep -F 'GridContainer' packages/editor-shell/src/index.ts | wc -l
grep -F 'useAutoRowSpan' packages/editor-shell/src/index.ts | wc -l
```

Expected: each `≥ 1`. Verifies no regression on the A2-A5 +
C.2-4 = 11 prior exports (EditorShell + EditorShellProps +
registerBlocks + registerKernels + saveToMdx + loadFromMdx +
SaveLoadOptions + proseExtensions + GridContainer + GridContainerProps
+ useAutoRowSpan).

### AC#9 — `editor-shell/CONTRACT.md` has `### Drag/Drop layer (C.2-5)` subsection

```bash
grep -E '^### Drag/Drop layer \(C\.2-5\)' \
  packages/editor-shell/CONTRACT.md | wc -l
```

Expected: `≥ 1`. Verifies the new subsection header is present under
the existing `## Grid layout (Wave 5)` section.

### AC#10 — `editor-shell/CONTRACT.md` cites `EDGE_W = 2 * GAP` + cross-package parity

```bash
grep -F 'EDGE_W = 2 * GAP' packages/editor-shell/CONTRACT.md | wc -l
grep -F 'apps/site/src/styles/grid.css' packages/editor-shell/CONTRACT.md | wc -l
```

Expected: each `≥ 1`. Verifies the mathematical-coupling invariant
prose + cross-package consumer parity declaration in the
CONTRACT.md drag/drop subsection.

### AC#11 — `editor-shell/CONTRACT.md` cites Wave 5 plan v1.1 row C.2-3.5 (Q2 downstream constraint)

```bash
grep -F 'C.2-3.5' packages/editor-shell/CONTRACT.md | wc -l
```

Expected: `≥ 2` (one from C.2-4 prior section, one from C.2-5 new
subsection). Verifies the Q2 v1.1 absorbtion downstream-must-not-reuse
锁 (CRITICAL constraint on hard-throw end-state at squash `b019a31`).

### AC#12 — Drag/Drop source has NO `_gridAttrsExplicit` symbol (Q2 v1.1 mechanical guard)

```bash
grep -RF '_gridAttrsExplicit' packages/editor-shell/src/drag-drop/ | wc -l
```

Expected: `0`. Verifies the C.2-1 to C.2-3 era mdx-bridge defensive-
default marker is NOT referenced from the new drag/drop modules
(per Wave 5 plan v1.1 R14 absorbtion amendment 2026-05-05; C.2-4
established the same-pattern mechanical guard, C.2-5 extends it to
the drag/drop layer).

### AC#13 — `pnpm --filter @skb/editor-shell test` PASS

```bash
pnpm --filter @skb/editor-shell test
```

Expected: exit 0. All existing test cases continue to PASS (existing
EditorShell A2-A5 + C.2-4 grid-container + use-auto-row-span suites)
PLUS the 3 new test files: `edge-rects.test.ts` (8 cases) +
`tiebreak.test.ts` (12 cases) + `outline-overlay.test.tsx` (5 cases)
= 25 new vitest cases. No skipped tests.

### AC#14 — `pnpm check:affected` PASS (lint + typecheck + test + build + size)

```bash
pnpm check:affected
```

Expected: exit 0. Lint + typecheck + test + build + size-check all
PASS for `@skb/editor-shell` and any package transitively affected.
Per memory `feedback_codex_spark_lint_gap` — orchestrator
independently runs `pnpm --filter @skb/editor-shell lint` to catch
lint-only issues; per memory `feedback_git_operator_ci_verification`
— uncached `pnpm --filter @skb/editor-shell typecheck` is also
re-run independently because turbo cache + vitest miss tsc errors.

### AC#15 — Lychee link-check pre-empt clean (PR.md only — orchestrator-self walk)

Manual walk per orchestrator: scan with the autolink-in-backticks
regex (per memory `feedback_lychee_autolink_in_backticks`) and confirm
zero hits — no `{word}`-shaped autolinks inside backticks; no `:line`
suffix on file links; no `npmjs.com` URLs; no markdown-link tilde
paths. Pre-flight grep:

```bash
grep -nE '`[^`]*<\w+>[^`]*`' \
  docs/plans/wave-5-main/C.2-5-drag-drop-ux.md
```

Expected: zero matches. CI Lychee runs against the merged tree as
canonical; orchestrator pre-empts locally.

### AC#16 — PR.md self-listed in `## files` whitelist

```bash
grep -F 'docs/plans/wave-5-main/C.2-5-drag-drop-ux.md' \
  docs/plans/wave-5-main/C.2-5-drag-drop-ux.md | wc -l
```

Expected: `≥ 1`. Verifies the PR.md self-references in its own
`## files` whitelist per ADR-0006 D8 strict-whitelist discipline.

## verification required

The following commands run by orchestrator-self at D1 stage 4
(PRE-COMMIT CLAUDE REVIEW) and re-run by pr-writer at D1 stage 6
(ACCEPT). All 16 ACs (above) plus the D1 stage-3 codex-pr-reviewer-55
8-class checklist, plus the following augmented checks:

- `pnpm --filter @skb/editor-shell typecheck` PASS (uncached; per
  memory `feedback_git_operator_ci_verification` — turbo cache +
  vitest miss tsc errors).
- `pnpm --filter @skb/editor-shell lint` PASS (per memory
  `feedback_codex_spark_lint_gap` — codex executor doesn't auto-run
  lint; orchestrator runs independently).
- `pnpm --filter @skb/editor-shell build` PASS — `dist/` regenerates
  with the 3 new drag-drop modules typed emit.
- `pnpm size-check` PASS — every new source file under 500 LOC
  (edge-rects.ts ~150 / tiebreak.ts ~200 / outline-overlay.tsx ~130;
  all well under cap).
- `git diff --cached --stat` post-staging shows exactly the 9
  whitelisted files (no incidental snapshot / `pnpm-lock.yaml` /
  cache contamination — per memory
  `feedback_git_operator_explicit_stage`).
- Cross-package consumer parity check (per memory
  `feedback_cross_package_consumer_pattern`):
  ```bash
  grep -F 'export const GAP = 14' \
    packages/editor-shell/src/drag-drop/edge-rects.ts
  grep -F -- '--gap: 14px' apps/site/src/styles/grid.css
  ```
  Both must produce a hit — algorithmic constants are byte-equal at
  source authorities.
- Manual sanity (post-build): no consumer wire-up at C.2-5 (the
  drag/drop UX layer mount site lands at C.2-8 reducer wiring + C.4
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
plan v1.1 row C.2-5 + ADR-0017 D2 / D3 / D4 / D5 + Q2 / Q3 / Q4
absorbtion notes + ADR-0006 8-class audit checklist are the
authoritative inputs. No plan-challenger dispatch occurred at PLAN
stage; the Wave 5 plan was already plan-challenger-vetted at Pre-A5
lock + v1.1 R14 amendment 2026-05-05; ADR-0017 was already
plan-challenger-vetted at Pre-A3 lock (13/13 challenges absorbed —
3 high + 8 medium + 2 low; 11 ABSORBED + 2 PARTIALLY ABSORBED).

If pr-writer encounters a substantive open question during PLAN draft
(beyond the option-1-vs-option-2/3 question which is LOCKED at
ADR-0017 D5 option 1 for MVP + the C.2-8-deferral question which is
LOCKED per Wave 5 plan v1.1 row C.2-8), it surfaces the question in
the PLAN-stage SendMessage to orchestrator BEFORE lock.

**Open questions surfaced during PLAN draft** (none blocking lock;
all resolved IN FAVOR of the PLAN as written):

- Should `OutlineOverlay` ship the full 3-class layered system
  (`new` + `host` + `shifted-block`) per ADR-0017 D4 Q4 absorbtion
  CSS block? **Resolved**: NO — only the active accent (the `new`
  outline equivalent matching cursor position) ships in C.2-5; the
  `host` (split-left/right halve preview) + `shifted-block` (insert-
  row push-down preview) layered overlays require the layoutReducer
  preview-state machine which is C.2-8 territory. C.2-5 ships the
  pure cursor-driven active accent only — sufficient to test the
  `tiebreak()` algorithm visually without the reducer.

- Should drag/drop modules use design-tokens (`--accent`,
  `--accent-soft`) at C.2-5? **Resolved**: NO — Stage C.3 ships the
  ADR-0018 design-tokens package; C.2-5 ships only structural class
  names (`skb-grid-outline-base`, `skb-grid-outline-accent--{mode}`)
  and inline `position: absolute` + geometry styles. Token
  application lands at C.3 / Stage C.4 wire-up.

## R14 self-check

R14 = the 14-point pre-flight per ADR-0011 / Wave 5 plan §232 D12
"PR.md PLAN-stage validation":

1. ✅ **Stage scope-fence** — only files inside the locked Stage
   C.2-5 whitelist (9 files; cross-package files NOT touched).
   Row C.2-5 in plan v1.1 cites
   `packages/editor-shell/src/drag-drop/{edge-rects,tiebreak,outline-overlay}.ts`
   (NEW) + tests; this PR adds 3 source + 3 test + 2 modified
   (barrel + CONTRACT.md) + PR.md self.
2. ✅ **TDD-front discipline** — `## test_cases` section enumerates
   25 vitest test cases (8 + 12 + 5) before any implementation file
   per ADR-0011 D1 stage 2; codex-generic-executor MUST land tests
   first (red), then impl (green).
3. ✅ **Cross-package consumer parity** — per memory
   `feedback_cross_package_consumer_pattern`. The `GAP = 14`
   constant exported from `edge-rects.ts` is byte-equal-checked
   against `apps/site/src/styles/grid.css` `--gap: 14px` at AC#4
   + the verification block. Drift = algorithmic replication failure
   mode the memory codifies.
4. ✅ **Q2 v1.1 mechanical guard** — AC#12 grep proves zero
   `_gridAttrsExplicit` references in the new
   `packages/editor-shell/src/drag-drop/` directory; CONTRACT.md
   subsection cites Wave 5 plan v1.1 row C.2-3.5 hard-throw flip
   end-state (squash `b019a31`).
5. ✅ **Codex spark lint gap** — per memory
   `feedback_codex_spark_lint_gap` — orchestrator-self runs `pnpm
   --filter @skb/editor-shell lint` post-codex independently before
   authorising commit; verification block enumerates this.
6. ✅ **Codex audit-log self-recursion** — per memory
   `feedback_codex_audit_log_recursion` — codex executor invocation
   pipes audit log to `/tmp/codex-runs/...` first, NOT directly to
   `docs/audits/codex-runs/...`; orchestrator copies post-completion.
7. ✅ **Lychee discipline** — per memories
   `feedback_lychee_autolink_in_backticks` +
   `feedback_lychee_line_anchor` + `feedback_lychee_npmjs_403` +
   `feedback_lychee_user_local_paths` — PR.md uses no
   angle-bracketed-word-shape autolinks inside backticks; no
   `:line` suffix on file links; no
   `npmjs.com` URLs; no markdown-link tilde paths. AC#15 enumerates
   the pre-empt grep.
8. ✅ **WE-009 multi-worker lint contamination** — per memory
   `feedback_multi_worker_lint_contamination`. C.2-5 is single-PR
   serial work (no concurrent worker B); standard lockfile
   isolation suffices. orchestrator runs `pnpm --filter
   @skb/editor-shell` filtered scope to avoid neighbouring package
   lint contamination.
9. ✅ **PR Reviewer authority at HEAD** — per memory
   `feedback_pr_reviewer_authority_at_head`. ADR-0017 D2 / D3 / D4 /
   D5 + memory references are read at HEAD `465588e` for this PR.md
   draft; not from earlier review-report quotes.
10. ✅ **WE-011 active-writer break WE-009** — per memory
    `feedback_active_writer_break_we009`. C.2-5 scope is
    `packages/editor-shell/` only; siblings (`packages/block-*` /
    `packages/mdx-bridge` / `packages/block-foundation` /
    `apps/site/`) are quiescent for the duration of this PR.
11. ✅ **WSL2 chromium launch** — per memory
    `feedback_wsl2_chromium_launch`. C.2-5 vitest suite uses
    happy-dom (no Playwright); WSL2 chromium launch issue does NOT
    apply. Future C.2-8 + Stage C.4 PR may wire Playwright; not
    here.
12. ✅ **Wave 3 main pipeline auto-merge** — per memory
    `feedback_wave3_auto_merge`. orchestrator post-merge uses `gh
    pr merge --squash --delete-branch` once ACCEPT-PASS + all CI
    SUCCESS (with the post-merge `conclusion = "SUCCESS"` correctness
    check per memory `feedback_gh_pr_ci_conclusion_vs_status`).
13. ✅ **R14 defer-chain** — per memory
    `feedback_r14_defer_chain_plan_amendment`. C.2-5 is a fresh
    PR off main `465588e` (post C.2-3.5 merge + active.md sync);
    no defer-chain residue carried over. Open questions in
    `## Plan-challenger absorbtion` resolved IN FAVOR of plan; no
    follow-up tracked as residue.
14. ✅ **gh PR CI conclusion vs status** — per memory
    `feedback_gh_pr_ci_conclusion_vs_status`. The `## executor`
    Stage 7 ACCEPT block names `gh run view --json conclusion`
    parsing `conclusion === "SUCCESS"` (NOT `status === "COMPLETED"`);
    orchestrator post-merge auto-merge script will use the hardened
    pattern.

## D2 trigger judgment

ADR-0011 D2 v0.1.1 trigger row evaluation for C.2-5:

- **Row 1 (CONTRACT change)** — **HIT**. New
  `### Drag/Drop layer (C.2-5)` subsection in
  `packages/editor-shell/CONTRACT.md` codifies new public surface
  (3-module exports + `EDGE_W = 2 * GAP` mathematical-coupling
  invariant + cross-package consumer parity constraint). Per
  ADR-0017 §502 sister-doc-sync — same-PR-with-implementation sync
  site.

- **Row 2 (package add/remove)** — **NOT HIT**. No new package; no
  package removal. `packages/editor-shell/src/drag-drop/` is a new
  directory under the existing `@skb/editor-shell` package.

- **Row 3 (≥1 npm dep change)** — **NOT HIT**. NO `package.json` /
  `pnpm-lock.yaml` change. All needed devDeps already at A2 lock.

- **Row 4 (NEW ADR required)** — **NOT HIT** per Wave 5 plan v1.1
  §455+ ROW 4 门槛规则. ADR-0017 D2 / D3 / D4 / D5 + Q2 / Q3 / Q4
  absorbtion notes already authorise the entire surface. No D-list
  amendment needed; no new ADR.

- **Row 5 (cross ≥3 packages OR boundary contract change)** — **HIT**.
  `packages/editor-shell/CONTRACT.md` boundary contract extended;
  drag/drop layer is the editor-side consumer of `BlockGridPosition`
  from `@skb/block-foundation` + the cross-package consumer parity
  to `apps/site/src/styles/grid.css` `--gap: 14px` (C.2-3 authority);
  downstream consumers C.2-8 (layoutReducer) + C.2-9 (responsive
  reducer) + Stage C.4 (mount site wire-up) depend on this surface.

- **Row 6 (deploy / CI / security touched)** — **NOT HIT**. No CI
  config / deploy / auth change.

- **Row 7 (≥3 reviewers required)** — **NOT HIT** by file-count
  triage. C.2-5 is 9-file serial work; D1 stage 3
  codex-pr-reviewer-55 + D1 stage 4 PRE-COMMIT CLAUDE REVIEW
  (orchestrator-self) suffice.

- **Row 8 (high-risk class: deploy / auth / security)** — **NOT HIT**.

**Verdict**: Row 1 + Row 5 HIT → **PRE-COMMIT CLAUDE REVIEW (D1 stage
4) FIRES**. ADR-0006 8-point checklist mandatory at codex review (D1
stage 3) per ADR-0011 D6. orchestrator runs PRE-COMMIT CLAUDE REVIEW
between stage 3 PASS and stage 5 commit — same-model echo-chamber
mitigation per ADR-0011 D2 design rationale.

## Risk register

8 known risks — pre-flight mitigations enumerated. Stage 3 codex
review + Stage 4 PRE-COMMIT CLAUDE REVIEW evaluate each.

### Row 1 — `layoutReducer` + drag-ghost + Esc + drop-pulse premature shipping

**Risk**: codex-generic-executor pulls extra ADR-0017 D8 / D10 / D11 /
D12 surface forward into C.2-5 (over-eager scaffolding); LOC budget
balloons ≥ 1200; scope creeps into C.2-8 row.

**Mitigation**: PR.md `## title` LOCKED implementation path block
explicitly forbids the over-eager scope. AC#12 + the file-list
whitelist constrain to 3 source modules. Stage 3 codex review
checks the diff stays inside the 9-file whitelist.

### Row 2 — `EDGE_W` / `GAP` drift vs grid.css authority

**Risk**: codex-generic-executor authors `EDGE_W = 32` or `GAP = 16`
matching some other token system, breaking the `EDGE_W = 2 * GAP =
2 * 14 = 28` mathematical-coupling invariant + cross-package consumer
parity to `apps/site/src/styles/grid.css` `--gap: 14px`.

**Mitigation**: AC#4 byte-equal grep + AC#5 `EDGE_W = 2 * GAP`
literal grep. TC1.1 + TC1.2 + TC1.3 vitest. CONTRACT.md prose +
file-head JSDoc both cite the cross-package consumer parity
constraint. Per memory
`feedback_cross_package_consumer_pattern` — algorithmic constants
must be byte-equal at source authorities.

### Row 3 — `tiebreak()` step ordering bug (Step 2 fires when speed ≤ 0.5)

**Risk**: codex-generic-executor authors `if (speed >= 0.5)` instead
of `if (speed > 0.5)` (boundary-condition bug; ADR-0017 D3 line 122
specifies strict greater-than). At `velocity = (0.5, 0)`, mistaken
implementation enters velocity path; correct implementation falls
to spatial fallback.

**Mitigation**: TC2.8 ε=0.5 jitter suppression test fixture has
`velocity = (0.4, 0.3)` with `Math.hypot(0.4, 0.3) = 0.5` exactly —
asserts spatial fallback wins. Boundary correctness baked into vitest.

### Row 4 — `findMatches()` open-vs-closed-interval bug at boundary 14

**Risk**: codex authors `abs(d) < 14` (open interval) instead of
`abs(d) <= 14` (closed; ADR-0017 D3 距离公式表 hit 条件 column +
Q2 absorbtion). Cursor exactly at `14` is then a miss — drops a
valid edge match in the gap-overlap region.

**Mitigation**: TC2.12 fixtures distance 13 (interior hit) / 14
(boundary hit) / 15 (miss); asserts boundary IS a hit (closed
interval). Per ADR-0017 D3 line 89-92 explicit `closed interval`
prose.

### Row 5 — `OutlineOverlay` re-renders on every drag tick

**Risk**: React component re-renders on every `mousemove` event
(60fps × n=30 blocks = budget concern). Per ADR-0017 D5 line 232 —
n=30 ≤ 0.05ms/frame budget assumes pure JS path.

**Mitigation**: `OutlineOverlay` consumes only `activeMatch +
blockRects` props; no internal state. React reconciliation skips
unchanged subtrees. Performance assertion deferred to Stage C.4
Playwright `performance.now()` budget check (per ADR-0017 AC#6;
C.2-5 vitest tests structural correctness, not 60fps performance).

### Row 6 — Floating-point precision on signed distance calculation

**Risk**: cursor at `block.left + 14.000000001` (sub-pixel drift)
fails `abs(d) <= 14` literal comparison.

**Mitigation**: ADR-0017 D3 line 116 uses `Math.min(...matches.map(m =>
Math.abs(m.distance)))` for primary sort — sub-pixel drift handled
by sort comparison rather than equality test. TC2.12 uses integer
boundary values (13 / 14 / 15); sub-pixel cases are inherent to
DOMRectReadOnly source values, not the algorithm. Per ADR-0017 D5
per-event O(n) budget — sub-pixel handling deferred to Stage C.4
integration testing.

### Row 7 — `_gridAttrsExplicit` mechanical guard fails post-codex

**Risk**: codex-generic-executor copies a snippet from `mdx-bridge/`
(C.2-1/C.2-2/C.2-3 era) that references `_gridAttrsExplicit`,
violating Q2 v1.1 absorbtion downstream-must-not-reuse rule.

**Mitigation**: AC#12 grep proves zero references in the new
drag-drop directory. Stage 3 codex review + Stage 4 PRE-COMMIT
CLAUDE REVIEW both check.

### Row 8 — Lychee autolink-in-backticks regression in PR.md

**Risk**: PR.md prose contains an angle-bracketed-word shape inside
backticks (e.g., a TypeScript generic example). Lychee parses as
autolink and fails the link-check.

**Mitigation**: AC#15 grep pre-empt; orchestrator scans before
push. PR.md author (this draft) self-checked: no
angle-bracketed-word-shape autolinks inside backticks. The
`div class="..." /` JSX-style
prose in the test case section uses single quotes via the
`<div class=` literal — verify post-draft.

## Out of scope

Explicitly out of scope per ADR-0017 D-list deferrals + Wave 5 plan
v1.1 row C.2-8 / C.2-9 / Stage C.3 / Stage C.4 enumeration:

- **`layoutReducer` + `layoutEpoch` + drag/drop event-loop wiring**
  (ADR-0017 D12 + ADR-0016 D12) — deferred to **C.2-8** per Wave 5
  plan v1.1 row C.2-8. C.2-5 emits geometric primitives + visual
  feedback only; mutation pipeline lands C.2-8.

- **drag-ghost** (ADR-0017 D10 — `.drag-ghost` cursor-follow + per-
  kind coloring + glyph rotation) — deferred to **C.2-8**.

- **drop-pulse 720ms animation** (ADR-0017 D11 — `--accent-success`
  token-driven halo) — deferred to **C.2-8** (animation) + Stage C.3
  (token integration via ADR-0018).

- **Global Esc cancel** (ADR-0017 D8 — global keydown listener +
  `drag-active` flag conflict resolution with textarea / Tiptap
  keymap) — deferred to **C.2-8**.

- **Source block lift mode** (ADR-0017 D6 — `display: none` on
  drag-start; snapshot edge rects exclude source block) — deferred
  to **C.2-8** (requires the layoutReducer + drag-active flag
  ownership).

- **Full 3-class outline overlay layered system** (`new` + `host` +
  `shifted-block`; ADR-0017 D4 Q4 absorbtion CSS block) — deferred
  to **C.2-8**. C.2-5 ships only the active accent overlay matching
  cursor position (the `new` overlay's geometric equivalent without
  the layered preview-state machine).

- **col-ruler + size-tooltip** (ADR-0017 D9 — resize feedback;
  consume ADR-0016 D6 COL_SNAPS) — deferred to **C.2-6** per Wave
  5 plan v1.1 row C.2-6 resize handle + col-ruler PR.

- **Resize handles** (`.gblock-handle.right` / `.bottom` / `.corner`;
  ADR-0017 D9 — kind-based handle visibility) — deferred to **C.2-6**.

- **Mobile 1-col disable path** (ADR-0017 D9 Q9 absorbtion —
  `.skb-grid--mobile` hide drag-handle + outline + ghost + drop-pulse
  + Esc inactive; Tiptap content-edit retained) — deferred to
  **C.2-9** responsive transition reducer PR.

- **ResizeObserver-driven edge-rect re-computation during drag**
  (ADR-0017 D4 Q5 absorbtion — drag不中断 + new edge-rects on next
  rAF when grid container ResizeObserver fires) — deferred to
  **C.2-9** responsive transition.

- **Markdown rowSpan='auto' freeze during drag** (ADR-0017 D6 Q7
  absorbtion — `frozenRowSpan` snapshot at drag-start; ResizeObserver
  ignored during drag-over) — deferred to **C.2-8** (requires drag-
  active flag).

- **Touch / mobile drag** (touchstart/touchmove/touchend listeners;
  ADR-0017 D9 Q9 absorbtion explicit OUT OF SCOPE for Wave 5; mobile
  is preview-mode + Tiptap content-edit only) — out of Wave 5
  entirely; Phase 2+.

- **Token application** (`--accent`, `--accent-soft`,
  `--accent-success` for outline / drag-ghost / drop-pulse coloring;
  ADR-0018 design-tokens) — deferred to **Stage C.3** (token
  integration PR).

- **Astro renderer / `apps/site/` mount site wire-up** — deferred to
  **Stage C.4** wire-up PRs.

- **Playwright `performance.now()` 60fps budget assertion** (ADR-0017
  AC#6) — deferred to **Stage C.4** (Playwright setup + WSL2
  chromium launch path resolution).

- **Modal canvas drag/drop internal behavior** — out of Wave 5
  entirely; Phase 2+ (ADR-0019+).

- **CRDT/OT collaborative editing** — out of Wave 5 entirely; Phase
  2+ per ADR-0016 D12 + ADR-0017 D12 single-user single-session
  assumption.

- **Heavy block boundary skeleton during drag transit** (ADR-0014
  v0.5 amendment — `heavyBoundaryDimensions` 联动 colSpan / rowSpan)
  — deferred to **C.2-7** per Wave 5 plan v1.1 row C.2-7.

## executor

`codex-generic-executor` per ADR-0011 D6 + Wave 5 plan v1.1 row C.2-5
column 4. Stage 2 D1 EXECUTE. Approval policy: `never`. Sandbox:
`workspace-write`. Audit log: pipe to
`/tmp/codex-runs/2026-05-05-C.2-5-drag-drop-ux.txt` first per memory
`feedback_codex_audit_log_recursion`; orchestrator copies to
`docs/audits/codex-runs/2026-05-05-C.2-5-drag-drop-ux.txt` after
exec completes (head -50 + R21 grep verdicts if log > 500 KB).

Codex prompt synthesis: orchestrator-self walks PR.md sections `##
title` + `## files` (whitelist) + `## test_cases` (TDD-front 25 cases)
+ `## acceptance` (16 ACs) into the codex-generic-executor stdin
prompt; codex executor MUST land tests first (red), then impl
(green), then verify all 16 ACs locally before SendMessage to
orchestrator.

Per memory `feedback_codex_stdin` — pipe `< /dev/null` to `codex
exec` invocation to avoid stdin-hang.

Per memory `feedback_orchestrator_owns_approval` — codex profile uses
`approval_policy = "never"`; orchestrator-self is the only human-in-
the-loop interface.

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
`docs/plans/active.md` row C.2-5 from `WIP` → `MERGED` plus the
new squash hash (separate fast-follow PR per active.md sync
discipline).

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging discipline + memory
`feedback_git_operator_explicit_stage` 4-step protocol:

```bash
# Step 1: reset HEAD to clean staging area (race-proof against concurrent
# stagers; single-PR serial work but discipline is universal).
git reset HEAD

# Step 2: explicit add (no -A / no .) — exactly the 9 whitelisted files.
git add packages/editor-shell/src/drag-drop/edge-rects.ts \
        packages/editor-shell/src/drag-drop/tiebreak.ts \
        packages/editor-shell/src/drag-drop/outline-overlay.tsx \
        packages/editor-shell/src/__tests__/drag-drop/edge-rects.test.ts \
        packages/editor-shell/src/__tests__/drag-drop/tiebreak.test.ts \
        packages/editor-shell/src/__tests__/drag-drop/outline-overlay.test.tsx \
        packages/editor-shell/src/index.ts \
        packages/editor-shell/CONTRACT.md \
        docs/plans/wave-5-main/C.2-5-drag-drop-ux.md

# Step 3: verify --cached --stat shows exactly 9 entries; no
# pnpm-lock.yaml; no incidental snapshot file.
git diff --cached --stat
# Expected: 9 files; expected line-delta totals roughly:
#   edge-rects.ts             ~150 LOC (NEW)
#   tiebreak.ts               ~200 LOC (NEW)
#   outline-overlay.tsx       ~130 LOC (NEW)
#   edge-rects.test.ts        ~100 LOC (NEW)
#   tiebreak.test.ts          ~190 LOC (NEW)
#   outline-overlay.test.tsx  ~75 LOC (NEW)
#   index.ts                  +8 LOC (MODIFIED)
#   CONTRACT.md               +60 LOC (MODIFIED)
#   C.2-5-drag-drop-ux.md     ~900 LOC (NEW; this PR.md)

# Step 4: commit (NO --amend; new commit per WE-009 worker-side
# memory).
git commit -m "Wave 5 C.2-5 — editor-shell drag/drop UX layer (edge-rects + tiebreak + outline-overlay) (6 of 12 Stage C.2)

Implements ADR-0017 D5 option 1 (pre-computed edge rects) + D3
tiebreak distance formula + D4 outline overlay scheme A active accent
in @skb/editor-shell. layoutReducer + drag-ghost + Esc cancel +
drop-pulse + full 3-class layered overlay deferred to C.2-8.

* 3 NEW pure modules under packages/editor-shell/src/drag-drop/:
  - edge-rects.ts (EDGE_W=28, GAP=14, computeEdgeRects)
  - tiebreak.ts (tiebreak with velocity + spatial fallback +
    blockId.localeCompare; findMatches with closed |d|<=14)
  - outline-overlay.tsx (React component; activeMatch-driven dashed
    accent on 4 modes; static base always rendered)
* 3 NEW vitest suites; 25 cases total (8 + 12 + 5).
* Barrel re-exports added to packages/editor-shell/src/index.ts.
* CONTRACT.md extended with NEW '### Drag/Drop layer (C.2-5)'
  subsection codifying public surface + EDGE_W = 2 * GAP
  cross-package consumer parity to apps/site/src/styles/grid.css
  --gap: 14px.

Per ADR-0017 D2 / D3 / D4 / D5; ADR-0016 D11 (Tiptap inside / grid
outside); Wave 5 plan v1.1 row C.2-5.

Co-authored-by: codex-generic-executor"
```

Reviewer codex (D1 stage 5; reviewer = `codex-pr-reviewer-55`)
performs the actual commit + push under `codex exec --yolo --profile
codex-pr-reviewer-55` — NOT pr-writer (per ADR-0011 D7 forbidden-
permission rule for pr-writer subagent). orchestrator dispatches
the reviewer codex with the PR.md as input.

## Related

- [ADR-0017 D2 / D3 / D4 / D5](../../decisions/ADR-0017-drag-drop-ux.md)
  — Drag/Drop UX design lock; C.2-5 implements the option 1 + tiebreak
  + outline overlay scheme A surface.
- [ADR-0016 D11 + W5-1 + D12](../../decisions/ADR-0016-grid-data-model.md)
  — Tiptap inside / grid outside 分层 + BlockGridPosition shape
  consumer + layoutEpoch reducer schema (impl deferred C.2-8).
- [ADR-0011 D1 / D2 / D6](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — Linear pipeline; D2 row 1 + row 5 trigger judgment; D6 codex
  patterns (codex-generic-executor + codex-pr-reviewer-55).
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — 8-class checklist + explicit-file-list commit staging.
- [Wave 5 plan v1.1 row C.2-5](v1.1-plan-amendment-r14.md)
  — Wave 5 plan amendment R14 lock; row C.2-5 cite at line 497.
- [Wave 5 plan Pre-A3 ADR-0017 lock](Pre-A3-adr-0017-drag-drop-ux.md)
  — Pre-A3 ADR design-lock PR (13/13 plan-challenger absorbed).
- [C.2-4 editor-shell grid container](C.2-4-editor-shell-grid.md)
  — Sibling C.2 PR; squash `de13d15`. Established the
  `## Grid layout (Wave 5)` section in editor-shell CONTRACT.md
  that C.2-5 extends with the `### Drag/Drop layer (C.2-5)`
  subsection.
- [C.2-3.5 mdx-bridge hard-throw flip](C.2-3.5-mdx-bridge-hard-throw-flip.md)
  — Sibling C.2 PR; squash `b019a31`. Established the
  contract-active end-state for `_gridAttrsExplicit` removal that
  C.2-5 honors via the AC#12 mechanical guard.
- [C.2-3 Astro renderer grid + Responsive 12/6/1](C.2-3-astro-grid.md)
  — Sibling C.2 PR; squash `2586328`. Established the
  `apps/site/src/styles/grid.css` `--gap: 14px` authority that
  C.2-5 cross-references for consumer parity.
- [C.2-2 block-foundation grid primitives](C.2-2-block-foundation-grid.md)
  — Sibling C.2 PR; squash `b15ba24`. Established the
  `BlockGridPosition` + `COL_SNAPS` + `proseGridDefaults` authority.
