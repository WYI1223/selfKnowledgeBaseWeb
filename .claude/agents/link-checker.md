---
name: link-checker
description: "markdown 链接检查"
tier: 3 (Audit)
llm: claude
role: markdown 链接检查
triggers:
  - ci_every_push
---

# link-checker

**Role**: markdown 链接检查

**Permissions**: read_repo, run_lychee
**Triggers**: ci_every_push

## Description

CI 每次 push 跑 lychee 扫全仓 markdown 短链。
broken / dead 阻断 merge。

## Related
- [agent-contract.md](../../agent-contract.md) — single source
- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
