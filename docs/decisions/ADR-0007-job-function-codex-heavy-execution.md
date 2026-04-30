# ADR-0007: 职能化分工 + Codex-heavy 执行 + teammate / tool 切分

| 字段 | 值                                                                                            |
| ---- | --------------------------------------------------------------------------------------------- |
| 状态 | accepted                                                                                      |
| 日期 | 2026-04-30                                                                                    |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx)                                                         |
| 触发 | Wave 1 close 后用户提议：① 拆 UX/UI 专属 agent 防视觉八头蛇 ② 把更多代码执行/审核交 Codex 减 Claude usage 压力 ③ 观察到 codex 包装 agent 是纯 context 搬运浪费 turn |
| 替代 | 不替代任何 ADR；扩展 [ADR-0001](ADR-0001-stack-selection.md) §3.1-§3.2 + [ADR-0003](ADR-0003-headless-presentational-split.md) D2-D6 + [ADR-0004](ADR-0004-agent-team-dispatch-model.md) D2/D5/D7 |

## Context

Wave 1 close 后用户做了三个方向上的判断：

### 观察 1：按 package 拆 agent 制造视觉八头蛇

ADR-0003 D2 把每个 component block 拆 `core/` + `ui-default/`。Wave 2 即将启动 8 个 ui-default 实施。如果按 Wave 1 的 package-domain 模型派 agent（block-callout/ui-default 给 simple-block-eng，block-math/ui-default 给 render-block-eng，block-jupyter/ui-default 给 viz-block-eng…），8 个 ui-default 会被 ≥ 3 个不同 Claude agent 写，**8 种"自我品味"覆盖统一设计意图**。视觉 token 从 design-tokens 来不假，但具体 React 组件的 padding 哲学 / hover 微交互 / loading 状态等 design-tokens 不规定的部分会发散。

### 观察 2：Claude usage 紧 → Codex-heavy 是必然

Wave 1 数据：
- Claude tokens 主要消耗：orchestrator (~30%) / 工种 worker 实施 (~40%) / pr-reviewer 每 PR (~20%) / 其他 (~10%)
- Codex 5.5 在 review 阶段抓住 9/12 cross-location asymmetry（[ADR-0006](ADR-0006-asymmetry-audit-checklist.md) 数据）
- Claude pr-reviewer 价值集中在跨文件影响 / 长上下文判断；对单包内常规变更性价比低

继续按 Wave 1 模型在 Wave 2 跑 8 个 ui-default + 3 个 editor 子模块 + kernel-pyodide 实施会**把 Claude budget 消耗到下一阶段无力继续**。

### 观察 3：codex 包装 agent 是纯 context 搬运

Wave 1 codex agent（`code-reviewer` / `pr-gate` / `plan-challenger` / 5 个 `codex-*-eng`，共 8 个）的典型 turn：

```
1. 收 SendMessage（消耗 Claude turn 预算 + context window）
2. 写 codex prompt（转述消息内容）
3. Bash 调 codex exec --profile X < /dev/null
4. 等 codex 完成
5. 读 stdout 解析 PASS/FAIL
6. 写 SendMessage 回 orchestrator（转述 codex 结论）
```

整个 turn 里 Claude wrapper **零内部状态产出**（下次激活时上下文等同于 fresh spawn），仅做 prompt 转译 + 子进程调度。在 team 模型下这是 anti-pattern：teammate 的价值在于跨 turn 累积上下文，wrapper 没有累积什么。

### 三个观察的统一原理

| 模型选择 | 适用条件 |
|---|---|
| **按 package 拆工种**（Wave 1 模型） | 包之间逻辑独立、视觉无统一意图 |
| **按职能拆**（视觉 / 业务 / 流程） | 跨包需统一意图（视觉 / 安全 / 性能） |
| **teammate（持续 context）** | 跨多 turn 的设计判断、跨包影响理解、长 review 累积 |
| **tool（每次 stateless 调用）** | 每次调用是 fresh prompt + fresh diff，无累积价值 |

Wave 2 命题：core/ 工作仍按 package（domain 工种）；ui-default/ 跨包统一意图（职能化 → ux-ui-lead）；codex 调用本质 stateless（→ tool）。

