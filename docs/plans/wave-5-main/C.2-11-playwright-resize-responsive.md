# C.2-11 — Playwright resize + responsive switch + rowSpan adapt (per ADR-0017 AC#10)

> **Wave 5 Stage C.2 12th implementation PR** of the locked 13-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.3 row C.2-11 line 692). Lands the
> **Playwright spec** that exercises the editor-shell **resize feedback
> primitives** (`ColRuler` + `SizeTooltip` + `colSpanToFraction` per
> ADR-0017 D9 §308-339) and the **responsive 12/6/1 viewport switch**
> path (`useResponsiveCols` + `GridContainer` `.skb-grid--mobile` +
> `data-skb-viewport-cols` per ADR-0016 D5 §239-262 + ADR-0017 D9
> §327-339 mobile view-only) against a real Chromium page. C.2-1
> through C.2-10 all merged on main; the editor-shell barrel at HEAD
> exports `ColRuler` + `colSpanToFraction` + `SizeTooltip` +
> `useResponsiveCols` + `RESPONSIVE_BREAKPOINTS` + `GridContainer` +
> `useAutoRowSpan` + `effectiveColSnaps` (re-exported from
> `@skb/block-foundation`), all consumed read-only by this spec. C.2-10
> shipped the AC#10 **col-ruler rendering invariant portion** (per
> C.2-10 PR.md AC# coverage matrix line 660); C.2-11 covers the
> **resize-drag interaction portion + responsive viewport switch + mobile
> view-only carve-out** that C.2-10 forward-pointed to this PR.
> C.2-12 follows with visual smoke baseline + perf budget (per plan v1.3
> line 693). C.2-11 establishes
> **`apps/site/playwright/grid-resize-responsive.spec.ts`** as the
> canonical authority for the resize + viewport-switch portion of
> ADR-0017 AC#10 (the rendering-invariant portion lives at
> `grid-drag-drop.spec.ts:367-411` per C.2-10).
>
> **Path A LOCKED (Playwright synthetic harness ONLY; no editor-shell
> resize-drag wiring into EditorShellMount)**. The orchestrator briefing
> reaffirmed the Path A vs Path B decision shipped at C.2-10: Path A
> mounts editor-shell components into a synthetic happy-dom harness via
> `renderIntoPage` + `renderJsxMarkup` (precedent at
> `apps/site/playwright/grid-drag-drop.spec.ts:188-235` AC#5 OutlineOverlay
> render + `:367-411` AC#10 ColRuler render) **and** uses `page.setViewportSize`
> for real Chromium viewport-driven `useResponsiveCols` matchMedia
> assertions; Path B would expand scope to wire `ColRuler` +
> `SizeTooltip` + `useResponsiveCols` + `GridContainer` viewport-driven
> behavior into `apps/site/src/components/EditorShellMount.tsx` so a
> real mouse drag on a real `.gblock-handle.right` triggers the
> `hoveredStop` cursor transition + `colSpanToFraction` tooltip update +
> snap-on-release commit. Path B violates the Wave 5 plan v1.3 row
> C.2-11 LOC budget (~400 LOC, all in the spec file) and overlaps
> **C.4-2 EditorShellMount full BlockRegistry/KernelRegistry wire**
> scope per plan v1.3 row C.4-2 line 715 (the same C.4-2 forward pointer
> C.2-10 paid for the 4 deferred drag-active ACs). Path B selection
> would also re-trigger D2 Row 1 (CONTRACT.md sync for
> EditorShellMount surface change) + Row 5 (cross-package boundary
> change apps/site ↔ editor-shell resize wire) per ADR-0007 D2 — both
> escalations C.2-9 PR #82 already paid. ADR-0015 R14 anti-pattern
> reaffirmed. Path A locked.
>
> **AC#10 split between C.2-10 + C.2-11 (per C.2-10 PR.md `## acceptance`
> line 660 forward pointer + `## Open dependencies` C.2-11 forward
> pointer line 845-849)**:
>
> - **Rendering invariant portion (COVERED at C.2-10)** — ColRuler with
>   `activeStops=[2,3,4,6,8,12]` + `hoveredStop=4` + `totalCols=12`
>   renders 6 stops + highlights data-stop="4"; ColRuler with
>   `activeStops=[2,3,6]` + `hoveredStop=3` + `totalCols=6` renders 3
>   stops + highlights data-stop="3". Selectors `.skb-col-ruler-stop` +
>   `.skb-col-ruler-stop--active` cited at
>   `packages/editor-shell/src/resize/col-ruler.tsx:35-38`.
> - **Resize-drag interaction portion (COVERED in this PR)** —
>   ColRuler `hoveredStop` cursor-driven transition synthetic
>   harness; `colSpanToFraction(4, 12)` returns `'1/3'` etc. per
>   FRACTIONS_BY_TOTAL_COLS at
>   `packages/editor-shell/src/resize/size-tooltip.tsx:22-41`;
>   SizeTooltip JSX renders fraction text + `' · N rows'`
>   suffix when `rowSpan` prop set; ColRuler returns `null` for
>   `totalCols=1` (mobile view-only path).
> - **Responsive viewport switch portion (COVERED in this PR)** —
>   `useResponsiveCols()` returns `12` / `6` / `1` per matchMedia
>   query against `(min-width: 1024px)` + `(min-width: 768px)` per
>   `packages/editor-shell/src/responsive-cols.ts:29-43`;
>   `GridContainer` emits `.skb-grid--mobile` className when
>   `viewportCols=1` per `packages/editor-shell/src/grid-container.tsx:35-43`;
>   `data-skb-viewport-cols` data-attr always emitted.
> - **rowSpan adapt portion (COVERED in this PR)** —
>   `useAutoRowSpan` re-measures content height + emits new
>   integer rowSpan WITHOUT mutating persistent storage rowSpan
>   per ADR-0016 D3 §226-231 (markdown 'auto' is render-time-only).
>   C.2-10 shipped the AC#8 `useAutoRowSpan` happy-dom harness
>   precedent at `grid-drag-drop.spec.ts:270-365` (mock
>   ResizeObserver + ReactDOM.createRoot). C.2-11 extends this
>   with the **viewport-switch-driven re-measurement scenario**:
>   when `useResponsiveCols` transitions 12 → 1 (desktop → mobile),
>   `useAutoRowSpan` consumers re-measure under the new viewport
>   width without mutating the persistent rowSpan integer.
> - **Real-resize-drag DOM cursor transition + snap-on-release portion
>   (DEFERRED-TO-C.4-2)** — wiring real mousedown→mousemove
>   →mouseup on `.gblock-handle.right` to dispatch
>   `layoutReducer` actions requires EditorShellMount integration
>   per plan v1.3 row C.4-2 line 715. Registered as `test.skip`
>   blocks with DEFERRED-TO-C.4-2 reason (mirrors C.2-10
>   AC#7/#9/#11/#12 deferred precedent at
>   `grid-drag-drop.spec.ts:412-441`).
>
> **`ui_touch: false` (mechanical D9.1 detection)** per ADR-0011 D9.1
> path patterns + Wave 5 plan v1.3 §551 retrofit catalog Q1 absorbtion
> clarification (mechanical detection for `apps/site/playwright/**`
> paths). The path
> `apps/site/playwright/grid-resize-responsive.spec.ts` does NOT match
> any of the 7 D9.1 path-pattern regexes (`apps/site/src/pages/**` /
> `apps/site/src/components/**` / `apps/site/src/styles/**` /
> `packages/*/src/ui-default/**` / `packages/heavy-block-boundary/src/**` /
> `packages/editor-shell/src/**` / `packages/design-tokens/**`).
> `pnpm exec tsx scripts/check-ui-touch.ts` returns
> `ui_touch=false` mechanically; CI gate `e2e-coverage-check` auto-skips
> per ADR-0011 D9.6. The `## e2e_smoke` field is mechanically empty
> (`[]`), even though the PR's PURPOSE is Playwright resize +
> viewport-switch coverage. This mirrors the C.2-10 precedent (the
> first Wave 5 PR to ship `ui_touch=false` / `e2e_smoke=[]` for a
> Playwright-spec-only diff) + the planned C.2-12 + C.3-5 + C.4-5
> patterns. The Playwright spec runs via the existing `visual-smoke` CI
> job which executes `pnpm --filter @skb/site test:visual` covering
> ALL specs in `apps/site/playwright/**` per
> `apps/site/playwright.config.ts` testMatch line 4 — no new CI job
> needed.
>
> **D2 trigger judgment Standard** per Wave 5 plan v1.3 row C.2-11. NO
> CONTRACT.md change (`packages/editor-shell/CONTRACT.md` is not
> modified — this PR consumes existing public surface only; NO new
> export added to the editor-shell barrel; NO existing export
> signature widened). NO package metadata change. NO cross-package
> boundary widening. PRE-COMMIT CLAUDE REVIEW does NOT fire. Standard
> 5-stage D1 (PLAN → EXECUTE → REVIEW → COMMIT → ACCEPT).

