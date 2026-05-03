# A2 — `HeavyBlockBoundary` core implementation (D1 props validation + D2 SSR confirmed + D3 hydration mount/load/abort)

> **Wave 4 Stage A second implementation PR.** Replaces the A1
> placeholder body of `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
> (function body lines 31-58, marked by the `// TODO(A2)` defer comment)
> with the real D3 hydration lifecycle: `useEffect` mount + `AbortController`
> + `useState<ComponentType<P>>` + `useRef` mount-guard + late-settlement
> no-op. Adds 5 vitest runtime tests + 1 `tsc --noEmit` type fixture
> covering ADR-0014 acceptance criteria #1, #2, #3, #6, #10, #11. D1
> prop interface (lines 4-29) is **byte-identical** to A1 — A2 does not
> change the public surface, only the internal lifecycle. CONTRACT.md
> is **NOT modified** (the placeholder note "full invariants land at
> A2-A4" stays — A4 will consolidate after CSS+a11y land). ADR-0014
> is **NOT modified** (still proposed; A8 promotes). Standard ADR-0011
> D1 pipeline (codex-generic-executor EXECUTE; codex-pr-reviewer-55
> REVIEW + COMMIT; PRE-COMMIT CLAUDE REVIEW NOT mandatory — no D2 row
> 1/4 hit; pr-writer ACCEPT).

## title

Implement ADR-0014 D3 hydration lifecycle in
`packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`: replace
the A1 placeholder body (lines 31-58 currently rendering only the D2
SSR skeleton DOM with a `// TODO(A2)` marker) with `useState<ComponentType<P> | null>(null)`
+ `useEffect` mount calling `load({ signal })` via a fresh
`AbortController` + `useRef<boolean>(true)` mount-guard gating the
`setComponent` call + cleanup function flipping the ref to `false` and
invoking `controller.abort()`. On resolve render the loaded component
with `childProps` forwarded inside the SAME outer `<div data-block ...>`
container (preserves dimensions for layout stability per ADR-0014 D3
step 8); pre-resolve and reject paths keep rendering the SSR skeleton
DOM (A3 wires the real error UI; A2 logs reject to `console.error`
as a placeholder + does NOT call `setComponent`). Reserve `useState<number>(1)`
for `attempt` count so A3 retry implementation does not churn the type
shape. D1 prop interface (`HeavyBlockKindRegistry` /
`HeavyBlockKind` branded widening / `HeavyBlockDimensions` /
`HeavyBlockBoundaryProps<P>` lines 4-29) is **byte-identical** to A1 —
no change to the public surface; verified at typecheck via the new
`HeavyBlockBoundary.test-d.ts` fixture. Add 5 vitest runtime tests
to a new `src/__tests__/HeavyBlockBoundary.test.tsx` file (note `.tsx`
because tests render JSX) covering AC#1 (component still exported as
function regression baseline) / AC#3 (SSR/hydration byte-equivalence
via React `consoleError` mock) / AC#6 (successful load path forwards
childProps) / AC#10 (mount-guard suppresses post-unmount state update)
/ AC#11 (`AbortSignal` propagation: `load` called with
`{ signal: AbortSignal }` + `signal.aborted === true` post-unmount).
Add a TS-only fixture file `src/__tests__/HeavyBlockBoundary.test-d.ts`
(picked up by tsconfig `include: ["src/**/*"]` glob; vitest `include:
['src/**/*.test.ts']` does NOT pick it up — no runtime cost) asserting
generic `<P>` inference on `childProps`, `// @ts-expect-error` on
mismatched childProps shape, `kind: 'jupyter'` valid, and `kind:
'unregistered-plugin'` valid (branded widening per C6 absorbtion
verified). AC#2 mechanism **locked** = `tsc --noEmit` on the
`.test-d.ts` fixture (no new dev-deps; matches workspace tsc-only
convention; cleaner than adding `tsd`/`expect-type`). AC coverage in
A2: **#1 / #2 / #3 / #6 / #10 / #11**. **Out of scope for A2** (per
locked Wave 4 plan): retry button (#7-#8) + `maxRetries` (#9) +
`onLoadError` telemetry + `errorText`/`retryLabel` render → A3; CSS
class polish + `prefers-reduced-motion` + `aria-busy` toggle + a11y
test (#4 + #12 + #14) → A4; apps/site dims migration (#15) → A5;
playwright T0/T1 layout-shift (#5) → A6; `*.astro` consolidation →
A7; selective per-block chunking → A8.

## files

Modified (canonical count in line below; 2 collateral files graduated
at EXECUTE per ADR-0011 D2 v0.1.1 SOTed-discipline collateral-drift
protocol: `packages/heavy-block-boundary/package.json` and
`packages/heavy-block-boundary/vitest.config.ts`. This PR.md remains
self-listed per ADR-0006 D8 strict whitelist + Pre-A1+A2+A3+A1
precedent that pr-writer must include the PR.md in the canonical file
list at PLAN time):

- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` —
  **MODIFIED**. D1 type definitions (lines 1-29: imports +
  `HeavyBlockKindRegistry` + `HeavyBlockKind` branded widening +
  `HeavyBlockDimensions` + `HeavyBlockBoundaryProps<P>`) **byte-identical**
  to A1; A2 does NOT change the public surface. Function body (lines
  31-58 in A1; the `// TODO(A2)` placeholder) replaced with the
  ADR-0014 D3 hydration lifecycle: (a) `useState<ComponentType<P> |
  null>(null)` for the loaded component; (b) `useState<number>(1)` for
  `attempt` count (placeholder for A3 retry — typed in A2 so A3
  doesn't churn); (c) `useRef<boolean>(true)` mount-guard
  (`mountedRef.current = true` initial; cleanup flips to `false`);
  (d) `useEffect` on mount creates a fresh `AbortController`, calls
  `load({ signal: controller.signal })`, awaits resolve, gates
  `setComponent(LoadedComponent)` behind `mountedRef.current`; (e)
  reject path logs to `console.error` (A3 wires real UI) + gates the
  log behind `!signal.aborted` so abort-driven rejections stay silent
  + does NOT call `setComponent`; (f) cleanup function flips
  `mountedRef.current = false` then calls `controller.abort()`; (g)
  render: when `Component !== null` render `<Component {...childProps} />`
  inside the SAME outer `<div data-block={kind} data-deferred="wave-4"
  ...>` container (preserves dimensions for layout stability per
  ADR-0014 D3 step 8); when `Component === null` render the existing
  D2 SSR skeleton DOM (frame + spinner + text children unchanged from
  A1). The `aria-busy="true"` on the outer container stays static in
  A2 (A4 toggles it to `"false"` post-load with a11y polish);
  `loadingText` resolution stays as in A1 (`loadingText ?? \`Loading
  ${kind}...\``). Stays under 200 LOC target / 300 LOC ESLint warn /
  500 LOC hard fail (A2 adds ~60-80 LOC of lifecycle to the ~60 LOC
  A1 file → est. ~120-140 LOC). The TODO(A2) marker is removed; a new
  `// TODO(A3): retry button + onLoadError + errorText render` and
  `// TODO(A4): aria-busy toggle + CSS classes + prefers-reduced-motion`
  comments may be added at the natural defer points.
- `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test.tsx`
  — **NEW**. Note `.tsx` extension (tests render JSX). Imports
  `HeavyBlockBoundary` from `../index` + `renderToString` from
  `react-dom/server` + `render` / `act` from
  `@testing-library/react`. 5 vitest tests:
  - **Test 1 (AC#1 regression)**: asserts `HeavyBlockBoundary` is
    defined + `typeof === 'function'` (preserves A1 baseline; the
    existing `skeleton.test.ts` keeps the same assertion as belt+
    suspenders).
  - **Test 2 (AC#3 SSR/hydration byte-equivalence)**: renders
    `<HeavyBlockBoundary kind='jupyter' dims={{width:600,height:400}}
    load={() => new Promise(()=>{})} childProps={{}} />` to string via
    `renderToString`; mounts the same JSX into a `document.body`
    container created in happy-dom; spies `console.error`; asserts the
    spy is NOT called with React's hydration mismatch message
    (substring match `'Hydration'` or `'did not match'`). Uses
    `hydrateRoot` from `react-dom/client` against a
    container pre-populated with the SSR string (the canonical React
    18 hydration mismatch detection path). Initial pre-effect DOM
    shape from CSR must structurally match the SSR string.
  - **Test 3 (AC#6 successful load path)**: defines `load = () =>
    Promise.resolve({ default: ({ name }: { name: string }) =>
    <div data-loaded='true'>{name}</div> })`; renders
    `<HeavyBlockBoundary kind='jupyter' dims={{width:600,height:400}}
    load={load} childProps={{ name: 'A2-OK' }} />`; awaits via
    `await waitFor(() => expect(screen.getByTestId(...)).toBe...)` or
    `act` flush of the resolved Promise microtask; asserts an element
    with `data-loaded='true'` is present + its textContent is
    `'A2-OK'` (proves childProps forwarded). Asserts the outer
    `data-block='jupyter'` container is still present (proves the
    same outer wrapper is preserved per ADR-0014 D3 step 8 layout
    stability invariant).
  - **Test 4 (AC#10 mount-guard / no post-unmount setState warning)**:
    constructs an externally-controllable Promise via `let resolveFn;
    const load = () => new Promise(r => { resolveFn = r; });`;
    `render(<HeavyBlockBoundary ...load={load} />)`; calls
    `unmount()`; THEN calls `resolveFn({ default: () => <div /> })`;
    flushes microtasks via `await act(async () => { await
    Promise.resolve(); })`; asserts `console.error` spy NOT called
    with React's `'Can't perform a React state update on an unmounted
    component'` substring (or the React 18 equivalent
    `'unmounted React node'` / `'memory leak'` warning). The spy is
    set up via `vi.spyOn(console, 'error').mockImplementation(...)`
    + `afterEach(() => spy.mockRestore())`.
  - **Test 5 (AC#11 AbortSignal propagation)**: defines `let
    capturedSignal: AbortSignal | undefined; const loadSpy = vi.fn(
    (init?: { signal?: AbortSignal }) => { capturedSignal = init?.signal;
    return new Promise(()=>{}); });`; renders the component;
    asserts `loadSpy` was called once with an `{ signal: AbortSignal
    }`-shaped arg (`capturedSignal instanceof AbortSignal` and
    `expect(loadSpy).toHaveBeenCalledWith({ signal: capturedSignal })`);
    calls `unmount()`; asserts
    `capturedSignal?.aborted === true` post-unmount (proves cleanup
    function called `controller.abort()`).
- `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test-d.ts`
  — **NEW**. TS-only type fixture; vitest.config.ts excludes
  `**/*.test-d.ts`, so Vitest does not runtime-discover this file.
  The meaningful assertions are TS `// @ts-expect-error` markers that
  fire under `tsc -b`. AC#2 mechanism **locked** = `tsc --noEmit`
  (effectively via `tsc -b` per
  `pnpm --filter @skb/heavy-block-boundary typecheck`).
  Fixture asserts:
  - `HeavyBlockBoundary<{ name: string }>({ kind: 'jupyter', dims:
    {width:1,height:1}, load: () => Promise.resolve({ default: ({name}:
    {name:string}) => null }), childProps: { name: 'ok' } })`
    — type-checks (positive).
  - `HeavyBlockBoundary<{ count: number }>({ kind: 'jupyter', dims:
    {width:1,height:1}, load: ..., // @ts-expect-error mismatched
    childProps shape; expect TS error here. childProps: { wrong: 'type'
    } })` — `// @ts-expect-error` triggers; if the typing regresses
    (e.g., `childProps` accidentally typed `any`), the comment fails
    tsc and surfaces the regression.
  - `kind: 'jupyter'` (known-kind narrowing) AND `kind:
    'unregistered-plugin'` (branded-widening per C6) both type-check.
    Negative assertion via `// @ts-expect-error` on a non-string `kind:
    123` (number) confirms widening is to `string`, not `unknown`.
  - Note: vitest type-check is disabled (`typecheck: { enabled: false
    }` in vitest.config.ts), so the fixture's TS assertions are
    enforced ONLY by `pnpm --filter @skb/heavy-block-boundary typecheck`
    (which runs `tsc -b` and includes `src/**/*` per tsconfig.json
    include glob). TC2 is the gate.
- `packages/heavy-block-boundary/package.json` — **MODIFIED /
  GRADUATED AT EXECUTE**. Adds runtime-test devDependencies needed by
  the A2 tests using the workspace-pinned versions:
  `@testing-library/react@^16.0.0`, `@types/react-dom@^18.3.0`,
  `happy-dom@^15.0.0`, and `react-dom@^18.3.0`. `react-dom` remains
  in peerDependencies; the devDependency makes React DOM server/client
  modules and tests available locally for this package.
- `packages/heavy-block-boundary/vitest.config.ts` — **MODIFIED /
  GRADUATED AT EXECUTE**. Matches the block package convention:
  `include: ['src/**/*.test.{ts,tsx}']`, `environment: 'happy-dom'`,
  `typecheck: { enabled: false }`, and defensive
  `exclude: ['**/*.test-d.ts']` so the type fixture is enforced only
  by `tsc -b`.
- `docs/plans/wave-4-main/A2-heavy-block-boundary-core.md` — this
  PR.md (self-listed per ADR-0006 D8 strict whitelist; PR #1 R2 lesson
  carried Wave 1+2+3 → Wave 4 Pre-A1+A2+A3 + A1).

= **6 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `pnpm-lock.yaml` — auto-updated by `pnpm install` because new
  package devDeps landed. EXECUTE added package-level devDeps for
  `@testing-library/react`, `@types/react-dom`, `happy-dom`, and
  `react-dom`; the lockfile diff is bounded to the
  `packages/heavy-block-boundary` importer moving `react-dom` from the
  peer-only dependency lock entry into devDependencies plus adding the
  new package devDep entries. TC11 verifies bounded scope. **MUST be
  staged at commit time per ADR-0006 D8** if any change occurs
  (lockfile blob discipline; memory `feedback_git_operator_explicit_stage`).
- `packages/heavy-block-boundary/tsconfig.json` — verified A1 has
  `include: ["src/**/*", "vitest.config.ts"]` which already picks up
  `.test-d.ts` files. No edit expected. EXECUTE pre-flight confirms.
- `packages/heavy-block-boundary/src/__tests__/skeleton.test.ts` —
  **UNCHANGED**. A1's trivial harness test stays as belt+suspenders
  for AC#1 alongside the new `HeavyBlockBoundary.test.tsx` Test 1.
- `packages/heavy-block-boundary/CONTRACT.md` — **NOT modified**. The
  placeholder note "full invariants land at A2-A4" stays; A2 satisfies
  AC#1/#2/#3/#6/#10/#11 (a subset) but A3 still adds retry semantics
  + A4 still adds CSS+a11y. Consolidation of invariants into
  CONTRACT.md happens at A4 close (after the final polish lands), per
  the locked Wave 4 plan A4 + A8 close criteria.
- `docs/decisions/ADR-0014-heavy-block-boundary.md` — **NOT modified**.
  Status remains `proposed`; promotion to `accepted` is A8 scope per
  locked Wave 4 plan Stage A close criterion #1. ADR-0014 D1/D2/D3
  text is the canonical authority A2 implements against; A2 is the
  consumer of the ADR, not the editor.
- `apps/site/src/components.ts` — **UNCHANGED**. A1's
  `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export survives intact in
  A2 (A5 removes it when migrating to real
  `<HeavyBlockBoundary>` consumption). A2 does NOT migrate apps/site
  to real boundary use; that's A5 scope per ADR-0014 D8.
- `apps/site/package.json` — **UNCHANGED**. A1's workspace dep stays.
- `packages/heavy-block-boundary/dist/**` / `.turbo/**` — gitignored.
- `pnpm-workspace.yaml` — already lists `packages/*` glob; no edit.
- `tsconfig.json` (workspace root) — verified at A1 EXECUTE that root
  does not enumerate package references; no edit.
- `docs/plans/active.md` — Wave 4 PR roster updated post-merge by
  orchestrator (ROUTINE post-merge bookkeeping; not part of the A2
  diff).
- `agent-contract.md` / generated configs — no agent-contract.md
  change in A2; no `pnpm generate:configs` regen.

## test_cases

A2 ships the runtime lifecycle + 5 vitest runtime tests + 1 tsc type
fixture. Tests are TDD-first per ADR-0011 D1 stage 2: write the 6
test files first → confirm they FAIL against the A1 placeholder body
→ implement the D3 lifecycle in `HeavyBlockBoundary.tsx` → confirm
the 6 tests + the existing `skeleton.test.ts` all PASS.

- **TC1** (AC#1 regression — component still exported as function)
  Input: `pnpm --filter @skb/heavy-block-boundary test`. Expected:
  exit 0; both `skeleton.test.ts` (1 test from A1) AND
  `HeavyBlockBoundary.test.tsx` Test 1 (AC#1 regression) PASS;
  asserts `HeavyBlockBoundary` defined + `typeof === 'function'`.
  Location: shell at repo root.
- **TC2** (AC#2 type-fixture via tsc — generic `<P>` inference +
  branded widening; `// @ts-expect-error` markers behave as expected)
  Input: `pnpm --filter @skb/heavy-block-boundary typecheck`.
  Expected: exit 0; `tsc -b` includes `src/__tests__/HeavyBlockBoundary.test-d.ts`
  via tsconfig `include: ["src/**/*"]` glob; positive assertions
  type-check; each `// @ts-expect-error` marker triggers an actual
  TS error (if a marker doesn't trigger because the typing regressed
  to `any`, tsc errors `Unused '@ts-expect-error' directive` and the
  typecheck fails). AC#2 mechanism **locked**. Location: shell.
- **TC3** (AC#3 SSR/hydration byte-equivalence — no React hydration
  mismatch warning) Input: `pnpm --filter @skb/heavy-block-boundary
  test`. Expected: `HeavyBlockBoundary.test.tsx` Test 2 PASS;
  `console.error` spy NOT called with `'Hydration'` / `'did not
  match'` substring; SSR `renderToString` output structurally matches
  the CSR pre-effect first render. Location: shell. Verification
  inside test: spy assertion + structural DOM check on the
  hydrated container.
- **TC4** (AC#6 successful load path — childProps forwarded to the
  loaded component) Input: `pnpm --filter @skb/heavy-block-boundary
  test`. Expected: `HeavyBlockBoundary.test.tsx` Test 3 PASS; after
  `await waitFor(...)` of the Promise resolution + React commit, the
  DOM contains an element with `data-loaded='true'` whose
  `textContent === 'A2-OK'` (proves the `name` childProp threaded
  through the loaded component); the outer
  `<div data-block='jupyter'>` container is still present (layout
  stability per ADR-0014 D3 step 8). Location: shell.
- **TC5** (AC#10 mount guard — no post-unmount setState warning)
  Input: `pnpm --filter @skb/heavy-block-boundary test`. Expected:
  `HeavyBlockBoundary.test.tsx` Test 4 PASS; after `unmount()` then
  `resolveFn(...)` + microtask flush, `console.error` spy is NOT
  called with React's post-unmount warning substrings (`"Can't
  perform a React state update on an unmounted component"` / `"unmounted
  React node"` / `"memory leak"`). Location: shell.
- **TC6** (AC#11 AbortSignal propagation — `load` called with
  `{ signal: AbortSignal }`; `signal.aborted === true` post-unmount)
  Input: `pnpm --filter @skb/heavy-block-boundary test`. Expected:
  `HeavyBlockBoundary.test.tsx` Test 5 PASS;
  `expect(loadSpy).toHaveBeenCalledWith({ signal: expect.any(AbortSignal)
  })` succeeds AND `expect(capturedSignal?.aborted).toBe(true)`
  succeeds after `unmount()`. Location: shell.
- **TC7** (`pnpm check` exit 0 globally — workspace-wide regression
  baseline) Input: `pnpm check`. Expected: exit 0 (lint + typecheck
  + test + build + size-check all pass across the workspace; A2's
  changes do not regress any other package). Location: shell.
- **TC8** (Package builds clean) Input:
  `pnpm --filter @skb/heavy-block-boundary build`. Expected: exit 0
  (`tsc -b` produces dist/ outputs without diagnostics; new
  `useEffect`/`AbortController`/`useRef`/`useState` lifecycle code
  compiles cleanly). Location: shell.
- **TC9** (Lint clean for the package) Input:
  `pnpm --filter @skb/heavy-block-boundary lint`. Expected: exit 0;
  ESLint flags no issues on `HeavyBlockBoundary.tsx` (the modified
  file) or the 2 new test files; `max-lines` 300 warn threshold not
  hit (file estimated ~120-140 LOC). Location: shell. Memory
  `feedback_codex_spark_lint_gap` notes lint is independent of
  vitest PASS — TC9 is a hard gate.
- **TC10** (Size check clean — 500 LOC hard fail) Input:
  `pnpm size-check`. Expected: exit 0; no file in
  `packages/heavy-block-boundary/src/` exceeds 500 LOC; the modified
  `HeavyBlockBoundary.tsx` est. ~120-140 LOC, well under the limit;
  the 2 new test files each est. ~80-120 LOC, also well under.
  Location: shell.
- **TC11** (`pnpm-lock.yaml` change bounded — only NEW devDeps if any
  added; no unrelated dep version drift) Input:
  `git diff main -- pnpm-lock.yaml`. Expected: diff contains ONLY
  the new devDep entries that EXECUTE adds
  (`@testing-library/react`, `@types/react-dom`, `happy-dom`,
  `react-dom`) registered to the `packages/heavy-block-boundary`
  devDependencies block; no other package importer versions move.
  Verification: `git diff main -- pnpm-lock.yaml | grep -c '^+' `
  bounded; manual scan for unrelated `+` lines on top-level packages.
  Location: shell. If zero new devDeps land (unlikely, but possible
  if workspace already vendors all transitively), expected diff
  empty.
- **TC12** (Idempotent install) Input: `pnpm install` × 2. Expected:
  second run reports "Lockfile is up to date" and the `pnpm-lock.yaml`
  hash is unchanged across the two runs.
  Location: shell.
- **TC13** (Link-check passes via CI) Input:
  `.github/workflows/link-check.yml` on push to feature branch.
  Expected: workflow `success` conclusion (lychee CI-only per Wave 3
  baseline). Location: GitHub Actions. PR.md links here are all
  relative paths to in-repo files using plain path form (no `:line`
  suffix per memory `feedback_lychee_line_anchor`); no `~/.claude/...`
  markdown link form per memory `feedback_lychee_user_local_paths`.
- **TC14** (CONTRACT.md byte-unchanged) Input:
  `git diff main -- packages/heavy-block-boundary/CONTRACT.md`.
  Expected: empty diff (zero bytes changed). A2 explicitly does NOT
  modify the consumer-side contract; the placeholder "full invariants
  land at A2-A4" prose stays, since A4 finalizes the polish.
  Location: shell.
- **TC15** (ADR-0014 byte-unchanged) Input:
  `git diff main -- docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: empty diff. A2 does NOT modify the ADR; promotion is A8.
  Location: shell.
- **TC16** (D1 prop interface byte-unchanged from A1) Input:
  `git diff main -- packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx
  | grep -E '^[-+]' | grep -E 'HeavyBlockKindRegistry|HeavyBlockKind|HeavyBlockDimensions|HeavyBlockBoundaryProps|__heavyBlockKind'`.
  Expected: empty (no `-`/`+` lines on the public type definitions;
  only `useEffect`/`useState`/`useRef`/`AbortController` and their
  associated render code change). Verifies A2 ships the lifecycle
  WITHOUT drifting the public surface. Location: shell.
- **TC17** (`HeavyBlockBoundary.tsx` D3 lifecycle present) Input
  (a): `grep -cE 'useEffect|useState|useRef' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 3 (one of each hook called). Input (b):
  `grep -cE 'AbortController|controller\\.abort\\(\\)' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 2 (controller construction + abort call in cleanup).
  Input (c):
  `grep -cE 'mountedRef|mountedRef\\.current' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 2 (ref initial + cleanup flip + setComponent guard).
  Location: shell.
- **TC18** (TODO marker for A2 removed; A3/A4 markers added)
  Input (a): `grep -cE 'TODO\\(A2\\)' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: 0 (A2 marker gone — A2 is no longer pending). Input (b):
  `grep -cE 'TODO\\(A3\\)|TODO\\(A4\\)' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 1 (at least one of the deferred-scope markers; ideally
  one for retry/onLoadError → A3 and one for aria-busy/CSS/reduced-motion
  → A4). Location: shell.

## contracts_affected

- **None edited.** `packages/heavy-block-boundary/CONTRACT.md` is
  **byte-unchanged** in A2 — TC14 evidence. The placeholder note
  "full invariants land at A2-A4" stays intact. A2 satisfies a subset
  of the eventual deep invariants (mount-guard via AC#10, AbortSignal
  cancellation via AC#11, SSR byte-equivalence via AC#3) but A3 still
  adds retry semantics and A4 still adds CSS+a11y. Consolidating the
  invariants into the CONTRACT.md prose is the A4 close gate per
  locked Wave 4 plan A4 + the natural pattern of editing CONTRACT.md
  once the full polish lands rather than incrementally.
- The list of AC#-numbers covered in A2 (`#1 / #2 / #3 / #6 / #10 /
  #11`) is captured in this PR.md `## acceptance` block + audit log;
  it does NOT trigger CONTRACT.md edit.

## adr_touched

- **None edited.** `docs/decisions/ADR-0014-heavy-block-boundary.md`
  is **byte-unchanged** in A2 — TC15 evidence. A2 implements ADR-0014
  D1 (prop signature unchanged from A1) + D2 (SSR DOM shape unchanged
  from A1) + D3 (hydration lifecycle newly implemented per the verbatim
  steps 1-8). ADR-0014 status remains `proposed`; promotion `proposed
  → accepted` happens at A8 per locked Wave 4 plan Stage A close
  criterion #1.
- Per gatekeeper directive 2026-05-03 #1 + the A1 PR.md precedent,
  this `adr_touched` field explicitly lists ADR-0014 even though no
  edits occur, since A2 is the second implementation PR materially
  advancing ADR-0014 D3 acceptance criteria. Reviewers verify A2 diff
  aligns with ADR-0014 D3 steps 1-3 + 6 (cancellation) + the C1
  mount-guard absorbtion + the C5 bounded-attempt absorbtion (A3
  enforces the bound; A2 just reserves the type).

## acceptance

1. `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` function
   body (A1 lines 31-58 — the `// TODO(A2)` placeholder rendering only
   the D2 SSR skeleton DOM) is replaced with the ADR-0014 D3 hydration
   lifecycle: `useState<ComponentType<P> | null>(null)` for the loaded
   component + `useState<number>(1)` for `attempt` count (reserved for
   A3) + `useRef<boolean>(true)` mount-guard + `useEffect` mount creating
   a fresh `AbortController` + `load({ signal })` invocation +
   `setComponent` gated behind `mountedRef.current` + cleanup flipping
   the ref to `false` and calling `controller.abort()` — TC4 (AC#6) +
   TC5 (AC#10) + TC6 (AC#11) + TC17 evidence.
2. D1 prop interface (`HeavyBlockKindRegistry` / `HeavyBlockKind`
   branded widening / `HeavyBlockDimensions` / `HeavyBlockBoundaryProps<P>`,
   A1 lines 1-29) is **byte-identical** to A1; A2 does NOT change the
   public surface — TC2 + TC16 evidence; the `.test-d.ts` fixture
   asserts generic `<P>` inference still works on `childProps` and
   the `// @ts-expect-error` markers verify type narrowness.
3. D2 SSR skeleton DOM (the outer `<div data-block={kind}
   data-deferred='wave-4' role='status' aria-busy='true' style='...'>`
   + frame + spinner + text children) renders byte-equivalent to the
   CSR pre-effect first render — TC3 (AC#3) evidence; React's
   `consoleError` spy is NOT called with hydration mismatch substrings
   under `hydrateRoot` against the SSR string.
4. AC#1 (component still exported as function from package barrel) is
   maintained — A1's `skeleton.test.ts` PASSES unchanged AND
   `HeavyBlockBoundary.test.tsx` Test 1 (AC#1 regression) PASSES;
   TC1 evidence.
5. **AC#2 mechanism locked**: `tsc --noEmit` on
   `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test-d.ts`
   fixture (effectively via `tsc -b` per
   `pnpm --filter @skb/heavy-block-boundary typecheck`). NO new
   dev-deps added for type assertions (no `tsd` / `expect-type`); matches
   workspace tsc-only convention; cleaner than adding tooling. Each
   `// @ts-expect-error` marker triggers an actual TS error; if the
   typing regresses, tsc errors `Unused '@ts-expect-error' directive`
   and the typecheck fails — TC2 evidence.
6. 6 new test assertions across 2 new files: `HeavyBlockBoundary.test.tsx`
   contains 5 vitest runtime tests for AC#1 + #3 + #6 + #10 + #11;
   `HeavyBlockBoundary.test-d.ts` contains 1 type-fixture for AC#2
   (with multiple `// @ts-expect-error` markers covering positive +
   negative type assertions) — TC1 + TC3 + TC4 + TC5 + TC6 + TC2
   evidence; the existing A1 `skeleton.test.ts` stays intact as
   belt+suspenders for AC#1.
7. `pnpm check` exit 0 globally — TC7 evidence; A2 does not regress
   any other package in the workspace.
8. `pnpm-lock.yaml` change bounded — diff contains ONLY the new
   devDep entries EXECUTE adds (`@testing-library/react` +
   `@types/react-dom` + `happy-dom` + `react-dom`) registered to the
   package's `devDependencies` block; no other package importer
   versions move — TC11 evidence; staged at commit time per ADR-0006
   D8 lockfile blob discipline.
9. `packages/heavy-block-boundary/CONTRACT.md` is byte-unchanged from
   A1 (the placeholder note "full invariants land at A2-A4" stays;
   A4 will consolidate after CSS+a11y land) — TC14 evidence.
10. `docs/decisions/ADR-0014-heavy-block-boundary.md` is byte-unchanged
    (status remains `proposed`; promotion to `accepted` is A8 scope
    per locked Wave 4 plan Stage A close criterion #1) — TC15 evidence.
11. **No collateral regen drift** — `git diff` after EXECUTE is bounded
    to the files canonical in `## files` (count: see canonical line in
    `## files` end-marker = 6 files). Iteration log slots:
    - **Resolved at EXECUTE**: `packages/heavy-block-boundary/package.json`
      graduated into `## files` (executor needed
      `@testing-library/react`, `@types/react-dom`, `happy-dom`, and
      `react-dom` devDeps for the runtime hydration tests and package
      typecheck).
    - **Resolved at EXECUTE**: `packages/heavy-block-boundary/vitest.config.ts`
      graduated into `## files` (executor needed `.tsx` runtime test
      discovery, `happy-dom` DOM support, and `.test-d.ts` exclusion).
    - **Possible to graduate at REVIEW**: `docs/plans/wave-4-main/A2-heavy-block-boundary-core.md`
      — already self-listed by pr-writer at PLAN per A1 R1 lesson; no
      graduation expected. If the codex review requests a clarification
      revision to PR.md, it stays in the canonical list (already there).
    - Workspace root `tsconfig.json` not touched (verified A1
      EXECUTE; root does not enumerate package references).
    - `pnpm-workspace.yaml` not touched (already includes `packages/*`).
    - `apps/site/**` not touched (A5 scope per ADR-0014 D8).
12. **Out-of-scope items deferred per Wave 4 plan A3-A8**: retry button
    + click handler + skeleton restoration between attempts (A3);
    `maxRetries` enforcement + button disable after N attempts (A3);
    `onLoadError(err, attempt)` callback invocation (A3); `errorText`
    + `retryLabel` render (A3); CSS class application + the actual
    `heavy-block-skeleton.css` file + `prefers-reduced-motion` query
    (A4); `aria-busy='true' → 'false'` toggle on load (A4); a11y
    semantics test (AC#12 — A4); plugin extensibility test (AC#13 —
    A4); per-block dims source from `heavyBoundaryDimensions` (AC#15
    — A5); apps/site migration replacing `makeHeavyBlockPlaceholder`
    with `<HeavyBlockBoundary>` (A5 scope per ADR-0014 D8);
    playwright T0/T1 layout-shift validation (AC#5 — A6);
    `*.astro` SSR variants 5× consolidation (Wave 3 C4a/C4b carry-over
    — A7); selective per-block chunking + perf baseline (C5 carry-over
    — A8); ADR-0014 promotion `proposed → accepted` (A8) — exhaustively
    enumerated in `## Out-of-scope` block.
13. Codex review iterations: expect **0-1 forward-fix rounds** (A1
    needed 3 due to first-non-bootstrap friction including ADR-0008
    D1 dead-dep evidence ironclad-ing + PR.md self-listing fwd-fix
    + vitest.config.ts graduation; A2 should be much smoother since
    the package shell is already solid + the executor already knows
    the workspace conventions from A1). Likely friction surfaces:
    (a) graduation of `package.json` + `vitest.config.ts` into
    `## files`, (b) the `.test-d.ts` fixture interaction with vitest
    discovery globs, (c) the AC#3 hydration test boilerplate (using
    `hydrateRoot` correctly).
14. PR.md (`docs/plans/wave-4-main/A2-heavy-block-boundary-core.md`)
    is self-listed in the staged file list at commit time per
    ADR-0006 D8 strict whitelist (PR #1 R2 lesson; carried through
    Wave 3 + Pre-A1+A2+A3 + A1).
15. Post-merge orchestrator updates `docs/plans/active.md` Wave 4 PR
    roster (A2 row from TODO → done); ROUTINE bookkeeping NOT in the
    A2 diff per locked plan structure.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): **NO** — `packages/heavy-block-boundary/CONTRACT.md`
  is byte-unchanged in A2 (TC14 evidence); A1 already shipped the
  consumer-side CONTRACT.md with the public-surface declaration + the
  W4-1 cross-link to `block-foundation/CONTRACT.md`. A1 PR.md `## D2
  trigger judgment` notes that A2's trigger is "borderline; Stage 4
  NOT mandatory if A1 already committed the CONTRACT shape" — A1 did
  commit CONTRACT.md (merged in PR #31), so the borderline resolves to
  NO. Lock as NO.
- **Row 2** (package add/remove): **NO** — A2 adds NO workspace
  packages (devDeps within an existing package don't count as
  workspace package add per ADR-0007 D2 row 2 standard reading).
  Workspace count stays at 23 (post-A1 baseline).
- **Row 4** (new ADR required): **NO** — ADR-0014 was already proposed
  at Pre-A2 + extended at Pre-A3 plan-lock; A2 implements the existing
  ADR's D3 spec verbatim, no new design decision surfaces.
- **Row 5** (cross ≥ 3 packages): **NO** — A2 touches only
  `packages/heavy-block-boundary/` (1 source file + 2 new test files +
  conditional `package.json` + `vitest.config.ts` graduations all
  inside the same package).
- **Row 8** (CI / build / deploy / auth / security): **NO** — pure
  in-package lifecycle implementation + tests; no CI workflow / deploy
  / auth / security surface change.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW NOT mandatory** (no Row 1/4
hit). Per Wave 4 plan A2 § + plan-challenger Q5 absorbtion, the
minimum at COMMIT-time is an orchestrator-self acceptance walk against
the `## acceptance` bullets. Codex review at stage 3 still applies the
ADR-0006 8-point checklist; absent a Row 1/4 hit, no second Claude
gate is required.

## executor

Standard ADR-0011 D1 pipeline. Second non-bootstrap Wave 4 PR — same
shape as A1 minus the Stage 4 PRE-COMMIT CLAUDE REVIEW (no D2 row 1/4
hit per `## D2 trigger judgment` above).

- **PLAN**: `pr-writer` Claude subagent (this PR.md authored by
  pr-writer first invocation; orchestrator iterates 0-2 rounds before
  lock per ADR-0011 D1 stage 1 standard flow).
- **EXECUTE**: `codex-generic-executor` (gpt-5.5 + workspace-write
  sandbox per ADR-0011 D6 + Pre-A1-codified `--yolo` flag + R7 piping
  + pipefail). Dispatch invocation form per Pre-A1 R7:
  `set -o pipefail; timeout 1200 codex exec --yolo --profile codex-generic-executor "$(cat /tmp/A2-prompt.md)" < /dev/null 2>&1 | tee /tmp/codex-runs/2026-05-03-A2-generic-executor.txt > /dev/null`.
  Audit log archived per Pre-A1 R7 flow (head -2000 → `docs/audits/codex-runs/`).
  Executor reads PR.md `## files` + `## test_cases` + `## acceptance`
  + the in-scope ADR-0014 D3 spec text; TDD-front workflow per
  ADR-0011 D1 stage 2: writes the 6 test assertions FIRST → confirms
  they FAIL against the A1 placeholder body → implements the D3
  lifecycle → confirms TC1-TC6 + the existing skeleton.test.ts all
  PASS → runs TC7-TC18 → reports back. Pre-flight responsibility:
  decide whether `package.json` (devDeps) + `vitest.config.ts`
  (`include` glob widen + `environment: 'happy-dom'`) need graduation
  into `## files` and apply the SOTed-discipline collateral-drift
  protocol (acceptance bullet 11) by appending the changed files to
  `## files` + bumping the canonical count.
- **REVIEW**: `codex-pr-reviewer-55` (ADR-0011 D1 stage 3 default
  reviewer; ADR-0006 8-point checklist mandatory). Audit log:
  `/tmp/codex-runs/2026-05-03-A2-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-03-A2-pr-reviewer-55.txt`
  truncated. Reviewer hunts especially for: (a) D1 prop interface
  byte-unchanged from A1 (TC16); (b) mount-guard correctness
  (`mountedRef.current` set to `false` BEFORE the `setComponent` gate
  reads it, no race window); (c) `AbortController` cleanup ordering
  (abort BEFORE flipping ref vs after — the canonical React pattern
  flips the ref first then calls abort to ensure the abort handler in
  `load` doesn't trigger a setState; reviewer should verify the
  ordering matches the canonical pattern per the React docs); (d)
  `.test-d.ts` fixture interacts with vitest discovery cleanly (no
  runtime errors from accidentally loading); (e) `hydrateRoot`
  detection in AC#3 actually surfaces hydration mismatches (the test
  must spy `console.error` not just `console.warn`; React 18 logs
  hydration mismatches via `console.error` per its source); (f) the
  reject-path placeholder console.error is gated behind
  `!signal.aborted` so abort-driven rejections don't spam logs; (g)
  no scope creep into A3 retry logic or A4 CSS/a11y polish.
- **PRE-COMMIT CLAUDE REVIEW**: **NOT mandatory** (no D2 row 1/4
  hit per `## D2 trigger judgment` above). Orchestrator-self walks
  the `## acceptance` bullets 1-15 minimum, verifies TC1-TC18 results
  in the codex audit log, then authorizes COMMIT.
- **COMMIT (+ push)**: **reviewer codex** commits per ADR-0011 D1
  stage 5 (NOT orchestrator-self per ADR-0011 D1 + plan-challenger C6
  absorbtion). Reviewer applies ADR-0006 D8 explicit-file-list staging:
  `git reset HEAD` → `git add <files per ## files canonical list +
  pnpm-lock.yaml if devDeps added>` → `git diff --cached --stat`
  verify staged count matches `## files` canonical (4 + any EXECUTE
  graduations) + 1 if lockfile changed → `git commit` → `git push`.
  Reviewer responsible for ensuring `pnpm-lock.yaml` is staged when
  it changes (TC11 lockfile blob discipline; memory
  `feedback_git_operator_explicit_stage`).
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per
  ADR-0011 D1 stage 6). Verifies the actual diff against this locked
  `## acceptance` block; flags scope creep (extra files outside the
  4-canonical + EXECUTE graduations) or scope drop (missing files);
  outputs ACCEPT or REJECT-with-residue. Residue list flows back to
  orchestrator for follow-up sequencing.

## Out-of-scope (explicitly deferred)

- **A3** — Retry flow + telemetry: retry button render + click handler
  + skeleton restoration between attempts + `maxRetries` enforcement
  (default 2) + retry button disable after exhaustion +
  `onLoadError(err, attempt)` callback invocation + `errorText` +
  `retryLabel` render + reject-path real UI (A2 only logs to
  `console.error` as a placeholder gated behind `!signal.aborted`).
  ADR-0014 D3 steps 5+7+8 + AC#7-#9 covered at A3.
- **A4** — CSS / a11y polish: `packages/heavy-block-boundary/src/heavy-block-skeleton.css`
  consuming `@skb/design-tokens` CSS variables (D6) + `aria-busy='true'
  → 'false'` toggle on load (D2 + C2 absorbtion) + `prefers-reduced-motion`
  rule (AC#14) + a11y semantics test (AC#12) + plugin extensibility
  test (AC#13) + adding `@skb/design-tokens` to package-level deps +
  tsconfig refs. A4 also consolidates the deep invariants into
  CONTRACT.md (replacing the A1 placeholder note "full invariants land
  at A2-A4").
- **A5** — apps/site migration: replace `makeHeavyBlockPlaceholder`
  factory calls with `<HeavyBlockBoundary>` invocations + import
  `heavyBoundaryDimensions` from each heavy block ui-default per
  ADR-0014 D5 + D8; remove the `__A1_HEAVY_BLOCK_BOUNDARY_REF`
  evidence-export. Per-block dims source from `heavyBoundaryDimensions`
  (AC#15) lands at A5.
- **A6** — Playwright T0/T1 layout-shift validation per AC#5
  (gatekeeper smoke #10 core mandate). Note memory
  `feedback_wsl2_chromium_launch`: WSL2 chromium launch fails locally;
  CI-only execution.
- **A7** — `*.astro` SSR variants 5× consolidation (Wave 3 C4a/C4b
  carry-over).
- **A8** — Phase 2 selective per-block chunking + perf baseline (C5
  carry-over) **+ ADR-0014 promotion `proposed → accepted`** in same
  A8 commit (Stage A close gate per gatekeeper directive #3).
- **Heavy block side**: `heavyBoundaryDimensions: HeavyBlockDimensions`
  exports from each `packages/block-{jupyter,nn-viz,agent-flow}/`
  ui-default per ADR-0014 D5. **A5 scope**, not A2.
- **Editor (Tiptap NodeView) consumption**: ADR-0014 D9 explicit
  out-of-scope; editor stays unwrapped unless caller opts in.
  CONTRACT.md notes this; A2 does not change editor semantics.
- **Pre-wrapped helper exports** (`<Kind>RenderViewWithBoundary`)
  from heavy block packages per ADR-0014 D4 — discretionary future
  contribution; not pre-locked.
- **Per-token CSS variable additions** to `@skb/design-tokens` —
  ADR-0014 D6 leaves discretionary; A4 may add 1-2 (skeleton-bg /
  spinner-track / spinner-fg) if not already present.
- **`fallback?: ReactNode` prop usage** — ADR-0014 D1 declares the
  prop in the API; A2 does NOT consume it in the render path (no
  override of SSR placeholder yet). A4's a11y polish may wire
  `fallback` as the override path. The prop stays declared in the
  type interface (unchanged) so consumers can reference it; A2 just
  doesn't render-substitute it.

## Related

- [ADR-0014 D1 + D2 + D3 + W4-1](../../decisions/ADR-0014-heavy-block-boundary.md)
  — the ADR mandating this implementation; D1 = component API canonical
  source (byte-unchanged from A1); D2 = SSR DOM shape (byte-equivalent
  to CSR pre-effect first render — TC3 verifies); D3 = hydration
  lifecycle (the heart of A2 implementation); W4-1 = invariant
  cross-link target in `block-foundation/CONTRACT.md` (consumer-side
  partner is `packages/heavy-block-boundary/CONTRACT.md`, byte-unchanged
  in A2).
- [packages/heavy-block-boundary/CONTRACT.md](../../../packages/heavy-block-boundary/CONTRACT.md)
  — byte-unchanged in A2; A4 consolidates the deep invariants. The
  placeholder note "full invariants land at A2-A4" stays.
- [packages/block-foundation/CONTRACT.md W4-1 invariant](../../../packages/block-foundation/CONTRACT.md)
  — partner-side invariant from Pre-A2; A2 implementation honors the
  invariant by ensuring the boundary actually defers heavy `kind='viz'`
  block load until mount (per the W4-1 prose).
- [Locked Wave 4 plan Stage A § A2](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  — the planning source-of-truth for A2 scope; lines 130-149 inside
  the A2 §; D8 + D9 cross-cuts; plan-challenger Q5/Q6/C8 absorbtions
  applied here.
- [A1 PR.md](./A1-heavy-block-boundary-package.md) — A2 builds on the
  A1 package shell; A1 is the SOTed v0.1.1 PR.md schema reference + A2
  matches its section structure.
- [Pre-A2 PR.md](./Pre-A2-adr-0014-heavy-block-boundary.md) — locked
  ADR-0014 + W4-1 in block-foundation; A2 implements ADR-0014 D3 per
  the verbatim spec.
- [Pre-A3 PR.md](./Pre-A3-plan-lock.md) — locked Wave 4 plan; A2 is
  the second PR after bootstrap.
- [Pre-A1 PR.md](./Pre-A1-codex-runbook-yolo-tmp-piping.md) — codified
  `--yolo` + `/tmp` piping + `set -o pipefail` disciplines applied
  to all A2 codex dispatches.
- [ADR-0011 D1 standard pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — A2 exercises the standard D1 stages 1-3+5-6 (PLAN pr-writer /
  EXECUTE codex-generic-executor / REVIEW codex-pr-reviewer-55 /
  COMMIT reviewer-codex / ACCEPT pr-writer); stage 4 PRE-COMMIT CLAUDE
  REVIEW skipped per `## D2 trigger judgment` (no row 1/4 hit).
- [ADR-0011 D2 v0.1.1 SOTed-PR.md amendment](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — schema discipline applied to this PR.md (single canonical fact per
  section; cross-reference rather than duplicate; canonical file count
  appears once in `## files` end-marker).
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — reviewer-codex commit phase staging discipline for A2 (4 canonical
  files + EXECUTE-graduations + lockfile if devDeps added).
- [ADR-0008 D1 dead-dep policy](../../decisions/ADR-0008-wave-2-entry-policies.md)
  — A2 does NOT add new workspace deps (only devDeps within an existing
  package); ADR-0008 D1 strict reading is unchanged from A1's posture.
