# Phase 1 Wave 2 实施计划：实现层（最大并发）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Wave 1 基础设施 + 接口层之上，实现 Phase 1 的全部用户可见工作产物：8 个 component block（每个 core + ui-default 双层，ADR-0003 D2）+ 3 个 editor 子模块（slash-menu / drag-handle / toolbar）+ kernel-pyodide 实现，让 Wave 3 的 editor-shell 集成可以拿到一组完整、可序列化、可视觉一致的 block 与编辑器件。

**Architecture:**
- **template + codex-clone 模式（ADR-0007 D3）**：visual single-authority 由 `ux-ui-lead`（新 Claude teammate, ADR-0007 D1）写第一个 ui-default，其余 7 个由 codex-block-generator (tool) 仿造 + ux-ui-lead 视觉一致性审；core 在 simple block 集群试点（block-callout core 是 template，block-code/block-image core 是 clone），render block 与 viz block 仍 hand-craft；editor 三子模块同模式（toolbar template + slash-menu/drag-handle clone）。
- **Codex-heavy 执行（ADR-0007 D5）**：8 个 codex agent 已降为 orchestrator-direct Bash invocation tool patterns，不再消耗 Claude teammate 槽位；review chain 默认 codex 5.3-spark + orchestrator 自检，仅 ADR-0007 D2 表 8 行高风险 PR 才升级 pr-gate / Claude pr-reviewer。
- **8-point asymmetry-audit（ADR-0006）强制**：每个 reviewer 必须按 8 项逐条审；Wave 2 第一个 attr-bearing mark（如 `highlight`/`kbd`）扩展时 simul-update wrapMark + marksEqual + fixture（item #1 trip-hazard）。
- **block-foundation MDX renderer 接口冻结前置**：block-callout 是第一个真实 consumer，其 PR 之前必产 `block-foundation/RFC.md` 描述 "如何注册" walkthrough（structure-auditor 推荐 #2，ADR-0002 erratum #21）。
- **Wave 2 entry ADR（ADR-0008）必产**：解决 F1（mdx-bridge dead deps）+ F2（block-foundation forward-compat dead dep）的全局 dead-dep 政策（structure-auditor 推荐 #1，ADR-0002 erratum #19/#20）。

**Tech Stack（增量）：**
- 前端 block 实现：Tiptap NodeView + Astro RenderView + MDX serialize/parse；React 组件接 design-tokens preset
- 数学 / 符号：KaTeX（block-math），PDF.js + worker（block-pdf，含文本提取脚本 scripts/extract-pdf-text.ts）
- 可视化：JupyterLite（block-jupyter，consumer of kernel-pyodide）+ TensorFlow.js（block-nn-viz）+ React Flow（block-agent-flow）
- 内核：Pyodide（kernel-pyodide）实现 KernelAdapter 接口，能跑 NumPy / Pandas / Matplotlib
- editor 子模块：Tiptap BubbleMenu / FloatingMenu / Slash command suggestion / drag handle 扩展
- 不引入：editor-shell 集成（Wave 3 task）/ search-index（Wave 3）/ apps/site 编辑器入口（Wave 3）

**Reference: 必读**
- [设计规格 §1 / §2 / §3](../specs/2026-04-29-self-knowledge-base-design.md) 全篇 + §4.2.2 Wave 2 退出标准
- [ADR-0001](../../decisions/ADR-0001-stack-selection.md) 含 Phase 0 errata + 6 deferred follow-up
- [ADR-0002](../../decisions/ADR-0002-wave-1-close.md) Wave 1 close — 22 errata + 3 cross-package single-authority invariants（**含 erratum #19 dead-dep policy / #21 block-foundation/RFC.md / #16 attr-bearing mark expansion**）
- [ADR-0003](../../decisions/ADR-0003-headless-presentational-split.md) headless / UI 分层 + design-tokens + 开源就绪（D2 双层 / D4 双注册 / D7 npm publish 推 Phase 3）
- [ADR-0006](../../decisions/ADR-0006-asymmetry-audit-checklist.md) 8-point asymmetry-audit checklist（mandatory for code-reviewer + pr-gate）
- [ADR-0007](../../decisions/ADR-0007-job-function-codex-heavy-execution.md) 职能化分工 + Codex-heavy 执行 + teammate/tool 切分（**D1 ux-ui-lead / D2 selective Claude review / D3 template+clone / D4 design skill 注入 / D5 codex tool**）
- [docs/audits/structure-2026-04-29-wave-1.md](../../audits/structure-2026-04-29-wave-1.md) Wave 1 close baseline + 3 个结构关注点
- [agent-contract.md](../../../agent-contract.md) 20 teammate + 8 tool pattern 单一源
- [docs/runbooks/codex-tool-invocations.md](../../runbooks/codex-tool-invocations.md) tool patterns canonical Bash + 触发条件
- [docs/runbooks/team-operations.md](../../runbooks/team-operations.md) 团队操作手册（**前置注入每个 spawn**）

---

## File Structure

Wave 2 完工后新增（不含 Wave 1 已有）：

```
packages/
├── block-callout/                        # Track C1 (simple block, template)
│   ├── package.json (exports: ".", "./core", "./ui-default")
│   ├── tsconfig.json (refs: block-foundation, content-types, design-tokens)
│   ├── CONTRACT.md
│   └── src/
│       ├── core/
│       │   ├── index.ts
│       │   ├── core-definition.ts        # BlockCoreDefinition + propsSchema
│       │   ├── serialize.ts              # MDX serialize hook
│       │   └── parse.ts                  # MDX parse hook
│       ├── ui-default/
│       │   ├── index.ts
│       │   ├── EditorView.tsx            # Tiptap NodeView (React)
│       │   ├── RenderView.astro          # Astro render component
│       │   └── styles.css                # 应用 design-tokens preset
│       ├── index.ts                      # barrel
│       └── __tests__/
│           ├── core.test.ts              # propsSchema + serialize 单元
│           ├── round-trip.test.ts        # 与 mdx-bridge fixture 配套
│           └── ui-default.test.tsx       # EditorView / RenderView render
├── block-code/                           # Track C2 (simple block, codex-clone of callout)
│   └── (same shape)
├── block-image/                          # Track C3 (simple block, codex-clone of callout)
│   └── (same shape)
├── block-math/                           # Track D1 (render block, hand-craft, KaTeX)
│   └── (same shape; KaTeX + math.tex 输入)
├── block-pdf/                            # Track D2 (render block, hand-craft, react-pdf)
│   └── (same shape; pdf.js worker + 文本提取)
├── block-jupyter/                        # Track E1 (viz block, hand-craft, JupyterLite)
│   └── (same shape; consumer of kernel-pyodide + kernel-registry)
├── block-nn-viz/                         # Track E2 (viz block, hand-craft, TensorFlow.js)
│   └── (same shape; canvas + 训练循环)
├── block-agent-flow/                     # Track E3 (viz block, hand-craft, React Flow)
│   └── (same shape; DAG 编辑)
├── kernel-pyodide/                       # Track F (kernel impl)
│   ├── package.json (peer: kernel-adapter)
│   ├── tsconfig.json (refs: kernel-adapter)
│   ├── CONTRACT.md
│   └── src/
│       ├── index.ts
│       ├── adapter.ts                    # PyodideAdapter implements KernelAdapter
│       ├── session.ts                    # PyodideSession implements KernelSession
│       ├── boot.ts                       # 加载 Pyodide CDN + NumPy/Pandas/Matplotlib
│       └── __tests__/
│           ├── adapter.test.ts           # 接口契约
│           ├── session.test.ts           # exec() / interrupt() / events
│           └── matplotlib.test.ts        # 验证 display_data event 含 image/png
├── editor-toolbar/                       # Track G1 (editor 子模块, template)
│   ├── package.json
│   ├── tsconfig.json (refs: editor-commands, design-tokens)
│   ├── CONTRACT.md
│   └── src/
│       ├── index.ts
│       ├── Toolbar.tsx                   # Tiptap BubbleMenu wrapper
│       ├── buttons.ts                    # bold / italic / link / etc.
│       └── __tests__/
├── editor-slash-menu/                    # Track G2 (editor 子模块, codex-clone of toolbar)
│   └── (same shape; suggestion plugin + slash-command list)
└── editor-drag-handle/                   # Track G3 (editor 子模块, codex-clone of toolbar)
    └── (same shape; drag-handle 扩展 + reorder gesture)

scripts/
├── refactor-move.ts                      # Track I1 (codex-script-builder)
├── new-block.ts                          # Track I2 (codex-script-builder)
└── extract-pdf-text.ts                   # Track I3 (codex-script-builder; D2 prereq)

apps/site/src/content/notes/sample-blocks/index.mdx  # Wave 3 集成测烟测内容（含全部 8 种 block 实例）
                                                      # 注：与 apps/site/src/content/notes/sample-mdx-note/index.mdx (Wave 1 baseline) 区分
                                                      # sample-mdx-note: 验证 prose 渲染（B1 修 H1 后）
                                                      # sample-blocks: 验证全部 component block 渲染（Wave 3 集成）

docs/decisions/ADR-0008-wave-2-entry-policies.md  # Task A (Wave 2 entry ADR)
docs/decisions/ADR-0009-wave-2-close.md           # Task Z (close)

apps/site/src/__tests__/visual-smoke.spec.ts      # Track B2 (Playwright 视觉烟测)
apps/site/playwright.config.ts                    # Track B2

docs/audits/structure-2026-05.md                  # Track Z3 (structure-auditor 月度)
```

修改：

- `agent-contract.md` —— 不修改 agent 阵容（Pre-Task 0 已固化 20+8 模型）；如 Wave 2 中段需调整 trigger / 加 capability，refactorer 改 + ADR
- `tsconfig.json`（root）—— `references` 数组扩展含全部新 ts package（11 个新 + Wave 1 已有 = 19 references）
- `apps/site/src/content/notes/sample-mdx-note/index.mdx` —— Track B1 删 `# Sample` H1（Wave 1 erratum 顺手清单）
- `packages/block-foundation/CONTRACT.md` —— Track A2 加"如何注册"walkthrough（structure-auditor 推荐 #2）
- `packages/mdx-bridge/CONTRACT.md` —— Track J（如触发）attr-bearing mark 扩展：wrapMark + marksEqual + fixture
- `packages/mdx-bridge/package.json` —— Task A1 按 ADR-0008 决议：去 `@skb/block-foundation` 与 `@skb/content-types` 死依赖（如选 Option A）OR 加 tsconfig refs 同步（如选 Option B）
- `packages/block-foundation/package.json` —— Task A1 同上对 F2 处理

---

## 执行模型：Claude Code Agent Team（ADR-0004 + ADR-0007）

