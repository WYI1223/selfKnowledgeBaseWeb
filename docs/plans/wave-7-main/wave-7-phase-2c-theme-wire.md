# Wave 7 Phase 2C — `@skb/grid-themes` editor wire (foundation)

> Mounts the theme switcher + cssVar injection layer in the editor
> per [ADR-0020](../../decisions/ADR-0020-grid-engine-contract.md)
> D7-D9. Foundation only — full `theme.renderBlock` chrome
> integration + `useProjectGridStyleToOuter` removal are deferred to
> a follow-up alongside the absolute-positioning layout migration.

## title

Wire `@skb/grid-themes` into `EditorShellMountInner` so the user can
switch themes (`graph-paper` / `lego-studs` default / `bento-canvas`)
via the floating chip, with persistence (localStorage), frontmatter
precedence, and theme cssVars injected on the `.skb-grid` element.
Visible diff: switching theme changes the baseplate background color
(`--skb-baseplate-bg`). Block chrome stays on the v2 token contract
(ADR-0018) pending the follow-up.

## files

### Editor-shell

- `packages/editor-shell/src/use-theme.ts` — NEW (60 LOC)
  - `useTheme({ frontmatterTheme? })` → `{ themeKey, theme, setTheme }`
  - Wraps `@skb/grid-themes` resolveTheme / getTheme / setUserTheme
  - State held in React; setTheme persists to localStorage
- `packages/editor-shell/src/grid-container.tsx` —
  - Add `'data-skb-theme'` prop (passes through to root div)
- `packages/editor-shell/src/index.ts` —
  - Export `useTheme`, `DEFAULT_THEME`, `UseThemeOptions`,
    `UseThemeReturn`, `ThemeKey`, `GridTheme`
- `packages/editor-shell/package.json` — add `@skb/grid-themes` dep
- `packages/editor-shell/tsconfig.json` — add grid-themes reference

### Apps/site

- `apps/site/package.json` — add `@skb/grid-themes` dep
- `apps/site/src/components/EditorShellMountInner.tsx` —
  - Import `useTheme` + `ThemeSwitcher`
  - Resolve theme; pass `style={theme.cssVars}` + `data-skb-theme`
    to `<GridContainer>`
  - Mount `<ThemeSwitcher current={themeKey} onChange={setTheme} />`
    at editor root
  - Compacted some pre-existing comment blocks to stay under
    500-LOC size-check (size went 495 → 504 → 492 after trim)
- `apps/site/src/styles/grid.css` —
  - NEW rule `.skb-grid[data-skb-theme]` applying
    `background-color: var(--skb-baseplate-bg, transparent)`
  - Fallback gates the rule under the data attr so non-themed paths
    (read route, SSR pre-hydration) render identically to pre-2C

### Tests

- `packages/editor-shell/src/__tests__/use-theme.test.tsx` — NEW (6 tests)
  - ADR-0020 D8 precedence (frontmatter > localStorage > default)
  - setTheme persists + state updates + theme object switches
  - Invalid frontmatter fallthrough
- `packages/editor-shell/src/__tests__/grid-container.test.tsx` —
  - 3 new tests for the `data-skb-theme` attribute + cssVar style
    forwarding

## ui_touch

`true` — `packages/editor-shell/src/` + `apps/site/src/styles/` +
`apps/site/src/components/` paths matched. User-visible diff:
- New floating ThemeSwitcher chip bottom-right of `/notes/<slug>/edit`
  (dev mode always; prod fold rule hides for new users with no stored
  theme).
- Switching theme via the chip updates `.skb-grid`'s background color
  (lego-studs warm beige / graph-paper near-white / bento-canvas
  transparent).
- No block chrome change (deferred).

## e2e_smoke

- flow: cf-25 markdown-block presence + read/edit parity still pass
  (baseplate change is additive; block chrome unchanged).
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts
  assertions:
    - markdown block count ≥ 1; data-skb-block-kind="markdown" present
    - cf-25 structural specs still PASS

- flow: theme switcher mounts + data-skb-theme attribute reaches the
  grid element.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-edit-loads.spec.ts
  assertions:
    - `.skb-grid[data-skb-theme="lego-studs"]` present after mount
    - default theme is lego-studs

## Acceptance

executor: orchestrator-self (additive theme wire; no codex needed)
reviewer: CI gates (lint + typecheck + test + build + size-check +
lychee + e2e-coverage)
contract_changes:
  - NEW `@skb/editor-shell` exports: `useTheme`, `DEFAULT_THEME`,
    `UseThemeOptions`, `UseThemeReturn`, `ThemeKey`, `GridTheme`
  - `GridContainer` accepts `'data-skb-theme'` prop
  - NEW workspace dep wires: `editor-shell` + `apps/site` → `@skb/grid-themes`
new_adr: NONE — ADR-0020 D7-D9 already locks the theme contract
risk_class: D2 row 1 (cross-module contract addition). The wire is
additive; baseplate color rule is gated under `[data-skb-theme]` so
non-themed paths are unchanged. PRE-COMMIT CLAUDE REVIEW skipped per
bootstrap-scope rule.

## Out of scope (deferred to a follow-up)

- Replacing block chrome with `theme.renderBlock` (touches every
  block's visual; requires absolute-positioning layout model
  migration — same magnitude as Phase 2B)
- Rendering the per-theme baseplate pattern via `theme.renderBaseplate`
  (stud-dot for lego-studs, dotted for graph-paper, blank for
  bento-canvas) — needs a positioned-absolute baseplate layer under
  `.skb-grid` content
- Removing `useProjectGridStyleToOuter` (structurally necessary
  under CSS Grid; eliminated only when the layout switches to
  absolute-positioning per theme.renderBlock)
- Per-doc MDX frontmatter `theme:` reader wiring (the useTheme hook
  accepts frontmatterTheme but the apps/site mount doesn't yet
  thread the parsed frontmatter through)
- Fresh Playwright drag-UX coverage for the hole-fill placement
  (deferred to Phase 3 cleanup PR alongside the prototype delete)

## Process

1. ✓ Phase 2B.1/2B.2 merged — the engine + adapter contract is stable
2. ✓ `useTheme` hook wraps grid-themes resolve + storage
3. ✓ GridContainer extended with `data-skb-theme` pass-through
4. ✓ EditorShellMountInner reads theme, passes cssVars + data attr to
   GridContainer, mounts `<ThemeSwitcher>` at root
5. ✓ grid.css `.skb-grid[data-skb-theme]` baseplate-color rule (only
   visible change)
6. ✓ vitest coverage (6 use-theme + 3 grid-container = 9 new tests)
7. ✓ Full `pnpm check` 47/47 pass
8. **THIS PR** — commit + CI gate

## Honest scope

- 7 files modified, 1 file created
- ~+185 / -45 net LOC
- 9 new vitest tests; editor-shell 291/291 pass overall
- EditorShellMountInner trimmed pre-existing verbose comment blocks
  to stay under the 500-LOC size-check (size 495 → 504 → 492)
- Foundation step; the theme switcher is reachable but visual
  per-theme differentiation is intentionally minimal (baseplate color
  only) so the follow-up that swaps block chrome + baseplate pattern
  is decoupled from this PR's risk profile
