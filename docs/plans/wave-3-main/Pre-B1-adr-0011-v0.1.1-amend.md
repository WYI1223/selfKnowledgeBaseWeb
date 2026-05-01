# Pre-B1 — ADR-0011 v0.1.1 amend (codify SOTed-PR.md discipline)

> **Wave 3 Stage A → Stage B transition gate.** Pre-B1 codifies the most
> valuable Stage A retrospective lesson (item 1) into ADR-0011 D2 PR.md
> schema as a mandatory clause, so Stage B's 8 PRs + Stage C/D 10 PRs
> (18 PRs total) start with the single-source-of-truth + reference
> discipline pre-locked. Self-applying meta-PR — this PR.md follows the
> discipline it codifies.

## title

Amend `docs/decisions/ADR-0011-linear-pipeline-execution-model.md` D2
section to add the **single-source-of-truth 强制条款** (v0.1.1) plus an
**Amendments** section logging the change. Closes Wave 3 Stage A
retrospective item 1.

## files

Modified (1 file):

- `docs/decisions/ADR-0011-linear-pipeline-execution-model.md` — D2 section
  appends the new "Single-source-of-truth 强制条款 (v0.1.1)" block; new
  "## Amendments" section added with the v0.1.1 entry. Placement of both
  sections per TC1 / TC2 (canonical).

Self-listed (1 file):

- `docs/plans/wave-3-main/Pre-B1-adr-0011-v0.1.1-amend.md` *(this PR.md;
  ADR-0006 D8 strict whitelist; PR #1 R2 lesson, repeated A1-A5)*

= **2 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `docs/decisions/README.md` — ADR index does not require update for an
  amend (ADR-0011 already listed). Verify at review time:
  `git diff main -- docs/decisions/README.md` returns empty.
- `agent-contract.md` / `CLAUDE.md` / `AGENTS.md` / generated downstream —
  ADR-0011 amendment is not regenerated through `pnpm generate:configs`.
  Source-of-truth is the ADR file itself; no derivative artifacts.
- All `packages/*` / `apps/*` source — Pre-B1 is pure ADR doc-prose.

## test_cases

Pre-B1 is pure ADR documentation prose; "tests" are the documentation-
acceptance assertions plus repo-hygiene gates.

- **TC1** (D2 schema enrichment, in-repo doc-acceptance) Input:
  `grep -nE '^\*\*Single-source-of-truth' docs/decisions/ADR-0011-linear-pipeline-execution-model.md`.
  Expected: ≥1 hit, positioned **after** the TDD-front line + **before**
  the D3 heading. Verify line ordering via:
  `grep -nE '^(### D3 — |\*\*Single-source-of-truth|\*\*TDD 前置)' docs/decisions/ADR-0011-linear-pipeline-execution-model.md`
  shows TDD < SOTed < D3 line numbers. Location: shell at repo root.
- **TC2** (Amendments section presence) Input:
  `grep -nE '^## Amendments|^### v0\.1\.1' docs/decisions/ADR-0011-linear-pipeline-execution-model.md`.
  Expected: 2 hits — `## Amendments` heading + `### v0.1.1 (2026-05-01; Wave 3 Pre-B1)`
  sub-heading; positioned **before** the `## Related` section. Location: shell.
- **TC3** (typecheck) Input: `pnpm typecheck`. Expected: exit 0 (no source
  changes; should be cache-hit). Location: shell.
- **TC4** (lint) Input: `pnpm lint`. Expected: exit 0; no errors; only the
  4 pre-existing console-warning warnings carry-over from main. Location: shell.
- **TC5** (link-check eligible — preempt A1-style lychee fail) Input:
  manual `realpath -m` walk over markdown links inside the new sections.
  Expected: every cited link resolves to an existing file. Location: shell.

## contracts_affected

- `docs/decisions/ADR-0011-linear-pipeline-execution-model.md` — D2 schema
  surface change (additive; v0.1.1 strict-clause). Amendment self-documents
  via the new `## Amendments` section.

## adr_touched

- ADR-0011 — amend in place (additive; non-breaking; v0.1.1).
  See `## D2 trigger judgment` for row 4 verdict (canonical).
  Backward compatibility (D1 / D3-D8 unchanged) is logged in the
  ADR's own new `## Amendments` § v0.1.1 entry.

## acceptance

1. ADR-0011 D2 section contains a new "Single-source-of-truth 强制条款
   (v0.1.1)" block — TC1 evidence (positioning canonical in TC1).
2. ADR-0011 ends with a new "## Amendments" section listing v0.1.1 as
   the inaugural entry — TC2 evidence (positioning canonical in TC2).
3. The new SOTed clause enumerates the 6 fact categories (file counts,
   dep counts / three-way, test counts, alphabetical position, cast/API
   shape, D2 trigger row state) explicitly so reviewers can pattern-match
   any future PR.md against the closed list. See ADR-0011 D2 末 for the
   canonical enumeration.
4. The new SOTed clause includes the 4-step "EXECUTE 矛盾更新协议" so
   future R-during-EXECUTE events have a written runbook, not improvised
   triage. See ADR-0011 D2 末.
5. The new clause cites Wave 3 Stage A R-round empirical evidence (A1=1,
   A2=1, A3=3, A4=1, A5=0) so the discipline is grounded in observed
   outcomes, not speculation. See ADR-0011 D2 末 "实证依据".
6. `pnpm check` (lint + typecheck + test + build + size-check) returns
   exit 0 — TC3 + TC4 evidence. No source/test changes; this is purely
   doc prose and `pnpm check` should be turbo-cache-hit clean.
7. The PR.md (`docs/plans/wave-3-main/Pre-B1-adr-0011-v0.1.1-amend.md`)
   self-listed in the staged file list at commit time per ADR-0006 D8
   strict whitelist (PR #1 R2 lesson; repeated A1-A5).
8. **Self-applying SOTed verification** — this PR.md states each factual
   claim ONCE in its canonical section + references elsewhere. Canonical
   loci: `## files` (file count + listing), `## test_cases` TC1+TC2
   (section ordering claims), `## D2 trigger judgment` (row state +
   interpretation). Reviewer verifies no other section duplicates these
   literal claims. (eat-our-own-dog-food: the meta-PR demonstrates the
   discipline it codifies.)

## executor

Transitional dual-path policy continued from Stage A. The user's
`~/.codex/config.toml` has been merged with 4 new profiles missing the
`codex-` prefix (per Stage A retrospective item 7); reviewer codex profile
remains transitional `pr-gate` until the prefix-corrected merge propagates.

- **PLAN**: orchestrator-self (single-author meta-PR; pr-writer subagent
  not dispatched because Pre-B1 is doc-only ADR prose well within
  orchestrator-direct scope; mirrors Pre-A1 bootstrap-flavored pattern).
- **EXECUTE**: orchestrator-self (per `## files`; ~50 LOC of ADR prose +
  PR.md self).
- **REVIEW**: codex `pr-gate` (transitional alias; same as Pre-A1 +
  A1-A5 R-rounds). Audit log:
  `.codex-runs/wave-3-main/Pre-B1-review.txt`.
- **PRE-COMMIT CLAUDE REVIEW**: orchestrator-self (D2 row 1 fires;
  ADR change is contract-class). Independent walk against `## acceptance`
  bullets 1-8.
- **COMMIT**: orchestrator-self per ADR-0006 D8 explicit-file-list
  staging (`git reset HEAD` → `git add` per `## files` list →
  `git diff --cached --stat` verify staged count matches `## files`
  count → `git commit`).
- **ACCEPT**: pr-writer Claude subagent (second invocation; verifies the
  diff matches the locked acceptance + scope creep / drop check).

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT/ADR change): **HIT** — ADR-0011 D2 section
  modified; v0.1.1 amend.
- **Row 2** (package add/remove): NO.
- **Row 4** (new ADR required): NO — amendment to existing ADR; `## Amendments`
  section logs additively. D2 row 4 sub-rule applies to new ADR files only.
- **Row 5** (cross ≥3 packages): NO — single doc file modified.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 1; mitigates
codex same-model echo-chamber risk on the meta-class change that defines
how all subsequent reviewers should evaluate PR.md drift).