**Wave 2 起 8 个 codex agent 已不在 team config**（ADR-0007 D5 实施于 Pre-Task 0 commit `691bc30`）。

简要：
- Wave 2 一个 team（`TeamCreate({team_name: "phase-1-wave-2"})`）
- **20 个 Claude teammate** 通过 `Agent({subagent_type, team_name, name, prompt})` 实例化为长期 idle 的 teammate（T0:1 + T1:11（含 **ux-ui-lead**）+ T2:4 + T3:4，按需复用 T3 audit）
- **8 个 codex tool pattern** 由 orchestrator 直接通过 Bash 调用 `codex exec --profile <name> "<prompt>" < /dev/null > docs/audits/codex-runs/<date>-<task>-<pattern>.txt 2>&1`，**不**在 team config（详见 [docs/runbooks/codex-tool-invocations.md](../../runbooks/codex-tool-invocations.md)）
- Plan 里的每个 task 对应共享 `TaskList` 一条 entry（`TaskCreate`），依赖用 `blocked_by` 表达
- review 链由 `SendMessage` 触发；reviewer / git-operator 永久 idle 等消息
- 所有 spawn 的 teammate 起手 prompt **必须前置注入** [`docs/runbooks/team-operations.md`](../../runbooks/team-operations.md) 内容
- **`ux-ui-lead` spawn prompt 必须额外注入**三个设计 skill 全文（ADR-0007 D4）：`frontend-design` + `ui-ux-pro-max-skill` + `web-design-guidelines`

详见 [ADR-0004](../../decisions/ADR-0004-agent-team-dispatch-model.md) + [ADR-0007](../../decisions/ADR-0007-job-function-codex-heavy-execution.md) + [team-operations.md](../../runbooks/team-operations.md)。

每个 task 顶端的 "Owner:" 字段为该 task 的 teammate name（Claude）或 tool pattern（codex Bash）。

---

## 总览：10 主任务（~28 sub-tasks，per-package PR 拆分）+ Pre-Task 0 团队启动

主任务：A（dead-dep ADR + RFC）/ B（Wave 1 errata 清理）/ C（simple blocks）/ D（render blocks）/ E（viz blocks）/ F（kernel-pyodide）/ G（editor 子模块）/ I（scripts）/ J（attr-mark 条件触发）/ Z（close）。Task H（test scaffold sweep）已合并入各 track（plan-challenger CRITICAL #1 修订）。

> **plan-challenger 修订（2026-04-30）**：
> - Task H 改为"跟随每个 track 完成首个包后跑 scaffold sweep"（不是 Pre-Task 0 阶段大批量跑）
> - Track C6（render+viz ui-default）改为"克隆包结构+测试骨架+视觉契约执行；UI 交互逻辑由 render-block-eng / viz-block-eng hand-craft；ux-ui-lead 仅审视觉一致性"
> - Track J trigger 改为 ALL block-* PR 静态 attr-mark 扫描，不限于 Track C
> - B2 显式 blocked_by B1
> - I1/I2/I3 改为串行（refactor-move → new-block → extract-pdf-text，root tsconfig 共享冲突避免）
> - codex-clone 每 PR 限制 1 包（per-package PR 粒度）
> - E1 matplotlib smoke test 用 mock event schema，不走真实 Pyodide CDN
> - A2 视为 D2 row 1（修 CONTRACT.md 类）—— 启用 pr-gate（与 challenger OBS 4 一致）

```
Pre-Task 0: TEAM BOOTSTRAP (orchestrator only)
   │  TeamCreate phase-1-wave-2 + spawn 20 teammates + 注入 team-operations.md
   │  + ux-ui-lead 注入 3 设计 skill (ADR-0007 D4)
   │  + TaskCreate × ~28 sub-tasks with d2_row meta annotations
   ▼
   ├──► Task A1: ADR-0008 dead-dep policy (refactorer)
   │       │
   │       ▼
   │    Task A2: block-foundation/RFC.md (block-foundation-eng)
   │       │  (block-* track 全部 blocked_by A2)
   │       │
   ├──► Task B1: detail 页 duplicate H1 修 (editor-integrator)
   │       │
   │       ▼
   │    Task B2: apps/site Playwright 视觉烟测 (editor-integrator) [blocked_by B1]
   │
   ├──► Task B3: agent-contract.md schema 注释 + team-operations.md ~155 +
   │             spec §3.13 deferred items 清理 (refactorer)
   │
   ├──► Task I1: scripts/refactor-move.ts (codex-script-builder tool)
   │       │
   │       ▼
   │    Task I2: scripts/new-block.ts (codex-script-builder tool) [blocked_by I1]
   │       │
   │       ▼
   │    Task I3: scripts/extract-pdf-text.ts (codex-script-builder tool) [blocked_by I2]
   │
   ▼ A2 完成 + I2 完成 后启动 block-* track（C/D/E/F/G）
┌──────────────┬─────────────┬─────────────┬─────────────┬──────────┐
│              │             │             │             │          │
▼              ▼             ▼             ▼             ▼          ▼
Track C       Track D      Track E       Track F      Track G    Track J
Simple        Render       Viz           Kernel       Editor     (条件触发,
                                                                  全 block-* PR
                                                                  静态扫描)

C1 callout    D1 math      E1 jupyter   F pyodide    G1 toolbar
   core+UI       core+UI    core+UI       adapter+      (template
   (template)    (handcraft  (handcraft;  session       by editor-eng)
                  by render-  blocked_by  (handcraft       │
C2 callout      block-eng;   F)           by kernel-      ▼
   ui-default    ux-ui-lead                pyodide-eng) G2 slash-menu
   (template     视觉审)                                  (codex-clone of G1)
   by ux-ui-lead)            E2 nn-viz                G3 drag-handle
                D2 pdf       core+UI                     (codex-clone of G1)
C3 code        core+UI       (handcraft)
   core         (handcraft;
   (codex-clone  blocked_by  E3 agent-flow            (G2/G3 视觉审 by ux-ui-lead)
   of C1, 单 PR) I3 extract-  core+UI
                pdf-text)    (handcraft)
C4 image                                              Track J 触发条件:
   core         (D1/D2 ui-                            mdx-doctor 静态扫描
   (codex-clone  default 由                           任一 block-* PR
   of C1, 单 PR) render-block-                        propsSchema 引入
                eng hand-                             attr-bearing field
C5a code        craft + ux-                           → 同 PR 内补
   ui-default   ui-lead                                 mdx-bridge wrapMark
   (codex-clone  视觉一致性                              + marksEqual + 双
   of C2, 单 PR) 审)                                   fixture
C5b image
   ui-default
   (codex-clone of C2, 单 PR)

(block-math/pdf/jupyter/nn-viz/agent-flow 的 ui-default 由各自工种 hand-craft 与
 core 同 PR 提交；ux-ui-lead 视觉一致性审 vs design-tokens "消费方使用规范" checklist。
 不再像 v1 那样要求 codex-block-generator 仿造 5 个 render+viz ui-default)

   │
   └─► Task Z (Wave 2 close)
           Z1: ADR-0009 Wave 2 close (errata + commits + structure baseline)
           Z2: structure-auditor 第二次审计 (docs/audits/structure-2026-05.md)
           Z3: docs/plans/active.md 重指 Wave 3
           Z4: 团队 shutdown ceremony + TeamDelete phase-1-wave-2
```

**并行度（修订后）**：
- Pre-Task 0 → Task A1（dead-dep ADR）+ Task B1（H1 修，独立）+ Task I1（refactor-move，独立）**同时启动**
- B1 完成 → Task B2（Playwright，blocked_by B1 因依赖单 H1 + theme-toggle）
- Task A1 完工 → Task A2（block-foundation/RFC.md）
- I1 完工 → I2（new-block，依赖 refactor-move 已就绪以做包脚手架移动） → I3（extract-pdf-text，串行，避免 codex tool 并发改 scripts/__tests__/ + root tsconfig 共享冲突）
- A2 完工 + I2 完工 → 启动 block-* track（C/D/E/G）
- Track F (kernel-pyodide) 与 block-* 并行；E1 (block-jupyter) 等 F 完工
- **Task H test scaffold sweep 时序改**：不再 Pre-Task 0 大批量；改为每 Track 创建首个包后单独跑 codex-test-scaffolder（Track C 跑 1 次 callout package；Track D 跑 1 次 math + 1 次 pdf；Track E 跑 3 次；Track F 跑 1 次；Track G 跑 1 次 toolbar package；其他 codex-clone 的包测试由 codex-block-generator 在 clone 时直接产骨架）
- Track J（mdx-bridge attr-mark 扩展）conditional + **静态 attr-mark 扫描挂全部 block-* PR**：
  - 在 mdx-doctor 的 RTT 检查中加一步 `grep -rE "z\.object\(.*\)" packages/block-*/src/core/core-definition.ts`，自动识别新 attr-bearing mark
  - 任何 block-* PR 引入新 attr-bearing mark → 自动触发 Track J 同 PR 内合并修
- Task Z 等全部 PR commit + push + CI 全绿

总等待 = max(F + E1, max(C, D, G), max(B, I)) + A1+A2 + Z

---

## Pre-Task 0: Team Bootstrap

**Owner**: orchestrator（主 session 内执行；这一步**没有** team 可言）
**Risk level**: 中（一旦 team 起好，后续都依赖；team 配置错会让整 wave 卡住）
**Files**: 无新建；只在 `~/.claude/teams/phase-1-wave-2/config.json` + `~/.claude/tasks/phase-1-wave-2/` 留运行时痕迹
**Why first**：本 wave 全部其他 task 都假定 team 已就绪 + TaskList 已登记。

- [ ] **Step 1**：读核心文档校准认知

```bash
cat docs/decisions/ADR-0001-stack-selection.md
cat docs/decisions/ADR-0002-wave-1-close.md
cat docs/decisions/ADR-0003-headless-presentational-split.md
cat docs/decisions/ADR-0004-agent-team-dispatch-model.md
cat docs/decisions/ADR-0006-asymmetry-audit-checklist.md
cat docs/decisions/ADR-0007-job-function-codex-heavy-execution.md
cat docs/runbooks/team-operations.md
cat docs/runbooks/codex-tool-invocations.md
cat docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md   # 全文（已 LOCKED）
cat docs/audits/structure-2026-04-29-wave-1.md
cat docs/plans/active.md
cat docs/plans/phase-1/plan.md
cat agent-contract.md
```

读完确认理解：
- Team = TaskList（1:1）；teammate name 唯一
- 依赖用 `blocked_by` 表达；review 用 `SendMessage` 触发
- ADR-0007 D5 8 个 codex agent 是 Bash invocation tool patterns，**不** spawn teammate
- review chain 默认 codex 5.3-spark + orchestrator 自检；高风险 PR 才升级
- ux-ui-lead 是 Wave 2 第一次 spawn 的新 teammate（ADR-0007 D1）

