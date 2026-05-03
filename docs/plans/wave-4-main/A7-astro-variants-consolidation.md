# A7 — 5×.astro variants consolidation (Wave 3 C4a + C4b carry-over; one direct-Astro-consumer page + per-variant smoke + per-variant revert plan)

> **Wave 4 Stage A seventh implementation PR.** Closes Wave 3 carry-overs
> C4a (3 missing block Astro variants math / pdf / jupyter) + C4b (2 heavy
> block Astro variants nn-viz / agent-flow) by adding a single new
> `apps/site` page (`apps/site/src/pages/sample-blocks-astro.astro`) that
> imports + renders all 5 SSR `.astro` variants
> (`packages/block-{math,pdf,jupyter,nn-viz,agent-flow}/src/ui-default/<Kind>.astro`)
> via their existing `package.json` `exports` subpath maps (already shipped:
> `"./ui-default/Math.astro"`, `"./ui-default/Pdf.astro"`,
> `"./ui-default/Jupyter.astro"`, `"./ui-default/NnViz.astro"`,
> `"./ui-default/AgentFlow.astro"`). The page wraps each variant in its
> own `<section>` under `BaseLayout`, mirrors realistic example props from
> `content/notes/sample-blocks/index.mdx` where possible (Math: Euler's
> identity inline + integral display; Pdf: `whitepaper.pdf` page 1; Jupyter:
> numpy snippet with `showLineNumbers=true`; NnViz: 3-layer input/hidden/
> output topology; AgentFlow: 3-node start/process/end graph with 2 edges),
> and proves that the 5 previously-orphan SSR variant files now reach a
> live build target. **The 5 .astro variant files themselves are
> byte-unchanged** — A7 is a pure consumer-side wiring PR; the variants
> are package-owned authority and only their consumers (and the existing
> editor surfaces, untouched here) may reference them. **NOTE on heavy /
> light asymmetry**: A5 + A6 made `Jupyter` / `NnViz` / `AgentFlow` consumed
> in `apps/site/src/components.ts` via `HeavyBlockBoundary` (lazy
> `client:only` islands per ADR-0014) on the **MDX route**
> (`/notes/sample-blocks` via `componentsMap`); A7 demonstrates the
> **alternative direct-Astro-page pattern** — pure SSR render of the
> heavy-block `.astro` placeholders WITHOUT the React hydration boundary
> (the JupyterAstro / NnVizAstro / AgentFlowAstro emit static placeholder
> markup per their own file headers — see Jupyter.astro lines 2-15
> "kernel runs CLIENT-SIDE only" + NnViz.astro lines 11-15 "model 在客户端
> hydration 后由 NnViz.tsx 加载" + AgentFlow.astro lines 5-17 "React Flow
> needs a DOM and runs CLIENT-SIDE only"; the SSR HTML is a static
> placeholder; no Pyodide / TF.js / React Flow runtime cost on this page).
> Per-variant render smoke comes via NEW playwright spec
> `apps/site/playwright/sample-blocks-astro.spec.ts` (~30 LOC, 1 test,
> WSL2-skip via the same `isWsl2()` helper used in `search.spec.ts` +
> `heavy-block-layout-shift.spec.ts`); per-variant compile-time smoke
> via NEW vitest `apps/site/src/__tests__/sample-blocks-astro-page.test.ts`
> (~90 LOC, 12 tests source-grepping 5 variant import paths, BaseLayout,
> and 6 named-prop invocations). **Per-variant revert plan documented below in
> `## Revert plan`** — if any one variant fails build OR fails its render
> smoke, executor (or a follow-up forward-fix PR) comments out THAT
> single `<section>` block in the new page + commits, isolating the
> variant without holding back the other four (per plan-challenger Q1 +
> C3 absorbtion at Pre-A3 lock). AC coverage: A7 satisfies the Wave 3
> C4a + C4b carry-over deliverable + Wave 4 plan A7 acceptance bullets
> (per-variant compile + render smoke + revert steps); ADR-0014 AC#1-#15
> baseline preserved unchanged (TC verifies empty diff across boundary
> source + 3 heavy-block source + 5 .astro variant source + components.ts
> + ADR-0014 + lockfile). Standard ADR-0011 D1 pipeline
> (codex-generic-executor EXECUTE — NOT codex-block-generator despite
> Wave 4 plan line 246 wording, because a generic multi-file integration
> + test wiring is multi-file integration work, not template-clone
> scaffolding work; the 5 .astro variants ALREADY EXIST so no clone
> needed; codex-pr-reviewer-55 REVIEW + COMMIT; **PRE-COMMIT CLAUDE
> REVIEW NOT MANDATORY** per D2 no-row hit; pr-writer ACCEPT). ADR-0014
> is **NOT modified** (status remains `proposed`; A8 promotes per Stage
> A close gate); apps/site/CONTRACT.md is **NOT modified** (the new page
> is self-documenting via filename + section headers; explicit
> `## Astro variants` section is documentation overhead unjustified by
> a single demo page — see `## D2 trigger judgment` below).

## title

Wire the 5 existing SSR `.astro` block variants
(`packages/block-{math,pdf,jupyter,nn-viz,agent-flow}/src/ui-default/<Kind>.astro`,
orphan since Wave 2 ship + Wave 3 close) into `apps/site` via a single
NEW direct-Astro-consumer page
`apps/site/src/pages/sample-blocks-astro.astro` (route
`/sample-blocks-astro`) that imports each variant from its package's
existing `./ui-default/<Kind>.astro` subpath export and renders each in
its own `<section>` under `BaseLayout`. Realistic example props mirror
`content/notes/sample-blocks/index.mdx`: Math = Euler's identity inline
(`expression="e^{i\pi} + 1 = 0"`) + integral display
(`expression="\int_{-\infty}^{\infty} e^{-x^{2}} \, dx = \sqrt{\pi}"
display`); Pdf = `<Pdf src="/sample-assets/whitepaper.pdf" page={1} />`;
Jupyter = numpy snippet with `code` + `showLineNumbers={true}`; NnViz =
3-layer topology `[{name:'input',units:4,activation:'linear'},
{name:'hidden',units:8,activation:'relu'},
{name:'output',units:2,activation:'softmax'}]`; AgentFlow = 3-node graph
with 2 edges (start → process → end), each node carrying the required
`{ id, label, type, position: {x, y} }` shape per
`packages/block-agent-flow/src/core/serialize.ts` lines 12-17 +
`AgentFlowEdge` `{ id, source, target, label? }` per lines 19-24. Per-variant
compile-time smoke via NEW vitest
`apps/site/src/__tests__/sample-blocks-astro-page.test.ts` (12 tests:
5 verify the import paths; 1 verifies BaseLayout; 6 verify named-prop
variant invocations, source-grep style
because Astro's compiled output is not directly inspectable from vitest
without an Astro test renderer). Per-variant render-time smoke via NEW
playwright spec `apps/site/playwright/sample-blocks-astro.spec.ts`
(1 test asserting the page renders + each `[data-block="<kind>"]`
selector resolves to >= 1 visible element, where the 5 selectors `math`
/ `pdf` / `jupyter` / `nn-viz` / `agent-flow` come from the .astro
variant files' static markup: Math.astro line 19
(`<Tag data-block="math">`), Pdf.astro line 19 via the `renderPdf`
descriptor's `data-block: 'pdf'` literal at
`packages/block-pdf/src/ui-default/render-pdf.ts`, Jupyter.astro line
26 (`<div data-block="jupyter">`), NnViz.astro line 33
(`<div data-block="nn-viz">`), AgentFlow.astro lines 32 / 36
(`<div data-block="agent-flow">` in both errored + idle branches);
WSL2-skip pattern via `isWsl2()` helper VERBATIM-COPIED from
`apps/site/playwright/search.spec.ts` lines 5-15 + the same helper just
duplicated in `apps/site/playwright/heavy-block-layout-shift.spec.ts`
per A6's "prefer duplication over premature abstraction" precedent.
NOTE: the `data-block="jupyter"` / `"nn-viz"` / `"agent-flow"` selectors
on this NEW page resolve to the **.astro variant's own outer div**
(direct SSR render — NOT the React `HeavyBlockBoundary` wrapper that
also emits `data-block="<kind>"` on the existing
`/notes/sample-blocks` MDX route via `apps/site/src/components.ts`); the
two consumer surfaces share the `data-block` attribute by design (it is
the cross-pre/post-hydration stable selector per
`packages/heavy-block-boundary/CONTRACT.md` invariant + each .astro file
header). The NEW page's URL `/sample-blocks-astro` is distinct from
`/notes/sample-blocks` (the MDX route) so the two coexist; playwright
selectors are scoped to the test's `page.goto` URL so no cross-route
selector clash. Bundles A6 row backfill + A7 row + Stage A pointer flip
into `docs/plans/active.md` per the one-row-per-PR cadence (4 edits).
Standard ADR-0011 D1 pipeline (executor + reviewer same as A6;
PRE-COMMIT CLAUDE REVIEW SKIPPED per D2 no-row hit). AC coverage in A7:
**Wave 3 C4a + C4b carry-over** newly closed (5 .astro variants now
reach a live build target via the new direct-Astro-consumer page);
**ADR-0014 AC#1-#15** A2+A3+A4+A5+A6 baseline preserved unchanged (TC
verifies empty diff across boundary source + 3 heavy-block source + 5
.astro variant source + components.ts + ADR-0014 + lockfile).
**Out of scope for A7** (per locked Wave 4 plan): selective per-block
chunking + perf baseline (C5 carry-over) + ADR-0014 promotion
`proposed → accepted` → A8 (Stage A close).

