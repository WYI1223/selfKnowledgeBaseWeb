# C.2-10 — Playwright drag scenarios + edge-rect tiebreak fixtures (per ADR-0017 AC#1-#12)

> **Wave 5 Stage C.2 11th implementation PR** of the locked 13-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.3 row C.2-10 line 691). Lands the
> **Playwright spec** that exercises the editor-shell drag/drop hit-test
>
> - tiebreak + outline + lift contracts shipped at C.2-5 / C.2-6 / C.2-8 /
>   C.2-9 against a real DOM (production-shape Astro page). C.2-1 through
>   C.2-9 all merged on main; the editor-shell barrel at HEAD already
>   exports `EDGE_W` + `GAP` + `computeEdgeRects` + `tiebreak` + `findMatches`
> - `OutlineOverlay` + `DropPulse` + `DragGhost` + `useEscCancel` +
>   `layoutReducer` + `useResponsiveCols`. ADR-0017 §371-386 enumerates 12
>   acceptance criteria (AC#1-#12). C.2-5 / C.2-8 / C.2-9 shipped vitest
>   coverage of the unit-level invariants; C.2-10 is the **first PR that
>   exercises those invariants in a real Chromium page** so the contract's
>   JSDOM blind spots (DOMRect / matchMedia / mouseMove event geometry)
>   are surfaced. C.2-11 follows with resize + responsive switch
>   Playwright scenarios (per plan v1.3 line 692); C.2-12 follows with
>   visual smoke baseline + perf budget (per plan v1.3 line 693). C.2-10
>   establishes the **`apps/site/playwright/grid-drag-drop.spec.ts`**
>   canonical authority for drag-related ADR-0017 AC# coverage.
>
> **Path A LOCKED (Playwright spec ONLY; no editor-shell drag wiring
> into EditorShellMount)**. The orchestrator briefing flagged a
> Path A vs Path B decision: Path A targets DOM-level fixtures and
> exercises editor-shell helpers via `page.evaluate()` calls without
> requiring drag interactivity in the apps/site editor scaffold;
> Path B would expand scope to wire `useEscCancel` / `DropPulse` /
> `DragGhost` / `layoutReducer` / `OutlineOverlay` into
> `apps/site/src/components/EditorShellMount.tsx` so a real mouse
> drag triggers the full state machine. Path B violates the Wave 5
> plan v1.3 row C.2-10 LOC budget (~600 LOC, all in the spec file)
> and overlaps **C.4-2 EditorShellMount full BlockRegistry/KernelRegistry
> wire** scope per plan v1.3 row C.4-2 line 715. Path B selection
> would also re-trigger D2 Row 1 (CONTRACT.md sync for
> EditorShellMount surface change) + Row 5 (cross-package boundary
> change apps/site ↔ editor-shell drag wire) per ADR-0007 D2 — both
> escalations C.2-9 PR #82 already paid; double-paying scope is
> ADR-0015 R14 anti-pattern. Path A locked.
>
> Path A coverage matrix: of ADR-0017's 12 ACs, **8 are exercised in
> this PR** (AC#1 mode classification visual / AC#2 EDGE_W=28
> boundary / AC#3 tiebreak distance + velocity + spatial + blockId
> stable / AC#4 static-layer-during-drag invariant / AC#5 outline
> overlay 3 classes / AC#6 hit-test perf budget / AC#8
> useAutoRowSpan integration / AC#10 col-ruler hit-stop highlight)
> and **4 are explicitly deferred to C.4-2** with `test.skip()` +
> ADR-cited reason because they require the drag-active state
> machine wired into a live editor route (AC#7 源块 lift mode /
> AC#9 全局 Esc cancel / AC#11 drag-ghost cursor-follow / AC#12
> drop-pulse 720ms post-drop animation). The deferred 4 ACs all
> require a real `mousedown → mousemove → mouseup` sequence to
> dispatch `drag-start` / `drag-end-success` actions on the
> editor-shell `layoutReducer` from the apps/site mount site,
> which lives at C.4-2 — not C.2-10's scope. AC#10 col-ruler is
> **partially** covered (the highlight transition test); the full
> resize+responsive scenarios (12 viewport-switch fixtures) live
> at C.2-11 per plan v1.3 row C.2-11.
>
> **`ui_touch: false` (mechanical D9.1 detection)** per ADR-0011
> D9.1 path patterns + Wave 5 plan v1.3 §551 retrofit catalog Q1
> absorbtion clarification (mechanical detection for
> `apps/site/playwright/**` paths). The path
> `apps/site/playwright/grid-drag-drop.spec.ts` does NOT match any
> of the 7 D9.1 path-pattern regexes (`apps/site/src/pages/**` /
> `apps/site/src/components/**` / `apps/site/src/styles/**` /
> `packages/*/src/ui-default/**` /
> `packages/heavy-block-boundary/src/**` /
> `packages/editor-shell/src/**` / `packages/design-tokens/**`).
> `pnpm exec tsx scripts/check-ui-touch.ts` returns
> `ui_touch=false` mechanically; CI gate `e2e-coverage-check`
> auto-skips per ADR-0011 D9.6. The `## e2e_smoke` field is
> mechanically empty (`[]`), even though the PR's PURPOSE is
> Playwright drag scenario coverage. This is the **first per-Wave-5
> PR to exercise the catalog-defined `ui_touch=false` /
> `e2e_smoke=[]` shape for a Playwright-spec-only diff** (mirrors
> the planned C.2-11 + C.2-12 + C.3-5 + C.4-5 patterns; C.3-5
> precedent at v1.3 catalog §598-605). The Playwright spec runs
> via the existing `visual-smoke` CI job which executes
> `pnpm --filter @skb/site test:visual` covering ALL specs in
> `apps/site/playwright/**` — no new CI job needed.
>
> **D2 trigger judgment Standard** per Wave 5 plan v1.3 row C.2-10.
> NO CONTRACT.md change (`packages/editor-shell/CONTRACT.md` is
> not modified — this PR consumes existing public surface only;
> NO new export added to the editor-shell barrel; NO existing
> export signature widened). NO package metadata change. NO
> cross-package boundary widening. PRE-COMMIT CLAUDE REVIEW does
> NOT fire. Standard 5-stage D1 (PLAN → EXECUTE → REVIEW → COMMIT
> → ACCEPT).

## title

Land the Playwright spec exercising ADR-0017 drag/drop hit-test +
tiebreak + outline + perf invariants (8 of 12 ACs) against a real
Chromium page at `/sample-blocks-astro`, deferring the 4 ACs that
require drag-active state machine wiring (AC#7 / AC#9 / AC#11 /
AC#12) to C.4-2 EditorShellMount full wire-up per plan v1.3 row
C.4-2 line 715. **NEW `apps/site/playwright/grid-drag-drop.spec.ts`**
~520 LOC; 12 test cases (one per ADR-0017 AC#) wrapped in 3
describe blocks (`AC#1-#5 hit-test geometry` / `AC#6, #8, #10
helper integration` / `AC#7, #9, #11, #12 deferred to C.4-2`).
**NEW `apps/site/playwright/grid-drag-drop.fixtures.ts`** ~80 LOC
with helper functions (`measureBlockBounds()` /
`computeExpectedEdgeRect()` / `simulateCursorAt()` shared between
test cases). Spec opens `/sample-blocks-astro` (existing route at
HEAD; ships 5 sample blocks per `apps/site/src/pages/sample-blocks-astro.astro`)
which renders DOM blocks with stable `[data-block="KIND"]`
selectors (KIND placeholder for the actual block kind value such
as callout / code / image / math / pdf). Each test case calls `page.evaluate()` to import the
editor-shell helper at runtime
(`import('@skb/editor-shell').then(m => m.computeEdgeRects(...))`),
performs DOM measurement against the rendered blocks, and asserts
the helper output matches the expected ADR-0017 contract. Ships
the canonical WSL2-skip pattern at the top of the spec file (per
memory `feedback_wsl2_chromium_launch.md` + 3 existing
`apps/site/playwright/*.spec.ts` precedents at HEAD lines 1-17:
`heavy-block-layout-shift.spec.ts` / `sample-blocks-astro.spec.ts`
/ `search.spec.ts`).

Specifically:

1. **NEW `apps/site/playwright/grid-drag-drop.spec.ts`** (~520 LOC).
   Exports nothing (Playwright test module); structure:
   - **File-head WSL2 skip pattern** (~20 LOC; verbatim copy from
     existing `apps/site/playwright/heavy-block-layout-shift.spec.ts`
     lines 1-17 per memory `feedback_wsl2_chromium_launch.md` —
     `import { execFileSync } from 'node:child_process'` +
     `import os from 'node:os'` + `function isWsl2(): boolean
{ ... }` + `test.skip(isWsl2(), 'Chromium launch is unreliable
under WSL2 in this repo');` at module scope so all 12 test
     cases skip on WSL2 dev machines yet run normally in CI Linux
     containers per playwright.config.ts `webServer` astro
     build+preview pattern).
   - **File-head JSDoc** citing ADR-0017 AC#1-#12 line 371-386 +
     ADR-0017 D2 EDGE_W=28 line 65-79 + ADR-0017 D3 tiebreak
     formula line 81-160 + ADR-0017 D4 outline overlay line 172+
     - ADR-0011 D9.6 CI gate auto-skip + Wave 5 plan v1.3 row
       C.2-10 line 691. JSDoc explicitly notes the 8/4 AC coverage
       split + the Path A vs Path B decision rationale + forward
       pointer to C.4-2 for the 4 deferred ACs.
   - **Imports**: `expect, test, type Page` from `@playwright/test`;
     `measureBlockBounds, computeExpectedEdgeRect, simulateCursorAt`
     from `./grid-drag-drop.fixtures` (sibling helper file).
   - **`describe('AC#1-#5 hit-test geometry against /sample-blocks-astro')`**
     wrapping 5 test cases: - **`test('AC#1 — 4 mode classification at edge positions
(split-left/right/top/bottom + empty + none)')`**: navigate
     `/sample-blocks-astro`; locate `[data-block="callout"]` →
     measure its bounding box via `measureBlockBounds(page,
'callout')` (returns `{ left, top, right, bottom, width,
height }` in viewport coordinates). Define 6 cursor
     positions (one per mode): cursor at `left+1` y-center →
     expects `findMatches` returns the `split-left` mode for
     that block; cursor at `right-1` y-center → expects
     `split-right`; cursor at x-center `top+1` → expects
     `split-top`; cursor at x-center `bottom-1` → expects
     `split-bottom`; cursor at viewport corner `(20, 20)` (no
     block) → expects empty matches array; cursor at block
     center `(left+width/2, top+height/2)` → expects empty
     matches (none mode = block interior > EDGE*W/2 from any
     edge). For each case, call `page.evaluate()` to invoke
     `computeEdgeRects` + `findMatches` against the measured
     block layout and assert the returned mode. **Cites
     ADR-0017 §47-53 D1 mode table + §371-376 AC#1**. - **`test('AC#2 — EDGE_W = 28 boundary half-in/half-out
(|x| ≤ 14 hit; |x| > 14 none/empty)')`**: locate
     `[data-block="callout"]`; measure bounds. Cursor at
     `right - 14` y-center (boundary inside block) → expects
     `split-right` match (closed `≤` interval per ADR-0017 D3
     table line 87-92 hit condition column). Cursor at
     `right - 15` y-center (1px inside boundary) → expects no
     split-right match (none mode — > EDGE_W/2 from edge per
     ADR-0017 D3 line 89). Cursor at `right + 14` y-center
     (boundary outside block) → expects `split-right` match
     (still within EDGE_W/2 of the right edge). Cursor at
     `right + 15` y-center (1px outside boundary) → expects no
     split-right match (empty mode — > EDGE_W/2 + outside
     block per ADR-0017 D1 line 53). 4 boundary fixture
     assertions per cardinal direction (test loop covers
     split-left + split-right + split-top + split-bottom = 16
     boundary checks total). **Cites ADR-0017 §63-79 D2 + §86-94
     D3 hit condition table + §377 AC#2**. - **`test('AC#3 — tiebreak distance + velocity-direction +
spatial fallback + blockId stable')`**: navigate
     `/sample-blocks-astro` (which renders 5 blocks in the
     `.skb-grid` container); locate two adjacent blocks (e.g.,
     `[data-block="callout"]` + `[data-block="code"]` if
     horizontally adjacent in the rendered grid; OR fabricate
     expected adjacent layout via two synthetic block bounds
     passed to `findMatches` via `page.evaluate()` if the
     sample-blocks layout doesn't naturally produce adjacency
     — defer to executor judgment at TDD step). 6 fixture
     cases per ADR-0017 D3 §95-160 tiebreak formula table:
     (1) cursor offset left of gap-center (`A.right - 4` from
     left block's right) → `split-right` on A wins (distance
     4 < distance 10); (2) cursor offset right of gap-center
     (`B.left + 4` from right block's left) → `split-left` on
     B wins; (3) cursor exactly at gap-center +
     `velocity={vx: 1, vy: 0}` (rightward drag) →
     `split-left` on B wins per velocity-direction priority
     (cursor moving right → next-edge wins); (4) cursor at
     gap-center + `velocity={vx: -1, vy: 0}` (leftward drag)
     → `split-right` on A wins; (5) cursor at gap-center +
     `velocity={vx: 0.3, vy: 0}` (|vx| ≤ ε=0.5 jitter
     suppression) → spatial fallback by `block.left`
     smaller-wins → `split-right` on A wins (A.left < B.left);
     (6) cursor at gap-center + `velocity={vx: 0, vy: 0}` +
     fixture with same `block.left` (synthetic — A and B at
     identical x but different blockId) → blockId
     lexicographic stable wins (e.g., 'aaa' < 'bbb' →
     'aaa' wins). For each case, build `EdgeMatch[]` array via
     `page.evaluate(() => import('@skb/editor-shell').then(m
=> m.findMatches(...).then(matches => m.tiebreak(matches,
velocity))))` and assert the returned `EdgeMatch.blockId` - `mode`. **Cites ADR-0017 §81-160 D3 tiebreak table +
     formula + §378 AC#3**. - **`test('AC#4 — static layer invariant during drag (grid
container computed style + block.gridColumn / block.gridRow
unchanged)')`**: navigate `/sample-blocks-astro`; capture
     `getComputedStyle(.skb-grid).gridTemplateColumns` +
     `[data-block="callout"]` `gridColumn` + `gridRow` at T0.
     Synthesize a hit-test simulation by calling
     `page.evaluate()` to invoke `computeEdgeRects` + `tiebreak`
     (NOT a real drag — Path A constraint per the file-head
     JSDoc). Re-capture `getComputedStyle(.skb-grid)` +
     `gridColumn` + `gridRow` at T1 (post-helper-invocation).
     Assert byte-equal: `T0.gridTemplateColumns ===
T1.gridTemplateColumns` + `T0.gridColumn === T1.gridColumn` - `T0.gridRow === T1.gridRow`. AC#4 invariant: helper
     invocation does NOT reflow the grid (read-only DOM
     measurement). Note in test JSDoc that the FULL AC#4
     contract (drag-overlay element shown + grid unchanged
     \_during a real drag*) requires drag-active state machine
     wired in apps/site EditorShellMount which lives at C.4-2
     per plan v1.3 row C.4-2 line 715; this test exercises
     the read-only-helper-invocation half of AC#4 (proves
     helper invocation alone does NOT mutate static layer).
     **Cites ADR-0017 §172+ D4 outline overlay + §379 AC#4**. - \*\*`test('AC#5 — outline overlay 3 classes (z-index 10/20/30
       - pointer-events: none + opacity 0.5/0.55/0.7) renders per
         mode in synthetic harness')`**: render the editor-shell
     `OutlineOverlay`component into a synthetic harness page
     via`page.evaluate()`+ dynamic ReactDOM.render (or use
     the Astro page's existing OutlineOverlay mount if Astro
     dev exposes one; defer to executor TDD step). Assert
     computed style`z-index: 10`for`.skb-outline-shifted-block`,
     `z-index: 20`for`.skb-outline-host`, `z-index: 30`for`.skb-outline-new`. Assert `pointer-events: none`on all
     3 classes. Assert opacity 0.5 / 0.55 / 0.7 per ADR-0017
     D4 §187-194 CSS block. Per-mode rendering (split-left
     shows host + new; split-bottom shows shifted-block + new;
     empty shows new only; none shows none) covered via 4
     sub-fixtures setting`OutlineOverlay`props`{ mode: 'split-left', hostBlockId: 'callout',
         newBlockBounds: ..., shiftedBlockBounds: undefined }` and
     asserting which outline classes mount. **Cites ADR-0017
     §172-194 D4 outline overlay + §380 AC#5\*\*.
   - **`describe('AC#6, #8, #10 helper integration')`** wrapping 3
     test cases: - **`test('AC#6 — hit-test perf budget (n=30 blocks
computeEdgeRects + findMatches per call ≤ 0.05ms)')`**:
     navigate `/sample-blocks-astro`; via `page.evaluate()`
     fabricate 30 synthetic `BlockLayout[]` (random-but-
     deterministic positions; seed with index for repeatability) - run `performance.now()` budget on 1000 invocations of
     `computeEdgeRects(blocks)` + `findMatches(cursorX, cursorY,
edgeRects)`. Assert per-invocation average ≤ 0.05ms (per
     ADR-0017 §381 AC#6). Note in test JSDoc: this exercises
     the **synchronous helper budget** (Path A scope); the FULL
     AC#6 contract (60fps end-to-end during a real drag-over)
     requires the drag-active state machine wired in apps/site
     EditorShellMount which lives at C.4-2 per plan v1.3 row
     C.4-2; this test gates the synthetic per-call O(n) budget
     which is the upstream constraint. **Cites ADR-0017 §381
     AC#6**. - **`test('AC#8 — useAutoRowSpan rowSpan re-measure invariant
(rowSpan integer NOT mutated; render-time measurement
only)')`**: navigate `/sample-blocks-astro`; locate
     `[data-block="callout"]` (markdown-kind block from the
     fixture); via `page.evaluate()` capture initial rowSpan
     persistent storage value (read from `data-skb-row-span`
     attr if exposed; else read from `gridRow` computed style
     `span N` parse). Trigger a synthetic content height change
     via `getBoundingClientRect()` measurement on the block's
     `:first-child` content element — the
     `useAutoRowSpan` hook is render-time-only (per ADR-0016
     D3 line 226-231 mobile rowSpan='auto' rendering-derived
     rule + per C.2-9 PR.md `## title` §92-100 contract); the
     persistent rowSpan integer at storage MUST be unchanged.
     Re-capture rowSpan storage value; assert byte-equal to
     initial. **Cites ADR-0017 §382 AC#8 + ADR-0016 D3 §226-231**. - **`test('AC#10 — col-ruler hit-stop highlight at COL_SNAPS
boundaries (12-col 6 stops [2,3,4,6,8,12]; 6-col 3 stops
[2,3,6])')`**: render the editor-shell `ColRuler`
     component into a synthetic harness page via `page.evaluate()` - dynamic mount (similar pattern to AC#5). Pass
     `viewportCols={12}` + `cursorColSpan={4}` props. Assert
     the 4-col stop has `[data-skb-col-stop-active="true"]`
     attr (or className `.skb-col-stop--active` per ColRuler
     implementation; defer to executor TDD step to confirm
     attr name from `packages/editor-shell/src/resize/col-ruler.tsx`
     at HEAD). Pass `viewportCols={6}` + `cursorColSpan={3}`
     → assert 3-col stop active + 4-col + 8-col + 12-col
     stops are NOT rendered (effectiveColSnaps under 6-col is
     [2,3,6] per ADR-0016 D6 §effectiveColSnaps). Note in
     test JSDoc: this is the col-ruler rendering invariant
     portion of AC#10; the FULL AC#10 contract (drag right
     handle → col-ruler highlight transitions on cursor move - size-tooltip displays fraction) requires resize drag
     interactivity wired in apps/site EditorShellMount which
     lives at **C.2-11** per plan v1.3 row C.2-11 line 692.
     **Cites ADR-0017 §384 AC#10 + ADR-0016 D6 effectiveColSnaps**.
   - **`describe('AC#7, #9, #11, #12 deferred to C.4-2
EditorShellMount full wire-up')`** wrapping 4 test cases all
     marked `test.skip()` with a comment of the form
     `// DEFERRED-TO-C.4-2: REASON` (REASON placeholder for the
     specific deferred-AC explanation per the bullet list below)
     plus ADR-0017 AC# citation: - **`test.skip('AC#7 — 源块 lift mode (display: none during
drag-active)')`**: skip reason: requires
     `mousedown → drag-start` event chain dispatched on
     editor-shell `layoutReducer` from EditorShellMount mount
     site. **Cites ADR-0017 §381 AC#7 + plan v1.3 row C.4-2
     line 715**. - **`test.skip('AC#9 — 全局 Esc cancel during drag-active')`**:
     skip reason: requires drag-active state via `useEscCancel`
     hook wired in EditorShellMount with active drag-start
     → keydown(Escape) → drag-end-cancel sequence. **Cites
     ADR-0017 §383 AC#9 + plan v1.3 row C.4-2 line 715**. - **`test.skip('AC#11 — drag-ghost cursor-follow during
drag-active')`**: skip reason: requires `mousedown` event
     to trigger `DragGhost` mount + `mousemove` events to
     update ghost position; full mouse-interaction state
     machine wired at C.4-2. **Cites ADR-0017 §385 AC#11 +
     plan v1.3 row C.4-2 line 715**. - **`test.skip('AC#12 — drop-pulse 720ms post-drop animation')`**:
     skip reason: requires `mouseup → drag-end-success` chain
     to commit `epoch += 1` mutation + trigger DropPulse
     mount with 720ms animation duration; full mouse-
     interaction state machine wired at C.4-2. **Cites
     ADR-0017 §386 AC#12 + plan v1.3 row C.4-2 line 715**.

2. **NEW `apps/site/playwright/grid-drag-drop.fixtures.ts`** (~80
   LOC). Helper module imported by `grid-drag-drop.spec.ts`.
   Exports 3 functions consumed by the spec test cases:
   - `measureBlockBounds(page: Page, blockKind: string):
Promise<{ left: number; top: number; right: number; bottom:
number; width: number; height: number }>`. Calls
     `page.locator('[data-block="${blockKind}"]').boundingBox()` - transforms result to the named-property shape consumed by
     `computeEdgeRects` and the AC#1-#3 fixture math. Throws if
     the locator is not found (timeout 10s per the existing
     `apps/site/playwright/sample-blocks-astro.spec.ts`
     timeout precedent).
   - `computeExpectedEdgeRect(bounds: { left: number; top: number;
right: number; bottom: number; width: number; height: number
}, mode: EdgeMode): { x: number; y: number; width: number;
height: number }`. Pure function (no Playwright calls)
     duplicating the ADR-0017 D2 + edge-rects math at
     `packages/editor-shell/src/drag-drop/edge-rects.ts:30-67`
     (`edgeRectsForBlock` private helper). Used by spec to
     compute the **expected** edge rect for each cardinal
     direction so tests can compare `computeEdgeRects()` output
     against an independent reference per memory
     `feedback_cross_package_consumer_pattern.md` "duplication
     catches silent regressions on dimension VALUES (vs importing
     from heavy block packages)" pattern. Test author cites
     authority byte-equal in JSDoc: `"// authority:
packages/editor-shell/src/drag-drop/edge-rects.ts L30-67
edgeRectsForBlock; this fixture must stay byte-equivalent"`.
   - `simulateCursorAt(page: Page, x: number, y: number):
Promise<void>`. Wrapper around `page.mouse.move(x, y)`
     called inside test cases needing cursor positioning. NOT
     used for actual drag (Path A constraint); used only to
     pre-position cursor before `evaluate()` calls inspect
     cursor coordinates if the editor-shell helpers consume
     cursor coordinates from `event` rather than helper args.
     Defer to executor TDD step whether this helper is
     necessary; if the spec exclusively passes synthetic cursor
     coords as helper args (per AC#1-#3 patterns above) and
     never reads from the event, this helper may be omitted —
     but exporting it leaves the option open without forcing
     re-export later.

3. **MODIFIED `docs/plans/wave-5-main/C.2-10-playwright-drag-scenarios.md`**
   (this PR.md file; ~280 LOC). Standalone authoring per
   ADR-0011 D2 v0.1.1 SOTed-PR.md schema; reviewer codex Stage
   3 verifies acceptance accuracy.

The PR introduces NO change to `packages/editor-shell/**` (zero
diff under the editor-shell package; the spec consumes existing
public surface through `import('@skb/editor-shell')` from the
spec runtime), NO change to `apps/site/src/**` (zero diff under
the apps/site source tree; the spec targets the EXISTING
`/sample-blocks-astro` route at HEAD without modification), NO
change to any CONTRACT.md, NO change to package.json /
pnpm-lock.yaml, NO change to CI workflow.

## files

> Whitelist per ADR-0011 D2 file scope-fence. Exact files only;
> any deviation = scope creep + reviewer codex Stage 3 verdict
> REJECT-with-residue.

1. `apps/site/playwright/grid-drag-drop.spec.ts` (NEW; ~520 LOC)
2. `apps/site/playwright/grid-drag-drop.fixtures.ts` (NEW; ~80 LOC)
3. `docs/plans/wave-5-main/C.2-10-playwright-drag-scenarios.md`
   (NEW; this PR.md self; ~280 LOC)

**Estimated total source LOC**: ~600 LOC (~520 spec + ~80
fixtures), exactly per Wave 5 plan v1.3 row C.2-10 line 691
budget. Plan PR.md (entry 3) excluded from source LOC count per
ADR-0011 D2 schema convention.

## test_cases

TDD-front per ADR-0011 D1 stage 2 EXECUTE; codex-generic-executor
writes the spec file FIRST in failing state (all 12 tests fail
because the spec content is missing), then iterates the spec
content + fixtures until all 8 active tests PASS + 4 deferred
tests `test.skip()` correctly skip (visible in Playwright report
as "skipped" not "failed"). The full Playwright spec file IS the
test_cases — there is no separate vitest/unit suite; the PR's
deliverable is exactly the Playwright spec exercising ADR-0017
AC#1-#12 invariants.

### Suite 1 — `apps/site/playwright/grid-drag-drop.spec.ts`

`describe('AC#1-#5 hit-test geometry against /sample-blocks-astro')`

- **TC1.1** `AC#1 — 4 mode classification at edge positions`:
  - input: navigate `/sample-blocks-astro`; locate
    `[data-block="callout"]`; cursor at `(left+1, y-center)`
  - expected: `findMatches` returns 1+ match where any match has
    `mode === 'split-left'` and `blockId === 'callout'`
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC1.1`
  - +5 sub-fixtures for the other 5 cursor positions per the
    spec body (split-right / split-top / split-bottom / empty /
    none) all same describe block

- **TC1.2** `AC#2 — EDGE_W boundary half-in/half-out`:
  - input: cursor at `(right - 14, y-center)` of `[data-block="callout"]`
  - expected: `findMatches` returns split-right match (boundary
    inside, closed `≤` interval)
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC1.2`
  - +15 sub-fixtures covering all 4 cardinal directions + ±15px /
    ±14px boundary checks per spec body

- **TC1.3** `AC#3 — tiebreak distance + velocity + spatial + blockId`:
  - input: 6 fixture cases per ADR-0017 D3 §95-160 tiebreak
    formula table (left-offset / right-offset / velocity-rightward
    / velocity-leftward / velocity-jitter / blockId-stable)
  - expected: `tiebreak()` returns the predicted `EdgeMatch` per
    ADR table for each case
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC1.3`

- **TC1.4** `AC#4 — static layer invariant`:
  - input: capture
    `getComputedStyle(.skb-grid).gridTemplateColumns` at T0;
    invoke `computeEdgeRects` + `tiebreak` via `page.evaluate()`;
    re-capture at T1
  - expected: T0 === T1 byte-equal; helper invocation does NOT
    mutate static layer
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC1.4`

- **TC1.5** `AC#5 — outline overlay 3 classes`:
  - input: render `OutlineOverlay` with mode='split-left' +
    hostBlockId='callout' + newBlockBounds=...
  - expected: computed style z-index/opacity/pointer-events
    matches ADR-0017 D4 §187-194 CSS block byte-equal; 4
    sub-fixtures for split-bottom + split-top + split-right +
    empty + none mode rendering
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC1.5`

### Suite 2 — `describe('AC#6, #8, #10 helper integration')`

- **TC2.1** `AC#6 — perf budget`:
  - input: 30 synthetic blocks; 1000 iterations of
    `computeEdgeRects` + `findMatches`
  - expected: per-call avg ≤ 0.05ms via `performance.now()`
    measurement
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC2.1`

- **TC2.2** `AC#8 — useAutoRowSpan rowSpan integer NOT mutated`:
  - input: navigate `/sample-blocks-astro`; capture rowSpan storage
    value at T0; trigger content height re-measurement via
    helper invocation; capture at T1
  - expected: T0 === T1 byte-equal (storage rowSpan integer
    unchanged; render-time measurement only per ADR-0016 D3
    §226-231)
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC2.2`

- **TC2.3** `AC#10 — col-ruler hit-stop highlight`:
  - input: render ColRuler with viewportCols=12 +
    cursorColSpan=4 (then viewportCols=6 + cursorColSpan=3)
  - expected: 4-col stop has active attr/className under 12-col;
    3-col stop has active attr/className under 6-col + 4/8/12
    stops NOT rendered under 6-col (effectiveColSnaps [2,3,6])
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC2.3`

### Suite 3 — `describe('AC#7, #9, #11, #12 deferred to C.4-2')`

- **TC3.1** `AC#7 — 源块 lift mode`: `test.skip()` with comment
  `// DEFERRED-TO-C.4-2: requires mousedown → drag-start event
chain dispatched on layoutReducer from EditorShellMount mount
site (ADR-0017 §381 AC#7; plan v1.3 row C.4-2 line 715).`
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC3.1`

- **TC3.2** `AC#9 — 全局 Esc cancel`: `test.skip()` with comment
  `// DEFERRED-TO-C.4-2: requires drag-active state via
useEscCancel hook wired in EditorShellMount with active
drag-start → keydown(Escape) → drag-end-cancel sequence
(ADR-0017 §383 AC#9; plan v1.3 row C.4-2 line 715).`
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC3.2`

- **TC3.3** `AC#11 — drag-ghost cursor-follow`: `test.skip()` with
  comment `// DEFERRED-TO-C.4-2: requires mousedown → DragGhost
mount + mousemove → ghost position update; full mouse-
interaction state machine wired at C.4-2 (ADR-0017 §385 AC#11;
plan v1.3 row C.4-2 line 715).`
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC3.3`

- **TC3.4** `AC#12 — drop-pulse 720ms`: `test.skip()` with comment
  `// DEFERRED-TO-C.4-2: requires mouseup → drag-end-success
chain to commit epoch+=1 mutation + trigger DropPulse mount
with 720ms animation duration; full mouse-interaction state
machine wired at C.4-2 (ADR-0017 §386 AC#12; plan v1.3 row
C.4-2 line 715).`
  - location: `apps/site/playwright/grid-drag-drop.spec.ts:TC3.4`

## contracts_affected

NONE.

`packages/editor-shell/CONTRACT.md` is **NOT modified** in this
PR. The spec consumes existing public surface only:
`computeEdgeRects` + `EDGE_W` + `GAP` + `findMatches` +
`tiebreak` + `OutlineOverlay` + `ColRuler` (all shipped at C.2-5

- C.2-6 + C.2-8) + `useAutoRowSpan` (C.2-8) + `useResponsiveCols`
  (C.2-9). NO new export. NO existing export signature widened.
  NO existing export semantics change. The Public Surface section
  of CONTRACT.md at HEAD covers all consumed exports.

`apps/site/CONTRACT.md` (if present at HEAD) is **NOT modified**.
The spec targets the existing `/sample-blocks-astro` route at
HEAD (`apps/site/src/pages/sample-blocks-astro.astro`) without
modification.

## adr_touched

NONE (read-only consume).

The spec's authority is **ADR-0017 AC#1-#12** at HEAD (squash
`Pre-A3 ADR-0017 design-lock` per Wave 5 plan v0.2 D5 ADR
编号映射表). The spec's behavior is fully determined by ADR-0017
§47-53 D1 mode table + §63-79 D2 EDGE_W=28 + §86-160 D3 tiebreak
formula + §172-194 D4 outline overlay + §371-386 AC#1-#12
acceptance criteria. The spec's deferred-AC justifications cite
**ADR-0011 D9.6 CI gate auto-skip + Wave 5 plan v1.3 row C.4-2
line 715** for the `test.skip()` 4 entries.

NO ADR amendment is authored or modified. NO new ADR is created.
D2 row 4 (NEW ADR required) does NOT fire.

## acceptance

> Reviewer codex (Stage 3) and pr-writer (Stage 6 ACCEPT) verify
> these against the committed diff. ACs that map to vitest /
> Playwright cases cite the test file + describe/it title for
> traceability per ADR-0011 D2 v0.1.1 SOTed-PR.md schema.

### File presence + structure ACs

- **AC#A1**: `apps/site/playwright/grid-drag-drop.spec.ts` exists
  at PR HEAD; file size between 400 LOC and 700 LOC inclusive
  (target ~520 LOC). Verified via `wc -l` on the spec file path.
- **AC#A2**: `apps/site/playwright/grid-drag-drop.fixtures.ts`
  exists at PR HEAD; file size targets the ~250-300 LOC fixture
  scale (current formatted file: 242 LOC). Verified via `wc -l` on the
  fixtures file path.
- **AC#A3**: `docs/plans/wave-5-main/C.2-10-playwright-drag-scenarios.md`
  exists at PR HEAD (this PR.md self).
- **AC#A4**: spec file head 1-20 LOC contains the verbatim WSL2
  skip pattern (`isWsl2()` function + `test.skip(isWsl2(), ...)`)
  copied byte-equivalent from
  `apps/site/playwright/heavy-block-layout-shift.spec.ts:1-17` per
  memory `feedback_wsl2_chromium_launch.md`. Verified via
  `diff <(sed -n '1,17p' apps/site/playwright/heavy-block-layout-shift.spec.ts)
<(sed -n '1,17p' apps/site/playwright/grid-drag-drop.spec.ts)` (lines
  3-17 byte-equal; line 1-2 imports may differ given fixtures import).

### Spec coverage ACs

- **AC#A5**: Playwright `--list` reports exactly 12 registered
  tests (8 active per Suite 1 + Suite 2; 4 deferred tests in Suite
  3 that call `test.skip(true, ...)` inside registered `test()`
  bodies) — one per ADR-0017 AC#1-#12. Verified via
  `cd apps/site && pnpm exec playwright test --list playwright/grid-drag-drop.spec.ts`
  ending with `Total: 12 tests in 1 file`.
- **AC#A6**: each spec test title cites the corresponding ADR-0017
  AC# (e.g., `AC#1 — ...`). Verified via
  `grep -cE "AC#[1-9]|AC#1[0-2]" apps/site/playwright/grid-drag-drop.spec.ts`
  = 12 (one per test title).
- **AC#A7**: Suite 3 (4 registered deferred tests) each contain the
  literal substring `DEFERRED-TO-C.4-2` in the skip reason inside
  the test body. Verified via
  `grep -c "DEFERRED-TO-C.4-2" apps/site/playwright/grid-drag-drop.spec.ts`
  ≥ 4.
- **AC#A8**: Suite 3 deferred tests each cite the `C.4-2 line 715`
  forward pointer in the skip reason for traceability.
  Verified via
  `grep -c "C.4-2 line 715" apps/site/playwright/grid-drag-drop.spec.ts`
  ≥ 4.

### CI gate ACs

- **AC#A9**: `pnpm exec tsx scripts/check-ui-touch.ts` returns
  `ui_touch=false` when run on this PR's diff (mechanical
  detection per ADR-0011 D9.1 path patterns; the 3 changed files
  do not match any of the 7 D9.1 path regexes). Verified by
  reviewer codex via `git diff --name-only origin/main...HEAD |
xargs pnpm exec tsx scripts/check-ui-touch.ts --files` →
  `ui_touch=false`.
- **AC#A10**: PR.md `## ui_touch` field is set to `false` (per
  AC#A9 mechanical verdict).
- **AC#A11**: PR.md `## e2e_smoke` field is set to `[]` (empty
  list per ADR-0011 D9 v0.2 amendment §"non-strict on
  ui_touch=false PRs" + Wave 5 plan v1.3 §551 retrofit catalog
  Q1 absorbtion clarification for `apps/site/playwright/**`
  paths).
