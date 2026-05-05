# C.2-1 — mdx-bridge col / row / colSpan / rowSpan serialize round-trip

> **Wave 5 Stage C.2 1st implementation PR** of the locked 12-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.0 §469-481). First grid-data-model
> consumer to land — extends `tiptapToMdx` and `mdxToTiptap` in
> `@skb/mdx-bridge` so every component-block round-trips its
> `{col, row?, colSpan, rowSpan}` attrs through MDX, per ADR-0016 D7.
> Adds W5-1 forward-pointer to `packages/mdx-bridge/CONTRACT.md` per
> ADR-0016 §502 sister-doc sync row 2 of 4 (the other 3 sister CONTRACTs
> land their forward-pointers in C.2-2 / C.2-3 / C.2-7 respectively).
> Block packages are NOT touched — grid-attr handling is centralised in
> the mdx-bridge dispatch layer so the 8 per-block `parse{Block}` /
> `serialize{Block}` functions remain block-prop-only. **PRE-COMMIT CLAUDE
> REVIEW (D1 stage 4) FIRES** per `## D2 trigger judgment` (Row 1 NEW
> CONTRACT.md section + Row 5 boundary contract change consumed by
> downstream block-foundation / apps/site / heavy-block-boundary in
> C.2-2 / C.2-3 / C.2-7).

## title