## files

Modified + new (canonical count in the line below; NO collateral
graduations expected: A7 adds NO deps to any `package.json`,
`pnpm-lock.yaml` stays byte-unchanged — `astro` + `@playwright/test` +
`vitest` are already in `apps/site/{dependencies,devDependencies}` per
Wave 3 D-stage installs; the 8 `@skb/block-*` workspace deps are already
in `apps/site/dependencies` per Wave 1+2; the 5 `./ui-default/<Kind>.astro`
subpaths are already exposed via each block package's `exports` map in
its `package.json` per the Wave 2 ship + Wave 3 close — verified
PLAN-time via the 5 `grep "ui-default/.*\.astro"` hits across the 5
package.json files. This PR.md remains self-listed per ADR-0006 D8
strict whitelist + Pre-A1+A2+A3+A1+A2+A3+A4+A5+A6 precedent that
pr-writer must include the PR.md in the canonical file list at PLAN
time):

- `apps/site/src/pages/sample-blocks-astro.astro` — **NEW** (~50 LOC).
  The single direct-Astro-consumer page. Frontmatter imports BaseLayout
  via `@layouts/BaseLayout.astro` (the existing tsconfig.json `paths`
  alias at `apps/site/tsconfig.json` lines 6-9; same import shape as
  `apps/site/src/pages/index.astro` line 3). Imports each .astro variant
  via its package subpath:
  ```astro
  ---
  import BaseLayout from '@layouts/BaseLayout.astro';
  import Math from '@skb/block-math/ui-default/Math.astro';
  import Pdf from '@skb/block-pdf/ui-default/Pdf.astro';
  import Jupyter from '@skb/block-jupyter/ui-default/Jupyter.astro';
  import NnViz from '@skb/block-nn-viz/ui-default/NnViz.astro';
  import AgentFlow from '@skb/block-agent-flow/ui-default/AgentFlow.astro';

  // Realistic AgentFlow fixture (3 nodes + 2 edges); each node has
  // `{ id, label, type, position: {x,y} }` per AgentFlowNode at
  // packages/block-agent-flow/src/core/serialize.ts lines 12-17.
  // Each edge has `{ id, source, target, label? }` per AgentFlowEdge
  // lines 19-24.
  const sampleAgentFlow = {
    nodes: [
      { id: 'start', label: 'Start', type: 'agent', position: { x: 0, y: 0 } },
      { id: 'process', label: 'Process', type: 'tool', position: { x: 200, y: 0 } },
      { id: 'end', label: 'End', type: 'memory', position: { x: 400, y: 0 } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'process' },
      { id: 'e2', source: 'process', target: 'end' },
    ],
  };
  ---

  <BaseLayout title="Sample Blocks (Astro variants)">
    <h1>Astro Variants Showcase</h1>
    <p>
      Direct SSR consumption of the 5 <code>.astro</code> block variants
      from their workspace packages (Wave 3 C4a + C4b carry-over).
    </p>

    <section>
      <h2>Math</h2>
      <Math expression="e^{i\pi} + 1 = 0" />
      <Math expression="\int_{-\infty}^{\infty} e^{-x^{2}} \, dx = \sqrt{\pi}" display={true} />
    </section>

    <section>
      <h2>PDF</h2>
      <Pdf src="/sample-assets/whitepaper.pdf" page={1} />
    </section>

    <section>
      <h2>Jupyter</h2>
      <Jupyter code={`import numpy as np
