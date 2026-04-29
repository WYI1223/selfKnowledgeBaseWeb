# ADR-0001: 技术栈选型与架构基础

| 字段 | 值                                    |
| ---- | ------------------------------------- |
| 状态 | accepted                              |
| 日期 | 2026-04-29                            |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |

## Context

SelfKnowledgeBaseWeb 项目从零搭建。核心需求：

- 公开可读 / 私有可写知识库
- 嵌入式 Jupyter notebook + NN 可视化 + PDF + Agent flow 等异构内容
- 性能敏感
- 单用户

可选技术路线繁多（Astro / Next / SvelteKit, Tiptap / BlockNote / Lexical, MCP / SDK Custom Tools, etc.）。

## Decision

通过 brainstorming session 锁定（2026-04-29 spec lock）。下列子节按 spec §1.x 逐项追认：

### §1.1 部署拓扑

- 公开站点：**Cloudflare Pages**（CDN + 静态托管，免费层）
- 后端暴露：**Cloudflare Tunnel**（零端口转发；自带 TLS + DDoS shield）
- 用户机器：**WSL2**（Codex CLI 与项目同侧；与 GitHub Actions Ubuntu runner 行为一致）

### §1.2 技术栈

- 前端：**Astro** + MDX（islands；默认零 JS）
- 编辑器：**Tiptap**（ProseMirror）+ `@tiptap/starter-kit` + `tiptap-markdown`
- MDX 解析：`unified` + `remark-mdx` + 约 200 行桥接（packages/mdx-bridge）
- 浏览器内计算：**JupyterLite** + **Pyodide**（NumPy/Pandas/Matplotlib/SymPy）
- 计算抽象：自定义 `KernelAdapter` 接口（Phase 1 唯一 PyodideAdapter）
- 可视化：TensorFlow.js / React Flow / Three.js / D3 / Recharts（按 block 选库）
- PDF：**react-pdf**（pdf.js 内核；构建期文本提取）
- 数学：**KaTeX**（display + inline）
- 后端：**FastAPI** + Pydantic → openapi-typescript 自动派生前端类型
- 认证：单用户 Argon2 密码 + JWT（httpOnly cookie），无外部 OAuth
- 搜索：**Pagefind**（静态全文索引，含 PDF 文本）
- 样式：**Tailwind CSS** + shadcn/ui token
- Monorepo：**pnpm workspaces** + **Turborepo**（24 个细粒度包 + 2 应用）
- 类型契约：**Zod** + **openapi-typescript**
- 运行时：Node 22 LTS / pnpm 9.12.0 / Python 3.12 / TypeScript 5.6 strict（noUncheckedIndexedAccess + exactOptionalPropertyTypes）

### §1.3 内容模型

**page-as-directory**：`content/notes/<slug>/` 目录承载 `index.mdx` + `_assets/` + 可选 `meta.json`。git 即数据库。

### §1.4 MDX 文件结构

frontmatter（title / slug / tags / date / draft）+ 顶部 `import { JupyterBlock, NeuralNetViz, AgentFlow, Math, Callout, PDF } from '@blocks'`，正文为 prose + component block 混排。

### §1.5 编辑器架构

Tiptap 容器（packages/editor-shell）+ 命令模式（packages/editor-commands；agent 集成基石，禁止直接调 Tiptap mutator）+ 子模块 slash-menu / drag-handle / toolbar + BlockRegistry（packages/block-foundation）。

### §1.6 计算抽象 KernelAdapter

接口稳定（packages/kernel-adapter）+ 运行时路由（packages/kernel-registry）+ Phase 1 唯一实现 packages/kernel-pyodide。接口破坏性改动必产 ADR。

### §1.7 MVP block 清单

- **Prose**（StarterKit + tiptap-markdown 提供，零自写）：paragraph / heading h1-h3 / bullet / ordered / task list / quote / inline-code / link / bold / italic / strike
- **Component**（自实现）：code-block / math / callout / jupyter / nn-viz / agent-flow / image / pdf
- Phase 2 追加：runnable-code / chart / diagram / table / embed / video / toggle / RemoteKernelAdapter

### §1.8 关键约束（向后所有阶段不可违反）

