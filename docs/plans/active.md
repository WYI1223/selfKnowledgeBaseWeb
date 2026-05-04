# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: **Wave 5 in progress** (Pre-A1 done 2026-05-04 — plan-draft v0.x locked at [Wave 5 plan v0.x](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md); Pre-A2 ADR-0016 grid 数据模型 next). MVP target = v2 demo 整体体验 functional minimum (heavy block plugin placeholder + grid + drag/drop + v2 视觉 + editor-shell wire to apps/site). 5 Pre-A PRs (Pre-A1 + Pre-A2/3/4 ADRs + Pre-A5 v1.0 final lock) + Stage C 4 子阶段 (C.1 cleanup + C.2 grid+drag + C.3 v2 视觉 + C.4 editor-wire). Per-stage MVP-judgment escape valve. R14 discipline enforced (mid-Wave reframe via plan amendment PR; memory-only forbidden). Wave 4 ✅ closed 2026-05-04 (HEAD `de39e07` substance + `a157168` close-ceremony) by [ADR-0015](../decisions/ADR-0015-wave-4-close.md) — 21 PRs across Pre-A + 3 stages.

**Wave 5 PR roster** (in progress; opened 2026-05-04):

| PR | Squash HEAD | Stage | Subject |
|---|---|---|---|
| #TBD (this) | TBD | Pre-A1 | Wave 5 plan-draft v0.1 + plan-challenger absorbtion → v0.x lock + active.md repoint + Wave 4 close residue audit log archive bundle |
| (Pre-A2-A5) | (TBD) | Pre-A | Pre-A2 ADR-0016 grid 数据模型 → Pre-A3 ADR-0017 drag/drop UX → Pre-A4 ADR-0018 v2 视觉 migration → Pre-A5 plan v1.0 final lock |
| (Stage C.1-C.4) | (TBD) | Stage C | C.1 cleanup (~2-3 PRs) → C.2 grid+drag (~10-12 PRs) → C.3 v2 视觉 (~3-5 PRs) → C.4 editor-shell wire (~3-5 PRs); per-PR breakdown locked at Pre-A5 v1.0 |

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

## 起手指引（Wave 5 implementation; Pre-A1 done — Pre-A2 ADR-0016 next）

Wave 5 plan v0.x ✅ locked at Pre-A1 ([Wave 5 plan](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)). **Next session = Pre-A2 ADR-0016 grid 数据模型 design lock + plan-challenger 4-round**.

### Pre-flight (Pre-A2 session start)

1. 读 [Wave 5 plan v0.x](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — Pre-A roadmap + Stage C.1-C.4 high-level scope + MVP Framework Notes + R14 discipline + D-list summary + plan-challenger absorbtion table (Pre-A1)
2. 读 [ADR-0015 Wave 4 close](../decisions/ADR-0015-wave-4-close.md) — D3 Wave 5 deferred items (binding) + D4 R14 mid-wave reframe drift discipline + D6 Wave 5 plan-draft handoff
3. 读 memory `project_wave4_reframe_v2.md` — Wave 5 INPUT (preserved across sessions; reframe v2 design intent)
4. 读 granularity doc `/mnt/d/download/web/v2-design-granularity.md` v0.3.4 — ADR-0016 design 权威 (gatekeeper-side scratch; NOT in git)
5. 读 v2 demo files `/mnt/d/download/web/{proto-app,proto-canvas,proto-markdown}.jsx` + `proto-styles.css` + `drag-storyboard.css` — full read at Pre-A2 ADR design-lock time (Pre-A1 sampled only)
6. 读 [ADR-0014 HeavyBlockBoundary](../decisions/ADR-0014-heavy-block-boundary.md) — v0.4 amendment scope in Stage C.1 (plugin placeholder vs plugin-real-runtime split); ADR-0016 grid context dimensions 联动 ADR-0014 v0.5 amendment in Stage C.2
7. 读 [Wave 4 Pre-A2 PR.md](wave-4-main/Pre-A2-adr-0014-heavy-block-boundary.md) — most recent ADR design-lock precedent (12/12 plan-challenger absorbed); Pre-A2 of Wave 5 follows this pattern
8. 读 [ADR-0011 D1-D8](../decisions/ADR-0011-linear-pipeline-execution-model.md) — execution model (KEPT for Wave 5 per ADR-0015 D5)

### Wave 5 Pre-A roadmap (locked at Pre-A1)

- ✅ Pre-A1 (this PR): Wave 5 plan-draft v0.1 + plan-challenger → v0.x lock
- Pre-A2: ADR-0016 grid 数据模型 design lock + plan-challenger 4-round
- Pre-A3: ADR-0017 drag/drop UX design lock + plan-challenger 4-round
- Pre-A4: ADR-0018 v2 视觉 migration design lock + plan-challenger 4-round
- Pre-A5: Wave 5 plan v1.0 final lock (Stage C.1-C.4 per-PR breakdown + risk predictions + cross-referenced absorbtion tables)

### R14 discipline (Wave 5 enforce)

Per ADR-0015 R14: gatekeeper directive → orchestrator opens "Wave 5 plan v0.X amendment PR" → plan-challenger round → lock → THEN implementation. **Memory entries are session-scoped reads; plan amendments are spec-locked decisions**. Mid-Wave reframe (if any in Wave 5) MUST go through D1 pipeline plan amendment, NOT memory-only.

### D1 pipeline (KEPT)

Same as Wave 3+4 (ADR-0011 D1 KEPT) — PLAN → EXECUTE → REVIEW → PRE-COMMIT → COMMIT → ACCEPT. Operational discipline (Wave 4 Pre-A1 codified): `codex exec --yolo --profile <X>` + `set -o pipefail` + `/tmp` piping + `head -2000` archive (per [`docs/runbooks/codex-tool-invocations.md`](../runbooks/codex-tool-invocations.md)). R21 extension: post-hoc grep-for-verdict-shaped-lines for codex logs > 500 KB.
