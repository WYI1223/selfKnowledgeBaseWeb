# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 2 ✅ closed by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) (2026-05-01) → ADR-0011 accepted (2026-05-01) → **Wave 3 prep ✅ closed (2026-05-01) — 3 PRs merged + Wave 3 plan locked → Wave 3 main execution ready to begin (next session)**.

Hand-off artifacts for the next session:
- [docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md](../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) — locked Wave 3 plan (24 PRs across Pre-A + 4 stages, plan-challenger R2 PASS)
- [ADR-0011 D1-D8](../decisions/ADR-0011-linear-pipeline-execution-model.md) — Wave 3+ execution model (linear pipeline, codex-heavy, single long-term Claude session)
- `git log` since `8dbedaf` — Wave 3 prep commit history (PR #1 / PR #2 / PR #3)

Wave 1 ✅ closed (2026-04-30, HEAD `b5e7217`) by [ADR-0002](../decisions/ADR-0002-wave-1-close.md);
Wave 2 ✅ closed (2026-05-01, HEAD `51789a1`) by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) — 17 main tracks + 33 commits + 9 new packages + 6 cross-package single-authority invariants + 11 WE-* process learnings codified.

Wave 3 prep PR roster (2026-05-01, all merged via GitHub PR workflow):

| PR | HEAD | Scope | Files / LOC |
|---|---|---|---|
| #1 | `243a56e` (squash via merge `8dbedaf`) | ADR-0011 D-list implementation — agent-contract.md restructure (20→5 agents + 8→11 tool_patterns) + downstream auto-regen | 36 / +1173 -973 |
| #2 | `c604efa` | F3 closure — block-code + block-image typed `THEME_TOKENS` (path b mirroring block-callout `VARIANT_TOKENS`) | 9 / +393 -2 |
| #3 | `dda11ca` | viz-block test-corpus invariant prose (block-jupyter / block-nn-viz / block-agent-flow CONTRACT.md) | 4 / +269 -0 |

**Wave 2 + Wave 3-prep architecture ADR roster**:

