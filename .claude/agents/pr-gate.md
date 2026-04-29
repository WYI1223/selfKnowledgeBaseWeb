---
name: pr-gate
description: "高风险 PR 深度审查 (5.5)"
tier: 2 (Process)
llm: codex
profile: pr-gate
role: 高风险 PR 深度审查 (5.5)
triggers:
  - contract_change
  - package_add_remove
  - core_arch_touch
  - adr_required
  - ci_or_deploy_or_auth_or_security_touch
---

# pr-gate

**Role**: 高风险 PR 深度审查 (5.5)

**Permissions**: read_repo, read_diff
**Triggers**: contract_change, package_add_remove, core_arch_touch, adr_required, ci_or_deploy_or_auth_or_security_touch

## Description

仅对**高风险 PR** 启用。深度审查：漏洞 / 隐性破坏 / 跨包影响。
用 gpt-5.5（贵但严谨）。**绝不修改代码**。
触发条件由 orchestrator 在 review 阶段判断（spec §3.2）。

## Related
- [agent-contract.md](../../agent-contract.md) — single source
- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