## Decision

### D1：新增 `ux-ui-lead` Claude teammate 作视觉单一权威

**职责**：横跨 8 个 block 的 ui-default + apps/site 视觉 + editor 子模块视觉，由设计 skill 流水线驱动产出第一版 + 把令牌使用范式固化到 [`apps/api/CONVENTIONS.md`](../../apps/api/CONVENTIONS.md) 的视觉对应文档（建议新建 `packages/design-tokens/CONVENTIONS.md` 或在 design-tokens/CONTRACT.md 内补"消费方使用规范"段）。

**协作模式**：
- ux-ui-lead (Claude) 写第一个 ui-default 作 template（推荐 `block-callout/ui-default/`，因为 callout 是视觉最简单且通用 pattern）
- `codex-block-generator`（tool，见 D5）批量仿造其他 7 个 block 的 ui-default
- ux-ui-lead 审 codex 仿造产物的视觉一致性（不审 logic / schema —— 那是 mdx-doctor / domain 工种的职责）
- 同 mode 用于 editor 子模块（slash-menu / drag-handle / toolbar 三选一作 template，余两个 codex-clone）

**spawn prompt 注入**（ADR-0007 D4 详述）：
- `team-operations.md` 全文（按 ADR-0004 D6 强制）
- 三个设计 skill 链
- ADR-0003 全文（headless / UI 分层）
- design-tokens 当前 CSS var + Tailwind preset 内容

**能力边界**：
- 写 React 组件 + Tailwind class + a11y 属性 + 视觉测试
- **不**改 BlockCoreDefinition / propsSchema / MDX serialize（那些是 core 层）
- **不**调 codex（dispatch 给 codex-block-generator tool，由 orchestrator 执行）

### D2：Claude pr-reviewer 改为选择性触发

**默认 review chain**（普通 PR）：

```
worker → orchestrator
       → [Bash] codex exec --profile code-reviewer < diff > result.txt
       → orchestrator scan result.txt + diff（轻量 final 判断，相当于 lite Claude review）
       → git-operator commit
```

**高风险 PR**（任一触发条件命中）追加 review：

| 触发条件 | 追加 review |
|---|---|
| 修改任何 `*/CONTRACT.md`（接口形状变化，非补充） | + codex 5.5 pr-gate + Claude pr-reviewer |
| 新增 / 删除 package | + codex 5.5 pr-gate + Claude pr-reviewer |
| 修改 spec / agent-contract.md / 任何 ADR | + Claude pr-reviewer（不必 pr-gate，spec 类是文档） |
| 触发新 ADR 创建 | + codex 5.5 pr-gate + Claude pr-reviewer |
| 删除 / 重命名 package | + Claude pr-reviewer |
| 跨 ≥ 3 个 package 的 PR | + Claude pr-reviewer |
| performance-auditor 标记的 PR | + Claude pr-reviewer |
| 修改 CI workflow / deploy / auth / security | + codex 5.5 pr-gate + Claude pr-reviewer |

普通 PR（不触发任一条件）**全程无 Claude review**，由 orchestrator scan codex 5.3-spark 输出 + diff 自己做最终判断（"orchestrator 自己是 Claude，看输出做轻量判断不增 Claude turn 数"）。

### D3：worker 端 template + codex-clone 模式

**ui-default**（D1 已述）：ux-ui-lead 写 template 1 个 + codex-block-generator clone 7 个

**core**（试点）：8 个 block-* core 模板化程度很高（propsSchema + mdxComponent name + 序列化结构），先在 simple block 集群试点：
- `block-callout/core/` 由 simple-block-eng (Claude) 写作 template
- `block-code/core/` + `block-image/core/` 由 codex-block-generator clone
- `block-math/core/` + `block-pdf/core/` 因复杂度不同（math 含 KaTeX 决策；pdf 含 PDF.js worker）由 render-block-eng (Claude) 各自 hand-craft，**不试点**
- `block-jupyter/core/` + `block-nn-viz/core/` + `block-agent-flow/core/` 复杂度高 + kernel session / canvas / DAG 各自专属，由 viz-block-eng (Claude) hand-craft，**不试点**