- [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) Wave 2 entry policies — dead-dep policy (F3 closed by Wave 3 prep PR #2)
- [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union
- [ADR-0010](../decisions/ADR-0010-wave-2-close.md) Wave 2 close
- [ADR-0011](../decisions/ADR-0011-linear-pipeline-execution-model.md) Linear-pipeline execution model (implemented by Wave 3 prep PR #1)

**结构 baseline**: [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md). Next sweep should report 0 ADR-0008 D1 violations (down from 2; F3 closed by PR #2) + viz-block test corpora CONTRACT-disclosed (PR #3).
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md) (post-ADR-0011 partial stale-flag in top banner; full rewrite is a Wave 3 deferred follow-up)

---

## 起手指引（next session 拉到此文件后开始 Wave 3 main execution）

Wave 3 plan locked at [docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md](../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md).

### Pre-flight (every session start)

1. 读 [ADR-0011 D1-D8](../decisions/ADR-0011-linear-pipeline-execution-model.md) — execution model (linear pipeline, PR strict serial, codex 5.5 dual role, single long-term Claude session)
2. 读 the locked Wave 3 plan ↑ — Pre-A + 4 stages (A=5 / B=8 / C=6 / D=4 PRs = 24 total) + Risk Grid (D2 trigger summary with depends_on column)
3. 读 [structure-2026-05.md §7](../audits/structure-2026-05.md) — Wave 3 prep concerns (#1 F3 closed; #2 viz prose closed; #3 sample-blocks page goes live in Stage C3)
4. **Pre-A1 first** — run `pnpm generate:configs && grep '^\[profiles\.' ~/.codex/config.toml` to verify the user's `~/.codex/config.toml` has the 7 ADR-0011 D6 profiles (`scaffolder`, `plan-challenger`, `codex-pr-reviewer-55`, `generic-executor`, `structure-auditor`, `perf-auditor`, `mdx-doctor`). If the user hasn't merged `tmp/codex-profiles.toml` → `~/.codex/config.toml` yet, prompt them to do so before Stage A starts. (Transitional fallback: continue using current `pr-gate` profile bash for review until merged.)

### Wave 3 D1 pipeline execution (per PR)

For each of the 24 PRs in stage order (Pre-A1 → A1 → A2 → ... → D3):

1. **PLAN**: pr-writer Claude subagent expands the plan's per-PR entry into ADR-0011 D2 schema PR.md (`title` / `files` / `test_cases` / `contracts_affected` / `adr_touched` / `acceptance` / `executor`). Save under `docs/plans/wave-3/PR-<id>.md`. Iterate 0-2 rounds with orchestrator → lock.
2. **EXECUTE**: dispatch `executor` per PR.md (`codex-generic-executor` for most; `codex-block-generator` / `codex-test-scaffolder` / `codex-script-builder` for clone work; `ux-ui-lead` Claude subagent for UI/UX-heavy work). Executor writes tests first (TDD-front per ADR-0011 D2) → impl → self-runs vitest all PASS.
3. **REVIEW**: dispatch `codex-pr-reviewer-55` (5.5; via `codex exec --profile codex-pr-reviewer-55 < /dev/null`). Apply ADR-0006 8-point checklist + 8th-class hunt. Issues → loop back to executor.
4. **D2 stage 4 PRE-COMMIT CLAUDE REVIEW** (only if D2 row 1+4 hits per Risk Grid): orchestrator self runs review against PR.md acceptance + diff.
5. **COMMIT**: reviewer codex commit phase per ADR-0006 D8 explicit-file-list staging. (Transitional: orchestrator commits during Wave 3 main if user TOML merge not complete.)
6. **ACCEPT**: pr-writer Claude subagent (second dispatch) verifies diff against PR.md acceptance.
7. Open GH PR (feature branch workflow per user 2026-05-01 lock); CI 8 jobs must pass; squash-merge.

PR-strict-serial — next PR's PLAN waits for current PR's ACCEPT.

### Wave 3 close (post D3 ACCEPT)

Per the locked plan's "Wave 3 close ceremony" section:
- ADR-0013 Wave 3 close (errata + cross-package invariants + WE-* additions; Wave 3 prep retrospective evidence)
- structure-auditor monthly audit `docs/audits/structure-2026-06.md` (or -07)
- active.md repointed to Wave 4 plan-draft (Wave 4 backlog: ADR-0010 D7 #1 attr-bearing marks + #6 agent_bridge.py + ADR-0012 reindex contract + block-image CONTRACT.md stale-prose cleanup)

---

## Session-end summary (2026-05-01 orchestrator handoff)

This session executed:
1. Wave 3 prep PR #1 (ADR-0011 D-list impl; bootstrap exception)
2. Wave 3 prep PR #2 (F3 closure — first strict ADR-0011 D1 pipeline run)
3. Wave 3 prep PR #3 (viz-block CONTRACT.md prose)
4. Wave 3 plan-draft + plan-challenger R1 (13 issues, 12 absorbed, 1 declined with rationale) + R2 (PASS-NO-REMAINING-ISSUES) → locked

Process learnings codified in this session (will fold into ADR-0013 at Wave 3 close):
- **WE-012 (candidate)**: Default-branch-protected hooks block direct push; feature-branch + GitHub PR workflow is the user's preferred pattern (2026-05-01 lock). Reviewer codex profile sandbox needs `workspace-write` for stage 5 commit phase (D1 design clarification, not a defect).
- **WE-013 (candidate)**: codex template-literal escapes — backticks inside JS template literals break the parser; renderer files using `\`...\`` template strings cannot embed markdown backtick code spans without escaping or alternative quoting. (Caught in PR #1 codex-profiles-toml.ts inline comment.)
- **PR.md self-listing in `files:` whitelist** — codex review's #2 finding on PR #1 R2: ADR-0006 D8 strict whitelist requires the PR.md document itself to be listed (even when it's the document driving the staging). Pattern applied to PR #2 + PR #3 PR.md.

## Wave 2 完工归档（参考）

- 17 main tracks shipped + 33 commits（Wave 2 commit roster 见 ADR-0010 D2）
- 9 new packages：8 block-* + kernel-pyodide + 3 editor sub-modules
- 6 cross-package single-authority invariants
- 11 WE-* process learnings codified
- 4 forward-fix commits；24% forward-fix rate

## Wave 1 完工归档（参考）

- 7 高风险 PR 已 commit；全部 codex 5.5 双审 PASS
- 12 cross-location asymmetry meta-class 实例编入 ADR-0006
- 3 cross-package single-authority invariants

## Related

- [overview](overview.md)
- [phase-0 plan](../superpowers/plans/2026-04-29-phase-0-scaffolding.md) ✅ closed by ADR-0001
- [phase-1 wave-1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) ✅ closed by ADR-0002
- [phase-1 wave-2 plan](../superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) ✅ closed by ADR-0010
- [phase-1 wave-3 plan](../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) 🔒 locked 2026-05-01 (this session)
- [phase-1 wave 索引](phase-1/plan.md)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md)
- [ADR-0002](../decisions/ADR-0002-wave-1-close.md) Wave 1 close
- [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md) headless/UI 分层 + design-tokens
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) Codex-heavy 执行
- [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) Wave 2 entry policies
- [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union
- [ADR-0010](../decisions/ADR-0010-wave-2-close.md) Wave 2 close
- [ADR-0011](../decisions/ADR-0011-linear-pipeline-execution-model.md) Linear-pipeline execution model
- [Wave 3 prep PR.md folder](wave-3-prep/) — PR #1 / #2 / #3 ADR-0011 D2 schema documents