Extend `@skb/mdx-bridge` so the dispatch wrapper around every component
block reads + writes the 4 grid attrs `col` (1-12, required), `row?`
(1-based, optional, omitted = grid-auto-flow places), `colSpan`
(∈ COL_SNAPS = `[2,3,4,6,8,12]`, required), `rowSpan`
(`number | 'auto'`; `'auto'` only valid for prose/markdown blocks per
ADR-0016 D3 asymmetry; non-markdown integer ≥ 1) per ADR-0016 D7
serialize spec. The four attrs flow through Tiptap node `attrs` on each
component block (mdxComponent registered in dispatch-table); the
per-block `parse{Block}` / `serialize{Block}` functions in the 8
`@skb/block-*` packages are NOT modified — instead, mdx-bridge wraps
each dispatch call with a small `parseGridAttrs` / `serializeGridAttrs`
layer in `serialize.ts` + `parse.ts` that strips grid attrs from / adds
grid attrs to the MDX `attributes` array around the block-specific call.
This keeps grid-attr logic single-sourced (DRY across 8 blocks; no
sister-package drift risk per ADR-0006 audit item #5) and respects the
Stage C.2-1 scope-fence (no changes to block packages — those land in
C.2-2 BlockUIDefinition + grid-math.ts as the W5-1 primary authority).

Forward serialize (Tiptap → MDX) writes `col` + `colSpan` only when
the Tiptap node attrs carry the `_gridAttrsExplicit: true` marker
(set by parse on explicit-MDX input OR by editor on grid-mutate;
otherwise absent → no grid attrs emitted; preserves byte-equivalent
round-trip for pre-grid fixtures + sample MDX); `row` only when
explicit (auto-place omits); `rowSpan` only when block is non-markdown
(`gridKind !== 'prose'` / `rowSpanSemantic !== 'auto'` once those are
landed in C.2-2; until then mdx-bridge falls back on the
`mdxComponent === 'Markdown'` heuristic with an explicit TODO pointer).
Reverse parse (MDX → Tiptap) reads the same attrs + applies the
**transitional defensive-default** policy (per Risk row 3 LOCKED
decision; ADR-0016 D7 literal hard-throw is the end-state invariant
that flips at C.2-3 alongside sample-MDX + 17-fixture backfill):
missing `col` → default `1` + `console.warn`; missing `colSpan` →
default `12` + `console.warn` (single warn covers both); missing `row`
→ undefined (auto-place); missing `rowSpan` on prose-shaped block →
`'auto'` (no warn; spec semantic per D3); missing `rowSpan` on
non-prose block → `1` + `console.warn`. Markdown blocks suppress the
col/colSpan defensive warn during the transition. **Explicit invalid
values** still throw at C.2-1 (`col + colSpan - 1 > 12`, `colSpan ∉
COL_SNAPS`, `col < 1`, `rowSpan < 1` integer, explicit `rowSpan='auto'`
on non-prose) per ADR-0016 D7 safety net — this is consistent with
D7's defensive-default-+-warn pattern already specified for rowSpan
on non-markdown blocks.

NEW vitest suites: `grid-rtt.test.ts` (24+ forward-direction round-trip
fixtures: 8 block kinds × 3 attr-coverage shapes — `col+colSpan` only /
`col+row+colSpan` / `col+colSpan+rowSpan` integer; plus a markdown-block
fixture asserting `rowSpan='auto'` does NOT serialize the attr) and
`grid-defensive.test.ts` (defensive-default + explicit-invalid-throws +
`console.warn` invocation counts via `vi.spyOn`). Existing
`round-trip.test.ts` 17 fixtures × 2 invariants = 34 RTT assertions
remain PASS post-edit (defensive-default policy ensures pre-grid
fixtures continue to round-trip unchanged through both directions).
NEW `## Grid context attrs (Wave 5)` section in
`packages/mdx-bridge/CONTRACT.md` with W5-1 forward-pointer to
`packages/block-foundation/CONTRACT.md` `## Invariants` (target lands
in C.2-2; this PR's pointer references the to-be-landed anchor —
acceptable per ADR-0016 §502 sister-doc-sync row 2 explicit instruction
that each Stage C.2 PR lands its own forward-pointer in tandem with
its implementation).

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

7 canonical files at PLAN time. NO `package.json` / `pnpm-lock.yaml`
change (no new deps; uses existing `mdast` + `unified` toolchain that
already powers parse/serialize). NO new ADR file (D2 row 4 NOT hit;
ADR-0016 already authorises the serialize spec). NO change to the 8
`@skb/block-*` packages (grid-attr handling centralised in mdx-bridge;
their per-block parse/serialize functions stay block-prop-only — see
`## title` rationale). NO change to `packages/block-foundation/**`
(C.2-2 scope; primary W5-1 authority + BlockUIDefinition.gridSchema +
grid-math.ts land there). NO change to `apps/site/**` (C.2-3 scope;
Astro renderer grid layout). PR.md self-listed.

- `packages/mdx-bridge/src/serialize.ts` — **MODIFIED** (~70-100 LOC
  net delta). Add `serializeGridAttrs(node: TiptapNode, options?:
  MdxBridgeOptions): MdastJsxAttribute[]` helper that reads
  `node.attrs.col / row / colSpan / rowSpan` and emits an array of
  `mdxJsxAttribute` entries with **expression-form** values
  (`{type: 'mdxJsxAttributeValueExpression', value: '7'}` rendering as
  `col={7}` per ADR-0016 D7 example; NOT string form — string `"7"`
  would render `col="7"` and round-trip badly as a string). Wire from
  `tiptapComponentToMdast` immediately after the dispatch
  `serialize(node)` call: take the returned `MdastJsxElement`, prepend
  the grid attrs to its `attributes` array (canonical ordering: col →
  row → colSpan → rowSpan → existing block-specific attrs). Skip `row`
  when `node.attrs.row` is undefined. Skip `rowSpan` when the block is
  prose-shaped — discrimination heuristic at v0.1: `core.mdxComponent
  === 'Markdown'` (PARTIAL; flagged as forward-pointer to C.2-2's
  `proseGridDefaults.gridKind === 'prose'` discriminator, with a
  TODO-comment + an inline note in CONTRACT.md `## Grid context attrs`).
  **No changes** to existing `tiptapInlineSequence` / `tiptapToMdastBlock`
  prose paths — grid attrs apply ONLY to component blocks (those
  routed through `tiptapComponentToMdast`); prose blocks (paragraph /
  heading / list / blockquote / code / horizontalRule) emit no grid
  attrs (their grid position lives at the wrapper level, not the
  block itself; that wraps in C.2-3 Astro renderer). Whole-file post-edit:
  ≈ 350-380 LOC (was 279); under 500-LOC size-check cap.

- `packages/mdx-bridge/src/parse.ts` — **MODIFIED** (~60-90 LOC net
  delta). Add `parseGridAttrs(node: MdastJsxElement, options?:
  MdxBridgeOptions): GridAttrs` helper (return type
  `{ col: number; row?: number; colSpan: number; rowSpan: number |
  'auto' }`) that reads the 4 attrs from `node.attributes` (each
  attribute has `name` + `value`; attribute values arrive as either
  string `"7"` or expression `{type:
  'mdxJsxAttributeValueExpression', value: '7'}`). Coerce expression
  string values via `Number(...)`. Validate per ADR-0016 D7 + D6:
  - missing `col` → default `1` + `console.warn` (defensive-default
    policy per Risk row 3)
  - missing `colSpan` → default `12` + `console.warn`
  - explicit invalid `col` (NaN, < 1, > 12) → throw via shared
    `unsupportedGridAttr(name, value)` helper
  - explicit invalid `colSpan` (NaN, ∉ COL_SNAPS = `[2,3,4,6,8,12]`)
    → throw
  - explicit `col + colSpan - 1 > 12` → throw
  - missing `row` → undefined (auto-place)
  - explicit invalid `row` (NaN, < 1) → throw
  - missing `rowSpan` + prose-shaped block → `'auto'`
  - missing `rowSpan` + non-prose block → `1` + `console.warn`
  - explicit `rowSpan='auto'` + non-prose → throw (D3 asymmetry
    enforced both directions)
  - explicit invalid `rowSpan` (NaN, < 1, not 'auto') → throw
  Wire from `mdastJsxFlowElementToTiptap` after the dispatch
  `parse(node)` call: take the returned `TiptapNode`, merge the parsed
  grid attrs into `node.attrs` (canonical key order col / row /
  colSpan / rowSpan / then existing). Whole-file post-edit: ≈ 280-310
  LOC (was 207); under 500-LOC cap.

- `packages/mdx-bridge/src/dispatch-table.ts` — **POSSIBLY UNCHANGED**
  (~0-15 LOC). Verify at EXECUTE: the per-block `parse` / `serialize`
  functions registered here are block-prop-only (don't read or write
  col/row/colSpan/rowSpan); since grid attrs flow through the
  centralised wrapper in `serialize.ts` / `parse.ts`, the dispatch
  table itself does NOT need to change shape. If `JsxDispatchEntry`
  interface requires a flag distinguishing prose vs non-prose blocks
  (for the rowSpan asymmetry discriminator), add **optional**
  `rowSpanSemantic?: 'auto' | 'integer'` field with default `'integer'`
  (mirrors the field that lands on `BlockUIDefinition` in C.2-2; placed
  on the dispatch entry as a forward-compat mirror for v0.1 — NOT a
  cross-package cut; see Risk row 4). If unneeded (mdxComponent ===
  'Markdown' heuristic suffices at v0.1), keep file unchanged. Whole-file
  post-edit: ≤ 50 LOC (was 26); under cap regardless.

- `packages/mdx-bridge/src/__tests__/grid-rtt.test.ts` — **NEW**
  (~150-220 LOC). Round-trip vitest covering the forward + reverse
  + idempotence of grid attrs across all 8 component-block kinds
  (Callout / Code / Image / Math / Pdf / Jupyter / NnViz / AgentFlow).
  Mirror the pattern of existing `round-trip.test.ts` (re-use
  `BlockRegistry` + 8 `@skb/block-*/core` imports + dispatch
  registration helpers). Per kind run 3 attr-shape fixtures:
  1. **`col + colSpan` only** (auto-place row + integer rowSpan=1
     defensive default emits `rowSpan={1}` for non-prose):
     `<Callout col={1} colSpan={12} rowSpan={1} variant="note"
     title="…">…</Callout>`. Forward → reverse → forward MUST produce
     byte-equivalent MDX.
  2. **`col + row + colSpan`**: `<Code col={7} row={3} colSpan={6}
     rowSpan={4} lang="python">…</Code>`. Same byte-equivalence.
  3. **`col + colSpan + rowSpan` integer**: `<Image col={7} colSpan={6}
     rowSpan={3} src="…" alt="…" />`. Same.
  Plus 1 markdown-prose fixture asserting `rowSpan` is **NOT** emitted
  on serialize (D3 asymmetry serialize side) and is parsed back as
  `rowSpan='auto'` on reverse:
  `<Markdown col={1} colSpan={6}>Some content here.</Markdown>` (the
  test scaffolds a fake `Markdown` mdxComponent registration since the
  prose path doesn't currently serialize through the JSX dispatch —
  this lets us assert the asymmetry policy in isolation; production
  prose blocks remain handled by `tiptapToMdastBlock` paragraph /
  heading / list paths). Total ≈ 25 fixtures (8 × 3 + 1 = 25);
  invariant-1 (parsed-doc) + invariant-2 (`stripMdast` editor-built-doc)
  on each = 50 RTT assertions in this file alone.

- `packages/mdx-bridge/src/__tests__/grid-defensive.test.ts` —
  **NEW** (~150-200 LOC). Defensive-default + explicit-invalid-throws
  test suite. Each `it()` re-creates a `BlockRegistry` + a single
  block kind's dispatch (use `Callout` for non-prose, scaffold
  `Markdown` mock for prose) and exercises one defensive branch:
  1. `mdxToTiptap('<Callout variant="note">…</Callout>')` → parses
     successfully; `node.attrs.col === 1`, `colSpan === 12`,
     `rowSpan === 1`; `console.warn` was called ≥ 1 time.
     Implementation: `const warnSpy = vi.spyOn(console, 'warn');
     warnSpy.mockImplementation(() => {});` at suite start; assert
     `warnSpy.mock.calls.length >= 1` + a `warnSpy.mock.calls[i][0]`
     contains the literal substring `mdx-bridge: grid attr default`
     (canonical message prefix).
  2. `mdxToTiptap` of an MDX source containing a bare `Markdown`
     mdxComponent (no grid attrs) → `rowSpan === 'auto'` (no warn for
     prose-rowSpan-default; only for col/colSpan).
  3. `mdxToTiptap('<Callout col={5} colSpan={4} variant="note">…</Callout>')`
     → throws (explicit `col + colSpan - 1 = 8 > 12` is fine — wait,
     `5 + 4 - 1 = 8 ≤ 12` is OK; use `col={9} colSpan={6}` instead:
     `9 + 6 - 1 = 14 > 12` → throws; reviewer verifies arithmetic in
     test).
  4. `mdxToTiptap('<Callout col={1} colSpan={5} variant="note">…</Callout>')`
     → throws (`5 ∉ COL_SNAPS = [2,3,4,6,8,12]`; the test message
     references both `5` and `COL_SNAPS` for grep-friendliness).
  5. `mdxToTiptap('<Callout col={0} colSpan={12} variant="note">…</Callout>')`
     → throws (`col < 1`).
  6. `mdxToTiptap('<Callout col={13} colSpan={12} variant="note">…</Callout>')`
     → throws (`col > 12`).
  7. `mdxToTiptap('<Callout col={1} colSpan={12} rowSpan="auto" variant="note">…</Callout>')`
     → throws (explicit `rowSpan='auto'` on non-prose block;
     D3 asymmetry parse-side enforcement).
  8. `mdxToTiptap('<Callout col={1} colSpan={12} rowSpan={0} variant="note">…</Callout>')`
     → throws (`rowSpan < 1`).
  9. Round-trip: `tiptapToMdx` of a node with `attrs.rowSpan='auto'`
     and `core.mdxComponent !== 'Markdown'` → throws (D3 asymmetry
     serialize-side enforcement; symmetric to test #7).
  10. Round-trip via `tiptapToMdx` of a node with no `attrs.col`
      (constructed by editor without grid context) → emits MDX with
      `col={1} colSpan={12} rowSpan={1}` (auto-default on serialize
      side too, parallel to parse side; ensures editor-built docs
      that haven't been grid-aware-mutated still serialize cleanly).
  11. **Backward-compat fixture replay**: parse + re-serialize each
      of the 17 existing fixtures in
      `__tests__/fixtures/*.mdx` and assert byte-equivalence
      (defensive default applied to the 8 component-block fixtures
      22-29 since they have NO grid attrs; this test specifically
      validates the architectural decision in Risk row 3 holds for
      the existing corpus before EXECUTE merges).

- `packages/mdx-bridge/CONTRACT.md` — **MODIFIED** (~60-90 LOC net
  delta; one NEW section + one cross-reference + one transitional-
  implementation note). Insert a NEW `## Grid context attrs (Wave 5)`
  section after the existing `## Component block dispatch` section
  and before `## Canonicalization rules`. Section content:
  - **W5-1 forward-pointer paragraph** (per ADR-0016 §502 sister-doc
    sync row 2): "Component blocks carry grid context attrs `{col,
    row?, colSpan, rowSpan}` per ADR-0016 D2. The grid-context
    invariant W5-1 is the authoritative source — see
    [packages/block-foundation/CONTRACT.md](../../../packages/block-foundation/CONTRACT.md)
    `## Invariants` (W5-1 lands there in Wave 5 Stage C.2-2). The
    bidirectional MDX serialize spec for these attrs is below."
  - **Serialize spec subsection**: paraphrase ADR-0016 D7 with the
    three concrete MDX examples (Canvas / Code / Image) in fenced
    `mdx` code blocks (per memory `feedback_lychee_autolink_in_backticks`,
    fenced blocks bypass lychee autolink scan; do NOT inline
    `<Component prop={x} />` inside backticks).
  - **Parse spec subsection**: missing-attr defensive defaults (col=1
    / colSpan=12 / rowSpan=1 for non-prose with `console.warn` /
    rowSpan='auto' for prose); explicit-invalid throws; reference to
    COL_SNAPS = `[2,3,4,6,8,12]` (per D6).
  - **Transitional implementation note** (2-3 lines; per Risk row 3
    LOCKED decision): "**Stage C.2 transition (C.2-1 → C.2-3)**:
    `parseGridAttrs` defensively defaults missing col/colSpan to
    `col=1 colSpan=12` with `console.warn`, mirroring D7's already-
    specified rowSpan defensive-default-+-warn pattern for non-markdown
    blocks. `serializeGridAttrs` tracks an internal
    `_gridAttrsExplicit` marker on Tiptap node attrs and emits grid
    attrs only when the marker is true (preserves byte-equivalent
    round-trip for pre-grid fixtures + sample MDX). C.2-3 ships
    sample-MDX + 17-fixture grid-attrs backfill and removes the
    defensive branches, restoring ADR-0016 D7's literal throws as
    the end-state invariant. Forward-pointer to ADR-0016 D7
    (end-state invariant) + W5-1 sister-doc reference at
    [block-foundation/CONTRACT.md](../../../packages/block-foundation/CONTRACT.md)
    (lands at C.2-2)."
  - **D3 asymmetry subsection**: prose-shaped blocks (mdxComponent
    `Markdown` at v0.1; will widen to `gridKind === 'prose'` /
    `rowSpanSemantic === 'auto'` once `BlockUIDefinition` ships those
    fields in C.2-2 — explicit forward-pointer with TODO). Markdown
    blocks suppress the col/colSpan defensive warn during the C.2-1
    → C.2-3 transition (per Risk row 3 LOCKED decision; matches the
    "prose path is grid-attr-optional in transition" reading of D11
    "Tiptap inside / grid outside 分层").
  - **`gridKind` forward-pointer paragraph**: 1-2 sentences flagging
    that the rowSpan asymmetry discriminator at v0.1 uses
    `mdxComponent === 'Markdown'` heuristic; C.2-2 lands the
    `proseGridDefaults` + `BlockUIDefinition.rowSpanSemantic` /
    `gridKind` fields and this serialize/parse path will switch to
    the schema-based discriminator. **Strictly forward-pointer**: no
    block-foundation type imports added in this PR.
  Update the existing `## Round-trip invariant` section by appending
  a **single sentence** at the end: "Grid context attrs (Wave 5; see
  `## Grid context attrs (Wave 5)` below) round-trip through the same
  invariants 1 + 2 — the parse/serialize pair preserves them
  byte-equivalently for any fixture that names them explicitly, and
  during the C.2-1 → C.2-3 transition defensively defaults missing
  attrs on parse with `console.warn` while emitting nothing on
  serialize (per `_gridAttrsExplicit` marker) so existing pre-grid
  fixtures round-trip cleanly until C.2-3 backfills them."
  Whole-file post-edit: ≈ 280-320 LOC (was ≈ 213); under 500-LOC cap.

