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


## `codex-pr-reviewer-55`

**Profile**: `codex-pr-reviewer-55`

**Canonical bash**:

```bash
codex exec --profile codex-pr-reviewer-55 < /dev/null
```

**Triggered by**:

- `executor_marks_ready_for_review`
- `high_risk_d2_row_1_contract_change`
- `high_risk_d2_row_2_package_add_remove`
- `high_risk_d2_row_4_adr_required`
- `high_risk_d2_row_8_ci_or_deploy_or_auth_or_security_touch`

**Output handling**:

orchestrator 读 stdout 解析 PASS/FAIL + 问题清单 + 8th-class hunt 结果；
stdout 落盘到 .codex-runs/<wave>/PR-<n>-pr-reviewer.txt 或
docs/audits/codex-runs/<date>-<task>-pr-reviewer-55.txt。

**Description**:

ADR-0011 D1 stage 3 默认 reviewer。replaces Wave 1+2 的 pr-gate（5.5）+
code-reviewer（5.3-spark）双层链路。gpt-5.5（贵但严谨）。**绝不修改代码**。

执行内容：
- 行级 review（类型 / lint / 契约同步 / 文件大小 / 风格 / 边界条件）
- 漏洞扫（injection / XSS / SSRF / 反序列化 sink / secret leak）
- 跨包影响（block-foundation / mdx-bridge / kernel-adapter consumer 影响）
- 供应链（新 dep maintenance / license / transitive risk）
- lockfile 完整性（pnpm-lock.yaml 与 package.json diff 一致）
- PR.md `acceptance:` 块条目逐条对照 diff 验证（spec match）

**强制：ADR-0006 8-point asymmetry-audit checklist**（见 `docs/decisions/ADR-0006-asymmetry-audit-checklist.md`）必须按可适用项目逐条审查；每条 verdict 给结论。8 项概要：
(1) 字段/属性新增 → 审 comparator/序列化；
(2) 状态码新增 → 审同 status 的所有 handler（RFC 7235 等强制头）；
(3) `.strict()` 加于一层 → 审所有嵌套 ZodObject；
(4) single-authority schema → 审所有 consumer 是否复刻定义；
(5) 算法 + 运行时常量复刻 → 审 consumer 端字节等价 + 注册回归测试；
(6) 一份 CONTRACT.md 改动 → 审 sister CONTRACT.md 是否同步；
(7) try/catch 范围 → narrow vs wide 在 happy-path 等价时仍可异常分流；
(8) authority 文档（ADR/agent-contract/runbook/CONVENTIONS）改动 → 审
   generated/consumed surface（`.claude/agents/*`、`docs/review-checklist.md`、
   `team-operations.md`、`docs/runbooks/codex-tool-invocations.md`、
   Codex profiles、**pnpm-lock.yaml**）是否在同一 commit 里同步
   （commit `e15ec36` 教训：lockfile 也属 generated-from-authority artifact）。

verdict 结构应包含
`asymmetry-audit applied: items {1..8} verdicts: ...` 与（如适用）
`8th-class hunt: <findings>`。

**D1 stage 5 commit 兼任**：PASS verdict 后由本 profile 在同一 invocation 内
执行 commit + push（per ADR-0006 D8 explicit-file-list staging：`git reset HEAD`
→ `git add <PR.md files: list>` → `git diff --cached --stat` 验证 → `git commit`
→ `git push`）。orchestrator 不另起 git-operator subagent。

## `codex-generic-executor`

**Profile**: `generic-executor`

**Canonical bash**:

```bash
codex exec --profile generic-executor < /dev/null
```

**Triggered by**:

- `pr_plan_locked_executor_field_set_to_generic_executor`

**Output handling**:

orchestrator 读 stdout 拿创建/修改文件清单 + vitest 自跑结果；
stdout 落盘到 .codex-runs/<wave>/PR-<n>-execute.txt 或
docs/audits/codex-runs/<date>-<task>-execute.txt。

**Description**:

ADR-0011 D6 NEW Wave 3 默认 executor。gpt-5.5 + workspace-write sandbox。

D1 stage 2 标准流程：
1. 读 PR.md（locked at stage 1）：files / test_cases / contracts_affected /
   adr_touched / acceptance
2. **TDD 前置**：先按 test_cases 字段写 vitest 测试（input/expected/location
   三元组逐一落到 src/__tests__/）
3. 实现代码满足测试（限制在 PR.md `files:` 白名单内；超出 = scope creep）
4. 自跑 `pnpm test --filter=<package>` 全部 PASS（不 PASS 不进 stage 3）
5. 自跑 `pnpm lint --filter=<package>` + `pnpm typecheck --filter=<package>`
   clean（per WE-007）
6. 写 commit-ready summary 报 orchestrator；orchestrator dispatch
   codex-pr-reviewer-55 进 stage 3

你**不**调用其他 codex tool；不 git mutate（commit 由 reviewer 兼任，per D1
stage 5）。如发现 PR.md 写错 / 缺信息，停止并 SendMessage orchestrator 修订。

## `codex-mdx-doctor`

**Profile**: `mdx-doctor`

**Canonical bash**:

```bash
codex exec --profile mdx-doctor < /dev/null
```

**Triggered by**:

- `pr_touches_mdx_bridge`
- `pr_touches_block_package`
- `wave_close`

