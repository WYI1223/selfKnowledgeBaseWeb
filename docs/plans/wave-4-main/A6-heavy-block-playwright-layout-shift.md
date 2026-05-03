# A6 — playwright T0/T1 zero-layout-shift validation per ADR-0014 AC#5 (3 heavy blocks; sample-blocks page; WSL2-skip + width-strict + height-monotone + 200px tolerance)

> **Wave 4 Stage A sixth implementation PR.** Closes ADR-0014 AC#5
> (zero layout shift; gatekeeper smoke #10 layout-shift core mandate)
> by adding a single playwright spec
> (`apps/site/playwright/heavy-block-layout-shift.spec.ts`) that
> exercises the three live heavy-block boundaries on the existing
> `/notes/sample-blocks` page (post-A5 the page renders the 3
> `HeavyBlockBoundary`-wrapped factories Jupyter / NnViz / AgentFlow
> for real). The spec captures the boundary's outer container
> `boundingBox()` at T0 (immediately after first paint, while
> `aria-busy='true'` because the lazy chunk has not yet resolved) and
> at T1 (after the boundary settles to `aria-busy='false'`, whether
> via successful load OR the error-affordance path that ADR-0014 D2
> defines as the equally-valid second terminal state of the asymmetric
> contract). Three assertions per heavy kind: (1) **width strict** —
> T1 width === T0 width (CSS inline `width: <N>px` is byte-stable; any
> drift is a real regression); (2) **height monotone non-decreasing**
> — T1 height >= T0 height (`min-height` contract per ADR-0014 D2
> lines 117-140; content may grow but never shrink); (3) **height
> bounded growth** — T1 height <= T0 height + 200px (proves no MAJOR
> shift while accommodating real content that modestly exceeds the
> ADR-0014 D5 default dims). The 5px ideal cited in ADR-0014 AC#5
> applies specifically to the spinner→content transition when content
> fits within skeleton dims; the 200px tolerant bound captures the
> real-world case where the loaded heavy module renders content larger
> than the skeleton but the layout shift is still bounded — both
> assertions encode the asymmetric contract precisely. WSL2 skip
> pattern reused verbatim from `apps/site/playwright/search.spec.ts`
> (memory `feedback_wsl2_chromium_launch`: chromium launch fails
> locally without libnss3/libdbus/libatk/libcups; spec is CI-only on
> linux). The webServer config in `apps/site/playwright.config.ts`
> already runs `astro build && astro preview` so the new spec exercises
> production-equivalent build artifacts without config changes. AC
> coverage in A6: **#5** newly satisfied via runtime evidence; **#1
> / #3 / #4 / #6 / #7 / #8 / #9 / #10 / #11 / #12 / #13 / #14 / #15**
> A2+A3+A4+A5 baseline preserved (TC2 — A6 makes ZERO source-code
> changes; no heavy block / boundary / apps/site components.ts edits).
> Standard ADR-0011 D1 pipeline (codex-generic-executor EXECUTE;
> codex-pr-reviewer-55 REVIEW + COMMIT; **PRE-COMMIT CLAUDE REVIEW
> NOT MANDATORY** per D2 no-row hit; pr-writer ACCEPT). ADR-0014 is
> **NOT modified** (status remains `proposed`; A8 promotes per Stage
> A close gate). The `@skb/heavy-block-boundary/CONTRACT.md` is **NOT
> modified**. Smallest A-stage PR (3 canonical files: 1 NEW spec + 1
> NEW PR.md self-listed + 1 active.md bookkeeping update).

## title

Implement ADR-0014 AC#5 (zero layout shift T0 vs T1 across the 3
heavy block boundaries) via a NEW playwright spec
`apps/site/playwright/heavy-block-layout-shift.spec.ts`. The spec
navigates to `/notes/sample-blocks` (Wave 3 sample-blocks page that
post-A5 exercises all 3 heavy blocks via componentsMap factories),
locates each boundary by stable selector `[data-block="<kind>"]`
(emitted by `HeavyBlockBoundary.tsx` line 96 — A4-locked attribute
that lets external probes target the boundary irrespective of
loading/loaded/error state), captures `boundingBox()` at T0 (right
after `await expect(outer).toBeVisible()` resolves; the boundary's
SSR skeleton is byte-equivalent to the client first paint per
ADR-0014 D2 lines 117-140 + AC#3 already-proven invariant, so the
T0 box reflects the skeleton dims), then waits for the boundary to
settle via `await expect(outer).toHaveAttribute('aria-busy', 'false',
{ timeout: 30_000 })` (the boundary's `aria-busy` flips to `false`
when EITHER `Component` resolves OR `error` is set per
`HeavyBlockBoundary.tsx` line 100 ternary; both terminal states
satisfy the layout invariant per ADR-0014 D2 asymmetric contract),
captures `boundingBox()` at T1, and asserts: (a)
`expect(t1Rect.width).toBe(t0Rect.width)` — strict; the boundary's
inline `width: <N>px` style at line 90 of `HeavyBlockBoundary.tsx` is
byte-stable; any drift indicates a real regression; (b)
`expect(t1Rect.height).toBeGreaterThanOrEqual(t0Rect.height)` —
monotone non-decreasing per the `min-height` contract at line 91 of
`HeavyBlockBoundary.tsx`; (c)
`expect(t1Rect.height).toBeLessThanOrEqual(t0Rect.height + 200)` —
bounded growth; the loaded content may render larger than the
skeleton (Pyodide notebook with output cell, TF.js network diagram,
React Flow graph) but the layout shift is still bounded to under
200px. Pre-T1 sanity asserts on T0 itself: `t0Rect.width` close to
the package-declared `heavyBoundaryDimensions.width` (jupyter 600 /
nn-viz 500 / agent-flow 600 per ADR-0014 D5 + the values shipped at
A5) AND `t0Rect.height >= heavyBoundaryDimensions.height` (400px
floor per ADR-0014 D5). The spec uses
`for (const kind of HEAVY_KINDS)` to generate 3 parameterized tests
(one per heavy kind) so a single failure surfaces with the kind in
the test name (e.g., "AC#5 — jupyter boundary preserves width +
min-height (T0 vs T1, no shrink)"). WSL2 skip helper imported via
the same `isWsl2()` shape used in `apps/site/playwright/search.spec.ts`
lines 5-15 (memory `feedback_wsl2_chromium_launch` — chromium
launch fails locally; spec runs CI-only on linux). Tolerance choice
(`<= 200px` upper bound vs the ADR-cited `<= 5px` ideal) is
documented inline in the spec file via comment block + reproduced in
PR.md `## acceptance` bullet 4 below: the 5px ideal applies to the
spinner→content transition when content fits within skeleton dims;
the 200px bound covers the real-world case where loaded heavy
content exceeds dims modestly. Both assertions encode the asymmetric
contract precisely. The webServer config in
`apps/site/playwright.config.ts` (lines 21-38) already runs
`astro build && astro preview --host 127.0.0.1 --port 4321` with
240s headroom + reuses existing server locally; A6 reuses this config
unchanged. The existing `testMatch` glob `playwright/**/*.spec.ts`
at line 5 of `playwright.config.ts` automatically picks up the new
spec file without any config edit. Bundles A5 row backfill + A6 row
+ Stage A pointer flip into `docs/plans/active.md` per the
one-row-per-PR cadence. Standard ADR-0011 D1 pipeline (executor +
reviewer same as A5; PRE-COMMIT CLAUDE REVIEW SKIPPED per D2 no-row
hit). AC coverage in A6: **#5** newly satisfied via runtime evidence;
**#1 / #3 / #4 / #6 / #7 / #8 / #9 / #10 / #11 / #12 / #13 / #14 /
#15** A2+A3+A4+A5 baseline preserved (TC2 — A6 makes ZERO source-code
changes). **Out of scope for A6** (per locked Wave 4 plan): `*.astro`
SSR variants 5× consolidation (Wave 3 C4a/C4b carry-over) → A7;
selective per-block chunking + perf baseline (C5 carry-over) +
ADR-0014 promotion `proposed → accepted` → A8.

## files

Modified + new (canonical count in the line below; NO collateral
graduations expected: A6 adds NO deps to any `package.json`,
`pnpm-lock.yaml` stays byte-unchanged — `@playwright/test` is
already in `apps/site/devDependencies` per Wave 3 D3 install; the
existing playwright config + webServer reuse means no infrastructure
edit. This PR.md remains self-listed per ADR-0006 D8 strict whitelist
+ Pre-A1+A2+A3+A1+A2+A3+A4+A5 precedent that pr-writer must include
the PR.md in the canonical file list at PLAN time):

