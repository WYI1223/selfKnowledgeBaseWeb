# PR #2 — F3 resolution: block-code + block-image typed `THEME_TOKENS` (path b)

> First strict D1-pipeline PR (PR #1 was bootstrap exception). Stage discipline:
> PLAN (orchestrator-self for now until pr-writer subagent type is registered) →
> EXECUTE (orchestrator-self with TDD-front; codex-generic-executor profile not
> yet wired into user's `~/.codex/config.toml`) → REVIEW (codex 5.5 via `pr-gate`
> profile bash, transitional alias for `codex-pr-reviewer-55`) → COMMIT → ACCEPT.
> No D2 row 4 trigger (no new ADR); D2 row 1 trigger DOES fire (CONTRACT change
> in 2 packages) so D1 stage 4 PRE-COMMIT CLAUDE REVIEW runs.

## title

F3 resolution — `block-code` + `block-image` mirror `block-callout`'s typed
`ColorTokenName` import pattern (path b per ADR-0010 D3 #7a + structure-2026-05.md
§7 #1). Closes the first ADR-0008 D1 mechanical-scan violation (CSS-only
consumption of `@skb/design-tokens` not visible to grep-based dead-dep audit).

## files

Hand-edited (source code + CONTRACT updates):

- `packages/block-code/src/ui-default/theme-tokens.ts` *(NEW; mirrors
  `block-callout/src/ui-default/variant-tokens.ts` shape, single typed const)*
- `packages/block-code/src/ui-default/index.ts` *(re-export `CODE_THEME_TOKENS`)*
- `packages/block-code/src/__tests__/theme-tokens.test.ts` *(NEW; verifies
  manifest matches `code.css` consumption + types align with `ColorTokenName`)*
- `packages/block-code/CONTRACT.md` *(public surface += `CODE_THEME_TOKENS`;
  ADR-0008 D1 disclosure clause referencing F3 closure)*
- `packages/block-image/src/ui-default/theme-tokens.ts` *(NEW)*
- `packages/block-image/src/ui-default/index.ts` *(re-export `IMAGE_THEME_TOKENS`)*
- `packages/block-image/src/__tests__/theme-tokens.test.ts` *(NEW)*
- `packages/block-image/CONTRACT.md` *(public surface += `IMAGE_THEME_TOKENS`;
  same D1 disclosure clause)*
- `docs/plans/wave-3-prep/PR-2-f3-typed-tokens.md` *(this PR.md per ADR-0006 D8
  strict-whitelist self-listing — R2 lesson from PR #1)*

`docs/plans/active.md` is **deliberately NOT touched in this PR** — Wave 3 起手
必先解决 #1/#2/#3 status + Wave 3 stage list all roll up into a single active.md
update at session end (alongside Wave 3 plan lock).

NO auto-regenerated files (no agent-contract.md change).

## test_cases

TDD-front: tests written + failing first, then impl.

- **TC1** `packages/block-code/src/__tests__/theme-tokens.test.ts`:
  - input: `import { CODE_THEME_TOKENS } from '../ui-default'`
  - expected: `CODE_THEME_TOKENS` is a frozen object whose values are valid
    `ColorTokenName` literals; covers every `var(--color-*)` reference grep-able
    in `packages/block-code/src/ui-default/code.css`
  - location: `packages/block-code/src/__tests__/theme-tokens.test.ts` (NEW)
- **TC2** `packages/block-image/src/__tests__/theme-tokens.test.ts`:
  - input: `import { IMAGE_THEME_TOKENS } from '../ui-default'`
  - expected: same shape; `image.css` consumption covered
  - location: `packages/block-image/src/__tests__/theme-tokens.test.ts` (NEW)
- **TC3** ADR-0008 D1 mechanical scan compliance:
  - input: grep `from '@skb/design-tokens'` over `packages/block-code/src/`
  - expected: ≥ 1 hit (currently 0)
  - location: verified by manual `grep -rn` post-impl + structure-auditor
    next-month sweep
- **TC4** ADR-0008 D1 mechanical scan for block-image (mirror of TC3)
- **TC5** Cross-package consumer pattern parity vs block-callout:
  - input: `block-callout/src/ui-default/variant-tokens.ts` shape
  - expected: block-code + block-image new `theme-tokens.ts` files share the
    same `import type { ColorTokenName } from '@skb/design-tokens'` line +
    use `ColorTokenName` as the constraint type (not raw string)
  - location: visual diff during D1 stage 4 review
- **TC6** `pnpm test --filter=@skb/block-code` + `--filter=@skb/block-image`
  PASS; no existing test regressed

## contracts_affected

- `packages/block-code/CONTRACT.md` — public surface += `CODE_THEME_TOKENS`
- `packages/block-image/CONTRACT.md` — public surface += `IMAGE_THEME_TOKENS`
- ADR-0008 D1 mechanical scan invariant — F3 violation closed; structure-auditor
  next-month sweep should report 0 violations across all 20 packages

## adr_touched

None (no new ADR required; F3 was an empirically-surfaced edge case to
ADR-0008 D1, and gatekeeper 2026-05-01 locked path (b) without amending the ADR).

## acceptance

1. `packages/block-code/src/ui-default/theme-tokens.ts` exists; exports a
   `CODE_THEME_TOKENS` const typed against `ColorTokenName`; documentation
   comment cites ADR-0010 D3 #7a F3 + ADR-0008 D1.
2. `packages/block-image/src/ui-default/theme-tokens.ts` exists; mirror of #1.
3. `grep -rn "from '@skb/design-tokens'" packages/block-code/src/` returns
   ≥ 1 hit (the new import in theme-tokens.ts).
4. `grep -rn "from '@skb/design-tokens'" packages/block-image/src/` returns
   ≥ 1 hit.
5. Both new tests in `__tests__/theme-tokens.test.ts` PASS.
6. `pnpm check` (lint + typecheck + test + build + size + lint:packages +
   typecheck:packages + test:packages) returns 0.
7. `packages/block-code/CONTRACT.md` "Public surface" lists
   `CODE_THEME_TOKENS`; "Forward-compat" or "Modifying this file" cross-links
   ADR-0008 D1 + ADR-0010 D3 #7a.
8. `packages/block-image/CONTRACT.md` mirrors #7.
9. No file outside the `files:` whitelist changes (scope creep guard).

## executor

- **PLAN**: orchestrator-self (pr-writer subagent type not yet registered in
  Claude Code installation; bootstrap-style PLAN until next session or
  user-driven subagent registration).
- **EXECUTE**: orchestrator-self (TDD-front: tests first → impl). Note: future
  PRs use `codex-generic-executor` profile once user merges
  `tmp/codex-profiles.toml` → `~/.codex/config.toml`.
- **REVIEW**: codex 5.5 via current `pr-gate` profile bash (transitional alias
  for `codex-pr-reviewer-55` until user TOML merge). Audit log:
  `.codex-runs/wave-3-prep/PR-2-review.txt`.
- **D2 PRE-COMMIT CLAUDE REVIEW (row 1 hits)**: orchestrator-self.
- **COMMIT**: orchestrator-self (transitional; codex commit-phase not yet
  active — user TOML merge pending). Per ADR-0006 D8 explicit-list staging.
- **ACCEPT**: orchestrator-self.

## D2 trigger judgment (orchestrator-locked at PLAN)

- Row 1 (CONTRACT change in `block-code/CONTRACT.md` + `block-image/CONTRACT.md`):
  **HIT**.
- Row 4 (new ADR required): NOT HIT. F3 was deferred from ADR-0010 with
  pre-locked path (b); no new ADR needed.
- Row 5 (cross ≥ 3 packages): NOT HIT. Touches 2 packages directly
  (block-code + block-image); design-tokens consumption pattern is unchanged
  (CSS still primary; TS import is supplementary).

→ codex 5.5 review (existing `pr-gate` profile) + Claude pre-commit review
(orchestrator self, D1 stage 4).

## Out-of-scope (explicitly deferred)

- block-image/CONTRACT.md line 3-4 stale prose claiming "第一个真实
  BlockRegistry 消费者 (C1 template)" — actually block-callout's role.
  Copy-paste artifact from clone. Defer to a doc cleanup PR; do NOT touch in
  PR #2 (scope discipline; `files:` whitelist limits).
- ADR-0008 D1 amendment to recognize CSS-variable consumption (path c per
  structure-2026-05.md §7 #1). Path (b) is sufficient for the immediate
  violation; if future blocks repeatedly hit this, revisit ADR-0008.

## Related

- [ADR-0008 D1](../../decisions/ADR-0008-wave-2-entry-policies.md) — dead-dep policy
- [ADR-0010 D3 #7a](../../decisions/ADR-0010-wave-2-close.md) — F3 finding +
  resolution paths
- [structure-2026-05.md §7 #1](../../audits/structure-2026-05.md) — F3
  recommendation table
- [block-callout/src/ui-default/variant-tokens.ts](../../../packages/block-callout/src/ui-default/variant-tokens.ts)
  — pattern source
- [active.md](../active.md) — Wave 3 起手必先解决 #2
