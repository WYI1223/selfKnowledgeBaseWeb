# ADR-0017: Drag/Drop UX — 4 边缘对称 + outline overlay 方案 A + edge rects + lift 模式

| 字段 | 值 |
| ---- | --- |
| 状态 | proposed (v0.1.1 post 13-Q plan-challenger absorbtion 2026-05-04: 11 ABSORBED + 2 PARTIALLY ABSORBED) |
| 日期 | 2026-05-04 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | [Wave 5 plan v0.2 D1+D5](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) (Pre-A3 ADR-0017 drag/drop UX design lock) + reframe v2 memory `project_wave4_reframe_v2.md` + granularity doc v0.3.4 § "v2 整体用户体验 / 4 种 Drop 语义 / Drop 视觉 / 命中检测算法 / 源块 lift" body (旧编号 0013 → Wave 5 实际 ADR-0017 per plan v0.2 ADR 编号映射表 / D5) |
| 关系 | 不替代任何 ADR；扩展 [ADR-0016](ADR-0016-grid-data-model.md) (consume W5-1 invariant + COL_SNAPS + effectiveColSnaps + layoutEpoch reducer); 扩展 [ADR-0014](ADR-0014-heavy-block-boundary.md) (drag/drop 触发 HeavyBlockBoundary skeleton during transit); 不动 [ADR-0009](ADR-0009-block-kind-union-expansion.md) BlockKind |

## Context

Wave 5 reframe v2 (2026-05-04 gatekeeper directive; absorbed via Wave 5 plan v0.2 Pre-A3 scope) 把 **drag/drop UX** 前移到 Wave 5 Stage C.2 实施. 此 ADR 锁定 4 边缘对称 drop modes + outline overlay 方案 A + 命中检测算法 + 源块 lift 模式 + col-ruler + drag-ghost + drop-pulse 共识, 作为 Stage C.2 实施 PR 的契约.

设计源 = granularity doc v0.3.4 § "4 种 Drop 语义 (4 边缘对称)" + § "Drop 视觉: 静态底层 + per-affected-block outline overlay" + § "命中检测算法 (推荐选项 1)" + § "v2 编辑器 UX 要素 / Outline overlay" + § "v2 demo vs 设计意图的 6 个 drift" body (旧编号 0013 → Wave 5 ADR-0017 新编号 per plan v0.2 D5 ADR 编号映射表) + drag-storyboard.css 实施现状.

### 设计共识 (gatekeeper-locked)

核心动作: **放 / 移 / 缩** 三种, 全部由拖完成. 没有右键菜单, 没有 toolbar, 没有 slash 命令. 拖到 host 边缘 28px 内触发 split (切 host 半 OR 插行); 拖到网格空区触发 empty 落定; 拖到块内部非边缘仅 ghost 跟手不显示 outline.

drag/drop 与 grid data model (ADR-0016) 的边界: ADR-0016 锁数据模型 + 流动 + 响应式; ADR-0017 锁 mutation 触发器 + 视觉反馈 + 命中算法. 共享 BlockGridPosition shape + COL_SNAPS + W5-1 width/height 公式 + D12 layoutEpoch reducer.

### 与 v2 demo 实施的 drift (per granularity v0.3.4 drift table)

| # | 设计意图 | v2 demo 现状 | Wave 5 处理 |
|---|---|---|---|
| 1 | 4 边缘对称 (左右切 host / 上下插行) | 仅 right + bottom | ADR-0017 D1 锁 4 边对称 |
| 2 | 静态底层 + per-block outline overlay 方案 A | 实际 reflow simulation 方案 B 半成品 + bug | ADR-0017 D4 锁方案 A 真正实施 |
| 5 | EDGE_SPLIT_PX = 14 (part 3 共识) | 死常量; 实际 EDGE_W = 28 (half-in/half-out) | ADR-0017 D2 锁 EDGE_W = 28 (= 14 进 + 14 出 = gap=14 数学对应) |

drift #3 (grid-auto-flow) + #4 (响应式) + #6 (Snap) 属于 ADR-0016 scope; 此 ADR 不动.

### Wave 5 stage 关系

- **Pre-A2 ADR-0016** ✅ accepted: 数据模型 + 流动 + COL_SNAPS + W5-1 invariant + D12 layoutEpoch
- **Pre-A3 (this ADR)**: drag/drop UX + 命中算法 + outline overlay + 源块 lift
- **Pre-A4 ADR-0018**: v2 视觉 migration + save-path 接口冻结
- **Stage C.2 实施**: drag/drop UX 完整实施 (per ADR-0017 D-list); 消费 ADR-0016 W5-1 + D12 layoutEpoch + COL_SNAPS

ADR-0011 D1 KEPT 不变. Pre-A3 plan-challenger codex 4-round per ADR-0007 D5 + R13 + Wave 4 Pre-A2 ADR-0014 12/12 + Wave 5 Pre-A2 ADR-0016 12/12 absorbed precedent.

## Decision

### D1 — 4 边缘对称 drop modes (split-left/right/top/bottom + empty + none)

| mode | 触发 | 行为 | layoutMutation source |
|---|---|---|---|
| `split-left` | 拖到 host 左边缘 EDGE_W (28px) 内 | host 缩到右半 (`colSpan / 2`); 新块占左半 (`col=host.col, colSpan=host.colSpan/2`) | `'drag'` |
| `split-right` | 拖到 host 右边缘 EDGE_W 内 | host 缩到左半; 新块占右半 (`col=host.col + host.colSpan/2`) | `'drag'` |
| `split-top` | 拖到 host 上边缘 EDGE_W 内 | 在 host 上方插新行; host 整体下移 + 后续行下移; 新块占整 row colSpan=host.colSpan | `'drag'` |
| `split-bottom` | 拖到 host 下边缘 EDGE_W 内 | 在 host 下方插新行; 后续行下移; 新块占整 row colSpan=host.colSpan | `'drag'` |
| `empty` | 拖到网格空区 (无 host edge rect 命中) | 新块直接落定 grid-auto-flow row 决定行号 | `'drag'` |
| `none` | 拖到 host 内部非边缘 (距离 4 edges 都 > EDGE_W) | 不显示 outline overlay; 仅 ghost 跟手 | (no mutation; cancel-on-release) |

**重要区分** (per granularity v0.3.4 共识):
- `split-left` / `split-right` = **切 host 一半** (host 被压缩 colSpan / 2)
- `split-top` / `split-bottom` = **插新行** (host 不被切; 仅位置可能下移)

切 host 的 colSpan/2 必落到 effective COL_SNAPS (per ADR-0016 D6 + Q4 absorbtion `effectiveColSnaps`). 若 host.colSpan / 2 不在 COL_SNAPS (e.g., host.colSpan=3 → 1.5 invalid), 则 split-left/right 拒绝触发 (UI 显示 "no-split" cursor); 用户必先 resize host 到 valid even-divide colSpan ∈ {2, 4, 6, 8, 12}.

`split-top` / `split-bottom` 不受 colSpan 限制; 任意 host 都可插行.

### D2 — `EDGE_W = 28px` (half-in/half-out: 14px 进 block 内 + 14px 出 block 外伸进 gap)

```typescript
export const EDGE_W = 28;        // px (= 14 进 + 14 出 = 2 * gap)
export const GAP = 14;            // px (matches ADR-0016 --gap, v2-styles.css line 22)
```

数学对应: `EDGE_W = 2 * GAP`. 这保证:
- block 紧贴时 (gap = 14px), 相邻两 block 的 edge rects 在 14px gap 区域**完全重叠** (左 block 右 edge: x ∈ [block.right - 14, block.right + 14]; 右 block 左 edge: x ∈ [right.left - 14, right.left + 14]; gap = 14, 故重叠 14px)
- cursor 在 gap 区域必命中 ≥ 1 edge rect (空隙不会有 'none' 状态; 必触 split-left OR split-right per tiebreak)
- block 内部 28px 缘外 (距离边 > 14) 才进入 'none' 状态 (per D1)