试点效果用 Wave 2 close 时的 ADR-0003-style 错误率衡量：codex-cloned core 的 review reject rate vs hand-crafted。如果 reject rate 接近 → Wave 3 推广；高 → 退回 hand-craft。

**editor 子模块**：editor-eng (Claude) 写 1 个 template（推荐 toolbar，最简单），codex-block-generator clone slash-menu + drag-handle。

**测试脚手架**：所有 vitest 套件骨架统一交 codex-test-scaffolder（保持 Wave 1 决策）。

### D4：design skill 流水线注入 ux-ui-lead

ux-ui-lead 在 spawn 时 prompt 注入**全部三个 skill 内容**：

1. **`frontend-design`**（superpowers 内置）—— 生成第一版视觉提案
2. **`ui-ux-pro-max-skill`**（用户已装在 `.claude/skills/`）—— 强化设计系统 / 配色 / 行业规则
3. **`web-design-guidelines`**（用户已装；Vercel 风格审）—— 终审

**为什么三个一起注入而非按 task 分阶段**：
- Wave 2 多个 block 共用一份视觉契约；分阶段注入意味着每个 block 串 3 段，整体串行 24 段（8 block × 3 段），太长
- 一次性全注入让 ux-ui-lead 能在写 template 阶段就**预先**应用三段约束，少返工
- 串接顺序仍保留：lead 写 template 时心中先 frontend-design → 再 ui-ux-pro-max → 再 vercel-review，这是它**内部**思考顺序，不是 spawn 阶段

**约束**：三个 skill 加起来 spawn prompt 体积膨胀。监控点：ux-ui-lead 第一次 spawn 时 token 消耗对比 Wave 1 worker 平均值；如超过 2× 重新评估是否分阶段。

### D5：codex agents 降级为 orchestrator-direct tools

**变更**：8 个 codex 角色（`code-reviewer` / `pr-gate` / `plan-challenger` / `codex-block-generator` / `codex-test-scaffolder` / `codex-script-builder` / `codex-api-crud-builder` / `codex-css-stylist`）从 team teammate 模型移除，改为 orchestrator + 工种 lead 通过 Bash 直接调 `codex exec --profile X < /dev/null` 的 **invocation pattern**（不是 agent，不在 team config，不消耗 Claude teammate 槽位）。

**新的 agent 阵容（共 20 teammate + 8 tool pattern = 28 项配置实体；T0:1 + T1:11 + T2:4 + T3:4，T3 audit 按需复用）**：

```
TIER 0: Orchestrator (Claude, 1)

TIER 1: Worker Teammates (Claude, 11)
  block-foundation-eng / simple-block-eng / render-block-eng /
  viz-block-eng / mdx-bridge-eng / kernel-architect / kernel-pyodide-eng /
  editor-eng / editor-integrator / ux-ui-lead (新, ADR-0007 D1) / api-builder

TIER 2: Process Teammates (Claude, 4)
  pr-reviewer (选择性触发, ADR-0007 D2) / git-operator / refactorer / researcher

TIER 3: Audit Teammates (Claude, ?)  ── Wave 1 是 4，Wave 2 起根据需要复用
  structure-auditor / performance-auditor / mdx-doctor / link-checker

────────────────────────────────────────

TOOL: Codex Invocation Patterns (8)
  code-reviewer       → codex exec --profile code-reviewer < /dev/null
  pr-gate             → codex exec --profile pr-gate < /dev/null
  plan-challenger     → codex exec --profile plan-challenger < /dev/null
  codex-block-generator → codex exec --profile scaffolder ...
  codex-test-scaffolder → same
  codex-script-builder  → same
  codex-api-crud-builder → same
  codex-css-stylist     → same
```

**操作变化**：
- review 链每 PR 节省 ~2-3 个 Claude wrapper turn
- 8 teammate spawn 成本省了
- agent-contract.md 拆 `agents:`（teammate）+ `tool_patterns:`（codex）两段
- 新 runbook `docs/runbooks/codex-tool-invocations.md`（生成产物）描述每个 pattern 的 canonical Bash 调用 + 触发条件 + 错误处理

### 组合效果（D1-D5 联动）

