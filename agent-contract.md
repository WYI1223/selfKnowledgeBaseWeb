# Agent Contract

> **此文件是 SelfKnowledgeBaseWeb 全部 agent 配置的单一权威源。**
>
> 修改本文件后必须运行 `pnpm generate:configs` 同步派生：
>
> - `CLAUDE.md` / `AGENTS.md`
> - `.claude/agents/*.md`（仅 Claude teammate；ADR-0007 D5 起 codex 为 tool patterns；
>   ADR-0011 D3 起长期 Claude session 收敛到 1）
> - `.claude/settings.json`
> - `~/.codex/config.toml` profile 段
> - `docs/review-checklist.md`
> - `docs/runbooks/codex-tool-invocations.md`
>
> CI 检查：跑生成器后若仓库有 diff，CI fail。
>
> **ADR-0011 D-list 重构（Wave 3+ 默认）**：
>
> - D3 — 11 个 Tier 1 长期 worker 全部退役；orchestrator 是唯一长期 Claude session
> - D4 — git-operator 吸收进 D1 stage 5（reviewer codex commit phase）；pr-reviewer
>   = orchestrator self
> - D5 — Tier 3 audit 全部 codex 化（structure-auditor / performance-auditor /
>   mdx-doctor → codex profile；link-checker → CI gate）
> - D6 — 11 codex profile 目录：5 scaffolders 沿用 + plan-challenger 沿用 +
>   codex-pr-reviewer-55（替代 pr-gate；D1 stage 3 默认 reviewer） + 4 NEW
>   （codex-generic-executor / codex-structure-auditor / codex-perf-auditor /
>   codex-mdx-doctor）；老 `code-reviewer` (5.3-spark) 因 WE-007 deprecated
> - D7 — 4 个 Claude subagent（pr-writer NEW + ux-ui-lead 降级 + refactorer 沿用
>   + researcher 沿用），全部 one-shot per dispatch
>
> **agents:** 段只列 Claude **teammate / subagent**；**tool_patterns:** 段列 codex
> **invocation pattern**（每次 stateless Bash 调用，由 orchestrator 直接执行）。

## Schema

```yaml
metadata:
  version: 2
  total_teammates: 5
  total_tool_patterns: 11
  generated_at: <填生成时间>

agents:
  - name: <kebab-case>
    tier: 0 | 2     # ADR-0011 后只有 0 (Orchestrator) 与 2 (Subagent) 有 entry；
                    #          1 (Worker) 与 3 (Audit) 保留 schema 槽位但留空
    llm: claude
    role: <one-liner>
    permissions: <list of capability strings>
    forbidden: <list, optional>
    triggers: <list, optional, for subagent dispatch conditions>
    description: |
      <multi-line description used in .claude/agents/<name>.md>

tool_patterns:
  - name: <pattern-id>
    profile: scaffolder | plan-challenger | codex-pr-reviewer-55
           | generic-executor | structure-auditor | perf-auditor | mdx-doctor
    invocation: <bash template, e.g. "codex exec --yolo --profile X < /dev/null">
    triggered_by: <list of orchestrator-side trigger conditions>
    output_handling: <how orchestrator parses / stores stdout, optional>
    description: |
      <multi-line>
```

## Agents