非 2*GAP 的 EDGE_W 会破坏数学对应:
- EDGE_W < GAP: 重叠不足; cursor 落 gap 中央时 0 命中 → 'empty' fallback (违反 split-* 触发预期)
- EDGE_W > 2*GAP: edge rect 进入 block 内部更深; 'none' 状态变窄到 → split-* 占据过多 cursor 区域

`EDGE_W = 28` (= 2 * GAP=14) 是 well-defined sweet spot.

### D3 — Tiebreak 距离公式 (overlapping edge rects in gap region)

block 紧贴 gap=14px 区域 cursor 命中多 edge rect 时按"到该 edge 的距离 abs(signedDistance)"排序选最近 (per Q3 absorbtion 完整 implementation 见下方 `tiebreak()` 公式; type definition + 距离公式表 一并锁定).

距离公式 (per Q3 absorbtion — signed scalar via 距离公式表 + abs(distance) comparison + velocity 公式化):

| Edge | signedDistance(cursor) | hit 条件 (closed interval) | tiebreak 排序 key |
|---|---|---|---|
| `split-left` (左边) | `cursor.x - block.left` (signed; 负数 = cursor 在 block 外左侧) | `abs(signedDistance) ≤ EDGE_W / 2 = 14` (closed `≤`; >14 = empty/none per Q2 absorbtion) | `abs(signedDistance)` |
| `split-right` (右边) | `block.right - cursor.x` (signed) | `abs(signedDistance) ≤ 14` | `abs(signedDistance)` |
| `split-top` (上边) | `cursor.y - block.top` (signed) | `abs(signedDistance) ≤ 14` | `abs(signedDistance)` |
| `split-bottom` (下边) | `block.bottom - cursor.y` (signed) | `abs(signedDistance) ≤ 14` | `abs(signedDistance)` |

`closest = min(matches, by abs(signedDistance))` (sort 比较用 `abs`, 不是 `signed`).

**Velocity 方向优先公式化 (per Q3 absorbtion)**:

```typescript
// EdgeMatch field name: 'distance' (signed scalar; signed semantics per the 距离公式 table above).
// All comparisons use Math.abs(m.distance); sort/hit conditions use the absolute value.
// blockBounds field provides block.left / block.top for spatial fallback (per Step 3 below).
type EdgeMatch = {
  blockId: string;
  mode: 'split-left' | 'split-right' | 'split-top' | 'split-bottom';
  distance: number;          // signed scalar from 距离公式 table
  blockBounds: { left: number; top: number };  // for 0-velocity spatial fallback
};

type DragVelocity = { vx: number; vy: number };  // px/frame at 16ms; ε = 0.5

function tiebreak(matches: EdgeMatch[], velocity: DragVelocity): EdgeMatch | null {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Step 1: closest by abs(distance)
  const minAbs = Math.min(...matches.map(m => Math.abs(m.distance)));
  const closest = matches.filter(m => Math.abs(m.distance) === minAbs);
  if (closest.length === 1) return closest[0];

  // Step 2: velocity 主轴方向优先 (|velocity| > ε = 0.5px/frame)
  const speed = Math.hypot(velocity.vx, velocity.vy);
  if (speed > 0.5) {
    const dominantAxis = Math.abs(velocity.vx) > Math.abs(velocity.vy) ? 'x' : 'y';
    const dominantSign = dominantAxis === 'x' ? Math.sign(velocity.vx) : Math.sign(velocity.vy);
    // 选 cursor 移动方向上 next-edge 的 match (e.g., 向右拖时优先 split-left on 右侧 host)
    const directionFiltered = closest.filter(m => {
      // 向右 (vx > 0): 优先 split-left (右 block 的左边); 向左 (vx < 0): 优先 split-right (左 block 的右边)
      // 向下 (vy > 0): 优先 split-top (下 block 的上边); 向上 (vy < 0): 优先 split-bottom (上 block 的下边)
      if (dominantAxis === 'x' && (m.mode === 'split-left' || m.mode === 'split-right')) {
        return (dominantSign > 0 && m.mode === 'split-left') || (dominantSign < 0 && m.mode === 'split-right');
      }
      if (dominantAxis === 'y' && (m.mode === 'split-top' || m.mode === 'split-bottom')) {
        return (dominantSign > 0 && m.mode === 'split-top') || (dominantSign < 0 && m.mode === 'split-bottom');
      }
      return false;
    });
    if (directionFiltered.length >= 1) return directionFiltered[0];
  }

  // Step 3: cursor velocity ≈ 0 (≤ 0.5px/frame 抖动抑制) → 空间优先 (左上 wins) + blockId 字典序 final stable fallback
  // - x-axis modes (split-left/right): 比 block.left, 较小 wins (左侧 host 优先)
  // - y-axis modes (split-top/bottom): 比 block.top, 较小 wins (上方 host 优先)
  // - 同 spatial 时 blockId 字典序 stable
  return closest.slice().sort((a, b) => {
    const aIsX = a.mode === 'split-left' || a.mode === 'split-right';
    const bIsX = b.mode === 'split-left' || b.mode === 'split-right';
    if (aIsX && bIsX) {
      const dx = a.blockBounds.left - b.blockBounds.left;
      if (dx !== 0) return dx;
    }
    if (!aIsX && !bIsX) {
      const dy = a.blockBounds.top - b.blockBounds.top;
      if (dy !== 0) return dy;
    }
    return a.blockId.localeCompare(b.blockId);
  })[0];
}
```

抖动抑制 ε = 0.5px/frame (per Q3 absorbtion): velocity 模长 ≤ 0.5 时认为 cursor "几乎静止", 跳过 velocity-based tiebreak 直接走 spatial fallback (空间优先 — x-axis 模式比 block.left, y-axis 模式比 block.top, 较小 wins; 同 spatial 时 blockId 字典序 stable 终止). 避免 cursor 微抖动引发 mode 抖动切换 + spatial fallback 保证 "左上优先" 用户直觉一致.

**重叠 cursor 命中行为示例** (block A 在左; block B 在右; gap = 14):
- cursor 在 gap 中心 (距 A.right = 7, 距 B.left = 7; 距离同): tiebreak 退化, 默认选 split-right on A (左侧 host 优先, 实施约定; 实际 cursor 在 0-velocity 时几乎不可能精确命中正中)
- cursor 偏左 (距 A.right = 4, 距 B.left = 10): split-right on A wins (distance 4 < 10)
- cursor 偏右 (距 A.right = 10, 距 B.left = 4): split-left on B wins
- cursor 在 A 内 8px (距 A.right = 8 → 在 EDGE_W half-in 14 内 hit; 距 B.left = 6+gap=20 → 不命中): split-right on A wins (only match)

**0-velocity 中心命中**: 实际 user 拖动 cursor 必有 velocity vector. 同 distance 时优先 cursor 移动方向上的 edge (e.g., 向右拖时 split-left on B; 向左拖时 split-right on A). 若 velocity ≈ 0 (frozen cursor) → spatial fallback (per `tiebreak()` Step 3): x-axis 模式 (split-left/right) 比 block.left 较小 wins; y-axis 模式 (split-top/bottom) 比 block.top 较小 wins; 同 spatial 时 blockId 字典序 final stable. 即 "左上 host 优先" 在 spatial 上确定, 不依赖 blockId 字典序与位置的关系.

split-top / split-bottom 同理 (vertical 方向).

### D4 — 静态底层 + per-affected-block outline overlay (方案 A)

drag 期间 **底层 grid 在 完全不动**. 在底层之上画一组 dashed accent outline 矩形:

