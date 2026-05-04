# Pre-A2 — ADR-0016 grid 数据模型 design lock + W5-1 invariant + plan-challenger 4-round

> **Wave 5 Pre-A ADR design-lock PR.** Authors `docs/decisions/ADR-0016-grid-data-model.md`
> (status: proposed) per Wave 5 plan v0.2 Pre-A2 scope + granularity doc v0.3.4 § "v2 整体
> 用户体验" + § "ADR-0012 Grid 数据模型与流动" body (旧编号 0012 → 新编号 0016 per
> plan v0.2 D5 ADR 编号映射表). Locks 12-col grid + grid-auto-flow row (NOT dense) +
> data model `{col, row?, colSpan, rowSpan: number | 'auto'}` + markdown rowSpan='auto'
> 不入持久化的不对称 + 其他 block rowSpan integer 入持久化 + Responsive 12/6/1 +
> COL_SNAPS = [2,3,4,6,8,12]. Adds W5-1 invariant to `block-foundation/CONTRACT.md`
> (grid context dimensions ↔ colSpan/rowSpan 联动). Updates `docs/decisions/README.md`
> ADR roster (ADR-0015 missing entry from Wave 4 close PR #49 + new ADR-0016).
> Plan-challenger codex 4-round per ADR-0007 D5 + R13 + Wave 4 Pre-A2 ADR-0014 12/12
> absorbed precedent. D2 row 1+4 HIT → stage 4 PRE-COMMIT CLAUDE REVIEW fires.

## title

Wave 5 — author ADR-0016 grid 数据模型 (12-col grid + row flow + data model + COL_SNAPS
+ 响应式) status proposed + add W5-1 invariant to `block-foundation/CONTRACT.md` (grid
context dimensions ↔ colSpan/rowSpan 联动 公式) + update `docs/decisions/README.md` ADR
roster (add ADR-0015 missing entry from Wave 4 close PR #49 + add ADR-0016) + dispatch
plan-challenger codex 4-round (Pre-A2 ADR design-lock per Wave 4 Pre-A2 12/12 precedent)
+ absorb verdicts → ADR-0016 status proposed lock. Closes Wave 5 plan v0.2 Pre-A2
acceptance.

## files

Modified (5 files):

- `docs/decisions/ADR-0016-grid-data-model.md` — NEW; ~560 LOC ADR with D1-D12 (12-col
  grid + grid-auto-flow row + data model {col,row?,colSpan,rowSpan} + markdown
  rowSpan='auto' rendering-derived 不对称 (with 两阶段稳态 per Q3 absorbtion) + 其他
  block rowSpan integer 持久化 + Responsive 12/6/1 (with 转场态 FSM per Q5 absorbtion) +
  COL_SNAPS [2,3,4,6,8,12] (with effectiveColSnaps mapping per Q4 absorbtion) +
  MDX serialize + Astro renderer + W5-1 invariant (with SSR vs hydration 阶段策略 per
  Q6 absorbtion) + BlockUIDefinition grid 字段 + gridKind enum + proseGridDefaults
  (per Q7+Q8 absorbtion) + Tiptap inside / grid outside 分层 + D12 layoutEpoch
  single-source reducer per Q9 absorbtion) + 权威矩阵 + 冲突仲裁规则 section (per
  Q1 absorbtion) + Sister-document sync section (per Q10 absorbtion; 4 sister CONTRACTs
  forward-pointer) + AC#1-#11 (with testability 分层 note per Q11 partial) +
  Plan-challenger 12/12 absorbtion table
- `packages/block-foundation/CONTRACT.md` — W5-1 invariant added under `## Invariants`
  section (after W4-1; ~30 LOC inline addition); cross-references ADR-0016 D2/D3/D4/D5/D9
  + ADR-0014 v0.5 amendment forward-pointer
- `docs/decisions/README.md` — ADR roster updated: NEW row for ADR-0015 (Wave 4 close
  was missing entry from PR #49 — historical fix bundled per ADR-0006 D8 sister-doc-sync
  same-PR with ADR-0016 添加) + NEW row for ADR-0016 (status: proposed)
- `docs/audits/codex-runs/2026-05-04-Pre-A2-plan-challenge.txt` — truncated archive of
  plan-challenger codex dispatch (per R7 /tmp piping; full raw at
  `/tmp/codex-runs/2026-05-04-Pre-A2-plan-challenge.txt`); R21 grep-for-verdict
  curation if log > 500 KB
- `docs/plans/wave-5-main/Pre-A2-adr-0016-grid-data-model.md` — this PR.md
  (self-listed per ADR-0006 D8 strict whitelist)

= **5 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md` — locked v0.2 at
  Pre-A1 (HEAD `365173e`); not revised by Pre-A2. Pre-A2 acceptance is plan v0.2 Pre-A2
  scope realized; NOT plan amendment.
- `docs/plans/active.md` — Pre-A2 squash HEAD will be appended to Wave 5 PR roster
  table by NEXT Pre-A PR (Pre-A3) per archive-bundle pattern; this PR does NOT touch
  active.md (avoids reverse-pointer drift; Pre-A3 picks up Pre-A2 squash HEAD)
- `packages/block-foundation/src/types.ts` — `BlockUIDefinition` `gridDefault` +
  `rowSpanSemantic` field add (per ADR-0016 D10) is **Stage C.2 实施** scope; this Pre-A2
  PR is design lock only; no source code touched
- `packages/mdx-bridge/**/*` — MDX serialize/parse for col/row/colSpan/rowSpan (per ADR-0016
  D7) is **Stage C.2 实施** scope
- `apps/site/**/*` — Astro renderer grid layout (per ADR-0016 D8) is **Stage C.2 实施** scope
- `pnpm-lock.yaml` / `package.json` — no dep changes (pure ADR doc-only PR)
- `apps/site/test-results/` — Stage C.1 housekeeping; out of scope here

## test_cases

Pre-A2 is ADR doc design-lock + CONTRACT invariant + ADR roster update + plan-challenger
audit log archive. Tests are doc-acceptance assertions, structural shell asserts, and
repo-hygiene gates.

- **TC1** (ADR-0016 file exists at expected path) Input:
  `test -f docs/decisions/ADR-0016-grid-data-model.md && echo OK`. Expected: `OK`.
  Location: shell.
- **TC2** (ADR-0016 status proposed in header table; allow v0.X.X
  absorbtion suffix per Wave 4 ADR-0014 v0.2 status precedent) Input:
  `grep -cE '^\| 状态 \| proposed' docs/decisions/ADR-0016-grid-data-model.md`.
  Expected: `1` (line starting with `| 状态 | proposed` matches both
  bare `proposed |` and `proposed (v0.X.X ...) |` post-absorbtion forms).
  Location: shell.
- **TC3** (ADR-0016 contains D1-D11 sections + AC#1-#11 + Plan-challenger absorbtion
  + Compliance + Related) Input:
  `grep -cE '^### D[0-9]+ —|^[0-9]+\. \*\*AC#[0-9]+|^## Plan-challenger codex absorbtion|^## Compliance|^## Related' docs/decisions/ADR-0016-grid-data-model.md`.
  Expected: ≥ 25 (11 D + 11 AC + 1 Plan-challenger + 1 Compliance + 1 Related = 25
  minimum; some D + AC variations may add). Location: shell.
- **TC4** (ADR-0016 D6 explicit COL_SNAPS = [2,3,4,6,8,12]) Input:
  `grep -cE 'COL_SNAPS = \[2,?\s*3,?\s*4,?\s*6,?\s*8,?\s*12\]|2,\s*3,\s*4,\s*6,\s*8,\s*12' docs/decisions/ADR-0016-grid-data-model.md`.
  Expected: ≥ 2. Location: shell.
- **TC5** (ADR-0016 D3 markdown 不对称 explicit) Input:
  `grep -cE 'rowSpan=.auto.+rendering-derived|不入持久化|不对称' docs/decisions/ADR-0016-grid-data-model.md`.
  Expected: ≥ 4 (multiple mentions across D3 prose). Location: shell.
- **TC6** (ADR-0016 D5 Responsive 12/6/1 explicit) Input:
  `grep -cE '桌面|平板|手机|12 列|6 列|1 列|1024px|768px' docs/decisions/ADR-0016-grid-data-model.md`.
  Expected: ≥ 5 (multiple hits across D5 + drift table + AC#7). Location: shell.
- **TC7** (CONTRACT.md W5-1 invariant added with ADR-0016 cross-ref) Input:
  `grep -cE '^- \*\*W5-1' packages/block-foundation/CONTRACT.md`. Expected: `1`.
  Location: shell.
- **TC8** (CONTRACT.md W5-1 cross-references ADR-0016) Input:
  `grep -E 'W5-1.*ADR-0016|W5-1.*grid' packages/block-foundation/CONTRACT.md | wc -l`.
  Expected: ≥ 1. Location: shell.
- **TC9** (CONTRACT.md W5-1 contains height formula) Input:
  `grep -cE 'rowSpan \* 62 - 14|62.*-.*14|rowSpan.*62' packages/block-foundation/CONTRACT.md`.
  Expected: ≥ 1. Location: shell.
- **TC10** (ADR roster includes ADR-0015 + ADR-0016) Input:
  `grep -cE '^\| \[0015\]\(ADR-0015-wave-4-close\.md\)|^\| \[0016\]\(ADR-0016-grid-data-model\.md\)' docs/decisions/README.md`.
  Expected: `2`. Location: shell.
- **TC11** (Plan-challenger absorbtion table populated post-dispatch) Input:
  `awk '/^## Plan-challenger codex absorbtion/,0' docs/decisions/ADR-0016-grid-data-model.md | grep -cE '^\| (Q[0-9]+|C[0-9]+) \|'`.
  Expected: ≥ 1 (post-dispatch fill; table has at least 1 row that's NOT TBD).
  Location: shell.
- **TC12** (`pnpm check` exit 0) Input: `pnpm check`. Expected: exit 0 (no source/test
  changes; turbo cache clean). Location: shell.
- **TC13** (link-check via CI) Input: `.github/workflows/link-check.yml` on push (lychee
  CI-only). Expected: workflow `success`. Per memory `feedback_lychee_user_local_paths`
  + `feedback_lychee_autolink_in_backticks`: pre-empt scan run before push. Location:
  GitHub Actions.
- **TC14** (`pnpm-lock.yaml` unchanged) Input: `git diff main -- pnpm-lock.yaml`.
  Expected: empty. Location: shell.
- **TC15** (Plan-challenger audit log archived ≤ 2000 lines) Input:
  `wc -l docs/audits/codex-runs/2026-05-04-Pre-A2-plan-challenge.txt`. Expected:
  `≤ 2000`. Location: shell.
- **TC16** (ADR-0016 D11 Tiptap inside / grid outside 分层 explicit) Input:
  `grep -cE 'Tiptap.*inside|grid.*outside|被动数据' docs/decisions/ADR-0016-grid-data-model.md`.
  Expected: ≥ 2. Location: shell.

## contracts_affected

- `packages/block-foundation/CONTRACT.md` — NEW invariant W5-1 added under `## Invariants`
  section (~30 LOC inline; ADR-0006 D8 + ADR-0011 D2 row 1 fires; sister-doc same-PR sync
  via ADR-0016 D9 prose authority)
- ADR-0006 8-point asymmetry audit applicable items:
  - **#5 (算法 + 运行时常量复刻)**: COL_SNAPS = [2,3,4,6,8,12] is single-source export
    from `@skb/block-foundation`; no consumer-side replication allowed (Stage C.2
    enforce; this Pre-A2 lock 仅 schema)
  - **#6 (一份 CONTRACT.md 改动 → sister CONTRACT.md sync)**: block-foundation/CONTRACT.md
    W5-1 invariant 加入; **4 sister CONTRACTs** (heavy-block-boundary, mdx-bridge,
    apps/site, editor-shell — per ADR-0016 Sister-document sync section authoritative
    list) **NOT touched in Pre-A2** (W5-1 forward-pointer 仅 prose; per Q10 absorbtion +
    Wave 5 plan v0.2 D12 scope-fence whitelist; ADR-0014 v0.5 amendment + mdx-bridge
    serialize + apps/site Astro renderer + editor-shell layoutReducer 都在 Stage C.2
    实施 PR 各自 same-PR sync per ADR-0006 D8 sister-doc-sync)
  - **#8 (authority 文档改动 → generated/consumed surface 同 commit sync)**: ADR-0016
    is authority NEW; generated surface = `docs/decisions/README.md` ADR roster row;
    sync 在 same commit (per file list)

## adr_touched

- **ADR-0016** (NEW; status proposed): Wave 5 Pre-A2 design-lock; this PR creates ADR-0016
- **ADR-0015** (existing): Wave 4 close ADR; PR adds missing roster entry to README
  (historical fix bundled per ADR-0006 D8 sister-doc-sync); ADR-0015 content unchanged
- ADR-0014 (existing): forward-pointer in W5-1 invariant prose ("v0.5 amendment in Stage
  C.2"); ADR-0014 content unchanged at this Pre-A2

## acceptance

1. **ADR-0016 committed** at `docs/decisions/ADR-0016-grid-data-model.md` with status
   `proposed` (per Wave 5 plan v0.2 Pre-A2 scope + Wave 4 Pre-A2 ADR-0014 status precedent
   — proposed at design lock; accepted at Stage close ratification) — TC1+TC2 evidence.
2. **D-list D1-D11 + AC#1-#11 + Plan-challenger absorbtion + Compliance + Related**
   sections all present — TC3 evidence.
3. **D6 COL_SNAPS = [2,3,4,6,8,12]** explicit (per granularity v0.3.4 v0.3 user 共识 lock;
   override part 2 共识 [1/12, ...]) — TC4 evidence.
4. **D3 markdown rowSpan='auto' rendering-derived 不入持久化的不对称** explicit + 公式
   `rowSpan = ceil((scrollHeight + gap) / (rowHeight + gap))` 公式化 — TC5 evidence.
5. **D5 Responsive 桌面 ≥1024 12列 / 平板 768-1024 6列 / 手机 <768 1列** explicit —
   TC6 evidence.
6. **W5-1 invariant added to `packages/block-foundation/CONTRACT.md`** with ADR-0016
   cross-ref + height(px) = rowSpan * 62 - 14 公式 — TC7+TC8+TC9 evidence.
7. **ADR roster updated**: ADR-0015 (Wave 4 close, missing from Wave 4 close PR #49)
   + ADR-0016 (this PR) added to `docs/decisions/README.md` index table — TC10
   evidence.
8. **Plan-challenger codex round dispatched** + absorbtion table populated per ADR-0007
   D5 + R13 + Wave 4 Pre-A2 ADR-0014 12/12 absorbed precedent — TC11 evidence.
9. **D11 Tiptap inside / grid outside 分层** explicit (granularity v0.3.4 共识 lock; block
   grid attrs 作 Tiptap NodeView 被动数据) — TC16 evidence.
10. **`pnpm check` exit 0** (turbo cache clean; no source change in Pre-A2) — TC12 evidence.
11. **Link-check passes via CI** (lychee pre-empt scan run before push) — TC13 evidence.
12. **`pnpm-lock.yaml` unchanged** — TC14 evidence.
13. **Plan-challenger audit log archived ≤ 2000 lines** (R7 piping + R21 grep-for-verdict
    if > 500 KB) — TC15 evidence.
14. **PR.md self-listed** per ADR-0006 D8 strict whitelist — files list contains this
    PR.md.
15. **D2 trigger Row 1 (CONTRACT W5-1) + Row 4 (NEW ADR-0016)** both correctly identified
    + stage 4 PRE-COMMIT CLAUDE REVIEW fires per ADR-0011 D1 — `## D2 trigger judgment`
    section evidence.
16. **ADR-0006 8-point asymmetry audit** applicable items #5 + #6 + #8 walked at
    `## contracts_affected` — section evidence.
17. **Orchestrator-self acceptance** confirms Wave 5 plan v0.2 Pre-A2 scope honored:
    granularity doc v0.3.4 § 0012 body translated to ADR-0016 (ADR 编号映射表 D5 enforced;
    body 旧 0012 → ADR file 新 0016) + plan-challenger 4-round mandatory (per Wave 4 Pre-A2
    precedent) + W5-1 invariant locked + READMEs sync per ADR-0006 D8.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): **HIT** — `packages/block-foundation/CONTRACT.md` adds W5-1
  invariant under `## Invariants` (~30 LOC). Cross-cutting consumer impact (Stage C.2
  HeavyBlockBoundary v0.5 + mdx-bridge serialize + Astro renderer + editor-shell grid).
- **Row 2** (package add): NO. No new `package.json`; no `pnpm-lock.yaml` change.
- **Row 4** (NEW ADR): **HIT** — `docs/decisions/ADR-0016-grid-data-model.md` is NEW
  status proposed per Wave 5 plan v0.2 Pre-A2 scope.
- **Row 5** (cross ≥3 packages): NO — only `packages/block-foundation/CONTRACT.md`
  touched (1 package); other packages 留 Stage C.2 实施.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 1 + Row 4 双 HIT). Walk acceptance
bullets 1-17 + verify ADR-0006 8-point checklist items #5 + #6 + #8 + verify
plan-challenger 4-round dispatched + absorbed.

## executor

ADR design-lock PR (matches Wave 4 Pre-A2 ADR-0014 precedent: orchestrator-self for
PLAN+EXECUTE; codex pr-reviewer-55 for REVIEW; orchestrator-self PRE-COMMIT CLAUDE
REVIEW; codex pr-reviewer-55 stage 5 commit + push; pr-writer subagent ACCEPT).

- **PLAN**: orchestrator-self (this PR.md). pr-writer subagent NOT dispatched per Wave 4
  Pre-A2 precedent (ADR design-lock 是 doc-policy 单一作者; orchestrator authors plan +
  PR.md inline).
- **Plan-challenger codex round (PRE-LOCK)**: dispatched 2026-05-04 via `codex exec --yolo
  --profile plan-challenger ...`; 4-round style (challenge granularity / D-list 公式
  precision / AC list testability / boundary scenarios). Wave 4 Pre-A2 precedent: 12 challenges
  (7 high-strength). Audit log archived per R7 (raw `/tmp` + truncated archive). See
  `## Plan-challenger codex absorbtion` in ADR-0016 for per-row verdicts.
- **EXECUTE**: orchestrator-self. ~560 LOC ADR (initial draft + 12/12 plan-challenger
  absorbtion expansion) + ~30 LOC CONTRACT W5-1 + ~2 LOC README rows + audit log archive.
- **REVIEW**: codex `codex-pr-reviewer-55`. Audit log: `/tmp/codex-runs/2026-05-04-Pre-A2-pr-reviewer-55.txt`
  raw + `docs/audits/codex-runs/2026-05-04-Pre-A2-pr-reviewer-55.txt` truncated archive
  (per Wave 4 R7 piping flow; archive bundles into NEXT Pre-A PR per archive-bundle
  pattern, NOT this Pre-A2 commit).
- **PRE-COMMIT CLAUDE REVIEW**: orchestrator-self. D2 row 1+4 HIT → mandatory. Walk
  acceptance bullets 1-17 + ADR-0006 8-point checklist items #5+#6+#8 + verify
  plan-challenger absorbtion table populated.
- **COMMIT**: codex `codex-pr-reviewer-55` per ADR-0011 D1 stage 5 (PASS verdict 后由本
  profile 在同一 invocation 内执行 commit + push; per ADR-0006 D8 explicit-file-list
  staging: git reset HEAD → git add <PR.md files: list> → git diff --cached --stat 验证
  → git commit → git push). NOT bootstrap-flavored (Pre-A1 was bootstrap-flavored为新
  Wave 第一个 plan-class PR; Pre-A2 onwards 走标准 D1 stage 5 reviewer-codex-commit pattern,
  per Wave 4 Pre-A3 commit message "this is the **last** orchestrator-self commit;
  Stage A1+ uses standard D1 stage 5 reviewer-codex-commit pattern" 类比 Wave 5 Pre-A1+
  → Pre-A2+ 也是 reviewer-codex-commit).
- **ACCEPT**: pr-writer Claude subagent (second invocation; verifies the diff matches
  locked acceptance + scope creep / drop check + verifies plan-challenger absorbtion
  table populated).

## Out-of-scope (explicitly deferred)

- **Pre-A3 ADR-0017 drag/drop UX design lock** — sequential per ADR-0011 D1 strict
  serial; happens AFTER Pre-A2 merges.
- **Pre-A4 ADR-0018 v2 视觉 migration + save-path 接口冻结** — sequential PR after
  Pre-A3.
- **Pre-A5 Wave 5 plan v1.0 final lock** — sequential PR after Pre-A4.
- **Stage C.2 实施** — happens AFTER Pre-A5 v1.0 lock per R14 discipline (no
  implementation before plan v1.0):
  - `packages/block-foundation/src/types.ts` `BlockUIDefinition` 加 `gridDefault?` +
    `rowSpanSemantic?` 字段 (per ADR-0016 D10) — Stage C.2 PR
  - `packages/mdx-bridge/**/*` MDX serialize/parse for col/row/colSpan/rowSpan (per
    ADR-0016 D7) — Stage C.2 PR
  - `apps/site` Astro renderer grid layout + `@media` Responsive 12/6/1 (per ADR-0016
    D8 + D5) — Stage C.2 PR
  - `useAutoRowSpan` hook implementation (per ADR-0016 D3) — Stage C.2 PR
  - **ADR-0014 v0.5 amendment** (HeavyBlockBoundary dims grid context 联动 W5-1) —
    Stage C.2 PR
- **`apps/site/test-results/` gitignore housekeeping** — Stage C.1 scope (per ADR-0015
  D3); NOT Pre-A2.
- **block-foundation RFC.md walkthrough** for grid 字段 — Stage C.2 实施 PR scope (consumer-facing
  tutorial); ADR-0016 仅 schema authority + invariant.
- **`docs/plans/active.md` Wave 5 PR roster Pre-A2 squash HEAD update** — picked up by
  Pre-A3 per archive-bundle pattern (Pre-A3 will update active.md with Pre-A2 + Pre-A3
  rows).

## Related

- [ADR-0016 grid 数据模型 (this PR)](../../decisions/ADR-0016-grid-data-model.md)
  — the ADR being design-locked
- [Wave 5 plan v0.2 Pre-A2 scope](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — explicit authorization for Pre-A2 work + ADR 编号映射表 D5 source
- [ADR-0015 D6 Wave 5 plan-draft handoff](../../decisions/ADR-0015-wave-4-close.md)
  — Wave 5 deferred items binding (grid forward to Wave 5 Stage C.2)
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  — W4-1 invariant precedent; v0.5 amendment in Stage C.2 consume W5-1
- [ADR-0011 D1 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — KEPT for Wave 5; D2 row 1+4 fires stage 4 here
- [ADR-0009 BlockKind 4-way union](../../decisions/ADR-0009-block-kind-union-expansion.md)
  — BlockKind 不动; grid 字段 加于 BlockUIDefinition (per ADR-0016 D10)
- [ADR-0006 8-point asymmetry audit](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — items #5 + #6 + #8 walked at `## contracts_affected`
- [ADR-0003 Headless / Presentational](../../decisions/ADR-0003-headless-presentational-split.md)
  — BlockUIDefinition (D10 加 grid 字段) 是 UI 端 schema authority
- [Wave 4 Pre-A2 PR.md](../wave-4-main/Pre-A2-adr-0014-heavy-block-boundary.md) — most
  recent ADR design-lock precedent (12/12 plan-challenger absorbed)
- [Wave 5 Pre-A1 PR.md](Pre-A1-plan-lock.md) — first Wave 5 PR (plan v0.2 lock)
- [block-foundation CONTRACT.md](../../../packages/block-foundation/CONTRACT.md) — W5-1
  invariant added (D9)
- granularity doc v0.3.4 (`/mnt/d/download/web/v2-design-granularity.md`) — gatekeeper-side
  scratch; § "v2 整体用户体验" + § "ADR-0012 Grid 数据模型与流动" body 是 ADR-0016 source
  intent (per Wave 5 plan v0.2 D5 ADR 编号映射表 0012 → 0016)
- v2-styles.css (`/mnt/d/download/web/v2-styles.css` lines 140-145) — grid CSS
  implementation reference
