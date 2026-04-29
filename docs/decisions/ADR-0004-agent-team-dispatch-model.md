# ADR-0004: 采用 Claude Code Agent Team 作为多 agent dispatch 模型

| 字段 | 值 |
|---|---|
| 状态 | accepted |
| 日期 | 2026-04-29 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | 用户指出："应该用 Claude Code 原生 agent team 功能"；调研后确认是对的 |
| 替代 | 不替代任何 ADR；修正 ADR-0001 / ADR-0003 中默认假设的"一次性 Task dispatch"工作流 |

## Context

ADR-0001 / ADR-0003 / Phase 0 的实现工作（agent-contract.md → 27 agent 定义 → `.claude/agents/*.md`）建立了 agent **类型**单一源。但 Wave 1 plan 与历次讨论默认的 dispatch 模型是 **"一次性 `Task` 工具调用"**：

> orchestrator 用 `Task({subagent_type: 'block-foundation-eng'})` 派一次 → fresh agent 执行 → 返回单条结果消息 → 销毁 → orchestrator 再派下一个

这个模型有以下问题与项目实际诉求错位：

1. **review 链路反复 spawn 浪费**：每次 PR review 都要重新启动 reviewer agent + 重新加载它的系统提示 + 重新读 spec / CONTRACT.md 等上下文；reviewer 之间无法直接对话
2. **跨 wave 状态丢失**：orchestrator 想跨多个 wave 维护"哪个 track 处于什么阶段"的认知，必须自己记账；agent 间无任何持久协作面
3. **依赖关系（Track G→A）只能由 orchestrator 外部代码强制**：没有共享的"任务图"
4. **Codex worker 的状态同步**：调用 `codex exec` 后输出怎么自然流回 reviewer / orchestrator？一次性 Task 模式下需要 orchestrator 中转
5. **不能利用 Phase 0 已经在 Claude Code 工具集里 ship 的能力**：`TeamCreate` / `SendMessage` / `TaskCreate` / `TaskUpdate` / `TeamDelete` 都是开箱即用的现成基础设施

调研（claude-code-guide subagent）确认：**Claude Code Agent Team 正是 Anthropic 官方为"orchestrator + 多 agent 协作 + 共享任务列表"提供的原生原语**。它与 `.claude/agents/` 子代理定义**完全互补**——子代理定义是"agent 类型"，team 把这些类型实例化成长期存活的 teammate。

## Decision

### D1: Wave 1 起，所有 wave 用 Claude Code Agent Team 执行

每个 wave 一个 team，命名 `phase-<N>-wave-<M>`（例：`phase-1-wave-1`）。team 在 wave 启动时由 orchestrator `TeamCreate`，wave 完工时 `TeamDelete`。

### D2: 27 个 agent 类型定义保持不变

`.claude/agents/*.md`（由 `agent-contract.md` + 生成器产出）继续是 **agent 类型库**。当 orchestrator 用以下方式 spawn 时，agent 类型被实例化为 team member：

```
Agent({
  subagent_type: "block-foundation-eng",
  team_name: "phase-1-wave-1",
  name: "block-foundation-eng",
  prompt: <初始任务 + team-operations 操作手册>
})
```

`name` 是 teammate 在 team 内的可寻址名字（用于 `SendMessage({to: "block-foundation-eng"})`）。同 wave 内 name 唯一即可。

### D3: 共享 TaskList 表达 wave 计划

每个 task / track 在 plan 文件里的描述对应 team `TaskList` 中一条任务：

- `TaskCreate({content: "Track G: design-tokens", ...})` 创建任务条目
- 用 `blocked_by` 字段表达依赖（Track A 的任务 `blocked_by` Track G 的任务 id）
- `TaskUpdate({owner: "editor-integrator"})` 由 orchestrator 分配
- teammate 完成后 `TaskUpdate({status: "completed"})`

这样 **plan 文件 = 蓝图**；**TaskList = 运行时执行图**。两者通过 task 标题对齐。

### D4: review 链通过 SendMessage 触发

```
worker (track 完工)
   ↓ TaskUpdate({status: "ready-for-review"})
orchestrator 监听到 ready 信号
   ↓ SendMessage({to: "code-reviewer", message: "review track-X PR"})
code-reviewer (idle)
   ↓ 唤醒 → 读 PR diff → review → 输出结论
   ↓ SendMessage({to: "orchestrator", message: "PASS" | "FAIL ..."})

[高风险 PR escalate 到 pr-gate Codex 5.5]
   ↓ orchestrator SendMessage({to: "pr-gate", ...})
   ↓ ...

[然后 pr-reviewer Claude]
   ↓ SendMessage({to: "pr-reviewer", ...})
   ↓ ...

[全部 pass]
   ↓ SendMessage({to: "git-operator", message: "commit track-X"})
git-operator
   ↓ 执行 commit + push
   ↓ SendMessage({to: "orchestrator", message: "merged"})
   ↓ TaskUpdate({status: "completed"})
```

reviewer / git-operator **永远 idle**，等消息触发；不浪费 spawn 成本。

### D5: Codex agent 是"Claude teammate 内部调用 codex exec"

