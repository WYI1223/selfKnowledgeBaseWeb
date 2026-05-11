# ADR-0018: v2 视觉 migration — design-tokens OKLCH + Inter/JetBrains Mono + 顶 2px 横条 + prose customization + save-path 接口冻结

| 字段 | 值                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 状态 | accepted (v0.8 Wave 6 cf-24 amendment 2026-05-10; v0.7 cf-23 read-route page-shell unification → v0.8 cf-24 edit-route palette-rail visual contract per D10) |
| 日期 | 2026-05-04                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx)                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 触发 | [Wave 5 plan v0.2 D1+D5+D10](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) (Pre-A4 ADR-0018 v2 视觉 migration design lock + save-path 接口冻结 per Q4+Q8 absorbtion) + reframe v2 memory `project_wave4_reframe_v2.md` + granularity doc v0.3.4 § "v2 视觉契约要素 (认证源 = v2-styles.css, 所有 token 不变)" + § "v2 编辑器 UX 要素 (视觉细节)" body (NEW reframe v2 forward; granularity 原 Phase 2+ L1 visual scope)                    |
| 关系 | 不替代任何 ADR; 扩展 [ADR-0003](ADR-0003-headless-presentational-split.md) D6 (design-tokens authority + OKLCH switchover) + 扩展 [ADR-0017 D11](ADR-0017-drag-drop-ux.md) (drop-pulse 消费 `--accent-success` token); 扩展 [ADR-0014](ADR-0014-heavy-block-boundary.md) (heavy block plugin placeholder 消费 design-tokens 视觉 + 顶 2px 横条 from D3); save-path 接口冻结 = NEW Phase 1 持久化决策 (Stage C.4 实施 + Phase 2+ apps/api endpoint 升级路径) |

## Context

Wave 5 reframe v2 (2026-05-04 gatekeeper directive; absorbed via Wave 5 plan v0.2 Pre-A4 scope) 把 **v2 视觉 identity** + **save-path 接口冻结** 同时锁在此 ADR. 两个相关 domain:

1. **v2 视觉 identity (Stage C.3 实施)**: design-tokens 包 OKLCH 切 + Inter/JetBrains Mono + block kind 顶 2px 彩色横条 + prose customization + typography 升级 + shadow 暖色调 + 8 light block CSS calibration
2. **Save-path 接口冻结 (Stage C.4 实施)**: 提前 (per Q8 absorbtion) 在此 ADR 锁定 NoteSaveAdapter interface + 3 候选实施路径 + Wave 5 MVP 选 localStorage prototype + Phase 2+ apps/api endpoint upgrade path; Pre-A5 仅做确认与验收 不动接口

设计源:

- **视觉**: granularity v0.3.4 § "v2 视觉契约要素 (认证源 = v2-styles.css)" + v2-styles.css 全文 (25 KB; 完整 token set + prose customization + block-kind 顶 横条 + typography + shadow)
- **Save-path**: Wave 5 plan v0.2 D10 (修订 per Q8 absorbtion); Phase 1 MVP 持久化决策 (granularity v0.3.4 NOT 直接讨论 save-path; this ADR 是 NEW)

### 设计共识 (gatekeeper-locked)

- v2 视觉 = cream `oklch(99% 0.005 80)` + 橙红 `oklch(58% 0.16 35)` accent + 蓝 `oklch(60% 0.13 215)` canvas + Inter/JetBrains Mono 字体. v2-styles.css 是 token 认证源.
- 每种 component block 顶部 2px 彩色横条作视觉识别 (canvas 215° / runnable 145° / image 60°; markdown 默认无横条; math/pdf/jupyter/nn-viz/agent-flow 5 missing kind 在此 ADR Pre-A4 plan-challenger 时锁 hue).
- prose customization (b-quote / b-callout / b-code / aref inline anchor + inline mark + inline code) per granularity v0.3.4 prose customization 章节.
- typography: 15px/1.55 body, H1 28px/700/-0.018em, H2 20px/650/-0.01em, H3 16px/600, b-p 14.5px/1.62.
- shadow `rgba(20,15,10, alpha)` 暖色调 (与 cream/Inter 调和; vs 中性 `rgba(0,0,0)`).
- Save-path: Wave 5 MVP = **localStorage prototype** (单设备; 简单; MVP-friendly); Phase 2+ apps/api endpoint upgrade (跨设备同步 + collaborative).

### Wave 5 stage 关系

- **Pre-A2 ADR-0016** ✅ accepted: grid 数据模型 + W5-1 invariant + D12 layoutEpoch
- **Pre-A3 ADR-0017** ✅ accepted: drag/drop UX (drop-pulse D11 消费 `--accent-success` 此 ADR D1 定义)
- **Pre-A4 (this ADR)**: v2 视觉 migration + save-path 接口冻结
- **Pre-A5**: Wave 5 plan v1.0 final lock (Stage C.1-C.4 per-PR breakdown + 接口冻结 cross-reference)
- **Stage C.3 实施**: design-tokens OKLCH 切 + Inter/JetBrains Mono + 顶 2px 横条 + prose customization + 8 light block CSS calibration (per ADR-0018 D1-D7) — ux-ui-lead subagent dispatch
- **Stage C.4 实施**: NoteSaveAdapter interface + LocalStorageAdapter MVP impl + apps/site `/notes/[slug]/edit` route 消费 (per ADR-0018 D8 接口冻结) — orchestrator + codex-generic-executor

ADR-0011 D1 KEPT 不变. Pre-A4 plan-challenger codex 4-round per ADR-0007 D5 + R13 + Wave 4+5 Pre-A2 12/12 / Pre-A3 13/13 absorbed precedent.

## Decision

### D1 — design-tokens OKLCH color tokens (authoritative table)

`@skb/design-tokens/src/tokens.css` `:root` 加 (or 替换 既有 token):

| token                | OKLCH                                                        | 用途                                                                                                     |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `--bg`               | `oklch(99% 0.005 80)`                                        | 页面底色 (暖白 cream)                                                                                    |
| `--panel`            | `oklch(98% 0.004 80)`                                        | 侧 rail / topbar / panel 底                                                                              |
| `--surface`          | `#ffffff` (唯一非 OKLCH; 块内容白底; 高对比保留)             | block 内容白底                                                                                           |
| `--border`           | `oklch(92% 0.005 80)`                                        | 默认边                                                                                                   |
| `--border-strong`    | `oklch(86% 0.006 80)`                                        | hover / 强调边                                                                                           |
| `--text`             | `oklch(22% 0.01 80)`                                         | 主文本 (近黑暖调)                                                                                        |
| `--text-2`           | `oklch(45% 0.01 80)`                                         | 次要文本                                                                                                 |
| `--text-3`           | `oklch(62% 0.01 80)`                                         | 辅助文本 / metadata                                                                                      |
| `--accent`           | `oklch(58% 0.16 35)`                                         | 选中 / drag / focus / 警示 (橙红 hue 35°)                                                                |
| `--accent-soft`      | `oklch(96% 0.04 35)`                                         | accent 浅底 (drop preview / hover)                                                                       |
| `--accent-success`   | `oklch(70% 0.12 145)`                                        | **NEW per ADR-0017 D11 forward-pointer**: drop-pulse / save-success / commit-pulse general (绿 hue 145°) |
| `--canvas`           | `oklch(60% 0.13 215)`                                        | canvas block 类色 (蓝 hue 215°)                                                                          |
| `--canvas-soft`      | `oklch(97% 0.025 215)`                                       | canvas 浅底                                                                                              |
| `--grid-line`        | `oklch(90% 0.005 80)`                                        | drag overlay 网格线                                                                                      |
| `--grid-line-strong` | `oklch(82% 0.005 80)`                                        | snap 高亮线                                                                                              |
| `--row-h`            | `48px` (per ADR-0016 D4 height 公式 base)                    | grid base row                                                                                            |
| `--gap`              | `14px` (per ADR-0016 W5-1 + ADR-0017 EDGE_W=2\*GAP 数学对应) | grid gap                                                                                                 |
| `--radius`           | `6px`                                                        | block / button radius                                                                                    |

**OKLCH browser fallback (per Q2 absorbtion — 锁 hex 转换公式 + 生成规则, Stage C.3 仅实现不再解释)**:

Chrome 111+ / Safari 15.4+ / Firefox 113+ 原生支持 OKLCH. 老 Safari < 15.4 (~5% market share 2026) 走 hex fallback. **此 ADR 锁定转换公式 + 生成规则**:

