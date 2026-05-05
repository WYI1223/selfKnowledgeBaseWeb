# C.2-3.5 — `@skb/mdx-bridge` hard-throw flip + sample MDX backfill + 17 RTT fixtures grid-aware update

> **Wave 5 Stage C.2 NEW row C.2-3.5** locked at fractional row index 3.5 in
> Wave 5 plan v1.1 (R14 amendment 2026-05-05; squash `1304111`). Chronologically
> lands AFTER C.2-4 in this session's execution order; row position 3.5 between
> C.2-3 and C.2-4 per v1.1 row table §495. **Closes the C.2-1 → C.2-3 defer-defer
> chain** (per [ADR-0015](../../decisions/ADR-0015-wave-4-close.md) R14 +
> memory `feedback_r14_defer_chain_plan_amendment.md`) by:
>
> 1. Removing the C.2-1-era `_gridAttrsExplicit` defensive marker + transitional
>    `console.warn` + defensive defaults `col=1 / colSpan=12 / rowSpan=1` from
>    `packages/mdx-bridge/src/parse.ts` + `serialize.ts`;
> 2. Replacing them with a **literal hard-throw** on missing required grid
>    attrs (`col` / `colSpan` for non-prose; `rowSpan` for non-prose) per
>    [ADR-0016](../../decisions/ADR-0016-grid-data-model.md) D7 end-state
>    invariant — was deferred at C.2-1 (squash `e54497d`) + C.2-3 (squash
>    `2586328`);
> 3. Backfilling 8 component-block RTT fixtures
>    (`22-callout.mdx` .. `29-agent-flow.mdx`) + `content/notes/sample-blocks/index.mdx`
>    with explicit `col={1} colSpan={12}` baseline so the byte-equivalent
>    round-trip invariant holds post hard-throw;
> 4. Audit-only-verifying 9 prose RTT fixtures (`01-paragraph.mdx` ..
>    `09-link-title-comparator.mdx`) + 3 prose-only `content/notes/**/*.mdx`
>    files (`sample-mdx-note/index.mdx` + `__test_cjk__/laptop/index.mdx` +
>    `__test_cjk__/zh-note/index.mdx`) carry **zero** PascalCase JSX tags so
>    no backfill is needed (per Q1 v1.1 absorbtion `proseGridDefaults`
>    derive-not-emit invariant + ADR-0016 D3 markdown `rowSpan='auto'`
>    rendering-derived path).
>
> **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger judgment`
> (Row 1 `packages/mdx-bridge/CONTRACT.md` modified + Row 5 cross mdx-bridge
> source + 17 RTT fixtures + 4 `content/notes/**/*.mdx`). This PR is **the
> R14 first real-test PR's actual implementation**: the v1.1 amendment PR
> (squash `1304111`) was the doc-only formalization; this PR is the
> source/contract/fixture work that R14 first-test discipline mandates lands
> as a SINGLE focused PR (NOT folded into an adjacent C.2-N PR; R14 second
> violation if folded).

## title

Flip `@skb/mdx-bridge` from C.2-1-era **path (a) transitional defensive
defaults + `console.warn`** to **ADR-0016 D7 end-state hard-throw** for
missing required grid context attrs (`col` / `colSpan` / non-prose
`rowSpan`) on `mdxJsxFlowElement` blocks. Specifically:

1. MODIFIED `packages/mdx-bridge/src/parse.ts` (~30-50 LOC delta on a
   ~366 LOC file). Three coordinated removals + two hard-throws:
   - **L186-191**: replace the `console.warn(...)` + transitional message
     with a literal `throw new Error(...)` when `!isProse && (!colAttr ||
     !colSpanAttr)`. Error message format per orchestrator brief:
     `mdx-bridge: required grid attrs col + colSpan missing on block "{blockType}"; per ADR-0016 D7 end-state invariant (Wave 5 plan v1.1 row C.2-3.5; R14 amendment 2026-05-05).`
     The error MUST cite (a) the missing attr name(s) — `col`, `colSpan`,
     OR both (the parse path may distinguish OR may emit a single
     "col + colSpan" string for the AND-required pair, executor's choice
     scoped by AC#1); (b) the block type string (e.g. `"callout"`); and
     (c) the ADR-0016 D7 anchor + Wave 5 plan v1.1 row C.2-3.5 (R14
     amendment 2026-05-05) cite.
   - **L193-196**: REMOVE the defensive default branches `colAttr ?
     parseGridInteger(...) : 1` and `colSpanAttr ? parseGridInteger(...) :
     12`. Post hard-throw the fallback branches are unreachable; replace
     with unconditional `parseGridInteger('col', attrValue(colAttr!), blockType)`
     + `parseGridInteger('colSpan', attrValue(colSpanAttr!), blockType)`
     (or equivalent narrowing — the hard-throw upstream guarantees both
     are defined). Preserve prose-path passthrough (`isProse` keeps
     defaults to honor the ADR-0016 D3 markdown `rowSpan='auto'`
     derive-not-emit invariant).
   - **L207**: REMOVE the `explicit: Boolean(colAttr && colSpanAttr)`
     field from the `GridAttrs` return shape. Post-hard-throw both
     attrs are guaranteed present for non-prose blocks; the marker is
     no longer used downstream by `mergeGridAttrs` either.
   - **L220** (`mergeGridAttrs`): REMOVE the `...(gridAttrs.explicit ?
     { _gridAttrsExplicit: true } : {})` spread. Post-hard-throw the
     marker is not needed (was the C.2-1-era serialize-side gate signal;
     now obsolete).
   - **L281-287** (`parseRowSpan`): replace the `console.warn(...)` +
     default-to-1 path on missing non-prose `rowSpan` with a literal
     `throw new Error(...)`. Error message format mirrors the col/colSpan
     hard-throw with attr name `rowSpan`. Prose path (`isProse`) keeps
     returning `'auto'` per ADR-0016 D3.
   - **L44-50 `GridAttrs` interface**: REMOVE the `readonly explicit:
     boolean` field (line 49). Internal-only type; not part of the
     public surface from `index.ts` (verify via grep AC#6).
   - **L51-58 module-header comment**: remove the transitional language
     ("path (a) transitional behavior: defensive defaults + console.warn
     ...; Hard-throw flip lands at C.2-3.") and replace with end-state
     prose: "ADR-0016 D7 hard-throw end-state per Wave 5 plan v1.1 row
     C.2-3.5 (R14 amendment 2026-05-05): missing required attrs throw
     loudly; prose-path `Markdown` continues to derive `rowSpan='auto'`
     per ADR-0016 D3."

2. MODIFIED `packages/mdx-bridge/src/serialize.ts` (~10-20 LOC delta on a
   ~398 LOC file). Two coordinated removals:
   - **L51 `GRID_ATTR_NAMES` Set**: drop the `_gridAttrsExplicit` entry.
     Post-hard-throw the marker no longer flows in from parse; the
     `stripGridAttrsForDispatch` filter no longer needs to exclude it.
     New value: `new Set(['col', 'row', 'colSpan', 'rowSpan'])`
     (byte-equal to parse-side L58 Set; intentional — the two Sets MUST
     stay in lockstep per ADR-0016 D7 single-authority discipline).
   - **L175-183 module-comment + `serializeGridAttrs` `shouldEmit` gate**:
     REMOVE the `const shouldEmit = attrs['_gridAttrsExplicit'] === true;`
     line + the `if (!shouldEmit) return [];` early-return. Post hard-throw
     parse no longer emits the marker, AND non-prose blocks are
     guaranteed to have explicit `col / colSpan / rowSpan`, so emission
     becomes unconditional. The `if (attrs['rowSpan'] === 'auto' && !isProse)`
     defensive throw at L185-190 is **PRESERVED** (defends against an
     editor-built doc passing `'auto'` to a non-prose block bypassing
     parse — distinct safety layer from C.2-3.5 hard-throw which fires
     during MDX parse only).
   - Update L175-179 module comment to remove transitional language
     ("Path (a) transitional gate ...; preserves byte-equiv for the 17
     pre-grid RTT fixtures until C.2-3 lifts the marker.") and replace
     with end-state prose citing ADR-0016 D7 + Wave 5 plan v1.1 row
     C.2-3.5.

3. MODIFIED `packages/mdx-bridge/CONTRACT.md` (~30-50 LOC delta on a
   ~260 LOC file). Three coordinated edits:
   - **L62-65**: REMOVE the prose `"... while the C.2-1 to C.2-3 transition
     defaults missing attrs in memory and preserves pre-grid MDX output
     through the internal _gridAttrsExplicit marker."` Replace with
     end-state prose citing ADR-0016 D7 + Wave 5 plan v1.1 row C.2-3.5.
   - **L208-213** (`## Grid context attrs (Wave 5)` section, "Stage C.2
     transition" paragraph): REMOVE the prose `"Stage C.2 transition: C.2-1
     defensively defaults missing col to 1, colSpan to 12, ...; C.2-3
     removes those branches after sample MDX and RTT fixture backfill,
     restoring ADR-0016 D7 hard-throws for missing required attrs.
     Serialize emits grid attrs only when _gridAttrsExplicit === true ...,
     preserving the 17 pre-grid fixtures until C.2-3."` Replace with NEW
     end-state lock prose: `"ADR-0016 D7 end-state lock (post Wave 5 plan
     v1.1 row C.2-3.5; R14 amendment 2026-05-05): parse hard-throws on missing
     required grid attrs (col, colSpan for non-prose blocks; rowSpan for
     non-prose blocks); markdown rowSpan='auto' continues to derive-not-emit
     per ADR-0016 D3. The C.2-1-era transitional _gridAttrsExplicit
     marker has been removed; both parse-emission and serialize-gating
     paths are gone."`
   - **L218-220** (Pinned warnings code-fence): REMOVE the two pinned
     warning strings (`"mdx-bridge: grid attrs missing on block {type};
     defaulted to col=1 colSpan=12. ADR-0016 D7 hard-throw lands at
     C.2-3."` + `"mdx-bridge: grid attr default rowSpan=1 on non-prose
     block {type}; explicit value recommended per ADR-0016 D3+D7."`).
     Replace with NEW pinned hard-throw error strings — exact format must
     match the parse.ts emission (mechanical regex check at AC#8).

4. MODIFIED 8 component-block RTT fixtures
   (`packages/mdx-bridge/src/__tests__/fixtures/22-callout.mdx`,
   `23-code.mdx`, `24-image.mdx`, `25-math.mdx`, `26-pdf.mdx`,
   `27-jupyter.mdx`, `28-nn-viz.mdx`, `29-agent-flow.mdx`; ~5-15 LOC delta
   per file). For each PascalCase JSX tag in each fixture, INSERT
   `col={1} colSpan={12}` attrs before existing block-specific attrs.
   Baseline scheme = full-width single-row per ADR-0016 D2 baseline
   defaults (orchestrator-recommended path; locked at PLAN — see
   `## Plan-challenger absorbtion` Q5 lock for thoughtful-2-col-layout
   defer rationale). Round-trip byte-equivalence MUST hold post-edit
   (vitest enforces; see AC#13).

5. MODIFIED `content/notes/sample-blocks/index.mdx` (~5-15 LOC delta on a
   ~162 LOC file). 8+ block instantiations (Callout × 4, Code × 1,
   Image × 2, Math × 2, Pdf × 2, Jupyter × 1, NnViz × 1, AgentFlow × 1
   per HEAD `2586328`; verify count via post-edit grep AC#11) each
   prefixed with `col={1} colSpan={12}` baseline. apps/site Astro
   renderer at C.2-3 already SSR-emits the `.skb-grid` container, so
   each sampler block now renders inside the explicit grid in
   single-column-full-width slots — visual demo unchanged, layout
   semantics now explicit.

6. AUDIT-ONLY-VERIFIED 9 prose RTT fixtures
   (`01-paragraph.mdx` .. `09-link-title-comparator.mdx`). Per Q1 v1.1
   absorbtion these contain ZERO PascalCase JSX tags; backfill not
   required. Audit evidence emitted in `## verification required`
   (`grep -rE '<[A-Z][A-Za-z]+\b' ... | wc -l` returns 0). NO file
   edits. Audit accuracy verified at PLAN time during pr-writer brief
   (count = 0 confirmed).

7. AUDIT-ONLY-VERIFIED 3 prose-only `content/notes/**/*.mdx` files
   (`sample-mdx-note/index.mdx`, `__test_cjk__/laptop/index.mdx`,
   `__test_cjk__/zh-note/index.mdx`). Per Q1 v1.1 absorbtion these
   contain ZERO PascalCase JSX tags; backfill not required. Audit
   evidence emitted in `## verification required` (same grep pattern
   returns 0). NO file edits. Audit accuracy verified at PLAN time
   (count = 0 confirmed).

8. PR.md self-listed per ADR-0006 D8 strict-whitelist.

The 8 `@skb/block-*` packages are NOT touched (their `parseX` /
`serializeX` per-block functions are pre-grid; grid attrs are owned at
the mdx-bridge layer per ADR-0016 D2 single-authority). `@skb/block-foundation`
is NOT touched (W5-1 invariant authority lives there per C.2-2 squash
`b15ba24`; C.2-3.5 consumes the schema transitively, does not modify).
`@skb/editor-shell` is NOT touched (C.2-4 W5-2 invariant + thin
`GridContainer` + `useAutoRowSpan` already shipped at squash `de13d15`;
C.2-3.5 is upstream of editor consumer concerns). `apps/site` is NOT
touched (C.2-3 SSR grid CSS authority shipped at squash `2586328`;
C.2-3.5 is upstream of SSR consumer concerns). `packages/heavy-block-boundary`
is NOT touched (C.2-7 scope). NO change to design-tokens (C.3 scope).

LOCKED implementation path: **hard-throw flip + grid-attr backfill
baseline `col={1} colSpan={12}`**. Path "thoughtful 2-col layout for
sample-blocks/index.mdx" is **EXPLICITLY DEFERRED** to Stage C.3 visual
identity work (per `## Plan-challenger absorbtion` Q5 lock).

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

22 canonical files at PLAN time:

**Source (3 files)**

1. `packages/mdx-bridge/src/parse.ts` — modify ~30-50 LOC delta
2. `packages/mdx-bridge/src/serialize.ts` — modify ~10-20 LOC delta
3. `packages/mdx-bridge/CONTRACT.md` — modify ~30-50 LOC delta

**RTT fixtures (8 files; backfill-required)**

4. `packages/mdx-bridge/src/__tests__/fixtures/22-callout.mdx`
5. `packages/mdx-bridge/src/__tests__/fixtures/23-code.mdx`
6. `packages/mdx-bridge/src/__tests__/fixtures/24-image.mdx`
7. `packages/mdx-bridge/src/__tests__/fixtures/25-math.mdx`
8. `packages/mdx-bridge/src/__tests__/fixtures/26-pdf.mdx`
9. `packages/mdx-bridge/src/__tests__/fixtures/27-jupyter.mdx`
10. `packages/mdx-bridge/src/__tests__/fixtures/28-nn-viz.mdx`
11. `packages/mdx-bridge/src/__tests__/fixtures/29-agent-flow.mdx`

**Sample MDX (1 file; backfill-required)**

12. `content/notes/sample-blocks/index.mdx`

**PR.md self (1 file)**

13. `docs/plans/wave-5-main/C.2-3.5-mdx-bridge-hard-throw-flip.md` — this file

**Audit-only-verified (NO edits) — but enumerated for ACCEPT-stage evidence (9 files)**

14. `packages/mdx-bridge/src/__tests__/fixtures/01-paragraph.mdx`
15. `packages/mdx-bridge/src/__tests__/fixtures/02-heading.mdx`
16. `packages/mdx-bridge/src/__tests__/fixtures/03-list.mdx`
17. `packages/mdx-bridge/src/__tests__/fixtures/04-quote-and-code.mdx`
18. `packages/mdx-bridge/src/__tests__/fixtures/05-emphasis-link.mdx`
19. `packages/mdx-bridge/src/__tests__/fixtures/06-nested-inline.mdx`
20. `packages/mdx-bridge/src/__tests__/fixtures/07-link-with-title.mdx`
21. `packages/mdx-bridge/src/__tests__/fixtures/08-bold-with-break.mdx`
22. `packages/mdx-bridge/src/__tests__/fixtures/09-link-title-comparator.mdx`

**Audit-only-verified (NO edits) — content/notes (3 files; not in stage 5 staging since unchanged but enumerated for evidence)**

- `content/notes/sample-mdx-note/index.mdx`
- `content/notes/__test_cjk__/laptop/index.mdx`
- `content/notes/__test_cjk__/zh-note/index.mdx`

NO `package.json` change. NO `pnpm-lock.yaml` change. NO `tsconfig.json`
change. NO **new** ADR file (only ADR-0016 D3/D7 prose **consistency-correction**
update — Row 4 HIT consistency-correction class per Stage 3 R1 reviewer
8th-class hunt; see `## D2 trigger judgment` row 4). NO change to other
packages. NO change to `apps/site/**`. NO change to root `agent-contract.md`
or generated `CLAUDE.md`.

Total **edited** files at COMMIT: **17** (post Stage 3 R1+R2 reviewer
findings absorbed): 2 mdx-bridge source (parse.ts + serialize.ts) + 1
mdx-bridge CONTRACT.md + 3 modified existing tests (grid-defensive,
grid-rtt, jsx-routing) + 8 RTT fixtures + 1 sample MDX + 1 ADR-0016
(D3/D7 consistency-correction prose) + 1 PR.md. 12 files
(audit-only-verified: 9 prose RTT fixtures + 3 audit-only content/notes)
are read-only during execution; their unchanged state is evidence for
AC#10 + AC#12.

## test_cases

TDD-front executor MUST write failing test cases first, watch them fail,
implement source changes, watch them pass.

### TC-1 — `parseGridAttrs` hard-throws on missing `col` for non-prose block

- **Input**: synthetic mdast `mdxJsxFlowElement` for `<Callout title="x">...</Callout>` (zero grid attrs).
- **Action**: call `mdxToTiptap(source, { blockRegistry })` where source contains the above MDX.
- **Expected**: throws Error matching regex `/mdx-bridge: required grid attrs col(?:\s*\+\s*colSpan)? missing on block "callout".*ADR-0016 D7.*Wave 5 plan v1\.1 row C\.2-3\.5/i`.
- **Location**: `packages/mdx-bridge/src/__tests__/grid-hard-throw.test.ts` (NEW; ~10-15 LOC) OR extension of existing `round-trip.test.ts` describe-block (executor's choice; latter preferred to avoid file proliferation).

### TC-2 — `parseGridAttrs` hard-throws on missing `colSpan` for non-prose block

- **Input**: synthetic mdast for `<Callout col={1} title="x">...</Callout>` (col present, colSpan missing).
- **Action**: call `mdxToTiptap`.
- **Expected**: throws Error matching same regex as TC-1 (col + colSpan single-string OR distinct attr-name match per executor choice).
- **Location**: same test file.

### TC-3 — `parseRowSpan` hard-throws on missing `rowSpan` for non-prose block

- **Input**: `<Callout col={1} colSpan={12} title="x">...</Callout>` (col + colSpan present, rowSpan missing).
- **Action**: call `mdxToTiptap`.
- **Expected**: throws Error matching regex `/mdx-bridge: required grid attr rowSpan missing on block "callout".*ADR-0016 D7.*Wave 5 plan v1\.1 row C\.2-3\.5/i`.
- **Location**: same test file.

### TC-4 — `parseGridAttrs` does NOT throw on missing attrs for prose `Markdown` block

- **Input**: a `Markdown` mdast `mdxJsxFlowElement` carrying `some prose` children (zero grid attrs; `mdxComponent === 'Markdown'`).
- **Action**: call `mdxToTiptap`.
- **Expected**: parses cleanly; no throw; `rowSpan` derives to `'auto'` per ADR-0016 D3.
- **Location**: same test file.

### TC-5 — `serialize` round-trip clean on backfilled `<Callout col={1} colSpan={12} rowSpan={1} ...>`

- **Input**: explicit-attrs MDX `<Callout col={1} colSpan={12} rowSpan={1} variant="note" title="Heads up">...</Callout>`.
- **Action**: `tiptapToMdx(mdxToTiptap(input))`.
- **Expected**: byte-equal to input (post `.trim()`); no `_gridAttrsExplicit` Tiptap attr present in intermediate doc (mechanical assertion via `JSON.stringify(doc).includes('_gridAttrsExplicit')` returns false).
- **Location**: `packages/mdx-bridge/src/__tests__/round-trip.test.ts` (existing; extend describe block).

### TC-6 — Existing 17 RTT fixture round-trip suite — ALL PASS post backfill

- **Input**: each of 17 fixtures in `src/__tests__/fixtures/`.
- **Action**: `tiptapToMdx(mdxToTiptap(read(fixture))).trim() === read(fixture).trim()` invariant 1; AND `tiptapToMdx(stripMdast(mdxToTiptap(read(fixture)))).trim() === read(fixture).trim()` invariant 2.
- **Expected**: all 17 × 2 = 34 assertions PASS. Pre-existing parameterized describe.each loop in `round-trip.test.ts` automatically covers this once the 8 component fixtures are backfilled.
- **Location**: `packages/mdx-bridge/src/__tests__/round-trip.test.ts` (existing; no change required — relies on filesystem read of fixtures).

### TC-7 — Editor-built-doc canonical reconstruction round-trip clean (invariant 2 cross-check)

- **Input**: backfilled `22-callout.mdx` post C.2-3.5.
- **Action**: parse, drop every `_mdast` field, serialize.
- **Expected**: byte-equal to input fixture. Confirms grid attrs `col / colSpan / rowSpan` survive canonical reconstruction (NOT relying on `_mdast` passthrough; pure shape rebuild).
- **Location**: extend `round-trip.test.ts` describe block.

### TC-8 — Mechanical end-state invariant: zero `_gridAttrsExplicit` references in mdx-bridge source

- **Input**: glob `packages/mdx-bridge/src/**/*.ts`.
- **Action**: `grep -rE '_gridAttrsExplicit' {glob}` (or equivalent regex).
- **Expected**: zero matches. Mechanical R14 self-check guard (per `## R14 self-check` row 1).
- **Location**: `packages/mdx-bridge/src/__tests__/mechanical-end-state.test.ts` (NEW; ~10 LOC) OR a single test in existing `round-trip.test.ts`. Using vitest `expect` against `fs.readFileSync` is acceptable; OR running the grep at `pnpm check:affected` time via a CI step is acceptable per Stage 3 reviewer discretion.

### TC-9 — Mechanical end-state invariant: zero `console.warn` in parse.ts + serialize.ts

- **Input**: globs `packages/mdx-bridge/src/parse.ts` + `packages/mdx-bridge/src/serialize.ts`.
- **Action**: `grep -E 'console\.warn' {files}`.
- **Expected**: zero matches. Mechanical R14 self-check guard (per `## R14 self-check` row 2).
- **Location**: same NEW test file as TC-8 OR same test in existing.

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — MODIFIED. Three coordinated prose
  edits per `## title` item 3: L62-65 transitional-prose removal +
  L208-213 transition-paragraph replacement + L218-220 pinned-warnings
  replacement. NEW prose cites ADR-0016 D7 + Wave 5 plan v1.1 row
  C.2-3.5 (R14 amendment 2026-05-05) explicitly. Net delta ~30-50 LOC.
  D1 stage 4 PRE-COMMIT CLAUDE REVIEW MUST verify (a) zero residual
  transitional language; (b) end-state lock prose cites ADR-0016 D7;
  (c) cite of Wave 5 plan v1.1 row C.2-3.5 present.
- `packages/block-foundation/CONTRACT.md` — NOT MODIFIED. W5-1 invariant
  prose at L41 (per C.2-2 squash `b15ba24`) is consumed transitively;
  C.2-3.5 does NOT widen / narrow / re-anchor the W5-1 schema. Audit
  evidence: `git diff origin/main -- packages/block-foundation/CONTRACT.md`
  returns empty.
- `packages/editor-shell/CONTRACT.md` — NOT MODIFIED. W5-2 invariant
  prose at L? (per C.2-4 squash `de13d15`) cites C.2-3.5 forward-pointer
  already (per Risk #6 in C.2-4 PR.md); the C.2-4 PR.md `## R14 self-check`
  item 7 noted that the C.2-3.5 hard-throw flip is the **upstream**
  authority for editor-shell `_gridAttrsExplicit` zero-reference rule.
  Audit evidence: `git diff origin/main -- packages/editor-shell/CONTRACT.md`
  returns empty.
- `apps/site/CONTRACT.md` — NOT MODIFIED. The C.2-3 squash `2586328`
  shipped `.skb-grid` SSR + Responsive 12/6/1 CSS authority; C.2-3.5
  consumes that authority transitively via the sample-blocks/index.mdx
  backfill but does not modify it. Audit evidence: `git diff origin/main
  -- apps/site/CONTRACT.md` returns empty.

## adr_touched

- `docs/decisions/ADR-0016-grid-data-model.md` — **MODIFIED (consistency-correction; post Stage 3 R1 reviewer 8th-class hunt)**.
  D2 row 4 **HIT (consistency-correction class)** per `## D2 trigger
  judgment`. The implementation is the ALREADY-LOCKED end-state per
  ADR-0016 D7 line 273 ("Path (a) transitional behavior"); the ADR
  prose at D3 line 183 + D7 line 288-290 documented the OLD transitional
  fallback path. This PR updates those prose lines to align with the
  hard-throw end-state implementation. SEMANTIC change vs Pre-A2 lock
  = NONE; the prose update is corrective, not novel-decision. C.2-3.5
  is the IMPLEMENTATION of an ALREADY-LOCKED decision; no D-list semantic
  change. ADR-0016 §502 sister-doc-sync table mdx-bridge row was already
  extended at the v1.1 amendment PR (squash `1304111`) to reference
  C.2-3.5 as transition end-state lock site; that doc-only edit is
  upstream of this PR.
- `docs/decisions/ADR-0007-job-function-codex-heavy-execution.md` — NOT
  MODIFIED. D2 trigger judgment per CLAUDE.md `## Hard rules` Row 1+5
  hits but Row 4 (NEW ADR) does NOT hit; ADR-0007 D2 row 1 fires for
  the `mdx-bridge/CONTRACT.md` modification → triggers PRE-COMMIT
  CLAUDE REVIEW (D1 stage 4) only.

## acceptance

16 ACs (per orchestrator brief target ~14-16). MUST verify at ACCEPT
stage (D1 stage 6 pr-writer 2nd invocation). Each AC has a
**verification command** that an automated runner OR reviewer codex
can execute mechanically.

### AC#1 — `parse.ts` hard-throws on missing `col` for non-prose block

**Verify**: `grep -nE 'throw new Error' packages/mdx-bridge/src/parse.ts | grep -i 'col.*missing\|required.*col'` returns ≥ 1 line; AND TC-1 passes under `pnpm --filter @skb/mdx-bridge test`.

### AC#2 — `parse.ts` hard-throws on missing `colSpan` for non-prose block

**Verify**: same grep pattern as AC#1 with `colSpan` substring; AND TC-2 passes.

### AC#3 — `parseRowSpan` hard-throws on missing `rowSpan` for non-prose block

**Verify**: `grep -nE 'throw new Error' packages/mdx-bridge/src/parse.ts | grep -iE 'rowSpan.*missing|required.*rowSpan'` returns ≥ 1 line; AND TC-3 passes.

### AC#4 — `serialize.ts` `GRID_ATTR_NAMES` Set drops `_gridAttrsExplicit`

**Verify**: `grep -nE "GRID_ATTR_NAMES.*=.*new Set" packages/mdx-bridge/src/serialize.ts` returns line matching exactly `new Set(['col', 'row', 'colSpan', 'rowSpan'])` OR equivalent (no `_gridAttrsExplicit` substring on that line).

### AC#5 — `serialize.ts` `shouldEmit` gate removed

**Verify**: `grep -nE "shouldEmit" packages/mdx-bridge/src/serialize.ts` returns ZERO matches.

### AC#6 — Zero `_gridAttrsExplicit` references anywhere in `packages/mdx-bridge/src/**/*.ts`

**Verify**: `grep -rE '_gridAttrsExplicit' packages/mdx-bridge/src/` returns ZERO matches. Mechanical R14 self-check end-state invariant (TC-8). This is the **authoritative cross-package end-state guard**: editor-shell C.2-4 AC#12 (per squash `de13d15`) downstream-must-not-reuse `_gridAttrsExplicit` is enforced upstream-here.

### AC#7 — Zero `console.warn` references in `parse.ts` + `serialize.ts`

**Verify**: `grep -E 'console\.warn' packages/mdx-bridge/src/parse.ts packages/mdx-bridge/src/serialize.ts` returns ZERO matches. Mechanical R14 self-check (TC-9).

### AC#8 — `CONTRACT.md` transitional prose removed; end-state lock prose present + cites Wave 5 plan v1.1 row C.2-3.5

**Verify**: (a) `grep -E '_gridAttrsExplicit|defensively defaults missing|hard-throw lands at C\.2-3' packages/mdx-bridge/CONTRACT.md` returns ZERO matches (transitional prose removed); (b) `grep -E 'C\.2-3\.5|R14 amendment.*2026-05-05' packages/mdx-bridge/CONTRACT.md` returns ≥ 2 matches (end-state lock prose + Wave 5 plan v1.1 row reference both present); (c) `grep -E 'ADR-0016 D7' packages/mdx-bridge/CONTRACT.md` returns ≥ 1 match.

### AC#9 — 8 component-block fixtures backfilled with `col=` + `colSpan=` (per fixture)

**Verify**: for each fixture file in `packages/mdx-bridge/src/__tests__/fixtures/{22..29}-*.mdx`, `grep -E 'col=\{[0-9]+\}.*colSpan=\{[0-9]+\}' {file}` returns ≥ 1 line (each PascalCase JSX tag in each fixture has explicit `col` + `colSpan`). Mechanical fixture-by-fixture sweep — 8 separate grep commands OR a single loop. Baseline values are `col={1} colSpan={12}` per `## title` item 4.

### AC#10 — 9 prose fixtures audit-only — zero PascalCase JSX tags

**Verify**: `grep -rE '<[A-Z][A-Za-z]+\b' packages/mdx-bridge/src/__tests__/fixtures/0[1-9]-*.mdx | wc -l` returns `0`. Confirms prose-fixtures contain no component blocks → no backfill required → ADR-0016 D3 prose-path derive-not-emit invariant preserved.

### AC#11 — `content/notes/sample-blocks/index.mdx` backfilled

**Verify**: (a) `grep -E '<[A-Z][A-Za-z]+\b' content/notes/sample-blocks/index.mdx | wc -l` returns ≥ 13 (per HEAD `2586328` count: Callout × 4 + Code × 1 + Image × 2 + Math × 2 + Pdf × 2 + Jupyter × 1 + NnViz × 1 + AgentFlow × 1 = 14; tolerance ±2 since exact count depends on whether `</Component>` closing tags trip the regex — executor's choice of grep pattern); (b) for each PascalCase opening tag, `col={1} colSpan={12}` attrs present somewhere within the JSX expression block. Reviewer at Stage 3 verifies via a per-block-tag presence check.

### AC#12 — 3 audit-only `content/notes/**/*.mdx` files — zero PascalCase JSX tags

**Verify**: `grep -rE '<[A-Z][A-Za-z]+\b' content/notes/sample-mdx-note/index.mdx content/notes/__test_cjk__/laptop/index.mdx content/notes/__test_cjk__/zh-note/index.mdx | wc -l` returns `0`. Audit accuracy verified at PLAN time (count = 0 confirmed during pr-writer brief).

### AC#13 — `pnpm --filter @skb/mdx-bridge test` PASS — round-trip 17 fixtures unchanged passing post backfill

**Verify**: command exits 0; vitest summary shows 17 fixture × 2 invariant = 34 RTT assertions PASS + TC-1 .. TC-9 from this PR PASS.

### AC#14 — `pnpm check:affected` PASS

**Verify**: `pnpm check:affected` exits 0 (lint + typecheck + test + build + size all clean post backfill). Includes typecheck verifying `GridAttrs` interface no longer carries `explicit` field (mechanical type-check; TS would catch any internal call site referencing `gridAttrs.explicit`).

### AC#15 — Lychee delta-only scan clean (PR.md only — orchestrator-self walk)

**Verify**: `lychee docs/plans/wave-5-main/C.2-3.5-mdx-bridge-hard-throw-flip.md` exits 0. Per memory `feedback_lychee_line_anchor.md` + `feedback_lychee_npmjs_403.md` + `feedback_lychee_autolink_in_backticks.md` pre-empt patterns. Pre-empt grep scan: `grep -nE '\`[^\`]*<\w+>[^\`]*\`' docs/plans/wave-5-main/C.2-3.5-mdx-bridge-hard-throw-flip.md` returns ZERO lines (autolink-in-backticks guard).

### AC#16 — PR.md self-listed in commit staging set

**Verify**: `git diff --cached --stat` post `git add` step at D1 stage 5 includes
`docs/plans/wave-5-main/C.2-3.5-mdx-bridge-hard-throw-flip.md`. ADR-0006 D8
explicit-file-list staging discipline.

## verification required

ACCEPT stage (D1 stage 6 pr-writer 2nd invocation) MUST run + capture
output of all of:

1. `pnpm --filter @skb/mdx-bridge test` — vitest output showing 34 RTT assertions + 9 TC assertions PASS.
2. `pnpm check:affected` — full pipeline output.
3. `grep -rE '_gridAttrsExplicit' packages/mdx-bridge/src/` — must be empty.
4. `grep -E 'console\.warn' packages/mdx-bridge/src/parse.ts packages/mdx-bridge/src/serialize.ts` — must be empty.
5. `grep -rE '<[A-Z][A-Za-z]+\b' packages/mdx-bridge/src/__tests__/fixtures/0[1-9]-*.mdx | wc -l` — must be 0.
6. `grep -rE '<[A-Z][A-Za-z]+\b' content/notes/{sample-mdx-note,__test_cjk__/laptop,__test_cjk__/zh-note}/index.mdx | wc -l` — must be 0.
7. `for f in packages/mdx-bridge/src/__tests__/fixtures/2{2,3,4,5,6,7,8,9}-*.mdx; do grep -cE 'col=\{[0-9]+\}' "$f"; done` — each line ≥ 1.
8. `grep -cE '<[A-Z][A-Za-z]+\b' content/notes/sample-blocks/index.mdx` — ≥ 8 (≥ 1 per block kind covered).
9. `grep -cE 'col=\{1\}.*colSpan=\{12\}' content/notes/sample-blocks/index.mdx` — ≥ 8 (matches PascalCase JSX count for opening tags).
10. `lychee docs/plans/wave-5-main/C.2-3.5-mdx-bridge-hard-throw-flip.md` — exits 0.

## Plan-challenger absorbtion

Per Wave 5 plan v1.0 lock + v1.1 amendment, plan-challenger 4-Q light
round at Stage 3 (codex `plan-challenger` profile) raised + absorbed at
PLAN time (in pr-writer dispatch). 5 candidate Qs surfaced from the
v1.1 amendment + this PR's scope; 4 ABSORB-RECOMMENDED + 1 ABSORB-OPTIONAL
clarification:

| Q | Theme | Verdict | Resolution |
|---|---|---|---|
| Q1 | Should `mergeGridAttrs` keep a no-op spread for `_gridAttrsExplicit` (defensive) instead of removing? | ABSORB-RECOMMENDED REJECTED | REMOVE the spread. Defensive no-op contradicts ADR-0016 D7 end-state invariant + AC#6 mechanical guard. Defensive code = scope creep + R14 second-violation candidate. Removed cleanly per `## title` item 1 L220 edit. |
| Q2 | Should error message format include the file/line of the offending MDX (parse-loc)? | ABSORB-OPTIONAL DEFERRED | Defer to a future enhancement PR. Adding parse-loc requires plumbing mdast `position` field through `parseGridAttrs` — ~30-50 LOC orthogonal concern, likely Stage C.2-9 OR C.4. C.2-3.5 ships with block-type only error string per orchestrator brief format; future enhancement is a strict superset (additive, no contract break). |
| Q3 | Backfill scheme: baseline `col={1} colSpan={12}` for all 8 sampler blocks vs thoughtful 2-col layout? | ABSORB-RECOMMENDED LOCK BASELINE | LOCK baseline `col={1} colSpan={12}` for all 8 blocks at this PR. Rationale: (a) minimal-diff (Wave 5 R23 leaner-PR.md target); (b) visual demo unchanged (post C.2-3 SSR `.skb-grid` already wraps the page; full-width single-row blocks render identically to pre-grid stacking); (c) thoughtful 2-col layout requires designer judgment + visual baseline screenshots — properly belongs in Stage C.3 visual identity work where ux-ui-lead subagent dispatches; (d) future Stage C.3 PR can update sample-blocks/index.mdx attrs without breaking fixture invariant (fixtures stay baseline; sampler MDX evolves). |
| Q4 | Should TC-8/TC-9 (mechanical-end-state grep guards) live as a NEW vitest file or extend `round-trip.test.ts`? | ABSORB-OPTIONAL EXECUTOR-CHOICE | Defer to executor at Stage 2. Both options acceptable per `## test_cases` TC-8 + TC-9 location prose. Reviewer at Stage 3 (codex-pr-reviewer-55) verifies tests run + pass either way. |
| Q5 | Should the v1.1 amendment-shaped Q5 from PR.md `## R14 self-check` (mechanical R14 self-test hard-fail gates) propagate to a future `mdx-doctor` rule? | ABSORB-OPTIONAL FORWARD-POINTER | Forward-pointer to ADR-0019 Wave 5 close ceremony R24-shaped retrospective. The grep-based mechanical end-state guard pattern (AC#6 + AC#7) is a new instance of "mechanical end-state invariant after path-(a) → path-(b) flip" — a candidate for Wave 5 close ADR-0019 retrospective documentation as a R14-discipline best-practice. NOT scoped to this PR. |

## R14 self-check

R14 first-test discipline (per ADR-0015 R14 + memory
`feedback_r14_defer_chain_plan_amendment.md`). This PR is **THE
implementation that completes the R14 first-test cycle**. Self-check
items:

1. **Hard-throw flip lands ONLY at this PR (NOT folded into prior PRs)**. Verified: C.2-1 squash `e54497d` did NOT include hard-throw (path (a) defensive defaults shipped). C.2-3 squash `2586328` did NOT include hard-throw (Astro CSS only, OUT OF SCOPE per v1.1 amendment §494 marker). C.2-4 squash `de13d15` did NOT include hard-throw (editor-shell scope; per Risk #6 in C.2-4 PR.md the Q2 v1.1 absorbtion downstream-must-reference rule is enforced upstream-here at C.2-3.5).
2. **`_gridAttrsExplicit` zero-reference end-state**. Verified at AC#6. Mechanical guard: zero matches in `packages/mdx-bridge/src/**/*.ts`. Cross-package: editor-shell C.2-4 AC#12 already enforces zero-reference downstream; C.2-3.5 enforces upstream (the authority side). Both layers MUST stay in sync.
3. **`console.warn` zero-reference end-state in parse.ts + serialize.ts**. Verified at AC#7. Transitional warns (path (a) C.2-1-era) gone.
4. **Q2 v1.1 absorbtion downstream constraint at C.2-4 enforced at upstream C.2-3.5**. Verified: C.2-4 AC#12 (editor-shell zero-reference) verified at C.2-4 acceptance (squash `de13d15`); C.2-3.5 AC#6 (mdx-bridge zero-reference) verified here. Together: cross-package no-residue invariant.
5. **CONTRACT.md sister-doc sync per ADR-0016 §502 row mdx-bridge**. v1.1 amendment PR (squash `1304111`) extended ADR-0016 §502 row mdx-bridge to reference C.2-3.5 as transition end-state lock site. AC#8 verifies CONTRACT.md prose cites `C.2-3.5` + `R14 amendment 2026-05-05` + `ADR-0016 D7`.
6. **No defer to a downstream PR**. C.2-3.5 lands in **this single focused PR**. Folding into next PR (e.g., merging with C.2-5 drag/drop OR C.2-9 responsive-switch) would be R14 second violation per memory `feedback_r14_defer_chain_plan_amendment.md`. EXPLICITLY FORBIDDEN.
7. **No new ADR; ADR-0016 modified consistency-correction only**. D2 row 4 HIT consistency-correction class per Stage 3 R1 reviewer 8th-class hunt (D3 line 183 + D7 line 288-290 prose updated to remove obsolete fallback path). SEMANTIC change vs Pre-A2 lock = NONE (D7 line 273 already labeled fallback as "Path (a) transitional behavior"). Verified per `## adr_touched` + `## D2 trigger judgment`.
8. **PR.md LOC budget**. Target ~700-900 LOC per Wave 5 R23 leaner-PR.md target; aim ~750. Self-measure post-write at orchestrator report.

## D2 trigger judgment

Per [ADR-0007 D2](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
trigger rows + Wave 5 plan v1.1 row C.2-3.5 D2 column:

| Row | Description | Hit? | Reason |
|---|---|---|---|
| 1 | Contract change (`packages/*/CONTRACT.md` OR `agent-contract.md` OR `apps/*/CONTRACT.md`) | **HIT** | `packages/mdx-bridge/CONTRACT.md` modified (~30-50 LOC delta). |
| 2 | Package add/remove (workspace `pnpm-workspace.yaml` OR `packages.json` add/remove) | NOT-hit | No `package.json` change. No new package; no removed package. |
| 3 | Cross-package import path change OR major dep upgrade | NOT-hit | No new import; no `package.json` upgrade. |
| 4 | Substantive D-list semantic change OR NEW ADR required | **HIT (consistency-correction class; per Stage 3 R1 reviewer 8th-class hunt)** | ADR-0016 D3 (line ~183) + D7 (line ~288-290) prose updated to remove obsolete "fallback rowSpan=1 (defensive default)" path; align ADR text with hard-throw end-state implementation. SEMANTIC change vs Pre-A2 lock = **NONE**: D7 line 273 already labeled the fallback path as "Path (a) transitional behavior"; this PR is the locked-end-state IMPLEMENTATION. The prose update is **consistency-correction** (removing transitional language that lagged the locked end-state). Per Wave 5 plan v1.1 ROW 4 门槛规则: D-list TEXT changed → Row 4 fires; reviewer Stage 4 R2 must judge whether consistency-correction is acceptable per "exception" clause OR if a separate v1.2 amendment is required. Orchestrator's preliminary judgment: consistency-correction acceptable in same PR since the implementation IS the end-state lock specified at Pre-A2 D7 line 273; the ADR text was always intended to be updated when transitional path retired. |
| 5 | Cross-package OR cross-doc edits (≥ 2 surfaces) | **HIT** | mdx-bridge source (3 files) + 17 RTT fixtures (8 backfill + 9 audit) + 4 `content/notes/**/*.mdx` (1 backfill + 3 audit) + ADR-0016 D3/D7 prose update + PR.md self-list. Multi-surface scope. |
| 6 | Generated-file edit (e.g., `CLAUDE.md`) | NOT-hit | No edit to `CLAUDE.md` OR other generated config. |
| 7 | DB migration / data-format change | NOT-hit | N/A. |
| 8 | CI/deploy/auth/security file edit | NOT-hit | No `.github/`, no `apps/*/playwright.config.ts`, no auth files. |

**Verdict**: Row 1 + Row 4 (consistency-correction class; ADR-0016 D3/D7 prose only) + Row 5 fire. **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)
FIRES** (Row 1 + Row 4 + Row 5 all hit — heightened reviewer scrutiny).
Reviewer at Stage 3 + orchestrator at Stage 4 MUST scrutinize: (a)
hard-throw error message format consistency between parse.ts + CONTRACT.md
pinned-warnings + AC#1-AC#3 grep regex; (b) zero-reference mechanical
guards (AC#6 + AC#7) post-edit; (c) backfill correctness fixture-by-fixture
(AC#9) + sample-blocks parity (AC#11); (d) sister-doc-sync prose
accuracy in CONTRACT.md (AC#8).

## Risk register

### Risk #1 — RTT fixture backfill propagation: 8 fixtures × 2 RTT invariants × `col={1} colSpan={12}` baseline must NOT break byte-equivalent round-trip

**Severity**: HIGH (could regress 16 RTT assertions silently if backfill scheme miscalculates).
**Likelihood**: LOW (baseline `col={1} colSpan={12}` is the simplest case; serialize emits in canonical order per `serializeGridAttrs` L197-203).
**Mitigation**: TC-5 + TC-7 explicitly cover round-trip on backfilled fixture. TC-6 covers the existing 17-fixture parameterized suite. Reviewer at Stage 3 MUST inspect each backfilled fixture's diff vs HEAD and verify the byte-equiv invariant via `pnpm --filter @skb/mdx-bridge test`. Failure mode: a fixture has `col={1}` but serialize emits `col={1}`+`colSpan={12}` AND the input had a different attr order (e.g., `colSpan` before `col`) — RTT 1 breaks. Resolution: backfill MUST emit attrs in canonical order `col` → `row?` → `colSpan` → `rowSpan` (non-prose), matching `serializeGridAttrs` L197-203 emission order. PLAN-locked: executor edits each fixture inserting `col={1} colSpan={12} rowSpan={1}` (3 attrs in this order) immediately after the opening `<ComponentName ` and before the existing block-specific attrs.

### Risk #2 — Hard-throw error message regex must match exactly across 4 surfaces (parse.ts + CONTRACT.md pinned-warnings + AC#1-AC#3 + TC-1/TC-2/TC-3 regex)

**Severity**: MEDIUM (mismatch breaks AC verification + reviewer audit + future error-message-stability claims).
**Likelihood**: MEDIUM (4 surfaces — typical drift class).
**Mitigation**: PLAN-locked single string template at `## title` item 1 L186-191 + L281-287 + `## acceptance` AC#1 regex. Executor MUST emit verbatim string as a top-of-file constant in parse.ts (e.g., `const HARD_THROW_MISSING_GRID_ATTRS_PREFIX = ...`) OR inline literal across both throw sites with the SAME prefix. CONTRACT.md pinned-warnings code-fence MUST quote the same template (single source of truth). Reviewer at Stage 3 + orchestrator at Stage 4 verify via 4-way grep cross-check.

### Risk #3 — `serialize.ts` `if (attrs['rowSpan'] === 'auto' && !isProse)` defensive throw at L185-190 — KEEP or REMOVE?

**Severity**: LOW.
**Likelihood**: LOW.
**Mitigation**: PLAN-locked: **KEEP**. The defensive throw at L185-190 defends against an editor-built doc passing `'auto'` to a non-prose block bypassing parse — a distinct safety layer from C.2-3.5 hard-throw which fires during MDX parse only. The hard-throw flip is for the **parse boundary**; the serialize-side `'auto'`-on-non-prose throw is for the **editor-built doc boundary** (per CONTRACT.md `## Round-trip invariant` invariant 2 "editor-built-doc invariant"). Reviewer at Stage 3 MUST NOT confuse these two layers. AC#5 verifies only `shouldEmit` gate is removed; the rowSpan='auto' guard is preserved (NOT in AC#5 scope).

### Risk #4 — `content/notes/sample-blocks/index.mdx` backfill regenerates the page in production (apps/site SSR consumer)

**Severity**: LOW (visual demo unchanged per Q3 rationale; full-width single-row blocks render identically to pre-grid stacking).
**Likelihood**: ALMOST CERTAIN (the page IS rebuilt by `apps/site` Astro SSR pipeline on next build).
**Mitigation**: AC#13 + AC#14 verify build clean. apps/site visual baseline (where applicable) is NOT yet established — Stage C.3-5 will baseline. C.2-3.5 ships pre-baseline; visual regression detection happens at C.3-5 baseline-PR. If visual diff at C.3-5 is unexpectedly large, the resolution is to update Stage C.3 baseline (NOT to revert C.2-3.5 backfill). NO regression on existing playwright suites since none cover sample-blocks/index.mdx visual at HEAD.

### Risk #5 — Backfill ordering vs `serializeGridAttrs` emission order canonical lock

**Severity**: HIGH (could regress fixture RTT byte-equiv invariant silently — same root as Risk #1 but emphasizing the emission-order constraint).
**Likelihood**: MEDIUM (executor unfamiliar with `serializeGridAttrs` L197-203 canonical order may insert attrs in a different order).
**Mitigation**: PLAN-locks the canonical order: `col` first, `row?` second (only if present), `colSpan` third, `rowSpan` fourth (non-prose only). This MUST match `serializeGridAttrs` L197-203 exactly. Executor reads serialize.ts L197-203 BEFORE editing fixtures. Reviewer Stage 3 verifies via byte-equiv RTT test + spot-check on 22-callout.mdx + 28-nn-viz.mdx (largest fixture). Failure mode → AC#13 fail → revert backfill + re-do with correct order.

### Risk #6 — Defensive `gridAttrs.row !== undefined ? row : ...` path in `mergeGridAttrs` — preservation logic correctness post `explicit` field removal

**Severity**: LOW.
**Likelihood**: LOW.
**Mitigation**: PLAN-locked: PRESERVE the `gridAttrs.row !== undefined` conditional spread at L217 (it gates whether `row` is emitted, NOT whether it's defaulted). Removing `explicit` field at L220 is orthogonal — the `row` conditional logic is independent. Executor edits L220 (drop the `_gridAttrsExplicit` spread) WITHOUT touching L217 conditional. AC#13 + AC#14 verify the row-omitted serialize round-trip stays clean (e.g., 22-callout.mdx has no `row` attr; serialize emits no `row` post hard-throw flip — same as pre-flip). Reviewer at Stage 3 spot-checks via `git diff packages/mdx-bridge/src/parse.ts` line-by-line.

### Risk #7 — Plan-challenger Q2 deferred parse-loc enhancement may be requested by reviewer at Stage 3

**Severity**: LOW.
**Likelihood**: LOW.
**Mitigation**: Reviewer Stage 3 MAY note Q2 (parse-loc in error message) as a residue — orchestrator-self at Stage 4 acknowledges + tracks as a future enhancement candidate (NOT a blocker). Per `## Plan-challenger absorbtion` Q2 ABSORB-OPTIONAL DEFERRED rationale: parse-loc requires plumbing mdast `position` field through `parseGridAttrs`; ~30-50 LOC orthogonal concern. C.2-3.5 ships with block-type-only error string per orchestrator brief. Future enhancement is additive (no contract break).

## Out of scope

- **Thoughtful 2-col / multi-cell layout for `sample-blocks/index.mdx`** — deferred to Stage C.3 visual identity work (per Q3 lock).
- **`mdx-doctor` codex profile NEW grep-based mechanical end-state lint rule** — forward-pointer to ADR-0019 Wave 5 close ceremony R24-shaped retrospective (per Q5).
- **Parse-loc in hard-throw error message** — deferred to a future PR (per Q2).
- **`apps/site` Astro renderer grid attrs consumer changes** — apps/site is downstream of mdx-bridge; C.2-3 squash `2586328` already shipped the SSR consumer. C.2-3.5 changes parse semantics but does NOT change wire format (col / colSpan / rowSpan numeric values unchanged for backfilled blocks). No apps/site edit required.
- **`@skb/editor-shell` grid attrs consumer changes** — editor-shell is downstream; C.2-4 squash `de13d15` already shipped W5-2 invariant + thin GridContainer + useAutoRowSpan hook. C.2-3.5 changes parse semantics but does NOT change wire format. No editor-shell edit required.
- **`@skb/block-foundation` schema changes** — C.2-2 squash `b15ba24` shipped W5-1 invariant authority + grid-math.ts. C.2-3.5 consumes the schema transitively, does NOT modify.
- **Visual smoke baseline regression test for `sample-blocks/index.mdx` post backfill** — Stage C.3-5 baseline scope.

## executor

`codex-generic-executor` profile (per Wave 5 plan v1.1 row C.2-3.5
Executor column). TDD-front discipline:

1. Write failing tests TC-1 through TC-9 in mdx-bridge `__tests__/` per `## test_cases` location prose.
2. Run `pnpm --filter @skb/mdx-bridge test` — confirm TC-1..TC-3 fail loudly (expect throw, see `console.warn` instead) + TC-5..TC-7 may currently pass (existing fixtures already round-trip pre-flip via path (a) defaults).
3. Implement source changes per `## title` items 1-3 (parse.ts + serialize.ts + CONTRACT.md).
4. Run tests again — TC-1..TC-3 should now pass; existing 17-fixture RTT suite (TC-6) should now FAIL because 8 component fixtures lack explicit grid attrs → parse hard-throws.
5. Backfill 8 component-block fixtures per `## title` item 4 (canonical order `col={1} colSpan={12} rowSpan={1}`).
6. Run tests again — TC-6 should now pass (34 RTT assertions clean) + TC-5 + TC-7 pass.
7. Backfill `content/notes/sample-blocks/index.mdx` per `## title` item 5.
8. Run TC-8 + TC-9 (mechanical guards) — should pass.
9. Run `pnpm check:affected` — full clean.
10. Self-verify all 16 ACs per `## acceptance` + emit verification output per `## verification required`.

Codex stdin discipline: every `codex exec` invocation MUST pass `< /dev/null` per memory `feedback_codex_stdin.md`. Audit log piped to `/tmp/codex-runs/{timestamp}-{pr}.txt` first then post-run truncated to `docs/audits/codex-runs/...` per memory `feedback_codex_audit_log_recursion.md` + R21 grep-for-verdict pattern.

## Codex commit (D1 stage 5) staging

ADR-0006 D8 explicit-file-list staging discipline. Reviewer codex at
Stage 5 MUST:

1. `git reset HEAD` (drop any pre-staged residue).
2. `git add` the 17 explicit edited files (revised post-EXECUTE + Stage 3 R1 reviewer findings):
   - `packages/mdx-bridge/src/parse.ts`
   - `packages/mdx-bridge/src/serialize.ts`
   - `packages/mdx-bridge/CONTRACT.md`
   - `packages/mdx-bridge/src/__tests__/grid-defensive.test.ts` (modified to invert warn → throw expectations)
   - `packages/mdx-bridge/src/__tests__/grid-rtt.test.ts` (modified to drop `_gridAttrsExplicit` marker references)
   - `packages/mdx-bridge/src/__tests__/jsx-routing.test.ts` (modified to drop `_gridAttrsExplicit` marker references)
   - `packages/mdx-bridge/src/__tests__/fixtures/22-callout.mdx`
   - `packages/mdx-bridge/src/__tests__/fixtures/23-code.mdx`
   - `packages/mdx-bridge/src/__tests__/fixtures/24-image.mdx`
   - `packages/mdx-bridge/src/__tests__/fixtures/25-math.mdx`
   - `packages/mdx-bridge/src/__tests__/fixtures/26-pdf.mdx`
   - `packages/mdx-bridge/src/__tests__/fixtures/27-jupyter.mdx`
   - `packages/mdx-bridge/src/__tests__/fixtures/28-nn-viz.mdx`
   - `packages/mdx-bridge/src/__tests__/fixtures/29-agent-flow.mdx`
   - `content/notes/sample-blocks/index.mdx`
   - `docs/decisions/ADR-0016-grid-data-model.md` (Stage 3 R1 finding: D3 + D7 prose updated to remove fallback rowSpan=1 path; aligns ADR text with hard-throw end-state implementation)
   - `docs/plans/wave-5-main/C.2-3.5-mdx-bridge-hard-throw-flip.md`
3. (No NEW vitest test files were created at Stage 2; the 3 `__tests__/*.test.ts` files in step 2 above are MODIFIED existing files per executor TDD-front order.)
4. `git diff --cached --stat` — verify edited file count = 17; verify NO `pnpm-lock.yaml` line; verify NO files outside whitelist.
5. `git commit -m '{title} ...'` per ADR-0006 D8 commit-message convention.
6. `git push` (only after PRE-COMMIT CLAUDE REVIEW Stage 4 PASS).

Lockfile blob discipline per memory `feedback_git_operator_explicit_stage.md`: `pnpm-lock.yaml` MUST NOT appear in `git diff --cached --stat` output. If present, restore from clean historical blob via `git checkout HEAD -- pnpm-lock.yaml`.

## Related

- [Wave 5 plan v1.1 row C.2-3.5](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) §495
- [Wave 5 plan v1.1 amendment section](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) §455-477
- [v1.1 plan amendment PR](v1.1-plan-amendment-r14.md) — squash `1304111`
- [C.2-1 mdx-bridge serialize PR](C.2-1-mdx-bridge-grid-serialize.md) — squash `e54497d` (introduced `_gridAttrsExplicit` marker; first defer site)
- [C.2-3 Astro renderer grid PR](C.2-3-astro-grid.md) — squash `2586328` (second defer site; sister-doc forward-pointer cleared here)
- [C.2-4 editor-shell grid PR](C.2-4-editor-shell-grid.md) — squash `de13d15` (downstream Q2 v1.1 absorbtion downstream-must-not-reuse mechanical guard sibling)
- [ADR-0016 grid data model](../../decisions/ADR-0016-grid-data-model.md) D7 end-state invariant + §502 sister-doc-sync table
- [ADR-0015 Wave 4 close](../../decisions/ADR-0015-wave-4-close.md) R14 retrospective
- [ADR-0011 D1 6-stage linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0007 D2 trigger judgment](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
- [`@skb/mdx-bridge` CONTRACT](../../../packages/mdx-bridge/CONTRACT.md) — target of contract edit
- [`@skb/block-foundation` CONTRACT](../../../packages/block-foundation/CONTRACT.md) — W5-1 authority (consumed transitively)
- [`@skb/editor-shell` CONTRACT](../../../packages/editor-shell/CONTRACT.md) — W5-2 authority (downstream consumer)
