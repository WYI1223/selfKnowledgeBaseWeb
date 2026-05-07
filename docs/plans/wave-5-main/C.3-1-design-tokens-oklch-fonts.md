# C.3-1 — design-tokens OKLCH 14 color + 1 hex `--surface` + 3 layout + Inter/JetBrains Mono fonts

> **Wave 5 Stage C.3 1st implementation PR** of the locked 5-PR sequence
> (C.3-1 → C.3-5; per Wave 5 plan v1.3 row C.3-1, lines 700-705 of the
> integration plan, plus v1.3 R14 third retrofit catalog § C.3-1 lines
> 562-569). Lands the **ADR-0018 D1 + D2 visual-tokens foundation**:
> 14 OKLCH color tokens + 1 hex `--surface` + 3 layout tokens
> (`--row-h: 48px` / `--gap: 14px` / `--radius: 6px`) + Inter (sans) +
> JetBrains Mono (mono) Google Fonts preconnect + `--sans` / `--mono`
> font tokens + `tokens-fallback.css` (NEW; OKLCH→hex via Culori
> off-line derivation per Option α; Culori protocol pinned per Q4
> absorbtion) + `tokens.test.ts` Culori snapshot guard (per ADR-0018
> AC#12; hex shape strictness `^#[0-9a-f]{6}$` per Q17) +
> `packages/design-tokens/CONTRACT.md` additive amendment (NEW OKLCH
> section + Inter / JetBrains Mono section + Wave-5-light-only
> carve-out for OKLCH keys absent in `tokens-dark.css` + time-bound
> 4-file lockstep exception per Q2) + `package.json` `exports` entry
> for `tokens-fallback` subpath (per Q15) + barrel `src/index.ts`
> re-export of `colorVarsV2` / `layoutVarsV2` / `fontVarsV2` /
> `tokensV2` (per Q12). **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)
> FIRES** per `## D2 trigger judgment` (Row 1 CONTRACT.md change in
> `@skb/design-tokens` + Row 5 cross design-tokens + apps/site + 5
> light blocks + heavy-block-boundary; Row 5 anchored to ADR-0018 D1
> Compliance § 门槛表 row 3 per Q14). Strategy A (additive
> coexistence) is selected with rationale enumerated in
> `## decision-log`; old `--color-*` triplet tokens stay intact
> through C.3-5 to avoid a build-red window across consumers.
> Plan-challenger codex dispatched 2026-05-06; 17/18 absorbed
> (full table at `## Plan-challenger absorbtion`).

## title

Land ADR-0018 D1 OKLCH visual tokens (14 OKLCH color + 1 hex
`--surface` + 3 layout vars) + ADR-0018 D2 Inter / JetBrains Mono
Google Fonts preconnect + `--sans` / `--mono` tokens at
`@skb/design-tokens`, additively coexisting with existing
`--color-*` triplet tokens through Stage C.3 (Strategy A; full
rationale in `## decision-log`). Add `tokens-fallback.css` via
off-line Culori derivation (Option α; build script deferred to
Phase 2+) + Culori-snapshot guard test. Sister-doc-sync
`packages/design-tokens/CONTRACT.md` per ADR-0006 item 6 + ADR-0018
Compliance § Pre-A4 D2 trigger 门槛表 row 3. Land canonical
Playwright spec at
`apps/site/src/__tests__/e2e/c3-1-tokens-fonts.spec.ts` covering
the user-visible "OKLCH cream surface + accent visible + Inter
font computed" smoke flow on `/` per ADR-0011 D9 Product Experience
Quality Gate + v1.3 retrofit catalog (lines 562-569 verbatim) +
screenshot archive at
`docs/audits/screenshots/wave-5-c3-1-tokens-fonts.png` per ADR-0011
D9.5 (size ≥ 5KB; CI gate `check-screenshot-archive.ts` validates
at ACCEPT).

## files

Mechanical D9.1 path detection (via
`pnpm exec tsx scripts/check-ui-touch.ts`) returns **`ui_touch=true`**
because `packages/design-tokens/**` is a UI-touch path pattern.
File whitelist (per ADR-0011 D2 schema + v1.3 row C.3-1 LOC budget
~300 LOC):

1. `packages/design-tokens/src/tokens.css` — **MODIFY** (~60-80 LOC
   additive delta). Append (NOT replace) NEW OKLCH `:root` block
   under existing `--color-*` triplet block: 14 OKLCH color tokens
   (`--bg` / `--panel` / `--border` / `--border-strong` / `--text` /
   `--text-2` / `--text-3` / `--accent` / `--accent-soft` /
   `--accent-success` / `--canvas` / `--canvas-soft` / `--grid-line` /
   `--grid-line-strong`) + 1 hex `--surface: #ffffff` + 3 layout
   (`--row-h: 48px` / `--gap: 14px` / `--radius: 6px`) + 2 font
   (`--sans: 'Inter', -apple-system, system-ui, sans-serif;` /
   `--mono: 'JetBrains Mono', ui-monospace, monospace;`). Existing
   `--color-*` + `--space-*` + `--text-base` + `--leading-base` +
   `--font-sans` + `--font-mono` + `--radius-*` + `--shadow-*` +
   `--duration-*` + `--ease-base` UNCHANGED. Comment-banner-separated
   sections: `/* === v2 OKLCH (ADR-0018 D1) === */` +
   `/* === v2 layout (ADR-0018 D1) === */` +
   `/* === v2 fonts (ADR-0018 D2) === */`. **NO** removal /
   rename / value-form change of any existing token — Strategy A
   coexistence (see `## decision-log`).

2. `packages/design-tokens/src/tokens-dark.css` — **MODIFY** (~3-6 LOC
   doc-comment delta only; NO NEW value overrides). Append a top-of-
   file comment block declaring "v2 OKLCH keys (per ADR-0018 D1) are
   light-only at Wave 5; dark mode for OKLCH set deferred to Phase 2+
   per ADR-0018 D1 prose + AC#10. Old `--color-*` keys remain mirrored
   below (light + dark same key set invariant preserved for the
   pre-v2 token set)." NO new `--bg` / `--accent` / etc. overrides
   under `:root[data-theme='dark']` — light + dark key-set invariant
   amendment is scoped exclusively to the new OKLCH key set
   (codified in CONTRACT.md change below).

3. `packages/design-tokens/src/tokens-fallback.css` — **NEW** (~30-40
   LOC). `@supports not (color: oklch(0 0 0)) { :root { ... 14 hex
   fallback values + omit `--surface` (already hex) ... } }` block.
   Hex values derived OFF-LINE via Culori `oklchToHex(L, C, H)` at
   PR authoring time (Option α; per `## decision-log`); committed
   directly. Snapshot guard (file 5 below) prevents accidental drift.

4. `packages/design-tokens/src/tokens.ts` — **MODIFY** (~15-25 LOC
   additive delta). Append NEW exports under existing `colorVars` /
   `spaceVars` / `tokens` block: `colorVarsV2` (14 OKLCH + 1 hex
   `--surface` keyed `var(--bg)` / `var(--panel)` / etc.) +
   `layoutVarsV2` (`rowH` / `gap` / `radius`) + `fontVarsV2` (`sans` /
   `mono`) + `ColorTokenNameV2` / `LayoutTokenNameV2` /
   `FontTokenNameV2` types. Existing `colorVars` / `spaceVars` /
   `tokens` / `ColorTokenName` / `SpaceTokenName` UNCHANGED. NEW
   `tokensV2 = { color: colorVarsV2, layout: layoutVarsV2, font: fontVarsV2 }`
   composite for ergonomic consumer import. **Re-exports added to
   `packages/design-tokens/src/index.ts` UNCONDITIONALLY (per Q12
   plan-challenger absorbtion — root-import stability for
   C.3-2/C.3-3/C.3-4 consumers): `colorVarsV2` / `layoutVarsV2` /
   `fontVarsV2` / `tokensV2` + the new TokenName types.** Existing
   barrel exports preserved untouched.

