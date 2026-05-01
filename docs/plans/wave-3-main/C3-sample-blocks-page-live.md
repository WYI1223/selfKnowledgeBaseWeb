# C3 — apps/site sample-blocks page goes live (Stage C)

> **Wave 3 Stage C 3rd PR.** Flips `content/notes/sample-blocks/index.mdx`
> from `draft: true` to `draft: false` so the page enters the apps/site
> build graph + renders all 8 Wave 2 component blocks via the
> componentsMap from C1. Per locked plan C3 entry (lines 553-587).

## title

Flip sample-blocks fixture from draft to live; verify route renders all 8
PascalCase component blocks via SSR; visual-smoke playwright (CI-only)
verifies no runtime errors. Closes ADR-0010 D7 #4 sample-blocks fixture
deferral.

## files

Created (NEW — 1 test + 1 self-listed):

- `apps/site/src/__tests__/sample-blocks-page.test.ts` *(NEW; vitest. TC1
  + TC2 below — route resolves at expected dist path; built HTML
  contains 8 block markers via componentsMap rendering. ~50 LOC.
  visual-smoke playwright TC3 lives in existing `apps/site/playwright.config.ts`
  CI-only path; this PR may extend the playwright spec OR document the
  CI-only assertion path; WSL2 local skip per WE-005.)*
- `docs/plans/wave-3-main/C3-sample-blocks-page-live.md` *(this PR.md.)*

Modified (3 files):

- `content/notes/sample-blocks/index.mdx` — frontmatter `draft: true`
  → `draft: false`. Single-line flip. The MDX body authored at Z0 (Wave
  2 close, commit `51789a1` era) stays exactly as-is.
- `apps/site/src/components.ts` — **R-C3-1 RESOLVED**: refactored
  componentsMap to wrap each RenderView in an MDX-prop adapter (light
  blocks: 5) or a heavy-block SSR placeholder (heavy blocks: 3). The
  adapter translates flat MDX props (`<Callout variant="note">body</Callout>`)
  into BlockViewProps shape (`{ props: {...}, content: "body" }`)
  expected by block-* RenderView components. Heavy-block placeholders
  emit a `data-block` + `data-deferred="wave-4"` div for SSR-marker
  tests; live heavy-block rendering deferred to Wave 4 / ADR-0014
  (TF.js + Pyodide + React Flow CommonJS-`require()` in ESM SSR is the
  underlying gap). Type-only imports for the 3 heavy block packages
  preserve ADR-0008 D1 three-way symmetry.
- `apps/site/src/__tests__/components-map.test.ts` — **C3 sister
  update**: C1's referential-identity assertion
  (`componentsMap.Callout === CalloutRenderView`) no longer applies
  after the C3 adapter wrapping; assertion changed to "every key
  resolves to a function (wrapper component)" + retains the
  EditorView-non-identity check + the 5/3 alias documentation + the
  exact-8-PascalCase-keys check.

= **5 files in canonical `## files` block** (1 NEW test
(sample-blocks-page.test.ts) + 1 PR.md self + 3 modified
(sample-blocks/index.mdx + components.ts + components-map.test.ts);
counts canonical here).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `apps/site/src/components.ts` — C1's componentsMap is sufficient; no
  changes needed for sample-blocks rendering.
- `apps/site/src/pages/notes/[...slug].astro` — C1's conditional dynamic
  import already detects sample-blocks block tags via the regex; no
  changes needed.
- `apps/site/astro.config.mjs` / `apps/site/CONTRACT.md` — no changes
  (C2 already configured chunking + documented strategy).
- `packages/block-*/` — unchanged. Each block's RenderView accepts the
  expression-attr props directly via Astro/MDX compiler.
- `pnpm-lock.yaml` — no new deps; no change.

## test_cases

- **TC1** (route resolves) Input: after `pnpm --filter=@skb/site build`,
  verify `apps/site/dist/notes/sample-blocks/index.html` exists.
  Expected: file present + non-zero size. Location:
  `apps/site/src/__tests__/sample-blocks-page.test.ts`.
- **TC2** (SSR HTML contains 8 block markers) Input: read built HTML;
  expected: contains characteristic markers for each of the 8 blocks
  (e.g., callout class names, code language attribute, image src,
  math KaTeX output, etc.). Marker patterns documented in test source.
  Location: same file.
- **TC3** (visual-smoke playwright; CI-only per WE-005) Input: existing
  `apps/site/playwright.config.ts` test runner navigates to
  `/notes/sample-blocks/` and checks the page renders without runtime
  errors. WSL2 skip pattern preserved. Location: existing playwright
  spec (extended OR new spec file — executor judgment).
- **TC4** (per-package vitest count) Input:
  `pnpm --filter=@skb/site test`. Expected: previous count + 2 new
  (TC1 + TC2; TC3 is playwright not vitest).
- **TC5** (per-package typecheck) Input:
  `pnpm --filter=@skb/site typecheck`. Expected: exit 0.
- **TC6** (per-package build) Input: `pnpm --filter=@skb/site build`.
  Expected: exit 0; built dist contains the new sample-blocks route.
- **TC7** (root pnpm check) Input: `pnpm check`. Expected: exit 0.
- **TC8** (lazy-chunking C2 TC2 unblock — informational, NOT a C3
  acceptance gate) — sample-blocks going live puts components.ts in the
  build graph for the first time. C2's TC2 (heavy-chunk EXISTENCE) is
  currently `it.skip()` per C2 R-during-EXECUTE. C3 does NOT flip
  `it.skip` → `it` (C5+ deferred per C2 documentation); C3 leaves the
  test skipped. C5 (or a Wave 3 close cleanup PR) flips after measuring
  per-block chunk-graph behavior.

