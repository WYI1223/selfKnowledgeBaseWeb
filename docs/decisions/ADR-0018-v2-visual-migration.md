# ADR-0018: v2 视觉 migration — design-tokens OKLCH + Inter/JetBrains Mono + 顶 2px 横条 + prose customization + save-path 接口冻结

| 字段 | 值 |
| ---- | --- |
| 状态 | proposed (v0.1.1 post 14-Q plan-challenger absorbtion 2026-05-04: 9 ABSORBED + 5 PARTIALLY ABSORBED) |
| 日期 | 2026-05-04 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | [Wave 5 plan v0.2 D1+D5+D10](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) (Pre-A4 ADR-0018 v2 视觉 migration design lock + save-path 接口冻结 per Q4+Q8 absorbtion) + reframe v2 memory `project_wave4_reframe_v2.md` + granularity doc v0.3.4 § "v2 视觉契约要素 (认证源 = v2-styles.css, 所有 token 不变)" + § "v2 编辑器 UX 要素 (视觉细节)" body (NEW reframe v2 forward; granularity 原 Phase 2+ L1 visual scope) |
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

| token | OKLCH | 用途 |
|---|---|---|
| `--bg` | `oklch(99% 0.005 80)` | 页面底色 (暖白 cream) |
| `--panel` | `oklch(98% 0.004 80)` | 侧 rail / topbar / panel 底 |
| `--surface` | `#ffffff` (唯一非 OKLCH; 块内容白底; 高对比保留) | block 内容白底 |
| `--border` | `oklch(92% 0.005 80)` | 默认边 |
| `--border-strong` | `oklch(86% 0.006 80)` | hover / 强调边 |
| `--text` | `oklch(22% 0.01 80)` | 主文本 (近黑暖调) |
| `--text-2` | `oklch(45% 0.01 80)` | 次要文本 |
| `--text-3` | `oklch(62% 0.01 80)` | 辅助文本 / metadata |
| `--accent` | `oklch(58% 0.16 35)` | 选中 / drag / focus / 警示 (橙红 hue 35°) |
| `--accent-soft` | `oklch(96% 0.04 35)` | accent 浅底 (drop preview / hover) |
| `--accent-success` | `oklch(70% 0.12 145)` | **NEW per ADR-0017 D11 forward-pointer**: drop-pulse / save-success / commit-pulse general (绿 hue 145°) |
| `--canvas` | `oklch(60% 0.13 215)` | canvas block 类色 (蓝 hue 215°) |
| `--canvas-soft` | `oklch(97% 0.025 215)` | canvas 浅底 |
| `--grid-line` | `oklch(90% 0.005 80)` | drag overlay 网格线 |
| `--grid-line-strong` | `oklch(82% 0.005 80)` | snap 高亮线 |
| `--row-h` | `48px` (per ADR-0016 D4 height 公式 base) | grid base row |
| `--gap` | `14px` (per ADR-0016 W5-1 + ADR-0017 EDGE_W=2*GAP 数学对应) | grid gap |
| `--radius` | `6px` | block / button radius |

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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
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

| kind | hue | OKLCH (full) | OKLCH (soft for kind-soft bg) | v2 demo 出现 |
|---|---|---|---|---|
| canvas | 215° | `--canvas` (full) | `--canvas-soft` | ✅ |
| runnable | 145° | `oklch(50% 0.12 145)` | `oklch(95% 0.04 145)` | ✅ |
| image | 60° | `oklch(60% 0.10 60)` | `oklch(95% 0.025 60)` | ✅ |
| markdown (kind='prose') | — | 默认无横条 (white surface 直接显示) | — | ✅ |
| math | 280° | `oklch(50% 0.16 280)` | `oklch(95% 0.04 280)` | ❌ Wave 5 lock |
| pdf | 0° | `oklch(55% 0.16 0)` | `oklch(95% 0.04 0)` | ❌ Wave 5 lock |
| jupyter | 90° | `oklch(65% 0.14 90)` | `oklch(95% 0.04 90)` | ❌ Wave 5 lock |
| nn-viz | 325° | `oklch(50% 0.18 325)` | `oklch(95% 0.05 325)` | ❌ Wave 5 lock |
| agent-flow | 180° | `oklch(55% 0.13 180)` | `oklch(95% 0.04 180)` | ❌ Wave 5 lock |

