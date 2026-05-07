# C.3-2 — block kind 顶 2px 彩色横条 (8 kind hue tokens + 5 light block CSS)

> **Wave 5 Stage C.3 2nd implementation PR** of the locked 5-PR sequence
> (per Wave 5 plan v1.3 row C.3-2, line 702 of the integration plan;
> v1.3 R14 third retrofit catalog § C.3-2 lines 571-578). Lands the
> **ADR-0018 D3 visual-identification kind-hue token set**:
> 8 NEW `--accent-<kind>` OKLCH hue tokens at `@skb/design-tokens` +
> 5 light block ui-default CSS files add `border-top: 2px solid
> var(--accent-<kind>)` for kind visual identification per granularity
> v0.3.4 visual contract. Strategy A coexistence continues from C.3-1
> (additive; legacy `--color-*` triplet untouched). **PRE-COMMIT
> CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger judgment`
> (Row 1 CONTRACT.md change in `@skb/design-tokens` + Row 5
> cross-package: design-tokens + 5 block-* packages).

## title

Land ADR-0018 D3 8 kind-hue OKLCH tokens (`--accent-canvas` /
`--accent-runnable` / `--accent-image` / `--accent-math` /
`--accent-pdf` / `--accent-jupyter` / `--accent-nn-viz` /
`--accent-agent-flow`) at `@skb/design-tokens` + 5 light block
ui-default CSS additions: `border-top: 2px solid var(--accent-<kind>)`
per kind for visual identification on top of block container.
Sister-doc-sync `packages/design-tokens/CONTRACT.md` adding
`### Block kind hue tokens (ADR-0018 D3)` section. Land Playwright
spec at `apps/site/src/__tests__/e2e/c3-2-block-hues.spec.ts`
covering 8-kind-distinct-hue smoke flow on `/sample-blocks`.

## files

10 files modified/created. Per Wave 5 plan v1.3 row C.3-2 file
whitelist + ~200 LOC budget:

1. `packages/design-tokens/src/tokens.css` — **MODIFY** (~25 LOC
   additive). Append NEW `/* === v2 block-kind hues (ADR-0018 D3) === */`
   section under existing `/* === v2 fonts === */` block:
   - `--accent-canvas: oklch(60% 0.13 215)` (215° — same as `--canvas`
     but namespaced as `--accent-canvas` for kind-hue stripe usage;
     value-equivalent alias)
   - `--accent-runnable: oklch(50% 0.12 145)` (145°)
   - `--accent-image: oklch(60% 0.10 60)` (60°)
   - `--accent-math: oklch(50% 0.16 280)` (280°)
   - `--accent-pdf: oklch(55% 0.16 0)` (0°)
   - `--accent-jupyter: oklch(65% 0.14 90)` (90°)
   - `--accent-nn-viz: oklch(50% 0.18 325)` (325°)
   - `--accent-agent-flow: oklch(55% 0.13 180)` (180°)
   All values per ADR-0018 D3 locked table (5 missing kinds: math /
   pdf / jupyter / nn-viz / agent-flow per Pre-A4 plan-challenger Q3
   absorbtion). Existing tokens UNCHANGED.

2. `packages/design-tokens/src/tokens-fallback.css` — **MODIFY**
   (~9 LOC additive). Append 8 hex fallbacks for `--accent-<kind>`
   tokens (Culori 4.0.1 actual derivation per C.3-1 Decision 6 protocol).

3. `packages/design-tokens/src/tokens.ts` — **MODIFY** (~12 LOC).
   Append `accentKindVarsV2` mirror to v2 surface block:
   ```
   accentCanvas: 'var(--accent-canvas)',
   accentRunnable: 'var(--accent-runnable)',
   accentImage: 'var(--accent-image)',
   accentMath: 'var(--accent-math)',
   accentPdf: 'var(--accent-pdf)',
   accentJupyter: 'var(--accent-jupyter)',
   accentNnViz: 'var(--accent-nn-viz)',
   accentAgentFlow: 'var(--accent-agent-flow)',
   ```
   Update `tokensV2` composite to include `accentKind: accentKindVarsV2`.
   Add `AccentKindTokenNameV2` type. Re-export from `index.ts` per
   C.3-1 Q12 unconditional re-export pattern.

