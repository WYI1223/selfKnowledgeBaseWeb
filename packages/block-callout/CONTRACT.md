# @skb/block-callout Contract

第一个真实 `BlockRegistry` 消费者（Wave 2 Track C1 template）。
后续 `block-code` / `block-image` 等 simple block 包按本包结构 clone（codex-block-generator + scripts/new-block.ts）。

## Public surface

四个 entry：

- `.` (root barrel) — re-export `./core` + `./ui-default`
- `./core` — headless 层
  - `calloutCore: BlockCoreDefinition<typeof propsSchema>` — name=`'callout'` / kind=`'component'` / mdxComponent=`'Callout'`
  - `serializeCallout(node) → mdxJsxFlowElement` — Tiptap → mdast (Wave 3 mdx-bridge routing 时启用)
  - `parseCallout(mdast) → TiptapNode` — mdast → Tiptap (同上)
  - 类型: `CalloutTiptapNode` / `CalloutMdastJsxElement`
- `./ui-default` — presentational 层（Wave 2 Track C2）
  - `calloutUIDefault: BlockUIDefinition<typeof calloutCore.propsSchema>` — coreName=`'callout'` / uiId=`'default'`
  - `CalloutEditorView` / `CalloutRenderView` — `ComponentType<BlockViewProps<typeof calloutCore.propsSchema>>`，DOM 形状字节级一致（共享 `CalloutBody` 原语）
  - `CalloutBody` — 视觉单一权威 primitive，editor + render 双视图都嵌入
  - `VARIANT_TOKENS` — `Record<Variant, { label, accentToken: ColorTokenName }>` 共享视觉元数据
  - `VARIANT_ICONS` — `Record<Variant, ComponentType>`，4 个手画 SVG（无 emoji，per ui-ux-pro-max `no-emoji-icons` rule）
  - 类型: `Variant` (`'note' | 'tip' | 'warning' | 'danger'`)
- `./ui-default/callout.css` — 视觉规则单一来源
  - 选择器契约: 所有变体规则锁定在 `[data-callout-variant="…"]` 上（CalloutBody 总是 emit）
  - 颜色完全来自 `@skb/design-tokens` CSS 变量（`var(--color-X)` 形式），不允许硬编码 hex / rgb 字面值
  - 消费方 (`apps/site` / `editor-shell`) 必须在启动时 import 一次：`import '@skb/block-callout/ui-default/callout.css';`

`propsSchema` 形状（见 `src/core/core-definition.ts`）：

