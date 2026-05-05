# Wave 5 — Phase 1 integration plan

| 字段 | 值 |
| ---- | --- |
| 状态 | **locked v1.1** (R14 amendment 2026-05-05; v1.0 → v1.1 to formalize C.2-1→C.2-3 defer-chain via NEW row C.2-3.5; per [ADR-0015](../../decisions/ADR-0015-wave-4-close.md) R14 + memory `feedback_r14_defer_chain_plan_amendment.md`; v1.0 lock evidence preserved in `## v1.0 Pre-A5 final lock amendments` section; v1.1 amendment evidence in NEW `## v1.1 R14 amendment (2026-05-05)` section) |
| Wave | Phase 1 Wave 5 |
| 起步 HEAD | `a157168` (Wave 4 close ceremony PR #49 squash; ADR-0015 ratifying 21-PR Wave 4 + Wave 5 deferred set) |
| 起步预备 | (Pre-A1 [this lock] is the first Wave 5 PR) |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | [ADR-0015 D6 Wave 5 plan-draft handoff](../../decisions/ADR-0015-wave-4-close.md) + memory `project_wave4_reframe_v2.md` + granularity doc `/mnt/d/download/web/v2-design-granularity.md` v0.3.4 (gatekeeper-side scratch; not in git) + 2026-05-04 gatekeeper directive (per-ADR plan-challenger 4-round + lock v1.0 before implementation) |
| 替代 | 不替代任何 ADR；this is a workplan, not architecture |

## Context

Wave 4 closed 2026-05-04 ([ADR-0015](../../decisions/ADR-0015-wave-4-close.md), HEAD `a157168` post close-ceremony PR #49) with 21 main pipeline PRs across Pre-A + 3 stages (A=8, B=8, C=2 truncated). ADR-0015 D3 binds 4 categories of Wave 5 inputs:

1. **Reframe v2 scope** (was Wave 4 Stage C 4 子阶段; absorbed via memory entry `project_wave4_reframe_v2.md` only, NOT D1 pipeline plan amendment — R14 drift pattern):
   - Heavy block "🔌 plugin" placeholder UI (locked 2026-05-03 gatekeeper)
   - Grid + drag/drop forward (per granularity doc v0.3.4 + ADR-0016/0017)
   - v2 视觉 identity forward (ADR-0018 NEW; granularity Phase 2+ L1 visual reframe)
   - Editor-shell wire to apps/site (CRITICAL for Phase 1 完成)
2. **Stage C residue** deferred from Wave 4: C-3 PDF iframe 黑屏 + C-4 chunk-leak + `apps/site/test-results/` gitignore housekeeping
3. **Wave 4 retrospective items** (R14-R22): R14 mid-Wave reframe via plan amendment is the **key Wave 5 起手 discipline**; R21 codex audit-log post-hoc verdict extraction extension
4. **Per-ADR plan-challenger** (per ADR-0007 D5 + ADR-0011 D2 v0.1.1): ADR-0016 + ADR-0017 + ADR-0018 each round; Wave 5 plan v1.0 lock at Pre-A5

The 2026-05-04 gatekeeper directive (post Wave 4 close) explicitly mandates:
- Wave 5 plan-draft from scratch (NOT continuation of Wave 4 Stage C iteration)
- per-ADR plan-challenger 4-round (matches Wave 4 Pre-A2 ADR-0014 12/12 absorbed precedent)
- Wave 5 plan v1.0 lock BEFORE Wave 5 implementation
- R14 discipline enforced

ADR-0011 D1 KEPT for Wave 5 unchanged (per ADR-0015 D5). Operational disciplines (`--yolo` + `set -o pipefail` + `/tmp` piping + `head -2000` archive OR R21 grep-for-verdict for log > 500 KB) inherit from Wave 4 Pre-A1.

Resource baseline at HEAD `a157168`:
- 21 packages (no Wave 4 net change beyond `@skb/heavy-block-boundary` add at A1)
- ADR roster: 15 ADRs (ADR-0001 to ADR-0015; ADR-0016/0017/0018 to be authored at Pre-A2/A3/A4)
- 1 long-term Claude session (orchestrator) per ADR-0011 D8 invariant (Wave 5 estimate: 3-5 sessions per reframe v2 memory)

## ADR 编号映射表 (per Q7 absorbtion — old→new, 单一引用规则)

> **必读**：本 plan 与所有 Wave 5 PR.md / ADR 文件**统一使用新编号** (ADR-0016/0017/0018)。granularity doc v0.3.4 body 仍用历史旧编号 (0012 grid / 0013 drag/drop / 0014 modal / 0015 CLI / 0016 editor runtime); 阅读 granularity doc 时**必先映射**。

| 历史编号 (granularity v0.3.x body) | Wave 5 实际 ADR 编号 | 主题 | Wave 5 lock 时点 |
|---|---|---|---|
| 0012 (grid 数据模型) | **ADR-0016** | Grid 数据模型 + row flow + COL_SNAPS + 响应式 | Pre-A2 |
| 0013 (drag/drop UX) | **ADR-0017** | Drag/drop UX + outline overlay 方案 A + edge rects + lift 模式 | Pre-A3 |
| (Phase 2+ L1 visual; granularity 原 Phase 2+ scope) | **ADR-0018** (NEW reframe v2 forward) | v2 视觉 migration: OKLCH + Inter + JetBrains Mono + 顶 2px 横条 + prose customization | Pre-A4 |
| 0014 (modal canvas) | **ADR-0019+** (Phase 2+; NOT Wave 5 scope) | Modal canvas editor (Figma-style 三栏) | Phase 2+ |
| 0015 (CLI grammar + 命令目录) | **ADR-0020+** (Phase 2+; NOT Wave 5 scope) | Doc CLI agent-facing API | Phase 2+ |
| 0016 (editor runtime 命令通道) | **ADR-0021+** (Phase 2b+; NOT Wave 5 scope) | Editor runtime 命令通道协议 | Phase 2b+ |

**统一引用规则**:
1. plan 正文 + Wave 5 PR.md 正文统一使用 **新编号** (ADR-0016/0017/0018); 旧编号仅附注历史语境。
2. 每个 Wave 5 PR.md `## adr_touched` 字段必显式标新编号 (e.g., `ADR-0016` not `0012`).
3. 引用 granularity doc 时使用 prose form 注明 "granularity body § 编号 0012 = ADR-0016"。
4. Wave 5 close ADR (ADR-0019) 在 close-ceremony 时 ratify 编号锁与 granularity doc final retire 状态。

## MVP Framework Notes

> **Explicitly first segment** per 2026-05-04 gatekeeper directive ("Plan 第一段 显式写入 ## MVP Framework Notes"). MVP framing differs from Wave 4 Stage C "user-iteration open-ended" framework — Wave 5 has a **fixed scope boundary** (4 子阶段) with **per-stage escape-valve decision points**.

**MVP target** = v2 demo 整体体验的 functional minimum. **NOT a simplified version**. User must be able to:
- 在浏览器编辑笔记
- 用 12-col grid 排版块
- 拖拽块重排（4 边缘对称 split-left/right/top/bottom）
- 看到 cream + 橙红 + Inter 的 v2 视觉 identity

**Heavy blocks** (Jupyter / NnViz / AgentFlow) ship as **"🔌 plugin" placeholder** in Wave 5 — Wave 5 不实施 真渲染. Real Pyodide / TF.js / React Flow runtime 留 Phase 2+. C-1 CDN infrastructure (Wave 4 PR #48 HEAD `de39e07`) preserved as future plugin-real-runtime support; not deleted in C.1.

### Stage close = user MVP-judgment escape valve

Each sub-stage close (C.1 / C.2 / C.3 / C.4) is a **mandatory stop point** at which user decides:

1. **"继续下一 stage"** → orchestrator opens next sub-stage
2. **"差不多了 ship"** → Wave 5 close ceremony (ADR-0019) on current state = MVP
3. **"调整 X"** → R14 discipline plan amendment PR via D1 pipeline → plan-challenger → lock → resume

Do NOT batch all 4 sub-stages then stop = drift risk. Per-stage user check-in is canon.

### MVP fallback timing (per Q5 absorbtion — user 长时间不响应 兜底)

Default progression rules when user does not respond at sub-stage close:

| 阶段 close 后 user 静默时长 | 默认动作 | Owner |
|---|---|---|
| ≤ 5 工作日 | wait (passive) | orchestrator |
| > 5 工作日 (= "长时间不响应" trigger) | orchestrator 触发 R14 pre-scan + 强制提交"缺失项清单" PR.md (列举当前 sub-stage 的 open risks + outstanding 决策点 + 推荐 next-action 路径) | orchestrator (auto) |
| > 7 工作日 (= "默认 close-prep" trigger) | orchestrator 进入 close-prep 模式: 暂停 implementation; 准备 Wave 5 close ceremony (current state = MVP) | orchestrator + reviewer (joint) |

阈值仅作 fallback safety; user explicit decision 始终 override default progression。每 stage close 在 PR.md `## acceptance` 中显式记录 stage close 时间戳，方便后续追溯。

### Wave 5 close conditions (per Q9 absorbtion — handoff pack mandatory)

Any one fires close-ceremony fresh session:

- C.1-C.4 全部完成 + user MVP-ready judgment (canonical happy path)
- User mid-Wave explicit "Wave 5 close 准备" (escape-valve at any sub-stage close)
- Orchestrator session ctx > 600K tokens (preventive close to avoid context churn)
- MVP fallback timing > 7 工作日 静默 (default close-prep)

### Handoff pack (per Q9 absorbtion — session boundary 闭环)

每 Stage close (C.1 / C.2 / C.3 / C.4) **强制**生成 `docs/plans/wave-5-main/<Stage>-handoff-pack.md` 包含:

1. **决策摘要**: 本 stage 已 lock 的 ADR/D-list/PR scope 精炼总结
2. **未决风险**: open risks + 已识别但未触发的 R14 candidates
3. **测试状态**: vitest/playwright/visual-smoke 通过率快照 + 已知 flaky/skipped tests
4. **开放 ADR/PR 依赖**: pending ADR amendments + 跨-stage 依赖 PRs

**下一 session 第一动作 = 复读 handoff pack 并在新 session opening message 显式确认**。每 handoff pack 限 ≤ 200 LOC (避免再生 plan 风险)。

Wave 5 close ceremony pattern follows Wave 4 (ADR-0015): NEW ADR-0019 + active.md repoint + audit summaries; fresh session per ADR-0011 D8 single-long-session invariant.

## Decision

Wave 5 ships **5 Pre-A PRs (plan + 3 ADRs + final lock) + 4 sub-stage main pipeline (C.1/C.2/C.3/C.4)**. Per-PR breakdown for sub-stages is TBD until ADR-0016/0017/0018 lock at Pre-A2/A3/A4; Pre-A5 v1.0 final lock includes the locked PR list.

PR-by-PR breakdown below per ADR-0011 D2 v0.1.1 SOTed-PR.md schema (title / files / test_cases / contracts_affected / adr_touched / acceptance / executor / **verification required** [Q2 absorbtion]). **Plan-challenger codex round** validates granularity per ADR-0007 D5 + R13; absorbtion table at end of this plan locks v0.2 scope.

### Pre-A roadmap (5 PRs — bootstrap)

Each Pre-A PR follows D1 pipeline 6 stages. Per Wave 4 Pre-A1+2+3 precedent, Pre-A1+5 are bootstrap-flavored (orchestrator-self for PLAN+EXECUTE+COMMIT; codex pr-reviewer-55 still runs at REVIEW). Pre-A2+3+4 (ADR design lock) follow Wave 4 Pre-A2 precedent (orchestrator-self + plan-challenger 4-round; D2 row 4 fires at PRE-COMMIT CLAUDE REVIEW).

#### Pre-A1 — Wave 5 plan-draft v0.1 + plan-challenger → v0.2 lock (this PR)

- **scope**: author plan v0.1 + dispatch plan-challenger codex + absorb verdicts → v0.2 lock + repoint `docs/plans/active.md` + bundle Wave 4 close residue audit log archive
- **size**: ~600-700 LOC plan + ~50 LOC active.md + audit log archives (truncated)
- **executor**: orchestrator-self (bootstrap-flavored)
- **D2 trigger judgment**: standard PR (no row hit). Stage 4 NOT mandatory; orchestrator-self review at minimum.
- **verification required** (per Q2 absorbtion): TC1-TC14 in PR.md (file existence + structure + section presence + lychee CI + pnpm check + lockfile unchanged) — all shell + GitHub Actions assertions; no vitest/playwright.

#### Pre-A2 — ADR-0016 grid 数据模型 design lock + plan-challenger 4-round

- **scope**: author `docs/decisions/ADR-0016-grid-data-model.md` (status: proposed) per granularity doc v0.3.4 § 0012-equiv body (refer via mapping table) + reframe v2 memory. Lock D-list:
  - 12-col grid + `grid-auto-flow: row` (NOT dense; "不替用户排版" 共识)
  - Data model `{col: 1-12, row?: number, colSpan: 1-12, rowSpan: number | 'auto'}`
  - **markdown rowSpan='auto' rendering-derived (ResizeObserver scrollHeight 反算行数), 不入持久化** — 与其他 block 不对称 (ADR 必须明示)
  - 其他 block rowSpan = user 设定整数, 入持久化
  - Responsive: 桌面 ≥1024px 12 列 / 平板 768-1024px 6 列 / 手机 <768px 1 列
  - Snap 档位: `COL_SNAPS = [2, 3, 4, 6, 8, 12]` = 1/6 / 1/4 / 1/3 / 1/2 / 2/3 / full
  - MDX serialize 保留 col / row / colSpan / rowSpan 字段（git diff 友好）
  - block-foundation 加 W5-1 invariant (grid context dimensions 与 colSpan/rowSpan 联动)
- **size**: ~400-500 LOC ADR prose + ~10 LOC `block-foundation/CONTRACT.md` W5-1 invariant + ~5 LOC `docs/decisions/README.md` ADR roster
- **executor**: orchestrator-self (doc-policy)
- **D2 trigger judgment**: Row 4 (NEW ADR) HIT + Row 1 (CONTRACT.md W5-1 invariant) HIT → stage 4 PRE-COMMIT CLAUDE REVIEW fires
- **verification required** (per Q2): vitest fixture for ResizeObserver race (Pre-A2 plan-challenger Q2 candidate; round-trip serialize); shell test for ADR file presence + W5-1 invariant grep + ADR roster update

#### Pre-A3 — ADR-0017 drag/drop UX design lock + plan-challenger 4-round

- **scope**: author `docs/decisions/ADR-0017-drag-drop-ux.md` (status: proposed) per granularity doc v0.3.4 § 0013-equiv body (refer via mapping table). Lock D-list:
  - 4 边缘对称 drop modes: `split-left/right` 切 host + `split-top/bottom` 插行 + `empty` + `none`
  - Outline overlay 方案 A: 静态底层 (drag 期间不动) + 3 类 dashed accent overlay (new block + host + shifted-block)
  - 命中检测算法: 选项 1 预计算 edge rects half-in/half-out 28px + 距离 tiebreak (重叠 gap 区按距离排); 选项 2/3 留 Phase 2+ 性能优化路径
  - 源块 lift 模式: drag-start 时源块 从 grid lift; 落点判定基于无源块 grid
  - `EDGE_W = 28px` (=14px 进 + 14px 出 = 14 gap match)
  - `useAutoRowSpan` hook for markdown 内容驱动 rowSpan
  - 全局 Esc 取消语义
- **size**: ~500-600 LOC ADR prose
- **executor**: orchestrator-self (doc-policy)
- **D2 trigger judgment**: Row 4 (NEW ADR) HIT → stage 4 fires (Row 1 NO unless CONTRACT touched at lock)
- **verification required** (per Q2): vitest unit for edge-rect tiebreak distance公式 + shell ADR file presence + ADR roster update

#### Pre-A4 — ADR-0018 v2 视觉 migration design lock + save-path 接口冻结 + plan-challenger 4-round

- **scope**: author `docs/decisions/ADR-0018-v2-visual-migration.md` (status: proposed; NEW reframe v2 forward). Lock D-list:
  - design-tokens OKLCH 切: cream + accent 35° + canvas 215° + mark 90° (per v2-styles.css 全套 token)
  - Inter (sans) + JetBrains Mono (mono) Google Fonts 预连接
  - block kind 顶 2px 彩色横条: canvas 215° / runnable 145° / image 60° / markdown 默认无横条 / math/pdf/jupyter/nn-viz/agent-flow TBD hue
  - prose customization: b-quote / b-callout / b-code / aref inline anchor
  - typography 升级: 15px/1.55 body, H1-H3 sizes/weights/tracking
  - shadow 暖色调 `rgba(20,15,10, ...)`
  - 8 light block CSS 校准 (OKLCH switchover collateral; ux-ui-lead Stage C.3)
  - **NEW per Q4+Q8 absorbtion**: **save-path 方案草案 + 回退路径** (apps/api endpoint vs Astro endpoint vs localStorage prototype) — 在此 ADR 接口冻结 (Pre-A5 仅做确认与验收, 减少晚期改动); 若此处 surface "持久化路径变更" 或 "接口契约调整" 即 D2 row 4 (ADR amendment 范围扩大) + row 1 (CONTRACT.md 影响 apps/site 或新 package) 立即触发 stage 4 PRE-COMMIT CLAUDE REVIEW
- **size**: ~400-500 LOC ADR prose + ~80 LOC save-path interface freeze (TS interface + scenarios)
- **executor**: orchestrator-self (doc-policy authoring) + ux-ui-lead subagent (one-shot for Stage C.3 implementation; ADR design lock 仅 orchestrator)
- **D2 trigger judgment**: Row 4 (NEW ADR) HIT → stage 4 fires; **若 surface save-path CONTRACT 影响**: Row 1 ALSO fires (per Q4 escalation rule)
- **verification required** (per Q2): playwright smoke for save round-trip on apps/site (post-implementation; ADR lock 不要求 playwright run, 但 ADR-0018 D-list 必含 save-path 测试 fixture 模板); shell ADR file presence + ADR roster update + save-path interface TypeScript 编译通过

#### Pre-A5 — Wave 5 plan v1.0 final lock

- **scope**: update Wave 5 plan to v1.0 with:
  - Stage C.1-C.4 per-PR breakdown (locked post ADR-0016/0017/0018 + Pre-A4 save-path 接口冻结)
  - Refined risk predictions (incorporating Pre-A2/3/4 plan-challenger insights)
  - Cross-referenced absorbtion tables from Pre-A1+2+3+4 plan-challenger rounds
  - Explicit Stage C.1-C.4 escape-valve decision-point semantics + handoff pack template
  - Repoint `docs/plans/active.md` from "Wave 5 plan v0.x; Pre-A4 next" to "Wave 5 plan v1.0 locked; Stage C.1 starting"
- **size**: ~150-200 LOC plan diff + ~30 LOC active.md update + audit log archives
- **executor**: orchestrator-self (bootstrap-flavored close of Pre-A roadmap)
- **D2 trigger judgment**: standard PR. **若 v1.0 surface ADR amendment 必要 → Q4 escalation**: 立即 D2 row 4 fires; 若涉及 CONTRACT 同步 = Row 1 also fires; v1.0 不应 surface 重大 ADR amendment (那应在 Pre-A2/3/4 内 absorb), 此处仅 last-mile cross-reference 检查
- **verification required** (per Q2): same as Pre-A1 + Pre-A5 specific shell asserts (Stage C.1-C.4 PR list 数量 / risk matrix 完整性 / handoff pack 模板已 in plan)

### Stage C.1 — Cleanup (Wave 4 Stage C residue + heavy block plugin tier)

**Goal**: sample-blocks 页面 heavy block 显示干净 "🔌 plugin" placeholder. Wave 4 Stage C residue 收尾。

**Stage C.1 close criterion**: heavy block 3 surfaces (Jupyter/NnViz/AgentFlow) 显示 plugin placeholder; sample-blocks 页 PDF iframe 不黑屏; chunk-leak measured (or moot post-plugin); test-results gitignore landed; ADR-0014 v0.4 amendment ratified (plugin placeholder vs plugin-real-runtime split). **Sub-stage close = user MVP-judgment escape valve + handoff pack mandatory**.

**Scope-fence whitelist** (per Q1 absorbtion — write-allowed domains):
- `apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx` (plugin placeholder render)
- `apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro` (Astro wrapper unchanged)
- `apps/site/src/components.ts` (componentsMap entries)
- `docs/decisions/ADR-0014-heavy-block-boundary.md` (v0.4 Amendments §)
- `apps/site/.gitignore` (test-results housekeeping)
- `packages/block-pdf/src/ui-default/Pdf.tsx` (PDF iframe 黑屏 fix; if root cause is here)
- 1 PR.md per Stage C.1 scope item

**Scope-fence blacklist** (write-forbidden in Stage C.1):
- `packages/heavy-block-boundary/**/*` (Wave 4 lock; v0.5 amendment 在 Stage C.2)
- editor-shell / mdx-bridge / block-foundation (Wave 5 Stage C.2 scope)
- design-tokens / OKLCH (Wave 5 Stage C.3 scope)

**Scope items** (per-PR breakdown TBD until Pre-A5 v1.0 lock):

1. **Heavy block "🔌 plugin" placeholder** UI component (replaces Wave 4 B7 hydration of real components; ADR-0014 v0.4 amendment can co-ship if scope tight)
2. **C-3 PDF iframe 黑屏 调查 + fix** (Wave 4 Stage C 残留)
3. **C-4 chunk-leak measure** (data-driven; if plugin placeholder 不 load 真组件，可能 moot)
4. **`apps/site/test-results/` gitignore housekeeping** (per ADR-0015 D3)

**Estimated PRs**: 2-3 (final count post Pre-A5 plan-challenger).

**verification required**:
- vitest unit on plugin placeholder rendering (`@skb/heavy-block-boundary` or apps/site island layer; covers AC for plugin placeholder visual identity)
- visual-smoke playwright on `/sample-blocks` page (verify 3 heavy block surfaces render plugin placeholder + PDF iframe not黑屏)
- shell `git ls-files apps/site/test-results | wc -l == 0` post-gitignore

### Stage C.2 — Grid + drag/drop (per ADR-0016 + ADR-0017)

**Goal**: user 能在 editor-shell 内 12-col grid 排版块 + 4 边缘对称 drag-drop. 静态底层 + outline overlay 方案 A 兑现.

**Stage C.2 close criterion**: editor-shell 在 12-col grid 上摆块; palette drag → grid + edge-rect hit-test + outline preview + drop落定; resize via right/bottom handles + col-ruler + size-tooltip; 全部 vitest + playwright covering AC list. **Sub-stage close = user MVP-judgment escape valve + handoff pack mandatory**.

**Scope-fence whitelist**:
- `packages/mdx-bridge/**/*` (col/row/colSpan/rowSpan serialize)
- `packages/block-foundation/**/*` (BlockUIDefinition grid 字段; W5-1 invariant)
- `packages/editor-shell/**/*` (Tiptap NodeView 嵌 grid context; useAutoRowSpan)
- `packages/heavy-block-boundary/**/*` (v0.5 amendment grid context dimensions 联动)
- apps/site Astro renderer grid layout
- ADR-0014 v0.5 amendment (Amendments §)
- 1 PR.md per Stage C.2 scope item

**Scope-fence blacklist**:
- design-tokens OKLCH switchover (Stage C.3 scope; do NOT 同 PR 改视觉 + grid)
- save/load wire (Stage C.4 scope)
- Modal canvas (Phase 2+; 不动)

**Scope items** (per-PR breakdown TBD):

1. **mdx-bridge col/row/colSpan/rowSpan serialize**
2. **block-foundation BlockUIDefinition grid 字段** (W5-1 invariant)
3. **Astro renderer grid layout** support
4. **editor-shell grid 集成**
5. **drag/drop UX 实施** (per ADR-0017)
6. **resize UX 实施**
7. **ADR-0014 v0.5 amendment** (HeavyBlockBoundary 在 grid context)
8. **Responsive 12/6/1** 切换 + rowSpan adapt
9. **vitest + playwright 覆盖**

**Estimated PRs**: 10-12.

**verification required**:
- vitest mdx-bridge round-trip per block kind (col/row/colSpan/rowSpan serialize 字节等价)
- vitest useAutoRowSpan hook (ResizeObserver mock; rowSpan 跳变边界)
- playwright drag scenarios (4 edge modes + tiebreak in 重叠 gap 区域 + 源块 lift visual)
- playwright resize scenarios (col-ruler highlight + size-tooltip fraction display + COL_SNAPS snap)
- playwright responsive switch (12 → 6 → 1 + rowSpan adapt)
- visual-smoke per-block visual identity (drag overlay outline 准确性)

### Stage C.3 — v2 视觉 identity (per ADR-0018)

**Goal**: design-tokens OKLCH 切 + Inter/JetBrains Mono + block kind 顶 2px 横条 + prose customization. 8 light block CSS calibration as collateral.

**Stage C.3 close criterion**: apps/site 整套界面与 v2 demo 视觉对齐; 8 light blocks (Callout / Code / Image / Math / Pdf + 3 markdown headings / lists / inline) CSS 校准 OKLCH; Inter Google Fonts 预连接; aref inline anchor + b-quote/b-callout/b-code prose customization 兑现; visual smoke playwright on apps/site landing + sample-blocks page. **Sub-stage close = user MVP-judgment escape valve + handoff pack mandatory**.

**Scope-fence whitelist**:
- `packages/design-tokens/**/*` (OKLCH switchover)
- 8 light block packages: `packages/block-{callout,code,image,math,pdf}/src/ui-default/**/*` (CSS 校准)
- apps/site fonts preconnect + global CSS
- prose customization (b-quote / b-callout / b-code) — likely apps/site or design-tokens
- 1 PR.md per Stage C.3 scope item

**Scope-fence blacklist**:
- mdx-bridge / editor-shell / heavy-block-boundary (NOT 视觉 scope; do NOT 同 PR 改 logic + 视觉)
- save/load wire (Stage C.4 scope)
- grid logic (Stage C.2 lock; visual collateral may触视觉 token but NOT grid 计算)

**Scope items** (per-PR breakdown TBD):

1. **design-tokens OKLCH 切**
2. **Inter + JetBrains Mono Google Fonts 预连接**
3. **block kind 顶 2px 彩色横条**
4. **prose customization** (b-quote / b-callout / b-code / aref)
5. **typography 升级**
6. **8 light block CSS 校准** (ux-ui-lead subagent)
7. **shadow 暖色调** refresh
8. **dark mode** (Phase 2+ deferred per Pre-A4 plan-challenger; or Wave 5 if scope allows)

**Estimated PRs**: 3-5.

**verification required**:
- visual-smoke playwright on apps/site landing + sample-blocks page (baseline screenshot 比对; OKLCH switchover 不应 surface visual regress on 8 light blocks)
- shell ADR-0018 D-list § "8 light block calibration" 列表完整性
- vitest design-tokens unit (OKLCH oklch() string parsing + fallback hex resolution if 浏览器不支持)

### Stage C.4 — Editor-shell wire to apps/site (CRITICAL for Phase 1 完成)

**Goal**: user 真能在 apps/site 编辑笔记 + 保存. apps/site 加 `/notes/[slug]/edit` 路由. **Save-path 接口在 Pre-A4 ADR-0018 已冻结** (per Q4+Q8 absorbtion).

**Stage C.4 close criterion**: user navigate 到 `/notes/<slug>/edit` → 看到 editor-shell mounted with notes content; 编辑后 save 路径 work; reload 后内容保留; round-trip 一致 (mdx file ↔ Tiptap state ↔ persisted state). **Sub-stage close = user MVP-judgment escape valve + handoff pack mandatory; = Wave 5 close 候选 (Phase 1 完成 = MVP-ready)**.

**Scope-fence whitelist**:
- `apps/site/src/pages/notes/[slug]/edit.astro` (route)
- `apps/site/src/components/EditorShellMount.{astro,tsx}` (mount wrapper)
- `packages/editor-shell/**/*` (BlockRegistry + KernelRegistry + mdx-bridge wire-up)
- `packages/mdx-bridge/**/*` (save-path implementation per Pre-A4 接口冻结)
- apps/api endpoints (if save 路径 选 apps/api; per Pre-A4 lock)
- 1 PR.md per Stage C.4 scope item

**Scope-fence blacklist**:
- design-tokens / OKLCH (Stage C.3 lock; do NOT 同 PR 改视觉 + wire)
- grid 数据模型 (Stage C.2 lock; consume only)
- heavy-block-boundary (Wave 5 不动 plugin placeholder; do NOT 实施真渲染)

**Scope items** (per-PR breakdown TBD):

1. **apps/site `/notes/[slug]/edit` route** mount editor-shell
2. **BlockRegistry + KernelRegistry + mdx-bridge wire-up**
3. **palette / slash-menu / drag-handle / toolbar 组装**
4. **save/load 双向 implementation** (per Pre-A4 接口冻结)
5. **vitest + playwright 端到端覆盖**

**Estimated PRs**: 3-5.

**verification required**:
- playwright 端到端: load existing note → edit → save → reload → verify content preserved + grid layout intact + drag历史不引入 corruption
- vitest editor-shell + mdx-bridge save-path round-trip (MDX file ↔ Tiptap state ↔ persisted)
- shell apps/site build success on `/notes/[slug]/edit` route

## D-list summary

| # | Item | Rationale |
|---|---|---|
| D1 | **Pre-A roadmap = 5 PRs** (Pre-A1 plan v0.1+v0.2 + Pre-A2 ADR-0016 + Pre-A3 ADR-0017 + Pre-A4 ADR-0018+save-path 接口冻结 + Pre-A5 plan v1.0 lock) | Per ADR-0015 D6 + 2026-05-04 gatekeeper directive + Q8 absorbtion (save-path 提前 Pre-A4) |
| D2 | **Stage C = 4 子阶段** (C.1 cleanup + C.2 grid+drag + C.3 v2 视觉 + C.4 editor-wire); per-PR breakdown TBD until ADRs lock + Pre-A5 v1.0 final | Per reframe v2 memory + 2026-05-04 gatekeeper directive |
| D3 | **Stage close = user MVP-judgment escape valve**; 3 outcomes (continue / "差不多了" close-prep / "调整 X" → R14 plan amendment PR) + handoff pack mandatory | Per Q9 + Q5 absorbtion |
| D4 | **R14 discipline + scope refinement 2 档触发器** (per Q6 absorbtion): `reframe` (改变成功标准 OR PR 总量变化>15% OR 新增高风险模块≥1 OR 影响跨-package边界 OR 新增/删除跨-package ADR 目标) → 必开 plan amendment PR via D1 pipeline + plan-challenger + lock; `scope refinement` (任务顺序 OR 命名 OR 测试补充 OR 单 package 内细节调整) → Pre-A5 v1.0 lock 时 absorb 即可 | Per Q6 absorbtion (阈值化) + ADR-0015 R14 |
| D5 | **ADR编号锁** (per Q7 absorbtion + 编号映射表): plan + Wave 5 PR.md 统一新编号 (0016/0017/0018); granularity body 旧编号仅附注; 各 PR.md `## adr_touched` 显式新编号 | Per granularity v0.3.4 final renumber + Q7 absorbtion |
| D6 | All Wave 5 codex dispatches use **`--yolo` + `set -o pipefail` + `/tmp` piping** + (head -2000 archive OR R21 grep-for-verdict for log > 500 KB) | Wave 4 Pre-A1 + R21 extension (Pre-A1 plan-challenger 562 KB log triggered R21) |
| D7 | **Plan-challenger codex round MANDATORY** before each Pre-A lock (Pre-A1+2+3+4); 4-round 在 Pre-A2+3+4 (ADR design lock) per Wave 4 Pre-A2 ADR-0014 12/12 absorbed precedent | Per ADR-0007 D5 + R13 + 2026-05-04 gatekeeper directive |
| D8 | **Heavy block "🔌 plugin" placeholder** = Wave 5 default; real Pyodide / TF.js / React Flow runtime 留 Phase 2+ | Per reframe v2 memory + 2026-05-03 gatekeeper directive |
| D9 | **Wave 5 close conditions** (per Q9): (a) C.1-C.4 全部 + user MVP-ready, OR (b) user mid-Wave explicit "Wave 5 close 准备", OR (c) ctx > 600K (preventive), OR (d) MVP fallback timing > 7 工作日 静默 | Per Q5 + Q9 absorbtion + ADR-0011 D8 |
| D10 | **Stage C.4 save 路径决策提前到 Pre-A4** (per Q8 absorbtion): Pre-A4 ADR-0018 必产出 save 方案草案 + 回退路径 + 接口冻结. Pre-A5 仅做确认与验收. 减少晚期改动与重构成本 | Per Q8 absorbtion (revised from 推到 Pre-A5) |
| D11 | **`apps/site/test-results/` gitignore housekeeping** + Stage C-3 PDF iframe + C-4 chunk-leak deferred to Stage C.1 | Per ADR-0015 D3 Stage C residue |
| **D12** | **Stage scope-fence whitelist + blacklist** (per Q1 absorbtion): 每 Stage C.X 显式 list 写入文件域名 + 禁止触达域名; 跨域改动必 拆分单独 PR (heavy-block / editor / grid / save 不混 PR) | Per Q1 absorbtion |
| **D13** | **Late-surface D2 trigger escalation** (per Q4 absorbtion): Pre-A4 内若 surface "持久化路径变更" OR "接口契约调整" 即立即触发 D2 row 4 (ADR scope 扩大) + row 1 (CONTRACT 同步); Pre-A5 NOT 兜底; v1.0 不应 surface 重大 ADR amendment | Per Q4 absorbtion |
| **D14** | **MVP fallback timing** (per Q5 absorbtion): user 静默 5 工作日 → R14 pre-scan + 缺失项清单 PR; 7 工作日 → close-prep; orchestrator + reviewer joint owner | Per Q5 absorbtion |
| **D15** | **Handoff pack per Stage close** (per Q9 absorbtion): `docs/plans/wave-5-main/<Stage>-handoff-pack.md` ≤ 200 LOC; 决策摘要 + 未决风险 + 测试状态 + 开放依赖; 下一 session 第一动作 = 复读确认 | Per Q9 absorbtion |

## Risk predictions (initial; refined at Pre-A5)

1. **ADR-0016 grid model 数据持久化的不对称** (markdown rowSpan='auto' 不入持久化 vs 其他 block 持久化) 复杂性. Mitigation: ADR-0016 必须明示这个不对称; mdx-bridge serialize/deserialize 两侧测试覆盖; ResizeObserver race 边界 vitest fixture (Pre-A2 plan-challenger Q2 候选).
2. **ADR-0017 drag/drop UX hit-test 性能** (snapshot ref + edge rects O(n) per-event with n≤30 < 0.05ms/frame). Mitigation: 性能 budget assertion in playwright; 选项 2/3 留 Phase 2+ 性能优化路径.
3. **ADR-0018 OKLCH 转换 collateral** (8 light blocks 视觉 calibration scope) — Stage C.3 ux-ui-lead subagent dispatch 时间预估. Mitigation: ADR-0018 D-list 包含 8 light block calibration 列表; visual smoke playwright 发现 regress.
4. **C.4 editor-shell wire 复杂度** (BlockRegistry/KernelRegistry 集成 + save/load 双向 + grid context). Mitigation: save 路径 接口在 Pre-A4 冻结 (D10); localStorage prototype 作为 fall-back (apps/api endpoint 复杂度过高时切换).
5. **Mid-Wave reframe drift** (Wave 4 R14 lesson) — mitigated via D4 R14 阈值化 (per Q6) + per-stage user check-in + Pre-A1 R14 self-check.
6. **ctx > 600K boundary** — Wave 5 estimated 23-29 PRs / 3-5 sessions; 单 session 600K 估算无法完成. Mitigation: 每 stage close 自然 session boundary; **handoff pack mandatory** (D15); close-ceremony fresh session per Wave 4 model.
7. **8 light block CSS 校准 scope creep** — ux-ui-lead subagent 实施 OKLCH 切换 collateral 时可能发现更多 visual drift. Mitigation: ADR-0018 D-list 锁定 8 block 范围 + visual baseline screenshot 比对; 超出范围 ↦ Phase 2+ 单独 PR.

## Risk matrix by stage (per Q3 absorbtion — 复现条件 + 预期行为 + 回退策略)

| Stage | 异常 / 边界场景 | 复现条件 | 预期行为 | 回退策略 |
|---|---|---|---|---|
| C.1 | 插件 placeholder 渲染 fail | 缺 token / Astro hydration 失败 | placeholder 显示 fallback "插件加载失败" 文本 + retry button | revert componentsMap 改回 Wave 4 B7 hydration |
| C.1 | PDF iframe 黑屏 root cause 不在 block-pdf | iframe srcdoc 为 empty / Pdf.tsx render 路径 issue | playwright assertion fail 后 stage 4 pre-commit fires | open ADR-0014 v0.5 amendment 或 Stage C.1 separate PR |
| C.1 | C-4 chunk-leak 仍存在但 plugin placeholder 后无影响 | perf-auditor 检测 chunk 体积; 实际运行无 leak 影响 | document NO-OP 决策 + lock as moot | 留 Phase 2+ 切换真渲染时 revisit |
| C.2 | ResizeObserver race causing rowSpan 跳变 | markdown 内容 paste 大段 → ResizeObserver scrollHeight 反算 → grid 重排 | useAutoRowSpan hook debounce + animation transition (per ADR-0016 D-list) | revert 单 PR; useAutoRowSpan rate-limit 到 16ms |
| C.2 | Edge-rect tiebreak 边界 cursor 命中错误 | blocks 紧贴 (gap=14px); 4 edge rects 重叠 | tiebreak 距离公式 well-defined; cursor 偏左 → split-right on 左块 | revert ADR-0017 D-list + Stage 4 fires for tiebreak rule amendment |
| C.2 | Drag/drop 性能退化 (frame > 16ms) | n=30+ blocks; per-event O(n) edge rects | playwright budget assertion fail | 切换 ADR-0017 选项 2 (grid 单元索引 O(1)) Phase 2+ amendment |
| C.3 | OKLCH 在老 Safari (<15.4) fallback 失效 | Safari 14 加载 apps/site | design-tokens 必含 hex fallback (ADR-0018 D-list 强制 candidate) | revert OKLCH 切换至双 token (OKLCH + hex parallel) |
| C.3 | 8 light block visual regress (OKLCH switchover collateral) | screenshot 比对超阈值 | ux-ui-lead 单 PR 修复; visual-smoke playwright re-run | revert 单 PR + ADR-0018 D-list 增强 calibration scope |
| C.4 | save-path apps/api endpoint 不可用 (network) | apps/api server down | localStorage prototype fallback (per Pre-A4 接口冻结 + 回退路径) | switch to localStorage; document network 兜底 |
| C.4 | save round-trip 数据丢失 | MDX file ↔ Tiptap state mismatch | mdx-bridge round-trip vitest fail blocks PR; playwright 端到端 fail | revert PR + open ADR-0016 amendment if 数据模型 issue |
| All | mid-wave reframe trigger (R14 thresholds D4 hit) | gatekeeper directive 改成功标准 / PR 总量 +>15% / 跨-package ADR 影响 | orchestrator 必须 stop implementation, 开 plan amendment PR via D1 pipeline | rollback to last locked plan 状态; handoff pack 强制生成 |
| All | ctx > 600K boundary | session 实际 token usage 触阈值 | preventive close (D9); fresh session start with handoff pack | next session 复读 handoff pack 确认 |
| All | MVP fallback timing trigger (D14) | user 静默 > 5 / 7 工作日 | 5 日 → R14 pre-scan + 缺失项清单 PR; 7 日 → close-prep | orchestrator + reviewer joint owner; user override 始终优先 |

## Wave 5 close ceremony (post Stage C.4 close OR escape valve OR fallback timing — OUT OF SCOPE for this plan-draft)

Pattern follows ADR-0010 (Wave 2 close) + ADR-0013 (Wave 3 close) + ADR-0015 (Wave 4 close):

- New ADR-0019 (Wave 5 close) ratifying full PR roster + retrospective items + Pre-A2/3/4 ADR amendment confirmation
- Structure-baseline audit refreshed (`docs/audits/structure-2026-XX-wave-5-close.md`)
- `docs/plans/active.md` repointed to Wave 6 (or Phase 1 pause if MVP ship)
- MEMORY.md retrospective entries codified per discovered learnings
- Fresh session per ADR-0011 D8 single-long-session invariant

**Explicit out-of-scope**: ADR-0019 authoring is NOT in Pre-A1-A5 lock scope; NOT in Stage C.1-C.4 implementation scope. Begins AFTER Stage C close fires (per D9).

Wave 5 close = MVP-ready judgment may = Phase 1 完成 (C.4 wire 是 Phase 1 闭环); user 可决定 ship 或继续 Phase 2 plan-draft fresh session.

## Acceptance criteria for plan-draft v0.2 lock

This plan locks at v0.2 when:

1. Plan-challenger codex round dispatched + absorbtion table populated (every challenge ABSORBED or NOT-ABSORBED with rationale) per ADR-0007 D5 + R13. **10/10 absorbed at v0.2 (table below)**.
2. Pre-A roadmap (5 PRs) outlined with executor + D2 trigger judgment + `verification required` per PR
3. Stage C.1-C.4 high-level scope outlined with **scope-fence whitelist + blacklist** (D12) + close criterion + handoff pack reference + `verification required`; per-PR breakdown explicitly TBD until Pre-A5 v1.0 lock
4. `## MVP Framework Notes` section first segment per gatekeeper directive; **fallback timing (D14)** + **handoff pack reference (D15)** embedded
5. R14 discipline 阈值化 (D4) + scope refinement boundary 清晰 (per Q6)
6. ADR 编号映射表 (D5) at top; granularity 旧编号 vs Wave 5 新编号 unambiguous
7. Wave 5 close conditions (D9) + sub-stage escape valve (D3) + D14 fallback timing 明确 framing
8. **ADR-0011 D2 late-surface escalation (D13)** for Pre-A4/A5 codified
9. **Risk matrix by stage** (Q3) populated with 复现条件 + 预期行为 + 回退策略
10. orchestrator-self review confirms 2026-05-04 gatekeeper directive items honored

## Plan-challenger codex absorbtion (locked at v0.2 lock-time)

per [ADR-0007 D5](../../decisions/ADR-0007-job-function-codex-heavy-execution.md) + [ADR-0011 D2](../../decisions/ADR-0011-linear-pipeline-execution-model.md) v0.1.1 SOTed-PR.md amendment + memory `feedback_soted_pr_md_discipline.md` + ADR-0013 D4 R13 + Wave 4 Pre-A2 12/12 absorbed precedent.

dispatch: `codex exec --yolo --profile plan-challenger ...` (Wave 5 plan-draft v0.1); audit log path: `/tmp/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt` raw (562 KB / 3426 lines; R21 trigger) + `docs/audits/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt` curated archive (113 lines: head -50 prompt + grep verdict-shaped lines).

| # | Challenge | Severity | Verdict | Reason / Locked at |
|---|---|---|---|---|
| Q1 | Pre-A/Stage 拆分功能边界过宽; 易形成既大又含糊的 PR (heavy-block + editor + grid + save 同 PR) | high | **ABSORBED** | Each Stage C.X 显式 `scope-fence whitelist + blacklist` (D12). 跨域改动必拆单独 PR. Locked at Stage C.1-C.4 sections + D12. |
| Q2 | acceptance/close criterion 偏口头化; 缺命令级可重复执行验收 | high | **ABSORBED** | 每 Pre-A + Stage C.X 加 `verification required` 字段 → vitest/playwright/visual-smoke + 通过条件. Locked at每 Pre-A + Stage C section. |
| Q3 | 异常 / 边界场景覆盖不完整 (ResizeObserver race / OKLCH fallback / save fallback / ctx boundary / R14 trigger 一致性) | high | **ABSORBED** | NEW `## Risk matrix by stage` section: 13 行 (4 stage + cross-cutting); 每行 复现条件 + 预期行为 + 回退策略. Locked at Risk matrix section. |
| Q4 | D2 触发判定对 Pre-A5 偏保守; C.4 持久化协议变化在 Pre-A5 末尾才发现风险高 | medium | **ABSORBED** | NEW D13 "Late-surface D2 trigger escalation": Pre-A4 内 surface 持久化变更/接口契约即立即触发 D2 row 4/1; Pre-A5 NOT 兜底. Locked at Pre-A4 section + D13. |
| Q5 | MVP decision point 缺失败兜底机制 (user 长时间不响应) | high | **ABSORBED** | NEW D14 "MVP fallback timing": 5 日 → R14 pre-scan + 缺失项清单 PR; 7 日 → close-prep; orchestrator + reviewer joint owner. Locked at MVP Framework Notes + D14 + D9 (条件 d). |
| Q6 | R14 vs scope refinement 边界偏语义化, 缺可执行阈值 | medium | **ABSORBED** | D4 expanded with 2 档触发器 + 阈值 (PR 总量 >15% / 新增高风险模块 ≥1 / 跨-package边界 / 改成功标准). Locked at D4. |
| Q7 | ADR编号锁认知冲突 (plan 同时出现 0016/0017/0018 与 旧 0012/0013) | high | **ABSORBED** | NEW `## ADR 编号映射表` section near top; 统一引用规则 (正文新编号; 旧编号仅附注); 各 PR.md `## adr_touched` 显式新编号. Locked at ADR 编号映射表 section + D5. |
| Q8 | Stage C.4 save-path 决策时机不一致; Pre-A4 仅讨论 / Pre-A5 才锁过晚 | medium | **ABSORBED** | D10 修订: Pre-A4 ADR-0018 必产出 save 方案草案 + 回退路径 + 接口冻结. Pre-A5 仅确认验收. Locked at Pre-A4 scope + D10. |
| Q9 | ctx > 600K 边界与 session 切换策略未闭环 | medium | **ABSORBED** | NEW D15 "Handoff pack per Stage close": `<Stage>-handoff-pack.md` ≤ 200 LOC; 4 字段; 下一 session 第一动作 = 复读确认. Locked at MVP Framework Notes + D15 + D9 (条件 c+d). |
| Q10 | Wave 4 R14 lesson 在 Pre-A1 仍像原则声明而非可执行流程 | medium | **ABSORBED** | Pre-A1 PR.md 加 `## R14 self-check` section: R14 触发判定表 (this PR) + diff 风险项 + 未触发 D2 逐条理由. Locked at Pre-A1 PR.md (separate file). |

**Result**: 10/10 challenges absorbed (5 high + 5 medium; codex verdict 标 1 low advisory but actual breakdown 5 high + 5 medium per re-count). Plan v0.1 (initial draft) → **v0.2 (post-absorbtion lock)**. No challenge rejected; orchestrator did not push back on plan-challenger verdicts.

**Lock evidence**: this absorbtion table + each verdict cross-references the D-section / Pre-A PR / Stage C section / acceptance criterion that codifies the change. Reviewers verify by walking each row's "Reason / Locked at" link to the corresponding section.

**Stage final counts (locked at v0.2)**: Pre-A = 5 (Pre-A1 [this lock] + Pre-A2/3/4 ADRs + Pre-A5 v1.0 final). Stage C.1 = 2-3 PRs. Stage C.2 = 10-12 PRs. Stage C.3 = 3-5 PRs. Stage C.4 = 3-5 PRs. **Total Wave 5 estimate**: 23-30 PRs / 3-5 sessions.

## v1.0 Pre-A5 final lock amendments (2026-05-04 post Pre-A2/3/4 ADR locks)

Pre-A2 (HEAD `6e2c1d9` ADR-0016 grid 数据模型) + Pre-A3 (HEAD `157a4f7` ADR-0017 drag/drop UX) + Pre-A4 (HEAD `7e487ec` ADR-0018 v2 视觉 migration + save-path 接口冻结) all merged with status proposed v0.1.1 post 12+13+14 = 39 plan-challenger challenges absorbed. Stage C.1-C.4 per-PR breakdown now lockable.

### Cross-referenced absorbtion tables (Pre-A1 + Pre-A2 + Pre-A3 + Pre-A4)

| Pre-A | Audit log archive | Challenges raised | Absorbed | Partial | Key impact on Stage C |
|---|---|---|---|---|---|
| Pre-A1 (this plan v0.1 → v0.2) | `2026-05-04-Pre-A1-plan-challenge.txt` (113 lines curated) | 10 (5 high + 5 medium) | 10 | 0 | NEW D12 scope-fence + D13 D2 escalation + D14 MVP fallback timing + D15 handoff pack |
| Pre-A2 ADR-0016 grid | `2026-05-04-Pre-A2-plan-challenge.txt` (113 lines) | 12 (4 high + 7 medium + 1 low) | 11 | 1 | W5-1 invariant + D12 layoutEpoch + 权威矩阵 + Sister-document sync (4 sister CONTRACTs) + 转场态 FSM + SSR fallback |
| Pre-A3 ADR-0017 drag/drop | `2026-05-04-Pre-A3-plan-challenge.txt` (118 lines) | 13 (3 high + 8 medium + 2 low) | 11 | 2 | EDGE_W=28 + tiebreak abs+velocity+spatial + outline z-index + reflow invalidation + mobile view-only + drop-pulse `--accent-success` token |
| Pre-A4 ADR-0018 visual + save-path | `2026-05-04-Pre-A4-plan-challenge.txt` (111 lines) | 14 (3 high + 7 medium + 4 low) | 9 | 5 | OKLCH Culori fallback + 8 kind hue (3+5) + Inter privacy/self-host + .skb-prose namespace + typography CSS vars + NoteSaveAdapter @ editor-shell + LocalStorageAdapter quota+security 错误处理 |

**Total**: 49 challenges across 4 plan-challenger rounds; 41 ABSORBED + 8 PARTIALLY ABSORBED. ratio 84% full absorbtion + 16% partial. Wave 4 Pre-A2 ADR-0014 12/12 + Pre-A3 plan-draft 15/15 比较 → Wave 5 absorbtion ratio 略低 (合理: Wave 5 4 个独立 plan-challenger 累积, 比 Wave 4 单 plan-draft 高度 narrow).

## v1.1 R14 amendment (2026-05-05)

**Trigger**: defer-defer chain detected at C.2-1 (squash `e54497d`) → C.2-3 (squash `2586328`) for the `@skb/mdx-bridge` `parse.ts` hard-throw flip (replacing transitional `_gridAttrsExplicit` defensive default `col=1, colSpan=12` + `console.warn` with literal throw on missing grid attrs per [ADR-0016](../../decisions/ADR-0016-grid-data-model.md) D7 end-state invariant) + `content/notes/**/*.mdx` sample MDX backfill + 17 RTT fixtures grid-aware update in `packages/mdx-bridge/src/__tests__/fixtures/`. Per [ADR-0015](../../decisions/ADR-0015-wave-4-close.md) R14 + memory `feedback_r14_defer_chain_plan_amendment.md`: 2+ defers across consecutive PRs = STOP forward execution + open formal plan amendment PR running 5-stage D1 pipeline + plan-challenger light round (3-5 challenges, NOT full 12-Q). NOT handoff-pack-only; NOT fold into next PR (= R14 second violation).

**3 prose edits + 1 cross-doc edit** (per Wave 5 plan v1.1 amendment PR — `docs/plans/wave-5-main/v1.1-plan-amendment-r14.md`):

1. **Sub-edit a**: frontmatter `状态` field bumped v1.0 → v1.1.
2. **Sub-edit b**: §471 row C.2-3 Subject column appended `[OUT OF SCOPE — hard-throw flip + sample-MDX backfill + 17 RTT fixtures grid-aware update deferred to NEW C.2-3.5 per v1.1 amendment]` marker.
3. **Sub-edit c**: NEW Stage C.2 row C.2-3.5 inserted between C.2-3 and C.2-4 at fractional index 3.5. Subject = "mdx-bridge hard-throw flip + sample MDX backfill + RTT fixtures grid-aware update". Whitelist scoped to `packages/mdx-bridge/src/{parse,serialize}.ts` + `packages/mdx-bridge/CONTRACT.md` + 17 RTT fixtures + 4 `content/notes/**/*.mdx` files (primary target = `sample-blocks/index.mdx`). LOC budget ~250-350. Executor = `codex-generic-executor`. D2 trigger Row 1 + Row 5.
4. **Sub-edit d** (this section): v1.1 amendment record + R24-shaped retrospective candidate.
5. **Sub-edit e**: Wave 5 PR roster table (§517+) extended with v1.1 amendment row; final PR count bumped 30 → 31.
6. **Cross-doc edit (ADR-0016 §502)**: sister-doc-sync table mdx-bridge row scope-column extended to reference C.2-3.5 as transition end-state lock site (alongside existing C.2-1 transitional-defensive-defaults primary serialize PR).

**Pipeline**: 5-stage D1 (PLAN pr-writer → EXECUTE orchestrator-self per Wave 5 plan v1.0 D6 "pure-doc PR" exception → plan-challenger light round 3-5 challenges → REVIEW codex-pr-reviewer-55 → PRE-COMMIT CLAUDE REVIEW orchestrator-self per D2 row 1+5 fires → COMMIT reviewer codex with ADR-0006 D8 explicit-file-list staging → ACCEPT pr-writer 2nd invocation).

**Cumulative PR delta tracker**: v1.0 → v1.1 = +1 PR; cumulative delta 1/30 = 3.3%, well below D4 R14 threshold ("PR 总量变化 > 15%"). Future v1.2 / v1.3 amendments must re-check cumulative delta against this baseline.

**Plan-challenger absorbtion (v1.1 light round)**: 5/5 challenges raised + absorbed at Stage 3 (codex `plan-challenger` profile dispatch 2026-05-05; raw audit at `/tmp/codex-runs/2026-05-05-v1.1-plan-challenge.txt` 1732 lines / 136 KB; curated archive at `docs/audits/codex-runs/2026-05-05-v1.1-plan-challenge.txt` 100 lines). 5/5 ABSORBED (3 ABSORB-RECOMMENDED Q1+Q2+Q5 + 2 ABSORB-OPTIONAL clarification Q3+Q4). Q1 = file 二分类 `backfill-required` vs `audit-only-verified` (sub-edit c whitelist update); Q2 = LOCK fractional index 3.5 + downstream-must-reference 硬约束; Q3 = §502 sister-doc 同步 deferred-not-open per scope-fence (本 PR 限定 mdx-bridge 行); Q4 = NEW D2 ROW 4 门槛规则 codified; Q5 = AC#13 + AC#14 mechanical R14 self-test hard-fail gates added. Full 5-row absorbtion table lives in PR.md `## Plan-challenger absorbtion` section (`docs/plans/wave-5-main/v1.1-plan-amendment-r14.md`); reviewer codex Stage 4 verifies absorbtion accuracy.

**Wave 5 close ADR-0019 R24-shaped retrospective candidate**:

> R14 first real-test enforcement — defer-defer chain (hard-throw flip + sample MDX backfill + 17 RTT fixtures: C.2-1 → C.2-3 → v1.1 amendment) → plan amendment PR (v1.1) 5-stage D1 pipeline 形式化处理而非 handoff pack 跟踪. 证明 R14 discipline operative.

### Stage C.1 — Cleanup PR breakdown (locked at v1.0)

| PR | Subject | Files (whitelist per scope-fence D12) | Estimated LOC | Executor | D2 trigger |
|---|---|---|---|---|---|
| C.1-1 | Heavy block plugin placeholder + ADR-0014 v0.4 amendment | `apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx` (rewrite to plugin placeholder) + `apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro` (unchanged) + `apps/site/src/components.ts` (componentsMap) + `docs/decisions/ADR-0014-heavy-block-boundary.md` (v0.4 Amendments §) + 1 PR.md | ~300 LOC | codex-generic-executor | Row 4 (ADR amendment) + Row 1 (apps/site/CONTRACT.md may sync) |
| C.1-2 | C-3 PDF iframe 黑屏 调查 + fix + C-4 chunk-leak measure | `packages/block-pdf/src/ui-default/Pdf.tsx` (if root cause here) OR `apps/site/src/islands/PdfIsland.tsx` (alt root cause) + `docs/audits/perf-2026-05-wave-5-c4-chunk-leak.md` (NEW perf measurement; NO-OP decision per ADR-0015 D3 if plugin placeholder makes it moot) + 1 PR.md | ~150 LOC | codex-generic-executor | Standard PR |
| C.1-3 | `apps/site/test-results/` gitignore housekeeping (per ADR-0015 D3) | `apps/site/.gitignore` (+1 line: `test-results/`) + 1 PR.md | ~5 LOC | orchestrator-self | Standard PR |

**Stage C.1 close criterion** (per Wave 5 plan v0.2 Stage C.1 section + handoff pack D15): heavy block 3 surfaces 显示 plugin placeholder; C-3 PDF iframe 不黑屏; C-4 chunk-leak measured (or moot); test-results gitignore landed. Sub-stage close = user MVP-judgment escape valve + handoff pack mandatory.

### Stage C.2 — Grid + drag/drop PR breakdown (locked at v1.0; per ADR-0016 + ADR-0017 D-list)

| PR | Subject | Whitelist | LOC | Executor | D2 |
|---|---|---|---|---|---|
| C.2-1 | mdx-bridge col/row/colSpan/rowSpan serialize | `packages/mdx-bridge/src/**/*` + `packages/mdx-bridge/CONTRACT.md` (+ W5-1 forward-pointer + serialize boundary) + RTT fixtures | ~300 LOC | codex-generic-executor | Row 1 (CONTRACT) + Row 5 (cross mdx-bridge + block-foundation + apps/site) |
| C.2-2 | block-foundation BlockUIDefinition grid 字段 (gridDefault + rowSpanSemantic + gridKind + proseGridDefaults + grid-math.ts helpers) | `packages/block-foundation/src/types.ts` + `packages/block-foundation/src/grid-math.ts` (NEW) + `packages/block-foundation/CONTRACT.md` (W5-1 invariant 已 Pre-A2 加; 此 PR 加 helpers public surface) + tests | ~250 LOC | codex-generic-executor | Row 1 (CONTRACT) + Row 5 |
| C.2-3 | Astro renderer grid layout + Responsive 12/6/1 **[OUT OF SCOPE — hard-throw flip + sample-MDX backfill + 17 RTT fixtures grid-aware update deferred to NEW C.2-3.5 per v1.1 amendment]** | `apps/site/src/styles/grid.css` (NEW; `.skb-grid` container + `@media` breakpoints) + `apps/site/src/layouts/BaseLayout.astro` + `apps/site/CONTRACT.md` | ~200 LOC | codex-generic-executor | Row 1 + Row 5 |
| **C.2-3.5** (v1.1 amendment NEW; LOCKED at fractional index 3.5 post Q2 plan-challenger absorbtion) | **mdx-bridge hard-throw flip + sample MDX backfill + RTT fixtures grid-aware update** | `packages/mdx-bridge/src/parse.ts` (remove `_gridAttrsExplicit` defensive branch + add hard-throw on missing grid attrs per ADR-0016 D7) + `packages/mdx-bridge/src/serialize.ts` (remove `_gridAttrsExplicit` marker tracking) + `packages/mdx-bridge/CONTRACT.md` (transitional-prose removal + end-state lock per ADR-0016 D7) + `packages/mdx-bridge/src/__tests__/fixtures/22-callout.mdx` .. `29-agent-flow.mdx` (8 component-block fixtures: `backfill-required`) + `01-paragraph.mdx` .. `09-link-title-comparator.mdx` (9 prose fixtures: `audit-only-verified`; `proseGridDefaults` derive-not-emit invariant refresh) + `content/notes/sample-blocks/index.mdx` (`backfill-required`; primary 8-block target; 5689 B at HEAD `2586328`) + `content/notes/sample-mdx-note/index.mdx` (`audit-only-verified`; PR.acceptance MUST emit "zero component blocks" evidence) + `content/notes/__test_cjk__/laptop/index.mdx` (`audit-only-verified`; same evidence req) + `content/notes/__test_cjk__/zh-note/index.mdx` (`audit-only-verified`; same evidence req) + 1 PR.md | ~250-350 LOC | codex-generic-executor | Row 1 (CONTRACT) + Row 5 (cross mdx-bridge + content/notes) |
| C.2-4 | editor-shell grid 集成 + useAutoRowSpan hook (per ADR-0016 D3 两阶段稳态) | `packages/editor-shell/src/grid-container.tsx` (NEW) + `packages/editor-shell/src/use-auto-row-span.ts` (NEW) + `packages/editor-shell/CONTRACT.md` (W5-2 invariant 加 + grid container API public surface) | ~400 LOC | codex-generic-executor | Row 1 (CONTRACT W5-2 NEW) + Row 5 |
| C.2-5 | drag/drop UX 实施 (per ADR-0017 D5 选项 1 + D3 tiebreak + D4 outline overlay) | `packages/editor-shell/src/drag-drop/{edge-rects,tiebreak,outline-overlay}.ts` (NEW) + tests | ~500 LOC | codex-generic-executor | Row 1 (CONTRACT) + Row 5 |
| C.2-6 | resize UX 实施 (col-ruler + size-tooltip + COL_SNAPS snap; per ADR-0017 D9) | `packages/editor-shell/src/resize/{col-ruler,size-tooltip}.tsx` (NEW) + tests | ~300 LOC | codex-generic-executor | Row 1 (CONTRACT) |
| C.2-7 | ADR-0014 v0.5 amendment (HeavyBlockBoundary dims grid context 联动 W5-1) | `docs/decisions/ADR-0014-heavy-block-boundary.md` (v0.5 Amendments §) + `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` (consume W5-1 公式) + `packages/heavy-block-boundary/CONTRACT.md` (sister-doc-sync per ADR-0016 D9 Sister-document sync) | ~150 LOC | orchestrator-self (doc-policy ADR amendment) + codex for impl | Row 4 (ADR amendment) + Row 1 (CONTRACT sync) |
| C.2-8 | drop-pulse 720ms + drag-ghost + 全局 Esc cancel + layoutEpoch reducer (per ADR-0017 D11+D10+D8+D12) | `packages/editor-shell/src/drag-drop/{drop-pulse,drag-ghost,esc-cancel,layout-reducer}.ts` (NEW) + tests | ~400 LOC | codex-generic-executor | Row 1 + Row 5 |
| C.2-9 | Responsive 12/6/1 切换 + rowSpan adapt path (per ADR-0016 D5 转场态 FSM) | `packages/editor-shell/src/grid-container.tsx` (转场态 FSM) + tests | ~150 LOC | codex-generic-executor | Standard |
| C.2-10 | playwright drag scenarios + edge-rect tiebreak fixtures (per ADR-0017 AC#1-#12) | `apps/site/playwright/grid-drag-drop.spec.ts` (NEW; 12 fixture per AC) | ~600 LOC | codex-generic-executor | Standard |
| C.2-11 | playwright resize + responsive switch + rowSpan adapt (per ADR-0017 AC#10) | `apps/site/playwright/grid-resize-responsive.spec.ts` (NEW) | ~400 LOC | codex-generic-executor | Standard |
| C.2-12 | Stage C.2 close: visual smoke baseline + perf budget assertion (per ADR-0017 AC#6 60fps) | `apps/site/playwright/grid-perf.spec.ts` (NEW) + visual baseline screenshots + Stage C.2 handoff pack | ~200 LOC | codex-generic-executor + orchestrator | Standard |

**Stage C.2 close criterion**: editor-shell 在 12-col grid 上摆块; 4 边缘对称 drag-drop work; resize via right/bottom handles; AC#1-#12 (ADR-0017) 全 vitest + playwright covered; visual smoke baseline. Sub-stage close = user MVP-judgment escape valve + handoff pack mandatory.

### Stage C.3 — v2 视觉 identity PR breakdown (locked at v1.0; per ADR-0018 D1-D7)

| PR | Subject | Whitelist | LOC | Executor | D2 |
|---|---|---|---|---|---|
| C.3-1 | design-tokens OKLCH 14 color + 1 hex `--surface` + 3 layout + Inter/JetBrains Mono fonts (per ADR-0018 D1+D2) | `packages/design-tokens/src/tokens.css` + `packages/design-tokens/CONTRACT.md` (token additions) + `tokens-fallback.css` (NEW; OKLCH→hex via Culori build script) + tests | ~300 LOC | codex-generic-executor + ux-ui-lead subagent | Row 1 (CONTRACT) + Row 5 (cross design-tokens + apps/site + 5 light blocks + heavy-block-boundary) |
| C.3-2 | block kind 顶 2px 彩色横条 8 kind hue (per ADR-0018 D3 locked values) | `packages/design-tokens/src/tokens.css` (8 kind hue token) + 5 light block ui-default 加 顶 2px 横条 CSS | ~200 LOC | codex-generic-executor + ux-ui-lead | Row 1 + Row 5 |
| C.3-3 | prose customization (b-quote/b-callout/b-code/aref + .skb-prose namespace per Q5) + typography CSS vars (font-size-* per Q6) | `apps/site/src/styles/prose.css` (NEW) + `apps/site/src/layouts/BaseLayout.astro` (load) + design-tokens font-size-* tokens | ~250 LOC | codex-generic-executor + ux-ui-lead | Row 1 |
| C.3-4 | shadow rgba(20,15,10) refresh + 8 light block CSS calibration (visual smoke baseline + screenshot 比对) | `packages/block-{callout,code,image,math,pdf}/src/ui-default/**/*.css` (5 light blocks) + `apps/site/playwright/visual-smoke.spec.ts` (baseline screenshots) | ~300 LOC | ux-ui-lead subagent (one-shot dispatch) | Row 5 (cross 5 block packages) |
| C.3-5 | Stage C.3 close: visual smoke vs baseline diff < 5% (per ADR-0018 AC#8) + Stage C.3 handoff pack | `apps/site/playwright/visual-smoke-baseline/*.png` (commit baselines) + handoff pack | ~50 LOC + binaries | orchestrator | Standard |

**Stage C.3 close criterion**: apps/site 整套界面与 v2 demo 视觉对齐; 8 light blocks OKLCH switchover collateral 通过 visual smoke; handoff pack mandatory. Sub-stage close = user MVP-judgment escape valve.

### Stage C.4 — Editor-shell wire to apps/site PR breakdown (locked at v1.0; per ADR-0018 D8 接口冻结 + ADR-0016 + ADR-0017)

| PR | Subject | Whitelist | LOC | Executor | D2 |
|---|---|---|---|---|---|
| C.4-1 | NoteSaveAdapter interface + NoteState shape + LocalStorageAdapter MVP impl (per ADR-0018 D8 接口冻结) | `packages/editor-shell/src/save-adapter.ts` (NEW) + `packages/editor-shell/CONTRACT.md` (W5-2 invariant + NoteSaveAdapter public surface section) + tests | ~250 LOC | codex-generic-executor | Row 1 (CONTRACT W5-2 + NoteSaveAdapter surface) + Row 5 |
| C.4-2 | apps/site `/notes/[slug]/edit` route mount editor-shell + EditorShellMount wrapper | `apps/site/src/pages/notes/[slug]/edit.astro` (NEW) + `apps/site/src/components/EditorShellMount.{astro,tsx}` (NEW) + `apps/site/CONTRACT.md` (route + mount contract) | ~300 LOC | codex-generic-executor | Row 1 + Row 5 |
| C.4-3 | BlockRegistry + KernelRegistry + mdx-bridge wire-up + palette/slash-menu/drag-handle/toolbar 组装 | editor-shell composition glue + apps/site consumption | ~400 LOC | codex-generic-executor | Row 1 + Row 5 |
| C.4-4 | Save/load 双向 implementation (per Pre-A4 接口冻结) + layoutEpoch sync + version increment trigger | editor-shell save/load wire + LocalStorageAdapter consumer + tests | ~300 LOC | codex-generic-executor | Row 1 |
| C.4-5 | Stage C.4 close: vitest + playwright 端到端 (load → edit → save → reload → verify content/grid intact) + Stage C.4 handoff pack = Wave 5 close 候选 | `apps/site/playwright/edit-flow-e2e.spec.ts` + handoff pack + Wave 5 close-prep readiness check | ~400 LOC | codex-generic-executor + orchestrator | Standard |

**Stage C.4 close criterion**: user navigate `/notes/<slug>/edit` → mount editor-shell → load notes → edit → save → reload → content + grid intact. **Sub-stage close = user MVP-judgment escape valve = Wave 5 close 候选** (Phase 1 完成 = MVP-ready). Handoff pack mandatory.

### Refined risk predictions (Pre-A5 v1.0)

Updates to Pre-A1 v0.2 risk list based on Pre-A2/3/4 plan-challenger findings:

7 既有 risks (per v0.2 Risk predictions section) all stand. NEW risk identified at Pre-A2/3/4:
8. **Pre-A3 4 R-rounds + Pre-A4 6 R-rounds drift** — large multi-section ADRs accumulate internal-consistency drift across plan-challenger absorbtion + cross-section references. Mitigation: Stage C.2/C.3/C.4 实施 PR 拆分小 (per per-PR breakdown above; ≤ 500 LOC typical); Pre-A4 已得到 lesson — multi-domain ADR (visual + save-path) 增加 drift surface; Wave 5 implementation PRs follow ADR-0006 D8 explicit-file-list staging discipline.
9. **OKLCH 6 R-rounds drift cost** — Pre-A4 内部一致性 drift 总耗 6 R-rounds; reflect Wave 4 R22 forward-fix classification: PR.md drift R-rounds (process-class) NOT implementation-defect R-rounds. Wave 5 implementation phase R-round target maintain ADR-0011 D8 ≤15%.

### Wave 5 PR roster (seeded)

| PR | Squash HEAD | Stage | Subject |
|---|---|---|---|
| #50 | `365173e` | Pre-A1 | Wave 5 plan v0.1 → v0.2 lock + plan-challenger 10/10 absorbed |
| #51 | `6e2c1d9` | Pre-A2 | ADR-0016 grid 数据模型 + W5-1 invariant + 12/12 absorbed (R2) |
| #52 | `157a4f7` | Pre-A3 | ADR-0017 drag/drop UX + 13/13 absorbed (R4) |
| #53 | `7e487ec` | Pre-A4 | ADR-0018 v2 视觉 + save-path 接口冻结 + 14/14 absorbed (R6) |
| #54 | `2bc129a` | Pre-A5 | Wave 5 plan v0.2 → v1.0 final lock + Stage C.1-C.4 PR breakdown |
| TBD (this) | TBD | v1.1 amend | Wave 5 plan v1.0 → v1.1 R14 amendment + NEW row C.2-3.5 (formalize C.2-1→C.2-3 hard-throw + sample-MDX + 17 RTT fixtures defer-chain per ADR-0015 R14) |
| (Stage C.1 = 3 PRs) | TBD | C.1 | C.1-1 plugin placeholder + v0.4 amend / C.1-2 PDF + chunk-leak / C.1-3 gitignore |
| (Stage C.2 = 13 PRs post v1.1) | TBD | C.2 | C.2-1 mdx-bridge serialize → C.2-3 Astro grid → **NEW C.2-3.5 hard-throw flip + sample-MDX backfill** → C.2-4 editor-shell grid → C.2-12 Stage C.2 close (C.2 grew 12 → 13 per v1.1 R14 amendment) |
| (Stage C.3 = 5 PRs) | TBD | C.3 | C.3-1 OKLCH + fonts → C.3-5 visual smoke baseline |
| (Stage C.4 = 5 PRs) | TBD | C.4 | C.4-1 NoteSaveAdapter → C.4-5 e2e + Wave 5 close 候选 |

**Wave 5 final PR count locked at v1.1**: 5 Pre-A + 3 (C.1) + **13** (C.2: 12 v1.0 baseline + 1 NEW C.2-3.5) + 5 (C.3) + 5 (C.4) = **31 implementation PRs total**. (Plus 1 meta amendment PR — this v1.1 amendment PR — logged separately in the roster table immediately above; total roster entries = 32 = 31 implementation + 1 meta. The "implementation PR count" 31 is what matters for session-budget estimate; the meta PR is workflow overhead.) v1.0 baseline = 30 implementation PRs; v1.1 delta = +1 PR (Stage C.2 grew 12 → 13). Within Wave 5 plan v0.2 estimate 23-30 PRs (re-baseline at v1.1 = 23-31 implementation). 3-5 sessions estimate maintained. Cumulative delta tracker: 1/30 = 3.3%, well below D4 R14 15% threshold per `## v1.1 R14 amendment` section "Cumulative PR delta tracker".

**Plan v1.0 lock evidence**: Pre-A5 PR.md `## acceptance` walks each amendment + Stage C.1-C.4 per-PR table presence + Wave 5 PR roster table.

## Out-of-scope (explicitly deferred)

- **Pre-A2 ADR-0016 authoring** — first ADR-class PR of Wave 5; happens AFTER Pre-A1 merges per ADR-0011 D1 strict serial.
- **Pre-A3 ADR-0017 + Pre-A4 ADR-0018+save-path 接口冻结 + Pre-A5 v1.0 lock** — sequential PRs after Pre-A2.
- **Stage C.1-C.4 implementation** — happens AFTER Pre-A5 v1.0 lock per R14 discipline (no implementation before plan v1.0).
- **Wave 5 close ceremony (ADR-0019)** — happens at Stage C close per user MVP judgment OR escape valve (D9); fresh session.
- **Phase 2 plan-draft** — happens after Wave 5 close (or Phase 1 pause if C.4 wire 完成 = MVP ship).
- **Stage C residue items** (C-3 PDF iframe / C-4 chunk-leak / test-results gitignore) — folded into Stage C.1 cleanup scope.

## Related

- [ADR-0015 Wave 4 close + D6 Wave 5 plan-draft handoff + R14](../../decisions/ADR-0015-wave-4-close.md) — explicit authorization for Pre-A1 work + R14 discipline source
- [ADR-0011 D1 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — Wave 5 KEPT
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md) — v0.4 amendment scope in Stage C.1 (plugin placeholder vs plugin-real-runtime split); v0.5 in Stage C.2 (grid context dimensions)
- [Wave 4 plan locked v0.2.1](2026-05-03-phase-1-wave-4-integration.md) — most recent precedent
- [docs/plans/active.md](../../plans/active.md) — currently points to "Wave 5 plan-draft pending"; will repoint at lock to "Wave 5 plan v0.2 locked; Pre-A2 next"
- granularity doc v0.3.4 (`/mnt/d/download/web/v2-design-granularity.md`) — gatekeeper-side scratch; ADR mapping authority + reframe v2 design intent (NOT in git per gatekeeper-side discipline)
- v2 demo files (`/mnt/d/download/web/{proto-app,proto-canvas,proto-markdown}.jsx` + `proto-styles.css` + `drag-storyboard.css` + `v2-styles.css`) — sampling now; full read at Pre-A2/3/4 ADR design-lock time
- gatekeeper directives (2026-05-04 post Wave 4 close) — orchestrator session inputs (not git-tracked but used at Wave 5 plan-draft lock time)
- memory `project_wave4_reframe_v2.md` (orchestrator-local at `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/`) — Wave 5 INPUT; preserved across sessions
- plan-challenger 10-Q absorbtion: this plan `## Plan-challenger codex absorbtion`; raw audit at `/tmp/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt`; curated archive at `docs/audits/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt`
