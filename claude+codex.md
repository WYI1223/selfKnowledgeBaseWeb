| 阶段               | 主导工具                                    | 协同方式                                                                             |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| 代码库理解、架构梳理       | **Claude Code**                         | 让 Claude 先访谈、读代码、写 `SPEC.md` / `PLAN.md`，Codex 用 Plan/Review 视角挑战方案              |
| 任务拆解、验收标准        | **Claude Code + Codex**                 | Claude 写 spec；Codex 检查是否 PR-sized、是否可测试、是否缺边界条件                                  |
| 并行实现             | **Codex**                               | 用 Cloud/Worktree 模式并行跑多个独立任务，每个任务单独 branch / worktree / PR                       |
| 复杂本地调试           | **Claude Code**                         | 本地跑命令、看日志、复现 CI、定位 legacy/跨模块问题                                                  |
| PR 修复和 GitHub 流程 | **Codex**                               | 用 Codex App diff pane、GitHub PR feedback loop、`@codex` 评论修复                      |
| 深度审查、安全审查        | **Claude Code + Codex 交叉**              | Codex 写的 PR 交给 Claude review；Claude 写的 PR 交给 Codex `/review`                     |
| 周期性维护            | **Codex Automations + Claude Routines** | Codex 做 CI/flaky test/release notes；Claude 做深度 triage、ultrareview、安全/架构例行检查      |
| 团队规范沉淀           | **两者共享**                                | 统一从 `agent-contract.md` 生成 `AGENTS.md`、`CLAUDE.md`、skills、hooks、review checklist |
