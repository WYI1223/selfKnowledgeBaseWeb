# @skb/block-jupyter Contract

Pyodide-backed Jupyter cell（Wave 2 Track E1）。第一个 `viz-block-eng` 包，
也是 [@skb/kernel-pyodide](../kernel-pyodide/CONTRACT.md) 的**第一个 consumer**；
hand-craft（不走 codex-block-generator），block-nn-viz (E2) / block-agent-flow
(E3) 同 owner 独立 hand-craft，consumer 模式继承本包。

## Public surface

五个 entry：

- `.` (root barrel) — re-export `./core`
- `./core` — headless 层
  - `jupyterCore: BlockCoreDefinition<typeof propsSchema>` — name=`'jupyter'` /
    kind=`'viz'`（[ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)）/ mdxComponent=`'Jupyter'`
  - `serializeJupyter(node) → mdxJsxFlowElement` — Tiptap → mdast (Wave 3 mdx-bridge routing 时启用)
  - `parseJupyter(mdast) → TiptapNode` — mdast → Tiptap (同上)
  - 类型: `JupyterTiptapNode` / `JupyterMdastJsxElement`
- `./ui-default` — presentational 层
  - `jupyterUiDefault: BlockUIDefinition<typeof jupyterCore.propsSchema>` — uiId=`'default'`
  - `JupyterEditorView` / `JupyterRenderView` / `JupyterView` — `ComponentType<JupyterViewProps>`
  - `createKernelBridge(opts) → KernelBridge` — `@skb/kernel-pyodide` consumer
    pattern entry（per-block isolated session + AbortSignal cleanup）
  - 类型：`KernelBridge` / `KernelBridgeOptions` / `KernelPhase`
  - `JUPYTER_TOKENS: JupyterTokens` — design-token name witnesses
  - `heavyBoundaryDimensions: HeavyBlockDimensions` (per [ADR-0014 D5](../../docs/decisions/ADR-0014-heavy-block-boundary.md)) — initial values: width 600, height 400 (CSS px). Re-exported by `./ui-default`; consumed by `apps/site` via the SSR-safe `./ui-default/heavy-boundary-dimensions` subpath and `HeavyBlockBoundary` to size the SSR skeleton; zero layout shift on hydration.
- `./ui-default/Jupyter.astro` — apps/site SSR consumer 直接 import 的 Astro 组件
  （静态占位：仅渲染 code，kernel 在客户端 hydration 后启动）
- `./ui-default/jupyter.css` — 视觉规则单一来源（design-token-bound，error/fg/muted/accent
  color 走 `var(--color-*)`）

### Consumer 使用方式

`apps/site` / `editor-shell` 必须 `import '@skb/block-jupyter/ui-default/jupyter.css';`
方能渲染 toolbar / 行号 / output panel。Astro page 直接
`import Jupyter from '@skb/block-jupyter/ui-default/Jupyter.astro';`。

`propsSchema` 形状（见 `src/core/core-definition.ts`）：

```typescript
z.object({
  code: z.string(),
  runOnLoad: z.boolean().default(false),
  showLineNumbers: z.boolean().default(true),
  libraries: z.array(z.string()).default([]),
}).strict()
```

## kernel-pyodide consumer pattern

E1 是 `@skb/kernel-pyodide` 的第一个消费方。`createKernelBridge` 把
`PyodideAdapter`/`KernelSession`/`AsyncIterable<KernelEvent>` 抽象为一个
`KernelPhase` 状态机，E2/E3 后续 viz-block 直接 `import` 复用，避免每个
viz-block 重复实现 session lifecycle：

- **Per-block isolated session**：每个 NodeView mount 调一次
  `adapter.startSession(uniqueSessionId)`；两个 jupyter 块互不共享 namespace
- **Loading state UI**：`startSession` 异步（Wave 2 主线程 `loadPyodide`，Wave 3
  Worker boot），bridge 暴露 `phase: 'starting'` 让 React 显示 loading；不允许
  silent 启动
- **AbortSignal-driven cleanup**：NodeView unmount 触发 `controller.abort()` →
  bridge 立即停止读 event stream + 调 `session.shutdown()`；mid-startSession
  的 abort 同样 cleanup（pending session 一旦 resolve 就被 fire-and-forget shutdown）
- **Error-class triage**：所有 throw 必 `instanceof KernelError`；bridge 提取
  `kind` 生成 `KernelPhase{type:'kernelError',kind,message}`，UI 不需要
  `import { KernelStartupError, KernelImportError, KernelInterruptError }` 个体子类
