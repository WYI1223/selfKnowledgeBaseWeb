# PR #3 — viz-block test-corpus invariant prose (3 CONTRACTs)

> Doc-only PR per ADR-0011 D1 strict pipeline. Closes structure-2026-05.md §7
> recommendation #2: 3 viz-block test files (414 / 327 / 326 lines) cross the
> 300-line ESLint warn threshold; pre-allowlist via per-package CONTRACTs
> documenting them as cross-runtime state-machine authority. ESLint config
> (`eslint.config.js:39-40`) already exempts `**/*.test.*` from `max-lines`,
> so no rule changes are needed — this PR is purely the documentary layer
> (ADR-0006 #6 sister-file CONTRACT discipline + #5 algorithm-replication
> authority pattern).

## title

viz-block test-corpus invariant prose — `block-jupyter` / `block-nn-viz` /
`block-agent-flow` CONTRACT.md add a "Test corpus" section naming the
cross-runtime bridge test files as state-machine authority. Mirrors
`mdx-bridge/CONTRACT.md` "Implementation notes" precedent for the 243-line
`serialize.ts`.

## files

Hand-edited (3 CONTRACT.md additions; doc-only):

- `packages/block-jupyter/CONTRACT.md` *(new "Test corpus invariants"
  section: kernel-bridge.test.ts (414) is Pyodide message-event mapping
  authority)*
- `packages/block-nn-viz/CONTRACT.md` *(new section: tfjs-bridge.test.ts
  (327) is TF.js LayersModel lifecycle authority)*
- `packages/block-agent-flow/CONTRACT.md` *(new section: flow-bridge.test.ts
  (326) is React Flow phase-machine authority)*
- `docs/plans/wave-3-prep/PR-3-viz-test-corpus.md` *(this PR.md per ADR-0006
  D8 strict-whitelist self-listing)*

NO test files changed; NO source files changed; NO ADR/spec changed.

## test_cases

Doc-only PR. The "tests" here are quality assertions runnable via existing
toolchain:

- **TC1** Section symmetry: each of the 3 new CONTRACT.md additions shares
  the same heading "## Test corpus invariants" + identical structural
  template (filename / line count / authority claim / drift-detection
  invariant + ADR-0006 #5 cross-link). Verified by visual diff during
  D1 stage 4 review.
- **TC2** `pnpm link-check` (lychee) — every internal link in the 3 new
  sections must resolve.
- **TC3** `pnpm size-check`: 0 violations (none expected; doc-only).
- **TC4** `pnpm lint` 0 errors (none expected; markdown).
- **TC5** `pnpm typecheck` 0 errors (none expected; no .ts touched).
- **TC6** Cross-package symmetry (ADR-0006 #6): the 3 added sections cite
  ADR-0006 #5 (algorithm + runtime constant replication audit) using
  identical wording mod package name.

No vitest cases (this is doc work). The covered-by-tests claim is structural
existence: each test file already EXISTS and PASSES at HEAD; the CONTRACT
additions document them.

## contracts_affected

- `packages/block-jupyter/CONTRACT.md`
- `packages/block-nn-viz/CONTRACT.md`
- `packages/block-agent-flow/CONTRACT.md`

No external CONTRACT consumers affected (no public-surface change).

## adr_touched

None. Pre-allowlist precedent already exists in `mdx-bridge/CONTRACT.md`
"Implementation notes" + 5-throw-site documentation; this PR replicates the
same documentary discipline for viz-block 300-line+ test corpora.

## acceptance

1. Each of the 3 viz-block CONTRACT.md files has a new "## Test corpus
   invariants" section that:
   - Names the bridge test file by relative path
   - Cites the line count
   - Declares it the cross-runtime state-machine authority for the
     respective runtime (Pyodide / TF.js / React Flow)
   - Names the invariants the corpus owns (phase transitions / lifecycle /
     error propagation / disposal)
   - Cross-links ADR-0006 #5 (single-authority replication audit)
2. The three new sections share an identical wording template (sister-file
   symmetry per ADR-0006 #6) — only the package-specific runtime / file /
   line-count varies.
3. `pnpm link-check` passes (no broken internal links).
4. `pnpm check` exit 0.
5. No file outside the `files:` whitelist changes (scope guard).
6. structure-auditor next-month sweep should mark the 3 files as
   "CONTRACT-disclosed" (no longer drift candidates).

## executor

- **PLAN**: orchestrator-self.
- **EXECUTE**: orchestrator-self (3 simple Edit operations on existing
  CONTRACT.md files; codex-generic-executor profile not yet wired into
  user's TOML).
- **REVIEW**: codex 5.5 via current `pr-gate` profile bash (transitional
  alias for `codex-pr-reviewer-55`). Audit log:
  `.codex-runs/wave-3-prep/PR-3-review.txt`.
- **D2 PRE-COMMIT CLAUDE REVIEW (row 1 hits — CONTRACT change in 3
  packages)**: orchestrator-self.
- **COMMIT**: orchestrator-self (transitional). ADR-0006 D8 explicit-list.
- **ACCEPT**: orchestrator-self.

## D2 trigger judgment (orchestrator-locked at PLAN)

- Row 1 (CONTRACT change in 3 packages): **HIT**.
- Row 4 (new ADR): NOT HIT.
- Row 5 (cross ≥ 3 packages): **HIT** (3 packages directly touched). But
  per ADR-0011 D1 stage 4 trigger language (rows 1+4 only), row 5 does NOT
  fire stage 4 PRE-COMMIT CLAUDE; it fires "heightened codex stage 3
  scrutiny". Row 1 hit DOES fire stage 4 — orchestrator runs pre-commit
  Claude review of the 3 CONTRACT diffs.

→ codex 5.5 review (existing `pr-gate` profile) + Claude pre-commit review
(orchestrator self, D1 stage 4).

## Out-of-scope (explicitly deferred)

- ESLint per-file `max-lines` override for the 3 test files: NOT NEEDED.
  `eslint.config.js:39-40` already exempts `**/*.test.{ts,tsx,js,mjs}`
  globally. The 300-line warn was a structure-auditor 软 alert, not an
  active lint warning. PR #3 documents the corpus authority; no rule
  config change.
- mdx-bridge `serialize.ts` (243 lines, Wave 1 carry-over): already
  CONTRACT-disclosed in `mdx-bridge/CONTRACT.md` "Implementation notes"
  + "Fail-loud rule" + "exactly five enforced throw sites" segments. No
  edit here.
- block-image/CONTRACT.md line 3-4 stale boilerplate (carried from PR #2
  out-of-scope list). Doc-cleanup PR (post Wave 3 plan-draft).

## Related

- [structure-2026-05.md §7 #2](../../audits/structure-2026-05.md) — the
  recommendation this PR addresses
- [ADR-0006 #5](../../decisions/ADR-0006-asymmetry-audit-checklist.md) —
  algorithm + runtime constant replication audit pattern
- [ADR-0006 #6](../../decisions/ADR-0006-asymmetry-audit-checklist.md) —
  sister-file CONTRACT drift discipline
- [mdx-bridge/CONTRACT.md](../../../packages/mdx-bridge/CONTRACT.md) — the
  CONTRACT-disclosure pattern source (Wave 1 carry-over, 243-line
  serialize.ts + 5 throw sites)
- [eslint.config.js:39-40](../../../eslint.config.js) — test files exempted
  from `max-lines`
- [active.md](../active.md) — Wave 3 起手必先解决 #3 (deferred to
  session-end consolidation)