## title

Land the Playwright spec exercising ADR-0017 AC#10 resize-drag
interaction + ADR-0016 D5 responsive 12/6/1 viewport switch +
`useResponsiveCols` matchMedia + `useAutoRowSpan` re-measurement
under viewport switch + `.skb-grid--mobile` view-only carve-out
against a real Chromium page, deferring the real-mouse
mousedown→mousemove→mouseup resize sequence to C.4-2 EditorShellMount
full wire-up per plan v1.3 row C.4-2 line 715. **NEW
`apps/site/playwright/grid-resize-responsive.spec.ts`** ~360 LOC; 9
test cases (8 active per AC#10 sub-portions + 1 deferred for
real-mouse-drag) wrapped in 3 describe blocks
(`AC#10 resize feedback primitives synthetic harness` /
`ADR-0016 D5 responsive viewport switch + GridContainer wire` /
`AC#10 real-mouse resize-drag deferred to C.4-2`). Spec consumes the
**existing `apps/site/playwright/grid-drag-drop.fixtures.ts`** helper
module (no new fixtures file required; the 3 helpers consumed are
`renderIntoPage` + `renderJsxMarkup` + happy-dom harness pattern, all
re-used). Spec mounts `ColRuler` + `SizeTooltip` + `useResponsiveCols`

- `GridContainer` + `useAutoRowSpan` consumers via `renderIntoPage` +
  `renderJsxMarkup` (mirroring C.2-10 AC#5 + AC#10 + AC#8 precedents at
  `grid-drag-drop.spec.ts:188-235`, `:367-411`, `:270-365`).
  Each test case asserts the helper output matches the expected
  ADR-0017 D9 / ADR-0016 D5 contract.

Specifically:

