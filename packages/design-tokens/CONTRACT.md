# @skb/design-tokens Contract

## Public surface

- `tokens.css` — `:root` light theme CSS variables (default)
- `tokens-dark.css` — `:root[data-theme="dark"]` overrides
- `tailwind-preset` — Tailwind 3.x preset (color / spacing / typography / radius / shadow / motion); ships with a `.d.cts` so consumers' tsconfig (strict, no `allowJs`) can `import preset from '@skb/design-tokens/tailwind-preset'` without `// @ts-ignore`
- `tokens` / `colorVars` / `spaceVars` — TS mirrors for CSS-in-JS / programmatic access
- `useTheme` — React hook returning `{ theme, setTheme, toggle }`
- `getInitialTheme` — pure derivation of the boot theme (localStorage > `prefers-color-scheme` > `'light'`)
- `applyThemeDOM(theme)` — DOM-only, idempotent. Sets / clears `data-theme="dark"` on `<html>`. **Does NOT touch localStorage.** Safe to call from inline FOUC scripts and on every effect tick.
- `STORAGE_KEY` — `'skb-theme'`; the localStorage key shared with the inline FOUC script
- `ThemeToggle` — default switch button component
- `themeNames` / `ThemeName` / `UseThemeResult` — type-level surface

## Invariants (ADR-0003)

- **CSS var names are stable**: consumers (apps/site, every block ui-default) depend on the literal var names; renaming is a contract break and requires an ADR.
- **Light + dark must share the same key set**: only values may differ. Adding a new var REQUIRES adding it to both files at the same time.
- **`STORAGE_KEY` is shared with apps/site BaseLayout**: the inline FOUC `<script>` reads `'skb-theme'` literally; any rename must update both packages in the same PR.
- **Tailwind preset is the single source of truth**: `apps/site` and every `block-*/ui-default/` MUST consume this preset. Hand-rolling `theme.colors` or hard-coding color / spacing / typography values is rejected by `pr-gate`.
- **Persistence is coupled to manual user action only** (ADR-0003 D6): `useTheme`'s mount effect calls `applyThemeDOM` only — it never writes localStorage. Persistence happens in `setTheme` / `toggle`. This preserves the property "system OS theme change is reflected on next visit unless the user has explicitly chosen a theme."

## Inverse-direction obligation: replicas of pre-hydration algorithms

Some algorithms in this package must be replicated in inline code that runs **before any module loads** (e.g. an Astro `<script is:inline>` in `<head>` that prevents FOUC), and therefore cannot import from `@skb/design-tokens`. Those replicas carry an inverse-direction obligation: the authority lives here, but the correctness contract binds every consumer that ships its own copy.

**Currently in scope**: `getInitialTheme()` in `src/use-theme.ts` (the boot-theme derivation: localStorage → `prefers-color-scheme` → `'light'` default).

Any consumer that replicates this algorithm in inline code MUST be byte-equivalent to the authority in BOTH happy-path AND exception handling:

1. **Strict-whitelist saved value**: only `saved === 'light' || saved === 'dark'` honors the stored value; anything else falls through to `matchMedia('(prefers-color-scheme: dark)')`. A truthy-coerce check (e.g. `saved ? saved === 'dark' : ...`) diverges for invalid / case-mismatched / legacy localStorage values and produces a hydration flash on first paint.
2. **Narrow `try/catch` scope**: the `try/catch` MUST wrap ONLY the `localStorage.getItem` call. `matchMedia` + DOM apply MUST run AFTER the catch handler. A wide-scope `try/catch` swallows the `matchMedia` path on Safari Private Mode / iOS WebView with storage restrictions / browsers with localStorage disabled — producing light when system pref is dark, i.e. hydration flash.
3. **Hardcoded storage key literal**: replicas hardcode `'skb-theme'` (the value of `STORAGE_KEY` in `src/use-theme.ts`) because they cannot import the constant at FOUC-script time. Renaming `STORAGE_KEY` is a contract break that requires updating every replica in the same PR.

**Required regression test**: every consumer with an inline replica MUST register a test that asserts byte-equivalence against the authority. Template: `apps/site/src/__tests__/fouc-script.test.ts` — extracts the IIFE from the consumer file, evaluates it via `new Function('localStorage', 'window', 'document', iife)` against parametrized fakes, compares output against `getInitialTheme()` for a 16-row saved-value × system-preference corpus + 2 storage-throws × system-preference rows + 1 truthy-coerce regression assertion (20 tests total). The two storage-throws rows are critical: the saved-value corpus alone passes under a wide-scope `try/catch`.

**Failure mode reference**: Track A v1 review caught happy-path divergence (truthy-coerce); v2 fixed (1) but kept wide-scope `try/catch`; v3 fixed (2). Both v1 and v2 would have shipped visible hydration flash without pr-gate's catch.

