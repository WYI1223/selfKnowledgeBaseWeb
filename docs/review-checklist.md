# Review checklist

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit `agent-contract.md` then run `pnpm generate:configs`.

Shared rubric for the ADR-0011 D1 linear pipeline review stage 3 (codex-pr-reviewer-55)
and stage 4 (orchestrator self pre-commit Claude review on D2 row 1+4 hits).

## Common invariants (every reviewer must verify)

- [ ] **Git mutation discipline (ADR-0011 D1+D4)**: `git commit / branch / rebase / push`
      appears only at D1 stage 5 (reviewer codex commit phase) or in orchestrator-self
      bootstrap scope. PRs with mutating git from any other source are rejected.
- [ ] **No subagent-side `web_search` / `web_fetch`**: only the `researcher` Claude
      subagent may source external info.
- [ ] **No cross-package moves outside `refactorer`**: moves under `packages/*` or
      `apps/*` boundaries require an ADR + `refactorer` Claude subagent dispatch.
- [ ] **File size**: warn at 300 (ESLint), hard fail at 500 (`pnpm size-check`).
- [ ] **Cross-references**: all internal markdown links resolve (`pnpm link-check`).
- [ ] **Contracts in sync**: `packages/*/CONTRACT.md`, `agent-contract.md`, and code interfaces match.
- [ ] **PR.md `test_cases:` non-empty** (ADR-0011 D2): TDD-front; executor self-ran vitest all PASS before review.
- [ ] **PR.md `acceptance:` block satisfied**: every listed item observable in the diff.

Spec: §3.1 + §3.2 + §3.6 + §3.5. ADR-0011 D1+D2.

## ADR-0006 asymmetry-audit checklist (mandatory for codex-pr-reviewer-55)