print('hello')`} showLineNumbers={true} />
    </section>

    <section>
      <h2>NN-Viz</h2>
      <NnViz layers={[
        { name: 'input', units: 4, activation: 'linear' },
        { name: 'hidden', units: 8, activation: 'relu' },
        { name: 'output', units: 2, activation: 'softmax' },
      ]} />
    </section>

    <section>
      <h2>Agent Flow</h2>
      <AgentFlow nodes={sampleAgentFlow.nodes} edges={sampleAgentFlow.edges} />
    </section>
  </BaseLayout>
  ```
  Notes for executor:
  (a) `AgentFlowNode.type` is a 4-way union `'agent' | 'tool' | 'memory'
  | 'router'` per `serialize.ts` line 15 — the fixture above uses 3 of
  the 4 (`agent`, `tool`, `memory`); EXECUTE-time the prop literal must
  type-check against the imported `AgentFlowNode` shape (Astro is
  TypeScript-aware in the frontmatter `---` block).
  (b) `NnViz` `layers` items must conform to the inline `LayerProp`
  type at `NnViz.astro` lines 18-22 (`name: string; units: number;
  activation: 'relu' | 'softmax' | 'sigmoid' | 'tanh' | 'linear'`).
  (c) `Pdf` route paths `/sample-assets/whitepaper.pdf` may 404 at
  runtime if the asset is not yet shipped to `apps/site/public/sample-assets/`
  (Wave 4 plan B-stage scope per gatekeeper smoke #8 sample-assets ship);
  the page still SSR-renders cleanly because `renderPdf` only emits an
  `<iframe src=...>` markup string — the iframe's 404 is a runtime
  network condition, not a build error. The playwright render smoke
  (TC3) asserts the `[data-block="pdf"]` selector resolves to the
  outer `<div>`, NOT that the iframe successfully loads — so the smoke
  passes even pre-asset-ship.
  (d) The `<Math>` invocation uses `expression="..."` literal strings
  containing LaTeX backslash escapes; Astro's frontmatter is JS — the
  prop value must be a JS string literal. The `e^{i\pi} + 1 = 0`
  example uses a single backslash that JS parses as the literal
  character pair `\p` (since `\p` is not a JS escape sequence; the
  backslash is preserved literally per ECMA-262 §11.8.4.1). Verify
  EXECUTE-time via TC4 (typecheck) + TC2 (`pnpm --filter @skb/site
  build` PASS — KaTeX accepts the literal string identically to the
  way `index.mdx` line 92 supplies it).
  (e) DO NOT add `client:*` directives to ANY of the 5 variants — the
  whole point of the direct-Astro-consumer page is to demonstrate
  **pure SSR with no React hydration cost** for the .astro variants
  (the heavy variants Jupyter / NnViz / AgentFlow render only their
  static skeleton placeholder per their file headers; the React-side
  runtime is consumed via the SEPARATE `/notes/sample-blocks` MDX
  route via `componentsMap` per A5's HeavyBlockBoundary wrapping; A7's
  page is the alternative pure-SSR consumer surface).
  Total target ~50 LOC including frontmatter + body + comments.
  Hard-cap 200 LOC (the 200/300/500 LOC tiers per CLAUDE.md Hard rule
  #1; A7's page is well under target).

- `apps/site/src/__tests__/sample-blocks-astro-page.test.ts` — **NEW**
  (~90 LOC). Vitest source-grep smoke verifying the page file contains
  the 5 expected import paths + BaseLayout import/usage + 6 expected
  named-prop variant invocations (Math inline, Math display, Pdf,
  Jupyter, NnViz, AgentFlow). **Why source-grep + not an Astro test renderer**:
  vitest cannot directly render `.astro` files without an Astro test
  adapter (Astro's compiler is build-time integrated — `apps/site` does
  NOT pull in `@astrojs/test-utils` or equivalent today; A7 deliberately
  avoids adding a NEW test toolchain). The compile-time smoke is
  source-shape verification (file contains the expected imports + uses);
  the **runtime render-time smoke** is delegated to TC3 (the playwright
  spec) which exercises the actual `astro build` output via
  `astro preview`. Test layout (12 tests, organized by what they grep):
  ```typescript
  import { describe, expect, it } from 'vitest';
  import { readFileSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';

  const PAGE_PATH = fileURLToPath(
    new URL('../pages/sample-blocks-astro.astro', import.meta.url),
  );

  describe('A7 sample-blocks-astro page', () => {
    const src = readFileSync(PAGE_PATH, 'utf-8');

    it('imports Math.astro from @skb/block-math', () => {
      expect(src).toContain("from '@skb/block-math/ui-default/Math.astro'");
    });
    it('imports Pdf.astro from @skb/block-pdf', () => {
      expect(src).toContain("from '@skb/block-pdf/ui-default/Pdf.astro'");
    });
    it('imports Jupyter.astro from @skb/block-jupyter', () => {
      expect(src).toContain("from '@skb/block-jupyter/ui-default/Jupyter.astro'");
    });
    it('imports NnViz.astro from @skb/block-nn-viz', () => {
      expect(src).toContain("from '@skb/block-nn-viz/ui-default/NnViz.astro'");
    });
    it('imports AgentFlow.astro from @skb/block-agent-flow', () => {
      expect(src).toContain("from '@skb/block-agent-flow/ui-default/AgentFlow.astro'");
    });
    it('uses BaseLayout for site chrome', () => {
      expect(src).toContain("from '@layouts/BaseLayout.astro'");
      expect(src).toContain('<BaseLayout title="Sample Blocks (Astro variants)">');
    });
    it('invokes inline Math with expression prop', () => { ... });
    it('invokes display Math with String.raw LaTeX expression', () => { ... });
    it('invokes Pdf with src and page props', () => { ... });
    it('invokes Jupyter with code and showLineNumbers props', () => { ... });
    it('invokes NnViz with layers prop', () => { ... });
    it('invokes AgentFlow with nodes and edges props', () => { ... });
  });
  ```
  Test count = **12** (5 imports + 1 BaseLayout + 6 named-prop
  invocation tests). The prop assertions stay split per variant so TC15
  can count the expected review surface directly.
  Source-grep approach is identical in shape to
  `apps/site/src/__tests__/components-map.test.ts` Wave 3 D2 baseline
  (read the consumer file + assert imports + assert usage shape) per
  the cross-package consumer pattern at
  `feedback_cross_package_consumer_pattern` (verify imports + assert
  consumer shape rather than re-implementing the producer's logic).

- `apps/site/playwright/sample-blocks-astro.spec.ts` — **NEW** (~30
  LOC). Single render-time smoke test that navigates to
  `/sample-blocks-astro` (the new page's filename-based route per
  Astro's file router) and asserts: (a) the page renders (`<h1>` is
  visible); (b) all 5 `[data-block="<kind>"]` selectors each resolve
  to >= 1 visible element. WSL2-skip via the same `isWsl2()` helper
  shape:
  ```typescript
  import { execFileSync } from 'node:child_process';
  import os from 'node:os';
  import { expect, test } from '@playwright/test';

  function isWsl2(): boolean {
    if (/microsoft|wsl/i.test(os.release())) {
      return true;
    }
    try {
      return /microsoft|wsl/i.test(
        execFileSync('uname', ['-r'], { encoding: 'utf8' }),
      );
    } catch {
      return false;
    }
  }

  test.skip(isWsl2(), 'Chromium launch is unreliable under WSL2 in this repo');

  test('A7 sample-blocks-astro page renders all 5 .astro variants', async ({ page }) => {
    await page.goto('/sample-blocks-astro');

    // Page chrome
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });

    // Per-variant render smoke: each .astro emits a [data-block="<kind>"]
    // outer container in its static markup:
    //   - Math.astro line 19         → data-block="math"
    //   - Pdf.astro (via renderPdf)  → data-block="pdf"
    //   - Jupyter.astro line 26      → data-block="jupyter"
    //   - NnViz.astro line 33        → data-block="nn-viz"
    //   - AgentFlow.astro line 32/36 → data-block="agent-flow" (errored OR idle branch)
    for (const kind of ['math', 'pdf', 'jupyter', 'nn-viz', 'agent-flow'] as const) {
      const locator = page.locator(`[data-block="${kind}"]`).first();
      await expect(locator).toBeVisible({ timeout: 10_000 });
    }
  });
  ```
  Helper duplicated VERBATIM from `search.spec.ts` lines 5-15 +
  `heavy-block-layout-shift.spec.ts` (A6 precedent: 2 prior copies
  exist); A7 introduces a 3rd copy. Wave 4+ (or the upcoming Wave 4
  retrospective B5b) may extract the helper to
  `apps/site/playwright/_lib/` if a 4th consumer materializes; A7
  defers the abstraction per the existing precedent. The `as const`
  array literal makes the 5 selector strings type-narrow at compile
  time. The `[data-block="agent-flow"]` selector resolves to either
  the errored OR idle branch of `AgentFlow.astro` (lines 32 vs 36);
  the test fixture's 3-node + 2-edge graph is well-formed so the
  idle branch is the expected match in CI, but the test passes either
  way (the data-block attribute is present in BOTH branches).
  Stays well under 100 LOC (target ~30 LOC).

- `docs/plans/wave-4-main/A7-astro-variants-consolidation.md` —
  **NEW** (this PR.md). Self-listed per ADR-0006 D8 strict whitelist
  (PR #1 R2 lesson; carried through Wave 3 + Pre-A1+A2+A3 + A1 + A2 +
  A3 + A4 + A5 + A6).

- `docs/plans/active.md` — **MODIFIED**. Apply 4-edit bookkeeping:
  (1) the A6 row at line 20 (`| #TBD (this) | TBD | A6 | playwright
  T0/T1 zero-layout-shift test (AC#5) |`) gets its squash HEAD filled
  with `95ba33b` per the gh PR #36 merged-status (`gh pr view 36
  --json mergeCommit -q .mergeCommit.oid` confirmation at PLAN time;
  the orchestrator's brief notes `13d34f1` (R1) + `d303f4e` (R2) →
  squash HEAD `95ba33b`) — `#TBD → #36`; `TBD → 95ba33b`;
  (2) a NEW A7 row inserted between the A6 row and the Stage A
  remaining row (`| #TBD (this) | TBD | A7 | 5×.astro variants
  consolidation (Wave 3 C4a/C4b carry-over) |`); (3) the Stage A
  remaining row at line 21 decrements: `A7-A8 (2 PRs)` → `A8 (1 PR
  — Stage A close)`; (4) the next-PR pointer at line 6 + line 81
  flips from "Stage A7 (5×.astro variants consolidation; Wave 3
  C4a/C4b carry-over)" to "Stage A8 (Phase 2 chunking + perf
  baseline + ADR-0014 promote `proposed → accepted`; Stage A close)";
  the top-line phase summary on line 6 appends "+ A7" to the done
  list (Pre-A1 + Pre-A2 + Pre-A3 + A1 + A2 + A3 + A4 + A5 + A6 + A7
  done). All other content of `docs/plans/active.md` byte-unchanged.
  Collateral-drift slot: if executor finds the surrounding row
  sequence has shifted (e.g., a parallel PR added or removed rows),
  executor adapts the line-number references while preserving the
  documented edit semantics.

= **5 canonical files** (3 NEW source/test artifacts + 1 NEW PR.md
self-listed + 1 modified active.md). Larger than A6 (3 files) by
2 (the new page + the new vitest test); same scale as A4 (CSS +
a11y + CONTRACT consolidation).

**Explicitly NOT in canonical list (DO NOT touch — TC verifies empty
diff)**:

- `packages/block-math/src/ui-default/Math.astro` — A7 is a
  consumer; the variant is package-owned authority. TC8 verifies
  empty diff.
- `packages/block-pdf/src/ui-default/Pdf.astro` — same. TC8.
- `packages/block-jupyter/src/ui-default/Jupyter.astro` — same. TC8.
- `packages/block-nn-viz/src/ui-default/NnViz.astro` — same. TC8.
- `packages/block-agent-flow/src/ui-default/AgentFlow.astro` —
  same. TC8.
- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` (and
  any other source / CONTRACT.md file in the boundary package) —
  A7 does NOT use the React boundary on the new direct-Astro-consumer
  page (the page is pure SSR; the boundary is the React-island
  consumer surface for the MDX route). TC9 verifies empty diff.
- `packages/heavy-block-boundary/CONTRACT.md` — already consolidated
  at A4. A7 does not consume the boundary on the new page. TC9.
- `apps/site/src/components.ts` — A5 is the canonical consumer
  rewire per ADR-0014 D8 for the MDX route; A7's new page is a
  **separate route surface** with **no `componentsMap` involvement**
  (the .astro variants are imported directly per Astro's file-based
  routing, not through the React `componentsMap` indirection). TC10
  verifies empty diff.
- `packages/block-{jupyter,nn-viz,agent-flow}/**` (any non-.astro
  source file in the 3 heavy block packages) — A5 added the
  `heavyBoundaryDimensions` exports + CONTRACT.md bullets +
  package.json deps + tsconfig refs; A6 made zero source changes;
  A7 makes zero source changes (the page imports the .astro variants
  via the existing `exports` map; the heavy-boundary-dimensions
  exports are NOT imported by A7's new page since the page does NOT
  use the React boundary). TC11 verifies empty diff.
- `packages/block-{math,pdf}/**` (any non-.astro source file in the
  2 light block packages) — A7 imports the .astro variants via the
  existing `exports` map; the React `*View` exports + `core/` modules
  are NOT touched. TC11 verifies empty diff.
- `docs/decisions/ADR-0014-heavy-block-boundary.md` — status remains
  `proposed`; A8 promotes (TC12).
- `docs/decisions/ADR-0011-linear-pipeline-execution-model.md` — A7
  follows the existing D1 pipeline exactly; no execution-model change
  surfaces. (No TC; covered by no-edit assertion.)
- `apps/site/playwright.config.ts` — `testMatch` glob already
  includes `playwright/**/*.spec.ts` (line 5); the new spec file is
  picked up automatically. webServer reuses `astro build && astro
  preview`; A7 makes ZERO config changes (TC13).
- `apps/site/vitest.config.ts` — the existing vitest config picks
  up `src/__tests__/**/*.test.ts` automatically; A7 makes ZERO config
  changes. (No TC; covered by `pnpm --filter @skb/site test` PASS.)
- `apps/site/astro.config.mjs` — A7 adds NO `manualChunks` entries
  (the new page consumes 5 .astro variants statically — no async
  import boundaries; the page's bundle naturally contains the .astro
  template output + zero React runtime). C5 (Phase 2 chunking) is
  A8 scope. TC14 verifies empty diff.
- `apps/site/CONTRACT.md` — the new page is self-documenting via
  filename + section headers; no public surface change requires a
  CONTRACT prose edit (the existing CONTRACT.md `## Public surface`
  enumerates routes `/` and `/notes/<slug>`; the new
  `/sample-blocks-astro` route is a Wave 3 carry-over demo surface
  per the Wave 4 plan A7 § scope, not a public-API expansion that
  needs explicit contract documentation; A7's PR.md + the file
  itself are the documentation). See `## D2 trigger judgment` for
  the explicit reasoning. TC15 verifies empty diff.
- `apps/site/package.json` — the 8 `@skb/block-*` workspace deps +
  `astro` + `@playwright/test` + `vitest` are already present per
  Wave 1+2+3 installs. A7 adds NO new deps. TC16 verifies empty diff.
- `pnpm-lock.yaml` — A7 adds NO deps; lockfile byte-unchanged. TC17
  verifies empty diff.
- `.github/workflows/ci.yml` — the existing workflow runs `pnpm
  check` + `pnpm --filter @skb/site exec playwright test`; A7 adds
  a new spec but no CI config change. TC18 verifies empty diff.
- Any CONTRACT.md in any package — A7 makes ZERO CONTRACT.md
  changes anywhere. TC19 verifies empty diff.
- `content/notes/sample-blocks/index.mdx` — A7 reads the prop shapes
  from this fixture (Math: Euler's identity + integral; Pdf:
  whitepaper.pdf page 1; Jupyter: numpy snippet; etc.) but does NOT
  edit it. The MDX fixture continues to drive the
  `/notes/sample-blocks` MDX route via `componentsMap` (A5's
  HeavyBlockBoundary-wrapped React island consumer surface); A7's
  new direct-Astro-consumer page at `/sample-blocks-astro` is a
  parallel route. TC20 verifies empty diff.

## test_cases

A7 ships a single new page + 1 new vitest source-grep smoke + 1 new
playwright render smoke + 1 active.md bookkeeping update. Tests are
TDD-first per ADR-0011 D1 stage 2: write the new vitest tests first
(12 source-grep cases that fail because the page does not yet exist) →
write the new page until vitest 12/12 PASS → write the new playwright
spec (parameterized over 5 selectors; skip-by-design on WSL2 dev box;
will run in CI) → confirm `pnpm --filter @skb/site build` PASS (the
page reaches a live build target) → confirm `pnpm check` exit 0
workspace-wide.

- **TC1** (vitest source-grep smoke — 12 tests covering 5 import paths
  + BaseLayout + 6 named-prop invocations) Input: `pnpm --filter
  @skb/site test`. Expected: exit 0; the new
  `apps/site/src/__tests__/sample-blocks-astro-page.test.ts` PASSES
  with 12/12 green; existing apps/site vitest corpora
  (`components-map.test.ts`, `dims-source.test.ts`,
  `fouc-script.test.ts`, `lazy-chunking.test.ts`,
  `sample-blocks-page.test.ts`, `search-cjk.test.ts`,
  `search-reindex.test.ts`, `search-ui.test.ts`) still PASS unchanged.
  Location: shell at repo root.
- **TC2** (apps/site build clean — proves the orphan .astro files
  reach a live build target; KEY A7 acceptance per Wave 4 plan)
  Input: `pnpm --filter @skb/site build`. Expected: exit 0; `astro
  build` compiles the new `sample-blocks-astro.astro` page + emits
  `dist/sample-blocks-astro/index.html` (or equivalent per Astro's
  static output convention); the 5 .astro variant imports resolve
  via each block package's `package.json` `exports` map; the static
  HTML contains the 5 `data-block="<kind>"` markers. No new build
  errors / warnings introduced. Location: shell.
- **TC3** (playwright render smoke — 1 test covering 5
  `[data-block="<kind>"]` selectors) Input (manual local on WSL2 dev
  box): `pnpm --filter @skb/site exec playwright test
  playwright/sample-blocks-astro.spec.ts --reporter=list`. Expected:
  output contains `1 skipped` (the test skipped via
  `test.skip(isWsl2(), '...')`). Input (CI on linux): the same
  command via the existing CI workflow's playwright invocation.
  Expected: 1 PASS — the test navigates to `/sample-blocks-astro`,
  asserts `<h1>` visible, asserts each of 5
  `[data-block="<kind>"]` selectors resolves to >= 1 visible
  element. Location: shell + CI.
- **TC4** (typecheck clean — including the new page + new vitest +
  new playwright) Input: `pnpm --filter @skb/site typecheck`
  (which runs `astro check && tsc --noEmit` per the package.json
  script). Expected: exit 0; the new page's `AgentFlowNode` /
  `LayerProp` / `Math` / `Pdf` / `Jupyter` prop types resolve
  cleanly via the imported .astro variants' inline `interface
  Props` declarations + the exported types from `@skb/block-agent-flow/core`
  (re-exported through `serialize.ts`); the new vitest test imports
  resolve cleanly via `vitest` + `node:fs` + `node:url`; the new
  playwright spec imports resolve cleanly via `@playwright/test`.
  Location: shell.
- **TC5** (lint clean — including the new page + new vitest + new
  playwright) Input: `pnpm --filter @skb/site lint`. Expected: exit
  0; the 3 new files pass ESLint (no `max-lines` violation since
  page ~50 LOC + vitest ~90 LOC + playwright ~30 LOC, all well under
  500; no unused-imports; no `any` types). Location: shell.
- **TC6** (size-check clean — all 3 new files well under 500 LOC
  hard limit per CLAUDE.md Hard rule #1) Input: `pnpm size-check`.
  Expected: exit 0; the 3 new files all under 200 target. Location:
  shell.
- **TC7** (`pnpm check` exit 0 globally — workspace-wide regression
  baseline) Input: `pnpm check`. Expected: exit 0 (lint + typecheck +
  test + build + size-check all pass workspace-wide; A7's NEW page +
  NEW vitest + NEW playwright spec are additive; no existing test
  breaks). Location: shell at repo root.
- **TC8** (5 .astro variant files byte-unchanged from main) Input:
  `git diff main -- packages/block-math/src/ui-default/Math.astro
  packages/block-pdf/src/ui-default/Pdf.astro
  packages/block-jupyter/src/ui-default/Jupyter.astro
  packages/block-nn-viz/src/ui-default/NnViz.astro
  packages/block-agent-flow/src/ui-default/AgentFlow.astro`.
  Expected: empty diff (A7 makes ZERO changes to the 5 .astro variant
  files; they are package-owned authority). Location: shell.
- **TC9** (heavy-block-boundary src + CONTRACT.md byte-unchanged
  from A6) Input: `git diff main -- packages/heavy-block-boundary/`.
  Expected: empty diff (A7 does NOT use the React boundary on the
  new page; the page is pure SSR). Location: shell.
- **TC10** (`apps/site/src/components.ts` byte-unchanged from A5)
  Input: `git diff main -- apps/site/src/components.ts`. Expected:
  empty diff (A5's componentsMap rewire is the canonical MDX-route
  consumer state; A7's new direct-Astro-consumer page does NOT
  involve componentsMap). Location: shell.
- **TC11** (5 block packages' non-.astro source files byte-unchanged
  from A6) Input: `git diff main -- packages/block-math/
  packages/block-pdf/ packages/block-jupyter/ packages/block-nn-viz/
  packages/block-agent-flow/ -- ':!*.astro'`. Expected: empty diff
  (A7 only consumes the existing .astro subpath exports; no producer
  source is touched). Location: shell.
- **TC12** (ADR-0014 byte-unchanged) Input: `git diff main --
  docs/decisions/ADR-0014-heavy-block-boundary.md`. Expected: empty
  diff (status remains `proposed`; A8 promotes). Location: shell.
- **TC13** (`apps/site/playwright.config.ts` byte-unchanged) Input:
  `git diff main -- apps/site/playwright.config.ts`. Expected: empty
  diff (the existing `testMatch` glob `playwright/**/*.spec.ts`
  picks up the new spec automatically; webServer reuses `astro
  build && astro preview`). Location: shell.
- **TC14** (`apps/site/astro.config.mjs` byte-unchanged) Input: `git
  diff main -- apps/site/astro.config.mjs`. Expected: empty diff
  (A7 adds NO `manualChunks` entries; C5 Phase 2 chunking is A8
  scope). Location: shell.
- **TC15** (`apps/site/CONTRACT.md` byte-unchanged) Input: `git diff
  main -- apps/site/CONTRACT.md`. Expected: empty diff (the new page
  is self-documenting per `## D2 trigger judgment`; no `## Astro
  variants` section addition). Location: shell.
- **TC16** (`apps/site/package.json` byte-unchanged — no new deps)
  Input: `git diff main -- apps/site/package.json`. Expected: empty
  diff (the 8 `@skb/block-*` workspace deps + `astro` +
  `@playwright/test` + `vitest` already present). Location: shell.
- **TC17** (lockfile byte-unchanged — no new workspace deps) Input:
  `git diff main -- pnpm-lock.yaml`. Expected: empty diff (A7 adds
  NO deps). Location: shell.
- **TC18** (`.github/workflows/ci.yml` byte-unchanged) Input: `git
  diff main -- .github/workflows/ci.yml`. Expected: empty diff (A7
  adds a new spec + a new vitest test, but no CI config change is
  required — both are picked up by the existing
  `pnpm check` + playwright invocations). Location: shell.
- **TC19** (no CONTRACT.md changes anywhere) Input: `git diff main
  --name-only -- '**/CONTRACT.md'`. Expected: empty (A7 makes ZERO
  CONTRACT.md edits anywhere). Location: shell.
- **TC20** (`content/notes/sample-blocks/index.mdx` byte-unchanged)
  Input: `git diff main -- content/notes/sample-blocks/index.mdx`.
  Expected: empty diff (A7 reads the prop shapes from this fixture
  but does NOT edit it). Location: shell.
- **TC21** (5 `.astro` variant subpath imports resolve at build time
  — pre-flight check via package.json exports map) Input (a):
  `grep -c "ui-default/Math.astro"
  packages/block-math/package.json`. Expected: 1. Input (b):
  `grep -c "ui-default/Pdf.astro"
  packages/block-pdf/package.json`. Expected: 1. Input (c):
  `grep -c "ui-default/Jupyter.astro"
  packages/block-jupyter/package.json`. Expected: 1. Input (d):
  `grep -c "ui-default/NnViz.astro"
  packages/block-nn-viz/package.json`. Expected: 1. Input (e):
  `grep -c "ui-default/AgentFlow.astro"
  packages/block-agent-flow/package.json`. Expected: 1. (Verified
  PLAN-time via the 5 grep calls above; all 5 .astro files are
  exposed via the existing `exports` map per Wave 1+2 ship.)
  Location: shell.
- **TC22** (`docs/plans/active.md` updated correctly) Input (a):
  `grep -c '#36' docs/plans/active.md`. Expected: >= 1 (A6's
  squash HEAD filled in). Input (b): `grep -c '95ba33b'
  docs/plans/active.md`. Expected: >= 1 (A6's squash HEAD value).
  Input (c): `grep -c 'A7 | 5×.astro variants' docs/plans/active.md`.
  Expected: 1 (new A7 row added). Input (d): `grep -c 'A8 (1 PR'
  docs/plans/active.md`. Expected: >= 1 (Stage A remaining decrement).
  Input (e): `grep -c 'Stage A8' docs/plans/active.md`. Expected:
  >= 1 (next-PR pointer flip). Location: shell.
- **TC23** (PR.md self-listed in `## files`) Input: `grep -c
  'A7-astro-variants-consolidation.md'
  docs/plans/wave-4-main/A7-astro-variants-consolidation.md`.
  Expected: >= 2 (the file references itself in `## files` list +
  in the title section header). Location: shell.

