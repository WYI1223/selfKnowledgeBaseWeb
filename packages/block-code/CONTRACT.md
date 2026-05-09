# @skb/block-code Contract

C5a scope：`packages/block-code/ui-default`（Wave 2 Track C5a）基于 `packages/block-callout` 模板交付代码块可视化层。

## Public surface

四个 entry：

- `.`（root barrel） — re-export `./core` + `./ui-default`
- `./core` — headless 层
  - `codeCore: BlockCoreDefinition<typeof propsSchema>` — name=`'componentCode'` / kind=`'component'` / mdxComponent=`'Code'` (Wave 6 carry-forward #15b 2026-05-08 — was `'code'`; renamed to escape ProseMirror node/mark namespace collision with StarterKit's inline `code` mark; user-facing slash-menu label and MDX tag unchanged)
  - `serializeCode(node) → mdxJsxFlowElement` — Tiptap → mdast（Wave 3 mdx-bridge routing 时启用）
  - `parseCode(mdast) → TiptapNode` — mdast → Tiptap（同上）
  - 类型: `CodeTiptapNode` / `CodeMdastJsxElement`
- `./ui-default` — presentational 层（Wave C5a）
  - `codeUiDefault: BlockUIDefinition<typeof codeCore.propsSchema>` — coreName=`'componentCode'` / uiId=`'default'` (matches `codeCore.name` post-#15b rename)
  - `CodeEditorView` / `CodeRenderView` — `ComponentType<BlockViewProps<typeof codeCore.propsSchema>>`，DOM 形状字节级一致（共享 `CodeBody` 原语）
  - `CodeBody` — 视觉单一权威 primitive，editor + render 双视图都嵌入
  - `CODE_THEME_TOKENS` — `Readonly<Record<string, ColorTokenName>>` 设计令牌消费清单（typed import from `@skb/design-tokens`，see Wave 3 PR #2 + ADR-0010 D3 #7a F3 闭环）
- `./ui-default/code.css` — 视觉规则单一来源，按 `[data-code-language]` + 设计令牌渲染（运行时颜色消费走 CSS variable `var(--color-*)`；TS 端 `CODE_THEME_TOKENS` 是 typed mirror，per ADR-0008 D1 dead-dep 合规）

`propsSchema` 形状（见 `src/core/core-definition.ts`）：

```typescript
z.object({
  language: z.string().min(1),
  code: z.string(),
  showLineNumbers: z.boolean().default(true),
}).strict();
```

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`

block-code 通用不变量：

- **`coreName='componentCode'` (camelCase post-#15b; kebab-case for siblings)**: `codeCore.name` 字面值固定，与 `BlockRegistry.registerCore` 注册键一致。Wave 6 carry-forward #15b 2026-05-08 renamed from kebab-case `'code'` to camelCase `'componentCode'` to escape the ProseMirror node/mark namespace collision with StarterKit's inline `code` MARK; sibling block kinds (`callout`, `image`, `math`, `pdf`, `jupyter`, `nn-viz`, `agent-flow`) retain kebab-case naming. The `BlockKind` union literal in `@skb/editor-shell/src/registry-wire.tsx` reflects this asymmetry.
- **`mdxComponent='Code'` (PascalCase)**: 与 `<Code ...>` JSX 标签一致；mdx-bridge 通过 `mdxJsxFlowElement.name` 字符串路由。
- **Serialize / parse hook 命名**: `serializeCode` / `parseCode`，verb-as-prefix 约定。
- **`propsSchema single authority`**: 仅在 `src/core/core-definition.ts` 定义，`serializeCode` / `parseCode` / 测试 import `codeCore.propsSchema`。
- **Self-validating serialize/parse**: `serializeCode` 调 `codeCore.propsSchema.parse(node.attrs)`；`parseCode` 调 `codeCore.propsSchema.parse(rawProps)`；若不满足约束必须 fail。
- **Registry integration**: `registerCore(codeCore)` + `getCore('componentCode')` round-trip (post-#15b rename).

block-code ui-default 特定不变量：

- **共享 DOM 原语**: `CodeEditorView` 与 `CodeRenderView` 均只透传 `code` props 到 `CodeBody`，因此结构必须一致（差异仅在外部宿主交互层）。
- **`data-code-language` + `data-language`**: `CodeBody` 总是 emit `data-code-language`（容器）和 `data-language`（`<pre>/<code>`）。
- **行号行为锁定**: `showLineNumbers=true` 时，`<pre>` 必含 `.skb-code-line-numbers` class 并逐行渲染 `.skb-code-line` + `.skb-code-lineno`；反之不渲染行号节点。
- **语言标签展示**: 语言名（`props.language`）必须显示在可见 label 区域。
- **CSS 单一视觉来源**: 所有视觉规则集中在 `./ui-default/code.css`，React 组件不带 `style` inline。
- **Design-token 消费**: `code.css` via `var(--color-*)` 是运行时唯一消费路径；`./ui-default/theme-tokens.ts` 的 `CODE_THEME_TOKENS` 是 typed mirror，per [ADR-0008 D1](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) dead-dep mechanical scan 合规（CSS-only 消费不可见于 grep 审计；type-only `import { ColorTokenName } from '@skb/design-tokens'` 关闭 [ADR-0010 D3 #7a F3](../../docs/decisions/ADR-0010-wave-2-close.md)）。`code.css` 的 `var(--color-*)` 集合与 `CODE_THEME_TOKENS` 键集必须一致；不一致 `theme-tokens.test.ts` 失败。
- **Wave 3 语法高亮延期**: 现阶段仅渲染纯文本 `<pre><code>`；高亮能力（`shiki` / `prism`）移至 Wave 3。

## mdx-bridge 路由集成

1. `mdx-bridge/parse.ts` 拦截 `mdxJsxFlowElement{name:'Code'}` → `parseCode(node)`.
2. `mdx-bridge/serialize.ts` 拦截 `type='componentCode'` → `serializeCode(node)` (Wave 6 carry-forward #15b 2026-05-08 — was `type='code'` pre-rename).
3. children 递归走既有 mdx-bridge 流程.

JSX expression-form attrs (`code={` template literal `}`, `showLineNumbers={true}`) are supported post Wave 6 carry-forward #16 (2026-05-08): `parseCode` consumes `evalAttrExpression` from `@skb/block-foundation` so the production sample-blocks fixture (`<Code language="python" code={` template `} />`) parses without falling back to mdx-bridge softParse placeholders. Serialize continues to emit string-form for byte-stable round-trip.

## Forward-compat

- `Wave 3 mdx-bridge integration`（见上节）。
- `Wave 3 syntax highlighting`：将当前 `CodeBody` 的纯文本 `<code>` 升级到 `shiki`/`prism`，新增 token-class 映射与主题绑定；当前迭代仅记录为未来工作。
