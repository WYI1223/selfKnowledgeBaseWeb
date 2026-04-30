# Codex tool invocations runbook

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit `agent-contract.md` then run `pnpm generate:configs`.

ADR-0007 D5 demoted 8 codex agents from team-membered teammates (persistent
context) to **stateless Bash invocation patterns** triggered by the orchestrator.
This runbook is the canonical reference for how the orchestrator invokes each
pattern: the bash command, when to trigger it, and how the orchestrator should
handle stdout (parse + audit-log).

## Single-source-of-truth lineage

- Pattern definitions: [`agent-contract.md`](../../agent-contract.md) → `tool_patterns:` block
- Codex profile config: [`tmp/codex-profiles.toml`](../../tmp/codex-profiles.toml) (manual merge into `~/.codex/config.toml`)
- Architecture decision: [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) §D5
- Audit logs: `docs/audits/codex-runs/<date>-<task>-<pattern>.txt` (orchestrator must save every invocation's stdout)

## Universal Bash invariants

```bash
codex exec --profile <PROFILE> "<PROMPT>" < /dev/null > <AUDIT_LOG_PATH> 2>&1
```

- **`< /dev/null` is mandatory** in non-interactive contexts. Codex CLI under Claude Code Bash blocks reading a never-closed Unix socket on fd 0 if stdin is left open. (Phase 0 regression; see memory `feedback_codex_stdin`.)
- **`approval_policy = "never"`** is set per profile in TOML; do not pass interactive approval flags.
- **stderr captures progress**, **stdout captures the final structured verdict**. Orchestrator parses stdout only.
- **`timeout`-wrap long runs** (e.g. `timeout 600 codex exec --profile pr-gate ...`) to prevent hung invocations.
- **3-strike fallback**: if a pattern's invocation fails 3× consecutively, orchestrator MUST escalate (degrade to Claude per ADR-0001 fallback or surface to user).

## ADR-0006 D8 reminder

When invocation outputs become inputs to a commit (e.g. scaffolder writes new files), the
orchestrator MUST stage `pnpm-lock.yaml` along with package.json edits in the same bundle
(commit `e15ec36` extension to D8: lockfile is generated-from-authority artifact).


## `code-reviewer`

**Profile**: `code-reviewer`

**Canonical bash**:

```bash
codex exec --profile code-reviewer < /dev/null
```

**Triggered by**:

- `worker_marks_ready_for_review`

**Output handling**:

orchestrator 读 stdout 解析 PASS/FAIL + 问题清单；
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-code-review.txt（audit 兜底）。

**Description**:

行级 review：类型 / lint / 契约同步 / 文件大小 / 风格 / 边界条件。
gpt-5.3-codex-spark（廉价默认）。**绝不修改代码**。
高风险 PR 会自动 escalate 给 pr-gate（ADR-0007 D2 表）。

**强制：ADR-0006 8-point asymmetry-audit checklist**（见 `docs/decisions/ADR-0006-asymmetry-audit-checklist.md`）必须按可适用项目逐条审查，verdict 结构应包含
`asymmetry-audit applied: items {1..8} verdicts: ...`。8 项概要：
(1) 字段/属性新增 → 审 comparator/序列化；
(2) 状态码新增 → 审同 status 的所有 handler（RFC 7235 等强制头）；
(3) `.strict()` 加于一层 → 审所有嵌套 ZodObject；
(4) single-authority schema → 审所有 consumer 是否复刻定义；
(5) 算法 + 运行时常量复刻 → 审 consumer 端字节等价 + 注册回归测试；
(6) 一份 CONTRACT.md 改动 → 审 sister CONTRACT.md 是否同步；
(7) try/catch 范围 → narrow vs wide 在 happy-path 等价时仍可异常分流；
(8) authority 文档（ADR/agent-contract/runbook/CONVENTIONS）改动 → 审 generated/consumed surface（`.claude/agents/*`、`docs/review-checklist.md`、`team-operations.md`、`docs/runbooks/codex-tool-invocations.md`、Codex profiles、**pnpm-lock.yaml**）是否在同一 commit 里同步（commit `e15ec36` 教训：lockfile 也属 generated-from-authority artifact）。

## `plan-challenger`

**Profile**: `plan-challenger`

**Canonical bash**:

```bash
codex exec --profile plan-challenger < /dev/null
```

**Triggered by**:

- `orchestrator_publishes_plan`

**Output handling**:

orchestrator 读 stdout 拿建议清单（不阻塞）；
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-plan-challenge.txt。

**Description**:

lock 前挑战 orchestrator 的 wave / track plan：检查 task 大小、可测性、边界场景。
orchestrator 写完 wave / track plan 后，**lock 前**通过此 invocation 挑战：
1. 每个 task 是否 PR-sized（1-2 commit 内可完成）？
2. 是否可测试（验收标准明确）？
3. 是否缺边界条件 / 异常场景？
输出建议清单（不阻塞），orchestrator 决定吸收哪些。
ADR-0007 D5 注：原 Tier 2 codex teammate 降级为 tool；本质即一次性 dispatch
（ADR-0004 D7 早已如此），与 tool 模型一致。

## `pr-gate`

**Profile**: `pr-gate`

**Canonical bash**:

```bash
codex exec --profile pr-gate < /dev/null
```

**Triggered by**:

- `contract_change`
- `package_add_remove`
- `core_arch_touch`
- `adr_required`
- `ci_or_deploy_or_auth_or_security_touch`

**Output handling**:

orchestrator 读 stdout 解析 PASS/FAIL + 8th-class hunt 结果；
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-pr-gate.txt。

**Description**:

仅对**高风险 PR** 启用。深度审查：漏洞 / 隐性破坏 / 跨包影响。
gpt-5.5（贵但严谨）。**绝不修改代码**。
触发条件由 orchestrator 在 review 阶段判断（spec §3.2 + ADR-0007 D2 表 8 行）。

**强制：ADR-0006 8-point asymmetry-audit checklist**（见 `docs/decisions/ADR-0006-asymmetry-audit-checklist.md`）— 你是这项规则的主要执行者，必须独立验证所有可适用项目（不仅依赖 code-reviewer 的 R1 结论），并主动 hunt 8th-class beyond the cited fix。verdict 结构应包含
`asymmetry-audit applied: items {1..8} verdicts: ...` 与（如适用）`8th-class hunt: <findings>`。8 项即 code-reviewer profile 中的 8 项；本 profile 在所有项上都比 code-reviewer 更严苛。

## `codex-api-crud-builder`

**Profile**: `scaffolder`

**Canonical bash**:

```bash
codex exec --profile scaffolder < /dev/null
```

**Triggered by**:

- `new_resource_endpoint_requested`

**Output handling**:

orchestrator 读 stdout 拿创建路由清单；
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-api-crud.txt。

**Description**:

在 apps/api 按 RESTful 风格生成 CRUD 端点骨架（Pydantic schema + 路由），
与 api-builder 协作。复杂业务逻辑由 api-builder 写。

## `codex-block-generator`

**Profile**: `scaffolder`

**Canonical bash**:

```bash
codex exec --profile scaffolder < /dev/null
```

**Triggered by**:

- `simple_block_template_committed`
- `editor_submodule_template_committed`
- `ui_default_template_committed`

**Output handling**:

orchestrator 读 stdout 拿创建文件清单 + git diff；
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-block-clone.txt（ADR-0007 §208 audit-trail 兜底）。

**Description**:

在 simple-block-eng / ux-ui-lead / editor-eng 提交 template 后，按模板仿造其余 block / submodule。
ADR-0007 D3 试点：ui-default 8 个由 ux-ui-lead 写 1 个 + 本 tool clone 7 个；
core 试点限定 simple block (callout template + code/image clone)；
render+viz core 不试点（hand-craft）。
editor 子模块同 mode：editor-eng 写 toolbar template + 本 tool clone slash-menu/drag-handle。
不允许偏离模板结构；如发现模板有问题，停止并交给原 template 工种修模板再继续。

## `codex-css-stylist`

**Profile**: `scaffolder`

**Canonical bash**:

```bash
codex exec --profile scaffolder < /dev/null
```

**Triggered by**:

- `design_token_requested`
- `tailwind_class_combo_requested`

**Output handling**:

orchestrator 读 stdout 拿创建文件清单；
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-css.txt。

**Description**:

写 packages/design-tokens / packages/ui 的 design tokens（颜色 / 间距 / 字体）+
各 component 的 Tailwind 类组合。Phase 2b 设计 skill 流水线启动后，
本 pattern 归入 ux-ui-lead 调度（lead 写 + 本 tool clone）。

## `codex-script-builder`

**Profile**: `scaffolder`

**Canonical bash**:

```bash
codex exec --profile scaffolder < /dev/null
```

**Triggered by**:

- `new_cli_tool_requested`

**Output handling**:

orchestrator 读 stdout 拿创建文件清单 + 验证 --help 输出；
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-script.txt。

**Description**:

写 scripts/refactor-move.ts / scripts/new-block.ts / scripts/extract-pdf-text.ts 等工具。
要求 CLI 风格、有 --help、有错误处理、用 commander 或 yargs。

## `codex-test-scaffolder`

**Profile**: `scaffolder`

**Canonical bash**:

```bash
codex exec --profile scaffolder < /dev/null
```

**Triggered by**:

- `new_package_added`
- `vitest_skeleton_requested`

**Output handling**:

orchestrator 读 stdout 拿创建文件清单；
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-test-scaffold.txt。

**Description**:

为每个 packages/<name> 生成 src/__tests__/ 下的 vitest 套件骨架，
含一个示例 it() + setup helpers。具体测试由各包工种 agent 填。

## Related

- [`agent-contract.md`](../../agent-contract.md) — `tool_patterns:` source of truth
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) — D5 demotion rationale
- [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) — 8-point asymmetry audit (mandatory for code-reviewer + pr-gate profiles)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md) §3.1 / §3.2 — review chain baseline
- [`docs/runbooks/team-operations.md`](team-operations.md) — broader team protocol context

## Footer

This file is GENERATED FROM `agent-contract.md`. Edits will be overwritten on the next
`pnpm generate:configs` run.
