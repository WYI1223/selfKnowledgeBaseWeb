# @skb/block-pdf Contract

PDF render block (Wave 2 Track D2). 第二个 `render-block-eng` 包；hand-craft
（与 D1 block-math 同 owner，独立实现，不走 codex-block-generator）。
浏览器原生 PDF viewer 是 runtime authority — 由 iframe + PDF Open Parameters
fragment 驱动；本包不在 npm 拉 react-pdf / pdfjs-dist 渲染依赖（ADR-0008 D1
dead-dep policy + Astro SSR 不可执行 react-pdf 的 worker 双重约束）。

## Public surface

五个 entry：

- `.` (root barrel) — re-export `./core`
- `./core` — headless 层
  - `pdfCore: BlockCoreDefinition<typeof propsSchema>` — name=`'pdf'` / kind=`'render'` / mdxComponent=`'Pdf'`
  - `serializePdf(node) → mdxJsxFlowElement` — Tiptap → mdast (Wave 3 mdx-bridge routing 时启用)
  - `parsePdf(mdast) → TiptapNode` — mdast → Tiptap (同上；处理 `searchable` boolean shorthand + `page` 数字 coerce)
  - 类型: `PdfTiptapNode` / `PdfMdastJsxElement`
- `./ui-default` — presentational 层
  - `pdfUiDefault: BlockUIDefinition<typeof pdfCore.propsSchema>` — uiId=`'default'`
  - `PdfEditorView` / `PdfRenderView` — `ComponentType<BlockViewProps<...>>`
  - `renderPdf(src, page, searchable) → PdfRenderDescriptor` — single-source 渲染描述器（**single authority** for Pdf.tsx + Pdf.astro，定义在 `src/ui-default/render-pdf.ts`）
  - `PDF_TOKENS: PdfTokens` — design-token name witnesses（`@skb/design-tokens` 类型绑定）
- `./ui-default/Pdf.astro` — apps/site SSR consumer 直接 import 的 Astro 组件（亦走 `renderPdf` authority）
- `./ui-default/pdf.css` — 视觉规则单一来源（design-token-bound，border / bg / error 走 `var(--color-*)`）

### Consumer 使用方式

`apps/site` / `editor-shell` 必须 `import '@skb/block-pdf/ui-default/pdf.css';`
方能渲染 iframe 容器边框 / 背景 / 间距 token。Astro page 直接
`import Pdf from '@skb/block-pdf/ui-default/Pdf.astro';`。consumer 不需要
import 任何 PDF 渲染库 —— 浏览器原生 viewer 处理 iframe 内容。

`propsSchema` 形状（见 `src/core/core-definition.ts`）：

```typescript
z.object({
  src: z.string().min(1),
  page: z.number().int().min(1).default(1),
  searchable: z.boolean().default(false),
}).strict()
```

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`
（即 `BlockRegistry.listCores()` / `listUIs(coreName)` defensive-copy 行为、
`propsSchema` 必须 `.strict()`、同 `coreName` 多 UI 时 `getUI(coreName)` 取首注册 `uiId`、
serialize/parse 由本包 `core/` own 不在 foundation 注册）。

block-pdf 特定不变量：

- **`coreName='pdf'` (kebab-case)** + **`mdxComponent='Pdf'` (PascalCase)**:
  `pdfCore.name`/`.mdxComponent` 字面值固定，与 BlockRegistry / mdx-bridge 路由
  ([RFC §1](../block-foundation/RFC.md#1-core-side)) 一致
- **Hook 命名 verb-as-prefix**: `serializePdf` / `parsePdf` / `renderPdf`
  ([RFC §5](../block-foundation/RFC.md#5-serialize--parse-hook-ownership-scope-clarification))
- **`uiId='default'` reserved**: inherit foundation 的 `Default UI lookup` 不变量（首注册即 default）
- **浏览器原生 PDF viewer 是 runtime authority** + **renderPdf single authority**:
  `src/ui-default/render-pdf.ts` 唯一构造 `${src}#page=${page}` PDF Open Parameters
  fragment + data-attr map（ADR-0006 item #5 algorithm replication —
  authority = browser embedded PDF viewer）。Pdf.tsx + Pdf.astro 都 import
  `./render-pdf`；`ssr-render.test.ts` 7-row corpus（含 fragment-strip
  hazard + empty-fragment edge）检测 inline 漂移，`byte-equivalence.test.tsx`
  双层验证：runtime SSR via `react-dom/server.renderToStaticMarkup` 锁
  Pdf.tsx markup，static-source regex 锁 Pdf.astro 调用点 + drift sentinel
  （禁止 `${...}#page=` inline 模板）。Wave 2 documented gap：未端到端
  byte-compare compiled Astro output（需要 Astro toolchain in vitest）；
  Wave 3 mdx-doctor PR 通过 apps/site build round-trip fixture 关闭该 gap
