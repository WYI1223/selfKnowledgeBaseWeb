# C1 — apps/site MDX components map + BlockRegistry boot (Stage C opener)

> **Wave 3 Stage C 1st PR.** Per locked plan C1 entry (lines 470-510 of
> `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`).
> Closes the apps/site half of the Stage B → Stage C handoff: B-stage gave
> mdx-bridge a working dispatch table for 8 PascalCase component blocks;
> C1 gives apps/site the React-component map needed to actually *render*
> those PascalCase tags when Astro processes a content-collection MDX entry.

## title

Wire `apps/site` to render the 8 PascalCase MDX component-block tags
(`<Callout>` / `<Code>` / `<Image>` / `<Math>` / `<Pdf>` / `<Jupyter>` /
`<NnViz>` / `<AgentFlow>`) via a `componentsMap` exported from
`src/components.ts`, consumed per-page through Astro's
`<Content components={...} />` prop in `pages/notes/[...slug].astro`. Use
`*RenderView` (read-only) — never `*EditorView`. Add 8 `@skb/block-*`
runtime deps to `apps/site/package.json`. Update `CONTRACT.md` consumer
surface. Acceptance: `sample-blocks` MDX (currently `draft: true`) hydrates
its 8 PascalCase tags, and any prose-only route's bundle does NOT pull
`pyodide` / `@tensorflow/tfjs` / `reactflow` symbols (TC3 deferred to C2 —
see "Out-of-scope").

## files

Created (NEW — 2 source/test + 1 self-listed):

- `apps/site/src/components.ts` *(NEW; PascalCase → React component map.
  Exports `componentsMap` constant with exactly 8 keys: `Callout`, `Code`,
  `Image`, `Math`, `Pdf`, `Jupyter`, `NnViz`, `AgentFlow`. Each value is
  the corresponding `*RenderView` import from `@skb/block-<name>/ui-default`
  — never the `*EditorView` (apps/site is statically built + read-only per
  `apps/site/CONTRACT.md` "Static build only" invariant). Type:
  `satisfies Readonly<Record<string, ComponentType<unknown>>>` keyed by canonical
  PascalCase from `sample-blocks/index.mdx`. ~30 LOC.)*
- `apps/site/src/__tests__/components-map.test.ts` *(NEW; vitest. Imports
  `componentsMap` + each `*RenderView` + each `*EditorView` from the 8
  block packages. TC1 + TC2 below. ~60 LOC.)*
- `docs/plans/wave-3-main/C1-apps-site-block-registry.md` *(this PR.md.)*

Modified (4 source/config files + 1 lockfile):

