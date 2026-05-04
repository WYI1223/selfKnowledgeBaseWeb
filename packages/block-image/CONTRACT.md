# @skb/block-image Contract

第一个真实 `BlockRegistry` 消费者（Wave 2 Track C1 template）。
后续 `block-code` / `block-image` 等 simple block 包按本包结构 clone（codex-block-generator + scripts/new-block.ts）。

## Public surface

四个 entry：

- `.` (root barrel) — re-export `./core` 与 `./ui-default`
- `./core` — headless 层
  - `imageCore: BlockCoreDefinition<typeof propsSchema>` — name=`'image'` / kind=`'component'` / mdxComponent=`'Image'`
  - `serializeImage(node) → mdxJsxFlowElement` — Tiptap → mdast
  - `parseImage(mdast) → TiptapNode` — mdast → Tiptap
  - 类型: `ImageTiptapNode` / `ImageMdastJsxElement`
- `./ui-default` — UI 定义与渲染入口
  - `imageUiDefault: BlockUIDefinition<typeof imageCore.propsSchema>` — default UI id = `'default'`
  - `ImageEditorView(props)` / `ImageRenderView(props)` — 同步的图像语义渲染层
  - `ImageBody(props)` — 输出 `<figure><img ...><figcaption>{alt}</figcaption></figure>`，固定 `loading="lazy"`
  - `IMAGE_THEME_TOKENS` — `Readonly<Record<string, ColorTokenName>>` 设计令牌消费清单（typed import from `@skb/design-tokens`，see Wave 3 PR #2 + ADR-0010 D3 #7a F3 闭环）
- `./ui-default/image.css` — 样式入口（design-token 变量约束；运行时颜色消费走 CSS variable `var(--color-*)`，TS 端 `IMAGE_THEME_TOKENS` 是 typed mirror）

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
- **`imageUiDefault` 契约**: `uiId='default'` 且 `coreName='image'`，使用 `defineUI` 且可通过 `BlockRegistry.registerUI` 注入。
- **语义 DOM 契约**: `ImageBody` 必须输出 `figure` 根节点并包含：
  - `<img src, alt, loading="lazy", width?, height?>`
  - `<figcaption>{alt}</figcaption>`
  - `data-image-loading` 根属性用于 loading-state 挂钩（目前固定 lazy，为未来变体预留）
- **图像尺寸契约**: `width`/`height` 在 props 缺省时不应硬编码 `img` 属性；当设置时保持数值透传（用于编辑与 SSR 形状一致性）。
- **Design-token 消费**: `image.css` via `var(--color-*)` 是运行时唯一消费路径；`./ui-default/theme-tokens.ts` 的 `IMAGE_THEME_TOKENS` 是 typed mirror，per [ADR-0008 D1](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) dead-dep mechanical scan 合规（CSS-only 消费不可见于 grep 审计；type-only `import { ColorTokenName } from '@skb/design-tokens'` 关闭 [ADR-0010 D3 #7a F3](../../docs/decisions/ADR-0010-wave-2-close.md)）。`image.css` 的 `var(--color-*)` 集合与 `IMAGE_THEME_TOKENS` 键集必须一致；不一致 `theme-tokens.test.ts` 失败。

## Wave 2 / Wave 3 约束

- Wave 2 scope（本次 C5b）:
  - 简单语义图像区块：`<figure>` + `<img>` + `<figcaption>`
- Wave 3 预留（invariant 兼容）:
  - 图库 / lightbox / blurhash 预览路径；当前 `data-image-loading` 作为语义扩展锚点可承接下一态态变体

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
