# C.2-12 — Stage C.2 close: visual smoke baseline + perf budget assertion + handoff pack

> **Wave 5 Stage C.2 13th and final implementation PR** of the locked
> 13-PR sequence (C.2-1 → C.2-12; per Wave 5 plan v1.3 row C.2-12).
> Closes Stage C.2 per close-criterion line 695: "editor-shell 在
> 12-col grid 上摆块; 4 边缘对称 drag-drop work; resize via right/bottom
> handles; AC#1-#12 (ADR-0017) 全 vitest + playwright covered; visual
> smoke baseline. Sub-stage close = user MVP-judgment escape valve +
> handoff pack mandatory."
>
> Per ADR-0011 D2 trigger judgment: **Standard** (no Row 1/4/5 fires;
> no PRE-COMMIT CLAUDE REVIEW; reviewer codex bundles stage 5 commit
> per ADR-0011 D6).

## title

Land 3 Stage C.2 close artifacts: (1) `apps/site/playwright/grid-perf.spec.ts`
NEW Playwright spec covering ADR-0017 AC#6 60fps perf budget for
n=10/30/100 synthetic block hit-test workloads; (2)
`apps/site/playwright/visual-smoke-baseline/wave-5-c2-*.png` baseline
screenshots (≥ 5 KB each per D9.5 convention); (3)
`docs/plans/wave-5-main/C.2-handoff-pack.md` Stage C.2 handoff pack
mirroring C.1-handoff-pack.md structure. Plus `docs/plans/active.md`
bundled sync adding rows for #82 (C.2-9) + #83 (C.2-10) + #84 (C.2-11)

- #85 (this) and flipping next-pointer to "Stage C.2 ✅ closed; user
  MVP-judgment escape valve = continue to Stage C.3 / MVP-ship via
  ADR-0019 / R14 amendment".

## files

7 files (6 codex-touchable + PR.md self) per ADR-0006 D8 explicit-file-list:

