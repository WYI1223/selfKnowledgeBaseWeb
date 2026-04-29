# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 1（基础设施 + 接口，6 路并行 + Task 0 + Task Z）—— 待执行
**Wave 1 plan**: [docs/superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md)
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)

## 起手指引（新 session 拉到此文件后）

1. 读 spec §4.2.1（Wave 1 退出标准）
2. 读 Wave 1 plan，注意"总览：8 个任务"段
3. 先做 **Task 0**（串行）—— 解决 ADR-0001 deferred follow-up #3/#4/#6
4. Task 0 review pass 后并行 dispatch Track A-F 6 个 worker
5. 6 track 全部 ready-for-review 且双审 pass（高风险 track B/C/E/F 多过 pr-gate 5.5）后做 **Task Z**（Wave 1 close + ADR-0002）
6. ADR-0002 之后修改本文件指向 Wave 2

## 待解决的 Phase 0 deferred follow-ups（按归属预排）

- Task 0 处理：#3 concurrency / #4 fail / #6 configFile
- Task Z 处理：#2 strict vitest
- Wave 2 自然消化：#1 YAML escape / #5 tsconfig references 持续扩展

## Wave 2 plan 起草时的前置备忘

见 [phase-1/plan.md](phase-1/plan.md) 的"Wave 2 plan 写作时需要前置考虑"段。

## Related

- [overview](overview.md)
- [phase-0 plan](../superpowers/plans/2026-04-29-phase-0-scaffolding.md) ✅ closed by ADR-0001
- [phase-1 wave-1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) ⏳ 待执行
- [phase-1 wave 索引](phase-1/plan.md)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md)
