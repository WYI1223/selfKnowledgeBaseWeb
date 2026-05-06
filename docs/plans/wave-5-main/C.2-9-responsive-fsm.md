# C.2-9 — Responsive 12/6/1 切换 + rowSpan adapt path (转场态 FSM)

> **Wave 5 Stage C.2 10th implementation PR** of the locked 13-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.3 row C.2-9 line 690). Lands the
> **responsive viewport finite state machine** (FSM) consumed by
> `GridContainer` per ADR-0016 D5 转场态 FSM (5-phase T0-T4 ≤ 320ms
> stable transition) + D12 conflict arbitration ("responsive transition
> 期间 drag 拒绝") + ADR-0017 D9 mobile 1-col path全 view-only via
> `.skb-grid--mobile` className. C.2-1 through C.2-8 all merged on main;
> C.2-8 (squash `2cdcebb`; PR #80) shipped the canonical
> `layoutReducer` + `LayoutState.responsiveTransition: 'idle' |
> 'in-progress'` field with the runtime guard `if
> (state.responsiveTransition === 'in-progress') return state;` already
> in place at the `drag-start` action handler. C.2-8 PR.md open question
> Q1 explicitly forward-pointed to this PR with the resolution "the
> responsive transition source (matchMedia subscription per ADR-0016
> D5 转场态 FSM) is owned by the consumer hook (future
> `useResponsiveCols` in C.2-9 scope) which dispatches a separate
> `responsive-transition-start` / `responsive-transition-end` action".
> C.2-9 lands that consumer hook + the rowSpan adapt path + the
> `viewportCols` prop on `GridContainer` so the visible state contract
> reflects the current viewport breakpoint without breaking the W5-2
> single-source mutation pipeline.
>
> **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger
> judgment` — **Row 1** (`packages/editor-shell/CONTRACT.md`
> sister-doc-sync per ADR-0016 §502 row 4 — `GridContainerProps`
> public surface widens with optional `viewportCols?: 12 | 6 | 1`
> prop + a NEW `useResponsiveCols` hook + a NEW
> `RESPONSIVE_BREAKPOINTS` numeric const + 2 NEW reducer action
> variants) + **Row 5** (cross-package boundary contract change since
> the editor-shell barrel now exports 3 NEW surfaces consumed by
> future C.4 editor-scaffold integration + the C.2-11 Playwright
> resize/responsive PR). Same escalation pattern as the C.2-8 PR #80
> Row 1 + Row 5 verdict for the same `## Drag/Drop layer (C.2-5 +
> C.2-8)` CONTRACT subsection extension, now extended further to
> `(C.2-5 + C.2-8 + C.2-9)`. The Wave 5 plan v1.3 row C.2-9 line 690
> "D2 Standard" annotation is **superseded** by the locked design
> decision in this PR.md to extract the FSM as a separate
> `useResponsiveCols` hook (consistent with editor-shell convention
> for `useAutoRowSpan` + `useEscCancel`) + widen `GridContainerProps`
> with the `viewportCols` prop; orchestrator briefing flagged this
> ("BUT verify if GridContainerProps surface changes trigger Row 1
> CONTRACT.md sync"); pr-writer locks Row 1 + Row 5 here.
>
> **UI-touch PR via ADR-0011 D9.1 mechanical detection** (`packages/
> editor-shell/src/**` path pattern). C.2-9 was NOT in the v1.3
> retrofit catalog (which annotated only C.2-7 + 5 C.3 + 5 C.4 PRs);
> per ADR-0011 D9.2 the orchestrator authors the `e2e_smoke` block
> fresh (catalog-gap procedure; same handling as C.2-8 PR #80). The
> Playwright spec scope is intentionally narrow: editor scaffold
> mounts at `/notes/sample-blocks/edit` after the FSM hook is added;
> `useResponsiveCols` import does not throw at load; matchMedia
> subscription mounts without a console error; one viewport resize
> from desktop (1280px) to tablet (900px) does not crash the editor.
> Full responsive transition scenarios (12 viewport-switch fixtures
> + drag-during-transition rejection assertion) are explicitly
> deferred to C.2-11 per Wave 5 plan v1.3 row C.2-11 line 692.

## title

Land the responsive viewport FSM consumed by `GridContainer` per ADR-0016
D5 (12-col desktop / 6-col tablet / 1-col mobile breakpoints + 5-phase
T0-T4 transition table + rowSpan adapt rule) + D12 ("responsive transition
期间 drag 拒绝" conflict arbitration) + ADR-0017 D9 mobile 1-col path全
view-only via `.skb-grid--mobile` className. **3 NEW editor-shell
surfaces**: (1) `useResponsiveCols` hook in NEW
`packages/editor-shell/src/responsive-cols.ts` — owns the matchMedia
subscription, returns the current `viewportCols: 12 | 6 | 1` integer,
and exposes the 2 NEW layout-reducer action dispatchers
(`responsive-transition-start` + `responsive-transition-end`) so
consumers wire transition lifecycle to the W5-2 single-source mutation
pipeline; (2) `RESPONSIVE_BREAKPOINTS` numeric const exposed from the
same module — `{ tablet: 768, desktop: 1024 }` — with a TODO
forward-pointer to Stage C.3-1 design-tokens consumption per ADR-0018
D-list (the C.2-9 source uses hardcoded numeric values now;
`--bp-tablet` + `--bp-desktop` token landing is Stage C.3-1 scope per
the same ADR-0018 lock pattern that C.2-8 used for `--accent-success`);
(3) `GridContainerProps` widens with optional
`viewportCols?: 12 | 6 | 1` prop — when supplied, the container emits
`data-skb-viewport-cols={viewportCols}` for downstream selector access
and emits the `.skb-grid--mobile` className when `viewportCols === 1`
per ADR-0017 D9 line 326 className authority. **2 NEW LayoutAction
variants** added to `packages/editor-shell/src/drag-drop/layout-reducer.ts`:
`{ type: 'responsive-transition-start' }` flips
`responsiveTransition: 'in-progress'` (epoch unchanged); `{ type:
'responsive-transition-end' }` flips back to `'idle'` (epoch unchanged).
The pre-existing C.2-8 `drag-start` rejection guard (`if
(state.responsiveTransition === 'in-progress') return state;`) becomes
operationally exercised here; new vitest cases TC4.7-TC4.8 enforce the
transition-start / transition-end semantics. **rowSpan adapt path** per
ADR-0016 D5 mobile 1-col rule: when `viewportCols === 1`, all blocks
render `rowSpan='auto'` rendering-derived (consumer wires the existing
`useAutoRowSpan` hook) and the persistent `rowSpan` integer is NOT
mutated at storage (D5 line 226-231 explicit). C.2-9 ships this as a
documented contract in CONTRACT.md prose + a vitest case asserting that
`useResponsiveCols` returns `1` when matchMedia matches `(max-width:
767px)` so consumers can branch their `useAutoRowSpan` invocation; the
actual mobile rowSpan adapt wiring at the EditorShellMount integration
site lands at C.4-2 per Wave 5 plan v1.3 row C.4-2 line 715 (full
BlockRegistry/KernelRegistry wire-up). C.2-9 wires the FSM hook +
reducer transition variants + the GridContainer viewport-cols prop +
mobile className; the responsive transition CSS animation
(`grid-template-columns 180ms cubic-bezier(.2,.7,.2,1)` per ADR-0016
D5 T3 phase prose line 219) lives in `apps/site/src/styles/grid.css`
which is NOT modified in this PR (the CSS authority is already at
HEAD post C.2-3 squash `2586328`; the editor-shell side does NOT
duplicate the transition rule).

Specifically:

1. **NEW `packages/editor-shell/src/responsive-cols.ts`** (~120 LOC).
   Exports `useResponsiveCols` React hook + `UseResponsiveColsOptions`
   interface + `RESPONSIVE_BREAKPOINTS: { readonly tablet: 768;
   readonly desktop: 1024 }` const + `ViewportCols = 12 | 6 | 1` type
   alias. Hook signature:
   `useResponsiveCols(options?: UseResponsiveColsOptions): ViewportCols`.
   `UseResponsiveColsOptions = { onTransitionStart?: () => void;
   onTransitionEnd?: () => void }` — both callbacks optional; consumers
   that wire to `layoutReducer` invoke `dispatch({ type:
   'responsive-transition-start' })` from `onTransitionStart` and the
   end variant from `onTransitionEnd`. Implementation:

   - `useState` typed as `ViewportCols` with initial value derived from
     `window.matchMedia('(min-width: 1024px)').matches ? 12 : ...`
     via the helper `currentViewportCols(): ViewportCols` (pure
     function reading `window.innerWidth` falling back to 12 in SSR
     / `typeof window === 'undefined'`).
   - `useEffect` subscribes to TWO `matchMedia` listeners — one for
     `(min-width: 1024px)` (desktop boundary) and one for `(min-width:
     768px)` (tablet boundary). Combined, the 4-state space (true/true,
     false/true, false/false) maps deterministically to 12 / 6 / 1.
     The `(min-width: 1024px)` AND `(min-width: 768px)` truth table
     never produces (true, false) — that branch is a defensive
     `_unreachable` runtime check that returns `12` (defensive default).
   - On either listener fire, the handler:
     1. invokes `options.onTransitionStart?.()` (T0 detect phase per
        ADR-0016 D5 T0 line 215 — "matchMedia listener fires" verbatim);
     2. computes `nextCols = currentViewportCols()`;
     3. if `nextCols !== state` calls `setState(nextCols)` then
        schedules `setTimeout(() => options.onTransitionEnd?.(), 320)`
        per ADR-0016 D5 line 222 ("总转场预算 ≤ 320ms 内完成稳定过渡")
        — the 320ms timeout is the canonical T4 `rowSpan re-measure`
        phase boundary line 220; the timer ID is stored in a ref and
        cleared on re-fire (debounce) + on unmount.
   - Cleanup: removes both listeners on unmount; clears any pending
     transition-end timer.
   - SSR-safety: `if (typeof window === 'undefined') return 12 as
     ViewportCols;` early-exits the hook with the desktop default;
     no matchMedia subscription is attempted server-side.
   - File-head JSDoc cites ADR-0016 D5 verbatim 5-phase T0-T4
     transition table line 213-220 + 320ms total budget line 222 +
     mobile rowSpan='auto' rendering-derived rule line 226-231 +
     ADR-0017 D9 mobile 1-col view-only line 324-328 + ADR-0011 D9.1
     UI-touch path pattern.

2. **MODIFIED `packages/editor-shell/src/grid-container.tsx`** (~33 LOC
   → ~70 LOC; +37 LOC delta). Three additive changes; the existing
   pure-React-wrapper convention is preserved (no new useEffect /
   useState in the component itself; matchMedia subscription stays in
   `useResponsiveCols`).

   - `GridContainerProps` widens with `viewportCols?: 12 | 6 | 1`
     optional prop + JSDoc citing ADR-0016 D5 viewport-cols semantics
     + ADR-0017 D9 mobile 1-col view-only consumer guidance.
   - Component body branch: `const mobileClass = viewportCols === 1 ?
     ' skb-grid--mobile' : '';` appended to `gridClassName` (preserves
     existing `skb-grid` + optional caller `className` order:
     `skb-grid {caller} skb-grid--mobile`).
   - Component body branch: `const dataAttrs = viewportCols ?
     { 'data-skb-viewport-cols': viewportCols } : {};` spread into the
     emitted root `div` element so testing-library / Playwright selectors can
     query the current viewport (e.g., `[data-skb-viewport-cols="6"]`).
     When `viewportCols` is omitted (legacy callers OR consumers that
     don't yet wire the hook), no data-attr is emitted (zero-impact
     for existing call sites + zero-impact for the C.2-4 `GridContainer`
     callers that have not yet adopted the prop).
   - File-head JSDoc updated: keeps the existing "passive React wrapper"
     phrase + adds a sentence "When the optional `viewportCols` prop is
     supplied (sourced from `useResponsiveCols`), the container also
     emits the `.skb-grid--mobile` className per ADR-0017 D9 + the
     `data-skb-viewport-cols` data-attr per ADR-0016 D5 viewport-cols
     contract." Existing ADR-0016 D5/D8/D9/D11 cross-references stay.

3. **MODIFIED `packages/editor-shell/src/drag-drop/layout-reducer.ts`**
   (~70 LOC → ~95 LOC; +25 LOC delta). Two new variants added to the
   `LayoutAction` discriminated union; reducer body extended with two
   new switch cases.

   - `LayoutAction` adds:
     - `{ type: 'responsive-transition-start' }`
     - `{ type: 'responsive-transition-end' }`
   - Reducer body switch cases:
     - `case 'responsive-transition-start':` returns `{ ...state,
       responsiveTransition: 'in-progress' }` (epoch unchanged); idempotent
       (re-fire while already 'in-progress' is a no-op-equivalent
       reference-equal re-creation; vitest TC4.7 asserts).
     - `case 'responsive-transition-end':` returns `{ ...state,
       responsiveTransition: 'idle' }` (epoch unchanged); idempotent
       same way.
   - Existing 5 cases (drag-start through drag-end-mode-none) UNCHANGED;
     the C.2-8 `drag-start` rejection guard (`if (state.responsiveTransition
     === 'in-progress') return state;`) is preserved verbatim. The
     C.2-8 vitest TC4.6 ("responsive transition + drag conflict") which
     currently constructs the `responsiveTransition: 'in-progress'`
     state inline is preserved unchanged; C.2-9 adds TC4.7 + TC4.8
     exercising the new dispatcher path.
   - File-head JSDoc: existing "drag-end-success: epoch += 1 (one-shot
     N → N+1)" prose preserved; appends a sentence "responsive-transition-start
     / responsive-transition-end (per ADR-0016 D5 转场态 FSM): epoch
     unchanged, only mutate `responsiveTransition: 'idle' | 'in-progress'`
     state field; the existing drag-start rejection guard ensures
     drag-during-transition is silently no-op." Existing ADR-0017 D12 +
     ADR-0016 D12 Q12 absorbtion table cross-references stay.

4. **MODIFIED `packages/editor-shell/src/index.ts`** (barrel re-exports;
   ~31 LOC → ~36 LOC; +5 LOC delta). 3 NEW re-export lines added
   immediately after the existing `useAutoRowSpan` line:

   - `export { useResponsiveCols, RESPONSIVE_BREAKPOINTS } from './responsive-cols';`
   - `export type { UseResponsiveColsOptions, ViewportCols } from './responsive-cols';`

   Existing 28 export lines from C.2-1 through C.2-8 era are preserved
   verbatim (no regression on `EDGE_W` / `GAP` / `computeEdgeRects` /
   `tiebreak` / `findMatches` / `OutlineOverlay` / `ColRuler` /
   `SizeTooltip` / `colSpanToFraction` / `DropPulse` / `DragGhost` /
   `useEscCancel` / `layoutReducer` / `LayoutState` / `LayoutAction` /
   `GridSnapshot` / `GridContainer` / `GridContainerProps` /
   `useAutoRowSpan` / EditorShell / proseExtensions / save-adapter /
   saveLoad / registerBlocks / registerKernels surfaces; AC#10 guards).

5. **NEW `packages/editor-shell/src/__tests__/responsive-cols.test.ts`**
   (~120 LOC; 6 vitest cases per `## test_cases` Suite 1).

6. **MODIFIED `packages/editor-shell/src/__tests__/grid-container.test.tsx`**
   (~109 LOC → ~165 LOC; +56 LOC delta). 4 NEW test cases added to
   the existing 5 describe-block structure (per `## test_cases` Suite 2).

7. **MODIFIED `packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts`**
   (~6 cases → 8 cases; +30 LOC delta). 2 NEW test cases TC4.7 + TC4.8
   appended for the new responsive-transition-start / responsive-transition-end
   variants (per `## test_cases` Suite 3).

8. **MODIFIED `packages/editor-shell/CONTRACT.md`** (~395 LOC → ~430
   LOC; +35 LOC delta). Two surgical extensions per ADR-0016 §502 row
   4 sister-doc-sync requirement:

   - **Drag/Drop layer header rename** from `### Drag/Drop layer (C.2-5
     + C.2-8)` to `### Drag/Drop layer (C.2-5 + C.2-8 + C.2-9)` — same
     multi-PR contributor pattern that C.2-8 introduced; mirrors the
     existing `### Resize layer (C.2-6)` style. Inside the
     `layout-reducer.ts` bullet (line 220+ from C.2-8 squash `2cdcebb`)
     append: "C.2-9 extends `LayoutAction` with `responsive-transition-start`
     and `responsive-transition-end` variants; both flip the
     `responsiveTransition: 'idle' | 'in-progress'` state field with
     epoch unchanged. The pre-existing `drag-start` rejection guard is
     unchanged." 1-paragraph addition.
   - **NEW subsection `### Responsive viewport (C.2-9)`** appended after
     the `### Resize layer (C.2-6)` subsection (~line 290 post C.2-8
     squash) + before the `## Wave 3 Stage A expansion outline` section
     (line 293 post C.2-8). New section content:

     - `responsive-cols.ts` exports `useResponsiveCols`,
       `UseResponsiveColsOptions`, `RESPONSIVE_BREAKPOINTS`, and
       `ViewportCols`. Public Surface signature (parameters + return
       type) + ADR-0016 D5 + ADR-0017 D9 + ADR-0011 D9.1 cross-reference.
     - `GridContainer` widens with `viewportCols?: 12 | 6 | 1` optional
       prop. Public Surface contract: when `viewportCols === 1` the
       container emits `.skb-grid--mobile` className per ADR-0017 D9
       line 326; when `viewportCols` is supplied (any value) the
       container emits `data-skb-viewport-cols={viewportCols}` data-attr;
       when omitted, neither is emitted (zero-impact backward compat).
     - **rowSpan adapt path** prose: when `viewportCols === 1`, the
       editor-shell consumer is responsible for wiring `useAutoRowSpan`
       on every block (rowSpan='auto' rendering-derived per ADR-0016
       D5 line 226-231) — the persistent `rowSpan` integer is NOT
       mutated at storage; mobile preview-mode + desktop author-mode
       cognitive partition. Storage / rendering 不对称是 ADR-0016 D5
       D8 D11 联合 mandate; C.2-9 rowSpan adapt path is documented
       contract + the `useResponsiveCols` return value is the consumer
       branch trigger.
     - **`.skb-grid--mobile` CSS authority forward-pointer**: the
       className contract is the editor-shell Public Surface (this PR);
       the **CSS rules** under `.skb-grid--mobile` (`.gblock-handle.right`
       / `.bottom` / `.corner` `display: none` per ADR-0017 D9 line
       326 verbatim + drag-handle hide + col-ruler hide + size-tooltip
       hide) live at `apps/site/src/styles/grid.css` and land at
       **C.2-11** per Wave 5 plan v1.3 row C.2-11 line 692. C.2-9 ships
       the className contract; C.2-11 ships the CSS rules + the full
       Playwright resize/responsive scenarios that exercise both ends.
     - **`RESPONSIVE_BREAKPOINTS` design-tokens forward-pointer**: the
       hardcoded `{ tablet: 768, desktop: 1024 }` values in the C.2-9
       source are the intentional bridge per ADR-0018 D-list reservation
       (same pattern as C.2-8 `--accent-success`). Stage C.3-1 design-
       tokens PR lands `--bp-tablet: 768px` + `--bp-desktop: 1024px`
       CSS variables; the `responsive-cols.ts` source MAY be refactored
       at that PR to read the CSS-var-derived numeric values via
       `getComputedStyle(document.documentElement).getPropertyValue(...)`
       — non-blocking forward-pointer, NOT in C.2-9 scope.
     - **W5-2 invariant link**: the `useResponsiveCols` hook is the
       canonical source for viewport breakpoint state per ADR-0016 D5
       转场态 FSM; the hook's `onTransitionStart` / `onTransitionEnd`
       callbacks dispatch into the W5-2 `layoutReducer` single-source
       mutation pipeline ensuring drag-during-transition is silently
       rejected via the C.2-8 `drag-start` guard.
   - The existing C.2-4 forward-pointer paragraph (line 167+ "Cross-package
     consumer note: `BlockGridPosition` from `@skb/block-foundation`
     ...") is preserved unchanged.

9. **NEW `apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts`**
   (~60 LOC). Playwright spec covering the canonical e2e_smoke flow per
   the orchestrator-authored `## e2e_smoke` block. Spec body:

   - `test.describe('responsive FSM mount + viewport switch', ...)`
   - **NO** `test.skip(WSL2 ...)` block (post WSL2 deps install
     2026-05-06 per memory `feedback_wsl2_chromium_launch.md`
     SUPERSEDED + active.md standards-landing follow-up; PR #79
     squash `b2fdd8f` housekeeping pattern).
   - `test('responsive FSM mount + viewport switch', async ({ page }) => { ... })`
     Body:
     1. `await page.setViewportSize({ width: 1280, height: 800 })` (desktop
        baseline; matches `(min-width: 1024px)` so initial cols = 12).
     2. `await page.goto('/notes/sample-blocks/edit')` (rest-route from
        C.4-prelude squash `4f49be0`).
     3. Wait for editor mount root `[data-editor-shell-root]` (or the
        fallback `.editor-shell` selector chosen at exec time per
        C.2-8 spec) to be visible with a 5s timeout.
     4. Assert NO `pageerror` event mentions `responsive-cols` or
        `useResponsiveCols` (guards barrel/import-time bug; collector
        attached before `goto`).
     5. Resize the page to tablet width: `await page.setViewportSize({
        width: 900, height: 800 })` — matches `(min-width: 768px)`
        but not `(min-width: 1024px)` so cols = 6. Wait 400ms (above
        the 320ms FSM transition budget per ADR-0016 D5 line 222) for
        the `responsive-transition-end` callback to fire and steady
        state to settle.
     6. Re-assert the editor mount root is still visible (the FSM
        transition did not crash the editor; the `drag-start` rejection
        guard is irrelevant since no drag is active during the smoke,
        but the matchMedia subscription + setState path must not throw).
     7. Take screenshot to
        `docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png`
        per ADR-0011 D9.5 archive flow + the canonical
        `screenshot_archive` field. File MUST be ≥ 5 KB at ACCEPT
        (placeholder guard per `scripts/check-screenshot-archive.ts`).

   Spec is keyed on the canonical `test(...)` description string
   `"responsive FSM mount + viewport switch"` (matches the
   `playwright_spec` field's `:"…"` suffix in the `## e2e_smoke` block
   below) so `scripts/check-e2e-coverage.ts` resolves it.

10. **PR.md self-listed** per ADR-0006 D8 strict-whitelist.

The 8 `@skb/block-*` packages are NOT touched. `@skb/mdx-bridge` is NOT
touched. `@skb/heavy-block-boundary` is NOT touched. `@skb/design-tokens`
is NOT touched (the `--bp-tablet` / `--bp-desktop` token landing is
Stage C.3-1 scope per ADR-0018; v0.5 hardcoded numeric bridge is the
intentional bridge in this PR — same pattern as C.2-8 `--accent-success`).
`@skb/block-foundation` is NOT modified at the source level
(`effectiveColSnaps` / `effectiveCellHeight` / `effectiveColWidth` /
`DEFAULT_GRID_GEOMETRY` already exist; C.2-9 imports `effectiveColSnaps`
type-only inside test fixtures but does NOT re-export). `apps/site/src/
styles/grid.css` is NOT modified (the `.skb-grid--mobile` CSS rules land
at C.2-11 per Wave 5 plan v1.3 row C.2-11 line 692; C.2-9 ships only
the className contract from the editor-shell side).
`apps/site/src/components/EditorShellMount.{astro,tsx}` is NOT modified
(the FSM hook + GridContainer prop exist + are barrel-exported but are
NOT wired into the editor-scaffold UI in this PR; full integration
happens at C.4-2 per Wave 5 plan v1.3 row C.4-2 line 715). The
Playwright spec only asserts mount-without-crash + one viewport switch
— NOT actual responsive transition timing fixtures (12 viewport-switch
+ drag-during-transition scenarios deferred to C.2-11 per plan row 692).

LOCKED implementation path: **1 NEW source module** (responsive-cols) +
**MODIFIED grid-container** (+37 LOC; viewportCols prop + className +
data-attr) + **MODIFIED layout-reducer** (+25 LOC; 2 NEW action variants)
+ **1 NEW vitest test file** (responsive-cols.test.ts; 6 cases) +
**MODIFIED 2 existing vitest files** (grid-container.test.tsx +4 cases;
layout-reducer.test.ts +2 cases) + **MODIFIED barrel** (5 LOC) +
**MODIFIED CONTRACT.md sister-doc-sync** (+35 LOC; new subsection +
header rename) + **1 NEW Playwright smoke spec**. Path "ship the
`.skb-grid--mobile` CSS rules in `apps/site/src/styles/grid.css` here"
is **EXPLICITLY FORBIDDEN** per Out of scope row 1 + Wave 5 plan v1.3
row C.2-11 line 692 reservation. Path "ship the design-tokens
breakpoint vars in this PR" is **EXPLICITLY FORBIDDEN** per Out of
scope row 2 + ADR-0018 D-list reservation for Stage C.3-1. Path "wire
useResponsiveCols into EditorShellMount.tsx + ship full responsive
scenarios" is **EXPLICITLY FORBIDDEN** per Out of scope row 3 + Wave 5
plan v1.3 row C.4-2 + row C.2-11 reservation. Path "extract the FSM
state into a separate React context provider rather than a hook" is
**OUT OF SCOPE** — the hook pattern matches editor-shell convention
(`useAutoRowSpan` / `useEscCancel`) + C.2-8 PR #80 open question Q1
forward-pointed `useResponsiveCols` by name verbatim.

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

**Touchable whitelist: 9 entries** (codex-executor confines edits
strictly to these — per ADR-0006 D8 explicit-file-list discipline +
memory `feedback_git_operator_explicit_stage`). Stage-5 commit may add
audit logs (codex R1+ rounds + reviewer R1+ rounds) for a ~10-12-entry
total — see `## Codex commit (D1 stage 5) staging` block. NO change to
the 8 `@skb/block-*` packages. NO change to `@skb/mdx-bridge` /
`@skb/heavy-block-boundary` / `@skb/design-tokens` /
`@skb/block-foundation`. NO change to `apps/site/src/styles/grid.css`
(C.2-11 owns the `.skb-grid--mobile` CSS rules). NO change to
`apps/site/src/{islands,components,pages}/`.

1. `packages/editor-shell/src/responsive-cols.ts` (NEW; ~120 LOC; per
   ADR-0016 D5 转场态 FSM 5-phase + 320ms total budget + ADR-0017 D9
   mobile 1-col view-only)
2. `packages/editor-shell/src/grid-container.tsx` (MODIFIED;
   33 LOC → ~70 LOC; +37 LOC delta; `viewportCols?: 12 | 6 | 1` prop +
   `.skb-grid--mobile` className + `data-skb-viewport-cols` data-attr)
3. `packages/editor-shell/src/drag-drop/layout-reducer.ts` (MODIFIED;
   ~70 LOC → ~95 LOC; +25 LOC delta; 2 NEW action variants
   `responsive-transition-start` + `responsive-transition-end`)
4. `packages/editor-shell/src/__tests__/responsive-cols.test.ts` (NEW;
   ~120 LOC; 6 vitest cases per Suite 1)
5. `packages/editor-shell/src/__tests__/grid-container.test.tsx`
   (MODIFIED; ~109 LOC → ~165 LOC; +56 LOC delta; 4 NEW cases per
   Suite 2; existing 5 describe-blocks UNCHANGED)
6. `packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts`
   (MODIFIED; 2 NEW cases TC4.7 + TC4.8 per Suite 3; existing 6 cases
   UNCHANGED; +30 LOC delta)
7. `packages/editor-shell/src/index.ts` (MODIFIED; +5 LOC delta;
   barrel re-exports for the 3 new module surfaces)
8. `packages/editor-shell/CONTRACT.md` (MODIFIED; ~395 LOC → ~430 LOC;
   +35 LOC delta; sister-doc-sync per ADR-0016 §502 row 4; renames
   `### Drag/Drop layer (C.2-5 + C.2-8)` header to `(C.2-5 + C.2-8 +
   C.2-9)` + appends 1 paragraph inside the `layout-reducer.ts` bullet
   for the 2 new action variants + adds NEW `### Responsive viewport
   (C.2-9)` subsection covering `useResponsiveCols` + `GridContainer`
   `viewportCols` prop + `.skb-grid--mobile` className contract +
   rowSpan adapt forward-pointer + RESPONSIVE_BREAKPOINTS forward-
   pointer + W5-2 single-source mutation invariant link)
9. `apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts`
   (NEW; ~60 LOC; canonical Playwright smoke per orchestrator-authored
   `## e2e_smoke` block)
10. `docs/plans/wave-5-main/C.2-9-responsive-fsm.md` (this PR.md self)

**LOC budget**:

| Category | Files | LOC delta |
|---|---|---|
| Source module (1 NEW) | responsive-cols.ts | ~120 |
| Source modifications | grid-container.tsx +37; layout-reducer.ts +25 | ~62 |
| Vitest test file (1 NEW) | responsive-cols.test.ts | ~120 |
| Vitest test modifications | grid-container.test.tsx +56; layout-reducer.test.ts +30 | ~86 |
| Playwright smoke (1 NEW) | c2-9-responsive-fsm-mount.spec.ts | ~60 |
| Barrel re-exports | `index.ts` delta | ~5 |
| CONTRACT.md sister-doc-sync | `CONTRACT.md` delta | ~35 |
| PR.md self | this file | ~700-900 |
| **Total committed** | | **~1188-1388** |

**Source LOC envelope** (Wave 5 plan v1.3 row C.2-9 line 690 budget
~150 LOC source): the row 690 budget reads "~150 LOC" referring to the
new source module + modifications. C.2-9 source delta: 120 (new
responsive-cols.ts) + 37 (grid-container.tsx) + 25 (layout-reducer.ts)
= 182 LOC source. Slightly above the row 690 ~150 LOC estimate (~21%
over; under the R14 ≥15% threshold for `reframe`-class amendment per
v1.3 amendment §232 D12). The overage is from the FSM hook extraction
decision (which the briefing flagged as a tradeoff) + the 2 new
reducer action variants (which the row 690 didn't enumerate but are
required for W5-2 single-source compliance per C.2-8 PR #80 Q1). The
final source files are still well under all per-file size limits (200
LOC target / 300 LOC ESLint warn / 500 LOC hard fail): responsive-cols
~120, grid-container ~70, layout-reducer ~95.

Each NEW source file stays under 200 LOC target; the 3 MODIFIED source
files stay under 300 LOC ESLint warn after the delta. Final
`packages/editor-shell/src/index.ts` ~36 LOC; `CONTRACT.md` ~430 LOC
(under 500 LOC hard fail).

## test_cases

TDD-front authoritative list per ADR-0011 D1 stage 2 + memory
`feedback_codex_spark_lint_gap` — codex-generic-executor lands all NEW
+ MODIFIED vitest cases first (red), then the 2 source modifications
+ 1 new source module (green), then the Playwright spec. Verification:
`pnpm --filter @skb/editor-shell test` (vitest) + `pnpm --filter
@skb/site test:visual --grep 'responsive FSM mount'` (Playwright;
orchestrator self-serves on WSL2 post deps install).

### Suite 1: `packages/editor-shell/src/__tests__/responsive-cols.test.ts` (6 cases; ~120 LOC)

Uses vitest-environment `happy-dom` (existing config); `window.matchMedia`
mocked via `vi.stubGlobal('matchMedia', mockMatchMedia)` helper that
maps query strings to a `{ matches: boolean; addEventListener; removeEventListener }`
mock object. Hook under test rendered via `@testing-library/react`
`renderHook`.

1. **TC1.1 — desktop initial state returns 12**. Input: mock
   `matchMedia('(min-width: 1024px)').matches = true`; mock
   `(min-width: 768px).matches = true`; `renderHook(() =>
   useResponsiveCols())`. Expected: `result.current === 12`. Location:
   `responsive-cols.test.ts > initial > desktop returns 12`.

2. **TC1.2 — tablet initial state returns 6**. Input: mock
   `(min-width: 1024px).matches = false`; mock
   `(min-width: 768px).matches = true`. Expected: `result.current === 6`.
   Location: `responsive-cols.test.ts > initial > tablet returns 6`.

3. **TC1.3 — mobile initial state returns 1**. Input: mock
   `(min-width: 1024px).matches = false`; mock
   `(min-width: 768px).matches = false`. Expected: `result.current === 1`.
   Location: `responsive-cols.test.ts > initial > mobile returns 1`.

4. **TC1.4 — viewport change desktop → tablet fires onTransitionStart
   then onTransitionEnd after ≥ 320ms**. Input: start with desktop
   matches both queries; render hook with `onTransitionStart` +
   `onTransitionEnd` spies. Use vitest fake timers (`vi.useFakeTimers()`).
   Trigger the `(min-width: 1024px)` listener with `matches: false`
   (simulating viewport shrink to ≥ 768 < 1024). Expected: spy
   `onTransitionStart` invoked exactly once immediately; spy
   `onTransitionEnd` NOT invoked yet at t=0 + 100ms; spy
   `onTransitionEnd` invoked exactly once at t=320ms (advance fake
   timers via `vi.advanceTimersByTime(320)`). Result `result.current
   === 6` after the state update. Location:
   `responsive-cols.test.ts > transition > desktop to tablet fires
   start then 320ms-delayed end`.

5. **TC1.5 — RESPONSIVE_BREAKPOINTS values match ADR-0016 D5 prose**.
   Input: `import { RESPONSIVE_BREAKPOINTS } from '../responsive-cols'`.
   Expected: `RESPONSIVE_BREAKPOINTS.tablet === 768` (per ADR-0016 D5
   line 203 "768px-1024px (平板) 6 列"); `RESPONSIVE_BREAKPOINTS.desktop
   === 1024` (per ADR-0016 D5 line 202 "≥ 1024px (桌面) 12 列"). The
   const is `as const` (TypeScript readonly literal types). Location:
   `responsive-cols.test.ts > breakpoints > tablet 768 + desktop 1024`.

6. **TC1.6 — SSR-safety returns 12 default + does not subscribe**.
   Input: stub `window` to `undefined` via `vi.stubGlobal('window',
   undefined)` BEFORE `renderHook`. Expected: hook returns 12 (desktop
   default per file-head JSDoc + SSR-safety branch); no `matchMedia`
   call attempted (`mockMatchMedia` spy NOT invoked). Restore window
   stub via `vi.unstubAllGlobals()` in `afterEach`. Location:
   `responsive-cols.test.ts > SSR > returns 12 default no subscription`.

### Suite 2: `packages/editor-shell/src/__tests__/grid-container.test.tsx` (4 NEW cases on top of existing 5 describe-blocks; ~56 LOC delta)

Existing 5 describe-blocks (`renders` / `className prop` / `style prop`
/ `children` / `composes with Tiptap`) UNCHANGED. Append a 6th
describe-block:

1. **TC2.1 — `viewportCols={12}` emits `data-skb-viewport-cols="12"`
   data-attr without mobile className**. Input: `render(<GridContainer
   viewportCols={12}>x</GridContainer>)`. Expected: rendered root has
   `data-skb-viewport-cols` attribute equal to `"12"`; className equals
   exactly `"skb-grid"` (NO `skb-grid--mobile` for cols=12). Location:
   `grid-container.test.tsx > viewportCols > 12 emits data-attr no
   mobile class`.

2. **TC2.2 — `viewportCols={6}` emits `data-skb-viewport-cols="6"` no
   mobile className**. Input: `viewportCols={6}`. Expected: data-attr
   `"6"`; className exactly `"skb-grid"`. Location:
   `grid-container.test.tsx > viewportCols > 6 emits data-attr no
   mobile class`.

3. **TC2.3 — `viewportCols={1}` emits both data-attr AND `.skb-grid--mobile`
   className**. Input: `viewportCols={1}`. Expected: data-attr equal
   to `"1"`; className contains `"skb-grid"` AND
   `"skb-grid--mobile"` (single space separator; full string
   `"skb-grid skb-grid--mobile"` per ADR-0017 D9 line 326 className
   authority). When combined with caller `className="custom-x"`,
   final string `"skb-grid custom-x skb-grid--mobile"` (caller class
   precedes mobile class). Location:
   `grid-container.test.tsx > viewportCols > 1 emits mobile className`.

4. **TC2.4 — `viewportCols` omitted preserves zero-impact backward
   compat**. Input: `render` a `GridContainer` element with text child `x` (no
   viewportCols prop). Expected: rendered root has NO
   `data-skb-viewport-cols` attribute (`getAttribute` returns null);
   className equals `"skb-grid"` (existing TC `emits exactly skb-grid
   when className is omitted` UNCHANGED behavior is preserved). Location:
   `grid-container.test.tsx > viewportCols > omitted no data-attr no
   mobile class backward compat`.

### Suite 3: `packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts` (2 NEW cases on top of existing 6; ~30 LOC delta)

Existing 6 cases (TC4.1 drag-start through TC4.6 responsive transition
+ drag conflict) UNCHANGED. Append 2 new cases:

1. **TC4.7 — `responsive-transition-start` flips `responsiveTransition:
   'in-progress'` epoch unchanged**. Input: state `{ epoch: 5, snapshot:
   null, baseline: snapshotA }` (no `responsiveTransition` field — defaults
   undefined which behaves as 'idle'); action `{ type:
   'responsive-transition-start' }`. Expected: result `{ epoch: 5,
   snapshot: null, baseline: snapshotA, responsiveTransition:
   'in-progress' }` (epoch UNCHANGED at 5; the transition field flipped
   to `'in-progress'`). Re-firing the same action against the result
   returns reference-equal-or-shallow-equal state (idempotent). Location:
   `layout-reducer.test.ts > responsive > transition-start flips to
   in-progress epoch unchanged`.

2. **TC4.8 — `responsive-transition-end` flips back to `'idle'` epoch
   unchanged**. Input: state `{ epoch: 5, snapshot: null, baseline:
   snapshotA, responsiveTransition: 'in-progress' }`; action `{ type:
   'responsive-transition-end' }`. Expected: result `{ epoch: 5,
   snapshot: null, baseline: snapshotA, responsiveTransition: 'idle' }`
   (epoch UNCHANGED; transition flipped back). The pre-existing TC4.6
   ("responsive transition + drag conflict") behavior is preserved
   (drag-start during 'in-progress' returns reference-equal state)
   verified by re-running TC4.6 in this suite — vitest `describe.each`
   guard NOT required since TC4.6 is the canonical existing case.
   Location: `layout-reducer.test.ts > responsive > transition-end
   flips back to idle epoch unchanged`.

### Suite 4: `apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts` (1 Playwright case; ~60 LOC)

1. **TC4.1 — `"responsive FSM mount + viewport switch"`**. Input:
   set viewport to desktop 1280×800; navigate `/notes/sample-blocks/edit`;
   wait for editor mount root visible; resize viewport to tablet
   900×800; wait 400ms (above 320ms FSM transition budget). Expected:
   - editor mount root is visible at desktop start (editor scaffold
     mounted without crash on the new module barrel re-exports);
   - no `pageerror` event mentioning `responsive-cols` or
     `useResponsiveCols` (guards against import-time bugs in the barrel
     that would surface as `Uncaught TypeError` during module loading);
   - editor mount root REMAINS visible after the viewport resize (the
     FSM transition path did not crash the editor; matchMedia listener
     handler ran without throwing);
   - screenshot saved to
     `docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png`
     (≥ 5 KB at ACCEPT per `scripts/check-screenshot-archive.ts`).

   Note: this spec does NOT yet assert that `[data-skb-viewport-cols="6"]`
   appears on the grid container DOM after the resize because
   `EditorShellMount.{astro,tsx}` is NOT yet wired to consume the
   `useResponsiveCols` hook + pass `viewportCols` into the `GridContainer` element
   — that wiring lands at C.4-2 per Wave 5 plan v1.3 row C.4-2 line
   715. The spec asserts the editor scaffold survives viewport resize
   without crash, which is the C.2-9 mount-without-crash smoke scope.
   Full responsive transition fixtures (12 viewport-switch fixtures +
   drag-during-transition rejection assertion + 320ms timing budget
   verification) land at C.2-11 per Wave 5 plan v1.3 row C.2-11 line
   692. Location:
   `c2-9-responsive-fsm-mount.spec.ts > "responsive FSM mount +
   viewport switch"`.

**Suite total: 12 vitest (6 + 4 + 2) + 1 Playwright = 13 test cases
NEW or NEW-on-top-of-existing**. All MUST PASS at AC#3
(`pnpm --filter @skb/editor-shell test` exit 0) + AC#13 (Playwright
spec PASS locally on WSL2 post deps install + on CI Linux non-WSL).

## contracts_affected

- `packages/editor-shell/CONTRACT.md` — **MODIFIED**. Two surgical
  extensions:
  1. The existing `### Drag/Drop layer (C.2-5 + C.2-8)` header
     (line ~183 post C.2-8 squash `2cdcebb`) is renamed to
     `### Drag/Drop layer (C.2-5 + C.2-8 + C.2-9)` and the
     `layout-reducer.ts` bullet inside (line 220+ post C.2-8) is
     extended with 1 paragraph documenting the 2 NEW action variants
     (`responsive-transition-start` / `responsive-transition-end`) +
     the `responsiveTransition: 'idle' | 'in-progress'` field semantics
     + epoch unchanged on both variants.
  2. NEW `### Responsive viewport (C.2-9)` subsection appended after
     `### Resize layer (C.2-6)` (line ~290 post C.2-8) + before
     `## Wave 3 Stage A expansion outline` (line 293 post C.2-8). New
     section covers `useResponsiveCols` + `RESPONSIVE_BREAKPOINTS` +
     `ViewportCols` + `GridContainerProps.viewportCols` + the
     `.skb-grid--mobile` className contract + rowSpan adapt path
     forward-pointer + RESPONSIVE_BREAKPOINTS Stage C.3-1 design-tokens
     forward-pointer + W5-2 single-source mutation invariant link.

  D2 row 1 hit. Per ADR-0016 §502 row 4 sister-doc-sync —
  same-PR-with-implementation site for the C.2-9 NEW + MODIFIED Public
  Surface contract.

- `packages/block-foundation/CONTRACT.md` — **NOT** modified. The
  `effectiveColSnaps(viewportCols)` helper authority (W5-1 +
  ADR-0016 D6 Q4) was already authored at C.2-2 squash `b15ba24`;
  C.2-9 is a consumer-side type/value import only (the spec source
  imports `ViewportCols` from `@skb/editor-shell` not from
  block-foundation; the underlying numeric semantics for 12 / 6 / 1
  are aligned with `effectiveColSnaps` argument types per ADR-0016
  D6 Q4 absorbtion).

- `packages/heavy-block-boundary/CONTRACT.md` — **NOT** modified
  (C.2-7 squash `dd860b9` is the latest; v0.5 amendment + gridContext
  path unchanged; mobile rowSpan='auto' rendering-derived path is
  ADR-0016 D5 + the existing `useAutoRowSpan` hook from C.2-4 squash —
  no heavy-block-boundary delta).

- `apps/site/CONTRACT.md` — **NOT** modified. The `## Grid layout
  (Wave 5)` section + `/notes/[...slug]/edit` rest-route + EditorShellMount
  client-island (C.4-prelude squash `4f49be0`) are pre-existing
  surfaces; the new Playwright spec consumes the existing route +
  mount root selector but does NOT modify apps/site source or contract.

- `apps/site/src/styles/grid.css` — **NOT** modified. The
  `.skb-grid--mobile` CSS rules (`.gblock-handle.right` /
  `.bottom` / `.corner` `display: none` per ADR-0017 D9 line 326
  verbatim + drag-handle hide + col-ruler hide + size-tooltip hide) land
  at C.2-11 per Wave 5 plan v1.3 row C.2-11 line 692. C.2-9 emits the
  className from the editor-shell side; the CSS authority side of the
  selector contract lands at C.2-11.

- 8 `@skb/block-*` CONTRACT.md files — **NOT** modified.
  `@skb/mdx-bridge` / `@skb/design-tokens` CONTRACT.md — **NOT**
  modified.

D2 row 5 (cross-package boundary contract change) hit: editor-shell
exports 3 NEW surfaces (`useResponsiveCols`, `RESPONSIVE_BREAKPOINTS`,
`UseResponsiveColsOptions` + `ViewportCols` types, plus the widened
`GridContainerProps.viewportCols` prop, plus the 2 NEW LayoutAction
variants which are part of the existing barrel export of
`LayoutAction`) consumed across package boundary by future C.4-2
EditorShellMount enhancement + future C.2-11 Playwright resize/responsive
PR. Same escalation pattern as the C.2-8 Row 5 verdict for the same
editor-shell barrel surface widening; the prediction line at ADR-0017
line 450 + Q13 absorbtion verdict explicitly predicted Stage C.2
implementation PRs hitting Row 1 + Row 5; this PR is a Row 1 hit
(CONTRACT sync) plus a Row 5 hit (cross-package boundary surface
addition).

D2 row 4 NOT hit — no NEW ADR amendment is required. ADR-0016 D5 +
D12 + ADR-0017 D9 are already at lock since Pre-A2 + Pre-A3 (PR
squashes `6e2c1d9` + `157a4f7` per active.md Wave 5 PR roster).
ADR-0018 `--bp-tablet` + `--bp-desktop` token D-list entries are
already at lock since Pre-A4; the C.2-9 source consumes the hardcoded
numeric bridge + cites the Stage C.3-1 forward-pointer. Same pattern
as C.2-8 `--accent-success` token bridge.

PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES per Row 1 + Row 5.

## adr_touched

- **ADR-0016 grid 数据模型**: D5 (Responsive 桌面 12 / 平板 6 / 手机 1
  + 转场态 FSM 5-phase T0-T4 line 213-220 + 320ms total budget line
  222 + mobile rowSpan='auto' rendering-derived rule line 226-231) +
  D12 (Layout mutation 单一源 `layoutEpoch` reducer + 权威矩阵 line
  430+ "responsive wins") + §502 sister-doc-sync row 4 (editor-shell
  CONTRACT.md sync requirement) — **CONSUMED, NOT AMENDED**. The
  `useResponsiveCols` hook + `RESPONSIVE_BREAKPOINTS` const + the 2
  NEW LayoutAction variants (`responsive-transition-start` +
  `responsive-transition-end`) are the canonical realization of
  ADR-0016 D5 + D12. ADR-0016 §502 row 4 operationally satisfied
  (CONTRACT.md same-PR-with-implementation sync site).

- **ADR-0017 drag-drop UX**: D9 (col-ruler + size-tooltip; "Mobile
  1-col 路径全 view-only" line 324-328 — `.skb-grid--mobile` className
  authority line 326 + `effectiveCols === 1` 时 resize handles +
  col-ruler + size-tooltip + drag-ghost + outline overlay + drop-pulse +
  drag-handle 全 disabled per Q9 absorbtion) + D12 (layoutEpoch
  single-source mutation + Q12 absorbtion line 353+ — "responsive
  transition 期间 drag 拒绝" via the `drag-start` rejection guard
  shipped at C.2-8) — **CONSUMED, NOT AMENDED**. C.2-9 ships the
  `.skb-grid--mobile` className from the editor-shell side; the CSS
  rules side of the contract (`.gblock-handle.*` `display: none`)
  lands at C.2-11 per Wave 5 plan v1.3 row C.2-11.

- **ADR-0018 v2 visual migration**: `--bp-tablet` + `--bp-desktop`
  design-tokens D-list entries (Stage C.3-1 forward-pointer per ADR-0016
  D5 line 208 "design-tokens 包 (Stage C.3 ADR-0018) 暴露 breakpoint
  vars (`--bp-tablet: 768px`, `--bp-desktop: 1024px`)") — **CONSUMED
  via hardcoded numeric bridge**. The `RESPONSIVE_BREAKPOINTS = {
  tablet: 768, desktop: 1024 }` const in `responsive-cols.ts` is the
  ADR-0018-locked bridge: hardcoded numeric values now + design-tokens
  CSS variable definitions deferred to Stage C.3-1 per ADR-0018 D-list
  reservation. Same pattern as C.2-8 `--accent-success` token bridge.

- **ADR-0011** D1 (linear pipeline) + D2 (trigger schema) + D9
  (Product Experience Quality Gate) + D9.1 (path patterns) + D9.2
  (orchestrator-authored e2e_smoke for non-catalog ui_touch PRs) +
  D9.5 (screenshot archive flow) + D10 (anti-prompt-patching) —
  **operational enforcement, NOT amended**.

- **ADR-0006** D8 (explicit-file-list staging) + 8-point checklist +
  9th item (UI-touch + E2E spec) — **operational enforcement, NOT
  amended**.

- **Wave 5 plan v1.3 row C.2-9** (line 690 verbatim) — referenced as
  the canonical scope source per ADR-0011 D10 anti-prompt-patching
  (catalog wins over inline paraphrase). PR #75 squash `5bd5112`
  (Wave 5 plan v1.3 amendment) cited as the upstream enabling work;
  the v1.3 retrofit catalog (line 547+) annotated `ui_touch +
  e2e_smoke` only on C.2-7 + 5 C.3 + 5 C.4 PRs (NOT C.2-9) — per
  ADR-0011 D9.2 the orchestrator authors a fresh `e2e_smoke` block
  for the C.2-9 catalog gap (see briefing + `## e2e_smoke` block).

- **Wave 5 plan v1.3 row C.2-9 D2 annotation** — the row 690 D2 column
  reads "Standard". The locked design choice in this PR.md (extract
  FSM as separate `useResponsiveCols` hook + widen `GridContainerProps`
  with `viewportCols` prop + add 2 NEW LayoutAction variants) **fires
  Row 1 + Row 5** per ADR-0007 D2 row table. The "Standard" annotation
  is **superseded** by the locked design decision; orchestrator
  briefing flagged this ("BUT verify if GridContainerProps surface
  changes trigger Row 1 CONTRACT.md sync — pr-writer judgment call at
  PLAN"); pr-writer locks Row 1 + Row 5 here.

D2 row 4 NOT triggered — no NEW ADR amendment.

## acceptance

15 verifiable acceptance criteria. Each is a single shell command
producing an objectively checkable result. ACCEPT-stage pr-writer
(D1 stage 6) re-runs all 15 against the post-commit working tree.

### AC#1 — NEW source module exists at canonical path

```bash
ls packages/editor-shell/src/responsive-cols.ts | wc -l
```

Expected: `1`. Verifies the new source module exists on disk at the
canonical path declared in the Wave 5 plan v1.3 row C.2-9 whitelist
extension (the row 690 whitelist enumerated `grid-container.tsx (转场态
FSM)`; pr-writer locked the FSM extraction to a separate module per
editor-shell convention + C.2-8 PR #80 Q1 forward-pointer).

### AC#2 — barrel re-exports include the 3 new module surfaces + viewportCols prop type

```bash
grep -nE "from ['\"]\\./responsive-cols" packages/editor-shell/src/index.ts | wc -l
grep -nF 'useResponsiveCols' packages/editor-shell/src/index.ts | wc -l
grep -nF 'RESPONSIVE_BREAKPOINTS' packages/editor-shell/src/index.ts | wc -l
grep -nF 'ViewportCols' packages/editor-shell/src/index.ts | wc -l
```

Expected: each `≥ 1`. Verifies the 3 new module-level re-export
statements were added to the barrel. The grep on the relative path
form (`'./responsive-cols'`) is robust to whether the executor chose
`export { ... } from '...'` or `export * from '...'` shape.

### AC#3 — vitest 12 NEW cases PASS + existing editor-shell suites unchanged

```bash
pnpm --filter @skb/editor-shell test
```

Expected: exit 0; the post-run summary reports `Tests <N> passed
(<N>)` where N includes the 12 NEW cases (6 responsive-cols + 4
grid-container viewportCols + 2 layout-reducer responsive-transition)
on top of the existing C.2-1 through C.2-8 vitest count. Mechanical
guard for the 1 new test file:

```bash
ls packages/editor-shell/src/__tests__/responsive-cols.test.ts | wc -l
```

Expected: `1`. Verifies the NEW test file exists.

### AC#4 — `LayoutAction` discriminated union extended with 2 NEW variants

```bash
grep -nE "type: 'responsive-transition-start'" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
grep -nE "type: 'responsive-transition-end'" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
grep -nE "case 'responsive-transition-start':" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
grep -nE "case 'responsive-transition-end':" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
```

Expected: each `≥ 1` (the `type:` form appears in the discriminated
union declaration; the `case '...':` form appears in the reducer
body switch). Five-variant + two-new = seven-variant exhaustive switch
locks the reducer to ADR-0016 D5 + D12 spec. Vitest TC4.7-4.8 carry
the runtime semantic guarantee; the AC provides a structural guard.

### AC#5 — `RESPONSIVE_BREAKPOINTS` numeric values match ADR-0016 D5 prose

```bash
grep -nE 'tablet:\s*768' packages/editor-shell/src/responsive-cols.ts | wc -l
grep -nE 'desktop:\s*1024' packages/editor-shell/src/responsive-cols.ts | wc -l
grep -nF 'as const' packages/editor-shell/src/responsive-cols.ts | wc -l
```

Expected: each `≥ 1`. Verifies the verbatim numeric values from
ADR-0016 D5 line 202 (`≥ 1024px (桌面)`) + line 203 (`768px-1024px
(平板)`) + the `as const` readonly literal type assertion. The numeric
bridge to design-tokens lands at Stage C.3-1 per ADR-0018 forward-pointer.

### AC#6 — `GridContainer` widens with `viewportCols?: 12 | 6 | 1` prop + emits `.skb-grid--mobile` className when cols=1 + emits `data-skb-viewport-cols` data-attr

```bash
grep -nE "viewportCols\?:\s*(12 \| 6 \| 1|ViewportCols)" packages/editor-shell/src/grid-container.tsx | wc -l
grep -nF 'skb-grid--mobile' packages/editor-shell/src/grid-container.tsx | wc -l
grep -nF 'data-skb-viewport-cols' packages/editor-shell/src/grid-container.tsx | wc -l
```

Expected: each `≥ 1`. Verifies the prop signature widening + the
`.skb-grid--mobile` className emission per ADR-0017 D9 line 326 +
the `data-skb-viewport-cols` data-attr emission per ADR-0016 D5
viewport-cols contract. Vitest TC2.1-2.4 carry the runtime semantic
guarantee.

### AC#7 — `useResponsiveCols` hook subscribes to TWO matchMedia listeners (1024 + 768) + has SSR-safety branch

```bash
grep -nE 'matchMedia\([^)]*1024' packages/editor-shell/src/responsive-cols.ts | wc -l
grep -nE 'matchMedia\([^)]*768' packages/editor-shell/src/responsive-cols.ts | wc -l
grep -nE "typeof window === ['\"]undefined['\"]" packages/editor-shell/src/responsive-cols.ts | wc -l
```

Expected: each `≥ 1`. Verifies the dual-matchMedia subscription
pattern (4-state truth table → 12 / 6 / 1 mapping per ADR-0016 D5
line 202-204) + the SSR-safety early-return for `typeof window ===
'undefined'`. Vitest TC1.1-1.6 carry the runtime semantic guarantee
including the SSR branch.

### AC#8 — `CONTRACT.md` sister-doc-sync — header rename + new subsection + ADR cross-references

```bash
grep -nE '^### Drag/Drop layer \(C\.2-5 \+ C\.2-8 \+ C\.2-9\)' packages/editor-shell/CONTRACT.md | wc -l
grep -nE '^### Responsive viewport \(C\.2-9\)' packages/editor-shell/CONTRACT.md | wc -l
grep -nF 'useResponsiveCols' packages/editor-shell/CONTRACT.md | wc -l
grep -nF 'RESPONSIVE_BREAKPOINTS' packages/editor-shell/CONTRACT.md | wc -l
grep -nF 'skb-grid--mobile' packages/editor-shell/CONTRACT.md | wc -l
grep -nE 'ADR-0016 D5|ADR-0017 D9' packages/editor-shell/CONTRACT.md | wc -l
```

Expected: header rename `≥ 1`; new subsection header `≥ 1`; each
identifier `≥ 1`; ADR-0016 D5 / ADR-0017 D9 cross-references combined
`≥ 2`. Verifies the sister-doc-sync extension covers the renamed
Drag/Drop layer header + the new Responsive viewport subsection +
the 3 new identifier names + cross-references the 2 D-items.

### AC#9 — `pnpm exec tsx scripts/check-ui-touch.ts --files` (file list args) returns `ui_touch: true`

```bash
pnpm exec tsx scripts/check-ui-touch.ts --files \
  packages/editor-shell/src/responsive-cols.ts \
  packages/editor-shell/src/grid-container.tsx \
  packages/editor-shell/src/drag-drop/layout-reducer.ts \
  apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts
```

Expected: stdout contains `ui_touch: true` (path matches the D9.1
pattern `packages/editor-shell/src/**` AND `apps/site/src/__tests__/e2e/**`);
exit 0. Verifies the mechanical detection AGREES with the
orchestrator-authored `## ui_touch` block declaration. Verified at
PLAN-time on the whitelist files (mock dispatch returned `ui_touch=true`).

### AC#10 — `index.ts` preserves existing 28 exports (no regression)

```bash
grep -nE "export \{ EditorShell \} from './EditorShell'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ EDGE_W, GAP, computeEdgeRects \} from './drag-drop/edge-rects'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ tiebreak, findMatches \} from './drag-drop/tiebreak'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ OutlineOverlay \} from './drag-drop/outline-overlay'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ DropPulse, dropPulseClassName \} from './drag-drop/drop-pulse'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ DragGhost \} from './drag-drop/drag-ghost'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ useEscCancel \} from './drag-drop/esc-cancel'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ layoutReducer \} from './drag-drop/layout-reducer'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ ColRuler \} from './resize/col-ruler'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ SizeTooltip, colSpanToFraction \} from './resize/size-tooltip'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ GridContainer \} from './grid-container'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ useAutoRowSpan \} from './use-auto-row-span'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ proseExtensions \}" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ LocalStorageAdapter \}" packages/editor-shell/src/index.ts | wc -l
```

Expected: each `≥ 1`. Verifies no existing barrel export was
accidentally removed during the C.2-9 module additions. Mirrors
C.2-5 AC#8 + C.2-6 AC#10 + C.2-8 AC#10 regression-guard pattern.

### AC#11 — Playwright spec exists at canonical path + has the canonical test name

```bash
ls apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts | wc -l
grep -nF '"responsive FSM mount + viewport switch"' \
  apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts | wc -l
```

Expected: each `≥ 1`. Verifies the spec file exists + the canonical
test description string (matches the `playwright_spec` field's
`:"…"` suffix in the `## e2e_smoke` block) for
`scripts/check-e2e-coverage.ts` resolution.

### AC#12 — `pnpm check` clean (lint + typecheck + test + build + size)

```bash
pnpm check
```

Expected: exit 0. The full repo-wide gate: ESLint clean (no
`max-lines` warn at 300+ on any new or modified source file; per memory
`feedback_codex_spark_lint_gap` orchestrator runs lint independently
even though codex spark may report PASS without lint), `tsc --noEmit`
clean across all packages + apps/site, vitest 100% PASS, `astro build`
clean, `pnpm size-check` clean (no source file > 500 LOC). Mechanical
guard for the source size limit:

```bash
wc -l packages/editor-shell/src/responsive-cols.ts \
      packages/editor-shell/src/grid-container.tsx \
      packages/editor-shell/src/drag-drop/layout-reducer.ts
```

Expected: each value `< 300` (under the ESLint `max-lines` warn
threshold); `< 500` (under `pnpm size-check` hard fail). Target ~120
/ ~70 / ~95 LOC per the Specifically section roster.

### AC#13 — Playwright spec PASSES locally on WSL2 (orchestrator self-serves post deps install)

```bash
pnpm --filter @skb/site test:visual --grep 'responsive FSM mount'
```

Expected: exit 0. The spec runs end-to-end against an Astro dev server
(or built preview) on the orchestrator workstation — WSL2 chromium
deps installed 2026-05-06 (memory `feedback_wsl2_chromium_launch.md`
SUPERSEDED per active.md standards-landing follow-up #7); orchestrator
self-serves Playwright on every UI-touch PR from C.2-8 onwards (PR #79
housekeeping squash `b2fdd8f` stripped the WSL2 skip block; new specs
follow no-skip pattern). The spec also runs on CI (Linux non-WSL) via
the existing `visual-smoke` job in `.github/workflows/ci.yml`.

### AC#14 — screenshot archive at canonical path ≥ 5 KB

```bash
test -f docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png && \
  test "$(stat -c %s docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png)" -ge 5120
```

Expected: exit 0. Verifies the Playwright spec emitted a real
screenshot to the canonical archive path + the file is ≥ 5 KB
(placeholder guard per `scripts/check-screenshot-archive.ts` —
catches `Buffer.from('')` smoke-fail or 1×1 pixel PNG bypass attempts).
The 5120 byte threshold is the canonical 5 KB minimum codified at
PR #74 squash `2f67ef0` (standards landing).

### AC#15 — `scripts/check-e2e-coverage.ts` resolves the canonical e2e_smoke flow

```bash
pnpm exec tsx scripts/check-e2e-coverage.ts \
  docs/plans/wave-5-main/C.2-9-responsive-fsm.md
```

Expected: exit 0; stdout reports the `## e2e_smoke` block parsed
successfully + the `playwright_spec` field's
`apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts` path
exists on disk + the spec contains the canonical `test(...)`
description string `"responsive FSM mount + viewport switch"`. Verifies
the orchestrator-authored `## e2e_smoke` block satisfies the CI
`e2e-coverage-check` job per ADR-0011 D9 + PR #76 squash `ad42f71`
symmetric-skip fix.

## verification required

ACCEPT-stage pr-writer (D1 stage 6) re-runs all 15 ACs against the
post-commit working tree. The 7 mechanical greps (AC#1, #2, #4-7,
#10) + 1 file-existence check (AC#11 ls part) are 1-line bash; the
2 pnpm-driven gates (AC#3 + AC#12) run the full vitest + lint +
typecheck + build + size pipeline; AC#13 is the Playwright run on
WSL2; AC#14 + AC#15 are the screenshot archive + e2e-coverage gate
verification. AC#9 invokes the dedicated `check-ui-touch.ts` script
with explicit `--files` list (REVIEW-stage runnable per PR #74 squash
`2f67ef0` standards landing).

The Codex commit (D1 stage 5) staging block at the tail of this PR.md
provides the explicit-file-list staging command per ADR-0006 D8 +
memory `feedback_git_operator_explicit_stage` 4-step protocol
(`git reset HEAD` then `git add` with the explicit file list then
`git diff --cached --stat` verify count + scope → `git commit`).

## ui_touch

`true` (touches `packages/editor-shell/src/**` per ADR-0011 D9.1 path
pattern + `apps/site/src/__tests__/e2e/**` per the spec addition).

Mechanical detection via `pnpm exec tsx scripts/check-ui-touch.ts
--files <list>` (AC#9) AGREES with this catalog annotation. Verified
at PLAN time on the whitelist files (`packages/editor-shell/src/grid-container.tsx`
+ `packages/editor-shell/src/__tests__/grid-container.test.tsx`):
mock dispatch returned `[check-ui-touch] verdict: ui_touch=true`
matching the `^packages/editor-shell/src/` D9.1 pattern.

C.2-9 was NOT in the v1.3 retrofit catalog (which annotated only
C.2-7 + 5 C.3 + 5 C.4 rows per Wave 5 plan v1.3 line 547+ retrofit
catalog header); per ADR-0011 D9.2, the orchestrator authors a fresh
`e2e_smoke` block for newly-detected ui_touch PRs outside the catalog.
The block below is the orchestrator-authored canonical shape
(single-bullet-with-indented-continuation form per PR #78 reformat
lesson + bare paths without surrounding backticks per
`scripts/check-screenshot-archive.ts` parser shape). Same catalog-gap
handling as C.2-8 PR #80 squash `2cdcebb`.

## e2e_smoke

Orchestrator-authored canonical e2e_smoke entry per ADR-0011 D9.2
catalog-gap procedure (single-bullet-with-indented-keys to satisfy
`scripts/check-e2e-coverage.ts` parser; the script splits on
`^\s*-\s+(?=key:)` so `target_url`/`playwright_spec`/
`screenshot_archive` are continuation lines, not separate bullets;
values shipped without surrounding backticks so
`scripts/check-screenshot-archive.ts` regex `\S+` captures the bare
path):

- flow: editor scaffold mounts at /notes/sample-blocks/edit after responsive FSM hook + GridContainer viewportCols prop added; matchMedia subscription mounts without console error; one viewport resize from desktop 1280x800 to tablet 900x800 does NOT crash editor + does not break Tiptap selection (D5 transition FSM mount-without-crash smoke; C.2-11 owns full transition timing fixtures)
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts:"responsive FSM mount + viewport switch"
  screenshot_archive: docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png

## Plan-challenger absorbtion

NOT APPLICABLE for an implementation PR per ADR-0011 D7. The Wave 5
plan v1.3 row C.2-9 (line 690) + ADR-0016 D5 + D12 (with Q5 + Q9
absorbtion verdicts at lock-time per Pre-A2 R2) + ADR-0017 D9 + D12
(with Q9 + Q12 absorbtion verdicts per Pre-A3 R4) + ADR-0018
breakpoint-vars D-list entry (Pre-A4 lock) + ADR-0006 8-class audit
checklist + 9th item are the authoritative inputs. No plan-challenger
dispatch occurred at PLAN stage; the Wave 5 plan was already
plan-challenger-vetted at v1.3 amendment (4-row absorbtion per PR #75
squash `5bd5112`); ADR-0017 was plan-challenger-vetted at Pre-A3
(13-row absorbtion per PR #52 squash `157a4f7`); ADR-0016 was
plan-challenger-vetted at Pre-A2 (12-row absorbtion per PR #51 squash
`6e2c1d9`).

**Open questions surfaced during PLAN draft** (none blocking lock;
documented for orchestrator):

1. **FSM extraction: separate hook module vs inline GridContainer
   useEffect?** **Resolved**: separate hook module
   (`useResponsiveCols` in NEW `responsive-cols.ts`). Three
   reinforcing reasons: (a) C.2-8 PR #80 open question Q1 explicitly
   forward-pointed to a `useResponsiveCols` hook by name verbatim,
   establishing this as the prior-locked design intent; (b) editor-shell
   convention for global-resource subscriptions is the `useFoo()` hook
   pattern (see `useAutoRowSpan` for ResizeObserver, `useEscCancel`
   for global keydown); (c) keeping `GridContainer` a passive
   pure-React-wrapper preserves the W5-2 invariant prose (CONTRACT.md
   line 95+ "passive `div` ... does NOT walk the Tiptap document, mutate
   NodeView attrs"). The tradeoff (hook subscription is a side effect
   that runs in consumer scope, not GridContainer's) is mitigated by
   the `viewportCols` prop being optional — consumers that don't yet
   wire the hook get the existing zero-impact behavior. **NOT BLOCKING**
   — orchestrator may overrule but the convention is heavily anchored.

2. **FSM state shape: separate `responsive-transition-start` /
   `responsive-transition-end` action variants vs a single
   `responsive-transition` action with `phase: 'start' | 'end'` payload?**
   **Resolved**: 2 separate action variants. Two reasons: (a) the
   existing 5-variant `LayoutAction` discriminated union (drag-start
   through drag-end-mode-none) uses one variant per discrete action;
   adding a payload-discriminated variant breaks the established type
   shape; (b) the C.2-8 PR #80 Q1 forward-pointer named
   "`responsive-transition-start` / `responsive-transition-end` action"
   verbatim, establishing the prior-locked variant shape. The 2-variant
   shape costs +5 LOC vs 1 variant + payload but the type-narrowing
   ergonomics are clearly better (`switch (action.type)` exhaustiveness
   check covers both branches without a nested switch on phase).
   **NOT BLOCKING**.

3. **Mobile rowSpan adapt: ship the consumer wiring at
   EditorShellMount.tsx in this PR or defer to C.4-2?** **Resolved**:
   defer to C.4-2 per Wave 5 plan v1.3 row C.4-2 line 715 ("apps/site
   `/notes/[slug]/edit` route + `EditorShellMount` enhancement (full
   BlockRegistry/KernelRegistry wire-up; route already shipped at
   C.4-prelude as MVP scaffold per v1.2 R14 SECOND amendment)"). C.2-9
   ships the FSM hook + GridContainer prop + reducer transition variants
   + the documented contract for mobile rowSpan='auto' rendering-derived
   path; C.4-2 ships the actual wire-up of `useResponsiveCols` ↔
   GridContainer `viewportCols` prop ↔ per-block `useAutoRowSpan`
   branching. This keeps C.2-9 within the row 690 ~150 LOC source
   budget (within R14 ≥15% threshold for source overage) + avoids
   cross-package boundary creation outside locked plan (R14 row 4
   compliance). **NOT BLOCKING**.

4. **Should the Playwright spec assert
   `[data-skb-viewport-cols="6"]` appears on the grid container DOM
   after the resize?** **Resolved**: NO — the data-attr emission
   requires `EditorShellMount.{astro,tsx}` to consume the
   `useResponsiveCols` hook + pass `viewportCols` into
   the `GridContainer` element, which is C.4-2 scope (Q3 above). The C.2-9
   smoke spec asserts mount-without-crash + viewport-resize-without-crash
   only; the data-attr presence is a vitest TC2.1-2.3 contract
   (component-level rendering) + a future C.4-2 / C.2-11 Playwright
   integration assertion (mount-level rendering with the hook wired).
   **NOT BLOCKING**.

5. **Should the Playwright spec take the screenshot AT desktop start,
   AT tablet end, OR both?** **Resolved**: ONE screenshot taken AFTER
   the viewport resize (tablet steady state). Captures the post-FSM-
   transition state validating the editor scaffold survived the
   matchMedia subscription + setState path. A pre-resize screenshot
   would require a 2nd archive path + 2nd file-size guard, doubling
   the AC#14 surface for marginal coverage gain. The post-resize
   screenshot subsumes the pre-resize state (if pre-resize had crashed,
   post-resize would be missing the mount root selector and the spec
   would fail at step 6 before reaching the screenshot). Same pattern
   as C.2-8 PR #80 Q5 resolution. **NOT BLOCKING**.

6. **Should `RESPONSIVE_BREAKPOINTS` consume design-tokens CSS variables
   at runtime (read `getComputedStyle(document.documentElement)
   .getPropertyValue('--bp-tablet')`)?** **Resolved**: NO at this PR;
   hardcoded numeric bridge. ADR-0018 reserves `--bp-tablet` +
   `--bp-desktop` token landing for Stage C.3-1; the C.2-9 source
   uses the hardcoded `{ tablet: 768, desktop: 1024 }` const + cites
   the Stage C.3-1 forward-pointer in CONTRACT.md prose. Same pattern
   as C.2-8 `--accent-success` token bridge. The hardcoded numerics
   are byte-equal to ADR-0016 D5 line 202-203 prose so drift surface
   is single-source. **NOT BLOCKING**.

## ambiguity flagged

None blocking lock. The 6 open questions in `## Plan-challenger
absorbtion` above are all resolved in-line; orchestrator may overrule
Q1 (FSM hook vs inline) or Q2 (action variant shape) if the C.2-8
forward-pointer is read differently, but pr-writer's reading of "the
consumer hook (future `useResponsiveCols` in C.2-9 scope) which
dispatches a separate `responsive-transition-start` /
`responsive-transition-end` action" (C.2-8 PR #80 Q1 verbatim) is
that the hook + 2-variant shapes are pre-locked.

**Two forward-pointers flagged for orchestrator awareness**:

- **`.skb-grid--mobile` CSS rules land at C.2-11**. The C.2-9
  `GridContainer` emits the `.skb-grid--mobile` className when
  `viewportCols === 1`; the actual CSS rules under that selector
  (`display: none` on `.gblock-handle.right` / `.bottom` / `.corner`
  + drag-handle hide + col-ruler hide + size-tooltip hide per ADR-0017
  D9 line 326 verbatim) live at `apps/site/src/styles/grid.css`
  which is C.2-11 PR scope per Wave 5 plan v1.3 row C.2-11 line 692.
  Orchestrator may choose to ship the CSS rules in this PR if the
  user prefers a single-PR mobile path (out of scope per Wave 5 plan
  row 690 + row 692 split — split was the v1.0 lock decision
  acknowledging C.2-11's "playwright resize + responsive switch"
  scope owns the CSS rules + the Playwright fixtures together; pr-writer
  defers to that prior lock).

- **`--bp-tablet` / `--bp-desktop` design-tokens definition lands at
  Stage C.3-1 per ADR-0018**. The C.2-9 `responsive-cols.ts` consumes
  the hardcoded numeric values (`{ tablet: 768, desktop: 1024 }`) +
  cites the Stage C.3-1 forward-pointer in CONTRACT.md. Same pattern
  as C.2-8 `--accent-success` token bridge. When the C.3-1 token
  landing PR ships, the `RESPONSIVE_BREAKPOINTS` const MAY be
  refactored to read CSS-var-derived values at runtime — non-blocking
  forward-pointer, NOT in C.2-9 scope.

## R14 self-check

Standard 14-point pre-flight per Wave 5 plan v1.3 §232 D12 (R14
discipline 阈值: PR 总量变化 >15% / 新增高风险模块 ≥1 / 跨-package
边界 / 改成功标准 = `reframe`; 任务顺序 / 命名 / 测试补充 = `scope
refinement`).

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | PR scope ≤ Wave 5 plan v1.3 row C.2-9 LOC budget (~150 LOC source) | PASS WITH NOTE | Source delta ~182 LOC (~21% over row 690 ~150 LOC estimate); above the row-690 budget but explained by the FSM hook extraction decision (briefing flagged this as a tradeoff) + the 2 NEW action variants (W5-2 single-source compliance per C.2-8 PR #80 Q1 forward-pointer; not enumerated in row 690 but required). Per v1.3 amendment §232 D12 the 21% scope refinement is `scope refinement` class (not `reframe`); no plan amendment PR required; documented in `## files` LOC budget table. |
| 2 | Whitelist files match plan row whitelist | PASS WITH NOTE | Plan v1.3 row C.2-9 whitelist: `packages/editor-shell/src/grid-container.tsx (转场态 FSM)` + tests. Pr-writer locked extraction to NEW `responsive-cols.ts` per Q1 absorbtion; whitelist files 1 (NEW responsive-cols) + 2 (MODIFIED grid-container) jointly satisfy the plan row's "GridContainer FSM" intent. The 2 NEW action variants on `layout-reducer.ts` (whitelist file 3) are required per W5-2 single-source compliance + C.2-8 PR #80 Q1 forward-pointer. Per ADR-0011 D10 anti-prompt-patching this is consumer-side wire-up of an already-locked spec, NOT a plan reframe. |
| 3 | No NEW high-risk module ≥ 1 outside locked plan | PASS | All 4 changes (NEW responsive-cols + MODIFIED grid-container + MODIFIED layout-reducer + MODIFIED CONTRACT.md + 1 NEW Playwright spec) are inside `@skb/editor-shell` (locked Wave 5 package) or `apps/site/__tests__/e2e/` (locked Wave 5 test path); no new package added. |
| 4 | No cross-package boundary creation outside locked plan | PASS | editor-shell internal extension; consumer-side (apps/site / EditorShellMount / future C.4-2 mount) NOT touched in this PR; the `apps/site/src/__tests__/e2e/` Playwright spec addition is the same path pattern that C.2-7 + C.2-8 already established. |
| 5 | No success criteria modification | PASS | ACs 1-15 mechanical greps + pnpm check + Playwright run; no AC change to upstream ADRs (ADR-0016 + ADR-0017 + ADR-0018 D-items consumed at lock state). |
| 6 | TDD-front discipline | PASS | `## test_cases` Suites 1-3 enumerate 12 vitest cases authored RED before source; AC#3 mechanical guard verifies test files exist; codex executor follows red-green sequence per ADR-0011 D1 stage 2. |
| 7 | D2 trigger judgment locked at PLAN | PASS | Row 1 (CONTRACT.md sister-doc-sync) + Row 5 (cross-package boundary surface addition) FIRES; Row 4 (NEW ADR) DOES NOT fire; PRE-COMMIT CLAUDE REVIEW (D1 stage 4) MANDATORY per Row 1; the Wave 5 plan v1.3 row C.2-9 D2 column "Standard" annotation is **superseded** by the locked design choice; `## D2 trigger judgment` block documents the supersedure. |
| 8 | ui_touch + e2e_smoke present (per ADR-0011 D9 + 9th asymmetry item) | PASS | `## ui_touch: true` (mechanically verified at PLAN time + AC#9 re-runs at REVIEW + ACCEPT) + orchestrator-authored `## e2e_smoke` block (catalog-gap per D9.2; same pattern as C.2-8 PR #80). |
| 9 | Playwright spec exists + screenshot archive path declared | PASS | `apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts` (NEW) + `docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png` (canonical archive path). |
| 10 | Sister-doc-sync per ADR-0016 §502 row 4 | PASS | `packages/editor-shell/CONTRACT.md` MODIFIED at file 8 of whitelist; `### Drag/Drop layer` header rename + new `### Responsive viewport (C.2-9)` subsection; same-PR-with-implementation site. |
| 11 | Lychee link-check pre-empt | PASS | PR.md has no path-colon-line-number suffix references (memory `feedback_lychee_line_anchor`); no autolink-shaped angle-bracket-word in backticks (memory `feedback_lychee_autolink_in_backticks`); no `npmjs.com/package/...` direct URLs (memory `feedback_lychee_npmjs_403`); no `~/.claude/...` user-local paths in markdown link form (memory `feedback_lychee_user_local_paths`) — all forward-pointers use bare ADR / PR-squash refs. |
| 12 | No defer-chain (R14 first violation class) | PASS | All C.2-9 deliverables ship complete in this PR per their locked ADR-0016 D5 / D12 + ADR-0017 D9 / D12 specs; no "deferred to next PR" continuations except the explicit Out of scope items (`.skb-grid--mobile` CSS rules → C.2-11; design-tokens breakpoint vars → Stage C.3-1; full responsive transition fixtures → C.2-11; EditorShellMount wire-up → C.4-2) which are pre-existing plan-locked deferrals NOT new defer-chain links per memory `feedback_r14_defer_chain_plan_amendment`. |
| 13 | No standards-landing absorbtion (R14 third violation class) | PASS | C.2-9 consumes already-landed standards (D9 + D9.2 + 9th item + check-ui-touch.ts + check-e2e-coverage.ts + check-screenshot-archive.ts shipped at PR #74 squash `2f67ef0` + PR #76 squash `ad42f71`); NO new standards lift in this PR. |
| 14 | No gatekeeper-sequencing pushback (R14 second violation class) | PASS | C.2-9 is a continuation of Stage C.2 module sequence (C.2-1..C.2-8 already shipped); user gatekeeper authorized "Continue full C.2 sequence" per active.md "Post-C.2-8 branch decision" default. |

R14 mechanical hard-fail layer (per v1.1 amendment AC#13 + AC#14):

- **AC#13 (diff-only-N-docs check) NOT APPLICABLE**: this is an
  implementation PR, not a plan amendment PR; the diff-only docs
  hard-fail rule applies only to v1.X amendment PRs.
- **AC#14 (no implementation-string leak in non-PR.md files) NOT
  APPLICABLE**: same — this is implementation work, not plan amendment.
  The v1.1 + v1.2 + v1.3 PR.md amendment hard-fail patterns are
  forward-relevant for any future v1.4+ amendment.

R14 self-check verdict: ALL PASS (with 2 PASS-WITH-NOTE on row 1 +
row 2 documenting the 21% source overage + extraction-vs-modify
whitelist refinement, both `scope refinement` class per v1.3 amendment
§232 D12, NOT `reframe` class). PR.md ready for orchestrator lock +
EXECUTE dispatch.

## D2 trigger judgment

Per ADR-0007 D2 row table + Wave 5 plan v1.3 ROW gate rules, locked
at PLAN time by orchestrator. The Wave 5 plan v1.3 row C.2-9 D2
column reads "Standard"; the locked design choice in this PR.md
(extract FSM as separate `useResponsiveCols` hook + widen
`GridContainerProps` with `viewportCols` prop + add 2 NEW LayoutAction
variants) **fires Row 1 + Row 5** per ADR-0007 D2 row table. Orchestrator
briefing flagged this verdict ("BUT verify if GridContainerProps
surface changes trigger Row 1 CONTRACT.md sync — pr-writer judgment
call at PLAN"); pr-writer locks the supersedure here.

| Row | Trigger | Status | Reason |
|---|---|---|---|
| 1 | Contract change (any `@skb/...CONTRACT.md` per package) | FIRES | `packages/editor-shell/CONTRACT.md` MODIFIED — `### Drag/Drop layer` header renamed + NEW `### Responsive viewport (C.2-9)` subsection added per ADR-0016 §502 row 4 sister-doc-sync requirement; the Public Surface widens with 4 NEW identifiers (`useResponsiveCols`, `RESPONSIVE_BREAKPOINTS`, `UseResponsiveColsOptions`, `ViewportCols`) + `GridContainerProps.viewportCols` prop + 2 NEW LayoutAction variants. |
| 2 | Package add/remove | NOT FIRED | No new `@skb/...` workspace package added; no existing package removed. |
| 3 | Build/CI/deploy/auth/security | NOT FIRED | No `.github/workflows/*` change; no `auth/`/`secrets/` change; no deploy config change. |
| 4 | NEW ADR or substantive ADR amendment | NOT FIRED | ADR-0016 D5/D12 + ADR-0017 D9/D12 + ADR-0018 breakpoint-vars D-list entry already at lock since Pre-A2 + Pre-A3 + Pre-A4; C.2-9 is a consumer-side wire-up (no ADR delta). |
| 5 | Cross-package boundary contract change | FIRES | `@skb/editor-shell` exports 4 NEW surfaces (`useResponsiveCols`, `RESPONSIVE_BREAKPOINTS`, `UseResponsiveColsOptions`, `ViewportCols`) + the widened `GridContainerProps.viewportCols` prop + 2 NEW LayoutAction variants (`responsive-transition-start` + `responsive-transition-end`) consumed across package boundary by future C.4-2 EditorShellMount enhancement + future C.2-11 Playwright resize/responsive PR. Same escalation pattern as C.2-8 PR #80 Row 5 verdict. |
| 6 | Test contract / fixture format change | NOT FIRED | Vitest cases added; no test infrastructure / fixture format change; Playwright spec adds new test, not contract change. |
| 7 | Performance budget / SLO change | NOT FIRED | No perf budget delta (ADR-0017 AC#6 hit-test budget already at lock; C.2-9 modules don't touch hit-test path; the 320ms FSM transition budget per ADR-0016 D5 line 222 is consumed verbatim, not modified). |
| 8 | High-risk class (auth / security / payment / production) | NOT FIRED | Editor UX layer, no high-risk class. |
| 9 | Doc-only / typo / cosmetic | NOT THIS PR'S CLASS | Has source + test + spec deltas; not doc-only. |

**Verdict**: Row 1 FIRES + Row 5 FIRES + Row 4 DOES NOT FIRE. Wave 5
plan v1.3 row C.2-9 D2 column "Standard" annotation **superseded**
by locked design decision. Orchestrator briefing flagged this verdict
("BUT verify ... pr-writer judgment call at PLAN") — pr-writer locks
Row 1 + Row 5 here.

**PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** per Row 1
(CONTRACT.md sister-doc-sync). Row 5 strengthens stage 3 reviewer
scrutiny (cross-package boundary surface addition; reviewer must
verify ADR-0006 8-point checklist class 5 algorithm replication
guard + class 6 sister-doc-sync consistency + class 7 cross-package
consumer parity). Row 4 NOT triggered — orchestrator does NOT
dispatch a NEW ADR amendment review path.

**Stage 4 PRE-COMMIT CLAUDE REVIEW scope** (orchestrator self-runs
per ADR-0011 D1 stage 4):

1. ADR-0016 D5 + D12 prose vs `responsive-cols.ts` + `layout-reducer.ts`
   source byte-level alignment (5-phase T0-T4 transition table + 320ms
   total budget + 2 NEW action variants epoch unchanged + drag-start
   rejection guard preservation).
2. ADR-0017 D9 mobile 1-col view-only prose vs `grid-container.tsx`
   source `.skb-grid--mobile` className emission + the CONTRACT.md
   forward-pointer to C.2-11 for the CSS rules side.
3. `packages/editor-shell/CONTRACT.md` Drag/Drop layer header rename
   + new Responsive viewport subsection prose vs the 4 new identifier
   Public Surfaces (signature parity + ADR D-cite roster completeness).
4. ADR-0006 8-point asymmetry audit + 9th item (UI-touch + E2E spec)
   walk; class 5 algorithm replication (the dual-matchMedia subscription
   pattern is the single algorithmic source — verify no parallel
   re-impl at consumer site outside the hook).

## Risk register

5 risks identified. Rows ordered by mitigation cost (cheapest first).

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | C.4-2 EditorShellMount enhancement depends on these surfaces being correctly exported via barrel; barrel-export mistake silently breaks downstream consumer | medium | high | AC#2 (barrel re-export grep for the 3 NEW surfaces) + AC#10 (existing 28 exports preserved); reviewer ADR-0006 class 6 sister-doc-sync check at stage 3; codex spark reviewer R1 also exercises `pnpm --filter @skb/editor-shell test` which would surface a barrel typo as a test-file import failure. |
| 2 | `useResponsiveCols` matchMedia subscription leak on hook unmount (cleanup function does not remove both listeners) | medium | medium | Suite 1 vitest TC1.4 (transition fires onTransitionStart + onTransitionEnd at correct timing — relies on the listener firing at all, which a leaked subscription would also exercise) + reviewer ADR-0006 class 8 React-hook discipline check (verify both `mqDesktop.removeEventListener` + `mqTablet.removeEventListener` called in the `useEffect` return); the SSR-safety branch (TC1.6) ensures no subscription is attempted on the server. |
| 3 | layoutReducer 2 NEW action variant epoch unchanged drift (TC4.7-4.8 carry the runtime guarantee but file-head JSDoc + AC#4 case-keyword grep are the structural guards) | medium | high | AC#4 (5-variant + 2-NEW = 7-variant case keyword grep) + Suite 3 vitest TC4.7-4.8 (2 cases enforcing epoch unchanged on both new variants) + reviewer ADR-0006 class 5 algorithm replication guard; the existing TC4.6 `responsive transition + drag conflict` case is preserved unchanged ensuring the C.2-8 drag-start rejection guard remains active. |
| 4 | RESPONSIVE_BREAKPOINTS `tablet: 768` / `desktop: 1024` numeric drift from ADR-0016 D5 line 202-203 prose | low | medium | AC#5 (verbatim grep against `768` + `1024` numeric values + `as const` literal type assertion); single-source from ADR-0016 D5 prose; file-head JSDoc cites D5 verbatim + ADR-0018 forward-pointer; Stage C.3-1 token landing future-proofs the bridge. |
| 5 | matchMedia listener handler invokes `onTransitionStart` SYNCHRONOUSLY inside React render path causing setState-during-render warning | low | medium | TC1.4 fake-timer assertion path validates the 320ms-delayed `onTransitionEnd` fires correctly which exercises the queued microtask path; reviewer code-walk that the matchMedia handler invokes the callback inside a `setTimeout(0)` deferred microtask OR via `queueMicrotask()` if React 19 strict mode complaint surfaces — pr-writer's preferred shape is `setTimeout(0)` for symmetry with the 320ms `onTransitionEnd` path; codex executor at exec time may ship this differently if vitest TC1.4 fails on a strict-mode warning, in which case the resolution is a documented exec-time refinement. |

## Out of scope

Explicitly NOT in C.2-9 scope. Each item is a future PR or
deferred-to-Stage forward-pointer.

1. **`.skb-grid--mobile` CSS rules in `apps/site/src/styles/grid.css`**
   — deferred to **C.2-11 Playwright resize + responsive switch PR**
   per Wave 5 plan v1.3 row C.2-11 line 692. C.2-9 ships the className
   contract from the editor-shell side; C.2-11 ships the CSS rules
   (`display: none` on `.gblock-handle.right` / `.bottom` / `.corner` +
   drag-handle hide + col-ruler hide + size-tooltip hide per ADR-0017
   D9 line 326 verbatim) + the full Playwright resize/responsive
   scenarios that exercise both sides of the contract together.
2. **`--bp-tablet` + `--bp-desktop` design-tokens definition** —
   deferred to **Stage C.3-1 PR** per ADR-0018 D-list reservation.
   Hardcoded numeric bridge `{ tablet: 768, desktop: 1024 }` is the
   intentional bridge in `responsive-cols.ts`; the Stage C.3-1 token
   landing PR may optionally refactor `RESPONSIVE_BREAKPOINTS` to read
   CSS-var-derived numeric values via `getComputedStyle`. Same pattern
   as C.2-8 `--accent-success` token bridge.
3. **EditorShellMount.{astro,tsx} consumer wire-up of useResponsiveCols
   ↔ GridContainer viewportCols ↔ per-block useAutoRowSpan branching**
   — deferred to **C.4-2 PR** per Wave 5 plan v1.3 row C.4-2 line 715
   (`apps/site /notes/[slug]/edit route + EditorShellMount enhancement
   (full BlockRegistry/KernelRegistry wire-up)`).
4. **Full responsive transition Playwright fixtures (12 viewport-switch
   fixtures + drag-during-transition rejection assertion + 320ms timing
   budget verification)** — deferred to **C.2-11 PR** per Wave 5 plan
   v1.3 row C.2-11 line 692 (`playwright resize + responsive switch +
   rowSpan adapt (per ADR-0017 AC#10)`).
5. **Mobile rowSpan='auto' rendering-derived per-block wire-up** —
   the path is documented in CONTRACT.md prose; the actual wire-up
   (consumer detects `viewportCols === 1` then wires the existing
   `useAutoRowSpan` hook on every block in the editor scaffold) lands
   at C.4-2 per the same Wave 5 plan v1.3 row C.4-2 line 715. C.2-9
   ships the FSM hook + the documented contract; the consumer-site
   wire-up is C.4-2 scope.
6. **Touch / mobile drag (touchstart / touchmove / touchend)** —
   explicit OUT OF SCOPE per ADR-0017 Consequences line 411 + ADR-0017
   Q9 absorbtion (mobile 1-col path全 view-only); Wave 5 仅 desktop
   鼠标 drag.
7. **Multi-user CRDT/OT collaborative editing** — Phase 2+ ADR per
   ADR-0016 D12 line 434 (single-user single-session assumption);
   `layoutEpoch` is monotonic counter, NOT vector clock; the responsive
   transition is single-user single-session per the same assumption.
8. **`useDragActive()` consumer hook + Tiptap keymap consume
   `drag-active` flag wiring** — referenced at ADR-0017 D8 line 306;
   the C.2-8 `useEscCancel` hook accepts `dragActive: boolean` as a
   consumer-passed prop; the `useDragActive()` accessor + Tiptap
   keymap wiring lands at C.4 integration. C.2-9 does not modify this
   layer (no Esc / drag-cancel scope change).
9. **CSS responsive transition animation
   (`grid-template-columns 180ms cubic-bezier(.2,.7,.2,1)`)** — the
   180ms T3 phase animation per ADR-0016 D5 line 219 lives in
   `apps/site/src/styles/grid.css` and is already at HEAD post C.2-3
   squash `2586328`; C.2-9 does not duplicate the transition rule
   on the editor-shell side. The 320ms total budget consumed in the
   `useResponsiveCols` hook is the FULL transition budget (T0 + T1 +
   T2 + T3 + T4 = 0 + 16 + 16 + 180 + 320 - 212 ≈ 320ms total per
   ADR-0016 D5 line 222 verbatim).

## execution plan

orchestrator dispatches `codex exec --yolo --profile codex-generic-
executor` (per ADR-0007 D5 + ADR-0011 D6 — Wave 3 default executor;
~182 LOC source; under the heavy-execution threshold). audit log path:
`/tmp/codex-runs/2026-05-06-C.2-9-implementation.txt` raw +
`docs/audits/codex-runs/2026-05-06-C.2-9-implementation.txt` curated
archive (head -2000 OR R21 grep verdicts if log > 500 KB per memory
`feedback_codex_audit_log_recursion`).

Codex execution sequence (TDD-front per ADR-0011 D1 stage 2 + memory
`feedback_codex_spark_lint_gap`):

1. **TDD-red phase**: write the NEW
   `__tests__/responsive-cols.test.ts` file with all 6 cases per
   `## test_cases` Suite 1; append the 4 NEW cases to existing
   `__tests__/grid-container.test.tsx` per Suite 2; append the 2
   NEW cases TC4.7 + TC4.8 to existing
   `__tests__/drag-drop/layout-reducer.test.ts` per Suite 3. Confirm
   `pnpm --filter @skb/editor-shell test` fails on all 12 NEW cases
   (modules don't exist yet OR the 2 NEW reducer variants don't
   exist yet OR the GridContainer prop doesn't exist yet) + existing
   cases still pass.
2. **TDD-green phase, source modules**: write the NEW
   `src/responsive-cols.ts` source module with full implementation;
   modify `src/grid-container.tsx` with the +37 LOC delta;
   modify `src/drag-drop/layout-reducer.ts` with the +25 LOC delta.
   Confirm `pnpm --filter @skb/editor-shell test` PASSES all 12 NEW +
   all existing cases (target ALL GREEN).
3. **Barrel + CONTRACT sync**: append the 3 new export blocks to
   `packages/editor-shell/src/index.ts`; rename the
   `### Drag/Drop layer (C.2-5 + C.2-8)` header to `(C.2-5 + C.2-8 +
   C.2-9)` + extend the `layout-reducer.ts` bullet inside with 1
   paragraph; append NEW `### Responsive viewport (C.2-9)` subsection
   to `packages/editor-shell/CONTRACT.md`. Re-run `pnpm --filter
   @skb/editor-shell test` to confirm no regression.
4. **Playwright spec**: write
   `apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts` with
   the 1 canonical case. Confirm `pnpm --filter @skb/site test:visual
   --grep 'responsive FSM mount'` PASSES on WSL2 (orchestrator
   self-serves post deps install) + emits the screenshot to
   `docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png`
   (≥ 5 KB).
5. **Repo-wide gate**: `pnpm check` clean (lint + typecheck + test +
   build + size). `pnpm exec tsx scripts/check-ui-touch.ts --files
   <list>` returns `ui_touch: true`. `pnpm exec tsx
   scripts/check-e2e-coverage.ts <PR.md path>` parses + resolves the
   `## e2e_smoke` block.
6. **PR.md self-update if needed**: any scope refinement at execution
   time (e.g., minor LOC budget shift, additional test case for an
   ADR-0006 reviewer surface) is a PR.md `## files` whitelist
   amendment with `## R14 self-check` row 4 (no cross-package
   boundary creation) re-validated.

Reviewer dispatch at D1 stage 3: `codex exec --yolo --profile
codex-pr-reviewer-55 ...` per ADR-0011 D1 stage 3 + ADR-0006 8-point +
9th item walk. Reviewer feedback rounds R1 + R2 + ... until PASS (or
PASS-WITH-RESIDUE if minor non-blocking residue). PRE-COMMIT CLAUDE
REVIEW (D1 stage 4) MANDATORY per `## D2 trigger judgment` Row 1 +
Row 5; orchestrator self-runs the 4-step scope walk in `## D2 trigger
judgment` block above.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging discipline + memory
`feedback_git_operator_explicit_stage` 4-step protocol:

```bash
# Step 1: clean staging area
git -C /home/weiyi/selfKnowledgeBaseWeb reset HEAD

# Step 2: explicit-file-list add (10 PR.md whitelist + audit logs + screenshot)
git -C /home/weiyi/selfKnowledgeBaseWeb add \
  packages/editor-shell/src/responsive-cols.ts \
  packages/editor-shell/src/grid-container.tsx \
  packages/editor-shell/src/drag-drop/layout-reducer.ts \
  packages/editor-shell/src/__tests__/responsive-cols.test.ts \
  packages/editor-shell/src/__tests__/grid-container.test.tsx \
  packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts \
  packages/editor-shell/src/index.ts \
  packages/editor-shell/CONTRACT.md \
  apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts \
  docs/plans/wave-5-main/C.2-9-responsive-fsm.md \
  docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png \
  docs/audits/codex-runs/2026-05-06-C.2-9-implementation.txt

# Step 3: verify staging count + scope
git -C /home/weiyi/selfKnowledgeBaseWeb diff --cached --stat | tail -20

# Expected output: 12 entries staged (10 PR.md whitelist + 1 screenshot
# + 1 audit log) all paths under packages/editor-shell/,
# apps/site/src/__tests__/e2e/, docs/plans/wave-5-main/,
# docs/audits/screenshots/, docs/audits/codex-runs/.
# NO unrelated lockfile churn (verify via second grep)

git -C /home/weiyi/selfKnowledgeBaseWeb diff --cached --stat \
  | grep -E '^ pnpm-lock\.yaml' | wc -l
# Expected: 0 (no pnpm-lock churn since no package.json change)

# Step 4: commit
git -C /home/weiyi/selfKnowledgeBaseWeb commit -m "$(cat <<'EOF'
feat(editor-shell): C.2-9 responsive FSM hook + GridContainer viewportCols + reducer transition variants

Land useResponsiveCols hook + RESPONSIVE_BREAKPOINTS const + ViewportCols
type in NEW packages/editor-shell/src/responsive-cols.ts per ADR-0016 D5
转场态 FSM (5-phase T0-T4 + 320ms total budget). Widen GridContainerProps
with optional viewportCols?: 12 | 6 | 1 prop emitting .skb-grid--mobile
className + data-skb-viewport-cols data-attr per ADR-0017 D9 mobile
1-col view-only authority. Extend LayoutAction with 2 NEW variants
(responsive-transition-start + responsive-transition-end) flipping the
responsiveTransition: 'idle' | 'in-progress' field; pre-existing
drag-start rejection guard preserved per ADR-0016 D12 conflict
arbitration.

Sister-doc-sync editor-shell CONTRACT.md per ADR-0016 §502 row 4 —
Drag/Drop layer header rename (C.2-5 + C.2-8 + C.2-9) + NEW
Responsive viewport (C.2-9) subsection. Playwright smoke at
apps/site/src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts validates
editor scaffold mounts after FSM hook added + viewport resize 1280→900
does not crash editor. 12 vitest + 1 Playwright = 13 cases all PASS.

Per Wave 5 plan v1.3 row C.2-9 line 690; D2 row 1 + row 5 fire (Wave 5
plan v1.3 D2 column "Standard" superseded by locked design choice);
PRE-COMMIT CLAUDE REVIEW (D1 stage 4) PASSED.

Wave 5 Stage C.2 10 of 13 implementation PRs (post C.2-8 squash 2cdcebb).
EOF
)"

# Post-commit verification
git -C /home/weiyi/selfKnowledgeBaseWeb log --oneline -1
git -C /home/weiyi/selfKnowledgeBaseWeb status --short
```

Expected stage-5 stats:
- 12 files staged (10 PR.md whitelist + 1 screenshot + 1 audit log)
- 0 pnpm-lock.yaml churn
- exit code 0 on each step
- post-commit `git status` clean (no unstaged tracked changes)

Reviewer codex (D1 stage 5) executes the above bash in its workspace +
pushes to the PR branch `wave-5-c.2-9-responsive-fsm`. ACCEPT-stage
pr-writer (D1 stage 6) re-verifies all 15 ACs against post-push HEAD;
on PASS the orchestrator merges via `gh pr merge --squash --delete-branch`
per memory `feedback_wave3_auto_merge`.

## Related

- [Wave 5 plan v1.3](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — row C.2-9 line 690 (canonical scope source); v1.3 retrofit catalog (line 547+) does NOT cover C.2-9 → orchestrator-authored e2e_smoke per ADR-0011 D9.2; row 690 D2 column "Standard" superseded by locked design choice (Row 1 + Row 5 fire)
- [ADR-0016 grid 数据模型](../../decisions/ADR-0016-grid-data-model.md) — D5 (Responsive 桌面 12 / 平板 6 / 手机 1 + 转场态 FSM 5-phase T0-T4 line 213-220 + 320ms total budget line 222 + mobile rowSpan='auto' rendering-derived rule line 226-231) + D12 (Layout mutation 单一源 layoutEpoch reducer + 权威矩阵 line 430+ "responsive wins") + §502 sister-doc-sync row 4; CONSUMED, NOT amended
- [ADR-0017 drag-drop UX](../../decisions/ADR-0017-drag-drop-ux.md) — D9 (col-ruler + size-tooltip; "Mobile 1-col 路径全 view-only" line 324-328 — .skb-grid--mobile className authority line 326 + Q9 absorbtion) + D12 (layoutEpoch single-source mutation + Q12 absorbtion); CONSUMED, NOT amended
- [ADR-0018 v2 视觉 migration](../../decisions/ADR-0018-v2-visual-migration.md) — `--bp-tablet` + `--bp-desktop` design-tokens D-list entries (Stage C.3-1 forward-pointer per ADR-0016 D5 line 208); CONSUMED via hardcoded numeric bridge
- [ADR-0011 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — D1 stage 1-6 + D2 row 1 + row 5 fire + D9 Product Experience Quality Gate + D9.1 path patterns + D9.2 catalog-gap orchestrator authoring + D9.5 screenshot archive flow + D10 anti-prompt-patching
- [ADR-0006 asymmetry audit checklist](../../decisions/ADR-0006-asymmetry-audit-checklist.md) — 8-point (class 5 algorithm replication + class 6 sister-doc-sync + class 7 cross-package consumer parity + class 8 React-hook discipline) + 9th item (UI-touch + E2E spec) + D8 explicit-file-list staging
- [C.2-4 PR.md (editor-shell grid + useAutoRowSpan)](C.2-4-editor-shell-grid.md) — established the GridContainer + useAutoRowSpan pattern that C.2-9 builds on (the FSM hook is the third hook in this convention after useAutoRowSpan + useEscCancel)
- [C.2-5 PR.md (drag/drop UX 3 modules)](C.2-5-drag-drop-ux.md) — squash `2df71b6`; lower-half drag-drop primitives
- [C.2-6 PR.md (resize UX 2 modules)](C.2-6-resize-ux.md) — squash `2fb7900`; the resize layer ColRuler / SizeTooltip already returns null for `totalCols === 1` mobile path per ADR-0017 D9 — the C.2-9 `.skb-grid--mobile` className addition complements the C.2-6 component-side null guard with a CSS-side selector authority forward-pointer
- [C.2-7 PR.md (ADR-0014 v0.5 amendment)](C.2-7-adr-0014-v0.5-amendment.md) — squash `dd860b9`; FIRST UI-touch PR through D9 + 9th-item gate; canonical e2e_smoke + ui_touch block formatting precedent
- [C.2-8 PR.md (drop-pulse + drag-ghost + Esc cancel + layoutEpoch reducer)](C.2-8-drop-pulse-drag-ghost-esc-layoutEpoch.md) — squash `2cdcebb`; shipped the LayoutAction discriminated union + drag-start rejection guard for `responsiveTransition: 'in-progress'` that C.2-9 builds on; PR #80 open question Q1 forward-pointed `useResponsiveCols` hook by name verbatim establishing prior-locked design intent for C.2-9
- [C.4-prelude PR.md (minimal editor scaffold)](C.4-prelude-editor-scaffold.md) — squash `4f49be0`; provides the `/notes/[...slug]/edit` rest-route + EditorShellMount client-island that the C.2-9 Playwright smoke spec targets
- [Wave 5 plan v1.3 amendment PR.md](v1.3-plan-amendment-r14-third.md) — PR #75 squash `5bd5112`; landed the standards retrofit catalog (canonical e2e_smoke shape) + the C.2-9 row whitelist
