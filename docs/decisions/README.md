# Architecture Decision Records (ADR)

每个重大架构决策、跨包重组、接口破坏性改动都对应一份 ADR。

## 索引

| ADR                                                       | 标题                                                       | 日期       | 状态     |
| --------------------------------------------------------- | ---------------------------------------------------------- | ---------- | -------- |
| [0001](ADR-0001-stack-selection.md)                       | 技术栈选型与架构基础                                       | 2026-04-29 | accepted |
| [0002](ADR-0002-wave-1-close.md)                          | Wave 1 close — empirical lessons + errata roll-up         | 2026-04-30 | accepted |
| [0003](ADR-0003-headless-presentational-split.md)         | Headless / Presentational 分层 + 设计 token + 开源就绪      | 2026-04-29 | accepted |
| [0004](ADR-0004-agent-team-dispatch-model.md)             | 采用 Claude Code Agent Team 作为多 agent dispatch 模型     | 2026-04-29 | accepted |
| [0005](ADR-0005-api-conventions.md)                       | REST API conventions（/v1 / camelCase / RFC 7807）         | 2026-04-29 | accepted |
| [0006](ADR-0006-asymmetry-audit-checklist.md)             | Cross-location asymmetry-audit checklist (process rule)    | 2026-04-30 | accepted |
| [0007](ADR-0007-job-function-codex-heavy-execution.md)    | 职能化分工 + Codex-heavy 执行 + teammate / tool 切分      | 2026-04-30 | accepted |
| [0008](ADR-0008-wave-2-entry-policies.md)                 | Wave 2 entry policies — dead-dep + block-foundation freeze | 2026-04-30 | accepted |
| [0009](ADR-0009-block-kind-union-expansion.md)            | BlockKind union additive expansion (Wave 2)                | 2026-04-30 | accepted |
| [0010](ADR-0010-wave-2-close.md)                          | Wave 2 close — empirical lessons + errata + WE-* process   | 2026-05-01 | accepted |
| [0011](ADR-0011-linear-pipeline-execution-model.md)       | Linear-pipeline execution model (Wave 3+) + v0.1.1 SOTed-PR.md | 2026-05-01 | accepted |
| [0012](ADR-0012-search-index-stack.md)                    | Search index stack — PageFind via astro-pagefind            | 2026-05-01 | accepted |
| [0013](ADR-0013-wave-3-close.md)                          | Wave 3 close — 24-PR ratification + Wave 4 deferred set     | 2026-05-02 | accepted |
| [0014](ADR-0014-heavy-block-boundary.md)                  | HeavyBlockBoundary wrapper for client:only heavy blocks     | 2026-05-03 | accepted |
| [0015](ADR-0015-wave-4-close.md)                          | Wave 4 close — 21-PR ratification + Wave 5 deferred set     | 2026-05-04 | accepted |
| [0016](ADR-0016-grid-data-model.md)                       | Grid 数据模型与流动 (12-col grid + row flow + COL_SNAPS + 响应式) | 2026-05-04 | proposed |
| [0017](ADR-0017-drag-drop-ux.md)                          | Drag/Drop UX (4 边缘对称 + outline overlay 方案 A + edge rects + lift) | 2026-05-04 | proposed |
| [0018](ADR-0018-v2-visual-migration.md)                   | v2 视觉 migration + save-path 接口冻结 (OKLCH + Inter/JetBrains Mono + 顶 2px 横条 + LocalStorageAdapter MVP) | 2026-05-04 | proposed |

## 模板

复制 `_template.md`（如有）或参照 ADR-0001。模板字段：

```
| 字段 | 值 |
|---|---|
| 状态 | proposed / accepted / superseded by ADR-XXXX |
| 日期 | YYYY-MM-DD |
| 作者 | <agent name + LLM model> |

## Context
## Decision
## Consequences
## Related
```

## Related

- [设计规格 §3.11](../superpowers/specs/2026-04-29-self-knowledge-base-design.md)