1. **NEW `apps/site/playwright/grid-resize-responsive.spec.ts`**
   (~360 LOC). Exports nothing (Playwright test module); structure:
   - **File-head JSDoc** citing ADR-0017 D9 §308-339 col-ruler +
     size-tooltip + mobile view-only + AC#10 §384 + ADR-0016 D5
     §239-262 12/6/1 viewport switch + ADR-0016 D6 §70-86
     effectiveColSnaps + ADR-0011 D9.6 CI gate auto-skip + Wave 5
     plan v1.3 row C.2-11 line 692. JSDoc explicitly notes the
     C.2-10 forward-pointer split for AC#10 (rendering invariant at
     C.2-10; resize-drag interaction here at C.2-11) + the C.4-2
     deferred portion (real mousedown sequence) + the Path A
     synthetic-harness scope.
   - **NO WSL2 skip block** (the legacy WSL2 skip pattern was
     stripped from C.2-10 + canonicalized post-PR #79 housekeeping;
     all `apps/site/playwright/*.spec.ts` specs at HEAD now run
     natively on WSL2 without a skip preamble — verified by
     `grep -L 'isWsl2' apps/site/playwright/*.spec.ts` returning
     all 4 files at HEAD; C.2-11 follows the same convention).
   - **Imports**: `expect, test` from `@playwright/test`;
     `Window` from `happy-dom`; `* as React` from `react`; `act`
     from `react`; `createRoot, type Container, type Root` from
     `react-dom/client`; `ColRuler` from
     `@skb/editor-shell/src/resize/col-ruler.tsx`; `SizeTooltip,
colSpanToFraction` from
     `@skb/editor-shell/src/resize/size-tooltip.tsx`;
     `useResponsiveCols, RESPONSIVE_BREAKPOINTS, type ViewportCols`
     from `@skb/editor-shell/src/responsive-cols.ts`; `GridContainer`
     from `@skb/editor-shell/src/grid-container.tsx`;
     `useAutoRowSpan` from
     `@skb/editor-shell/src/use-auto-row-span.ts`;
     `effectiveColSnaps` from `@skb/block-foundation`;
     `renderIntoPage, renderJsxMarkup` from
     `./grid-drag-drop.fixtures` (re-uses C.2-10 helpers).
   - **`describe('AC#10 resize feedback primitives synthetic
harness')`** wrapping 5 test cases: - **`test('AC#10 — colSpanToFraction maps colSpan/totalCols
per FRACTIONS_BY_TOTAL_COLS table')`**: pure-helper test
     (no DOM; sync callback). Assert
     `colSpanToFraction(12, 12) === 'full'`,
     `colSpanToFraction(8, 12) === '2/3'`,
     `colSpanToFraction(6, 12) === '1/2'`,
     `colSpanToFraction(4, 12) === '1/3'`,
     `colSpanToFraction(3, 12) === '1/4'`,
     `colSpanToFraction(2, 12) === '1/6'`,
     `colSpanToFraction(6, 6) === 'full'`,
     `colSpanToFraction(3, 6) === '1/2'`,
     `colSpanToFraction(2, 6) === '1/3'`,
     `colSpanToFraction(1, 1) === 'full'`. Assert
     `() => colSpanToFraction(5, 12)` throws with message
     containing `unsupported colSpan/totalCols pair`. **Cites
     ADR-0017 D9 §312-313 size-tooltip fraction display +
     size-tooltip.tsx:22-41 FRACTIONS_BY_TOTAL_COLS table**. - **`test('AC#10 — SizeTooltip renders fraction text + cursor
position offset (12px right / 8px up)')`**: synthetic harness
     via `renderIntoPage` + `renderJsxMarkup`; mount `<SizeTooltip
cursorX={400} cursorY={300} fraction="1/2" />`; assert
     `page.locator('.skb-size-tooltip')` has count 1 + text
     content `1/2` + `position: fixed` + `left: 412px` /
     `top: 292px` via `getComputedStyle`. Mount second harness
     with `<SizeTooltip cursorX={100} cursorY={150}
fraction="2/3" rowSpan={4} />`; assert text content
     `2/3 · 4 rows` (the `·` separator per
     `size-tooltip.tsx:18`). **Cites ADR-0017 D9 §313 size-tooltip
     offset + size-tooltip.tsx:11-19 CURSOR_OFFSET constants**. - **`test('AC#10 — ColRuler hoveredStop cursor-driven
transition (synthetic re-render with sequential
hoveredStop values)')`**: synthetic harness; mount
     `<ColRuler activeStops={[2,3,4,6,8,12]} hoveredStop={2}
totalCols={12} />`; assert
     `.skb-col-ruler-stop--active` count is 1 + `data-stop="2"`.
     Re-mount with `hoveredStop={6}`; assert count still 1 +
     `data-stop="6"`. Re-mount with `hoveredStop={null}`; assert
     count is 0 (no active stop). Re-mount with `hoveredStop={5}`
     (a value NOT in activeStops); assert count is 0 (no stop
     has data-stop="5"; matching is exact per
     `col-ruler.tsx:88-90` `stop === hoveredStop`). **Cites
     ADR-0017 D9 §311 col-ruler highlight + col-ruler.tsx:74-100
     active-state derivation**. - **`test('AC#10 — ColRuler returns null for totalCols=1
(mobile view-only path per ADR-0017 D9 §327-339)')`**:
     synthetic harness; mount `<ColRuler activeStops={[1]}
hoveredStop={1} totalCols={1} />`; assert
     `page.locator('.skb-col-ruler')` count is 0 (no root
     rendered; `col-ruler.tsx:82-84` returns `null` early).
     Assert no `.skb-col-ruler-stop` rendered. **Cites ADR-0017
     D9 §327 mobile view-only + col-ruler.tsx:82-84 null
     guard**. - **`test('AC#10 — effectiveColSnaps authority: 12-col returns
[2,3,4,6,8,12]; 6-col returns [2,3,6]; 1-col returns [1]')`**:
     pure-helper test (sync callback). Assert
     `Array.from(effectiveColSnaps(12))` deepEquals `[2,3,4,6,8,12]`,
     `Array.from(effectiveColSnaps(6))` deepEquals `[2,3,6]`,
     `Array.from(effectiveColSnaps(1))` deepEquals `[1]`. Test
     guards the snap-set authority that ColRuler `activeStops`
     prop consumes per ADR-0016 D6 Q4 absorbtion. **Cites
     ADR-0016 D6 §70-86 effectiveColSnaps + ADR-0017 D9 §311
     activeStops consumer pattern**.
   - **`describe('ADR-0016 D5 responsive viewport switch +
GridContainer wire')`** wrapping 3 test cases: - **`test('AC#10 — useResponsiveCols returns 12 / 6 / 1 per
matchMedia query against viewport width breakpoints')`**:
     happy-dom harness mirroring C.2-10 AC#8 useAutoRowSpan
     precedent (`grid-drag-drop.spec.ts:270-365`); install
     `Window` + `globalScope.window` + matchMedia mock that
     responds to query string. Mount a `function ColsHarness()`
     React component that calls `useResponsiveCols()` + writes
     result to `data-cols` dataset on host element. Mock
     matchMedia for desktop (`(min-width: 1024px)` matches +
     `(min-width: 768px)` matches) → assert `data-cols="12"`.
     Re-mock for tablet (`(min-width: 1024px)` no match +
     `(min-width: 768px)` matches) → re-mount harness; assert
     `data-cols="6"`. Re-mock for mobile (both no match) →
     re-mount; assert `data-cols="1"`. Restore globals in
     `finally`. \*\*Cites ADR-0016 D5 §239-262 viewport breakpoints - responsive-cols.ts:29-43 colsFromMatches + RESPONSIVE_BREAKPOINTS\*\*. - **`test('AC#10 — GridContainer emits .skb-grid--mobile + data-skb-viewport-cols
per viewportCols prop')`**: synthetic harness via
     `renderIntoPage` + `renderJsxMarkup`. Mount
     `<GridContainer viewportCols={12}>x</GridContainer>`;
     assert `page.locator('.skb-grid')` count 1 + does NOT have
     `.skb-grid--mobile` class + has attribute
     `data-skb-viewport-cols="12"`. Re-mount with
     `viewportCols={6}`; assert no `.skb-grid--mobile` class +
     attribute `data-skb-viewport-cols="6"`. Re-mount with
     `viewportCols={1}`; assert HAS `.skb-grid--mobile` class +
     attribute `data-skb-viewport-cols="1"`. Re-mount with
     `viewportCols` omitted (undefined); assert no
     `.skb-grid--mobile` class + no `data-skb-viewport-cols`
     attribute (or undefined per React JSX serialization).
     **Cites ADR-0017 D9 §327-339 mobile view-only +
     grid-container.tsx:35-43 className wire**. - **`test('AC#10 — useAutoRowSpan re-measures under viewport
switch without mutating persistent rowSpan integer')`**:
     happy-dom harness; install `Window` + `MockResizeObserver`
     (mirroring C.2-10 AC#8 precedent at
     `grid-drag-drop.spec.ts:285-310`). Mount a `function
ResponsiveRowSpanHarness()` that combines
     `useResponsiveCols()` + `useAutoRowSpan(ref)` and writes
     both values to dataset. Initial mount under desktop
     matchMedia → trigger `MockResizeObserver.fire(scrollHeight=210)`
     → assert `data-measured-row-span="4"` +
     `data-persistent-row-span="2"` (persistent unchanged) +
     `data-cols="12"`. Re-mock matchMedia for mobile → re-mount
     (or trigger re-render) → trigger `MockResizeObserver.fire
(scrollHeight=420)` (taller content under narrow viewport)
     → assert `data-measured-row-span="8"` (or whatever the math
     yields per AUTO_ROW_HEIGHT) + `data-persistent-row-span="2"`
     (still unchanged) + `data-cols="1"`. Persistent rowSpan
     integer (storage layer) is byte-equal across viewport
     switches per ADR-0016 D3 §226-231 markdown 'auto' rule.
     **Cites ADR-0016 D3 §226-231 markdown rowSpan='auto'
     render-time-only rule + ADR-0016 D5 §239-262 viewport
     switch + use-auto-row-span.ts ResizeObserver consumption**.
   - **`describe('AC#10 real-mouse resize-drag deferred to C.4-2')`**
     wrapping 1 test case marked `test.skip` with DEFERRED-TO-C.4-2
     reason (mirrors C.2-10 AC#7/#9/#11/#12 deferred precedent at
     `grid-drag-drop.spec.ts:412-441`). Single test
     `test('AC#10 — real mousedown / mousemove / mouseup on
.gblock-handle.right triggers ColRuler hoveredStop transition,
SizeTooltip fraction update, and snap-to-COL_SNAPS commit on
release')` whose body invokes
     `test.skip(true, 'DEFERRED-TO-C.4-2: requires
.gblock-handle.right DOM emission and pointer-event handler
dispatching layoutReducer resize action wired in EditorShellMount
mount site at C.4-2 per plan v1.3 row C.4-2 line 715. C.2-11
covers the synthetic harness portions (helpers, props, matchMedia
mock); C.4-2 lifts this test.skip to active by wiring real mouse
events to editor-shell layoutReducer.')`. Cites ADR-0017 D9
     §314-323 resize落定 snap-to-COL_SNAPS, AC#10 §384, and plan v1.3
     row C.4-2 line 715.

2. **MODIFIED `docs/plans/wave-5-main/C.2-11-playwright-resize-responsive.md`**
   (this PR.md file; ~830 LOC). Standalone authoring per ADR-0011 D2
   v0.1.1 SOTed-PR.md schema; reviewer codex Stage 3 verifies acceptance
   accuracy.

