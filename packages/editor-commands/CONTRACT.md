# @skb/editor-commands Contract

## Public surface

- `commandSchemas` — 7 个 Zod 命令 schema（discriminated by `type` literal）：
  - `create_page` / `delete_page`
  - `insert_block` / `edit_block` / `delete_block` / `move_block`
  - `update_frontmatter`
- `parseCommand(input)` — 校验任意 unknown 输入并返回 discriminated `Command`
- `slugSchema` — `[a-z0-9-]+` 正则；用于全部 `pageSlug` 字段，防止 path traversal / 大小写混乱（apps/api/CONVENTIONS.md §1）
- `editBlockInputSchema` — Zod schema for `edit_block` agent tool input. Composes `editBlockBase.omit({ type: true }).refine(at-least-one-of-props-or-content)`. Exported for cross-package consumption by `@skb/agent-tools` (single source of truth for the refine logic; both `parseCommand` 路径与 `toolSchemas.edit_block.input` 共用此 schema 与 predicate)。重命名 / 删除需 ADR。
- `editBlockHasChange(v)` — predicate paired with `editBlockInputSchema`；同时被 `commandSchemas.edit_block` 与 `editBlockInputSchema` 的 `.refine()` 复用，保证二者无 drift。
- `Command` / `CommandType` / `ParseCommandResult` 类型工具

每个 schema 是 Zod，可同时验证 UI 操作产生的命令与 agent 工具调用产生的命令。

## Invariants（spec §2.6 关键不变量）

- **所有编辑器变更必须经此层** —— UI 操作 / agent 工具 / 脚本批改皆同
- 命令是不可变数据；执行器（Wave 3 editor-shell + apps/api）才有副作用
- 命令字段一律 camelCase（含 `pageSlug`，全部 7 命令统一）；type 字段值一律 snake_case
- **FROZEN：所有 object schema 用 `.strict()`，未知字段一律 reject**（防止 agent 误传、防止字段名漂移）
- **Frontmatter schema authority**：从 `@skb/content-types` 导入 `frontmatterSchema`，但本包消费时一律加 `.strict()` 防止 agent typo 被静默 strip（R3 erratum）。`create_page.frontmatter` 用 `frontmatterSchema.strict()`；`update_frontmatter.patch` 用 `frontmatterSchema.strict().partial()`。不重新定义结构。
- **Slug schema authority**：`slugSchema` 在本包定义并导出（regex `/^[a-z0-9-]+$/`），`@skb/agent-tools` 复用同一 schema 供 `read_page` 等 tool 输入校验，与 apps/api/CONVENTIONS.md §1 slug 约束对齐。

## Modifying this file

`commandSchemas` / `parseCommand` / `slugSchema` / `editBlockInputSchema` / `editBlockHasChange` 的任何字段或方法增删改一律需 ADR — **包括添加新命令、添加 optional 字段、放宽 `.strict()`**。spec §2.3 把接口包归为"改动需 ADR；全员同步"；spec §2.6 把 editor-commands 列为 Phase 1 必建的命令模式 surface（agent integration 基石）。

原因：editor-commands 是 agent-tools 的源头（mutating tools 1:1 wrap commandSchemas via `.omit({type:true})`；edit_block 路径走 `editBlockInputSchema` 共享 predicate）；通过 agent-tools 接到 Phase 2b apps/api dispatch；任何 schema 变化都要协调 4+ 个层（editor-shell / agent-tools / apps/api / agent prompt 模板）。

## Related

- [设计规格 §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [content-types/CONTRACT.md](../content-types/CONTRACT.md) — frontmatter 权威源
- [agent-tools/CONTRACT.md](../agent-tools/CONTRACT.md)
