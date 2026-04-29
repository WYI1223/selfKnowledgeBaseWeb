# Architecture Decision Records (ADR)

每个重大架构决策、跨包重组、接口破坏性改动都对应一份 ADR。

## 索引

| ADR                                                       | 标题                                                       | 日期       | 状态     |
| --------------------------------------------------------- | ---------------------------------------------------------- | ---------- | -------- |
| [0001](ADR-0001-stack-selection.md)                       | 技术栈选型与架构基础                                       | 2026-04-29 | accepted |
| [0003](ADR-0003-headless-presentational-split.md)         | Headless / Presentational 分层 + 设计 token + 开源就绪      | 2026-04-29 | accepted |
| [0004](ADR-0004-agent-team-dispatch-model.md)             | 采用 Claude Code Agent Team 作为多 agent dispatch 模型     | 2026-04-29 | accepted |
| 0002                                                      | (预留：Wave 1 close ADR；Wave 1 完工时由 Task Z 写)        | TBD        | reserved |

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
