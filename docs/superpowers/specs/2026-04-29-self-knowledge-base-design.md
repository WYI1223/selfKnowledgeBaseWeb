# SelfKnowledgeBaseWeb 设计规格

| 字段 | 值 |
|---|---|
| 创建日期 | 2026-04-29 |
| 状态 | **LOCKED** —— 用户 2026-04-29 终审通过 |
| 作者 | ve11ichor1223 + Claude (brainstorming session) |
| 路径 | `docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md` |
| 远程仓库 | https://github.com/WYI1223/selfKnowledgeBaseWeb.git |
| 下一步 | 由 `superpowers:writing-plans` 制定 Phase 0 可执行计划 → 用户在 WSL2 起新 session 启动 |

---

## 摘要

本项目要构建一个**个人知识库网站**，特征：

- **公开可读、私有可写**（链接将从作者个人主页对外发布）
- **block 模式**（Notion / Logseq 风），不是纯 markdown，而是异构内容单元的有序组合
- **嵌入式 Jupyter notebook + 神经网络可视化 + Agent 流程图 + PDF** 等高交互内容
- **性能敏感**：默认零 JavaScript（Astro islands），交互按需 hydrate
- **AI 友好**：内容是 git 仓库里的 MDX 文件，claude code agents 可直接读写
- **YAGNI**：不为高并发 / 多用户 / 协作 / 移动端原生 App 设计；单用户简单认证即可

---

## 背景与动机

作者的需求与现有工具的差距：

| 工具 | 缺口 |
|---|---|
| Obsidian / Logseq | 不能跑代码、不能在线编辑、可视化只能 iframe |
| Notion | 代码块不真执行，不能嵌 Jupyter，性能在长内容下退化 |
| Jupyter Book / Quarto | 静态导出，不能在线编辑，block 模型缺失 |
| Observable | 强可视化但锁定其平台，不是个人知识库 |

核心差异点：**"边写知识、边跑代码、边看可视化"** 在一篇文档内统一呈现，且作为公开站点可分享。

---

## 决策链路（why-trail）

逐条记录关键设计选择的理由，用于未来回顾时判断决策是否仍然有效：

1. **个人需求驱动 + Jupyter / NN viz / 性能敏感** → 决定项目独立开发而非借用现有工具
2. **混合 Jupyter 路线** → 默认浏览器内 (Pyodide / JupyterLite)，重计算路径预留但 Phase 1 不实现
3. **云上部署 + 自有 Edit 后端** → 公开访问 + 私人编辑能力共存
4. **不考虑高并发** → 移除 SSR / 多副本 / 复杂缓存等过度工程
5. **在线编辑 + 单用户认证** → 工作环境不固定，必须能在浏览器里改；只有作者一人，认证可以极简
6. **Block 模式（非纯 markdown）** → Notion 风格的"异构内容单元"才能容纳 Jupyter / NN viz / PDF / Agent flow 这些根本不是文本的东西
7. **MDX 作为存储格式** → 兼得 git diff 友好、Astro 原生支持、AI agents 可直接读写
8. **Tiptap 作编辑器底层** → ProseMirror 引擎成熟稳定；NodeView API 让自定义 block 可以是任意 React 组件并保留交互
9. **KernelAdapter 抽象** → Phase 1 只实现 PyodideAdapter，未来插入 RemoteJupyter / GPU box 不改前端
10. **PDF 作为 MVP block** → 学术阅读笔记一体化是知识库的关键场景

---

## §1 架构（LOCKED）

### 1.1 部署拓扑

```
Phase 1 (MVP)
─────────────────────────────────────────────────────────
┌────────────────────────────────────────────────┐
│  Cloud CDN (Cloudflare Pages)                  │
│  ── Astro 静态前端                              │
│  ── Tiptap 编辑器 (登录后启用)                  │
│  ── PyodideAdapter (浏览器内 Python)            │
│  ── 全部 component blocks (jupyter / nn-viz /  │
│      agent-flow / pdf / math / 等)              │
└────────────────────┬───────────────────────────┘
                     │ HTTPS, 仅在编辑/保存时调用
                     ▼
┌────────────────────────────────────────────────┐
│  Edit API 服务 (轻量 VPS / 个人小机器)          │
│  通过 Cloudflare Tunnel 暴露 (无公网 IP 也可)   │
│                                                │
│  ── Auth (单用户密码 + JWT cookie)              │
│  ── 文件 CRUD (读写 _assets / index.mdx)        │
│  ── git commit + push 到 GitHub                │
│  ── 可选 PDF 代理 (CORS 受限的外链)             │
└────────────────────┬───────────────────────────┘
                     │ git push
                     ▼
              GitHub webhook → CI rebuild → CDN

Phase 2+ (按需追加，前端代码不改)
─────────────────────────────────────────────────────────
        +  GPU 机器 / Colab / RunPod / Lambda
        +  RemoteKernelAdapter 注册到前端 KernelRegistry
        +  block frontmatter 多一个 kernel="remote:gpu-box" 字段
```

### 1.2 技术栈

| 层 | 选型 | 关键理由 |
|---|---|---|
| 前端框架 | **Astro** + MDX | islands 架构，默认零 JS，可视化按需 hydrate；MDX 原生支持 |
| 编辑器引擎 | **Tiptap** (ProseMirror) | 自定义 NodeView 可承载任意 React 组件并保留交互；社区成熟 |
| Markdown 行为 | `@tiptap/starter-kit` + `@tiptap/extension-task-list` + `@tiptap/extension-typography` + `tiptap-markdown` | **零自写代码**，全部 markdown 输入快捷键 / 粘贴识别 / 行内样式由这些包提供 |
| MDX 解析 | `unified` + `remark-mdx` + `remark-parse` + 自写 ~200 行桥接层 | 实现 MDX ↔ Tiptap 文档的双向转换 |
| 浏览器内计算 | **JupyterLite** + **Pyodide** | NumPy / Pandas / Matplotlib / SymPy 全可用；零后端 |
| 计算抽象 | 自定义 `KernelAdapter` 接口 | Phase 1 只 PyodideAdapter；未来可插 RemoteJupyter |
| 可视化 | TensorFlow.js + React Flow + Three.js + D3 + Recharts | 按 block 类型分别选用最贴合的库 |
| PDF | **react-pdf** (基于 Mozilla pdf.js) | 内嵌渲染、文字选择、Ctrl+F；构建时提取文本喂搜索 |
| 数学 | **KaTeX** | 渲染快，体积小 |
| 后端 | **FastAPI** (Python) | 与 Jupyter 同语言；async；Pydantic → TypeScript 自动同步类型 |
| 认证 | 单用户密码 (Argon2) + JWT (httpOnly cookie) | 一行配置，零依赖外部 OAuth |
| 搜索 | **Pagefind** + 构建时 PDF 文本提取 | 静态全文索引，零后端，含 PDF 内容 |
| 样式 | **Tailwind CSS** + shadcn/ui token 体系 | 快、与 Astro / React 都兼容 |
| 包管理 / monorepo | **pnpm workspaces** + **Turborepo** | 跨包缓存；agent 并行构建友好 |
| 类型契约 | **Zod** + **openapi-typescript** | 前后端类型同步，agents 改一边另一边自动报错 |
| CDN 部署 | **Cloudflare Pages** | 免费、与 Cloudflare Tunnel 同生态 |
| 后端暴露 | **Cloudflare Tunnel** | 零端口转发、零公网 IP 需求；自带 TLS + DDoS shield |

### 1.3 内容模型：page-as-directory

每个"页面"是一个目录，含 MDX 入口与同侧资源：

```
content/notes/transformer-attention/
├── index.mdx                        ← block 序列（MDX）
├── _assets/
│   ├── attention.ipynb             ← 嵌入的 notebook
│   ├── react-agent-flow.json       ← agent 流程图配置
│   ├── architecture.png            ← 静态图片
│   └── attention-is-all-you-need.pdf
└── meta.json                        ← 扩展元数据 (后期使用)
```

收益：
- `.ipynb` 可直接用 JupyterLab 打开编辑（与浏览器编辑器二者皆可）
- 资源不污染主文档但又紧密关联
- 删除整个页面 = 删除整个目录
- 支持 i18n / 草稿 / 版本等扩展

### 1.4 MDX 文件结构示例

```mdx
---
title: "Transformer 注意力可视化"
slug: "transformer-attention"
tags: ["nn", "transformer", "attention"]
date: 2026-04-29
draft: false
---

import { JupyterBlock, NeuralNetViz, AgentFlow, Math, Callout, PDF } from '@blocks';

# 标题

下面是普通段落 block。这是 **markdown** 渲染的部分。

<Callout type="warning">
这是一个 callout block。
</Callout>

<Math display>
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
</Math>

<JupyterBlock src="./_assets/attention.ipynb" kernel="pyodide" />

<NeuralNetViz
  model="bert-tiny"
  layer={3}
  attentionHead={5}
  width={800}
/>

<AgentFlow src="./_assets/react-agent-flow.json" />

<PDF src="./_assets/attention-is-all-you-need.pdf" pages="3-7" />

更多文字 block...
```

**关键不变量**：prose 部分序列化为**纯 markdown**（不是 `<Paragraph>` JSX），只有 component blocks 才以 JSX 形式出现。这保证 git diff 干净，且文件仍然可以用 vim 直接修改。

