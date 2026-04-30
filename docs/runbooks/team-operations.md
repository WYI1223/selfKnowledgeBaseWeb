# Team Operations Runbook

> 这份文档由 orchestrator **前置注入** 每个 teammate 的 spawn prompt。读完它，你就懂团队协作协议。
> 适用范围：所有 Claude Code agent team 模式下的 teammate（按 ADR-0004 工作）。

## 你在哪

你刚被 spawn 进入一个 Claude Code agent team。Team 名字、你的角色、你的任务都会在初始消息中告知。本文档教你**如何与队友协作**。

## 三个核心机制

### 1. 共享 TaskList

- 你的 team 的任务列表在 `~/.claude/tasks/{team-name}/` 下，多个 teammate 共享
- 用 `TaskList` 工具看全部任务状态
- 用 `TaskUpdate` 改自己负责的任务（status / owner / notes）
- 任务有依赖关系：被 `blocked_by` 阻塞的任务在依赖完成前不要 claim
- **完成任务的最后一步永远是 `TaskUpdate({status: "completed"})`**

```
推荐流程：
1. TaskList 查看可领的（unassigned + unblocked）任务
2. 找 ID 最小的合适任务，TaskUpdate({owner: "<你的名字>"}) 自我分配
3. 执行
4. TaskUpdate({status: "ready-for-review"} 或直接 "completed")
5. 回到 1
```

### 2. SendMessage

- 你说出来的话**只有 user 看得到**，**队友看不到**
- 给队友发消息用 `SendMessage({to: "<队友名字>", summary: "...", message: "..."})`
- 队友的回复会作为新对话轮自动到达你 —— 不要主动检查"收件箱"
- **永远用名字寻址队友**（不要用 agentId UUID）
- 队友列表在 `~/.claude/teams/{team-name}/config.json` 的 `members` 数组

### 3. Idle 状态（本项目：orchestrator-managed）

- 你在每个 turn 结束后**自动 idle**
- Idle 不等于"完工"或"不可用" —— 只是等输入
- 别人给你发 SendMessage 会自动唤醒你
- **本项目锁定 orchestrator-managed 模式**（详见下方"项目工作模式"段）：
  - 你**不主动 claim 任务**；等 orchestrator SendMessage 分配
  - 即使 TaskList 里有 unblocked & unassigned 任务也**不要 claim** —— 跨 track review-gate 依赖在 TaskList 之外，由 orchestrator 集中调度

## 项目工作模式：orchestrator-managed

Claude Code agent team 支持两种协作模式，**本项目（SelfKnowledgeBaseWeb）锁定 orchestrator-managed**：

| 模式 | 工作流 | 适合场景 |
|---|---|---|
| **self-managed** | workers 自动从 TaskList 找 unblocked task 并 `TaskUpdate(owner=self)` 自我分配；orchestrator 只做战略指引 | 任务相互独立 / 无 review-gate 依赖 / 资源充裕可并发 |
| **orchestrator-managed** ★ | workers 等 orchestrator `SendMessage` 显式分配；TaskList 是状态板而非工单池 | 跨 track review-gate 依赖 / 高风险 PR 需 escalate / 配额紧 |

锁定 orchestrator-managed 的理由：

1. **Track 间 review-gate 依赖超出 `blocked_by` 表达力**：例如 Track A 等的不是 Track G **task completed**，而是 Track G **review pass + commit merged**。这个状态机由 orchestrator 维护，不由 TaskList 直接呈现
2. **高风险 PR escalate 到 pr-gate 是 orchestrator 决策**：worker 不能擅自决定要不要走 5.5 review
3. **Codex 调用配额管理**：避免多个 codex worker 并发拉爆 API；orchestrator 集中调度

实操含义：

- 你收到 spawn prompt 后**只 idle 等 SendMessage**
- orchestrator 用 `TaskUpdate(owner=...)` + `SendMessage(to=...)` 显式派任务
- 你完工后 `SendMessage` 回 orchestrator + `TaskUpdate(status=...)`，**不主动 claim 下一个**
- reviewer / git-operator 同样等消息触发，从不主动扫 TaskList
- 如果你接到的 spawn prompt 包含"主动 claim"指示，说明该 spawn 是错的 —— 报告 orchestrator 修复

