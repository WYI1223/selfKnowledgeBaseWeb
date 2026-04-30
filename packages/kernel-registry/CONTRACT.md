# @skb/kernel-registry Contract

## Public surface

- `KernelRegistry` class — `register` / `get` / `list` / `startSession`
- 路由策略：JupyterBlock 在 frontmatter 写 `kernel="pyodide"` / `kernel="remote:gpu-box"`，`startSession(adapterId, sessionId)` 解析

## Invariants

- 每个 KernelAdapter id 全局唯一（`register` 重复 id 抛错）
- 注册顺序无关；`get` / `startSession` 查找 O(1)
- `list` 返回值为快照（readonly array），调用方修改不影响 registry

## Modifying this file

- 加方法可任意；改方法签名是契约破坏（影响 jupyter / runnable-code blocks）

## Related

- [kernel-adapter/CONTRACT.md](../kernel-adapter/CONTRACT.md)
- [设计规格 §1.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
