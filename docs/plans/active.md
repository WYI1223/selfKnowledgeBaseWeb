# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 2 ✅ **closed** by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) (2026-05-01) → **ADR-0011 (Linear-pipeline execution model) accepted 2026-05-01** as Wave 3+ entry policy → Wave 3 plan-draft 待启动（按 ADR-0011 D1-D8 模型）。

Wave 1 ✅ closed (2026-04-30, HEAD `b5e7217`) by [ADR-0002](../decisions/ADR-0002-wave-1-close.md);
Wave 2 ✅ closed (2026-05-01, HEAD `51789a1`) by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) — 17 main tracks shipped + 33 commits + 9 new packages + 6 cross-package single-authority invariants + 11 WE-* process learnings codified.

**Wave 2 新增架构 ADR**:

- [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) Wave 2 entry policies — dead-dep policy + block-foundation interface freeze
- [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) BlockKind union additive expansion (`prose|component|render|viz` 4-way)
- [ADR-0010](../decisions/ADR-0010-wave-2-close.md) **Wave 2 close** — 16 errata + 6 cross-package single-authority invariants + WE-001~WE-011 process learnings

**Wave 2 → Wave 3 bridge ADR (gatekeeper review post Wave 2 close)**:

- [ADR-0011](../decisions/ADR-0011-linear-pipeline-execution-model.md) **Linear-pipeline execution model (Wave 3+ entry policy)** — PR 串行 + codex 5.5 双角色 (executor + reviewer) + pr-writer subagent + Tier 1 worker 退役 + Tier 3 audit 全 codex 化。深化 ADR-0007 D5；部分 supersede ADR-0004 长期 teammate 形态；针对 Wave 2 24% forward-fix + WE-001/009/011 并发 hazard 类的根本性简化。

**结构 baseline**: [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md) (regular monthly audit at Wave 2 close; deltas vs Wave 1 baseline `structure-2026-04-29-wave-1.md`)
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md)

## 起手指引（新 session 拉到此文件后）

Wave 2 已闭环 + ADR-0011 已 accepted；下一步起 Wave 3 plan：

### Wave 3 plan 起草

主题：**集成层** — apps/site BlockRegistry 路由 + editor-shell + mdx-bridge 真实 round-trip + 8 block × 2 invariants × 1 fixture 测试套件 + search index。

1. 读 [ADR-0011](../decisions/ADR-0011-linear-pipeline-execution-model.md) D1-D8 —— **Wave 3+ 执行模型**（PR 串行 / codex 5.5 双角色 / pr-writer subagent / Tier 1 worker 退役 / Tier 3 audit 全 codex 化）
2. 读 [ADR-0010](../decisions/ADR-0010-wave-2-close.md) D7 (Wave 2 deferred) + D3 (errata 列表) — Wave 3 主体范围
3. 读 [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) D3 process improvement — 结构性 union 扩展先 ADR PR + 后消费方 PR
4. 读 [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) D1 dead-dep policy — Wave 3 任何新 dep 必须立即 import
5. 读 [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md) §7 Wave 3 plan-draft prereq + top 3 concerns
6. 读 ~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/ 的 WE-001 / WE-005 / WE-007 / WE-009 / WE-010 / WE-011 entries（Wave 2 codified concurrency hazards；Wave 3 起 PR 串行结构性消除大部分，仍读作背景）
7. 读 [phase-1/plan.md](phase-1/plan.md) Wave 3 行 — Wave 3 主题已宣告（集成层）
8. 读 Wave 2 plan retrospective（forward-fix rate 24% → 目标 ≤ 15% / 49 teammates → 目标 1 长期 + ≤4 subagent / 4 D2-row-4 触发 +pr-gate）
9. 用 `superpowers:writing-plans` 起草 Wave 3 plan，**按 ADR-0011 D1 stage 分组**：每个 stage ~5 PR，每 PR ≤ 200 LOC + 1 narrow responsibility
10. plan-challenger（codex tool，按 ADR-0007 D5）通过 `codex exec --profile plan-challenger < plan.md > challenge.txt` 挑战 → orchestrator 修订 → lock
11. **Pre-Task 0（new model）**：仅起 orchestrator 长期 session（per ADR-0011 D3 唯一长期 Claude session）；codex profile + Claude subagent 按需 dispatch；**不 TeamCreate**（per ADR-0011 D8 监控指标长期 teammates ≤ 1）

### Wave 3 起手必先解决（按顺序）

**1. ADR-0011 implementation — agent-contract.md 重构 + 下游再生成（Wave 3 第一个 PR；走 D1 pipeline 首次实战）**：