- `docs/plans/wave-5-main/C.2-1-mdx-bridge-grid-serialize.md` —
  **THIS PR.md** (self-listed). LOC budget ≤ 800 (Wave 5 R23 leaner
  PR.md target 600-750 LOC; this draft ≈ 720).

**LOC tally** (rough):
- `serialize.ts`: ~70-100 LOC delta
- `parse.ts`: ~60-90 LOC delta
- `dispatch-table.ts`: ~0-15 LOC delta
- `grid-rtt.test.ts` NEW: ~150-220 LOC
- `grid-defensive.test.ts` NEW: ~150-200 LOC
- `CONTRACT.md`: ~50-80 LOC delta
- PR.md (this file): ~990 LOC (doc-class; not counted against impl
  budget per Wave 4+5 R23 LOC discipline; over the 800-LOC C.1-1
  ceiling because the architectural-decision content in Risk row 3
  is load-bearing for orchestrator's stage-1 review and cannot be
  trimmed without losing substance)
- **Implementation total**: ~480-700 LOC delta. Within Wave 5 plan
  v1.0 row C.2-1 ~300 LOC stated budget if defensive tests are kept
  tight; over-budget if all 25 forward fixtures + 11 defensive cases
  are written verbosely. Reviewer should flag if delta exceeds 500
  LOC for any single file (size-check 500-LOC hard cap per file).
  Mitigation: extract shared fixture-construction helpers in the
  test files; the 25 forward fixtures share most setup boilerplate.

## test_cases

