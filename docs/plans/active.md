# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 4 Stage A ✅ DONE (8/8 PRs merged 2026-05-03; ADR-0014 promoted `proposed → accepted` at A8). Plan locked at [docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md](../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md). **Stage B (B1: ADR-0012 amendment for PageFind query-time substring) is the next implementation PR.**

**Wave 4 PR roster** (in-progress; merged 2026-05-03):

| PR | Squash HEAD | Stage | Subject |
|---|---|---|---|
| #28 | `9836d67` | Pre-A1 | codex runbook --yolo + R7 /tmp piping + pipefail |
| #29 | `876d700` | Pre-A2 | ADR-0014 HeavyBlockBoundary wrapper design lock (12/12 plan-challenger absorbed) |
| #30 | `3e2a4a9` | Pre-A3 | Wave 4 plan-draft lock (15/15 plan-challenger absorbed) |
| #31 | `f765968` | A1 | `@skb/heavy-block-boundary` package shell (D1 placeholder body + ADR-0008 D1 dead-dep evidence) |
| #32 | `1d2f324` | A2 | HeavyBlockBoundary core hydration lifecycle (D3: useEffect + AbortController + mount-guard; AC#1/#2/#3/#6/#10/#11) |
| #33 | `92c8751` | A3 | HeavyBlockBoundary retry + maxRetries + onLoadError telemetry (D3 retry-flow; AC#7/#8/#9) |
| #34 | 5f360a6 | A4 | HeavyBlockBoundary CSS + a11y polish + prefers-reduced-motion + CONTRACT.md consolidation (AC#4/#12/#13/#14) |
| #35 | 59a93c0 | A5 | apps/site dims migration via heavyBoundaryDimensions (AC#15) |
| #36 | 95ba33b | A6 | playwright T0/T1 zero-layout-shift test (AC#5) |
| #37 | 87d0b32 | A7 | 5×.astro variants consolidation (Wave 3 C4a/C4b carry-over) |
| #TBD (this) | TBD | A8 | Stage A close: perf baseline + chunking NO-OP + ADR-0014 promote `proposed→accepted` |
| **Stage A** | ✅ **DONE** (8/8 PRs) | A | A1-A8 merged 2026-05-03; ADR-0014 promoted to accepted |
| Stage B | B1-B4 + B5a/B5b + B6 (6 PRs) | B | ADR-0012 amend + sample-assets + intro prose + __test_cjk__ relocate + retrospective items + close-ceremony prep |
| Stage C | open-ended | C | Phase 1 user-iteration scope (per gatekeeper directive #4 + MVP framework) |

**Wave 4 mandatory scope (Wave 3 carry-overs)** — status as of A8 Stage A close:
- ✅ Codex audit-log piping fix (R7) in `docs/runbooks/codex-tool-invocations.md` — Pre-A1 closed
- ✅ ADR-0014: heavy-block client:only + skeleton states (Jupyter/NnViz/AgentFlow runtime hydration boundary) — **✅ Stage A1-A7 implemented + A8 promoted to accepted (2026-05-03)**
- ✅ Stage C completion: C4a (3 missing block Astro variants math/pdf/jupyter) + C4b (2 heavy block Astro variants nn-viz/agent-flow) + C5 (Phase 2 selective chunking + perf baseline) — **✅ A7 + A8 (Wave 4 Stage A close 2026-05-03)**
- ⏳ ADR-0012 amendment: PageFind query-time substring finding — Stage B B1 scope
- ⏳ Path-prose alignment in ADR-0012: `_pagefind/` → `pagefind/` — Stage B B1 scope (combined)

**Wave 4 NEW scope** (locked at Pre-A3 with plan-challenger codex 15/15 absorbtion):
- ADR-0015 explicitly out-of-scope for Stage A/B/C lock; close-ceremony work begins AFTER Stage C closes (per plan-challenger C9 absorbtion)
- gatekeeper smoke #8 (sample-assets ship) + #9 (sample-blocks intro prose) + #10 (ADR-0014 strengthened — already absorbed at Pre-A2)
- Wave 3 retrospective items 2-7 (B5a + B5b)

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

**Wave 1+2+3+4 architecture ADR roster:**
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
- [ADR-0014](../decisions/ADR-0014-heavy-block-boundary.md) HeavyBlockBoundary wrapper (proposed → accepted at Stage A close)

**结构 baseline**: [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md). Wave 4 next sweep target: re-baseline against 24-PR Wave 3 work (apps/site search UI + content/notes/__test_cjk__ test fixtures + 8 block-* package consumption surface stable).
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md) (Wave 1+2 era; Wave 3 D-list reorganization codified in [docs/runbooks/codex-tool-invocations.md](../runbooks/codex-tool-invocations.md))

---

## 起手指引（Wave 4 session 拉到此文件后开始）

Wave 4 plan is **LOCKED** at [docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md](../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md). Stage A ✅ DONE (8/8 PRs merged 2026-05-03; ADR-0014 promoted `proposed → accepted` at A8). **Stage B (B1: ADR-0012 amendment for PageFind query-time substring) is the next implementation PR.**

### Pre-flight (every session start)

1. 读 [Wave 4 plan locked](../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — Stage A/B/C breakdown + 11 D-list items + 15/15 plan-challenger absorbtion table
2. 读 [ADR-0014 HeavyBlockBoundary](../decisions/ADR-0014-heavy-block-boundary.md) — Stage A implementation target (9 D-list sections + 15 acceptance criteria; status `proposed` → `accepted` at A8)
3. 读 [ADR-0011 D1-D8](../decisions/ADR-0011-linear-pipeline-execution-model.md) — execution model (KEPT for Wave 4 unchanged; Pre-A1 codified Wave 4+ runbook discipline `--yolo` + pipefail + R7 /tmp piping)
4. 读 [ADR-0013 Wave 3 close](../decisions/ADR-0013-wave-3-close.md) — Wave 3 retrospective (5 mandatory carry-overs; 2 closed at Pre-A1+Pre-A2)
5. 读 most recent gatekeeper directives (per orchestrator session memory; not git-tracked)

### Wave 4 D1 pipeline execution (per PR)

Same as Wave 3 (ADR-0011 D1 KEPT) — PLAN → EXECUTE → REVIEW → PRE-COMMIT → COMMIT → ACCEPT. Wave 4 codifies operational discipline at Pre-A1: every codex dispatch uses `codex exec --yolo --profile <X>` with `set -o pipefail` + `2>&1 | tee /tmp/codex-runs/<X>.txt` raw + `head -2000 > docs/audits/codex-runs/<X>.txt` truncated archive (canonical "Universal Bash invariants" in [`docs/runbooks/codex-tool-invocations.md`](../runbooks/codex-tool-invocations.md)).

Stage A onwards uses standard D1 stage 5 reviewer-codex-commit pattern (per plan-challenger C6 absorbtion at Pre-A3); orchestrator-self commit was Pre-A1+Pre-A2+Pre-A3 bootstrap-flavored exception only.