| outline 类型 | 视觉 | 触发 | source position |
|---|---|---|---|
| **new block outline** | dashed accent border, accent-soft bg @ 0.55 opacity, 显示 fraction 文本 (e.g., "1/2", "1/3") | 任意 mode (split-left/right/top/bottom/empty) | 新块将占据的 col×row 区域 |
| **host outline** | dashed accent border, accent-soft bg @ 0.3 opacity | 仅 split-left / split-right | host 被压缩后的尺寸位置 (`colSpan / 2`) |
| **shifted-block outline** | dashed `oklch(88% 0.05 215 / 0.5)` border (per ADR-0018 token 蓝 215°) | 仅 split-top / split-bottom | 每个被推位的 block 各画一个; 在被推下到的新位置 |

**drop 时**: outlines 200ms fade-out; 实际 blocks CSS `transition: grid-column 180ms cubic-bezier(.2,.7,.2,1), grid-row 180ms` 滑到 outline 位置 → **没有跳跃** (预告已经发生).

drag-cancel 时 (Esc per D8 OR 拖出网格区域释放): outlines 立即清除 (无 transition); 源块 unlift (per D6); grid 状态完全恢复.

**Outline 图层优先级 (per Q4 absorbtion)** — z-index 顺序 + 叠加策略:

```css
.skb-outline-shifted-block { z-index: 10; pointer-events: none; opacity: 0.5; }
.skb-outline-host           { z-index: 20; pointer-events: none; opacity: 0.55; }
.skb-outline-new            { z-index: 30; pointer-events: none; opacity: 0.7; }
```

新块 outline > host outline > shifted-block outline (下层); 同层 (e.g., 多 shifted-block) 按 row/col 序稳定排布. 重叠时上层 dashed border 叠加保证最终 (`new`) outline 始终可读. `pointer-events: none` 确保 outline 不阻挡 cursor → edge rect hit-test.

**Reflow / resize invalidation (per Q5 absorbtion — drag 中 grid 尺寸变化)**:

drag 期间监听:
- `ResizeObserver` 注册到 grid container; 尺寸变化 (e.g., user 拖 viewport / window resize) 触发 `dirty=true` 标记
- `effectiveCols` 改变 (per ADR-0016 D5 转场态 FSM 触 12↔6↔1 切换) 立即重算
- 下一 `requestAnimationFrame` 时若 `dirty=true` → recompute edge rects (per D5 选项 1 公式; O(n) cost paid only on 尺寸变化, NOT every frame)
- drag 不中断 (continue with new edge rects); ghost cursor 跟随保持
- 若 cursor 在重算后仍命中 same mode/blockId → 视觉无感知; 若变 mode → outline overlay 切到新 mode

**视觉反射统一约束层 (per Q1 absorbtion partial — D4/D9/D10/D11 间统一约束)**:

drag/drop UX 视觉元素 (outline overlay D4 + col-ruler D9 + drag-ghost D10 + drop-pulse D11) 共享:

- token 来源: design-tokens (ADR-0018) 的 `--accent` (橙红 35°) / `--accent-soft` / `--canvas-soft` / `--accent-success` (per Q11 absorbtion drop-pulse token化) / `--text-3` (col-ruler stop label)
- 展示状态机: `drag-active` (D6 drag-start 起) / `resize-active` (D9 resize 起) / `drop-pulse-active` (D11 720ms) — 同 stage 仅 1 active state
- 禁用条件: `effectiveCols === 1` mobile 路径 → resize handles + col-ruler + size-tooltip + drag-ghost + outline overlay + drop-pulse + drag-handle 全 disabled (per Q9 absorbtion + R3 fix consistency with D9 + Consequences mobile view-only); 仅 Tiptap content-edit 保留 (markdown 内 inline 编辑 OK)

实施约束: 所有 visual 元素的 token + 状态切换 同步 by ADR-0018 design-tokens 包.

### D5 — 命中检测算法 (推荐选项 1; 选项 2/3 留 Phase 2+)

**选项 1: 预计算 edge rects** (MVP 实施)

drag-start 时给每个 snapshot block (per D6 lift 后的快照, 不含源块) 算 4 个 edge rects:

```typescript
function computeEdgeRects(block: BlockBoundingBox, EDGE_W = 28): EdgeRects {
  return {
    left:   { x: block.left - EDGE_W / 2,  y: block.top, width: EDGE_W, height: block.height },
    right:  { x: block.right - EDGE_W / 2, y: block.top, width: EDGE_W, height: block.height },
    top:    { x: block.left, y: block.top - EDGE_W / 2,  width: block.width, height: EDGE_W },
    bottom: { x: block.left, y: block.bottom - EDGE_W / 2, width: block.width, height: EDGE_W },
  };
}
```

drag-over 时遍历所有 edge rects 做"点-在-矩形"测试; 多个命中按 D3 tiebreak. per-event O(n) where n = block 数; n=30 时 < 0.05ms/frame (60fps preserved).

**选项 2: grid 单元索引** (性能优化备案; Phase 2+ 切)

drag-start 建 `cell(col, row) → block[]` 映射 (最多 12 cols × 30 rows = 360 cells); drag-over 用 cursor → cell 纯算术 O(1), 只查该 cell + 周围 8 cells. 适合 500+ blocks 的超大 doc.

**选项 3: DOM 原生事件分发** (性能极致备案; Phase 2+ 切)

每块内嵌 4 个 `<div class="edge-zone-{top|right|bottom|left}">` 作 drop 区; 浏览器 dispatch `dragenter` / `dragover` 给具体 zone; 0 ops/frame; DOM 节点 ×5 增长 + CSS 复杂 + 调试困难.

**MVP 用选项 1**. 性能问题在 Phase 2+ (n ≥ 500) 真出现时再切 2 / 3. 选项 2 / 3 接口形式与选项 1 共享 (mode + blockId + distance), 切换 cost 仅 implementation pure swap.

### D6 — 源块 lift 模式 (drag-start 时源块从 grid lift; 视觉消失)

drag-start 时源块从 grid 中 lift:
- DOM: `display: none` (or `visibility: hidden` + `pointer-events: none`)
- snapshot: drag-start frame 拍一张 grid 快照 (源块 lift 后); 后续 drag-over edge rect 计算基于这个 snapshot, **不含源块** (避免源块 edge rect 自命中)
- ghost: 一个 `.drag-ghost` fixed 浮跟随 cursor (per D10)

drag-cancel: 源块 unlift; 恢复 `display` (or `visibility`); 源块 grid 位置不变.

drag-end (drop): 源块从 lift 状态进入 mutation pipeline; layoutReducer (per ADR-0016 D12) 计算新 BlockGridPosition; CSS transition 自动滑到新位置.

**与 v2 demo "变灰半透明留位" 的差异**: v2 demo 实现是源块在原位变灰半透明 (`opacity: 0.5`) 留住占位. v0.3 user 共识 改为 lift 模式: 源块完全消失, 落点计算基于无源块 snapshot. 理由:
- 占位灰块视觉混乱 (用户分不清 "原位" vs "新位")
- 落点 distance 计算需 ignore 源块 edge rect 否则源块自命中
- lift 模式语义更清晰: drag = 拿走 + 放; 不是 拿+占位+放

**网格外松手 = no-op cancel (per Q6 absorbtion)**: drag-end 落在网格 container 外 (cursor leaves `<div class="skb-grid">` viewport box) 时:
- 不执行任何 layoutMutation (NO `'drag'` source, NO `'drag-cancel'` source)
- layoutEpoch unchanged (不递增)
- ghost 立即清理
- 源块 lift 撤销 (per D6); 源块恢复原 grid position
- 所有 outline overlay 立即清除 (无 transition)
- drop-pulse NOT 触发 (no drop event)
- 视觉与 drag-cancel 完全等价 (per D8 Esc 取消 + Q12 epoch 策略)