**Current consumers**: `apps/site` (Wave 1, `src/layouts/BaseLayout.astro`). Wave 2+ consumers (e.g. additional Astro apps, future open-source `apps/demo`) MUST follow this template.

## Consumer rules

- **Hydration**: `useTheme` and `ThemeToggle` MUST be used inside a client-only Astro island (`client:load` minimum). The hook reads `window.matchMedia` and `window.localStorage` at first render — passive SSR markup is fine, but island hydration directive must be `client:load` or stricter.
- **FOUC bridge** (apps/site responsibility): the BaseLayout `<script is:inline>` in `<head>` must read `localStorage.getItem('skb-theme')` literally, fall back to `matchMedia('(prefers-color-scheme: dark)').matches`, and set `data-theme="dark"` on `<html>` accordingly — **before** any React island hydrates. The inline script must NOT write localStorage. The detailed correctness obligation (algorithm + try/catch scope + literal sync + required regression test) is enumerated in the **Inverse-direction obligation** section above.

### `block-*/ui-default/` consumer norms (Wave 2, anchored by `block-callout` C2)

These norms apply to every `packages/block-*/src/ui-default/` consumer. The
first consumer (`@skb/block-callout/ui-default/`) is the canonical template;
codex-block-generator clones must preserve them.

- **No hardcoded color literals**: every `color`, `background-color`, `border-color`
  in `*.css` MUST resolve via `rgb(var(--color-X))` or `rgb(var(--color-X) / <alpha>)`.
  No `#hex`, no named colors, no `rgb(<numeric-triple>)`. `pr-gate` greps for
  these in `packages/block-*/src/ui-default/*.css` and rejects.
- **No inline `style={{ … }}` for variant colors**: happy-dom (used by `vitest run`)
  rejects `rgb(var(--color-…))` in inline styles and silently drops the attribute,
  which would mask real visual regressions. Variant colors MUST live in `*.css`,
  selected by `[data-<block>-variant="…"]` on a stable container element. Inline
  `style` is allowed only for layout-time computed values (e.g., a known px width).
- **Type-only `@skb/design-tokens` import satisfies ADR-0008 D1**: `block-*/ui-default/`
  packages typically don't need `colorVars` / `tokens` at runtime (CSS does the var
  resolution). To keep `@skb/design-tokens` as a real `package.json#dependencies` entry
  (per ADR-0008 D1), import the `ColorTokenName` type to constrain the variant→token
  mapping (see `block-callout/src/ui-default/variant-tokens.ts`). The lexical
  `from '@skb/design-tokens'` in source is what the structure-auditor monthly grep
  detects; type-only imports under `verbatimModuleSyntax: true` count.
- **Tailwind preset is consumed at app-build, not block-build**: `block-*` packages
  don't compile Tailwind themselves; `apps/site` (and any future Astro/Next consumer)
  loads `@skb/design-tokens/tailwind-preset` and JIT-compiles the class names that
  `block-*/ui-default/` Components emit. Block packages MAY emit Tailwind utility
  classes (e.g., `mt-1`, `flex`) but those classes resolve correctly only when the
  consumer's Tailwind config extends from this preset. For visual rules that must
  work outside Tailwind (e.g., editor-shell standalone preview), put them in the
  block's own `*.css` file with explicit `var(--space-X)` references.
