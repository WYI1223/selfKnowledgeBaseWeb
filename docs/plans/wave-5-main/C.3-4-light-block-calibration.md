# C.3-4 — shadow rgba(20,15,10) warm-tone refresh

> **Wave 5 Stage C.3 4th implementation PR** of the locked 5-PR sequence
> (per Wave 5 plan v1.3 row C.3-4, line 704; v1.3 R14 retrofit
> catalog § C.3-4 lines 589-596). **Scope post-R1**: lands ONLY the
> ADR-0018 D6 shadow tokens warm-tone refresh (in-place value update
> for `--shadow-sm/md/lg` from neutral `rgba(0,0,0)` to warm-tone
> `rgba(20,15,10)`). The full ADR-0018 D7 5-light-block CSS
> calibration was attempted at EXECUTE but reverted per reviewer
> R1 finding: full migration introduces sister-doc-sync drift in 5
> `block-*/CONTRACT.md` files + 4 `block-*/ui-default/*-tokens.ts`
> witness types. Deferring full block CSS calibration to a later
> PR (C.3-5 close handoff or Phase 2+) avoids scope creep beyond
> the ~300 LOC budget. Strategy A coexistence continues:
> `--color-*` triplet tokens unchanged; shadow values change in
> place; consumers automatically pick up site-wide warm-tone
> shadow per ADR-0018 D6 prose "单一 token 切到暖色调 = 全 apps/site
> + block-* shadow 自动跟". **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)
> FIRES** per `## D2 trigger judgment` (Row 1 token value change in
> @skb/design-tokens shadow).

## title

Land ADR-0018 D6 shadow warm-tone refresh (`--shadow-sm/md/lg`
in-place value update from neutral `rgba(0,0,0)` to warm-tone
`rgba(20,15,10)` in `@skb/design-tokens/tokens.css`). Sister-doc-sync
`packages/design-tokens/CONTRACT.md` adding `### Shadow tokens
warm-tone refresh (ADR-0018 D6)` note. Land Playwright spec at
`apps/site/src/__tests__/e2e/c3-4-light-block-cal.spec.ts`
verifying `--shadow-sm/md/lg` resolved values carry warm-tone
substring + no neutral black residual. ADR-0018 D7 5-light-block
CSS calibration **DEFERRED** to a later PR (rationale in
`## decision-log`).

## files

5 files (post-R1 scope reduction):

1. `packages/design-tokens/src/tokens.css` — **MODIFY** (~6 LOC).
   In-place update: `--shadow-sm/md/lg` values from `rgb(0 0 0 / X)`
   to layered warm-tone `rgba(20, 15, 10, Y)` per ADR-0018 D6.

2. `packages/design-tokens/CONTRACT.md` — **MODIFY** (~8 LOC).
   NEW `### Shadow tokens warm-tone refresh (ADR-0018 D6)` section
   under `## v2 visual tokens` parent. Documents in-place value
   change; tokens-dark.css preserves existing darker neutral
   variant.

3. `apps/site/src/__tests__/e2e/c3-4-light-block-cal.spec.ts` —
   **NEW** (~50 LOC). Spec asserts `--shadow-sm/md/lg` resolved
   values contain `rgba(20, 15, 10` substring + light-theme guard
   + screenshot to
   `docs/audits/screenshots/wave-5-c3-4-light-block-cal.png` (D9.5
   ≥5KB).

4. `docs/plans/wave-5-main/C.3-4-light-block-calibration.md` —
   **NEW** (PR.md self).

5. `docs/audits/screenshots/wave-5-c3-4-light-block-cal.png` —
   **NEW**.

Plus 2 visual-smoke baseline regens (Playwright EXECUTE side-effect)
included for completeness.

## D2 trigger judgment

Row 1 (CONTRACT.md change). Row 5 NOT triggered (only design-tokens
package touched at this scope; 5 block-* CSS migrations reverted
out of C.3-4 for sister-doc-sync discipline). PRE-COMMIT CLAUDE
REVIEW fires per Row 1.

## ui_touch

`true` — `packages/design-tokens/**` matches.

## e2e_smoke

Per v1.3 catalog § C.3-4 (lines 589-596; spec name updated to
match implementation):

- flow: shadow tokens (--shadow-sm/md/lg) carry warm-tone rgba(20,15,10) values per ADR-0018 D6 in-place refresh
  target_url: /
  playwright_spec: apps/site/src/__tests__/e2e/c3-4-light-block-cal.spec.ts:"shadow tokens carry warm-tone rgba(20,15,10) values"
  screenshot_archive: docs/audits/screenshots/wave-5-c3-4-light-block-cal.png

