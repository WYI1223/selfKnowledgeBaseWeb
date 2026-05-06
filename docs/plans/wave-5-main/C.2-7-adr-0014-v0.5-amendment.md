# C.2-7 — ADR-0014 v0.5 amendment + HeavyBlockBoundary consume W5-1 公式 from `@skb/block-foundation`

> **Wave 5 Stage C.2 8th implementation PR** of the locked 13-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.3 row C.2-7). Lands the
> **ADR-0014 v0.5 substantive Amendment** that widens
> HeavyBlockBoundaryProps (P-generic) with an optional `gridContext` field
> (W5-1 公式-derived dims path) plus the `HeavyBlockBoundary` impl
> consuming `effectiveColWidth` + `effectiveCellHeight` from
> `@skb/block-foundation/grid-math` as the single authority + the
> sister-doc `packages/heavy-block-boundary/CONTRACT.md` sync per
> ADR-0016 §502 + the canonical Playwright spec
> `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts` covering
> the user-visible heavy block plugin placeholder dimension
> consistency on `/sample-blocks`. C.2-1 (mdx-bridge serialize, squash
> `e54497d`) + C.2-2 (block-foundation grid primitives, squash
> `b15ba24`) + C.2-3 (Astro renderer grid + Responsive 12/6/1, squash
> `2586328`) + C.2-3.5 (mdx-bridge hard-throw flip, squash `b019a31`) +
> C.2-4 (editor-shell grid container + `useAutoRowSpan`, squash
> `de13d15`) + C.2-5 (drag/drop UX 3 modules, squash `2df71b6`) + C.2-6
> (resize UX col-ruler + size-tooltip + `effectiveColSnaps`, squash
> assumed merged before C.2-7 PLAN dispatch) all merged. C.2-7 wires
> the **`@skb/heavy-block-boundary` runtime consumer** of the W5-1
> `effectiveColWidth` + `effectiveCellHeight` block-foundation
> authority + the **ADR-0014 v0.5 Amendments § entry** codifying the
> gridContext-derived dims path (substantive Amendment per v0.2.1 +
> v0.3 + v0.4 precedent; status remains `accepted`, NOT a status flip).
> Existing `dims` consumers in `apps/site` (.astro pages) keep passing
> explicit `dims` per v0.4 path — explicit `dims` is forward-compatible
> + wins precedence when both supplied. **PRE-COMMIT CLAUDE REVIEW (D1
> stage 4) FIRES** per `## D2 trigger judgment` (Row 4 NEW ADR
> amendment + Row 1 CONTRACT.md change in `@skb/heavy-block-boundary` +
> Row 5 cross-package boundary contract change since the boundary now
> consumes block-foundation `grid-math` exports as a runtime
> dependency).

## title

Land **ADR-0014 v0.5 Amendments § entry** (substantive Amendment;
status remains `accepted`) widening HeavyBlockBoundaryProps (P-generic) with
an optional `gridContext` field that lets the boundary derive `dims`
internally from W5-1 公式 (`effectiveColWidth` + `effectiveCellHeight`
from `@skb/block-foundation/grid-math`). Add the consumer impl in
`packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` with the
locked precedence: explicit `dims` wins → fall back to gridContext
derivation → throw at call time when neither is supplied (fail-loud
mis-wiring surface, NOT silent render with NaN). Sister-doc-sync
`packages/heavy-block-boundary/CONTRACT.md` per ADR-0016 §502 (Public
Surface lists `gridContext`; Invariants codify the precedence + the
W5-1 single-authority delegation cross-reference). Land canonical
Playwright spec at `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts`
covering the user-visible heavy block plugin placeholder dimension
consistency on `/sample-blocks` per ADR-0011 D9 Product Experience
Quality Gate + v1.3 retrofit catalog (lines 553-560 verbatim).

Specifically:

1. NEW ADR-0014 v0.5 Amendments § entry (~50-80 LOC append at the
   tail of `## Amendments` section, parallel to v0.2.1 + v0.3 + v0.4
   precedent at lines 558+ / 593+ / etc.). Substantive Amendment
   widens D1 component API with optional `gridContext` field +
   defines D11 dims-derivation precedence (explicit `dims` wins →
   gridContext-derived fallback → throw on neither) + cites W5-1
   single-authority delegation (`effectiveColWidth` +
   `effectiveCellHeight` from `@skb/block-foundation/grid-math`).
   Status remains `accepted` (NOT flipped); date `2026-05-05`;
   Wave-tag `Wave 5 Stage C.2`. Optional new AC#17 if applicable
   (boundary derivation matches W5-1 公式 byte-equal to direct
   block-foundation invocation).

