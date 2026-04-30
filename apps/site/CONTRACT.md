# apps/site Contract

## Public surface

- Routes:
  - `/` — notes index
  - `/notes/<slug>` — rendered note
- Content collection schema: `src/content.config.ts` imports `frontmatterSchema` from `@skb/content-types`. apps/site MUST NOT redefine the schema inline (single-authority rule per `packages/content-types/CONTRACT.md`).
- Theme: light / dark, controlled via `<html data-theme="dark">`. Persistent toggle button in the top-right corner of every page.

## Invariants

- **Static build only** (spec §1.8 constraint #3): the project must not introduce SSR; `astro build` outputs prerendered HTML.
- **Default zero JavaScript** (Astro islands): only components annotated with `client:*` hydrate. Wave 1 ships exactly one island, `ThemeToggle (client:load)`.
- **No hand-rolled visual values** (ADR-0003 / spec §2.6 invariant #5): `tailwind.config.ts` MUST consume `@skb/design-tokens/tailwind-preset` via `presets: [...]`. Hard-coded `#hex`, `rgb(...)`, or pixel literals in any source file under `src/` are rejected by `pr-gate`.
- **FOUC inline script ↔ design-tokens `STORAGE_KEY` literal sync**: the inline `<script is:inline>` in `BaseLayout.astro` reads `localStorage.getItem('skb-theme')` literally. The design-tokens package owns the canonical `STORAGE_KEY = 'skb-theme'` constant; renaming it requires updating BOTH packages in the same PR. The inline script cannot import the constant — it must run before any module loads to prevent FOUC.
- **FOUC inline script must NOT write localStorage** (ADR-0003 D6): the script only reads + applies. Writes are reserved for manual user action via `useTheme.setTheme` / `toggle`. This preserves the property "system OS theme change is reflected on next visit unless the user has explicitly chosen a theme."
- **FOUC boot-theme algorithm MUST be byte-equivalent to `getInitialTheme()`** from `@skb/design-tokens` in BOTH happy-path AND exception handling:
  1. STRICT-whitelist saved value (`saved === 'light' || saved === 'dark'`); fall through to `matchMedia('(prefers-color-scheme: dark)')` otherwise. A truthy-coerce check (e.g. `saved ? saved === 'dark' : ...`) diverges for invalid / case-mismatched / legacy localStorage values and produces a hydration flash on first paint.
  2. The `try/catch` MUST wrap ONLY the `localStorage.getItem` call. `matchMedia` + DOM apply MUST run AFTER the catch handler. A wide-scope `try/catch` swallows the `matchMedia` path on Safari Private Mode / iOS WebView with storage restrictions / browsers with localStorage disabled — producing light when system pref is dark, i.e. a hydration flash.
  Both rules are enforced by `src/__tests__/fouc-script.test.ts`, which extracts the IIFE from `BaseLayout.astro` and asserts equivalence against `getInitialTheme()` for a 16-row saved-value × system-preference corpus + 2 storage-throws × system-preference rows + an explicit truthy-coerce regression assertion.
- **Content frontmatter schema is owned by `@skb/content-types`**: apps/site imports `frontmatterSchema` and uses it directly in `defineCollection`. Inline schema redefinition is a contract break (content-types CONTRACT.md single-authority invariant). When the schema needs new optional fields, update `@skb/content-types` and let it propagate.

## Modifying this file

Update this file when changing route structure, content frontmatter shape, build output format, or the theme-control mechanism. Any modification to this file triggers `pr-gate` 5.5 review (CONTRACT.md is a high-risk surface per the agent-contract).

## Related

- [Design spec §1.1 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [ADR-0003 headless / presentational split](../../docs/decisions/ADR-0003-headless-presentational-split.md) — D5 (light + dark Phase 1) / D6 (manual-only persistence)
- [@skb/design-tokens contract](../../packages/design-tokens/CONTRACT.md)
- [agent-contract.md `editor-integrator`](../../agent-contract.md)
