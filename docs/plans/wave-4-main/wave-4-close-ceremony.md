# Wave 4 close ceremony — ADR-0015 + active.md repoint + audit close addendums

> **Wave 4 close ceremony PR** per gatekeeper 2026-05-04 路径修正 directive: close on **ACTUAL completed scope** (21 PRs: Pre-A 3 + A 8 + B 8 + C-1/C-2). Reframe v2 (heavy block plugin tier + grid forward + v2 visual forward + editor-shell wire-up) DEFERRED to Wave 5. Single-PR cadence per ADR-0010 (Wave 2 close) + ADR-0013 (Wave 3 close) precedent. **D2 Row 4 HIT** (ADR-0015 NEW) → ADR-0011 D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires.

## title

Ratify Wave 4 main pipeline (21 PRs, HEAD `de39e07`) via NEW [ADR-0015](../../decisions/ADR-0015-wave-4-close.md) — full retrospective (9 NEW + 13 carry-forward), Wave 5 deferred items binding handoff (reframe v2 = heavy block plugin tier + grid + v2 visual + editor wire), ADR-0011 D1 empirical evaluation continuation; repoint `docs/plans/active.md` to Wave 5 plan-draft pending; ship 3 wave-4-close audit summary addendums (light addendums vs codex re-run; justified by R18 NO-OP delta from C-1/C-2). Backfill `docs/audits/codex-runs/2026-05-04-C-1-pr-reviewer-55-r2.txt` per established C-2 / B6 / B7 audit-archive backfill pattern. PR.md self-listed per ADR-0006 D8 + Pre-A1 → C-1 precedent.

## files

6 canonical staged files + COMMIT-time +1 audit-archive backfill = **7 staged at commit**. **Executor: `orchestrator-self`** (matches Pre-A2 + ADR-0014 v0.2.1 + B7 + B6 close-ceremony precedent for doc-flavored authority work; close-ceremony scope = ADR + active.md + audit summaries + PR.md, all doc-flavored). NO `package.json` / `pnpm-lock.yaml` change. NO source code change. NO `apps/site/CONTRACT.md` or any package CONTRACT.md change.

