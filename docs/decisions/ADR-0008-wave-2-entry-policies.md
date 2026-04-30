# ADR-0008: Wave 2 entry policies — dead-dep + block-foundation interface freeze

| 字段 | 值                                                                                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 状态 | accepted                                                                                                                                                          |
| 日期 | 2026-04-30                                                                                                                                                        |
| 作者 | refactorer (Claude Opus 4.7 1M ctx)                                                                                                                               |
| 触发 | structure-auditor Wave 1 close baseline §7 推荐 #1（dead-dep policy）+ #2（block-foundation interface freeze）；ADR-0002 D3 erratum #19（F1）+ #20（F2）+ #21（block-foundation RFC） |
| 替代 | 不替代任何 ADR；扩展 [ADR-0001](ADR-0001-stack-selection.md) §1.2/§1.8 monorepo 规则 + [ADR-0003](ADR-0003-headless-presentational-split.md) D2 双层接口        |

## Context

`docs/audits/structure-2026-04-29-wave-1.md` §7 提出 3 个结构关注点；其中 #1
（dead-dep policy）+ #2（block-foundation interface freeze）必须在 Wave 2 第一个
`block-*` PR 之前 lock，否则会让 block-callout 入门 PR 同时承担"消费 contract"+
"决议 dep policy" 双重负担，触发 R-round inflation（Wave 1 Track F 5 轮 + Track A
3 轮的同源教训）。

ADR-0002 D3 已记录两处 forward-compat dead-dep：

- **F1 — `packages/mdx-bridge`** `package.json#dependencies` 列出
  `@skb/block-foundation` + `@skb/content-types`，源码零 import；
  `tsconfig.json#references` 留空（即 package.json 与 tsconfig 不一致）。
- **F2 — `packages/block-foundation`** `package.json#dependencies` 列出
  `@skb/content-types`，源码零 import；`tsconfig.json#references` 已含
  `{ "path": "../content-types" }`（即 package.json 与 tsconfig 一致但都是 dead）。

structure-auditor §7 推荐 #1 给出两条互斥路径：

- **Option A（tighten）**：每个 `package.json#dependencies/peerDependencies` 中的
  `@skb/*` 必须对应至少一个源码 `from '@skb/<pkg>'` import；
  CONTRACT.md 可在 prose 段表达 forward-compat 意图，但 package.json 不占位。
- **Option B（relax）**：package.json 可 forward-declare；
  `tsconfig.json#references` 必须与 `package.json` 一致；CONTRACT.md 必须解释。

structure-auditor §7 推荐 #2 提出 block-foundation MDX renderer interface freeze：
Wave 2 brings the first `block-callout` package (per agent-contract `simple-block-eng`)
作为 `block-foundation` 双层 API 第一个真实 consumer；任何接口 gap 会在
block-callout review 阶段反复返工。

## Decision

### D1：dead-dep policy = Option A（tighten）

**规则**：每个 `package.json#dependencies` / `peerDependencies` 中的 `@skb/*`
工作区依赖**必须**对应至少一个源码 `from '@skb/<pkg>'` import。
forward-compat 意图（"Wave N+1 will consume X"）可在 CONTRACT.md prose 段表达，
但**不在 package.json 占位**。

**理由（Option A 优于 Option B）**：

1. **audit invariant 更简洁**：dead-dep = bug，结构审计不必为
   "forward-compat 是合法 dead-dep" 维护特例；structure-auditor 月度可机械化
   `grep` 检查（"package.json `@skb/*` ↔ source import 一一对应"），
   比 CONTRACT 文本对比可靠。
2. **YAGNI**：mdx-bridge / block-foundation 真用上时再加 dep 是同包改动 + 同 PR
   单点 churn；预先占位换来的"少改一行 package.json"不抵 audit 复杂度。
3. **CONTRACT prose 仍可表达意图**：authoring intent 不丢，只是不再让
   `package.json` 同时承担 "runtime fact" + "future plan" 双重语义。
4. **Phase 3 npm publish 反向证据弱**：当前 phase 全部 `private: true`
   workspace 包，npm publish 顾虑是 Phase 3 议题；届时若需 forward-compat 的
   package.json 形态可在 ADR-N 重新审视；当前不应被 hypothetical future
   requirement 绑架（CLAUDE.md hard rule "Don't design for hypothetical future"）。

**具体执行（D1 应用范围限于 Wave 1 已识别的两处）**：

| 包                             | 改动                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/mdx-bridge`          | 删 `package.json#dependencies` 的 `@skb/block-foundation` + `@skb/content-types`；`tsconfig.json` 已无相关 references，无需改；`CONTRACT.md` § "Wave 1 declared peers" 改 prose（描述 forward-compat 意图，不再宣称 deps 占位）。 |
| `packages/block-foundation`    | 删 `package.json#dependencies` 的 `@skb/content-types`；删 `tsconfig.json#references` 中 `{ "path": "../content-types" }`（与 package.json 同步）；`CONTRACT.md` 加一段 prose 说明 Wave 2 引入 content-types 的时机。 |

`structure-auditor` 月度审计（next: 2026-05）增加机械检查项：扫所有
`packages/*/package.json` 的 `@skb/*` deps，与同包 `src/**/*.{ts,tsx}` 的
`from '@skb/...'` import 比对，发现单边即报 violation。

### D2：block-foundation 注册 API freeze（spec for first real consumer block-callout）

