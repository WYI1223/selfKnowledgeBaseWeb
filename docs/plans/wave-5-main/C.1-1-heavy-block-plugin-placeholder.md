# C.1-1 — Heavy block "🔌 plugin" placeholder + ADR-0014 v0.4 amendment

> **Wave 5 Stage C.1 1st implementation PR** of the locked 3-PR sequence
> (C.1-1 → C.1-2 → C.1-3; per Wave 5 plan v1.0 §455-463). Replaces Wave
> 4 B7's `client:load` + dynamic-import + `HeavyBlockBoundary` wiring on
> the 3 heavy blocks (Jupyter / NnViz / AgentFlow) with a static
> server-rendered "🔌 plugin" placeholder tier — the Wave 5 MVP path
> codified in reframe v2 (memory `project_wave4_reframe_v2.md`,
> 2026-05-03 gatekeeper directive). Real Pyodide / TF.js / React Flow
> runtime is deferred to a Phase 2+ `plugin-real-runtime` tier; the
> Wave 4 PR #48 (`de39e07`) Pyodide CDN infrastructure stays installed
> as forward-pointer. Co-ships ADR-0014 v0.4 amendment (NEW D11
> "Plugin tier split" + AC#16 carve-out for placeholder tier) and an
> `apps/site/CONTRACT.md` prose update describing the placeholder tier
> while preserving the Pyodide CDN paragraph as Phase 2+ pointer.
> **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger
> judgment` (Row 4 substantive ADR amendment + Row 1 CONTRACT sync).

## title

Rewrite the 3 heavy block React islands
(`apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx`) to a
static "🔌 plugin" placeholder: drop the `HeavyBlockBoundary` wrapper +
the dynamic `import('@skb/block-{kind}/ui-default')` `load` arrow
function (boundary's job = gate dynamic load → real component swap;
placeholder has no dynamic load to gate). Preserve each island's
`heavyBoundaryDimensions` import from
`@skb/block-{kind}/ui-default/heavy-boundary-dimensions` so the SSR
rect stays byte-identical to the Wave 4 zero-layout-shift baseline
(AC#5). Render a single div element per kind that reuses the
`@skb/heavy-block-boundary` skeleton CSS shell
(`.heavy-block-skeleton` + `.heavy-block-skeleton--{kind}`) for visual
parity with the Wave 4 baseline; carries `role='status'` +
`data-block='{kind}'` + `aria-busy='false'` (AC#16 carve-out — never
transitions to busy) + `data-loaded='true'` (AC#16 second discriminant
— signals hydration completion to the playwright poller). Inside the
shell render the emoji `🔌` + a small text label
`{KindLabel} · plugin runtime (Phase 2+)`. NO OKLCH / kind-hue token
consumption in v0.4 (deferred to Stage C.3 + ADR-0014 v0.5;
ADR-0018 D3 forward-pointer). Keep the 3 Astro wrappers
(`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`) unchanged
— `client:load {...Astro.props}` shell remains correct because Astro's
hydration boundary contract from D10 stays intact (the React island is
just a no-op hydrator now). Keep `apps/site/src/components.ts`
`componentsMap` public surface byte-identical (8 PascalCase keys
`Callout`/`Code`/`Image`/`Math`/`Pdf`/`Jupyter`/`NnViz`/`AgentFlow`
unchanged; `import '@skb/heavy-block-boundary/heavy-block-skeleton.css'`
stays for shared CSS shell). Author ADR-0014 v0.4 substantive
Amendment under `## Amendments` § (NEW D11 "Plugin tier split" + AC#16
carve-out paragraph for placeholder tier). v0.4 amendment appends a
new subsection inside `## Amendments` only — no `## Status` line
change (follows ADR-0014 v0.3 substantive-amendment precedent). Update
`apps/site/CONTRACT.md` `Component-block rendering` +
`Chunking strategy / heavy-block taxonomy` + `Pyodide CDN hosting`
sections to describe the placeholder tier as the Wave 5 MVP path while
preserving the Pyodide CDN paragraph as Phase 2+ forward-pointer (do
NOT delete; reframe v2 mandates C-1 CDN infrastructure stays). Ship
NEW vitest at
`apps/site/src/__tests__/heavy-block-plugin-placeholder.test.ts`
asserting placeholder render contract per kind (🔌 + label + dims +
ARIA). PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

10 canonical files at PLAN time (orchestrator-self handles ADR-0014
v0.4 Amendment + CONTRACT.md prose update per Pre-A2 + B1a + B7
substantive-amendment precedent; `codex-generic-executor` handles the
3 island rewrites + the NEW vitest). NO `package.json` /
`pnpm-lock.yaml` change (no new deps; `@skb/heavy-block-boundary` CSS
stays imported for shared shell). NO `astro.config.mjs` change. NO new
ADR file (Row 4 trigger is substantive Amendment to ADR-0014, matching
B1a + B7 precedent under Row 4). NO change to the 3 Astro wrappers
(unchanged shells). PR.md self-listed.

