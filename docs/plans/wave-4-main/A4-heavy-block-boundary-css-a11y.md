# A4 — `HeavyBlockBoundary` skeleton CSS + a11y polish + `prefers-reduced-motion` + CONTRACT.md consolidation (D6 + D2 a11y refinements per ADR-0014)

> **Wave 4 Stage A fourth implementation PR.** Closes the visual /
> a11y / reduced-motion gates for `@skb/heavy-block-boundary`. Adds the
> co-located CSS asset
> `packages/heavy-block-boundary/src/heavy-block-skeleton.css` per
> ADR-0014 D6 lines 254-285 (border + bg + radius + grid layout on
> `.heavy-block-skeleton`; spinner with rotation `@keyframes`; loading
> text style; error-UI fragment styles + retry-button `:disabled`
> styling; `@media (prefers-reduced-motion: reduce)` spinner-disable
> rule). Every color / radius / font-size value uses the
> `var(--name, #hex-fallback)` form so the package renders meaningfully
> WITHOUT `@skb/design-tokens` CSS injection (fallback hex matches
> the ADR-0014 D6 example exactly: `#e5e7eb` / `#f9fafb` / `#3b82f6` /
> `#6b7280`). Refines `HeavyBlockBoundary.tsx` to toggle `aria-busy`
> based on render state per ADR-0014 D2 + C2 absorbtion (true while
> Component is null AND error is null — i.e. loading or retry-loading;
> false once Component loaded OR error rendered). Removes the A3-era
> `// TODO(A4)` defer marker. Wires the new CSS asset into the package
> as a subpath export (`./heavy-block-skeleton.css` per the
> `block-callout` precedent — `packages/block-callout/package.json`
> exposes `./ui-default/callout.css` analogously). Adds the workspace
> dep on `@skb/design-tokens` (via `dependencies` per the
> `block-callout` precedent — NOT `peerDependencies`; the CSS file
> consumes design-token CSS variables at runtime via the cascade) +
> the matching tsconfig composite-project `references` entry for
> tsc-b dep ordering. Adds the side-effect CSS import to
> `apps/site/src/components.ts` so the skeleton CSS loads in the
> Astro build (apps/site already injects `@skb/design-tokens/tokens.css`
> globally via `apps/site/src/styles/global.css` lines 1-2 so the
> design-token cascade is in place — verified at PLAN-time grep). Adds
> 4 vitest tests appended to `HeavyBlockBoundary.test.tsx` (Tests 9 /
> 10 / 11 / 12) covering AC#4 (exact CSS class / size / style at first
> paint) + AC#12 (a11y semantics + `aria-busy` toggle on Component-loaded
> + error states) + AC#13 (plugin extensibility on unregistered branded
> kind `'3d-graph'`) + AC#14 (CSS file static assertion that the
> `@media (prefers-reduced-motion: reduce)` block exists + disables the
> spinner animation). **CONSOLIDATES** `packages/heavy-block-boundary/CONTRACT.md`
> by replacing the A1 placeholder paragraph "Full invariants land at
> A2-A4..." with the canonical 8-bullet invariant list reflecting A2
> (mount-guard + AbortSignal + SSR byte-equivalence) + A3 (retry /
> maxRetries / onLoadError / error-UI semantics) + A4 (CSS classes +
> a11y semantics + reduced-motion + plugin extensibility) — this is the
> **D2 Row 1 trigger** for D1 stage 4 PRE-COMMIT CLAUDE REVIEW (per
> ADR-0007 D2 row 1 + ADR-0011 D1+D2 v0.1.1). D1 prop interface (lines
> 1-30 of `HeavyBlockBoundary.tsx`) is **byte-identical** to A3.
> ADR-0014 is **NOT modified** (status remains `proposed`; A8
> promotes). Bundles the A3 row backfill into `docs/plans/active.md`
> per the one-row-per-PR cadence resumed at A3 close (A3's `#TBD` row
> at line 17 of `active.md` gets its squash HEAD filled + the next-PR
> pointer flips from "Stage A4 ..." to "Stage A5 ..."; the Stage A
> remaining row decrements from `A4-A8 (5 PRs)` to `A5-A8 (4 PRs)`).
> Standard ADR-0011 D1 pipeline; **DEVIATION** from Wave 4 plan A4
> line 178 executor routing (`codex-css-stylist` → `codex-generic-executor`)
> explicitly logged in `## executor` with rationale (multi-file scope
> + CONTRACT.md consolidation requires careful prose authoring +
> A1+A2+A3 executor continuity reduces friction; reviewer-codex still
> applies ADR-0006 8-point checklist + the standard A* hunts).

## title

