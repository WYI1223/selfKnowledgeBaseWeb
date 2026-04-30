# @skb/content-types Contract

## Public surface

- `frontmatterSchema` — Zod schema 校验所有笔记 `index.mdx` 的 frontmatter
- `Frontmatter` — TypeScript type derived from schema
- `calloutPropsSchema` / `CalloutProps` — Wave 2 第一个 component block 的 props（示例 + 烟测）

## Invariants

- 单一权威源：apps/site / packages/mdx-bridge / packages/agent-tools 必须从这里 import 类型，不得各自定义
- Frontmatter 必含 `title` 与 `date`

## Modifying this file

公共 schema（`frontmatterSchema` / `Frontmatter` 类型 / `calloutPropsSchema` / `CalloutProps` 类型 + 未来其他 block props schema）的任何字段或值增删改一律需 ADR — **包括添加 optional 字段**。spec §2.3 把 content-types 列为接口包，规则"改动需 ADR；全员同步"不区分 optional vs required。

原因：新字段传播到 apps/site + mdx-bridge + agent-tools 三处；agent-tools schema 自动派生没有 ADR 协调会滞后于 content-types 主版本。

## Related

- [设计规格 §2.5](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md)
