# B7 — Heavy block Astro hydration wiring + ADR-0014 v0.3 amendment (CRITICAL MVP-blocking gap fix)

> **Wave 4 Stage B 7th implementation PR** of the re-locked 8-PR
> sequence (B1a → B1b → B2 → B3 → B4 → B5 → **B7** → B6; per
> Wave 4 plan v0.2.1 Driver 2). **CRITICAL gap fix** for an Astro
> hydration omission missed by ADR-0014 v0.2 + the 12/12
> plan-challenger absorbtion at Pre-A2 + AC#1-#15 (all vitest /
> jsdom; never tested real Astro browser hydration). Surfaced
> post-Stage-A close by the gatekeeper directive 2026-05-04: heavy
> blocks (Jupyter / NnViz / AgentFlow) wired into
> `apps/site/src/components.ts` `componentsMap` are pure React
> functions returning `createElement(HeavyBlockBoundary, ...)`,
> but Astro's MDX integration renders these SSR-only without any
> `client:*` directive — so the `useEffect` inside
> HeavyBlockBoundary NEVER runs in the browser → forever-loading
> skeleton → MVP-blocking visual disaster on any rendered note
> page that contains a heavy block. B7 ships the production
> Astro hydration integration: 3 NEW per-kind React island
> wrappers (`apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx`)
> + 3 NEW Astro wrappers (`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`)
> using `client:load`, plus `componentsMap` rewire, ADR-0014 v0.3
> Amendment with new D10 + new AC#16, playwright AC#16 hydration
> assertion, and `apps/site/CONTRACT.md` heavy block taxonomy
> clause. **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** per
> `## D2 trigger judgment` (Row 1 + Row 4 HIT).

## title

Wire 3 heavy blocks (Jupyter / NnViz / AgentFlow) through real
Astro browser hydration so that the `useEffect` lifecycle inside
`HeavyBlockBoundary` actually runs in the browser at first paint.
Ship 3 NEW per-kind React island wrappers
(`apps/site/src/islands/JupyterIsland.tsx`,
`apps/site/src/islands/NnVizIsland.tsx`,
`apps/site/src/islands/AgentFlowIsland.tsx`) — each closure-captures
its kind literal, its `heavyBoundaryDimensions` import, and its
dynamic `load` arrow function so the island accepts only
JSON-serializable props (the existing FlatProps childProps shape).
Ship 3 NEW Astro wrappers (`apps/site/src/components/Jupyter.astro`,
`apps/site/src/components/NnViz.astro`,
`apps/site/src/components/AgentFlow.astro`) — each imports the
corresponding island and renders it with `client:load`
(NOT `client:only`, so SSR skeleton continues to satisfy A6
zero-layout-shift AC#5). Update `apps/site/src/components.ts`
`componentsMap` to map the 3 heavy PascalCase keys to the 3 NEW
Astro wrappers (5 light blocks Callout / Code / Image / Math / Pdf
stay as React MdxAdapter-pattern entries unchanged). Author
ADR-0014 v0.3 substantive Amendment adding new D10 (Production
Astro hydration integration) + new AC#16 (componentsMap heavy
entries are Astro islands using `client:load`; HeavyBlockBoundary
useEffect runs in browser; `load()` invoked; real RenderView
replaces skeleton with `data-loaded='true'`). Extend
`apps/site/playwright/heavy-block-layout-shift.spec.ts` with the
AC#16 hydration end-to-end assertion (poll for
`data-loaded='true'` on each heavy block + verify real component
content present, not skeleton; WSL2 chromium skip preserved per
memory `feedback_wsl2_chromium_launch.md`; CI canonical). Append a
single heavy block taxonomy clause to `apps/site/CONTRACT.md`
specifying the production hydration boundary (componentsMap heavy
entries = Astro wrappers using `client:load`; per-kind island
wrappers in `apps/site/src/islands/` own dynamic-import +
`heavyBoundaryDimensions` closure). Bookkeep `docs/plans/active.md`
(B5 row backfill `#44` + `794cd5d` + new B7 TBD row + flip
mandatory-scope row 27 implicit "heavy block hydration" prerequisite
✅). PR.md self-listed per ADR-0006 D8 strict-whitelist + Pre-A1
through B5 precedent.

## files

14 canonical files at PLAN time (orchestrator-self EXECUTE for
ADR-0014 v0.3 Amendment + new D10 + new AC#16 doc-policy work,
matching Pre-A2 + A8 v0.2.1 + B1a v0.1.1 substantive-amendment
precedent; `codex-generic-executor` (`codex-` prefix per B5;
ADR-0011 D6 canonical) handles the 3 islands + 3 Astro wrappers +
componentsMap rewire + apps/site/CONTRACT.md taxonomy clause +
playwright spec extension + active.md bookkeeping). NO
`package.json` / `pnpm-lock.yaml` change (no new deps; Astro's
`client:load` is built-in; `@astrojs/react` integration is already
configured at `apps/site/astro.config.mjs`). NO `astro.config.mjs`
change (Astro automatically discovers `apps/site/src/islands/*.tsx`
as React islands via the existing `@astrojs/react` integration).
NO new ADR file (Row 4 trigger is the substantive Amendment to
ADR-0014, not a new decision document; matches B1a precedent of
ADR-0012 v0.1.1 substantive Amendment under the same Row 4
classification). PR.md self-listed per Pre-A1+...+B5 precedent.

- `apps/site/src/islands/JupyterIsland.tsx` — **NEW** (~30 LOC).
  Per-kind React island wrapper. Closure-captures the kind literal
  `'jupyter'`, the `heavyBoundaryDimensions` import from
  `@skb/block-jupyter/ui-default/heavy-boundary-dimensions`, and a
  dynamic `load` arrow function that imports
  `@skb/block-jupyter/ui-default` and resolves to a
  `{ default: makeMdxAdapter(m.JupyterRenderView as never) }` shape
  matching the ADR-0014 D1 `load` contract. The island accepts
  ONLY JSON-serializable props (`FlatProps` shape — the existing
  childProps that MDX flat-prop compilation produces) and renders
  `<HeavyBlockBoundary kind='jupyter' dims={jupyterDims} load={load}
  childProps={props} />`. **Closing over the `load` function inside
  the island module avoids the Astro island prop-serialization
  constraint** (function props cannot cross the island boundary —
  Astro JSON-stringifies island props). The `makeMdxAdapter` helper
  is imported from `apps/site/src/components.ts` (re-exported as
  a named export for cross-module consumption) OR replicated in
  the island module per executor's choice (rationale documented in
  `## Risk register` below). PLAN-time decision: **re-export
  `makeMdxAdapter`** from `components.ts` and import it in each
  island — keeps single-source-of-truth for the FlatProps adapter
  shape used across both light blocks (current MdxAdapter pattern)
  and heavy blocks (new island wiring). The named re-export from
  `components.ts` is internal to apps/site and does not touch any
  package CONTRACT surface.

- `apps/site/src/islands/NnVizIsland.tsx` — **NEW** (~30 LOC).
  Same shape as JupyterIsland — kind `'nn-viz'`,
  `heavyBoundaryDimensions` from
  `@skb/block-nn-viz/ui-default/heavy-boundary-dimensions`,
  dynamic load resolves `@skb/block-nn-viz/ui-default` →
  `{ default: makeMdxAdapter(m.NnVizRenderView as never) }`.

- `apps/site/src/islands/AgentFlowIsland.tsx` — **NEW** (~30 LOC).
  Same shape as JupyterIsland — kind `'agent-flow'`,
  `heavyBoundaryDimensions` from
  `@skb/block-agent-flow/ui-default/heavy-boundary-dimensions`,
  dynamic load resolves `@skb/block-agent-flow/ui-default` →
  `{ default: makeMdxAdapter(m.AgentFlowRenderView as never) }`.

- `apps/site/src/components/Jupyter.astro` — **NEW** (~10 LOC).
  Astro wrapper. Imports the per-kind React island
  (`import JupyterIsland from '../islands/JupyterIsland'`) +
  renders `<JupyterIsland client:load {...Astro.props} />`.
  **`client:load` directive (NOT `client:only`)**: preserves the
  SSR skeleton emitted by HeavyBlockBoundary's first-render
  branch (matches A6 playwright AC#5 zero-layout-shift baseline
  byte-for-byte) AND triggers React hydration on first paint so
  `useEffect` fires → `load()` invokes → real RenderView
  replaces skeleton. `client:only` would NOT render the SSR
  skeleton at all (Astro skips SSR for `client:only` islands),
  which would regress AC#5. The Astro file accepts only
  JSON-serializable props (`Astro.props` is already JSON-shape
  by Astro design) and forwards them to the island via spread.

- `apps/site/src/components/NnViz.astro` — **NEW** (~10 LOC).
  Same shape as Jupyter.astro — imports `NnVizIsland` and renders
  `<NnVizIsland client:load {...Astro.props} />`.

- `apps/site/src/components/AgentFlow.astro` — **NEW** (~10 LOC).
  Same shape as Jupyter.astro — imports `AgentFlowIsland` and
  renders `<AgentFlowIsland client:load {...Astro.props} />`.

