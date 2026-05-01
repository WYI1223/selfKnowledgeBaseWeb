# B1 — mdx-bridge `mdxJsxFlowElement` routing infrastructure

> **Wave 3 main pipeline eighth PR (FIRST of Stage B).** Extends `@skb/mdx-bridge`
> from prose-only (Wave 1) to a per-call-injectable component-block dispatch
> walker. Adds an optional `{ blockRegistry }` second argument to `mdxToTiptap`
> + `tiptapToMdx`, dispatches `mdxJsxFlowElement` (parse) + registered
> component-typed Tiptap nodes (serialize) through an **external dispatch
> table** keyed on `mdxComponent` PascalCase strings, and finally lights up
> A5's forward-compat `SaveLoadOptions.blockRegistry` thread-through. NO
> per-block fixture lands here (B2-B8 each add one). Adds the first real
> workspace dep `@skb/block-foundation` to mdx-bridge (Wave 1
> forward-compat clause activates per ADR-0008 D1).
>
> See `## Critical design choice` for the load-bearing dispatch-mechanism
> decision and `## Open questions for orchestrator (pre-lock)` for the two
> items the orchestrator must resolve before lock. SOTed-PR.md discipline
> per ADR-0011 v0.1.1 is mandatory; every factual claim canonicalised to a
> single section + cross-referenced elsewhere.

## title

Extend `mdxToTiptap(source: string)` and `tiptapToMdx(doc: TiptapDoc)` to
accept an optional second argument `options?: MdxBridgeOptions` where
`MdxBridgeOptions = { blockRegistry?: BlockRegistry }`; dispatch
`mdxJsxFlowElement` (parse) + component-typed Tiptap nodes (serialize)
through an **external dispatch table internal to mdx-bridge** keyed on
`BlockCoreDefinition.mdxComponent` PascalCase strings (per
`block-foundation/CONTRACT.md:28` "Serialize / parse hook ownership"
authority — block-foundation forbids parse/serialize hooks on the
registry); preserve Wave 1 fail-loud rule with a sixth + seventh enforced
throw site for unknown component blocks; fail-loud when registry is
**absent** for a block-typed node (TC3 / TC4); add `@skb/block-foundation`
workspace dep to `packages/mdx-bridge/package.json` + matching
`tsconfig.json#references`; rewrite `## Forward-compat consumers (Wave 2+)`
in `packages/mdx-bridge/CONTRACT.md` into a live `## Component block
dispatch (Wave 3+)` section documenting the per-call injection +
no-global-setter pattern + nested-component round-trip + parallel-call
state isolation; thread `options` from A5's `saveLoad.ts` through to the
mdx-bridge calls (drops the `_options` underscore prefix on `saveToMdx`
+ `loadFromMdx`); add 6 locked-plan TCs + 7 operational TCs in
`packages/mdx-bridge/src/__tests__/jsx-routing.test.ts`. Closes Wave 3
locked-plan B1 entry (lines 334-403) and unblocks B2-B8 fixture-only PRs.

## files

Created (NEW — 2 source/test files + 1 self-listed):

- `packages/mdx-bridge/src/__tests__/jsx-routing.test.ts` *(TC1-TC6 from
  the locked plan + TC13 conditional canonicalization-rules guard. ~140-
  170 LOC: imports + 6 `it(...)` blocks + minimal in-test fixture
  builders. Uses `@skb/block-foundation`'s `BlockRegistry` + a tiny
  test-local fake `BlockCoreDefinition` with `mdxComponent: 'Callout'`
  registered, plus a parallel test-local dispatch-table entry registered
  at the mdx-bridge dispatch-table API surface — see `## Critical design
  choice` for the dispatch-table API shape. NO `setTimeout`, NO `await
  Promise.resolve` — parse + serialize are synchronous.)*
- `packages/mdx-bridge/src/dispatch-table.ts` *(NEW small private module
  ~25-30 LOC. Exports `registerJsxDispatch(entry)` + `getJsxDispatch(name)`
  + `JsxDispatchEntry` interface + `MdastJsxElement` type alias.
  Module-private `Map<string, JsxDispatchEntry>` keyed on PascalCase
  `mdxComponent`. Same `Duplicate registration` throw shape as
  `block-foundation/registry.ts:60-63`. **Lives inside mdx-bridge** (NOT
  block-foundation) per the design constraint in
  `block-foundation/CONTRACT.md:28` — see `## Critical design choice`
  for the full rationale. Registration performed by consumer code: B2-B8
  each add a one-liner `registerJsxDispatch({...})` call; B1 leaves the
  table empty at production module-load time, with TC1-TC6 registering
  test-locally inside `it(...)` blocks.)*
