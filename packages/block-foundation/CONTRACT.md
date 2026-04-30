# @skb/block-foundation Contract

## Public surface

- `BlockRegistry` class — 双层注册表（ADR-0003）
  - `registerCore(core)` / `registerUI(ui)`
  - `getCore(name)` / `listCores()`
  - `getUI(coreName, uiId?)` / `listUIs(coreName)`
- `defineCore(def)` / `defineUI(def)` factory helpers
- `BlockCoreDefinition<T>` / `BlockUIDefinition<T>` / `BlockViewProps<T>` interfaces
- `BlockKind = 'prose' | 'component'` （二分类，spec §1.5 关键不变量）
- `proseExtensions` — Tiptap 扩展数组，提供全部 markdown 行为

## Invariants

- `BlockKind` 二分不可破坏：新 block 必须明确归属 `prose` 或 `component`
- Prose blocks 零自写代码——任何看似需要新 prose block 的场景应通过组合 `proseExtensions` 内现有扩展或追加单条 Tiptap 扩展实现，不再加 prose-kind block
- `BlockCoreDefinition.mdxComponent` 必须 PascalCase，且与 MDX 文件 import 中使用的名字一致
- Core 与 UI 物理分离（ADR-0003）：core 不允许 import 任何 React/Tiptap 视觉 API；UI 必须 import core（不允许 inline 重复 schema）
- 同 core 多 UI 时 `getUI(name)` 取首个注册：约定首个 uiId 为 `'default'`；adopter 在 register 顺序上需谨慎
- **Defensive copy**：`listCores()` 与 `listUIs(coreName)` 每次返回 fresh array。Caller 修改返回值不影响 registry 内部 state。Implementation: `src/registry.ts:84` (`listCores`) + `src/registry.ts:96` (`listUIs`)；regression: `src/__tests__/registry.test.ts` "listCores returns a defensive copy" + "listUIs returns a defensive copy"
- **Idempotent register**：`registerCore` 同 `name` 第二次调用 throws `Duplicate core name: <name>`；`registerUI` 同 `(coreName, uiId)` 第二次 throws `Duplicate UI registration: core=<coreName> uiId=<uiId>`。避免 silent override；实现见 `src/registry.ts:60-63` + `src/registry.ts:71-75`
- **Schema strictness**：每个 `BlockCoreDefinition.propsSchema` 必须是 `z.object(...).strict()`；嵌套 `ZodObject` 同样必须 `.strict()`（[ADR-0006](../../docs/decisions/ADR-0006-asymmetry-audit-checklist.md) item #3 trip-hazard：`.strict()` 不传播）。当前类型仅约束到 `ZodTypeAny`（type-narrow 到 `ZodObject` 待 Wave 3）；Wave 2 行为约定 + reviewer + RFC.md §1 显式提醒。未 `.strict()` 不会 throw，但 `propsSchema.parse(input)` 会 silently strip unknown keys，引发 contract drift
- **Serialize / parse hook ownership**：MDX serialize/parse 由各 `block-*` 包的 `core/` own（ADR-0003 D1+D2），不在 `block-foundation` 注册。`block-foundation` 仅 own `BlockCoreDefinition` 形状（含 `mdxComponent` 字符串）；`mdx-bridge` 通过 `mdxJsxFlowElement.name` 字符串路由到对应 block 的 export（命名约定 verb-as-prefix：`serialize<BlockName>` / `parse<BlockName>`，与 mdx-bridge 现有 `mdxToTiptap` / `tiptapToMdx` 同 style）。详见 RFC.md §"5. Serialize / parse hook ownership"

## Forward-compat consumers (Wave 2+)

Wave 2 中段当 `BlockRegistry` 开始用 `@skb/content-types` 的 schema 验证
注册的 block props（如跨 block 共享的 frontmatter / metadata 形状），届时
`@skb/content-types` 将被同 PR 加入 `package.json#dependencies` +
`tsconfig.json#references`，并出现源码 `import { ... } from '@skb/content-types'`。

当前 Wave 1 close 状态：源码无 content-types import，按
[ADR-0008](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) D1
（dead-dep policy = tighten），dep 与 ref 均未声明；forward-compat 意图
仅在本 prose 段表达，不在 package.json / tsconfig 占位。

## How to register a new `block-*` package

step-by-step walkthrough (core / ui-default / 测试样板 / 错误场景 / serialize-parse 归属)
for the first real consumer 在 [RFC.md](./RFC.md) — 第一个 `block-*` PR
(Task C1 / C2) 必须 reference 此 RFC；后续 `block-*` PR 沿用相同模式。
RFC 是 consumer-facing 教程，CONTRACT.md 是 public API 形状 + 关键不变量
的权威；二者补充而非重叠（[ADR-0008 D2](../../docs/decisions/ADR-0008-wave-2-entry-policies.md)）。

## Modifying this file

公共表面（`BlockCoreDefinition` / `BlockUIDefinition` / `BlockRegistry` / `BlockKind` / `BlockViewProps` / `defineCore` / `defineUI` / `proseExtensions`）的任何字段或方法增删改一律需 ADR — **包括添加 optional 字段、改 `proseExtensions` 数组（增删 Tiptap 扩展、顺序变更、`as const` shape 变化）**。spec §2.3 把 block-foundation 列为接口包，规则"改动需 ADR；全员同步"不区分 optional vs required。

原因：optional 字段会传播到 mdx-bridge serialization + 8 个 Wave 2 block 的 core+ui 实现 + apps/site frontmatter schema；`proseExtensions` 改动直接影响 mdx-bridge round-trip fixtures + editor-shell parsing 行为；无 ADR 协调会引发漂移。

## Related

- 设计规格 §1.5 / §2.5（`../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md`）
- ADR-0003 headless / presentational 分层（`../../docs/decisions/ADR-0003-headless-presentational-split.md`）
- content-types 契约（`../content-types/CONTRACT.md`）
- mdx-bridge 契约（`../mdx-bridge/CONTRACT.md`）
- design-tokens 契约（`../design-tokens/CONTRACT.md`）