- `apps/site/src/islands/JupyterIsland.tsx` — **MODIFIED** (~25 LOC
  net, ~-4/+25). Drop `HeavyBlockBoundary` import + `loadJupyter`
  arrow function + `<HeavyBlockBoundary kind dims load childProps>`
  return. Keep `heavyBoundaryDimensions as jupyterDims` import (dims
  preserved). Keep `FlatProps` import from `../lib/mdx-adapter`
  (typing still used; placeholder ignores props at runtime but the
  type contract is unchanged for forward-compat with plugin-real-runtime
  tier). Render `<div role='status' data-block='jupyter'
  aria-busy='false' data-loaded='true'
  className='heavy-block-skeleton heavy-block-skeleton--jupyter
  heavy-block-skeleton--placeholder' style={{ width:
  jupyterDims.width, minHeight: jupyterDims.minHeight }}>
  <span aria-hidden='true' className='heavy-block-placeholder__icon'>
  🔌</span><span className='heavy-block-placeholder__label'>Jupyter
  · plugin runtime (Phase 2+)</span></div>`. The
  `heavy-block-skeleton--placeholder` class is a NEW BEM modifier
  (visual parity at v0.4; no new CSS file — relies on cascade from the
  existing `.heavy-block-skeleton` + `.heavy-block-skeleton--jupyter`
  rules in `@skb/heavy-block-boundary/heavy-block-skeleton.css`; the
  placeholder modifier itself has no rules at v0.4 and is purely a
  hook for future Stage C.3 / ADR-0014 v0.5 OKLCH wiring).
  Inline-style `width` + `minHeight` from `jupyterDims` keep the SSR
  rect byte-identical to the Wave 4 baseline (AC#5).

- `apps/site/src/islands/NnVizIsland.tsx` — **MODIFIED** (~25 LOC net,
  same shape). Kind literal `'nn-viz'`, dims from
  `@skb/block-nn-viz/ui-default/heavy-boundary-dimensions`, label
  `NnViz · plugin runtime (Phase 2+)`. BEM modifier
  `heavy-block-skeleton--nn-viz heavy-block-skeleton--placeholder`.

- `apps/site/src/islands/AgentFlowIsland.tsx` — **MODIFIED** (~25 LOC
  net, same shape). Kind literal `'agent-flow'`, dims from
  `@skb/block-agent-flow/ui-default/heavy-boundary-dimensions`, label
  `AgentFlow · plugin runtime (Phase 2+)`. BEM modifier
  `heavy-block-skeleton--agent-flow heavy-block-skeleton--placeholder`.

- `apps/site/src/components/Jupyter.astro` — **UNCHANGED**. The
  `<JupyterIsland client:load {...Astro.props} />` shell stays correct
  per ADR-0014 D10 (the Astro hydration boundary contract is unbroken;
  the React island is just a no-op hydrator now — `client:load` still
  fires, React tree mounts, no useEffect work).

- `apps/site/src/components/NnViz.astro` — **UNCHANGED**.

- `apps/site/src/components/AgentFlow.astro` — **UNCHANGED**.

- `apps/site/src/components.ts` — **UNCHANGED in shape**. The
  `componentsMap` public surface (8 PascalCase keys; per
  `apps/site/CONTRACT.md` L88-98 invariant) stays byte-identical: the
  3 heavy entries (`Jupyter` / `NnViz` / `AgentFlow`) still reference
  the unchanged `.astro` wrappers; the 5 light entries unchanged. The
  `import '@skb/heavy-block-boundary/heavy-block-skeleton.css'` line
  stays (shared CSS shell consumed by the placeholder; future
  plugin-real-runtime tier reuses immediately). The
  `makeMdxAdapter` + `FlatProps` re-exports stay (used by light blocks
  + still imported by islands for type contract). **Zero diff
  expected**; if the executor diffs this file, it indicates scope
  creep — reviewer rejects.

- `apps/site/CONTRACT.md` — **MODIFIED** (~30 LOC net delta;
  prose-only). Update three sections:
  - **`Component-block rendering`** (L85-98): the 3 heavy keys
    paragraph (L92-98) gets a Wave 5 sentence addendum: the values
    "reference Astro wrappers under `./components/{Kind}.astro` per
    ADR-0014 v0.3 D10 (production hydration boundary)" stays; append
    "In Wave 5 (ADR-0014 v0.4 amendment) those islands render the
    `plugin-placeholder` tier — a static React shell satisfying the
    SSR + hydration boundary contract without dynamic-importing real
    runtimes. The `plugin-real-runtime` tier (Phase 2+) restores the
    `HeavyBlockBoundary` + dynamic `load()` chain."
  - **`Chunking strategy / heavy-block taxonomy`** (L99-116): preserve
    the prose; append a Wave 5 sentence: "Wave 5 ships the
    `plugin-placeholder` tier — `block-jupyter` / `block-nn-viz` /
    `block-agent-flow` `ui-default` modules are NOT dynamic-imported
    by the islands at v0.4, so the prose-only chunk-leak guarantees
    are trivially satisfied. The `manualChunks` pins remain in
    `astro.config.mjs` as forward-compat seams for the
    `plugin-real-runtime` tier."
  - **`Pyodide CDN hosting (Jupyter heavy block)`** (L117-132):
    **PRESERVE** the entire paragraph + reframe-v2-mandated C-1 CDN
    infrastructure pointer; prepend a 1-sentence Wave 5 framer:
    "**Phase 2+ plugin-real-runtime tier forward-pointer** — at v0.4
    the Jupyter island is a placeholder and does NOT load Pyodide;
    the CDN allowlist below applies when the future
    `plugin-real-runtime` tier (ADR-0014 next amendment) restores the
    dynamic load chain." Do NOT delete the Pyodide jsdelivr CDN
    paragraph; do NOT delete the CSP / `script-src` / `connect-src`
    guidance. (Risk register #5: reframe v2 mandates this preservation.)

- `docs/decisions/ADR-0014-heavy-block-boundary.md` — **MODIFIED**
  (~70 LOC net append to `## Amendments` § only; NO `## Status` line
  change per ADR-0014 v0.3 substantive-amendment precedent). Single
  edit: NEW v0.4 subsection at end of `## Amendments` §
  (subsection title `### v0.4 (2026-05-04; Wave 5 Stage C.1) — Plugin
  tier split: placeholder (Wave 5 MVP) vs real-runtime (Phase 2+)`).
  Sections inside:
    1. **Gap framing** (~10 LOC): Wave 5 reframe v2 (memory
       `project_wave4_reframe_v2.md`, 2026-05-03 gatekeeper
       directive) supersedes Wave 4's MVP target. The MVP path no
       longer requires real Pyodide / TF.js / React Flow at first
       paint; the 3 heavy block surfaces show a static "🔌 plugin"
       placeholder. Real runtime restoration deferred to Phase 2+
       under the `plugin-real-runtime` tier (a future amendment).
    2. **NEW D11 — Plugin tier split** (~20 LOC):
       `HeavyBlockBoundary` serves a future `plugin-real-runtime`
       tier (Phase 2+; would dynamic-import the heavy package's
       `RenderView` + hydrate Pyodide / TF.js / React Flow). Wave 5
       ships only `plugin-placeholder` tier — a static React shell
       rendered server-side via Astro + hydrated as a no-op
       (`client:load` directive remains so the SSR / hydration
       boundary from D10 is unbroken). Boundary package
       (`@skb/heavy-block-boundary`) stays installed; CSS asset stays
       imported in `apps/site/src/components.ts` for shared shell
       (light blocks + future plugin-real-runtime tier reuse).
       Placeholder tier emits `aria-busy='false'` +
       `data-loaded='true'` on initial SSR (no transition through
       busy state). plugin-real-runtime tier reactivation re-introduces
       the `HeavyBlockBoundary` wrapper (parametrized over `FlatProps`)
       around a real `load` function; the 3 island files become the conditional tier
       surface (or branch by env / feature flag).
    3. **AC#16 carve-out for placeholder tier** (~15 LOC): preserve
       the original AC#16 contract for `plugin-real-runtime` tier
       verbatim. Add explicit carve-out: "Wave 5 `plugin-placeholder`
       tier satisfies AC#16 by emitting `aria-busy='false'` +
       `data-loaded='true'` on initial SSR (no transition to busy
       state). The existing `apps/site/playwright/heavy-block-layout-shift.spec.ts`
       AC#16 poll
       (`ariaBusy === 'false' || outerLoaded === 'true' ||
       loadedDescendants > 0`) trivially passes for the placeholder
       tier. The `plugin-real-runtime` tier (Phase 2+) will exercise
       the full `aria-busy='true' → 'false'` transition when the
       boundary returns."
    4. **Visual contract** (~10 LOC): placeholder shell reuses
       `.heavy-block-skeleton` + `.heavy-block-skeleton--{kind}` CSS
       (from `@skb/heavy-block-boundary/heavy-block-skeleton.css`)
       byte-identical to v0.3 baseline. Inside renders emoji `🔌` +
       label `{KindLabel} · plugin runtime (Phase 2+)`. NEW BEM
       modifier `.heavy-block-skeleton--placeholder` reserved for
       future Stage C.3 / ADR-0014 v0.5 OKLCH wiring; NO rules at
       v0.4 (cascade from existing `.heavy-block-skeleton` resolves).
       Dims preserved via inline `width` + `minHeight` from
       `heavyBoundaryDimensions` (AC#5 zero-layout-shift unchanged).
    5. **Phase 2+ migration sketch** (~10 LOC): conditional tier
       surface inside the 3 island files. Pseudocode:
       `if (FEATURE_PLUGIN_REAL_RUNTIME) return <HeavyBlockBoundary
       kind=… dims=… load=… childProps=…/>; else return
       <PluginPlaceholder kind=… />`. Real runtime resurfaces from
       git history (Wave 4 B7 squash HEAD `794cd5d`) or a NEW PR;
       documented as Phase 2+ scope.
    6. **Implementation evidence stub** (~5 LOC, table; squash HEAD
       TBD post-commit): kind island file paths + `🔌` + `aria-busy`
       grep verifications + ADR-0014 v0.4 grep + AC#16 playwright
       PASS link.

- `apps/site/src/__tests__/heavy-block-plugin-placeholder.test.ts` —
  **NEW** (~80 LOC vitest). Three test cases (one per kind):
  - **TC1 — Jupyter placeholder render contract**: render
    `<JupyterIsland />` (zero props), assert: tree contains text
    `🔌`; tree contains text `Jupyter · plugin runtime (Phase 2+)`;
    outer `[role='status']` has `data-block='jupyter'`,
    `aria-busy='false'`, `data-loaded='true'`; outer inline style
    has `width: 600px` + `min-height: 400px` (per
    `@skb/block-jupyter/ui-default/heavy-boundary-dimensions`).
  - **TC2 — NnViz placeholder render contract**: same shape, kind
    `'nn-viz'`, label `NnViz · plugin runtime (Phase 2+)`, dims
    `width: 500px` + `min-height: 400px`.
  - **TC3 — AgentFlow placeholder render contract**: same shape,
    kind `'agent-flow'`, label `AgentFlow · plugin runtime (Phase 2+)`,
    dims `width: 600px` + `min-height: 400px`.
  - All 3 use `@testing-library/react` (already a workspace dep per
    A2 / A4 vitest precedent). TDD-front: failing first → impl → PASS.

- `docs/plans/wave-5-main/C.1-1-heavy-block-plugin-placeholder.md` —
  **THIS PR.md** (self-listed). LOC budget ≤ 800; current draft
  ~700.

**LOC tally** (rough):
- 3 islands rewrite: ~75 LOC net
- vitest NEW: ~80 LOC
- ADR-0014 v0.4 amendment: ~70 LOC append
- apps/site/CONTRACT.md prose: ~30 LOC net
- PR.md: ~700 LOC (this file; doc-class, separate from impl LOC budget)
- **Implementation total: ~256 LOC** ≤ Wave 5 plan v1.0 row C.1-1
  ~300 LOC budget ≤ R23 LOC discipline 500 cap.

## test_cases

TDD-front per Wave 5 plan v1.0 + ADR-0011 D2 schema. Failing tests
written FIRST, impl second.

1. **vitest TC1 — JupyterIsland placeholder contract** (NEW)
   - location: `apps/site/src/__tests__/heavy-block-plugin-placeholder.test.ts`
   - input: `render(<JupyterIsland />)` (zero props; placeholder
     ignores props at runtime — `FlatProps` only used for type
     contract forward-compat).
   - expected: outer `[role='status'][data-block='jupyter']` exists;
     `aria-busy='false'`; `data-loaded='true'`; text content
     contains `🔌`; text content contains `Jupyter · plugin runtime
     (Phase 2+)`; outer inline style `width: 600px` +
     `min-height: 400px` (from
     `@skb/block-jupyter/ui-default/heavy-boundary-dimensions`).

2. **vitest TC2 — NnVizIsland placeholder contract** (NEW)
   - location: same file
   - input: `render(<NnVizIsland />)`
   - expected: outer `[role='status'][data-block='nn-viz']`;
     `aria-busy='false'`; `data-loaded='true'`; text `🔌` +
     `NnViz · plugin runtime (Phase 2+)`; dims `width: 500px` +
     `min-height: 400px`.

3. **vitest TC3 — AgentFlowIsland placeholder contract** (NEW)
   - location: same file
   - input: `render(<AgentFlowIsland />)`
   - expected: outer `[role='status'][data-block='agent-flow']`;
     `aria-busy='false'`; `data-loaded='true'`; text `🔌` +
     `AgentFlow · plugin runtime (Phase 2+)`; dims `width: 600px` +
     `min-height: 400px`.

4. **vitest TC4 — sample-blocks-page invariants preserved** (EXISTING,
   should still PASS)
   - location: `apps/site/src/__tests__/sample-blocks-page.test.ts`
   - expected: no regressions (componentsMap public surface unchanged
     → MDX render path stable).

5. **vitest TC5 — components-map invariants preserved** (EXISTING)
   - location: `apps/site/src/__tests__/components-map.test.ts`
   - expected: 8 PascalCase keys unchanged.

6. **vitest TC6 — lazy-chunking regression preserved** (EXISTING; the
   test asserts prose-only routes do NOT contain `pyodide` / `tensorflow`
   / `reactflow`; placeholder tier trivially satisfies because no
   dynamic-import of `@skb/block-{kind}/ui-default` happens from the
   islands at v0.4 → no chunk leak possible)
   - location: `apps/site/src/__tests__/lazy-chunking.test.ts`
   - expected: PASS (trivially; placeholder strengthens, doesn't
     weaken). If a sub-assertion expected a chunk to *exist* for the
     3 heavy kinds, that assertion must be relaxed or moved to a
     forward-compat NO-OP at v0.4. Reviewer verifies by reading the
     spec at HEAD.

7. **vitest TC7 — dims-source preserved** (EXISTING)
   - location: `apps/site/src/__tests__/dims-source.test.ts`
   - expected: PASS (each island still imports
     `heavyBoundaryDimensions` from the correct
     `@skb/block-{kind}/ui-default/heavy-boundary-dimensions`).

8. **playwright AC#5 — heavy-block-layout-shift T0/T1 width strict +
   height monotone** (EXISTING; should still PASS for placeholder)
   - location: `apps/site/playwright/heavy-block-layout-shift.spec.ts`
   - input: visit `/notes/sample-blocks`, T0 boundingBox vs T1
     boundingBox after 2s settle.
   - expected: width strict equal; height monotone (placeholder never
     shrinks); placeholder tier renders the SSR rect byte-identical
     to T0 because it never transitions states. WSL2 skip preserved.

9. **playwright AC#16 — hydration end-to-end (relaxed; placeholder
   carve-out)** (EXISTING; trivially PASS)
   - location: same spec file
   - input: poll
     `ariaBusy === 'false' || outerLoaded === 'true' ||
     loadedDescendants > 0` per kind.
   - expected: PASS immediately (placeholder emits both
     `aria-busy='false'` + `data-loaded='true'` on initial SSR).

## contracts_affected

- `apps/site/CONTRACT.md` — Wave 5 prose update (placeholder tier
  framing + Pyodide CDN preserved as Phase 2+ pointer). 8-key
  componentsMap public surface invariant **unchanged**.
- `@skb/heavy-block-boundary/CONTRACT.md` — **NOT touched** (Wave 4
  lock; placeholder tier doesn't reach into the package; v0.5
  amendment in Stage C.2-7 will touch).
- `@skb/block-{jupyter,nn-viz,agent-flow}/CONTRACT.md` — **NOT
  touched** (heavy block packages stay intact + runtime preserved for
  Phase 2+ plugin-real-runtime tier; only the island consumer rewires).

## adr_touched

- `docs/decisions/ADR-0014-heavy-block-boundary.md` — **v0.4 amendment**
  (NEW D11 "Plugin tier split" + AC#16 carve-out paragraph for
  placeholder tier; appended inside `## Amendments` § only; NO
  `## Status` line change per ADR-0014 v0.3 substantive-amendment
  precedent). Substantive amendment per Pre-A4 plan-challenger Q5
  absorbtion classification (matches B1a v0.1.1 + B7 v0.3 substantive
  precedent under Row 4 trigger).
- `docs/decisions/ADR-0018-v2-visual-migration.md` — **NOT touched**
  (placeholder tier defers OKLCH consumption to Stage C.3 + ADR-0014
  v0.5 per ADR-0018 D3 forward-pointer).

## acceptance

Verifiable per AC# below; reviewer (stage 3) + orchestrator self
(stage 4) + pr-writer ACCEPT (stage 6) re-execute these.

- **AC#1 — JupyterIsland placeholder structure**:
  - `grep -L 'HeavyBlockBoundary' apps/site/src/islands/JupyterIsland.tsx | wc -l`
    → `1` (file exists; does NOT contain `HeavyBlockBoundary`).
  - `grep -c 'heavyBoundaryDimensions' apps/site/src/islands/JupyterIsland.tsx`
    → `≥ 1` (dims preserved).
  - `grep -F '🔌' apps/site/src/islands/JupyterIsland.tsx`
    → matches at least once.
  - `grep -F 'Jupyter · plugin runtime (Phase 2+)' apps/site/src/islands/JupyterIsland.tsx`
    → matches.
  - `grep -F "data-block='jupyter'" apps/site/src/islands/JupyterIsland.tsx`
    → matches (or JSX-equivalent `data-block="jupyter"`).
  - `grep -F "aria-busy='false'" apps/site/src/islands/JupyterIsland.tsx`
    → matches (or JSX-equivalent).
  - `grep -F "data-loaded='true'" apps/site/src/islands/JupyterIsland.tsx`
    → matches.

- **AC#2 — NnVizIsland placeholder structure**: same 7 checks against
  `apps/site/src/islands/NnVizIsland.tsx` with kind `nn-viz` + label
  `NnViz · plugin runtime (Phase 2+)`.

- **AC#3 — AgentFlowIsland placeholder structure**: same 7 checks
  against `apps/site/src/islands/AgentFlowIsland.tsx` with kind
  `agent-flow` + label `AgentFlow · plugin runtime (Phase 2+)`.

- **AC#4 — Astro wrappers unchanged**:
  - `git diff main -- apps/site/src/components/Jupyter.astro
    apps/site/src/components/NnViz.astro
    apps/site/src/components/AgentFlow.astro | wc -l` → `0`.

- **AC#5 — components.ts public surface unchanged**:
  - `git diff main -- apps/site/src/components.ts | wc -l` → `0`
    (executor MUST achieve zero diff on this file; if diff present,
    reviewer rejects per scope-fence).
  - `grep -cE '^\s{2}(Callout|Code|Image|Math|Pdf|Jupyter|NnViz|AgentFlow)\b' apps/site/src/components.ts`
    → `8` (8 PascalCase keys preserved; 5 light keys `Key:` + 3 heavy
    shorthand `Key,` shapes both matched by the relaxed regex).

- **AC#6 — apps/site/CONTRACT.md prose update**:
  - `grep -F 'plugin-placeholder' apps/site/CONTRACT.md` → matches
    (Wave 5 framer landed in 1 of the 3 sections).
  - `grep -F 'Phase 2+ plugin-real-runtime' apps/site/CONTRACT.md`
    → matches (forward-pointer).
  - `grep -F 'cdn.jsdelivr.net/pyodide/v0.27.7' apps/site/CONTRACT.md`
    → matches (Pyodide CDN paragraph PRESERVED — reframe v2 mandate).

- **AC#7 — ADR-0014 v0.4 amendment landed**:
  - `grep -E '^### v0\.4 \(2026-05-' docs/decisions/ADR-0014-heavy-block-boundary.md`
    → matches.
  - `grep -E '^### D11' docs/decisions/ADR-0014-heavy-block-boundary.md`
    OR `grep -F 'NEW D11' docs/decisions/ADR-0014-heavy-block-boundary.md`
    → matches (NEW D-list anchor).
  - `grep -F 'Plugin tier split' docs/decisions/ADR-0014-heavy-block-boundary.md`
    → matches.
  - `grep -F 'plugin-placeholder' docs/decisions/ADR-0014-heavy-block-boundary.md`
    → matches.
  - `grep -F 'plugin-real-runtime' docs/decisions/ADR-0014-heavy-block-boundary.md`
    → matches.
  - `grep -F 'AC#16' docs/decisions/ADR-0014-heavy-block-boundary.md`
    → matches at least 2 occurrences (original v0.3 + v0.4 carve-out
    cross-reference).

- **AC#8 — vitest NEW placeholder spec passes**:
  - `pnpm --filter @skb/site test -- heavy-block-plugin-placeholder`
    → 3 tests PASS (TC1/TC2/TC3 above).

- **AC#9 — vitest existing specs preserved**:
  - `pnpm --filter @skb/site test` → all PASS (TC4-TC7 above plus
    other apps/site vitests; no regression).

- **AC#10 — playwright AC#5 + AC#16 PASS (CI canonical; WSL2
  skip)**: `pnpm --filter @skb/site exec playwright test
  heavy-block-layout-shift` → all PASS. Local WSL2 skip preserved.

- **AC#11 — `pnpm check` green**:
  - `pnpm check:affected` → PASS (lint + typecheck + test + build +
    size-check).

- **AC#12 — link-check green** (CI canonical; lychee binary not
  bundled in dev sandboxes):
  - CI workflow `link-check` job runs `pnpm link-check` → PASS (no
    broken markdown links introduced).
  - Local dev sandbox (WSL2 / Codex sandbox) typically lacks the
    `lychee` binary on `PATH` — `pnpm link-check` exits 1 locally
    with `sh: 1: lychee: not found`. This is environmental and
    parallels the WSL2 chromium pattern per memory
    `feedback_wsl2_chromium_launch.md`. AC#12 is canonical against
    the CI workflow run.
  - Pre-empt scan (runs locally, no binary needed; orchestrator
    self-walk per memory `feedback_lychee_autolink_in_backticks`):
    grep this PR's NEW content (PR.md plus ADR-0014 v0.4 amendment
    region — see ADR-0014 lines after the v0.3 subsection) for the
    pattern of an angle-bracketed word inside inline backticks; the
    match count MUST be zero. Same care for the other 3 lychee
    pitfall memories: `feedback_lychee_line_anchor` (no `:line`
    suffix on relative file links), `feedback_lychee_npmjs_403`
    (cite npm via GitHub repo URL only), and
    `feedback_lychee_user_local_paths` (use prose plus tilde-path
    in inline code, not markdown link form).