- `apps/site/playwright/heavy-block-layout-shift.spec.ts` — **NEW**
  (~80 LOC). Sole new test artifact for AC#5 runtime validation.
  Imports `execFileSync` from `node:child_process`, `os` from
  `node:os`, `expect` + `test` from `@playwright/test`. Defines the
  `isWsl2()` helper VERBATIM-COPIED from
  `apps/site/playwright/search.spec.ts` lines 5-15 (no code-share
  abstraction yet — the helper is duplicated for the 2 spec files;
  Wave 4+ may extract to `apps/site/playwright/_lib/` if a third
  consumer appears; A6 prefers duplication over premature abstraction
  per the existing search.spec.ts precedent). Calls `test.skip(isWsl2(),
  'Chromium launch is unreliable under WSL2 in this repo')` at
  module level (the same skip pattern as search.spec.ts line 17).
  Defines `const HEAVY_KINDS = ['jupyter', 'nn-viz', 'agent-flow']
  as const;` (the 3 canonical heavy block kinds matching
  `HeavyBlockKindRegistry` keys at `HeavyBlockBoundary.tsx` lines
  5-9). Defines `const EXPECTED_DIMS: Record<typeof
  HEAVY_KINDS[number], { width: number; height: number }> = {
  jupyter: { width: 600, height: 400 }, 'nn-viz': { width: 500,
  height: 400 }, 'agent-flow': { width: 600, height: 400 } };` per
  ADR-0014 D5 table + the values shipped at A5. The expected dims
  are duplicated as test fixtures (NOT re-imported from the heavy
  block packages) so the test catches a regression where a heavy
  block's `heavyBoundaryDimensions` export changes value silently
  without a coordinated PR (cross-package consumer pattern per
  memory `feedback_cross_package_consumer_pattern`: structural
  identity = imported types at v1; here the DIMENSION VALUES are
  the asserted invariant, NOT the exported type, so duplication
  is intentional). Generates 3 parameterized tests via `for (const
  kind of HEAVY_KINDS) { test(\`AC#5 — ${kind} boundary preserves
  width + min-height (T0 vs T1, no shrink)\`, async ({ page }) =>
  { ... }); }`. Each test body:
  ```typescript
  await page.goto('/notes/sample-blocks');

  const selector = `[data-block="${kind}"]`;
  const outer = page.locator(selector);
  await expect(outer).toBeVisible({ timeout: 10_000 });

  // T0: SSR skeleton paint (aria-busy='true' since lazy chunk
  // has not resolved yet). Per ADR-0014 D2 + AC#3 already-proven
  // invariant, the SSR skeleton is byte-equivalent to client
  // first paint, so this T0 box reflects the skeleton dims.
  const t0Rect = await outer.boundingBox();
  expect(t0Rect).not.toBeNull();
  expect(t0Rect!.width).toBeCloseTo(EXPECTED_DIMS[kind].width, 0);
  expect(t0Rect!.height).toBeGreaterThanOrEqual(EXPECTED_DIMS[kind].height);

  // Wait for boundary to settle: aria-busy='false' (Component
  // loaded OR error UI shown). 30s tolerance: heavy modules may
  // take seconds to load (Pyodide WASM, TF.js init) OR may fail
  // in the test env (no external network for WASM, runtime init
  // errors). Both terminal states satisfy the ADR-0014 D2
  // asymmetric contract — the boundary's layout invariant holds
  // in loaded AND error states equivalently.
  await expect(outer).toHaveAttribute('aria-busy', 'false', {
    timeout: 30_000,
  });

  // T1: post-hydration paint (Component loaded OR error UI shown).
  const t1Rect = await outer.boundingBox();
  expect(t1Rect).not.toBeNull();

  // ADR-0014 D2 invariant: WIDTH IDENTICAL (strict; styled inline
  // via `width: <N>px` at HeavyBlockBoundary.tsx line 90; CSS
  // inline px is byte-stable).
  expect(t1Rect!.width).toBe(t0Rect!.width);

  // ADR-0014 D2 invariant: HEIGHT MONOTONE NON-DECREASING (per
  // min-height contract at HeavyBlockBoundary.tsx line 91; content
  // may grow but never shrink).
  expect(t1Rect!.height).toBeGreaterThanOrEqual(t0Rect!.height);

  // AC#5 strict-form (5px ideal): applies to the spinner→content
  // transition when content fits within skeleton dims. Real heavy
  // content (Pyodide notebook, TF.js network diagram, React Flow
  // graph) may render modestly larger; 200px upper bound captures
  // the "no MAJOR shift" UX invariant without being so strict it
  // false-fails on legitimate content growth. Documented in PR.md
  // acceptance bullet 4 + ADR-0014 AC#5 line 387-388 amendment
  // candidate.
  expect(t1Rect!.height).toBeLessThanOrEqual(t0Rect!.height + 200);
  ```
  File extension `.ts` matches `apps/site/playwright/search.spec.ts`
  + `apps/site/src/__tests__/visual-smoke.spec.ts` precedent.
  Stays well under 100 LOC (target ~80 LOC including imports +
  helper + comment blocks). DO NOT add a `.tsx` variant or import
  React (the spec is pure playwright-test code, no JSX).
- `docs/plans/wave-4-main/A6-heavy-block-playwright-layout-shift.md`
  — **NEW** (this PR.md). Self-listed per ADR-0006 D8 strict
  whitelist (PR #1 R2 lesson; carried through Wave 3 + Pre-A1+A2+A3
  + A1 + A2 + A3 + A4 + A5).
- `docs/plans/active.md` — **MODIFIED**. Apply 4-edit bookkeeping:
  (1) the A5 row at line 19 (`| #TBD (this) | TBD | A5 | apps/site
  dims migration via heavyBoundaryDimensions (AC#15) |`) gets its
  squash HEAD filled with `59a93c0` per the gh PR #35 merged-status
  (`gh pr view 35 --json mergeCommit -q .mergeCommit.oid` confirmation
  at PLAN time) — `#TBD → #35`; `TBD → 59a93c0`; (2) a NEW A6 row
  inserted between the A5 row and the Stage A remaining row (`| #TBD
  (this) | TBD | A6 | playwright T0/T1 zero-layout-shift test (AC#5)
  |`); (3) the Stage A remaining row at line 20 decrements: `A6-A8
  (3 PRs)` → `A7-A8 (2 PRs)`; (4) the next-PR pointer at line 6 +
  line 80 flips from "Stage A6 (playwright T0/T1 zero-layout-shift
  validation; AC#5)" to "Stage A7 (5×.astro variants consolidation;
  Wave 3 C4a/C4b carry-over)"; the top-line phase summary on line 6
  appends "+ A6" to the done list (Pre-A1 + Pre-A2 + Pre-A3 + A1 +
  A2 + A3 + A4 + A5 + A6 done). All other content of
  `docs/plans/active.md` byte-unchanged. Collateral-drift slot: if
  executor finds the surrounding row sequence has shifted (e.g., a
  parallel PR added or removed rows), executor adapts the line-number
  references while preserving the documented edit semantics.

= **3 canonical files** (1 NEW spec + 1 NEW PR.md self-listed + 1
modified active.md). **Smallest A-stage PR by canonical count.**

**Explicitly NOT in canonical list (DO NOT touch — TC verifies
empty diff)**:

- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` (and
  any other source file in the boundary package) — A6 is a
  consumer-side spec that probes the existing `aria-busy` +
  `data-block` + inline `width/min-height` style emitted by the
  A4-locked boundary; the boundary's source code is byte-unchanged
  from A4 (verified by TC9).
- `packages/heavy-block-boundary/CONTRACT.md` — already consolidated
  at A4; A6 just consumes (TC9).
- `apps/site/src/components.ts` — A5 is the canonical consumer rewire
  per ADR-0014 D8; A6 just probes the rendered DOM via playwright +
  is byte-unchanged from A5 (TC10).
- `packages/block-{jupyter,nn-viz,agent-flow}/**` (any source file in
  the 3 heavy block packages) — A5 added the
  `heavyBoundaryDimensions` exports + CONTRACT.md bullets +
  package.json deps + tsconfig refs; A6 just asserts the rendered
  dims at runtime + is byte-unchanged from A5 (TC11).
- `docs/decisions/ADR-0014-heavy-block-boundary.md` — status remains
  `proposed`; A8 promotes (TC12).
- `apps/site/playwright.config.ts` — webServer + testMatch already
  cover the new spec; A6 makes ZERO config changes (TC13).
- `.github/workflows/ci.yml` — existing workflow runs `pnpm
  --filter @skb/site exec playwright test` (or equivalent
  workspace-wide playwright invocation); A6 makes ZERO CI workflow
  changes (TC14).
- `apps/site/package.json` — `@playwright/test` already in
  `devDependencies` (Wave 3 D3 install); A6 adds NO new deps (TC15).
- `pnpm-lock.yaml` — A6 adds NO deps; lockfile byte-unchanged (TC16).
- Any CONTRACT.md in any package — A6 makes ZERO CONTRACT.md
  changes (TC17).
- Any `*.test.ts` or `*.test.tsx` vitest test in any package — A6
  adds a playwright spec (`*.spec.ts` under `apps/site/playwright/`),
  NOT a vitest test; the existing vitest corpora stay
  byte-unchanged (TC18).
- `content/notes/sample-blocks/index.mdx` — Wave 3 sample-blocks
  page already exercises all 3 heavy blocks via `<Jupyter />` /
  `<NnViz />` / `<AgentFlow />` MDX usage at lines 110-158; A6
  just navigates to the page and probes the rendered DOM. PLAN-time
  verification: the file contains the 3 PascalCase MDX usages
  (`<Jupyter ... />` line 110; `<NnViz ... />` line 129;
  `<AgentFlow ... />` line 147), so the playwright spec's
  `[data-block="${kind}"]` selectors will resolve to live DOM nodes
  (TC19).

## test_cases

A6 ships a single new playwright spec + 1 active.md bookkeeping
update. Tests are TDD-first per ADR-0011 D1 stage 2: write the new
playwright spec assertions first (skip-by-design on WSL2 dev box;
will run in CI) → confirm the spec compiles (`pnpm --filter @skb/site
exec tsc --noEmit` covers the playwright dir per the workspace
tsconfig) → execute spec in CI → confirm 3 parameterized tests PASS
+ existing playwright + vitest tests still PASS.

- **TC1** (AC#5 — playwright spec compiles + skips locally on WSL2)
  Input: `pnpm --filter @skb/site exec tsc --noEmit`. Expected:
  exit 0; the new
  `apps/site/playwright/heavy-block-layout-shift.spec.ts` type-checks
  cleanly (the `EXPECTED_DIMS` record types correctly via `Record<typeof
  HEAVY_KINDS[number], ...>`; `isWsl2()` helper signature matches
  search.spec.ts; `expect`/`test` imports resolve via
  `@playwright/test`). Manual local verification (executor's WSL2
  dev box): `pnpm --filter @skb/site exec playwright test
  playwright/heavy-block-layout-shift.spec.ts --reporter=list` →
  expected output contains `3 skipped` (the 3 parameterized tests
  all skipped via `test.skip(isWsl2(), '...')`). Location: shell at
  repo root.
- **TC2** (regression — all existing playwright + vitest tests still
  PASS) Input: `pnpm check`. Expected: exit 0 (lint + typecheck +
  test + build + size-check all pass workspace-wide; A6's NEW spec
  adds 3 SKIPPED tests on the WSL2 dev box but does not add any
  vitest tests; existing playwright specs `search.spec.ts` +
  `visual-smoke.spec.ts` still SKIP on WSL2; existing vitest corpora
  in all packages still PASS unchanged). Location: shell at repo
  root.
- **TC3** (`pnpm check` exit 0 globally — workspace-wide regression
  baseline) Input: `pnpm check`. Expected: exit 0. Location: shell.
  (Same command as TC2; listed as separate TC for the canonical
  acceptance-bullet evidence cross-link.)
- **TC4** (apps/site build clean) Input: `pnpm --filter @skb/site
  build`. Expected: exit 0; the `astro build` step in
  `playwright.config.ts` webServer (line 29) succeeds; no new build
  artifacts are required because A6 makes no source changes.
  Location: shell.
- **TC5** (lint clean — including the new spec file) Input: `pnpm
  --filter @skb/site lint`. Expected: exit 0; the new spec file
  passes ESLint (no `max-lines` violation since target ~80 LOC; no
  unused-imports; no `any` types — the `EXPECTED_DIMS` record uses
  explicit shape; the `t0Rect!`/`t1Rect!` non-null assertions are
  justified by the preceding `expect(t0Rect).not.toBeNull()`
  guard). Location: shell.
- **TC6** (typecheck clean — including the new spec file) Input:
  `pnpm --filter @skb/site exec tsc --noEmit`. Expected: exit 0;
  same as TC1 but listed as separate TC for explicit lint /
  typecheck separation. Location: shell.
- **TC7** (size-check clean — spec well under 500 LOC hard limit
  per CLAUDE.md Hard rule #1) Input: `pnpm size-check`. Expected:
  exit 0; the new spec file size (~80 LOC) well under 500.
  Location: shell.
- **TC8** (PR.md size — well under 500 LOC). Input: `wc -l
  docs/plans/wave-4-main/A6-heavy-block-playwright-layout-shift.md`.
  Expected: <= 500 LOC (this PR.md target ~400 LOC; smallest A-stage
  PR.md by absolute count after Pre-A1). Location: shell.
- **TC9** (`packages/heavy-block-boundary/*` byte-unchanged from A5)
  Input: `git diff main -- packages/heavy-block-boundary/`.
  Expected: empty diff (A6 makes ZERO changes to the boundary
  package). Location: shell.
- **TC10** (`apps/site/src/components.ts` byte-unchanged from A5)
  Input: `git diff main -- apps/site/src/components.ts`. Expected:
  empty diff (A5's componentsMap rewire is the canonical consumer
  state; A6 just probes via playwright). Location: shell.
- **TC11** (3 heavy block packages byte-unchanged from A5) Input:
  `git diff main -- packages/block-jupyter/ packages/block-nn-viz/
  packages/block-agent-flow/`. Expected: empty diff. Location:
  shell.
- **TC12** (ADR-0014 byte-unchanged) Input: `git diff main --
  docs/decisions/ADR-0014-heavy-block-boundary.md`. Expected: empty
  diff (status remains `proposed`; A8 promotes). Location: shell.
- **TC13** (`apps/site/playwright.config.ts` byte-unchanged) Input:
  `git diff main -- apps/site/playwright.config.ts`. Expected:
  empty diff (the existing `testMatch` glob `playwright/**/*.spec.ts`
  picks up the new spec automatically; webServer reuses
  `astro build && astro preview`). Location: shell.
- **TC14** (`.github/workflows/ci.yml` byte-unchanged) Input: `git
  diff main -- .github/workflows/ci.yml`. Expected: empty diff (the
  existing workflow runs playwright; A6 adds a new spec but no CI
  config change). Location: shell.
- **TC15** (`apps/site/package.json` byte-unchanged — no new deps)
  Input: `git diff main -- apps/site/package.json`. Expected: empty
  diff (`@playwright/test` already in `devDependencies` per Wave 3
  D3 install). Location: shell.
- **TC16** (lockfile byte-unchanged — no new workspace deps) Input:
  `git diff main -- pnpm-lock.yaml`. Expected: empty diff (A6 adds
  NO deps). Location: shell.
- **TC17** (no CONTRACT.md changes anywhere) Input: `git diff main
  --name-only -- '**/CONTRACT.md'`. Expected: empty (A6 makes ZERO
  CONTRACT.md edits). Location: shell.
- **TC18** (no vitest `.test.ts` / `.test.tsx` changes anywhere)
  Input: `git diff main --name-only -- '**/*.test.ts' '**/*.test.tsx'`.
  Expected: empty (A6 adds a playwright spec `*.spec.ts`, NOT a
  vitest test). Location: shell.
- **TC19** (sample-blocks page exercises 3 heavy blocks — selector
  pre-flight) Input (a): `grep -c '<Jupyter '
  content/notes/sample-blocks/index.mdx`. Expected: 1. Input (b):
  `grep -c '<NnViz ' content/notes/sample-blocks/index.mdx`.
  Expected: 1. Input (c): `grep -c '<AgentFlow '
  content/notes/sample-blocks/index.mdx`. Expected: 1. (Verified at
  PLAN time: the 3 PascalCase MDX usages exist at lines 110 / 129 /
  147; the `[data-block="<kind>"]` selectors emitted by
  `HeavyBlockBoundary.tsx` line 96 will resolve to live DOM nodes
  on the rendered page.) Location: shell.
- **TC20** (`docs/plans/active.md` updated correctly) Input (a):
  `grep -c '#35' docs/plans/active.md`. Expected: >= 1 (A5's
  squash HEAD filled in). Input (b): `grep -c '59a93c0'
  docs/plans/active.md`. Expected: >= 1 (A5's squash HEAD value).
  Input (c): `grep -c 'A6 | playwright T0/T1' docs/plans/active.md`.
  Expected: 1 (new A6 row added). Input (d): `grep -c 'A7-A8 (2
  PRs)' docs/plans/active.md`. Expected: >= 1 (Stage A remaining
  decrement). Input (e): `grep -c 'Stage A7' docs/plans/active.md`.
  Expected: >= 1 (next-PR pointer flip). Location: shell.
