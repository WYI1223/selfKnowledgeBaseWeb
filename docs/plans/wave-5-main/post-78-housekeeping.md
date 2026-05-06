# Wave 5 housekeeping post-#78 — spec WSL2-skip strip + plan canonicalization + active.md sync

> Test-only + docs PR following user direction post PR #78 merge (squash `dd860b9`,
> 2026-05-06). Bundles 4 narrow housekeeping items into a single non-implementation
> PR. **ui_touch: false** (no `apps/site/src/{pages,components,styles}/**` diff;
> spec sits in `__tests__/e2e/` which is not a D9.1 path pattern). No CONTRACT
> change. No ADR change. No package metadata change. No D2 row fires →
> simple D1 pipeline (PLAN orchestrator-self → REVIEW codex-pr-reviewer-55
> single round → COMMIT same invocation).

## title

Strip stale WSL2-detection skip block from C.2-7 Playwright spec (deps now
installed; orchestrator self-serves Playwright on every UI-touch PR per user
direction post PR #78); canonicalize remaining bare `screenshot:` →
`screenshot_archive:` field-name uses in v1.3 retrofit catalog (post-PR #76
+ #78 confirmation that canonical key works end-to-end); sync `docs/plans/active.md`
with PR #78 squash + Wave 5 PR roster row + next-pointer C.2-8; mark
`feedback_wsl2_chromium_launch.md` SUPERSEDED post deps install (memory file
lives outside repo at `~/.claude/projects/.../memory/`; out of this PR's
scope per memory boundary discipline).

## files

4 files modified. PR.md self-listed (5 entries total at stage 5).

1. `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts` (-7 LOC)
   - DELETE line 3: unused `import { release } from 'node:os';`
   - DELETE lines 26-30: `test.skip(WSL2 ...)` block (now over-broad —
     WSL2 chromium deps installed post PR #78; spec runs natively in
     16.3s on user's WSL2 clone with 11 t64 packages installed).
2. `docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md` (~16 LOC)
   - Canonicalize 16 bare `screenshot:` → `screenshot_archive:` in
     C.4-3 6-flow inline-tabular block (lines ~630-635) + C.4-5 10-flow
     mvp-1..mvp-10 inline-tabular block (lines ~650-659). Bullet-form
     C.2-7/C.3-1..5/C.4-1/C.4-2 entries already canonical (PR #75 squash
     dropped ac9b98d's workaround rename; only the non-bullet inline form
     retained bare `screenshot:`).
3. `docs/plans/wave-5-main/v1.3-plan-amendment-r14-third.md` (~6 LOC)
   - Canonicalize 6 bare `screenshot:` → `screenshot_archive:` in
     C.4-3 6-flow nested-bullet block (lines ~180-199).
4. `docs/plans/active.md` (~37 LOC delta)
   - Mark Wave 5 plan v1.3 lock paragraph: append PR #78 squash `dd860b9`
     2026-05-06 entry + WSL2 chromium deps installed note.
   - Update PR-count line: `19 PRs done; 16 implementation PRs remaining`
     → `20 PRs done; 15 implementation PRs remaining`.
   - Append 3 new follow-up items (6/7/8) to "Wave 5 standards-landing
     follow-ups" list: D9 production-path validation complete, WSL2 deps
     installed, Wave 5 close ADR-0019 R26 retrospective candidates from
     PR #78 ACCEPT residue.
   - Add #78 row to Wave 5 PR roster table; update remaining-Stage-C.2
     row from "C.2-7 NEXT" to "C.2-8 NEXT".
   - Update "起手指引" section heading + intro paragraph; update Stage C.2
     remaining table; replace C.2-7 details block with C.2-8 details block.

Plus 1 file outside the repo (memory boundary, not staged):
- `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/feedback_wsl2_chromium_launch.md`
  + `MEMORY.md` index pointer — marked SUPERSEDED 2026-05-06 with
  Ubuntu 24.04 noble t64 package list captured for future reference.

## D2 trigger judgment

NO D2 rows fire. Pure test/docs/sync; no CONTRACT, no ADR, no package
metadata, no cross-package boundary, no CI workflow file. Stage 4
PRE-COMMIT CLAUDE REVIEW does NOT fire. Reviewer codex single round
suffices for stage 3, with same-invocation commit at stage 5.

## ui_touch

`false` — mechanical D9.1 path detection returns false. The C.2-7 spec
file lives at `apps/site/src/__tests__/e2e/...` which does NOT match
the D9.1 pattern `apps/site/src/{pages,components,styles}/**`. Plan
files + active.md are docs-only. Per ADR-0011 D9.6, CI gate
`e2e-coverage-check` auto-skips on `ui_touch=false` — no `e2e_smoke`
section required.

## e2e_smoke

N/A (ui_touch=false).

## acceptance

8 verifiable AC commands:

### AC#1 — spec WSL2 skip block + unused release import absent

```bash
grep -nE "release\(\)|WSL2 missing libnss3" \
  apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts | wc -l
```

Expected: `0`. Verifies both the unused import and the skip block are
removed.

### AC#2 — Playwright spec passes locally on WSL2 (post deps install)

```bash
cd apps/site && pnpm exec playwright test \
  src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts 2>&1 | tail -3
```

Expected: `1 passed`. Verifies WSL2 chromium deps work end-to-end.

### AC#3 — bare `screenshot:` field name absent in plan files (post-canonicalization)

```bash
grep -nE 'screenshot:' \
  docs/plans/wave-5-main/v1.3-plan-amendment-r14-third.md \
  docs/superpowers/plans/2026-05-04-phase-1-wave-5-integration.md | wc -l
```

Expected: `0`. Verifies all bare `screenshot:` entries renamed to
canonical `screenshot_archive:`.

### AC#4 — active.md: PR #78 row present in Wave 5 PR roster table

```bash
grep -nE '^\| #78 \| `dd860b9`' docs/plans/active.md | wc -l
```

Expected: `1`. Verifies the new roster row was added.

### AC#5 — active.md: next-pointer flipped from C.2-7 to C.2-8

```bash
grep -nE 'next = C\.2-8' docs/plans/active.md | wc -l
```

Expected: `≥ 1`. Verifies the next-pointer prose update.

### AC#6 — active.md: PR-count delta from 19 → 20 done

```bash
grep -nE '20 PRs done; 15 implementation PRs remaining' docs/plans/active.md | wc -l
```

Expected: `1`. Verifies the count update.

### AC#7 — `pnpm --filter @skb/site lint` + `typecheck` clean (no regression from spec strip)

```bash
pnpm --filter @skb/site lint
pnpm --filter @skb/site typecheck
```

Expected: both exit 0. Verifies the spec strip didn't introduce lint
or typecheck issues.

### AC#8 — `pnpm check:affected` clean (regression sanity)

```bash
pnpm check:affected
```

Expected: all affected tasks succeed. No package-level regression from
the spec/plan/active.md changes.

## Out of scope (deferred to future PRs if needed)

- `.github/workflows/ci.yml` `visual-smoke` + `e2e-coverage-check`
  artifact-share / job-merge structural fix — Wave 5 close ADR-0019
  R26 retrospective candidate. Mitigated for now via orchestrator
  self-serves Playwright + screenshot-in-git model; alternative
  artifact-share workflow stays available if model changes.
- `scripts/check-e2e-coverage.ts` parser hardening (split-per-key
  vs split-per-entry; backtick-capture in `\S+`) — Wave 5 close
  ADR-0019 R26 retrospective candidate. Mitigated for now via
  PR.md authoring discipline (single-bullet-with-indented-keys form
  + bare paths without backticks per PR #78's `## e2e_smoke` reformat).
- Branch protection: `e2e-coverage-check` as required check on
  GitHub branch protection — user-side action (orchestrator no
  web access per ADR-0011 D7).

## Verification record (orchestrator-self pre-stage-5)

- Playwright local: `1 passed (16.3s)` per actual run 2026-05-06 (host
  port 4321 native, chromium launches OK with t64 packages).
- Lint: `eslint .` clean.
- Typecheck: `Result (45 files): 0 errors, 0 warnings, 0 hints`.
- `git diff --stat`: 4 files / 43 insertions / 45 deletions (net -2 LOC).
- Screenshot at `docs/audits/screenshots/wave-5-c2-7-heavy-grid-dims.png`
  PRESERVED at PR #78's canonical 60552 bytes (Playwright local run
  overwrote with 119107-byte WSL2 render; orchestrator restored from
  HEAD via `git checkout HEAD -- ...` to preserve the canonical
  Windows-host bootstrap pin).