1. **转换公式**: 使用 [Culori](https://github.com/Evercoder/culori) library `oklchToHex(L, C, H)` 函数 (or equivalent CIE OKLCH → sRGB 转换 algorithm). 每 token 在 design-tokens 包源码中并存 OKLCH (主) + hex (fallback) value, hex 由 `tokens.css` build script `pnpm generate:tokens-fallback` 自动 derive (NOT 手写; Stage C.3 实施 PR 加 build script).
2. **生成规则** (Stage C.3 实施约束): 每 OKLCH token 必有对应 hex; build script 输出 `tokens-fallback.css` 包含 `@supports not (color: oklch(0 0 0)) { :root { --bg: #fefdfa; ... } }` block; tokens.css 主文件 + tokens-fallback.css 同 commit ship.
3. **可执行快照** (AC#12 验证): `pnpm test --filter=@skb/design-tokens` snapshot 包含 14 OKLCH color token 的 OKLCH→hex mapping (`--surface` 仅 hex 不需要 fallback); design-tokens build 任何变化 → snapshot 必同步更新.

实施细节 Stage C.3 PR (但 转换公式 + 生成规则 + snapshot 形式 锁在此 ADR; Stage C.3 实施仅按规则 derive 不再解释).

`@skb/design-tokens/src/tokens-dark.css` (per existing CONTRACT.md `## Public surface`): **dark mode 留 Phase 2+** (per Q3 plan-challenger candidate + granularity Open Q2). Wave 5 lite-only; 不实施 dark theme.

### D2 — Inter (sans) + JetBrains Mono (mono) Google Fonts 预连接

`apps/site/src/layouts/BaseLayout.astro` (or design-tokens-side CSS @import):

```html
<!-- Preconnect (perf-critical) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<!-- Font CSS -->
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

`@skb/design-tokens/src/tokens.css`:

```css
:root {
  --sans: 'Inter', -apple-system, system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

字体加载策略: `display=swap` (FOIT 避免; 文字立即可读; 字体加载后 swap). 配合 ADR-0016 D3 useAutoRowSpan `document.fonts.ready` await pattern (字体加载后强制 ResizeObserver 重测一次).

**Privacy / self-host fallback (per Q4 absorbtion — Google Fonts CDN 隐私/CSP 风险 + 字体加载失败兜底)**:

- **Google Fonts CDN 隐私 disclosure**: Google Fonts CDN 收集 user IP + User-Agent (per [Google Fonts privacy](https://developers.google.com/fonts/faq/privacy)); 不传 cookies / 不持久化 user identifier; GDPR 合规 (per Google 声明). 但 enterprise / EU 用户 可能要求 self-host
- **Self-host fallback path** (Stage C.3 实施 PR scope): apps/site `public/fonts/` 包含 Inter + JetBrains Mono woff2 文件; design-tokens `--sans` / `--mono` fall back to local `@font-face` declaration if `<link>` Google Fonts 加载失败; CSP `font-src 'self'` 配合
- **字体加载失败场景** (per Q4 absorbtion + AC#2 boundary): `document.fonts.ready` Promise 在 5s timeout 内 resolve OR fall back to system fonts (Inter → -apple-system / system-ui / sans-serif per `--sans` fallback chain); useAutoRowSpan ResizeObserver 在 timeout 后强制重测 (避免 forever-blocked)
- **CSP impact**: apps/site `<meta http-equiv="Content-Security-Policy" content="...">` 必允许 `font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;` (Stage C.3 实施 PR 加 CSP header)

### D3 — Block kind 顶 2px 彩色横条 (visual identification)

每种 component block (kind ∈ {component, render, viz} per ADR-0009) 顶部 `border-top: 2px solid var(--accent-${kindHue})`:

| kind                    | hue  | OKLCH (full)                        | OKLCH (soft for kind-soft bg) | v2 demo 出现   |
| ----------------------- | ---- | ----------------------------------- | ----------------------------- | -------------- |
| canvas                  | 215° | `--canvas` (full)                   | `--canvas-soft`               | ✅             |
| runnable                | 145° | `oklch(50% 0.12 145)`               | `oklch(95% 0.04 145)`         | ✅             |
| image                   | 60°  | `oklch(60% 0.10 60)`                | `oklch(95% 0.025 60)`         | ✅             |
| markdown (kind='prose') | —    | 默认无横条 (white surface 直接显示) | —                             | ✅             |
| math                    | 280° | `oklch(50% 0.16 280)`               | `oklch(95% 0.04 280)`         | ❌ Wave 5 lock |
| pdf                     | 0°   | `oklch(55% 0.16 0)`                 | `oklch(95% 0.04 0)`           | ❌ Wave 5 lock |
| jupyter                 | 90°  | `oklch(65% 0.14 90)`                | `oklch(95% 0.04 90)`          | ❌ Wave 5 lock |
| nn-viz                  | 325° | `oklch(50% 0.18 325)`               | `oklch(95% 0.05 325)`         | ❌ Wave 5 lock |
| agent-flow              | 180° | `oklch(55% 0.13 180)`               | `oklch(95% 0.04 180)`         | ❌ Wave 5 lock |

**5 missing kind hue lock (per Pre-A4 plan-challenger Q3 absorbtion)**: math / pdf / jupyter / nn-viz / agent-flow 5 个 block kind 在 Wave 4 ADR-0014 已 ratified, 但顶 2px 横条 hue 未在视觉契约定义. ADR-0018 D3 在 Pre-A4 plan-challenger round 锁定 + 修订:

**Hue 选择原则** (per Q3 absorbtion — relax 60° pairwise rule; 8 hue tokens on 360° circle 数学不可达 60° pairwise):

1. **目标**: 8 hues (3 既有 + 5 missing; markdown 默认无横条 不参与 hue 锁定) 在 360° 上分布 + a11y 对比度 OK + kind 语义关联
2. **Pairwise 角距阈值**: ≥ **30°** (relax from 60°; 360/9=40 average); 同时使用 lightness/chroma 差异 supplement (e.g., math/pdf 同 hue band 但 lightness 不同)
3. **a11y 对比度**: 顶 2px 横条对 `--bg` cream `oklch(99% 0.005 80)` 背景对比度 ≥ 3:1 (WCAG AA non-text 大字号准则). **NOT 要求** 对 `--text` 对比度 (顶 2px 横条 NOT 用于显示文字; 仅视觉 kind 识别 decoration; "text on top 横条 上写小字" 场景在 ADR-0018 视觉契约中不存在)
4. **Validation 算法** (Stage C.3 实施前必跑): pairwise hue diff ≥ 30° (relax from 60° per Q3) + WCAG contrast ratio ≥ 3:1 only against `--bg` (NOT against `--text`; 横条不承载文字); 失败则重新 pick

**5 missing kind hue 锁定值** (post Q3 validation):

| kind       | hue (°) | lightness | chroma | OKLCH                 | rationale                                                                               |
| ---------- | ------- | --------- | ------ | --------------------- | --------------------------------------------------------------------------------------- |
| math       | 280     | 50%       | 0.16   | `oklch(50% 0.16 280)` | 紫; 与 215° canvas 角距 65°; 与 35° accent 角距 105° (mod 360); 数学符号联想            |
| pdf        | 0       | 55%       | 0.16   | `oklch(55% 0.16 0)`   | 纯红; 与 35° accent 角距 35° (relax 30°+ OK); lightness 55% 与 accent 58% 差 → 视觉区分 |
| jupyter    | 90      | 65%       | 0.14   | `oklch(65% 0.14 90)`  | 黄; 与 60° image 角距 30° + chroma 0.14 (vs image 0.10) 区分; 与 145° runnable 角距 55° |
| nn-viz     | 325     | 50%       | 0.18   | `oklch(50% 0.18 325)` | 品红; 与 280° math 角距 45°; 与 35° accent 角距 70° (mod 360); 神经网络可视化联想       |
| agent-flow | 180     | 55%       | 0.13   | `oklch(55% 0.13 180)` | 青绿; 与 145° runnable 角距 35°; 与 215° canvas 角距 35°; lightness/chroma 区分         |

**Markdown kind 'no border-top' 决策对识别度影响**: markdown blocks (kind='prose') 默认无横条; 视觉识别 通过其他 cue:

- prose 内容直接显示 (不需 visual signature)
- gutter `⋮⋮ + ×` 在 hover 时显示 (block-level 控制 一致)
- 选中 ring (accent border + 2px accent-soft outer ring per granularity v0.3.4 § "Block 容器状态") = active markdown block 视觉指示
- alternate 标识方案 (per Q3 absorbtion suggestion — 细左侧条 OR 底纹) 推迟到 Phase 2+ visual refinement; Wave 5 MVP 接受 markdown 默认无横条作 simplicity 选择

实施: design-tokens 暴露 `--accent-canvas` / `--accent-runnable` / `--accent-image` / `--accent-math` / `--accent-pdf` / `--accent-jupyter` / `--accent-nn-viz` / `--accent-agent-flow` (NEW; 8 hue token + 8 kind-soft hue token = 16 NEW token from current set).

ADR-0014 v0.5 amendment (Stage C.2 实施 PR scope): HeavyBlockBoundary plugin placeholder 消费 顶 2px 横条 token (不需要 真组件 加载 也显示 kind 视觉识别).

### D4 — Prose customization (b-quote / b-callout / b-code / aref inline anchor + inline mark + inline code)

`@skb/design-tokens` (or apps/site global CSS) 加 prose 选择器:

```css
.b-quote {
  border-left: 3px solid var(--accent);
  background: oklch(98% 0.012 35 / 0.6); /* accent-soft alpha */
  font-style: italic;
  color: var(--text-2);
  padding: 8px 12px;
  margin: 4px 0;
}

.b-callout {
  background: oklch(97% 0.018 90); /* warm yellow soft */
  border: 1px solid oklch(88% 0.05 90);
  color: oklch(35% 0.06 90);
  padding: 10px 12px;
  border-radius: var(--radius);
  margin: 4px 0;
}

.b-code {
  background: oklch(97% 0.005 80);
  border: 1px solid var(--border);
  padding: 8px 12px;
  font-family: var(--mono);
  font-size: 12.5px;
  border-radius: var(--radius);
}
.b-code .kw {
  color: oklch(45% 0.18 280);
} /* keyword 紫 280° */
.b-code .fn {
  color: oklch(45% 0.13 215);
} /* function 蓝 215° */
.b-code .cm {
  color: oklch(45% 0.1 145);
  font-style: italic;
} /* comment 绿 145° */

.aref {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: var(--canvas-soft);
  border: 1px solid oklch(88% 0.04 215);
  color: var(--canvas);
  padding: 0 6px;
  border-radius: 4px;
  font-size: 0.9em;
  text-decoration: none;
  /* per ADR-0014 v0.4 amendment scope: anchor click → jumpToAnchor + flash 1700ms; impl in apps/site */
}
.aref::before {
  content: '↗';
  margin-right: 2px;
}

mark {
  background: oklch(94% 0.08 90);
  color: inherit;
} /* inline mark 黄底高亮 */
code:not(pre code) {
  /* inline code; per Tailwind preset prose */
  background: oklch(95% 0.005 80);
  font-family: var(--mono);
  font-size: 0.9em;
  padding: 1px 4px;
  border-radius: 3px;
}
```

实施: prose customization 落在 `apps/site/src/styles/prose.css` (NEW; 由 Stage C.3 实施 PR 创建); 通过 `apps/site/src/layouts/BaseLayout.astro` 全局加载.

**`.skb-prose` namespace 隔离 (per Q5 absorbtion — `b-*` selector 与 component block callout/code 命名冲突)**:

`b-*` 前缀仅用于 markdown prose 容器内 `.skb-prose` namespace; 与 component block (kind='component' callout / code / image) 的 class 互斥:

```css
/* Component block selectors (kind='component') */
.skb-block.callout { ... }   /* block-callout package; 顶 2px 横条 (D3 if hue) */
.skb-block.code { ... }       /* block-code package; 顶 2px 横条 */

/* Prose-element selectors (markdown prose 内; .skb-prose namespace) */
.skb-prose .b-quote { ... }   /* prose b-quote 仅在 markdown 内 */
.skb-prose .b-callout { ... } /* prose b-callout 仅在 markdown 内; NOT 与 .skb-block.callout 冲突 */
.skb-prose .b-code { ... }    /* prose inline code block; NOT 与 .skb-block.code 冲突 */
```

**`aref` selector specificity** (per Q5 absorbtion — 通用 `<a>` 语义不污染):

- `.skb-prose .aref` 仅适用于 markdown prose 内的 anchor reference; 不影响 editor UI links (`.skb-toolbar a`, `.skb-palette a` 等)
- `.aref` class 必显式添加 (NOT 自动加到 `<a>` element); 避免误触

实施约束: Stage C.3 实施 PR 通过 prose.css `.skb-prose` namespace 限定 + ESLint rule `no-bare-aref-class` 防止 `.aref` 在 component block packages 内复用.

### D5 — Typography 升级

| element         | size / line-height / weight / tracking |
| --------------- | -------------------------------------- |
| body            | 15px / 1.55 / 400 / 0                  |
| H1              | 28px / 1.15 / 700 / -0.018em           |
| H2              | 20px / 1.25 / 650 / -0.01em            |
| H3              | 16px / 1.3 / 600 / 0                   |
| b-p (body 段落) | 14.5px / 1.62 / 400 / 0                |
| b-quote         | 14.5px / 1.62 / 400 italic / 0         |
| b-code          | 12.5px / 1.5 / 400 / 0 (mono)          |
| inline code     | 0.9em (relative; mono)                 |

实施: design-tokens `tokens.css` `body { font-size: 15px; line-height: 1.55; font-family: var(--sans); }`; prose customization (D4) 与 typography (D5) 二者协同.

**Typography 转 CSS variables (per Q6 absorbtion — 硬编码 vs single-source design-tokens authority)**:

`@skb/design-tokens/src/tokens.css` 暴露 `--font-size-*` + `--font-weight-*` + `--line-height-*` + `--letter-spacing-*` token (NOT 硬编码 px values 在 consumer CSS):

```css
:root {
  --font-size-body: 15px;
  --font-size-h1: 28px;
  --font-size-h2: 20px;
  --font-size-h3: 16px;
  --font-size-b-p: 14.5px;
  --font-size-b-code: 12.5px;

  --font-weight-body: 400;
  --font-weight-h1: 700;
  --font-weight-h2: 650;
  --font-weight-h3: 600;

  --line-height-body: 1.55;
  --line-height-h1: 1.15;
  --line-height-h2: 1.25;
  --line-height-h3: 1.3;
  --line-height-b-p: 1.62;
  --line-height-b-code: 1.5;

  --letter-spacing-h1: -0.018em;
  --letter-spacing-h2: -0.01em;
}

body {
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
}
h1 {
  font-size: var(--font-size-h1);
  line-height: var(--line-height-h1);
  font-weight: var(--font-weight-h1);
  letter-spacing: var(--letter-spacing-h1);
}
/* ... similarly for h2, h3, b-p, b-code */
```

`@skb/design-tokens` Tailwind preset 同步导出 `theme.fontSize` / `theme.fontWeight` / `theme.lineHeight` / `theme.letterSpacing` (per design-tokens CONTRACT.md `Tailwind preset is the single source of truth` invariant). consumer 通过 Tailwind class (e.g., `text-body` / `font-h1` / `tracking-h2`) OR CSS var (`var(--font-size-body)`) 消费; 不允许硬编码 px values.

ADR-0003 D6 single-source 精神兑现.

### D6 — Shadow 暖色调 `rgba(20,15,10, alpha)` (vs 中性 `rgba(0,0,0)`)

```css
:root {
  --shadow-sm: 0 1px 2px rgba(20, 15, 10, 0.05), 0 1px 1px rgba(20, 15, 10, 0.04);
  --shadow-md: 0 4px 12px rgba(20, 15, 10, 0.08), 0 2px 4px rgba(20, 15, 10, 0.05);
  --shadow-lg: 0 12px 32px rgba(20, 15, 10, 0.16), 0 6px 12px rgba(20, 15, 10, 0.1);
}
```

理由 (per granularity v0.3.4 v2 视觉契约要素 § Spacing/radius/shadow): 暖色调 `rgba(20,15,10, ...)` 与 cream `oklch(99% 0.005 80)` + 橙红 accent + Inter 字体调和; 中性 `rgba(0,0,0)` shadow 视觉冷; 与 v2 整体调子不符. 单一 token 切到暖色调 = 全 apps/site + block-\* shadow 自动跟.

### D7 — 8 light block CSS calibration (OKLCH switchover collateral)

5 light blocks (kind ∈ {component, render}): callout / code / image / math / pdf

- 3 markdown 派生 prose elements (kind='prose'; granularity v0.3.4 § "v2 编辑器 UX 要素"): headings (H1-H3) / lists / inline elements (em / strong / link / mark / code).

`packages/block-{callout,code,image,math,pdf}/src/ui-default/` CSS 校准:

- 替换 hex / RGB / HSL color values → OKLCH (consume design-tokens authority per D1)
- 替换 black/gray shadow → `var(--shadow-sm)` / `var(--shadow-md)` 暖色调 (D6)
- 替换 sans-serif default → `var(--sans)` Inter (D2)
- 替换 monospace default → `var(--mono)` JetBrains Mono (D2)
- 顶 2px 横条 (D3): callout (kind=component, no hue 默认 NULL) / code (kind=component, no hue) / image (kind=component, hue 60°) / math (kind=render, hue 280° per Q3 absorbtion) / pdf (kind=render, hue 0° per Q3 absorbtion)
- visual smoke playwright on `/sample-blocks` page baseline screenshot (ux-ui-lead Stage C.3 dispatch)

5 light block kind 顶 2px 横条 hue ↔ ADR-0009 BlockKind 4-way union 无 1-1 mapping (kind=component 可有可无横条; kind=render 必有 hue per D3); 取决于具体 block 视觉识别需求.

### D8 — Save-path 接口冻结 (per Wave 5 plan v0.2 D10 + Q8 absorbtion)

#### Save-path 决策

3 候选路径 trade-off:

| 路径                                                                                                                 | 复杂度                                               | 跨设备同步                 | Wave 5 适用                           | Phase 2+ 适用               |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------- | ------------------------------------- | --------------------------- |
| (a) `apps/api` REST endpoint (POST `/v1/notes/<slug>`)                                                               | 高 (server runtime + auth + DB)                      | ✅                         | ❌ (复杂度过高)                       | ✅ (升级路径)               |
| (b) Astro endpoint (server-side; Astro v4 `endpoint` feature)                                                        | 中 (server-mode 配置 + Astro 与 static build 不兼容) | 部分 (需要 server runtime) | ❌ (NOT 选; 与 Astro static incompat) | 不选                        |
| (c) localStorage prototype (browser localStorage; per `feedback_lychee_user_local_paths` 风格 single-device persist) | 低 (client-side 简单 K-V)                            | ❌                         | ✅ **Wave 5 MVP 选**                  | ❌ (Phase 2+ apps/api 替换) |

**Wave 5 MVP 锁**: localStorage prototype (路径 c). 单设备 + 简单 + Phase 1 完成路径; 跨设备同步 + collaborative editing 留 Phase 2+ apps/api endpoint 升级.

#### NoteSaveAdapter TypeScript interface (Stage C.4 实施 + Phase 2+ 升级 共享)

**Adapter 落点 (per Q9 absorbtion — 锁单一落点)**: NoteSaveAdapter 接口 + LocalStorageAdapter impl 落 `@skb/editor-shell/src/save-adapter.ts` (NEW; Stage C.4 实施 PR scope; 唯一对外契约位置). `@skb/mdx-bridge` 仅做 MDX serialize/parse 映射 per ADR-0016 D7, NOT 暴露 NoteSaveAdapter. Stage C.4 实施 PR 不允许双签名; ADR-0018 lock NoteSaveAdapter at editor-shell.

**接口定义 (per Q10 absorbtion — tiptapState 改 ReadonlyJSONValue + version readonly + 注释 cache-only)**:

```typescript
// @skb/editor-shell/src/save-adapter.ts (NEW; Stage C.4 实施 PR scope)

/** Read-only JSON-serializable value (recursive). 用于 tiptapState 缓存仅; NOT 持久化 schema. */
export type ReadonlyJSONValue =
  | string
  | number
  | boolean
  | null
  | readonly ReadonlyJSONValue[]
  | { readonly [key: string]: ReadonlyJSONValue };

export interface NoteState {
  /** Raw MDX source — 持久化 + round-trip with mdx-bridge per ADR-0016 D7 */
  readonly mdxSource: string;
  /** Optional Tiptap state cache (preview optimization). NOT 跨端稳定 schema; 仅 same-session memory cache.
   *  Stage C.4 实施 PR 可选不存 (LocalStorageAdapter 加载时 always 从 mdxSource 重建 Tiptap state). */
  readonly tiptapState?: ReadonlyJSONValue;
  /** Last-modified timestamp ms */
  readonly lastModified: number;
  /** Monotonic version; consumer increments before each save() call. Wave 5 MVP 不验证;
   *  Phase 2+ apps/api endpoint 用作乐观锁 conflict detect (server compares incoming.version vs stored.version + 1).
   *  约束: 每次 save() 前 consumer 必 increment version (e.g., editor-shell 在 layoutEpoch +1 时同步 version +1).
   *  LocalStorageAdapter.save() NOT auto-increment (Wave 5 MVP consumer-driven; Phase 2+ ApiAdapter server-validate). */
  readonly version: number;
}

export interface NoteSaveAdapter {
  /** Note slug (URL path /notes/<slug>) */
  readonly slug: string;

  /** Load NoteState from persistence; null = no saved state (new note) */
  load(): Promise<NoteState | null>;

  /** Save NoteState to persistence; { ok: true } success; { ok: false, error } failure.
   *  Wave 5 MVP NoteSaveAdapter is sync-on-success (LocalStorageAdapter immediate);
   *  Phase 2+ ApiAdapter is async-with-retry (network failure → exponential backoff). */
  save(state: NoteState): Promise<{ ok: boolean; error?: string }>;

  // Phase 2+ extensions (per Q12 absorbtion — Phase 2+ 兼容位预留):
  // (1) save(state, options?: { signal?: AbortSignal; timeout?: number; onProgress?: (p: number) => void })
  //     - AbortSignal: user cancel mid-save (e.g., switch route during ApiAdapter network);
  //     - timeout: ms before abort (default no-timeout for LocalStorage; default 10s for Api);
  //     - onProgress: ApiAdapter upload progress (0-1 fraction)
  // (2) subscribe(callback: (state: NoteState) => void): UnsubscribeFn
  //     - Real-time collaborative; Phase 2+ ApiAdapter via WebSocket; LocalStorageAdapter NOT subscribe (single-session)
  // Wave 5 NOT include either; ADR-0018 D8 接口 v1 不动; v2 接口 ADR-0019+ amendment 引入.
}

// Wave 5 MVP impl (per Q11 absorbtion — localStorage size/quota/SecurityError 错误处理)
export class LocalStorageAdapter implements NoteSaveAdapter {
  /** Per-note size cap (≤ 2 MB serialized JSON; 合理 markdown size budget) */
  private static readonly PER_NOTE_MAX_BYTES = 2 * 1024 * 1024;

  /** Aggregate cap (warn at 5 MB; localStorage browser limit ~5-10 MB depending) */
  private static readonly AGGREGATE_WARN_BYTES = 5 * 1024 * 1024;

  constructor(public readonly slug: string) {}

  async load(): Promise<NoteState | null> {
    try {
      const raw = localStorage.getItem(`skb-note:${this.slug}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as NoteState;
      } catch {
        // Corrupted JSON; log warn but return null (treat as new note; per Q11 数据丢失 disclosure)
        console.warn(`[NoteSaveAdapter] corrupted state for ${this.slug}; returning null`);
        return null;
      }
    } catch (e) {
      // SecurityError (e.g., localStorage disabled in private mode / iframe sandbox)
      if (e instanceof DOMException && e.name === 'SecurityError') {
        console.warn(`[NoteSaveAdapter] localStorage SecurityError; load disabled`);
        return null; // user 看到 empty editor; explicit "save disabled" UI 由 editor-shell 控制
      }
      throw e;
    }
  }

  async save(state: NoteState): Promise<{ ok: boolean; error?: string }> {
    const serialized = JSON.stringify(state);
    if (serialized.length > LocalStorageAdapter.PER_NOTE_MAX_BYTES) {
      return {
        ok: false,
        error: `note exceeds 2MB limit (${serialized.length} bytes); split into smaller notes`,
      };
    }
    try {
      localStorage.setItem(`skb-note:${this.slug}`, serialized);
      // Aggregate size warning (best-effort; iterate localStorage keys)
      const aggregateBytes = Object.keys(localStorage)
        .filter((k) => k.startsWith('skb-note:'))
        .reduce((sum, k) => sum + (localStorage.getItem(k)?.length ?? 0), 0);
      if (aggregateBytes > LocalStorageAdapter.AGGREGATE_WARN_BYTES) {
        console.warn(
          `[NoteSaveAdapter] aggregate notes ${aggregateBytes} bytes > 5MB; consider Phase 2+ apps/api`,
        );
      }
      return { ok: true };
    } catch (e) {
      // QuotaExceededError (localStorage 满)
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        return {
          ok: false,
          error: 'localStorage quota exceeded; delete old notes or upgrade to apps/api',
        };
      }
      // SecurityError
      if (e instanceof DOMException && e.name === 'SecurityError') {
        return {
          ok: false,
          error: 'localStorage disabled (private mode / sandbox); save disabled',
        };
      }
      return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
    }
  }
}

// Phase 2+ impl (NOT Wave 5 scope; placeholder forward-pointer)
// export class ApiAdapter implements NoteSaveAdapter {
//   constructor(public readonly slug: string, public readonly apiBase: string, public readonly authToken: string) {}
//   async load() { return await fetch(`${apiBase}/v1/notes/${slug}`, ...) ... }
//   async save(state, options?: { signal?, timeout?, onProgress? }) { POST /v1/notes/${slug} with retry }
// }
```

#### Storage key + version field semantics (接口冻结)

- localStorage key prefix: `skb-note:` + slug. e.g., `skb-note:my-first-note`. NOT 与 design-tokens `skb-theme` 冲突 (per design-tokens CONTRACT.md `STORAGE_KEY = 'skb-theme'`).
- version field: monotonic int starting at 1; increments on each save. **Wave 5 MVP**: 不验证 version (单设备 单 session 假设); Phase 2+ apps/api endpoint 用 version 做乐观锁 (conflict detect).
- save 触发: Wave 5 Stage C.4 实施 PR 锁 trigger 策略 (per layoutEpoch ADR-0016 D12 +1 时 OR explicit save button OR debounced auto-save); ADR-0018 仅锁接口, NOT trigger frequency.

#### Pre-A4 vs Stage C.4 boundary

- **Pre-A4 (this ADR)**: NoteSaveAdapter interface + NoteState shape + LocalStorageAdapter MVP impl + Phase 2+ ApiAdapter forward-pointer. **接口冻结** (Pre-A5 仅做确认与验收 不动接口; Stage C.4 实施 PR 在此接口下实施 + 不调整 fields).
- **Stage C.4 实施**: editor-shell 创建 `NoteSaveAdapter` 实现; apps/site `/notes/[slug]/edit` route 消费; layoutReducer + mdx-bridge 集成 + save trigger 策略 (debounce / explicit / auto-save).

接口冻结约束: Wave 5 任何 PR 改动 NoteSaveAdapter / NoteState shape **必走 ADR-0018 Amendment** (D2 row 4 fires); Stage C.4 实施 不允许 silent 接口扩展.

## v0.6 Amendment (Wave 6 Stage B — ApiAdapter promoted to default; path-(b) Astro hybrid lock)

> **Status**: amended 2026-05-07 post Wave 5 close (ADR-0019). Wave 6
> Stage B trigger: `/notes/<slug>/edit` localStorage save 不会 propagate
> to `/notes/<slug>` 静态 read route — 用户烟测发现两页不同步（"现在
> 这连雏形都没有 用户都用不了"）。Stage A 客户端 hydration bridge 因
> Astro `client:only="react"` hydration timing flake 放弃；直接进入
> Stage B 服务端写回方案（ADR-0018 D8 **path-(b) Astro mixed-mode
> endpoint** 正式实施 — Wave 5 era D8 因 "Astro static build 不兼容"
> 拒绝 path-(b) 是基于 Astro 4.x 静态-only 假设；Astro 5.x 原生支持
> mixed prerendered + server endpoints (under 5.18 这通过
> `output: 'static'` + per-route `export const prerender = false` 实现；
> 5.x 早期短暂存在的 `output: 'hybrid'` literal 在 5.18 已移除，详见
> D10)，path-(b) 拒绝理由 v0.6 retract）。**path-(a) 单独 apps/api
> package** 保留为 Phase 3+ multi-user collab / separate auth boundary
> 升级路径，NOT v0.6 选项。
>
> **Pre-v0.6 prose supersede notice**: ADR-0018 Pre-A4 (v0.1.1) 原文
> 多处 reference "Phase 2+ apps/api endpoint upgrade path" / "separate
> server" / "REST `/v1/notes/<slug>`" / "ADR-0005 API conventions
> consume" (lines 9 / 16 / 30 / 357 / 361 / 390 / 492-493 / 500 / 781
> 等) — 这些 reference 的 "apps/api endpoint" 指 path-(a)
> separate-server architecture，留 Phase 3+。**v0.6 Wave 6 Stage B
> selects path-(b)** (Astro mixed-mode server endpoint at
> `apps/site/src/pages/api/notes/[...slug].ts` with `export const
prerender = false`; under Astro 5.18 the supported config is
> `output: 'static'` + Node adapter — see D10); ApiAdapter consumes
> `/api/notes/<slug>` URL relative to apps/site origin (NOT
> `/v1/notes/<slug>` apps/api absolute). Pre-v0.6 prose preserved
> as historical record but **load-bearing implementation reference =
> v0.6 D9-D16 below**.

### v0.6 D9 — ApiAdapter promoted from Phase 2+ forward-stub to Wave 6 first-class default (path-(b) Astro hybrid)

D8 原文锁定 Wave 5 MVP = path-(c) localStorage prototype；path-(a)

- path-(b) 留 Phase 2+。**v0.6 amendment**：path-(b) Astro hybrid
  endpoint at `apps/site/src/pages/api/notes/[...slug].ts` promoted to
  **Wave 6 Stage B default**；Stage B 实施期间两个 adapter 共存
  （LocalStorageAdapter retained as offline fallback；ApiAdapter as
  primary network-online path consuming the path-(b) endpoint）；
  Wave 6 Stage B close 后 path-(c) 降级为 fallback-only.

**D8 path-(b) 拒绝理由 retract**: Wave 5 era D8 表 line 358 标记
path-(b) "❌ NOT 选; 与 Astro static incompat"。这条理由基于 Astro
4.x 静态-only 假设。Astro 5.x 原生支持 mixed static prerender +
on-demand server endpoints (under 5.18: `output: 'static'` +
per-route `export const prerender = false` + Node adapter；
详见 D10)，path-(b) 兼容性问题已不存在；v0.6 amendment retract
path-(b) 拒绝理由 + promote 为 Wave 6 Stage B 正解。

**path-(a) (separate apps/api package) 保持 Phase 3+ 升级路径**:
适用于 multi-user collab / separate auth boundary / horizontal scale
等更高复杂度场景；v0.6 NOT 选；Wave 6 Stage B 不需要 separate apps/api
package。

### v0.6 D10 — Astro hybrid output 架构调整

Wave 5 era apps/site = Astro `output: 'static'` (默认；纯静态 build)。
Wave 6 Stage B 需要 mixed prerendered + server-only routes — 大部分
页面保持 static prerender，`/api/notes/[...slug]` server endpoint 接受
GET (load) + POST (save)。

**Astro 5.18 reality (post-amendment correction 2026-05-07)**: Astro 5.x
**移除了 `output: 'hybrid'` literal**；mixed static + server endpoints
现在通过 `output: 'static'` (默认) **加** per-route
`export const prerender = false` 实现。原 v0.6 amendment 的 "要求
`output: 'hybrid'`" 措辞 reflects pre-Astro 5.18 命名；本 D10 prose 已
按 Astro 5.18 实际 API 修订。Architectural intent unchanged (mixed
prerendered + server endpoints；`@astrojs/node` adapter required to host
the server-only route)；仅 `astro.config.mjs` 写法 differs:

```js
// Astro 5.18 supported pattern (Wave 6 Stage B):
output: 'static',                       // default; supports mixed mode
adapter: node({ mode: 'standalone' }),  // hosts non-prerendered routes
// per-route opt-out lives in apps/site/src/pages/api/notes/[...slug].ts:
//   export const prerender = false;
```

**Deployment adapter scope**:

- **Dev mode** (`astro dev`): server endpoints 直接 work；filesystem
  write-back 到 `content/notes/<slug>/index.mdx` 文件；hot-reload
  picks up changes → static read route 自动同步
- **Preview mode** (`astro preview` post `astro build`): 需要 Node.js
  adapter (`@astrojs/node`) standalone 模式；Wave 6 Stage B 加 dev
  dep + 配置；本地 `pnpm preview` work
- **Prod deployment** (Cloudflare / Vercel / Netlify / etc.): 需要
  对应 deployment adapter；**Wave 6 Stage B NOT scope**；Phase 3+
  user 决定具体 deployment target 后再加 adapter；prod 部署期间
  fallback to LocalStorageAdapter (offline-only 同设备同步)

### v0.6 D11 — ApiAdapter implementation contract

`packages/editor-shell/src/save-adapter.ts` ApiAdapter 替换 C.4-1
COMMENT-only forward-stub 为 executable class:

```typescript
export class ApiAdapter implements NoteSaveAdapter {
  constructor(
    public readonly slug: string,
    public readonly apiBase: string = '/api/notes',
  ) {}

  async load(): Promise<NoteState | null> {
    const res = await fetch(`${this.apiBase}/${this.slug}`, { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`load failed: ${res.status}`);
    return (await res.json()) as NoteState;
  }

  async save(state: NoteState): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.apiBase}/${this.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        return { ok: false, error: `save failed: ${res.status}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'network error' };
    }
  }
}
```

NoteState shape **unchanged** (mdxSource + tiptapState? + lastModified +
version)；layoutEpoch field add 仍然 deferred (separate amendment if
needed per ADR-0019 D3 deferred item #1).

### v0.6 D12 — Server endpoint contract

`apps/site/src/pages/api/notes/[...slug].ts` (Astro file-based API).
**Two-file persistence model** (sidecar pattern; B.2 R2 amendment
2026-05-07): each note slug maps to two sibling files in
`content/notes/<slug>/`:

- `index.mdx` — canonical content owned by `@skb/content-types`;
  YAML frontmatter (`title` / `date` / `tags` / `draft`) preserved
  verbatim; body replaced with `state.mdxSource` on save.
- `state.json` — sidecar JSON `{ lastModified: number, version: number }`
  carrying persistence metadata that does NOT belong in the
  frontmatter schema. Keeping these fields out of `index.mdx`
  preserves the `@skb/content-types` single-authority invariant
  (no schema drift; zero consumer-side updates).

Endpoint contract:

- **GET** `/api/notes/<slug>`:
  - 读 `content/notes/<slug>/index.mdx` + 解析 frontmatter
  - 读 sibling `content/notes/<slug>/state.json` if present
  - return `NoteState` JSON (`mdxSource` 来自 MDX body；
    `lastModified` 来自 sidecar 否则 `mtimeMs` fallback；`version`
    来自 sidecar 否则 `1` fallback)
  - 404 if `index.mdx` 不存在 (sidecar 单独缺失 NOT 404 — fallback)
- **POST** `/api/notes/<slug>` body: `NoteState` JSON
  - **edit-only**: 必 existing `index.mdx`；missing 文件 return
    **404** (refuses orphan-creation; body-only POST 不能 supply
    frontmatter; new-note creation 留 Wave 6 Stage B scope 之外)
  - 写回 `index.mdx` (preserve frontmatter verbatim;
    overwrite body with `state.mdxSource`)
  - 写 sibling `state.json` `{ lastModified, version }`
  - return `{ ok: true }` on success；
    **400** on invalid JSON / missing fields；
    **404** on missing `index.mdx`；
    **500** on file IO error；
    all errors `{ ok: false, error: string }`

**No auth at Wave 6 Stage B**；single-user dev/preview only。Phase 3+
auth boundary (per ADR-0018 line 462 multi-user collaborative path).

### v0.6 D13 — EditorShellMount adapter selection

`apps/site/src/components/EditorShellMount.tsx` switches from
`LocalStorageAdapter`-only to **ApiAdapter primary + LocalStorageAdapter
fallback**:

- Try ApiAdapter.load() first
- On network error / 5xx: fall back to LocalStorageAdapter.load()
- Save: dual-write (ApiAdapter primary; LocalStorageAdapter as cache)
  OR ApiAdapter only (simpler; LocalStorage stays as backup snapshot)
- Wave 6 Stage B 选 ApiAdapter only-write + LocalStorage backup-on-error
  (simpler reasoning + fallback path defined)

### v0.6 D14 — Wave 6 Stage B PR sequence (5 PRs)

| PR            | Subject                                                                                                | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B.1 (this PR) | ADR-0018 v0.6 amendment                                                                                | This document; ADR amendment only; lock architecture before implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| B.2           | apps/site Node adapter + per-route `prerender=false` server endpoint + filesystem write-back (sidecar) | `astro.config.mjs` keeps `output: 'static'` (Astro 5.18 reality; see D10) + adds `@astrojs/node` dep + `adapter: node({ mode: 'standalone' })` + `apps/site/src/pages/api/notes/[...slug].ts` NEW (`export const prerender = false`) + sidecar `state.json` for `{lastModified, version}` to keep `@skb/content-types` frontmatter authority intact                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| B.3           | ApiAdapter implementation in @skb/editor-shell                                                         | `save-adapter.ts` replace COMMENT-only stub with executable class per D11 contract; vitest contract tests; export from `index.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| B.4           | EditorShellMount.tsx wire to ApiAdapter (primary) + LocalStorageAdapter (fallback)                     | Per D13; preserve C.4-prelude/C.4-1/C.4-3 affordances unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| B.5           | Stage B close + edit-route persistence-cycle Playwright spec + handoff pack                            | Playwright spec: edit `/notes/<slug>/edit` → ApiAdapter POST → filesystem mutated (index.mdx body + sidecar state.json) → reload edit route → ApiAdapter GET returns the saved NoteState → editor loads it. **Read-route freshness against API saves is NOT closed in `astro build`/preview mode** (the `/notes/<slug>` HTML is prerendered at build time and does not auto-rebuild on API write); the user-reported gap closes in `astro dev` (HMR) which was the workflow that motivated the report. Production read-route freshness is a Phase 3+ path-(a) `apps/api` SSR concern, deferred per the handoff pack §"What is NOT closed (static-build caveat)". This row was originally drafted "verify full cross-route sync + reload /notes/<slug> → content reflects edit" — amended at B.5 R5 (2026-05-07) to match the actually shippable proof. |

### v0.6 D15 — NoteState shape change deferral continued

`layoutEpoch?: number` field add (surfaced at C.4-4 R1; reverted to keep
ADR-0018 D8 接口冻结) **stays deferred**；NOT folded into v0.6 Stage B
amendment scope to keep B.1 minimal (ADR amendment + B.2-B.5 implementation
focus). Future amendment v0.7+ can add field if needed; tracked as
ADR-0019 D3 deferred item #1.

### v0.6 D16 — Stage B retroactive supersedes Stage A localStorage hydration bridge

Wave 6 Stage A (client-side React island reading localStorage on /notes/<slug>
read route) was attempted post Wave 5 close 2026-05-07 but ABANDONED
due to Astro `client:only="react"` hydration timing flake (reviewer
3/5 stress test fail; hydration data attribute race against Playwright
assertions). v0.6 Stage B obviates Stage A entirely:

- ApiAdapter writes to MDX file → Astro dev hot-reload picks up → static
  read route renders updated content ON NEXT NAVIGATION
- No client-side hydration race (deterministic by construction)
- Cross-device sync (server is source of truth)

Stage A is recorded as Wave 6 R32 retrospective candidate ("client:only
React island hydration is non-deterministic for read-route DOM mutation;
prefer server-side state propagation OR `<script is:inline>` synchronous
script when client-side bridge truly needed").

## v0.7 Amendment (Wave 6 cf-23 — read-route page-shell visual unification)

> **Status**: amended 2026-05-10 post Wave 6 cf-22 (keyboard a11y).
> Wave 6 cf-23 trigger: 用户验收 cf-22 后再次确认 "把 edit 和正常
> 模式风格统一一下" + "其他的全部对齐 v2"。 cf-20a 已闭合 block
> chrome 单源；cf-23 闭合 page-shell layer (BaseLayout main 元素 容器
> 宽度 + Tailwind `prose` typography 与 v2 token 冲突)。
>
> v0.6 amendment 关心 save-path / data persistence；v0.7 amendment
> 关心 read-route visual contract — 两块互不影响，independent
> amendments to the same v2 visual ADR. v0.7 D9 namespace 与 v0.6 D9
> 区分通过版本前缀 (mirrors v0.6 prefix convention)。

### v0.7 D9 — Read-route page-shell visual contract (BaseLayout `wide` opt-in + drop Tailwind `prose` for /notes/* + 4-viewport width-parity lock)

**Trigger**: cf-23 PLAN session 视觉 probe 发现 BaseLayout
main 元素 全程 `class="prose mx-auto max-w-3xl py-12 px-4"` 锁
768px 宽度且 Tailwind Typography preset 的 `font-size: 16px` /
`prose p { font-size: 18px }` 覆盖 v2 token (`--font-size-body: 15px`
/ `--font-size-b-p: 14.5px`)。 v2 reference (`/mnt/d/download/web/v2-styles.css:122-127`)
`.doc-wrap` 是 `max-width: 1180px; padding: 40px 48px 200px`。
edit 与 read 共同 mismatch v2，user 述 "全部对齐 v2" = 两 route
共同对齐。

#### Decision

(1) `apps/site/src/layouts/BaseLayout.astro` 加 optional prop
    `wide?: boolean = false`：
    - `wide` truthy 时：main 元素 className =
      `mx-auto py-10 px-4 lg:px-12 notes-doc-wrap`，inline
      `style="max-width: 1180px"`
    - `wide` falsy（默认）时：保留现有 `prose mx-auto max-w-3xl
      py-12 px-4`（非 notes route 不动）

(2) BOTH `apps/site/src/pages/notes/[...slug].astro`（read）AND
    `apps/site/src/pages/notes/[...slug]/edit.astro`（edit）传
    `wide`，作为对称 opt-in。后续 cf-NN 若需 widen `/`、`/search`
    可同样 opt in；本 amendment 不动其他 route。

(3) Tailwind `prose` className 在 `wide` 路径被 dropped。 理由：
    Tailwind `@tailwindcss/typography` preset 的 `font-size: 1.125rem`
    （18px）on `prose p` 直接覆盖 `apps/site/src/styles/prose.css`
    的 `.skb-prose p { font-size: var(--font-size-b-p) }` (14.5px) 通过
    `:where()` 高 specificity 注入。 cleaner 单源 = 在 v2-aligned
    route 上 opt out，让 v2 token 直接 cascade 到 main 元素、
    `p` 段落、`h2` 等。

(4) Container 宽度 4-viewport lock (cf-23 D10)。 main 元素的
    `getBoundingClientRect().width` 测的是 OUTER box (padding 在 box
    内部)，所以：
    - 1280 viewport: inline `style="max-width: 1180px"` cap 把 box
      固定在 1180px；`mx-auto` 把多余 100px 平分两边作 50px margin。
    - viewport ≤ 1180px (1024 / 768 / 375): box 填满 viewport，
      `px-4` (16px*2) / `lg:px-12` (48px*2) padding 推进 inner
      content；main 元素 外宽 = viewport。

| Viewport | main outer width | inner content width |
| --- | --- | --- |
| 1280 | 1180px (max-width cap) | 1180 - 96 (lg:px-12*2) = 1084 |
| 1024 | 1024px (no cap) | 1024 - 96 (lg:px-12*2) = 928 |
| 768 | 768px (no cap) | 768 - 32 (px-4*2) = 736 |
| 375 | 375px (no cap) | 375 - 32 (px-4*2) = 343 |

cf-23 R0 F2 lock tightening: BOTH outer AND inner widths are
asserted at every viewport (pre-R0 only outer was locked; a
regression that changes `lg:px-12` → `lg:px-8` would silently
shrink inner without changing outer). Inner is measured as
`main.clientWidth - paddingLeft - paddingRight` to capture the
content-box width regardless of box-sizing.

`apps/site/playwright/notes-route-width-parity.spec.ts` 在 cf-23
EXECUTE TDD-write 阶段测出 outer width values 后写入 spec lock
(±4px tolerance band 吸收 scrollbar 子像素差异)。

(5) 28px `h1` heading 保持，**不**降级到 v2 `.doc-title` 13px
    gray。 理由：SKB 是 knowledge-base，real `h1` heading 是
    document-outline semantics 的认证锚点 (a11y heading hierarchy +
    screen-reader nav + page-title cross-ref)；v2 reference 是
    designer-mock editor，doc title 是 incidental UI label。
    SKB read route 优先可读性 + outline 语义。 本 amendment 显式
    ratify 此 divergence。

(6) Outer chrome (`header` + `nav` + theme toggle) 不动。
    理由：v2 reference 不规定 read-only outer shell; v2 `.app` shell
    (left palette + top bar + scroller) 是 EDITOR-mode chrome only。
    cf-23 仅闭合 inner doc-wrap 层；outer chrome 等 cf-24+ 决议。

#### 范围边界 (explicit out-of-scope per orchestrator approval)

- `/`（home index）+ `/search` route 不 opt in `wide`：保留
  `prose max-w-3xl`。 D2.b widening-all-routes 选项被 explicit
  reject，避免连带破坏无关 route layout。
- v2-style left-rail palette + top-bar editor chrome：cf-24+ 范围。
- v2-style `.doc-title` 13px gray label：保留 28px `h1` heading
  （上述 decision (5)）。
- Dark-mode 视觉重新审计：本 amendment 仅 verify no visible
  regression，不修 `tokens-dark.css`。 v2 reference 当前是 light-only。
- Touch / mobile drag：仍 out-of-scope per ADR-0017 D9；cf-23 D8
  spec assertion 在 4 viewport 包括 375 验证 read route 不 leak
  edit affordances（`[data-skb-drag-handle]` 等 9 selector 全 0）。

#### Consequence

- Positive: edit + read 两 route 容器宽度 + typography 同时对齐 v2。
  Tailwind prose 与 v2 token 之间 specificity 战争终结（仅 v2
  token cascade）。 cf-23 D8 + D10 spec 锁未来 regression。
- Positive: BaseLayout `wide` prop 是单一 opt-in 锚点；future
  cf-NN 若 widen 其他 route 仅一处 prop pass，不复制 className。
- Positive: 28px `h1` heading divergence 显式 ratify =
  knowledge-base semantics 优先，明确不是 oversight。
- Negative: BaseLayout 增加一个 prop 增加少量 cognitive load
  for future BaseLayout consumers; mitigation = TypeScript prop
  type + `apps/site/CONTRACT.md` § "Layout shell" + ADR-0018
  v0.7 D9 cross-ref；不 hidden。
- Negative: Tailwind `prose` 在 wide 路径 silently drop 可能让
  consumer 困惑 "为什么我加 `prose` class 没生效"；mitigation =
  prop name `wide` + `notes-doc-wrap` className 是显式信号；
  drop 不是 silent，是 wide 路径 className 整体替换。
- Neutral: 4-viewport 锁的 widths 是 absolute target；未来若
  Tailwind config padding scale 改 (`px-12` 重定义) lock 会 fail，
  这是 intentional regression net (orchestrator plan-challenger
  D10 refinement 明确要求 lock 绝对值非仅 delta)。

#### Sister-doc updates (per ADR-0006 #6)

- `apps/site/CONTRACT.md`: NEW "Layout shell" 段，记录 BaseLayout
  `wide?: boolean` prop + 4-viewport doc-wrap measurement table +
  cross-ref ADR-0018 v0.7 D9。
- `apps/site/playwright/sample-blocks-read.spec.ts`: extended +
  cf-23 typography-token assertion 注释。
- `apps/site/playwright/sample-blocks-read-no-edit-affordances.spec.ts`:
  NEW spec — D8 zero-affordance lock 的认证 cite。
- `apps/site/playwright/notes-route-width-parity.spec.ts`: NEW spec
  — D10 width-parity 4-viewport lock 的认证 cite。

#### 不修内容（reviewer cross-ref）

- `packages/editor-shell/src/block-chrome.css`: 不动 — cf-20a 单源
  layer 在本 amendment 之前已 align。
- `apps/site/src/styles/prose.css`: 不动 — `.skb-prose p` 已 consume
  `--font-size-b-p`；本 amendment drop `prose` class 让 cascade 不被
  shadow，`.skb-prose` 规则继续 fire。
- `packages/design-tokens/src/tokens.css`: 不动 — 所有需要的 token
  (--font-size-body / --font-size-b-p / --font-size-h1 / --line-height-*
  / --font-weight-* / --letter-spacing-h1 / --sans / --mono) 已 v0.6
  state 完整存在。
- `apps/site/src/styles/grid.css`: 不动 — cf-20b 4-breakpoint
  grid responsive layout（≤1024 → 6col, ≤768 → 1col + !important
  flatten + `min-width: 0` + heavy-block cap + overflow-x scroll）
  在更宽 doc-wrap 内继续触发，因为 `useResponsiveCols` + grid.css
  media query 都 read viewport-width 不 container-width。

## Acceptance criteria (AC list)

`@skb/design-tokens` + `apps/site` + 5 light block packages + visual smoke playwright + (Stage C.4) `@skb/editor-shell` save-adapter 必满足:

1. **AC#1 (design-tokens OKLCH values match v2-styles.css authority)**: `tokens.css` 15 color vars (14 OKLCH + 1 hex `--surface`) + 3 layout vars (`--row-h` / `--gap` / `--radius`) + 3 shadow vars (D6) + 2 font vars (D2) = 23 visual tokens 总; OKLCH color values match v2-styles.css 字节等价 (modulo CSS comment 修饰); vitest snapshot
2. **AC#2 (Inter + JetBrains Mono preconnect tags)**: apps/site `BaseLayout.astro` `<head>` includes `<link rel="preconnect" href="https://fonts.googleapis.com" />` + `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`; vitest with mocked Astro / playwright DOM assertion
3. **AC#3 (block kind 顶 2px 横条 hue per kind)**: 3 既有 hue (canvas 215° / runnable 145° / image 60°) + 5 NEW hue (math 280° / pdf 0° / jupyter 90° / nn-viz 325° / agent-flow 180° per Q3 lock) = 8 kind hue tokens (markdown 默认无横条 — kind='prose' 不在 hue 计数); 各有 `--accent-${kind}` 在 `tokens.css`; vitest snapshot per kind className
4. **AC#4 (5 missing kind hue locked)**: math / pdf / jupyter / nn-viz / agent-flow 5 kind 各有 hue 在 D3 表 (Pre-A4 plan-challenger 后填入); 不留 TBD; visual baseline screenshot 比对 (ux-ui-lead Stage C.3 提交)
5. **AC#5 (prose customization match)**: `.b-quote` / `.b-callout` / `.b-code` / `.aref` / `mark` / inline `code` 选择器 + 样式 match v2-styles.css; vitest snapshot
6. **AC#6 (typography sizes/weights match)**: body 15px/1.55, H1 28px/700/-0.018em, H2 20px/650/-0.01em, H3 16px/600 per D5 table; vitest computed style
7. **AC#7 (shadow rgba(20,15,10) refresh)**: 3 shadow vars use `rgba(20,15,10, alpha)` NOT `rgba(0,0,0)`; vitest computed style
8. **AC#8 (8 light block CSS calibration)**: visual smoke playwright on `/sample-blocks` page (5 light blocks + 3 markdown派生 prose); baseline screenshot vs post-OKLCH-switchover; visual diff < 5% (ux-ui-lead Stage C.3 PR 加 fixture)
9. **AC#9 (NoteSaveAdapter interface + LocalStorageAdapter impl + round-trip vitest)**: TypeScript `NoteSaveAdapter` interface + `NoteState` shape per D8 export from `@skb/editor-shell`; LocalStorageAdapter `load() / save()` round-trip vitest fixture (mock localStorage); ApiAdapter Phase 2+ forward-pointer comment in source
10. **AC#10 (dark mode 留 Phase 2+)**: Wave 5 NOT 实施 dark theme; `tokens-dark.css` 留 既有 (per design-tokens CONTRACT.md), NOT 加 v2 dark variant; ADR-0018 Out-of-scope explicit
11. **AC#11 (`--accent-success` token defined + ADR-0017 D11 forward-pointer)**: `tokens.css` 含 `--accent-success: oklch(70% 0.12 145);` (D1 表); ADR-0017 D11 drop-pulse 消费此 token 已 specified; vitest grep + cross-reference
12. **AC#12 (OKLCH browser fallback hex via @supports)**: `@supports not (color: oklch(0 0 0)) { ... hex fallback ... }` block 在 `tokens.css` 末尾 (Stage C.3 PR 加; ADR lock 仅要求 schema)

Stage C.3 + Stage C.4 实施 PR 必逐条 cross-reference AC#1-#12 验证 (per ADR-0011 D2 SOTed-PR.md `## acceptance` 字段).

## Consequences

### Positive

- v2 视觉 identity (cream + 橙红 + Inter + JetBrains Mono + 顶 2px 横条 + prose customization + shadow 暖色调) 全套 token化 = ADR-0017 D11 drop-pulse + ADR-0014 heavy block plugin placeholder + 8 light block CSS calibration 全 single-source (design-tokens 包) consume; 视觉漂移风险显著降低
- Save-path 接口冻结 在 Pre-A4 (per Q8 absorbtion 提前) = Stage C.4 实施 PR 不会 surface 持久化 ADR amendment; Stage C.4 编排 cleaner; Pre-A5 v1.0 lock cleaner
- LocalStorageAdapter MVP + ApiAdapter Phase 2+ forward-pointer = upgrade path 显式; 用户可在 Wave 5 ship single-device, Phase 2+ 升级 cross-device 不破坏 NoteSaveAdapter interface (interface 冻结约束)
- 5 missing kind hue 在 Pre-A4 plan-challenger 锁 = ADR-0014 v0.5 amendment (Stage C.2) HeavyBlockBoundary plugin placeholder consume 横条 token 时不再 surface "什么 hue?" 决策延迟
- `--accent-success` NEW token = ADR-0017 D11 forward-pointer 兑现; drop-pulse / save-success / commit-pulse general purpose token 可复用 (Wave 5 + Phase 2+)

### Negative

- design-tokens 大改动 (14 OKLCH color vars + 1 hex `--surface` + 3 layout vars + 3 shadow vars + 2 font vars + 8 kind hue token) = OKLCH switchover collateral 影响 8 light block CSS + apps/site 全局; mitigation = visual smoke playwright (AC#8) + ux-ui-lead subagent dispatch + screenshot 比对
- Save-path localStorage prototype = 单设备限制; user 切换设备 (e.g., 笔记本 → 手机) 时 notes 不同步; user-aware + Phase 2+ 升级路径文档化 (D8 接口冻结); MVP-acceptable per Wave 5 plan v0.2 D10
- OKLCH browser fallback (老 Safari < 15.4) = 双 token 维护成本 (`@supports not (color: oklch())` block); mitigation = automated fallback gen 工具 (Stage C.3 实施 PR 加; ADR lock schema only) OR 简化策略 (老 browser 直接降级到 system theme)

### Neutral / explicit acknowledgements

- Dark mode 推 Phase 2+ (per Q3 plan-challenger candidate; AC#10): cream/橙红主色在 dark 下需要重新设计 NOT simple invert; granularity v0.3.4 Open Q2 已 acknowledged
- `--row-h: 48px` + `--gap: 14px` 在 design-tokens 而 NOT editor-shell internal = design-tokens 是 single-source per ADR-0003 D6 + ADR-0016 W5-1 + ADR-0017 EDGE_W=2\*GAP 数学对应 全 derive 的 root authority
- localStorage `skb-note:<slug>` key 与 `skb-theme` 不冲突 (前缀显式); design-tokens `STORAGE_KEY = 'skb-theme'` 不动
- ~~Astro endpoint (路径 b) 不选 = 与 Astro static build 不兼容; Wave 5 + Phase 2+ 都 不 启用 server-mode (per ADR-0001 stack selection Astro static 决策); Phase 2+ apps/api endpoint 走 separate server (not Astro endpoint)~~ — **SUPERSEDED by v0.6 amendment** (Wave 6 Stage B selects path-(b) Astro mixed-mode endpoint; Astro 5.18 supports mixed prerendered + server endpoints via `output: 'static'` + per-route `export const prerender = false` + Node adapter — see D10; ADR-0001 amendment to follow if needed). path-(a) separate apps/api stays Phase 3+ for multi-user collab.

## Plan-challenger codex absorbtion (locked at lock-time)

per [ADR-0007 D5](ADR-0007-job-function-codex-heavy-execution.md) + [ADR-0011 D2](ADR-0011-linear-pipeline-execution-model.md) v0.1.1 SOTed-PR.md amendment + memory `feedback_soted_pr_md_discipline.md` + ADR-0013 D4 R13 + Wave 5 Pre-A2 12/12 / Pre-A3 13/13 absorbed precedent.

dispatch: `codex exec --yolo --profile plan-challenger ...` (Pre-A4 ADR-0018 design-lock 4-round style); audit log path: `/tmp/codex-runs/2026-05-04-Pre-A4-plan-challenge.txt` raw + `docs/audits/codex-runs/2026-05-04-Pre-A4-plan-challenge.txt` curated archive.

| #   | Challenge                                                                                | Severity | Verdict                | Reason / Locked at                                                                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------- | -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | D-list 拆分 D1+D2+D6 是否合并 visual-tokens 单 D-section + D8 与 D1-D7 在同 ADR 是否合理 | medium   | **PARTIALLY ABSORBED** | D1-D8 保持独立 (各自可追踪可 ratify); D8 自然形成 "Persist Contract" 独立子段 (`#### Save-path 决策` + `#### NoteSaveAdapter TypeScript interface` + `#### Storage key + version field semantics` + `#### Pre-A4 vs Stage C.4 boundary`) — 视觉与持久化在 D2 审核时分离. Locked at D8 子段结构.                                          |
| Q2  | OKLCH fallback hex 值 ADR 锁 vs Stage C.3 锁                                             | high     | **ABSORBED**           | D1 末尾加 "OKLCH browser fallback" 段; 锁 转换公式 (Culori library `oklchToHex(L,C,H)`) + 生成规则 (build script `pnpm generate:tokens-fallback` 自动 derive `tokens-fallback.css`) + 可执行快照 (snapshot test); Stage C.3 仅按规则 derive 不再解释. Locked at D1 OKLCH browser fallback paragraph.                                     |
| Q3  | 5 missing kind hue 候选不满足 60° 角距 + a11y 对比度                                     | high     | **ABSORBED**           | D3 加 "Hue 选择原则" + relax 60° → 30° + lightness/chroma supplement + WCAG 3:1 contrast + Validation 算法; 5 kind hue 重新 lock: math 280° / pdf 0° / jupyter 90° / nn-viz 325° / agent-flow 180° (lightness/chroma 各异). markdown 默认无横条 + 'Phase 2+ alternate 标识' note. Locked at D3 Hue 选择原则段 + 5 kind 表格.             |
| Q4  | Google Fonts CDN 隐私/CSP/self-host fallback + 字体加载失败                              | medium   | **ABSORBED**           | D2 末尾加 "Privacy / self-host fallback" 段; Google Fonts privacy disclosure + self-host fallback path (apps/site `public/fonts/` woff2 + CSP `font-src` + 5s timeout fall back to system fonts); useAutoRowSpan timeout 强制重测 path. Locked at D2 Privacy 段.                                                                         |
| Q5  | b-\* selector 命名冲突 (callout vs b-callout) + aref 通用 `<a>` 污染                     | medium   | **ABSORBED**           | D4 末尾加 "`.skb-prose` namespace 隔离" 段; `b-*` 仅 `.skb-prose` 内; `.aref` 限定 prose namespace + 显式 class (NOT 自动); ESLint rule `no-bare-aref-class` 防误用. Locked at D4 namespace 段.                                                                                                                                          |
| Q6  | Typography 硬编码 vs CSS variables (single-source 违背)                                  | medium   | **ABSORBED**           | D5 末尾加 "Typography 转 CSS variables" 段; design-tokens 暴露 `--font-size-*` / `--font-weight-*` / `--line-height-*` / `--letter-spacing-*` token + Tailwind preset theme.fontSize 同步. Locked at D5 CSS variables 段.                                                                                                                |
| Q7  | shadow rgba(20,15,10) vs oklch+alpha 决策解释                                            | low      | **PARTIALLY ABSORBED** | D6 决策保留 (rgba 暖色调与 cream 调和); 不补 oklch+alpha 备选注释 (可在 Stage C.3 实施 PR 加注释; ADR 不必). Locked at D6 trailing prose (rationale 已 implicit).                                                                                                                                                                        |
| Q8  | 8 light block CSS calibration scope (5+3 vs 5 only)                                      | low      | **PARTIALLY ABSORBED** | D7 已明确 5 light + 3 markdown 派生 prose; D7 与 D4 协同 (D7 视觉 CSS + D4 prose customization). 不必修改; reviewer 通过 cross-reference 理解. Locked at D7 prose.                                                                                                                                                                       |
| Q9  | NoteSaveAdapter 落点 editor-shell vs mdx-bridge                                          | medium   | **ABSORBED**           | D8 NoteSaveAdapter 段 锁 `@skb/editor-shell/src/save-adapter.ts` 唯一落点; mdx-bridge 仅做序列化映射 (per ADR-0016 D7); Stage C.4 实施 PR 不允许双签名. Locked at D8 NoteSaveAdapter Adapter 落点 段.                                                                                                                                    |
| Q10 | tiptapState unknown vs 明确 schema + version readonly 约束                               | medium   | **ABSORBED**           | D8 NoteState 改 `tiptapState?: ReadonlyJSONValue` (cache-only 注释); `version` readonly + 注释 consumer 必 increment before each save() call (Wave 5 MVP consumer-driven; LocalStorageAdapter NOT auto-increment; Phase 2+ ApiAdapter server-validate). Phase 2+ apps/api 乐观锁 conflict detect 路径预留. Locked at D8 NoteState shape. |
| Q11 | localStorage 5MB cap + Quota/SecurityError silent data-loss                              | high     | **ABSORBED**           | D8 LocalStorageAdapter 加 PER_NOTE_MAX_BYTES (2MB) + AGGREGATE_WARN_BYTES (5MB) + load/save Quota/SecurityError 处理 + console.warn + save-disabled UI fallback (editor-shell 控制). Locked at D8 LocalStorageAdapter impl.                                                                                                              |
| Q12 | NoteSaveAdapter Phase 2+ 扩展 (AbortSignal/timeout/progress) 未预留                      | medium   | **ABSORBED**           | D8 NoteSaveAdapter interface 注释 加 Phase 2+ 扩展位 (AbortSignal/timeout/onProgress + subscribe callback for collaborative); v1 接口冻结不动; v2 接口 ADR-0019+ amendment 引入. Locked at D8 interface Phase 2+ 扩展 段.                                                                                                                |
| Q13 | D2 trigger 门槛表 reduce 复核歧义                                                        | low      | **PARTIALLY ABSORBED** | Compliance 末尾加 "Pre-A4 D2 trigger 门槛表" — `NoteSaveAdapter 接口落文件 → 直接 row1` + "design-tokens token additions → row1 + row5" 等显式. 不必修改 D2 trigger judgment section 本身. Locked at Compliance trailing 门槛表 note.                                                                                                    |
| Q14 | Modal canvas (Phase 2+ ADR-0019+) token 继承 explicit                                    | low      | **PARTIALLY ABSORBED** | Out-of-scope section 末尾加 modal canvas constraint: "Phase 2+ ADR-0019+ modal canvas 必继承 design-tokens (background/shadow/font); 不重复定义新 visual constants". Locked at Out-of-scope trailing note.                                                                                                                               |

**Result**: 14/14 challenges absorbed (3 high + 7 medium + 4 low; codex verdict 3 high + 7 medium + 4 low advisory). 9 ABSORBED + 5 PARTIALLY ABSORBED (Q1/Q7/Q8/Q13/Q14 — Q1 medium PARTIAL D-list 不重组 visual + persist 自然分离 OK; Q7 low rgba 决策保留不补 oklch+alpha 备选; Q8 low D7+D4 协同已明确; Q13 + Q14 low advisory note). Plan v0.1 (initial draft) → **v0.1.1 (post-absorbtion lock; status proposed)**. No challenge rejected.

**Lock evidence**: this absorbtion table + each verdict cross-references the D-section / AC# / D8 接口冻结 prose / Consequences / Out-of-scope trailing note that codifies the change.

**Pre-A3 internal-consistency drift lesson applied**: Pre-A3 had 4 R-rounds due to stale prose. Pre-A4 mitigation strategy: (a) absorbtion edits 直接落 each D-section's natural location (避免 cross-section 引用维护); (b) 5 missing kind hue 单一 table 一处更新; (c) D8 NoteSaveAdapter interface block 整体替换 (避免 partial inconsistency). orchestrator-self pre-empt grep 验证 stale prose 减少前置.

## Compliance

- This ADR satisfies [Wave 5 plan v0.2 Pre-A4 acceptance](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) (ADR-0018 design lock + save-path 接口冻结 + plan-challenger 4-round + Q4+Q8 absorbtion 兑现 D10 修订)
- This ADR fulfills [ADR-0011 D1 stage 4 PRE-COMMIT CLAUDE REVIEW](ADR-0011-linear-pipeline-execution-model.md) trigger criteria: Row 4 (NEW ADR) HIT
- This ADR ratifies granularity doc v0.3.4 § "v2 视觉契约要素 (认证源 = v2-styles.css)" + § "v2 编辑器 UX 要素" body content (gatekeeper-side scratch at `/mnt/d/download/web/v2-design-granularity.md`, NOT in git per gatekeeper-side discipline; prose form per memory `feedback_lychee_user_local_paths`) NEW reframe v2 forward (granularity 原 Phase 2+ L1 visual scope → Wave 5 ADR-0018)
- This ADR consumes nothing from ADR-0016/0017 (independent visual + save-path scope); ADR-0017 D11 drop-pulse forward-pointer 消费此 ADR D1 `--accent-success` token (back-reference)
- This ADR does NOT amend [ADR-0014](ADR-0014-heavy-block-boundary.md); v0.4 amendment (plugin placeholder) + v0.5 amendment (grid context dimensions) 留 Stage C.1 / Stage C.2 实施 PR
- This ADR does NOT amend [ADR-0009](ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union; D3 顶 2px 横条 hue mapping 与 BlockKind union NOT 1-1 (component kind 可有可无横条)
- This ADR does NOT modify [ADR-0003 D6](ADR-0003-headless-presentational-split.md) design-tokens 内部 architecture; 仅 OKLCH switchover (D1) + NEW token additions (D3 8 kind hue + D1 `--accent-success` token row + D5 typography CSS variables); existing CONTRACT.md `## Public surface` 不动 (Stage C.3 实施 PR 时验证 light + dark 同步 invariant)
- **Pre-A4 D2 trigger 触发面 (per Wave 5 plan v0.2 D13 + Q4 absorbtion)**: 此 Pre-A4 ADR design-lock = D2 row 4 (NEW ADR) HIT. **若 surface 持久化路径变更或接口契约调整 (Q4 escalation)** = D2 row 1 (CONTRACT 影响) ALSO HIT → stage 4 强制. 本 Pre-A4 D8 锁 NoteSaveAdapter interface = NEW interface 但 NOT 修改既有 CONTRACT (`packages/editor-shell/CONTRACT.md` 既存 since Wave 3 Stage A; Stage C.4 实施 PR 同步/扩展 + W5-2 invariant 加 + NoteSaveAdapter public surface section); 故 Pre-A4 暂不触 row 1 (Stage C.4 实施 PR 时再触 row 1 + row 5 cross ≥3 packages: editor-shell + apps/site + mdx-bridge consumers)
- **Stage C.3 + Stage C.4 实施 PR D2 escalation explicit**: Stage C.3 design-tokens 实施 PR (OKLCH switchover) 必触 row 1 (design-tokens/CONTRACT.md 同步 token additions) + row 5 (cross design-tokens + apps/site + 5 light block packages + heavy-block-boundary); Stage C.4 NoteSaveAdapter 实施 PR 必触 row 1 (editor-shell/CONTRACT.md 同步/扩展 + W5-2 invariant + NoteSaveAdapter public surface) + row 5 (cross editor-shell + apps/site + mdx-bridge); orchestrator 在 Pre-A5 v1.0 lock 时 plan-challenger 验证 Stage C.3 / Stage C.4 PR 拆分粒度 + D2 trigger 准确性

- **Pre-A4 D2 trigger 门槛表 (per Q13 absorbtion — 减少 reviewer 复核歧义)**:

| 改动类型                                                                                                                                 | D2 row 触发                                                                                                                                                   | Stage                           |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| ADR-0018 NEW (this PR)                                                                                                                   | row 4 only                                                                                                                                                    | Pre-A4                          |
| ADR-0018 Amendment (v0.X.X)                                                                                                              | row 4 only                                                                                                                                                    | (任何 Wave 5+ amendment PR)     |
| design-tokens `tokens.css` token additions (14 OKLCH + 1 hex --surface + 3 layout + 3 shadow + 2 font + 8 kind hue + `--accent-success`) | row 1 (design-tokens/CONTRACT.md sync) + row 5 (≥3 packages affected)                                                                                         | Stage C.3                       |
| `tokens-fallback.css` build script + snapshot test                                                                                       | row 1 (design-tokens/CONTRACT.md `## Public surface` adds tokens-fallback.css)                                                                                | Stage C.3                       |
| Inter + JetBrains Mono Google Fonts preconnect + self-host fallback                                                                      | row 1 (apps/site/CONTRACT.md sync if added) + row 8 (CSP 改; security touch)                                                                                  | Stage C.3                       |
| 5 light block CSS calibration                                                                                                            | row 1 (各 block-\*/CONTRACT.md sync if needed) + row 5 (cross 5 block packages)                                                                               | Stage C.3 (ux-ui-lead subagent) |
| `@skb/editor-shell/src/save-adapter.ts` (NEW NoteSaveAdapter interface 落文件)                                                           | row 1 (editor-shell/CONTRACT.md 同步/扩展 + W5-2 invariant 加 + NoteSaveAdapter public surface section) + row 5 (cross editor-shell + apps/site + mdx-bridge) | Stage C.4                       |
| LocalStorageAdapter impl + apps/site `/notes/[slug]/edit` route                                                                          | row 1 (editor-shell/CONTRACT.md 同步) + row 5 (cross-package)                                                                                                 | Stage C.4                       |

- **Modal canvas (Phase 2+ ADR-0019+) token 继承约束 (per Q14 absorbtion)**: ADR-0018 不覆盖 modal canvas drag/drop UX (per ADR-0017 D6 lift 模式 在 inline grid; modal 内独立 surface). 但 modal 视觉必继承 `@skb/design-tokens` 既有 token (background `--bg` cream / shadow rgba(20,15,10) 暖色调 / font `--sans` Inter / radius / row-h / gap / accent / canvas / mark / `--accent-success`); Phase 2+ ADR-0019+ modal canvas ADR 不允许重复定义 visual constants. Modal 内部 UX (e.g., toolbar / inspector) 视觉 token 全 inherit; 仅 layout / interaction logic 在 Phase 2+ ADR scope.

## Related

- [Wave 5 plan v0.2](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — Pre-A4 scope source + ADR 编号映射表 D5 + D10 save-path 决策提前 per Q8
- [ADR-0017 drag/drop UX](ADR-0017-drag-drop-ux.md) — D11 drop-pulse 消费 `--accent-success` token (此 ADR D1 token NEW)
- [ADR-0016 grid 数据模型](ADR-0016-grid-data-model.md) — `--row-h` + `--gap` token authoritative source (此 ADR D1 + D6); MDX serialize ADR-0016 D7 与 NoteSaveAdapter D8 配套
- [ADR-0015 D6 Wave 5 plan-draft handoff](ADR-0015-wave-4-close.md) — Wave 5 deferred items binding (v2 视觉 + save-path forward to Wave 5)
- [ADR-0014 HeavyBlockBoundary](ADR-0014-heavy-block-boundary.md) — heavy block plugin placeholder 消费 design-tokens 顶 2px 横条 (D3); v0.4 + v0.5 amendments 留 Stage C.1 / Stage C.2
- [ADR-0011 D1 linear pipeline](ADR-0011-linear-pipeline-execution-model.md) — KEPT for Wave 5; D2 row 4 fires stage 4 here
- [ADR-0009 BlockKind 4-way union](ADR-0009-block-kind-union-expansion.md) — BlockKind 不动; D3 横条 hue 与 BlockKind 平行 (gridKind 同 ADR-0016 D10 平行)
- [ADR-0006 9-point asymmetry audit (v0.2)](ADR-0006-asymmetry-audit-checklist.md) — items #5 (algorithm + runtime constants 复刻; 14 OKLCH + 1 hex + 3 layout + 8 kind hue + 3 shadow + 2 font 必 single-source design-tokens) + #6 (sister CONTRACT.md sync; design-tokens CONTRACT.md Stage C.3 PR 同步; editor-shell CONTRACT.md 既存 Wave 3 Stage A; Stage C.4 PR 同步/扩展 + W5-2 invariant) + #8 (authority: ADR-0018 NEW; README ADR roster sync) + **#9 (UI-touch + E2E spec audit, v0.2 amendment)** — Stage C.4 实施 PR + Wave 6 Stage B 实施 PR (ui_touch=true paths) 必含非空 `e2e_smoke` field + Playwright spec 文件存在 + `pnpm --filter @skb/site test:visual` PASS (Wave 6 Stage B.2 carve-out: vitest 单测 sidecar roundtrip 替代 Playwright per Decision 5; full e2e 留 B.5)
- [ADR-0005 API conventions](ADR-0005-api-conventions.md) — Phase 2+ ApiAdapter 升级路径 consume (REST `/v1/notes/<slug>` per camelCase + RFC 7807)
- [ADR-0003 Headless / Presentational](ADR-0003-headless-presentational-split.md) — D6 design-tokens authority + tokens-dark.css forward-compat
- [ADR-0001 Stack selection](ADR-0001-stack-selection.md) — historical Astro static-build authority; **superseded for Wave 6 Stage B by the v0.6 amendment above** (D9-D14): Astro 5.18 supports mixed prerendered + server-only routes via `output: 'static'` + per-route `prerender = false` + Node adapter, so path-(b) endpoint at `apps/site/src/pages/api/notes/[...slug].ts` is now ratified. ADR-0001 amendment to follow if/when needed.
- [Wave 5 Pre-A3 PR.md](../plans/wave-5-main/Pre-A3-adr-0017-drag-drop-ux.md) — most recent ADR design-lock precedent (13/13 plan-challenger absorbed; 4 R-rounds — internal-consistency drift lesson)
- [design-tokens CONTRACT.md](../../packages/design-tokens/CONTRACT.md) — existing public surface; Stage C.3 实施 PR 同步 OKLCH switchover + 8 kind hue + `--accent-success` 新增
- granularity doc v0.3.4 (`/mnt/d/download/web/v2-design-granularity.md`) — gatekeeper-side scratch; § "v2 视觉契约要素 (认证源 = v2-styles.css)" + § "v2 编辑器 UX 要素" body 是此 ADR D1-D7 source intent (per Wave 5 plan v0.2 D5 ADR 编号映射表 NEW reframe v2 forward; granularity 原 Phase 2+ L1 visual scope)
- v2-styles.css (`/mnt/d/download/web/v2-styles.css` 25 KB; 全文 token + prose customization + typography + shadow authority) — v2 视觉 token 认证源 + Stage C.3 实施 PR byte-equivalence baseline
- [Wave 6 cf-23 PR.md](../plans/wave-6-main/wave-6-cf-23-read-mode-unification.md) — implements v0.7 D9 (BaseLayout `wide` opt-in + 4-viewport width-parity lock + D8 zero-affordance lock + typography-token verification)
- [Wave 6 cf-24 PR.md](../plans/wave-6-main/wave-6-cf-24-component-library-sidebar.md) — implements v0.8 D10 (BaseLayout `palette` opt-in + PaletteSidebar React portal mount + 3-band width-parity amendment + ADR-0017 v0.4 D14 external-source drag protocol)

## v0.8 Amendment (Wave 6 cf-24 — edit-route palette-rail visual contract)

| 字段 | 值 |
| ---- | --- |
| 日期 | 2026-05-10 |
| 触发 | cf-23 D9 §"范围边界" forward-pointer "v2-style left-rail palette + top-bar editor chrome：cf-24+ 范围" + user directive "把侧边 Component library sidebar 补全，全部按照 web 文件夹里的风格来" |
| 关系 | 扩展 v0.7 D9 (BaseLayout `palette?` 参数 mirrors `wide?` opt-in pattern); cross-ref ADR-0017 v0.4 D14 (external-source drag protocol — per-block path UNCHANGED byte-for-byte) |

### v0.8 D10 — Edit-route palette-rail visual contract (BaseLayout `palette` opt-in + PaletteSidebar React portal + 3-band width-parity)

#### Decision summary

cf-24 ships the v2-style persistent left-rail PaletteSidebar on the edit route only. Five sub-decisions ratified at PR PLAN lock + EXECUTE TDD-write phase:

#### D10.a — `--palette-w: 230px` design token

NEW token in `packages/design-tokens/src/tokens.css` `:root`. Mirrors v2-styles.css:42 `.palette { width: 230px }`. Light-only (Wave 5 layout-token exception per ADR-0018 D1 carve-out; no `tokens-dark.css` mirror needed).

Consumed by `apps/site/src/styles/global.css` `.palette-rail { width: var(--palette-w) }` + Playwright width-parity spec band-2 numeric formula (`edit.main = read.main - 230`).

#### D10.b — PaletteSidebar visual identity (consumes existing v0.5 D3 hue tokens)

`.pal-item` per-kind hue assignment via `.k-${kind}` className modifiers consuming the existing `--accent-canvas` / `--accent-runnable` / `--accent-image` family (ADR-0018 v0.5 D3). NO new hue tokens — re-uses the v2 4-color hue palette already in design-tokens.

Glyph + description per BLOCK_KIND_OPTIONS (cf-24 D4 8-item parity). The PR.md table is the authoritative glyph mapping; the implementation in `packages/editor-shell/src/palette-sidebar.tsx` PALETTE_SIDEBAR_ITEMS array exhaustive-switches over BlockAffordanceKind so a future kind addition surfaces a TypeScript error if not mapped.

#### D10.c — cf-23 D9-D10 width-parity 3-band resolution (Option A flex-sibling layout)

cf-23 D10 asserted `read.main.width === edit.main.width ±2px` at 4 viewports. cf-24 BREAKS strict parity at viewports where the rail is visible. Resolution per Option A flex-sibling layout (PR.md cf-24 D9):

- **Band 1** (viewport ≥ 1410): rail (230) + 1180-cap both fit; main saturates at 1180; STRICT parity preserved at 1180.
- **Band 2** (1024 ≤ viewport < 1410): rail visible; edit main shrinks to ~viewport - 230 - margins. Read keeps full doc-wrap (no rail). EMPIRICAL targets locked at TDD-write per cf-23 D10 precedent.
- **Band 3** (viewport < 1024): rail HIDDEN via `@media (max-width: 768px)`; cf-23 strict parity restored.

Conceptual reframe: parity is for DOC-CONTENT widths at viewports where rail fits. At narrower viewports (Band 2), edit gets less doc-wrap because the rail is a first-class affordance; read keeps the wider doc because there is no rail to consume viewport. This is intentional UX trade-off (editor user trades doc-wrap width for always-visible insert affordances).

cf-24 amends `apps/site/playwright/notes-route-width-parity.spec.ts` with band-aware assertions (mode = 'strict' | 'band2-rail-shrunk') + `aside.palette-rail` display:none assertion at Band 3 viewports + an OPTIONAL Band 1 row at 1440 viewport demonstrating cap-saturation parity-restored behavior.

#### D10.d — Mobile collapse @ 768px (display:none rail)

`apps/site/src/styles/global.css` `@media (max-width: 768px) { .palette-rail { display: none; } }`. Consistent with cf-20b grid responsive 6→1 col flatten — at 768 the editor is single-column, so a 230px rail eats >60% horizontal real-estate for an unusable-at-1-col gesture. Mobile insertion UX falls back to the PaletteModal Cmd+K command bar (load-bearing per D10.e below). Future cf-25+ MAY add a hamburger drawer if user demand emerges.

#### D10.e — PaletteSidebar + PaletteModal coexist PERMANENTLY (NOT a deprecation chain)

cf-24 atomically renames the existing `Palette` component (Cmd+K modal overlay) to `PaletteModal`; both `PaletteSidebar` (NEW) and `PaletteModal` (renamed) are first-class permanent exports. NO deprecation alias — both surfaces are load-bearing:
- `PaletteSidebar` = mouse-first discoverability + always-visible categorization. Hidden at < 768px viewports per D10.d.
- `PaletteModal` = power-user keyboard-first (Cmd+K) at-cursor insertion. The ONLY palette surface at < 768px viewports.

Pattern precedent: VSCode (Cmd+P command palette + activity bar), Notion (Cmd+/ block menu + sidebar block library). Two surfaces serve different user journeys — neither is a transitional state.

#### Implementation overview

- `packages/editor-shell/src/palette-sidebar.tsx` — NEW (340 LOC; React component rendering the rail). Drag protocol via `writeBlockKindToDataTransfer`; click-to-insert via `appendBlockKind` (cf-24 R1 F5 fix; lands at end-of-doc regardless of selection). Glyph mapping per D10.b table.
- `packages/editor-shell/src/palette-modal.tsx` — RENAMED from `palette.tsx`. Symbol `Palette` → `PaletteModal` atomically.
- `apps/site/src/layouts/BaseLayout.astro` — adds `palette?: boolean` opt-in + 2-column flex shell when truthy; renders empty `<aside id="palette-rail">` slot.
- `apps/site/src/components/EditorShellMountInner.tsx` — portal-mounts `PaletteSidebar` into the slot via `createPortal`; graceful degradation per cf-24 D11 (slot absent → no-op; editor null → no-op).
- `apps/site/src/styles/global.css` — `.layout-with-palette` flex shell + `.palette-rail` 230px width + 768px hide media query.
- `apps/site/src/pages/notes/[...slug]/edit.astro` — passes `palette` to BaseLayout. Read route `notes/[...slug].astro` does NOT pass it (cf-23 D8 zero-affordance contract preserved).

#### Sister-doc updates (per ADR-0006 #6)

- `packages/editor-shell/CONTRACT.md`: NEW Public surface entries for `PaletteSidebar`, `PaletteModal` (rename), `EXTERNAL_DROP_*` constants, `writeBlockKindToDataTransfer`, `readBlockKindFromDataTransfer`, `isExternalDragSource`, `formatExternalDrag*` formatters.
- `apps/site/CONTRACT.md`: Layout shell section adds `palette?: boolean` prop + cross-ref ADR-0018 v0.8 D10 + the 4-band rail-visibility table.
- `packages/design-tokens/CONTRACT.md`: token catalog gains `--palette-w: 230px`.
- `apps/site/playwright/notes-route-width-parity.spec.ts`: amended for cf-24 D9 3-band model.
- ADR-0017 v0.4 D14: external-source drag protocol cross-reference (the DnD plumbing that backs the visual contract here).
