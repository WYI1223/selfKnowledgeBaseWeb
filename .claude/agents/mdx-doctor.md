---
name: mdx-doctor
tier: 3 (Audit)
llm: claude
role: MDX round-trip 健康守护
triggers:
  - pr_touches_mdx_bridge_or_blocks
---

# mdx-doctor

**Role**: MDX round-trip 健康守护

**Permissions**: read_repo, run_tests
**Triggers**: pr_touches_mdx_bridge_or_blocks

## Description

PR 触碰 mdx-bridge 或任何 block 时自动触发。
跑全部 RTT fixture。失败 → 阻断所有 block PR。

## Related
- [agent-contract.md](../../agent-contract.md) — single source
- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