- **AC#13 — size-check green**:
  - `pnpm size-check` → PASS.

## verification required

Per Wave 5 plan v1.0 §192-225 verification block + ADR-0011 D2 schema.
Reviewer (stage 3) + orchestrator (stage 4) + pr-writer ACCEPT (stage
6) all run these.

| Stage | Step | Command | Expected |
|---|---|---|---|
| 3 / 4 / 6 | File existence | `ls apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx apps/site/src/__tests__/heavy-block-plugin-placeholder.test.ts` | 4 paths exist |
| 3 / 4 / 6 | Astro wrappers untouched | `git diff main -- apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro \| wc -l` | `0` |
| 3 / 4 / 6 | components.ts untouched | `git diff main -- apps/site/src/components.ts \| wc -l` | `0` |
| 3 / 4 / 6 | 8-key public surface | `grep -cE '^\s{2}(Callout\|Code\|Image\|Math\|Pdf\|Jupyter\|NnViz\|AgentFlow)\b' apps/site/src/components.ts` | `8` |
| 3 / 4 / 6 | HeavyBlockBoundary removed from islands | `grep -l 'HeavyBlockBoundary' apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx \| wc -l` | `0` |
| 3 / 4 / 6 | Dims preserved per island | `grep -c 'heavyBoundaryDimensions' apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx` | `1` per file |
| 3 / 4 / 6 | 🔌 emoji per island | `grep -c '🔌' apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx` | `≥ 1` per file |
| 3 / 4 / 6 | ADR-0014 v0.4 anchor | `grep -E '^### v0\.4 \(2026-05-' docs/decisions/ADR-0014-heavy-block-boundary.md` | matches |
| 3 / 4 / 6 | NEW D11 anchor | `grep -E 'D11' docs/decisions/ADR-0014-heavy-block-boundary.md` | matches |
| 3 / 4 / 6 | CONTRACT placeholder framer | `grep -F 'plugin-placeholder' apps/site/CONTRACT.md` | matches |
| 3 / 4 / 6 | Pyodide CDN preserved | `grep -F 'cdn.jsdelivr.net/pyodide/v0.27.7' apps/site/CONTRACT.md` | matches |
| 3 / 4 / 6 | Lint + typecheck + test + build + size | `pnpm check:affected` | PASS |
| 3 / 4 / 6 | Lychee link-check (CI canonical; local lychee binary often missing) | `pnpm link-check` (CI) OR orchestrator-self prose-walk over PR.md plus ADR-0014 v0.4 amendment region per AC#12 (local pre-empt; grep four lychee-pitfall memories) | PASS in CI; zero pitfalls locally |
| 3 / 4 / 6 | Vitest placeholder spec | `pnpm --filter @skb/site test -- heavy-block-plugin-placeholder` | 3 PASS |
| 3 / 4 / 6 | Playwright AC#5 + AC#16 (CI) | `pnpm --filter @skb/site exec playwright test heavy-block-layout-shift` | PASS in CI |
| 6 (ACCEPT) | LOC budget | `git diff --stat main -- apps/site/src/islands apps/site/src/__tests__/heavy-block-plugin-placeholder.test.ts apps/site/CONTRACT.md docs/decisions/ADR-0014-heavy-block-boundary.md \| tail -1` | `≤ 500 changed lines` |