**5 missing kind hue lock (per Pre-A4 plan-challenger Q3 absorbtion)**: math / pdf / jupyter / nn-viz / agent-flow 5 个 block kind 在 Wave 4 ADR-0014 已 ratified, 但顶 2px 横条 hue 未在视觉契约定义. ADR-0018 D3 在 Pre-A4 plan-challenger round 锁定 + 修订:

**Hue 选择原则** (per Q3 absorbtion — relax 60° pairwise rule; 8 hue tokens on 360° circle 数学不可达 60° pairwise):

1. **目标**: 8 hues (3 既有 + 5 missing; markdown 默认无横条 不参与 hue 锁定) 在 360° 上分布 + a11y 对比度 OK + kind 语义关联
2. **Pairwise 角距阈值**: ≥ **30°** (relax from 60°; 360/9=40 average); 同时使用 lightness/chroma 差异 supplement (e.g., math/pdf 同 hue band 但 lightness 不同)
3. **a11y 对比度**: 顶 2px 横条对 `--bg` cream `oklch(99% 0.005 80)` 背景对比度 ≥ 3:1 (WCAG AA non-text 大字号准则). **NOT 要求** 对 `--text` 对比度 (顶 2px 横条 NOT 用于显示文字; 仅视觉 kind 识别 decoration; "text on top 横条 上写小字" 场景在 ADR-0018 视觉契约中不存在)
4. **Validation 算法** (Stage C.3 实施前必跑): pairwise hue diff ≥ 30° (relax from 60° per Q3) + WCAG contrast ratio ≥ 3:1 only against `--bg` (NOT against `--text`; 横条不承载文字); 失败则重新 pick

**5 missing kind hue 锁定值** (post Q3 validation):

| kind | hue (°) | lightness | chroma | OKLCH | rationale |
|---|---|---|---|---|---|
| math | 280 | 50% | 0.16 | `oklch(50% 0.16 280)` | 紫; 与 215° canvas 角距 65°; 与 35° accent 角距 105° (mod 360); 数学符号联想 |
| pdf | 0 | 55% | 0.16 | `oklch(55% 0.16 0)` | 纯红; 与 35° accent 角距 35° (relax 30°+ OK); lightness 55% 与 accent 58% 差 → 视觉区分 |
| jupyter | 90 | 65% | 0.14 | `oklch(65% 0.14 90)` | 黄; 与 60° image 角距 30° + chroma 0.14 (vs image 0.10) 区分; 与 145° runnable 角距 55° |
| nn-viz | 325 | 50% | 0.18 | `oklch(50% 0.18 325)` | 品红; 与 280° math 角距 45°; 与 35° accent 角距 70° (mod 360); 神经网络可视化联想 |
| agent-flow | 180 | 55% | 0.13 | `oklch(55% 0.13 180)` | 青绿; 与 145° runnable 角距 35°; 与 215° canvas 角距 35°; lightness/chroma 区分 |

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
  background: oklch(98% 0.012 35 / 0.6);  /* accent-soft alpha */
  font-style: italic;
  color: var(--text-2);
  padding: 8px 12px;
  margin: 4px 0;
}

