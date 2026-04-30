# @skb/agent-tools Contract

## Public surface

- `toolSchemas` — 11 个 tool 的 `{description, input}` 对（Wave 1 仅类型定义）
  - 4 read-only：`list_pages` / `read_page` / `search` / `get_editor_state`
  - 7 mutating，1:1 wrap `editor-commands` 的全部 7 命令：`create_page` / `delete_page` / `insert_block` / `edit_block` / `delete_block` / `move_block` / `update_frontmatter`
- `ToolName` / `ToolInput<N>` 类型工具

## Phase 1 vs Phase 2b 分工

- Phase 1（本 Wave）：仅在此处冻结 schema
- Phase 2b：apps/api `agent_bridge.py` 实现真正的工具执行；UI 通过 WebSocket 触发

## Invariants（spec §2.6）

- mutating tools **必须 1:1 对应** `editor-commands` 命令（当前 7↔7）；不允许直接 import 业务逻辑
- 新 tool 加入必须先在此处定义 schema，然后 apps/api 才能实现
- mutating 工具的 input 一律 `commandSchemas.<x>.omit({ type: true })`（type 字面量在 dispatch 层添加，不要求 agent 输入）
- **edit_block 例外**：使用从 `@skb/editor-commands` 导入的 `editBlockInputSchema`，复用 `.refine(editBlockHasChange)` predicate 保证 props/content 至少一个非空（Track F R1 erratum）；NOT plain `commandSchemas.edit_block.omit({ type: true })`。`editBlockInputSchema` 本身就是 `editBlockBase.omit({ type: true }).refine(editBlockHasChange)` 的组合，因此 type 字面量同样不要求 agent 输入。
- read-only 工具用 slug 时复用 `editor-commands` 的 `slugSchema`，与命令侧统一校验
- **FROZEN：所有 read-only 工具的 input object 用 `.strict()`**；未知字段 reject（防止 agent 误传扩展字段）

## Modifying this file

`toolSchemas` 的任何字段或方法增删改一律需 ADR — **包括添加新 tool、放宽 `.strict()`、改 input shape**。spec §2.3 把 agent-tools 列为接口包，规则"改动需 ADR；全员同步"不区分 optional vs required。

原因：toolSchemas 在 Phase 2b agent_bridge 实现前先冻结，是 Claude / agent 调用契约；新增字段会改变 agent prompt 模板 + apps/api dispatch 表 + 类型生成。

## Related

- [editor-commands/CONTRACT.md](../editor-commands/CONTRACT.md) — 命令 schema 与 slug 权威源
- [设计规格 §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [apps/api/llm/CONTRACT.md](../../apps/api/app/llm/CONTRACT.md)
