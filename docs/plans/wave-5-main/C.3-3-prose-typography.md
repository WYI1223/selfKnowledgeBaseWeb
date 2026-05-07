# C.3-3 — prose customization (.skb-prose namespace + b-quote/b-callout/b-code/aref) + typography CSS vars

> **Wave 5 Stage C.3 3rd implementation PR** of the locked 5-PR sequence
> (per Wave 5 plan v1.3 row C.3-3, line 703; v1.3 R14 retrofit
> catalog § C.3-3 lines 580-587). Lands the **ADR-0018 D4 prose
> customization** + **D5 typography upgrade**: `.skb-prose
> b-quote / b-callout / b-code / aref` selectors (markdown prose
> namespace, mutually exclusive with `.skb-block.callout` /
> `.skb-block.code` component-block selectors per Q5 absorbtion);
> 18 typography tokens (`--font-size-*` + `--font-weight-*` +
> `--line-height-*` + `--letter-spacing-*`); body `font-family:
> var(--sans)` rule application (deferred from C.3-1 Q10 partial-defer).
> Strategy A coexistence continues. **PRE-COMMIT CLAUDE REVIEW
> (D1 stage 4) FIRES** per `## D2 trigger judgment` (Row 1
> CONTRACT.md change in `@skb/design-tokens` + Row 5 cross-package).

## title

Land ADR-0018 D4 prose customization (`apps/site/src/styles/prose.css`
NEW with `.skb-prose b-quote / b-callout / b-code / b-code .kw .fn .cm /
aref + .aref::before / mark / inline code` selectors per Q5 namespace
isolation) + ADR-0018 D5 typography upgrade (`@skb/design-tokens`
adds 18 NEW `--font-size-* / --font-weight-* / --line-height-* /
--letter-spacing-*` tokens per Q6 single-source rule). apps/site
`global.css` adds `body { font-family: var(--sans); ... }` rule
plus prose.css import via BaseLayout. Sister-doc-sync
`packages/design-tokens/CONTRACT.md` adding `### Typography tokens
(ADR-0018 D5)` section. Land Playwright spec at
`apps/site/src/__tests__/e2e/c3-3-prose.spec.ts` covering b-quote
/ b-callout / b-code / aref affordance distinct rendering on
`/sample-blocks`.

## files

13-15 files modified/created (~250 LOC budget per plan v1.3 row
C.3-3):

1. `packages/design-tokens/src/tokens.css` — **MODIFY** (~35 LOC).
   Append `/* === v2 typography tokens (ADR-0018 D5) === */`
   section: 6 `--font-size-*` (body / h1 / h2 / h3 / b-p / b-code) +
   4 `--font-weight-*` (body / h1 / h2 / h3) + 6 `--line-height-*`
   (body / h1 / h2 / h3 / b-p / b-code) + 2 `--letter-spacing-*`
   (h1 / h2). Existing `--text-base` + `--leading-base` legacy tokens
   UNCHANGED (Strategy A coexistence).

2. `packages/design-tokens/src/tokens.ts` — **MODIFY** (~20 LOC).
   Append `typographyVarsV2` mirror with 18 typography token entries
   (camelCase keys). Update `tokensV2` composite to include
   `typography: typographyVarsV2`. Add `TypographyTokenNameV2` type.
   Re-export from `index.ts`.

3. `packages/design-tokens/src/index.ts` — **MODIFY** (~3 LOC).
   Append `typographyVarsV2` + `TypographyTokenNameV2` to v2 barrel.

4. `packages/design-tokens/src/__tests__/tokens.test.ts` — **MODIFY**
   (~15 LOC). Add 1 NEW test: `it('exposes 18 v2 typography
   tokens')`: assert `Object.keys(tokensV2.typography).length === 18`
   + each key resolves to correct `var(--<token>)` literal. Existing
   tests preserved.

5. `packages/design-tokens/CONTRACT.md` — **MODIFY** (~12 LOC).
   Append NEW `### Typography tokens (ADR-0018 D5)` section under
   `## v2 visual tokens` parent. Document 18 typography tokens +
   light-only carve-out continued.

6. `apps/site/src/styles/prose.css` — **NEW** (~80 LOC). Per
   ADR-0018 D4 verbatim:
   ```
   .skb-prose .b-quote { border-left: 3px solid var(--accent); ... }
   .skb-prose .b-callout { background: oklch(97% 0.018 90); ... }
   .skb-prose .b-code { background: oklch(97% 0.005 80); ... font-family: var(--mono); ... }
   .skb-prose .b-code .kw { color: oklch(45% 0.18 280); }
   .skb-prose .b-code .fn { color: oklch(45% 0.13 215); }
   .skb-prose .b-code .cm { color: oklch(45% 0.10 145); font-style: italic; }
   .skb-prose .aref { display: inline-flex; ... background: var(--canvas-soft); }
   .skb-prose .aref::before { content: '↗'; ... }
   .skb-prose mark { background: oklch(94% 0.08 90); ... }
   .skb-prose code:not(pre code) { background: oklch(95% 0.005 80); font-family: var(--mono); ... }
   ```
   `.skb-prose` namespace per Q5 isolation discipline.