## contracts_affected

- **No CONTRACT.md files are modified by A7.** The 5 .astro variant
  files (`Math.astro` / `Pdf.astro` / `Jupyter.astro` / `NnViz.astro`
  / `AgentFlow.astro`) and their corresponding `./ui-default/<Kind>.astro`
  subpath exports were both shipped at Wave 2; the public surface
  (subpath exports + .astro Props interfaces) is already documented
  via the package `package.json` `exports` map + the inline
  `interface Props` declarations in each .astro file. A7 is a pure
  consumer-side wiring PR. TC19 verifies empty diff across
  `**/CONTRACT.md`.
- **`apps/site/CONTRACT.md`** — **NOT modified.** The new page is
  self-documenting via filename (`sample-blocks-astro.astro` →
  route `/sample-blocks-astro`) + section headers. The existing
  CONTRACT.md `## Public surface` enumerates routes `/` and
  `/notes/<slug>`; adding a new demo / sampler route `/sample-blocks-astro`
  does NOT meaningfully expand the public API surface (the route is
  a Wave 3 carry-over showcase, not a stable production surface
  that downstream consumers contract on). The decision NOT to add
  a new `## Astro variants` section is documented in `## D2 trigger
  judgment` below and in the Wave 4 plan A7 § lines 248-253
  (Row 1 conditional — verified NO at PLAN time). TC15 verifies
  empty diff. NOTE: if EXECUTE-time discovers a strong reason to
  document the new route in CONTRACT.md (e.g., the route becomes a
  stable downstream consumer surface during Stage B/C work), the
  CONTRACT addition can land in a follow-up PR; A7's PR.md + the
  page file itself are sufficient documentation for the demo /
  sampler scope.