- **URL fragment authority**: `${src}#page=N` 由 `buildIframeSrc` 构造，
  src 携带 pre-existing `#fragment` 时（CMS anchor 等场景）先 strip，
  确保 `page=N` 是浏览器 viewer 的唯一 fragment directive
  （PDF Open Parameters 不可合并 fragment）；R2-1 hazard regression in
  ssr-render.test.ts
- **No DIY PDF parser / canvas rasterizer**: 本包不实现 PDF 渲染逻辑，不
  bundle pdfjs-dist 用于 viewer。`searchable=true` 走 build-time
  `scripts/extract-pdf-text.ts`（pdfjs-dist legacy build 用于文本抽取，runtime 不
  shared），与渲染路径完全解耦
- **Headless 自给**: `core/` 不 import React / Tiptap / PDF 库；仅依赖
  `@skb/block-foundation` + `zod`（ADR-0003 D1）。`ui-default/` 才 import React +
  design-tokens
- **propsSchema single authority**: 仅在 `src/core/core-definition.ts` 定义；
  ui-default / serialize / parse / 测试均 import `pdfCore.propsSchema`（ADR-0006 item #4）
- **Self-validating serialize/parse**: `serializePdf` / `parsePdf` 各自调
  `propsSchema.parse`（parse 侧 `searchable` 先 null/string coerce → boolean，
  `page` 先 string coerce → number）；契约偏离在 mdx-bridge 路由前 throw
- **错误显式（不静默）**: 缺失 / 不可读 PDF 由浏览器原生 viewer 显示空白文档
  UI；本包不 silent-fallback 到 alt 文本 —— 容器 + iframe shell 始终渲染，
  让用户看见加载失败状态（spec D2 等价 D1 "red error box with the source visible"
  原则的 PDF 等价物）

## Wave 3 mdx-bridge 路由集成（pending）

当前 `serializePdf` / `parsePdf` 是 stub —— 暴露稳定签名，未被 mdx-bridge 消费。
Wave 3 mdx-bridge routing table PR 会：

1. 在 `mdx-bridge/parse.ts` 的 `mdastBlockToTiptap` 拦截 `mdxJsxFlowElement{name:'Pdf'}` →
   `parsePdf(node)` → 把返回 `PdfTiptapNode` 嵌入 doc.content
2. 在 `mdx-bridge/serialize.ts` 的 `tiptapToMdastBlock` 拦截 `type='pdf'` →
   `serializePdf(node)` → 返回 `mdxJsxFlowElement` 进 mdast
3. pdf block 无 children，递归不展开

## Wave 3 search-index 集成（pending, `searchable=true`）

`searchable: true` 是 build-time hint，runtime no-op（Wave 2）。Wave 3
search-index PR 将：

1. apps/site build pipeline 扫描所有 `<Pdf searchable .../>` 实例
2. 调 [`scripts/extract-pdf-text.ts`](../../scripts/extract-pdf-text.ts) 的
   `extractPdfText({ pdfPath: src })` API 抽取 PDF 文本
