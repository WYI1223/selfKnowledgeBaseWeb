# C.2-8 — drop-pulse 720ms + drag-ghost + 全局 Esc cancel + layoutEpoch reducer

> **Wave 5 Stage C.2 9th implementation PR** of the locked 13-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.3 row C.2-8 line 689). Lands the
> **4 NEW editor-shell drag-drop modules** that complete ADR-0017 D8
> (全局 Esc cancel) + D10 (drag-ghost cursor 跟随 + per-kind 着色) + D11
> (drop-pulse 720ms token-driven `--accent-success`) + D12 (layoutEpoch
> single-source mutation per Q12 absorbtion table). C.2-1 through C.2-7
> all merged on main; C.2-5 (drag/drop UX 3 modules — `edge-rects.ts`,
> `tiebreak.ts`, `outline-overlay.tsx`; squash `2df71b6`) + C.2-6 (resize
> UX 2 modules — `col-ruler.tsx`, `size-tooltip.tsx`; squash `2fb7900`)
> shipped the lower-half drag-drop primitives. C.2-7 (squash `dd860b9`)
> shipped ADR-0014 v0.5 amendment + the FIRST UI-touch PR through the
> ADR-0011 D9 + ADR-0006 9th-item Product Experience Quality Gate end
> to end. C.2-8 wires the **upper half of ADR-0017 D-list** — the
> visual reflection layer (drag-ghost + drop-pulse) + the global
> keyboard cancel handler + the canonical `layoutReducer` /
> `layoutEpoch` mutation pipeline — completing the editor-shell
> drag-drop public surface that downstream C.2-10 Playwright drag
> scenarios + future C.4 editor-scaffold integration consume.
>
> **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger
> judgment` (Row 1 — `packages/editor-shell/CONTRACT.md` sister-doc-sync
> per ADR-0016 §502 row 4 + Row 5 — cross-package boundary contract
> change since the editor-shell barrel now exports 4 NEW module
> surfaces consumed by future C.2-10 Playwright drag scenarios + future
> apps/site editor scaffold integration; same escalation pattern as the
> Pre-A3 ADR-0017 Q13 absorbtion + Pre-A2 ADR-0016 Q12 absorbtion
> "Stage C.2 D2 row 1 escalation note" prediction).
>
> **First UI-touch PR landed after WSL2 chromium deps install** (memory
> `feedback_wsl2_chromium_launch.md` SUPERSEDED 2026-05-06 per active.md
> standards-landing follow-up #7); orchestrator self-serves Playwright
> on this PR + every future UI-touch PR. New Playwright specs do NOT
> include the `test.skip(WSL2 ...)` block (PR #79 housekeeping stripped
> the skip from C.2-7 spec; new specs follow the no-skip pattern).

## title

Land the 4 NEW editor-shell drag-drop modules under
`packages/editor-shell/src/drag-drop/` — `drop-pulse.ts` (per ADR-0017
D11; 720ms `box-shadow` halo animation consuming the
`var(--accent-success, oklch(70% 0.12 145 / 0.5))` token with hex
fallback per ADR-0018), `drag-ghost.ts` (per ADR-0017 D10;
`position: fixed` + `transform: translate + rotate(-1.5deg)` baseline
+ per-kind `.ghost-canvas` / `.ghost-runnable` / `.ghost-image` /
`.ghost-markdown` className + cursor-velocity-driven ±5° rotation
feedback at velocity ≥ 5px/frame), `esc-cancel.ts` (per ADR-0017 D8 +
Q8 absorbtion priority table; global keydown subscriber that calls
`preventDefault()` + `stopPropagation()` ONLY when `dragActive === true`
and dispatches a `drag-cancel` source layoutAction; restores prior
focus on drag-end; native Esc passthrough when no drag is active),
and `layout-reducer.ts` (per ADR-0017 D12 + ADR-0016 D12; the single
authoritative `layoutReducer(state, action)` pipeline implementing
the Q12 absorbtion epoch table — drag-start / drag-over: epoch
unchanged + S0 saved; drag-end-success: `epoch += 1` one-shot + new
S1 baseline; drag-end-cancel + drag-end-mode-none: epoch unchanged +
rollback to S0). Wire all 4 surfaces through the editor-shell barrel
`packages/editor-shell/src/index.ts`. Sync the sister-doc
`packages/editor-shell/CONTRACT.md` `### Drag/Drop layer` subsection
(line 182+ from C.2-5 squash `2df71b6`) with module-by-module Public
Surface description + ADR-0017 D8 / D10 / D11 / D12 + ADR-0016 D12
cross-references. Land canonical Playwright spec at
`apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts`
covering "editor scaffold mounts at /notes/sample-blocks/edit after
drag-modules added; Esc with no drag-active does NOT crash editor +
does not break Tiptap selection (D8 native pass-through priority)"
per ADR-0011 D9 Product Experience Quality Gate + the canonical
orchestrator-authored `e2e_smoke` block in this PR.md (this row was
NOT in the v1.3 retrofit catalog because that catalog only annotated
C.2-7 + 5 C.3 + 5 C.4 rows; per ADR-0011 D9.2 the orchestrator
authors the `e2e_smoke` block fresh for newly-detected ui_touch PRs
outside the catalog).

Specifically:

1. **NEW `packages/editor-shell/src/drag-drop/drop-pulse.ts`** (~80 LOC).
   Exports `dropPulseClassName: string` + `DropPulse` React component
   (function-component returning a div overlay positioned over
   the dropped block via `position: absolute` + `inset: 0`). The
   720ms halo animation is emitted via inline style
   `box-shadow: 0 0 0 4px var(--accent-success, oklch(70% 0.12 145 / 0.5))`
   + a paired CSS keyframe `@keyframes skb-drop-pulse-fadeout {
   from { box-shadow: 0 0 0 4px ...; opacity: 1 } to { box-shadow:
   0 0 0 4px transparent; opacity: 0 } }` with `animation:
   skb-drop-pulse-fadeout 720ms ease-out forwards`. Component prop
   `onAnimationEnd?: () => void` for consumer hooks (parent unmount
   the overlay after the animation ends; the component does NOT
   self-unmount). File-head JSDoc cites ADR-0017 D11 verbatim duration
   `720ms` + ADR-0018 `--accent-success` token authority + the
   D11 explicit non-trigger rule (drop-pulse NOT fired on drag-cancel
   per D11 trailing prose line 351 + per Q11 absorbtion). The fallback
   hex `oklch(70% 0.12 145 / 0.5)` is the Stage C.3 bridge value cited
   in the file-head JSDoc with a forward-pointer to the
   `--accent-success` token landing PR (Stage C.3-1 candidate).