4. `packages/design-tokens/src/index.ts` — **MODIFY** (~3 LOC).
   Append `accentKindVarsV2` + `AccentKindTokenNameV2` to existing
   v2 barrel re-export.

5. `packages/design-tokens/src/__tests__/tokens.test.ts` — **MODIFY**
   (~15 LOC). Add 2 NEW tests:
   - `it('exposes 8 v2 block-kind hue tokens')`: assert
     `Object.keys(tokensV2.accentKind)` length === 8 + each key
     resolves to `var(--accent-<kind>)` literal
   - `it('OKLCH→hex fallback covers all 8 v2 block-kind hues')`:
     read tokens-fallback.css raw → assert each `--accent-<kind>`
     hex value matches inline-frozen Culori snapshot

6. `packages/design-tokens/CONTRACT.md` — **MODIFY** (~15 LOC).
   Append NEW `### Block kind hue tokens (ADR-0018 D3)` section
   under `## v2 visual tokens` parent. Document: 8 kind hue tokens
   + light-only carve-out applies (no `--accent-<kind>` overrides
   in tokens-dark.css per C.3-1 Wave 5 carve-out continued).

7. `packages/block-callout/src/ui-default/callout.css` — **MODIFY**
   (~3 LOC). Add `border-top: 2px solid var(--accent-runnable);`
   to `[data-callout-variant]` selector. callout kind = 'component';
   per ADR-0018 D3 callout uses `--accent-runnable` 145° green
   (signaling actionable / running content).

   _NOTE: ADR-0018 D3 prose says callout/code (kind=component) "顶
   2px 横条 (D3 if hue) … no hue 默认无横条" per Markdown decision
   prose lines 145-150. But D3 hue table also lists callout / code
   under kind=component without explicit hue mapping. Decision: use
   `--accent-runnable` for callout per granularity v0.3.4 spec
   "callout = info-bearing component → green hue". Tracked as
   Decision 1 below._

8. `packages/block-code/src/ui-default/code.css` — **MODIFY**
   (~3 LOC). Add `border-top: 2px solid var(--accent-runnable);`
   to top-level code container (kind = 'component'; same rationale
   as callout — both kind=component and runnable-flavored).

9. `packages/block-image/src/ui-default/image.css` — **MODIFY**
   (~3 LOC). Add `border-top: 2px solid var(--accent-image);` to
   image container. Per ADR-0018 D3 image hue = 60° yellow.

10. `packages/block-math/src/ui-default/math.css` — **MODIFY**
    (~3 LOC). Add `border-top: 2px solid var(--accent-math);` to
    math container. Per ADR-0018 D3 math hue = 280° purple.

11. `packages/block-pdf/src/ui-default/pdf.css` — **MODIFY** (~3
    LOC). Add `border-top: 2px solid var(--accent-pdf);` to pdf
    container. Per ADR-0018 D3 pdf hue = 0° red.

12. `apps/site/src/__tests__/e2e/c3-2-block-hues.spec.ts` — **NEW**
    (~80 LOC). Playwright spec navigating to `/sample-blocks` +
    asserting:
    - 5 light block kind containers exist (callout / code / image /
      math / pdf)
    - Each has computed `border-top-width: 2px` + `border-top-style:
      solid`
    - Each `border-top-color` resolved value differs from siblings
      (visual identification distinct hues)
    - Light theme guard via addInitScript (per C.3-1 Q6 absorbtion
      pattern)
    - Take screenshot to `docs/audits/screenshots/wave-5-c3-2-block-hues.png`

13. `docs/plans/wave-5-main/C.3-2-block-kind-hues.md` — **NEW**
    (this PR.md).

14. `docs/audits/screenshots/wave-5-c3-2-block-hues.png` — **NEW**
    (D9.5 screenshot ≥ 5KB).

