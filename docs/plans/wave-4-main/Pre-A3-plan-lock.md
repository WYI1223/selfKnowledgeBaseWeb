# Pre-A3 — Wave 4 plan-draft lock

> **Wave 4 plan-lock PR.** Authors `docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`
> with PR-by-PR breakdown for Stage A (~7-8 PRs HeavyBlockBoundary
> implementation + Wave 3 C4a/C4b/C5 carry-over) + Stage B (~5-6 PRs
> Wave 3 retrospective + smoke fixes) + Stage C (open-ended Phase 1
> user-iteration framework). Plan-challenger codex round absorbed
> challenges per ADR-0007 D5 + R13. Repoints `docs/plans/active.md` to
> the locked plan. Bootstrap-flavored doc-only PR (Pre-A1 + Pre-A2
> precedent).

## title

Author Wave 4 integration plan-draft + dispatch plan-challenger codex
round + absorb challenges + lock the plan + repoint
`docs/plans/active.md`. Bundle Pre-A2 codex review audit log archive
(previously untracked, per Pre-A1→Pre-A2 archive-bundle pattern).
Closes ADR-0013 D6 Wave 4 plan-draft handoff requirement.

## files

Modified (5 files):

- `docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md` —
  NEW Wave 4 plan-draft; 3 stages (A/B/C) + plan-challenger absorbtion
  table per gatekeeper directives 2026-05-02 + 2026-05-03 #1-#4
- `docs/plans/active.md` — repoint Phase 1 wave pointer from "Wave 3
  ✅ closed → Wave 4 starts in NEW session" to "Wave 4 in progress
  (Pre-A1+Pre-A2+Pre-A3 done; Stage A starting)"; add Wave 4 PR roster
  table + ADR-0014 to ADR roster; update 起手指引 to reference locked
  plan
- `docs/audits/codex-runs/2026-05-03-Pre-A3-plan-challenge.txt` —
  truncated archive of plan-challenger codex dispatch (per R7 /tmp
  piping; full raw at `/tmp/codex-runs/2026-05-03-Pre-A3-plan-challenge.txt`)
- `docs/audits/codex-runs/2026-05-03-Pre-A2-pr-reviewer-55.txt` —
  truncated archive of Pre-A2 codex review (created post-Pre-A2 commit;
  bundled here per Pre-A1→Pre-A2 archive-bundle pattern; small bundle
  acceptable per ADR-0006 D8 since archive belongs to Wave 4 historical
  record)
- `docs/plans/wave-4-main/Pre-A3-plan-lock.md` — this PR.md
  (self-listed per ADR-0006 D8 strict whitelist)

= **5 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `docs/decisions/ADR-0014-heavy-block-boundary.md` — locked at Pre-A2;
  not revised by Pre-A3 (promotion proposed→accepted is Stage A A8 scope)
- `packages/block-foundation/CONTRACT.md` — W4-1 invariant locked at
  Pre-A2
- `docs/decisions/README.md` — ADR index locked at Pre-A2 (already
  includes 0014)
- `pnpm-lock.yaml` / `package.json` — no dep changes

## test_cases

Pre-A3 is pure plan-draft + active.md prose; tests are doc-acceptance
assertions plus repo-hygiene gates.

- **TC1** (Wave 4 plan exists at expected path) Input:
  `test -f docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md && echo OK`.
  Expected: `OK`. Location: shell.
- **TC2** (Plan contains 3-stage decomposition + plan-challenger
  absorbtion section) Input:
  `grep -cE '^### Stage [ABC] —|^## Plan-challenger codex absorbtion' docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`.
  Expected: `≥ 4` (Stage A + Stage B + Stage C + Plan-challenger
  section). Location: shell.