## Plan-challenger absorbtion

**NOT applicable.** C.1-1 is an implementation PR (NOT a Pre-A
ADR-class lock). Per ADR-0007 D5 + ADR-0011 D2 + Wave 5 plan v1.0 D7,
plan-challenger codex round is mandatory at Pre-A ADR-class locks
only (Pre-A1 v0.1→v0.2 / Pre-A2 ADR-0016 / Pre-A3 ADR-0017 /
Pre-A4 ADR-0018). Implementation PRs rely on Stage 3
codex-pr-reviewer-55 (line-level + spec-match + ADR-0006 8-point
checklist) + Stage 4 PRE-COMMIT CLAUDE REVIEW (D2 row 4 + row 1 fires
for this PR; orchestrator-self mitigates same-model echo chamber for
the substantive ADR amendment + CONTRACT prose change).

C.1-1's design itself ("🔌 plugin" placeholder vs real runtime split)
has been the locked decision since 2026-05-03 gatekeeper directive
(memory `project_wave4_reframe_v2.md`) and was confirmed by Wave 5
plan v0.2 + v1.0 lock (Pre-A1 + Pre-A5). This PR is the **implementation
of an already-absorbed design** — no NEW design surface that
plan-challenger would re-litigate.

## R14 self-check

Per Wave 5 plan v1.0 D4 + Pre-A1 R14 self-check precedent.