- **运行时异常 vs kernel 故障分流**：用户 Python 抛错 → `KernelEvent{type:'error'}`
  事件流 → `KernelPhase{type:'execError'}`；kernel 启动/导入/中断故障 →
  `KernelPhase{type:'kernelError'}`。两者 UI 显示分开（不混并）

## Invariants

继承自 [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md#invariants)：
`Defensive copy` / `Schema strictness` / `Default UI lookup` / `Serialize / parse hook ownership`。

block-jupyter 特定不变量：

- **`coreName='jupyter'` (kebab-case)** + **`mdxComponent='Jupyter'` (PascalCase)**:
  `jupyterCore.name`/`.mdxComponent` 字面值固定，与 BlockRegistry / mdx-bridge 路由
  ([RFC §1](../block-foundation/RFC.md#1-core-side)) 一致
- **`kind='viz'`**：[ADR-0009](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)
  授权（Wave 2 BlockKind union additive 扩展）；E2/E3 同 kind
- **Hook 命名 verb-as-prefix**: `serializeJupyter` / `parseJupyter` / `createKernelBridge`
  ([RFC §5](../block-foundation/RFC.md#5-serialize--parse-hook-ownership-scope-clarification))
- **`uiId='default'` reserved**: inherit foundation 的 `Default UI lookup` 不变量
- **`@skb/kernel-pyodide` 是 runtime authority**：`PyodideAdapter` 由本包 import；
  本包不重 wrap loadPyodide / 不内联 Pyodide Lib（ADR-0006 #5 algorithm replication —
  authority = `@skb/kernel-pyodide`）。只允许 consumer-side 状态机
- **Headless 自给**: `core/` 不 import React / Tiptap / Pyodide；仅依赖
  `@skb/block-foundation` + `zod`（ADR-0003 D1）。`ui-default/` 才 import React +
  `@skb/kernel-pyodide` + design-tokens
- **propsSchema single authority**: 仅在 `src/core/core-definition.ts` 定义；
  ui-default / serialize / parse / 测试均 import `jupyterCore.propsSchema`
  （ADR-0006 #4）
- **Self-validating serialize/parse**: `serializeJupyter` / `parseJupyter` 各调
  `propsSchema.parse`（boolean attrs 先字符串 coerce → boolean，libraries
  JSON-decode → array<string>）；契约偏离在 mdx-bridge 路由前 throw
- **Error 显式（不静默）**：kernel error 走 `data-phase='kernelError'`；exec error
  走 `data-phase='execError'` + `data-stream='error'` 输出 entry；jupyter.css 把
  两者都 escalate 到 `--color-error` token
- **`KernelError` 一次捕获**：bridge 内部所有 catch 仅检测 `instanceof KernelError`
  提取 `kind`；不 `instanceof` 子类（per [@skb/kernel-pyodide](../kernel-pyodide/CONTRACT.md)
  CONTRACT § Error classes 同款 sister-aligned 规则）

## Test corpus invariants

`src/__tests__/kernel-bridge.test.ts` (414 lines) is the **cross-runtime
state-machine authority** for the Pyodide message-event mapping. It owns:

- `KernelEvent → KernelPhase` 6-variant fanout (per
  [@skb/kernel-adapter](../kernel-adapter/CONTRACT.md) `KernelEvent` family +
  this package's `KernelPhase` discriminated union)
- Phase transitions (idle → starting → running → idle / errored sub-paths)
- Execution lifecycle (`startSession` → first `KernelEvent`, request
  cancellation, fire-and-forget shutdown of mid-startSession sessions)
- Error-class triage (`KernelStartupError` / `KernelImportError` /
  `KernelInterruptError` / generic `KernelError` → `KernelPhase{type:'kernelError', kind, message}`)
- Disposal cleanup invariants (`AbortSignal`-driven cleanup at NodeView
  unmount; idempotent abort; pending session post-resolve fire-and-forget
  shutdown)

Per [ADR-0006 #5](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md)
(algorithm + runtime constant replication audit), `kernel-bridge.test.ts` is
the single regression-test corpus binding `createKernelBridge`'s state
machine to the `@skb/kernel-pyodide` runtime authority; line count (414)
reflects per-runtime invariant complexity. ESLint `max-lines: 300` warn is
globally OFF for `**/*.test.*` (per
[eslint.config.js](../../eslint.config.js) test-files exemption), so this
file does not trigger lint warnings; this CONTRACT entry is the explicit
disclosure for structure-auditor monthly drift scan.

Sister test corpora (Wave 2 viz-block triplet at the same authority grain):

- E1 [`block-jupyter/__tests__/kernel-bridge.test.ts`](src/__tests__/kernel-bridge.test.ts) (414)
- E2 [`block-nn-viz/__tests__/tfjs-bridge.test.ts`](../block-nn-viz/src/__tests__/tfjs-bridge.test.ts) (327)
- E3 [`block-agent-flow/__tests__/flow-bridge.test.ts`](../block-agent-flow/src/__tests__/flow-bridge.test.ts) (326)

Authority precedent: Wave 1
[`mdx-bridge/serialize.ts`](../mdx-bridge/CONTRACT.md) (243 lines) is the
single-runtime authority predecessor disclosed in `mdx-bridge/CONTRACT.md`
"Implementation notes". Drift between any corpus and its bridge
implementation is a release-blocker per ADR-0011 D5 + D6 codex-mdx-doctor /
codex-pr-reviewer-55 audit profile triggers.

## Wave 3 mdx-bridge 路由集成（pending）

当前 `serializeJupyter` / `parseJupyter` 是 stub —— 暴露稳定签名，未被 mdx-bridge 消费。
Wave 3 mdx-bridge routing table PR 会：

1. 在 `mdx-bridge/parse.ts` 的 `mdastBlockToTiptap` 拦截 `mdxJsxFlowElement{name:'Jupyter'}` →
   `parseJupyter(node)` → 嵌入 doc.content
2. 在 `mdx-bridge/serialize.ts` 的 `tiptapToMdastBlock` 拦截 `type='jupyter'` →
   `serializeJupyter(node)` → 进 mdast；`libraries` 从 string-encoded JSON 升级到
   expression-attr 后再调整 emit 形式
3. jupyter block 无 children，递归不展开

## Wave 3 future work

- **matplotlib display 渲染细化**：当前 `display_data` 事件统一走 `text/plain`
  路径；Wave 3 加 `image/png` base64 → `<img>` 渲染 + `application/javascript`
  warning suppression
- **interrupt 真实化**：Wave 2 `KernelBridge.interrupt()` no-op（per
  PyodideAdapter 主线程限制）；Wave 3 worker host + SharedArrayBuffer 后变实际中断
- **micropip 失败 surface**：当前 `libraries: ['sympy']` 安装失败 → `KernelImportError`
  → `kernelError` phase；Wave 3 加 retry-with-fallback hint UI

## Forward-compat consumers

- **Z0 sample-blocks**: `<Jupyter code="print(1)" runOnLoad />` 实例
- **apps/site SSR**: import `@skb/block-jupyter/ui-default/Jupyter.astro`；hydrate
  到 `JupyterView` 接 React island
- **Wave 3 mdx-bridge integration**: 见上节
- **E2 / E3 viz-block**: 直接 `import { createKernelBridge } from '@skb/block-jupyter'`
  之前考虑提到 `@skb/block-foundation` 或新 `kernel-bridge-react` 包；当前 Wave 2 仅
  block-jupyter 一处使用，先就近 own，Z1 close ceremony 评估提取

## Modifying this file

`jupyterCore` 公共字段（`name` / `kind` / `propsSchema` / `mdxComponent`）与
`jupyterUiDefault` 公共字段（`coreName` / `uiId` / `EditorView` / `RenderView`）
变更需 ADR（与 block-foundation 同 freeze 级别 — 触发 mdx-bridge 路由 + sample-blocks
同步更新）。`createKernelBridge` 签名（KernelBridgeOptions / KernelPhase 字段）
变更需在 ADR 中评估对 E2/E3 的影响（消费方约定 freeze）。
`serializeJupyter` / `parseJupyter` 签名变更需配 mdx-bridge routing PR。

## Related

- [@skb/block-foundation CONTRACT](../block-foundation/CONTRACT.md) — `BlockCoreDefinition` / `BlockUIDefinition` 接口权威
- [@skb/block-foundation RFC](../block-foundation/RFC.md) — registration walkthrough
- [@skb/kernel-pyodide CONTRACT](../kernel-pyodide/CONTRACT.md) — sister-doc（runtime authority）
- [@skb/kernel-adapter CONTRACT](../kernel-adapter/CONTRACT.md) — `KernelEvent` 6-variant + `KernelError` family
- [@skb/block-math CONTRACT](../block-math/CONTRACT.md) — sister-doc (Wave 2 hand-craft pattern, kind='render')
- [ADR-0003 headless / presentational 分层](../../docs/decisions/ADR-0003-headless-presentational-split.md)
- [ADR-0006 asymmetry audit checklist](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3 + #4 + #5 + #6
- [ADR-0008 D1 dead-dep + D2 interface freeze](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)
- [ADR-0009 BlockKind union additive expansion](../../docs/decisions/ADR-0009-block-kind-union-expansion.md)
- [Wave 2 plan §Task E1](../../docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md)