外部 drop event semantics: `mouseup` outside grid OR window blur OR tab switch 都属此类; ghost / 源块 / outline 完全恢复 drag-start 前 snapshot.

**Markdown 预览几何契约 (per Q7 absorbtion — drag 中 outline rowSpan 与 drop 后 rowSpan 不一致风险)**:

markdown 块 (rowSpan='auto') drag 中 outline overlay 显示几何:
- drag-start 时 freeze `useAutoRowSpan` 当前测量值 = `frozenRowSpan`; outline overlay 用 `frozenRowSpan` 计算 height
- drag-over 期间 outline overlay 始终用 `frozenRowSpan` (即使 markdown 内容此时被 ResizeObserver 测变化也忽略, 避免 outline 高度抖动)
- drag-end 落定: layoutMutation `source = 'drag'` 仅 mutate col/colSpan/row; rowSpan='auto' 由 ResizeObserver 在 落定 后 (per ADR-0016 D3 两阶段稳态) 重新测量
- drop-pulse 期间 (720ms) outline 已 fade-out; 实际 markdown rowSpan 可能在 ResizeObserver 测后微调 (Δ rowSpan ≥ 1 阈值后 update); CSS `transition: grid-row 180ms` 缓冲视觉跳跃
- drag-cancel: `frozenRowSpan` 解 freeze; useAutoRowSpan 恢复 ResizeObserver-driven

视觉跳变 mitigation: outline 显示的是 "drag-start 瞬间高度" (frozen); drop 后实际高度可能 Δ ≤ 几行 (用户编辑期间内容长度变化通常很小). 为零跳变需要 (a) drag 中持续 ResizeObserver-track + outline 跟随 — 抖动风险高; (b) drag-end 后强制 ResizeObserver 立即重测 (per D3 两阶段稳态 first RO 触发) + 180ms transition. 选 (b) 路径; 抖动 mitigated by 两阶段稳态规则.

### D7 — `useAutoRowSpan` hook (consume ADR-0016 D3)

drag/drop UX 操作 markdown 块 (kind='prose' OR rowSpanSemantic='auto') 时 rowSpan 由 `useAutoRowSpan` hook (per ADR-0016 D3 + 两阶段稳态) 反算. drag/drop 仅 mutate `col / colSpan / row` (持久化字段); rowSpan='auto' 不入持久化, 由 ResizeObserver 在 drop 后重新测量 rendering-derived.

**冲突仲裁** (per ADR-0016 D12 layoutEpoch reducer): drag-end 时 layoutMutation `source = 'drag'` 优先于 `source = 'auto-measure'` (per ADR-0016 D12 表格); 即 drag 落定瞬间 rowSpan 由 D5 transition 状态机决定 (T2 freeze + T4 重新测量).

### D8 — 全局 Esc 取消语义

drag 期间任何时刻 user 按 Esc → `dragMutation.source = 'drag-cancel'`:
- 源块 unlift (per D6)
- outline overlays 立即清除 (no transition)
- ghost 立即消失
- grid 状态完全恢复 (drag-start 前 snapshot)

实施: editor-shell 全局 keydown listener with `key === 'Escape'`; layoutReducer 接收 `'drag-cancel'` source 触发 rollback. layoutEpoch 不递增 (cancel 不算 mutation).

**Esc focus textarea 冲突优先级 (per Q8 absorbtion)**:

drag 活动状态 (`drag-active`) 期间 Esc 优先级:

1. **drag-active === true**: keydown listener 在 drag-cancel 路径 `preventDefault()` + `stopPropagation()`; **NOT** 触发 textarea blur / Tiptap selection-clear / native browser ESC behavior; 不主动 focus 失效
2. drag-end 后 (drop OR cancel 都 fire): `drag-active === false`; restore 最近 focus 状态 (drag-start 时 active element 若是 textarea/Tiptap 则 re-focus); textarea 内容 NOT 改变 (drag 期间无 native ESC 透传)
3. **drag-active === false**: Esc 走 native behavior (textarea blur / Tiptap deselect / etc.) + Tiptap 自身 keymap

实施约束: editor-shell `useDragActive()` hook 维护 global `drag-active` state; 所有依赖 ESC 的 consumer (Tiptap keymap / textarea / global handlers) 必须 check `drag-active` flag.

### D9 — col-ruler + size-tooltip (resize feedback; consume ADR-0016 D6 COL_SNAPS)

resize 时 (拖 block 右/下/角 handle):
- **col-ruler**: 浮在 grid 容器顶部, 显示 12 columns (or effective viewport cols) 的 6 个 stop (= effectiveColSnaps); cursor 命中 stop 时 stop highlight `oklch(58% 0.16 35 / 0.4)` (accent-soft per ADR-0018)
- **size-tooltip**: fixed 浮在 cursor 右上角 (cursor + offset); 显示当前 fraction (`'1/2'`, `'2/3'`, `'full'`); y 轴拖时加 `'· N rows'`

resize 落定 (release):
- snap to 最近 effective COL_SNAPS (per ADR-0016 D6 Q4 absorbtion `effectiveColSnaps`)
- 非 snap 值拒绝 (per ADR-0016 D6 non-snap 拒绝); UI 显示 snap 反馈 + 方向记录
- layoutMutation `source = 'resize'`

**Resize handle 显示规则**:
- `.gblock-handle.right` (cursor `ew-resize`) — **所有 block** 都有 (effectiveCols ≥ 6 时)
- `.gblock-handle.bottom` (cursor `ns-resize`) — **仅** kind='render' / 'viz' / kind='component' (canvas / image / runnable / heavy plugin placeholder); markdown (kind='prose') NO bottom handle (rowSpan='auto' 内容驱动 per ADR-0016 D3)
- `.gblock-handle.corner` (cursor `nwse-resize`) — 同 bottom 规则

**Mobile 1-col 路径全 view-only (per Q9 absorbtion + R-fix consistency with Consequences)**: `effectiveCols === 1` 时 (per ADR-0016 D5 1-col mobile 强制路径):

- **resize disabled**: `.gblock-handle.right` / `.bottom` / `.corner` 全部 hide (`display: none` via `.skb-grid--mobile` className 控制); col-ruler hide; size-tooltip 不渲染; cursor 默认 (NOT resize cursor)
- **drag/drop disabled**: drag-handle (`.gblock-gutter` 内的 `⋮⋮` button) hide; ghost / outline overlay / drop-pulse / Esc cancel 全 inactive; pointer-events 在 `.gblock` 上 read-only (除 markdown block 内 Tiptap 编辑保留)
- mobile path 块仅纵向自适应 (rowSpan='auto' 强制 per ADR-0016 D5); 用户可滚动浏览 + Tiptap 内编辑 markdown 内容; **不能** 拖动块 / resize / split host
- 心智: mobile = preview-mode + content-edit (touch keyboard 编辑 markdown OK); desktop = author-mode (drag/drop/resize 全功能)

**Touch / mobile drag explicit out-of-scope** (consistent with Consequences + Wave 5 plan v0.2 + PR.md): Wave 5 仅 desktop 鼠标 drag (mousedown/mousemove/mouseup); touchstart/touchmove/touchend listener NOT 实现; mobile 1-col 完全 view-only + Tiptap content-edit.

### D10 — drag-ghost (cursor 跟随 + per-kind 着色)

`.drag-ghost`:
- `position: fixed`; `transform: translate(cursor.x, cursor.y) rotate(-1.5deg)` (微旋反馈)
- 按 kind 着色: `.ghost-canvas` (蓝 215°) / `.ghost-runnable` (绿 145°) / `.ghost-image` (橙黄 60°) / `.ghost-markdown` (中性灰); per ADR-0018 token
- 显示 glyph + label: `+ ◇ Canvas` (palette 拖出 = 创建) OR `⤴ ◇ Canvas` (现有块拖 = 移动); glyph per kind

