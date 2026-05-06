# Wave 5 housekeeping post-Stage-C.2-close — active.md sync to PR #85 squash `da192e4` + next pointer to Stage C.3-1 + verified-no-op revert finding

> Docs-only post-merge sync PR. Bundles 3 narrow housekeeping items into a single
> non-implementation PR following the PR #79 (squash `4b4f139`) precedent for
> simple-D1 docs-only housekeeping. **ui_touch: false** (no D9.1 path diff —
> only `docs/plans/active.md` + this PR.md). No CONTRACT change. No ADR change.
> No package metadata change. No CI workflow file. No D2 row fires → simple D1
> pipeline (PLAN orchestrator-self → REVIEW codex-pr-reviewer-55 single round →
> COMMIT same invocation).

## title

Sync `docs/plans/active.md` post Stage C.2 close — flip 7 `TBD post-merge`
placeholders → PR #85 squash `da192e4` 2026-05-06 across 7 active.md sites
(line 19 Wave 5 PR roster intro + line 57 #85 row + line 58 Stage C.2 close
summary row + line 158 起手指引 section title + line 160 起手指引 intro
paragraph + line 173 Pre-flight verification step + line 193 Stage C.2
remaining table row); update next-pointer prose to **Stage C.3-1**
(design-tokens OKLCH + Inter/JetBrains Mono fonts) per Wave 5 plan v1.3 row
701 + ADR-0018 D1+D2; document verified-no-op finding for the
orchestrator-instructed `git revert ac9b98d` (the literal hash `ac9b98d` is
**not reachable from any branch ref** — `git branch -a --contains ac9b98d`
returns no refs — but it carries the same diff/patch-id as commit
`4ec84e3` which DOES sit on the stale dev branch
`origin/wave-5-v1.3-r14-third-amendment`; that branch then has commit
`f0ef739` which reverts `4ec84e3`; PR #75 squash `5bd5112` — the actual
main-HEAD merge of the v1.3 amendment — accordingly does NOT carry the
workaround; PR #79 squash `4b4f139` further canonicalized any residual bare
`screenshot:` field-name uses; HEAD verified 0 bare `screenshot:` instances
+ 0 Field-name-note paragraphs across both plan files); document
verified-clean finding for the orchestrator-instructed WSL2 stale
memo/runbook scan (memory `feedback_wsl2_chromium_launch.md` already marked
SUPERSEDED 2026-05-06 per PR #78/#79 ACCEPT residue; runbooks at
`docs/runbooks/{setup-wsl2.md,team-operations.md,codex-tool-invocations.md}`
clean; only ADR-0014 line 623 still references "AC#16 runs CI-only" — that
prose is historical-context inside the immutable ADR amendment trail and
deliberately out-of-T1 scope).

## files

