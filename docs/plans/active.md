# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 2 ✅ **closed** by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) (2026-05-01, HEAD `51789a1`) → Wave 3 plan-draft 待启动。

Wave 1 ✅ closed (2026-04-30, HEAD `b5e7217`) by [ADR-0002](../decisions/ADR-0002-wave-1-close.md);
Wave 2 ✅ closed (2026-05-01, HEAD `51789a1`) by [ADR-0010](../decisions/ADR-0010-wave-2-close.md) — 17 main tracks shipped + 33 commits + 9 new packages + 6 cross-package single-authority invariants + 11 WE-* process learnings codified.

**Wave 2 新增架构 ADR**:

- [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) Wave 2 entry policies — dead-dep policy + block-foundation interface freeze
- [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) BlockKind union additive expansion (`prose|component|render|viz` 4-way)
- [ADR-0010](../decisions/ADR-0010-wave-2-close.md) **Wave 2 close** — 16 errata + 6 cross-package single-authority invariants + WE-001~WE-011 process learnings

**结构 baseline**: [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md) (regular monthly audit at Wave 2 close; deltas vs Wave 1 baseline `structure-2026-04-29-wave-1.md`)
**Wave 索引**: [docs/plans/phase-1/plan.md](phase-1/plan.md)
**团队操作手册**: [docs/runbooks/team-operations.md](../runbooks/team-operations.md)

## 起手指引（新 session 拉到此文件后）

Wave 2 已闭环；下一步起 Wave 3 plan：

### Wave 3 plan 起草

主题：**集成层** — apps/site BlockRegistry 路由 + editor-shell + mdx-bridge 真实 round-trip + 8 block × 2 invariants × 1 fixture 测试套件 + search index。

1. 读 [ADR-0010](../decisions/ADR-0010-wave-2-close.md) D7 (Wave 2 deferred) + D3 (errata 列表) — Wave 3 主体范围
2. 读 [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) D3 process improvement — 结构性 union 扩展先 ADR PR + 后消费方 PR
3. 读 [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) D1 dead-dep policy — Wave 3 任何新 dep 必须立即 import
4. 读 [docs/audits/structure-2026-05.md](../audits/structure-2026-05.md) §7 Wave 3 plan-draft prereq + top 3 concerns
5. 读 ~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/ 的 WE-001 / WE-005 / WE-007 / WE-009 / WE-010 / WE-011 entries（Wave 2 codified concurrency hazards；Wave 3 必读）
6. 读 [phase-1/plan.md](phase-1/plan.md) Wave 3 行 — Wave 3 主题已宣告（集成层）
7. 读 Wave 2 plan retrospective（forward-fix rate 24% / 49 teammates / 4 D2-row-4 触发 +pr-gate）
8. 用 `superpowers:writing-plans` 起草 Wave 3 plan
9. plan-challenger（**tool**，按 ADR-0007 D5）通过 `codex exec --profile plan-challenger < plan.md > challenge.txt` 挑战 → orchestrator 修订 → lock
10. Pre-Task 0：TeamCreate `phase-1-wave-3` + spawn 必要 teammates（Wave 3 编辑/集成 工种为主：editor-integrator + editor-eng + apps/site 集成 worker + mdx-bridge-eng + 必要 reviewer/git-operator）

### Wave 3 起手必先解决

**F3 — ADR-0008 D1 第一个 mechanical violation**：`block-code` + `block-image` 声明 `@skb/design-tokens` workspace dep 但源码无 TS import（CSS 变量消费）。Wave 3 plan-draft 必须先 resolve（详见 ADR-0010 D3 #7a）：(a) 加 type-only import 占位 / (b) 仿造 block-callout `VARIANT_TOKENS` 引入 typed constants / (c) amend ADR-0008 D1 接受 CSS-variable 消费 + CONTRACT 披露。

**3 viz-block test corpora 300+ 行 pre-allowlist**：block-jupyter/kernel-bridge.test.ts (414) + block-nn-viz/tfjs-bridge.test.ts (327) + block-agent-flow/flow-bridge.test.ts (326)。Wave 3 第一批 task 加 CONTRACT pre-allowlist（仿 mdx-bridge serialize.ts 模式）。