drag-start 时创建 ghost; drag-end 销毁. cursor velocity ≥ 5px/frame 时 ghost 微旋角度 ±5° 反馈 cursor 速度方向; velocity = 0 时 ghost 角度 = -1.5deg (静态 baseline).

### D11 — drop-pulse 720ms 落定动画 (token-driven `--accent-success`; per Q11 absorbtion 取消 hardcode 145°)

drop 落定瞬间 (源块进入新 grid 位置 + outline fade-out 完成):
- 720ms halo 动画: `box-shadow: 0 0 0 4px var(--accent-success, oklch(70% 0.12 145 / 0.5))` → fade-out
- token 来源: ADR-0018 design-tokens 包 `--accent-success` (Stage C.3 实施 PR 锁); fallback `oklch(70% 0.12 145 / 0.5)` (与 runnable 顶条 hue 145° 同色) 仅 token 未加时兼容
- 提示用户 "drop succeeded"; 区分 drop 与 hover

**Token 化 vs hardcode 决策 (per Q11 absorbtion)**: 早期 v2 demo hardcode hue 145° 与 runnable kind 顶条同色, 状态色 vs 组件色冲突 (e.g., user 看 drop-pulse 可能误以为 runnable kind transition). ADR-0018 (Pre-A4) 锁 v2 视觉 migration 时引入 `--accent-success` 独立 token (语义: drop succeeded / save succeeded / commit-pulse general); fallback hex 仅作 backward-compat (Stage C.3 实施 OKLCH 切完全 token化后 fallback 可移除).

**drop-pulse 不在 drag-cancel 时触发** (cancel 没 drop event); 网格外松手 (per D6 Q6 absorbtion no-op cancel) 也不触发.

### D12 — layoutEpoch single-source mutation (consume ADR-0016 D12)

drag/drop 所有 mutations 都经过 `@skb/editor-shell` `layoutReducer` with `layoutEpoch` version stamp (per ADR-0016 D12).

**Epoch 唯一策略 (per Q12 absorbtion — drag-start NOT change epoch; drag-end-success +1; cancel/外部释放 NOT change)**:

| Phase | layoutEpoch action | snapshot 保存 | rollback target |
|---|---|---|---|
| **drag-start** (lift; per D6) | `epoch unchanged` (e.g., still N) | save snapshot S0 = grid state with 源块 lifted | (rollback target for cancel) |
| **drag-over** (cursor 移动 + edge rect hit-test + outline preview) | `epoch unchanged` (NO mutation) | (use S0 as base; preview not committed) | (still S0) |
| **drag-end-success** (drop 在 grid 内有效 mode 落定) | `epoch += 1` (one-shot N → N+1) | new state S1 committed to history | (S1 is new baseline) |
| **drag-end-cancel** (Esc per D8 OR 网格外松手 per D6 Q6) | `epoch unchanged` (no mutation) | (S0 still baseline) | rollback to S0 (revert lift) |
| **drag-end-mode-none** (cursor 在 block 内非边缘 release) | `epoch unchanged` (no mutation; degenerate cancel) | (S0 still baseline) | rollback to S0 |

历史链 (undo/redo) 仅记录 epoch 增加的 commit (drag-end-success); cancel / no-op 不污染历史. user undo (Ctrl+Z) 触发 `epoch -= 1` rollback to history[epoch - 1].

**冲突仲裁** (per ADR-0016 D12): drag (user-initiated) 优先于 auto-measure (markdown rowSpan='auto'); responsive transition (per ADR-0016 D5 转场态 FSM) 期间 drag 拒绝 (UI grayed cursor). 单用户单 session 假设 explicit (CRDT/OT Phase 2+).

### D13 — Keyboard a11y parity (Wave 6 cf-22 amendment 2026-05-09)

cf-22 adds keyboard-mode parity for all 3 cf-20 per-block affordances (drag / resize / kebab) per WCAG 2.1.1 (Keyboard, Level A) + 2.4.3 (Focus Order, Level A) + 2.4.7 (Focus Visible, Level AA) + 4.1.3 (Status Messages, Level AA). Keyboard mode is documented EXPLICITLY as **parity** (NOT a degraded subset) — orchestrator decision Q2 from cf-20c-1 scoping.

**v2-design-granularity intent vs cf-22 amendment**: v2 §"心智模型" describes pointer-only interactions ("拖拽抽屉 + 边框拖拽吸附宽度"). cf-22 D13 EXTENDS this without contradicting — keyboard mode produces the same final mutations (setNodeMarkup with the same attrs) as pointer mode; the user-visible v2 state machine is unchanged.

**Keyboard contract per affordance** (post-cf-22 R1 amendment 2026-05-10):

| Affordance | Tab (active) | Enter/Space | Arrow keys | Enter (active) | Esc |
|---|---|---|---|---|---|
| **Drag handle** | commit + focus advances (Shift+Tab = cancel) | start keyboard-drag | ±1 grid cell via `keyboardGridStep`/`keyboardGridRowStep` mutating tracked `{col, row}` (NO synthesized pixel cursor) | commit `setNodeMarkup({col, row})` directly (NOT via `applyDropMode`/`commitDropAtMatch`) | cancel + restore focus |
| **Resize right** | commit + focus advances (Shift+Tab = cancel) | start keyboard-resize | ←/→: snap-step colSpan via `keyboardSnapStep` (D2) | `tr.setNodeMarkup` (same path as pointerup) | cancel + restore focus |
| **Resize bottom** | commit + focus advances (Shift+Tab = cancel) | start keyboard-resize | ↑/↓: ±1 rowSpan via `keyboardRowStep` | commit | cancel |
| **Resize corner** | commit + focus advances (Shift+Tab = cancel) | start keyboard-resize | ←/→ colSpan; ↑/↓ rowSpan | commit | cancel |
| **Kebab button** | focus | open menu | (default activation) | (toggle) | (no-op when closed) |
| **Kebab menu (open)** | (focus auto-trapped) | activate item | ↓/↑ cycle; → expand sub-menu; ← collapse | activate | close + restore focus to button |

**R1 amendments (2026-05-10 codex-pr-reviewer-55 round 1)**: F2 (HIGH) drag keyboard mode now tracks `{col, row}` grid-coords directly via `keyboardGridStep`/NEW `keyboardGridRowStep` (NO synthesized pixel cursor; commit writes `setNodeMarkup({col, row?})` directly without `applyDropMode`/`commitDropAtMatch`); F1 (HIGH) `<LiveAnnouncer>` actually consumed via outer-provider + inner-consumer split (`EditorShellMountInner.tsx`) wiring 6 `useCallback` announce callbacks; F3 (MEDIUM) Tab/Shift+Tab in active keyboard-mode = sync commit/cancel without `preventDefault` so browser advances focus naturally per WCAG 2.4.3.

**cf-22 D-decisions** (full rationale in PR.md `wave-6-cf-22-keyboard-a11y.md`): D1 amendment-not-separate-ADR; D2 snap-step semantics (resize ±snap, drag ±cell, rowSpan ±1); D3 mouse+keyboard SEPARATE pipeline-state flags; D4 `<button>` elements (NOT `role="application"`); D5 `useFocusReturn` hook; D6 single `<LiveAnnouncer/>` 100ms throttle; D7 dropEpoch infrastructure reuse; D8 kebab auto-focus first item.

**Implementation surface (cf-22 source files; updated post-R1)**:

