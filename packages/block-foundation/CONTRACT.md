# @skb/block-foundation Contract

## Public surface

- `BlockRegistry` class — 双层注册表（ADR-0003）
  - `registerCore(core)` / `registerUI(ui)`
  - `getCore(name)` / `listCores()`
  - `getUI(coreName, uiId?)` / `listUIs(coreName)`
- `defineCore(def)` / `defineUI(def)` factory helpers
- `BlockCoreDefinition` / `BlockUIDefinition` / `BlockViewProps` interfaces
- `BlockKind = 'prose' | 'component' | 'render' | 'viz'` （四分类，Wave 2 由 2→4 additive 扩展，ratified by [ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)）
  - `'prose'` — Wave 1 default for headless prose blocks (无 MDX 组件，由 `proseExtensions` 提供 markdown 行为)
  - `'component'` — Wave 1 for MDX-component blocks（block-callout / block-code / block-image — Track C simple-block-eng）
  - `'render'` — **Wave 2 NEW** for hand-crafted render blocks consuming external runtime authority（block-math KaTeX / block-pdf iframe-based browser PDF viewer — Track D render-block-eng）
  - `'viz'` — **Wave 2 NEW** for visualization blocks consuming heavy runtime libs（block-jupyter Pyodide / block-nn-viz TensorFlow.js / block-agent-flow React Flow — Track E viz-block-eng / kernel consumer）