```typescript
z.object({
  variant: z.enum(['note', 'tip', 'warning', 'danger']),
  title: z.string().optional(),
}).strict()
```

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`
（即 `BlockRegistry.listCores()` / `listUIs(coreName)` defensive-copy 行为、
`propsSchema` 必须 `.strict()`、同 `coreName` 多 UI 时 `getUI(coreName)` 取首注册 `uiId`、
serialize/parse 由本包 `core/` own 不在 foundation 注册）。

block-callout 特定不变量：

- **`coreName='callout'` (kebab-case)**: `calloutCore.name` 字面值固定，与 `BlockRegistry.registerCore`
  注册键一致；后续 `block-code` / `block-image` 同 `coreName` kebab-case 约定
- **`mdxComponent='Callout'` (PascalCase)**: 与 `<Callout variant=...>` JSX 标签一致；
  mdx-bridge 通过 `mdxJsxFlowElement.name` 字符串路由（[block-foundation RFC §1](../block-foundation/RFC.md#1-core-side)）
- **Serialize / parse hook 命名**: `serializeCallout` / `parseCallout`，verb-as-prefix
  约定（[RFC §5](../block-foundation/RFC.md#5-serialize--parse-hook-ownership-scope-clarification)）
- **`uiId='default'` reserved**: `calloutUIDefault.uiId === 'default'`；本包 inherit
  foundation 的 `Default UI lookup` 不变量（首注册即 default）
- **EditorView / RenderView byte-equivalent DOM**: 两视图都通过 `CalloutBody` 原语
  渲染，DOM tree / class 名 / `data-callout-variant` / `role` / `aria-label`
  完全一致；唯一差异是 `content` 缺省时 EditorView 显示 `.skb-callout-empty` 占位、
  RenderView 直接渲染空 children。任何分歧都触发 `ui-default.test.tsx` byte-equiv 用例 fail
- **CSS = single visual authority**: 视觉规则只在 `ui-default/callout.css`，
  React 组件不带 inline `style`（happy-dom 测试拒绝 `rgb(var())` 字面值，所以
  variant 颜色只能走 CSS data-attribute 选择器路径）；任何变体颜色变更都改 callout.css
  + design-tokens 任一处即可，不必 touch React 树
- **No emoji in icons**: `VARIANT_ICONS` 全部为 hand-traced SVG (24×24 stroke 1.75)，
  per ui-ux-pro-max `no-emoji-icons` rule + spec §3.5
- **Headless 自给**: `core/` 不 import 任何 React / Tiptap UI 模块；仅依赖
  `@skb/block-foundation` 类型 + `zod`（ADR-0003 D1）
- **propsSchema single authority**: 仅在 `src/core/core-definition.ts` 定义，
  ui-default / serialize / parse / 测试均 import `calloutCore.propsSchema`，
  不允许在 consumer 处 inline 重复（ADR-0006 item #4）
- **Self-validating serialize/parse**: `serializeCallout` 调 `propsSchema.parse(node.attrs)`；
  `parseCallout` 调 `propsSchema.parse(rawProps)`。任何契约偏离在 mdx-bridge 路由前已 throw
- **Registry integration**: `registerCore(calloutCore)` + `getCore('callout')` round-trip —
  see [`src/__tests__/registry-integration.test.ts`](src/__tests__/registry-integration.test.ts)

## Wave 3 mdx-bridge 路由集成（pending）

当前 `serializeCallout` / `parseCallout` 是 stub —— 暴露稳定签名，未被 mdx-bridge 消费。
Wave 3 mdx-bridge routing table PR 会：

1. 在 `mdx-bridge/parse.ts` 的 `mdastBlockToTiptap` 拦截 `mdxJsxFlowElement{name:'Callout'}` →
   `parseCallout(node)` → 把返回 `CalloutTiptapNode` 嵌入 doc.content
2. 在 `mdx-bridge/serialize.ts` 的 `tiptapToMdastBlock` 拦截 `type='callout'` →
   `serializeCallout(node)` → 返回 `mdxJsxFlowElement` 进 mdast
3. children 递归走 mdx-bridge 现有 inline / block 处理

集成完成后，`__tests__/fixtures/` 下三组 fixture 移交给 `packages/mdx-bridge/__tests__/fixtures/`
（编号 10-12）配 RTT 测试（`mdx-doctor` 强制 byte-equivalent 双向）。

## Forward-compat consumers

- **Wave 3 mdx-bridge integration**: 见上节
- **Wave 2 后续 block packages**: `block-code` / `block-image` / `block-math` 等按本包
  结构 clone (codex-block-generator template source)；`scripts/new-block.ts` 模板
  source = `packages/block-callout/`。clone 时 ADR-0008 D1 由模板带过：
  `package.json#dependencies` 含 `@skb/design-tokens`（type-only `ColorTokenName` import
  in `variant-tokens.ts` 满足 dead-dep grep），`tsconfig.json#references` 含
  `../design-tokens`，`callout.css` 模板 mirror visual rules under
  `[data-<block>-variant]` 选择器

## Modifying this file

`calloutCore` 公共字段 (`name` / `kind` / `propsSchema` / `mdxComponent`) 的字段或值变更需 ADR
（与 block-foundation/CONTRACT.md 同 freeze 级别 —— 改 propsSchema 形状 / 改 mdxComponent /
改 kind 都触发 mdx-bridge 路由 + ui-default + sample-blocks 同步更新）。

`serializeCallout` / `parseCallout` 签名变更需配 mdx-bridge routing PR 同步（强耦合）。

## Related

- [@skb/block-foundation CONTRACT](../block-foundation/CONTRACT.md) — `BlockCoreDefinition` 接口权威
- [@skb/block-foundation RFC](../block-foundation/RFC.md) — registration walkthrough（本包是 §1 + §3 + §5 唯一真 consumer）
- [ADR-0003 headless / presentational 分层](../../docs/decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3 + #4
- [ADR-0008 D1 dead-dep + D2 interface freeze](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
- [Wave 2 plan §Task C1](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
