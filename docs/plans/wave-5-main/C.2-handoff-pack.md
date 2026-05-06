# Wave 5 Stage C.2 close — handoff pack

| 字段       | 值                                                                   |
| ---------- | -------------------------------------------------------------------- |
| Stage      | Phase 1 Wave 5 Stage C.2 (13/13 PRs done once #85 merges)            |
| Stage HEAD | `TBD post-merge` (#85 squash; current pre-close main HEAD `02925b1`) |
| Wave       | Phase 1 Wave 5                                                       |
| 触发       | Wave 5 plan v1.3 row C.2-12 + Stage C.2 close criterion line 695     |
| 作者       | codex-generic-executor (D1 stage 2)                                  |
| 替代       | C.1 handoff pack as prior-stage template                             |

> 下一 session 第一动作 = 复读本 handoff pack and choose one Stage close decision:
> continue Stage C.3, MVP-ship, or R14 amendment.

## Summary

Stage C.2 ships the 13-row grid and drag/drop close sequence: 12 baseline
implementation PRs plus the C.2-3.5 R14 defer-chain fix PR. The stage delivered
the W5-1 and W5-2 grid invariants, made component blocks serializable through
`mdx-bridge`, mounted the editor-shell grid path, and covered the active
ADR-0017 acceptance set with vitest and Playwright fixtures.

The visible product surface now has 4 边缘对称 drag/drop hit testing, static
outline overlay, col-ruler, size-tooltip, responsive 12/6/1 switching, rowSpan
adapt, drop-pulse, drag-ghost, Esc cancel, and the `layoutEpoch` reducer path.
Stage C.2 also lands the visual smoke baseline and AC#6 hit-test perf budget
fixture that make the Stage C.3 visual migration and Stage C.4 full editor
wire-up measurable.

## PR roster

| PR  | Squash HEAD      | Stage   | Subject                                                              |
| --- | ---------------- | ------- | -------------------------------------------------------------------- |
| #58 | `e54497d`        | C.2-1   | mdx-bridge col/row/colSpan/rowSpan serialize                         |
| #59 | `b15ba24`        | C.2-2   | block-foundation BlockUIDefinition grid + grid-math.ts               |
| #60 | `2586328`        | C.2-3   | Astro renderer grid + Responsive 12/6/1                              |
| #65 | `b019a31`        | C.2-3.5 | mdx-bridge hard-throw flip + sample MDX backfill + 17 RTT fixtures   |
| #63 | `de13d15`        | C.2-4   | editor-shell grid integration + useAutoRowSpan hook                  |
| #67 | `2df71b6`        | C.2-5   | drag/drop UX implementation: edge-rects + tiebreak + outline overlay |
| #68 | `2fb7900`        | C.2-6   | resize UX: col-ruler + size-tooltip + COL_SNAPS snap                 |
| #78 | `dd860b9`        | C.2-7   | ADR-0014 v0.5 + HeavyBlockBoundary consumes W5-1 grid dimensions     |
| #80 | `2cdcebb`        | C.2-8   | drop-pulse + drag-ghost + Esc cancel + layoutEpoch reducer           |
| #82 | `07c4dd4`        | C.2-9   | Responsive 12/6/1 switch + rowSpan adapt FSM                         |
| #83 | `7e624f0`        | C.2-10  | Playwright drag scenarios + edge-rect tiebreak fixtures              |
| #84 | `02925b1`        | C.2-11  | Playwright resize + responsive switch + rowSpan adapt                |
| #85 | `TBD post-merge` | C.2-12  | Stage C.2 close: perf budget + visual smoke baseline + handoff pack  |

## ADRs touched

| ADR                                                          | Stage C.2 relationship                                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [ADR-0014](../../decisions/ADR-0014-heavy-block-boundary.md) | v0.5 amendment in PR #78; HeavyBlockBoundary dimensions now consume W5-1 grid context math.                 |
| [ADR-0016](../../decisions/ADR-0016-grid-data-model.md)      | D6 Q4 `effectiveColSnaps` reference closed by resize UX; W5-1 and W5-2 invariants implemented and consumed. |
| [ADR-0017](../../decisions/ADR-0017-drag-drop-ux.md)         | D5-D12 D-list cited across C.2-5 through C.2-12; AC#1-#12 coverage matrix tracked below.                    |

## ACs covered

| ADR-0017 AC | Stage C.2 status  | Evidence                                                                |
| ----------- | ----------------- | ----------------------------------------------------------------------- |
| AC#1        | Active covered    | C.2-10 Playwright 4-mode classification fixtures                        |
| AC#2        | Active covered    | C.2-10 `EDGE_W = 28` half-in / half-out boundary fixtures               |
| AC#3        | Active covered    | C.2-10 tiebreak distance, velocity, spatial, and blockId fixtures       |
| AC#4        | Active covered    | C.2-10 static-layer invariant during drag-over simulation               |
| AC#5        | Active covered    | C.2-10 outline overlay class inventory by mode                          |
| AC#6        | Active covered    | C.2-12 `grid-perf.spec.ts` n=10/n=30 budget + n=100 stress signal       |
| AC#7        | Deferred to C.4-2 | Requires editor-shell drag-active state machine in `EditorShellMount`   |
| AC#8        | Active covered    | C.2-10/C.2-11 `useAutoRowSpan` re-measure fixtures                      |
| AC#9        | Deferred to C.4-2 | Requires global Esc wiring during real drag state                       |
| AC#10       | Active covered    | C.2-10/C.2-11 col-ruler, size-tooltip, responsive, and rowSpan fixtures |
| AC#11       | Deferred to C.4-2 | Requires real drag-start / drag-over ghost follow integration           |
| AC#12       | Deferred to C.4-2 | Requires drag-end-success dispatch wiring for drop-pulse timing         |

Coverage split: 8 active ACs are covered in C.2 (AC#1-#6, AC#8, AC#10);
4 ACs are intentionally deferred to C.4-2 (AC#7, AC#9, AC#11, AC#12).

## Invariants delivered

| Invariant             | Delivered surface                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| W5-1                  | `effectiveColWidth` + `effectiveCellHeight` grid math in block-foundation and consumers.       |
| W5-2                  | `useAutoRowSpan` with `rowSpan='auto'` two-stage steady state per ADR-0016 D3.                 |
| EDGE_W                | `EDGE_W = 28` boundary invariant, byte-equal to two 14px grid gaps.                            |
| Drag/drop FSM         | Edge-rects, tiebreak, static overlay, drop-pulse, drag-ghost, Esc cancel, layoutEpoch reducer. |
| Resize/responsive FSM | COL_SNAPS/effectiveColSnaps, col-ruler, size-tooltip, 12/6/1 switch, rowSpan adapt.            |

## Visual smoke baseline

The Stage C.2 baseline lives in `apps/site/playwright/visual-smoke-baseline/`:

| File                                         | Route                       | Current size |
| -------------------------------------------- | --------------------------- | -----------: |
| `wave-5-c2-baseline-sample-blocks-astro.png` | `/sample-blocks-astro`      |     97,423 B |
| `wave-5-c2-baseline-sample-blocks-notes.png` | `/notes/sample-blocks`      |    467,573 B |
| `wave-5-c2-baseline-edit-route.png`          | `/notes/sample-blocks/edit` |     20,049 B |

These are Stage C.2 smoke baselines, not final visual identity baselines. Stage
C.3-5 will regenerate them after OKLCH tokens, Inter, and JetBrains Mono land
per ADR-0018.

## Perf budget

AC#6 canonical budget is n=30 blocks at 60fps: frame budget ≤ 16ms, with CI
margin to ≤ 20ms. The helper budget is per-event ≤ 0.05ms for the timed
`findMatches` loop. C.2-12 also measures n=10 as a small fixture and n=100 as
a stress signal; n=100 is informational and logs the per-event value for Phase
2+ optimization triage.

The Playwright spec uses a browser `page.evaluate()` synthetic harness and
parity-checks the match count against imported editor-shell `computeEdgeRects`
and `findMatches` authorities before asserting the n=10/n=30 budget.

## Forward scope

| Stage        | Scope                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| C.3          | 5 PRs: OKLCH + Inter/JetBrains Mono per ADR-0018; plan rows 701-705.                      |
| C.4          | 5 remaining PRs after C.4-prelude; full editor wire-up and MVP E2E per rows 715-719.      |
| Wave 5 close | ADR-0019 close ceremony after C.4 close, MVP-ship escape valve, or R14 amendment outcome. |

## Test status

| Suite                                    | Stage C.2 close status | Notes                                                       |
| ---------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| `apps/site/playwright/grid-perf.spec.ts` | PASS                   | 6 tests: 3 perf/stress + 3 visual baseline emitters.        |
| `pnpm --filter @skb/site lint`           | Required before review | C.2-12 touches Playwright only under `apps/site`.           |
| `pnpm --filter @skb/site typecheck`      | Required before review | Confirms the browser harness, route selectors, and imports. |
| `pnpm size-check`                        | Required before review | Stage C.2 close files stay under the 500 LOC hard limit.    |
| `prettier --check`                       | Required before review | Scope: C.2-12 PR.md, handoff pack, and grid perf spec.      |
| Visual baselines                         | PASS after emission    | All 3 PNG files are above the 5 KB floor.                   |
| ui_touch                                 | false                  | Playwright + docs only; D9 e2e-coverage gate auto-skips.    |

## Open risks

| Risk                                                      | Handling                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------- |
| Stage C.3 visual identity will invalidate C.2 screenshots | Regenerate baselines at C.3-5 after OKLCH + fonts land.             |
| Real drag-active UX still has four deferred ADR-0017 ACs  | C.4-2 owns AC#7, AC#9, AC#11, and AC#12 integration lift.           |
| n=100 perf stress can vary across runners                 | Informational only; n=30 remains the canonical AC#6 budget.         |
| PR #85 squash unknown during executor phase               | Use `TBD post-merge`; orchestrator fills the hash in the next sync. |

## Handoff checklist

- Read this file first in the next session and restate the chosen branch.
- If continuing, open C.3-1 against ADR-0018 tokens/fonts and plan rows 701-705.
- If MVP-shipping, start ADR-0019 Wave 5 close ceremony from the current Stage C.2 baseline.
- If amending, route through v1.4 R14 amendment PR before further implementation.

## Decision points (USER MVP-judgment escape valve)

1. Continue Stage C.3: orchestrator opens C.3-1 for design-tokens OKLCH + fonts.
2. MVP-ship: Wave 5 close ceremony ADR-0019 on current state; Stage C.2 baseline becomes MVP.
3. R14 amendment: user invokes plan v1.4 amendment PR via D1 pipeline, plan-challenger, lock, then resume.
