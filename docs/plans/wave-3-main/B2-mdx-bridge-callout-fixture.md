# B2 — mdx-bridge callout fixture (first per-block round-trip)

> **Wave 3 main pipeline ninth PR (SECOND of Stage B).** Adds the FIRST per-block
> MDX fixture to `@skb/mdx-bridge`'s table-driven round-trip suite — `<Callout
> variant="note">…</Callout>` — exercising the dispatch infrastructure B1
> landed against the real `parseCallout` / `serializeCallout` exports of
> `@skb/block-callout`. Closes Stage A retrospective item 5 by adding a
> `## Canonicalization rules` section to `mdx-bridge/CONTRACT.md` documenting
> the `-` → `*` list-bullet observation + adjacent-same-mark merging
> cross-reference. Adds `@skb/block-callout` as mdx-bridge's first
> **devDependency** workspace edge (test-only consumption — runtime stays
> producer-side-clean per ADR-0008 D1 spirit; the production dispatch table
> remains empty at module-load and is registered test-locally).
>
> See `## Critical design choice` for the load-bearing test-only-devDep
> decision and `## Open questions for orchestrator (pre-lock)` for the one
> item the orchestrator must resolve before lock. SOTed-PR.md discipline
> per ADR-0011 v0.1.1 is mandatory; every factual claim canonicalised to a
> single section + cross-referenced elsewhere.

## title

Add `packages/mdx-bridge/src/__tests__/fixtures/22-callout.mdx` (the FIRST
component-block fixture in the Wave 1 prose corpus, growing it from 9 → 10
fixtures × 2 invariants = 20 RTT assertions); register the real
`parseCallout` / `serializeCallout` from `@skb/block-callout/core` into
mdx-bridge's dispatch table inside a `beforeAll(...)` hook in
`packages/mdx-bridge/src/__tests__/round-trip.test.ts`; thread a
`{ blockRegistry }` carrying `calloutCore` through to every `mdxToTiptap`
+ `tiptapToMdx` call in the table-driven assertion loop and the
`stripMdast` invariant loop; bump the CONTRACT.md fixture table from 9
rows to 10 with a row describing the callout fixture's coverage; add a
new `## Canonicalization rules` section to `mdx-bridge/CONTRACT.md`
documenting (a) the list-bullet `-` / `+` → `*` Wave 1 canonicalization
observed during Stage A A5 saveLoad RTT testing, (b) the
adjacent-same-mark merging cross-reference (`**a****b**` → `**ab**`,
authoritative description already inline at lines 80-105), and (c) the
fixture-corpus invariant that the `## Round-trip invariant` section
documents (`tiptapToMdx(mdxToTiptap(S)).trim() === S.trim()` for any
supported MDX `S` AND under stripped `_mdast`); add `@skb/block-callout`
as **devDependency** to `packages/mdx-bridge/package.json` (test-only
consumption — production dispatch table still empty at module-load; B2
registers test-locally inside a `beforeAll`); add matching
`tsconfig.json#references` entry; preserve B1's three-way symmetry
declared = referenced = imported (now becomes 1 + 1 = 2 declared edges
total, both symmetric). Closes Wave 3 locked-plan B2 entry (lines
446-455 of `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`)
+ Stage A retrospective item 5 (canonicalization-rules deferred from B1
per Q2 of `docs/plans/wave-3-main/B1-mdx-bridge-jsx-routing.md` lines
650-681).

## files

Created (NEW — 2 files: fixture + this PR.md):

- `packages/mdx-bridge/src/__tests__/fixtures/22-callout.mdx` *(NEW
  fixture file. ~10-15 LOC: standard frontmatter (`title:` + `date:`) +
  one `<Callout variant="note" title="Heads up">` block containing a
  single paragraph of plain text. Variant-without-title coverage stays
  in `block-callout/__tests__/core.test.ts` Wave 2 unit tests; B2's
  fixture exercises the WITH-title canonical shape — see locked plan
  line 453 "4 variants × {with title / without title} = 8 case grid
  but **1 fixture** capturing one canonical instance". Fixture
  filename `22-` per locked-plan line 446 numbering convention
  reserving 10-21 for Wave 2 sample-blocks slot and 22-29 for
  Stage B per-block fixtures.)*
- `docs/plans/wave-3-main/B2-mdx-bridge-callout-fixture.md` *(this
  PR.md; ADR-0006 D8 strict whitelist; PR #1 R2 lesson, repeated
  A1-A5 + Pre-B1 + B1)*

Modified (5 source/config files + 1 sibling-package test + 1 lockfile):

- `packages/mdx-bridge/src/__tests__/round-trip.test.ts` — three
  coordinated edits inside the existing top-level `describe('MDX <->
  Tiptap round-trip', …)` block (line 28 of HEAD):
  1. Add `import { calloutCore, parseCallout, serializeCallout } from
     '@skb/block-callout/core';` AND `import { BlockRegistry } from
     '@skb/block-foundation';` AND `import { registerJsxDispatch,
     getJsxDispatch } from '../index';` AND `import { beforeAll }
     from 'vitest';` at the top (existing imports preserved).
  2. Add a module-scoped `function buildCalloutOptions():
     MdxBridgeOptions` helper that constructs a fresh
     `BlockRegistry`, calls `registry.registerCore(calloutCore)`,
     and returns `{ blockRegistry: registry }`. Plus a `beforeAll`
     hook (idempotent guard pattern matching jsx-routing.test.ts
     line 33-37) that registers callout dispatch ONCE per
     test-file-run: `if (getJsxDispatch('Callout') === undefined)
     registerJsxDispatch({ mdxComponent: 'Callout', blockType:
     'callout', parse: parseCallout, serialize: serializeCallout
     });`. The cast is structurally safe: `parseCallout` accepts
     `CalloutMdastJsxElement` which is a structural subtype of
     mdx-bridge's `MdastJsxElement` (both extract from mdast's
     `mdxJsxFlowElement` shape); see `## Critical design choice`
     for the type-compat reasoning.
  3. Pass `buildCalloutOptions()` to BOTH `mdxToTiptap` calls and
     BOTH `tiptapToMdx` calls inside the existing two `for (const
     file of FIXTURES)` loops (lines 29-44 of HEAD). The same
     options instance is fine to share across the loop — the
     dispatch path is read-only per call (B1 TC6 verified parallel
     state isolation). Bump the `expect(FIXTURES.length)
     .toBeGreaterThanOrEqual(9)` assertion at line 48 from `>= 9`
     to `>= 10` reflecting the new fixture count.
  Estimated round-trip.test.ts delta: +18-22 LOC; resulting file
  ~170-180 lines (under 300 soft warn). The `marksEqual link
  comparator` describe-block (line 63) and `fail-loud contract`
  describe-block (line 101) are NOT touched — they exercise paths
  unrelated to component-block dispatch and continue to pass
  unchanged.
