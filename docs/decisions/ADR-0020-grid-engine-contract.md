# ADR-0020: `@skb/grid-engine` 契约 + Theme 规范

| 字段 | 值 |
| ---- | --- |
| 状态 | proposed (Wave 7 prep; lock 契约 for upcoming Phase 1-3 production migration) |
| 日期 | 2026-05-11 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | [Wave 7 design doc](../design/grid-redesign-2026-05-11.md) + user critique of cf-22/23/24/25 ("grid 没做好"); validated via two throwaway prototypes (algorithm + UI), shipped PR #120 + #121; locks the engine + theme contract before Phase 1 (`@skb/grid-themes` package) implementation begins |
| 关系 | **扩展** [ADR-0016](ADR-0016-grid-data-model.md) (grid 数据模型 → 此 ADR 锁定执行算法 + 状态突变契约). **替代** [ADR-0017](ADR-0017-drag-drop-ux.md) D1-D4 的 `applyDropMode` 4-mode split-with-shrink 算法 (将在 Phase 2B 删除; 此 ADR 锁定的 grid-engine ops 取代). **促升** [grid-redesign design doc](../design/grid-redesign-2026-05-11.md) §2-9 至 ADR 状态. **不替代** ADR-0018 (v2 visual) — 那个 ADR 仍持有 token / 视觉 contract; 此 ADR 仅引入 Theme interface 作为渲染层 hook |

## Context

cf-22/23/24/25 用户审查暴露 grid 实现 3 个根本问题：
- 数据 SoT 是隐式 (cf-25 D5 `rowSpan='auto'`) + 渲染过分依赖 CSS Grid → invariant 不可机械验证
- `applyDropMode` 4-mode split-target-shrink-host 算法是错的抽象 (用户拖到 X 边缘 ≠ "X 自己缩一半")
- 视觉风格硬编码在 cf-19 chrome + cf-20a paired selector → 不可主题化

