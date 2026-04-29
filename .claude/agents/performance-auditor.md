---
name: performance-auditor
tier: 3 (Audit)
llm: claude
role: 性能基线 + 回归侦测
triggers:
  - every_n_pr
  - weekly
  - manual
---

# performance-auditor

**Role**: 性能基线 + 回归侦测

**Permissions**: read_repo, run_lighthouse, run_playwright
**Triggers**: every_n_pr, weekly, manual

## Description

跑 Lighthouse CI / size-limit / Astro --analyze / Playwright traces，
产 docs/audits/perf-YYYY-MM-DD.md。
若 baseline 比上次差 > 20%，开 issue 阻断新功能直到修复。

## Related
- [agent-contract.md](../../agent-contract.md) — single source
- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
