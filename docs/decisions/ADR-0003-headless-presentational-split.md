# ADR-0003: Headless / Presentational 分层 + 设计 token 独立 + 开源就绪

| 字段 | 值 |
|---|---|
| 状态 | accepted |
| 日期 | 2026-04-29 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | 用户需求："网页风格化内容和模块分离 + 这个库最终开源给别人用来构建自己的知识库" |
| 替代 | 不替代任何既有 ADR；扩展 ADR-0001 §1.5 / §2.5 / §2.6 边界 |

## Context

ADR-0001 锁定的架构默认 `apps/site` 与 `packages/*` 是单一闭源应用：每个 block 包同时含逻辑（props schema + MDX 序列化）与视觉（Tiptap NodeView + Astro renderer），样式以 Tailwind class 直接落在组件里，颜色 / 间距 / 排版散布全仓。这个安排对单人项目可行，但有两个限制：

1. **改主题成本高**：暗色模式 / 重新调色需要全仓修改 Tailwind class，无单点切换
2. **开源复用率低**：别人想用我们的 jupyter / nn-viz / agent-flow block 构建自己的网站，必须接受我们的视觉决定，或 fork 重写

用户要求开源给别人复用做小型个人网站 / 知识库。这要求**视觉层与功能层物理分离**，且分离边界足以让外部使用者：
- 用我们的 block 业务逻辑 + 自己的 UI
- 用我们的 UI + 自己的主题
- 全套使用并切换主题（暗色 / 自定义品牌）

## Decision

### D1: 三层分离

```
设计层 (design-tokens)        — CSS vars + Tailwind preset + 主题 + React 主题切换 hook
  ↑
Headless 层 (block core)      — props schema (Zod) + MDX serialize/parse + 业务逻辑（无 React 依赖）
  ↑
Presentational 层 (block UI)  — React 组件（Tiptap NodeView + Astro RenderView），消费 core + design tokens
  ↑
集成层 (apps/site)            — 整合 + demo / reference implementation
```

### D2: subfolder 内分层（不全拆包）

每个 component block 一个包，内部 `core/` + `ui-default/` 子目录，通过 `package.json#exports` 暴露子路径：

```
packages/block-callout/
├── package.json (exports: { ".", "./core", "./ui-default" })
├── src/
│   ├── core/          ← 无 React 依赖，纯逻辑
│   ├── ui-default/    ← React 组件
│   └── index.ts       ← barrel：默认导出 core + ui-default
└── CONTRACT.md
```

**为什么不每个 block 拆 2 个包**：包数量翻倍（24 → 48）让 monorepo 难管；subfolder + `exports` 已能提供路径级隔离；将来真要拆是 `mv` 操作，没卡死。

**外部使用者三种用法**：

```typescript
// 全套（最快上手，等价 demo site 的用法）
import { calloutBlock } from '@skb/block-callout';

// 只要 core，自己写 UI（最大复用度）
import { calloutCore } from '@skb/block-callout/core';

// 复用 UI 但裹自己的容器
import { CalloutEditorView, CalloutRenderView } from '@skb/block-callout/ui-default';
```

### D3: 新增 `packages/design-tokens` 作 Phase 1 第 25 个包

**职责**：
- `tokens.css`（`:root` CSS 变量，light 主题为默认）
- `tokens-dark.css`（`:root[data-theme="dark"]` 覆盖）
- `tailwind-preset.cjs`（Tailwind 配置 preset，颜色/间距/排版/圆角/阴影/动效全走 var）
- `tokens.ts`（TS 导出，给 CSS-in-JS / 程序化场景用）
- `use-theme.ts`（React hook：`{ theme, setTheme, toggle }`，含 localStorage + `prefers-color-scheme` 兜底）
- `ThemeToggle.tsx`（开箱即用的切换按钮组件）

`apps/site` 与所有 `block-*/ui-default/` 都消费此包。

### D4: BlockRegistry 升级为 Core + UI 双层

`packages/block-foundation/src/registry.ts` 从单一 `BlockDefinition` 拆成：

```typescript
export interface BlockCoreDefinition<TSchema extends ZodTypeAny = ZodTypeAny> {
  readonly name: string;                   // unique core id
  readonly kind: 'prose' | 'component';
  readonly propsSchema: TSchema;
  readonly mdxComponent: string;           // PascalCase MDX component name
}

export interface BlockUIDefinition<TSchema extends ZodTypeAny = ZodTypeAny> {
  readonly coreName: string;               // refers back to a registered core
  readonly uiId: string;                   // 'default' | 'minimal' | 用户自定义
  readonly EditorView: ComponentType<BlockViewProps<TSchema>>;
  readonly RenderView: ComponentType<BlockViewProps<TSchema>>;
}

export class BlockRegistry {
  registerCore(core: BlockCoreDefinition): void;
  registerUI(ui: BlockUIDefinition): void;       // throws if core unknown
  getCore(name: string): BlockCoreDefinition | undefined;
  listCores(): readonly BlockCoreDefinition[];
  getUI(coreName: string, uiId?: string): BlockUIDefinition | undefined;  // default to first
  listUIs(coreName: string): readonly BlockUIDefinition[];
}
```