2 files modified at PLAN time (per AC#1 mechanical hard-fail allowlist):

1. `docs/plans/active.md` — modify, ~7 LOC delta. Seven edits (one per
   `TBD post-merge` placeholder site):
   - Line 19 (Wave 5 PR roster intro): `TBD post-merge` → `da192e4`; reword
     close-status to "Stage C.2 ✅ FULLY CLOSED at PR #85 squash `da192e4`
     2026-05-06; next pointer = Stage C.3-1".
   - Line 57 (#85 row in Wave 5 PR roster table): `TBD post-merge` →
     `da192e4`; subject reworded "current PR" → "squash `da192e4` 2026-05-06".
   - Line 58 (Stage C.2 close summary row in Wave 5 PR roster table):
     `TBD post-merge` → `da192e4`; subject reworded "Stage C.2 ✅ closed" →
     "Stage C.2 ✅ FULLY CLOSED at PR #85 squash `da192e4` 2026-05-06; next
     pointer = Stage C.3-1 (design-tokens OKLCH + Inter/JetBrains Mono
     fonts) per Wave 5 plan v1.3 row 701 + ADR-0018 D1+D2".
   - Line 158 (起手指引 H2 section title): `TBD post-merge` → `da192e4`;
     append "next pointer = **Stage C.3-1**".
   - Line 160 (起手指引 intro paragraph): `TBD post-merge` → `da192e4`;
     append explicit C.3-1 default-next sentence + escape-valve list (MVP-ship
     via ADR-0019 close ceremony OR R14 v1.4 amendment).
   - Line 173 (Pre-flight step 2): `TBD post-merge` → `da192e4`; remove
     "after orchestrator post-merge sync" stale prose; correct C.4 row range
     "rows 715-719" → "rows 713-718" to match plan v1.3 actual row numbers
     (mechanical typo fix discovered during pre-flight read).
   - Line 193 (Stage C.2 remaining table row C.2-12): `TBD post-merge` →
     `da192e4`.

2. `docs/plans/wave-5-main/post-c2-close-housekeeping.md` — NEW; this PR.md
   self-listed.

## D2 trigger judgment

NO D2 rows fire. Pure docs sync; no CONTRACT, no ADR, no package metadata,
no cross-package boundary, no CI workflow file, no test code. Stage 4
PRE-COMMIT CLAUDE REVIEW does NOT fire. Reviewer codex single round suffices
for stage 3, with same-invocation commit at stage 5 per ADR-0011 D6 +
ADR-0006 D8 explicit-file-list staging.

## ui_touch

`false` — mechanical D9.1 path detection returns false. Only diff is
`docs/plans/active.md` + this PR.md (`docs/plans/wave-5-main/...`). Neither
matches D9.1 patterns (`packages/heavy-block-boundary/src/**` /
`packages/design-tokens/**` / `packages/*/src/ui-default/**` /
`apps/site/src/{pages,components,styles}/**` / `packages/editor-shell/src/**`).
Per ADR-0011 D9.6, CI gates `e2e-coverage-check` + `screenshot-archive-check`
auto-skip on `ui_touch=false` — no `e2e_smoke` section required.

## e2e_smoke

N/A (ui_touch=false; auto-skip per ADR-0011 D9.6).

## acceptance

5 verifiable AC commands (all locally executable on WSL2; no chromium needed
since this is a docs-only PR):

### AC#1 — diff is exactly 2 files with the right paths

```bash
git diff --name-only main..HEAD | sort
```

Expected (exact 2-line output):
```
docs/plans/active.md
docs/plans/wave-5-main/post-c2-close-housekeeping.md
```

Hard-fail enforces no implementation-string leak in non-PR.md files (R14
mechanical AC#13 / AC#14 layer carry-forward from v1.1 + v1.2 + v1.3 R14
amendment PRs).

### AC#2 — all `TBD post-merge` placeholders flipped in active.md

```bash
grep -cE 'TBD post-merge' docs/plans/active.md
```

Expected: `0`. Verifies all 7 stale placeholders flipped to `da192e4`.

### AC#3 — `da192e4` referenced ≥7 times in active.md

```bash
grep -cE 'da192e4' docs/plans/active.md
```

Expected: `>=7`. Verifies the squash hash lands at all seven replacement
sites (line 19 + line 57 + line 58 + line 158 + line 160 + line 173 +
line 193 = 7 references).

### AC#4 — next-pointer prose mentions Stage C.3-1

```bash
grep -cE 'Stage C\.3-1|next pointer = \*\*Stage C\.3-1\*\*' docs/plans/active.md
```

Expected: `>=3`. Verifies the next-pointer language lands at the Wave 5
roster intro + 起手指引 section title + close-summary row.

### AC#5 — verified-no-op revert finding documented in PR.md with 4 evidence pieces

```bash
grep -cE 'wave-5-v1\.3-r14-third-amendment|f0ef739|4b4f139|4ec84e3' \
  docs/plans/wave-5-main/post-c2-close-housekeeping.md
```

Expected: `>=4`. Verifies the PR.md captures all four pieces of evidence
that justify the no-op revert: (a) stale dev-branch reference, (b) mid-PR
#75 revert commit `f0ef739`, (c) PR #79 housekeeping squash `4b4f139`, and
(d) the patch-equivalent commit hash `4ec84e3` that sits on the stale dev
branch (`ac9b98d` itself is an unreachable orphan with the same diff
patch-id `c9082a956b1bdf72e61f6f32d45164fc7700e008` as `4ec84e3`).

## Out-of-scope

The following observations surfaced during pre-flight but are deliberately
out-of-scope for this housekeeping PR (would expand T1 beyond docs-only):

1. **3 stale Playwright spec WSL2 skip blocks** at
   `apps/site/playwright/{search,sample-blocks-astro,heavy-block-layout-shift}.spec.ts`
   line 5-17 — same `isWsl2()` pattern that PR #79 stripped from
   `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts`. Stripping
   these would require Playwright runtime verification (the c2-7 spec
   precedent was Playwright-tested before strip per PR #79 AC#2). Tracked
   for future cleanup PR or Stage C.3 baseline-regen sweep (C.3-5
   handoff-pack scope candidate). Spec files do NOT match D9.1 patterns
   (`apps/site/playwright/**` ≠ `apps/site/src/{pages,components,styles}/**`)
   so the strip would remain `ui_touch: false` like PR #79.

2. **ADR-0014 line 623** still says "WSL2 chromium skip pattern (per memory
   `feedback_wsl2_chromium_launch.md`) preserved — AC#16 runs CI-only".
   This prose is inside the immutable ADR amendment trail (v0.3 amendment,
   2026-05-04). Per ADR amendment discipline, ADR text changes require an
   ADR-0014 v0.4+ amendment PR with full D2 row 4 + D1 stage 4 PRE-COMMIT
   CLAUDE REVIEW pipeline. Out-of-scope for T1 docs-housekeeping.

Both items are flagged for the Wave 5 close ceremony retrospective (R23..R30
candidates per ADR-0019 close pack — see [active.md follow-ups list](../active.md)).

## Related

- [active.md](../active.md) — sync target
- [Wave 5 plan v1.3 row 701](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — Stage C.3-1 next-pointer authority
- [ADR-0018 D1+D2](../../decisions/ADR-0018-v2-visual-migration.md) — Stage
  C.3-1 design source (OKLCH 14 color tokens + Inter/JetBrains Mono fonts)
- [PR #79 squash 4b4f139](../wave-5-main/post-78-housekeeping.md) — precedent
  for simple-D1 docs-only housekeeping pipeline shape
- [ADR-0011 D9.6](../../decisions/ADR-0011-linear-pipeline-execution-model.md) —
  CI gate auto-skip on `ui_touch=false`
- Stage C.2 close handoff pack: [C.2-handoff-pack.md](C.2-handoff-pack.md)