Wave 2 一个典型常规 PR（block-X/ui-default 仿造）的 turn 序列：

```
1. orchestrator: SendMessage codex-block-generator (← tool, 不是 teammate)
   实际：orchestrator 直接 Bash: codex exec --profile scaffolder < prompt.txt > out.txt
2. orchestrator 读 out.txt + git diff 自检
3. ux-ui-lead 收消息 review 视觉一致性 (Claude turn, 不可省)
4. orchestrator: Bash: codex exec --profile code-reviewer < diff > review.txt
5. orchestrator scan review.txt: PASS
6. 是否高风险？普通 ui-default clone：否
7. orchestrator: SendMessage git-operator commit (Claude turn)
8. git-operator commit + push (Claude turn)
9. CI 验证
```

Wave 1 同等 PR 需要 ~7 Claude teammate turn（worker spawn / code-reviewer turn / pr-gate turn / pr-reviewer turn / git-operator turn / + orchestrator coordinating）。Wave 2 降到 **~3 Claude turn**（ux-ui-lead 视觉 review / orchestrator coordinating + final scan / git-operator）。**节省 ~50-60% Claude tokens / PR**。

## Consequences

### 正面

- **视觉单一权威**：ui-default 跨 8 block + apps/site + editor 子模块由 ux-ui-lead 一手把关
- **Claude budget 压力解除**：估计 Wave 2 全程 Claude tokens 降 ~40-50%（Codex 反向上升，但 5.3-spark + 5.5 总成本远低于 Claude）
- **review chain 更精准**：高风险 PR 仍保留 Claude pr-reviewer 长上下文判断；常规 PR 不浪费
- **codex tool 调用更直接**：8 个 wrapper turn / PR 消除
- **agent-contract.md 拆 agents/tools 让 schema 更准**：Claude teammate 是有 context 的，codex tool 是 stateless invocation —— schema 区分更准确

### 负面 / 待应对

- **agent-contract.md restructure 是 high-risk PR**（触碰 authority + 全部 generated outputs），必须严格走 ADR-0006 D8 staging protocol
- **template + codex-clone 试点风险**：core 层试点（D3 §"core (试点)"）若 reject rate 高，Wave 2 plan 中段可能需要回退；规避：试点限定在 simple block，复杂 block 不参与试点
- **三 skill 一次注入 prompt 体积**（D4）：监控 ux-ui-lead 第一 spawn 的 token 消耗
- **orchestrator 内联 codex 调用增加 orchestrator turn 复杂度**：原 turn 内只做调度，现在还要 scan codex 输出做轻判；评估方式：Wave 2 几个 PR 后看 orchestrator turn 平均长度
- **失去 teammate-level audit 跟踪**：原 codex teammate 至少有 inbox 历史；现在 tool invocation 仅留 Bash 命令历史。**对应措施**：所有 codex tool 调用 stdout/stderr 必须保存到 `docs/audits/codex-runs/<date>-<task>.txt`（自动）作 audit 兜底
- **plan-challenger 现在是 tool**：原本就是 one-shot 调用，现在去掉 wrapper 反而是清理；ADR-0004 D7 一直把它说成"一次性 dispatch"，与 tool 模型一致

### 影响其他 ADR / spec

| 文档 | 改动 |
|---|---|
| spec §3.1（27 agent → 20 teammate + 8 tool） | 改 §3.1 节标题与 diagram；agent 列表加 ux-ui-lead；codex 8 个移到新"Tool patterns"段 |
| spec §3.2（review 工作流） | 改为：默认 codex 5.3-spark + orchestrator 自检；高风险条件触发 pr-gate / Claude pr-reviewer |
| ADR-0001 §3.1 / §3.2（review 模型） | ADR-0007 显式扩展，不替代；ADR-0001 仍是基础架构源 |
| ADR-0003 D2-D6 | ux-ui-lead 是 D2 / D3 落地的执行者；不破坏 ADR-0003 决策 |
| ADR-0004 D2 / D5 / D7 | D2 spawn 模型 + D5 全 codex 是 teammate 的旧约定 + D7 一次性 Task —— ADR-0007 D5 是其延伸（tool 是 Task 一次性的进一步抽象）；不破坏 |
| ADR-0006 8-point checklist | 不破坏；本 ADR 实施时**就是** ADR-0006 D8 的考验场（authority + generator + outputs 必须同 bundle staged） |