**Output handling**:

orchestrator 读 stdout 拿 RTT fixture PASS/FAIL 清单；
FAIL 阻断进入 D1 stage 5 commit；stdout 落盘到 .codex-runs/<wave>/PR-<n>-mdx-doctor.txt。

**Description**:

ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3
mdx-doctor Claude teammate 全 codex 化。

执行内容：
- 跑全部 RTT (round-trip test) fixture：mdxToTiptap → tiptapToMdx 字节等价
- 跑 stripMdast 路径下的同等价（编辑器构建 doc 不依赖 _mdast 字段）
- 任一 fail 阻断所有 mdx-bridge / block-* PR 进 stage 5
- Wave 3 起补足 8 component-block fixture (callout/code/image/math/pdf/jupyter/
  nn-viz/agent-flow) × 2 invariants × 1 fixture per block

## `codex-perf-auditor`

**Profile**: `perf-auditor`

**Canonical bash**:

```bash
codex exec --profile perf-auditor < /dev/null
```

**Triggered by**:

- `bundle_affecting_pr`
- `wave_close`
- `manual_dispatch`

**Output handling**:

orchestrator 读 stdout 拿 perf baseline + 回归点清单；
stdout 落盘到 docs/audits/perf-YYYY-MM-DD.md（Wave-close）或
.codex-runs/<wave>/PR-<n>-perf-audit.txt（per-PR）。

**Description**:

ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3
performance-auditor Claude teammate 全 codex 化。

执行内容：
- Lighthouse CI 跑 apps/site
- size-limit / Astro --analyze（heavy block 包重点关注：block-jupyter Pyodide
  ~10MB / block-nn-viz TF.js ~3MB / block-agent-flow React Flow ~500KB）
- Playwright traces（关键交互延迟 / FCP / LCP / TTI）
- 若 baseline 比上次差 > 20%，开 issue 阻断新功能直到修复

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
stdout 落盘到 .codex-runs/<wave>-plan-challenge.txt 或
docs/audits/codex-runs/<date>-<task>-plan-challenge.txt。

**Description**:

lock 前挑战 orchestrator 的 wave / track / PR plan：检查 task 大小、可测性、边界场景。
orchestrator 写完 plan 后，**lock 前**通过此 invocation 挑战：
1. 每个 PR 是否 ≤ 200 LOC + ≤ 1 narrow responsibility（ADR-0011 D2）？
2. 是否可测试（test_cases 字段非空且 input/expected/location 三元组完整）？
3. 是否缺边界条件 / 异常场景？
4. 高风险触发判定是否准确（D2 row 1+4 应否触发 D1 stage 4）？
输出建议清单（不阻塞），orchestrator 决定吸收哪些。
ADR-0011 D-list 起此 tool 还用于 PR-level plan-draft（不仅 wave-level）。

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

在 apps/api 按 RESTful 风格生成 CRUD 端点骨架（Pydantic schema + 路由）。
复杂业务逻辑由 orchestrator 协调 codex-generic-executor 实现。

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
stdout 落盘到 docs/audits/codex-runs/<date>-<task>-block-clone.txt。

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
本 pattern 归入 ux-ui-lead（subagent）调度（lead 写 + 本 tool clone）。

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
WE-007 强制：codex-script-builder 输出后 orchestrator 必跑 pnpm lint 独立验证（spark PASS != lint clean）。

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

## `codex-structure-auditor`

**Profile**: `structure-auditor`

**Canonical bash**:

```bash
codex exec --profile structure-auditor < /dev/null
```

**Triggered by**:

- `per_pr_post_commit`
- `wave_close`
- `manual_dispatch`

**Output handling**:

orchestrator 读 stdout 拿 god-file / 契约漂移 / 孤儿包 / D1 dead-dep 清单；
Wave-close 时输出落盘到 docs/audits/structure-YYYY-MM.md（月度 / Wave-close）。
Per-PR 速查落盘到 .codex-runs/<wave>/PR-<n>-structure-audit.txt。

**Description**:

ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3
structure-auditor Claude teammate 全 codex 化。

执行内容：
- 候选 god-file（接近或超过 500 行；ESLint 300 warn）
- 契约漂移（CONTRACT.md 与实际接口不一致）
- 孤儿包（无 importers + 无 documented 消费路径）
- **ADR-0008 D1 dead-dep mechanical scan**：每个 packages/*/package.json
  中的 `@skb/*` 工作区依赖必对应至少一个 `from '@skb/<pkg>'` 源码 import
- **ADR-0011 D8 监控指标**：长期 Claude session 数 ≤ 1；clone 模板 byte-equiv
  审计

候选重构由 refactorer Claude subagent 接手（per D7 触发条件
`codex_structure_auditor_flags`）。

## Related

- [`agent-contract.md`](../../agent-contract.md) — `tool_patterns:` source of truth
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) — D5 demotion rationale
- [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) — 8-point asymmetry audit (mandatory for code-reviewer + pr-gate profiles)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md) §3.1 / §3.2 — review chain baseline
- [`docs/runbooks/team-operations.md`](team-operations.md) — broader team protocol context

## Footer

This file is GENERATED FROM `agent-contract.md`. Edits will be overwritten on the next
`pnpm generate:configs` run.