3. 把抽出文本写入 search index（文档 id ↔ src ↔ 全文 mapping）
4. 提供 search UI 查询入口

Wave 2 仅暴露 `searchable` schema 字段 + parse/serialize round-trip
+ runtime 无副作用；mdx-doctor 不会因为 `searchable` 在 props 而 fail
（schema 已声明 default=false）。

## Wave 3 defense-in-depth: iframe sandbox（pending）

Wave 2 iframe 不带 `sandbox` 属性。考虑因素：浏览器原生 PDF viewer 是
trusted runtime authority（与 D1 KaTeX trust 模式一致），且 PDF 通常来自
本仓库静态托管的 `/files/*.pdf`（同源），引入 `sandbox` 会破坏 PDF viewer
的合法功能（pop-up download dialog / form submission / fullscreen API）。
Wave 3 PR 会：

1. 评估是否引入 `sandbox="allow-same-origin allow-popups allow-forms"`
   作为 baseline（保留 PDF viewer 必需能力，关闭 top-navigation +
   script execution 入口）
2. 与 apps/site CSP（`script-src 'self'` + `frame-src 'self'`）联动，
   防御跨域恶意 PDF
3. 决定是否为非同源 PDF（URL src）走更严格的 sandbox 子集

Wave 2 跳过 sandbox 不阻塞 review（codex 5.5 R2-4 informational，Claude
pr-reviewer-d2 评估为 non-blocking，与 D1 KaTeX trust 一致）。

## Forward-compat consumers

- **Z0 sample-blocks**: `<Pdf src="/files/example.pdf" page={1} />` 实例
- **apps/site SSR**: import `@skb/block-pdf/ui-default/Pdf.astro`；consumer 同 PR 加 pdf.css import
- **Wave 3 mdx-bridge integration**: 见上节
- **Wave 3 search-index integration**: 见上节
- **Tiptap NodeView (editor-shell)**: 用 `PdfEditorView`；NodeView wrapper 调 `renderPdf` 直拿 iframe descriptor

## Modifying this file

`pdfCore` 公共字段 (`name` / `kind` / `propsSchema` / `mdxComponent`) 与 `pdfUiDefault`
公共字段 (`coreName` / `uiId` / `EditorView` / `RenderView`) 变更需 ADR（与 block-foundation
同 freeze 级别 —— 触发 mdx-bridge 路由 + sample-blocks 同步更新）。
`serializePdf` / `parsePdf` 签名变更需配 mdx-bridge routing PR；`renderPdf` 签名变更
同步 Pdf.astro + Pdf.tsx 调用点（authority = ui-default/render-pdf.ts；ssr-render.test.ts 防漂移）。

## Related

- [@skb/block-foundation CONTRACT](../block-foundation/CONTRACT.md) — `BlockCoreDefinition` / `BlockUIDefinition` 接口权威
- [@skb/block-foundation RFC](../block-foundation/RFC.md) — registration walkthrough
- [@skb/block-math CONTRACT](../block-math/CONTRACT.md) — sister-block (Track D1，同 render-block-eng owner)
- [@skb/block-callout CONTRACT](../block-callout/CONTRACT.md) — Wave 2 simple-block template
- [scripts/extract-pdf-text.ts](../../scripts/extract-pdf-text.ts) — D2 prereq (Track I3, Wave 3 search-index consumer)
- [ADR-0003 headless / presentational 分层](../../docs/decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3 + #4 + #5
- [ADR-0008 D1 dead-dep + D2 interface freeze](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
- [ADR-0009 BlockKind union expansion](../../docs/decisions/ADR-0009-block-kind-union-expansion.md) — kind='render' 授权
- [Wave 2 plan §Task D2](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
- [Wave 2 plan §Task I3](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