### 1.5 编辑器架构（ADR-0003 后：core / UI 双层注册）

```
┌──────────────────────────────────────────────────────────┐
│  Block Editor Shell (Tiptap / ProseMirror)              │
│  ── 文档树管理 + slash 命令 + 拖拽排序 + 选区             │
│  ── markdown 输入快捷键 (StarterKit 提供)                 │
└──────────┬───────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  BlockRegistry (双层注册，ADR-0003)                       │
│                                                          │
│  registerCore(core: BlockCoreDefinition)：               │
│   ├─ name / kind ('prose'|'component')                  │
│   ├─ propsSchema (Zod)                                   │
│   ├─ mdxComponent (PascalCase MDX 组件名)                 │
│   └─ MDX serialize / parse 业务逻辑（无 React 依赖）       │
│                                                          │
│  registerUI(ui: BlockUIDefinition)：                      │
│   ├─ coreName (绑定到已注册的 core)                       │
│   ├─ uiId ('default' | 'minimal' | 用户自定义)            │
│   ├─ EditorView (Tiptap NodeView 组件)                   │
│   └─ RenderView (Astro / React 渲染组件)                  │
│                                                          │
│  同一 core 可挂多个 UI；getUI(name) 默认取第一个注册的     │
└──────────┬───────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  内置 block 实现 (每个 block-* 包内 core/ + ui-default/)  │
│   Prose blocks (StarterKit + tiptap-markdown 提供):     │
│     paragraph · heading(h1-h3) · bullet/ordered/task    │
│     list · quote · inline-code · link · 强调样式          │
│                                                          │
│   Component blocks (我们实现，含 ui-default):             │
│     code-block · math · callout · jupyter ·              │
│     nn-viz · agent-flow · image · pdf                    │
└──────────┬───────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  设计系统层 (packages/design-tokens, ADR-0003)            │
│   CSS vars (color/space/type/radius/shadow/motion) ·     │
│   Tailwind preset · 主题切换 hook · ThemeToggle 组件      │
│   light + dark 双主题；data-theme 切换；prefers-color-    │
│   scheme 兜底；FOUC inline-script 阻断                     │
└──────────────────────────────────────────────────────────┘
```

**两类 block 的根本差异**：

- **Prose blocks** 走 ProseMirror schema，序列化为 markdown 文本
- **Component blocks** 走 Tiptap NodeView，用 React 组件渲染，序列化为 `<ComponentName />` JSX

这两类的实现策略与测试策略不同 —— 反过来给 §3 的 agent 分工提供了清晰的边界。

### 1.6 计算抽象：KernelAdapter

```typescript
// packages/kernels/src/adapter.ts
export interface KernelAdapter {
  readonly id: string;            // 'pyodide' | 'remote-jupyter' | ...
  readonly capabilities: {
    libraries: string[];          // 哪些库可用
    gpu: boolean;
    persistentState: boolean;
    maxMemoryMB?: number;
  };
  startSession(sessionId: string): Promise<KernelSession>;
}

export interface KernelSession {
  execute(code: string): AsyncIterable<KernelEvent>;
  interrupt(): Promise<void>;
  shutdown(): Promise<void>;
}

export type KernelEvent =
  | { type: 'stdout'; text: string }
  | { type: 'stderr'; text: string }
  | { type: 'display_data'; data: Record<string, unknown> }
  | { type: 'execute_result'; data: Record<string, unknown> }
  | { type: 'error'; ename: string; evalue: string; traceback: string[] }
  | { type: 'status'; state: 'idle' | 'busy' };
```

- **Phase 1**：只实现 `PyodideAdapter`。所有 jupyter / runnable-code / nn-viz 的计算都在浏览器里跑。**无任何后端 kernel 服务**。
- **Phase 2+**：新增 `RemoteJupyterAdapter` 等实现，注册到 `KernelRegistry`。Block frontmatter 多一个 `kernel="remote:gpu-box"` 字段即可路由。前端代码不变。

### 1.7 MVP block 清单（确定版）

```
Prose (StarterKit / tiptap-markdown 直接提供 — 零自写):
  paragraph · heading(h1-h3) · bullet/ordered/task list ·
  quote · inline-code · link · bold/italic/strike

Component (我们实现):
  code-block         代码高亮，不执行（Shiki / Prism）
  math               KaTeX 公式 (inline + display)
  callout            info / warn / note 高亮卡片
  jupyter            完整 notebook 嵌入（多个、独立 session）
  nn-viz             神经网络可视化（TensorFlow.js）
  agent-flow         Agent 流程 DAG（React Flow）
  image              图片 + caption + zoom
  pdf                PDF 嵌入 + 全文搜索
```

**Phase 2 加入**（不影响 Phase 1 上线）：

```
runnable-code · chart (recharts) · diagram (mermaid) ·
table · embed / link-card · video · toggle / collapsible ·
RemoteKernelAdapter
```

### 1.8 关键约束（向后所有阶段都不能违反）

1. **不引入数据库**：所有内容都是 git 仓库里的文件
2. **不引入第三方 OAuth**：单用户密码 + JWT，避免外部依赖
3. **不引入后端 SSR**：站点必须是纯静态构建
4. **不为多用户做设计**：所有 API 假定 max-1 写者
5. **PyodideAdapter 必须能独立工作**：没有后端 kernel 时网站全部交互功能仍可用

---

## §2 模块边界 + agent 并行分工地图（LOCKED）

### 2.1 设计原则

- **细粒度包优先**：每个 component block 独立成包；agent 工作时上下文只装载自己负责的包，比"all blocks 合一"省 ~70% 上下文
- **接口 / 实现物理分离**：`kernel-adapter`（接口）与 `kernel-pyodide`（实现）独立成包，未来加新 adapter 不污染前者
- **包结构允许进化**：通过 ADR + codemod 脚本，包可被合并 / 拆分 / 重命名 / 整体废弃
- **契约文档强制**：每个接口包含 `CONTRACT.md`，被 `code-reviewer` 强制审查
- **单向依赖**：上游包永不依赖下游；具体见 §2.4 依赖图

### 2.2 monorepo 结构（Phase 1 包数量：25 个；ADR-0003 后）

```
SelfKnowledgeBaseWeb/
├── apps/
│   ├── site/                                # Astro 前端 (公开 + 编辑器入口；Phase 3 重命名 demo)
│   └── api/                                 # FastAPI 后端 (Edit API + WS + LLM bridge)
│
├── packages/
│   │  === 设计系统层（ADR-0003 新增）===
│   ├── design-tokens/                       # ★ CSS vars + Tailwind preset + 主题切换 + ThemeToggle
│   │
│   │  === 基础设施层 ===
│   ├── content-types/                       # Zod schemas 跨前后端共享
│   ├── ui/                                  # shadcn primitives（消费 design-tokens）
│   ├── api-client/                          # [auto-generated] OpenAPI → TS
│   │
│   │  === Block 系统层（每个 block-* 包内 core/ + ui-default/ subfolder，ADR-0003）===
│   ├── block-foundation/                    # BlockRegistry: registerCore + registerUI + Prose blocks
│   ├── block-callout/                       # core/ + ui-default/
│   ├── block-code/                          # core/ + ui-default/
│   ├── block-image/                         # core/ + ui-default/
│   ├── block-math/                          # core/ + ui-default/
│   ├── block-pdf/                           # core/ + ui-default/
│   ├── block-jupyter/                       # core/ + ui-default/
│   ├── block-nn-viz/                        # core/ + ui-default/
│   ├── block-agent-flow/                    # core/ + ui-default/
│   │
│   │  === MDX 桥接层 ===
│   ├── mdx-bridge/                          # MDX ↔ Tiptap 双向
│   │
│   │  === Kernel 抽象层 ===
│   ├── kernel-adapter/                      # 接口 + 类型 (永远稳定)
│   ├── kernel-registry/                     # 运行时路由
│   ├── kernel-pyodide/                      # Phase 1 唯一实现
│   │
│   │  === 编辑器层 ===
│   ├── editor-commands/                     # ★ 命令模式 (人类与 agent 共用)
│   ├── editor-shell/                        # Tiptap 容器 + 文档生命周期
│   ├── editor-slash-menu/
│   ├── editor-drag-handle/
│   ├── editor-toolbar/
│   │
│   │  === Agent 集成层 (Phase 1 仅留接口) ===
│   ├── agent-tools/                         # ★ 工具 schema 定义 (Phase 2 实现)
│   │
│   │  === 集成层 ===
│   ├── auth-client/                         # 登录状态 + JWT 管理
│   └── search-index/                        # 构建时全文索引（含 PDF）
│
├── content/                                 # 知识库内容
├── docs/
│   ├── superpowers/specs/                   # 设计规格
│   ├── plans/                               # ★ orchestrator 维护的规划文档
│   ├── execution/                           # ★ 执行 agent 维护的执行日志
│   ├── decisions/                           # ADR
│   ├── audits/                              # ★ structure-auditor / perf-auditor 报告
│   └── runbooks/                            # 部署 / 故障排查
│
├── scripts/
├── .claude/
│   ├── agents/
│   ├── skills/                              # ★ 工作流 playbook (procedure 文档)
│   ├── settings.json
│   └── commands/
├── .github/workflows/
├── CLAUDE.md
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

**Phase 2 新增（不修改 Phase 1 包）**：
- `packages/agent-chat/` —— 浏览器内 chat UI + 工具调用可视化 + approve/reject
- `apps/api/app/agent_bridge.py` —— Agent SDK loop + canUseTool hook
- `apps/api/app/llm/` —— LLMProvider 抽象（Phase 1 已留接口，Phase 2 完整实现）
- `apps/api/app/ws/` —— WebSocket 协议处理（Phase 1 已建通道）

### 2.3 包的"形状"分类

| 类别 | 包 | 工作模式 | 主要 agent |
|---|---|---|---|
| **接口包**（极少改） | `kernel-adapter` · `block-foundation/registry` · `content-types` · `agent-tools` | 改动需 ADR；全员同步 | `refactorer` |
| **实现包**（独立 agent 包内任意改） | 8 个 `block-*` · `kernel-pyodide` · 4 个 `editor-*` | 单 agent 包内迭代 | 工种专家 |
| **桥接包**（敏感） | `mdx-bridge` · `api-client`（生成）· `search-index` | 改动牵动两端，需 round-trip 测试守护 | `mdx-bridge-eng` |
| **应用包** | `apps/site` · `apps/api` | 集成各 package | `editor-integrator` · `api-builder` |

### 2.4 依赖图

```
                 apps/site ──────────── apps/api
                /    │    \\               │
               /     │     \\              │
              /      ▼      \\             ▼
       editor-shell  block-foundation   FastAPI
        │   │   │     │      │           │
        │   │   │     │      │  ←─ 8 个 block-* 各自依赖
        │   │   │     │      │      block-foundation
        │   │   │     │      │
        ▼   ▼   ▼     │      │  ┌── block-jupyter ─→ kernel-registry
   slash drag toolbar │      │  │       │
        \\  │  /      │      │  │       └─→ kernel-adapter
         ▼ ▼ ▼        │      │  │       ┌─→ kernel-pyodide
       editor-commands│      ▼
                      │   mdx-bridge
                      │      │
                      │      ▼
                      └── block-foundation

  共享底层：ui · content-types · api-client · agent-tools
  并行：所有 block-* / 所有 editor-* 互不依赖（除共享基础）
