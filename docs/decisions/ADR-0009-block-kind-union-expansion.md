# ADR-0009: BlockKind union additive expansion (Wave 2)

| 字段 | 值                                                                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 状态 | accepted                                                                                                                                        |
| 日期 | 2026-04-30                                                                                                                                      |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx)                                                                                                           |
| 触发 | Wave 2 Task D1 (block-math) 实施过程中 codex 5.5 pr-gate R3 verdict 提示 ADR 缺口；plan §66-71 块分类已暗含 4-way union 需求           |
| 替代 | 不替代；扩展 [ADR-0008](ADR-0008-wave-2-entry-policies.md) D2 block-foundation interface freeze rule（freeze 仍 in effect — 本 ADR 是 freeze 的 ADR-authorized exception 通道） |

## Context

Wave 1 [`packages/block-foundation/src/registry.ts`](../../packages/block-foundation/src/registry.ts:4) 定义：

```typescript
export type BlockKind = 'prose' | 'component';
```

Wave 1 仅 `prose`（headless prose blocks）+ `component`（MDX-component blocks，对应 Track C: callout/code/image）。Wave 2 plan §66-71 在物理结构层面已划分 4 组 block 集群：

```text
packages/
├── block-callout/   # Track C — simple component (kind='component')
├── block-code/      # Track C
├── block-image/     # Track C
├── block-math/      # Track D1 — render block (KaTeX, hand-craft)
├── block-pdf/       # Track D2 — render block (react-pdf)
├── block-jupyter/   # Track E1 — viz block (JupyterLite + kernel-pyodide)
├── block-nn-viz/    # Track E2 — viz block (TensorFlow.js)
└── block-agent-flow/ # Track E3 — viz block (React Flow)
```

[`packages/block-foundation/CONTRACT.md`](../../packages/block-foundation/CONTRACT.md) §"Modifying this file"（第 52 行）规则：BlockKind union 变更需 ADR。Wave 2 plan §66 的"render block" / "viz block" 分类是物理目录约定，未提升到 ADR 级形式化授权。

[design spec §196](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) 仍 documenting 二分类 `('prose'|'component')`。

D1 实施时 render-block-eng-d1 在 R2 round 中 codex 5.3 catch 了 `kind: 'component'` 与 plan §66 "render block" 不一致；orchestrator 直接判定为"plan 暗含 4-way union"并指示 union 扩展。这跳过了 freeze gate，触发 codex 5.5 pr-gate R3 procedural FAIL。本 ADR 补足该授权。

## Decision

**Additive 扩展 BlockKind 到 4-way union**：

```typescript
export type BlockKind = 'prose' | 'component' | 'render' | 'viz';
```

Wave 1 二项 `'prose'` + `'component'` 字面值 + 语义 **完全保留**，扩展为纯 additive；本 ADR **不是** ADR-0008 D2 freeze 的撤回，而是 freeze 规则下的 **首次 ADR-authorized exception**。

### D1: 4 个值的语义边界

| kind | Wave | owner worker | 用途                                                                                                | 范例                                       |
| ---- | ---- | ------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `prose` | Wave 1 | block-foundation-eng | Headless prose blocks（无 MDX component），仅由 Tiptap 扩展组合实现；不在 packages/ 下单独建包 | StarterKit nodes（heading/paragraph/list/...） |
| `component` | Wave 1 | simple-block-eng | MDX-component blocks，简单字段映射，propsSchema 通常 ≤ 5 字段，UI 由 codex-block-generator 仿造 C2 模板 | block-callout / block-code / block-image |
| `render` | **Wave 2** | render-block-eng | 渲染外部 runtime authority（KaTeX / pdf.js）的 block；UI hand-craft（不仿造）；renderXxx single-source 函数 shared between Tiptap NodeView + Astro SSR | block-math / block-pdf |
| `viz` | **Wave 2** | viz-block-eng | 可视化 block，consumer of heavy runtime libs（Pyodide / TensorFlow.js / React Flow）；UI hand-craft；多个状态 + 交互 | block-jupyter / block-nn-viz / block-agent-flow |