2. **NEW `packages/editor-shell/src/drag-drop/drag-ghost.ts`**
   (~120 LOC). Exports `DragGhost` React component + `DragGhostProps`
   interface + `GhostKind = 'canvas' | 'runnable' | 'image' | 'markdown'`
   union (per ADR-0017 D10 four-kind classification, NOT BlockKind
   per memory `feedback_pr_reviewer_authority_at_head` — the ghost-
   coloring channel is a UX classification by gridKind label per
   Q10 absorbtion, NOT a forced BlockUIDefinition path). Component
   props: `cursorX: number`, `cursorY: number`, `kind: GhostKind`,
   `mode: 'create' | 'move'` (palette-drag-out emits `'create'` glyph
   `+ ◇`; existing-block-drag emits `'move'` glyph `⤴ ◇` per D10
   prose), `velocity?: { dx: number; dy: number }` (per ADR-0017 D10
   trailing prose: `velocity ≥ 5px/frame` triggers `±5°` rotation
   feedback; magnitude computed as `Math.hypot(dx, dy)`). Render
   path: `<div class="drag-ghost ghost-{kind}" style={{ position:
   'fixed', left: `${cursorX}px`, top: `${cursorY}px`, transform:
   `translate(0, 0) rotate(${baseRotationDeg}deg)`, pointerEvents:
   'none' }}>{label}</div>`. The base rotation is `-1.5deg` (static
   baseline per D10); when `Math.hypot(velocity?.dx ?? 0, velocity?.dy ??
   0) >= 5`, rotation = `Math.sign(velocity.dx) * 5` (positive dx →
   `+5deg`; negative → `-5deg`; zero or no velocity → `-1.5deg`
   baseline). The 4 kind classNames `.ghost-canvas` / `.ghost-runnable`
   / `.ghost-image` / `.ghost-markdown` are the Public Surface
   contract (CSS rules for these classes are NOT shipped in this PR;
   they land in Stage C.3 visual identity per ADR-0018 token map; the
   classNames are stable now so consumers don't churn). File-head
   JSDoc cites ADR-0017 D10 verbatim baseline rotation `-1.5deg` +
   velocity threshold `5px/frame` + per-kind className roster + ADR-0017
   Q10 absorbtion (gridKind label authority, NOT BlockUIDefinition
   path).

3. **NEW `packages/editor-shell/src/drag-drop/esc-cancel.ts`**
   (~80 LOC). Exports `useEscCancel` React hook + `EscCancelOptions`
   interface. Hook signature: `useEscCancel(options: { dragActive:
   boolean; onCancel: () => void; restoreFocusEl?: HTMLElement | null }):
   void`. Implementation: subscribes to `window.addEventListener('keydown',
   handler)` on mount; cleans up on unmount. Inside the handler, if
   `event.key !== 'Escape'` return early (let everything else
   passthrough). If `dragActive === false`, return early too (Esc
   walks native passthrough per ADR-0017 D8 priority 3 line 304:
   textarea blur / Tiptap deselect / etc.). If `dragActive === true`,
   the handler calls `event.preventDefault()` + `event.stopPropagation()`
   first (per D8 priority 1 line 302 — Esc must NOT trigger textarea
   blur / Tiptap selection-clear / native browser ESC behavior during
   drag), then invokes `options.onCancel()` (the consumer wires this
   to `dispatch({ type: 'drag-end-cancel' })` against the
   `layoutReducer`). The hook also exposes `restoreFocusEl` semantics:
   when `dragActive` flips from `true` to `false` (Esc cancel OR
   normal drag-end), the hook calls `restoreFocusEl?.focus()`
   matching D8 priority 2 line 303 (restore focus on drag-end; if
   the drag-start active element was a textarea/Tiptap surface, the
   consumer captures it as `restoreFocusEl` and the hook re-focuses
   on drag-end). The hook does NOT own snapshot S0 / rollback / epoch
   logic — those live in `layout-reducer.ts`; the hook is a pure
   keyboard listener + focus-restore helper that delegates state
   mutation to the reducer via the `onCancel` callback. File-head
   JSDoc cites ADR-0017 D8 verbatim 3-priority table + Q8 absorbtion
   trailing prose line 298+ (Esc focus textarea conflict priority).

4. **NEW `packages/editor-shell/src/drag-drop/layout-reducer.ts`**
   (~120 LOC). Exports `layoutReducer(state, action): LayoutState` +
   `LayoutState` interface + `LayoutAction` discriminated union. The
   `LayoutState` shape: `{ epoch: number; snapshot: GridSnapshot |
   null; baseline: GridSnapshot }` where `GridSnapshot = { blocks:
   readonly BlockGridPosition[] }` (consumes `BlockGridPosition` from
   `@skb/block-foundation` per ADR-0016 D2 + the W5-2 invariant prose
   from `packages/editor-shell/CONTRACT.md` C.2-4 squash). The
   `LayoutAction` discriminated union (5 variants per ADR-0017 D12
   Q12 absorbtion table line 359-365):

   - `{ type: 'drag-start'; sourceBlockId: string }` → save
     `snapshot: state.baseline` (S0 captured as the lifted-state
     reference); epoch unchanged
   - `{ type: 'drag-over' }` → no-op state change (preview lives in
     overlay layer per ADR-0017 D4; reducer not consulted); returns
     `state` reference-equal (allows React `useReducer` to skip
     re-render)
   - `{ type: 'drag-end-success'; mutation: GridSnapshot }` → `epoch:
     state.epoch + 1`; `baseline: action.mutation` (new S1 committed);
     `snapshot: null` (clear S0 since success path commits)
   - `{ type: 'drag-end-cancel' }` → epoch unchanged; `baseline:
     state.snapshot ?? state.baseline` (rollback to S0 if it exists,
     else baseline unchanged); `snapshot: null`
   - `{ type: 'drag-end-mode-none' }` → SAME behavior as
     `drag-end-cancel` (per D12 table line 365: "degenerate cancel");
     deliberately a separate variant for telemetry + future
     differentiation, but the reducer body returns the same state
     transformation

   The reducer body is a `switch (action.type)` over the 5 variants
   with an exhaustiveness check `const _exhaustive: never = action;`
   in the default branch (TypeScript enforces all 5 are handled).
   Single-user single-session assumption per ADR-0016 D12 line 434
   ("Wave 5 假设 single-user single-session") — the reducer is NOT a
   distributed CRDT/OT; epoch is a monotonic counter, not a vector
   clock. Conflict arbitration cited at file-head JSDoc per ADR-0016
   D12 conflict table (drag wins over auto-measure; responsive wins
   over auto-measure; mdx-load wins as initial; undo-redo same-source
   epoch wins). Responsive transition + drag conflict explicit: the
   reducer accepts `drag-start` only when `state.responsiveTransition
   !== 'in-progress'` (state field added if needed; for v0.5 a runtime
   guard via `if (state.responsiveTransition === 'in-progress')
   return state;` early-return suffices); rejected drags are silent
   no-op at this stage per ADR-0016 D5 转场态 FSM. File-head JSDoc
   cites ADR-0017 D12 verbatim Q12 absorbtion table + ADR-0016 D12
   layoutEpoch authority + the single-user single-session assumption.

5. **MODIFIED `packages/editor-shell/src/index.ts`** (barrel re-exports;
   ~10 LOC delta on top of current 22 LOC; final ~32 LOC, well under
   the 500 LOC hard fail and the 300 LOC ESLint warn). Add 4 new
   re-export blocks immediately after the existing C.2-5 drag-drop
   block (line 14-19) and C.2-6 resize block (line 20-22):

   - `export { DropPulse, dropPulseClassName } from './drag-drop/drop-pulse';`
   - `export { DragGhost } from './drag-drop/drag-ghost';`
   - `export type { DragGhostProps, GhostKind } from './drag-drop/drag-ghost';`
   - `export { useEscCancel } from './drag-drop/esc-cancel';`
   - `export type { EscCancelOptions } from './drag-drop/esc-cancel';`
   - `export { layoutReducer } from './drag-drop/layout-reducer';`
   - `export type { LayoutState, LayoutAction, GridSnapshot } from './drag-drop/layout-reducer';`

   Existing 11 export lines from C.2-1 through C.2-6 era are preserved
   verbatim (no regression on `EDGE_W` / `GAP` / `computeEdgeRects` /
   `tiebreak` / `findMatches` / `OutlineOverlay` / `ColRuler` /
   `SizeTooltip` / `colSpanToFraction` + the prior EditorShell /
   GridContainer / proseExtensions / save-adapter / saveLoad /
   registerBlocks / registerKernels / useAutoRowSpan surfaces; AC#9
   guards). Mechanical guard via grep for the 4 new module names in
   the barrel (AC#10).

6. **NEW vitest test files (4 files; total ~280 LOC)**:

   - `packages/editor-shell/src/__tests__/drag-drop/drop-pulse.test.tsx`
     (~70 LOC; 4 cases per `## test_cases` Suite 1)
   - `packages/editor-shell/src/__tests__/drag-drop/drag-ghost.test.tsx`
     (~80 LOC; 5 cases per Suite 2)
   - `packages/editor-shell/src/__tests__/drag-drop/esc-cancel.test.tsx`
     (~70 LOC; 4 cases per Suite 3)
   - `packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts`
     (~90 LOC; 6 cases per Suite 4)

   The `__tests__/drag-drop/` directory was created at C.2-5 squash
   `2df71b6` (alongside the 3 source modules); C.2-8 adds 4 sibling
   test files. Existing edge-rects + tiebreak + outline-overlay tests
   are NOT modified.

7. **MODIFIED `packages/editor-shell/CONTRACT.md`** (~25-35 LOC delta
   on top of current 360 LOC; final ~385-395 LOC). Surgical extension
   of the `### Drag/Drop layer` subsection (line 182+ from C.2-5
   squash `2df71b6`). Two parts:

   - **Header rename** from `### Drag/Drop layer (C.2-5)` to
     `### Drag/Drop layer (C.2-5 + C.2-8)` to reflect the multi-PR
     contributor pattern; mirrors the existing `### Resize layer
     (C.2-6)` style and forward-compatible with later C.2-10/C.2-11
     Playwright additions.
   - **NEW C.2-8 module roster**: 4 module bullets appended after the
     existing C.2-5 3-module block (line 187-200). Each bullet
     describes Public Surface signature in prose form (parameters +
     return type) + cross-references the ADR-0017 D-item authority +
     forwards to the consumer wiring expected at C.2-10 / C.4. Verbatim
     bullet shapes per Public Surface contract:

     - `drop-pulse.ts` exports `DropPulse` and `dropPulseClassName`.
       It implements the C.2-8 subset of ADR-0017 D11: 720ms halo
       `box-shadow` animation consuming the `var(--accent-success,
       oklch(70% 0.12 145 / 0.5))` token with a Stage C.3 forward-
       pointer to the `--accent-success` design-tokens landing per
       ADR-0018. The component does NOT self-unmount; consumers wire
       `onAnimationEnd` to remove the overlay.
     - `drag-ghost.ts` exports `DragGhost`, `DragGhostProps`, and the
       `GhostKind = 'canvas' | 'runnable' | 'image' | 'markdown'`
       union. It implements ADR-0017 D10: `position: fixed` plus
       `transform: translate(...) rotate(-1.5deg)` baseline plus
       per-kind className. Cursor velocity threshold `5px/frame` per
       D10 trailing prose triggers `±5deg` rotation feedback; the 4
       kind classNames are the Public Surface contract that Stage C.3
       visual identity CSS will style.
     - `esc-cancel.ts` exports `useEscCancel` and `EscCancelOptions`.
       It implements ADR-0017 D8 plus Q8 absorbtion priority table.
       The hook subscribes to global `keydown` + invokes the consumer
       `onCancel` callback only when `dragActive === true`, calling
       `preventDefault` and `stopPropagation` before the callback to
       suppress native Esc passthrough during drag. When `dragActive`
       is false the hook is a no-op so native Esc behavior runs
       (textarea blur / Tiptap deselect / etc.). The hook also
       restores prior focus on drag-end via the optional
       `restoreFocusEl` parameter.
     - `layout-reducer.ts` exports `layoutReducer`, `LayoutState`,
       `LayoutAction`, and `GridSnapshot`. It implements ADR-0017 D12
       plus ADR-0016 D12: 5-variant discriminated-union action
       (`drag-start`, `drag-over`, `drag-end-success`,
       `drag-end-cancel`, `drag-end-mode-none`) with the Q12
       absorbtion epoch table — drag-start saves the S0 snapshot
       without changing epoch; drag-over is a no-op pass-through;
       drag-end-success bumps epoch by 1 and commits the S1 baseline;
       drag-end-cancel and drag-end-mode-none restore the S0 snapshot
       without changing epoch. Single-user single-session assumption
       per ADR-0016 D12.

   - **Trailing cross-reference paragraph extension** (after line 224
     "layoutReducer + layoutEpoch implementation remains deferred to
     C.2-8 per Wave 5 plan v1.1 row C.2-8") — flip from "deferred to
     C.2-8" to "shipped at C.2-8 per Wave 5 plan v1.3 row C.2-8 line
     689" + add ADR-0017 D8 / D10 / D11 / D12 + ADR-0016 D12 Q12
     absorbtion table forward-pointer.

   ADR-0016 §502 row 4 sister-doc-sync requirement (editor-shell
   CONTRACT.md sync per W5-2 invariant) operationally satisfied for
   the 4 NEW module surfaces (same-PR-with-implementation site).

8. **NEW `apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts`**
   (~60 LOC). Playwright spec covering the canonical e2e_smoke flow
   per the orchestrator-authored `## e2e_smoke` block below. Spec body:

   - `test.describe('drag modules mount + Esc native passthrough', ...)`
   - **NO** `test.skip(WSL2 ...)` block — orchestrator self-serves
     Playwright on WSL2 post deps install (memory
     `feedback_wsl2_chromium_launch.md` SUPERSEDED 2026-05-06; PR #79
     housekeeping stripped the skip from C.2-7 spec at squash
     `b2fdd8f`); new specs from C.2-8 onwards follow the no-skip
     pattern.
   - `test('drag modules mount + Esc native passthrough', async ({ page }) => { ... })`
     Body:
     1. `await page.goto('/notes/sample-blocks/edit')` (rest-route from
        C.4-prelude squash `4f49be0`; uses the
        `apps/site/src/pages/notes/[...slug]/edit.astro` mount).
     2. Wait for the editor mount root selector (specific selector
        chosen at exec time; first candidate
        `[data-editor-shell-root]`; fallback `.editor-shell` based on
        the EditorShellMount client-island shipped at C.4-prelude;
        codex executor verifies via `getByTestId` or `locator(...)`
        + `.toBeVisible()` with a 5s timeout).
     3. Assert the page does NOT contain a console error mentioning
        any of the new module names (`drop-pulse` / `drag-ghost` /
        `esc-cancel` / `layout-reducer`) — this guards against import-
        time bugs in the barrel that would surface as `Uncaught
        TypeError` during module loading; capture via
        `page.on('pageerror', ...)` collector + assertion.
     4. Press `Escape` once with no drag in progress: `await
        page.keyboard.press('Escape')`. The page MUST NOT crash; the
        editor MUST remain mounted (re-assert the mount-root selector
        is still visible). This validates the D8 priority 3 native
        passthrough — Esc with no drag-active is a no-op for the
        reducer + does not break Tiptap selection.
     5. Take screenshot to
        `docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png`
        per ADR-0011 D9.5 archive flow + the canonical
        `screenshot_archive` field. File MUST be ≥ 5 KB at ACCEPT
        (placeholder guard per `scripts/check-screenshot-archive.ts`).

   Spec is keyed on the canonical `test(...)` description string
   `"drag modules mount + Esc native passthrough"` (matches the
   `playwright_spec` field's `:"…"` suffix in the `## e2e_smoke`
   block below) so `scripts/check-e2e-coverage.ts` resolves it.

9. **PR.md self-listed** per ADR-0006 D8 strict-whitelist.

The 8 `@skb/block-*` packages are NOT touched. `@skb/mdx-bridge` is
NOT touched. `@skb/heavy-block-boundary` is NOT touched (C.2-7 squash
`dd860b9` already shipped the v0.5 amendment + gridContext path).
`@skb/design-tokens` is NOT touched (the `--accent-success` token
landing is Stage C.3 scope per ADR-0018; v0.5 fallback hex is the
intentional bridge in this PR). `@skb/block-foundation` is NOT
modified at the source level (the layout-reducer.ts module imports
`BlockGridPosition` type from the existing C.2-2 squash surface; no
upstream change). `apps/site/src/components/EditorShellMount.tsx` is
NOT modified — the new modules exist + are barrel-exported but are
NOT wired into the editor-scaffold UI in this PR (full integration
happens at C.2-10 Playwright drag scenarios + future C.4-2 / C.4-3
mount enhancement). The Playwright spec only asserts mount-without-
crash + Esc native-passthrough — NOT actual drag behavior.

LOCKED implementation path: **4 NEW source modules** (drop-pulse +
drag-ghost + esc-cancel + layout-reducer) + **4 NEW vitest test
files** + **1 NEW Playwright smoke spec** + **MODIFIED barrel** +
**MODIFIED CONTRACT.md sister-doc-sync**. Path "wire the modules into
EditorShellMount.tsx + ship full drag scenarios in this PR" is
**EXPLICITLY FORBIDDEN** (reason in Risk register row 1; LOC budget
would balloon ≥ 800 LOC + cross-package consumer-side churn into
apps/site; full drag integration is C.2-10 scope per Wave 5 plan v1.3
row C.2-10 line 691). Path "ship the `--accent-success` token in
design-tokens here" is **EXPLICITLY FORBIDDEN** per Out of scope row 2
+ ADR-0018 D-list reservation for Stage C.3-1 token landing.

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

**Touchable whitelist: 12 entries** (codex-executor confines edits
strictly to these — per ADR-0006 D8 explicit-file-list discipline +
memory `feedback_git_operator_explicit_stage`). Stage-5 commit may
add audit logs (codex R1+ rounds + reviewer R1+ rounds) for a
~14-16-entry total — see `## Codex commit (D1 stage 5) staging`
block. NO change to the 8 `@skb/block-*` packages. NO change to
`@skb/mdx-bridge` / `@skb/heavy-block-boundary` / `@skb/design-tokens`
/ `@skb/block-foundation`. NO change to
`apps/site/src/{islands,components,pages}/`.

1. `packages/editor-shell/src/drag-drop/drop-pulse.ts` (NEW; ~80 LOC;
   per ADR-0017 D11 720ms halo + `--accent-success` token consumption)
2. `packages/editor-shell/src/drag-drop/drag-ghost.ts` (NEW; ~120 LOC;
   per ADR-0017 D10 `position: fixed` + per-kind className + velocity-
   driven rotation)
3. `packages/editor-shell/src/drag-drop/esc-cancel.ts` (NEW; ~80 LOC;
   per ADR-0017 D8 + Q8 absorbtion 3-priority table)
4. `packages/editor-shell/src/drag-drop/layout-reducer.ts` (NEW;
   ~120 LOC; per ADR-0017 D12 + ADR-0016 D12 Q12 absorbtion epoch table)
5. `packages/editor-shell/src/__tests__/drag-drop/drop-pulse.test.tsx`
   (NEW; ~70 LOC; 4 vitest cases per Suite 1)
6. `packages/editor-shell/src/__tests__/drag-drop/drag-ghost.test.tsx`
   (NEW; ~80 LOC; 5 vitest cases per Suite 2)
7. `packages/editor-shell/src/__tests__/drag-drop/esc-cancel.test.tsx`
   (NEW; ~70 LOC; 4 vitest cases per Suite 3)
8. `packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts`
   (NEW; ~90 LOC; 6 vitest cases per Suite 4)
9. `packages/editor-shell/src/index.ts` (MODIFIED; ~10 LOC delta;
   barrel re-exports for the 4 new module surfaces)
10. `packages/editor-shell/CONTRACT.md` (MODIFIED; ~25-35 LOC delta;
    sister-doc-sync per ADR-0016 §502 row 4; extends `### Drag/Drop
    layer` subsection from C.2-5 era to cover the C.2-8 4-module
    addition)
11. `apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts`
    (NEW; ~60 LOC; canonical Playwright smoke per orchestrator-authored
    `## e2e_smoke` block)
12. `docs/plans/wave-5-main/C.2-8-drop-pulse-drag-ghost-esc-layoutEpoch.md`
    (this PR.md self)

**LOC budget**:

| Category | Files | LOC |
|---|---|---|
| Source modules (4 NEW) | drop-pulse + drag-ghost + esc-cancel + layout-reducer | ~400 |
| Vitest test files (4 NEW) | 4 × `__tests__/drag-drop/*.test.{ts,tsx}` | ~280 |
| Playwright smoke (1 NEW) | c2-8-drag-modules-mount.spec.ts | ~60 |
| Barrel re-exports | `index.ts` delta | ~10 |
| CONTRACT.md sister-doc-sync | `CONTRACT.md` delta | ~25-35 |
| PR.md self | this file | ~700-900 |
| **Total committed** | | **~1475-1685** |

Each NEW source file stays under 200 LOC target (drop-pulse ~80;
drag-ghost ~120; esc-cancel ~80; layout-reducer ~120) and well under
the 500 LOC hard fail + 300 LOC ESLint warn. Final
`packages/editor-shell/src/index.ts` ~32 LOC; `CONTRACT.md` ~390 LOC
(under 500 LOC hard fail; the 300 LOC ESLint warn does not apply to
markdown contract docs but the value is informational).

## test_cases

TDD-front authoritative list per ADR-0011 D1 stage 2 + memory
`feedback_codex_spark_lint_gap` — codex-generic-executor lands all
4 vitest test files first (red), then the 4 source modules (green),
then the Playwright spec (separate runner; not part of red-green TDD
because Playwright targets the assembled apps/site mount, not the
unit-tested modules). Verification:
`pnpm --filter @skb/editor-shell test` (vitest) +
`pnpm --filter @skb/site test:visual` (or equivalent Playwright
runner; orchestrator self-serves on WSL2 post deps install).

### Suite 1: `packages/editor-shell/src/__tests__/drag-drop/drop-pulse.test.tsx` (4 cases; ~70 LOC)

1. **TC1.1 — `DropPulse` component renders with `box-shadow` halo
   inline style**. Input: `render(<DropPulse onAnimationEnd={() => {}} />)`.
   Expected: rendered DOM root element has computed style
   `box-shadow` matching pattern `/0 0 0 4px /` (4px offset; the
   color portion is the CSS variable + fallback, asserted separately
   in TC1.3); `position` is `absolute`; `inset` is `0`. Location:
   `drop-pulse.test.tsx > rendering > halo box-shadow style`.

2. **TC1.2 — animation duration is `720ms` per ADR-0017 D11**. Input:
   inspect the source file `drop-pulse.ts` content via Node `fs.readFileSync`
   (vitest-friendly path) OR inline-style assertion against the
   rendered component's `animation` property. Expected: `animation`
   inline-style or computed-style contains `720ms` (verbatim from
   D11 line 345). Location:
   `drop-pulse.test.tsx > timing > 720ms duration`.

3. **TC1.3 — `--accent-success` token consumed with hex fallback per
   ADR-0018**. Input: `render(<DropPulse />)`; inspect the inline-style
   `box-shadow` string. Expected: substring matches
   `/var\(--accent-success,\s*oklch\(70% 0\.12 145 \/ 0\.5\)\)/`
   verbatim — the CSS variable + the fallback hex `oklch(70% 0.12
   145 / 0.5)` per ADR-0017 D11 line 345 + ADR-0018 v0.5 fallback
   bridge. Location: `drop-pulse.test.tsx > token > accent-success
   var with fallback`.

4. **TC1.4 — drag-cancel does NOT trigger pulse (D11 explicit non-
   trigger)**. Input: a small consumer harness that conditionally
   renders `<DropPulse />` only when `phase === 'drag-end-success'`
   (passing `phase = 'drag-end-cancel'` results in `null` render).
   Expected: when `phase === 'drag-end-cancel'`, the `<DropPulse />`
   element is NOT in the rendered DOM (consumer-side enforcement
   per D11 line 351 explicit non-trigger rule). The component itself
   renders unconditionally when mounted; this test asserts the
   consumer-pattern guard is part of the component's documented
   contract via JSDoc + `## ui_touch` Public Surface bullet. Location:
   `drop-pulse.test.tsx > non-trigger > cancel-path no pulse`.

### Suite 2: `packages/editor-shell/src/__tests__/drag-drop/drag-ghost.test.tsx` (5 cases; ~80 LOC)

1. **TC2.1 — `DragGhost` element renders with `position: fixed` +
   `transform` baseline**. Input: `render(<DragGhost cursorX={100}
   cursorY={200} kind="canvas" mode="move" />)`. Expected: rendered
   element has computed style `position: fixed`; `transform` contains
   `translate` and `rotate(-1.5deg)` (baseline per D10 line 336);
   `pointer-events: none`. Location:
   `drag-ghost.test.tsx > render > fixed + baseline transform`.

2. **TC2.2 — per-kind className per 4 kinds**. Input: 4 separate
   renders with `kind: 'canvas' | 'runnable' | 'image' | 'markdown'`.
   Expected: each rendered DOM root has the corresponding
   `.ghost-canvas` / `.ghost-runnable` / `.ghost-image` / `.ghost-markdown`
   className (D10 line 337 verbatim). Location:
   `drag-ghost.test.tsx > kinds > 4-kind className roster`.

3. **TC2.3 — velocity ≥ 5px/frame triggers ±5° rotation**. Input:
   `render(<DragGhost cursorX={100} cursorY={200} kind="canvas"
   mode="move" velocity={{ dx: 8, dy: 0 }} />)` (magnitude 8 ≥ 5
   threshold). Expected: rendered `transform` contains `rotate(5deg)`
   (positive dx → +5; per D10 line 340). Negative-dx counterpart:
   `velocity={{ dx: -8, dy: 0 }}` → `rotate(-5deg)`. Two assertions
   in the same case. Location:
   `drag-ghost.test.tsx > velocity > 5 threshold rotation feedback`.

4. **TC2.4 — velocity = 0 OR no velocity prop → baseline -1.5deg**.
   Input 1: `render(<DragGhost ... velocity={{ dx: 0, dy: 0 }} />)`;
   Input 2: `render(<DragGhost ... />)` (no velocity prop). Expected:
   both render with `transform` containing `rotate(-1.5deg)` (per
   D10 line 340 explicit "velocity = 0 时 ghost 角度 = -1.5deg"
   baseline). Location:
   `drag-ghost.test.tsx > velocity > zero baseline`.

5. **TC2.5 — ghost destroyed on unmount**. Input: render the
   component, then unmount via React Testing Library `cleanup()` or
   the test renderer's unmount handle. Expected: post-unmount, the
   `.drag-ghost` element is no longer in `document.body` (ghost
   destroyed on drag-end per D10 line 340 trailing prose; the consumer
   wires unmount on drag-end). Location:
   `drag-ghost.test.tsx > lifecycle > unmount destroys ghost`.

### Suite 3: `packages/editor-shell/src/__tests__/drag-drop/esc-cancel.test.tsx` (4 cases; ~70 LOC)

1. **TC3.1 — Esc with `dragActive=true` calls preventDefault +
   stopPropagation + invokes onCancel**. Input: render a test harness
   component using the hook with `dragActive: true` + a spy
   `onCancel`. Dispatch a `KeyboardEvent('keydown', { key: 'Escape',
   bubbles: true, cancelable: true })` from `window`. Expected:
   `event.defaultPrevented === true` (preventDefault was called per
   D8 priority 1 line 302); the spy `onCancel` was invoked exactly
   once. Location:
   `esc-cancel.test.tsx > active > dispatches drag-cancel`.

2. **TC3.2 — Esc with `dragActive=false` is a no-op (native
   passthrough per D8 priority 3 line 304)**. Input: render the same
   harness with `dragActive: false`. Dispatch the Esc keydown event.
   Expected: `event.defaultPrevented === false` (NO preventDefault);
   the spy `onCancel` was NOT invoked. Location:
   `esc-cancel.test.tsx > inactive > native passthrough`.

3. **TC3.3 — prior focus restored on drag-end**. Input: render the
   harness with `dragActive: true` + a `restoreFocusEl` reference
   pointing to a textarea that was previously focused. Re-render
   with `dragActive: false` (simulating drag-end transition). Expected:
   `document.activeElement === restoreFocusEl` (per D8 priority 2
   line 303 — restore focus on drag-end). Location:
   `esc-cancel.test.tsx > focus > restore on drag-end`.

4. **TC3.4 — keys other than Esc are passthrough regardless of
   dragActive**. Input: render the harness with `dragActive: true`.
   Dispatch a `KeyboardEvent('keydown', { key: 'Enter' })`. Expected:
   `event.defaultPrevented === false`; the spy `onCancel` was NOT
   invoked. Location:
   `esc-cancel.test.tsx > non-Esc > passthrough`.

### Suite 4: `packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts` (6 cases; ~90 LOC)

1. **TC4.1 — drag-start: epoch unchanged + S0 saved**. Input: initial
   state `{ epoch: 5, snapshot: null, baseline: snapshotA }`; action
   `{ type: 'drag-start', sourceBlockId: 'b1' }`. Expected: result
   state `{ epoch: 5, snapshot: snapshotA, baseline: snapshotA }`
   (epoch unchanged per Q12 absorbtion line 361; S0 saved as
   `snapshot: state.baseline`). Location:
   `layout-reducer.test.ts > drag-start > epoch unchanged + S0 saved`.

2. **TC4.2 — drag-over: epoch unchanged + state reference-equal**.
   Input: state `{ epoch: 5, snapshot: snapshotA, baseline: snapshotA }`;
   action `{ type: 'drag-over' }`. Expected: result IS the same
   state reference (`Object.is(result, state) === true`); epoch
   still 5 per Q12 absorbtion line 362 ("preview not committed").
   Location:
   `layout-reducer.test.ts > drag-over > epoch unchanged + reference-equal`.

3. **TC4.3 — drag-end-success: epoch += 1 + new S1 baseline**. Input:
   state `{ epoch: 5, snapshot: snapshotA, baseline: snapshotA }`;
   action `{ type: 'drag-end-success', mutation: snapshotB }`.
   Expected: result `{ epoch: 6, snapshot: null, baseline: snapshotB }`
   (epoch + 1 one-shot per Q12 absorbtion line 363; new S1 = action.
   mutation; S0 cleared). Location:
   `layout-reducer.test.ts > drag-end-success > epoch +1 + S1 baseline`.

4. **TC4.4 — drag-end-cancel: epoch unchanged + rollback to S0**.
   Input: state `{ epoch: 5, snapshot: snapshotA, baseline: snapshotA }`;
   action `{ type: 'drag-end-cancel' }`. Expected: result `{ epoch:
   5, snapshot: null, baseline: snapshotA }` (epoch unchanged per Q12
   absorbtion line 364; rollback to S0; S0 cleared on consumption).
   Location:
   `layout-reducer.test.ts > drag-end-cancel > epoch unchanged + rollback`.

5. **TC4.5 — drag-end-mode-none: same behavior as drag-end-cancel**.
   Input: state `{ epoch: 5, snapshot: snapshotA, baseline: snapshotA }`;
   action `{ type: 'drag-end-mode-none' }`. Expected: result `{ epoch:
   5, snapshot: null, baseline: snapshotA }` (per Q12 absorbtion line
   365 "degenerate cancel"; same state transformation as TC4.4).
   Location: `layout-reducer.test.ts > drag-end-mode-none > same as
   cancel`.

6. **TC4.6 — responsive transition + drag conflict (drag rejected
   per ADR-0016 D5/D12)**. Input: state with `responsiveTransition:
   'in-progress'` + `{ epoch: 5, snapshot: null, baseline: snapshotA }`;
   action `{ type: 'drag-start', sourceBlockId: 'b1' }`. Expected:
   result IS the same state reference (`Object.is(result, state) ===
   true`); the drag-start is silently rejected per ADR-0016 D5 转场态
   FSM + D12 conflict arbitration ("responsive transition 期间 drag
   拒绝"). Location:
   `layout-reducer.test.ts > conflict > responsive rejects drag`.

### Suite 5: `apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts` (1 Playwright case; ~60 LOC)

1. **TC5.1 — `"drag modules mount + Esc native passthrough"`**.
   Input: navigate `/notes/sample-blocks/edit`; wait for editor mount
   root; press `Escape` once with no drag active. Expected:
   - editor mount root is visible (editor scaffold did NOT crash on
     the new module loads via the barrel re-exports);
   - no `pageerror` event mentioning any of the new module names
     (`drop-pulse` / `drag-ghost` / `esc-cancel` / `layout-reducer`)
     — guards against import-time bugs;
   - pressing Esc with no drag active does NOT crash the page +
     does NOT remove the editor mount root (D8 priority 3 native
     passthrough);
   - screenshot saved to
     `docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png`
     (≥ 5 KB at ACCEPT per `scripts/check-screenshot-archive.ts`).
   Location:
   `c2-8-drag-modules-mount.spec.ts > "drag modules mount + Esc native passthrough"`.

**Suite total: 19 vitest (4 + 5 + 4 + 6) + 1 Playwright = 20 test
cases**. All MUST PASS at AC#9 (`pnpm --filter @skb/editor-shell test`
exit 0) + AC#13 (Playwright spec PASS locally on WSL2 post deps
install + on CI Linux non-WSL).

## contracts_affected

- `packages/editor-shell/CONTRACT.md` — **MODIFIED**. The existing
  `### Drag/Drop layer (C.2-5)` subsection (line 182+ from C.2-5
  squash `2df71b6`) is renamed to `### Drag/Drop layer (C.2-5 +
  C.2-8)` and extended with 4 new Public Surface bullets (drop-pulse,
  drag-ghost, esc-cancel, layout-reducer). The trailing "deferred to
  C.2-8" cross-reference paragraph (line 224+) is flipped to "shipped
  at C.2-8 per Wave 5 plan v1.3 row C.2-8 line 689" + adds ADR-0017
  D8 / D10 / D11 / D12 + ADR-0016 D12 Q12 absorbtion table forward-
  pointers. D2 row 1 hit. Per ADR-0016 §502 row 4 sister-doc-sync —
  same-PR-with-implementation site for the C.2-8 4-module Public
  Surface contract.

- `packages/block-foundation/CONTRACT.md` — **NOT** modified. The
  `BlockGridPosition` shape authority (W5-1) was already authored at
  C.2-2 squash `b15ba24`; C.2-8 is a consumer-side type import (the
  layout-reducer `GridSnapshot` shape contains `readonly
  BlockGridPosition[]`), not an upstream change. The W5-1 invariant +
  ADR-0014 v0.5 cross-reference are unchanged.

- `packages/heavy-block-boundary/CONTRACT.md` — **NOT** modified
  (C.2-7 squash `dd860b9` is the latest; v0.5 amendment + gridContext
  path unchanged).

- `apps/site/CONTRACT.md` — **NOT** modified. The `## Grid layout
  (Wave 5)` section + `/notes/[...slug]/edit` rest-route + EditorShellMount
  client-island (C.4-prelude squash `4f49be0`) are pre-existing
  surfaces; the new Playwright spec consumes the existing route
  + mount root selector but does NOT modify apps/site source or
  contract.

- 8 `@skb/block-*` CONTRACT.md files — **NOT** modified.
  `@skb/mdx-bridge` / `@skb/design-tokens` CONTRACT.md — **NOT**
  modified.

D2 row 5 (boundary contract change since editor-shell now exports 4
NEW module surfaces consumed across package boundary by future
C.2-10 Playwright drag scenarios + future apps/site editor scaffold
integration) hit. Same escalation pattern as the Pre-A3 ADR-0017
Q13 absorbtion + Pre-A2 ADR-0016 Q12 absorbtion "Stage C.2 D2 row 1
+ row 5 escalation note" prediction — the prediction line line 450
of ADR-0017 + the Q13 absorbtion verdict explicitly predicted Stage
C.2 implementation PRs hitting row 1 + row 5; this PR is a row 1
hit (CONTRACT sync) plus a row 5 hit (cross-package boundary surface
addition).

D2 row 4 NOT hit — no NEW ADR amendment is required. ADR-0017
D8/D10/D11/D12 + ADR-0016 D12 are already at lock since Pre-A2 + Pre-A3
+ Pre-A4 (PR squashes `6e2c1d9` + `157a4f7` + `7e487ec` per active.md
Wave 5 PR roster). ADR-0018 `--accent-success` token D-list entry
is already at lock since Pre-A4; the C.2-8 source consumes the
fallback hex bridge + cites the Stage C.3-1 forward-pointer.

PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES per Row 1 + Row 5.

## adr_touched

- **ADR-0017 drag-drop UX**: D8 (全局 Esc cancel + Q8 absorbtion
  priority table line 298+), D10 (drag-ghost cursor 跟随 + per-kind
  着色 line 333+), D11 (drop-pulse 720ms token-driven `--accent-
  success` line 342+), D12 (layoutEpoch single-source mutation +
  Q12 absorbtion epoch table line 353+) — **CONSUMED, NOT AMENDED**.
  C.2-8 implements these D-items at their already-locked specifications;
  no ADR delta in this PR.

- **ADR-0016 grid 数据模型**: D12 (Layout mutation 单一源
  `layoutEpoch` reducer line 401+) + 权威矩阵 + 冲突仲裁规则 (line
  436+) + §502 sister-doc-sync row 4 (editor-shell CONTRACT.md sync
  requirement) — **CONSUMED, NOT AMENDED**. The `layoutReducer` /
  `layoutEpoch` / `LayoutAction` / `GridSnapshot` Public Surface in
  this PR is the canonical realization of ADR-0016 D12 + ADR-0017 D12.
  ADR-0016 §502 row 4 operationally satisfied (CONTRACT.md
  same-PR-with-implementation sync site).

- **ADR-0018 v2 visual migration**: `--accent-success` token D-list
  entry (Stage C.3-1 forward-pointer) — **CONSUMED via fallback hex
  bridge**. The `var(--accent-success, oklch(70% 0.12 145 / 0.5))`
  pattern in `drop-pulse.ts` is the ADR-0018-locked bridge: token
  consumption now + design-tokens definition deferred to Stage C.3-1
  per ADR-0018 D-list reservation.

- **ADR-0011** D1 (linear pipeline) + D2 (trigger schema) + D9
  (Product Experience Quality Gate) + D9.1 (path patterns) + D9.2
  (orchestrator-authored e2e_smoke for non-catalog ui_touch PRs) +
  D9.5 (screenshot archive flow) + D10 (anti-prompt-patching) —
  **operational enforcement, NOT amended**.

- **ADR-0006** D8 (explicit-file-list staging) + 8-point checklist +
  9th item (UI-touch + E2E spec) — **operational enforcement, NOT
  amended**.

- **Wave 5 plan v1.3 row C.2-8** (line 689 verbatim) — referenced as
  the canonical scope source per ADR-0011 D10 anti-prompt-patching
  (catalog wins over inline paraphrase). PR #75 squash `5bd5112`
  (Wave 5 plan v1.3 amendment) cited as the upstream enabling work;
  the v1.3 retrofit catalog (line 547+) annotated `ui_touch +
  e2e_smoke` only on C.2-7 + 5 C.3 + 5 C.4 PRs (NOT C.2-8) — per
  ADR-0011 D9.2 the orchestrator authors a fresh `e2e_smoke` block
  for the C.2-8 catalog gap (see briefing + `## e2e_smoke` block).

D2 row 4 NOT triggered — no NEW ADR amendment.

## acceptance

15 verifiable acceptance criteria. Each is a single shell command
producing an objectively checkable result. ACCEPT-stage pr-writer
(D1 stage 6) re-runs all 15 against the post-commit working tree.

### AC#1 — 4 NEW source modules exist at the canonical paths

```bash
ls packages/editor-shell/src/drag-drop/drop-pulse.ts \
   packages/editor-shell/src/drag-drop/drag-ghost.ts \
   packages/editor-shell/src/drag-drop/esc-cancel.ts \
   packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
```

Expected: `4`. Verifies all 4 source modules exist on disk at the
canonical paths declared in the Wave 5 plan v1.3 row C.2-8 whitelist
(line 689 verbatim).

### AC#2 — barrel re-exports include the 4 new module surfaces

```bash
grep -nE "from ['\"]\\./drag-drop/drop-pulse" packages/editor-shell/src/index.ts | wc -l
grep -nE "from ['\"]\\./drag-drop/drag-ghost" packages/editor-shell/src/index.ts | wc -l
grep -nE "from ['\"]\\./drag-drop/esc-cancel" packages/editor-shell/src/index.ts | wc -l
grep -nE "from ['\"]\\./drag-drop/layout-reducer" packages/editor-shell/src/index.ts | wc -l
```

Expected: each `≥ 1`. Verifies the 4 module-level re-export
statements were added to the barrel. The grep on the relative path
form (`'./drag-drop/'` plus the module name) is robust to whether the executor
chose `export { ... } from '...'` or `export * from '...'` shape.

### AC#3 — vitest 19 NEW cases PASS + existing editor-shell suites unchanged

```bash
pnpm --filter @skb/editor-shell test
```

Expected: exit 0; the post-run summary reports `Tests <N> passed
(<N>)` where N includes the 19 NEW cases (4 drop-pulse + 5 drag-ghost
+ 4 esc-cancel + 6 layout-reducer) on top of the existing C.2-1
through C.2-6 vitest count. Mechanical guard for the 4 new test files:

```bash
ls packages/editor-shell/src/__tests__/drag-drop/drop-pulse.test.tsx \
   packages/editor-shell/src/__tests__/drag-drop/drag-ghost.test.tsx \
   packages/editor-shell/src/__tests__/drag-drop/esc-cancel.test.tsx \
   packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts | wc -l
```

Expected: `4`. Verifies all 4 NEW test files exist.

### AC#4 — `layoutReducer` epoch rules byte-equal to ADR-0017 D12 Q12 absorbtion table

```bash
grep -nE "case 'drag-start':" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
grep -nE "case 'drag-over':" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
grep -nE "case 'drag-end-success':" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
grep -nE "case 'drag-end-cancel':" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
grep -nE "case 'drag-end-mode-none':" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
grep -nF "epoch + 1" packages/editor-shell/src/drag-drop/layout-reducer.ts | wc -l
```

Expected: each of the 5 case keywords `≥ 1`; the `epoch + 1`
expression `≥ 1` (one-shot increment on drag-end-success per Q12
absorbtion table line 363). Five-variant exhaustive switch + the
single +1 mutation site lock the reducer to the ADR-0017 D12 spec.
Vitest TC4.1-4.6 carry the runtime semantic guarantee; the AC
provides a structural guard.

### AC#5 — `drop-pulse.ts` consumes `var(--accent-success, ...)` token with hex fallback

```bash
grep -nE 'var\(--accent-success,\s*oklch\(70% 0\.12 145 / 0\.5\)\)' \
  packages/editor-shell/src/drag-drop/drop-pulse.ts | wc -l
```

Expected: `≥ 1`. Verifies the verbatim token consumption pattern
from ADR-0017 D11 line 345 + the ADR-0018 v0.5 fallback hex bridge.
The pattern is byte-equal to the ADR prose to prevent drift; the
Stage C.3-1 token landing PR will remove the fallback once
design-tokens is shipped.

### AC#6 — `drag-ghost.ts` per-kind className matches the 4 ADR-0017 D10 kinds

```bash
grep -nF 'ghost-canvas' packages/editor-shell/src/drag-drop/drag-ghost.ts | wc -l
grep -nF 'ghost-runnable' packages/editor-shell/src/drag-drop/drag-ghost.ts | wc -l
grep -nF 'ghost-image' packages/editor-shell/src/drag-drop/drag-ghost.ts | wc -l
grep -nF 'ghost-markdown' packages/editor-shell/src/drag-drop/drag-ghost.ts | wc -l
```

Expected: each `≥ 1`. Verifies the 4-kind className contract
declared at ADR-0017 D10 line 337 verbatim. CSS rules for these
classNames land in Stage C.3 visual identity; the classNames are
the stable Public Surface.

### AC#7 — `esc-cancel.ts` calls preventDefault + stopPropagation only when `dragActive === true`

```bash
grep -nF 'preventDefault' packages/editor-shell/src/drag-drop/esc-cancel.ts | wc -l
grep -nF 'stopPropagation' packages/editor-shell/src/drag-drop/esc-cancel.ts | wc -l
grep -nE 'dragActive' packages/editor-shell/src/drag-drop/esc-cancel.ts | wc -l
```

Expected: each `≥ 1`. Verifies the 3 keyword tokens required by
ADR-0017 D8 priority 1 (Esc with `dragActive === true` calls
`preventDefault` + `stopPropagation`). Vitest TC3.1 + TC3.2 carry
the runtime semantic guarantee (preventDefault is suppressed when
`dragActive === false`).

### AC#8 — `CONTRACT.md` sister-doc-sync subsection updated with 4 new module entries + ADR-0017 D8/D10/D11/D12 cross-references

```bash
grep -nE '^### Drag/Drop layer \(C\.2-5 \+ C\.2-8\)' packages/editor-shell/CONTRACT.md | wc -l
grep -nF 'drop-pulse.ts' packages/editor-shell/CONTRACT.md | wc -l
grep -nF 'drag-ghost.ts' packages/editor-shell/CONTRACT.md | wc -l
grep -nF 'esc-cancel.ts' packages/editor-shell/CONTRACT.md | wc -l
grep -nF 'layout-reducer.ts' packages/editor-shell/CONTRACT.md | wc -l
grep -nE 'ADR-0017 D8|ADR-0017 D10|ADR-0017 D11|ADR-0017 D12' packages/editor-shell/CONTRACT.md | wc -l
```

Expected: header `≥ 1`; each module name `≥ 1`; ADR-0017 D-cite count
`≥ 4` (one per D-item). Verifies the sister-doc-sync subsection
covers all 4 new modules + cross-references the 4 D-items + the
header was renamed to reflect multi-PR contributor pattern.

### AC#9 — `pnpm exec tsx scripts/check-ui-touch.ts --files` (file list args) returns `ui_touch: true`

```bash
pnpm exec tsx scripts/check-ui-touch.ts --files \
  packages/editor-shell/src/drag-drop/drop-pulse.ts \
  packages/editor-shell/src/drag-drop/drag-ghost.ts \
  packages/editor-shell/src/drag-drop/esc-cancel.ts \
  packages/editor-shell/src/drag-drop/layout-reducer.ts \
  apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts
```

Expected: stdout contains `ui_touch: true` (path matches the D9.1
pattern `packages/editor-shell/src/**`); exit 0. Verifies the
mechanical detection AGREES with the orchestrator-authored
`## ui_touch` block declaration.

### AC#10 — `index.ts` preserves existing 11 exports (no regression)

```bash
grep -nE "export \{ EditorShell \} from './EditorShell'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ EDGE_W, GAP, computeEdgeRects \} from './drag-drop/edge-rects'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ tiebreak, findMatches \} from './drag-drop/tiebreak'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ OutlineOverlay \} from './drag-drop/outline-overlay'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ ColRuler \} from './resize/col-ruler'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ SizeTooltip, colSpanToFraction \} from './resize/size-tooltip'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ GridContainer \} from './grid-container'" packages/editor-shell/src/index.ts | wc -l
grep -nE "export \{ useAutoRowSpan \} from './use-auto-row-span'" packages/editor-shell/src/index.ts | wc -l
```

Expected: each `≥ 1`. Verifies no existing barrel export was
accidentally removed during the C.2-8 module additions. Mirrors
C.2-5 AC#8 + C.2-6 AC#10 regression-guard pattern.

### AC#11 — Playwright spec exists at canonical path + has the canonical test name

```bash
ls apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts | wc -l
grep -nF '"drag modules mount + Esc native passthrough"' \
  apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts | wc -l
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
`max-lines` warn at 300+ on any new source file; per memory
`feedback_codex_spark_lint_gap` orchestrator runs lint independently
even though codex spark may report PASS without lint), `tsc
--noEmit` clean across all packages + apps/site, vitest 100% PASS,
`astro build` clean, `pnpm size-check` clean (no source file > 500
LOC). Mechanical guard for the source size limit:

```bash
wc -l packages/editor-shell/src/drag-drop/drop-pulse.ts \
      packages/editor-shell/src/drag-drop/drag-ghost.ts \
      packages/editor-shell/src/drag-drop/esc-cancel.ts \
      packages/editor-shell/src/drag-drop/layout-reducer.ts
```

Expected: each value `< 300` (under the ESLint `max-lines` warn
threshold); `< 500` (under `pnpm size-check` hard fail). Target
~80 / ~120 / ~80 / ~120 LOC per the Specifically section roster.

### AC#13 — Playwright spec PASSES locally on WSL2 (orchestrator self-serves post deps install)

```bash
pnpm --filter @skb/site test:visual --grep 'drag modules mount'
```

Expected: exit 0. The spec runs end-to-end against an Astro dev
server (or built preview) on the orchestrator workstation — WSL2
chromium deps installed 2026-05-06 (memory
`feedback_wsl2_chromium_launch.md` SUPERSEDED per active.md
standards-landing follow-up #7); orchestrator self-serves Playwright
on every UI-touch PR from C.2-8 onwards (PR #79 housekeeping squash
`b2fdd8f` stripped the WSL2 skip block from C.2-7 spec; new specs
follow no-skip pattern). The spec also runs on CI (Linux non-WSL)
via the existing `visual-smoke` job in `.github/workflows/ci.yml`.

### AC#14 — screenshot archive at canonical path ≥ 5 KB

```bash
test -f docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png && \
  test "$(stat -c %s docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png)" -ge 5120
```

Expected: exit 0. Verifies the Playwright spec emitted a real
screenshot to the canonical archive path + the file is ≥ 5 KB
(placeholder guard per `scripts/check-screenshot-archive.ts` —
catches `Buffer.from('')` smoke-fail or 1×1 pixel PNG bypass
attempts). The `5120` byte threshold is the canonical 5 KB minimum
codified at PR #74 squash `2f67ef0` (standards landing).

### AC#15 — `scripts/check-e2e-coverage.ts` resolves the canonical e2e_smoke flow

```bash
pnpm exec tsx scripts/check-e2e-coverage.ts \
  docs/plans/wave-5-main/C.2-8-drop-pulse-drag-ghost-esc-layoutEpoch.md
```

Expected: exit 0; stdout reports the `## e2e_smoke` block parsed
successfully + the `playwright_spec` field's
`apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts` path
exists on disk + the spec contains the canonical `test(...)`
description string `"drag modules mount + Esc native passthrough"`.
Verifies the orchestrator-authored `## e2e_smoke` block satisfies
the CI `e2e-coverage-check` job per ADR-0011 D9 + PR #76 squash
`ad42f71` symmetric-skip fix.

## verification required

ACCEPT-stage pr-writer (D1 stage 6) re-runs all 15 ACs against the
post-commit working tree. The 6 mechanical greps (AC#1, #2, #4-7,
#10) + 1 file-existence check (AC#11 ls part) are 1-line bash; the
2 pnpm-driven gates (AC#3 + AC#12) run the full vitest + lint +
typecheck + build + size pipeline; AC#13 is the Playwright run on
WSL2; AC#14 + AC#15 are the screenshot archive + e2e-coverage
gate verification. AC#9 invokes the dedicated `check-ui-touch.ts`
script with explicit `--files` list (REVIEW-stage runnable per
PR #74 squash `2f67ef0` standards landing).

The Codex commit (D1 stage 5) staging block at the tail of this
PR.md provides the explicit-file-list staging command per ADR-0006
D8 + memory `feedback_git_operator_explicit_stage` 4-step protocol
(`git reset HEAD` then `git add` with the explicit file list then `git diff --cached --stat`
verify count + scope → `git commit`).

## ui_touch

`true` (touches `packages/editor-shell/src/**` per ADR-0011 D9.1
path pattern + `apps/site/src/__tests__/e2e/**` per the spec
addition).

Mechanical detection via `pnpm exec tsx scripts/check-ui-touch.ts
--files <list>` (AC#9) AGREES with this catalog annotation. C.2-8
was NOT in the v1.3 retrofit catalog (which annotated only C.2-7 +
5 C.3 + 5 C.4 rows per Wave 5 plan v1.3 line 547+ retrofit catalog
header); per ADR-0011 D9.2, the orchestrator authors a fresh
`e2e_smoke` block for newly-detected ui_touch PRs outside the
catalog. The block below is the orchestrator-authored canonical
shape (single-bullet-with-indented-continuation form per PR #78
reformat lesson + bare paths without surrounding backticks per
`scripts/check-screenshot-archive.ts` parser shape).

## e2e_smoke

Orchestrator-authored canonical e2e_smoke entry per ADR-0011 D9.2
catalog-gap procedure (single-bullet-with-indented-keys to satisfy
`scripts/check-e2e-coverage.ts` parser; the script splits on
`^\s*-\s+(?=key:)` so `target_url`/`playwright_spec`/
`screenshot_archive` are continuation lines, not separate bullets;
values shipped without surrounding backticks so
`scripts/check-screenshot-archive.ts` regex `\S+` captures the bare
path):

- flow: editor scaffold mounts at /notes/sample-blocks/edit after drag-modules added; Esc with no drag-active does NOT crash editor + does not break Tiptap selection (D8 native pass-through priority)
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts:"drag modules mount + Esc native passthrough"
  screenshot_archive: docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png

## Plan-challenger absorbtion

NOT APPLICABLE for an implementation PR per ADR-0011 D7. The Wave 5
plan v1.3 row C.2-8 (line 689) + ADR-0017 D8 + D10 + D11 + D12 (with
Q8 + Q11 + Q12 absorbtion verdicts at lock-time) + ADR-0016 D12
(with Q1 + Q9 absorbtion verdicts) + ADR-0018 `--accent-success`
token D-list entry (Pre-A4 lock) + ADR-0006 8-class audit checklist
+ 9th item are the authoritative inputs. No plan-challenger dispatch
occurred at PLAN stage; the Wave 5 plan was already plan-challenger-
vetted at v1.3 amendment (4-row absorbtion per PR #75 squash
`5bd5112`); ADR-0017 was already plan-challenger-vetted at Pre-A3
(13-row absorbtion per PR #52 squash `157a4f7`); ADR-0016 was
already plan-challenger-vetted at Pre-A2 (12-row absorbtion per PR
#51 squash `6e2c1d9`).

**Open questions surfaced during PLAN draft** (none blocking lock;
documented for orchestrator):

1. **Should the layout-reducer `responsiveTransition` field live on
   `LayoutState` directly, or as a separate React context that the
   reducer reads from at action time?** **Resolved**: as a field on
   `LayoutState` (declared optional `responsiveTransition?:
   'idle' | 'in-progress'` with default `'idle'`). The reducer is
   pure (state + action → state); reading external context inside
   the reducer body breaks purity + complicates testing. The
   responsive transition source (matchMedia subscription per
   ADR-0016 D5 转场态 FSM) is owned by the consumer hook (future
   `useResponsiveCols` in C.2-9 scope) which dispatches a separate
   `responsive-transition-start` / `responsive-transition-end`
   action — but those actions are NOT in the C.2-8 surface (they
   land at C.2-9). For C.2-8, the reducer pre-declares the field
   shape + the early-return guard (TC4.6 verifies the rejection
   path); the consumer wiring is forward-compatible. **NOT BLOCKING**
   — orchestrator may prefer the context-read shape if the
   ADR-0016 D5 implementation lands at C.2-9 with that pattern.

2. **Should the `DragGhost` glyph + label rendering (D10 line 338
   `+ ◇ Canvas` / `⤴ ◇ Canvas`) be in scope for C.2-8 or deferred to
   Stage C.3 visual identity?** **Resolved**: the prop shape (`mode:
   'create' | 'move'`) is in scope — the component reads `mode` and
   renders a textual placeholder label (e.g., `+ Canvas` /
   `⤴ Canvas`) to match the D10 contract. The glyph CSS styling
   (icon font / SVG for `◇`) is Stage C.3 scope per ADR-0018; the
   C.2-8 component uses a plain text fallback (`'+ '` / `'⤴ '`
   prefix + the kind name). Vitest TC2.2 covers the className per
   kind; the glyph rendering is asserted as text content (NOT visual
   appearance) per D10 line 338 prose. **NOT BLOCKING**.

3. **Should the `useEscCancel` hook own the `keydown` listener
   subscription, OR should it be a stateless function the consumer
   wires manually via `useEffect`?** **Resolved**: hook owns the
   subscription (the `use` prefix is the React contract for hooks
   that subscribe to global resources; consumer simply calls
   `useEscCancel({ ... })` once and the hook handles mount/unmount).
   This matches D8 line 296 ("editor-shell 全局 keydown listener"
   verbatim — the listener IS owned at editor-shell level). **NOT
   BLOCKING**.

4. **Should the Playwright spec target `/notes/sample-blocks/edit`
   specifically, or pick any sample slug at runtime?** **Resolved**:
   target the specific `sample-blocks` slug (existing fixture from
   C.4-prelude PR #72 squash `4f49be0`); this matches the editor-
   scaffold mount path that is known to work post-C.4-prelude. The
   `/notes/[...slug]/edit` rest-route resolves any slug, but
   asserting against a specific known-good slug is more deterministic
   for the smoke-test scope ("editor scaffold mounts without crash"
   does not need cross-slug parametrization). **NOT BLOCKING**.

5. **Should the Playwright spec include a screenshot AT mount-time
   only, OR also one AFTER pressing Esc to validate state preservation?**
   **Resolved**: ONE screenshot taken AFTER pressing Esc — captures
   the steady-state UI post-Esc, validating the editor scaffold did
   NOT crash + the mount remained stable. A pre-Esc screenshot would
   require a 2nd archive path (` wave-5-c2-8-drag-modules-mount-pre.png`)
   + 2nd file-size guard, doubling the AC#14 surface for marginal
   coverage gain. The post-Esc screenshot subsumes the pre-Esc state
   (if pre-Esc had crashed, post-Esc would be missing the mount root
   selector and the spec would fail at step 4 before reaching the
   screenshot). **NOT BLOCKING**.

## ambiguity flagged

None blocking lock. The 5 open questions in `## Plan-challenger
absorbtion` above are all resolved in-line; orchestrator may
override Q1 (responsiveTransition shape) if Stage C.2-9 implementation
prefers the context-read pattern, but the C.2-8 reducer field
declaration is forward-compatible either way.

**One forward-pointer flagged for orchestrator awareness**:

- **`--accent-success` design-tokens definition lands at Stage
  C.3-1 per ADR-0018**. The C.2-8 `drop-pulse.ts` consumes the
  token via the v0.5 fallback hex bridge (`var(--accent-success,
  oklch(70% 0.12 145 / 0.5))`) — this is the intentional bridge
  shape per ADR-0017 D11 line 346 ("fallback `oklch(70% 0.12 145 /
  0.5)` 仅 token 未加时兼容"). When the C.3-1 token landing PR
  ships, the fallback may be removed at that PR's discretion (ADR-0017
  D11 line 349 "Stage C.3 实施 OKLCH 切完全 token化后 fallback 可
  移除"). C.2-8 source does NOT need to change at that future PR —
  the `var(...)` consumption remains valid; only the fallback hex
  is optionally pruned. No action required at C.2-8 ACCEPT.

## R14 self-check

Standard 14-point pre-flight per Wave 5 plan v1.3 §232 D12 (R14
discipline 阈值: PR 总量变化 >15% / 新增高风险模块 ≥1 / 跨-package
边界 / 改成功标准 = `reframe`; 任务顺序 / 命名 / 测试补充 = `scope
refinement`).

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | PR scope ≤ Wave 5 plan v1.3 row C.2-8 LOC budget (~400 LOC source) | ✅ | Specifically section roster: ~80 + ~120 + ~80 + ~120 = ~400 source LOC; tests + barrel + CONTRACT delta + Playwright + PR.md = ~1075-1285 additional |
| 2 | Whitelist files match plan row whitelist | ✅ | Plan v1.3 row C.2-8 whitelist: `packages/editor-shell/src/drag-drop/{drop-pulse,drag-ghost,esc-cancel,layout-reducer}.ts` (NEW) + tests; PR.md whitelist files 1-4 + 5-8 byte-equal match |
| 3 | No NEW high-risk module ≥ 1 outside locked plan | ✅ | All 4 new modules are inside `@skb/editor-shell` (locked Wave 5 package); no new package added |
| 4 | No cross-package boundary creation outside locked plan | ✅ | editor-shell internal extension; consumer-side (apps/site / future C.4-2 mount) NOT touched in this PR |
| 5 | No success criteria modification | ✅ | ACs 1-15 mechanical greps + pnpm check + Playwright run; no AC change to upstream ADRs (ADR-0017 + ADR-0016 + ADR-0018 D-items consumed at lock state) |
| 6 | TDD-front discipline | ✅ | `## test_cases` Suite 1-4 enumerate 19 vitest cases authored RED before source; AC#3 mechanical guard verifies test files exist; codex executor follows red-green sequence per ADR-0011 D1 stage 2 |
| 7 | D2 trigger judgment locked at PLAN | ✅ | Row 1 (CONTRACT.md) + Row 5 (cross-package boundary surface addition) FIRES; Row 4 (NEW ADR) DOES NOT fire; PRE-COMMIT CLAUDE REVIEW (D1 stage 4) MANDATORY per Row 1 |
| 8 | ui_touch + e2e_smoke present (per ADR-0011 D9 + 9th asymmetry item) | ✅ | `## ui_touch: true` + orchestrator-authored `## e2e_smoke` block (catalog-gap per D9.2) |
| 9 | Playwright spec exists + screenshot archive path declared | ✅ | `apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts` + `docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png` |
| 10 | Sister-doc-sync per ADR-0016 §502 row 4 | ✅ | `packages/editor-shell/CONTRACT.md` `### Drag/Drop layer` subsection extension at file 10 of whitelist; same-PR-with-implementation site |
| 11 | Lychee link-check pre-empt | ✅ | PR.md has no path-colon-line-number suffix references (memory `feedback_lychee_line_anchor`); no autolink-shaped angle-bracket-word in backticks (memory `feedback_lychee_autolink_in_backticks`); no `npmjs.com/package/...` direct URLs (memory `feedback_lychee_npmjs_403`); no `~/.claude/...` user-local paths in markdown link form (memory `feedback_lychee_user_local_paths`) — all forward-pointers use bare ADR / PR-squash refs |
| 12 | No defer-chain (R14 first violation class) | ✅ | All 4 modules ship complete in this PR per their locked ADR-0017 D-item specs; no "deferred to next PR" continuations except the explicit Out of scope items (full integration C.2-10; token landing C.3-1) which are pre-existing plan-locked deferrals NOT new defer-chain links |
| 13 | No standards-landing absorbtion (R14 third violation class) | ✅ | C.2-8 consumes already-landed standards (D9 + D9.2 + 9th item + check-ui-touch.ts + check-e2e-coverage.ts + check-screenshot-archive.ts shipped at PR #74 squash `2f67ef0` + PR #76 squash `ad42f71`); NO new standards lift in this PR |
| 14 | No gatekeeper-sequencing pushback (R14 second violation class) | ✅ | C.2-8 is a continuation of Stage C.2 module sequence (C.2-1..C.2-7 already shipped); user gatekeeper authorized "Continue full C.2 sequence" per active.md "Post-C.2-7 branch decision" line 150 default |

R14 mechanical hard-fail layer (per v1.1 amendment AC#13 + AC#14):

- **AC#13 (diff-only-N-docs check) NOT APPLICABLE**: this is an
  implementation PR, not a plan amendment PR; the diff-only docs
  hard-fail rule applies only to v1.X amendment PRs.
- **AC#14 (no implementation-string leak in non-PR.md files) NOT
  APPLICABLE**: same — this is implementation work, not plan
  amendment. The v1.1 + v1.2 + v1.3 PR.md amendment hard-fail
  patterns are forward-relevant for any future v1.4+ amendment.

R14 self-check verdict: ✅ ALL PASS. PR.md ready for orchestrator
lock + EXECUTE dispatch.

## D2 trigger judgment

Per ADR-0007 D2 row table + Wave 5 plan v1.3 ROW gate rules, locked
at PLAN time by orchestrator:

| Row | Trigger | Status | Reason |
|---|---|---|---|
| 1 | Contract change (any `@skb/...CONTRACT.md` per package) | ✅ **FIRES** | `packages/editor-shell/CONTRACT.md` MODIFIED — `### Drag/Drop layer` subsection extended with 4 new module Public Surface bullets per ADR-0016 §502 row 4 sister-doc-sync requirement |
| 2 | Package add/remove | ❌ — | No new `@skb/...` workspace package added; no existing package removed |
| 3 | Build/CI/deploy/auth/security | ❌ — | No `.github/workflows/*` change; no `auth/`/`secrets/` change; no deploy config change |
| 4 | NEW ADR or substantive ADR amendment | ❌ — | ADR-0017 D8/D10/D11/D12 + ADR-0016 D12 + ADR-0018 `--accent-success` token D-list entry already at lock since Pre-A2 + Pre-A3 + Pre-A4; C.2-8 is a consumer-side wire-up (no ADR delta) |
| 5 | Cross-package boundary contract change | ✅ **FIRES** | `@skb/editor-shell` exports 4 NEW module surfaces (`DropPulse` + `dropPulseClassName` + `DragGhost` + `DragGhostProps` + `GhostKind` + `useEscCancel` + `EscCancelOptions` + `layoutReducer` + `LayoutState` + `LayoutAction` + `GridSnapshot`) consumed across package boundary by future C.2-10 Playwright drag scenarios + future apps/site editor scaffold integration; same escalation pattern as the Pre-A3 ADR-0017 Q13 absorbtion + Pre-A2 ADR-0016 Q12 absorbtion "Stage C.2 D2 row 1 + row 5 escalation note" prediction |
| 6 | Test contract / fixture format change | ❌ — | Vitest cases added; no test infrastructure / fixture format change; Playwright spec adds new test, not contract change |
| 7 | Performance budget / SLO change | ❌ — | No perf budget delta (ADR-0017 AC#6 hit-test budget already at lock; C.2-8 modules don't touch hit-test path) |
| 8 | High-risk class (auth / security / payment / production) | ❌ — | Editor UX layer, no high-risk class |
| 9 | Doc-only / typo / cosmetic | ❌ (NOT this PR's class) | Has source + test + spec deltas; not doc-only |

**Verdict**: Row 1 FIRES + Row 5 FIRES + Row 4 DOES NOT FIRE.

**PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** per Row 1
(CONTRACT.md sister-doc-sync). Row 5 strengthens stage 3 reviewer
scrutiny (cross-package boundary surface addition; reviewer must
verify ADR-0006 8-point checklist class 5 algorithm replication
guard + class 6 sister-doc-sync consistency + class 7 cross-package
consumer parity). Row 4 NOT triggered → orchestrator does NOT
dispatch a NEW ADR amendment review path.

**Stage 4 PRE-COMMIT CLAUDE REVIEW scope** (orchestrator self-runs
per ADR-0011 D1 stage 4):

1. ADR-0017 D8 / D10 / D11 / D12 prose vs `drop-pulse.ts` /
   `drag-ghost.ts` / `esc-cancel.ts` / `layout-reducer.ts` source
   byte-level alignment (token shape + className roster + epoch
   table)
2. ADR-0016 D12 layoutEpoch authority vs `layout-reducer.ts`
   reducer body single-source compliance
3. `packages/editor-shell/CONTRACT.md` Drag/Drop subsection prose
   vs the 4 new module Public Surfaces (signature parity + ADR
   D-cite roster completeness)
4. ADR-0006 8-point asymmetry audit + 9th item (UI-touch + E2E
   spec) walk

## Risk register

5 risks identified. Rows ordered by mitigation cost (cheapest first).

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | C.2-10 Playwright drag PR depends on these modules being correctly exported via barrel; barrel-export mistake silently breaks downstream consumer | medium | high | AC#2 (barrel re-export grep) + AC#10 (existing 11 exports preserved); reviewer ADR-0006 class 6 sister-doc-sync check at stage 3; codex spark reviewer R1 also exercises `pnpm --filter @skb/editor-shell test` which would surface a barrel typo as a test-file import failure |
| 2 | layoutReducer epoch rules drift from ADR-0017 D12 / ADR-0016 D12 Q12 absorbtion epoch table — silent reducer behavior bug surfacing only after C.2-10 integration | medium | high | AC#4 (5-variant case keyword grep + `epoch + 1` expression grep) + Suite 4 vitest TC4.1-4.6 (6 cases enforcing the Q12 absorbtion table line-by-line) + reviewer ADR-0006 class 5 algorithm replication guard |
| 3 | drag-ghost rotation magic number ±5° drift (D10 line 340 explicit threshold) | low | medium | AC#6 (per-kind className roster grep) + Suite 2 vitest TC2.3 (velocity ≥ 5 → ±5° rotation) + TC2.4 (zero baseline -1.5deg); single-source from ADR-0017 D10 prose; file-head JSDoc cites D10 verbatim |
| 4 | drop-pulse fallback hex `oklch(70% 0.12 145 / 0.5)` drift from ADR-0017 D11 + ADR-0018 v0.5 bridge | low | medium | AC#5 (verbatim regex match against `var(--accent-success, oklch(70% 0.12 145 / 0.5))`); single-source from ADR-0017 D11 line 345 prose; file-head JSDoc cites D11 verbatim + ADR-0018 v0.5 bridge note |
| 5 | editor scaffold (C.4-prelude squash `4f49be0`) does NOT yet wire drop-pulse / drag-ghost — modules exist but unused at /notes/[...slug]/edit; e2e_smoke spec asserts mount-without-crash only, NOT actual drag behavior | medium (low impact) | low | Risk register itself + `## ui_touch` block forward-pointer + `## Out of scope` row 1; future C.2-10 PR explicitly delivers the drag scenarios + EditorShellMount.tsx wiring; ACCEPT-stage check that the smoke does not over-assert (does not claim drag works); the Playwright spec scope is explicitly "modules don't break the editor on import" not "drag works end-to-end" |

## Out of scope

Explicitly NOT in C.2-8 scope. Each item is a future PR or
deferred-to-Stage forward-pointer.

1. **Full drag-end-success integration with `apps/site/src/components/EditorShellMount.tsx`
   editor scaffold mount** — deferred to **C.2-10 Playwright drag
   scenarios PR** per Wave 5 plan v1.3 row C.2-10 (line 691). C.2-8
   ships the modules; C.2-10 wires them into the editor-scaffold UI
   (drag-handle DOM emission + pointer event listeners + actual
   drag/drop sequence + 4-mode visual verification per ADR-0017 AC#1).
2. **`--accent-success` design-tokens definition** — deferred to
   **Stage C.3-1 PR** per ADR-0018 D-list reservation. v0.5 fallback
   hex `oklch(70% 0.12 145 / 0.5)` is the intentional bridge in the
   `drop-pulse.ts` source; the Stage C.3-1 token landing PR may
   optionally remove the fallback once design-tokens ships.
3. **Touch / mobile drag (touchstart / touchmove / touchend)** —
   explicit OUT OF SCOPE per ADR-0017 Consequences line 411 + ADR-0017
   Q9 absorbtion (mobile 1-col path全 view-only); Wave 5 仅 desktop
   鼠标 drag.
4. **Modal canvas drag/drop internal** — explicit OUT OF SCOPE per
   ADR-0017 Consequences line 409 (Modal canvas node/edge editing
   留 Phase 2+ ADR per granularity 旧 ADR-0014 / Wave 5+ ADR-0019+).
5. **Multi-user CRDT/OT collaborative editing** — Phase 2+ ADR per
   ADR-0016 D12 line 434 (single-user single-session assumption);
   `layoutEpoch` is monotonic counter, NOT vector clock.
6. **Drag-handle DOM emission (`.gblock-gutter` `⋮⋮` button rendering)
   + pointer event listener wiring** — partially in C.2-10 Playwright
   PR scope; the drag-handle rendering is part of the Astro renderer
   pages stack (apps/site `.astro` updates) per ADR-0017 D-list, NOT
   editor-shell internal modules.
7. **`useDragActive()` consumer hook + Tiptap keymap consume `drag-
   active` flag wiring** — referenced at ADR-0017 D8 line 306 ("所有
   依赖 ESC 的 consumer (Tiptap keymap / textarea / global handlers)
   必须 check `drag-active` flag"); the `useEscCancel` hook in C.2-8
   accepts `dragActive: boolean` as a consumer-passed prop; the
   `useDragActive()` accessor + Tiptap keymap wiring lands at
   C.2-10 / C.4 integration.
8. **Drag-ghost glyph icon font / SVG (`◇` glyph rendering)** —
   Stage C.3 visual identity per ADR-0018; C.2-8 component renders
   plain text fallback (`'+ '` / `'⤴ '` prefix + kind name).
9. **`ResizeObserver`-driven invalidation of drag-overlay edge rects
   on grid container resize** — covered at C.2-5 squash `2df71b6`
   trailing prose per ADR-0017 Q5 absorbtion ("Reflow / resize
   invalidation"); the C.2-5 modules already wire this; C.2-8 modules
   do not need to subscribe (overlay layer owns the dirty-bit
   propagation).

## execution plan

orchestrator dispatches `codex exec --yolo --profile codex-generic-
executor` (per ADR-0007 D5 + ADR-0011 D6 — Wave 3 default executor;
~400 LOC source; under the heavy-execution threshold). audit log
path: `/tmp/codex-runs/2026-05-06-C.2-8-implementation.txt` raw +
`docs/audits/codex-runs/2026-05-06-C.2-8-implementation.txt`
curated archive (head -2000 OR R21 grep verdicts if log > 500 KB
per memory `feedback_codex_audit_log_recursion`).

Codex execution sequence (TDD-front per ADR-0011 D1 stage 2 + memory
`feedback_codex_spark_lint_gap`):

1. **TDD-red phase**: write 4 vitest test files at the canonical
   `__tests__/drag-drop/` paths with all 19 cases per `## test_cases`
   Suites 1-4. Confirm `pnpm --filter @skb/editor-shell test` fails
   on all 19 NEW cases (modules don't exist yet) + existing cases
   still pass.
2. **TDD-green phase, source modules**: write the 4 source modules
   at the canonical `src/drag-drop/` paths with full implementation.
   Confirm `pnpm --filter @skb/editor-shell test` PASSES all 19 NEW
   + all existing cases (target ALL GREEN).
3. **Barrel + CONTRACT sync**: append the 4 new export blocks to
   `packages/editor-shell/src/index.ts`; extend the
   `### Drag/Drop layer` subsection in `packages/editor-shell/CONTRACT.md`.
   Re-run `pnpm --filter @skb/editor-shell test` to confirm no
   regression.
4. **Playwright spec**: write
   `apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts` with
   the 1 canonical case. Confirm `pnpm --filter @skb/site test:visual
   --grep 'drag modules mount'` PASSES on WSL2 (orchestrator self-
   serves post deps install) + emits the screenshot to
   `docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png` (≥ 5
   KB).
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

Reviewer dispatch at D1 stage 3: `codex exec --yolo --profile codex-pr-
reviewer-55 ...` per ADR-0011 D1 stage 3 + ADR-0006 8-point + 9th
item walk. Reviewer feedback rounds R1 + R2 + ... until PASS (or
PASS-WITH-RESIDUE if minor non-blocking residue). PRE-COMMIT CLAUDE
REVIEW (D1 stage 4) MANDATORY per `## D2 trigger judgment` Row 1 +
Row 5; orchestrator self-runs the 4-step scope walk in `## D2
trigger judgment` block above.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging discipline + memory
`feedback_git_operator_explicit_stage` 4-step protocol:

```bash
# Step 1: clean staging area
git -C /home/weiyi/selfKnowledgeBaseWeb reset HEAD

# Step 2: explicit-file-list add (12 PR.md whitelist + audit logs)
git -C /home/weiyi/selfKnowledgeBaseWeb add \
  packages/editor-shell/src/drag-drop/drop-pulse.ts \
  packages/editor-shell/src/drag-drop/drag-ghost.ts \
  packages/editor-shell/src/drag-drop/esc-cancel.ts \
  packages/editor-shell/src/drag-drop/layout-reducer.ts \
  packages/editor-shell/src/__tests__/drag-drop/drop-pulse.test.tsx \
  packages/editor-shell/src/__tests__/drag-drop/drag-ghost.test.tsx \
  packages/editor-shell/src/__tests__/drag-drop/esc-cancel.test.tsx \
  packages/editor-shell/src/__tests__/drag-drop/layout-reducer.test.ts \
  packages/editor-shell/src/index.ts \
  packages/editor-shell/CONTRACT.md \
  apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts \
  docs/plans/wave-5-main/C.2-8-drop-pulse-drag-ghost-esc-layoutEpoch.md \
  docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png \
  docs/audits/codex-runs/2026-05-06-C.2-8-implementation.txt

# Step 3: verify staging count + scope
git -C /home/weiyi/selfKnowledgeBaseWeb diff --cached --stat | tail -20

# Expected output: 14 entries staged (12 PR.md whitelist + screenshot + audit log)
# all paths under packages/editor-shell/, apps/site/src/__tests__/e2e/,
# docs/plans/wave-5-main/, docs/audits/screenshots/, docs/audits/codex-runs/.
# NO unrelated lockfile churn (verify via second grep)

git -C /home/weiyi/selfKnowledgeBaseWeb diff --cached --stat \
  | grep -E '^ pnpm-lock\.yaml' | wc -l
# Expected: 0 (no pnpm-lock churn since no package.json change)

# Step 4: commit
git -C /home/weiyi/selfKnowledgeBaseWeb commit -m "$(cat <<'EOF'
feat(editor-shell): C.2-8 drop-pulse + drag-ghost + Esc cancel + layoutEpoch reducer

Land 4 NEW drag-drop modules under packages/editor-shell/src/drag-drop/
per ADR-0017 D8/D10/D11/D12 + ADR-0016 D12. Sister-doc-sync editor-shell
CONTRACT.md per ADR-0016 §502 row 4. Playwright smoke at
apps/site/src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts validates
editor scaffold mounts after drag-modules added + Esc native passthrough
per ADR-0017 D8 priority 3 (no drag-active = no preventDefault). 19 vitest
+ 1 Playwright = 20 cases all PASS. WSL2 chromium deps installed
2026-05-06; orchestrator self-serves Playwright; new specs follow
no-skip pattern.

Per Wave 5 plan v1.3 row C.2-8 line 689; D2 row 1 + row 5 fire;
PRE-COMMIT CLAUDE REVIEW (D1 stage 4) PASSED.

Wave 5 Stage C.2 9 of 13 implementation PRs (post C.2-7 squash dd860b9).
EOF
)"

# Post-commit verification
git -C /home/weiyi/selfKnowledgeBaseWeb log --oneline -1
git -C /home/weiyi/selfKnowledgeBaseWeb status --short
```

Expected stage-5 stats:
- 14 files staged (12 PR.md whitelist + 1 screenshot + 1 audit log)
- 0 pnpm-lock.yaml churn
- exit code 0 on each step
- post-commit `git status` clean (no unstaged tracked changes)

Reviewer codex (D1 stage 5) executes the above bash in its workspace
+ pushes to the PR branch `wave-5-c.2-8-drop-pulse-drag-ghost-esc-
layoutepoch`. ACCEPT-stage pr-writer (D1 stage 6) re-verifies all 15
ACs against post-push HEAD; on PASS the orchestrator merges via
`gh pr merge --squash --delete-branch` per memory
`feedback_wave3_auto_merge`.

## Related

- [Wave 5 plan v1.3](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — row C.2-8 line 689 (canonical scope source); v1.3 retrofit catalog (line 547+) does NOT cover C.2-8 → orchestrator-authored e2e_smoke per ADR-0011 D9.2
- [ADR-0017 drag-drop UX](../../decisions/ADR-0017-drag-drop-ux.md) — D8 (Esc cancel + Q8 absorbtion line 298+) + D10 (drag-ghost line 333+) + D11 (drop-pulse line 342+) + D12 (layoutEpoch + Q12 absorbtion line 353+); CONSUMED, NOT amended
- [ADR-0016 grid 数据模型](../../decisions/ADR-0016-grid-data-model.md) — D12 layoutEpoch authority line 401+ + 权威矩阵 line 436+ + §502 sister-doc-sync row 4 (editor-shell CONTRACT.md sync requirement); CONSUMED, NOT amended
- [ADR-0018 v2 视觉 migration](../../decisions/ADR-0018-v2-visual-migration.md) — `--accent-success` token D-list entry (Stage C.3-1 forward-pointer); CONSUMED via fallback hex bridge
- [ADR-0011 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — D1 stage 1-6 + D2 row 1 + row 5 fire + D9 Product Experience Quality Gate + D9.1 path patterns + D9.2 catalog-gap orchestrator authoring + D9.5 screenshot archive flow + D10 anti-prompt-patching
- [ADR-0006 asymmetry audit checklist](../../decisions/ADR-0006-asymmetry-audit-checklist.md) — 8-point (class 5 algorithm replication + class 6 sister-doc-sync + class 7 cross-package consumer parity) + 9th item (UI-touch + E2E spec) + D8 explicit-file-list staging
- [C.2-5 PR.md (drag/drop UX 3 modules)](C.2-5-drag-drop-ux.md) — squash `2df71b6`; lower-half drag-drop primitives that C.2-8 builds on
- [C.2-6 PR.md (resize UX 2 modules)](C.2-6-resize-ux.md) — squash `2fb7900`; resize primitives sibling structure
- [C.2-7 PR.md (ADR-0014 v0.5 amendment)](C.2-7-adr-0014-v0.5-amendment.md) — squash `dd860b9`; FIRST UI-touch PR through D9 + 9th-item gate; canonical e2e_smoke + ui_touch block formatting precedent
- [C.4-prelude PR.md (minimal editor scaffold)](C.4-prelude-editor-scaffold.md) — squash `4f49be0`; provides the `/notes/[...slug]/edit` rest-route + EditorShellMount client-island that the C.2-8 Playwright smoke spec targets
- [Wave 5 plan v1.3 amendment PR.md](v1.3-plan-amendment-r14-third.md) — PR #75 squash `5bd5112`; landed the standards retrofit catalog (canonical e2e_smoke shape) + the C.2-8 row whitelist
