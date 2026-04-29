# AGENTS.md

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit `agent-contract.md` then run `pnpm generate:configs`. CI fails if drift detected.

This file is the Codex CLI entry point for **SelfKnowledgeBaseWeb**. For the deeper project
authority (rules, workflow, roster) read [CLAUDE.md](CLAUDE.md). This file focuses on
Codex-specific usage: which profiles to invoke and which agents run on Codex.

- Spec: [docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md](docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- Single source: [agent-contract.md](agent-contract.md)
- Codex profile TOML (manual merge): [tmp/codex-profiles.toml](tmp/codex-profiles.toml)

## Permission boundaries (enforced by all agents)

These three invariants come from `agent-contract.md` and apply to every Codex worker too:

1. **`git-operator` is the SOLE agent authorized to run `git commit / branch / rebase / push`.**
   Codex workers (scaffolder profiles) MUST NOT call git mutating commands. Hand the diff back to the orchestrator.
2. **`researcher` is the SOLE agent authorized for `web_search` / `web_fetch`.**
   If a Codex worker needs external info, it must request researcher dispatch via the orchestrator — not curl/wget.
3. **`refactorer` is the SOLE agent authorized for cross-package moves / renames.**
   Codex workers MUST NOT move files across `packages/*` or `apps/*` boundaries. Mechanical refactors go through `scripts/refactor-move.ts` under refactorer dispatch.

Spec: §3.1 (agent roster) + §3.2 (review workflow boundaries).

## Codex profile usage

After running `pnpm generate:configs`, manually merge `tmp/codex-profiles.toml` into
`~/.codex/config.toml`. Then invoke a profile via:

```bash
codex exec --profile scaffolder       "scaffold packages/block-code from block-callout template"
codex exec --profile code-reviewer    "review the staged diff"
codex exec --profile pr-gate          "deep review the staged diff (high-risk PR)"
codex exec --profile plan-challenger  "challenge docs/plans/active.md before lock"
```

| Profile           | Model               | Sandbox         | Use case                      |
| ----------------- | ------------------- | --------------- | ----------------------------- |
| `scaffolder`      | gpt-5.3-codex-spark | workspace-write | Cheap, fast scaffolding       |
| `code-reviewer`   | gpt-5.3-codex-spark | read-only       | Line-level review (default)   |
| `pr-gate`         | gpt-5.5             | read-only       | Deep review for high-risk PRs |
| `plan-challenger` | gpt-5.3-codex-spark | read-only       | Challenge plans before lock   |

## Codex agents (8)

| Name                     | Profile         | Tier | Role                                               |
| ------------------------ | --------------- | ---- | -------------------------------------------------- |
| `codex-api-crud-builder` | scaffolder      | T1   | 写 apps/api 的 CRUD 端点骨架                       |
| `codex-block-generator`  | scaffolder      | T1   | 在 block-callout 模板出来后，仿造其他 simple block |
| `codex-css-stylist`      | scaffolder      | T1   | 写 Tailwind 重复样式 / 设计 token                  |
| `codex-script-builder`   | scaffolder      | T1   | 写 scripts/ 下的工具脚本                           |
| `codex-test-scaffolder`  | scaffolder      | T1   | 为每个 package 生成 vitest 套件骨架                |
| `code-reviewer`          | code-reviewer   | T2   | 行级严谨 review (默认廉价)                         |
| `plan-challenger`        | plan-challenger | T2   | 在 plan lock 前挑战                                |
| `pr-gate`                | pr-gate         | T2   | 高风险 PR 深度审查 (5.5)                           |

## Footer

This file is GENERATED FROM `agent-contract.md`. Edits to this file will be overwritten
on the next `pnpm generate:configs` run.