```

**关键并行性质**：
- **8 个 `block-*` 包之间零耦合** —— 8 agent 同时干 8 个 block，commit 互不冲突
- **4 个 `editor-*` 子模块只通过 `editor-shell` 集成** —— 3 agent 可并行
- **kernel 三段式**（adapter / registry / pyodide）—— 接口先定，后两者可并行
- **`agent-tools` 是空的 type 定义**（Phase 1 不实现），不阻塞任何工作

### 2.5 跨包契约位置 + `CONTRACT.md` 制度

| 契约 | 位置 | 受影响双方 | 维护文档 |
|---|---|---|---|
| **Block Core / UI 双层接口（ADR-0003）** | `packages/block-foundation/src/registry.ts` | 所有 block 的 core + 所有 block 的 ui-default + editor + site | `block-foundation/CONTRACT.md` |
| **设计 token 接口（ADR-0003）** | `packages/design-tokens/src/{tokens.css,tokens-dark.css,tailwind-preset.cjs,use-theme.ts}` | apps/site + 每个 block-X/ui-default + packages/ui | `design-tokens/CONTRACT.md` |
| MDX ↔ block 序列化协议 | `packages/mdx-bridge/src/round-trip.test.ts` | mdx-bridge + 每个 block | `mdx-bridge/CONTRACT.md` |
| KernelAdapter 接口 | `packages/kernel-adapter/src/adapter.ts` | jupyter / runnable-code blocks | `kernel-adapter/CONTRACT.md` |
| API endpoints | `apps/api/app/schemas.py` (Pydantic) | api-client (auto-gen) | `apps/api/CONTRACT.md` |
| 页面 frontmatter schema | `packages/content-types/src/frontmatter.ts` | site 构建 + editor 元数据面板 | `content-types/CONTRACT.md` |
| Agent 工具 schema | `packages/agent-tools/src/*.ts` | apps/api 实现 + agent-chat UI | `agent-tools/CONTRACT.md` |
| 编辑器命令清单 | `packages/editor-commands/src/index.ts` | UI 操作 + agent 工具实现 | `editor-commands/CONTRACT.md` |
| WebSocket 协议 | `apps/api/app/ws/protocol.py` | apps/site 客户端 + agent loop | `apps/api/app/ws/CONTRACT.md` |
| LLMProvider 抽象 | `apps/api/app/llm/provider.py` | Anthropic 实现 + 未来 provider | `apps/api/app/llm/CONTRACT.md` |

**铁律**：契约文件顶部注释明确 "修改此文件需同步更新 X / Y / Z"；改了文件但没改 `CONTRACT.md`，`code-reviewer` 直接 reject。

### 2.6 Agent 集成架构（重大架构决策）

经调研后**放弃 MCP 路线**，采用 **Anthropic Agent SDK + Custom Tools + WebSocket bridge**。

**决策依据**：
- MCP 的上下文污染在 2026 年通过 Tool Search 已减少 85%，但仍有开销
- Skills 不是工具替代品，无法被外部 agent loop 调用
- Custom Tools 在 Agent SDK 中只占 50–100 tokens，类型安全，与代码同仓库，原生支持 WebSocket 处理函数访问 LIVE 编辑器状态
- 这正是 Tiptap 官方 AI Agent 扩展所采用的架构

**架构图**：

```
Browser (Tiptap 编辑器)
    ↑↓ WebSocket（实时 editor state 同步）
Backend (apps/api)
    ├─ Agent SDK + 5-7 个 Custom Tools
    │  ├─ get_editor_state    (读取选区/未保存内容/kernel 状态)
    │  ├─ read_page / write_page
    │  ├─ create_block / edit_block / move_block
    │  └─ search
    ├─ canUseTool Hook ───── 半自动审批闸门
    └─ LLMProvider 抽象 ──── Anthropic 实现 (未来插 GPT/Gemini)
    ↓ HTTPS
Anthropic API
```

**Phase 1 必须建（防 Phase 2 大改）**：

1. **`packages/editor-commands`** —— 命令模式根基，所有编辑器变更（人类操作 + agent 工具）都走这一层
2. **`packages/agent-tools`** —— **仅 type 定义**，列出工具 schema（Phase 2 才实现）
3. **`apps/api/app/ws/`** —— WebSocket 端点 + 状态同步协议骨架
4. **`apps/api/app/llm/`** —— LLMProvider 抽象接口（Anthropic 实现可 Phase 2 完成，但接口 Phase 1 就要冻结）

**关键不变量（写入 CLAUDE.md）**：

1. 所有编辑器变更必须经 `editor-commands` —— 不允许直接调 Tiptap mutator
2. 新增 agent 工具必须先在 `agent-tools` 里定义 schema —— 然后实现才允许进入 `apps/api`
3. LLM 调用必须经 `LLMProvider` 抽象 —— 不允许 `apps/api` 直接 `import anthropic`
4. WebSocket 协议变更必须更新 `app/ws/CONTRACT.md`

**Skills 在此架构中的角色**：仍保留 `.claude/skills/`，但作为 **playbook 文档**（"如何写技术笔记"、"如何把论文转成 callout + jupyter"），不作为工具调用层。Claude Code 工作时按需读取，不污染上下文。

### 2.7 动态重组的工程化承诺

针对 "结构不能从头到尾都是这样" 的需求：

1. **包级别"开关"**：每个 package 可整体废弃 / 替换而不影响其他包
   - 接口集中在 `block-foundation` / `kernel-adapter` / `agent-tools`
   - 删一个 component block 不损伤其他 block
2. **跨包移动模板化**：`scripts/refactor-move.ts` —— 半自动 codemod 工具，传入 `--from` / `--to` / `--symbol`，自动改 imports + package.json deps + tsconfig paths
3. **结构审计周期化**：`structure-auditor` agent 每月执行，产出 `docs/audits/structure-YYYY-MM.md`
4. **重大重组必有 ADR**：`docs/decisions/ADR-NNNN-<topic>.md`，由 `refactorer` agent 撰写

### 2.8 Phase 1 Wave 并行图（修订版）

```
WAVE 0：脚手架（串行）
  T0.1  monorepo + Turbo + tsconfig 链
  T0.2  CLAUDE.md + .claude/agents 全部配置
  T0.3  CI 骨架（lint / typecheck / test / size-check / link-check）
  T0.4  环境决策文档（WSL2 / Docker / 原生，详 §4）

WAVE 1：基础设施 + 接口（6 路并行）
  Track A  apps/site Astro 骨架                  agent: editor-integrator
  Track B  block-foundation (registry + prose)   agent: block-foundation-eng
  Track C  mdx-bridge + RTT 测试基线              agent: mdx-bridge-eng
  Track D  apps/api FastAPI + auth + git ops     agent: api-builder
  Track E  kernel-adapter + kernel-registry      agent: kernel-architect
  Track F  editor-commands + agent-tools schema  agent: commands-eng (★ 新增)

WAVE 2：实现层（12 路并行 ★ 最大并发）
  ── 8 个 component block ──────────────
   block-callout / block-code / block-image           (3 simple-block-eng)
   block-math / block-pdf                             (2 render-block-eng)
   block-jupyter / block-nn-viz / block-agent-flow    (3 viz-block-eng)
  ── 3 个 editor 子模块 ────────────────
   editor-slash-menu / editor-drag-handle / editor-toolbar  (3 editor-eng)
  ── kernel 实现 ────────────────────
   kernel-pyodide                                     (1 kernel-pyodide-eng)

WAVE 3：集成
  T3.1  editor-shell 集成 (依赖 wave 2 全部 + commands)
  T3.2  apps/site 接入 editor + 登录流
  T3.3  search-index + Pagefind 全站索引
  T3.4  WebSocket scaffold (apps/api/ws) + LLMProvider 接口
  agent: editor-integrator + editor-integrator + api-builder

WAVE 4：验收 + 部署
  T4.1  Playwright E2E
  T4.2  Cloudflare Pages 部署
  T4.3  Cloudflare Tunnel + Edit API 上线
  T4.4  performance-auditor 首次基线
  agent: deployer + performance-auditor
```

每个 wave 之间**强制 review checkpoint**：`code-reviewer` agent 必须 sign off 才能进下一 wave。

## §3 Harness 工程层（LOCKED）

### 3.1 Agent 阵容（27 个，多 LLM 协同）

```
TIER 0: Orchestrator (Claude, 1) ── 整体规划 + dispatch + 维护 docs/plans/
              │
              ▼ dispatch (静态分配)
TIER 1: Workers (15)
  ├─ Claude-based (10)        ── 复杂推理 / 架构 / 桥接 / 集成
  └─ Codex 5.3-spark-based (5) ── 模板化 / 重复变体 / 脚手架
              │
              ▼ output
TIER 2: Process (7) ── 跨切，角色严格分离
  ├─ plan-challenger (Codex 5.3-spark) ── plan lock 前挑战 (PR-sized / 可测 / 边界)
  ├─ code-reviewer (Codex 5.3-spark, ★ 默认廉价)
  │      ↓ 高风险 PR 自动 escalate
  ├─ pr-gate (Codex 5.5, 选择性)  ── 仅对契约 / 架构 / 安全相关 PR
  ├─ pr-reviewer (Claude)         ── 实现质量 + 降级风险 + 规格匹配
  ├─ git-operator (Claude)        ── 唯一被授权 git 操作
  ├─ refactorer (Claude)          ── 唯一被授权跨包重组
  └─ researcher (Claude)          ── 唯一被授权外网访问
              │
              ▼ 周期 / 触发
TIER 3: Audit (4)
  ├─ structure-auditor           ── 月度
  ├─ performance-auditor         ── 每 N PR / 周
  ├─ mdx-doctor                  ── PR 触碰 mdx-bridge 或 block 时
  └─ link-checker                ── CI 每次 push (lychee)

合计：1 + 15 + 7 + 4 = 27 个 agent
```

**Tier 0：Orchestrator (Claude)**

| Agent | 职责 |
|---|---|
| `orchestrator` | 维护 `docs/plans/`；把高层目标拆成 wave / track / task；dispatch 给 worker；接收 review 结果推进；**永不修改代码** |

**Tier 1：Claude Workers（10 个）—— 长上下文 / 架构敏感**

| Agent | 负责包 |
|---|---|
| `block-foundation-eng` | block-foundation, content-types |
| `simple-block-eng` | block-callout（template 优先），其余 simple block 由 codex-block-generator 仿造 |
| `render-block-eng` | block-math, block-pdf（math template 优先） |
| `viz-block-eng` | block-jupyter, block-nn-viz, block-agent-flow（每个独立 hand-craft） |
| `mdx-bridge-eng` | mdx-bridge（含 RTT 测试守护） |
| `kernel-architect` | kernel-adapter, kernel-registry（接口包） |
| `kernel-pyodide-eng` | kernel-pyodide |
| `editor-eng` | editor-commands（核心架构）, editor-shell |
| `editor-integrator` | editor-slash-menu, editor-drag-handle, editor-toolbar, apps/site 集成 |
| `api-builder` | apps/api（含 ws / llm 抽象骨架），CRUD 部分可调 codex-api-crud-builder 协助 |

**Tier 1：Codex 5.3 Workers（5 个）—— 静态分配，专攻模板化**

| Agent | 适合的工作 |
|---|---|
| `codex-block-generator` | 在 simple-block-eng 写出 block-callout 模板后，仿造 block-code, block-image |
| `codex-test-scaffolder` | 为每个 package 生成 vitest 套件骨架 |
| `codex-script-builder` | scripts/ 下的 codemod / 脚手架 / refactor-move 工具 |
| `codex-api-crud-builder` | apps/api 的 CRUD 端点骨架（Pydantic + 路由） |
| `codex-css-stylist` | Tailwind 重复样式 / 设计 token 应用 |

**调用方式**：通过 Bash 工具调用本地安装的 `codex` CLI，传入 prompt 模板（每个 codex-worker 在 `.claude/agents/` 中定义包装器）。

**Tier 2：Process Agents（7 个）—— 严格角色分离 + 成本敏感**

| Agent | LLM | 职责 |
|---|---|---|
| `plan-challenger` | Codex 5.3-spark | orchestrator 写完每个 wave / track plan，**lock 之前**挑战：PR-sized / 可测试 / 边界条件覆盖；输出建议清单（不阻塞，orchestrator 决定吸收） |
| `code-reviewer` | Codex **5.3-spark**（默认） | 行级严谨：类型错误 / lint / 契约同步 / 文件大小 / CONTRACT.md 同步检查 |
| `pr-gate` | Codex **5.5**（选择性） | 仅对**高风险 PR** escalate。触发条件见 §3.2 |
| `pr-reviewer` | Claude | 实现质量 / 是否符合规格 / 是否引入降级或回归 / 架构一致性 |
| `git-operator` | Claude | 唯一 git 操作权（commit / branch / rebase / push）；要求所有应跑的 review pass 才执行 |
| `refactorer` | Claude | 唯一跨包重组权；每次重组必产 ADR |
| `researcher` | Claude | 唯一外网权（WebSearch / WebFetch）；接收其他 agent 的调研请求 |

**Tier 3：Audit Agents（4 个）—— 周期 / 触发**

| Agent | 触发 | 职责 |
|---|---|---|
| `structure-auditor` | 每月 / 主脑触发 | 扫全仓产 `docs/audits/structure-YYYY-MM.md`：候选重构 / 契约漂移 / 孤儿包 |
| `performance-auditor` | 每 N PR / 每周 | Lighthouse CI / size-limit / Astro analyze / Playwright traces → `docs/audits/perf-YYYY-MM-DD.md` |
| `mdx-doctor` | PR 触碰 mdx-bridge 或 block 时 | 跑全部 block 的 round-trip 测试 |
| `link-checker` | CI 每次 push | `lychee` 扫 markdown 短链，broken 阻断 merge |

### 3.2 Review 工作流（成本敏感分层）

**核心原则**：默认便宜（Codex 5.3-spark），高风险时升级（Codex 5.5）。每 PR 必经 Codex code-review + Claude pr-review；高风险 PR 多加一道 5.5 pr-gate。

```
Worker 完工
   │ marks ready-for-review
   ▼
┌──────────────────────────────────────────────────────────┐
│  Step 1: code-reviewer (Codex 5.3-spark)                │
│  ── 类型 / lint / 契约 / 文件大小 / 风格 / 边界条件         │
│  ── 输出: PASS / FAIL + 具体问题清单                      │
└──────────────────────────────────────────────────────────┘
   │
   ├── FAIL → 退 worker
   │
   ▼ PASS
┌──────────────────────────────────────────────────────────┐
│  Step 2: 高风险检测 (自动)                                │
│  PR 是否符合任一条件？                                     │
│   • 修改 */CONTRACT.md                                   │
│   • 新增 / 删除 package                                   │
│   • 触碰核心架构包：kernel-adapter / mdx-bridge /         │
│     agent-tools / editor-commands / block-foundation     │
│   • 触发 ADR 创建                                         │
│   • 触碰 CI / deploy / auth / security 路径               │
└──────────────────────────────────────────────────────────┘
   │                              │
   │ 否（普通 PR）                 │ 是（高风险 PR）
   │                              ▼
   │              ┌──────────────────────────────────────┐
   │              │  Step 2.5: pr-gate (Codex 5.5)       │
   │              │  ── 深度审查：漏洞 / 隐性破坏          │
   │              │  ── 输出: PASS / FAIL + reasoning     │
   │              └──────────────────────────────────────┘
   │                              │
   │                              ├─── FAIL → 退 worker
   │                              │
   │                              ▼ PASS
   ▼                              ▼