2. MODIFIED `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
   (~40-70 LOC delta on top of current 128 LOC; final ~170-200 LOC,
   well under 500 LOC cap). Add `gridContext` to
   HeavyBlockBoundaryProps (P-generic) interface; add internal derivation
   path in the component body that:

   - At call time (function entry, BEFORE `useState` calls): if both
     `dims` and `gridContext` are `undefined`, throw
     `Error('HeavyBlockBoundary requires either dims or gridContext')`.
     Throwing at call time (NOT in `useEffect`) surfaces mis-wiring
     immediately + fails the React render fast, NOT after async load.
   - If `dims` is supplied (regardless of `gridContext`), use
     `dims` directly (explicit wins; backward-compatible with v0.4
     consumers).
   - If only `gridContext` is supplied, derive
     `width = effectiveColWidth(gridContext.colSpan, gridContext.containerWidth, gridContext.geometry)`
     and `height = effectiveCellHeight(gridContext.rowSpan, gridContext.geometry)`,
     then construct an internal `HeavyBlockDimensions { width, height }`
     used in the `skeletonStyle` inline-style emission.

   Import `effectiveColWidth` + `effectiveCellHeight` from
   `@skb/block-foundation/grid-math` (single-authority per ADR-0016
   D6 + memory `feedback_cross_package_consumer_pattern`). NO local
   re-implementation of the W5-1 formulae.

   File-head JSDoc cites ADR-0014 v0.5 (gridContext path) + ADR-0016
   D9 (W5-1 公式 single-authority delegation).

   **GridContext shape**: a readonly object with members `colSpan: number`,
   `rowSpan: number`, `containerWidth: number`, and optional `geometry`
   accepting any subset of GridGeometry fields. Live TypeScript source
   below uses the standard generic form (rendered inside fenced code
   blocks where lychee skips autolink scanning per memory
   `feedback_lychee_autolink_in_backticks`). Inline backtick usage
   in this prose deliberately avoids the angle-bracket pattern. The
   `containerWidth` field name matches the actual
   `effectiveColWidth(colSpan, containerWidth, geometry?)` signature
   at `packages/block-foundation/src/grid-math.ts` lines 57-67 (per
   memory `feedback_pr_reviewer_authority_at_head` — read live source
   at HEAD, not the briefing-prose paraphrase). The optional
   `geometry` defaults to `DEFAULT_GRID_GEOMETRY` per the
   block-foundation helper's own default fallback (single-authority).

3. MODIFIED `packages/heavy-block-boundary/CONTRACT.md` (~15-25 LOC
   delta on top of current 63 LOC; final ~80 LOC). Two surgical
   edits:

   - **Public Surface section (lines 21-32)**: append a `gridContext?`
     bullet to the HeavyBlockBoundaryProps (P-generic) enumeration
     (positioned after `onLoadError?` per ADR-0014 v0.5 Amendments §;
     group at the end as v0.5 NEW field). Bullet describes shape in
     prose form (`colSpan` + `rowSpan` + `containerWidth` numeric
     members + optional partial geometry per the GridGeometry interface)
     to avoid inline-autolink lychee risk per memory
     `feedback_lychee_autolink_in_backticks`.
   - **Invariants section (lines 34-43)**: append a NEW invariant
     `**Dims-derivation precedence (v0.5; AC#17)**: explicit `dims`
     prop wins over `gridContext`-derived dims when both are
     supplied; with only `gridContext`, the boundary derives
     `width = effectiveColWidth(colSpan, containerWidth, geometry?)`
     and `height = effectiveCellHeight(rowSpan, geometry?)` from the
     `@skb/block-foundation/grid-math` single authority (per ADR-0016
     D6 + D9 W5-1 公式); with neither supplied, the boundary throws
     `Error('HeavyBlockBoundary requires either dims or gridContext')`
     at call time (fail-loud mis-wiring surface, NOT silent render
     with NaN dimensions).` Cross-reference inline to
     `packages/block-foundation/src/grid-math.ts` (the W5-1 authority
     site).

   Authority Links section gets ONE additional bullet appended:
   `[ADR-0016 D6 + D9](../../docs/decisions/ADR-0016-grid-data-model.md)
   — `effectiveColWidth` + `effectiveCellHeight` W5-1 公式 single
   authority that the v0.5 gridContext path delegates to.`

   NO change to the existing v0.4 prose for `dims` /
   `HeavyBlockDimensions` shape (backward-compatible widening).

4. NEW `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts`
   (~80 LOC). Playwright spec covering the canonical e2e_smoke flow
   per v1.3 retrofit catalog (lines 553-560 verbatim). Spec body:

   - `test.describe('plugin placeholder consumes grid effectiveColWidth/effectiveCellHeight', ...)`.
   - WSL2 chromium launch skip per memory
     `feedback_wsl2_chromium_launch` — `test.skip(process.platform
     === 'linux' && /Microsoft/i.test(process.release.osRelease ?? ''))`
     guard at suite head; CI executes (Linux non-WSL).
   - `test('plugin placeholder consumes grid effectiveColWidth/effectiveCellHeight', async ({ page }) => { ... })`
     Body:
     1. `await page.goto('/sample-blocks')`.
     2. Wait for grid container `.skb-grid` to be visible.
     3. Locate the heavy block plugin placeholder (one of jupyter /
        nn-viz / agent-flow surfaces from C.1-1 squash; selector via
        `[data-block="jupyter"]` or `[data-deferred="wave-4"]`).
     4. Locate an adjacent light block (e.g., callout / image) for
        dimension parity comparison.
     5. Read `boundingBox()` of both. Assert: heavy block `width`
        is finite (NOT NaN), heavy block `height >= 0`, heavy block
        `width` matches the same colSpan-equivalent light block
        within ±2px tolerance (rounding allowance per CSS subpixel
        rendering).
     6. Assert: no grid overflow — heavy block `boundingBox.x +
        width <= grid container `boundingBox.x + width` + 1px.
     7. Take screenshot to
        `docs/audits/screenshots/wave-5-c2-7-heavy-grid-dims.png` per
        ADR-0011 D9.5 archive flow + canonical screenshot_archive
        catalog field. File MUST be ≥ 5KB at ACCEPT (placeholder
        guard per `scripts/check-screenshot-archive.ts`).

   Spec is keyed on the canonical `it`/`test` description string
   `"plugin placeholder consumes grid effectiveColWidth/effectiveCellHeight"`
   (verbatim per v1.3 catalog line 559) so
   `scripts/check-e2e-coverage.ts` resolves it via the
   `playwright_spec` field's `:"…"` suffix.

5. PR.md self-listed per ADR-0006 D8 strict-whitelist.

NEW Playwright spec runs under `pnpm --filter @skb/site test:visual`
(or equivalent Playwright-running command per `apps/site/package.json`
script). Vitest unit tests for the dims-derivation precedence + throw
paths are added in-line to the existing
`packages/heavy-block-boundary/src/__tests__/` suite (NOT in the
whitelist below as separate file — see `## test_cases` for the
structural decision; suite file may already exist from A2 + A3 + A4
era and is amended in-place via grep-and-add pattern by the codex
executor).

The 8 `@skb/block-*` packages are NOT touched (heavy-block boundary is
a runtime consumer of block-foundation, not a sibling). `@skb/mdx-bridge`
is NOT touched. `@skb/editor-shell` is NOT touched. `@skb/design-tokens`
is NOT touched. `apps/site/src/{islands,components}/` is NOT touched
(C.1-1 plugin placeholder squash already shipped; existing `dims`-pass
consumers stay v0.4 path). NO change to grid-math (`effectiveColWidth`
+ `effectiveCellHeight` already shipped at C.2-2 squash `b15ba24`).
NO new BlockKind additions. NO retry-flow / lifecycle / a11y changes;
v0.5 ONLY widens the dims authoring surface to allow grid-derived path.

LOCKED implementation path: **ADR-0014 v0.5 Amendments § append**
(substantive Amendment; status remains `accepted`); **dims-derivation
precedence: explicit `dims` wins → gridContext-derived → throw on
neither**; **block-foundation `grid-math` single-authority delegation**
(NO local re-impl of W5-1 公式). Path "migrate existing apps/site
.astro consumers from explicit `dims` to `gridContext` now" is
**EXPLICITLY FORBIDDEN** in this PR (reason in Risk register row 1;
LOC budget would balloon ≥ 500 LOC + cross-package consumer-side
churn; explicit `dims` is forward-compatible per the precedence rule;
migration is a separate follow-up if and when needed).

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

**Touchable whitelist: 8 codex-executor files** at PLAN time
(extended from 5 → 8 by orchestrator scope refinement at exec time
2026-05-05). At commit time the staging block adds **4 more entries**
(PR.md self + 3-4 audit logs from codex R1+R2+R3 + reviewer R1+R2
rounds) for a **12-entry stage-5 commit** total — see `## Codex commit
(D1 stage 5) staging` block for the exhaustive 12-entry list. The 3
added impl-side metadata entries are mechanical foundation required
to enable the locked behavior (boundary package depends on
block-foundation runtime + tsc project reference + lockfile sync); per
ADR-0011 + ADR-0015 R14 thresholds, mechanical metadata to support
already-locked behavior is **scope refinement** (NOT reframe → no v1.4
plan amendment required). NO change to the 8 `@skb/block-*`
packages. NO change to `@skb/mdx-bridge` / `@skb/editor-shell` /
`@skb/design-tokens`. NO change to `apps/site/src/{islands,components,pages}/`.

> **Scope-refinement evidence (orchestrator-recorded 2026-05-05)**:
> codex-generic-executor first dispatch correctly stopped at Step 3a
> imports check per R14 discipline (memory
> `feedback_r14_defer_chain_plan_amendment`). It verified
> `@skb/heavy-block-boundary` did NOT declare `@skb/block-foundation`
> as dependency (Wave 4 Stage A1 shipped boundary with only
> `@skb/design-tokens` dep; `@skb/block-foundation` was not added at
> the time because v0.4 boundary did not consume W5-1 公式). Pr-writer
> PLAN-time check ("verify at exec time") flagged the assumption;
> codex confirmed FALSE; orchestrator extends whitelist by 3 metadata
> entries (package.json + tsconfig.json + pnpm-lock.yaml). Pr-writer
> ACCEPT (D1 stage 6) re-verifies the extended whitelist.

Codex-executor touchable whitelist (8 paths; codex R1+R2+R3 confine
edits strictly to these — per ADR-0006 D8 explicit-file-list
discipline + memory `feedback_git_operator_explicit_stage`). Stage-5
commit includes these 8 plus PR.md self + audit logs (3-4) for a
12-entry total — see `## Codex commit (D1 stage 5) staging` block:

1. `docs/decisions/ADR-0014-heavy-block-boundary.md` (MODIFIED — append
   v0.5 Amendments § entry; status remains `accepted`; substantive
   Amendment per v0.2.1 + v0.3 + v0.4 precedent)
2. `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` (MODIFIED
   — add `gridContext` field to HeavyBlockBoundaryProps (P-generic); import
   `effectiveColWidth` + `effectiveCellHeight` from `@skb/block-foundation`;
   add precedence-resolved internal dims derivation; throw at call
   time when neither `dims` nor `gridContext` supplied)
3. `packages/heavy-block-boundary/CONTRACT.md` (MODIFIED — append
   `gridContext` to Public Surface; append dims-derivation precedence
   Invariant; append ADR-0016 D6 + D9 cross-reference to Authority
   Links)
4. `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts` (NEW —
   Playwright spec covering canonical e2e_smoke flow per v1.3 catalog)
5. `docs/plans/wave-5-main/C.2-7-adr-0014-v0.5-amendment.md` (MODIFIED;
   this PR.md — scope-refinement note + 8-file whitelist)
6. `packages/heavy-block-boundary/package.json` (MODIFIED — add
   `@skb/block-foundation: workspace:*` to `dependencies`; preserves
   existing `@skb/design-tokens` dep + peerDependencies + devDependencies
   unchanged)
7. `packages/heavy-block-boundary/tsconfig.json` (MODIFIED — add
   `{ "path": "../block-foundation" }` to `references` array; preserves
   existing `../design-tokens` reference + compilerOptions + include unchanged)
8. `pnpm-lock.yaml` (MODIFIED — single `@skb/block-foundation: link:../block-foundation`
   entry added under `packages/heavy-block-boundary` importer block;
   no other lockfile churn — verified via `git diff --stat pnpm-lock.yaml`
   2026-05-05 post `pnpm install --filter @skb/heavy-block-boundary`)

**LOC budget**: ADR (~50-80) + impl (~40-70 delta) + CONTRACT (~15-25
delta) + Playwright spec (~80) + PR.md self (~600-800) ≈ ~785-1055
total; under typical Wave 5 PR ceiling. No source file approaches
500-LOC cap (HeavyBlockBoundary.tsx final ~170-200 LOC; CONTRACT.md
final ~80 LOC; Playwright spec ~80 LOC; ADR delta appended to
existing ~700-line file but no individual section exceeds 200 LOC).

**Vitest unit tests for the new dims-derivation precedence + throw
paths**: added in-place to the existing
`packages/heavy-block-boundary/src/__tests__/` suite via grep-and-add
pattern at exec time (codex executor decides whether to amend the
existing file or create a new sibling test file under
`__tests__/v0.5/`). Either decision is in-scope of the file 2 entry
(HeavyBlockBoundary.tsx is the sole impl; tests co-locate with impl
package). Whitelist NOT extended — `__tests__/` paths are
self-contained inside the `@skb/heavy-block-boundary` package and
inherit ADR-0006 D8 implicit allowance per package-internal test
file convention. **Open question for orchestrator**: prefer in-place
amendment of existing test file OR new sibling under `__tests__/v0.5/`?
See `## Plan-challenger absorbtion` Open Question #4.

## test_cases

TDD-front authoritative list. Each test case names a vitest `it(...)`
description (input fixture + expected assertion + file location) OR a
Playwright `test(...)` description. The TDD-front discipline per
ADR-0011 D1 stage 2 + memory `feedback_codex_spark_lint_gap` requires
the codex-generic-executor to **land all test files first** (red),
then implementation files (green), verifying via `pnpm --filter
@skb/heavy-block-boundary test` + `pnpm --filter @skb/site test:visual`
(or equivalent Playwright runner; WSL2 skip path applies).

### Suite 1: `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.v0.5.test.tsx` (vitest unit tests for v0.5 precedence + throw paths)

6 test cases per ADR-0014 v0.5 Amendments § (gridContext-derived dims
+ precedence + throw + geometry override; TC1.4 added at codex R3 per
reviewer R1 issue 4):

1. **TC1.1 — explicit `dims` wins over `gridContext` derivation when
   both supplied**. Input: `<HeavyBlockBoundary kind="jupyter"
   dims={{ width: 800, height: 400 }} gridContext={{ colSpan: 12,
   rowSpan: 4, containerWidth: 1200 }} load={mockLoad}
   childProps={{}} />`. Expected: rendered DOM `style.width === '800px'`
   and `style.minHeight === '400px'` (explicit `dims` values used,
   NOT gridContext-derived). Location:
   `HeavyBlockBoundary.v0.5.test.tsx > precedence > explicit dims wins`.

2. **TC1.2 — gridContext-derived dims used when only `gridContext`
   supplied**. Input: `<HeavyBlockBoundary kind="jupyter"
   gridContext={{ colSpan: 12, rowSpan: 4, containerWidth: 1200 }}
   load={mockLoad} childProps={{}} />`. Expected: rendered DOM
   `style.width` matches `effectiveColWidth(12, 1200) === 1200`px
   (full 12-col span at 1200px container; per W5-1 公式 line 57-67)
   and `style.minHeight` matches `effectiveCellHeight(4) === 4*48 +
   3*14 === 234`px (per W5-1 公式 line 45-51 with
   `DEFAULT_GRID_GEOMETRY.rowH === 48`, `gap === 14`). Location:
   `HeavyBlockBoundary.v0.5.test.tsx > precedence > gridContext derives dims`.

3. **TC1.3 — throw at call time when neither `dims` nor
   `gridContext` supplied**. Input: `() => render(<HeavyBlockBoundary
   kind="jupyter" load={mockLoad} childProps={{}} />)`. Expected:
   throws `Error('HeavyBlockBoundary requires either dims or
   gridContext')` synchronously during render (NOT after async load
   resolves). Location:
   `HeavyBlockBoundary.v0.5.test.tsx > precedence > throws on neither`.

4. **TC1.4 — gridContext `geometry` override propagates to W5-1
   derivation**. Input: `<HeavyBlockBoundary kind="jupyter"
   gridContext={{ colSpan: 6, rowSpan: 2, containerWidth: 600,
   geometry: { rowH: 60 } }} load={mockLoad} childProps={{}} />`.
   Expected: `style.minHeight === effectiveCellHeight(2, { rowH: 60 })
   === 2*60 + 1*14 === 134`px (custom rowH propagates per
   Partial GridGeometry merge in `resolveGeometry`). Location:
   `HeavyBlockBoundary.v0.5.test.tsx > precedence > geometry override propagates`.

5. **TC1.5 — backward compat: existing `dims`-only call sites unchanged**.
   Input: `<HeavyBlockBoundary kind="jupyter" dims={{ width: 600,
   height: 300 }} load={mockLoad} childProps={{}} />`. Expected:
   same render output as v0.4 (style.width 600px, style.minHeight
   300px); no regression on the v0.4 path. Location:
   `HeavyBlockBoundary.v0.5.test.tsx > backward-compat > dims-only path unchanged`.

(Suite 1 final count: 6 cases — TC1.1 (explicit-dims-wins) + TC1.2
(gridContext-derives) + TC1.3 (throws-on-neither) + TC1.4 (geometry-
override; added at codex R3) + TC1.5 (backward-compat) + 1 extra
"gridContext-only path no NaN" sanity case kept by codex R2. Existing
A2 + A3 + A4 era test cases preserved unchanged in their original
suite files. Total package-level vitest count: 19 PASS.)

### Suite 2: `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts` (Playwright e2e per v1.3 catalog)

1 test case per v1.3 retrofit catalog line 553-560:

1. **TC2.1 — `"plugin placeholder consumes grid
   effectiveColWidth/effectiveCellHeight"`**. Input: navigate
   `/sample-blocks`; locate heavy block plugin placeholder + adjacent
   light block. Expected:
   - heavy block `boundingBox.width` is finite (NOT NaN);
   - heavy block `boundingBox.height >= 0`;
   - heavy block `width` matches adjacent same-colSpan light block
     within ±2px tolerance;
   - heavy block does NOT overflow grid container right edge (heavy
     `box.x + width <= container.x + width + 1px`);
   - screenshot saved to
     `docs/audits/screenshots/wave-5-c2-7-heavy-grid-dims.png` (≥ 5KB
     at ACCEPT per `scripts/check-screenshot-archive.ts`).
   Location:
   `c2-7-heavy-grid-dims.spec.ts > "plugin placeholder consumes grid effectiveColWidth/effectiveCellHeight"`.

(Suite 2 final count: 1 case — TC2.1 canonical e2e_smoke.)

**Suite total: 6 vitest (TC1.1-1.5 + 1 sanity case) + 1 Playwright = 7 test cases**. All MUST PASS
at AC#9 (`pnpm --filter @skb/heavy-block-boundary test` exit 0) +
AC#13 (Playwright spec PASS on CI; WSL2 skip locally per memory
`feedback_wsl2_chromium_launch`).

