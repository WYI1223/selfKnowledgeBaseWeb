# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 3 ✅ closed by [ADR-0013](../decisions/ADR-0013-wave-3-close.md) (2026-05-02) — 24 main pipeline PRs across Pre-A + 4 stages (A=5 + B=8 + C=3 of 6 + D=4) + 2 ADRs ratified (ADR-0011 amendment + ADR-0012) + 13 retrospective items codified → **Wave 4 starts in NEW session**.

Hand-off artifacts for the next (Wave 4) session:
- [ADR-0013 Wave 3 close](../decisions/ADR-0013-wave-3-close.md) — 24-PR roster + Wave 4 deferred set + ADR-0011 D1 empirical evaluation (KEPT for Wave 4)
- [ADR-0012 search index stack](../decisions/ADR-0012-search-index-stack.md) — Wave 3-ratified; 5 acceptance criteria locked (criterion 4 inverse-discriminator amendment is Wave 4 scope)
- [ADR-0011 D1-D8](../decisions/ADR-0011-linear-pipeline-execution-model.md) — execution model continues for Wave 4 unchanged

**Wave 4 mandatory scope (Wave 3 carry-overs):**
- Stage C completion: C4a (3 missing block Astro variants math/pdf/jupyter) + C4b (2 heavy block Astro variants nn-viz/agent-flow) + C5 (Phase 2 selective chunking + perf baseline)
- ADR-0014: heavy-block client:only + skeleton states (Jupyter/NnViz/AgentFlow runtime hydration boundary; SSR placeholders shipped at C3 are Phase 1 mitigation)
- ADR-0012 amendment: PageFind query-time substring finding (D3 finding; choose option (a) waive inverse OR (b) custom query parser)
- Path-prose alignment in ADR-0012: `_pagefind/` → `pagefind/` (semantic contract unchanged)
- Codex audit-log piping fix (R7) in `docs/runbooks/codex-tool-invocations.md`

**Wave 4 NEW scope** determined at Wave 4 plan-lock with plan-challenger codex.

---

Wave 1 ✅ closed (2026-04-30, HEAD `b5e7217`) by [ADR-0002](../decisions/ADR-0002-wave-1-close.md);
Wave 2 ✅ closed (2026-05-01, HEAD `51789a1`) by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) — 17 main tracks + 33 commits + 9 new packages + 6 cross-package single-authority invariants + 11 WE-* process learnings codified;
Wave 3 ✅ closed (2026-05-02, HEAD `4deb5cb`) by [ADR-0013](../decisions/ADR-0013-wave-3-close.md) — 24 main PRs across Pre-A + 4 stages, single long-term Claude orchestrator session validating ADR-0011 D1 linear pipeline at scale.

Wave 3 main pipeline PR roster (2026-05-01 → 2026-05-02, all merged via auto-merge per user authorization):

| PR | Squash HEAD | Stage | Subject |
|---|---|---|---|
| #4 | (Pre-A1) | Pre-A | codex profile TOML merge bootstrap |
| #5–#9 | A1–A5 | A | editor-shell skeleton (5 PRs) |
| #11–#19 | Pre-B1 + B1–B8 | B | mdx-bridge component-block round-trip (9 PRs) |
| #20–#22 | C1–C3 | C | apps/site BlockRegistry routing + dynamic chunking + sample-blocks live (3 of 6; C4a/C4b/C5 deferred) |
| #23–#26 | D1a/D1b/D2/D3 | D | search index research + ADR-0012 + build-time integration + UI (4 PRs) |

**Wave 3 architecture ADRs added:**
- [ADR-0012](../decisions/ADR-0012-search-index-stack.md) Search index stack (PageFind via astro-pagefind)
- [ADR-0013](../decisions/ADR-0013-wave-3-close.md) Wave 3 close

**Wave 1+2+3 architecture ADR roster:**
- [ADR-0001](../decisions/ADR-0001-stack-selection.md) Stack selection
- [ADR-0002](../decisions/ADR-0002-wave-1-close.md) Wave 1 close
- [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md) Headless / presentational split
- [ADR-0004](../decisions/ADR-0004-agent-team-dispatch-model.md) Agent team dispatch (Wave 1+2 era; ADR-0011 supersedes for Wave 3+)
- [ADR-0005](../decisions/ADR-0005-api-conventions.md) API conventions
- [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) Asymmetry audit checklist + D8 explicit-file-list staging
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) Job-function codex-heavy execution
- [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) Wave 2 entry policies
- [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union
- [ADR-0010](../decisions/ADR-0010-wave-2-close.md) Wave 2 close
- [ADR-0011](../decisions/ADR-0011-linear-pipeline-execution-model.md) Linear-pipeline execution model
- [ADR-0012](../decisions/ADR-0012-search-index-stack.md) Search index stack
- [ADR-0013](../decisions/ADR-0013-wave-3-close.md) Wave 3 close

**结构 baseline**: [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md). Wave 4 next sweep target: re-baseline against 24-PR Wave 3 work (apps/site search UI + content/notes/__test_cjk__ test fixtures + 8 block-* package consumption surface stable).
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md) (Wave 1+2 era; Wave 3 D-list reorganization codified in [docs/runbooks/codex-tool-invocations.md](../runbooks/codex-tool-invocations.md))

---

## 起手指引（Wave 4 session 拉到此文件后开始）

Wave 4 plan-draft has NOT yet been authored. The Wave 4 starting session must:

### Pre-flight (every session start)

1. 读 [ADR-0013 Wave 3 close](../decisions/ADR-0013-wave-3-close.md) — full Wave 3 retrospective + Wave 4 deferred set
2. 读 [ADR-0011 D1-D8](../decisions/ADR-0011-linear-pipeline-execution-model.md) — execution model (KEPT for Wave 4)
3. 读 [ADR-0012](../decisions/ADR-0012-search-index-stack.md) — search index stack (criterion 4 amendment is Wave 4 work)
4. 读 [docs/audits/structure-2026-05.md §7](../audits/structure-2026-05.md) — concerns from Wave 3 prep (most closed; Wave 4 baseline sweep at start)

### Wave 4 plan-lock

Author `docs/superpowers/plans/2026-05-XX-phase-1-wave-4-integration.md` containing:

1. **Mandatory scope (Wave 3 carry-overs)** — 5 items per ADR-0013 D3:
   - C4a + C4b + C5 (Stage C completion)
   - ADR-0014 (heavy-block client:only + skeleton)
   - ADR-0012 amendment (PageFind query-time substring finding)
   - Path-prose alignment in ADR-0012
   - Codex audit-log piping fix (R7) in runbook
2. **NEW scope** — to be determined at plan-lock with plan-challenger codex
3. PR-by-PR breakdown with D2 trigger judgment + test_cases per ADR-0011 D2 schema
4. plan-challenger codex challenge round per ADR-0007 D5 before lock

### Wave 4 D1 pipeline execution (per PR)

Same as Wave 3 (ADR-0011 D1 KEPT): PLAN → EXECUTE → REVIEW → PRE-COMMIT → COMMIT → ACCEPT. Per [ADR-0013 D5 Wave 3 empirical evaluation](../decisions/ADR-0013-wave-3-close.md), one Wave 4 D-list patch is required: route codex audit logs through `/tmp` first then truncate into `docs/audits/codex-runs/` to avoid the self-recursion loop incident from Wave 3 D3.