- **TC3** (Stage A includes A1 with explicit gatekeeper #1 markers)
  Input: `grep -cE 'A1 —.*heavy-block-boundary|new_package: @skb/heavy-block-boundary' docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`.
  Expected: ≥ 2 hits. Location: shell.
- **TC4** (Stage A close criterion includes ADR-0014 promotion per
  gatekeeper #3) Input:
  `grep -cE 'proposed.+accepted|promote ADR-0014|ADR-0014.*promotion' docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`.
  Expected: ≥ 4 (mentions in Stage A close criterion #1 + A8 scope +
  A8 acceptance + D2 summary row; allow for backtick variants in
  prose). Location: shell.
- **TC5** (Stage C open-ended framework preserved per gatekeeper #4)
  Input: `grep -E 'open-ended|NOT pre-locked|gatekeeper directive 2026-05-03 #4' docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md | wc -l`.
  Expected: ≥ 3. Location: shell.
- **TC6** (Plan-challenger absorbtion table populated post-dispatch)
  Input: `awk '/^## Plan-challenger codex absorbtion/,0' docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md | grep -cE '^\\| (Q[0-9]+|C[0-9]+|TBD) \\|'`.
  Expected: ≥ 1 (post-dispatch fill); table has at least 1 row that's
  NOT marked TBD (showing absorbtion happened). Location: shell.
- **TC7** (active.md repoints to Wave 4 in-progress) Input:
  `grep -cE 'Wave 4 (in progress|进行中|started|Stage A starting)' docs/plans/active.md`.
  Expected: ≥ 1 (replaces "Wave 4 starts in NEW session"). Location:
  shell.
- **TC8** (active.md ADR roster includes ADR-0014) Input:
  `grep -cE 'ADR-0014' docs/plans/active.md`. Expected: ≥ 1.
  Location: shell.
- **TC9** (active.md Wave 4 PR roster table or list mentions Pre-A1 +
  Pre-A2 + Pre-A3) Input: `grep -cE 'Pre-A[123]' docs/plans/active.md`.
  Expected: ≥ 3 (Pre-A1 + Pre-A2 + Pre-A3). Location: shell.
- **TC10** (`pnpm check` exit 0) Input: `pnpm check`. Expected: exit 0
  (no source/test/lockfile changes; turbo cache clean). Location:
  shell.
- **TC11** (link-check via CI) Input: `.github/workflows/link-check.yml`
  on push (lychee CI-only). Expected: workflow `success`. Per
  Pre-A2 fwd-fix lesson (`feedback_lychee_user_local_paths`): user-local
  memory references in PR.md/plan use prose form NOT markdown link.
  Location: GitHub Actions.
- **TC12** (`pnpm-lock.yaml` unchanged) Input:
  `git diff main -- pnpm-lock.yaml`. Expected: empty. Location: shell.
- **TC13** (Plan-challenger audit log archived + truncated) Input:
  `wc -l docs/audits/codex-runs/2026-05-03-Pre-A3-plan-challenge.txt`.
  Expected: `≤ 2000`. Location: shell.

## contracts_affected

None. Pre-A3 is plan + pointer + audit log archives only — no
CONTRACT.md change.

## adr_touched

None. ADR-0014 was locked at Pre-A2; no further ADR touched at Pre-A3.

## acceptance

1. Wave 4 plan-draft committed at `docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`
   — TC1 + TC2 evidence.
2. Plan covers all 5 mandatory Wave 3 carry-overs (per ADR-0013 D3):
   ADR-0014 implementation (Stage A) + ADR-0012 amendment (Stage B B1)
   + path-prose alignment (Stage B B1) + C4a/C4b/C5 (Stage A A7+A8) +
   R7 piping (already closed at Pre-A1, noted in plan Context).
3. Plan covers 3 gatekeeper smoke findings: #8 sample-assets (Stage B
   B2) + #9 sample-blocks intro prose (Stage B B3) + #10 ADR-0014
   strengthened design (already absorbed into ADR-0014 v0.2 at Pre-A2;
   Stage A A6 playwright validates).
4. Plan honors gatekeeper 2026-05-03 directive #1 (Stage A A1 explicit
   `new_package` + `adr_touched: ADR-0014` + D2 row 2 stage 4 fires)
   — TC3 evidence.
5. Plan honors gatekeeper 2026-05-03 directive #2 (Stage A 7-8 PRs;
   plan-challenger validates A7 consolidation choice) — Plan
   `## Decision` Stage A heading evidence.
6. Plan honors gatekeeper 2026-05-03 directive #3 (Stage A close
   ADR-0014 promotion in same A8 commit) — TC4 evidence.
7. Plan honors gatekeeper 2026-05-03 directive #4 (Stage C open-ended,
   NOT pre-locked) — TC5 evidence.
8. Plan-challenger codex round dispatched + absorbtion table populated
   per ADR-0007 D5 + R13 + Pre-A2 precedent — TC6 evidence.
9. `docs/plans/active.md` repointed to Wave 4 in-progress; ADR-0014
   added to ADR roster; Wave 4 PR roster lists Pre-A1+Pre-A2+Pre-A3 —
   TC7 + TC8 + TC9 evidence.