.b-callout {
  background: oklch(97% 0.018 90);   /* warm yellow soft */
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
.b-code .kw { color: oklch(45% 0.18 280); }   /* keyword 紫 280° */
.b-code .fn { color: oklch(45% 0.13 215); }   /* function 蓝 215° */
.b-code .cm { color: oklch(45% 0.10 145); font-style: italic; }   /* comment 绿 145° */

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
.aref::before { content: '↗'; margin-right: 2px; }

mark { background: oklch(94% 0.08 90); color: inherit; }   /* inline mark 黄底高亮 */
code:not(pre code) {  /* inline code; per Tailwind preset prose */
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

| element | size / line-height / weight / tracking |
|---|---|
| body | 15px / 1.55 / 400 / 0 |
| H1 | 28px / 1.15 / 700 / -0.018em |
| H2 | 20px / 1.25 / 650 / -0.01em |
| H3 | 16px / 1.3 / 600 / 0 |
| b-p (body 段落) | 14.5px / 1.62 / 400 / 0 |
| b-quote | 14.5px / 1.62 / 400 italic / 0 |
| b-code | 12.5px / 1.5 / 400 / 0 (mono) |
| inline code | 0.9em (relative; mono) |

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

body { font-size: var(--font-size-body); line-height: var(--line-height-body); }
h1 { font-size: var(--font-size-h1); line-height: var(--line-height-h1); font-weight: var(--font-weight-h1); letter-spacing: var(--letter-spacing-h1); }
/* ... similarly for h2, h3, b-p, b-code */
```

`@skb/design-tokens` Tailwind preset 同步导出 `theme.fontSize` / `theme.fontWeight` / `theme.lineHeight` / `theme.letterSpacing` (per design-tokens CONTRACT.md `Tailwind preset is the single source of truth` invariant). consumer 通过 Tailwind class (e.g., `text-body` / `font-h1` / `tracking-h2`) OR CSS var (`var(--font-size-body)`) 消费; 不允许硬编码 px values.

ADR-0003 D6 single-source 精神兑现.

### D6 — Shadow 暖色调 `rgba(20,15,10, alpha)` (vs 中性 `rgba(0,0,0)`)

```css
:root {
  --shadow-sm: 0 1px 2px rgba(20,15,10, 0.05), 0 1px 1px rgba(20,15,10, 0.04);
  --shadow-md: 0 4px 12px rgba(20,15,10, 0.08), 0 2px 4px rgba(20,15,10, 0.05);
  --shadow-lg: 0 12px 32px rgba(20,15,10, 0.16), 0 6px 12px rgba(20,15,10, 0.10);
}
```

理由 (per granularity v0.3.4 v2 视觉契约要素 § Spacing/radius/shadow): 暖色调 `rgba(20,15,10, ...)` 与 cream `oklch(99% 0.005 80)` + 橙红 accent + Inter 字体调和; 中性 `rgba(0,0,0)` shadow 视觉冷; 与 v2 整体调子不符. 单一 token 切到暖色调 = 全 apps/site + block-* shadow 自动跟.

### D7 — 8 light block CSS calibration (OKLCH switchover collateral)

5 light blocks (kind ∈ {component, render}): callout / code / image / math / pdf
+ 3 markdown 派生 prose elements (kind='prose'; granularity v0.3.4 § "v2 编辑器 UX 要素"): headings (H1-H3) / lists / inline elements (em / strong / link / mark / code).

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

| 路径 | 复杂度 | 跨设备同步 | Wave 5 适用 | Phase 2+ 适用 |
|---|---|---|---|---|
| (a) `apps/api` REST endpoint (POST `/v1/notes/<slug>`) | 高 (server runtime + auth + DB) | ✅ | ❌ (复杂度过高) | ✅ (升级路径) |
| (b) Astro endpoint (server-side; Astro v4 `endpoint` feature) | 中 (server-mode 配置 + Astro 与 static build 不兼容) | 部分 (需要 server runtime) | ❌ (NOT 选; 与 Astro static incompat) | 不选 |
| (c) localStorage prototype (browser localStorage; per `feedback_lychee_user_local_paths` 风格 single-device persist) | 低 (client-side 简单 K-V) | ❌ | ✅ **Wave 5 MVP 选** | ❌ (Phase 2+ apps/api 替换) |

**Wave 5 MVP 锁**: localStorage prototype (路径 c). 单设备 + 简单 + Phase 1 完成路径; 跨设备同步 + collaborative editing 留 Phase 2+ apps/api endpoint 升级.

#### NoteSaveAdapter TypeScript interface (Stage C.4 实施 + Phase 2+ 升级 共享)

**Adapter 落点 (per Q9 absorbtion — 锁单一落点)**: NoteSaveAdapter 接口 + LocalStorageAdapter impl 落 `@skb/editor-shell/src/save-adapter.ts` (NEW; Stage C.4 实施 PR scope; 唯一对外契约位置). `@skb/mdx-bridge` 仅做 MDX serialize/parse 映射 per ADR-0016 D7, NOT 暴露 NoteSaveAdapter. Stage C.4 实施 PR 不允许双签名; ADR-0018 lock NoteSaveAdapter at editor-shell.

**接口定义 (per Q10 absorbtion — tiptapState 改 ReadonlyJSONValue + version readonly + 注释 cache-only)**:

```typescript
// @skb/editor-shell/src/save-adapter.ts (NEW; Stage C.4 实施 PR scope)

/** Read-only JSON-serializable value (recursive). 用于 tiptapState 缓存仅; NOT 持久化 schema. */
export type ReadonlyJSONValue =
  | string | number | boolean | null
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
        return null;  // user 看到 empty editor; explicit "save disabled" UI 由 editor-shell 控制
      }
      throw e;
    }
  }

  async save(state: NoteState): Promise<{ ok: boolean; error?: string }> {
    const serialized = JSON.stringify(state);
    if (serialized.length > LocalStorageAdapter.PER_NOTE_MAX_BYTES) {
      return { ok: false, error: `note exceeds 2MB limit (${serialized.length} bytes); split into smaller notes` };
    }
    try {
      localStorage.setItem(`skb-note:${this.slug}`, serialized);
      // Aggregate size warning (best-effort; iterate localStorage keys)
      const aggregateBytes = Object.keys(localStorage)
        .filter(k => k.startsWith('skb-note:'))
        .reduce((sum, k) => sum + (localStorage.getItem(k)?.length ?? 0), 0);
      if (aggregateBytes > LocalStorageAdapter.AGGREGATE_WARN_BYTES) {
        console.warn(`[NoteSaveAdapter] aggregate notes ${aggregateBytes} bytes > 5MB; consider Phase 2+ apps/api`);
      }
      return { ok: true };
    } catch (e) {
      // QuotaExceededError (localStorage 满)
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        return { ok: false, error: 'localStorage quota exceeded; delete old notes or upgrade to apps/api' };
      }
      // SecurityError
      if (e instanceof DOMException && e.name === 'SecurityError') {
        return { ok: false, error: 'localStorage disabled (private mode / sandbox); save disabled' };
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
- `--row-h: 48px` + `--gap: 14px` 在 design-tokens 而 NOT editor-shell internal = design-tokens 是 single-source per ADR-0003 D6 + ADR-0016 W5-1 + ADR-0017 EDGE_W=2*GAP 数学对应 全 derive 的 root authority
- localStorage `skb-note:<slug>` key 与 `skb-theme` 不冲突 (前缀显式); design-tokens `STORAGE_KEY = 'skb-theme'` 不动
- Astro endpoint (路径 b) 不选 = 与 Astro static build 不兼容; Wave 5 + Phase 2+ 都 不 启用 server-mode (per ADR-0001 stack selection Astro static 决策); Phase 2+ apps/api endpoint 走 separate server (not Astro endpoint)

## Plan-challenger codex absorbtion (locked at lock-time)

per [ADR-0007 D5](ADR-0007-job-function-codex-heavy-execution.md) + [ADR-0011 D2](ADR-0011-linear-pipeline-execution-model.md) v0.1.1 SOTed-PR.md amendment + memory `feedback_soted_pr_md_discipline.md` + ADR-0013 D4 R13 + Wave 5 Pre-A2 12/12 / Pre-A3 13/13 absorbed precedent.

dispatch: `codex exec --yolo --profile plan-challenger ...` (Pre-A4 ADR-0018 design-lock 4-round style); audit log path: `/tmp/codex-runs/2026-05-04-Pre-A4-plan-challenge.txt` raw + `docs/audits/codex-runs/2026-05-04-Pre-A4-plan-challenge.txt` curated archive.

| # | Challenge | Severity | Verdict | Reason / Locked at |
|---|---|---|---|---|
| Q1 | D-list 拆分 D1+D2+D6 是否合并 visual-tokens 单 D-section + D8 与 D1-D7 在同 ADR 是否合理 | medium | **PARTIALLY ABSORBED** | D1-D8 保持独立 (各自可追踪可 ratify); D8 自然形成 "Persist Contract" 独立子段 (`#### Save-path 决策` + `#### NoteSaveAdapter TypeScript interface` + `#### Storage key + version field semantics` + `#### Pre-A4 vs Stage C.4 boundary`) — 视觉与持久化在 D2 审核时分离. Locked at D8 子段结构. |
| Q2 | OKLCH fallback hex 值 ADR 锁 vs Stage C.3 锁 | high | **ABSORBED** | D1 末尾加 "OKLCH browser fallback" 段; 锁 转换公式 (Culori library `oklchToHex(L,C,H)`) + 生成规则 (build script `pnpm generate:tokens-fallback` 自动 derive `tokens-fallback.css`) + 可执行快照 (snapshot test); Stage C.3 仅按规则 derive 不再解释. Locked at D1 OKLCH browser fallback paragraph. |
| Q3 | 5 missing kind hue 候选不满足 60° 角距 + a11y 对比度 | high | **ABSORBED** | D3 加 "Hue 选择原则" + relax 60° → 30° + lightness/chroma supplement + WCAG 3:1 contrast + Validation 算法; 5 kind hue 重新 lock: math 280° / pdf 0° / jupyter 90° / nn-viz 325° / agent-flow 180° (lightness/chroma 各异). markdown 默认无横条 + 'Phase 2+ alternate 标识' note. Locked at D3 Hue 选择原则段 + 5 kind 表格. |
| Q4 | Google Fonts CDN 隐私/CSP/self-host fallback + 字体加载失败 | medium | **ABSORBED** | D2 末尾加 "Privacy / self-host fallback" 段; Google Fonts privacy disclosure + self-host fallback path (apps/site `public/fonts/` woff2 + CSP `font-src` + 5s timeout fall back to system fonts); useAutoRowSpan timeout 强制重测 path. Locked at D2 Privacy 段. |
| Q5 | b-* selector 命名冲突 (callout vs b-callout) + aref 通用 `<a>` 污染 | medium | **ABSORBED** | D4 末尾加 "`.skb-prose` namespace 隔离" 段; `b-*` 仅 `.skb-prose` 内; `.aref` 限定 prose namespace + 显式 class (NOT 自动); ESLint rule `no-bare-aref-class` 防误用. Locked at D4 namespace 段. |
| Q6 | Typography 硬编码 vs CSS variables (single-source 违背) | medium | **ABSORBED** | D5 末尾加 "Typography 转 CSS variables" 段; design-tokens 暴露 `--font-size-*` / `--font-weight-*` / `--line-height-*` / `--letter-spacing-*` token + Tailwind preset theme.fontSize 同步. Locked at D5 CSS variables 段. |
| Q7 | shadow rgba(20,15,10) vs oklch+alpha 决策解释 | low | **PARTIALLY ABSORBED** | D6 决策保留 (rgba 暖色调与 cream 调和); 不补 oklch+alpha 备选注释 (可在 Stage C.3 实施 PR 加注释; ADR 不必). Locked at D6 trailing prose (rationale 已 implicit). |
| Q8 | 8 light block CSS calibration scope (5+3 vs 5 only) | low | **PARTIALLY ABSORBED** | D7 已明确 5 light + 3 markdown 派生 prose; D7 与 D4 协同 (D7 视觉 CSS + D4 prose customization). 不必修改; reviewer 通过 cross-reference 理解. Locked at D7 prose. |
| Q9 | NoteSaveAdapter 落点 editor-shell vs mdx-bridge | medium | **ABSORBED** | D8 NoteSaveAdapter 段 锁 `@skb/editor-shell/src/save-adapter.ts` 唯一落点; mdx-bridge 仅做序列化映射 (per ADR-0016 D7); Stage C.4 实施 PR 不允许双签名. Locked at D8 NoteSaveAdapter Adapter 落点 段. |
| Q10 | tiptapState unknown vs 明确 schema + version readonly 约束 | medium | **ABSORBED** | D8 NoteState 改 `tiptapState?: ReadonlyJSONValue` (cache-only 注释); `version` readonly + 注释 consumer 必 increment before each save() call (Wave 5 MVP consumer-driven; LocalStorageAdapter NOT auto-increment; Phase 2+ ApiAdapter server-validate). Phase 2+ apps/api 乐观锁 conflict detect 路径预留. Locked at D8 NoteState shape. |
| Q11 | localStorage 5MB cap + Quota/SecurityError silent data-loss | high | **ABSORBED** | D8 LocalStorageAdapter 加 PER_NOTE_MAX_BYTES (2MB) + AGGREGATE_WARN_BYTES (5MB) + load/save Quota/SecurityError 处理 + console.warn + save-disabled UI fallback (editor-shell 控制). Locked at D8 LocalStorageAdapter impl. |
| Q12 | NoteSaveAdapter Phase 2+ 扩展 (AbortSignal/timeout/progress) 未预留 | medium | **ABSORBED** | D8 NoteSaveAdapter interface 注释 加 Phase 2+ 扩展位 (AbortSignal/timeout/onProgress + subscribe callback for collaborative); v1 接口冻结不动; v2 接口 ADR-0019+ amendment 引入. Locked at D8 interface Phase 2+ 扩展 段. |
| Q13 | D2 trigger 门槛表 reduce 复核歧义 | low | **PARTIALLY ABSORBED** | Compliance 末尾加 "Pre-A4 D2 trigger 门槛表" — `NoteSaveAdapter 接口落文件 → 直接 row1` + "design-tokens token additions → row1 + row5" 等显式. 不必修改 D2 trigger judgment section 本身. Locked at Compliance trailing 门槛表 note. |
| Q14 | Modal canvas (Phase 2+ ADR-0019+) token 继承 explicit | low | **PARTIALLY ABSORBED** | Out-of-scope section 末尾加 modal canvas constraint: "Phase 2+ ADR-0019+ modal canvas 必继承 design-tokens (background/shadow/font); 不重复定义新 visual constants". Locked at Out-of-scope trailing note. |

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

| 改动类型 | D2 row 触发 | Stage |
|---|---|---|
| ADR-0018 NEW (this PR) | row 4 only | Pre-A4 |
| ADR-0018 Amendment (v0.X.X) | row 4 only | (任何 Wave 5+ amendment PR) |
| design-tokens `tokens.css` token additions (14 OKLCH + 1 hex --surface + 3 layout + 3 shadow + 2 font + 8 kind hue + `--accent-success`) | row 1 (design-tokens/CONTRACT.md sync) + row 5 (≥3 packages affected) | Stage C.3 |
| `tokens-fallback.css` build script + snapshot test | row 1 (design-tokens/CONTRACT.md `## Public surface` adds tokens-fallback.css) | Stage C.3 |
| Inter + JetBrains Mono Google Fonts preconnect + self-host fallback | row 1 (apps/site/CONTRACT.md sync if added) + row 8 (CSP 改; security touch) | Stage C.3 |
| 5 light block CSS calibration | row 1 (各 block-*/CONTRACT.md sync if needed) + row 5 (cross 5 block packages) | Stage C.3 (ux-ui-lead subagent) |
| `@skb/editor-shell/src/save-adapter.ts` (NEW NoteSaveAdapter interface 落文件) | row 1 (editor-shell/CONTRACT.md 同步/扩展 + W5-2 invariant 加 + NoteSaveAdapter public surface section) + row 5 (cross editor-shell + apps/site + mdx-bridge) | Stage C.4 |
| LocalStorageAdapter impl + apps/site `/notes/[slug]/edit` route | row 1 (editor-shell/CONTRACT.md 同步) + row 5 (cross-package) | Stage C.4 |

- **Modal canvas (Phase 2+ ADR-0019+) token 继承约束 (per Q14 absorbtion)**: ADR-0018 不覆盖 modal canvas drag/drop UX (per ADR-0017 D6 lift 模式 在 inline grid; modal 内独立 surface). 但 modal 视觉必继承 `@skb/design-tokens` 既有 token (background `--bg` cream / shadow rgba(20,15,10) 暖色调 / font `--sans` Inter / radius / row-h / gap / accent / canvas / mark / `--accent-success`); Phase 2+ ADR-0019+ modal canvas ADR 不允许重复定义 visual constants. Modal 内部 UX (e.g., toolbar / inspector) 视觉 token 全 inherit; 仅 layout / interaction logic 在 Phase 2+ ADR scope.

## Related

- [Wave 5 plan v0.2](../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — Pre-A4 scope source + ADR 编号映射表 D5 + D10 save-path 决策提前 per Q8
- [ADR-0017 drag/drop UX](ADR-0017-drag-drop-ux.md) — D11 drop-pulse 消费 `--accent-success` token (此 ADR D1 token NEW)
- [ADR-0016 grid 数据模型](ADR-0016-grid-data-model.md) — `--row-h` + `--gap` token authoritative source (此 ADR D1 + D6); MDX serialize ADR-0016 D7 与 NoteSaveAdapter D8 配套
- [ADR-0015 D6 Wave 5 plan-draft handoff](ADR-0015-wave-4-close.md) — Wave 5 deferred items binding (v2 视觉 + save-path forward to Wave 5)
- [ADR-0014 HeavyBlockBoundary](ADR-0014-heavy-block-boundary.md) — heavy block plugin placeholder 消费 design-tokens 顶 2px 横条 (D3); v0.4 + v0.5 amendments 留 Stage C.1 / Stage C.2
- [ADR-0011 D1 linear pipeline](ADR-0011-linear-pipeline-execution-model.md) — KEPT for Wave 5; D2 row 4 fires stage 4 here
- [ADR-0009 BlockKind 4-way union](ADR-0009-block-kind-union-expansion.md) — BlockKind 不动; D3 横条 hue 与 BlockKind 平行 (gridKind 同 ADR-0016 D10 平行)
- [ADR-0006 8-point asymmetry audit](ADR-0006-asymmetry-audit-checklist.md) — items #5 (algorithm + runtime constants 复刻; 14 OKLCH + 1 hex + 3 layout + 8 kind hue + 3 shadow + 2 font 必 single-source design-tokens) + #6 (sister CONTRACT.md sync; design-tokens CONTRACT.md Stage C.3 PR 同步; editor-shell CONTRACT.md 既存 Wave 3 Stage A; Stage C.4 PR 同步/扩展 + W5-2 invariant) + #8 (authority: ADR-0018 NEW; README ADR roster sync)
- [ADR-0005 API conventions](ADR-0005-api-conventions.md) — Phase 2+ ApiAdapter 升级路径 consume (REST `/v1/notes/<slug>` per camelCase + RFC 7807)
- [ADR-0003 Headless / Presentational](ADR-0003-headless-presentational-split.md) — D6 design-tokens authority + tokens-dark.css forward-compat
- [ADR-0001 Stack selection](ADR-0001-stack-selection.md) — Astro static build 决策; Astro endpoint (D8 路径 b) 不选 cross-reference
- [Wave 5 Pre-A3 PR.md](../plans/wave-5-main/Pre-A3-adr-0017-drag-drop-ux.md) — most recent ADR design-lock precedent (13/13 plan-challenger absorbed; 4 R-rounds — internal-consistency drift lesson)
- [design-tokens CONTRACT.md](../../packages/design-tokens/CONTRACT.md) — existing public surface; Stage C.3 实施 PR 同步 OKLCH switchover + 8 kind hue + `--accent-success` 新增
- granularity doc v0.3.4 (`/mnt/d/download/web/v2-design-granularity.md`) — gatekeeper-side scratch; § "v2 视觉契约要素 (认证源 = v2-styles.css)" + § "v2 编辑器 UX 要素" body 是此 ADR D1-D7 source intent (per Wave 5 plan v0.2 D5 ADR 编号映射表 NEW reframe v2 forward; granularity 原 Phase 2+ L1 visual scope)
- v2-styles.css (`/mnt/d/download/web/v2-styles.css` 25 KB; 全文 token + prose customization + typography + shadow authority) — v2 视觉 token 认证源 + Stage C.3 实施 PR byte-equivalence baseline