1. **Stage C.1 scope-fence** (D12 whitelist L198-205): all touched
   files (`apps/site/src/islands/*Island.tsx` +
   `apps/site/src/components/*.astro` (untouched but in-whitelist) +
   `apps/site/src/components.ts` (untouched but in-whitelist) +
   `docs/decisions/ADR-0014-heavy-block-boundary.md` v0.4 amendment +
   `apps/site/CONTRACT.md` + 1 NEW vitest under
   `apps/site/src/__tests__/` + 1 PR.md) are inside whitelist. **PASS**.
2. **Scope-fence blacklist** (D12 L207-210): NO files under
   `packages/heavy-block-boundary/**` (Wave 4 lock; v0.5 amendment in
   Stage C.2). NO files under `editor-shell` / `mdx-bridge` /
   `block-foundation` (Stage C.2 scope). NO files under
   `packages/design-tokens` / OKLCH (Stage C.3 scope). **PASS**.
3. **ADR-0014 v0.4 amendment substantive** (D2 Row 4 fires correctly):
   v0.4 is a substantive amendment per Pre-A4 Q5 classification (NEW
   D11 "Plugin tier split" introduces NEW design decision + AC#16
   carve-out relaxes existing acceptance criterion for the placeholder
   tier — substantive semantic change). No `## Status` line change
   per ADR-0014 v0.3 substantive-amendment precedent. Both NEW D-list
   addition + AC#X carve-out qualify as substantive → Row 4 fires
   correctly (not late-surface escalation). **PASS**.
