# @skb/editor-drag-handle Contract

Wave 2 editor 子模块模板（G3 目标）。

## Public surface

三个 entry：

- `.` (root barrel) — re-export `./core`
- `./core` — headless 层（无 React / Tiptap import）
  - `dragHandleActionSchema` / `dragHandleConfigSchema` — Zod `.strict()`
  - `defaultDragHandleConfig` — **5 actions**：
    - `duplicate` (`Ctrl+D`)
    - `delete` (`Delete`, `destructive: true`)
    - `moveUp` (`Ctrl+Shift+Up`, `command: move-up`)
    - `moveDown` (`Ctrl+Shift+Down`, `command: move-down`)
    - `selectBlock` (`Ctrl+A`)
  - `findAction(config, id)` / `listCommands(config)`
  - `buildMoveBlockInput(pageSlug, blockId, newPosition)` — 复用 `commandSchemas.move_block`
  - `defaultCommandBindings` — `Record<actionId, command>` frozen
  - 类型：`DragHandleAction` / `DragHandleConfig`
- `./ui-default` — React + Tiptap
  - `EditorDragHandle` — 块左侧悬停可见的拖拽手柄，点击弹出上下文菜单；支持拖拽起始（见实现说明）
  - `DRAG_HANDLE_ICONS` — SVG 图标 frozen Record（5 项）
  - `runDefaultDragHandleCommand(name, chain)` — 显式 `switch` 派发器，未知命令返回 `false`

## Invariants

- **Headless 自给**：`core/` 不 import React / Tiptap；仅依赖 `@skb/editor-commands` + `zod`
- **Schema strictness**：`dragHandleConfigSchema` / `dragHandleActionSchema` 一律 `.strict()`
- **命令入口结构化**：`buildMoveBlockInput` 与 `commandSchemas.move_block` 保持同构，避免字符串手写拼装导致的离散验证。
- **UI 行为约束**：
  - 组件在块 hover 时才显示（`visible`/容器 hover 控制）。
  - 点击主柄打开上下文菜单。
  - 主柄标记设置 `draggable`，允许由编辑器层消费的拖拽流；拖拽排序逻辑在文档层面继续对齐。
- **A11y**：`role="toolbar"` 与 action `menuitem`；`destructive` 命令独立样式。
- **CSS 变量绑定 design-tokens**：样式使用 `var(--skb-color-*)`。

## Wave 3 future

- 引入协作编辑下的拖拽排序一致性（并发 reorder 冲突处理、块级位置重放）
- 若 block-handle 与多人编辑状态同步，需保证拖拽/移动动作先落地为可重放命令。

## Modifying this file

`dragHandleActionSchema` / `dragHandleConfigSchema` / `EditorDragHandle` props / `defaultDragHandleConfig`
字段或值变更需 ADR。

## Related

- [@skb/editor-toolbar CONTRACT](../editor-toolbar/CONTRACT.md) — sister G1 template authority
- [@skb/editor-slash-menu CONTRACT](../editor-slash-menu/CONTRACT.md) — sister G2 codex-clone
- [@skb/editor-commands CONTRACT](../editor-commands/CONTRACT.md) — `commandSchemas.move_block` 权威源
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #6
- [Wave 2 plan §Task G3](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