7. `apps/site/src/styles/global.css` — **MODIFY** (~25 LOC).
   - Add `@import './prose.css';` after the existing
     `@import '@skb/design-tokens/...'` block.
   - Add typography rules consuming D5 tokens:
     ```
     body {
       font-family: var(--sans);
       font-size: var(--font-size-body);
       line-height: var(--line-height-body);
       font-weight: var(--font-weight-body);
     }
     h1 { font-size: var(--font-size-h1); line-height: var(--line-height-h1); font-weight: var(--font-weight-h1); letter-spacing: var(--letter-spacing-h1); }
     h2 { font-size: var(--font-size-h2); line-height: var(--line-height-h2); font-weight: var(--font-weight-h2); letter-spacing: var(--letter-spacing-h2); }
     h3 { font-size: var(--font-size-h3); line-height: var(--line-height-h3); font-weight: var(--font-weight-h3); }
     pre, code, kbd, samp { font-family: var(--mono); }
     ```
   This applies the deferred Q10 from C.3-1 (body font-family
   application). Visual-smoke baselines WILL diff — regen at C.3-5.

8. `apps/site/src/layouts/BaseLayout.astro` — **MODIFY** (~1 LOC).
   Remove `font-sans` Tailwind class from body `<body>` element
   (so the C.3-3 `body { font-family: var(--sans); }` rule wins
   without specificity competition). Body class becomes `bg-bg
   text-fg`.

