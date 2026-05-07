# Team Operations Runbook

> ⚠️ **POST-ADR-0011 PARTIALLY STALE — full rewrite pending.**
>
> ADR-0011 (accepted 2026-05-01) introduces a **linear-pipeline execution model**
> (PR 串行 + codex 5.5 双角色 + pr-writer subagent + Tier 1 worker 全退役 +
> Tier 3 audit 全 codex 化). Many references in this runbook to specific Tier 1
> workers (`block-foundation-eng` / `simple-block-eng` / `editor-eng` / etc.),
> Tier 2 process roles (`git-operator` / `pr-reviewer` as standalone teammates),
> and Tier 3 audits (`structure-auditor` / `performance-auditor` / `mdx-doctor`
> as Claude teammates) are **historical**. Wave 3+ replaces them per ADR-0011
> D-list. Read [ADR-0011 D1-D8](../decisions/ADR-0011-linear-pipeline-execution-model.md)
> first; treat the per-section tables in this runbook as Wave 1+2 reference until
> a follow-up PR rewrites them.
>
> Active references that survive ADR-0011:
> - 4 Claude subagents one-shot dispatch protocol (pr-writer NEW / ux-ui-lead /
>   refactorer / researcher) — per ADR-0011 D7
> - 11 codex tool_patterns — see
>   [docs/runbooks/codex-tool-invocations.md](codex-tool-invocations.md) (auto-regenerated)
> - ADR-0006 D8 explicit-file-list staging (still mandatory for all commits)
> - ADR-0006 9-point asymmetry-audit checklist (still applies in D1 stage 3; v0.2 amendment 2026-05-XX added item 9 UI-touch + E2E spec audit per ADR-0011 D9)

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

| 模式                       | 工作流                                                                                                    | 适合场景                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **self-managed**           | workers 自动从 TaskList 找 unblocked task 并 `TaskUpdate(owner=self)` 自我分配；orchestrator 只做战略指引 | 任务相互独立 / 无 review-gate 依赖 / 资源充裕可并发        |
| **orchestrator-managed** ★ | workers 等 orchestrator `SendMessage` 显式分配；TaskList 是状态板而非工单池                               | 跨 track review-gate 依赖 / 高风险 PR 需 escalate / 配额紧 |

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

> **ADR-0007 D5 注**：`code-reviewer` / `pr-gate` / `plan-challenger` 在本 ADR 实施 PR 完工后**降级为 tool patterns**（orchestrator 直接 Bash 调 `codex exec --yolo --profile X < /dev/null`，with `set -o pipefail` + `/tmp/codex-runs/` raw + `docs/audits/codex-runs/` truncated archive — see [`docs/runbooks/codex-tool-invocations.md`](codex-tool-invocations.md) "Universal Bash invariants" for the canonical Wave 4+ flow），不再以 teammate 形式 spawn。canonical bash + 触发条件 + audit 落盘见 [`docs/runbooks/codex-tool-invocations.md`](codex-tool-invocations.md)。本表保留它们为操作语义参考（行为不变；只是 invocation pattern 从 SendMessage→teammate 变为 Bash→tool）。
>
> **Claude `pr-reviewer` 改为选择性触发**（ADR-0007 D2 8 条触发列表）；普通 PR 由 orchestrator 扫 codex 5.3-spark 输出 + diff 自检，不再每 PR 都调 Claude pr-reviewer。

