# @skb/editor-slash-menu Contract

This package is the `editor-*` slash-command launcher for editor surface actions.
It is generated from the editor-toolbar template and adapted to slash-menu semantics.

## Public surface

- `./` (root barrel): re-exports `./core`.
- `./core`: headless config and schema:
  - `slashMenuItemSchema` / `slashMenuConfigSchema` (`.strict()`), where `slashMenuConfig` is `{ items: SlashMenuItem[] }`
  - `defaultSlashMenuConfig` (10 items)
    - heading: `h1`, `h2`, `h3` → `toggleHeading1/2/3`
    - list: `bulletList`, `orderedList`, `taskList` → `toggleBulletList/Ordered/Task`
    - block: `callout`, `code`, `math` → `insertCallout/insertCodeBlock/insertMathBlock`
    - media: `image` → `insertImage`
  - `findItem(config, itemId)`, `listCommands(config)` helpers
  - `buildEditBlockInput(pageSlug, blockId, draft)` pass-through to `editBlockInputSchema.parse`
  - `SlashMenuItem`, `SlashMenuConfig` types
- `./ui-default`: React + Tiptap consumer:
  - `EditorSlashMenu` using `FloatingMenu`
  - `SLASH_MENU_ICONS`
  - `runDefaultSlashCommand(name, chain)` and `isDefaultCommandActive(editor, command)` explicit switch dispatchers

## Behavioural invariants

- Slash trigger opens only when text before cursor matches `/(?:^|\s)\/[^\s]*$/`.
- Menu items filter live by `item.trigger` prefix from user input after `/`.
- Selection supports ArrowUp/ArrowDown and Enter; item click also executes command.
- Command execution deletes the `/` query range before dispatching, then calls
  `runDefaultSlashCommand`.
- Unknown command strings always return `false` without throwing.
- All default items must be exercised by dispatch tests (including `every defaultSlashMenuConfig item id is dispatch-routable`).
- Headless layer remains free of React/Tiptap imports.

## Wave 3 future (deferred)

Wave 3 will add:

1. custom item registration (consumer-provided `slashMenuConfig` extension APIs)
2. drag-and-drop reorder of default menu items in UI

These features require both `editor-slash-menu` UI updates and any prerequisite command-schema updates in `editor-commands`/`block-foundation`, then a dedicated `Wave 3` PR.

## Related

- [@skb/editor-toolbar CONTRACT](../editor-toolbar/CONTRACT.md) — sister G1 template authority
- [@skb/editor-drag-handle CONTRACT](../editor-drag-handle/CONTRACT.md) — sister G3 codex-clone
- [@skb/editor-commands CONTRACT](../editor-commands/CONTRACT.md) — `editBlockInputSchema` 权威源
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #6
- [Wave 2 plan §Task G2](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