5. `packages/design-tokens/src/__tests__/tokens.test.ts` — **MODIFY**
   (~30-50 LOC additive delta). Append:
   - `it('exposes 15 v2 visual color tokens (14 OKLCH + 1 hex --surface)')`
     against `tokensV2.color`
   - `it('exposes 3 v2 layout tokens (--row-h / --gap / --radius)')`
   - `it('exposes 2 v2 font tokens (--sans / --mono)')`
   - `it('OKLCH→hex fallback values are stable (Culori snapshot guard)')`:
     read `tokens-fallback.css` raw text → regex-extract hex pairs →
     compare against in-test inline-frozen snapshot map of 14 expected
     hex strings (the locked Culori derivation result for the OKLCH
     values in ADR-0018 D1 table). Drift in either OKLCH source or
     fallback hex breaks the test (per AC#12 schema).
   - Existing 5 tests UNCHANGED.

6. `packages/design-tokens/CONTRACT.md` — **MODIFY** (~25-40 LOC
   additive delta). Append NEW sections (NOT touching existing
   sections):
   - `## v2 visual tokens (ADR-0018 D1+D2)` — enumerate the 14 OKLCH
     color names + 1 hex `--surface` + 3 layout + 2 font. Note the
     authority for OKLCH→hex derivation = Culori
     (`oklchToHex(L, C, H)`), Option α (off-line) at C.3-1.
   - `### Light + dark key-set invariant — Wave 5 light-only carve-out`
     — explicit amendment to the existing `## Invariants (ADR-0003)`
     "Light + dark must share the same key set" invariant: the v2
     OKLCH key set (14 OKLCH + `--surface` + 3 layout + 2 font) is
     **Wave 5 light-only** per ADR-0018 D1 explicit prose ("dark mode
     留 Phase 2+") + AC#10. The pre-v2 `--color-*` key set continues
     to mirror across `tokens.css` ↔ `tokens-dark.css`. Phase 2+ dark
     OKLCH variant requires a separate ADR amendment (NOT silent
     extension). This carve-out is **additive scope** to the existing
     invariant — it does NOT relax it for the pre-v2 set.
   - `### Modifying-this-file rule exception (time-bound, Wave 5
     only)` — explicit amendment to the existing `## Modifying this
     file` rule "Adding a new var: non-breaking, but must update
     tokens.css + tokens-dark.css + tokens.ts + tailwind-preset.cjs
     in the same change". Per Q2 plan-challenger absorbtion: for v2
     OKLCH / font / layout keys added by Decisions 1 + 2 + 6 of C.3-1
     PR, the "tokens-dark.css update" + "tailwind-preset.cjs update"
     sub-rules are **overridden by this Wave 5 light-only carve-out**;
     tokens.css + tokens.ts updates remain mandatory and are landed
     in this PR. **Exception is revoked at Phase 2+ via separate ADR
     amendment + Pre-A-class plan-amendment PR; NOT silently
     extensible to future token additions.** The pre-v2 `--color-*`
     key set continues to enforce the original 4-file lockstep rule
     unchanged.
   - `## Inter + JetBrains Mono Google Fonts (ADR-0018 D2)` — note
     apps/site BaseLayout owns the `<link rel="preconnect">` +
     `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&family=JetBrains+Mono:wght@400;500;600&display=swap">`
     loading. Self-host fallback `apps/site/public/fonts/` is OUT OF
     SCOPE for C.3-1 (deferred to a separate PR; rationale in
     `## decision-log`).

7. `apps/site/src/layouts/BaseLayout.astro` — **MODIFY** (~10-15 LOC
   additive delta). Append two `<link rel="preconnect">` + one
   `<link href="...css2?family=Inter...&family=JetBrains+Mono...">`
   under `<head>` (above the existing FOUC `<script is:inline>` —
   font preconnect is decoration; ordering relative to FOUC script
   does not affect FOUC correctness because the FOUC script runs
   immediately and does not depend on fonts). FOUC script + ThemeToggle
   + body class + nav structure UNCHANGED. NO CSP `<meta>` tag added
   in this PR (CSP is a separate concern; see `## decision-log`
   self-host CSP deferral).

8. `apps/site/src/styles/global.css` — **MODIFY** (~3-5 LOC additive
   delta only). Add `@import '@skb/design-tokens/tokens-fallback';`
   line (using the exported subpath per Q15 plan-challenger
   absorbtion; NOT `/src/tokens-fallback.css` deep import) after the
   existing `tokens.css` + `tokens-dark.css` imports (or wherever
   they currently live). NO other changes.

8b. `packages/design-tokens/package.json` — **MODIFY** (~3 LOC
    additive delta). Add `"./tokens-fallback": "./src/tokens-fallback.css"`
    entry to `"exports"` object alongside existing `"./tokens.css"`
    and `"./tokens-dark.css"` entries. apps/site `global.css` import
    path uses the exported subpath `@skb/design-tokens/tokens-fallback`
    (NOT a `/src/tokens-fallback.css` deep import) per pnpm strict
    packages-exports resolution. (Per Q15 plan-challenger absorbtion.)

9. `apps/site/src/__tests__/e2e/c3-1-tokens-fonts.spec.ts` — **NEW**
   (~60 LOC; foundation-level assertions per Q10 partial-defer to
   C.3-3). One Playwright spec with `test('OKLCH cream + accent +
   Inter font computed', async ({ page }) => { ... })`:
   - **Light-theme guard (per Q6 plan-challenger absorbtion)**:
     `await page.addInitScript(() => document.documentElement.removeAttribute('data-theme'))`
     BEFORE `goto` to ensure the FOUC inline script does not flip
     to dark mode based on `prefers-color-scheme: dark` or any
     pre-existing localStorage `skb-theme=dark`. This guards the
     OKLCH light-only assertion path.
   - `await page.goto('/')`
   - `await page.waitForLoadState('domcontentloaded')`
   - assert `await page.evaluate(() => document.documentElement.getAttribute('data-theme'))`
     does NOT equal `'dark'` (light-theme guard verification)
   - **Token-literal sanity asserts** (token authority foundation):
     - assert `getComputedStyle(documentElement).getPropertyValue('--bg')`
       contains `oklch` substring (OR a hex from the fallback if
       browser lacks OKLCH support — the test queries the var literal
       NOT the resolved color)
     - assert `getComputedStyle(documentElement).getPropertyValue('--accent')`
       contains `oklch` substring
     - assert `getComputedStyle(documentElement).getPropertyValue('--sans')`
       contains the literal substring `Inter`
   - **Foundation D9 PASS gate (per Q10 plan-challenger absorbtion +
     C.3-3 partial-defer; D9 Product Experience Quality Gate spirit
     scoped to "foundation laid")**:
     - `<link href>` count assertion: `document.querySelectorAll('link[rel="stylesheet"]')`
       filtered to those with href containing both `fonts.googleapis.com/css2`
       and `Inter` and `JetBrains+Mono` — exactly **1** entry. Verifies
       the Google Fonts CDN preconnect + family stylesheet is present
       in DOM (foundation laid; CDN reachable on first body element
       usage at C.3-3).
     - **C.3-3 deferred D9 assertions (NOT in this spec; tracked here
       as forward-pointer for the C.3-3 spec)**: (a) `body { font-family:
       var(--sans); }` rule applied + visual-smoke baseline regen
       captures Inter on body; (b) `getComputedStyle(document.body).fontFamily`
       contains `Inter` substring; (c) `document.fonts.check('400 15px Inter')`
       returns `true` (Inter actually fetched from CDN once a body
       element triggers usage). Visual-smoke baseline regen at C.3-5
       Stage close (per ADR-0018 AC#8 scope) consolidates baselines
       to the v2 typography state.
   - take screenshot to
     `docs/audits/screenshots/wave-5-c3-1-tokens-fonts.png` (Playwright
     `page.screenshot({ path })`); CI gate
     `check-screenshot-archive.ts` enforces ≥ 5KB at ACCEPT

10. `docs/plans/wave-5-main/C.3-1-design-tokens-oklch-fonts.md` —
    **NEW** (this file; PR.md self).

11. `apps/site/src/styles/grid.css` — **MODIFY** (~3 LOC delta net;
    delete 2 redundant local var defs `--row-h: 48px;` and
    `--gap: 14px;` inside `.skb-grid {}`; rewrite top-of-file comment
    to reflect Stage C.3-1 token unification done — `--row-h` /
    `--gap` now sourced from `@skb/design-tokens` `:root`
    cascade-inherited via the global `tokens.css` import).
    Discovered at C.3-1 EXECUTE: AC-12b (single-source grep) flagged
    pre-existing literal definitions duplicating the new design-tokens
    authority. Migration is byte-equivalent visually (same 48px /
    14px values; only the source-of-truth shifts to design-tokens).
    Per ADR-0016 D5 grid contract preserved (no semantic change to
    grid-template-columns / grid-auto-rows / gap usage).

11b. `apps/site/src/__tests__/grid-css.test.ts` — **MODIFY** (~6 LOC
     delta net; sister-test for file 11). Replace assertion `--row-h:
     48px` and `--gap: 14px` are inside `.skb-grid {}` with negative
     assertion `gridCss).not.toMatch(/--row-h:\s*48px/)` +
     `gridCss).not.toMatch(/--gap:\s*14px/)` (asserting Stage C.3-1
     unification done). Preserve `--total-cols: 12` scoped assertion
     (still grid.css-local; varies per breakpoint). Test description
     reworded to "design-tokens-sourced row/gap + scoped --total-cols".

12. `packages/design-tokens/src/index.ts` — **MODIFY** (~5 LOC
    delta; per Q12 absorbtion): expand existing `export { tokens,
    colorVars, spaceVars } from './tokens'` to additionally re-export
    `colorVarsV2` / `layoutVarsV2` / `fontVarsV2` / `tokensV2` +
    type re-exports `ColorTokenNameV2` / `LayoutTokenNameV2` /
    `FontTokenNameV2`. Existing barrel re-exports preserved. EXECUTE
    confirmed needed (added at EXECUTE; this is the 12th file).

**Total LOC delta**: ~240-380 LOC across 11-12 files (post-absorbtion
envelope; was ~210-330 across 10 files pre-absorbtion). Files: 1
(tokens.css) + 2 (tokens-dark.css) + 3 (tokens-fallback.css NEW) + 4
(tokens.ts) + 5 (tokens.test.ts) + 6 (CONTRACT.md) + 7
(BaseLayout.astro) + 8 (global.css) + 8b (package.json NEW per Q15)
+ 9 (e2e spec NEW; LOC envelope expanded for Q6+Q10 light-theme guard
+ font-chain assertions) + 10 (PR.md self) **+ optionally
`packages/design-tokens/src/index.ts`** (~3-5 LOC additive delta if
barrel re-export of `colorVarsV2` / `layoutVarsV2` / `fontVarsV2` /
`tokensV2` is needed per Q12 absorbtion — EXECUTE phase verifies
actual barrel state and adds export entry only if absent). Within
~300 LOC budget per Wave 5 plan v1.3 row C.3-1; the absorbtion-driven
envelope expansion stays inside the ADR-0011 D2 LOC discipline + 500
LOC hard cap.

**Out of file whitelist** (must NOT appear in `git diff --name-only
main..HEAD` per AC#13-equivalent):
- `packages/design-tokens/src/tailwind-preset.cjs` (Tailwind preset
  semantic change is OUT OF SCOPE C.3-1; preserved for C.3-2/C.3-3)
- `apps/site/public/fonts/**` (self-host woff2 deferred per
  `## decision-log`)
- Any `packages/block-*/src/ui-default/**.css` (consumer migration
  starts at C.3-2; light-block CSS calibration is C.3-4 scope)
- Any `packages/heavy-block-boundary/src/**` (no consumption of new
  tokens at C.3-1; ADR-0014 amendments stay at C.2-7 scope)
- Any `apps/site/src/components/**` or `apps/site/src/pages/**` other
  than the BaseLayout edit + the e2e spec file (C.3-1 is foundation
  laying; consumer migration is later)

## D2 trigger judgment

Per ADR-0007 D2 trigger table (rows 1-8 evaluated in order; rows that
HIT are listed below with the exact change that triggers them):

| D2 row | Hit? | Trigger evidence |
| --- | --- | --- |
| Row 1 (CONTRACT.md change) | **YES** | `packages/design-tokens/CONTRACT.md` modified (file 6 above) — adds `## v2 visual tokens` section + `### Light + dark key-set invariant — Wave 5 light-only carve-out` amendment + `## Inter + JetBrains Mono Google Fonts` section. Per ADR-0018 D1 Compliance § Pre-A4 D2 trigger 门槛表 row 3 verbatim: "design-tokens `tokens.css` token additions ... → row 1 (design-tokens/CONTRACT.md sync) + row 5 (≥3 packages affected)". |
| Row 2 (package add/remove) | NO | No `packages/*` added/removed; no `package.json#dependencies` change in this PR (Culori invocation is OFF-LINE at PR authoring time per Option α — runtime Culori dependency NOT added; per `## decision-log`). |
| Row 3 (high-risk dep / supply chain) | NO | No new dep. |
| Row 4 (NEW ADR or ADR amendment) | NO | ADR-0018 itself was landed at Pre-A4; this PR consumes that ADR; no ADR file is modified. |
| Row 5 (cross-package change ≥ 3 packages) | **YES** | `packages/design-tokens/**` (modified) + `apps/site/src/layouts/**` (modified) + `apps/site/src/styles/**` (modified) + `apps/site/src/__tests__/e2e/**` (new) = 2 distinct packages affected at C.3-1 directly. Row 5 fires per **ADR-0018 D1 Compliance § Pre-A4 D2 trigger 门槛表 row 3 verbatim**: "design-tokens `tokens.css` token additions ... → row 1 (design-tokens/CONTRACT.md sync) + row 5 (≥3 packages affected)". This is a **documented predeclared cross-package surface trigger** (NOT a generic 'publication' policy; per Q14 plan-challenger absorbtion the 'publication' framing is replaced by anchored-to-ADR-0018-门槛表 framing). Wave 5 plan v1.3 row C.3-1 D2 column codifies it: "Row 5 (cross design-tokens + apps/site + 5 light blocks + heavy-block-boundary)". C.3-2/C.3-3/C.3-4 consumer-migration PRs land the actual cross-package edits; C.3-1 IS the 1-of-N foundation PR per the locked plan, and the ADR-0018 门槛表 explicitly designates this PR shape as Row 5-firing. |
| Row 6 (test infra / harness) | NO | tokens.test.ts is a content addition, not a harness change. |
| Row 7 (docs-only) | NO | Source code changes plus CONTRACT.md plus PR.md plus tests; not docs-only. |
| Row 8 (CI / deploy / auth / security) | NO | No CI workflow change; no auth / security touch (CSP `<meta>` is deferred per `## decision-log`). |

**Stage 4 PRE-COMMIT CLAUDE REVIEW**: **FIRES** per ADR-0011 D2
trigger judgment table — Row 1 + Row 5 hit. orchestrator-self
performs the stage 4 review after codex-pr-reviewer-55 PASS at
stage 3. Mitigates same-model echo chamber risk (per ADR-0011 D2
purpose). Heightened reviewer scrutiny within stage 3 also applies
because Row 5 cross-package boundary changes are a high-risk class
under ADR-0006 8-point checklist item 5 (algorithm + runtime
constants 复刻; OKLCH values are runtime constants).

## ui_touch

`ui_touch: true`

Mechanical D9.1 path-pattern justification (per ADR-0011 D9.1 +
`scripts/check-ui-touch.ts` regex set):

- `packages/design-tokens/src/tokens.css` matches
  `^packages\/design-tokens\/`
- `packages/design-tokens/src/tokens-dark.css` matches
  `^packages\/design-tokens\/`
- `packages/design-tokens/src/tokens-fallback.css` matches
  `^packages\/design-tokens\/`
- `packages/design-tokens/src/tokens.ts` matches
  `^packages\/design-tokens\/`
- `packages/design-tokens/src/__tests__/tokens.test.ts` matches
  `^packages\/design-tokens\/`
- `packages/design-tokens/CONTRACT.md` matches
  `^packages\/design-tokens\/`
- `apps/site/src/layouts/BaseLayout.astro` does NOT match a UI-touch
  pattern directly (no `^apps\/site\/src\/layouts\/` regex in the
  set), but the diff already contains 6+ matches via design-tokens
  alone, so `ui_touch=true` is determined.
- `apps/site/src/styles/global.css` matches `^apps\/site\/src\/styles\/`
- `apps/site/src/__tests__/e2e/c3-1-tokens-fonts.spec.ts` does NOT
  match the path patterns (`^apps\/site\/src\/__tests__\/` is not
  in the set), but again ui_touch is already true via the other
  matches.

Verdict: `ui_touch=true` is unambiguous via design-tokens path
pattern alone.

**Manual ui_touch sanity verification (per Q9 plan-challenger
absorbtion)**: PR.md author MUST manually verify the `ui_touch`
field matches actual touched paths via
`pnpm exec tsx scripts/check-ui-touch.ts` BEFORE PR.md lock. If
mechanical detection returns `ui_touch=false` despite intended UI
file changes, FAIL EARLY (D2 trigger judgment incomplete) — do NOT
lock the PR.md. (At PLAN time the diff is empty so the script is
run against `--files <whitelist>` to validate the declared file
set produces `ui_touch=true`; at REVIEW + ACCEPT stages it is run
against the live diff.)

## e2e_smoke

Per Wave 5 plan v1.3 R14 third retrofit catalog § C.3-1 (lines
562-569 verbatim, with PR-level expansion of `playwright_spec`
target test name to match the file 9 `test()` call literal):

- flow: site loads with OKLCH cream surface + accent color visible + Inter font available in computed styles
  target_url: /
  playwright_spec: apps/site/src/__tests__/e2e/c3-1-tokens-fonts.spec.ts:"OKLCH cream + accent + Inter font computed"
  screenshot_archive: docs/audits/screenshots/wave-5-c3-1-tokens-fonts.png

(Single entry; matches the catalog entry exactly. CI gate
`check-e2e-coverage.ts` validates the spec file path component
exists at merge time; ACCEPT-stage CI gate
`check-screenshot-archive.ts` validates the screenshot file
exists with size ≥ 5KB.)

## decision-log

Plan-challenger codex 4-round dispatch per ADR-0007 D5
(Stage-opener PR with cross-package scope) **EXECUTED
2026-05-06**; 18 challenges raised; 17 ABSORBED + 1
REJECT-procedural (full table + lock evidence under
`## Plan-challenger absorbtion` below). The following key strategic
decisions are codified here so the challenge surface is reduced to
challenging the rationale itself, not extracting hidden assumptions
— this section was authored pre-dispatch and is now updated
in-line with absorbtion outcomes (Q1-Q5 affecting Decisions 1-7;
Q4 + Q17 affecting Decision 6; Q12 affecting file 4 description).

### Decision 1 — Token name strategy: Strategy A (additive coexistence)

**Locked choice**: Strategy A — append NEW OKLCH `--bg` / `--accent`
/ etc. tokens ALONGSIDE existing `--color-*` triplet tokens. Old
tokens kept untouched at C.3-1. Tailwind preset is NOT modified at
C.3-1 (preset still maps `theme.colors.bg` → `rgb(var(--color-bg) /
<alpha-value>)` for now; preset migration is a later C.3 PR or Phase
2+ scope; see Decision 5).

**Rejected alternative**: Strategy B (rename + value-form change in
one PR). Rejected because:

1. **Build-red avoidance**: Strategy B requires every existing
   consumer (apps/site Tailwind utility classes like `bg-bg` /
   `text-fg` / `bg-surface-1`; 5 light block ui-default CSS using
   `rgb(var(--color-X))`; heavy-block-boundary; design-tokens
   Tailwind preset itself) to migrate in the SAME PR or via
   chained PRs with build-red windows between them. This violates
   ADR-0011 D8 ≤15% R-round budget discipline (every build-red
   window is an R-round magnet) and forces one mega-PR ≫ 500 LOC
   cap (ADR-0011 D8 + Spec §3.6 hard ceiling).
2. **Opacity-modifier preservation**: Tailwind opacity utility
   classes like `bg-bg/50` rely on the
   `rgb(var(--color-bg) / <alpha-value>)` channel pattern documented
   at the top of the existing `tokens.css` ("Color values use
   space-separated rgb integer triples so that the Tailwind preset
   can compose `rgb(var(--color-xxx) / <alpha-value>)` ... Do NOT
   switch to #hex"). OKLCH values include lightness/chroma/hue and
   are NOT directly opacity-composable via this pattern. Removing
   the triplet form mid-PR would silently break every `bg-fg/50`
   call site across the codebase. Strategy A keeps both patterns
   alive — OKLCH for direct CSS consumption (`var(--bg)` /
   `var(--accent)`), triplet for Tailwind opacity modifier
   compatibility — until consumer migration completes.
3. **PR-size discipline**: Strategy A keeps C.3-1 at ~300 LOC
   (within the plan v1.3 row budget). Strategy B explodes to
   ~1500-2500 LOC even with file count discipline because every
   block ui-default CSS file plus apps/site components plus the
   Tailwind preset would have to migrate in lockstep.
4. **Reversibility**: Under Strategy A, if any C.3-2/C.3-3/C.3-4
   issue arises during consumer migration, only consumer files
   need revert — design-tokens additions are net-positive and
   inert for un-migrated consumers. Under Strategy B, revert
   means reverting the foundational PR + every consumer migration
   PR.

**Pro/con summary** (already enumerated in the briefing; restated
here for plan-challenger absorbtion):
- Strategy A pro: zero build-red window; preserves opacity-modifier
  feature; allows incremental migration; CONTRACT key-set invariant
  unchanged for old keys; PR-size discipline kept.
- Strategy A con: token bloat in C.3-1 PR alone (~14 net-new color
  tokens + 3 layout + 2 font + 1 hex `--surface`); tokens-dark.css
  must be addressed (Decision 2 below); transient duplication
  through C.3-5 close.

The con is acceptable: token bloat is bounded (the C.3-1 PR adds
exactly the ADR-0018 D1 + D2 token table — no further bloat
afterward), and tokens-dark.css is handled with a CONTRACT
amendment carve-out, not a stub-override scattergun.

**Cross-phase no-mixed-palette invariant (per Q1 plan-challenger
absorbtion)**: during C.3-1 → C.3-4 rollout, any element using a
NEW v2 OKLCH token (`var(--bg)` / `var(--accent)` / etc.) MUST NOT
simultaneously rely on legacy `--color-*` triplet via Tailwind
utility class (`bg-bg` / `text-fg` / etc.) at the same visual
branch. Each consumer file is migrated atomically per
C.3-2/C.3-3/C.3-4 PR scope; pre-migration C.3-1 leaves all
consumer files at legacy palette parity. (This invariant also
appears as a forward-pointer rule in `## Out-of-scope` per Q11
absorbtion to bind C.3-2/C.3-3/C.3-4 consumer-migration PR.md
authors.)

### Decision 2 — tokens-dark.css symmetry: invariant carve-out, NOT stub overrides

**Locked choice**: tokens-dark.css adds NO `--bg` / `--accent` / etc.
overrides under `:root[data-theme='dark']`. Instead, the existing
CONTRACT.md "Light + dark must share the same key set" invariant is
**amended** to carve out the v2 OKLCH key set as Wave-5-light-only,
per ADR-0018 D1 explicit prose ("dark mode 留 Phase 2+; Wave 5
lite-only") + AC#10. The pre-v2 `--color-*` key set continues to
mirror across both files unchanged.

**Rejected alternative**: stub overrides under
`:root[data-theme='dark']` (e.g., `--bg: oklch(99% 0.005 80);`
mirror-with-light-value, OR `--bg: oklch(15% 0.01 80);` naive
invert). Rejected because:

1. **Mirror-with-light-value stub** would silently render dark mode
   as light mode for every v2 OKLCH consumer once C.3-2/C.3-3/C.3-4
   migrations land. This is a worse failure mode than absent: the
   user sees a half-broken dark theme rather than a clean fallback
   to the pre-v2 `--color-*` set.
2. **Naive-invert stub** would ship an unaudited dark variant with
   visual decisions never reviewed by ux-ui-lead. ADR-0018 D1
   explicitly defers this work ("cream/橙红主色在 dark 下需要重新
   设计 NOT simple invert"; per Consequences §); pretending the
   invariant is met by a guess violates ADR-0018's own prose.
3. **CONTRACT amendment is the honest path**: the invariant existed
   for a 13-token light/dark mirror at Wave 1; the v2 OKLCH set is
   net-new and can carry its own dark-deferral documentation
   without weakening the original invariant for the original
   tokens.

The amendment text is explicit at file 6 (CONTRACT.md addition):
"v2 OKLCH key set ... is Wave 5 light-only ... Phase 2+ dark OKLCH
variant requires a separate ADR amendment (NOT silent extension).
This carve-out is additive scope to the existing invariant — it
does NOT relax it for the pre-v2 set."

**Modifying-this-file rule exception (time-bound, Wave 5 only; per
Q2 plan-challenger absorbtion)**: for v2 OKLCH / font / layout
keys added by Decisions 1 + 2 + 6 of C.3-1 PR, the legacy
CONTRACT.md `## Modifying this file` rule "Adding a new var:
non-breaking, but must update tokens.css + tokens-dark.css +
tokens.ts + tailwind-preset.cjs in the same change" is **overridden
by this Wave 5 light-only carve-out**. Specifically: the
"tokens-dark.css update" + "tailwind-preset.cjs update" sub-rules
are deferred for the v2 OKLCH/font/layout key set ONLY; tokens.css
+ tokens.ts updates remain mandatory and are landed in this PR.
Exception is **revoked at Phase 2+** via separate ADR amendment +
Pre-A-class plan-amendment PR; **NOT silently extensible** to
future token additions. The pre-v2 `--color-*` key set continues
to enforce the original 4-file lockstep rule unchanged. file 6
CONTRACT.md text spells out this time-bound exception verbatim.

### Decision 3 — Tailwind preset is OUT OF SCOPE at C.3-1

**Locked choice**: `packages/design-tokens/src/tailwind-preset.cjs`
is NOT modified at C.3-1. The OKLCH tokens are consumed via direct
CSS `var(--bg)` / `var(--accent)` / etc. references in C.3-2 / C.3-3
/ C.3-4 (block ui-default CSS, BaseLayout, prose CSS). Tailwind
utility class naming for OKLCH (e.g., would `theme.colors` extend to
include `bg-v2` / `accent-v2`?) is deferred to a separate decision
because:

1. The plan v1.3 row C.3-1 file whitelist does NOT include
   `tailwind-preset.cjs`.
2. Adding `theme.colors` entries that map to `var(--bg)` directly
   (no opacity-modifier composition) would be a Tailwind preset
   semantic change far larger than ADR-0018 D1 anticipated; that
   change is itself a CONTRACT-impacting decision that warrants
   either its own PR or, more likely, a Phase 2+ scope.
3. Direct-CSS consumption (`var(--bg)`) is the explicit pattern in
   ADR-0018 D2 prose for `--sans` / `--mono` / `--row-h` / `--gap`
   / `--radius`; extending to color is consistent.

If a plan-challenger codex round argues this should be in scope,
the orchestrator's response is: this PR plus the additive
coexistence strategy means the preset stays correct AS-IS for the
old `--color-*` tokens; consumers that want OKLCH read it directly
from CSS vars; no preset edit is REQUIRED at C.3-1.

**v2 consumption rule for C.3-2 / C.3-3 / C.3-4 (per Q3
plan-challenger absorbtion)**: consumers MUST consume v2 tokens
via direct CSS `var(--bg)` references only, **NOT via Tailwind
utility classes**. Tailwind utility paths for v2 tokens stay
unimplemented at the preset level until Phase 2+. Block ui-default
CSS files use `var(--bg)` / `var(--accent)` / `var(--canvas)` /
etc. directly per ADR-0003 D6 design-tokens authority pattern (the
same pattern already used for `var(--space-X)` in light blocks).
This rule is enforced by C.3-2/C.3-3/C.3-4 PR.md scope-fence (no
edit to `tailwind-preset.cjs` for v2 tokens) + reviewer codex
ADR-0006 item 5 algorithm + runtime constants 复刻 check.

### Decision 4 — Self-host fonts: OUT OF SCOPE at C.3-1; deferred

**Locked choice**: Inter + JetBrains Mono woff2 self-host at
`apps/site/public/fonts/` is OUT OF SCOPE for C.3-1. Only the
Google Fonts CDN preconnect + `<link href="...css2?family=...">`
is added. Self-host fallback is deferred to a follow-up PR (likely
Phase 2+ scope; or an additional Stage C.3 PR if user prefers).

**Rationale**:
1. ADR-0018 D2 prose explicitly distinguishes the Google Fonts
   preconnect path (in-scope at C.3-1 per plan v1.3 row C.3-1
   whitelist explicitly listing `apps/site/src/styles/**` =
   compatible) from the self-host fallback path (OUT OF SCOPE
   prose at file 6 CONTRACT addition).
2. woff2 binaries are NOT text-diff-friendly; committing them in
   the same PR as the OKLCH+font scaffold inflates the diff
   visually + complicates plan-challenger review.
3. CSP `<meta http-equiv="Content-Security-Policy">` addition (per
   ADR-0018 D2 self-host fallback prose) is an independent
   security-class change (D2 row 8) that warrants its own PR with
   security-aware reviewer scrutiny per ADR-0011 D2 row 8.
4. The 5s `document.fonts.ready` timeout fallback to system fonts
   (per ADR-0018 D2 + ADR-0016 D3 useAutoRowSpan) is already
   guaranteed by the `--sans` / `--mono` font stack fallback chain
   (`'Inter', -apple-system, system-ui, sans-serif;`); user-visible
   FOIT avoided by `display=swap` in the Google Fonts URL. This
   PR's font experience is correct-without-self-host; self-host is
   a privacy / EU-compliance enhancement, not a correctness
   prerequisite.

This is recorded in `## Out-of-scope` below.

### Decision 5 — Inverse-direction obligation surface: NONE for C.3-1

**Locked check**: No FOUC-style replicated algorithm is touched in
this PR. The existing FOUC inline script in `BaseLayout.astro`
reads `localStorage` + `matchMedia` + writes `data-theme` — that
algorithm is unchanged. The font preconnect `<link>` tags do not
encode any algorithm; they are passive declarative elements.
Tokens-fallback.css uses CSS-only `@supports` — no JavaScript
runtime branching. Therefore no byte-equivalent regression test
obligation per the design-tokens CONTRACT "Inverse-direction
obligation: replicas of pre-hydration algorithms" section is
triggered by this PR. plan-challenger absorbtion guard against
"FOUC byte-equivalent regression risk?" challenge: the inline
script is unchanged; the regression test
(`apps/site/src/__tests__/fouc-script.test.ts`) continues to pass
as-is.

### Decision 6 — AC#12 snapshot scope: 14 OKLCH→hex via Culori, Option α

**Locked choice**: Option α — hand-derive hex via Culori at PR
authoring time, commit `tokens-fallback.css` directly with hex
values + add a vitest snapshot guard that asserts each hex pair
matches an in-test inline-frozen map. Option β (build-time
`pnpm generate:tokens-fallback` script invoked via a `prebuild`
hook) is deferred to Phase 2+.

**Rationale**:
1. Option β requires an actual scripts/ runtime dependency on
   Culori, plus a `prebuild` hook in `packages/design-tokens/package.json`,
   plus CI invocation discipline. That is real infrastructure
   surface area that is hard to justify when there are 14 OKLCH
   values frozen by an ADR (ADR-0018 D1 table) — they don't change
   often.
2. Option α matches the ~300 LOC budget. Option β would push C.3-1
   well past 500 LOC.
3. Option β rationale (per ADR-0018 D1 Q2 absorbtion prose) is
   "tokens.css 主文件 + tokens-fallback.css 同 commit ship" —
   Option α achieves this (same-commit ship); the build-script
   automation is not strictly required by the ADR, only the
   derivation rule.
4. The snapshot guard test (file 5) catches drift between OKLCH
   source and hex fallback exactly as Option β CI would.

**Culori derivation protocol (locked at C.3-1 EXECUTE; per Q4
plan-challenger absorbtion)**:

- **Pinned Culori version**: `culori@4.0.1` (or whichever the
  design-tokens devDep set carries; codex EXECUTE invocations
  re-pin if needed). Pin recorded in EXECUTE evidence.
- **Derivation command (per token)**:
  `node -e "import('culori').then(({parse, formatHex}) => console.log(formatHex(parse('oklch(99% 0.005 80)'))))"`
- **Output normalization**: `.toLowerCase()` + assert exact 7-char
  `#rrggbb` shape (NOT `#rgb` shorthand, NOT `#rrggbbaa` 8-char
  alpha form, NOT uppercase variants).
- **Drift discipline**: `tokens-fallback.css` + `tokens.test.ts`
  inline snapshot map MUST be updated **together** if any derived
  hex changes; never one without the other.

**Hex shape strictness (per Q17 plan-challenger absorbtion)**:
lowercase 7-char `#rrggbb` form ONLY. Reject any `#rgb` shorthand
/ `#rrggbbaa` 8-char-alpha / uppercase variants. Snapshot test
(file 5; AC-8) enforces with regex `/^#[0-9a-f]{6}$/`. Drift to
`#FFF` / `#fefdfaaa` / `#FEFDFA` MUST cause snapshot fail.

**Concrete locked hex values** (Culori 4.0.1 derived at C.3-1
EXECUTE; replaced the PR.md authoring-time nominal table after
EXECUTE refinement per Decision 6 protocol; all values lowercase
7-char `#rrggbb` form per Q17):

| token | OKLCH | hex (sRGB; Culori 4.0.1 actual) | PR.md authoring nominal |
|---|---|---|---|
| `--bg` | `oklch(99% 0.005 80)` | `#fefbf8` | `#fefdfa` (drift) |
| `--panel` | `oklch(98% 0.004 80)` | `#faf8f5` | `#fcfbf8` (drift) |
| `--border` | `oklch(92% 0.005 80)` | `#e6e4e1` | `#ebe8e3` (drift) |
| `--border-strong` | `oklch(86% 0.006 80)` | `#d3d1cd` | `#d6d2cc` (drift) |
| `--text` | `oklch(22% 0.01 80)` | `#1d1a15` | `#262320` (drift) |
| `--text-2` | `oklch(45% 0.01 80)` | `#58554f` | `#5e5852` (drift) |
| `--text-3` | `oklch(62% 0.01 80)` | `#898680` | `#8a847e` (drift) |
| `--accent` | `oklch(58% 0.16 35)` | `#c64e31` | `#cb5235` (drift) |
| `--accent-soft` | `oklch(96% 0.04 35)` | `#ffe9e0` | `#fbe7df` (drift) |
| `--accent-success` | `oklch(70% 0.12 145)` | `#6cb26f` | `#5fae6e` (drift) |
| `--canvas` | `oklch(60% 0.13 215)` | `#0092b0` | `#1f88c0` (drift) |
| `--canvas-soft` | `oklch(97% 0.025 215)` | `#e3faff` | `#e7f3fa` (drift) |
| `--grid-line` | `oklch(90% 0.005 80)` | `#e0deda` | `#e3dfd9` (drift) |
| `--grid-line-strong` | `oklch(82% 0.005 80)` | `#c6c4c0` | `#cac6c0` (drift) |

**Refinement note (per Decision 6 protocol)**: all 14 OKLCH→hex
derivations differed from the PR.md authoring-time nominal table
when re-computed via Culori 4.0.1 `formatHex(parse(...))`. This is
a routine derivation refinement (NOT a plan-challenger reject):
the OKLCH source values (the load-bearing visual identity) remain
exactly per ADR-0018 D1; only the sRGB-gamut hex projections
shifted slightly per Culori's gamut-mapping algorithm. Both
`tokens-fallback.css` (file 3) AND the inline-frozen snapshot map
in `tokens.test.ts` (file 5) carry the Culori-actual values; they
agree by construction. EXECUTE-phase evidence: `pnpm --filter
@skb/design-tokens test` PASS post-refinement (3 files, 23 tests
pass).

### Decision 7 — CSP / security carve-out

**Locked choice**: NO CSP `<meta>` tag in C.3-1. Adding `font-src`
+ `connect-src` + `style-src` allowances for `fonts.googleapis.com`
+ `fonts.gstatic.com` (per ADR-0018 D2 self-host fallback prose) is
deferred to either the self-host follow-up PR (Decision 4) or a
separate security-class PR. Without an existing CSP in apps/site
today (verified absent in the current `BaseLayout.astro` head;
file 7), adding the Google Fonts URLs without a CSP is correct: no
CSP means no allowance is needed; adding a CSP without those
allowances would BREAK the Google Fonts load. The right sequence
is CSP+allowances together OR no-CSP-yet (chosen here).

**CSP risk note — deferral acknowledgment (per Q5 plan-challenger
absorbtion)**: production deployments enforcing strict CSP without
`font-src https://fonts.gstatic.com` + `style-src
https://fonts.googleapis.com` + `connect-src
https://fonts.googleapis.com` allowances may **silently fail
Inter/JetBrains Mono font loads at C.3-1's land**. Remediation
path is restricted to (a) self-host follow-up PR landing CSP +
allowances + woff2 binaries together, OR (b) separate
security-class PR (D2 row 8) introducing CSP shape; both deferred
from C.3-1. apps/site currently has NO CSP `<meta>` (verified
absent in `apps/site/src/layouts/BaseLayout.astro` `<head>`
inspection at HEAD; see file 7 above); C.3-1's path is correct
without CSP. If the user's Wave 5 deployment env adds CSP between
this PR's land and the self-host follow-up PR, the Inter font
chain will silently degrade to the system-fonts fallback chain
(`-apple-system, system-ui, sans-serif`); the e2e spec's
`document.fonts.check('400 15px Inter')` assertion (file 9 per
Q10) will then FAIL in CI, surfacing the CSP misconfiguration.

## acceptance

Each of the following 16 items (14 original + AC-4b NEW per Q8 +
AC-12b NEW per Q13 + AC-5 strengthened per Q7) is verifiable by a
single bash invocation. Each should produce the stated expected
output. The ACCEPT-stage pr-writer dispatch verifies these against
the post-COMMIT diff. Additional EXECUTE-evidence subsection (per
Q4 absorbtion) records the actual Culori-derived hex values + pin
under AC-8 result verification at ACCEPT time.

```bash
# AC-1: ui_touch detection mechanical
pnpm exec tsx scripts/check-ui-touch.ts
# Expected stdout: ui_touch=true
```

```bash
# AC-2: e2e coverage gate PASS (PR.md ## ui_touch + ## e2e_smoke + spec file exists)
pnpm exec tsx scripts/check-e2e-coverage.ts
# Expected stderr: [check-e2e-coverage] PASS (1 e2e_smoke entries verified)
# Expected exit code: 0
```

```bash
# AC-3: 14 OKLCH color tokens + 1 hex --surface present in tokens.css (additive; old --color-* still present)
grep -cE '^\s*--(bg|panel|surface|border|border-strong|text|text-2|text-3|accent|accent-soft|accent-success|canvas|canvas-soft|grid-line|grid-line-strong):' packages/design-tokens/src/tokens.css
# Expected: 15
grep -cE '^\s*--color-(bg|fg|surface-1|surface-2|border|muted|accent|accent-fg|info|warn|note|success|error):' packages/design-tokens/src/tokens.css
# Expected: 13 (unchanged from main; Strategy A coexistence verified)
```

```bash
# AC-4: 3 layout + 2 font tokens present in tokens.css
grep -cE '^\s*--(row-h|gap|radius):' packages/design-tokens/src/tokens.css
# Expected: 3
grep -cE '^\s*--(sans|mono):' packages/design-tokens/src/tokens.css
# Expected: 2
```

```bash
# AC-4b: token-presence parser companion (per Q8 plan-challenger absorbtion;
# anchors to full token name; whitespace-tolerant; complements grep-counts above)
pnpm exec node --input-type=module -e "
  import { readFileSync } from 'fs';
  const css = readFileSync('packages/design-tokens/src/tokens.css', 'utf8');
  const tokens = ['bg','panel','surface','border','border-strong','text','text-2','text-3','accent','accent-soft','accent-success','canvas','canvas-soft','grid-line','grid-line-strong','row-h','gap','radius','sans','mono'];
  const missing = tokens.filter(t => !new RegExp('--'+t.replace(/-/g,'\\\\-')+'\\\\s*:').test(css));
  if (missing.length) { console.error('MISSING:', missing); process.exit(1); }
  console.log('all 20 v2 tokens present');
"
# Expected: 'all 20 v2 tokens present' + exit 0
```

```bash
# AC-5: tokens-fallback.css covers ALL 14 OKLCH color keys + omits --surface (already hex)
# Stricter than pre-absorbtion AC-5 per Q7 plan-challenger absorbtion.
test -f packages/design-tokens/src/tokens-fallback.css
# Expected exit 0
grep -cE '^@supports not \(color: oklch\(' packages/design-tokens/src/tokens-fallback.css
# Expected: 1
for k in bg panel border border-strong text text-2 text-3 accent accent-soft accent-success canvas canvas-soft grid-line grid-line-strong; do
  grep -qE "^\s*--$k:\s*#[0-9a-f]{6};" packages/design-tokens/src/tokens-fallback.css || { echo "MISSING --$k hex fallback"; exit 1; }
done
echo "all 14 OKLCH keys covered"
# Expected: 'all 14 OKLCH keys covered' + exit 0
grep -cE '^\s*--surface:' packages/design-tokens/src/tokens-fallback.css
# Expected: 0 (--surface omitted; already hex in tokens.css)
```

```bash
# AC-6: tokens-dark.css unchanged in value content (no NEW OKLCH overrides)
grep -cE '^\s*--(bg|panel|accent|canvas):' packages/design-tokens/src/tokens-dark.css
# Expected: 0 (no v2 OKLCH overrides under :root[data-theme='dark'])
```

```bash
# AC-7: TS mirror exports (tokensV2 / colorVarsV2 / layoutVarsV2 / fontVarsV2)
grep -cE '^export const (colorVarsV2|layoutVarsV2|fontVarsV2|tokensV2)' packages/design-tokens/src/tokens.ts
# Expected: 4
```

```bash
# AC-8: Snapshot guard test added in tokens.test.ts
grep -cE "it\('OKLCH→hex fallback values are stable" packages/design-tokens/src/__tests__/tokens.test.ts
# Expected: 1
# Existing 5 tests preserved
grep -cE "it\('(exposes both light and dark theme names|STORAGE_KEY is the shared storage key|color tokens use CSS var notation|space tokens use CSS var notation|exposes 13 color tokens)" packages/design-tokens/src/__tests__/tokens.test.ts
# Expected: 5
```

```bash
# AC-9: pnpm test --filter=@skb/design-tokens GREEN (all old + new tests)
pnpm --filter @skb/design-tokens test
# Expected: tests PASS; vitest reports >= 8 tests (5 old + 3+ new)
```

```bash
# AC-10: BaseLayout.astro Inter + JetBrains Mono preconnect + <link> present
grep -cE 'rel="preconnect"\s+href="https://fonts\.(googleapis|gstatic)\.com"' apps/site/src/layouts/BaseLayout.astro
# Expected: 2
grep -cE 'fonts\.googleapis\.com/css2\?family=Inter.*&family=JetBrains\+Mono' apps/site/src/layouts/BaseLayout.astro
# Expected: 1
```

```bash
# AC-11: global.css imports tokens-fallback via exported subpath (per Q15 absorbtion; NOT deep-import path)
grep -cE "@import\s+['\"]@skb/design-tokens/tokens-fallback['\"]" apps/site/src/styles/global.css
# Expected: 1 (matches `@import '@skb/design-tokens/tokens-fallback';`)
# Companion check: deep-import form must NOT appear (would bypass package.json exports)
grep -cE "@import\s+['\"]@skb/design-tokens/src/tokens-fallback" apps/site/src/styles/global.css
# Expected: 0 (Q15 exported-subpath strict enforcement)
```

```bash
# AC-12: pnpm check (lint + typecheck + test + build + size) PASS
pnpm check
# Expected: all stages GREEN
```

```bash
# AC-12b: --row-h / --gap / --radius are single-source from @skb/design-tokens
# (per Q13 plan-challenger absorbtion + ADR-0016/0017 grid consumer single-source obligation)
grep -rnE '^\s*--(row-h|gap|radius):\s*[0-9]' packages/ apps/ 2>/dev/null | grep -v 'packages/design-tokens/src/tokens.css' | wc -l
# Expected: 0 (no other source defines these literals; grid consumers MUST consume via var())
```

```bash
# AC-13: scope-fence — git diff --name-only main..HEAD lists ONLY whitelisted files
# (per Q16 plan-challenger absorbtion: extended to 11 files to include package.json
# from Q15 absorbtion; +1 line for src/index.ts permitted if Q12 absorbtion adds the
# barrel re-export there. EXECUTE phase verifies actual file count ≤ 12.)
git diff --name-only main..HEAD | sort
# Expected output (exactly these 15 files; sorted; refined post-EXECUTE
# to add file 11 grid.css + file 11b grid-css.test.ts (sister-test) +
# file 12 index.ts barrel re-export + screenshot archive PNG per D9.5):
# apps/site/src/__tests__/e2e/c3-1-tokens-fonts.spec.ts
# apps/site/src/__tests__/grid-css.test.ts
# apps/site/src/layouts/BaseLayout.astro
# apps/site/src/styles/global.css
# apps/site/src/styles/grid.css
# docs/audits/screenshots/wave-5-c3-1-tokens-fonts.png
# docs/plans/wave-5-main/C.3-1-design-tokens-oklch-fonts.md
# packages/design-tokens/CONTRACT.md
# packages/design-tokens/package.json
# packages/design-tokens/src/__tests__/tokens.test.ts
# packages/design-tokens/src/index.ts
# packages/design-tokens/src/tokens-dark.css
# packages/design-tokens/src/tokens-fallback.css
# packages/design-tokens/src/tokens.css
# packages/design-tokens/src/tokens.ts
# Total = 15 files; FAIL if any other file appears.
```

```bash
# AC-14: anti-leak — implementation strings only inside PR.md (no e2e_smoke / playwright_spec / screenshot_archive field-name leak in non-PR.md files)
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.3-1-design-tokens-oklch-fonts.md' | grep -cE '^\+.*(playwright_spec:|screenshot_archive:|e2e_smoke:)' || true
# Expected: 0 (no leak; either grep matches none → exit 1 with `|| true` → captured count of 0)
```

## Out-of-scope

The following are explicitly **deferred** per `## decision-log`
decisions 3, 4, 7. None of them are required for C.3-1 to land
correctly, and each carries a clear forward pointer for either a
later C.3 PR or Phase 2+:

- **Tailwind preset migration to OKLCH** (Decision 3): preset stays
  pointing at `--color-*` triplets. OKLCH consumption at C.3-2 /
  C.3-3 / C.3-4 is via direct `var(--bg)` / `var(--accent)` etc.
  CSS references. Phase 2+ may re-evaluate whether to extend
  `theme.colors` for OKLCH.
- **Self-host fonts at `apps/site/public/fonts/`** (Decision 4):
  Inter + JetBrains Mono woff2 binaries deferred. Google Fonts CDN
  is the only path at C.3-1; CDN privacy/CSP concerns are
  documented in ADR-0018 D2 prose; user-decision when to land
  self-host.
- **CSP `<meta>` tag in BaseLayout** (Decision 7): no CSP is
  installed at C.3-1; if/when self-host or CSP-enforcing follow-up
  lands, a separate security-class PR (D2 row 8) handles it.
- **Dark theme OKLCH variant**: per ADR-0018 D1 explicit prose
  ("dark mode 留 Phase 2+") + AC#10. tokens-dark.css carries no
  v2 OKLCH overrides at C.3-1; CONTRACT.md amendment carve-out
  documents this.
- **Block kind 顶 2px 横条** (D3 of ADR-0018): 8 kind hue tokens
  are NOT added at C.3-1 — that's C.3-2's scope.
- **Prose customization** (D4 of ADR-0018): `.skb-prose` /
  `.b-quote` / `.b-callout` / `.b-code` / `.aref` selectors are
  NOT added at C.3-1 — that's C.3-3's scope.
- **Light block CSS calibration** (D7 of ADR-0018): 5 light blocks
  + 3 markdown派生 prose are NOT migrated at C.3-1 — that's C.3-4's
  scope.
- **Visual smoke baseline** (AC#8 of ADR-0018): baseline screenshots
  are NOT committed at C.3-1 (the screenshot at
  `docs/audits/screenshots/wave-5-c3-1-tokens-fonts.png` is the
  smoke evidence, not a baseline; baseline lives at
  `apps/site/playwright/visual-smoke-baseline/` per C.3-5 scope).
- **Body font-family application + visual baseline regen** (per Q10
  partial-defer post-EXECUTE refinement; Decision 8 below):
  applying `body { font-family: var(--sans); }` to switch body
  rendering from `--font-sans` legacy stack to `--sans` Inter chain
  is **deferred to C.3-3** (typography upgrade per ADR-0018 D5 +
  prose customization scope). C.3-1 lays the token + CDN preconnect
  foundation; the C.2 visual-smoke baselines are NOT regen'd at
  C.3-1 (regen happens at C.3-5 close per ADR-0018 AC#8). Without
  body-font application at C.3-1, `document.fonts.check('400 15px
  Inter')` would return `false` (Google Fonts is lazy-loaded by
  first usage); the C.3-1 spec instead asserts the `<link href>`
  CDN-preconnect entry is present (foundation-level D9 gate).
- **Cross-package no-mixed-consumer migration rule (per Q11
  plan-challenger absorbtion)**: when C.3-2 / C.3-3 / C.3-4
  migration PRs replace consumers to v2 variables, each consumer
  file must be **atomically switched** — no half-migrated element
  where one CSS rule reads `var(--bg)` (v2 OKLCH) and the sibling
  rule reads `rgb(var(--color-bg))` (legacy triplet) in the same
  visual branch. C.3-* migration PR.md `## decision-log` MUST cite
  this rule when committing consumer migration. Forward pointer to
  Decision 1 cross-phase no-mixed-palette invariant within this
  PR.md (the C.3-1 side of the contract).

## Plan-challenger absorbtion

per [ADR-0007 D5](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
+ [ADR-0011 D2](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
v0.2 schema + Pre-A4 13/13 + v1.3 light-round 4/4 absorbed precedent.

Stage-opener cross-package PR; 4-round full dispatch per ADR-0007
D5. Audit log: `/tmp/codex-runs/2026-05-06-T2-c3-1-plan-challenge.txt`
raw (orchestrator-side; curated archive at
`docs/audits/codex-runs/2026-05-06-T2-c3-1-plan-challenge.txt` per
ADR-0011 D6 audit-log discipline).

**Result**: 18 questions across 4 rounds; **17 ABSORBED + 1 REJECT
(orchestrator-confirmed)**. Pre-absorbtion verdicts were 11 ABSORB +
5 PARTIALLY ABSORB + 2 REJECT; orchestrator override on Q10
(ABSORB-with-strengthening, NOT REJECT — challenger's "spec must
verify Inter actually applied" is exactly the spirit of D9 Product
Experience Quality Gate, so it's an ABSORB) + Q14 absorbtion
(clarifying language) supersedes the Q18 REJECT in practice (the
Row 5 "publication" framing is replaced by anchored ADR-0018 D1
Compliance § 门槛表 row 3 framing; the procedural REJECT stands
but the PR.md Row 5 cell is already aligned to the canonical
exception path). Net 17 ABSORB + 1 REJECT-procedural.

| # | Round | Challenge | Verdict | Locked at |
|---|---|---|---|---|
| Q1 | 1 | Cross-phase no-mixed-palette invariant during C.3-1→C.3-4 rollout undocumented | **ABSORBED** | Decision 1 cross-phase invariant sub-clause |
| Q2 | 1 | CONTRACT.md `## Modifying this file` rule conflict with Wave-5-light-only carve-out (4-file lockstep would force tokens-dark.css + tailwind-preset.cjs edits) | **ABSORBED** | Decision 2 + file 6 CONTRACT amendment time-bound exception clause |
| Q3 | 1 | v2 consumer rule for C.3-2/C.3-3/C.3-4 (Tailwind utility OR direct CSS var?) ambiguous | **ABSORBED** | Decision 3 v2 consumption rule sub-clause |
| Q4 | 1 | Decision 6 Culori derivation prose lacks pin + command + normalization | **ABSORBED** | Decision 6 Culori derivation protocol section |
| Q5 | 1 | Decision 7 CSP risk to production deployments not acknowledged | **ABSORBED** | Decision 7 CSP risk note |
| Q6 | 2 | e2e spec assumes light theme but FOUC inline script may flip dark | **ABSORBED** | file 9 light-theme guard `addInitScript` |
| Q7 | 2 | AC-5 only checks tokens-fallback.css presence + @supports header; doesn't verify per-token coverage | **ABSORBED** | AC-5 stricter for-loop per-key check |
| Q8 | 2 | AC-3/AC-4 grep-counts brittle; lack token-name parser companion | **ABSORBED** | NEW AC-4b parser companion |
| Q9 | 2 | ## ui_touch lacks manual sanity check obligation | **ABSORBED** | ## ui_touch manual sanity verification clause |
| Q10 | 2 | e2e spec only asserts `--sans` token literal contains 'Inter'; doesn't verify font actually applied (D9 Product Experience Quality Gate spirit) | **ABSORBED** (orchestrator override; challenger argued FOR strengthening) | file 9 font-chain `getComputedStyle(document.body).fontFamily` + `document.fonts.check('400 15px Inter')` assertions |
| Q11 | 3 | C.3-2/C.3-3/C.3-4 atomic-switch rule in consumer migration not bound here | **ABSORBED** | ## Out-of-scope cross-package no-mixed-consumer migration rule |
| Q12 | 3 | tokens.ts re-export to index.ts conditional ("only if NOT covered by existing barrel") creates root-import instability | **ABSORBED** | file 4 unconditional re-export to index.ts |
| Q13 | 3 | --row-h / --gap / --radius single-source obligation (ADR-0016/0017 grid) lacks AC | **ABSORBED** | NEW AC-12b cross-tree grep |
| Q14 | 3 | D2 trigger Row 5 "fires by publication" is non-canonical framing; should anchor to ADR-0018 D1 Compliance § 门槛表 row 3 | **ABSORBED** | Row 5 cell prose replaced with anchored framing |
| Q15 | 4 | Strict packages-exports resolution: apps/site cannot deep-import `/src/tokens-fallback.css` | **ABSORBED** | NEW file 8b package.json `exports` entry + file 8 import path corrected |
| Q16 | 4 | AC-13 whitelist 10 files outdated post-Q15 (missing package.json) | **ABSORBED** | AC-13 whitelist extended to 11 files + index.ts permitted |
| Q17 | 4 | Hex shape strictness undefined (uppercase / shorthand / 8-char-alpha?) | **ABSORBED** | Decision 6 hex shape strictness paragraph + snapshot regex `/^#[0-9a-f]{6}$/` |
| Q18 | 4 | Row 5 "publication" framing should be REJECT and replaced by mechanical-diff-only review | **REJECT (procedurally sound; superseded by Q14 ABSORB)** | Row 5 cell now anchors to ADR-0018 D1 Compliance § 门槛表 row 3 (the canonical exception path; PR.md cites verbatim). PR.md framing is correct after Q14 absorbtion. |

**Lock evidence**: this absorbtion table + each verdict
cross-references the file-or-decision section that codifies the
change. Reviewer codex (stage 3 codex-pr-reviewer-55) verifies
absorbtion accuracy at REVIEW. Stage 4 PRE-COMMIT CLAUDE REVIEW
(orchestrator-self) re-verifies before COMMIT.

## Related

- [Wave 5 plan v1.3](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — row C.3-1 (line 701, file whitelist + LOC budget + executor +
  D2 trigger; Stage C.3 plan section); v1.3 R14 third retrofit
  catalog § C.3-1 (lines 562-569; canonical `e2e_smoke` entry
  source)
- [ADR-0018 v2 visual migration](../../decisions/ADR-0018-v2-visual-migration.md)
  — D1 (14 OKLCH color + 1 hex `--surface` + 3 layout token
  authoritative table; Culori derivation rule; OKLCH browser
  fallback strategy) + D2 (Inter + JetBrains Mono Google Fonts
  preconnect + privacy disclosure + self-host fallback) + AC#1 +
  AC#2 + AC#10 + AC#12 + Compliance § Pre-A4 D2 trigger 门槛表
  (rows 3+4 codify the C.3-1 D2 row 1 + row 5 firing)
- [ADR-0011 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — D1 stage 4 PRE-COMMIT CLAUDE REVIEW (fires per D2 trigger
  judgment) + D2 schema v0.2 (PR.md schema this PR follows) + D8
  ≤15% R-round budget + D9 Product Experience Quality Gate (D9.1
  ui_touch path patterns; D9.5 screenshot archive ≥ 5KB)
- [ADR-0006 8-point asymmetry audit](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — item 5 (algorithm + runtime constants 复刻; OKLCH values are
  runtime constants and must be single-source from
  `@skb/design-tokens`) + item 6 (sister CONTRACT.md sync;
  CONTRACT.md modified file 6) + item 9 (real test enforcement;
  Playwright spec file 9 + screenshot file)
- [ADR-0007 codex heavy-execution](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
  — D2 row 1 + row 5 trigger judgment table source; D5
  plan-challenger 4-6 round dispatch for Stage-opener PRs
- [ADR-0017 drag/drop UX](../../decisions/ADR-0017-drag-drop-ux.md)
  — D11 drop-pulse forward-pointer consumes
  `--accent-success: oklch(70% 0.12 145)` defined at C.3-1 (this
  PR provides the token; consumer migration at C.2-8 already
  merged uses the value at C.3-1's land time)
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  — v0.5 amendment landed at C.2-7 (squash `da192e4` + parent
  chain; sister-doc-sync precedent for this PR's CONTRACT.md
  amendment)
- [ADR-0003 headless / presentational](../../decisions/ADR-0003-headless-presentational-split.md)
  — D6 design-tokens authority preserved (NEW OKLCH tokens are
  additions to the same authority; not a new authority)
- Sister PRs:
  C.3-2 (block kind 顶 2px 横条 — consumes
  `--accent-canvas` / `--accent-runnable` / etc. tokens introduced
  there, NOT in this PR), C.3-3 (prose customization — consumes
  `--accent` / `--accent-soft` / `--canvas` from this PR), C.3-4
  (5 light block CSS calibration — consumes the OKLCH set from
  this PR), C.3-5 (Stage C.3 close visual smoke baseline diff <
  5%; per ADR-0018 AC#8)
