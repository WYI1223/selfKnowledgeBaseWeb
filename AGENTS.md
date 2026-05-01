# AGENTS.md

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit `agent-contract.md` then run `pnpm generate:configs`. CI fails if drift detected.

This file is the Codex CLI entry point for **SelfKnowledgeBaseWeb**. For the deeper project
authority (rules, workflow, roster) read [CLAUDE.md](CLAUDE.md). This file focuses on
Codex-specific usage: which profiles to invoke and which tool patterns the orchestrator
calls via direct Bash invocation (ADR-0007 D5).

- Spec: [docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md](docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- Single source: [agent-contract.md](agent-contract.md)
- Codex profile TOML (manual merge): [tmp/codex-profiles.toml](tmp/codex-profiles.toml)
- Tool invocation runbook: [docs/runbooks/codex-tool-invocations.md](docs/runbooks/codex-tool-invocations.md)

## Permission boundaries (ADR-0011 D1+D4+D7; enforced by orchestrator + every codex profile)

These three invariants come from `agent-contract.md` and apply to every Codex tool invocation too:

1. **Git mutation discipline (ADR-0011 D1+D4)**: `git commit / branch / rebase / push`
   only at D1 stage 5 (reviewer codex commit phase) or by orchestrator self for bootstrap
   scope. Codex tool invocations (scaffolder / generic-executor / structure-auditor /
   perf-auditor / mdx-doctor / plan-challenger) MUST NOT call git mutating commands at
   any other point. Hand the diff back to the orchestrator.
2. **Web access discipline (ADR-0011 D7)**: only the `researcher` Claude subagent
   (one-shot per dispatch) may run `web_search` / `web_fetch`. If a Codex tool needs
   external info, the orchestrator must dispatch researcher — not curl/wget.
3. **Cross-package move discipline (ADR-0011 D7)**: only the `refactorer` Claude
   subagent may move/rename files across `packages/*` or `apps/*` boundaries. Codex
   tools MUST NOT cross package boundaries. Mechanical refactors run through
   `scripts/refactor-move.ts` under refactorer dispatch + ADR.

Spec: §3.1 (agent roster) + §3.2 (review workflow boundaries). ADR-0007 D5 (tool
patterns) + ADR-0011 D1/D4/D7 (linear pipeline + boundary refresh).

## Codex profile usage

After running `pnpm generate:configs`, manually merge `tmp/codex-profiles.toml` into
`~/.codex/config.toml`. Then invoke a profile via:

```bash
codex exec --profile scaffolder            "scaffold packages/block-code from block-callout template" < /dev/null
codex exec --profile plan-challenger       "challenge docs/plans/wave-3-…/plan.md before lock" < /dev/null
codex exec --profile codex-pr-reviewer-55  "review the staged diff (D1 stage 3 default)" < /dev/null
codex exec --profile generic-executor      "implement PR.md test_cases first then impl" < /dev/null
codex exec --profile structure-auditor     "scan workspace topology + ADR-0008 D1 dead-dep + drift" < /dev/null
codex exec --profile perf-auditor          "Lighthouse / size-limit / chunk-size baseline" < /dev/null
codex exec --profile mdx-doctor            "run all RTT fixtures + parse-equiv invariants" < /dev/null
```

`< /dev/null` is mandatory in non-interactive contexts (Phase 0 stdin-hang regression);
see `feedback_codex_stdin` memory.

The legacy `code-reviewer` (5.3-spark) and `pr-gate` profiles are deprecated post
ADR-0011 D6 — `codex-pr-reviewer-55` is the unified Wave 3+ default reviewer.

| Profile                | Model               | Sandbox         | Use case                                                    |
| ---------------------- | ------------------- | --------------- | ----------------------------------------------------------- |
| `scaffolder`           | gpt-5.3-codex-spark | workspace-write | Cheap, fast scaffolding (5 patterns)                        |
| `plan-challenger`      | gpt-5.3-codex-spark | read-only       | Challenge plans before lock                                 |
| `codex-pr-reviewer-55` | gpt-5.5             | read-only       | D1 stage 3 default reviewer (replaces pr-gate; ADR-0011 D6) |
| `generic-executor`     | gpt-5.5             | workspace-write | D1 stage 2 default executor (NEW Wave 3)                    |
| `structure-auditor`    | gpt-5.3-codex-spark | read-only       | Per-PR + Wave-close audit (NEW Wave 3)                      |
| `perf-auditor`         | gpt-5.3-codex-spark | read-only       | Bundle-affecting PR + Wave-close (NEW Wave 3)               |
| `mdx-doctor`           | gpt-5.3-codex-spark | read-only       | mdx-bridge fixture change PR (NEW Wave 3)                   |

## Tool patterns (11)

| Name                      | Profile                | Top triggers                                                         | Summary                                                                                            |
| ------------------------- | ---------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `codex-pr-reviewer-55`    | `codex-pr-reviewer-55` | executor_marks_ready_for_review, high_risk_d2_row_1_contract_change  | ADR-0011 D1 stage 3 默认 reviewer。replaces Wave 1+2 的 pr-gate（5.5）+                            |
| `codex-generic-executor`  | `generic-executor`     | pr_plan_locked_executor_field_set_to_generic_executor                | ADR-0011 D6 NEW Wave 3 默认 executor。gpt-5.5 + workspace-write sandbox。                          |
| `codex-mdx-doctor`        | `mdx-doctor`           | pr_touches_mdx_bridge, pr_touches_block_package                      | ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3                                      |
| `codex-perf-auditor`      | `perf-auditor`         | bundle_affecting_pr, wave_close                                      | ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3                                      |
| `plan-challenger`         | `plan-challenger`      | orchestrator_publishes_plan                                          | lock 前挑战 orchestrator 的 wave / track / PR plan：检查 task 大小、可测性、边界场景。             |
| `codex-api-crud-builder`  | `scaffolder`           | new_resource_endpoint_requested                                      | 在 apps/api 按 RESTful 风格生成 CRUD 端点骨架（Pydantic schema + 路由）。                          |
| `codex-block-generator`   | `scaffolder`           | simple_block_template_committed, editor_submodule_template_committed | 在 simple-block-eng / ux-ui-lead / editor-eng 提交 template 后，按模板仿造其余 block / submodule。 |
| `codex-css-stylist`       | `scaffolder`           | design_token_requested, tailwind_class_combo_requested               | 写 packages/design-tokens / packages/ui 的 design tokens（颜色 / 间距 / 字体）+                    |
| `codex-script-builder`    | `scaffolder`           | new_cli_tool_requested                                               | 写 scripts/refactor-move.ts / scripts/new-block.ts / scripts/extract-pdf-text.ts 等工具。          |
| `codex-test-scaffolder`   | `scaffolder`           | new_package_added, vitest_skeleton_requested                         | 为每个 packages/<name> 生成 src/__tests__/ 下的 vitest 套件骨架，                                  |
| `codex-structure-auditor` | `structure-auditor`    | per_pr_post_commit, wave_close                                       | ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3                                      |

## Footer

This file is GENERATED FROM `agent-contract.md`. Edits to this file will be overwritten
on the next `pnpm generate:configs` run.