TDD-front per Wave 5 plan v1.0 + ADR-0011 D2 schema. RED → GREEN: write
both NEW vitest files first (helpers `parseGridAttrs` / `serializeGridAttrs`
don't exist → RED), implement helpers until GREEN, then verify existing
`round-trip.test.ts` (17 fixtures × 2 invariants) still PASS unchanged
(defensive-default + symmetric-absence mode flag enforces this; see Risk
row 3). All test cases live in `packages/mdx-bridge/src/__tests__/`.

### Forward serialize (Tiptap → MDX) — `grid-rtt.test.ts`

- **TC1 — Callout col + colSpan only** (non-prose; rowSpan=1 emitted):
  attrs `{col: 1, colSpan: 12, rowSpan: 1, variant: 'note', title:
  'Heads up'}` → MDX contains `col={1} colSpan={12} rowSpan={1}
  variant="note" title="Heads up"` in canonical attr order (grid attrs
  first, then block-specific). Round-trip byte-equivalent.
- **TC2 — Code col + row + colSpan + rowSpan integer**: attrs
  `{col: 7, row: 3, colSpan: 6, rowSpan: 4, lang: 'python'}` → emits
  `col={7} row={3} colSpan={6} rowSpan={4} lang="python"`. Reverse
  parse re-creates identical attrs.
- **TC3 — Image col + colSpan + rowSpan integer (auto-place row
  omitted)**: attrs `{col: 7, colSpan: 6, rowSpan: 3, src: 'cat.png',
  alt: 'A cat'}` (no `row`) → MDX has NO `row` attr. Reverse parse
  yields `row: undefined`.
- **TC4 — Markdown rowSpan='auto' NOT serialised** (D3 asymmetry
  serialize side): register fake `Markdown` mdxComponent; attrs `{col:
  1, colSpan: 6, rowSpan: 'auto'}` + paragraph child → MDX has NO
  `rowSpan` attr. Reverse parse yields `rowSpan === 'auto'`.
- **TC5 — All 8 block kinds round-trip with explicit grid attrs**: one
  fixture per kind (Callout / Code / Image / Math / Pdf / Jupyter /
  NnViz / AgentFlow), each with attrs varying col / colSpan / rowSpan
  such that `col + colSpan - 1 ≤ 12` and `colSpan ∈ COL_SNAPS`;
  invariant-1 (`parse(serialize(input)) === input`) + invariant-2
  (`stripMdast` editor-built-doc equivalence) PASS.
- **TC6 — Idempotence**: `tiptapToMdx(mdxToTiptap(tiptapToMdx(doc)))`
  byte-equivalent to `tiptapToMdx(doc)` for any TC1-TC5 fixture
  (forward-reverse-forward chain stable).

### Reverse parse defensive + invalid — `grid-defensive.test.ts`

All cases use `vi.spyOn(console, 'warn').mockImplementation(() => {})`
at suite start + `mockRestore()` afterEach.

- **TC7 — Defensive default: missing col + colSpan** (Callout with no
  grid attrs): `attrs.col === 1`, `attrs.colSpan === 12`,
  `attrs.rowSpan === 1`; `console.warn` called ≥ 1 time with message
  containing the literal `mdx-bridge: grid attr default` (canonical
  prefix; greppable).
- **TC8 — Defensive default: prose rowSpan='auto'** (bare Markdown
  fixture, no grid attrs): `attrs.rowSpan === 'auto'`; **no warn** for
  rowSpan-prose-default (warn fires for col/colSpan only; prose
  rowSpan='auto' is the spec semantic not a defensive fallback).
- **TC9 — Explicit invalid: col + colSpan - 1 > 12** (`col={9}
  colSpan={6}` → 14 > 12): throws with message containing
  `col + colSpan - 1` and `≤ 12`.
- **TC10 — Explicit invalid: colSpan ∉ COL_SNAPS** (`colSpan={5}`):
  throws with message containing `COL_SNAPS` and literal `5`.
- **TC11 — Explicit invalid: col out of [1, 12]** (sub-cases `col={0}`
  and `col={13}`): both throw with message containing `col` and
  `1 ≤ col ≤ 12`.
- **TC12 — Explicit invalid: rowSpan='auto' on non-prose block**
  (Callout with `rowSpan="auto"`): throws with message containing
  `rowSpan='auto'` and `non-prose` (or `D3 asymmetry`).
- **TC13 — Explicit invalid: rowSpan < 1 integer** (`rowSpan={0}`):
  throws with message containing `rowSpan` and `≥ 1`.
- **TC14 — Symmetric serialize: rowSpan='auto' on non-prose throws on
  serialize** (D3 asymmetry serialize side, mirror of TC12): node with
  `core.mdxComponent !== 'Markdown'` + `attrs.rowSpan === 'auto'` →
  `tiptapToMdx` throws.
- **TC15 — Editor-built doc with no grid attrs serialises cleanly**:
  Tiptap node constructed with no `attrs.col` / `colSpan` / `rowSpan`
  (simulates editor mutation pre-grid-aware) → `tiptapToMdx` emits
  MDX **without** grid attrs (per defensive-default + symmetric-absence
  mode flag, Risk row 3) — preserves absence on serialize when attrs
  were absent on parse OR were never set explicitly.

### Existing corpus regression

- **TC16 — Existing 17 fixtures × 2 invariants still PASS**:
  `pnpm --filter @skb/mdx-bridge test -- round-trip.test.ts` → all 34
  RTT assertions PASS unchanged. Defensive-default + symmetric-absence
  mode flag ensures the 8 component-block fixtures (22-callout through
  29-agent-flow), which have no grid attrs in MDX source, continue to
  round-trip byte-equivalently with no grid attrs in their re-serialized
  output. (Defaulted attrs live in in-memory Tiptap state only;
  serialize side checks the `_gridAttrsExplicit` marker per Risk row 3
  and emits grid attrs only when the marker is true.)
- **TC17 — Existing `jsx-routing.test.ts` still PASS**: all assertions
  unchanged (jsx-routing tests don't exercise grid attrs;
  defensive-default + symmetric-absence keeps grid-attr-absent MDX
  round-tripping cleanly).

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — **MODIFIED**. NEW section
  `## Grid context attrs (Wave 5)` with W5-1 forward-pointer + serialize
  spec + parse spec + D3 asymmetry subsection + `gridKind`
  forward-pointer paragraph. Existing `## Round-trip invariant`
  section gains a single trailing sentence describing the grid-attr
  round-trip extension. **D2 row 1 trigger fires.**
- `packages/block-foundation/CONTRACT.md` — **NOT touched**. C.2-2
  scope; primary W5-1 authority + BlockUIDefinition.gridSchema +
  grid-math.ts. This PR only forward-points to the section that
  C.2-2 will land. Acceptable per ADR-0016 §502 sister-doc-sync row
  2 explicit instruction (each Stage C.2 PR lands its own
  forward-pointer in tandem with its implementation; receiver section
  in block-foundation lands C.2-2).
- `apps/site/CONTRACT.md` — **NOT touched**. C.2-3 scope (Astro
  renderer grid layout + sample MDX grid attrs population).
- `packages/heavy-block-boundary/CONTRACT.md` — **NOT touched**.
  C.2-7 scope (ADR-0014 v0.5 amendment).
- `packages/editor-shell/CONTRACT.md` — **NOT touched**. C.2-4 / C.2-5
  / C.2-6 / C.2-8 / C.2-9 scope.
- 8 `@skb/block-*/CONTRACT.md` (if files exist per block) — **NOT
  touched**. Per `## title` rationale, grid-attr handling is
  centralised in mdx-bridge dispatch wrapper; per-block CONTRACT
  surfaces stay block-prop-only.

**D2 row 5 cross-package boundary judgment**: even though only
`packages/mdx-bridge/**` files are edited, the **boundary contract**
between mdx-bridge ↔ block-foundation (W5-1 invariant landing site)
↔ apps/site (Astro renderer consumes the grid attrs) is changing —
mdx-bridge is the first to declare the serialize boundary. Row 5 is
substantive; acknowledged in `## D2 trigger judgment`.

## adr_touched

- **NONE**. ADR-0016 D7 (MDX serialize spec) + D9 (W5-1 invariant
  pointer) + §502 (sister-doc-sync) authorise this PR's full scope;
  no Status line change; no new ADR amendment; no NEW ADR file. The
  PR's CONTRACT.md addition is the implementation of ADR-0016 §502
  row 2 of 4 (mdx-bridge slot), not an ADR amendment. ADR-0014 v0.5
  amendment (C.2-7 scope) is forward-pointed in CONTRACT.md but not
  amended here. ADR-0017 / ADR-0018 untouched (drag/drop UX + v2
  visual migration; Stage C.2-10/11/12 + Stage C.3 scope).

## acceptance

Verifiable per AC# below; reviewer (stage 3) + orchestrator stage 4
PRE-COMMIT CLAUDE REVIEW + pr-writer ACCEPT (stage 6) re-execute these.

- **AC#1 — grid attr handling present in serialize.ts + parse.ts**:
  - `grep -nE 'col|colSpan|rowSpan' packages/mdx-bridge/src/serialize.ts | wc -l`
    → ≥ 5 matches (token presence; reviewer eyeballs the new helper).
  - `grep -nE 'col|colSpan|rowSpan' packages/mdx-bridge/src/parse.ts | wc -l`
    → ≥ 5 matches.
  - `grep -F 'parseGridAttrs' packages/mdx-bridge/src/parse.ts` → matches.
  - `grep -F 'serializeGridAttrs' packages/mdx-bridge/src/serialize.ts`
    → matches.

- **AC#2 — full mdx-bridge vitest suite PASS**:
  - `pnpm --filter @skb/mdx-bridge test` → all PASS, including:
    - existing `round-trip.test.ts` (17 fixtures × 2 invariants = 34)
    - existing `jsx-routing.test.ts`
    - NEW `grid-rtt.test.ts` (≥ 25 fixtures × 2 invariants = ≥ 50
      assertions, plus a few standalone forward-only assertions for
      TC4 markdown asymmetry and TC15 idempotence)
    - NEW `grid-defensive.test.ts` (≥ 11 cases per `## test_cases`
      TC6-TC12 + the 4 internal explicit-invalid sub-cases listed
      under TC10/TC11/TC12 per-bound)
  - Reviewer reads vitest output and asserts all suites green.

- **AC#3 — NEW `## Grid context attrs (Wave 5)` section landed**:
  - `grep -E '^## Grid context attrs' packages/mdx-bridge/CONTRACT.md`
    → matches.

- **AC#4 — W5-1 forward-pointer present in mdx-bridge CONTRACT.md**:
  - `grep -F 'W5-1' packages/mdx-bridge/CONTRACT.md` → matches at
    least once (in the new section).

- **AC#5 — forward-pointer target cited (block-foundation/CONTRACT.md)**:
  - `grep -F 'block-foundation/CONTRACT.md' packages/mdx-bridge/CONTRACT.md`
    → matches at least once in the new section.

- **AC#6 — COL_SNAPS constraint enumerated explicitly**:
  - `grep -F 'COL_SNAPS' packages/mdx-bridge/CONTRACT.md` → matches.
  - `grep -F '[2,3,4,6,8,12]' packages/mdx-bridge/CONTRACT.md` →
    matches (literal tuple shown in prose; per ADR-0016 D6).

- **AC#7 — defensive-default `console.warn` assertion shape (pinned
  literal messages)**: per Risk row 3 transitional implementation,
  `parseGridAttrs` emits two distinct canonical warn messages — TC7
  asserts the col/colSpan one; TC8 asserts the rowSpan-non-prose
  one. Exact assertion shape:
  ```ts
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  // ... mdxToTiptap(...) call ...
  expect(warnSpy).toHaveBeenCalled();
  expect(warnSpy.mock.calls[0]?.[0]).toContain(
    'mdx-bridge: grid attrs missing on block',
  );
  expect(warnSpy.mock.calls[0]?.[0]).toContain(
    'defaulted to col=1 colSpan=12',
  );
  expect(warnSpy.mock.calls[0]?.[0]).toContain(
    'ADR-0016 D7 hard-throw lands at C.2-3',
  );
  warnSpy.mockRestore();
  ```
  Two pinned literal messages emitted by `parseGridAttrs` (the literal
  `{type}` substitutes the Tiptap node type at runtime; placeholder
  shown in curly braces here per memory `feedback_lychee_autolink_in_backticks`
  to avoid lychee autolink mis-parse — actual emitted message uses
  the resolved type string):
  1. col/colSpan defensive: `mdx-bridge: grid attrs missing on
     block {type}; defaulted to col=1 colSpan=12. ADR-0016 D7
     hard-throw lands at C.2-3.` (single warn covering both attrs).
  2. rowSpan-non-prose defensive: `mdx-bridge: grid attr default
     rowSpan=1 on non-prose block {type}; explicit value recommended
     per ADR-0016 D3+D7.`
  Reviewer greps:
  - `grep -nE "vi\\.spyOn\\(console, 'warn'\\)" packages/mdx-bridge/src/__tests__/grid-defensive.test.ts`
    → ≥ 1 match.
  - `grep -F 'mdx-bridge: grid attrs missing on block' packages/mdx-bridge/src/__tests__/grid-defensive.test.ts`
    → matches (TC7 pinned).
  - `grep -F 'mdx-bridge: grid attr default rowSpan=1 on non-prose block' packages/mdx-bridge/src/__tests__/grid-defensive.test.ts`
    → matches (TC8 pinned).
  - `grep -F 'ADR-0016 D7 hard-throw lands at C.2-3' packages/mdx-bridge/src/__tests__/grid-defensive.test.ts`
    → matches (warn message embeds the C.2-3 forward-pointer; this
    surfaces in production logs too, signposting the transitional
    nature for any developer who hits the warn).
  - `grep -F 'mdx-bridge: grid attrs missing on block' packages/mdx-bridge/src/parse.ts`
    → matches (warn message lands in source).
  - `grep -F 'mdx-bridge: grid attr default rowSpan=1' packages/mdx-bridge/src/parse.ts`
    → matches.

- **AC#8 — `pnpm check:affected` PASS**:
  - `pnpm check:affected` → PASS across affected packages
    (`@skb/mdx-bridge` directly; block packages NOT affected per
    `## files`; `apps/site` NOT affected — sample MDX content
    edits are C.2-3 scope).

