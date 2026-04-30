# @skb/editor-toolbar Contract

第一个 editor-* sub-module（Wave 2 Track G1 template）。
后续 `editor-slash-menu` / `editor-drag-handle` 按本包结构 clone（codex-block-generator）。

## Public surface

三个 entry：

- `.` (root barrel) — re-export `./core`
- `./core` — headless 层（无 React / Tiptap import）
  - `toolbarConfigSchema` / `toolbarButtonSchema` — Zod `.strict()`
  - `defaultToolbarConfig` — **9 default buttons**, grouped by Tiptap surface category:
    - **Marks via StarterKit (3)**: `bold` / `italic` / `strike`
    - **Headings via StarterKit (3)**: `h1` / `h2` / `h3` (all dispatch `toggleHeading({level: N})`)
    - **Lists via StarterKit (2)**: `bulletList` / `orderedList`
    - **Inline code via StarterKit (1)**: `code`
  - `findButton(config, id)` / `listCommands(config)` — config 查询工具
  - `buildEditBlockInput(pageSlug, blockId, draft)` — 调 `editBlockInputSchema.parse`，
    把 toolbar 触发的 selection 改动收敛为 Wave 1 命令模式入参（spec §2.6）
  - `defaultCommandBindings` — `Record<buttonId, tiptapChainCommand>` frozen
  - 类型：`ToolbarButton` / `ToolbarConfig`
- `./ui-default` — React + Tiptap 消费者
  - `EditorToolbar` — `BubbleMenu` 浮动工具条；接 `editor: Editor | null` + 可选 `config`
  - `TOOLBAR_ICONS` — SVG 图标 frozen Record（9 项，与 `defaultToolbarConfig` 严格对齐）；按 `button.icon` key 查表
  - `runDefaultCommand(name, chain)` / `isDefaultCommandActive(editor, command)` — 显式
    `switch` 派发器，把命令名映射到真实的 Tiptap chain API 形状
    （e.g. `'toggleHeading1'` → `chain.focus().toggleHeading({level:1}).run()`）；未知命令返回 `false`，不抛错

## Invariants

- **Headless 自给**: `core/` 不 import React / Tiptap；仅依赖 `@skb/editor-commands` + `zod`
  （ADR-0003 D1）
- **Schema strictness**: `toolbarConfigSchema` / `toolbarButtonSchema` 一律 `.strict()`，
  unknown key 直接 reject（ADR-0006 item #3）
- **Cross-package consumer = structural identity**: `buildEditBlockInput` 复用
  `@skb/editor-commands` 的 `editBlockInputSchema`，不 inline 重复 refine 逻辑
  （ADR-0006 item #4 + memory `cross_package_consumer_pattern`）
- **Tiptap 命令派发显式枚举**: `runDefaultCommand` / `isDefaultCommandActive`
  用 `switch` 把 `ToolbarButton.command` 字面值映射到 Tiptap chain API。命令字符串 ≠
  Tiptap 方法名（heading 是 `toggleHeading({level:N})` 而非 `toggleHeading1`），动态
  `chain[name]()` 派发会 silent no-op；显式 switch 是该类 silent-bug 的唯一防线。
  **新增按钮三处必须同步**：(1) `defaultToolbarConfig.buttons` 增项，(2)
  `runDefaultCommand` 加 case，(3) `isDefaultCommandActive` 加 case + 同 PR 加 dispatch
  test。`__tests__/toolbar-dispatch.test.ts#every defaultToolbarConfig button id is dispatch-routable`
  自动卡口任何漏 case（ADR-0006 item #1：算法 + 比较器配套）

- **Prose-extension 对齐**: 默认按钮集合**严格子集**于 `@skb/block-foundation/prose.ts`
  `proseExtensions`（StarterKit + TaskList + Typography + tiptap-markdown）暴露的命令。
  `underline` / `link` 暂不在 prose 扩展中 → **不**进入 `defaultToolbarConfig`，避免
  silent no-op。Wave 3 若 block-foundation 加入 `@tiptap/extension-underline` /
  `@tiptap/extension-link`，本包同 PR 在 `defaultToolbarConfig` 加按钮 + `runDefaultCommand`
  加 case + 加 dispatch test（ADR-0006 item #1 + sister-package alignment）
- **A11y**: 工具条 `role="toolbar"` + `aria-label`；按钮 `aria-pressed` + `aria-label`
  含可选 `shortcut`；图标 `aria-hidden`