- **AC#A12**: CI gate `e2e-coverage-check` (`.github/workflows/
ci.yml` job) auto-skips on this PR per ADR-0011 D9.6 (verified
  by `gh pr checks` after push showing
  `e2e-coverage-check: SKIPPED` or equivalent).
- **AC#A13**: existing `visual-smoke` CI job (executes
  `pnpm --filter @skb/site test:visual` over all
  `apps/site/playwright/**/*.spec.ts` + `apps/site/src/__tests__/
e2e/**/*.spec.ts` per `apps/site/playwright.config.ts`
  testMatch line 4 at HEAD) **PASSES** end-to-end including
  `grid-drag-drop.spec.ts` (8 active tests PASS + 4 skipped
  tests visible in report as "skipped"; ZERO failures).
  Verified by `gh pr checks` after push showing
  `visual-smoke: SUCCESS`.

### Quality ACs

- **AC#A14**: `pnpm check` clean on this PR's branch (lint +
  typecheck + test + build + size-check). Verified by reviewer
  codex Stage 3.
- **AC#A15**: `pnpm exec tsc --noEmit` clean on the spec +
  fixtures files (Playwright type imports resolve; helper
  signatures type-check). Verified by reviewer codex Stage 3.
- **AC#A16**: `pnpm format` produces zero diff (Prettier compliant).
  Verified by reviewer codex Stage 3.
- **AC#A17**: `pnpm size-check` PASSES; both new files under the
  500-line hard limit + below the 300-line warn (target ~520
  spec — exception: spec exceeds 300-line warn budget but is
  under 500-line hard limit; spec authoring discipline accepts
  the warn for cohesion of one-AC-per-test-case structure within
  one file). Verified by reviewer codex Stage 3.
- **AC#A18**: `pnpm link-check` PASSES (no new external links
  introduced; PR.md cross-refs all use repo-relative paths).
  Verified by reviewer codex Stage 3.

### ADR-0017 AC# coverage matrix (8 covered + 4 deferred)

| ADR-0017 AC#                      | Coverage status                           | Test case    | Reason if deferred                                                                |
| --------------------------------- | ----------------------------------------- | ------------ | --------------------------------------------------------------------------------- |
| AC#1 (4 mode 视觉验证)            | **COVERED**                               | TC1.1        | —                                                                                 |
| AC#2 (EDGE_W = 28 边缘)           | **COVERED**                               | TC1.2        | —                                                                                 |
| AC#3 (tiebreak 距离公式)          | **COVERED**                               | TC1.3        | —                                                                                 |
| AC#4 (静态底层不动)               | **COVERED** (helper-invocation portion)   | TC1.4        | full drag-active portion deferred to C.4-2                                        |
| AC#5 (outline overlay 3 类)       | **COVERED**                               | TC1.5        | —                                                                                 |
| AC#6 (hit-test 性能 budget)       | **COVERED** (synchronous helper budget)   | TC2.1        | full 60fps end-to-end portion deferred to C.4-2                                   |
| AC#7 (源块 lift 模式)             | **DEFERRED-TO-C.4-2**                     | TC3.1 (skip) | requires drag-active state machine wired at C.4-2 line 715                        |
| AC#8 (useAutoRowSpan integration) | **COVERED**                               | TC2.2        | —                                                                                 |
| AC#9 (全局 Esc 取消)              | **DEFERRED-TO-C.4-2**                     | TC3.2 (skip) | requires drag-active state via useEscCancel + active drag-start at C.4-2 line 715 |
| AC#10 (col-ruler stop highlight)  | **COVERED** (rendering invariant portion) | TC2.3        | full resize-drag portion deferred to **C.2-11** per plan v1.3 row C.2-11 line 692 |
| AC#11 (drag-ghost 视觉跟随)       | **DEFERRED-TO-C.4-2**                     | TC3.3 (skip) | requires mousedown → DragGhost mount + mousemove updates at C.4-2 line 715        |
| AC#12 (drop-pulse 720ms)          | **DEFERRED-TO-C.4-2**                     | TC3.4 (skip) | requires mouseup → drag-end-success → DropPulse mount at C.4-2 line 715           |

**Result**: 8 ACs COVERED in this PR + 4 ACs DEFERRED to C.4-2
(EditorShellMount full BlockRegistry/KernelRegistry wire-up per
plan v1.3 row C.4-2 line 715) with skip + reason. AC#10's full
resize portion is also forward-pointed to C.2-11 per plan v1.3
row C.2-11 line 692. NO ADR-0017 AC# is silently dropped — every
AC has an explicit covered/deferred row + traceable forward
pointer.

## executor

`codex-generic-executor` per Wave 5 plan v1.3 row C.2-10 line 691
executor column. Standard ADR-0007 D5 dispatch via orchestrator
Bash; profile `codex-generic-executor`; sandbox `workspace-write`;
approval-policy `never`; audit log `/tmp/codex-runs/2026-05-06-
C.2-10-execute.txt` raw + `docs/audits/codex-runs/2026-05-06-
C.2-10-execute.txt` curated archive (head -50 + verdict grep if
log > 500 KB per memory `feedback_codex_audit_log_recursion.md`
watchdog kill at ~500 KB).

TDD-front discipline per ADR-0011 D1 stage 2: write the spec file
in failing state first (12 test stubs all FAIL because spec body
empty) → confirm `pnpm --filter @skb/site test:visual` reports 12
failures → flesh out spec content + fixtures iteratively until
all 8 active tests PASS + 4 deferred tests SKIP.

## ui_touch

false

> Mechanical D9.1 detection: 3 changed files (`apps/site/playwright/
grid-drag-drop.spec.ts` + `apps/site/playwright/grid-drag-drop.fixtures.ts`
>
> - `docs/plans/wave-5-main/C.2-10-playwright-drag-scenarios.md`)
>   do NOT match any of the 7 ADR-0011 D9.1 path-pattern regexes
>   (`apps/site/src/pages/**` / `apps/site/src/components/**` /
>   `apps/site/src/styles/**` / `packages/*/src/ui-default/**` /
>   `packages/heavy-block-boundary/src/**` / `packages/editor-shell/
src/**` / `packages/design-tokens/**`). `pnpm exec tsx
scripts/check-ui-touch.ts --files apps/site/playwright/grid-drag-drop.spec.ts
apps/site/playwright/grid-drag-drop.fixtures.ts docs/plans/wave-5-main/
C.2-10-playwright-drag-scenarios.md` → stdout `ui_touch=false`.
>   Per Wave 5 plan v1.3 §551 retrofit catalog Q1 absorbtion
>   clarification for `apps/site/playwright/**` paths: the PR's
>   _purpose_ is Playwright drag scenario coverage (UI-touch
>   verification framework per ADR-0011 D9), but the _mechanical_
>   ui_touch verdict is false because none of the diff hits a D9.1
>   path pattern — same shape as the planned C.2-11 + C.2-12 +
>   C.3-5 + C.4-5 patterns. Per ADR-0011 D9.6 CI gate auto-skip on
>   `ui_touch=false` keeps merge unblocked. C.2-10 is the **first
>   Wave 5 PR** to operationalize this catalog-defined `ui_touch=false`
>   shape for a Playwright-spec-only diff.

## e2e_smoke

[]

> Per ADR-0011 D9 v0.2 amendment + Wave 5 plan v1.3 §551
> retrofit catalog: when `ui_touch=false` (mechanical), the
> `e2e_smoke` field is empty list `[]`. CI gate
> `e2e-coverage-check` auto-skips merge enforcement per
> ADR-0011 D9.6. The Playwright spec itself runs via the
> existing `visual-smoke` CI job (covering all
> `apps/site/playwright/**/*.spec.ts` per playwright.config.ts
> testMatch line 4 at HEAD) — no new `e2e_smoke` entry required.

## Out of scope

- **Full editor-shell drag wiring into apps/site EditorShellMount.tsx**
  (Path B; deferred to C.4-2 per plan v1.3 row C.4-2 line 715).
  C.4-2 ships `apps/site/src/pages/notes/[slug]/edit.astro` +
  `apps/site/src/components/EditorShellMount.{astro,tsx}` full
  BlockRegistry/KernelRegistry wire including drag/resize/Esc/
  ghost/drop-pulse interactivity.
- **Resize-related AC#10 col-ruler highlight transition during a
  real resize drag** — that's C.2-11 scope per plan v1.3 row
  C.2-11 line 692. C.2-10's AC#10 coverage is limited to the
  ColRuler rendering invariant portion (effectiveColSnaps under
  6-col vs 12-col).
- **Visual smoke baseline screenshots + perf budget assertion
  during a real drag-over** — that's C.2-12 scope per plan v1.3
  row C.2-12 line 693. C.2-10's AC#6 coverage is limited to the
  synchronous per-call O(n) helper budget.
- **C.4-2 deferred ACs** (AC#7 / AC#9 / AC#11 / AC#12) are
  authored as `test.skip()` placeholders WITH the test title +
  describe block + skip comment intact so the C.4-2 PR can lift
  the `test.skip()` to `test.only()` (or remove the
  `.skip()` suffix) and flesh out the test body in-place without
  re-authoring the test scaffold. C.4-2 PR.md `## acceptance`
  will explicitly enumerate this as the EditorShellMount integration
  ACs (e.g., AC#7 → AC mapped to C.4-2 EditorShellMount
  `mousedown → drag-start` chain).