1. **不引入数据库**：所有内容是 git 仓库文件
2. **不引入第三方 OAuth**：单用户 password + JWT
3. **不引入后端 SSR**：站点纯静态构建
4. **不为多用户做设计**：所有 API 假定 max-1 写者
5. **PyodideAdapter 必须能独立工作**：无后端 kernel 时全部交互功能仍可用

### Agent 集成 + Multi-LLM 协同（spec §2.6 + §3.1）

- **Agent 集成**：Anthropic Agent SDK + Custom Tools + WebSocket（非 MCP）
- **Multi-LLM**：Claude Opus 4.7 1M ctx（架构 / 综合判断）+ Codex CLI 5.3-spark / 5.5（脚手架 / 行级 review / 高风险深度审查）
- **Single-source agent contract**：`agent-contract.md` → 生成器派生 27 agent 的全部下游配置（CLAUDE.md / AGENTS.md / .claude/agents/\*.md / .claude/settings.json / tmp/codex-profiles.toml / docs/review-checklist.md）。CI 检查 `pnpm generate:configs` 跑后无 diff

## Consequences

正面：

- 性能：Astro islands 默认零 JS，最大化首屏速度
- 可分享：公开可读 + SEO
- AI 友好：内容是 MDX 文件，agents 可直接 Read/Edit
- 多 LLM 协同：Claude 负责架构，Codex 负责脚手架，节省 token
- 类型安全：TS strict + Zod + 自动生成 api-client

负面 / 待应对：

- 24 个包对人类略重 → 由 agent-contract.md 单一源 + 生成器缓解
- Codex CLI 调用模式有惊喜 → Phase 0 T0.9 验证（已落地，详见 erratum 4）
- MDX 双向 RTT 在边缘案例可能失真 → mdx-doctor 强制守护
- 单 Tier 0 主脑负责所有人在回路 → Codex worker 自动跑（详见 erratum 2）

## Spec errata (Phase 0 execution discoveries)

执行 Phase 0 期间发现 7 处 spec 描述与实现需要校正（5 处在 T0.1-T0.13 主体执行中发现；2 处在 V1 acceptance gate 重测中暴露）。每条都已在对应 commit 落实，本 ADR 集中记录原因与替代实现：

### Erratum 1: §3.7 hooks JSON shape

Spec §3.7 jsonc 例子展平 `type` / `command` 直接放在 matcher 同一层。Claude Code 实际 schema 要求每个 matcher entry 内部嵌套 `hooks: [{type, command}]` 数组。错误的 shape 会让 Claude Code 拒绝加载 settings.json，报 `PostToolUse -> 0 -> hooks: Expected array, but received undefined`。

**修正实现**：`scripts/render/settings-json.ts` 输出 nested-hooks shape；commit `860bb72`。

### Erratum 2: §3.12 codex profile `approval_policy`

Spec §3.12 jsonc 例子里 `[profiles.scaffolder]` 用 `approval_policy = "on-request"`，会让 Codex worker 中途暂停问用户。这违反单一卡点原则——Claude Tier 0 orchestrator 是唯一与用户交互的接口；Codex worker 必须在 sandbox 内自动跑完，把输出交给 orchestrator review。

**修正实现**：4 个 profile 全部 `approval_policy = "never"`；commit `7c77863`。

### Erratum 3: §1.2 TypeScript 版本

Spec §1.2 描述 "TypeScript 5.6 strict"。Plan T0.3 用 `^5.6.0`，pnpm 解析到 5.9.3。如 5.6 是契约性版本（spec 字面意），应改 `~5.6.0`；如 spec 想表达 "5.x strict"，则 spec 需要措辞松绑。

**修正实现**：T0.3 fix round 选了保守路径——`~5.6.0`，lockfile pin 5.6.3；commit `b8ebbb6`。后续如想升级到 5.7/5.8/5.9，需另起 ADR 评估 tsc 行为变化。

### Erratum 4: §3.5 lychee `include_verbatim`

Spec §3.5 / plan T0.12 lychee 配置写 `include_verbatim = true`。但 spec / plan 文档本身含大量 fenced code 样例，里面的相对路径是 T0.13 等后续任务的"未来文件"占位符。`include_verbatim = true` 会让 lychee 把它们当真链接扫描，CI 必挂。

**修正实现**：`include_verbatim = false`；commit `e92498f`。Trade-off：真实 code block 内的可执行链接也不会被检查；当前 corpus 没有此类用法，但若 Phase 1 引入"教程式可执行代码块含真实外链"，需要重新评估。