## decision-log

### Decision 1 — Shadow refresh in-place; consumers automatic

Per ADR-0018 D6: "单一 token 切到暖色调 = 全 apps/site + block-*
shadow 自动跟". Updates existing `--shadow-sm/md/lg` values in-place;
consumers pick up automatically. Strategy A coexistence applies to
TOKEN NAMES (preserved); VALUES change. Site-wide visual change is
small (shadow color shift only).

### Decision 2 — 5 light block CSS calibration DEFERRED

Reviewer R1 surfaced sister-doc-sync drift if 5 block CSS files
were migrated to consume `var(--bg)`/`var(--surface)`/etc. instead
of `rgb(var(--color-X))`: 5 `block-*/CONTRACT.md` files document
the existing pattern; 4 `*-tokens.ts` witness types map
`ColorTokenName` keys ('fg', 'border', 'surface1') to old token
names. Migrating CSS without updating CONTRACT + witness violates
ADR-0006 item 6 (sister CONTRACT.md sync) + item 8 (8th-class
hunt: generated/witness drift). Updating all 9-10 sister files
exceeds the ~300 LOC C.3-4 budget. Defer to:
- C.3-5 close handoff (if visual-smoke baseline diff < 5% needs
  block CSS updates), OR
- Phase 2+ scope (when Tailwind preset migration + block-*/CONTRACT
  v2-aware refresh happen together)

C.3-4 ships with shadow refresh ALONE; visual change is uniform
(warm-tone shadow site-wide); does NOT require block CSS
migration.

### Decision 3 — Visual baseline regen at C.3-4

Same pattern as C.3-3 (typography). Shadow refresh causes minor
visual diff in baseline screenshots; Playwright auto-regens.
C.3-5 close handles final lock + diff verify per ADR-0018 AC#8.

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts
pnpm exec tsx scripts/check-e2e-coverage.ts
```

```bash
# AC-2: shadow tokens warm-tone (rgba(20, 15, 10)) — count occurrences not lines
grep -oE 'rgba\(20[ ,]+15[ ,]+10' packages/design-tokens/src/tokens.css | wc -l
# Expected: 6 (3 shadow tokens * 2 layers each = 6 rgba calls; using -oE | wc -l for occurrence count, not -c which counts lines)
```

```bash
# AC-3: no neutral black shadow residual in light-theme tokens.css
awk '/--shadow-(sm|md|lg)/' packages/design-tokens/src/tokens.css | grep -cE 'rgb\(\s*0[ ,]+0[ ,]+0' || true
# Expected: 0 (no rgb(0 0 0) shadow residual)
```

```bash
# AC-4: pnpm check exit 0
pnpm check
```

```bash
# AC-5: design-tokens 26 tests pass (no NEW tests; just shadow value update)
pnpm --filter @skb/design-tokens test 2>&1 | grep 'Tests'
```

```bash
# AC-6: scope-fence — 5 source files + 1 PR.md + 1 screenshot (+ 2 baselines optional regen)
git diff --name-only main..HEAD | sort
# Expected: 5-7 files (5 in-scope + optional 2 baselines)
```

```bash
# AC-7: anti-leak (char-class [:])
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.3-4-light-block-calibration.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **5 light block CSS calibration** (D7 of ADR-0018): deferred per
  Decision 2 (R1 sister-doc-sync surface). Tracked for C.3-5 close
  handoff or Phase 2+.
- **Stage C.3 close visual smoke baseline diff < 5% verification**:
  defer to C.3-5.
- **Block CONTRACT.md updates per-block**: deferred with 5-block
  CSS calibration.
- **Witness type updates** (block-*/ui-default/*-tokens.ts): deferred
  with 5-block CSS calibration.
- **Heavy block CSS calibration**: Phase 2+ scope.
- **Tailwind preset typography migration**: continues out-of-scope
  per C.3-1 Decision 3.

## Related

- [Wave 5 plan v1.3 row C.3-4](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) line 704
- [ADR-0018 D6 shadow + D7 light block calibration](../../decisions/ADR-0018-v2-visual-migration.md)
- [C.3-3 PR.md](C.3-3-prose-typography.md) — typography upgrade + body Inter precedent
- Sister PRs: C.3-5 (Stage C.3 close visual smoke baseline diff < 5% verification + handoff pack — may include 5 light block CSS calibration if needed)