- **AC#9 — Round-trip 17 fixtures × 2 invariants preserved**:
  - `pnpm --filter @skb/mdx-bridge test -- round-trip.test.ts`
    → PASS unchanged. The transitional defensive-default + symmetric-
    absence mode (per Risk row 3 LOCKED implementation;
    `_gridAttrsExplicit` marker false on pre-grid fixtures means
    serialize emits no grid attrs) ensures grid-attr-absent fixtures
    continue to round-trip byte-equivalently. The `_gridAttrsExplicit`
    marker is excluded from the `stripMdast` invariant-2 baseline
    (it's a `_`-prefixed internal field same family as `_mdast`).

- **AC#10 — Lychee link-check pre-empt clean** (CI canonical;
  lychee binary often missing in local dev sandboxes — parallels
  WSL2 chromium pattern per memory `feedback_wsl2_chromium_launch`;
  local `pnpm link-check` exit 1 with `sh: 1: lychee: not found`
  is environmental, NOT a content failure):
  - CI canonical (`pnpm link-check` job runs the canonical lychee
    sweep on push; this AC is canonical against the CI workflow run,
    not a local invocation).
  - Pre-flight orchestrator-self prose-walk per memory
    `feedback_lychee_autolink_in_backticks`:
    `grep -nE '\`[^\`]*<\w+>[^\`]*\`' docs/plans/wave-5-main/C.2-1-mdx-bridge-grid-serialize.md`
    → zero matches (mandatory).
    `grep -nE '\`[^\`]*<\w+>[^\`]*\`' packages/mdx-bridge/CONTRACT.md`
    → zero matches.
  - Per memory `feedback_lychee_line_anchor`: no `:line` suffix on
    relative file links in either file.
  - Per memory `feedback_lychee_npmjs_403`: no `npmjs.com/package/...`
    URLs (none expected; mdx-bridge only references `@skb/...`
    workspace packages and ADR docs).
  - Per memory `feedback_lychee_user_local_paths`: no `~/.claude/...`
    or `/mnt/...` paths in markdown link form (prose + tilde-path
    inside backticks only if needed — none expected here).

- **AC#11 — `pnpm size-check` PASS**:
  - `pnpm size-check` → PASS. Post-edit file LOCs:
    - `packages/mdx-bridge/src/serialize.ts` ≈ 350-380 (was 279) <
      500 cap.
    - `packages/mdx-bridge/src/parse.ts` ≈ 280-310 (was 207) < 500.
    - NEW `grid-rtt.test.ts` ≈ 150-220 < 500.
    - NEW `grid-defensive.test.ts` ≈ 150-200 < 500.
    - `packages/mdx-bridge/CONTRACT.md` ≈ 270-300 (markdown is
      exempt from size-check per `scripts/check-size-limits.mjs`
      EXTENSIONS regex).

- **AC#12 — D2 trigger judgment acknowledged**:
  - `## D2 trigger judgment` table identifies Row 1 (CONTRACT.md
    NEW section) + Row 5 (cross-boundary contract change consumed
    by C.2-2 / C.2-3 / C.2-7) HIT. Verdict: **Stage 4 PRE-COMMIT
    CLAUDE REVIEW REQUIRED**. Stage 3 codex-pr-reviewer-55 still
    runs first per D1 stage 3 mandatory.

- **AC#13 — R14 self-check 7/7 PASS**: see `## R14 self-check`
  section.

## verification required

Per Wave 5 plan v1.0 §192-225 verification block + ADR-0011 D2 schema.
Reviewer (stage 3) + orchestrator stage 4 PRE-COMMIT CLAUDE REVIEW +
pr-writer ACCEPT (stage 6) all run these.

| Stage | Step | Command | Expected |
|---|---|---|---|
| 3 / 4 / 6 | File existence | `ls packages/mdx-bridge/src/serialize.ts packages/mdx-bridge/src/parse.ts packages/mdx-bridge/src/__tests__/grid-rtt.test.ts packages/mdx-bridge/src/__tests__/grid-defensive.test.ts packages/mdx-bridge/CONTRACT.md` | 5 paths exist |
| 3 / 4 / 6 | Helper present in serialize.ts | `grep -F 'serializeGridAttrs' packages/mdx-bridge/src/serialize.ts` | matches |
| 3 / 4 / 6 | Helper present in parse.ts | `grep -F 'parseGridAttrs' packages/mdx-bridge/src/parse.ts` | matches |
| 3 / 4 / 6 | Grid attr coverage tokens | `grep -cE 'col\|colSpan\|rowSpan' packages/mdx-bridge/src/{serialize,parse}.ts` | ≥ 10 each |
| 3 / 4 / 6 | NEW CONTRACT.md section | `grep -E '^## Grid context attrs' packages/mdx-bridge/CONTRACT.md` | matches |
| 3 / 4 / 6 | W5-1 pointer | `grep -F 'W5-1' packages/mdx-bridge/CONTRACT.md` | matches |
| 3 / 4 / 6 | block-foundation pointer | `grep -F 'block-foundation/CONTRACT.md' packages/mdx-bridge/CONTRACT.md` | matches |
| 3 / 4 / 6 | COL_SNAPS in CONTRACT | `grep -F 'COL_SNAPS' packages/mdx-bridge/CONTRACT.md` | matches |
| 3 / 4 / 6 | Defensive console.warn assertion | `grep -nE "vi\\.spyOn\\(console, 'warn'\\)" packages/mdx-bridge/src/__tests__/grid-defensive.test.ts` | ≥ 1 |
| 3 / 4 / 6 | Defensive warn message literal | `grep -F 'mdx-bridge: grid attr default' packages/mdx-bridge/src/__tests__/grid-defensive.test.ts` | matches |
| 3 / 4 / 6 | mdx-bridge vitest | `pnpm --filter @skb/mdx-bridge test` | all suites PASS |
| 3 / 4 / 6 | round-trip 17 fixtures preserved | `pnpm --filter @skb/mdx-bridge test -- round-trip.test.ts` | all PASS |
| 3 / 4 / 6 | check:affected | `pnpm check:affected` | PASS |
| 3 / 4 / 6 | size-check | `pnpm size-check` | PASS |
| 3 / 4 / 6 | Lychee pre-empt (autolink-in-backticks) | `grep -nE '\\`[^\\`]*<\\w+>[^\\`]*\\`' docs/plans/wave-5-main/C.2-1-mdx-bridge-grid-serialize.md packages/mdx-bridge/CONTRACT.md` | zero matches |
| 3 / 4 / 6 | Lychee link-check (CI canonical) | `pnpm link-check` (CI) | PASS |
| 6 (ACCEPT) | LOC budget | `git diff --stat main -- packages/mdx-bridge/src docs/plans/wave-5-main/C.2-1-mdx-bridge-grid-serialize.md packages/mdx-bridge/CONTRACT.md \| tail -1` | implementation diff ≤ 500 changed lines per file |
| 6 (ACCEPT) | block packages untouched | `git diff main -- packages/block-callout packages/block-code packages/block-image packages/block-math packages/block-pdf packages/block-jupyter packages/block-nn-viz packages/block-agent-flow packages/block-foundation \| wc -l` | `0` |
| 6 (ACCEPT) | apps/site untouched | `git diff main -- apps/site \| wc -l` | `0` |
| 6 (ACCEPT) | heavy-block-boundary untouched | `git diff main -- packages/heavy-block-boundary \| wc -l` | `0` |
| 6 (ACCEPT) | editor-shell untouched | `git diff main -- packages/editor-shell \| wc -l` | `0` |
| 6 (ACCEPT) | design-tokens untouched | `git diff main -- packages/design-tokens \| wc -l` | `0` |

## Plan-challenger absorbtion

**NOT applicable.** C.2-1 is an implementation PR (NOT a Pre-A
ADR-class lock). Per ADR-0007 D5 + ADR-0011 D2 + Wave 5 plan v1.0 D7,
plan-challenger codex round is mandatory at Pre-A ADR-class locks
only. Implementation PRs rely on Stage 3 codex-pr-reviewer-55
(line-level + spec-match + ADR-0006 8-point checklist) + Stage 4
PRE-COMMIT CLAUDE REVIEW (orchestrator-self) since D2 row 1 + row 5
fire.

The serialize spec (ADR-0016 D7) was 11/12 ABSORBED + 1 PARTIALLY
ABSORBED in Pre-A2 plan-challenger 4-round (`docs/decisions/ADR-0016-grid-data-model.md`
`## Plan-challenger codex absorbtion`), so the design surface this
PR implements is fully gatekeeper-locked. No NEW design surface.

## R14 self-check

Per Wave 5 plan v1.0 D4 + Pre-A1 R14 self-check precedent.

1. **Stage C.2 scope-fence whitelist** (Wave 5 plan v1.0 §469 row
   C.2-1): all touched files (`packages/mdx-bridge/src/{serialize,
   parse,dispatch-table}.ts` + 2 NEW vitest under
   `packages/mdx-bridge/src/__tests__/` + `packages/mdx-bridge/CONTRACT.md`
   + 1 PR.md) are within row C.2-1 explicit scope. **PASS**.
2. **Stage C.2 scope-fence blacklist**: NO files under
   `packages/block-foundation/**` (C.2-2 scope), `packages/heavy-block-boundary/**`
   (C.2-7 scope), `packages/editor-shell/**` (C.2-4..6/8/9 scope),
   `apps/site/**` (C.2-3 scope), `packages/design-tokens/**`
   (Stage C.3 scope), `packages/block-{callout,code,image,math,pdf,
   jupyter,nn-viz,agent-flow}/**` (block packages own NO grid-attr
   logic per `## title` architectural rationale). NO
   `pnpm-lock.yaml`. NO new package. NO new ADR file. **PASS**.
3. **D2 trigger Row 1 + Row 5 acknowledged**: NEW CONTRACT.md
   section (Row 1) + cross-boundary contract change consumed
   downstream (Row 5; mdx-bridge ↔ block-foundation ↔ apps/site
   ↔ heavy-block-boundary). Stage 4 PRE-COMMIT CLAUDE REVIEW
   REQUIRED. **PASS**.