10. Pre-A3 plan-challenger raw audit log truncated to
    `docs/audits/codex-runs/2026-05-03-Pre-A3-plan-challenge.txt` per
    R7 piping — TC13 evidence.
11. Pre-A2 codex review audit log archive bundled (previously
    untracked) — file count = 5 in PR.md `## files` reflects this.
12. `pnpm check` exit 0 — TC10 evidence.
13. Link-check passes via CI — TC11 evidence.
14. `pnpm-lock.yaml` unchanged — TC12 evidence.
15. PR.md self-listed per ADR-0006 D8 — TC9 PR.md mention evidence.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — plan + active.md + audit log
  archives are workplan/pointer/historical doc, not CONTRACT.md.
- **Row 2** (package add): NO.
- **Row 4** (new ADR): NO — ADR-0014 was locked at Pre-A2; no new ADR
  here.
- **Row 5** (cross ≥3 packages): NO — root + docs only.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW NOT mandatory** (no D2 row
hit). Orchestrator-self review at minimum (per Pre-A1+Pre-A2 bootstrap
pattern). Codex stage 3 review still runs per discipline.

## executor

Bootstrap-flavored doc-only PR (3rd consecutive Wave 4 bootstrap PR;
Pre-A1 + Pre-A2 precedent).

- **PLAN**: orchestrator-self (this PR.md). pr-writer subagent NOT
  dispatched.
- **Plan-challenger codex round (PRE-LOCK)**: dispatched 2026-05-03 via
  `codex exec --yolo --profile plan-challenger ...`; challenges
  raised; orchestrator absorbs/rejects per ADR-0007 D5 + R13. Audit
  log archived per R7. See `## Plan-challenger codex absorbtion` in
  the locked plan for per-row verdicts.
- **EXECUTE**: orchestrator-self. ~700 LOC plan-draft + ~50 LOC
  active.md update + audit log archives (binary copies).
- **REVIEW**: codex `codex-pr-reviewer-55`. Audit log:
  `/tmp/codex-runs/2026-05-03-Pre-A3-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-03-Pre-A3-pr-reviewer-55.txt`
  truncated archive (per Pre-A1's just-codified Wave 4+ R7 piping flow).
- **PRE-COMMIT CLAUDE REVIEW**: orchestrator-self. D2 row hit NONE,
  but plan-class change with downstream impact warrants self-review.
  Walk acceptance bullets 1-15 + verify gatekeeper directives 1-4
  honored.
- **COMMIT**: orchestrator-self per ADR-0006 D8 explicit-file-list
  staging. Bootstrap-flavored exception (Pre-A1+Pre-A2 precedent).
- **ACCEPT**: pr-writer Claude subagent (second invocation; verifies
  the diff matches locked acceptance + scope creep / drop check).

## Out-of-scope (explicitly deferred)

- Stage A A1 (`@skb/heavy-block-boundary` package creation) — first
  Wave 4 implementation PR; happens AFTER Pre-A3 merges per ADR-0011 D1
  strict serial.
- Wave 4 close ceremony (ADR-0015) — happens at Stage C close per
  user MVP judgment + Wave 4 plan-draft `## Wave 4 close ceremony`
  section.
- Re-baselining `docs/audits/structure-2026-05.md` against Wave 4
  work — Stage B B6 scope per Wave 4 plan.
- Phase 2 plan-draft — happens after Wave 4 close; out of scope here.

## Related

- [Wave 4 plan-draft (this PR)](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  — the plan being locked.
- [ADR-0013 D6 Wave 4 plan-draft handoff](../../decisions/ADR-0013-wave-3-close.md)
  — explicit authorization for Pre-A3 work.
- [ADR-0011 D2 v0.1.1 SOTed-PR.md amendment](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — schema discipline applied.
- [Pre-A2 PR.md](./Pre-A2-adr-0014-heavy-block-boundary.md) — most
  recent precedent (plan-challenger absorbtion model + bootstrap
  commit).
- [Pre-A1 PR.md](./Pre-A1-codex-runbook-yolo-tmp-piping.md) — first
  Wave 4 PR; codified `--yolo` + R7 + pipefail disciplines applied
  here.
- memory `feedback_lychee_user_local_paths` (orchestrator-local at
  `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/`) —
  Pre-A2 fwd-fix lesson; Pre-A3 prose form follows
  (no markdown link form for user-local paths).