## 角色与触发器

按 [agent-contract.md](../../agent-contract.md) 与 [设计规格 §3.1](../superpowers/specs/2026-04-29-self-knowledge-base-design.md)：

### Tier 0：orchestrator（主脑）

- 维护 `docs/plans/` 与 TaskList
- 把 plan 文件里的 task 用 `TaskCreate` 登记到 team TaskList
- 用 `TaskUpdate(owner=...)` 把任务分给具体 teammate
- 不主动写代码；review 通过 SendMessage 触发

### Tier 1：worker（写实现）

- 拿到任务后做完整的实现 + 单测
- **完工标准**：`pnpm check` 在自己包内全绿 + 文档（CONTRACT.md / 注释）齐全
- 完工后 `TaskUpdate({status: "ready-for-review"})` + `SendMessage({to: "orchestrator", message: "<task> ready for review"})`
- 等待 review 反馈；REJECT 后修复重提；APPROVE 后等 git-operator commit

### Tier 2：reviewer / process

| 角色 | 触发 | 行为 |
|---|---|---|
| `code-reviewer` | orchestrator SendMessage 通知 PR ready | 读 git diff，调 `codex exec --profile code-reviewer`；输出 PASS / FAIL + 具体问题。**强制 [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) 8-point asymmetry-audit checklist**（每条可适用项目都要在 verdict 里给结论） |
| `pr-gate` | code-reviewer pass 后，orchestrator 判断高风险触发 | 调 `codex exec --profile pr-gate`（5.5）；输出 PASS / FAIL。**强制 [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) 8-point asymmetry-audit checklist + 8th-class hunt**（独立验证 R1 结论 + 主动 hunt cited-fix 之外的对称性缺口） |
| `pr-reviewer` | code-reviewer (+pr-gate if applicable) pass 后 | 读 spec / plan / diff；输出 APPROVE / REJECT + 跨文件影响分析 |
| `git-operator` | pr-reviewer APPROVE 后 | 执行 `git add` / `git commit` / `git push`；不修改代码内容 |
| `refactorer` | structure-auditor 标记或 manual 触发 | 唯一被授权跨包代码移动；每次产 ADR |
| `researcher` | 任意 teammate SendMessage 求助 | 调研 → 写到 `docs/research/<topic>-YYYY-MM-DD.md` → 报告 |

### Tier 3：audit

| 角色 | 触发 | 行为 |
|---|---|---|
| `structure-auditor` | 每月 / Wave close（如 Task Z）/ orchestrator 手动 | 全仓扫描 god-file / 契约漂移 / 孤儿包 → `docs/audits/structure-YYYY-MM.md` |
| `performance-auditor` | 每周 / 每 N PR / 部署后 | Lighthouse / size-limit / Astro analyze → `docs/audits/perf-YYYY-MM-DD.md` |
| `mdx-doctor` | PR 触碰 mdx-bridge 或 block-* 时 | 跑全部 RTT fixture；FAIL 阻断所有 block PR |
| `link-checker` | CI 每次 push（不在 team 内手动触发） | lychee 扫 markdown 短链 |

## review 链消息格式约定

**worker → orchestrator：完工通知**
```json
{ "to": "orchestrator", "summary": "<task> ready", "message": "Track <X> implementation done. Files: ... Tests: pass. CONTRACT.md updated. Ready for review." }
```

**orchestrator → code-reviewer：派 review**
```json
{ "to": "code-reviewer", "summary": "review track <X>", "message": "Please review PR for Track <X> (commits <hash..hash>). High-risk triggers: <list> (escalate to pr-gate after PASS)." }
```

**reviewer → orchestrator：review 结果**
```json
{ "to": "orchestrator", "summary": "track <X> code-review PASS",
  "message": "PASS. Notes: <optional concerns>. (Or FAIL with specific issue list.)" }
```