The PR introduces NO change to `packages/editor-shell/**` (zero diff
under the editor-shell package; the spec consumes existing public
surface through TS-direct imports), NO change to
`apps/site/src/**` (zero diff under apps/site source tree; the spec
uses synthetic harness via `renderIntoPage` + does NOT navigate any
app route — no need for `/sample-blocks-astro` or `/notes/sample-blocks`
fixtures because the responsive + resize primitives are testable in
isolation under happy-dom + chromium synthetic page), NO change to any
CONTRACT.md, NO change to package.json / pnpm-lock.yaml, NO change to
CI workflow, NO change to `apps/site/playwright/grid-drag-drop.fixtures.ts`
(re-used as-is from C.2-10).

## files

> Whitelist per ADR-0011 D2 file scope-fence. Exact files only; any
> deviation = scope creep + reviewer codex Stage 3 verdict
> REJECT-with-residue.

1. `apps/site/playwright/grid-resize-responsive.spec.ts` (NEW; ~360 LOC)
2. `docs/plans/wave-5-main/C.2-11-playwright-resize-responsive.md`
   (NEW; this PR.md self; ~830 LOC)

**Estimated total source LOC**: ~360 LOC (all in the spec file), under
Wave 5 plan v1.3 row C.2-11 line 692 ~400 LOC budget. Plan PR.md
(entry 2) excluded from source LOC count per ADR-0011 D2 schema
convention. NO new fixtures file required — the spec re-uses
`apps/site/playwright/grid-drag-drop.fixtures.ts` `renderIntoPage` +
`renderJsxMarkup` exports without modification. Pre-flight executor TDD
judgment: if fixture extraction during TDD iteration becomes
unavoidable (e.g., MockResizeObserver class duplicated across 2 specs
would benefit from shared module), executor proposes a 3rd whitelist
entry at REVIEW iteration with reviewer codex sign-off — but the
default scope is 2 entries.

## test_cases

TDD-front per ADR-0011 D1 stage 2 EXECUTE; codex-generic-executor
writes the spec file FIRST in failing state (all 9 test stubs FAIL
because the spec body is empty), then iterates the spec content until
all 8 active tests PASS + 1 deferred test SKIPS correctly (visible in
Playwright report as "skipped" not "failed"). The full Playwright spec
file IS the test_cases — there is no separate vitest/unit suite; the
PR's deliverable is exactly the Playwright spec exercising ADR-0017 D9

- ADR-0016 D5 contracts.

### Suite 1 — `apps/site/playwright/grid-resize-responsive.spec.ts`

`describe('AC#10 resize feedback primitives synthetic harness')`

- **TC1.1** `AC#10 — colSpanToFraction maps colSpan/totalCols per
FRACTIONS_BY_TOTAL_COLS table`:
  - input: 10 sample colSpan/totalCols pairs covering 12-col / 6-col /
    1-col rows of the FRACTIONS_BY_TOTAL_COLS table at
    `size-tooltip.tsx:22-41`; plus 1 throw fixture for unsupported
    pair `(5, 12)`
  - expected: each pair returns the table-mapped fraction string
    (`'full'` / `'1/2'` / `'1/3'` / `'1/4'` / `'1/6'` / `'2/3'`); the
    unsupported pair throws with message containing `unsupported
colSpan/totalCols pair`
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC1.1`

- **TC1.2** `AC#10 — SizeTooltip renders fraction + cursor offset`:
  - input: mount `<SizeTooltip cursorX={400} cursorY={300}
fraction="1/2" />` via `renderIntoPage` + `renderJsxMarkup`
  - expected: `.skb-size-tooltip` count=1 + text content `1/2` +
    `position: fixed` + `left: 412px` + `top: 292px` per
    CURSOR_OFFSET_X=12 / CURSOR_OFFSET_Y=-8 at
    `size-tooltip.tsx:18-19`; second harness with `rowSpan={4}` +
    `fraction="2/3"` renders text `2/3 · 4 rows` (separator
    `·` + space)
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC1.2`

- **TC1.3** `AC#10 — ColRuler hoveredStop cursor transition`:
  - input: 4 sequential mounts varying `hoveredStop` (`2`, `6`, `null`,
    `5`) with fixed `activeStops=[2,3,4,6,8,12]` + `totalCols=12`
  - expected: active-stop count is `1` for `hoveredStop=2` (data-stop="2")
    and `hoveredStop=6` (data-stop="6"); count is `0` for
    `hoveredStop=null` and `hoveredStop=5` (5 not in activeStops)
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC1.3`

- **TC1.4** `AC#10 — ColRuler returns null for totalCols=1`:
  - input: mount `<ColRuler activeStops={[1]} hoveredStop={1}
totalCols={1} />`
  - expected: `.skb-col-ruler` count=0 + `.skb-col-ruler-stop`
    count=0 (early null return per `col-ruler.tsx:82-84`)
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC1.4`

- **TC1.5** `AC#10 — effectiveColSnaps authority`:
  - input: call `effectiveColSnaps(12)` / `(6)` / `(1)` (sync)
  - expected: deepEquals `[2,3,4,6,8,12]` / `[2,3,6]` / `[1]` per
    `grid-math.ts:75-87`
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC1.5`

### Suite 2 — `describe('ADR-0016 D5 responsive viewport switch + GridContainer wire')`

- **TC2.1** `AC#10 — useResponsiveCols matchMedia → ViewportCols`:
  - input: 3 matchMedia mock configurations (desktop matches both
    queries / tablet matches 768 only / mobile matches neither);
    happy-dom harness mounts `function ColsHarness()` calling
    `useResponsiveCols()` + writing result to `data-cols`
  - expected: `data-cols="12"` under desktop mock; `data-cols="6"`
    under tablet mock; `data-cols="1"` under mobile mock (per
    `responsive-cols.ts:29-43` colsFromMatches table)
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC2.1`

- **TC2.2** `AC#10 — GridContainer emits .skb-grid--mobile +
data-skb-viewport-cols`:
  - input: 4 mounts of `<GridContainer viewportCols={V}>x</GridContainer>`
    for V ∈ {12, 6, 1, undefined}
  - expected: `.skb-grid` count=1 in all cases;
    `.skb-grid--mobile` class only when V=1;
    `data-skb-viewport-cols="V"` attr present for V ∈ {12, 6, 1};
    no attribute when V=undefined (per `grid-container.tsx:35-43`)
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC2.2`

- **TC2.3** `AC#10 — useAutoRowSpan re-measures under viewport switch
without mutating persistent rowSpan integer`:
  - input: happy-dom harness mounts `function ResponsiveRowSpanHarness()`
    calling `useResponsiveCols()` + `useAutoRowSpan(ref)`; trigger
    `MockResizeObserver.fire(210)` under desktop matchMedia, then
    re-mount under mobile matchMedia + trigger `fire(420)`
  - expected: under desktop measured rowSpan integer matches the
    AUTO_ROW_HEIGHT math (e.g., 4); under mobile after re-fire
    measured rowSpan reflects new content height (e.g., 8); persistent
    rowSpan attr (`data-persistent-row-span`) is `'2'` byte-equal
    across both phases (storage layer untouched per ADR-0016 D3
    §226-231)
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC2.3`

### Suite 3 — `describe('AC#10 real-mouse resize-drag deferred to C.4-2')`

- **TC3.1** `AC#10 — real mousedown → mousemove → mouseup resize-drag`:
  - body: `test.skip(true, 'DEFERRED-TO-C.4-2: requires
.gblock-handle.right DOM emission + pointer-event handler
dispatching layoutReducer resize action wired in
EditorShellMount mount site at C.4-2 per plan v1.3 row C.4-2
line 715. C.2-11 covers the synthetic harness portions
(helpers + props + matchMedia mock); C.4-2 lifts this test.skip
to active by wiring real mouse events to editor-shell
layoutReducer.')`
  - location:
    `apps/site/playwright/grid-resize-responsive.spec.ts:TC3.1`

