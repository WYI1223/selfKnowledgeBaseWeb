# ADR-0015: Wave 4 close — main pipeline 21-PR ratification + Wave 5 deferred set + ADR-0011 D1 empirical evaluation (continuation)

| 字段 | 值 |
| ---- | --- |
| 状态 | accepted |
| 日期 | 2026-05-04 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | Wave 4 main pipeline closed at HEAD `de39e07` (C-1 — Stage C 第 2 PR; PR #48). Per gatekeeper 2026-05-04 路径修正 directive: close on **ACTUAL completed scope** (21 PRs); reframe v2 (heavy block plugin tier + grid forward + v2 visual forward + editor-shell wire-up) DEFERRED to Wave 5 because mid-Wave reframe via memory entry only (NOT through D1 pipeline plan amendment) = drift risk. Wave 5 plan-draft from scratch with reframe content as INPUT + per-ADR plan-challenger 4-round + lock v1.0 before Wave 5 implementation. |
| 替代 | 不替代任何 ADR；继承 [ADR-0010](ADR-0010-wave-2-close.md) + [ADR-0013](ADR-0013-wave-3-close.md) close-ceremony 模式 + [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) D1 empirical evaluation 第二轮 (Wave 3 first; Wave 4 confirms KEPT) |

## Context

Wave 4 (Phase 1 Wave 4, 2026-05-03 → 2026-05-04) shipped 21 main pipeline PRs across Pre-A + 3 stages (A=8, B=8, C=2) under the [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) D1 linear pipeline execution model.

Wave 4 ran across **3 Claude orchestrator sessions** (vs Wave 3 single 24-PR session): two sessions on 2026-05-03 (Stage A + Stage B), one session on 2026-05-04 (Stage C-2 + C-1). Each session = strictly serial PR execution + codex-heavy at stages 2+3+5 + orchestrator-self at stage 4 + pr-writer subagent at stages 1+6.

Pivotal mid-Wave events:
1. **B7 CRITICAL gap** (post-Stage A close): gatekeeper smoke 2026-05-03 surfaced Astro production hydration missing (AC#1-#15 vitest/jsdom-only); ADR-0014 v0.2 → v0.3 amendment + new D10 + new AC#16 + 3 React islands shipped at B7.
2. **Plan re-lock at Stage B mid-stage**: Wave 4 plan v0.2 → v0.2.1 amendment (B1 split into B1a + B1b per plan-challenger C6+C10 + NEW B7 added). Stage B locked from 6 PRs → 8 PRs.
3. **Stage C user-iteration framework**: open-ended scope per gatekeeper directive #4 + plan-challenger Q4 absorbtion + MVP framework. C-1/C-2 shipped; C-3/C-4 deferred.
4. **Mid-Wave reframe drift** (gatekeeper-surfaced 2026-05-04): two reframes (heavy block plugin tier 2026-05-03 + grid/drag/v2 visual forward 2026-05-04) were absorbed via memory entry (`project_wave4_reframe_v2.md`) only — NOT through D1 pipeline plan amendment. Path correction at this close ceremony = close on actual completed scope; Wave 5 plan-draft from scratch handles the reframe properly. See R14 retrospective.

This ADR ratifies:
1. The 21-PR roster + their merge order + forward-fix ratio
2. Wave 4 architecture amendments (ADR-0014 v0.2.1 + v0.3; ADR-0012 v0.1.1)
3. Wave 5-deferred items (binding handoff)
4. 9 NEW retrospective items (R14-R22) + 13 carry-forward from Wave 3 (R1-R13)
5. Hand-off to Wave 5 with `docs/plans/active.md` repointed
6. ADR-0011 D1 linear pipeline empirical evaluation (continuation; 21 PRs second time)

## Decision

Wave 4 closes with the following ratifications:

### D1 — Wave 4 main pipeline 21-PR roster (final state)

21 PRs merged via `gh pr merge --squash --delete-branch` (per memory `feedback_wave3_auto_merge.md` user authorization). HEAD = `de39e07`.

#### Pre-A (3 PRs — bootstrap)

| PR | Squash HEAD | Subject | D1 stages fired |
|---|---|---|---|
| #28 | `9836d67` | Pre-A1 — codex runbook --yolo + R7 /tmp piping + pipefail | 1+2+3+4+5+6 |
| #29 | `876d700` | Pre-A2 — ADR-0014 HeavyBlockBoundary wrapper design lock (12/12 plan-challenger absorbed; status proposed) | 1+2+3+4+5+6 (D2 row 4 NEW ADR) |
| #30 | `3e2a4a9` | Pre-A3 — Wave 4 plan-draft lock (15/15 plan-challenger absorbed) | 1+2+3+5+6 |

#### Stage A (8 PRs — @skb/heavy-block-boundary implementation + Stage C carry-over)

| PR | Squash HEAD | Subject | D1 stages fired |
|---|---|---|---|
| #31 | `f765968` | A1 — package shell (D7 + D1 placeholder body + ADR-0008 D1 dead-dep evidence) | 1+2+3+4+5+6 (D2 row 1 NEW CONTRACT) |
| #32 | `1d2f324` | A2 — D3 hydration lifecycle (mount + AbortController + mount-guard); AC#1/#2/#3/#6/#10/#11 | 1+2+3+5+6 |
| #33 | `92c8751` | A3 — D3 retry flow (retry button + maxRetries + onLoadError); AC#7/#8/#9 | 1+2+3+5+6 |
| #34 | `5f360a6` | A4 — D6 CSS + D2 a11y polish + prefers-reduced-motion + CONTRACT.md consolidation; AC#4/#12/#13/#14 | 1+2+3+4+5+6 (D2 row 1 CONTRACT touch) |
| #35 | `59a93c0` | A5 — D5 dimensions ownership + D8 apps/site migration; AC#15 | 1+2+3+4+5+6 (D2 row 1 multiple CONTRACT touches) |
| #36 | `95ba33b` | A6 — playwright T0/T1 zero-layout-shift CI test; AC#5 | 1+2+3+5+6 |
| #37 | `87d0b32` | A7 — Wave 3 C4a/C4b carry-over: 5 .astro variants direct-Astro consumer | 1+2+3+5+6 |
| #38 | `4aeb279` | A8 — Stage A close: perf baseline + chunking NO-OP decision (data-driven per D10) + ADR-0014 promote `proposed → accepted` + v0.2.1 amendment | 1+2+3+4+5+6 (D2 row 4 ADR amendment) |

#### Stage B (8 PRs — Wave 3 retrospective + carry-overs + B7 CRITICAL gap fix)

| PR | Squash HEAD | Subject | D1 stages fired |
|---|---|---|---|
| #39 | `1aa2811` | B1a — ADR-0012 v0.1.1 amendment + isWordLevelMatch utility (Stage B re-plan record) | 1+2+3+4+5+6 (D2 row 4 ADR amendment) |
| #40 | `5ec7123` | B1b — SearchBox Option B-4 hybrid integration + count-fixup + paired discriminator playwright restore | 1+2+3+5+6 |
| #41 | `317dda3` | B2 — sample-blocks Wave 3 cleanup (4 sample-assets binaries + intro prose refresh; closes gatekeeper smoke #8 + #9) | 1+2+3+5+6 |
| #42 | `5d49240` | B3 — content/notes/__test_cjk__ relocation (notes index filter; partial impl of ADR-0013 D3) | 1+2+3+5+6 |
| #43 | `dc216ab` | B4 — Stage A retro items 2 + 3 + 4 (cast asymmetry codify + UIDefault casing rename + ESLint argsIgnorePattern) | 1+2+3+4+5+6 (D2 row 1 multiple CONTRACT) |
| #44 | `794cd5d` | B5 — codex profile prefix R3 + lychee autolink-in-backticks memory codify | 1+2+3+4+5+6 (D2 row 1 agent-contract.md authority) |
| #45 | `8b6e2d8` | B7 — heavy block Astro hydration wiring + ADR-0014 v0.3 (CRITICAL gap; closes AC#1-#15-vitest-only coverage gap; chunk-leak deferred to Stage C per A8 D10) | 1+2+3+4+5+6 (D2 row 1+4 CONTRACT + ADR amendment) |
| #46 | `525e6c2` | B6 — Wave 4 close-ceremony preparation (3 audit codex dispatches + 3 curated summaries + Stage A+B PR roster) | 1+2+3+5+6 |

#### Stage C (2 PRs — gatekeeper smoke cleanup; truncated by gatekeeper reframe)

| PR | Squash HEAD | Subject | D1 stages fired |
|---|---|---|---|
| #47 | `49557d2` | C-2 — NnViz `mlp-mnist.json` hot-load fixture ship (Stage C.1 gatekeeper smoke cleanup; warm-up) | 1+2+3+5+6 |
| #48 | `de39e07` | C-1 — Pyodide `indexURL` jsdelivr CDN configuration (Jupyter MVP unblock; HIGH; lock path-(a) post plan-challenger 15-Q absorbtion) | 1+2+3+4+5+6 (D2 row 1 CONTRACT touch) |

**Stage C truncation**: Original Stage C planned 4 PRs (C-1/C-2/C-3/C-4) per orchestrator session 2026-05-04 起手 instruction. C-3 (PDF iframe black-screen) + C-4 (B7 chunk-leak measure) deferred to Wave 5 per gatekeeper 2026-05-04 path correction (mid-Wave reframe drift; Wave 5 plan-draft from scratch handles all deferred + reframe items).

**Forward-fix ratio analysis**:
- Total R-rounds across 21 PRs: ~14 (Stage A partial tracking; Stage B 8 R-rounds across 7 PRs ≈ 114%; Stage C: C-2 R1 PASS + C-1 R1 FAIL with 3 PR.md drift → R2 PASS = 2 R-rounds)
- True implementation-defect rate: ≈ **2/21 ≈ 9.5%** (B7 forward-fix commit `b448759` for CI playwright selector + B5 regen drift). Within ADR-0011 D8 ≤15% target.
- PR.md acceptance-text drift accounts for the bulk of R-rounds (codex strict-spec-match scrutiny on SOTed-PR.md content, NOT implementation defects). See R22.

### D2 — Wave 4 architecture decisions ratified (2 amendments + 1 status flip; NO new ADRs)

| ADR | Subject | Status change | PR(s) |
|---|---|---|---|
| [ADR-0014](ADR-0014-heavy-block-boundary.md) | HeavyBlockBoundary wrapper | proposed → accepted (v0.2.1 at A8) + v0.3 substantive amendment (NEW D10 production hydration + new AC#16) at B7 | #29 (Pre-A2 candidate creation), #38 (A8 v0.2.1), #45 (B7 v0.3) |
| [ADR-0012](ADR-0012-search-index-stack.md) | Search index stack | v0.1.1 substantive amendment (PageFind 1.5+ query-time substring finding + criterion 4 mitigation lock path-(b) custom query parser + dist path-prose alignment `_pagefind/` → `pagefind/`) | #39 (B1a) |

**No new ADRs created in Wave 4 main pipeline**. ADR-0014 was authored at Pre-A2 with status `proposed` then ratified post-implementation review at A8 + amended again at B7. The "amend-as-implementation-progresses" pattern (ADR proposed at design lock → accepted at Stage close → substantive amendment when production-runtime gap surfaces) proves valuable; codified as R20.

This Wave 4 close ADR (ADR-0015, this file) is the FIRST new ADR ratified at Wave 4 close (matches ADR-0010/0013 close-ceremony precedent).

### D3 — Wave 5 deferred items (binding handoff)

Per gatekeeper 2026-05-04 path correction directive, the following are explicitly deferred to **Wave 5 (plan-draft from scratch)**:

#### Reframe v2 scope (was prior session "Stage C 4 子阶段"; now Wave 5 main scope)

1. **Heavy block plugin tier** (locked 2026-05-03 gatekeeper):
   - Jupyter / NnViz / AgentFlow → "🔌 plugin" placeholder UI
   - C-1 (Pyodide CDN) infrastructure REMAINS as future plugin runtime support; current MVP UX path = plugin placeholder
   - ADR-0014 v0.4 amendment (or NEW ADR; TBD at Wave 5 plan-draft) covering plugin placeholder vs plugin-real-runtime split

2. **Grid + drag/drop forward** (per granularity doc v0.3.3 + reframe v2):
   - **ADR-0016**: grid 数据模型 + row flow (NOT dense; 保留空格) + responsive 12/6/1 + COL_SNAPS [2,3,4,6,8,12] (= 1/6 / 1/4 / 1/3 / 1/2 / 2/3 / full); markdown rowSpan='auto' 渲染派生不入持久化的不对称
   - **ADR-0017**: drag/drop UX 4 边缘对称 (split-left/right 切 host + split-top/bottom 插行) + outline overlay 方案 A (静态底层 + per-affected-block dashed accent overlay) + snapshot hit-test 选项 1 (预计算 edge rects + 距离 tiebreak) + 源块 lift 模式 + useAutoRowSpan hook + EDGE_W = 28px (half-in/half-out)
   - mdx-bridge col/row/colSpan/rowSpan 序列化 + editor-shell grid 集成 + ADR-0014 v0.4 amendment (HeavyBlockBoundary 在 grid context dimensions 跟 colSpan/rowSpan 联动)

3. **v2 视觉 identity forward** (per granularity doc L1 visual migration):
   - **ADR-0018**: design-tokens OKLCH 切 (cream `oklch(99% 0.005 80)` / accent 橙红 35° / canvas 蓝 215° / mark 黄 90°) + Inter + JetBrains Mono fonts + block kind 顶 2px 彩色横条 (canvas 215° / runnable 145° / image 60° / markdown 无横条 / math/pdf/jupyter/nn-viz/agent-flow TBD hue) + prose customization (b-quote / b-callout / b-code / aref) + typography 升级 (15px/1.55 body, H1 28px/700/-0.018em, etc.)

4. **Editor-shell wire to apps/site** (CRITICAL for Phase 1 完成):
   - `apps/site` 加 `/notes/[slug]/edit` 路由 mount editor-shell
   - BlockRegistry + KernelRegistry + mdx-bridge wire-up
   - palette / slash-menu / drag-handle / toolbar 组装
   - save/load 双向 (MDX file ↔ Tiptap state)

#### Stage C residue (deferred)

- **C-3** (MID): PDF iframe 黑色空白显示调查 + fix
- **C-4** (MID): B7 chunk-leak measure + 决定优化 (per Wave 4 plan A8 D10 measure-first; B6 perf-auditor surfaced evidence)
- `apps/site/test-results/` gitignore housekeeping

#### Wave 5 plan-draft path (per gatekeeper 2026-05-04 directive)

- **Inputs**: memory `project_wave4_reframe_v2.md` + granularity doc `/mnt/d/download/web/v2-design-granularity.md` v0.3.3 + v2 demo files (`proto-app.jsx` / `proto-canvas.jsx` / `proto-styles.css` / `drag-storyboard.css` / `filled-content.jsx`) + this ADR D4 retrospective items
- **Per-ADR plan-challenger required** (ADR-0007 D5 + ADR-0011 D2 v0.1.1):
  - ADR-0016 grid 数据模型 — plan-challenger round
  - ADR-0017 drag/drop UX — plan-challenger round
  - ADR-0018 v2 视觉 migration — plan-challenger round
- Wave 5 plan v1.0 lock before any Wave 5 implementation
- ~18-24 PR / 3-5 sessions estimate (4 子阶段: cleanup + grid+drag + v2-visual + editor-wire)

### D4 — Wave 4 retrospective items (9 NEW + 13 carry-forward)

#### NEW from Wave 4 (R14-R22)

| # | Item | Class | Codification |
|---|---|---|---|
| R14 | **Mid-Wave reframe via plan amendment, not memory-only** (gatekeeper-surfaced 2026-05-04) — 2 reframes (heavy block plugin tier 2026-05-03 + grid/v2/editor forward 2026-05-04) absorbed via memory entry only NOT through D1 pipeline plan amendment; risk = future orchestrator improvises mid-stream off non-canonical context. Mitigation: each reframe → "Wave N plan v0.X amendment PR" via D1 pipeline (matches ADR-0011 v0.1.1 + ADR-0014 v0.2.1 + ADR-0012 v0.1.1 precedent of substantive Amendments § locks via D2 row 4 fire). Memory entries are session-scoped reads but plan amendments are spec-locked decisions. | Process / discipline | NEW memory entry `feedback_mid_wave_reframe_via_plan_amendment.md` (Wave 5 起手 enforce: gatekeeper directive → orchestrator opens "Wave N plan v0.X amendment PR" → plan-challenger round → lock → THEN implementation) |
| R15 | **B7 CRITICAL gap (production hydration missing from AC#1-#15)** — ADR-0014 v0.2 D8 specified import wiring + AC#1-#15 verified React component contract via vitest/jsdom + 1 playwright on SSR-skeleton T0/T1, but production Astro hydration end-to-end (componentsMap → Astro `client:*` → React island → useEffect → load() → real component) was NOT in AC#1-#15 → forever-loading skeleton at runtime. Resolution: ADR-0014 v0.3 amendment with NEW D10 + new AC#16 + 3 React islands at B7. Lesson: AC must include END-TO-END production-path assertion, not just unit-test contract assertion | AC coverage gap | (codified in ADR-0014 v0.3 + B7 PR.md; pattern note for future ADRs: AC checklist must include "production runtime end-to-end" hat) |
| R16 | **C-1 plan-challenger 15-Q absorbtion override** — plan-challenger recommended path-(c) hybrid (dev=CDN / prod=self-host); orchestrator locked path-(a) CDN-only with rationale: single-user dev MVP; offline-first not yet required; Q4 absorbed naturally because Pyodide default `packageBaseUrl` derives from `indexURL` so loadPackage('numpy') resolves automatically from same CDN base. Validates "plan-challenger advisory NOT mandatory" pattern but requires explicit absorbtion table per ADR-0007 D5. | plan-challenger consumption | (codified in C-1 PR.md `## Plan-challenger absorbtion` section) |
| R17 | **C-2 file size precision matters** — initial mlp-mnist.json was 2078 bytes (just over the ≤2048 budget specified in TC2); compacted initializer blocks brought it to 1790 bytes. TC2 file-size assertion catches just-over-budget drift before commit. Lesson: budget assertions must be tight enough to catch initial-author overshoot | EXECUTE-time precision | (codified in C-2 PR.md `## test_cases` TC2) |
| R18 | **B6 wave-4-prep audit summaries consumable as wave-4-close evidence** — B6's three audits (structure / perf / mdx) ran post-B5 main; pre-C-1/C-2. C-1 (1 LOC source change + 1 NEW CI-skipped test) + C-2 (1 data file) introduce **0 package additions / 0 chunking changes / 0 mdx-bridge fixture changes** — wave-4-prep audits remain materially valid at wave-4-close baseline. This close ceremony ships 3 wave-4-close audit summaries as **light addendums** referencing wave-4-prep + acknowledging C-1/C-2 NO-OP delta (saves ~15-20 min + 3 large codex logs vs codex re-run). Valid because deltas are minimal-impact-class. | close-ceremony pragmatism | (codified in this ADR D5 reasoning + 3 wave-4-close audit summary files) |
| R19 | **Single-PR close-ceremony cadence** — matches ADR-0010 (Wave 2 close) + ADR-0013 (Wave 3 close) pattern: 5-6 files (close ADR + active.md + 3 audit summaries [+ PR.md self-listed for ADR-0011-era close]). NOT split into separate ADR PR + audit summary PR. Wave 4 close = 6 files (this ADR + active.md + 3 audits + PR.md self-listed) | close ceremony single-PR | (codified in this ADR commit; PR.md `## files` section) |
| R20 | **D2 row 1+4 stage 4 fired 11 times across Wave 4** (vs Wave 3's 2; substantive activity-rate increase): Pre-A2 (ADR-0014 candidate creation), A1 (NEW CONTRACT.md), A4 (CONTRACT consolidation), A5 (multi-CONTRACT touches), A8 (ADR-0014 v0.2.1 amendment), B1a (ADR-0012 v0.1.1 amendment), B4 (multi CONTRACT), B5 (agent-contract.md authority), B7 (ADR-0014 v0.3 + apps/site/CONTRACT.md), C-1 (apps/site/CONTRACT.md), this close-ceremony PR (ADR-0015 NEW). Each catch was substantive (no echo chamber) — validates dual-LLM stage 3 + stage 4 design at scale. Reflects substantive ADR amendment + CONTRACT.md activity rate higher than Wave 3 | D2 row 1+4 efficacy | (codified in this ADR D5 evaluation) |
| R21 | **Codex audit-log 2.6 MB self-recursion repeat** (C-1 plan-challenger dispatch generated 2.6 MB log; `head -2000` truncate captured grep noise from earlier audit logs not actual verdict; orchestrator forced to grep raw `/tmp` log with `grep -E '^(Q[0-9]+|Verdict\|VERDICT\|...)'` for verdict-shaped lines). Mitigation extension: keep R7 piping discipline (Wave 3 codified) + add **post-hoc grep-for-verdict-shaped-lines workflow** for any codex log > 500 KB | codex audit-log handling | (codified update to `feedback_codex_audit_log_recursion.md` — extend with post-hoc verdict extraction protocol + structured output prefixes recommended in dispatch prompts) |
| R22 | **Forward-fix rate classification refinement** — Stage B raw-extras 8 / 7 PRs ≈ 114% misleads as "high defect rate" because most R-rounds were PR.md acceptance-text drift caught by codex-pr-reviewer-55 strict-spec-match (NOT implementation defects). True implementation-defect rate: 2/21 ≈ 9.5% (B7 fwd-fix `b448759` CI playwright selector + B5 regen drift). Wave 4 introduces **two-class fwd-fix tracking**: (a) PR.md drift R-rounds (process; bounded by SOTed-PR.md discipline) (b) Implementation defect R-rounds (correctness; bounded by ADR-0011 D8 ≤15% target). Class (a) does NOT count toward D8 target | forward-fix tracking | NEW memory entry `feedback_forward_fix_classification.md` (Wave 5 baseline framework: per-stage `docs/audits/forward-fix-2026-05-wave-N.md` cadence with two-class breakdown) |

#### Carry-forward from Wave 3 (R1-R13)

R1-R13 from [ADR-0013](ADR-0013-wave-3-close.md) D4 remain valid for Wave 4. Highlights confirmed at Wave 4 scale:
- **R1** SOTed-PR.md discipline: Wave 4 PR.md acceptance drift down vs Wave 2 baseline; supports R22 classification
- **R2** auto-merge: 21 PRs auto-merged via `gh pr merge --squash --delete-branch`; pattern stable
- **R7** codex audit-log recursion: triggered again at Wave 4 (R21 extends mitigation)
- **R13** plan-challenger absorbtion table: 3 plan-challenger rounds at Wave 4 (Pre-A2 12/12 + Pre-A3 15/15 + C-1 15/15) all yielded substantive challenges absorbed; pattern works at scale

### D5 — ADR-0011 D1 linear pipeline empirical evaluation (continuation; 21 PRs Wave 4)

ADR-0011 D1 was empirically validated in Wave 3 (24 PRs serial) and **kept for Wave 4** without amendment. Wave 4 **second-time evaluation** (21 PRs serial across 3 sessions):

**Confirmed working (Wave 3 → Wave 4)**:
- 6-stage strict serial execution provides unambiguous next-action at every PR boundary (3 sessions × 7 PRs/session reliably)
- Codex-heavy stages 2+3+5 successfully delegated bulk authorship; orchestrator focused on planning + integration + judgment
- D2 v0.1.1 SOTed-PR.md schema continues to reduce R-rounds (Stage A4-A8 + Stage B + C-2 mostly 0-1 R; only C-1 R1 hit 3 PR.md drift items — caught and fixed at R2)
- pr-writer subagent dispatch at PLAN + ACCEPT proven valuable across 21 PRs × 2 = ~42 dispatches; consistent quality
- Stage 4 PRE-COMMIT CLAUDE REVIEW fired 11 times in Wave 4 (vs Wave 3's 2; per R20 enumeration); each catch was substantive (no echo chamber)
- Researcher subagent NOT dispatched in Wave 4 (no external research need; granularity doc + v2 demo are user-provided gatekeeper-side scratch)

**New friction (Wave 4-specific)**:
- Mid-Wave reframe drift (R14): gatekeeper directives announced via prose (not D1 pipeline) created memory-only context; future orchestrator could improvise off non-canonical state. Mitigation = R14 codification.
- Codex 2.6 MB log incident (R21): C-1 plan-challenger dispatch self-recursed; mitigation extension = post-hoc grep-for-verdict workflow.
- Stage C truncation: gatekeeper reframe forced Stage C close at 2/4 PRs; not pipeline failure but plan-vs-execution drift.

**Verdict**: ADR-0011 D1 linear pipeline **KEPT for Wave 5** without amendment to D-list. Add R14 (mid-wave reframe handling via plan amendment PR) + R21 (post-hoc verdict extraction) as Wave 5 起手 disciplines (memory codification; ADR amendment NOT needed since these are runbook + memory disciplines, not pipeline structural changes).

### D6 — Wave 5 plan-draft handoff

`docs/plans/active.md` repointed to Wave 5 plan-draft pending. Wave 5 is **NOT** Stage D of Wave 4 (which doesn't exist); Wave 5 is a fresh wave with its own plan-draft authoring per the per-wave cadence (Wave 1 → 2 → 3 → 4 → 5).

Wave 5 plan-draft authoring (NEXT session per gatekeeper directive):
- Wave 5 plan path: `docs/superpowers/plans/2026-05-XX-phase-1-wave-5-integration.md` (NEW; orchestrator authors at Wave 5 起手)
- Wave 5 plan-draft Pre-A scope (recommended):
  - Pre-A1: Wave 5 plan-draft authoring + plan-challenger 4-round (challenge granularity / sub-stage scope / per-PR estimates)
  - Pre-A2: ADR-0016 grid 数据模型 design lock + plan-challenger
  - Pre-A3: ADR-0017 drag/drop UX design lock + plan-challenger
  - Pre-A4: ADR-0018 v2 视觉 migration design lock + plan-challenger
  - Pre-A5: Wave 5 plan v1.0 lock (plan-challenger absorbtion table)
- Wave 5 main pipeline scope: 4 子阶段 cleanup + grid+drag + v2-visual + editor-wire ~14-20 PRs
- Wave 5 mandatory carry-overs:
  - Heavy block plugin tier UX (locked 2026-05-03)
  - C-3 PDF iframe black-screen
  - C-4 B7 chunk-leak measure
  - apps/site/test-results/ gitignore
- Wave 5 NEW scope: determined at Wave 5 plan-lock

## Consequences

### Positive

- 21 PRs merged across 3 Claude orchestrator sessions in 2 calendar days (2026-05-03 → 2026-05-04); validates ADR-0011 D1 linear pipeline at Wave 4 scale (continuation from Wave 3)
- ADR-0014 fully ratified through `proposed → accepted` + 2 substantive amendments (v0.2.1 + v0.3); pattern proves "amend-as-implementation-progresses" works
- B7 production hydration gap (R15) caught by gatekeeper post-Stage-A; Wave 4 closes with hydration verified end-to-end
- 9 NEW retrospective items (R14-R22) captured + 13 inherited from Wave 3 (R1-R13)
- 3 plan-challenger rounds (Pre-A2 12/12 + Pre-A3 15/15 + C-1 15/15) all yielded substantive absorbtion tables — validates plan-challenger pattern at scale
- Mid-Wave reframe drift (R14) surfaced and corrected at close ceremony rather than carrying as silent debt to Wave 5

### Negative

- Stage C original scope (4 PRs C-1/C-2/C-3/C-4) only delivered 2/4; C-3/C-4 deferred to Wave 5
- Mid-Wave reframe drift (R14) = process discipline gap that Wave 5 起手 must close via memory codification + reframe-as-plan-amendment-PR workflow
- B7 CRITICAL gap (R15) was post-Stage-A surfacing — earlier AC checklist hat for "production runtime end-to-end" would have caught at design lock; Wave 5 ADR template adoption recommended
- Codex audit-log 2.6 MB recursion (R21) repeat — R7 mitigation needs extension (post-hoc verdict extraction protocol)

### Neutral / explicit acknowledgements

- Wave 4 main pipeline did NOT execute the original 21+-PR plan as fully sequential — Stage C truncated at 2/4 by user gatekeeper directive (heavy block plugin tier reframe + Wave 5 forward of grid/v2/editor)
- Reframe v2 (memory entry `project_wave4_reframe_v2.md`) NOT a Wave 4 plan amendment per gatekeeper 2026-05-04 path correction; INPUT to Wave 5 plan-draft (preserved as INPUT, NOT acted upon as Wave 4 implementation contract)
- 3 wave-4-close audit summaries (structure/perf/mdx) are **light addendums** to the wave-4-prep audits (B6 codex dispatches), NOT fresh codex re-runs — justified by R18 NO-OP delta from C-1/C-2

## Compliance

- This ADR satisfies [ADR-0010](ADR-0010-wave-2-close.md) close-ceremony precedent (D1 process learnings + D2 commit roster + D3 deferred items + D5 hand-off + D6 plan-draft repoint)
- This ADR fulfills [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) D8 Wave 4 close-ceremony requirement (linear pipeline empirical evaluation continuation)
- This ADR ratifies the 2 substantive amendments to ADR-0014 (v0.2.1 + v0.3) and the substantive amendment to ADR-0012 (v0.1.1) shipped within Wave 4 main pipeline
- This ADR does NOT amend [ADR-0009](ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union — Wave 4 used the union as-is
- This ADR does NOT amend [ADR-0008](ADR-0008-wave-2-entry-policies.md) D1 dead-dep policy — Wave 4 added 1 new package (`@skb/heavy-block-boundary` at A1) with explicit consumer registration
- This ADR does NOT change [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) D-list (KEPT)

## Related

- [ADR-0010 Wave 2 close](ADR-0010-wave-2-close.md) — close-ceremony template
- [ADR-0013 Wave 3 close](ADR-0013-wave-3-close.md) — close-ceremony template + R1-R13 inherited
- [ADR-0011 linear pipeline execution model](ADR-0011-linear-pipeline-execution-model.md) — empirical evaluation continuation
- [ADR-0014 HeavyBlockBoundary](ADR-0014-heavy-block-boundary.md) — Wave 4 main implementation target; v0.2.1 + v0.3 ratified here
- [ADR-0012 search index stack](ADR-0012-search-index-stack.md) — v0.1.1 ratified here
- [Wave 4 plan locked v0.2.1](../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — original plan + B1 split + B7 NEW + Stage B re-lock 8 PRs
- [docs/plans/active.md](../plans/active.md) — repointed to Wave 5 plan-draft pending
- [structure-2026-05-wave-4-close.md](../audits/structure-2026-05-wave-4-close.md) — light addendum referencing wave-4-prep
- [perf-2026-05-wave-4-close.md](../audits/perf-2026-05-wave-4-close.md) — light addendum referencing wave-4-prep
- [mdx-2026-05-wave-4-close.md](../audits/mdx-2026-05-wave-4-close.md) — light addendum referencing wave-4-prep
- [structure-2026-05-wave-4-prep.md](../audits/structure-2026-05-wave-4-prep.md) — B6 dispatched audit (referenced)
- [perf-2026-05-wave-4-prep.md](../audits/perf-2026-05-wave-4-prep.md) — B6 dispatched audit (referenced)
- [mdx-2026-05-wave-4-prep.md](../audits/mdx-2026-05-wave-4-prep.md) — B6 dispatched audit (referenced)
- 22 retrospective memory entries (R1-R22): see D4 tables for individual paths
