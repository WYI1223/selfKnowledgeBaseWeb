# A3 — `HeavyBlockBoundary` retry + `maxRetries` + `onLoadError` telemetry (D3 retry-flow per ADR-0014)

> **Wave 4 Stage A third implementation PR.** Extends the A2 lifecycle
> (`packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`) with the
> ADR-0014 D3 reject + retry + maxRetries + onLoadError sub-flow (steps
> 5 + 7 + 8). Replaces the A2 reserved-but-unused `attempt` state slot
> (`const [, /* attempt */] = useState<number>(1)`) with real
> `[attempt, setAttempt]` state + a sibling `[error, setError]` state
> driving a 3-state render machine (loaded / error / skeleton). Replaces
> the A2 `// TODO(A3)` placeholder reject branch (currently a single
> `console.error` gated behind `!signal.aborted`) with the canonical
> reject path: invoke `props.onLoadError?.(err, attempt)` telemetry hook
> + `setError(err)` to gate the visible error fragment + leave
> `Component === null` so the render branch falls into the new error
> UI. Adds the retry handler that increments `attempt` + clears `error`
> + re-runs the load `useEffect` via `[attempt]` dep array (cleanup
> aborts the prior controller; new effect run constructs a fresh
> `AbortController`). Bounds retry attempts at `props.maxRetries ?? 2`
> (per ADR-0014 D1 line 106 default) — retry button `disabled` when
> `attempt > resolvedMaxRetries`. Honors `props.errorText ?? \`Failed
> to load ${kind}\`` and `props.retryLabel ?? 'Retry'`. Adds 3 vitest
> runtime tests bundled into `HeavyBlockBoundary.test.tsx` covering
> AC#7 (rejected load path) + AC#8 (retry path) + AC#9 (`maxRetries`
> bound) without splitting into a second file (the post-A3 test file
> sits comfortably under the 300 LOC ESLint warn). D1 prop interface
> (lines 1-30, A2 byte-state) is **byte-identical** to A2; A3 is purely
> a function-body extension. CONTRACT.md is **NOT modified** (the
> placeholder note "full invariants land at A2-A4" stays — A4
> consolidates after CSS+a11y land). ADR-0014 is **NOT modified** (still
> `proposed`; A8 promotes). `console.error` placeholder log is removed
> entirely — `onLoadError` is the canonical telemetry channel that
> consumers opt in to (no surprise log spam by default). Bundles the
> Wave 4 PR roster bookkeeping update into `docs/plans/active.md`
> per A2 PR.md `## acceptance` bullet 15 carry-over (post-A1+A2 row
> additions + Pre-A3 squash HEAD fill + flip "next implementation PR"
> pointer from "Stage A1" → "Stage A4"). Standard ADR-0011 D1 pipeline
> (codex-generic-executor EXECUTE; codex-pr-reviewer-55 REVIEW + COMMIT;
> PRE-COMMIT CLAUDE REVIEW NOT mandatory — no D2 row 1/4 hit; pr-writer
> ACCEPT).

## title

