# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: **Wave 5 plan v1.3 locked 2026-05-05 (R14 THIRD real-test absorbed standards-landing schema retrofit; PR #75 squash `5bd5112`)** + delivery quality standards landed 2026-05-05 via PR #74 squash `2f67ef0` (gatekeeper-direct bootstrap exception per ADR-0011 Implementation §) + check-screenshot-archive.ts symmetric ui_touch skip fix landed 2026-05-05 via PR #76 squash `ad42f71` (D9.5 plan-PR carve-out per ADR-0011 D10 structural-fix-not-prompt-patch). [ADR-0011 v0.2 amendment](../decisions/ADR-0011-linear-pipeline-execution-model.md) (NEW D9 Product Experience Quality Gate + NEW D10 anti prompt-patching + D2 schema 加 ui_touch/e2e_smoke 字段 + D1 stage 表 stages 2/3/6 加 Playwright 责任) + [ADR-0006 v0.2 amendment](../decisions/ADR-0006-asymmetry-audit-checklist.md) (9th asymmetry item: UI-touch + E2E spec audit) + [agent-contract.md](../../agent-contract.md) profile updates (pr-writer + codex-pr-reviewer-55 + codex-generic-executor) + [scripts/check-ui-touch.ts + check-e2e-coverage.ts + check-screenshot-archive.ts](../../scripts/) NEW + [.github/workflows/ci.yml](../../.github/workflows/ci.yml) e2e-coverage-check job NEW. **触发 = Wave 5 C.4-prelude PR #72 vitest unit + jsdom + pr-writer ACCEPT 23/23 全 PASS 但 user 烟测发现 editor 页 toolbar/slash/palette/save-indicator/Edit-Mode 全无 = "看不到任何一点进步" → gatekeeper 起初仅修补 prompt → user 否决 + 要求 ADR-level 落地 → standards landing PR #74 + v1.3 amendment retrofit + PR #76 structural symmetric-skip fix**。Wave 5 v1.3 (R14 THIRD real-test 2026-05-05 via PR #75 squash `5bd5112` — standards-landing schema retrofit class formalized; 11 PR roster rows annotated with ui_touch + e2e_smoke per ADR-0011 D9 schema; C.4-1 加 ApiAdapter forward stub language + comment-only hard AC; C.4-5 真验收 10-item E2E coverage path 1:1 mapped to user MVP item list per Q3 plan-challenger absorbtion); v1.2 (R14 SECOND real-test 2026-05-05 via PR #70 squash `56ff476` — gatekeeper sequencing pushback "交付了但 /notes/[slug]/edit 没有" formalized via NEW row C.4-prelude minimal editor scaffold ✅ shipped 2026-05-05 via PR #72 squash `4f49be0`); v1.1 R14 first real-test ✅ closed via C.2-3.5 PR #65; v1.0 baseline locked at Pre-A5 PR #54. [Wave 5 plan v1.3](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md). MVP target = v2 demo 整体体验 functional minimum. **5 Pre-A + 3 C.1 + 7 C.2 (C.2-1/2/3/4/3.5/5/6) + 1 C.4 (C.4-prelude) + 3 meta (v1.1 + v1.2 + v1.3) = 19 PRs done; 16 implementation PRs remaining**. Total = **32 implementation + 3 meta + 2 standards-related (PR #74 + PR #76) = 37 roster entries**. 63 plan-challenger challenges absorbed across 7 rounds (49 v1.0 baseline + 5 v1.1 + 5 v1.2 + 4 v1.3). Per-stage MVP-judgment escape valve (D3) + handoff pack (D15). R14 discipline ✅ operative across MULTIPLE trigger classes (defer-chain v1.1 + gatekeeper-sequencing v1.2 + standards-landing-absorbtion v1.3). Wave 4 ✅ closed 2026-05-04 by [ADR-0015](../decisions/ADR-0015-wave-4-close.md).