1. `apps/site/playwright/grid-perf.spec.ts` (NEW; ~150-180 LOC; 3
   synthetic-harness perf tests covering ADR-0017 AC#6)
2. `apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-astro.png`
   (NEW; visual baseline of `/sample-blocks-astro` page; ≥ 5 KB)
3. `apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-notes.png`
   (NEW; visual baseline of `/notes/sample-blocks` page; ≥ 5 KB)
4. `apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-edit-route.png`
   (NEW; visual baseline of `/notes/sample-blocks/edit` route per
   C.4-prelude scaffold; ≥ 5 KB)
5. `docs/plans/wave-5-main/C.2-handoff-pack.md` (NEW; Stage C.2
   handoff pack; ~150-200 LOC)
6. `docs/plans/active.md` (MODIFIED; bundled sync for #82/#83/#84/#85
   - Stage C.2 close marker + next-pointer to user decision)
7. `docs/plans/wave-5-main/C.2-12-stage-c2-close.md` (NEW; this PR.md)

LOC budget: ~150-180 spec + ~150-200 handoff pack + ~30-50 active.md
delta + ~250 PR.md = ~580-680 source/doc LOC. Plus 3 PNG binaries.

## test_cases

`apps/site/playwright/grid-perf.spec.ts` ships 3 synthetic-harness
perf tests covering ADR-0017 AC#6 (60fps perf budget):

1. **TC1.1 — AC#6 hit-test perf budget for n=10 blocks**: synthetic
   harness; performance.now() loop measuring per-event
   `findMatches(cursorX, cursorY, computeEdgeRects(blocks), blockRects)`
   over 100 iterations; assert per-event ≤ 0.05ms (helper budget per
   ADR-0017 AC#6 line ~378) AND total iteration time ≤ 16ms / frame
   for 60fps (CI margin: ≤ 20ms / frame allowing 25% margin per Risk
   register row 2).

2. **TC1.2 — AC#6 hit-test perf budget for n=30 blocks**: same as
   TC1.1 but n=30 (canonical AC#6 value); assert same budget. This is
   the canonical 60fps assertion.

3. **TC1.3 — AC#6 hit-test perf budget for n=100 blocks (stress)**:
   n=100 blocks; informational only (NOT blocking) per ADR-0017 D5
   选项 1 O(n) scaling note; logs per-event time; flags if ≥ 0.1ms /
   event (degradation marker, NOT failure). Phase 2+ optimization
   path documented in handoff pack.

Path A pattern (synthetic harness; no editor-shell wiring; mirrors
C.2-10 + C.2-11 conventions). Re-uses `EDGE_W` + `computeEdgeRects` +
`findMatches` from `@skb/editor-shell/src/drag-drop/...` direct
imports (single-authority delegation per ADR-0006 class 4).

## acceptance

12 verifiable AC commands.

### AC#1 — `apps/site/playwright/grid-perf.spec.ts` exists

```bash
test -f apps/site/playwright/grid-perf.spec.ts && echo OK
```

Expected: `OK`.

### AC#2 — Spec test count = 3 (3 active; no deferred)

```bash
cd apps/site && pnpm exec playwright test --list playwright/grid-perf.spec.ts | grep -cE 'AC#6'
```

Expected: `3`. Three TCs all citing AC#6.

### AC#3 — Playwright run = 3 PASS

```bash
cd apps/site && pnpm exec playwright test playwright/grid-perf.spec.ts 2>&1 | tail -3
```

Expected: `3 passed`.

### AC#4 — 3 visual smoke baseline PNG files exist + ≥ 5 KB each

```bash
for f in apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-{sample-blocks-astro,sample-blocks-notes,edit-route}.png; do
  [ -s "$f" ] && size=$(stat -c%s "$f") && [ "$size" -ge 5000 ] && echo "$f: $size OK"
done | wc -l
```

Expected: `3`. All 3 baselines present + each ≥ 5 KB.

### AC#5 — `docs/plans/wave-5-main/C.2-handoff-pack.md` exists with required sections

```bash
test -f docs/plans/wave-5-main/C.2-handoff-pack.md && \
  grep -cE '^## (Summary|PR roster|ADRs touched|ACs covered|Invariants delivered|Forward scope|Decision points)' \
  docs/plans/wave-5-main/C.2-handoff-pack.md
```

Expected: `≥ 5`. Required sections present per Stage close template
(mirrors C.1-handoff-pack.md structure).

### AC#6 — `docs/plans/active.md` adds 4 PR rows (#82/#83/#84/#85)

```bash
grep -cE '^\| #(8[2-5]) \|' docs/plans/active.md
```

Expected: `≥ 4`. Bundled sync per Wave 5 #69 precedent.

### AC#7 — active.md next-pointer flipped to Stage C.2 close + user decision

```bash
grep -cE 'Stage C\.2 ✅ closed|user MVP-judgment escape valve|Stage C\.3.*Stage close' docs/plans/active.md
```

Expected: `≥ 1`. Next-pointer reflects Stage C.2 close + user
decision required.

### AC#8 — `pnpm size-check` clean

```bash
pnpm size-check 2>&1 | tail -2
```

Expected: PASS message.

### AC#9 — `pnpm --filter @skb/site lint` 0 errors

```bash
pnpm --filter @skb/site lint 2>&1 | tail -3
```

Expected: `0 errors` (max-lines warnings acceptable).

### AC#10 — `pnpm --filter @skb/site typecheck` 0 errors

```bash
pnpm --filter @skb/site typecheck 2>&1 | tail -3
```

Expected: `0 errors / 0 warnings / 0 hints`.

### AC#11 — Prettier `--check` clean

```bash
pnpm exec prettier --check \
  apps/site/playwright/grid-perf.spec.ts \
  docs/plans/wave-5-main/C.2-handoff-pack.md \
  docs/plans/wave-5-main/C.2-12-stage-c2-close.md
```

Expected: `All matched files use Prettier code style!`.

### AC#12 — `ui_touch=false` mechanical

```bash
pnpm exec tsx scripts/check-ui-touch.ts --files \
  apps/site/playwright/grid-perf.spec.ts \
  apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-astro.png \
  apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-notes.png \
  apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-edit-route.png \
  docs/plans/wave-5-main/C.2-handoff-pack.md \
  docs/plans/active.md \
  docs/plans/wave-5-main/C.2-12-stage-c2-close.md \
  2>&1 | grep ui_touch
```

Expected: `ui_touch=false`. None of `apps/site/playwright/**` /
`apps/site/playwright/visual-smoke-baseline/**` / `docs/plans/**`
match D9.1 path patterns; CI gate `e2e-coverage-check` auto-skips per
ADR-0011 D9.6.

## D2 trigger judgment

Per ADR-0007 D2 v0.1.1 row evaluation:

- **Row 1** (CONTRACT.md change): NO — no `packages/*/CONTRACT.md`
  modified
- **Row 2** (package add/remove): NO — no metadata change
- **Row 3** (test scope only): N/A
- **Row 4** (NEW ADR amendment): NO — references existing ADR-0017
  AC#6 verbatim; no ADR delta
- **Row 5** (cross-package boundary contract change): NO — pure
  Playwright spec + binaries + docs
- **Row 6** (R14 reframe scope): NO — Standard implementation PR
- **Row 7** (W5-1/W5-2 invariant change): NO
- **Row 8** (CI/deploy/auth/security touch): NO

**Verdict: Standard** per plan v1.3 row C.2-12. PRE-COMMIT CLAUDE
REVIEW (D1 stage 4) does NOT fire; reviewer codex bundles stage 5
commit per ADR-0011 D6.

## ui_touch

`false` (mechanical D9.1 detection).

`apps/site/playwright/**` is NOT in any of the 7 D9.1 path-pattern
regexes (`apps/site/src/{pages,components,styles}/**` /
`packages/*/src/ui-default/**` / `packages/heavy-block-boundary/src/**`
/ `packages/editor-shell/src/**` / `packages/design-tokens/**`).
Same pattern as C.2-10 + C.2-11. CI gate `e2e-coverage-check`
auto-skips per ADR-0011 D9.6.

`apps/site/playwright/visual-smoke-baseline/*.png` per Wave 5 plan
v1.3 §551 retrofit catalog Q1 absorbtion explicitly notes this exact
case for C.3-5 / C.4-5 — visual smoke baselines do NOT trigger D9.1
mechanical detection; the catalog entry serves as informational
meta-doc.

## e2e_smoke

`[]` (empty per ui_touch=false; CI gate auto-skip per ADR-0011 D9.6).

## Out of scope

- Full 60fps E2E with real DOM drag events on /notes/sample-blocks/edit
  → C.4-2 (full editor integration enables real-mouse drag wiring)
- Stage C.3 visual smoke baseline (with v2 visual identity OKLCH +
  fonts) → C.3-5 per plan row 705
- Stage C.2 perf regression continuous monitoring (CI baseline drift
  detection) → Wave 6+ infrastructure scope
- Touch / mobile drag perf — explicit OUT OF SCOPE per ADR-0017
  Consequences

## Risk register

- **Row 1: visual smoke baseline UI artifact drift at Stage C.3
  v2 visual landing**. Stage C.3-1..C.3-5 ships OKLCH + Inter +
  JetBrains Mono fonts which will visually transform every page.
  Stage C.2 baselines will be REGENERATED at C.3-5 (not blocked by
  this PR). Mitigation: handoff pack explicitly documents this
  regeneration plan in `## Forward scope` section.

- **Row 2: 60fps perf budget flakiness on CI runners**. CI Linux
  runners have variable load (especially shared runners). TC1.1+TC1.2
  use ≤ 20ms / frame threshold (25% margin over the canonical 16ms)
  to absorb CI variance. TC1.3 (n=100 stress) is informational
  only — does NOT block merge if degradation observed; logs to
  console for Phase 2+ optimization triage.

- **Row 3: handoff pack accuracy**. Stage C.2 had 13 PRs (12
  implementations + 1 R14 amendment + 1 hard-throw flip via
  C.2-3.5). Risk of mis-counted ACs covered or PR roster drift.
  Mitigation: orchestrator double-checks main HEAD git log
  pre-stage-5 commit; reviewer codex re-validates via grep against
  PR roster table.

- **Row 4: bundled active.md sync inflation**. Bundling 4 PR rows
  (#82/#83/#84/#85) inflates active.md sync diff. Per Wave 5 #69
  precedent ("bundled active.md sync post C.2-5 + C.2-6") this is
  acceptable; deferring to separate sync PR doubles overhead.

## R14 self-check

Standard implementation PR; no plan amendment scope. 14-point
pre-flight per Wave 5 plan §232 D12:

1. Stage scope-fence: 7 files in whitelist; pure additive (1 spec +
   3 PNGs + 2 docs + PR.md self + 1 active.md modify); no
   cross-package src changes
2. TDD-front: 3 perf tests written first (TC1.1-1.3 RED → GREEN)
3. ADR cross-references: ADR-0017 AC#6 + ADR-0006 (single-authority)
   - ADR-0011 D6 (commit bundling) cited
4. ACs verifiable: 12 mechanical AC commands
5. ui_touch + e2e_smoke per v1.3 retrofit catalog Q1 absorbtion shape
6. D2 row evaluation: 8 rows checked; verdict Standard
7. Forward scope clear: Stage C.3 next OR MVP-ship OR R14 amendment
8. Out-of-scope explicit: 4 items deferred
9. Risk register: 4 rows
10. Plan-challenger absorbtion: N/A (implementation PR; no plan
    amendment)
11. Lychee pre-empt: PR.md uses `../../decisions/` and
    `../../superpowers/` 2-levels-up (verified post-#83 lesson)
12. No angle-bracket autolink shape in inline backticks (per memory `feedback_lychee_autolink_in_backticks.md`)
13. File-size hard limit: spec ~150-180 LOC under 500 hard limit;
    handoff pack ~150-200 LOC under 300 ESLint warn
14. No WSL2 skip block (memory `feedback_wsl2_chromium_launch.md`
    SUPERSEDED post-#79)

## execution plan

**Hybrid execution split**:

- **codex-generic-executor for grid-perf.spec.ts** (file 1): write 3
  perf tests with synthetic harness pattern; matches C.2-10 + C.2-11
  conventions. Audit log to `/tmp/codex-runs/2026-05-06-C.2-12-execute.txt`
  → `head -2000` archive to `docs/audits/codex-runs/`.

- **codex-generic-executor for visual baselines** (files 2-4):
  invoke Playwright on the 3 routes to emit PNG screenshots to
  `apps/site/playwright/visual-smoke-baseline/`. Each ≥ 5 KB.
  WSL2 chromium native (memory SUPERSEDED post-#79 deps install).

- **orchestrator-self for handoff pack + active.md sync** (files 5
  - 6): mirror `docs/plans/wave-5-main/C.1-handoff-pack.md` structure;
    pull PR roster from main HEAD `git log`; sync active.md PR roster
    table + next-pointer.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list 4-step protocol. Reviewer codex
bundles stage 5 commit per ADR-0011 D6 (D2 Standard; no PRE-COMMIT
CLAUDE).

```bash
git reset HEAD

git add \
  apps/site/playwright/grid-perf.spec.ts \
  apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-astro.png \
  apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-notes.png \
  apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-edit-route.png \
  docs/plans/wave-5-main/C.2-handoff-pack.md \
  docs/plans/active.md \
  docs/plans/wave-5-main/C.2-12-stage-c2-close.md \
  docs/audits/codex-runs/2026-05-06-C.2-12-execute.txt

git diff --cached --stat
# Expected: 8 entries (7 whitelist + 1 codex audit log).

git commit -m "Wave 5 C.2-12 — Stage C.2 close: perf budget + visual smoke baseline + handoff pack (13 of 13 Stage C.2)

..."

pnpm --filter @skb/site typecheck   # uncached pre-push verification

git push -u origin wave-5-c.2-12-stage-c2-close
```

## Plan cross-refs

- [Wave 5 plan v1.3 row C.2-12 line 693](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
- [Stage C.2 close criterion line 695](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
- [ADR-0017 §371-386 AC#6 60fps perf budget](../../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0011 D6 commit bundling](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0011 D9.1 UI-touch path patterns + D9.6 auto-skip](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0006 v0.2 8-point asymmetry-audit checklist + D8 staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
- [Wave 5 C.1-handoff-pack.md (Stage close template precedent)](C.1-handoff-pack.md)
- [Wave 5 C.2-10 + C.2-11 PR.md (Path A precedent)](C.2-10-playwright-drag-scenarios.md)