- **Required CSS import path**: each `block-*` package exposes its CSS via
  `package.json#exports['./ui-default/<block>.css']`. App entry MUST import each block's
  CSS once at boot (next to design-tokens' `tokens.css` + `tokens-dark.css`).
- **No emoji as icons**: `VARIANT_ICONS` (or equivalent) MUST be hand-traced SVGs at
  consistent stroke width (1.5–2px) and consistent viewBox (`24 24`). Mixing
  filled/outlined or different stroke widths violates ui-ux-pro-max
  `no-emoji-icons` + `stroke-consistency` + `icon-style-consistent` rules.
- **A11y on the variant container**: emit `role="note"` (or appropriate landmark),
  `aria-label="<Variant> <block>"`, `tabindex="0"` so the block participates in
  keyboard nav. `:focus-visible` styles in `*.css` MUST use `outline` (not
  `box-shadow` — `outline` survives `forced-colors` mode).
- **Light + dark parity**: any color expression MUST resolve correctly under both
  themes via the design-tokens var system. No theme-specific class branches in
  `block-*/ui-default/`; if a token doesn't exist in both themes, propose adding
  it to `tokens.css` + `tokens-dark.css` per "Modifying this file" below.
- **Reduced-motion**: any `transition` / `animation` MUST be wrapped in
  `@media (prefers-reduced-motion: no-preference) { … }` (see callout.css Wave 2 pattern).

## Modifying this file

- Adding a new var: non-breaking, but must update tokens.css + tokens-dark.css + tokens.ts + tailwind-preset.cjs in the same change.
- Renaming or repurposing an existing var (semantic redefinition): contract break — requires an ADR plus a notification to all consuming packages.
- Adding a new theme beyond light/dark (e.g. sepia, high-contrast): requires an ADR; `STORAGE_KEY` value type expands; downstream FOUC scripts must handle the new value.
- Renaming or removing any exported function/component: contract break — requires an ADR. (Pre-Wave-1 the only such rename was `applyTheme` → `applyThemeDOM` to enforce the persistence-coupled-to-manual-action invariant; package had no external consumers.)

## v2 visual tokens (ADR-0018 D1+D2)

The v2 surface adds 14 OKLCH color tokens: `--bg`, `--panel`, `--border`,
`--border-strong`, `--text`, `--text-2`, `--text-3`, `--accent`,
`--accent-soft`, `--accent-success`, `--canvas`, `--canvas-soft`,
`--grid-line`, and `--grid-line-strong`.

It also adds one hex surface token (`--surface`), three layout tokens
(`--row-h`, `--gap`, `--radius`), and two font tokens (`--sans`, `--mono`).
The OKLCH fallback authority is Culori `formatHex(parse(oklchValue))`, pinned
to `culori@4.0.1` for C.3-1 Option alpha offline derivation.

### Block kind hue tokens (ADR-0018 D3)

C.3-2 adds eight light-theme kind hue tokens for top-stripe visual
identification: `--accent-canvas`, `--accent-runnable`, `--accent-image`,
`--accent-math`, `--accent-pdf`, `--accent-jupyter`, `--accent-nn-viz`, and
`--accent-agent-flow`. `--accent-canvas` is value-equivalent to `--canvas` but
keeps the kind-hue token family consistently namespaced.

These tokens follow the Wave 5 light-only carve-out: `tokens-dark.css` MUST NOT
add dark overrides for `--accent-<kind>` during Wave 5. Phase 2+ dark OKLCH
variants require a separate ADR amendment.

### Typography tokens (ADR-0018 D5)

C.3-3 adds eighteen light-theme typography tokens: `--font-size-body`,
`--font-size-h1`, `--font-size-h2`, `--font-size-h3`, `--font-size-b-p`,
`--font-size-b-code`, `--font-weight-body`, `--font-weight-h1`,
`--font-weight-h2`, `--font-weight-h3`, `--line-height-body`,
`--line-height-h1`, `--line-height-h2`, `--line-height-h3`,
`--line-height-b-p`, `--line-height-b-code`, `--letter-spacing-h1`, and
`--letter-spacing-h2`.

These tokens are additive v2 visual tokens and follow the Wave 5 light-only
carve-out: `tokens-dark.css` MUST NOT add silent dark overrides for them during
Wave 5. Consumers must use these CSS variables rather than hardcoded prose
typography values.

### Light + dark key-set invariant — Wave 5 light-only carve-out

The v2 OKLCH, layout, and font key set is Wave 5 light-only per ADR-0018 D1
and AC#10. `tokens-dark.css` must not add silent v2 dark values during Wave 5;
Phase 2+ dark OKLCH variants require a separate ADR amendment. This carve-out
does not relax the pre-v2 `--color-*` invariant, which continues to require
matching light and dark key sets.

### Modifying-this-file rule exception (time-bound, Wave 5 only)

For the v2 OKLCH, font, and layout keys added by C.3-1, the usual "adding a
new var" sub-rules requiring `tokens-dark.css` value additions and
`tailwind-preset.cjs` updates are overridden by the Wave 5 light-only
carve-out. `tokens.css` and `tokens.ts` updates remain mandatory. This
exception is revoked at Phase 2+ through a separate ADR amendment and is not
silently extensible to future token additions.

## Inter + JetBrains Mono Google Fonts (ADR-0018 D2)

`apps/site/src/layouts/BaseLayout.astro` owns the Google Fonts resource hints:
preconnects for `https://fonts.googleapis.com` and `https://fonts.gstatic.com`,
plus the stylesheet URL for Inter weights 400, 500, 600, 650, 700 and
JetBrains Mono weights 400, 500, 600. Self-hosted files under
`apps/site/public/fonts/` are out of scope for C.3-1 and require a separate PR.

## Related

- [ADR-0003 headless / presentational split](../../docs/decisions/ADR-0003-headless-presentational-split.md) — D6 (manual-only persistence)
- [Design spec §1.5 / §2.5 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- `../block-foundation/CONTRACT.md` — block UI registration depends on this preset
- `../../apps/site/CONTRACT.md` — FOUC inline script literal sync constraint