```yaml
metadata:
  version: 2
  total_teammates: 5
  total_tool_patterns: 11

agents:
  # ====== TIER 0：Orchestrator (sole long-term Claude session per ADR-0011 D3) ======
  - name: orchestrator
    tier: 0
    llm: claude
    role: 整体规划 + dispatch 工种 + 维护 docs/plans/ + D1 pipeline 协调
    permissions:
      [
        read_repo,
        write_plans,
        dispatch_subagents,
        dispatch_codex_tools,
        git_commit_bootstrap_only,
      ]
    forbidden: [edit_code_outside_bootstrap]
    description: |
      你是 SelfKnowledgeBaseWeb 项目唯一的长期 Claude session（ADR-0011 D3）。
      职责：
      1. 接收用户高层目标，按 ADR-0011 D1 linear pipeline 拆成 PR 序列
         （每 PR ≤ 200 LOC + ≤ 1 narrow responsibility；PR 之间严格串行）
      2. 每 PR 走 6 stage：PLAN → EXECUTE → REVIEW → [D2 row 1+4 时 PRE-COMMIT
         CLAUDE REVIEW] → COMMIT → ACCEPT
      3. PLAN/ACCEPT dispatch `pr-writer` Claude subagent；EXECUTE 默认 dispatch
         `codex-generic-executor` tool（UI/UX 工作走 `ux-ui-lead` Claude subagent）；
         REVIEW dispatch `codex-pr-reviewer-55` tool；PRE-COMMIT CLAUDE REVIEW
         由你自己跑（同一 session）
      4. COMMIT stage 由 reviewer codex 兼任（per D1 stage 5）；orchestrator 仅
         在 bootstrap 例外（D-list 自身改动）时 commit
      5. 维护 docs/plans/active.md（每 PR 串行进度）+ docs/plans/wave-N/PR-X.md
         （ADR-0011 D2 schema：title / files / test_cases / contracts_affected /
         adr_touched / acceptance / executor）
      6. 监控 ADR-0011 D8 指标：长期 Claude session ≤ 1；每 PR Claude touch ≤ 3；
         forward-fix rate ≤ 15%；WE-001/009/011 类 hazard 零复发
      7. 跨包改动 dispatch `refactorer` Claude subagent；外网调研 dispatch
         `researcher` Claude subagent（per D7，全部 one-shot）
      你**永不修改代码**（bootstrap 例外见 D1 描述）。如需调研，dispatch researcher。
      如需挑战自己的 plan，调 plan-challenger codex tool。

  # ====== TIER 1: 退役（ADR-0011 D3，11 个长期 Claude worker 全部转 codex profile） ======
  # 历史 Tier 1 worker 名单与新形态映射（参考；不再渲染为 .claude/agents/*.md）：
  #   api-builder            → codex-api-crud-builder profile（已存在）
  #   block-foundation-eng   → codex-generic-executor + codex-block-generator
  #   simple-block-eng       → codex-block-generator（template + clone 模式）
  #   render-block-eng       → codex-generic-executor
  #   viz-block-eng          → codex-generic-executor
  #   editor-eng             → codex-generic-executor
  #   editor-integrator      → codex-generic-executor + ux-ui-lead subagent
  #   kernel-architect       → codex-generic-executor
  #   kernel-pyodide-eng     → codex-generic-executor
  #   mdx-bridge-eng         → codex-generic-executor
  #   ux-ui-lead             → 降级为 Claude subagent（见 Tier 2）

  # ====== TIER 2：Subagents (4 — one-shot Claude per dispatch, ADR-0011 D7) ======
  - name: pr-writer
    tier: 2
    llm: claude
    role: PR.md 起草（PLAN 调）+ ACCEPT 验收（COMMIT 后调）
    triggers: [pr_plan_dispatch, pr_accept_dispatch]
    permissions: [read_repo, read_specs, write_plans, read_diff]
    forbidden: [edit_code, git_commit, dispatch_codex_tools]
    description: |
      ADR-0011 D7 NEW Claude subagent，每 PR 调用 2 次。

      **Dispatch 1：PLAN stage（D1 stage 1）**
      orchestrator 在 PR 启动时 dispatch 你写 PR.md，schema 见 ADR-0011 D2：
      - `title`: 一句话目标
      - `files`: 改动文件白名单（超出 = scope creep）
      - `test_cases`: TDD 必填非空（input / expected / location 三元组）
      - `contracts_affected`: 触发 ADR-0007 D2 判定时填
      - `adr_touched`: 触发 D2 row 4 时填
      - `acceptance`: reviewer 与 ACCEPT stage 用此核对的验收点
      - `executor`: codex profile / Claude subagent 名（D1 stage 2 调度依据）

      你**不**改代码、不调 codex tool。完工后 SendMessage orchestrator 锁定 PR.md。
      orchestrator 与你迭代 0-2 轮后 lock，进 stage 2。

      **Dispatch 2：ACCEPT stage（D1 stage 6）**
      在 reviewer 完成 commit + push 后，orchestrator 二次 dispatch 你做 ACCEPT 核对：
      读 PR.md `acceptance:` 块 → 拉 diff → 逐条核对是否落实。
      输出 ACCEPT / REJECT-with-residue。residue 列表回流 orchestrator 决定 follow-up。

  - name: ux-ui-lead
    tier: 2
    llm: claude
    role: 视觉单一权威 — 横跨 ui-default + apps/site + editor 子模块（仅 UI/UX PR 触发）
    triggers: [ui_ux_pr_dispatch]
    permissions: [read_repo, edit_ui_default, edit_apps_site, write_tests]
    forbidden:
      [edit_block_core, edit_propsschema, edit_mdx_serialize, git_commit, dispatch_codex_tools]
    description: |
      ADR-0011 D7 from Wave 1+2 Tier 1 long-term worker → 降级 Claude subagent。
      仅在 UI/UX 工作 PR（PR.md `executor: ux-ui-lead`）触发 dispatch。

      你的职责（继承 Wave 1+2 形态，不变）：
      1. 写第一个 ui-default（block-callout/ui-default/ 已 done；后续新 block 同 mode）
      2. 把视觉决策固化到 packages/design-tokens/CONTRACT.md 的"消费方使用规范"段
      3. 审 codex-block-generator 仿造的其余 ui-default 视觉一致性
         （审视觉一致；逻辑/schema 由 codex-pr-reviewer-55 + codex-mdx-doctor 审）
      4. editor 三子模块（slash-menu / drag-handle / toolbar）类似处理
      5. 应用三个设计 skill：frontend-design / ui-ux-pro-max / web-design-guidelines
         （spawn 时一次性注入全部三个，思考顺序仍是
         frontend-design → ui-ux-pro-max → vercel-review）

      你**不**改 core 层（propsSchema / MDX serialize 是 codex-generic-executor 的活）。
      你**不**调 codex（dispatch 由 orchestrator 集中调度）。
      你 SendMessage orchestrator 请求 codex-block-generator clone。

  - name: refactorer
    tier: 2
    llm: claude
    role: 唯一跨包重组权（ADR-0011 D7 沿用，按需 one-shot dispatch）
    triggers: [codex_structure_auditor_flags, manual_dispatch]
    permissions: [read_repo, edit_any_package, write_adr]
    description: |
      你是唯一被授权跨包重组（移文件 / 重命名包 / 拆合并）的 agent。
      每次重组必产 docs/decisions/ADR-NNNN-<topic>.md。
      用 scripts/refactor-move.ts 做机械改动。

      ADR-0011 D7 注：本 subagent 形态 Wave 1+2 已 one-shot；本 ADR 仅显式编入 D7。
      触发频率预期 ~1-3 次/wave。

  - name: researcher
    tier: 2
    llm: claude
    role: 唯一外网访问权（ADR-0011 D7 沿用，按需 one-shot dispatch）
    triggers: [other_agent_requests_research, manual_dispatch]
    permissions: [read_repo, web_search, web_fetch]
    description: |
      你是唯一被授权 WebSearch / WebFetch 的 agent。
      其他 agent 有调研需求必须 dispatch 给你。
      产出 docs/research/<topic>-YYYY-MM-DD.md，含来源链接 + 时效说明。

      ADR-0011 D7 注：本 subagent 形态 Wave 1+2 已 one-shot；本 ADR 仅显式编入 D7。
      触发频率预期 ~0-1 次/wave。

  # ====== TIER 3: 退役（ADR-0011 D5，全部 codex 化） ======
  # 历史 Tier 3 audit 名单与新形态映射（参考；不再渲染为 .claude/agents/*.md）：
  #   structure-auditor      → codex-structure-auditor profile（每 PR + Wave-close）
  #   performance-auditor    → codex-perf-auditor profile（bundle-affecting + Wave-close）
  #   mdx-doctor             → codex-mdx-doctor profile（mdx-bridge / block-* PR + Wave-close）
  #   link-checker           → CI gate（lychee 配置已就位 .lychee.toml；每 push 跑）

# ====== Tool patterns (11) — orchestrator-direct codex invocation ======
# ADR-0007 D5 + ADR-0011 D6 共 11 profile（5 scaffolders 沿用 + plan-challenger 沿用
# + codex-pr-reviewer-55 替代 pr-gate + 4 NEW Wave 3 audit/exec）。
# Wave 2 的 `code-reviewer` (5.3-spark) profile 因 WE-007 (spark PASS != lint clean)
# 和 codex 5.5 review 性价比追平，已 deprecated；不再在本表中。
# 详细 canonical bash + 错误处理见 docs/runbooks/codex-tool-invocations.md（生成产物）。

tool_patterns:
  # ---- Tier 1 scaffolding tools (5 — ADR-0007 D5 沿用) ----
  - name: codex-block-generator
    profile: scaffolder
    invocation: 'codex exec --yolo --profile scaffolder < /dev/null'
    triggered_by:
      - simple_block_template_committed
      - editor_submodule_template_committed
      - ui_default_template_committed
    output_handling: |
      orchestrator 读 stdout 拿创建文件清单 + git diff；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-block-clone.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-block-clone.txt 归档。
    description: |
      在 simple-block-eng / ux-ui-lead / editor-eng 提交 template 后，按模板仿造其余 block / submodule。
      ADR-0007 D3 试点：ui-default 8 个由 ux-ui-lead 写 1 个 + 本 tool clone 7 个；
      core 试点限定 simple block (callout template + code/image clone)；
      render+viz core 不试点（hand-craft）。
      editor 子模块同 mode：editor-eng 写 toolbar template + 本 tool clone slash-menu/drag-handle。
      不允许偏离模板结构；如发现模板有问题，停止并交给原 template 工种修模板再继续。

  - name: codex-test-scaffolder
    profile: scaffolder
    invocation: 'codex exec --yolo --profile scaffolder < /dev/null'
    triggered_by:
      - new_package_added
      - vitest_skeleton_requested
    output_handling: |
      orchestrator 读 stdout 拿创建文件清单；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-test-scaffold.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-test-scaffold.txt 归档。
    description: |
      为每个 packages/<name> 生成 src/__tests__/ 下的 vitest 套件骨架，
      含一个示例 it() + setup helpers。具体测试由各包工种 agent 填。

  - name: codex-script-builder
    profile: scaffolder
    invocation: 'codex exec --yolo --profile scaffolder < /dev/null'
    triggered_by:
      - new_cli_tool_requested
    output_handling: |
      orchestrator 读 stdout 拿创建文件清单 + 验证 --help 输出；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-script.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-script.txt 归档。
    description: |
      写 scripts/refactor-move.ts / scripts/new-block.ts / scripts/extract-pdf-text.ts 等工具。
      要求 CLI 风格、有 --help、有错误处理、用 commander 或 yargs。
      WE-007 强制：codex-script-builder 输出后 orchestrator 必跑 pnpm lint 独立验证（spark PASS != lint clean）。

  - name: codex-api-crud-builder
    profile: scaffolder
    invocation: 'codex exec --yolo --profile scaffolder < /dev/null'
    triggered_by:
      - new_resource_endpoint_requested
    output_handling: |
      orchestrator 读 stdout 拿创建路由清单；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-api-crud.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-api-crud.txt 归档。
    description: |
      在 apps/api 按 RESTful 风格生成 CRUD 端点骨架（Pydantic schema + 路由）。
      复杂业务逻辑由 orchestrator 协调 codex-generic-executor 实现。

  - name: codex-css-stylist
    profile: scaffolder
    invocation: 'codex exec --yolo --profile scaffolder < /dev/null'
    triggered_by:
      - design_token_requested
      - tailwind_class_combo_requested
    output_handling: |
      orchestrator 读 stdout 拿创建文件清单；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-css.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-css.txt 归档。
    description: |
      写 packages/design-tokens / packages/ui 的 design tokens（颜色 / 间距 / 字体）+
      各 component 的 Tailwind 类组合。Phase 2b 设计 skill 流水线启动后，
      本 pattern 归入 ux-ui-lead（subagent）调度（lead 写 + 本 tool clone）。

  # ---- plan-challenger (ADR-0007 D5 沿用) ----
  - name: plan-challenger
    profile: plan-challenger
    invocation: 'codex exec --yolo --profile plan-challenger < /dev/null'
    triggered_by:
      - orchestrator_publishes_plan
    output_handling: |
      orchestrator 读 stdout 拿建议清单（不阻塞）；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-plan-challenge.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-plan-challenge.txt 归档。
    description: |
      lock 前挑战 orchestrator 的 wave / track / PR plan：检查 task 大小、可测性、边界场景。
      orchestrator 写完 plan 后，**lock 前**通过此 invocation 挑战：
      1. 每个 PR 是否 ≤ 200 LOC + ≤ 1 narrow responsibility（ADR-0011 D2）？
      2. 是否可测试（test_cases 字段非空且 input/expected/location 三元组完整）？
      3. 是否缺边界条件 / 异常场景？
      4. 高风险触发判定是否准确（D2 row 1+4 应否触发 D1 stage 4）？
      输出建议清单（不阻塞），orchestrator 决定吸收哪些。
      ADR-0011 D-list 起此 tool 还用于 PR-level plan-draft（不仅 wave-level）。

  # ---- codex-pr-reviewer-55 (ADR-0011 D6 升级原 pr-gate；D1 stage 3 默认 reviewer) ----
  - name: codex-pr-reviewer-55
    profile: codex-pr-reviewer-55
    invocation: 'codex exec --yolo --profile codex-pr-reviewer-55 < /dev/null'
    triggered_by:
      - executor_marks_ready_for_review                                 # 每 PR 默认
      - high_risk_d2_row_1_contract_change                              # 强制深扫
      - high_risk_d2_row_2_package_add_remove
      - high_risk_d2_row_4_adr_required
      - high_risk_d2_row_8_ci_or_deploy_or_auth_or_security_touch
    output_handling: |
      orchestrator 读 stdout 解析 PASS/FAIL + 问题清单 + 8th-class hunt 结果；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-pr-reviewer-55.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-pr-reviewer-55.txt 归档。
    description: |
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

  # ---- codex-generic-executor (ADR-0011 D6 NEW; D1 stage 2 默认 executor) ----
  - name: codex-generic-executor
    profile: generic-executor
    invocation: 'codex exec --yolo --profile generic-executor < /dev/null'
    triggered_by:
      - pr_plan_locked_executor_field_set_to_generic_executor
    output_handling: |
      orchestrator 读 stdout 拿创建/修改文件清单 + vitest 自跑结果；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-execute.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-execute.txt 归档。
    description: |
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

  # ---- codex-structure-auditor (ADR-0011 D6 NEW; per-PR + Wave-close) ----
  - name: codex-structure-auditor
    profile: structure-auditor
    invocation: 'codex exec --yolo --profile structure-auditor < /dev/null'
    triggered_by:
      - per_pr_post_commit                          # 每 PR 跑（速查）
      - wave_close                                  # 全量审计
      - manual_dispatch
    output_handling: |
      orchestrator 读 stdout 拿 god-file / 契约漂移 / 孤儿包 / D1 dead-dep 清单；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-structure-audit.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-structure-audit.txt 归档。
      Wave-close 时由 orchestrator 另写 curated summary 到 docs/audits/structure-YYYY-MM-<event>.md（月度 / Wave-close 级），引用 /tmp 原始 + docs/audits 归档。
    description: |
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

  # ---- codex-perf-auditor (ADR-0011 D6 NEW; bundle-affecting + Wave-close) ----
  - name: codex-perf-auditor
    profile: perf-auditor
    invocation: 'codex exec --yolo --profile perf-auditor < /dev/null'
    triggered_by:
      - bundle_affecting_pr                         # editor-shell / block-* / search index 等
      - wave_close
      - manual_dispatch
    output_handling: |
      orchestrator 读 stdout 拿 perf baseline + 回归点清单；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-perf-audit.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-perf-audit.txt 归档。
      Wave-close 时由 orchestrator 另写 curated summary 到 docs/audits/perf-YYYY-MM-DD.md（月度 / Wave-close 级），引用 /tmp 原始 + docs/audits 归档。
    description: |
      ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3
      performance-auditor Claude teammate 全 codex 化。

      执行内容：
      - Lighthouse CI 跑 apps/site
      - size-limit / Astro --analyze（heavy block 包重点关注：block-jupyter Pyodide
        ~10MB / block-nn-viz TF.js ~3MB / block-agent-flow React Flow ~500KB）
      - Playwright traces（关键交互延迟 / FCP / LCP / TTI）
      - 若 baseline 比上次差 > 20%，开 issue 阻断新功能直到修复

  # ---- codex-mdx-doctor (ADR-0011 D6 NEW; mdx-bridge fixture change PR) ----
  - name: codex-mdx-doctor
    profile: mdx-doctor
    invocation: 'codex exec --yolo --profile mdx-doctor < /dev/null'
    triggered_by:
      - pr_touches_mdx_bridge
      - pr_touches_block_package                    # block-* core/ 路径任意修改
      - wave_close
    output_handling: |
      orchestrator 读 stdout 拿 RTT fixture PASS/FAIL 清单；FAIL 阻断进入 D1 stage 5 commit；
      原始 stdout 落盘到 /tmp/codex-runs/<date>-<task>-mdx-doctor.txt（off-workspace per R7）；
      完成后 head -2000 截断到 docs/audits/codex-runs/<date>-<task>-mdx-doctor.txt 归档。
    description: |
      ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3
      mdx-doctor Claude teammate 全 codex 化。

      执行内容：
      - 跑全部 RTT (round-trip test) fixture：mdxToTiptap → tiptapToMdx 字节等价
      - 跑 stripMdast 路径下的同等价（编辑器构建 doc 不依赖 _mdast 字段）
      - 任一 fail 阻断所有 mdx-bridge / block-* PR 进 stage 5
      - Wave 3 起补足 8 component-block fixture (callout/code/image/math/pdf/jupyter/
        nn-viz/agent-flow) × 2 invariants × 1 fixture per block
```

## Related

- [设计规格 §3.1 + §3.13](docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [生成器 scripts/generate-configs.ts](scripts/generate-configs.ts)
- [ADR-0007 职能化分工 + Codex-heavy 执行 + teammate/tool 切分](docs/decisions/ADR-0007-job-function-codex-heavy-execution.md)
- [ADR-0011 Linear-pipeline execution model (Wave 3+)](docs/decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0006 cross-location asymmetry-audit checklist](docs/decisions/ADR-0006-asymmetry-audit-checklist.md)
- [docs/runbooks/codex-tool-invocations.md](docs/runbooks/codex-tool-invocations.md) — tool_patterns canonical bash 调用 + 触发条件 + audit 落盘
