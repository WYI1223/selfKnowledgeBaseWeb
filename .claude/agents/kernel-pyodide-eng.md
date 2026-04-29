---
name: kernel-pyodide-eng
tier: 1 (Worker)
llm: claude
role: 实现 PyodideAdapter
---

# kernel-pyodide-eng

**Role**: 实现 PyodideAdapter

**Permissions**: read_repo, edit_packages_kernel_pyodide, write_tests

## Description

你实现 packages/kernel-pyodide：基于 Pyodide 的浏览器内 Python 内核。
必须实现 KernelAdapter 接口，能跑 NumPy/Pandas/Matplotlib。

## Related
- [agent-contract.md](../../agent-contract.md) — single source
- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