## contracts_affected

NONE.

`packages/editor-shell/CONTRACT.md` is **NOT modified** in this PR.
The spec consumes existing public surface only:
`ColRuler` + `ColRulerProps` (shipped at C.2-6 PR #68) + `SizeTooltip`

- `SizeTooltipProps` + `colSpanToFraction` (C.2-6) + `useResponsiveCols`
- `RESPONSIVE_BREAKPOINTS` + `ViewportCols` (C.2-9 PR #82) +
  `GridContainer` + `GridContainerProps` (C.2-4 PR #63 + responsive
  extension at C.2-9) + `useAutoRowSpan` (C.2-4) +
  `@skb/block-foundation` `effectiveColSnaps` (Pre-A2 PR / C.2-2 PR).
  NO new export. NO existing export signature widened. NO existing
  export semantics change. The Public Surface section of CONTRACT.md at
  HEAD covers all consumed exports.

`apps/site/CONTRACT.md` (if present at HEAD) is **NOT modified**. The
spec uses synthetic harness via `renderIntoPage` and does NOT
navigate any apps/site route.

`apps/site/playwright/grid-drag-drop.fixtures.ts` is **NOT modified**.
The 2 helpers consumed (`renderIntoPage` + `renderJsxMarkup`) are
already exported and stable since C.2-10.

## adr_touched

NONE (read-only consume).

The spec's authority is **ADR-0017 D9 §308-339 + AC#10 §384** at HEAD
(squash `Pre-A3 ADR-0017 design-lock` per Wave 5 plan v0.2 D5 ADR
编号映射表) and **ADR-0016 D5 §239-262 + D6 §70-86 effectiveColSnaps**
(squash `Pre-A2 ADR-0016 design-lock`). The spec's behavior is fully
determined by ADR-0017 D9 col-ruler + size-tooltip + mobile view-only

- AC#10 acceptance criteria + ADR-0016 D5 viewport breakpoints + D6
  snap-set authority. The spec's deferred-AC justification cites
  **ADR-0011 D9.6 CI gate auto-skip + Wave 5 plan v1.3 row C.4-2 line
  715** for the `test.skip` 1 entry.

NO ADR amendment is authored or modified. NO new ADR is created. D2
row 4 (NEW ADR required) does NOT fire.

## acceptance

> Reviewer codex (Stage 3) and pr-writer (Stage 6 ACCEPT) verify these
> against the committed diff. ACs that map to Playwright tests cite
> the test file + describe/it title for traceability per ADR-0011 D2
> v0.1.1 SOTed-PR.md schema.

### File presence + structure ACs

- **AC#A1**: `apps/site/playwright/grid-resize-responsive.spec.ts`
  exists at PR HEAD; file size between 280 LOC and 480 LOC inclusive
  (target ~360 LOC). Verified via
  `wc -l apps/site/playwright/grid-resize-responsive.spec.ts`.
- **AC#A2**: `docs/plans/wave-5-main/C.2-11-playwright-resize-responsive.md`
  exists at PR HEAD (this PR.md self).
- **AC#A3**: spec file does NOT contain a WSL2 skip preamble
  (`isWsl2()` function + `test.skip(isWsl2(), ...)` at module
  scope) — the legacy skip pattern was canonicalized away post-PR
  #79 housekeeping. Verified via
  `grep -c 'isWsl2' apps/site/playwright/grid-resize-responsive.spec.ts`
  = 0.
- **AC#A4**: spec re-uses `renderIntoPage` + `renderJsxMarkup` from
  `./grid-drag-drop.fixtures` without modification (zero diff under
  `apps/site/playwright/grid-drag-drop.fixtures.ts`). Verified via
  `git diff origin/main...HEAD -- apps/site/playwright/grid-drag-drop.fixtures.ts`
  empty.

### Spec coverage ACs

- **AC#A5**: Playwright `--list` reports exactly 9 registered tests
  (8 active across Suite 1 + Suite 2; 1 deferred test in Suite 3 that
  calls `test.skip(true, ...)` inside a registered `test()` body) —
  one per AC#10 sub-portion. Verified via
  `cd apps/site && pnpm exec playwright test --list playwright/grid-resize-responsive.spec.ts`
  ending with `Total: 9 tests in 1 file`.
- **AC#A6**: each spec test title cites ADR-0017 AC#10 (i.e., contains
  the substring `AC#10`). Verified via
  `grep -c "AC#10" apps/site/playwright/grid-resize-responsive.spec.ts`
  ≥ 9.
- **AC#A7**: Suite 3 (1 registered deferred test) contains the literal
  substring `DEFERRED-TO-C.4-2` in the skip reason inside the test
  body. Verified via
  `grep -c "DEFERRED-TO-C.4-2" apps/site/playwright/grid-resize-responsive.spec.ts`
  ≥ 1.
- **AC#A8**: Suite 3 deferred test cites `C.4-2 line 715` in the skip
  reason for traceability. Verified via
  `grep -c "C.4-2 line 715" apps/site/playwright/grid-resize-responsive.spec.ts`
  ≥ 1.
- **AC#A9**: spec cites the source authority for selectors via
  inline comments at every selector use:
  - `.skb-col-ruler-stop` + `.skb-col-ruler-stop--active` cite
    `packages/editor-shell/src/resize/col-ruler.tsx:35-38`
    (`stopClassName`); `.skb-col-ruler` cites
    `col-ruler.tsx:32` (`rootClassName`)
  - `.skb-size-tooltip` cites
    `packages/editor-shell/src/resize/size-tooltip.tsx:43-45`
    (`tooltipClassName`)
  - `.skb-grid--mobile` + `data-skb-viewport-cols` cite
    `packages/editor-shell/src/grid-container.tsx:35-43`
  - `colSpanToFraction` table cites `size-tooltip.tsx:22-41`
    (FRACTIONS_BY_TOTAL_COLS)
  - `useResponsiveCols` matchMedia cites
    `packages/editor-shell/src/responsive-cols.ts:29-43`
    (colsFromMatches)
  - `effectiveColSnaps` cites
    `packages/block-foundation/src/grid-math.ts:75-87`

### CI gate ACs

- **AC#A10**: `pnpm exec tsx scripts/check-ui-touch.ts` returns
  `ui_touch=false` when run on this PR's diff (mechanical detection
  per ADR-0011 D9.1 path patterns; the 2 changed files do not match
  any of the 7 D9.1 path regexes). Verified by reviewer codex via
  `git diff --name-only origin/main...HEAD | xargs pnpm exec tsx
scripts/check-ui-touch.ts --files` → `ui_touch=false`.
- **AC#A11**: PR.md `## ui_touch` field is set to `false` (per
  AC#A10 mechanical verdict).
- **AC#A12**: PR.md `## e2e_smoke` field is set to `[]` (empty list
  per ADR-0011 D9 v0.2 amendment §"non-strict on ui_touch=false PRs"
  - Wave 5 plan v1.3 §551 retrofit catalog Q1 absorbtion clarification
    for `apps/site/playwright/**` paths).
- **AC#A13**: CI gate `e2e-coverage-check` (`.github/workflows/ci.yml`
  job) auto-skips on this PR per ADR-0011 D9.6 (verified by
  `gh pr checks` after push showing `e2e-coverage-check: SKIPPED` or
  equivalent).