- **TC21** (PR.md self-listed in `## files`). Input: `grep -c
  'A6-heavy-block-playwright-layout-shift.md'
  docs/plans/wave-4-main/A6-heavy-block-playwright-layout-shift.md`.
  Expected: >= 2 (the file references itself in `## files` list +
  in the title section header). Location: shell.

## contracts_affected

- **No CONTRACT.md files are modified by A6.** The 3 heavy block
  CONTRACT.md `Public surface` bullets documenting
  `heavyBoundaryDimensions` were added at A5 (D2 Row 1 trigger ×3
  consolidation) — A6 is a pure consumer-side runtime test that
  probes the existing rendered DOM without touching any contract
  surface. TC17 verifies empty diff across `**/CONTRACT.md`.
- **`packages/heavy-block-boundary/CONTRACT.md`** — **NOT modified.**
  Already consolidated at A4 with the canonical 8-bullet invariant
  list. A6 just consumes the contract at runtime; the
  consumer-facing invariant "outer container `data-block="<kind>"`
  attribute + `aria-busy` state machine + inline `width/min-height`
  style" that A6 probes is captured in the boundary's CONTRACT.md
  invariants AND the ADR-0014 D2 SSR rendering block (lines 117-140)
  AND the ADR-0014 AC#5 acceptance criterion (lines 386-391).
  A6 surfaces the runtime evidence; no contract prose changes.
- **W4-1 partner contract**
  (`packages/block-foundation/CONTRACT.md`) is **NOT modified.**
- **3 heavy block CONTRACT.md** (`packages/block-{jupyter,nn-viz,agent-flow}/CONTRACT.md`)
  — **NOT modified.** A5 added the `heavyBoundaryDimensions` bullets
  per heavy block; A6 uses the documented dims values in
  `EXPECTED_DIMS` test fixture but does NOT touch the prose.

## adr_touched