┌──────────────────────────────────────────────────────────┐
│  Step 3: pr-reviewer (Claude)                            │
│  ── 实现是否符合 spec                                      │
│  ── 是否引入回归 / 降级                                    │
│  ── 架构一致性 + 跨文件影响                                │
│  ── 输出: APPROVE / REJECT + reasoning                    │
└──────────────────────────────────────────────────────────┘
   │
   ├── REJECT → 退 worker 修复
   │
   ▼ APPROVE
┌──────────────────────────────────────────────────────────┐
│  Step 4: git-operator                                    │
│  ── commit + push                                         │
└──────────────────────────────────────────────────────────┘
```

**分歧协议**：所有应跑的 reviewer 必须**都 approve**。任一 fail 退回 worker。

**Fast lane（豁免）—— 微小 PR 跳过 Claude pr-review**：
- 触发条件：diff < 20 行 + 无 .ts/.tsx/.py/.toml 文件 + 无 CONTRACT.md / schema 改动
- 流程：仅 Codex 5.3-spark code-review + git-operator 直接 merge
- 适用：docs-only / 配置 / typo / 单字符串改动

**成本预估**（Phase 1 假设 ~50 PR）：
- 普通 PR ≈ 35 个：5.3-spark code-review + Claude pr-review
- 高风险 PR ≈ 10 个：5.3-spark + 5.5 + Claude
- Fast lane ≈ 5 个：仅 5.3-spark
- **5.5 调用 ≈ 10 次/Phase 1**（vs 原方案 50 次），节省 ~80% 5.5 token 消耗

### 3.3 设计 Skill 流水线（Phase 2 启动时触发）

```
Design 任务
  ↓
