# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 1（**9 任务**：基础设施 + 接口 + 设计 token + housekeeping + close）—— 待执行
**架构变更**: ADR-0003（headless / UI 分层 + design-tokens + 开源就绪）已落地到本 wave
**Wave 1 plan**: [docs/superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md)
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)

## 起手指引（新 session 拉到此文件后）

1. 读 spec §4.2.1（Wave 1 退出标准）+ [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md)（架构变更摘要）
2. 读 Wave 1 plan，注意"总览：9 个任务"段
3. 先做 **Task 0**（串行）—— 解决 ADR-0001 deferred follow-up #3/#4/#6
4. Task 0 review pass 后并行 dispatch **Track G + Track B/C/D/E/F** 6 路（Track A 等 G 完成才能起）
5. Track G review pass 后启动 Track A
6. 7 track 全部 ready-for-review 且双审 pass（高风险触发 pr-gate 5.5）后做 **Task Z**（Wave 1 close + ADR-0002）
7. ADR-0002 之后修改本文件指向 Wave 2

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
