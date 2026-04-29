# Review checklist

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit `agent-contract.md` then run `pnpm generate:configs`.

This is the shared rubric for the review chain. Each section maps to one reviewer agent.

## Common invariants (every reviewer must verify)

- [ ] **No worker-side `git` mutating commands.** PRs containing `git commit` / `git push` / `git rebase` outside `git-operator` dispatches are rejected.
- [ ] **No worker-side `web_search` / `web_fetch`.** External web access must be sourced via researcher dispatch.
- [ ] **No cross-package moves outside `refactorer`.** Moves under `packages/*` or `apps/*` boundaries require an ADR + refactorer dispatch.
- [ ] **File size**: warn at 300 (ESLint), hard fail at 500 (`pnpm size-check`).
- [ ] **Cross-references**: all internal markdown links resolve (`pnpm link-check`).
- [ ] **Contracts in sync**: `packages/*/CONTRACT.md`, `agent-contract.md`, and code interfaces match.

Spec: §3.1 + §3.2 + §3.6 + §3.5.

## For code-reviewer (Codex 5.3-spark)

Default cheap line-level review. Output PASS / FAIL with concrete issues.

- [ ] **Types**: no `any` leakage; `unknown` narrowed at boundaries; `pnpm exec tsc -b` clean.
- [ ] **Lint**: `pnpm exec eslint .` produces no errors (warnings tolerated).
- [ ] **File size**: every changed file under 500 lines; aim for 200, warn at 300.
- [ ] **Contracts**: any change to `packages/*/CONTRACT.md` matches the implementation
      in the same PR (no orphan interface drift).
- [ ] **Module boundaries**: imports respect package boundaries (no reaching into another
      package's `src/internal/`); no circular deps introduced.
- [ ] **Style**: prettier-clean; no commented-out blocks; no leftover `console.log`.

## For pr-gate (Codex 5.5, high-risk only)

Triggered by: contract change, package add/remove, core arch touch, ADR-required PR,
CI/deploy/auth/security touch. Deep scan.

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

## For pr-reviewer (Claude)

Implementation quality, regression risk, spec match. Output APPROVE / REJECT + reasoning.

- [ ] **Spec compliance**: implementation matches the locked design spec (cite section).
- [ ] **Regression risk**: existing tests still cover the affected paths; no behavior change
      that would break a downstream package or doc snippet.
- [ ] **Architectural consistency**: change matches existing patterns; new patterns have an
      ADR under `docs/decisions/` if cross-cutting.
- [ ] **Cross-file impact**: every doc / cross-reference updated (`agent-contract.md` →
      regenerate; `CONTRACT.md` ↔ implementation; `docs/plans/` reflects status).
- [ ] **Tests**: `vitest` / `pytest` coverage for new behavior; no flaky timing-dependent
      assertions.

## Related

- [Review workflow — spec §3.2](superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-contract.md — single source](../agent-contract.md)
