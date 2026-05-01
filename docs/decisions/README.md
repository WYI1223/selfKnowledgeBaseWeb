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
