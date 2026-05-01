# @skb/block-agent-flow Contract

React Flow-backed agent topology visualization（Wave 2 Track E3）。第三个
`viz-block-eng` 包，sister-doc 与 [@skb/block-jupyter](../block-jupyter/CONTRACT.md)（E1）
+ [@skb/block-nn-viz](../block-nn-viz/CONTRACT.md)（E2）；hand-craft，三个 viz block
独立 own runtime authority，bridge 模式共享。

## Public surface

五个 entry（mirror E1 5-entry shape）：

- `.` (root barrel) — re-export `./core`
- `./core` — headless 层
  - `agentFlowCore: BlockCoreDefinition<typeof propsSchema>` — name=`'agent-flow'` /
    kind=`'viz'`（[ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)）/ mdxComponent=`'AgentFlow'`
  - `serializeAgentFlow(node) → mdxJsxFlowElement` / `parseAgentFlow(mdast) → TiptapNode`
    — Wave 3 mdx-bridge routing 时启用（stable signature stub）
  - 类型: `AgentFlowTiptapNode` / `AgentFlowMdastJsxElement` / `AgentFlowNode` / `AgentFlowEdge`
- `./ui-default` — presentational 层
  - `agentFlowUiDefault: BlockUIDefinition<typeof agentFlowCore.propsSchema>` — uiId=`'default'`
  - `AgentFlowEditorView` / `AgentFlowRenderView` / `AgentFlowView` — `ComponentType<AgentFlowViewProps>`
  - `createFlowBridge(opts) → FlowBridge` — lifecycle bridge（per-block isolated +
    AbortSignal cleanup + idempotent layout + LayoutFn 注入点）
  - `computeFlowLayout(nodes, edges, layout?) → FlowLayoutDescriptor` — 唯一 layout
    + topology-validation + SVG geometry 权威；React Flow path + Astro SSR path
    同源消费（ADR-0006 #5）
  - `validateTopology` / `computeBfsLayout` — 拆分出的 unconditional 验证 + BFS 默认
    layout（Wave 3 dagre/elkjs swap 仅替 `computeBfsLayout`）
  - 类型：`FlowBridge` / `FlowBridgeOptions` / `FlowPhase` / `FlowLayoutDescriptor` / `LayoutFn`
  - `AGENT_FLOW_TOKENS: AgentFlowTokens` — design-token name witnesses
- `./ui-default/AgentFlow.astro` — SSR Astro 组件，调 `computeFlowLayout` → SVG
  snapshot（不内嵌 geometry/validation），hydrate 后由 React island 接管
- `./ui-default/agent-flow.css` — 视觉规则单一来源（design-token-bound，error/fg/muted/accent
  色 走 `var(--color-*)`）

### Consumer 使用方式

`apps/site` / `editor-shell` 必须 `import '@skb/block-agent-flow/ui-default/agent-flow.css';`
方能渲染 toolbar / canvas / SVG snapshot。Astro page 直接
`import AgentFlow from '@skb/block-agent-flow/ui-default/AgentFlow.astro';`。

`propsSchema` 形状（见 `src/core/core-definition.ts`）：

```typescript
z.object({
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['agent', 'tool', 'memory', 'router']),
    position: z.object({ x: z.number(), y: z.number() }).strict(),
  }).strict()).default([]),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    label: z.string().optional(),
  }).strict()).default([]),
  interactive: z.boolean().default(true),
}).strict()
```

## React Flow consumer pattern

E3 是 `reactflow` 的唯一消费方。`flow-layout.ts` 是 layout + validation +
SVG geometry single-source authority（ADR-0006 #5；React Flow path + Astro SSR
path 同源消费）；`createFlowBridge` 复刻 E1 `createKernelBridge` 形状但绑
layout lifecycle 而非 kernel session：

- **Per-block isolated canvas**；两块互不共享 viewport/selection
- **Validation 不可绕过**：`validateTopology` 在 explicit-position + BFS 两条
  路径都运行（R2-1 regression — 不允许静默 swallow unknown-id / cycle）
- **Idempotent auto-layout**：`bridge.mount()` 一次性 layout；`onLaidOut` 一次性回调
- **AbortSignal cleanup**：NodeView unmount → `controller.abort()` → bridge stop emit
- **Errored phase**：layout 失败 → `data-phase='errored'` + `--color-error`
  + `role="alert"`（与 jupyter `kernelError` 同样不静默）
