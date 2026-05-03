# A5 — apps/site dims migration via `heavyBoundaryDimensions` per ADR-0014 D5+D8 (3 heavy blocks declare; apps/site consumes; `makeHeavyBlockPlaceholder` retired)

> **Wave 4 Stage A fifth implementation PR.** Closes ADR-0014 D5
> (per-block dimensions ownership) + D8 (migration of 3 existing heavy
> blocks) + AC#15 (contract test confirms apps/site imports
> `heavyBoundaryDimensions` from each heavy block, NOT inline literals).
> Adds the `heavyBoundaryDimensions: HeavyBlockDimensions` export to
> `packages/block-{jupyter,nn-viz,agent-flow}/src/ui-default/<kind>.ui.ts`
> with the ADR-0014 D5 default values (jupyter `{ width: 600, height:
> 400 }` / nn-viz `{ width: 500, height: 400 }` / agent-flow `{ width:
> 600, height: 400 }`); re-exports the new const through each
> `ui-default/index.ts` barrel; declares the runtime workspace dep on
> `@skb/heavy-block-boundary` in each heavy block `package.json`
> (`dependencies` block; ADR-0008 D1 dead-dep policy satisfied — the
> type-only import in `<kind>.ui.ts` plus the apps/site runtime
> consumer chain together prove `declared AND used`); adds the matching
> `tsconfig.json` `references` entry per workspace composite-project
> convention; documents the new public export in each
> `packages/block-{jupyter,nn-viz,agent-flow}/CONTRACT.md` `## Public
> surface` section (D2 Row 1 trigger × 3 — single architectural-surface
> change repeated across the 3 sister contracts; D1 stage 4 PRE-COMMIT
> CLAUDE REVIEW MANDATORY per ADR-0007 D2 row 1 + ADR-0011 D1+D2
> v0.1.1). Rewires `apps/site/src/components.ts` per ADR-0014 D8
> verbatim: removes the A1 `__A1_HEAVY_BLOCK_BOUNDARY_REF`
> evidence-export (no longer needed once HeavyBlockBoundary is invoked
> at runtime in the new componentsMap factories — A1 acceptance bullet
> 8 explicitly forecasts this cleanup at A5); removes the
> `makeHeavyBlockPlaceholder` factory function (replaced by
> HeavyBlockBoundary calls); replaces the 3 `import type {} from
> '@skb/block-{jupyter,nn-viz,agent-flow}/ui-default';` zero-symbol
> placeholder imports with value imports of `<Kind>RenderView` +
> `heavyBoundaryDimensions as <kind>Dims`; defines 3 factory functions
> (`Jupyter` / `NnViz` / `AgentFlow`) using `createElement(HeavyBlockBoundary,
> { kind, dims, load, childProps })` form (file extension is `.ts` not
> `.tsx`; uses `createElement` per existing convention at line 1 of
> `components.ts`); the load adapter wraps `m.<Kind>RenderView`
> through `makeMdxAdapter` so the lazy-loaded RenderView receives
> `BlockViewProps` (NOT FlatProps) at invocation time — same
> prop-shape adapter pattern the 5 light blocks use synchronously; the
> componentsMap entries for `Jupyter` / `NnViz` / `AgentFlow` are
> rebound from `asMdxComponent(makeHeavyBlockPlaceholder('<kind>'))` to
> `asMdxComponent(<Kind>)` referencing the new factory functions.
> Contract test for AC#15 lands as a NEW small test file
> `apps/site/src/__tests__/dims-source.test.ts` (separate from the
> existing `components-map.test.ts` to keep test boundaries clean per
> the per-AC test-file convention) that statically reads
> `apps/site/src/components.ts` source via `node:fs` + asserts (a) the
> 3 dims aliases (`jupyterDims` / `nnVizDims` / `agentFlowDims`) are
> imported from the heavy block ui-default barrels (NOT inline literals),
> (b) NO `width: 600` / `width: 500` / `height: 400` numeric literal
> appears anywhere in the source body (proves the dimensions sourced
> from heavy block packages per ADR-0014 D5 + AC#15). Bundles A4 row
> backfill + A5 row + Stage A pointer flip into `docs/plans/active.md`
> per the one-row-per-PR cadence resumed at A4 close (the A4 `#TBD`
> row at line 18 of `active.md` gets its squash HEAD filled with
> `5f360a6` per A4 ACCEPT report; the next-PR pointer at line 6 + line
> 79 flips from "Stage A5 (apps/site dims migration; AC#15)" to "Stage
> A6 (playwright zero-layout-shift T0/T1; AC#5)"; the Stage A remaining
> row decrements from `A5-A8 (4 PRs)` to `A6-A8 (3 PRs)`; the top-line
> phase summary appends "+ A5" to the done list). Standard ADR-0011 D1
> pipeline (codex-generic-executor EXECUTE; codex-pr-reviewer-55 REVIEW
> + COMMIT; **PRE-COMMIT CLAUDE REVIEW MANDATORY** per D2 Row 1 HIT
> ×3 contracts; pr-writer ACCEPT). AC coverage in A5: **#15** newly
> satisfied; **#1 / #3 / #6 / #7 / #8 / #9 / #10 / #11 / #4 / #12 /
> #13 / #14** A2+A3+A4 regression baseline preserved (TC1 + TC4). D1
> prop interface (lines 1-30 of `HeavyBlockBoundary.tsx`) is
> **byte-identical** to A4. ADR-0014 is **NOT modified** (status
> remains `proposed`; A8 promotes). The
> `@skb/heavy-block-boundary/CONTRACT.md` is **NOT modified** (already
> consolidated at A4 with the canonical 8-bullet invariant list; A5
> just consumes the contract).

## title

Implement ADR-0014 D5 (per-block `heavyBoundaryDimensions` ownership)
+ D8 (apps/site `components.ts` migration from
`makeHeavyBlockPlaceholder` to real `HeavyBlockBoundary` invocations
sourcing dims from each heavy block ui-default) for the 3 existing
heavy blocks (jupyter / nn-viz / agent-flow): each heavy block package
adds `export const heavyBoundaryDimensions: HeavyBlockDimensions =
{ width: <D5-table>, height: 400 };` at the end of
`src/ui-default/<kind>.ui.ts` after the existing `defineUI(...)` block
(jupyter `{ width: 600, height: 400 }`, nn-viz `{ width: 500, height:
400 }`, agent-flow `{ width: 600, height: 400 }` per ADR-0014 D5 lines
235-240); each `src/ui-default/index.ts` barrel adds `export {
heavyBoundaryDimensions } from './<kind>.ui';` alongside the existing
`<kind>UiDefault` re-export; each `package.json` adds `"@skb/heavy-block-boundary":
"workspace:*"` to its `dependencies` block (alphabetical ordering: in
block-jupyter the new entry slots between `@skb/design-tokens` and
`@skb/kernel-adapter`; in block-nn-viz between `@skb/design-tokens` and
`@tensorflow/tfjs`; in block-agent-flow between `@skb/design-tokens`
and `reactflow`); each `tsconfig.json` adds `{ "path":
"../heavy-block-boundary" }` to its `references` array (currently
contains `block-foundation` + `design-tokens` baseline; A5 appends as
the 3rd or 5th entry depending on package); each
`packages/block-{jupyter,nn-viz,agent-flow}/CONTRACT.md` `## Public
surface` section gains a single bullet documenting the new export with
cross-link to ADR-0014 D5 (literal text per `## acceptance` bullet 9
below — single-source authoritative; CONTRACT.md prose copies that
bullet's literal block per heavy block). Rewire
`apps/site/src/components.ts` per ADR-0014 D8 verbatim. **REMOVE**:
(a) lines 18-23 (the `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export
including the 5-line comment block above; A1 acceptance bullet 8
explicitly forecasts this removal at A5 once HeavyBlockBoundary is
invoked at runtime in the componentsMap factories); (b) lines 50-62
(the `makeHeavyBlockPlaceholder` factory function including its 8-line
comment block above; replaced by HeavyBlockBoundary factories); (c)
lines 13-15 (the 3 type-only zero-symbol placeholder imports `import
type {} from '@skb/block-{jupyter,nn-viz,agent-flow}/ui-default';`
including the 3-line comment block above; replaced by value imports
covering both runtime + type surface). **ADD**: (a) value imports for
the 3 RenderViews + the 3 dims aliases:
```typescript
import {
  JupyterRenderView,
  heavyBoundaryDimensions as jupyterDims,
} from '@skb/block-jupyter/ui-default';
import {
  NnVizRenderView,
  heavyBoundaryDimensions as nnVizDims,
} from '@skb/block-nn-viz/ui-default';
import {
  AgentFlowRenderView,
  heavyBoundaryDimensions as agentFlowDims,
} from '@skb/block-agent-flow/ui-default';
```
placed in the existing import block alphabetically (post the 5 light
block RenderView imports at lines 2-6, before the
`@skb/heavy-block-boundary` import at line 7); (b) 3 factory functions
for the heavy blocks defined AFTER `makeMdxAdapter` (line 40 of
current state; A5 placement: after the `asMdxComponent` helper at
line 64 which currently sits BELOW `makeHeavyBlockPlaceholder` —
after A5's removal of `makeHeavyBlockPlaceholder` at lines 50-62,
`asMdxComponent` will be at line ~52; A5 places the 3 factories
between `asMdxComponent` and the `componentsMap` const declaration):

```typescript
const Jupyter = (props: FlatProps): ReactNode =>
  createElement(HeavyBlockBoundary, {
    kind: 'jupyter',
    dims: jupyterDims,
    load: () =>
      import('@skb/block-jupyter/ui-default').then((m) => ({
        default: makeMdxAdapter(m.JupyterRenderView as never),
      })),
    childProps: props,
  });

const NnViz = (props: FlatProps): ReactNode =>
  createElement(HeavyBlockBoundary, {
    kind: 'nn-viz',
    dims: nnVizDims,
    load: () =>
      import('@skb/block-nn-viz/ui-default').then((m) => ({
        default: makeMdxAdapter(m.NnVizRenderView as never),
      })),
    childProps: props,
  });

const AgentFlow = (props: FlatProps): ReactNode =>
  createElement(HeavyBlockBoundary, {
    kind: 'agent-flow',
    dims: agentFlowDims,
    load: () =>
      import('@skb/block-agent-flow/ui-default').then((m) => ({
        default: makeMdxAdapter(m.AgentFlowRenderView as never),
      })),
    childProps: props,
  });
```

The factory functions use `createElement(HeavyBlockBoundary, { ... })`
form per the file's existing convention (line 1 imports `createElement`;
file extension is `.ts` not `.tsx` so JSX is unavailable — verified at
PLAN-time). The `load()` adapter inside each factory wraps
`m.<Kind>RenderView` through the existing `makeMdxAdapter` helper
(line 33-40 of current state, preserved byte-unchanged; the helper
converts `FlatProps` → `BlockViewProps<TSchema>` shape so the
RenderView receives the `{ props, content }` discriminated shape it
expects per `BlockViewProps<TSchema>` defined in
`packages/block-foundation/src/registry.ts:19`). The
`makeMdxAdapter(m.<Kind>RenderView as never)` form mirrors how the 5
light blocks adapt `CalloutRenderView` / `CodeRenderView` / etc. at
componentsMap declaration; A5 just defers the adaptation inside the
async `load()` callback so the heavy block ui-default chunk is not
eagerly imported (preserves Phase 1 chunking per ADR-0014 D8 line
343-345). The `as never` cast bridges the actual `BlockViewProps<TSchema>`
generic on each RenderView to the `ComponentType<{ readonly props:
Record<string, unknown>; readonly content?: string }>` shape
`makeMdxAdapter` expects (TSchema-erased; the runtime value passes
through unchanged — same cast pattern the light blocks use at lines
69-73). The boundary's `childProps` prop receives `props: FlatProps`
unchanged (boundary forwards verbatim to the loaded adapter; the
adapter handles the FlatProps → BlockViewProps conversion at
invocation time). **REPLACE** the componentsMap entries (lines ~75-77
of current state) for the 3 heavy blocks:

```typescript
export const componentsMap = {
  // 5 light blocks: server-rendered via prop-shape adapter
  Callout: asMdxComponent(makeMdxAdapter(CalloutRenderView as never)),
  Code: asMdxComponent(makeMdxAdapter(CodeRenderView as never)),
  Image: asMdxComponent(makeMdxAdapter(ImageRenderView as never)),
  Math: asMdxComponent(makeMdxAdapter(MathRenderView as never)),
  Pdf: asMdxComponent(makeMdxAdapter(PdfRenderView as never)),
  // 3 heavy blocks: HeavyBlockBoundary wraps lazy-loaded RenderView per ADR-0014 D8
  Jupyter: asMdxComponent(Jupyter),
  NnViz: asMdxComponent(NnViz),
  AgentFlow: asMdxComponent(AgentFlow),
} satisfies Readonly<Record<string, ComponentType<unknown>>>;
```

The 5 light block entries stay byte-unchanged. The 3 heavy block
entries change from
`asMdxComponent(makeHeavyBlockPlaceholder('<kind>'))` to
`asMdxComponent(<Kind>)` referencing the new factory functions
(`asMdxComponent` already accepts `ComponentType<FlatProps>` per its
existing definition at line 64-65 of current state; the 3 factory
functions return `ReactNode` from `createElement(...)` which satisfies
`ComponentType<FlatProps>` since each factory takes `(props: FlatProps)
=> ReactNode`). The trailing comment "// 3 heavy blocks: SSR
placeholder; live rendering deferred to Wave 4" (line 74 of current
state) is REPLACED with "// 3 heavy blocks: HeavyBlockBoundary wraps
lazy-loaded RenderView per ADR-0014 D8" to reflect the new behavior.
Add the new contract test
`apps/site/src/__tests__/dims-source.test.ts` (~80 LOC; structure
parallels `apps/site/src/__tests__/components-map.test.ts`) covering
AC#15 via two assertions: (1) static source-read of
`apps/site/src/components.ts` via `node:fs` `readFileSync` resolved
through `fileURLToPath(new URL('../components.ts', import.meta.url))`
asserts the source contains `heavyBoundaryDimensions as jupyterDims`
+ `heavyBoundaryDimensions as nnVizDims` + `heavyBoundaryDimensions as
agentFlowDims` substring imports (proves the dims are imported with
the documented aliases; if executor renames an alias the test catches
it); (2) regex assertion on the same source asserts NO inline numeric
literal matching the 3 ADR-0014 D5 default values appears in the
factory bodies — concretely, a regex `/dims:\s*\{\s*width:\s*\d+/`
must NOT match (the only valid dims source is the imported alias
referenced as `dims: jupyterDims` etc.). Also bundles A4 row backfill
+ A5 row + Stage A pointer flip into `docs/plans/active.md` per the
one-row-per-PR cadence resumed at A4 close. Standard ADR-0011 D1
pipeline. AC coverage in A5: **#15** newly satisfied; **#1 / #3 /
#6 / #7 / #8 / #9 / #10 / #11 / #4 / #12 / #13 / #14** A2+A3+A4
regression baseline preserved (TC1 + TC4). **Out of scope for A5**
(per locked Wave 4 plan): playwright T0/T1 zero-layout-shift
validation (AC#5) → A6; `*.astro` SSR variants 5× consolidation
(Wave 3 C4a/C4b carry-over) → A7; selective per-block chunking + perf
baseline (C5 carry-over) + ADR-0014 promotion `proposed → accepted` →
A8.

## files

Modified + new (canonical count in the line below; collateral
graduations expected: `pnpm-lock.yaml` graduates because A5 adds the
`@skb/heavy-block-boundary` workspace dep to 3 heavy block
`package.json` files — workspace-internal but the lockfile's
`importers/packages/block-{jupyter,nn-viz,agent-flow}` entries each
get a new line for the dep. This PR.md remains self-listed per
ADR-0006 D8 strict whitelist + Pre-A1+A2+A3+A1+A2+A3+A4 precedent
that pr-writer must include the PR.md in the canonical file list at
PLAN time):

- `packages/block-jupyter/src/ui-default/jupyter.ui.ts` —
  **MODIFIED**. Add `import type { HeavyBlockDimensions } from
  '@skb/heavy-block-boundary';` at the top of the import block (after
  the existing `defineUI` import at line 1) AND add at the end of the
  file (after the `defineUI(...)` block ending at line 22):
  ```typescript
  /**
   * ADR-0014 D5 per-block dimensions ownership. Consumed by apps/site
   * componentsMap to size the SSR skeleton matching the hydrated
   * component (zero layout shift). Width/height are CSS px (min-width
   * / min-height).
   */
  export const heavyBoundaryDimensions: HeavyBlockDimensions = {
    width: 600,
    height: 400,
  };
  ```
  Width/height values per ADR-0014 D5 table line 237 (jupyter: code
  editor + output panel + Run button row). The file stays under 50
  LOC post-edit (currently ~22 LOC; +12 LOC for the new export +
  comment block). A5 does NOT modify the existing `defineUI(...)`
  block (Jupyter EditorView/RenderView wiring stays byte-unchanged).
- `packages/block-jupyter/src/ui-default/index.ts` — **MODIFIED**.
  Add `export { heavyBoundaryDimensions } from './jupyter.ui';` to
  the existing re-export list. Recommended placement: append as the
  LAST line of the file (after the existing `JUPYTER_TOKENS` /
  `JupyterTokens` exports at lines 16-17) so the new const sits
  alongside other ui-default surface; ALTERNATIVE placement immediately
  after `export { jupyterUiDefault } from './jupyter.ui';` at line 1
  is also acceptable (the new const is sourced from the SAME file so
  grouping is natural). Either location works for AC#15; the test
  greps for the import in the consumer (apps/site), not the export
  ordering in the barrel. Stays under 25 LOC post-edit (currently
  ~17 LOC; +1-2 LOC for the new re-export).
- `packages/block-jupyter/CONTRACT.md` — **MODIFIED** (D2 Row 1
  trigger #1 of 3). Append a single bullet to the `./ui-default`
  sub-list under `## Public surface` (the existing list at lines 19-25
  of current state). New bullet text (literal; the same prose is
  reproduced in `## acceptance` bullet 9 below for single-source):
  ```markdown
    - `heavyBoundaryDimensions: HeavyBlockDimensions` (per [ADR-0014 D5](../../docs/decisions/ADR-0014-heavy-block-boundary.md)) — initial values: width 600, height 400 (CSS px). Consumed by `apps/site` componentsMap via `HeavyBlockBoundary` to size the SSR skeleton; zero layout shift on hydration.
  ```
  Insert this bullet AFTER the existing `JUPYTER_TOKENS: JupyterTokens`
  bullet at line 25. Indentation matches the existing 2-space sub-list
  indent (the `./ui-default` sub-bullets are indented 2 spaces under
  the parent `./ui-default` entry). DO NOT modify any other section
  of CONTRACT.md (Invariants / Test corpus invariants / Wave 3 work /
  Forward-compat consumers / Modifying this file / Related stay
  byte-unchanged). Stays under 200 LOC target (currently ~197 LOC; +1
  LOC for the new bullet). Reviewer hunt: the cross-link path
  `../../docs/decisions/ADR-0014-heavy-block-boundary.md` resolves
  correctly from `packages/block-jupyter/CONTRACT.md` (verified at
  PLAN-time: 2 levels up from `packages/block-jupyter/` lands at repo
  root, then `docs/decisions/...` resolves; lychee-friendly).
- `packages/block-jupyter/package.json` — **MODIFIED**. Add
  `"@skb/heavy-block-boundary": "workspace:*"` to the existing
  `dependencies` block (currently lists 5 entries at lines 19-25:
  `@skb/block-foundation`, `@skb/design-tokens`, `@skb/kernel-adapter`,
  `@skb/kernel-pyodide`, `zod`). Place the new entry alphabetically:
  between `@skb/design-tokens` (line 21) and `@skb/kernel-adapter`
  (line 22). The result is 6 entries total. DO NOT touch
  `peerDependencies` (line 26-28: `react: "^18.3.0 || ^19.0.0"`) or
  `devDependencies` (lines 29-37: 7-dep set including
  `@testing-library/react`, `happy-dom`, `react`, `vitest`, etc.).
  DO NOT add `@skb/heavy-block-boundary` to `peerDependencies` — the
  type-only import in `<kind>.ui.ts` is a TypeScript build-time dep
  + the apps/site runtime consumer chain proves "declared AND used"
  for ADR-0008 D1 dead-dep policy (consistent with `@skb/design-tokens`
  precedent: also `dependencies` even though the consumption is via
  CSS variable cascade, NOT JS API). Stays under 50 LOC.
- `packages/block-jupyter/tsconfig.json` — **MODIFIED**. Add `{
  "path": "../heavy-block-boundary" }` to the `references` array
  (currently 4 entries at lines 9-14: `block-foundation`,
  `design-tokens`, `kernel-adapter`, `kernel-pyodide`). Append as the
  LAST entry (5th total) — workspace convention is to keep
  `block-foundation` first; the order of subsequent entries is
  loose-alphabetical-by-path with `heavy-block-boundary` slotting at
  the end (or alphabetically between `design-tokens` and
  `kernel-adapter` — both placements work for `tsc -b` composite
  project graph; reviewer accepts either). Required for `tsc -b` dep
  ordering even though the package's only consumption of
  `@skb/heavy-block-boundary` is a type-only import (TypeScript still
  walks the project graph via `references` and `tsc -b` warns/fails
  if a `dependencies` entry has no matching `references` entry per
  workspace convention). Stays under 20 LOC.
- `packages/block-nn-viz/src/ui-default/nn-viz.ui.ts` — **MODIFIED**.
  Same pattern as `jupyter.ui.ts`. Add `import type { HeavyBlockDimensions
  } from '@skb/heavy-block-boundary';` at the top of the import block
  AND add at the end of the file:
  ```typescript
  /**
   * ADR-0014 D5 per-block dimensions ownership. Consumed by apps/site
   * componentsMap to size the SSR skeleton matching the hydrated
   * component (zero layout shift). Width/height are CSS px (min-width
   * / min-height).
   */
  export const heavyBoundaryDimensions: HeavyBlockDimensions = {
    width: 500,
    height: 400,
  };
  ```
  Width/height values per ADR-0014 D5 table line 238 (nn-viz: TF.js
  network diagram canvas — narrower than jupyter/agent-flow because
  the SVG topology canvas is the only horizontal element). Stays
  under 50 LOC.
- `packages/block-nn-viz/src/ui-default/index.ts` — **MODIFIED**.
  Add `export { heavyBoundaryDimensions } from './nn-viz.ui';` to the
  existing re-export list. Recommended placement: append as the LAST
  line OR group with `nnVizUiDefault` at the top per the same logic
  as jupyter/index.ts. Stays under 40 LOC (currently ~35 LOC; +1-2
  LOC).
- `packages/block-nn-viz/CONTRACT.md` — **MODIFIED** (D2 Row 1
  trigger #2 of 3). Append a single bullet to the `./ui-default`
  sub-list under `## Public surface`. New bullet text (literal; same
  pattern as block-jupyter, only the `width 500` / `width 600` numeric
  + the kind-specific phrasing differs):
  ```markdown
    - `heavyBoundaryDimensions: HeavyBlockDimensions` (per [ADR-0014 D5](../../docs/decisions/ADR-0014-heavy-block-boundary.md)) — initial values: width 500, height 400 (CSS px). Consumed by `apps/site` componentsMap via `HeavyBlockBoundary` to size the SSR skeleton; zero layout shift on hydration.
  ```
  Insert this bullet AFTER the existing `NN_VIZ_TOKENS: NnVizTokens`
  bullet at line 33. Stays under 205 LOC (currently ~202 LOC; +1
  LOC).
- `packages/block-nn-viz/package.json` — **MODIFIED**. Add
  `"@skb/heavy-block-boundary": "workspace:*"` to the existing
  `dependencies` block (currently 4 entries at lines 19-23:
  `@skb/block-foundation`, `@skb/design-tokens`, `@tensorflow/tfjs`,
  `zod`). Place the new entry alphabetically: between
  `@skb/design-tokens` (line 21) and `@tensorflow/tfjs` (line 22).
  Result: 5 entries. Stays under 50 LOC.
- `packages/block-nn-viz/tsconfig.json` — **MODIFIED**. Add `{
  "path": "../heavy-block-boundary" }` to the `references` array
  (currently 2 entries at lines 9-12: `block-foundation`,
  `design-tokens`). Append as the LAST entry (3rd total) OR
  alphabetically between `design-tokens` and the close bracket; both
  work. Stays under 20 LOC.
- `packages/block-agent-flow/src/ui-default/agent-flow.ui.ts` —
  **MODIFIED**. Same pattern. Add `import type { HeavyBlockDimensions
  } from '@skb/heavy-block-boundary';` at the top of the import block
  AND add at the end of the file:
  ```typescript
  /**
   * ADR-0014 D5 per-block dimensions ownership. Consumed by apps/site
   * componentsMap to size the SSR skeleton matching the hydrated
   * component (zero layout shift). Width/height are CSS px (min-width
   * / min-height).
   */
  export const heavyBoundaryDimensions: HeavyBlockDimensions = {
    width: 600,
    height: 400,
  };
  ```
  Width/height values per ADR-0014 D5 table line 239 (agent-flow:
  React Flow graph layout — same width as jupyter; both need the
  horizontal real estate for graph + canvas controls). Stays under
  50 LOC.
- `packages/block-agent-flow/src/ui-default/index.ts` — **MODIFIED**.
  Add `export { heavyBoundaryDimensions } from './agent-flow.ui';`
  to the existing re-export list. Stays under 25 LOC (currently ~17
  LOC; +1-2 LOC).
- `packages/block-agent-flow/CONTRACT.md` — **MODIFIED** (D2 Row 1
  trigger #3 of 3). Append a single bullet to the `./ui-default`
  sub-list under `## Public surface`. New bullet text (literal; same
  pattern as block-jupyter / block-nn-viz, only the `width 600`
  numeric matches jupyter):
  ```markdown
    - `heavyBoundaryDimensions: HeavyBlockDimensions` (per [ADR-0014 D5](../../docs/decisions/ADR-0014-heavy-block-boundary.md)) — initial values: width 600, height 400 (CSS px). Consumed by `apps/site` componentsMap via `HeavyBlockBoundary` to size the SSR skeleton; zero layout shift on hydration.
  ```
  Insert this bullet AFTER the existing `AGENT_FLOW_TOKENS:
  AgentFlowTokens` bullet at line 30. Stays under 190 LOC (currently
  ~184 LOC; +1 LOC).
- `packages/block-agent-flow/package.json` — **MODIFIED**. Add
  `"@skb/heavy-block-boundary": "workspace:*"` to the existing
  `dependencies` block (currently 4 entries at lines 19-23:
  `@skb/block-foundation`, `@skb/design-tokens`, `reactflow`, `zod`).
  Place the new entry alphabetically: between `@skb/design-tokens`
  (line 21) and `reactflow` (line 22). Result: 5 entries. Stays under
  50 LOC.
- `packages/block-agent-flow/tsconfig.json` — **MODIFIED**. Add `{
  "path": "../heavy-block-boundary" }` to the `references` array
  (currently 2 entries at lines 9-12: `block-foundation`,
  `design-tokens`). Append as the LAST entry (3rd total). Stays
  under 20 LOC.
- `apps/site/src/components.ts` — **MODIFIED** (major rewire). Per
  ADR-0014 D8 verbatim. Five coordinated edits: (a) **REMOVE** lines
  10-15 (the 6-line type-only zero-symbol placeholder import block —
  3 `import type {} from '@skb/block-{kind}/ui-default';` statements
  preceded by a 3-line comment "Type-only imports preserve ADR-0008
  D1 three-way symmetry...") + REPLACE with new value imports for
  the 3 RenderViews + the 3 dims aliases. The new import block
  pattern (place after the existing `@skb/block-pdf` import at line
  6; before the `@skb/heavy-block-boundary` import at line 7):
  ```typescript
  import {
    JupyterRenderView,
    heavyBoundaryDimensions as jupyterDims,
  } from '@skb/block-jupyter/ui-default';
  import {
    NnVizRenderView,
    heavyBoundaryDimensions as nnVizDims,
  } from '@skb/block-nn-viz/ui-default';
  import {
    AgentFlowRenderView,
    heavyBoundaryDimensions as agentFlowDims,
  } from '@skb/block-agent-flow/ui-default';
  ```
  The 3 import statements use the documented dims aliases
  `jupyterDims` / `nnVizDims` / `agentFlowDims` per ADR-0014 D5 line
  216-217 + D8 line 329-330 (the literal alias names appear in both
  the ADR example AND the `## acceptance` bullet 7 below — they are
  consumer-facing and NOT renamable without a coordinated PR). The
  imports are multi-line per the named-import-with-rename convention
  (the alias is more readable on a separate line). (b) **REMOVE**
  lines 17-23 (the 7-line `__A1_HEAVY_BLOCK_BOUNDARY_REF`
  evidence-export including the 5-line comment block above it
  starting "// A1 ADR-0008 D1 dead-dep evidence..."; A1 acceptance
  bullet 8 explicitly forecasts this removal at A5 once
  HeavyBlockBoundary is invoked at runtime in the componentsMap
  factories — the runtime use of `createElement(HeavyBlockBoundary,
  ...)` in the new factories is the authoritative dep evidence,
  superseding the static module-level export). (c) **REMOVE** lines
  42-62 (the `makeHeavyBlockPlaceholder` function definition + its
  8-line comment block above starting "// 3 heavy blocks (Jupyter /
  NnViz / AgentFlow) cannot SSR..."; replaced by HeavyBlockBoundary
  factories). (d) **ADD** 3 factory functions for the heavy blocks
  defined AFTER the `asMdxComponent` helper (which after deletion of
  `makeHeavyBlockPlaceholder` will be at line ~52) and BEFORE the
  `componentsMap` const declaration:
  ```typescript
  // 3 heavy blocks: HeavyBlockBoundary wraps lazy-loaded RenderView
  // per ADR-0014 D8. Each factory passes per-block dims sourced from
  // the heavy block ui-default (AC#15) + a load() adapter that wraps
  // the RenderView through makeMdxAdapter so it receives BlockViewProps
  // not FlatProps at invocation.
  const Jupyter = (props: FlatProps): ReactNode =>
    createElement(HeavyBlockBoundary, {
      kind: 'jupyter',
      dims: jupyterDims,
      load: () =>
        import('@skb/block-jupyter/ui-default').then((m) => ({
          default: makeMdxAdapter(m.JupyterRenderView as never),
        })),
      childProps: props,
    });

  const NnViz = (props: FlatProps): ReactNode =>
    createElement(HeavyBlockBoundary, {
      kind: 'nn-viz',
      dims: nnVizDims,
      load: () =>
        import('@skb/block-nn-viz/ui-default').then((m) => ({
          default: makeMdxAdapter(m.NnVizRenderView as never),
        })),
      childProps: props,
    });

  const AgentFlow = (props: FlatProps): ReactNode =>
    createElement(HeavyBlockBoundary, {
      kind: 'agent-flow',
      dims: agentFlowDims,
      load: () =>
        import('@skb/block-agent-flow/ui-default').then((m) => ({
          default: makeMdxAdapter(m.AgentFlowRenderView as never),
        })),
      childProps: props,
    });
  ```
  Each factory: takes `(props: FlatProps): ReactNode`; calls
  `createElement(HeavyBlockBoundary, { kind, dims, load, childProps })`
  with `kind` = the literal kebab-case kind string (`'jupyter'` /
  `'nn-viz'` / `'agent-flow'` matching `HeavyBlockKindRegistry` keys);
  `dims` = the imported alias (`jupyterDims` / `nnVizDims` /
  `agentFlowDims`) — NEVER an inline numeric literal (AC#15 hard
  invariant); `load` = an arrow returning a dynamic `import(...)` that
  resolves to `{ default: makeMdxAdapter(m.<Kind>RenderView as never)
  }` — the `makeMdxAdapter` wrap converts FlatProps → BlockViewProps
  inside the loaded chunk so the boundary's `Component {...childProps}`
  invocation at line 104 of `HeavyBlockBoundary.tsx` correctly passes
  the prop shape the RenderView expects; `childProps` = `props` (the
  FlatProps object received by the factory). The `as never` cast on
  `m.<Kind>RenderView` mirrors the light-block cast pattern at lines
  69-73 of current state (5 light blocks: `makeMdxAdapter(CalloutRenderView
  as never)` etc. — same TSchema-erasure dance; the runtime value
  passes through unchanged). The dynamic `import(...)` form preserves
  Phase 1 chunking (Vite respects the dynamic-import boundary; the
  heavy block ui-default chunk is NOT eagerly imported at apps/site
  startup; it loads on-demand per block instance per ADR-0014 D8 line
  343-345 + the consequences block at line 426). (e) **REPLACE** the
  componentsMap entries (lines 67-78 of current state) for the 3
  heavy blocks. The 5 light block entries stay byte-unchanged. The 3
  heavy block entries change from `Jupyter:
  asMdxComponent(makeHeavyBlockPlaceholder('jupyter'))` →
  `Jupyter: asMdxComponent(Jupyter)` (same for `NnViz` /
  `AgentFlow`); the trailing comment "// 3 heavy blocks: SSR
  placeholder; live rendering deferred to Wave 4" (line 74) is
  REPLACED with "// 3 heavy blocks: HeavyBlockBoundary wraps
  lazy-loaded RenderView per ADR-0014 D8". The `satisfies
  Readonly<Record<string, ComponentType<unknown>>>;` clause at line
  78 stays byte-unchanged (the new factory functions return
  `ReactNode` from `createElement(...)` which satisfies
  `ComponentType<FlatProps>` once `asMdxComponent` widens to
  `ComponentType<unknown>`). The file stays well under 200 LOC
  target post-edit (currently ~78 LOC; A5 net change is ~+15 LOC:
  -19 LOC removed [evidence-export 7 + makeHeavyBlockPlaceholder 21
  - the 9 lines of placeholder-related componentsMap comment text] +
  ~+34 LOC added [3-line type-import block replaced by ~12 lines of
  value imports + ~30 lines of factory functions + some comment
  prose] = +~15 LOC net). Estimated post-edit ~93 LOC. Reviewer
  hunt: post-edit, the `__A1_HEAVY_BLOCK_BOUNDARY_REF` symbol must
  not appear anywhere; `makeHeavyBlockPlaceholder` must not appear
  anywhere; `import type {}` zero-symbol pattern must not appear for
  the 3 heavy block ui-default imports; the 3 dims aliases must
  appear in `dims:` positions inside the factory bodies (NOT inline
  numeric literals).
- `apps/site/src/__tests__/dims-source.test.ts` — **NEW**. Contract
  test for AC#15 (dimensions sourced from heavy block packages, NOT
  inline literals). ~80 LOC; structure parallels
  `apps/site/src/__tests__/components-map.test.ts` (4 `it()` blocks;
  vitest `describe` outer; `node:fs` + `node:url` imports for
  source-read). Test contents:
  ```typescript
  import { describe, expect, it } from 'vitest';
  import { readFileSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';

  // Read the components.ts source statically so we can assert on the
  // import + factory body shapes per ADR-0014 D5 + AC#15 (dims sourced
  // from heavy block ui-default; NOT inline literals).
  const componentsPath = fileURLToPath(new URL('../components.ts', import.meta.url));
  const componentsSource = readFileSync(componentsPath, 'utf8');

  describe('apps/site components.ts heavyBoundaryDimensions sourcing (AC#15)', () => {
    it('imports heavyBoundaryDimensions as jupyterDims from @skb/block-jupyter/ui-default', () => {
      expect(componentsSource).toMatch(
        /heavyBoundaryDimensions as jupyterDims[\s\S]*?from\s+'@skb\/block-jupyter\/ui-default'/,
      );
    });

    it('imports heavyBoundaryDimensions as nnVizDims from @skb/block-nn-viz/ui-default', () => {
      expect(componentsSource).toMatch(
        /heavyBoundaryDimensions as nnVizDims[\s\S]*?from\s+'@skb\/block-nn-viz\/ui-default'/,
      );
    });

    it('imports heavyBoundaryDimensions as agentFlowDims from @skb/block-agent-flow/ui-default', () => {
      expect(componentsSource).toMatch(
        /heavyBoundaryDimensions as agentFlowDims[\s\S]*?from\s+'@skb\/block-agent-flow\/ui-default'/,
      );
    });

    it('does NOT inline numeric width literals in HeavyBlockBoundary factory dims props', () => {
      // AC#15: dims values must come from imported aliases, never
      // inline numerics. The regex catches `dims: { width: 600` etc.
      // anywhere in the file body.
      expect(componentsSource).not.toMatch(/dims:\s*\{\s*width:\s*\d+/);
    });
  });
  ```
  The 4 tests cover: 3 import-shape assertions (one per dims alias)
  + 1 anti-inline-literal assertion (regex `/dims:\s*\{\s*width:\s*\d+/`
  must NOT match — the only valid dims source is the imported alias
  referenced as `dims: jupyterDims` etc.). Test file location follows
  the `apps/site/src/__tests__/` convention (sister to
  `components-map.test.ts` / `lazy-chunking.test.ts` / etc.). The
  test file does NOT need any new dep — `node:fs` and `node:url` are
  Node built-ins; the `vitest` import is already in scope via
  `apps/site/package.json` `devDependencies`. Stays well under 100
  LOC (estimated ~50 LOC).
- `docs/plans/active.md` — **MODIFIED**. A4 row backfill + A5 row
  add + Stage A pointer flip + top-line phase summary append. Specific
  edits (mechanical bookkeeping; executor authors the diff per the
  explicit guidance below):
  - **Top-line line 6**: change `Pre-A1 + Pre-A2 + Pre-A3 + A1 +
    A2 + A3 + A4 done. **Stage A5 (apps/site dims migration via
    \`heavyBoundaryDimensions\`; AC#15) is the next implementation
    PR.**` → `Pre-A1 + Pre-A2 + Pre-A3 + A1 + A2 + A3 + A4 + A5
    done. **Stage A6 (playwright zero-layout-shift T0/T1; AC#5) is
    the next implementation PR.**`
  - **Wave 4 PR roster table line 18 (currently `| #TBD (this) |
    TBD | A4 | HeavyBlockBoundary CSS + a11y polish + prefers-reduced-motion
    + CONTRACT.md consolidation (AC#4/#12/#13/#14) |`)**: replace
    with `| #34 | 5f360a6 | A4 | HeavyBlockBoundary CSS + a11y polish
    + prefers-reduced-motion + CONTRACT.md consolidation (AC#4/#12/#13/#14)
    |` (the `#34` PR number + `5f360a6` squash HEAD per `git log`
    confirmation at PLAN time; if A4 has not actually merged at A5
    EXECUTE kickoff, executor stages this row with the A4
    ACCEPT-reported SHA; if the SHA is not yet known, executor stages
    with the `<TBD>` placeholder pattern + orchestrator patches at
    COMMIT time per the Pre-A3 row TBD-fill pattern).
  - **NEW row inserted between line 18 and current line 19 (the
    Stage A remaining row)**: `| #TBD (this) | TBD | A5 | apps/site
    dims migration via heavyBoundaryDimensions per ADR-0014 D5+D8
    (AC#15) |`.
  - **Stage A remaining row line 19 (currently `| Stage A
    remaining | A5-A8 (4 PRs) | A | dims+migration (A5) + playwright
    (A6) + .astro consolidated (A7) + perf+chunking+ADR-0014 promote
    (A8) |`)**: replace with `| Stage A remaining | A6-A8 (3 PRs) |
    A | playwright (A6) + .astro consolidated (A7) + perf+chunking+ADR-0014
    promote (A8) |`.
  - **起手指引 line 79 (next-PR pointer)**: change `**Stage A5
    (apps/site dims migration via \`heavyBoundaryDimensions\`; AC#15)
    is the next implementation PR.**` → `**Stage A6 (playwright
    zero-layout-shift T0/T1; AC#5) is the next implementation PR.**`
  - All other content of `docs/plans/active.md` stays byte-unchanged
    (no edits to the Wave 1+2+3 close summaries, the architecture
    ADR roster, the Wave 4 mandatory scope bullets, or the Pre-flight
    numbered list 1-5).
- `pnpm-lock.yaml` — **MODIFIED**. A5 adds the `@skb/heavy-block-boundary:
  workspace:*` workspace dep to 3 heavy block `package.json` files,
  which causes pnpm to add corresponding lines to the
  `importers/packages/block-{jupyter,nn-viz,agent-flow}` blocks of
  the lockfile (one per block; 3 entries total). The diff is BOUNDED
  to those 3 workspace dep entries (no other dep version drift
  expected; if executor sees broader churn, that's a sign of `pnpm
  install` re-resolution and must be investigated per memory
  `feedback_git_operator_explicit_stage` lockfile-blob rule). TC17
  verifies bounded diff. MUST be staged at commit per ADR-0006 D8
  (lockfile blob discipline; memory `feedback_git_operator_explicit_stage`).
- `docs/plans/wave-4-main/A5-apps-site-heavy-block-dims-migration.md`
  — this PR.md (self-listed per ADR-0006 D8 strict whitelist;
  Pre-A1+A2+A3 + A1+A2+A3+A4 R1 precedent + Wave 1+2+3 lessons
  carried).

= **18 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `packages/heavy-block-boundary/CONTRACT.md` — **UNCHANGED**.
  Already consolidated at A4 with the canonical 8-bullet invariant
  list (A4 acceptance bullet 9). A5 just consumes the contract; no
  re-edit needed. TC18a verifies empty diff.
- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` —
  **UNCHANGED**. D1 prop interface (lines 1-30) byte-identical to
  A2/A3/A4 (already verified at A4 TC19). Function body
  (`useEffect` + `useState` + `AbortController` + JSX render tree)
  byte-identical to A4. A5 just instantiates the boundary at
  apps/site consumer; no change to the package internals. TC18b
  verifies empty diff.
- `packages/heavy-block-boundary/src/heavy-block-skeleton.css` —
  **UNCHANGED**. A4's 80-LOC CSS asset stays as canonical source.
  A5 does not touch CSS.
- `packages/heavy-block-boundary/package.json` /
  `packages/heavy-block-boundary/tsconfig.json` — **UNCHANGED**. A4
  added `@skb/design-tokens` dep + `references` entry; A5 does not
  add anything else.
- `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test.tsx`
  / `skeleton.test.ts` / `HeavyBlockBoundary.test-d.ts` —
  **UNCHANGED**. The 12-test corpus from A2+A3+A4 covers the
  boundary's contract; A5 consumer-side testing is in
  `apps/site/src/__tests__/dims-source.test.ts` (new).
- `docs/decisions/ADR-0014-heavy-block-boundary.md` — **NOT
  modified**. Status remains `proposed`; promotion to `accepted` is
  A8 scope per locked Wave 4 plan Stage A close criterion #1. A5 is
  the consumer of the ADR (specifically D5 lines 199-245 for
  per-block dimensions ownership + D8 lines 315-345 for the apps/site
  migration pattern + AC#15 lines 415-418 for the contract test
  invariant), not the editor. TC11 verifies empty diff.
- `packages/block-jupyter/src/ui-default/Jupyter.tsx` /
  `packages/block-nn-viz/src/ui-default/NnViz.tsx` /
  `packages/block-agent-flow/src/ui-default/AgentFlow.tsx` —
  **UNCHANGED**. The RenderView implementations stay byte-identical;
  A5 only adds the new `heavyBoundaryDimensions` const to the
  separate `<kind>.ui.ts` metadata files (per ADR-0014 D5 line 205:
  the dims live in `ui-default/<kind>.ui.ts`, NOT in the
  `<Kind>.tsx` RenderView file).
- `packages/block-jupyter/CONTRACT.md` /
  `packages/block-nn-viz/CONTRACT.md` /
  `packages/block-agent-flow/CONTRACT.md` `## Invariants` /
  `## Test corpus invariants` / `## Wave 3 work` / `## Forward-compat
  consumers` / `## Modifying this file` / `## Related` sections —
  **UNCHANGED**. A5 only appends a single bullet to the `## Public
  surface` section per heavy block; no other section is modified.
  Reviewer verifies via diff scope that ONLY the Public surface
  bullets are added.
- `packages/block-jupyter/src/__tests__/*` /
  `packages/block-nn-viz/src/__tests__/*` /
  `packages/block-agent-flow/src/__tests__/*` — **UNCHANGED**. A5
  does not change the heavy block test corpora; the new const export
  is exercised at the consumer side (`apps/site/src/__tests__/dims-source.test.ts`).
  Reviewer hunt: each heavy block's vitest still PASS post-A5 (the
  new `heavyBoundaryDimensions` export is type-checked but not
  test-verified at the package boundary; AC#15 is a consumer-side
  contract).
- `apps/site/package.json` — **UNCHANGED**. A1's workspace dep on
  `@skb/heavy-block-boundary: workspace:*` (line 30) stays; the 3
  heavy block deps (lines 20-26) stay. A5's value imports of
  `<Kind>RenderView` + `heavyBoundaryDimensions` work via the
  existing 3 heavy block deps which already expose the
  `./ui-default` subpath.
- `apps/site/src/styles/global.css` — **UNCHANGED**. The
  `@skb/design-tokens/tokens.css` global injection at lines 1-2 stays
  intact; A5 does not touch the global stylesheet. The
  `@skb/heavy-block-boundary/heavy-block-skeleton.css` side-effect
  import added at A4 to `apps/site/src/components.ts` line 8 stays
  byte-unchanged (verifies pre-edit at PLAN-time grep — the import
  IS present at A4 commit `5f360a6`).
- `apps/site/src/__tests__/components-map.test.ts` — **UNCHANGED**.
  The 4 existing tests (function-shape, RenderView-vs-EditorView
  distinction, alias documentation, 8-canonical-PascalCase-name set)
  all continue to PASS unchanged after A5 — the componentsMap KEYS
  are unchanged (still 8 PascalCase names: `Jupyter` / `NnViz` /
  `AgentFlow` + 5 light blocks); the VALUES change from
  `asMdxComponent(makeHeavyBlockPlaceholder(...))` to
  `asMdxComponent(<Kind>)` but both are functions so the `typeof
  ... === 'function'` test (line 27) continues to PASS; the
  `componentsMap.<Kind> !== <Kind>EditorView` distinctness tests
  (lines 36-46) continue to PASS (the new factory functions are
  distinct from the EditorView identities); the 8-keys-set test
  (lines 49-60) continues to PASS unchanged. TC1 verifies regression
  baseline.
- `apps/site/src/__tests__/sample-blocks-page.test.ts` /
  `apps/site/src/__tests__/lazy-chunking.test.ts` /
  `apps/site/src/__tests__/fouc-script.test.ts` /
  `apps/site/src/__tests__/search-*.test.ts` /
  `apps/site/src/__tests__/visual-smoke.spec.ts` —
  **UNCHANGED**. None of the existing apps/site tests pin the
  HeavyBlockBoundary integration shape; the new factory-based
  componentsMap entries do not regress these tests (TC1).
- `agent-contract.md` / generated configs — no agent-contract.md
  change in A5; no `pnpm generate:configs` regen.
- `packages/block-{jupyter,nn-viz,agent-flow}/dist/**` /
  `apps/site/.astro/**` / `.turbo/**` — gitignored.
- `pnpm-workspace.yaml` — already lists `packages/*` glob; no edit.
- `tsconfig.json` (workspace root) — verified at A1 EXECUTE that
  root does not enumerate package references; no edit. (A5's
  `references` change is INSIDE each heavy block package's own
  `tsconfig.json`, not the workspace root.)
- Any `apps/site/**` `.astro` SSR variant — A7 scope; A5 does NOT
  touch.
- `astro.config.mjs` (apps/site) — **UNCHANGED**. No
  `manualChunks` change in A5 (the ADR-0014 D8 line 343-345 +
  consequences line 426 explicitly state Phase 1 + Phase 2 chunking
  via `apps/site/astro.config.mjs` `manualChunks` is unchanged;
  HeavyBlockBoundary uses dynamic `import()` which Vite respects
  out-of-the-box). Per-block chunking + perf baseline is A8 scope.

## test_cases

A5 ships per-block `heavyBoundaryDimensions` exports + apps/site
componentsMap rewire from placeholder to HeavyBlockBoundary + AC#15
contract test + 3 CONTRACT.md `Public surface` updates + 3
package.json + 3 tsconfig.json dep adds + active.md bookkeeping.
Tests are TDD-first per ADR-0011 D1 stage 2: write the new
contract-test assertions first → confirm they FAIL against the A4
state (which has no `heavyBoundaryDimensions` exports + no apps/site
factory functions + still has `__A1_HEAVY_BLOCK_BOUNDARY_REF` +
`makeHeavyBlockPlaceholder`) → implement the heavy block exports +
package.json/tsconfig deps + apps/site rewire + CONTRACT.md
consolidation + active.md bookkeeping → confirm TC1-TC6 + the
existing A2+A3+A4 tests + apps/site existing tests all PASS.

- **TC1** (AC#1 + #3 + #4 + #6 + #7 + #8 + #9 + #10 + #11 + #12 +
  #13 + #14 regression — all A2+A3+A4 boundary tests still PASS)
  Input: `pnpm --filter @skb/heavy-block-boundary test`. Expected:
  exit 0; the 12 A2+A3+A4 vitest tests
  (`HeavyBlockBoundary.test.tsx` Tests 1-12) AND `skeleton.test.ts`
  Test 1 ALL still PASS unchanged after A5 — proves A5 does NOT
  regress the boundary package (A5 does not touch the package
  internals). Particularly: AC#3 (SSR/hydration byte-equivalence)
  MUST still hold + AC#4 (CSS classes + size + style) MUST still
  hold + AC#10 (mount-guard) + AC#11 (AbortSignal) + AC#13 (plugin
  extensibility) — A5 does not touch the boundary's JSX tree, CSS,
  or lifecycle code. Location: shell at repo root.
- **TC2** (AC#15 — apps/site contract test PASS) Input: `pnpm
  --filter @skb/site test`. Expected: exit 0; the new
  `apps/site/src/__tests__/dims-source.test.ts` 4 tests all PASS
  (the 3 import-shape assertions catch the documented dims aliases
  + the anti-inline-literal regex catches the absence of `dims: {
  width: <N>` numeric literal pattern). Location: shell.
- **TC3** (AC#15 source-shape sanity — manual grep on
  `apps/site/src/components.ts`) Input (a): `grep -cE
  "heavyBoundaryDimensions as (jupyter|nnViz|agentFlow)Dims"
  apps/site/src/components.ts`. Expected: 3 (one per heavy block;
  the 3 named-import-with-rename lines). Input (b): `grep -cE
  "dims: \{ width: [0-9]+" apps/site/src/components.ts`. Expected:
  0 (no inline numeric dims literals in the factory bodies; AC#15
  hard invariant). Input (c): `grep -cE "dims: (jupyterDims|nnVizDims|agentFlowDims)"
  apps/site/src/components.ts`. Expected: 3 (one per factory body;
  proves dims ARE sourced from the imported aliases). Location:
  shell.
- **TC4** (apps/site existing 4 componentsMap tests still PASS —
  no regression on the 8-keys/function-shape/EditorView-distinct
  contract from C3) Input: `pnpm --filter @skb/site test
  -- components-map.test.ts`. Expected: exit 0; the 4 `it()` blocks
  inside the existing `components-map.test.ts` all PASS unchanged
  (the componentsMap KEYS stay at the 8-canonical-PascalCase set
  including `Jupyter` / `NnViz` / `AgentFlow`; the VALUES change
  from `asMdxComponent(makeHeavyBlockPlaceholder(...))` to
  `asMdxComponent(<Kind>)` but both are functions; the EditorView
  distinctness tests at lines 36-46 still PASS since the new factory
  functions are distinct from the `<Kind>EditorView` identities).
  Location: shell.
- **TC5** (3 heavy block packages export `heavyBoundaryDimensions`
  from `<kind>.ui.ts` + the barrel re-exports it) Input (a): `grep
  -cE "export const heavyBoundaryDimensions"
  packages/block-jupyter/src/ui-default/jupyter.ui.ts`. Expected: 1.
  Input (b): `grep -cE "export const heavyBoundaryDimensions"
  packages/block-nn-viz/src/ui-default/nn-viz.ui.ts`. Expected: 1.
  Input (c): `grep -cE "export const heavyBoundaryDimensions"
  packages/block-agent-flow/src/ui-default/agent-flow.ui.ts`.
  Expected: 1. Input (d): `grep -cE "export \{ heavyBoundaryDimensions
  \}" packages/block-jupyter/src/ui-default/index.ts`. Expected: 1.
  Input (e): `grep -cE "export \{ heavyBoundaryDimensions \}"
  packages/block-nn-viz/src/ui-default/index.ts`. Expected: 1.
  Input (f): `grep -cE "export \{ heavyBoundaryDimensions \}"
  packages/block-agent-flow/src/ui-default/index.ts`. Expected: 1.
  Location: shell.
- **TC6** (3 heavy block packages declare `@skb/heavy-block-boundary`
  in `dependencies` + tsconfig `references`) Input (a): `cat
  packages/block-jupyter/package.json | grep -c '"@skb/heavy-block-boundary":
  "workspace:\*"'`. Expected: 1. Input (b): `cat
  packages/block-nn-viz/package.json | grep -c '"@skb/heavy-block-boundary":
  "workspace:\*"'`. Expected: 1. Input (c): `cat
  packages/block-agent-flow/package.json | grep -c '"@skb/heavy-block-boundary":
  "workspace:\*"'`. Expected: 1. Input (d): `cat
  packages/block-jupyter/tsconfig.json | grep -c '"path":
  "../heavy-block-boundary"'`. Expected: 1. Input (e): `cat
  packages/block-nn-viz/tsconfig.json | grep -c '"path":
  "../heavy-block-boundary"'`. Expected: 1. Input (f): `cat
  packages/block-agent-flow/tsconfig.json | grep -c '"path":
  "../heavy-block-boundary"'`. Expected: 1. Location: shell.
- **TC7** (3 heavy block CONTRACT.md files document the new
  `heavyBoundaryDimensions` public export with cross-link to
  ADR-0014 D5) Input (a): `grep -c 'heavyBoundaryDimensions:
  HeavyBlockDimensions' packages/block-jupyter/CONTRACT.md`.
  Expected: ≥ 1 (the new bullet). Input (b): same for
  `packages/block-nn-viz/CONTRACT.md`. Expected: ≥ 1. Input (c):
  same for `packages/block-agent-flow/CONTRACT.md`. Expected: ≥ 1.
  Input (d): `grep -c 'ADR-0014.*D5'
  packages/block-jupyter/CONTRACT.md`. Expected: ≥ 1 (cross-link to
  ADR-0014 D5). Input (e): same for `packages/block-nn-viz/CONTRACT.md`.
  Expected: ≥ 1. Input (f): same for
  `packages/block-agent-flow/CONTRACT.md`. Expected: ≥ 1. Location:
  shell.
- **TC8** (apps/site `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export
  REMOVED + `makeHeavyBlockPlaceholder` REMOVED + 3 `import type {}`
  zero-symbol placeholder REMOVED) Input (a): `grep -c
  '__A1_HEAVY_BLOCK_BOUNDARY_REF' apps/site/src/components.ts`.
  Expected: 0 (A1 evidence-export removed per acceptance bullet 8
  forecast). Input (b): `grep -c 'makeHeavyBlockPlaceholder'
  apps/site/src/components.ts`. Expected: 0 (factory function
  removed; replaced by HeavyBlockBoundary factories). Input (c):
  `grep -cE "import type \{\}" apps/site/src/components.ts`.
  Expected: 0 (the 3 zero-symbol placeholder imports removed;
  replaced by value imports). Location: shell.
- **TC9** (`pnpm check` exit 0 globally — workspace-wide regression
  baseline) Input: `pnpm check`. Expected: exit 0 (lint + typecheck
  + test + build + size-check all pass across the workspace; A5's
  changes do not regress any other package). Location: shell.
- **TC10** (3 heavy block packages build clean post-edit) Input:
  `pnpm --filter @skb/block-jupyter --filter @skb/block-nn-viz
  --filter @skb/block-agent-flow build`. Expected: exit 0 (`tsc -b`
  produces dist/ outputs without diagnostics for all 3 packages; the
  new `references` entry on `@skb/heavy-block-boundary` is honored
  by tsc-b composite project graph; the new `heavyBoundaryDimensions`
  export type-checks against `HeavyBlockDimensions`). Location:
  shell.
- **TC11** (apps/site builds clean post-edit) Input: `pnpm
  --filter @skb/site build`. Expected: exit 0 (Astro build succeeds;
  the new factory functions + value imports type-check; the dynamic
  `import('@skb/block-{kind}/ui-default')` inside each `load()`
  arrow resolves at build time + Vite chunks the resolved module
  per Phase 1 chunking; the `componentsMap satisfies
  Readonly<Record<string, ComponentType<unknown>>>` clause type-checks
  against the new factory function values; no `astro check`
  diagnostics). Location: shell. If executor sees `astro check`
  diagnostics on the 3 RenderView value imports (e.g., due to TSchema
  variance with `BlockViewProps`), the `as never` cast in the
  `makeMdxAdapter(... as never)` form is the canonical TSchema-erasure
  per the light-block precedent at lines 69-73 of A4 state.
- **TC12** (Lint clean for the 3 heavy block packages + apps/site)
  Input: `pnpm --filter @skb/block-jupyter --filter @skb/block-nn-viz
  --filter @skb/block-agent-flow --filter @skb/site lint`. Expected:
  exit 0; ESLint flags no issues on the modified files (the new
  `heavyBoundaryDimensions` const + the rewired `apps/site/components.ts`
  + the new `dims-source.test.ts`); `max-lines` 300 warn threshold
  not hit (the largest modified file is `apps/site/components.ts`
  estimated ~93 LOC post-edit; the new `dims-source.test.ts`
  estimated ~50 LOC; the heavy block `<kind>.ui.ts` files each
  ~35 LOC post-edit). Memory `feedback_codex_spark_lint_gap`
  notes lint is independent of vitest PASS — TC12 is a hard gate.
- **TC13** (Typecheck clean — including the consumer-side cross-package
  type relationship) Input: `pnpm --filter @skb/block-jupyter
  --filter @skb/block-nn-viz --filter @skb/block-agent-flow --filter
  @skb/site typecheck`. Expected: exit 0; the type-only import of
  `HeavyBlockDimensions` in each `<kind>.ui.ts` resolves via the
  composite project `references`; the apps/site value imports of
  `heavyBoundaryDimensions as <kind>Dims` resolve to
  `HeavyBlockDimensions` type; the `dims:` prop on
  `HeavyBlockBoundary` (typed as `HeavyBlockDimensions` per
  `HeavyBlockBoundaryProps<P>`) accepts the imported aliases without
  cast. Location: shell.
- **TC14** (Size check clean — 500 LOC hard fail) Input: `pnpm
  size-check`. Expected: exit 0; no file in `packages/block-{jupyter,nn-viz,agent-flow}/src/`
  or `apps/site/src/` exceeds 500 LOC; the modified
  `apps/site/components.ts` est. ~93 LOC, the new
  `dims-source.test.ts` est. ~50 LOC, each `<kind>.ui.ts` est. ~35
  LOC, each barrel `index.ts` est. ~20 LOC, each CONTRACT.md est. ~200
  LOC, all well under the 500 LOC limit. Location: shell.
- **TC15** (`active.md` has A4 row backfilled with `5f360a6` SHA
  + new A5 row + A6 next-PR pointer + Stage A remaining decrement +
  top-line phase summary append) Input: `git diff main --
  docs/plans/active.md`. Expected: diff includes (a) the A4 row
  replacement from `| #TBD (this) | TBD | A4 | ...` to `| #34 |
  5f360a6 | A4 | ...`; (b) the NEW A5 row insertion `| #TBD (this)
  | TBD | A5 | apps/site dims migration via heavyBoundaryDimensions
  per ADR-0014 D5+D8 (AC#15) |`; (c) the Stage A remaining row
  replacement from `A5-A8 (4 PRs)` to `A6-A8 (3 PRs)`; (d) the 起手
  指引 line 79 next-PR pointer flip from "Stage A5 (apps/site dims
  migration via `heavyBoundaryDimensions`; AC#15)" to "Stage A6
  (playwright zero-layout-shift T0/T1; AC#5)"; (e) the top-line
  phase summary append "+ A5" + the same next-PR pointer flip on
  line 6. All other content of `docs/plans/active.md` byte-unchanged.
  Location: shell.
- **TC16** (`pnpm-lock.yaml` diff bounded to the 3
  `@skb/heavy-block-boundary` workspace dep entries; idempotent
  install) Input (a): `git diff main -- pnpm-lock.yaml | grep -cE
  '^[+-] .+@skb/heavy-block-boundary'`. Expected: ≥ 3 (one new
  workspace dep line per heavy block package; may be 6 if both `+`
  for the dep line AND `+` for a context line are flagged, but the
  count is bounded). Input (b): `git diff main -- pnpm-lock.yaml |
  grep -cE '^[+-]' | head -1`. Expected: ≤ 60 (a sanity ceiling;
  3 workspace dep adds × ~10-15 lines each typical lockfile diff =
  30-45 lines; allow 60 for breathing room). Input (c): `pnpm
  install` × 2. Expected: second run reports "Lockfile is up to
  date" and the `pnpm-lock.yaml` hash is unchanged across the two
  runs (idempotent). Location: shell.
- **TC17** (`packages/heavy-block-boundary/CONTRACT.md` +
  `HeavyBlockBoundary.tsx` + `heavy-block-skeleton.css` +
  `package.json` + `tsconfig.json` byte-unchanged from A4) Input
  (a): `git diff main -- packages/heavy-block-boundary/CONTRACT.md`.
  Expected: empty diff (already consolidated at A4). Input (b):
  `git diff main -- packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: empty diff (D1 prop interface + function body byte-identical
  to A4). Input (c): `git diff main --
  packages/heavy-block-boundary/src/heavy-block-skeleton.css`.
  Expected: empty diff. Input (d): `git diff main --
  packages/heavy-block-boundary/package.json`. Expected: empty diff.
  Input (e): `git diff main --
  packages/heavy-block-boundary/tsconfig.json`. Expected: empty
  diff. Location: shell.
- **TC18** (D1 prop interface byte-unchanged from A4 — A4 TC19
  carry-over) Input: `git diff main --
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | grep -E
  '^[-+]' | grep -E
  'HeavyBlockKindRegistry|HeavyBlockKind|HeavyBlockDimensions|HeavyBlockBoundaryProps|__heavyBlockKind'`.
  Expected: empty (no `-`/`+` lines on the public type definitions;
  A5 does not touch the boundary file at all). Verifies A5 ships
  consumer-side migration WITHOUT drifting the boundary's public
  surface. Location: shell.
- **TC19** (3 heavy block CONTRACT.md changes are scoped to a
  single `Public surface` bullet append; no other section modified)
  Input (a): `git diff main -- packages/block-jupyter/CONTRACT.md |
  grep -cE '^[+]'`. Expected: 1-2 (single new bullet line; possibly
  +1 context line — bounded). Input (b): same for
  `packages/block-nn-viz/CONTRACT.md`. Expected: 1-2. Input (c):
  same for `packages/block-agent-flow/CONTRACT.md`. Expected: 1-2.
  Input (d): `git diff main --
  packages/block-jupyter/CONTRACT.md | grep -cE '^[-]'`. Expected:
  0 (no removed lines; pure append). Input (e): same for nn-viz.
  Expected: 0. Input (f): same for agent-flow. Expected: 0. Location:
  shell. If executor needs to slightly reformat the surrounding
  bullet for indentation parity, the `-` line count may rise to 1-2;
  reviewer accepts up to 2 `-` lines per CONTRACT.md as long as the
  net change is the documented Public surface bullet (graduation per
  acceptance bullet 12 collateral-drift slot).
- **TC20** (apps/site `components.ts` size + lint + typecheck post-rewire)
  Input (a): `wc -l apps/site/src/components.ts`. Expected: ≤ 110
  (estimated ~93 LOC post-edit; ceiling 110 for breathing room).
  Input (b): `pnpm --filter @skb/site lint`. Expected: exit 0 (no
  ESLint issues on the rewired file). Input (c): `pnpm --filter
  @skb/site typecheck`. Expected: exit 0 (Astro check + tsc --noEmit
  pass; the new factory functions + value imports + dynamic-import
  load callbacks all type-check). Location: shell.
- **TC21** (Link-check passes via CI) Input:
  `.github/workflows/link-check.yml` on push to feature branch.
  Expected: workflow `success` conclusion (lychee CI-only per Wave
  3 baseline). Location: GitHub Actions. PR.md links here are all
  relative paths to in-repo files using plain path form (no `:line`
  suffix per memory `feedback_lychee_line_anchor`); no `~/.claude/...`
  markdown link form per memory `feedback_lychee_user_local_paths`.
  3 CONTRACT.md cross-links to ADR-0014 D5 use the relative path
  `../../docs/decisions/ADR-0014-heavy-block-boundary.md` from
  `packages/block-{kind}/CONTRACT.md` (verified at PLAN-time: 2
  levels up lands at repo root + `docs/decisions/...` resolves
  correctly).
- **TC22** (apps/site existing tests besides components-map still
  PASS — no regression on sample-blocks-page / lazy-chunking /
  fouc-script / search-* / visual-smoke) Input: `pnpm --filter
  @skb/site test`. Expected: exit 0; the 7+ existing test files in
  `apps/site/src/__tests__/` all PASS unchanged after A5 (none of
  them pin the HeavyBlockBoundary integration shape). Particularly:
  `lazy-chunking.test.ts` MUST still PASS — A5 introduces 3 new
  dynamic `import(...)` boundaries (one per heavy block factory) but
  the test pins the EXISTING chunking behavior (Phase 1 baseline);
  if the test happens to pin the heavy block chunk names AND those
  names change post-A5, a graduation may be needed (executor
  evaluates at EXECUTE time). Location: shell.

## contracts_affected

- **`packages/block-jupyter/CONTRACT.md`** — **MODIFIED** (D2 Row 1
  trigger #1 of 3). The `## Public surface` `./ui-default` sub-list
  gains a single bullet documenting the new
  `heavyBoundaryDimensions: HeavyBlockDimensions` export with a
  cross-link to ADR-0014 D5. The literal bullet text is authored
  under `## acceptance` bullet 9 below (single-source — the
  CONTRACT.md prose copies that bullet's literal block per heavy
  block; values differ only on `width <600|500|600>`). All other
  sections (Invariants / Test corpus invariants / Wave 3 work /
  Forward-compat consumers / Modifying this file / Related) stay
  byte-unchanged. TC7 + TC19 evidence.
- **`packages/block-nn-viz/CONTRACT.md`** — **MODIFIED** (D2 Row 1
  trigger #2 of 3). Same pattern. The literal bullet uses `width
  500` per ADR-0014 D5 line 238. TC7 + TC19 evidence.
- **`packages/block-agent-flow/CONTRACT.md`** — **MODIFIED** (D2
  Row 1 trigger #3 of 3). Same pattern. The literal bullet uses
  `width 600` per ADR-0014 D5 line 239. TC7 + TC19 evidence.
- **`packages/heavy-block-boundary/CONTRACT.md`** — **NOT modified.**
  Already consolidated at A4 with the canonical 8-bullet invariant
  list. A5 just consumes the contract; the consumer-side adapter
  pattern (apps/site factories using `HeavyBlockBoundary` + per-block
  dims) is documented in the heavy block CONTRACTs, NOT in the
  boundary's CONTRACT (the boundary is agnostic to specific kinds —
  the `Plugin extensibility (A4; AC#13)` invariant bullet at line
  43 of `heavy-block-boundary/CONTRACT.md` already states "Future
  plugin blocks need only export `<Kind>RenderView` +
  `heavyBoundaryDimensions` per ADR-0014 D5 (consumer wires the
  boundary)." which is the canonical contract from the boundary
  side; A5 is the first instance of this contract being satisfied
  by an existing block). TC17a verifies empty diff.
- **W4-1 partner contract** (`packages/block-foundation/CONTRACT.md`)
  is **NOT modified**. The boundary's CONTRACT.md continues to
  cross-link to W4-1 governing how `kind='viz'` blocks compose with
  the boundary on the MDX/static render path; the partner contract
  stays as-is (last touched at A4 / unchanged).

## adr_touched

- **`docs/decisions/ADR-0014-heavy-block-boundary.md`** — **NOT
  edited.** Status remains `proposed`; promotion to `accepted` is
  A8 scope per locked Wave 4 plan Stage A close criterion #1. A5
  is the consumer of ADR-0014 (specifically D5 lines 199-245 for
  per-block dimensions ownership + the initial defaults table at
  lines 235-240; D8 lines 315-345 for the apps/site migration
  pattern from `makeHeavyBlockPlaceholder` to `HeavyBlockBoundary`
  + the `import().then((m) => ({ default: m.<Kind>RenderView }))`
  adapter shape; AC#15 lines 415-418 for the contract test invariant
  that apps/site imports `heavyBoundaryDimensions` from each heavy
  block package, NOT inline literals), not the editor.
- Per gatekeeper directive 2026-05-03 #1 + the A1/A2/A3/A4 PR.md
  precedent, this `adr_touched` field explicitly lists ADR-0014
  even though no edits occur, since A5 is the fifth implementation
  PR materially advancing ADR-0014 acceptance criteria (#15 newly
  satisfied; #1/#3/#4/#6/#7/#8/#9/#10/#11/#12/#13/#14 regression
  baseline preserved). Reviewers verify A5 diff aligns with ADR-0014
  D5 (each heavy block package owns its dimensions; values match
  the table at lines 235-240; the export sits in `<kind>.ui.ts`
  metadata file per line 205 NOT in the `<Kind>.tsx` RenderView
  file), D8 (apps/site migration pattern verbatim — REPLACE the 3
  `makeHeavyBlockPlaceholder` calls with `HeavyBlockBoundary`
  invocations sourcing `dims` from the imported aliases + `load`
  from a dynamic `import().then((m) => ({ default: ... }))` adapter),
  and AC#15 (apps/site imports `heavyBoundaryDimensions` from each
  heavy block package as named-import-with-rename `as <kind>Dims`;
  NEVER inline numeric literals — the new `dims-source.test.ts`
  contract test enforces this).
- D2 Row 4 (new ADR required) is **NOT triggered** — ADR-0014
  already proposed at Pre-A2; A5 implements the existing ADR's D5 +
  D8 + AC#15 specs verbatim, no new design decision surfaces.

## acceptance

1. 3 heavy block packages export
   `heavyBoundaryDimensions: HeavyBlockDimensions` from
   `packages/block-{jupyter,nn-viz,agent-flow}/src/ui-default/<kind>.ui.ts`
   with values per ADR-0014 D5 table lines 235-240: jupyter `{
   width: 600, height: 400 }`, nn-viz `{ width: 500, height: 400
   }`, agent-flow `{ width: 600, height: 400 }`. The const
   declaration is preceded by a 5-line JSDoc comment block citing
   ADR-0014 D5 + the consumer (apps/site componentsMap) + the
   layout-shift rationale. The type comes from `import type {
   HeavyBlockDimensions } from '@skb/heavy-block-boundary';` at
   the top of each file. TC5a/b/c + TC10 evidence.
2. 3 ui-default barrels
   (`packages/block-{jupyter,nn-viz,agent-flow}/src/ui-default/index.ts`)
   re-export the new const via `export { heavyBoundaryDimensions }
   from './<kind>.ui';` — TC5d/e/f evidence; the re-export sits
   alongside the existing `<kind>UiDefault` re-export in the same
   barrel.
3. 3 heavy block `package.json` files declare
   `"@skb/heavy-block-boundary": "workspace:*"` in `dependencies`
   (alphabetical ordering: in block-jupyter between
   `@skb/design-tokens` and `@skb/kernel-adapter`; in block-nn-viz
   between `@skb/design-tokens` and `@tensorflow/tfjs`; in
   block-agent-flow between `@skb/design-tokens` and `reactflow`)
   — TC6a/b/c evidence; ADR-0008 D1 dead-dep policy satisfied
   (declared AND used: type-only `HeavyBlockDimensions` import +
   apps/site runtime consumer chain). NOT in `peerDependencies` —
   matches the `@skb/design-tokens` precedent in the same packages.
4. 3 heavy block `tsconfig.json` files add `{ "path":
   "../heavy-block-boundary" }` to the `references` array — TC6d/e/f
   evidence; required for `tsc -b` composite-project dep ordering
   even though the consumption is type-only.
5. `apps/site/src/components.ts` REMOVES the A1
   `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export at lines 17-23
   (including the 5-line comment block above) per A1 acceptance
   bullet 8 forecast (the runtime use of `HeavyBlockBoundary` in
   the new componentsMap factories is the authoritative dep evidence,
   superseding the static module-level export) — TC8a evidence.
6. `apps/site/src/components.ts` REMOVES the
   `makeHeavyBlockPlaceholder` factory function at lines 42-62
   (including the 8-line comment block above) per ADR-0014 D8 line
   320-340 — TC8b evidence; replaced by HeavyBlockBoundary factories.
7. `apps/site/src/components.ts` REPLACES the 3 type-only zero-symbol
   placeholder imports at lines 10-15 (`import type {} from
   '@skb/block-{jupyter,nn-viz,agent-flow}/ui-default';`) with value
   imports per ADR-0014 D5 line 216-217 + D8 line 327-330: 3
   multi-line named-import-with-rename blocks importing
   `<Kind>RenderView` + `heavyBoundaryDimensions as <kind>Dims` from
   each heavy block ui-default — TC8c + TC3a evidence; the documented
   alias names `jupyterDims` / `nnVizDims` / `agentFlowDims` are
   consumer-facing (used in factory bodies + asserted by AC#15
   contract test) and NOT renamable without a coordinated PR.
8. `apps/site/src/components.ts` ADDS 3 factory functions
   (`Jupyter` / `NnViz` / `AgentFlow`) defined AFTER `asMdxComponent`
   helper and BEFORE `componentsMap` const declaration. Each factory:
   - takes `(props: FlatProps): ReactNode`
   - calls `createElement(HeavyBlockBoundary, { kind, dims, load,
     childProps })` form (file is `.ts`, uses `createElement` not
     JSX, per existing convention at line 1)
   - `kind` = literal kebab-case (`'jupyter'` / `'nn-viz'` /
     `'agent-flow'` — matches `HeavyBlockKindRegistry` keys)
   - `dims` = imported alias (`jupyterDims` / `nnVizDims` /
     `agentFlowDims`) — NEVER inline numeric literal (AC#15 hard
     invariant, enforced by TC3b regex)
   - `load` = arrow returning a dynamic
     `import('@skb/block-{kind}/ui-default').then((m) => ({ default:
     makeMdxAdapter(m.<Kind>RenderView as never) }))` — the
     `makeMdxAdapter` wrap converts FlatProps → BlockViewProps inside
     the loaded chunk so the boundary's `Component {...childProps}`
     invocation correctly passes the prop shape the RenderView
     expects per `BlockViewProps<TSchema>` defined in
     `packages/block-foundation/src/registry.ts:19`
   - `childProps` = `props` (the FlatProps object received by the
     factory; boundary forwards verbatim to the loaded adapter)
   The `as never` cast on `m.<Kind>RenderView` mirrors the
   light-block cast pattern at lines 69-73 of A4 state (5 light
   blocks all cast `as never` for TSchema-erasure; the runtime value
   passes through unchanged). TC3c evidence (3 factory bodies use
   `dims: <kind>Dims`).
9. `apps/site/src/components.ts` REPLACES the componentsMap entries
   for the 3 heavy blocks: `Jupyter:
   asMdxComponent(makeHeavyBlockPlaceholder('jupyter'))` →
   `Jupyter: asMdxComponent(Jupyter)` (same pattern for `NnViz` /
   `AgentFlow`); the trailing comment "// 3 heavy blocks: SSR
   placeholder; live rendering deferred to Wave 4" is REPLACED with
   "// 3 heavy blocks: HeavyBlockBoundary wraps lazy-loaded RenderView
   per ADR-0014 D8". The 5 light block entries + the `satisfies
   Readonly<Record<string, ComponentType<unknown>>>` clause stay
   byte-unchanged. TC4 evidence (componentsMap-test contract
   regression).
10. **3 CONTRACT.md `Public surface` bullets** (D2 Row 1 trigger ×3
    consolidation single-source authoritative; CONTRACT.md prose
    copies this block per heavy block — values differ only on
    `width <600|500|600>`):

    For `packages/block-jupyter/CONTRACT.md` (insert after
    `JUPYTER_TOKENS: JupyterTokens` bullet, indented 2-spaces under
    the `./ui-default` parent entry):
    ```markdown
      - `heavyBoundaryDimensions: HeavyBlockDimensions` (per [ADR-0014 D5](../../docs/decisions/ADR-0014-heavy-block-boundary.md)) — initial values: width 600, height 400 (CSS px). Consumed by `apps/site` componentsMap via `HeavyBlockBoundary` to size the SSR skeleton; zero layout shift on hydration.
    ```

    For `packages/block-nn-viz/CONTRACT.md` (insert after
    `NN_VIZ_TOKENS: NnVizTokens` bullet):
    ```markdown
      - `heavyBoundaryDimensions: HeavyBlockDimensions` (per [ADR-0014 D5](../../docs/decisions/ADR-0014-heavy-block-boundary.md)) — initial values: width 500, height 400 (CSS px). Consumed by `apps/site` componentsMap via `HeavyBlockBoundary` to size the SSR skeleton; zero layout shift on hydration.
    ```

    For `packages/block-agent-flow/CONTRACT.md` (insert after
    `AGENT_FLOW_TOKENS: AgentFlowTokens` bullet):
    ```markdown
      - `heavyBoundaryDimensions: HeavyBlockDimensions` (per [ADR-0014 D5](../../docs/decisions/ADR-0014-heavy-block-boundary.md)) — initial values: width 600, height 400 (CSS px). Consumed by `apps/site` componentsMap via `HeavyBlockBoundary` to size the SSR skeleton; zero layout shift on hydration.
    ```

    All other sections of each CONTRACT.md (Invariants / Test corpus
    invariants / Wave 3 work / Forward-compat consumers / Modifying
    this file / Related) stay byte-unchanged. TC7 + TC19 evidence.
11. NEW contract test
    `apps/site/src/__tests__/dims-source.test.ts` (~50 LOC) covers
    AC#15 via 4 `it()` blocks: (a) imports
    `heavyBoundaryDimensions as jupyterDims` from
    `@skb/block-jupyter/ui-default`; (b) imports
    `heavyBoundaryDimensions as nnVizDims` from
    `@skb/block-nn-viz/ui-default`; (c) imports
    `heavyBoundaryDimensions as agentFlowDims` from
    `@skb/block-agent-flow/ui-default`; (d) does NOT inline numeric
    width literals in HeavyBlockBoundary factory dims props (regex
    `/dims:\s*\{\s*width:\s*\d+/` MUST NOT match anywhere in the
    source body). Static source-read via `node:fs` `readFileSync` +
    `fileURLToPath(new URL('../components.ts', import.meta.url))`.
    Test file structure parallels
    `apps/site/src/__tests__/components-map.test.ts`. TC2 evidence.
12. `docs/plans/active.md` updated with the A4 row backfill (`#TBD
    → #34`; `TBD → 5f360a6` squash HEAD per `git log` confirmation
    at PLAN time) + a NEW A5 row inserted between the A4 row and
    the Stage A remaining row (`| #TBD (this) | TBD | A5 |
    apps/site dims migration via heavyBoundaryDimensions per
    ADR-0014 D5+D8 (AC#15) |`) + the Stage A remaining row decrement
    (`A5-A8 (4 PRs)` → `A6-A8 (3 PRs)`) + the next-PR pointer flips
    on lines 6 + 79 (Stage A5 → Stage A6; "apps/site dims migration
    via `heavyBoundaryDimensions`; AC#15" → "playwright zero-layout-shift
    T0/T1; AC#5") + the top-line phase summary append "+ A5" —
    TC15 evidence. All other content of `docs/plans/active.md`
    byte-unchanged. Collateral-drift slot: if executor finds the
    surrounding row sequence has shifted (e.g., a previous PR added
    or removed rows), executor adapts the line-number references
    while preserving the documented edit semantics.
13. `pnpm-lock.yaml` change BOUNDED to the 3
    `@skb/heavy-block-boundary` workspace dep entries (one per
    heavy block package) — TC16a + TC16b evidence; idempotent
    install verified — TC16c evidence. Lockfile MUST be staged at
    commit per ADR-0006 D8 + memory
    `feedback_git_operator_explicit_stage` lockfile-blob rule.
14. `pnpm check` exit 0 globally — TC9 evidence; A5 does not regress
    any other package in the workspace.
15. `docs/decisions/ADR-0014-heavy-block-boundary.md` is byte-unchanged
    (status remains `proposed`; promotion to `accepted` is A8 scope
    per locked Wave 4 plan Stage A close criterion #1) — referenced
    in `## adr_touched` (the empty-diff check is a baseline assumption
    per A4 precedent + executor verifies via `git diff main --
    docs/decisions/ADR-0014-heavy-block-boundary.md` returning empty).
16. `packages/heavy-block-boundary/*` (CONTRACT.md, JSX, CSS,
    package.json, tsconfig.json, tests) byte-unchanged from A4 —
    TC17a/b/c/d/e + TC18 evidence; A5 does not touch the boundary
    package internals (it just consumes the boundary at apps/site
    consumer + at the heavy block packages via type-only import of
    `HeavyBlockDimensions`).
17. AC#1 + AC#3 + AC#4 + AC#6 + AC#7 + AC#8 + AC#9 + AC#10 + AC#11
    + AC#12 + AC#13 + AC#14 (A2+A3+A4 boundary tests) all still PASS
    — TC1 evidence (no regression from A5's consumer-side rewire);
    apps/site existing tests (components-map / sample-blocks-page /
    lazy-chunking / fouc-script / search-* / visual-smoke) all still
    PASS — TC4 + TC22 evidence.
18. **Out-of-scope items deferred per Wave 4 plan A6-A8**: playwright
    T0/T1 zero-layout-shift validation (AC#5) — A6; `*.astro` SSR
    variants 5× consolidation (Wave 3 C4a/C4b carry-over) — A7;
    selective per-block chunking + perf baseline (C5 carry-over)
    **+ ADR-0014 promotion `proposed → accepted`** in same A8
    commit (Stage A close gate per gatekeeper directive #3) —
    exhaustively enumerated in `## Out-of-scope` block.
19. Codex review iterations: expect **0-2 forward-fix rounds** (A4
    needed 0-1; A5 has more touchpoints — 18 files including 6
    parallel heavy block edits + apps/site major rewire + new
    contract test + active.md bookkeeping — but the work is
    mechanically symmetrical across the 3 heavy blocks so reviewer
    friction should stay bounded). Likely friction surfaces:
    (a) the `as never` cast in `makeMdxAdapter(m.<Kind>RenderView
    as never)` — reviewer may probe whether a tighter cast or an
    inline adapter is preferable; the locked PLAN answer is
    "matches light-block precedent at lines 69-73 of A4 state; the
    cast is TSchema-erasure for the BlockViewProps generic, not a
    semantic widening";
    (b) the `dims: jupyterDims` vs the inline `dims: { width: 600,
    height: 400 }` form — reviewer may verify AC#15 enforcement is
    correct; the locked PLAN answer is "AC#15 hard-mandates
    imported aliases; the contract test enforces via regex";
    (c) the type-only import of `HeavyBlockDimensions` in each
    `<kind>.ui.ts` — reviewer may probe ADR-0008 D1 dead-dep
    policy; the locked PLAN answer is "the type-only import +
    apps/site runtime consumer chain together prove declared AND
    used; matches `@skb/design-tokens` precedent in the same
    packages";
    (d) the apps/site factory function placement (between
    `asMdxComponent` and `componentsMap`) — reviewer may suggest a
    different location; reviewer accepts any placement that
    preserves type-checking + the documented `## acceptance`
    bullet 8 sequence;
    (e) the `dims-source.test.ts` static source-read approach —
    reviewer may suggest a runtime alternative; the locked PLAN
    answer is "static source-read is the canonical AC#15
    enforcement per the ADR-0014 acceptance criterion line 415-418
    phrasing 'contract test confirms apps/site IMPORTS
    heavyBoundaryDimensions FROM each heavy block package'";
    (f) the 3 dims aliases naming
    (`jupyterDims` / `nnVizDims` / `agentFlowDims`) — reviewer may
    suggest a different convention; the names are sourced verbatim
    from ADR-0014 D5 line 216 + D8 line 329 (consumer-facing
    canonical names; NOT renamable without a coordinated PR).
20. **D1 stage 4 PRE-COMMIT CLAUDE REVIEW MANDATORY** per D2 Row 1
    HIT (3 heavy block CONTRACT.md `Public surface` updates is the
    architectural-surface change — single bullet per CONTRACT.md
    but 3 sister documents touched in coordination; per ADR-0011
    D1+D2 v0.1.1, even a single bullet on a CONTRACT.md is a Row 1
    trigger). Orchestrator-self walks the `## acceptance` bullets
    1-22 + the 3 CONTRACT.md bullet additions + the apps/site
    rewire diff against the new contract test
    (`dims-source.test.ts`) to verify the AC#15 enforcement is
    correct AND the 3 sister CONTRACT.md bullets are consistent
    (same prose template; only the width numeric differs per the
    ADR-0014 D5 table). Mitigates same-model echo-chamber on the
    coordinated multi-document edit.
21. PR.md (`docs/plans/wave-4-main/A5-apps-site-heavy-block-dims-migration.md`)
    is self-listed in the staged file list at commit time per
    ADR-0006 D8 strict whitelist (PR #1 R2 lesson; carried through
    Wave 3 + Pre-A1+A2+A3 + A1 + A2 + A3 + A4).
22. Stage A progression after A5 merge: 5/8 PRs done (A1+A2+A3+A4+A5);
    3 remaining (A6 playwright + A7 .astro consolidation + A8
    chunking + ADR promote). Stage A close gate sequence preserved
    (gatekeeper directive #3): A8 is the last Stage A PR + carries
    the ADR-0014 status promotion `proposed → accepted` + closes
    smoke #10 (zero layout shift) coverage definitively (A6 produces
    the playwright evidence; A8 ratifies via ADR promotion).

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): **HIT** —
  `packages/block-jupyter/CONTRACT.md` +
  `packages/block-nn-viz/CONTRACT.md` +
  `packages/block-agent-flow/CONTRACT.md` each gain a single bullet
  in `## Public surface` documenting the new
  `heavyBoundaryDimensions` export. Per ADR-0011 D1+D2 v0.1.1, a
  CONTRACT.md `Public surface` addition is a Row 1 trigger
  regardless of the size of the addition (architectural-surface
  visibility); 3 CONTRACT.md touches in coordination amplifies the
  trigger. This is the **D1 stage 4 PRE-COMMIT CLAUDE REVIEW
  trigger**.
- **Row 2** (package add/remove): **NO** — `@skb/heavy-block-boundary`
  is a workspace-internal dep add in 3 existing packages, NOT a
  NEW workspace package. Workspace count stays at 23 (post-A1
  baseline).
- **Row 4** (new ADR required): **NO** — ADR-0014 was already
  proposed at Pre-A2 + extended at Pre-A3 plan-lock; A5 implements
  the existing ADR's D5 + D8 + AC#15 specs verbatim, no new design
  decision surfaces.
- **Row 5** (cross ≥ 3 packages): **flag-only / supplementary** —
  A5 touches 4 packages (`packages/block-jupyter` +
  `packages/block-nn-viz` + `packages/block-agent-flow` + `apps/site`).
  Per ADR-0011 D1 + plan-challenger Q5 absorbtion at Pre-A3, Row 5
  alone does NOT fire Stage 4. Row 1 is the binding trigger; Row 5
  amplifies the reviewer scrutiny within stage 3 (codex
  reviewer-55 applies ADR-0006 8-point checklist with extra
  attention to cross-package consistency: 3 sister CONTRACT.md
  bullets must use the SAME prose template, only the width numeric
  differs; 3 sister `package.json` deps must use the SAME
  workspace:* pattern + alphabetical placement; 3 sister
  `tsconfig.json` references must use the SAME relative path
  `../heavy-block-boundary`).
- **Row 8** (CI / build / deploy / auth / security): **NO** — pure
  in-package + apps/site consumer rewire + contract test + 3
  CONTRACT.md `Public surface` updates + documentation bookkeeping;
  no CI workflow / deploy / auth / security surface change.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW MANDATORY** (Row 1 HIT × 3
CONTRACT.md; the 3-sister bullet addition is the meta-class
architectural surface mandating mitigation against same-model
echo-chamber on the coordinated multi-document edit).

## executor

Standard ADR-0011 D1 pipeline. Fifth non-bootstrap Wave 4 PR — same
shape as A4 (Stage 4 PRE-COMMIT CLAUDE REVIEW MANDATORY per D2 Row
1 HIT × 3); A2+A3 were skip-stage-4 because no Row 1/4 hit; A4
hit Row 1 once via CONTRACT.md consolidation; A5 hits Row 1 three
times via the 3 sister `Public surface` bullet additions (more
amplified trigger than A4 — reviewer Claude scrutinizes
cross-document consistency + the 3-bullet-template fidelity).

**EXECUTOR PROFILE**: `codex-generic-executor` per Wave 4 plan A5
line 199 + the A1+A2+A3+A4 executor continuity (proven flow on
multi-file integration; no DEVIATION-from-plan logging needed since
the plan already specifies `codex-generic-executor`).

- **PLAN**: `pr-writer` Claude subagent (this PR.md authored by
  pr-writer first invocation; orchestrator iterates 0-2 rounds
  before lock per ADR-0011 D1 stage 1 standard flow).
- **EXECUTE**: `codex-generic-executor` (gpt-5.5 + workspace-write
  sandbox per ADR-0011 D6 + Pre-A1-codified `--yolo` flag + R7
  piping + pipefail). Dispatch invocation form per Pre-A1 R7:
  `set -o pipefail; timeout 1200 codex exec --yolo --profile
  codex-generic-executor "$(cat /tmp/A5-prompt.md)" < /dev/null
  2>&1 | tee /tmp/codex-runs/2026-05-03-A5-generic-executor.txt >
  /dev/null`. Audit log archived per Pre-A1 R7 flow (head -2000 →
  `docs/audits/codex-runs/`). Executor reads PR.md `## files` +
  `## test_cases` + `## acceptance` + the in-scope ADR-0014 D5
  lines 199-245 (per-block dimensions ownership + initial defaults
  table) + D8 lines 315-345 (apps/site migration pattern verbatim
  including the `import().then((m) => ({ default: ... }))` adapter
  shape) + AC#15 lines 415-418 (contract test invariant phrasing)
  + the A4 state of `apps/site/src/components.ts` +
  `packages/block-{jupyter,nn-viz,agent-flow}/src/ui-default/<kind>.ui.ts`
  + each barrel + each CONTRACT.md `Public surface` section + each
  `package.json` `dependencies` block + each `tsconfig.json`
  `references` array + the existing `apps/site/src/__tests__/components-map.test.ts`
  for new test file structural parallel; TDD-front workflow per
  ADR-0011 D1 stage 2: writes the new `dims-source.test.ts` 4 test
  assertions FIRST → confirms they FAIL against the A4 state (no
  `heavyBoundaryDimensions` exports + no apps/site dims aliases +
  still has `__A1_HEAVY_BLOCK_BOUNDARY_REF` +
  `makeHeavyBlockPlaceholder`) → implements the 3 heavy block
  ui-default exports + 3 barrel re-exports + 3 package.json deps +
  3 tsconfig references + apps/site rewire (REMOVE A1 evidence-export
  + REMOVE makeHeavyBlockPlaceholder + REPLACE 3 type-only
  zero-symbol imports + ADD value imports + ADD 3 factory functions
  + REPLACE componentsMap entries) + 3 CONTRACT.md bullet appends +
  active.md bookkeeping → confirms TC2-TC8 + the existing A2+A3+A4
  tests + apps/site existing tests all PASS → runs TC9-TC22 →
  reports back. Pre-flight responsibility: confirm the 18-file
  canonical list matches the diff; if any file outside the canonical
  list is touched (e.g., a transitive `pnpm install` re-resolves an
  unrelated dep version), graduate per acceptance bullet 12
  collateral-drift slot.
- **REVIEW**: `codex-pr-reviewer-55` (ADR-0011 D1 stage 3 default
  reviewer; ADR-0006 8-point checklist mandatory). Audit log:
  `/tmp/codex-runs/2026-05-03-A5-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-03-A5-pr-reviewer-55.txt`
  truncated. Reviewer hunts especially for:
  (a) D1 prop interface byte-unchanged from A4 (TC18 — A5 does NOT
  touch the boundary at all, but reviewer verifies the empty-diff
  invariant on `HeavyBlockBoundary.tsx`);
  (b) the `apps/site/src/components.ts` rewire correctly drops the
  3 forecast removals (`__A1_HEAVY_BLOCK_BOUNDARY_REF` +
  `makeHeavyBlockPlaceholder` + 3 `import type {}` zero-symbol
  imports) and adds the 3 forecast additions (3 value imports + 3
  factory functions + 3 componentsMap rewires);
  (c) each factory body uses `dims: <kind>Dims` (NOT inline
  numeric literal — reviewer hunt with regex per TC3b);
  (d) each factory's `load()` arrow returns `({ default:
  makeMdxAdapter(m.<Kind>RenderView as never) })` (NOT `({ default:
  m.<Kind>RenderView })` — the `makeMdxAdapter` wrap is REQUIRED
  for FlatProps → BlockViewProps conversion; without it, the
  RenderView would receive flat MDX props and the destructure of
  `{ props, content }: BlockViewProps` would yield undefined);
  (e) the 3 `<kind>.ui.ts` heavy block files each add `import type
  { HeavyBlockDimensions } from '@skb/heavy-block-boundary';` at
  the top + the new `export const heavyBoundaryDimensions:
  HeavyBlockDimensions = { width: <D5>, height: 400 };` at the end;
  reviewer verifies the width values match ADR-0014 D5 table
  (jupyter 600 / nn-viz 500 / agent-flow 600);
  (f) each CONTRACT.md bullet uses the same prose template (only
  the width numeric differs); the ADR-0014 D5 cross-link uses the
  relative path `../../docs/decisions/ADR-0014-heavy-block-boundary.md`
  resolving correctly from each `packages/block-{kind}/CONTRACT.md`;
  (g) each `package.json` `dependencies` block has
  `@skb/heavy-block-boundary: workspace:*` placed alphabetically
  (between `@skb/design-tokens` and the next entry);
  (h) each `tsconfig.json` `references` array has `{ "path":
  "../heavy-block-boundary" }` (workspace convention requires this
  for tsc-b dep ordering);
  (i) the new `apps/site/src/__tests__/dims-source.test.ts`
  contract test uses static source-read via `node:fs` `readFileSync`
  + `fileURLToPath(new URL('../components.ts', import.meta.url))`;
  the 4 `it()` blocks cover the 3 import-shape assertions + the
  anti-inline-literal regex assertion;
  (j) the `apps/site/src/__tests__/components-map.test.ts` 4 tests
  still PASS (TC4 — the componentsMap KEYS are unchanged; only the
  VALUES change from placeholder factories to HeavyBlockBoundary
  factories);
  (k) the `pnpm-lock.yaml` diff is bounded to the 3 workspace dep
  entries;
  (l) `docs/plans/active.md` edits are scoped to the A4 backfill +
  new A5 row + Stage A remaining decrement + next-PR pointer flip
  + top-line append (no edits to unrelated content);
  (m) PR.md self-listed in `## files`;
  (n) NO modification to ADR-0014 (status remains `proposed`);
  (o) NO modification to `packages/heavy-block-boundary/*` (TC17 —
  empty diff on CONTRACT.md / JSX / CSS / package.json /
  tsconfig.json / tests / .test-d.ts).
- **PRE-COMMIT CLAUDE REVIEW**: **MANDATORY** per D2 Row 1 HIT × 3
  (3 heavy block CONTRACT.md `Public surface` bullet additions in
  coordination). Orchestrator-self walks the `## acceptance`
  bullets 1-22 + the 3 CONTRACT.md bullet additions + the apps/site
  rewire diff against the new contract test (`dims-source.test.ts`)
  to verify (a) the AC#15 enforcement is correct (the contract
  test catches inline-literal regressions); (b) the 3 sister
  CONTRACT.md bullets are consistent (same prose template; only
  the width numeric differs per the ADR-0014 D5 table); (c) the 3
  sister `package.json` deps + `tsconfig.json` references use the
  same workspace:* + alphabetical pattern (mitigates same-model
  echo-chamber on the coordinated multi-document edit per ADR-0011
  D2 v0.1.1 row 1 mandate). Orchestrator authorizes COMMIT only
  after the verification.
- **COMMIT (+ push)**: **reviewer codex** commits per ADR-0011 D1
  stage 5 (NOT orchestrator-self per ADR-0011 D1 + plan-challenger
  C6 absorbtion at Pre-A3). Reviewer applies ADR-0006 D8
  explicit-file-list staging: `git reset HEAD` → `git add <files
  per ## files canonical list = 18>` → `git diff --cached --stat`
  verify staged count matches `## files` canonical (18 baseline)
  → `git commit` → `git push`. Reviewer responsible for ensuring
  `pnpm-lock.yaml` IS staged (A5 changes it; lockfile blob
  discipline per memory `feedback_git_operator_explicit_stage`).
  Reviewer also verifies that NO file outside the canonical 18 is
  staged (e.g., NO `dist/**` artifacts, NO `.turbo/**` cache, NO
  `node_modules/**` traces).
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per
  ADR-0011 D1 stage 6). Verifies the actual diff against this
  locked `## acceptance` block; flags scope creep (extra files
  outside the 18-canonical + EXECUTE graduations) or scope drop
  (missing files); outputs ACCEPT or REJECT-with-residue. Residue
  list flows back to orchestrator for follow-up sequencing.

## Out-of-scope (explicitly deferred)

- **A6** — Playwright T0/T1 layout-shift validation per AC#5
  (gatekeeper smoke #10 core mandate). Note memory
  `feedback_wsl2_chromium_launch`: WSL2 chromium launch fails
  locally; CI-only execution. A5 does NOT include playwright; the
  static contract test (`dims-source.test.ts`) covers AC#15 in
  vitest land but does NOT prove zero layout shift end-to-end (A6
  produces the runtime evidence by comparing
  `getBoundingClientRect()` at T0 skeleton render vs T1 post-hydration
  real heavy block).
- **A7** — `*.astro` SSR variants 5× consolidation (Wave 3 C4a/C4b
  carry-over). The 3 heavy block packages already have `<Kind>.astro`
  variants (per the existing `exports` map entries `./ui-default/Jupyter.astro`
  / `./ui-default/NnViz.astro` / `./ui-default/AgentFlow.astro`);
  A7 consolidates these with the 5 light block .astro variants
  (math/pdf/jupyter that DON'T exist + the existing astros).
- **A8** — Phase 2 selective per-block chunking + perf baseline
  (C5 carry-over) **+ ADR-0014 promotion `proposed → accepted`**
  in same A8 commit (Stage A close gate per gatekeeper directive
  #3). The Phase 1 chunking baseline (Vite respects dynamic
  `import()` boundaries automatically; `apps/site/astro.config.mjs`
  `manualChunks` unchanged from A4) IS already in effect post-A5;
  A8 explores selective per-block chunking (e.g., naming the heavy
  block chunks via `manualChunks` for cache-warming + bundle
  analyzer baseline).
- **Editor (Tiptap NodeView) consumption**: ADR-0014 D9 explicit
  out-of-scope; editor stays unwrapped unless caller opts in.
  `editor-shell` continues to register heavy block `EditorView`
  exports directly per Wave 3 A3 registerBlocks pattern, unchanged.
  A5 does not change editor semantics.
- **Pre-wrapped helper exports** (`<Kind>RenderViewWithBoundary`)
  — ADR-0014 D4 line 193-194 lists this as an OPTIONAL future
  helper export per heavy block; A5 does NOT add the helper
  exports (each consumer wires the boundary explicitly per the
  apps/site factory functions). If a future consumer (e.g., a
  3rd-party static-site generator beyond apps/site) wants the
  pre-wrapped form, they can author the helper themselves or
  contribute to the heavy block packages.
- **Adding `heavyBoundaryDimensions` to plugin heavy blocks** —
  the 3 existing heavy blocks (jupyter / nn-viz / agent-flow) are
  the canonical set; future plugin heavy blocks (e.g.,
  `@skb/block-3d-graph` per ADR-0014 D7 line 290 example) would
  also need to export `heavyBoundaryDimensions` per the canonical
  pattern A5 establishes. A5 does NOT enumerate plugin heavy
  blocks (none exist today; the contract is established by
  example).
- **Refining the dims values past the ADR-0014 D5 initial defaults**
  — A5 ships the table values verbatim (jupyter 600×400 / nn-viz
  500×400 / agent-flow 600×400). Future UX iteration may refine
  these per gatekeeper smoke #10 validation (A6 produces the
  initial runtime evidence; subsequent UX PRs may adjust). A5 does
  NOT iterate the values.
- **Astro-side `heavyBoundaryDimensions` consumption** — the
  `*.astro` SSR variants (e.g., `Jupyter.astro` /
  `NnViz.astro` / `AgentFlow.astro`) currently render their own
  static placeholders per Wave 3 baseline; A5 does NOT wire them
  to consume `heavyBoundaryDimensions` (the .astro path is
  apps/site direct-Astro-import, NOT MDX componentsMap; ADR-0014
  scope is the MDX render path per D4 line 171-173). A7 consolidation
  may revisit; A5 keeps the .astro path orthogonal.
- **Removing the `<Kind>EditorView` exports** — the heavy block
  `<Kind>EditorView` exports stay (used by `editor-shell` per
  Wave 3 A3 registerBlocks pattern); A5 does NOT touch them.
- **AC#15 enforcement via type system** — A5 enforces AC#15 via
  the runtime contract test `dims-source.test.ts` (static
  source-read + regex). An alternative type-system enforcement
  (e.g., a branded `DimsAlias` type that only the imported aliases
  satisfy) is possible but adds complexity for marginal gain; A5
  ships the test-based enforcement per ADR-0014 AC#15 phrasing
  ("contract test confirms").

## Critical do-NOTs (A1+A2+A3+A4 retrospective + A5-specific)

- DO NOT modify `docs/decisions/ADR-0014-heavy-block-boundary.md`
  (A8 promotes status `proposed → accepted`).
- DO NOT modify `packages/heavy-block-boundary/CONTRACT.md` or
  `HeavyBlockBoundary.tsx` or `heavy-block-skeleton.css` or
  `package.json` or `tsconfig.json` (already consolidated at A4;
  A5 just consumes — TC17 verifies empty diff).
- DO NOT modify D1 prop interface (lines 1-30 of
  `HeavyBlockBoundary.tsx`).
- DO NOT use JSX in `apps/site/src/components.ts` (file is `.ts`,
  uses `createElement`; if executor is tempted to rename to `.tsx`
  for JSX support, that's scope creep + breaks the existing
  light-block `createElement(MdxAdapter, ...)` invocations + breaks
  the Astro build configuration).
- DO NOT inline numeric dims literals in `apps/site/src/components.ts`
  (AC#15 hard invariant; `dims: { width: 600, height: 400 }` form
  is FORBIDDEN — use `dims: jupyterDims` etc.; the contract test
  enforces via regex).
- DO NOT push to main directly.
- DO NOT use `--filter=@skb/...` (with `=`); use `--filter @skb/...`
  (with space) per workspace pnpm convention.
- DO NOT make markdown links to `~/.claude/...` paths per memory
  `feedback_lychee_user_local_paths`.
- DO NOT add `@skb/heavy-block-boundary` to `peerDependencies` in
  the heavy block packages — `dependencies` is the canonical
  workspace pattern (matches the `@skb/design-tokens` precedent in
  the same packages); the type-only import + apps/site runtime
  consumer chain together prove ADR-0008 D1 dead-dep policy
  satisfied.
- DO NOT use `--no-verify` or skip pre-commit hooks per CLAUDE.md
  Hard rules.
- DO NOT skip the `makeMdxAdapter` wrap inside `load()` (without
  it, the lazy-loaded RenderView receives flat MDX props and
  destructure of `{ props, content }: BlockViewProps` yields
  undefined; the wrap is REQUIRED for prop-shape conversion to
  match the light-block synchronous adapter pattern; the heavy
  block RenderViews are typed `ComponentType<BlockViewProps<typeof
  jupyterCore.propsSchema>>` per `defineUI` inference).
- DO NOT modify the existing `makeMdxAdapter` helper at lines
  33-40 of current `apps/site/src/components.ts` (light blocks
  still use it synchronously at the componentsMap declaration; A5
  re-uses the same helper inside the async `load()` callbacks).
- DO NOT modify the `<Kind>.tsx` RenderView files in the 3 heavy
  block packages (per ADR-0014 D5 line 205: the dims live in
  `ui-default/<kind>.ui.ts` metadata file, NOT in the
  `<Kind>.tsx` RenderView file).
- DO NOT modify the heavy block `## Invariants` / `## Test corpus
  invariants` / `## Wave 3 work` / `## Forward-compat consumers` /
  `## Modifying this file` / `## Related` sections — A5 only
  appends a single bullet to `## Public surface` per heavy block.
- DO NOT touch the heavy block test corpora
  (`packages/block-{kind}/src/__tests__/*`) — A5 enforces AC#15 at
  the consumer side (apps/site contract test), NOT at the package
  side; the package-side test corpora stay byte-unchanged.
- DO NOT add new top-level deps; only workspace deps
  (`@skb/heavy-block-boundary: workspace:*`).
- DO NOT touch `apps/site/package.json` — the `@skb/heavy-block-boundary:
  workspace:*` dep was added at A1 (line 30 of current state); A5's
  value imports of the 3 heavy block ui-default subpaths work via
  the existing 3 heavy block deps already declared.
- DO NOT touch `apps/site/src/styles/global.css` — the design-token
  global injection at lines 1-2 stays intact; the heavy-block-skeleton
  CSS side-effect import was added at A4 to `apps/site/src/components.ts`
  line 8 (verifies pre-edit at PLAN-time grep — the import IS
  present at A4 commit `5f360a6`); A5 does NOT touch either.

## Authority Links

- [Wave 4 plan A5 §](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  — locked plan, A5 lines 186-219
- [ADR-0014 HeavyBlockBoundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  — D5 (per-block dimensions ownership lines 199-245 + initial
  defaults table lines 235-240), D8 (apps/site migration pattern
  verbatim lines 315-345 + the `import().then((m) => ({ default:
  m.<Kind>RenderView }))` adapter shape), AC#15 (contract test
  invariant lines 415-418)
- [ADR-0011 D1+D2 v0.1.1](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — execution model + D2 Row 1 trigger semantics
- [ADR-0007 D2](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
  — D2 trigger judgment table
- [ADR-0006 D8](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — explicit-file-list staging discipline
- [ADR-0008 D1](../../decisions/ADR-0008-wave-2-entry-policies.md)
  — dead-dep policy (declared AND used; the `@skb/heavy-block-boundary`
  workspace dep adds in 3 heavy block packages satisfy this via
  type-only import + apps/site runtime consumer chain)
- [`packages/heavy-block-boundary/CONTRACT.md`](../../../packages/heavy-block-boundary/CONTRACT.md)
  — A4-consolidated 8-bullet invariant list (the consumer-side
  invariant for plugin extensibility at line 43 explicitly forecasts
  the A5 contract: "Future plugin blocks need only export
  `<Kind>RenderView` + `heavyBoundaryDimensions` per ADR-0014 D5
  (consumer wires the boundary).")
- [`packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`](../../../packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx)
  — A4 state of the boundary (`HeavyBlockBoundaryProps<P>` D1 lines
  19-30; `dims: HeavyBlockDimensions` prop at line 21; the
  `<Component {...childProps}>` invocation at line 104 — A5 wires
  the `dims` + `childProps` per consumer-side adapter)
- [`packages/block-foundation/src/registry.ts:19`](../../../packages/block-foundation/src/registry.ts)
  — `BlockViewProps<TSchema>` definition (the prop shape RenderViews
  expect; `makeMdxAdapter` converts FlatProps → BlockViewProps;
  the heavy block `load()` adapter wraps `m.<Kind>RenderView`
  through `makeMdxAdapter` for the same conversion at lazy-load
  time)
- [`packages/block-callout/CONTRACT.md`](../../../packages/block-callout/CONTRACT.md)
  — workspace precedent for CONTRACT.md `## Public surface` bullet
  style (the heavy block bullets in A5 follow the same `<export-name>:
  <type>` pattern + cross-link prose + indentation as block-callout's
  existing bullets)
- [`apps/site/src/__tests__/components-map.test.ts`](../../../apps/site/src/__tests__/components-map.test.ts)
  — workspace precedent for the new `dims-source.test.ts` test
  file structure (4 `it()` blocks; vitest `describe` outer; static
  source-read via `node:fs` for AC#15 enforcement)
- [A4 PR.md](A4-heavy-block-boundary-css-a11y.md) — schema + prose
  density template (A5 mirrors the section ordering: title / files /
  test_cases / contracts_affected / adr_touched / acceptance / D2
  trigger / executor / Out-of-scope / do-NOTs / Authority Links)
- [A1 PR.md acceptance bullet 8](A1-heavy-block-boundary-package.md)
  — the original forecast of the A5 cleanup (REMOVE
  `__A1_HEAVY_BLOCK_BOUNDARY_REF` evidence-export "when A5 substitutes
  the 3 heavy block placeholders below with real
  `<HeavyBlockBoundary>` calls per ADR-0014 D8; this re-export goes
  away then.")
