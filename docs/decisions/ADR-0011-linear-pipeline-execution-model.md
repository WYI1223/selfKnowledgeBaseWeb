# ADR-0011: Linear-pipeline execution model (Wave 3+)

| 字段 | 值 |
| ---- | --- |
| 状态 | accepted |
| 日期 | 2026-05-01 |
| 作者 | gatekeeper (Claude Opus 4.7 1M ctx, Windows session) |
| 触发 | Wave 2 close 后 gatekeeper review (per ADR-0010 acceptance)：49 teammates / 24% forward-fix / WE-001+009+011 并发 hazard 类，决定彻底简化 Wave 3+ 执行模型 |
| 关系 | 深化 [ADR-0007](ADR-0007-job-function-codex-heavy-execution.md) D5 codex-heavy 执行模型；部分 supersede [ADR-0004](ADR-0004-agent-team-dispatch-model.md) D-list 长期 teammate 形态 |

## Context

Wave 2 (HEAD `51789a1` → close `aad092b`，本地 `68daad7`) 暴露三个根本问题：

1. **多 worker 并发 hazard 类**：WE-001（multi-worker concurrent staging race）+ WE-009（lockfile contamination via move-aside）+ WE-011（active-writer breaks WE-009 move-aside）—— 三个 lesson 编入 ADR-0010 D1 + ADR-0006 sub-form C，但**结构性根因 = 多 worker 同时修改文件树**。
2. **49 teammates 的 team-graph 维护成本**：每个 worker 是长期 Claude session，包含 spawn 协议 + 上下文注入 + WE-009 move-aside 场景下的协调成本。Wave 1 ~20 teammates → Wave 2 49 (+145%)。
3. **24% forward-fix rate**（Wave 1 baseline 14%）：D1 (BlockKind ADR procedural) + B2 (visual-smoke fragility) 集中在**测试缺位类**问题。Forward-fix 多 = 流程沟通失误，不是 review 深度不足。

ADR-0007 D5 部分缓解（codex tool 取代部分 worker），但 Wave 2 实测：
- Tier 1 长期 worker 仍是主体（11 个 Claude teammate）
- Codex 仅作"加速器"出现在已有流程旁路
- review chain 默认仍是多 agent 转交（worker → codex 5.3 → orchestrator → codex 5.5 → orchestrator → claude pr-reviewer → orchestrator → git-operator）—— **每 PR ~10-15 个 message turn**

本 ADR 把 Wave 3 起的执行模型改为 **linear pipeline + codex-heavy executor/reviewer + Claude 兜底关键节点**：

- PR 串行执行（消除并发 hazard 类）
- codex 5.5 双角色（executor + reviewer）取代 Tier 1 长期 worker
- Claude 仅在 plan / accept / pre-commit (D2 触发) / UI-UX 等需 reasoning depth 的位置介入
- audit / structure check / mdx-doctor / perf 全部 codex 化

## Decision

### D1 — Linear pipeline 形态

每 PR 走固定 stage 序列；PR 之间也顺序执行（不并发）：

```
[per PR]
  1. PLAN
     ↓
  2. EXECUTE
     ↓
  3. REVIEW
     ↓
  4. (D2 row 1+4 触发) PRE-COMMIT CLAUDE REVIEW   ← 条件 stage
     ↓
  5. COMMIT (含 push)
     ↓
  6. ACCEPT
     ↓
  next PR
```

每 stage 规格：

| # | Stage | 角色 | 执行内容 |
|---|---|---|---|
| 1 | PLAN | pr-writer Claude subagent | 与 orchestrator 协商 lock PR.md（D2 schema）|
| 2 | EXECUTE | codex 5.5 specialized profile（按职能选）OR ux-ui-lead Claude subagent（仅 UI/UX）| 先写 test → 再写 impl → 自跑 vitest 全 PASS |
| 3 | REVIEW | codex 5.5 reviewer 新 session（注入 ADR-0006 8-point + D8 staging 协议）| line-level + spec-match；issues → 返工，PASS → 进 stage 4/5 |
| 4 | PRE-COMMIT CLAUDE | orchestrator 自己跑（同一 Claude session）| 仅 ADR-0007 D2 row 1+4 触发；防 codex 同模型 echo chamber |
| 5 | COMMIT | reviewer codex 兼任 | 显式 git add `<文件清单>` + git diff --cached --stat + commit + push |
| 6 | ACCEPT | pr-writer Claude subagent 第二次调用 | 检查"实际是否满足 PR.md"（scope creep / drop / 测试 case 全跑）|

