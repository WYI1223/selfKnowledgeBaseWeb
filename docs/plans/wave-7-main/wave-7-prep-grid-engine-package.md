# Wave 7 prep — `@skb/grid-engine` package + grid redesign design doc + UI theme prototype

> **Foundational redesign work** after cf-22/23/24/25 user critique
> ("grid is not done; you trusted v2 reference too much without UX
> discipline"). This PR does NOT change the existing editor — it lays
> the groundwork for wave-7 to do so.

## title

Lift the algorithm-validated `grid-engine` from a throwaway prototype
into a proper headless `@skb/grid-engine` package + capture the design
rationale in a long-form design doc + ship a UI prototype with 3
visual themes (Graph paper / LEGO studs / Bento canvas) to validate
the visual mental models before committing to implementation in the
real editor.

## files

- **NEW `packages/grid-engine/`** — headless 2D layout engine
  (no React, no CSS, no DOM). Exports: insert/move/resize/delete +
  applyGravity + inferDropIntent (hole-fill smart placement) +
  validateState. 34 vitest tests (24 unit + 5 property-based seeds ×
  2k random ops = 10k invariant checks). See `CONTRACT.md`.
- **NEW `docs/design/grid-redesign-2026-05-11.md`** — full design
  rationale: 2D LEGO mental model, AABB collision, per-block AABB
  upward gravity (Option A locked), CSS Grid as render impl detail,
  Theme contract spec, list of 6 lessons learned from cf-22/23/24/25.
- **NEW `apps/site/src/components/_grid-prototype/`** — throwaway UI
  prototype with 3 theme variants on a single `/grid-prototype` route,
  switchable via floating chip. User confirmed all 3 → become
  permanent themes (default `lego-studs`, per-user pref + per-doc
  frontmatter override).
- **NEW `apps/site/src/pages/grid-prototype.astro`** — mounts the
  prototype React island.
- MOD `tsconfig.json` — references new `packages/grid-engine`.
- MOD `apps/site/package.json` — adds `@skb/grid-engine` workspace dep.
- MOD `pnpm-lock.yaml` — regenerated.

## ui_touch

`true` — `apps/site/src/pages/grid-prototype.astro` is a new page
route + `apps/site/src/components/_grid-prototype/**.tsx` are new
React components. The route is a throwaway prototype (unlinked from
production UI; only accessible by URL) but technically lives under
`apps/site/src/pages/`.

## e2e_smoke

- flow: `/grid-prototype?variant={A,B,C}` mounts the React island
  for all 3 theme variants without hydration errors. Floating switcher
  chip is visible (proves React island hydrated). Zero JS errors in
  console.
  target_url: /grid-prototype
  playwright_spec: apps/site/playwright/grid-prototype-themes.spec.ts:"Wave 7 prep — /grid-prototype?variant=A mounts the React island without errors"
  assertions:
    - All 3 variants (A/B/C) mount without page errors
    - All 3 variants render the floating switcher chip (hydration proof)
    - No console.error during hydration

## Acceptance

executor: orchestrator-self (bootstrap scope per ADR-0011 hard rule
re: git mutation discipline; no codex executor required for package
extraction from already-validated prototype)
reviewer: CI gates (lint + typecheck + test + build + size-check +
lychee + e2e-coverage-check) + manual user review of the 3 prototype
variants
contract_changes: NEW package public surface — `@skb/grid-engine`
exports type-stable contract documented in CONTRACT.md
new_adr: NOT YET — ADR-0019 will follow after step B (interaction
prototype) validates the engine in a real interactive context. For
this PR the design doc serves as the pre-ADR spec.
risk_class: D2 row 2 (NEW package add) — but the package is purely
additive with no consumers in production code yet, so risk is
contained to the package itself + the throwaway prototype consumer.
PRE-COMMIT CLAUDE REVIEW skipped per bootstrap-scope rule.

## Out of scope

- ADR-0019 grid-engine contract lock (deferred until step B
  interaction prototype + UX validation completes)
- ADR amendment for ADR-0017 (drag/drop UX) or ADR-0018 (v2 visual
  contract) — deferred until cf-20c-1 `applyDropMode` is replaced
  by `@skb/grid-engine` ops in a follow-up wave-7 PR
- Editor integration — cf-22/23/24/25 paths
  (`applyDropMode` / `useProjectGridStyleToOuter` / `rowSpan='auto'`)
  remain in place. Step C of the wave-7 plan will replace them.
- Production theme switcher UI — current floating chip is throwaway;
  production version will live in editor toolbar or settings panel.
- Theme storage layer (localStorage + frontmatter override) —
  deferred to wave-7 step C alongside editor integration.

## Process

1. ✓ User flagged grid + UX gaps after cf-22/23/24/25
2. ✓ Brainstorm the 2D LEGO baseplate model (this conversation)
3. ✓ Throwaway algorithm prototype (`scripts/grid-engine-prototype/`,
   now deleted) validated 34/34 scenarios + 50k random op stress
4. ✓ Throwaway UI prototype (`apps/site/.../_grid-prototype/`) built
   3 visual variants; user confirmed all 3 → become themes
5. ✓ Lift engine to `packages/grid-engine/` + design doc captured
6. **THIS PR** — commit + CI gate
7. Step B: add interaction (drag/resize/delete) to prototype to
   validate UX feel per theme
8. Wave-7 PR sequence (multiple PRs): replace cf-20c-1 in production
   editor; then theme infrastructure; then per-doc theme override;
   then ADR-0019 lock
9. Delete prototype + this design doc gets superseded by ADRs

## Honest scope

26 files / +2382 LOC net add. Of those:
- `packages/grid-engine/` source + tests + CONTRACT.md = 14 files,
  ~1240 LOC
- design doc + PR.md = 2 files, ~520 LOC
- prototype = 8 files, ~700 LOC
- workspace wire (tsconfig + apps/site package.json + pnpm-lock) =
  3 files, ~14 LOC

**Risk**: very low — no consumer of grid-engine in production yet;
prototype is unlinked from production UI; existing editor unchanged.
