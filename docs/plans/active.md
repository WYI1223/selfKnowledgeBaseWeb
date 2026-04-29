# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 1（**9 任务 + Pre-Task 0 团队启动**） —— 待执行
**架构变更**:
- [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md) headless / UI 分层 + design-tokens + 开源就绪
- [ADR-0004](../decisions/ADR-0004-agent-team-dispatch-model.md) **Claude Code Agent Team dispatch 模型**（取代之前默认假设的一次性 Task 调用）
**Wave 1 plan**: [docs/superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md)
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md)（必须前置注入每个 spawn 的 prompt）

## 起手指引（新 session 拉到此文件后）

1. 读 [ADR-0004](../decisions/ADR-0004-agent-team-dispatch-model.md) + [team-operations.md](../runbooks/team-operations.md)（dispatch 模型）+ [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md)（headless/UI）+ [ADR-0001](../decisions/ADR-0001-stack-selection.md)（含 7 erratum + 6 deferred follow-up）+ spec 全文
2. 读 Wave 1 plan，注意"执行模型"段 + "总览：9 个任务 + Pre-Task 0 团队启动"段
3. 先做 **Pre-Task 0**（仅 orchestrator）：`TeamCreate` + `TaskCreate × 9`（含 blocked_by 表达 G→A 依赖）+ spawn 11 个 active teammate（每个的 prompt 前置注入 team-operations.md 全文）
4. 派 **Task 0** 给 api-builder（TaskUpdate(owner) + SendMessage 提示开始）
5. Task 0 review pass 后**同时**启动 Track G + Track B/C/D/E/F（5 路并行；Track A 因 blocked_by Track G 而不会被 claim）
6. Track G review pass 后启动 Track A
7. 7 track 全部 ready-for-review 且双审 pass（高风险触发 pr-gate 5.5）后做 **Task Z**（Wave 1 close + ADR-0002 + 团队 shutdown + TeamDelete）
8. ADR-0002 之后修改本文件指向 Wave 2

## 待解决的 Phase 0 deferred follow-ups（按归属预排）

- Task 0 处理：#3 concurrency / #4 fail / #6 configFile
- Task Z 处理：#2 strict vitest
- Wave 2 自然消化：#1 YAML escape / #5 tsconfig references 持续扩展

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
