# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 1 ✅ **closed** (2026-04-30, HEAD `b5e7217`) → Wave 2 plan 待起草（**前置 ADR-0007 实施**）
**新增架构 ADR**:
- [ADR-0002](../decisions/ADR-0002-wave-1-close.md) Wave 1 close — 22 errata + 3 cross-package single-authority invariants
- [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) 8-point cross-location asymmetry-audit checklist (process rule, mandatory for code-reviewer + pr-gate; embedded in `agent-contract.md` + regenerated subagent prompts + cross-linked from team-operations.md)
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) **职能化分工 + Codex-heavy 执行 + teammate/tool 切分** (Wave 2 起重大架构调整：新增 ux-ui-lead；Claude pr-reviewer 改选择性；codex agents 降级为 orchestrator-direct tools)
**结构 baseline**: [docs/audits/structure-2026-04-29-wave-1.md](../audits/structure-2026-04-29-wave-1.md) (first monthly audit at Wave 1 close)
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md)（必须前置注入每个 spawn 的 prompt；Tier 2 reviewer rows 现已 cross-link ADR-0006 8-point checklist；reviewer subagent prompts 也已 regen 嵌入 8 项摘要）

## 起手指引（新 session 拉到此文件后）

Wave 1 已闭环；下一步分两阶段：

### A. **Wave 2 Pre-Task 0：实施 ADR-0007**（高风险，必先执行）

ADR-0007 重构 agent 阵容。**实施作为 Wave 2 第一个 task 走完整 review chain**（codex 5.3-spark + codex 5.5 pr-gate + Claude pr-reviewer，因 ADR-0007 D2 触发条件命中）。**严格按 ADR-0006 D8 staging protocol** 执行（authority + generator code + 全部生成产物在同一 bundle commit；显式 `git add` + `git diff --cached --stat` 验证）。

具体步骤参 [ADR-0007 §"Wave 2 Pre-Task 0 实施指南"](../decisions/ADR-0007-job-function-codex-heavy-execution.md#wave-2-pre-task-0-实施指南高风险须走完整-review-chain) 7-step 序列：

1. agent-contract.md 加 ux-ui-lead
2. agent-contract.md schema 扩展 `tool_patterns:` 段
3. 更新 `scripts/render/types.ts`（加 `ToolPatternSchema`）
4. 更新 5 个 renderer + 新增 `codex-tool-runbook.ts`
5. 更新 `.claude/settings.json` permissions（如需）
6. `pnpm generate:configs` + 严格 staging protocol（见 ADR-0007 Step 6 完整 git add 命令）
7. 测试 + commit + push（CI 全绿，含 agent-contract drift check）

### B. **Wave 2 plan 起草**（在 A 完工后）

A 完工 + 新 agent 阵容生效后，再起草 Wave 2 plan：

1. 读 [ADR-0002](../decisions/ADR-0002-wave-1-close.md) + [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) + **[ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md)**（必读）
2. 读 [docs/audits/structure-2026-04-29-wave-1.md](../audits/structure-2026-04-29-wave-1.md)
3. 读 [phase-1/plan.md](phase-1/plan.md) 的"Wave 2 plan 写作时需要前置考虑"段
4. 读 Wave 1 plan retrospective（review-round count, fixture growth, codex catch rate）
5. 用 `superpowers:writing-plans` 起草 Wave 2 plan
6. plan-challenger（**现在是 tool**，按 ADR-0007 D5）通过 `codex exec --profile plan-challenger < plan.md > challenge.txt` 挑战 → orchestrator 修订 → lock
7. Pre-Task 0（**真正的** Wave 2 Task 0，agent-contract.md 已重构后）：TeamCreate `phase-1-wave-2` + spawn 20 teammates（T0:1 + T1:11（含 ux-ui-lead）+ T2:4 + T3:4；按需复用 T3 audit）

## Wave 1 完工归档（参考）

- 7 高风险 PR 已 commit：G/E/B/D/F/C/A，全部 codex 5.5 双审 PASS
- 12 cross-location asymmetry meta-class 实例（worker layer 1-7：B R1 / D R2 / F R3 / C R2 / F R5 / A R1 / A R2；close-ceremony 8-12：v1 dogfood failure / v2 ADR-0006:81 drift / v3 ADR-0006:117 drift / v4 structure baseline:66 / v5 generator outputs not staged）已编入 ADR-0006 empirical 8-point checklist（8 distinct items + 4 close-ceremony reinforcements of items #6 + #8）
- 3 cross-package single-authority invariants 已对称落地到 CONTRACT.md（`frontmatterSchema` / `editBlockInputSchema` / `getInitialTheme()`）
- vitest strict + CI test gate 已修（Task 11 systemic bug 闭环）+ lychee config 已修（Task 10）

## 已消化的 Phase 0 deferred follow-ups

- ✅ Task 0 处理：#3 concurrency / #4 fail / #6 configFile（commit `6a791e6`）
- ✅ Task Z 处理：#2 strict vitest（root vitest.config.ts:6 + remove `--passWithNoTests` flags）
- ⏳ Wave 2 自然消化：#1 YAML escape（spec 文档生成器维护）/ #5 tsconfig references 持续扩展

## Wave 2 plan 起草时的前置备忘

见 [phase-1/plan.md](phase-1/plan.md) 的"Wave 2 plan 写作时需要前置考虑"段。

**新增（ADR-0003）**：Wave 2 各 component block 的 task 拆为 core 实现 + ui-default 实现两部分；codex-block-generator 在 block-callout/{core+ui} 完成后承担其余 simple block 的批量仿造。

**新增（ADR-0007）**：
- 8 个 ui-default 由 **ux-ui-lead** (新 Claude teammate) 写第一个 template，其余 codex-block-generator (tool) clone（D1 + D3）
- core 试点：simple block 集群（callout template + code/image clone）；render block / viz block 不试点（D3）
- editor 三子模块（slash-menu / drag-handle / toolbar）同 template+clone 模式（D3）
- ui-default review 由 ux-ui-lead 做视觉一致性审 + codex tool 做代码层审
- review chain 默认 codex 5.3-spark + orchestrator 自检；ADR-0007 D2 列表的 7 类高风险 PR 才追加 pr-gate / Claude pr-reviewer
- spawn ux-ui-lead 时必须注入三个设计 skill（frontend-design / ui-ux-pro-max-skill / web-design-guidelines）—— D4

**Wave 1 erratum（smoke test 时发现）**：
- `apps/site` `<main class="prose">` 在 Wave 1 实际无效 —— `@tailwindcss/typography` 没装。已修：commit `fdc86a8` 加入 design-tokens 依赖 + Tailwind preset bundle plugin + 把 `--tw-prose-*` CSS vars 绑到 design-token vars。Wave 2 ui-default 实现可基于此 plugin 假设
- detail 页有 duplicate H1（layout `<h1>{title}</h1>` + MDX `# Sample`）—— 1 行修法（删 sample MDX 的 `# Sample` 行 OR 拿掉 layout 的 `<h1>`），Wave 2 plan 第一批简单清理 task 顺手做

## Related

- [overview](overview.md)
- [phase-0 plan](../superpowers/plans/2026-04-29-phase-0-scaffolding.md) ✅ closed by ADR-0001
- [phase-1 wave-1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) ⏳ 待执行
- [phase-1 wave 索引](phase-1/plan.md)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md)
- [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md) headless / UI 分层 + design-tokens + 开源就绪
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) 职能化分工 + Codex-heavy 执行 + teammate/tool 切分