## contracts_affected

- `packages/heavy-block-boundary/CONTRACT.md` — **MODIFIED**. Public
  Surface section gets `gridContext?: { colSpan; rowSpan;
  containerWidth; geometry? }` bullet appended after `onLoadError?`.
  Invariants section gets a NEW `**Dims-derivation precedence (v0.5;
  AC#17)**` invariant codifying explicit-dims-wins → gridContext-
  derived → throw-on-neither precedence + W5-1 single-authority
  delegation cross-reference. Authority Links section gets ADR-0016
  D6 + D9 cross-reference appended. D2 row 1 hit. Per ADR-0014 v0.5
  + ADR-0016 §502 sister-doc-sync — same-PR-with-implementation site
  for the v0.5 public surface bullet + invariant.

- `packages/block-foundation/CONTRACT.md` — **NOT** modified. The
  W5-1 公式 (`effectiveColWidth` + `effectiveCellHeight` +
  `GridGeometry` + `DEFAULT_GRID_GEOMETRY`) public surface was
  already authored at C.2-2 squash `b15ba24`; C.2-7 is a
  consumer-side wire-up that imports the existing surface (no
  upstream change required).

- `packages/editor-shell/CONTRACT.md` — **NOT** modified (C.2-7 does
  not touch editor-shell; resize / drag-drop / grid-container
  surfaces unchanged).

- `apps/site/CONTRACT.md` — **NOT** modified. C.2-3 already shipped
  the `## Grid layout (Wave 5)` section with `.skb-grid` selector
  authority + 12/6/1 breakpoint table at PR squash `2586328`; C.2-7
  spec consumes the existing selector authority + `/sample-blocks`
  page surface (C.1-1 plugin placeholder squash) but does NOT modify
  apps/site.

- 8 `@skb/block-*` CONTRACT.md files — **NOT** modified.
  `@skb/mdx-bridge` / `@skb/design-tokens` CONTRACT.md — **NOT**
  modified.

D2 row 5 (boundary contract change) hit because the new
`packages/heavy-block-boundary/CONTRACT.md` v0.5 invariant codifies
the runtime consumer relationship from `@skb/heavy-block-boundary`
to `@skb/block-foundation/grid-math` — heavy-block-boundary now
consumes block-foundation as a runtime dependency for the dims
derivation path (was a typecheck-only / no-runtime-import dep at
v0.4). Downstream consumers (Stage C.4 `apps/site/src/pages/notes/[slug]/edit.astro`
mount site at C.4-2 + C.4-3 + the editor-shell heavy-block wrap path
at C.4-4) may opt to use the gridContext path once integrated; v0.4
explicit-dims path remains forward-compatible.

Plus D2 row 1 hit on `@skb/heavy-block-boundary/CONTRACT.md` (single,
not double — block-foundation contract not modified). Plus D2 row 4
hit (NEW ADR amendment) per Wave 5 plan v1.3 ROW 4 门槛规则 — v0.5
Amendments § append is a substantive Amendment per v0.2.1 + v0.3 +
v0.4 precedent.

PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES.

## adr_touched

ADR-0014 v0.5 Amendments § entry appended (substantive Amendment;
status remains `accepted`; date `2026-05-05`; Wave-tag `Wave 5 Stage
C.2`). Amendment widens D1 component API with optional `gridContext`
field + adds D11 dims-derivation precedence rule (explicit `dims`
wins → gridContext-derived → throw on neither). Optional new AC#17
(boundary derivation matches W5-1 公式 byte-equal to direct
block-foundation invocation; per Suite 1 TC1.2 + TC1.4 vitest evidence).

D2 row 4 HIT per Wave 5 plan v1.3 ROW 4 门槛规则 — substantive
Amendment to an accepted ADR. PRE-COMMIT CLAUDE REVIEW (D1 stage 4)
FIRES per D2 row 4.

ADR-0016 D6 + D9 (W5-1 公式 single authority `effectiveColWidth` +
`effectiveCellHeight` + `GridGeometry`) referenced in the v0.5
Amendments § + the HeavyBlockBoundary.tsx file-head JSDoc + the
CONTRACT.md Authority Links — NOT amended (consumer-side wire-up
only; ADR-0016 surface unchanged).

ADR-0016 §502 sister-doc-sync row 1 of 4 (CONTRACT.md sync
requirement) operationally satisfied for
`packages/heavy-block-boundary/CONTRACT.md` (same-PR-with-
implementation sync site).

ADR-0011 D1 (linear pipeline) + D2 (trigger schema) + D6 (codex
patterns) + D9 (Product Experience Quality Gate) + D9.1 (path
patterns) + D9.5 (screenshot archive flow) + D10 (anti-prompt-
patching) — operational enforcement, NOT amended.

ADR-0006 D8 (explicit-file-list staging) + 8-point checklist + 9th
item (UI-touch + E2E spec) — operational enforcement, NOT amended.

ADR-0014 D5 (Dimensions ownership; `heavyBoundaryDimensions` field
on the block UI definition) — referenced as the v0.4 surface that
v0.5 widens; v0.5 keeps D5 backward-compatible (explicit-dims
consumers unchanged).

**Wave 5 plan v1.3 row C.2-7 + UI-touch retrofit catalog (lines
553-560)** referenced as the canonical e2e_smoke source per ADR-0011
D10 anti-prompt-patching (catalog wins over inline paraphrase). PR
#75 squash `5bd5112` (Wave 5 plan v1.3 amendment) + PR #76 squash
`ad42f71` (symmetric ui_touch=false skip in
`scripts/check-screenshot-archive.ts`) cited as the upstream
enabling work that landed the catalog + the symmetric skip pattern
(plan-PR forward-declaration paths no longer trip CI).

## acceptance

