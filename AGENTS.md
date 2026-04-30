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

## Permission boundaries (enforced by orchestrator + all teammates)

These three invariants come from `agent-contract.md` and apply to every Codex tool invocation too:

1. **`git-operator` is the SOLE agent authorized to run `git commit / branch / rebase / push`.**
   Codex tool invocations (scaffolder / review profiles) MUST NOT call git mutating commands.
   Hand the diff back to the orchestrator.
2. **`researcher` is the SOLE agent authorized for `web_search` / `web_fetch`.**
   If a Codex tool needs external info, the orchestrator must dispatch researcher — not curl/wget.
3. **`refactorer` is the SOLE agent authorized for cross-package moves / renames.**
   Codex tools MUST NOT move files across `packages/*` or `apps/*` boundaries. Mechanical
   refactors go through `scripts/refactor-move.ts` under refactorer dispatch.

Spec: §3.1 (agent roster) + §3.2 (review workflow boundaries). ADR-0007 D5 (tool patterns).

## Codex profile usage

After running `pnpm generate:configs`, manually merge `tmp/codex-profiles.toml` into
`~/.codex/config.toml`. Then invoke a profile via:

```bash
codex exec --profile scaffolder       "scaffold packages/block-code from block-callout template" < /dev/null
codex exec --profile code-reviewer    "review the staged diff" < /dev/null
codex exec --profile pr-gate          "deep review the staged diff (high-risk PR)" < /dev/null
codex exec --profile plan-challenger  "challenge docs/plans/active.md before lock" < /dev/null
```

`< /dev/null` is mandatory in non-interactive contexts (Phase 0 stdin-hang regression);
see `feedback_codex_stdin` memory.

| Profile           | Model               | Sandbox         | Use case                      |
| ----------------- | ------------------- | --------------- | ----------------------------- |
| `scaffolder`      | gpt-5.3-codex-spark | workspace-write | Cheap, fast scaffolding       |
| `code-reviewer`   | gpt-5.3-codex-spark | read-only       | Line-level review (default)   |
| `pr-gate`         | gpt-5.5             | read-only       | Deep review for high-risk PRs |
| `plan-challenger` | gpt-5.3-codex-spark | read-only       | Challenge plans before lock   |

## Tool patterns (8)

| Name                     | Profile           | Top triggers                                                         | Summary                                                                                            |
| ------------------------ | ----------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `code-reviewer`          | `code-reviewer`   | worker_marks_ready_for_review                                        | 行级 review：类型 / lint / 契约同步 / 文件大小 / 风格 / 边界条件。                                 |
| `plan-challenger`        | `plan-challenger` | orchestrator_publishes_plan                                          | lock 前挑战 orchestrator 的 wave / track plan：检查 task 大小、可测性、边界场景。                  |
| `pr-gate`                | `pr-gate`         | contract_change, package_add_remove                                  | 仅对**高风险 PR** 启用。深度审查：漏洞 / 隐性破坏 / 跨包影响。                                     |
| `codex-api-crud-builder` | `scaffolder`      | new_resource_endpoint_requested                                      | 在 apps/api 按 RESTful 风格生成 CRUD 端点骨架（Pydantic schema + 路由），                          |
| `codex-block-generator`  | `scaffolder`      | simple_block_template_committed, editor_submodule_template_committed | 在 simple-block-eng / ux-ui-lead / editor-eng 提交 template 后，按模板仿造其余 block / submodule。 |
| `codex-css-stylist`      | `scaffolder`      | design_token_requested, tailwind_class_combo_requested               | 写 packages/design-tokens / packages/ui 的 design tokens（颜色 / 间距 / 字体）+                    |
| `codex-script-builder`   | `scaffolder`      | new_cli_tool_requested                                               | 写 scripts/refactor-move.ts / scripts/new-block.ts / scripts/extract-pdf-text.ts 等工具。          |
| `codex-test-scaffolder`  | `scaffolder`      | new_package_added, vitest_skeleton_requested                         | 为每个 packages/<name> 生成 src/__tests__/ 下的 vitest 套件骨架，                                  |

## Footer

This file is GENERATED FROM `agent-contract.md`. Edits to this file will be overwritten
on the next `pnpm generate:configs` run.