PR 之间**严格串行**：上一 PR 的 stage 6 完成才进下一 PR 的 stage 1。

### D2 — PR.md 必填字段（schema）

每个 PR 的 PR.md 必须包含：

```yaml
title: <一句话目标>
files:
  - path/to/file/A.ts        # 改动文件白名单（超出 = scope creep）
  - path/to/file/B.tsx
test_cases:
  - input: <…>
    expected: <…>
    location: path/to/__tests__/X.test.ts:N
  - …
contracts_affected:
  - packages/foo/CONTRACT.md  # 触发 ADR-0007 D2 判定时用
adr_touched:
  - ADR-0009                  # 触发 D2 row 4（new ADR）时填
acceptance:
  - <验收点 1：reviewer 用此核对>
  - <验收点 2：pr-writer ACCEPT 时核对>
executor: codex-block-generator | codex-api-crud-builder | … | ux-ui-lead
```

**TDD 前置 = test_cases 字段强制非空**。executor 拿到 PR.md 后**先写 test → 再写 impl → 自跑 vitest 全 PASS** 才进 review。

### D3 — 长期 Claude session 收敛到 1

**Wave 3+ 唯一长期 Claude session = orchestrator (Claude opus 4.7 1M ctx)**。

11 个 Tier 1 worker 全部退役为 codex profile 或按需 Claude subagent：

| 原 Tier 1 worker | Wave 3+ 形态 |
|---|---|
| api-builder | codex-api-crud-builder profile |
| block-foundation-eng | codex-generic-executor + codex-block-generator |
| simple-block-eng | codex-block-generator |
| render-block-eng | codex-generic-executor |
| viz-block-eng | codex-generic-executor |
| editor-eng | codex-generic-executor |
| editor-integrator | codex-generic-executor + ux-ui-lead subagent (UI/UX 部分) |
| kernel-architect | codex-generic-executor |
| kernel-pyodide-eng | codex-generic-executor |
| mdx-bridge-eng | codex-generic-executor |
| ux-ui-lead | **降级为 Claude subagent**（仅 UI/UX 工作触发，不再长期 spawn） |

### D4 — Tier 2 process role 处置

| Wave 1+2 形态 | Wave 3+ 形态 |
|---|---|
| git-operator | **吸收进 codex reviewer commit phase**（D1 stage 5）；不再独立角色 |
| pr-reviewer | **保留为 orchestrator 兼职**（D1 stage 4 触发，不另起 subagent）|
| refactorer | 按需起 Claude subagent（跨包改动时一次性，用完即弃）|
| researcher | 按需起 Claude subagent（外网访问时一次性，用完即弃）|

### D5 — Tier 3 audit 全部 codex 化

| Audit | Wave 3+ 形态 | 触发 |
|---|---|---|
| structure-auditor | **codex profile `codex-structure-auditor`** | 每 PR + Wave-close |
| performance-auditor | codex profile `codex-perf-auditor` | bundle-affecting PR + Wave-close |
| link-checker | CI gate（lychee 配置已就位）| 每 push |
| mdx-doctor | codex profile `codex-mdx-doctor` | mdx-bridge fixture change PR + Wave-close |

### D6 — Codex profile 目录（Wave 3 起步态）

| Profile | Role | 出处 |
|---|---|---|
| codex-block-generator | scaffolder | ADR-0007 D5 已有 |
| codex-api-crud-builder | scaffolder | ADR-0007 D5 已有 |
| codex-css-stylist | scaffolder | ADR-0007 D5 已有 |
| codex-script-builder | scaffolder | ADR-0007 D5 已有 |
| codex-test-scaffolder | scaffolder | ADR-0007 D5 已有 |
| codex-pr-reviewer-55 | review（升级原 `pr-gate`，作 D1 stage 3 默认 reviewer）| ADR-0007 D5 升级 |
| codex-plan-challenger | plan critique（Wave-level + PR-level）| ADR-0007 D5 已有 |
| codex-generic-executor | NEW general-purpose executor（D1 stage 2 默认）| **NEW for Wave 3** |
| codex-structure-auditor | NEW per-PR + Wave-close audit | **NEW for Wave 3** |
| codex-perf-auditor | NEW bundle-affecting PR + Wave-close audit | **NEW for Wave 3** |
| codex-mdx-doctor | NEW mdx-bridge fixture change PR + Wave-close audit | **NEW for Wave 3** |