- `docs/decisions/ADR-0015-wave-4-close.md` — **NEW** (~280 LOC). Wave 4 close ADR per ADR-0010 + ADR-0013 close-ceremony template:
  - D1 — 21-PR roster (Pre-A 3 + A 8 + B 8 + C 2) with squash HEADs + D1 stages fired per PR + forward-fix ratio analysis (true impl-defect rate 9.5% within ADR-0011 D8 ≤15% target)
  - D2 — 2 substantive ADR amendments ratified (ADR-0014 v0.2.1 + v0.3; ADR-0012 v0.1.1) + 0 new ADRs in Wave 4 main pipeline (this close ADR is the FIRST new ADR ratified at Wave 4 close)
  - D3 — Wave 5 deferred items (binding handoff): reframe v2 = heavy block plugin tier + grid forward (ADR-0016) + drag/drop forward (ADR-0017) + v2 视觉 forward (ADR-0018) + editor-shell wire-up + Stage C residue (C-3 PDF iframe + C-4 chunk-leak)
  - D4 — 9 NEW retrospective items (R14-R22 — KEY: R14 mid-Wave reframe drift; R15 B7 CRITICAL gap; R18 close-ceremony pragmatism; R20 D2 row 1+4 efficacy; R21 codex 2.6 MB log handling; R22 forward-fix classification refinement) + 13 carry-forward (R1-R13)
  - D5 — ADR-0011 D1 linear pipeline empirical evaluation continuation (21 PRs second time after Wave 3's 24); KEPT for Wave 5 without amendment to D-list; R14 + R21 added as runbook + memory disciplines (NOT pipeline structural changes)
  - D6 — Wave 5 plan-draft handoff path (per-ADR plan-challenger required + lock v1.0 before implementation + ~18-24 PR / 3-5 sessions estimate)

- `docs/plans/active.md` — **MODIFIED** (~30 LOC delta net; Wave 4 status flip + Wave 4 close summary line + ADR-0015 to ADR roster + 起手指引 rewrite for Wave 5):
  - **当前 wave** line: `Wave 4 Stage A ✅ DONE...` → `Wave 4 ✅ CLOSED 2026-05-04 (HEAD de39e07, 21 PRs) by ADR-0015. Wave 5 plan-draft PENDING fresh session per gatekeeper 2026-05-04 directive...`
  - PR roster table: backfill C-1 row (`#48 / de39e07`); add Wave 4 close row (this PR; TBD/TBD); rewrite Stage C row from `open-ended` to `✅ TRUNCATED at 2/4` with deferred items pointer to ADR-0015 D3
  - Wave 4 closed summary line added below Wave 3 closed line: `Wave 4 ✅ closed (2026-05-04, HEAD de39e07) by ADR-0015 — 21 main PRs across Pre-A + 3 stages...`
  - ADR roster: append ADR-0015 entry + tweak ADR-0014 entry to mention v0.3 amendment at B7
  - 起手指引 section: rewrite from Wave 4 implementation pre-flight to Wave 5 plan-draft pre-flight (per ADR-0015 D6 hand-off scope)
  - **Stage C 实际 PRs** sub-section preserved + rewritten (C-2/C-1 marked merged; C-3/C-4 marked deferred to Wave 5)

- `docs/audits/structure-2026-05-wave-4-close.md` — **NEW** (~50 LOC light addendum). References [`structure-2026-05-wave-4-prep.md`](../../audits/structure-2026-05-wave-4-prep.md) (B6 codex-structure-auditor dispatch) + acknowledges C-1/C-2 NO-OP delta (no package add/remove + no cross-package edge change + no source-structure shift). Conclusion: Wave 4 structure baseline at HEAD `de39e07` byte-equivalent (in audit terms) to wave-4-prep at HEAD `525e6c2`; no blocking findings.

- `docs/audits/perf-2026-05-wave-4-close.md` — **NEW** (~55 LOC light addendum). References [`perf-2026-05-wave-4-prep.md`](../../audits/perf-2026-05-wave-4-prep.md) (B6 codex-perf-auditor dispatch) + acknowledges C-1/C-2 NO-OP delta (1 string literal ~50 bytes inside existing block-jupyter chunk + 1 static asset under public/ never enters JS chunk + 1 CI-skipped test never ships to dist). B7 chunk-leak finding inherited as Wave 5 deferred (per ADR-0015 D3). No blocking findings; Lighthouse / Web Vitals CI workflow recommended for Wave 5 起手.

- `docs/audits/mdx-2026-05-wave-4-close.md` — **NEW** (~40 LOC light addendum). References [`mdx-2026-05-wave-4-prep.md`](../../audits/mdx-2026-05-wave-4-prep.md) (B6 codex-mdx-doctor dispatch) + acknowledges NO mdx-bridge source change in C-1/C-2 (Jupyter.tsx UI-default surface + apps/site CONTRACT clause + NEW kernel-pyodide CI-skipped test = none touch mdx-bridge). All 16 RTT assertions PASS unchanged. Wave 5 ADR-0016 grid 数据模型 lock will require fresh codex-mdx-doctor dispatch (mdx-bridge col/row/colSpan/rowSpan serialization is Wave 5 NEW surface).

- `docs/plans/wave-4-main/wave-4-close-ceremony.md` — **NEW** (this PR.md, self-listed per ADR-0006 D8 + Pre-A1 → C-1 precedent; ~430 LOC).

**COMMIT-time backfill** (audit-archive carryover from prior session per established C-2 / B6 / B7 pattern):

- `docs/audits/codex-runs/2026-05-04-C-1-pr-reviewer-55-r2.txt` — **NEW** (currently untracked at HEAD `de39e07`; orphan from C-1 R2 review run; backfill in this close-ceremony commit per the convention that orchestrator's last reviewer-audit log of a prior PR ships in the next PR's commit).

**COMMIT-time additions** (post stage 3 codex review; same explicit-file-list staging):

- `docs/audits/codex-runs/2026-05-04-wave-4-close-pr-reviewer-55.txt` — generated by codex-pr-reviewer-55 stage 3 dispatch; truncated archive (head -2000 per R7).
- (R2 audit if codex flags an iteration round.)

**Out of scope** (NOT staged in this PR; deferred):

- `apps/site/test-results/` — playwright per-run state untracked at HEAD; gitignore housekeeping (1-line add to root `.gitignore`); deferred to Wave 5 cleanup per ADR-0015 D3 Stage C residue.
- `docs/audits/codex-runs/2026-05-04-wave-4-close-pr-reviewer-55-r2.txt` — if R2 review fires, that audit log backfills in the FIRST Wave 5 PR per the established chicken-and-egg backfill convention.

## test_cases

Close-ceremony PR ships **0 NEW vitest unit suites** (doc-flavored work; no source code change). TDD-front discipline (per ADR-0011 D1 stage 2) for a doc-flavored ship means **shell-level grep + structural assertions** before commit. Order: TC1 ADR file presence + structure → TC2 active.md sync → TC3-TC5 audit summaries presence + key keyword greps → TC6 PR.md self-list → TC7 byte-unchanged guards across Wave 4 shipped scope → TC8 lychee discipline + `pnpm check` → TC9 R-rounds tracked.

Test verification triplets (input → expected → location):

- **TC1** (ADR-0015 file present + structural keywords): `test -f docs/decisions/ADR-0015-wave-4-close.md` exits 0; `grep -c '^## D[1-6]' docs/decisions/ADR-0015-wave-4-close.md` = 6 (D1 through D6 sections); `grep -c 'R1[4-9]\|R2[0-2]' docs/decisions/ADR-0015-wave-4-close.md` ≥ 9 (9 NEW retrospective items R14-R22 codified); `grep -c 'de39e07' docs/decisions/ADR-0015-wave-4-close.md` ≥ 2 (HEAD cited multiple places).

- **TC2** (active.md repoint sub-greps):
  - `grep -c 'Wave 4 ✅ closed' docs/plans/active.md` ≥ 1 (closed status line)
  - `grep -c 'ADR-0015' docs/plans/active.md` ≥ 3 (multiple references)
  - `grep -c 'Wave 5' docs/plans/active.md` ≥ 5 (Wave 5 plan-draft pending + 起手指引 + multiple cross-refs)
  - `grep -c '#48' docs/plans/active.md` ≥ 1 (C-1 row backfilled with PR # 48)
  - `grep -c 'de39e07' docs/plans/active.md` ≥ 2 (C-1 squash HEAD + Wave 4 close summary)
  - `grep -c 'TRUNCATED at 2/4' docs/plans/active.md` ≥ 1 (Stage C status)

- **TC3** (structure close addendum present + addendum-marker keywords):
  - `test -f docs/audits/structure-2026-05-wave-4-close.md` exits 0
  - `grep -c 'wave-4-prep' docs/audits/structure-2026-05-wave-4-close.md` ≥ 2 (references base audit)
  - `grep -c 'NO-OP' docs/audits/structure-2026-05-wave-4-close.md` ≥ 1 (delta acknowledgment)

- **TC4** (perf close addendum present + addendum-marker keywords):
  - `test -f docs/audits/perf-2026-05-wave-4-close.md` exits 0
  - `grep -c 'wave-4-prep' docs/audits/perf-2026-05-wave-4-close.md` ≥ 2
  - `grep -c 'chunk-leak\|chunk leak' docs/audits/perf-2026-05-wave-4-close.md` ≥ 1 (B7 finding inherited as Wave 5 deferred)

- **TC5** (mdx close addendum present + addendum-marker keywords):
  - `test -f docs/audits/mdx-2026-05-wave-4-close.md` exits 0
  - `grep -c 'wave-4-prep' docs/audits/mdx-2026-05-wave-4-close.md` ≥ 2
  - `grep -c 'mdx-bridge' docs/audits/mdx-2026-05-wave-4-close.md` ≥ 2 (mdx-bridge integrity unchanged)

- **TC6** (PR.md self-listed): `grep -c 'wave-4-close-ceremony.md' docs/plans/wave-4-main/wave-4-close-ceremony.md` ≥ 2 (this file lists itself in `## files` + `## Related`).

- **TC7** (byte-unchanged guards across Wave 4 shipped scope):
  `git diff origin/main -- apps/site/src/ apps/site/public/ apps/site/CONTRACT.md apps/site/astro.config.mjs apps/site/package.json pnpm-lock.yaml content/ packages/ docs/decisions/ADR-{0001..0014}-*.md docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md` reports zero modified files (close-ceremony does NOT touch any prior-Wave-4-shipped surface; it only ADDS new docs + updates active.md + ADR-0015).

- **TC8** (lychee 4-discipline pre-flight + workspace check):
  - lychee 4-discipline grep on this PR.md + ADR-0015 + active.md + 3 audit close addendums:
    - **No** `path:N` line-anchor suffix on relative file links (regression-grep over the NEW-content file list returns empty)
    - **No** angle-bracket-wrapped autolink syntax inside backticks per memory `feedback_lychee_autolink_in_backticks.md` (the canonical pre-empt grep applies; empty in NEW content; only tolerable in pre-existing pre-PR text)
    - **No** direct `npmjs.com/package/` URLs in markdown link form
    - **No** user-local `~/.claude/...` paths in markdown link form
  - `pnpm check` exits 0 (workspace-wide; lint + typecheck + test + build + size-check) — Wave 4 close ceremony has no source change so check should be NO-OP cached pass
  - `pnpm size-check` exits 0 (320+ source files under 500 LOC; ADR-0015 is doc, exempt; the close addendums are doc, exempt)
  - `pnpm link-check` (CI canonical lychee) PASS — verified at PR CI

- **TC9** (R-rounds tracked): close-ceremony PR R-rounds counted toward R22 forward-fix classification (PR.md drift class vs impl-defect class). Stage 4 PRE-COMMIT CLAUDE REVIEW fires per Row 4 HIT; if codex stage 3 surfaces issues, those are PR.md drift class (close-ceremony has no source path).

## contracts_affected

- **NONE.** Wave 4 close ceremony does NOT touch any `*/CONTRACT.md` file. The close ADR (ADR-0015) ratifies prior CONTRACT.md changes (e.g., apps/site/CONTRACT.md Pyodide CDN clause shipped at C-1) but does NOT introduce new CONTRACT-level surface. TC7 byte-unchanged guard verifies empty diff across all CONTRACT.md files.

## adr_touched

- **NEW ADR-0015** (Wave 4 close) — this PR's central deliverable. **Row 4 HIT** → Stage 4 PRE-COMMIT CLAUDE REVIEW fires.
- ADR-0014 + ADR-0012 prose **NOT modified** in this PR (their amendments were shipped in prior Wave 4 PRs A8/B7/B1a; ADR-0015 D2 ratifies them but does not edit the ADR files).

## D2 trigger judgment

Per [ADR-0007 D2](../../decisions/ADR-0007-job-function-codex-heavy-execution.md) 8-row table for this close-ceremony PR:

| Row | Trigger | Wave 4 close status |
|---|---|---|
| 1 | CONTRACT.md change | NO — TC7 byte-unchanged across all CONTRACT files |
| 2 | Package add / remove | NO — no package change |
| 3 | Type-public-surface change | NO — no type change |
| 4 | New ADR required | **HIT** — ADR-0015 NEW (Wave 4 close ceremony per ADR-0010 + ADR-0013 precedent) |
| 5 | Schema / migration | NO |
| 6 | Cross-package move | NO — no file moves |
| 7 | Test-only / doc-only | partial — close ceremony IS doc-only but Row 4 dominates trigger judgment |
| 8 | CI / deploy / auth / security | NO — no CI workflow / Dockerfile / auth surface change |

→ **Row 4 HIT → Stage 4 PRE-COMMIT CLAUDE REVIEW FIRES** (per ADR-0011 D1). Pipeline:
1. PLAN (this PR.md, lock by orchestrator)
2. EXECUTE (orchestrator-self for ADR + active.md + audit summaries + PR.md; matches Pre-A2 + ADR-0014 v0.2.1 + B6 + B7 doc-flavored close-ceremony precedent — DONE pre-PR.md-lock)
3. REVIEW (`codex-pr-reviewer-55` 8-point checklist; explicit "DO NOT commit" per Row 4 HIT requiring stage 4 between)
4. PRE-COMMIT CLAUDE REVIEW (orchestrator-self; verify ADR-0015 retrospective items accuracy + active.md repoint correctness + audit close addendums NO-OP-delta justification)
5. COMMIT (reviewer codex; ADR-0006 D8 explicit-file-list staging)
6. ACCEPT (pr-writer second invocation; verify diff against this PR.md `## acceptance`)

## acceptance

Reviewer + Stage 4 + Stage 6 ACCEPT use this list as canonical verification gate. Each line maps to one or more `test_cases` entries above.

1. **ADR-0015 NEW** at canonical path `docs/decisions/ADR-0015-wave-4-close.md` with full D1-D6 structure + 9 NEW retrospective items (R14-R22) + 13 carry-forward (R1-R13) + Compliance + Related. (TC1.)

2. **Wave 4 21-PR roster canonical** in ADR-0015 D1: Pre-A 3 (HEADs `9836d67` / `876d700` / `3e2a4a9`) + Stage A 8 (`f765968` through `4aeb279`) + Stage B 8 (`1aa2811` through `525e6c2`) + Stage C 2 (`49557d2` C-2 + `de39e07` C-1) = 21 PRs total.

3. **Wave 5 deferred items binding handoff** in ADR-0015 D3: heavy block plugin tier + grid forward (ADR-0016) + drag/drop forward (ADR-0017) + v2 视觉 forward (ADR-0018) + editor-shell wire-up + Stage C residue (C-3 + C-4 + apps/site/test-results gitignore).

4. **R14 mid-Wave reframe drift codified** in ADR-0015 D4 + recommended NEW memory entry `feedback_mid_wave_reframe_via_plan_amendment.md` deferred to Wave 5 起手 (memory codification is per-session; this PR establishes the lesson in spec-locked ADR D4).

5. **active.md repointed to Wave 5 plan-draft pending** with Wave 4 closed status flip + C-1 row backfill `#48 / de39e07` + Wave 4 close summary line + ADR-0015 entry in ADR roster + 起手指引 rewrite for Wave 5. (TC2.)

6. **3 wave-4-close audit summary addendums** (structure / perf / mdx) ship as light addendums NOT codex re-runs; each references wave-4-prep base audit + acknowledges C-1/C-2 NO-OP delta. (TC3 + TC4 + TC5; ADR-0015 R18 justification.)

7. **PR.md self-listed** in `## files` block + `## Related` (≥ 2 grep hits). (TC6.)

8. **C-1 R2 audit log backfilled** at `docs/audits/codex-runs/2026-05-04-C-1-pr-reviewer-55-r2.txt` (currently untracked at HEAD; ships in this close-ceremony commit per established C-2 / B6 / B7 backfill pattern).

9. **NO source-code change**: empty diff across `apps/site/src/`, `apps/site/public/`, `packages/`, `content/`, `apps/site/CONTRACT.md`, `apps/site/astro.config.mjs`, `apps/site/package.json`, `pnpm-lock.yaml`. (TC7.)

10. **NO ADR-0014 / ADR-0012 prose modification** (their amendments were shipped in prior Wave 4 PRs; this close ADR ratifies via D2 reference, not by editing). Empty diff across `docs/decisions/ADR-{0001..0014}-*.md`. (TC7.)

11. **NO Wave 4 plan modification**: empty diff against `docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md` (Wave 4 plan v0.2.1 stays as historical record; ADR-0015 D1 PR roster canonical). (TC7.)

12. **`pnpm check`** PASS workspace-wide (cached NO-OP pass since no source change). (TC8.)

13. **`pnpm size-check`** PASS workspace-wide. (TC8.)

14. **`pnpm link-check`** (CI canonical lychee) PASS — all 4 lychee disciplines respected. (TC8.)

15. **Stage 4 PRE-COMMIT CLAUDE REVIEW completed** per Row 4 HIT — orchestrator-self verifies ADR-0015 retrospective items accuracy + active.md repoint correctness + audit close addendums NO-OP-delta justification before reviewer codex commits at stage 5.

16. **`gh pr merge --squash --delete-branch`** auto-merge per Wave 3+ user authorization (memory `feedback_wave3_auto_merge.md`) once ACCEPT-PASS + all CI green.

17. **active.md repointed to Wave 5 plan-draft pending** explicitly states Wave 5 starts fresh session with reframe v2 INPUT + per-ADR plan-challenger 4-round + Wave 5 plan v1.0 lock before implementation (per ADR-0015 D6).

## executor

`orchestrator-self`. Matches Pre-A2 + ADR-0014 v0.2.1 + B7 ADR-0014 v0.3 + B6 close-ceremony preparation precedent — close-ceremony work is doc-flavored authority drafting (ADR + active.md + audit summaries + PR.md). NO codex EXECUTE dispatch needed because:

- ADR-0015 is doc; orchestrator drafts directly (matches "ADR amendment via orchestrator-self" pattern at v0.2.1 / v0.3 / v0.1.1)
- active.md is plan bookkeeping; orchestrator-maintained per CLAUDE.md role (整体规划 + dispatch 工种 + 维护 docs/plans/active.md)
- 3 audit close addendums are doc; orchestrator drafts directly (R18 justifies skipping codex re-run; addendum content is structural — manifest-of-references + NO-OP-delta acknowledgment, not analytical findings requiring codex investigation)
- PR.md self-listed; orchestrator drafts directly per "doc-flavored authority work" pattern

The reviewer codex (`codex-pr-reviewer-55`) at ADR-0011 D1 stage 3 still runs unchanged, providing line-level + spec-match audit. Stage 4 PRE-COMMIT CLAUDE REVIEW (also orchestrator-self) catches retrospective-item accuracy + active.md correctness before stage 5 commit.

## Out of scope (deferred to Wave 5)

Per ADR-0015 D3 binding handoff:

- **Reframe v2 main scope**: heavy block plugin tier UX + grid + drag/drop + v2 视觉 + editor-shell wire-up = Wave 5 from-scratch plan-draft per gatekeeper 2026-05-04 directive
- **Wave 5 plan-draft authoring**: Pre-A1 (Wave 5 plan + plan-challenger) + Pre-A2 (ADR-0016 grid + plan-challenger) + Pre-A3 (ADR-0017 drag/drop + plan-challenger) + Pre-A4 (ADR-0018 v2 视觉 + plan-challenger) + Pre-A5 (Wave 5 plan v1.0 lock)
- **Stage C residue**: C-3 PDF iframe + C-4 chunk-leak + apps/site/test-results gitignore housekeeping = Wave 5 cleanup
- **Memory entries pending**: `feedback_mid_wave_reframe_via_plan_amendment.md` (R14 codification) + `feedback_forward_fix_classification.md` (R22 two-class breakdown) — to be authored at Wave 5 起手 first session
- **R7 mitigation extension**: post-hoc grep-for-verdict-shaped-lines workflow protocol for codex logs > 500 KB — codified in `feedback_codex_audit_log_recursion.md` extension at Wave 5 起手
- **Lighthouse / Web Vitals CI workflow**: NEW Wave 5 scope per ADR-0015 D3 perf baseline framework

## Plan-challenger absorbtion

This Wave 4 close-ceremony PR does **NOT** dispatch a separate plan-challenger round. Justification:

- ADR-0015 close-ceremony pattern matches ADR-0010 + ADR-0013 precedent (single-PR cadence; no plan-challenger at close-ceremony level)
- Wave 4 D1 PR roster + retrospective items + Wave 5 deferred items are **factual** (squash HEADs, R-round counts, deferred items list) — minimal subjective judgment surface for plan-challenger to challenge
- Wave 5 plan-draft (NEXT session) will dispatch plan-challenger 4-round per ADR-0015 D6 (per-ADR plan-challenger for ADR-0016/0017/0018 + Wave 5 plan v1.0 lock challenger)
- Stage 4 PRE-COMMIT CLAUDE REVIEW (Row 4 HIT) provides equivalent dual-LLM check (codex stage 3 + Claude stage 4)

If reviewer codex stage 3 surfaces issues with retrospective item accuracy or Wave 5 deferred items completeness, fwd-fix in this PR's R-round cycle (per R22 two-class classification: PR.md drift class).

## Related

- [ADR-0015 Wave 4 close](../../decisions/ADR-0015-wave-4-close.md) — this PR's central deliverable
- [ADR-0010 Wave 2 close](../../decisions/ADR-0010-wave-2-close.md) — close-ceremony template (5-file pattern; precedent)
- [ADR-0013 Wave 3 close](../../decisions/ADR-0013-wave-3-close.md) — close-ceremony template + R1-R13 inherited + 5-file pattern + audit summary precedent
- [ADR-0011 D1 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — execution model (KEPT for Wave 5)
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md) — Wave 4 main implementation; v0.2 → v0.2.1 → v0.3 amendment chain ratified at ADR-0015 D2
- [ADR-0012 search index stack](../../decisions/ADR-0012-search-index-stack.md) — v0.1.1 ratified at ADR-0015 D2
- [Wave 4 plan locked v0.2.1](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — original plan + B1 split + B7 NEW
- [docs/plans/active.md](../active.md) — repointed to Wave 5 plan-draft pending
- This PR.md: [`docs/plans/wave-4-main/wave-4-close-ceremony.md`](wave-4-close-ceremony.md) (self-listed per ADR-0006 D8)
- B6 close-ceremony prep: [`docs/plans/wave-4-main/B6-close-ceremony-prep.md`](B6-close-ceremony-prep.md)
- 3 wave-4-prep audits (referenced):
  - [`docs/audits/structure-2026-05-wave-4-prep.md`](../../audits/structure-2026-05-wave-4-prep.md)
  - [`docs/audits/perf-2026-05-wave-4-prep.md`](../../audits/perf-2026-05-wave-4-prep.md)
  - [`docs/audits/mdx-2026-05-wave-4-prep.md`](../../audits/mdx-2026-05-wave-4-prep.md)
- 3 wave-4-close audits (NEW; this PR):
  - [`docs/audits/structure-2026-05-wave-4-close.md`](../../audits/structure-2026-05-wave-4-close.md)
  - [`docs/audits/perf-2026-05-wave-4-close.md`](../../audits/perf-2026-05-wave-4-close.md)
  - [`docs/audits/mdx-2026-05-wave-4-close.md`](../../audits/mdx-2026-05-wave-4-close.md)
- Memory entries (consulted; not in git):
  - `project_wave4_reframe_v2.md` — Wave 5 INPUT (heavy block plugin tier + grid + v2 视觉 + editor wire)
  - `feedback_codex_audit_log_recursion.md` — R7 / R21 (codex log > 500 KB handling)
  - `feedback_wave3_auto_merge.md` — Wave 3+ auto-merge authorization
  - `feedback_git_operator_explicit_stage.md` — ADR-0006 D8 4-step staging discipline
  - `feedback_lychee_autolink_in_backticks.md` — lychee discipline reference
