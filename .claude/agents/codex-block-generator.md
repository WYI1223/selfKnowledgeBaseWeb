---
name: codex-block-generator
tier: 1 (Worker)
llm: codex
profile: scaffolder
role: 在 block-callout 模板出来后，仿造其他 simple block
---

# codex-block-generator

**Role**: 在 block-callout 模板出来后，仿造其他 simple block

**Permissions**: read_repo, edit_packages_block_simple, write_tests

## Description

你按 packages/block-callout 模板生成 block-code 与 block-image。
不允许偏离模板结构；如发现模板有问题，停止并交给 simple-block-eng 修模板再继续。

## Related
- [agent-contract.md](../../agent-contract.md) — single source
- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
