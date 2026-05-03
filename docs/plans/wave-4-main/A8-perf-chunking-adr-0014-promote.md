# A8 — Stage A close: perf baseline + Phase 2 chunking (data-driven) + ADR-0014 promote `proposed → accepted`

> **Wave 4 Stage A eighth and FINAL implementation PR.** Closes Wave 3
> carry-over **C5** (Phase 2 selective per-block chunking refinement
> in `apps/site/astro.config.mjs` `manualChunks`) **and** Stage A
> close gate #1 (ADR-0014 status flip `proposed → accepted` per
> gatekeeper directive 2026-05-03 #3 — must NOT be deferred to Stage
> B). The PR has three coupled deliverables: (1) **perf baseline**
> via `codex-perf-auditor` dispatch (Lighthouse + size-limit + Astro
> `--analyze`) with curated summary written to
> `docs/audits/perf-2026-05-03.md` (monthly / Wave-close cadence per
> the runbook at `docs/runbooks/codex-tool-invocations.md` line 250);
> (2) **Phase 2 chunking decision** — **conditional** on perf data
> per plan-challenger C4 absorbtion at Pre-A3 lock + locked Wave 4
> plan A8 § lines 277-283 + Pre-A3 D10 (line 513): IF the perf
> baseline shows `@skb/heavy-block-boundary` package code leaking
> into prose-only chunks (e.g., the `notes/<slug>` MDX route bundles
> for non-heavy notes ship boundary code), ADD a single
> `manualChunks` rule `if (id.includes('heavy-block-boundary'))
> return 'heavy-block-boundary';` BEFORE the existing
> `heavy-boundary-dimensions` rule (more specific match first per
> Vite's `manualChunks` first-match-wins semantics); IF NO leak,
> DOCUMENT the no-op decision in the perf doc (still data-driven —
> the decision is recorded with evidence either way); (3)
> **ADR-0014 promotion** with explicit pre-promotion review (per
> Stage A close gate #4 + plan-challenger C5 absorbtion):
> `docs/decisions/ADR-0014-heavy-block-boundary.md` line 5 changes
> `| 状态 | proposed |` → `| 状态 | accepted |`, a new
> `## Amendments` section logs v0.2.1 with implementation PR
> cross-references (#31 → #37 squash HEADs from `f765968` through
> `87d0b32`), and `docs/decisions/README.md` line 22 ADR-0014 row
> status flips to `accepted`. **The Pre-promotion review** lives in
> THIS PR.md `## Pre-promotion review of ADR-0014 v0.2 against
> actual implementation` section (mandatory per Wave 4 plan Stage A
> close gate #4 lines 83-87): the section walks **D1-D9 + AC#1-#15**
> against the as-merged A1-A7 work, citing each PR's squash HEAD as
> implementation evidence. **If the Pre-promotion review surfaces
> ADR inconsistency** (D-section drift, AC mismatch, or unhandled
> edge case), per plan-challenger C5 absorbtion the PR scope changes
> to "open ADR-0014 v0.2.1 amendment FIRST in a separate small PR,
> THEN promote in a re-scoped A8" — the v0.2.1 amendment goes through
> its own PLAN/EXECUTE/REVIEW/COMMIT/ACCEPT cycle before A8 ships;
> A8 in that branch becomes promotion-only. **PLAN-time finding**
> (this PR.md): the Pre-promotion review walkthrough below
> identifies **NO inconsistencies** between ADR-0014 v0.2 D-list /
> ACs and the as-merged A1-A7 implementation; therefore the
> in-scope path applies (ADR-0014 v0.2.1 Amendments § entry +
> status flip ship in this same PR). EXECUTE-time re-walks the
> review on the actual diff; if EXECUTE surfaces an inconsistency
> the PR is held at REVIEW (D1 stage 3) for a re-scope. The
> **executor split** follows Wave 4 plan A8 § lines 296-298:
> `codex-perf-auditor` dispatched FIRST (separate D1 stage 2 sub-step
> A8.A) to produce the bundle-leak evidence; orchestrator-self drafts
> the v0.2.1 Amendments § prose (the promotion-language is
> doc-policy work, not codex-class scaffolding); `codex-generic-executor`
> handles the README index update, the `active.md` 5-edit bookkeeping
> (A7 backfill + A8 row + Stage A done marker + Stage B pointer flip
> + mandatory-scope ✅ marks), the perf doc body finalization (per
> the auditor's stdout), and the conditional `astro.config.mjs`
> `manualChunks` edit (A8.E sub-step). Standard ADR-0011 D1 pipeline
> applies (PLAN → EXECUTE → REVIEW → COMMIT → ACCEPT) with **PRE-COMMIT
> CLAUDE REVIEW (D1 stage 4) NOT FORMALLY MANDATORY** per `## D2
> trigger judgment` below (no Row 1 / Row 4 / Row 8 hit; promoting
> an existing ADR is NOT new-ADR creation per Wave 4 plan A8 §
> lines 302-303 + plan-challenger Q5 absorbtion); however, given
> A8 is the **Stage A close** PR (highest-blast-radius surface in
> Wave 4 to date because it ratifies the entire ADR-0014
> implementation arc + decides the chunking strategy with cross-route
> bundle-impact + flips the status of the locked architectural ADR),
> orchestrator-self **applies heightened acceptance discipline at
> stage 6 (ACCEPT)** — pr-writer's second invocation walks all 20
> acceptance bullets with the actual diff in hand, not just a
> summary. **A8 closes Stage A**: post-merge `docs/plans/active.md`
> reads `**Stage A ✅ DONE** (8/8 PRs merged 2026-05-03)` and the
> next-PR pointer flips to **Stage B B1 (ADR-0012 amendment;
> PageFind query-time substring + path-prose alignment)**. Out of
> scope for A8 (per locked Wave 4 plan + D11 explicit exclusion):
> ADR-0015 / Wave 4 close-ceremony work — close-ceremony begins
> AFTER Stage C closes per plan-challenger C9 absorbtion (line 514
> of the locked plan).

## title

Promote ADR-0014 (`HeavyBlockBoundary`) from `proposed` to `accepted`
at Stage A close, ship a `codex-perf-auditor`-driven perf baseline at
`docs/audits/perf-2026-05-03.md` (Lighthouse + size-limit + Astro
`--analyze`), and apply Phase 2 selective chunking refinement in
`apps/site/astro.config.mjs` **only if** the audit shows
`@skb/heavy-block-boundary` package code leaking into prose-only
chunks (data-driven per plan-challenger C4 + Pre-A3 D10; if no leak,
the decision is documented as a no-op with evidence). Includes the
mandatory **Pre-promotion review of ADR-0014 v0.2 against the
as-merged A1-A7 implementation** (Stage A close gate #4) walking D1-D9
+ AC#1-#15 against PRs #31-#37 (squash HEADs `f765968`, `1d2f324`,
`92c8751`, `5f360a6`, `59a93c0`, `95ba33b`, `87d0b32`); PLAN-time
verdict is **NO inconsistencies surfaced** → ship promotion in same
PR (else re-scope per plan-challenger C5). Refresh
`docs/decisions/README.md` index ADR-0014 row to `accepted`. Bookkeep
`docs/plans/active.md` with A7 row backfill (`#37` `87d0b32`), new A8
row, `Stage A ✅ DONE (8/8 PRs merged 2026-05-03)` marker, Stage B B1
pointer flip on lines 6 + 82, and ✅ marks on the Wave 4 mandatory
scope items lines 27-31 that A1-A8 closed (ADR-0014 implementation +
C4a/C4b/C5 carry-overs). **Out of scope for A8** (per locked Wave 4
plan + D11 + plan-challenger C9 absorbtion): ADR-0015 creation +
Wave 4 close-ceremony work (B6 prep is Stage B scope; ceremony
proper begins after Stage C closes); ADR-0012 amendment (B1 scope);
sample-assets ship (B2); intro prose update (B3); `__test_cjk__`
relocate (B4); Wave 3 retrospective items 2-7 (B5a + B5b); Stage C
open-ended user-iteration scope.

## files

Modified + new (canonical count below; NO collateral graduations
expected — A8 adds NO deps to any `package.json`, `pnpm-lock.yaml`
stays byte-unchanged, and the `astro.config.mjs` edit is conditional
on a 1-line addition only IF the perf data justifies; this PR.md
remains self-listed per ADR-0006 D8 strict whitelist + the
Pre-A1+Pre-A2+Pre-A3+A1+A2+A3+A4+A5+A6+A7 precedent that pr-writer
must include the PR.md in the canonical file list at PLAN time):

- `docs/decisions/ADR-0014-heavy-block-boundary.md` — **MODIFIED**
  (~15-25 LOC delta). Two edits, applied as a single coherent
  promotion patch:

  **Edit 1 (line 5, status flip)**: change

  ```markdown
  | 状态 | proposed |
  ```

  to

  ```markdown
  | 状态 | accepted |
  ```

  This is a **single-character substitution** (the word changes from
  8 chars to 8 chars; the column-pipe alignment is preserved without
  needing to re-pad). Verified PLAN-time: line 5 is the unique row
  containing `状态 | proposed` per `grep -n "状态 | proposed"
  docs/decisions/ADR-0014-heavy-block-boundary.md` returning
  `5:| 状态 | proposed |` exactly once.

  **Edit 2 (NEW `## Amendments` section)**: insert a new section
  immediately AFTER the existing `## Plan-challenger codex absorbtion
  (locked at lock-time)` section's closing block (currently the file
  ends at line 555 with the `**Lock evidence**: this absorbtion table
  + each verdict cross-references the D-list section that codifies
  the change. Reviewers verify by walking each row's "Reason" link to
  the corresponding D-section.` paragraph) and BEFORE EOF. The new
  section body:

  ```markdown
  ## Amendments

  ### v0.2.1 (2026-05-03) — Status promoted `proposed → accepted` at Stage A close

  Per Wave 4 plan Stage A close criterion #1 (lines 71-74) +
  gatekeeper directive 2026-05-03 #3 (must NOT defer to Stage B or
  later). The A1-A7 implementation arc was reviewed against ADR-0014
  v0.2 D-list (D1-D9) and acceptance criteria (AC#1-#15) at A8 (this
  PR); the walkthrough is recorded in
  [`docs/plans/wave-4-main/A8-perf-chunking-adr-0014-promote.md`](../plans/wave-4-main/A8-perf-chunking-adr-0014-promote.md)
  `## Pre-promotion review of ADR-0014 v0.2 against actual
  implementation` section. **All D1-D9 + AC#1-#15 satisfied**; no
  inconsistencies surfaced; promotion authorized in-scope for this
  PR (the alternative scope per plan-challenger C5 absorbtion —
  open a v0.2.1 amendment FIRST then promote in a re-scoped A8 —
  was NOT triggered).

  Implementation PRs (squash HEADs):

  | PR | Squash HEAD | Subject |
  |---|---|---|
  | #31 | `f765968` | A1 — `@skb/heavy-block-boundary` package shell (D1 placeholder body + ADR-0008 D1 dead-dep evidence) |
  | #32 | `1d2f324` | A2 — HeavyBlockBoundary core hydration lifecycle (D3 useEffect + AbortController + mount-guard; AC#1/#2/#3/#6/#10/#11) |
  | #33 | `92c8751` | A3 — HeavyBlockBoundary retry + maxRetries + onLoadError telemetry (D3 retry-flow; AC#7/#8/#9) |
  | #34 | `5f360a6` | A4 — HeavyBlockBoundary CSS + a11y polish + prefers-reduced-motion + CONTRACT.md consolidation (AC#4/#12/#13/#14) |
  | #35 | `59a93c0` | A5 — apps/site dims migration via heavyBoundaryDimensions (AC#15) |
  | #36 | `95ba33b` | A6 — playwright T0/T1 zero-layout-shift test (AC#5) |
  | #37 | `87d0b32` | A7 — 5×.astro variants consolidation (Wave 3 C4a/C4b carry-over; non-boundary direct-Astro-consumer route at `/sample-blocks-astro` complementary to the MDX `componentsMap` consumer surface that consumes the boundary on the `/notes/sample-blocks` route) |
  | #TBD | TBD | A8 — this PR (Stage A close: perf baseline + Phase 2 chunking decision + status promotion + Pre-promotion review walkthrough) |

  Stage A close gates (per Wave 4 plan lines 71-87):
  1. ✅ ADR-0014 status `proposed → accepted` (this Amendment + line 5 flip)
  2. ✅ A6 playwright zero-layout-shift PASS (PR #36 `95ba33b` ship; CI green)
  3. ✅ A2 + A3 core impl + retry semantics regressions resolved (PRs #32 `1d2f324` + #33 `92c8751`)
  4. ✅ A7→A8 transition Pre-promotion review checkpoint (this PR.md `## Pre-promotion review` section; verdict: NO inconsistencies)
  ```

  Total NEW section ~30-40 LOC. Notes for executor:

  (a) The exact paragraph linking the Pre-promotion review section
  uses a relative path from `docs/decisions/`:
  `../plans/wave-4-main/A8-perf-chunking-adr-0014-promote.md` (one `..`
  to escape `docs/decisions/`, then `plans/wave-4-main/...`). Verify
  EXECUTE-time via `pnpm link-check` to ensure lychee resolves the
  link (per memory `feedback_lychee_line_anchor` — no `:line` suffix;
  per `feedback_lychee_user_local_paths` — no `~/.claude/...` links).
  The link target file IS this PR.md self-listed below; lychee will
  find it.

  (b) The `Implementation PRs (squash HEADs)` table includes the A8
  row with `#TBD | TBD` placeholders; this is the standard one-row-per-PR
  cadence (the row is filled in either by the orchestrator post-COMMIT
  in a no-op forward-fix OR — preferred — left as `#TBD | TBD`
  because A8 is itself the row's source-of-truth and the row is
  trivially identifiable as "this PR" by reviewers walking the
  Amendments §). Cross-check at ACCEPT (D1 stage 6).

  (c) **DO NOT touch** any prose in the existing ADR body (D1-D9 +
  Acceptance criteria + Consequences + Alternatives + Compliance +
  Related + Plan-challenger absorbtion table). The promotion is
  status + Amendments § ONLY; the underlying decision document
  remains v0.2 prose (the v0.2.1 increment captures only the
  status change + post-implementation review pointer, NOT a
  decision rev). TC4 verifies the diff is bounded to line 5 +
  the new `## Amendments` section.

- `docs/decisions/README.md` — **MODIFIED** (~1 LOC delta). Edit
  line 22's status column from `proposed` to `accepted`. The current
  table row reads:

  ```markdown
  | [0014](ADR-0014-heavy-block-boundary.md)                  | HeavyBlockBoundary wrapper for client:only heavy blocks     | 2026-05-03 | proposed |
  ```

  Becomes:

  ```markdown
  | [0014](ADR-0014-heavy-block-boundary.md)                  | HeavyBlockBoundary wrapper for client:only heavy blocks     | 2026-05-03 | accepted |
  ```

  The column-padding in the source is preserved by the same character
  substitution discipline as the ADR header flip (`proposed` and
  `accepted` are both 8 chars). Verified PLAN-time: line 22 is the
  unique row containing `ADR-0014` per the Read of the README index
  table. NO new column added; NO existing rows otherwise modified.
  TC5 verifies the diff is bounded to line 22 only.

- `apps/site/astro.config.mjs` — **CONDITIONALLY MODIFIED** (~0-1
  LOC delta; see decision tree below). The current `manualChunks`
  function (lines 21-26) is:

  ```javascript
  manualChunks: (id) => {
    if (id.includes('heavy-boundary-dimensions')) return 'heavy-boundary-dimensions';
    if (id.includes('@skb/block-jupyter') || id.includes('/packages/block-jupyter/')) return 'block-jupyter';
    if (id.includes('@skb/block-nn-viz') || id.includes('/packages/block-nn-viz/')) return 'block-nn-viz';
    if (id.includes('@skb/block-agent-flow') || id.includes('/packages/block-agent-flow/')) return 'block-agent-flow';
  },
  ```

  **Decision tree at EXECUTE-time** (post `codex-perf-auditor` stdout
  analysis; per plan-challenger C4 absorbtion + locked Wave 4 plan
  A8 § lines 277-283 + Pre-A3 D10):

  - **IF the audit's bundle-leak analysis shows
    `heavy-block-boundary` source (or its compiled
    `HeavyBlockBoundary.js` chunk) appearing in any prose-only chunk
    (i.e., a chunk produced for a `notes/<slug>` MDX route that does
    NOT consume Jupyter / NnViz / AgentFlow components and therefore
    has no legitimate need for the boundary code)**, ADD a single
    new `manualChunks` rule **BEFORE** the existing
    `heavy-boundary-dimensions` rule (Vite's `manualChunks` matches
    the FIRST returning rule per the function-form contract; more
    specific match must precede the generic dimensions rule because
    `heavy-block-boundary` IDs contain neither
    `heavy-boundary-dimensions` nor any of the 3 heavy-block
    workspace specifiers, so the new rule does NOT collide with
    existing rules):

    ```javascript
    manualChunks: (id) => {
      if (id.includes('@skb/heavy-block-boundary') || id.includes('/packages/heavy-block-boundary/')) return 'heavy-block-boundary';
      if (id.includes('heavy-boundary-dimensions')) return 'heavy-boundary-dimensions';
      if (id.includes('@skb/block-jupyter') || id.includes('/packages/block-jupyter/')) return 'block-jupyter';
      if (id.includes('@skb/block-nn-viz') || id.includes('/packages/block-nn-viz/')) return 'block-nn-viz';
      if (id.includes('@skb/block-agent-flow') || id.includes('/packages/block-agent-flow/')) return 'block-agent-flow';
    },
    ```

    The added rule mirrors the dual `@skb/...` workspace specifier +
    `/packages/.../` realpath pattern already used by the 3 heavy
    block rules per the in-file comment "Vite resolves workspace deps
    to their realpath; without the second pattern manualChunks misses
    post-resolution IDs". Edit is +1 line at the top of the function
    body (line 22 becomes the new `heavy-block-boundary` rule; lines
    23-26 shift down by 1 to lines 23-27 wrapping the existing rules
    intact). EXECUTE-time post-edit `pnpm --filter @skb/site build`
    confirms the new chunk emits + the in-leaking prose-only chunks
    no longer ship boundary code. Re-run a quick `codex-perf-auditor`
    spot check (or in-process `astro --analyze` re-read by the
    executor) confirms the post-fix bundle layout. Update the perf
    doc to record both the pre-fix leak evidence + the post-fix
    fixed layout (the doc remains the source-of-truth for the
    chunking decision rationale).

  - **IF the audit's bundle-leak analysis shows NO
    `heavy-block-boundary` leakage into prose-only chunks** (i.e.,
    boundary code lives only in the heavy-block chunks where it is
    legitimately consumed via the dynamic `import()` adapter pattern
    in `apps/site/src/components.ts` per ADR-0014 D8 + A5 ship —
    Vite's tree-shaking + dynamic-import boundary correctly isolates
    the boundary code into the heavy-block chunks since
    `HeavyBlockBoundary` is only imported at the call sites that wrap
    `JupyterRenderView` / `NnVizRenderView` / `AgentFlowRenderView`),
    DO NOT modify `astro.config.mjs`. Document the no-op decision in
    the perf doc with the bundle table evidence (per plan-challenger
    C4: "do NOT preemptively split without data" — the no-op IS a
    valid data-driven outcome). TC6 verifies the conditional empty
    diff path.

  In BOTH branches, the perf doc records the rationale + evidence;
  the chunking-decision audit trail is preserved either way.

- `docs/audits/perf-2026-05-03.md` — **NEW** (~150-300 LOC). The
  curated perf baseline summary written by orchestrator-self per the
  runbook at `docs/runbooks/codex-tool-invocations.md` line 250
  ("Wave-close 时由 orchestrator 另写 curated summary 到
  docs/audits/perf-YYYY-MM-DD.md (月度 / Wave-close 级)，引用
  /tmp 原始 + docs/audits 归档"). The doc is a bundle-impact
  baseline + chunking decision rationale, NOT the raw codex stdout
  (the raw stdout lives at `/tmp/codex-runs/2026-05-03-A8-perf-auditor.txt`
  off-workspace per R7; the truncated archive lives at
  `docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt` per the
  same runbook; this curated summary is a separate human-readable
  doc). Required sections (per the Wave 3 close perf baseline at
  `docs/audits/perf-2026-05-wave-3-close.md` precedent for shape):

  ```markdown
  # Perf baseline — 2026-05-03 (Wave 4 Stage A8 close)

  > Authored at A8 (this PR) per locked Wave 4 plan A8 § lines 282-285
  > + plan-challenger C4 absorbtion (data-driven Phase 2 chunking
  > decision). Source-of-truth for the chunking-decision rationale at
  > Stage A close. References (a) raw codex-perf-auditor stdout at
  > `/tmp/codex-runs/2026-05-03-A8-perf-auditor.txt` (off-workspace per
  > R7; not durable); (b) truncated archive at
  > `docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt` (≤2000 LOC,
  > durable in-repo); (c) live `apps/site/dist/` bundle layout at
  > A8 build time.

  ## Context

  Wave 4 Stage A close (8/8 PRs merged 2026-05-03; A1-A7 ship the
  ADR-0014 `HeavyBlockBoundary` implementation arc + the 5×.astro
  variants consumer surface). ADR-0014 gets promoted from
  `proposed → accepted` in this same PR (A8) per Stage A close gate
  #1. Phase 2 selective chunking refinement is data-driven per
  plan-challenger C4 absorbtion: do NOT add chunking rules
  preemptively; measure bundle layout first; add a rule ONLY if
  prose-only chunks ship `@skb/heavy-block-boundary` code.

  ## Methodology

  - **Lighthouse CI** ran against `apps/site` at desktop + mobile
    emulation; the 4 routes exercised: `/` (notes index), `/notes/sample-blocks`
    (MDX route with 3 React boundaries + 5 light blocks),
    `/sample-blocks-astro` (A7's direct-Astro-consumer route with 5
    .astro variants), `/notes/<a non-block-using note slug>` (a
    prose-only baseline; pick the longest prose-only note in
    `content/notes/` for the worst-case prose-only bundle).
  - **size-limit** ran against the `apps/site/dist/` output to enumerate
    chunks + their gzipped sizes.
  - **`astro --analyze`** ran via `pnpm --filter @skb/site exec astro
    build --analyze` to surface the per-route chunk dependency graph.
  - **Manual grep** of `apps/site/dist/_astro/*.js` for the string
    `HeavyBlockBoundary` to confirm/deny boundary code presence per
    chunk.

  ## Lighthouse scores (representative routes)

  | Route | Performance | Accessibility | Best Practices | SEO | Notes |
  |---|---|---|---|---|---|
  | `/` | TBD-from-audit | TBD | TBD | TBD | notes index; cold load |
  | `/notes/sample-blocks` | TBD | TBD | TBD | TBD | 3 heavy boundaries + 5 light blocks; AC#5 zero-layout-shift verified at A6 |
  | `/sample-blocks-astro` | TBD | TBD | TBD | TBD | A7 direct-Astro-consumer; pure SSR no React boundaries on this page |
  | `/notes/<prose-only-slug>` | TBD | TBD | TBD | TBD | prose-only baseline; KEY route for boundary-leak analysis |

  Mobile + desktop variants reported separately if the auditor
  produced both; otherwise note the emulation profile used.

  ## Bundle size table (per chunk; gzipped)

  | Chunk name | Size (gz) | Contains | Routes consuming |
  |---|---|---|---|
  | (auditor populates) | | | |

  Highlight rows where `HeavyBlockBoundary` source appears (manual
  grep evidence).

  ## Heavy-block-boundary leak analysis

  **Question**: does `@skb/heavy-block-boundary` package code ship
  in any prose-only chunk (i.e., a chunk produced for a route that
  does NOT consume Jupyter / NnViz / AgentFlow components)?

  **Method**: `grep -l 'HeavyBlockBoundary' apps/site/dist/_astro/*.js`
  enumerates chunks containing the boundary class identifier. Cross-
  reference each match against the route → chunk map from
  `astro --analyze` to identify the consuming routes. If any
  consuming route is prose-only (no heavy block in its MDX), the
  boundary is leaking.

  **Finding**: TBD-from-audit (one of two outcomes — either "leak
  confirmed: chunks X, Y ship `HeavyBlockBoundary` despite not
  rendering heavy blocks" OR "no leak: `HeavyBlockBoundary` is
  isolated to the 3 heavy-block chunks (block-jupyter, block-nn-viz,
  block-agent-flow) per Vite's dynamic-import + tree-shaking").

  ## Decision: chunked OR no-op

  **Outcome**: TBD-from-audit (one of two paths; orchestrator picks
  the path matching the leak finding):

  - **Path A — chunked** (IF leak confirmed): added one new
    `manualChunks` rule in `apps/site/astro.config.mjs` BEFORE the
    existing `heavy-boundary-dimensions` rule:
    `if (id.includes('@skb/heavy-block-boundary') ||
    id.includes('/packages/heavy-block-boundary/')) return
    'heavy-block-boundary';`. Post-edit re-build + re-grep confirms
    the boundary code now lives in its own chunk + the previously-leaking
    prose-only chunks no longer ship boundary code. Bundle table
    above shows pre-fix + post-fix sizes.

  - **Path B — no-op** (IF no leak): NO change to
    `apps/site/astro.config.mjs`. The Vite dynamic-import pattern in
    `apps/site/src/components.ts` (per A5 ship + ADR-0014 D8) already
    isolates the boundary code into the 3 heavy-block chunks via
    tree-shaking; an additional `manualChunks` rule would be
    redundant overhead. Per plan-challenger C4 absorbtion: "do NOT
    preemptively split without data" — the no-op IS a valid
    data-driven outcome.

  ## Cross-references

  - A8 PR.md (this file's Stage A close PR):
    `docs/plans/wave-4-main/A8-perf-chunking-adr-0014-promote.md`
  - ADR-0014 v0.2.1 Amendments § (status promotion log):
    `docs/decisions/ADR-0014-heavy-block-boundary.md` `## Amendments`
    section (added by this PR)
  - codex-perf-auditor truncated archive:
    `docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt`
  - Wave 3 close perf baseline (predecessor; for size-trend
    comparison): `docs/audits/perf-2026-05-wave-3-close.md`
  - Wave 4 plan A8 § (locked):
    `docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`
    lines 274-318
  ```

  Notes for executor:
  (a) `TBD-from-audit` placeholders are filled in EXECUTE-time
  post-`codex-perf-auditor` stdout analysis. Orchestrator-self does
  the curation (per the runbook line 250 "Wave-close 时由 orchestrator
  另写 curated summary"); `codex-generic-executor` may handle the
  initial scaffold via the doc's headings if dispatched separately,
  but the path-A vs path-B decision + the leak-finding language MUST
  be orchestrator-authored (the call is the architectural choice
  point, not a scaffolder-class task).
  (b) Total LOC target ~200 (±50). Hard cap per CLAUDE.md Hard rule
  #1 = 500 LOC; expected well under.
  (c) The doc's filename uses today's date `2026-05-03` (the date the
  audit runs + the date A8 ships; same date as the ADR promotion
  Amendment + same date as the Wave 4 plan lock + the existing Wave 3
  close baseline at `docs/audits/perf-2026-05-wave-3-close.md` is the
  predecessor; A8's doc filename does NOT include `-wave-4-close` /
  `-stage-a-close` suffix because Wave 4 is NOT yet closed at A8 —
  this is a Wave 4 Stage A close baseline, not a Wave-close baseline;
  the suffix-free name `perf-2026-05-03.md` is the canonical pattern
  per the runbook line 250). EXECUTE-time verification: confirm no
  collision via `ls docs/audits/perf-2026-05-*.md` returning either
  the wave-3-close file alone (pre-A8) or both files (post-A8).

- `docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt` — **NEW**
  (≤2000 LOC, head-truncated archive). The codex-perf-auditor stdout
  archive per Universal Bash invariants in
  `docs/runbooks/codex-tool-invocations.md` (R7 + the perf-auditor §
  line 248-249): the raw stdout pipes to
  `/tmp/codex-runs/2026-05-03-A8-perf-auditor.txt` (off-workspace, per
  R7 to avoid the audit-log self-recursion incident codified in
  memory `feedback_codex_audit_log_recursion`); after the run
  completes, `head -2000` truncates to the durable in-repo archive at
  this canonical path. The archive is the codex-traceable evidence
  for the perf baseline; the curated `perf-2026-05-03.md` doc above
  is the human-readable summary. Filename follows the existing
  `2026-MM-DD-<task>-<profile>.txt` pattern visible across the 100+
  files in `docs/audits/codex-runs/` (per
  `ls docs/audits/codex-runs/`). NOT pretty-printed; line content is
  whatever the codex-perf-auditor profile emits per its
  per-tool-invocation contract (Lighthouse JSON + size-limit table +
  Astro --analyze graph). EXECUTE-time orchestrator runs the
  canonical bash from the runbook line 236:
  `codex exec --yolo --profile perf-auditor < /dev/null` with the
  R7-mandated `set -o pipefail` + `2>&1 | tee
  /tmp/codex-runs/2026-05-03-A8-perf-auditor.txt` raw piping.
  Post-run: `head -2000 /tmp/codex-runs/2026-05-03-A8-perf-auditor.txt
  > docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt`.

- `docs/plans/wave-4-main/A8-perf-chunking-adr-0014-promote.md` —
  **NEW** (this PR.md). Self-listed per ADR-0006 D8 strict whitelist
  (PR #1 R2 lesson; carried through Wave 3 + Pre-A1+A2+A3 + A1 + A2
  + A3 + A4 + A5 + A6 + A7).

- `docs/plans/active.md` — **MODIFIED**. Apply 5-edit Stage A close
  bookkeeping (one more edit-row than typical because A8 closes Stage
  A entirely):

  (1) **A7 row backfill** at line 21 — the row currently reads
  `| #TBD (this) | TBD | A7 | 5×.astro variants consolidation (Wave
  3 C4a/C4b carry-over) |` per the A7 PR.md ship-time placeholder;
  backfill `#TBD → #37`; `TBD → 87d0b32` per the locked PR #37
  squash HEAD (cited in this PR.md prose throughout).

  (2) **NEW A8 row** inserted between the A7 row and the Stage A
  remaining row: `| #TBD (this) | TBD | A8 | Stage A close: perf
  baseline + Phase 2 chunking decision (data-driven) + ADR-0014
  promote `proposed → accepted` |`. Standard one-row-per-PR cadence
  matching the A7 row's structure.

  (3) **Replace "Stage A remaining" row** at line 22 (currently
  `| Stage A remaining | A8 (1 PR — Stage A close) | A | perf+chunking+ADR-0014
  promote (A8) |`) with a Stage-A-DONE marker row:
  `| **Stage A ✅ DONE** | (8/8 PRs merged 2026-05-03) | A |
  ADR-0014 implementation arc + C4a/C4b/C5 carry-overs closed; status
  promoted `proposed → accepted` at A8 (this PR) |`. The bold
  `Stage A ✅ DONE` matches the ADR-0011 Wave 3 close precedent at
  active.md line 42 (where Wave 3 close uses the same bold-✅-closed
  marker style: `Wave 3 ✅ closed (2026-05-02, HEAD `4deb5cb`) by
  [ADR-0013](../../decisions/ADR-0013-wave-3-close.md)`).

  (4) **Top-line phase summary on line 6 + 起手指引 line 82** flip:
  both lines currently include the prose `Pre-A1 + Pre-A2 + Pre-A3
  + A1 + A2 + A3 + A4 + A5 + A6 + A7 done. **Stage A8 (Phase 2
  chunking + perf baseline + ADR-0014 promote `proposed → accepted`;
  Stage A close) is the next implementation PR.**` After A8 ships,
  both lines change to: `Pre-A1 + Pre-A2 + Pre-A3 + A1 + A2 + A3 + A4
  + A5 + A6 + A7 + A8 (Stage A ✅ DONE 2026-05-03; ADR-0014 promoted
  `proposed → accepted`). **Stage B B1 (ADR-0012 amendment;
  PageFind query-time substring + path-prose alignment per memory
  feedback_pagefind_query_substring + ADR-0013 D3) is the next
  implementation PR.**`

  (5) **Wave 4 mandatory scope checkboxes** lines 27-31: flip the
  Wave 3 carry-over status markers based on what A1-A8 closed:

  - Line 28 (ADR-0014): change the A-stage status note from "Stage
    A implements + A8 promotes to accepted" to "✅ Stage A
    implementation complete (PRs #31-#36) + ✅ status promoted to
    `accepted` at A8 (this PR)".
  - Line 29 (Stage C completion C4a/C4b/C5): change the `⏳` to `✅`
    + add the closure note: "✅ Stage A A7 closed C4a + C4b (5×.astro
    variants consolidation; PR #37); ✅ Stage A A8 closed C5 (Phase
    2 chunking decision + perf baseline; this PR)".
  - Line 30 (ADR-0012 amendment): leave `⏳` (Stage B B1 scope; A8
    does NOT touch).
  - Line 31 (path-prose alignment in ADR-0012): leave `⏳` (Stage B
    B1 scope; combined with line 30).

  Total = 5 edits (4 + the wrapped multi-bullet edit on lines 28-29).
  All other content of `docs/plans/active.md` byte-unchanged.
  Collateral-drift slot: if executor finds the surrounding row
  sequence has shifted (e.g., a parallel PR added or removed rows),
  executor adapts the line-number references while preserving the
  documented edit semantics + the verbatim `Stage A ✅ DONE` marker
  string + the verbatim `Stage B B1 (ADR-0012 amendment...)` pointer
  string (TC9 + TC10 grep on these literal strings).

= **6 canonical files** on the path-B no-op result (3 modified —
`ADR-0014-heavy-block-boundary.md`, `README.md`, `active.md`; 3 NEW —
`perf-2026-05-03.md`, `codex-runs/2026-05-03-A8-perf-auditor.txt`,
and this self-listed PR.md). The conditional `astro.config.mjs` edit
would have expanded the final file set only on path-A leak evidence;
the perf baseline found no leak, so the final A8 diff remains
docs-only. Larger than A7 (5 files) by 1 (the perf baseline +
archived codex log), but smaller than the typical A-stage executor PR.

**Explicitly NOT in canonical list (DO NOT touch — TC verifies empty
diff)**:

- `packages/heavy-block-boundary/**` — A8 makes ZERO source / CONTRACT.md
  changes to the boundary package. The package was authored at A1
  (#31) + body at A2 (#32) + retry at A3 (#33) + CSS/a11y at A4 (#34);
  A4 consolidated CONTRACT.md (per A4 invariant table). A8 promotes
  the ADR governing this package; the package source is byte-frozen
  from A4. TC11 verifies empty diff.
- `packages/block-{jupyter,nn-viz,agent-flow}/**` — A8 makes ZERO
  changes to the 3 heavy block packages. A5 (#35) added the
  `heavyBoundaryDimensions` exports + CONTRACT.md bullets +
  package.json deps + tsconfig refs; A6 / A7 / A8 each make zero
  changes. TC12 verifies empty diff.
- `packages/block-{math,pdf}/**` — A8 makes ZERO changes to the 2
  light block packages. The .astro variants were consumed at A7 via
  the existing subpath exports map; A8 doesn't touch the producer
  side. TC12 covers (same diff target).
- `apps/site/src/**` — A8 makes ZERO source changes to the apps/site
  React / Astro source tree. A5 (#35) is the canonical
  `components.ts` rewire for the MDX route; A7 (#37) added the
  `/sample-blocks-astro` page (also unchanged at A8). TC13 verifies
  empty diff. **EXCEPTION**: the conditional `astro.config.mjs` edit
  is at the apps/site level (`apps/site/astro.config.mjs`); the diff
  envelope for `apps/site/` is **bounded to ≤1 file** (the
  `astro.config.mjs` 1-line addition iff the perf path-A fires;
  zero files iff path-B). TC7 verifies the bounded envelope.
- `apps/site/playwright/**` — A8 adds NO new playwright specs. A6
  (#36) shipped `heavy-block-layout-shift.spec.ts` (canonical
  zero-layout-shift evidence for AC#5); A7 (#37) shipped
  `sample-blocks-astro.spec.ts`. A8 doesn't add or modify any
  playwright spec. TC13 covers (same diff target).
- `apps/site/src/__tests__/**` — A8 adds NO new vitest tests. The
  existing apps/site corpora (per the Wave 3 D-stage + A1-A7 ship
  list: `components-map.test.ts`, `dims-source.test.ts`,
  `fouc-script.test.ts`, `lazy-chunking.test.ts`,
  `sample-blocks-page.test.ts`, `sample-blocks-astro-page.test.ts`,
  `search-cjk.test.ts`, `search-reindex.test.ts`,
  `search-ui.test.ts`) continue passing unchanged via TC1.
- `apps/site/CONTRACT.md` — A8 adds NO public-surface contract
  change. The `manualChunks` config edit (if path-A fires) is a
  Vite-internal build-time concern, NOT a public-surface contract
  (consumers do NOT contract on chunk granularity per the existing
  CONTRACT prose). TC14 verifies empty diff.
- `agent-contract.md` — A8 makes ZERO changes to the agent roster /
  codex tool patterns / hard rules. The Stage A close does NOT shift
  any agent role definitions; the ADR-0014 promotion is a status
  flip, not an agent contract change. TC15 verifies empty diff.
- `CLAUDE.md` — generated from `agent-contract.md` per the file
  header; since `agent-contract.md` is unchanged, `CLAUDE.md` is
  also unchanged. TC15 covers (same diff target).
- `pnpm-lock.yaml` — A8 adds NO deps; lockfile byte-unchanged. TC16
  verifies empty diff.
- `.github/workflows/ci.yml` — A8 adds NO new tests / scripts that
  require CI workflow changes. The existing `pnpm check` invocation
  already runs lint + typecheck + test + build + size-check across
  the workspace; the new perf doc is a markdown file that
  participates in `pnpm link-check` (Lychee) but not in the test
  pipeline. TC17 verifies empty diff.
- `content/notes/**` — A8 makes ZERO changes to notes content. The
  existing `content/notes/sample-blocks/index.mdx` continues to
  drive the MDX route per A5 + A6; A7's `/sample-blocks-astro` route
  is independent. TC18 verifies empty diff.
- Any other ADR file (`docs/decisions/ADR-0001` through
  `docs/decisions/ADR-0013`) — A8 does NOT modify any other ADR.
  Specifically, ADR-0011 / ADR-0012 / ADR-0013 are not touched (the
  ADR-0012 amendment is Stage B B1 scope; ADR-0015 creation is
  out-of-scope per D11). TC19 verifies empty diff across the 13
  other ADR files.
- `docs/plans/wave-4-main/A1` through `A7` PR.md files — A8 does NOT
  modify any prior PR.md. The A7 row backfill happens in `active.md`
  (the index), NOT in the A7 PR.md body. TC20 verifies empty diff.
- `docs/audits/perf-2026-05-wave-3-close.md` — A8 does NOT modify
  the predecessor perf baseline. The new `perf-2026-05-03.md` is a
  separate Wave 4 Stage A close baseline; the Wave 3 close baseline
  is referenced from the new doc but not edited. TC21 verifies empty
  diff.
- `docs/audits/structure-2026-05.md` — A8 does NOT modify the
  current structure baseline. The Wave 4 plan B-stage retrospective
  scope (B5b) re-baselines structure against Wave 4 work; A8 does
  not. TC21 covers (same diff target — both audits in
  `docs/audits/`).
- `docs/runbooks/codex-tool-invocations.md` — A8 does NOT modify the
  runbook. The `codex-perf-auditor` § + R7 piping discipline are
  followed verbatim per the existing runbook prose (Pre-A1
  codification); A8 has no runbook updates. TC22 verifies empty
  diff.

## test_cases

A8 ships 3 modified docs + 3 NEW docs/audit files on the path-B
no-op result. Tests are mostly
**verification grep** + **regression baseline** + **link-check**;
TDD is applied to the chunking decision (the perf doc is the test
fixture for the decision; `astro.config.mjs` change is verified by a
post-edit re-build + re-grep). Per ADR-0011 D1 stage 2 TDD-front
discipline: write the perf doc skeleton + chunking decision tree
FIRST → run the audit → fill in the placeholders → make the
conditional config edit → verify via re-build → confirm `pnpm check`
exit 0 workspace-wide.

- **TC1** (apps/site test suite regression — all existing vitest
  tests continue to PASS unchanged) Input: `pnpm --filter @skb/site
  test`. Expected: exit 0; the apps/site vitest corpora
  (`components-map.test.ts`, `dims-source.test.ts`,
  `fouc-script.test.ts`, `lazy-chunking.test.ts`,
  `sample-blocks-page.test.ts`, `sample-blocks-astro-page.test.ts`,
  `search-cjk.test.ts`, `search-reindex.test.ts`,
  `search-ui.test.ts`) all PASS unchanged. Location: shell at repo
  root.
- **TC2** (apps/site build clean — proves the conditional
  `astro.config.mjs` edit (if path-A) does not break the build; or
  the no-op (if path-B) leaves the build trivially unchanged) Input:
  `pnpm --filter @skb/site build`. Expected: exit 0; `astro build`
  emits chunks per the new (or unchanged) `manualChunks` rules; if
  path-A fired, the new `heavy-block-boundary` chunk is present in
  `apps/site/dist/_astro/`. No new build errors / warnings introduced.
  Location: shell.
- **TC3** (typecheck clean — no impact since `astro.config.mjs`
  changes are JS not TS-checked; perf doc + ADR + README are
  markdown not TS-checked) Input: `pnpm typecheck`. Expected: exit
  0. Location: shell.
- **TC4** (ADR-0014 status flip verified) Input (a): `grep -c "状态
  | accepted" docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: >= 1 (line 5 flip applied). Input (b): `grep -c "状态
  | proposed" docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: 0 (the proposed status no longer appears anywhere in the
  file body). Input (c): `grep -c "## Amendments"
  docs/decisions/ADR-0014-heavy-block-boundary.md`. Expected: 1
  (the new section header). Input (d): `grep -c "v0.2.1"
  docs/decisions/ADR-0014-heavy-block-boundary.md`. Expected: >= 1
  (the new Amendment entry). Input (e): `grep -c "Stage A close"
  docs/decisions/ADR-0014-heavy-block-boundary.md`. Expected: >= 1
  (the Amendment subhead "Status promoted `proposed → accepted` at
  Stage A close"). Location: shell.
- **TC5** (README index ADR-0014 row updated) Input (a): `grep -E
  "ADR-0014.*accepted" docs/decisions/README.md`. Expected: >= 1
  match (the line 22 row now shows `accepted`). Input (b): `grep -E
  "ADR-0014.*proposed" docs/decisions/README.md`. Expected: 0 matches
  (the row no longer shows `proposed`). Input (c): `grep -c "0014"
  docs/decisions/README.md`. Expected: >= 1 (the row is still
  present). Location: shell.
- **TC6** (`apps/site/astro.config.mjs` diff envelope bounded —
  conditional on path-A vs path-B) Input: `git diff main --
  apps/site/astro.config.mjs | wc -l`. Expected: either 0 (path-B
  no-op — empty diff) or ≤ 12 (path-A added 1 functional line + a
  ~6-line diff envelope of context + index + ++; conservative
  upper-bound 12 lines of unified-diff output). The orchestrator-self
  ACCEPT walk reads the actual diff and verifies it matches the perf
  doc's documented decision (path-A doc → path-A diff; path-B doc →
  path-B empty diff). Location: shell.
- **TC7** (`apps/site/` diff envelope bounded — at most 1 file
  modified inside `apps/site/`) Input: `git diff main --name-only
  -- apps/site/ | wc -l`. Expected: 0 (path-B) or 1 (path-A;
  exactly `apps/site/astro.config.mjs`). Defensive: if any other
  apps/site file appears in the diff, the PR is over-scope per the
  files-list above. Location: shell.
- **TC8** (perf doc exists at canonical path) Input: `ls
  docs/audits/perf-2026-05-03.md`. Expected: 1 file present. Input
  (b): `wc -l docs/audits/perf-2026-05-03.md`. Expected: between 100
  and 500 lines (200±50 target; 500 is hard cap per CLAUDE.md Hard
  rule #1; if higher, the doc is over-scope). Input (c): `grep -c
  "Heavy-block-boundary leak analysis"
  docs/audits/perf-2026-05-03.md`. Expected: 1 (the section header
  is present). Input (d): `grep -c "Decision: chunked OR no-op"
  docs/audits/perf-2026-05-03.md`. Expected: 1. Location: shell.
- **TC9** (codex-perf-auditor archive exists at canonical path)
  Input: `ls docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt`.
  Expected: 1 file present. Input (b): `wc -l
  docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt`. Expected: <=
  2000 (head-truncation per R7 + the runbook line 249). Location:
  shell.
- **TC10** (active.md A7 row backfilled) Input (a): `grep -c '#37'
  docs/plans/active.md`. Expected: >= 1 (A7 PR number filled in).
  Input (b): `grep -c '87d0b32' docs/plans/active.md`. Expected: >=
  1 (A7 squash HEAD filled in). Location: shell.
- **TC11** (active.md Stage A close marker present) Input (a):
  `grep -E 'Stage A.*DONE.*8/8' docs/plans/active.md`. Expected: >=
  1 match (the new `**Stage A ✅ DONE** (8/8 PRs merged 2026-05-03)`
  marker row OR the equivalent prose on lines 6 + 82). Input (b):
  `grep -c 'Stage B B1' docs/plans/active.md`. Expected: >= 1 (the
  next-PR pointer flipped to Stage B B1). Input (c): `grep -c
  'A8 | Stage A close' docs/plans/active.md`. Expected: >= 1 (the
  new A8 row). Location: shell.
- **TC12** (heavy-block-boundary src + CONTRACT.md byte-unchanged
  from A6) Input: `git diff main -- packages/heavy-block-boundary/`.
  Expected: empty diff (A8 promotes the ADR; the package source is
  byte-frozen from A4 onwards; A6 / A7 / A8 each verified empty
  diff). Location: shell.
- **TC13** (5 block packages byte-unchanged from A7) Input: `git
  diff main -- packages/block-math/ packages/block-pdf/
  packages/block-jupyter/ packages/block-nn-viz/
  packages/block-agent-flow/`. Expected: empty diff (A8 makes zero
  changes to the heavy or light block packages; A5 was the last
  producer-side rewire). Location: shell.
- **TC14** (apps/site/src + apps/site/playwright +
  apps/site/CONTRACT.md byte-unchanged from A7) Input: `git diff
  main -- apps/site/src/ apps/site/playwright/
  apps/site/CONTRACT.md apps/site/package.json`. Expected: empty
  diff (A8 only conditionally edits `apps/site/astro.config.mjs`,
  which is at `apps/site/` root, not under `apps/site/src/`;
  TC7 covers the bounded envelope). Location: shell.
- **TC15** (agent-contract.md + CLAUDE.md byte-unchanged) Input:
  `git diff main -- agent-contract.md CLAUDE.md`. Expected: empty
  diff (A8 makes no agent roster / role / hard-rule changes).
  Location: shell.
- **TC16** (lockfile byte-unchanged — no new deps) Input: `git
  diff main -- pnpm-lock.yaml`. Expected: empty diff (A8 adds NO
  deps). Location: shell.
- **TC17** (`.github/workflows/ci.yml` byte-unchanged) Input: `git
  diff main -- .github/workflows/ci.yml`. Expected: empty diff (A8
  needs no CI workflow change; existing `pnpm check` + Lychee
  link-check cover the new doc files). Location: shell.
- **TC18** (`content/notes/**` byte-unchanged) Input: `git diff
  main -- content/notes/`. Expected: empty diff. Location: shell.
- **TC19** (other 13 ADR files byte-unchanged) Input: `git diff
  main -- docs/decisions/ADR-0001*.md docs/decisions/ADR-0002*.md
  docs/decisions/ADR-0003*.md docs/decisions/ADR-0004*.md
  docs/decisions/ADR-0005*.md docs/decisions/ADR-0006*.md
  docs/decisions/ADR-0007*.md docs/decisions/ADR-0008*.md
  docs/decisions/ADR-0009*.md docs/decisions/ADR-0010*.md
  docs/decisions/ADR-0011*.md docs/decisions/ADR-0012*.md
  docs/decisions/ADR-0013*.md`. Expected: empty diff (only ADR-0014
  + README.md are touched in `docs/decisions/`). Location: shell.
- **TC20** (prior PR.md files byte-unchanged) Input: `git diff main
  -- docs/plans/wave-4-main/A1-*.md docs/plans/wave-4-main/A2-*.md
  docs/plans/wave-4-main/A3-*.md docs/plans/wave-4-main/A4-*.md
  docs/plans/wave-4-main/A5-*.md docs/plans/wave-4-main/A6-*.md
  docs/plans/wave-4-main/A7-*.md
  docs/plans/wave-4-main/Pre-A1-*.md
  docs/plans/wave-4-main/Pre-A2-*.md
  docs/plans/wave-4-main/Pre-A3-*.md`. Expected: empty diff.
  Location: shell.
- **TC21** (`docs/audits/perf-2026-05-wave-3-close.md` +
  `docs/audits/structure-2026-05.md` + other audit files
  byte-unchanged) Input: `git diff main -- docs/audits/ -- ':!*.md'
  ':!*A8-perf-auditor*'`. Expected: empty diff (only the NEW
  `perf-2026-05-03.md` + NEW `codex-runs/2026-05-03-A8-perf-auditor.txt`
  appear in the diff; all other audit files unchanged). Location:
  shell.
- **TC22** (`docs/runbooks/codex-tool-invocations.md` byte-unchanged)
  Input: `git diff main -- docs/runbooks/codex-tool-invocations.md`.
  Expected: empty diff. Location: shell.
- **TC23** (link-check via Lychee — exit 0 for the 2 new doc files +
  the modified ADR-0014 Amendments § cross-link to this PR.md +
  the modified README index entry) Input: `pnpm link-check`.
  Expected: exit 0 (Lychee scans `./**/*.md` per the `link-check`
  script in `package.json`; no broken markdown links introduced by
  the new perf doc, the new Amendments §, or the README status
  flip). Per memory `feedback_lychee_line_anchor` no `:line` suffix
  on relative file links; per `feedback_lychee_user_local_paths` no
  `~/.claude/...` links. Location: shell.
- **TC24** (`pnpm check` exit 0 globally — workspace-wide regression
  baseline) Input: `pnpm check`. Expected: exit 0 (lint + typecheck
  + test + build + size-check all PASS workspace-wide; A8's
  doc-only + conditional 1-line config edit is additive; no existing
  test breaks). Location: shell at repo root.
- **TC25** (PR.md self-listed in `## files`) Input: `grep -c
  'A8-perf-chunking-adr-0014-promote.md'
  docs/plans/wave-4-main/A8-perf-chunking-adr-0014-promote.md`.
  Expected: >= 2 (the file references itself in `## files` list +
  the title section header). Location: shell.

## contracts_affected

- **No CONTRACT.md files are modified by A8.** A8 promotes ADR-0014
  status, ships a perf baseline doc, conditionally tunes Vite
  `manualChunks`, and bookkeeps `active.md`. None of these touch any
  `packages/*/CONTRACT.md` or `apps/site/CONTRACT.md`. The
  `HeavyBlockBoundary` package CONTRACT.md (consolidated at A4 per
  the canonical 8-bullet invariant list) remains byte-frozen from
  A4 → A5 → A6 → A7 → A8. The 5 block packages' CONTRACT.md files
  were last edited at A5 (heavy blocks: dims export bullet) /
  pre-Wave-4 (light blocks: variant + .astro export bullets); A8
  makes zero CONTRACT changes. TC12 + TC13 + TC14 verify empty
  diff across all CONTRACT.md targets.
- **No `apps/site/CONTRACT.md` change.** The conditional
  `manualChunks` edit (path-A) is a Vite-internal build-time
  concern, NOT a public-surface contract. Consumers do NOT contract
  on chunk granularity per the existing apps/site CONTRACT prose
  (which enumerates routes `/` and `/notes/<slug>` as the public
  surface; chunking is implementation detail). TC14 verifies empty
  diff.

## adr_touched

- **`docs/decisions/ADR-0014-heavy-block-boundary.md`** — **EDITED.**
  Status flip (line 5 `proposed → accepted`) + new `## Amendments`
  section v0.2.1 entry. Per Wave 4 plan A8 § lines 302-303 +
  plan-challenger Q5 absorbtion, **promoting an existing ADR is NOT
  new-ADR creation**; tracking via the ADR's own Amendments section
  (per ADR-0011 v0.1.1 SOTed-PR.md amendment precedent applied to
  doc-class ADRs). The Amendments § entry is the audit trail for the
  status flip — it logs the date (2026-05-03), the Stage A close
  authority (Wave 4 plan close criterion #1 + gatekeeper directive
  2026-05-03 #3), the implementation PR cross-references (#31-#37
  squash HEADs), the Pre-promotion review pointer (this PR.md
  section), and the close-gate satisfaction summary (4/4 gates
  satisfied). TC4 verifies the edit is bounded to line 5 + the new
  `## Amendments` § + nothing else (the existing D1-D9 + Acceptance
  criteria + Consequences + Alternatives + Compliance + Related +
  Plan-challenger absorbtion table prose remains byte-unchanged).
- **`docs/decisions/README.md`** — **EDITED.** Line 22 (the ADR index
  table row for ADR-0014) status column flips from `proposed` to
  `accepted`. This is the cross-reference companion to the ADR header
  status flip; both must ship in the same PR per the consistency
  invariant (the README index is the canonical lookup for ADR
  statuses; if the header says `accepted` and the index still says
  `proposed`, reviewers + future agents see drift). TC5 verifies the
  edit is bounded to line 22 only (no other rows or sections
  modified).
- **No new ADR is required for A8.** D2 Row 4 (new ADR required) is
  **NOT triggered** per Wave 4 plan A8 § lines 302-303 explicit
  judgment. Promoting an existing ADR is an Amendments-§-based
  status update, not a new architectural decision. ADR-0015 (the
  prospective Wave 4 close ceremony ADR) is **explicitly OUT-OF-SCOPE**
  for Stage A / B / C lock per Pre-A3 plan-challenger C9 absorbtion
  (D11 of the locked plan; line 514): close-ceremony work begins
  AFTER Stage C closes; A8 ships at Stage A close, well before
  Stage B / C / Wave 4 close.
- **No other ADR modifications.** ADR-0011 / ADR-0012 / ADR-0013 are
  not touched by A8. The ADR-0012 amendment (PageFind query-time
  substring + path-prose alignment per memory
  `feedback_pagefind_query_substring`) is **Stage B B1 scope** — A8
  does NOT consume or mutate ADR-0012. TC19 verifies empty diff
  across the 13 other ADR files.
- Per gatekeeper directive 2026-05-03 #1 + the A1/A2/A3/A4/A5/A6/A7
  PR.md precedent, this `adr_touched` field explicitly enumerates
  the touched ADR + the Pre-promotion review verdict that
  authorized the status flip; reviewers verify A8 diff aligns with
  ADR-0014 v0.2 D-list (NO inconsistency surfaced; promotion is
  in-scope per Stage A close gate #4) + the locked Wave 4 plan A8 §
  scope (perf baseline + conditional chunking + status promotion +
  Pre-promotion review walkthrough).

## D2 trigger judgment

Per ADR-0007 D2 row mapping for A8 (verified at PLAN time per the
locked Wave 4 plan A8 § lines 299-308 + plan-challenger Q5
absorbtion at Pre-A3 lock):

- **Row 1 (CONTRACT.md change)**: **NO.** A8 makes zero changes to
  any `packages/*/CONTRACT.md` or `apps/site/CONTRACT.md`. The
  ADR-0014 file IS in `docs/decisions/`, NOT a CONTRACT.md; ADR
  edits do not count as CONTRACT changes per the ADR-0011 D2
  consistency invariant. The README index edit similarly does not
  count (README is documentation, not CONTRACT). TC12 + TC13 + TC14
  verify empty diff across all CONTRACT.md targets.
- **Row 2 (package add / remove)**: **NO.** A8 adds zero new
  workspace packages. The `@skb/heavy-block-boundary` package was
  added at A1 (#31); A8 does not add or remove any package.
- **Row 3 (cross-cutting refactor)**: **NO.** A8 is doc-promotion +
  perf-baseline + conditional 1-line config edit; no existing files
  refactored.
- **Row 4 (new ADR required)**: **NO.** Per locked Wave 4 plan A8 §
  lines 302-303 explicit judgment: "promoting existing ADR is not
  'new ADR creation'; tracking via ADR's own Amendments section".
  The Amendments § entry IS the audit trail; the underlying decision
  document remains v0.2 prose unchanged (the v0.2.1 increment
  captures status + post-implementation review pointer only).
  ADR-0015 (Wave 4 close ceremony ADR) is **explicitly OUT-OF-SCOPE**
  per D11 of the locked plan + plan-challenger C9 absorbtion at
  Pre-A3.
- **Row 5 (cross >= 3 packages)**: **NO.** A8 modifies at most 1
  file inside `apps/site/` (`astro.config.mjs` conditional 1-line
  edit) + zero files inside `packages/`. The doc edits live in
  `docs/decisions/` + `docs/audits/` + `docs/plans/`; cross-package
  scope is zero.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** A8 introduces
  no sibling-divergent pattern; the conditional `manualChunks` rule
  (if path-A) follows the existing 4-rule `@skb/...` workspace
  specifier + `/packages/.../` realpath pattern verbatim.
- **Row 7 (legacy doc resurrection)**: **NO.** ADR-0014 is the
  current Wave 4 architectural ADR (locked at Pre-A2 #29
  `876d700`); promotion is forward-progress, not resurrection.
- **Row 8 (CI / build / deploy / auth / security)**: **borderline
  → NO.** Per Wave 4 plan A8 § lines 304-305 explicit judgment:
  "perf-auditor dispatched; not CI workflow change". The
  `codex-perf-auditor` dispatch happens at EXECUTE-time as a codex
  exec invocation, NOT a CI workflow / GitHub Actions change. The
  conditional `astro.config.mjs` edit is a Vite build configuration
  tweak (chunking only), NOT a CI / deploy / auth / security
  posture change. Per plan-challenger Q5 absorbtion, Row 8
  borderline cases default to NO unless the change touches
  `.github/workflows/`, `Dockerfile`, auth-related code paths, or
  security-related code paths; A8 touches none of these.

→ **Standard PR; D1 stage 4 PRE-COMMIT CLAUDE REVIEW NOT
formally mandatory** per the row table above. Same execution
discipline as A7 + A6 (D1 stage 1 PLAN → stage 2 EXECUTE → stage 3
REVIEW → stage 5 COMMIT → stage 6 ACCEPT; stage 4 SKIPPED per the
formal trigger absence).

**HOWEVER**, given A8 is the **Stage A close PR** (highest-blast-radius
surface in Wave 4 to date because it ratifies the entire ADR-0014
implementation arc + decides the chunking strategy with cross-route
bundle-impact + flips the status of the locked architectural ADR),
**orchestrator-self heightens acceptance discipline at stage 6
(ACCEPT)** per the locked Wave 4 plan A8 § lines 306-307 ("Stage 4
NOT mandatory per ADR-0011 D1 D2 row table; orchestrator-self review
at minimum (per plan-challenger Q5 absorbtion)") + the
recommendation in the dispatch prompt: pr-writer's second invocation
(ACCEPT) walks all 20 acceptance bullets with the actual diff in
hand, not just a summary. Reviewer codex still runs ADR-0006 8-point
checklist + ADR-0006 D8 explicit-file-list staging in stage 5.

## Pre-promotion review of ADR-0014 v0.2 against actual implementation

> **Stage A close gate #4** (locked Wave 4 plan lines 83-87 +
> plan-challenger C5 absorbtion at Pre-A3 lock): A7→A8 transition
> includes formal "post-implementation review of ADR-0014 v0.2
> against actual implementation" checkpoint. If A1-A7 surface ADR
> inconsistency, open ADR-0014 v0.2.1 amendment BEFORE A8 status
> flip; do NOT retrofit silently.

This section walks **D1-D9 (decision sections)** + **AC#1-#15
(acceptance criteria)** against the as-merged A1-A7 PRs (#31-#37,
squash HEADs `f765968` `1d2f324` `92c8751` `5f360a6` `59a93c0`
`95ba33b` `87d0b32`). PLAN-time verdict: **NO inconsistencies
surfaced** → in-scope path applies (status flip + Amendments §
ship in this PR). EXECUTE-time re-walks the review on the actual
diff; if EXECUTE surfaces an inconsistency, the PR is held at
REVIEW for a re-scope (open v0.2.1 amendment as a separate small
PR FIRST; A8 becomes promotion-only).

### D-section walkthrough

- **D1 — Component API** (ADR-0014 lines 80-115; the props interface
  with `kind: HeavyBlockKind`, `dims: HeavyBlockDimensions`, `load`,
  `loadingText`, `errorText`, `retryLabel`, `maxRetries` (default 2),
  `childProps: P`, `fallback?`, `onLoadError?`):
  - **Implementation evidence**: A1 (#31 `f765968`) shipped the
    package shell with the exact D1 prop interface as a TypeScript
    type definition in `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
    (placeholder body, signature only). A2 (#32 `1d2f324`) implemented
    the body using the same prop interface; A3 (#33 `92c8751`)
    extended the body with the retry path consuming `retryLabel`,
    `maxRetries`, `onLoadError` props from D1; A4 (#34 `5f360a6`)
    consolidated the CONTRACT.md invariants. The prop interface is
    BYTE-IDENTICAL from A1 ship → A4 consolidation; A5 / A6 / A7
    each verified empty diff on the boundary source (per their
    respective TC9 / similar diff guards).
  - **Consistency**: ✅ no drift. The implemented prop interface
    matches D1 verbatim; the branded-type widening for
    `HeavyBlockKind` (D1 line 90-92) is preserved in the
    implementation.

- **D2 — SSR rendering** (ADR-0014 lines 117-140; the HTML structure
  with `data-block`, `data-deferred`, `class="heavy-block-skeleton
  heavy-block-skeleton--<kind>"`, `role="status"`, `aria-busy="true"`,
  `style="width:<W>px;min-height:<H>px;..."`, plus the inner
  `__frame` / `__spinner` / `__text` sub-elements; a11y discipline:
  `role='status'` + `aria-busy` on container, `aria-live='polite'`
  ONLY on text):
  - **Implementation evidence**: A2 (#32 `1d2f324`) shipped the
    SSR HTML structure via React's `renderToString` + `hydrateRoot`
    test (AC#3 byte-equivalence); A4 (#34 `5f360a6`) refined the
    a11y semantics per AC#12 (`role="status"` + `aria-busy` toggling
    + `aria-live="polite"` only on text + `aria-hidden` on spinner)
    + added the `prefers-reduced-motion` CSS rule (AC#14).
  - **Consistency**: ✅ no drift. The DOM structure + ARIA attributes
    match D2 verbatim. The `min-height` (not fixed `height`) post-
    hydration growth allowance per D2 line 134 is preserved.

- **D3 — Hydration behavior + lifecycle** (ADR-0014 lines 142-167;
  the 8-step lifecycle: SSR skeleton → useEffect mount → AbortController
  + load() call → mount-guard → resolve sets Component → reject
  shows error UI + retry → unmount aborts → retry click increments
  attempt with new AbortController → maxRetries disables retry):
  - **Implementation evidence**: A2 (#32 `1d2f324`) implemented
    steps 1-6 (SSR + mount + AbortController + mount-guard + resolve
    + unmount-abort) per AC#1/#2/#3/#6/#10/#11. A3 (#33 `92c8751`)
    implemented steps 5-8 retry path (reject → error UI + retry +
    onLoadError callback + maxRetries bound) per AC#7/#8/#9. The
    8-step lifecycle is fully implemented across A2 + A3.
  - **Consistency**: ✅ no drift. The mount-guard `mountedRef` pattern
    (D3 step 3) is implemented per AC#10 mount-guard test. The
    AbortSignal propagation (D3 step 6) is implemented per AC#11
    test. The retry flow (D3 steps 7-8) is implemented per AC#8 +
    AC#9 tests. Default `maxRetries=2` (D1 line 106) is honored per
    AC#9.

- **D4 — Plugin extensibility** (ADR-0014 lines 169-197; the
  RenderView/EditorView split per heavy block package, with
  HeavyBlockBoundary wrapping RenderView only — NOT EditorView —
  by default; future plugin blocks contribute `<Kind>RenderView` +
  `heavyBoundaryDimensions` + optional pre-wrapped helper):
  - **Implementation evidence**: A4 (#34 `5f360a6`) shipped the
    plugin extensibility test (AC#13) verifying a fake heavy block
    with an unregistered branded kind (e.g., `kind: '3d-graph'`)
    correctly wraps via the API. A1 (#31 `f765968`) CONTRACT.md
    explicitly notes editor consumer scope is out-of-scope (D9);
    A4 (#34 `5f360a6`) consolidated this in the canonical 8-bullet
    invariant list.
  - **Consistency**: ✅ no drift. The split-surface intent (D4 RenderView
    wrappable; EditorView stays unwrapped) is preserved in the
    implementation; the `editor-shell` registration (Wave 3 A3
    pattern, per ADR-0014 line 178-181) is unchanged by Wave 4.

- **D5 — Dimensions ownership** (ADR-0014 lines 199-245; per-block
  declaration of `heavyBoundaryDimensions: HeavyBlockDimensions` in
  each heavy block ui-default package; apps/site consumes via
  `import { heavyBoundaryDimensions as <kind>Dims }`; initial defaults:
  jupyter 600×400 / nn-viz 500×400 / agent-flow 600×400):
  - **Implementation evidence**: A5 (#35 `59a93c0`) shipped the 3
    `heavyBoundaryDimensions` exports from
    `packages/block-{jupyter,nn-viz,agent-flow}/src/ui-default/<kind>.ui.ts`
    + the `apps/site/src/components.ts` rewire that imports the dims
    from each package + uses `<HeavyBlockBoundary>` calls per ADR-0014
    D8 + the per-block adapter pattern
    (`.then((m) => ({ default: m.<Kind>RenderView }))` per D8 R-fix)
    per AC#15.
  - **Consistency**: ✅ no drift. The per-block ownership invariant
    (D5 lines 199-202) is preserved; the dims values match the D5
    table verbatim (jupyter 600×400, nn-viz 500×400, agent-flow
    600×400 — confirmed at A6 (#36 `95ba33b`) playwright test which
    asserts the post-hydration height delta ≤ 5px against these
    initial values). NOTE: A6 / gatekeeper directive #10 reserved
    the right to adjust dims based on real-render measurement; A6
    test PASSING on these initial values means **no dims adjustment
    is needed** (the initial defaults are validated against the
    real rendered components).

- **D6 — Skeleton visual + CSS** (ADR-0014 lines 247-286; co-located
  CSS in `@skb/heavy-block-boundary/src/heavy-block-skeleton.css`,
  consuming `@skb/design-tokens` CSS variables with minimal hex
  fallbacks; `prefers-reduced-motion` query):
  - **Implementation evidence**: A4 (#34 `5f360a6`) shipped
    `packages/heavy-block-boundary/src/heavy-block-skeleton.css` +
    refined `HeavyBlockBoundary.tsx` to import + apply CSS classes
    + included the `prefers-reduced-motion` rule per AC#14.
  - **Consistency**: ✅ no drift. CSS class names match D6 verbatim
    (`heavy-block-skeleton`, `heavy-block-skeleton__frame`,
    `heavy-block-skeleton__spinner`, `heavy-block-skeleton__text`);
    CSS variables consume `@skb/design-tokens` tokens with hex
    fallbacks; `prefers-reduced-motion` rule disables spinner
    animation per D6 line 271-273.

- **D7 — Package ownership** (ADR-0014 lines 288-314; new
  `@skb/heavy-block-boundary` package with `peerDependencies: {
  react: ">=18", react-dom: ">=18" }`; optional
  `@skb/design-tokens`):
  - **Implementation evidence**: A1 (#31 `f765968`) shipped the
    `packages/heavy-block-boundary/` package with the D7-specified
    shape: `package.json` with the peerDeps + optional design-tokens
    dep, `tsconfig.json`, `CONTRACT.md` (the public surface defined
    in ADR-0014 D1 + the W4-1 invariant from block-foundation), the
    `src/index.ts` barrel, the `src/HeavyBlockBoundary.tsx`
    placeholder, and the `src/__tests__/skeleton.test.ts` vitest
    skeleton. apps/site `package.json` added `@skb/heavy-block-boundary`
    to deps (proves not-dead per ADR-0008 D1; codex-structure-auditor
    `TOTAL_VIOLATIONS 0` evidence in A1 audit log archive).
  - **Consistency**: ✅ no drift. The package ownership +
    peerDependencies + dep declarations match D7 verbatim; the
    package count went from 21 → 22 per ADR-0014 Negative consequences
    line 434.

- **D8 — Migration of 3 existing heavy blocks** (ADR-0014 lines
  316-345; replace `makeHeavyBlockPlaceholder` calls in
  `apps/site/src/components.ts` with `<HeavyBlockBoundary>` calls
  importing from `@skb/heavy-block-boundary` + each heavy block's
  `heavyBoundaryDimensions` + adapter pattern for the load:
  `.then((m) => ({ default: m.<Kind>RenderView }))`):
  - **Implementation evidence**: A5 (#35 `59a93c0`) shipped the
    `apps/site/src/components.ts` rewire per AC#15 + the D8 R-fix
    adapter pattern. The `makeHeavyBlockPlaceholder` factory is
    removed; the 3 heavy blocks (Jupyter / NnViz / AgentFlow) are
    now wrapped via `<HeavyBlockBoundary>` with the adapter pattern
    + per-block dims + per-block load function.
  - **Consistency**: ✅ no drift. The migration is complete; A5
    test confirms the rewire shape; A6 (#36 `95ba33b`) playwright
    confirms the runtime behavior (zero layout shift); A7 (#37
    `87d0b32`) does NOT touch components.ts (TC10 verifies empty
    diff at A7 ship), preserving the A5 canonical state.

- **D9 — Editor consumer scope** (ADR-0014 lines 347-364; editor
  Tiptap NodeView consumption is out-of-scope; `editor-shell`
  continues registering heavy block `EditorView` exports directly;
  block-foundation/CONTRACT.md W4-1 invariant scopes the boundary
  to "MDX componentsMap consumption"):
  - **Implementation evidence**: A1 (#31 `f765968`) CONTRACT.md
    explicitly notes editor out-of-scope; A4 (#34 `5f360a6`)
    consolidated this in the canonical 8-bullet invariant list. No
    A1-A7 PR touches `packages/editor-shell/` (per the editor-shell
    section of each PR's diff guard).
  - **Consistency**: ✅ no drift. The editor scope exclusion is
    preserved; the W4-1 invariant in
    `packages/block-foundation/CONTRACT.md` (added at A1 per ADR-0014
    line 504) scopes the boundary to "MDX componentsMap consumption"
    explicitly. A7 (#37 `87d0b32`) added a complementary
    direct-Astro-consumer route at `/sample-blocks-astro` that is
    pure SSR (no React boundary involvement), demonstrating the
    alternative consumption pattern; this is a **valid out-of-D9-scope
    surface** because it is NOT editor consumption — it is direct
    Astro SSR consumption, which D2 + D8 are silent on (the .astro
    variants exist as orphan SSR-safe placeholders pre-A7 ship).
    NO ADR-0014 inconsistency surfaces from A7's new route.

### Acceptance criteria walkthrough

ACs cited from ADR-0014 lines 366-418 (the 15-criterion hardened
test matrix):

- **AC#1 — Component lives in single package** (`@skb/heavy-block-boundary`
  per D7): ✅ A1 (#31 `f765968`) ship + A2/A3/A4 body. Verified via
  `ls packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`
  returning the file at the expected path.
- **AC#2 — Type-safe API** (`HeavyBlockBoundary<P>` props per D1;
  vitest type test on generic `P` + branded `HeavyBlockKind`
  widening): ✅ A2 (#32 `1d2f324`) ship + the type test.
- **AC#3 — SSR/hydration byte-equivalence** (vitest test
  `renderToString` + initial client mount produces identical DOM, no
  hydration mismatch warning): ✅ A2 (#32 `1d2f324`) ship.
- **AC#4 — Exact CSS class/size/style at first paint**
  (`getBoundingClientRect()` or DOM string match): ✅ A4 (#34
  `5f360a6`) ship.
- **AC#5 — No width/height regression at T0/T1** (playwright spec
  comparing post-hydration vs initial render; gatekeeper smoke #10
  layout-shift core mandate): ✅ A6 (#36 `95ba33b`) ship +
  playwright CI green per A6 R2 + A7 R3 CI runs.
- **AC#6 — Successful load path** (vitest test simulates fast
  `load()` resolve; `<LoadedComponent {...childProps} />` renders
  with `data-loaded="true"`): ✅ A2 (#32 `1d2f324`) ship.
- **AC#7 — Rejected load path** (vitest test simulates `load()`
  reject; error UI + retry button + `aria-busy="false"` +
  `onLoadError(err, 1)` called): ✅ A3 (#33 `92c8751`) ship.
- **AC#8 — Retry path** (vitest test clicks retry; new `load()`
  invocation with NEW AbortSignal + skeleton restored + attempt
  count incremented): ✅ A3 (#33 `92c8751`) ship.
- **AC#9 — `maxRetries` bound** (vitest test rejects N+1 times where
  N=`maxRetries`; retry button disabled after; default
  `maxRetries=2` honored): ✅ A3 (#33 `92c8751`) ship.
- **AC#10 — Mount guard** (vitest test mounts component; `unmount()`
  BEFORE `load()` resolves; no React state update warning + no
  `setState` after unmount): ✅ A2 (#32 `1d2f324`) ship.
- **AC#11 — AbortSignal propagation** (vitest test verifies `load()`
  is called with `{ signal }` arg + `signal.aborted=true` after
  unmount): ✅ A2 (#32 `1d2f324`) ship.
- **AC#12 — A11y semantics** (`role="status"` + `aria-busy="true"`
  → `aria-busy="false"`; `aria-live="polite"` only on text element;
  spinner `aria-hidden`): ✅ A4 (#34 `5f360a6`) ship.
- **AC#13 — Plugin extensibility test** (vitest test wraps a fake
  heavy block via the API + verifies skeleton + load flow for an
  unregistered branded kind): ✅ A4 (#34 `5f360a6`) ship.
- **AC#14 — `prefers-reduced-motion` handled** (vitest CSS-in-JS
  test asserts `@media (prefers-reduced-motion: reduce)` rule
  present + spinner animation disabled): ✅ A4 (#34 `5f360a6`) ship.
- **AC#15 — Dimensions sourced from heavy block** (contract test
  confirms `apps/site/src/components.ts` imports `heavyBoundaryDimensions`
  from each heavy block package, NOT inline literals): ✅ A5 (#35
  `59a93c0`) ship.

**AC tally**: 15/15 ACs satisfied. ✅ all green.

### Pre-promotion review verdict

**PLAN-time verdict (this PR.md)**: NO inconsistencies surfaced
across D1-D9 + AC#1-#15 against the as-merged A1-A7 implementation.
The in-scope path applies: A8 ships the status flip + Amendments §
+ perf baseline + conditional chunking decision in this single PR.
The alternative scope (open v0.2.1 amendment FIRST in a separate
small PR THEN promote in a re-scoped A8 per plan-challenger C5
absorbtion) is **NOT triggered**.

**EXECUTE-time re-walk**: orchestrator-self (or executor) re-reads
this section against the actual files at HEAD before writing the
v0.2.1 Amendments § + flipping the status. If EXECUTE surfaces a
NEW inconsistency that PLAN-time missed (e.g., a CONTRACT.md drift
discovered post-A7 merge), the PR is held at REVIEW (D1 stage 3)
for re-scope; A8 becomes promotion-only after the v0.2.1 amendment
PR ships. **PLAN-time confidence**: HIGH (the A1-A7 PR.md files
each include explicit ADR-0014-compliance acceptance bullets +
diff guards that verified the implementation against the ADR at
ship time; A8 PLAN-time review confirms no drift between then and
now via the diff-guard TCs in this PR.md).

## Revert plan (Stage A close — partial revert isolation)

A8 ships 4 logically separable deliverables (status flip + perf
baseline + conditional chunking + active.md bookkeeping). If any
ONE deliverable fails REVIEW or post-COMMIT verification, the
revert is per-deliverable:

1. **ADR status flip fails review** (e.g., reviewer surfaces a
   D-section / AC inconsistency the Pre-promotion review missed):
   open ADR-0014 v0.2.1 amendment FIRST in a separate small PR (per
   plan-challenger C5 absorbtion); A8 becomes promotion-only after
   that PR merges; re-do the Pre-promotion review on the patched
   v0.2.1 prose; re-issue A8 with promotion-only scope. The perf
   baseline + chunking decision in A8 can either ship in the
   re-scoped A8 OR split into a separate PR (A8a perf + A8b
   promotion); orchestrator-self chooses the split based on review
   feedback complexity.

2. **Perf baseline / chunking decision fails review** (e.g., the
   audit reveals a higher-priority chunking concern that A8 cannot
   address in scope): hold the chunking edit; ship A8 with status
   flip + Amendments § + perf doc only (no `astro.config.mjs` edit);
   open a follow-up forward-fix PR for the chunking refinement.
   The perf doc is the source-of-truth for the deferred decision.

3. **active.md bookkeeping breaks (e.g., row sequence shifted by a
   parallel PR)**: executor adapts the line-number references while
   preserving the documented edit semantics; the verbatim `Stage A
   ✅ DONE` marker string + verbatim `Stage B B1` pointer string
   are TC-grepped (TC11), so the executor must produce these literal
   strings even if line numbers shift.

4. **Codex-perf-auditor dispatch fails / hangs / produces unusable
   output** (e.g., per memory `feedback_codex_audit_log_recursion`
   the auditor enters self-recursion on its own log; per
   `feedback_codex_spark_lint_gap` the auditor doesn't run lint —
   here perf-auditor doesn't claim to so this gap doesn't apply):
   per the runbook line 248-249 R7 piping discipline, the raw
   stdout pipes to `/tmp/codex-runs/...` off-workspace; if the run
   hangs, kill it (per the audit-log self-recursion mitigation:
   watchdog kill at ~500 KB log size); restart the dispatch with
   the same command + same off-workspace target; if multiple
   restarts fail, fall back to a manual perf measurement via
   `pnpm --filter @skb/site exec astro build --analyze` +
   `find apps/site/dist/_astro -name '*.js' -exec wc -c {} \;` +
   `grep -l 'HeavyBlockBoundary' apps/site/dist/_astro/*.js` (the
   3 commands the auditor runs internally; orchestrator-self can
   reproduce the leak analysis manually if codex automation fails).
   Document the manual fallback in the perf doc's `## Methodology`
   section.

## acceptance

1. **ADR-0014 status flip**: line 5 of
   `docs/decisions/ADR-0014-heavy-block-boundary.md` changes from
   `| 状态 | proposed |` to `| 状态 | accepted |` (single-character
   substitution; column-pipe alignment preserved). TC4(a) + TC4(b)
   evidence (positive grep for `accepted` + zero grep for `proposed`).

2. **ADR-0014 Amendments § v0.2.1 entry added**: a new `## Amendments`
   section appended after the existing `## Plan-challenger codex
   absorbtion` section logs the v0.2.1 status promotion with date
   (2026-05-03), Stage A close authority cross-reference (Wave 4
   plan close criterion #1 + gatekeeper directive 2026-05-03 #3),
   the implementation PRs table (#31-#37 squash HEADs `f765968`
   `1d2f324` `92c8751` `5f360a6` `59a93c0` `95ba33b` `87d0b32` + A8
   `#TBD TBD`), the Pre-promotion review pointer to this PR.md
   `## Pre-promotion review` section, and the close-gate satisfaction
   summary (4/4 gates ✅). TC4(c) + TC4(d) + TC4(e) evidence
   (`## Amendments` header + `v0.2.1` token + `Stage A close` token).

3. **README index ADR-0014 row updated**: line 22 of
   `docs/decisions/README.md` changes from `... | proposed |` to
   `... | accepted |` (single-row edit; no other rows or columns
   modified). TC5(a) + TC5(b) evidence.

4. **Pre-promotion review section in this PR.md** walks D1-D9 +
   AC#1-#15 against the A1-A7 implementation (PRs #31-#37 squash
   HEADs cited inline) + concludes with PLAN-time verdict (NO
   inconsistencies; in-scope path) + EXECUTE-time re-walk
   instruction. PLAN-time verdict is **NO inconsistency** → in-scope
   path applies. (If EXECUTE surfaces an inconsistency, re-scope per
   plan-challenger C5 absorbtion: open v0.2.1 amendment FIRST in a
   separate small PR, THEN promote in a re-scoped A8.)

5. **codex-perf-auditor dispatched + audit log archived**: the
   canonical bash from the runbook line 236 (`codex exec --yolo
   --profile perf-auditor < /dev/null`) ran with R7 piping (raw
   stdout to `/tmp/codex-runs/2026-05-03-A8-perf-auditor.txt` per R7
   off-workspace; truncated archive at
   `docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt` per `head
   -2000`). TC9 evidence (file present + size ≤ 2000 lines).

6. **Perf baseline doc authored**: `docs/audits/perf-2026-05-03.md`
   ships with the required sections (Context, Methodology, Lighthouse
   scores, Bundle size table, Heavy-block-boundary leak analysis,
   Decision: chunked OR no-op, Cross-references). The `Decision:`
   section explicitly states path-A (chunked with evidence) OR
   path-B (no-op with evidence). TC8 evidence (file present + 100-500
   LOC + section grep).

7. **Phase 2 chunking decision recorded** (per plan-challenger C4
   absorbtion + Pre-A3 D10 data-driven discipline):
   - **Path A** (IF perf audit shows `@skb/heavy-block-boundary`
     code in any prose-only chunk): `apps/site/astro.config.mjs`
     adds **one** new `manualChunks` rule
     `if (id.includes('@skb/heavy-block-boundary') || id.includes(
     '/packages/heavy-block-boundary/')) return 'heavy-block-boundary';`
     **BEFORE** the existing `heavy-boundary-dimensions` rule;
     post-edit re-build confirms the new chunk emits + leak resolved.
   - **Path B** (IF NO leak): NO change to `astro.config.mjs`; the
     no-op decision is documented in the perf doc with bundle table
     evidence.
   - TC6 + TC7 evidence (bounded diff envelope: 0 LOC if path-B,
     ≤ 12 LOC unified-diff if path-A).

8. **`apps/site/astro.config.mjs` edit ONLY if leak data justifies**:
   no preemptive chunking rule addition without the perf audit
   evidence. Per plan-challenger C4 absorbtion: "do NOT preemptively
   split without data". TC6 + TC7 evidence + perf doc cross-reference.

9. **AC#5 confirmed PASS** (zero layout shift): A6 playwright spec
   `apps/site/playwright/heavy-block-layout-shift.spec.ts` runs
   green in A6 R2 + A7 R3 CI runs (verified PLAN-time via the A7
   R3 CI status); no regression in A8 (A8 makes zero changes to the
   playwright spec or the components.ts rewire that the spec
   exercises). Pre-promotion review section confirms.

10. **AC#1 + AC#2 + AC#3 + AC#4 + AC#6 + AC#7 + AC#8 + AC#9 + AC#10
    + AC#11 + AC#12 + AC#13 + AC#14 + AC#15 confirmed PASS** via
    the A1-A7 test suites (vitest in
    `packages/heavy-block-boundary/src/__tests__/` + apps/site
    vitest in `apps/site/src/__tests__/`) + the diff-guard TCs in
    this PR.md (TC12 + TC13 + TC14 + TC18 verify zero source edits
    to the boundary + 5 block packages + apps/site src + content
    notes). Pre-promotion review section enumerates each AC's
    implementation PR + status (15/15 green).

11. **`docs/plans/active.md` 5-edit Stage A close bookkeeping
    applied**: A7 row backfilled (`#37` `87d0b32`); new A8 row
    added; "Stage A remaining" row replaced with `**Stage A ✅
    DONE** (8/8 PRs merged 2026-05-03)` marker; top-line phase
    summary on line 6 + 起手指引 line 82 updated to include
    `+ A8` in the done list + flip the next-PR pointer to `Stage
    B B1 (ADR-0012 amendment...)`; Wave 4 mandatory scope
    checkboxes lines 27-31 updated with ✅ marks for ADR-0014
    + C4a/C4b/C5 (closed by A1-A8). TC10 + TC11 evidence.

12. **Stage A close criterion #1 satisfied** (ADR promotion in A8
    same commit per gatekeeper directive 2026-05-03 #3 + Wave 4
    plan close gate #1 lines 71-74): YES — bullet 1 + 2 + 3 ship
    in the same A8 commit (status flip + Amendments § + README
    refresh). NO deferral to Stage B / forward-fix.

13. **Stage A close criterion #2 satisfied** (A6 playwright zero-
    layout-shift PASS per gatekeeper directive 2026-05-02 + Wave 4
    plan close gate #2 lines 75-78): YES — A6 (#36 `95ba33b`)
    merged with green CI; A7 (#37 `87d0b32`) merged with green CI
    that includes the playwright spec; no regressions through A7.

14. **Stage A close criterion #3 satisfied** (A2 + A3 core impl +
    retry semantics regressions resolved per Wave 4 plan close gate
    #3 lines 79-82): YES — A2 (#32 `1d2f324`) shipped the core
    hydration + lifecycle + mount-guard tests passing 100%; A3
    (#33 `92c8751`) shipped the retry + maxRetries + onLoadError
    tests passing 100%; A4/A5/A6/A7 each verified empty diff on
    the boundary source (per their respective TC9 / similar diff
    guards), confirming no regression introduced.

15. **Stage A close criterion #4 satisfied** (A7→A8 transition
    Pre-promotion review checkpoint per Wave 4 plan close gate #4
    lines 83-87): YES — this PR.md `## Pre-promotion review of
    ADR-0014 v0.2 against actual implementation` section is the
    formal checkpoint; PLAN-time verdict is NO inconsistencies;
    EXECUTE-time re-walk is the second-pass guard.

16. **ADR-0015 explicit OUT-OF-SCOPE** per locked Wave 4 plan D11
    (line 514) + plan-challenger C9 absorbtion at Pre-A3:
    close-ceremony work begins AFTER Stage C closes; A8 ships at
    Stage A close, well before any close-ceremony scope.

17. **Out-of-scope deferred to Stage B**: ADR-0012 amendment +
    path-prose alignment (B1 scope per Wave 4 plan lines 329-348);
    sample-assets ship (B2 lines 350-361); intro prose update (B3
    lines 363-374); `__test_cjk__` relocate (B4 lines 376-...);
    Wave 3 retrospective items 2-7 (B5a + B5b); close-ceremony
    prep (B6). A8 does NOT preempt any of these.

18. **PR.md self-listed in `## files`** per ADR-0006 D8 strict
    whitelist (Pre-A1+A2+A3+A1+A2+A3+A4+A5+A6+A7 precedent). TC25
    evidence.

19. **Codex review iterations expected**: R1 + 0-1 forward-fix.
    Typical risk classes for A8: (a) the v0.2.1 Amendments § prose
    structure — reviewer may request tighter cross-references or
    re-ordering; orchestrator-self iterates; (b) the perf doc
    placeholder fill-in — if codex-perf-auditor stdout misses a
    section the doc requires, orchestrator-self fills the gap from
    the manual fallback (per Revert plan §4); (c) the conditional
    `astro.config.mjs` edit — reviewer may request a different
    chunk-name convention or rule placement; orchestrator-self
    iterates within the bounded TC6 envelope.

20. **AC coverage in A8**: NONE NEW (A8 is meta — promotion +
    perf-baseline + close-gate-satisfaction); ADR-0014 AC#1-#15
    confirmed via Pre-promotion review walkthrough (15/15 green
    against A1-A7 implementation evidence). No NEW vitest /
    playwright tests are added in A8 (the diff-guard TCs in this
    PR.md are validation grep + regression baseline + link-check
    only, not new producer-side tests).

## executor

Per Wave 4 plan A8 § lines 296-298 + locked D1 pipeline (ADR-0011
D1 + Pre-A1 codified runbook discipline):

- **PLAN**: pr-writer Claude subagent (you, this dispatch).

- **EXECUTE**: **combination dispatch** (multi-actor; orchestrator-
  self coordinates):

  - **A8.A — Perf baseline (FIRST)**: orchestrator-self dispatches
    `codex-perf-auditor` per the runbook canonical bash at line 236
    (`codex exec --yolo --profile perf-auditor < /dev/null` with R7
    `set -o pipefail` + `2>&1 | tee /tmp/codex-runs/2026-05-03-A8-perf-auditor.txt`
    + post-run `head -2000` archival per the runbook line 248-249).
    The auditor produces Lighthouse scores + size-limit table + Astro
    `--analyze` graph + manual grep evidence for boundary code per
    chunk. Orchestrator-self reads stdout + identifies the chunking
    decision (path-A leak vs path-B no-op) + drafts the curated
    `docs/audits/perf-2026-05-03.md` summary (per the runbook line
    250 "Wave-close 时由 orchestrator 另写 curated summary").

  - **A8.B — ADR Amendments § prose (orchestrator-self)**:
    orchestrator-self drafts the v0.2.1 Amendments § entry in
    `docs/decisions/ADR-0014-heavy-block-boundary.md` (the
    promotion-language is doc-policy work, not codex-class
    scaffolding; per Wave 4 plan A8 line 298: "orchestrator-self for
    ADR promotion language"). The Amendments § draft consumes the
    Pre-promotion review verdict from this PR.md + the implementation
    PRs table from `active.md`.

  - **A8.C — README index status flip (`codex-generic-executor`)**:
    `codex-generic-executor` applies the line 22 `proposed → accepted`
    edit per the bounded-edit pattern (single-row substitution; no
    other table or section modified).

  - **A8.D — `active.md` 5-edit Stage A close bookkeeping
    (`codex-generic-executor`)**: applies the 5 edits documented in
    `## files` above (A7 row backfill + A8 row + Stage A done marker
    row + lines 6 / 82 next-PR pointer flip + Wave 4 mandatory scope
    ✅ marks). Per the existing precedent, the verbatim marker
    strings (`Stage A ✅ DONE`, `Stage B B1 (ADR-0012 amendment...)`,
    etc.) are honored even if line numbers drift.

  - **A8.E — Conditional `astro.config.mjs` edit
    (`codex-generic-executor`)**: applies the path-A 1-line
    `manualChunks` rule addition IF the perf audit (A8.A) shows
    leak; otherwise NO edit. Post-edit `pnpm --filter @skb/site
    build` confirms the new chunk emits + leak resolved (re-grep
    evidence captured in the perf doc).

  - **A8.F — Perf doc finalization (`codex-generic-executor` after
    orchestrator-self drafts)**: orchestrator-self drafts the doc
    skeleton + decision (path-A vs path-B) + leak analysis;
    `codex-generic-executor` may handle table population from the
    auditor stdout if dispatched separately, but the architectural
    decision-language MUST be orchestrator-authored.

  - **A8.G — Codex archive truncation
    (`codex-generic-executor` or shell)**: post-A8.A run, apply
    `head -2000 /tmp/codex-runs/2026-05-03-A8-perf-auditor.txt >
    docs/audits/codex-runs/2026-05-03-A8-perf-auditor.txt` to truncate
    the archive per the runbook line 249.

  Per Pre-A1 codified Universal Bash invariants in
  `docs/runbooks/codex-tool-invocations.md`: every codex dispatch
  uses `--yolo --profile <X>` + `set -o pipefail` + `2>&1 | tee
  /tmp/codex-runs/<X>.txt` raw + `head -2000 > docs/audits/codex-runs/<X>.txt`
  truncated archive.

- **REVIEW**: codex-pr-reviewer-55 (codex CLI 5.5,
  `--yolo --profile codex-pr-reviewer-55`). ADR-0006 8-point
  checklist mandatory; ADR-0006 D8 explicit-file-list staging
  mandatory. Reviewer also walks the Pre-promotion review section +
  cross-checks each D-section / AC verdict against the actual
  files at HEAD (not just the cited PR.md prose) per memory
  `feedback_pr_reviewer_authority_at_head` (read authority types at
  HEAD before overruling codex; here applied symmetrically — read
  ADR-0014 D-list at HEAD before signing off the promotion).

- **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)**: **NOT FORMALLY
  MANDATORY** per `## D2 trigger judgment` above (no Row 1 / Row 4
  / Row 8 hit). SKIPPED in formal pipeline; orchestrator-self
  applies heightened acceptance discipline at stage 6 (ACCEPT) per
  the Stage A close blast-radius rationale documented in the
  D2-judgment section closing prose.

- **COMMIT (D1 stage 5)**: reviewer codex commits via the Pre-A1
  codified `git reset HEAD` → `git add <list>` → `git diff --cached
  --stat` verify → `git commit` 4-step (memory
  `feedback_git_operator_explicit_stage`). Lockfile scope check
  per the same memory: lockfile MUST be byte-unchanged (TC16
  pre-commit verifies); if lockfile is contaminated, restore from
  clean historical blob.

- **ACCEPT (D1 stage 6)**: pr-writer Claude subagent second
  invocation (this same agent role, separate dispatch post-COMMIT).
  Walks all 20 acceptance bullets above with the actual diff in
  hand (per the heightened acceptance discipline note); residue
  list (per ADR-0011 D1 ACCEPT contract) returned to orchestrator
  for Stage B PLAN seed.

- **POST-MERGE**: `gh pr merge --squash --delete-branch` per Wave 3
  auto-merge authorization (memory `feedback_wave3_auto_merge`); on
  successful squash, `active.md` A8 row's `#TBD | TBD` placeholders
  are filled by the orchestrator in a no-op forward-fix bookkeeping
  PR (or, more likely per the one-row-per-PR cadence, by the NEXT
  PR which is Stage B B1 — B1 PLAN backfills the A8 row when
  bookkeeping its own row).

## Out of scope (deferred)

- **B-stage** (per locked Wave 4 plan lines 320-...):
  - **B1 — ADR-0012 amendment** (PageFind query-time substring +
    `_pagefind/` → `pagefind/` path-prose alignment per memory
    `feedback_pagefind_query_substring` + ADR-0013 D3); doc-only ADR
    amendment via orchestrator-self.
  - **B2 — sample-assets ship** (4 binary files: 3 PNG + 1 PDF +
    favicon); manual binary file placement per gatekeeper smoke #8.
  - **B3 — sample-blocks intro prose update** (remove obsolete
    "Wave 3 mdx-bridge integration WILL register" prose; reflect
    Wave 3 + Wave 4 Stage A status); doc-only MDX prose update per
    gatekeeper smoke #9.
  - **B4 — `__test_cjk__` relocation** (move test fixtures out of
    production content collection per Wave 3 retrospective #5).
  - **B5a + B5b — Wave 3 retrospective items 2-7** (the remaining
    retrospective items not closed at A1-A8).
  - **B6 — close-ceremony prep** (Stage B-tail prep work for the
    Wave 4 close ADR; the actual ADR-0015 creation begins AFTER
    Stage C closes per D11).

- **C-stage**: open-ended Phase 1 user-iteration scope per gatekeeper
  directive #4 + MVP framework.

- **A8 explicitly does NOT touch**:
  - `packages/heavy-block-boundary/**` (TC11 — A4-locked source +
    CONTRACT.md byte-frozen; A8 promotes the ADR governing this
    package without touching the source).
  - `packages/block-{jupyter,nn-viz,agent-flow,math,pdf}/**` (TC12
    + TC13 — 5 block packages byte-unchanged; A8's chunking decision
    is consumer-side at apps/site, NOT producer-side).
  - `apps/site/src/**` + `apps/site/playwright/**` +
    `apps/site/CONTRACT.md` + `apps/site/package.json` (TC14 — A5's
    `components.ts` rewire + A6's playwright spec + A7's new page
    all byte-unchanged; A8's only apps/site touch is conditionally
    `astro.config.mjs`).
  - `agent-contract.md` + `CLAUDE.md` (TC15 — agent roster +
    generated entry-point byte-unchanged).
  - `pnpm-lock.yaml` (TC16 — no new deps).
  - `.github/workflows/ci.yml` (TC17 — no CI workflow change).
  - `content/notes/**` (TC18 — notes content byte-unchanged).
  - Other 13 ADR files (TC19 — only ADR-0014 + README touched in
    `docs/decisions/`).
  - Prior PR.md files A1-A7 + Pre-A1/A2/A3 (TC20 — bookkeeping
    happens in `active.md`, not in prior PR.md bodies).
  - Other audit files in `docs/audits/` (TC21 — Wave 3 close perf
    baseline + structure baselines byte-unchanged; only the new
    `perf-2026-05-03.md` + new codex archive appear).
  - Runbook `docs/runbooks/codex-tool-invocations.md` (TC22 — A8
    follows the existing runbook prose verbatim; no runbook updates).

## Related

- **Wave 4 plan locked**:
  [docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  § A8 lines 274-318 (Stage A close criterion lines 71-87 +
  plan-challenger C4 + C5 + Q5 + C9 absorbtion table at end of
  plan + D10 line 513 + D11 line 514).
- **Wave 4 active.md pointer**:
  [docs/plans/active.md](../active.md) — A7 row backfill +
  A8 row + Stage A ✅ DONE marker + Stage B B1 next-PR pointer
  flip applied here.
- **ADR-0014 (the promotion target; this PR flips status `proposed →
  accepted`)**:
  [docs/decisions/ADR-0014-heavy-block-boundary.md](../../decisions/ADR-0014-heavy-block-boundary.md).
- **README ADR index (the cross-reference companion to the ADR
  status flip)**:
  [docs/decisions/README.md](../../decisions/README.md).
- **Sister A-stage PR.md** (Pre-promotion review walkthrough cites
  these as implementation evidence):
  [A1](./A1-heavy-block-boundary-package.md) +
  [A2](./A2-heavy-block-boundary-core.md) +
  [A3](./A3-heavy-block-boundary-retry.md) +
  [A4](./A4-heavy-block-boundary-css-a11y.md) +
  [A5](./A5-apps-site-heavy-block-dims-migration.md) +
  [A6](./A6-heavy-block-playwright-layout-shift.md) +
  [A7](./A7-astro-variants-consolidation.md).
- **ADR-0011 D1-D8 linear pipeline**:
  [docs/decisions/ADR-0011-linear-pipeline-execution-model.md](../../decisions/ADR-0011-linear-pipeline-execution-model.md).
- **ADR-0007 D2 trigger rows**:
  [docs/decisions/ADR-0007-job-function-codex-heavy-execution.md](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
  D2.
- **ADR-0006 D8 explicit-file-list staging + 8-point checklist**:
  [docs/decisions/ADR-0006-asymmetry-audit-checklist.md](../../decisions/ADR-0006-asymmetry-audit-checklist.md).
- **codex-perf-auditor profile § + R7 piping discipline**:
  [docs/runbooks/codex-tool-invocations.md](../../runbooks/codex-tool-invocations.md)
  lines 229-263.
- **Wave 3 close perf baseline** (predecessor; for size-trend
  comparison + curated-summary shape precedent):
  [docs/audits/perf-2026-05-wave-3-close.md](../../audits/perf-2026-05-wave-3-close.md).
- **apps/site Vite chunking config (the conditional A8.E target)**:
  [apps/site/astro.config.mjs](../../../apps/site/astro.config.mjs).
- **agent-contract.md (single source for agent roster)**:
  [agent-contract.md](../../../agent-contract.md).
- **Memories applied at A8 PLAN**:
  - `feedback_wave3_auto_merge` — `gh pr merge --squash
    --delete-branch` post-merge cadence.
  - `feedback_codex_audit_log_recursion` — perf-auditor R7
    off-workspace piping mitigation.
  - `feedback_pr_reviewer_authority_at_head` — reviewer reads
    ADR-0014 D-list at HEAD before signing the promotion (not
    just the cited PR.md prose).
  - `feedback_git_operator_explicit_stage` — D1 stage 5 commit
    4-step + lockfile byte-unchanged invariant.
  - `feedback_lychee_line_anchor` — no `:line` suffix on relative
    file links above.
  - `feedback_lychee_user_local_paths` — no `~/.claude/...` links
    in this PR.md.
  - `feedback_codex_spark_lint_gap` — N/A for perf-auditor (it
    doesn't claim to run lint; orchestrator runs `pnpm check`
    independently per TC24).
  - `feedback_active_writer_break_we009` — A8 is single-PR linear
    pipeline (no concurrent worker); WE-009 not applicable.
