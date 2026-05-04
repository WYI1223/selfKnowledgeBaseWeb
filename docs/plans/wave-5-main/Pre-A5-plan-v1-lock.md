# Pre-A5 — Wave 5 plan v0.2 → v1.0 final lock + Stage C.1-C.4 per-PR breakdown

> **Wave 5 Pre-A roadmap close PR.** Updates `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`
> from locked v0.2 (Pre-A1) to **locked v1.0** with Stage C.1-C.4 per-PR breakdown
> (locked post Pre-A2 ADR-0016 + Pre-A3 ADR-0017 + Pre-A4 ADR-0018 design locks). Adds
> NEW `## v1.0 Pre-A5 final lock amendments` section with cross-referenced absorbtion
> tables (Pre-A1 + Pre-A2 + Pre-A3 + Pre-A4 = 49 challenges across 4 plan-challenger
> rounds; 41 ABSORBED + 8 PARTIALLY ABSORBED) + Stage C.1 (3 PRs) + Stage C.2 (12 PRs) +
> Stage C.3 (5 PRs) + Stage C.4 (5 PRs) = 25 implementation PRs + 5 Pre-A = **30 PRs
> total Wave 5**. Refined risk predictions + Wave 5 PR roster seeded. Repoints
> `docs/plans/active.md` to "Wave 5 plan v1.0 locked; Stage C.1 starting". Bundles
> Pre-A4 codex pr-reviewer-55 R1+R2+R3+R4+R5+R6 audit log archives (6 R-rounds; large
> drift cost lesson) per Pre-A archive-bundle pattern. Bootstrap-flavored doc-only PR
> matches Wave 5 Pre-A1 + Wave 4 Pre-A3 plan-lock precedent.

## title

Wave 5 — close Pre-A roadmap by upgrading plan v0.2 → v1.0 final lock with Stage
C.1-C.4 per-PR breakdown (25 implementation PRs locked) + Wave 5 PR roster seeded
(5 Pre-A + 25 Stage C = 30 total) + cross-referenced absorbtion tables (49 challenges
across 4 plan-challenger rounds) + refined risk predictions + repoint `docs/plans/active.md`
+ bundle Pre-A4 codex pr-reviewer-55 R1-R6 audit log archives (6 R-rounds drift lesson)
per Pre-A archive-bundle pattern. Closes Wave 5 plan v0.2 Pre-A5 acceptance + ADR-0011
D1 strict-serial Pre-A roadmap completion. **Stage C.1 ready to open** post-merge.

## files

Modified (9 files):