- `packages/mdx-bridge/CONTRACT.md` — three coordinated edits:
  1. Bump the fixture-count baseline announcement at line 43
     ("current baseline: 9 prose fixtures × 2 invariants = 18 RTT
     assertions") to "post-B2 baseline: 9 prose + 1 component
     fixture = 10 fixtures × 2 invariants = 20 RTT assertions".
     Cross-ref: `## Component block dispatch (Wave 3+)` already
     forecasts "fixture count growing in Stage B"; B2 is the
     first concrete realization.
  2. Add a 10th row to the fixture table at lines 47-56 of HEAD:
     `| `22-callout.mdx` | first component block — `<Callout
     variant title>` exercising real `parseCallout` /
     `serializeCallout` from `@skb/block-callout/core` via the
     B1 dispatch table |`. Numbering preserves locked-plan line
     446 ("packages/mdx-bridge/src/__tests__/fixtures/22-callout
     .mdx") with B-stage 22-29 reserved range.
  3. Add a new section `## Canonicalization rules` AFTER `##
     Component block dispatch (Wave 3+)` (last line of that
     section is line 192 of HEAD) and BEFORE `## Modifying this
     file / package` (line 142 of HEAD — note: `##
     Modifying...` predates `## Component block dispatch...` in
     current HEAD layout; the new section sits between them,
     pushing `## Modifying...` down). The new section enumerates
     three canonicalization invariants:
     - **List bullets**: input `-` / `+` → output `*`
       canonicalized via `remark-stringify`'s `bullet: '*'`
       option in serialize.ts:76. Observed during Stage A A5
       saveLoad RTT testing; documented now as a load-bearing
       invariant rather than implementation detail. Fixture
       evidence: `03-list.mdx` already uses `*` in Wave 1
       baseline, so existing RTT corpus exercises the canonical
       form (no regression risk in B2's fixture corpus).
     - **Adjacent same-mark merging**: shapes like `**a****b**`
       canonicalize to `**ab**` under the inline-grouper. The
       authoritative inline description already exists at lines
       80-105 of CONTRACT.md HEAD (the `marksEqual` paragraph
       + the same-href-same-title link sub-case); the new
       section cross-references those lines via prose ("see
       `marksEqual` paragraph above") rather than restating
       the rule (SOTed-PR.md discipline — single source).
     - **Round-trip invariant under stripped `_mdast`**: any
       supported MDX `S` satisfies `tiptapToMdx(stripMdast(
       mdxToTiptap(S))).trim() === S.trim()` IN ADDITION to the
       parsed-doc invariant. The authoritative inline
       description already exists at lines 31-37 of CONTRACT.md
       HEAD; the new section cross-references those lines
       ("see `## Round-trip invariant` invariant 2") rather
       than restating (single source).
  Estimated CONTRACT.md delta: +16-22 lines (1 line baseline
  bump + 1 row table grow + ~14-20 lines for new section
  including 3 bullets + cross-refs).
- `packages/mdx-bridge/package.json` — add `"@skb/block-callout":
  "workspace:*"` to `devDependencies` (NOT `dependencies` — see
  `## Critical design choice`). HEAD has no `devDependencies`
  block of workspace edges (only `@types/mdast` + `@types/node` +
  `typescript` + `vitest`). The new line preserves alphabetical
  ordering: `@skb/block-callout` precedes `@types/mdast`. Net
  delta: +1 line.
- `packages/mdx-bridge/tsconfig.json` — add `{ "path":
  "../block-callout" }` to the existing `references` array (line
  9 of HEAD already has `[{ "path": "../block-foundation" }]`
  from B1). New shape: `[{ "path": "../block-foundation" }, {
  "path": "../block-callout" }]`. The reference is required for
  test-time type resolution even though the dep is devOnly — TS
  project references serve typecheck; runtime devDep + tsconfig
  references stay in three-way symmetry per ADR-0008 D1
  generalised (declared in package.json + referenced in
  tsconfig + imported in src equates symmetric).
- `packages/mdx-bridge/src/__tests__/jsx-routing.test.ts` — sibling-package
  test rename: B2 R1 codex review caught a singleton-dispatch collision
  between B1's fake `Callout` mdxComponent registration and B2's real
  `Callout` registration. Forward-fix: rename B1's fake mdxComponent +
  MDX-fragment + dispatch-key from `Callout` → `TestCallout` (5 string
  sites + 5 MDX-fragment sites + 1 throw-error pattern updated to match).
  Test semantic preserved (still exercises dispatch infrastructure with
  synthetic component name); B2's real Callout dispatch key is now
  unambiguous regardless of test isolation mode.
- `pnpm-lock.yaml` — workspace graph mutation post `pnpm
  install` (the new `@skb/mdx-bridge` → `@skb/block-callout`
  workspace devDep edge). Restore from clean blob if
  contaminated per the `git-operator: explicit-file-list 4-step
  commit protocol + lockfile blob rule` MEMORY entry. B1
  observation noted in orchestrator brief: "lockfile
  cosmetic-reformat; orchestrator-side reset to main + local
  pnpm install yields clean delta" — same protocol applies.

= **8 files in canonical `## files` block** (2 NEW: 22-callout.mdx
+ this PR.md self-listed; 6 modified: round-trip.test.ts +
jsx-routing.test.ts + CONTRACT.md + package.json + tsconfig.json +
pnpm-lock.yaml; counts canonical here, cross-referenced as "per
`## files`" elsewhere).

**B1 deliverable touched (jsx-routing.test.ts)**: B2 R1 codex
review flagged a singleton-dispatch collision — B1's jsx-routing.test.ts
registered a fake `Callout` mdxComponent, conflicting with B2's real
`Callout` registration in round-trip.test.ts (visible under
`--isolate=false`). Forward-fix: rename B1's fake `Callout` →
`TestCallout` in jsx-routing.test.ts (5 string sites + 5 MDX-fragment
sites + 1 throw-error pattern). B1 test semantic preserved (still
exercises dispatch infrastructure); B2's real Callout key is
unambiguous.

**Explicitly NOT in `files:`** (verification-only, no edit):

- `packages/mdx-bridge/src/parse.ts` and `.../serialize.ts` —
  **NOT modified**. B1 already added the dispatch hot-path; B2
  exercises it via the existing call sites, no new branches
  needed. Verify at review:
  `git diff main -- packages/mdx-bridge/src/parse.ts
  packages/mdx-bridge/src/serialize.ts` returns empty.
- `packages/mdx-bridge/src/dispatch-table.ts` — **NOT modified**.
  B1's dispatch-table API is the consumed surface; B2 only
  registers an entry test-locally. Verify at review per the
  same `git diff main -- ...` empty-diff check.
- `packages/mdx-bridge/src/index.ts` — **NOT modified**. B1
  already exports `registerJsxDispatch` + `getJsxDispatch`; B2's
  test imports them from there. Verify per same.
- `packages/block-callout/src/core/parse.ts` and
  `.../serialize.ts` and `.../core-definition.ts` — **NOT
  modified**. The real exports are consumed AS-IS via the
  workspace devDep edge. Verify at review:
  `git diff main -- packages/block-callout/src/` returns empty.
- `packages/block-callout/CONTRACT.md` — **NOT modified**. The
  block-callout contract already forecasts mdx-bridge
  consumption (line 75 ff "Wave 3 mdx-bridge 路由集成 (pending)");
  B2's landing partially fulfills the forecast WITHOUT
  requiring contract change. Verify at review per same.
- `packages/editor-shell/src/saveLoad.ts` — **NOT modified**. B1
  already dropped the `_options` underscore prefix; B2 leaves
  editor-shell stable through Stage B per the B1 `## Stage A →
  Stage B handoff note` (lines 730-755 of B1's PR.md).
- `agent-contract.md` / `CLAUDE.md` / `AGENTS.md` / generated
  downstream — no agent-roster or workflow changes; B2 is pure
  fixture + test wiring + CONTRACT update. Source-of-truth is
  agent-contract.md; no derivative regen.

## test_cases

9 TCs (2 locked-plan TC1+TC2 + 7 operational TC3-TC9). Listed
canonically here; cross-referenced elsewhere as "TC<N> evidence".

- **TC1** (idempotent invariant — locked plan, line 424-425).
  Input: `pnpm --filter @skb/mdx-bridge test
  src/__tests__/round-trip.test.ts -t "22-callout"`. Setup:
  `beforeAll` registers callout dispatch + each iteration
  rebuilds `BlockRegistry` with `calloutCore`; the
  table-driven loop reads the fixture file, calls
  `mdxToTiptap(source, options)` then `tiptapToMdx(doc,
  options)`. Expected: PASS — `restored.trim() ===
  original.trim()`. Location:
  `packages/mdx-bridge/src/__tests__/round-trip.test.ts:30-35`
  (inside the existing first `for (const file of FIXTURES)`
  loop).
- **TC2** (lossless invariant under stripped `_mdast` — locked
  plan, line 426-427). Input: same vitest invocation; runs
  the second `for (const file of FIXTURES)` loop at lines
  38-44 of HEAD. Setup: same options as TC1. Expected: PASS —
  the stripMdast pass clears the outer callout's `_mdast`,
  forcing `serializeCallout(node)` to be invoked freshly via
  `tiptapComponentToMdast`; serializeCallout returns
  `mdxJsxFlowElement` with `children: node.content ?? []`
  passed through (which are the original mdast paragraph
  nodes that `parseCallout` set as `node.content`); remark-
  mdx + remark-stringify reconstruct byte-equivalent output.
  Critical detail: stripMdast only drops keys literally named
  `_mdast`; the inner mdast nodes inside `node.content` carry
  no such key (they ARE mdast nodes, not Tiptap nodes), so
  they survive the strip pass intact. Location: same file,
  lines 38-44.
- **TC3** (per-package vitest count). Input: `pnpm --filter
  @skb/mdx-bridge test --reporter=verbose 2>&1 | grep -E
  "Test Files|Tests"`. Expected: `Test Files` count = 2
  (existing `round-trip.test.ts` + existing `jsx-routing
  .test.ts` from B1, both unchanged file count); `Tests`
  count = HEAD-baseline + 2 (one new `it(...)` per fixture
  per loop = 2 new test cases for the callout fixture under
  both invariants). All pass. Location: shell at repo root.
- **TC4** (typecheck). Input: `pnpm typecheck`. Expected:
  exit 0. Notable trip-hazards under
  `exactOptionalPropertyTypes` (Wave 1 baseline, B1
  preserved):
  - `parseCallout` accepts `CalloutMdastJsxElement` (defined
    in block-callout/src/core/serialize.ts:15) which has
    `attributes: ReadonlyArray<{type:'mdxJsxAttribute',
    name:string, value:string}>` — STRICTER than
    mdx-bridge's `MdastJsxElement` whose `value` permits
    `string | MdxJsxAttributeValueExpression | null`.
    Therefore the `parse` field of the dispatch entry is
    contravariant — a `(node: CalloutMdastJsxElement) =>
    CalloutTiptapNode` function CAN'T be assigned directly
    to `(node: MdastJsxElement) => TiptapNode` without a
    cast, because `MdastJsxElement` is a wider input. **The
    cast IS sound at runtime** because B1's
    `mdastJsxFlowElementToTiptap` (parse.ts:127-143) only
    invokes the parse function when `core.mdxComponent ===
    componentName === 'Callout'` AND mdx-bridge's source
    happens to be authored with `variant="note"` style
    attributes (string values, no MDX expressions). The
    fixture file (22-callout.mdx) uses literal-string
    attributes only — no `{...}` expression-attrs — so the
    runtime values fit the stricter `CalloutMdastJsxElement`
    shape. The cast site is the `registerJsxDispatch({...})`
    call inside `beforeAll` (round-trip.test.ts new code);
    the cast pattern is `parse: parseCallout as
    JsxDispatchEntry['parse']` (matching jsx-routing.test.ts
    line 39's already-cast-shaped helper, modulo the inline
    function form that file uses to dodge the stricter
    block-callout types). Same contravariant pattern applies
    to `serialize: serializeCallout as
    JsxDispatchEntry['serialize']`.
  - `CalloutTiptapNode` (block-callout/src/core/serialize
    .ts:9) declares `readonly type: 'callout'` + `readonly
    attrs: { readonly variant: string; readonly title?:
    string }` + `readonly content?: readonly unknown[]`.
    mdx-bridge's `TiptapNode` declares `type: string` +
    `attrs?: Record<string, unknown>` + `content?:
    TiptapNode[]`. The return-type cast widens `readonly` to
    mutable, narrows `'callout'` to `string`, and converts
    `readonly unknown[]` to `TiptapNode[]`. Runtime-sound
    because the produced object's keys structurally match
    TiptapNode (just stricter); TS structural checking
    plus the explicit cast makes this trivially typecheck.
  Location: shell.
- **TC5** (root pnpm check). Input: `pnpm check` (or
  `pnpm check:affected`). Expected: exit 0; lint + typecheck
  + test + build + size-check all pass; size-check confirms
  no source file crosses 500-line hard limit. Location:
  shell.
- **TC6** (CONTRACT.md fixture table grew exactly 1 row —
  locked plan acceptance bullet 3). Input: `awk
  '/^\| `[0-9]/ {n++} END {print n}'
  packages/mdx-bridge/CONTRACT.md`. Expected: `10` (HEAD =
  9 prose + B2 = 1 callout). Location: shell.
- **TC7** (three-way dep symmetry — ADR-0008 D1
  generalised to devDeps). Input:
  ```
  jq -r '(.dependencies // {}) | keys[]'
    packages/mdx-bridge/package.json | grep '^@skb/' | wc -l
  jq -r '(.devDependencies // {}) | keys[]'
    packages/mdx-bridge/package.json | grep '^@skb/' | wc -l
  jq -r '.references[]?.path'
    packages/mdx-bridge/tsconfig.json | wc -l
  grep -rn "from '@skb/block-callout" packages/mdx-bridge |
    wc -l
  ```
  Expected: declared-deps = 1 (`@skb/block-foundation`,
  unchanged from B1), declared-devDeps = 1
  (`@skb/block-callout`, B2-new), references = 2 (both
  paths), source imports of block-callout = 1 (the import in
  round-trip.test.ts only — production source remains
  block-callout-free). Symmetric. Pre-B2 baseline: deps = 1,
  devDeps = 0, references = 1, imports = 0. Post-B2: deps =
  1, devDeps = 1, references = 2, imports = 1. The deps +
  devDeps total = 2, references count = 2, declared-side
  matched. Location: shell.
- **TC8** (lockfile idempotency). Input: `pnpm install
  --frozen-lockfile=false` (post-edit), then `git diff
  pnpm-lock.yaml`. Expected: no further diff after the
  initial workspace-edge add. Location: shell.
- **TC9** (Stage A item 5 — `## Canonicalization rules`
  section present). Input: `grep -nE '^##
  Canonicalization rules' packages/mdx-bridge/CONTRACT.md`.
  Expected: ≥1 hit. Sub-grep verifies bullet content:
  `grep -A 30 '^## Canonicalization rules$'
  packages/mdx-bridge/CONTRACT.md | grep -E 'List
  bullets.*-.*\*|Adjacent same-mark|stripped`. Expected: 3
  bullet labels matched. Location: shell.

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — Wave 1 baseline
  fixture-count prose updated; fixture table grows 9 → 10;
  new `## Canonicalization rules` section added (Stage A
  retrospective item 5 closeout); per `## files` edit-list
  bullet 2 for canonical delta enumeration.
- `packages/block-callout/CONTRACT.md` — **NOT modified**
  (canonical claim; see `## files` "Explicitly NOT in
  `files:`" block + TC7's source-import scope check). The
  block-callout contract's `## Wave 3 mdx-bridge 路由集成
  (pending)` section (lines 75-87 of HEAD) remains
  forecast prose; B1+B2 jointly partially-fulfill the
  forecast (B1 = routing infra; B2 = first fixture
  consumer) but the forecast prose itself need not be
  edited until Wave 3 close (when all 8 block-* fixtures
  have landed and the "pending" qualifier becomes
  "complete").

## adr_touched

None.

The locked-plan `adr_touched: None` (line 431 of
`docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`)
is preserved by B2's design choice to consume block-callout
as a **devDependency only** (per `## Critical design
choice`). The naive read (mdx-bridge depends on block-callout
as a runtime dep) WOULD have created a producer-consumer
inversion that block-foundation/CONTRACT.md:28 explicitly
forbids ("MDX serialize/parse 由各 block-* 包的 core/ own ...
不在 block-foundation 注册" — and by transitivity, mdx-bridge
must not consume block-* as runtime deps either, only via
the dispatch-table indirection B1 introduced). devDep
consumption sidesteps this: block-callout is imported only
inside `__tests__/`, the production bundle of mdx-bridge
remains block-*-free. See `## Critical design choice` for
the trade-off analysis.

## acceptance

1. mdx-bridge's table-driven round-trip suite covers
   `<Callout variant="note" title="...">` byte-equivalently
   under both invariants — TC1 + TC2 evidence. (Locked-plan
   acceptance bullet 1+2.)
2. mdx-bridge CONTRACT.md fixture table grew by exactly 1
   row (9 → 10) — TC6 evidence. (Locked-plan acceptance
   bullet 3.)
3. The new fixture file is named exactly
   `22-callout.mdx` per locked-plan line 446 numbering
   convention; reserved-range 22-29 for Stage B per-block
   fixtures preserved.
4. `## Canonicalization rules` section added to
   mdx-bridge/CONTRACT.md, documenting the 3 invariants
   (list-bullet `-` → `*`, adjacent-same-mark merging
   cross-ref, stripped-`_mdast` cross-ref) — TC9 evidence.
   (Stage A retrospective item 5 closeout per user
   direction; B1 deferred per Q2 — see `## Open questions
   for orchestrator (pre-lock)` for B2's confirmation
   that this section now lands here.)
5. `@skb/block-callout` consumed as devDependency only;
   mdx-bridge production bundle remains block-*-free —
   TC7 evidence (source-import count of block-callout =
   1, scoped to `__tests__/`).
6. Three-way dep symmetry achieved across deps + devDeps:
   declared = 2 (1 dep + 1 devDep), referenced = 2 paths,
   imported ≥ 2 (block-foundation runtime + block-callout
   test-only). Per TC7.
7. Sister CONTRACT.md sync per ADR-0006 #6:
   block-callout/CONTRACT.md unchanged (forecast prose
   not yet promoted to "complete" until Wave 3 close).
8. All Wave 1 prose fixtures (01-paragraph through
   09-link-title-comparator) continue to round-trip
   byte-equivalently through the now-options-passing test
   loop; the NEW options arg is harmless for prose
   fixtures because `mdastBlockToTiptap` short-circuits
   on the `mdxJsxFlowElement` case only when the node
   type matches — prose paths never reach
   `mdastJsxFlowElementToTiptap` and never consult
   `options.blockRegistry`. Verified by TC3 (full
   per-package vitest count = baseline + 2 new tests, no
   regressions on the 18 existing fixture assertions).
9. mdx-doctor (codex profile) green — Wave 3+ codex-mdx-doctor
   audit channel for fixture-shape invariants per ADR-0011
   D5 ("mdx-doctor 触发：mdx-bridge fixture change PR +
   Wave-close"). B2's fixture-add MUST trigger an
   mdx-doctor pass within stage 3 reviewer scrutiny;
   mdx-doctor verifies both round-trip invariants on the
   new fixture independently of the vitest suite, providing
   a cross-tool corroboration check.
10. D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires per the D2
    row 1 hit — see `## D2 trigger judgment` for canonical
    row state. (Locked plan B-stage template line 439-441:
    "D2 trigger: Row 1 (CONTRACT.md fixture table change).
    D1 stage 4 fires per-PR. mdx-doctor (codex-mdx-doctor)
    MUST also run — fixture addition trigger." — both
    requirements honoured.)

## D2 trigger judgment

Canonical row evaluation (single source of truth for row
state; all other sections reference this block via "per
`## D2 trigger judgment`"):

| Row | State | Rationale |
|---|---|---|
| Row 1 (CONTRACT.md change — high-value authority) | **HIT** | mdx-bridge/CONTRACT.md edited per `## files` (3 coordinated edits: fixture-count prose bump + table row + new section). |
| Row 2 (new package add/remove) | NO | No package added; only a workspace devDep edge added to existing mdx-bridge package. |
| Row 3 (cross-package consumer = structural identity) | NO | mdx-bridge consumes `parseCallout` / `serializeCallout` / `calloutCore` from block-callout AS-IS (no inline re-author of the schema or types — the imports pull the canonical definitions per `block-callout/CONTRACT.md` line 67-69 "propsSchema single authority" rule). The dispatch-table contract from B1 governs the parse/serialize signatures; B2 honours B1's public surface without restating the contract types. |
| Row 4 (new ADR required) | NO | Design preserves block-foundation surface AND mdx-bridge runtime-dep policy; per `## adr_touched` rationale. |
| Row 5 (cross ≥3 packages) | NO | mdx-bridge + block-callout = 2 packages; pnpm-lock.yaml + tsconfig refs are config-class artifacts, not separate packages. Below the 3-package threshold. |
| Row 6 (test corpus authority change) | NO | Adding 1 fixture grows the corpus by 1 row but does NOT change the test-corpus invariant prose at `## Round-trip invariant` (lines 22-44 of CONTRACT.md HEAD); the invariant statement is unchanged, only the row-count baseline. Under SOTed-PR.md, "fixture corpus authority change" means amending the invariant prose (e.g. relaxing byte-equivalence) — B2 does the opposite (extends corpus to validate the invariant on a new shape). |
| Row 7 (generated artifact regen) | NO | No `pnpm generate:configs` impact. |
| Row 8 (CI/deploy/auth/security) | NO | No CI/deploy/auth/security surface touched. |

**Effects** (single-source; do not restate elsewhere):

- Row 1 HIT → **D1 stage 4 PRE-COMMIT CLAUDE REVIEW MUST
  FIRE (mandatory)**. Orchestrator self-runs stage 4
  between stage 3 reviewer PASS and stage 5 commit.
- Locked-plan B-stage template line 440-441 also
  requires mdx-doctor (codex-mdx-doctor profile) to fire
  on every fixture-add PR. Per ADR-0011 D5
  ("mdx-doctor 触发：mdx-bridge fixture change PR +
  Wave-close"), this is a stage 3 add-on audit; the
  reviewer codex profile (`codex-pr-reviewer-55`) bundles
  the line-level review while orchestrator
  also dispatches `codex-mdx-doctor` against the same diff
  for the fixture-shape invariant cross-check.

## executor

- **EXECUTE** (D1 stage 2): `codex-generic-executor`
  (Path A; second Wave 3 main-pipeline use post B1's
  first-use observation re lockfile cosmetic-reformat —
  per orchestrator brief: "B1 first-use observations:
  lockfile cosmetic-reformat; orchestrator-side reset to
  main + local pnpm install yields clean delta. Apply
  same protocol."). gpt-5.5 + workspace-write sandbox.
- **REVIEW** (D1 stage 3): `codex-pr-reviewer-55`
  (Path A; second Wave 3 main-pipeline use of the
  canonical D1 stage 3 reviewer profile per ADR-0011
  D6). Plus `codex-mdx-doctor` audit add-on per locked
  plan B-stage template — see `## D2 trigger judgment`
  Effects bullet 2.
- **PRE-COMMIT CLAUDE REVIEW** (D1 stage 4 — fires per
  `## D2 trigger judgment` row 1 hit): orchestrator
  self (Claude Opus 4.7 1M ctx).
- **COMMIT** (D1 stage 5): `codex-pr-reviewer-55`
  bundles stage 5 per ADR-0011 D1 ("D4 Tier 2 process
  role 处置 — git-operator: 吸收进 codex reviewer commit
  phase"). ADR-0006 D8 explicit-file-list 4-step
  protocol applies (per the `git-operator:
  explicit-file-list 4-step commit protocol + lockfile
  blob rule` MEMORY entry).
- **ACCEPT** (D1 stage 6): pr-writer Claude subagent
  (this agent's second invocation).

**Path B fallback** (transitional safety): if stage 2
codex-generic-executor encounters stdin-hang or TOML-load
regression, fall back to orchestrator self-EXECUTE +
`codex-pr-reviewer-55` REVIEW + orchestrator-self
COMMIT. Path B retains all the same TC1-TC9
verification gates; only the executor identity changes.
Document the fallback decision in the commit message
body if it triggers.

## Critical design choice

**Question**: how does mdx-bridge's round-trip test
import the real `parseCallout` / `serializeCallout`
exports from block-callout WITHOUT introducing a
producer-side runtime dependency on a downstream block
package?

**Three options considered**:

- **(a)** Add `@skb/block-callout` as a runtime
  `dependency` in mdx-bridge/package.json. Imports the
  real code; production bundle includes block-callout.
- **(b)** Add `@skb/block-callout` as a `devDependency`
  in mdx-bridge/package.json. Imports the real code in
  test files only; production bundle stays
  block-*-free.
- **(c)** Don't add the dep at all; reuse the inline
  test-local fakes from B1's jsx-routing.test.ts (lines
  13-109) inside round-trip.test.ts. No dep edge; tests
  validate dispatch wiring with synthetic
  parse/serialize functions of the same shape.

**Decision**: **option (b)** — devDependency.

**Rationale** (load-bearing, per ADR-0008 D1 +
block-foundation/CONTRACT.md:28 spirit):

- **Option (a) rejected**: producer-side runtime dep on
  consumer-side blocks creates a circular conceptual
  coupling. The Wave 3 architecture (per
  block-foundation/CONTRACT.md:28 "MDX serialize/parse
  由各 block-* 包的 core/ own ... 不在 block-foundation
  注册") establishes that block-* packages are
  CONSUMERS of mdx-bridge's dispatch surface, not the
  reverse. mdx-bridge runtime depending on block-callout
  would mean "the bridge knows about its first
  customer" at the package-graph level — every future
  block-* (block-code, block-image, ..., block-jupyter)
  would either need a similar runtime edge (8 edges
  total = full N×M coupling) or face an asymmetric
  privilege puzzle where block-callout is the only one
  hard-wired. Both outcomes violate the "external
  dispatch table" pattern B1 chose specifically to
  AVOID this coupling.
- **Option (c) rejected**: synthetic fakes worked for
  B1 (testing the dispatch infrastructure without
  needing real blocks) but for B2's purpose — RTT a
  REAL fixture against the REAL block-callout — fakes
  would give a false-positive: the fixture might
  round-trip via a fake parser/serializer but FAIL
  against the real ones if their canonicalization
  behavior diverges (e.g. real parseCallout calls
  `propsSchema.parse(rawProps)` which RUN-TIME-VALIDATES
  the variant enum and throws on unknowns; a fake might
  silently accept any string). The `block-callout/
  CONTRACT.md:70-71` "Self-validating serialize/parse"
  invariant is exactly the property B2 must verify under
  RTT. Real consumption is required.
- **Option (b) chosen**: devDep gives real
  consumption + zero runtime coupling. The production
  bundle of mdx-bridge (the artifact `apps/site` and
  `editor-shell` actually load) imports zero block-*
  code. Test-time only, the workspace edge resolves
  block-callout's source files for compilation +
  vitest run. This preserves the architectural
  separation while letting B2's RTT actually validate
  the real parse/serialize chain.

**Trade-off analysis** of (b):

- **Pro 1**: real validation per locked-plan B-stage
  template line 446-450 "New fixture round-trips
  byte-equivalently / Both invariants pass for the
  new fixture / mdx-doctor green" — these are
  properties of the REAL parse/serialize functions,
  not of fakes.
- **Pro 2**: pattern reusable for B3-B8: each
  subsequent fixture PR can add its block-* package
  as a devDep following the same shape. By Wave 3
  close, mdx-bridge devDeps = 8 block-* packages,
  runtime deps = 1 (block-foundation only). This
  asymmetry is INTENDED — it advertises at the
  package-graph level which deps are "real producer-
  side" (foundation, owns BlockRegistry) vs "test
  fixtures only" (each block).
- **Pro 3**: B1's jsx-routing.test.ts pattern (test-
  local registration via a `beforeAll` idempotent
  guard) reuses cleanly. round-trip.test.ts adopts
  the same `beforeAll` + `getJsxDispatch('Callout')
  === undefined` guard so B2 + B3-B8 can each add
  their `registerJsxDispatch({...})` calls without
  collision. The dispatch table is module-singleton
  per B1's `## Critical design choice`, so multiple
  test files registering the same component is
  idempotent.
- **Con 1**: contravariant type-cast at the
  `registerJsxDispatch({...})` call site. The real
  `parseCallout`'s parameter type
  `CalloutMdastJsxElement` (block-callout/src/core/
  serialize.ts:15) has stricter `attributes` value
  type (`string` only) than mdx-bridge's
  `MdastJsxElement` (`string | MdxJsxAttributeValue
  Expression | null` per remark-mdx's mdast extension).
  The dispatch entry is therefore typed contravariantly
  — `parseCallout` accepts a NARROWER input but the
  dispatch protocol requires acceptance of a WIDER
  input. **Mitigation**: cast at the registration site
  (`parse: parseCallout as JsxDispatchEntry['parse']`).
  Sound at runtime because the fixture file uses only
  literal-string attributes (TC4 documents this), and
  if a future fixture uses an expression-attr like
  `<Callout variant={someVar}>`, parseCallout's
  `propsSchema.parse(rawProps)` will throw because
  `rawProps[name]` would be `undefined` (the
  Mdx-attribute-value-expression branch isn't unpacked
  by parseCallout). The throw is the desired
  fail-loud behavior. Same contravariant story for
  serializeCallout's return type `CalloutMdastJsxElement`
  vs the dispatch protocol's `MdastJsxElement` — narrower
  return is safe to widen.
- **Con 2**: introduces test-time circular-graph risk:
  block-callout's package.json depends on
  block-foundation, and now mdx-bridge devDepends on
  block-callout, while mdx-bridge runtime-depends on
  block-foundation. The graph remains acyclic because
  block-callout does NOT depend on mdx-bridge in either
  direction (verified at HEAD: `cat
  packages/block-callout/package.json | jq
  '.dependencies, .devDependencies'` shows zero
  references to `@skb/mdx-bridge`). The
  `mdx-bridge → block-callout (devDep) → block-foundation
  (dep)` chain is a tree, not a cycle. Future block-*
  PRs (B3-B8) need to preserve this acyclicity at each
  add — verification step folded into the per-PR
  template's TC7-equivalent.

**Reverse implication on locked plan**: locked-plan B2
entry (lines 415-465 of the wave plan) prose is silent
on the dep-edge mechanism for block-callout
consumption — it only specifies the fixture-add
acceptance criteria. B2 (this PR.md) chooses option
(b) per the architectural reasoning above; the
locked plan's silence is taken as
"orchestrator-decision-deferred-to-PR.md", not as
endorsement of (a) or (c). Flagged in
`## Open questions for orchestrator (pre-lock)` Q1
for explicit lock-time confirmation.

## Open questions for orchestrator (pre-lock)

**Q1** (load-bearing — devDep choice ratification):
The locked-plan B2 entry is silent on whether
block-callout becomes a runtime dep, devDep, or no
dep at all in mdx-bridge. B2 (this PR.md) chooses
**devDep** per the architectural reasoning at
`## Critical design choice`. This is the load-
bearing decision that determines the per-PR template
shape for B3-B8 (each adds its block-* package as a
devDep following the same pattern; if Q1 resolves
differently, all 7 subsequent PR.md templates need
re-shaping).

**Confirm**: orchestrator ratifies devDep, AND accepts
that future B3-B8 PRs will each add their respective
block-* package as a devDep on mdx-bridge (mdx-bridge
devDeps reach 8 entries by Wave 3 close — tracked in
`## acceptance` bullet 5+6 + the runtime-deps stay at
1 entry: block-foundation).

If orchestrator instead demands runtime dep (option a)
or no dep (option c), B2 stops, this PR.md is rewritten
under the new constraint, and B2 resumes via a separate
D1 pipeline run.

**Q2** (low-stakes — fixture content variant
selection): The locked plan line 453 says "4 variants
× {with title / without title} = 8 case grid but **1
fixture** capturing one canonical instance". B2 picks
`variant="note" title="Heads up"` as the canonical
instance. This is the **default-variant + with-title**
shape, exercising the fullest surface (all
propsSchema fields populated). Other variants
(`tip`/`warning`/`danger`) and the without-title
shape are covered by `block-callout/__tests__/
core.test.ts` Wave 2 unit tests + the variant
scaling will be picked up by the canonicalization-
rules section's reference to `block-callout/CONTRACT
.md:32-34` for the propsSchema authority.

**Confirm**: orchestrator ratifies the "note + with
title" canonical instance, OR specifies an alternative
variant (e.g. `warning` if the orchestrator wants the
fixture to exercise the visually-most-distinct
variant). Either choice fits the per-PR template and
the test infrastructure.

## Out-of-scope (and why)

- **Per-fixture file additions for code / image /
  math / pdf / jupyter / nn-viz / agent-flow blocks**:
  B3-B8 each add one fixture using B2's pattern
  (devDep + register-in-beforeAll + table-driven RTT).
  B2 introduces only the FIRST per-block fixture; the
  9 subsequent fixtures are owned by B3-B8.
- **Per-block side-effect register module
  (`packages/block-callout/src/mdx-bridge-register.ts`
  or similar)**: B1's `## Out-of-scope` (lines 692-700
  of B1's PR.md) forecast that B2-B8 each add such a
  module. **B2 supersedes this forecast** with a
  test-local-only registration approach (see
  `## Critical design choice` Pro 3 + the
  `beforeAll` idempotent guard in `## files` round-
  trip.test.ts edit 2). Production-side mdx-bridge
  dispatch table remains EMPTY at module-load time
  through the entire Wave 3 cycle; the dispatch
  registration is performed by **apps/site** (Stage C
  C1 — `apps/site/src/components.ts` or its boot
  module will register all 8 components) and by
  **editor-shell** consumers similarly. This is a
  TIGHTENING of B1's forecast: B1 said "B2-B8 each add
  a one-liner registerJsxDispatch call in a per-block
  side-effect module"; B2 instead establishes that
  registration is the **consumer's** responsibility
  (apps/site / editor-shell at boot), not the
  block-* package's responsibility. The side-effect
  module pattern is unnecessary indirection. Flagged
  in `## Open questions for orchestrator (pre-lock)`
  Q1 conditionally — if Q1 resolves devDep, this
  tightening lands; if Q1 resolves differently, the
  side-effect-module forecast may need revival.
- **mdx-bridge runtime dep on block-callout**:
  REJECTED at design time per `## Critical design
  choice` option (a) analysis. devDep only — see
  Q1.
- **Removal of B1's jsx-routing.test.ts inline
  fakes**: the synthetic `parseCallout` /
  `serializeCallout` defined inline in B1's
  jsx-routing.test.ts (lines 39-91) are KEPT
  unchanged. They serve B1's purpose (testing
  dispatch infrastructure with a controlled fake
  that has the SAME shape as the real exports);
  replacing them with the real imports would
  conflate B1's infrastructure tests with B2's
  fixture tests. The two test files exercise
  orthogonal concerns: jsx-routing.test.ts tests
  the dispatch table + signature contract;
  round-trip.test.ts tests the real parse/serialize
  chain end-to-end on a fixture. Verify at
  review: `git diff main -- packages/mdx-bridge/
  src/__tests__/jsx-routing.test.ts` returns empty.
- **Modifying the mdx-doctor Codex profile config**:
  the `codex-mdx-doctor` profile is invoked AS-IS
  per ADR-0011 D5; B2 does not author profile
  changes. mdx-doctor's invariant-checking shape is
  out-of-scope (stays the same as Wave 1+2 baseline).
- **Performance regression check**: B2 adds 1
  fixture × 2 invariants = 2 RTT runs to the suite.
  Negligible. No codex-perf-auditor invocation in
  scope; Wave-close audit covers if needed.
- **Cross-tenant / multi-fork dispatch-table
  scoping**: B1's `## Critical design choice` Con 1
  mitigation applies unchanged; B2 reaffirms
  parallel-call isolation via the `beforeAll`
  idempotent guard pattern (multiple test files
  registering the same component is idempotent).
- **Stage A retrospective items 1-4 + 6+**: item 5
  (canonicalization-rules CONTRACT section) is the
  only retrospective item B2 closes. Items 1-4 and
  6+ are out-of-scope here; tracked in
  orchestrator-side wave-3 retrospective notes.

## Stage A retrospective item 5 closeout

Per the user direction in the orchestrator brief
(`Stage A retrospective item 5 — list-bullet
canonicalization (per user direction, lands in B1
OR B2 commit; B1 deferred per locked decision; B2
IS the home)`), B2 is the home for item 5. The
implementation is captured in `## files` CONTRACT.md
edit 3 (the new `## Canonicalization rules` section)
with three bullets:

1. **List bullets `-` / `+` → `*`**: Wave 1
   `serialize.ts:76` configures `remark-stringify`
   with `bullet: '*'`. This canonicalizes input
   variation in bullet markers to a single output
   form. Existing fixture `03-list.mdx` already
   uses `*` so the Wave 1 corpus exercises the
   canonical form (no fixture changes needed; the
   invariant is documentation-only, formalising
   what `serialize.ts` already does).
2. **Adjacent same-mark merging**: cross-reference
   to the existing inline description at lines
   80-105 of `mdx-bridge/CONTRACT.md` (`marksEqual`
   + the same-href-same-title link sub-case +
   `**a****b**` → `**ab**` example). Single source;
   the new section restates the rule's NAME but
   defers to the inline section for the rule's
   STATEMENT.
3. **Round-trip invariant under stripped `_mdast`**:
   cross-reference to the existing `## Round-trip
   invariant` invariant 2 at lines 31-37. Single
   source; the new section restates the rule's
   NAME but defers.

The section's purpose is **discoverability**: a
contributor adding a new fixture can find a single
top-level section listing all canonicalization
behaviors mdx-bridge enforces, rather than
hunting through inline prose. The 3 bullets cover
the three observed canonicalization rules at Wave
3 B2 boundary; future Stage B PRs (B3-B8) and
Wave-close audits may extend the list.

Position decision: per the orchestrator brief
("Position: after `## Component block dispatch
(Wave 3+)` (B1 added) + before `## Modifying this
file`"), the new section sits between
`## Component block dispatch (Wave 3+)` (which is
the LAST section in HEAD before `## Related`) and
`## Modifying this file / package` (which
predates the dispatch section in HEAD). The
canonical post-B2 section order is:
- `## Public surface`
- `## Round-trip invariant`
- `## Implementation notes`
- `## Component block dispatch (Wave 3+)` (B1)
- `## Canonicalization rules` (NEW B2)
- `## Modifying this file / package`
- `## Related`

Flagged in `## files` CONTRACT.md edit 3 prose
explicitly.

## Stage B → Stage B handoff note

B1 + B2 jointly establish the Stage B per-block
fixture template:

- B1: dispatch infrastructure + per-call
  `BlockRegistry` injection + `registerJsxDispatch`
  API. No fixtures.
- B2: FIRST fixture (callout) + devDep pattern +
  `beforeAll` registration shape + canonicalization-
  rules CONTRACT section.

B3-B8 are mechanical applications of the B2 pattern,
each landing one fixture file + one devDep
(corresponding block-* package) + one register-in-
beforeAll line + one CONTRACT.md fixture-table row.
B2's `## Critical design choice` Pro 3 and Con 2
analysis carry forward unchanged.

The `## Canonicalization rules` section
established by B2 may grow during B3-B8 if those
PRs surface additional canonicalization behaviors
unique to their block (e.g. KaTeX expression
canonicalization in B5 math). Each subsequent
PR's `## files` block will declare a CONTRACT.md
edit only if a NEW canonicalization rule is
observed; otherwise the section remains stable
through Stage B.

## Related

- Spec: `docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md`
  §2.5 (block model) + §3.3 (round-trip
  invariants)
- Locked plan: `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`
  lines 415-465 (Stage B intro + B2 entry +
  B-stage per-PR template)
- ADR-0011 (linear pipeline + D2 schema v0.1.1):
  `docs/decisions/ADR-0011-linear-pipeline-execution-model.md`
- ADR-0008 D1 (dead-dep policy = tighten;
  generalised to devDeps in B2):
  `docs/decisions/ADR-0008-wave-2-entry-policies.md`
- ADR-0006 (asymmetry audit checklist + #4
  propsSchema-single-authority + #6 sister-doc
  sync + D8 staging discipline):
  `docs/decisions/ADR-0006-asymmetry-audit-checklist.md`
- ADR-0003 (headless ↔ presentational split):
  `docs/decisions/ADR-0003-headless-presentational-split.md`
- mdx-bridge contract:
  `packages/mdx-bridge/CONTRACT.md`
- block-callout contract (consumer side):
  `packages/block-callout/CONTRACT.md`
- block-foundation contract (line 28 "Serialize /
  parse hook ownership" — authoritative
  prose B1 + B2 honour):
  `packages/block-foundation/CONTRACT.md`
- B1 PR.md (immediate predecessor; dispatch
  infrastructure):
  `docs/plans/wave-3-main/B1-mdx-bridge-jsx-routing.md`
- A5 PR.md (Stage A close — list-bullet
  canonicalization first observed):
  `docs/plans/wave-3-main/A5-editor-shell-save-load.md`
- Pre-B1 PR.md (SOTed v0.1.1 codification):
  `docs/plans/wave-3-main/Pre-B1-adr-0011-v0.1.1-amend.md`