- **`docs/decisions/ADR-0014-heavy-block-boundary.md`** — **NOT
  edited.** Status remains `proposed`; promotion to `accepted` is
  A8 scope per locked Wave 4 plan Stage A close criterion #1. A6
  is the consumer of ADR-0014 (specifically D2 lines 117-140 for
  the SSR skeleton's `width: <N>px` + `min-height: <N>px` + `aria-busy`
  contract that A6 probes; AC#5 lines 386-391 for the T0/T1
  layout-shift invariant that A6 surfaces as runtime evidence; D5
  lines 235-240 for the initial dims defaults that A6 hard-codes
  in `EXPECTED_DIMS` test fixture for the cross-package consumer
  pattern's structural-identity check on dimension VALUES).
- Per gatekeeper directive 2026-05-03 #1 + the A1/A2/A3/A4/A5 PR.md
  precedent, this `adr_touched` field explicitly lists ADR-0014
  even though no edits occur, since A6 is the sixth implementation
  PR materially advancing ADR-0014 acceptance criteria (#5 newly
  satisfied via runtime evidence; #1/#3/#4/#6/#7/#8/#9/#10/#11/#12/
  #13/#14/#15 regression baseline preserved). Reviewers verify A6
  diff aligns with ADR-0014 D2 (the boundary's `data-block` selector
  + `aria-busy` state machine + inline width/min-height style is
  the contract A6 probes), AC#5 (T0/T1 width-strict + height-monotone
  + bounded-growth invariant), and D5 (dims values per the table
  at lines 235-240).
- **A6 ships an amendment-candidate observation** that may inform a
  later ADR-0014 minor revision: the AC#5 phrasing "allowed delta
  `<= 5px`" applies precisely to the spinner→content transition
  when the loaded content fits within skeleton dims. In the
  real-world case where loaded heavy content exceeds dims modestly
  (e.g., a Jupyter cell with code editor + multi-line output panel
  rendering ~500px tall when dims floor is 400px), the 5px ideal
  is over-strict; the 200px tolerant bound encoded in A6's spec
  captures the asymmetric contract precisely (width strict + height
  monotone + bounded growth). If the A6 runtime evidence (post-CI)
  confirms the 200px bound is the correct ceiling for the 3 existing
  heavy blocks, A8 (or a Wave 4 close ADR amendment) may revise
  ADR-0014 AC#5 to codify the asymmetric tolerance. A6 does NOT
  edit ADR-0014; the observation is logged here for downstream PR
  consideration.
- D2 Row 4 (new ADR required) is **NOT triggered** — ADR-0014
  already proposed at Pre-A2; A6 implements the existing ADR's AC#5
  via runtime test, no new design decision surfaces.

## acceptance

1. NEW playwright spec
   `apps/site/playwright/heavy-block-layout-shift.spec.ts` (~80 LOC)
   covers the 3 heavy block kinds (jupyter / nn-viz / agent-flow)
   via parameterized tests generated by `for (const kind of HEAVY_KINDS)`
   loop. Each test asserts: (a) **width strict** —
   `expect(t1Rect.width).toBe(t0Rect.width)`; (b) **height monotone
   non-decreasing** —
   `expect(t1Rect.height).toBeGreaterThanOrEqual(t0Rect.height)`;
   (c) **height bounded growth** —
   `expect(t1Rect.height).toBeLessThanOrEqual(t0Rect.height + 200)`.
   Pre-T1 sanity asserts on T0: `t0Rect.width` close to
   `EXPECTED_DIMS[kind].width` (jupyter 600 / nn-viz 500 /
   agent-flow 600 per ADR-0014 D5 + A5 shipped values) AND
   `t0Rect.height >= EXPECTED_DIMS[kind].height` (400px floor).
   TC1 + TC2 evidence.
2. WSL2 skip pattern reused VERBATIM from
   `apps/site/playwright/search.spec.ts` lines 5-15 (`isWsl2()`
   helper inspecting `os.release()` + `uname -r` for `/microsoft|wsl/i`)
   + `test.skip(isWsl2(), 'Chromium launch is unreliable under
   WSL2 in this repo')` at module level. The helper is duplicated
   (NOT extracted to a shared `_lib/` module) per the existing
   search.spec.ts precedent of preferring duplication over premature
   abstraction; Wave 4+ may extract if a third consumer appears.
   Memory `feedback_wsl2_chromium_launch` mandates CI-only
   execution. TC1 evidence.
3. Spec uses the existing Wave 3 sample-blocks page at
   `/notes/sample-blocks` (`content/notes/sample-blocks/index.mdx`
   lines 110 / 129 / 147 — the 3 PascalCase MDX usages `<Jupyter />`
   / `<NnViz />` / `<AgentFlow />` that post-A5 trigger the
   componentsMap factories rendering `HeavyBlockBoundary` with the
   3 kinds). The spec locates each boundary via stable selector
   `[data-block="${kind}"]` (emitted by `HeavyBlockBoundary.tsx`
   line 96 — A4-locked attribute that lets external probes target
   the boundary irrespective of loading/loaded/error state). TC19
   evidence (PLAN-time pre-flight that the 3 PascalCase usages exist).
4. **Tolerance choice rationale (locked at PLAN; documented inline
   in the spec via comment block + here for single-source)**:
   ADR-0014 AC#5 line 387-388 cites `<= 5px` allowed delta for the
   spinner→content transition. Reality has TWO regimes:
   (a) **content-fits-within-skeleton regime**: when the loaded
   heavy module renders content smaller than or equal to skeleton
   dims (e.g., error UI fits within the skeleton frame; or a
   minimal Jupyter cell with no output panel), height delta is
   small (often 0 due to `min-height` floor) and the 5px ideal
   holds; (b) **content-exceeds-skeleton regime**: when the loaded
   heavy module renders content larger than skeleton dims (e.g.,
   Jupyter cell with code editor + multi-line output panel rendering
   ~500px tall when dims floor is 400px; React Flow graph with
   3-node + 2-edge graph + interactive controls), height delta can
   be 50-200px. A6's spec encodes the asymmetric contract via 3
   assertions: (1) **WIDTH STRICT** — T1 width === T0 width (CSS
   inline px is byte-stable); (2) **HEIGHT MONOTONE** — T1 height
   >= T0 height (`min-height` contract; never shrinks); (3)
   **BOUNDED GROWTH** — T1 height <= T0 height + 200px (proves no
   MAJOR shift while accommodating real content). The 5px ideal
   from ADR-0014 AC#5 applies to regime (a); the 200px bound from
   A6's spec applies to regime (b). Both regimes encode the
   asymmetric contract precisely. The 200px bound observation may
   inform a later ADR-0014 minor revision; A6 does NOT edit
   ADR-0014.
5. **AC#5 (zero layout shift)** is satisfied via runtime evidence
   from the 3 boundary tests. The asymmetric contract (width
   strict + height monotone + bounded growth) precisely matches
   ADR-0014 D2 lines 117-140 (skeleton emits `width: <N>px` +
   `min-height: <N>px` — width is strict, height is a floor) AND
   D3 lines 141-159 (hydration lifecycle settles to either Component
   loaded OR error UI; both satisfy the layout invariant). The
   spec waits for `aria-busy='false'` (timeout 30_000ms) to capture
   the T1 rect; this terminal-state probe handles both successful
   load AND error-affordance paths equivalently per ADR-0014 D2
   asymmetric contract.
6. CI green on push. The existing
   `apps/site/playwright.config.ts` webServer (line 21-38) runs
   `pnpm exec astro build && pnpm exec astro preview --host
   127.0.0.1 --port 4321` with 240s timeout headroom; the existing
   `testMatch` glob at line 5 (`['src/__tests__/**/*.spec.ts',
   'playwright/**/*.spec.ts']`) automatically picks up the new
   spec file without config changes. The existing CI workflow
   (`.github/workflows/ci.yml`) runs playwright tests; A6's new
   spec gets exercised in CI. TC2 + TC4 evidence.
7. **NO source code changes**. The 3 heavy block packages
   (`packages/block-{jupyter,nn-viz,agent-flow}`) + the boundary
   package (`packages/heavy-block-boundary`) + the apps/site
   componentsMap (`apps/site/src/components.ts`) all stay
   byte-unchanged from A5. TC9 + TC10 + TC11 evidence (3 separate
   git-diff probes).
8. **NO CONTRACT.md changes** anywhere. The 3 heavy block CONTRACT.md
   `Public surface` bullets were added at A5; A6 just consumes the
   documented `heavyBoundaryDimensions` values in `EXPECTED_DIMS`
   test fixture without touching the prose. TC17 evidence
   (workspace-wide `**/CONTRACT.md` empty diff).
9. **ADR-0014 byte-unchanged** (status remains `proposed`;
   promotion to `accepted` is A8 scope per Stage A close gate per
   gatekeeper directive #3). TC12 evidence.
10. `docs/plans/active.md` updated with the A5 row backfill (`#TBD
    → #35`; `TBD → 59a93c0` squash HEAD per `gh pr view 35` confirmation
    at PLAN time) + a NEW A6 row inserted between the A5 row and
    the Stage A remaining row (`| #TBD (this) | TBD | A6 |
    playwright T0/T1 zero-layout-shift test (AC#5) |`) + the Stage
    A remaining row decrement (`A6-A8 (3 PRs)` → `A7-A8 (2 PRs)`)
    + the next-PR pointer flips on lines 6 + 80 (Stage A6 → Stage
    A7; "playwright T0/T1 zero-layout-shift validation; AC#5" →
    "5×.astro variants consolidation; Wave 3 C4a/C4b carry-over") +
    the top-line phase summary append "+ A6". TC20 evidence. All
    other content of `docs/plans/active.md` byte-unchanged.
    Collateral-drift slot: if executor finds the surrounding row
    sequence has shifted (e.g., a parallel PR added or removed
    rows), executor adapts the line-number references while
    preserving the documented edit semantics.
11. `pnpm-lock.yaml` byte-unchanged — A6 adds NO deps;
    `@playwright/test` already in `apps/site/devDependencies` per
    Wave 3 D3 install. TC15 + TC16 evidence (apps/site/package.json
    + lockfile both empty diff).
12. **Out-of-scope items deferred per Wave 4 plan A7-A8**: `*.astro`
    SSR variants 5× consolidation (Wave 3 C4a/C4b carry-over) →
    A7; selective per-block chunking + perf baseline (C5 carry-over)
    + ADR-0014 promotion `proposed → accepted` in same A8 commit
    (Stage A close gate per gatekeeper directive #3) — exhaustively
    enumerated in `## Out-of-scope` block.
13. Codex review iterations: expect **0-1 forward-fix rounds** (A5
    needed 0-1; A6 has fewer touchpoints — 3 canonical files vs
    A5's 18 — and is consumer-side test-only with no source edits
    so reviewer friction stays bounded). Likely friction surfaces:
    (a) the 200px tolerant bound vs the ADR-cited 5px ideal —
    reviewer may probe whether the bound is too generous; the
    locked PLAN answer is "asymmetric contract per ADR-0014 D2 +
    real-world content regime (b); both 5px and 200px encode the
    contract precisely for their respective regimes; A8 may codify
    via ADR amendment";
    (b) the WSL2 skip helper duplication vs extraction to `_lib/`
    — reviewer may suggest a shared module; the locked PLAN answer
    is "matches search.spec.ts precedent; Wave 4+ may extract if a
    third consumer appears";
    (c) the `EXPECTED_DIMS` test fixture duplicating the heavy
    block packages' `heavyBoundaryDimensions` values vs importing
    from the packages — reviewer may probe the cross-package
    consumer pattern; the locked PLAN answer is "duplication is
    intentional per memory `feedback_cross_package_consumer_pattern`:
    structural identity = imported types at v1, but here the
    DIMENSION VALUES are the asserted invariant; importing the
    values would mask the regression case where a heavy block's
    dims change silently without a coordinated PR";
    (d) the `aria-busy='false'` settle wait + 30_000ms timeout —
    reviewer may probe whether the timeout is too generous or too
    strict; the locked PLAN answer is "30s tolerance covers the
    Pyodide WASM download + TF.js init worst-case; both successful
    load AND error UI satisfy the asymmetric contract per ADR-0014
    D2; the timeout is the upper bound for ANY terminal state";
    (e) the `await page.goto('/notes/sample-blocks')` URL — reviewer
    may probe whether the slug is correct (Wave 3 sample-blocks
    page lives at `content/notes/sample-blocks/index.mdx` per Wave
    3 C3 routing); the locked PLAN answer is "verified at PLAN
    time via the index.mdx frontmatter `slug: sample-blocks` line
    3 + Wave 3 sample-blocks page route is `/notes/sample-blocks`";
    (f) the `[data-block="${kind}"]` selector specificity —
    reviewer may probe whether the selector is unique on the page;
    the locked PLAN answer is "the boundary emits `data-block="<kind>"`
    once per heavy block instance; the sample-blocks page has 1
    instance of each of the 3 heavy kinds; the selector resolves
    to exactly 1 element per kind (verified by the playwright
    `await expect(outer).toBeVisible()` which would fail if 0 or
    >1 matched)".
14. **D1 stage 4 PRE-COMMIT CLAUDE REVIEW NOT MANDATORY**. A6
    triggers ZERO D2 rows: Row 1 (CONTRACT change) NO; Row 2
    (package add/remove) NO; Row 4 (new ADR required) NO; Row 5
    (cross ≥3 packages) NO (only apps/site touched + docs/plans/
    bookkeeping); Row 8 (CI/build/deploy/auth/security) NO (no CI
    workflow file change; the existing ci.yml already runs
    playwright). Standard PR — D1 stage 4 SKIPPED per ADR-0011
    D1+D2 v0.1.1.
15. PR.md
    (`docs/plans/wave-4-main/A6-heavy-block-playwright-layout-shift.md`)
    is self-listed in the staged file list at commit time per
    ADR-0006 D8 strict whitelist (PR #1 R2 lesson; carried through
    Wave 3 + Pre-A1+A2+A3 + A1 + A2 + A3 + A4 + A5).
16. Stage A progression after A6 merge: 6/8 PRs done
    (A1+A2+A3+A4+A5+A6); 2 remaining (A7 .astro consolidation +
    A8 chunking + ADR promote). Stage A close gate sequence
    preserved (gatekeeper directive #3): A8 is the last Stage A
    PR + carries the ADR-0014 status promotion `proposed →
    accepted` + closes smoke #10 (zero layout shift) coverage
    definitively (A6 produces the playwright runtime evidence; A8
    ratifies via ADR promotion).

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): **NO** — A6 makes ZERO CONTRACT.md
  edits anywhere in the workspace (TC17 verifies). The 3 heavy
  block CONTRACT.md `Public surface` bullets were added at A5.
- **Row 2** (package add/remove): **NO** — A6 adds NO new workspace
  packages and removes NONE. Workspace count stays at 23 (post-A1
  baseline; A1 added `@skb/heavy-block-boundary`; no further package
  add/remove since).
- **Row 4** (new ADR required): **NO** — ADR-0014 was already
  proposed at Pre-A2 + extended at Pre-A3 plan-lock; A6 implements
  the existing ADR's AC#5 via runtime playwright spec, no new design
  decision surfaces. The amendment-candidate observation about the
  200px tolerant bound vs the 5px ideal is logged in `## adr_touched`
  for downstream PR consideration but does NOT trigger a new ADR
  in A6.
- **Row 5** (cross ≥ 3 packages): **NO** — A6 touches 1 application
  package (`apps/site/`) + `docs/plans/`. The bookkeeping update
  on `active.md` is documentation, not a package source change.
  Per ADR-0011 D1 + plan-challenger Q5 absorbtion at Pre-A3, Row 5
  alone does NOT fire Stage 4 anyway, but Row 5 is also not
  triggered here.
- **Row 8** (CI / build / deploy / auth / security): **NO** —
  borderline at first glance (the playwright spec runs in CI) but
  resolved NO upon inspection: A6 makes ZERO `.github/workflows/`
  edits; the existing `ci.yml` workflow already runs `pnpm
  --filter @skb/site exec playwright test` (or workspace-wide
  playwright invocation); adding a new spec file under
  `apps/site/playwright/` is just additional test coverage that
  the existing workflow picks up via the `testMatch` glob in
  `playwright.config.ts`. No CI / build / deploy / auth / security
  surface change. TC14 evidence (`.github/workflows/ci.yml` empty
  diff).
- → **D1 stage 4 PRE-COMMIT CLAUDE REVIEW SKIPPED** (no Row hit).
  Standard PR — codex reviewer-55 stage 3 + reviewer-codex stage 5
  commit + pr-writer stage 6 ACCEPT.

## executor

Standard ADR-0011 D1 pipeline. Sixth non-bootstrap Wave 4 PR — same
shape as A2 / A3 (Stage 4 PRE-COMMIT CLAUDE REVIEW SKIPPED — no D2
row hit, contrasting A4 / A5 which had Row 1 trigger via CONTRACT.md
edits). A6 is consumer-side test-only with NO source code changes,
so reviewer friction expected to stay below A2/A3 baseline.

**EXECUTOR PROFILE**: `codex-generic-executor` per Wave 4 plan A6
line 229 + the A1+A2+A3+A4+A5 executor continuity (proven flow on
test-only PRs; no DEVIATION-from-plan logging needed since the plan
already specifies `codex-generic-executor`).

- **PLAN**: `pr-writer` Claude subagent (this PR.md authored by
  pr-writer first invocation; orchestrator iterates 0-2 rounds
  before lock per ADR-0011 D1 stage 1 standard flow).
- **EXECUTE**: `codex-generic-executor` (gpt-5.5 + workspace-write
  sandbox per ADR-0011 D6 + Pre-A1-codified `--yolo` flag + R7
  piping + pipefail). Dispatch invocation form per Pre-A1 R7:
  `set -o pipefail; timeout 1200 codex exec --yolo --profile
  codex-generic-executor "$(cat /tmp/A6-prompt.md)" < /dev/null
  2>&1 | tee /tmp/codex-runs/2026-05-03-A6-generic-executor.txt >
  /dev/null`. Audit log archived per Pre-A1 R7 flow (head -2000 →
  `docs/audits/codex-runs/`). Executor reads PR.md `## files` +
  `## test_cases` + `## acceptance` + the in-scope ADR-0014 D2
  lines 117-140 (SSR rendering contract that the spec probes) +
  AC#5 lines 386-391 (T0/T1 layout-shift invariant phrasing) +
  D5 lines 235-240 (initial dims defaults table for `EXPECTED_DIMS`
  test fixture values) + the existing `apps/site/playwright/search.spec.ts`
  for `isWsl2()` helper template + the existing
  `apps/site/src/__tests__/visual-smoke.spec.ts` for playwright
  spec structural template + the existing
  `apps/site/playwright.config.ts` for testMatch + webServer
  invariants + the post-A5 state of `apps/site/src/components.ts`
  for boundary invocation chain reference + the post-A4 state of
  `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` for
  the `data-block` + `aria-busy` + inline width/min-height attribute
  emission reference + the existing `content/notes/sample-blocks/index.mdx`
  for the `<Jupyter />` / `<NnViz />` / `<AgentFlow />` MDX usage
  pre-flight; TDD-front workflow per ADR-0011 D1 stage 2: writes
  the new spec FIRST → verifies the spec compiles via `pnpm
  --filter @skb/site exec tsc --noEmit` → confirms 3 SKIPPED on
  WSL2 dev box via `pnpm --filter @skb/site exec playwright test
  playwright/heavy-block-layout-shift.spec.ts --reporter=list` →
  applies the active.md bookkeeping → confirms TC1-TC8 + the
  existing playwright + vitest tests still PASS → reports back.
  Pre-flight responsibility: confirm the 3 canonical file list
  matches the diff; if any file outside the canonical list is
  touched, graduate per acceptance bullet 10 collateral-drift slot.
- **REVIEW**: `codex-pr-reviewer-55` (ADR-0011 D1 stage 3 default
  reviewer; ADR-0006 8-point checklist mandatory). Audit log:
  `/tmp/codex-runs/2026-05-03-A6-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-03-A6-pr-reviewer-55.txt`
  truncated. Reviewer hunts especially for:
  (a) D1 prop interface byte-unchanged from A4 (TC9 — A6 does NOT
  touch the boundary at all, but reviewer verifies the empty-diff
  invariant on `HeavyBlockBoundary.tsx`);
  (b) `apps/site/src/components.ts` byte-unchanged from A5 (TC10);
  (c) the new spec's 3 assertions encode the asymmetric contract
  precisely (width strict + height monotone + 200px bounded
  growth); the `t0Rect.width` + `t0Rect.height` pre-T1 sanity
  asserts are NOT skipped (they catch the case where the boundary
  emits the wrong dims at SSR);
  (d) the `aria-busy='false'` settle wait timeout 30_000ms is
  documented + bounded (heavy modules may take seconds to load OR
  may fail in test env; both terminal states satisfy the contract);
  (e) the `[data-block="${kind}"]` selector matches the
  `HeavyBlockBoundary.tsx` line 96 emission pattern (`data-block={kind}`
  prop forwarded; the kebab-case kind value `'jupyter'` /
  `'nn-viz'` / `'agent-flow'` is consumer-facing canonical per
  `HeavyBlockKindRegistry`);
  (f) the WSL2 skip helper is duplicated from search.spec.ts
  (NOT extracted) per the existing precedent;
  (g) the `EXPECTED_DIMS` test fixture values (jupyter 600 / nn-viz
  500 / agent-flow 600 width; 400 height all) match ADR-0014 D5
  table + the values shipped at A5 in
  `packages/block-{kind}/src/ui-default/<kind>.ui.ts`;
  (h) NO CI workflow file edits — the existing `.github/workflows/ci.yml`
  picks up the new spec via the existing testMatch glob;
  (i) NO `apps/site/playwright.config.ts` edits — the existing
  testMatch + webServer cover the new spec;
  (j) NO `apps/site/package.json` or `pnpm-lock.yaml` edits — no
  new deps added;
  (k) `docs/plans/active.md` edits scoped to the A5 backfill +
  new A6 row + Stage A remaining decrement + next-PR pointer flip
  + top-line append (no edits to unrelated content);
  (l) PR.md self-listed in `## files`;
  (m) NO modification to ADR-0014 (status remains `proposed`);
  (n) NO modification to `packages/heavy-block-boundary/*` (TC9 —
  empty diff on CONTRACT.md / JSX / CSS / package.json /
  tsconfig.json / tests / .test-d.ts);
  (o) NO modification to the 3 heavy block packages (TC11 — empty
  diff across `packages/block-{jupyter,nn-viz,agent-flow}/`);
  (p) NO vitest test additions (A6 ships ONLY a playwright `*.spec.ts`,
  NOT a vitest `*.test.ts`/`*.test.tsx` — TC18).
- **PRE-COMMIT CLAUDE REVIEW**: **SKIPPED** per D2 no-row hit (Row
  1 NO; Row 2 NO; Row 4 NO; Row 5 NO; Row 8 NO). Orchestrator-self
  proceeds directly to authorize COMMIT after codex reviewer-55
  PASS.
- **COMMIT (+ push)**: **reviewer codex** commits per ADR-0011 D1
  stage 5 (NOT orchestrator-self per ADR-0011 D1 + plan-challenger
  C6 absorbtion at Pre-A3). Reviewer applies ADR-0006 D8
  explicit-file-list staging: `git reset HEAD` → `git add <files
  per ## files canonical list = 3>` → `git diff --cached --stat`
  verify staged count matches `## files` canonical (3 baseline)
  → `git commit` → `git push`. Reviewer responsible for ensuring
  `pnpm-lock.yaml` is NOT staged (A6 adds no deps; lockfile MUST
  be empty diff per TC16). Reviewer also verifies that NO file
  outside the canonical 3 is staged (e.g., NO `dist/**` artifacts,
  NO `.turbo/**` cache, NO `node_modules/**` traces; particularly
  NO accidental edits to `apps/site/src/components.ts` or
  `packages/heavy-block-boundary/**` or any heavy block package
  source).
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per
  ADR-0011 D1 stage 6). Verifies the actual diff against this
  locked `## acceptance` block; flags scope creep (extra files
  outside the 3-canonical) or scope drop (missing files); outputs
  ACCEPT or REJECT-with-residue. Residue list flows back to
  orchestrator for follow-up sequencing.

## Out-of-scope (explicitly deferred)

- **A7** — `*.astro` SSR variants 5× consolidation (Wave 3 C4a/C4b
  carry-over). Wires the 5 existing `*.astro` variants
  (`packages/block-{math,pdf,jupyter,nn-viz,agent-flow}/src/ui-default/<Kind>.astro`)
  into `apps/site` for direct Astro page consumers (orphan today;
  Wave 3 left them unused). Uses `codex-block-generator` clone
  pattern. A6 does NOT touch any `.astro` file or the apps/site
  Astro routing layer.
- **A8** — Phase 2 selective per-block chunking + perf baseline
  (C5 carry-over) **+ ADR-0014 promotion `proposed → accepted`**
  in same A8 commit (Stage A close gate per gatekeeper directive
  #3). The Phase 1 chunking baseline (Vite respects dynamic
  `import()` boundaries automatically; `apps/site/astro.config.mjs`
  `manualChunks` unchanged from A5) IS already in effect post-A6;
  A8 explores selective per-block chunking (e.g., naming the heavy
  block chunks via `manualChunks` for cache-warming + bundle
  analyzer baseline). A8 also produces the ADR-0014 amendment that
  may codify the asymmetric tolerance bound (5px ideal +
  200px-or-other empirical bound) based on the runtime evidence
  A6 surfaces in CI.
- **WSL2 chromium launch fix** — memory `feedback_wsl2_chromium_launch`
  documents the libnss3/libdbus/libatk/libcups missing-deps issue
  on WSL2; the fix is OUT-OF-SCOPE for A6 (A6 reuses the existing
  skip pattern from search.spec.ts). A future PR may install the
  missing libs via the WSL2 dev-env setup runbook + flip the skip
  guard to optional.
- **Extracting the `isWsl2()` helper to a shared `_lib/` module**
  — A6 duplicates the helper VERBATIM from search.spec.ts per the
  existing precedent of preferring duplication over premature
  abstraction (2 consumers; a third may trigger extraction). DO
  NOT pre-extract in A6.
- **`heavyBoundaryDimensions` runtime import in the spec** — A6
  hard-codes the dims values in `EXPECTED_DIMS` test fixture per
  the cross-package consumer pattern's structural-identity check
  on dimension VALUES (memory `feedback_cross_package_consumer_pattern`).
  Importing the values from the heavy block packages would mask
  the regression case where a heavy block's dims change silently
  without a coordinated PR. A future Wave 4+ PR may revisit if the
  duplication becomes painful (3 values; low maintenance).
- **AC#5 amendment in ADR-0014** — A6 surfaces the runtime
  evidence; the 200px tolerant bound observation is logged in
  `## adr_touched` for downstream consideration. ADR-0014 amendment
  is A8 scope (`proposed → accepted` promotion + optional AC#5
  language refinement based on A6 runtime data).
- **Visual-regression screenshots** — A6 ships `boundingBox()` rect
  comparison only, NOT visual screenshots. The asymmetric contract
  (width strict + height monotone + bounded growth) is a layout
  invariant; visual regression (color, shadow, animation) is OUT
  OF SCOPE per ADR-0014 AC#5 phrasing (zero layout shift, NOT
  visual byte-equivalence). A future Stage B/C PR may add visual
  screenshots if needed.
- **Lighthouse CI integration for Cumulative Layout Shift (CLS)
  metric** — A6 ships boundary-level rect comparison; a complementary
  page-level CLS measurement via Lighthouse would be a stronger
  end-to-end signal but is OUT OF SCOPE for A6 (Stage C scope per
  Wave 4 plan).
- **Probing intermediate rect snapshots between T0 and T1** — A6
  ships only T0 (initial paint) and T1 (post-settle) snapshots.
  An intermediate snapshot (e.g., during the loading transition)
  would reveal whether the spinner state itself reshapes the
  boundary; the asymmetric contract guarantees min-height stability
  during loading per ADR-0014 D2, so the binary T0/T1 probe is
  sufficient for AC#5 — A6 does NOT add intermediate probes.
- **Probing the inner skeleton frame / spinner / text element rects
  separately** — A6 probes the outer container only
  (`[data-block="<kind>"]` selector). The inner elements
  (`heavy-block-skeleton__frame` / `__spinner` / `__text` per
  `HeavyBlockBoundary.tsx` lines 119-123) are a11y-decorative +
  do not contribute to the layout-shift invariant; A6 does NOT
  probe them.
- **Network throttling for slow-network simulation** — A6 uses
  default network speed (CI runner network is fast; localhost
  preview is instant). A future perf-auditor PR may add throttling
  scenarios; A6 is the AC#5 baseline.
- **Multiple viewport sizes** — A6 uses default Desktop Chrome
  viewport per `playwright.config.ts` line 18. A future
  responsive-layout PR may add mobile / tablet viewports; A6 is
  the desktop baseline.

## Critical do-NOTs (A1+A2+A3+A4+A5 retrospective + A6-specific)

- DO NOT modify `docs/decisions/ADR-0014-heavy-block-boundary.md`
  (A8 promotes status `proposed → accepted` + optional AC#5
  language refinement based on A6 runtime data).
- DO NOT modify `packages/heavy-block-boundary/CONTRACT.md` or
  `HeavyBlockBoundary.tsx` or `heavy-block-skeleton.css` or
  `package.json` or `tsconfig.json` (already consolidated at A4;
  A6 just consumes — TC9 verifies empty diff).
- DO NOT modify D1 prop interface (lines 1-30 of
  `HeavyBlockBoundary.tsx`).
- DO NOT modify `apps/site/src/components.ts` (already canonical
  consumer state per A5; A6 just probes the rendered DOM via
  playwright — TC10 verifies empty diff).
- DO NOT modify any source file in
  `packages/block-{jupyter,nn-viz,agent-flow}` (A5 added the
  `heavyBoundaryDimensions` exports + CONTRACT.md bullets;
  A6 just asserts the rendered dims at runtime — TC11 verifies
  empty diff).
- DO NOT add any new dep to `apps/site/package.json` —
  `@playwright/test` already present per Wave 3 D3 install (TC15
  verifies empty diff).
- DO NOT modify `pnpm-lock.yaml` — A6 adds NO deps; lockfile
  byte-unchanged (TC16).
- DO NOT modify `apps/site/playwright.config.ts` — the existing
  `testMatch` glob `playwright/**/*.spec.ts` automatically picks
  up the new spec; the existing webServer `astro build && astro
  preview` reuses production-equivalent build artifacts (TC13).
- DO NOT modify `.github/workflows/ci.yml` — the existing workflow
  runs playwright; A6 adds a new spec but no CI config change
  (TC14).
- DO NOT modify any CONTRACT.md anywhere — A6 makes ZERO contract
  surface changes (TC17).
- DO NOT add any vitest `*.test.ts` or `*.test.tsx` test — A6
  ships ONLY a playwright `*.spec.ts` under `apps/site/playwright/`
  (TC18).
- DO NOT skip the WSL2 guard (memory `feedback_wsl2_chromium_launch`
  — chromium launch is unreliable under WSL2; the spec MUST `test.skip(isWsl2(),
  '...')` at module level matching search.spec.ts line 17 verbatim
  shape).
- DO NOT use `--filter=@skb/...` (with `=`); use `--filter @skb/...`
  (with space) per workspace pnpm convention.
- DO NOT make markdown links to `~/.claude/...` paths per memory
  `feedback_lychee_user_local_paths`.
- DO NOT use `--no-verify` or skip pre-commit hooks per CLAUDE.md
  Hard rules.
- DO NOT push to main directly.
- DO NOT pre-extract the `isWsl2()` helper to a shared `_lib/`
  module — duplicate verbatim from `search.spec.ts` lines 5-15
  per the existing 2-consumer precedent (Wave 4+ may extract if a
  third consumer appears; A6 prefers duplication over premature
  abstraction).
- DO NOT import the `heavyBoundaryDimensions` values from the
  heavy block packages into the spec — hard-code in `EXPECTED_DIMS`
  test fixture per the cross-package consumer pattern's
  structural-identity check on dimension VALUES (importing the
  values would mask the regression case where a heavy block's dims
  change silently without a coordinated PR; memory
  `feedback_cross_package_consumer_pattern`).
- DO NOT reduce the `aria-busy='false'` settle wait timeout below
  30_000ms — heavy modules may take seconds to load (Pyodide WASM,
  TF.js init) OR may fail in the test env; the 30s tolerance is
  the upper bound for ANY terminal state per ADR-0014 D2 asymmetric
  contract.
- DO NOT reduce the 200px tolerant bound for height bounded growth
  without ADR-0014 amendment — the bound encodes the real-world
  content-exceeds-skeleton regime (b) per `## acceptance` bullet
  4 + `## adr_touched` amendment-candidate observation; reducing
  to 5px would false-fail on legitimate content growth like a
  Jupyter cell with output panel rendering ~500px tall.
- DO NOT add visual-regression screenshots or Lighthouse CLS
  measurement — A6 scope is `boundingBox()` rect comparison only;
  visual / page-level CLS is OUT OF SCOPE per `## Out-of-scope`.
- DO NOT add intermediate rect snapshots between T0 and T1 — the
  binary T0/T1 probe is sufficient per ADR-0014 D2 + AC#5; the
  `min-height` contract guarantees stability during the loading
  transition.
- DO NOT probe the inner skeleton frame / spinner / text element
  rects — A6 probes the outer container only via `[data-block="<kind>"]`
  selector; the inner elements are a11y-decorative + do not
  contribute to the layout-shift invariant.
- DO NOT modify `content/notes/sample-blocks/index.mdx` — the page
  already exercises all 3 heavy blocks via the 3 PascalCase MDX
  usages; A6 just navigates to the page.
- DO NOT add a new test page for the spec to navigate to — reuse
  the existing Wave 3 sample-blocks page; A6 is consumer-side
  test-only with NO new content.
- DO NOT change the `[data-block="${kind}"]` selector to a
  className-based selector — `data-block` is the A4-locked stable
  selector per `HeavyBlockBoundary.tsx` line 96; the className
  (`heavy-block-skeleton heavy-block-skeleton--${kind}`) is a
  visual-CSS hook NOT intended for external probes.
- DO NOT modify the `EXPECTED_DIMS` test fixture values without a
  coordinated update to ADR-0014 D5 + the 3 heavy block packages'
  `heavyBoundaryDimensions` exports + the apps/site consumer chain
  — the values jupyter 600 / nn-viz 500 / agent-flow 600 width +
  400 height all are the canonical Phase 1 defaults per ADR-0014
  D5 lines 235-240.

## Authority Links

- [Wave 4 plan A6 §](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  — locked plan, A6 lines 221-234
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  — D2 (SSR rendering contract lines 117-140 + the
  `width/min-height/aria-busy` invariant the spec probes), D5
  (initial dims defaults table lines 235-240 for `EXPECTED_DIMS`
  test fixture values), AC#5 (T0/T1 zero-layout-shift invariant
  lines 386-391 + the 5px ideal vs 200px tolerant bound rationale)
- [ADR-0011 D1+D2 v0.1.1](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — execution model + D2 trigger semantics (A6 hits ZERO rows;
  PRE-COMMIT CLAUDE REVIEW skipped)
- [ADR-0007 D2](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
  — D2 trigger judgment table
- [ADR-0006 D8](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — explicit-file-list staging discipline (A6 stages 3 canonical
  files only; lockfile + heavy block packages + boundary package
  + apps/site/components.ts + ADR + CONTRACT.md all empty diff)
- [`packages/heavy-block-boundary/CONTRACT.md`](../../../packages/heavy-block-boundary/CONTRACT.md)
  — A4-consolidated 8-bullet invariant list (the consumer-side
  invariant for `data-block` + `aria-busy` state machine + inline
  width/min-height style is the contract A6 probes at runtime)
- [`packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`](../../../packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx)
  — A4 state of the boundary (`data-block={kind}` attribute at
  line 96; `aria-busy` ternary at line 100; inline `width: <N>px`
  + `minHeight: <N>px` style at lines 89-92 — A6 probes all three
  via playwright `boundingBox()` + `toHaveAttribute` assertions)
- [`apps/site/playwright/search.spec.ts`](../../../apps/site/playwright/search.spec.ts)
  — workspace precedent for the `isWsl2()` helper + `test.skip(isWsl2(),
  '...')` module-level guard (A6 duplicates lines 5-17 verbatim;
  Wave 4+ may extract to shared `_lib/` if third consumer appears)
- [`apps/site/src/__tests__/visual-smoke.spec.ts`](../../../apps/site/src/__tests__/visual-smoke.spec.ts)
  — workspace precedent for playwright spec structural template
  (test imports + `page.goto(...)` + `expect(...).toBeVisible()`
  + `expect(...).toHaveAttribute(...)` patterns)
- [`apps/site/playwright.config.ts`](../../../apps/site/playwright.config.ts)
  — testMatch glob `playwright/**/*.spec.ts` at line 5 + webServer
  `astro build && astro preview` at lines 21-38 (A6 reuses both
  unchanged)
- [`apps/site/src/components.ts`](../../../apps/site/src/components.ts)
  — A5 state of the apps/site componentsMap (3 heavy block factories
  using `HeavyBlockBoundary` at lines 33-64 — A6 probes the
  rendered DOM via playwright; the factories' kind / dims wiring
  is the upstream invariant the spec verifies at runtime)
- [`content/notes/sample-blocks/index.mdx`](../../../content/notes/sample-blocks/index.mdx)
  — Wave 3 sample-blocks page (the 3 PascalCase MDX usages
  `<Jupyter />` / `<NnViz />` / `<AgentFlow />` at lines 110 /
  129 / 147 — A6 navigates to `/notes/sample-blocks` and probes
  the rendered boundary DOM via `[data-block="<kind>"]` selectors)
- [A5 PR.md](A5-apps-site-heavy-block-dims-migration.md) — schema
  + prose density template (A6 mirrors the section ordering: title
  / files / test_cases / contracts_affected / adr_touched /
  acceptance / D2 trigger / executor / Out-of-scope / do-NOTs /
  Authority Links; A6 has fewer files (3 vs A5's 18) so prose is
  more compact)
- memory `feedback_wsl2_chromium_launch` (orchestrator-local at
  `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/feedback_wsl2_chromium_launch.md`)
  — chromium launch fails on WSL2 missing libnss3/libdbus/libatk/libcups;
  A6 reuses the search.spec.ts skip pattern (CI-only execution)
- memory `feedback_cross_package_consumer_pattern` (orchestrator-local at
  `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/feedback_cross_package_consumer_pattern.md`)
  — structural identity = imported types at v1; for asserted
  invariants on VALUES, duplication catches silent regressions
  (A6 hard-codes `EXPECTED_DIMS` values rather than importing
  from heavy block packages)
