# @skb/block-code Contract

C3 scope：`packages/block-code/core`（Wave 2 Track C3）。`block-code` 先上核心层，不包含 `ui-default`。

## Public surface

两个 entry：

- `.`（root barrel） — re-export `./core`
- `./core` — headless 层
  - `codeCore: BlockCoreDefinition<typeof propsSchema>` — name=`'code'` / kind=`'component'` / mdxComponent=`'Code'`
  - `serializeCode(node) → mdxJsxFlowElement` — Tiptap → mdast（Wave 3 mdx-bridge routing 时启用）
  - `parseCode(mdast) → TiptapNode` — mdast → Tiptap（同上）
  - 类型: `CodeTiptapNode` / `CodeMdastJsxElement`

`propsSchema` 形状（见 `src/core/core-definition.ts`）：

```typescript
const propsSchema = z.object({
  language: z.string().min(1),
  code: z.string(),
  showLineNumbers: z.boolean().default(true),
}).strict();
```

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`

block-code 特定不变量：

- **`coreName='code'` (kebab-case)**: `codeCore.name` 字面值固定，与 `BlockRegistry.registerCore` 注册键一致；后续 `block-image` 采用 `coreName` kebab-case 约定。
- **`mdxComponent='Code'` (PascalCase)**: 与 `<Code ...>` JSX 标签一致；mdx-bridge 通过 `mdxJsxFlowElement.name` 字符串路由。
- **Serialize / parse hook 命名**: `serializeCode` / `parseCode`，verb-as-prefix 约定。
- **`propsSchema single authority`**: 仅在 `src/core/core-definition.ts` 定义，`serializeCode` / `parseCode` / 测试 import `codeCore.propsSchema`。
- **Self-validating serialize/parse**: `serializeCode` 调 `codeCore.propsSchema.parse(node.attrs)`；`parseCode` 调 `codeCore.propsSchema.parse(rawProps)`；若不满足约束必须 fail。
- **Registry integration**: `registerCore(codeCore)` + `getCore('code')` round-trip。

## Wave 3 mdx-bridge 路由集成（pending）

1. `mdx-bridge/parse.ts` 拦截 `mdxJsxFlowElement{name:'Code'}` → `parseCode(node)`。
2. `mdx-bridge/serialize.ts` 拦截 `type='code'` → `serializeCode(node)`。
3. children 递归走既有 mdx-bridge 流程。

## Forward-compat

- `block-code` 的 `ui-default` 由 Wave C5a 或后续 PR 补齐。
- `src/ui-default/**`、`@skb/design-tokens` 依赖与 `./ui-default` 导出不应在 C3 合入。