### Wave 3 主题（提前备忘）

- **apps/site BlockRegistry 路由**：`Astro.glob('content/notes/**/*.mdx')` + components map (PascalCase → React component) + per-block view
- **editor-shell 集成**：把 editor-toolbar / slash-menu / drag-handle 组装成可用编辑器；wire BlockRegistry + kernel-registry
- **mdx-bridge round-trip 块组件**：8 个 block kind × `mdxToTiptap` + `tiptapToMdx` + 1 fixture per block × 2 invariants（idempotent + lossless）— 添加 fixture 编号 22-29（沿用 1-21 序）
- **content schema 扩展**：Wave 1 frontmatterSchema 沿用；Wave 3 可能需要 block-level metadata schemas（如 jupyter cell ID + viz state checkpoint）— 由 content-types 拥有
- **search index**：Phase 1 Wave 3 主目标之一（spec §4.2 列入 wave 3）— 选 lunr.js 或 PageFind；本地 client-side index
- **agent_bridge.py TS schema → Pydantic mirror**（carry-forward from ADR-0002 #22）—如本 wave 不做需明确 defer 到 Wave 4

### Wave 3 高风险触发预测（ADR-0007 D2）

- mdx-bridge round-trip 扩展 → row 1 (contract change in mdx-bridge) → +pr-gate +pr-reviewer
- editor-shell 是新 package → row 2 (package add) → +pr-gate +pr-reviewer
- search index 影响 build 时构建 → row 8 (CI/deploy/auth/security) → +pr-gate +pr-reviewer
- agent_bridge.py 跨 TS↔Python schema → row 5 (cross ≥3 packages) → +pr-reviewer only

## Wave 2 完工归档（参考）

- 17 main tracks shipped + 33 commits since Wave 1 close（Wave 2 commit roster 见 ADR-0010 D2）
- 9 new packages：8 block-* + kernel-pyodide + 3 editor sub-modules（editor-toolbar/slash-menu/drag-handle 是 packages/ 下新增）
- 6 cross-package single-authority invariants（BlockKind / RFC.md / KernelAdapter / calloutPropsSchema / ui-default template / editor sub-module template）
- 11 WE-* process learnings codified（concurrency hazards + verification protocols + reviewer authority discipline）
- 4 forward-fix commits（D1×2 + B2×2）；24% forward-fix rate（vs Wave 1 14%）
- ADR-0009 first ADR-authorized BlockKind extension landed cleanly（一 R3 procedural fix motivated D3 process improvement）

## Wave 1 完工归档（参考）

- 7 高风险 PR 已 commit：G/E/B/D/F/C/A，全部 codex 5.5 双审 PASS
- 12 cross-location asymmetry meta-class 实例已编入 ADR-0006 empirical 8-point checklist
- 3 cross-package single-authority invariants（frontmatterSchema / editBlockInputSchema / getInitialTheme）已对称落地到 CONTRACT.md
- vitest strict + CI test gate 已修（Task 11 systemic bug 闭环）+ lychee config 已修（Task 10）

## Related

- [overview](overview.md)
- [phase-0 plan](../superpowers/plans/2026-04-29-phase-0-scaffolding.md) ✅ closed by ADR-0001
- [phase-1 wave-1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) ✅ closed by ADR-0002
- [phase-1 wave-2 plan](../superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) ✅ closed by ADR-0010
- [phase-1 wave 索引](phase-1/plan.md)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md)
- [ADR-0002](../decisions/ADR-0002-wave-1-close.md) Wave 1 close
- [ADR-0003](../decisions/ADR-0003-headless-presentational-split.md) headless / UI 分层 + design-tokens + 开源就绪
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) 职能化分工 + Codex-heavy 执行 + teammate/tool 切分
- [ADR-0008](../decisions/ADR-0008-wave-2-entry-policies.md) Wave 2 entry policies
- [ADR-0009](../decisions/ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union
- [ADR-0010](../decisions/ADR-0010-wave-2-close.md) Wave 2 close