frontend-design (生成第一版)
  ↓
ui-ux-pro-max-skill (强化设计系统 / 配色 / 行业规则)
  ↓
vercel-design-review (终审)
  ↓
code-reviewer + pr-reviewer (与代码层质量 review 合并)
```

每段独立 agent 调用，前段输出作下段输入。Phase 1 不启动这条流水线（Phase 1 用 shadcn/ui 默认设计 + Tailwind tokens，足够 MVP 上线）。

### 3.4 规划 / 执行文档分层

**`docs/plans/`** —— `orchestrator` 专属，**只写规划**

```
docs/plans/
├── overview.md
├── active.md                        # 当前 wave 指针 (SessionStart hook 读取)
├── phase-1/
│   ├── plan.md
│   ├── wave-0-scaffolding.md
│   ├── wave-1-foundation.md
│   ├── wave-2-implementation.md
│   ├── wave-3-integration.md
│   └── wave-4-deployment.md
└── phase-2/
    └── ...
```

**`docs/execution/`** —— 执行 worker 维护，**只写实际发生**

```
docs/execution/
├── phase-1/
│   ├── wave-1-track-A-editor-integrator.md      # editor-integrator agent 落地日志
│   ├── wave-1-track-B-block-foundation.md
│   ├── wave-2-block-callout-template.md    # Claude template
│   ├── wave-2-block-code-variant.md        # Codex 5.3 variant
│   └── ...
```

每篇 `execution/` 文档必含：
- 引用对应 plan 链接（双向链，CI 检查）
- 实际做的事（与 plan 偏离处明示）
- 后续 follow-up issue
- 提交者 agent 名称 + 模型（Claude / Codex 5.3）

### 3.5 文档交叉引用 + lychee CI

**强制规则（CLAUDE.md）**：每篇 markdown 文档必须含 `## Related` 段，至少链接 1 篇相关文档。

**lychee 配置**（`.lychee.toml`）：

```toml
include_verbatim = true
exclude = ["^https://example.com"]
exclude_path = ["node_modules", "dist", ".turbo", "content/**/_assets"]
max_concurrency = 16
timeout = 20
require_https = false
verify_ssl = true
```

**CI step**：

```yaml
- name: link-check
  uses: lycheeverse/lychee-action@v2
  with:
    args: --no-progress './**/*.md'
  fail: true
```

### 3.6 文件大小硬上限

| 阈值 | 行为 | 工具 |
|---|---|---|
| **300 行 soft warn** | ESLint `max-lines` warn 级别；agent 看到必须考虑拆分 | ESLint + ruff |
| **500 行 hard fail** | CI 强制 fail，merge 阻断 | size-check 自定义脚本 |

**单一职责强制（CLAUDE.md）**：
> "agent 触碰一个文件时，先验证它现在是否仍只做一件事；变成多件事就先拆分再加新内容"

**`structure-auditor` 巡检**：每月扫候选 god-file → `refactorer` 接手 → 产 ADR。

### 3.7 Hooks（`.claude/settings.json`）

```jsonc
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "node scripts/hooks/post-edit.mjs",
        "// 行为": "对改动文件运行 affected lint/typecheck，超 300 行 warn"
      }
    ],
    "SessionStart": [
      {
        "command": "cat docs/plans/active.md && pnpm tsc -b --dry",
        "// 行为": "session 起来时打印当前 plan + 类型健康度"
      }
    ]
  }
}
```

注意：用户机器专门跑这一个任务，PostToolUse 频繁触发可接受。需确保不踩 Codex CLI 插件状态。

### 3.8 验证命令体系

**单一 entry point**：`pnpm check`，agent 完工前必须本地通过。

```bash
# package.json scripts
{
  "check": "turbo run lint typecheck test build size-check link-check",
  "check:affected": "turbo run lint typecheck test --filter=...[origin/main]",
  "lint": "eslint .",
  "typecheck": "tsc -b",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "size-check": "node scripts/check-size-limits.mjs",
  "link-check": "lychee './**/*.md'",
  "perf:lighthouse": "lhci autorun"
}
```

### 3.9 测试金字塔