9. `apps/site/src/__tests__/e2e/c3-3-prose.spec.ts` — **NEW**
   (~80 LOC). Playwright spec navigating to `/sample-blocks` (or
   fallback `/notes/sample-blocks`):
   - Light-theme guard via addInitScript (per C.3-1 Q6 pattern)
   - Assert `getComputedStyle(body).fontFamily` contains `Inter`
     (Q10 from C.3-1 fully landed at C.3-3)
   - Assert `getComputedStyle(body).fontSize` resolves to `15px`
   - Assert `document.fonts.check('400 15px Inter')` returns `true`
     (Inter actually rendered + CDN fetched per body usage)
   - For each of `b-quote` / `b-callout` / `b-code` / `aref`
     class containers (created via `page.evaluate()` injecting
     test markup if `/sample-blocks` doesn't have all 4):
     - Verify computed styles per ADR-0018 D4 spec (background /
       border / padding / font-family for b-code / aref
       background)
   - Take screenshot to
     `docs/audits/screenshots/wave-5-c3-3-prose.png` (D9.5; ≥5KB)

10. `docs/plans/wave-5-main/C.3-3-prose-typography.md` — **NEW**
    (PR.md self).

11. `docs/audits/screenshots/wave-5-c3-3-prose.png` — **NEW**.

12. `apps/site/playwright/visual-smoke-baseline/wave-5-c2-baseline-sample-blocks-{notes,astro}.png`
    — **MODIFY** (regen due to typography upgrade visual change;
    Q11 cross-phase no-mixed-consumer migration: consumer atomic
    switch acceptable; baselines regen at C.3-3 because the
    typography change is uniformly applied site-wide). EXECUTE-time
    Playwright run regenerates these.

**Total LOC delta**: ~250 LOC (+ binary regenerations).

## D2 trigger judgment

Row 1 (CONTRACT.md change in @skb/design-tokens) + Row 5 (cross-package: design-tokens + apps/site).

**Stage 4 PRE-COMMIT CLAUDE REVIEW**: **FIRES** per Row 1+5.

## ui_touch

`true` — `packages/design-tokens/**` + `apps/site/src/styles/**` +
`apps/site/src/layouts/**` matches.

## e2e_smoke

Per v1.3 R14 catalog § C.3-3 (lines 580-587):

- flow: .skb-prose namespace renders b-quote / b-callout / b-code / aref affordances (each component-block prose affordance distinct per Q5 prose customization) + body font-family Inter applied + body font-size 15px
  target_url: /sample-blocks
  playwright_spec: apps/site/src/__tests__/e2e/c3-3-prose.spec.ts:".skb-prose b-quote/b-callout/b-code/aref affordances + body Inter+15px"
  screenshot_archive: docs/audits/screenshots/wave-5-c3-3-prose.png

## decision-log

### Decision 1 — Q10 from C.3-1 fully lands at C.3-3

Per C.3-1 Out-of-scope: "body font-family application + visual
baseline regen → C.3-3 typography upgrade scope". C.3-3 is the
canonical PR for this. Body font-family rule + font-size + h1/h2/h3
typography rules land here. Visual-smoke baselines regen as part
of C.3-3 (acknowledged baseline diff per Q11 atomic-consumer-switch
rule).

### Decision 2 — `.skb-prose` namespace strict

Per ADR-0018 D4 + Q5 absorbtion: all `b-*` selectors require
`.skb-prose` parent. Component blocks (`.skb-block.callout` etc.)
do NOT collide. apps/site/components.ts may need to wrap `<Content
components={...} />` in `<div class="skb-prose">` (delegated to
EXECUTE phase if needed).

### Decision 3 — Typography upgrade additive

Existing `--text-base` + `--leading-base` legacy tokens kept; NEW
`--font-size-body` etc. tokens added. Strategy A coexistence
continues. Pre-v2 consumers (e.g., Tailwind preset `theme.fontSize`)
unchanged.

### Decision 4 — visual-smoke baseline regen at C.3-3

C.3-1 deferred body font application + baseline regen to C.3-3.
C.3-2 added 5 light block top-borders (visual change but minor;
baselines regen at C.3-5). C.3-3 applies typography uniformly →
body font (Inter) + size (15px) + h1-h3 rules cover all pages.
Baseline regen NOW makes more sense than at C.3-5 because typography
is the larger visual delta. C.3-5 then handles 5 light block CSS
calibration (D7) baseline + visual smoke diff verification.

## acceptance

```bash
# AC-1: ui_touch + e2e-coverage gates PASS
pnpm exec tsx scripts/check-ui-touch.ts
pnpm exec tsx scripts/check-e2e-coverage.ts
# Expected: ui_touch=true + e2e PASS
```

```bash
# AC-2: 18 typography tokens in tokens.css
grep -cE '^\s*--(font-size|font-weight|line-height|letter-spacing)-' packages/design-tokens/src/tokens.css
# Expected: 18
```

```bash
# AC-3: prose.css NEW with .skb-prose selectors
test -f apps/site/src/styles/prose.css
grep -cE '\.skb-prose \.b-(quote|callout|code|code \.kw|code \.fn|code \.cm)' apps/site/src/styles/prose.css
# Expected: ≥6 (matches 6 selector forms)
grep -cE '\.skb-prose \.aref' apps/site/src/styles/prose.css
# Expected: ≥1
```

```bash
# AC-4: global.css applies body font-family + sizes
grep -cE 'body\s*\{[^}]*font-family:\s*var\(--sans\)' apps/site/src/styles/global.css
# Expected: 1
grep -cE 'body\s*\{[^}]*font-size:\s*var\(--font-size-body\)' apps/site/src/styles/global.css
# Expected: 1
```

```bash
# AC-5: BaseLayout body class no longer has 'font-sans' Tailwind utility
grep -cE 'class="bg-bg text-fg font-sans"' apps/site/src/layouts/BaseLayout.astro
# Expected: 0
grep -cE 'class="bg-bg text-fg"' apps/site/src/layouts/BaseLayout.astro
# Expected: 1
```

```bash
# AC-6: design-tokens 26 tests pass (25 + 1 NEW)
pnpm --filter @skb/design-tokens test 2>&1 | grep 'Tests'
# Expected: contains '26 passed'
```

```bash
# AC-7: pnpm check exit 0
pnpm check
```

```bash
# AC-8: scope-fence — 13-15 files (incl. PR.md + screenshot + 2 baselines)
git diff --name-only main..HEAD | sort
# Expected (13-15 files; +baselines if regen)
```

```bash
# AC-9: anti-leak (char-class [:] per C.3-1 fix)
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.3-3-prose-typography.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **5 light block CSS calibration** (D7 of ADR-0018): defer to C.3-4
  (replace hex/RGB/HSL → OKLCH in 5 light block ui-default CSS;
  shadow rgba(20,15,10) refresh).
- **Stage C.3 close visual smoke baseline diff < 5%** (AC#8): defer
  to C.3-5 (verify total typography + light-block calibration
  visual-smoke diff against newly-regened baselines from C.3-3).
- **Tailwind preset typography migration**: continues out-of-scope
  per C.3-1 Decision 3 (preset stays at legacy `theme.fontSize`).
  Direct CSS-var consumption in global.css is the C.3-3 pattern.

## Related

- [Wave 5 plan v1.3 row C.3-3](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) line 703
- [ADR-0018 D4 prose customization + D5 typography](../../decisions/ADR-0018-v2-visual-migration.md)
- [C.3-1 PR.md Q10 partial-defer](C.3-1-design-tokens-oklch-fonts.md)
- [C.3-2 PR.md Strategy A continued](C.3-2-block-kind-hues.md)
- Sister PRs: C.3-4 (5 light block CSS calibration; D7), C.3-5 (Stage C.3 close visual smoke baseline)