- `packages/editor-shell/src/a11y/live-announcer.tsx` — `<LiveAnnouncer/>` + `useAnnounce()` (D6; 100ms latest-wins throttle).
- `packages/editor-shell/src/a11y/use-focus-return.ts` — focus snap-and-restore hook (D5).
- `packages/editor-shell/src/a11y/keyboard-step.ts` — pure step helpers; **R1**: NEW `keyboardGridRowStep` for vertical grid-coord movement.
- `packages/editor-shell/src/a11y/announce-format.ts` — pure WCAG 4.1.3 message formatters (now consumed via R1-F1).
- `packages/editor-shell/src/drag-drop/keyboard-drag-mode.ts` — **R1 rewrite**: NEW `KeyboardDragSnapshot`; arrow handlers mutate tracked `{col, row}`; Tab handler commits/cancels; commit writes `setNodeMarkup({col, row?})` directly (NOT via `commitDropAtMatch`/`applyDropMode`); fires 3 announce callbacks.
- `packages/editor-shell/src/drag-drop/commit-drop.ts` — pointer path only post-R1 (keyboard path bypasses).
- `packages/editor-shell/src/resize/keyboard-resize-mode.ts` — **R1**: Tab handler + 2 announce callbacks via `announceStep` helper.
- `packages/editor-shell/src/drag-drop/use-drag-drop-pipeline.ts` — exposes `keyboardCol`/`keyboardRow`/`keyboardSnapshot` + `totalCols` + 3 announce callbacks (R1-F1+F2).
- `packages/editor-shell/src/resize/use-resize-pipeline.ts` — exposes 2 resize announce callbacks (R1-F1).
- `apps/site/src/components/EditorShellMount.tsx` — **R1 split**: 39-LOC outer wrapper mounting `<LiveAnnouncer>` ONCE.
- `apps/site/src/components/EditorShellMountInner.tsx` — **NEW** (R1-F1; 445 LOC). Holds `useAnnounce()` consumer + 6 `useCallback` factories + mount lifecycle (registry / ApiAdapter / save chain / GridContainer / pipelines / overlays).
- `apps/site/src/components/EditorShellKebabActions.ts` — **R1**: 3 factories accept optional `KebabAnnounceFn`; capture `node.type.name` BEFORE mutation.

**Mobile path inheritance**: cf-22 keyboard handles share DOM with pointer handles; mobile `@media (max-width: 768px) { display: none }` rules from cf-20c-2/cf-20d/cf-20e apply equally. No new mobile-specific rules.

## Acceptance criteria (AC list)

`@skb/editor-shell` 包 + `apps/site` Astro renderer (drag-handle source) + visual smoke playwright 必满足:

1. **AC#1 (4 mode 视觉验证)**: 4 mode (split-left/right/top/bottom) + empty + none 各 1 vitest unit (mock cursor at edge position) + 1 playwright scenario per mode (drag-and-drop 完整流程; 验证 outline overlay correct + drop 落定结果)
2. **AC#2 (EDGE_W = 28px 边缘命中)**: cursor 距 block edge 距离 |x| ≤ 14 时触 split-* mode; |x| > 14 时 'none' (in block) OR 'empty' (out of block); vitest fixture 覆盖 boundary cases (|x| = 14 边界精确判定)
3. **AC#3 (tiebreak 距离公式)**: 2 紧贴 blocks (gap=14) cursor 在 gap 区不同位置: 距 left.right = 4 → split-right on left; 距 right.left = 4 → split-left on right; 距相等 (gap 中心 7+7) 且 |velocity| > 0.5 → velocity-direction-aware (cursor 移动方向上 next-edge wins); 距相等 且 |velocity| ≤ 0.5 → spatial fallback (x-axis: 较小 block.left wins; y-axis: 较小 block.top wins); 同 spatial 时 blockId 字典序 final stable. vitest 6 fixture (左偏 / 右偏 / 中心 + |velocity|>0.5 / 中心 + cursor 静止 spatial wins / 同 spatial 时 blockId 字典序 stable / cursor 移动方向)
4. **AC#4 (静态底层不动 during drag)**: drag-over 期间 grid container CSS computed style + block.gridColumn / block.gridRow 持续不变; 仅 `.drag-overlay-*` element 显示; vitest + playwright DOM mutation observer
5. **AC#5 (outline overlay 3 类同步显示)**: split-left 显示 new outline + host outline (NOT shifted-block outline); split-bottom 显示 new outline + shifted-block outline (NOT host outline); empty 仅 new outline; none 不显示 outline; vitest + playwright snapshot screenshots per mode
6. **AC#6 (hit-test 性能 budget)**: n=30 blocks drag-over 60fps (per-event ≤ 16ms / frame); per-event O(n) ≤ 0.05ms; playwright `performance.now()` budget assertion (Stage C.2 实施 PR 加 fixture; AC#6 要求形式 fixture 模板)
7. **AC#7 (源块 lift 模式)**: drag-start 时源块 `display: none` (or `visibility: hidden`); snapshot edge rects 不含源块 (avoid self-match); drag-cancel 时源块恢复; vitest unit + playwright assertion `getComputedStyle(srcBlock).display === 'none'` during drag
8. **AC#8 (useAutoRowSpan integration with ADR-0016 D3)**: drop 落定 markdown block 时 rowSpan='auto' 从 useAutoRowSpan hook 重新测量; mutation 仅 mutate col / colSpan / row (NOT rowSpan); vitest fixture: drag markdown block to new position → drop → ResizeObserver 触发 → rowSpan 再次正确反算 (per ADR-0016 D3 两阶段稳态)
9. **AC#9 (全局 Esc 取消)**: drag 中按 Esc → 源块 unlift + outline 清除 + ghost 消失 + grid 状态完全恢复 (drag-start 前 snapshot); layoutEpoch unchanged; vitest unit + playwright mid-drag escape
10. **AC#10 (col-ruler 命中 stop highlight)**: resize 拖 right handle 时 col-ruler 显示 effective COL_SNAPS (12-col → 6 stops [2,3,4,6,8,12]; 6-col → 3 stops [2,3,6]); cursor 命中 stop 时 stop highlight; size-tooltip 显示 fraction; vitest + playwright snapshot
11. **AC#11 (drag-ghost 视觉跟随)**: drag-start ghost element exists with `position: fixed`; drag-over ghost.x/y matches cursor; per-kind 着色 (vitest snapshot per kind className); drag-end ghost destroyed
12. **AC#12 (drop-pulse 720ms 动画落定后)**: drop event triggers 720ms green halo `box-shadow` animation; cancel event NOT trigger; vitest setTimeout assertion + playwright animation duration verify

Stage C.2 实施 PR 必逐条 cross-reference AC#1-#12 验证 (per ADR-0011 D2 SOTed-PR.md `## acceptance` 字段).

## Consequences

### Positive

