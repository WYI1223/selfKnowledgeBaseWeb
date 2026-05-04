# CLAUDE.md

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit `agent-contract.md` then run `pnpm generate:configs`. CI fails if drift detected.

This file is the Claude Code entry point for the **SelfKnowledgeBaseWeb** monorepo. It tells
every Claude session what the project is, the hard rules, the agent roster, and the workflow.

- Spec: [docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md](docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- Active plan: [docs/plans/active.md](docs/plans/active.md)
- Single source for agents: [agent-contract.md](agent-contract.md)
- Codex tool invocations: [docs/runbooks/codex-tool-invocations.md](docs/runbooks/codex-tool-invocations.md)

## Hard rules

1. **File size**: 200 lines (target) / 300 lines (ESLint `max-lines` warn) / 500 lines
   (`pnpm size-check` hard fail). Spec §3.6.
2. **Cross-file references**: every doc/code change must keep doc cross-references and
   contract files in sync (`packages/*/CONTRACT.md`, `agent-contract.md`).
3. **Lychee link-check**: broken markdown links block merge. Run `pnpm link-check` locally.
4. **`pnpm check` is mandatory before review** (lint + typecheck + test + build + size).
5. **Git mutation discipline (ADR-0011 D1+D4)**: `git commit / branch / rebase / push`
   only at D1 stage 5 (reviewer codex commit phase) or by orchestrator self for bootstrap
   scope. Subagents (pr-writer / ux-ui-lead / refactorer / researcher) never run mutating
   git commands.
6. **Web access discipline (ADR-0011 D7)**: only the `researcher` Claude subagent (one-shot
   per dispatch) may run `web_search` / `web_fetch`.
7. **Cross-package moves (ADR-0011 D7)**: only the `refactorer` Claude subagent may
   reorganize packages, and every reorganization requires an ADR under `docs/decisions/`.

## Commands cheat-sheet

| Command                 | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `pnpm install`          | Install workspace dependencies                        |
| `pnpm dev`              | Run all `dev` scripts (parallel)                      |
| `pnpm check`            | Lint + typecheck + test + build + size-check          |
| `pnpm check:affected`   | Same, scoped to packages affected since `origin/main` |
| `pnpm size-check`       | Hard 500-line limit on every source file              |
| `pnpm link-check`       | Lychee scan over `./**/*.md`                          |
| `pnpm generate:configs` | Re-derive everything from `agent-contract.md`         |
| `pnpm format`           | Prettier write across the repo                        |

## Review workflow (ADR-0011 D1 linear pipeline; supersedes Wave 1+2 tree workflow)

Per PR (PRs run strictly serial; the next PR's PLAN waits for the previous PR's ACCEPT):

```
1. PLAN              pr-writer Claude subagent ↔ orchestrator → lock PR.md (D2 schema)
       │
       ▼
2. EXECUTE           codex `codex-generic-executor` (or specialized scaffolder; or
                     `ux-ui-lead` Claude subagent for UI/UX). TDD-front:
                     write tests → write impl → vitest all PASS.
       │
       ▼
3. REVIEW            codex `codex-pr-reviewer-55` (5.5) — line-level + spec-match.
                     ADR-0006 8-point checklist mandatory. PASS → next stage.
       │
       ├── (D2 row 1+4 hit) → 4. PRE-COMMIT CLAUDE REVIEW   orchestrator self.
       │                          Mitigates same-model echo chamber.
       │
       ▼
5. COMMIT (+ push)   reviewer codex commits. Per ADR-0006 D8 explicit-file-list
                     staging (`git reset HEAD` → `git add <list>` →
                     `git diff --cached --stat` verify → `git commit`).
       │
       ▼
6. ACCEPT            pr-writer Claude subagent (second invocation): verify the
                     PR's diff actually meets PR.md's `acceptance:` block.
```

D2 trigger judgment (ADR-0007 D2 rows; locked by orchestrator at PLAN):
- **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** on D2 rows 1+4 (contract change OR new
  ADR required). Other rows skip this stage but still go through codex review.
- **High-risk classes** (rows 2 package add/remove, row 8 CI/deploy/auth/security) also
  receive heightened reviewer scrutiny within stage 3 — ADR-0006 D8 staging discipline +
  ADR-0006 8-point checklist 8th-class hunt.

See [ADR-0011](docs/decisions/ADR-0011-linear-pipeline-execution-model.md) D1-D8 +
[ADR-0007 D2](docs/decisions/ADR-0007-job-function-codex-heavy-execution.md).

Codex tools (11 patterns: 5 scaffolders + plan-challenger + codex-pr-reviewer-55 +
4 audit/exec profiles) are
[orchestrator-direct Bash invocations](docs/runbooks/codex-tool-invocations.md) post
ADR-0007 D5 + ADR-0011 D6.

## Claude teammates (5)

| Tier            | Name           | Role                                                                           |
| --------------- | -------------- | ------------------------------------------------------------------------------ |
| T0 Orchestrator | `orchestrator` | 整体规划 + dispatch 工种 + 维护 docs/plans/ + D1 pipeline 协调                 |
| T2 Subagent     | `pr-writer`    | PR.md 起草（PLAN 调）+ ACCEPT 验收（COMMIT 后调）                              |
| T2 Subagent     | `refactorer`   | 唯一跨包重组权（ADR-0011 D7 沿用，按需 one-shot dispatch）                     |
| T2 Subagent     | `researcher`   | 唯一外网访问权（ADR-0011 D7 沿用，按需 one-shot dispatch）                     |
| T2 Subagent     | `ux-ui-lead`   | 视觉单一权威 — 横跨 ui-default + apps/site + editor 子模块（仅 UI/UX PR 触发） |

## Codex tool patterns (11)

orchestrator-direct Bash invocations (ADR-0007 D5). Full canonical bash + triggers + audit-log paths in [docs/runbooks/codex-tool-invocations.md](docs/runbooks/codex-tool-invocations.md).

| Pattern                   | Profile                   | Summary                                                                                            |
| ------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `codex-generic-executor`  | `codex-generic-executor`  | ADR-0011 D6 NEW Wave 3 默认 executor。gpt-5.5 + workspace-write sandbox。                          |
| `codex-mdx-doctor`        | `codex-mdx-doctor`        | ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3                                      |
| `codex-perf-auditor`      | `codex-perf-auditor`      | ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3                                      |
| `codex-pr-reviewer-55`    | `codex-pr-reviewer-55`    | ADR-0011 D1 stage 3 默认 reviewer。replaces Wave 1+2 的 pr-gate（5.5）+                            |
| `codex-structure-auditor` | `codex-structure-auditor` | ADR-0011 D5 + D6 NEW Wave 3 audit profile。从 Wave 1+2 Tier 3                                      |
| `plan-challenger`         | `plan-challenger`         | lock 前挑战 orchestrator 的 wave / track / PR plan：检查 task 大小、可测性、边界场景。             |
| `codex-api-crud-builder`  | `scaffolder`              | 在 apps/api 按 RESTful 风格生成 CRUD 端点骨架（Pydantic schema + 路由）。                          |
| `codex-block-generator`   | `scaffolder`              | 在 simple-block-eng / ux-ui-lead / editor-eng 提交 template 后，按模板仿造其余 block / submodule。 |
| `codex-css-stylist`       | `scaffolder`              | 写 packages/design-tokens / packages/ui 的 design tokens（颜色 / 间距 / 字体）+                    |
| `codex-script-builder`    | `scaffolder`              | 写 scripts/refactor-move.ts / scripts/new-block.ts / scripts/extract-pdf-text.ts 等工具。          |
| `codex-test-scaffolder`   | `scaffolder`              | 为每个 packages/<name> 生成 src/__tests__/ 下的 vitest 套件骨架，                                  |

## Footer

This file is GENERATED FROM `agent-contract.md`. Edits to this file will be overwritten
on the next `pnpm generate:configs` run.