| 层 | 工具 | 范围 | 触发 |
|---|---|---|---|
| 单元 | Vitest | packages/* 内部 | 每次 PR |
| 契约 | Vitest 专项 | mdx-bridge RTT, kernel 协议, agent-tools schema | 每次 PR |
| 集成 | Vitest + supertest | apps/api 端点 | 每次 PR |
| E2E | Playwright | 浏览器内编辑流程 + 公开站点访问 | nightly + pre-merge |
| 视觉回归 | Playwright + chromatic 或 percy | block 渲染 | nightly |
| 性能 | Lighthouse CI | 公开页面 + 编辑器加载 | weekly + perf-auditor |

### 3.10 CI/CD pipeline

```
GitHub push
    │
    ├─→ install (pnpm + cache)
    ├─→ codegen (openapi-typescript) ── 失败=后端类型变了但前端没同步
    ├─→ lint (eslint + ruff)
    ├─→ typecheck (tsc -b + mypy)
    ├─→ size-check
    ├─→ link-check (lychee)
    ├─→ test (vitest + pytest, affected only)
    ├─→ test:e2e (playwright on PR to main)
    └─→ build (turbo cache)
        │
        └─→ on main: deploy to Cloudflare Pages
            └─→ perf:lighthouse (post-deploy 验收)
```

每步 **独立 job**，并行运行；失败 fail-fast。

### 3.11 ADR 制度

`docs/decisions/ADR-NNNN-<slug>.md`，模板：

```markdown
# ADR-NNNN: <title>

| 字段 | 值 |
|---|---|
| 状态 | proposed / accepted / superseded by ADR-XXXX |
| 日期 | YYYY-MM-DD |
| 作者 | <agent name + LLM model> |
| 替代 | ADR-YYYY (if applicable) |

## Context
## Decision
## Consequences
## Related
- <link to spec / plan / impacted CONTRACT.md>
```

触发 ADR 的事件：
- 跨包代码移动
- 接口破坏性改动
- 新增 / 删除 package
- 替换某个核心依赖（如换掉 Tiptap）
- 偏离 spec 的实现决策
- LLM 模型版本切换（如 Codex 5.3 → 5.5）

### 3.12 Codex CLI 集成实操

**安装假设**：用户 PATH 中已有独立 `codex` 命令（option a），调用走 `codex exec`（非交互模式，stdout/stderr 分流，适合 Bash 管道）。

**Phase 0 在 `~/.codex/config.toml` 设好 profiles**（每个 agent 用对应 profile 而不是每次传 flag）：

```toml
[profiles.scaffolder]
model = "gpt-5.3-codex-spark"
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[profiles.code-reviewer]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"

[profiles.pr-gate]
model = "gpt-5.5"
sandbox_mode = "read-only"

[profiles.plan-challenger]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"
```

**调用模式**：每个 codex-based agent 在 `.claude/agents/*.md` 中是 Claude Code 的 subagent 包装器，内部用 Bash 调用：

```bash
# Tier 1 工种 worker (示例：codex-test-scaffolder)
codex exec --profile scaffolder "<task prompt + context files>"

# Tier 2 code-reviewer
git diff origin/main..HEAD | codex exec --profile code-reviewer "<review checklist>"

# Tier 2 pr-gate (高风险 PR escalate 时)
codex exec --profile pr-gate "<full PR context + ADR-trigger reasoning>"

# Tier 2 plan-challenger
cat docs/plans/phase-1/wave-2.md | codex exec --profile plan-challenger \
  "Challenge this plan: PR-sized? testable? edge cases covered?"
```

`stdin` 作为 prompt 输入是官方支持，便于把 git diff / 测试输出 / plan 文档直接管道喂给 Codex。

**Phase 0 验证项（T0.9）**：
- `codex exec --version` 可在 Claude Code Bash 工具下调用
- 4 个 profile 各调一次确认模型路由正确
- stdout / stderr 分流符合预期（progress 不污染最终输出）
- API key 配置位置（环境变量 OPENAI_API_KEY 或 `~/.codex/auth.json`）确认

**降级策略**：若 Phase 0 验证失败 / Codex CLI 不可用 / profile 路由错误，所有 codex-based agent 任务回退到 Claude，不阻塞 Phase 1。降级会触发 ADR 记录。

### 3.13 Agent Contract（单一源派生）

**问题**：Claude 配置（`CLAUDE.md` / `.claude/agents/*.md` / `.claude/settings.json`）与 Codex 配置（`AGENTS.md` / `~/.codex/config.toml` 的 profile 段）是**双方各自维护**，最容易发生"一边更新另一边漏掉"的信息不同步事故。

**方案**：引入 `agent-contract.md`（仓库根目录）作为**单一权威源**，配置文件由其派生。

```
agent-contract.md (★ 单一源)
   │
   │ scripts/generate-configs.ts (~ 200 行 TS 渲染脚本)
   │
   ├──→ CLAUDE.md                       (Claude Code 入口)
   ├──→ AGENTS.md                       (Codex 入口)
   ├──→ .claude/agents/*.md             (每个 Claude subagent 定义)
   ├──→ .claude/settings.json           (hooks / permissions)
   ├──→ ~/.codex/config.toml(profiles)  (Codex profiles 段)
   └──→ docs/review-checklist.md        (review 项清单，code-reviewer / pr-gate / pr-reviewer 共用)
```

**`agent-contract.md` 的最小骨架**：

```yaml
# agent-contract.yml (frontmatter at top of agent-contract.md)
agents:
  orchestrator:
    tier: 0
    llm: claude
    role: "整体规划 + dispatch"
    permissions: [read_repo, write_plans]
    forbidden: [edit_code, git_commit]

  codex-test-scaffolder:
    tier: 1
    llm: codex
    profile: scaffolder
    role: "为每个 package 生成 vitest 套件"
    permissions: [read_repo, write_tests]

  pr-gate:
    tier: 2
    llm: codex
    profile: pr-gate
    role: "高风险 PR 深度审查"
    triggers: [contract_change, package_add_remove, core_arch_touch, adr_required]
    # ...
```

**生成器纪律**：
- 任何 agent 配置变更**只改 `agent-contract.md`**，跑 `pnpm generate:configs` 同步
- CI 检查：跑生成器后若仓库有 diff，CI fail（即提示有人手改了下游文件）
- `code-reviewer` 强制：触碰 `.claude/agents/` 或 `~/.codex/config.toml` 但**没改** `agent-contract.md` → reject

**Phase 0 任务 T0.13** 加入：
- 写 `agent-contract.md` 初版（含 27 个 agent）
- 写 `scripts/generate-configs.ts` 生成器
- 跑一次生成；commit 全套派生文件

这一步是 §3 的第 4 处微调，从设计上消除"双边信息不同步"的失败模式。

## §4 分阶段实施计划（LOCKED）

**核心节奏原则**：事件驱动，非日期驱动。Phase / Wave 之间由"退出标准达成"触发推进；PR 与 commit 数量随实际任务量自然产生，不预设。

### 4.1 Phase 0：脚手架 + 环境验证

**节奏**：完全串行。所有 task 完成才能进入 Phase 1。

**4.1.1 环境（已决策）**

锁定 **WSL2**（Codex CLI 装在 WSL2 内）。理由：
- Astro / Vite / Pyodide 工具链跑 Linux 最舒服
- 与 CI（GitHub Actions Ubuntu runner）行为一致
- 文件留在 WSL2 内（避免跨 mount），IO 性能与原生 Linux 一致
- Codex CLI 与项目同侧，调用路径统一

**4.1.2 Phase 0 任务（13 项）**

| Task | Agent | 验收 |
|---|---|---|
| T0.1 环境决策 + setup 文档（WSL2 + 工具链 + Codex 安装） | orchestrator + researcher（如需调研 WSL2 Codex 兼容性） | `docs/runbooks/setup-wsl2.md` 完整 |
| T0.2 `git init` + GitHub 仓库 + 主分支保护规则 | git-operator | 远程仓库 + branch protection 启用 |
| T0.3 monorepo 骨架（pnpm + Turbo + tsconfig 链 + 根 package.json） | api-builder | `pnpm install` 通过；`pnpm tsc -b` 干净 |
| T0.4 `agent-contract.md` 初版（含 26 agent 完整定义） | orchestrator | 含 Tier 0/1/2/3 全部 agent + permissions + triggers |
| T0.5 `scripts/generate-configs.ts` 生成器 (~ 200 行 TS) | codex-script-builder | 跑一次生成全部下游配置 |
| T0.6 `.claude/agents/*.md` × 26（生成产物） | 生成器自动产 | 每个有独立描述 + dispatch 范围 |
| T0.7 `CLAUDE.md`（生成产物，含全部硬规则） | 生成器自动产 | 含 §3 全部硬规则 |
| T0.8 `.claude/settings.json` hooks（生成产物） | 生成器自动产 | hook 在示例 Edit 上触发成功 |
| T0.9 `~/.codex/config.toml` profile 段（生成产物） | 生成器自动产 | 4 个 profile 各调一次（scaffolder / code-reviewer / pr-gate / plan-challenger）成功 |
| T0.10 `.claude/skills/` 骨架 + 1 个 sample `SKILL.md` | orchestrator | 含 placeholder skill |
| T0.11 CI 骨架（GitHub Actions：lint / typecheck / test / size-check / link-check） | api-builder | dummy commit CI 全绿 |
| T0.12 lychee 配置 + 首次 link-check 通过 | api-builder | CI 链路检查节点上线 |
| T0.13 `docs/decisions/ADR-0001-stack-selection.md`（追认 §1）+ `docs/plans/phase-1/plan.md` 初稿 | orchestrator | ADR + plan 完整 |

**Phase 0 退出标准**：
- 一次 dummy commit 跑完整 CI 全绿
- 26 agent 中至少 5 个能被 dispatch 成功（含 1 个 Codex worker）
- `agent-contract.md` → 下游配置生成验证通过（CI 检查跑生成器后无 diff）
- WSL2 setup 文档被独立验证（推荐让 user 重置环境跑一遍）

### 4.2 Phase 1：MVP 知识库

**节奏**：事件驱动。每个 wave 由所有 track 双 review pass 触发下一波；wave 内 task 并行进行。

**4.2.1 Wave 1 — 基础设施 + 接口（6 路并行）**

| Track | Agent | LLM | 退出标准 |
|---|---|---|---|
| A. Astro site 骨架 | editor-integrator | Claude | 公开页可渲染静态 MDX，路由生效 |
| B. block-foundation | block-foundation-eng | Claude | BlockRegistry 接口 + Prose blocks（StarterKit 包装）+ 单测 ≥ 80% |
| C. mdx-bridge + RTT 基线 | mdx-bridge-eng | Claude | RTT 测试 fixture 至少 5 个 prose 用例通过 |
| D. apps/api FastAPI 骨架 | api-builder | Claude | auth + 文件 CRUD + git ops + WS endpoint stub + LLMProvider interface 全有 |
| E. kernel-adapter + registry | kernel-architect | Claude | 接口 + 类型 + CONTRACT.md 完整；单测覆盖接口约束 |
| F. editor-commands + agent-tools schema | editor-eng | Claude | 命令模式 API + agent-tools type stubs + CONTRACT.md |

**Wave 1 退出标准**：
- 所有 6 track 双 review pass（高风险 track B/C/E/F 多过 pr-gate 5.5）
- structure-auditor 跑一次 baseline
- ADR-0002 记录 wave 1 完成

**4.2.2 Wave 2 — 实现层（最大并发）**

| Cluster | Templates (Claude) | Variants (Codex 5.3-spark) |
|---|---|---|
| Simple blocks | block-callout (simple-block-eng) | block-code, block-image (codex-block-generator) |
| Render blocks | block-math (render-block-eng) | block-pdf 由 render-block-eng hand-craft（PDF 复杂，不仿造） |
| Viz blocks | block-jupyter, block-nn-viz, block-agent-flow（独立 hand-craft） (viz-block-eng) | — |
| Editor 子模块 | editor-slash-menu, editor-drag-handle, editor-toolbar (editor-integrator) | — |
| Kernel 实现 | kernel-pyodide (kernel-pyodide-eng) | — |
| Test 脚手架 | — | 全包统一交 codex-test-scaffolder 跑过一遍 |
| Scripts | — | refactor-move + new-block + extract-pdf-text 交 codex-script-builder |

**节奏约束**：
- block-callout 模板交付**之前不启动** codex-block-generator（保证模板质量）
- jupyter / nn-viz / agent-flow 是 viz-block-eng 的"重头戏"，可分批做不必同时启动

**Wave 2 退出标准**：
- 8 个 component block 都通过：单测 ≥ 80% / round-trip 测试 / mdx-doctor 全 case 通过
- 所有 PR 双 review pass
- structure-auditor 第二次审计

**4.2.3 Wave 3 — 集成**

| Task | Agent | 退出标准 |
|---|---|---|
| editor-shell 集成全部 block | editor-integrator | 编辑器能创建包含全部 8 种 component block 的页面 |
| apps/site 接入 editor + 登录流 | editor-integrator + api-builder | 登录 → 编辑 → 保存 → 公开页面更新闭环 |
| search-index + Pagefind | editor-integrator | 全站搜索（含 PDF 文本）可用 |
| WS 通道 + LLMProvider 接口冻结 | api-builder | 接口定义 + 占位 echo 实现 |

**4.2.4 Wave 4 — 验收 + 部署**

| Task | Agent | 退出标准 |
|---|---|---|
| Playwright E2E | editor-integrator | "创建笔记 → 加 jupyter block → 跑代码 → 保存 → 公开访问" 闭环通过 |
| Cloudflare Pages 部署 | git-operator + api-builder | 公开 URL 可访问 |
| Cloudflare Tunnel + Edit API 上线 | api-builder | Edit API 通过 Tunnel 可被 site 调用 |
| performance-auditor 首次基线 | performance-auditor | Lighthouse → `docs/audits/perf-phase-1-baseline.md` |
| 接入个人主页 | git-operator | 个人主页加超链 |

**Phase 1 退出标准**：MVP 上线，公开 URL 可访问，全部 8 种 block 可用，E2E 流程通过。

**Pause point（强制）**：Phase 1 结束后**显式 pause**，让用户写真实笔记 + auditors 跑全套，发现痛点；反馈喂回 Phase 2a plan 调整。这是用户提到的"停下脚步重新看"的窗口。

### 4.3 Phase 2a：扩展 Block 类型（轻量里程碑）

**目标**：MVP 上线后立刻有可见功能扩展，不依赖 in-page agent。

| Block | Agent | 备注 |
|---|---|---|
| block-runnable-code | viz-block-eng（template）+ codex-block-generator（变体） | Pyodide 单 cell |
| block-chart | render-block-eng | recharts |
| block-diagram | render-block-eng | mermaid |
| block-table | simple-block-eng | 含排序 / 单元格编辑 |
| block-embed | simple-block-eng | iframe + link-card |
| block-video | simple-block-eng | HTML5 + caption |
| block-toggle | simple-block-eng | collapsible / fold |

**Phase 2a 退出标准**：7 个新 block 全部通过 round-trip + 单测；老功能无回归（视觉回归 + E2E 全绿）。

### 4.4 Phase 2b：In-page Agent 集成

**前置依赖**：Phase 1 的 4 个 Phase 1 必建项（editor-commands / agent-tools schema / WS 通道 / LLMProvider 接口）就绪。

| Task | Agent |
|---|---|
| `packages/agent-chat`（chat UI + 工具调用可视化 + approve/reject 按钮） | editor-integrator |
| `apps/api/agent_bridge.py`（Anthropic Agent SDK + canUseTool hook 实现半自动审批） | api-builder |
| `apps/api/llm/anthropic.py`（LLMProvider 实现） | api-builder |
| Custom tools 实现（read_page / write_page / create_block / edit_block / move_block / search / get_editor_state） | api-builder |
| `.claude/skills/` 写入实际 playbook（"如何写技术笔记" / "如何把论文转成 callout + jupyter" 等） | orchestrator |
| 设计 skill 流水线启动（frontend-design → ui-ux-pro-max → Vercel review） | 三段 design agent 链 |

**Phase 2b 退出标准**：
- 浏览器内 chat 可与 agent 对话
- agent 可读写页面、操作 blocks，所有动作走 `editor-commands` 而非直接 Tiptap mutator
- 半自动审批 flow 端到端验证通过
- LLMProvider 抽象通过单元测试（用 stub provider 验证接口契约）

### 4.5 Phase 3+ 路线图（开放，按需触发，每条独立 ADR）

- **远程 kernel adapter**（GPU / Colab / RunPod 接入）
- **双向链接**（Obsidian 风格 backlinks）
- **知识图谱可视化**（基于 frontmatter tags + link graph）
- **Spaced repetition**（笔记复习）
- **导出**（Anki / PDF / EPUB）
- **协作 / 评论**（如想分享给学习伙伴）
- **多语言**（如想做英文笔记）

### 4.6 节奏触发器（事件驱动，非日期驱动）

按用户偏好，时间不预定。但定义清晰的"事件触发"：

| 事件 | 触发动作 |
|---|---|
| Wave N 全部 task 完成 + 双 review pass | 进入 Wave N+1 |
| Phase N 退出标准达成 | 进入 Phase N+1 之前 pause（≥ 一次 audit 周期） |
| Phase 1 上线后 | 强制 pause：让用户写真实笔记，让 auditors 跑全套，反馈喂回 Phase 2a |
| performance-auditor 报告 baseline 比上次差 > 20% | 暂停新功能，先修性能 |
| structure-auditor 报告 god-file > 500 行 | 暂停新功能，先 refactor |
| Codex CLI 调用失败率 > 5% | 暂停 codex worker，调研问题（researcher） |
| `agent-contract.md` 与下游配置出现 diff（CI fail） | 立即修复，不得绕过 |
| MDX RTT 测试失败 | mdx-doctor 立即介入，阻断所有 block PR |

PR / commit 数量随任务自然产生，不预设目标。Wave 内若实际工作量超出预期，可拆子 wave；若低于预期自然合并。

### 4.7 风险登记

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| Tiptap NodeView 中嵌入 JupyterLite 出现选区 / undo 边界问题 | 中 | 高 | Wave 2 早期做 spike |
| MDX 双向 RTT 在边缘案例（嵌套 JSX / 含 markdown 的 callout）失真 | 中 | 高 | mdx-doctor 强制全 case 覆盖；首发显式黑名单 |
| Codex CLI 调用模式（`codex exec` 输出 / profile 路由）与预期不符 | 中 | 中 | Phase 0 T0.9 验证；不行降级到 Claude |
| Cloudflare Tunnel 配额或速率限制 | 低 | 中 | 单用户场景 Tunnel 免费档充裕 |
| Astro islands 在某个版本下 hydration mismatch | 低 | 中 | E2E + 视觉回归及时发现 |
| react-pdf bundle 体积过大拖累首屏 | 中 | 中 | 必须 lazy-load + 仅含 PDF 块的页面才装载 |
| 单用户认证泄漏（密码弱 / token 泄露） | 低 | 高 | Argon2 + httpOnly + Cloudflare WAF |
| `agent-contract.md` 与下游配置漂移 | 中 | 高 | CI 检查：跑生成器后若有 diff 即 fail |
| Phase 2b 的 agent 接入耦合 Phase 1 设计假设 | 中 | 高 | Phase 1 必须冻结的 4 个接口严守不变量 |
| Codex 5.5 token 成本超预期 | 低 | 中 | 高风险触发条件控制 escalate 频率（约 20% PR） |

---

## 待解决问题（推迟到具体阶段决议，不阻塞 spec lock）

- [ ] **主题：暗色 / 亮色 / 双模切换** —— 推迟到 Phase 2b 设计 skill 流水线启动时议
- [ ] **视觉回归工具具体选型**：chromatic vs percy vs Playwright 内置 —— Phase 0 实操时择一
- [ ] **Logo / favicon / branding** —— Phase 2b 设计 phase
- [ ] **performance-auditor 触发频率**：每周 vs 每 N PR —— Phase 0 实操中调整
- [ ] **`docs/plans/active.md` 指针机制**：单文件还是 symlink —— Phase 0 起手时定
- [ ] **codex-block-generator 仿造策略**：完全模板化 vs 给提示让其自由发挥 —— 在 wave 2 第一次 codex 仿造时观察并确定

所有这些都不影响 spec 的核心架构与实施顺序，可以在执行中渐进定型。

---

## 决策日志

记录每一轮 brainstorming 的关键转折点，未来如果想改变方向先看这里：

| 日期 | 决策 | 替代方案 / 为什么不选 |
|---|---|---|
| 2026-04-29 | 自建而非借用 Obsidian/Notion | 现有工具的 Jupyter / NN viz / 性能不达标 |
| 2026-04-29 | 混合 Jupyter (D)：默认 Pyodide，重计算预留 | A 全后端太重，B 纯浏览器无法跑 PyTorch，C 静态导出无交互 |
| 2026-04-29 | C 部署：CDN + 自有后端 | A 桌面 App 不能多设备访问，B 纯静态没有重计算路径 |
| 2026-04-29 | R2 自建编辑器 + 后端 API | R1 CMS 不能编辑 .ipynb，R3 跳出去用 JupyterLab 体验差 |
| 2026-04-29 | 公开可读 + 私有可写 | 整站登录会损失分享价值 |
| 2026-04-29 | Block 模式而非纯 markdown | 纯 markdown 容纳不了异构内容单元 |
| 2026-04-29 | MDX 作存储格式 | JSON 损失 git diff 可读性，markdown 不能表达组件 |
| 2026-04-29 | Tiptap 作编辑器底层 | BlockNote 抽象限制太多；Lexical 社区小；Plate 历史包袱 |
| 2026-04-29 | KernelAdapter 抽象 | 直接绑 Pyodide 会让未来引入 GPU 后端时改前端代码 |
| 2026-04-29 | PDF 加入 MVP | 学术阅读 + Jupyter 解读一体化是核心场景 |
| 2026-04-29 | 包结构细粒度（24 个 Phase 1 包） | 粗粒度合并污染 agent 上下文，节省 ~70% 上下文 |
| 2026-04-29 | 接口包 / 实现包 / 桥接包 / 应用包四分类 | 不同类的工作模式不同，agent 配置依此分级 |
| 2026-04-29 | 每接口包含 `CONTRACT.md` | 契约漂移是 monorepo 最大的隐性失败模式 |
| 2026-04-29 | **放弃 MCP，采用 Agent SDK + Custom Tools + WebSocket** | MCP 上下文虽可优化但 Custom Tools 更轻；Skills 不能作工具替代品；WebSocket 原生支持 LIVE 编辑器状态 |
| 2026-04-29 | `editor-commands` 命令模式 Phase 1 强制 | 防 Phase 2 引入 agent 时反向重构编辑器 |
| 2026-04-29 | `agent-tools` 仅 type 定义放 Phase 1 | 锁定工具 schema，Phase 2 实现不破坏接口 |
| 2026-04-29 | WebSocket 通道 + LLMProvider 抽象 Phase 1 必须 | 同上原因，留接口防大改 |
| 2026-04-29 | 规划 / 执行文档分层 (`docs/plans/` + `docs/execution/`) | 主脑维护规划、执行 agent 维护执行日志，避免角色越权 |
| 2026-04-29 | CI 强制 lychee 链接检查 + 文档强制交叉引用 | 避免文档孤儿化与短链失效 |
| 2026-04-29 | 文件硬上限 200/400 行 + structure-auditor 周期审计 | 防上帝文件 + 支持动态重组 |
| 2026-04-29 | code-reviewer 与 git-operator 严格分离 | 写代码与提交代码分工，避免混乱 |
| 2026-04-29 | `researcher` agent 独占外网访问权 | 其他 agent 不直接上网，避免噪音与不可重现 |
| 2026-04-29 | 设计 skill 三段流水线 (frontend-design → ui-ux-pro-max → Vercel review) | 生成 → 强化 → 终审分阶段执行 |
| 2026-04-29 | 文件硬上限调整为 300 / 500（之前 200 / 400） | 用户偏好；防上帝文件同时不过度细碎 |
| 2026-04-29 | Codex CLI 集成（option a：独立安装） | 多 LLM 协同；模板化 / 重复 / 脚手架交 Codex 5.3，节省 Claude tokens |
| 2026-04-29 | Review 拆为双层：code-reviewer (Codex 5.5) + pr-reviewer (Claude) | 利用两模型特性 —— Codex 行级严谨，Claude 长上下文判断 |
| 2026-04-29 | Review 顺序 serial（Codex 先 / Claude 后） | Token 成本最低；Codex 初筛省 Claude tokens |
| 2026-04-29 | Fast lane 豁免：仅 Codex 5.5 单审小改 | 文档 / 配置 / typo 不需要 Claude 介入，加速节奏 |
| 2026-04-29 | 静态分配 dispatch（plan 阶段标注 Claude 或 Codex） | 可审计；避免运行时主脑误判 |
| 2026-04-29 | Codex 不可用时降级到 Claude | 解耦 LLM 可用性与 phase 推进 |
| 2026-04-29 | Review 模型改为成本敏感分层 (5.3-spark 默认 + 5.5 选择性 escalate) | 5.5 贵；80% PR 可用 5.3-spark 完成 code-review，节省 token |
| 2026-04-29 | 新增 `pr-gate` (Codex 5.5) 仅对高风险 PR 启用 | 触发条件明确（CONTRACT / 核心包 / ADR / 安全），低频高质量 |
| 2026-04-29 | 新增 `plan-challenger` (Codex 5.3-spark) 在 plan lock 前挑战 | 借 Codex 严谨视角检查 PR-sized / 可测试 / 边界条件 |
| 2026-04-29 | Codex 调用统一走 `codex exec` + profile（不传 flag） | 配置集中可审计；profile 体现意图（scaffolder / code-reviewer / pr-gate / plan-challenger） |
| 2026-04-29 | 引入 `agent-contract.md` 单一源派生 Claude / Codex 双侧配置 | 双边手动维护必然漂移；生成器 + CI 检查锁住一致性 |
| 2026-04-29 | Total agent 数 25 → 27（+plan-challenger + pr-gate） | plan-challenger 负责 plan 阶段挑战；pr-gate 负责高风险 PR 深审 |
| 2026-04-29 | 环境锁定 WSL2（Codex CLI 装在 WSL2 内） | Linux 工具链兼容；与 CI 环境一致；Codex 与项目同侧 |
| 2026-04-29 | Phase 0 任务数 12 → 13（+T0.13 ADR-0001 + plan 初稿） | 追认 §1 决策入 ADR；plan 文档由 orchestrator 维护 |
| 2026-04-29 | Phase 2 拆分为 2a (block 扩展) + 2b (in-page agent) | MVP 后立刻有可见里程碑；agent 集成不阻塞功能扩展 |
| 2026-04-29 | 节奏事件驱动而非日期驱动 | 实际工作量不可预估；强制按退出标准推进 |
| 2026-04-29 | Phase 1 退出后强制 pause | 给 user 时间真实使用 + auditors 跑全套，反馈影响 Phase 2a 计划 |
| 2026-04-29 | PR / commit 数量随任务自然产生 | 不预设目标避免凑数或规避拆分 |
| 2026-04-29 | **Headless / Presentational 分层（ADR-0003）** | 开源给别人复用；视觉与功能必须物理可分；ADR-0003 完整记录 |
| 2026-04-29 | 新增 packages/design-tokens（Phase 1 包 24 → 25） | CSS vars + Tailwind preset + 主题切换 hook 单一权威源 |
| 2026-04-29 | BlockRegistry 拆 Core + UI 双层注册 | core 无 React 依赖；同一 core 可挂多个 UI（ui-default + 用户自定义） |
| 2026-04-29 | block-X 包内部 core/ + ui-default/ subfolder | 不全拆 2 包（24→48 太多）；用 package.json#exports 提供路径级隔离；将来要拆是 mv 操作 |
| 2026-04-29 | Phase 1 同时 ship light + dark 双主题 | 验证 token 切换链路全程；不只画饼 |
| 2026-04-29 | 显式主题切换按钮 + prefers-color-scheme 兜底 | 用户可干预；首访按系统偏好；FOUC 用 inline script 阻断 |
| 2026-04-29 | npm 发布推到 Phase 3 | Phase 1 / 2 仍 private:true；架构开源就绪即可，发布工作量独立 |
| 2026-04-29 | **采用 Claude Code Agent Team 作为 dispatch 模型（ADR-0004）** | 项目本质是 orchestrator + 多 worker + review 链 + 跨 wave 状态；Team + TaskList + SendMessage 是天然契合的原生原语，比一次性 Task 调用更高效 |
| 2026-04-29 | Wave 启动用 TeamCreate；wave 完工用 TeamDelete | 每个 wave 一个 team；27 agent 类型不变，按需实例化为 teammate |
| 2026-04-29 | Codex agent 是 Claude teammate 内部调用 codex exec | 不直接把 Codex 作为 teammate（无 Claude Code session）；Claude 包装层维持团队协议一致性 |
| 2026-04-29 | docs/runbooks/team-operations.md 必须前置注入每个 teammate spawn prompt | 27 agent 定义不需重新生成；操作手册外置降低改动面 |
| 2026-04-29 | review 链由 SendMessage + TaskUpdate 串接 | reviewer / git-operator 永久 idle 等消息；零冷启动；TaskList 留状态轨迹便于 ADR close 撰写 |
| 2026-04-29 | **REST API conventions ratify（ADR-0005）**：/v1 + camelCase + RFC 7807 + ISO 8601 UTC | Track D 即将落地 4 个端点；多 agent 协作 + 开源目标要求约束契约；apps/api/CONVENTIONS.md 落地 10 节约定 |
| 2026-04-29 | 资源命名 files → pages | "pages" 比 "files" 语义化；slug 限定 `[a-z0-9-]+`，路径映射到 content/notes/{slug}/index.mdx |
| 2026-04-29 | 错误格式锁定 RFC 7807 Problem Details lite | 客户端 dispatch 简单（switch error.type）；err handler 集中注册；不暴露内部栈 |
| 2026-04-29 | 项目锁定 orchestrator-managed team 模式（ADR-0004 D8） | review-gate 依赖超出 TaskList blocked_by 表达；高风险 escalate / Codex 配额由 orchestrator 集中调度 |
| 2026-04-30 | **新增 ux-ui-lead Claude teammate（ADR-0007 D1）** | Wave 2 8 个 ui-default 跨 block 统一视觉权威；防视觉八头蛇 |
| 2026-04-30 | Claude pr-reviewer 改选择性触发（ADR-0007 D2） | Wave 1 数据：codex 5.5 抓 9/12 asymmetry；Claude pr-reviewer 价值集中在跨包 / 长上下文，常规 PR 不浪费 |
| 2026-04-30 | template + codex-clone 模式扩展到 core 与 editor 子模块（ADR-0007 D3） | Wave 1 ui-default 已经是这个模式；core 在 simple block 集群试点；editor 三子模块同模式 |
| 2026-04-30 | ux-ui-lead spawn prompt 注入三个设计 skill（ADR-0007 D4） | frontend-design + ui-ux-pro-max + web-design-guidelines；视觉契约一次性灌入避免分阶段串行 |
| 2026-04-30 | **codex agents 降级为 orchestrator-direct tools（ADR-0007 D5）** | Wave 1 codex wrapper 是纯 context 搬运；省 ~2-3 turn / PR；agent-contract.md 拆 agents:/tool_patterns: 两段 |
| 2026-04-30 | spec §3.1 agent 阵容 27 → 20 teammate + 8 tool pattern | Wave 2 Pre-Task 0 按 ADR-0007 实施时同步 |
| 2026-04-30 | spec §3.2 review 工作流改为"orchestrator 自检常规 PR + 选择性 escalate" | ADR-0007 D2 + D5 联动；Wave 2 Pre-Task 0 实施时同步文字 |
