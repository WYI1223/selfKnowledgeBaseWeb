# Wave 7 — ADR-0020 grid-engine contract + Theme spec lock

> Doc-only PR. Locks the `@skb/grid-engine` public contract + Theme
> interface spec so Phase 1 (PR #123 `@skb/grid-themes`) can build
> against a stable target. Per Wave 7 plan (PR #120 + #121 prep done;
> ADR before Phase 1 implementation).

## title

Lock the grid-engine contract + Theme spec as ADR-0020. Captures 9
locked decisions (D1-D9) covering data model, op contract, gravity
(Option A locked with opt-out), drop intent + hole-fill, default
kind sizes, headless isolation, Theme interface (closed v1 registry
with extensible API shape), theme storage (per-user + per-doc hybrid),
and theme switcher UX (floating chip, production fold).

## files

- `docs/decisions/ADR-0020-grid-engine-contract.md` — NEW (~280 LOC)
  - 9 locked decisions (D1-D9)
  - Implementation phases mapped to specific PR numbers (#120-#127)
  - Sister-doc cross-refs (ADR-0016 / 0017 / 0018; design doc;
    CONTRACT.md)
- `docs/plans/wave-7-main/wave-7-adr-0020-grid-engine-contract.md`
  — NEW (this file)

## ui_touch

`false` — pure documentation. No `apps/site/src/` or `packages/`
runtime changes. CI check-e2e-coverage.ts will compute ui_touch=false
based on path patterns.

## e2e_smoke

N/A — no UI changes.

## Acceptance

executor: orchestrator-self (doc-only)
reviewer: CI gates (lint + lychee + size-check); no codex review
needed for ADR doc
contract_changes: NEW ADR locking pre-existing engine contract +
NEW Theme interface spec
new_adr: ADR-0020 (this PR)
risk_class: D2 row 4 (ADR add) — but doc-only with no runtime impact.
PRE-COMMIT CLAUDE REVIEW skipped per bootstrap-scope rule.

## Out of scope

- `@skb/grid-themes` package — PR #123 (Phase 1 implementation)
- Editor migration — Phase 2 (PR #125-127)
- Prototype cleanup — Phase 3 (PR #127)
- ADR-0017 amendment to deprecate `applyDropMode` — Phase 3 (PR #127);
  this ADR notes the future amendment but doesn't apply it yet

## Notes

ADR cross-refs the merged PR #120 + #121 as evidence of validation.
The 3 user-feedback fixes from PR #121 (maxEmptyRectContaining,
transformBlock, OpOptions.gravity) are now part of the locked
contract (D2, D3, D4).
