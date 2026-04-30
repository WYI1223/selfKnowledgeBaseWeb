# @skb/block-image Contract

第一个真实 `BlockRegistry` 消费者（Wave 2 Track C1 template）。
后续 `block-code` / `block-image` 等 simple block 包按本包结构 clone（codex-block-generator + scripts/new-block.ts）。

## Public surface

两个 entry：

- `.` (root barrel) — re-export `./core`
- `./core` — headless 层
  - `imageCore: BlockCoreDefinition<typeof propsSchema>` — name=`'image'` / kind=`'component'` / mdxComponent=`'Image'`
  - `serializeImage(node) → mdxJsxFlowElement` — Tiptap → mdast
  - `parseImage(mdast) → TiptapNode` — mdast → Tiptap
  - 类型: `ImageTiptapNode` / `ImageMdastJsxElement`

`propsSchema` 形状（见 `src/core/core-definition.ts`）:

```typescript
const propsSchema = z.object({
  src: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
}).strict();
```

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`

- **`coreName='image'` (kebab-case)**: `imageCore.name` 与 `BlockRegistry.registerCore` 注册键一致。
- **`mdxComponent='Image'` (PascalCase)**: 与 `<Image .../>` JSX 标签一致。
- **Serialize / parse hook 命名**: `serializeImage` / `parseImage`。
- **Headless 自给**: `core/` 不 import 任何 React / Tiptap UI 模块；仅依赖 `@skb/block-foundation` + `zod`。
- **Self-validating serialize/parse**: `serializeImage` 调 `propsSchema.parse(node.attrs)`；`parseImage` 调 `propsSchema.parse(rawProps)`。

## Wave 3 mdx-bridge 路由集成（pending）

当前 `serializeImage` / `parseImage` 为稳定签名实现，等待 `mdx-bridge` routing PR 对接。

## Modifying this file

`imageCore` 公共字段 (`name` / `kind` / `propsSchema` / `mdxComponent`) 及
`serializeImage` / `parseImage` 签名修改需配套 mdx-bridge routing PR。

## Related

- [@skb/block-foundation CONTRACT](../block-foundation/CONTRACT.md)
- [@skb/block-foundation RFC](../block-foundation/RFC.md)
- [ADR-0003 headless / presentational 分层](../../docs/decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md)
- [ADR-0008 D1 dead-dep + D2 interface freeze](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
- [Wave 2 plan §Task C1](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
