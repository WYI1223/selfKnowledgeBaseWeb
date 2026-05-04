# Pre-A1 — Wave 5 plan-draft v0.1 + plan-challenger 10/10 absorbtion → v0.2 lock

> **Wave 5 plan-lock PR.** Authors `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`
> v0.1 with Pre-A roadmap (5 PRs) + Stage C.1-C.4 high-level scope + MVP Framework Notes
> per gatekeeper 2026-05-04 directive. Plan-challenger codex round (562 KB raw / 113-line
> curated archive per R7+R21) raised 10 challenges (5 high + 5 medium); orchestrator
> absorbed 10/10 → plan v0.2 lock with NEW sections (ADR 编号映射表 + Risk matrix by
> stage + handoff pack + scope-fence whitelist/blacklist + verification required) + 4
> NEW D-list items (D12 scope-fence + D13 late-surface D2 escalation + D14 MVP
> fallback timing + D15 handoff pack). Repoints `docs/plans/active.md` from "Wave 5
> plan-draft pending" to "Wave 5 plan v0.2 locked; Pre-A2 next". Bundles Wave 4 close
> residue codex review audit log per Pre-A archive-bundle pattern. Bootstrap-flavored
> doc-only PR (Wave 4 Pre-A1+2+3 precedent).

## title

Wave 5 — author plan-draft v0.1 + dispatch plan-challenger codex round +
absorb 10/10 challenges (5 high + 5 medium) → lock plan v0.2 + repoint
`docs/plans/active.md` + bundle Wave 4 close codex review residue audit log
archive (per Pre-A archive-bundle pattern). Adds 4 NEW D-list items (D12-D15)
+ 4 NEW sections (ADR 编号映射表 / Risk matrix by stage / scope-fence
whitelist/blacklist per Stage C.X / handoff pack per Stage close). Closes
ADR-0015 D6 Wave 5 plan-draft handoff requirement; first PR of Wave 5 main
pipeline.

## files

Modified (5 files):

- `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md` —
  NEW Wave 5 plan-draft v0.1; 5 Pre-A PRs + Stage C 4 子阶段 + MVP
  Framework Notes section + plan-challenger absorbtion table per
  gatekeeper 2026-05-04 directive
- `docs/plans/active.md` — repoint Wave 5 line from "Wave 5 plan-draft
  PENDING fresh session per gatekeeper 2026-05-04 directive" to "Wave 5
  in progress (Pre-A1 done; Pre-A2 ADR-0016 next)"; add Wave 5 PR
  roster table (Pre-A1 only at this point); update 起手指引 to reference
  locked plan path; ADR roster unchanged (ADR-0016/0017/0018 still TBD
  at Pre-A2/3/4)
- `docs/audits/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt` —
  truncated archive of plan-challenger codex dispatch (per R7 /tmp
  piping; full raw at `/tmp/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt`)
- `docs/audits/codex-runs/2026-05-04-wave-4-close-pr-reviewer-55-r2.txt` —
  bundled archive of Wave 4 close-ceremony PR #49 codex review R2 audit
  log (previously untracked; bundled here per Wave 4 Pre-A1→Pre-A2
  archive-bundle pattern; small bundle acceptable per ADR-0006 D8 since
  archive belongs to Wave 4 historical record retroactively bundled at
  Wave 5 Pre-A1)
- `docs/plans/wave-5-main/Pre-A1-plan-lock.md` — this PR.md
  (self-listed per ADR-0006 D8 strict whitelist)

= **5 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `docs/decisions/ADR-0015-wave-4-close.md` — locked at Wave 4 close
  ceremony PR #49; not revised by Pre-A1
- `docs/decisions/ADR-0016*.md` / `docs/decisions/ADR-0017*.md` /
  `docs/decisions/ADR-0018*.md` — TBD at Pre-A2/A3/A4; NOT in scope
- `docs/decisions/README.md` — ADR roster unchanged at Pre-A1
  (ADR-0015 already added at Wave 4 close)
- `pnpm-lock.yaml` / `package.json` — no dep changes
- `apps/site/test-results/` — Stage C.1 housekeeping; out of scope here

## test_cases

Pre-A1 is pure plan-draft + active.md prose + audit log archives; tests
are doc-acceptance assertions plus repo-hygiene gates.

- **TC1** (Wave 5 plan exists at expected path) Input:
  `test -f docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md && echo OK`.
  Expected: `OK`. Location: shell.
