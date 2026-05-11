# Wave 7 Phase 1 — `@skb/grid-themes` package

> **Theme infrastructure**, not yet wired to the editor. Lifts the
> 3 validated theme variants (PR #120/#121 prototype) into a proper
> `@skb/grid-themes` package per ADR-0020 D7-D9. Phase 2 (PR #125-126)
> will wire it into the editor; Phase 3 (PR #127) deletes the prototype.

## title

Ship `@skb/grid-themes` package with 3 built-in themes
(`graph-paper` / `lego-studs` default / `bento-canvas`), Theme
interface contract, registry, storage with frontmatter > localStorage
> default precedence, and a `ThemeSwitcher` floating chip UI with
production-fold rule. Pure additive — zero consumers yet.

## files

- **NEW `packages/grid-themes/`** — themed visual layer per ADR-0020 D7-D9.
  - `package.json` — workspace package; deps `@skb/grid-engine`,
    peerDeps React 18/19, devDeps testing-library + happy-dom
  - `tsconfig.json` — composite; references grid-engine
  - `vitest.config.ts` — happy-dom environment
  - `CONTRACT.md` — public surface spec
  - `src/types.ts` — `GridTheme` interface + `ThemeKey` union +
    render-props types
  - `src/registry.ts` — register / get / list (Map-based; closed v1)
  - `src/storage.ts` — `resolveTheme` precedence + SSR-safe
    `getUserTheme` / `setUserTheme`
  - `src/ThemeSwitcher.tsx` — floating chip; production fold rule
    (hidden unless user has previously switched away from default)
  - `src/built-in/shared.ts` — `KIND_HUE_VARS` + `baseplateStyle` /
    `blockStyle` / `dropPreviewStyle` positioning helpers
  - `src/built-in/graph-paper.tsx` — 60px slot; faint dotted baseplate
  - `src/built-in/lego-studs.tsx` — 80px slot; stud-dot baseplate (default)
  - `src/built-in/bento-canvas.tsx` — 100px slot; baseplate hidden when idle
  - `src/built-in/index.ts` — module-load side-effect register
  - `src/index.ts` — barrel
  - `src/__tests__/registry.test.ts` — 6 tests
  - `src/__tests__/storage.test.ts` — 8 tests (precedence + invalid-value
    fallthrough + SSR safety)
  - `src/__tests__/themes.test.tsx` — 15 tests (5 per built-in: baseplate
    / block / drop ghost / cssVars contract / slotSize invariant)
- MOD `tsconfig.json` — adds `{ path: "./packages/grid-themes" }`

## ui_touch

`false` — no `apps/site/src/` changes. The package ships components
(`ThemeSwitcher`) but nothing consumes them yet. Will become `true` in
Phase 2c (PR #126) when the editor toolbar wires the switcher.

## e2e_smoke

N/A — no UI surfaces yet. Unit-test coverage stands in (29 tests).

## Acceptance

executor: orchestrator-self (bootstrap scope: package-add per ADR-0011
hard rule; no codex executor needed for additive package extraction
from validated prototype)
reviewer: CI gates (lint + typecheck + test + build + size-check +
lychee)
contract_changes: NEW `@skb/grid-themes` public surface — Theme
interface + registry API + storage precedence rule, all documented in
CONTRACT.md
new_adr: NONE — ADR-0020 (PR #122) already locks the Theme contract;
this PR implements it
risk_class: D2 row 2 (NEW package add) — but purely additive with
zero production consumers; risk contained to package itself.
PRE-COMMIT CLAUDE REVIEW skipped per bootstrap-scope rule.

## Out of scope

- Wiring `@skb/grid-themes` into the editor — Phase 2c (PR #126)
- Replacing `applyDropMode` with grid-engine ops — Phase 2b (PR #125)
- `rowSpan='auto'` → discrete integer migration — Phase 2a (PR #124)
- Deleting the prototype + ADR-0017 amendment — Phase 3 (PR #127)
- Theme switcher in editor toolbar — Phase 2c
- Per-doc frontmatter `theme:` MDX parsing — Phase 2c
- v2 extensibility (open `ThemeKey` union, third-party packages) — future

## Process

1. Theme architecture per ADR-0020 D7-D9 (already locked PR #122)
2. Built-in themes lifted from `apps/site/src/components/_grid-prototype/variants/`
   with polish: CSS vars instead of inline literals; `data-skb-*`
   attributes for testability; no inline kind labels (block content
   slot owns content)
3. Registry with insertion-order semantics + test-only `_resetRegistry`
4. Storage SSR-safe (returns `undefined` in Node; no-ops on `setUserTheme`
   outside browser)
5. `ThemeSwitcher` production fold rule: hidden in prod for new users
   (no localStorage entry), visible after first switch + always visible
   in dev
6. 29 vitest tests cover registry / storage / render smoke
7. Commit + CI gate

## Honest scope

15 source files + 1 CONTRACT.md + 1 PR.md, ~1018 LOC source +
~120 LOC contract docs.

- Largest file `ThemeSwitcher.tsx` 151 LOC; all others <110 LOC; well
  under 200 LOC target / 500 LOC hard fail
- No runtime dependencies beyond React + `@skb/grid-engine`
- 29 vitest tests; 100% pass; full `pnpm check` 46/46 pass
