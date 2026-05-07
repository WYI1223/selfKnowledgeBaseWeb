# C.3-5 — Stage C.3 close: visual smoke baseline lock + handoff pack

> **Wave 5 Stage C.3 5th and final implementation PR** of the locked
> 5-PR sequence (per Wave 5 plan v1.3 row C.3-5, line 705; v1.3 R14
> retrofit catalog § C.3-5 lines 598-605). Lands the **Stage C.3
> close**: visual-smoke baseline regen + lock (post C.3-1 OKLCH
> tokens + C.3-2 8 kind-hue stripes + C.3-3 Inter typography +
> C.3-4 warm shadow); handoff pack with R-retrospective candidates
> for Wave 5 close (ADR-0019). **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)
> does NOT fire** per `## D2 trigger judgment` (no CONTRACT.md
> change; baseline regen + handoff pack only).

## title

Land Stage C.3 close: regen visual-smoke baselines on
`apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-{notes,astro}.png`
to capture the v2 visual identity (OKLCH cream + Inter sans +
JetBrains Mono + 5 kind-hue stripes + warm shadow). Author Stage
C.3 handoff pack at `docs/plans/wave-5-main/C.3-handoff-pack.md`
documenting: 5-PR sequence summary (C.3-1..C.3-5 squashes); v2
visual identity now site-wide; deferred ADR-0018 D7 5-light-block
CSS calibration to Phase 2+ (per C.3-4 R1 sister-doc-sync drift);
pre-existing broader-suite flake catalog (Wave 5 close
R-retrospective candidates: c2-7-heavy-grid-dims / c2-8-drag-modules /
c2-9-responsive-fsm / visual-smoke theme-toggle / grid-perf TC2.3).

## files

3-5 files modified/created (~50 LOC + binary regens):

1. `apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-astro.png`
   — **MODIFY** (regen captures v2 visual identity).

2. `apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-notes.png`
   — **MODIFY** (regen captures v2 visual identity).

3. `docs/plans/wave-5-main/C.3-handoff-pack.md` — **NEW** (~150 LOC).
   Stage C.3 handoff pack:
   - 5-PR sequence summary (C.3-1 squash `e0eb168` / C.3-2 `4dc1219`
     / C.3-3 `e47b67a` / C.3-4 `fce2890` / C.3-5 TBD)
   - v2 visual identity status: foundation tokens + 8 kind-hue
     stripes + Inter+JetBrains typography + warm shadow LANDED
   - Deferred to Phase 2+: 5 light block CSS migration to v2 OKLCH
     direct consumption (per C.3-4 R1 sister-doc-sync drift); dark
     theme OKLCH variant; Tailwind preset migration; CSP header;
     self-host Inter+JetBrains woff2
   - Pre-existing broader-suite flakes: catalog of 5 specs failing
     on plain main HEAD (NOT introduced by Stage C.3); Wave 5 close
     R-retrospective candidates
   - Wave 5 close (ADR-0019) preparation pointer: this handoff +
     C.2-handoff-pack.md + C.1-handoff-pack.md = 3-stage close
     evidence

4. `docs/plans/wave-5-main/C.3-5-stage-close.md` — **NEW** (PR.md
   self).

5. `apps/site/src/__tests__/e2e/c3-5-baseline-diff.spec.ts` —
   **NEW** (~60 LOC). Playwright spec verifying visual-smoke
   baseline diff < 5% between current /sample-blocks rendering
   and the committed baseline (per ADR-0018 AC#8). Light-theme
   guard. Screenshot to `docs/audits/screenshots/wave-5-c3-5-baseline-diff.png`.

## D2 trigger judgment

NO D2 rows fire. Pure baseline regen + docs handoff. Stage 4
PRE-COMMIT CLAUDE REVIEW does NOT fire. Reviewer codex single
round + same-invocation commit per simple-D1 docs/binary-only
pattern (PR #79 precedent).

## ui_touch

`true` — `apps/site/playwright/visual-smoke-baseline/**` doesn't
match D9.1 path patterns directly but the diff includes the spec
file. Mechanical detection may return `true` or `false` depending
on which files mechanical script considers UI-touch. Per C.3-5
v1.3 retrofit catalog § lines 598-605: catalog declares ui_touch:
true; e2e_smoke spec is canonical Stage close coverage.

## e2e_smoke

Per v1.3 catalog § C.3-5 (lines 598-605):

- flow: visual smoke baseline diff < 5% across calibrated pages (per ADR-0018 AC#8); Stage C.3 close evidence
  target_url: /sample-blocks (canonical baseline page)
  playwright_spec: apps/site/src/__tests__/e2e/c3-5-baseline-diff.spec.ts:"visual smoke baseline diff < 5%"
  screenshot_archive: docs/audits/screenshots/wave-5-c3-5-baseline-diff.png

## decision-log

### Decision 1 — Stage C.3 close scope

C.3-5 scope = baseline lock + handoff pack ONLY. No new code; no
new tokens; no consumer migration. The 5-light-block CSS calibration
(D7) deferred from C.3-4 R1 stays out-of-scope at C.3-5; tracked
as Phase 2+ along with Tailwind preset migration + dark OKLCH +
CSP + self-host.

### Decision 2 — Visual smoke baseline diff < 5% verification

Per ADR-0018 AC#8: visual-smoke baseline diff < 5%. Implementation
strategy: Playwright spec compares current rendering against
committed baseline using pixel-diff library OR built-in
toMatchSnapshot. For initial Stage close, simply re-take baseline
post-C.3-1..C.3-4 visual changes; diff verification runs at every
subsequent PR's CI.

### Decision 3 — Handoff pack as Wave 5 close evidence

Handoff pack documents 5-PR sequence, deferred items, retrospective
candidates. Forms part of ADR-0019 close ceremony evidence
alongside C.1-handoff-pack.md + C.2-handoff-pack.md.

## acceptance

```bash
# AC-1: visual-smoke baselines exist + size > 0 (regen post C.3-1..C.3-4)
test -s apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-astro.png
test -s apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-notes.png
```

```bash
# AC-2: handoff pack file exists
test -f docs/plans/wave-5-main/C.3-handoff-pack.md
```

```bash
# AC-3: handoff pack mentions 5-PR sequence + squashes
grep -cE 'e0eb168|4dc1219|e47b67a|fce2890' docs/plans/wave-5-main/C.3-handoff-pack.md
# Expected: ≥4 (4 of 5 squashes pre-C.3-5 are known)
```

```bash
# AC-4: pnpm check exit 0
pnpm check
```

```bash
# AC-5: scope-fence
git diff --name-only main..HEAD | sort
# Expected: 4-6 files
```

```bash
# AC-6: anti-leak (char-class [:])
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.3-5-stage-close.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **5 light block CSS calibration** (D7 of ADR-0018): stays
  deferred to Phase 2+ (per C.3-4 R1 sister-doc-sync drift surface).
- **Pre-existing broader-suite flakes**: cataloged in handoff pack
  as Wave 5 close R-retrospective candidates; not blocking Stage
  C.3 close.
- **Dark theme OKLCH variant + Tailwind preset migration + CSP +
  self-host fonts**: Phase 2+ scope.

## Related

- [Wave 5 plan v1.3 row C.3-5](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) line 705
- [ADR-0018 AC#8 visual smoke baseline](../../decisions/ADR-0018-v2-visual-migration.md)
- [Stage C.2 handoff pack](C.2-handoff-pack.md) — Stage close precedent
- C.3-1..C.3-4 PR.md siblings
