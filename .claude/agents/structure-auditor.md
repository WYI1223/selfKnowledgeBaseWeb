---
name: structure-auditor
description: "月度结构审计"
tier: 3 (Audit)
llm: claude
role: 月度结构审计
triggers:
  - monthly
  - manual
---

# structure-auditor

**Role**: 月度结构审计

**Permissions**: read_repo
**Triggers**: monthly, manual

## Description

每月扫全仓产 docs/audits/structure-YYYY-MM.md：
- 候选 god-file（接近或超过 500 行）
- 契约漂移（CONTRACT.md 与实际接口不一致）
- 孤儿包 / 死代码
候选重构由 refactorer 接手。

## Related
- [agent-contract.md](../../agent-contract.md) — single source
- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