- **AC#A14**: existing `visual-smoke` CI job (executes `pnpm --filter
@skb/site test:visual` over all `apps/site/playwright/**/*.spec.ts`
  - `apps/site/src/__tests__/e2e/**/*.spec.ts` per
    `apps/site/playwright.config.ts` testMatch line 4 at HEAD)
    **PASSES** end-to-end including `grid-resize-responsive.spec.ts`
    (8 active tests PASS + 1 skipped test visible in report as
    "skipped"; ZERO failures). Verified by `gh pr checks` after push
    showing `visual-smoke: SUCCESS`.

### Quality ACs

- **AC#A15**: `pnpm check` clean on this PR's branch (lint +
  typecheck + test + build + size-check). Verified by reviewer codex
  Stage 3.
- **AC#A16**: `pnpm --filter @skb/site lint` passes with 0 errors;
  the `max-lines` rule may emit a warn at 300 LOC but the spec
  remains under the 500-LOC hard limit. Verified by reviewer codex
  Stage 3.
- **AC#A17**: `pnpm --filter @skb/site typecheck` passes with 0
  errors (Playwright type imports + happy-dom + react / react-dom
  type imports + editor-shell TS-direct imports + block-foundation
  re-export resolve). Verified by reviewer codex Stage 3.
- **AC#A18**: `pnpm exec prettier --check
apps/site/playwright/grid-resize-responsive.spec.ts
docs/plans/wave-5-main/C.2-11-playwright-resize-responsive.md`
  produces zero diff (Prettier compliant). Verified by reviewer codex
  Stage 3.
- **AC#A19**: `pnpm size-check` PASSES; the new file is under the
  500-line hard limit + below the 300-line warn (target ~360 LOC —
  exception: spec exceeds 300-line warn budget but is under 500-line
  hard limit; the same exception was accepted at C.2-10 per AC#A17
  precedent). Verified by reviewer codex Stage 3.
- **AC#A20**: `pnpm link-check` PASSES (no new external links
  introduced; PR.md cross-refs all use repo-relative paths under
  `## Plan cross-refs`). Verified by reviewer codex Stage 3.
- **AC#A21**: `## Plan cross-refs` uses 2-levels-up relative paths
  (`../../decisions/...`, `../../superpowers/...`) from
  `docs/plans/wave-5-main/`; lychee resolves all anchors. Verified
  via `pnpm link-check` clean.
- **AC#A22**: spec callbacks that contain no `await` are sync (no
  `async` keyword) so the `require-await` lint rule does not fire
  (TC1.1 + TC1.3-1.5 are sync; TC1.2 + TC2.1 + TC2.2 + TC2.3 use
  `async ({ page }) => {}` because they call `renderIntoPage`).
  Verified at lint step.

### ADR-0017 AC# coverage matrix (AC#10 sub-portion split with C.2-10 + C.4-2)

| ADR-0017 AC#10 sub-portion                                        | Coverage status                                          | Test case      | Reason if deferred                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------- | -------------- | ------------------------------------------------------------------------- |
| ColRuler renders snap stops + highlights one active stop          | **COVERED at C.2-10** (`grid-drag-drop.spec.ts:367-411`) | (C.2-10 TC2.3) | rendering invariant portion shipped C.2-10                                |
| colSpanToFraction maps colSpan/totalCols                          | **COVERED in this PR**                                   | TC1.1          | —                                                                         |
| SizeTooltip renders fraction + cursor offset                      | **COVERED in this PR**                                   | TC1.2          | —                                                                         |
| ColRuler hoveredStop cursor-driven transition                     | **COVERED in this PR** (synthetic re-render harness)     | TC1.3          | full real-mouse hoveredStop transition deferred to C.4-2                  |
| ColRuler null guard for totalCols=1 (mobile view-only)            | **COVERED in this PR**                                   | TC1.4          | —                                                                         |
| effectiveColSnaps authority (12 → 6 stops; 6 → 3; 1 → 1)          | **COVERED in this PR**                                   | TC1.5          | —                                                                         |
| useResponsiveCols matchMedia → ViewportCols                       | **COVERED in this PR**                                   | TC2.1          | —                                                                         |
| GridContainer .skb-grid--mobile + data-skb-viewport-cols emission | **COVERED in this PR**                                   | TC2.2          | —                                                                         |
| useAutoRowSpan re-measure under viewport switch                   | **COVERED in this PR** (rowSpan adapt portion)           | TC2.3          | —                                                                         |
| Real mousedown → mousemove → mouseup resize-drag + snap on commit | **DEFERRED-TO-C.4-2**                                    | TC3.1 (skip)   | requires .gblock-handle.right DOM emission + layoutReducer wired at C.4-2 |

**Result**: 8 AC#10 sub-portions COVERED in this PR + 1 sub-portion
DEFERRED to C.4-2 (real-mouse resize-drag) with skip + reason.
The C.2-10 contribution covers the rendering-invariant portion;
C.2-11 covers the resize-feedback-primitive + responsive-switch +
rowSpan-adapt portions; C.4-2 covers the real-mouse-drag portion.
Together AC#10 is fully covered post-C.4-2. NO ADR-0017 AC# is
silently dropped — every AC#10 sub-portion has an explicit
covered/deferred row + traceable forward pointer.

## executor

`codex-generic-executor` per Wave 5 plan v1.3 row C.2-11 line 692
executor column. Standard ADR-0007 D5 dispatch via orchestrator Bash;
profile `codex-generic-executor`; sandbox `workspace-write`;
approval-policy `never`; audit log
`/tmp/codex-runs/2026-05-06-C.2-11-execute.txt` raw +
`docs/audits/codex-runs/2026-05-06-C.2-11-execute.txt` curated archive
(head -50 + verdict grep if log > 500 KB per memory
`feedback_codex_audit_log_recursion.md` watchdog kill at ~500 KB).

TDD-front discipline per ADR-0011 D1 stage 2: write the spec file in
failing state first (9 test stubs all FAIL because spec body empty)
→ confirm `pnpm --filter @skb/site test:visual` reports 9 failures →
flesh out spec content iteratively until all 8 active tests PASS + 1
deferred test SKIPS.

## ui_touch

false

> Mechanical D9.1 detection: 2 changed files
> (`apps/site/playwright/grid-resize-responsive.spec.ts` +
> `docs/plans/wave-5-main/C.2-11-playwright-resize-responsive.md`)
> do NOT match any of the 7 ADR-0011 D9.1 path-pattern regexes
> (`apps/site/src/pages/**` / `apps/site/src/components/**` /
> `apps/site/src/styles/**` / `packages/*/src/ui-default/**` /
> `packages/heavy-block-boundary/src/**` /
> `packages/editor-shell/src/**` / `packages/design-tokens/**`).
> `pnpm exec tsx scripts/check-ui-touch.ts --files
apps/site/playwright/grid-resize-responsive.spec.ts
docs/plans/wave-5-main/C.2-11-playwright-resize-responsive.md` →
> stdout `ui_touch=false`. Per Wave 5 plan v1.3 §551 retrofit catalog
> Q1 absorbtion clarification for `apps/site/playwright/**` paths:
> the PR's _purpose_ is Playwright resize + viewport-switch coverage
> (UI-touch verification framework per ADR-0011 D9), but the
> _mechanical_ ui_touch verdict is false because none of the diff
> hits a D9.1 path pattern — same shape as C.2-10 + planned C.2-12 +
> C.3-5 + C.4-5 patterns. Per ADR-0011 D9.6 CI gate auto-skip on
> `ui_touch=false` keeps merge unblocked. C.2-11 reaffirms the
> catalog-defined `ui_touch=false` shape for a Playwright-spec-only
> diff that C.2-10 first operationalized.

## e2e_smoke

[]