- `apps/site/src/components.ts` — **MODIFIED** (~30 LOC delta net).
  Three coupled edits applied atomically:

  **Edit A (re-export `makeMdxAdapter`; ~1 LOC)**: add
  `export` keyword to the existing local `function makeMdxAdapter(...)`
  declaration so the 3 island modules can import it. No semantic
  change; pure visibility change. The `FlatProps` type also gains
  an `export` keyword for the same reason (the islands type their
  props as `FlatProps`).

  **Edit B (remove the 3 React heavy-kind functions; ~32 LOC delete)**:
  the existing `Jupyter` / `NnViz` / `AgentFlow` arrow functions
  (lines 33-64 at HEAD `4aeb279`) are removed — they returned
  `createElement(HeavyBlockBoundary, ...)` which was the broken
  SSR-only path. The 3 dimensions imports (`jupyterDims`,
  `nnVizDims`, `agentFlowDims`) are also removed (now closure-captured
  inside each island). The HeavyBlockBoundary import is removed
  (now imported inside each island). The skeleton CSS import
  (`@skb/heavy-block-boundary/heavy-block-skeleton.css`) **stays
  imported in components.ts** — it must be in the apps/site bundle
  graph so Astro's CSS extraction includes it in the SSR HTML
  the SSR document head (the SSR skeleton needs the stylesheet at first paint
  before any island hydrates). Alternatively the CSS import can
  move to `apps/site/src/layouts/BaseLayout.astro` or to each
  Astro wrapper; PLAN-time decision is **keep in components.ts**
  for minimum diff envelope (TC7 verifies the import line is
  preserved).

  **Edit C (componentsMap entries for 3 heavy keys; ~18 LOC delta)**:
  the 3 heavy entries (lines 74-76 at HEAD) currently read
  `Jupyter: asMdxComponent(Jupyter)` etc. They become Astro
  wrapper imports:

  ```typescript
  import Jupyter from './components/Jupyter.astro';
  import NnViz from './components/NnViz.astro';
  import AgentFlow from './components/AgentFlow.astro';
  // ...
  Jupyter, // direct identifier; no asMdxComponent wrap
  NnViz,
  AgentFlow,
  ```

  Astro's MDX integration accepts `.astro` components in the
  `<Content components={componentsMap} />` map directly — they
  render as Astro components within the MDX render path. The
  `asMdxComponent` cast helper does NOT apply (it cast a React
  ComponentType to satisfy the existing componentsMap shape
  Readonly-Record-from-string-to-ComponentType (angle-bracket
  TS-generic notation elided in prose for lychee discipline;
  the literal TS type stays unchanged in source). The
  `componentsMap` type signature must loosen to accept Astro
  components OR React components. PLAN-time decision: **change
  the `satisfies` type to a union** of ComponentType OR unknown
  (lychee-safe wording in prose; literal TS type expressed in
  source code) with a comment explaining the heavy-vs-light split. Alternative
  is to drop the `satisfies` clause entirely; PLAN-time prefers
  keeping the satisfies for the 5 light entries and using a more
  permissive type for the 3 heavy entries via a `// @ts-expect-error`
  or a `as never` cast. Final form is executor-time decision per
  TC7 (which only checks the 3 Astro imports + 3 PascalCase keys
  resolve to those imports; type-shape is verified by TC10
  typecheck pass).

- `docs/decisions/ADR-0014-heavy-block-boundary.md` — **MODIFIED**
  (~80 LOC delta total). Three coupled edits applied atomically:

  **Edit A (NEW `### v0.3 (2026-05-04; Wave 4 Stage B B7) — Production
  Astro hydration integration` Amendments § entry; ~30 LOC delta)**:
  inserted under the existing `## Amendments` section AFTER the
  `### v0.2.1 (2026-05-03)` block. The new entry follows the
  ADR-0012 v0.1.1 + ADR-0014 v0.2.1 Amendments § precedent. Required
  prose:
  - **Heading**: `### v0.3 (2026-05-04; Wave 4 Stage B B7) —
    Production Astro hydration integration (`apps/site` componentsMap
    `client:load` islands)`.
  - **Gap narrative**: ADR-0014 v0.2 D3 stated "No Astro `client:only`
    directive needed — this is pure React lazy loading inside MDX
    componentsMap (which is React-only by Astro design)." This
    statement was **technically correct in isolation but operationally
    incomplete** — Astro's MDX integration renders React components
    in `componentsMap` SSR-only by default. Without a `client:*`
    directive somewhere in the chain, the `useEffect` lifecycle
    inside `HeavyBlockBoundary` NEVER runs in the browser, so
    `load()` is never invoked and the skeleton stays forever.
    AC#1-#15 (all vitest / jsdom / playwright on T0/T1 rect)
    surfaced layout invariants but did NOT exercise real browser
    hydration end-to-end. Plan-challenger 12/12 absorbtion at
    Pre-A2 covered package ownership, dimensions, API shape, CSS,
    consumer surface, retry, mount-guard, a11y, plugin extensibility,
    bundle impact, and reduced-motion — but did NOT enumerate
    "MDX componentsMap as Astro consumer" as a separate axis.
    Gatekeeper 2026-05-04 directive surfaced the gap by tracing
    the live `dist/notes/sample-blocks/index.html` SSR output:
    no `client:` directive present anywhere; HeavyBlockBoundary
    `useEffect` confirmed dead.
  - **Mitigation** (NEW D10 below): apps/site MDX heavy-block
    consumption flows through 3 NEW Astro wrappers
    (`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`)
    using `client:load`. Each Astro wrapper imports a per-kind
    React island
    (`apps/site/src/islands/{Jupyter,NnViz,AgentFlow}Island.tsx`)
    that closure-captures its kind literal +
    `heavyBoundaryDimensions` import + dynamic `load` arrow
    function. The island accepts only JSON-serializable props
    (the existing `FlatProps` shape). `componentsMap`'s 3
    heavy entries map to those Astro wrappers (not to React
    functions). The 5 light blocks (Callout / Code / Image /
    Math / Pdf) stay as React MdxAdapter-pattern entries
    unchanged.
  - **`client:load` choice (NOT `client:only`) rationale**:
    `client:load` preserves the SSR skeleton (Astro renders the
    React tree to HTML at build time, then hydrates the same
    tree on first browser paint) so A6 playwright AC#5
    zero-layout-shift baseline stays valid byte-for-byte;
    `client:only` skips SSR entirely and would regress AC#5
    + cause a brief blank flash before client-only mount.
    `client:idle` was considered but rejected because heavy
    blocks are visible content (not below-fold telemetry) —
    `client:load` matches the ThemeToggle precedent for
    above-fold interactive surfaces.
  - **Consequence: `## Decision § D3` clarification language**:
    the v0.2 D3 paragraph quoted above is updated in-place
    with a `**Note (v0.3 Amendment)**: ` postscript clarifying
    the production wiring (without rewriting the original
    v0.2 prose); the original D3 paragraph stays for
    historical-pretext reference.
  - **Cross-references** (link-checked; per memories
    `feedback_lychee_line_anchor` no `:line` suffix;
    `feedback_lychee_user_local_paths` no `~/.claude/...` links;
    `feedback_lychee_autolink_in_backticks` no
    angle-bracket-wrapped placeholders inside backticks): this
    PR.md (`docs/plans/wave-4-main/B7-heavy-block-hydration.md`);
    Wave 4 plan v0.2.1; ADR-0011 D2 (substantive Amendment fires
    Row 4); A6 PR.md (#36 `95ba33b`) for AC#5 baseline; A5 PR.md
    (#35 `59a93c0`) for D5 dimensions ownership; gatekeeper
    2026-05-04 directive citation by date.

  **Edit B (NEW `### D10 — Production Astro hydration integration`
  D-list section under `## Decision`; ~30 LOC delta)**: inserted
  AFTER `### D9 — Editor consumer scope` and BEFORE
  `## Acceptance criteria`. The new D10 codifies the production
  wiring as a permanent decision (not just an Amendment narrative):
  - **Astro wrapper layer**: each heavy-kind PascalCase
    componentsMap key maps to a `.astro` wrapper at
    `apps/site/src/components/(Kind).astro` that renders a
    per-kind React island with `client:load`.
  - **React island layer**: each `.astro` wrapper imports a
    per-kind island at `apps/site/src/islands/(Kind)Island.tsx`
    that closure-captures the kind literal +
    `heavyBoundaryDimensions` + the dynamic `load` arrow
    function. The island accepts ONLY JSON-serializable props
    (function props cannot cross the Astro island prop boundary
    because Astro JSON-stringifies island props at build time).
  - **componentsMap entries**: the 3 heavy entries are direct
    `.astro` imports (not React function wrappers); the 5
    light entries stay as React MdxAdapter-pattern entries.
  - **Rationale for the closure pattern**: the `load` arrow
    function is a function value and cannot be passed as a
    prop across the Astro island boundary — Astro
    JSON-stringifies island props at build time and functions
    survive only as identifier bindings inside the island
    module itself. Closing over `load` inside each island
    module sidesteps the constraint while preserving
    per-kind specialization.
  - **A11y + a11y-region invariants unchanged**: D2 + D6
    a11y semantics (`role='status'` + `aria-busy` lifecycle,
    `aria-live='polite'` on text element, spinner
    `aria-hidden`) flow through the island unchanged because
    HeavyBlockBoundary is the same component on both sides
    of the SSR / hydration boundary.
  - **Layout invariants unchanged**: D2 SSR skeleton dimensions
    (width strict, min-height monotone) flow through
    unchanged; A6 AC#5 zero-layout-shift baseline holds
    byte-for-byte (verified by TC15 + TC16 via the AC#16
    extension below).
  - **Editor (Tiptap NodeView) path**: D9 out-of-scope
    invariant unchanged. The editor does NOT consume the
    Astro wrappers (no Astro in editor); editor registers
    the `(Kind)EditorView` exports directly per Wave 3 A3 registerBlocks.

  **Edit C (NEW AC#16 under `## Acceptance criteria`; ~10 LOC
  delta)**: appended AFTER AC#15. Required prose:
  ```
  16. **Production Astro hydration integration (D10)**:
      apps/site/src/components.ts componentsMap heavy entries
      (Jupyter / NnViz / AgentFlow) are Astro wrappers using
      `client:load`. End-to-end browser hydration test
      (playwright `apps/site/playwright/heavy-block-layout-shift.spec.ts`
      AC#16 polling assertion) verifies HeavyBlockBoundary
      `useEffect` runs in the browser; `load()` is invoked;
      real RenderView replaces skeleton with `data-loaded='true'`
      attribute on the outer container OR on a child element;
      real component content (not skeleton placeholder text)
      is present. WSL2 chromium skip preserved (CI canonical;
      memory `feedback_wsl2_chromium_launch.md`).
  ```

  **Status field on line 5 STAYS `accepted`**. v0.3 is a
  substantive Amendment, not a status change — distinct from
  ADR-0014's A8 v0.2.1 `proposed → accepted` promotion which DID
  flip status. Matches B1a v0.1.1 substantive-Amendment Row 4
  classification (per Pre-A3 plan-challenger Q5 absorbtion).

  TC11 + TC13 + TC14 verify the 3 edits land cleanly.

- `apps/site/playwright/heavy-block-layout-shift.spec.ts` —
  **MODIFIED** (~40 LOC delta net). Two coupled edits:

  **Edit A (preserve A6 AC#5 baseline test unchanged)**: the
  existing T0/T1 layout-shift test at lines 30-76 (HEAD `4aeb279`)
  stays byte-for-byte unchanged — its width-strict + height-monotone
  invariants flow through the new hydration path identically
  (HeavyBlockBoundary's SSR skeleton matches across SSR-only +
  client:load paths). PLAN-time projection: TC15 verifies AC#5
  test passes byte-equivalently.

  **Edit B (NEW AC#16 hydration assertion; ~40 LOC delta)**:
  appended AFTER the AC#5 test loop. The new test:
  ```typescript
  for (const kind of HEAVY_KINDS) {
    test(`AC#16 — ${kind} boundary hydrates client:load (data-loaded='true' on settle)`, async ({ page }) => {
      await page.goto('/notes/sample-blocks');
      const selector = `[data-block="${kind}"]`;
      const outer = page.locator(selector);
      await expect(outer).toBeVisible({ timeout: 10_000 });

      // SSR skeleton state present at first paint
      await expect(outer).toHaveAttribute('aria-busy', 'true');

      // Hydration triggers HeavyBlockBoundary useEffect → load() invoked
      // → on success, aria-busy becomes 'false' AND a data-loaded='true'
      // marker appears on the outer container OR a descendant. Allow up to
      // 30s for heavy module load (Pyodide / TF.js / React Flow) under CI.
      await expect(async () => {
        const ariaBusy = await outer.getAttribute('aria-busy');
        const hasLoadedMarker = await outer.locator('[data-loaded="true"]').count();
        // EITHER aria-busy flipped to 'false' (load resolved or rejected)
        // OR a data-loaded='true' marker appeared (hydration confirmed
        // even on slow heavy-module load paths).
        expect(ariaBusy === 'false' || hasLoadedMarker > 0).toBe(true);
      }).toPass({ timeout: 30_000 });
    });
  }
  ```
  WSL2 chromium skip preserved via the existing `test.skip(isWsl2(), ...)`
  guard at line 17. The `data-loaded='true'` marker emission
  contract: HeavyBlockBoundary already toggles `aria-busy='false'`
  on resolve / reject (per A2 + A3 implementation); the AC#16
  assertion accepts either signal as evidence that hydration
  reached the `useEffect` settle. Executor-time decision: if
  HeavyBlockBoundary needs an explicit `data-loaded='true'`
  attribute (per the new AC#16 prose), it MAY be added in this
  PR as a tiny edit to `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
  on the success branch (single attribute write); PLAN-time
  decision is **NOT to touch the boundary package** because the
  existing `aria-busy='false'` signal is sufficient evidence
  for the AC#16 assertion. The AC#16 prose in ADR-0014 is
  written to accept "OR" semantics; reviewer codex may push back
  but the OR-pattern is intentional. TC16 verifies the new
  per-kind test loop is present.

- `apps/site/CONTRACT.md` — **MODIFIED** (~10 LOC delta net).
  Single coupled edit appended to the existing `## Invariants`
  section AFTER the `**Chunking strategy / heavy-block taxonomy**`
  bullet (lines 92-104 at HEAD `4aeb279`). Required prose:
  ```
  - **Heavy block production hydration boundary** (ADR-0014 v0.3
    D10): the 3 heavy-kind componentsMap entries (`Jupyter`,
    `NnViz`, `AgentFlow`) MUST be Astro wrappers at
    `apps/site/src/components/(Kind).astro` using the
    `client:load` directive. Each Astro wrapper imports a
    per-kind React island at `apps/site/src/islands/(Kind)Island.tsx`
    that closure-captures the kind literal,
    `heavyBoundaryDimensions` from the corresponding heavy
    block ui-default package, and the dynamic `load` arrow
    function. The island accepts only JSON-serializable props
    (function props cannot cross the Astro island boundary).
    The 5 light-kind entries (`Callout`, `Code`, `Image`,
    `Math`, `Pdf`) stay as React MdxAdapter-pattern entries
    unchanged. `client:only` is rejected because it skips
    SSR and would regress the A6 AC#5 zero-layout-shift
    baseline.
  ```
  This clause codifies the production wiring as a CONTRACT
  invariant so future edits to `apps/site/src/components.ts`
  cannot accidentally regress the hydration path. TC14
  verifies the clause is present + matches the prose contract.

- `docs/plans/active.md` — **MODIFIED** (~6 LOC delta). Three
  small edits:

  - **B5 row backfill** (line 28 at HEAD): `| #TBD (this) | TBD |
    B5 | ...` → `| #44 | 794cd5d | B5 | ...`. Per the one-row-per-PR
    backfill cadence (verified at session start: `git log --oneline
    | head -1` returns `4aeb279` before B7 EXECUTE, but B5's PR is
    `#44 / 794cd5d` per the merged-pipeline log).
  - **NEW B7 row append**: insert after the B5 row + before the
    Stage A summary row: `| #TBD (this) | TBD | B7 | heavy block
    Astro hydration wiring + ADR-0014 v0.3 (CRITICAL gap) |`.
    Backfilled at NEXT PR (B6) per the one-row-per-PR cadence.
  - **Mandatory-scope row (line 27 at HEAD; "✅ ADR-0014:
    heavy-block client:only + skeleton states ... A1-A7
    implemented + A8 promoted to accepted") update**: append a
    parenthetical clause `+ B7 production Astro hydration wiring
    closing the AC#1-#15-vitest-only gap (2026-05-04)` to the
    existing line. PLAN-time decision is **append, not flip** —
    the row is already ✅ from A8; B7 closes the post-Stage-A
    operational gap, not a new Stage B mandatory item. The
    explicit wording matches the ADR-0014 v0.3 Amendment
    narrative.

  Lines 6 + 24 (Wave 4 phase summary + Stage B 8-PR roster prose)
  do not need edits — Stage B is already documented as 8 PRs
  including B7 NEW per Driver 2. TC18 verifies the 3 edits
  applied; other line content stays byte-unchanged (TC25 partial
  diff envelope).

- `docs/plans/wave-4-main/B7-heavy-block-hydration.md` — **NEW**
  (this PR.md, self-listed per ADR-0006 D8 + Pre-A1+...+B5
  precedent; pr-writer must include the PR.md in the canonical
  `## files` list at PLAN time). ~900 LOC final (PR.md exempt
  from the 200 LOC target per ADR-0011 D2 v0.1.1 + memory
  `feedback_soted_pr_md_discipline`; comparable to A1-A8 + B1a-B5
  PR.md sizes range 468-1687 LOC).

- `docs/audits/codex-runs/2026-05-04-B5-commit.txt` — **NEW**.
  B5-orphan-leftover commit log archive (verified at session
  start as untracked but extant in working tree; B5 commit
  at squash HEAD `794cd5d` shipped without bundling its own
  commit-log archive — back-fill in B7 per the established
  B1b/B2/B3/B4-orphan back-fill pattern of next-PR audit-archive
  consolidation). Truncation per ADR-0011 D6 universal Bash
  invariant R7 already applied at codex-run-time
  (`head -2000 > docs/audits/codex-runs/...`). ~2000 LOC ceiling
  (audit artifact; not subject to the 500-LOC source-file cap
  per audit-archive convention).

- COMMIT-time additions: B7 reviewer R1 audit archive at
  `docs/audits/codex-runs/2026-05-04-B7-pr-reviewer-55.txt`
  (R2 / R3 archives if needed at +1 / +1 archives respectively,
  per the established R-round audit pattern). PLAN-time projection
  is R1 PASS or R1 FAIL → R2 PASS — typical for substantive
  ADR-Amendment + cross-package consumer-pattern PRs (B1a needed
  R2; A1 needed R2 retrospective).

**Final canonical count at COMMIT**: 14 canonical + 1 B5-orphan-
leftover commit-log + 1-2 B7 reviewer R1 (+R2) audit archives =
16-17 files at commit. Lockfile + package.json byte-unchanged.

## test_cases

B7 ships 3 NEW React island modules + 3 NEW Astro wrapper
modules + 1 ADR amendment + 1 CONTRACT clause + 1 playwright
spec extension + 1 componentsMap rewire + bookkeeping + this
PR.md self-listed. TDD-front discipline (per ADR-0011 D1 stage 2
+ memory `feedback_soted_pr_md_discipline`):

1. **Author the playwright AC#16 hydration assertion FIRST** in
   `apps/site/playwright/heavy-block-layout-shift.spec.ts` →
   run via `pnpm --filter=@skb/site exec playwright test
   heavy-block-layout-shift` → observe **RED** (the broken
   pre-B7 state proves the gap: `aria-busy` stays `'true'`
   forever; `data-loaded` marker never appears; assertion
   times out).
2. **Author the 3 island modules + 3 Astro wrappers + componentsMap
   rewire** → run playwright again → observe **GREEN**.
3. **Author ADR-0014 v0.3 + CONTRACT.md taxonomy clause + active.md
   bookkeeping**.
4. **Run `pnpm check` workspace-wide + `pnpm link-check`** → all
   green.

Test triplets (input → expected → location):

- **TC1** (JupyterIsland file existence + closure-capture pattern):
  Input: `test -f apps/site/src/islands/JupyterIsland.tsx &&
  grep -c "from '@skb/block-jupyter/ui-default/heavy-boundary-dimensions'"
  apps/site/src/islands/JupyterIsland.tsx`. Expected: file exists
  + count `1`. Location: shell at repo root.
- **TC2** (NnVizIsland file existence + closure-capture pattern):
  Input: `test -f apps/site/src/islands/NnVizIsland.tsx &&
  grep -c "from '@skb/block-nn-viz/ui-default/heavy-boundary-dimensions'"
  apps/site/src/islands/NnVizIsland.tsx`. Expected: file exists +
  count `1`. Location: same.
- **TC3** (AgentFlowIsland file existence + closure-capture pattern):
  Input: `test -f apps/site/src/islands/AgentFlowIsland.tsx &&
  grep -c "from '@skb/block-agent-flow/ui-default/heavy-boundary-dimensions'"
  apps/site/src/islands/AgentFlowIsland.tsx`. Expected: file exists
  + count `1`. Location: same.
- **TC4** (Jupyter.astro wrapper exists + uses `client:load`):
  Input: `test -f apps/site/src/components/Jupyter.astro &&
  grep -c 'client:load' apps/site/src/components/Jupyter.astro`.
  Expected: file exists + count `1`. Location: same.
- **TC5** (NnViz.astro wrapper exists + uses `client:load`):
  Input: `test -f apps/site/src/components/NnViz.astro &&
  grep -c 'client:load' apps/site/src/components/NnViz.astro`.
  Expected: file exists + count `1`. Location: same.
- **TC6** (AgentFlow.astro wrapper exists + uses `client:load`):
  Input: `test -f apps/site/src/components/AgentFlow.astro &&
  grep -c 'client:load' apps/site/src/components/AgentFlow.astro`.
  Expected: file exists + count `1`. Location: same.
- **TC7** (componentsMap rewire — 3 heavy keys map to Astro
  wrapper imports): Input: `grep -cE
  "import (Jupyter|NnViz|AgentFlow) from './components/(Jupyter|NnViz|AgentFlow).astro'"
  apps/site/src/components.ts`. Expected: `≥ 3`. Location: same.
- **TC8** (components.ts no-residue: HeavyBlockBoundary import
  removed): Input: `grep -c "from '@skb/heavy-block-boundary'$"
  apps/site/src/components.ts`. Expected: `0` (the named import
  line for HeavyBlockBoundary is gone; only the CSS side-effect
  import stays). Location: same. NOTE: the side-effect CSS import
  `import '@skb/heavy-block-boundary/heavy-block-skeleton.css';`
  stays — that path differs from the named import target so the
  grep boundary `'$` (end-of-line + close-quote) discriminates.
- **TC9** (apps/site vitest regression — no existing test file
  breaks): Input: `pnpm --filter=@skb/site test`. Expected:
  exit 0; the existing 11 test files (`components-map`,
  `dims-source`, `fouc-script`, `lazy-chunking`,
  `sample-blocks-page`, `sample-blocks-astro-page`, `search-cjk`,
  `search-reindex`, `search-ui`, `word-level-match`,
  `visual-smoke` — note the 11th file `visual-smoke.spec.ts`
  is a vitest playwright-style spec that vitest ignores by
  pattern) all PASS unchanged.
- **TC10** (apps/site typecheck clean — Astro `.astro` imports
  resolve via `@astrojs/react` types; per-kind island generic
  parameter (P) resolves correctly): Input: `pnpm --filter=@skb/site
  typecheck`. Expected: exit 0.
- **TC11** (apps/site lint clean — no `max-lines` warning on the
  3 islands ~30 LOC each + 3 Astro wrappers ~10 LOC each):
  Input: `pnpm --filter=@skb/site lint`. Expected: exit 0.
- **TC12** (apps/site build pass + Astro emits per-kind island
  bundle): Input: `pnpm --filter=@skb/site build && ls
  apps/site/dist/_astro/JupyterIsland.*.js
  apps/site/dist/_astro/NnVizIsland.*.js
  apps/site/dist/_astro/AgentFlowIsland.*.js`. Expected: build
  exit 0; 3 island bundle files present (Astro emits one
  per-island JS chunk for `client:load` islands; the filename
  pattern is `(IslandName).(hash).js` under `_astro/`).
  Location: same.
- **TC13** (ADR-0014 v0.3 Amendments § entry present): Input:
  `grep -c '### v0.3 (2026-05-04; Wave 4 Stage B B7)'
  docs/decisions/ADR-0014-heavy-block-boundary.md`. Expected:
  `1`. Location: same.
- **TC14** (ADR-0014 D10 + AC#16 prose present): Input:
  `grep -c '### D10' docs/decisions/ADR-0014-heavy-block-boundary.md
  && grep -c '^16\.' docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: both `≥ 1`. Location: same.
- **TC15** (apps/site/CONTRACT.md heavy block hydration boundary
  clause appended): Input: `grep -c 'Heavy block production
  hydration boundary' apps/site/CONTRACT.md`. Expected: `1`.
  Location: same.
- **TC16** (playwright spec AC#16 polling assertion present):
  Input: `grep -c "AC#16 — " apps/site/playwright/heavy-block-layout-shift.spec.ts
  && grep -c "data-loaded" apps/site/playwright/heavy-block-layout-shift.spec.ts`.
  Expected: both `≥ 1`. Location: same.
- **TC17** (playwright spec AC#5 baseline preserved byte-equivalent):
  Input: `grep -c 'AC#5 — ' apps/site/playwright/heavy-block-layout-shift.spec.ts`.
  Expected: `1` (existing AC#5 per-kind loop test stays). Location:
  same.
- **TC18** (active.md bookkeeping applied): Input: `grep -c '#44'
  docs/plans/active.md && grep -c '794cd5d' docs/plans/active.md
  && grep -c '| B7 |' docs/plans/active.md`. Expected: each `≥ 1`.
  Location: same.
- **TC19** (PR.md self-listed): Input: `grep -c
  'B7-heavy-block-hydration.md' docs/plans/wave-4-main/B7-heavy-block-hydration.md`.
  Expected: `≥ 2`. Location: same.
- **TC20** (lychee link-check clean): Input: `pnpm link-check`.
  Expected: exit 0. Per memories
  `feedback_lychee_line_anchor.md` no `:line` suffix on relative
  file links; `feedback_lychee_user_local_paths.md` no
  `~/.claude/...` links; `feedback_lychee_npmjs_403.md` no
  `npmjs.com/package/...` links;
  `feedback_lychee_autolink_in_backticks.md` no
  angle-bracket-wrapped placeholder patterns inside backticks.
  PLAN-time check: `client:load` is a literal Astro directive
  (no angle brackets, no angle-bracket-wrapped placeholder shape — matches the
  HTML attribute scheme `name:value` lychee accepts as
  non-autolink prose). Same for the 8 PascalCase componentsMap
  keys quoted as `Callout`, `Jupyter`, etc. — these are bare
  identifiers in backticks, NOT angle-bracket-wrapped, so
  lychee treats them as code spans and ignores. All
  cross-references in the v0.3 Amendments § + new D10 + new
  AC#16 + CONTRACT.md taxonomy clause + active.md updates +
  PR.md self-references resolve.
- **TC21** (size-check): Input: `pnpm size-check`. Expected:
  exit 0 (no source file > 500 LOC). PLAN-time projections:
  islands ~30 LOC each, Astro wrappers ~10 LOC each, components.ts
  net delta to ~70 LOC, ADR-0014 post-edit ~670 LOC (under 500
  fails — verify EXECUTE-time and split if needed; PLAN-time
  alternative: move the new D10 + AC#16 + Amendments § into a
  separate `docs/decisions/ADR-0014-amendments.md` companion
  doc if line count exceeds 500 — risk register documents).
  CONTRACT.md ~123 LOC (under 200 warn, well under 500 hard).
  Playwright spec ~120 LOC (under 200 warn).
- **TC22** (workspace-wide regression): Input: `pnpm check`.
  Expected: exit 0 (lint + typecheck + test + build + size-check
  all PASS).

Byte-unchanged guards (TC23-TC30):

- **TC23** (lockfile byte-unchanged): `git diff main --
  pnpm-lock.yaml` → empty diff (B7 adds NO deps).
- **TC24** (package.json byte-unchanged): `git diff main --
  package.json apps/site/package.json packages/heavy-block-boundary/package.json
  packages/block-jupyter/package.json packages/block-nn-viz/package.json
  packages/block-agent-flow/package.json packages/block-callout/package.json
  packages/block-code/package.json packages/block-image/package.json
  packages/block-math/package.json packages/block-pdf/package.json` →
  empty diff. PLAN-time decision: NO `apps/site/package.json` edit
  needed; `@astrojs/react` is already declared.
- **TC25** (B1a/B1b/B2/B3/B4/B5 shipped files byte-unchanged):
  `git diff main -- apps/site/src/lib/word-level-match.ts
  apps/site/src/__tests__/word-level-match.test.ts
  apps/site/src/components/SearchBox.astro
  apps/site/src/__tests__/search-cjk.test.ts
  apps/site/playwright/search.spec.ts
  content/notes/sample-blocks/index.mdx
  agent-contract.md scripts/render/types.ts
  scripts/__tests__/generate-configs.test.ts
  CLAUDE.md AGENTS.md docs/runbooks/codex-tool-invocations.md` →
  empty diff. PLAN-time projection: B7 does not touch any of
  these files.
- **TC26** (heavy-block-boundary package + 8 block packages
  byte-unchanged): `git diff main --
  packages/heavy-block-boundary/ packages/block-callout/
  packages/block-code/ packages/block-image/
  packages/block-math/ packages/block-pdf/
  packages/block-jupyter/src/ packages/block-jupyter/CONTRACT.md
  packages/block-nn-viz/src/ packages/block-nn-viz/CONTRACT.md
  packages/block-agent-flow/src/ packages/block-agent-flow/CONTRACT.md` →
  empty diff. PLAN-time projection: B7 does NOT touch any block
  package source or contract; the islands import from
  `@skb/block-(kind)/ui-default/heavy-boundary-dimensions` and
  `@skb/block-(kind)/ui-default` (existing exports unchanged).
  HeavyBlockBoundary signal `aria-busy='false'` on settle is the
  pre-existing A2 + A3 behavior (PLAN-time decision: NO edit to
  HeavyBlockBoundary.tsx for an explicit `data-loaded='true'`
  attribute; AC#16 OR-pattern accepts `aria-busy='false'` as
  evidence per `## files` Edit B note above).
- **TC27** (13 ADR files byte-unchanged except ADR-0014):
  `git diff main -- docs/decisions/ADR-{0001,0002,0003,0004,0005,0006,0007,0008,0009,0010,0011,0012,0013}*.md
  docs/decisions/README.md` → empty diff (only ADR-0014 touched).
- **TC28** (B6-scope files byte-unchanged): `git diff main --
  docs/decisions/ADR-0015*.md` → empty diff (B6's potential
  Wave 4 close ADR not in B7 scope; verifies no premature
  Wave-4-close prose drift).
- **TC29** (prior wave-4-main PR.md files byte-unchanged):
  `git diff main -- docs/plans/wave-4-main/{A1,A2,A3,A4,A5,A6,A7,A8,Pre-A1,Pre-A2,Pre-A3,B1a,B1b,B2,B3,B4,B5}-*.md`
  → empty diff.
- **TC30** (Wave 4 plan doc byte-unchanged): `git diff main --
  docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md` →
  empty diff. PLAN-time decision: NO Wave 4 plan v0.2.2 Amendment
  needed for B7 — Driver 2 already authorizes B7 NEW per v0.2.1.

Byte-unchanged playwright spec discipline:

- **TC31** (playwright spec AC#5 + AC#16 size below 200): `wc -l
  apps/site/playwright/heavy-block-layout-shift.spec.ts` →
  ≤ 200 (PLAN-time projection: 76 LOC HEAD + ~40 LOC delta = ~116
  LOC; safe).
- **TC32** (sample-blocks playwright route resolves): visited at
  `/notes/sample-blocks` — verified at session start the route
  exists via `apps/site/src/pages/notes/[...slug].astro` +
  `content/notes/sample-blocks/index.mdx`. The MDX body contains
  `<Jupyter ... />`, `<NnViz ... />`, `<AgentFlow ... />` markers
  that the `componentBlockTag` regex in the slug page detects to
  load `componentsMap` lazily. Existing route stays
  byte-unchanged (TC32 verifies no MDX content drift).

## contracts_affected

- **`apps/site/CONTRACT.md`** — **EDITED** (~10 LOC append).
  New invariant clause "Heavy block production hydration boundary
  (ADR-0014 v0.3 D10)" appended to the existing `## Invariants`
  section AFTER the "Chunking strategy / heavy-block taxonomy"
  bullet. Rationale: B7 codifies the production wiring
  (componentsMap heavy entries = Astro wrappers using `client:load`;
  per-kind islands closure-capture `heavyBoundaryDimensions` +
  dynamic load) as an apps/site CONTRACT invariant so future
  refactors of `apps/site/src/components.ts` cannot accidentally
  regress the hydration path. The clause is **additive** (does
  not contradict any existing invariant) — comparable to the
  B1b additive search-UI clause (`Word-level result filter`)
  added at HEAD `5ec7123`. TC15 verifies presence; TC25
  verifies B1b's preexisting clause stays byte-unchanged.
- **No other CONTRACT.md files modified.** B7 does NOT touch any
  `packages/*/CONTRACT.md`. The 8 block packages
  (`packages/block-{callout,code,image,math,pdf,jupyter,nn-viz,agent-flow}/CONTRACT.md`)
  + the heavy-block-boundary package
  (`packages/heavy-block-boundary/CONTRACT.md`) + the other 5
  workspace package CONTRACT.md files all remain byte-unchanged.
  TC26 verifies empty diff.

## adr_touched

- **`docs/decisions/ADR-0014-heavy-block-boundary.md`** — **EDITED**
  (v0.3 Amendment per `## files` Edit A + Edit B + Edit C above).
  Status field (line 5) **unchanged at `accepted`**. Three coupled
  edits ship in the same commit:
  - Edit A: NEW `### v0.3 (2026-05-04; Wave 4 Stage B B7) —
    Production Astro hydration integration` Amendments § entry
    (~30 LOC delta) recording the gap narrative + mitigation
    pointer + `client:load` rationale + cross-references.
  - Edit B: NEW `### D10 — Production Astro hydration integration`
    D-list section under `## Decision` (~30 LOC delta) codifying
    the production wiring as a permanent decision.
  - Edit C: NEW AC#16 under `## Acceptance criteria` (~10 LOC
    delta) codifying the end-to-end hydration assertion.

  Total ADR file delta ~70-80 LOC. Post-edit file size ~660-670
  LOC; below the 500 LOC hard cap is a concern — see TC21
  risk-register entry. PLAN-time projection: PASS at ~670 LOC
  but verify EXECUTE-time; if size hits 500 the executor splits
  into a companion `docs/decisions/ADR-0014-amendments.md` doc
  per the contingency in TC21. Reviewer pushback risk on the
  size flag is **acceptable** — the 500 LOC cap is a hard rule
  but ADRs accumulate Amendments as the source of truth for
  decision evolution; comparable ADR-0006 has 320+ LOC and
  ADR-0011 has 480+ LOC; B7's ADR-0014 v0.3 is the natural
  growth path.

- **No other ADR files modified.** ADR-0012 (search index stack)
  remains v0.1.1 from B1a. ADR-0011, ADR-0006, ADR-0007, ADR-0008,
  ADR-0013 + the others all stay byte-unchanged. TC27 verifies
  empty diff.

## D2 trigger judgment

Per ADR-0007 D2 row mapping for B7 (locked PLAN-time per the
Wave 4 plan v0.2.1 Driver 2 + B1a v0.1.1 substantive-Amendment
precedent):

- **Row 1 (CONTRACT.md change)**: **HIT.** B7 edits
  `apps/site/CONTRACT.md` to append the heavy block production
  hydration boundary invariant clause (~10 LOC append). Per
  ADR-0011 D2 v0.1.1 trigger description, **any** modification
  to a CONTRACT.md file fires Row 1 — including additive
  invariant clauses. B1b (HEAD `5ec7123`) Row 1 precedent
  applies (additive `Word-level result filter` clause was
  treated as Row 1 HIT). TC15 verifies presence + diff
  envelope.
- **Row 2 (package add / remove)**: **NO.** B7 adds zero new
  workspace packages. The 3 NEW islands + 3 NEW Astro wrappers
  are internal to the existing `@skb/site` package. No
  `package.json` edit; no `pnpm-lock.yaml` delta (TC23 + TC24
  verify).
- **Row 3 (cross-cutting refactor)**: **NO.** B7 is targeted
  hydration wiring + ADR amendment + small CONTRACT clause +
  bookkeeping; only `apps/site/src/components.ts` is refactored
  in-place (3 React heavy-kind functions removed; 3 Astro
  imports added). No cross-package refactor.
- **Row 4 (new ADR required)**: **HIT** (interpreted per Pre-A3
  + B1a precedent: substantive Amendments — ones that add new
  policy / new D-list section / new AC — DO fire Row 4 because
  they constitute a rev of the decision document's effective
  scope). ADR-0014 v0.3 adds: (a) NEW `### v0.3` Amendments §
  entry recording the gap + mitigation, (b) NEW `### D10` D-list
  section codifying the production wiring as a permanent
  decision, (c) NEW AC#16 codifying the hydration assertion.
  This is broader than a pure status flip (contrast: A8's
  ADR-0014 v0.2.1 was a status flip + post-implementation
  review pointer with NO new D-list / AC, treated as Row 4 NO).
  B1a v0.1.1 precedent (substantive Amendment with new
  criterion 4 mitigation prose, treated as Row 4 HIT) applies
  identically. The locked Wave 4 plan v0.2.1 Driver 2 final
  paragraph "B7 D2 trigger: Row 4 (ADR-0014 v0.3 substantive
  amendment with new D10 + AC#16) HIT + Row 1
  (apps/site/CONTRACT.md heavy block taxonomy clause) HIT →
  stage 4 PRE-COMMIT CLAUDE REVIEW fires" confirms.
- **Row 5 (cross >= 3 packages)**: **NO** (flag-only). B7's
  source files cross 0 packages — all changes inside
  `apps/site/src/` (islands + components + components.ts +
  CONTRACT.md + playwright spec) + `docs/decisions/` (ADR-0014)
  + `docs/plans/` (active.md + this PR.md) +
  `docs/audits/codex-runs/` (B5-orphan + B7 reviewer audit
  archives). Cross-package scope is **1** (`apps/site` only).
  The user-prompt note about Row 5 being "flag-only (Row 5
  alone doesn't trigger stage 4)" matches: even if Row 5 were
  considered to apply by reading "the islands import from 3
  block packages and HeavyBlockBoundary package", the imports
  are pre-existing surfaces — only the wiring layer changes.
  PLAN-time decision: Row 5 NO; Rows 1 + 4 are the
  stage-4-firing rows.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** The new
  directory `apps/site/src/islands/` is the first occupant; no
  sibling-divergent pattern (no `apps/site/src/wrappers/` or
  `apps/site/src/widgets/` exists already to create a
  naming-divergence gap). The directory name `islands/` follows
  the Astro-native nomenclature for `client:*` interactive
  surfaces (Astro docs use the term "islands" canonically).
  The 3 island filenames follow the `(Kind)Island.tsx`
  PascalCase pattern matching the existing
  `(Kind)RenderView` + `(Kind)EditorView` block package pattern
  (per Wave 3 A3 + ADR-0014 D4). PLAN-time decision: Row 6 NO
  (no asymmetry).
- **Row 7 (legacy doc resurrection)**: **NO.** ADR-0014 was
  promoted to `accepted` at A8 (2026-05-03) and is the current
  Wave 4+ heavy-block ADR; v0.3 is forward-progress (capturing
  a post-acceptance operational gap), not resurrection.
- **Row 8 (CI / build / deploy / auth / security)**: **NO.**
  B7 touches no `.github/workflows/`, no `Dockerfile`, no
  auth-related code paths, no security-related code paths. The
  3 islands + 3 Astro wrappers are pure component-render
  surfaces (no network / I/O / crypto). The playwright spec
  extension runs in CI under the existing
  `apps/site/playwright/` path (no new CI hookup).

→ **Row 1 HIT + Row 4 HIT → D1 stage 4 PRE-COMMIT CLAUDE REVIEW
FIRES.** Per ADR-0011 D1 D2 row mapping, either Row 1 OR Row 4
fires stage 4; both HIT here. Pipeline: PLAN → EXECUTE → REVIEW
(codex-pr-reviewer-55) → PRE-COMMIT CLAUDE REVIEW (orchestrator
self) → COMMIT (reviewer codex per ADR-0006 D8) → ACCEPT
(pr-writer second invocation per ADR-0011 D1 stage 6).

## acceptance

1. **3 NEW per-kind React islands authored**:
   `apps/site/src/islands/JupyterIsland.tsx`,
   `apps/site/src/islands/NnVizIsland.tsx`,
   `apps/site/src/islands/AgentFlowIsland.tsx` — each ~30 LOC,
   each closure-captures kind literal +
   `heavyBoundaryDimensions` import + dynamic `load` arrow
   function. TC1 + TC2 + TC3 evidence.

2. **3 NEW Astro wrappers authored**:
   `apps/site/src/components/Jupyter.astro`,
   `apps/site/src/components/NnViz.astro`,
   `apps/site/src/components/AgentFlow.astro` — each ~10 LOC,
   each renders the corresponding island with `client:load`
   directive (NOT `client:only`). TC4 + TC5 + TC6 evidence.

3. **`client:load` (NOT `client:only`) rationale satisfied**:
   SSR skeleton continues to render at first paint
   (HeavyBlockBoundary's first-render branch); the same React
   tree hydrates in the browser → `useEffect` fires → `load()`
   invokes → real RenderView replaces skeleton. A6 AC#5
   zero-layout-shift baseline holds byte-equivalently. TC17
   evidence (existing AC#5 test stays byte-unchanged + still
   passes).

4. **`apps/site/src/components.ts` componentsMap rewired**:
   the 3 heavy PascalCase keys (Jupyter / NnViz / AgentFlow)
   map to the 3 NEW Astro wrapper imports; the 5 light keys
   (Callout / Code / Image / Math / Pdf) stay as React
   MdxAdapter-pattern entries unchanged. TC7 evidence.

5. **`apps/site/src/components.ts` no-residue: HeavyBlockBoundary
   named import removed** (only the side-effect CSS import
   stays for SSR document-head extraction). The 3 React heavy-kind
   arrow functions (Jupyter / NnViz / AgentFlow at lines 33-64
   pre-edit) are removed; the 3 dimensions imports are
   removed (now closure-captured inside each island). TC8
   evidence.

6. **`makeMdxAdapter` + `FlatProps` re-exported from
   components.ts** so the 3 islands can import them without
   duplication. Pure visibility change; no semantic change.

7. **ADR-0014 v0.3 substantive Amendment authored**:
   `## Amendments` section gains a new
   `### v0.3 (2026-05-04; Wave 4 Stage B B7) — Production
   Astro hydration integration` entry recording the gap
   narrative (AC#1-#15 vitest/jsdom never tested real Astro
   browser hydration; plan-challenger 12/12 didn't enumerate
   "MDX componentsMap as Astro consumer" axis) + mitigation
   pointer (NEW D10) + `client:load` choice rationale +
   cross-references. TC13 evidence.

8. **ADR-0014 NEW D10 D-list section authored**:
   `### D10 — Production Astro hydration integration`
   inserted under `## Decision` AFTER D9, codifying the
   production wiring (Astro wrapper layer + React island
   layer + componentsMap entries + closure-pattern rationale
   + a11y / layout invariants unchanged + editor scope
   unchanged). TC14 evidence (`### D10` grep).

9. **ADR-0014 NEW AC#16 acceptance criterion authored**:
   AC#16 codifies the end-to-end browser hydration assertion
   (componentsMap heavy entries are Astro islands using
   `client:load`; HeavyBlockBoundary `useEffect` runs in
   browser; `load()` invoked; real RenderView replaces
   skeleton with `data-loaded='true'` OR `aria-busy='false'`
   evidence; WSL2 chromium skip preserved). TC14 evidence
   (`^16\.` grep).

10. **ADR-0014 status field unchanged at `accepted`**: line 5
    of `docs/decisions/ADR-0014-heavy-block-boundary.md`
    continues to read `| 状态 | accepted |`. v0.3 is a
    substantive Amendment, not a status flip — distinct from
    A8's v0.2.1 promotion which DID flip status. Matches B1a
    v0.1.1 substantive-Amendment Row 4 classification.

11. **`apps/site/CONTRACT.md` heavy block hydration boundary
    invariant clause appended**: new bullet "Heavy block
    production hydration boundary (ADR-0014 v0.3 D10)"
    appended to the `## Invariants` section AFTER the
    "Chunking strategy / heavy-block taxonomy" bullet. The
    clause codifies that componentsMap heavy entries MUST be
    Astro wrappers using `client:load`, and per-kind islands
    closure-capture `heavyBoundaryDimensions` + dynamic load.
    `client:only` is explicitly rejected. TC15 evidence.

12. **`apps/site/playwright/heavy-block-layout-shift.spec.ts`
    AC#16 hydration assertion appended**: new per-kind test
    loop `AC#16 — <kind> boundary hydrates client:load
    (data-loaded='true' on settle)` polling for either
    `aria-busy='false'` OR `data-loaded='true'` marker on
    each heavy block surface. WSL2 chromium skip preserved.
    Existing AC#5 layout-shift test loop stays byte-equivalent.
    TC16 + TC17 evidence.

13. **playwright spec stays under ESLint warn cap (≤ 200
    LOC)**: post-edit ~116 LOC; safe. TC31 evidence.

14. **apps/site vitest regression PASS**: the existing 11 test
    files all PASS unchanged; no regression introduced by the
    componentsMap rewire (the existing
    `components-map.test.ts` will be RE-VERIFIED against the
    new shape; PLAN-time projection is the test asserts the
    8 PascalCase keys exist + each value is a valid render
    surface — Astro components satisfy the surface check
    because Astro's MDX integration accepts `.astro`
    components; if the test asserts React-specific shape,
    the test gets a 1-2 LOC update in B7 scope per executor
    decision). PLAN-time check at session-start: components-map.test.ts
    asserts only the 8 keys + componentsMap structure; if
    React-typeof asserts surface, executor adapts. TC9
    evidence (workspace-wide vitest PASS).

15. **apps/site typecheck + lint clean**: `@astrojs/react` types
    resolve the `.astro` imports; the per-kind island generic
    the (P) generic parameter resolves correctly; no `max-lines` warnings on the
    new modules. TC10 + TC11 evidence.

16. **apps/site build pass + Astro emits 3 per-kind island
    bundles**: `dist/_astro/JupyterIsland.(hash).js`,
    `NnVizIsland.(hash).js`, `AgentFlowIsland.(hash).js` all
    present (Astro's island bundling emits one JS chunk per
    `client:load` island). TC12 evidence.

17. **`docs/plans/active.md` bookkeeping applied**: B5 row
    backfilled (`#TBD (this) | TBD` → `#44 | 794cd5d`); NEW
    B7 TBD row added; mandatory-scope row 27 (ADR-0014
    heavy-block status) gains the parenthetical "+ B7
    production Astro hydration wiring closing the
    AC#1-#15-vitest-only gap (2026-05-04)". TC18 evidence.

18. **lychee link-check clean**: all cross-references in the
    v0.3 Amendments § + new D10 + new AC#16 + CONTRACT.md
    taxonomy clause + active.md updates + PR.md
    self-references resolve. Per memories
    `feedback_lychee_line_anchor.md` no `:line` suffix;
    `feedback_lychee_user_local_paths.md` no `~/.claude/...`
    links; `feedback_lychee_npmjs_403.md` no
    `npmjs.com/package/...` links;
    `feedback_lychee_autolink_in_backticks.md` no
    angle-bracket-wrapped placeholder patterns inside
    backticks. TC20 evidence.

19. **`pnpm size-check` workspace-wide clean**: no source
    file exceeds 500 LOC hard cap. ADR-0014 post-edit
    ~660-670 LOC is the closest-to-cap file; PLAN-time
    projection is PASS but EXECUTE-time verification
    mandatory (contingency: split Amendments § + D10 +
    AC#16 into a companion doc if needed). TC21 evidence.

20. **`pnpm check` exit 0 globally** — workspace-wide
    regression baseline. B7's hydration wiring + small
    component additions + ADR amendment is additive; no
    existing test breaks. TC22 evidence.

21. **All B7 deliverables ship in the SAME commit** per
    ADR-0006 D8 explicit-file-list staging discipline.
    Reviewer codex commits 14 canonical + 1 B5-orphan-leftover
    + 1-2 B7 reviewer audit archives = 15-16 files in a
    single explicit list (see `## Codex commit (D1 stage 5)
    staging` below). Per memory
    `feedback_git_operator_explicit_stage.md` lockfile-scope
    discipline: lockfile MUST be byte-unchanged (TC23
    pre-commit verifies).

22. **Pre-commit Claude review (D1 stage 4) walks the diff**
    per Row 1 + Row 4 HIT trigger. Stage 4 review focuses on:
    (i) the `client:load` choice (NOT `client:only`) is
    consistently applied across all 3 Astro wrappers (TC4 +
    TC5 + TC6); (ii) the 3 islands closure-capture (NOT
    prop-pass) the `load` function (Astro JSON-stringifies
    island props; function props would silently fail) — verify
    by `grep -c 'load:' apps/site/src/islands/*.tsx` returns
    `3` (one `load:` line per island within the
    HeavyBlockBoundary call); (iii) ADR-0014 post-edit size
    stays under 500 LOC hard cap (TC21); (iv) AC#16
    OR-pattern (`aria-busy='false'` OR `data-loaded='true'`)
    in playwright is intentional and matches the ADR prose
    (avoids unnecessary edit to HeavyBlockBoundary.tsx for an
    explicit `data-loaded` attribute); (v) `apps/site/CONTRACT.md`
    invariant clause is additive (does not contradict the
    existing chunking-strategy / heavy-block-taxonomy bullet);
    (vi) the 14-file canonical commit list matches `## files`
    (no scope creep; ADR-0006 D8 explicit-file-list staging).

23. **Codex review iterations expected**: R1 + 0-1 forward-fix.
    Typical risk classes for B7:
    (a) the closure pattern in islands — reviewer may push
    back on the makeMdxAdapter re-export choice OR ask for
    duplication-free factoring; orchestrator-self iterates
    within bounded ~30 LOC envelope per island;
    (b) the AC#16 OR-pattern (`aria-busy='false'` OR
    `data-loaded='true'`) — reviewer may insist on adding the
    explicit `data-loaded='true'` attribute to
    HeavyBlockBoundary.tsx; orchestrator pushes back per the
    PLAN-time decision (heavy-block-boundary package stays
    byte-unchanged per TC26; the OR-pattern matches the v0.3
    AC#16 ADR prose); reviewer pushback triggers
    cross-package consumer-pattern memory `feedback_pr_reviewer_authority_at_head.md`
    (read HeavyBlockBoundary.tsx at HEAD to verify
    `aria-busy` toggle landed at A2 + A3) before any boundary-
    package edit;
    (c) ADR-0014 size approaching 500 LOC — reviewer may push
    on either the split-companion-doc contingency OR a
    tighter Amendments § prose; orchestrator-self iterates
    within bounded ~80 LOC envelope or splits per TC21
    contingency;
    (d) componentsMap type-shape — reviewer may push on the
    `satisfies` clause loosening / `as never` cast strategy;
    orchestrator iterates within bounded ~5 LOC envelope on
    that line.

## Plan-challenger absorbtion (locked at PLAN time)

**NOT dispatched.** Per Wave 4 plan v0.2.1 Driver 2 + user-prompt
(2026-05-04) directive: B7's design is pre-discussed with
gatekeeper + user-accepted as orchestrator's 4-point proposal
(islands + Astro wrappers + componentsMap rewire + ADR-0014 v0.3).
User-gatekeeper-locked path α with clarifications:

- **apps-local islands NOT a new `@skb/heavy-block-boundary-islands`
  package** — keeps cross-package surface unchanged + matches the
  apps/site-as-integration-point pattern (per ADR-0014 D4 + D5
  "apps/site composition continues to be the integration point
  for the 3 first consumers"); future plugin blocks ship their
  own pre-wrapped helpers per D4.
- **B5 → B7 → B6 position** in re-locked Stage B sequence (B7
  ships BEFORE Wave-4-close-ceremony B6 because B6 needs B7's
  hydration evidence to declare Wave 4 done).
- **B1 split inheritance**: B1a + B1b precedent (PLAN-time
  v0.1.1 Amendment + EXECUTE-time integration in B1b) does NOT
  apply directly to B7 — B7 is a single PR because the
  islands + Astro wrappers + componentsMap rewire + AC#16
  playwright assertion are all atomic (a partial B7 with only
  islands but no playwright would not close the AC#1-#15
  vitest-only gap that surfaces this PR).

PLAN-time deterministic-design rationale: the closure pattern
in islands is the canonical Astro-island-with-function-prop
solution (Astro docs cite the same pattern under "Sharing State
Between Islands" and "Passing complex props to islands");
deterministic + no ambiguity to challenge. Plan-challenger
codex would not surface novel challenges beyond the 4 PLAN-time
risk classes already documented in `## Risk register` below.

## Risk register (B7-specific)

Per Wave 4 plan v0.2.1 Driver 2 risk discipline + B7's
operational risk surface (3 NEW source surfaces touching the
production hydration path is non-trivial despite small per-file
LOC):

1. **Astro island prop-serialization constraint surfacing
   EXECUTE-time**: Astro JSON-stringifies island props at build
   time. Function props (e.g., `load: () => import(...)`)
   silently FAIL — they survive the build but become `undefined`
   at hydration. The closure pattern (`load` defined inside the
   island module, closure-captured) sidesteps the constraint
   for the 3 known kinds. **Mitigation**: TC10 typecheck verifies
   the island signature accepts only `FlatProps`; TC12 build
   verifies Astro's island bundler emits the per-kind chunk.
   **Residual risk**: if the island accidentally accepts a
   function prop in a future refactor, the failure mode is
   `useEffect` runs but `load` is undefined →
   TypeError at runtime. The TC16 playwright AC#16 assertion
   catches that failure mode (TypeError leaves `aria-busy='true'`
   + no `data-loaded` marker, asserting fails). Acceptable risk.

2. **HeavyBlockBoundary `aria-busy='false'` signal contract**:
   the AC#16 OR-pattern relies on `aria-busy` toggling to
   `'false'` on resolve OR reject (per A2 + A3 implementation).
   Verified at session start by reading
   `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
   lines 1-50 (showed `useState` for `Component` + `error` +
   `mountedRef` + `useEffect` skeleton). PLAN-time projection
   is the toggle is wired. **Mitigation**: if reviewer codex
   pushes for an explicit `data-loaded='true'` attribute (per
   the AC#16 prose), the OR-pattern still accepts the
   `aria-busy` signal — reviewer pushback would trigger
   memory `feedback_pr_reviewer_authority_at_head.md` (read
   at HEAD before overruling). **Residual risk**: if `aria-busy`
   never toggles in production for some unforeseen reason
   (e.g., a `useEffect` early-return), AC#16 fails in CI →
   B7 is rejected at REVIEW stage 3. Acceptable risk; AC#16
   is a true assertion, not a placebo.

3. **WSL2 chromium playwright skip pattern**: per memory
   `feedback_wsl2_chromium_launch.md`, playwright chromium
   launch fails on WSL2 missing libnss3 / libdbus / libatk /
   libcups; the existing AC#5 loop already uses the
   `test.skip(isWsl2(), ...)` guard at line 17. **Mitigation**:
   AC#16 inherits the same module-level skip — a single
   `test.skip(...)` call applies to ALL `test(...)` declarations
   in the file. CI canonical (GitHub Actions runner has the
   chromium deps preinstalled). PLAN-time checked B7 does NOT
   need a separate skip clause for AC#16. **Residual risk**:
   none.

4. **ADR-0014 v0.3 vs v0.2.1 amendment-classification consistency**:
   v0.2.1 (status flip + post-implementation review pointer with
   NO new policy / D-list / AC) was treated as Row 4 NO at A8.
   v0.3 (substantive Amendment with NEW D10 + NEW AC#16) is
   broader and treated as Row 4 HIT — matches B1a v0.1.1
   precedent (substantive Amendment with new criterion 4
   mitigation prose, treated as Row 4 HIT). **Mitigation**: the
   `## D2 trigger judgment` section above documents this
   classification explicitly with cross-references to A8 + B1a
   precedents. Reviewer codex pushback on the Row 4 classification
   would trigger memory `feedback_pr_reviewer_authority_at_head.md`
   + Pre-A3 plan-challenger Q5 absorbtion read. PLAN-time
   projection: classification holds.

5. **Stage A AC#5 zero-layout-shift baseline byte-equivalence**:
   the `client:load` directive renders the React tree to HTML
   at build time (matching SSR-only's HeavyBlockBoundary
   first-render skeleton output) AND triggers hydration on
   first paint. PLAN-time projection: AC#5's T0 rect (initial
   skeleton) and T1 rect (post-settle) invariants flow through
   identically because the skeleton HTML emitted is the same
   byte-for-byte. **Mitigation**: TC17 verifies AC#5 test
   stays byte-unchanged + still passes. **Residual risk**: if
   `client:load` introduces extra wrapper DOM around the
   skeleton (e.g., an `astro-island` wrapper element), the
   `[data-block="(kind)"]` selector still matches because that
   attribute is on the inner skeleton container, not the
   wrapper — verified at session start by reading
   HeavyBlockBoundary.tsx line ~30 (skeleton renders with
   `data-block` attribute). Acceptable risk.

6. **ADR-0014 post-edit size approaching 500 LOC hard cap**:
   PLAN-time projection ~660-670 LOC after the v0.3 + D10 +
   AC#16 edits — that's OVER the 500 LOC hard cap.
   **Mitigation**: contingency per TC21 to split Amendments § +
   D10 + AC#16 into a companion `docs/decisions/ADR-0014-amendments.md`
   doc if size exceeds 500 LOC. PLAN-time PRE-CHECK: existing
   ADR-0014 at HEAD `4aeb279` is ~590 LOC (verified at session
   start via `wc -l`). With ~80 LOC delta the file lands at
   ~670 LOC — over the cap. **Decision: split contingency
   ENGAGED at EXECUTE time** — the executor authors a NEW
   `docs/decisions/ADR-0014-amendments.md` file owning the v0.3
   Amendments § entry + the new D10 + the new AC#16, and the
   existing ADR-0014 file gains a single-line "see Amendments
   doc" reference at the existing `## Amendments` section. This
   keeps the existing ADR-0014 file under 500 LOC + isolates
   the v0.3 prose. PLAN-time alternative was to NOT split and
   accept the size warning, but the 500 LOC cap is a hard rule
   per CLAUDE.md. **Files list update**: `docs/decisions/ADR-0014-amendments.md`
   becomes the 15th canonical file in `## files` (PR.md adds
   it at EXECUTE time per the contingency).

   **PLAN-time path-forward decision**: to avoid mid-PR
   filename drift, the PR.md `## files` section above describes
   the v0.3 + D10 + AC#16 as edits to ADR-0014 directly. If
   EXECUTE-time `wc -l` shows the post-edit file > 500 LOC, the
   executor splits per the contingency above (ADR-0014 file
   stays at original ~590 LOC; new amendments doc ships at
   ~80 LOC) and PR.md is amended in-place to reflect the split.
   TC13 + TC14 grep expressions accept either the in-file or
   companion-doc location via dual-grep (executor adapts the
   TC expression EXECUTE-time if the split engages).

7. **`components-map.test.ts` shape assertions on heavy keys**:
   the existing test (verified at session start: 11 vitest
   files in `apps/site/src/__tests__/`) asserts componentsMap
   structure. PLAN-time projection is the test only checks
   the 8 PascalCase keys exist + structural shape (not
   typeof React function); `.astro` imports satisfy the
   structure check. **Mitigation**: TC9 verifies the test
   passes; if it fails on a typeof assertion, B7 EXECUTE
   updates 1-2 LOC of the test to relax the typeof to a
   union (`'function' | 'object'`) per Astro's compiled
   `.astro` import shape. **Residual risk**: minor.

## executor

Per Wave 4 plan v0.2.1 Driver 2 + ADR-0011 D1 pipeline:

- **PLAN**: pr-writer Claude subagent (you, this dispatch).
  Output this PR.md at
  `docs/plans/wave-4-main/B7-heavy-block-hydration.md`.
  SendMessage orchestrator on completion; orchestrator iterates
  0-2 rounds before lock.

- **EXECUTE**: **mixed driver pattern** (matches Wave 4 plan
  v0.2.1 Driver 2 declaration):
  - **orchestrator-self** drafts the ADR-0014 v0.3 Amendment
    language + new D10 prose + new AC#16 prose (doc-policy work
    matches Pre-A2 doc-only ADR-0014 design-lock + A8 v0.2.1
    Amendment + B1a v0.1.1 Amendment precedent).
    orchestrator-self also handles the
    `apps/site/CONTRACT.md` clause + `docs/plans/active.md`
    bookkeeping (small targeted edits matching the Stage A
    + B1a precedent for Claude-driven prose work).
  - **`codex-generic-executor`** (canonical name post-B5 R3
    prefix; per ADR-0011 D6) handles the 3 islands + 3 Astro
    wrappers + components.ts componentsMap rewire + playwright
    spec extension + B5-orphan back-fill commit-log archive
    placement. Standard ADR-0011 D1 stage 5 reviewer-codex-commit
    applies.

  TDD-front order:
  - B7.A: orchestrator-self authors the playwright AC#16
    hydration assertion FIRST (RED on broken pre-B7 state)
  - B7.B: codex-generic-executor authors the 3 islands +
    3 Astro wrappers (10 source surfaces; ~120 LOC total)
    + componentsMap rewire
  - B7.C: codex-generic-executor runs `pnpm
    --filter=@skb/site test` + typecheck + lint to verify
    GREEN
  - B7.D: orchestrator-self authors the ADR-0014 v0.3 +
    new D10 + new AC#16 (with split-contingency check at
    `wc -l`)
  - B7.E: orchestrator-self authors the
    `apps/site/CONTRACT.md` clause
  - B7.F: orchestrator-self updates `docs/plans/active.md`
    bookkeeping (B5 backfill + B7 row + mandatory-scope row
    parenthetical)
  - B7.G: pre-commit `pnpm link-check` + `pnpm check`
    workspace-wide before reviewer codex commits

- **REVIEW (D1 stage 3)**: `codex-pr-reviewer-55` (`--yolo
  --profile codex-pr-reviewer-55`). ADR-0006 8-point checklist
  + ADR-0006 D8 explicit-file-list staging mandatory. Reviewer
  reads HeavyBlockBoundary.tsx at HEAD (not via PR.md excerpt)
  per memory `feedback_pr_reviewer_authority_at_head` for any
  AC#16-OR-pattern pushback.

- **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)**: **FORMALLY
  MANDATORY** per `## D2 trigger judgment` (Row 1 + Row 4 HIT).
  Orchestrator-self focus per `## acceptance` 22 above
  + (i) the 3 Astro wrappers all use `client:load` (NOT
  `client:only`); (ii) the 3 islands closure-capture `load`;
  (iii) ADR-0014 post-edit size under 500 LOC (split
  contingency engaged if needed); (iv) the AC#16 OR-pattern
  matches the ADR prose; (v) CONTRACT.md additive clause;
  (vi) commit list matches `## files` (no scope creep).

- **COMMIT (D1 stage 5)**: reviewer codex commits via Pre-A1
  4-step `git reset HEAD` → `git add (list)` → `git diff
  --cached --stat` verify → `git commit` (memory
  `feedback_git_operator_explicit_stage`). Lockfile MUST be
  byte-unchanged (TC23 pre-commit).

- **ACCEPT (D1 stage 6)**: pr-writer second invocation walks
  the 23 acceptance bullets against the actual diff; residue
  list returned to orchestrator for B6 PLAN seed.

- **POST-MERGE**: `gh pr merge --squash --delete-branch` per
  Wave 3 auto-merge authorization (memory
  `feedback_wave3_auto_merge`); B7 row `#TBD | TBD` backfilled
  at next PR (B6) per the one-row-per-PR cadence.

## Out of scope (deferred)

### Chunk-leak perf regression — deferred to Stage C user-iteration

**Surfaced at B7 R1 reviewer codex review** (2026-05-04): post-B7
`pnpm --filter @skb/site build` artifacts show
`apps/site/dist/_astro/client.*.js` + `apps/site/dist/_astro/design-tokens.*.js`
contain static `import` statements referencing
`./block-jupyter.*.js` and `./block-agent-flow.*.js` chunks. These
chunks transitively contain Pyodide / React Flow heavy dependencies.
Pre-B7 main (HEAD `794cd5d` baseline rebuild verified) does NOT have
this leak — the leak is introduced by B7's Astro `client:load`
island bundling.

**Root cause analysis** (preliminary): Astro's island infrastructure
emits the islands as separate bundle entries. Vite's chunk splitter
applies the existing Wave 3 C1-ratified `manualChunks` rules in
`apps/site/astro.config.mjs` that route `@skb/block-jupyter` /
`@skb/block-nn-viz` / `@skb/block-agent-flow` package files to
named chunks. The chunk splitter places React JSX runtime
fragments + shared utilities into the heavy block chunks because
they're the first reference site in the new island static-import
graph; client.js + design-tokens.js then statically import from
those chunks to access the placed dependencies.

**B7 mitigation attempted**: extracted `makeMdxAdapter` + `FlatProps`
from `apps/site/src/components.ts` to NEW
`apps/site/src/lib/mdx-adapter.ts` to break the
island → components.ts → 5-light-block-ui-defaults static-import
cycle (was suspected as a leak amplifier). Mitigation reduces the
island static-import surface but does NOT eliminate the structural
leak — the underlying root cause is Vite's interaction with
Astro's island bundling + the existing block-* manualChunks rules.

**Existing lazy-chunking.test.ts contract maintained**
(`apps/site/src/__tests__/lazy-chunking.test.ts:93-107`): the test
asserts JS files DIRECTLY referenced in route HTML (regex
`/_astro/[name].js`) do NOT contain pyodide / tensorflow / reactflow
markers. Prose-only routes' DIRECT JS asset hrefs (only
`client.*.js` + `design-tokens.*.js`) DO NOT contain those markers.
The markers live in transitively-importable `block-*.js` chunks.
Test PASSES post-B7 (verified at EXECUTE-time).

**B7 primary purpose closure**: the MVP-blocking visual disaster
(heavy blocks forever-loading skeleton because `useEffect` never
ran in browser) is FIXED. Heavy blocks now hydrate on
`client:load`, `useEffect` runs, `load()` invokes, real
`<KindRenderView>` replaces skeleton with `aria-busy='false'`.
AC#16 codifies this end-to-end discriminator.

**Stage C user-iteration deferral rationale**:
- The leak is a perf regression (extra ~400KB block-jupyter chunk
  transitively reachable via client.js static-import chain on
  prose-only routes), NOT a functional regression.
- The leak does NOT affect heavy block hydration correctness on
  routes that DO consume them (sample-blocks page; AC#5 zero-layout-
  shift + AC#16 hydration end-to-end both PASS).
- Wave 4 plan A8 D10 ('manualChunks data-driven') established the
  precedent that chunk optimization is **measure-before-add**:
  `codex-perf-auditor` baseline at B6 close-prep dispatch will
  produce empirical bundle-size + load-time data; if that data
  shows actionable regression delta vs the Wave 3 C1 baseline,
  Stage C first PR ('chunk optimization' user-iteration scope)
  addresses with refined `manualChunks` (e.g., split React JSX
  runtime to its own chunk; route block-* package files to
  per-symbol chunks) + extends `lazy-chunking.test.ts` to follow
  transitive static-import chains (depth-first chunk graph
  traversal) for stricter invariant enforcement.
- The reviewer codex R1 verdict highlighting this leak DOES NOT
  block B7's hydration fix per ADR-0011 D8 'forward-fix ratio
  ≤15% target' framework: B7 closes a CRITICAL functional gap;
  the perf side-effect is documented, deferred with rationale,
  and bounded by the existing lazy-chunking.test.ts contract.

**Stage C first PR scope hint** (NOT prescriptive; per gatekeeper
directive #4 + plan-challenger Q4 absorbtion Stage C remains
open-ended; this hint informs B6's `codex-perf-auditor` baseline
report):
- Refine `apps/site/astro.config.mjs` `manualChunks` to
  per-symbol routing for `@skb/block-{jupyter,nn-viz,agent-flow}`
  (split JSX runtime + shared utilities to vendor chunks; keep
  package-specific code in named chunks)
- Extend `apps/site/src/__tests__/lazy-chunking.test.ts` with
  transitive static-import chain traversal (parse JS for
  `import` statements + recursively follow chunks) to enforce
  the prose-only-route invariant strictly
- Update `apps/site/CONTRACT.md` `## Invariants` chunking
  strategy clause to specify direct vs transitive semantics

### Stage B remaining

Stage B remaining 1 PR deferred per Wave 4 plan v0.2.1 Driver 2
final paragraph (canonical roster + per-PR scope authoritative
in [`docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
`## Amendments § v0.2.1` table):

- **B6** (Stage B PR #8; Wave 4 close-ceremony preparation):
  Wave 4 close ADR (potential ADR-0015 IF needed; B6 EXECUTE
  decides) + active.md Wave 4 ✅ flip + Stage B retrospective
  + handoff prose for Stage C (open-ended Phase 1
  user-iteration scope).

**B7 explicitly does NOT touch** (also enforced by TC23-TC30
diff guards):

- `apps/site/src/components/SearchBox.astro` (B1b shipped at
  HEAD `5ec7123`) — TC25
- `apps/site/src/lib/word-level-match.ts` + `apps/site/src/__tests__/word-level-match.test.ts`
  (B1a shipped at HEAD `1aa2811`) — TC25
- `apps/site/src/__tests__/search-cjk.test.ts` +
  `apps/site/playwright/search.spec.ts` (B1b scope) — TC25
- `apps/site/astro.config.mjs` — Astro auto-discovers
  `apps/site/src/islands/*.tsx` via `@astrojs/react`
  integration; no chunking change needed
- `packages/heavy-block-boundary/**` (A1-A4-locked; B7 does
  NOT add `data-loaded='true'` attribute — AC#16 OR-pattern
  accepts `aria-busy='false'` evidence per `## Risk register`
  bullet 2) — TC26
- The 8 block packages (`packages/block-{callout,code,image,math,pdf,jupyter,nn-viz,agent-flow}/`)
  byte-unchanged from B2 / B3 / B4 / B5 — TC26
- `packages/heavy-block-boundary/CONTRACT.md` byte-unchanged
- `agent-contract.md` / `CLAUDE.md` / `AGENTS.md` /
  `docs/runbooks/codex-tool-invocations.md` (B5-locked) — TC25
- 13 ADR files except ADR-0014 — TC27
- Wave 4 plan v0.2.1 doc — no v0.2.2 Amendment needed (Driver 2
  already authorizes B7) — TC30
- Prior wave-4-main PR.md files (Pre-A1, Pre-A2, Pre-A3, A1-A8,
  B1a, B1b, B2, B3, B4, B5) — TC29

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging: reviewer codex
commits 14 canonical + 1 B5-orphan-leftover commit-log + 1-2
B7 reviewer audit archives = 15-16 files (split-contingency
EXECUTE-time may add 1 amendments doc → 16-17 files):

```
git reset HEAD
git add apps/site/src/islands/JupyterIsland.tsx \
  apps/site/src/islands/NnVizIsland.tsx \
  apps/site/src/islands/AgentFlowIsland.tsx \
  apps/site/src/components/Jupyter.astro \
  apps/site/src/components/NnViz.astro \
  apps/site/src/components/AgentFlow.astro \
  apps/site/src/components.ts \
  apps/site/CONTRACT.md \
  apps/site/playwright/heavy-block-layout-shift.spec.ts \
  docs/decisions/ADR-0014-heavy-block-boundary.md \
  docs/plans/active.md \
  docs/plans/wave-4-main/B7-heavy-block-hydration.md \
  docs/audits/codex-runs/2026-05-04-B5-commit.txt \
  docs/audits/codex-runs/2026-05-04-B7-pr-reviewer-55.txt
git diff --cached --stat
git commit -m "..."
```

(IF split-contingency engaged: also `git add
docs/decisions/ADR-0014-amendments.md`.)

(IF reviewer R2: also `git add
docs/audits/codex-runs/2026-05-04-B7-pr-reviewer-55-r2.txt`.)

Lockfile + package.json byte-unchanged (TC23 + TC24 verify
pre-commit).

## Related

- [ADR-0011 D1 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — pipeline framework + D2 trigger row mapping
- [ADR-0014 HeavyBlockBoundary wrapper](../../decisions/ADR-0014-heavy-block-boundary.md) — amendment target (this PR ships v0.3)
- [ADR-0012 search index stack](../../decisions/ADR-0012-search-index-stack.md) — B1a v0.1.1 substantive-Amendment Row 4 precedent
- [ADR-0013 Wave 3 close](../../decisions/ADR-0013-wave-3-close.md) — Wave 3 retrospective
- [Wave 4 plan v0.2.1](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — Driver 2 authorizes B7 NEW
- [docs/plans/active.md](../active.md) — Wave 4 PR roster + Stage B 8-PR re-locked sequence + mandatory-scope status
- [Pre-A2 PR.md](Pre-A2-adr-0014-heavy-block-boundary.md) — doc-only ADR-0014 design-lock precedent (orchestrator-self EXECUTE)
- [A6 PR.md](A6-heavy-block-playwright-layout-shift.md) — AC#5 zero-layout-shift baseline (PR #36 squash HEAD `95ba33b`)
- [A5 PR.md](A5-apps-site-heavy-block-dims-migration.md) — D5 dimensions ownership + apps/site migration (PR #35 squash HEAD `59a93c0`)
- [A8 PR.md](A8-perf-chunking-adr-0014-promote.md) — Stage A close + ADR-0014 v0.2.1 status flip (PR #38 squash HEAD `4aeb279`)
- [B1a PR.md](B1a-adr-0012-amendment.md) — substantive Amendment Row 4 precedent (PR #39 squash HEAD `1aa2811`)
- [B5 PR.md](B5-codex-prefix-lychee-memory.md) — codex- profile prefix canonical (PR #44 squash HEAD `794cd5d`)
- memory `feedback_wsl2_chromium_launch.md` — playwright chromium WSL2 skip pattern preserved at AC#16
- memory `feedback_lychee_line_anchor.md` + `feedback_lychee_user_local_paths.md` + `feedback_lychee_npmjs_403.md` + `feedback_lychee_autolink_in_backticks.md` — lychee discipline applied to v0.3 Amendments § cross-references + CONTRACT.md clause + active.md updates
- memory `feedback_cross_package_consumer_pattern.md` — duplication catches silent regressions on dimension VALUES (AC#5 baseline test still hard-codes EXPECTED_DIMS per A6 precedent)
- memory `feedback_pr_reviewer_authority_at_head.md` — reviewer reads authority types at HEAD before overruling codex (AC#16 OR-pattern review)
- memory `feedback_git_operator_explicit_stage.md` — ADR-0006 D8 explicit-file-list staging discipline (4-step commit protocol + lockfile scope check)
- memory `feedback_soted_pr_md_discipline.md` — SOTed-PR.md authoring discipline (single-source-of-truth + cross-section reference + TDD-front + memory-cited)