15 verifiable acceptance criteria. Each is a single shell command
producing an objectively checkable result. ACCEPT-stage pr-writer
(D1 stage 6) re-runs all 15 against the post-commit working tree.

### AC#1 — ADR-0014 v0.5 Amendments § entry exists with date `2026-05-05` + Wave-tag

```bash
grep -nE '^### v0\.5 \(2026-05-05.*Wave 5 Stage C\.2' \
  docs/decisions/ADR-0014-heavy-block-boundary.md | wc -l
```

Expected: `≥ 1`. Verifies the v0.5 sub-section header was appended
to `## Amendments` with the correct date + Wave-tag (parallel to
v0.2.1 + v0.3 + v0.4 precedent).

### AC#2 — ADR-0014 status remains `accepted` (NOT flipped)

```bash
grep -nE '^\| 状态 \| accepted \|' \
  docs/decisions/ADR-0014-heavy-block-boundary.md | wc -l
```

Expected: `≥ 1`. Verifies the Chinese-table header row `| 状态 |
accepted |` is preserved (NOT flipped to `proposed` or
`deprecated`); v0.5 is a substantive Amendment, NOT a status
promotion. ADR-0014 uses Chinese table front-matter (NOT YAML), so
the AC pattern matches the table-row form.

### AC#3 — HeavyBlockBoundaryProps (P-generic) exposes new optional `gridContext` field

```bash
grep -nE 'readonly gridContext\?:' \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | wc -l
grep -nE 'readonly colSpan: number;' \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | wc -l
grep -nE 'readonly containerWidth: number;' \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | wc -l
```

Expected: each `≥ 1`. Verifies the `gridContext` field declaration
+ the inner `colSpan` + `containerWidth` numeric members are
present. The multi-line `readonly` form (one member per line) is
the canonical TypeScript style for nested optional shapes; the
single-line grep would mis-match this layout, so the AC splits into
3 keyword greps instead.

### AC#4 — HeavyBlockBoundary imports `effectiveColWidth` + `effectiveCellHeight` from `@skb/block-foundation`

```bash
grep -nE "from\s+['\"]@skb/block-foundation" \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | wc -l
grep -nE "import.*effectiveColWidth" \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | wc -l
grep -nE "import.*effectiveCellHeight" \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | wc -l
```

Expected: each `≥ 1`. Verifies single-authority delegation to
block-foundation (NO local re-impl of W5-1 公式 per ADR-0006 class
4 single-authority + memory `feedback_cross_package_consumer_pattern`).

### AC#5 — Throw at call time when neither `dims` nor `gridContext` supplied

```bash
grep -nF "HeavyBlockBoundary requires either dims or gridContext" \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | wc -l
```

Expected: `≥ 1`. Verifies the verbatim error string is present
(matches the canonical message from the briefing + Suite 1 TC1.3
vitest assertion).

### AC#6 — `HeavyBlockBoundary.tsx` does NOT contain a local re-implementation of W5-1 公式

```bash
grep -nE "function effectiveColWidth|function effectiveCellHeight" \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx | wc -l
```

Expected: `0`. Verifies single-authority compliance — the helpers are
imported from `@skb/block-foundation`, NOT re-defined locally.

### AC#7 — CONTRACT.md Public Surface lists `gridContext`

```bash
grep -nF 'gridContext' packages/heavy-block-boundary/CONTRACT.md | wc -l
```

Expected: `≥ 1`. Verifies the sister-doc Public Surface bullet add
(ADR-0016 §502 row 1 of 4 sync requirement satisfied).

### AC#8 — CONTRACT.md Invariants codify the dims-derivation precedence + W5-1 delegation

```bash
grep -nF 'Dims-derivation precedence' \
  packages/heavy-block-boundary/CONTRACT.md | wc -l
grep -nF 'effectiveColWidth' \
  packages/heavy-block-boundary/CONTRACT.md | wc -l
grep -nF 'effectiveCellHeight' \
  packages/heavy-block-boundary/CONTRACT.md | wc -l
```

Expected: each `≥ 1`. Verifies the v0.5 Invariant entry is present
+ cross-references both W5-1 公式 helpers by name.

### AC#9 — `pnpm --filter @skb/heavy-block-boundary test` PASS (6 new v0.5 + existing cases; 19 total)

```bash
pnpm --filter @skb/heavy-block-boundary test
```

Expected: exit 0 with `19 passed` total (`@skb/heavy-block-boundary`
package level). All existing A2 + A3 + A4 vitest cases continue to
PASS plus 6 new v0.5 cases in `HeavyBlockBoundary.v0.5.test.tsx`:
TC1.1 explicit-dims-wins + TC1.2 gridContext-derives + TC1.3
throw-on-neither + TC1.4 geometry-override (added at codex R3 per
reviewer R1 issue 4) + TC1.5 backward-compat + 1 sanity case
"gridContext-only path no NaN" kept by codex R2. No skipped tests.

### AC#10 — `pnpm exec tsx scripts/check-ui-touch.ts --files` returns `ui_touch: true` (REVIEW-stage runnable)

```bash
pnpm exec tsx scripts/check-ui-touch.ts --files \
  packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx \
  packages/heavy-block-boundary/CONTRACT.md \
  packages/heavy-block-boundary/package.json \
  packages/heavy-block-boundary/tsconfig.json \
  packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.v0.5.test.tsx \
  apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts \
  docs/decisions/ADR-0014-heavy-block-boundary.md \
  docs/plans/wave-5-main/C.2-7-adr-0014-v0.5-amendment.md
```

Expected: stdout contains `ui_touch: true`. Uses `--files` explicit
mode (working-tree friendly; runs at stage 3 REVIEW *before* commit).
Verifies mechanical D9.1 detection AGREES with the v1.3 catalog
annotation (touches `packages/heavy-block-boundary/src/**` per D9.1
path pattern). Diff-based invocation (no `--files`) requires post-commit
state; this AC uses explicit-files mode so it runs at any pipeline
stage.

### AC#11 — `pnpm exec tsx scripts/check-e2e-coverage.ts` validates `playwright_spec` resolvable (STAGE-6 ACCEPT)

```bash
pnpm exec tsx scripts/check-e2e-coverage.ts
```

Expected: exit 0. Verifies the `playwright_spec:
apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts:"plugin
placeholder consumes grid effectiveColWidth/effectiveCellHeight"`
file exists + the named `test(...)` block is resolvable.