Apply each item that is in scope for the PR; explicitly skip items that are not (e.g. item #2 "status code" doesn't apply to TS-only packages). Reviewer verdict structure MUST include `asymmetry-audit applied: items {1..9} verdicts: ...`. See [ADR-0006](decisions/ADR-0006-asymmetry-audit-checklist.md) for empirical evidence + full rationale per item.

- [ ] **#1 Field/attribute audit**: After adding a field to a data shape, audit every comparator/equality/serialization function for that field.
- [ ] **#2 Status code audit**: After adding a status code to one handler, audit every other handler emitting the same code; RFC-mandated headers (RFC 7235 `WWW-Authenticate`, RFC 7231 `Allow`) attach to the status code itself.
- [ ] **#3 Strictness audit**: After adding `.strict()` / `extra='forbid'` at one level, audit every nested object/sub-schema (strictness does not propagate).
- [ ] **#4 Consumer schema audit**: After defining a schema in a single-authority package, audit every consumer for inline duplicates; "deferred swap" is a contract break.
- [ ] **#5 Algorithm + runtime constant replication audit**: When an algorithm or constant is replicated outside its authority (inline FOUC scripts, login challenge derivation, etc.), audit consumer-side replicas for byte-equivalent reproduction; replica MUST register a regression test against the authority's input corpus.
- [ ] **#6 Sister-file documentation audit**: After updating one CONTRACT.md (or analogous document), audit ALL related CONTRACT.md files for sister-file drift; shared identifiers must use identical terminology across both halves of the contract.
- [ ] **#7 Exception-scope equivalence audit**: When replicating an algorithm + its exception handling, audit BOTH happy-path semantics AND `try/catch` scope between authority and replica; narrow vs wide try/catch can produce divergent fall-through behavior.
- [ ] **#8 Authority-document → generated/consumed surface audit**: When updating an authority document (ADR, spec, `agent-contract.md`, runbook, CONVENTIONS) that mandates downstream behavior, audit every consumer-side replica/generated artifact in the same commit; regenerate codegen outputs (`pnpm generate:configs`); cross-link runbooks; embed in subagent prompts.
- [ ] **#9 UI-touch + E2E spec audit (v0.2 amendment, ADR-0011 D9)**: When PR diff touches user-facing UI surfaces per [ADR-0011 D9.1](decisions/ADR-0011-linear-pipeline-execution-model.md) path patterns (with the v0.2.1 `apps/site/src/pages/api/**` server-only exclusion), reviewer MUST verify (a) PR.md `ui_touch: true` + non-empty `e2e_smoke`, (b) every `e2e_smoke` entry's `playwright_spec` file exists with resolvable test name, (c) `pnpm --filter @skb/site test:visual` PASSES, (d) every `screenshot_archive` exists with file size ≥ 5KB. CI gate `scripts/check-e2e-coverage.ts` + `scripts/check-screenshot-archive.ts` enforces (a)+(b)+(d) mechanically; reviewer manual verifies (c). **Stage close-ceremony 加强 (v0.2.2 amendment, ADR-0011 D9.8)**: a stage's close-ceremony PR (the last PR of the stage's sequence the handoff pack ratifies) MUST exercise a real production fixture (e.g. `content/notes/sample-blocks` covering all 8 component-block tags + author comments + inline marks + markdown links) OR a dedicated `__test_smoke__` fixture that enumerates the same MDX feature surface by construction. Synthetic prose-only close-ceremony fixtures are explicitly insufficient. Mid-stage PRs unaffected.

`codex-pr-reviewer-55` MUST additionally hunt for an 9th-class instance beyond the cited fix (Wave 1+2 evidence: 5.5-deep review caught one extra asymmetry per round on every high-risk PR).

## For `codex-pr-reviewer-55` (Codex 5.5, D1 stage 3 default reviewer)

Unified reviewer profile post ADR-0011 D6 (replaces Wave 2's `code-reviewer` 5.3-spark
+ `pr-gate` 5.5 split). Output PASS / FAIL with concrete issues.

- [ ] **Types**: no `any` leakage; `unknown` narrowed at boundaries; `pnpm exec tsc -b` clean.
- [ ] **Lint**: `pnpm exec eslint .` produces no errors (warnings tolerated).
- [ ] **File size**: every changed file under 500 lines; aim for 200, warn at 300.
- [ ] **Contracts**: any change to `packages/*/CONTRACT.md` matches the implementation
      in the same PR (no orphan interface drift).
- [ ] **Module boundaries**: imports respect package boundaries (no reaching into another
      package's `src/internal/`); no circular deps introduced.
- [ ] **Style**: prettier-clean; no commented-out blocks; no leftover `console.log`.
- [ ] **Vulnerabilities**: no obvious injection / XSS / SSRF / deserialization sinks; secrets
      never read from request bodies; HTTP responses don't leak internal state.
- [ ] **Cross-package side effects**: changes to one package don't silently break another
      (especially `block-foundation`, `mdx-bridge`, `kernel-adapter` consumers).
- [ ] **Supply chain**: any new dependency vetted for maintenance status, license, and
      transitive risk; no abandoned forks.
- [ ] **Lockfile integrity**: `pnpm-lock.yaml` change is consistent with `package.json`
      diffs; no unexplained version churn; no peer-dep warnings worsened.
- [ ] **Auth / boundary**: no permission expanded silently (e.g. router exposing previously
      private route); CSRF / SameSite still enforced; no `eval` / `Function` constructor.

## For Claude pre-commit review (orchestrator self, D1 stage 4)

Triggered only when ADR-0007 D2 row 1 (contract change) OR row 4 (new ADR required) hits.
Mitigates same-model echo chamber when stages 2+3 are both codex 5.5. Output APPROVE /
REJECT + reasoning.

- [ ] **Spec compliance**: implementation matches the locked design spec (cite section).
- [ ] **Regression risk**: existing tests still cover the affected paths; no behavior change
      that would break a downstream package or doc snippet.
- [ ] **Architectural consistency**: change matches existing patterns; new patterns have an
      ADR under `docs/decisions/` if cross-cutting.
- [ ] **Cross-file impact**: every doc / cross-reference updated (`agent-contract.md` →
      regenerate; `CONTRACT.md` ↔ implementation; `docs/plans/` reflects status).
- [ ] **Tests**: `vitest` / `pytest` coverage for new behavior; no flaky timing-dependent
      assertions.
- [ ] **PR.md `acceptance:` block** (ADR-0011 D2): every item observable in the diff;
      no scope creep beyond `files:` whitelist.

## Related

- [Review workflow — spec §3.2](superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-contract.md — single source](../agent-contract.md)