- 4 边缘对称 + outline overlay 方案 A 兑现 granularity v0.3.4 设计意图 (drift #1, #2, #5 修复); v2 demo 半成品 B 实施被替换为完整方案 A
- 命中算法选项 1 + 2/3 备案 = MVP 简单 + Phase 2+ 性能优化路径明确; 切换 cost 仅 implementation pure swap (接口共享)
- 源块 lift 模式 (vs v2 demo 占位灰块) = drop 落点计算 + 视觉 + 语义全部清晰
- EDGE_W = 28 (= 2 * GAP) 数学对应锁 = block 紧贴时 gap 区无 'none' 死角; cursor 必命中 split-* 之一
- D-list D1-D12 与 ADR-0016 D-list (W5-1 / D12 layoutEpoch / COL_SNAPS / D6 effectiveColSnaps / D3 useAutoRowSpan 两阶段稳态) 全 cross-reference; 数据模型 + UX 一致

### Negative

- D5 选项 1 性能 O(n) per-event = n ≥ 500 blocks 时退化; mitigation 切 选项 2 / 3 时 cost = 接口形式相同, pure implementation swap (Phase 2+)
- D2 EDGE_W = 28 + GAP = 14 数学耦合: GAP 改 design-tokens 时 EDGE_W 必同步改 (单一源 derive: `EDGE_W = 2 * GAP` helper); 漂移风险 mitigated via `effectiveEdgeWidth(gap)` helper in `@skb/editor-shell`
- D6 源块 lift 改变 v2 demo 行为 = user 视觉感知与 demo 不一致; mitigation 是 v0.3 user 共识 + 文档化 + drop-pulse 落定反馈给 user 明确 "drag = 拿走 + 放" 心智
- D9 resize handle 显示规则按 kind 二分 = block kind 添加时 resize handle 行为决策必跟; mitigation 通过 BlockUIDefinition.gridKind (per ADR-0016 D10) 显式 declarative

### Neutral / explicit acknowledgements

- Modal canvas (granularity 旧 ADR-0014; Wave 5+ ADR-0019+) drag/drop 内部行为 OUT OF SCOPE; modal 内 canvas node/edge editing 留 Phase 2+ ADR
- 协同/多人编辑 OUT OF SCOPE (per ADR-0016 D12 single-user 单 session 假设)
- Touch / mobile drag (touchstart/touchmove/touchend) OUT OF SCOPE; Wave 5 仅 desktop 鼠标拖; mobile 路径 (per ADR-0016 D5 1-col) view-only 无 drag
- AC#6 性能 budget assertion = playwright `performance.now()` 测试; Stage C.2 实施 PR 加 fixture (ADR-0017 D-list 锁要求形式; fixture 实质留 Stage C.2)

## Plan-challenger codex absorbtion (locked at lock-time)

per [ADR-0007 D5](ADR-0007-job-function-codex-heavy-execution.md) + [ADR-0011 D2](ADR-0011-linear-pipeline-execution-model.md) v0.1.1 SOTed-PR.md amendment + memory `feedback_soted_pr_md_discipline.md` + ADR-0013 D4 R13 + Wave 4 Pre-A2 ADR-0014 12/12 + Wave 5 Pre-A2 ADR-0016 12/12 absorbed precedent.

dispatch: `codex exec --yolo --profile plan-challenger ...` (Pre-A3 ADR-0017 design-lock 4-round style); audit log path: `/tmp/codex-runs/2026-05-04-Pre-A3-plan-challenge.txt` raw + `docs/audits/codex-runs/2026-05-04-Pre-A3-plan-challenge.txt` curated archive (head -50 + R21 grep verdicts if log > 500 KB).

| # | Challenge | Severity | Verdict | Reason / Locked at |
|---|---|---|---|---|
| Q1 | D-list D1-D12 拆分 D9/D10/D11 是否应合并为统一"视觉反射层"小节 | low | **PARTIALLY ABSORBED** | D-list 保持 D1-D12 拆分 (各自独立可测可 ratify); 但 D4 末尾加 "视觉反射统一约束层" note (token 来源 + 展示状态机 + 禁用条件) 让后续实现者统一理解口径. Locked at D4 trailing prose. |
| Q2 | EDGE_W=28=2*GAP 边界 cursor 在 block 内 \|x\|=14 / gap x=14+14 / 无 host 命中 = empty vs none 是否完整定义 | medium | **ABSORBED** | D3 距离公式 hit 条件 column 明示 `abs(signedDistance) ≤ 14` (closed `≤` 区间触发); >14 退化 'empty' (块外) OR 'none' (块内非边缘); D1 mode 表格 trigger column 已分离 'none' (block 内) vs 'empty' (block 外). Locked at D3 距离公式表 + D1 mode 表. |
| Q3 | tiebreak 公式未形式化 velocity; signed distance vs abs comparison 实现歧义 | high | **ABSORBED** | D3 距离公式表加 hit 条件 / tiebreak key 列 (use abs); 加完整 `tiebreak()` TypeScript 实施 (EdgeMatch.distance signed scalar + Math.abs sort + velocity-direction-priority + ε=0.5px/frame 抖动抑制 + spatial fallback by block.left/top + blockId 字典序 final stable). Locked at D3 tiebreak() block. |
| Q4 | D4 outline 3 类 z-index / 叠加策略 / pointer-events / opacity 重叠保底可读性未定义 | medium | **ABSORBED** | D4 末尾加 "Outline 图层优先级" CSS block (z-index: shifted 10 / host 20 / new 30; pointer-events: none; opacity 0.5/0.55/0.7); 同层按 row/col 序稳定排布. Locked at D4 trailing CSS block. |
| Q5 | drag-start 预计算 edge rects; drag 中 grid container 尺寸变化未重算导致命中偏差 | high | **ABSORBED** | D4 末尾加 "Reflow / resize invalidation" — `ResizeObserver` 标记 dirty; effectiveCols 改 立即重算; 下一 rAF 重建 edge rects; drag 不中断. Locked at D4 trailing prose. |
| Q6 | drag-end 落网格外释放语义未定义 (cancel vs no-op) | medium | **ABSORBED** | D6 末尾加 "网格外松手 = no-op cancel" — 不执行 layoutMutation; epoch unchanged; ghost / 源块 lift / outline 全清; drop-pulse 不触发. mouseup outside / window blur / tab switch 都属此类. Locked at D6 trailing prose. |
| Q7 | markdown rowSpan='auto' 落位前后 outline preview 高度与实际可能不一致瞬时跳跃 | medium | **ABSORBED** | D6 末尾加 "Markdown 预览几何契约" — drag-start 时 freeze useAutoRowSpan 当前值; outline overlay drag-over 期间用 frozen 值; drag-end 后 ResizeObserver 重测 (per ADR-0016 D3 两阶段稳态) + CSS transition 缓冲. Locked at D6 trailing prose. |
| Q8 | 全局 Esc 在 textarea/Tiptap focus 时与 native ESC 冲突 | medium | **ABSORBED** | D8 末尾加 "Esc focus textarea 冲突优先级" — drag-active 时 keydown listener preventDefault + stopPropagation; NOT blur textarea; drag-end 后 restore focus. Tiptap keymap consume drag-active flag. Locked at D8 trailing prose. |
| Q9 | mobile 1-col 路径 resize 交互未定义; col-ruler 退化误导 | medium | **ABSORBED** | D9 末尾加 "Mobile 1-col 路径全 view-only" — resize handles + col-ruler + size-tooltip 全 hide via `.skb-grid--mobile` className; **drag/drop UX 全 disabled** (drag-handle hide + ghost/outline/drop-pulse/Esc 全 inactive); Tiptap content-edit 保留 (markdown 内容编辑 OK). Touch / mobile drag 显式 OUT OF SCOPE consistent with Consequences + PR.md. Locked at D9 trailing prose. |
| Q10 | markdown ghost 中性灰 vs prose 非 BlockUIDefinition 路径来源冲突 | low | **PARTIALLY ABSORBED** | D10 不改 (consistent with ADR-0016 D10 proseGridDefaults + gridKind='prose' label); 但 Compliance section 加 note: 颜色映射由 gridKind/prose 标签决定 (consume ADR-0016 D10 proseGridDefaults), NOT 依赖 BlockUIDefinition 全写路径. Locked at Compliance trailing note. |
| Q11 | drop-pulse hardcode hue 145° 与 ADR-0018 token 漂移 + runnable 顶条同色冲突 | medium | **ABSORBED** | D11 改 `box-shadow: var(--accent-success, oklch(70% 0.12 145 / 0.5))`; ADR-0018 (Pre-A4) 锁 `--accent-success` token (drop / save / commit-pulse general); fallback hex 仅 backward-compat. Locked at D11 token block. |
| Q12 | drag-start epoch handling "implementation choice" 与 rollback/undo 语义不闭环 | high | **ABSORBED** | D12 加 "Epoch 唯一策略" 表 — drag-start: epoch unchanged (snapshot S0); drag-over: unchanged; drag-end-success: epoch+1; drag-end-cancel/外部释放: unchanged + rollback to S0; drag-end-mode-none: 同 cancel. 历史链仅记 epoch+1 commits. Locked at D12 Epoch 表. |
| Q13 | Stage C.2 实施 PR 时 editor-shell single-source CONTRACT 未固化致 D2 row 1 漏判 | medium | **ABSORBED** | Compliance section 末尾加 "Stage C.2 D2 row 1 escalation note" — Stage C.2 实施 PR 创建 `packages/editor-shell/CONTRACT.md` (NEW; W5-2 invariant 加; layoutReducer + EDGE_W + tiebreak + 命中算法 single-source export) **必 D2 row 1 + row 5 (cross ≥3 packages) HIT** (与 Pre-A2 ADR-0016 Q12 + D13 同质 escalation). orchestrator 在 Stage C.2 plan-challenger (Pre-A5 v1.0 lock 时) 必逐 PR 重判 D2 trigger. Locked at Compliance trailing note. |

**Result**: 13/13 challenges absorbed (3 high + 8 medium + 2 low; codex verdict 3 high + 8 medium + 2 low advisory). 11 ABSORBED + 2 PARTIALLY ABSORBED (Q1 + Q10 low-severity; D-list 不重组但加 note; markdown ghost 着色策略 一致 不改 但加 note). Plan v0.1 (initial draft) → **v0.1.1 (post-absorbtion lock; status proposed)**. No challenge rejected.

**Lock evidence**: this absorbtion table + each verdict cross-references the D-section / AC# / 算法/数学公式 prose / NEW token / Compliance trailing note that codifies the change.

## Compliance

- This ADR satisfies [Wave 5 plan v0.2 Pre-A3 acceptance](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) (ADR-0017 design lock + plan-challenger 4-round)
- This ADR fulfills [ADR-0011 D1 stage 4 PRE-COMMIT CLAUDE REVIEW](ADR-0011-linear-pipeline-execution-model.md) trigger criteria (Row 4 NEW ADR HIT; Row 1 NO — ADR-0017 不动 CONTRACT; editor-shell drag/drop UX 是 internal implementation, sister-doc-sync 留 Stage C.2 实施 PR)
- This ADR ratifies granularity doc v0.3.4 § "4 种 Drop 语义" + § "Drop 视觉" + § "命中检测算法" + § "源块 drag 时 lift" body content (gatekeeper-side scratch at `/mnt/d/download/web/v2-design-granularity.md`, NOT in git per gatekeeper-side discipline; prose form per memory `feedback_lychee_user_local_paths`) 旧编号 0013 → Wave 5 ADR-0017 新编号 (per Wave 5 plan v0.2 D5 ADR 编号映射表)
- This ADR consumes [ADR-0016 W5-1](ADR-0016-grid-data-model.md) invariant (grid context dimensions ↔ colSpan/rowSpan 联动); D12 layoutEpoch reducer; COL_SNAPS + effectiveColSnaps; D3 useAutoRowSpan
- This ADR does NOT amend [ADR-0014](ADR-0014-heavy-block-boundary.md); HeavyBlockBoundary skeleton during drag transit 留 Stage C.2 实施 PR (consume W5-1 dims + drag/drop 状态)
- This ADR does NOT amend [ADR-0009](ADR-0009-block-kind-union-expansion.md); BlockKind 4-way union 不动
- **Pre-A3 D2 trigger 触发面分离 (per Wave 5 plan v0.2 D13 + Pre-A2 ADR-0016 Q12 absorbtion 同质 escalation)**: 此 Pre-A3 ADR design-lock = D2 row 4 (NEW ADR) HIT → stage 4 PRE-COMMIT CLAUDE REVIEW fires. **Stage C.2 drag/drop 实施 PR** 触发面更广: 任 PR touching ≥3 packages (典型: editor-shell + apps/site + block-foundation + design-tokens 跨包) **必 D2 row 5 (cross ≥3 packages) + row 1 (sister CONTRACT sync; editor-shell CONTRACT.md 创建 OR W5-2 invariant) HIT → stage 4 强制**. orchestrator 在 Stage C.2 plan-challenger (Pre-A5 v1.0 lock 时) 必逐 PR 重判 D2 trigger; Pre-A3 lock 不预设 Stage C.2 D2 行为
- **Per Q10 absorbtion clarification**: drag-ghost per-kind 着色 (D10) `.ghost-markdown` 中性灰 决策来源 = ADR-0016 D10 `proseGridDefaults.gridKind === 'prose'` (proseExtensions path) OR `BlockUIDefinition.gridKind === 'prose'` (component path); 颜色映射由 `gridKind` 标签决定, NOT 依赖 `BlockUIDefinition` 全写路径. markdown 通过 proseExtensions 暴露 + `proseGridDefaults` 提供 gridKind label = ghost 着色 query 一致 不依赖 BlockUIDefinition 重复写
- **Per Q13 absorbtion Stage C.2 D2 row 1 escalation explicit**: Stage C.2 drag/drop 实施 PR 创建 `packages/editor-shell/CONTRACT.md` (NEW; if 不存在; ADR-0017 此 Pre-A3 留 forward-pointer 不实际 create) + W5-2 invariant 加 (editor-shell layoutReducer + EDGE_W + tiebreak + 命中算法 single-source export) → 必 D2 row 1 (NEW CONTRACT) + row 5 (cross ≥3 packages: editor-shell + block-foundation 消费者 + apps/site + design-tokens) HIT → stage 4 PRE-COMMIT CLAUDE REVIEW + ADR-0006 8-point #6 sister-doc-sync 必查; orchestrator Pre-A5 v1.0 lock 时 plan-challenger 验证 Stage C.2 PR 拆分粒度 + D2 trigger 准确性 (per Wave 5 plan v0.2 D13 late-surface escalation)

## Related

- [Wave 5 plan v0.2](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — Pre-A3 scope source + ADR 编号映射表 D5
- [ADR-0016 grid 数据模型](ADR-0016-grid-data-model.md) — Pre-A2 design-lock; W5-1 + D12 layoutEpoch + COL_SNAPS + effectiveColSnaps + useAutoRowSpan 都被 ADR-0017 消费
- [ADR-0015 D6 Wave 5 plan-draft handoff](ADR-0015-wave-4-close.md) — Wave 5 deferred items binding (drag/drop forward to Wave 5 Stage C.2)
- [ADR-0014 HeavyBlockBoundary](ADR-0014-heavy-block-boundary.md) — drag transit during heavy block + skeleton 留 Stage C.2 实施
- [ADR-0011 D1 linear pipeline](ADR-0011-linear-pipeline-execution-model.md) — KEPT for Wave 5; D2 row 4 fires stage 4 here
- [ADR-0006 8-point asymmetry audit](ADR-0006-asymmetry-audit-checklist.md) — items #5 (algorithm 复刻; EDGE_W + tiebreak + edge rects 公式 single-source) + #8 (authority sync; ADR roster) 必查
- [ADR-0003 Headless / Presentational](ADR-0003-headless-presentational-split.md) — drag-handle is UI 层, layoutReducer is core 层 (per editor-shell internal)
- [Wave 5 Pre-A2 PR.md](../plans/wave-5-main/Pre-A2-adr-0016-grid-data-model.md) — most recent ADR design-lock precedent (12/12 plan-challenger absorbed)
- [Wave 5 Pre-A1 PR.md](../plans/wave-5-main/Pre-A1-plan-lock.md) — Wave 5 plan v0.2 lock
- granularity doc v0.3.4 (`/mnt/d/download/web/v2-design-granularity.md`) — gatekeeper-side scratch; § "4 种 Drop 语义" + § "Drop 视觉" + § "命中检测算法" + § "源块 drag 时 lift" body 是此 ADR 设计意图 source (per Wave 5 plan v0.2 D5 ADR 编号映射表 0013 → 0017)
- drag-storyboard.css (`/mnt/d/download/web/drag-storyboard.css`) — 16 KB v2 demo drag UX storyboard CSS implementation reference
