# apps/site Contract

## Public surface

- Routes:
  - `/` — notes index
  - `/notes/<slug>` — rendered note
- MDX component blocks: `src/components.ts` exports `componentsMap`, the static-site
  PascalCase MDX tag map consumed by note pages.
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
- **Component-block rendering**: MDX component blocks are wired only through
  `componentsMap` in `src/components.ts`, and `pages/notes/[...slug].astro`
  passes that map per page via `<Content components={componentsMap} />`.
  The map must expose exactly the 8 canonical PascalCase keys `Callout`,
  `Code`, `Image`, `Math`, `Pdf`, `Jupyter`, `NnViz`, and `AgentFlow`.
  Values must be the corresponding block package `*RenderView` exports,
  never `*EditorView`, because apps/site is a read-only static renderer.
- **Chunking strategy / heavy-block taxonomy**: `src/components.ts` keeps the
  5 light blocks (`Callout`, `Code`, `Image`, `Math`, `Pdf`) eager-imported
  because their default render surfaces are small and shared by common prose
  routes. The 3 heavy blocks (`Jupyter` with Pyodide at roughly 10 MB,
  `NnViz` with TF.js at roughly 3 MB, and `AgentFlow` with React Flow at
  roughly 500 KB) must stay behind per-call-site
  `await import('@skb/block-*/ui-default')` boundaries in `components.ts`.
  `astro.config.mjs` pins those heavy imports with Rollup `manualChunks`
  names (`block-jupyter`, `block-nn-viz`, `block-agent-flow`) for stable
  debug and regression-test filenames; the hint is not the correctness layer.
  `src/__tests__/lazy-chunking.test.ts` is the locking bundle-grep
  regression: prose-only route chunks must not contain `pyodide`,
  `tensorflow`, or `reactflow`, and the 3 heavy chunks must remain distinct.

## Modifying this file

Update this file when changing route structure, content frontmatter shape, build output format, or the theme-control mechanism. Any modification to this file triggers `pr-gate` 5.5 review (CONTRACT.md is a high-risk surface per the agent-contract).

## Related

- [Design spec §1.1 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [ADR-0003 headless / presentational split](../../docs/decisions/ADR-0003-headless-presentational-split.md) — D5 (light + dark Phase 1) / D6 (manual-only persistence)
- [@skb/block-agent-flow contract](../../packages/block-agent-flow/CONTRACT.md)
- [@skb/block-callout contract](../../packages/block-callout/CONTRACT.md)
- [@skb/block-code contract](../../packages/block-code/CONTRACT.md)
- [@skb/block-image contract](../../packages/block-image/CONTRACT.md)
- [@skb/block-jupyter contract](../../packages/block-jupyter/CONTRACT.md)
- [@skb/block-math contract](../../packages/block-math/CONTRACT.md)
- [@skb/block-nn-viz contract](../../packages/block-nn-viz/CONTRACT.md)
- [@skb/block-pdf contract](../../packages/block-pdf/CONTRACT.md)
- [@skb/design-tokens contract](../../packages/design-tokens/CONTRACT.md)
- [agent-contract.md `editor-integrator`](../../agent-contract.md)