- **TC2** (Plan contains MVP Framework Notes section as first segment
  after Context per gatekeeper directive; only ADR 编号映射表 sits
  between Context and MVP Framework Notes per Q7 absorbtion) Input:
  `awk '/^## MVP Framework Notes/{print NR; exit}' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`.
  Expected: line number ≤ 100 (allows ADR 编号映射表 section between
  Context [line ~13] and MVP Framework Notes [line ~58]; section
  appears early in document, before any Decision/D-list content).
  Location: shell.
- **TC3** (Plan contains 5 Pre-A PRs + Stage C 4 子阶段 sections)
  Input: `grep -cE '^#### Pre-A[1-5] —|^### Stage C\.[1-4] —' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`.
  Expected: `≥ 9` (5 Pre-A + 4 Stage C). Location: shell.
- **TC4** (D-list summary populated with R14 discipline + ADR编号锁
  + Wave 5 close conditions) Input:
  `grep -cE 'R14 discipline|ADR.编号锁|Wave 5 close conditions|escape valve' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`.
  Expected: ≥ 6 hits. Location: shell.
- **TC5** (ADR编号锁 references ADR-0016/0017/0018) Input:
  `grep -cE 'ADR-0016|ADR-0017|ADR-0018' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`.
  Expected: ≥ 6 hits (each ADR mentioned at minimum twice in Pre-A2/A3/A4 + D5). Location: shell.
- **TC6** (Plan-challenger absorbtion table populated post-dispatch)
  Input: `awk '/^## Plan-challenger codex absorbtion/,0' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^\| (Q[0-9]+|C[0-9]+) \|'`.
  Expected: ≥ 1 (post-dispatch fill); table has at least 1 row that's
  NOT marked TBD (showing absorbtion happened). Location: shell.
- **TC7** (Risk predictions section enumerated 5+ items) Input:
  `awk '/^## Risk predictions/,/^## Risk matrix/' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^[0-9]+\. \*\*'`.
  Expected: ≥ 5. Location: shell. (regex range bounded by next ## section
  to avoid awk inclusive-on-first-match semantics.)
- **TC8** (active.md repoints Wave 5 to "in progress") Input:
  `grep -cE 'Wave 5 (in progress|进行中|Pre-A1 done)' docs/plans/active.md`.
  Expected: ≥ 1 (replaces "Wave 5 plan-draft PENDING"). Location:
  shell.
- **TC9** (active.md Wave 5 起手指引 references locked plan path)
  Input: `grep -cE '2026-05-04-phase-1-wave-5-integration\.md' docs/plans/active.md`.
  Expected: ≥ 1. Location: shell.
- **TC10** (`pnpm check` exit 0) Input: `pnpm check`. Expected: exit 0
  (no source/test/lockfile changes; turbo cache clean). Location:
  shell.
- **TC11** (link-check via CI) Input: `.github/workflows/link-check.yml`
  on push (lychee CI-only). Expected: workflow `success`. Per
  `feedback_lychee_user_local_paths` + `feedback_lychee_autolink_in_backticks`:
  user-local memory references in PR.md/plan use prose form NOT markdown
  link; backticked `<X>` autolinks audited. Location: GitHub Actions.
- **TC12** (`pnpm-lock.yaml` unchanged) Input:
  `git diff main -- pnpm-lock.yaml`. Expected: empty. Location: shell.
- **TC13** (Plan-challenger audit log archived + truncated to ≤ 2000
  lines) Input:
  `wc -l docs/audits/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt`.
  Expected: `≤ 2000`. Location: shell.
- **TC14** (Wave 4 close residue audit log bundled at ≤ 2000 lines)
  Input: `wc -l docs/audits/codex-runs/2026-05-04-wave-4-close-pr-reviewer-55-r2.txt`.
  Expected: `≤ 2000`. Location: shell.
- **TC15** (Pre-A1 PR.md contains R14 self-check section per Q10
  absorbtion with 3 hard 产物 tables) Input:
  `grep -cE '^### R14 触发判定表|^### Diff 风险项|^### 未触发 D2 逐条理由' docs/plans/wave-5-main/Pre-A1-plan-lock.md`.
  Expected: `= 3`. Location: shell.