4. **D2 Row 1 fires correctly**: `apps/site/CONTRACT.md` 3 sections
   updated (Component-block rendering + Chunking strategy +
   Pyodide CDN hosting). Substantive prose update co-located with
   substantive ADR amendment. **PASS**.
5. **LOC budget**: ~256 LOC implementation diff ≤ 300 LOC plan v1.0
   row C.1-1 budget ≤ R23 LOC discipline 500 cap. PR.md ~700 LOC ≤
   800 LOC self-target (B7 hit 1501 LOC and contributed to drift;
   Wave 5 R23 honors leaner PR.md). **PASS**.
6. **No new package; no cross-package boundary change**: islands
   import existing `@skb/block-{kind}/ui-default/heavy-boundary-dimensions`
   (no NEW path); components.ts skeleton CSS import preserved; no
   NEW cross-package edges. **PASS**.
7. **Already-absorbed design** (memory `project_wave4_reframe_v2.md`
   2026-05-03 + Wave 5 plan v1.0 lock): no NEW design surface; this
   PR is implementation. plan-challenger NOT required. **PASS**.

R14 self-check: 7/7 PASS. No re-litigation required; proceed to
EXECUTE.

## D2 trigger judgment

Per ADR-0007 D2 + ADR-0011 D2 row table.

| Row | Description | Hit? | Evidence |
|---|---|---|---|
| 1 | Contract change (`packages/*/CONTRACT.md` OR `apps/*/CONTRACT.md`) | **HIT** | `apps/site/CONTRACT.md` 3 sections updated (placeholder tier framer + Pyodide CDN forward-pointer). |
| 2 | Package add/remove | NO | No `package.json` / workspace add. |
| 3 | Cross-package shape (block-foundation / mdx-bridge / heavy-block-boundary core types) | NO | Only consumer-side island rewrites; no boundary type / shape changes. |
| 4 | NEW ADR or substantive ADR amendment | **HIT** | ADR-0014 v0.4 amendment: NEW D11 + AC#16 carve-out. |
| 5 | Cross 3+ packages | NO | apps/site only (3 islands + CONTRACT + 1 test) + 1 ADR doc. |
| 6 | Public TS API surface widen / narrow | NO | `componentsMap` 8-key surface unchanged. |
| 7 | Spec / agent-contract / CLAUDE.md change | NO | No edits. |
| 8 | CI / deploy / auth / security | NO | No `astro.config.mjs` / `pnpm-lock.yaml` / hooks change. |

**Verdict**: Row 1 + Row 4 BOTH HIT → **PRE-COMMIT CLAUDE REVIEW (D1
stage 4) FIRES**. Stage 3 codex-pr-reviewer-55 still runs first.

## Risk register

1. **Astro hydration regression** — `client:load` still fires on the 3
   Astro wrappers; the React island has no `useEffect` / state, so
   hydration is a no-op but the React tree still mounts. Risk: any
   future hydration check (e.g. `data-loaded='true'` set by an effect)
   would not fire. **Mitigation**: placeholder emits `data-loaded='true'`
   STATICALLY in the JSX (NOT via `useEffect`); AC#16 poll
   trivially passes on first paint; vitest TC1-3 verify ARIA on
   render output (no async wait); playwright AC#5 + AC#16 CI runs
   confirm production behavior.