## Wave 2 Pre-Task 0 实施指南（高风险，须走完整 review chain）

本 ADR 是决策记录；实际实施作为 **Wave 2 Pre-Task 0** 在 team 流程中执行。**实施步骤序列**（必须严格按此顺序，并满足 ADR-0006 D8 staging protocol）：

### Step 1: agent-contract.md 加 ux-ui-lead

在 `agents:` 数组的 Tier 1 段（`block-foundation-eng` 之后某处）加：

```yaml
  - name: ux-ui-lead
    tier: 1
    llm: claude
    role: 视觉单一权威 - 横跨 ui-default + apps/site + editor 子模块
    permissions: [read_repo, edit_ui_default, edit_apps_site, dispatch_codex_css_stylist]
    forbidden: [edit_block_core, edit_propsschema, edit_mdx_serialize, git_commit]
    triggers: [wave_2_first_block, wave_2_apps_site_polish, wave_2_editor_submodules]
    description: |
      你是 SelfKnowledgeBaseWeb 的 UX/UI 单一权威。横跨 8 个 block 的
      ui-default、apps/site 视觉、editor 子模块视觉。

      你的职责：
      1. 写第一个 ui-default（block-callout/ui-default/）作 template
      2. 把视觉决策固化到 packages/design-tokens/CONTRACT.md 的"消费方使用规范"段
      3. 审 codex-block-generator 仿造的其余 7 个 ui-default 视觉一致性
      4. 同 mode 处理 editor 三子模块（slash-menu / drag-handle / toolbar）
      5. 应用三个设计 skill：frontend-design / ui-ux-pro-max-skill / web-design-guidelines

      你**不**改 core 层（propsSchema / MDX serialize 是 domain 工种的活）。
      你**不**调 codex（dispatch 由 orchestrator 集中调度）。
```

### Step 2: agent-contract.md schema 扩展支持 tool_patterns 段

在文档头 `## Schema` 段加：

```yaml
tool_patterns:
  - name: <pattern-id>
    profile: <codex profile>
    invocation: <bash template, e.g. "codex exec --profile X < /dev/null">
    triggered_by: <list of orchestrator-side trigger conditions>
    output_handling: <how orchestrator parses / stores stdout>
    description: |
      <multi-line>
```

在文档底加 `## Tool patterns` 段，把现有 8 个 codex 配置从 `agents:` 移到 `tool_patterns:`。

### Step 3: 更新 `scripts/render/types.ts`

```typescript
export const ToolPatternSchema = z.object({
  name: z.string(),
  profile: z.enum(['scaffolder', 'code-reviewer', 'pr-gate', 'plan-challenger']),
  invocation: z.string(),
  triggered_by: z.array(z.string()),
  output_handling: z.string().optional(),
  description: z.string().optional(),
});

export const ContractSchema = z
  .object({
    metadata: z.object({
      version: z.number(),
      total_teammates: z.number(),
      total_tool_patterns: z.number(),
    }),
    agents: z.array(AgentSchema).min(1),
    tool_patterns: z.array(ToolPatternSchema).min(0),
  })
  .superRefine(...);
```

`metadata.total_agents` 改为 `total_teammates`；新增 `total_tool_patterns`。Zod refinement 同步检查两个数字。

### Step 4: 更新 renderers

- `claude-agent.ts`：filter `llm === 'claude'`；codex agents 不再产 `.claude/agents/*.md`（因为它们不是 teammate）。**删除**：`.claude/agents/{code-reviewer,pr-gate,plan-challenger,codex-block-generator,codex-test-scaffolder,codex-script-builder,codex-api-crud-builder,codex-css-stylist}.md` 共 8 个文件
- `codex-profiles-toml.ts`：从 `tool_patterns` 段而非 `agents` 段读取，逻辑等价
- `claude-md.ts` / `agents-md.ts`：拆"## Teammates"和"## Tool patterns"两段；teammate 列表从 17（原 22 - 5 codex worker - moves）改为 17；tool_patterns 列表从无到 8
- **新增** `scripts/render/codex-tool-runbook.ts`：渲染 `docs/runbooks/codex-tool-invocations.md`，每个 tool pattern 一个段落含 canonical bash + 触发条件 + 错误处理