4. **LOC budget + scope-refinement classification**: implementation
   diff target stays ~300 LOC per Wave 5 plan v1.0 row C.2-1 budget
   (impl delta ~130-205 LOC well within; tests ~300-420 LOC are
   inherently larger but are NEW test files not subject to row LOC
   budget). Per-file 500-LOC size-check hard cap honoured (post-edit
   `serialize.ts` ≈ 350-380, `parse.ts` ≈ 280-310, NEW test files
   ≤ 300 each; reviewer flags if `grid-rtt.test.ts` approaches 500
   and splits into `grid-rtt.test.ts` + `grid-rtt-reverse.test.ts`
   at EXECUTE-time). PR.md 1000 LOC accepted by orchestrator
   (load-bearing architectural-decision content for Stage 4
   PRE-COMMIT CLAUDE REVIEW; NO trim required). The Risk row 3
   transitional implementation (defensive defaults during C.2-1 →
   C.2-3, hard-throw flip at C.2-3) is **scope refinement** per
   Wave 5 plan v1.0 D4 thresholds — single-package implementation
   detail; doesn't widen Stage C.2 PR count (still 12 PRs C.2-1 →
   C.2-12); doesn't shift success criteria (ADR-0016 D7 end-state
   invariant unchanged); doesn't add NEW high-risk module. NOT a
   reframe. **PASS**.
5. **No new package; no cross-package boundary CHANGE in this PR's
   files**: the boundary contract IS changing (grid attrs now
   round-trip through MDX), but the implementation files are
   contained in `@skb/mdx-bridge`. Downstream consumers
   (block-foundation / apps/site / heavy-block-boundary) implement
   their side of the boundary in C.2-2 / C.2-3 / C.2-7. **PASS**.
6. **Already-absorbed design**: ADR-0016 D2 + D3 + D6 + D7 + D9 +
   §502 sister-doc-sync row 2 fully authorise this PR's
   serialize/parse spec + CONTRACT.md addition. ADR-0016 §502 row 2
   is the explicit instruction for "mdx-bridge ships its W5-1
   forward-pointer in this PR". No NEW design surface;
   plan-challenger NOT required. **PASS**.
7. **Memory-applied**: lychee 4 pitfalls (autolink-in-backticks,
   line-anchor, npmjs-403, user-local-paths); codex audit-log
   recursion (audit log path + watchdog); git-operator explicit-stage
   (commit staging); WSL2 chromium (CI canonical for any visual
   verification — none in this PR; mdx-bridge has no playwright
   surface); Wave 3 auto-merge (orchestrator merges post ACCEPT-PASS
   + all CI green). **PASS**.

R14 self-check: 7/7 PASS. Risk row 3 architectural decision LOCKED
by orchestrator (transitional defensive defaults at C.2-1; hard-throw
flip + 17-fixture + sample-MDX backfill at C.2-3). No re-litigation
required; proceed to EXECUTE.

## D2 trigger judgment

Per ADR-0007 D2 + ADR-0011 D2 row table.

| Row | Description | Hit? | Evidence |
|---|---|---|---|
| 1 | Contract change (`packages/*/CONTRACT.md` OR `apps/*/CONTRACT.md`) | **YES** | NEW `## Grid context attrs (Wave 5)` section in `packages/mdx-bridge/CONTRACT.md` + trailing sentence in `## Round-trip invariant`. |
| 2 | Package add/remove | NO | No `package.json` / workspace add. |
| 3 | Cross-package shape (block-foundation / mdx-bridge / heavy-block-boundary core types) | NO | mdx-bridge `TiptapNode` shape unchanged (grid attrs flow through generic `attrs?: Record<string, unknown>` map; no NEW field on the TS interface). Optional `rowSpanSemantic` on `JsxDispatchEntry` is internal-only forward-compat (NOT exported on a public interface that downstream packages consume; if added at all per `## files` `dispatch-table.ts` conditional). |
| 4 | NEW ADR or substantive ADR amendment | NO | ADR-0016 already authorises full scope; no Status line change; no NEW ADR file. |
| 5 | Cross 3+ packages | **YES** | Boundary contract change: mdx-bridge serializes grid attrs that block-foundation will consume (C.2-2 BlockUIDefinition.gridSchema) + apps/site will render (C.2-3 Astro renderer) + heavy-block-boundary will derive dims from (C.2-7 ADR-0014 v0.5). Even though file-level changes are contained to mdx-bridge, the boundary surface affects ≥ 3 packages downstream — substantive Row 5 hit. |
| 6 | Public TS API surface widen / narrow | NO | No new `export` from `@skb/mdx-bridge/index.ts`; the new helpers are internal to `serialize.ts` / `parse.ts`. (If executor finds it cleaner to export `parseGridAttrs` / `serializeGridAttrs` for testing, that crosses Row 6 — flag in stage 3 review.) |
| 7 | Spec / agent-contract / CLAUDE.md change | NO | No edits. |
| 8 | CI / deploy / auth / security | NO | No `astro.config.mjs` / `pnpm-lock.yaml` / hooks change. |

**Verdict**: Rows 1 + 5 HIT → **Stage 4 PRE-COMMIT CLAUDE REVIEW
REQUIRED**. Stage 3 codex-pr-reviewer-55 runs first (mandatory per
D1 stage 3 for every PR) + ADR-0006 8-point checklist. Stage 4
orchestrator-self walks the diff against PR.md + ADR-0016 D7 +
§502 row 2 forward-pointer language to mitigate same-model
echo-chamber risk per ADR-0011 D2 v0.1.1.

## Risk register

1. **D3 asymmetry serialize/parse symmetry** — Markdown rowSpan='auto'
   MUST NOT serialize (ADR-0016 D3 serialize side); reverse parse on
   MDX without rowSpan attr MUST rebuild as `'auto'` for prose blocks
   and `1 + console.warn` for non-prose blocks. Test fixtures must
   round-trip both directions. **Mitigation**: TC4 (forward markdown
   asymmetry) + TC7 (reverse markdown auto) + TC11 (forward + reverse
   non-prose rejects explicit `rowSpan='auto'`); both helpers
   (`serializeGridAttrs` + `parseGridAttrs`) implement the
   discriminator via `core.mdxComponent === 'Markdown'` heuristic at
   v0.1 (forward-pointer to C.2-2 `gridKind === 'prose'` schema).
   Reviewer confirms both directions of the asymmetry are covered in
   the test suite.

2. **Defensive default `console.warn` pollution in tests** —
   `console.warn` spy must scope to defensive test only; other tests
   (existing `round-trip.test.ts` 17 fixtures) must not fail on
   stray warns from the defensive-default code path. **Mitigation**:
   `vi.spyOn(console, 'warn').mockImplementation(() => {})` at the
   start of each defensive `describe` block + `mockRestore()` in
   `afterEach`. Existing round-trip tests will trigger the warn (the
   8 component fixtures 22-29 have NO grid attrs, so defensive
   defaults apply); since vitest doesn't fail tests on stray warns
   by default, this is a passive concern. If `vitest.config.ts`
   has `process.env.CI` warn-as-error or similar, the executor sees
   it at RED and adjusts. The defensive-default warn message is the
   canonical hook for orchestrator's stage 4 review (greppable).