- `proseExtensions` — Tiptap 扩展数组，提供全部 markdown 行为
- `BlockGridPosition` interface — ADR-0016 D2 grid position shape `{col, row?, colSpan, rowSpan}`; `colSpan` must use `COL_SNAPS`; `rowSpan` is integer or `'auto'`
- `COL_SNAPS = [2, 3, 4, 6, 8, 12]` — ADR-0016 D2/D6 snap ladder; transitional dual source with mdx-bridge until C.2-3/C.2-4 imports this authority
- `BlockGridKind = 'prose' | 'component' | 'render' | 'viz'` / `RowSpanSemantic = 'auto' | 'integer'` type aliases — ADR-0016 D10 grid serialize/parse semantics
- `proseGridDefaults` — ADR-0016 D10 prose defaults `{rowSpanSemantic: 'auto', gridKind: 'prose', defaultColSpan: 12}` for editor-shell/mdx-bridge C.2-3/C.2-4 consumers
- `BlockUIDefinition.gridDefault?` / `rowSpanSemantic?` / `gridKind?` optional fields — ADR-0016 D10; omitted `rowSpanSemantic` defaults to `'integer'`, omitted `gridKind` mirrors `BlockKind` in later C.2-4 runtime wiring
- `GridGeometry` interface + `DEFAULT_GRID_GEOMETRY` const — ADR-0016 D9 defaults `{rowH: 48, gap: 14, totalCols: 12}`
- `effectiveCellHeight(rowSpan, geometry?)` — ADR-0016 D9 helper for `rowSpan * row-h + (rowSpan - 1) * gap`
- `effectiveColWidth(colSpan, containerWidth, geometry?)` — ADR-0016 D9 helper for `colSpan * 1fr + (colSpan - 1) * gap`
- `effectiveColSnaps(viewportCols)` — ADR-0016 D6 Q4 helper that maps responsive viewport columns to valid resize snap sets: `12 -> [2, 3, 4, 6, 8, 12]`, `6 -> [2, 3, 6]`, `1 -> [1]`
- `effectiveRowSpan(rowSpan, autoIntegerHint)` — ADR-0016 D2/D10 helper that resolves `'auto'` to the measured integer hint
- `validateGridPosition(pos, totalCols?)` — ADR-0016 D2/D6/D7 helper that throws on explicit invalid grid positions
- `isAutoRowSpan(uiDef)` — ADR-0016 D10 helper for `rowSpanSemantic === 'auto'` or `gridKind === 'prose'`
- `evalAttrExpression(value)` / `MdastJsxAttributeValue` / `MdxJsxAttributeValueExpression` (Wave 6 carry-forward #16, 2026-05-08) — extract the static JS value from an `mdxJsxAttribute` value field, walking the estree on `mdxJsxAttributeValueExpression`. Supported expression node types: primitive `Literal` (string / number / boolean / null — BigInt and RegExp literals throw), `TemplateLiteral` (no interpolations), `ArrayExpression`, `ObjectExpression`, unary `+`/`-` on a numeric `Literal`, identifier `undefined` / `NaN` / `Infinity`. Throws on dynamic forms (Identifier, CallExpression, BinaryExpression, unary `!`, etc.). Consumed by all 6 component-block parsers that the production sample-blocks fixture exercises with JSX expression form: `parsePdf` (`<Pdf page={1} searchable={true}>`), `parseJupyter` (`<Jupyter code={\`...\`} libraries={[...]}>`), `parseNnViz` (`<NnViz layers={[{...}]}>`), `parseAgentFlow` (`<AgentFlow nodes={[{...}]} edges={[{...}]}>`), `parseCode` (`<Code code={\`...\`}>`) and `parseImage` (`<Image width={320} height={180}>`). Without the helper these would surface as `[unsupported block <X>: ...]` placeholders under mdx-bridge softParse.

## Invariants

- `BlockKind` 四分不可破坏：新 block 必须明确归属 `prose` / `component` / `render` / `viz` 之一。Wave 1 仅 `prose` + `component` 二分；Wave 2 additive 扩展加 `render` + `viz`（由 `render-block-eng` 与 `viz-block-eng` 工种 own，与 agent-contract.md Tier 1 worker 分工一致；扩展授权见 [ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)）。kind 定义不可被进一步窄化（不允许把 `render` 重新归并入 `component`），扩展再加 kind 需 ADR
- Prose blocks 零自写代码——任何看似需要新 prose block 的场景应通过组合 `proseExtensions` 内现有扩展或追加单条 Tiptap 扩展实现，不再加 prose-kind block
- `BlockCoreDefinition.mdxComponent` 必须 PascalCase，且与 MDX 文件 import 中使用的名字一致
- Core 与 UI 物理分离（ADR-0003）：core 不允许 import 任何 React/Tiptap 视觉 API；UI 必须 import core（不允许 inline 重复 schema）
- 同 core 多 UI 时 `getUI(name)` 取首个注册：约定首个 uiId 为 `'default'`；adopter 在 register 顺序上需谨慎
- **Defensive copy**：`listCores()` 与 `listUIs(coreName)` 每次返回 fresh array。Caller 修改返回值不影响 registry 内部 state。Implementation: `src/registry.ts:84` (`listCores`) + `src/registry.ts:96` (`listUIs`)；regression: `src/__tests__/registry.test.ts` "listCores returns a defensive copy" + "listUIs returns a defensive copy"
- **Idempotent register**：`registerCore` 同 `name` 第二次调用 throws duplicate-core error；`registerUI` 同 `(coreName, uiId)` 第二次 throws duplicate-UI error。避免 silent override；实现见 `src/registry.ts:60-63` + `src/registry.ts:71-75`
- **Schema strictness**：每个 `BlockCoreDefinition.propsSchema` 必须是 `z.object(...).strict()`；嵌套 `ZodObject` 同样必须 `.strict()`（[ADR-0006](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3 trip-hazard：`.strict()` 不传播）。当前类型仅约束到 `ZodTypeAny`（type-narrow 到 `ZodObject` 待 Wave 3）；Wave 2 行为约定 + reviewer + RFC.md §1 显式提醒。未 `.strict()` 不会 throw，但 `propsSchema.parse(input)` 会 silently strip unknown keys，引发 contract drift
- **Serialize / parse hook ownership**：MDX serialize/parse 由各 `block-*` 包的 `core/` own（ADR-0003 D1+D2），不在 `block-foundation` 注册。`block-foundation` 仅 own `BlockCoreDefinition` 形状（含 `mdxComponent` 字符串）；`mdx-bridge` 通过 `mdxJsxFlowElement.name` 字符串路由到对应 block 的 export（命名约定 verb-as-prefix：serialize and parse helpers per block name，与 mdx-bridge 现有 `mdxToTiptap` / `tiptapToMdx` 同 style）。详见 RFC.md §"5. Serialize / parse hook ownership"
- **W4-1: HeavyBlockBoundary wrapping for `kind='viz'` heavy blocks (MDX/static render path)** ([ADR-0014](../../docs/decisions/ADR-0014-heavy-block-boundary.md)): Any `kind='viz'` block whose runtime authority cannot SSR in Astro static build (e.g., CommonJS-only deps, browser-only WASM, heavy bundles ≥ ~500KB) — currently `block-jupyter` / `block-nn-viz` / `block-agent-flow` — when consumed via the **MDX componentsMap path** (`apps/site/src/components.ts`) MUST be wrapped in `HeavyBlockBoundary` from `@skb/heavy-block-boundary`. The boundary renders SSR skeleton with fixed dimensions matching the hydrated component (zero layout shift); client hydration replaces with the real `RenderView`. Each heavy block exports `heavyBoundaryDimensions: HeavyBlockDimensions` from its `ui-default` (per-block ownership, NOT centralized). **Editor (Tiptap NodeView) consumption is OUT OF SCOPE** — `EditorView` exports stay unwrapped unless caller opts in (per ADR-0014 D9). Authority: `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` (Wave 4 Stage A). Consumers: `apps/site/src/components.ts` componentsMap entries for the 3 first heavy blocks; future plugin heavy blocks may export pre-wrapped helpers.
- **W5-1: Grid context dimensions ↔ colSpan/rowSpan 联动** ([ADR-0016](../../docs/decisions/ADR-0016-grid-data-model.md)): 任意 block 在 grid context 渲染时, 其 visible bounding box dims 由 `{col, row?, colSpan, rowSpan}` (per ADR-0016 D2 `BlockGridPosition` schema) 唯一决定: `width(px) = colSpan * (1fr) + (colSpan - 1) * gap` (1fr 由 12-col / 6-col / 1-col 响应式动态计算 per ADR-0016 D5); `height(px) = rowSpan * row-h + (rowSpan - 1) * gap = rowSpan * 62 - 14` (row-h=48, gap=14 默认 per ADR-0016 D4). Markdown blocks rowSpan='auto' rendering-derived (ResizeObserver scrollHeight 反算行数 per ADR-0016 D3 `useAutoRowSpan` hook), 不入持久化 — 与其他 block rowSpan=integer 入持久化形成不对称. **HeavyBlockBoundary consumer (per ADR-0014 v0.5 amendment, Wave 5 Stage C.2)**: `heavyBoundaryDimensions` per-kind 必须与 colSpan/rowSpan 联动; e.g., AgentFlow `colSpan=6 rowSpan=6` → dims = `{ width: 6*(1fr)+5*14, height: 6*48+5*14 = 358 }`. 默认 fallback dims (Wave 4 ADR-0014 D5 锁定值) 仅用于 SSR 阶段 colSpan/rowSpan 未知时. **CSS application**: `style={{ gridColumn: \`${col} / span ${colSpan}\`, gridRow: row !== undefined ? \`${row} / span ${effectiveRowSpan}\` : \`span ${effectiveRowSpan}\` }}` per ADR-0016 D2. Authority: `packages/block-foundation/src/types.ts` `BlockGridPosition` interface + `COL_SNAPS` const + `BlockUIDefinition.gridDefault` + `BlockUIDefinition.rowSpanSemantic` (per ADR-0016 D10; Wave 5 Stage C.2 实施). Consumers: `apps/site` Astro renderer (per ADR-0016 D8) + `@skb/editor-shell` grid container + `@skb/mdx-bridge` serialize/parse (per ADR-0016 D7).

## Forward-compat consumers (Wave 2+)

Wave 2 中段当 `BlockRegistry` 开始用 `@skb/content-types` 的 schema 验证
注册的 block props（如跨 block 共享的 frontmatter / metadata 形状），届时
`@skb/content-types` 将被同 PR 加入 `package.json#dependencies` +
`tsconfig.json#references`，并出现源码 `import { ... } from '@skb/content-types'`。

当前 Wave 1 close 状态：源码无 content-types import，按
[ADR-0008](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) D1
（dead-dep policy = tighten），dep 与 ref 均未声明；forward-compat 意图
仅在本 prose 段表达，不在 package.json / tsconfig 占位。

## How to register a new `block-*` package

step-by-step walkthrough (core / ui-default / 测试样板 / 错误场景 / serialize-parse 归属)
for the first real consumer 在 [RFC.md](./RFC.md) — 第一个 `block-*` PR
(Task C1 / C2) 必须 reference 此 RFC；后续 `block-*` PR 沿用相同模式。
RFC 是 consumer-facing 教程，CONTRACT.md 是 public API 形状 + 关键不变量
的权威；二者补充而非重叠（[ADR-0008 D2](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)）。

## Modifying this file

公共表面（`BlockCoreDefinition` / `BlockUIDefinition` / `BlockRegistry` / `BlockKind` / `BlockViewProps` / `defineCore` / `defineUI` / `proseExtensions`）的任何字段或方法增删改一律需 ADR — **包括添加 optional 字段、改 `proseExtensions` 数组（增删 Tiptap 扩展、顺序变更、`as const` shape 变化）**。spec §2.3 把 block-foundation 列为接口包，规则"改动需 ADR；全员同步"不区分 optional vs required。

原因：optional 字段会传播到 mdx-bridge serialization + 8 个 Wave 2 block 的 core+ui 实现 + apps/site frontmatter schema；`proseExtensions` 改动直接影响 mdx-bridge round-trip fixtures + editor-shell parsing 行为；无 ADR 协调会引发漂移。

## Related

- 设计规格 §1.5 / §2.5（`../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md`）
- ADR-0003 headless / presentational 分层（`../../docs/decisions/ADR-0003-headless-presentational-split.md`）
- ADR-0009 BlockKind union 2→4 expansion（`../../docs/decisions/ADR-0009-block-kind-union-expansion.md`）
- content-types 契约（`../content-types/CONTRACT.md`）
- mdx-bridge 契约（`../mdx-bridge/CONTRACT.md`）
- design-tokens 契约（`../design-tokens/CONTRACT.md`）