**Wave 5 standards-landing follow-ups (post v1.3 + PR #76 merges)**:

1. ✅ **下游 regen** — 已 verified clean post `pnpm generate:configs` 2026-05-05 (PR #74 standards landing 已 include 全套 downstream artifacts; CLAUDE.md / AGENTS.md / .claude/agents/*.md / docs/runbooks/team-operations.md / docs/runbooks/codex-tool-invocations.md 已 synced).
2. **CI required check 配置**：`.github/workflows/ci.yml` 新加 `e2e-coverage-check` job 需在 GitHub branch protection 配为 required（user 操作；orchestrator 无 web 权限）— STILL PENDING user side.
3. ✅ **Wave 5 v1.3 amendment** — merged PR #75 squash `5bd5112` 2026-05-05; 11 retrofit catalog entries (C.2-7 + 5 C.3 + 5 C.4) + C.4-1 ApiAdapter forward-stub hard AC + C.4-5 真验收 10-item E2E coverage path codified.
4. **Wave 5 close ADR-0019 R26 candidate**：v1.3 amendment R14 THIRD real-test class = "standards-landing absorbtion / consistency-correction class" (parallel to v1.1 defer-chain + v1.2 gatekeeper-sequencing). v1.3 PR.md `## v1.3 R14 amendment` § contains R26-shaped retrospective text 待 Wave 5 close ratify.
5. ✅ **PR #76 structural symmetric-skip fix** — `scripts/check-screenshot-archive.ts` ui_touch=false auto-skip lands per ADR-0011 D10 structural-fix discipline (not prompt-patch). Implementation PRs (C.2-7+) now use canonical `screenshot_archive:` D2 field name in `## e2e_smoke` section without CI gate triggering on forward-declaration paths in plan retrofit catalog.

**Wave 5 PR roster** (in progress; 19 PRs done = 16 implementation + 3 meta amendments; **next = C.2-7 ADR-0014 v0.5 amendment** per Wave 5 plan v1.3 row C.2-7 — Q4 absorbtion LOCKED scaffold BEFORE C.2-7 ✅ now satisfied; v1.3 retrofit catalog provides canonical e2e_smoke entry):

| PR | Squash HEAD | Stage | Subject |
|---|---|---|---|
| #50 | `365173e` | Pre-A1 | Wave 5 plan v0.1 → v0.2 lock + plan-challenger 10/10 absorbed |
| #51 | `6e2c1d9` | Pre-A2 | ADR-0016 grid 数据模型 + W5-1 invariant + 12/12 absorbed (R2) |
| #52 | `157a4f7` | Pre-A3 | ADR-0017 drag/drop UX + 13/13 absorbed (R4) |
| #53 | `7e487ec` | Pre-A4 | ADR-0018 v2 视觉 migration + save-path 接口冻结 + 14/14 absorbed (R6) |
| #54 | `2bc129a` | Pre-A5 | Wave 5 plan v0.2 → v1.0 final lock + Stage C.1-C.4 PR breakdown (25 PRs) |
| #55 | `44a2e53` | C.1-1 | Heavy block plugin placeholder + ADR-0014 v0.4 amendment |
| #56 | `6b350d6` | C.1-2 | PDF iframe dark-theme fix + C-4 chunk-leak NO-OP audit |
| #57 | `587835c` | C.1-3 | `apps/site/.gitignore` housekeeping + Stage C.1 close handoff pack |
| #58 | `e54497d` | C.2-1 | mdx-bridge col/row/colSpan/rowSpan serialize (1 of 13 Stage C.2; w/ defensive defaults — transition removed at C.2-3.5) |
| #59 | `b15ba24` | C.2-2 | block-foundation BlockUIDefinition grid + grid-math.ts (2 of 13 Stage C.2) |
| #60 | `2586328` | C.2-3 | Astro renderer grid + Responsive 12/6/1 (3 of 13 Stage C.2) |
| #61 | `1304111` | **v1.1 amend** | **Wave 5 plan v1.0 → v1.1 R14 amendment + NEW row C.2-3.5 (formalize C.2-1→C.2-3 hard-throw + sample-MDX + 17 RTT fixtures defer-chain; 5/5 absorbed; R3 PASS; R14 first real-test ✅)** |
| #62 | `882710a` | docs | active.md sync post v1.1 amendment merge |
| #63 | `de13d15` | C.2-4 | editor-shell grid 集成 + useAutoRowSpan hook (4 of 13 Stage C.2; W5-2 invariant + GridContainer thin wrapper + 3-stage 抖动收敛 hook per ADR-0016 D3) |
| #64 | `f8a265f` | docs | active.md sync post C.2-4 merge |
| #65 | `b019a31` | **C.2-3.5** | **mdx-bridge hard-throw flip + sample MDX backfill + 17 RTT fixtures (5 of 13 Stage C.2; R14 first real-test ✅ closed; ADR-0016 D3/D7 prose consistency-correction; COL_SNAPS class 4 fix; reviewer R1+R2+R3 PASS post 4 mechanical fixes)** |
| #66 | `465588e` | docs | active.md sync post C.2-3.5 + lychee fix-forward (PR #65 broken link) |
| #67 | `2df71b6` | C.2-5 | drag/drop UX 实施 (6 of 13 Stage C.2; edge-rects + tiebreak + outline-overlay per ADR-0017 D5+D3+D4; EDGE_W=28 cross-package consumer parity; reviewer R1 PASS-WITH-RESIDUE) |
| #68 | `2fb7900` | C.2-6 | resize UX (col-ruler + size-tooltip + COL_SNAPS snap; 7 of 13 Stage C.2; ADR-0017 D9; closed C.2-2 effectiveColSnaps gap; reviewer R1 PASS) |
| #69 | `338e965` | docs | bundled active.md sync post C.2-5 + C.2-6 |
| #70 | `56ff476` | **v1.2 amend** | **Wave 5 plan v1.1 → v1.2 R14 SECOND real-test amendment + NEW row C.4-prelude (formalize user gatekeeper sequencing pushback "交付了但 /notes/{slug}/edit 没有, 我怎么试?" → minimal editor scaffold MVP smoke-test enable; 5/5 absorbed; reviewer R1+R2 PASS; R14 discipline operative across multiple trigger classes)** |
| #71 | `722bbb0` | docs | active.md sync post v1.2 R14 SECOND amendment merge |
| #72 | `4f49be0` | **C.4-prelude** | **Minimal editor scaffold (1 of 6 Stage C.4; MVP smoke-test enable; rest-route `apps/site/src/pages/notes/[...slug]/edit.astro` + EditorShellMount client island + LocalStorageAdapter MVP impl per ADR-0018 D8 byte-equal; reviewer R1 FAIL→R2 PASS-WITH-RESIDUE; 2 mechanical scope refinements absorbed at EXECUTE: package.json/lockfile + `[slug]`→`[...slug]` rest-route file rename per Astro nested slug shape)** |
| #73 | `49c6b2f` | docs | active.md sync post C.4-prelude (#72) merge |
| #74 | `2f67ef0` | **standards** | **Standards landing — ADR-0011 v0.2 D9 + D10 + D2 schema (ui_touch + e2e_smoke) + ADR-0006 v0.2 9th asymmetry item + 3 NEW CI gate scripts + e2e-coverage-check workflow + agent-contract regen (gatekeeper-direct bootstrap exception per ADR-0011 Implementation §; trigger = C.4-prelude PR #72 vitest全 PASS but user 烟测 editor 全无 affordance "看不到任何一点进步" → 否决 prompt-patch 要求 ADR-level 落地)** |
| #75 | `5bd5112` | **v1.3 amend** | **Wave 5 plan v1.2 → v1.3 R14 THIRD real-test amendment + standards-landing schema retrofit (annotate ui_touch + e2e_smoke onto 11 PR rows: C.2-7 + 5 C.3 + 5 C.4; C.4-1 ApiAdapter forward-stub language + comment-only hard AC; C.4-5 真验收 10-item E2E coverage path 1:1 mapped to user MVP item list; 4/4 plan-challenger absorbed Q1+Q2+Q3+Q4; 2 fix-forwards then revert + rebase clean per Path B structural-fix discipline)** |
| #76 | `ad42f71` | **standards-fix** | **scripts/check-screenshot-archive.ts symmetric ui_touch skip (D9.5 plan-PR carve-out; mirrors check-e2e-coverage.ts auto-skip pattern; per ADR-0011 D10 structural-fix-not-prompt-patch path; enabled v1.3 PR #75 to ship with canonical screenshot_archive: D2 field name post rebase + revert ac9b98d workaround)** |
| (Stage C.2 = 13 PRs post v1.1; 7 done) | TBD | C.2 | **C.2-7 ADR-0014 v0.5 amendment (NEXT; HeavyBlockBoundary dims grid context 联动 W5-1; UI-touch=true + canonical e2e_smoke entry from v1.3 retrofit catalog)** → C.2-8..C.2-12 |
| (Stage C.4 = 6 PRs post v1.2; 1 done — C.4-prelude ✅) | TBD | C.4 | C.4-1 NoteSaveAdapter interface hardening (W5-2 contract surface + adapter contract test suite per Q3 ownership boundary) → C.4-2 route + mount enhancement (BlockRegistry/KernelRegistry full wire) → C.4-3..C.4-5 |
| (Stage C.3 = 5 PRs) | TBD | C.3 | C.3-1..5 OKLCH + Inter/JetBrains Mono → visual smoke baseline |

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

## 起手指引（Wave 5 implementation; v1.3 lock + standards landing complete — next = C.2-7 ADR-0014 v0.5 amendment per Q4 LOCK ordering with v1.3 retrofit catalog canonical e2e_smoke entry）

Wave 5 plan v1.3 ✅ locked (R14 THIRD real-test 2026-05-05 via PR #75 squash `5bd5112`). Standards landing complete: ADR-0011 v0.2 + ADR-0006 v0.2 + 3 CI gate scripts + e2e-coverage-check workflow + agent-contract regen via PR #74 squash `2f67ef0` + structural symmetric-skip fix via PR #76 squash `ad42f71`. 19 PRs done (5 Pre-A + 3 C.1 + 7 C.2 + 1 C.4 + 3 meta). R14 discipline ✅ operative across THREE trigger classes (defer-chain v1.1 + gatekeeper-sequencing v1.2 + standards-landing-absorbtion v1.3). **C.4-prelude MVP smoke-test surface delivered** (PR #72 squash `4f49be0`): user can navigate `/notes/{slug}/edit` → mount editor-shell with grid+drag+resize → edit prose → 800ms-debounced save to LocalStorage → reload → content persists. Per Wave 5 plan v1.2 row C.4-prelude + Q4 plan-challenger absorbtion the scaffold-BEFORE-C.2-7 ordering is now satisfied. **Next = C.2-7 ADR-0014 v0.5 amendment** (HeavyBlockBoundary dims grid context 联动 W5-1 from `@skb/block-foundation`); per v1.3 retrofit catalog canonical `e2e_smoke` entry: flow="heavy block plugin placeholder consumes grid effectiveColWidth/effectiveCellHeight"; target_url=`/sample-blocks`; spec=`apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts`; screenshot_archive=`docs/audits/screenshots/wave-5-c2-7-heavy-grid-dims.png`.

### Post-C.4-prelude branch decision (per user 时序 item 4)
1. **Continue full C.2 sequence** ← default per plan v1.2: orchestrator dispatches C.2-7 ADR-0014 v0.5 amendment → C.2-8..C.2-12 → Stage C.2 close
2. **Adjust scope**: user invokes R14 third time → v1.3 amendment PR (recursive R14 enforcement)
3. **MVP-ship 提前 close**: Wave 5 close ceremony (ADR-0019) on current state

### C.2-7 details (post-scaffold-merge; queued)
- `docs/decisions/ADR-0014-heavy-block-boundary.md` (v0.5 Amendments § — substantive D-list; status `proposed v0.4 → proposed v0.5`)
- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` (consume W5-1 公式 from `@skb/block-foundation` `effectiveCellHeight` + `effectiveColWidth`)
- `packages/heavy-block-boundary/CONTRACT.md` (sister-doc-sync per ADR-0016 §502 row 1 of 4)
- ~150 LOC, orchestrator-self for ADR + codex for impl, D2 Row 4 (ADR amendment) + Row 1 (CONTRACT sync) fires

### Pre-flight (next session start)

1. `git pull` verify HEAD = `4f49be0` (Wave 5 C.4-prelude squash, post PR #72) or later post active.md sync
2. 读 [Wave 5 plan v1.1](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — Stage C.2 PR breakdown (13 PRs post v1.1) + `## v1.1 R14 amendment` section + Risk matrix
3. 读 [ADR-0016 grid 数据模型](../decisions/ADR-0016-grid-data-model.md) — D3 两阶段稳态 (C.2-4 useAutoRowSpan core) + D11 Tiptap-inside-grid-outside + D9 W5-1 SSR vs hydration phase + §502 sister-doc-sync (mdx-bridge row references C.2-3.5 post v1.1)
4. 读 [ADR-0017 drag/drop UX](../decisions/ADR-0017-drag-drop-ux.md) — Stage C.2 D5..D12 reference (drag/drop/resize land at C.2-5..C.2-8)
5. 读 PR.md exemplar [C.2-3 Astro renderer grid PR.md](wave-5-main/C.2-3-astro-grid.md) — for structure + content patterns
6. 读 [Wave 5 plan v1.1 PR.md](wave-5-main/v1.1-plan-amendment-r14.md) — R14 first real-test reference + 5-row absorbtion table + AC#13/14 mechanical R14 hard-fail patterns

### Stage C.2 remaining (6 of 13 PRs; C.2-1..C.2-6 + C.2-3.5 ✅ merged)

| Order | Subject | LOC |
|---|---|---|
| **C.2-7 (next)** | ADR-0014 v0.5 amendment (HeavyBlockBoundary dims grid context; UI-touch=true; v1.3 retrofit catalog canonical e2e_smoke) | ~150 |
| C.2-8 | drop-pulse + drag-ghost + Esc cancel + layoutEpoch reducer | ~400 |
| C.2-9 | Responsive 12/6/1 切换 + rowSpan adapt path | ~150 |
| C.2-10 | playwright drag scenarios + edge-rect tiebreak fixtures | ~600 |
| C.2-11 | playwright resize + responsive switch + rowSpan adapt | ~400 |
| C.2-12 | Stage C.2 close: visual smoke baseline + perf budget + handoff pack | ~200 |

**Per Q2 v1.1 absorbtion downstream constraint**: C.2-4..C.2-11 PRs MUST reference C.2-3.5 hard-throw flip as active mdx-bridge contract; MUST NOT reuse C.2-3 era defensive default `_gridAttrsExplicit` marker (removed at C.2-3.5 execution).

### R14 first real-test ✅ PASSED (this v1.1 amendment)

ADR-0019 Wave 5 close R24-shaped retrospective candidate (verbatim from plan v1.1 §455+):
> "R14 first real-test enforcement — defer-defer chain (hard-throw flip + sample MDX backfill + 17 RTT fixtures: C.2-1 → C.2-3 → v1.1 amendment) → plan amendment PR (v1.1) 5-stage D1 pipeline 形式化处理而非 handoff pack 跟踪. 证明 R14 discipline operative."

R14 mechanical hard-fail layer codified: AC#13 (diff-only-N-docs check) + AC#14 (no implementation-string leak in non-PR.md files). Pattern reusable for any future v1.X plan amendment PRs.

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