**Total LOC delta** (post-EXECUTE actual): ~563 LOC across 15 files
(C.3-2-actual: +121/-20 tracked + 442 new untracked text + 121054
bytes screenshot binary). The 15th file is `apps/site/src/styles/global.css`
modification: codex EXECUTE added 5 `@import` lines for the 5 light
block CSS files because /notes/sample-blocks rendered without their
ui-default styling pre-C.3-2 (pre-existing gap per design-tokens
CONTRACT.md "Required CSS import path" rule that apps MUST import
each block's CSS at boot). C.3-2 closes this CSS-import gap as part
of landing the kind-hue stripe per ADR-0018 D3 visibility intent —
without the CSS imports, the new `border-top: 2px solid var(--accent-...)`
rule would have no effect at runtime. **Visual-smoke baselines on
`/notes/sample-blocks` + `/sample-blocks-astro` remain stable**
(verified locally: 5/6 grid-perf tests pass; TC2.3 fail is the
pre-existing `.skb-grid` visibility flake on `/notes/sample-blocks/edit`
which fails on main HEAD too, unrelated to C.3-2). 15 LOC budget
acceptable per "+/- envelope" at row C.3-2; no D2 row reframe
because cross-package surface stays at design-tokens + 5 block-* +
apps/site = 7 packages already in scope at PR.md authoring time.

## D2 trigger judgment

| D2 row | Hit? | Trigger evidence |
| --- | --- | --- |
| Row 1 (CONTRACT.md change) | **YES** | `packages/design-tokens/CONTRACT.md` modified (file 6); also any block-*/CONTRACT.md if updated (deferred — block-* CONTRACT.md doesn't currently track per-block kind hue; documented at design-tokens single-source per ADR-0003 D6) |
| Row 5 (cross-package ≥3 packages) | **YES** | design-tokens + 5 block-* packages = 6 distinct packages affected |

**Stage 4 PRE-COMMIT CLAUDE REVIEW**: **FIRES** per Row 1+5.

## ui_touch

`true` — mechanical D9.1 detection: `packages/design-tokens/**` +
`packages/block-*/src/ui-default/**` matches.

## e2e_smoke

Per Wave 5 plan v1.3 R14 retrofit catalog § C.3-2 (lines 571-578).
Test name updated post-EXECUTE to match actual spec implementation
shape: 5 light blocks (callout + code + image + math + pdf) render
mapped top hue accents — callout + code intentionally share
`--accent-runnable` per Decision 1 → 4 unique colors across 5
blocks; spec name "5 light blocks render mapped top hue accents"
asserts the 5-block-with-4-unique-colors invariant. Heavy blocks
(jupyter / nn-viz / agent-flow) are visualized via HeavyBlockBoundary
plugin placeholder per C.2-7 already shipped — their hue tokens
are added in C.3-2 but their rendering on `/sample-blocks` is via
plugin-placeholder (already covered by c2-7 spec). Plan-row
"8 block kinds" wording subsumes 5-light + 3-heavy = 8; light-block
spec asserts hue token authority, heavy-block hues assert via
token-presence (AC-2 + AC-3).

- flow: 5 light blocks (callout + code + image + math + pdf) render mapped top hue accents (4 unique colors; callout+code share --accent-runnable per Decision 1)
  target_url: /sample-blocks
  playwright_spec: apps/site/src/__tests__/e2e/c3-2-block-hues.spec.ts:"5 light blocks render mapped top hue accents"
  screenshot_archive: docs/audits/screenshots/wave-5-c3-2-block-hues.png

## decision-log

### Decision 1 — callout / code kind hue mapping

**Locked**: callout + code (both kind='component') use
`--accent-runnable` 145° green. ADR-0018 D3 prose lines 145-150
discusses markdown's "no border-top" decision but the kind-hue
table lines 117-125 only enumerates 8 hue mappings (canvas /
runnable / image + 5 missing kinds). callout / code visual identity
inherits from runnable per granularity v0.3.4 "callout/code =
info-bearing component" semantic alignment with runnable kind.

**Alternative considered**: per-component-block-type unique hues
(callout=blue / code=green / etc.). Rejected: ADR-0018 D3 hue
budget is 8 (matches plan v1.3 row C.3-2 wording "8 kind hue").
Adding more would require ADR amendment.

### Decision 2 — markdown blocks remain border-less

Per ADR-0018 D3 lines 119-120 + 146-150: kind='prose' (markdown)
intentionally omits border-top. C.3-2 does NOT touch
`packages/block-*` containing prose-rendering markdown elements.
Visual identification falls back to other cues (selection ring,
hover gutter `⋮⋮ + ×`).

### Decision 3 — additive coexistence (continued from C.3-1)

The 8 NEW `--accent-<kind>` tokens are added ALONGSIDE existing
`--canvas` / `--accent` etc. tokens. `--accent-canvas` is a
value-equivalent alias of `--canvas` for naming consistency
within the kind-hue prefix family. `--canvas` continues to be
referenced by ADR-0017 D11 drop-pulse + other consumers.

### Decision 4 — Culori 4.0.1 derivation continues

Per C.3-1 Decision 6 protocol: hex fallback derivation via
`culori@4.0.1 formatHex(parse(...))`. EXECUTE re-derives + records
actual values (table below for reviewer reference; EXECUTE-time
output is canonical):

| token | OKLCH | Culori 4.0.1 hex |
|---|---|---|
| `--accent-canvas` | `oklch(60% 0.13 215)` | `#0092b0` (matches C.3-1 `--canvas` ✓) |
| `--accent-runnable` | `oklch(50% 0.12 145)` | `#2f7434` |
| `--accent-image` | `oklch(60% 0.10 60)` | `#ac713e` |
| `--accent-math` | `oklch(50% 0.16 280)` | `#5552bb` |
| `--accent-pdf` | `oklch(55% 0.16 0)` | `#b73f6e` |
| `--accent-jupyter` | `oklch(65% 0.14 90)` | `#b08a00` |
| `--accent-nn-viz` | `oklch(50% 0.18 325)` | `#93329a` |
| `--accent-agent-flow` | `oklch(55% 0.13 180)` | `#008974` |

EXECUTE phase replaces tentative cells with actual Culori output
+ commits both tokens-fallback.css + inline snapshot map together.

## acceptance

```bash
# AC-1: ui_touch + e2e-coverage gates PASS
pnpm exec tsx scripts/check-ui-touch.ts
# Expected: ui_touch=true
pnpm exec tsx scripts/check-e2e-coverage.ts
# Expected: PASS (1 e2e_smoke entries verified)
```

```bash
# AC-2: 8 kind-hue tokens present in tokens.css
grep -cE '^\s*--accent-(canvas|runnable|image|math|pdf|jupyter|nn-viz|agent-flow):' packages/design-tokens/src/tokens.css
# Expected: 8
```

```bash
# AC-3: 8 kind-hue hex fallbacks in tokens-fallback.css
for k in canvas runnable image math pdf jupyter nn-viz agent-flow; do
  grep -qE "^\s*--accent-$k:\s*#[0-9a-f]{6};" packages/design-tokens/src/tokens-fallback.css || { echo "MISSING --accent-$k"; exit 1; }
done
echo "all 8 kind hex fallbacks present"
# Expected: 'all 8 kind hex fallbacks present'
```

```bash
# AC-4: tokens-dark.css has 0 --accent-<kind> overrides (light-only carve-out continued)
grep -cE '^\s*--accent-(canvas|runnable|image|math|pdf|jupyter|nn-viz|agent-flow):' packages/design-tokens/src/tokens-dark.css
# Expected: 0
```

```bash
# AC-5: 5 light block ui-default CSS each has border-top: 2px solid var(--accent-...)
for f in packages/block-{callout,code,image,math,pdf}/src/ui-default/*.css; do
  grep -qE 'border-top:\s*2px\s+solid\s+var\(--accent-' "$f" || { echo "MISSING border-top in $f"; exit 1; }
done
echo "all 5 light blocks have kind-hue border-top"
```

```bash
# AC-6: design-tokens 25 tests pass (existing 23 + 2 NEW)
pnpm --filter @skb/design-tokens test 2>&1 | grep 'Tests'
# Expected: contains "Tests: 25 passed"
```

```bash
# AC-7: pnpm check exit 0
pnpm check
```

```bash
# AC-8: scope-fence — 15 files exact (post-EXECUTE; +1 file global.css for required block CSS imports)
git diff --name-only main..HEAD | sort
# Expected (15 files):
# apps/site/src/__tests__/e2e/c3-2-block-hues.spec.ts
# apps/site/src/styles/global.css
# docs/audits/screenshots/wave-5-c3-2-block-hues.png
# docs/plans/wave-5-main/C.3-2-block-kind-hues.md
# packages/block-callout/src/ui-default/callout.css
# packages/block-code/src/ui-default/code.css
# packages/block-image/src/ui-default/image.css
# packages/block-math/src/ui-default/math.css
# packages/block-pdf/src/ui-default/pdf.css
# packages/design-tokens/CONTRACT.md
# packages/design-tokens/src/__tests__/tokens.test.ts
# packages/design-tokens/src/index.ts
# packages/design-tokens/src/tokens-fallback.css
# packages/design-tokens/src/tokens.css
# packages/design-tokens/src/tokens.ts
```

```bash
# AC-9: anti-leak — implementation-string field-name only inside PR.md
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.3-2-block-kind-hues.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0 (using char-class [:] per C.3-1 fix-forward to avoid script self-match)
```

## Out-of-scope

- **Heavy block kind hues** (jupyter / nn-viz / agent-flow): tokens
  are added at C.3-2; consumption by HeavyBlockBoundary plugin
  placeholder is C.2-7 already shipped (sample-blocks rendering
  consumed). C.3-2 only validates token authority + 5-light-block
  CSS border-top.
- **Visual smoke baseline regen**: deferred to C.3-5 Stage close.
  C.3-2 visual changes (5 light blocks now have 2px top borders)
  WILL cause visual-smoke baseline diff on
  `apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-{notes,astro}.png`.
  Per Q11 cross-phase no-mixed-consumer migration rule from C.3-1:
  consumer atomic switch is acceptable; baselines regen at C.3-5.
  Note: the `visual-smoke` CI job in `.github/workflows/ci.yml` runs
  `pnpm --filter @skb/site test:visual` which executes the Playwright
  spec at `playwright/grid-perf.spec.ts` — that job's TC2.x emission
  steps regenerate baselines on every CI run (not enforce-via-diff;
  see grid-perf.spec.ts:200-210 emit-only logic). So baseline regen
  is automatically handled by CI re-running; no manual fix-forward
  needed. C.3-5 close-prep handoff documents the canonical baselines.
- **Pre-existing visual-smoke broader-suite flakes** (NOT introduced
  by C.3-2; verified via plain-main reproduction): c2-7-heavy-grid-dims
  (.skb-grid + heavy-box dims null on /notes/sample-blocks/edit),
  c2-8-drag-modules-mount (ProseMirror not visible), c2-9-responsive-fsm-mount
  (.skb-grid not found), visual-smoke theme-toggle (button click
  timeout). All 4 fail on main HEAD too (verified by `git stash` +
  re-run). They reflect existing flake/race in editor mount + theme
  toggle hydration NOT touched by C.3-2 (no `apps/site/src/components/`
  / no `apps/site/src/pages/notes/[...slug].astro` / no editor-shell
  changes). C.3-2's own spec PASS in isolation. ADR-0006 item 9
  scoped to C.3-2's own e2e_smoke entry which PASSES locally + in
  CI; broader-suite flakes are tracked as Wave 5 close R-retrospective
  candidates (not blocking C.3-2 merge).

## Related

- [Wave 5 plan v1.3 row C.3-2](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) line 702
- [ADR-0018 D3 block kind hue table](../../decisions/ADR-0018-v2-visual-migration.md)
- [C.3-1 PR.md](C.3-1-design-tokens-oklch-fonts.md) — Strategy A coexistence + Culori derivation protocol precedent
- Sister PRs: C.3-3 (prose customization + typography), C.3-4 (5 light block CSS calibration), C.3-5 (visual smoke baseline regen + Stage C.3 close)