在 `packages/block-foundation/RFC.md`（新增）写 walkthrough："block-callout
如何注册 core + ui-default 到 BlockRegistry"，覆盖：

- `registerCore(core)` + `propsSchema` + `mdxComponent` name + `serialize/parse` hook 形状
- `registerUI(ui)` + `uiId` + `EditorView` / `RenderView` 类型契约
- 错误场景（unknown core / 重复 uiId / propsSchema 非 ZodObject）的 throw 行为
- consumer-side 测试样板（`block-callout/src/__tests__/registry-integration.test.ts` 雏形）

第一个 `block-*` PR（C1: block-callout/core）必须 reference 此 RFC；后续
`block-*` PR 沿用模式。**RFC.md 不是 CONTRACT.md**：CONTRACT.md 规定 public API
形状（已存在），RFC.md 是 walkthrough（教 consumer 如何用）；二者补充而非重叠。

D2 的实施在 Task A2（owner: `block-foundation-eng`，blocked_by Task A1=本 ADR commit）。
本 ADR 仅 freeze D2 的**目标**与**承诺**；具体 RFC.md 文本由 Task A2 PR 落地。

## Consequences

### 正面

- **audit invariant 简洁可机械化**：structure-auditor 月度增加单条扫描（package.json `@skb/*` ↔ source import），覆盖 D1 不变量。
- **block-foundation 接口在 block-callout 入门前 freeze**：预防 Wave 1 R-round inflation 同源问题（教训源 ADR-0006 instances #1, #5）。
- **YAGNI 原则在 monorepo 层落地**：dead-dep 不再合法，迫使依赖在真消费时声明。
- **Wave 2 plan-draft 阻塞解锁**：Task A1 commit 后 Track C/D/E/G 全部解锁。

### 负面

- **若 Phase 3 npm publish 阶段需 forward-compat package.json 形态**（包发布前要把
  optional peer 显式声明），届时需 ADR-N 重新评估；当前判断该顾虑不充分（私有
  workspace 全程 `private: true`）。
- **block-foundation tsconfig 短期失去 content-types reference**：在 D2/D3
  block-callout 落地后会重建（block-callout 的 tsconfig refs 需要 content-types
  + block-foundation；block-foundation 自己若 Wave 2 中段开始 import content-types
  schema 用于 props 验证，再加 ref）。这是预期 churn，不是退化。

### Risks (mitigated)

- **风险**：Wave 2 中段 block-foundation 真消费 content-types 时漏加 dep + ref。
  **缓解**：`pnpm typecheck` + structure-auditor 双门会立刻报缺失（import 找不到 / refs 不一致），与 Wave 1 同类问题处理流程一致。
- **风险**：Option A 让"forward-compat 意图"只能进 CONTRACT prose，未来读者可能漏看。
  **缓解**：每个 block-* PR review chain 已强制读 CONTRACT.md（ADR-0007 D2 row 1 触发），prose 段是 review 必经；review 也会检查 dep 与 import 一致。

## Implementation

按 ADR-0006 D8 staging protocol（authority + generated/consumed surface 同 bundle staged）：

1. **同 bundle commit（本 ADR + 应用同 PR）**：
   - `docs/decisions/ADR-0008-wave-2-entry-policies.md`（本 ADR 自身）
   - `docs/decisions/README.md`（索引加 ADR-0008 行）
   - `packages/mdx-bridge/package.json`（删 2 条 dead deps）
   - `packages/mdx-bridge/CONTRACT.md` § "Wave 1 declared peers" 改 prose
   - `packages/block-foundation/package.json`（删 1 条 dead dep）
   - `packages/block-foundation/tsconfig.json`（删 references content-types）
   - `packages/block-foundation/CONTRACT.md`（加 prose 说明 Wave 2 真消费时机）
   - `pnpm-lock.yaml`（如 `pnpm install` 后有变动 — workspace dep 删除通常无 lockfile 影响，但 ADR-0006 D8 sub-form C 要求 verify）
2. **后续 PR**（Task A2，blocked_by 本 commit）：
   - 新增 `packages/block-foundation/RFC.md`
   - `packages/block-foundation/CONTRACT.md` 加一行指向 RFC.md
3. **structure-auditor 2026-05 月度审计**：增加 D1 机械扫描项；任何 dead-dep
   再现 → 直接报 violation 阻断 PR。

## Related

- [ADR-0001](ADR-0001-stack-selection.md) — 技术栈基础与 monorepo 选型
- [ADR-0002](ADR-0002-wave-1-close.md) D3 erratum #19 / #20 / #21 — F1/F2 dead-dep + block-foundation RFC prereq 来源
- [ADR-0003](ADR-0003-headless-presentational-split.md) D2 — block-foundation 双层 API
- [ADR-0006](ADR-0006-asymmetry-audit-checklist.md) D8 — staging protocol 适用本 PR
- [ADR-0007](ADR-0007-job-function-codex-heavy-execution.md) D2 row 4 — 本 PR 触发 +pr-gate +pr-reviewer
- [docs/audits/structure-2026-04-29-wave-1.md](../audits/structure-2026-04-29-wave-1.md) §7 — 推荐 #1 + #2 来源
- [docs/superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md](../superpowers/plans/2026-04-30-phase-1-wave-2-implementation.md) Task A1 / A2 — 本 ADR 应用入口