`code-reviewer` / `pr-gate` / `plan-challenger` / 5 个 `codex-*-eng` 这 8 个 agent 在 `.claude/agents/` 里都是 Claude 子代理定义；它们的系统提示中明确指示 "你接到任务后用 Bash 调用 `codex exec --profile <profile>`"。

team 里它们仍是 **Claude teammate**（消费 Claude Code 上下文），但实际 review / 脚手架工作由 Codex 完成。这正好与 ADR-0001 erratum 2（codex profile `approval_policy="never"`）协同：codex 在 sandbox 里跑完，输出回到 Claude teammate 的 turn，再通过 SendMessage / TaskUpdate 回报 team。

### D6: team 操作手册 (runbook) 注入 spawn prompt

新建 `docs/runbooks/team-operations.md`，包含：

- 如何读 `~/.claude/teams/{team-name}/config.json` 找队友
- 如何 `TaskList` / `TaskUpdate` / `SendMessage`
- 何时主动 claim 任务、何时等待 owner 分配
- review 链 message 格式约定（PASS / FAIL / escalate triggers）
- shutdown 协议响应

orchestrator 在每次 `Agent(...)` spawn teammate 时，把这份 runbook 内容**前置注入** prompt 字段。这避免修改 27 个 agent 定义文件（agent-contract.md 仍是单一类型源），同时保证每个 teammate 起手就有操作指南。

### D7: 一次性 `Task` 调用仍保留

team 模式不排斥一次性 `Task` 调用。**适合一次性的场景**：

- orchestrator 在 plan 阶段 dispatch `researcher` 做调研（一次问答即可）
- teammate 在自己 turn 内调一个轻量子任务（例如调 `Explore` 找文件位置）

判定准则：**任务有持续协作 / 多轮 review → 用 team；任务是一次问答 / 工具式调用 → 用 Task**。

## Consequences

### 正面

- **TaskList 状态机替代外部记账**：依赖、阻塞、完成度都在 team 共享面内
- **review 链零冷启动**：reviewer / git-operator 长期 idle，message 唤醒
- **Codex 与 Claude 协同自然**：通过 Claude teammate 间接，输出经 Claude 的 turn 流回 team
- **ADR-0002 (Wave 1 close) 撰写更容易**：从 TaskList 自动汇总执行轨迹
- **Phase 2/3 平滑扩展**：Phase 2 / 2a / 2b 各自一个 team，agents 类型库不变

### 负面 / 需应对

- **Token 成本上升**：~10 个 active teammate × 各自上下文窗口 vs 一次性 Task 的"用时申请"。Wave 1 估算约 +30% token；reviewer / git-operator idle 状态消耗很少（只在被消息唤醒时扣 token），主要成本在 active worker 长期持有上下文
- **失败模式更多样**：teammate 卡住、消息丢失、TaskList 状态不一致都成为新故障类型；ADR-0002 errata 节会捕捉
- **Phase 0 deferred follow-up #1（YAML 转义）现在更紧迫**：agent-contract.md description 里的特殊字符可能直接进 spawn prompt
- **一些 spec 描述需要校正**：spec §3.1 的 "Tier 0/1/2/3" 现在是 team 角色而非"独立调用单元"；§3.2 review 工作流需补 SendMessage trigger 表达

### 影响其他 ADR / spec

- ADR-0001 没有错，但其语境下隐含的"orchestrator → 一次性 Task"假设需更新
- ADR-0003 不受影响（Track G/A/B 等 dispatch 名字不变，只是变成 team member 名字）
- spec §3.1 加注脚："Tier 0/1/2/3 angle 在 dispatch 时通过 team_name + name 实例化为 teammate"
- spec §3.2 review 工作流加注："执行机制由 SendMessage + TaskUpdate 串接"
- spec decision log 追加本 ADR 条目

## Phase 1 Wave 1 plan 调整

新版 plan 在 Task 0 之前**新增一个 Pre-Task 0：Team Bootstrap**，含：

1. orchestrator session 起 + 读 plan + 读 active.md
2. `TeamCreate({team_name: "phase-1-wave-1", ...})`
3. `TaskCreate × 9`（Task 0 / Track A-G / Task Z）+ 标 blocked_by（Track A blocked_by Track G）
4. spawn teammates（按当前 wave 实际需要，非全 27 个）
5. 把 `team-operations.md` 内容前置注入每个 spawn 的 prompt
6. 派 Task 0 给 api-builder（TaskUpdate(owner) + SendMessage 提示开始）

Task Z 加入：

- 全部 task completed 后向所有 teammate 发 `shutdown_request`
- 等所有 teammate `shutdown_response` 后 `TeamDelete`

具体 step 增删见 plan 文件。

## Related

- [设计规格 §3.1 / §3.2](../superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [ADR-0001](ADR-0001-stack-selection.md)
- [ADR-0003](ADR-0003-headless-presentational-split.md)
- [Phase 1 Wave 1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md)
- [agent-contract.md](../../agent-contract.md) — 27 agent 类型单一源（不变）
- [team-operations.md](../runbooks/team-operations.md) — 队友操作手册（新增）
- 调研依据：[Claude Code Agent Teams 官方文档](https://code.claude.com/docs/en/agent-teams.md) · [TeamCreate 工具描述](本仓库 ToolSearch 输出)
