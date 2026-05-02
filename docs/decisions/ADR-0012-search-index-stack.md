# ADR-0012: Search index stack — PageFind via astro-pagefind

| 字段 | 值 |
| ---- | --- |
| 状态 | accepted |
| 日期 | 2026-05-01 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | Wave 3 Stage D opener — D1a research spike ([docs/research/2026-05-search-index-spike.md](../research/2026-05-search-index-spike.md)) recommends single static-search-index stack to satisfy [spec §4.2](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) Wave 3 search requirement; D1a research locked 3 measurable acceptance criteria for ratification here. |
| 替代 | 不替代；本 ADR 首次为 apps/site 引入 search index stack。 |

## Context

[Spec §4.2](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) 要求 Wave 3 在 apps/site 提供 client-side search 能力，覆盖：

- 全文 MDX content（prose + component blocks 渲染后的 inline text）。
- 标题 / 笔记元数据 (frontmatter title, tags)。
- 非 ASCII 内容 — 项目 user 操作语言含 CJK（plan-challenger R2 #5 explicit edge case）。

D1a researcher Claude subagent (sole web-access channel per [ADR-0011 D7](ADR-0011-linear-pipeline-execution-model.md)) one-shot 调研对比 3 个候选 (PageFind / lunr.js / flexsearch) over 8 axes（version + last-commit / bundle / index size / latency / build-vs-client / CJK / reindex / Astro integration），3 个 edge case（non-ASCII, punctuation-heavy, reindex-on-update），并产出 single-candidate recommendation。

D1a research evidence summary：

| 候选 | CJK tokenizer | Reindex story | Astro integration |
| --- | --- | --- | --- |
| **PageFind 1.5.0+** | `Intl.Segmenter` 自动 word-level（2026-04-06 发布） | build-time emit；deterministic；hash-cache-busted | 官方 `astro-pagefind` 1.8.6 adapter |
| lunr.js 2.3.9 | whitespace-only；CJK 需 `lunr-chinese` 第三方 | client-build；冷启动重建 | 无官方；手工集成 |
| flexsearch 0.7.x | `Charset.CJK` character-level only；word-level 需手工 tokenizer | build OR client；可双模 | 无官方；手工集成 |

3 个候选中只有 PageFind 同时满足 (a) word-level CJK 分词零自定义代码 (b) build-time deterministic reindex contract，因此被 D1a 推荐为 single-candidate。

## Decision

apps/site Wave 3 搜索索引 stack 采用：

1. **Index runtime**: PageFind 1.5.0+
2. **Astro adapter**: `astro-pagefind` 1.8.6+ (`@pagefind/default-ui` 可选 UI shell)
3. **构建集成路径**: D2 PR 在 `apps/site/astro.config.mjs` integrations 中注册 `astroPagefind()`；post-build 阶段 `astro-pagefind` adapter 扫描 `dist/` 静态 HTML 并发出 `dist/_pagefind/` 索引产物。
4. **UI 集成路径**: D3 PR 提供 `apps/site/src/components/SearchBox.astro` + `apps/site/src/pages/search.astro`；客户端按需 import `@pagefind/default-ui` 或调用 PageFind low-level API。

## Acceptance criteria (D1a-locked, ratified here)

D1b ratifies the 3 measurable criteria locked at D1a `## D1b ADR acceptance criteria` section ([docs/research/2026-05-search-index-spike.md](../research/2026-05-search-index-spike.md)):

