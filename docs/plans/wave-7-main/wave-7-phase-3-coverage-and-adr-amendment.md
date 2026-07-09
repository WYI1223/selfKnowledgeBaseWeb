# Wave 7 Phase 3 — ADR-0017 v0.6 amendment + hole-fill drag UX coverage

> Closes out the Wave 7 deprecation surface: formally amends
> [ADR-0017](../../decisions/ADR-0017-drag-drop-ux.md) to mark the
> 4-mode `applyDropMode` D-list items DEPRECATED (replaced by
> [ADR-0020](../../decisions/ADR-0020-grid-engine-contract.md) D2),
> documents which D-list items are RETAINED, and adds a new
> Playwright spec that covers the hole-fill drop intent overlay +
> theme baseplate mount. Replaces the AC#1-#5 4-mode regression net
> that was skipped with `REMOVED-IN-WAVE-7-PHASE-2B` markers in PR #126.

## title

ADR-0017 v0.6 amendment block + per-D + per-AC status table mapping
each item to RETAINED / DEPRECATED / SUPERSEDED / REMOVED per the
Wave 7 cutover; new `apps/site/playwright/grid-engine-drag-ux.spec.ts`
covering the post-cutover drop intent overlay shape (3 tests:
null / place / reject) + theme baseplate mount (1 test). Migration
evidence table cross-links PRs #125-#128.

## files

### Modified

- `docs/decisions/ADR-0017-drag-drop-ux.md` —
  - Top-matter `状态` field bumped to `v0.6 Wave 7 Phase 3 amendment 2026-05-11`
  - Appended `## v0.6 amendment — Wave 7 Phase 3 deprecate 4-mode split-with-shrink (2026-05-11)` section at end:
    - D-list status table (14 items: D1-D6 DEPRECATED, D7-D14 RETAINED)
    - AC-list status table (12 items: AC#1-#6 SUPERSEDED, AC#7/9/10/11/12 RETAINED, AC#8 REMOVED)
    - Phase 3 NEW coverage pointer
    - Migration evidence (PR #125-#128 commit hashes; #129-#130 forward-pointers)

### New

- `apps/site/playwright/grid-engine-drag-ux.spec.ts` —
  4 tests covering:
  - Outline overlay null intent → only base layer
  - Outline overlay place intent → `--place` class + `data-skb-drop-intent="place"`
  - Outline overlay reject intent → `--reject` class + `data-skb-drop-intent="reject"`
  - Theme baseplate mounts inside `.skb-grid[data-skb-theme="lego-studs"]` (default)

## ui_touch

`false` — `docs/` + `apps/site/playwright/` paths only. The Playwright
spec exercises existing rendered components; no production source
changes.

## e2e_smoke

N/A — `ui_touch=false`. The new spec IS the e2e coverage; existing
visual baselines unchanged.

## Acceptance

executor: orchestrator-self (docs + tests; no codex needed)
reviewer: CI gates (lint + lychee + size-check; e2e-coverage-check
mechanically skips when ui_touch=false; visual-smoke runs the new
spec)
contract_changes:
  - ADR-0017 status bumped to v0.6; deprecation table formalized
  - No code or schema changes
new_adr: NONE — amendment to existing ADR-0017
risk_class: D2 row 4 (NEW ADR amendment). Docs-only;
PRE-COMMIT CLAUDE REVIEW skipped per bootstrap-scope rule.

## Out of scope (deferred to Wave 7 close PR #130)

- Prototype deletion (`/grid-prototype` route + `_grid-prototype/`
  components) — user-directive 2026-05-11 keeps it alive as
  acceptance benchmark; deleted only after user signs off on
  prototype-vs-editor visual parity
- Per-theme full drag-and-drop end-to-end Playwright flows (cursor
  → coord → place block → assert mutation); the current CSS Grid
  layout makes synthetic drag dispatch flaky vs the absolute-
  positioning prototype model; deferred alongside the layout-model
  migration
- `theme.renderDropPreview` integration (OutlineOverlay still uses
  the plain intent rect; per-theme styled ghost is the next
  Theme-contract integration step)
- ADR-0021 Wave 7 close ADR + close ceremony

## Process

1. ✓ ADR-0017 top-matter status bumped to v0.6
2. ✓ ADR-0017 amendment block appended with D + AC status tables +
   migration evidence
3. ✓ New `grid-engine-drag-ux.spec.ts` Playwright spec written + 4/4
   pass locally
4. ✓ PR.md drafted
5. **THIS PR** — commit + CI gate

## Honest scope

- 1 ADR amended (+~70 LOC append; no deletion)
- 1 new Playwright spec (~120 LOC)
- 0 production source changes
- 0 failing tests locally; existing 97 passing baseline preserved