**orchestrator → git-operator：放行 commit**
```json
{ "to": "git-operator", "summary": "commit track <X>",
  "message": "All reviews PASS for Track <X>. Commit <branch>. Reviewers: code-reviewer (5.3), [pr-gate (5.5),] pr-reviewer." }
```

## 高风险 PR escalate 触发条件

orchestrator 在派 review 时如果检测到以下任一，**追加 pr-gate 5.5 review**：

- PR 修改任何 `*/CONTRACT.md`
- PR 新增或删除 package
- PR 触碰核心架构包：`kernel-adapter` · `mdx-bridge` · `agent-tools` · `editor-commands` · `block-foundation` · `design-tokens`
- PR 触发 ADR 创建（`docs/decisions/ADR-NNNN-*.md`）
- PR 修改 CI workflow / deploy / auth / security 路径

## Fast lane（豁免）

PR 同时满足：
- diff < 20 行
- 仅 .md / .toml / 配置文件
- 不动 CONTRACT.md / schema

orchestrator 可走 **fast lane**：仅 code-reviewer (5.3-spark) → git-operator commit；跳过 pr-reviewer (Claude)。

## shutdown 协议

Wave / Phase 完工时 orchestrator 会发：
```json
{ "to": "<your-name>", "message": { "type": "shutdown_request", "reason": "<wave> complete" } }
```

你回复：
```json
{ "to": "orchestrator", "message": { "type": "shutdown_response", "request_id": "<echoed>", "approve": true } }
```

approve 后你的进程会被终止；不要主动发 `shutdown_request`（除非你被指定为 team-lead 且确认 wave 完工）。

## Codex CLI 调用规范（如果你的角色用 codex）

如果你是 `code-reviewer` / `pr-gate` / `plan-challenger` / `codex-*-eng` 之一，你通过 Bash 调 codex。**必须遵守**：

- **stdin 必须重定向**：`codex exec --profile <name> "<prompt>" < /dev/null` —— 否则 codex 在 team 环境下可能等待非交互输入卡住（Phase 0 实测发现）
- **profile 已配 `approval_policy = "never"`**：非交互运行，不要试图绕过
- **stdout / stderr 分流**：codex 把进度走 stderr，最终输出走 stdout；review 类 agent 只用 stdout 作为最终结论
- **超时控制**：long-running 任务用 `timeout` 包，例如 `timeout 600 codex exec --profile code-reviewer ... < /dev/null`
- **失败回退**：如果 codex 三次重试仍失败，向 orchestrator 报告，让其决定降级到 Claude（按 ADR-0001 降级策略）

## 失败模式与上报

如果你遇到以下任一，**不要硬撑**，立即 SendMessage 给 orchestrator 描述：

- 任务超出你的角色权限（例如 worker 想跨包修改）→ 请求 dispatch refactorer
- 需要外网调研（你没有 WebFetch / WebSearch 权限）→ 请求 dispatch researcher
- 测试无法通过且原因可疑（疑似 spec / plan 错误）→ 让 orchestrator 决定 errata 还是修代码
- Codex CLI 调用失败（profile 错 / sandbox 拒绝 / API 超时）→ 让 orchestrator 决定降级到 Claude

## 黄金法则

1. **写下来才算数**：所有协作信号经 TaskUpdate 或 SendMessage；纯文本输出对队友不可见
2. **不主动跨界**：worker 不 commit；reviewer 不修代码；git-operator 不 review
3. **完工 = 测试 PASS + 文档同步 + TaskUpdate completed**：缺一不算
4. **耐心面对 idle**：队友 idle 是常态，不是停机；只在你确实需要它工作时唤醒
5. **从 plan / spec / agent-contract 找权威，不臆测**

## Related

- [ADR-0004 团队 dispatch 决策](../decisions/ADR-0004-agent-team-dispatch-model.md)
- [设计规格 §3.1 / §3.2](../superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-contract.md](../../agent-contract.md)
- [Phase 1 Wave 1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md)