- [ ] **Step 2**：`TeamCreate` 启动 phase-1-wave-2

```typescript
TeamCreate({
  team_name: "phase-1-wave-2",
  description: "Phase 1 Wave 2: implementation layer (8 component blocks × core+ui-default + 3 editor 子模块 + kernel-pyodide)",
});
```

- [ ] **Step 3**：把 `TaskList` 一次性建满（每个 task header 注明 ADR-0007 D2 row 触发）

```typescript
// Task A: dead-dep ADR + RFC freeze
TaskCreate({task_name: "task-A1-adr-0008-dead-dep", blocked_by: [], meta: {d2_row: 4}});  // 触发新 ADR
TaskCreate({task_name: "task-A2-block-foundation-rfc", blocked_by: ["task-A1-adr-0008-dead-dep"], meta: {d2_row: 1}});  // 视为 CONTRACT-level (challenger OBS 4)

// Task B: Wave 1 erratum 清理 (B2 显式依赖 B1)
TaskCreate({task_name: "task-B1-duplicate-h1-fix", blocked_by: [], meta: {d2_row: null}});  // 普通 PR
TaskCreate({task_name: "task-B2-playwright-visual-smoke", blocked_by: ["task-B1-duplicate-h1-fix"], meta: {d2_row: 8}});  // CI workflow 改
TaskCreate({task_name: "task-B3-deferred-items-cleanup", blocked_by: [], meta: {d2_row: 3}});  // 修 spec + agent-contract

// Task I: scripts (串行，避免 root tsconfig 共享冲突)
TaskCreate({task_name: "task-I1-refactor-move", blocked_by: [], meta: {d2_row: null}});
TaskCreate({task_name: "task-I2-new-block", blocked_by: ["task-I1-refactor-move"], meta: {d2_row: null}});
TaskCreate({task_name: "task-I3-extract-pdf-text", blocked_by: ["task-I2-new-block"], meta: {d2_row: null}});

// Track F: kernel impl
TaskCreate({task_name: "track-F-kernel-pyodide", blocked_by: ["task-A2-block-foundation-rfc"], meta: {d2_row: 1}});

// Track C: simple blocks (per-package PR 粒度)
TaskCreate({task_name: "task-C1-callout-core", blocked_by: ["task-A2-block-foundation-rfc", "task-I2-new-block"], meta: {d2_row: 1}});  // 第一个 block-foundation consumer，含 row 6 跨 3+ pkg
TaskCreate({task_name: "task-C2-callout-ui-default", blocked_by: ["task-C1-callout-core"], meta: {d2_row: 1}});
TaskCreate({task_name: "task-C3-code-core", blocked_by: ["task-C1-callout-core"], meta: {d2_row: 1}});  // codex-clone of C1
TaskCreate({task_name: "task-C4-image-core", blocked_by: ["task-C1-callout-core"], meta: {d2_row: 1}});
TaskCreate({task_name: "task-C5a-code-ui-default", blocked_by: ["task-C2-callout-ui-default", "task-C3-code-core"], meta: {d2_row: 1}});
TaskCreate({task_name: "task-C5b-image-ui-default", blocked_by: ["task-C2-callout-ui-default", "task-C4-image-core"], meta: {d2_row: 1}});

// Track D: render blocks
TaskCreate({task_name: "task-D1-math", blocked_by: ["task-A2-block-foundation-rfc"], meta: {d2_row: 1}});
TaskCreate({task_name: "task-D2-pdf", blocked_by: ["task-A2-block-foundation-rfc", "task-I3-extract-pdf-text"], meta: {d2_row: 1}});

// Track E: viz blocks
TaskCreate({task_name: "task-E1-jupyter", blocked_by: ["track-F-kernel-pyodide"], meta: {d2_row: 1}});
TaskCreate({task_name: "task-E2-nn-viz", blocked_by: ["task-A2-block-foundation-rfc"], meta: {d2_row: 1}});
TaskCreate({task_name: "task-E3-agent-flow", blocked_by: ["task-A2-block-foundation-rfc"], meta: {d2_row: 1}});

// Track G: editor 子模块
TaskCreate({task_name: "task-G1-toolbar", blocked_by: ["task-A2-block-foundation-rfc"], meta: {d2_row: 1}});
TaskCreate({task_name: "task-G2-slash-menu", blocked_by: ["task-G1-toolbar"], meta: {d2_row: 1}});  // codex-clone of G1
TaskCreate({task_name: "task-G3-drag-handle", blocked_by: ["task-G1-toolbar"], meta: {d2_row: 1}});  // codex-clone of G1

// Track J (条件触发；mdx-doctor 静态扫描自动判定)
TaskCreate({task_name: "task-J-mdx-attr-mark", blocked_by: [], meta: {d2_row: 1, conditional: "any block-* PR introduces attr-bearing mark per static scan"}});

// Task Z (5 sub-tasks)
TaskCreate({task_name: "task-Z0-sample-blocks-content", blocked_by: ["task-C5b-image-ui-default", "task-D2-pdf", "task-E1-jupyter", "task-E2-nn-viz", "task-E3-agent-flow"], meta: {d2_row: 6}});  // 跨 ≥3 packages
TaskCreate({task_name: "task-Z1-adr-0009-wave-2-close", blocked_by: ["task-Z0-sample-blocks-content"], meta: {d2_row: 4}});  // 触发 ADR-0009
TaskCreate({task_name: "task-Z2-structure-audit-2026-05", blocked_by: ["task-Z1-adr-0009-wave-2-close"], meta: {d2_row: null}});  // 普通 PR
TaskCreate({task_name: "task-Z3-active-md-repoint", blocked_by: ["task-Z2-structure-audit-2026-05"], meta: {d2_row: null}});  // 普通 PR
TaskCreate({task_name: "task-Z4-team-shutdown", blocked_by: ["task-Z3-active-md-repoint"], meta: {d2_row: null}});  // orchestrator only
```

注：`meta.d2_row` null 表示常规 PR（仅 codex 5.3-spark + orchestrator 自检；无 pr-gate / no Claude pr-reviewer）。
`d2_row: 1` → +pr-gate +pr-reviewer。`d2_row: 3` → 仅 +pr-reviewer。`d2_row: 4/8` → +pr-gate +pr-reviewer。每个 task spawn 时 orchestrator 必须从 meta 读 row 标定 review chain（避免按经验漏判，challenger OBS 2）。

- [ ] **Step 4**：spawn 20 个 teammate（按 tier 顺序，每个注入 team-operations.md）

```typescript
// Tier 0
Agent({subagent_type: "orchestrator", team_name: "phase-1-wave-2", name: "orchestrator", prompt: TEAM_OPS + ORCHESTRATOR_DESCRIPTION});

// Tier 1 Workers (11 — including ux-ui-lead per ADR-0007 D1)
for (const role of [
  "block-foundation-eng", "simple-block-eng", "render-block-eng", "viz-block-eng",
  "mdx-bridge-eng", "kernel-architect", "kernel-pyodide-eng",
  "editor-eng", "editor-integrator", "api-builder",
]) {
  Agent({subagent_type: role, team_name: "phase-1-wave-2", name: role, prompt: TEAM_OPS + agentDescription(role)});
}

// ux-ui-lead 特殊：注入三个设计 skill 全文 (ADR-0007 D4)
Agent({
  subagent_type: "ux-ui-lead",
  team_name: "phase-1-wave-2",
  name: "ux-ui-lead",
  prompt: TEAM_OPS + UX_UI_LEAD_DESCRIPTION
        + SKILL_FRONTEND_DESIGN_FULL_TEXT
        + SKILL_UI_UX_PRO_MAX_FULL_TEXT
        + SKILL_WEB_DESIGN_GUIDELINES_FULL_TEXT,
});

// Tier 2 Process (4)
for (const role of ["pr-reviewer", "git-operator", "refactorer", "researcher"]) {
  Agent({subagent_type: role, team_name: "phase-1-wave-2", name: role, prompt: TEAM_OPS + agentDescription(role)});
}

// Tier 3 Audit (4 — spawn 按需复用 / 提前 idle 都行)
for (const role of ["structure-auditor", "performance-auditor", "mdx-doctor", "link-checker"]) {
  Agent({subagent_type: role, team_name: "phase-1-wave-2", name: role, prompt: TEAM_OPS + agentDescription(role)});
}
```

- [ ] **Step 5**：监控 ux-ui-lead spawn token 消耗（ADR-0007 D4 监控点）

```bash
# spawn 完成后查看 token usage（应 ~2× 普通 worker）
# 如超过 2.5×，考虑分阶段注入而非一次性灌；记入 ADR-0009 errata
```

- [ ] **Step 6**：dispatch Task A / B / H / I（4 路并行）

```typescript
SendMessage({to: "refactorer", summary: "Task A1 dead-dep ADR", message: TASK_A1_PROMPT});
SendMessage({to: "block-foundation-eng", summary: "Task A2 RFC after A1", message: TASK_A2_PROMPT_BLOCKED_BY_A1});
SendMessage({to: "editor-integrator", summary: "Task B1+B2 erratum", message: TASK_B_PROMPT});
// Task H + Task I 是 codex tool 调用，orchestrator 直接 Bash 调度（见 Task H / Task I 段）
```

---

## Task A: Wave 2 Entry Policies（必须先于全部 block-* track）

**Owner**:
- A1: `refactorer`（write_adr 权限）+ `api-builder` (apps/api 同步如需)
- A2: `block-foundation-eng`

**Risk level**: 高（PR 命中 ADR-0007 D2 row 4 "触发新 ADR" → +pr-gate +pr-reviewer）
**Why first**: A1 决议 dead-dep 政策，影响 mdx-bridge / block-foundation / 全部 block-* package.json 形态；A2 freeze block-foundation 注册 API 形态，blocks all block-* track 入门。

### Task A1: ADR-0008 — dead-dep policy global resolution

**Files:**
- Create: `docs/decisions/ADR-0008-wave-2-entry-policies.md`
- Modify (per Option A 决议): `packages/mdx-bridge/package.json`（去 `@skb/block-foundation` + `@skb/content-types` 两个 dead deps）
- Modify (per Option A 决议): `packages/block-foundation/package.json`（去 `@skb/content-types` dead dep）+ `packages/block-foundation/tsconfig.json`（去 ref）
- Modify (per Option B 决议)：保留 deps，加 `mdx-bridge/tsconfig.json#references`，更新两个 CONTRACT.md
- Modify: `packages/mdx-bridge/CONTRACT.md` § "Wave 1 declared peers"（按选定 Option 改语义）
- Modify: `packages/block-foundation/CONTRACT.md` § "Wave 1 forward-compat"（同上）