- **TC16** (Plan v0.2 contains ADR 编号映射表 section + 4 NEW D-list
  items D12-D15) Input:
  `grep -cE '^## ADR 编号映射表|^\| \*\*D1[2-5]\*\* \|' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`.
  Expected: `≥ 5` (1 section header + 4 D-list rows). Location: shell.
- **TC17** (Plan v0.2 contains Risk matrix by stage section with ≥ 13
  rows per Q3 absorbtion) Input:
  `awk '/^## Risk matrix by stage/,/^## Wave 5 close ceremony/' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^\| (C\.[1-4]|All) \|'`.
  Expected: `≥ 13`. Location: shell.

## contracts_affected

None. Pre-A1 is plan + pointer + audit log archives only — no
CONTRACT.md change.

## adr_touched

None. ADR-0015 was locked at Wave 4 close ceremony (PR #49); no further
ADR touched at Pre-A1. ADR-0016/0017/0018 are NEW and TBD at
Pre-A2/A3/A4 (out-of-scope here).

## acceptance

1. Wave 5 plan-draft committed at `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`
   — TC1 evidence.
2. `## MVP Framework Notes` is first segment after Context (per
   gatekeeper 2026-05-04 directive "Plan 第一段 显式写入") — TC2
   evidence.
3. Plan covers 5 Pre-A PRs (Pre-A1 plan-draft + Pre-A2 ADR-0016 +
   Pre-A3 ADR-0017 + Pre-A4 ADR-0018 + Pre-A5 v1.0 final lock) — TC3
   evidence (≥ 5 of 9 are Pre-A).
4. Plan covers Stage C 4 子阶段 (C.1 cleanup + C.2 grid+drag + C.3
   v2 视觉 + C.4 editor-wire) per reframe v2 memory + 2026-05-04
   gatekeeper directive — TC3 evidence (≥ 4 of 9 are Stage C).
5. R14 discipline (mid-Wave reframe via plan amendment PR; memory-only
   forbidden) codified at D4 — TC4 evidence.
6. ADR编号锁 D5 references ADR-0016/0017/0018 per granularity doc
   v0.3.4 mapping — TC5 evidence.
7. Wave 5 close conditions (D9: 3 trigger paths) + sub-stage escape
   valve (D3) framed — TC4 evidence.
8. Plan-challenger codex round dispatched + absorbtion table populated
   per ADR-0007 D5 + R13 + Wave 4 Pre-A2 precedent — TC6 evidence.
9. Risk predictions section enumerated (≥ 5 items per initial scope) —
   TC7 evidence.
10. `docs/plans/active.md` repointed to Wave 5 in-progress; Pre-A1
    listed in Wave 5 PR roster — TC8 + TC9 evidence.
11. Pre-A1 plan-challenger raw audit log truncated to
    `docs/audits/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt` per
    R7 piping — TC13 evidence.
12. Wave 4 close-ceremony PR #49 codex review R2 audit log bundled
    (previously untracked at HEAD `a157168`; archive-bundle pattern
    retroactive) — TC14 evidence.
13. `pnpm check` exit 0 — TC10 evidence.
14. Link-check passes via CI — TC11 evidence (`feedback_lychee_*`
    pre-empt scan run before push).
15. `pnpm-lock.yaml` unchanged — TC12 evidence.
16. PR.md self-listed per ADR-0006 D8 — TC9 PR.md mention evidence.
17. Orchestrator-self acceptance check confirms 2026-05-04 gatekeeper
    directives honored: per-ADR plan-challenger 4-round (Pre-A2/3/4
    each round; Pre-A1 plan-challenger this PR) + lock v1.0 before
    Wave 5 implementation (codified at D1 + Pre-A5 acceptance) +
    R14 discipline enforced (codified at D4 +阈值化 per Q6 absorbtion).
18. **Q10 R14 self-check produced**: this PR.md `## R14 self-check`
    section contains 3 hard 产物 (R14 触发判定表 + Diff 风险项 + 未触发
    D2 逐条理由). Pre-A1 marked done only when all 3 tables present
    (procedural enforcement, not prose only).
19. **Plan-challenger 10/10 absorbtion table populated** in plan v0.2
    `## Plan-challenger codex absorbtion` section; cross-reference to
    each Q1-Q10 verdict's `Locked at` location verifiable by reviewer.
20. **4 NEW D-list items (D12 scope-fence + D13 late-surface D2 +
    D14 MVP fallback timing + D15 handoff pack)** present in plan
    v0.2 D-list summary table.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — plan + active.md + audit log
  archives are workplan/pointer/historical doc, not CONTRACT.md.
- **Row 2** (package add): NO.
- **Row 4** (new ADR): NO — ADR-0015 was locked at Wave 4 close (PR
  #49); no new ADR here. ADR-0016/0017/0018 are NEW but TBD at
  Pre-A2/A3/A4.
- **Row 5** (cross ≥3 packages): NO — root + docs only.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW NOT mandatory** (no D2 row
hit). Orchestrator-self review at minimum (per Wave 4 Pre-A1+Pre-A2+Pre-A3
bootstrap pattern). Codex stage 3 review still runs per discipline.

## R14 self-check (per Q10 absorbtion — procedural enforcement, NOT prose only)

Per Wave 5 plan v0.2 D4 (R14 阈值化 + scope refinement 2 档触发器), Pre-A1
self-checks 3 hard 产物 below. Without all 3, Pre-A1 cannot be marked done.

### R14 触发判定表 (this PR)

| R14 trigger candidate | 触发? | 证据 |
|---|---|---|
| 改变成功标准 (e.g., MVP target redefined) | NO | MVP target = v2 demo 整体体验 (per memory project_wave4_reframe_v2.md + 2026-05-04 gatekeeper directive); Pre-A1 plan v0.2 不改 |
| PR 总量变化 > 15% | NO | Pre-A1 estimate = 5 Pre-A + 18-24 main = 23-29; v0.2 estimate = 5 Pre-A + 18-25 main = 23-30; delta < 5% |
| 新增高风险模块 ≥ 1 | NO | Pre-A1 not 新增 module/package; ADR-0016/17/18 deferred to Pre-A2/3/4 (各自 plan-challenger 时再判) |
| 影响跨-package 边界 | NO | Pre-A1 pure plan-class; 不动任何 package 边界 |
| 新增/删除 跨-package ADR 目标 | NO | ADR-0016/0017/0018 已在 ADR-0015 D6 锁定为 Wave 5 deferred items, 不是 Pre-A1 新增 |

→ Pre-A1 触发 0 / 5 R14 候选; Pre-A1 是 plan-class change (scope refinement
范围内), NOT reframe. R14 plan amendment PR 不需要.

### Diff 风险项 (this PR)

Pre-A1 diff scope = 5 files, all doc/plan/audit-log:

| File | 风险类 | mitigation |
|---|---|---|
| `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md` | doc-class; 大段新写 | TC1+TC2+TC3+TC4+TC5+TC6+TC7 grep assertions; orchestrator-self review walks D1-D15; plan-challenger 10/10 absorbed table 验证 |
| `docs/plans/active.md` | pointer-class; ≤ 50 LOC change | TC8+TC9 grep assertions; orchestrator-self review |
| `docs/audits/codex-runs/2026-05-04-Pre-A1-plan-challenge.txt` | audit-log archive; curated 113 lines | TC13 wc -l ≤ 2000 |
| `docs/audits/codex-runs/2026-05-04-wave-4-close-pr-reviewer-55-r2.txt` | audit-log bundle; 1324 lines | TC14 wc -l ≤ 2000; Wave 4 historical record |
| `docs/plans/wave-5-main/Pre-A1-plan-lock.md` | this PR.md self-listed | ADR-0006 D8 strict whitelist |

→ All risk items are bounded by shell assertions + orchestrator-self review.
0 code risk; 0 lockfile risk; 0 cross-package risk.

### 未触发 D2 逐条理由 (this PR)

| D2 row | 理由 |
|---|---|
| Row 1 (CONTRACT change) | plan + active.md + audit log archives are workplan/pointer/historical doc; NOT a CONTRACT.md entity. No `packages/*/CONTRACT.md` or `apps/*/CONTRACT.md` 编辑. |
| Row 2 (package add) | NO `package.json` 编辑; 0 `pnpm-lock.yaml` change (TC12 verifies). |
| Row 4 (NEW ADR) | ADR-0015 locked at Wave 4 close PR #49; 不动. ADR-0016/0017/0018 deferred to Pre-A2/A3/A4 (各自 D2 row 4 hit at其PR). |
| Row 5 (cross ≥ 3 packages) | 0 packages 编辑; root + docs only. |
| Row 8 (CI/deploy/auth/security) | 0 GitHub workflow 编辑; 0 deploy script 编辑; 0 auth/security touch. lychee CI 检查 link-check passes, 但 .github/workflows/link-check.yml 不变. |

→ 5/5 D2 rows未 hit. Pre-A1 standard PR; orchestrator-self review at minimum.

## executor

Bootstrap-flavored doc-only PR (1st Wave 5 PR; Wave 4 Pre-A1+2+3 precedent).

- **PLAN**: orchestrator-self (this PR.md). pr-writer subagent NOT
  dispatched per Wave 4 Pre-A3 precedent (bootstrap exception:
  doc-only + plan-class change).
- **Plan-challenger codex round (PRE-LOCK)**: dispatched 2026-05-04
  via `codex exec --yolo --profile plan-challenger ...`; challenges
  raised; orchestrator absorbs/rejects per ADR-0007 D5 + R13. Audit
  log archived per R7. See `## Plan-challenger codex absorbtion` in
  the locked plan for per-row verdicts.
- **EXECUTE**: orchestrator-self. ~~700 LOC plan-draft + ~50 LOC
  active.md update + audit log archives.
- **REVIEW**: codex `codex-pr-reviewer-55`. Audit log:
  `/tmp/codex-runs/2026-05-04-Pre-A1-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-04-Pre-A1-pr-reviewer-55.txt`
  truncated archive (per Wave 4 Pre-A1 R7 piping flow; archive bundles
  into NEXT Pre-A PR per Pre-A1→Pre-A2 archive-bundle pattern, NOT
  this Pre-A1 commit).
- **PRE-COMMIT CLAUDE REVIEW**: orchestrator-self. D2 row hit NONE,
  but plan-class change with downstream impact warrants self-review.
  Walk acceptance bullets 1-17 + verify gatekeeper directives 1-4
  honored.
- **COMMIT**: orchestrator-self per ADR-0006 D8 explicit-file-list
  staging. Bootstrap-flavored exception (Wave 4 Pre-A1+Pre-A2+Pre-A3
  precedent for plan-class changes).
- **ACCEPT**: pr-writer Claude subagent (second invocation; verifies
  the diff matches locked acceptance + scope creep / drop check).

## Out-of-scope (explicitly deferred)

- **Pre-A2 ADR-0016 grid 数据模型 design lock** — first ADR-class PR
  of Wave 5; happens AFTER Pre-A1 merges per ADR-0011 D1 strict serial.
- **Pre-A3 ADR-0017 + Pre-A4 ADR-0018 + Pre-A5 v1.0 lock** — sequential
  PRs after Pre-A2.
- **Stage C.1-C.4 implementation** — happens AFTER Pre-A5 v1.0 lock per
  R14 discipline (no implementation before plan v1.0).
- **Wave 5 close ceremony (ADR-0019)** — happens at Stage C close per
  user MVP judgment OR escape valve (D9); fresh session.
- **`apps/site/test-results/` gitignore housekeeping** — Stage C.1
  scope, NOT Pre-A1 (per ADR-0015 D3).

## Related

- [Wave 5 plan-draft (this PR)](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — the plan being locked.
- [ADR-0015 D6 Wave 5 plan-draft handoff](../../decisions/ADR-0015-wave-4-close.md)
  — explicit authorization for Pre-A1 work + R14 discipline source.
- [ADR-0011 D2 v0.1.1 SOTed-PR.md amendment](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — schema discipline applied.
- [Wave 4 Pre-A3 PR.md](../wave-4-main/Pre-A3-plan-lock.md) — most
  recent precedent (plan-challenger absorbtion model + bootstrap commit
  + archive-bundle pattern).
- [Wave 4 Pre-A2 PR.md](../wave-4-main/Pre-A2-adr-0014-heavy-block-boundary.md)
  — ADR design-lock precedent (Pre-A2/3/4 of Wave 5 will follow).
- [Wave 4 Pre-A1 PR.md](../wave-4-main/Pre-A1-codex-runbook-yolo-tmp-piping.md)
  — codified `--yolo` + R7 piping + pipefail disciplines applied here.
- memory `project_wave4_reframe_v2.md` (orchestrator-local at
  `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/`) — Wave 5
  INPUT; reframe v2 design intent (NOT in git per gatekeeper-side discipline).
- granularity doc v0.3.4 at `/mnt/d/download/web/v2-design-granularity.md`
  — gatekeeper-side scratch; ADR mapping authority for ADR-0016/0017/0018
  (not in git per gatekeeper-side discipline).