### Step 5: 更新 `.claude/settings.json` permissions

permissions 中提到的 codex agent 名（如 `Bash(codex:*)` 或类似）确认仍允许；不需要为 8 个 wrapped agent 各自配 permission（它们不再存在）。

### Step 6: 跑生成器 + 严格按 ADR-0006 D8 staging protocol

```bash
# 1. 编辑完 agent-contract.md + scripts/render/* 后:
pnpm generate:configs

# 2. 检查输出（必须）：
ls .claude/agents/                          # 应只见 17 个 .md (Claude teammate)
ls docs/runbooks/codex-tool-invocations.md  # 应存在（新生成）

# 3. 显式 git add 所有改动 + 生成产物（关键步骤，参 ADR-0006 D8 + 实例 #12 教训）：
git add agent-contract.md \
        scripts/render/*.ts \
        scripts/__tests__/generate-configs.test.ts \
        .claude/agents/ux-ui-lead.md \
        docs/runbooks/codex-tool-invocations.md \
        CLAUDE.md \
        AGENTS.md \
        .claude/settings.json \
        tmp/codex-profiles.toml \
        docs/review-checklist.md
git rm .claude/agents/code-reviewer.md \
       .claude/agents/pr-gate.md \
       .claude/agents/plan-challenger.md \
       .claude/agents/codex-block-generator.md \
       .claude/agents/codex-test-scaffolder.md \
       .claude/agents/codex-script-builder.md \
       .claude/agents/codex-api-crud-builder.md \
       .claude/agents/codex-css-stylist.md

# 4. 验证 staged content (canonical command 不是 git status):
git diff --cached --stat

# 5. 验证幂等：
pnpm generate:configs
git status --short
# 应该 column-2 全部 blank（working tree 与 index 一致）
```

### Step 7: 测试 + commit + push

```bash
pnpm typecheck
pnpm test
pnpm size-check
pnpm link-check

git commit -m "feat(arch): ADR-0007 implementation — agent-contract restructure + codex tools"
git push
# CI 应该全绿（含 agent-contract drift check）
```

### review chain（本 PR 自身）

ADR-0007 D2 触发条件命中：修改 spec / agent-contract.md / 触发新 ADR / 跨 ≥ 3 package。所以本 PR：
- codex 5.3-spark code-reviewer 必跑
- codex 5.5 pr-gate 必跑（agent-contract 是 authority）
- Claude pr-reviewer 必跑（spec 类）

**这 PR 是 ADR-0006 8-point checklist 的标准考场** —— 实施者预期会撞 instance #8 子类（authority + generator + outputs not staged）。提前 grep `git status --short`/`git diff --cached --stat` 双检查。

## Wave 2 plan 起草前置条件

- ADR-0007 实施（Wave 2 Pre-Task 0）必须先于 Wave 2 实际工作 task
- Wave 2 plan **必须** dispatch ux-ui-lead 处理 ui-default + apps/site + editor 子模块视觉
- Wave 2 plan **必须**按 D3 试点策略安排 simple block core 试点（callout template / code+image clone）
- Wave 2 plan 章节标题反映新 20 + 8 模型（不再写"27 agent"）

## Related

- [ADR-0001](ADR-0001-stack-selection.md) §3.1 / §3.2 review 模型基础
- [ADR-0003](ADR-0003-headless-presentational-split.md) D2-D6 ui-default 物理分离
- [ADR-0004](ADR-0004-agent-team-dispatch-model.md) D5 / D7 / D8 team 模型 + 一次性 Task + orchestrator-managed
- [ADR-0006](ADR-0006-asymmetry-audit-checklist.md) 本 ADR 实施时必经的 review checklist；尤其 D8 + instance #12 staging 教训
- [设计规格 §3.1 / §3.2](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) 待 Wave 2 Pre-Task 0 同步
- [Phase 1 Wave 2 plan](../superpowers/plans/) 待起草，必须按 ADR-0007 调整 agent dispatch 与 review chain
