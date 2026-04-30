/**
 * Renders docs/review-checklist.md — shared rubric for reviewers.
 */

const CONTENT = `# Review checklist

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit \`agent-contract.md\` then run \`pnpm generate:configs\`.

This is the shared rubric for the review chain. Each section maps to one reviewer agent.

## Common invariants (every reviewer must verify)

- [ ] **No worker-side \`git\` mutating commands.** PRs containing \`git commit\` / \`git push\` / \`git rebase\` outside \`git-operator\` dispatches are rejected.
- [ ] **No worker-side \`web_search\` / \`web_fetch\`.** External web access must be sourced via researcher dispatch.
- [ ] **No cross-package moves outside \`refactorer\`.** Moves under \`packages/*\` or \`apps/*\` boundaries require an ADR + refactorer dispatch.
- [ ] **File size**: warn at 300 (ESLint), hard fail at 500 (\`pnpm size-check\`).
- [ ] **Cross-references**: all internal markdown links resolve (\`pnpm link-check\`).
- [ ] **Contracts in sync**: \`packages/*/CONTRACT.md\`, \`agent-contract.md\`, and code interfaces match.

Spec: §3.1 + §3.2 + §3.6 + §3.5.

## ADR-0006 asymmetry-audit checklist (mandatory for code-reviewer + pr-gate)

Apply each item that is in scope for the PR; explicitly skip items that are not (e.g. item #2 "status code" doesn't apply to TS-only packages). Reviewer verdict structure MUST include \`asymmetry-audit applied: items {1..8} verdicts: ...\`. See [ADR-0006](decisions/ADR-0006-asymmetry-audit-checklist.md) for empirical evidence + full rationale per item.

- [ ] **#1 Field/attribute audit**: After adding a field to a data shape, audit every comparator/equality/serialization function for that field.
- [ ] **#2 Status code audit**: After adding a status code to one handler, audit every other handler emitting the same code; RFC-mandated headers (RFC 7235 \`WWW-Authenticate\`, RFC 7231 \`Allow\`) attach to the status code itself.
- [ ] **#3 Strictness audit**: After adding \`.strict()\` / \`extra='forbid'\` at one level, audit every nested object/sub-schema (strictness does not propagate).
- [ ] **#4 Consumer schema audit**: After defining a schema in a single-authority package, audit every consumer for inline duplicates; "deferred swap" is a contract break.
- [ ] **#5 Algorithm + runtime constant replication audit**: When an algorithm or constant is replicated outside its authority (inline FOUC scripts, login challenge derivation, etc.), audit consumer-side replicas for byte-equivalent reproduction; replica MUST register a regression test against the authority's input corpus.
- [ ] **#6 Sister-file documentation audit**: After updating one CONTRACT.md (or analogous document), audit ALL related CONTRACT.md files for sister-file drift; shared identifiers must use identical terminology across both halves of the contract.
- [ ] **#7 Exception-scope equivalence audit**: When replicating an algorithm + its exception handling, audit BOTH happy-path semantics AND \`try/catch\` scope between authority and replica; narrow vs wide try/catch can produce divergent fall-through behavior.
- [ ] **#8 Authority-document → generated/consumed surface audit**: When updating an authority document (ADR, spec, \`agent-contract.md\`, runbook, CONVENTIONS) that mandates downstream behavior, audit every consumer-side replica/generated artifact in the same commit; regenerate codegen outputs (\`pnpm generate:configs\`); cross-link runbooks; embed in subagent prompts.

\`pr-gate\` MUST additionally hunt for an 8th-class instance beyond the cited fix (Wave 1 evidence: pr-gate caught one extra asymmetry per round on every Wave 1 high-risk PR).

## For code-reviewer (Codex 5.3-spark)

Default cheap line-level review. Output PASS / FAIL with concrete issues.

- [ ] **Types**: no \`any\` leakage; \`unknown\` narrowed at boundaries; \`pnpm exec tsc -b\` clean.
- [ ] **Lint**: \`pnpm exec eslint .\` produces no errors (warnings tolerated).
- [ ] **File size**: every changed file under 500 lines; aim for 200, warn at 300.
- [ ] **Contracts**: any change to \`packages/*/CONTRACT.md\` matches the implementation
      in the same PR (no orphan interface drift).
- [ ] **Module boundaries**: imports respect package boundaries (no reaching into another
      package's \`src/internal/\`); no circular deps introduced.
- [ ] **Style**: prettier-clean; no commented-out blocks; no leftover \`console.log\`.

## For pr-gate (Codex 5.5, high-risk only)

Triggered by: contract change, package add/remove, core arch touch, ADR-required PR,
CI/deploy/auth/security touch. Deep scan.

- [ ] **Vulnerabilities**: no obvious injection / XSS / SSRF / deserialization sinks; secrets
      never read from request bodies; HTTP responses don't leak internal state.
- [ ] **Cross-package side effects**: changes to one package don't silently break another
      (especially \`block-foundation\`, \`mdx-bridge\`, \`kernel-adapter\` consumers).
- [ ] **Supply chain**: any new dependency vetted for maintenance status, license, and
      transitive risk; no abandoned forks.
- [ ] **Lockfile integrity**: \`pnpm-lock.yaml\` change is consistent with \`package.json\`
      diffs; no unexplained version churn; no peer-dep warnings worsened.
- [ ] **Auth / boundary**: no permission expanded silently (e.g. router exposing previously
      private route); CSRF / SameSite still enforced; no \`eval\` / \`Function\` constructor.

## For pr-reviewer (Claude)

Implementation quality, regression risk, spec match. Output APPROVE / REJECT + reasoning.

- [ ] **Spec compliance**: implementation matches the locked design spec (cite section).
- [ ] **Regression risk**: existing tests still cover the affected paths; no behavior change
      that would break a downstream package or doc snippet.
- [ ] **Architectural consistency**: change matches existing patterns; new patterns have an
      ADR under \`docs/decisions/\` if cross-cutting.
- [ ] **Cross-file impact**: every doc / cross-reference updated (\`agent-contract.md\` →
      regenerate; \`CONTRACT.md\` ↔ implementation; \`docs/plans/\` reflects status).
- [ ] **Tests**: \`vitest\` / \`pytest\` coverage for new behavior; no flaky timing-dependent
      assertions.

## Related

- [Review workflow — spec §3.2](superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-contract.md — single source](../agent-contract.md)
`;

export function renderReviewChecklist(): string {
  return CONTENT;
}
