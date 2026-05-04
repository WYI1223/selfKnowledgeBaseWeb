# ADR-0016: Grid 数据模型与流动 (12-col grid + row flow + COL_SNAPS + 响应式)

| 字段 | 值 |
| ---- | --- |
| 状态 | proposed (v0.1.1 post 12-Q plan-challenger absorbtion 2026-05-04: 11 ABSORBED + 1 PARTIALLY ABSORBED) |
| 日期 | 2026-05-04 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | [Wave 5 plan v0.2 D1+D5](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) (Pre-A2 ADR-0016 grid 数据模型 design lock) + reframe v2 memory `project_wave4_reframe_v2.md` + granularity doc v0.3.4 § "v2 整体用户体验" + § "ADR-0012 Grid 数据模型与流动" body (旧编号 0012 → Wave 5 实际 ADR-0016 per plan v0.2 ADR 编号映射表 / D5) |
| 关系 | 不替代任何 ADR；扩展 [ADR-0009](ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union 至 grid context 消费; 扩展 [ADR-0014](ADR-0014-heavy-block-boundary.md) HeavyBlockBoundary dims 到 grid context (Wave 5 Stage C.2 ADR-0014 v0.5 amendment 消费 W5-1 invariant); 扩展 [ADR-0003](ADR-0003-headless-presentational-split.md) BlockUIDefinition 加 grid 字段 |

## Context

Wave 5 reframe v2 (2026-05-04 gatekeeper directive; absorbed via Wave 5 plan v0.2 Pre-A2 scope) 把 **grid 数据模型** 前移到 Wave 5 Stage C.2 实施. 此 ADR 锁定数据模型 + grid 流动 + 响应式 + COL_SNAPS 共识, 作为 ADR-0017 (drag/drop UX, Pre-A3) 与 ADR-0018 (v2 视觉 migration, Pre-A4) 的前置依赖.

设计源 = granularity doc v0.3.4 § "v2 整体用户体验" (心智模型 + 核心动作 + 大小语言 + markdown 高度自适应) + § "ADR-0012 Grid 数据模型与流动" body (旧编号 0012 → Wave 5 ADR-0016 新编号 per plan v0.2 D5 ADR 编号映射表) + v2-styles.css 实施现状 (`.grid { grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-rows: var(--row-h); grid-auto-flow: row; gap: var(--gap); }` 实测, lines 140-145).

### 设计共识 (gatekeeper-locked)

文档不是 "一列从上到下的块" (Notion) 也不是 "自由位置画布" (Figma), 而是 **12 列 grid, 块在 grid 里有位置和大小, 但永远不直接写坐标**. 核心动作只有三种: 放 / 移 / 缩. 所有操作都是拖 (NO 右键菜单, NO toolbar, NO slash 命令; palette = human-facing 唯一入口).

### 与 v2 demo 实施的 drift (per granularity v0.3.4 drift table)

v2 demo 在 part 2 user 共识基础上引入 4 处 drift; Wave 5 ADR-0016 锁后修复:

| # | 设计意图 | v2 demo 现状 | Wave 5 处理 |
|---|---|---|---|
| 3 | `grid-auto-flow: row` (保留空格) | `grid-auto-flow: dense` (自动填洞) | ADR-0016 D1 锁 row, NOT dense |
| 4 | 响应式 桌面 12 / 平板 6 / 手机 1 | 无响应式 | ADR-0016 D5 锁 |
| 6 | Snap [1/12, 1/6, 1/4, 1/3, 1/2, full] (part 2 共识) | Snap [1/6, 1/4, 1/3, 1/2, 2/3, full] | v0.3 user 接受 demo 这套; ADR-0016 D6 锁 [2,3,4,6,8,12] |
| (内部 不对称) | markdown rowSpan='auto' rendering-derived 不入持久化; 其他 block rowSpan = 用户设定整数 入持久化 | v2 demo `useAutoRowSpan` hook 已雏形 | ADR-0016 D3+D4 显式锁不对称 |

drift #1, #2, #5 属于 ADR-0017 drag/drop UX scope; 此 ADR 不动.

### Wave 5 stage 关系

- **Pre-A2 (this ADR)**: 数据模型 + 流动 + 响应式 + COL_SNAPS + W5-1 invariant 锁
- **Pre-A3 ADR-0017**: drag/drop UX (4 边缘对称 + outline overlay 方案 A + edge rects + lift) — 消费 ADR-0016 数据模型
- **Stage C.2 实施**: mdx-bridge serialize + block-foundation grid 字段 + Astro renderer + editor-shell grid 集成 + ADR-0014 v0.5 amendment 消费 W5-1
- **ADR-0014 v0.5 amendment** (Stage C.2): HeavyBlockBoundary `dims` 在 grid context 跟 colSpan/rowSpan 联动 — 此 ADR 锁定 W5-1 公式作为 v0.5 amendment 的 source

ADR-0011 D1 KEPT 不变. Pre-A2 plan-challenger codex 4-round per ADR-0007 D5 + R13 + Wave 4 Pre-A2 ADR-0014 12/12 absorbed precedent (final challenge count post-dispatch; absorbtion table at ADR end).

## Decision

### D1 — 12-col grid + `grid-auto-flow: row` (NOT dense)

CSS grid 容器:

```css
.skb-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: var(--row-h);    /* 默认 48px */
  grid-auto-flow: row;              /* NOT dense; 保留空格 */
  gap: var(--gap);                  /* 默认 14px */
}
```

`grid-auto-flow: row` (NOT dense) 是 hard 约束, NOT optional:

- 理由 (per granularity v0.3.4 + part 2 user 共识): "不要自动归并, 这是帮用户排版, 不要这么做"
- 保留空格符合 "不替用户排版" 原则
- row flow 下 MDX 序列化与视觉顺序严格对应, git diff 友好

`var(--row-h) = 48px` 是 base row height (one rowSpan unit); `var(--gap) = 14px` 是 column + row gap (与 ADR-0017 EDGE_W = 28px half-in/half-out 数学对应).

### D2 — 数据模型: `{col, row?, colSpan, rowSpan: number | 'auto'}`

每个 block 在 grid context 的位置和大小由 4 个字段表达:

```typescript
export interface BlockGridPosition {
  /** 起始列 (1-12). 必填 */
  readonly col: number;        // 1 ≤ col ≤ 12

  /** 起始行 (1-based). 可选; serialize 时省略 = 让 grid-auto-flow 自动决定行号 */
  readonly row?: number;        // ≥ 1; undefined = auto-place (grid-auto-flow row 决定)

  /** 跨列数 (1-12). 必填 */
  readonly colSpan: number;    // 1 ≤ colSpan ≤ 12; col + colSpan - 1 ≤ 12

  /** 跨行数 (≥1) 或 'auto' (markdown 内容驱动). 必填 */
  readonly rowSpan: number | 'auto';   // 整数 ≥ 1, OR 'auto' (per D3 不对称)
}
```

字段语义:

- `col` = 1-based grid column line 起始位置 (1 = leftmost; 12 = rightmost; col + colSpan - 1 必须 ≤ 12)
- `row` = 1-based grid row line 起始位置. **可选**: serialize 时若 user 未显式设定行号 (= grid-auto-flow row 自动决定), 则 `row` undefined / 序列化省略. 此优化:
  - git diff 友好 (重排块时只 row 变, 行号不显式记录则避免大量 noise)
  - 对应 v2 demo `<div class="gblock" style="grid-column: 1/13;">` 不写 `grid-row` (CSS 让 grid-auto-flow row 决定)
- `colSpan` = 跨列数, 必为 ∈ COL_SNAPS = [2,3,4,6,8,12] (per D6 snap 锁)
- `rowSpan` = 整数跨行数 OR `'auto'` (markdown rendering-derived; per D3 不对称)

CSS application:

```typescript
const style = {
  gridColumn: `${pos.col} / span ${pos.colSpan}`,
  gridRow: pos.row !== undefined
    ? `${pos.row} / span ${effectiveRowSpan(pos.rowSpan)}`
    : `span ${effectiveRowSpan(pos.rowSpan)}`,
};
```

`effectiveRowSpan(rowSpan)` 返回:
- 若 `rowSpan === 'auto'`: 从 `useAutoRowSpan` hook 拿当前 ResizeObserver-driven rowSpan 整数 (per D3)
- 否则: `rowSpan` 整数本身

### D3 — markdown rowSpan='auto' rendering-derived (不入持久化的不对称)

**不对称 (CRITICAL)**: markdown blocks **rowSpan = 'auto'** 是 **rendering-derived** (ResizeObserver 测 scrollHeight 反算行数), **NOT 入持久化**. 其他 block (canvas / image / runnable / heavy blocks) **rowSpan = 整数** 是 **用户设定**, **入持久化**.

#### Why 不对称

- markdown 内容长度 = user 实时编辑驱动 (写多就长, 删少就短). 不应让 user 手动 resize markdown block 高度 (违反 "所见即所得" Tiptap 心智).
- 其他 block (canvas 节点图 / image 占位 / runnable 代码块 / heavy plugin placeholder) 内容大小 = user 显式控制 (绘图区域大小 / 图片尺寸 / 代码可见行数 / heavy block dims).

#### `useAutoRowSpan` hook (实施细节)

```typescript
import { useEffect, useState, type RefObject } from 'react';

export function useAutoRowSpan(
  contentRef: RefObject<HTMLElement | null>,
  rowHeightPx = 48,           // matches --row-h
  gapPx = 14,                  // matches --gap
): number {
  const [rowSpan, setRowSpan] = useState(1);
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const scrollHeight = entries[0]?.target?.scrollHeight ?? 0;
      // rows fit including (rowSpan - 1) gaps:
      // total = rowSpan * rowH + (rowSpan - 1) * gap
      // → rowSpan = ceil((total + gap) / (rowH + gap))
      const computed = Math.max(1, Math.ceil(
        (scrollHeight + gapPx) / (rowHeightPx + gapPx),
      ));
      setRowSpan(computed);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentRef, rowHeightPx, gapPx]);
  return rowSpan;
}
```

实施约束:

- ResizeObserver debounce: rate-limit 更新到 rAF (≤16ms = 60fps preserved); 避免 paste-large-md 场景下 jank (per Wave 5 plan v0.2 Risk matrix C.2 行 ResizeObserver race)
- 每次 rowSpan 变化触发 grid 重排; CSS `transition: grid-row 180ms cubic-bezier(.2,.7,.2,1)` (v2-styles.css 实测) 给视觉缓冲
- vitest 覆盖: empty md (rowSpan = 1) / 1 段 md / 多段 md / paste 大段触发 ResizeObserver / unmount 期间 ResizeObserver leak

**两阶段稳态 (per Q3 absorbtion — 字体/图片加载 / 多次 RO 抖动收敛策略)**:

抖动收敛 3-stage 规则:

1. **首次 RO 事件** = 建立初值 (`initialRowSpan = computed`); UI 应用 transition fade-in (180ms); NOT commit to persistent state
2. **第二次 microtask/rAF 后** = 字体加载 / 图片 / code fence 高度变化常已触发第二次 RO; rate-limit 到此为止合并为单次 commit
3. **后续 RO 事件**: 阈值差 (Δ rowSpan) ≥ 1 才更新; Δ = 0 静默 (避免 pixel-noise 触发 spurious update)

字体加载特例: 通过 `document.fonts.ready` Promise 在 mount 时 await; fonts 加载完成后强制重测一次 (one-shot post-mount refresh). 图片/code fence 同步加载延迟由 ResizeObserver 自然捕获 (无需特殊处理).

`useAutoRowSpan` hook 实施时通过内部 `lastRowSpanRef` + `firstRoFiredRef` 实现 3-stage; vitest 覆盖 (per AC#5 refinement): font-loading scenario (mock `document.fonts.ready`) + image-load scenario (mock src complete event) + paste-large-md scenario (multiple RO events within 16ms 合并 once).

#### 持久化 不对称 (MDX serialize)

```mdx
{/* markdown block: rowSpan 不写 */}
<Markdown col={1} colSpan={6}>
  Some content here.
</Markdown>

{/* canvas block: rowSpan 整数 写 */}
<Canvas col={7} colSpan={6} rowSpan={6} title="Neuron map" />
```

mdx-bridge `tiptapToMdx` 必须实现这个不对称: markdown 块 (kind='prose' OR kind='component' with mdxComponent='Markdown') 不 serialize rowSpan; 其他块 serialize rowSpan 整数.

mdx-bridge `mdxToTiptap` 反向: markdown 块若 MDX 中无 rowSpan attr → Tiptap state rowSpan='auto'; 其他块若 MDX 中无 rowSpan attr → fallback rowSpan=1 (defensive default).

### D4 — 其他 block rowSpan = 用户设定整数, 入持久化

Non-markdown blocks (canvas / image / runnable / heavy plugin placeholder) `rowSpan` = 用户拖 resize handle bottom 设定的整数 (≥ 1). 入持久化 (MDX serialize).

整数语义: `rowSpan` 个 row-h 单位高度 + (rowSpan - 1) 个 gap 高度. 即:

```
height(px) = rowSpan * 48 + (rowSpan - 1) * 14
           = rowSpan * 62 - 14
```

(rowSpan = 1 → 48px; rowSpan = 2 → 110px; rowSpan = 6 → 358px; rowSpan = 8 → 482px.)

### D5 — Responsive: 桌面 12 / 平板 6 / 手机 1

| 屏幕宽度 | grid 列数 | 粒度 (effective COL_SNAPS) | rowSpan adapt |
|---|---|---|---|
| ≥ 1024px (桌面) | 12 列 | `[2,3,4,6,8,12]` 全功能 | 用户设定整数 入持久化 |
| 768px-1024px (平板) | 6 列 | `[2,3,6]` (= 1/2 / 1/3 / full; 自动减半) | 用户设定整数 入持久化 |
| < 768px (手机) | 1 列 | full (12 在 viewport-narrow 下默认 stack) | rowSpan='auto' 强制 (内容自适应; 用户整数 ignored, NOT 改持久化值; per D8 viewport-narrow 渲染 override) |

Astro renderer 通过 `@media` query 切换 `grid-template-columns: repeat(N, minmax(0, 1fr))` 与 effective COL_SNAPS (per ADR-0017 col-ruler).

实施: design-tokens 包 (Stage C.3 ADR-0018) 暴露 breakpoint vars (`--bp-tablet: 768px`, `--bp-desktop: 1024px`); apps/site Astro renderer + editor-shell grid 都消费.

**转场态有限状态机 (per Q5 absorbtion — 跨断点瞬态行为规范)**:

12 ↔ 6 ↔ 1 viewport 切换时事件顺序与状态规约:

| Phase | 操作 | 持续时长 |
|---|---|---|
| **T0 detect** | matchMedia listener fires; 缓存当前 `effectiveCols` (12/6/1) | < 1ms |
| **T1 colSpan adapt** | 遍历每个 block: 若现 `colSpan` 仍 valid in new `effectiveColSnaps`(viewportCols) → preserve; 否则 clamp 到最近 snap (round-up 优先 per Q4 absorbtion) | < 16ms (1 frame) |
| **T2 rowSpan freeze** | rowSpan='auto' blocks 临时 freeze 当前值 (避免 ResizeObserver race during transition); rowSpan=integer 不变 | < 16ms |
| **T3 grid re-flow** | CSS `transition: grid-column 180ms cubic-bezier(.2,.7,.2,1), grid-row 180ms ...` 自动触发; visible 重排 | 180ms (CSS-driven) |
| **T4 rowSpan re-measure** | rowSpan='auto' blocks 解 freeze + ResizeObserver 重新测量; `useAutoRowSpan` 两阶段稳态 (per D3 absorbtion) 确保稳定 | < 320ms total post-T0 |

总转场预算: ≤ 320ms 内完成稳定过渡 (用户感知 perceived as instant + smooth).

**rowSpan 不改持久化值** (D5 mobile path 与桌面 path 不对称的认知冲突 mitigation):

mobile (1-col) 时若 user 回复 desktop, **持久化的 rowSpan integer 仍然是用户原先在 desktop 设的值**, NOT 被 mobile path overwritten. mobile 期间 `rowSpan-rendered` (rendering-derived) 与 `rowSpan-persisted` 二分明确:
- 数据模型 schema (持久化): rowSpan = integer (or 'auto' for markdown)
- rendering pipeline: viewport-cols=1 时, **all blocks 渲染 rowSpan='auto' rendering-derived** (不论持久化值; useAutoRowSpan + ResizeObserver-driven)
- viewport 回复 ≥ 6: 渲染回到持久化值

故用户在 mobile 看到的 height ≠ 持久化值; 切回 desktop 仍是用户原值. 用户认知一致 (mobile = preview-mode; desktop = author-mode).

### D6 — COL_SNAPS = `[2, 3, 4, 6, 8, 12]`

```typescript
export const COL_SNAPS = [2, 3, 4, 6, 8, 12] as const;
//                       1/6 1/4 1/3 1/2 2/3 full
export type ColSnap = (typeof COL_SNAPS)[number];
```

Snap 档位 (= 1/6, 1/4, 1/3, 1/2, 2/3, full):

- 1/6 (colSpan=2): metadata / sidebar 小块
- 1/4 (colSpan=3): 三栏布局 narrow column
- 1/3 (colSpan=4): 三栏布局 medium column / canvas mid
- 1/2 (colSpan=6): 双栏布局 / canvas + markdown 配对
- 2/3 (colSpan=8): main note + sidebar 配额 (主笔记)
- full (colSpan=12): 标题 / 单段 markdown / heavy plugin placeholder

**与 part 2 共识的差异**: part 2 user 同意 `[1/12, 1/6, 1/4, 1/3, 1/2, full]`. v0.3 user 接受 v2 demo 的 `[1/6, 1/4, 1/3, 1/2, 2/3, full]`: 1/12 太窄无意义弃, 2/3 主笔记 + 1/3 边栏配额高频留. **此 ADR-0016 D6 = v0.3 user 共识锁**.

resize 时浮 col-ruler 高亮 6 stop (per ADR-0017 col-ruler scope). resize 落定值 必须 snap 到 COL_SNAPS 之一; 非 snap 值 拒绝 (UI 不允许 1, 5, 7, 9, 10, 11 等). 1 col 单独允许仅 viewport-narrow 1 col mobile 强制路径 (D5).

**`effectiveColSnaps(viewportCols)` 显式映射 (per Q4 absorbtion)**:

```typescript
export function effectiveColSnaps(viewportCols: 12 | 6 | 1): readonly number[] {
  switch (viewportCols) {
    case 12: return [2, 3, 4, 6, 8, 12] as const;       // 1/6, 1/4, 1/3, 1/2, 2/3, full
    case 6:  return [2, 3, 6] as const;                  // 1/3, 1/2, full of 6-col grid
    case 1:  return [1] as const;                         // forced full (1-col mobile path)
  }
}
```

**Non-snap 拒绝 + 方向记录 (per Q4 absorbtion)**: drag/resize 时 user cursor 落到非 snap 值 (如拖到 1.5 col, 5 col, etc.):
1. **kind = round-up** (默认): cursor 落在 [N, N+0.5) 取 floor; [N+0.5, N+1] 取 ceil
2. **kind = round-to-nearest-snap**: cursor 计算 col-ruler 上 6 stop 距离, 选最近 stop snap (per ADR-0017 hit-test)
3. **方向记录**: snap 时记录 user 意图方向 (`'up' | 'down' | 'kept'`); 影响 col-ruler highlight 方向 + size-tooltip 显示文案 (e.g., "snap → 1/2" up 方向)

非 snap 值**永远不入持久化** (拒绝 silent-truncate); UI 必显示 snap 反馈.

### D7 — MDX serialize: 保留 col / row / colSpan / rowSpan 字段 (git diff 友好)

mdx-bridge `tiptapToMdx` serialize 每个 block 时必输出 grid attrs 作为 MDX attrs:

```mdx
<Canvas col={7} row={2} colSpan={6} rowSpan={6} title="Neuron map" />
<Code col={1} colSpan={6} rowSpan={4} lang="python">...</Code>
<Image col={7} colSpan={6} rowSpan={3} src="..." alt="..." />
```

约束:
- `col` + `colSpan` always serialize (D2 必填)
- `row` serialize 仅当 user 显式设定行号 (D2 可选; auto-place 省略)
- `rowSpan` serialize 仅当 NOT markdown block (D3 不对称; markdown 不写)

`mdxToTiptap` 反向: 解析 MDX attrs 重建 grid position; 缺失 col/colSpan = invalid (mdx-bridge throws); row 缺失 = undefined (auto-place); rowSpan 缺失:
- markdown block (mdxComponent='Markdown' OR kind='prose'): rowSpan='auto'
- 其他 block: rowSpan=1 (defensive default + console.warn 提示 author 应显式)

### D8 — Astro renderer grid layout support

apps/site Astro renderer (Stage C.2 实施) 必须:

1. wrap notes content 在 `<div class="skb-grid">...</div>` (或 `.gblock-grid` per design-tokens naming convention; 由 ADR-0018 Pre-A4 锁)
2. 每个 block 渲染加 `style={{ gridColumn, gridRow }}` 由 D2 公式生成
3. `@media` viewport breakpoint 切换 `grid-template-columns: repeat(N, ...)` 12/6/1 (per D5)
4. 1-col mobile 路径: `grid-template-columns: 1fr` + 所有 blocks `grid-column: 1` + rowSpan=auto rendering-derived (per D5 rowSpan adapt)

Astro renderer 是静态预渲染; client hydration 不变 grid 结构 (Tiptap NodeView 嵌 grid context 仅 Tiptap-managed prose 块内的 inline 富文本; per Pre-A3 ADR-0017 D11 "Tiptap inside / grid outside 分层").

### D9 — W5-1 invariant on `block-foundation/CONTRACT.md`

NEW invariant 加入 `packages/block-foundation/CONTRACT.md` `## Invariants` section:

> **W5-1: Grid context dimensions ↔ colSpan/rowSpan 联动 (ADR-0016)**: 任意 block 在 grid context 渲染时, 其 visible bounding box dims 由 `{col, row?, colSpan, rowSpan}` 唯一决定:
>
> - `width(px) = colSpan * (1fr) + (colSpan - 1) * gap` — 1fr = `(container-width - 11 * gap) / 12`; 实际 px 由响应式 (D5) 动态计算 (12-col / 6-col / 1-col)
> - `height(px) = rowSpan * row-h + (rowSpan - 1) * gap = rowSpan * 62 - 14` (per D4; row-h=48, gap=14 默认)
> - markdown block (rowSpan='auto') height 由 `useAutoRowSpan` hook ResizeObserver-driven (per D3)
>
> **HeavyBlockBoundary consumer (per ADR-0014 v0.5 amendment, Stage C.2)**: `heavyBoundaryDimensions` per-kind 必须与 colSpan/rowSpan 联动; e.g., AgentFlow `colSpan=6 rowSpan=6` → dims = `{ width: 6*(1fr)+5*14, height: 6*48+5*14 = 358 }`. 默认 fallback dims (Wave 4 ADR-0014 D5 锁定值) 仅用于 SSR 阶段 colSpan/rowSpan 未知时.

**Forward-compat**: W5-1 是 grid context 渲染的不变量, NOT 数据模型 schema 强制. 数据模型 schema 强制由 Zod schema (BlockUIDefinition.gridSchema, per D10) 实现.

**SSR vs hydration 阶段策略 (per Q6 absorbtion — W5-1 公式 1fr 在 SSR 不可知 之歧义)**:

W5-1 公式 `width = colSpan * (1fr) + (colSpan - 1) * gap` 中 `1fr` 是 viewport + container-width derived dynamic value. SSR (Astro static build) 阶段 viewport-width 不可知 → `1fr` 不可定值. 公式必须分两个阶段:

| Phase | dims source | data attrs | block 类型行为 |
|---|---|---|---|
| **SSR** (Astro static build) | fallback dims (heavy blocks: per ADR-0014 W4-1 `heavyBoundaryDimensions`; non-heavy blocks: aspect-ratio CSS-driven) | `data-grid-fallback="ssr"` | heavy block 显示 skeleton with fixed dims; non-heavy block CSS `aspect-ratio` + `width: 100%` 占位 |
| **Hydration** (browser; post grid container mount) | 首次 measure container `getBoundingClientRect().width / 12` = 真实 1fr; 一次性替换所有 blocks dims | `data-grid-fallback="hydrated"` | 所有 blocks dims 切换 from fallback to W5-1 公式精确值 |
| **Steady state** (post-hydration) | W5-1 公式 dynamic (per matchMedia viewport change → re-measure) | (data attr removed OR `data-grid-fallback="dynamic"`) | drag/resize/responsive 转场都触 W5-1 路径 |

实施约束:
- SSR 阶段 fallback dims 必含 source label (`data-grid-fallback="ssr"`) — 调试 / a11y / 测试可观测
- hydration 后 一次性替换 (NOT progressive) 避免 CLS (zero layout shift) — heavy block 已通过 ADR-0014 W4-1 确保 fallback dims = post-hydration dims; non-heavy block 通过 aspect-ratio CSS 确保 SSR HTML 占位 byte 数与 hydration 后近似
- HeavyBlockBoundary `heavyBoundaryDimensions` (per ADR-0014 W4-1 D5; v0.5 amendment 在 Stage C.2 联动 colSpan/rowSpan): SSR 用 W4-1 fallback; hydration 后由 W5-1 公式 derive (per ADR-0014 v0.5 amendment 的具体 D-list)

### D10 — `BlockUIDefinition` 加 grid 字段 + `gridKind` enum + `proseGridDefaults`

**BlockUIDefinition extension** (per Q7 absorbtion):

`packages/block-foundation/src/types.ts` `BlockUIDefinition<T>` interface 加 optional grid 字段:

```typescript
export interface BlockUIDefinition<T> {
  // ... 既有字段 ...

  /** Grid 默认 position (per ADR-0016 D2). Optional;
   *  consumer (mdx-bridge / editor-shell) 可 override. */
  readonly gridDefault?: BlockGridPosition;

  /** rowSpan 语义 declaration (per ADR-0016 D3 不对称).
   *  'auto' = markdown-style rendering-derived 不入持久化;
   *  'integer' = 用户设定 入持久化.
   *  默认 = 'integer' (defensive backward compat). */
  readonly rowSpanSemantic?: 'auto' | 'integer';

  /** Grid serialize/parse 决策标签 (per Q7 absorbtion — 替代 'mdxComponent="Markdown"
   *  OR kind="prose"' heuristic 字符串反查). 与 BlockKind 4-way union 平行 (NOT
   *  替代; BlockKind 主语义, gridKind 仅 grid serialize/parse 路径决策).
   *  默认 = 与 BlockKind 一致 (mirror). */
  readonly gridKind?: 'prose' | 'component' | 'render' | 'viz';
}
```

mdx-bridge `tiptapToMdx` 与 `mdxToTiptap` (per D7) 通过 `gridKind`/`rowSpanSemantic` 显式查询 (NOT 'mdxComponent === "Markdown"' heuristic), 避免脆弱字符串匹配:

```typescript
const isAutoRowSpan = (
  blockUIDef.rowSpanSemantic === 'auto' ||
  blockUIDef.gridKind === 'prose'
);
```

**`proseGridDefaults` const (per Q8 absorbtion — markdown 在 proseExtensions NOT BlockUIDefinition 的 模型语义来源不一致 修正)**:

`@skb/block-foundation` 暴露与 `proseExtensions` 平行的 `proseGridDefaults` const:

```typescript
export const proseGridDefaults = {
  rowSpanSemantic: 'auto' as const,         // markdown 内容驱动 rowSpan
  gridKind: 'prose' as const,               // prose path serialize/parse 决策
  defaultColSpan: 12,                        // full-width 默认 (user resize 可改 snap)
  // row + col 由 editor-shell grid container 在创建块时注入; defaults 不预设
} as const;
```

editor-shell 在 mount Tiptap NodeView for prose blocks 时 wrap with `proseGridDefaults` 默认值; mdx-bridge serialize/parse 通过 `proseGridDefaults.gridKind === 'prose'` 同步路径决策. 这确保 prose path (proseExtensions) 与 component path (BlockUIDefinition) 共享 grid 语义 schema (per Q8 absorbtion 'GridNodeMetadata 顶层规则 OR proseGridDefaults' — 此 ADR 选 proseGridDefaults 路径, 平行结构, 不引入新顶层 schema).

**block packages migration**:
- `block-callout` / `block-code` / `block-image` / `block-math` / `block-pdf` / heavy plugin placeholders: `gridKind` 与 `BlockKind` 默认 mirror (component / render / viz); `rowSpanSemantic = 'integer'`; `gridDefault = { col: 1, colSpan: 12, rowSpan: 1 }` (full-width default)
- markdown (proseExtensions): 通过 `proseGridDefaults` 暴露 (NOT 经 BlockUIDefinition.gridDefault); editor-shell + mdx-bridge 共同消费
- 所有 block 实施 `effectiveCellHeight(rowSpan, rowH, gap)` + `effectiveColWidth(colSpan, containerWidth, gap, totalCols)` helpers (per Q2 absorbtion — 公式从 design-tokens runtime 常量 derive, 避免硬编码 row-h=48 / gap=14 漂移); helpers 在 `@skb/block-foundation/grid-math.ts` 导出

CONTRACT.md `## Public surface` 必同步 (ADR-0006 D8 + D2 row 1): `BlockGridPosition` + `COL_SNAPS` + `effectiveColSnaps` + `proseGridDefaults` + `effectiveCellHeight` + `effectiveColWidth` + `BlockUIDefinition.gridDefault/rowSpanSemantic/gridKind` 字段.

### D11 — Tiptap inside / grid outside 分层

Per granularity v0.3.4 § "Tiptap 仅管 prose 块内 inline 富文本, grid + drag 在 Tiptap 之外":

- **grid + drag** = 编辑器 application layer 管 (editor-shell / apps/site grid container)
- **Tiptap NodeView** = 仅管块内 inline 富文本 (markdown 块的 prose, code 块的 syntax highlight, 等)
- block grid attrs = Tiptap NodeView attrs 作 **被动数据** (NodeView 读取展示, NOT 主动 mutate; mutation 由 grid container 调用 NodeView attr-set API)

**实施约束**: editor-shell grid container 必须在 Tiptap editor 实例外层 wrap; Tiptap doc 不直接控制 block 位置. Block 移动 / resize / drag 全部经 grid container API → editor-shell mutation pipeline → Tiptap state attr update → 同步 MDX (per Wave 5 plan v0.2 Stage C.4 save 路径 接口冻结 in Pre-A4).

### D12 — Layout mutation 单一源 (`layoutEpoch` reducer; per Q9 absorbtion)

block grid mutations (drag from grid container / resize from handle / `useAutoRowSpan` auto-measure / responsive transition / undo-redo) 都必经过 **single layout reducer** in editor-shell with `layoutEpoch` version stamp:

```typescript
// editor-shell layout reducer (Stage C.2 实施 PR scope; ADR-0016 D12 锁 schema)
export interface LayoutMutation {
  readonly source: 'drag' | 'resize' | 'auto-measure' | 'responsive' | 'undo-redo' | 'mdx-load';
  readonly blockId: string;
  readonly nextPosition: Partial<BlockGridPosition>;  // 部分更新 OK
  readonly epoch: number;          // monotonically increasing per editor-shell instance
  readonly timestamp: number;       // performance.now()
}

export function layoutReducer(state: LayoutState, mutation: LayoutMutation): LayoutState {
  // 冲突仲裁规则 (per Q1 + Q9 absorbtion):
  // 1. user-initiated > derived: drag/resize > auto-measure (markdown rowSpan='auto')
  // 2. higher epoch wins on race
  // 3. undo-redo 走 separate epoch space (history-replay; 不 affect 同 epoch user mutation)
  // ...
}
```

冲突仲裁规则 (Q1 + Q9 absorbtion 联合 lock):

| Source A | Source B | 优先级 | Rationale |
|---|---|---|---|
| `drag` (block 移动) | `auto-measure` (markdown rowSpan='auto' 同帧改) | drag wins | user-initiated > derived |
| `resize` (block 大小) | `auto-measure` | resize wins | 同上 |
| `responsive` (viewport 切换) | `auto-measure` | responsive wins, then auto-measure 在 T4 phase 重新测 | per D5 转场态 FSM |
| `mdx-load` (initial state) | `auto-measure` | mdx-load wins (initial); auto-measure post-mount 接管 | 启动顺序 |
| `undo-redo` | 任意 user mutation | 同源 epoch wins (latest) | history-replay 走专用 epoch space |

**协同/多人编辑假设**: Wave 5 假设 **single-user single-session**. CRDT/OT 协同编辑 OUT OF SCOPE (Phase 2+); editor-shell `layoutEpoch` 是 single-source ordering, NOT 分布式 vector clock. Stage C.4 实施 (apps/site `/notes/[slug]/edit` mount editor-shell) 保证一次只一个 active editor session.

### 权威矩阵 + 冲突仲裁规则 (per Q1 absorbtion — 字段归属/校验权威/写入者优先级 显式化)

| 关注点 | 权威 | 路径 |
|---|---|---|
| **字段归属** (BlockGridPosition shape: col/row/colSpan/rowSpan) | `@skb/block-foundation` `BlockGridPosition` interface (per D2) | TypeScript types + Zod schema export |
| **数据模型校验** (col 1-12 / colSpan ∈ COL_SNAPS / rowSpan integer ≥ 1 OR 'auto') | `@skb/block-foundation/src/grid-schema.ts` Zod schema | 在 mdx-bridge `mdxToTiptap` 解析时 .parse() 强制; runtime 也 validate |
| **rowSpan='auto' 决策路径** | `BlockUIDefinition.rowSpanSemantic` (per D10) OR `proseGridDefaults.rowSpanSemantic` (prose path) | gridKind='prose' shortcut 也 OK |
| **mutation 入口** (drag/resize/auto-measure) | `@skb/editor-shell` layoutReducer (per D12) | 唯一允许的 mutation pipeline |
| **CSS application** (style.gridColumn/gridRow) | `@skb/editor-shell` grid container OR apps/site Astro renderer | 消费 BlockGridPosition; 不 mutate |
| **Conflict 仲裁** | layoutReducer 冲突仲裁规则 (per D12 表格) | source priority + epoch ordering |
| **Persistent format** (MDX serialize) | `@skb/mdx-bridge` `tiptapToMdx` / `mdxToTiptap` (per D7) | round-trip 字节等价 (AC#2) |

任何字段 / 算法 / 决策 路径偏离权威矩阵 = 跨 package 漂移; ADR-0006 8-point audit item #5 + #6 必触发 reviewer 审查.

## Acceptance criteria (AC list)

`@skb/block-foundation` 包 + `@skb/mdx-bridge` 包 + `apps/site` Astro renderer 必满足:

1. **AC#1 (TypeScript types compile)**: `BlockGridPosition` interface (D2 shape) + `COL_SNAPS` const (D6) export from `@skb/block-foundation`; `pnpm tsc --noEmit -p packages/block-foundation` 0 errors.
2. **AC#2 (mdx-bridge serialize round-trip)**: 每 block kind (callout/code/image/math/pdf + 3 heavy plugin placeholder + markdown) round-trip fixture: `parse(serialize(input)) === input` 字节等价 (per ADR-0008 D2 RFC consumer + ADR-0014 W4-1 sister)
3. **AC#3 (markdown rowSpan='auto' NOT in MDX output)**: serialize markdown block with rowSpan='auto' → output MDX no `rowSpan=` attr present
4. **AC#4 (其他 block rowSpan integer in MDX output)**: serialize non-markdown block with rowSpan=N (integer) → output MDX has `rowSpan={N}` attr present
5. **AC#5 (useAutoRowSpan hook ResizeObserver vitest)**: 4 fixture (empty md / 1 段 / 多段 / paste-large) verify rowSpan integer correct + unmount no leak
6. **AC#6 (Astro renderer grid layout)**: apps/site `astro build` produces `.skb-grid { grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-flow: row; }` (NOT dense) — verifiable via `grep -E 'grid-auto-flow:\s*row[^a-z]' dist/_astro/*.css`; absence of `dense` keyword
7. **AC#7 (Responsive matchMedia mock)**: vitest with `matchMedia` mock 切换 `(min-width: 1024px)` / `(min-width: 768px) and (max-width: 1023px)` / `(max-width: 767px)` 验证 `effectiveCols(viewport)` = 12 / 6 / 1
8. **AC#8 (rowSpan adapt on mobile)**: 1-col mobile 路径 vitest: 任意 rowSpan integer 值 (持久化) 在 `effectiveCols=1` rendering 路径下被 `useAutoRowSpan` overide (NOT 改持久化值; rendering 层 derive)
9. **AC#9 (COL_SNAPS const)**: `COL_SNAPS` exported as `[2, 3, 4, 6, 8, 12]` exact tuple shape (`as const`); type `ColSnap = (typeof COL_SNAPS)[number]` (= `2 | 3 | 4 | 6 | 8 | 12`)
10. **AC#10 (BlockUIDefinition grid 字段)**: `BlockUIDefinition<T>` interface includes optional `gridDefault?: BlockGridPosition` + `rowSpanSemantic?: 'auto' | 'integer'`; existing 8 block packages migrated (in Stage C.2 实施 PR; ADR lock 仅 schema)
11. **AC#11 (W5-1 invariant assertable)**: `packages/block-foundation/CONTRACT.md` `## Invariants` § contains W5-1 prose with 公式 `height(px) = rowSpan * 62 - 14` + ADR-0014 v0.5 amendment 引用; `grep -cE '^- \*\*W5-1' packages/block-foundation/CONTRACT.md` ≥ 1

Stage C.2 实施 PR 必逐条 cross-reference AC#1-#11 验证 (per ADR-0011 D2 SOTed-PR.md `## acceptance` 字段).

**AC testability 分层 (per Q11 absorbtion — partial)**:

- **AC#5 split**: AC#5a = jsdom mock ResizeObserver vitest (4 fixture: empty / 1段 / 多段 / paste-large) + AC#5b = Playwright real-render assertion (font-loading scenario via `document.fonts.ready` await; image-load scenario; multi-RO 抖动收敛 ≤ 1 commit per rAF window)
- **AC#8 ResizeObserver + matchMedia 协同**: vitest 同时 mock matchMedia 切换 + 触发 ResizeObserver; 验证 mobile path rowSpan-rendered ≠ rowSpan-persisted (per D5 转场态)
- **AC#11 W5-1 invariant 语义证明**: grep prose presence (现) + parse 公式 numeric assertion (Stage C.2 实施 PR 加: extract `height(px) = rowSpan * 62 - 14` 公式 + assert rowSpan=1→48, rowSpan=2→110, rowSpan=6→358 numeric)

**部分 absorbtion (Q11 low-severity)**: 完整 e2e 测试体系 (jsdom + Playwright + visual-smoke 三层 fixture matrix) NOT 在 Pre-A2 ADR scope; Stage C.2 实施 PR 当 AC#5/#8 落 vitest+playwright 时按上述分层 implement. Pre-A2 ADR 仅 schema lock + AC 框架; Stage C.2 实施 PR 加 fixture 实质.

## Consequences

### Positive

- Wave 5 Stage C.2 grid + drag/drop 全部从此数据模型 derive; ADR-0017 (drag/drop UX) 直接消费 D2 + D6 + D8 (col/colSpan/rowSpan + COL_SNAPS + Astro renderer)
- markdown rowSpan='auto' 不对称显式化 = 避免 Wave 5 Stage C.4 save 路径 implementation 时 silent drift; mdx-bridge serialize 边界明确
- W5-1 invariant 给 ADR-0014 v0.5 amendment (HeavyBlockBoundary dims 联动 colSpan/rowSpan) 提供精确 source; 避免 heavy plugin placeholder dims hard-coded 漂移
- COL_SNAPS = [2,3,4,6,8,12] 显式锁 (v0.3 user 共识) = ADR-0017 col-ruler + size-tooltip 实施时不再 second-guess part 2 vs demo drift #6
- Tiptap inside / grid outside 分层 (D11) 显式化 = editor-shell Stage C.4 wire-up 时不会误将 block grid 攮入 Tiptap NodeView attrs mutation pipeline

### Negative

- 数据模型 复杂度 +1 字段 (rowSpan: number | 'auto') = TypeScript 类型 narrowing 至消费端;
  mitigation: BlockUIDefinition.rowSpanSemantic 显式 declaration (D10) + W5-1 invariant 文档化
- Astro renderer + editor-shell grid container 双 implementation = 视觉样式 + 响应式 token 必须 single-source-of-truth (design-tokens 包, ADR-0018 Pre-A4 锁); 漂移风险 mitigated via ADR-0006 D8 8-point asymmetry audit (item #5: 算法 + 运行时常量复刻)
- ResizeObserver race / paste-large-md jank = useAutoRowSpan rate-limit 实施约束;
  mitigation: AC#5 vitest 覆盖 4 fixture + Wave 5 plan v0.2 Risk matrix C.2 行已识别 + rate-limit rAF 实施

### Neutral / explicit acknowledgements

- COL_SNAPS = [2,3,4,6,8,12] 锁 = part 2 user 共识 [1/12, ...] 历史决策被 v0.3 共识 override; 历史记录保留在 granularity v0.3.4 "v2 demo vs 设计意图 6 个 drift" #6 行
- 1-col mobile 路径 rowSpan='auto' 强制 (D5+D8) 不改持久化值; rendering 层 derive 而非数据模型 mutate; 与桌面 / 平板 path 不对称 (额外的"渲染 override")
- Modal canvas (granularity 旧 ADR-0014 = Wave 5+ ADR-0019+) 留 Phase 2+; 此 ADR 不规定 modal 内部 grid 行为

## Sister-document sync (per Q10 absorbtion — W5-1 forward-pointer to 4 sister CONTRACTs)

ADR-0016 D9 `block-foundation/CONTRACT.md` 锁 W5-1 invariant 主权威; **4 sister CONTRACTs 必须在 Stage C.2 实施 PRs 中同步加 W5-1 forward-pointer reference** (per ADR-0006 8-point audit item #6 sister-doc-sync; same-PR with 各自 implementation):

| Sister CONTRACT | Stage C.2 实施 PR scope | Required forward-pointer 内容 |
|---|---|---|
| `packages/heavy-block-boundary/CONTRACT.md` (assumed exists per Wave 4 ADR-0014 W4-1 sister) | ADR-0014 v0.5 amendment PR | "W5-1 联动 colSpan/rowSpan: heavyBoundaryDimensions per-kind formula derive from W5-1; SSR fallback 与 hydration 切换路径见 ADR-0016 D9" |
| `packages/mdx-bridge/CONTRACT.md` | mdx-bridge col/row/colSpan/rowSpan serialize PR (Stage C.2 D7) | "MDX serialize 字段 col/row/colSpan/rowSpan per ADR-0016 D7; markdown rowSpan='auto' 不写 不对称 per D3+D4 + proseGridDefaults D10" |
| `apps/site/CONTRACT.md` | apps/site Astro renderer grid layout PR (Stage C.2 D8) | "Astro renderer `.skb-grid` container 渲染规则 per ADR-0016 D8; `@media` Responsive 12/6/1 per D5 + 转场态 FSM" |
| `packages/editor-shell/CONTRACT.md` (assumed exists; create if NOT) | editor-shell grid 集成 PR (Stage C.2) | "editor-shell layoutReducer + layoutEpoch single-source mutation per ADR-0016 D12; 冲突仲裁规则 per 权威矩阵 section" |

至 **Pre-A2 (this ADR lock) NOT touch** these sister CONTRACTs (留 Stage C.2 实施 PR per scope-fence whitelist; Wave 5 plan v0.2 D12); ADR-0016 prose 仅 forward-pointer 这些 sync requirements. Stage C.2 实施 PR REVIEW + ACCEPT 必逐 sister CONTRACT 验证 forward-pointer 落地 (ADR-0006 D8 同 commit sync; reviewer codex 8th-class hunt 必查).

## Plan-challenger codex absorbtion (locked at v0.1.1 lock-time)

per [ADR-0007 D5](ADR-0007-job-function-codex-heavy-execution.md) + [ADR-0011 D2](ADR-0011-linear-pipeline-execution-model.md) v0.1.1 SOTed-PR.md amendment + memory `feedback_soted_pr_md_discipline.md` + ADR-0013 D4 R13 + Wave 4 Pre-A2 ADR-0014 12/12 absorbed precedent.

dispatch: `codex exec --yolo --profile plan-challenger ...` (Pre-A2 ADR-0016 design-lock 4-round style); audit log path: `/tmp/codex-runs/2026-05-04-Pre-A2-plan-challenge.txt` raw (282 KB / 4267 lines; below R21 500 KB threshold) + `docs/audits/codex-runs/2026-05-04-Pre-A2-plan-challenge.txt` curated archive (113 lines: head -50 prompt + grep verdict-shaped lines).

| # | Challenge | Severity | Verdict | Reason / Locked at |
|---|---|---|---|---|
| Q1 | D-list "字段归属/校验权威/写入者优先级" 模糊; 缺权威矩阵 + 冲突仲裁规则 | medium | **ABSORBED** | NEW 权威矩阵 + 冲突仲裁规则 section (after D12 + before AC list); 7-row 关注点表 explicit. Locked at 权威矩阵 section. |
| Q2 | D2 公式 row-h=48 / gap=14 硬编码 (主题 token 变化漂移风险) | medium | **ABSORBED** | D10 加 `effectiveCellHeight(rowSpan, rowH, gap)` + `effectiveColWidth(colSpan, containerWidth, gap, totalCols)` helpers in `@skb/block-foundation/grid-math.ts`; design-tokens (ADR-0018) authority. Locked at D10. |
| Q3 | D3/D4 markdown 行高自适应边界覆盖不全 (字体 / 图片 / 多次 RO 抖动收敛) | high | **ABSORBED** | D3 加 "两阶段稳态" 3-stage 规则 + 字体加载 `document.fonts.ready` await + Δ rowSpan ≥ 1 阈值规则. Locked at D3. |
| Q4 | D6 6-col / 1-col effective COL_SNAPS + 非 snap 回退策略未明示 | medium | **ABSORBED** | D6 加 `effectiveColSnaps(viewportCols)` 显式 mapping (12/6/1 → 不同 snap 集合) + non-snap 拒绝 + 方向记录 (round-up 默认). Locked at D6. |
| Q5 | D5 跨断点瞬态行为 (12↔6↔1 切换顺序 / colSpan preserve / rowSpan freeze / 320ms 稳定过渡) 未规范 | high | **ABSORBED** | D5 加 "转场态有限状态机" 5-phase (T0-T4); 总转场预算 ≤ 320ms; mobile vs desktop rowSpan 不对称认知 mitigation. Locked at D5. |
| Q6 | D9/W5-1 SSR/SSR fallback 计算歧义 (1fr 需容器宽度; fallback 仅 heavy-blocks) | high | **ABSORBED** | D9 加 "SSR vs hydration 阶段策略" 3-phase 表 (SSR/Hydration/Steady state); `data-grid-fallback` source label; 非 heavy block aspect-ratio CSS-driven SSR 占位. Locked at D9. |
| Q7 | D7 markdown 判断 'mdxComponent="Markdown" OR kind="prose"' heuristic 字符串反查脆弱 | medium | **ABSORBED** | D10 加 `gridKind: 'prose' | 'component' | 'render' | 'viz'` 字段 (与 BlockKind 平行 NOT 替代); mdx-bridge `tiptapToMdx`/`mdxToTiptap` 通过 `gridKind` 显式查询. Locked at D10. |
| Q8 | D10 rowSpanSemantic 在 BlockUIDefinition 但 markdown 在 proseExtensions 模型语义来源不一致 | medium | **ABSORBED** | D10 加 `proseGridDefaults` const export from `@skb/block-foundation` (与 `proseExtensions` 平行); editor-shell + mdx-bridge 共同消费. NOT 引入 `GridNodeMetadata` 顶层规则 (太重). Locked at D10. |
| Q9 | D11 NodeView attrs '被动数据' 但 useAutoRowSpan + drag/resize 同帧竞争 rowSpan 仲裁未定义 | high | **ABSORBED** | NEW D12 "Layout mutation 单一源 (layoutEpoch reducer)"; 冲突仲裁规则表 (drag > auto-measure; responsive wins T1 then auto-measure T4); single-user 单 session 假设 explicit; CRDT/OT Phase 2+. Locked at D12. |
| Q10 | W5-1 sister-document sync 未闭环 (ADR-0014 / mdx-bridge / apps/site / heavy-block 同步缺) | medium | **ABSORBED** | NEW Sister-document sync section (after AC list); 4 sister CONTRACTs forward-pointer 表 + Stage C.2 实施 PR 各自 same-PR sync. Pre-A2 NOT touch sister CONTRACTs (scope-fence). Locked at Sister-document sync section. |
| Q11 | AC 测试分层不全 (ResizeObserver + matchMedia + breakpoint 组合 e2e + jsdom 与真实渲染器一致性) | low | **PARTIALLY ABSORBED** | AC list 加 "AC testability 分层" note: AC#5 split jsdom + Playwright; AC#8 ResizeObserver + matchMedia 协同; AC#11 grep + numeric. 完整 fixture matrix 留 Stage C.2 实施 PR (per Pre-A2 schema lock vs Stage C.2 实施 PR 分离). Locked at AC list trailing paragraph. |
| Q12 | D2 trigger Pre-A2 写 row 1+4; Stage C.2 实施跨包 ≥3 packages 必 row 5 | medium | **ABSORBED** | NEW Compliance trailing note: Pre-A2 lock 与 Stage C.2 实施触发面分离; Pre-A2 row1+row4; Stage C.2 任 PR touch ≥3 packages (mdx-bridge + block-foundation + editor-shell + apps/site + heavy-boundary) 必 row 5 + stage 4. Locked at Compliance section. |

**Result**: 12/12 challenges absorbed (4 high + 7 medium + 1 low; codex verdict 4 high + 7 medium + 1 low advisory). 11 ABSORBED + 1 PARTIALLY ABSORBED (Q11 low-severity testability layering — Pre-A2 schema lock 加 note; 完整 fixture matrix 留 Stage C.2 实施 PR). Plan v0.1 (initial draft) → **v0.1.1 (post-absorbtion lock; status proposed)**. No challenge rejected; orchestrator did not push back fundamentally on plan-challenger verdicts.

**Lock evidence**: this absorbtion table + each verdict cross-references the D-section / AC# / W5-1 invariant prose / NEW section that codifies the change. Reviewers verify by walking each row's "Reason / Locked at" link to the corresponding section.

## Compliance

- This ADR satisfies [Wave 5 plan v0.2 Pre-A2 acceptance](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) (ADR-0016 design lock + plan-challenger 4-round + W5-1 invariant in CONTRACT.md)
- This ADR fulfills [ADR-0011 D1 stage 4 PRE-COMMIT CLAUDE REVIEW](ADR-0011-linear-pipeline-execution-model.md) trigger criteria (Row 4 NEW ADR + Row 1 CONTRACT.md W5-1 invariant)
- This ADR ratifies granularity doc v0.3.4 § "ADR-0012 grid 数据模型与流动" body content (gatekeeper-side scratch at `/mnt/d/download/web/v2-design-granularity.md`, NOT in git per gatekeeper-side discipline; prose form per memory `feedback_lychee_user_local_paths`) 旧编号 0012 → Wave 5 ADR-0016 新编号 (per Wave 5 plan v0.2 D5 ADR 编号映射表)
- This ADR does NOT amend [ADR-0009](ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union; grid 字段 加于 `BlockUIDefinition` 不动 BlockKind
- This ADR does NOT amend [ADR-0008](ADR-0008-wave-2-entry-policies.md) D1 dead-dep policy; ADR-0016 不新增 package, 仅扩展 block-foundation `BlockUIDefinition`
- This ADR sets up Wave 5 Stage C.2 ADR-0014 v0.5 amendment (HeavyBlockBoundary dims grid context 联动 W5-1)
- **Pre-A2 D2 trigger 触发面分离 (per Q12 absorbtion)**: 此 Pre-A2 ADR design-lock = D2 row 1 (CONTRACT W5-1) + row 4 (NEW ADR) HIT → stage 4 PRE-COMMIT CLAUDE REVIEW fires. **Stage C.2 实施 PR 触发面更广**: 任何 Stage C.2 PR touching ≥3 packages (典型: mdx-bridge + block-foundation + editor-shell + apps/site + heavy-block-boundary 跨包改动) **必 D2 row 5 (cross ≥3 packages) + row 1 (sister-doc sync) + row 4 (ADR-0014 v0.5 amendment co-ship 时) HIT → stage 4 强制**. orchestrator 在 Stage C.2 plan-challenger (Pre-A5 v1.0 lock 时) 必逐 PR 重判 D2 trigger; Pre-A2 lock 不预设 Stage C.2 D2 行为

## Related

- [Wave 5 plan v0.2](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — Pre-A2 scope source + ADR 编号映射表 D5
- [ADR-0015 D6 Wave 5 plan-draft handoff](ADR-0015-wave-4-close.md) — explicit authorization for Pre-A2 work
- [ADR-0014 HeavyBlockBoundary](ADR-0014-heavy-block-boundary.md) — W4-1 invariant precedent; v0.5 amendment in Stage C.2 consume W5-1
- [ADR-0011 D1 linear pipeline](ADR-0011-linear-pipeline-execution-model.md) — KEPT for Wave 5
- [ADR-0009 BlockKind 4-way union](ADR-0009-block-kind-union-expansion.md) — BlockKind 不动; grid 字段 加于 BlockUIDefinition
- [ADR-0006 8-point asymmetry audit](ADR-0006-asymmetry-audit-checklist.md) — item #5 + #6 + #8 必查 (D7 mdx-bridge serialize / D9 W5-1 sister CONTRACT.md / D10 BlockUIDefinition authority)
- [ADR-0003 Headless / Presentational](ADR-0003-headless-presentational-split.md) — BlockUIDefinition (D10 加 grid 字段) 是 UI 端 schema authority
- [block-foundation CONTRACT.md](../../packages/block-foundation/CONTRACT.md) — W5-1 invariant 加 (D9)
- [block-foundation RFC.md](../../packages/block-foundation/RFC.md) — consumer-facing tutorial; Stage C.2 实施 PR 可补足 grid 字段 walkthrough (out of Pre-A2 scope)
- granularity doc v0.3.4 (`/mnt/d/download/web/v2-design-granularity.md`) — gatekeeper-side scratch; § "v2 整体用户体验" + § "ADR-0012 grid 数据模型与流动" body 是此 ADR 设计意图 source (per Wave 5 plan v0.2 D5 ADR 编号映射表 0012 → 0016)
- v2-styles.css (`/mnt/d/download/web/v2-styles.css` lines 140-145) — grid CSS implementation reference (`.grid` 容器 grid-auto-flow row + grid-auto-rows var(--row-h) + gap var(--gap))