- **CSS 变量绑定 design-tokens**: `toolbar.css` 用 `var(--skb-color-*)`；
  consumer 应用 `@skb/design-tokens`（Wave 2 后续 site 集成时引入；本包 CSS 写
  fallback hex 让独立测试可用）

## Wave 3 future work

**Underline + link buttons deferred.** `defaultToolbarConfig` ships with 9 buttons (above)
because that's the strict subset of commands `@skb/block-foundation/src/prose.ts` `proseExtensions`
(StarterKit + TaskList + Typography + tiptap-markdown) actually exposes. To enable underline
and link, Wave 3 must do — in this order, in one cross-package PR:

1. `@skb/block-foundation`: add `@tiptap/extension-underline` (and a link-flow primitive — link
   needs an href-input UX, not a single chain command) to `proseExtensions`; bump deps in
   `package.json`; regenerate `pnpm-lock.yaml`.
2. `@skb/editor-toolbar` (this package, same PR): add the two buttons to `defaultToolbarConfig`,
   add their cases to `runDefaultCommand` + `isDefaultCommandActive`, restore the Underline +
   LinkIcon SVG entries to `TOOLBAR_ICONS`, and update the dispatch test "every default
   button id is dispatch-routable" to cover them.

Until that PR lands, the dispatch layer fails-safe: `runDefaultCommand('toggleUnderline', …)`
and `runDefaultCommand('setLink', …)` both return `false`. The G1 R2 dispatch tests assert
this fail-safe so accidental re-introduction of those button IDs without the prerequisite
prose-extension work is caught immediately (ADR-0006 item #1).

## G2 / G3 codex-clone 指引

`codex-block-generator`（[runbook](../../docs/runbooks/codex-tool-invocations.md#codex-block-generator)）
以本包为 source 模板生成姐妹 sub-module：

1. **G2 `editor-slash-menu`**: 改 `toolbarConfig` → `slashMenuConfig`（`items: SlashMenuItem[]`，
   每项 `command` 改成 `insert_block` 的 `blockType` + `props`）；改 `buildEditBlockInput`
   → `buildInsertBlockInput`，复用 `commandSchemas.insert_block`；UI 改成下拉列表（可
   保留 BubbleMenu 浮动定位）
2. **G3 `editor-drag-handle`**: 改 `toolbarConfig` → `dragHandleConfig`（仅 1-2 个动作：
   move-up / move-down / drag-start）；UI 改成 block 左侧拖拽 handle；`buildMoveBlockInput`
   复用 `commandSchemas.move_block`
3. **保持目录结构同形**: `core/{*-config.ts, command-bindings.ts, index.ts}` +
   `ui-default/{*.tsx, *.css, icons/, dispatch.ts}` + `__tests__/{*-config.test.ts, *-dispatch.test.ts}`
   （schema-validation 套件 ≥4 用例 + dispatch 套件覆盖每个 default 按钮 → Tiptap 真实 chain 形状）
4. **Dispatch 测试模板**: 每个 sub-module 必须配 `*-dispatch.test.ts`，用 `Proxy`-mock 的
   `ChainedCommands` 校验：(a) 每个 `defaultConfig` 按钮都能 dispatch 成功；(b) 命令名
   到真实 chain 方法 + 参数（如 `{level: N}`）的映射；(c) 未知命令早返回。
   `runDefaultCommand` switch 与 `defaultConfig` 之间的 drift 由 "every defaultConfig button
   id is dispatch-routable" 用例自动 catch（ADR-0006 item #1 闭环）

## Modifying this file

`toolbarConfigSchema` / `toolbarButtonSchema` / `EditorToolbar` props / `defaultToolbarConfig`
按钮列表的字段或值变更需 ADR — 与 `editor-commands/CONTRACT.md` 同 freeze 级别
（toolbar 是 editor-commands 的第一类 UI 触发源，schema 漂移会让 agent / UI 命令路径不一致，
spec §2.6）。

`buildEditBlockInput` 签名变更需配 `editor-commands` 同步 PR（强耦合于 `editBlockInputSchema`）。

## Related

- [@skb/editor-commands CONTRACT](../editor-commands/CONTRACT.md) — `editBlockInputSchema` 权威源
- [设计规格 §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md) — 命令模式 surface
- [ADR-0003 headless / presentational 分层](../../docs/decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #1 + #3 + #4 + #6
- [ADR-0008 D1 dead-dep policy](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
- [Wave 2 plan §Task G1](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