- **`packages/heavy-block-boundary/CONTRACT.md`** — **NOT modified.**
  Already consolidated at A4 with the canonical 8-bullet invariant
  list. A7 does NOT consume the React boundary on the new page (the
  page is pure SSR; the `data-block="<kind>"` attribute on the new
  page resolves to the .astro variant's own outer div, NOT to the
  boundary's wrapper). TC9 verifies empty diff.
- **W4-1 partner contract**
  (`packages/block-foundation/CONTRACT.md`) is **NOT modified.**
- **5 block CONTRACT.md** (`packages/block-{math,pdf,jupyter,nn-viz,agent-flow}/CONTRACT.md`)
  — **NOT modified.** Wave 2 + Wave 3 close already documented
  the .astro variant existence + `./ui-default/<Kind>.astro` subpath
  exports; A7 just consumes them.

## adr_touched

- **`docs/decisions/ADR-0014-heavy-block-boundary.md`** — **NOT
  edited.** Status remains `proposed`; promotion to `accepted` is
  A8 scope per locked Wave 4 plan Stage A close criterion #1. A7
  is **NOT a direct consumer of ADR-0014** on the new page (the
  page bypasses the React boundary; the heavy .astro variants
  Jupyter / NnViz / AgentFlow render only their static placeholder
  per their own file headers — see Jupyter.astro lines 2-15 +
  NnViz.astro lines 11-15 + AgentFlow.astro lines 5-17). The
  existing A2-A6 baseline for ADR-0014 acceptance criteria
  (#1-#15) is preserved unchanged via TC8-TC10 + TC12 (zero source
  edits to boundary + 5 .astro variants + components.ts + ADR-0014).
  AC#5 zero-layout-shift evidence on the MDX route at
  `/notes/sample-blocks` (3 heavy boundaries) was just landed at
  A6; A7's new page at `/sample-blocks-astro` is a different route
  with no React boundaries — AC#5 is not re-validated on the new
  page (out of A7 scope; the 5 .astro variants render their static
  placeholder once and never re-render, so zero layout shift is
  trivially true on this page; an explicit playwright assertion is
  unnecessary).
- **No new ADR is required for A7.** D2 Row 4 (new ADR required)
  is **NOT triggered** — the .astro variants + their subpath exports
  + the direct-Astro-consumer pattern are all pre-existing
  architecture (Wave 2 ship + Wave 3 close); A7 just exercises them
  on a previously-empty consumer surface. No new design decision
  surfaces.
- Per gatekeeper directive 2026-05-03 #1 + the A1/A2/A3/A4/A5/A6
  PR.md precedent, this `adr_touched` field explicitly notes
  ADR-0014 even though no edits occur, since A7 is the seventh
  Stage A implementation PR and reviewers verify A7 diff aligns
  with ADR-0014 D2 (the boundary is NOT used on this route — the
  page is pure SSR, complementary to the MDX-route
  `HeavyBlockBoundary` consumer surface) + the locked Wave 4 plan
  A7 § scope (Wave 3 C4a + C4b carry-over).

## D2 trigger judgment

Per ADR-0007 D2 row mapping for A7 (verified at PLAN time):

- **Row 1 (CONTRACT.md change)**: **NO.** Wave 4 plan A7 § lines
  249-250 flagged this as conditional ("apps/site CONTRACT.md may
  add `## Astro variants` section; if so, Stage 4 fires"). PLAN-time
  verdict: **DO NOT add the section.** Reasoning:
  (a) the existing `apps/site/CONTRACT.md` `## Public surface`
  section enumerates **stable production routes** (`/` for the
  notes index; `/notes/<slug>` for rendered notes). The new
  `/sample-blocks-astro` route is a **demo / sampler showcase
  route** for the Wave 3 C4a/C4b carry-over deliverable, not a
  stable downstream consumer contract. Adding it to `## Public
  surface` would inflate the contract scope with a non-stable
  surface;
  (b) the new page's filename + section headers + this PR.md +
  the Wave 4 plan A7 § are sufficient documentation for executors,
  reviewers, and downstream readers to find the page;
  (c) explicit `## Astro variants` section is **doc-overhead
  unjustified by a single demo page** — the .astro variants'
  subpath exports are already documented in each block package's
  `package.json` `exports` map + each .astro file's inline
  `interface Props` declaration + each block package's
  CONTRACT.md `Public surface` section.
  TC15 verifies the empty diff.
- **Row 2 (package add / remove)**: **NO.** A7 adds zero new
  workspace packages. The 8 `@skb/block-*` deps + `astro` +
  `@playwright/test` + `vitest` are already in `apps/site/package.json`
  per Wave 1+2+3 installs. TC16 + TC17 verify empty diffs.
- **Row 3 (cross-cutting refactor)**: **NO.** A7 is additive — 1
  new page + 1 new vitest + 1 new playwright spec; no existing
  files refactored.
- **Row 4 (new ADR required)**: **NO.** No new design decision
  surfaces. The .astro variants + subpath exports are pre-existing
  Wave 2 architecture; the direct-Astro-consumer pattern is the
  Astro framework's default routing model. A7 exercises pre-existing
  contracts.
- **Row 5 (cross >= 3 packages)**: **flag-only.** A7 imports from
  5 heavy / light block packages (`@skb/block-math`,
  `@skb/block-pdf`, `@skb/block-jupyter`, `@skb/block-nn-viz`,
  `@skb/block-agent-flow`) but does NOT MODIFY any of them.
  Per plan-challenger Q5 absorbtion at Pre-A3 lock (per Wave 4 plan
  line 247-253), Row 5 ALONE does NOT fire D1 stage 4 PRE-COMMIT
  CLAUDE REVIEW; the trigger requires Row 1 OR Row 4 to be hit
  alongside. Row 1 + Row 4 are both NO above → Row 5 is flag-only.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** A7 does not
  introduce any sibling-divergent pattern; the 5 variant
  invocations follow Astro's standard `<Component prop={...} />`
  shape uniformly.
- **Row 7 (legacy doc resurrection)**: **NO.** The 5 .astro
  variants are current-Wave-2 architecture, not resurrected legacy
  surfaces.
- **Row 8 (CI / build / deploy / auth / security)**: **NO.** A7
  makes ZERO changes to `.github/workflows/ci.yml` (TC18) +
  `astro.config.mjs` (TC14) + `playwright.config.ts` (TC13) +
  `vitest.config.ts` (no TC; covered by `pnpm check` PASS) + auth
  surface (no auth in apps/site) + security surface (no security
  posture change).

→ **Standard PR; D1 stage 4 PRE-COMMIT CLAUDE REVIEW NOT
mandatory.** Same execution discipline as A6 (D1 stage 1 PLAN →
stage 2 EXECUTE → stage 3 REVIEW → stage 5 COMMIT → stage 6 ACCEPT;
stage 4 SKIPPED). Reviewer codex still runs ADR-0006 8-point
checklist + ADR-0006 D8 explicit-file-list staging in stage 5.

## Revert plan (per-variant isolation; per plan-challenger C3 absorbtion)

The Wave 4 plan A7 § lines 261-264 require **per-variant explicit
revert steps documented in PR.md** (per plan-challenger Q1 + C3
absorbtion at Pre-A3 lock — "if any one `.astro` integration fails,
the rollback path (remove apps/site entries + re-run fallback build
check) is documented per-variant for clean isolation"). Per-variant
isolation is achieved by the page's section structure: each variant
sits in its own `<section><h2>...</h2>...</section>` block. The
revert pattern for variant `<X>` (where X ∈ {Math, Pdf, Jupyter,
NnViz, AgentFlow}) is:

1. **Identify the failing variant**: `pnpm --filter @skb/site build`
   stderr will name the failing variant + line in
   `sample-blocks-astro.astro`. Alternatively, the playwright spec
   TC3 will name the failing `[data-block="<kind>"]` selector.

2. **Comment out the variant's section** in
   `apps/site/src/pages/sample-blocks-astro.astro`:
   - Wrap the entire `<section>` block for variant X with `{/* ... */}`
     Astro comment delimiters (NOT JS `//`/`/* */` — Astro template
     comments use the JSX-style `{/* */}` syntax in the template
     body).
   - Optionally remove the unused import line at the top
     (`import X from '@skb/block-<x>/ui-default/X.astro';`) to keep
     the eslint `no-unused-vars` rule happy; or keep the import +
     comment-out the `<section>` only if the lint rule is not
     triggered (Astro frontmatter ESLint may treat top-level imports
     differently than React; verify EXECUTE-time).

3. **Update the vitest test** at
   `apps/site/src/__tests__/sample-blocks-astro-page.test.ts`:
   - Mark the corresponding `it('imports X.astro from @skb/block-<x>', ...)`
     test as `it.skip(...)` with a comment linking to the deferral
     reason.
   - Mark the corresponding named-prop invocation test as `it.skip(...)`
     with a comment linking to the deferral reason.

4. **Update the playwright spec** at
   `apps/site/playwright/sample-blocks-astro.spec.ts`:
   - Remove the variant's selector from the `as const` array (e.g.,
     remove `'jupyter'` from the 5-element array if Jupyter is
     deferred).

5. **Re-run `pnpm check`** to confirm the 4 remaining variants still
   build + test cleanly. Commit the per-variant revert as a
   forward-fix PR (not an A7 amendment — A7 should land with all 5
   passing OR get held back at REVIEW; per-variant deferral is for
   forward-fix PRs after A7 lands).

6. **File a follow-up issue / PR** to fix the deferred variant. The
   .astro variant file itself is package-owned authority; if the
   issue is in the variant's source (not the consumer wiring), the
   fix lives in the corresponding block package PR (Stage B / C
   scope per Wave 4 plan).

**Per-variant table** (for executor + reviewer convenience):

| Variant | Section identifier | Selector | Import line | Vitest `it` ID |
|---|---|---|---|---|
| Math | `<section><h2>Math</h2>` | `[data-block="math"]` | `from '@skb/block-math/ui-default/Math.astro'` | `imports Math.astro from @skb/block-math` |
| Pdf | `<section><h2>PDF</h2>` | `[data-block="pdf"]` | `from '@skb/block-pdf/ui-default/Pdf.astro'` | `imports Pdf.astro from @skb/block-pdf` |
| Jupyter | `<section><h2>Jupyter</h2>` | `[data-block="jupyter"]` | `from '@skb/block-jupyter/ui-default/Jupyter.astro'` | `imports Jupyter.astro from @skb/block-jupyter` |
| NnViz | `<section><h2>NN-Viz</h2>` | `[data-block="nn-viz"]` | `from '@skb/block-nn-viz/ui-default/NnViz.astro'` | `imports NnViz.astro from @skb/block-nn-viz` |
| AgentFlow | `<section><h2>Agent Flow</h2>` | `[data-block="agent-flow"]` | `from '@skb/block-agent-flow/ui-default/AgentFlow.astro'` | `imports AgentFlow.astro from @skb/block-agent-flow` |

## acceptance

1. NEW page `apps/site/src/pages/sample-blocks-astro.astro` (~50
   LOC) imports all 5 .astro variants from their workspace package
   subpaths (`@skb/block-math/ui-default/Math.astro`,
   `@skb/block-pdf/ui-default/Pdf.astro`,
   `@skb/block-jupyter/ui-default/Jupyter.astro`,
   `@skb/block-nn-viz/ui-default/NnViz.astro`,
   `@skb/block-agent-flow/ui-default/AgentFlow.astro`) — each subpath
   resolves via the corresponding block package's existing
   `package.json` `exports` map (verified PLAN-time via TC21).
   TC1 + TC2 + TC4 evidence.
2. Page uses `BaseLayout` (imported via the existing
   `@layouts/BaseLayout.astro` tsconfig path alias) for consistent
   site chrome (header + theme toggle + main wrapper). TC1 + TC2
   evidence.
3. Each variant invoked with realistic example props matching
   `content/notes/sample-blocks/index.mdx` shapes:
   - Math: `expression="e^{i\pi} + 1 = 0"` (Euler's identity, inline)
     + `expression="\int_{-\infty}^{\infty} e^{-x^{2}} \, dx = \sqrt{\pi}"
     display={true}` (Gaussian integral, display).
   - Pdf: `src="/sample-assets/whitepaper.pdf" page={1}` (whitepaper
     page 1; `page` prop defaults documented in Pdf.astro line 10).
   - Jupyter: `code={"import numpy as np\nprint('hello')"}
     showLineNumbers={true}` (numpy snippet with line numbers per
     `index.mdx` Jupyter fixture pattern).
   - NnViz: `layers={[{name:'input',units:4,activation:'linear'},
     {name:'hidden',units:8,activation:'relu'},
     {name:'output',units:2,activation:'softmax'}]}` (3-layer
     forward NN topology; `activation` values constrained by the
     `LayerProp` union at NnViz.astro lines 18-22).
   - AgentFlow: `nodes={[{id:'start',label:'Start',type:'agent',
     position:{x:0,y:0}}, ...]}` (3-node start/process/end graph
     with 2 edges; node `type` values constrained by the union at
     `serialize.ts` line 15).
   TC1 evidence (the six named-prop `it(...)` cases).
4. NEW vitest source-grep smoke
   `apps/site/src/__tests__/sample-blocks-astro-page.test.ts` (~90
   LOC, **12 tests**) covers: 5 imports + 1 BaseLayout + 6 named-prop
   invocations. All 12 tests PASS via TC1.
5. NEW playwright render smoke
   `apps/site/playwright/sample-blocks-astro.spec.ts` (~30 LOC, **1
   test**) navigates to `/sample-blocks-astro` + asserts 5
   `[data-block="<kind>"]` selectors (`math` / `pdf` / `jupyter` /
   `nn-viz` / `agent-flow`) each resolve to >= 1 visible element.
   WSL2-skip via `isWsl2()` helper VERBATIM-COPIED from
   `search.spec.ts` lines 5-15 (3rd duplication; abstraction
   deferred to Wave 4 retrospective B5b). TC3 evidence.
6. `pnpm --filter @skb/site build` PASS — proves the 5 previously
   orphan `.astro` variant files now reach a live build target via
   the new `/sample-blocks-astro` route. **KEY A7 acceptance per
   Wave 4 plan A7 § scope** (Wave 3 C4a + C4b carry-over closure).
   TC2 evidence.
7. `pnpm check` exit 0 globally — workspace-wide regression
   baseline preserved (lint + typecheck + test + build + size-check
   all PASS). TC7 evidence.
8. **Per-variant revert plan documented** in `## Revert plan`
   section above (per plan-challenger C3 absorbtion at Pre-A3 lock):
   if any one variant fails build OR fails its render smoke, executor
   (or follow-up forward-fix PR) comments out THAT single
   `<section>` block + skips the corresponding vitest `it` + removes
   the variant's selector from the playwright spec's array; the
   other 4 variants continue passing. Per-variant table provided
   for executor + reviewer convenience (5 rows, 1 per variant,
   columns: section identifier + selector + import line + vitest
   `it` ID).
9. NO modifications to the 5 `.astro` variant files themselves
   (read-only consumers; the variants are package-owned authority
   per Wave 2 ship). TC8 verifies empty diff across 5 paths.
10. NO modifications to `packages/heavy-block-boundary/` (A4-locked
    boundary source + CONTRACT.md remain byte-unchanged; A7 does
    NOT use the React boundary on the new direct-Astro-consumer
    page). TC9 verifies empty diff.
11. NO modifications to the 5 block packages' non-.astro source
    files (A5's `heavyBoundaryDimensions` exports + CONTRACT.md
    bullets unchanged; A7 only consumes the .astro subpath exports).
    TC11 verifies empty diff.
12. NO modifications to `apps/site/src/components.ts` (A5's
    canonical componentsMap rewire for the MDX route remains
    byte-unchanged; A7's new page is a separate route with no
    componentsMap involvement). TC10 verifies empty diff.
13. NO modifications to `apps/site/CONTRACT.md` (per `## D2 trigger
    judgment` Row 1 NO verdict; the new page is self-documenting
    via filename + section headers + this PR.md). TC15 verifies
    empty diff.
14. NO modifications to ADR-0014 (status remains `proposed`; A8
    promotes per Stage A close gate). TC12 verifies empty diff.
15. NO new workspace deps; `pnpm-lock.yaml` byte-unchanged. TC16 +
    TC17 verify empty diffs. The 5 `./ui-default/<Kind>.astro`
    subpaths resolve via existing `package.json` `exports` maps
    (TC21 pre-flight verifies all 5 are present).
16. `docs/plans/active.md` 4-edit bookkeeping applied: A6 row
    backfilled (`#36` `95ba33b`); new A7 row added; Stage A
    remaining decremented to `A8 (1 PR — Stage A close)`; next-PR
    pointer flipped to `Stage A8 (Phase 2 chunking + perf baseline
    + ADR-0014 promote `proposed → accepted`; Stage A close)`;
    top-line phase summary appends `+ A7` to the done list. TC22
    evidence.
17. PR.md self-listed in `## files` per ADR-0006 D8 strict whitelist
    (Pre-A1+A2+A3+A1+A2+A3+A4+A5+A6 precedent). TC23 evidence.
18. Codex review iterations: expect R1 + 0-1 forward-fix. Typical
    risk classes: (a) Astro prop-type strictness for NnViz `LayerProp`
    union OR AgentFlow `AgentFlowNode` `type` union — fixable by
    adjusting the fixture literal to a valid union member; (b)
    bundle resolution for `.astro` subpath imports — verify
    EXECUTE-time via TC2 (`pnpm --filter @skb/site build` PASS); if
    the subpath import fails, the fallback is to import via the
    package's `./ui-default` index re-export (would require adding
    an `export { default as MathAstro } from './Math.astro'` line
    to each package's `ui-default/index.ts` — but that is a
    package-source change A7 explicitly avoids; the existing direct
    subpath `"./ui-default/Math.astro"` exports map entries should
    work directly per Astro 5 + pnpm workspace + TS resolution
    norms); (c) the `<Math>` invocation's `\` backslash escape
    handling in Astro frontmatter JS literal — verified by the
    `index.mdx` precedent at lines 92-94 (same `\int_{-\infty}^{\infty}
    e^{-x^{2}}` literal works in MDX prop slot, equivalent escape
    rules apply to Astro frontmatter JS literals).
19. AC coverage in A7: **Wave 3 C4a + C4b carry-over** newly
    closed; **ADR-0014 AC#1-#15** A2+A3+A4+A5+A6 baseline preserved
    unchanged (TC8-TC12 verify zero source edits to boundary +
    .astro variants + components.ts + ADR-0014).
20. **Out-of-scope deferred to A8 (Stage A close)**: C5 Phase 2
    chunking + perf baseline (`apps/site/astro.config.mjs`
    `manualChunks` strategy refinement; codex-perf-auditor
    measurement-driven decision per plan-challenger C4 absorbtion);
    ADR-0014 promote `proposed → accepted`; Wave 4 close-ceremony
    work (B5b retrospective + B6 prep) deferred to Stage B.

## executor

Standard ADR-0011 D1 pipeline:

- **PLAN**: pr-writer Claude subagent (you, this dispatch).
- **EXECUTE**: codex-generic-executor (codex CLI 5.5,
  workspace-write sandbox, `--yolo --profile generic-executor`
  per Pre-A1 codified discipline + Universal Bash invariants in
  `docs/runbooks/codex-tool-invocations.md`). NOTE: Wave 4 plan A7
  line 246 names `codex-block-generator` as the recommended profile
  ("clone pattern: write 1 template integration + clone to other 4
  with parameter substitution"); A7's PLAN deliberately departs
  from that recommendation because (a) the 5 .astro variants
  ALREADY EXIST as package-owned authority (Wave 2 ship) — there is
  NO clone needed; A7 wires CONSUMERS, not producers; (b) the
  consumer-side work spans 3 distinct file types (page + vitest +
  playwright) with no template repetition — generic multi-file
  integration is what `generic-executor` is for per ADR-0011 D6;
  (c) the codex-block-generator profile is scaffolder-class
  (template-clone work) per the CLAUDE.md table of 11 codex
  patterns; using it for non-clone integration work would be a
  profile mismatch. The Wave 4 plan A7 line 246 wording reflects
  pre-PLAN heuristic; PLAN-time refines per actual file inventory.
- **REVIEW**: codex-pr-reviewer-55 (codex CLI 5.5,
  `--yolo --profile pr-reviewer-55`). ADR-0006 8-point checklist
  mandatory; ADR-0006 D8 explicit-file-list staging mandatory.
- **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)**: **NOT MANDATORY** per
  D2 no-row hit (see `## D2 trigger judgment` above). SKIPPED.
- **COMMIT (D1 stage 5)**: reviewer codex commits via the Pre-A1
  codified `git reset HEAD` → `git add <list>` → `git diff --cached
  --stat` verify → `git commit` 4-step (memory
  `feedback_git_operator_explicit_stage`).
- **ACCEPT (D1 stage 6)**: pr-writer Claude subagent second
  invocation (this same agent role, separate dispatch post-COMMIT).

## Out of scope (deferred)

- **A8 (Stage A close)**: Phase 2 selective chunking refinement
  (`apps/site/astro.config.mjs` `manualChunks` strategy per the
  C5 carry-over + plan-challenger C4 absorbtion measurement-driven
  scope) + perf baseline (codex-perf-auditor measurement) +
  ADR-0014 promotion `proposed → accepted` (Stage A close gate).
- **B-stage**: ADR-0012 amendment (PageFind query-time substring
  finding per memory `feedback_pagefind_query_substring`) +
  `_pagefind/` → `pagefind/` path-prose alignment + sample-assets
  ship (gatekeeper smoke #8) + sample-blocks intro prose
  (gatekeeper smoke #9) + `__test_cjk__` relocate + Wave 3
  retrospective items 2-7 (B5a + B5b) + close-ceremony prep (B6).
- **C-stage**: open-ended Phase 1 user-iteration scope per
  gatekeeper directive #4 + MVP framework.
- **A7 explicitly does NOT touch**:
  - The 5 `.astro` variant files (TC8 — package-owned authority).
  - The React `HeavyBlockBoundary` source + CONTRACT.md (TC9 —
    A7's new page is pure SSR, not React-boundary-wrapped).
  - `apps/site/src/components.ts` (TC10 — A5's MDX-route
    componentsMap is byte-unchanged; A7's new page is a separate
    route with no componentsMap involvement).
  - The 5 block packages' non-.astro source files (TC11 — A5's
    `heavyBoundaryDimensions` exports unchanged; A7 only consumes
    .astro subpath exports).
  - ADR-0014 (TC12 — A8 promotes).
  - `apps/site/CONTRACT.md` (TC15 — per Row 1 NO verdict).
  - `apps/site/astro.config.mjs` (TC14 — C5 chunking is A8 scope).
  - Lockfile (TC17 — no new deps).
  - CI workflow (TC18 — picked up by existing invocations).

## Related

- **Wave 4 plan locked**:
  [docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  § A7 lines 236-272 (gatekeeper #2 consolidation + plan-challenger
  Q1+C3 absorbtion).
- **Wave 4 active.md pointer**:
  [docs/plans/active.md](../active.md) — A6 row backfill +
  A7 row + Stage A pointer flip applied here.
- **Sister A-stage PR.md**:
  [A1](./A1-heavy-block-boundary-package-shell.md) +
  [A2](./A2-heavy-block-boundary-core-hydration.md) +
  [A3](./A3-heavy-block-boundary-retry-telemetry.md) +
  [A4](./A4-heavy-block-boundary-css-a11y-contract.md) +
  [A5](./A5-apps-site-dims-migration.md) +
  [A6](./A6-heavy-block-playwright-layout-shift.md) (this PR.md
  follows A6's prose density + structure).
- **ADR-0011 D1-D8 linear pipeline**:
  [docs/decisions/ADR-0011-linear-pipeline-execution-model.md](../../decisions/ADR-0011-linear-pipeline-execution-model.md).
- **ADR-0007 D2 trigger rows**:
  [docs/decisions/ADR-0007-job-function-codex-heavy-execution.md](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
  D2.
- **ADR-0006 D8 explicit-file-list staging + 8-point checklist**:
  [docs/decisions/ADR-0006-asymmetry-audit-checklist.md](../../decisions/ADR-0006-asymmetry-audit-checklist.md).
- **ADR-0014 HeavyBlockBoundary** (NOT modified by A7):
  [docs/decisions/ADR-0014-heavy-block-boundary.md](../../decisions/ADR-0014-heavy-block-boundary.md).
- **Block packages' .astro variant files** (NOT modified by A7;
  consumed via subpath exports):
  [Math.astro](../../../packages/block-math/src/ui-default/Math.astro)
  + [Pdf.astro](../../../packages/block-pdf/src/ui-default/Pdf.astro)
  + [Jupyter.astro](../../../packages/block-jupyter/src/ui-default/Jupyter.astro)
  + [NnViz.astro](../../../packages/block-nn-viz/src/ui-default/NnViz.astro)
  + [AgentFlow.astro](../../../packages/block-agent-flow/src/ui-default/AgentFlow.astro).
- **Reference page patterns**:
  [apps/site/src/pages/index.astro](../../../apps/site/src/pages/index.astro)
  + [apps/site/src/layouts/BaseLayout.astro](../../../apps/site/src/layouts/BaseLayout.astro).
- **Reference MDX prop fixtures**:
  [content/notes/sample-blocks/index.mdx](../../../content/notes/sample-blocks/index.mdx).
- **Reference vitest source-grep precedent**:
  [apps/site/src/__tests__/components-map.test.ts](../../../apps/site/src/__tests__/components-map.test.ts).
- **Reference WSL2 isWsl2() helper precedent**:
  [apps/site/playwright/search.spec.ts](../../../apps/site/playwright/search.spec.ts)
  lines 5-15 + the same helper duplicated in
  [apps/site/playwright/heavy-block-layout-shift.spec.ts](../../../apps/site/playwright/heavy-block-layout-shift.spec.ts)
  (A6 ship).
- **agent-contract.md (single source for agent roster)**:
  [agent-contract.md](../../../agent-contract.md).
- **Memories applied at A7 PLAN**:
  - `feedback_cross_package_consumer_pattern` — vitest source-grep
    of consumer file shape (imports + invocations); not
    re-implementing producer logic.
  - `feedback_wsl2_chromium_launch` — playwright spec must skip
    on WSL2 dev box; CI-only execution.
  - `feedback_active_writer_break_we009` — A7 is single-PR linear
    pipeline (no concurrent worker); WE-009 not applicable.
  - `feedback_lychee_line_anchor` — links above use plain paths
    without `:line` suffix.
  - `feedback_lychee_user_local_paths` — no `~/.claude/...` links
    in this PR.md.
