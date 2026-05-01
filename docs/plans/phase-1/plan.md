# Phase 1 实施计划（wave 索引）

> Phase 1 = MVP 知识库上线。按 spec §4.2 拆为 4 个 wave；
> 节奏事件驱动（spec §4.6），每个 wave 在前一个 wave 退出标准达成后启动新 plan。

## 状态总览

| Wave | 主题 | 文件 | 状态 |
|---|---|---|---|
| 1 | 基础设施 + 接口（6 路并行） | [2026-04-29-phase-1-wave-1-foundation.md](../../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) | ✅ closed by [ADR-0002](../../decisions/ADR-0002-wave-1-close.md) (2026-04-30) |
| 2 | 实现层（17 main tracks + 33 commits + 9 new packages + ux-ui-lead 实战 + codex tool 实战） | [2026-04-30-phase-1-wave-2-implementation.md](../../superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) | ✅ closed by [ADR-0010](../../decisions/ADR-0010-wave-2-close.md) (2026-05-01) |
| 3 | 集成（apps/site BlockRegistry 路由 + editor-shell + mdx-bridge 真实 round-trip + search） | 待起草（plan-challenger 先行） | pending plan-draft |
| 4 | 验收 + 部署（Cloudflare Pages + Tunnel + perf baseline） | 待 Wave 3 完工后起草 | pending |

## Wave 1 退出标准（spec §4.2.1）

- 所有 6 track 双 review pass（高风险 track 多过 pr-gate 5.5）
- structure-auditor baseline 报告无 god-file
- ADR-0002 记录 wave 1 完成

## Wave 2 plan 写作时需要前置考虑（迁移自 active.md 备忘）

**Wave 2 Pre-Task 0 必先**：实施 [ADR-0007](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)（agent-contract restructure + ux-ui-lead 加入 + codex agents 降为 tool）。完工后才能起 Wave 2 真正实施 task。

后续工作（Wave 2 主体）：
- Playwright MCP server 加入 Claude Code（让 viz / editor 工种能开浏览器自检）
- **每个 component block 拆 core/ + ui-default/（ADR-0003）**：
  - core 试点（ADR-0007 D3）：block-callout/core/ template by simple-block-eng；block-code/core/ + block-image/core/ clone by codex-block-generator（tool）；render block / viz block 仍 hand-craft
  - ui-default 全部由 **ux-ui-lead**（新 Claude teammate, ADR-0007 D1）写第一 template + codex-block-generator (tool) clone 7 个
- 3 个 editor 子模块（editor-slash-menu / editor-drag-handle / editor-toolbar）由 editor-eng template + codex-block-generator clone（ADR-0007 D3）
- kernel-pyodide 实现（kernel-pyodide-eng）—— 仍 hand-craft（kernel session 复杂）
- codex-test-scaffolder / codex-script-builder / codex-css-stylist 首次实战 **作 tool 而非 teammate 调用**（ADR-0007 D5）；orchestrator + 工种 lead 直接 Bash 调用
- 设计 skill 流水线注入 ux-ui-lead spawn prompt（ADR-0007 D4）—— frontend-design + ui-ux-pro-max-skill + web-design-guidelines 一次性全注入
- review chain 改为：默认 codex 5.3-spark + orchestrator 自检；ADR-0007 D2 列出的 7 类高风险触发 codex 5.5 pr-gate + Claude pr-reviewer

**Wave 1 erratum 顺手清单**（Wave 2 起手时一并处理）：
- detail 页 duplicate H1：删 sample MDX 的 `# Sample` 行（保留 layout 的 frontmatter title 渲染）
- Wave 1 review 仅做了 ts/js 测试 + size + lint，**未做视觉测试** —— Wave 2 加 Playwright 视觉烟测覆盖 prose render

## Wave 间衔接原则

每个 wave 结束都产 ADR（ADR-0002 = Wave 1 close, ADR-0003 = Wave 2 close, ...），其内必含：

- 实际偏离 spec / plan 的地方（errata 风格，如 ADR-0001 的 7 处 errata）
- deferred follow-ups 处理状态
- 下一 wave 启动前的前置任务（这就是 active.md 上 Wave 备忘的来源）

## Related

- [设计规格 §4.2](../../superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [overview](../overview.md)
- [active](../active.md)
- [decisions/ADR-0001](../../decisions/ADR-0001-stack-selection.md)