Implement ADR-0014 D6 (skeleton CSS + `prefers-reduced-motion`) + D2
a11y refinements (`aria-busy` toggle on Component-loaded / error
states per C2 absorbtion) for `@skb/heavy-block-boundary`: add the
co-located `packages/heavy-block-boundary/src/heavy-block-skeleton.css`
asset (~80 LOC; CSS classes match the JSX names in `HeavyBlockBoundary.tsx`
lines 99-122 byte-for-byte: `.heavy-block-skeleton` outer container
+ `.heavy-block-skeleton--<kind>` modifier + `.__frame` decorative
frame + `.__spinner` animated spinner with `@keyframes skb-spinner`
rotation + `.__text` loading-text below spinner + `.__error` error-UI
container + `.__error-text` error message + `.__retry` retry button
with `:disabled` styling; `@media (prefers-reduced-motion: reduce)`
block disables the spinner animation per ADR-0014 D6 line 271-273);
ALL color / radius / font-size values use `var(--name, #hex-fallback)`
form so the package renders meaningfully WITHOUT `@skb/design-tokens`
injection (fallback hex matches ADR-0014 D6 example: border `#e5e7eb`,
bg `#f9fafb`, radius `0.5rem`, spinner-track `#e5e7eb`, spinner-fg
`#3b82f6`, text-secondary `#6b7280`, font-size-sm `0.875rem` — 7
fallback constants total). **Token-naming reality discrepancy** locked
at PLAN: ADR-0014 D6 example uses `--skb-color-*` / `--skb-radius-*` /
`--skb-font-size-*` token-name prefixes that do NOT exist in the
current `packages/design-tokens/src/tokens.css` (which uses
`--color-*` / `--radius-*` / `--text-*` prefixes with space-separated
rgb-triple values). A4 ships with the ADR-0014 D6 namespace
(`--skb-color-border` etc.) on the LEFT side of `var(...)` so the
fallback path resolves authoritatively (no design-token override
applies); future Stage B/C may add a contribution to
`@skb/design-tokens` adding the `--skb-*` token aliases that bridge
to the existing `--color-*` triples (NOT in scope for A4 — adding new
tokens to design-tokens IS cross-package scope creep per A4 directive).
Refine `HeavyBlockBoundary.tsx` JSX to toggle `aria-busy` per ADR-0014
D2 + C2 absorbtion: outer `<div>` `aria-busy="true"` while
`Component === null && error === null` (initial load + retry-loading
windows) AND `aria-busy="false"` once Component loaded OR error
rendered (loaded = NOT busy because we're done; error = NOT busy
because we're presenting the error state, NOT loading). Outer
`role="status"` stays on for ALL render states (per ADR-0014 D2 line
124); the inner `.__error` div KEEPS its A3 `role="alert"` (the alert
role is a stronger announcement that COMPLEMENTS the status container,
NOT a conflict — per WAI-ARIA loading-region pattern). `aria-live="polite"`
stays only on the `.__text` element (already true from A2 line 122);
`aria-hidden="true"` stays on `.__frame` and `.__spinner` (already
true from A2 lines 120-121); A4 verifies these at no-regression in
the new Test 10. Remove the A3 `// TODO(A4): aria-busy toggle + CSS
classes + prefers-reduced-motion` marker (the line above the JSX
`return` statement; A4 ships all 3). Add 4 vitest tests appended to
`HeavyBlockBoundary.test.tsx` (Tests 9-12). Test 9 (AC#4): renders
`<HeavyBlockBoundary kind='jupyter' dims={{width:600,height:400}}
... />`; asserts outer container has `className === 'heavy-block-skeleton
heavy-block-skeleton--jupyter'` (exact match including `--<kind>`
modifier) + `style.width === '600px'` + `style.minHeight === '400px'`
+ exactly 3 child elements with classes `__frame` + `__spinner` +
`__text` (initial loading state; assert via `querySelectorAll` count =
3). Test 10 (AC#12): renders in initial loading state; asserts outer
`role === 'status'` + `aria-busy === 'true'` + `__text`
`aria-live === 'polite'` + `__frame` and `__spinner` both have
`aria-hidden === 'true'`; THEN triggers a successful load (mock
resolves) + microtask flush; asserts `aria-busy === 'false'` post-load;
THEN triggers a fresh render with rejecting load + microtask flush;
asserts `aria-busy === 'false'` (error = NOT busy) + the error div
has `role === 'alert'` (regression check from A3). Test 11 (AC#13):
renders `<HeavyBlockBoundary kind='3d-graph' ... />` with an
unregistered branded-widening string kind per ADR-0014 C6; asserts:
(a) outer `className` includes `'heavy-block-skeleton--3d-graph'`
(template-literal class suffix works for arbitrary kinds); (b)
skeleton renders correctly with frame + spinner + text; (c) `load`
called once with `{ signal: AbortSignal }` (lifecycle works
identically for unregistered kinds — proves the boundary is plugin-ready
per ADR-0014 D4 line 169). Test 12 (AC#14): vitest test that READS
the CSS file content via `node:fs` `readFileSync` resolved via
`fileURLToPath(import.meta.url)` + relative path
`'../heavy-block-skeleton.css'`; asserts the file content contains
the substring `'@media (prefers-reduced-motion: reduce)'` AND inside
that media-query block the substring `'animation: none'` is present
(static assertion — happy-dom does NOT reliably simulate
`window.matchMedia('(prefers-reduced-motion)')` so runtime evaluation
is unreliable; static file-content assertion is the canonical
evidence per ADR-0014 D6 line 271-273). Wire the CSS asset into the
package via `package.json` `exports` map: add
`"./heavy-block-skeleton.css": "./src/heavy-block-skeleton.css"`
subpath export (parallels `block-callout`'s `"./ui-default/callout.css":
"./src/ui-default/callout.css"`; consumers `import
'@skb/heavy-block-boundary/heavy-block-skeleton.css';` for side-effect
CSS load). Add the workspace dep on `@skb/design-tokens` via
`dependencies` block (CREATE the block — it does not yet exist in
`packages/heavy-block-boundary/package.json`; A1+A2+A3 left only
`peerDependencies` + `devDependencies`): `"@skb/design-tokens":
"workspace:*"` (the `block-callout` precedent for runtime CSS-token
consumption — `block-callout/package.json` lines 16-19 show the same
pattern). Do NOT add to `peerDependencies` (the CSS variables resolve
through CSS cascade at runtime; this is NOT a JS API peer). Add the
matching tsconfig composite-project reference: `{ "path":
"../design-tokens" }` to the `references` array of
`packages/heavy-block-boundary/tsconfig.json` (currently empty `[]`)
so `tsc -b` resolves the dep ordering correctly even though the CSS
import is side-effect-only (TypeScript still walks the project graph
and `tsc -b` will warn or fail if a dependency is missing from
`references` per workspace convention). Add the CSS side-effect
import line `import '@skb/heavy-block-boundary/heavy-block-skeleton.css';`
near the top of `apps/site/src/components.ts` (after the existing
import block at line 7; the block convention from
`apps/site/src/styles/global.css` lines 1-2 is to inject design-token
CSS at the global-styles layer, but per-block CSS is loaded via
component-module side-effect imports so chunking + tree-shake stay
honest). The A1 `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export at
`apps/site/src/components.ts` line 22 stays intact (A5 removes it
when migrating to real `<HeavyBlockBoundary>` consumption). **CONSOLIDATE**
`packages/heavy-block-boundary/CONTRACT.md` `## Invariants` section
lines 34-39 (the placeholder paragraph "Full invariants land at A2-A4:
mount guard, `AbortSignal` cancellation, SSR byte-equivalence, a11y
semantics, retry behavior, and reduced-motion handling. Wave 4 Stage
A closes those gates per ADR-0014 acceptance criteria #3-#15.") into
the canonical 8-bullet invariant list reflecting A2 (mount-guard +
AbortSignal + SSR byte-equivalence) + A3 (retry / maxRetries /
onLoadError / error-UI semantics) + A4 (CSS classes + a11y + reduced-motion
+ plugin extensibility). The 8 invariant bullets follow the literal
prose locked in `## acceptance` bullet 9 below. The invariant
consolidation is the **D2 Row 1 trigger** mandating D1 stage 4
PRE-COMMIT CLAUDE REVIEW (per ADR-0007 D2 row 1 + ADR-0011 D1+D2
v0.1.1). D1 prop interface (lines 1-30 of `HeavyBlockBoundary.tsx`)
is **byte-identical** to A3. ADR-0014 is **NOT modified** (status
remains `proposed`; A8 promotes). Bundle the A3 row backfill into
`docs/plans/active.md` per the one-row-per-PR cadence resumed at A3
close (the A3 `#TBD` row at line 17 of `active.md` gets its squash
HEAD filled with `92c8751` per A3 ACCEPT report; the next-PR pointer
at line 6 + line 78 flips from "Stage A4 (CSS + a11y polish)" to
"Stage A5 (apps/site dims migration; AC#15)"; the Stage A remaining
row decrements `A4-A8 (5 PRs)` → `A5-A8 (4 PRs)`; the top-line phase
summary appends "+ A4" to the done list). Standard ADR-0011 D1
pipeline (codex-generic-executor EXECUTE; codex-pr-reviewer-55 REVIEW
+ COMMIT; **PRE-COMMIT CLAUDE REVIEW MANDATORY** per D2 Row 1 HIT;
pr-writer ACCEPT). AC coverage in A4: **#4 / #12 / #13 / #14** newly
satisfied; **#1 / #3 / #6 / #7 / #8 / #9 / #10 / #11** A2+A3
regression baseline preserved (TC1). **Out of scope for A4** (per
locked Wave 4 plan): apps/site dims migration replacing
`makeHeavyBlockPlaceholder` with real `<HeavyBlockBoundary>` calls
+ `heavyBoundaryDimensions` exports from the 3 heavy block packages
(AC#15) → A5; playwright T0/T1 layout-shift validation (AC#5) → A6;
`*.astro` SSR variants 5× consolidation (Wave 3 C4a/C4b carry-over)
→ A7; selective per-block chunking + perf baseline (C5 carry-over) +
ADR-0014 promotion `proposed → accepted` → A8.

## files

Modified + new (canonical count in line below; collateral graduations
expected: `pnpm-lock.yaml` graduates because A4 adds the
`@skb/design-tokens` workspace dep — workspace-internal but the
lockfile's `importers/packages/heavy-block-boundary` entry gets a new
line for the dep. This PR.md remains self-listed per ADR-0006 D8
strict whitelist + Pre-A1+A2+A3+A1+A2+A3 precedent that pr-writer
must include the PR.md in the canonical file list at PLAN time):

- `packages/heavy-block-boundary/src/heavy-block-skeleton.css` —
  **NEW**. Co-located CSS asset per ADR-0014 D6 line 249. ~80 LOC.
  Required class blocks (each block matches the JSX class name in
  `HeavyBlockBoundary.tsx` byte-for-byte): (a) `.heavy-block-skeleton`
  outer container — `border: 1px solid var(--skb-color-border,
  #e5e7eb); background: var(--skb-color-skeleton-bg, #f9fafb);
  border-radius: var(--skb-radius-md, 0.5rem); position: relative;
  display: grid; place-items: center;` — matches ADR-0014 D6 lines
  255-262 verbatim. (b) `.heavy-block-skeleton__frame` — decorative
  frame; `position: absolute; inset: 0; pointer-events: none;` (no
  visible style; the frame is a positioning anchor for the spinner).
  (c) `.heavy-block-skeleton__spinner` — animated spinner; `width:
  2rem; height: 2rem; border: 3px solid var(--skb-color-spinner-track,
  #e5e7eb); border-top-color: var(--skb-color-spinner-fg, #3b82f6);
  border-radius: 50%; animation: skb-spinner 1s linear infinite;` —
  matches ADR-0014 D6 lines 263-270 verbatim. (d) `.heavy-block-skeleton__text`
  — loading text; `margin-top: 0.5rem; color: var(--skb-color-text-secondary,
  #6b7280); font-size: var(--skb-font-size-sm, 0.875rem);` — matches
  ADR-0014 D6 lines 274-278 verbatim. (e) `.heavy-block-skeleton__error`
  — error UI container; `display: grid; place-items: center; gap:
  0.75rem; padding: 1rem;` (visual layout for error text + retry
  button stacked centered). (f) `.heavy-block-skeleton__error-text`
  — error message; `color: var(--skb-color-text-secondary, #6b7280);
  font-size: var(--skb-font-size-sm, 0.875rem); text-align: center;`
  (matches the loading-text aesthetic so the visual jump skeleton →
  error is minimal). (g) `.heavy-block-skeleton__retry` — retry button;
  base style + `:disabled` style; `padding: 0.375rem 0.875rem;
  border: 1px solid var(--skb-color-border, #e5e7eb); border-radius:
  var(--skb-radius-md, 0.5rem); background: var(--skb-color-skeleton-bg,
  #f9fafb); cursor: pointer; font-size: var(--skb-font-size-sm,
  0.875rem);` + `.heavy-block-skeleton__retry:disabled { opacity:
  0.5; cursor: not-allowed; }` (the `:disabled` selector is a sibling
  rule, not nested — flat CSS keeps it ESLint-clean). (h) `@keyframes
  skb-spinner { to { transform: rotate(360deg); } }` — matches
  ADR-0014 D6 line 279 verbatim. (i) `@media (prefers-reduced-motion:
  reduce) { .heavy-block-skeleton__spinner { animation: none; } }` —
  matches ADR-0014 D6 lines 271-273 verbatim. ALL color / radius /
  font-size values use `var(--name, #hex-fallback)` form (NO bare
  hex outside fallback positions; reviewer hunt #1). The 7 fallback
  hex constants (`#e5e7eb` ×3 [border + spinner-track + retry-border],
  `#f9fafb` ×2 [bg + retry-bg], `#3b82f6` ×1 [spinner-fg], `#6b7280`
  ×2 [text-secondary + error-text]) match ADR-0014 D6 example. The
  CSS file stays under 200 LOC target / 300 LOC ESLint warn / 500 LOC
  hard fail.
- `packages/heavy-block-boundary/package.json` — **MODIFIED**.
  Three coordinated edits: (a) ADD a NEW `dependencies` block (does
  not currently exist; A1+A2+A3 left only `peerDependencies` +
  `devDependencies`) with `"@skb/design-tokens": "workspace:*"` as
  the sole entry — pattern matches `packages/block-callout/package.json`
  lines 16-19 which also lists `@skb/design-tokens: workspace:*` in
  `dependencies` for runtime CSS-token consumption. Place the
  `dependencies` block AFTER `scripts` and BEFORE `peerDependencies`
  per JSON convention + the `block-callout` precedent. (b) ADD the
  CSS subpath to the `exports` map: `"./heavy-block-skeleton.css":
  "./src/heavy-block-skeleton.css"` (parallel to `block-callout`'s
  `"./ui-default/callout.css": "./src/ui-default/callout.css"`).
  Place the new entry AFTER the existing `"."` entry. (c) DO NOT
  touch `peerDependencies` (`react` + `react-dom` peer-deps stay
  unchanged) or `devDependencies` (the existing 8-dep set covers all
  4 new vitest tests; happy-dom + `@testing-library/react` already
  there from A2). DO NOT add `@skb/design-tokens` to `peerDependencies`
  — the CSS file consumes design-token CSS variables at runtime via
  the cascade, NOT through a JS API; the `dependencies` placement is
  the canonical workspace pattern (ADR-0008 D1 dead-dep policy
  satisfied: declared AND used — used by the CSS file via the
  `--skb-color-*` cascade, AND by the Astro side-effect CSS import
  in apps/site/components.ts which transitively walks the workspace
  dep graph). The file stays under 50 LOC.
- `packages/heavy-block-boundary/tsconfig.json` — **MODIFIED**. ADD
  `{ "path": "../design-tokens" }` to the `references` array
  (currently empty `[]`). Required for `tsc -b` composite-project dep
  graph + dep ordering — even though the CSS import is side-effect-only
  and does not surface a TypeScript symbol from `@skb/design-tokens`,
  the workspace convention enforced by `tsc -b` walks the project
  graph and warns/fails when a `dependencies` entry has no matching
  `references` entry. Add the entry as the SOLE element of the
  `references` array. The file stays under 15 LOC.
- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` —
  **MODIFIED**. D1 type definitions (lines 1-30: imports +
  `HeavyBlockKindRegistry` + `HeavyBlockKind` branded widening +
  `HeavyBlockDimensions` + `HeavyBlockBoundaryProps<P>`) **byte-identical**
  to A3 — A4 does NOT change the public surface. Function body
  changes: (a) Replace the static `aria-busy="true"` attribute on the
  outer `<div>` (line 101 of A3 state) with a derived expression
  `aria-busy={Component === null && error === null ? 'true' :
  'false'}` — this is the canonical aria-busy toggle per ADR-0014 D2
  + C2 absorbtion (true while Component is null AND error is null —
  initial load + retry-loading windows; false once Component loaded
  OR error rendered). The expression renders to the literal string
  `'true'` or `'false'` to match HTML attribute semantics (NOT the JS
  boolean — React serializes `aria-busy={true}` as `aria-busy="true"`
  but the explicit string form is unambiguous + matches the existing
  A2/A3 precedent of stringly-typed ARIA values). (b) Remove the
  `// TODO(A4): aria-busy toggle + CSS classes + prefers-reduced-motion`
  comment (line 94 of A3 state — the marker between the
  `skeletonStyle` const and the `return` statement). (c) Verify (NO
  edit needed; reviewer hunt #2): outer `<div>` `role="status"` stays
  always-on (line 100 of A3 state — A4 confirms no regression); inner
  `.__error` div KEEPS its A3 `role="alert"` (line 107 of A3 state —
  A4 confirms regression Test 10 covers this); `aria-live="polite"`
  stays only on `.__text` (line 122 of A3 state); `aria-hidden="true"`
  stays on `.__frame` and `.__spinner` (lines 120-121 of A3 state).
  (d) Add a `// TODO(A5)` marker (optional but recommended for
  natural defer-point signaling; placement: above the `useEffect` —
  parallels A3's TODO(A4) placement; content suggestion: `// TODO(A5):
  apps/site dims migration via heavyBoundaryDimensions imports`).
  Executor MAY skip the TODO(A5) marker if it deems the active.md
  pointer flip + Wave 4 plan A5 doc cite sufficient (TC20 lists this
  marker as OPTIONAL — `grep` count ≥ 0 NOT ≥ 1). The file stays
  byte-identical to A3 EXCEPT for the 2-3 changes above (aria-busy
  expression + TODO(A4) removal + optional TODO(A5) addition); est.
  ~140 LOC post-edit (A3 was ~140 LOC; A4 net change is ~0 LOC).
  Stays well under all size limits.
- `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test.tsx`
  — **MODIFIED**. The 8 A2+A3 tests (AC#1 + AC#3 + AC#6 + AC#7 +
  AC#8 + AC#9 + AC#10 + AC#11) are PRESERVED byte-unchanged (TC1
  regression baseline). Adds 4 new vitest tests bundled into the same
  file (NOT split into a separate `HeavyBlockBoundary.css.test.tsx`
  — the post-A4 file estimate is ~400 LOC, just over the 300 LOC
  ESLint warn but well under the 500 LOC hard fail; if executor
  prefers to split into `HeavyBlockBoundary.a11y.test.tsx` for the
  4 new tests to stay under the warn, that's an acceptable
  graduation per `## acceptance` bullet 12 collateral-drift slot;
  default plan is to bundle into the existing file with an
  `// eslint-disable-next-line max-lines` comment if needed). Imports
  gain `readFileSync` from `'node:fs'` and `fileURLToPath` from
  `'node:url'` (for Test 12) if not already present. The 4 new tests:
  - **Test 9 (AC#4 — exact CSS class / size / style at first paint)**:
    defines a never-resolving `load = () => new Promise<...>(() => {});`
    so the component stays in initial-loading state; renders
    `<HeavyBlockBoundary kind='jupyter' dims={{width:600, height:400}}
    load={load} childProps={{}} />`; queries the outer container via
    `document.querySelector('[data-block="jupyter"]')`; asserts: (i)
    the outer `className === 'heavy-block-skeleton heavy-block-skeleton--jupyter'`
    (exact full match including the `--<kind>` modifier — NOT just
    `.classList.contains('heavy-block-skeleton')`; the literal `===`
    on `.className` covers both classes in the documented order); (ii)
    the outer `style.width === '600px'` (the `${dims.width}px`
    template literal); (iii) the outer `style.minHeight === '400px'`
    (the `${dims.height}px` template literal — note `min-height` not
    `height` per ADR-0014 D2 line 134); (iv) the outer container has
    EXACTLY 3 child elements (`outer.children.length === 3`); (v) the
    3 children's classes match `'heavy-block-skeleton__frame'` +
    `'heavy-block-skeleton__spinner'` + `'heavy-block-skeleton__text'`
    in the documented JSX order (children[0] = frame, children[1] =
    spinner, children[2] = text — A3 line 120-122 ordering preserved
    by A4); (vi) the outer container is the SAME DOM node before and
    after a microtask flush (`await Promise.resolve()` then re-query
    + `Object.is` comparison — proves the loading-state outer
    container is layout-stable, no churn).
  - **Test 10 (AC#12 — a11y semantics + aria-busy toggle on Component
    + error states)**: this is a 3-phase test (initial loading →
    successful load → error). Phase 1 (loading): defines a
    deferred-resolve mock `let resolveFn: ((mod: ...) => void) |
    undefined; const load = () => new Promise<...>((r) => {
    resolveFn = r; });`; renders the component; asserts via
    `document.querySelector('[data-block="jupyter"]')`: (i) outer
    `getAttribute('role') === 'status'`; (ii) outer
    `getAttribute('aria-busy') === 'true'`; (iii) `__text` element
    `getAttribute('aria-live') === 'polite'`; (iv) `__frame`
    `getAttribute('aria-hidden') === 'true'`; (v) `__spinner`
    `getAttribute('aria-hidden') === 'true'`. Phase 2 (successful
    load): triggers `resolveFn?.({ default: () => createElement('div',
    { 'data-loaded': 'true' }, 'OK') })` inside `act` + microtask
    flush; re-queries the outer container; asserts (vi) outer
    `aria-busy === 'false'` post-load (loaded = NOT busy); (vii) outer
    `role === 'status'` STILL on (no regression). Phase 3 (error
    state): renders a SEPARATE component instance with `load = () =>
    Promise.reject(new Error('boom'))`; awaits microtask flush;
    asserts (viii) outer `aria-busy === 'false'` (error = NOT busy);
    (ix) outer `role === 'status'` STILL on; (x) the inner `__error`
    div has `getAttribute('role') === 'alert'` (A3 regression check —
    the error div's `role="alert"` from A3 line 107 is preserved by
    A4). The 3 phases verify the full aria-busy state machine
    `loading → loaded → busy=false` AND `loading → error → busy=false`
    + the always-on `role="status"` outer + the always-on `role="alert"`
    inner-error.
  - **Test 11 (AC#13 — plugin extensibility on unregistered branded
    kind `'3d-graph'`)**: defines a successful-load mock `const Loaded:
    ComponentType<{ name: string }> = ({ name }) => createElement('div',
    { 'data-loaded': 'true' }, name); const load = vi.fn((init?: {
    signal?: AbortSignal }) => Promise.resolve({ default: Loaded }));`;
    renders `<HeavyBlockBoundary kind='3d-graph' as HeavyBlockKind
    dims={{width:500, height:400}} load={load} childProps={{ name:
    'A4-PLUGIN-OK' }} />` — `'3d-graph'` is an unregistered string
    kind that satisfies the `(string & { readonly __heavyBlockKind?:
    never })` widening per ADR-0014 C6 (lines 10-12 of
    `HeavyBlockBoundary.tsx`). Asserts: (i) BEFORE microtask flush,
    outer container has `className` EXACTLY `'heavy-block-skeleton
    heavy-block-skeleton--3d-graph'` (template-literal class suffix
    works for ANY string kind, NOT just the 3 known kinds); (ii) outer
    `data-block === '3d-graph'` (template-literal `data-block={kind}`
    works); (iii) `load` called once with `{ signal: AbortSignal }`
    (lifecycle works identically — proves plugin extensibility);
    (iv) AFTER microtask flush, the loaded component renders
    (`getByText('A4-PLUGIN-OK')` succeeds) — proves the full SSR →
    load → render lifecycle works for plugin kinds. This satisfies
    ADR-0014 D4 line 169 plugin-extensibility intent + the C6
    branded-widening contract.
  - **Test 12 (AC#14 — CSS file static assertion for `@media
    (prefers-reduced-motion: reduce)` + spinner animation disabled)**:
    imports `readFileSync` from `'node:fs'` and `fileURLToPath` from
    `'node:url'`; resolves the CSS file path via `const cssPath =
    fileURLToPath(new URL('../heavy-block-skeleton.css',
    import.meta.url));` (the test file lives at
    `src/__tests__/HeavyBlockBoundary.test.tsx`, the CSS file lives
    at `src/heavy-block-skeleton.css`, so the relative path is
    `../heavy-block-skeleton.css` from the test file's directory);
    reads the file content `const css = readFileSync(cssPath, 'utf8');`;
    asserts: (i) `expect(css).toContain('@media (prefers-reduced-motion:
    reduce)')` — the media-query block is present; (ii)
    `expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.heavy-block-skeleton__spinner\s*\{\s*animation:\s*none/)`
    — the regex enforces the `@media` block contains the
    `__spinner { animation: none }` rule (a multi-line regex tolerant
    to whitespace; happy-dom does NOT need to evaluate the
    media-query at runtime — the static file-content assertion is the
    canonical evidence per ADR-0014 D6 line 271-273). The static
    assertion approach is chosen over a runtime
    `window.matchMedia('(prefers-reduced-motion: reduce)')` mock
    because happy-dom's `matchMedia` polyfill returns a stub that
    does NOT propagate matches into computed-style queries; runtime
    evaluation would require a JSDOM upgrade or a custom CSSOM polyfill,
    both out of scope for A4 (executor MAY explore a runtime variant
    as a follow-up if it cleanly drops in, but the static assertion is
    the canonical TC5 evidence).
- `packages/heavy-block-boundary/CONTRACT.md` — **MODIFIED**. Replace
  the placeholder `## Invariants` section (lines 34-39 of current
  CONTRACT.md, the paragraph "Full invariants land at A2-A4: mount
  guard, `AbortSignal` cancellation, SSR byte-equivalence, a11y
  semantics, retry behavior, and reduced-motion handling. Wave 4
  Stage A closes those gates per ADR-0014 acceptance criteria
  #3-#15.") with the canonical 8-bullet invariant list reflecting
  A2 + A3 + A4 implementation. The 8-bullet list literal text is
  authored under `## acceptance` bullet 9 below (single-source — the
  CONTRACT.md prose copies that bullet's literal block). Lines
  41-58 (the W4-1 partner cross-link to `block-foundation/CONTRACT.md`
  + the editor out-of-scope note + the Authority Links section)
  stay byte-unchanged. **D2 Row 1 trigger**: this CONTRACT.md
  consolidation is the single architectural-surface change in A4
  that mandates D1 stage 4 PRE-COMMIT CLAUDE REVIEW (per ADR-0007 D2
  row 1 + ADR-0011 D1+D2 v0.1.1) — the consolidation walks back A1's
  defer-marker prose with A2+A3+A4 deep semantics, so a same-model
  echo-chamber risk on the multi-stage invariant aggregation is
  mitigated by the orchestrator-self review at stage 4. Reviewer
  Claude reviews especially for: invariant prose accurately reflects
  implementation (NOT aspirational drift); cross-references to A2 /
  A3 / A4 AC# numbers are correct; W4-1 partner cross-link is
  preserved.
- `apps/site/src/components.ts` — **MODIFIED**. Add a SINGLE
  side-effect CSS import line `import
  '@skb/heavy-block-boundary/heavy-block-skeleton.css';` near the
  top of the file (after the existing imports at lines 1-7; place
  AFTER the `import { HeavyBlockBoundary } from
  '@skb/heavy-block-boundary';` line at line 7 to keep the
  side-effect import grouped with the package's JS import — Vite
  + Astro will inline the CSS into the build chunk that depends on
  this module). The A1 `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export
  at line 22 stays intact (A5 removes it when migrating to real
  `<HeavyBlockBoundary>` consumption). The `componentsMap` at lines
  66-77 stays byte-unchanged (A5 substitutes the 3
  `makeHeavyBlockPlaceholder` calls with real `<HeavyBlockBoundary>`
  invocations). Verify at EXECUTE: the `apps/site/package.json`
  ALREADY lists `@skb/heavy-block-boundary: workspace:*` (added at
  A1); this CSS import works without any change to apps/site
  package.json. The `apps/site/src/styles/global.css` lines 1-2
  ALREADY inject `@skb/design-tokens/tokens.css` globally so the
  design-token cascade is in place workspace-wide; A4's hex
  fallbacks render even WITHOUT the cascade applying (per ADR-0014
  D6 line 282-284). The file stays at ~78 LOC post-edit (currently
  ~78 LOC; A4 adds 1 line).
- `docs/plans/active.md` — **MODIFIED**. A3 row backfill +
  next-PR pointer flip + Stage A remaining row decrement + top-line
  phase summary append. Specific edits (mechanical bookkeeping;
  executor authors the diff per the explicit guidance below):
  - **Top-line line 6**: change `Pre-A1 + Pre-A2 + Pre-A3 + A1 +
    A2 + A3 done. **Stage A4 (CSS + a11y polish) is the next
    implementation PR.**` → `Pre-A1 + Pre-A2 + Pre-A3 + A1 + A2 +
    A3 + A4 done. **Stage A5 (apps/site dims migration; AC#15) is
    the next implementation PR.**`
  - **Wave 4 PR roster table line 17 (currently `| #TBD (this) |
    TBD | A3 | HeavyBlockBoundary retry + maxRetries + onLoadError
    telemetry (D3 retry-flow; AC#7/#8/#9) |`)**: replace with `|
    #33 | 92c8751 | A3 | HeavyBlockBoundary retry + maxRetries +
    onLoadError telemetry (D3 retry-flow; AC#7/#8/#9) |` (the
    `#33` PR number + `92c8751` squash HEAD per A3 ACCEPT report;
    if A3 has not actually merged at A4 EXECUTE kickoff, executor
    stages this row with the A3 ACCEPT-reported SHA; if the SHA is
    not yet known, executor stages with the `<TBD>` placeholder
    pattern + orchestrator patches at COMMIT time per the Pre-A3
    row TBD-fill pattern).
  - **Stage A remaining row line 18 (currently `| Stage A
    remaining | A4-A8 (5 PRs) | A | CSS+a11y (A4) + dims+migration
    (A5) + playwright (A6) + .astro consolidated (A7) + perf+chunking+ADR-0014
    promote (A8) |`)**: replace with `| Stage A remaining | A5-A8
    (4 PRs) | A | dims+migration (A5) + playwright (A6) + .astro
    consolidated (A7) + perf+chunking+ADR-0014 promote (A8) |`.
  - **起手指引 line 78 (next-PR pointer)**: change `**Stage A4
    (CSS + a11y polish) is the next implementation PR.**` → `**Stage
    A5 (apps/site dims migration; AC#15) is the next implementation
    PR.**`
  - All other content of `docs/plans/active.md` stays byte-unchanged
    (no edits to the Wave 1+2+3 close summaries, the architecture
    ADR roster, the Wave 4 mandatory scope bullets, or the
    Pre-flight numbered list 1-5).
- `pnpm-lock.yaml` — **MODIFIED**. A4 adds the `@skb/design-tokens:
  workspace:*` workspace dep to `packages/heavy-block-boundary/package.json`,
  which causes pnpm to add a corresponding line to the
  `importers/packages/heavy-block-boundary` block of the lockfile.
  The diff is BOUNDED to that single workspace dep entry (no other
  dep version drift expected; if executor sees broader churn, that's
  a sign of `pnpm install` re-resolution and must be investigated
  per memory `feedback_git_operator_explicit_stage` lockfile-blob
  rule). TC17 verifies bounded diff. MUST be staged at commit per
  ADR-0006 D8 (lockfile blob discipline; memory
  `feedback_git_operator_explicit_stage`).
- `docs/plans/wave-4-main/A4-heavy-block-boundary-css-a11y.md` —
  this PR.md (self-listed per ADR-0006 D8 strict whitelist; A1+A2+A3
  R1 precedent + Pre-A1+A2+A3 + Wave 1+2+3 lessons carried).

= **10 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `packages/heavy-block-boundary/src/index.ts` — **UNCHANGED**. The
  package barrel re-exports `HeavyBlockBoundary` + the public types
  (A1 baseline). A4 does NOT re-export the CSS path through
  `index.ts` (workspace convention: CSS is exposed via `package.json`
  `exports` map, NOT via JS barrel re-export — `block-callout`
  precedent: `block-callout/src/index.ts` does NOT import or
  re-export `callout.css`; consumers `import
  '@skb/block-callout/ui-default/callout.css'` directly). The
  `index.ts` stays JS-only. TC18 verifies empty diff.
- `packages/heavy-block-boundary/vitest.config.ts` — **UNCHANGED**.
  A2's config (`include: ['src/**/*.test.{ts,tsx}']`, `exclude:
  ['**/*.test-d.ts']`, `environment: 'happy-dom'`, `typecheck: {
  enabled: false }`) covers A4. Test 12 uses `node:fs` for static
  CSS file reading — happy-dom does NOT need to support runtime
  `matchMedia` for that approach; no config delta needed.
- `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test-d.ts`
  — **UNCHANGED**. A2's positive + negative type assertions on
  generic `<P>` inference + branded widening + `// @ts-expect-error`
  markers cover A4 since the prop shape did NOT move (the D1 prop
  interface is byte-identical between A3 and A4). TC8 still gates
  via `tsc -b`.
- `docs/decisions/ADR-0014-heavy-block-boundary.md` — **NOT
  modified**. Status remains `proposed`; promotion to `accepted` is
  A8 scope per locked Wave 4 plan Stage A close criterion #1. A4
  is the consumer of the ADR (specifically D6 lines 247-285 for
  CSS + D2 lines 117-140 for a11y semantics), not the editor. TC11
  verifies empty diff.
- `packages/design-tokens/**` — **UNCHANGED**. A4 explicitly does
  NOT add new tokens to design-tokens (per A4 directive: cross-package
  scope creep). The A4 CSS file references `--skb-color-*` /
  `--skb-radius-*` / `--skb-font-size-*` token names that do NOT
  exist in `packages/design-tokens/src/tokens.css` (which uses
  `--color-*` / `--radius-*` / `--text-*` prefixes); the hex
  fallback positions resolve authoritatively in this case (no
  cascade override applies). Future Stage B/C may add a contribution
  to design-tokens bridging `--skb-*` aliases to the existing
  `--color-*` rgb-triple values.
- `apps/site/package.json` — **UNCHANGED**. A1's workspace dep on
  `@skb/heavy-block-boundary: workspace:*` stays. A4's CSS
  side-effect import in `apps/site/src/components.ts` works because
  the workspace dep is already declared.
- `apps/site/src/styles/global.css` — **UNCHANGED**. The
  `@skb/design-tokens/tokens.css` global injection at lines 1-2
  stays intact; A4 does NOT touch the global stylesheet.
- `agent-contract.md` / generated configs — no agent-contract.md
  change in A4; no `pnpm generate:configs` regen.
- `packages/heavy-block-boundary/dist/**` / `.turbo/**` — gitignored.
- `pnpm-workspace.yaml` — already lists `packages/*` glob; no edit.
- `tsconfig.json` (workspace root) — verified at A1 EXECUTE that
  root does not enumerate package references; no edit. (The
  `references` change in A4 is INSIDE the package's own
  `tsconfig.json`, not the workspace root.)
- `packages/heavy-block-boundary/src/__tests__/skeleton.test.ts`
  — **UNCHANGED**. A1's trivial harness test stays as belt+suspenders
  for AC#1 alongside `HeavyBlockBoundary.test.tsx` Test 1.
- Any `apps/site/**` `.astro` SSR variant — A7 scope; A4 does NOT
  touch.
- Any `packages/block-{jupyter,nn-viz,agent-flow}/` source — A5
  scope for the `heavyBoundaryDimensions` exports; A4 does NOT
  touch.

## test_cases

A4 ships the CSS asset + a11y `aria-busy` toggle + plugin
extensibility test + reduced-motion static assertion + CONTRACT.md
consolidation. Tests are TDD-first per ADR-0011 D1 stage 2: write
the 4 new test assertions first → confirm they FAIL against the A3
state (which has no CSS file, no aria-busy toggle, no plugin
extensibility test, no reduced-motion assertion) → implement the A4
CSS + aria-busy toggle + (no Tx changes for plugin since the JSX is
already plugin-ready by A2; Test 11 just exercises the existing
behavior on an unregistered kind) + CONTRACT.md consolidation →
confirm TC1-TC5 + the existing A2+A3 tests + skeleton.test.ts all
PASS.

- **TC1** (AC#1 + #3 + #6 + #7 + #8 + #9 + #10 + #11 regression —
  all A2+A3 tests still PASS) Input: `pnpm --filter
  @skb/heavy-block-boundary test`. Expected: exit 0; the 8 A2+A3
  vitest tests (`HeavyBlockBoundary.test.tsx` Tests 1-8) AND
  `skeleton.test.ts` Test 1 ALL still PASS unchanged after A4 edits
  — proves no regression from the aria-busy toggle change. Particularly
  important: AC#3 (SSR/hydration byte-equivalence) MUST still hold
  — the `aria-busy="true"` static SSR-render becomes a derived
  expression `aria-busy={Component === null && error === null ?
  'true' : 'false'}` but on initial SSR `Component === null && error
  === null` is true so the attribute renders `'true'` byte-identically
  to A3 (the hydration mismatch test asserts no warning fires; the
  byte-equivalence is preserved at first paint). AC#6 (successful
  load path) MUST still hold — the loaded component still renders
  with `data-loaded="true"` after `useEffect` settles; the new
  aria-busy expression flips to `'false'` post-load but the test does
  NOT assert `aria-busy='true'` so no churn. AC#7-#9 (retry / error
  / maxRetries) MUST still hold — the error UI still renders with
  retry button + onLoadError telemetry; the new aria-busy expression
  flips to `'false'` on error but the tests do NOT assert
  `aria-busy='true'` so no churn. AC#10 (mount guard) + AC#11
  (AbortSignal propagation) MUST still hold — A4 does NOT touch the
  useEffect / cleanup contract. Location: shell at repo root.
- **TC2** (AC#4 — exact CSS class / size / style at first paint;
  Test 9) Input: `pnpm --filter @skb/heavy-block-boundary test`.
  Expected: `HeavyBlockBoundary.test.tsx` Test 9 (AC#4) PASS; the
  outer `[data-block="jupyter"]` container has `className === 'heavy-block-skeleton
  heavy-block-skeleton--jupyter'` (exact match including the
  `--<kind>` modifier); `style.width === '600px'`; `style.minHeight
  === '400px'` (note `min-height` per ADR-0014 D2 line 134); exactly
  3 child elements with classes `__frame` + `__spinner` + `__text`
  in that order; the outer container is the SAME DOM node before /
  after a microtask flush (layout-stable). Location: shell.
- **TC3** (AC#12 — a11y semantics + aria-busy toggle on Component +
  error states; Test 10) Input: `pnpm --filter @skb/heavy-block-boundary
  test`. Expected: `HeavyBlockBoundary.test.tsx` Test 10 (AC#12)
  PASS; Phase 1 (loading): outer `role === 'status'` + `aria-busy
  === 'true'` + `__text` `aria-live === 'polite'` + `__frame` and
  `__spinner` both `aria-hidden === 'true'`; Phase 2 (successful
  load): outer `aria-busy === 'false'` post-load + outer `role ===
  'status'` STILL on; Phase 3 (error state): outer `aria-busy ===
  'false'` (error = NOT busy) + outer `role === 'status'` STILL on
  + inner `__error` div `role === 'alert'` (A3 regression check).
  Location: shell.
- **TC4** (AC#13 — plugin extensibility on unregistered branded kind
  `'3d-graph'`; Test 11) Input: `pnpm --filter @skb/heavy-block-boundary
  test`. Expected: `HeavyBlockBoundary.test.tsx` Test 11 (AC#13)
  PASS; outer `className` EXACTLY `'heavy-block-skeleton
  heavy-block-skeleton--3d-graph'` (template-literal class suffix
  works for ANY string kind); outer `data-block === '3d-graph'`;
  `load` called once with `{ signal: AbortSignal }`; AFTER
  microtask flush the loaded component renders (`getByText('A4-PLUGIN-OK')`
  succeeds) — proves plugin extensibility for arbitrary string kinds
  per ADR-0014 C6 + D4. Location: shell.
- **TC5** (AC#14 — CSS file static assertion for `@media
  (prefers-reduced-motion: reduce)` + spinner animation disabled;
  Test 12) Input: `pnpm --filter @skb/heavy-block-boundary test`.
  Expected: `HeavyBlockBoundary.test.tsx` Test 12 (AC#14) PASS; the
  CSS file content (read via `node:fs` `readFileSync` resolved via
  `fileURLToPath(import.meta.url)` + relative path
  `'../heavy-block-skeleton.css'`) contains the substring `'@media
  (prefers-reduced-motion: reduce)'` AND a regex match for the
  `__spinner { animation: none }` rule INSIDE the media-query block.
  Location: shell.
- **TC6** (`pnpm check` exit 0 globally — workspace-wide regression
  baseline) Input: `pnpm check`. Expected: exit 0 (lint + typecheck
  + test + build + size-check all pass across the workspace; A4's
  changes do not regress any other package). Location: shell.
- **TC7** (Package builds clean) Input: `pnpm --filter
  @skb/heavy-block-boundary build`. Expected: exit 0 (`tsc -b`
  produces dist/ outputs without diagnostics; the new `references`
  entry on `@skb/design-tokens` is honored by tsc-b composite
  project graph; the aria-busy expression compiles cleanly). Location:
  shell.
- **TC8** (Lint clean for the package) Input: `pnpm --filter
  @skb/heavy-block-boundary lint`. Expected: exit 0; ESLint flags no
  issues on `HeavyBlockBoundary.tsx` (modified) or the test file
  (modified) or the new CSS file (which ESLint typically does not
  parse — workspace ESLint config likely scopes to .ts/.tsx; if a
  CSS-aware plugin like `stylelint` runs, it should flag no issues
  since the CSS uses canonical property names + `var(...)` form +
  no nested selectors); `max-lines` 300 warn threshold not hit
  (component file estimated ~140 LOC; test file estimated ~400 LOC
  — JUST over the warn; if executor sees the warn fire, split the
  4 new tests into a new `HeavyBlockBoundary.a11y.test.tsx` file per
  `## acceptance` bullet 12 collateral-drift slot). Location: shell.
  Memory `feedback_codex_spark_lint_gap` notes lint is independent
  of vitest PASS — TC8 is a hard gate.
- **TC9** (Typecheck clean — including `.test-d.ts` from A2) Input:
  `pnpm --filter @skb/heavy-block-boundary typecheck`. Expected:
  exit 0; `tsc -b` includes `src/__tests__/HeavyBlockBoundary.test-d.ts`
  via tsconfig `include: ["src/**/*"]` glob; A2's positive +
  negative type assertions + `// @ts-expect-error` markers all
  still hold (the prop shape did NOT move in A4). Location: shell.
  AC#2 mechanism (locked at A2) preserved.
- **TC10** (Size check clean — 500 LOC hard fail) Input: `pnpm
  size-check`. Expected: exit 0; no file in
  `packages/heavy-block-boundary/src/` exceeds 500 LOC; the modified
  `HeavyBlockBoundary.tsx` est. ~140 LOC, the modified test file
  est. ~400 LOC, the new CSS file est. ~80 LOC, all well under the
  500 LOC limit. Location: shell.
- **TC11** (CSS file uses `var(...)` form for ALL color / radius /
  font-size; NO bare hex outside fallback positions) Input (a):
  `grep -cE '#[0-9a-fA-F]{3,6}' packages/heavy-block-boundary/src/heavy-block-skeleton.css`.
  Expected: 7 (the 7 fallback hex constants — `#e5e7eb` ×3, `#f9fafb`
  ×2, `#3b82f6` ×1, `#6b7280` ×2; if executor adds more
  border-fallback or otherwise drifts, the count rises but reviewer
  hunt verifies each occurrence is INSIDE a `var(...)` parenthesis).
  Input (b): `grep -nE '#[0-9a-fA-F]{3,6}' packages/heavy-block-boundary/src/heavy-block-skeleton.css
  | grep -v 'var('`. Expected: empty (NO hex occurs OUTSIDE a
  `var(...)` fallback position). Input (c): `grep -cE 'var\(--skb-' packages/heavy-block-boundary/src/heavy-block-skeleton.css`.
  Expected: ≥ 7 (each `var(...)` reference uses the `--skb-*`
  namespace per ADR-0014 D6). Location: shell.
- **TC12** (CONTRACT.md "Full invariants land at A2-A4" prose
  REMOVED + new invariants section present) Input (a): `grep -c
  'Full invariants land at' packages/heavy-block-boundary/CONTRACT.md`.
  Expected: 0 (the placeholder paragraph removed). Input (b):
  `grep -cE '\*\*(SSR|Mount-guard|AbortSignal|Retry|CSS class|A11y|Reduced-motion|Plugin)' packages/heavy-block-boundary/CONTRACT.md`.
  Expected: ≥ 7 (the 8 canonical invariant bullets each open with
  one of the 8 keywords; the regex matches at least 7 to allow for
  prose drift on 1 keyword). Input (c): `grep -c 'W4-1' packages/heavy-block-boundary/CONTRACT.md`.
  Expected: ≥ 1 (the W4-1 partner cross-link to
  `block-foundation/CONTRACT.md` is preserved at the end of the
  invariants section). Location: shell.
- **TC13** (`@skb/design-tokens` workspace dep declared in
  package.json `dependencies` + tsconfig `references`) Input (a):
  `cat packages/heavy-block-boundary/package.json | grep -A2 '"dependencies"' | grep -c '@skb/design-tokens'`.
  Expected: 1 (the new `dependencies` block lists `@skb/design-tokens:
  workspace:*`). Input (b): `cat packages/heavy-block-boundary/tsconfig.json | grep -c '"path": "../design-tokens"'`.
  Expected: 1 (the `references` array contains the
  `@skb/design-tokens` composite-project reference). Location: shell.
- **TC14** (CSS subpath `./heavy-block-skeleton.css` in package.json
  `exports` map) Input: `cat packages/heavy-block-boundary/package.json | grep -c '"./heavy-block-skeleton.css"'`.
  Expected: 1 (the `exports` map subpath entry). Location: shell.
- **TC15** (apps/site CSS side-effect import present) Input:
  `grep -cE "import\s+'@skb/heavy-block-boundary/heavy-block-skeleton.css'" apps/site/src/components.ts`.
  Expected: 1 (the side-effect CSS import line). Location: shell.
  If apps/site convention says the CSS should ALSO be added to
  `apps/site/src/styles/global.css` instead of/in-addition-to
  `components.ts`, executor MAY relocate per workspace-discovered
  convention at EXECUTE time + update TC15 input path accordingly
  (graduation slot per `## acceptance` bullet 12).
- **TC16** (`active.md` has A3 row backfilled with `92c8751` SHA +
  A5 next-PR pointer) Input: `git diff main -- docs/plans/active.md`.
  Expected: diff includes (a) the A3 row replacement from `| #TBD
  (this) | TBD | A3 | ...` to `| #33 | 92c8751 | A3 | ...` (or
  whatever PR number + SHA the A3 ACCEPT report finalized); (b) the
  Stage A remaining row replacement from `A4-A8 (5 PRs)` to `A5-A8
  (4 PRs)`; (c) the 起手指引 line 78 next-PR pointer flip from
  "Stage A4 (CSS + a11y polish)" to "Stage A5 (apps/site dims
  migration; AC#15)"; (d) the top-line phase summary append "+ A4"
  + the same next-PR pointer flip on line 6. All other content of
  `docs/plans/active.md` byte-unchanged. Location: shell.
- **TC17** (`pnpm-lock.yaml` diff bounded to the
  `@skb/design-tokens` workspace dep entry; idempotent install)
  Input (a): `git diff main -- pnpm-lock.yaml | grep -cE '^[+-] .+@skb/design-tokens'`.
  Expected: ≥ 1 (the new workspace dep line for
  `packages/heavy-block-boundary` consuming `@skb/design-tokens`;
  may be 2 if both `+` for the dep line AND `+` for a context line
  are flagged, but the count is bounded). Input (b): `git diff main
  -- pnpm-lock.yaml | grep -cE '^[+-]' | head -1`. Expected: ≤ 30
  (a sanity ceiling; typical workspace dep add yields ~5-10 lines
  of lockfile diff). Input (c): `pnpm install` × 2. Expected:
  second run reports "Lockfile is up to date" and the `pnpm-lock.yaml`
  hash is unchanged across the two runs (idempotent). Location:
  shell.
- **TC18** (`packages/heavy-block-boundary/src/index.ts`
  byte-unchanged) Input: `git diff main -- packages/heavy-block-boundary/src/index.ts`.
  Expected: empty diff. The CSS asset is exposed via `package.json`
  `exports` map, NOT re-exported through the JS barrel. Location:
  shell.
- **TC19** (D1 prop interface byte-unchanged from A3 — TC12 from A3
  carry-over) Input: `git diff main -- packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx
  | grep -E '^[-+]' | grep -E 'HeavyBlockKindRegistry|HeavyBlockKind|HeavyBlockDimensions|HeavyBlockBoundaryProps|__heavyBlockKind'`.
  Expected: empty (no `-`/`+` lines on the public type definitions;
  only function-body aria-busy / TODO removal changes). Verifies
  A4 ships the CSS + a11y polish WITHOUT drifting the public surface.
  Location: shell.
- **TC20** (TODO marker for A4 removed; TODO(A5) presence is
  OPTIONAL) Input (a): `grep -cE 'TODO\(A4\)' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: 0 (A4 marker gone — A4 is no longer pending). Input
  (b): `grep -cE 'TODO\(A5\)' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 0 (the deferred-scope marker for apps/site dims
  migration is OPTIONAL — executor's call; the active.md pointer
  flip + Wave 4 plan A5 doc cite is sufficient signal). Location:
  shell.
- **TC21** (Link-check passes via CI) Input:
  `.github/workflows/link-check.yml` on push to feature branch.
  Expected: workflow `success` conclusion (lychee CI-only per Wave
  3 baseline). Location: GitHub Actions. PR.md links here are all
  relative paths to in-repo files using plain path form (no `:line`
  suffix per memory `feedback_lychee_line_anchor`); no `~/.claude/...`
  markdown link form per memory `feedback_lychee_user_local_paths`.
- **TC22** (CONTRACT.md cross-references unchanged: ADR-0014 D1,
  D7, D9, W4-1 still mentioned) Input (a): `grep -cE 'ADR-0014.*D(1|7|9)' packages/heavy-block-boundary/CONTRACT.md`.
  Expected: ≥ 3 (D1 + D7 + D9 cite preservation in the Authority
  Links section). Input (b): `grep -c 'block-foundation/CONTRACT.md' packages/heavy-block-boundary/CONTRACT.md`.
  Expected: ≥ 1 (the W4-1 partner cross-link preserved). Location:
  shell.
- **TC23** (No new console.error placeholder log in
  `HeavyBlockBoundary.tsx` — A3 invariant carry-over) Input:
  `grep -cE 'console\.error' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: 0 (the A3-removed placeholder log stays removed; A4
  does not re-introduce it). Location: shell.

## contracts_affected

- **`packages/heavy-block-boundary/CONTRACT.md`** — **MODIFIED**
  (D2 Row 1 trigger). The placeholder `## Invariants` section
  (lines 34-39 of current state, the paragraph "Full invariants
  land at A2-A4...") is REPLACED with the canonical 8-bullet
  invariant list reflecting A2 + A3 + A4 implementation. The literal
  prose is authored under `## acceptance` bullet 9 below (single-source
  — the CONTRACT.md prose copies that bullet's literal block).
  Lines 41-58 (W4-1 partner cross-link + editor out-of-scope note +
  Authority Links) stay byte-unchanged. TC12 + TC22 evidence.
- **W4-1 partner contract** (`packages/block-foundation/CONTRACT.md`)
  is **NOT modified**. The boundary's CONTRACT.md continues to
  cross-link to W4-1 governing how `kind='viz'` blocks compose with
  the boundary on the MDX/static render path; the partner contract
  stays as-is. Cross-link preserved per TC22.

## adr_touched

- **`docs/decisions/ADR-0014-heavy-block-boundary.md`** — **NOT
  edited.** Status remains `proposed`; promotion to `accepted` is
  A8 scope per locked Wave 4 plan Stage A close criterion #1. A4
  is the consumer of ADR-0014 (specifically D6 lines 247-285 for
  the CSS template + `prefers-reduced-motion` query + design-token
  variable consumption + hex fallbacks; D2 lines 117-140 for the
  SSR rendering + a11y semantics including `aria-busy` toggle per
  C2 absorbtion; D4 line 169 for plugin extensibility evidence via
  Test 11 on unregistered branded kind), not the editor. TC11
  evidence (no diff on ADR-0014).
- Per gatekeeper directive 2026-05-03 #1 + the A1/A2/A3 PR.md
  precedent, this `adr_touched` field explicitly lists ADR-0014
  even though no edits occur, since A4 is the fourth implementation
  PR materially advancing ADR-0014 acceptance criteria (#4 / #12 /
  #13 / #14 newly satisfied). Reviewers verify A4 diff aligns with
  ADR-0014 D6 CSS template (every CSS class block matches the JSX
  class names byte-for-byte; design-token variables consumed via
  `var(--skb-*, #hex)` form with the 7 fallback constants; `@media
  (prefers-reduced-motion: reduce)` block disables the spinner
  animation), D2 a11y semantics (`role="status"` + `aria-busy`
  toggle on Component-loaded / error states + `aria-live="polite"`
  only on text + `aria-hidden="true"` on frame + spinner; inner
  `__error` `role="alert"` preserved), and D4 plugin extensibility
  (unregistered branded kind `'3d-graph'` works through the same
  lifecycle).
- D2 Row 4 (new ADR required) is **NOT triggered** — ADR-0014
  already proposed at Pre-A2; A4 implements the existing ADR's D6 +
  D2 + D4 specs verbatim, no new design decision surfaces.

## acceptance

1. `packages/heavy-block-boundary/src/heavy-block-skeleton.css`
   NEW with all required class blocks (`.heavy-block-skeleton`
   outer + `.__frame` + `.__spinner` + `.__text` + `.__error` +
   `.__error-text` + `.__retry` with `:disabled` styling +
   `@keyframes skb-spinner` + `@media (prefers-reduced-motion:
   reduce)` block disabling the spinner animation) — TC2 + TC5
   evidence; ALL color / radius / font-size CSS uses
   `var(--skb-*, #hex-fallback)` form per ADR-0014 D6 lines 254-285;
   the 7 fallback hex constants (`#e5e7eb` border + spinner-track
   + retry-border, `#f9fafb` bg + retry-bg, `#3b82f6` spinner-fg,
   `#6b7280` text-secondary + error-text) match ADR-0014 D6 example
   verbatim — TC11 evidence (NO bare hex outside `var(...)` fallback
   positions).
2. `packages/heavy-block-boundary/package.json` declares
   `@skb/design-tokens: workspace:*` in a NEW `dependencies` block
   (parallels `block-callout` precedent) AND adds the
   `./heavy-block-skeleton.css` subpath to the `exports` map (parallels
   `block-callout`'s `./ui-default/callout.css` precedent) — TC13a
   + TC14 evidence. `peerDependencies` (`react` + `react-dom`) +
   `devDependencies` (8-dep set from A2) stay byte-unchanged.
3. `packages/heavy-block-boundary/tsconfig.json` `references` array
   includes `{ "path": "../design-tokens" }` (currently empty `[]`)
   — TC13b evidence; required for `tsc -b` composite-project dep
   ordering.
4. `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
   `aria-busy` toggles per ADR-0014 D2 + C2 absorbtion: `aria-busy
   = 'true'` while `Component === null && error === null` (initial
   load + retry-loading windows); `aria-busy = 'false'` when
   Component loaded OR error rendered (loaded = NOT busy; error =
   NOT busy because we're presenting the error state) — TC3 evidence;
   the A3 `// TODO(A4)` defer marker REMOVED — TC20a evidence.
5. AC#4 covered (Test 9): outer container `className === 'heavy-block-skeleton
   heavy-block-skeleton--jupyter'` exact match + `style.width ===
   '600px'` + `style.minHeight === '400px'` + exactly 3 child elements
   (`__frame` / `__spinner` / `__text` in JSX order) + outer container
   layout-stable across microtask flush — TC2 evidence.
6. AC#12 covered (Test 10): outer `role === 'status'` always + outer
   `aria-busy === 'true'` during loading + outer `aria-busy === 'false'`
   on Component-loaded + outer `aria-busy === 'false'` on error state
   + `__text` `aria-live === 'polite'` + `__frame` and `__spinner`
   `aria-hidden === 'true'` + inner `__error` div `role === 'alert'`
   (A3 regression check) — TC3 evidence.
7. AC#13 covered (Test 11): unregistered branded string kind
   `'3d-graph'` works through the same lifecycle (template-literal
   class suffix `--3d-graph` + `data-block='3d-graph'` + `load` called
   with AbortSignal + loaded component renders post-microtask-flush)
   — TC4 evidence; proves plugin extensibility per ADR-0014 C6 +
   D4.
8. AC#14 covered (Test 12): static CSS file content assertion via
   `node:fs` `readFileSync` resolved via `fileURLToPath(import.meta.url)`
   — file content contains `'@media (prefers-reduced-motion: reduce)'`
   substring AND a regex match for the `__spinner { animation: none }`
   rule INSIDE the media-query block — TC5 evidence.
9. `packages/heavy-block-boundary/CONTRACT.md` `## Invariants`
   section CONSOLIDATED: the placeholder paragraph "Full invariants
   land at A2-A4..." (lines 34-39 of current state) REPLACED with
   the canonical 8-bullet invariant list — TC12 evidence. The
   literal 8-bullet list (single-source authoritative; CONTRACT.md
   prose copies this block):

   ```markdown
   ## Invariants

   - **SSR byte-equivalence (A2; AC#3)**: server-render via
     `renderToString` produces DOM byte-equivalent to client first
     paint; React 18 `hydrateRoot` does NOT log a hydration
     mismatch warning. Outer container `<div data-block={kind}
     data-deferred="wave-4" role="status" aria-busy="true"
     style="width:..px;min-height:..px">` is identical between SSR
     and CSR pre-effect render.
   - **Mount-guard (A2; AC#10)**: post-unmount `setComponent` /
     `setError` calls are suppressed via a `mountedRef` guard. No
     React state-update warning fires when `load()` resolves or
     rejects after `unmount()`.
   - **AbortSignal cancellation (A2; AC#11)**: `load()` is invoked
     with `{ signal: AbortSignal }`; the signal's `aborted` flag
     flips to `true` on unmount (and on retry — see retry semantics
     below). Cleanup ordering: `mountedRef.current = false` BEFORE
     `controller.abort()` so the abort handler doesn't trigger a
     stale setState.
   - **Retry semantics (A3; AC#7+8+9)**: rejection (with
     `!signal.aborted`) renders error UI (errorText + retry button)
     + invokes `onLoadError(err, attempt)` telemetry. Retry button
     click increments `attempt` via `setAttempt(prev => prev + 1)`;
     useEffect re-runs via `[attempt]` dep array (effect cleanup
     naturally aborts prior controller; new run constructs fresh
     one). `maxRetries` (default 2) bounds retries: `canRetry =
     attempt <= resolvedMaxRetries`. After bound exhaustion, retry
     button is `disabled`. `setError(null)` on success transitions
     UI from error → loaded.
   - **CSS class invariants (A4; AC#4)**: outer container has class
     `heavy-block-skeleton heavy-block-skeleton--<kind>`. Children
     use BEM-style classes: `__frame`, `__spinner`, `__text`
     (loading state); `__error`, `__error-text`, `__retry` (error
     state). All design-token CSS variables use `var(--name,
     #hex-fallback)` form so the package renders meaningfully
     without `@skb/design-tokens` CSS injection.
   - **A11y semantics (A4; AC#12)**: outer container has
     `role="status"` always + `aria-busy="true"` during loading +
     retry-loading + `aria-busy="false"` when Component loaded OR
     error shown. `__text` has `aria-live="polite"` (load text
     changes are announced). `__frame` and `__spinner` have
     `aria-hidden="true"` (decorative). Error UI has `role="alert"`
     (stronger announcement complementing the status container).
   - **Reduced-motion (A4; AC#14)**: `@media (prefers-reduced-motion:
     reduce)` query disables spinner animation. CSS file
     `src/heavy-block-skeleton.css` is the canonical source.
   - **Plugin extensibility (A4; AC#13)**: arbitrary string `kind`
     values work (per ADR-0014 C6 branded widening); unregistered
     kinds get class suffix `--<kind>` and load lifecycle. Future
     plugin blocks need only export `<Kind>RenderView` +
     `heavyBoundaryDimensions` per ADR-0014 D5 (consumer wires the
     boundary).
   - **W4-1 partner invariant**: this contract pairs with
     `packages/block-foundation/CONTRACT.md` W4-1 governing how
     `kind='viz'` blocks compose with the boundary on the MDX/static
     render path.
   ```

   Lines 41-58 of CONTRACT.md (the W4-1 partner cross-link + editor
   out-of-scope note + Authority Links) stay byte-unchanged — TC22
   evidence.
10. `apps/site/src/components.ts` adds the SINGLE side-effect CSS
    import line `import '@skb/heavy-block-boundary/heavy-block-skeleton.css';`
    near the top of the file (after the existing JS import block;
    workspace convention discovered at PLAN-time grep:
    `apps/site/src/styles/global.css` lines 1-2 inject design-token
    CSS globally, but per-block CSS is loaded via component-module
    side-effect imports — A4 follows this pattern) — TC15 evidence.
    The A1 `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export at line
    22 stays intact (A5 removes it). The `componentsMap` at lines
    66-77 stays byte-unchanged (A5 substitutes the 3
    `makeHeavyBlockPlaceholder` calls with real `<HeavyBlockBoundary>`
    invocations).
11. `docs/plans/active.md` updated with the A3 row backfill (#TBD
    → #33; TBD → 92c8751 squash HEAD) + the Stage A remaining row
    decrement (`A4-A8 (5 PRs)` → `A5-A8 (4 PRs)`) + the next-PR
    pointer flips on lines 6 + 78 (Stage A4 → Stage A5; "CSS + a11y
    polish" → "apps/site dims migration; AC#15") + the top-line
    phase summary append "+ A4" — TC16 evidence. All other content
    of `docs/plans/active.md` byte-unchanged.
12. `pnpm-lock.yaml` change BOUNDED to the `@skb/design-tokens`
    workspace dep entry for `packages/heavy-block-boundary` —
    TC17a + TC17b evidence; idempotent install verified — TC17c
    evidence. Lockfile MUST be staged at commit per ADR-0006 D8 +
    memory `feedback_git_operator_explicit_stage` lockfile-blob
    rule.
13. `pnpm check` exit 0 globally — TC6 evidence; A4 does not regress
    any other package in the workspace.
14. `docs/decisions/ADR-0014-heavy-block-boundary.md` is byte-unchanged
    (status remains `proposed`; promotion to `accepted` is A8 scope
    per locked Wave 4 plan Stage A close criterion #1) — TC11
    referenced (TC11 not separately listed; the empty-diff check is
    a baseline assumption per A3 precedent + executor verifies).
15. D1 prop interface (`HeavyBlockKindRegistry` / `HeavyBlockKind`
    branded widening / `HeavyBlockDimensions` /
    `HeavyBlockBoundaryProps<P>`, A3 lines 1-30) is **byte-identical**
    to A3; A4 does NOT change the public surface — TC9 + TC19
    evidence; the A2 `.test-d.ts` fixture continues to assert
    generic `<P>` inference + branded widening (no regression).
16. AC#1 + AC#3 + AC#6 + AC#7 + AC#8 + AC#9 + AC#10 + AC#11 (A2+A3
    tests) all still PASS — TC1 evidence (no regression from A4
    aria-busy toggle + CSS + a11y additions). Particularly: AC#3
    (SSR/hydration byte-equivalence) MUST still hold — the
    `aria-busy="true"` static SSR-render becomes a derived expression
    `aria-busy={Component === null && error === null ? 'true' :
    'false'}` but on initial SSR the condition is true so the
    attribute renders `'true'` byte-identically to A3.
17. **Out-of-scope items deferred per Wave 4 plan A5-A8**: apps/site
    dims migration replacing `makeHeavyBlockPlaceholder` with real
    `<HeavyBlockBoundary>` calls + `heavyBoundaryDimensions` exports
    from the 3 heavy block packages (AC#15) — A5; playwright T0/T1
    layout-shift validation (AC#5) — A6; `*.astro` SSR variants 5×
    consolidation (Wave 3 C4a/C4b carry-over) — A7; selective
    per-block chunking + perf baseline (C5 carry-over) **+ ADR-0014
    promotion `proposed → accepted`** in same A8 commit (Stage A
    close gate per gatekeeper directive #3) — exhaustively
    enumerated in `## Out-of-scope` block.
18. Codex review iterations: expect **0-2 forward-fix rounds** (A2
    + A3 were R1 PASS; A4 has CONTRACT.md consolidation + 4 new
    tests + a CSS file + a side-effect CSS import wiring +
    workspace dep add + tsconfig refs add — more surface to review
    than A2/A3, allow more friction budget). Likely friction
    surfaces: (a) the CSS file's `var(--skb-*, #hex)` form vs the
    actual design-token names (`--color-*` triples) — reviewer may
    challenge the namespace mismatch; the explicit ADR-0014 D6
    line 282-284 fallback rationale + the explicit non-scope of
    adding tokens to `@skb/design-tokens` is the locked PLAN
    answer; (b) the `aria-busy` toggle on the error-state branch
    — reviewer may probe whether `'false'` is correct semantics
    (yes per ADR-0014 D2 + C2 absorbtion: error = NOT busy because
    we're presenting the error state, not loading); (c) the
    apps/site CSS import location (`components.ts` vs
    `styles/global.css` vs Astro layout) — reviewer verifies the
    chosen location matches workspace convention; (d) the
    CONTRACT.md 8-bullet invariant list accurately reflects A2 +
    A3 + A4 implementation (NOT aspirational drift); (e) the Test
    12 static CSS file path resolution via `import.meta.url` works
    in the vitest happy-dom environment.
19. **D1 stage 4 PRE-COMMIT CLAUDE REVIEW MANDATORY** per D2 Row 1
    HIT (CONTRACT.md `## Invariants` section consolidation is the
    architectural-surface change). Orchestrator-self walks the
    `## acceptance` bullets 1-20 + the CONTRACT.md 8-bullet
    invariant list against the actual `HeavyBlockBoundary.tsx` +
    `HeavyBlockBoundary.test.tsx` + CSS file diffs to verify the
    invariants accurately reflect implementation (mitigates
    same-model echo-chamber on the multi-stage invariant aggregation).
20. PR.md (`docs/plans/wave-4-main/A4-heavy-block-boundary-css-a11y.md`)
    is self-listed in the staged file list at commit time per
    ADR-0006 D8 strict whitelist (PR #1 R2 lesson; carried through
    Wave 3 + Pre-A1+A2+A3 + A1 + A2 + A3).

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): **HIT** — `packages/heavy-block-boundary/CONTRACT.md`
  `## Invariants` section is CONSOLIDATED in A4 (the placeholder
  paragraph "Full invariants land at A2-A4..." is REPLACED with
  the canonical 8-bullet invariant list per `## acceptance` bullet
  9 above). This is the **D1 stage 4 PRE-COMMIT CLAUDE REVIEW
  trigger**.
- **Row 2** (package add/remove): **NO** — `@skb/design-tokens` is
  a workspace-internal dep add, NOT a NEW workspace package.
  Workspace count stays at 23 (post-A1 baseline; the new
  `dependencies` block in `packages/heavy-block-boundary/package.json`
  only declares an existing workspace package as a runtime dep).
- **Row 4** (new ADR required): **NO** — ADR-0014 was already
  proposed at Pre-A2 + extended at Pre-A3 plan-lock; A4 implements
  the existing ADR's D6 + D2 + D4 specs verbatim, no new design
  decision surfaces.
- **Row 5** (cross ≥ 3 packages): **flag-only** — A4 touches
  `packages/heavy-block-boundary/*` (multiple files: CSS + JSX +
  package.json + tsconfig + test + CONTRACT.md) + `apps/site/*`
  (1 file) + `docs/plans/active.md` (doc-only bookkeeping; not a
  package). Effective package count = 2 (heavy-block-boundary +
  apps/site); not strictly 3. Per ADR-0011 D1 + plan-challenger
  Q5 absorbtion, Row 5 alone does NOT fire Stage 4. Row 1 is the
  binding trigger.
- **Row 8** (CI / build / deploy / auth / security): **NO** —
  pure in-package CSS + a11y polish + tests + apps/site CSS import
  + documentation bookkeeping; no CI workflow / deploy / auth /
  security surface change.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW MANDATORY** (Row 1 HIT;
CONTRACT.md consolidation is the meta-class architectural surface
mandating mitigation against same-model echo-chamber on the
multi-stage invariant aggregation).

## executor

Standard ADR-0011 D1 pipeline. Fourth non-bootstrap Wave 4 PR —
one shape difference from A2+A3 (Stage 4 PRE-COMMIT CLAUDE REVIEW
MANDATORY per D2 Row 1 HIT; A2+A3 were skip-stage-4 because no Row
1/4 hit).

**DEVIATION FROM PLAN**: Wave 4 plan A4 line 178 lists "executor:
`codex-css-stylist` (D7 routing — first viable scaffolder for
design-token-driven CSS)". A4 PR uses **`codex-generic-executor`**
instead. Justification (logged for reviewers):
- Multi-file scope (10 files including `package.json` + `tsconfig.json`
  + CONTRACT.md consolidation + 4 vitest tests + `apps/site/components.ts`
  CSS import + `active.md` bookkeeping + `pnpm-lock.yaml` graduation)
- CONTRACT.md invariant consolidation requires careful prose
  authoring across A2+A3+A4 spans, NOT just CSS scaffolding
- Consistent executor profile with A1+A2+A3 (proven flow; reduces
  friction on the workspace conventions the executor already learned)
- `codex-css-stylist` is best-suited for green-field CSS in
  isolation; A4 is integration-heavy
- Reviewer-codex still applies ADR-0006 8-point checklist + the
  standard A* hunts (the executor profile change does not weaken
  review)

- **PLAN**: `pr-writer` Claude subagent (this PR.md authored by
  pr-writer first invocation; orchestrator iterates 0-2 rounds
  before lock per ADR-0011 D1 stage 1 standard flow).
- **EXECUTE**: `codex-generic-executor` (gpt-5.5 + workspace-write
  sandbox per ADR-0011 D6 + Pre-A1-codified `--yolo` flag + R7
  piping + pipefail). Dispatch invocation form per Pre-A1 R7:
  `set -o pipefail; timeout 1200 codex exec --yolo --profile
  codex-generic-executor "$(cat /tmp/A4-prompt.md)" < /dev/null
  2>&1 | tee /tmp/codex-runs/2026-05-03-A4-generic-executor.txt >
  /dev/null`. Audit log archived per Pre-A1 R7 flow (head -2000 →
  `docs/audits/codex-runs/`). Executor reads PR.md `## files` +
  `## test_cases` + `## acceptance` + the in-scope ADR-0014 D6
  lines 247-285 (CSS template) + D2 lines 117-140 (a11y semantics
  + aria-busy toggle per C2 absorbtion) + D4 line 169 (plugin
  extensibility) + the A3 state of `HeavyBlockBoundary.tsx` +
  `HeavyBlockBoundary.test.tsx` + `CONTRACT.md`; TDD-front workflow
  per ADR-0011 D1 stage 2: writes the 4 new test assertions FIRST
  → confirms they FAIL against the A3 state (no CSS file, static
  `aria-busy="true"`, no plugin extensibility test, no reduced-motion
  assertion) → implements the A4 CSS asset + aria-busy toggle +
  package.json + tsconfig + apps/site CSS import + CONTRACT.md
  consolidation → confirms TC1-TC5 + the existing A2+A3 tests +
  skeleton.test.ts all PASS → runs TC6-TC23 → applies the
  `docs/plans/active.md` bookkeeping diff per acceptance bullet 11
  guidance → reports back. Pre-flight responsibility: confirm the
  10-file canonical list matches the diff; if any file outside
  the canonical list is touched (e.g., a transitive `pnpm install`
  re-resolves an unrelated dep version), graduate per acceptance
  bullet 12 collateral-drift slot.
- **REVIEW**: `codex-pr-reviewer-55` (ADR-0011 D1 stage 3 default
  reviewer; ADR-0006 8-point checklist mandatory). Audit log:
  `/tmp/codex-runs/2026-05-03-A4-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-03-A4-pr-reviewer-55.txt`
  truncated. Reviewer hunts especially for: (a) D1 prop interface
  byte-unchanged from A3 (TC19); (b) the cleanup ordering preserved
  (`mountedRef.current = false` BEFORE `controller.abort()` per A2
  reviewer-hunt contract — A4 does NOT touch this); (c) the new
  `aria-busy` derived expression correctly evaluates `'true'` only
  when `Component === null && error === null` (the boolean operator
  precedence is correct; the string return values match HTML
  attribute semantics); (d) the CSS file uses `var(--skb-*, #hex)`
  form for ALL color / radius / font-size (TC11 hunt — NO bare
  hex outside fallback positions); (e) the 7 fallback hex constants
  match ADR-0014 D6 example verbatim; (f) the `@media
  (prefers-reduced-motion: reduce)` block is correctly nested
  (top-level media query, NOT inside another rule) AND contains
  the `__spinner { animation: none }` rule; (g) the `dependencies`
  block in `package.json` is correctly placed (after `scripts`,
  before `peerDependencies`) and contains ONLY
  `@skb/design-tokens: workspace:*`; (h) the `exports` map
  correctly adds `./heavy-block-skeleton.css` subpath without
  breaking the existing `"."` entry; (i) the tsconfig `references`
  array correctly contains the SOLE entry `{ "path":
  "../design-tokens" }`; (j) the apps/site CSS import is a single
  line and does NOT create circular import order issues; (k) the
  CONTRACT.md 8-bullet invariant list accurately reflects A2 + A3
  + A4 implementation AND the W4-1 partner cross-link is preserved;
  (l) the `pnpm-lock.yaml` diff is bounded to the workspace dep
  entry; (m) `docs/plans/active.md` edits are scoped to the A3
  backfill + next-PR pointer flip + Stage A remaining decrement +
  top-line append (no edits to unrelated content); (n) PR.md
  self-listed in `## files`.
- **PRE-COMMIT CLAUDE REVIEW**: **MANDATORY** per D2 Row 1 HIT
  (CONTRACT.md consolidation). Orchestrator-self walks the
  `## acceptance` bullets 1-20 + the CONTRACT.md 8-bullet invariant
  list against the actual `HeavyBlockBoundary.tsx` +
  `HeavyBlockBoundary.test.tsx` + CSS file diffs to verify the
  invariants accurately reflect implementation (mitigates same-model
  echo-chamber on the multi-stage invariant aggregation per ADR-0011
  D2 v0.1.1 row 1 mandate). Orchestrator authorizes COMMIT only
  after the verification.
- **COMMIT (+ push)**: **reviewer codex** commits per ADR-0011 D1
  stage 5 (NOT orchestrator-self per ADR-0011 D1 + plan-challenger
  C6 absorbtion). Reviewer applies ADR-0006 D8 explicit-file-list
  staging: `git reset HEAD` → `git add <files per ## files
  canonical list = 10>` → `git diff --cached --stat` verify staged
  count matches `## files` canonical (10 baseline; +1 if
  `HeavyBlockBoundary.a11y.test.tsx` graduated per acceptance
  bullet 12 size-warn slot) → `git commit` → `git push`. Reviewer
  responsible for ensuring `pnpm-lock.yaml` IS staged (A4 changes
  it; lockfile blob discipline per memory
  `feedback_git_operator_explicit_stage`).
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per
  ADR-0011 D1 stage 6). Verifies the actual diff against this
  locked `## acceptance` block; flags scope creep (extra files
  outside the 10-canonical + EXECUTE graduations) or scope drop
  (missing files); outputs ACCEPT or REJECT-with-residue. Residue
  list flows back to orchestrator for follow-up sequencing.

## Out-of-scope (explicitly deferred)

- **A5** — apps/site dims migration: replace `makeHeavyBlockPlaceholder`
  factory calls with `<HeavyBlockBoundary>` invocations + import
  `heavyBoundaryDimensions` from each heavy block ui-default per
  ADR-0014 D5 + D8; remove the `__A1_HEAVY_BLOCK_BOUNDARY_REF`
  evidence-export. Per-block dims source from
  `heavyBoundaryDimensions` (AC#15) lands at A5. Heavy block
  packages (`packages/block-{jupyter,nn-viz,agent-flow}/`) gain
  the `heavyBoundaryDimensions: HeavyBlockDimensions` export from
  `ui-default/<kind>.ui.ts`.
- **A6** — Playwright T0/T1 layout-shift validation per AC#5
  (gatekeeper smoke #10 core mandate). Note memory
  `feedback_wsl2_chromium_launch`: WSL2 chromium launch fails
  locally; CI-only execution. A4 does NOT include playwright;
  static CSS file assertion (Test 12) covers AC#14 in vitest land.
- **A7** — `*.astro` SSR variants 5× consolidation (Wave 3 C4a/C4b
  carry-over).
- **A8** — Phase 2 selective per-block chunking + perf baseline
  (C5 carry-over) **+ ADR-0014 promotion `proposed → accepted`**
  in same A8 commit (Stage A close gate per gatekeeper directive
  #3).
- **Adding new tokens to `@skb/design-tokens`** — explicit non-scope
  per A4 directive: cross-package scope creep. The A4 CSS file
  uses `--skb-color-*` / `--skb-radius-*` / `--skb-font-size-*`
  token-name prefixes that do NOT exist in the current
  `packages/design-tokens/src/tokens.css` (which uses `--color-*`
  / `--radius-*` / `--text-*` prefixes with space-separated rgb-triple
  values); the hex fallback positions resolve authoritatively in
  this case (no cascade override applies). Future Stage B/C may
  add a contribution to design-tokens bridging `--skb-*` aliases
  to the existing `--color-*` rgb-triple values; that contribution
  is its own PR with its own CONTRACT.md update on the
  design-tokens side.
- **Editor (Tiptap NodeView) consumption**: ADR-0014 D9 explicit
  out-of-scope; editor stays unwrapped unless caller opts in.
  CONTRACT.md notes this; A4 does not change editor semantics.
- **Pre-wrapped helper exports** (`<Kind>RenderViewWithBoundary`)
  — ADR-0014 D4 line 193-194 lists this as an OPTIONAL future
  helper export per heavy block; A4 does NOT add the helper
  exports (each consumer wires the boundary explicitly per A5).
- **Runtime `matchMedia` simulation for `prefers-reduced-motion`**
  — Test 12 uses static CSS file content assertion via `node:fs`
  rather than runtime `window.matchMedia` simulation because
  happy-dom's `matchMedia` polyfill returns a stub that does NOT
  propagate matches into computed-style queries; runtime evaluation
  would require a JSDOM upgrade or a custom CSSOM polyfill, both
  out of scope for A4.

## Critical do-NOTs (A1+A2+A3 retrospective + A4-specific)

- DO NOT add new design tokens to `@skb/design-tokens` itself —
  cross-package scope creep; use ONLY existing tokens via
  `var(--name, #hex-fallback)`. The fallback hex resolves
  authoritatively for the `--skb-*` namespace which is intentionally
  NOT defined in `@skb/design-tokens` today.
- DO NOT modify `docs/decisions/ADR-0014-heavy-block-boundary.md`
  (A8 promotes status `proposed → accepted`).
- DO NOT modify D1 prop interface (lines 1-30 of
  `HeavyBlockBoundary.tsx`).
- DO NOT push to main directly.
- DO NOT use `--filter=@skb/...` (with `=`); use `--filter @skb/...`
  (with space) per workspace pnpm convention.
- DO NOT make markdown links to `~/.claude/...` paths per memory
  `feedback_lychee_user_local_paths`.
- DO NOT add `@skb/design-tokens` as `peerDependencies` — it's
  `dependencies` (the CSS file consumes its variables at runtime
  via cascade; not a JS API peer).
- DO NOT use `--no-verify` or skip pre-commit hooks per CLAUDE.md
  Hard rules.
- DO NOT split the CSS file into multiple files (the 80 LOC
  estimate is well under all size limits; one file = one canonical
  source).
- DO NOT re-export the CSS path through `index.ts` (workspace
  convention: CSS via `package.json` `exports` map; `index.ts`
  stays JS-only per `block-callout` precedent).
- DO NOT change the JSX class names in `HeavyBlockBoundary.tsx`
  (the CSS class names MUST match the JSX class names byte-for-byte;
  any rename breaks Test 9 + Test 11 + the entire visual rendering).

## Authority Links

- [Wave 4 plan A4 §](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  — locked plan, A4 lines 165-184
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  — D2 (a11y semantics + aria-busy toggle per C2 absorbtion), D4
  (plugin extensibility), D6 (CSS template + design-token variables
  + `prefers-reduced-motion` query + hex fallbacks), AC#4 / #12 /
  #13 / #14
- [ADR-0011 D1+D2 v0.1.1](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — execution model + D2 Row 1 trigger semantics
- [ADR-0007 D2](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
  — D2 trigger judgment table
- [ADR-0006 D8](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — explicit-file-list staging discipline
- [ADR-0008 D1](../../decisions/ADR-0008-wave-2-entry-policies.md)
  — dead-dep policy (declared AND used; the `@skb/design-tokens`
  workspace dep add satisfies this)
- [`packages/heavy-block-boundary/CONTRACT.md`](../../../packages/heavy-block-boundary/CONTRACT.md)
  — current state (placeholder invariants paragraph) → A4
  consolidates
- [`packages/block-callout/package.json`](../../../packages/block-callout/package.json)
  — workspace precedent for `dependencies: { @skb/design-tokens:
  workspace:* }` + `exports: { ./ui-default/callout.css: ... }`
- [`packages/design-tokens/src/tokens.css`](../../../packages/design-tokens/src/tokens.css)
  — actual workspace token names (`--color-*` / `--radius-*` /
  `--text-*` prefixes; A4 uses `--skb-*` namespace per ADR-0014 D6
  with hex fallbacks resolving authoritatively)
- [`apps/site/src/styles/global.css`](../../../apps/site/src/styles/global.css)
  — global design-token CSS injection (lines 1-2; verifies the
  cascade is in place workspace-wide)
- [A3 PR.md](A3-heavy-block-boundary-retry.md) — schema + prose
  density template