Implement ADR-0014 D3 reject + retry + `maxRetries` bound + `onLoadError`
telemetry sub-flow (steps 5 + 7 + 8) in
`packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`: replace the
A2 reserved unused `const [, /* attempt */] = useState<number>(1)` slot
with real `const [attempt, setAttempt] = useState<number>(1)` (initial
mount = attempt #1, NOT #0); add sibling `const [error, setError] =
useState<unknown>(null)` state cleared on successful resolve and on
retry click; replace the A2 placeholder reject branch (currently
`console.error` gated behind `!signal.aborted`) with the canonical
reject path that calls `props.onLoadError?.(err, attempt)` +
`setError(err)` + leaves `Component === null` so the render branch
falls into the new error UI (abort-driven rejections — `controller.signal.aborted`
true — stay silent NO-OP, matching A2 cleanup contract); add the retry
handler `handleRetry` that calls `setAttempt(prev => prev + 1)` +
`setError(null)` + relies on the `useEffect` `[attempt]` dep array to
re-run the load (effect cleanup naturally aborts the prior controller
before the new effect run constructs a fresh `AbortController` and
calls `load({ signal })` again); bound retries at `const
resolvedMaxRetries = props.maxRetries ?? 2` per ADR-0014 D1 line 106
default — retry button `disabled` when `attempt > resolvedMaxRetries`
(semantics: attempt=1 initial fails → button enabled; attempt=2 retry
fails → button enabled; attempt=3 retry fails AND `resolvedMaxRetries=2`
→ button disabled because `3 > 2`); add the error UI fragment rendered
when `error !== null && Component === null` consisting of `<div
className='heavy-block-skeleton__error' role='alert'>` containing
`<div className='heavy-block-skeleton__error-text'>{resolvedErrorText}</div>`
where `resolvedErrorText = props.errorText ?? \`Failed to load ${kind}\``
plus `<button type='button' className='heavy-block-skeleton__retry'
onClick={handleRetry} disabled={!canRetry}>{resolvedRetryLabel}</button>`
where `resolvedRetryLabel = props.retryLabel ?? 'Retry'` and `canRetry
= attempt <= resolvedMaxRetries`; preserve the outer `<div data-block
={kind} data-deferred='wave-4' role='status' aria-busy='true'
style={skeletonStyle}>` container in all 3 render states (loaded /
error / skeleton) so dimensions stay layout-stable per ADR-0014 D3
step 8; remove the A2 `// TODO(A3)` defer marker; keep the A2 `//
TODO(A4)` marker (aria-busy toggle + CSS classes + prefers-reduced-motion
remain A4 scope); remove the A2 placeholder `console.error` log
entirely — `onLoadError` is the canonical telemetry channel that
consumers opt in to (no default log spam). D1 prop interface (lines
1-30, A2 byte-state) is **byte-identical** to A2 — A3 is purely a
function-body extension; verified at typecheck via the existing
`HeavyBlockBoundary.test-d.ts` fixture (UNCHANGED — A2's positive +
negative type assertions still cover A3 since the prop shape did not
move). Add 3 vitest runtime tests bundled into the existing
`HeavyBlockBoundary.test.tsx` file covering AC#7 (rejected load path:
`load = vi.fn(() => Promise.reject(new Error('boom')))` +
`onLoadError = vi.fn()`; assert errorText rendered + retry button
enabled + `onLoadError(err, 1)` called once + Component NOT rendered)
+ AC#8 (retry path: `load` rejects on attempt 1 then resolves on
attempt 2 via sequenced mock; click retry; assert load called twice
with FRESH AbortSignal each time + `Component` rendered post-retry
with childProps forwarded) + AC#9 (`maxRetries={2}` bound: `load = vi.fn(()
=> Promise.reject(new Error('always-fail')))`; await initial reject
then 2 retry-clicks-then-rejects; assert `onLoadError` called 3 times
with attempts 1, 2, 3 + retry button disabled after the third reject
+ further clicks do NOT call `load` a 4th time). Use `fireEvent` from
`@testing-library/react` (already a workspace dep added at A2) for the
retry button click — explicitly NOT adding `@testing-library/user-event`
to keep `pnpm-lock.yaml` byte-unchanged in A3. Bundle the 3 new tests
into the existing `HeavyBlockBoundary.test.tsx` file (instead of a new
`HeavyBlockBoundary.retry.test.tsx`) — post-A3 file estimate ~250 LOC,
comfortably under the 300 LOC ESLint warn. Bundle the Wave 4 PR roster
bookkeeping update into `docs/plans/active.md` per A2 PR.md `##
acceptance` bullet 15 carry-over: add A1 (`#31` `f765968`) + A2 (`#32`
squash HEAD per merge result) rows; replace the "Stage A | A1-A8 (8
PRs)" aggregate row with a "Stage A remaining | A3-A8 (6 PRs)" row;
flip "**Stage A1 ... is the next implementation PR**" → "**Stage A4
(CSS + a11y + prefers-reduced-motion) is the next implementation PR**";
flip the top-line "Pre-A1 + Pre-A2 + Pre-A3 bootstrap + lock done;
Stage A starting next session." → "Pre-A1 + Pre-A2 + Pre-A3 + A1 + A2
+ A3 done; Stage A4 (CSS + a11y + prefers-reduced-motion) is the next
implementation PR."; fill the Pre-A3 row's "TBD" squash HEAD with
`3e2a4a9`. AC coverage in A3: **#7 / #8 / #9** newly satisfied; **#1 /
#3 / #6 / #10 / #11** A2 regression baseline preserved (TC1). **Out of
scope for A3** (per locked Wave 4 plan): CSS file `heavy-block-skeleton.css`
+ `aria-busy` toggle on Component-loaded state + `prefers-reduced-motion`
query + a11y semantics test (#4 + #12 + #14) → A4; plugin extensibility
test (#13) → A4; apps/site dims migration (#15) → A5; playwright T0/T1
layout-shift (#5) → A6; `*.astro` consolidation → A7; selective per-block
chunking → A8; ADR-0014 promotion `proposed → accepted` → A8.

## files

Modified (canonical count in line below; collateral graduations
expected: NONE — A3 reuses the A2 devDeps + happy-dom + react-dom +
`@testing-library/react` already in `package.json`; uses `fireEvent`
not `user-event` to avoid lockfile churn. This PR.md remains
self-listed per ADR-0006 D8 strict whitelist + Pre-A1+A2+A3+A1+A2
precedent that pr-writer must include the PR.md in the canonical file
list at PLAN time):

- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` —
  **MODIFIED**. D1 type definitions (lines 1-30: imports +
  `HeavyBlockKindRegistry` + `HeavyBlockKind` branded widening +
  `HeavyBlockDimensions` + `HeavyBlockBoundaryProps<P>`) **byte-identical**
  to A2; A3 does NOT change the public surface. Function body grows
  these blocks: (a) the A2 reserved unused `const [, /* attempt */] =
  useState<number>(1)` becomes real `const [attempt, setAttempt] =
  useState<number>(1)`; (b) sibling `const [error, setError] =
  useState<unknown>(null)` is added (initial value `null`; cleared to
  `null` on successful resolve and on retry click; set to the rejection
  reason in the canonical reject branch); (c) a `handleRetry` callback
  (closure or `useCallback` — executor's call) increments `attempt` via
  `setAttempt(prev => prev + 1)` + clears `error` via `setError(null)`;
  (d) the `useEffect` dep array changes from `[]` to `[attempt]` so
  React re-runs the effect on retry (the existing eslint-disable-line
  for omitted `kind`/`load`/etc. stays — referential stability of
  those props is the consumer's responsibility, NOT the boundary's;
  the prior cleanup naturally fires and aborts the previous
  `AbortController` before the next effect run constructs a fresh one);
  (e) the A2 `// TODO(A3)` placeholder reject branch (currently `if
  (!controller.signal.aborted) { console.error(...); }`) is replaced
  with the canonical reject path: when `load()` rejects AND
  `!controller.signal.aborted`, call `props.onLoadError?.(err, attempt)`
  THEN `setError(err)` (no `setComponent` call so the render branch
  falls into the error fragment); when `controller.signal.aborted`
  is true (unmount-driven OR retry-driven cleanup), stay silent NO-OP
  (no `onLoadError`, no `setError`, no log) — matches the A2 abort
  contract; the placeholder `console.error` is removed entirely (the
  consumer-opt-in `onLoadError` channel is canonical); (f) the resolve
  branch additionally calls `setError(null)` defensively so a
  successful retry after a previous error clears the error UI before
  the loaded component renders (defensive; the render switch already
  prefers `Component !== null` over `error !== null`, but clearing
  `error` keeps state honest for any consumer reading it through React
  DevTools or future API surface); (g) `const resolvedMaxRetries =
  props.maxRetries ?? 2;` resolution per ADR-0014 D1 line 106 default;
  `const canRetry = attempt <= resolvedMaxRetries;` derivation drives
  button disable (semantics: attempt=1 initial fails → canRetry=true;
  attempt=2 retry fails → canRetry=true; attempt=3 retry fails AND
  resolvedMaxRetries=2 → canRetry=false because `3 > 2`); (h) `const
  resolvedErrorText = props.errorText ?? \`Failed to load ${kind}\`;`
  and `const resolvedRetryLabel = props.retryLabel ?? 'Retry';`
  resolution lines next to the existing `resolvedLoadingText`; (i)
  the render block becomes a 3-state machine inside the SAME outer
  `<div data-block={kind} data-deferred='wave-4' role='status'
  aria-busy='true' style={skeletonStyle}>` container (preserving
  dimensions for layout stability per ADR-0014 D3 step 8): when
  `Component !== null` render `<Component {...childProps} />` (loaded
  — A2 unchanged); ELSE when `error !== null` render the error fragment
  `<div className='heavy-block-skeleton__error' role='alert'><div
  className='heavy-block-skeleton__error-text'>{resolvedErrorText}</div><button
  type='button' className='heavy-block-skeleton__retry' onClick={handleRetry}
  disabled={!canRetry}>{resolvedRetryLabel}</button></div>` (NEW); ELSE
  render the existing skeleton fragment (frame + spinner + text — A2
  unchanged); (j) the A2 `// TODO(A3): retry button + onLoadError +
  errorText render` marker is removed (A3 implements); the A2 `//
  TODO(A4): aria-busy toggle + CSS classes + prefers-reduced-motion`
  marker is preserved (A4 still pending). The `aria-busy='true'` on
  the outer container stays static in A3 (A4 toggles per ADR-0014 D2
  + C2 absorbtion); however executor MAY flip `aria-busy` to `'false'`
  on the error-state branch as a natural ARIA-loading-pattern alignment
  if it cleanly drops in (A4 will polish anyway; reviewer should NOT
  reject either choice). Stays under 200 LOC target / 300 LOC ESLint
  warn / 500 LOC hard fail (A3 adds ~50-70 LOC of retry/error/UI to
  the ~100 LOC A2 file → est. ~150-170 LOC).
- `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test.tsx`
  — **MODIFIED**. The 5 A2 tests (AC#1 + AC#3 + AC#6 + AC#10 + AC#11)
  are PRESERVED byte-unchanged (TC1 regression baseline). Adds 3 new
  vitest tests bundled into the same file (NOT split into a separate
  `HeavyBlockBoundary.retry.test.tsx` — the post-A3 file estimate is
  ~250 LOC, comfortably under the 300 LOC ESLint warn). Imports gain
  `fireEvent` from `@testing-library/react` if not already present (A2
  imports `cleanup`, `act`, `render` from the same module — adding
  `fireEvent` is a single-line edit in the same import). Imports stay
  free of `@testing-library/user-event` to keep `pnpm-lock.yaml`
  byte-unchanged. The 3 new tests:
  - **Test 6 (AC#7 — rejected load path)**: defines `const load =
    vi.fn(() => Promise.reject(new Error('boom')));` and `const
    onLoadError = vi.fn();`; renders `<HeavyBlockBoundary
    kind='jupyter' dims={{width:600,height:400}} load={load}
    onLoadError={onLoadError} childProps={{}} />`; awaits the rejection
    settle via `await act(async () => { await Promise.resolve(); });`
    (sufficient for a microtask flush of the immediately-rejected
    Promise); asserts: (i) the default error text "Failed to load
    jupyter" is rendered (or the custom `errorText` if a follow-up test
    variant covers it; this base test uses the default); (ii) the retry
    button is rendered (`getByRole('button', { name: /retry/i })` or
    similar) and `disabled === false` (initial attempt=1 is well within
    `resolvedMaxRetries=2`); (iii) `expect(onLoadError).toHaveBeenCalledTimes(1)`
    AND `expect(onLoadError).toHaveBeenCalledWith(expect.any(Error), 1)`
    (attempt=1 because the initial mount load is attempt #1); (iv) NO
    element with `data-loaded='true'` is present (Component never
    rendered); (v) the outer `<div data-block='jupyter'>` container is
    still present (layout stability per ADR-0014 D3 step 8 invariant
    — no container churn between skeleton ↔ error states); (vi)
    `console.error` spy NOT called with the placeholder log substring
    (the A2 placeholder log is removed in A3 — verifies the canonical
    telemetry channel is `onLoadError`, not `console.error`).
  - **Test 7 (AC#8 — retry path)**: defines a sequenced mock `let
    callCount = 0; const Loaded: ComponentType<{ name: string }> = ({
    name }) => createElement('div', { 'data-loaded': 'true' }, name);
    const load = vi.fn(() => { callCount += 1; if (callCount === 1)
    return Promise.reject(new Error('first-fail')); return
    Promise.resolve({ default: Loaded }); });` and `const onLoadError
    = vi.fn();`; renders `<HeavyBlockBoundary kind='jupyter'
    dims={{width:600,height:400}} load={load}
    onLoadError={onLoadError} childProps={{ name: 'A3-RETRY-OK' }}
    />`; awaits the first rejection settle; asserts: (i) error text
    rendered; (ii) `onLoadError(err, 1)` called once; (iii) `load`
    called once with `{ signal: AbortSignal }`; captures the first
    AbortSignal via the `vi.fn` mock invocation argument introspection
    (`load.mock.calls[0][0].signal`); clicks the retry button via
    `fireEvent.click(getByRole('button', { name: /retry/i }))`; awaits
    the second resolution settle via `await act(async () => { await
    Promise.resolve(); });`; asserts: (iv) `load` called twice; (v)
    second invocation passed a DIFFERENT AbortSignal instance
    (`load.mock.calls[1][0].signal !== load.mock.calls[0][0].signal`)
    proving a fresh AbortController was constructed on retry; (vi) the
    first AbortSignal is `aborted === true` post-retry (proving the
    prior effect cleanup ran); (vii) Component rendered with childProps
    threaded (`getByText('A3-RETRY-OK')` succeeds + element has
    `data-loaded='true'`); (viii) the outer `<div data-block='jupyter'>`
    container is STILL the same outer element (layout-stable across
    skeleton → error → loaded transitions).
  - **Test 8 (AC#9 — `maxRetries` bound)**: defines `const load =
    vi.fn(() => Promise.reject(new Error('always-fail')));` and `const
    onLoadError = vi.fn();`; renders `<HeavyBlockBoundary
    kind='jupyter' dims={{width:600,height:400}} maxRetries={2}
    load={load} onLoadError={onLoadError} childProps={{}} />` (explicit
    `maxRetries={2}` to lock the test against the value rather than
    relying on the default — separate sub-test variant or comment may
    note that omitting `maxRetries` yields the same bound via the D1
    default); awaits initial rejection (attempt=1); clicks retry;
    awaits rejection (attempt=2); clicks retry; awaits rejection
    (attempt=3); asserts: (i) `expect(onLoadError).toHaveBeenCalledTimes(3)`;
    (ii) `expect(onLoadError).toHaveBeenNthCalledWith(1, expect.any(Error),
    1)` AND `(2, ..., 2)` AND `(3, ..., 3)` (attempt counter increments
    1 → 2 → 3); (iii) `expect(load).toHaveBeenCalledTimes(3)`; (iv)
    retry button `disabled === true` after the third reject
    (`canRetry = 3 <= 2 → false`); (v) further `fireEvent.click(retryButton)`
    does NOT trigger a 4th `load` call (`expect(load).toHaveBeenCalledTimes(3)`
    after the click — the disabled button does not fire its onClick).
    Optionally a sub-test variant verifies the SAME bound applies when
    `maxRetries` is OMITTED (default `?? 2` per ADR-0014 D1); executor
    discretion to inline as one assertion or split a 4th tiny test.
- `docs/plans/active.md` — **MODIFIED**. Wave 4 PR roster bookkeeping
  update bundled into A3 per A2 PR.md `## acceptance` bullet 15
  carry-over (A2 PR.md noted "Post-merge orchestrator updates `docs/plans/active.md`
  Wave 4 PR roster (A2 row from TODO → done); ROUTINE bookkeeping NOT
  in the A2 diff per locked plan structure" — but the bookkeeping was
  not actually done at A2 merge, so A3 absorbs the A1+A2+A3 batch
  update). Specific edits (mechanical bookkeeping; executor authors
  the diff per the explicit guidance below):
  - **Top-line line 6**: change `Pre-A1 + Pre-A2 + Pre-A3 bootstrap +
    lock done; Stage A starting next session.` → `Pre-A1 + Pre-A2 +
    Pre-A3 + A1 + A2 + A3 done; Stage A4 (CSS + a11y +
    prefers-reduced-motion) is the next implementation PR.`
  - **Wave 4 PR roster table (lines 10-17)**: ADD two rows below the
    existing Pre-A3 row (`#30`):
    - `| #31 | f765968 | A1 | @skb/heavy-block-boundary package shell + CONTRACT.md + W4-1 cross-link |`
    - `| #32 | <squash-HEAD-from-merge> | A2 | HeavyBlockBoundary core impl (D3 hydration mount/load + AbortSignal + mount-guard + AC#1/#2/#3/#6/#10/#11 tests) |`
    - **Note**: A2's actual squash HEAD is whatever `gh pr merge` produced
      after A2 merged (the orchestrator passes the literal commit SHA at
      EXECUTE time; if the merge has not yet happened at A3 EXECUTE
      kickoff, executor stages this row with `<TBD>` and orchestrator
      patches the SHA in at COMMIT time per the Pre-A3 row TBD-fill
      pattern).
  - **Pre-A3 row squash HEAD**: replace the existing `TBD` value with
    `3e2a4a9` (per `git log` `3e2a4a9 Wave 4 Pre-A3 — plan-draft lock
    (Stage A 8 PRs + Stage B 6 PRs + Stage C open-ended) (#30)`).
  - **Stage A aggregate row (line 15 currently)**: replace the
    `Stage A | A1-A8 (8 PRs) | A | ...` aggregate row with `Stage A
    remaining | A4-A8 (5 PRs) | A | CSS + a11y + dims migration +
    playwright + .astro consolidation + perf baseline + ADR-0014
    promote` (since A1 + A2 + A3 are now broken out individually above
    AND merged; only A4-A8 remain in the aggregate).
  - **起手指引 line 75 (Pre-flight section heading line)**: change
    `**Stage A1 (\`@skb/heavy-block-boundary\` package creation) is
    the next implementation PR.**` → `**Stage A4 (CSS + a11y +
    prefers-reduced-motion) is the next implementation PR.**`
  - All other content of `docs/plans/active.md` stays byte-unchanged
    (no edits to the Wave 1+2+3 close summaries, the Wave 1+2+3+4
    architecture ADR roster, the Wave 4 mandatory scope bullets, or
    the Pre-flight numbered list 1-5).
- `docs/plans/wave-4-main/A3-heavy-block-boundary-retry.md` — this
  PR.md (self-listed per ADR-0006 D8 strict whitelist; A1+A2 R1
  precedent + Pre-A1+A2+A3 + Wave 1+2+3 lessons carried).

= **4 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `pnpm-lock.yaml` — **byte-unchanged expected**. A3 introduces NO new
  workspace dependencies (decision: use `fireEvent` from
  `@testing-library/react` already in A2 devDeps — explicitly NOT
  adding `@testing-library/user-event`). TC11 verifies empty diff.
  **MUST NOT be staged at commit** if byte-unchanged (per ADR-0006 D8
  strict whitelist). If executor for any reason touches the lockfile
  (e.g., transitive `pnpm install` post-edit), it graduates into
  `## files` per the SOTed-discipline collateral-drift protocol +
  bumps the canonical count to 5.
- `packages/heavy-block-boundary/package.json` — **UNCHANGED**. A2's
  devDep set (`@testing-library/react@^16.0.0`, `@types/react-dom@^18.3.0`,
  `happy-dom@^15.0.0`, `react-dom@^18.3.0`, `@types/react@^18.3.0`,
  `react@^18.3.0`, `typescript@~5.6.0`, `vitest@^4.1.5`) covers the A3
  retry tests too. If executor for any reason needs a new dep (e.g.,
  decides `user-event` after all), it graduates into `## files` + bumps
  canonical count + `pnpm-lock.yaml` graduates concurrently. Default
  expectation: NO graduation; A3 plan is to keep this file untouched.
- `packages/heavy-block-boundary/vitest.config.ts` — **UNCHANGED**.
  A2's config (`include: ['src/**/*.test.{ts,tsx}']`, `exclude:
  ['**/*.test-d.ts']`, `environment: 'happy-dom'`, `typecheck: { enabled:
  false }`) covers A3. The new tests bundled into the existing
  `HeavyBlockBoundary.test.tsx` need no config delta.
- `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test-d.ts`
  — **UNCHANGED**. A2's positive + negative type assertions on
  generic `<P>` inference + branded widening + `// @ts-expect-error`
  markers cover A3 since the prop shape did NOT move (the D1 prop
  interface is byte-identical between A2 and A3). TC2 still gates via
  `tsc -b`.
- `packages/heavy-block-boundary/CONTRACT.md` — **NOT modified**. The
  placeholder note "full invariants land at A2-A4" stays intact.
  CONTRACT.md will consolidate the deep invariants (mount guard,
  AbortSignal cancellation, SSR byte-equivalence, retry behavior, a11y
  semantics, reduced-motion handling) at A4 close per the locked Wave
  4 plan A4 + the natural pattern of editing CONTRACT.md once the full
  polish lands rather than incrementally. A3 satisfies AC#7/#8/#9 (a
  subset) but A4 still adds CSS+a11y. TC10 verifies empty diff.
- `docs/decisions/ADR-0014-heavy-block-boundary.md` — **NOT modified**.
  Status remains `proposed`; promotion to `accepted` is A8 scope per
  locked Wave 4 plan Stage A close criterion #1. A3 is the consumer of
  the ADR (specifically D1 props lines 100-110 declaring `errorText`
  / `retryLabel` / `maxRetries` / `onLoadError` and D3 lines 152-160
  speccing the retry / reject / maxRetries / onLoadError flow), not
  the editor. TC11 verifies empty diff.
- `apps/site/src/components.ts` — **UNCHANGED**. A1's
  `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export survives intact in
  A3 (A5 removes it when migrating to real `<HeavyBlockBoundary>`
  consumption). A3 does NOT migrate apps/site to real boundary use;
  that's A5 scope per ADR-0014 D8.
- `apps/site/package.json` — **UNCHANGED**. A1's workspace dep stays.
- `packages/heavy-block-boundary/dist/**` / `.turbo/**` — gitignored.
- `pnpm-workspace.yaml` — already lists `packages/*` glob; no edit.
- `tsconfig.json` (workspace root) — verified at A1 EXECUTE that root
  does not enumerate package references; no edit.
- `agent-contract.md` / generated configs — no agent-contract.md
  change in A3; no `pnpm generate:configs` regen.
- `packages/heavy-block-boundary/src/__tests__/skeleton.test.ts` —
  **UNCHANGED**. A1's trivial harness test stays as belt+suspenders
  for AC#1 alongside `HeavyBlockBoundary.test.tsx` Test 1.
- Any `apps/site/**` `.astro` SSR variant — A7 scope; A3 does NOT
  touch.
- Any `packages/block-{jupyter,nn-viz,agent-flow}/` source — A5 scope
  for the `heavyBoundaryDimensions` exports; A3 does NOT touch.

## test_cases

A3 ships the retry / error / maxRetries lifecycle + 3 new vitest
runtime tests bundled into the existing `HeavyBlockBoundary.test.tsx`.
Tests are TDD-first per ADR-0011 D1 stage 2: write the 3 new test
assertions first → confirm they FAIL against the A2 placeholder reject
branch (which only logs to `console.error`) → implement the A3 retry /
error / maxRetries lifecycle in `HeavyBlockBoundary.tsx` → confirm the
3 new tests + the 5 existing A2 tests + `skeleton.test.ts` all PASS.

- **TC1** (AC#1 + #3 + #6 + #10 + #11 regression — all A2 tests still
  PASS) Input: `pnpm --filter @skb/heavy-block-boundary test`.
  Expected: exit 0; the 5 A2 vitest tests
  (`HeavyBlockBoundary.test.tsx` Tests 1-5) AND `skeleton.test.ts`
  Test 1 ALL still PASS unchanged after A3 edits — proves no
  regression from the retry/error/maxRetries lifecycle additions.
  Particularly important: AC#10 (mount guard) MUST still hold — the
  A3 useEffect dep array change from `[]` to `[attempt]` introduces a
  new effect re-run trigger but the cleanup contract is preserved
  (cleanup flips `mountedRef.current = false` then aborts; new effect
  run resets `mountedRef.current = true`). AC#11 (AbortSignal
  propagation) MUST still hold — every effect run constructs a fresh
  controller. Location: shell at repo root.
- **TC2** (AC#7 — rejected load path: `onLoadError(err, 1)` called +
  error UI rendered + retry button enabled + Component NOT rendered)
  Input: `pnpm --filter @skb/heavy-block-boundary test`. Expected:
  `HeavyBlockBoundary.test.tsx` Test 6 (AC#7) PASS;
  `expect(onLoadError).toHaveBeenCalledTimes(1)` AND
  `expect(onLoadError).toHaveBeenCalledWith(expect.any(Error), 1)`
  succeed; default error text "Failed to load jupyter" present in DOM
  (`getByText('Failed to load jupyter')` succeeds); retry button
  rendered (`getByRole('button', { name: /retry/i })` succeeds) and
  `.disabled === false`; NO `data-loaded='true'` element present;
  outer `<div data-block='jupyter'>` container still present (layout
  stability); `console.error` spy NOT called with the A2 placeholder
  log substring (`'load failed'`) — proves the placeholder log was
  removed and `onLoadError` is the canonical telemetry channel.
  Location: shell.
- **TC3** (AC#8 — retry path: load called twice with FRESH AbortSignal
  each time + Component rendered post-retry with childProps forwarded)
  Input: `pnpm --filter @skb/heavy-block-boundary test`. Expected:
  `HeavyBlockBoundary.test.tsx` Test 7 (AC#8) PASS; sequenced mock
  rejects on call 1 then resolves on call 2; after first rejection
  settle, error UI present + retry button enabled +
  `expect(onLoadError).toHaveBeenCalledTimes(1)`; after
  `fireEvent.click(retryButton)` + microtask flush,
  `expect(load).toHaveBeenCalledTimes(2)` AND
  `load.mock.calls[1][0].signal !== load.mock.calls[0][0].signal`
  (DIFFERENT AbortSignal instance → fresh controller) AND
  `load.mock.calls[0][0].signal.aborted === true` (prior controller
  aborted by effect cleanup) AND `getByText('A3-RETRY-OK')` succeeds
  (childProps `name: 'A3-RETRY-OK'` forwarded to Loaded component) AND
  the rendered element has `data-loaded='true'` (proves the resolved
  module's default export rendered). Outer `<div data-block='jupyter'>`
  container is STILL the same outer element across all transitions
  (layout-stable). Location: shell.
- **TC4** (AC#9 — `maxRetries={2}` bound: button disabled after the
  third reject + 4th click does not trigger a 4th load call) Input:
  `pnpm --filter @skb/heavy-block-boundary test`. Expected:
  `HeavyBlockBoundary.test.tsx` Test 8 (AC#9) PASS; after 3
  reject-cycles (initial mount = attempt 1; click retry = attempt 2;
  click retry = attempt 3),
  `expect(onLoadError).toHaveBeenCalledTimes(3)` AND
  `expect(onLoadError).toHaveBeenNthCalledWith(1, expect.any(Error),
  1)` AND `(2, expect.any(Error), 2)` AND `(3, expect.any(Error), 3)`
  succeed; `expect(load).toHaveBeenCalledTimes(3)`;
  `getByRole('button', { name: /retry/i }).disabled === true` (because
  `canRetry = attempt <= resolvedMaxRetries → 3 <= 2 → false`); after
  `fireEvent.click(retryButton)` post-bound,
  `expect(load).toHaveBeenCalledTimes(3)` (NOT 4 — the disabled button
  does not fire its onClick) AND
  `expect(onLoadError).toHaveBeenCalledTimes(3)` (no new call). The
  default `maxRetries ?? 2` per ADR-0014 D1 line 106 is locked by the
  same bound when prop omitted (executor MAY add a small variant
  assertion or sub-test). Location: shell.
- **TC5** (`pnpm check` exit 0 globally — workspace-wide regression
  baseline) Input: `pnpm check`. Expected: exit 0 (lint + typecheck +
  test + build + size-check all pass across the workspace; A3's
  changes do not regress any other package). Location: shell.
- **TC6** (Package builds clean) Input:
  `pnpm --filter @skb/heavy-block-boundary build`. Expected: exit 0
  (`tsc -b` produces dist/ outputs without diagnostics; new
  `useState<unknown>` for error + `setAttempt`/`setError` calls + the
  `[attempt]` dep array + the error UI fragment + the `disabled`
  attribute on the retry button + the `props.maxRetries ?? 2`
  resolution all compile cleanly). Location: shell.
- **TC7** (Lint clean for the package) Input:
  `pnpm --filter @skb/heavy-block-boundary lint`. Expected: exit 0;
  ESLint flags no issues on `HeavyBlockBoundary.tsx` (the modified
  file) or the test file (modified); `max-lines` 300 warn threshold
  not hit (component file estimated ~150-170 LOC; test file estimated
  ~250 LOC). Location: shell. Memory `feedback_codex_spark_lint_gap`
  notes lint is independent of vitest PASS — TC7 is a hard gate.
  Particular hunt: the `useEffect` dep array changing to `[attempt]`
  may interact with the existing eslint-disable-line for omitted
  `kind`/`load` — executor verifies the disable comment still applies
  and the rule does NOT flag a new violation.
- **TC8** (Typecheck clean — including `.test-d.ts` from A2) Input:
  `pnpm --filter @skb/heavy-block-boundary typecheck`. Expected: exit
  0; `tsc -b` includes `src/__tests__/HeavyBlockBoundary.test-d.ts`
  via tsconfig `include: ["src/**/*"]` glob; A2's positive + negative
  type assertions + `// @ts-expect-error` markers all still hold (the
  prop shape did NOT move in A3). Location: shell. AC#2 mechanism
  (locked at A2) preserved.
- **TC9** (Size check clean — 500 LOC hard fail) Input:
  `pnpm size-check`. Expected: exit 0; no file in
  `packages/heavy-block-boundary/src/` exceeds 500 LOC; the modified
  `HeavyBlockBoundary.tsx` est. ~150-170 LOC, well under the limit;
  the modified test file est. ~250 LOC, also well under the 300 LOC
  ESLint warn (split into `HeavyBlockBoundary.retry.test.tsx` is the
  fallback if est. exceeds — executor's call). Location: shell.
- **TC10** (CONTRACT.md byte-unchanged) Input:
  `git diff main -- packages/heavy-block-boundary/CONTRACT.md`.
  Expected: empty diff (zero bytes changed). A3 explicitly does NOT
  modify the consumer-side contract; the placeholder "full invariants
  land at A2-A4" prose stays, since A4 finalizes the polish. Location:
  shell.
- **TC11** (ADR-0014 byte-unchanged) Input:
  `git diff main -- docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: empty diff. A3 does NOT modify the ADR; promotion is A8.
  Location: shell.
- **TC12** (D1 prop interface byte-unchanged from A2) Input:
  `git diff main -- packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx
  | grep -E '^[-+]' | grep -E 'HeavyBlockKindRegistry|HeavyBlockKind|HeavyBlockDimensions|HeavyBlockBoundaryProps|__heavyBlockKind'`.
  Expected: empty (no `-`/`+` lines on the public type definitions;
  only function-body retry/error/maxRetries/onLoadError code changes).
  Verifies A3 ships the retry lifecycle WITHOUT drifting the public
  surface. Location: shell.
- **TC13** (Retry implementation present in `HeavyBlockBoundary.tsx`)
  Input (a): `grep -cE 'setAttempt|setError' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 4 (at least one `setAttempt` call in retry handler + the
  `setAttempt` from `useState<number>(1)` destructure + at least one
  `setError(err)` in reject branch + `setError(null)` in retry handler
  AND/OR resolve branch). Input (b):
  `grep -cE 'onLoadError' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 1 (the `props.onLoadError?.(err, attempt)` call in reject
  branch). Input (c):
  `grep -cE 'maxRetries|resolvedMaxRetries' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 2 (resolution line + `canRetry` derivation). Input (d):
  `grep -cE 'errorText|resolvedErrorText' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 2 (resolution line + render usage). Input (e):
  `grep -cE 'retryLabel|resolvedRetryLabel' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 2 (resolution line + render usage). Input (f):
  `grep -cE 'disabled=' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 1 (the retry button `disabled={!canRetry}` JSX
  attribute). Input (g):
  `grep -cE '\\[attempt\\]' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 1 (the useEffect dep array). Location: shell.
- **TC14** (TODO marker for A3 removed; A4 marker preserved) Input
  (a): `grep -cE 'TODO\\(A3\\)' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: 0 (A3 marker gone — A3 is no longer pending). Input (b):
  `grep -cE 'TODO\\(A4\\)' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 1 (the deferred-scope marker for aria-busy/CSS/reduced-motion
  → A4). Location: shell.
- **TC15** (`docs/plans/active.md` updated with A1 + A2 row additions
  + Pre-A3 squash HEAD fill + Stage A aggregate row replacement +
  起手指引 next-PR pointer flip + top-line phase summary flip) Input:
  `git diff main -- docs/plans/active.md`. Expected: diff includes (a)
  the A1 row line `| #31 | f765968 | A1 | ...`; (b) the A2 row line `|
  #32 | <SHA> | A2 | ...` (where `<SHA>` is the actual A2 squash HEAD);
  (c) the Pre-A3 row TBD → `3e2a4a9` substitution; (d) the Stage A
  aggregate row replacement (`A1-A8 (8 PRs)` → `A4-A8 (5 PRs)`); (e)
  the 起手指引 line 75 next-PR pointer flip from `Stage A1 ...` →
  `Stage A4 ...`; (f) the top-line phase summary flip from `Pre-A1 +
  Pre-A2 + Pre-A3 bootstrap + lock done; Stage A starting next session.`
  → `Pre-A1 + Pre-A2 + Pre-A3 + A1 + A2 + A3 done; Stage A4 ... is the
  next implementation PR.` All other content of `docs/plans/active.md`
  byte-unchanged. Location: shell.
- **TC16** (`pnpm-lock.yaml` byte-unchanged) Input:
  `git diff main -- pnpm-lock.yaml`. Expected: empty diff. A3
  introduces NO new workspace dependencies. If non-empty, executor must
  graduate `pnpm-lock.yaml` into `## files` per the SOTed-discipline
  collateral-drift protocol + bump canonical count + investigate root
  cause (likely `pnpm install` re-resolution; should not happen if
  lockfile is hermetic). Location: shell.
- **TC17** (Idempotent install) Input: `pnpm install` × 2. Expected:
  second run reports "Lockfile is up to date" and the `pnpm-lock.yaml`
  hash is unchanged across the two runs. Location: shell.
- **TC18** (Link-check passes via CI) Input:
  `.github/workflows/link-check.yml` on push to feature branch.
  Expected: workflow `success` conclusion (lychee CI-only per Wave 3
  baseline). Location: GitHub Actions. PR.md links here are all
  relative paths to in-repo files using plain path form (no `:line`
  suffix per memory `feedback_lychee_line_anchor`); no `~/.claude/...`
  markdown link form per memory `feedback_lychee_user_local_paths`.
- **TC19** (No new console.error placeholder log in
  `HeavyBlockBoundary.tsx`) Input:
  `grep -cE 'console\\.error' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: 0 (the A2 placeholder `console.error('[HeavyBlockBoundary:${kind}]
  load failed', err)` is removed entirely; `onLoadError` is the
  canonical telemetry channel). Location: shell.

## contracts_affected

- **None edited.** `packages/heavy-block-boundary/CONTRACT.md` is
  **byte-unchanged** in A3 — TC10 evidence. The placeholder note
  "full invariants land at A2-A4" stays intact. A3 satisfies a further
  subset of the eventual deep invariants (retry behavior via AC#7-#9 +
  bounded attempts via the `maxRetries` enforcement) but A4 still adds
  CSS+a11y. Consolidating the invariants into the CONTRACT.md prose
  is the A4 close gate per locked Wave 4 plan A4 + the natural pattern
  of editing CONTRACT.md once the full polish lands rather than
  incrementally.
- The list of AC#-numbers covered in A3 (`#7 / #8 / #9` newly satisfied
  + `#1 / #3 / #6 / #10 / #11` A2 regression baseline preserved) is
  captured in this PR.md `## acceptance` block + audit log; it does
  NOT trigger CONTRACT.md edit.

## adr_touched

- **None edited.** `docs/decisions/ADR-0014-heavy-block-boundary.md`
  is **byte-unchanged** in A3 — TC11 evidence. A3 implements ADR-0014
  D1 line 100-110 prop declarations (`errorText` / `retryLabel` /
  `maxRetries` / `onLoadError` consumed verbatim by A3 — no change to
  the prop signatures themselves; A2 already pinned the type interface
  byte-identical to the ADR-0014 D1 example) + D3 lines 152-160
  (reject path step 5 + retry path step 7 + `maxRetries` bound step 8
  + `onLoadError` telemetry hook). ADR-0014 status remains `proposed`;
  promotion `proposed → accepted` happens at A8 per locked Wave 4 plan
  Stage A close criterion #1.
- Per gatekeeper directive 2026-05-03 #1 + the A1/A2 PR.md precedent,
  this `adr_touched` field explicitly lists ADR-0014 even though no
  edits occur, since A3 is the third implementation PR materially
  advancing ADR-0014 D3 acceptance criteria. Reviewers verify A3 diff
  aligns with ADR-0014 D3 step 5 (reject path: set error state + render
  error affordance + call `onLoadError(err, attempt)`) + step 7 (retry
  click: increment attempt + new AbortController + re-call `load({
  signal })` + skeleton state restored during retry) + step 8 (after
  `maxRetries` exhausted: retry button disabled + error announcement
  persists) + the C5 bounded-attempt absorbtion (default `maxRetries=2`).

## acceptance

1. `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` function
   body extended with the A3 retry / error / maxRetries lifecycle:
   real `[attempt, setAttempt] = useState<number>(1)` (replacing A2's
   reserved unused `[, /* attempt */]` slot) + sibling `[error, setError]
   = useState<unknown>(null)` + `handleRetry` callback incrementing
   attempt + clearing error + the `useEffect` dep array changed from
   `[]` to `[attempt]` so React re-runs the effect on retry — TC13
   evidence; `props.onLoadError?.(err, attempt)` invoked in canonical
   reject branch + `setError(err)` set + NO `setComponent` call (so
   render falls into error fragment) — TC2 + TC13 evidence.
2. D1 prop interface (`HeavyBlockKindRegistry` / `HeavyBlockKind`
   branded widening / `HeavyBlockDimensions` / `HeavyBlockBoundaryProps<P>`,
   A2 lines 1-30) is **byte-identical** to A2; A3 does NOT change the
   public surface — TC8 + TC12 evidence; the A2 `.test-d.ts` fixture
   continues to assert generic `<P>` inference + branded widening (no
   regression).
3. AC#1 + AC#3 + AC#6 + AC#10 + AC#11 (A2's tests) all still PASS —
   TC1 evidence (no regression from A3 retry lifecycle). Particularly:
   AC#10 mount-guard contract preserved (cleanup flips
   `mountedRef.current = false` then aborts) AND AC#11 AbortSignal
   propagation preserved (every effect run constructs a fresh
   controller; cleanup aborts).
4. AC#7 (rejected load path) covered — Test 6; assertions:
   `onLoadError(err, 1)` called once + default error text "Failed to
   load jupyter" rendered + retry button enabled + `Component` NOT
   rendered + outer `<div data-block='jupyter'>` container preserved
   for layout stability + the A2 placeholder `console.error` log is
   ABSENT (canonical telemetry channel is `onLoadError`) — TC2 + TC19
   evidence.
5. AC#8 (retry path) covered — Test 7; assertions: `load` called twice
   with FRESH AbortSignal each time (first signal `.aborted === true`
   post-retry; signals are different instances) + Component renders
   post-retry with `data-loaded='true'` + childProps `name: 'A3-RETRY-OK'`
   threaded through to the loaded component — TC3 evidence.
6. AC#9 (`maxRetries={2}` bound) covered — Test 8; assertions:
   `onLoadError` called 3 times with attempt counter 1 → 2 → 3 + retry
   button `disabled === true` after the 3rd reject (because `canRetry
   = 3 <= 2 → false`) + 4th click does NOT trigger a 4th `load` call
   (disabled button does not fire onClick) — TC4 evidence.
7. `pnpm check` exit 0 globally — TC5 evidence; A3 does not regress
   any other package in the workspace.
8. `packages/heavy-block-boundary/CONTRACT.md` is byte-unchanged from
   A2 (the placeholder note "full invariants land at A2-A4" stays;
   A4 will consolidate after CSS+a11y land) — TC10 evidence.
9. `docs/decisions/ADR-0014-heavy-block-boundary.md` is byte-unchanged
   (status remains `proposed`; promotion to `accepted` is A8 scope per
   locked Wave 4 plan Stage A close criterion #1) — TC11 evidence.
10. `docs/plans/active.md` updated with the A1 + A2 row additions +
    Pre-A3 squash HEAD fill (`3e2a4a9`) + Stage A aggregate row
    replacement (`A1-A8 (8 PRs)` → `A4-A8 (5 PRs)`) + 起手指引 next-PR
    pointer flip (`Stage A1 ...` → `Stage A4 ...`) + top-line phase
    summary flip — TC15 evidence. This bundles the A2 PR.md `##
    acceptance` bullet 15 carry-over which the A2 merge did not absorb.
11. `pnpm-lock.yaml` is byte-unchanged — TC16 evidence. A3 introduces
    NO new workspace dependencies (decision: use `fireEvent` from
    `@testing-library/react` already in A2 devDeps; explicitly NOT
    adding `@testing-library/user-event`).
12. **No collateral regen drift** — `git diff` after EXECUTE is
    bounded to the files canonical in `## files` (count: see canonical
    line in `## files` end-marker = **4 files total**). Iteration log
    slots:
    - **Default (no graduation expected)**: `pnpm-lock.yaml` +
      `package.json` + `vitest.config.ts` + `.test-d.ts` all stay
      byte-unchanged.
    - **Possible graduation at EXECUTE**: if executor decides to add
      `@testing-library/user-event` (against the explicit plan
      guidance), `package.json` + `pnpm-lock.yaml` graduate concurrently
      and canonical count bumps from 4 → 6.
    - **Possible graduation at EXECUTE**: if the post-A3 test file
      estimate exceeds the 300 LOC ESLint warn, executor may split the
      3 new tests into a new `HeavyBlockBoundary.retry.test.tsx`
      file; if so, `HeavyBlockBoundary.test.tsx` stays unchanged
      (preserving TC1 byte-equivalence) AND
      `HeavyBlockBoundary.retry.test.tsx` graduates as a NEW file +
      canonical count bumps from 4 → 5. Default expectation: bundle
      into the existing file (file estimate ~250 LOC, within budget).
    - **Possible to graduate at REVIEW**:
      `docs/plans/wave-4-main/A3-heavy-block-boundary-retry.md` —
      already self-listed by pr-writer at PLAN per A1 + A2 R1 lesson;
      no graduation expected. If the codex review requests a
      clarification revision to PR.md, it stays in the canonical list
      (already there).
    - Workspace root `tsconfig.json` not touched (verified A1
      EXECUTE; root does not enumerate package references).
    - `pnpm-workspace.yaml` not touched (already includes `packages/*`).
    - `apps/site/**` not touched (A5 scope per ADR-0014 D8).
    - `packages/block-{jupyter,nn-viz,agent-flow}/**` not touched (A5
      scope for `heavyBoundaryDimensions` exports).
13. **Out-of-scope items deferred per Wave 4 plan A4-A8**: CSS file
    `packages/heavy-block-boundary/src/heavy-block-skeleton.css`
    consuming `@skb/design-tokens` CSS variables (A4); `aria-busy='true'
    → 'false'` toggle on Component-loaded state (A4 — A3 may flip to
    `'false'` on the error-state branch as a natural ARIA-loading-pattern
    alignment but the full toggle semantics is A4); `prefers-reduced-motion`
    rule (AC#14 — A4); a11y semantics test (AC#12 — A4); plugin
    extensibility test (AC#13 — A4); per-block dims source from
    `heavyBoundaryDimensions` (AC#15 — A5); apps/site migration
    replacing `makeHeavyBlockPlaceholder` with `<HeavyBlockBoundary>`
    (A5 scope per ADR-0014 D8); playwright T0/T1 layout-shift
    validation (AC#5 — A6); `*.astro` SSR variants 5× consolidation
    (Wave 3 C4a/C4b carry-over — A7); selective per-block chunking +
    perf baseline (C5 carry-over — A8); ADR-0014 promotion `proposed
    → accepted` (A8) — exhaustively enumerated in `## Out-of-scope`
    block.
14. Codex review iterations: expect **0-1 forward-fix rounds** (A2 was
    R1 PASS — clean baseline; A3 has slightly more surface to review
    [3 new tests + 50-70 LOC of retry/error/UI lifecycle] but smoother
    than A1's 3 rounds since the package shape is settled + the
    executor already knows the workspace conventions from A1+A2).
    Likely friction surfaces: (a) the `useEffect` dep array change
    from `[]` to `[attempt]` interacting with the eslint-disable-line
    for omitted `kind`/`load` (TC7 hunt); (b) the AC#8 retry test's
    AbortSignal-difference assertion (`load.mock.calls[1][0].signal !==
    load.mock.calls[0][0].signal`) — depends on the `vi.fn` call
    record persisting both arg references; (c) the AC#9 disabled-button
    semantics in happy-dom (`fireEvent.click` on a `disabled` button
    should NOT fire onClick — happy-dom honors this per HTML spec, but
    reviewer should verify); (d) the `setError(null)` placement
    (defensive on resolve branch + canonical on retry handler).
15. PR.md (`docs/plans/wave-4-main/A3-heavy-block-boundary-retry.md`)
    is self-listed in the staged file list at commit time per
    ADR-0006 D8 strict whitelist (PR #1 R2 lesson; carried through
    Wave 3 + Pre-A1+A2+A3 + A1 + A2).
16. Post-merge: NO additional `docs/plans/active.md` bookkeeping
    needed (A3 absorbs the A1+A2+A3 batch update inside its own diff
    per acceptance bullet 10). Future PRs (A4+) will append rows for
    A3 + later in subsequent PRs (one-row-per-PR cadence resumes after
    this batch catch-up).

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): **NO** — `packages/heavy-block-boundary/CONTRACT.md`
  is byte-unchanged in A3 (TC10 evidence); A1 already shipped the
  consumer-side CONTRACT.md with the public-surface declaration + the
  W4-1 cross-link to `block-foundation/CONTRACT.md`. A3 implements
  retry semantics that are part of the eventual deep invariants but
  the CONTRACT.md prose explicitly defers consolidation to A4 ("full
  invariants land at A2-A4"). Lock as NO.
- **Row 2** (package add/remove): **NO** — A3 adds NO workspace
  packages and NO new devDeps within the existing package (decision
  to use `fireEvent` over `user-event`). Workspace count stays at 23
  (post-A1 baseline; A2 modified devDeps but did not add a workspace
  package).
- **Row 4** (new ADR required): **NO** — ADR-0014 was already proposed
  at Pre-A2 + extended at Pre-A3 plan-lock; A3 implements the existing
  ADR's D3 sub-flow (steps 5 + 7 + 8) verbatim, no new design decision
  surfaces.
- **Row 5** (cross ≥ 3 packages): **NO** — A3 touches only
  `packages/heavy-block-boundary/` (1 source file modified + 1 test
  file modified) plus `docs/plans/active.md` (doc-only bookkeeping;
  not a package) plus this PR.md (doc-only). Effective package count
  = 1.
- **Row 8** (CI / build / deploy / auth / security): **NO** — pure
  in-package retry/error/maxRetries lifecycle implementation + tests
  + documentation bookkeeping; no CI workflow / deploy / auth /
  security surface change.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW NOT mandatory** (no Row 1/4
hit). Per Wave 4 plan A3 § + plan-challenger Q5 absorbtion, the
minimum at COMMIT-time is an orchestrator-self acceptance walk against
the `## acceptance` bullets. Codex review at stage 3 still applies the
ADR-0006 8-point checklist; absent a Row 1/4 hit, no second Claude
gate is required.

## executor

Standard ADR-0011 D1 pipeline. Third non-bootstrap Wave 4 PR — same
shape as A2 (Stage 4 PRE-COMMIT CLAUDE REVIEW NOT mandatory; no D2
row 1/4 hit per `## D2 trigger judgment` above).

- **PLAN**: `pr-writer` Claude subagent (this PR.md authored by
  pr-writer first invocation; orchestrator iterates 0-2 rounds before
  lock per ADR-0011 D1 stage 1 standard flow).
- **EXECUTE**: `codex-generic-executor` (gpt-5.5 + workspace-write
  sandbox per ADR-0011 D6 + Pre-A1-codified `--yolo` flag + R7 piping
  + pipefail). Dispatch invocation form per Pre-A1 R7:
  `set -o pipefail; timeout 1200 codex exec --yolo --profile codex-generic-executor "$(cat /tmp/A3-prompt.md)" < /dev/null 2>&1 | tee /tmp/codex-runs/2026-05-03-A3-generic-executor.txt > /dev/null`.
  Audit log archived per Pre-A1 R7 flow (head -2000 → `docs/audits/codex-runs/`).
  Executor reads PR.md `## files` + `## test_cases` + `## acceptance`
  + the in-scope ADR-0014 D3 step 5 + 7 + 8 + D1 line 100-110 prop
  declarations; TDD-front workflow per ADR-0011 D1 stage 2: writes the
  3 new test assertions FIRST → confirms they FAIL against the A2
  placeholder reject branch (which only logs to `console.error` and
  does not render error UI nor invoke `onLoadError` nor support retry)
  → implements the A3 retry / error / maxRetries lifecycle in
  `HeavyBlockBoundary.tsx` → confirms TC1-TC4 + the existing
  skeleton.test.ts all PASS → runs TC5-TC19 → applies the
  `docs/plans/active.md` bookkeeping diff per acceptance bullet 10
  guidance → reports back. Pre-flight responsibility: confirm
  `package.json` + `vitest.config.ts` + `.test-d.ts` + `pnpm-lock.yaml`
  all stay byte-unchanged (default plan); if any of those needs a
  graduation, append to `## files` + bump canonical count per the
  SOTed-discipline collateral-drift protocol (acceptance bullet 12).
- **REVIEW**: `codex-pr-reviewer-55` (ADR-0011 D1 stage 3 default
  reviewer; ADR-0006 8-point checklist mandatory). Audit log:
  `/tmp/codex-runs/2026-05-03-A3-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-03-A3-pr-reviewer-55.txt` truncated.
  Reviewer hunts especially for: (a) D1 prop interface byte-unchanged
  from A2 (TC12); (b) the cleanup ordering preserved (`mountedRef.current
  = false` BEFORE `controller.abort()` per A2 reviewer-hunt
  contract — A3 retry adds new effect re-runs but the cleanup contract
  is identical); (c) the `useEffect` dep array change from `[]` to
  `[attempt]` is correct + the eslint-disable-line for omitted
  `kind`/`load` still applies + lint passes (TC7); (d) the canonical
  reject path: `props.onLoadError?.(err, attempt)` invocation comes
  BEFORE `setError(err)` so telemetry fires regardless of UI state
  + abort-driven rejections stay silent NO-OP (no `onLoadError`, no
  `setError`); (e) the `setAttempt(prev => prev + 1)` uses the updater
  form (NOT `setAttempt(attempt + 1)`) to handle React 18 batching
  correctly; (f) the `disabled={!canRetry}` semantics on the retry
  button correctly bound at `attempt > resolvedMaxRetries` per
  ADR-0014 D1 line 106 default of 2; (g) the A2 placeholder
  `console.error` log is REMOVED entirely (TC19); (h) no scope creep
  into A4 CSS/a11y polish or A5 apps/site migration; (i) the 3 new
  test assertions accurately verify `onLoadError(err, attempt)` arg
  shape (especially the attempt counter 1 → 2 → 3 progression in
  Test 8); (j) `docs/plans/active.md` edits are scoped to the
  bookkeeping bullets (A1 + A2 rows + Pre-A3 SHA fill + aggregate row
  replace + 起手指引 + top-line) and do NOT touch unrelated content
  like the Wave 1+2+3 close summaries; (k) PR.md self-listed in
  `## files`.
- **PRE-COMMIT CLAUDE REVIEW**: **NOT mandatory** (no D2 row 1/4 hit
  per `## D2 trigger judgment` above). Orchestrator-self walks the
  `## acceptance` bullets 1-16 minimum, verifies TC1-TC19 results in
  the codex audit log, then authorizes COMMIT.
- **COMMIT (+ push)**: **reviewer codex** commits per ADR-0011 D1
  stage 5 (NOT orchestrator-self per ADR-0011 D1 + plan-challenger C6
  absorbtion). Reviewer applies ADR-0006 D8 explicit-file-list staging:
  `git reset HEAD` → `git add <files per ## files canonical list = 4>`
  → `git diff --cached --stat` verify staged count matches `## files`
  canonical (4 baseline; +1 if `HeavyBlockBoundary.retry.test.tsx`
  graduated; +1/+2 if package.json/lockfile graduated) → `git commit`
  → `git push`. Reviewer responsible for ensuring `pnpm-lock.yaml` is
  NOT staged when byte-unchanged (default; TC16) and IS staged when
  changed (lockfile blob discipline; memory
  `feedback_git_operator_explicit_stage`).
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per
  ADR-0011 D1 stage 6). Verifies the actual diff against this locked
  `## acceptance` block; flags scope creep (extra files outside the
  4-canonical + EXECUTE graduations) or scope drop (missing files);
  outputs ACCEPT or REJECT-with-residue. Residue list flows back to
  orchestrator for follow-up sequencing.

## Out-of-scope (explicitly deferred)

- **A4** — CSS / a11y polish: `packages/heavy-block-boundary/src/heavy-block-skeleton.css`
  consuming `@skb/design-tokens` CSS variables (D6) + `aria-busy='true'
  → 'false'` toggle on Component-loaded state (D2 + C2 absorbtion) +
  `prefers-reduced-motion` rule (AC#14) + a11y semantics test (AC#12)
  + plugin extensibility test (AC#13) + adding `@skb/design-tokens` to
  package-level deps + tsconfig refs. A4 also consolidates the deep
  invariants into CONTRACT.md (replacing the A1 placeholder note
  "full invariants land at A2-A4"). Note: A3 MAY flip `aria-busy` to
  `'false'` on the error-state branch as a natural ARIA-loading-pattern
  alignment if it cleanly drops in (executor's call; reviewer should
  NOT reject either choice; A4 will polish toggle semantics anyway).
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
  ui-default per ADR-0014 D5. **A5 scope**, not A3.
- **Editor (Tiptap NodeView) consumption**: ADR-0014 D9 explicit
  out-of-scope; editor stays unwrapped unless caller opts in.
  CONTRACT.md notes this; A3 does not change editor semantics.
- **Pre-wrapped helper exports** (`<Kind>RenderViewWithBoundary`)
  from heavy block packages per ADR-0014 D4 — discretionary future
  contribution; not pre-locked.
- **Per-token CSS variable additions** to `@skb/design-tokens` —
  ADR-0014 D6 leaves discretionary; A4 may add 1-2 (skeleton-bg /
  spinner-track / spinner-fg / error-bg / error-text) if not already
  present.
- **`fallback?: ReactNode` prop usage** — ADR-0014 D1 declares the
  prop in the API; A3 does NOT consume it in the render path (no
  override of SSR placeholder yet). A4's a11y polish may wire
  `fallback` as the override path. The prop stays declared in the
  type interface (unchanged) so consumers can reference it; A3 just
  doesn't render-substitute it.
- **`@testing-library/user-event`** — explicitly NOT added; A3 uses
  `fireEvent.click` from `@testing-library/react` (already a workspace
  dep added at A2) for the retry button click. This keeps
  `pnpm-lock.yaml` byte-unchanged. Future tests requiring more
  realistic user interaction (drag/keyboard with focus management)
  may add `user-event` in their own PR.
- **`useCallback` wrapping of `handleRetry`** — discretionary; the
  retry handler does not pass through component boundaries that need
  referential stability (it's bound to a single `<button onClick=...>`
  at the same component depth), so `useCallback` is not required for
  correctness. Executor MAY add `useCallback` for future-proofing if
  it cleanly drops in; reviewer should NOT reject either choice.
- **A4 / A5 CONTRACT.md consolidation**: A3 explicitly defers the
  deep-invariant prose update to A4 close per the locked Wave 4 plan;
  the placeholder "full invariants land at A2-A4" note in
  `packages/heavy-block-boundary/CONTRACT.md` remains in A3.

## Related

- [ADR-0014 D1 + D3](../../decisions/ADR-0014-heavy-block-boundary.md)
  — the ADR mandating this implementation; D1 line 100-110 = prop
  declarations consumed verbatim (`errorText` / `retryLabel` /
  `maxRetries` / `onLoadError`); D3 line 152-160 = retry / reject /
  maxRetries / onLoadError sub-flow (steps 5 + 7 + 8) — the heart of
  A3 implementation.
- [packages/heavy-block-boundary/CONTRACT.md](../../../packages/heavy-block-boundary/CONTRACT.md)
  — byte-unchanged in A3; A4 consolidates the deep invariants. The
  placeholder note "full invariants land at A2-A4" stays.
- [packages/block-foundation/CONTRACT.md W4-1 invariant](../../../packages/block-foundation/CONTRACT.md)
  — partner-side invariant from Pre-A2; A3 implementation honors the
  invariant by ensuring the boundary actually defers heavy `kind='viz'`
  block load until mount (per the W4-1 prose) AND now bounds retry
  attempts so a persistently failing load does not loop indefinitely.
- [Locked Wave 4 plan Stage A § A3](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  — the planning source-of-truth for A3 scope; lines 150-163 inside
  the A3 §; D8 + D9 cross-cuts; plan-challenger Q5 absorbtion (D2
  trigger judgment ROW judgments) applied here.
- [A2 PR.md](./A2-heavy-block-boundary-core.md) — A3 builds on the
  A2 hydration lifecycle; A2 is the SOTed v0.1.1 PR.md schema
  reference + A3 matches its section structure.
- [A1 PR.md](./A1-heavy-block-boundary-package.md) — A1 shipped the
  package shell; A3 inherits the package + CONTRACT.md placeholder.
- [Pre-A2 PR.md](./Pre-A2-adr-0014-heavy-block-boundary.md) — locked
  ADR-0014 + W4-1 in block-foundation; A3 implements ADR-0014 D3
  step 5 + 7 + 8 per the verbatim spec.
- [Pre-A3 PR.md](./Pre-A3-plan-lock.md) — locked Wave 4 plan; A3 is
  the third non-bootstrap PR after A1 + A2.
- [Pre-A1 PR.md](./Pre-A1-codex-runbook-yolo-tmp-piping.md) — codified
  `--yolo` + `/tmp` piping + `set -o pipefail` disciplines applied
  to all A3 codex dispatches.
- [ADR-0011 D1 standard pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — A3 exercises the standard D1 stages 1-3+5-6 (PLAN pr-writer /
  EXECUTE codex-generic-executor / REVIEW codex-pr-reviewer-55 /
  COMMIT reviewer-codex / ACCEPT pr-writer); stage 4 PRE-COMMIT
  CLAUDE REVIEW skipped per `## D2 trigger judgment` (no row 1/4
  hit).
- [ADR-0011 D2 v0.1.1 SOTed-PR.md amendment](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — schema discipline applied to this PR.md (single canonical fact
  per section; cross-reference rather than duplicate; canonical file
  count appears once in `## files` end-marker).
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — reviewer-codex commit phase staging discipline for A3 (4
  canonical files baseline; +1 if test file split graduated; +1/+2
  if package.json/lockfile graduated; lockfile NOT staged when
  byte-unchanged per TC16 default).
- [ADR-0008 D1 dead-dep policy](../../decisions/ADR-0008-wave-2-entry-policies.md)
  — A3 does NOT add new workspace deps (no devDeps either; uses
  `fireEvent` over `user-event`); ADR-0008 D1 strict reading is
  unchanged from A1+A2 posture.