1. **Bundle-size budget**: PageFind runtime + initial index chunks at first paint of search route ≤ **120 kB gzip total**, 在 `astro build` artifact 上测量（Pagefind docs 公开数据 ~70-100 kB；120 kB 留 headroom）。D2 PR 必须在 `apps/site/CONTRACT.md` 公开测量结果 + 提交可复现的测量脚本。
2. **Index-size budget**: 整体 `dist/_pagefind/` 目录 ≤ **300 kB uncompressed** at 100-note projection（≤ 30 kB 在今天 2-note corpus）；single-query chunk fetch ≤ **80 kB gzip**。D2 PR 必须公开当前 corpus 数值 + 100-note projection。
3. **Reindex-on-update mechanism (TC3, plan-challenger R2 #13)**: 索引由 `astro-pagefind` post-build hook 在每次 `astro build` 重新生成；D2 必须包含 regression test：mutate 一个 MDX 文件 → re-run `astro build` → 验证 `_pagefind/` 该 note 对应 chunk 的 content-hash 变化。**禁止** client-side reindex path（runtime fetch + rebuild index in browser）— 与 build-time deterministic 契约冲突。CDN/proxy stale-cache 风险通过 PageFind 出厂的 content-hash 文件名（每个 chunk 文件名含内容哈希）天然 cache-bust — D2 PR 应在 CONTRACT 描述中显式记录此机制（plan-challenger D1b #C4(b) absorbed）。

补充 acceptance（D1b new — beyond D1a）:

4. **CJK regression test (word-level vs character-level discriminator,
   plan-challenger D1b #C3 absorbed)**: D2 必须在 `apps/site/src/__tests__/`
   或对等 location 加入 regression test 套件，需要包含 ≥2 断言以
   不仅验证"匹配存在"还要验证"分词层级正确"：
   - **正向断言**: 索引含 `"中文笔记测试"` 的 note；query `"笔记"` 命中
     该 note。
   - **反向断言（discriminator）**: 索引含 `"笔记本电脑"` 的 note；query
     `"记本"` 必须 **NOT** 命中。原理：`Intl.Segmenter` word-level
     tokenizer 将 `"笔记本电脑"` 分为 `["笔记本", "电脑"]`，`"记本"`
     不是任一 segment 因此不命中；character-level tokenizer (flexsearch
     `Charset.CJK`) 会跨 segment 子串匹配 `"记本"` 因此命中。
     反向断言失败 ⇒ tokenizer 实为 character-level，PageFind 1.5+
     CJK contract 违反。
5. **`astro-pagefind` 版本 lock**: D2 PR 引入的 `astro-pagefind` 必须 ≥ 1.8.6（D1a 调研基线）。lower bound 写入 `apps/site/package.json`。

## Consequences

### Positive

- 单一 stack 决策；零自定义 tokenizer / reindex 调度代码（PageFind + adapter 全部 cover）。
- CJK 分词从 day-1 工作（`Intl.Segmenter` Node 18+ + 现代浏览器全量支持），不需后续追加 `lunr-chinese` 类第三方。
- Reindex contract = build artifact 的一部分；CI / dist hashing / cache invalidation 自然继承现有 `astro build` pipeline。
- Astro 官方 adapter `astro-pagefind` 已存在并在维护（1.8.6 / 2026 持续 commit）；不增加项目独立 integration 维护负担。

### Negative

- PageFind runtime + `_pagefind/` 静态目录会增加 `apps/site/dist/` 体积（criterion 1+2 cap 此影响）。
- `Intl.Segmenter` 在极老浏览器（IE11、Safari < 14.1）不可用 — 项目浏览器 baseline 是现代 evergreen，可接受。
- 如未来 PageFind project 进入 maintenance mode，stack 切换需要 D2 PR 等量级工作量；通过 acceptance criterion 1+2+3+5 显式记录测量基线，便于未来 swap 时基线对比。

### Neutral / explicit out-of-scope

- **D2** 实施 build integration + acceptance criteria 1-5 测试；D2 是独立 PR，本 ADR 仅授权 stack 选择不预言 D2 实施细节。
- **D3** 实施 UI（SearchBox + /search route + visual-smoke playwright）；D3 决定是否使用 `@pagefind/default-ui` 还是手工 React/Vanilla UI。
- **server-side search** （未来若引入 apps/api endpoint based search） 不受本 ADR 约束 — PageFind 是 client-side static 决策，server-side search 若发生需另写 ADR。
- 索引 partial language detection / 多语言 ranking — D2/D3 默认按 PageFind 出厂行为；若发现 ranking 缺陷再开后续 ADR。
- **`/search` route SSR-before-index render-safety** — D3 范畴。astro-pagefind post-build hook 在 `astro build` HTML emit 之后才生成 `dist/_pagefind/`；理论上 `/search` 静态 HTML 在打包过程中无法引用尚未存在的索引。D3 PLAN 必须 lock：(a) `/search` 客户端脚本 lazy-load PageFind runtime + index，HTML 静态壳允许 fallback 文案 "搜索就绪中" 在 fetch 完成前显示；(b) 静态预渲染期间不调用 PageFind API。本 ADR 不预言 D3 实现细节（plan-challenger D1b #C4(a) noted as out-of-scope）。

## Alternatives considered (D1a evidence)

### lunr.js — 已驳回

- CJK 分词 zero-out-of-box；`lunr-chinese` (Wiredcraft) 最近活动 2018，`lunr-languages` 不覆盖 CJK；自带维护负担违反 ADR-0008 D1 dead-dep 精神（相邻 dep family）。
- Reindex 默认 client-build；冷启动 + cold-cache 用户每次重新 tokenize + index 整 corpus，与 build-time deterministic 契约冲突。
- 自 2.3.9 (2020) 后 dormant；timeliness 不达标。

### flexsearch — 已驳回

- `Charset.CJK` character-level only；word-level CJK 需自写 segmenter（plan-challenger R2 #5 fail）。
- 0.7.x 最近 commit 活跃但 `Charset.CJK` documentation 长期未更新；社区 issue (#137) 反映 CJK 实质支持不完整（Ghost #22874 PR 公开了相同 gap）。
- Build OR client 双模 — 灵活但选 client 时与 reindex contract 冲突，选 build 时配置复杂度高于 PageFind。

### MiniSearch — 评估后未列为正式候选

- 现代 (active maintenance) + 体积小，但 CJK tokenizer 同样 character-level only + 无官方 Astro adapter；与 flexsearch 同类问题且 `astro-pagefind` 提供更优 Astro integration。

## Compliance

- 本 ADR 满足 [ADR-0008 D1](ADR-0008-wave-2-entry-policies.md) dead-dep 政策：`astro-pagefind` 是 `apps/site` 的 runtime dep（被 `astro.config.mjs` 直接 import），不是 dead dep。
- 本 ADR 满足 [ADR-0011 D7](ADR-0011-linear-pipeline-execution-model.md) researcher subagent 边界：D1a researcher 只产出 research doc + 推荐，不直接 mutate 代码；本 ADR 由 orchestrator-self drafting + plan-challenger codex 挑战，符合"researcher 一次性 dispatch + ADR 由 orchestrator-self 写"流程。
- 本 ADR 不影响 [ADR-0009](ADR-0009-block-kind-union-expansion.md) BlockKind union；与 block-foundation 完全解耦。
- 本 ADR 不引入新的 cross-package dependency；`astro-pagefind` 仅被 `apps/site` consume。

## Related

- [D1a research spike](../research/2026-05-search-index-spike.md) — 调研依据，本 ADR acceptance criteria 1-3 的事实基础。
- [D1b PR.md](../plans/wave-3-main/D1b-adr-0012-search-index-stack.md) — 本 ADR 的 PR 上下文。
- [Wave 3 plan, D1b entry](../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) — D1b plan-challenger lock 出处。
- [spec §4.2](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) — Wave 3 search 需求出处。
- [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) — pipeline 框架。
