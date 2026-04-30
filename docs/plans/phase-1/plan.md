# Phase 1 实施计划（wave 索引）

> Phase 1 = MVP 知识库上线。按 spec §4.2 拆为 4 个 wave；
> 节奏事件驱动（spec §4.6），每个 wave 在前一个 wave 退出标准达成后启动新 plan。

## 状态总览

| Wave | 主题 | 文件 | 状态 |
|---|---|---|---|
| 1 | 基础设施 + 接口（6 路并行） | [2026-04-29-phase-1-wave-1-foundation.md](../../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) | ✅ closed by [ADR-0002](../../decisions/ADR-0002-wave-1-close.md) (2026-04-30) |
| 2 | 实现层（12 路并行 + 首次 codex worker 实战） | 待 Wave 1 完工后用 superpowers:writing-plans 起草 | pending plan draft |
| 3 | 集成（editor-shell + site 接入 + search） | 待 Wave 2 完工后起草 | pending |
| 4 | 验收 + 部署（Cloudflare Pages + Tunnel + perf baseline） | 待 Wave 3 完工后起草 | pending |

## Wave 1 退出标准（spec §4.2.1）

- 所有 6 track 双 review pass（高风险 track 多过 pr-gate 5.5）
- structure-auditor baseline 报告无 god-file
- ADR-0002 记录 wave 1 完成

## Wave 2 plan 写作时需要前置考虑（迁移自 active.md 备忘）

- Playwright MCP server 加入 Claude Code（让 viz / editor agent 能开浏览器自检）
- **每个 component block 拆 core/ + ui-default/（ADR-0003）**：core 由 Claude template，ui-default 部分由 codex-block-generator 仿造，部分由 codex-css-stylist 装填样式
- 3 个 editor 子模块（editor-slash-menu / editor-drag-handle / editor-toolbar）由 editor-integrator；这三个本质是 UI，需消费 design-tokens preset
- kernel-pyodide 实现（kernel-pyodide-eng）
- codex-test-scaffolder / codex-script-builder / codex-css-stylist 首次实战（评估 5.3-spark 在脚手架场景的产出质量）
- 设计 skill 流水线（frontend-design → ui-ux-pro-max → Vercel）作用对象明确：仅各 block 的 ui-default/，绝不碰 core/

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
