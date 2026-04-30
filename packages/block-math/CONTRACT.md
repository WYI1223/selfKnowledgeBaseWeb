# @skb/block-math Contract

KaTeX-backed math block (Wave 2 Track D1）。第一个 `render-block-eng` 包；
hand-craft（不走 codex-block-generator），block-pdf (D2) 同 owner 独立 hand-craft。

## Public surface

四个 entry：

- `.` (root barrel) — re-export `./core`
- `./core` — headless 层
  - `mathCore: BlockCoreDefinition<typeof propsSchema>` — name=`'math'` / kind=`'render'` / mdxComponent=`'Math'`
  - `serializeMath(node) → mdxJsxFlowElement` — Tiptap → mdast (Wave 3 mdx-bridge routing 时启用)
  - `parseMath(mdast) → TiptapNode` — mdast → Tiptap (同上)
  - 类型: `MathTiptapNode` / `MathMdastJsxElement`
- `./ui-default` — presentational 层
  - `mathUiDefault: BlockUIDefinition<typeof mathCore.propsSchema>` — uiId=`'default'`
  - `MathEditorView` / `MathRenderView` — `ComponentType<BlockViewProps<...>>`
  - `renderMath(expression, display) → string` — KaTeX HTML 字符串生成器（**single authority** for editor + SSR + NodeView，定义在 `src/ui-default/render-math.ts`）
  - `MATH_TOKENS: MathTokens` — design-token name witnesses（`@skb/design-tokens` 类型绑定）
  - sibling: `Math.astro`（apps/site SSR 直接 import，亦走 `renderMath`）
- `./ui-default/math.css` — 视觉规则单一来源（design-token-bound，error/fg color 走 `var(--color-*)`）

### Consumer 使用方式

`apps/site` / `editor-shell` 必须 `import '@skb/block-math/ui-default/math.css';`
方能渲染 `.katex-error` 错误态样式以及 display/inline 间距 token。同时
consumers 必须 `import 'katex/dist/katex.css';`（KaTeX 自身字体 + 内部布局；
本包不重发包，避免重复加载）。

`propsSchema` 形状（见 `src/core/core-definition.ts`）：

```typescript
z.object({
  expression: z.string().min(1),
  display: z.boolean().default(false),
}).strict()
```

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`
（即 `BlockRegistry.listCores()` / `listUIs(coreName)` defensive-copy 行为、
`propsSchema` 必须 `.strict()`、同 `coreName` 多 UI 时 `getUI(coreName)` 取首注册 `uiId`、
serialize/parse 由本包 `core/` own 不在 foundation 注册）。

block-math 特定不变量：

- **`coreName='math'` (kebab-case)** + **`mdxComponent='Math'` (PascalCase)**:
  `mathCore.name`/`.mdxComponent` 字面值固定，与 BlockRegistry / mdx-bridge 路由 ([RFC §1](../block-foundation/RFC.md#1-core-side)) 一致
- **Hook 命名 verb-as-prefix**: `serializeMath` / `parseMath` / `renderMath` ([RFC §5](../block-foundation/RFC.md#5-serialize--parse-hook-ownership-scope-clarification))
- **`uiId='default'` reserved**: inherit foundation 的 `Default UI lookup` 不变量（首注册即 default）
- **KaTeX 是 runtime authority** + **renderMath single authority**: `src/ui-default/render-math.ts`
  唯一 wrap `katex.renderToString`（ADR-0006 item #5 algorithm replication —
  authority = `katex` npm 包）。Math.tsx + Math.astro 都 import `./render-math`；
  ssr-render.test.ts 4-row corpus 检测 inline 漂移
- **Headless 自给**: `core/` 不 import React / Tiptap / KaTeX；仅依赖 `@skb/block-foundation` + `zod`（ADR-0003 D1）。`ui-default/` 才 import React + katex + design-tokens
- **propsSchema single authority**: 仅在 `src/core/core-definition.ts` 定义；ui-default / serialize / parse / 测试均 import `mathCore.propsSchema`（ADR-0006 item #4）
- **Self-validating serialize/parse**: `serializeMath` / `parseMath` 各自调 `propsSchema.parse`（parse 侧 display 先字符串 coerce → boolean）；契约偏离在 mdx-bridge 路由前 throw
- **错误显式（不静默）**: KaTeX 配 `throwOnError: false` + `strict: 'ignore'`：
  软错误内联 `color:#cc0000` 片段（source visible），硬错误 `.katex-error` class；
  `math.css` 两条路径都 escalate 到 `--color-error` token 的 bordered box（spec D1 要求），不许 silent fallback

## Wave 3 mdx-bridge 路由集成（pending）

当前 `serializeMath` / `parseMath` 是 stub —— 暴露稳定签名，未被 mdx-bridge 消费。
Wave 3 mdx-bridge routing table PR 会：

1. 在 `mdx-bridge/parse.ts` 的 `mdastBlockToTiptap` 拦截 `mdxJsxFlowElement{name:'Math'}` →
   `parseMath(node)` → 把返回 `MathTiptapNode` 嵌入 doc.content
2. 在 `mdx-bridge/serialize.ts` 的 `tiptapToMdastBlock` 拦截 `type='math'` →
   `serializeMath(node)` → 返回 `mdxJsxFlowElement` 进 mdast
3. math block 无 children，递归不展开

## Forward-compat consumers

- **Z0 sample-blocks**: `<Math expression="\\int_0^1 x^2 dx" display />` 实例
- **apps/site SSR**: import `@skb/block-math/ui-default/Math.astro`；consumer 同 PR 加 katex CSS import
- **Wave 3 mdx-bridge integration**: 见上节
- **Tiptap NodeView (editor-shell)**: 用 `MathEditorView`；NodeView wrapper 调 `renderMath` 直拿 HTML 字符串

## Modifying this file

`mathCore` 公共字段 (`name` / `kind` / `propsSchema` / `mdxComponent`) 与 `mathUiDefault`
公共字段 (`coreName` / `uiId` / `EditorView` / `RenderView`) 变更需 ADR（与 block-foundation
同 freeze 级别 —— 触发 mdx-bridge 路由 + sample-blocks 同步更新）。
`serializeMath` / `parseMath` 签名变更需配 mdx-bridge routing PR；`renderMath` 签名变更
同步 Math.astro + Math.tsx 调用点（authority = ui-default/render-math.ts；ssr-render.test.ts 防漂移）。

## Related

- [@skb/block-foundation CONTRACT](../block-foundation/CONTRACT.md) — `BlockCoreDefinition` / `BlockUIDefinition` 接口权威
- [@skb/block-foundation RFC](../block-foundation/RFC.md) — registration walkthrough
- [@skb/block-callout CONTRACT](../block-callout/CONTRACT.md) — sister-doc (Wave 2 simple-block template)
- [ADR-0003 headless / presentational 分层](../../docs/decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3 + #4 + #5
- [ADR-0008 D1 dead-dep + D2 interface freeze](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
- [Wave 2 plan §Task D1](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
