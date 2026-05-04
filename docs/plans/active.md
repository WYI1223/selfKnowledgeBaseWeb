# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: **Wave 5 plan v1.0 locked** (Pre-A5 done 2026-05-04 — Pre-A roadmap closed; [Wave 5 plan v1.0](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) with Stage C.1-C.4 per-PR breakdown locked; Stage C.1 ready to start). MVP target = v2 demo 整体体验 functional minimum (heavy block plugin placeholder + grid + drag/drop + v2 视觉 + editor-shell wire to apps/site). **5 Pre-A done + 25 Stage C planned = 30 PRs total**; 49 plan-challenger challenges absorbed across 4 rounds. Per-stage MVP-judgment escape valve (D3) + handoff pack (D15). R14 discipline enforced. Wave 4 ✅ closed 2026-05-04 (HEAD `de39e07` substance + `a157168` close-ceremony) by [ADR-0015](../decisions/ADR-0015-wave-4-close.md).

**Wave 5 PR roster** (in progress; 5 Pre-A done; Stage C.1 ready):

| PR | Squash HEAD | Stage | Subject |
|---|---|---|---|
| #50 | `365173e` | Pre-A1 | Wave 5 plan v0.1 → v0.2 lock + plan-challenger 10/10 absorbed |
| #51 | `6e2c1d9` | Pre-A2 | ADR-0016 grid 数据模型 + W5-1 invariant + 12/12 absorbed (R2) |
| #52 | `157a4f7` | Pre-A3 | ADR-0017 drag/drop UX + 13/13 absorbed (R4) |
| #53 | `7e487ec` | Pre-A4 | ADR-0018 v2 视觉 migration + save-path 接口冻结 + 14/14 absorbed (R6) |
| #TBD (this) | TBD | Pre-A5 | Wave 5 plan v0.2 → v1.0 final lock + Stage C.1-C.4 PR breakdown (25 PRs) + 6 Pre-A4 audit logs bundled |
| (Stage C.1 = 3) | TBD | C.1 | C.1-1 plugin placeholder + ADR-0014 v0.4 amend / C.1-2 PDF + chunk-leak / C.1-3 gitignore |
| (Stage C.2 = 12) | TBD | C.2 | C.2-1..12 mdx-bridge serialize → editor-shell grid → drag/drop UX → resize → ADR-0014 v0.5 amend → playwright |
| (Stage C.3 = 5) | TBD | C.3 | C.3-1..5 OKLCH + Inter/JetBrains Mono → 8 kind hue → prose customization → 8 light block calibration → visual smoke baseline |
| (Stage C.4 = 5) | TBD | C.4 | C.4-1..5 NoteSaveAdapter → /notes/[slug]/edit route → BlockRegistry wire → save/load → e2e + Wave 5 close 候选 |

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
| #38 | 4aeb279 | A8 | Stage A close: perf baseline + chunking NO-OP + ADR-0014 promote `proposed→accepted` |
| #39 | `1aa2811` | B1a | ADR-0012 v0.1.1 amendment + isWordLevelMatch utility (Stage B re-plan record) |
| #40 | `5ec7123` | B1b | SearchBox Option B-4 hybrid integration + count-fixup + paired discriminator playwright restore |
| #41 | `317dda3` | B2 | sample-blocks Wave 3 cleanup (4 sample-assets binaries + intro prose refresh; closes gatekeeper smoke #8 + #9) |
| #42 | `5d49240` | B3 | content/notes/__test_cjk__ relocation (notes index filter; partial impl of ADR-0013 D3; preserves PageFind coupling for B1b paired discriminator test) |
| #43 | `dc216ab` | B4 | Stage A retro items 2 + 3 + 4 (cast asymmetry codify + UIDefault casing rename + ESLint argsIgnorePattern) |
| #44 | `794cd5d` | B5 | codex profile prefix R3 (agent-contract.md + regen) + lychee autolink-in-backticks memory codify (`feedback_lychee_autolink_in_backticks.md`) |
| #45 | `8b6e2d8` | B7 | heavy block Astro hydration wiring + ADR-0014 v0.3 (CRITICAL gap; closes AC#1-#15-vitest-only coverage gap; chunk-leak deferred to Stage C per Wave 4 plan A8 D10) |
| #46 | `525e6c2` | B6 | Wave 4 close-ceremony preparation (3 audit codex dispatches + 3 curated summaries + Stage A+B PR roster) |
| #47 | `49557d2` | C-2 | NnViz `mlp-mnist.json` hot-load fixture ship (Stage C.1 gatekeeper smoke cleanup; warm-up) |
| #48 | `de39e07` | C-1 | Pyodide `indexURL` jsdelivr CDN configuration (Jupyter MVP unblock; HIGH; lock path-(a) post plan-challenger 15-Q absorbtion) |
| #TBD (this) | TBD | Wave 4 close | ADR-0015 Wave 4 close + active.md repoint to Wave 5 plan-draft pending + 3 audit close addendums |
| **Stage A** | ✅ **DONE** (8/8 PRs) | A | A1-A8 merged 2026-05-03 (HEAD 4aeb279); ADR-0014 promoted to accepted |
| **Stage B** | ✅ **DONE** (8/8 PRs) | B | B1a-B6 merged 2026-05-03/04 (HEAD `525e6c2` from PR #46); audit-on-close artifacts shipped at B6; ADR-0012 amended to v0.1.1 (B1a) + ADR-0014 amended to v0.3 (B7) |
| **Stage C** | ✅ **TRUNCATED at 2/4** | C | C-1 + C-2 merged 2026-05-04; C-3 (PDF iframe) + C-4 (chunk-leak) deferred to Wave 5 per gatekeeper 2026-05-04 path correction (mid-Wave reframe drift + Wave 5 plan-draft from scratch handles all deferred + reframe items) |

**Stage C 实际 PRs** (truncated at 2/4 by gatekeeper reframe; full close roster in [ADR-0015 D1](../decisions/ADR-0015-wave-4-close.md)):
- **C-2** ✅ merged 2026-05-04 (HEAD `49557d2`, PR #47) — NnViz `mlp-mnist.json` hot-load fixture ship; closed gatekeeper smoke residue from B2.
- **C-1** ✅ merged 2026-05-04 (HEAD `de39e07`, PR #48) — Pyodide `indexURL` jsdelivr CDN configuration; Jupyter MVP unblock; lock path-(a) CDN post plan-challenger 15-Q absorbtion.
- **C-3 / C-4** — DEFERRED to Wave 5 per ADR-0015 D3 Stage C residue.

**Wave 4 mandatory scope (Wave 3 carry-overs)** — status as of A8 Stage A close:
- ✅ Codex audit-log piping fix (R7) in `docs/runbooks/codex-tool-invocations.md` — Pre-A1 closed
- ✅ ADR-0014: heavy-block skeleton states + production Astro hydration boundary (Jupyter/NnViz/AgentFlow runtime hydration) — **✅ Stage A1-A7 implemented + A8 promoted to accepted (2026-05-03); B7 closes the production `client:load` hydration gap (2026-05-04)**
- ✅ Stage C completion: C4a (3 missing block Astro variants math/pdf/jupyter) + C4b (2 heavy block Astro variants nn-viz/agent-flow) + C5 (Phase 2 selective chunking + perf baseline) — **✅ A7 + A8 (Wave 4 Stage A close 2026-05-03)**
- ✅ ADR-0012 amendment: PageFind query-time substring finding — **B1a v0.1.1 (this PR; criterion 4 mitigation locked path (b) custom query parser; runtime-vs-index-time二分 codified)**
- ✅ Path-prose alignment in ADR-0012: `_pagefind/` → `pagefind/` — **B1a (this PR; 5 occurrences flipped + apps/site/CONTRACT.md stale-note removed)**

**Wave 4 NEW scope** (locked at Pre-A3 with plan-challenger codex 15/15 absorbtion):
- ADR-0015 explicitly out-of-scope for Stage A/B/C lock; close-ceremony work begins AFTER Stage C closes (per plan-challenger C9 absorbtion)
- gatekeeper smoke #8 (sample-assets ship) + #9 (sample-blocks intro prose) + #10 (ADR-0014 strengthened — already absorbed at Pre-A2)
- Wave 3 retrospective items 2-7 (B5a + B5b)

---

Wave 1 ✅ closed (2026-04-30, HEAD `b5e7217`) by [ADR-0002](../decisions/ADR-0002-wave-1-close.md);
Wave 2 ✅ closed (2026-05-01, HEAD `51789a1`) by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) — 17 main tracks + 33 commits + 9 new packages + 6 cross-package single-authority invariants + 11 WE-* process learnings codified;
Wave 3 ✅ closed (2026-05-02, HEAD `4deb5cb`) by [ADR-0013](../decisions/ADR-0013-wave-3-close.md) — 24 main PRs across Pre-A + 4 stages, single long-term Claude orchestrator session validating ADR-0011 D1 linear pipeline at scale;
Wave 4 ✅ closed (2026-05-04, HEAD `de39e07`) by [ADR-0015](../decisions/ADR-0015-wave-4-close.md) — 21 main PRs across Pre-A + 3 stages (A=8, B=8, C=2 truncated), 3 Claude orchestrator sessions over 2 days, ADR-0014 ratified through proposed → accepted + 2 substantive amendments (v0.2.1 + v0.3) + ADR-0012 v0.1.1 amendment, 9 NEW retrospective items (R14-R22) + 13 carry-forward (R1-R13).

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
- [ADR-0014](../decisions/ADR-0014-heavy-block-boundary.md) HeavyBlockBoundary wrapper (proposed → accepted at Stage A close; v0.3 amended at B7 with NEW D10 production hydration + AC#16)
- [ADR-0015](../decisions/ADR-0015-wave-4-close.md) Wave 4 close — 21-PR ratification + Wave 5 deferred set + ADR-0011 D1 empirical evaluation (continuation)

**结构 baseline**: [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md). Wave 4 next sweep target: re-baseline against 24-PR Wave 3 work (apps/site search UI + content/notes/__test_cjk__ test fixtures + 8 block-* package consumption surface stable).
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md) (Wave 1+2 era; Wave 3 D-list reorganization codified in [docs/runbooks/codex-tool-invocations.md](../runbooks/codex-tool-invocations.md))

---

## 起手指引（Wave 5 implementation; Pre-A roadmap closed — Stage C.1 ready）

Wave 5 plan v1.0 ✅ locked at Pre-A5 ([Wave 5 plan](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)). All 4 ADRs locked (ADR-0016/0017/0018 status proposed at Pre-A2/3/4; ADR-0014 v0.4 + v0.5 amendments scheduled in Stage C.1 + Stage C.2). 5 Pre-A done + 25 Stage C planned = **30 PRs total Wave 5**. **Next session = Stage C.1 implementation (3 PRs)**.

### Pre-flight (Stage C.1 session start)

1. 读 [Wave 5 plan v1.0](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — Stage C.1 PR breakdown (3 PRs locked) + Risk matrix + handoff pack template + ADR 编号映射表 + cross-referenced absorbtion tables
2. 读 [ADR-0014 HeavyBlockBoundary](../decisions/ADR-0014-heavy-block-boundary.md) — v0.4 amendment scope in C.1-1 (plugin placeholder vs plugin-real-runtime split)
3. 读 [ADR-0016 grid 数据模型](../decisions/ADR-0016-grid-data-model.md) — Stage C.2 reference (locked at Pre-A2)
4. 读 [ADR-0017 drag/drop UX](../decisions/ADR-0017-drag-drop-ux.md) — Stage C.2 reference (locked at Pre-A3)
5. 读 [ADR-0018 v2 视觉 migration + save-path 接口冻结](../decisions/ADR-0018-v2-visual-migration.md) — Stage C.3 + C.4 reference (locked at Pre-A4)
6. 读 [ADR-0015 Wave 4 close](../decisions/ADR-0015-wave-4-close.md) — D3 Wave 5 deferred items + D4 R14 discipline source
7. 读 [ADR-0011 D1-D8](../decisions/ADR-0011-linear-pipeline-execution-model.md) — execution model (Stage C.1 onwards 走标准 D1 6-stage pipeline)

### Stage C.1 ready (locked PR breakdown)

- C.1-1: Heavy block plugin placeholder + ADR-0014 v0.4 amendment (apps/site islands rewrite + componentsMap + ADR amendment) — codex-generic-executor; Row 4 + Row 1 D2 trigger
- C.1-2: C-3 PDF iframe 黑屏 fix + C-4 chunk-leak measure (data-driven; NO-OP if plugin placeholder makes moot) — codex-generic-executor
- C.1-3: `apps/site/test-results/` gitignore housekeeping — orchestrator-self
- **Stage C.1 close** = user MVP-judgment escape valve + handoff pack mandatory (per Wave 5 plan v1.0 D3 + D15)

### MVP escape valve (Stage close decision points)

每 Stage close (C.1 / C.2 / C.3 / C.4) = user 决定:
1. **"继续下一 stage"** → orchestrator opens next sub-stage
2. **"差不多了 ship"** → Wave 5 close ceremony (ADR-0019) on current state = MVP
3. **"调整 X"** → R14 plan amendment PR via D1 pipeline → plan-challenger → lock → resume

**MVP fallback timing**: > 5 工作日 静默 → R14 pre-scan + 缺失项清单 PR; > 7 工作日 → close-prep (per Wave 5 plan v1.0 D14).

### R14 discipline (Wave 5 enforce — strict)

Per ADR-0015 R14 + Wave 5 plan v1.0 D4: 任何 mid-Wave reframe → "Wave 5 plan v1.X amendment PR" via D1 pipeline → plan-challenger → lock → THEN implementation. 阈值: PR 总量变化 >15% / 新增高风险模块 ≥1 / 跨-package边界 / 改成功标准 = `reframe`; 任务顺序 / 命名 / 测试补充 = `scope refinement` (Pre-A5 v1.0 lock 时 absorb 即可).

### D1 pipeline (KEPT)

Same as Wave 3+4 (ADR-0011 D1 KEPT) — PLAN → EXECUTE → REVIEW → PRE-COMMIT → COMMIT → ACCEPT. Stage C.1 onwards uses standard reviewer-codex-commit (NOT bootstrap-flavored; Pre-A5 was last orchestrator-self commit in Wave 5 Pre-A). Operational discipline: `codex exec --yolo --profile <X>` + `set -o pipefail` + `/tmp` piping + `head -2000` archive OR R21 grep-for-verdict for log > 500 KB.