> **Timing**: `check-e2e-coverage.ts` script (Wave 5 PR #74 ship) only
> supports `git diff --name-only origin/main...HEAD` mode (no
> `--files` working-tree mode). At stage 3 REVIEW the diff is empty
> (work uncommitted) and the script auto-skips with `ui_touch=false`.
> AC#11 is therefore a **stage-6 ACCEPT post-commit AC** — pr-writer
> ACCEPT (D1 stage 6) re-runs this command after stage-5 commit when
> `origin/main...HEAD` reflects the committed work. Stage-3 reviewer
> verifies the spec file exists + canonical name via AC#12 instead.
> Future hardening: extend `scripts/check-e2e-coverage.ts` with a
> `--files` working-tree mode (out of scope for this PR; track in
> Wave 5 close ADR-0019 retro candidate).

### AC#12 — Playwright spec file exists + uses the canonical test description string verbatim

```bash
test -f apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts && \
  grep -nF 'plugin placeholder consumes grid effectiveColWidth/effectiveCellHeight' \
    apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts | wc -l
```

Expected: `≥ 1`. Verifies the Playwright spec was authored at the
canonical path with the exact test description string from the v1.3
catalog (so `scripts/check-e2e-coverage.ts` resolves it).

### AC#13 — Playwright spec PASSES on CI (WSL2 skip locally per memory)

```bash
# Local (WSL2) — auto-skip per memory `feedback_wsl2_chromium_launch`
pnpm --filter @skb/site exec playwright test \
  apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts || \
  echo 'WSL2 skip path expected; CI runs the actual spec'

# CI (Linux non-WSL): the spec MUST exit 0 + emit screenshot ≥ 5KB
```

Expected (CI): exit 0; screenshot `docs/audits/screenshots/wave-5-c2-7-heavy-grid-dims.png`
emitted ≥ 5KB. Local (WSL2): skip is acceptable per memory; CI is
the canonical PASS path.

### AC#14 — `pnpm exec tsx scripts/check-screenshot-archive.ts` PASS at ACCEPT (≥ 5KB)

```bash
pnpm exec tsx scripts/check-screenshot-archive.ts \
  docs/plans/wave-5-main/C.2-7-adr-0014-v0.5-amendment.md
```

Expected: exit 0. Run at ACCEPT (D1 stage 6) after CI executes the
Playwright spec + emits the screenshot. Verifies the screenshot
exists at the canonical path + is ≥ 5KB (placeholder guard per
PR #76 symmetric ui_touch skip + ≥ 5KB threshold).

### AC#15 — `pnpm check` clean (lint + typecheck + test + build + size)

```bash
pnpm check
```

Expected: exit 0. Lint + typecheck + test + build + size-check all
PASS for `@skb/heavy-block-boundary` + `@skb/site` + any package
transitively affected. Per memory `feedback_codex_spark_lint_gap`
— orchestrator independently runs `pnpm --filter
@skb/heavy-block-boundary lint` to catch lint-only issues; per memory
`feedback_git_operator_ci_verification` — uncached `pnpm --filter
@skb/heavy-block-boundary typecheck` is also re-run independently
because turbo cache + vitest miss tsc errors. NO file > 500 LOC
(HeavyBlockBoundary.tsx final ~170-200 LOC; CONTRACT.md ~80 LOC;
Playwright spec ~80 LOC).

PR.md self-listed in this whitelist (AC#15 + listed in the `## files`
section as item 5) per ADR-0006 D8.

## verification required

The following commands run by orchestrator-self at D1 stage 4
(PRE-COMMIT CLAUDE REVIEW) and re-run by pr-writer at D1 stage 6
(ACCEPT). All 15 ACs (above) plus the D1 stage-3 codex-pr-reviewer-55
8-class checklist + 9th item (UI-touch + E2E spec), plus the
following augmented checks:

- `pnpm --filter @skb/heavy-block-boundary typecheck` PASS (uncached;
  per memory `feedback_git_operator_ci_verification`).
- `pnpm --filter @skb/heavy-block-boundary lint` PASS (per memory
  `feedback_codex_spark_lint_gap`).
- `pnpm --filter @skb/heavy-block-boundary build` PASS — `dist/`
  regenerates with the v0.5 `gridContext` field typed emit + the
  `@skb/block-foundation` import surfaced in the d.ts emit.
- `pnpm --filter @skb/site typecheck` PASS — the new Playwright spec
  imports type-resolve cleanly.
- `pnpm size-check` PASS — every file in the whitelist under 500 LOC.
- `git diff --cached --stat` post-staging shows exactly the 5
  whitelisted files (no incidental snapshot / `pnpm-lock.yaml` /
  cache contamination — per memory
  `feedback_git_operator_explicit_stage`).
- Lychee discipline (per memories
  `feedback_lychee_autolink_in_backticks` +
  `feedback_lychee_line_anchor` + `feedback_lychee_npmjs_403` +
  `feedback_lychee_user_local_paths`):

  ```bash
  grep -nE '`[^`]*<\w+>[^`]*`' \
    docs/plans/wave-5-main/C.2-7-adr-0014-v0.5-amendment.md \
    docs/decisions/ADR-0014-heavy-block-boundary.md \
    packages/heavy-block-boundary/CONTRACT.md
  ```

  Expected: zero matches inside backtick spans for the v0.5 added
  prose. CI Lychee runs against the merged tree as canonical;
  orchestrator pre-empts locally.

- Cross-package consumer parity check (per memory
  `feedback_cross_package_consumer_pattern`):

  ```bash
  # W5-1 公式 single authority lives at block-foundation
  grep -nF 'export function effectiveColWidth' \
    packages/block-foundation/src/grid-math.ts
  grep -nF 'export function effectiveCellHeight' \
    packages/block-foundation/src/grid-math.ts

  # heavy-block-boundary IMPORTS (not re-defines)
  grep -nF 'effectiveColWidth' \
    packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx
  grep -nF 'effectiveCellHeight' \
    packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx
  ```

  All four must produce hits — single-authority delegation, not
  algorithmic replication.

- Manual sanity (post-build): `apps/site/src/{islands,components}/`
  consumers still pass explicit `dims` (v0.4 path; precedence
  guarantees backward compat); no inadvertent `gridContext` migration
  leaked in by codex.

- Post-merge auto-merge-script verification (per memory
  `feedback_gh_pr_ci_conclusion_vs_status`): orchestrator post-merge
  CI verification MUST use `gh run view --json conclusion` parsing
  `conclusion === "SUCCESS"` (NOT `status === "COMPLETED"` which
  marks runs that may have failed). See `## executor` Stage 7
  ACCEPT note.

## ui_touch

`true` (touches `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
per ADR-0011 D9.1 path pattern `packages/heavy-block-boundary/src/**`).

Mechanical detection via `pnpm exec tsx scripts/check-ui-touch.ts`
(AC#10) AGREES with this catalog annotation. Per ADR-0011 D9 +
v1.3 retrofit catalog (line 555).

## e2e_smoke

Verbatim from Wave 5 plan v1.3 retrofit catalog lines 553-560 (re-formatted
as single-bullet-with-indented-keys to satisfy
`scripts/check-e2e-coverage.ts` parser; the script splits on `^\s*-\s+(?=key:)`
so `target_url`/`playwright_spec`/`screenshot_archive` are continuation
lines, not separate bullets; values shipped without surrounding backticks
so `scripts/check-screenshot-archive.ts` regex `\S+` captures the bare
path):

- flow: heavy block plugin placeholder renders consuming grid effectiveColWidth + effectiveCellHeight (no NaN / no overflow / dimensions match adjacent light blocks)
  target_url: /sample-blocks
  playwright_spec: apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts
  screenshot_archive: docs/audits/screenshots/wave-5-c2-7-heavy-grid-dims.png

## Plan-challenger absorbtion

NOT APPLICABLE for an implementation PR per ADR-0011 D7. The Wave 5
plan v1.3 row C.2-7 + ADR-0014 v0.4 (current accepted) + ADR-0016 D6
+ D9 W5-1 公式 + ADR-0006 8-class audit checklist + 9th item are the
authoritative inputs. No plan-challenger dispatch occurred at PLAN
stage; the Wave 5 plan was already plan-challenger-vetted at v1.3
amendment (4-row absorbtion table per PR #75 squash `5bd5112`);
ADR-0014 was already plan-challenger-vetted at Wave 4 Stage A close
+ v0.3 + v0.4 amendments; ADR-0016 D6 + D9 absorbtion was already
plan-challenger-vetted at Pre-A2 lock.

**Open questions surfaced during PLAN draft** (none blocking lock;
documented for orchestrator):

1. **Should the throw fire at call time (function entry) or at
   render time (inside the component body before `useEffect`)?**
   **Resolved**: at call time, BEFORE `useState` calls. Throwing
   before any state initialization surfaces mis-wiring with the
   cleanest stack trace + zero risk of partial state corruption.
   The briefing language ("at call time, not render time") is
   honored: function entry → check args → throw if invalid → only
   then proceed to useState. The phrase "at render time" in the
   briefing referred to deferring the throw to `useEffect` async
   path, which would surface the error AFTER the load attempt
   resolves (slow, opaque). Resolution: synchronous fail-fast at
   function entry.

2. **Should the gridContext shape use `containerWidth` (matches
   `effectiveColWidth(colSpan, containerWidth, geometry?)` HEAD
   signature) or `viewportCols` (briefing prose paraphrase)?**
   **Resolved**: `containerWidth: number` — the live signature at
   `packages/block-foundation/src/grid-math.ts` lines 57-67 takes
   `containerWidth: number` as the second parameter (NOT `viewportCols`;
   `viewportCols` is the parameter for `effectiveColSnaps` per C.2-6
   squash). Per memory `feedback_pr_reviewer_authority_at_head` —
   read live source at HEAD, not the briefing-prose paraphrase. The
   briefing prose mentioned `viewportCols` as the gridContext shape
   field which would require an additional internal lookup
   (viewportCols → containerWidth) that the W5-1 helper does not
   provide. Resolution: pass `containerWidth` directly. **FLAGGED**
   for orchestrator confirmation — see `## ambiguity flagged`.

3. **Should the v0.5 Amendments § entry add a NEW AC#17 to
   ADR-0014 acceptance criteria, or just append the prose under
   `## Amendments` without a numbered AC?** **Resolved**: add NEW
   AC#17 (boundary derivation matches W5-1 公式 byte-equal to direct
   block-foundation invocation; per Suite 1 TC1.2 + TC1.4 vitest
   evidence). Follows v0.3 precedent (added AC#16 per the v0.3
   sub-section header "NEW D10 + AC#16"). Numbered ACs are
   easier to cite from downstream PRs + CI gates than free prose.
   **NOT BLOCKING** — if orchestrator prefers prose-only (no AC#17),
   the Amendment is still substantive on the D-list addition alone.

4. **Should the v0.5 test suite live at
   `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.v0.5.test.tsx`
   (NEW sibling) OR amend an existing
   `packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.test.tsx`
   in-place?** **Resolved**: NEW sibling at `.v0.5.test.tsx`.
   Co-locating v0.5 cases in a versioned sibling file keeps the
   v0.4 test file unchanged (zero risk of regression on existing
   A2-A4 coverage) + makes the v0.5 surface trivially auditable
   (`grep -lF 'gridContext' packages/heavy-block-boundary/src/__tests__/`).
   **FLAGGED** for orchestrator — if the existing test file pattern
   in the package is a single `HeavyBlockBoundary.test.tsx` with
   `describe` blocks per concern, the codex executor may prefer
   in-place amendment instead. See `## ambiguity flagged`.

5. **Should the Playwright spec use a specific heavy block kind
   (jupyter / nn-viz / agent-flow) for the dimension parity assertion,
   or test all 3 in a `forEach` loop?** **Resolved**: test ONE
   (jupyter, deterministic selector `[data-block="jupyter"]`) for
   the canonical e2e_smoke. Testing all 3 in a loop would multiply
   screenshot output (3 PNG instead of 1) + slow the spec without
   adding meaningful coverage (the dims-derivation logic is identical
   across kinds; per-kind CSS variation is C.3 scope). Single-kind
   coverage satisfies the v1.3 catalog flow as worded ("heavy block
   plugin placeholder renders consuming grid…"; singular "placeholder").

## ambiguity flagged

Two ambiguities surfaced during PLAN draft that orchestrator should
confirm before EXECUTE:

1. **`gridContext` shape field name `containerWidth` vs `viewportCols`**:
   the briefing prose suggested `viewportCols` but the live HEAD
   signature `effectiveColWidth(colSpan, containerWidth, geometry?)`
   at `packages/block-foundation/src/grid-math.ts` line 57-67 uses
   `containerWidth: number`. PLAN locks `containerWidth` per memory
   `feedback_pr_reviewer_authority_at_head`. Orchestrator: confirm
   `containerWidth` is correct OR if the intent was to add a new
   `viewportCols → containerWidth` resolver helper (would require
   ADR-0016 amendment, NOT in this PR scope per briefing's "NO new
   grid-math additions" constraint). **PLAN ASSUMES** `containerWidth`
   matches HEAD signature.

2. **v0.5 test suite location**: NEW sibling file
   `HeavyBlockBoundary.v0.5.test.tsx` vs in-place amendment of
   existing `HeavyBlockBoundary.test.tsx` (or whatever the existing
   suite file is named under
   `packages/heavy-block-boundary/src/__tests__/`). PLAN prefers NEW
   sibling for cleanest v0.5 surface auditing. Orchestrator: confirm
   OR direct codex executor to inspect existing `__tests__/` layout
   at exec time + amend in-place if existing pattern demands it.
   Either decision satisfies `## files` whitelist (test files are
   package-internal + inherit ADR-0006 D8 implicit allowance).

## R14 self-check

R14 = the 14-point pre-flight per ADR-0011 / Wave 5 plan §232 D12
"PR.md PLAN-stage validation":

1. Stage scope-fence — only files inside the locked Stage C.2-7
   whitelist (8 codex-touchable files post orchestrator scope refinement
   2026-05-05; +4 staging artifacts at commit-time per `## Codex commit
   (D1 stage 5) staging` block = 12 entries total; cross-package files
   NOT touched beyond the `@skb/block-foundation` runtime import —
   block-foundation surface unchanged, consumer-side wire-up only).
   Row C.2-7 in plan v1.3
   cites `docs/decisions/ADR-0014-heavy-block-boundary.md` (v0.5
   Amendments §) + `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
   (consume W5-1 公式) + `packages/heavy-block-boundary/CONTRACT.md`
   (sister-doc-sync per ADR-0016 D9); this PR adds the canonical
   Playwright spec at `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts`
   per v1.3 catalog enforcement.

2. TDD-front discipline — `## test_cases` section enumerates 5
   vitest + 1 Playwright = 6 test cases before any implementation
   file per ADR-0011 D1 stage 2; codex-generic-executor MUST land
   tests first (red), then impl (green).

3. Cross-package consumer parity — per memory
   `feedback_cross_package_consumer_pattern`. The W5-1 公式
   (`effectiveColWidth` + `effectiveCellHeight`) single authority is
   `@skb/block-foundation/grid-math` (C.2-2 squash `b15ba24`); this
   PR's heavy-block-boundary consumer IMPORTS from authority (NOT
   re-defines). Verification block at AC#4 + AC#6 grep-asserts
   import-not-redefine.

4. R14 third real-test — per Wave 5 plan v1.3 amendment (PR #75
   squash `5bd5112`) + memory implicit (R14 third
   real-test). C.2-7 PR.md `## ui_touch` + `## e2e_smoke` sections
   are populated VERBATIM from the v1.3 retrofit catalog (lines
   553-560), NOT paraphrased; Playwright spec authored at the
   canonical path with the canonical test description string per
   v1.3 catalog enforcement. ADR-0011 D10 anti-prompt-patching
   discipline observed.

5. Codex spark lint gap — per memory `feedback_codex_spark_lint_gap`
   — orchestrator-self runs `pnpm --filter @skb/heavy-block-boundary
   lint` post-codex independently before authorising commit;
   verification block enumerates this.

6. Codex audit-log self-recursion — per memory
   `feedback_codex_audit_log_recursion` — codex executor invocation
   pipes audit log to `/tmp/codex-runs/...` first, NOT directly to
   `docs/audits/codex-runs/...`; orchestrator copies post-completion.

7. Lychee discipline — per memories
   `feedback_lychee_autolink_in_backticks` +
   `feedback_lychee_line_anchor` + `feedback_lychee_npmjs_403` +
   `feedback_lychee_user_local_paths`. PR.md uses no
   angle-bracketed-word-shape autolinks inside backticks; no `:line`
   suffix on file links; no `npmjs.com` URLs; no markdown-link
   tilde paths. Pre-empt grep:

   ```bash
   grep -nE '`[^`]*<\w+>[^`]*`' \
     docs/plans/wave-5-main/C.2-7-adr-0014-v0.5-amendment.md
   ```

   Expected: zero matches.

8. WE-009 multi-worker lint contamination — per memory
   `feedback_multi_worker_lint_contamination`. C.2-7 is single-PR
   serial work (no concurrent worker B); standard lockfile
   isolation suffices. orchestrator runs `pnpm --filter
   @skb/heavy-block-boundary` + `pnpm --filter @skb/site` filtered
   scope to avoid neighbouring package lint contamination.

9. PR Reviewer authority at HEAD — per memory
   `feedback_pr_reviewer_authority_at_head`. ADR-0014 v0.4 +
   ADR-0016 D6 + D9 + the actual `effectiveColWidth(colSpan,
   containerWidth, geometry?)` HEAD signature at
   `packages/block-foundation/src/grid-math.ts` lines 57-67 read at
   HEAD `b2fdd8f` for this PR.md draft; not from earlier review-
   report quotes. The briefing prose's `viewportCols` paraphrase
   was overridden in favour of `containerWidth` per HEAD signature
   (see `## ambiguity flagged`).

10. WE-011 active-writer break WE-009 — per memory
    `feedback_active_writer_break_we009`. C.2-7 scope is
    `packages/heavy-block-boundary/` (1 src file + 1 CONTRACT edit) +
    1 ADR edit + 1 NEW Playwright spec under `apps/site/` only;
    siblings (`packages/block-*` / `packages/mdx-bridge` /
    `packages/editor-shell` / `packages/design-tokens`) are quiescent
    for the duration of this PR.

11. WSL2 chromium launch — per memory
    `feedback_wsl2_chromium_launch`. C.2-7 NEW Playwright spec
    `apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts` MUST
    skip on WSL2 (`process.platform === 'linux' &&
    /Microsoft/i.test(process.release.osRelease ?? '')`) per the
    memory pattern. CI executes the actual test on Linux non-WSL
    + emits the screenshot. AC#13 documents the skip-locally /
    PASS-on-CI path.

12. Wave 3 main pipeline auto-merge — per memory
    `feedback_wave3_auto_merge`. orchestrator post-merge uses `gh
    pr merge --squash --delete-branch` once ACCEPT-PASS + all CI
    SUCCESS (with the post-merge `conclusion = "SUCCESS"` correctness
    check per memory `feedback_gh_pr_ci_conclusion_vs_status`).

13. R14 defer-chain — per memory
    `feedback_r14_defer_chain_plan_amendment`. C.2-7 is a fresh
    PR off main `b2fdd8f` (post v1.3 amendment + symmetric skip
    fix merges); no defer-chain residue carried over. Open questions
    in `## Plan-challenger absorbtion` resolved IN FAVOR of plan; 2
    ambiguities flagged for orchestrator (see `## ambiguity flagged`)
    are NOT defer-chain residue (PLAN-stage clarifications, not
    cross-PR carry-overs).

14. gh PR CI conclusion vs status — per memory
    `feedback_gh_pr_ci_conclusion_vs_status`. The `## executor`
    Stage 7 ACCEPT block names `gh run view --json conclusion`
    parsing `conclusion === "SUCCESS"` (NOT `status === "COMPLETED"`);
    orchestrator post-merge auto-merge script will use the hardened
    pattern.

## D2 trigger judgment

ADR-0011 D2 v0.2 (post-PR #74 standards-landing) trigger row evaluation
for C.2-7:

- **Row 1 (CONTRACT change)** — **HIT**.
  `packages/heavy-block-boundary/CONTRACT.md` modified (Public
  Surface bullet + Invariants entry + Authority Links bullet). Per
  ADR-0014 v0.5 + ADR-0016 §502 sister-doc-sync — same-PR-with-
  implementation site for the v0.5 contract additions.

- **Row 2 (package add/remove)** — **NOT HIT**. No new package; no
  package removal.

- **Row 3 (≥1 npm dep change)** — **NOT HIT**. NO `package.json` /
  `pnpm-lock.yaml` change. `@skb/block-foundation` already declared
  as runtime dep at heavy-block-boundary A1 (verify at exec time).

- **Row 4 (NEW ADR required OR substantive ADR amendment)** — **HIT**.
  ADR-0014 v0.5 Amendments § entry appended (substantive Amendment
  per v0.2.1 + v0.3 + v0.4 precedent; status remains `accepted`,
  NOT a status flip). Substantive Amendment widens D1 component API
  with `gridContext` field + adds D11 dims-derivation precedence
  rule + optionally adds AC#17. Per Wave 5 plan v1.3 ROW 4 门槛规则.

- **Row 5 (cross ≥3 packages OR boundary contract change)** — **HIT**.
  `packages/heavy-block-boundary/CONTRACT.md` boundary contract
  extended (v0.5 widens public surface + adds Invariant codifying
  runtime consumer relationship from heavy-block-boundary to
  block-foundation/grid-math). Heavy-block-boundary now consumes
  block-foundation as a runtime dependency for the dims derivation
  path (was a typecheck-only / no-runtime-import dep at v0.4).

- **Row 6 (deploy / CI / security touched)** — **NOT HIT**. No CI
  config / deploy / auth change.

- **Row 7 (≥3 reviewers required)** — **NOT HIT** by file-count
  triage. C.2-7 is 8-file (codex-touchable; 12 entries at stage-5
  commit including PR.md self + audit logs) serial work; D1 stage 3
  codex-pr-reviewer-55 + D1 stage 4 PRE-COMMIT CLAUDE REVIEW
  (orchestrator-self) suffice.

- **Row 8 (high-risk class: deploy / auth / security)** — **NOT HIT**.

**Verdict**: Row 1 + Row 4 + Row 5 HIT → **PRE-COMMIT CLAUDE REVIEW
(D1 stage 4) FIRES** (Row 4 alone fires the gate; Row 1 + Row 5 also
strengthen stage 3 reviewer scrutiny per ADR-0006 D8 staging). ADR-0006
8-point checklist + 9th item (UI-touch + E2E spec) mandatory at codex
review (D1 stage 3) per ADR-0011 D6 + D9. orchestrator runs PRE-COMMIT
CLAUDE REVIEW between stage 3 PASS and stage 5 commit — same-model
echo-chamber mitigation per ADR-0011 D2 design rationale.

## Risk register

7 known risks — pre-flight mitigations enumerated. Stage 3 codex
review + Stage 4 PRE-COMMIT CLAUDE REVIEW evaluate each.

### Row 1 — codex migrates existing apps/site .astro consumers from `dims` to `gridContext` prematurely

**Risk**: codex-generic-executor reads the v0.5 Amendments § entry +
decides to "migrate" existing `apps/site/src/{islands,components}/`
consumers from explicit `dims` to `gridContext` to "demonstrate" the
new path. LOC budget balloons ≥ 500 LOC + cross-package consumer-side
churn + breaks v0.4 backward-compat guarantee.

**Mitigation**: PR.md `## title` LOCKED implementation path block
explicitly forbids this scope. AC#3 + AC#4 + AC#7 + AC#8 only check
the heavy-block-boundary package surface. Stage 3 codex review checks
the diff stays inside the 8-file codex-touchable whitelist (12 at
stage-5 commit). PR.md `## files` and
`## title` enumerate explicit "NO change to apps/site" deferrals.

### Row 2 — local re-implementation of W5-1 公式 in HeavyBlockBoundary.tsx

**Risk**: codex authors a local `function effectiveColWidth(...)`
or `function effectiveCellHeight(...)` inside HeavyBlockBoundary.tsx
instead of importing from `@skb/block-foundation`. Single-authority
violation per ADR-0006 class 4 + memory
`feedback_cross_package_consumer_pattern`.

**Mitigation**: AC#4 grep-asserts the import. AC#6 grep-asserts
ZERO local re-impl. Source JSDoc cites ADR-0016 D9 single authority.
Stage 3 codex review + Stage 4 PRE-COMMIT CLAUDE REVIEW both check.

### Row 3 — throw fires too late (in `useEffect`, not at function entry)

**Risk**: codex authors the throw inside `useEffect` async path
(`if (!dims && !gridContext) throw new Error(...)` after `useState`
calls). The error then surfaces AFTER the component has rendered the
initial null state + load attempt resolves; opaque stack trace +
slow user-feedback for mis-wiring.

**Mitigation**: PR.md `## Plan-challenger absorbtion` Open Question #1
explicitly resolves throw at function entry, BEFORE `useState` calls.
TC1.3 vitest asserts synchronous throw on render attempt. AC#5 grep
asserts the verbatim error string is present.

### Row 4 — `gridContext` shape uses `viewportCols` (briefing paraphrase) instead of `containerWidth` (HEAD signature)

**Risk**: codex reads the briefing prose `viewportCols` and authors
the gridContext shape as `{ colSpan; rowSpan; viewportCols; geometry? }`
instead of `{ colSpan; rowSpan; containerWidth; geometry? }`. The
import then fails to typecheck because `effectiveColWidth(colSpan,
viewportCols, geometry?)` does not match the HEAD signature
`(colSpan: number, containerWidth: number, geometry?)`.

**Mitigation**: PR.md `## ambiguity flagged` item 1 explicitly names
`containerWidth` as the locked field name + cites the HEAD signature
location. PR.md `## test_cases` Suite 1 TC1.2 asserts on
`effectiveColWidth(12, 1200) === 1200`px — the `1200` argument
position is `containerWidth` per HEAD. PR.md `## R14 self-check`
item 9 reinforces.

### Row 5 — ADR-0014 status accidentally flipped from `accepted`

**Risk**: codex reads the v0.5 Amendments § append + decides to also
"reflect" the v0.5 in the front-matter / header `status:` field.
v0.5 is a substantive Amendment, NOT a status promotion; status
should remain `accepted` per the v0.2.1 precedent.

**Mitigation**: AC#2 grep asserts `status: accepted` remains in the
ADR file. PR.md `## title` + `## adr_touched` repeatedly note
"status remains `accepted`, NOT a status flip". PR.md acceptance
list opens with AC#1 (v0.5 entry exists with date) + AC#2 (status
unchanged) as a paired anti-flip guard.

### Row 6 — Playwright spec WSL2 skip path missing → CI green but local always skipped

**Risk**: codex authors the Playwright spec WITHOUT the WSL2 skip
guard per memory `feedback_wsl2_chromium_launch`. CI passes (Linux
non-WSL) but local development on WSL2 throws chromium-launch errors,
fails noisily, contaminates `pnpm check` output.

**Mitigation**: PR.md `## test_cases` Suite 2 TC2.1 + AC#13 both
explicitly call out the WSL2 skip path. Source comment in the
spec file MUST reference the memory by name
(`feedback_wsl2_chromium_launch`) so codex review surfaces the
intent.

### Row 7 — Lychee autolink-in-backticks regression in PR.md OR ADR-0014 v0.5 entry OR CONTRACT.md

**Risk**: PR.md / ADR amendment / CONTRACT.md prose contains an
angle-bracketed-word shape inside backticks. Lychee parses as
autolink and fails the link-check. Pre-empted by R14 self-check
item 7 grep at PR.md draft time + ACCEPT-stage grep across all
3 modified prose files.

**Mitigation**: R14 item 7 grep pre-empt; ACCEPT-stage grep across
PR.md + ADR + CONTRACT.md (verification required block).
orchestrator scans before push. PR.md author (this draft)
self-checked: no angle-bracketed-word-shape autolinks inside
backticks.

## Out of scope

Explicitly out of scope per the briefing's anti-scope-creep section
+ Wave 5 plan v1.3 row C.2-8 / C.3 / C.4 enumeration:

- **Migration of existing `apps/site/src/{islands,components}/`
  `.astro` consumers from explicit `dims` to `gridContext`** —
  v0.4 path is forward-compatible per the precedence rule
  (explicit `dims` wins); migration is a separate follow-up if
  and when needed. Out of this PR.

- **NEW BlockKind additions** — `HeavyBlockKind` widening already
  ships at v0.4 via ADR-0014 C6 branded widening; no new kinds
  added in v0.5.

- **NEW grid-math additions** — `effectiveColSnaps` (C.2-6 squash)
  + `effectiveColWidth` + `effectiveCellHeight` (C.2-2 squash) all
  already shipped; v0.5 is a consumer-side wire-up only, no
  upstream block-foundation surface change.

- **Retry-flow / lifecycle / a11y changes** — A2 + A3 + A4 already
  shipped. v0.5 ONLY widens the dims authoring surface to allow
  grid-derived path; existing retry semantics + mount-guard +
  AbortSignal cancellation + A11y semantics + reduced-motion
  + plugin extensibility invariants unchanged.

- **`@skb/editor-shell` heavy-block wrap path** (Stage C.4 wire-up
  at `apps/site/src/pages/notes/[slug]/edit.astro`) — deferred to
  Stage C.4 PRs per Wave 5 plan v1.3 Stage C.4 row table.

- **Token application** for skeleton color / spinner color — Stage
  C.3 ADR-0018 token migration scope.

- **Playwright `performance.now()` 60fps budget assertion** for
  heavy-block render — deferred to Stage C.4 (perf budget gates
  per ADR-0017 AC#6 + memory `feedback_wsl2_chromium_launch`
  resolution).

- **Modal canvas heavy-block resize internal behavior** — out of
  Wave 5 entirely; Phase 2+ (ADR-0019+).

- **CRDT/OT collaborative editing for heavy-block dimension
  conflicts** — out of Wave 5 entirely; Phase 2+ per ADR-0016 D12 +
  ADR-0017 D12 single-user single-session assumption.

## execution plan

**Hybrid execution split** — orchestrator-self + codex-generic-executor:

- **orchestrator-self for ADR amendment** (file 1: `docs/decisions/ADR-0014-heavy-block-boundary.md`).
  Per Wave 5 plan v1.0 D6 pure-doc PR exception + the doc-policy
  precedent at v0.2.1 + v0.3 + v0.4 amendment authoring (orchestrator
  authored each Amendment § entry directly). The v0.5 entry follows
  the same pattern: orchestrator writes the substantive Amendment
  prose codifying the gridContext-derived dims path + D11 precedence
  rule + optionally AC#17. NO codex involvement for the ADR file.

- **codex-generic-executor for impl + Playwright spec + CONTRACT.md**
  (files 2 + 3 + 4: HeavyBlockBoundary.tsx + CONTRACT.md + Playwright
  spec). Per ADR-0011 D6 default executor for source + spec + sister-
  doc edits. Approval policy: `never`. Sandbox: `workspace-write`.
  Audit log: pipe to `/tmp/codex-runs/2026-05-05-C.2-7-adr-0014-v0.5-amendment.txt`
  first per memory `feedback_codex_audit_log_recursion`; orchestrator
  copies to `docs/audits/codex-runs/2026-05-05-C.2-7-adr-0014-v0.5-amendment.txt`
  after exec completes (head -50 + R21 grep verdicts if log > 500 KB).

Codex prompt synthesis: orchestrator-self walks PR.md sections
`## title` + `## files` (whitelist subset = files 2 + 3 + 4) +
`## test_cases` (TDD-front 6 vitest + 1 Playwright cases; TC1.4 added at codex R3) +
`## acceptance` (15 ACs subset 3-15 minus 1+2 which are ADR-only) +
`## ambiguity flagged` resolutions into the codex-generic-executor
stdin prompt; codex executor MUST land tests first (red), then impl
(green), then verify all relevant ACs locally before SendMessage to
orchestrator.

Per memory `feedback_codex_stdin` — pipe `< /dev/null` to `codex
exec` invocation to avoid stdin-hang.

Per memory `feedback_orchestrator_owns_approval` — codex profile
uses `approval_policy = "never"`; orchestrator-self is the only
human-in-the-loop interface.

### Stage 7 ACCEPT post-commit verification (orchestrator-self after pr-writer ACCEPT-PASS)

Per memory `feedback_gh_pr_ci_conclusion_vs_status` (codified
2026-05-05): orchestrator's auto-merge script MUST use:

```bash
gh pr view "$PR_URL" --json statusCheckRollup --jq \
  '[.statusCheckRollup[] | select(.conclusion != null) | .conclusion] | unique'
```

Acceptance: result `["SUCCESS"]` (single-element array) — all
non-null `conclusion` values are `"SUCCESS"`. NOT
`status === "COMPLETED"` (which would also accept failed runs).

Once PASS, `gh pr merge "$PR_URL" --squash --delete-branch` per
memory `feedback_wave3_auto_merge` (user 2026-05-01 authorization).

Post-merge: `git checkout main && git pull` then update
`docs/plans/active.md` row C.2-7 from `WIP` to `MERGED` plus the
new squash hash (separate fast-follow PR per active.md sync
discipline).

ACCEPT (D1 stage 6) MUST also run the screenshot-archive verification
per ADR-0011 D9.5 + AC#14 — `pnpm exec tsx
scripts/check-screenshot-archive.ts ...` exit 0; missing or < 5KB =
REJECT-with-residue.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging discipline + memory
`feedback_git_operator_explicit_stage` 4-step protocol. **Updated to
the post-orchestrator-scope-refinement 12-file list** (8 whitelist + 1
codex sibling test + 3 audit logs that emerged through R1+R2+R3
codex rounds). Audit logs are tracked per ADR-0011 R7 audit-log
archive flow (`/tmp/codex-runs/...` → `head -2000` → in-tree archive).

```bash
# Step 1: reset HEAD to clean staging area (race-proof against concurrent
# stagers; single-PR serial work but discipline is universal).
git reset HEAD

# Step 2: explicit add (no -A / no .) — exactly the 12 entries below.
# Codex executor sibling test file + 3 audit logs included; reviewer R3
# audit log added if codex re-dispatched post stage-3 R1 verdict.
git add docs/decisions/ADR-0014-heavy-block-boundary.md \
        packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx \
        packages/heavy-block-boundary/CONTRACT.md \
        packages/heavy-block-boundary/package.json \
        packages/heavy-block-boundary/tsconfig.json \
        packages/heavy-block-boundary/src/__tests__/HeavyBlockBoundary.v0.5.test.tsx \
        apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts \
        pnpm-lock.yaml \
        docs/plans/wave-5-main/C.2-7-adr-0014-v0.5-amendment.md \
        docs/audits/codex-runs/2026-05-05-C.2-7-execute.txt \
        docs/audits/codex-runs/2026-05-05-C.2-7-execute-r2.txt \
        docs/audits/codex-runs/2026-05-05-C.2-7-pr-reviewer-55.txt
# Note: if codex executor R3 ran for reviewer-flagged fixes, add:
#   docs/audits/codex-runs/2026-05-05-C.2-7-execute-r3.txt
# Note: if reviewer R2 ran post-fixes, add:
#   docs/audits/codex-runs/2026-05-05-C.2-7-pr-reviewer-55-r2.txt

# Step 3: verify --cached --stat shows the staged entries (12 base, +1
# per additional codex round). No -A scope creep — confirm via stat
# count + verify pnpm-lock.yaml stat shows ONLY the boundary importer
# block change (no unrelated workspace package version churn).
git diff --cached --stat
# Expected: 12 entries (or 13-14 if R3 + reviewer R2 audits added).
# Line-delta totals roughly:
#   ADR-0014-heavy-block-boundary.md      +110 LOC (Amendment append)
#   HeavyBlockBoundary.tsx                +28 LOC (delta on 128 LOC base; 156 final)
#   heavy-block-boundary CONTRACT.md      +12 LOC (delta on 63 LOC base; 75 final)
#   heavy-block-boundary package.json     +1 LOC (single dep entry)
#   heavy-block-boundary tsconfig.json    +4 LOC (single reference entry + array reformat)
#   HeavyBlockBoundary.v0.5.test.tsx      +112 LOC (NEW)
#   c2-7-heavy-grid-dims.spec.ts          +72 LOC (NEW)
#   pnpm-lock.yaml                        +3 LOC (single workspace dep block)
#   C.2-7-adr-0014-v0.5-amendment.md      ~1400 LOC (NEW; this PR.md)
#   2026-05-05-C.2-7-execute.txt          +2000 LOC (NEW; R7 truncated)
#   2026-05-05-C.2-7-execute-r2.txt       +2000 LOC (NEW; R7 truncated)
#   2026-05-05-C.2-7-pr-reviewer-55.txt   +2000 LOC (NEW; R7 truncated)

# Step 4: commit (NO --amend; new commit per WE-009 worker-side
# memory).
git commit -m "Wave 5 C.2-7 — ADR-0014 v0.5 + HeavyBlockBoundary consume W5-1 公式 from @skb/block-foundation (8 of 12 Stage C.2)

Lands the ADR-0014 v0.5 substantive Amendment widening
HeavyBlockBoundaryProps<P> with optional gridContext field +
HeavyBlockBoundary impl consuming effectiveColWidth +
effectiveCellHeight from @skb/block-foundation/grid-math (W5-1
公式 single authority per ADR-0016 D9) + sister-doc CONTRACT.md
sync per ADR-0016 §502 + canonical Playwright spec at
apps/site/src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts covering
heavy block plugin placeholder dimension consistency on
/sample-blocks per ADR-0011 D9 + Wave 5 plan v1.3 catalog.

* ADR-0014 v0.5 Amendments § entry appended (status remains
  accepted; substantive Amendment per v0.2.1 + v0.3 + v0.4
  precedent).
* HeavyBlockBoundary.tsx: + gridContext field; + import
  effectiveColWidth + effectiveCellHeight from @skb/block-foundation;
  + precedence-resolved internal dims derivation (explicit dims wins
  → gridContext-derived → throw at call time on neither).
* CONTRACT.md: + gridContext to Public Surface; + Dims-derivation
  precedence Invariant + W5-1 single-authority delegation.
* c2-7-heavy-grid-dims.spec.ts (NEW): canonical e2e_smoke per v1.3
  catalog; WSL2 skip per memory feedback_wsl2_chromium_launch; CI
  emits screenshot to docs/audits/screenshots/wave-5-c2-7-heavy-grid-dims.png.

Existing apps/site .astro consumers unchanged — v0.4 explicit-dims
path remains forward-compatible per the precedence rule.

Per ADR-0014 v0.5 + ADR-0016 D6 + D9 + ADR-0011 D9 (Product Experience
Quality Gate) + Wave 5 plan v1.3 row C.2-7 (UI-touch + e2e_smoke
catalog lines 553-560).

Co-authored-by: codex-generic-executor"
```

Reviewer codex (D1 stage 5; reviewer = `codex-pr-reviewer-55`)
performs the actual commit + push under `codex exec --yolo --profile
codex-pr-reviewer-55` — NOT pr-writer (per ADR-0011 D7 forbidden-
permission rule for pr-writer subagent). orchestrator dispatches
the reviewer codex with the PR.md as input.

## Related

- [ADR-0014 v0.5 (NEW Amendments § entry)](../../decisions/ADR-0014-heavy-block-boundary.md)
  — gridContext-derived dims path lock; D11 dims-derivation
  precedence rule (explicit dims wins → gridContext-derived → throw
  on neither).
- [ADR-0016 D6 + D9](../../decisions/ADR-0016-grid-data-model.md)
  — `effectiveColWidth` + `effectiveCellHeight` W5-1 公式 single
  authority that the v0.5 gridContext path delegates to;
  `GridGeometry` + `DEFAULT_GRID_GEOMETRY` shape.
- [ADR-0016 §502 sister-doc-sync](../../decisions/ADR-0016-grid-data-model.md)
  — row 1 of 4 CONTRACT.md sync requirement satisfied via
  `packages/heavy-block-boundary/CONTRACT.md` v0.5 Public Surface +
  Invariants edits.
- [ADR-0011 D1 / D2 / D6 / D9 / D9.1 / D9.5 / D10](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — Linear pipeline; D2 row 1 + row 4 + row 5 trigger judgment; D6
  codex patterns; D9 Product Experience Quality Gate + D9.1 path
  patterns + D9.5 screenshot archive flow + D10 anti-prompt-patching.
- [ADR-0006 D8 + 8-point checklist + 9th item](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — explicit-file-list staging + 8-class checklist + UI-touch + E2E
  spec 9th item.
- [Wave 5 plan v1.3 row C.2-7 + UI-touch retrofit catalog](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — Wave 5 plan v1.3 amendment lock (PR #75 squash `5bd5112`); row
  C.2-7 cite + canonical e2e_smoke catalog lines 553-560.
- [PR #75 (v1.3 amendment)](https://github.com/WYI1223/selfKnowledgeBaseWeb/pull/75)
  — Wave 5 plan v1.3 amendment squash `5bd5112`; landed UI-touch +
  e2e_smoke catalog for C.2-7 + 5 C.3 + 5 C.4 PRs.
- [PR #76 (symmetric ui_touch=false skip fix)](https://github.com/WYI1223/selfKnowledgeBaseWeb/pull/76)
  — `scripts/check-screenshot-archive.ts` symmetric ui_touch=false
  skip squash `ad42f71`; canonical `screenshot_archive` field name
  no longer trips CI on plan-PR forward-declaration paths.
- [C.2-6 resize UX (col-ruler + size-tooltip + effectiveColSnaps)](C.2-6-resize-ux.md)
  — Sibling C.2 PR. Established the
  `### Resize layer (C.2-6)` subsection pattern in editor-shell
  CONTRACT.md that C.2-7 mirrors structurally for the
  heavy-block-boundary CONTRACT.md v0.5 Invariants edit.
- [C.2-2 block-foundation grid primitives](C.2-2-block-foundation-grid.md)
  — Sibling C.2 PR; squash `b15ba24`. Established
  `effectiveColWidth(colSpan, containerWidth, geometry?)` +
  `effectiveCellHeight(rowSpan, geometry?)` + `GridGeometry` +
  `DEFAULT_GRID_GEOMETRY` as the W5-1 公式 single authority that
  C.2-7 consumes.
- [C.1-1 heavy block plugin placeholder + ADR-0014 v0.4](C.1-1-heavy-block-plugin-placeholder.md)
  — Established `data-block="jupyter"` / `data-deferred="wave-4"`
  selectors + the heavy-block surface on `/sample-blocks` that the
  C.2-7 Playwright spec asserts dimension parity against.

PR.md self-listed in `## files` whitelist + this `## Related` block
per ADR-0006 D8.