- **`packages/editor-shell/CONTRACT.md` updates** (zero
  CONTRACT.md change in this PR; spec consumes existing public
  surface only).
- **CI workflow `.github/workflows/ci.yml` modifications** (zero
  workflow change; spec runs via existing `visual-smoke` job).
- **`@skb/editor-shell` package source changes** (zero diff under
  packages/editor-shell/\*\*).

## Risk register

| #   | Risk                                                                                                                                                                     | Severity | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | AC# coverage shortfall — reviewer codex / user judges some "covered" ACs too thin (e.g., AC#4 helper-invocation portion judged insufficient without real drag)           | medium   | AC# coverage matrix explicit + each "COVERED (X portion)" flagged with deferred-portion forward pointer; reviewer codex Stage 3 verdict can REJECT-with-residue if matrix thinning judged unreasonable; orchestrator at PRE-COMMIT (D2 row 1+4 NOT firing — Standard) re-judges                                                                                                                                         |
| R2  | Playwright spec runtime extends visual-smoke CI job total time beyond budget                                                                                             | low      | spec design uses synthetic helper invocations + measurement (NOT real drag waits); per-test runtime estimate < 2s × 12 tests = ~24s; total visual-smoke job at HEAD runs ~4 specs ≈ 60s → 84s post-merge; well within CI budget per memory `feedback_codex_audit_log_recursion.md` GH-actions-runner-hour budget                                                                                                        |
| R3  | spec uses `page.evaluate(() => import('@skb/editor-shell')...)` — runtime path resolution may fail under astro build+preview if editor-shell barrel resolves differently | medium   | executor TDD step verifies path resolution at first test run; if `import('@skb/editor-shell')` fails inside `evaluate()`, fallback is to inline the helper math in the spec (duplication acceptable per memory `feedback_cross_package_consumer_pattern.md` for hit-test math) — but lose authority byte-equivalence; reviewer codex Stage 3 catches if duplication used                                                |
| R4  | `/sample-blocks-astro` fixture page renders blocks WITHOUT horizontal adjacency at gap=14 — AC#3 tiebreak 6 fixtures may not have natural adjacent blocks to measure     | low      | AC#3 spec falls back to fabricated synthetic `EdgeMatch[]` arrays passed to `tiebreak()` directly via `evaluate()` — independent of DOM layout; the AC#3 fixture math is helper-pure (no DOM dependency required for tiebreak unit assertions). Spec author's TDD step decides per real DOM at first run                                                                                                                |
| R5  | WSL2 skip pattern at file head causes the spec to skip locally; orchestrator + reviewer codex must rely on CI Linux container to verify spec PASS                        | low      | CI Linux container at GH Actions runs Chromium without WSL2 detection skip; PR ACCEPT stage verdict relies on `gh pr checks` SUCCESS for `visual-smoke` job. Skip-pattern precedent at HEAD: 3 existing `apps/site/playwright/*.spec.ts` files all carry the same skip — local dev verification not blocked by per-PR convention                                                                                        |
| R6  | reviewer codex Stage 3 challenges the deferred-AC count (4) as too high — argues some deferred ACs (e.g., AC#11 drag-ghost) could be covered via synthetic harness       | medium   | AC# coverage matrix's "Reason if deferred" column cites the specific event/state-machine dependency for each deferred AC; if reviewer pushes back, executor can add synthetic harness coverage for AC#11 (DragGhost render with mock cursor coords) at REVIEW iteration — but increases spec LOC beyond ~600 budget. Pre-flight orchestrator judgment: 4 deferred is the right number; defer-debate addressed at REVIEW |

## Open questions

> Per ADR-0011 D2 v0.1.1 SOTed-PR.md schema; resolved at PRE-COMMIT
> CLAUDE REVIEW (Stage 4) — but D2 row 1+4 NOT firing for this PR
> (Standard verdict per `## D2 trigger judgment` below) so Stage 4
> is skipped and these resolve at orchestrator briefing pre-EXECUTE.

- **Q1**: should AC#3 tiebreak fixture (6) be implemented via real
  DOM block adjacency on `/sample-blocks-astro` (if 2 sample blocks
  happen to be horizontally adjacent at gap=14) OR via fabricated
  synthetic `EdgeMatch[]` arrays passed directly to `tiebreak()`?
  Pre-judgment: **fabricated synthetic** (decouples tiebreak unit
  semantics from sample-blocks-astro layout choices; tiebreak is
  pure helper, DOM independence is correct unit boundary).
  Executor confirms at TDD step.
- **Q2**: AC#5 outline overlay rendering — should `OutlineOverlay`
  be mounted into a synthetic harness page (via `page.evaluate()`
  - dynamic ReactDOM.render) OR into the existing
    `/sample-blocks-astro` page (if Astro hydration provides an
    `OutlineOverlay` mount point)? Pre-judgment: **synthetic
    harness via `evaluate()` + ReactDOM.render** — keeps spec
    decoupled from EditorShellMount integration; consistent with
    AC#3 + AC#10 synthetic-harness pattern. Executor confirms at
    TDD step.
- **Q3**: AC#10 col-ruler test relies on `[data-skb-col-stop-active]`
  attr OR `.skb-col-stop--active` className — which one does
  `packages/editor-shell/src/resize/col-ruler.tsx` expose at HEAD?
  Pre-judgment: defer to executor TDD step to read source at HEAD
  - cite chosen selector in AC#A6 spec. Reviewer codex Stage 3
    verifies selector matches HEAD source.

## D2 trigger judgment

**Standard** (Wave 5 plan v1.3 row C.2-10 line 691 D2 column).
Per ADR-0007 D2 v0.1.1 row evaluation:

- Row 1 (CONTRACT.md change): **NO** — no CONTRACT.md modified in
  this PR (zero diff under packages/\*/CONTRACT.md per `## files`
  whitelist).
- Row 2 (package add/remove OR metadata change): **NO** — no new
  package; no package.json / pnpm-lock.yaml change.
- Row 3 (cross-package add/remove ≥ 1 boundary): **NO** — only
  `apps/site/playwright/**` + `docs/plans/**` paths touched.
- Row 4 (NEW ADR required): **NO** — read-only consume of
  ADR-0017 + ADR-0011 D9 + Wave 5 plan v1.3.
- Row 5 (cross-package ≥ 3 packages OR boundary widening): **NO** —
  spec consumes existing `@skb/editor-shell` public surface; no
  surface widening; no cross-package boundary change.
- Row 6 (lockfile / generated artifact churn): **NO** — no
  pnpm-lock.yaml / generated config change.
- Row 7 (security/auth/CI workflow surface): **NO** — no CI
  workflow / secrets / auth change.
- Row 8 (high-risk class — package add/remove OR CI/deploy/auth/
  security): **NO**.

**Verdict**: Standard. PRE-COMMIT CLAUDE REVIEW (D1 stage 4) does
NOT fire. Standard 5-stage D1 pipeline (PLAN → EXECUTE → REVIEW →
COMMIT → ACCEPT).

## Open dependencies

- **C.4-2 forward pointer (ADR-0017 AC#7 / AC#9 / AC#11 / AC#12
  deferred ACs)**: C.4-2 PR.md MUST lift the 4 `test.skip()`
  entries in `apps/site/playwright/grid-drag-drop.spec.ts` to
  active tests covering EditorShellMount drag-active state machine
  flows. Pre-flight executor for C.4-2 reads C.2-10's spec at
  HEAD as scaffold + flesh out test body per AC#7 / AC#9 / AC#11 /
  AC#12 contract.
- **C.2-11 forward pointer (ADR-0017 AC#10 col-ruler full
  resize-drag portion)**: C.2-11 PR.md MUST add the resize-drag
  test cases at `apps/site/playwright/grid-resize-responsive.spec.ts`
  (NEW per plan v1.3 row C.2-11 line 692) covering the ColRuler
  highlight transition during a real resize drag (NOT just
  rendering invariant). C.2-10 covers the rendering portion of
  AC#10; C.2-11 covers the resize-drag portion. Together AC#10 is
  fully covered post-C.2-11.
- **C.2-12 forward pointer (ADR-0017 AC#6 60fps end-to-end perf)**:
  C.2-12 PR.md MUST add the end-to-end perf budget assertion
  during a real drag-over (NOT just synchronous per-call helper
  budget). C.2-10 covers the per-call portion of AC#6; C.2-12
  covers the end-to-end portion. Together AC#6 is fully covered
  post-C.2-12.

## Plan cross-refs

- [Wave 5 plan v1.3 row C.2-10 line 691](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
- [ADR-0017 §371-386 AC#1-#12 acceptance criteria](../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0017 §47-53 D1 mode table](../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0017 §63-79 D2 EDGE_W = 28 + GAP = 14 mathematical coupling](../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0017 §86-160 D3 tiebreak distance + velocity + spatial + blockId formula](../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0017 §172-194 D4 outline overlay 3-class z-index + opacity + pointer-events](../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0011 D9.1 UI-touch path patterns](../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0011 D9.6 CI gate auto-skip](../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0006 v0.2 8-point asymmetry-audit checklist](../decisions/ADR-0006-asymmetry-audit-checklist.md)
- [Wave 5 plan v1.3 §551 retrofit catalog Q1 absorbtion clarification](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
- [Wave 5 C.2-9 PR.md (precedent for `responsive-cols` consumption + multi-PR contributor pattern)](C.2-9-responsive-fsm.md)
- [Wave 5 C.2-8 PR.md (precedent for `layout-reducer` + `useEscCancel` + `DropPulse` + `DragGhost` consumption)](C.2-8-drop-pulse-drag-ghost-esc-layoutEpoch.md)
- [Wave 5 C.2-5 PR.md (precedent for `EDGE_W` + `computeEdgeRects` + `tiebreak` + `findMatches` consumption)](C.2-5-drag-drop-ux.md)
