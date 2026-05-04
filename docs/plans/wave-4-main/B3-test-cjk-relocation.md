# B3 — `__test_cjk__` partial relocation (notes index filter; preserve PageFind coupling)

> **Wave 4 Stage B FOURTH implementation PR** of the re-locked 8-PR
> sequence (B1a → B1b → B2 → **B3** → B4 → B5 → B7 → B6; see Wave 4
> plan v0.2.1 Amendment Driver 1+2 + active.md roster). B1a (squash
> `1aa2811`; PR #39), B1b (squash `5ec7123`; PR #40), B2 (squash
> `317dda3`; PR #41) merged 2026-05-03; B3 is the next implementation
> PR. **Standard ADR-0011 D1 pipeline** (no D2 row 1 / 2 / 4 / 5 / 8
> trigger HIT; `## D2 trigger judgment` below); stage 4 PRE-COMMIT
> CLAUDE REVIEW does NOT fire. Out of scope: see
> `## Out of scope (deferred)` — B4-B6 + B7 PRs all deferred per
> Wave 4 plan v0.2.1 roster.

## title

Add a slug-prefix filter `!note.id.startsWith('__test_')` to the
existing `getCollection('notes')` filter chain on
`apps/site/src/pages/index.astro:8`, so the user-facing notes index
page (`/`) hides the two `__test_cjk__/{laptop,zh-note}` test
fixtures from the rendered note list — WHILE preserving their
static-page generation under `dist/notes/__test_cjk__/{laptop,zh-note}/index.html`
(astro `getStaticPaths` for the `[...slug].astro` route is NOT
filtered) so that PageFind continues to index the CJK titles
`中文笔记测试` + `笔记本电脑` AND the B1b-restored
`apps/site/playwright/search.spec.ts` paired discriminator test
(`笔记` query MUST find `中文笔记测试`; `记本` query MUST NOT show
`笔记本电脑`) keeps passing without any test edit. **Partial
implementation of ADR-0013 D3** (originally "production astro build
doesn't include `__test_cjk__` in `dist/notes/`") — full strict
implementation would break the search.spec.ts paired-discriminator
coupling, so this PR resolves the design conflict by addressing
**only the user-visible-listing concern** (test fixtures not
appearing in `/` notes index) and documenting the search-coupling
constraint in the risk register + acceptance bullets. Backfill
`docs/plans/active.md` B2 row (`#41 | 317dda3 | B2 | sample-blocks
Wave 3 cleanup`) + add B3 row. PR.md self-listed per ADR-0006 D8 +
Pre-A1 → B2 precedent.

## files

3 canonical files + COMMIT-time +B2-orphan-leftover (1; B2 stage 5
commit log not committed in B2 PR per orphan-back-fill precedent
established at B1b/B2) + B3 reviewer audit archives (1-2; R1 always;
R2 if needed); **5-6 files total at commit**. orchestrator-self
EXECUTE for the 3-LOC filter delta + bookkeeping (matches B2's
doc-flavored small-PR precedent). NO `package.json` /
`pnpm-lock.yaml` change (no new deps; pure JS expression added to
existing filter chain). NO `apps/site/astro.config.mjs` change
(filter applies to `getCollection` runtime call, not build config).
NO `apps/site/src/pages/notes/[...slug].astro` change (the dynamic
route's `getStaticPaths` MUST stay un-filtered to preserve
`dist/notes/__test_cjk__/*/index.html` generation; verified by TC5
post-build dist file presence assertion).

- `apps/site/src/pages/index.astro` — **MODIFIED** (~3 LOC delta).
  Current filter at line 8 reads
  `.filter((note: NoteEntry) => !note.data.draft)`.
  EXECUTE rewrites this single call to:
  `.filter((note: NoteEntry) => !note.data.draft && !note.id.startsWith('__test_'))`.
  Net delta: 1 logical condition added (~3 LOC after Prettier
  re-flow if the line wraps; otherwise 1 LOC delta). The filter
  scope is the notes-index-page rendered list ONLY; `getStaticPaths`
  for the per-note dynamic route lives at
  `apps/site/src/pages/notes/[...slug].astro` (verified PLAN-time
  to exist as the canonical per-note page), which is NOT touched —
  so each note's standalone page at `/notes/__test_cjk__/{laptop,zh-note}/`
  continues to be generated to `dist/`, preserving PageFind crawl
  + index coverage of the CJK titles. TC1 verifies the grep on
  `startsWith('__test_')` returns exactly 1 match in
  `apps/site/src/pages/index.astro`.

- `docs/plans/active.md` — **MODIFIED** (~3 LOC delta):

  - **B2 row backfill**: existing
    `| #TBD (this) | TBD | B2 | sample-blocks Wave 3 cleanup
    (4 sample-assets binaries + intro prose refresh; closes
    gatekeeper smoke #8 + #9) |` row at line 25 →
    `| #41 | 317dda3 | B2 | sample-blocks Wave 3 cleanup
    (4 sample-assets binaries + intro prose refresh; closes
    gatekeeper smoke #8 + #9) |` (B2 PR #41 squash `317dda3` per
    the conversation context; orchestrator verifies the canonical
    PR# + commit-hash by running `gh pr list --state merged
    --limit 5` + `git log --oneline -5` at EXECUTE-time before
    backfilling).
  - **NEW B3 row**: append after B2 row + before Stage A summary
    row: `| #TBD (this) | TBD | B3 | __test_cjk__ partial
    relocation (notes index filter; preserve PageFind coupling) |`
    (backfilled at NEXT PR per the one-row-per-PR cadence).

  No mandatory-scope ✅ flips — the existing Stage A close ✅ rows
  on lines 31-35 (Wave 3 carry-overs) cover all closed items;
  Stage B in-progress mid-PR pointer at line 6 stays accurate
  (already says "Stage B opened 2026-05-03 with plan re-lock");
  no structural ✅ flip needed for B3 (B3 is mid-Stage-B
  implementation, not a stage close). TC9(c)+(d) verify the B2
  backfill + B3 row insertion.

- `docs/plans/wave-4-main/B3-test-cjk-relocation.md` — **NEW**
  (this PR.md, self-listed per ADR-0006 D8 + Pre-A1 → B2
  precedent; pr-writer must include the PR.md in the canonical
  `## files` list at PLAN time). ~500 LOC final (PR.md exempt
  from the 200 LOC target per ADR-0011 D2 v0.1.1 + memory
  `feedback_soted_pr_md_discipline`; smaller than B1a/B1b/B2 at
  ~600-1150 LOC because B3 is a 3-LOC filter PR with no
  plan-challenger absorbtion + no D2 trigger + no binary
  generation + no ADR amendment).

## test_cases

B3 ships **0 NEW vitest unit suites** (a 3-LOC filter delta does
not require new test code; the existing 11-corpora `apps/site`
test suite already covers the regression surface — `search-cjk`
+ `search-reindex` + `search-ui` confirm PageFind index parity;
`sample-blocks-page` builds the site as part of `beforeAll` so
build-clean is verified; `apps/site/playwright/search.spec.ts`
is the paired-discriminator authority for the search coupling).
TDD-front discipline (per ADR-0011 D1 stage 2 + memory
`feedback_soted_pr_md_discipline`) for a filter delta means
**verifying the existing tests pass with the new filter in place**
+ **post-build dist verification that `__test_cjk__` static pages
ship while the index page omits them** before committing. Order:
TC1 grep filter delta → TC2-TC4 type/lint/test runs → TC5 build
+ dist verification (the load-bearing test for this PR's
correctness) → TC6 workspace check → TC7-TC10 byte-unchanged
guards → TC11 PR.md self-listed → TC12 search.spec.ts
byte-unchanged.

Test verification triplets (input → expected → location):

- **TC1** (filter delta applied): Input:
  `grep -c "startsWith('__test_')"
  apps/site/src/pages/index.astro`. Expected: `1`. Location:
  shell at repo root. Confirms the filter is added to exactly
  one site at the canonical entry-point file.

- **TC2** (apps/site test suite regression-free): Input:
  `pnpm --filter @skb/site test`. Expected: exit 0; existing
  10 vitest suites + 1 spec
  (`components-map / dims-source / fouc-script / lazy-chunking /
  sample-blocks-page / sample-blocks-astro-page / search-cjk /
  search-reindex / search-ui / word-level-match` + `visual-smoke.spec`
  WSL2-skip-aware) PASS unchanged. Location: same. The B3 filter
  delta is server-side render-time only; no test corpus directly
  asserts the notes-index `<li>` count, so no test edit needed
  for the regression-free property.

- **TC3** (apps/site typecheck clean): Input:
  `pnpm --filter @skb/site typecheck`. Expected: exit 0. Location:
  same. Confirms the augmented filter callback (returning
  boolean from a compound `&&` expression) preserves `NoteEntry`
  type narrowing — `note.id` is `string` per Astro 5 content
  collections API + `String.prototype.startsWith` returns boolean,
  so the existing `(note: NoteEntry) => !note.data.draft` →
  augmented form stays type-clean.

- **TC4** (apps/site lint clean): Input:
  `pnpm --filter @skb/site lint`. Expected: exit 0. Location:
  same. Confirms ESLint + Prettier accept the filter delta;
  if the augmented expression exceeds the line-width limit
  (Prettier prints multi-line with parens), the formatter applies
  the canonical re-flow automatically (verified PLAN-time the
  current line at `index.astro:8` is ~80 chars; augmented form
  is ~115 chars — Prettier will likely re-flow to a 2-line
  callback body; net delta becomes ~3 LOC instead of 1).

- **TC5** (build clean + dist coverage parity — load-bearing
  for this PR's correctness): Input:
  `pnpm --filter @skb/site build` → exit 0; **then**
  post-build dual verification:
  (a) `test -f apps/site/dist/notes/__test_cjk__/zh-note/index.html
  && test -f apps/site/dist/notes/__test_cjk__/laptop/index.html`
  → exit 0 (per-note static pages STILL ship, preserving PageFind
  coverage + B1b search.spec.ts coupling);
  (b) `grep -c '/notes/__test_cjk__'
  apps/site/dist/index.html` returns `0` (notes index page filters
  out the `__test_*` entries; no `<a href>` to either CJK fixture
  appears in the rendered list).
  Expected: exit 0 + (a) two static pages present + (b) zero
  index-page references. Location: same. This single test
  validates the **central claim of B3**: notes-index-list
  filtered AND PageFind-indexed-static-page generation preserved.

- **TC6** (workspace-wide regression): Input: `pnpm check`.
  Expected: exit 0 (lint + typecheck + test + build + size-check
  workspace-wide; 40/40 PASS). Location: same. B3's filter delta
  is additive + tightly scoped; no other package's test breaks.

- **TC7** (B1a + B1b + B2 shipped files byte-unchanged): Input:
  `git diff main -- apps/site/src/lib/word-level-match.ts
  apps/site/src/__tests__/word-level-match.test.ts
  apps/site/src/components/SearchBox.astro
  apps/site/playwright/search.spec.ts
  apps/site/src/__tests__/search-cjk.test.ts
  apps/site/CONTRACT.md
  docs/decisions/ADR-0012-search-index-stack.md
  apps/site/public/sample-assets/diagram-small.png
  apps/site/public/sample-assets/figure-1.png
  apps/site/public/sample-assets/whitepaper.pdf
  apps/site/public/favicon.ico
  content/notes/sample-blocks/index.mdx`.
  Expected: empty diff (B3 must NOT regress any earlier Stage B
  PR; explicitly includes the B1b paired-discriminator
  search.spec.ts byte-unchanged guard, which is also restated as
  TC12 for emphasis).

- **TC8** (all ADR + Wave 4 plan files byte-unchanged): Input:
  `git diff main -- docs/decisions/
  docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`.
  Expected: empty diff (B3 touches no ADR; D2 row 4 NO; Wave 4
  plan v0.2.1 Amendment authored at B1a; B3 does NOT amend).

- **TC9** (active.md B2 backfill + B3 row insertion):
  (a) `grep -c '#41' docs/plans/active.md` ≥ 1;
  (b) `grep -c '317dda3' docs/plans/active.md` ≥ 1;
  (c) `grep -c '| B2 |' docs/plans/active.md` ≥ 1 (the row exists
  at HEAD post-B2-merge; B3 only flips PR# + commit hash, not
  the row presence);
  (d) `grep -c '| B3 |' docs/plans/active.md` ≥ 1 (NEW row);
  (e) the count of rows in the Wave 4 PR roster table grew by
  exactly 1 vs main HEAD pre-B3.

- **TC10** (B7-scope files byte-unchanged + lockfile +
  package.json + content/notes/__test_cjk__ contents): Input:
  `git diff main -- apps/site/src/components/Jupyter.astro
  apps/site/src/components/NnViz.astro
  apps/site/src/components/AgentFlow.astro
  apps/site/src/islands/
  apps/site/src/components.ts
  apps/site/playwright/heavy-block-layout-shift.spec.ts
  pnpm-lock.yaml apps/site/package.json
  content/notes/__test_cjk__/`. Expected: empty diff. The 3
  `.astro` wrappers at `apps/site/src/components/` do NOT exist
  at main HEAD (NEW in B7); the diff command verifies they remain
  absent post-B3 (no scope creep into B7's territory). The two
  `__test_cjk__` MDX files at `content/notes/__test_cjk__/{laptop,zh-note}/index.mdx`
  also stay byte-unchanged — B3 does NOT relocate the files;
  only the index-page filter is added. **Critical**: this is the
  partial-implementation choice; if a future Stage C work
  re-considers strict ADR-0013 D3 implementation, the relocation
  + dist exclusion would be additive over this filter (or, more
  likely, the filter becomes redundant once real-content CJK
  discriminator notes replace these test fixtures).

- **TC11** (PR.md self-listed): Input:
  `grep -c 'B3-test-cjk-relocation.md'
  docs/plans/wave-4-main/B3-test-cjk-relocation.md`. Expected:
  ≥ 2 (self-reference in `## files` + `## Related` sections per
  Pre-A1 → B2 precedent).

- **TC12** (search.spec.ts byte-unchanged — restated for
  emphasis given the design coupling): Input:
  `git diff main -- apps/site/playwright/search.spec.ts`.
  Expected: empty diff. The B1b-shipped paired-discriminator
  test (positive `笔记` → `中文笔记测试` + inverse `记本` ≠
  `笔记本电脑`) MUST remain operative against the same
  `__test_cjk__/{laptop,zh-note}` fixtures; B3's filter delta
  preserves the static-page generation that PageFind crawls
  (TC5 (a)), so the coupling stays intact without any test edit.
  Already covered by TC7's broader byte-unchanged guard; called
  out separately here because of the load-bearing dependency.

## contracts_affected

- **NONE.** B3 modifies no `*/CONTRACT.md` file.
  `apps/site/CONTRACT.md` stays byte-unchanged from B1a's
  tightening (TC7 verifies). The 8 block packages +
  heavy-block-boundary CONTRACT.md files all stay byte-unchanged
  (TC10 broader diff guard covers this transitively via
  `apps/site/package.json` + workspace cohesion). Standard PR
  per ADR-0007 D2 row 1 NO. Intentional: the partial-implementation
  design choice + tradeoff (preserving PageFind coupling at
  cost of full ADR-0013 D3 implementation) lives in PR.md prose
  + `## Risk register` log entry, not in CONTRACT.md prose. If
  future Stage C work supersedes this with a stricter
  implementation, that PR may then update apps/site/CONTRACT.md
  to codify the listing-vs-indexing split as a permanent
  apps/site invariant.

## adr_touched

- **NONE.** B3 touches no `docs/decisions/ADR-*.md` file. The
  partial implementation of ADR-0013 D3 is **NOT a substantive
  ADR amendment**; it's a scope-clarification documented inline
  in this PR.md (`## title` + `## Risk register`). ADR-0013 stays
  byte-unchanged at HEAD (TC8 verifies). If future Stage C work
  authors a real-content CJK discriminator replacement and removes
  the `__test_cjk__` fixtures entirely (so the filter becomes a
  one-line removal), that PR would naturally amend ADR-0013 D3
  to reflect the resolved state. The current B3 design conflict
  resolution is a localized product/test-coupling tradeoff, not
  an architectural decision that warrants ADR-level recordkeeping.

## D2 trigger judgment

Per ADR-0007 D2 row mapping for B3 (verified at PLAN time per the
locked Wave 4 plan v0.2.1 Amendment B3 row "D2 trigger judgment:
standard PR (no CONTRACT/ADR touch)" + the orchestrator-refined
row-by-row analysis below):

- **Row 1 (CONTRACT.md change)**: **NO.** B3 touches no
  `*/CONTRACT.md` file. TC7 + TC10 transitively verify empty diff
  across all CONTRACT files.
- **Row 2 (package add / remove)**: **NO.** B3 adds zero new
  workspace packages. No `package.json` edit; no `pnpm-lock.yaml`
  delta (TC10 verifies).
- **Row 3 (cross-cutting refactor)**: **NO.** B3 is a 3-LOC
  filter delta on a single page-component file; no existing files
  refactored.
- **Row 4 (new ADR required)**: **NO.** B3 touches no ADR.
  TC8 verifies empty diff across `docs/decisions/`. The partial
  implementation of ADR-0013 D3 is documented inline in PR.md
  (per `## adr_touched` reasoning above), not codified as an ADR
  amendment.
- **Row 5 (cross >= 3 packages)**: **NO.** B3 modifies files
  inside `apps/site/src/pages/` (1 file) + `docs/plans/`
  (active.md + this PR.md self-list). Cross-package scope is
  **1** (`apps/site` only); plan edits are documentation, not
  package-cutting.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** The
  notes-index-page filter is a single canonical entry-point at
  `apps/site/src/pages/index.astro`; there's no sibling page
  authoring an inverse filter or replicating the slug-prefix
  pattern. The dynamic per-note route at
  `apps/site/src/pages/notes/[...slug].astro` intentionally does
  NOT replicate the filter (preserving PageFind coverage); this
  intentional asymmetry is documented in `## title` + acceptance
  bullet 5 + risk register.
- **Row 7 (legacy doc resurrection)**: **NO.** B3 ADDS forward-state
  filter logic; removes nothing; resurrects nothing.
- **Row 8 (CI / build / deploy / auth / security)**: **NO.** B3
  touches no `.github/workflows/`, no `Dockerfile`, no
  auth-related code paths, no security-related code paths. The
  filter is a runtime page-render expression with zero CI/build
  pipeline coupling.

→ **No row HIT → standard PR.** Pipeline: PLAN → EXECUTE → REVIEW
(codex-pr-reviewer-55) → COMMIT (reviewer codex per ADR-0006 D8) →
ACCEPT (pr-writer second invocation per ADR-0011 D1 stage 6).
Stage 4 PRE-COMMIT CLAUDE REVIEW does **NOT** fire (per ADR-0011
D1 row 1 + row 4 mapping; both NO HIT).

## acceptance

1. **Filter delta applied** at `apps/site/src/pages/index.astro:8`:
   the `getCollection('notes')` filter chain becomes
   `.filter((note) => !note.data.draft && !note.id.startsWith('__test_'))`
   (or Prettier's canonical multi-line re-flow of the same
   logical expression). TC1 evidence (grep returns exactly 1
   match for `startsWith('__test_')`).

2. **`apps/site` test suite regression-free**: `pnpm test
   --filter @skb/site` → exit 0; existing 10 vitest suites + 1
   spec PASS unchanged. TC2 evidence.

3. **`apps/site` typecheck clean**: `pnpm --filter @skb/site
   typecheck` → exit 0. The augmented filter callback preserves
   `NoteEntry` type narrowing. TC3 evidence.

4. **`apps/site` lint clean**: `pnpm --filter @skb/site lint` →
   exit 0. ESLint + Prettier accept the augmented expression
   (with multi-line re-flow if line width exceeds limit).
   TC4 evidence.

5. **Build clean + PageFind coupling preserved + index page
   filtered** (load-bearing for this PR's correctness):
   `pnpm --filter @skb/site build` → exit 0. Post-build dual
   verification: (a) `dist/notes/__test_cjk__/zh-note/index.html`
   + `dist/notes/__test_cjk__/laptop/index.html` BOTH STILL
   exist (per-note static pages ship → PageFind indexes the CJK
   titles `中文笔记测试` + `笔记本电脑` → B1b's
   `apps/site/playwright/search.spec.ts` paired-discriminator
   coupling stays intact); (b) `dist/index.html` does NOT contain
   any `<a href="/notes/__test_cjk__/...">` reference (the rendered
   notes-index list filters out the test fixtures from the
   user-visible page). TC5 evidence.

6. **`pnpm check` exit 0 globally** — workspace-wide regression
   baseline. B3's filter delta is additive + scoped; no existing
   test breaks. TC6 evidence.

7. **NO B1a / B1b / B2 shipped files regressed** (the 12-file
   list at TC7 — utility + tests + SearchBox + search.spec.ts +
   search-cjk.test.ts + apps/site/CONTRACT.md + ADR-0012 +
   4 binary sample-assets + favicon + sample-blocks MDX — all
   byte-unchanged). TC7 evidence. Particularly: search.spec.ts
   byte-unchanged is restated at TC12 for emphasis given the
   load-bearing PageFind coupling preservation.

8. **NO ADR / Wave 4 plan change** (B3 is a runtime filter +
   bookkeeping; no architectural decision; partial-implementation
   tradeoff documented inline in this PR.md). TC8 evidence.

9. **`docs/plans/active.md` B2 row backfill applied** + **NEW
   B3 row added**: B2 `#TBD | TBD` → `#41 | 317dda3`; new B3
   row appended with subject "__test_cjk__ partial relocation
   (notes index filter; preserve PageFind coupling)" + `#TBD
   (this) | TBD | B3 | ...`. TC9 evidence.

10. **NO B7-scope files created** + **NO `__test_cjk__` content
    relocation** + **lockfile byte-unchanged** + **package.json
    byte-unchanged**. TC10 evidence. The two `__test_cjk__` MDX
    files at `content/notes/__test_cjk__/{laptop,zh-note}/index.mdx`
    stay where they are; only the `apps/site` index-page filter
    excludes their listing. **This is the partial-implementation
    of ADR-0013 D3** — full strict implementation deferred to
    future Stage C if real-content CJK discriminator notes are
    authored to replace the test fixtures.

11. **PR.md self-listed in `## files`** per ADR-0006 D8 strict
    whitelist + Pre-A1 → B2 precedent. TC11 evidence.

12. **Standard PR pipeline**: PLAN → EXECUTE → REVIEW → COMMIT
    → ACCEPT. **No D2 row 1/2/4/5/8 trigger HIT** (verified above);
    stage 4 PRE-COMMIT CLAUDE REVIEW does NOT fire. Reviewer
    iterations expected: R1 + 0-1 forward-fix; risk classes for
    B3: (a) reviewer may push back on the `note.id` vs
    `note.data.slug` choice — `note.id` is the path-derived ID
    in Astro 5 content collections (e.g.,
    `__test_cjk__/zh-note/index` or `__test_cjk__/zh-note`
    depending on the directory structure + `loader` config),
    while `note.data.slug` is the explicit frontmatter field
    (`__test_cjk__/laptop` / `__test_cjk__/zh-note` per
    PLAN-time-verified frontmatter at
    `content/notes/__test_cjk__/*/index.mdx`). PLAN-time decision:
    use `note.id.startsWith('__test_')` per orchestrator brief —
    `note.id` reliably contains the directory prefix
    `__test_cjk__/` (test fixtures are nested directories), so
    the prefix match works. If the reviewer prefers
    `note.data.slug.startsWith('__test_')` for explicitness, the
    forward-fix is a 1-token rename within the same line; both
    options pass TC1+TC5 because both fields contain the
    `__test_` prefix in the test fixtures' frontmatter and
    directory naming. (b) Reviewer may push back on the
    partial-implementation framing — request a stricter
    ADR-0013 D3 fulfillment (full dist exclusion) or an explicit
    ADR amendment recording the design conflict resolution.
    Forward-fix path: orchestrator extends `## title` +
    `## Risk register` prose with reviewer's framing if needed,
    OR drafts a follow-up Stage C amendment task in the
    Wave 4 plan v0.2.x line if the reviewer escalates. PLAN-time
    decision: keep the partial-implementation approach because
    full dist exclusion DEMONSTRABLY breaks the B1b
    paired-discriminator test (verified by the design-conflict
    analysis in `## Risk register`), and an ADR amendment for
    a localized test-coupling tradeoff is overkill at this
    Stage B mid-PR cadence.

13. **Codex commit (D1 stage 5)** uses ADR-0006 D8
    explicit-file-list staging: reviewer codex commits 5-6 files
    (3 canonical from `## files` + 1 B2-orphan-leftover audit
    + 1-2 B3 reviewer audit archives) in a single explicit list:
    `git reset HEAD` → `git add apps/site/src/pages/index.astro
    docs/plans/active.md
    docs/plans/wave-4-main/B3-test-cjk-relocation.md
    docs/audits/codex-runs/2026-05-03-B2-commit.txt
    docs/audits/codex-runs/2026-05-03-B3-pr-reviewer-55.txt
    [docs/audits/codex-runs/2026-05-03-B3-pr-reviewer-55-r2.txt]` →
    `git diff --cached --stat` verify (5-6 files; lockfile NOT
    in staging) → `git commit`. Per memory
    `feedback_git_operator_explicit_stage.md` lockfile-scope
    discipline: lockfile MUST be byte-unchanged (TC10 pre-commit
    verifies).

## Risk register (B3-specific)

B3's risk surface is small (3-LOC filter + bookkeeping; no D2
row 1/4/8 trigger). Three B3-specific risks documented:

1. **Design conflict between ADR-0013 D3 strict reading vs B1b
   search.spec.ts paired-discriminator test coupling**
   (load-bearing for this PR's design choice). ADR-0013 D3
   originally said "production astro build doesn't include
   `__test_cjk__` in `dist/notes/`" — full strict implementation
   (dropping the dynamic route's `getStaticPaths` for the
   `__test_*` slugs OR moving the fixtures out of
   `content/notes/`) would prevent
   `dist/notes/__test_cjk__/{laptop,zh-note}/index.html`
   generation, which would in turn prevent PageFind from
   indexing the CJK titles `中文笔记测试` + `笔记本电脑`,
   which would in turn break the B1b-shipped
   `apps/site/playwright/search.spec.ts` paired-discriminator
   test (`笔记` query MUST find `中文笔记测试`; `记本` query
   MUST NOT show `笔记本电脑`). **Resolution**: B3 implements
   ONLY the user-facing-listing concern (filter the test
   fixtures from `/` notes index) while preserving
   per-note static-page generation for PageFind coverage.
   Documented as the **partial implementation of ADR-0013 D3**.
   **Future Stage C path**: if a real-content CJK discriminator
   pair is authored (replacing the test fixtures), the filter
   can be removed AND the `__test_cjk__` fixtures relocated /
   deleted, fully implementing the spirit of ADR-0013 D3
   without breaking any test. **Mitigation if reviewer
   escalates**: orchestrator either (i) accepts the partial
   framing in PR.md prose (current default), OR (ii) opens a
   Stage C ADR amendment task in Wave 4 plan v0.2.x to record
   the design-conflict resolution permanently.

2. **`note.id` vs `note.data.slug` field choice for the prefix
   filter**. Astro 5 content collections expose both fields:
   `note.id` is the path-derived ID
   (e.g., `__test_cjk__/zh-note/index` for nested
   `index.mdx` files OR `__test_cjk__/zh-note` post Astro 5
   directory-flattening; verified PLAN-time the
   `content/notes/__test_cjk__/{laptop,zh-note}/index.mdx`
   pattern produces `note.id` strings starting with
   `__test_cjk__/`); `note.data.slug` is the explicit frontmatter
   field (`__test_cjk__/laptop` / `__test_cjk__/zh-note` per
   PLAN-time-verified frontmatter). **Both** start with `__test_`
   so the prefix filter works against either. **Mitigation**:
   orchestrator uses `note.id` per the brief (existing
   `apps/site/src/pages/index.astro` already references
   `note.id` at line 18 for the `<a href>` construction —
   stylistic consistency with the existing call site). If
   reviewer requests `note.data.slug` for explicitness, the
   forward-fix is a 1-token rename verified by re-running TC1
   + TC5 (both pass identically because both fields share the
   `__test_` prefix in the test fixtures).

3. **Astro `getCollection` filter ordering preservation**.
   The existing filter `.filter((note) => !note.data.draft)` →
   augmented `.filter((note) => !note.data.draft &&
   !note.id.startsWith('__test_'))` preserves the chained
   `.sort()` order (the `.sort()` call at line 9 receives the
   filtered array; ordering is by `data.date` descending,
   independent of which entries are filtered out). No
   second-order regression risk on chronological list ordering.
   **Mitigation**: TC2 (`pnpm --filter @skb/site test`) runs
   `sample-blocks-page.test.ts` which builds the site as part
   of `beforeAll`; if the filter callback returns a non-boolean
   value or throws on `note.id` access, the build fails with
   an explicit error and the test surfaces it pre-commit.

## executor

Per Wave 4 plan v0.2.1 Amendment B3 row (`executor:
orchestrator-self (3-LOC filter + bookkeeping)` + active.md
gatekeeper-aligned roster):

- **PLAN**: pr-writer Claude subagent (you, this dispatch).
  Output this PR.md at
  `docs/plans/wave-4-main/B3-test-cjk-relocation.md`. SendMessage
  orchestrator on completion; orchestrator iterates 0-2 rounds
  before lock.

- **EXECUTE**: **orchestrator-self** (3-LOC filter delta + MDX
  prose-free single-line callback augmentation + active.md
  bookkeeping; matches B2's doc-flavored small-PR precedent).
  NOT codex-generic-executor — the change is small enough
  (~3 LOC actual code delta) that orchestrator authors it
  directly + saves the codex-generic-executor dispatch overhead.
  Standard ADR-0011 D1 stage 5 reviewer-codex-commit applies;
  orchestrator-self does EXECUTE only.

  EXECUTE order (TDD-front discipline per memory
  `feedback_soted_pr_md_discipline`): B3.A apply filter delta
  to `apps/site/src/pages/index.astro:8` — verify TC1 grep
  returns 1 match → B3.B `pnpm --filter @skb/site test` → exit
  0 (TC2) → B3.C `pnpm --filter @skb/site typecheck` → exit 0
  (TC3) → B3.D `pnpm --filter @skb/site lint` → exit 0 (TC4) →
  B3.E `pnpm --filter @skb/site build` → exit 0 + dist coverage
  parity (TC5 (a)+(b); load-bearing) → B3.F active.md B2
  backfill + B3 row insertion (TC9) → B3.G byte-unchanged
  guards verify (TC7-TC10, TC12) → B3.H `pnpm check`
  workspace-wide clean (TC6) → reviewer codex commits per
  `## acceptance` bullet 13.

- **REVIEW (D1 stage 3)**: `codex-pr-reviewer-55` (`--yolo
  --profile codex-pr-reviewer-55`). ADR-0006 8-point checklist +
  ADR-0006 D8 explicit-file-list staging mandatory. Reviewer
  reads `apps/site/src/pages/index.astro` at HEAD (not via PR.md
  excerpt) per memory `feedback_pr_reviewer_authority_at_head`.
  Reviewer also runs `pnpm --filter @skb/site build` + dist
  parity check (TC5) independently to confirm the load-bearing
  PageFind coupling preservation.

- **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)**: **DOES NOT FIRE**
  per `## D2 trigger judgment` (no row 1/2/4/5/8 HIT). Skipped
  per ADR-0011 D1 row mapping.

- **COMMIT (D1 stage 5)**: reviewer codex commits via Pre-A1
  4-step `git reset HEAD` → `git add <list>` → `git diff
  --cached --stat` verify → `git commit` (memory
  `feedback_git_operator_explicit_stage`). Lockfile MUST be
  byte-unchanged (TC10 pre-commit). 4-5 files in canonical
  commit list (1 source + active.md + PR.md self-list + 1-2
  audit archives).

- **ACCEPT (D1 stage 6)**: pr-writer second invocation walks
  the 13 acceptance bullets against the actual diff; residue
  list returned to orchestrator for B4 PLAN seed.

- **POST-MERGE**: `gh pr merge --squash --delete-branch` per
  Wave 3 auto-merge authorization (memory
  `feedback_wave3_auto_merge`); B3 row `#TBD | TBD` backfilled
  at next PR (B4) per one-row-per-PR cadence.

## Plan-challenger

**NOT dispatched.** B3 is a small standard PR (3-LOC filter +
bookkeeping; no D2 trigger; no ADR amendment; no plan-challenger
absorbtion table to maintain). Design conflict resolved inline
by orchestrator's reading of the search.spec.ts coupling
(documented in `## title` + `## Risk register` risk #1). Matches
B2 small-standard-PR precedent (B2 also skipped plan-challenger).

## Out of scope (deferred)

B3 explicitly does NOT touch the following surfaces (also
enforced by TC7, TC8, TC10, TC12 diff guards):

- **Full strict implementation of ADR-0013 D3** (relocate
  `__test_cjk__` fixtures out of `content/notes/` OR drop their
  dynamic-route static-page generation). Deferred to Stage C
  user-iteration if a real-content CJK discriminator pair is
  authored to replace the test fixtures (per `## Risk register`
  risk #1 resolution path). TC10 verifies the
  `content/notes/__test_cjk__/` directory stays byte-unchanged.
- **B7-scope files** (`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`
  + `apps/site/src/islands/**` + `apps/site/src/components.ts`
  componentsMap heavy entries +
  `apps/site/playwright/heavy-block-layout-shift.spec.ts`
  AC#16 expansion + ADR-0014 v0.3 amendment +
  `apps/site/CONTRACT.md` heavy block taxonomy section). B7 is
  the CRITICAL Astro hydration wiring PR (Wave 4 plan v0.2.1
  Driver 2; gatekeeper-surfaced 2026-05-03). TC10 verifies B3
  stays out.
- **B1a + B1b + B2 shipped files** (utility + tests + SearchBox
  + search.spec.ts + search-cjk.test.ts +
  `apps/site/CONTRACT.md` + ADR-0012 + 4 binary sample-assets
  + favicon + sample-blocks MDX byte-unchanged from squash
  `1aa2811` + `5ec7123` + `317dda3`). TC7 verifies.
- **All ADR files** (B3 cites ADR-0013 D3 + ADR-0011 + ADR-0007
  + ADR-0006 by markdown link for read; touches none for write).
  TC8 verifies.
- **Wave 4 plan doc** (v0.2.1 Amendment authored at B1a; B3
  does NOT amend further). TC8 verifies.
- **8 block packages + heavy-block-boundary** (byte-unchanged
  since Stage A close HEAD `4aeb279`; transitively guaranteed
  by lockfile + package.json byte-unchanged + cross-package-1
  scope per `## D2 trigger judgment` row 5).
- **`agent-contract.md` / `CLAUDE.md` /
  `docs/runbooks/codex-tool-invocations.md`** (Wave 4 process
  documents; no change for B3).
- **Stage B remaining 4 PRs** (B4 Stage A retro items 2-4; B5
  codex profile prefix R3 + lychee autolink memory codify;
  B7 heavy block hydration wiring; B6 Wave 4 close-ceremony
  preparation) — canonical roster + per-PR scope authoritative
  in [`docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  `## Amendments § v0.2.1` table.
- **Stage C** — open-ended Phase 1 user-iteration scope per
  gatekeeper directive #4 + MVP framework. The Stage C path for
  a future strict ADR-0013 D3 implementation is the canonical
  follow-up vehicle for replacing this partial-implementation
  filter with a relocation + dist exclusion (or with the filter
  becoming redundant once real-content CJK fixtures land).

## Related

- [ADR-0011 D1 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — pipeline framework + D2 trigger row mapping (verified all rows NO HIT for B3)
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md) — staging discipline for the 4-5-file commit
- [ADR-0007 D2 trigger judgment](../../decisions/ADR-0007-job-function-codex-heavy-execution.md) — row-by-row mapping authority
- [ADR-0012 search index stack](../../decisions/ADR-0012-search-index-stack.md) — Wave 3 D-stage + B1a v0.1.1 amendment (byte-unchanged in B3 per TC7); the PageFind coupling preserved by B3's partial implementation
- [ADR-0013 Wave 3 close](../../decisions/ADR-0013-wave-3-close.md) — D3 originally specified `__test_cjk__` non-inclusion in `dist/notes/`; B3 implements partial fulfillment per `## Risk register` risk #1
- [Wave 4 plan v0.2.1 Amendment](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — Stage B re-locked sequence + B3 row scope authority
- [docs/plans/active.md](../active.md) — Wave 4 PR roster + B2 backfill target + B3 NEW row insertion target
- [B1a PR.md](B1a-adr-0012-amendment.md) — squash `1aa2811`; PR #39; doc-flavored ADR amendment + utility precedent (orchestrator-self EXECUTE)
- [B1b PR.md](B1b-searchbox-integration.md) — squash `5ec7123`; PR #40; immediate predecessor for the search.spec.ts paired-discriminator test that B3's design conflict pivots on
- [B2 PR.md](B2-sample-blocks-cleanup.md) — squash `317dda3`; PR #41; B2 backfill target in active.md + small-standard-PR precedent (orchestrator-self EXECUTE; no plan-challenger; PR.md self-list)
- [Pre-A2 PR.md](Pre-A2-adr-0014-heavy-block-boundary.md) — doc-only ADR design-lock precedent (orchestrator-self EXECUTE)
- memory `feedback_soted_pr_md_discipline.md` — SOTed-PR.md authoring discipline (single-source-of-truth + cross-section reference + TDD-front + memory-cited)
- memory `feedback_lychee_line_anchor.md` + `feedback_lychee_user_local_paths.md` + `feedback_lychee_npmjs_403.md` — lychee discipline applied to PR.md cross-references
- memory `feedback_pr_reviewer_authority_at_head.md` — reviewer reads source at HEAD, not via PR.md excerpt
- memory `feedback_git_operator_explicit_stage.md` — 4-5-file explicit-file-list commit at D1 stage 5
- memory `feedback_wave3_auto_merge.md` — `gh pr merge --squash --delete-branch` post-merge cadence
- memory `feedback_pagefind_query_substring.md` — PageFind 1.5+ query-time substring matching is the upstream root cause for the B1a/B1b/B3 line of work; B3 preserves the resolved coupling without altering the indexing layer