## Out-of-scope (explicitly deferred)

- ADR-0011 v0.1.0 → v0.1.1 versioning at the top of the ADR (status
  field). The Amendments section is the canonical version log;
  introducing a "version: 0.1.1" frontmatter field is a separate
  convention not yet adopted across other ADRs (ADR-0001 through
  ADR-0010). Defer cross-ADR versioning convention to Wave 3 close
  ADR-0013 if the orchestrator wants Wave 4 onward to use it.
- Stage A retrospective items 2-7 — captured in Wave 3 Stage A close
  retrospective bullets (see A5 PR description); deferred to ADR-0013
  per user direction (item 5 mdx-bridge canonicalization to land in
  B1/B2 commit; items 2/3/4 to interleave Stage B/C; items 6/7 to
  ADR-0013).
- Generator fix for `scripts/render/codex-profiles-toml.ts` `codex-`
  prefix preservation (retrospective item 7) — separate small PR after
  Stage B; renderer touch is wider scope than this ADR amend.
- Backfilling SOTed discipline retrospectively into A1-A5 PR.md files —
  unnecessary; the discipline starts forward (Stage B onward). The
  amendment's "强制起点" prose is explicit on this point.

## Related

- [ADR-0011 D2 末 (post-amend)](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — the SOTed 强制条款 + EXECUTE 矛盾更新协议 + 实证依据 (canonical).
- [ADR-0011 ## Amendments § v0.1.1](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — amendment log entry (canonical version-history).
- [ADR-0006 D8](../../decisions/ADR-0006-asymmetry-audit-checklist.md) —
  staging discipline + sister-doc sync.
- [Pre-A1 PR.md](./Pre-A1-codex-profile-toml-merge.md) — bootstrap-style
  predecessor PR (ADR-0011 D-list operationalization).
- [A5 PR.md](./A5-editor-shell-save-load.md) — first Wave 3 main PR
  with zero R-rounds (SOTed discipline empirical proof).
- [Wave 3 plan, Stage A → B transition](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md)
  — Pre-B1 sits between Stage A close (A5) and Stage B open (B1).
