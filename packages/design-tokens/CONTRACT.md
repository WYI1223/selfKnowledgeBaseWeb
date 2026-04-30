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

## Consumer rules

- **Hydration**: `useTheme` and `ThemeToggle` MUST be used inside a client-only Astro island (`client:load` minimum). The hook reads `window.matchMedia` and `window.localStorage` at first render — passive SSR markup is fine, but island hydration directive must be `client:load` or stricter.
- **FOUC bridge** (apps/site responsibility): the BaseLayout `<script is:inline>` in `<head>` must (a) read `localStorage.getItem('skb-theme')` literally, (b) fall back to `matchMedia('(prefers-color-scheme: dark)').matches`, and (c) set `data-theme="dark"` on `<html>` accordingly — **before** any React island hydrates. The inline script must NOT write localStorage.

## Modifying this file

- Adding a new var: non-breaking, but must update tokens.css + tokens-dark.css + tokens.ts + tailwind-preset.cjs in the same change.
- Renaming or repurposing an existing var (semantic redefinition): contract break — requires an ADR plus a notification to all consuming packages.
- Adding a new theme beyond light/dark (e.g. sepia, high-contrast): requires an ADR; `STORAGE_KEY` value type expands; downstream FOUC scripts must handle the new value.
- Renaming or removing any exported function/component: contract break — requires an ADR. (Pre-Wave-1 the only such rename was `applyTheme` → `applyThemeDOM` to enforce the persistence-coupled-to-manual-action invariant; package had no external consumers.)

## Related

- [ADR-0003 headless / presentational split](../../docs/decisions/ADR-0003-headless-presentational-split.md) — D6 (manual-only persistence)
- [Design spec §1.5 / §2.5 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- `../block-foundation/CONTRACT.md` — block UI registration depends on this preset
- `../../apps/site/CONTRACT.md` — FOUC inline script literal sync constraint