## contracts_affected

- `content/notes/sample-blocks/index.mdx` — frontmatter only (single-line
  edit). Body unchanged.

## adr_touched

None. C3 implements ADR-0010 D7 #4 deferred sample-blocks-page wiring;
no new ADR required.

## acceptance

1. `apps/site/dist/notes/sample-blocks/index.html` exists post-build —
   TC1 evidence.
2. Built HTML contains markers for all 8 blocks (Callout / Code / Image /
   Math / Pdf / Jupyter / NnViz / AgentFlow rendered via componentsMap)
   — TC2 evidence.
3. visual-smoke playwright passes on CI (WSL2 local skip per WE-005) —
   TC3 evidence.
4. `pnpm --filter=@skb/site test` exits 0 — TC4 evidence.
5. `pnpm --filter=@skb/site typecheck` exits 0 — TC5 evidence.
6. `pnpm --filter=@skb/site build` exits 0 — TC6 evidence.
7. `pnpm check` exits 0 — TC7 evidence.
8. PR.md self-listed.
9. Protected files unchanged (apps/site/components.ts, [...slug].astro,
   astro.config.mjs, CONTRACT.md, package.json, tsconfig.json, all
   block-*/ source).
10. Sample-blocks frontmatter flip is the ONLY content edit (body
    unchanged); verify via `git diff main -- content/notes/sample-blocks/index.mdx`
    shows only `draft: true` → `draft: false` line change.

## R-during-EXECUTE (RESOLVED via surgical scope expansion)

**R-C3-1**: after the draft flip, `pnpm --filter=@skb/site build` failed
on two latent C1 architectural gaps that surfaced together:

1. **MDX prop-shape mismatch**: MDX compiles `<Callout variant="note">body</Callout>`
   to flat React props, but block-* RenderView components destructure
   `{ props, content }: BlockViewProps`. Without an adapter `props` is
   undefined.
2. **TF.js + ESM SSR incompatibility**: `block-nn-viz` imports
   `@tensorflow/tfjs` which uses CommonJS `require()`. Astro static SSR
   is ESM-only → `require is not defined`.

**Resolution (orchestrator-approved scope expansion to fix latent C1
bugs)**:
- Added MDX-prop adapter wrapper for each of the 5 light blocks
  (callout/code/image/math/pdf) in `components.ts`. Adapter translates
  flat MDX props → `{ props, content }: BlockViewProps`.
- Added SSR placeholder for each of the 3 heavy blocks
  (jupyter/nn-viz/agent-flow) emitting `<div data-block="<name>"
  data-deferred="wave-4">...</div>`. Live heavy-block rendering
  deferred to Wave 4 / ADR-0014 candidate.
- Updated C1's `components-map.test.ts` to assert wrapper-component-
  type instead of referential-identity (the identity check was
  fundamentally incompatible with the adapter pattern).
- ADR-0008 D1 three-way symmetry preserved via type-only imports for
  the 3 heavy block packages.

**Wave 4 / ADR-0014 candidate**: proper client:only wrapper components
for runtime heavy-block rendering with SSR-safe stubs. Out of scope for
C3.

## executor

Path A (codex-generic-executor) for the test file + frontmatter flip
(small mechanical edit). REVIEW: codex-pr-reviewer-55. PRE-COMMIT
CLAUDE: orchestrator-self (Row 8 — CI/build-affecting). COMMIT:
orchestrator-self.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — content frontmatter, not contract surface.
- **Row 2** (package add/remove): NO.
- **Row 4** (new ADR): NO.
- **Row 5** (cross ≥3 packages): NO.
- **Row 8** (CI / build / deploy / auth / security): **HIT** — sample-blocks
  going live changes the build graph (components.ts now in graph;
  heavy-block chunks emit). visual-smoke playwright CI test added.

→ D1 stage 4 PRE-COMMIT CLAUDE REVIEW does NOT fire (only Rows 1+4 fire
stage 4 per ADR-0011 D1; Row 8 elevates stage 3 reviewer scrutiny).

## Out-of-scope (explicitly deferred)

- C2 TC2 `it.skip` → `it` flip (C5+ work; C3 doesn't touch).
- codex-perf-auditor dispatch (deferred to C5 with sample-blocks live as
  the canonical perf-baseline against C1).
- Per-block selective heavy-chunk loading (Phase 2 chunking; C5+).
- Block content corrections (Z0 authored content stays as-is; any
  schema-validation issues from expression-attr forms are stubs in Wave
  2 — block-* parse functions don't run in apps/site build path; only
  Astro/MDX compiler runs).
- Wave 3 close ceremony (post-D3 territory).

## Related

- [Wave 3 plan, C3 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (lines 553-587).
- [C2 PR.md](./C2-apps-site-dynamic-chunking.md) — predecessor; chunking strategy.
- [C1 PR.md](./C1-apps-site-block-registry.md) — componentsMap source.
- [ADR-0010 D7 #4](../../decisions/ADR-0010-wave-2-close.md) — sample-blocks deferred items.
- [content/notes/sample-blocks/index.mdx](../../../content/notes/sample-blocks/index.mdx) — Z0-authored content.