经过两个 throwaway prototype 验证 (algorithm prototype 在 `scripts/grid-engine-prototype/` 当时 — 已在 PR #120 absorption 后删除, 历史可见于 PR #120 history; UI prototype 仍在 `apps/site/src/components/_grid-prototype/` 至 Phase 3 cleanup):

1. **算法 prototype** (PR #120 前): 43+ vitest 单元 + property-based + 50k 随机 ops invariant 保持 → 算法 sound
2. **UI prototype** (PR #120 → #121): 3 个视觉 theme 在同一 engine ops 下手感都被 user 验收 ("整体逻辑上没有问题了")

User decisions locked in design doc:
- 12 列 × N 行均匀方形 slot (`--skb-slot-size` 一个变量控制 row height = col width)
- 每个 block 是 AABB 矩形, 离散整数 colSpan × rowSpan, 永不 overlap
- Per-block AABB upward gravity (**Option A 锁定**: 所有 ops 默认运行 gravity → 状态永远 gravity-stable; 无 floating block leap-on-delete surprise)
- 1 个**可选** `OpOptions.gravity = false` 退出 invariant (Powerpoint-style 自由放置, prototype 已验证)
- Hole-fill smart placement: 新 block 填**包含 cursor 的最大空矩形** (clamped by `DEFAULT_SIZES[kind]`)
- 数据 = SoT, 渲染 = 下游消费; CSS Grid 仅作渲染实现细节
- 3 个 built-in themes (graph-paper / lego-studs / bento-canvas) 永久共存 (用户都 sign off 后改为 themes 而非选 1)
- Theme registry **closed for now**, 但 `Theme` interface 设计为可扩展 (未来开放 `registerTheme(theme)` 加第 4 个 theme 不需 core 改动)
- Default theme = `lego-studs`; storage = hybrid (per-user localStorage + per-doc MDX frontmatter override)

此 ADR 锁定 grid-engine 公共契约 + Theme interface, 作为 Phase 1-3 production migration 的前置依赖.

## Decision

### D1 — Grid 数据模型 (扩展 ADR-0016)

```ts
type Block = {
  id: string;       // unique within GridState
  col: number;      // 0-indexed top-left col, 0 ≤ col < totalCols
  row: number;      // 0-indexed top-left row, row ≥ 0 (unbounded)
  colSpan: number;  // ≥ 1, col + colSpan ≤ totalCols
  rowSpan: number;  // ≥ 1 (DISCRETE integer — NOT 'auto'; cf-25 D5 will migrate)
  kind: BlockKind;
};
type GridState = { blocks: Block[]; totalCols: number /* 12 */ };
```

**Invariants** (enforced by every `ops.ts` mutation):
- 任意两个 block 不 overlap (AABB)
- 所有 block 在 bounds 内 (col + colSpan ≤ totalCols)
- block.id 唯一
- 默认: state 是 gravity-stable (无 floating block); 可通过 `OpOptions.gravity = false` 退出

**SoT**: `GridState.blocks` 是单一真相. Occupancy matrix (`Occupancy = (id|null)[col][row]`) 是 derived view, **每次 mutation 后重算**, 不可 in-place mutate.

### D2 — Op 契约 (替代 ADR-0017 D1-D4 applyDropMode)

```ts
type OpOptions = { gravity?: boolean };  // default { gravity: true }
type OpResult = { ok: true; state: GridState } | { ok: false; error: string };

insertBlock(state, block, options?): OpResult
moveBlock(state, id, newCol, newRow, options?): OpResult
resizeBlock(state, id, newColSpan, newRowSpan, options?): OpResult
transformBlock(state, id, partial, options?): OpResult  // atomic move+resize
deleteBlock(state, id, options?): GridState  // silent no-op if id missing
```

**Failure modes** (`{ ok: false }`):
- `out of bounds: <describe>`
- `overlap with <id list>`
- `duplicate id: <id>` (insert only)
- `no such block: <id>` (move/resize/transform only)

**Gravity** (D3 详): default 运行; `{ gravity: false }` 跳过.

**`transformBlock`** 必要性: 左 / 上边 resize 需要 atomic 改 col + colSpan (或 row + rowSpan). 序贯 moveBlock + resizeBlock 不 atomic (第二步失败时 block 留半 mutated 态).

### D3 — Per-block AABB upward gravity (**Option A locked**)

```
function applyGravity(state):
  loop:
    moved = false
    for block in state.blocks sorted by row ascending:
      if canRise(block):  // 整个 footprint 上一行全空
        block.row -= 1
        moved = true
    if !moved: break
```

- **Per-block AABB upward**: block 整体上升, 大小不变, col 不变, 仅 row 减
- 收敛: ≤ block-count × max-row, 安全 cap 1000 passes
- 性能: 100 blocks ~10ms (benchmark via prototype)

**Option A** (locked 2026-05-11 prototype validation):
- 默认所有 ops 后运行 gravity → state 永远 gravity-stable
- 拒绝 floating block (insert at row=10 in empty col → auto-snap row=0)
- 消除 "无关 delete 触发远处 block leap" 副作用

**Opt-out**: `{ gravity: false }` 跳过 gravity, 允许 floating block (Powerpoint canvas mode).

### D4 — Drop intent + hole-fill smart placement

```ts
inferDropIntent(state, cursorCol, cursorRow, blockKind): DropIntent
maxEmptyRectContaining(state, cursorCol, cursorRow, capW, capH):
  { col, row, colSpan, rowSpan } | null
```

**hole-fill 语义** (2026-05-11 fix):
- 提议的 block 填满**包含 cursor 的最大空矩形** (NOT cursor-anchored 向右下生长)
- Clamped by `DEFAULT_SIZES[kind]` (per `defaults.ts`)
- 返回 anchor = 该 rect 的 top-left (不是 cursor 位置)

**拒绝条件**:
- cursor 越界 → `{ intent: 'reject', reason: 'cursor out of bounds' }`
- cursor 在已有 block 上 → `{ intent: 'reject', reason: 'cell occupied by <id>' }`
- 无空 rect → `{ intent: 'reject', reason: 'no empty rect at cursor' }`

**v1 scope**: 仅 "cursor in empty space" 意图. **未覆盖** "cursor on edge of existing block" 意图 (旧 `applyDropMode` 的 split-* 模式). 后者标记为 v2 work, 推迟到证实需求时再实现.

### D5 — Default kind sizes (kind-keyed insertion defaults)

```ts
DEFAULT_SIZES: Record<BlockKind, { w: number; h: number }> = {
  markdown:     { w: 12, h: 1 },
  image:        { w: 6,  h: 4 },
  code:         { w: 12, h: 4 },
  callout:      { w: 12, h: 1 },
  math:         { w: 12, h: 2 },
  pdf:          { w: 12, h: 8 },
  jupyter:      { w: 12, h: 6 },
  'nn-viz':     { w: 12, h: 6 },
  'agent-flow': { w: 12, h: 6 },
};
```

Hole-fill 用这些作为 cap; 实际 colSpan × rowSpan = `min(default, holeMax)`.

### D6 — Headless 隔离

`@skb/grid-engine` 100% headless:
- **NO** React / DOM / CSS / Tiptap / ProseMirror import
- Pure 函数 (state in → state out; 无内部 state, 无 side effects)
- 可独立 unit test, property-based test
- 可 future-import 到非 React 环境 (apps/api preview, agent tools, canvas-based editor)

Consumer 责任:
- 持有 `GridState` (in React `useState`, in PM doc attrs, in custom state)
- 同步 GridState → 渲染层
- Wire user input → ops
- 处理 OpResult ({ok: false} 的 UI feedback)

### D7 — Theme interface (规范但 v1 closed registry)

```ts
// 暂在 editor-shell 或 future @skb/grid-themes
export type ThemeKey = 'graph-paper' | 'lego-studs' | 'bento-canvas';

export interface GridTheme {
  key: ThemeKey;
  displayName: string;
  description?: string;
  slotSize: number;  // pixel size of uniform square slot
  cssVars: Record<string, string>;  // injected at root via :root selector
  renderBaseplate: (props: BaseplateProps) => React.ReactNode;
  renderBlock: (props: BlockRenderProps) => React.ReactNode;
  renderDropPreview: (props: DropPreviewProps) => React.ReactNode;
  renderResizeHandle?: (props: ResizeHandleProps) => React.ReactNode;
}

export interface BaseplateProps {
  totalCols: number;
  totalRows: number;
  dragInProgress: boolean;
}

export interface BlockRenderProps {
  block: Block;
  isDragging: boolean;
  isResizing: boolean;
  isFocused: boolean;
  children: React.ReactNode;  // actual content (markdown / image / ...)
}

export interface DropPreviewProps {
  col: number; row: number; colSpan: number; rowSpan: number;
  isValid: boolean;
}

export interface ResizeHandleProps {
  edge: 'right' | 'left' | 'top' | 'bottom' | 'corner' | 'top-left';
  active: boolean;
}

// Registry — v1 closed, API 形态预留
const themes = new Map<ThemeKey, GridTheme>();
export function registerTheme(theme: GridTheme): void { themes.set(theme.key, theme); }
export function getTheme(key: ThemeKey): GridTheme { /* ... */ }
export function listThemes(): GridTheme[] { /* ... */ }
```

**v1 行为**:
- 3 个 built-in (`graph-paper` / `lego-studs` / `bento-canvas`) 在 module load 时调用 `registerTheme()` 自己注册
- User code 不需要 register
- ThemeKey union 在 type 层 closed (3 个 literal) — 添加第 4 个 theme 必须改 union 类型

**未来扩展路径** (v2+ 如开放):
- ThemeKey 改为 `string` (open)
- 加 `unregisterTheme()` API
- 加 `default theme key` configurable

### D8 — Theme 存储

```
存储顺序 (优先级 高 → 低):
1. MDX frontmatter `theme:` (per-document override)
2. localStorage['skb.grid.theme'] (per-user pref)
3. Default = 'lego-studs'
```

- 切换 theme: 写 localStorage; 不影响 doc frontmatter (除非用户主动 `theme:` 写入)
- Doc frontmatter override 让团队 share doc 时 theme 一致 (作者意图保留)
- 切换 doc 时, frontmatter 不在 → fallback to localStorage

### D9 — Theme switcher UI (production)

**Floating chip** (与 prototype switcher 不同):
- 屏幕**右下角**默认 (避免 cf-22 LiveAnnouncer top-right 区, 避免 cf-24 PaletteSidebar 左侧区域)
- 可拖动位置 (用户可挪开)
- 可隐藏 (右键菜单 → "Hide chip")
- Production fold 隐藏: `process.env.NODE_ENV === 'production' && !user-pref-show` → 不显示 (避免新用户被多余 UI 干扰)
- Initial show only if `localStorage['skb.grid.theme'] !== 'lego-studs'` → 让换过 theme 的 user 看到 chip; 默认用户看不到

## Implementation phases (orchestrator + user agreed 2026-05-11)

| PR | Scope | Status |
|---|---|---|
| #120 | wave-7-grid-redesign: engine package + static prototype + design doc | ✅ merged |
| #121 | wave-7-prototype-interaction: drag/resize/delete + gravity toggle + 3 engine extensions | ✅ merged |
| #122 | wave-7-adr-0020: THIS ADR | ⏳ in progress |
| #123 | Phase 1: `@skb/grid-themes` package + 3 production themes + storage + switcher (NOT yet wired to editor) | 📋 planned |
| #124 | Phase 2A: `rowSpan='auto'` → 离散 migration (mdx-bridge byte-equivalent round-trip preserved) | 📋 planned |
| #125 | Phase 2B: replace `applyDropMode` with grid-engine ops in editor-shell + gravity wire | 📋 planned |
| #126 | Phase 2C: replace `useProjectGridStyleToOuter` with theme-driven grid placement; wire toolbar theme switcher | 📋 planned |
| #127 | Phase 3: delete prototype + add Playwright coverage for editor themes + ADR-0017 amendment (deprecate applyDropMode 4-mode split) | 📋 planned |

## Consequences

### Positive

- **Single source of truth**: GridState.blocks. Render layer (CSS Grid or alternatives) 是 derived view, 不影响 invariant
- **Pure functional API**: 100% predictable, easy to test (property-based + unit), easy to debug
- **Theme extensibility**: `Theme` interface 设计为 forward-compat; v1 closed registry 不阻塞 v2 opening
- **Gravity opt-out**: 用户可以选 "free placement" 模式不损失功能
- **Hole-fill UX**: 拖块到任意空白区域都得到合理大小 + 位置, 不再需要 cursor 精确放置
- **6-axis resize**: 4 边 + 2 角 (含 top-left), 通过 `transformBlock` atomic mutate
- **替代 cf-20c-1 split-with-shrink algebra**: 不再 "目标块自己缩一半给我让位"; AABB validation 拒绝/接受清晰

### Negative

- **Phase 2B 风险高**: editor-shell DnD pipeline 整体替换. cf-22/23/24/25 regression suite 必须保 green
- **Performance unknown 在大 grid**: 100 blocks gravity 10ms 已验证, 但 1000 blocks 未测. 若 future user 创建巨型 doc (~500+ blocks), 可能需要 perf 优化
- **Closed Theme registry 锁了 v1 集合**: 3 theme 之外加 theme 需要 type union 改 + new release. 接受为 v1 简化.
- **CSS Grid 仍是 v1 渲染选择**: 虽然 SoT 是 data, 但渲染层我们仍走 explicit `grid-template-columns` + explicit `grid-area` per block. 如果发现 CSS Grid 限制 (e.g. content-driven row heights 与 LEGO 方形 slot 冲突), 可能需切到 absolute positioning. v1 接受 CSS Grid 假设, 由 v2 prototype 验证.

### Neutral

- ADR-0017 D1-D4 (drag/drop UX) 的 `applyDropMode` 4-mode split-with-shrink 会被 Phase 2B 删除. ADR-0017 v0.6 amendment (Phase 3) 标记为 deprecated, 描述 grid-engine ops 替代.
- ADR-0018 (v2 visual) 不变. Theme interface 引用 v2 design tokens (per ADR-0018 v0.5 D3 token palette) 作为 cssVars 来源.
- cf-25 D5 `rowSpan='auto'` migration 在 Phase 2A 处理: parse 时 'auto' → 1; serialize 时 `rowSpan === 1 && row defaults match` → unwrap 回 bare prose (byte-equivalent round-trip preserved).

## Sister-doc updates

- `docs/design/grid-redesign-2026-05-11.md` — design doc 升级状态: 从 "draft pre-ADR" → "ADR-0020 locked" (本 ADR 引用 design doc 作为 rationale; design doc 不删除, 留作长形 narrative)
- `packages/grid-engine/CONTRACT.md` — 添加 ADR-0020 反向引用 + Phase plan footer
- `agent-contract.md` — 不变 (engine + themes 都是 package, 通过 standard executor 流程)
- `ADR-0011` D2 row 2 (NEW package add) 触发: Phase 1 PR #123 创建 `@skb/grid-themes` 时 PRE-COMMIT CLAUDE REVIEW 应 fire (除非 bootstrap-scope exception)

## Acceptance criteria

ADR is considered locked when:
- [x] All D1-D9 decisions written
- [x] Implementation phases mapped to specific PR numbers
- [x] Sister-doc updates listed
- [x] Cross-references to ADR-0016 / ADR-0017 / ADR-0018 stated
- [x] Consequences (positive / negative / neutral) honest
- [ ] Merged to main (Phase 1 implementation blocks on this)

Phase 1 (PR #123) blocks on this ADR being merged. Phase 2-3 reference back to this ADR for the contract.

## See also

- [`docs/design/grid-redesign-2026-05-11.md`](../design/grid-redesign-2026-05-11.md) — long-form design doc + 6 lessons from cf-22/23/24/25
- [`packages/grid-engine/CONTRACT.md`](../../packages/grid-engine/CONTRACT.md) — engine public surface + algorithm spec
- [ADR-0016](ADR-0016-grid-data-model.md) — grid data model (12-col + row flow) — this ADR is the execution contract
- [ADR-0017](ADR-0017-drag-drop-ux.md) — drag/drop UX (D1-D4 applyDropMode to be deprecated)
- [ADR-0018](ADR-0018-v2-visual-migration.md) — v2 visual migration (token palette consumed by theme cssVars)