**Deprecated**：Wave 2 的 `code-reviewer`（codex 5.3-spark）—— 因为 Wave 2 实测 codex 5.5 review 性价比已经追上 spark 的速度优势（参 WE-007：spark PASS != lint clean，需 orchestrator 独立 lint 才能 commit）。Wave 3 起 review 默认 codex 5.5（per D1 stage 3）。

### D7 — Subagent 形态（Claude one-shot）

新增 / 沿用 Claude subagent，全部 **one-shot per invocation**（不持久化 session）：

| Subagent | Wave 1+2 形态 | Wave 3+ 形态 | 调用频率 |
|---|---|---|---|
| **pr-writer** | 不存在 | **NEW Claude subagent** | 每 PR 调用 2 次（PLAN + ACCEPT）|
| **ux-ui-lead** | Tier 1 long-term worker | **降级 Claude subagent** | 仅 UI/UX 工作 PR 触发 |
| refactorer | Tier 2 | Claude subagent | 跨包改动 PR 触发（每 wave ~1-3 次）|
| researcher | Tier 2 | Claude subagent | 外网访问触发（每 wave ~0-1 次）|

### D8 — Wave 3 长期 team graph 监控

```
长期 Claude session: 1 (orchestrator)
按需 Claude subagent: ≤ 4 (pr-writer / ux-ui-lead / refactorer / researcher)
按需 codex sessions: 11 profiles (D6 表)
```

监控指标（codex-structure-auditor 每 PR + Wave-close 跑，纳入 audit 输出）：

- Wave 3+ 长期 teammates 应 ≤ 1（仅 orchestrator）
- 每 PR Claude touch points ≤ 3（plan + accept + 可选 D2 pre-commit review）
- forward-fix rate 目标 ≤ 15%（Wave 2 baseline 24%）
- WE-001 / WE-009 / WE-011 类 hazard 零复发（PR 串行 = 结构性消除）

## Consequences

### Positive

- **Concurrency hazard 结构性消除**：PR 串行 → WE-001 / WE-009 / WE-011 复合并发危险类不复发。Wave 2 codified 的复杂 move-aside 协议在 Wave 3 不再需要（仍保留作 Phase 2+ 多 worker 协作时复用）。
- **Token cost 大幅下降**：长期 Claude session 1 个（orchestrator），per PR Claude touch ≤ 3，codex 5.5 替代多个长期 Claude worker。预期 Wave 3 总 token 成本 ~Wave 2 的 1/5 至 1/10。
- **TDD 前置降 forward-fix**：PR.md 强制 `test_cases` 字段非空 + executor 自跑 vitest 全 PASS 才进 review。测试盲点暴露到 review 之前，预期 forward-fix rate 24% → ≤ 15%。
- **Spec match 比 line-level review 更被强调**：reviewer codex 5.5 + pr-writer ACCEPT 都对照 PR.md 验收，避免"代码看着没问题但偏离 spec"。
- **职能化清晰**：D6 codex profile 表 + D7 subagent 表 = 每个 PR 任务的执行者按职能选定，PR.md 的 `executor` 字段显式声明。

### Costs