| 角色                                    | 触发                                                                 | 行为                                                                                                                                                                                                                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `code-reviewer` (tool)                  | orchestrator 触发，PR ready                                          | 读 git diff；orchestrator Bash 调 `codex exec --yolo --profile code-reviewer < /dev/null`；输出 PASS / FAIL + 具体问题；stdout 走 `/tmp/codex-runs/` + `head -2000` 截断到 `docs/audits/codex-runs/`（per Wave 4+ R7 mitigation；详见 [`codex-tool-invocations.md`](codex-tool-invocations.md) Universal Bash invariants）。**强制 [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) 9-point asymmetry-audit checklist (v0.2)**（每条可适用项目都要在 verdict 里给结论；UI-touch PR 9th-item 必跑 `pnpm --filter @skb/site test:visual` PASS） |
| `codex-pr-reviewer-55` (tool; Wave 3+ unified reviewer per ADR-0011 D6 — supersedes Wave 1+2 `code-reviewer` 5.3-spark + `pr-gate` 5.5 split) | D1 stage 3 default; orchestrator triggers when executor reports ready, plus heightened-scrutiny D2 rows 1/2/4/8 | orchestrator Bash 调 `codex exec --yolo --profile codex-pr-reviewer-55 < /dev/null`（5.5；with `set -o pipefail` + Wave 4+ /tmp piping per [`codex-tool-invocations.md`](codex-tool-invocations.md)）；输出 PASS / FAIL + line-anchored findings。**强制 [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) 9-point asymmetry-audit checklist (v0.2 + v0.2.1 cross-ref) + 9th-class hunt**（独立验证 R1 结论 + 主动 hunt cited-fix 之外的对称性缺口；UI-touch PR 9th-item e2e PASS log 必含）                              |
| `pr-reviewer` (Claude teammate, 选择性) | code-reviewer (+pr-gate if applicable) pass + ADR-0007 D2 触发命中   | 读 spec / plan / diff；输出 APPROVE / REJECT + 跨文件影响分析                                                                                                                                                                                                                                                |
| `git-operator`                          | pr-reviewer APPROVE 后（或常规 PR 中 orchestrator 自检 PASS 后）     | 执行 `git add` / `git commit` / `git push`；不修改代码内容                                                                                                                                                                                                                                                   |
| `refactorer`                            | structure-auditor 标记或 manual 触发                                 | 唯一被授权跨包代码移动；每次产 ADR                                                                                                                                                                                                                                                                           |
| `researcher`                            | 任意 teammate SendMessage 求助                                       | 调研 → 写到 `docs/research/<topic>-YYYY-MM-DD.md` → 报告                                                                                                                                                                                                                                                     |

### Tier 3：audit

| 角色                  | 触发                                              | 行为                                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `structure-auditor`   | 每月 / Wave close（如 Task Z）/ orchestrator 手动 | 全仓扫描 god-file / 契约漂移 / 孤儿包 → `docs/audits/structure-YYYY-MM.md` |
| `performance-auditor` | 每周 / 每 N PR / 部署后                           | Lighthouse / size-limit / Astro analyze → `docs/audits/perf-YYYY-MM-DD.md` |
| `mdx-doctor`          | PR 触碰 mdx-bridge 或 block-\* 时                 | 跑全部 RTT fixture；FAIL 阻断所有 block PR                                 |
| `link-checker`        | CI 每次 push（不在 team 内手动触发）              | lychee 扫 markdown 短链                                                    |

## review 链消息格式约定

**worker → orchestrator：完工通知**

```json
{
  "to": "orchestrator",
  "summary": "<task> ready",
  "message": "Track <X> implementation done. Files: ... Tests: pass. CONTRACT.md updated. Ready for review."
}
```

**orchestrator → code-reviewer：派 review**

```json
{
  "to": "code-reviewer",
  "summary": "review track <X>",
  "message": "Please review PR for Track <X> (commits <hash..hash>). High-risk triggers: <list> (escalate to pr-gate after PASS)."
}
```

**reviewer → orchestrator：review 结果**

```json
{
  "to": "orchestrator",
  "summary": "track <X> code-review PASS",
  "message": "PASS. Notes: <optional concerns>. (Or FAIL with specific issue list.)"
}
```

**orchestrator → git-operator：放行 commit**

```json
{
  "to": "git-operator",
  "summary": "commit track <X>",
  "message": "All reviews PASS for Track <X>. Commit <branch>. Reviewers: code-reviewer (5.3), [pr-gate (5.5),] pr-reviewer."
}
```

## 高风险 PR escalate 触发条件

