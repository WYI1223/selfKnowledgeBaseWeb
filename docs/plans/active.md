# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 1 ✅ **closed** (2026-04-30, HEAD `b5e7217`) → Wave 2 plan 待起草
**新增架构 ADR**:
- [ADR-0002](../decisions/ADR-0002-wave-1-close.md) Wave 1 close — 22 errata + 3 cross-package single-authority invariants
- [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) 8-point cross-location asymmetry-audit checklist (process rule, mandatory for code-reviewer + pr-gate; embedded in `agent-contract.md` + regenerated subagent prompts + cross-linked from team-operations.md)
**结构 baseline**: [docs/audits/structure-2026-04-29-wave-1.md](../audits/structure-2026-04-29-wave-1.md) (first monthly audit at Wave 1 close)
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md)（必须前置注入每个 spawn 的 prompt；Tier 2 reviewer rows 现已 cross-link ADR-0006 8-point checklist；reviewer subagent prompts 也已 regen 嵌入 8 项摘要）

## 起手指引（新 session 拉到此文件后）

Wave 1 已闭环；下一步是 **Wave 2 plan 起草**：

1. 读 [ADR-0002](../decisions/ADR-0002-wave-1-close.md)（Wave 1 闭环 + 22 errata + cross-package invariants）+ [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md)（8-point checklist 必读）
2. 读 [docs/audits/structure-2026-04-29-wave-1.md](../audits/structure-2026-04-29-wave-1.md)（结构 baseline，Wave 2 plan 据此判断哪些包/接口需先于 component block 实施）
3. 读 [phase-1/plan.md](phase-1/plan.md) 的"Wave 2 plan 写作时需要前置考虑"段
4. 读 Wave 1 plan retrospective（review-round count, fixture growth pattern, codex catch rate） — 用于校准 Wave 2 任务粒度与 review 预算
5. 用 `superpowers:writing-plans` 起草 Wave 2 plan，写入 `docs/superpowers/plans/2026-MM-DD-phase-1-wave-2-component-blocks.md`
6. plan-challenger 挑战 → orchestrator 修订 → lock
7. Pre-Task 0：TeamCreate `phase-1-wave-2` + spawn teammates（roster 可能调整：Wave 2 多用 codex-block-generator / codex-css-stylist / codex-test-scaffolder）

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
**新增**：Wave 2 各 component block 的 task 拆为 core 实现 + ui-default 实现两部分（ADR-0003）；codex-block-generator 在 block-callout/{core+ui} 完成后承担其余 simple block 的批量仿造。

## Related

- [overview](overview.md)
- [phase-0 plan](../superpowers/plans/2026-04-29-phase-0-scaffolding.md) ✅ closed by ADR-0001
- [phase-1 wave-1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) ⏳ 待执行
- [phase-1 wave 索引](phase-1/plan.md)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md)
- [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md) headless / UI 分层 + design-tokens + 开源就绪