同一 core 可挂多个 UI（`uiId` 区分），`getUI(name)` 不带 `uiId` 时返回第一个注册的（约定为 `'default'`）。

### D5: 暗色 / light 双主题 Phase 1 同时 ship

不只 light：dark 也在 Phase 1 落地，验证 token 切换路径全链路（Wave 1 要写两套主题文件 + apps/site 加切换按钮 + 视觉烟测）。

### D6: 显式切换按钮 + `prefers-color-scheme` 兜底

apps/site BaseLayout 右上角永久切换按钮。首次访问根据系统偏好；用户手动切换后存 localStorage 优先于系统偏好。`<script is:inline>` 在 `<head>` 内同步设置 `data-theme` 避免 FOUC。

### D7: 推后到 Phase 3 的事

为防 Wave 1 被压垮，**这些 Phase 3 才做**：
- npm publish 流水线 / semver / changesets
- 每个包的 README + API 文档
- 主题撰写者文档
- block 插件 API 文档
- `apps/site` 改名 `apps/demo`
- 公共 GitHub repo discoverability（关键词 / topics / showcase）

当前 Phase 1 / 2 仍保持 `private: true`，单仓库工作。

## Consequences

### 正面

- **架构开源就绪**：从零确立的边界让 Phase 3 npm 发布是"打包配置 + 文档"，不是"重构"
- **暗色模式 ship 即用**：spec 待解决问题中的"主题"提前消化
- **block 业务与视觉解耦**：mdx-bridge / RTT / pr-gate 可仅 review core 改动，UI 改动走另一条路径
- **Codex 协作更精准**：Wave 2 的 codex-block-generator 仿造 ui-default 时不必读 core；codex-test-scaffolder 写 core 测试不必碰 React

### 负面 / 需应对

- **Wave 1 工作量 +18%**：新 Track G ≈ 15 step；Track B 接口稍复杂 ≈ +5 step；Track A 三处微调
- **Wave 2 工作量 +15%**：每个 block 多一个 ui-default 实现（部分由 codex-block-generator 承担）
- **Phase 3 才能开源发布**：不能立即被外部消费；但 fork-then-use 已可行（路径级隔离已就位）
- **block-foundation 引入 React peerDep**：BlockUIDefinition 用到 `ComponentType` 类型；运行时 bundle 不受影响（type-only import 在 build 后被擦除）
- **packages/design-tokens 的 Tailwind 版本绑定**：preset 只兼容 Tailwind 3.x；将来 Tailwind 4 stable 后需要新写 preset 或迁移

### 影响其他 ADR / spec 的地方

- ADR-0001 Phase 0 erratum 5（tsconfig references 持续扩展）—— Wave 1 多一个 packages/design-tokens 加进 references
- spec §1.5 编辑器架构图：Block 注册表箭头从 "EditorView/RenderView 一同注册" 改为 "core 与 UI 分别注册"
- spec §1.7 MVP block 清单：每条 component block 行注脚 "core + ui-default"
- spec §2.2 monorepo 结构：Phase 1 包数量 24 → 25（加 design-tokens）
- spec §2.5 跨包契约清单：加 design-tokens/CONTRACT.md
- spec §2.6 关键不变量：第 5 条新增 "block UI 必须经 design-tokens 提供的 Tailwind preset；不允许硬编码颜色 / 间距 / 排版"

decision log 在 spec 内追加 7 条对应记录。

## Phase 1 Wave 1 plan 调整

新版 plan 含 **9 个任务** = `Task 0 (housekeeping) + Track A-F (6 路并行) + Task G (design-tokens, 串行夹在 F 之后) + Task Z (close)`。

> **注**：Track G 名义上是新 track，但因为它是 Track A 的依赖（apps/site tailwind preset 引用 design-tokens），所以**串行排在 Track A 之前比较合理**。
> 实操：把 Task 0 完成 → **同时 dispatch Track G + Track B-F**（5 路并行，A 等 G）→ **Track G 完成 → dispatch Track A**。

修订 wave 时序图：

```
Task 0  (串行)
   │
   ├──► Track G (设计 tokens, ~15 step)              ──┐
   │            │                                       │
   │            ▼ G 完成才能开 A                          │
   ├──► Track A (apps/site 含 toggle button)        ──┤  全部 ready-for-review
   ├──► Track B (block-foundation core+UI 双层接口) ──┤  且 review pass 后
   ├──► Track C (mdx-bridge)                        ──┤
   ├──► Track D (apps/api)                          ──┤
   ├──► Track E (kernel-adapter + registry)         ──┤
   └──► Track F (editor-commands + agent-tools)     ──┘
                                                       │
                                                       ▼
                                                  Task Z (close)
```

具体 step 增删见 plan 文件。

## Related

- [设计规格](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) §1.5 / §2.5 / §2.6
- [ADR-0001](ADR-0001-stack-selection.md) Phase 0 + Phase 1 架构基础
- [Phase 1 Wave 1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md)
- [agent-contract.md](../../agent-contract.md) — 27 agent 单一源