- **Wall-clock 较慢**：PR 串行 → Wave 3 实施时间预期比 Wave 2 长 1.5-2x。但 token cost 显著降低，整体经济收益正。
- **Codex echo chamber 风险**：D1 stage 2 + 3 都是 codex 5.5（同模型），可能盲点重合。**缓解 = D2 row 1+4 触发 D1 stage 4 Claude pre-commit review；其他 PR 的 echo 风险由 D1 stage 6 ACCEPT 二次核对**。
- **Specialization 损失**：Tier 1 worker 退役 = "kernel-architect 的领域知识"等不再常驻 session。**缓解 = PR.md 注入 spec / ADR / CONTRACT 引用，每次 PR 重新装载领域上下文**。
- **agent-contract.md 大重构**：本 ADR 触发 Tier 1 worker 名单 / Tier 3 audit 形态 / codex tool 目录全部更新。下游生成（CLAUDE.md / .claude/agents/*.md / docs/runbooks/team-operations.md / docs/runbooks/codex-tool-invocations.md）全部需 `pnpm generate:configs`。

### Risks (mitigated)

- **Risk**：codex executor 写出违反领域 contract 的代码（e.g., 误用 KernelAdapter）。**Mitigation**：PR.md 必填 `contracts_affected` + `adr_touched` 字段 + reviewer codex 注入 ADR-0006 8-point checklist。
- **Risk**：pr-writer Claude subagent 单模型可能写出 ambiguous PR.md。**Mitigation**：orchestrator 与 pr-writer 协商时可迭代 0-2 轮（同 plan-challenger 模式）。锁定后才进 stage 2。
- **Risk**：高风险 PR 的 D2 触发判定漏网（pr-writer 未声明 `adr_touched` 或 `contracts_affected`）。**Mitigation**：orchestrator 在 PLAN stage 锁定时审核此声明决定 D2 触发；codex-structure-auditor 每 PR 跑也会捕获 contract drift。
- **Risk**："PR 串行"带来 Wave 3 实施时间过长。**Mitigation**：Wave 3 plan-draft 时按 stage 分组（5 stage × ~5 PR/stage），每 stage 内串行但 stage 之间可独立评估；user 可在 stage 边界决定是否调整剩余 plan。
- **Risk**：bootstrap 例外（本 ADR 由 gatekeeper 直接起草，未走 D1 pipeline）让人质疑模型自洽性。**Mitigation**：明确 bootstrap 例外仅适用于"引入或修改 D1 pipeline 自身"的 meta-level 改动；普通 PR 严格走 pipeline。

## Implementation

1. ✅ **ADR-0011 written**（this file）
2. ⏳ **agent-contract.md 重构**：
   - Tier 1 worker section: 11 → 0 + deprecation 行说明
   - Tier 2 process: git-operator 退役 + pr-reviewer 标"orchestrator 兼"
   - Tier 3 audit: 4 个全 codex tool（structure-auditor / performance-auditor / link-checker / mdx-doctor 全部移到 tool_patterns 段）
   - 新增 Subagent section（pr-writer / ux-ui-lead / refactorer / researcher）
   - tool_patterns: 新增 4 profile（codex-generic-executor / codex-structure-auditor / codex-perf-auditor / codex-mdx-doctor）+ 升级 1 profile（pr-gate → codex-pr-reviewer-55）
3. ⏳ **`pnpm generate:configs`**：重新渲染 CLAUDE.md / AGENTS.md / .claude/agents/*.md / docs/runbooks/team-operations.md / docs/runbooks/codex-tool-invocations.md
4. ⏳ **`docs/plans/active.md` 更新**：Wave 3 plan-draft 前置依赖 += ADR-0011；Wave 3 起步必先解决 += "agent-contract.md 重构 + regen"
5. ⏳ **commit bundle**（per ADR-0006 D8 explicit-file-list staging）：ADR-0011 + agent-contract.md + 全部 generated downstream + active.md
6. ⏳ **Wave 3 plan-draft**：按 D1-D8 模型起草 stage→PR 划分（参 ADR-0010 D7 deferred 列表）

**Bootstrap 例外**：本 ADR 由 gatekeeper（Claude Opus 4.7 1M ctx, Windows session）直接起草 + commit，**不走 D1 pipeline**。理由：D1 pipeline 引入本身需要先有 ADR-0011，循环依赖。仅 D1 pipeline 自身的 meta-level 改动适用此例外；普通 PR 严格走 pipeline。

post-commit 由 user 直接验收（user 是 ADR-0011 D-list 的实质决策者，本 session 全程协商对齐）。

## Related

- [ADR-0001](ADR-0001-stack-selection.md) — 技术栈基础
- [ADR-0002](ADR-0002-wave-1-close.md) — Wave 1 close（template for ceremony ADR）
- [ADR-0004](ADR-0004-agent-team-dispatch-model.md) — Agent team 模式（部分 supersede：长期 teammate 收敛到 1）
- [ADR-0006](ADR-0006-asymmetry-audit-checklist.md) — 8-point checklist（注入 reviewer codex profile）+ D8 staging（注入 reviewer codex commit phase）
- [ADR-0007](ADR-0007-job-function-codex-heavy-execution.md) — codex-heavy 执行（**深化为 Wave 3+ 默认**：codex executor 取代 Tier 1 worker，subagent 形态收敛 ux-ui-lead，新增 4 个 profile）
- [ADR-0008](ADR-0008-wave-2-entry-policies.md) — Wave 2 entry policies (dead-dep)
- [ADR-0009](ADR-0009-block-kind-union-expansion.md) — BlockKind union expansion
- [ADR-0010](ADR-0010-wave-2-close.md) — Wave 2 close (WE-001/009/011 process learnings — 本 ADR D1 串行结构性消除该 hazard 类)
- WE-001 / WE-009 / WE-011 — 并发 hazard 类（Wave 2 codified；本 ADR D1 串行执行结构性消除）
- WE-007 — codex spark PASS != lint clean（本 ADR D6 deprecate codex 5.3-spark code-reviewer 的依据）