> Per ADR-0011 D9 v0.2 amendment + Wave 5 plan v1.3 §551 retrofit
> catalog: when `ui_touch=false` (mechanical), the `e2e_smoke` field
> is empty list `[]`. CI gate `e2e-coverage-check` auto-skips merge
> enforcement per ADR-0011 D9.6. The Playwright spec itself runs via
> the existing `visual-smoke` CI job (covering all
> `apps/site/playwright/**/*.spec.ts` per `playwright.config.ts`
> testMatch line 4 at HEAD) — no new `e2e_smoke` entry required.

## Out of scope

- **Full editor-shell resize-drag wiring into apps/site
  EditorShellMount.tsx** (Path B; deferred to C.4-2 per plan v1.3
  row C.4-2 line 715). C.4-2 ships
  `apps/site/src/pages/notes/[slug]/edit.astro` +
  `apps/site/src/components/EditorShellMount.{astro,tsx}` full
  BlockRegistry/KernelRegistry wire including drag/resize/Esc/
  ghost/drop-pulse interactivity + the `.gblock-handle.right` DOM
  emission per ADR-0017 D9 §319-323 resize handle 显示规则.
- **Real-mouse `.gblock-handle.right` mousedown → mousemove →
  mouseup → snap-on-release** — that's C.4-2 scope per plan v1.3
  row C.4-2 line 715 (TC3.1 skip block enumerates this explicitly).
- **Resize handle 显示规则 by kind (`.bottom` / `.corner` only on
  render/viz/component, NOT prose markdown)** — that's C.4-2 scope
  per ADR-0017 D9 §320-322 resize handle kind branching; C.2-11
  exercises only the `ColRuler` + `SizeTooltip` synthetic-harness
  primitives, not the kind-branched handle DOM emission.
- **Mobile drag/resize disabled CSS rules** (`.skb-grid--mobile`
  with `[hidden]` or `display:none` on resize-handles +
  drag-handles) — TC1.4 covers the `ColRuler` null-guard portion
  (the component returns null for `totalCols=1`), but the full
  CSS-driven `display:none` on `.gblock-handle.right` /
  `.bottom` / `.corner` under `.skb-grid--mobile` is C.4-2 scope
  (the handles are emitted at C.4-2 in the first place).
- **60fps perf budget on resize drag-over** — that's C.2-12 scope
  per plan v1.3 row C.2-12 line 693. C.2-11 covers no perf
  assertion.
- **Visual smoke screenshot baselines** — that's C.2-12 scope per
  plan v1.3 row C.2-12 + ADR-0018 C.3-5 baselines per ADR-0017
  AC#5/#10 visual snapshot. C.2-11 ships interaction-helper
  assertions only, no screenshots.
- **C.4-2 deferred AC#10 sub-portion** is authored as 1
  `test.skip(true, ...)` placeholder WITH the test title +
  describe block + skip reason intact so the C.4-2 PR can lift the
  `test.skip` to active by removing the `test.skip(true, ...)`
  call and fleshing out the test body in-place without
  re-authoring the test scaffold. C.4-2 PR.md `## acceptance` will
  explicitly enumerate this as the EditorShellMount integration
  AC mapped to TC3.1.
- **`packages/editor-shell/CONTRACT.md` updates** (zero CONTRACT.md
  change in this PR; spec consumes existing public surface only).
- **CI workflow `.github/workflows/ci.yml` modifications** (zero
  workflow change; spec runs via existing `visual-smoke` job).
- **`@skb/editor-shell` package source changes** (zero diff under
  `packages/editor-shell/**`).
- **`apps/site/playwright/grid-drag-drop.fixtures.ts` modification**
  (zero diff; the 2 helpers consumed are stable since C.2-10).

## Risk register

| #   | Risk                                                                                                                                                                                       | Severity | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `useResponsiveCols` happy-dom matchMedia mock fragility — happy-dom 1.x's matchMedia stub may not respond to query string mutations between mounts, breaking TC2.1 + TC2.3                 | medium   | precedent: C.2-10 AC#8 useAutoRowSpan happy-dom harness PASSED in CI per merged PR #83; the same install pattern (`globalScope.window = win` + `globalScope.document = win.document` + manual matchMedia override on `win`) extends to matchMedia. If happy-dom's built-in matchMedia is flaky, executor's TDD step replaces it with a hand-rolled mock that tracks query string → `{ matches, addEventListener, removeEventListener }`; reviewer codex Stage 3 verifies mock matches contract. |
| R2  | Synthetic re-render harness leaks state between mounts (TC1.3 ColRuler 4 sequential mounts; TC2.1 useResponsiveCols 3 sequential mounts) — Playwright `setContent` may not fully reset DOM | low      | `renderIntoPage` calls `page.setContent(...)` which fully replaces document body per Playwright docs; precedent: C.2-10 AC#5 OutlineOverlay 3-mount-per-test pattern PASSED post-merge. Executor's TDD step verifies between-mount state isolation by adding intermediate `expect(page.locator('.skb-col-ruler')).toHaveCount(0)` after each `setContent` if needed.                                                                                                                            |
| R3  | TC2.3 useAutoRowSpan + useResponsiveCols combined harness math may not yield deterministic measured rowSpan integer for the desktop+fire(210) and mobile+fire(420) input pairs             | medium   | the AUTO_ROW_HEIGHT math is `Math.ceil((scrollHeight + gap) / (rowHeight + gap))` per `use-auto-row-span.ts` constants; executor's TDD step computes the expected integer at test write time using the constant values at HEAD (rowHeight = 28; gap = 14 — confirm at TDD), not assumed values. AC#8 precedent at C.2-10 used scrollHeight=210 → rowSpan=4 with constants rowHeight=64, gap=14 (verify at TDD).                                                                                 |
| R4  | TS-direct deep imports (`@skb/editor-shell/src/resize/col-ruler.tsx` etc.) may not resolve under astro build+preview if editor-shell `package.json` `exports` field restricts deep imports | low      | precedent: C.2-10 spec uses identical TS-direct imports for `edge-rects.ts` / `tiebreak.ts` / `outline-overlay.tsx` / `col-ruler.tsx` / `use-auto-row-span.ts` and PASSED end-to-end in CI per merged PR #83. The editor-shell `package.json` at HEAD does not restrict deep imports (no `"exports"` map enforced at PR #83 merge); if `effectiveColSnaps` from `@skb/block-foundation` doesn't resolve, fall back to deep import `@skb/block-foundation/src/grid-math.ts`.                     |
| R5  | Playwright spec runtime extends visual-smoke CI job total time beyond budget                                                                                                               | low      | spec design uses synthetic helper invocations + matchMedia mock harness (NOT real network or animation waits); per-test runtime estimate < 1s × 9 tests ≈ 9s; total visual-smoke job at HEAD runs 4 specs ≈ 60s + this one ≈ 9s = 69s post-merge; well within CI budget per memory `feedback_codex_audit_log_recursion.md` GH-actions-runner-hour budget.                                                                                                                                       |
| R6  | reviewer codex Stage 3 challenges the deferred-AC count (1) as too low — argues some C.4-2-deferred portion (e.g., `.gblock-handle.right` cursor change on hover) could be synth-covered   | medium   | the deferred TC3.1 enumerates the explicit dependency: `.gblock-handle.right` DOM emission lives in EditorShellMount which is C.4-2 scope; without an emitted handle DOM, no real-mouse interaction is possible. If reviewer pushes back, executor can add a synthetic-DOM-handle mount fixture at REVIEW iteration — but that conflates resize-feedback-primitive scope (C.2-11) with handle-emission scope (C.4-2). Pre-flight orchestrator judgment: 1 deferred is the right number.         |
| R7  | TC1.2 SizeTooltip `getComputedStyle` left/top assertion fragility — Playwright `getComputedStyle` returns px-typed strings (`'412px'`); test must compare strings or strip suffix          | low      | precedent at C.2-10 AC#5 uses `getComputedStyle(node).pointerEvents` + `.zIndex` string comparison directly per `grid-drag-drop.spec.ts:209-215`; TC1.2 follows the same string-comparison pattern. Executor's TDD step confirms via `toEqual({ left: '412px', top: '292px', position: 'fixed' })` shape.                                                                                                                                                                                       |