### Erratum 5: T0.3 `tsconfig.json` 偏离 plan 字面量

Plan T0.3 字面量 `{"files": [], "references": []}` 让 `tsc -b` 失败 `TS18002 'files' list in config file is empty`。

**修正实现**：T0.3 实施时改为 `extends ./tsconfig.base.json` + `composite: false` + `noEmit: true` + `references: []`（commit `b8ebbb6`）。后续 T0.5 fix round 在添加 scripts 类型化覆盖时把 references 数组填为 `[{ path: "./scripts" }]`（commit `dc255cb`）。Phase 1 packages 加进来时该数组会进一步扩展。

### Erratum 6: §3.13 `renderClaudeAgent` 缺 `description:` frontmatter

Spec §3.13 / plan T0.5 给的 renderClaudeAgent 字面量只 emit `name` / `tier` / `llm` / `profile` / `role` / `triggers`，没有 `description:`。Claude Code 的 agent loader **要求** `description:` 字段，缺失时 silently skip 整个 agent 文件——27 个 agent 全部不可 dispatch（V3 验收门最初全 fail）。

**修正实现**：`scripts/render/claude-agent.ts` emit `description: <quoted role>` 紧跟在 `name:` 之后；commit `0f96a75`。同时加 `escapeYamlString` helper 防御 YAML 敏感字符。

### Erratum 7: lychee-action 给 explicit `args` 时不读 `.lychee.toml`

Spec §3.5 / plan T0.12 假设 `lycheeverse/lychee-action@v2` 会自动读取 `.lychee.toml`。实测：当 workflow `with: args: '...'` 显式提供参数时，action 不再 auto-load config 文件。Erratum 4 设的 `include_verbatim = false` 在 CI 实际无效（虽然 plan-doc 重定向链接已绕过具体破坏）。

**修正实现**：本次未改 workflow（用户已 push 通过的修复绕过了破坏）。Phase 1 引入更多含 fenced code 内 markdown 样例时，需在 link-check.yml 加 `with: configFile: .lychee.toml` 或移除 explicit `args`，已记入 deferred follow-ups。

## Deferred follow-ups (track for Phase 1 / 2)

- **YAML 转义安全**（T0.5 CONCERN 2）：`scripts/render/claude-agent.ts` 直接拼 frontmatter 字符串，没有 YAML 转义。当前 27 agent 名 / 角色 / triggers 都没特殊字符，安全。但若未来某 agent role 字符串里出现 `:` / `#` / 反斜杠 / 前导空格等 YAML 敏感字符，需要切换到 `yaml.stringify`。
- **`vitest run --passWithNoTests` 假阳性**（T0.11 pr-gate CONCERN 3）：当前 `package.json scripts.test` 用 `vitest run --passWithNoTests`。Phase 0 有 16 个生成器测试，CI 实际跑了；但当 Phase 1 packages 加入而某些 package 还没写 test 时，CI 会绿色通过这些"无测试"包。Phase 1 wave 1 完工时应改 strict（去掉 `--passWithNoTests`，改用 turbo 的 `test:packages`）。
- **CI workflow 加 concurrency block**（T0.12 Note N1）：`.github/workflows/link-check.yml` 没有 concurrency cancel-in-progress。lychee 跑得快，影响小；统一三个 workflow 风格时一起加。
- **CI workflow 显式 `fail: true`**（T0.12 Note N2）：lychee-action@v2 默认就 fail，但显式声明对未来读者更清晰。
- **Workspace runtime 预留**（T0.5 NOTE）：当 Phase 1 packages 加入时，`tsconfig.json references` 数组需要相应扩展；当前只指向 `./scripts`。
- **link-check.yml 加载 .lychee.toml**（Erratum 7 后续）：给 lychee-action 加 `with: configFile: .lychee.toml`，或者把 args 移到 toml 里去。当前修复（重定向 broken 链接）治标，未治本。

## Related

- [设计规格 §1 全篇](../superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [Phase 0 plan](../superpowers/plans/2026-04-29-phase-0-scaffolding.md)
- [agent-contract.md](../../agent-contract.md)
- 全部 Phase 0 commits（含本 ADR 多次 amendment 在内）：`git log --oneline 2ba57fe..HEAD`
