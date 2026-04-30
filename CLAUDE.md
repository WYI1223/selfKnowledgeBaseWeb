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

## Review workflow (spec §3.2 + ADR-0007 D2)

```
worker (writes code)
   │
   ▼
[Bash] codex exec --profile code-reviewer  (Codex 5.3-spark, line-level rigor, cheap default)
   │
   ├── if high-risk (D2 rows 1/2/4/8) → [Bash] codex exec --profile pr-gate  (Codex 5.5, deep scan)
   │
   ▼
pr-reviewer    (Claude, selective per ADR-0007 D2; spec match + regression + arch consistency)
   │
   ▼
git-operator   (Claude, only authorized git surface, runs `pnpm check` once more)
```

High-risk triggers per ADR-0007 D2 (4 rows +pr-gate +pr-reviewer, 4 rows +pr-reviewer only):
- **+pr-gate +pr-reviewer** (D2 rows 1/2/4/8): contract change, package add/remove, new ADR required, CI/deploy/auth/security touch.
- **+pr-reviewer only, skip pr-gate** (D2 rows 3/5/6/7): spec/agent-contract/ADR edit, delete/rename package, cross ≥3 packages, performance-auditor flagged.

See [ADR-0007 D2](docs/decisions/ADR-0007-job-function-codex-heavy-execution.md).

Codex tools (code-reviewer / pr-gate / plan-challenger / 5 scaffolders) are
[orchestrator-direct Bash invocations](docs/runbooks/codex-tool-invocations.md) post ADR-0007 D5,
not teammate spawns.

## Claude teammates (20)

| Tier            | Name                   | Role                                                       |
| --------------- | ---------------------- | ---------------------------------------------------------- |
| T0 Orchestrator | `orchestrator`         | 整体规划 + dispatch 工种 + 维护 docs/plans/                |
| T1 Worker       | `api-builder`          | 写 apps/api FastAPI 后端                                   |
| T1 Worker       | `block-foundation-eng` | 维护 block-foundation 与 content-types 包                  |
| T1 Worker       | `editor-eng`           | 写 editor-commands 命令模式与 editor-shell                 |
| T1 Worker       | `editor-integrator`    | 把 editor 子模块集成到 site                                |
| T1 Worker       | `kernel-architect`     | 设计 KernelAdapter 接口与 KernelRegistry                   |
| T1 Worker       | `kernel-pyodide-eng`   | 实现 PyodideAdapter                                        |
| T1 Worker       | `mdx-bridge-eng`       | 维护 mdx-bridge 双向转换                                   |
| T1 Worker       | `render-block-eng`     | 写 math / pdf 的 block 实现                                |
| T1 Worker       | `simple-block-eng`     | 写 simple block 模板（block-callout 等）                   |
| T1 Worker       | `ux-ui-lead`           | 视觉单一权威 — 横跨 ui-default + apps/site + editor 子模块 |
| T1 Worker       | `viz-block-eng`        | 写可视化 block 实现 (jupyter / nn-viz / agent-flow)        |
| T2 Process      | `git-operator`         | 唯一 git 操作权                                            |
| T2 Process      | `pr-reviewer`          | 实现质量 + 降级风险 + 规格匹配 review                      |
| T2 Process      | `refactorer`           | 唯一跨包重组权                                             |
| T2 Process      | `researcher`           | 唯一外网访问权                                             |
| T3 Audit        | `link-checker`         | markdown 链接检查                                          |
| T3 Audit        | `mdx-doctor`           | MDX round-trip 健康守护                                    |
| T3 Audit        | `performance-auditor`  | 性能基线 + 回归侦测                                        |
| T3 Audit        | `structure-auditor`    | 月度结构审计                                               |

## Codex tool patterns (8)

orchestrator-direct Bash invocations (ADR-0007 D5). Full canonical bash + triggers + audit-log paths in [docs/runbooks/codex-tool-invocations.md](docs/runbooks/codex-tool-invocations.md).

| Pattern                  | Profile           | Summary                                                                                            |
| ------------------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `code-reviewer`          | `code-reviewer`   | 行级 review：类型 / lint / 契约同步 / 文件大小 / 风格 / 边界条件。                                 |
| `plan-challenger`        | `plan-challenger` | lock 前挑战 orchestrator 的 wave / track plan：检查 task 大小、可测性、边界场景。                  |
| `pr-gate`                | `pr-gate`         | 仅对**高风险 PR 中需 pr-gate 的那 4 类**启用。深度审查：漏洞 / 隐性破坏 / 跨包影响。               |
| `codex-api-crud-builder` | `scaffolder`      | 在 apps/api 按 RESTful 风格生成 CRUD 端点骨架（Pydantic schema + 路由），                          |
| `codex-block-generator`  | `scaffolder`      | 在 simple-block-eng / ux-ui-lead / editor-eng 提交 template 后，按模板仿造其余 block / submodule。 |
| `codex-css-stylist`      | `scaffolder`      | 写 packages/design-tokens / packages/ui 的 design tokens（颜色 / 间距 / 字体）+                    |
| `codex-script-builder`   | `scaffolder`      | 写 scripts/refactor-move.ts / scripts/new-block.ts / scripts/extract-pdf-text.ts 等工具。          |
| `codex-test-scaffolder`  | `scaffolder`      | 为每个 packages/<name> 生成 src/__tests__/ 下的 vitest 套件骨架，                                  |

## Footer

This file is GENERATED FROM `agent-contract.md`. Edits to this file will be overwritten
on the next `pnpm generate:configs` run.