- `apps/site/src/pages/notes/[...slug].astro` — wire the components map at
  the single MDX render point. **R-during-EXECUTE pivot**: static
  top-level `import { componentsMap }` pulled TF.js into Astro SSR build
  (transitive via block-nn-viz); switched to **conditional dynamic
  import** gated by a regex matching the 8 PascalCase tag names. Pattern:
  ```astro
  const componentBlockTag = /<(Callout|Code|Image|Math|Pdf|Jupyter|NnViz|AgentFlow)(\s|>|\/)/;
  const componentsMap = componentBlockTag.test(note.body ?? '')
    ? (await import('../../components')).componentsMap
    : {};
  ```
  Then `<Content components={componentsMap} />`. Prose-only routes get
  empty map (no heavy block deps in their bundle); component-block routes
  load the full map. This effectively pre-implements part of C2's
  tree-shaking deliverable. (Sample-blocks fixture flip stays in C5;
  not C1's job.)
- `apps/site/package.json` — add 8 `@skb/block-*` runtime `dependencies`
  (alphabetically placed): `@skb/block-agent-flow`, `@skb/block-callout`,
  `@skb/block-code`, `@skb/block-image`, `@skb/block-jupyter`,
  `@skb/block-math`, `@skb/block-nn-viz`, `@skb/block-pdf`. All
  `workspace:*`. **Runtime deps** (not devDeps, unlike mdx-bridge B-stage)
  — apps/site bundles them into the static-build output. ADR-0008 D1
  dead-dep tightening passes because every dep has a corresponding
  `import` in `components.ts`.
- `apps/site/tsconfig.json` — add 8 `references` entries (matches the 8
  new runtime deps). Three-way ADR-0008 D1 symmetry: 8 deps + 8 imports
  + 8 tsconfig refs (apps/site previously had 0 block-* refs; final state
  = 8).
- `apps/site/CONTRACT.md` — extend "Public surface" with `componentsMap`
  entry + add a new "Component-block rendering" invariant (RenderView-only
  + the 8 canonical PascalCase keys + per-page `<Content components>`
  pattern). Add cross-link rows to the 8 block-* CONTRACTs in the
  "Related" section.
- `pnpm-lock.yaml` — workspace dep edges for 8 new `@skb/block-*` runtime
  deps. Idempotent + locked (no transitive churn — block-* packages were
  already in workspace from Wave 2).

= **8 files in canonical `## files` block** (counts canonical here).

## test_cases

- **TC1** *(every PascalCase key resolves to RenderView, NOT EditorView)*
  — input: `componentsMap.Callout`; expected: `=== CalloutRenderView`
  (referential identity); location:
  `apps/site/src/__tests__/components-map.test.ts:L25-32` (one assertion
  per block × 8 blocks). The negative form
  `componentsMap.Callout !== CalloutEditorView` is ALSO asserted to lock
  the read-only invariant (a future regression that swapped the import to
  `*EditorView` would still pass referential-identity-as-render but fail
  this guard).
- **TC2** *(all 8 PascalCase keys present + no extras)* — input:
  `Object.keys(componentsMap).sort()`; expected: `['AgentFlow', 'Callout',
  'Code', 'Image', 'Jupyter', 'Math', 'NnViz', 'Pdf']` (deep-equal);
  location: `__tests__/components-map.test.ts:L36-44`. Locks the canonical
  PascalCase set against typo / drift / omission.
- **TC3** *(tree-shaking smoke — DEFERRED to C2 with note.)* C2 owns the
  full bundle-grep assertion per locked plan (lines 516-540). C1's
  R-during-EXECUTE conditional dynamic import already prevents heavy
  block deps (Pyodide / TF.js / React Flow) from leaking into prose-only
  route bundles — the static import broke the build precisely because of
  this leakage. C2 will add the explicit bundle-output assertion + extend
  the dynamic-chunking strategy with `lazy()` boundaries per heavy block.
- **TC4** `pnpm --filter=@skb/site test` exits 0 (vitest passes, includes
  the existing `fouc-script.test.ts` + new `components-map.test.ts`).
- **TC5** `pnpm --filter=@skb/site typecheck` exits 0 (`astro check` +
  `tsc --noEmit` both clean against the 8 new tsconfig refs).
- **TC6** `pnpm --filter=@skb/site build` exits 0 (`astro build`
  succeeds; static output for the prose-only `sample-mdx-note` route
  emits HTML; sample-blocks remains gated by its own `draft: true` —
  flipping that frontmatter is C5 "Stage C close" work, NOT C1).
- **TC7** `pnpm check` exits 0 (full repo monorepo check including link
  check + size check).
- **TC8** ADR-0008 D1 three-way symmetry verified: 8 runtime deps in
  `package.json` `dependencies` ↔ 8 source imports in `components.ts`
  ↔ 8 `references` in `tsconfig.json`. Counted by inspection (one set
  comparison) — no drift.
- **TC9** Lockfile idempotency — `pnpm install` after the PR produces
  zero lockfile diff.

## contracts_affected

- `apps/site/CONTRACT.md` — adds `componentsMap` to "Public surface" +
  new "Component-block rendering" invariant block (RenderView-only +
  canonical PascalCase set + per-page `<Content components>` pattern) +
  related-link rows to the 8 block-* CONTRACTs.

No mutation to `packages/*/CONTRACT.md` — block-* `## Public surface`
already documents `*RenderView` exports (verified in C1 PLAN
investigation; see `packages/block-callout/CONTRACT.md` etc.).

## adr_touched

None. Pure additive consumer wiring of pre-existing `*RenderView` exports.
No ADR-0007 D2 / ADR-0008 D1 / ADR-0011 D2 invariant changes.

## acceptance

1. `componentsMap.Callout === CalloutRenderView` and the 7 sibling
   PascalCase keys analogously map to their `*RenderView` (TC1) — locks
   the read-only invariant.
2. `Object.keys(componentsMap).sort()` exactly equals the 8 canonical
   PascalCase names from `sample-blocks/index.mdx` (TC2) — locks the
   set against drift/typo.
3. `pages/notes/[...slug].astro` renders MDX via `<Content
   components={componentsMap} />` — single per-page wiring point matches
   the canonical Astro Content Collections MDX pattern (verified against
   `/withastro/docs` integration guide; see "Astro MDX wiring pattern"
   below).
4. `pnpm --filter=@skb/site test` + `typecheck` + `build` all exit 0
   (TC4-TC6).
5. `pnpm check` exits 0 (TC7) — full monorepo gate.
6. ADR-0008 D1 three-way symmetry: 8 runtime deps + 8 source imports +
   8 tsconfig refs (TC8) — every dep is reachable + every import has a
   dep entry + tsc resolves project refs.
7. Lockfile clean delta + idempotent (TC9).
8. CONTRACT.md updated with componentsMap public surface +
   Component-block rendering invariant (RenderView-only) + 8 cross-links
   to block-* CONTRACTs.
9. PR.md self-listed in the canonical `## files` block.
10. Protected files unchanged: NO modifications under `packages/*/`,
    `content/notes/*` (sample-blocks `draft` flip is C5), or
    `astro.config.mjs` (the integration-config knob is unchanged — the
    components map flows through the per-page `<Content components>`
    prop, NOT the integration option; argued in "Astro MDX wiring
    pattern" below).
11. Stage C opener: with C1 merged, sample-blocks MDX would hydrate IF
    its `draft: true` were flipped — confirmed by manual `astro dev`
    walk-through optionally (not required for ACCEPT; deferred to C5).

## executor

Path A (`codex-generic-executor`) PRIMARY for the source + test + config
edits (well-defined, ~150 LOC, mechanical wiring of existing exports).
`ux-ui-lead` Claude subagent SECONDARY for the apps/site visual layer
review at PRE-COMMIT CLAUDE stage (D2 row 1 fires; ux-ui-lead checks the
`<Content components>` rendered output respects each block's
`*RenderView` visual contract — design tokens flow, no FOUC regression,
ThemeToggle island unaffected). REVIEW: `codex-pr-reviewer-55`.
PRE-COMMIT CLAUDE: orchestrator-self + ux-ui-lead one-shot dispatch
(D2 row 1 + apps/site visual surface). COMMIT: reviewer codex per
ADR-0011 D1 stage 5 + ADR-0006 D8 explicit-file-list staging.

## D2 trigger judgment

- Row 1 (`apps/site/CONTRACT.md` componentsMap surface + RenderView-only
  invariant): **HIT**.
- Row 2 (package add/remove): **NO** — 0 new packages; 8 new workspace
  edges to existing Wave 2 packages.
- Row 4 (new ADR): **NO** — additive consumer wiring; no invariant
  change.
- Row 5 (cross ≥ 3 packages): **HIT** — apps/site + 8 block-* = 9
  packages touched in the dependency-edge sense (apps/site `package.json`
  + `tsconfig.json` reference 8 sibling packages newly).
- Row 8 (CI/build/deploy/auth/security): **NO**.

→ **D1 stage 4 (PRE-COMMIT CLAUDE REVIEW) fires** because of row 1.
Heightened stage 3 codex review per row 5 cross-package.

## Astro MDX wiring pattern — pattern (b) per-page chosen

C1 PLAN investigation (canonical `/withastro/docs` integration guide via
context7):

The Astro Content Collections MDX docs document EXACTLY ONE pattern for
mapping PascalCase / HTML-element names to React/Astro components when
rendering an entry: per-page via `<Content components={...} />`:

```astro
const { Content } = await render(entry);
// ...
<Content components={{ h1: CustomHeading }} />
```

Source:
`https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/integrations-guide/mdx.mdx`
"Pass custom components to Content Collections MDX" section.

The `@astrojs/mdx` integration's `mdx({...})` config option does NOT
expose a top-level `components` knob (verified — the integration accepts
`extendMarkdownConfig`, `optimize`, `gfm`, `smartypants`, `remarkPlugins`,
`rehypePlugins`, `recmaPlugins`, `remarkRehype` — but NOT `components`).
A per-MDX-file `export const components = {...}` works for an
*imported* MDX file but does NOT compose with content-collection
`render(entry)` because collection entries are loaded by the glob loader,
not imported syntactically.

Therefore pattern (a) (global via `astro.config.mjs`) is **rejected as
unsupported**. Pattern (c) (per-MDX-file `export`) is rejected because
content-collection entries live in `content/notes/<slug>/index.mdx` and
applying the same components map to all 200+ future notes via a
per-file export would force every author to add boilerplate. Pattern (b)
(single per-page wiring at `pages/notes/[...slug].astro`) is the
canonical Astro pattern, scales to all current + future notes via one
edit, and matches the locked plan C1 entry (line 480: "exposes
`componentsMap` for Astro MDX integration") which is intentionally
agnostic to which integration mechanism — pattern (b) consumes the same
exported `componentsMap` constant.

C2 (the dynamic-chunking PR per locked plan lines 516-540) extends this
same pattern (b) wire-up by replacing some of the heavy entries (Pyodide
/ TF.js / React Flow) with `lazy(() => import(...))` boundaries
exposed via a `lazyBlocks` map; the `<Content components>` consumption
stays identical because `lazy()` returns a `ComponentType` that satisfies
the same map signature.

## C1 vs C2 split — TC3 deferred argued

Locked plan C1 entry lists TC3 as "tree-shaking smoke (built apps/site
bundle for a prose-only route does NOT contain Pyodide/TF.js/React-Flow
names)". This PR.md DEFERS TC3 to C2 with explicit rationale:

1. **C1's R-during-EXECUTE conditional dynamic import partially achieves
   TC3's intent** (prose-only routes get an empty `componentsMap = {}` and
   thus avoid pulling block-* into their bundle), but the FULL TC3
   assertion ("built apps/site bundle for a prose-only route does NOT
   contain Pyodide/TF.js/React-Flow names") requires C2's per-block
   `lazy()` boundaries (locked plan line 519: "split heavy blocks behind
   `lazy(() => import(...))` boundaries") to provide the canonical
   bundle-output guarantee. C1 alone cannot author the bundle-grep
   assertion without either (a) eagerly doing C2's full lazy-boundary
   work (scope creep); (b) authoring a flaky bundle-grep that depends on
   route-level tree-shaking heuristics rather than C2's explicit
   `lazy()` boundaries.
2. **C2 already owns this assertion verbatim.** Locked plan C2 entry
   line 530 TC1: "build a prose-only route; asserting the resulting
   chunk does NOT contain `pyodide`/`tensorflow`/`reactflow` names". C1
   deferring TC3 to C2 keeps the test in its natural home next to the
   `lazy()` boundary code that produces the asserted property.
3. **Locked plan PR ordering: C1 → C2 directly.** The deferral is one
   PR forward, not multiple-stage drift.

C1 retains TC4-TC9 covering test/typecheck/build pass + ADR-0008 D1
three-way + lockfile idempotency.

## Risk Grid (locked-plan compatible)

| Class | Hit? | Mitigation |
|---|---|---|
| Row 1 contract change | **HIT** | apps/site/CONTRACT.md componentsMap surface + RenderView-only invariant |
| Row 2 package add/remove | NO | 0 new packages |
| Row 4 ADR | NO | additive consumer wiring |
| Row 5 cross ≥ 3 packages | **HIT** (9 pkgs) | three-way symmetry TC8 + heightened codex review |
| Row 8 CI/deploy/auth | NO | static build only; no auth/CI shape change |

→ Row 1 fires D1 stage 4. Row 5 raises stage 3 scrutiny. Both apply.

## Out-of-scope (deferred / explicitly NOT in C1)

- **TC3 tree-shaking smoke** — deferred to C2 with full rationale above.
- **`lazy()` boundaries / dynamic chunking** — locked plan C2.
- **`sample-blocks` `draft: true → false` flip** — locked plan C5
  (Stage C close ceremony). C1 lands the components map; C5 flips the
  fixture frontmatter to exercise the full path through `astro build`.
- **`astro.config.mjs` modification** — explicitly NOT in C1. C1 chose
  pattern (b) per-page wiring; the integration config is unchanged.
  (Locked plan C1 line 481-482 mentions astro.config.mjs as a candidate
  modify-target; investigation showed pattern (a) is unsupported and
  pattern (b) renders the integration-config edit unnecessary. Recording
  this divergence here for ACCEPT-stage cross-check.)
- **block-* package modifications** — protected. C1 consumes existing
  `*RenderView` exports; never modifies block-* sources.
- **Per-MDX-file `export const components`** — pattern (c) rejected
  (rationale above).
- **Visual smoke (Playwright)** — `apps/site/src/__tests__/visual-smoke.spec.ts`
  is gated by WSL2-skip (per memory `feedback_wsl2_chromium_launch.md`).
  C1 does not gate on visual smoke; CI-only path remains as-is.
- **C2 dynamic chunking, C3 search-index pre-prep, C4a/C4b auxiliary
  routing, C5 Stage C close** — separate locked-plan PRs.

## Files-list audit (sanity)

Files modified by C1 (8 total in `## files` block):

| # | Path | NEW? | Purpose |
|---|---|---|---|
| 1 | `apps/site/src/components.ts` | NEW | componentsMap (8 entries) |
| 2 | `apps/site/src/__tests__/components-map.test.ts` | NEW | TC1 + TC2 |
| 3 | `docs/plans/wave-3-main/C1-apps-site-block-registry.md` | NEW | this PR.md |
| 4 | `apps/site/src/pages/notes/[...slug].astro` | mod | wire `<Content components>` |
| 5 | `apps/site/package.json` | mod | 8 runtime deps |
| 6 | `apps/site/tsconfig.json` | mod | 8 references |
| 7 | `apps/site/CONTRACT.md` | mod | public surface + invariant |
| 8 | `pnpm-lock.yaml` | mod | workspace edges |

LOC budget: ~150 (locked plan estimate). Breakdown: components.ts ~30 +
test ~60 + [...slug].astro ~3 (one import + prop change) + package.json
~10 + tsconfig.json ~10 + CONTRACT.md ~25 + PR.md self ~250 (PR.md
excluded from source-file LOC count). Source LOC ≈ 138, well under 200.

## Related

- [Wave 3 plan, C1 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (lines 470-510).
- [B8 PR.md](./B8-mdx-bridge-nn-viz-agent-flow.md) — Stage B close (predecessor; established mdx-bridge dispatch architecture for the same 8 PascalCase tags C1 now wires on the consumer side).
- [ADR-0008 D1](../../decisions/ADR-0008-wave-2-entry-policies.md) — dead-dep tightening (three-way symmetry: 8 deps + 8 imports + 8 tsconfig refs).
- [ADR-0011 D1](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — linear pipeline; D2 row 1 + row 5 trigger judgment.
- [ADR-0011 v0.1.1 SOTed-PR.md discipline](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — Stage B retrospective: 5/8 zero-R-round PRs; aim for zero-R-round in Stage C.
- [apps/site/CONTRACT.md](../../../apps/site/CONTRACT.md) — consumer surface modified by C1.
- [packages/block-callout/CONTRACT.md](../../../packages/block-callout/CONTRACT.md) — `*RenderView` public surface (sibling block-* CONTRACTs analogously).
- [packages/mdx-bridge/CONTRACT.md](../../../packages/mdx-bridge/CONTRACT.md) — Stage B sibling; same 8 PascalCase tags routed at parse-time on the bridge side.
- [Astro Content Collections MDX guide](https://docs.astro.build/en/guides/integrations-guide/mdx/) — canonical pattern (b) `<Content components={...} />` source.