orchestrator 在派 review 时按 [ADR-0007 D2](../decisions/ADR-0007-job-function-codex-heavy-execution.md) 表 8 行判断；**rows 1/2/4/8 → 追加 codex 5.5 pr-gate + Claude pr-reviewer**；**rows 3/5/6/7 → 仅追加 Claude pr-reviewer（不跑 pr-gate）**。

| Row | 触发条件 | pr-gate? | pr-reviewer? |
|---|---|---|---|
| 1 | 修改任何 `*/CONTRACT.md`（接口形状变化，非补充） | ✅ | ✅ |
| 2 | 新增 / 删除 package | ✅ | ✅ |
| 3 | 修改 spec / `agent-contract.md` / 任何 ADR | — | ✅ |
| 4 | 触发新 ADR 创建（`docs/decisions/ADR-NNNN-*.md`） | ✅ | ✅ |
| 5 | 删除 / 重命名 package | — | ✅ |
| 6 | 跨 ≥ 3 个 package 的 PR | — | ✅ |
| 7 | performance-auditor 标记的 PR | — | ✅ |
| 8 | 修改 CI workflow / deploy / auth / security | ✅ | ✅ |

4-vs-4 carve-out 理由（ADR-0007 D2）：rows 1/2/4/8 是**接口/包结构/CI 类**改动，5.5 深审高 ROI；rows 3/5/6/7 是**文档 / 删除重命名 / 单调跨包 / 已被 perf-auditor 标记**，Claude pr-reviewer 的 spec-match + 跨包影响视角足够，5.5 深审边际收益低。

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
{
  "to": "orchestrator",
  "message": { "type": "shutdown_response", "request_id": "<echoed>", "approve": true }
}
```

approve 后你的进程会被终止；不要主动发 `shutdown_request`（除非你被指定为 team-lead 且确认 wave 完工）。

## Codex CLI 调用规范（orchestrator 调用 tool patterns 时遵守）

**ADR-0007 D5 起**，原 `code-reviewer` / `pr-gate` / `plan-challenger` / `codex-*-eng` teammate 全部降级为 tool patterns —— 由 **orchestrator** 直接 Bash 调用，不再 spawn 为 teammate。orchestrator 调用时**必须遵守**：

- **stdin 必须重定向**：`codex exec --yolo --profile <name> "<prompt>" < /dev/null` —— 否则 codex 在 team 环境下可能等待非交互输入卡住（Phase 0 实测发现）
- **`--yolo` 是 Wave 4+ 强制**（gatekeeper 2026-05-02 directive）；resolves R9 sandbox EAI_AGAIN + R4 user-dotfile mechanical-fix friction at flag level
- **`set -o pipefail` 必启用**（per Wave 4+ Universal Bash invariants）—— `tee` 的 exit 0 会 mask codex 失败否则；equivalent: `${PIPESTATUS[0]}` after the pipeline
- **profile 已配 `approval_policy = "never"`**：非交互运行，不要试图绕过
- **stdout / stderr 分流**：codex 把进度走 stderr，最终输出走 stdout；review 类 agent 只用 stdout 作为最终结论
- **超时控制**：long-running 任务用 `timeout` 包，例如 `timeout 600 codex exec --yolo --profile codex-pr-reviewer-55 ... < /dev/null`
- **audit log piping (R7 mitigation)**：raw stdout `2>&1 | tee /tmp/codex-runs/<X>.txt` 然后 `head -2000` 截断到 `docs/audits/codex-runs/<X>.txt` 归档；不要直接 tee 进 workspace tree（codex sandbox 会 self-recursion patch）
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
- [ADR-0007 职能化分工 + Codex-heavy 执行 + teammate/tool 切分](../decisions/ADR-0007-job-function-codex-heavy-execution.md)
- [ADR-0006 cross-location asymmetry-audit checklist](../decisions/ADR-0006-asymmetry-audit-checklist.md)
- [docs/runbooks/codex-tool-invocations.md](codex-tool-invocations.md) — codex tool patterns canonical bash + 触发条件 + audit 落盘
- [设计规格 §3.1 / §3.2](../superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-contract.md](../../agent-contract.md)
- [Phase 1 Wave 1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md)
