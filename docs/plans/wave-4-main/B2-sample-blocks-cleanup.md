# B2 — sample-blocks Wave 3 cleanup (4 binary sample-assets + intro prose refresh)

> **Wave 4 Stage B THIRD implementation PR** of the re-locked 8-PR
> sequence (B1a → B1b → **B2** → B3 → B4 → B5 → B7 → B6; see Wave 4
> plan v0.2.1 Amendment Driver 1+2). Closes gatekeeper smoke #8
> (sample-assets ship) + #9 (sample-blocks intro prose) — merged
> into a single PR per gatekeeper directive 2026-05-03 #5. B1a
> (squash `1aa2811`; PR #39) and B1b (squash `5ec7123`; PR #40)
> merged 2026-05-03; B2 is the next implementation PR. **Standard
> ADR-0011 D1 pipeline** (no D2 row 1 / 2 / 4 / 5 / 8 trigger HIT;
> `## D2 trigger judgment` below); stage 4 PRE-COMMIT CLAUDE REVIEW
> does NOT fire. Out of scope: see `## Out of scope (deferred)` —
> NnViz mlp-mnist.json, B7 hydration wiring, B3-B6 PRs all
> deferred per Wave 4 plan v0.2.1 roster.

## title

Place 4 placeholder binaries under `apps/site/public/` (`sample-assets/diagram-small.png`
+ `sample-assets/figure-1.png` + `sample-assets/whitepaper.pdf` (≥3 pages
because fixture references `page={1}` AND `page={3}`) + top-level
`favicon.ico`) so the existing `content/notes/sample-blocks/index.mdx`
fixtures resolve real assets at SSR-build time (`<Image>` blocks render
real PNGs; `<Pdf>` block at page 1 + page 3 references resolve a
single PDF) instead of broken alt-text + 404 iframes; refresh the
sample-blocks MDX intro prose to reflect the **current** Wave 3 mdx-bridge
+ Wave 4 Stage A HeavyBlockBoundary state (5 light blocks real-render
via componentsMap MdxAdapter; 3 heavy blocks render skeleton at SSR +
hydrate via HeavyBlockBoundary in browser; the obsolete "draft: true"
warning paragraph and Callout warning body "apps/site cannot yet render
these components" prose are removed / replaced) without altering the
8 component-block fixtures themselves (Callout / Code / Image / Math
/ Pdf / Jupyter / NnViz / AgentFlow propsSchema instances). Backfill
`docs/plans/active.md` B1b row (`#40 | 5ec7123`) + add B2 row. PR.md
self-listed per ADR-0006 D8 + Pre-A1 → B1b precedent.

## files

7 canonical files + COMMIT-time +5 audit archives (2 B1b leftover
ACCEPT/COMMIT logs back-filled per B1b's identical pattern of B1a
leftover back-fill + 3 B2 reviewer R1/R2/R3 audits — R1 FAIL on
local-lychee acceptance text → orchestrator amended TC20 + bullet 13
→ R2 FAIL on residual line 693 implementation-sequence inconsistency
→ orchestrator amended line 693 → R3 PASS); **12 files total at
commit**. orchestrator-self EXECUTE for binaries
+ MDX prose + bookkeeping. NO `package.json` / `pnpm-lock.yaml`
change (no new deps; binary generation uses Python 3.12 + PIL 10.2.0
already available in dev env, plus a hand-crafted minimal valid
3-page PDF authored as raw bytes — PDF format is text-based and a
~1 KB hand-rolled file satisfies the format spec without a generator
library). NO `apps/site/astro.config.mjs` change (B2 does not touch
build integration; Astro automatically serves `apps/site/public/**`
as static assets at the corresponding URL paths). PR.md self-listed
per Pre-A2+A1+...+B1a+B1b precedent.

- `apps/site/public/sample-assets/diagram-small.png` — **NEW**
  (binary). 320×180 placeholder PNG referenced by fixture-16a at
  `content/notes/sample-blocks/index.mdx:70`
  (`<Image src="/sample-assets/diagram-small.png" alt="Small architecture diagram" width={320} height={180} />`).
  Generation approach: Python 3.12 + PIL 10.2.0
  (`Image.new('P', (320, 180))` 8-bit palette mode for small file
  size + light-gray background + simple text label "diagram-small")
  — keeps file < 5 KB. Verified PLAN-time PIL 10.2.0 available.
  TC1 verifies file presence + PNG magic bytes + 320×180 dimensions.

- `apps/site/public/sample-assets/figure-1.png` — **NEW** (binary).
  Larger placeholder PNG referenced by fixture-16b at
  `content/notes/sample-blocks/index.mdx:73`
  (`<Image src="/sample-assets/figure-1.png" alt="Figure 1 — block-foundation registration flow" />`)
  — fixture omits `width`/`height` props, so the block-image
  ui-default applies its default rendering policy. PLAN-time
  decision: choose 600×400 placeholder (sensible "figure" aspect
  ratio; matches the alt-text framing of "block-foundation
  registration flow" diagram). Same PIL 8-bit palette generation
  approach + simple text label "figure-1" — keeps file < 10 KB.
  TC2 verifies file presence + PNG magic bytes + non-zero size.

- `apps/site/public/sample-assets/whitepaper.pdf` — **NEW**
  (binary). Minimum 3-page valid PDF (fixture-18a references
  `page={1}` and fixture-18b references `page={3}` — same `src`
  URL, so a single 3-page PDF satisfies both). Generation
  approach: hand-rolled minimal PDF authored as raw bytes —
  reportlab is NOT installed (verified PLAN-time:
  `python3 -c 'import reportlab'` → ModuleNotFoundError); a
  hand-crafted 3-page PDF stays well under 1 KB (PDF format is
  ASCII-with-binary-stream; minimal valid file = 1 catalog +
  1 pages tree + 3 page objects + xref + trailer). Each page
  renders a placeholder text label ("Whitepaper page 1/3", "page
  2/3", "page 3/3") via PDF text-showing operators (Tj) inside a
  Helvetica font resource. The file MUST start with the `%PDF-1.4`
  magic header (4 bytes `%PDF` + version) and terminate with `%%EOF`.
  TC3 verifies file presence + magic bytes + page count ≥ 3.

- `apps/site/public/favicon.ico` — **NEW** (binary). Standard
  16×16 ICO file (favicon convention; a 32×32 second image inside
  the ICO container is optional — PLAN-time decision is single
  16×16 frame for minimum file size). Generation approach: PIL
  10.2.0 `Image.new('RGBA', (16, 16))` + `.save(..., format='ICO')`
  — PIL emits valid ICO byte stream natively. Keeps file < 1 KB.
  Astro serves `apps/site/public/favicon.ico` at the root URL
  `/favicon.ico` automatically; this closes the "every site has
  a favicon" expectation. TC4 verifies file presence + ICO
  magic bytes (`00 00 01 00` at offset 0).

- `content/notes/sample-blocks/index.mdx` — **MODIFIED**
  (~30 LOC delta; intro paragraph rewrite + obsolete "Note on
  draft: true" paragraph removal + Callout warning body refresh).
  Current state (verified PLAN-time):

  - **Lines 1-7 (frontmatter)**: `title: Wave 2 Block Sampler` +
    `slug: sample-blocks` + `tags: [smoke-test, wave-2, sample-blocks]`
    + `date: 2026-04-30` + `draft: false`. **STAY UNCHANGED**
    (TC7 verifies `draft: false` count = 1 + title/slug/tags
    intact).
  - **Lines 9-12 (intro paragraph)**: current text says
    "Routing of MDX → React components is Wave 3 `mdx-bridge`
    work; here we author content that conforms to each block's
    `propsSchema` exactly." — partially historical accurate
    (Wave 3 mdx-bridge work IS done) but framed in future tense.
    EXECUTE rewrites the paragraph to state the **current** state:
    Wave 3 mdx-bridge ships componentsMap → MdxAdapter routing
    (5 light blocks: Callout / Code / Image / Math / Pdf real-render
    at SSR + client); Wave 4 Stage A ships HeavyBlockBoundary
    wrapper for the 3 heavy kinds (Jupyter / NnViz / AgentFlow)
    rendering skeleton at SSR + hydrating via dynamic-import
    `useEffect` in browser. Cite ADR-0014 (heavy-block-boundary)
    + ADR-0009 (BlockKind 4-way union). Keep "this page is the
    Wave 2 close acceptance criterion (Z0)" historical pointer
    intact. ~10 LOC delta on lines 9-12.
  - **Lines 14-17 (obsolete "Note on draft: true" paragraph)**:
    current text claims "Astro cannot yet resolve the 8 PascalCase
    components" + "Wave 3 mdx-bridge integration WILL register the
    BlockRegistry → MDX component map in apps/site, after which
    `draft` flips back to `false`". This is OBSOLETE — Wave 3 D2
    shipped the componentsMap (`apps/site/src/components.ts`); the
    frontmatter already says `draft: false` at line 6; the paragraph
    self-contradicts the live state. EXECUTE **REMOVES** the entire
    paragraph (4 lines including the surrounding blank lines).
    ~5 LOC net removal. TC5 verifies `grep -c 'Note on \`draft: true\`'`
    returns 0 + replaces with one short sentence reflecting the
    current state OR leaves the gap (PLAN-time decision: outright
    removal is cleaner; the rewritten intro paragraph already
    captures the live state, so no replacement note is needed).
  - **Lines 33-37 (Callout warning fixture body refresh)**: fixture-14
    `<Callout variant="warning" title="Wave 3 deferred">` body
    currently reads "apps/site cannot yet render these components —
    the BlockRegistry → MDX integration lands with `mdx-bridge` in
    Wave 3." OBSOLETE for the same reason. EXECUTE refreshes the
    body to a current-state-accurate sentence, e.g., "apps/site
    renders these components at SSR (5 light blocks via componentsMap
    MdxAdapter) + browser-hydration (3 heavy blocks via
    HeavyBlockBoundary; B7 wires `client:load` islands)." **KEEP**
    `variant="warning"` + `title="Wave 3 deferred"` (or equivalent
    title; PLAN-time decision: rename title to "Wave 3 + Wave 4
    Stage A landed" to match the refreshed body) so the Callout
    fixture coverage of `variant=warning` + `title` prop survives
    intact. The Callout component-block test surface (block-callout
    propsSchema `.strict()` validation) is exercised by the body
    refresh without needing a separate fixture. ~10 LOC delta on
    lines 33-37. TC6 verifies the obsolete phrase "apps/site cannot
    yet render these components" is GONE + the new prose mentions
    "componentsMap" / "HeavyBlockBoundary" or equivalent.
  - **Lines 19-158 (8 component-block fixtures)**: Callout (4
    fixtures) / Code (1) / Image (2) / Math (2) / Pdf (2) / Jupyter
    (1) / NnViz (1) / AgentFlow (1) — **STAY BYTE-UNCHANGED**
    except for the fixture-14 Callout warning body refresh
    enumerated above. The PascalCase tags + their `propsSchema`-conformant
    props remain identical. TC8 verifies grep counts of `<Callout`
    / `<Code` / `<Image` / `<Math` / `<Pdf` / `<Jupyter` / `<NnViz`
    / `<AgentFlow` are unchanged from main HEAD.

  Total MDX file delta ~30 LOC. Post-edit file size ~150 LOC
  (current 158 LOC − ~5 LOC obsolete-note removal − minor net
  intro rewrite). Well below 200 LOC ESLint warn target.

- `docs/plans/active.md` — **MODIFIED** (~5 LOC delta):

  - **B1b row backfill**: existing `| #TBD (this) | TBD | B1b |
    SearchBox Option B-4 hybrid integration + count-fixup + paired
    discriminator playwright restore |` row at line 24
    → `| #40 | 5ec7123 | B1b | SearchBox Option B-4 hybrid
    integration + count-fixup + paired discriminator playwright
    restore |` (B1b PR #40 squash `5ec7123` per the conversation
    context).
  - **NEW B2 row**: append after B1b row + before Stage A summary
    row: `| #TBD (this) | TBD | B2 | sample-blocks Wave 3 cleanup
    (4 binary sample-assets + intro prose refresh; merged from
    old B2+B3 per gatekeeper directive 2026-05-03 #5) |`
    (backfilled at NEXT PR per the one-row-per-PR cadence).

  No new mandatory-scope ✅ flips — B1a's two ✅ rows on lines
  31-32 already cover ADR-0012 amendment + path-prose alignment;
  B2's gatekeeper-smoke-#8 + #9 closures are tracked at line 37-38
  Wave 4 NEW scope bullets but those bullets are already in
  PLAN-time-correct shape ("→ Stage B" pointer; B2 IS Stage B PR
  3, so the pointer remains accurate without a flip — equivalent
  to a no-op verification, NOT a structural ✅ flip needing edit).
  TC9(d)+(e) verify the B1b backfill + B2 row insertion.

- `docs/plans/wave-4-main/B2-sample-blocks-cleanup.md` — **NEW**
  (this PR.md, self-listed per ADR-0006 D8 + Pre-A1 → B1b
  precedent; pr-writer must include the PR.md in the canonical
  `## files` list at PLAN time). ~600 LOC final (PR.md exempt
  from the 200 LOC target per ADR-0011 D2 v0.1.1 + memory
  `feedback_soted_pr_md_discipline`; smaller than B1a/B1b at
  ~970-1150 LOC because B2 is a small standard PR with no
  plan-challenger-absorbtion-table burden + no D2 row 1/4 trigger).

## test_cases

B2 ships **0 NEW vitest unit suites** (binaries + MDX prose change
do not require new test code; existing `apps/site/src/__tests__/sample-blocks-page.test.ts`
already builds the site as part of its setup and asserts the 8
SSR markers, including
`src="/sample-assets/diagram-small.png"` for the Image block — so
binary placement closes a long-standing implicit flake risk on
that test). TDD-front discipline (per ADR-0011 D1 stage 2 + memory
`feedback_soted_pr_md_discipline`) for binary placement does not
mean writing a new test before the binary; it means **verifying
the existing test passes with the new binary in place** before
committing. Order: TC1-TC4 binary verification grep+`file`-magic checks
→ TC5-TC8 MDX prose grep checks → TC9 active.md grep
→ TC10 `pnpm --filter @skb/site test` exit 0 (existing 11
corpora unchanged + GREEN) → TC11 `pnpm --filter @skb/site build`
exit 0 → TC12-TC18 byte-unchanged guards → TC19 `pnpm size-check`
→ TC20 `pnpm link-check` → TC21 `pnpm check` workspace-wide.

Test verification triplets (input → expected → location):

- **TC1** (diagram-small.png placement): Input:
  `test -f apps/site/public/sample-assets/diagram-small.png &&
  file apps/site/public/sample-assets/diagram-small.png`. Expected:
  exit 0 + output contains `'PNG image data, 320 x 180'` (PIL emits
  this signature). Location: shell at repo root.
- **TC2** (figure-1.png placement): Input:
  `test -f apps/site/public/sample-assets/figure-1.png && file
  apps/site/public/sample-assets/figure-1.png`. Expected: exit 0
  + output contains `'PNG image data'` (dimensions documented in
  the file metadata; the test asserts only PNG validity since
  the fixture omits explicit width/height props). Location: same.
- **TC3** (whitepaper.pdf placement + ≥3 pages): Input:
  `test -f apps/site/public/sample-assets/whitepaper.pdf &&
  head -c 4 apps/site/public/sample-assets/whitepaper.pdf` returns
  `%PDF` + Python verification `python3 -c "import re; data=open('apps/site/public/sample-assets/whitepaper.pdf','rb').read(); print(len(re.findall(b'/Type[ /]+/Page[^s]', data)))"`
  returns ≥ 3 (counts `/Type /Page` page-object occurrences,
  excluding `/Type /Pages` parent tree). Expected: exit 0 + magic
  bytes present + page-count ≥ 3. Location: same. (Backup verifier
  if PDF page-count regex is fragile: `python3 -c "from io import
  BytesIO; data=open('apps/site/public/sample-assets/whitepaper.pdf','rb').read();
  count=data.count(b'/Type /Page'); pages_tree=data.count(b'/Type /Pages');
  print(count - pages_tree)"` — net page-object count.)
- **TC4** (favicon.ico placement + ICO magic): Input:
  `test -f apps/site/public/favicon.ico &&
  python3 -c "data=open('apps/site/public/favicon.ico','rb').read(); print(data[:4].hex())"`.
  Expected: exit 0 + first 4 bytes `00000100` (ICO magic: 2-byte
  reserved 0x0000 + 2-byte type 0x0001 little-endian). Location: same.
- **TC5** (intro prose refreshed; obsolete "draft: true" paragraph
  removed): Input: `grep -c 'Note on \`draft: true\`'
  content/notes/sample-blocks/index.mdx`. Expected: `0`. Location:
  same. Plus `grep -c 'componentsMap\|HeavyBlockBoundary\|client:load'
  content/notes/sample-blocks/index.mdx` returns ≥ 1 (new prose
  mentions at least one current-state landmark).
- **TC6** (Callout warning fixture body refreshed): Input:
  `grep -c 'apps/site cannot yet render these components'
  content/notes/sample-blocks/index.mdx`. Expected: `0` (obsolete
  phrase removed). Location: same. Plus `grep -c '<Callout
  variant="warning"' content/notes/sample-blocks/index.mdx` returns
  ≥ 1 (fixture-14 Callout warning still present; only body refreshed,
  not deleted).
- **TC7** (frontmatter byte-unchanged): Input: `grep -c '^draft:
  false$' content/notes/sample-blocks/index.mdx` returns `1` +
  `grep -c '^title: Wave 2 Block Sampler$'` returns `1` + `grep -c
  '^slug: sample-blocks$'` returns `1` + `grep -c "^tags:
  \[smoke-test, wave-2, sample-blocks\]\$"` returns `1` + `grep -c
  '^date: 2026-04-30$'` returns `1`. Expected: all positive grep
  counts as listed. Location: same.
- **TC8** (8 component-block fixtures byte-unchanged tag presence):
  Input: `grep -c '<Callout' / '<Code ' / '<Image ' / '<Math ' /
  '<Pdf ' / '<Jupyter' / '<NnViz' / '<AgentFlow'
  content/notes/sample-blocks/index.mdx`. Expected counts identical
  to main HEAD baseline (Callout = 4, Code = 1, Image = 2, Math = 2,
  Pdf = 2, Jupyter = 1, NnViz = 1, AgentFlow = 1). Location: same.
- **TC9** (active.md B1b backfill + B2 row insertion): (a)
  `grep -c '#40' docs/plans/active.md` ≥ 1; (b) `grep -c '5ec7123'
  docs/plans/active.md` ≥ 1; (c) `grep -c '| B1b |' docs/plans/active.md`
  ≥ 1 (the row exists at HEAD; B2 only flips PR# + commit hash,
  not the row presence); (d) `grep -c '| B2 |' docs/plans/active.md`
  ≥ 1 (NEW row); (e) the count of rows in the Wave 4 PR roster
  table grew by exactly 1 vs main HEAD.
- **TC10** (apps/site test suite regression-free): `pnpm --filter
  @skb/site test` → exit 0; existing 11 corpora
  (`components-map / dims-source / fouc-script / lazy-chunking /
  sample-blocks-page / sample-blocks-astro-page / search-cjk /
  search-reindex / search-ui / visual-smoke / word-level-match`)
  PASS unchanged. The `sample-blocks-page.test.ts` build step (which
  runs `pnpm build` per its `beforeAll`) produces a fresh dist with
  the new binaries served, so its existing 8-marker SSR assertion
  including `src="/sample-assets/diagram-small.png"` matches the
  freshly built HTML (a long-standing latent fragility that only
  passed previously because the assertion is on the URL string in
  HTML, not on asset resolution; B2 closes the implicit fragility
  by making the URL resolve to a real asset).
- **TC11** (apps/site build clean + binaries shipped to dist): `pnpm
  --filter @skb/site build` → exit 0 + post-build verification
  `test -f apps/site/dist/sample-assets/diagram-small.png &&
  test -f apps/site/dist/sample-assets/figure-1.png &&
  test -f apps/site/dist/sample-assets/whitepaper.pdf &&
  test -f apps/site/dist/favicon.ico` → exit 0 (Astro copies
  `apps/site/public/**` byte-identical to `dist/**` at the
  corresponding paths; verified by Astro `## Static Assets` doc
  convention + Wave 3 D3 search reindex test pattern that depends
  on the same copy mechanism for `dist/pagefind/**`).
- **TC12** (lockfile byte-unchanged): `git diff main --
  pnpm-lock.yaml` → empty diff (B2 adds NO deps; PIL is a Python
  dev-time tool, not a JS dep; the hand-rolled PDF needs no
  generator library).
- **TC13** (B1a + B1b shipped files byte-unchanged): `git diff
  main -- apps/site/src/lib/word-level-match.ts
  apps/site/src/__tests__/word-level-match.test.ts
  apps/site/src/components/SearchBox.astro
  apps/site/playwright/search.spec.ts
  apps/site/src/__tests__/search-cjk.test.ts
  apps/site/CONTRACT.md docs/decisions/ADR-0012-search-index-stack.md` →
  empty diff (B2 must NOT regress B1a / B1b).
- **TC14** (all ADR files byte-unchanged): `git diff main --
  docs/decisions/` → empty diff (B2 touches no ADR; D2 row 4 NO).
- **TC15** (Wave 4 plan doc byte-unchanged): `git diff main --
  docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md` →
  empty diff (Wave 4 plan v0.2.1 Amendment authored at B1a;
  B2 does NOT amend).
- **TC16** (B7-scope files byte-unchanged): `git diff main --
  apps/site/src/components/Jupyter.astro
  apps/site/src/components/NnViz.astro
  apps/site/src/components/AgentFlow.astro
  apps/site/src/islands/
  apps/site/src/components.ts
  apps/site/playwright/heavy-block-layout-shift.spec.ts` → empty
  diff. Note: the 3 `.astro` wrappers at `apps/site/src/components/`
  do NOT exist at main HEAD (they are NEW in B7); the diff
  command verifies they remain absent post-B2 (no scope creep into
  B7's territory). The existing `apps/site/src/components.ts`
  componentsMap stays unchanged (verified PLAN-time as the source
  of truth post-A7).
- **TC17** (NO `apps/site/public/sample-assets/models/` dir
  created): `test ! -d apps/site/public/sample-assets/models &&
  test ! -f apps/site/public/sample-assets/models/mlp-mnist.json` →
  exit 0. Out of scope per `## Out of scope (deferred)` below; the
  NnViz fixture line 130 reference is documented as Wave 3 leftover
  + deferred to Stage C user-iteration if needed for true NnViz
  hydration end-to-end smoke.
- **TC18** (8 block packages + heavy-block-boundary byte-unchanged):
  `git diff main -- packages/heavy-block-boundary/ packages/block-callout/
  packages/block-code/ packages/block-image/ packages/block-math/
  packages/block-pdf/ packages/block-jupyter/ packages/block-nn-viz/
  packages/block-agent-flow/` → empty diff.
- **TC19** (size-check workspace-wide): `pnpm size-check` → exit
  0 (no source file > 500 LOC; binaries are not source files; PR.md
  is exempt). Sample-blocks MDX post-edit ~150 LOC, well below.
- **TC20** (lychee link-check; CI canonical per B1a + B1b precedent):
  `pnpm link-check` runs in CI workflow (lychee binary not on local
  WSL2 dev env; `pnpm link-check` locally exits 1 with `lychee: not
  found` — accepted dev-env state). Pre-commit memory disciplines
  followed: `feedback_lychee_line_anchor` no `:line` suffix on
  relative file links; `feedback_lychee_user_local_paths` no
  `~/.claude/...` links; `feedback_lychee_npmjs_403` no
  `npmjs.com/package/...` links. The intro prose refresh cites
  ADR-0014 + ADR-0009 by repo-relative paths
  (`../../docs/decisions/ADR-0014-heavy-block-boundary.md` from
  `content/notes/sample-blocks/index.mdx`); verify these resolve in
  CI lychee step (canonical) AND verify the file targets exist
  pre-commit (sufficient local check given binary unavailability).
- **TC21** (workspace-wide regression): `pnpm check` → exit 0
  (lint + typecheck + test + build + size-check all PASS). B2's
  binary placement + MDX prose change is additive; no existing
  test breaks.
- **TC22** (PR.md self-listed): `grep -c 'B2-sample-blocks-cleanup.md'
  docs/plans/wave-4-main/B2-sample-blocks-cleanup.md` → ≥ 2
  (self-reference in `## files` + `## Related` sections per
  Pre-A1 → B1b precedent).

## contracts_affected

- **NONE.** B2 modifies no `*/CONTRACT.md` file. The 8 block
  packages + heavy-block-boundary CONTRACT.md files all stay
  byte-unchanged (TC18 verifies). `apps/site/CONTRACT.md` stays
  byte-unchanged from B1a's tightening (TC13 verifies). Standard
  PR per ADR-0007 D2 row 1 NO.

## adr_touched

- **NONE.** B2 touches no `docs/decisions/ADR-*.md` file. The
  intro prose refresh **cites** ADR-0014 + ADR-0009 by repo-relative
  markdown link (lychee resolves), but does not edit them. Standard
  PR per ADR-0007 D2 row 4 NO.

## D2 trigger judgment

Per ADR-0007 D2 row mapping for B2 (verified at PLAN time per the
locked Wave 4 plan v0.2.1 Amendment B2 row "D2 trigger judgment:
standard PR (no CONTRACT/ADR touch)" + the orchestrator-refined
row-by-row analysis below):

- **Row 1 (CONTRACT.md change)**: **NO.** B2 touches no
  `*/CONTRACT.md` file. TC13 + TC18 verify empty diff across all
  CONTRACT files.
- **Row 2 (package add / remove)**: **NO.** B2 adds zero new
  workspace packages; the 4 binaries are static-assets ships under
  `apps/site/public/`, not new packages. No `package.json` edit;
  no `pnpm-lock.yaml` delta (TC12 verifies).
- **Row 3 (cross-cutting refactor)**: **NO.** B2 is binary placement
  + MDX prose refresh + bookkeeping; no existing files refactored.
- **Row 4 (new ADR required)**: **NO.** B2 touches no ADR. The
  intro prose cites existing ADR-0014 + ADR-0009 by markdown link
  (read-only reference), not an edit. TC14 verifies empty diff
  across `docs/decisions/`.
- **Row 5 (cross >= 3 packages)**: **NO.** B2 modifies files inside
  `apps/site/public/` (4 binaries) + `content/notes/sample-blocks/`
  (1 MDX file) + `docs/plans/` (active.md + this PR.md self-list).
  Cross-package scope is **1** (`apps/site` only); content + plan
  edits are documentation, not package-cutting.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** The `apps/site/public/`
  directory is the canonical Astro static-assets location and
  already exists at HEAD as the served root for `_pagefind/`-now-`pagefind/`
  build outputs (Wave 3 D2). The new `sample-assets/` subdirectory
  is the first occupant matching the URL convention referenced
  by the existing `content/notes/sample-blocks/index.mdx` fixtures
  (Wave 2 close); no sibling-divergent pattern.
- **Row 7 (legacy doc resurrection)**: **NO.** The MDX prose refresh
  REMOVES obsolete language (the "draft: true" paragraph + the
  "apps/site cannot yet render these components" Callout body);
  this is forward-progress language alignment with the live state,
  the opposite of resurrection.
- **Row 8 (CI / build / deploy / auth / security)**: **NO.** B2
  touches no `.github/workflows/`, no `Dockerfile`, no auth-related
  code paths, no security-related code paths. Static-asset binaries
  are passive content served by Astro's existing `public/**` →
  `dist/**` copy mechanism without code-path involvement.

→ **No row HIT → standard PR.** Pipeline: PLAN → EXECUTE → REVIEW
(codex-pr-reviewer-55) → COMMIT (reviewer codex per ADR-0006 D8) →
ACCEPT (pr-writer second invocation per ADR-0011 D1 stage 6).
Stage 4 PRE-COMMIT CLAUDE REVIEW does **NOT** fire (per ADR-0011
D1 row 1 + row 4 mapping; both NO HIT).

## acceptance

1. **`apps/site/public/sample-assets/diagram-small.png` placed**
   at the canonical fixture-referenced path (`content/notes/sample-blocks/index.mdx:70`
   `<Image src="/sample-assets/diagram-small.png" ... width={320}
   height={180} />`); valid PNG image data; dimensions 320×180.
   TC1 evidence (`file` magic + dimension match).

2. **`apps/site/public/sample-assets/figure-1.png` placed** at the
   canonical fixture-referenced path (`content/notes/sample-blocks/index.mdx:73`
   `<Image src="/sample-assets/figure-1.png" alt="Figure 1 — ..." />`);
   valid PNG image data; non-zero size. TC2 evidence (`file` magic
   + size > 0).

3. **`apps/site/public/sample-assets/whitepaper.pdf` placed** at the
   canonical fixture-referenced path (`content/notes/sample-blocks/index.mdx:98`
   `<Pdf src="/sample-assets/whitepaper.pdf" page={1} />` + `:101`
   `<Pdf src="/sample-assets/whitepaper.pdf" page={3} searchable />`);
   PDF magic header `%PDF-1.x` present; net page-object count ≥ 3
   (so `page={1}` + `page={3}` references both resolve in-bounds).
   TC3 evidence.

4. **`apps/site/public/favicon.ico` placed** at the root URL
   convention path; ICO magic bytes `00 00 01 00` at offset 0;
   16×16 single-frame minimum content. TC4 evidence.

5. **MDX intro paragraph refreshed** to reflect the current
   Wave 3 mdx-bridge + Wave 4 Stage A HeavyBlockBoundary state
   (componentsMap routing for 5 light blocks + HeavyBlockBoundary
   hydration for 3 heavy blocks); cites ADR-0014 + ADR-0009 by
   repo-relative markdown link. TC5 evidence (presence of at least
   one current-state landmark token: `componentsMap` /
   `HeavyBlockBoundary` / `client:load`).

6. **Obsolete "Note on `draft: true`" paragraph removed** from
   `content/notes/sample-blocks/index.mdx` (the paragraph was
   self-contradictory: it claimed "Astro cannot yet resolve the 8
   PascalCase components" while the frontmatter already says
   `draft: false` and Wave 3 D2 shipped the componentsMap).
   TC5 evidence (zero grep count).

7. **Callout fixture-14 warning body refreshed** at lines 33-37
   with current-state-accurate prose (e.g., "renders these
   components at SSR + browser-hydration"); the obsolete phrase
   "apps/site cannot yet render these components" is GONE; the
   `<Callout variant="warning"` opening + structure remain present
   (only the body sentence changes; Callout fixture coverage
   preserved). TC6 evidence (zero grep on the obsolete phrase +
   ≥1 grep on `<Callout variant="warning"`).

8. **Frontmatter byte-unchanged**: `title` + `slug` + `tags` +
   `date` + `draft: false` all intact. TC7 evidence.

9. **8 component-block fixture tag counts unchanged** vs main HEAD
   baseline (Callout = 4, Code = 1, Image = 2, Math = 2, Pdf = 2,
   Jupyter = 1, NnViz = 1, AgentFlow = 1). TC8 evidence.

10. **`apps/site` test suite regression-free**: `pnpm --filter
    @skb/site test` → exit 0; existing 11 corpora PASS unchanged.
    Notably `sample-blocks-page.test.ts` builds the site and
    asserts all 8 SSR markers including
    `src="/sample-assets/diagram-small.png"` — which now resolves
    to a real binary (closes a long-standing latent fragility).
    TC10 evidence.

11. **`apps/site` build clean + binaries shipped to `dist/`**:
    `pnpm --filter @skb/site build` → exit 0 + post-build the
    4 binaries appear at `apps/site/dist/sample-assets/` +
    `apps/site/dist/favicon.ico` (Astro `public/**` → `dist/**`
    byte-identical copy mechanism). TC11 evidence.

12. **`docs/plans/active.md` B1b row backfill applied** + **NEW
    B2 row added**: B1b `#TBD | TBD` → `#40 | 5ec7123`; new B2
    row appended with subject "sample-blocks Wave 3 cleanup
    (4 binary sample-assets + intro prose refresh; merged from
    old B2+B3 per gatekeeper directive 2026-05-03 #5)" + `#TBD
    (this) | TBD | B2 | ...`. TC9 evidence.

13. **link-check (lychee) — CI canonical per B1a + B1b precedent**:
    all cross-references from the refreshed MDX intro prose +
    active.md updates + PR.md self-references resolve in CI lychee
    step. Local `pnpm link-check` BLOCKED on dev WSL2 (lychee binary
    not installed); pre-commit verification = ensure linked file
    targets exist via `test -f` and follow lychee disciplines
    (`feedback_lychee_line_anchor.md` no `:line` suffix on relative
    links; `feedback_lychee_user_local_paths.md` no `~/.claude/...`
    links; `feedback_lychee_npmjs_403.md` no `npmjs.com/package/...`
    links). TC20 evidence.

14. **`pnpm size-check` workspace-wide clean**: no source file
    exceeds 500 LOC hard cap; sample-blocks MDX post-edit ~150
    LOC; PR.md exempt. TC19 evidence.

15. **`pnpm check` exit 0 globally** — workspace-wide regression
    baseline. B2's binary placement + MDX prose change is additive;
    no existing test breaks. TC21 evidence.

16. **NO `apps/site/public/sample-assets/models/mlp-mnist.json`**
    (out of scope; deferred to Stage C user-iteration if needed).
    TC17 evidence.

17. **NO B7-scope files created** (`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`
    + `apps/site/src/islands/**` stay absent; `apps/site/src/components.ts`
    + `apps/site/playwright/heavy-block-layout-shift.spec.ts`
    byte-unchanged). TC16 evidence.

18. **NO B1a / B1b shipped files regressed** (`apps/site/src/lib/word-level-match.ts`
    + `apps/site/src/__tests__/word-level-match.test.ts` +
    `apps/site/src/components/SearchBox.astro` +
    `apps/site/playwright/search.spec.ts` +
    `apps/site/src/__tests__/search-cjk.test.ts` +
    `apps/site/CONTRACT.md` + `docs/decisions/ADR-0012-search-index-stack.md`
    all byte-unchanged). TC13 evidence.

19. **NO ADR / Wave 4 plan / heavy-block / 8-block / agent-contract
    / CLAUDE.md change** (B3-B6 + B7 scope; B2 is binary + MDX
    + bookkeeping only). TC14 + TC15 + TC18 evidence.

20. **PR.md self-listed in `## files`** per ADR-0006 D8 strict
    whitelist + Pre-A1+...+B1a+B1b precedent. TC22 evidence.

21. **Lockfile byte-unchanged** (no new JS deps; PIL is Python
    dev-time tool). TC12 evidence.

22. **Standard PR pipeline**: PLAN → EXECUTE → REVIEW → COMMIT
    → ACCEPT. **No D2 row 1/2/4/5/8 trigger HIT** (verified above);
    stage 4 PRE-COMMIT CLAUDE REVIEW does NOT fire. Reviewer
    iterations expected: R1 + 0-1 forward-fix; risk classes for
    B2: (a) PDF page-count regex fragility — reviewer may request
    a stricter verifier (orchestrator-self runs both the regex +
    a backup `pdfminer` snippet if available); (b) MDX intro prose
    wording — reviewer may request tighter cite to ADR-0009 vs
    ADR-0014 priorities (orchestrator-self iterates within the
    bounded ~10 LOC paragraph); (c) ICO format compliance —
    reviewer may request multi-frame ICO (16×16 + 32×32) instead
    of single-frame (PLAN-time decision: single-frame for minimum
    file size; if reviewer pushes back, regenerate as multi-frame
    via PIL `save(..., format='ICO', sizes=[(16,16), (32,32)])`).

23. **Codex commit (D1 stage 5)** uses ADR-0006 D8 explicit-file-list
    staging: reviewer codex commits 12 files (7 canonical from `## files` + 5 audit archives — 2 B1b leftover ACCEPT/COMMIT + 3 B2 reviewer R1/R2/R3 — per B1b precedent for orphan audit back-fill)
    in a single explicit list:
    `git reset HEAD` → `git add apps/site/public/sample-assets/diagram-small.png
    apps/site/public/sample-assets/figure-1.png
    apps/site/public/sample-assets/whitepaper.pdf
    apps/site/public/favicon.ico
    content/notes/sample-blocks/index.mdx
    docs/plans/active.md
    docs/plans/wave-4-main/B2-sample-blocks-cleanup.md` →
    `git diff --cached --stat` verify (7 files; lockfile NOT in
    staging) → `git commit`. Per memory
    `feedback_git_operator_explicit_stage.md` lockfile-scope
    discipline: lockfile MUST be byte-unchanged (TC12 pre-commit
    verifies). The 4 binary files are tracked normally by git as
    binary blobs (no LFS gate per repo convention; total binary
    payload < 20 KB).

## Risk register (B2-specific)

B2's risk surface is small (binary placement + MDX prose refresh
+ bookkeeping; no D2 row 1/4/8 trigger). Three B2-specific risks
documented:

1. **PDF generation tooling absence (reportlab not installed) +
   hand-crafted PDF format compliance**: PLAN-time tooling check
   (`python3 -c 'import reportlab'` → ModuleNotFoundError) confirms
   reportlab is NOT available in the dev env; pdfinfo is also NOT
   available (`which pdfinfo` → empty). The hand-crafted minimum
   3-page PDF approach hand-rolls the catalog + pages tree + 3
   page objects + xref + trailer as raw bytes. **Mitigation**: the
   PDF format spec is text-based (PDF 1.4); a ~1 KB hand-rolled
   file with `%PDF-1.4` magic + 3 page objects + valid xref table
   + `%%EOF` terminator is a well-known format pattern. EXECUTE-time
   verification uses `python3` to count `/Type /Page` minus
   `/Type /Pages` occurrences (TC3). If the hand-rolled PDF fails
   either Astro's static-asset serving (no special PDF MIME-type
   handling required; Astro serves binary) or the block-pdf
   ui-default rendering (which may parse via PDF.js or similar),
   the fallback is to `pip install reportlab` in the dev env
   one-shot before EXECUTE — but this is OUT OF B2 SCOPE
   (reportlab is a dev-time tool, not a workspace dep; the
   one-shot install does not touch `package.json` / `pnpm-lock.yaml`).
   PLAN-time confidence: hand-crafted PDF approach is sufficient
   for the static-asset placement use case (block-pdf ui-default
   at SSR only emits a `<div data-block="pdf">` skeleton; runtime
   PDF parsing happens client-side post-hydration via the heavy-block
   path B7 wires up — block-pdf is actually a LIGHT block per
   ADR-0009 + Wave 3 mdx-bridge, but its rendering depends only
   on `src` / `page` / `searchable` props at SSR, not on the PDF
   binary content). TC3 + TC11 verify both placement and SSR build.

2. **MDX render regression from prose rewrite**: rewriting the
   intro paragraph + Callout body may accidentally introduce MDX
   syntax errors (e.g., backtick escaping, `<` HTML interpretation,
   stray `{` that JSX-parses). **Mitigation**: TC10 (`pnpm --filter
   @skb/site test`) runs `sample-blocks-page.test.ts` which builds
   the site as part of `beforeAll`; if MDX parses to invalid JSX,
   `pnpm build` fails with an explicit MDX compile error; the
   error surfaces immediately at EXECUTE-time + reviewer codex
   would catch it pre-commit. PLAN-time precaution: the rewrite
   uses backtick code-fences for inline code names (e.g., `componentsMap`,
   `HeavyBlockBoundary`) per the existing fixture-prose pattern at
   lines 19-26 (Callout / Code section descriptions); no new MDX
   syntax constructs introduced.

3. **Latent test fragility revealed by B2's correctness**: the
   existing `sample-blocks-page.test.ts:23` SSR marker assertion
   `'src="/sample-assets/diagram-small.png"'` PASSED at HEAD even
   without the binary present (Astro serves the URL string verbatim
   in the `<img src=...>` HTML attribute regardless of asset
   resolution). B2 closes this latent fragility by making the URL
   resolve to a real binary. **No mitigation needed for B2 itself**
   (TC10 verifies regression-free). For Stage C user-iteration, a
   stricter test pattern (asset-resolution check via `existsSync(distRoot
   + asset.url)`) could be added, but this is OUT OF B2 SCOPE per
   the gatekeeper directive #5 "merged into a single PR" framing
   that bounds B2 to placement + prose only.

## executor

Per Wave 4 plan v0.2.1 Amendment B2 row (`executor: orchestrator-self
(manual binary file placement)` + B3 row `executor: orchestrator-self
(doc-only prose update)`; the gatekeeper directive 2026-05-03 #5
merged old B2+B3 → new B2 keeps both executor rows as orchestrator-self):

- **PLAN**: pr-writer Claude subagent (you, this dispatch). Output
  this PR.md at `docs/plans/wave-4-main/B2-sample-blocks-cleanup.md`.
  SendMessage orchestrator on completion; orchestrator iterates
  0-2 rounds before lock.

- **EXECUTE**: **orchestrator-self** (binary placeholder generation
  + MDX prose refresh + bookkeeping; matches Pre-A2 doc-only
  ADR-0014 design-lock + B1a doc-flavored amendment precedent).
  NOT codex-generic-executor — the binary generation needs Python
  tooling at orchestrator's hand (PIL 10.2.0 verified PLAN-time;
  hand-crafted PDF authored as raw bytes); the MDX prose rewrite
  needs Claude reasoning depth for Wave 3 + Wave 4 Stage A status
  alignment + ADR cross-reference correctness. Standard ADR-0011
  D1 stage 5 reviewer-codex-commit applies; orchestrator-self
  does EXECUTE only.

  EXECUTE order (TDD-front discipline per memory
  `feedback_soted_pr_md_discipline`): B2.A binary generation
  (4 files) — PIL for PNGs + ICO; hand-rolled PDF as raw bytes;
  verify TC1-TC4 magic-byte + dimension checks → B2.B MDX prose
  refresh (`content/notes/sample-blocks/index.mdx`) — intro
  paragraph rewrite + obsolete "draft: true" paragraph removal
  + Callout warning body refresh; verify TC5-TC8 grep checks →
  B2.C `pnpm --filter @skb/site test` → exit 0 (TC10) → B2.D
  `pnpm --filter @skb/site build` → exit 0 + binary copy verify
  (TC11) → B2.E active.md B1b backfill + B2 row insertion (TC9)
  → B2.F byte-unchanged guards verify (TC12-TC18) → B2.G
  `pnpm link-check` BLOCKED on dev WSL2 (lychee binary not installed;
  CI canonical per amended TC20 + acceptance bullet 13 + B1a/B1b
  precedent); pre-commit substitute = file-target-exists `test -f`
  for the 2 new MDX prose cross-references (ADR-0014 + heavy-block-boundary
  CONTRACT.md) → B2.H `pnpm check` workspace-wide clean (TC21) →
  reviewer codex commits per `## acceptance` bullet 23.

- **REVIEW (D1 stage 3)**: `codex-pr-reviewer-55` (`--yolo
  --profile codex-pr-reviewer-55`). ADR-0006 8-point checklist +
  ADR-0006 D8 explicit-file-list staging mandatory. Reviewer reads
  the MDX file at HEAD (not via PR.md excerpt) per memory
  `feedback_pr_reviewer_authority_at_head`. Reviewer also samples
  the 4 binary files via `file`/magic-byte checks to confirm valid
  format (per the test_cases TC1-TC4 verification commands).

- **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)**: **DOES NOT FIRE**
  per `## D2 trigger judgment` (no row 1/2/4/5/8 HIT). Skipped
  per ADR-0011 D1 row mapping.

- **COMMIT (D1 stage 5)**: reviewer codex commits via Pre-A1
  4-step `git reset HEAD` → `git add <list>` → `git diff --cached
  --stat` verify → `git commit` (memory
  `feedback_git_operator_explicit_stage`). Lockfile MUST be
  byte-unchanged (TC12 pre-commit). 7 files in canonical commit
  list (4 binaries + MDX + active.md + PR.md self-list).

- **ACCEPT (D1 stage 6)**: pr-writer second invocation walks
  the 23 acceptance bullets against the actual diff; residue
  list returned to orchestrator for B3 PLAN seed.

- **POST-MERGE**: `gh pr merge --squash --delete-branch` per
  Wave 3 auto-merge authorization (memory `feedback_wave3_auto_merge`);
  B2 row `#TBD | TBD` backfilled at next PR (B3) per
  one-row-per-PR cadence.

## Out of scope (deferred)

B2 explicitly does NOT touch the following surfaces (also enforced
by TC13, TC14, TC15, TC16, TC17, TC18 diff guards):

- **`apps/site/public/sample-assets/models/mlp-mnist.json`**
  (referenced by NnViz fixture line 130: `modelUrl="/sample-assets/models/mlp-mnist.json"`).
  This MLP JSON is a Wave 3 leftover; **deferred to Stage C
  user-iteration** if needed for true NnViz hydration end-to-end
  smoke (per the original Wave 4 plan B2 row scope which enumerated
  exactly 4 binaries: 3 sample-assets + 1 favicon, NOT the MLP
  JSON). TC17 verifies the directory + file remain absent.
- **B7-scope files** (`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`
  + `apps/site/src/islands/**` + `apps/site/src/components.ts`
  componentsMap heavy entries + `apps/site/playwright/heavy-block-layout-shift.spec.ts`
  AC#16 expansion + ADR-0014 v0.3 amendment + `apps/site/CONTRACT.md`
  heavy block taxonomy section). B7 is the CRITICAL Astro hydration
  wiring PR (Wave 4 plan v0.2.1 Driver 2; gatekeeper-surfaced
  2026-05-03). TC16 verifies B2 stays out.
- **B1a + B1b shipped files** (`apps/site/src/lib/word-level-match.ts`
  + `apps/site/src/__tests__/word-level-match.test.ts` +
  `apps/site/src/components/SearchBox.astro` +
  `apps/site/playwright/search.spec.ts` +
  `apps/site/src/__tests__/search-cjk.test.ts` +
  `apps/site/CONTRACT.md` + `docs/decisions/ADR-0012-search-index-stack.md`
  byte-unchanged from squash `1aa2811` + `5ec7123`). TC13 verifies.
- **All ADR files** (B2 cites ADR-0014 + ADR-0009 by markdown link
  for read; touches none for write). TC14 verifies.
- **Wave 4 plan doc** (v0.2.1 Amendment authored at B1a; B2 does
  NOT amend further). TC15 verifies.
- **8 block packages + heavy-block-boundary** (byte-unchanged
  since Stage A close HEAD `4aeb279`). TC18 verifies.
- **`agent-contract.md` / `CLAUDE.md` / `docs/runbooks/codex-tool-invocations.md`**
  (Wave 4 process documents; no change for B2).
- **Stage B remaining 5 PRs** (B3 `__test_cjk__` relocation; B4
  Stage A retro items 2-4; B5 codex profile prefix R3 + lychee
  autolink memory codify; B7 heavy block hydration wiring; B6
  Wave 4 close-ceremony preparation) — canonical roster +
  per-PR scope authoritative in
  [`docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  `## Amendments § v0.2.1` table.
- **Stage C** — open-ended Phase 1 user-iteration scope per
  gatekeeper directive #4 + MVP framework.

## Related

- [ADR-0011 D1 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — pipeline framework + D2 trigger row mapping (verified all rows NO HIT for B2)
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md) — staging discipline for the 7-file commit
- [ADR-0014 HeavyBlockBoundary wrapper](../../decisions/ADR-0014-heavy-block-boundary.md) — Wave 4 Stage A architectural ADR (cited in refreshed MDX intro prose; promoted at A8; B7 will ship v0.3 amendment)
- [ADR-0009 BlockKind 4-way union](../../decisions/ADR-0009-block-kind-union-expansion.md) — 4-way kind taxonomy (cited in refreshed MDX intro prose for the 5 light + 3 heavy block split)
- [ADR-0012 search index stack](../../decisions/ADR-0012-search-index-stack.md) — Wave 3 D-stage + B1a v0.1.1 amendment (byte-unchanged in B2 per TC13)
- [Wave 4 plan v0.2.1 Amendment](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — Stage B re-locked sequence + B2 row scope authority
- [docs/plans/active.md](../active.md) — Wave 4 PR roster + B1b backfill target + B2 NEW row insertion target
- [B1a PR.md](B1a-adr-0012-amendment.md) — squash `1aa2811`; PR #39; doc-flavored ADR amendment + utility precedent (orchestrator-self EXECUTE)
- [B1b PR.md](B1b-searchbox-integration.md) — squash `5ec7123`; PR #40; immediate predecessor (B1b backfill target in active.md)
- [Pre-A2 PR.md](Pre-A2-adr-0014-heavy-block-boundary.md) — doc-only ADR design-lock precedent (orchestrator-self EXECUTE)
- memory `feedback_soted_pr_md_discipline.md` — SOTed-PR.md authoring discipline (single-source-of-truth + cross-section reference + TDD-front + memory-cited)
- memory `feedback_lychee_line_anchor.md` + `feedback_lychee_user_local_paths.md` + `feedback_lychee_npmjs_403.md` — lychee discipline applied to PR.md cross-references + MDX intro prose ADR cites
- memory `feedback_git_operator_explicit_stage.md` — 7-file explicit-file-list commit at D1 stage 5
- memory `feedback_wave3_auto_merge.md` — `gh pr merge --squash --delete-branch` post-merge cadence
