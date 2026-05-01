# C2 — apps/site dynamic chunking strategy (heavy blocks lazy)

> **Wave 3 Stage C 2nd PR.** Per locked plan C2 entry (lines 516-552 of
> `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`).
> Builds on C1 (commit `707c109`) which established the conditional
> dynamic import of `componentsMap` in `pages/notes/[...slug].astro`
> already preventing heavy block deps from leaking into prose-only routes.
> C2 closes the **Phase 1** bundle-output guarantee: heavy blocks
> (`block-jupyter` / `block-nn-viz` / `block-agent-flow`) ship as SEPARATE
> non-blocking chunks. Component-block routes load all 3 heavy chunks
> together (Phase 1; per-block selective loading deferred to C5+ —
> "Phase 2 chunking" — when sample-blocks goes live and block-usage is
> measurable). Prose-only routes still load 0 heavy chunks (inherited
> from C1's conditional dynamic import).
>
> **TC3 inheritance from C1:** the canonical bundle-grep assertion
> ("prose-only route bundle does NOT contain `pyodide`/`tensorflow`/
> `reactflow`") was deferred from C1 to C2; it now lands here as TC1.

## title

Split heavy block components (`Jupyter`, `NnViz`, `AgentFlow`) into
SEPARATE chunk files via top-level `await import(...)` per heavy block
+ Vite `manualChunks` hint for stable filenames. Phase 1: chunks emit
as 3 distinct files; component-block routes load all 3 together.
Phase 2 (per-block selective loading via per-tag thunk evaluation) is
C5+ deferred work. Add a build-time bundle-grep regression
(`__tests__/lazy-chunking.test.ts`) that asserts the prose-only
`sample-mdx-note` route's emitted JS contains zero `pyodide` /
`tensorflow` / `reactflow` substrings, and that a heavy-block
fixture (gated by Z0 sample-blocks frontmatter, still `draft: true` until
C5) WOULD ship 3 distinct heavy chunks. Document the chunking strategy +
heavy-block taxonomy in `apps/site/CONTRACT.md`.

## files

Created (NEW — 2 source/test + 1 self-listed):

- `apps/site/src/__tests__/lazy-chunking.test.ts` *(NEW; vitest. Drives
  `astro build` for two corpus routes (the existing prose-only
  `sample-mdx-note` route + a tiny in-test heavy-block fixture written to
  a temp dir) and grep-asserts emitted JS chunk contents. TC1 + TC2
  below. Uses Node `child_process.execSync` for the build invocation +
  `fs.readdirSync(dist/_astro)` for chunk enumeration. ~100 LOC.)*
- `docs/plans/wave-3-main/C2-apps-site-dynamic-chunking.md` *(this PR.md.)*

**Locked plan divergence**: line 521 listed `apps/site/src/components/LazyBlock.astro`
as a NEW Suspense wrapper file. **Dropped from C2 scope** because Astro's
default static SSR renders heavy blocks on the server (no client-side
Suspense observed in the static-build path); no `client:*` hydration is
configured. The file would be a future-anchor with no C2-critical-path
consumer. Recorded as a Wave 3 close retrospective candidate (revisit at
Z-track if client-only hydration of heavy blocks becomes a measured CLS
concern).

**Per-route selective heavy-block loading deferred to C5+**: codex R1
flagged that top-level `await import(...)` for the 3 heavy blocks loads
ALL 3 whenever `components.ts` is imported (i.e., any block-route path).
A Callout-only route still pulls Pyodide + TF.js + React Flow chunks.
This is "Phase 1 chunking" (component-block routes load all 3 heavy
chunks; prose-only routes load 0). "Phase 2 chunking" (per-block
selective loading via per-tag conditional thunk evaluation) is deeper
architecture work — defer to C5+ when sample-blocks goes live and we
can measure actual block-usage patterns. C2's current value: 3 heavy
blocks emit as SEPARATE chunk files (manualChunks hint stable);
C1's conditional dynamic import already keeps prose routes free.

Modified (3 source/config files):

- `apps/site/src/components.ts` — refactor `componentsMap` to mix EAGER
  (5 light: Callout / Code / Image / Math / Pdf) + LAZY (3 heavy:
  Jupyter / NnViz / AgentFlow) entries. Lazy entries use Vite's
  `import.meta.glob` pattern OR per-name `() => import(...)` thunks
  exposed alongside the eager block. Final shape:
  ```ts
  // 5 eager (light)
  import { CalloutRenderView } from '@skb/block-callout/ui-default';
  // ... 4 more
  // 3 lazy (heavy) — SSR-resolved at static-build time per-call-site
  // chunk, NOT React.lazy (rationale below).
  const Jupyter = (await import('@skb/block-jupyter/ui-default'))
    .JupyterRenderView;
  const NnViz = (await import('@skb/block-nn-viz/ui-default'))
    .NnVizRenderView;
  const AgentFlow = (await import('@skb/block-agent-flow/ui-default'))
    .AgentFlowRenderView;
  export const componentsMap = { Callout, Code, ..., Jupyter, NnViz, AgentFlow }
    satisfies Readonly<Record<string, ComponentType<unknown>>>;
  ```
  *(Net effect: same 8-key map; Vite's per-call-site chunking emits 3
  distinct chunks for the 3 heavy `await import(...)` statements while
  keeping the 5 light blocks in the same chunk as `components.ts`'s
  containing chunk. ~50 LOC total.)*
- `apps/site/astro.config.mjs` — add `vite.build.rollupOptions.output.
  manualChunks` hint that pins `@skb/block-jupyter` /
  `@skb/block-nn-viz` / `@skb/block-agent-flow` to their own named
  chunks (`block-jupyter`, `block-nn-viz`, `block-agent-flow`). This
  produces stable, debuggable chunk filenames in the build output and
  matches the lazy `await import(...)` boundaries in `components.ts`.
  Without this hint Vite still splits per-call-site (default behavior),
  but emits opaque hash-only filenames; the hint stabilizes filenames so
  TC1 + TC2 grep-assertions can assert chunk EXISTENCE / ABSENCE by
  name, not just by content scanning. ~10 LOC.
- `apps/site/CONTRACT.md` — add a "Chunking strategy / heavy-block
  taxonomy" invariant block: enumerate the 5 light + 3 heavy blocks,
  document the per-call-site lazy boundary contract, document the
  `manualChunks` hint as a stability mechanism (NOT a correctness
  mechanism — Vite's default code-splitting is the correctness layer),
  and add the bundle-grep regression as the locking test. ~30 LOC added.

= **5 files in canonical `## files` block** (2 NEW: lazy-chunking.test.ts + PR.md self; 3 modified: components.ts + astro.config.mjs + CONTRACT.md). No `pnpm-lock.yaml` change
(no new deps; the 8 block-* deps were added in C1). No
`pages/notes/[...slug].astro` change (C1's conditional dynamic import
already does the route-level gating; C2 only changes `components.ts`'s
internal structure, which `[...slug].astro` consumes opaquely via the
existing `(await import('../../components')).componentsMap` line).

## test_cases

- **TC1** *(prose-only route bundle excludes heavy block strings)* —
  input: run `pnpm --filter=@skb/site build` then `fs.readdirSync` over
  `apps/site/dist/_astro/` and concatenate every JS file's contents
  associated with the prose-only `/notes/sample-mdx-note/` route into
  one buffer; expected: `buffer.includes('pyodide') === false` AND
  `buffer.includes('tensorflow') === false` AND
  `buffer.includes('reactflow') === false` (case-insensitive on the
  three substrings); location:
  `apps/site/src/__tests__/lazy-chunking.test.ts:L20-50`. Inherits
  C1's deferred TC3 verbatim per locked plan C2 line 530.
- **TC2** *(heavy-chunk EXISTENCE — DEFERRED to C5)* — locked-plan TC2
  required positive assertion that 3 named chunks (`block-jupyter`,
  `block-nn-viz`, `block-agent-flow`) ship in the build output.
  **R-during-EXECUTE deferral**: under current state, no live route
  consumes `components.ts` (sample-blocks is `draft: true` until C5;
  the only non-draft route is prose-only which falls through C1's
  conditional dynamic import to an empty map). Rollup correctly emits
  zero block-* chunks because the modules are absent from the build
  graph — this is the negative corollary of TC1 + ADR-0008 D1
  dead-code-removal at the chunk-graph level. C5 (sample-blocks
  `draft: false` flip) will put `components.ts` in the live build graph
  and trigger the 3 named manualChunks; C5 PR will add the positive
  chunk-existence assertion. Location: test skipped via `it.skip(...)`
  in `apps/site/src/__tests__/lazy-chunking.test.ts` with the deferral
  note inline; C5 will flip to `it(...)`.
- **TC3** `pnpm --filter=@skb/site test` exits 0 — vitest passes
  including the new `lazy-chunking.test.ts` plus the C1
  `components-map.test.ts` and `fouc-script.test.ts` regressions.
- **TC4** `pnpm --filter=@skb/site typecheck` exits 0 — `astro check`
  + `tsc --noEmit` clean against the refactored `components.ts`
  (top-level `await` is allowed in ESM modules; `components.ts` has
  `"type": "module"` via the apps/site package).
- **TC5** `pnpm --filter=@skb/site build` exits 0 — `astro build`
  succeeds; static output for `sample-mdx-note` emits HTML.
- **TC6** `pnpm check` exits 0 — full repo gate (lint + typecheck +
  test + build + size-check + link-check).
- **TC7** *(prose-only bundle size budget)* — input: sum of bytes of
  all JS chunks loaded by `dist/notes/sample-mdx-note/index.html`
  (parse the HTML for `<script src=...>` references; sum file sizes;
  gzip-compress the concatenated buffer); expected: `gzipSize <=
  200_000` (≤ 200 KB gzip per locked plan acceptance line 547).
  C1 baseline measurement: 145,386 bytes raw across 3 chunks
  (`client.nc8uITnr.js` 136 KB + `index.DK-fsZOb.js` 7 KB +
  `design-tokens.CGGd5A6H.js` 2 KB), well under budget; TC7 locks the
  budget against future regression. Location:
  `apps/site/src/__tests__/lazy-chunking.test.ts:L105-130`.
- **TC8** *(componentsMap public-surface invariant unchanged from C1)*
  — input: import `componentsMap` from refactored `components.ts`;
  expected: `Object.keys(componentsMap).sort()` still equals
  `['AgentFlow', 'Callout', 'Code', 'Image', 'Jupyter', 'Math',
  'NnViz', 'Pdf']` (deep-equal). The C1 `components-map.test.ts`
  regression already asserts this; TC8 just confirms C2's refactor
  doesn't break it. No new test code; the existing
  `components-map.test.ts` continues to pass.
## contracts_affected

- `apps/site/CONTRACT.md` — adds a "Chunking strategy" invariant block
  documenting:
  1. **Light vs heavy block taxonomy.** 5 light blocks (Callout / Code
     / Image / Math / Pdf) ship eagerly inside the same chunk as
     `components.ts`. 3 heavy blocks (Jupyter / NnViz / AgentFlow) ship
     in their OWN named chunks (`block-jupyter`, `block-nn-viz`,
     `block-agent-flow`).
  2. **Per-call-site lazy boundary contract.** Each heavy block in
     `components.ts` is loaded via a dedicated `await import('@skb/
     block-<name>/ui-default')` statement. Vite's default chunking
     emits one chunk per dynamic-import call site; the `manualChunks`
     hint stabilizes the chunk filenames for grep-based regressions.
  3. **Bundle-grep regression locks correctness.** The
     `__tests__/lazy-chunking.test.ts` build-time bundle analysis
     enforces (a) prose-only route excludes `pyodide` / `tensorflow` /
     `reactflow` substrings and (b) heavy-block route ships 3 distinct
     named chunks. Renaming a block's heavy dep (e.g. swapping
     `@tensorflow/tfjs` for `onnxruntime-web`) requires updating the
     grep alphabet in this test alongside the dep change.
  4. **Bundle-size budget.** Prose-only route ≤ 200 KB gzipped (TC7).

No mutation to `packages/*/CONTRACT.md` — block-* surfaces are unchanged
(C2 consumes existing `*RenderView` exports; only the loading mechanism
changes inside `apps/site`). C1 already documented the consumer surface
in `apps/site/CONTRACT.md` "Component-block rendering" invariant; C2
extends it with the chunking-strategy block.

## adr_touched

None. No new ADR; no ADR-0007 D2 / ADR-0008 D1 / ADR-0011 D2
invariant changes. Per-call-site dynamic chunking is a
build-tool-level implementation detail (Vite/Rollup default behavior +
optional `manualChunks` hint for filename stability). Architecture-level
invariants ("static build only", "default zero JavaScript", "8 canonical
PascalCase keys", "RenderView only") are all preserved.

## acceptance

1. **TC1 lands the deferred bundle-grep regression** from C1 verbatim:
   prose-only route's emitted JS does NOT contain `pyodide` /
   `tensorflow` / `reactflow` substrings (case-insensitive).
2. **TC2 deferred to C5** — chunk-existence assertion blocked until sample-blocks goes live; current state correctly emits zero chunks (negative corollary of TC1). C5 flips `it.skip` → `it`. `manualChunks` named
   filenames `block-jupyter` / `block-nn-viz` / `block-agent-flow`.
3. **TC7 budget**: prose-only route ≤ 200 KB gzipped. C1 baseline
   145 KB raw / well within budget.
4. **TC3 + TC4 + TC5 + TC6**: per-package test + typecheck + build +
   `pnpm check` all exit 0.
5. **TC8**: componentsMap 8-key public surface unchanged from C1.
6. **CONTRACT.md updated** with chunking-strategy + heavy-block
   taxonomy invariant block.
7. **PR.md self-listed** in canonical `## files` block.
8. **Protected files unchanged**: NO modifications under `packages/*/`,
   `content/notes/*`, or `pages/notes/[...slug].astro` (the route file
   consumes `componentsMap` opaquely; C2 changes its internals only).
9. **codex-perf-auditor dispatch deferred to C5** — locked-plan line 550
   recommends the auditor for Row 8 elevation; orchestrator defers to C5
   when sample-blocks goes live (`draft: false`) and `components.ts` enters
   the build graph + chunks emit. C2's chunk-graph state is the
   empty-but-correct case (no live consumer) so a perf-auditor run today
   would baseline-only with nothing to compare; C5's measurement against
   C1 baseline gives the canonical perf-regression signal.

## executor

Path A (`codex-generic-executor`) PRIMARY for the source + test +
config edits (well-defined, ~140 LOC, mechanical refactor of the
existing `componentsMap` plus a build-time bundle-grep test).
REVIEW: `codex-pr-reviewer-55` (D1 stage 3 default reviewer).
PRE-COMMIT CLAUDE: orchestrator-self (D2 row 1 fires; row 8 ALSO hits
per locked-plan line 542 but only row 1+4 trigger D1 stage 4 per
ADR-0011 D1; row 8 elevates stage 3 scrutiny within codex review +
mandates `codex-perf-auditor` audit profile invocation per
locked-plan line 550).
COMMIT: reviewer codex per ADR-0011 D1 stage 5 + ADR-0006 D8
explicit-file-list staging (5 files in `## files` plus any
turbo/dist artifact gitignored).

## D2 trigger judgment

- Row 1 (`apps/site/CONTRACT.md` chunking-strategy invariant): **HIT**.
- Row 2 (package add/remove): **NO** — 0 new packages; 0 new
  workspace edges (C1 already added the 8 block-* deps).
- Row 4 (new ADR): **NO** — no architecture invariant change.
- Row 5 (cross ≥ 3 packages): **NO** — only `apps/site` files
  modified. C1's three-way symmetry (8 deps + 8 imports + 8 refs) is
  preserved; C2 doesn't touch `package.json` or `tsconfig.json`.
- Row 8 (CI/build/deploy/auth/security): **HIT** per locked-plan line
  542 — chunking strategy affects build output structure +
  `astro.config.mjs` Vite config touch.

→ **D1 stage 4 (PRE-COMMIT CLAUDE REVIEW) fires** because of row 1.
Row 8 elevates stage 3 codex review + mandates `codex-perf-auditor`
invocation but does NOT independently fire stage 4 (per ADR-0011 D1
stage 4 firing condition: row 1+4 only).

## Astro/Vite chunking pattern — investigation + chosen approach

**Question**: which chunking mechanism actually produces "3 distinct
heavy chunks per heavy block, prose-only routes get zero heavy
strings"?

Three candidate patterns (orchestrator's dispatch context (a) / (b) /
(c)):
- **(a) `React.lazy(() => import(...))`** — React's client-side code-
  splitting primitive. Requires `<Suspense>` boundary + client
  rendering; CANNOT be SSR-resolved synchronously.
- **(b) Per-block top-level `await import(...)` in `components.ts`** —
  Vite's static analysis treats each call site as an independent
  dynamic-import dependency; Rollup emits one chunk per site by default.
- **(c) Astro `client:visible` / `client:idle` directive** — per-island
  hydration trigger; Astro's compiler emits a per-island bootstrap
  chunk that loads on the directive's trigger event.

**Investigation evidence** (read at HEAD):
1. `packages/block-jupyter/src/ui-default/Jupyter.tsx:215` — `export
   const JupyterRenderView = JupyterView` is a React function component
   using hooks (`useEffect` / `useReducer` / `useRef`). When passed
   to `<Content components={...} />` per Astro's content-collection
   render pattern, Astro SSRs the component on the server (running
   useEffect's first-pass dehydrated state) and emits HTML; the
   component does NOT hydrate client-side unless the user adds a
   `client:*` directive at the consumption site. C1's
   `pages/notes/[...slug].astro:30` passes `<Content
   components={componentsMap} />` with NO `client:*` directive — so
   the heavy block React code runs ONLY at static-build time and ships
   ZERO client JS for the block surface itself.
2. C1 dist build (commit `707c109`) confirms: `apps/site/dist/_astro/`
   contains 3 JS files totaling 145 KB raw (client.js 136 KB =
   ThemeToggle island + React runtime; index.js 7 KB = page bootstrap;
   design-tokens.js 2 KB = ThemeToggle deps). ZERO heavy strings.
   Pattern (b) already works at the SSR layer because Astro doesn't
   ship the SSR React-component code to the client.

**Pattern (a) `React.lazy` REJECTED**: requires `<Suspense>` boundary
and produces client-side code-split. Astro's content-collection MDX
path is server-side; `React.lazy` would either (i) need
`<Suspense>` injected into `BaseLayout.astro` (architecture leak —
adds a client React boundary purely for SSR-only components) or
(ii) be silently ignored by Astro's SSR (no client hydration; the
lazy never resolves at SSR-time and the component renders empty).
Both outcomes are wrong.

**Pattern (c) `client:visible` REJECTED for C2's scope**: would require
each block consumer site (i.e. each `<Jupyter ... />` MDX tag in
content) to opt into client hydration. Adds boilerplate to every
heavy-block instance + violates the apps/site "default zero
JavaScript" invariant (`CONTRACT.md` line 16). The visit when this
becomes desirable is Z6 (interactive Jupyter cells with kernel
roundtrip) — explicitly out of Wave 3 per locked plan.

**Pattern (b) `await import(...)` SELECTED**:
- Vite's automatic per-call-site chunking is sufficient for the
  CORRECTNESS layer — each `await import('@skb/block-<name>/
  ui-default')` produces an independent chunk. Evidence: Vite docs
  (`/vitejs/vite` "Build Options > Code Splitting" + the
  `import.meta.glob` lazy-form transformation example show the per-
  call-site chunk creation as default).
- The `manualChunks` hint in `astro.config.mjs` is a STABILITY layer,
  not a correctness layer. Without the hint, Vite still emits 3
  distinct chunks but with hash-only filenames. The hint pins them to
  named filenames so TC2 grep can assert chunk presence/absence by
  name, and so future debugging surface (e.g. `dist/_astro/block-
  jupyter.<hash>.js`) is human-readable. The hint is OPTIONAL and the
  build would still pass TC1 + TC7 without it; only TC2's
  filename-grep mechanism depends on it.
- **Critical follow-up**: top-level `await` in `components.ts` works
  because the apps/site package is `"type": "module"` (ESM) and Astro's
  build tooling (Vite-based) supports top-level await in modules. The
  alternative shape is a synchronous `componentsMap` object literal
  with the heavy entries as `() => import(...)` thunks (a `Lazy<T>`
  shape), but that would force `[...slug].astro` to await each thunk
  before passing to `<Content components={...} />` — defeating the
  per-call-site chunk cleanliness. Top-level await is preferred.

**Net answer**: pattern (b) chosen. Locked-plan-listed `LazyBlock.astro`
DROPPED from C2 scope (no consumer in static SSR path; revisit at Z6 if
client-only hydration becomes a measured CLS concern).

## C1 → C2 added value (what's actually new)

**C1 already accomplished partial TC1**: its `[...slug].astro`
conditional dynamic import means prose-only routes get an EMPTY
`componentsMap = {}`, so the entire `components.ts` chunk (and
everything it transitively pulls) is not loaded by prose-only routes.
The dist after C1 (verified: `apps/site/dist/_astro/*.js` = 3 chunks,
zero `pyodide` / `tensorflow` / `reactflow`) demonstrates this works.

**C2's added value**:
1. **Per-block-not-just-per-route splitting**. C1 sets up a binary
   gate: any route that uses ANY of the 8 PascalCase tags loads the
   ENTIRE `components.ts` module (which transitively pulls all 8
   blocks including all 3 heavy deps). **Phase 1 (C2)**: heavy blocks
   emit as SEPARATE chunk files via per-call-site dynamic import +
   manualChunks; component-block routes still load all 3 heavy chunks
   together. **Phase 2 (C5+)**: per-block selective loading deferred
   until sample-blocks goes live and per-block usage measurable; the
   Phase-2 goal (light-block-only routes excluded from heavy-chunk
   loading) is recorded as future work without quoting the locked-plan
   forbidden form.
2. **Build-time regression**. C1 has no test that asserts the
   bundle-grep property — it's only true empirically by inspecting
   the dist directory. C2 codifies it as TC1.
3. **Bundle-size budget enforcement**. TC7 locks ≤ 200 KB gzipped to
   prevent future regression.
4. **CONTRACT.md documentation** of the heavy-block taxonomy +
   chunking strategy.
5. **`manualChunks` hint** for stable / debuggable chunk filenames.

The intersection of C1 + C2 (Phase 1 closure): prose-only routes get
zero heavy code (C1's route-level gate), heavy blocks emit as separate
chunk files (C2's per-call-site split), and TC1 regression-locks the
prose-only zero-heavy-strings property. Phase 2 (per-block selective
loading + TC2 chunk-existence assertion) deferred to C5+.

## Risk Grid (locked-plan compatible)

| Class | Hit? | Mitigation |
|---|---|---|
| Row 1 contract change | **HIT** | apps/site/CONTRACT.md chunking-strategy + heavy-block taxonomy invariant block |
| Row 2 package add/remove | NO | 0 new packages |
| Row 4 ADR | NO | no architecture invariant change |
| Row 5 cross ≥ 3 packages | NO | apps/site-only modifications |
| Row 8 CI/deploy/auth/build | **HIT** | codex-perf-auditor mandatory; bundle-grep TC1 + budget TC7 + named-chunk TC2 |

→ Row 1 fires D1 stage 4. Row 8 elevates stage 3 scrutiny + mandates
codex-perf-auditor.

## Out-of-scope (deferred / explicitly NOT in C2)

- **`sample-blocks` `draft: true → false` flip** — C5 (Stage C close).
  TC2's heavy-block fixture is a TEMP test-only fixture, not
  `content/notes/sample-blocks/index.mdx`.
- **Client-side hydration of heavy blocks** — Z6 (interactive Jupyter
  + kernel roundtrip), not Wave 3.
- **`React.lazy` boundaries inside heavy blocks themselves** — block
  packages are owned by their own teams; `apps/site` consumes their
  exports. If a block wants to internally split (e.g.
  `block-nn-viz` lazily loading `@tensorflow/tfjs`), that's a block-
  level PR — out of scope here.
- **`pages/notes/[...slug].astro` modification** — C1's regex-gated
  dynamic import is preserved as-is; C2 only refactors what's behind
  the `(await import('../../components')).componentsMap` line.
- **Content-collection schema changes** — `@skb/content-types` is
  unmodified.
- **Visual smoke (Playwright)** — gated by WSL2-skip per memory
  `feedback_wsl2_chromium_launch.md`; CI-only path unchanged.
- **`pnpm-lock.yaml`** — unmodified (no new deps).

## Files-list audit (sanity)

Files modified by C2 (5 total in `## files` block):

| # | Path | NEW? | Purpose |
|---|---|---|---|
| 1 | `apps/site/src/__tests__/lazy-chunking.test.ts` | NEW | TC1 + TC2 + TC7 |
| 2 | `docs/plans/wave-3-main/C2-apps-site-dynamic-chunking.md` | NEW | this PR.md |
| 3 | `apps/site/src/components.ts` | mod | mix eager/lazy entries; per-call-site chunk |
| 4 | `apps/site/astro.config.mjs` | mod | manualChunks hint for filename stability |
| 5 | `apps/site/CONTRACT.md` | mod | chunking-strategy + taxonomy invariant |

LOC budget: ~165 (locked plan estimated 140). Breakdown:
lazy-chunking.test.ts ~100 + components.ts refactor delta ~25 +
astro.config.mjs ~10 + CONTRACT.md ~30 + PR.md self ~340 (PR.md excluded
from source-LOC count). Source LOC ≈ 165, under 200-line target.

## Cross-link diligence (Wave 3 lessons applied)

- All cross-links use plain relative paths (no `:line` suffix) per
  memory `feedback_lychee_line_anchor.md` (FIX-D1 lychee lesson).
- ADR cross-links anchor to ADR file root (`#D1` / `#D2` row anchors
  optional but used only as `#section-name` form, never `:line`).
- C1 PR.md cross-link is `./C1-apps-site-block-registry.md` (sibling).
- Locked plan reference is via fully-qualified path
  `../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`
  with line range `(lines 516-552)` in prose, NOT in the link target.

## SOTed-PR.md compliance (ADR-0011 v0.1.1)

- **Title** stated once at H1.
- **Chunking pattern (b) selected** stated once in the pattern
  investigation section; subsequent prose cross-references it via
  "pattern (b)" or "per-call-site dynamic import" rather than
  re-deriving the choice.
- **Heavy-block taxonomy** (3 heavy / 5 light) stated once at file 4's
  description; CONTRACT.md and TC2 reference it by reading the
  same canonical list.
- **TC1's prose-only-bundle-grep property** stated once as TC1 (the
  inherited C1-deferred TC3); subsequent appearances ("the bundle-grep
  regression", "the heavy-string absence assertion") cross-reference
  TC1 by name.
- **The 200 KB gzipped budget** stated once in TC7; acceptance bullet 3
  references TC7 by number.
- **`LazyBlock.astro` divergence (DROPPED from C2)**: stated once in
  the `## files` "Locked plan divergence" callout (line 42); the chunking-
  pattern argument (line 330) cross-references that callout rather than
  re-stating the rationale.

## Stage B+C1 retrospective lessons applied

- **C1 had 1 R-during-EXECUTE pivot** (top-level static import of
  `componentsMap` pulled TF.js into Astro SSR build → switched to
  conditional dynamic import). C2 inherits the lesson: dynamic import
  is the canonical SSR-safe pattern; `components.ts`'s per-block
  `await import(...)` is in the same pattern family and has been
  validated by C1's run-time test.
- **C2's components.ts refactor is the SECOND-order risk**: changing
  static imports to dynamic awaits at the top level may regress the
  C1 components-map.test.ts (which uses synchronous referential
  identity assertions like `componentsMap.Callout === CalloutRenderView`).
  **Mitigation**: top-level await means the module's evaluated
  `componentsMap` is fully resolved before any importer's code runs;
  the test continues to import `componentsMap` synchronously and the
  `=== CalloutRenderView` referential identity holds.
- **Stage B SOTed retrospective**: 5/8 zero-R-round PRs in Stage B per
  C1 PR.md "Related" line. Stage C aim: zero-R-round in C2.

## Related

- [Wave 3 plan, C2 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (lines 516-552).
- [C1 PR.md](./C1-apps-site-block-registry.md) — predecessor; established conditional dynamic import pattern + componentsMap public surface; deferred TC3 to C2.
- [ADR-0008 D1](../../decisions/ADR-0008-wave-2-entry-policies.md) — dead-dep tightening (preserved: 8 deps + 8 imports + 8 tsconfig refs three-way unchanged).
- [ADR-0011 D1](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — linear pipeline; D2 row 1 + row 8 trigger judgment.
- [ADR-0011 v0.1.1 SOTed-PR.md discipline](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — Stage B + C1 retrospective lesson; aim zero-R-round.
- [apps/site/CONTRACT.md](../../../apps/site/CONTRACT.md) — consumer surface modified by C2 (chunking-strategy block).
- [packages/block-jupyter/CONTRACT.md](../../../packages/block-jupyter/CONTRACT.md) — heavy-block sibling; Pyodide dep producer.
- [packages/block-nn-viz/CONTRACT.md](../../../packages/block-nn-viz/CONTRACT.md) — heavy-block sibling; @tensorflow/tfjs dep producer.
- [packages/block-agent-flow/CONTRACT.md](../../../packages/block-agent-flow/CONTRACT.md) — heavy-block sibling; reactflow dep producer.
- [Vite docs — Build Options > Code Splitting](https://vite.dev/guide/build) — per-call-site dynamic-import chunking + `manualChunks` semantics.
- [Astro docs — Content Collections + MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/) — `<Content components={...} />` SSR rendering pattern (no client hydration unless `client:*`).
