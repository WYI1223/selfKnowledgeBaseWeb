# Pre-A4 — ADR-0018 v2 视觉 migration design lock + save-path 接口冻结 + plan-challenger 4-round

> **Wave 5 Pre-A ADR design-lock PR.** Authors `docs/decisions/ADR-0018-v2-visual-migration.md`
> (status: proposed; ~395 LOC) per Wave 5 plan v0.2 Pre-A4 scope (per Q4+Q8 absorbtion +
> D10 修订: save-path 决策提前到 Pre-A4 不留 Pre-A5). Locks (1) v2 视觉 identity:
> design-tokens OKLCH switchover (cream + 橙红 + canvas 蓝 + accent-success 绿) + Inter +
> JetBrains Mono 预连接 + block kind 顶 2px 彩色横条 (3 既有 + 5 missing = 8 kind hue per Q3; markdown 默认无横条 不参与 hue 锁定; Pre-A4
> plan-challenger 锁) + prose customization (b-quote / b-callout / b-code / aref + inline
> mark + inline code) + typography 升级 (15px/1.55 body, H1-H3 sizes/weights/tracking) +
> shadow rgba(20,15,10) 暖色调 + 8 light block CSS calibration. (2) Save-path 接口冻结:
> NoteSaveAdapter TypeScript interface + NoteState shape + LocalStorageAdapter MVP impl +
> Phase 2+ ApiAdapter forward-pointer. Updates `docs/decisions/README.md` ADR roster (add
> ADR-0018). Plan-challenger codex 4-round per ADR-0007 D5 + Wave 5 Pre-A2 12/12 + Pre-A3
> 13/13 absorbed precedent. Bundles Pre-A3 codex pr-reviewer-55 R1+R2+R3+R4 audit log
> archives per Pre-A archive-bundle pattern. D2 row 4 HIT → stage 4 PRE-COMMIT CLAUDE
> REVIEW fires.

## title

Wave 5 — author ADR-0018 v2 视觉 migration (OKLCH design-tokens + Inter/JetBrains Mono +
顶 2px 横条 8 kind hue + prose customization + typography + shadow + 8 light block
calibration) + save-path 接口冻结 (NoteSaveAdapter interface + NoteState + LocalStorage
MVP + ApiAdapter Phase 2+ forward) status proposed + update `docs/decisions/README.md`
ADR roster (add ADR-0018) + dispatch plan-challenger codex 4-round + absorb verdicts →
ADR-0018 status proposed lock + bundle Pre-A3 codex pr-reviewer-55 R1-R4 audit log
archives per Pre-A archive-bundle pattern. Closes Wave 5 plan v0.2 Pre-A4 acceptance.

## files

Modified (8 files):

- `docs/decisions/ADR-0018-v2-visual-migration.md` — NEW; ~395 LOC ADR with D1-D8 (1.
  OKLCH color tokens authoritative table 14 OKLCH + 1 hex --surface + 3 layout vars + 2. Inter/JetBrains Mono preconnect +
  3. block kind 顶 2px 横条 hue mapping 8 kinds + 4. prose customization 6 selectors +
  5. typography 升级 7 elements + 6. shadow rgba(20,15,10) 3 vars + 7. 8 light block
  CSS calibration scope + 8. save-path 接口冻结 NoteSaveAdapter interface + 3 候选路径
  trade-off + LocalStorageAdapter MVP + Phase 2+ ApiAdapter forward) + AC#1-#12 +
  Plan-challenger absorbtion table (post-dispatch fill) + Compliance + Related
- `docs/decisions/README.md` — ADR roster updated: NEW row for ADR-0018 (status:
  proposed)
- `docs/audits/codex-runs/2026-05-04-Pre-A4-plan-challenge.txt` — truncated archive of
  plan-challenger codex dispatch (per R7 /tmp piping + R21 grep-for-verdict if log >
  500 KB)
- `docs/audits/codex-runs/2026-05-04-Pre-A3-pr-reviewer-55-r1.txt` — bundled Pre-A3 R1
  codex review audit log (FAIL with 2 findings: D3 dup tiebreak + D9 mobile inconsistency;
  per Pre-A archive-bundle pattern)
- `docs/audits/codex-runs/2026-05-04-Pre-A3-pr-reviewer-55-r2.txt` — bundled Pre-A3 R2
  codex review audit log (FAIL with 2 stale prose findings; per Pre-A archive-bundle
  pattern)
