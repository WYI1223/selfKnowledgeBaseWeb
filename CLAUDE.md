# CLAUDE.md

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit `agent-contract.md` then run `pnpm generate:configs`. CI fails if drift detected.

This file is the Claude Code entry point for the **SelfKnowledgeBaseWeb** monorepo. It tells
every Claude session what the project is, the hard rules, the agent roster, and the workflow.

- Spec: [docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md](docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- Active plan: [docs/plans/active.md](docs/plans/active.md)
- Single source for agents: [agent-contract.md](agent-contract.md)

## Hard rules

1. **File size**: 200 lines (target) / 300 lines (ESLint `max-lines` warn) / 500 lines
   (`pnpm size-check` hard fail). Spec §3.6.
2. **Cross-file references**: every doc/code change must keep doc cross-references and
   contract files in sync (`packages/*/CONTRACT.md`, `agent-contract.md`).
3. **Lychee link-check**: broken markdown links block merge. Run `pnpm link-check` locally.
4. **`pnpm check` is mandatory before requesting review** (lint + typecheck + test + build + size).
5. **No direct git from workers**: only `git-operator` may commit / branch / rebase / push.
6. **No web access from workers**: only `researcher` may `web_search` / `web_fetch`.
7. **No cross-package moves from workers**: only `refactorer` may reorganize packages,
   and every reorganization requires an ADR under `docs/decisions/`.

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

## Review workflow (spec §3.2)

```
worker (writes code)
   │
   ▼
code-reviewer  (Codex 5.3-spark, line-level rigor, cheap default)
   │
   ├── if high-risk → pr-gate (Codex 5.5, deep scan)
   │
   ▼
pr-reviewer    (Claude, spec match + regression + arch consistency)
   │
   ▼
git-operator   (Claude, only authorized git surface, runs `pnpm check` once more)
```

High-risk triggers (force `pr-gate`): contract change, package add/remove, core arch
touch, ADR-required PR, CI/deploy/auth/security touch.

## Agent roster (27 agents)

| Tier            | Name                     | LLM                     | Role                                                |
| --------------- | ------------------------ | ----------------------- | --------------------------------------------------- |
| T0 Orchestrator | `orchestrator`           | claude                  | 整体规划 + dispatch 工种 + 维护 docs/plans/         |
| T1 Worker       | `api-builder`            | claude                  | 写 apps/api FastAPI 后端                            |
| T1 Worker       | `block-foundation-eng`   | claude                  | 维护 block-foundation 与 content-types 包           |
| T1 Worker       | `codex-api-crud-builder` | codex (scaffolder)      | 写 apps/api 的 CRUD 端点骨架                        |
| T1 Worker       | `codex-block-generator`  | codex (scaffolder)      | 在 block-callout 模板出来后，仿造其他 simple block  |
| T1 Worker       | `codex-css-stylist`      | codex (scaffolder)      | 写 Tailwind 重复样式 / 设计 token                   |
| T1 Worker       | `codex-script-builder`   | codex (scaffolder)      | 写 scripts/ 下的工具脚本                            |
| T1 Worker       | `codex-test-scaffolder`  | codex (scaffolder)      | 为每个 package 生成 vitest 套件骨架                 |
| T1 Worker       | `editor-eng`             | claude                  | 写 editor-commands 命令模式与 editor-shell          |
| T1 Worker       | `editor-integrator`      | claude                  | 把 editor 子模块集成到 site                         |
| T1 Worker       | `kernel-architect`       | claude                  | 设计 KernelAdapter 接口与 KernelRegistry            |
| T1 Worker       | `kernel-pyodide-eng`     | claude                  | 实现 PyodideAdapter                                 |
| T1 Worker       | `mdx-bridge-eng`         | claude                  | 维护 mdx-bridge 双向转换                            |
| T1 Worker       | `render-block-eng`       | claude                  | 写 math / pdf 的 block 实现                         |
| T1 Worker       | `simple-block-eng`       | claude                  | 写 simple block 模板（block-callout 等）            |
| T1 Worker       | `viz-block-eng`          | claude                  | 写可视化 block 实现 (jupyter / nn-viz / agent-flow) |
| T2 Process      | `code-reviewer`          | codex (code-reviewer)   | 行级严谨 review (默认廉价)                          |
| T2 Process      | `git-operator`           | claude                  | 唯一 git 操作权                                     |
| T2 Process      | `plan-challenger`        | codex (plan-challenger) | 在 plan lock 前挑战                                 |
| T2 Process      | `pr-gate`                | codex (pr-gate)         | 高风险 PR 深度审查 (5.5)                            |
| T2 Process      | `pr-reviewer`            | claude                  | 实现质量 + 降级风险 + 规格匹配 review               |
| T2 Process      | `refactorer`             | claude                  | 唯一跨包重组权                                      |
| T2 Process      | `researcher`             | claude                  | 唯一外网访问权                                      |
| T3 Audit        | `link-checker`           | claude                  | markdown 链接检查                                   |
| T3 Audit        | `mdx-doctor`             | claude                  | MDX round-trip 健康守护                             |
| T3 Audit        | `performance-auditor`    | claude                  | 性能基线 + 回归侦测                                 |
| T3 Audit        | `structure-auditor`      | claude                  | 月度结构审计                                        |

## Footer

This file is GENERATED FROM `agent-contract.md`. Edits to this file will be overwritten
on the next `pnpm generate:configs` run.