- `docs/plans/wave-3-main/B1-mdx-bridge-jsx-routing.md` *(this PR.md;
  ADR-0006 D8 strict whitelist; PR #1 R2 lesson, repeated A1-A5 + Pre-B1)*

Modified (6 source/config files + 1 sibling-package source + 1 lockfile):

- `packages/mdx-bridge/src/parse.ts` — extend `mdxToTiptap` signature to
  `mdxToTiptap(source: string, options?: MdxBridgeOptions): TiptapDoc`;
  pass `options` through to the existing `mdastBlockToTiptap`
  recursion-internal call site; in `mdastBlockToTiptap`, add a new
  `case 'mdxJsxFlowElement':` branch ABOVE the existing fail-loud
  default that:
  1. extracts `node.name` (the PascalCase component identifier as it
     appeared in the source, e.g. `<Callout type="info">…</Callout>` →
     `node.name === 'Callout'`)
  2. when `options?.blockRegistry === undefined` — falls through to the
     existing default fail-loud branch (TC3 negative — see
     `## test_cases`)
  3. when `options.blockRegistry.getCore(<<core-name-resolved-from-mdxComponent>>)`
     yields a registered core, looks up the per-block parse function via
     the **external dispatch table** (see `## Critical design choice`
     for the table's location + shape); when both registry-lookup and
     dispatch-table-lookup succeed, calls `parse<BlockName>(node)` and
     stamps `_mdast: node` for byte-equivalent round-trip preservation
     (Wave 1 `_mdast` pattern carries over; see CONTRACT.md
     "Implementation notes" line 65 ff.)
  4. when registry is present but no matching core — throws
     `mdx-bridge: unsupported block type "<componentName>". Add a
     fixture and a parse + serialize case before introducing this
     block type.` (TC2 negative — same shape as Wave 1 throw line 113
     of parse.ts at HEAD; sixth enforced throw site).
  Recursion: a component-block's `parse<Name>(node)` may itself produce
  child Tiptap nodes that are component blocks (nested case, TC5); the
  dispatch is invoked via the per-block parse function which is
  responsible for recursing into mdast children (each block's
  `parse<Name>` may call back into mdx-bridge's exported helper for
  child-mdast-block conversion — the helper is added as a thin
  re-export in `## test_cases` TC5 evidence wiring; see also
  `## Critical design choice` callback shape). Estimated parse.ts
  delta: +35-50 LOC (case branch + dispatch helper); resulting file
  ~210-225 lines (under 300 soft warn).
- `packages/mdx-bridge/src/serialize.ts` — extend `tiptapToMdx`
  signature to `tiptapToMdx(doc: TiptapDoc, options?: MdxBridgeOptions):
  string`; pass `options` through to `tiptapToMdastBlock` and the
  fall-back canonical reconstruction path. In `tiptapToMdastBlock`,
  ABOVE the existing `_mdast` fast-path (line 76 of serialize.ts at
  HEAD), check whether `node.type` is registered as a component block
  in the dispatch table:
  1. when `options?.blockRegistry === undefined` AND `node.type` is
     not a Wave 1 prose type — falls through to the existing fail-loud
     default (TC3 sister-symmetry).
  2. when registered AND dispatch-table has a matching `serialize<Name>`
     — call it; the function returns an `mdxJsxFlowElement` mdast node
     (each block's `serialize<Name>` already returns this shape — see
     `block-callout/src/core/serialize.ts` at HEAD). The serializer
     emits the JSX through remark-mdx canonical stringification.
  3. when registry is present but `node.type` is NOT registered AND
     NOT a Wave 1 prose type — throws
     `mdx-bridge: unsupported block type "<typeName>". Add a fixture
     and a parse + serialize case before introducing this block type.`
     (TC4 negative; seventh enforced throw site, sister-symmetric to
     parse.ts).
  Estimated serialize.ts delta: +35-50 LOC; resulting file ~280-295
  lines (still under 300 soft warn; **no** new CONTRACT.md size-
  acknowledgment line needed unless impl crosses 300 — see
  `## acceptance` bullet 9). The pre-existing serialize.ts:243
  CONTRACT acknowledgment in `docs/audits/structure-2026-05.md:84`
  remains accurate-or-is-superseded by the post-B1 line count; no
  edit to that audit doc is in scope (audits regenerate per Wave-close).
- `packages/mdx-bridge/src/index.ts` — adds 3 new export lines +
  preserves the 3 existing Wave 1 exports:
  - `export { mdxToTiptap, tiptapToMdx, type MdxBridgeOptions } from
    './parse';` *(MdxBridgeOptions interface co-located in parse.ts
    next to the signature it describes; tiptapToMdx re-imports the
    type from parse.ts to keep the canonical location single)*
  - `export { registerJsxDispatch, getJsxDispatch, type
    JsxDispatchEntry } from './dispatch-table';`
  - existing `export type { TiptapDoc, TiptapNode, TiptapMark } from
    './parse';` carries over unchanged.
  Net delta: index.ts grows from 3 lines (HEAD) to ~6-7 lines.
- `packages/mdx-bridge/package.json` — add
  `"@skb/block-foundation": "workspace:*"` to `dependencies`.
  This is mdx-bridge's first real workspace dep (Wave 1 had zero per
  ADR-0008 D1 dead-dep cleanup; Wave 1 `## Forward-compat consumers
  (Wave 2+)` prose at CONTRACT.md:144-156 explicitly forecast this
  edge would land "once Wave 2 begins emitting `mdxJsxFlowElement`").
- `packages/mdx-bridge/tsconfig.json` — add
  `{ "path": "../block-foundation" }` to a new `references` array
  (HEAD has no references field). Keeps three-way symmetry with the
  package.json dep edge per ADR-0008 D1.
- `packages/mdx-bridge/CONTRACT.md` — four coordinated edits:
  1. Replace `## Forward-compat consumers (Wave 2+)` (lines 144-156
     of HEAD) with a live `## Component block dispatch (Wave 3+)`
     section documenting: per-call injection (no global setter),
     external dispatch table location, the `mdxComponent` →
     `serialize<Name>` / `parse<Name>` naming convention sourced
     from block-foundation/CONTRACT.md:28, the registry-absent +
     registry-present-but-unknown-name fail-loud branches, and
     nested-component-block round-trip behavior.
  2. Bump the Wave 1 baseline announcement at line 40 from "Wave 1
     baseline (9 prose fixtures × 2 invariants = 18 RTT assertions)"
     prose to a new line acknowledging "fixture count growing in
     Stage B" — exact wording per `## acceptance` bullet 5.
  3. Update the "There are exactly five enforced throw sites today"
     prose at lines 119-126 to "seven enforced throw sites in Wave 3
     post-B1" with two new bullets: `parse.ts mdastBlockToTiptap
     mdxJsxFlowElement unknown-name` + `serialize.ts
     tiptapToMdastBlock unknown-component-type`. Cross-ref:
     `## test_cases` TC2 + TC4 are the regression tests.
  4. Add a new `## Canonicalization rules` section IF item 5 is
     included in B1 — see `## Open questions for orchestrator
     (pre-lock)` Q2 for the include-or-defer decision. (This PR
     **defaults to defer to B2** — see `## test_cases` TC13's
     conditional disposition; if orchestrator decides include,
     section adds the list-bullet `-` → `*` documentation observed
     during Stage A retrospective item 5; otherwise this edit is
     dropped from the PR.)
- `packages/editor-shell/src/saveLoad.ts` — drop the `_options`
  underscore prefix on both `saveToMdx` + `loadFromMdx`; thread
  `options` through to the mdx-bridge calls. The single-line per
  call-site change A5 explicitly forecast in
  `docs/plans/wave-3-main/A5-editor-shell-save-load.md:99-102`
  ("Once B1 lands the per-call injection on mdx-bridge, A5's
  saveLoad updates with a single-line change per call site
  (`mdxToTiptap(source, options)` / `tiptapToMdx(doc, options)`)
  and the underscore prefix is dropped"). Net delta: +0 LOC, ~4
  whitespace + parameter-name diffs.
- `pnpm-lock.yaml` — workspace graph mutation post `pnpm install`
  (the new `@skb/mdx-bridge` → `@skb/block-foundation` workspace
  edge). Restore from clean blob if contaminated per the
  `git-operator: explicit-file-list 4-step commit protocol +
  lockfile blob rule` MEMORY entry.

= **11 files in canonical `## files` block** (3 NEW: jsx-routing.test.ts
+ dispatch-table.ts + this PR.md self-listed; 8 modified: parse.ts +
serialize.ts + index.ts + package.json + tsconfig.json + CONTRACT.md +
editor-shell/saveLoad.ts + pnpm-lock.yaml; counts canonical here,
cross-referenced as "per `## files`" elsewhere).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `packages/block-foundation/src/registry.ts` — **NOT modified**.
  No `parseMdx?` / `serializeMdx?` hooks added to
  `BlockCoreDefinition`; the design uses an mdx-bridge-internal
  dispatch table (per `## Critical design choice`). Verify at
  review:
  `git diff main -- packages/block-foundation/src/registry.ts`
  returns empty.
- `packages/block-foundation/CONTRACT.md` — **NOT modified**. Line
  28 ("Serialize / parse hook ownership") is the AUTHORITATIVE
  prose for the design B1 implements; B1 honors it without amend.
  Verify at review:
  `git diff main -- packages/block-foundation/CONTRACT.md`
  returns empty.
- `packages/block-callout/CONTRACT.md` and the 7 sister
  `block-*/CONTRACT.md` — **NOT modified**. B1 is producer-side
  infrastructure; per ADR-0006 #6 sister-doc audit, the 8 block
  CONTRACTs do not need changes (they remain consumers of
  block-foundation's BlockCoreDefinition shape, which itself does
  not change). Verify at review per `## test_cases` TC12.
- `packages/block-callout/src/core/parse.ts` + `.../serialize.ts`
  and the 7 sister block parse/serialize files — **NOT modified**.
  Their existing `parse<Name>` / `serialize<Name>` exports already
  match the dispatch-table contract; B1 introduces the dispatch
  surface but does not invoke it (no fixture lands; no block
  registers itself). B2-B8 each invoke `registerJsxDispatch` for
  their block.
- `agent-contract.md` / `CLAUDE.md` / `AGENTS.md` / generated
  downstream — no agent-roster or workflow changes; B1 is pure
  package source + CONTRACT update. Source-of-truth is
  agent-contract.md; no derivative regen.

## test_cases

13 TCs (6 locked-plan TC1-TC6 + 7 operational TC7-TC13). Listed
canonically here; cross-referenced elsewhere as "TC<N> evidence".

- **TC1** (positive — locked plan) Input: `pnpm --filter
  @skb/mdx-bridge test src/__tests__/jsx-routing.test.ts -t
  "round-trips a registered Callout"`. Setup: construct a
  `BlockRegistry`, register a Callout core with
  `mdxComponent: 'Callout'`; call `registerJsxDispatch({
  mdxComponent: 'Callout', blockType: 'callout', parse:
  parseCallout, serialize: serializeCallout })` against
  mdx-bridge's exported dispatch-table API; build an MDX source
  `<Callout type="info">hello</Callout>`; assert
  `tiptapToMdx(mdxToTiptap(source, { blockRegistry }), {
  blockRegistry }).trim() === source.trim()`. Expected: PASS.
  Location: `packages/mdx-bridge/src/__tests__/jsx-routing.test.ts:N`.
- **TC2** (negative, unknown JSX — locked plan) Input: same
  registry + dispatch as TC1; source =
  `<UnknownBlock attr="x" />`. Call `mdxToTiptap(source, {
  blockRegistry })`. Expected: throws an Error whose message
  matches `/^mdx-bridge: unsupported block type "UnknownBlock"\./`
  per the Wave 1 fail-loud rule generalised. Location: same
  test file.
- **TC3** (negative, missing registry — locked plan) Input:
  source = `<Callout>x</Callout>`; call `mdxToTiptap(source)`
  with NO options arg (and a sister symmetric serialize call
  with no options for completeness). Expected: throws an Error
  matching `/^mdx-bridge: unsupported block type
  "mdxJsxFlowElement"\./` — the Wave 1 default-branch fail-loud
  fires unchanged because the new dispatch path is gated on
  `options.blockRegistry !== undefined`. Asserts the
  prose-only-Wave-1 caller (no opts) keeps the historical
  behavior verbatim. Location: same test file.
- **TC4** (negative, sister-symmetry — locked plan) Input:
  registry as TC1; doc = `{ type: 'doc', content: [{ type:
  'unknownBlock' }] }`; call `tiptapToMdx(doc, { blockRegistry
  })`. Expected: throws Error matching `/^mdx-bridge:
  unsupported block type "unknownBlock"\./`. Sister-symmetric
  message shape to TC2. Location: same test file.
- **TC5** (nested edge — locked plan) Input: registry +
  dispatch as TC1; source = `<Callout><Callout
  type="warn">inner</Callout></Callout>`. Call
  `tiptapToMdx(mdxToTiptap(source, { blockRegistry }), {
  blockRegistry })`. Expected: byte-equivalent round-trip
  passes (`.trim() === source.trim()`). Confirms outer-block
  parse recurses through to inner-block parse via the
  dispatch-table callback shape. Location: same test file.
- **TC6** (state isolation — locked plan, plan-challenger #9)
  Input: build TWO `BlockRegistry` instances `regA` and
  `regB`, both registering `'callout'` core with the same
  `mdxComponent: 'Callout'`; call `mdxToTiptap` twice in
  parallel via `Promise.all` with `{ blockRegistry: regA }`
  and `{ blockRegistry: regB }`. Expected: both succeed; doc
  shapes match expected per-call; no shared mutable state in
  mdx-bridge or the dispatch-table observed across the two
  calls. (The dispatch table itself is module-singleton — see
  `## Critical design choice` — but is read-only during
  parse/serialize; the parallel-call test asserts the
  PER-CALL-INJECTION pattern is state-clean.) Location: same
  test file.
- **TC7** (per-package vitest count) Input: `pnpm --filter
  @skb/mdx-bridge test --reporter=verbose 2>&1 | grep -E
  "Test Files|Tests"`. Expected: `Test Files` count = 2
  (existing `round-trip.test.ts` + new `jsx-routing.test.ts`);
  `Tests` count = HEAD-baseline-count + 6 (TC1-TC6 add 6 new
  `it(...)` blocks). All pass. Location: shell at repo root.
- **TC8** (three-way dep symmetry — ADR-0008 D1) Input: count
  workspace-dep edges into mdx-bridge from three sources:
  ```
  jq -r '.dependencies | keys[]' packages/mdx-bridge/package.json |
    grep '^@skb/' | wc -l
  jq -r '.references[]?.path' packages/mdx-bridge/tsconfig.json |
    grep -c block-foundation
  grep -rn "from '@skb/block-foundation'" packages/mdx-bridge/src |
    wc -l
  ```
  Expected: declared = 1 (`@skb/block-foundation`), references = 1
  (path `../block-foundation`), source imports ≥ 1 (parse.ts
  imports `BlockRegistry` type at minimum; dispatch-table.ts may
  import the registry-related types; the test uses the runtime
  type). Three-way symmetric, no orphans. Pre-B1 baseline:
  declared = 0, references = 0, imports = 0 (Wave 1 cleaned per
  ADR-0008 D1). Location: shell.
- **TC9** (typecheck) Input: `pnpm typecheck`. Expected: exit 0.
  Notable trip-hazards under
  `exactOptionalPropertyTypes` (Wave 1 baseline): the
  `MdxBridgeOptions` interface MUST be defined as
  `interface MdxBridgeOptions { blockRegistry?: BlockRegistry; }`
  with the optional `?:` form (NOT `blockRegistry: BlockRegistry
  | undefined`); call sites that pass options must use the
  conditional-spread idiom
  `mdxToTiptap(source, ...(options && [options]))` where the
  builder pattern requires it (or simpler: just forward
  `options` directly when its absence equates to "no
  registry"). Location: shell.
- **TC10** (root pnpm check) Input: `pnpm check` (or
  `pnpm check:affected`). Expected: exit 0; lint + typecheck +
  test + build + size-check all pass; size-check confirms no
  source file crosses 500-line hard limit. Location: shell.
- **TC11** (lockfile idempotency) Input: `pnpm install
  --frozen-lockfile=false` (post-edit), then
  `git diff pnpm-lock.yaml`. Expected: no further diff after
  the initial workspace-edge add (the workspace `:*` resolution
  is deterministic). Re-run preserves the file. Location: shell.
- **TC12** (sister CONTRACT.md sync — ADR-0006 #6) Input:
  `git diff main -- packages/block-*/CONTRACT.md
  packages/block-foundation/CONTRACT.md`. Expected: empty
  diff. The 8 block-*/CONTRACT.md files PLUS
  block-foundation/CONTRACT.md MUST remain unchanged because
  B1 is producer-side mdx-bridge infrastructure that does not
  alter the BlockCoreDefinition shape (per the design choice
  in `## Critical design choice`). Location: shell.
- **TC13** (canonicalization rules — CONDITIONAL on
  `## Open questions for orchestrator (pre-lock)` Q2 disposition)
  Input: `grep -nE '^## Canonicalization rules'
  packages/mdx-bridge/CONTRACT.md`. Expected:
  - **IF orchestrator chooses include-in-B1**: ≥1 hit; section
    documents list-bullet `-` → `*` Wave 1 canonicalization
    behavior (which already happens via `bullet: '*'` in
    serialize.ts:62 of HEAD; B1 elevates this from
    implementation detail to documented invariant).
  - **IF orchestrator chooses defer-to-B2** (this PR's default):
    0 hits; CONTRACT.md edit 4 in `## files` is dropped from B1;
    item 5 carries to B2 with explicit allocation.
  Location: shell.

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — Wave 1 invariants extended;
  `## Forward-compat consumers (Wave 2+)` rewritten as
  `## Component block dispatch (Wave 3+)` (per-call injection
  pattern; no global setter; external-dispatch-table location;
  fixture-count-growing announcement; throw-site count climbs
  5 → 7); per `## files` edit-list bullet 6 for canonical
  delta enumeration.
- `packages/block-foundation/CONTRACT.md` — **NOT modified**
  (canonical claim; see `## files` "Explicitly NOT in `files:`"
  block + TC12). Line 28 "Serialize / parse hook ownership"
  prose at HEAD is the authority B1 honours; no edit needed.

## adr_touched

None.

The locked-plan `adr_touched: None` (line 381 of
`docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`)
is preserved by B1's design choice to dispatch via an
mdx-bridge-internal external table (option (b) per
`## Critical design choice`). The naive read of the locked plan
(option (a) — extend `BlockCoreDefinition` with `parseMdx?` /
`serializeMdx?` hooks) WOULD have triggered ADR-0009 D3 procedure
for a new ADR (a contract change to block-foundation per its
CONTRACT.md `## Modifying this file` rule "公共表面 …的任何字段或
方法增删改一律需 ADR — 包括添加 optional 字段"). B1's option (b)
sidesteps this entirely by keeping block-foundation's surface
unchanged — see `## Critical design choice` for the trade-off
analysis.

If the orchestrator OVERRIDES this PR's design choice and
demands option (a), then B1 stops, an ADR-0012 PR opens for the
BlockCoreDefinition extension, and B1 resumes after the ADR
merges. Flagged in `## Open questions for orchestrator
(pre-lock)` Q1.

## acceptance

1. mdx-bridge can dispatch `mdxJsxFlowElement` via per-call
   injection to any block-foundation-registered core that has a
   matching `registerJsxDispatch` entry — TC1 evidence.
2. NO global `setBlockRegistry` setter on mdx-bridge; the
   `BlockRegistry` reaches the walker exclusively through the
   `options` arg of `mdxToTiptap` / `tiptapToMdx` — TC6 evidence
   (parallel calls with distinct registries do not interfere).
3. Wave 1 fail-loud rule preserved + extended: throw site count
   climbs from 5 to 7 — TC2 + TC4 evidence — and the
   CONTRACT.md numeric prose updates per `## files` edit-list
   bullet 6 #3.
4. Nested component blocks round-trip byte-equivalent — TC5
   evidence.
5. CONTRACT.md `## Component block dispatch (Wave 3+)` section
   exists and replaces the previous `## Forward-compat consumers
   (Wave 2+)` section; mentions the fixture count growing
   through Stage B (B2-B8 each add ≥1 fixture per
   `block-foundation/CONTRACT.md` line 54-56 "Wave 2+ rule").
6. A5's `saveLoad.ts` `_options` underscore prefix dropped on
   both `saveToMdx` + `loadFromMdx`; both helpers thread
   `options` through to the mdx-bridge call — verified by
   `grep -nE '_options' packages/editor-shell/src/saveLoad.ts`
   returning 0 hits post-PR.
7. Three-way workspace-dep symmetry achieved: 1 declared =
   1 reference = ≥1 import. Per TC8.
8. Sister CONTRACT.md sync per ADR-0006 #6: 8 block-*/CONTRACT.md
   + block-foundation/CONTRACT.md unchanged. Per TC12.
9. mdx-bridge serialize.ts under 300 ESLint soft-warn line
   threshold post-edit (≤ ~295 lines projected). The pre-existing
   structure-audit acknowledgment of `serialize.ts:243`
   (docs/audits/structure-2026-05.md:84) remains accurate within
   the audit's natural Wave-close regen cadence; B1 does NOT
   author a second size-allowlist entry. (See the orchestrator
   `## B1 加压` brief: "B1 should NOT extend the allowlist
   twice".)
10. ADR-0009 D3 procedure NOT triggered because the design
    choice (per `## Critical design choice`) keeps
    `BlockCoreDefinition` surface unchanged. See
    `## adr_touched` for the alternative-path consequences.
11. D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires per the D2 row 1
    hit — see `## D2 trigger judgment` for canonical row state.

## D2 trigger judgment

Canonical row evaluation (single source of truth for row state;
all other sections reference this block via "per `## D2 trigger
judgment`"):

| Row | State | Rationale |
|---|---|---|
| Row 1 (CONTRACT.md change — high-value authority) | **HIT** | mdx-bridge/CONTRACT.md edited per `## files` (4 coordinated edits). |
| Row 2 (new package add/remove) | NO | No package added; only a workspace dep edge added to existing mdx-bridge package. |
| Row 3 (cross-package consumer = structural identity) | NO | mdx-bridge consumes `BlockRegistry` via type-import; per-block parse/serialize functions imported via dispatch-table consumers (B2-B8); B1 itself imports zero block-* code. |
| Row 4 (new ADR required) | NO | Design preserves block-foundation surface; per `## adr_touched` rationale. |
| Row 5 (cross ≥3 packages) | **HIT** | Producer-side infrastructure that 8 block-*/CONTRACT.md become indirect consumers of (via the dispatch-table contract); +editor-shell saveLoad.ts +block-foundation type import = 10+ packages indirectly affected. |
| Row 6 (test corpus authority change) | NO | No fixture added in B1 (B2-B8 each add one); the test corpus invariant is documented but not exercised here. |
| Row 7 (generated artifact regen) | NO | No `pnpm generate:configs` impact. |
| Row 8 (CI/deploy/auth/security) | NO | No CI/deploy/auth/security surface touched. |

**Effects** (single-source; do not restate elsewhere):

- Row 1 HIT → **D1 stage 4 PRE-COMMIT CLAUDE REVIEW MUST FIRE
  (mandatory)**. Orchestrator self-runs stage 4 between stage 3
  reviewer PASS and stage 5 commit.
- Row 5 HIT → heightened codex reviewer scrutiny within stage 3
  (ADR-0006 D8 explicit-file-list staging discipline + 8th-class
  hunt; the cross-package surface elevates row 1's already-
  elevated review depth).

Per the orchestrator `## B1 加压` brief, both rows are LOCKED
HIT at PLAN time and not negotiable downstream.

## executor

- **EXECUTE** (D1 stage 2): `codex-generic-executor` (Path A;
  first Wave 3 main-pipeline use of the codex profile post-PR
  Pre-B1 fix landing the merged `~/.codex/config.toml`). gpt-5.5
  + workspace-write sandbox.
- **REVIEW** (D1 stage 3): `codex-pr-reviewer-55` (Path A; first
  Wave 3 main-pipeline use of the canonical D1 stage 3 reviewer
  profile per ADR-0011 D6).
- **PRE-COMMIT CLAUDE REVIEW** (D1 stage 4 — fires per
  `## D2 trigger judgment` row 1 hit): orchestrator self
  (Claude Opus 4.7 1M ctx).
- **COMMIT** (D1 stage 5): `codex-pr-reviewer-55` bundles
  stage 5 per ADR-0011 D1 ("D4 Tier 2 process role 处置 —
  git-operator: 吸收进 codex reviewer commit phase"). ADR-0006
  D8 explicit-file-list 4-step protocol applies (per the
  `git-operator: explicit-file-list 4-step commit protocol +
  lockfile blob rule` MEMORY entry).
- **ACCEPT** (D1 stage 6): pr-writer Claude subagent (this
  agent's second invocation).

**Path B fallback** (transitional safety for high-stakes PR):
if stage 2 codex-generic-executor encounters a stdin-hang or
TOML-load regression, fall back to orchestrator self-EXECUTE
+ `pr-gate` REVIEW + orchestrator-self COMMIT. Path B retains
all the same TC1-TC13 verification gates; only the executor
identity changes. Document the fallback decision in the
commit message body if it triggers.

## Critical design choice

**Question**: how does mdx-bridge dispatch from
`mdxJsxFlowElement.name` (parse) or `TiptapNode.type`
(serialize) to the per-block `parse<Name>` / `serialize<Name>`
functions exported by each block-* package?

**Three options considered**:

- **(a)** Extend `BlockCoreDefinition` with optional
  `parseMdx?(node): TiptapNode` + `serializeMdx?(node):
  MdastJsxElement` hooks. Naive reading of the locked plan B1
  entry (lines 341, 345) suggests this — the snippet
  `getCore(node.name)?.parseMdx?.(node)` literally references
  hooks on the registry.
- **(b)** Keep an external dispatch table internal to
  mdx-bridge, keyed on `BlockCoreDefinition.mdxComponent`
  PascalCase strings. Block-* consumers (B2-B8) call
  `registerJsxDispatch({ mdxComponent, blockType, parse,
  serialize })` to wire their parse/serialize functions into
  mdx-bridge's dispatch surface.
- **(c)** Extend `BlockRegistry` with new methods
  `getJsxParse` / `getJsxSerialize` while leaving
  `BlockCoreDefinition` itself untouched. Hybrid (a)+(b).

**Decision**: **option (b)** — external dispatch table internal
to mdx-bridge.

**Rationale** (load-bearing, per
`block-foundation/CONTRACT.md:28` AUTHORITATIVE prose):

> "Serialize / parse hook ownership：MDX serialize/parse 由各
> block-* 包的 core/ own（ADR-0003 D1+D2），不在 block-foundation
> 注册。block-foundation 仅 own BlockCoreDefinition 形状（含
> mdxComponent 字符串）；mdx-bridge 通过 mdxJsxFlowElement.name
> 字符串路由到对应 block 的 export（命名约定 verb-as-prefix：
> serialize<BlockName> / parse<BlockName>，与 mdx-bridge 现有
> mdxToTiptap / tiptapToMdx 同 style）"

This prose at HEAD **explicitly forbids option (a)** and
**explicitly endorses an mdxComponent-string-keyed dispatch
mechanism living in mdx-bridge** — which is option (b). Per
the block-foundation `## Modifying this file` rule "公共表面
…的任何字段或方法增删改一律需 ADR — 包括添加 optional 字段",
option (a) would require a new ADR and a coordinated update
across all 8 block-* core implementations + downstream
consumers. The locked-plan B1 entry's `adr_touched: None`
disposition is INCONSISTENT with option (a) and CONSISTENT
with option (b).

Option (c) is rejected as a hybrid that adds two
non-orthogonal surfaces (registry knows about JSX dispatch
on top of core/ui registration) without solving any problem
option (b) does not solve.

**Trade-off analysis** of (b):

- **Pro 1**: respects block-foundation/CONTRACT.md:28
  authority with zero contract change → `adr_touched: None`
  preserved → no ADR-0009 D3 procedural detour.
- **Pro 2**: dispatch table is the natural locus for
  mdx-bridge's specialised concern (mdx ↔ tiptap routing);
  block-foundation stays generic (block lifecycle / UI
  layering). Crisp separation per ADR-0003 headless ↔
  presentational split logic, generalised to "headless
  registry ↔ specialised dispatch table".
- **Pro 3**: B2-B8 are uniformly trivial — each PR adds
  one `registerJsxDispatch({ ... })` call (in a
  per-block side-effect module, e.g.
  `block-callout/src/mdx-bridge-register.ts` — out-of-scope
  for B1 to author, but the registration site is forecast
  here for B2's PR.md template).
- **Con 1**: dispatch table is module-singleton
  (`new Map<>()` at module load). Two different
  `BlockRegistry` instances both registering a `'callout'`
  core BUT routing to different `parse<Name>` /
  `serialize<Name>` functions would require either a
  per-registry dispatch table OR a registration-scoping
  rule. **Mitigation**: the `mdxComponent` PascalCase string
  is global namespace by convention (per
  block-foundation/CONTRACT.md:23 "BlockCoreDefinition
  .mdxComponent 必须 PascalCase，且与 MDX 文件 import 中使用
  的名字一致"); two cores cannot share the same
  `mdxComponent` because the MDX import name is the JSX
  identifier consumers type. TC6 verifies parallel-call
  isolation under same-core-shared-dispatch — the use case
  the orchestrator brief flagged. Cross-tenant /
  multi-fork registration scenarios are explicitly
  out-of-scope for Wave 3 (the entire codebase is a single
  knowledge-base app); if future requirements demand
  per-registry dispatch, a follow-up ADR can extend the
  surface.
- **Con 2**: B1 adds a third API surface to
  mdx-bridge (`mdxToTiptap`, `tiptapToMdx`,
  `registerJsxDispatch`) which is one more thing for
  consumers to know about. **Mitigation**: B2-B8 register
  blocks one-time per process via a side-effect import; the
  `registerJsxDispatch` surface is consumer-rare even though
  it is public (similar to Tiptap's `Extension.create`
  one-time-per-process pattern).

**Reverse implication on locked plan**: locked-plan lines
341 + 345 say `blockRegistry.getCore(node.name)?.parseMdx?
.(node)` — this snippet is **literally inconsistent with
HEAD's block-foundation/registry.ts** (no `parseMdx` field)
**and inconsistent with HEAD's
block-foundation/CONTRACT.md:28** (forbids hooks on the
registry). The locked-plan snippet describes (a); the
locked-plan `adr_touched: None` describes (b). These are
contradictory; B1 resolves by honouring the latter (and the
prose around it: "因 the contract was forward-declared in
Wave 1 'Forward-compat consumers' prose" — the
forward-declared prose is the dispatch-string-keyed
external-table pattern at block-foundation/CONTRACT.md:28,
not a registry hook). Flagged in
`## Open questions for orchestrator (pre-lock)` Q1 for
explicit lock-time confirmation.

## Open questions for orchestrator (pre-lock)

**Q1** (load-bearing — design choice ratification):
The locked-plan B1 entry contains a snippet
`blockRegistry.getCore(node.name)?.parseMdx?.(node)` (lines
341 + 345) which describes option (a) — extending
`BlockCoreDefinition` with hooks. The same locked-plan entry
declares `adr_touched: None` (line 381) which is consistent
ONLY with option (b) — external dispatch table. B1 (this
PR.md) chooses option (b) per the
`block-foundation/CONTRACT.md:28` authority — see
`## Critical design choice`.

**Confirm**: orchestrator ratifies option (b) and accepts that
the locked-plan snippet is interpreted as
illustrative-pseudocode (the actual implementation is the
`registerJsxDispatch` external-table pattern), NOT as a
binding API contract.

If orchestrator instead demands option (a), B1 STOPS, ADR-0012
opens (`## adr_touched` shifts to `[ADR-0012]` and `## D2
trigger judgment` Row 4 flips HIT), B1 resumes after the ADR
merges via a separate D1 pipeline run.

**Q2** (low-stakes — Stage A retrospective item 5 disposition):
The orchestrator brief asks pr-writer to argue
include-in-B1 vs defer-to-B2 for the
`## Canonicalization rules` CONTRACT.md section documenting
list-bullet `-` → `*` Wave 1 canonicalization.

**B1's recommendation**: **defer to B2**. Rationale:
- B1 is already large (per `## files`; CONTRACT.md
  edits or near-CONTRACT-class — `mdx-bridge/CONTRACT.md`
  itself has 4 coordinated edits + the `_options` →
  `options` saveLoad.ts edit is a A5-ratifying
  follow-through). Adding a fifth CONTRACT.md edit (the
  canonicalization-rules section) inflates the PR's
  cognitive load without thematic coherence — list-bullet
  canonicalization is orthogonal to mdxJsxFlowElement
  routing infrastructure.
- B2 (callout fixture, the FIRST per-block fixture) is the
  natural moment to introduce a "canonicalization rules"
  section because B2's fixture exercises canonicalization
  empirically (a `<Callout>` source with surrounding
  prose-list content can demonstrate the `-` → `*`
  invariant in a single test fixture).
- The retrospective item 5 surface area is small (one prose
  paragraph in CONTRACT.md); the cost of deferring one
  PR's worth of work is negligible vs the SOTed-PR.md
  discipline gain of keeping B1 thematically tight.

**Confirm**: orchestrator ratifies defer-to-B2; if instead
orchestrator demands include-in-B1, the
`## files` CONTRACT.md edit-4 bullet activates and TC13
asserts presence; both are clearly delineated as conditional
in this PR.md.

## Out-of-scope (and why)

- **Per-block fixture (callout / code / image / math / pdf /
  jupyter / nn-viz / agent-flow)**: B2-B8 each add one. B1
  introduces only the dispatch infrastructure; no fixture
  exercises a real registered block-* in
  `__tests__/fixtures/`. The TC1 / TC5 in-test fixtures are
  inline string literals built in test setup, NOT fixture
  files committed to `__tests__/fixtures/` (those are
  per-block — see `block-foundation/CONTRACT.md` lines
  54-56 "Wave 2+ rule").
- **`registerJsxDispatch` calls in any block-* source
  package**: B2-B8 each add a one-line call in a
  side-effect module (e.g.
  `packages/block-callout/src/mdx-bridge-register.ts`).
  B1 does NOT pre-emptively author these — the dispatch
  surface is registered EMPTY at end of B1 (TC1-TC6 use
  test-local registration via the public API).
- **Extending `BlockCoreDefinition` with `parseMdx?` /
  `serializeMdx?` hooks**: REJECTED at design time per
  `## Critical design choice` option (a) analysis. If
  future ADR demands the change, a separate D1 pipeline
  run authors the ADR + the BlockCoreDefinition edit + a
  coordinated migration of all 8 block-* + the dispatch
  table → registry-hook bridge.
- **Global `setBlockRegistry(registry)` setter on
  mdx-bridge**: explicitly REJECTED per locked plan
  plan-challenger #9 + ADR-0011 D7 forward-compat hidden-
  state critique. Per-call `options` is the only injection
  channel. TC6 enforces.
- **mdx-doctor invocation**: Wave 3+ codex-mdx-doctor
  profile is the audit channel for fixture-shape
  invariants; B1 does not invoke it (no fixture changes).
  B2-B8 each trigger codex-mdx-doctor per ADR-0011 D5
  ("mdx-doctor 触发：mdx-bridge fixture change PR +
  Wave-close").
- **Performance regression check**: dispatch-table
  `Map<string, …>` lookup is O(1) per block; the +1
  hot-path branch in `mdastBlockToTiptap` /
  `tiptapToMdastBlock` is negligible. No
  codex-perf-auditor invocation in scope; Wave-close
  audit covers if needed.
- **Cross-tenant / multi-fork dispatch-table scoping**:
  see `## Critical design choice` Con 1 mitigation. Wave
  3 is single-tenant; future requirement triggers a
  follow-up ADR.

## Stage A → Stage B handoff note

A5 closed Stage A by exposing
`saveToMdx(editor, options?: { blockRegistry? })` +
`loadFromMdx(editor, source, options?: {...})` with the
`_options` underscore prefix indicating "accepted but
unused at this layer". A5's PR.md
(`docs/plans/wave-3-main/A5-editor-shell-save-load.md`
lines 99-102) explicitly forecast: "Once B1 lands the
per-call injection on mdx-bridge, A5's saveLoad updates
with a single-line change per call site
(`mdxToTiptap(source, options)` /
`tiptapToMdx(doc, options)`) and the underscore prefix is
dropped". B1 honours this by editing
`packages/editor-shell/src/saveLoad.ts` per the
`## files` edit-list bullet 7 — TC9 (typecheck) is the
gate that catches regressions.

This is the **only** producer-side Wave 3 main-pipeline PR
that touches editor-shell source as part of mdx-bridge
work; subsequent B2-B8 PRs add only fixtures + per-block
register-side-effect modules + (in B2 only, conditionally)
the canonicalization-rules CONTRACT.md prose. After B1,
editor-shell's API surface is stable through Stage B and
into Stage C unless / until apps/site routing surfaces a
new requirement.

## Related

- Spec: `docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md`
  §2.5 (block model) + §3.3 (round-trip invariants)
- Locked plan: `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`
  lines 326-403 (Stage B intro + B1 entry)
- ADR-0011 (linear pipeline + D2 schema v0.1.1):
  `docs/decisions/ADR-0011-linear-pipeline-execution-model.md`
- ADR-0008 D1 (dead-dep policy = tighten):
  `docs/decisions/ADR-0008-wave-2-entry-policies.md`
- ADR-0009 (BlockKind union expansion + D3 procedure):
  `docs/decisions/ADR-0009-block-kind-union-expansion.md`
- ADR-0006 (asymmetry audit checklist + #6 sister-doc sync
  + D8 staging discipline):
  `docs/decisions/ADR-0006-asymmetry-audit-checklist.md`
- ADR-0003 (headless ↔ presentational split):
  `docs/decisions/ADR-0003-headless-presentational-split.md`
- mdx-bridge contract: `packages/mdx-bridge/CONTRACT.md`
- block-foundation contract:
  `packages/block-foundation/CONTRACT.md` (line 28
  "Serialize / parse hook ownership" is the
  AUTHORITATIVE prose B1 honours)
- A5 PR.md: `docs/plans/wave-3-main/A5-editor-shell-save-load.md`
- Pre-B1 PR.md (SOTed v0.1.1 codification):
  `docs/plans/wave-3-main/Pre-B1-adr-0011-v0.1.1-amend.md`
- Structure audit (size acknowledgment of serialize.ts:243):
  `docs/audits/structure-2026-05.md` line 84