- `docs/audits/codex-runs/2026-05-04-Pre-A3-pr-reviewer-55-r3.txt` — bundled Pre-A3 R3
  codex review audit log (FAIL with 2 more stale prose; per Pre-A archive-bundle pattern)
- `docs/audits/codex-runs/2026-05-04-Pre-A3-pr-reviewer-55-r4.txt` — bundled Pre-A3 R4
  codex review audit log (PASS post comprehensive stale prose sweep; commit 3d25519 +
  push; per Pre-A archive-bundle pattern)
- `docs/plans/wave-5-main/Pre-A4-adr-0018-v2-visual-migration.md` — this PR.md
  (self-listed per ADR-0006 D8 strict whitelist)

= **8 files total**. +2 vs Pre-A3 cadence because Pre-A3 had 4 R-rounds (R1+R2+R3+R4),
all 4 audit logs bundled per archive-bundle pattern (matches Wave 4 Stage A1 multi-R
bundling + lesson from Pre-A3 internal-consistency drift).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md` — locked v0.2 at
  Pre-A1; Pre-A2/3/4 不修订 plan; Pre-A5 v1.0 final lock 修订
- `docs/plans/active.md` — Pre-A2 + Pre-A3 + Pre-A4 squash HEADs will be appended to
  Wave 5 PR roster table by Pre-A5 per archive-bundle pattern
- `packages/design-tokens/CONTRACT.md` — existing public surface; Stage C.3 实施 PR
  同步 OKLCH switchover + 8 kind hue + `--accent-success` token additions; Pre-A4 NOT
  touch (scope-fence per Wave 5 plan v0.2 D12)
- `packages/design-tokens/src/tokens.css` — Stage C.3 实施 scope (OKLCH switchover);
  Pre-A4 仅 ADR schema lock
- `packages/editor-shell/CONTRACT.md` (既存 since Wave 3 Stage A) — Stage C.4 实施 PR
  同步/扩展 + NoteSaveAdapter public surface section 加 + W5-2 invariant 加; Pre-A4
  NOT touch (per scope-fence; 既存 CONTRACT 不变)
- `packages/editor-shell/src/save-adapter.ts` (NEW Stage C.4) — NoteSaveAdapter
  interface + LocalStorageAdapter impl; Pre-A4 仅 ADR schema lock
- 5 light block packages (`packages/block-{callout,code,image,math,pdf}/src/ui-default/`)
  CSS calibration — Stage C.3 实施 scope (ux-ui-lead subagent dispatch)
- `apps/site/**/*` — Stage C.3 (BaseLayout font preconnect + prose.css) + Stage C.4
  (`/notes/[slug]/edit` route mount editor-shell + NoteSaveAdapter consumer) 实施 scope
- `pnpm-lock.yaml` / `package.json` — no dep changes
- `apps/site/test-results/` — Stage C.1 housekeeping; out of scope

## test_cases

Pre-A4 is ADR doc design-lock + save-path interface lock + ADR roster update + audit log
archives. Tests are doc-acceptance assertions, structural shell asserts, repo-hygiene
gates.

- **TC1** (ADR-0018 file exists) Input: `test -f docs/decisions/ADR-0018-v2-visual-migration.md && echo OK`. Expected: `OK`.
- **TC2** (status proposed; allow v0.X.X suffix) Input: `grep -cE '^\| 状态 \| proposed' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `1`.
- **TC3** (D1-D8 + AC#1-#12 + Plan-challenger absorbtion + Compliance + Related)
  Input: `grep -cE '^### D[0-9]+ —|^[0-9]+\. \*\*AC#[0-9]+|^## Plan-challenger codex absorbtion|^## Compliance|^## Related' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 23` (8 D + 12 AC + 1 + 1 + 1).
- **TC4** (D1 token rows: 15 color (14 OKLCH + 1 hex `--surface`) + 3 layout (--row-h / --gap / --radius) = 18 rows ≥ 16 in D1 table; 2 font + 3 shadow tokens are in D2 + D6 NOT D1) Input: `grep -cE '^\| \`--' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 16` (D1 table 18 rows actual; matches acceptance bullet 3).
- **TC5** (D3 9 kind table rows: 4 既有 + 5 NEW; 8 hue tokens; markdown no hue) Input: `grep -cE '^\| (canvas|runnable|image|markdown|math|pdf|jupyter|nn-viz|agent-flow) \|' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 9` (4 既有 entries incl markdown no-hue + 5 NEW kind entries; 8 hue tokens 总 since markdown 默认无横条).
- **TC6** (D8 NoteSaveAdapter interface + LocalStorageAdapter impl explicit) Input: `grep -cE 'NoteSaveAdapter|NoteState|LocalStorageAdapter|class.*Adapter' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 6`.
- **TC7** (D8 3 候选路径 trade-off table) Input: `grep -cE '^\| \(a\)|^\| \(b\)|^\| \(c\)' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 3`.
- **TC8** (D8 Wave 5 MVP localStorage 锁; Phase 2+ apps/api forward) Input: `grep -cE 'Wave 5 MVP.*localStorage|Phase 2\+.*[Aa]pi[Aa]dapter|localStorage prototype' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 3`.
- **TC9** (Dark mode 推 Phase 2+ in Out-of-scope / Consequences) Input: `grep -cE '[Dd]ark mode.*Phase 2|tokens-dark.*留|Wave 5 NOT.*dark' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 2`.
- **TC10** (D1 `--accent-success` token + ADR-0017 D11 forward back-reference) Input: `grep -cE 'accent-success|ADR-0017 D11' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 3`.
- **TC11** (README ADR roster includes ADR-0018) Input: `grep -cE '^\| \[0018\]\(ADR-0018-v2-visual-migration\.md\)' docs/decisions/README.md`. Expected: `1`.
- **TC12** (Plan-challenger absorbtion table populated post-dispatch) Input: `awk '/^## Plan-challenger codex absorbtion/,0' docs/decisions/ADR-0018-v2-visual-migration.md | grep -cE '^\| (Q[0-9]+|C[0-9]+) \|'`. Expected: `≥ 1`.
- **TC13** (`pnpm check` exit 0). Expected: exit 0.
- **TC14** (link-check via CI) — lychee CI workflow on push. Expected: `success`.
- **TC15** (`pnpm-lock.yaml` unchanged). Expected: empty diff.
- **TC16** (Plan-challenger audit log ≤ 2000 lines). Expected: `≤ 2000`.
- **TC17** (Pre-A3 R1+R2+R3+R4 audit log archives bundled at ≤ 2000 lines each) Input: `wc -l docs/audits/codex-runs/2026-05-04-Pre-A3-pr-reviewer-55-r{1,2,3,4}.txt | grep -cE ' [0-9]+ docs/audits'`. Expected: `4`.
- **TC18** (D8 Pre-A4 vs Stage C.4 boundary explicit) Input: `grep -cE 'Pre-A4.*Stage C\.4 boundary|接口冻结约束' docs/decisions/ADR-0018-v2-visual-migration.md`. Expected: `≥ 2`.

## contracts_affected

None at Pre-A4. ADR-0018 是 design-tokens OKLCH switchover + save-path interface schema
lock; NOT cross-package CONTRACT touch. ADR-0006 D8 + ADR-0011 D2 row 1 NOT fired here.

ADR-0006 8-point asymmetry audit applicable items:
- **#5 (algorithm + runtime constants 复刻)**: 14 OKLCH color vars + 1 hex `--surface` + 3 layout vars (--row-h: 48px / --gap: 14px / --radius: 6px) + 8 kind hue (3 既有 + 5 NEW per Q3) + 3 shadow + 2 font vars 必 single-source export from `@skb/design-tokens` (Stage C.3 实施); 此 Pre-A4 lock 仅 schema; consumer-side replication 拒绝
- **#8 (authority 文档改动 → generated/consumed surface 同 commit sync)**: ADR-0018 NEW = authority; generated surface = `docs/decisions/README.md` ADR roster row; sync 在 same commit
- **#1-#4 + #6-#7**: N/A (Pre-A4 doc-only; no schema field add / status code / Zod / try-catch / cross-package CONTRACT touch)

## adr_touched

- **ADR-0018** (NEW; status proposed): Pre-A4 design-lock; this PR creates ADR-0018
- ADR-0017 (existing): D11 drop-pulse 消费 `--accent-success` token forward-pointer; ADR-0017 content 不动 (forward-pointer satisfied at Pre-A3 lock-time when this ADR D1 (token) cross-referenced)
- ADR-0016 (existing): `--row-h` + `--gap` token authoritative source cross-reference; ADR-0016 content 不动
- ADR-0014 (existing): heavy block plugin placeholder 消费 design-tokens 顶 2px 横条 (D3); v0.4+v0.5 amendments 留 Stage C.1+Stage C.2; ADR-0014 content 不动
- ADR-0005 (existing): Phase 2+ ApiAdapter 升级路径 consume API conventions; ADR-0005 content 不动
- ADR-0003 (existing): D6 design-tokens authority + tokens-dark.css forward-compat cross-reference; ADR-0003 content 不动

## acceptance

1. **ADR-0018 committed** at `docs/decisions/ADR-0018-v2-visual-migration.md` with status `proposed` — TC1+TC2.
2. **D1-D8 + AC#1-#12 + Plan-challenger absorbtion + Compliance + Related** sections present — TC3.
3. **D1 token rows: 15 color (14 OKLCH + 1 hex `--surface`) + 3 layout (--row-h / --gap / --radius) + ≥ 16 token rows total** in authoritative table — TC4.
4. **D3 8 kind hue mapping** (3 既有 hue + 5 NEW hue per Q3 = 8 hue tokens; markdown 默认无横条 不参与 hue; 9 kind rows in table) — TC5.
5. **D8 NoteSaveAdapter interface + NoteState + LocalStorageAdapter MVP impl** explicit — TC6.
6. **D8 3 候选路径 (a/b/c) trade-off table + Wave 5 MVP localStorage 锁** — TC7+TC8.
7. **Dark mode 推 Phase 2+ (Out-of-scope / Consequences acknowledgment)** — TC9.
8. **D1 `--accent-success` token + ADR-0017 D11 back-reference** — TC10.
9. **ADR roster updated**: ADR-0018 added — TC11.
10. **Plan-challenger codex round dispatched** + absorbtion table populated — TC12.
11. **`pnpm check` exit 0** — TC13.
12. **Link-check passes via CI** — TC14.
13. **`pnpm-lock.yaml` unchanged** — TC15.
14. **Plan-challenger audit log archived** ≤ 2000 lines — TC16.
15. **Pre-A3 R1+R2+R3+R4 audit log archives bundled** (per Pre-A archive-bundle pattern) — TC17.
16. **D8 Pre-A4 vs Stage C.4 boundary explicit** (接口冻结约束: 改 NoteSaveAdapter / NoteState 必走 ADR-0018 Amendment) — TC18.
17. **PR.md self-listed** per ADR-0006 D8 strict whitelist.
18. **D2 trigger Row 4 (NEW ADR-0018) HIT; Row 1 NO** correctly identified + stage 4 PRE-COMMIT CLAUDE REVIEW fires.
19. **ADR-0006 8-point asymmetry audit** items #5 + #8 walked at `## contracts_affected`; items #1-#4 + #6-#7 N/A.
20. **Orchestrator-self acceptance** confirms Wave 5 plan v0.2 Pre-A4 scope honored: granularity v0.3.4 § "v2 视觉契约要素 (认证源 = v2-styles.css)" + § "v2 编辑器 UX 要素" 翻译到 ADR-0018 D1-D7 (NEW reframe v2 forward); save-path 决策提前到 Pre-A4 (per Q4+Q8 absorbtion D10 修订); ADR consumes ADR-0017 D11 + ADR-0016 D7 + ADR-0014 forward + ADR-0005 Phase 2+; ADR编号锁 + 5 missing kind hue Pre-A4 plan-challenger 时 lock (per Q3 absorbtion).

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — ADR-0018 是 design-tokens OKLCH switchover + save-path interface schema; NOT 修改既有 CONTRACT.md. design-tokens CONTRACT.md + editor-shell CONTRACT.md 同步留 Stage C.3 + Stage C.4 实施 PR.
- **Row 2** (package add): NO. No new `package.json`; no `pnpm-lock.yaml` change.
- **Row 4** (NEW ADR): **HIT** — `docs/decisions/ADR-0018-v2-visual-migration.md` is NEW status proposed.
- **Row 5** (cross ≥3 packages): NO — root + docs only.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 4 HIT). Walk acceptance bullets 1-20 + verify ADR-0006 8-point checklist items #5+#8 + verify plan-challenger absorbed + verify Pre-A3 R1-R4 archives bundled.