3. **Stage C.2 transitional implementation: defensive defaults during
   C.2-1 → C.2-3, hard-throw flip at C.2-3** (LOCKED DECISION; NOT an
   open question) — ADR-0016 D7 literal wording "missing col/colSpan
   = invalid; mdx-bridge throws" is the **end-state invariant**, locked
   at the END of Stage C.2 (specifically after C.2-3 lands grid-aware
   sample MDX in `apps/site/src/content/notes/sample-blocks/` AND
   backfills the 17 RTT fixtures in
   `packages/mdx-bridge/src/__tests__/fixtures/`). During the C.2-1 →
   C.2-3 transition, mdx-bridge implements **defensive defaults +
   `console.warn`** for missing col/colSpan on parse, and
   **symmetric-absence on serialize** so the existing fixture corpus +
   pre-grid sample MDX continue to round-trip byte-equivalently. This
   transitional pattern parallels D7's already-specified `rowSpan`
   defensive-default-+-warn pattern for non-markdown blocks (D7 last
   paragraph: "rowSpan 缺失: 其他 block: rowSpan=1 (defensive default
   + console.warn)") — the col/colSpan defensive defaults are
   structurally identical, so this is consistent with D7, not a
   contradiction of D7's throw clause.

   **C.2-1 transitional behaviour** (implemented by this PR):
   - **Parse** (`parseGridAttrs`): missing col → default `col=1`;
     missing colSpan → default `colSpan=12`; emit a single
     `console.warn` covering both with the canonical message
     `mdx-bridge: grid attrs missing on block <type>; defaulted to
     col=1 colSpan=12. ADR-0016 D7 hard-throw lands at C.2-3.`
     (literal string; matches AC#7 grep). Missing rowSpan on
     non-prose → default `rowSpan=1` + warn (separate canonical
     message `mdx-bridge: grid attr default rowSpan=1 on non-prose
     block <type>; explicit value recommended per ADR-0016 D3+D7.`).
     Missing rowSpan on prose → `'auto'` (no warn; spec semantic per
     D3). **Markdown blocks suppress the col/colSpan defensive warn**
     (per D3 markdown rowSpan='auto' asymmetry pattern — markdown
     prose path is grid-attr-optional in the transition window; this
     also matches the "prose blocks bypass grid in transition"
     reading of D11 "Tiptap inside / grid outside 分层"). Explicit
     invalid values still throw at C.2-1 per D7 safety net (col +
     colSpan > 13 / colSpan ∉ COL_SNAPS / col out of [1, 12] /
     rowSpan < 1 integer / explicit rowSpan='auto' on non-prose).
   - **Serialize** (`serializeGridAttrs`): track an internal
     `_gridAttrsExplicit?: boolean` marker on the Tiptap node `attrs`
     (set `true` on parse only when col/colSpan were explicitly
     present in the MDX source; set `true` by editor when user
     mutates grid position; otherwise absent). Emit `col` / `colSpan`
     / `row` / `rowSpan` MDX attrs ONLY IF `_gridAttrsExplicit ===
     true`. Pre-grid fixtures (no marker) round-trip with NO grid
     attrs in either direction — existing 17-fixture corpus stays
     byte-equivalent unchanged. The marker is excluded from the
     `stripMdast` editor-built-doc invariant 2 baseline (it's a
     `_`-prefixed internal field same family as `_mdast`).

   **C.2-3 hard-throw flip** (out of this PR's scope; pre-listed in
   C.2-3 PR.md): C.2-3 ships sample-MDX grid-attr backfill in
   `apps/site/src/content/notes/sample-blocks/` + 17-fixture backfill
   in `packages/mdx-bridge/src/__tests__/fixtures/` + a final
   mdx-bridge edit removing the defensive-default `console.warn`
   branches in `parseGridAttrs` and replacing them with
   `unsupportedGridAttr(name)` throws per D7 literal. After C.2-3
   merges, parse-side missing col/colSpan throws unconditionally
   (D7 end-state invariant in force). The `_gridAttrsExplicit`
   serialize marker stays (still useful for editor flows that
   create blocks without grid attrs in-memory).

   **Why this scope split**: bundling the hard-throw flip into C.2-1
   would require also bundling the sample-MDX + 17-fixture backfill
   (or breaking the D7 invariant on every sample render), which
   widens the PR beyond the row C.2-1 ~300 LOC budget into C.2-3's
   Astro-renderer scope. Splitting along the natural boundary
   (transitional defensive defaults in C.2-1; lockdown + backfill in
   C.2-3) keeps each PR focused and reviewable.

4. **Sister-doc sync drift** — ADR-0016 §502 lists 4 sister CONTRACTs
   needing W5-1 forward-pointer. This PR lands the mdx-bridge slot
   (row 2 of 4). The other 3 land in:
   - block-foundation (row 1; **primary W5-1 authority**, not
     forward-pointer): C.2-2.
   - apps/site (row 3): C.2-3.
   - heavy-block-boundary (row 4): C.2-7.
   **Mitigation**: the orchestrator's plan PR for each Stage C.2
   sub-PR re-cites §502 sister-doc-sync requirement so each PR's
   reviewer + ACCEPT verifies its slot. If a downstream PR drops
   its forward-pointer, the inconsistency surfaces at the next
   ADR-0006 8-point audit run (item #6 sister-doc-sync). This PR
   only owns row 2.

5. **W5-1 forward-pointer references a NOT-YET-LANDED anchor** —
   C.2-1 PR.md has the W5-1 forward-pointer in `packages/mdx-bridge/CONTRACT.md`,
   but the anchor target (`packages/block-foundation/CONTRACT.md`
   `## Invariants` section with W5-1 prose) lands in C.2-2.
   **Mitigation**: ADR-0016 D9 + §502 explicitly state the W5-1
   prose lands in block-foundation/CONTRACT.md at C.2-2. The
   forward-pointer in this PR's CONTRACT.md is acceptable per
   ADR convention "future content can be referenced if the
   landing PR + receiver section are explicitly named in the
   ADR". The lychee link-check at this PR's merge time will pass
   because lychee scans the link **target file** existing
   (`packages/block-foundation/CONTRACT.md` already exists at
   HEAD `587835c`; only the W5-1 prose inside is missing —
   lychee doesn't validate fragment/anchor existence by default,
   so the file-level link is green). C.2-2 lands the prose;
   if for some reason C.2-2 slips, this PR's pointer becomes
   informationally stale but link-check stays green.

6. **`mdx-bridge` `## Round-trip invariant` (existing) interaction
   with new section** — Existing invariants 1 + 2 are byte-equivalence
   over the FULL MDX text. Grid attrs flowing through `attrs` map
   are subject to the same invariants (round-trip preserves them
   byte-equivalently when explicit). The trailing sentence appended
   to the section explicitly carries this forward. **Mitigation**:
   new `## Grid context attrs (Wave 5)` section is placed AFTER
   `## Component block dispatch` and BEFORE `## Canonicalization
   rules` — between dispatch + canonicalization is the natural
   placement (grid-attr handling is a layer above per-block dispatch
   + below canonicalization rules like list-bullet normalization).
   Existing invariant text is NOT modified except for the trailing
   sentence; reviewer verifies via diff that the existing prose is
   intact byte-for-byte.

7. **block-foundation/CONTRACT.md W5-1 anchor naming convention** —
   This PR's forward-pointer should reference the section anchor
   ([packages/block-foundation/CONTRACT.md `## Invariants`]) rather
   than a specific W5-1 sub-heading (since the sub-heading might
   be `### W5-1 — Grid context dimensions` or similar; exact prose
   lands in C.2-2). **Mitigation**: forward-pointer text is "see
   `## Invariants` (W5-1 lands there in Wave 5 Stage C.2-2)" — links
   to the section, not the sub-heading. This is robust to whatever
   sub-heading style C.2-2 picks.

8. **Architectural decision: grid attrs in mdx-bridge wrapper vs in
   per-block packages** — `## title` rationale says: centralise in
   mdx-bridge dispatch wrapper (don't push grid-attr handling into
   8 block-package serialize/parse functions). Risk: future feature
   that depends on per-block grid-attr customisation (e.g., a block
   that overrides default colSpan) becomes harder. **Mitigation**:
   ADR-0016 D10 lands `BlockUIDefinition.gridDefault?: BlockGridPosition`
   in C.2-2 — that's the per-block customisation hook. mdx-bridge
   reads `core.gridDefault` (forward-pointer at v0.1; lookup added
   in C.2-2). At v0.1, default values are hard-coded constants in
   `parseGridAttrs` / `serializeGridAttrs`. Per-block override is a
   forward-compat extension. The architectural decision is reversible
   if needed: pushing handling into block packages later means each
   block's parse/serialize calls would receive `gridAttrs` already
   parsed by mdx-bridge wrapper, which is essentially the same shape
   — the wrapper layer remains either way. **Locked at v0.1**:
   wrapper-side handling.

## Out of scope (deferred — explicit list)

- **C.2-2** BlockUIDefinition extension + grid-math.ts +
  `proseGridDefaults` const + W5-1 primary authority prose in
  `packages/block-foundation/CONTRACT.md` `## Invariants`. This
  PR's mdx-bridge CONTRACT.md only forward-points to it.
- **C.2-3** Astro renderer grid layout + sample MDX grid attrs
  population in `apps/site/src/content/notes/sample-blocks/`. This
  PR's mdx-bridge work does NOT touch sample MDX (defensive-default
  mode flag means existing sample MDX continues to round-trip
  cleanly without grid attrs until C.2-3 backfills them).
- **Hard-throw flip on missing col/colSpan during parse** — deferred
  to C.2-3 (paired with sample MDX grid-attrs backfill in
  `apps/site/src/content/notes/sample-blocks/` + 17-fixture grid-aware
  backfill in `packages/mdx-bridge/src/__tests__/fixtures/`). C.2-1
  ships defensive defaults + `console.warn` as transitional bridge
  (per Risk row 3 LOCKED decision); C.2-3 removes the defensive
  branches and restores ADR-0016 D7 literal throws as the end-state
  invariant. The `_gridAttrsExplicit` serialize marker stays
  (still useful for editor flows that create blocks without grid
  attrs in-memory).
- **C.2-4 / C.2-5 / C.2-6 / C.2-8 / C.2-9** editor-shell grid
  integration + useAutoRowSpan hook + drag/drop UX + responsive
  switch + close-out. Out of mdx-bridge scope.
- **C.2-7** ADR-0014 v0.5 amendment (HeavyBlockBoundary dims grid
  context). This PR does not touch heavy-block-boundary; only
  forward-points via §502 row 4 mention in CONTRACT.md prose.
- **C.2-10 / C.2-11 / C.2-12** playwright + perf budget.
- **Stage C.3** (ADR-0018 OKLCH switchover; `packages/design-tokens/**`).
- **Block-package edits** — 8 `@skb/block-*/{core,ui-default}/**`
  remain block-prop-only per `## title` architectural rationale;
  grid-attr handling centralised in mdx-bridge dispatch wrapper.
  If a block package needs a `gridDefault` override hook, it lands
  via `BlockUIDefinition.gridDefault` in C.2-2.
- **ADR-0016 amendments** — NONE; ADR locked at Pre-A2 v0.1.1; this
  PR implements per the locked spec.
- **Sample MDX content edits** — `apps/site/src/content/notes/sample-blocks/index.mdx`
  + any other sample MDX files stay grid-attr-absent at C.2-1; the
  defensive-default mode handles them. Backfill happens in C.2-3.
- **`apps/site/CONTRACT.md` `Component-block rendering` section
  update** — describes Astro renderer grid layout; C.2-3 scope.
- **8 `@skb/block-*/CONTRACT.md` edits** — none required at C.2-1
  per Stage C.2 plan v1.0; per-block grid customisation lands at
  C.2-2 via `BlockUIDefinition.gridDefault`.

## executor

- **Stage 1 PLAN**: pr-writer Claude subagent (this dispatch). Output
  = locked PR.md. Risk row 3 architectural decision LOCKED by
  orchestrator: transitional defensive defaults + symmetric-absence
  on serialize during C.2-1 → C.2-3; hard-throw flip + 17-fixture
  + sample-MDX backfill at C.2-3.
- **Stage 2 EXECUTE**: `codex-generic-executor` (`--yolo` profile;
  per Wave 5 plan v1.0 D6). TDD-front: write `grid-rtt.test.ts` +
  `grid-defensive.test.ts` first (RED — `parseGridAttrs` /
  `serializeGridAttrs` don't exist) → implement helpers in
  `serialize.ts` + `parse.ts` until GREEN. Verify existing
  `round-trip.test.ts` (17 fixtures × 2 invariants) still PASS
  unchanged (defensive-default mode flag enforces this — see
  Risk row 3). Audit log path:
  `docs/audits/codex-runs/2026-05-04-C.2-1-execute.txt` (per memory
  `feedback_codex_audit_log_recursion.md` — pipe to `/tmp` first
  with watchdog kill at ~500 KB; head -2000 archive).
- **Stage 3 REVIEW**: `codex-pr-reviewer-55` (5.5). 8-point
  checklist + spec match against ADR-0016 D7 + D3 + §502 row 2
  + this PR.md `## acceptance` + `## verification required`. Audit
  log path: `docs/audits/codex-runs/2026-05-04-C.2-1-review.txt`.
- **Stage 4 PRE-COMMIT CLAUDE REVIEW**: orchestrator-self. **REQUIRED**
  per `## D2 trigger judgment` Row 1 + Row 5 HIT. Walk diff against
  ADR-0016 D7 + §502 row 2 sister-doc-sync language; verify
  defensive-default policy actually preserves the 17-fixture round-trip
  invariant; verify W5-1 forward-pointer text matches §502 row 2
  prescribed content; mitigate same-model echo-chamber per ADR-0011
  D2 v0.1.1.
- **Stage 5 COMMIT**: reviewer codex with ADR-0006 D8 explicit-file-list
  staging discipline (see `## Codex commit (D1 stage 5) staging`).
- **Stage 6 ACCEPT**: pr-writer second invocation. Read PR.md
  `acceptance:` block + run `verification required` table + verify
  diff matches each AC#. ACCEPT or REJECT-with-residue.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging + memories
`feedback_git_operator_explicit_stage` +
`feedback_git_operator_ci_verification`. Reviewer codex (NOT pr-writer;
ADR-0011 D1+D4 git mutation discipline) runs:

1. **Reset stage**: `git reset HEAD` (clear any prior partial stage).
2. **Add explicit whitelist**:
   ```bash
   git add \
     packages/mdx-bridge/src/serialize.ts \
     packages/mdx-bridge/src/parse.ts \
     packages/mdx-bridge/src/dispatch-table.ts \
     packages/mdx-bridge/src/__tests__/grid-rtt.test.ts \
     packages/mdx-bridge/src/__tests__/grid-defensive.test.ts \
     packages/mdx-bridge/CONTRACT.md \
     docs/plans/wave-5-main/C.2-1-mdx-bridge-grid-serialize.md
   ```
   **NEVER** `git add -A` / `git add .` (per memory rule). 7 explicit
   paths (`dispatch-table.ts` may be untouched per `## files`
   conditional — if the diff shows zero lines for it, drop from
   the add command at staging time + re-verify). If the executor
   added an audit log path under `docs/audits/codex-runs/`, include
   that as well.
3. **Verify staged scope**: `git diff --cached --stat`. Expected: 6-7
   paths above; NO `pnpm-lock.yaml`; NO `packages/block-*` edits;
   NO `apps/site/**` edits; NO `packages/heavy-block-boundary/**`;
   NO `packages/editor-shell/**`; NO `packages/design-tokens/**`;
   NO `packages/block-foundation/**`. Total `{changed-lines}` per
   file ≤ 500 (size-check 500-LOC hard cap). If diff includes
   anything outside the whitelist, abort + restore + ask
   orchestrator.
4. **Lockfile contamination scan** (per memory): if `pnpm-lock.yaml`
   shows in cached diff, restore from clean historical blob:
   `git restore --source=main --staged --worktree pnpm-lock.yaml`.
   Re-verify step 3.
5. **Pre-push uncached typecheck** (per memory
   `feedback_git_operator_ci_verification`): `pnpm typecheck` (NOT
   cached via turbo) before push to catch tsc errors that vitest +
   turbo cache miss. Particularly relevant since this PR adds new
   helper functions consumed inside the same package — TS surface
   is internal but the typecheck still needs to pass cleanly across
   `serialize.ts` / `parse.ts` / new test files.
6. **Commit + push**: standard squash-friendly commit message
   following Wave 5 plan v1.0 commit style. Subject prefix
   `Wave 5 C.2-1 — `. Include `ADR-0016 D7` + `W5-1` tokens in
   body for future grep (D7 serialize spec authority + W5-1
   forward-pointer authority).
7. **CI verification**: `gh run view --json conclusion --jq .conclusion`
   on push (NOT `gh run watch --exit-status`; per memory). If
   `success` → push gate; orchestrator merges via
   `gh pr merge --squash --delete-branch` per memory
   `feedback_wave3_auto_merge` Wave 3 auto-merge directive carried
   into Wave 4+5.

## Related

- [Wave 5 plan v1.0](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  §469 row C.2-1 (this PR's authoritative scope) + §502 sister-doc-sync
  row 2 (mdx-bridge slot).
- [ADR-0016 grid data model](../../decisions/ADR-0016-grid-data-model.md)
  D2 (4-attr shape) + D3 (markdown rowSpan='auto' asymmetry) + D6
  (COL_SNAPS = `[2,3,4,6,8,12]`) + D7 (MDX serialize spec — this
  PR's primary authority) + D9 (W5-1 invariant pointer; lands in
  block-foundation at C.2-2) + §502 row 2 (mdx-bridge sister-doc
  forward-pointer instruction).
- [ADR-0006 8-point asymmetry audit](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  item #5 algorithm replication (mdx-bridge wrapper vs per-block
  duplication; mitigated by centralisation) + item #6 sister-doc
  sync (W5-1 forward-pointer conformance).
- [ADR-0011 D1 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  D1 stages + D2 v0.1.1 SOTed-PR.md schema (this PR.md follows it).
- [ADR-0014 heavy-block-boundary](../../decisions/ADR-0014-heavy-block-boundary.md)
  W4-1 invariant (precedent for W5-1) + v0.5 amendment forward-pointer
  (Stage C.2-7 lands).
- [ADR-0017 drag/drop UX](../../decisions/ADR-0017-drag-drop-ux.md)
  consumes ADR-0016 D2 + D6; out of this PR's scope but downstream
  consumer.
- [packages/mdx-bridge/CONTRACT.md](../../../packages/mdx-bridge/CONTRACT.md)
  current state pre-edit — `## Component block dispatch` (Wave 3+
  per-call dispatch) + `## Round-trip invariant` (invariants 1 + 2
  + 17-fixture × 2-invariant baseline) + `## Canonicalization rules`
  + `## Implementation notes` (parser/serializer pipeline + inline
  marks).
- [packages/block-foundation/CONTRACT.md](../../../packages/block-foundation/CONTRACT.md)
  forward-pointer target — `## Invariants` section receives W5-1
  prose at C.2-2.
- [Stage C.1 close handoff pack](./C.1-handoff-pack.md) — Stage
  C.1 closed; this PR opens Stage C.2.
- [Stage C.1-1 PR.md](./C.1-1-heavy-block-plugin-placeholder.md) —
  predecessor reference for ADR-0014 v0.4 amendment shape (similar
  multi-section PR.md style; mirrored here at smaller scope).
- [Stage C.1-2 PR.md](./C.1-2-pdf-chunk-leak.md) — most recent
  SOTed-PR.md format reference (C.2-1 mirrors structure; richer
  scope per 8 kinds × 4 attrs matrix).
- Memories applied: `feedback_codex_stdin` (codex
  `< /dev/null`), `feedback_codex_audit_log_recursion` (audit log
  path + watchdog), `feedback_lychee_line_anchor` +
  `feedback_lychee_npmjs_403` + `feedback_lychee_user_local_paths`
  + `feedback_lychee_autolink_in_backticks` (lychee discipline),
  `feedback_git_operator_explicit_stage` +
  `feedback_git_operator_ci_verification` (commit staging),
  `feedback_wsl2_chromium_launch` (no playwright assertion in this
  PR; CI canonical if added downstream),
  `feedback_wave3_auto_merge` (orchestrator merges post ACCEPT-PASS).