## Open questions

> Per ADR-0011 D2 v0.1.1 SOTed-PR.md schema; resolved at PRE-COMMIT
> CLAUDE REVIEW (Stage 4) — but D2 row 1+4 NOT firing for this PR
> (Standard verdict per `## D2 trigger judgment` below) so Stage 4
> is skipped and these resolve at orchestrator briefing pre-EXECUTE.

- **Q1**: TC2.3 useAutoRowSpan + useResponsiveCols combined harness —
  should `useResponsiveCols` mock matchMedia be re-installed between
  desktop and mobile phases via re-mount (full `act(() => root.unmount())`
  - new `createRoot`) OR via in-place matchMedia event dispatch
    (`mediaQuery.dispatchEvent(new Event('change'))`)? Pre-judgment:
    **re-mount via createRoot** because happy-dom's matchMedia
    `addEventListener` may not fire `change` events from a dispatched
    Event (1.x stub limitation); re-mount also matches the C.2-10 AC#5
    multi-mount precedent. Executor confirms at TDD step.
- **Q2**: TC1.2 SizeTooltip — `getComputedStyle` returns
  `'1/2'` for fraction text? Verified at TDD — text is the JSX
  child, accessed via `page.locator('.skb-size-tooltip').textContent()`
  not getComputedStyle (style is for position/left/top only).
  Pre-judgment: clear; just confirming the AC#A6 + TC1.2 phrasing
  uses `textContent` for fraction + `getComputedStyle` for
  position; executor's TDD step writes both.
- **Q3**: TC2.3 happy-dom `MockResizeObserver` — re-export from
  C.2-10 spec (move to `grid-drag-drop.fixtures.ts` and add 3rd
  whitelist entry) OR duplicate in `grid-resize-responsive.spec.ts`?
  Pre-judgment: **duplicate** because the move triggers a fixtures
  diff = 3 whitelist entries instead of 2 = scope creep at REVIEW.
  Duplicating a ~20-LOC mock class is acceptable per memory
  `feedback_cross_package_consumer_pattern.md` "duplication catches
  silent regressions on dimension VALUES" (mock contract is unit-
  level; copy-pasting 20 LOC is cheaper than fixture extraction).
  Executor confirms at TDD step.
- **Q4**: AUTO_ROW_HEIGHT constants (rowHeight + gap) at HEAD —
  test author MUST read `packages/editor-shell/src/use-auto-row-span.ts`
  at TDD time + compute expected measured rowSpan integers from
  the live constants, NOT assume values from C.2-10 (constants may
  have been refactored post-#83). Pre-judgment: defer to executor
  TDD step to read source at HEAD + compute expected outputs.

## D2 trigger judgment

**Standard** (Wave 5 plan v1.3 row C.2-11 line 692 D2 column). Per
ADR-0007 D2 v0.1.1 row evaluation:

- Row 1 (CONTRACT.md change): **NO** — no CONTRACT.md modified in
  this PR (zero diff under `packages/*/CONTRACT.md` per `## files`
  whitelist).
- Row 2 (package add/remove OR metadata change): **NO** — no new
  package; no package.json / pnpm-lock.yaml change.
- Row 3 (cross-package add/remove ≥ 1 boundary): **NO** — only
  `apps/site/playwright/**` + `docs/plans/**` paths touched.
- Row 4 (NEW ADR required): **NO** — read-only consume of ADR-0017
  D9 + ADR-0016 D5/D6 + ADR-0011 D9 + Wave 5 plan v1.3.
- Row 5 (cross-package ≥ 3 packages OR boundary widening): **NO** —
  spec consumes existing `@skb/editor-shell` + `@skb/block-foundation`
  public surface; no surface widening; no cross-package boundary
  change.
- Row 6 (lockfile / generated artifact churn): **NO** — no
  pnpm-lock.yaml / generated config change.
- Row 7 (security/auth/CI workflow surface): **NO** — no CI workflow
  / secrets / auth change.
- Row 8 (high-risk class — package add/remove OR CI/deploy/auth/
  security): **NO**.

**Verdict**: Standard. PRE-COMMIT CLAUDE REVIEW (D1 stage 4) does
NOT fire. Standard 5-stage D1 pipeline (PLAN → EXECUTE → REVIEW →
COMMIT → ACCEPT).

## Open dependencies

- **C.4-2 forward pointer (ADR-0017 AC#10 real-mouse resize-drag
  deferred sub-portion)**: C.4-2 PR.md MUST lift the 1
  `test.skip(true, ...)` entry in
  `apps/site/playwright/grid-resize-responsive.spec.ts` to active
  test covering EditorShellMount real-mouse resize-drag flow on
  `.gblock-handle.right` + `colSpanToFraction` fraction emit during
  drag + snap-to-COL_SNAPS commit on release. Pre-flight executor
  for C.4-2 reads C.2-11's spec at HEAD as scaffold + flesh out
  test body per AC#10 §384 contract.
- **C.2-12 forward pointer (ADR-0017 AC#10 visual snapshot +
  60fps end-to-end perf)**: C.2-12 PR.md MUST add the visual
  snapshot baseline + perf budget assertion during a real
  resize-drag-over for AC#10 (NOT just synthetic helper
  assertions). C.2-11 covers the synthetic-harness portion of
  AC#10; C.2-12 adds the visual-snapshot + perf-budget portion.

## Plan cross-refs

- [Wave 5 plan v1.3 row C.2-11 line 692](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
- [ADR-0017 §384 AC#10 col-ruler 命中 stop highlight](../../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0017 §308-339 D9 col-ruler + size-tooltip + mobile view-only](../../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0017 §319-323 resize handle 显示规则 (kind branching deferred to C.4-2)](../../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0017 §327-339 mobile 1-col view-only 全 disabled rules](../../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0016 §239-262 D5 12/6/1 viewport breakpoints + RESPONSIVE_BREAKPOINTS](../../decisions/ADR-0016-grid-data-model.md)
- [ADR-0016 §70-86 D6 effectiveColSnaps Q4 snap-set authority](../../decisions/ADR-0016-grid-data-model.md)
- [ADR-0016 §226-231 D3 markdown rowSpan='auto' render-time-only rule](../../decisions/ADR-0016-grid-data-model.md)
- [ADR-0011 D9.1 UI-touch path patterns](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0011 D9.6 CI gate auto-skip](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0006 v0.2 8-point asymmetry-audit checklist](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
- [Wave 5 plan v1.3 §551 retrofit catalog Q1 absorbtion clarification](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
- [Wave 5 C.2-10 PR.md (AC#10 rendering invariant portion + Path A precedent + ui_touch=false catalog)](C.2-10-playwright-drag-scenarios.md)
- [Wave 5 C.2-9 PR.md (useResponsiveCols + GridContainer responsive shipped)](C.2-9-responsive-fsm.md)
- [Wave 5 C.2-6 PR.md (ColRuler + SizeTooltip + colSpanToFraction shipped)](C.2-6-resize-ux.md)
- [Wave 5 C.2-4 PR.md (useAutoRowSpan + GridContainer base shipped)](C.2-4-editor-shell-grid.md)