## executor

ADR design-lock PR (matches Wave 5 Pre-A2 ADR-0016 + Pre-A3 ADR-0017 precedent).

- **PLAN**: orchestrator-self (this PR.md). pr-writer subagent NOT dispatched.
- **Plan-challenger codex round (PRE-LOCK)**: dispatched 2026-05-04 via `codex exec --yolo --profile plan-challenger ...`; 4-round style.
- **EXECUTE**: orchestrator-self. ~395 LOC ADR + ~2 LOC README + 5 audit log archives (Pre-A4 plan-challenger + Pre-A3 R1+R2+R3+R4).
- **REVIEW**: codex `codex-pr-reviewer-55`.
- **PRE-COMMIT CLAUDE REVIEW**: orchestrator-self. D2 row 4 HIT mandatory. Walk acceptance bullets 1-20 + 8-point #5+#8 + plan-challenger absorbtion + Pre-A3 R1-R4 archives bundled.
- **COMMIT**: codex `codex-pr-reviewer-55` per ADR-0011 D1 stage 5.
- **ACCEPT**: pr-writer Claude subagent.

**Pre-A3 internal-consistency drift lesson applied**: Pre-A3 had 4 R-rounds due to stale prose drift across multiple sections referencing same algorithm (tiebreak / mobile rules). Pre-A4 mitigation: each D-section is more self-contained; cross-references explicit + tightly scoped; pre-emptive grep before dispatch.

