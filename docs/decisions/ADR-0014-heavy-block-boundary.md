# ADR-0014: HeavyBlockBoundary wrapper for client:only heavy blocks

| 字段 | 值 |
| ---- | --- |
| 状态 | accepted |
| 日期 | 2026-05-03 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | Wave 3 C3 PR shipped 3 heavy block placeholders (`makeHeavyBlockPlaceholder` factory in `apps/site/src/components.ts`); ADR-0013 D3 deferred ADR-0014 to Wave 4 with explicit requirements (client:only wrapper + skeleton states matching SSR placeholder dimensions); gatekeeper 2026-05-02 directive strengthens design (unified wrapper + plugin-extensible + dimensions-per-kind + visual skeleton). |
| 关系 | 不替代 [ADR-0009](ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union (`viz` kind unchanged); adds invariant W4-1 to `block-foundation/CONTRACT.md` governing how `kind='viz'` blocks compose with apps/site SSR boundary. |

## Context

Wave 3 Stage C C3 PR (squash HEAD `ee1ce4e`) shipped
`apps/site/src/components.ts` with 3 heavy block placeholders
(Jupyter / NnViz / AgentFlow) using `makeHeavyBlockPlaceholder(blockName)`
factory:

```typescript
function makeHeavyBlockPlaceholder(blockName: string): ComponentType<FlatProps> {
  return function HeavyBlockPlaceholder() {
    return createElement('div', {
      'data-block': blockName,
      'data-deferred': 'wave-4',
      className: 'block-deferred',
    }, `${blockName} block: client-side rendering deferred to Wave 4 (ADR-0014 candidate; SSR-safe heavy-block integration).`);
  };
}
```

The placeholder satisfies Wave 3 SSR HTML requirements (page builds,
MDX detects block markers via `componentBlockTag` regex, link-check
passes) but produces three Phase-1-only artifacts:

1. **No fixed dimensions** — when Wave 4 hydrates real components
   (Jupyter ~400px+ tall code editor + output panel; NnViz ~400px
   network diagram canvas; AgentFlow ~400px graph layout), the layout
   shifts dramatically. Gatekeeper 2026-05-02 smoke #10 explicit
   requirement: "zero layout shift after hydration".
2. **No visual distinction** — placeholder is a plain `<div>` with text;
   user can't visually identify "this is a block that will load".
3. **No skeleton state** — heavy bundles (block-jupyter Pyodide ~10MB,
   block-nn-viz TF.js ~3MB, block-agent-flow React Flow ~500KB) take
   measurable time to load on slow networks; static placeholder gives
   no progress feedback. Network failure path is also unspecified.

Wave 3 close ADR-0013 D3 deferred mitigation to Wave 4 (ADR-0014):
- "client:only wrapper components for runtime heavy-block rendering with SSR-safe stubs"
- "skeleton loading states matching the SSR placeholder dimensions to avoid layout shift on hydration"

Gatekeeper 2026-05-02 directive (smoke #10) further mandates:
- Unified wrapper pattern (NOT per-heavy-block ad-hoc) for plugin-extensible future blocks
- Fixed dimensions per kind (initial: jupyter 600×400 / nn-viz 500×400 / agent-flow 600×400; final values via plan-challenger)
- Visual skeleton (card border + dim placeholder + spinner / "Loading <kind>..." text)
- Dimensions match real block (zero layout shift after hydration)

Wave 3 Stage C C3 also surfaced (R-during-EXECUTE) that Astro's static
build is ESM-only; the 3 heavy block runtime deps (Pyodide / TF.js /
React Flow) use CommonJS `require()`, so SSR via Astro static is
infeasible. The 3 heavy blocks DO have `*.astro` SSR variants
(`packages/block-{jupyter,nn-viz,agent-flow}/src/ui-default/*.astro`)
that emit lightweight HTML markup, but these are not consumed by
`apps/site/src/components.ts` — the MDX renderer expects React
components, not Astro components.

Plan-challenger codex round (2026-05-03; absorbtion table at end of ADR)
raised 12 challenges (7 high-strength) covering package ownership,
dimensions ownership, API surface, CSS ownership, consumer surface
(MDX vs editor split), and operational concerns (unmount guards,
a11y, retry, type strategy, dead-dep). All 12 absorbed; D-list below
reflects post-absorbtion state.

## Decision

apps/site Wave 4 heavy-block consumption uses a unified
`HeavyBlockBoundary` React wrapper component, hosted in a new
`@skb/heavy-block-boundary` package, applied at the apps/site MDX
componentsMap layer (NOT at editor NodeView path; see D9).

### D1 — Component API

```typescript
import type { ComponentType, ReactNode } from 'react';

// Open extension point: closed for known kinds, branded type for plugins.
export interface HeavyBlockKindRegistry {
  readonly jupyter: 'jupyter';
  readonly 'nn-viz': 'nn-viz';
  readonly 'agent-flow': 'agent-flow';
}
export type HeavyBlockKind =
  | keyof HeavyBlockKindRegistry
  | (string & { readonly __heavyBlockKind?: never });  // intentional widening

export interface HeavyBlockDimensions {
  readonly width: number;       // CSS px; min-width
  readonly height: number;      // CSS px; min-height
}

export interface HeavyBlockBoundaryProps<P> {
  readonly kind: HeavyBlockKind;
  readonly dims: HeavyBlockDimensions;
  readonly load: (init?: { signal?: AbortSignal }) => Promise<{ default: ComponentType<P> }>;
  readonly loadingText?: string;          // default: `Loading ${kind}...`
  readonly errorText?: string;            // default: `Failed to load ${kind}`
  readonly retryLabel?: string;           // default: `Retry`
  readonly maxRetries?: number;           // default: 2 (after which retry button disables; per C5 bounded)
  readonly childProps: P;                 // forwarded to loaded component
  readonly fallback?: ReactNode;          // optional override of SSR placeholder
  readonly onLoadError?: (e: unknown, attempt: number) => void;  // telemetry hook
}
```

Generic `<P>` parameter preserves type safety on `childProps`.
Branded-type widening for `HeavyBlockKind` keeps known-kind autocomplete
while allowing third-party plugin kinds (per C6 absorbtion).

### D2 — SSR rendering (matches HTML byte-for-byte to hydrated first paint)

```html
<div
  data-block="<kind>"
  data-deferred="wave-4"
  class="heavy-block-skeleton heavy-block-skeleton--<kind>"
  role="status"
  aria-busy="true"
  style="width:<W>px;min-height:<H>px;..."
>
  <div class="heavy-block-skeleton__frame" aria-hidden="true"></div>
  <div class="heavy-block-skeleton__spinner" aria-hidden="true"></div>
  <div class="heavy-block-skeleton__text" aria-live="polite">{loadingText}</div>
</div>
```

`min-height` (not fixed `height`) so post-hydration content can grow
without re-shrinking. CSS uses `prefers-reduced-motion` query to skip
spinner animation. Per C2 absorbtion: `role='status'` + `aria-busy`
on container; `aria-live='polite'` ONLY on text element (so dynamic
loadingText/errorText changes are announced; static initial render is
NOT — `polite` queues until next a11y idle).

### D3 — Hydration behavior + lifecycle (per C1 + C5 absorbtion)

Pure React `useEffect` + `useState` + `AbortController` pattern:

1. SSR render = D2 skeleton (matches client first-paint byte-for-byte
   → no hydration mismatch warning)
2. `useEffect` (mount): create `AbortController`; call
   `load({ signal: controller.signal })`; track `attempt` count.
3. **Mount-guard**: a `mountedRef` (or equivalent) ignores late
   resolve/reject after unmount. Late settlement is a no-op (NOT a
   `setState` on unmounted component).
4. On resolve: `setComponent(LoadedComponent)`; clear `aria-busy`.
5. On reject (`!signal.aborted`): set error state; render error
   affordance with retry button (up to `maxRetries`); call
   `onLoadError(err, attempt)` for telemetry.
6. On unmount: `controller.abort()` to cancel in-flight `load()` if
   the implementation honors AbortSignal.
7. On retry click: increment attempt; new AbortController; re-call
   `load({ signal })`. Skeleton state restored during retry.
8. After `maxRetries` exhausted: retry button disabled; error
   announcement persists; user can manually navigate or refresh.

Render: `<LoadedComponent {...childProps} />` inside same outer `<div>`
(preserves `data-block` + dimensions for layout stability) once load
resolves. **No Astro `client:only` directive needed** — this is pure
React lazy loading inside MDX componentsMap (which is React-only by
Astro design).

### D4 — Plugin extensibility (per Q5 + C3 absorbtion: split surface)

**MDX/static render path scope**: `HeavyBlockBoundary` wraps a heavy
block's `RenderView` so that any apps/site MDX consumer or future
static page consumer gets the boundary for free.

**Editor (Tiptap NodeView) path scope**: editor consumes the heavy
block's `EditorView` directly per `editor-shell` registration —
**does NOT pass through HeavyBlockBoundary by default**. Editor has
different lifecycle (mount/unmount on document edits; user explicitly
opens a heavy block; no SSR concern). If editor wants the boundary
semantics for first-mount lazy load, it opts in by wrapping its
`EditorView` registration manually.

Each heavy block package exports both:
- `<Kind>RenderView` — the renderer (may be wrapped externally by
  consumer using `HeavyBlockBoundary`)
- `<Kind>EditorView` — the editor NodeView (stays unwrapped unless
  caller opts in)

Future heavy block packages (e.g., `@skb/block-3d-graph`) contribute:
- `<Kind>RenderView` (heavy)
- `heavyBoundaryDimensions: HeavyBlockDimensions` (per Q2 absorbtion;
  see D5)
- Optional pre-wrapped helper export `<Kind>RenderViewWithBoundary`
  for consumers that want a one-liner

apps/site composition continues to be the integration point for the
3 first consumers: `apps/site/src/components.ts` componentsMap.

### D5 — Dimensions ownership (per Q2 absorbtion)

**Per-block declaration** (each heavy block ui-default package owns
the value):

```typescript
// packages/block-jupyter/src/ui-default/jupyter.ui.ts
export const heavyBoundaryDimensions: HeavyBlockDimensions = {
  width: 600,
  height: 400,
};
```

**apps/site consumption**:

```typescript
// apps/site/src/components.ts
import { heavyBoundaryDimensions as jupyterDims } from '@skb/block-jupyter/ui-default';
import { JupyterRenderView } from '@skb/block-jupyter/ui-default';
// ... etc for nn-viz / agent-flow

const Jupyter = (props: JupyterProps) => (
  <HeavyBlockBoundary
    kind="jupyter"
    dims={jupyterDims}
    // Adapter wraps the named `JupyterRenderView` export into the
    // `{ default }` shape the D1 `load` contract requires (heavy block
    // ui-default barrels export named RenderViews only, not defaults).
    load={() => import('@skb/block-jupyter/ui-default').then((m) => ({ default: m.JupyterRenderView }))}
    childProps={props}
  />
);
```

**Initial defaults** (consumed at Wave 4 Stage A; later subject to UX iteration):

| kind | width | height (min) | rationale |
|---|---|---|---|
| jupyter | 600 | 400 | code editor + output panel + Run button row |
| nn-viz | 500 | 400 | TF.js network diagram canvas |
| agent-flow | 600 | 400 | React Flow graph layout |

These initial values live in each heavy block's `ui-default` export
(NOT in this ADR or in the boundary package). ADR-0014 owns only the
authoritative *policy* (per-block exports; boundary package consumes
via prop), not specific pixel numbers. Plan-challenger absorbtion Q2
specifically guards against single-source-of-truth drift.

### D6 — Skeleton visual + CSS (per Q4 absorbtion)

CSS is **co-located in `@skb/heavy-block-boundary`** package, exported
as a single CSS asset (`heavy-block-skeleton.css`). It consumes ONLY
CSS custom properties from `@skb/design-tokens` — **no hard-coded
palette values**.

```css
.heavy-block-skeleton {
  border: 1px solid var(--skb-color-border, #e5e7eb);
  background: var(--skb-color-skeleton-bg, #f9fafb);
  border-radius: var(--skb-radius-md, 0.5rem);
  position: relative;
  display: grid;
  place-items: center;
}
.heavy-block-skeleton__spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--skb-color-spinner-track, #e5e7eb);
  border-top-color: var(--skb-color-spinner-fg, #3b82f6);
  border-radius: 50%;
  animation: skb-spinner 1s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .heavy-block-skeleton__spinner { animation: none; }
}
.heavy-block-skeleton__text {
  margin-top: 0.5rem;
  color: var(--skb-color-text-secondary, #6b7280);
  font-size: var(--skb-font-size-sm, 0.875rem);
}
@keyframes skb-spinner { to { transform: rotate(360deg); } }
```

Fallback values in `var(...)` are minimal hex defaults to allow the
package to render meaningfully without `@skb/design-tokens` injected
(but inheriting tokens is the canonical path). Stage A may add new
tokens to `@skb/design-tokens` if needed; that contribution is logged
in design-tokens/CONTRACT.md.

### D7 — Package ownership (per Q1 absorbtion)

**NEW package: `@skb/heavy-block-boundary`** (NOT in `block-foundation`).

Rationale:
- `block-foundation` today has zero React deps (only types/registry).
  Adding a React component changes its shape + dep family. Plan-challenger
  Q1 confirmed lean.
- `apps/site` is wrong host for a reusable runtime boundary that
  future plugin blocks need.
- New package isolates the runtime concern + can be marked `peer` dep
  on React for environments not bundling apps/site (e.g., editor-only
  consumers, third-party block packages).

Package shape (Stage A authoring):
- `packages/heavy-block-boundary/package.json` — `peerDependencies:
  { react: ">=18", react-dom: ">=18" }`; optional `@skb/design-tokens`
  for CSS variable inheritance
- `packages/heavy-block-boundary/CONTRACT.md` — public surface (the API
  defined in D1) + invariants (SSR/hydration byte-equivalence, mount
  guard, retry semantics, etc.)
- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` —
  implementation
- `packages/heavy-block-boundary/src/heavy-block-skeleton.css` — D6 CSS
- `packages/heavy-block-boundary/src/__tests__/` — vitest + React
  Testing Library

### D8 — Migration of 3 existing heavy blocks (Stage A scope)

Stage A PRs migrate `apps/site/src/components.ts` to consume the
boundary:

```typescript
// REPLACE:
//   Jupyter: asMdxComponent(makeHeavyBlockPlaceholder('jupyter')),
//   NnViz: asMdxComponent(makeHeavyBlockPlaceholder('nn-viz')),
//   AgentFlow: asMdxComponent(makeHeavyBlockPlaceholder('agent-flow')),
// WITH:
import { HeavyBlockBoundary } from '@skb/heavy-block-boundary';
import {
  JupyterRenderView,
  heavyBoundaryDimensions as jupyterDims,
} from '@skb/block-jupyter/ui-default';
// ... etc

const Jupyter: ComponentType<FlatProps> = (props) => (
  <HeavyBlockBoundary
    kind="jupyter"
    dims={jupyterDims}
    load={() => import('@skb/block-jupyter/ui-default').then((m) => ({ default: m.JupyterRenderView }))}
    childProps={props}
  />
);
```

The `*.astro` variants in `packages/block-{jupyter,nn-viz,agent-flow}/src/ui-default/*.astro`
remain available for direct Astro page integration (orphan today;
formal Astro consumer integration is C4a/C4b carry-over from Wave 3).

### D9 — Editor consumer scope (per C3 absorbtion: explicit non-coverage)

Editor (Tiptap NodeView) consumption of heavy blocks is **out of scope**
for ADR-0014. `editor-shell` continues to register heavy block
`EditorView` exports directly (per Wave 3 A3 registerBlocks pattern,
unchanged). Reasons:

- Editor lifecycle differs from MDX render path (mount/unmount on doc
  edits; user explicitly clicks a heavy block to open it).
- Editor has no SSR concern (Astro doesn't render the editor).
- Layout-shift concern is moot (editor canvas has its own layout
  authority).
- If a future requirement emerges to lazy-load heavy blocks in
  editor too, that's a separate ADR (ADR-0014 amendment or ADR-0015).

block-foundation/CONTRACT.md W4-1 (added by this PR) explicitly scopes
the boundary to "MDX componentsMap consumption" so editor symmetry
isn't accidentally broken.

## Acceptance criteria (Wave 4 Stage A implementation must satisfy)

Per C4 + C5 absorbtion, hardened test matrix:

1. **Component lives in single package**: `@skb/heavy-block-boundary`
   per D7 (NOT `block-foundation`).
2. **Type-safe API**: `HeavyBlockBoundary<P>` props per D1; vitest type
   test (or `tsc --noEmit` on a fixture) verifies generic `P` + branded
   `HeavyBlockKind` widening.
3. **SSR/hydration byte-equivalence (C4 #1)**: vitest test renders
   component to string with React's `renderToString`; asserts initial
   client mount produces identical DOM (no hydration mismatch warning
   per React's `consoleError` mock). Skeleton CSS classes + `data-*`
   attributes + dimensions match exactly.
4. **Exact CSS class/size/style at first paint (C4 #2)**: vitest +
   `getBoundingClientRect()` (or DOM string match with `style="..."`)
   asserts width/min-height set per `dims` prop.
5. **No width/height regression at T0/T1 (C4 #3, gatekeeper smoke #10
   layout-shift core mandate)**: playwright spec compares
   `getBoundingClientRect()` immediately after first render (T0) vs
   after hydration completes (T1, awaited via `data-loaded` attribute
   or similar). Allowed delta: `<= 5px` for spinner→content
   transition; outer container width must be IDENTICAL.
6. **Successful load path (C4 #4a)**: vitest test simulates fast
   `load()` resolve; asserts `<LoadedComponent {...childProps} />`
   renders with `data-loaded="true"` after `useEffect` settles.
7. **Rejected load path (C4 #4b + C5)**: vitest test simulates
   `load()` reject; asserts error UI renders with retry button + error
   text + `aria-busy="false"` + `onLoadError(err, 1)` called.
8. **Retry path (C5)**: vitest test clicks retry button; asserts new
   `load()` invocation with NEW AbortSignal + skeleton restored
   between attempts + `attempt` count incremented in `onLoadError`.
9. **`maxRetries` bound (C5)**: vitest test rejects N+1 times where
   N=`maxRetries`; asserts retry button disabled + telemetry call
   for each attempt. Default `maxRetries=2` honored.
10. **Mount guard (C1)**: vitest test mounts component; calls
    `unmount()` BEFORE `load()` resolves; asserts no React state
    update warning + no `setState` after unmount.
11. **AbortSignal propagation (C1)**: vitest test verifies `load()` is
    called with `{ signal }` arg + `signal.aborted=true` after unmount.
12. **A11y semantics (C2)**: vitest test asserts `role="status"` +
    `aria-busy="true"` (during load) → `aria-busy="false"` (after).
    `aria-live="polite"` only on text element. Spinner `aria-hidden`.
13. **Plugin extensibility test (D4)**: vitest test wraps a fake
    heavy block via the API + verifies skeleton + load flow for an
    unregistered branded kind (e.g., `kind: '3d-graph'`).
14. **prefers-reduced-motion handled**: vitest CSS-in-JS test asserts
    `@media (prefers-reduced-motion: reduce)` rule present + spinner
    animation disabled in matching env.
15. **Dimensions sourced from heavy block (D5)**: contract test
    confirms `apps/site/src/components.ts` imports
    `heavyBoundaryDimensions` from each heavy block package (NOT
    inline literals).

## Consequences

### Positive
- Zero layout shift between SSR and hydrated state (gatekeeper smoke #10 closed)
- Visual clarity (user sees "this is a block")
- Plugin-extensible to future heavy blocks (per gatekeeper directive + Q5 absorbtion)
- Phase 1 + Phase 2 chunking (`apps/site/astro.config.mjs` `manualChunks`) unchanged; HeavyBlockBoundary uses dynamic `import()` which Vite respects
- Pure React; no Astro `client:only` directive needed (compatible with MDX componentsMap)
- Network failure UX is first-class (retry + telemetry; per C5)
- Mount guard prevents stale-resolve setState bugs (per C1)
- A11y semantics follow MDN/WAI-ARIA loading-region best practices (per C2)
- Editor consumer surface remains unchanged (per C3); D9 explicit out-of-scope language

### Negative
- New package surface (`@skb/heavy-block-boundary`) — increments workspace count from 21 → 22
- New W4-1 invariant in `block-foundation/CONTRACT.md` (cross-package surface contract)
- Each heavy block package gains 1 export (`heavyBoundaryDimensions`); minor surface additions
- CSS authoring co-located in new package (acceptable per Q4)

### Neutral / explicit acknowledgements
- Does NOT change ADR-0009 BlockKind union; `viz` kind unchanged
- Does NOT change MDX componentsMap injection mechanism (still pure React per Astro design)
- Does NOT use Astro `client:only` directive (incompatible with MDX static componentsMap)
- Does NOT replace `*.astro` variants in heavy block packages (those remain available for direct Astro integration when not in MDX context)
- Does NOT mandate editor NodeView wrap (D9 out-of-scope)

## Alternatives considered

### A. block-foundation hosts HeavyBlockBoundary

Rejected per Q1: block-foundation has zero React deps; adding a React
component changes its shape + introduces React peer-dep. Forks separate
"heavy block runtime" concern from "block schema/registry" concern.

### B. apps/site hosts HeavyBlockBoundary (no new package)

Rejected per Q1: localizes to consumer; breaks plugin-extensibility
intent. Each future heavy block consumer would re-author the boundary.
New package is the right shape per gatekeeper directive
"为未来插件 / 新 block 类型快速接入预留".

### C. Astro client:only on `<Jupyter.astro>` directly

Rejected: requires bridging from MDX componentsMap (React) to Astro
components — non-trivial in current Astro architecture. Pure-React
HeavyBlockBoundary path is more idiomatic for MDX consumers.

### D. React.lazy + Suspense (idiomatic)

Rejected per Q3: doesn't integrate cleanly with the SSR-skeleton-must-
match-byte-for-byte constraint, and gives less control over retry +
mount-guard semantics. Custom useEffect/useState + AbortController
pattern is the right shape for our constraints. Suspense remains
viable as a future internal refactor if React server components or
streaming SSR semantics evolve.

### E. Centralized `dimensions` map in ADR or boundary package

Rejected per Q2: single-source-of-truth violation; drifts as widths
change. Per-block ownership (D5) keeps invariant in the natural place
(each block knows its own ideal dimensions).

### F. Open `string` HeavyBlockKind type

Rejected per C6: effectively `string`, loses autocomplete on known
kinds. Branded-type widening (D1) preserves both compile-time
autocomplete AND plugin extensibility.

## Compliance

- **ADR-0008 D1 dead-dep** (per C7 absorbtion): `@skb/heavy-block-boundary`
  is declared `dependencies` of `apps/site` (Stage A) AND each heavy
  block package's `peerDependencies` if the package exports
  pre-wrapped helpers. Stage A PR must include explicit dead-dep
  evidence (codex-structure-auditor scan; `TOTAL_VIOLATIONS 0` in audit
  log). Bundle-impact analysis via codex-perf-auditor at C5 baseline.
- **ADR-0009 BlockKind**: `viz` kind unchanged.
- **ADR-0011 D6 + D7**: this PR is bootstrap-flavored doc-only ADR (no
  codex EXECUTE; orchestrator-self per Pre-B1 + Pre-A1 precedent).
  Plan-challenger codex round dispatched 2026-05-03; 12 challenges
  absorbed (table at end of ADR per R13).
- **ADR-0011 D2 (v0.1.1 SOTed-PR.md)**: per-block dimensions ownership
  (D5) is canonical in each ui-default package; ADR-0014 references
  rather than duplicates.
- **block-foundation/CONTRACT.md**: gains W4-1 invariant; no other
  CONTRACT.md change.
- **`docs/decisions/README.md` index**: refreshed in this PR to add
  ADR-0011, ADR-0012, ADR-0013, ADR-0014 entries (closes Wave 3
  retrospective structure-baseline §5 stale-index gap per C7).

## Related

- [ADR-0009](ADR-0009-block-kind-union-expansion.md) — BlockKind 4-way union (`viz` kind context)
- [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) — D1 pipeline (this ADR follows D1)
- [ADR-0013 D3 Wave 4 deferred items](ADR-0013-wave-3-close.md) — explicit authorization for ADR-0014
- [Wave 3 close structure baseline §5](../audits/structure-2026-05-wave-3-close.md) — README index gap (this PR closes by adding 0011-0014 entries)
- [apps/site/src/components.ts:32-52](../../apps/site/src/components.ts) — Wave 3 C3 placeholder being replaced
- [packages/block-jupyter/src/ui-default/Jupyter.astro](../../packages/block-jupyter/src/ui-default/Jupyter.astro) — existing SSR variant (orphan; for direct Astro page consumers)
- memory `feedback_pagefind_query_substring` (orchestrator-local at `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/`) — gatekeeper 2026-05-02 directive context (smoke #10 prelude)

## Plan-challenger codex absorbtion (locked at lock-time)

per [ADR-0007 D5](ADR-0007-job-function-codex-heavy-execution.md) +
[ADR-0011 D2](ADR-0011-linear-pipeline-execution-model.md) v0.1.1
SOTed-PR.md amendment + memory `feedback_soted_pr_md_discipline.md` +
ADR-0013 D4 R13.

dispatch: `codex exec --yolo --profile plan-challenger ...` (Wave 4
Pre-A2; 12 challenges + 7 high-strength + Recommend NOT lock as-is).
Audit log: `/tmp/codex-runs/2026-05-03-Pre-A2-plan-challenge.txt` raw +
`docs/audits/codex-runs/2026-05-03-Pre-A2-plan-challenge.txt` archive.

| # | Challenge | Verdict | Reason |
|---|---|---|---|
| Q1 | Package ownership: `@skb/heavy-block-boundary` (NEW) vs `block-foundation` vs `apps/site` | **ABSORBED** | New package per D7. block-foundation stays React-free; apps/site-only weakens plugin extensibility. |
| Q2 | Dimensions per kind: hardcode in ADR vs per-block exports | **ABSORBED** | Per-block exports per D5. ADR keeps policy + initial defaults; values live with the block (canonical SOT). |
| Q3 | API shape: useEffect/useState (custom) vs React.lazy + Suspense | **ABSORBED** | useEffect/useState per D1+D3. Better SSR byte-equivalence + retry/error control. Suspense out of scope for Wave 4. |
| Q4 | CSS ownership: package-local vs design-tokens | **ABSORBED** | Package-local CSS in `@skb/heavy-block-boundary` per D6, consuming design-token CSS variables (no hard-coded palette). |
| Q5 | Consumer surface: apps/site wraps all 3 vs split RenderView/EditorView | **ABSORBED** | Split per D4 + D9. RenderView wrappable; EditorView stays unwrapped. Apps/site is integration point for first 3 consumers; future plugin blocks export their own pre-wrapped helpers. |
| C1 | Promise resolves after unmount → setState bug | **ABSORBED** | D3 mount-guard + AbortController. Late settlement no-op. AC test #10+#11 cover. |
| C2 | A11y: aria-live needs discipline | **ABSORBED** | D2 + D6: `role='status'` + `aria-busy` on container; `aria-live='polite'` on text only; spinner `aria-hidden`. AC #12 covers. |
| C3 | Editor (Tiptap NodeView) interaction | **ABSORBED** | D9 explicit out-of-scope. Editor stays unwrapped; D4 split codifies. block-foundation/CONTRACT.md W4-1 scopes to MDX/static path. |
| C4 | Test assertions too coarse | **ABSORBED** | AC#3-#15 hardened: SSR/hydration byte-eq (#3), exact CSS/dims (#4), T0/T1 rect (#5), success/reject paths (#6+#7), retry (#8), maxRetries bound (#9), mount guard (#10), AbortSignal (#11), a11y (#12), plugin (#13), reduced-motion (#14), dims source (#15). |
| C5 | Network failure / retry behavior | **ABSORBED** | D1 props (`maxRetries` default 2 + `retryLabel` + `errorText` + `onLoadError`) + D3 retry flow. Bounded attempts. AC#7-#9 cover. |
| C6 | HeavyBlockKind type widens to string | **ABSORBED** | D1 branded-type widening: `keyof Registry \| (string & { __heavyBlockKind?: never })`. Preserves autocomplete + extensibility. |
| C7 | Bundle impact / dead-dep evidence + README index gap | **ABSORBED** | Compliance: explicit ADR-0008 D1 evidence required at Stage A; codex-structure-auditor + codex-perf-auditor dispatched. README.md index refreshed in THIS PR (Pre-A2). |

**Result**: 12/12 challenges absorbed. ADR rev v0.1 → v0.2 between
plan-challenger dispatch and lock; this is the v0.2 prose. No
challenge rejected; orchestrator did not push back on plan-challenger
verdict.

**Lock evidence**: this absorbtion table + each verdict cross-references
the D-list section that codifies the change. Reviewers verify by walking
each row's "Reason" link to the corresponding D-section.

## Amendments

### v0.2.1 (2026-05-03) — Status promoted `proposed → accepted` at Stage A close

Per Wave 4 plan Stage A close criterion #1 + gatekeeper directive
2026-05-03 #3. The A1-A7 implementation arc was reviewed against
ADR-0014 v0.2 D-list (D1-D9) and acceptance criteria (AC#1-#15) at A8
(this PR); the walkthrough is recorded in
[docs/plans/wave-4-main/A8-perf-chunking-adr-0014-promote.md](../plans/wave-4-main/A8-perf-chunking-adr-0014-promote.md)
`## Pre-promotion review` section. All D1-D9 + AC#1-#15 satisfied; no
inconsistencies surfaced; promotion authorized in-scope for this PR.

Implementation PRs (squash HEADs):

| PR | Squash HEAD | Subject |
|---|---|---|
| #31 | `f765968` | A1 — `@skb/heavy-block-boundary` package shell (D7 + D1 placeholder body) |
| #32 | `1d2f324` | A2 — D3 hydration lifecycle (mount + AbortController + mount-guard); AC#1/#2/#3/#6/#10/#11 |
| #33 | `92c8751` | A3 — D3 retry flow (retry button + maxRetries + onLoadError); AC#7/#8/#9 |
| #34 | `5f360a6` | A4 — D6 CSS + D2 a11y polish + prefers-reduced-motion + CONTRACT.md invariants consolidated; AC#4/#12/#13/#14 |
| #35 | `59a93c0` | A5 — D5 dimensions ownership + D8 apps/site migration; AC#15 |
| #36 | `95ba33b` | A6 — playwright T0/T1 zero-layout-shift CI test (CI-only); AC#5 |
| #37 | `87d0b32` | A7 — Wave 3 C4a/C4b carry-over: 5 .astro variants direct-Astro consumer page; no NEW AC |
| #TBD | TBD | A8 — this PR: Stage A close, perf baseline, Phase 2 chunking decision, and status promotion |

Stage A close gates:

1. ✅ ADR-0014 status `proposed → accepted` (this Amendment + line 5 flip).
2. ✅ A6 playwright zero-layout-shift PASS (PR #36 `95ba33b`; no A8 source regression).
3. ✅ A2 + A3 core implementation + retry semantics stable through A4-A7.
4. ✅ A7→A8 Pre-promotion review checkpoint completed in this PR.md; verdict: no inconsistencies.

Phase 2 chunking decision at A8 (informational; no D-list change): **NO-OP**. Codex-perf-auditor
baseline (2026-05-03) found no `@skb/heavy-block-boundary` leak into
prose-only JS chunks. apps/site/astro.config.mjs unchanged. Evidence:
[docs/audits/perf-2026-05-03.md](../audits/perf-2026-05-03.md).

### v0.3 (2026-05-04; Wave 4 Stage B B7) — Production Astro hydration integration (NEW D10 + AC#16); closes the AC#1-#15 vitest-only coverage gap

**Gap surfaced post-Stage-A** (gatekeeper smoke 2026-05-03; verified by 4 independent evidence pieces): Stage A delivered AC#1-#15 (all vitest/jsdom unit tests + 1 playwright comparing SSR-skeleton T0 vs T1 on the same skeleton state) but missed the **production Astro hydration wiring**. The 3 heavy block entries in `apps/site/src/components.ts` componentsMap were pure React functions returning `createElement(HeavyBlockBoundary, ...)`. Astro's MDX integration renders these SSR-only by default — without an Astro `client:*` directive on each consumer site, the React tree never hydrates → `useEffect` never fires → `load()` never invokes → `<LoadedComponent>` never replaces the skeleton → **forever-loading skeleton** at runtime.

**Why ADR-0014 v0.2 missed this**: D8 specified the *import* wiring (componentsMap consumes `XxxRenderView` via dynamic import) but did NOT specify *which Astro directive* the componentsMap entry must use. AC#1-#15 verified the React component contract in isolation; no AC required end-to-end Astro page → MDX → componentsMap → React island → useEffect → load() → real-component-rendered chain. The 12/12 plan-challenger absorbtion at Pre-A2 focused on React API + a11y + plugin extensibility; no challenge surfaced the Astro integration layer.

**Mitigation locked at B7** (per user-accepted orchestrator proposal 2026-05-04):

- 3 NEW per-kind React island wrappers at `apps/site/src/islands/{JupyterIsland,NnVizIsland,AgentFlowIsland}.tsx` — each closure-captures its kind literal + `dims` import + `load` arrow function dynamic-importing the corresponding `XxxRenderView`. The closure pattern keeps `load` (a function value) inside the island module so it does NOT cross the Astro island prop-serialization boundary (Astro island props are JSON-serialized).
- 3 NEW Astro wrappers at `apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro` — each renders `<JupyterIsland client:load {...Astro.props} />` etc. The `client:load` directive (NOT `client:only`) is correct because:
  - SSR HTML still emits the D2 skeleton (preserves zero-layout-shift AC#5 baseline)
  - Client hydrates the same React tree → useEffect runs → load() invokes
  - `client:only="react"` would have skipped SSR entirely — breaks AC#5
- `apps/site/src/components.ts` componentsMap heavy-kind entries (Jupyter / NnViz / AgentFlow) now reference the 3 NEW Astro wrappers. The 5 light blocks (Callout / Code / Image / Math / Pdf) continue with the React MdxAdapter pattern unchanged. `makeMdxAdapter` re-exported so islands can wrap their respective RenderViews.
- Per-kind island location in `apps/site/src/islands/` is **apps-local** (not added to `@skb/heavy-block-boundary` package) per user directive — keeps the boundary package generic + extensible to future plugin blocks without binding it to apps/site's specific block roster.

### D10 — Production Astro hydration integration (NEW; ADR-0014 v0.3)

componentsMap entries for the 3 heavy kinds (Jupyter / NnViz / AgentFlow) MUST be Astro wrappers using `client:load` directives, with per-kind React island wrappers in `apps/site/src/islands/` owning the dynamic `import()` + `dims` + `kind` literal closure. Direct React-function entries are forbidden for heavy kinds because Astro's MDX integration renders them SSR-only without `client:*`, breaking the hydration boundary that ADR-0014 D3 specifies.

The `client:load` directive is canonical (NOT `client:only`) because:
- D2 SSR skeleton must emit byte-identical to client first paint (AC#3) — `client:load` preserves SSR; `client:only` skips it
- AC#5 zero-layout-shift requires SSR skeleton dimensions match post-hydration content — `client:load` allows the comparison

Future heavy block packages adding Astro hydration must follow this pattern: ship `apps/site/src/islands/<Kind>Island.tsx` + `apps/site/src/components/<Kind>.astro` consumers in apps/site, OR (alternative path; deferred to future ADR) ship pre-wrapped Astro consumers in the heavy block package itself.

### AC#16 (NEW; ADR-0014 v0.3) — Production hydration end-to-end assertion

**Production hydration integration**: playwright spec exercising the live `apps/site/notes/sample-blocks` route (or sample-blocks-astro consumer if that's the integration surface) MUST poll for evidence of hydration completion on each heavy block surface — either `aria-busy='false'` (HeavyBlockBoundary clears the skeleton's busy state on successful load) OR `data-loaded='true'` (if a future load-completion attribute lands) OR equivalent ARIA / data-attribute signal. The spec MUST fail if any heavy block surface remains in the SSR skeleton state past a reasonable timeout (e.g., 30 seconds for slow Pyodide / TF.js / React Flow loads).

WSL2 chromium skip pattern (per memory `feedback_wsl2_chromium_launch.md`) preserved — AC#16 runs CI-only.

**Implementation evidence** (B7 squash HEAD TBD; this Amendment ratifies):

| Item | File | Verification |
|---|---|---|
| 3 React islands | `apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx` | grep export default per file |
| 3 Astro wrappers | `apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro` | grep `client:load` per file |
| componentsMap rewired | `apps/site/src/components.ts` | grep 3 imports from `'../components/Jupyter.astro'` etc. |
| AC#16 playwright spec | `apps/site/playwright/heavy-block-layout-shift.spec.ts` | grep `aria-busy` polling assertion |
| apps/site CONTRACT clause | `apps/site/CONTRACT.md` | grep "production hydration boundary" |

**Stage A close gates re-evaluation**: gates 1-4 verified at A8 PR.md remain valid; B7 closes the production-runtime gate that was implicit but not explicitly listed. ADR-0014 status remains `accepted` (no status flip; substantive Amendment per B1a v0.1.1 precedent + Pre-A3 plan-challenger Q5 absorbtion that distinguishes substantive Amendments from pure status flips at Row 4 trigger).

**Compliance cross-checks**:
- ADR-0008 D1 dead-dep: 3 NEW island files + 3 NEW Astro wrappers all consume existing workspace deps (`@skb/heavy-block-boundary` + `@skb/block-{jupyter,nn-viz,agent-flow}/ui-default`); no new dep additions.
- ADR-0011 D6 + D7: this Amendment is bootstrap-flavored doc-only by orchestrator (matches Pre-B1 + ADR-0014 v0.2.1 + B1a v0.1.1 precedent); code parts handled by codex-generic-executor.
- block-foundation/CONTRACT.md W4-1 invariant: scope unchanged (MDX componentsMap consumption); D10 codifies the Astro wrapper layer that mediates between componentsMap and the React boundary.

### v0.4 (2026-05-04 — Wave 5 Stage C.1) — Plugin tier split: placeholder (Wave 5 MVP) vs real-runtime (Phase 2+)

**Gap framing**: Wave 5 reframe v2 (memory
`project_wave4_reframe_v2.md`, 2026-05-03 gatekeeper directive)
supersedes Wave 4's MVP target. The MVP path no longer requires real
Pyodide / TF.js / React Flow execution at first paint. The 3 heavy block
surfaces show a static "🔌 plugin" placeholder, while real runtime
restoration moves to Phase 2+ under a future `plugin-real-runtime` tier
amendment.

#### NEW D11 — Plugin tier split

`HeavyBlockBoundary` remains the future boundary for the
`plugin-real-runtime` tier: it dynamic-imports a heavy package's
`RenderView`, hydrates Pyodide / TF.js / React Flow as needed, and
eventually swaps skeleton state for the real component. Wave 5 ships
only the `plugin-placeholder` tier: a static React shell rendered
server-side through the existing Astro wrappers and hydrated as a no-op
with `client:load`, so the D10 SSR / hydration boundary stays intact.

The boundary package (`@skb/heavy-block-boundary`) remains installed,
and `apps/site/src/components.ts` continues importing
`@skb/heavy-block-boundary/heavy-block-skeleton.css` because the
placeholder tier reuses the shared shell and the future real-runtime
tier will reuse it immediately. Placeholder surfaces emit
`aria-busy='false'` and `data-loaded='true'` on initial SSR, with no
intermediate busy state. Reactivating the `plugin-real-runtime` tier
reintroduces the `HeavyBlockBoundary` wrapper (parametrized over
`FlatProps`) around the real dynamic import; the 3 island files are
the conditional tier surface, by environment flag or by a later PR.

#### AC#16 carve-out for the placeholder tier

The original AC#16 production hydration contract remains authoritative
for the `plugin-real-runtime` tier: real runtime loading must exercise
the `aria-busy='true'` to `aria-busy='false'` transition, or an
equivalent data/ARIA completion signal, on the live Astro route. Wave 5
`plugin-placeholder` satisfies AC#16 by emitting `aria-busy='false'`
and `data-loaded='true'` on initial SSR. The existing
`apps/site/playwright/heavy-block-layout-shift.spec.ts` AC#16 poll
(`ariaBusy === 'false' || outerLoaded === 'true' || loadedDescendants > 0`)
therefore passes immediately for the placeholder tier. The Phase 2+
`plugin-real-runtime` tier must exercise the full transition again when
the boundary returns.

#### Visual contract

The placeholder shell reuses `.heavy-block-skeleton` plus
`.heavy-block-skeleton--{kind}` from
`@skb/heavy-block-boundary/heavy-block-skeleton.css`, preserving the
v0.3 layout baseline. Its content is the emoji `🔌` plus the label
`{KindLabel} · plugin runtime (Phase 2+)`. The new BEM modifier
`.heavy-block-skeleton--placeholder` is reserved for future Stage C.3 /
ADR-0014 v0.5 OKLCH wiring and has no rules at v0.4. Inline `width`
and `minHeight` continue to come from each block package's
`heavyBoundaryDimensions`, so AC#5 zero-layout-shift dimensions are
unchanged.

#### Phase 2+ migration sketch

The island tier switch remains local to
`apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx`:

```tsx
if (FEATURE_PLUGIN_REAL_RUNTIME) {
  return <HeavyBlockBoundary kind={kind} dims={dims} load={load} childProps={props} />;
}
return <PluginPlaceholder kind={kind} dims={dims} />;
```

The real runtime implementation can resurface from Wave 4 B7 history
(squash HEAD `794cd5d`) or from a new PR. Either path is Phase 2+
scope, not Wave 5 C.1 scope.

#### Implementation evidence stub

| Item | Evidence |
|---|---|
| Jupyter placeholder | `apps/site/src/islands/JupyterIsland.tsx` contains `🔌`, `aria-busy='false'`, `data-loaded='true'` |
| NnViz placeholder | `apps/site/src/islands/NnVizIsland.tsx` contains `🔌`, `aria-busy='false'`, `data-loaded='true'` |
| AgentFlow placeholder | `apps/site/src/islands/AgentFlowIsland.tsx` contains `🔌`, `aria-busy='false'`, `data-loaded='true'` |
| ADR v0.4 anchor | grep `Plugin tier split` in this amendment |
| Playwright AC#16 | CI runs `apps/site/playwright/heavy-block-layout-shift.spec.ts`; squash HEAD TBD post-commit |