- `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md` — UPDATE; status
  `locked v0.2` → `locked v1.0`; appended NEW `## v1.0 Pre-A5 final lock amendments`
  section with: (1) Cross-referenced absorbtion table (49 challenges across 4 Pre-A
  plan-challenger rounds); (2) Stage C.1 PR breakdown (3 PRs locked); (3) Stage C.2 PR
  breakdown (12 PRs locked per ADR-0016 + ADR-0017 D-list); (4) Stage C.3 PR breakdown
  (5 PRs locked per ADR-0018 D1-D7); (5) Stage C.4 PR breakdown (5 PRs locked per
  ADR-0018 D8 接口冻结); (6) Refined risk predictions (Risk #8 + #9 NEW); (7) Wave 5
  PR roster seeded
- `docs/plans/active.md` — repoint Wave 5 line from "in progress (Pre-A1 done)" to
  "v1.0 locked (Pre-A5 done; Stage C.1 ready)"; update Wave 5 PR roster table with
  Pre-A2 + Pre-A3 + Pre-A4 + Pre-A5 squash HEADs + Stage C.1-C.4 PR count locked
- `docs/audits/codex-runs/2026-05-04-Pre-A4-pr-reviewer-55-r1.txt` — bundled Pre-A4 R1
  codex review audit log (FAIL with 5 findings; per Pre-A archive-bundle pattern)
- `docs/audits/codex-runs/2026-05-04-Pre-A4-pr-reviewer-55-r2.txt` — bundled Pre-A4 R2
  codex review audit log (FAIL with 5 drift residuals)
- `docs/audits/codex-runs/2026-05-04-Pre-A4-pr-reviewer-55-r3.txt` — bundled Pre-A4 R3
  codex review audit log (FAIL with 2 residuals)
- `docs/audits/codex-runs/2026-05-04-Pre-A4-pr-reviewer-55-r4.txt` — bundled Pre-A4 R4
  codex review audit log (FAIL with 1 TC4 wording)
- `docs/audits/codex-runs/2026-05-04-Pre-A4-pr-reviewer-55-r5.txt` — bundled Pre-A4 R5
  codex review audit log (FAIL with 1 WCAG contrast)
- `docs/audits/codex-runs/2026-05-04-Pre-A4-pr-reviewer-55-r6.txt` — bundled Pre-A4 R6
  codex review audit log (PASS post WCAG rule relaxation; commit 0f50e8d + push)
- `docs/plans/wave-5-main/Pre-A5-plan-v1-lock.md` — this PR.md (self-listed per
  ADR-0006 D8 strict whitelist)

= **9 files total**. +1 vs Pre-A4's 8 because Pre-A4 had 6 R-rounds (R1+R2+R3+R4+R5+R6),
all 6 audit logs bundled per archive-bundle pattern (largest R-round count in Wave 5;
records the 6-round drift cost as forward-fix classification evidence per Wave 4 R22 +
Wave 5 plan v1.0 Risk #9).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `docs/decisions/ADR-0015-wave-4-close.md` / ADR-0016-* / ADR-0017-* / ADR-0018-* —
  既有 locked at Pre-A2/3/4; Pre-A5 NOT 修订 ADR (any ADR amendment 走 plan amendment
  PR per R14 discipline; Pre-A5 is plan v1.0 lock NOT ADR amendment)
- `docs/decisions/README.md` — ADR roster up-to-date at Pre-A4 (ADR-0015/0016/0017/0018
  all present); Pre-A5 NOT touch
- `packages/block-foundation/CONTRACT.md` (W5-1 invariant locked at Pre-A2)
- `packages/editor-shell/CONTRACT.md` (W5-2 invariant 留 Stage C.2 实施 PR)
- `pnpm-lock.yaml` / `package.json` — no dep changes
- `apps/site/test-results/` — Stage C.1-3 housekeeping; out of scope here

## test_cases

Pre-A5 is plan amendment + active.md repoint + 6 audit log archives; tests are
doc-acceptance assertions, structural shell asserts, repo-hygiene gates.

- **TC1** (plan v1.0 status header) Input: `grep -cE '^\| 状态 \| \*\*locked v1\.0\*\*' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`. Expected: `1`.
- **TC2** (NEW `## v1.0 Pre-A5 final lock amendments` section) Input: `grep -cE '^## v1\.0 Pre-A5 final lock amendments' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`. Expected: `1`.
- **TC3** (Cross-referenced absorbtion table 4 rows: Pre-A1 + Pre-A2 + Pre-A3 + Pre-A4) Input: `awk '/^### Cross-referenced absorbtion tables/,/^### Stage C\.1/' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^\| Pre-A[1-4]'`. Expected: `4`.
- **TC4** (Stage C.1 PR breakdown 3 rows) Input: `awk '/^### Stage C\.1 — Cleanup PR breakdown/,/^### Stage C\.2/' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^\| C\.1-[1-3]'`. Expected: `3`.
- **TC5** (Stage C.2 PR breakdown 12 rows) Input: `awk '/^### Stage C\.2 — Grid \+ drag\/drop PR breakdown/,/^### Stage C\.3/' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^\| C\.2-[0-9]+'`. Expected: `12`.
- **TC6** (Stage C.3 PR breakdown 5 rows) Input: `awk '/^### Stage C\.3 — v2 视觉 identity PR breakdown/,/^### Stage C\.4/' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^\| C\.3-[1-5]'`. Expected: `5`.
- **TC7** (Stage C.4 PR breakdown 5 rows) Input: `awk '/^### Stage C\.4 — Editor-shell wire to apps\/site PR breakdown/,/^### Refined risk predictions/' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^\| C\.4-[1-5]'`. Expected: `5`.
- **TC8** (Wave 5 PR roster seeded with 4 Pre-A + 4 Stage C entries) Input: `awk '/^### Wave 5 PR roster/,/^\*\*Wave 5 final PR count locked/' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | grep -cE '^\| #[0-9]+|^\| TBD|^\| \(Stage C'`. Expected: `≥ 8`.
- **TC9** (Wave 5 final PR count = 30) Input: `grep -cE '30 PRs total' docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md`. Expected: `≥ 1`.
- **TC10** (active.md repoint Wave 5 v1.0 locked) Input: `grep -cE 'Wave 5.*v1\.0 locked|Pre-A5 done|Stage C\.1 (ready|starting)' docs/plans/active.md`. Expected: `≥ 2`.
- **TC11** (active.md PR roster includes Pre-A2 6e2c1d9 + Pre-A3 157a4f7 + Pre-A4 7e487ec) Input: `grep -cE '6e2c1d9|157a4f7|7e487ec' docs/plans/active.md`. Expected: `≥ 3`.
- **TC12** (`pnpm check` exit 0). Expected: exit 0.
- **TC13** (link-check via CI lychee). Expected: `success`.
- **TC14** (`pnpm-lock.yaml` unchanged). Expected: empty diff.
- **TC15** (Pre-A4 R1+R2+R3+R4+R5+R6 audit log archives bundled at ≤ 2000 lines each)
  Input: `wc -l docs/audits/codex-runs/2026-05-04-Pre-A4-pr-reviewer-55-r{1,2,3,4,5,6}.txt | grep -cE ' [0-9]+ docs/audits'`. Expected: `6`.

## contracts_affected

None. Pre-A5 is plan amendment + pointer + audit log archives only — no CONTRACT.md
change.

ADR-0006 8-point asymmetry audit applicable items:
- **#8 (authority 文档改动 → generated/consumed surface 同 commit sync)**: plan v0.2
  → v1.0 = authority amendment; consumed surface = `docs/plans/active.md` Wave 5 PR
  roster; sync 同 commit (per file list)
- **#1-#7**: N/A (Pre-A5 doc-only; no schema field add / status code / Zod / single-authority
  schema / algorithm replicas / try-catch / sister CONTRACT touch)

## adr_touched

None. Pre-A5 is plan v1.0 amendment; no ADR touched. ADR-0015/0016/0017/0018 all locked
at prior Pre-A merges + status remains as-is.

## acceptance

1. **Plan v1.0 status committed** — TC1 evidence (status header `locked v1.0`).
2. **NEW `## v1.0 Pre-A5 final lock amendments` section** present — TC2 evidence.
3. **Cross-referenced absorbtion tables** (Pre-A1 + Pre-A2 + Pre-A3 + Pre-A4 4 rows;
   49 challenges total) — TC3 evidence.
4. **Stage C.1 PR breakdown** (3 PRs locked: C.1-1 plugin placeholder + ADR-0014 v0.4
   amend / C.1-2 PDF + chunk-leak / C.1-3 gitignore) — TC4 evidence.
5. **Stage C.2 PR breakdown** (12 PRs locked per ADR-0016 + ADR-0017 D-list; mdx-bridge
   serialize / block-foundation grid 字段 / Astro renderer / editor-shell grid + useAutoRowSpan
   / drag/drop UX / resize UX / ADR-0014 v0.5 amend / drop-pulse + ghost + Esc + layoutEpoch
   / responsive 转场态 / playwright drag + resize + perf budget) — TC5 evidence.
6. **Stage C.3 PR breakdown** (5 PRs locked per ADR-0018 D1-D7; OKLCH + fonts /
   8 kind hue / prose customization + typography / shadow + 8 light block calibration /
   visual smoke baseline) — TC6 evidence.
7. **Stage C.4 PR breakdown** (5 PRs locked per ADR-0018 D8 接口冻结; NoteSaveAdapter +
   LocalStorageAdapter / `/notes/[slug]/edit` route / BlockRegistry + KernelRegistry +
   palette + slash-menu wire / save/load 双向 + layoutEpoch sync / e2e + Wave 5 close
   候选) — TC7 evidence.
8. **Wave 5 PR roster seeded** with 4 Pre-A merged squash HEADs + Pre-A5 (this PR) +
   Stage C.1-C.4 placeholders (≥ 8 entries) — TC8 evidence.
9. **Wave 5 final PR count locked at 30 (5 Pre-A + 25 Stage C)** — TC9 evidence.
10. **`docs/plans/active.md` repointed** to "Wave 5 v1.0 locked; Stage C.1 ready/starting"
    — TC10 + TC11 evidence (Pre-A2/3/4 squash HEADs in roster table).
11. **`pnpm check` exit 0** — TC12 evidence.
12. **Link-check passes via CI** — TC13 evidence.
13. **`pnpm-lock.yaml` unchanged** — TC14 evidence.
14. **Pre-A4 R1+R2+R3+R4+R5+R6 audit log archives bundled** (6 R-rounds; large drift
    lesson; per Pre-A archive-bundle pattern + Wave 5 plan v1.0 Risk #8+#9) — TC15
    evidence.
15. **PR.md self-listed** per ADR-0006 D8 strict whitelist.
16. **D2 trigger NO row hit** correctly identified (plan v1.0 amendment + active.md
    + audit logs only; no CONTRACT/ADR/package change).
17. **Refined risk predictions** added (Risk #8 multi-section drift + Risk #9 OKLCH
    R6 cost) post-Pre-A2/3/4 evidence.
18. **Stage C.1 ready to open** post-merge per ADR-0011 D1 strict-serial (Pre-A roadmap
    closes; implementation phase opens).

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — plan + active.md + audit logs only.
- **Row 2** (package add): NO.
- **Row 4** (NEW ADR): NO — Pre-A5 is plan v1.0 amendment (NOT ADR amendment); ADR-0015/0016/0017/0018 all locked at prior PRs + status unchanged.
- **Row 5** (cross ≥3 packages): NO — root + docs only.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW NOT mandatory** (no D2 row hit). Orchestrator-self
review at minimum (plan-class change with downstream impact warrants self-review). codex
pr-reviewer-55 stage 3 SKIPPED for Pre-A5 (per Wave 5 Pre-A1 precedent + Wave 4 Pre-A3
precedent for plan-class doc-only PR with prior plan-challenger rigorous review).
Bootstrap-flavored COMMIT (orchestrator-self) per Pre-A1 + Pre-A roadmap close pattern.

## executor

Bootstrap-flavored close of Pre-A roadmap (5th + last Pre-A PR; matches Wave 5 Pre-A1
+ Wave 4 Pre-A3 precedent for plan-class doc-only PR).

- **PLAN**: orchestrator-self (this PR.md). pr-writer subagent NOT dispatched.
- **Plan-challenger codex round (PRE-LOCK)**: NOT dispatched at Pre-A5 — per Wave 5
  plan v0.2 Pre-A5 scope: "若 v1.0 surface ADR amendment 必要 → Q4 escalation D2 row 4
  fires; v1.0 不应 surface 重大 ADR amendment (那应在 Pre-A2/3/4 内 absorb), 此处仅
  last-mile cross-reference 检查". Per-Pre-A2/3/4 plan-challenger rigorously reviewed
  the substantive ADR design + 49 challenges absorbed; Pre-A5 v1.0 is just the
  cross-reference lock + Stage C.1-C.4 PR breakdown (no NEW substance to challenge).
- **EXECUTE**: orchestrator-self. ~250 LOC plan v1.0 amendment + ~50 LOC active.md
  update + 6 Pre-A4 R-round audit log archives (133 lines each).
- **REVIEW**: codex pr-reviewer-55 SKIPPED per bootstrap-flavored precedent. Orchestrator-self
  review at minimum walks acceptance bullets 1-18.
- **PRE-COMMIT CLAUDE REVIEW**: orchestrator-self. D2 row hit NONE; mandatory self-review
  walks acceptance + ADR-0006 8-point #8 (authority sync).
- **COMMIT**: orchestrator-self per ADR-0006 D8 explicit-file-list staging. Bootstrap-flavored
  exception (closes Pre-A roadmap; **last orchestrator-self commit in Wave 5 Pre-A**).
  Stage C.1 onwards uses standard D1 stage 5 reviewer-codex-commit.
- **ACCEPT**: pr-writer Claude subagent (second invocation; verifies the diff matches
  locked acceptance + scope creep / drop check + Pre-A4 R1-R6 archives bundled +
  Stage C.1-C.4 PR breakdown 25 rows + Wave 5 PR roster seeded).

## Out-of-scope (explicitly deferred)

- **Stage C.1 implementation** — happens AFTER Pre-A5 merges per ADR-0011 D1 strict-serial.
  C.1-1 plugin placeholder + ADR-0014 v0.4 amend = first Stage C.1 PR.
- **Stage C.2 / C.3 / C.4 implementation** — sequential after Stage C.1 close (with
  user MVP-judgment escape valve at each stage close per Wave 5 plan v1.0 D3 + D14).
- **Wave 5 close ceremony (ADR-0019)** — happens at Stage C close per user MVP judgment
  OR escape valve OR fallback timing > 7 工作日 (per D9); fresh session.
- **Phase 2 plan-draft** — happens after Wave 5 close (or Phase 1 pause if C.4 wire 完成
  = MVP ship).
- **`apps/site/test-results/` gitignore** — Stage C.1-3 scope (per Wave 5 plan v1.0
  Stage C.1 PR breakdown C.1-3).

## Related

- [Wave 5 plan v1.0 (this PR's amendment target)](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — the plan being v0.2 → v1.0 final-locked
- [ADR-0015 D6 Wave 5 plan-draft handoff](../../decisions/ADR-0015-wave-4-close.md) —
  explicit authorization for Pre-A5 work + R14 discipline source
- [ADR-0018 v2 视觉 migration + save-path 接口冻结](../../decisions/ADR-0018-v2-visual-migration.md)
  — Pre-A4 lock; Stage C.3 + C.4 PR breakdown consumes D-list
- [ADR-0017 drag/drop UX](../../decisions/ADR-0017-drag-drop-ux.md) — Pre-A3 lock;
  Stage C.2 PR breakdown consumes D-list
- [ADR-0016 grid 数据模型](../../decisions/ADR-0016-grid-data-model.md) — Pre-A2 lock;
  Stage C.2 PR breakdown consumes W5-1 + D12 layoutEpoch + COL_SNAPS
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md) —
  v0.4 amend (Stage C.1 plugin placeholder) + v0.5 amend (Stage C.2 grid context) 在
  C.1-1 + C.2-7 PR breakdown 中显式
- [ADR-0011 D1 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — KEPT for Wave 5; Stage C.1 onwards 走标准 D1 6-stage pipeline (Pre-A roadmap closes
  at Pre-A5)
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — bootstrap-flavored commit pattern applied
- [Wave 5 Pre-A1 PR.md](Pre-A1-plan-lock.md) — most recent bootstrap-flavored plan-class
  PR precedent (Wave 5 plan v0.1 → v0.2 lock; same SKIP codex pr-reviewer-55 pattern)
- [Wave 5 Pre-A2 PR.md](Pre-A2-adr-0016-grid-data-model.md) — Pre-A2 ADR-0016
- [Wave 5 Pre-A3 PR.md](Pre-A3-adr-0017-drag-drop-ux.md) — Pre-A3 ADR-0017 (4 R-rounds)
- [Wave 5 Pre-A4 PR.md](Pre-A4-adr-0018-v2-visual-migration.md) — Pre-A4 ADR-0018
  (6 R-rounds; multi-domain ADR drift lesson)
- [Wave 4 Pre-A3 PR.md](../wave-4-main/Pre-A3-plan-lock.md) — Wave 4 plan-lock precedent
  (orchestrator-self commit + codex review SKIPPED for plan-class doc-only)