- Tier 1 worker section: 11 → 0 + retire 标记
- Tier 2 process: git-operator 退役（吸收进 codex reviewer commit phase）+ pr-reviewer 标"orchestrator 兼"
- Tier 3 audit: 全 codex 化（structure-auditor / performance-auditor / mdx-doctor → codex profile；link-checker → CI gate）
- 新增 pr-writer Claude subagent（D7）
- tool_patterns: 新增 4 profile（codex-generic-executor / codex-structure-auditor / codex-perf-auditor / codex-mdx-doctor）+ pr-gate 升级为 codex-pr-reviewer-55 + code-reviewer 标 deprecated（D6）
- 跑 `pnpm generate:configs` 重新渲染 CLAUDE.md / AGENTS.md / .claude/agents/*.md / docs/runbooks/team-operations.md / docs/runbooks/codex-tool-invocations.md
- bundle commit (per ADR-0006 D8 explicit-file-list staging)：agent-contract.md + 全部 generated downstream + active.md retire 部分（如需要）
- **走 D1 pipeline 实战**：pr-writer 写 PR.md → codex-generic-executor 实施 → codex-pr-reviewer-55 review → orchestrator pre-commit Claude review (D2 row 4 触发：本 PR touches authority + new ADR refs) → reviewer commit + push
- 此 PR 验证 ADR-0011 D-list 的 pipeline 可工作；后续 Wave 3 PR 才进入正常 stage 序列

**2. F3 — ADR-0008 D1 第一个 mechanical violation**：`block-code` + `block-image` 声明 `@skb/design-tokens` workspace dep 但源码无 TS import（CSS 变量消费）。详见 ADR-0010 D3 #7a；选定路径 **(b)** 仿 block-callout `VARIANT_TOKENS` 引入 typed constants（gatekeeper 2026-05-01 锁定）。Wave 3 第二个 PR。

**3. 3 viz-block test corpora 300+ 行 pre-allowlist**：block-jupyter/kernel-bridge.test.ts (414) + block-nn-viz/tfjs-bridge.test.ts (327) + block-agent-flow/flow-bridge.test.ts (326)。Wave 3 第三个 PR：加 CONTRACT pre-allowlist（仿 mdx-bridge serialize.ts 模式）。

### Wave 3 主题（提前备忘）

- **apps/site BlockRegistry 路由**：`Astro.glob('content/notes/**/*.mdx')` + components map (PascalCase → React component) + per-block view
- **editor-shell 集成**：把 editor-toolbar / slash-menu / drag-handle 组装成可用编辑器；wire BlockRegistry + kernel-registry
- **mdx-bridge round-trip 块组件**：8 个 block kind × `mdxToTiptap` + `tiptapToMdx` + 1 fixture per block × 2 invariants（idempotent + lossless）— 添加 fixture 编号 22-29（沿用 1-21 序）
- **content schema 扩展**：Wave 1 frontmatterSchema 沿用；Wave 3 可能需要 block-level metadata schemas（如 jupyter cell ID + viz state checkpoint）— 由 content-types 拥有
- **search index**：Phase 1 Wave 3 主目标之一（spec §4.2 列入 wave 3）— 选 lunr.js 或 PageFind；本地 client-side index
- **agent_bridge.py TS schema → Pydantic mirror**（carry-forward from ADR-0002 #22）—如本 wave 不做需明确 defer 到 Wave 4

### Wave 3 高风险触发预测（ADR-0007 D2 + ADR-0011 D1 stage 4 pre-commit Claude review）

- ADR-0011 implementation（第一个 PR）→ row 4 (new ADR refs) + authority touch → **D1 stage 4 pre-commit Claude review 必跑**
- mdx-bridge round-trip 扩展 → row 1 (contract change in mdx-bridge) → D1 stage 4 触发
- editor-shell 是新 package → row 2 (package add) → D1 stage 4 触发
- search index 影响 build 时构建 → row 8 (CI/deploy/auth/security) → D1 stage 4 触发
- agent_bridge.py 跨 TS↔Python schema → row 5 (cross ≥3 packages) → D1 stage 4 触发

**注**：ADR-0011 D1 stage 4 pre-commit Claude review 由 orchestrator 自己跑（同 Claude opus 4.7 session），不另起 subagent。预期 Wave 3 触发率仍 ~24%（同 Wave 2，因为新 model 没改高风险触发条件，只改了执行流水线）。

## Wave 2 完工归档（参考）

- 17 main tracks shipped + 33 commits since Wave 1 close（Wave 2 commit roster 见 ADR-0010 D2）
- 9 new packages：8 block-* + kernel-pyodide + 3 editor sub-modules（editor-toolbar/slash-menu/drag-handle 是 packages/ 下新增）
- 6 cross-package single-authority invariants（BlockKind / RFC.md / KernelAdapter / calloutPropsSchema / ui-default template / editor sub-module template）
- 11 WE-* process learnings codified（concurrency hazards + verification protocols + reviewer authority discipline）
- 4 forward-fix commits（D1×2 + B2×2）；24% forward-fix rate（vs Wave 1 14%）
- ADR-0009 first ADR-authorized BlockKind extension landed cleanly（一 R3 procedural fix motivated D3 process improvement）

## Wave 1 完工归档（参考）

- 7 高风险 PR 已 commit：G/E/B/D/F/C/A，全部 codex 5.5 双审 PASS
- 12 cross-location asymmetry meta-class 实例已编入 ADR-0006 empirical 8-point checklist
- 3 cross-package single-authority invariants（frontmatterSchema / editBlockInputSchema / getInitialTheme）已对称落地到 CONTRACT.md
- vitest strict + CI test gate 已修（Task 11 systemic bug 闭环）+ lychee config 已修（Task 10）

## Related

- [overview](overview.md)
- [phase-0 plan](../superpowers/plans/2026-04-29-phase-0-scaffolding.md) ✅ closed by ADR-0001
- [phase-1 wave-1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) ✅ closed by ADR-0002
- [phase-1 wave-2 plan](../superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) ✅ closed by ADR-0010
- [phase-1 wave 索引](phase-1/plan.md)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md)
- [ADR-0002](../decisions/ADR-0002-wave-1-close.md) Wave 1 close
- [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md) headless / UI 分层 + design-tokens + 开源就绪
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) 职能化分工 + Codex-heavy 执行 + teammate/tool 切分
- [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) Wave 2 entry policies
- [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union
- [ADR-0010](../decisions/ADR-0010-wave-2-close.md) Wave 2 close
- [ADR-0011](../decisions/ADR-0011-linear-pipeline-execution-model.md) Linear-pipeline execution model (Wave 3+ entry policy)