- [ ] **Step 1: 读 structure-auditor §7 推荐 #1 + ADR-0002 erratum #19/#20**

详见：
- `docs/audits/structure-2026-04-29-wave-1.md` §"Top 3 structural concerns" → recommendation #1（pick Option A or B）
- `docs/decisions/ADR-0002-wave-1-close.md` erratum #19 (F1 mdx-bridge) + #20 (F2 block-foundation)

- [ ] **Step 2: 决议 Option A vs Option B（refactorer 判断）**

**推荐 Option A**：tighten "every package.json @skb/* 必须有对应 source import"。理由：
- audit invariant 更简洁：dead-dep = bug，不必维护"forward-compat"特例
- mdx-bridge / block-foundation 真用上时再加 dep；CONTRACT 仍可 prose 描述意图
- structure-auditor 月度检查可机械化（grep 比 CONTRACT 文本对比更靠谱）

如选 Option B，理由必须充分（如 npm publish 需 forward-compat package.json 形态）。

- [ ] **Step 3: 写 ADR-0008**

```markdown
# ADR-0008: Wave 2 entry policies — dead-dep + block-foundation interface freeze

| 字段 | 值 |
|------|---|
| 状态 | accepted |
| 日期 | <fill> |
| 作者 | refactorer (Claude sonnet-4-6) |
| 触发 | structure-auditor Wave 1 close baseline §7 推荐 #1（dead-dep policy）+ #2（block-foundation interface freeze） |
| 替代 | 不替代任何 ADR；扩展 ADR-0001 §2.2 monorepo 规则 + ADR-0003 D2 双层接口 |

## Context

structure-auditor Wave 1 close 报告 §7 提出 3 个结构关注点；其中 #1（dead-dep policy）+ #2（block-foundation interface freeze）必须在 Wave 2 第一个 block-* PR 之前 lock。

ADR-0002 erratum #19 + #20 描述当前两处 dead-dep（F1 mdx-bridge 声明 block-foundation/content-types 不 import；F2 block-foundation 声明 content-types 不 import）。

## Decision

### D1: dead-dep policy = Option A（tighten）

每个 `package.json#dependencies/peerDependencies` 中的 `@skb/*` 必须对应至少一个源码 `from '@skb/<pkg>'` import。CONTRACT.md 可在 prose 段落表达 forward-compat 意图（"Wave 3 will consume X"），但**不在 package.json 占位**。

具体执行：
- mdx-bridge: 去 `@skb/block-foundation` + `@skb/content-types` deps；CONTRACT § "Wave 1 declared peers" 改 prose 表达
- block-foundation: 去 `@skb/content-types` dep + tsconfig ref；CONTRACT 加 prose

(具体 commit 由 refactorer 执行；structure-auditor 月度检查实施。)

### D2: block-foundation 注册 API freeze（spec for first real consumer block-callout）

在 `packages/block-foundation/RFC.md` (新增) 写 walkthrough："block-callout 如何注册 core + ui-default 到 BlockRegistry"：
- registerCore + propsSchema + mdxComponent name + serialize/parse hook 形状
- registerUI + uiId + EditorView/RenderView 类型契约
- 错误场景（unknown core / 重复 uiId）的 throw 行为
- consumer-side 测试样板（block-callout/__tests__/registry-integration.test.ts）

第一个 block-* PR（block-callout core）必须 reference 此 RFC；后续 block-* PR 沿用模式。RFC.md 不是 CONTRACT.md（不规定 public API 形状），是 walkthrough（教 consumer 如何用）。

## Consequences

正面：
- audit invariant 简洁；structure-auditor 机械可检
- block-foundation 接口在 block-callout 入门前 freeze，预防 R-round inflation

负面：
- 若 Phase 3 npm publish 阶段需要 forward-compat package.json，会重新审视

## Implementation

1. ADR-0008 commit（本 ADR 自身；触发 D2 row 4 高风险）
2. mdx-bridge package.json + CONTRACT 同 commit
3. block-foundation package.json + tsconfig.json + CONTRACT 同 commit
4. block-foundation/RFC.md（A2 task；blocks block-callout PR）

## Related
- ADR-0001 / ADR-0002 / ADR-0003
- structure-auditor Wave 1 close §7
```

- [ ] **Step 4: 应用 D1（dead-dep cleanup）**

```bash
# mdx-bridge package.json 删除两条 deps
# mdx-bridge/CONTRACT.md § "Wave 1 declared peers" 改 prose
# block-foundation package.json + tsconfig.json 同步
# block-foundation/CONTRACT.md prose 同步
```

- [ ] **Step 5: 跑测试 + size-check + link-check**

```bash
pnpm typecheck && pnpm test && pnpm size-check && pnpm link-check
# 应全 PASS（无 source 改动；只删 unused deps + ref）
```

- [ ] **Step 6: 准备 ready-for-review**

review chain（D2 row 4 触发条件 "触发新 ADR 创建"）：
- codex 5.3-spark code-reviewer
- codex 5.5 pr-gate（深审）
- Claude pr-reviewer（spec-match + 跨包影响）
- git-operator commit + push

### Task A2: block-foundation/RFC.md — "如何注册" walkthrough

**Files:**
- Create: `packages/block-foundation/RFC.md`
- Modify: `packages/block-foundation/CONTRACT.md`（加 1 行指向 RFC.md "如何注册" walkthrough）

**Owner**: `block-foundation-eng`（**blocked_by A1**：ADR-0008 D2 才会冻结接口形状）

**ADR-0007 D2 触发**：row 1（修 CONTRACT.md，因 RFC 是 CONTRACT-level interface freeze；plan-challenger OBS 4 一致）→ +pr-gate +pr-reviewer。

- [ ] **Step 1**: 写 RFC walkthrough（伪代码 + 真实测试样板）

```markdown
# RFC: How a block-* package registers with @skb/block-foundation

> **Audience**: simple-block-eng / render-block-eng / viz-block-eng + ux-ui-lead writing block-callout / block-code / etc.
> **Authority**: ADR-0008 D2 freezes this interface as of <DATE>.

## 1. core/ side

```typescript
// packages/block-callout/src/core/core-definition.ts
import type { BlockCoreDefinition } from '@skb/block-foundation';
import { z } from 'zod';

const propsSchema = z.object({
  variant: z.enum(['note', 'tip', 'warning', 'danger']),
  title: z.string().optional(),
}).strict();

export const calloutCore: BlockCoreDefinition<typeof propsSchema> = {
  name: 'callout',
  kind: 'component',
  propsSchema,
  mdxComponent: 'Callout',  // PascalCase — 出现在 MDX 文件
};
```

注册（由 editor-shell or apps/site boot path 在 Wave 3 调）：

```typescript
import { BlockRegistry } from '@skb/block-foundation';
import { calloutCore } from '@skb/block-callout/core';
import { calloutUI } from '@skb/block-callout/ui-default';

const registry = new BlockRegistry();
registry.registerCore(calloutCore);
registry.registerUI(calloutUI);  // throws if calloutCore.name not yet registered
```

## 2. ui-default/ side

(类似走过 BlockUIDefinition 的 EditorView / RenderView 注册流程)

## 3. 测试样板

(integration test：register core → register UI → getCore → getUI → 序列化往返)

## 4. 错误场景

- registerUI 时 coreName 不存在 → throw Error("unknown core: <name>")
- 重复 registerCore 同 name → throw Error("core already registered: <name>")
- propsSchema 不是 ZodObject → typescript 错误（编译期）
```

- [ ] **Step 2**: review chain（D2 row 1 — RFC 是 CONTRACT-level interface freeze, plan-challenger 修订）：
- codex 5.3-spark code-reviewer
- codex 5.5 pr-gate（深审：是否冻结到位 / 是否所有错误场景覆盖）
- Claude pr-reviewer（spec match + 跨包影响）
- git-operator

---

## Task B: Wave 1 Erratum 清理（并行启动，低风险）

**Owner**: `editor-integrator` (B1+B2) + `refactorer` (B3)
**Risk level**: 低（apps/site 已有 / docs/runbooks 已有，只补漏）
**Why parallel**: 不依赖 A，可与 A 并行

### Task B1: detail 页 duplicate H1 修

**File**: `apps/site/src/content/notes/sample-mdx-note/index.mdx`

- [ ] **Step 1**: 删 sample MDX 的 `# Sample` 行（保留 layout `<h1>{title}</h1>`，title 来自 frontmatter）
- [ ] **Step 2**: `pnpm dev` 本地确认渲染只一个 H1
- [ ] **Step 3**: review chain 极简（D2 不触发，仅 codex 5.3-spark + orchestrator 自检 + git-operator）

### Task B2: apps/site Playwright 视觉烟测脚手架

**Owner**: `editor-integrator`
**Blocked by**: B1（B2 case 期望 detail 页单 H1，B1 完成后才能稳定通过）

**Files:**
- Create: `apps/site/playwright.config.ts`
- Create: `apps/site/src/__tests__/visual-smoke.spec.ts`
- Modify: `apps/site/package.json`（加 `@playwright/test` devDep at PINNED VERSION + `test:visual` script）
- Modify: `.github/workflows/ci.yml`（加 visual-smoke job + Playwright 浏览器缓存）

- [ ] **Step 1**: 装依赖（pin 版本 + browser cache 策略，plan-challenger NICE 9）

```bash
# Pin @playwright/test 版本（防 minor bump 引入 fixture 行为差异）
cd apps/site && pnpm add -D @playwright/test@1.49.0
# 装 chromium（CI 用 actions/cache@v4 缓存 ~/.cache/ms-playwright/）
npx playwright install --with-deps chromium
```

CI workflow 加 step：

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-1.49.0
- run: pnpm exec playwright install --with-deps chromium
- run: pnpm --filter @skb/site test:visual
```

- [ ] **Step 2**: 写 playwright.config.ts（用 `webServer` 启 astro dev）
- [ ] **Step 3**: 写 visual-smoke.spec.ts 含 3 case：

```typescript
test('home page renders', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});

test('detail page renders sample note', async ({page}) => {
  await page.goto('/notes/sample-mdx-note');
  // 单一 H1（由 B1 确保）
  expect(await page.locator('h1').count()).toBe(1);
});