## Out-of-scope (explicitly deferred)

- **Pre-A5 Wave 5 plan v1.0 final lock** — sequential per ADR-0011 D1; happens AFTER Pre-A4 merges.
- **Stage C.3 实施** — `@skb/design-tokens` OKLCH switchover + Inter/JetBrains Mono preconnect + 8 light block CSS calibration + prose.css; ux-ui-lead subagent dispatch.
- **Stage C.4 实施** — NoteSaveAdapter interface + LocalStorageAdapter impl + apps/site `/notes/[slug]/edit` route + editor-shell wire-up.
- **Dark mode** (Phase 2+) — Out-of-scope/AC#10 explicit (per Q3 plan-challenger candidate + granularity Open Q2; tokens-dark.css 不加 v2 dark variant Wave 5).
- **Phase 2+ ApiAdapter** (cross-device 同步; collaborative editing) — D8 forward-pointer; consume ADR-0005 API conventions.
- **5 missing kind hue actual lock value** — Pre-A4 plan-challenger 时 验证 + lock; 不留到 Stage C.3.

## Related

- [ADR-0018 v2 视觉 migration (this PR)](../../decisions/ADR-0018-v2-visual-migration.md) — the ADR being design-locked
- [Wave 5 plan v0.2 Pre-A4 scope](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) — explicit authorization + D10 修订 per Q8
- [ADR-0017 drag/drop UX](../../decisions/ADR-0017-drag-drop-ux.md) — D11 drop-pulse 消费 `--accent-success` token (此 ADR D1)
- [ADR-0016 grid 数据模型](../../decisions/ADR-0016-grid-data-model.md) — `--row-h` + `--gap` token cross-reference
- [ADR-0015 D6 Wave 5 plan-draft handoff](../../decisions/ADR-0015-wave-4-close.md) — Wave 5 deferred items (visual + save-path forward)
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md) — heavy block plugin placeholder 消费 design-tokens 横条 (D3)
- [ADR-0011 D1 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — D2 row 4 fires stage 4 here
- [ADR-0006 8-point asymmetry audit](../../decisions/ADR-0006-asymmetry-audit-checklist.md) — items #5 + #8
- [ADR-0005 API conventions](../../decisions/ADR-0005-api-conventions.md) — Phase 2+ ApiAdapter
- [ADR-0003 D6 design-tokens authority](../../decisions/ADR-0003-headless-presentational-split.md) — D1 OKLCH switchover root reference
- [Wave 5 Pre-A3 PR.md](Pre-A3-adr-0017-drag-drop-ux.md) — most recent ADR design-lock precedent (4 R-round drift lesson)
- [Wave 5 Pre-A2 PR.md](Pre-A2-adr-0016-grid-data-model.md) — ADR-0016 design-lock precedent
- [design-tokens CONTRACT.md](../../../packages/design-tokens/CONTRACT.md) — existing public surface
- granularity doc v0.3.4 (`/mnt/d/download/web/v2-design-granularity.md`) — § "v2 视觉契约要素 (认证源 = v2-styles.css)" + § "v2 编辑器 UX 要素" body authority
- v2-styles.css (`/mnt/d/download/web/v2-styles.css` 25 KB) — token 认证源