2. **Skeleton CSS visual drift** — placeholder reuses
   `.heavy-block-skeleton` CSS but content is different (🔌 + label
   vs spinner). Visual baseline screenshot will diverge from Wave 4
   B7 baseline. **Mitigation**: visual smoke baseline assertion is
   deferred to Stage C.3-5 (per Wave 5 plan v1.0 §492); C.1-1 commits
   NO visual baseline change. State this carve-out explicitly here.
3. **componentsMap signature drift** — `apps/site/CONTRACT.md` L88-98
   invariant ("8 canonical PascalCase keys"). **Mitigation**: keys
   unchanged; only island internals + CONTRACT.md prose update.
   AC#5 enforces `git diff main -- apps/site/src/components.ts |
   wc -l == 0`.
4. **`/sample-blocks-astro` route still loads real `.astro` package
   variants** — Wave 5 Stage C.1 close criterion ("heavy block 3
   surfaces 显示 plugin placeholder") applies to MDX componentsMap
   path only; the alternate consumer surface
   (`apps/site/src/pages/sample-blocks-astro.astro`) directly uses
   `packages/block-{jupyter,nn-viz,agent-flow}/src/ui-default/*.astro`
   variants which are NOT changed by this PR. **Mitigation**: explicit
   carve-out in `## Out of scope`; document that
   `/sample-blocks-astro` route still hits real heavy components
   (alternate consumer surface; no Stage C.1 obligation; Phase 2+ may
   align via a future PR).
5. **Pyodide CDN paragraph in apps/site/CONTRACT.md** — reframe v2
   mandates C-1 CDN infrastructure stays. **Mitigation**: PRESERVE
   `cdn.jsdelivr.net/pyodide/v0.27.7` paragraph + CSP guidance;
   prepend Phase 2+ forward-pointer framer; AC#6 enforces
   `grep -F 'cdn.jsdelivr.net/pyodide/v0.27.7' apps/site/CONTRACT.md`.
6. **AC#16 relaxation could mask a future plugin-real-runtime tier
   regression** — placeholder satisfies AC#16 trivially (always
   `aria-busy='false'`); a future tier change that breaks the real
   `aria-busy='true'→'false'` transition wouldn't be caught by the
   relaxed assertion. **Mitigation**: amendment text PRESERVES the
   original AC#16 contract for the real-runtime tier verbatim; the
   carve-out is explicitly tier-scoped ("Wave 5 placeholder tier
   satisfies …; Phase 2+ real-runtime tier exercises …"); future tier
   reactivation revives the original assertion automatically because
   the spec already requires the transition for that tier.
7. **ADR-0014 doc length growth** — file 640 LOC at HEAD; +70 LOC v0.4
   amendment lands at ~710 LOC. `pnpm size-check` does NOT scan
   markdown (`scripts/check-size-limits.mjs` `EXTENSIONS` regex covers
   only `ts|tsx|js|mjs|jsx|py|astro|svelte`); markdown is exempt.
   No mitigation needed.
8. **R14 self-check 7th item — Wave 4 reframe v2 memory traceability**
   — design lock cited at `~/.claude/projects/.../project_wave4_reframe_v2.md`
   is a user-local memory file (not in repo). PR.md cites this for
   reviewer context but does NOT introduce broken markdown links per
   memory `feedback_lychee_user_local_paths.md` (use prose + tilde-path
   inside backticks; NO markdown link form). **Mitigation**: this
   PR.md cites memory as plain prose; lychee link-check unaffected.

## Out of scope (deferred — explicit list)

- **C.1-2** PDF iframe 黑屏 + chunk-leak measure (next PR in Stage
  C.1; per Wave 5 plan v1.0 §460 row C.1-2).
- **C.1-3** `apps/site/test-results/` gitignore housekeeping (third
  PR in Stage C.1; per §461 row C.1-3 + ADR-0015 D3).
- **ADR-0014 v0.5 amendment** (HeavyBlockBoundary grid-context dims;
  Stage C.2-7 per §475).
- **ADR-0018 OKLCH token consumption by placeholder** (Stage C.3 +
  ADR-0014 v0.5 follow-up; ADR-0018 D3 forward-pointer at L154). The
  NEW BEM modifier `.heavy-block-skeleton--placeholder` reserves the
  hook; v0.4 ships NO rules under it.
- **`/sample-blocks-astro` route** + direct `.astro` package
  consumers — alternate consumer surface; not Stage C.1 close
  obligation; Phase 2+ may align.
- **`packages/heavy-block-boundary/**` refactor** — Wave 4 lock; v0.5
  amendment in Stage C.2 will touch.
- **`packages/block-{jupyter,nn-viz,agent-flow}/**` runtime** —
  preserved unchanged for Phase 2+ plugin-real-runtime tier; only the
  apps/site island consumer rewires.
- **Visual smoke baseline screenshot regen** — deferred to Stage
  C.3-5 per Wave 5 plan v1.0 §492.
- **Plugin-real-runtime tier reactivation** — Phase 2+ scope; v0.4
  amendment includes a "Phase 2+ migration sketch" stub but ships no
  feature flag / conditional tier code.
- **Downstream prose drift accept-defer** (per Stage 3 reviewer
  advisory #3, 2026-05-04): `content/notes/sample-blocks/index.mdx`
  + `packages/block-foundation/CONTRACT.md` still describe real
  `HeavyBlockBoundary` hydration. ADR-0014 v0.4 carve-out (NEW D11
  + AC#16 carve-out paragraph) is the authoritative forward-pointer
  for the plugin tier split; downstream prose update will land as
  a follow-up PR within Stage C.1 / C.2 (or in C.3 visual identity
  PR if collocated with related copy refresh). Not blocking C.1-1
  acceptance because the ADR carve-out captures the contract change
  in a single source.

## executor

- **Stage 1 PLAN**: pr-writer Claude subagent (this dispatch). Output
  = locked PR.md.
- **Stage 2 EXECUTE**: `codex-generic-executor` (`--yolo` profile;
  per Wave 4 + Wave 5 plan v1.0 D6). The codex executor reads PR.md +
  writes the 3 island rewrites + NEW vitest + ADR-0014 v0.4
  amendment + CONTRACT prose update. TDD-front: write failing vitest
  first → impl → vitest PASS. Audit log path:
  `docs/audits/codex-runs/2026-05-04-C.1-1-execute.txt` (per memory
  `feedback_codex_audit_log_recursion.md` watchdog kill at ~500 KB).
- **Stage 3 REVIEW**: `codex-pr-reviewer-55` (5.5). 8-point checklist
  + spec match. Audit log path:
  `docs/audits/codex-runs/2026-05-04-C.1-1-review.txt`.
- **Stage 4 PRE-COMMIT CLAUDE REVIEW**: orchestrator-self (D2 row 4
  + row 1 fires; mitigates same-model echo chamber for substantive
  ADR amendment + CONTRACT prose change).
- **Stage 5 COMMIT**: reviewer codex with ADR-0006 D8 explicit-file-list
  staging discipline (see `## Codex commit (D1 stage 5) staging`
  below).
- **Stage 6 ACCEPT**: pr-writer second invocation. Read PR.md
  `acceptance:` block + run `verification required` table + verify
  diff matches each AC#. ACCEPT or REJECT-with-residue.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging + memories
`feedback_git_operator_explicit_stage` +
`feedback_git_operator_ci_verification`. Reviewer codex (NOT
pr-writer; ADR-0011 D1+D4 git mutation discipline) runs:

1. **Reset stage**: `git reset HEAD` (clear any prior partial stage).
2. **Add explicit whitelist**:
   ```bash
   git add \
     apps/site/src/islands/JupyterIsland.tsx \
     apps/site/src/islands/NnVizIsland.tsx \
     apps/site/src/islands/AgentFlowIsland.tsx \
     apps/site/src/__tests__/heavy-block-plugin-placeholder.test.ts \
     apps/site/CONTRACT.md \
     docs/decisions/ADR-0014-heavy-block-boundary.md \
     docs/plans/wave-5-main/C.1-1-heavy-block-plugin-placeholder.md
   ```
   **NEVER** `git add -A` / `git add .` (per memory rule). 7 explicit
   paths only.
3. **Verify staged scope**: `git diff --cached --stat`. Expected: 7
   paths above; NO `pnpm-lock.yaml`; NO Astro wrappers
   (`apps/site/src/components/*.astro` unchanged); NO
   `apps/site/src/components.ts` (unchanged); NO
   `packages/**/*` files; total `{changed-lines}` ≤ 500. If diff
   includes anything outside the whitelist, abort + restore + ask
   orchestrator.
4. **Lockfile contamination scan** (per memory): if
   `pnpm-lock.yaml` shows in cached diff, restore from clean
   historical blob: `git restore --source=main --staged --worktree
   pnpm-lock.yaml`. Re-verify step 3.
5. **Pre-push uncached typecheck** (per memory
   `feedback_git_operator_ci_verification`): `pnpm typecheck` (NOT
   cached via turbo) before push to catch tsc errors that vitest +
   turbo cache miss.
6. **Commit + push**: standard squash-friendly commit message
   following Wave 5 plan v1.0 commit style. Subject prefix
   `Wave 5 C.1-1 — `. Include `ADR-0014 v0.4` token in body for
   future grep.
7. **CI verification**: `gh run view --json conclusion --jq .conclusion`
   on push (NOT `gh run watch --exit-status`; per memory). If
   `success` → push gate; orchestrator merges via `gh pr merge --squash
   --delete-branch` per memory `feedback_wave3_auto_merge` Wave 3
   auto-merge directive carried into Wave 4+5.

## Related

- [Wave 5 plan v1.0](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  §192-225 (Stage C.1 scope-fence) + §455-463 (Stage C.1 PR breakdown
  table; row C.1-1 is this PR's authoritative scope).
- [ADR-0014 heavy-block-boundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  v0.3 D10 (production hydration boundary; preserved by placeholder
  tier) + AC#16 (relaxed via v0.4 carve-out) + this PR's v0.4
  amendment landing site.
- [ADR-0018 v2 visual migration](../../decisions/ADR-0018-v2-visual-migration.md)
  D3 (kind hue token forward-pointer; OKLCH consumption deferred to
  Stage C.3 + ADR-0014 v0.5; placeholder tier ships NO OKLCH at v0.4).
- [ADR-0015 D3](../../decisions/ADR-0015-wave-4-close.md)
  Stage C residue context + Wave 5 deferred set classification.
- [ADR-0016 grid 数据模型](../../decisions/ADR-0016-grid-data-model.md)
  W5-1 invariant (Stage C.2 scope; not touched by this PR).
- [ADR-0017 drag/drop UX](../../decisions/ADR-0017-drag-drop-ux.md)
  Stage C.2 scope; not touched.
- [Wave 4 B7](../wave-4-main/B7-heavy-block-hydration.md) (squash
  HEAD `794cd5d`) — predecessor PR that wired the 3 islands to real
  `HeavyBlockBoundary` + dynamic `load`; this PR (C.1-1) replaces
  that wiring with the placeholder tier (Phase 2+ may resurface B7's
  pattern as the `plugin-real-runtime` tier).
- [Wave 4 PR #48](https://github.com/WYI1223/selfKnowledgeBaseWeb/pull/48)
  squash HEAD `de39e07` — C-1 Pyodide jsdelivr CDN infrastructure
  preserved unchanged for Phase 2+ plugin-real-runtime tier (per
  reframe v2 memory mandate).
- Reframe v2 memory at user-local
  `~/.claude/projects/-home-weiyi-selfKnowledgeBaseWeb/memory/project_wave4_reframe_v2.md`
  (2026-05-03 gatekeeper directive; codifies "🔌 plugin" placeholder
  as Wave 5 MVP path; cited as prose per memory
  `feedback_lychee_user_local_paths` — not as markdown link).
- [`apps/site/CONTRACT.md`](../../../apps/site/CONTRACT.md) (touched).
- [`apps/site/src/lib/mdx-adapter.ts`](../../../apps/site/src/lib/mdx-adapter.ts)
  — `FlatProps` import target; not modified.
- Memories applied: `feedback_codex_stdin` (codex `< /dev/null`),
  `feedback_codex_spark_lint_gap` (lint after spark), `feedback_codex_audit_log_recursion`
  (audit log path + watchdog), `feedback_lychee_line_anchor` +
  `feedback_lychee_npmjs_403` + `feedback_lychee_user_local_paths` +
  `feedback_lychee_autolink_in_backticks` (lychee discipline),
  `feedback_git_operator_explicit_stage` +
  `feedback_git_operator_ci_verification` (commit staging),
  `feedback_wsl2_chromium_launch` (playwright AC#16 CI canonical),
  `feedback_wave3_auto_merge` (orchestrator merges post ACCEPT-PASS).
