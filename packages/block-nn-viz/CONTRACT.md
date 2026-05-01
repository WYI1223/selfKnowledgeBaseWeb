# @skb/block-nn-viz Contract

TensorFlow.js-backed neural-network topology visualization (Wave 2 Track E2).
第二个 `viz-block-eng` 包；hand-craft（不走 codex-block-generator）。
Sister-pattern E1 [@skb/block-jupyter](../block-jupyter/CONTRACT.md) 提供
viz-block consumer 模式（lifecycle + abort + error triage），E3 (block-agent-flow)
将继承同一框架。

## Public surface

五个 entry：

- `.` (root barrel) — re-export `./core`
- `./core` — headless 层
  - `nnVizCore: BlockCoreDefinition<typeof propsSchema>` — name=`'nn-viz'` /
    kind=`'viz'`（[ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)）/ mdxComponent=`'NnViz'`
  - `serializeNnViz(node) → mdxJsxFlowElement` — Tiptap → mdast (Wave 3 mdx-bridge routing 时启用)
  - `parseNnViz(mdast) → TiptapNode` — mdast → Tiptap (同上)
  - 类型: `NnVizTiptapNode` / `NnVizMdastJsxElement` / `LayerSpec`
- `./ui-default` — presentational 层
  - `nnVizUiDefault: BlockUIDefinition<typeof nnVizCore.propsSchema>` — uiId=`'default'`
  - `NnVizEditorView` / `NnVizRenderView` / `NnVizView` — `ComponentType<NnVizViewProps>`
  - `createTfjsBridge(opts) → TfjsBridge` — `@tensorflow/tfjs` consumer
    pattern entry（per-block isolated `tf.LayersModel` + AbortSignal cleanup）
  - `computeTopology({layers, showWeights?}) → TopologyDescriptor` — SVG layout
    单一权威 (ADR-0006 #5)；NnViz.tsx + NnViz.astro 共用。`showWeights` 透传
    至 descriptor.edgeStrokeWidth + ariaLabel suffix
  - 常量：`SVG_WIDTH` / `SVG_HEIGHT` / `NEURON_RADIUS` / `MAX_VISIBLE_NEURONS` /
    `EDGE_STROKE_WIDTH_DEFAULT` / `EDGE_STROKE_WIDTH_WEIGHTS_SHOWN`
  - 类型：`TfjsBridge` / `TfjsBridgeOptions` / `NnVizPhase` / `LoadLayersModelFn` /
    `TopologyDescriptor` / `TopologyColumn` / `TopologyEdge` / `TopologyNeuron` /
    `ComputeTopologyOptions`
  - `NN_VIZ_TOKENS: NnVizTokens` — design-token name witnesses
- `./ui-default/NnViz.astro` — apps/site SSR consumer 直接 import 的 Astro 组件
  （静态拓扑 SVG 占位：仅渲染 `computeTopology(layers)` 的输出，model 在客户端 hydration 后加载）
- `./ui-default/nn-viz.css` — 视觉规则单一来源（design-token-bound，error/fg/muted/accent
  color 走 `var(--color-*)`）

### Consumer 使用方式

`apps/site` / `editor-shell` 必须 `import '@skb/block-nn-viz/ui-default/nn-viz.css';`
方能渲染 status / topology svg / slider controls。Astro page 直接
`import NnViz from '@skb/block-nn-viz/ui-default/NnViz.astro';`。

`propsSchema` 形状（见 `src/core/core-definition.ts`）：

```typescript
const layerSchema = z.object({
  name: z.string(),
  units: z.number().int().positive(),
  activation: z.enum(['relu', 'softmax', 'sigmoid', 'tanh', 'linear']),
}).strict();    // ⚠ inner .strict() 必需 (ADR-0006 #3)

z.object({
  modelUrl: z.string().min(1),
  layers: z.array(layerSchema).default([]),
  showWeights: z.boolean().default(false),
}).strict();    // outer .strict() 同样必需
```

## tfjs consumer pattern

E2 是 `@tensorflow/tfjs` 的第一个块级消费方。`createTfjsBridge` 把
`tf.loadLayersModel` + `tf.LayersModel.dispose` 抽象为一个 `NnVizPhase`
状态机，E3 后续 viz-block 复用相同骨架（per-block isolation / loading state UI /
AbortSignal-driven cleanup / boundary error-class triage on httpError /
loadError / unknownError）。`tf.loadLayersModel` 是 runtime authority；
本包不重 wrap，仅暴露 `LoadLayersModelFn` 注入点供测试。

## SVG layout authority

`./ui-default/topology.ts` 是 SVG topology 布局算法 + 运行时常量
（`SVG_WIDTH` / `SVG_HEIGHT` / `NEURON_RADIUS` / `MAX_VISIBLE_NEURONS` /
column-step / edge enumeration / aria-label phrasing / showWeights→edgeStrokeWidth
映射）的单一权威 (ADR-0006 #5)。`computeTopology` 接受
`{layers, showWeights}`；descriptor 暴露 `edgeStrokeWidth` 与
`ariaLabel`（含 `(weights shown)` 后缀），由 NnViz.tsx + NnViz.astro 同源消费。
两路径不允许 inline 复刻布局逻辑。

两层验证（验证策略 mirror `block-pdf/__tests__/byte-equivalence.test.tsx`）：

1. `__tests__/ssr-render.test.ts` 5-row corpus 锁定 descriptor shape +
   showWeights 透传 + edgeStrokeWidth 切换 + empty-topology aria-label 不变量。
2. `__tests__/byte-equivalence.test.tsx` 双路径漂移检测：
   (a) `react-dom/server.renderToStaticMarkup(<NnVizView>)` runtime 渲染断言
       SVG attributes 来自 descriptor；
   (b) 静态分析 `NnViz.astro` 源码确认 `import { computeTopology }` + descriptor
       绑定 + 配对 sentinel 双向锁定 showWeights wire；
   (c) 反向 sentinel 阻止 inline `SVG_WIDTH=` / `Math.min(.units` /
       inline aria-label 模板 / `"Empty neural network topology"` 字面量。

R2 review hit 即源于两路径 inline 复刻并已在 empty 文案 + max-cap behavior 上
漂移；R3 review hit 源于 corpus 行虚假声称含 weights-shown 而 computeTopology
未接受 showWeights — extract + 拓宽 contract 后两 hit 均锁定。
Sister-pattern: `block-math/ui-default/render-math.ts` (KaTeX 单一权威 +
`__tests__/ssr-render.test.ts` corpus) +
`block-pdf/__tests__/byte-equivalence.test.tsx` (双路径漂移检测)。

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`。

block-nn-viz 特定不变量：

- **`coreName='nn-viz'` / `mdxComponent='NnViz'` / `kind='viz'`**: 字面值固定
  ([RFC §1](../block-foundation/RFC.md#1-core-side))；kind=viz per
  [ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)（E1/E3 同 kind）
- **Hook 命名 verb-as-prefix**: `serializeNnViz` / `parseNnViz` / `createTfjsBridge` /
  `computeTopology`
  ([RFC §5](../block-foundation/RFC.md#5-serialize--parse-hook-ownership-scope-clarification))；
  `uiId='default'` reserved (inherit foundation `Default UI lookup`)
- **Nested .strict() (ADR-0006 #3)**：outer `propsSchema` 与 inner `layerSchema`
  同时 `.strict()`。`core.test.ts` "rejects unknown keys INSIDE a layer" 锁定
- **SVG layout single authority (ADR-0006 #5)**：`computeTopology` 是布局算法 +
  常量的唯一来源；NnViz.tsx + NnViz.astro 不复刻。`ssr-render.test.ts` corpus
  锁定（5 case：empty / single / two / multi / max-cap）
- **Headless 自给 (ADR-0003 D1)**: `core/` 仅依赖 `@skb/block-foundation` + `zod`；
  React + tfjs + design-tokens 仅在 `ui-default/`
- **propsSchema / serialize / parse single authority (ADR-0006 #4)**: 仅在
  `core-definition.ts` 定义；serialize/parse 各调 `propsSchema.parse`
  （boolean attrs 字符串 coerce → boolean，layers JSON-decode → array<LayerSpec>）
- **Error 显式（不静默）**：load failure 走 `data-phase='httpError|loadError|unknownError'`；
  nn-viz.css 把三者都 escalate 到 `--color-error` token

## Test corpus invariants

`src/__tests__/tfjs-bridge.test.ts` (327 lines) is the **cross-runtime
state-machine authority** for the TF.js `LayersModel` lifecycle. It owns:

- `LoadLayersModelFn → NnVizPhase` fanout (loading / loaded / httpError /
  loadError / unknownError discriminated phases)
- Per-block isolation (each `createTfjsBridge` gets a private `tf.LayersModel`
  reference; two viz instances never share a model)
- Tensor lifecycle (load → ready → predict → dispose); idempotent disposal
- Error-class triage (HTTP 4xx/5xx vs network failure vs unknown thrown
  shape → distinct `NnVizPhase` variants surfaced to the React tree)
- AbortSignal-driven cleanup (mid-load abort cancels the in-flight
  `tf.loadLayersModel` and prevents post-resolve dispatch)

Per [ADR-0006 #5](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md)
(algorithm + runtime constant replication audit), `tfjs-bridge.test.ts` is
the single regression-test corpus binding `createTfjsBridge`'s state machine
to the `@tensorflow/tfjs` runtime authority; line count (327) reflects
per-runtime invariant complexity. ESLint `max-lines: 300` warn is globally
OFF for `**/*.test.*` (per
[eslint.config.js](../../eslint.config.js) test-files exemption), so this
file does not trigger lint warnings; this CONTRACT entry is the explicit
disclosure for structure-auditor monthly drift scan.

Sister test corpora (Wave 2 viz-block triplet at the same authority grain):

- E1 [`block-jupyter/__tests__/kernel-bridge.test.ts`](../block-jupyter/src/__tests__/kernel-bridge.test.ts) (414)
- E2 [`block-nn-viz/__tests__/tfjs-bridge.test.ts`](src/__tests__/tfjs-bridge.test.ts) (327)
- E3 [`block-agent-flow/__tests__/flow-bridge.test.ts`](../block-agent-flow/src/__tests__/flow-bridge.test.ts) (326)

Authority precedent: Wave 1
[`mdx-bridge/serialize.ts`](../mdx-bridge/CONTRACT.md) (243 lines) is the
single-runtime authority predecessor disclosed in `mdx-bridge/CONTRACT.md`
"Implementation notes". Drift between any corpus and its bridge
implementation is a release-blocker per ADR-0011 D5 + D6 codex-mdx-doctor /
codex-pr-reviewer-55 audit profile triggers.

## Wave 3 work

- **mdx-bridge routing**: `serializeNnViz` / `parseNnViz` stub 暴露稳定签名；
  Wave 3 routing PR 会在 mdx-bridge/parse.ts 拦截 `mdxJsxFlowElement{name:'NnViz'}` →
  `parseNnViz`，serialize.ts 反向；`layers` 从 string-encoded JSON 升级到
  expression-attr 后再调整 emit 形式（nn-viz block 无 children）
- **Training viz**：当前仅 inference 拓扑；Wave 3 加 `tf.callbacks` hook 流式
  渲染 epoch loss / accuracy 曲线
- **Gradient flow viz**：`model.getLayer().getWeights()` 抽张量渲染热力图；
  当前 `showWeights` 只是 placeholder slider
- **Backend selection**：默认 WebGL；Wave 3 加 WebGPU + CPU fallback phase 拓展

## Forward-compat consumers

- **Z0 sample-blocks**: `<NnViz modelUrl="https://.../model.json" />` 实例
- **apps/site SSR**: import `@skb/block-nn-viz/ui-default/NnViz.astro`；hydrate
  到 `NnVizView` 接 React island
- **E3 block-agent-flow**: lifecycle/abort/error-class 模式平移到 React Flow
  graph data fetcher（不直接 import createTfjsBridge — agent-flow 不需要 tfjs）

## Modifying this file

`nnVizCore` 公共字段 / `nnVizUiDefault` 公共字段 / `createTfjsBridge` 签名 /
`computeTopology` 输出 shape 变更需 ADR（与 block-foundation 同 freeze 级别 —
触发 mdx-bridge 路由 + sample-blocks + E3 sister-pattern 同步更新）。
`serializeNnViz` / `parseNnViz` 签名变更需配 mdx-bridge routing PR。

## Related

- [@skb/block-foundation CONTRACT](../block-foundation/CONTRACT.md) — `BlockCoreDefinition` / `BlockUIDefinition` 接口权威
- [@skb/block-foundation RFC](../block-foundation/RFC.md) — registration walkthrough
- [@skb/block-jupyter CONTRACT](../block-jupyter/CONTRACT.md) — sister-doc (E1 viz-block lifecycle pattern)
- [@skb/block-math CONTRACT](../block-math/CONTRACT.md) — sister-doc (Wave 2 hand-craft pattern, kind='render', renderMath authority)
- [ADR-0003 headless / presentational 分层](../../docs/decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3 + #4 + #5 + #6
- [ADR-0008 D1 dead-dep + D2 interface freeze](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
- [ADR-0009 BlockKind union additive expansion](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)
- [Wave 2 plan §Task E2](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