### D2: ADR-0008 D2 freeze 兼容性

ADR-0008 D2 ("block-foundation interface freeze") 规则文本：

> 公共表面（`BlockCoreDefinition` / `BlockUIDefinition` / `BlockRegistry` / `BlockKind` / `BlockViewProps` / `defineCore` / `defineUI` / `proseExtensions`）的任何字段或方法增删改一律需 ADR

本 ADR 是该规则下的 **首次 ADR-authorized 改动**：

- BlockKind union 添加 `render` + `viz` 字面值
- 不删除任何现有字面值（`prose` / `component` 不变）
- 不修改字面值语义（`prose` / `component` 行为完全不变）
- 不修改任何其它公共表面字段

向后兼容性：所有 Wave 1 BlockKind 消费点（block-callout/core, block-foundation tests, sample-blocks 等）继续 typecheck / runtime PASS without changes — 由 union 加宽的语义确保（`'prose' | 'component'` ⊂ `'prose' | 'component' | 'render' | 'viz'`）。

### D3: 实施顺序锁定

本 ADR 在 D1 (block-math) 实施之前应该 first-of-Wave-2 land，但实际操作中先发现需要再 author。**Wave 2 process 改进**：

- 起 Wave 3 时，结构性 union 扩展（如新加 BlockKind 值）应先单独走 ADR PR（codex 5.5 pr-gate + Claude pr-reviewer），后续 D / E track block 实施才依赖之；不与 block 实施 PR 同 bundle。
- Wave 2 例外：本 ADR 与 D1 (block-math) 同 bundle commit，因 D1 是 union 扩展的首个消费方且 BlockKind:render usage + ADR 授权都集中在同一 PR 单点 review 更便利（避免 cross-PR 时序断裂）。

## Consequences

### Pros
- BlockKind union 4-way 形式化授权 — D1/D2/E1/E2/E3 实施 worker 可以直接引用本 ADR 而不重新讨论
- Wave 1 invariant 保留（prose/component 行为不变）
- ADR-0008 D2 freeze rule 有了首次"工作示例"：列在 CONTRACT.md 的"Modifying this file"规则下，作为正确的扩展范本

### Cons
- design spec §196 与 ADR 同步漂移（spec 仍说 binary）；Wave 2 close ceremony (Z1 ADR-0009/Z1 实际为 ADR-0010 close ceremony) 应该批量更新 spec 引用
- Wave 2 process 没有"先 land structural ADR PR + 再 land 消费方 block PR"的先发约束 — 改进意见见 D3

### 衡量标准
- [ ] 本 ADR 与 D1 (block-math) 同 commit landed
- [ ] block-foundation/CONTRACT.md 的 BlockKind invariant 段 cross-link 到本 ADR
- [ ] block-foundation/RFC.md §1 BlockKind documentation cross-link 到本 ADR
- [ ] design spec §196 在 Wave 2 close ceremony bulk-updated 到 4-way union（Z1 task）

## Related

- [ADR-0001](ADR-0001-stack-selection.md) §1.8 monorepo 包结构 — 隐含 4-way 块分类约定
- [ADR-0003](ADR-0003-headless-presentational-split.md) D1+D2 — `kind` 与 headless/UI split 关系
- [ADR-0006](ADR-0006-asymmetry-audit-checklist.md) — sister-doc 对齐规则（本 ADR 同 bundle 触发了 #6 多处更新）
- [ADR-0007](ADR-0007-job-function-codex-heavy-execution.md) — render-block-eng / viz-block-eng worker 职能
- [ADR-0008](ADR-0008-wave-2-entry-policies.md) D2 — block-foundation interface freeze rule
- [Wave 2 plan §66-71](../superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) — 4 集群物理结构