test('theme toggle switches data-theme', async ({page}) => {
  await page.goto('/');
  await page.click('[data-testid="theme-toggle"]');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
```

- [ ] **Step 4**: 加 `test:visual` script + GitHub Actions step（CI 跑 chromium）
- [ ] **Step 5**: review chain（D2 row 8 触发"CI workflow 改"，但 visual smoke 是 add-only step——评估为低风险）

### Task B3: deferred items 清理（agent-contract.md schema annotation 约定 + team-operations.md ~155 + spec §3.13）

**Files:**
- Modify: `agent-contract.md`（加 1-line schema 注释解释 `# ADR-0007 D2 row N` 约定）
- Modify: `docs/runbooks/team-operations.md` ~line 155 prose 加 D2 row 数枚举
- Modify: `docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md` §3.13:1047 配置示例 YAML 删 `core_arch_touch` (跟 ADR-0007 D2 同步)

- [ ] **Step 1**: agent-contract.md 加 schema 段注释

```yaml
tool_patterns:
  # NOTE: pr-gate.triggered_by entries MUST carry inline `# ADR-0007 D2 row N` annotations
  # (rows 1/2/4/8 are the pr-gate triggers per D2 carve-out). See follow-up² PR 932a919.
  - name: <pattern-id>
    ...
```

- [ ] **Step 2**: team-operations.md ~155 改

before:
> orchestrator 在派 review 时如果检测到以下任一，追加 pr-gate 5.5 review：
> （列表）

after:
> orchestrator 在派 review 时按 ADR-0007 D2 表 8 行判断；rows 1/2/4/8（CONTRACT 变化 / 新增删除包 / 新 ADR / CI-auth-security）追加 pr-gate；rows 3/5/6/7（spec/ADR 文档 / 删除重命名包 / 跨 3+ 包 / perf-auditor 标记）仅追加 Claude pr-reviewer。

- [ ] **Step 3**: spec §3.13:1047 配置示例 YAML 删 `core_arch_touch`（跟 D2 + agent-contract.md 同步）
- [ ] **Step 4**: `pnpm generate:configs` 同步生成产物（CLAUDE.md / AGENTS.md / runbook 不应有 diff——schema 注释不渲染）
- [ ] **Step 5**: review chain（D2 row 3 修 spec + agent-contract.md + ADR）：codex 5.3-spark + Claude pr-reviewer + git-operator

---

## Task H: 测试脚手架（per-track inline，不再批量 sweep）

**plan-challenger 修订（CRITICAL #1）**：原 Pre-Task 0 阶段批量 scaffold 11 个不存在的 package 不可行 —— codex-test-scaffolder 期望目标目录已存在；强行批量会与后续 Track C/D/E/G 创建包时冲突。

**修订后**：

- 每个 Track 创建首个包后，由该 track 的 worker（或其调度的 codex-test-scaffolder tool 调用）在 TDD step 1 内同时产生 `__tests__/` 骨架 + 第一个真测试（红色）
- 不需要单独的 Task H 入口；测试骨架是每个 block-* / editor-* / kernel-* package 创建工作的一部分
- codex-block-generator 在 clone 模式下天然包含测试骨架（按 template 仿造）—— 不再需要单独 codex-test-scaffolder 调用
- 仅在以下情况单独调 codex-test-scaffolder：
  - 某 track worker 完成业务逻辑后发现 `__tests__/` 骨架缺关键 helper（如 mock factory），调 codex-test-scaffolder 补
  - Wave 2 中段如有 Wave 3 prerequisite 需要 spec/contract 测试骨架预生成

**结论**：与"总览"段一致 —— 10 主任务（A/B/C/D/E/F/G/I/J/Z）+ Pre-Task 0 = 11 entries；H 已合并入各 track 的 TDD step 1（不再独立 task entry）。

---

## Task I: scripts（codex-script-builder tool，**串行**避免 root tsconfig 冲突）

**plan-challenger 修订（NICE 7）**：I1/I2/I3 并行会触及 `scripts/` 目录 + 共享 root `tsconfig.json` `references` 数组，并发 codex 调用可能互相覆盖。改为串行：I1 → I2 → I3。

**Owner**: orchestrator-direct Bash → `codex exec --profile scaffolder`
**Risk level**: 低 (CLI 脚本) / 中 (refactor-move 可能误删文件)
**Files**: `scripts/refactor-move.ts` / `scripts/new-block.ts` / `scripts/extract-pdf-text.ts`

### Task I1: scripts/refactor-move.ts

- [ ] **Step 1**: orchestrator Bash 调 codex-script-builder

```bash
timeout 600 codex exec --profile scaffolder \
  "在 scripts/refactor-move.ts 写 CLI 工具：移动文件 + 同步更新 import 路径。
   - CLI: refactor-move <from> <to> [--dry-run]
   - 用 ts-morph 解析 .ts/.tsx 中的 import 语句
   - 移动文件后 grep 所有 import 改路径
   - --dry-run 打印将做改动不实际改
   - 错误处理：from 不存在 / to 已存在 → throw + exit 1
   - 测试 (scripts/__tests__/refactor-move.test.ts) 含 4 case (dry-run / 正常移 / from 不存在 / 路径冲突)" \
  < /dev/null > docs/audits/codex-runs/$(date +%F)-task-I1-refactor-move.txt 2>&1
```

- [ ] **Step 2-5**: review + commit

### Task I2: scripts/new-block.ts

```bash
timeout 600 codex exec --profile scaffolder \
  "在 scripts/new-block.ts 写 CLI 工具：基于 block-callout 模板生成新 block 包骨架。
   - CLI: new-block <name> --kind=simple|render|viz [--ui=default]
   - 复制 packages/block-callout/ 结构 → packages/block-<name>/
   - 替换文件内 'callout' → '<name>' / 'Callout' → '<Name>'
   - 更新 root tsconfig.json#references 加新包
   - 错误处理：包已存在 / Wave 2 之前调用（block-callout 模板未就绪） → throw
   - 测试含 3 case (生成成功 / 包已存在 / 模板未就绪)" \
  < /dev/null > docs/audits/codex-runs/$(date +%F)-task-I2-new-block.txt 2>&1
```

### Task I3: scripts/extract-pdf-text.ts（D2 block-pdf 前置）

```bash
timeout 600 codex exec --profile scaffolder \
  "在 scripts/extract-pdf-text.ts 写 CLI 工具：从 PDF 文件提取文本（用于 search-index）。
   - CLI: extract-pdf-text <pdf-path> [--output <txt>]
   - 用 pdf-parse 或 pdfjs-dist (worker thread)
   - 输出 plain text + 简单 OCR fallback（若 PDF 是扫描件，emit warning）
   - 测试用 fixtures/sample.pdf (3 页 plain text)" \
  < /dev/null > docs/audits/codex-runs/$(date +%F)-task-I3-extract-pdf-text.txt 2>&1
```

review chain：每个 script PR 走 codex 5.3-spark + orchestrator 自检（普通 PR）；I1 因 ts-morph 涉及文件改动，可能升级 pr-gate（评估）。

---

## Track C: Simple Block 集群（template + clone 模式）

**Owner**: `simple-block-eng` (template) + `ux-ui-lead` (ui-default template) + codex-block-generator (clone)
**Blocked by**: Task A2（block-foundation/RFC.md 必先）
**Risk level**: 高（block-callout core 是第一个 block-foundation 真实 consumer，触发 ADR-0007 D2 row 1 "改 CONTRACT.md" → +pr-gate +pr-reviewer）

### Track C 总览

```
C1: block-callout/core (simple-block-eng)            template ────┐
C2: block-callout/ui-default (ux-ui-lead)            template ────┤
C3: block-code/core   (codex-block-generator clone of C1)        ├──► C5: ux-ui-lead 视觉一致性 review
C4: block-image/core  (codex-block-generator clone of C1)        │
C5a: block-code/ui-default     (codex-clone of C2)               │
C5b: block-image/ui-default    (codex-clone of C2)               │
C6: render+viz blocks 的 ui-default 也由 codex-clone of C2 +  ────┘
    ux-ui-lead 视觉一致性 review (含 block-math/block-pdf
    /block-jupyter/block-nn-viz/block-agent-flow ui-default
    共 5 个；它们的 core 仍由 D/E track hand-craft)
```

### Task C1: block-callout/core（template by simple-block-eng）

**Files:**
- Create: `packages/block-callout/package.json`（exports 三入口）
- Create: `packages/block-callout/tsconfig.json`（refs: block-foundation, content-types, design-tokens）
- Create: `packages/block-callout/CONTRACT.md`
- Create: `packages/block-callout/src/core/{index,core-definition,serialize,parse}.ts`
- Create: `packages/block-callout/src/__tests__/core.test.ts`

- [ ] **Step 1: 创建 packages/block-callout/ 包壳 + tsconfig refs 注册（用 scripts/new-block.ts 协助）**

```bash
pnpm tsx scripts/new-block.ts callout --kind=simple --ui=default
# 创建 package.json / tsconfig.json / src/{core,ui-default,index}.ts 占位 / __tests__/ 空骨架
# 自动加 root tsconfig.json#references
```

- [ ] **Step 2: TDD — 先写 propsSchema 单测（red），针对具体行为不依赖 import resolution**

**plan-challenger 修订（NICE 5）**：原 step 2 把"包未 build → import 失败"作为预期红，会让 transient 配置错误被掩盖成"红"。改为对**已写入但未实现**的 propsSchema 做行为断言。

```typescript
// packages/block-callout/src/__tests__/core.test.ts
import { describe, it, expect } from 'vitest';
import { calloutCore } from '../core/core-definition';  // 占位文件已创建（new-block 产）

describe('calloutCore.propsSchema', () => {
  it('accepts valid variant + optional title', () => {
    expect(calloutCore.propsSchema.parse({variant: 'note'})).toEqual({variant: 'note'});
    expect(calloutCore.propsSchema.parse({variant: 'tip', title: 'Pro tip'})).toEqual({variant: 'tip', title: 'Pro tip'});
  });

  it('rejects unknown variant', () => {
    expect(() => calloutCore.propsSchema.parse({variant: 'foo'})).toThrow(/invalid_enum_value|invalid_value/);
  });

  it('rejects unknown keys (.strict)', () => {
    expect(() => calloutCore.propsSchema.parse({variant: 'note', extra: 'x'})).toThrow(/unrecognized_keys/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(calloutCore.name).toBe('callout');
    expect(calloutCore.kind).toBe('component');
    expect(calloutCore.mdxComponent).toBe('Callout');
  });
});
```

红色来源是**业务逻辑断言失败**（占位文件 propsSchema 是 `z.never()` / 占位），不是 import 解析失败。

- [ ] **Step 3: 写 core/core-definition.ts**

```typescript
// packages/block-callout/src/core/core-definition.ts
import type { BlockCoreDefinition } from '@skb/block-foundation';
import { z } from 'zod';

const propsSchema = z.object({
  variant: z.enum(['note', 'tip', 'warning', 'danger']),
  title: z.string().optional(),
}).strict();

export const calloutCore: BlockCoreDefinition<typeof propsSchema> = {
  name: 'callout',
  kind: 'component',
  propsSchema,
  mdxComponent: 'Callout',
};
```

- [ ] **Step 4: 写 core/serialize.ts + parse.ts（MDX serialize/parse hooks）**

(详见 RFC.md 形状；serialize: props → MDX `<Callout variant="..." title="...">...</Callout>`；parse: 反向)

- [ ] **Step 5: 跑测试 confirm pass + commit (red→green→commit)**
- [ ] **Step 6**: 写 CONTRACT.md + index.ts barrel（参 ADR-0003 D2 三入口约定）
- [ ] **Step 7: round-trip 测试** —— 加 fixture 到 mdx-bridge `__tests__/fixtures/`：
  - `10-callout-note.input.mdx` / `.expected.json`
  - `11-callout-with-title.input.mdx` / `.expected.json`
  - `12-callout-nested-prose.input.mdx` (callout 内含 prose 段)

**fixture 编号约定（plan-challenger R3 #1 修订，全 plan 唯一编号空间）**：
- 10-12: block-callout (C1)
- 13: block-code (C3)
- 14: block-image (C4)
- 15-16: block-math inline/display (D1)
- 17: block-pdf basic (D2)
- 18: block-jupyter numpy (E1)
- 19: block-nn-viz basic (E2)
- 20: block-agent-flow basic (E3)
- 21+: 留给 Wave 3 sample-blocks 集成 fixture 与未来扩展
- [ ] **Step 8: review chain（D2 row 1 触发"改 CONTRACT.md"）**：
  - codex 5.3-spark code-reviewer
  - codex 5.5 pr-gate（深审）
  - Claude pr-reviewer
  - mdx-doctor 跑全 RTT fixture
  - git-operator commit + push

### Task C2: block-callout/ui-default（template by ux-ui-lead，**Wave 2 第一个 ui-default**）

**Files:**
- Create: `packages/block-callout/src/ui-default/{index,EditorView,RenderView,styles.css}.{tsx,astro,css}`
- Create: `packages/block-callout/src/__tests__/ui-default.test.tsx`
- Modify: `packages/design-tokens/CONTRACT.md` 加"消费方使用规范"段（ADR-0007 D1 ux-ui-lead 责任：把视觉决策固化进此段）

**Owner**: `ux-ui-lead`（spawn 时已注入 frontend-design + ui-ux-pro-max-skill + web-design-guidelines 三 skill，per ADR-0007 D4）
**Blocked by**: C1 完成（不能用 callout 之前 register UI）

- [ ] **Step 1: ux-ui-lead 串走三 skill 思考顺序**

```
1. frontend-design：起视觉提案（颜色 / spacing / variant 视差 / hover 微交互）
2. ui-ux-pro-max-skill：用设计系统强化 + 配色方案 + 行业 callout 模式参考
3. web-design-guidelines：Vercel-style 终审（a11y / 字号比 / 移动端 layout）
```

- [ ] **Step 2: 写 ui-default/EditorView.tsx**（Tiptap NodeView）

(消费 design-tokens preset；4 variants 用 4 套 token hue；hover/focus state 走 design-tokens shadow + ring；a11y `role="note"` + `aria-label`)

- [ ] **Step 3: 写 ui-default/RenderView.astro**（Astro server render）
- [ ] **Step 4: 写 styles.css**（@layer components；只用 token vars，不硬编码颜色 / 间距）
- [ ] **Step 5: ui-default.test.tsx**（render + variant snapshot + a11y attrs）
- [ ] **Step 6: 把视觉契约写入 design-tokens/CONTRACT.md "消费方使用规范"段**

格式（ADR-0007 D1 落地形态）：

```markdown
## 消费方使用规范（ux-ui-lead 单一权威）

block-* 的 ui-default 必须：
- 颜色 / 间距 / 字号 / 阴影 / 圆角 / 动效 全走 token vars，**不**硬编码十六进制 / px
- 4 个 variant 状态映射到 token aliases：
  - note → --skb-color-info
  - tip → --skb-color-success
  - warning → --skb-color-warning
  - danger → --skb-color-danger
- hover state: shadow 升 1 级 (--skb-shadow-md → --skb-shadow-lg)
- focus state: outline 用 --skb-color-focus + offset 2px
- a11y: role + aria-label 必填
- 字号比例：title h3-equivalent (--skb-font-size-h3)，body --skb-font-size-base
- 移动端 (< 768px): padding 减半 (--skb-spacing-md → --skb-spacing-sm)

(callout 是 template；其余 7 个 ui-default 由 codex-block-generator clone 时必须遵循以上规范。)
```

- [ ] **Step 7: review chain (D2 row 1 改 CONTRACT.md + row 4 触发新视觉规范段)**：
  - codex 5.3-spark code-reviewer
  - codex 5.5 pr-gate（深审视觉契约同步）
  - Claude pr-reviewer
  - **ux-ui-lead 自审视觉**（lead 是单一权威，本 PR 自身不会被 lead 审；由 codex+pr-reviewer 把关）
  - performance-auditor (visual reg) 选触
  - git-operator

### Task C3: block-code/core（codex-block-generator clone of C1，**单独 PR**）

**Owner**: orchestrator-direct Bash → `codex exec --profile scaffolder`
**Blocked by**: C1 完成 + commit on main

**plan-challenger 修订（NICE 6）**：原 C3-C4 合并为一次 codex 调用一起克隆两个 block 不符合 1-2 commit 粒度，回退成本高。改为每 PR 1 包：先 C3 (block-code) 完整走 review chain → commit → C4 (block-image) 同模式。

- [ ] **Step 1**: 等 C1 commit on main（确认 callout core merged）

- [ ] **Step 2**: orchestrator Bash 调 codex-block-generator（仅 block-code）

```bash
timeout 600 codex exec --profile scaffolder \
  "你是 codex-block-generator。template = packages/block-callout/（已 merged on main）。仿造创建：
   - packages/block-code/ (kind: 'component', mdxComponent: 'Code', propsSchema:
     { lang: enum (10+ 常见语言), code: string, filename: optional string }.strict())

   严格按 template 结构。propsSchema 改对应字段；serialize/parse 改对应 MDX 形状；
   core test 含 4 case（正常 / invalid lang / .strict reject / shape contract）；
   CONTRACT.md 改对应公开导出 + Wave 1 declared peers（按 ADR-0008 D1 不加 dead deps）。

   不允许偏离模板架构；如发现 template 缺失抽象，停止并 SendMessage 给 simple-block-eng 改模板再继续。

   ADR-0006 8-point checklist 适用 item #6 (sister-doc): block-callout vs block-code 的
   2 份 CONTRACT.md 必须 sister-aligned（字段名 / kind / mdxComponent 命名风格一致）。" \
  < /dev/null > docs/audits/codex-runs/$(date +%F)-task-C3-block-code-clone.txt 2>&1
```

- [ ] **Step 3**: orchestrator review codex 输出 + git diff
- [ ] **Step 4**: 跑 round-trip 测试 + 加 mdx-bridge fixture `13-code-block.input.mdx`（fixture 编号空间见 C1 Step 7 末段约定）
- [ ] **Step 5**: review chain（D2 row 1 改 CONTRACT.md）：codex 5.3-spark + pr-gate + pr-reviewer + mdx-doctor + git-op

### Task C4: block-image/core（codex-block-generator clone of C1，**单独 PR**）

(C3 模式重复；template 已稳定后单独跑；propsSchema = `{src: url, alt: string, caption?: string}.strict()`；mdxComponent = `Image`；fixture `14-image-block.input.mdx`)

### Task C5a: block-code/ui-default（codex-block-generator clone of C2，单独 PR）

**Owner**: orchestrator Bash codex + ux-ui-lead 视觉审
**Blocked by**: C2（callout/ui-default template 已 merged）+ C3（block-code/core merged）

(template = packages/block-callout/src/ui-default/；codex 仿造结构 + 替换 lang/filename/highlight 字段渲染；ux-ui-lead 视觉一致性审；codex 5.3-spark code-review + ux-ui-lead + git-operator)

### Task C5b: block-image/ui-default（codex-block-generator clone of C2，单独 PR）

(C5a 模式；fields: src/alt/caption; ux-ui-lead 审 image responsive sizing 走 design-tokens spacing)

### Track C6（**重新定义，plan-challenger CRITICAL #2 修订**）：render+viz blocks 的 ui-default 视觉契约执行

**plan-challenger 反对意见**：原 plan 让 codex-block-generator clone callout/ui-default 来产生 block-math/block-pdf/block-jupyter/block-nn-viz/block-agent-flow 的 ui-default 不可行 —— KaTeX/PDF/Canvas/JupyterLite/ReactFlow 的交互完全不同，不是简单字段替换。

**修订后定义**：
- 每个 render block / viz block 的 ui-default 由其工种 worker (render-block-eng / viz-block-eng) **hand-craft 交互逻辑**（与该 block core 同 PR 提交，见 Track D / Track E）
- ux-ui-lead 在每个 block ui-default PR 上做**视觉一致性审**（仅审：颜色用 design-tokens var / spacing 用 token / 字号比例 / a11y 属性 / 移动端 layout / hover/focus state；**不**审 KaTeX/PDF.js/JupyterLite/Canvas/ReactFlow 等领域专属交互逻辑）
- ux-ui-lead 在 packages/design-tokens/CONTRACT.md "消费方使用规范"段（C2 已建）维护一份**视觉契约 checklist**，每个 block 的 ui-default PR 必须 self-attest 满足全部 checklist 项

**视觉契约 checklist 形态**（C2 实施时建立，C6 在每个 block ui-default PR 上引用）：

```markdown
- [ ] 所有颜色走 token var（`--skb-color-*`），无硬编码 hex / rgb
- [ ] 所有 spacing 走 token（`--skb-spacing-*`），无硬编码 px / rem
- [ ] 字号走 token （`--skb-font-size-*`）
- [ ] hover state: shadow 升 1 级 OR opacity 降至 0.85
- [ ] focus state: outline `--skb-color-focus` + offset 2px
- [ ] a11y: role + aria-label 或语义 HTML
- [ ] 移动端 (< 768px): padding 减半
- [ ] dark-mode: data-theme="dark" 下 token 自动切换（无单独 dark-* class）
```

任意 block 的 ui-default 都跑这个 checklist；codex-block-generator clone simple block ui-default (C5a/C5b) 时**也**遵循；hand-craft 的 render+viz block ui-default (D1/D2/E1/E2/E3) 也遵循。**Track C6 不是单独 task entry**；它是 ux-ui-lead 的"持续审视责任"——每次 block ui-default PR 都要 SendMessage ux-ui-lead 视觉审。

---

## Track D: Render Blocks 集群（hand-craft，2 blocks）

**Owner**: `render-block-eng`
**Blocked by**: Task A2（RFC）；D2 还需 Task I3 (extract-pdf-text 脚本) 先就绪
**Risk level**: 高 (D1 KaTeX SSR + dark-mode 渲染；D2 PDF.js worker thread + 文本提取)

### Task D1: block-math（KaTeX）

**Files:**
- Create: `packages/block-math/{package.json, tsconfig.json, CONTRACT.md}`
- Create: `packages/block-math/src/core/{index,core-definition,serialize,parse}.ts`
- Create: `packages/block-math/src/ui-default/{index,EditorView.tsx,RenderView.astro,styles.css}`（hand-craft）
- Create: `packages/block-math/src/__tests__/{core,ui-default,ssr-render}.test.ts`

- [ ] **Step 1: TDD core**（propsSchema: `{tex: string, displayMode: boolean}.strict()`；KaTeX 渲染只在 ui-default）
- [ ] **Step 2: ui-default**（KaTeX import；SSR-safe；CSS 走 design-tokens 颜色 var；dark-mode 自动）
- [ ] **Step 3: round-trip 测试 + mdx-bridge fixture**：`15-math-inline.input.mdx` / `16-math-display.input.mdx`（fixture 编号见 C1 Step 7 末段全 plan 唯一编号空间）
- [ ] **Step 4: SSR render 测试**（确保 Astro static build 不报错）
- [ ] **Step 5: review chain**（D2 row 1）：full chain（codex + pr-gate + pr-reviewer + mdx-doctor + git-op）

### Task D2: block-pdf（react-pdf + 文本提取）

**Blocked by**: Task I3 (extract-pdf-text.ts) 先就绪

**Files:** 同上 + `src/utils/pdf-text-cache.ts`（懒提取 + sessionStorage cache）

- [ ] **Step 1: core**（propsSchema: `{src: url, page?: number, fitMode: enum}.strict()`）
- [ ] **Step 2: ui-default**（react-pdf + worker thread；用 design-tokens `--skb-color-bg-elevated` 作 viewer 边框）
- [ ] **Step 3: 集成 scripts/extract-pdf-text.ts 提取 → search-index 端口（Wave 3 用，Wave 2 仅暴露 API）**
- [ ] **Step 4: round-trip + mdx-bridge fixture**：`17-pdf-basic.input.mdx`
- [ ] **Step 5: review chain（同 D1）+ mdx-doctor 跑 PDF fixture**

---

## Track E: Viz Blocks 集群（hand-craft，3 blocks）

**Owner**: `viz-block-eng`
**Blocked by**: Task A2（RFC）；E1 还需 Track F (kernel-pyodide) 先就绪
**Risk level**: 高（E1 多实例 kernel session；E2 训练循环资源；E3 状态同步）

### Task E1: block-jupyter（JupyterLite + kernel-pyodide）

**Blocked by**: Track F kernel-pyodide commit on main

**Files:** 同 D 模式 + `src/session-manager.ts`（管理 cell 多实例 session 隔离）

- [ ] **Step 1: core**（propsSchema: `{cells: array of {kind: 'code'|'markdown', src: string}, autoRun?: boolean}.strict()`）
- [ ] **Step 2: ui-default EditorView**（JupyterLite UI 嵌入 iframe；通信 postMessage；多 cell 实例独立 session via kernel-registry.getSession）
- [ ] **Step 3: ui-default RenderView**（静态 render：仅显示 cell src + 上一次 run 的 output；不嵌 JupyterLite，省 SSR 资源）
- [ ] **Step 4: round-trip + fixture**：`18-jupyter-numpy.input.mdx`
- [ ] **Step 5: matplotlib smoke test**（exec NumPy + matplotlib.savefig，验证 display_data 含 image/png）
- [ ] **Step 6: review chain**（D2 row 1 + row 6 跨 3+ packages）：full chain

### Task E2: block-nn-viz（TensorFlow.js）

(类似 E1；canvas 渲染网络结构；训练循环 worker thread；CPU 限制 graceful)

### Task E3: block-agent-flow（React Flow）

(类似 E1；DAG 编辑；React Flow 状态同步到 propsSchema)

---

## Track F: kernel-pyodide（hand-craft，PyodideAdapter 实现）

**Owner**: `kernel-pyodide-eng`
**Blocked by**: Task A2（RFC）；与 Track E 之前必须 commit
**Risk level**: 高（KernelAdapter 接口实现 + Pyodide CDN 加载 + Worker 通信）

**Files:**
- Create: `packages/kernel-pyodide/{package.json, tsconfig.json, CONTRACT.md}`
- Create: `packages/kernel-pyodide/src/{index,adapter,session,boot}.ts`
- Create: `packages/kernel-pyodide/src/__tests__/{adapter,session,matplotlib}.test.ts`

- [ ] **Step 1: TDD — adapter.test.ts 验证 KernelAdapter 接口契约**

(实现所有 Wave 1 KernelAdapter / KernelSession / KernelEvent 6 variants / 5 KernelError 类型 + boot path 加载 Pyodide 0.27.x)

- [ ] **Step 2: session.test.ts**（exec / interrupt / events 流）
- [ ] **Step 3: matplotlib.test.ts（mock-based, plan-challenger NICE 8）**

**plan-challenger 修订**：原 plan 走真实 Pyodide CDN 的 matplotlib 测试在 CI 易波动（CDN 抖动 / 包 import 时长 / 内存）。改为：

- 单元层：mock Pyodide runtime；断言 `display_data` event schema 形状（mime types 列表 / data shape）—— 不真跑 matplotlib
- 集成层：单独 `matplotlib.integration.test.ts`，用 `it.skipIf(process.env.CI)`，本地手动跑；CI 不跑
- E2E 层（Wave 4）：Playwright 跑真实页面 + 真 CDN

```typescript
// matplotlib.test.ts (CI gate, mocked)
it('emits display_data event with image/png mime when matplotlib renders', async () => {
  const session = createMockSession({
    onExec: () => emitEvent({type: 'display_data', data: {'image/png': 'fake_base64...'}})
  });
  const events = await collectEvents(session.exec('plt.plot([1,2,3]); plt.show()'));
  expect(events).toContainEqual(expect.objectContaining({type: 'display_data', data: expect.objectContaining({'image/png': expect.any(String)})}));
});
```
- [ ] **Step 4: CONTRACT.md** + barrel
- [ ] **Step 5: review chain（D2 row 1 + 第一个 KernelAdapter consumer 是 Wave 2 关键 surface）**：full chain + kernel-architect 视觉审（架构一致性）

---

## Track G: Editor 子模块（template + clone 模式，3 modules）

**Owner**: `editor-eng` (G1 template) + codex-block-generator (G2/G3 clone) + ux-ui-lead 视觉审
**Blocked by**: Task A2

### Task G1: editor-toolbar（template by editor-eng）

**Files:** `packages/editor-toolbar/{package.json, tsconfig.json, CONTRACT.md, src/{index,Toolbar.tsx,buttons.ts}, __tests__/}`

- [ ] **Step 1: TDD**：写 `Toolbar.tsx` 单测（mock Tiptap editor，验证 button click → command dispatch）
- [ ] **Step 2: 实现 Toolbar.tsx**（Tiptap BubbleMenu wrapper；消费 design-tokens；含 bold/italic/link/code/h2/h3 6 按钮）
- [ ] **Step 3: ux-ui-lead 视觉审**（与 block-callout/ui-default 视觉一致：button hover/focus 走同 token；icon spacing）
- [ ] **Step 4: CONTRACT.md** + barrel
- [ ] **Step 5: review chain**（D2 row 1 改 CONTRACT.md + 第一个 editor 子模块）：full chain

### Task G2-G3: editor-slash-menu + editor-drag-handle（codex-block-generator clone of G1）

(orchestrator Bash 调 codex-block-generator；template = G1 toolbar；G2 用 Tiptap suggestion plugin；G3 用 dragHandle 扩展；ux-ui-lead 视觉审；codex 5.3-spark code-review + git-op)

---

## Track J (条件触发，**全 block-* PR 静态扫描**): mdx-bridge attr-bearing mark 扩展

**plan-challenger 修订（CRITICAL #3）**：原 plan trigger 仅挂 Track C-simple-blocks；render/viz blocks 也可能引入 attr-bearing mark。改为：

**Trigger condition**：
- **任一** block-* PR（C / D / E 全部）在 mdx-doctor 静态扫描阶段被检测到引入 attr-bearing mark
- 静态扫描方法（**plan-challenger R3 #2 修订：grep 启发不稳，加 ts-morph 解析 + worker self-attest 双保险**）：
  1. `mdx-doctor` 在每个 block-* PR pre-merge 检查时**用 ts-morph** 解析 `packages/block-*/src/core/core-definition.ts`（不依赖 grep regex 的脆弱启发；ts-morph 可处理 `z.lazy` / `z.intersection` / spread / 跨文件 propsSchema 拆分）
  2. 工种 worker 在 ready-for-review 报告时**强制自审**：在 ADR-0006 8-point self-audit 段必须明示"item #1: PROPS 含 attr-bearing fields = YES/NO + 列字段名 / NO 的理由"；reviewer cross-check
  3. 如发现 attr-bearing field（任一来源），强制 PR 同 commit 内含 mdx-bridge wrapMark + marksEqual + 双 fixture 更新
- **未触发条件**：所有 block 的 propsSchema 均为 fixed-value enum / primitive without attribute，则 J 不需要触发

**Owner**: `mdx-bridge-eng`
**Risk level**: 高（ADR-0002 erratum #16 + ADR-0006 item #1 trip-hazard：marksEqual 默认 `return true` 是 silent-drop trap）

**Files:**
- Modify: `packages/mdx-bridge/src/serialize.ts`（wrapMark for new attr-bearing mark）
- Modify: `packages/mdx-bridge/src/__tests__/round-trip.test.ts`（marksEqual case + attr-equality + attr-distinction fixture）
- Modify: `packages/mdx-bridge/src/__tests__/fixtures/`（新 fixture 文件）
- Modify: `packages/mdx-bridge/CONTRACT.md`（更新 attr-bearing mark 对应的 wrapMark/marksEqual 文档）
- Add: `packages/mdx-bridge/scripts/scan-block-props.ts`（mdx-doctor 静态扫描脚本，辅助每个 block-* PR 自动判定 J 触发）

- [ ] **Step 0**: 实施静态扫描脚本

```typescript
// packages/mdx-bridge/scripts/scan-block-props.ts
// 运行：pnpm --filter @skb/mdx-bridge scan-block-props
// 输出：JSON of {pkg: string, attrFields: string[]}[]
// 由 mdx-doctor 在 block-* PR check 阶段调用
```

如某 block 的 propsSchema 含 attr field（不是 enum / 不是 primitive-only） → mdx-doctor 强制该 PR bundle 内同 commit 改 mdx-bridge：

- [ ] **Step 1: 写 attr-equality fixture**（同 mark 同 attrs → 应合并）
- [ ] **Step 2: 写 attr-distinction fixture**（同 mark 不同 attrs → 不合并）
- [ ] **Step 3: 实现 wrapMark + marksEqual**（attr 比对纳入）
- [ ] **Step 4: review chain（D2 row 1 改 CONTRACT.md）**：full chain；ADR-0006 item #1 是核心审

---

## Task Z: Wave 2 Close

**Owner**: `orchestrator` + `structure-auditor` + `git-operator`
**Risk level**: 高（D2 row 4 触发新 ADR：ADR-0009）
**Blocked by**: 全部 track commit + push + CI 全绿

### Z0: sample-blocks/index.mdx 烟测内容（**plan-challenger R3 #3 修订**：plan v2 文件结构有此文件但无创建 task，补 Z0）

**Owner**: `editor-integrator`
**Files:**
- Create: `apps/site/src/content/notes/sample-blocks/index.mdx`

**目的**: 提供 Wave 3 集成测的烟测输入；含全部 8 种 component block 实例（callout 4 variants × 1 + code 1 + image 1 + math 1 + pdf 1 + jupyter 1 + nn-viz 1 + agent-flow 1）。

**Blocked by**: 全部 8 种 block 的 core + ui-default 已 commit。

- [ ] **Step 1**：写 sample-blocks/index.mdx（每 block 一个最小工作示例）

```mdx
---
title: All blocks demo
description: Wave 3 集成烟测样本（含 8 种 component block 实例）
date: 2026-04-30
---

import { Callout, Code, Image, Math, Pdf, Jupyter, NnViz, AgentFlow } from '@skb/all-blocks';

# All Blocks Demo

<Callout variant="note">这是 note variant.</Callout>
<Callout variant="tip">这是 tip variant.</Callout>
<Callout variant="warning">这是 warning variant.</Callout>
<Callout variant="danger">这是 danger variant.</Callout>

<Code lang="python">
print("hello")
</Code>

<Image src="/sample.jpg" alt="sample" caption="example caption" />

<Math tex="\\sum_{i=1}^n i = n(n+1)/2" displayMode={true} />

<Pdf src="/sample.pdf" page={1} fitMode="width" />

<Jupyter cells={[{kind: 'code', src: 'import numpy as np; np.arange(10)'}]} />

<NnViz layers={[{type: 'dense', units: 16}]} />

<AgentFlow nodes={[{id: 'a', label: 'Start'}]} edges={[]} />
```

- [ ] **Step 2**：mdx-bridge 加 fixture `21-all-blocks-mixed.input.mdx`（验证 8 种 block 序列化往返）
- [ ] **Step 3**: visual-smoke.spec.ts 加 case：访问 `/notes/sample-blocks` 不报错 + 8 种 block 各自 render 至少一个 DOM 节点
- [ ] **Step 4**: review chain（D2 row 6 跨 ≥3 packages，因为引用全部 8 个 block 包）：codex + Claude pr-reviewer（不必 pr-gate，仅是 demo content）+ mdx-doctor + git-op

### Z1: ADR-0009 Wave 2 Close

**Files:**
- Create: `docs/decisions/ADR-0009-wave-2-close.md`

按 ADR-0002 模板：
- D1：empirical lessons codified
- D2：commit roster
- D3：errata collection forward-applicable to Wave 3+
- D4：Wave 2 structure baseline pointer
- D5：active.md 重指 Wave 3
- D6：team shutdown ceremony

错errata 必含（来自 Wave 2 实测，至少）：
- review-round count 增减 vs Wave 1
- fixture growth：mdx-bridge 9 → ? fixtures
- codex catch rate vs Wave 1（ADR-0006 8-point 实战数据）
- ux-ui-lead spawn token cost vs 普通 worker（ADR-0007 D4 监控点）
- template + codex-clone 模式 reject rate（ADR-0007 D3 试点效果）

### Z2: structure-auditor 第二次审计

**File**: `docs/audits/structure-2026-05.md`（月度文件名约定）

跑全套：
- file size scan（新 11 packages 应全 < 300 lines）
- CONTRACT drift（每 block-* CONTRACT 与 source 同步）
- orphan packages（编辑期可能新孤儿）
- tsconfig refs 一致性（按 ADR-0008 D1 dead-dep policy）
- workspace dep graph integrity

### Z3: docs/plans/active.md 重指

```markdown
**当前 wave**: Wave 2 ✅ closed (<DATE>, HEAD `<HASH>`) → Wave 3 plan 待起草
```

### Z4: 团队 shutdown ceremony

按 team-operations.md shutdown protocol，给所有 19 active teammate 发 `shutdown_request`（含 ux-ui-lead）；全部 approve 后 `TeamDelete phase-1-wave-2`。

---

## Self-Review Checklist

**1. Spec coverage**:
- [x] 8 component blocks 都有对应 track（C: 3 simple, D: 2 render, E: 3 viz）
- [x] 每个 block 都有 core + ui-default 双层（ADR-0003 D2）
- [x] 8 个 ui-default 全部由 ux-ui-lead 写 1 个 + codex-clone 7 个（ADR-0007 D1+D3）
- [x] 3 个 editor 子模块（Track G1 toolbar template + G2/G3 clone）
- [x] kernel-pyodide 实现（Track F，blocks E1）
- [x] codex tool patterns 实战（Task H test scaffold + Task I scripts + Track C3/C4/C5/C6 + G2/G3 都用 codex-block-generator/test-scaffolder/script-builder）
- [x] mdx-doctor 跑 RTT（Track C / D / E review chain 都含）
- [x] structure-auditor 第二次审计（Z2）
- [x] Wave 2 entry ADR + close ADR（A1 ADR-0008 + Z1 ADR-0009）
- [x] block-foundation/RFC.md（A2，blocks block-callout）
- [x] dead-dep policy resolution（A1 ADR-0008 D1）
- [x] Wave 1 erratum 清理（B1 + B2 + B3）

**2. Placeholder scan**:
- [x] 无 "TBD" / "TODO" / "fill later"
- [x] 关键 step 都有 code block 或精确文件路径
- [x] 高层 outline step 处显式说明"详见 RFC / 工种 worker spawn 时填具体 step"（这是 wave 级 plan 的合理粒度，工种 worker 在 spawn 时按子 plan 模式接 TDD 细节）

**3. Type consistency**:
- [x] BlockCoreDefinition / BlockUIDefinition / BlockRegistry 命名贯穿（与 ADR-0003 D4 一致）
- [x] propsSchema / mdxComponent / coreName / uiId 形状贯穿
- [x] KernelAdapter / KernelSession / KernelEvent 命名（与 Wave 1 kernel-adapter CONTRACT 一致）
- [x] codex tool pattern 名称（codex-block-generator / codex-test-scaffolder / codex-script-builder）一致

**4. ADR-0006 8-point trip-hazards 列**:
- [x] item #1: Track J 显式处理 attr-bearing mark 触发 wrapMark + marksEqual + fixture
- [x] item #6: Track C 强制 sister-doc alignment（block-callout vs block-code vs block-image 3 份 CONTRACT.md）
- [x] item #8: Pre-Task 0 + Task A1 + Task B3 都强调 ADR-0006 D8 staging protocol（authority + generator + outputs 同 bundle）
- [x] 测试规划：Track C/D/E 各加 round-trip fixtures（覆盖 callout 3 + math 2 + pdf 1 + jupyter 1 + nn-viz 1 + agent-flow 1 = 9 新 fixture，预算 +50% 比 Wave 1 的 9 fixture 增长，对应 ADR-0002 §132 Wave 1 underestimate 教训）

**5. ADR-0007 D2 review chain coverage**:
- [x] Pre-Task 0 不触发（基础设施）
- [x] Task A1 触发 row 4（新 ADR）→ full chain
- [x] Task A2 触发 row 1（RFC.md 是 CONTRACT-level interface freeze, plan-challenger R1 修订）→ +pr-gate +pr-reviewer
- [x] Task B1 不触发 → codex + orchestrator 自检
- [x] Task B2 触发 row 8（CI workflow 改）→ full chain
- [x] Task B3 触发 row 3 → codex + pr-reviewer
- [x] Task H + Task I 工具调用（add-only 骨架）→ codex + orchestrator 自检
- [x] Track C/D/E/G 改 CONTRACT.md（row 1）→ full chain；首个 block 还触发 row 6（跨 3+ packages）
- [x] Task Z1 ADR-0009 → full chain

---

## Execution Handoff

**两种执行选择**：

**1. Subagent-Driven（推荐）** - orchestrator dispatch fresh subagent per task；review between tasks；fast iteration。每个 task spawn 时 worker 按本 plan 框架接 TDD 细节。
**2. Inline Execution** - 在当前 session 用 superpowers:executing-plans 跑（不推荐：wave 跨度长 + 多 codex tool 调用，inline 会撑爆 context window）

**建议 Subagent-Driven**。orchestrator 按 task DAG dispatch；worker spawn 时附 plan 对应章节 + team-operations.md。

---

## Related

- [设计规格 §4.2.2](../specs/2026-04-29-self-knowledge-base-design.md) Wave 2 退出标准
- [ADR-0001](../../decisions/ADR-0001-stack-selection.md) Phase 1 架构基础
- [ADR-0002](../../decisions/ADR-0002-wave-1-close.md) Wave 1 close — 22 errata + 3 cross-package single-authority invariants
- [ADR-0003](../../decisions/ADR-0003-headless-presentational-split.md) headless / UI 分层 + design-tokens + 开源就绪
- [ADR-0006](../../decisions/ADR-0006-asymmetry-audit-checklist.md) 8-point asymmetry-audit checklist
- [ADR-0007](../../decisions/ADR-0007-job-function-codex-heavy-execution.md) 职能化分工 + Codex-heavy 执行 + teammate/tool 切分
- [Phase 1 Wave 1 plan](2026-04-29-phase-1-wave-1-foundation.md) — Wave 1 实施细节参考
- [docs/audits/structure-2026-04-29-wave-1.md](../../audits/structure-2026-04-29-wave-1.md) Wave 1 close baseline
- [agent-contract.md](../../../agent-contract.md) — 20 teammate + 8 tool pattern 单一源
- [docs/runbooks/team-operations.md](../../runbooks/team-operations.md) — 团队操作手册
- [docs/runbooks/codex-tool-invocations.md](../../runbooks/codex-tool-invocations.md) — codex tool patterns canonical Bash