- **Layout 注入点**：`FlowBridgeOptions.layout` + `AgentFlowViewProps.layout`
  暴露 `LayoutFn` 注入；Wave 3 dagre/elkjs swap 仅换实现

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`。

block-agent-flow 特定不变量：

- **`coreName='agent-flow'`** + **`mdxComponent='AgentFlow'`**: 字面值固定（[RFC §1](../block-foundation/RFC.md#1-core-side)）
- **`kind='viz'`**：[ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md) 授权；E1/E2 同 kind
- **Hook verb-as-prefix**: `serializeAgentFlow` / `parseAgentFlow` /
  `createFlowBridge` / `computeFlowLayout` ([RFC §5](../block-foundation/RFC.md#5-serialize--parse-hook-ownership-scope-clarification))
- **`uiId='default'` reserved**: inherit foundation `Default UI lookup`
- **Headless 自给**: `core/` 不 import React / Tiptap / reactflow；仅依赖
  `@skb/block-foundation` + `zod`（ADR-0003 D1）
- **propsSchema single authority**: 仅在 `src/core/core-definition.ts` 定义
  （ADR-0006 #4）
- **嵌套 `.strict()` 强制**：4 层 ZodObject 全部 `.strict()`（ADR-0006 #3）；
  unknown-key 每层 reject
- **Self-validating serialize/parse**: 各调 `propsSchema.parse`；契约偏离 throw
- **Layout 单一权威**：`flow-layout.ts` 唯一 layout + validation + SVG geometry
  authority；React + Astro 同源（ADR-0006 #5）；ssr-render.test.ts byte-equal 守护

## Test corpus invariants

`src/__tests__/flow-bridge.test.ts` (326 lines) is the **cross-runtime
state-machine authority** for the React Flow phase machine. It owns:

- `FlowPhase` discriminated union transitions (idle → laying-out → ready /
  errored)
- Topology-validation invariants (cycle detection / unknown-id rejection;
  R2-1 regression: validation runs unconditionally on both explicit-position
  and BFS layout paths — it cannot be silently swallowed)
- Idempotent auto-layout (`bridge.mount()` runs `computeFlowLayout` exactly
  once; `onLaidOut` callback fires once per mount)
- AbortSignal-driven cleanup (NodeView unmount cancels in-flight layout +
  stops emit)
- Errored phase escalation (layout failure → `data-phase='errored'` +
  `--color-error` + `role="alert"`; sister-pattern with E1's `kernelError`
  phase — never silent)
- LayoutFn injection point (`FlowBridgeOptions.layout` + `AgentFlowViewProps.layout`
  hot-swap path; Wave 3 dagre/elkjs swap exercises this contract)

Per [ADR-0006 #5](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md)
(algorithm + runtime constant replication audit), `flow-bridge.test.ts` is
the single regression-test corpus binding `createFlowBridge`'s state machine
to the `reactflow` runtime authority; line count (326) reflects per-runtime
invariant complexity. ESLint `max-lines: 300` warn is globally OFF for
`**/*.test.*` (per
[eslint.config.js](../../eslint.config.js) test-files exemption), so this
file does not trigger lint warnings; this CONTRACT entry is the explicit
disclosure for structure-auditor monthly drift scan.

Sister test corpora (Wave 2 viz-block triplet at the same authority grain):

- E1 [`block-jupyter/__tests__/kernel-bridge.test.ts`](../block-jupyter/src/__tests__/kernel-bridge.test.ts) (414)
- E2 [`block-nn-viz/__tests__/tfjs-bridge.test.ts`](../block-nn-viz/src/__tests__/tfjs-bridge.test.ts) (327)
- E3 [`block-agent-flow/__tests__/flow-bridge.test.ts`](src/__tests__/flow-bridge.test.ts) (326)

Authority precedent: Wave 1
[`mdx-bridge/serialize.ts`](../mdx-bridge/CONTRACT.md) (243 lines) is the
single-runtime authority predecessor disclosed in `mdx-bridge/CONTRACT.md`
"Implementation notes". Drift between any corpus and its bridge
implementation is a release-blocker per ADR-0011 D5 + D6 codex-mdx-doctor /
codex-pr-reviewer-55 audit profile triggers.

## Wave 3 mdx-bridge 路由（pending）

`serializeAgentFlow` / `parseAgentFlow` 是 stub。Wave 3：mdast `AgentFlow` ↔
Tiptap `agent-flow`；`nodes`/`edges` JSON-string → expression-attr；无 children。

## Wave 3 future work

- **Edge animation**：React Flow `animated:true` + `data-animated` 选择器驱动
- **Node drag persistence**：`onNodesChange` → debounced 回写 propsSchema
- **Collaborative cursors**：editor-shell awareness protocol；现 single-user only
- **Layout 替换**：`computeBfsLayout` baseline → dagre / elkjs / 手动 lock

## Forward-compat consumers

- **Z0 sample-blocks**: `<AgentFlow nodes={[...]} edges={[...]} />` 实例
- **apps/site SSR**: `@skb/block-agent-flow/ui-default/AgentFlow.astro` → hydrate
  到 `AgentFlowView` React island
- **Wave 3 mdx-bridge**: 见上节
- **E1/E2 sister 提取**：`createFlowBridge` + `createKernelBridge` 各自 own；
  Z1 close ceremony 评估提取共同 `createBridge<Phase>` 抽象

## Modifying this file

`agentFlowCore` / `agentFlowUiDefault` 公共字段变更需 ADR（与 block-foundation
同 freeze 级别）。`createFlowBridge` 签名变更需在 ADR 中评估对 E1/E2 sister-bridge
提取的影响。`serializeAgentFlow` / `parseAgentFlow` 签名变更需配 mdx-bridge
routing PR。

## Related

- [@skb/block-foundation CONTRACT](../block-foundation/CONTRACT.md) — `BlockCoreDefinition` / `BlockUIDefinition` 接口权威
- [@skb/block-foundation RFC](../block-foundation/RFC.md) — registration walkthrough
- [@skb/block-jupyter CONTRACT](../block-jupyter/CONTRACT.md) — sister-doc（5-entry shape + bridge pattern authority）
- [@skb/block-nn-viz CONTRACT](../block-nn-viz/CONTRACT.md) — sister-doc（in-flight，同 Wave 2 viz）
- [@skb/block-math CONTRACT](../block-math/CONTRACT.md) — sister-doc (Wave 2 hand-craft pattern, kind='render')
- [ADR-0003 headless / presentational 分层](../../docs/decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3 + #4 + #5 + #6
- [ADR-0008 D1 dead-dep + D2 interface freeze](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
- [ADR-0009 BlockKind union additive expansion](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)
- [Wave 2 plan §Task E3](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
