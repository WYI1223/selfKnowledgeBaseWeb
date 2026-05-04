# B1a — ADR-0012 amendment (PageFind query-time substring + path-prose alignment) + `isWordLevelMatch` utility + Stage B re-plan record

> **Wave 4 Stage B FIRST implementation PR** of the re-locked 8-PR
> sequence (B1a → B1b → B2 → B3 → B4 → B5 → B7 → B6; see Wave 4
> plan v0.2.1 Amendment). Doc-flavored: ADR-0012 v0.1.1 Amendment
> ratifying Wave 3 D3 PageFind runtime substring fallback finding
> + criterion 4 mitigation path lock + 5 path-prose flips
> (`dist/_pagefind/` → `dist/pagefind/`); `apps/site/CONTRACT.md`
> stale-note removal; new `apps/site/src/lib/word-level-match.ts`
> pure utility (`Intl.Segmenter` + locale-aware policy) with
> 12-case unit corpus; Stage B re-plan record (active.md +
> Wave 4 plan v0.2.1 Amendment, both already authored PLAN-time).
> **NO SearchBox.astro change** — deferred to B1b. Standard
> ADR-0011 D1 pipeline; **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)
> FIRES** per `## D2 trigger judgment` below (Row 1 + Row 4 HIT).
> Out of scope: see `## Out of scope (deferred)` (delegates to
> Wave 4 plan v0.2.1 roster).

## title

Author ADR-0012 v0.1.1 Amendment ratifying PageFind 1.5.2 query-time
partial-substring fallback (Wave 3 D3 runtime finding; see memory
`feedback_pagefind_query_substring.md`) + criterion 4 mitigation
locked to path (b) custom query parser (NOT path (a) waive);
align ADR-0012 main prose `_pagefind/` → `pagefind/` at the 5
verified occurrences (lines 37, 45, 46, 76, 86); remove
`apps/site/CONTRACT.md` lines 17-21 stale-note (replaced with
single-sentence factual statement); ship new pure utility
`apps/site/src/lib/word-level-match.ts` exporting
`isWordLevelMatch(query, content, locale?)` (`Intl.Segmenter`
`granularity: 'word'` + locale-aware policy: CJK → `'zh-Hans'`,
ASCII → `'en'`, mixed → both locales union-match, explicit
`locale` overrides) + 12-case unit corpus in
`apps/site/src/__tests__/word-level-match.test.ts`. Bookkeep
`docs/plans/active.md` (A8 row backfill + new B1a row + 2 ✅
flips on lines 31-32) + verify Wave 4 plan doc `## Amendments §
v0.2.1` present (authored PLAN-time). PR.md self-listed per
ADR-0006 D8 strict-whitelist + Pre-A1 → A8 precedent.

## files

10 files (canonical count; orchestrator-self EXECUTE for prose +
utility + tests + bookkeeping; **plan-challenger codex audit archive
+ R1 + R2 reviewer codex audit archives included in slots 8/9/10**
because they were generated 2026-05-03 during the B1 plan-challenger
+ B1a R1 + B1a R2 dispatches BEFORE/DURING this PR's REVIEW stage and
are cited in `## Plan-challenger absorbtion` + `## acceptance` below
— natural to ship in the SAME B1a commit per ADR-0006 D8
explicit-file-list discipline rather than orphan them; this matches
A1 (squash HEAD `f765968`) precedent of committing R-round audit logs
alongside source files; reviewer codex commits the explicit list at
D1 stage 5). NO `package.json` / `pnpm-lock.yaml` change (no new
deps; `Intl.Segmenter` is built into Node 18+ and modern browser
runtimes per ADR-0012 line 77 "Node 18+ + 现代浏览器全量支持"). NO
`apps/site/astro.config.mjs` change (B1a does not touch build
integration). PR.md self-listed per Pre-A2+A1+A2+A3+A4+A5+A6+A7+A8
precedent.

- `docs/decisions/ADR-0012-search-index-stack.md` — **MODIFIED**
  (~80 LOC delta total). Two coupled edits applied as a single
  coherent amendment patch:

  **Edit A (path-prose alignment, 5 occurrences; ~10 LOC delta)**:
  flip `_pagefind` → `pagefind` (1-char delete) at lines 37, 45, 46,
  76, 86 (verified PLAN-time via `grep -n '_pagefind' docs/decisions/ADR-0012-search-index-stack.md`
  returning exactly those 5 lines). All 5 occurrences appear
  mid-sentence with unique surrounding clauses (no risk of stale
  match collision); EXECUTE-time uses `Edit` tool with sufficient
  context per occurrence. Semantic contract unchanged — pagefind 1.5+
  emits without the underscore prefix (already documented in
  `apps/site/CONTRACT.md` lines 16-21 as the live build behavior);
  ADR prose was historical pre-1.5 default. TC17 verifies post-edit
  `_pagefind/` count = 0 + `pagefind/` count ≥ 5.

  **Edit B (NEW `## Amendments` section + `### v0.1.1
  (2026-05-03; Wave 4 Stage B B1a)` entry; ~70 LOC delta)**:
  insert a new section AFTER `## Compliance` (closes ~line 111)
  and BEFORE `## Related` (starts ~line 113). Body follows the
  ADR-0014 v0.2.1 Amendments § precedent. Required content
  (final prose authored EXECUTE-time):

  - **Heading**: `### v0.1.1 (2026-05-03; Wave 4 Stage B B1a) —
    PageFind 1.5+ query-time substring fallback finding + criterion 4
    mitigation path lock + dist/_pagefind/ → dist/pagefind/ path-prose
    alignment`.
  - **Ratification narrative**: PageFind 1.5+ segments index-time
    via `Intl.Segmenter` (per line 25 D1a evidence), BUT the
    runtime query parser applies partial-substring matching to
    segmented tokens — query `"记本"` hits a `"笔记本电脑"` note
    because `"记本"` is a substring of the `"笔记本"` segment. This
    is PageFind native runtime behavior, not a project bug. D1a's
    8-axis matrix did not enumerate the runtime query-parser
    fallback as a separate axis; Wave 3 D3 vitest
    `search-cjk.test.ts` inverse-discriminator surfaced it in CI
    2026-05-01.
  - **Criterion 4 prose update**: original inverse assertion
    remains valid as an **index-tokenizer** discriminator
    (still distinguishes char-level vs word-level index
    tokenization). However, the **runtime query result** for
    `"记本"` includes the `"笔记本电脑"` note. Project mitigation
    locks **path (b) custom query parser** (client-side word-level
    filter on top of PageFind's raw result set, hide
    substring-only matches); path (a) waive **rejected** per
    Wave 3 D1a + user-gatekeeper-locked path expecting
    word-level UX for CJK notes.
  - **Mitigation surface**: B1a (this PR) ships pure utility
    `apps/site/src/lib/word-level-match.ts` exporting
    `isWordLevelMatch(query, content, locale?)` backed by
    `Intl.Segmenter` `granularity: 'word'` + locale-aware policy
    (auto-detect CJK / ASCII / mixed; explicit `locale` param
    overrides). B1b (follow-up; not this PR) ships SearchBox
    integration via Option B-4 hybrid per plan-challenger C1
    absorbtion: PagefindUI `processTerm` + `processResult` +
    DOM-level mismatch hide + count-fixup `MutationObserver`
    (count-fix MANDATORY per C4 absorbtion because PagefindUI
    count is `searchResult.results.length`-driven and stays
    stale under CSS-only hide).
  - **Path-prose alignment narrative**: 5 main-prose occurrences
    (lines 37, 45, 46, 76, 86) flipped `_pagefind` → `pagefind`
    in same patch as Edit A. Semantic contract (post-build hook +
    content-hash chunk filenames + cache-bust) unchanged. Wave 3
    D2 PR (#24) did not align ADR prose at the time; v0.1.1
    brings ADR into byte-alignment with the live build
    (`apps/site/CONTRACT.md` was always against the live path).
  - **Cross-references** (all link-checked; per memory
    `feedback_lychee_user_local_paths` cite memories by name in
    backticks NOT as markdown links to `~/.claude/...`):
    memory `feedback_pagefind_query_substring.md`; ADR-0013 D3
    Wave 4 deferred items; Wave 4 plan v0.2.1 Amendment; this
    PR.md. **NO link to `B1b-searchbox-integration.md`** — that
    file does not yet exist; reference B1b only via the Wave 4
    plan v0.2.1 Amendment narrative.

  Total NEW section ~70 LOC. Notes for executor:

  (a) The `## Amendments` insertion point is **AFTER `## Compliance`
  closing bullet** at current line ~111 + **BEFORE `## Related`**
  at current line 113. Re-verify line numbers EXECUTE-time
  (`grep -n '^## ' docs/decisions/ADR-0012-search-index-stack.md`)
  because Edit A's path-prose changes do not affect line count
  (each substitution is a 1-char delete with no line wrap impact,
  so all section headers retain current line numbers). Total
  post-edit file size: 119 + ~70 ≈ 189 LOC; below 200 LOC ESLint
  warn target; safe.

  (b) The `## Amendments § v0.1.1` link to this PR.md uses a
  relative path from `docs/decisions/`:
  `../plans/wave-4-main/B1a-adr-0012-amendment.md` (one `..` to
  escape `docs/decisions/`, then `plans/wave-4-main/...`). Verify
  EXECUTE-time via `pnpm link-check` to ensure lychee resolves the
  link (per memory `feedback_lychee_line_anchor` no `:line` suffix;
  per `feedback_lychee_user_local_paths` no `~/.claude/...` links;
  per `feedback_lychee_npmjs_403` cite npm packages via GitHub repo
  URL only — no npmjs.com/package/X form). The link target file
  IS this PR.md self-listed below; lychee will find it.

  (c) **DO NOT touch** any prose in the existing ADR body
  (`## Context` / `## Decision` / `## Acceptance criteria` /
  `## Consequences` / `## Alternatives considered` / `## Compliance` /
  `## Related`) other than the 5 path-prose substitutions
  enumerated in Edit A. The amendment captures only:
  (i) path-prose alignment (5 substitutions), (ii) post-finding
  ratification + criterion 4 mitigation-path lock (NEW Amendments §).
  The underlying decision document remains v0.1 prose unchanged
  for the criteria + alternatives + compliance bodies (the v0.1.1
  increment captures only the runtime-finding ratification + path
  alignment + mitigation pointer, NOT a decision rev). TC4 verifies
  the diff is bounded.

  (d) **Status field on line 5 STAYS `accepted`**. v0.1.1 is an
  Amendment, not a status change — distinct from ADR-0014's A8
  `proposed → accepted` promotion which DID flip status. ADR-0012
  was already `accepted` at D1b (2026-05-01); this amendment
  records a post-acceptance finding + mitigation lock without
  re-opening the decision. TC2 verifies status unchanged.

- `apps/site/CONTRACT.md` — **MODIFIED** (~5 LOC net delta: -7 LOC
  stale-note removal, +2 LOC factual statement). Current file 111
  LOC; lines 17-21 contain a 5-line stale-note paragraph flagging
  the ADR-0012 path-prose mismatch this amendment resolves. EXECUTE
  replaces the stale-note paragraph with a 2-line factual statement:
  "ADR-0012 main prose was aligned to the current `dist/pagefind/`
  path (without the `_` prefix) at v0.1.1 amendment 2026-05-03;
  the semantic contract (post-build hook + build artifact +
  content-hash cache-bust) is unchanged." This preserves the
  cache-bust contract reference + alignment history pointer.

  Verified PLAN-time: `grep -n '_pagefind' apps/site/CONTRACT.md`
  returns 2 hits at lines 17 + 43; line 17 is the stale-note
  paragraph (this edit removes it), line 43 is the Python-style
  variable name `current_dist_pagefind_bytes` inside the
  projection formula. **PLAN-time decision**: KEEP line 43
  variable name as-is — it is a self-documenting identifier in
  a `du -sb` formula example, not a path string. Variable
  identifier renaming would break readability without semantic
  gain. TC21(a) confirms post-edit `_pagefind` count = 1 (line 43
  variable name only). All other prose in `apps/site/CONTRACT.md`
  stays byte-unchanged.

- `apps/site/src/lib/word-level-match.ts` — **NEW**. Pure utility
  module exporting **only** `isWordLevelMatch(query: string, content: string, locale?: string): boolean`
  (no helper exports leak; helpers are file-local). NO React /
  Astro / PageFind imports — pure string-segmentation. Consumed by
  B1b (B1b imports from `apps/site/src/components/SearchBox.astro`'s
  client-side script). Total ~70 LOC (~40 code + ~30 JSDoc).

  Implementation contract (final body authored EXECUTE-time):

  - **Returns `true`** iff `query` equals at least one COMPLETE
    segment in `content` after `Intl.Segmenter` word-granularity
    segmentation (NOT a substring of any segment).
  - **Locale policy** (per plan-challenger C3 NOT-ABSORBED verdict
    at 2026-05-03 B1 plan-challenge — single `zh-Hans` default
    too narrow):
    - Explicit `locale` param wins (e.g., `'zh-Hans'`, `'en'`,
      `'ja'`, `'ko'`).
    - Auto-detect (when `locale` undefined): if `query` contains
      any CJK Unified Ideograph (`\p{Script=Han}`), use `'zh-Hans'`;
      else use `'en'`.
    - Mixed-content fallback: if query auto-detects as one locale
      but content auto-detects as the other, segment content in
      BOTH locales and return true if query equals any segment
      under either locale (union).
  - **Case sensitivity**: case-insensitive for ASCII (matches
    PageFind UX per `@pagefind/default-ui` defaults). Lowercase
    comparison applied AFTER segmentation (boundaries computed on
    original content; text comparison is lowercased).
  - **Edge cases**: empty `query` → `false`; empty `content` →
    `false`; query length > content length → `false` (cheap
    pre-check before segmenter construction).
  - **Scope discipline**: NOT a tokenizer for indexing — runtime
    FILTER over PageFind's raw result set only. The PageFind index
    itself remains word-segmented at index-time per ADR-0012
    line 25 D1a research evidence; this filter only catches the
    runtime query-parser substring fallback.
  - **JSDoc must cite**: ADR-0012 v0.1.1 Amendment by section name
    (NOT line number per memory `feedback_lychee_line_anchor`) +
    memory `feedback_pagefind_query_substring.md` (in backticks,
    not as markdown link) + plan-challenger C3 verdict.

  TC22 verifies the export signature + locale param + Intl.Segmenter
  usage.

- `apps/site/src/__tests__/word-level-match.test.ts` — **NEW**.
  Vitest unit corpus matching the 12 cases in `## test_cases`
  TC1-TC12 below. Imports `isWordLevelMatch` from `../lib/word-level-match`.
  Naming convention follows existing `apps/site/src/__tests__/`
  pattern (verified PLAN-time: 9 existing test files use `*.test.ts`
  suffix + vitest `describe / it` per-case structure; `search-cjk.test.ts`
  is the closest-purpose precedent). Total ~80 LOC. TC13 verifies
  file presence + 12/12 PASS under
  `pnpm test --filter=@skb/site -- word-level-match`.

- `docs/plans/active.md` — **MODIFIED** (~5 LOC delta; lines 6 +
  24 already updated PLAN-time per PLAN-time prose; B1a EXECUTE
  applies 3 small edits):

  - **A8 row backfill**: existing `| #TBD (this) | TBD | A8 |
    ...` row (PLAN-time finding: A8 row not yet backfilled
    despite squash HEAD `4aeb279` being live HEAD of `main`)
    → `| #38 | 4aeb279 | A8 | ...`.
  - **NEW B1a row**: append after A8 row + before Stage A
    summary row: `| #TBD (this) | TBD | B1a | ADR-0012 amendment
    doc + isWordLevelMatch util + Stage B re-plan record |`
    (backfilled at NEXT PR per the one-row-per-PR cadence).
  - **Mandatory-scope ✅ flips (lines 31-32)**:
    - Line 31 `⏳ ADR-0012 amendment ... B1 scope` →
      `✅ ADR-0012 amendment: PageFind query-time substring
      finding — Stage B B1a (this PR; doc + util) + B1b
      (SearchBox integration follow-up)`
    - Line 32 `⏳ Path-prose alignment ... B1 scope (combined)` →
      `✅ Path-prose alignment in ADR-0012: _pagefind/ →
      pagefind/ — Stage B B1a (Edit A merged 2026-05-03)`

  Lines 6 + 24 (Wave 4 phase summary + Stage B 8-PR roster prose)
  already updated PLAN-time; B1a EXECUTE only verifies presence
  via TC23(a).

- `docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md` —
  **MODIFIED** (already authored PLAN-time; verified PLAN-time;
  ~150 LOC delta in working tree at the `## Amendments § v0.2.1`
  section). PR.md verifies presence:

  - `grep -c 'v0.2.1.*Wave 4 Stage B mid-stage re-plan'`
    `docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`
    → expected ≥ 1.
  - The Amendment body covers: Stage B count revised 6 → 8 PRs;
    Driver 1 (B1 split per plan-challenger C6+C10); Driver 2
    (B7 NEW heavy block Astro hydration wiring); re-locked
    Stage B sequence table (8 rows); reference to plan-challenger
    audit at `docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt`.

  No further EXECUTE-time edit to this file is required by B1a;
  B1a EXECUTE only **verifies** the Amendment is present + complete
  (any drift surfaces via `pnpm link-check` cross-references). TC10
  verifies the section presence.

- `docs/plans/wave-4-main/B1a-adr-0012-amendment.md` — **NEW**
  (this PR.md, self-listed per ADR-0006 D8 + Pre-A1+Pre-A2+Pre-A3+A1+A2+A3+A4+A5+A6+A7+A8
  precedent; pr-writer must include the PR.md in the canonical
  `## files` list at PLAN time). ~931 LOC final (PR.md exempt from
  the 200 LOC target per ADR-0011 D2 v0.1.1 + memory
  `feedback_soted_pr_md_discipline`; comparable to A1-A8 PR.md sizes
  range 468-1687 LOC).

- `docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt` — **NEW**
  (plan-challenger codex audit archive; 2000-line truncation of the
  raw `/tmp/codex-runs/2026-05-03-B1-plan-challenge.txt` per ADR-0011
  D6 universal Bash invariants — R7 mitigation flow `head -2000`
  truncate to in-tree archive). Cited in `## Plan-challenger
  absorbtion` below; ships in this PR's commit per ADR-0006 D8
  explicit-file-list staging. ~2000 LOC (auto-generated audit
  artifact; not subject to the 500-LOC source-file cap because it
  lives under `docs/audits/` per the audit-archive convention).

- `docs/audits/codex-runs/2026-05-03-B1a-pr-reviewer-55.txt` — **NEW**
  (B1a stage 3 REVIEW R1 codex-pr-reviewer-55 audit archive;
  R1 verdict FAIL with 3 BLOCKING issues which orchestrator
  resolved: (1) ADR-0012 lines 115+126 `_pagefind/` literal residue
  → reworded heading + path-prose paragraph; (2) PR.md staging
  instructions said `7 files` → updated to `8 files` then `10 files`
  with this entry; (3) word-level-match.ts JSDoc missed memory cite
  → added `feedback_pagefind_query_substring.md` reference paragraph).
  Same R7-mitigation truncation pattern as the plan-challenger archive.
  ~2000 LOC. Stage A A1 squash HEAD `f765968` precedent of shipping
  R-round audit logs in same commit applies.

- `docs/audits/codex-runs/2026-05-03-B1a-pr-reviewer-55-r2.txt` —
  **NEW** (B1a stage 3 REVIEW R2 codex-pr-reviewer-55 audit archive;
  R2 verdict PASS with 'R1 issues 1/2/3 resolution status:
  1=RESOLVED, 2=RESOLVED, 3=RESOLVED' + 'New regressions hunt: none'
  + 'asymmetry-audit re-applied (delta only): items affected by
  fixes verdicts: ... PASS'; clears stage 3 to advance to stage 4
  PRE-COMMIT CLAUDE REVIEW). Same R7 truncation pattern. ~2000 LOC.

## test_cases

B1a ships 1 NEW vitest unit suite (`word-level-match.test.ts`)
+ 1 NEW utility module (`word-level-match.ts`) + 1 ADR amendment
+ 1 CONTRACT prose tightening + 2 plan/active bookkeeping verifications
+ this PR.md self-listed. TDD-front discipline (per ADR-0011 D1
stage 2 + memory `feedback_soted_pr_md_discipline`): **write the
test file FIRST** (the 12-case corpus below) → write the utility
body to make the suite green → run `pnpm test --filter=@skb/site
-- word-level-match` and verify 12/12 PASS → run `pnpm typecheck
--filter=@skb/site` clean → run `pnpm lint --filter=@skb/site`
clean → apply ADR + CONTRACT + active.md edits → run `pnpm
link-check` clean → run `pnpm check` workspace-wide clean.

Test triplets (input → expected → location):

- **TC1** (CJK positive: word-level segment match) Input:
  `isWordLevelMatch('笔记', '中文笔记测试')`. Expected: `true`.
  Location: `apps/site/src/__tests__/word-level-match.test.ts`
  per `it('matches segment 笔记 in 中文笔记测试 (CJK positive)', ...)`.
- **TC2** (CJK inverse: ADR-0012 criterion 4 paired discriminator
  at runtime) Input: `isWordLevelMatch('记本', '笔记本电脑')`.
  Expected: `false` (`'记本'` is NOT a complete segment in the
  `Intl.Segmenter` zh-Hans output `['笔记本', '电脑']`-style; this
  is the runtime mitigation discriminator). Location:
  `apps/site/src/__tests__/word-level-match.test.ts` per
  `it('rejects substring 记本 within 笔记本 segment ...', ...)`.
- **TC3** (ASCII positive: word match) Input:
  `isWordLevelMatch('callout', 'a callout block')`. Expected:
  `true`. Location: same file per `it('matches word callout in a
  callout block (ASCII positive)', ...)`.
- **TC4** (ASCII inverse: substring within word) Input:
  `isWordLevelMatch('all', 'callout')`. Expected: `false`. Location:
  same file per `it('rejects substring all within callout
  (ASCII inverse)', ...)`.
- **TC5** (mixed CJK+ASCII positive: CJK query, mixed content)
  Input: `isWordLevelMatch('笔记', 'Today: 笔记 entry')`. Expected:
  `true`. Location: same file per `it('matches CJK 笔记 in mixed
  Today: 笔记 entry', ...)`.
- **TC6** (mixed CJK+ASCII positive: ASCII query, mixed content)
  Input: `isWordLevelMatch('callout', '一个 callout block')`.
  Expected: `true`. Location: same file per `it('matches ASCII
  callout in mixed 一个 callout block', ...)`.
- **TC7** (punctuation boundary CJK) Input:
  `isWordLevelMatch('笔记', '今天写了笔记。')`. Expected: `true`
  (the trailing 。 segments separately from `笔记`). Location:
  same file per `it('matches CJK 笔记 separated by 。 punctuation
  (今天写了笔记。)', ...)`.
- **TC8** (punctuation boundary ASCII) Input:
  `isWordLevelMatch('test', 'unit-test')`. Expected: `true`
  (hyphen is a segment boundary in en granularity:word).
  Location: same file per `it('matches ASCII test in unit-test
  (hyphen segment boundary)', ...)`.
- **TC9** (empty query) Input: `isWordLevelMatch('', 'foo')`.
  Expected: `false`. Location: same file per `it('rejects empty
  query', ...)`.
- **TC10** (empty content) Input: `isWordLevelMatch('foo', '')`.
  Expected: `false`. Location: same file per `it('rejects empty
  content', ...)`.
- **TC11** (case insensitivity for ASCII) Input:
  `isWordLevelMatch('Callout', 'callout block')`. Expected: `true`
  (case-insensitive equality after segmentation per JSDoc policy).
  Location: same file per `it('matches case-insensitively for
  ASCII (Callout vs callout)', ...)`.
- **TC12** (explicit-locale param honored) Input:
  `isWordLevelMatch('笔记', '笔记', 'zh-Hans')`. Expected: `true`
  (content equals query; the segmenter splits to a single segment
  `'笔记'` which equals query). Location: same file per
  `it('honors explicit zh-Hans locale (笔记 in 笔记)', ...)`.

Verification regression baselines (no new tests; grep + diff envelope;
all `Location: shell at repo root` unless noted):

- **TC13** apps/site test suite regression: `pnpm --filter
  @skb/site test` → exit 0; existing 9 corpora
  (`components-map / dims-source / fouc-script / lazy-chunking /
  sample-blocks-page / sample-blocks-astro-page / search-cjk /
  search-reindex / search-ui`) PASS unchanged + new
  `word-level-match.test.ts` 12/12 PASS.
- **TC14** apps/site typecheck clean (`Intl.Segmenter` via
  TypeScript `lib.es2022.intl`): `pnpm typecheck --filter @skb/site`
  → exit 0.
- **TC15** apps/site lint clean: `pnpm lint --filter @skb/site`
  → exit 0; no `max-lines` warning on `word-level-match.ts` (~70
  LOC < 200).
- **TC16** apps/site build clean: `pnpm --filter @skb/site build`
  → exit 0. The new utility module is currently consumed by no
  Astro component, so should NOT appear in any client bundle.
- **TC17** ADR-0012 path-prose alignment (Edit A): (a) `grep -c
  '_pagefind/' docs/decisions/ADR-0012-search-index-stack.md` →
  `0`; (b) `grep -c 'pagefind/' docs/decisions/ADR-0012-search-index-stack.md`
  → ≥ 5.
- **TC18** ADR-0012 status unchanged at `accepted` (Edit B is
  Amendment, not status flip): (a) `grep -c '状态 | accepted'`
  → `1`; (b) `grep -c '状态 | proposed'` → `0`.
- **TC19** ADR-0012 Amendments § v0.1.1 entry: (a) `grep -c
  '^## Amendments$' docs/decisions/ADR-0012-search-index-stack.md`
  → `1`; (b) `grep -c 'v0.1.1' ...` → ≥ 1; (c) `grep -c 'Wave 4
  Stage B B1a' ...` → ≥ 1.
- **TC20** ADR-0012 size below ESLint warn: `wc -l docs/decisions/ADR-0012-search-index-stack.md`
  → ≤ 200 (post-edit ~189 LOC; CLAUDE.md hard rule #1 cap 500).
- **TC21** apps/site/CONTRACT.md stale-note removal: (a) `grep
  -c '_pagefind' apps/site/CONTRACT.md` → `1` (variable name
  `current_dist_pagefind_bytes` line 43 only); (b) `grep -c
  'historical pagefind <1.5 default' apps/site/CONTRACT.md` →
  `0`; (c) `grep -c 'aligned to the current' apps/site/CONTRACT.md`
  → `1` (factual statement present).
- **TC22** `apps/site/src/lib/word-level-match.ts` export contract:
  (a) `grep -c 'export function isWordLevelMatch' ...` → `1`;
  (b) `grep -c 'locale\?: string' ...` → ≥ 1; (c) `grep -c
  'Intl.Segmenter' ...` → ≥ 1.
- **TC23** `docs/plans/active.md` re-plan + ✅ flip + roster:
  (a) `grep -c '8 PRs.*re-locked 2026-05-03' docs/plans/active.md`
  → ≥ 1; (b) `grep -c '✅ ADR-0012 amendment.*B1a' ...` → ≥ 1;
  (c) `grep -c '✅ Path-prose alignment.*B1a' ...` → ≥ 1;
  (d) `grep -c '#38' ...` → ≥ 1; (e) `grep -c '4aeb279' ...` →
  ≥ 1; (f) `grep -c '| B1a |' ...` → ≥ 1.
- **TC24** Wave 4 plan doc v0.2.1 Amendment present + complete:
  (a) `grep -c '### v0.2.1.*Wave 4 Stage B mid-stage re-plan'
  docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`
  → `1`; (b) `grep -c 'Driver 1 — B1 split' ...` → `1`;
  (c) `grep -c 'Driver 2 — NEW B7' ...` → `1`; (d) `grep -c
  'Re-locked Stage B sequence' ...` → `1`.
- **TC25** lychee link-check: `pnpm link-check` → exit 0. Per
  memory `feedback_lychee_line_anchor` no `:line` suffix; per
  `feedback_lychee_user_local_paths` no `~/.claude/...` links;
  per `feedback_lychee_npmjs_403` cite npm via GitHub repo URL
  only.
- **TC26** size-check: `pnpm size-check` → exit 0 (no source
  file > 500 LOC).
- **TC27** workspace-wide regression: `pnpm check` → exit 0
  (lint + typecheck + test + build + size-check all PASS).
- **TC28** PR.md self-listed: `grep -c 'B1a-adr-0012-amendment.md'
  docs/plans/wave-4-main/B1a-adr-0012-amendment.md` → ≥ 2.
- **TC29** lockfile byte-unchanged: `git diff main -- pnpm-lock.yaml`
  → empty diff (B1a adds NO deps; `Intl.Segmenter` is built-in).
- **TC30** heavy-block-boundary + 8 block packages byte-unchanged:
  `git diff main -- packages/heavy-block-boundary/ packages/block-callout/
  packages/block-code/ packages/block-image/ packages/block-math/
  packages/block-pdf/ packages/block-jupyter/ packages/block-nn-viz/
  packages/block-agent-flow/` → empty diff.
- **TC31** other 13 ADR files + README byte-unchanged: `git diff
  main -- docs/decisions/ADR-{0001,0002,0003,0004,0005,0006,0007,0008,0009,0010,0011,0013,0014}*.md
  docs/decisions/README.md` → empty diff (only ADR-0012 touched).
- **TC32** prior wave-4-main PR.md files byte-unchanged: `git diff
  main -- docs/plans/wave-4-main/{A1,A2,A3,A4,A5,A6,A7,A8,Pre-A1,Pre-A2,Pre-A3}-*.md`
  → empty diff.
- **TC33** agent-contract / CLAUDE / runbook byte-unchanged:
  `git diff main -- agent-contract.md CLAUDE.md
  docs/runbooks/codex-tool-invocations.md` → empty diff.
- **TC34** B1b-scope files byte-unchanged: `git diff main --
  apps/site/src/components/SearchBox.astro
  apps/site/playwright/search.spec.ts
  apps/site/src/__tests__/search-cjk.test.ts` → empty diff.

## contracts_affected

- **`apps/site/CONTRACT.md`** — **EDITED**. Lines 17-21 stale-note
  paragraph removed; replaced with a single-sentence factual
  statement preserving the cache-bust + post-build-hook + alignment
  history pointer. Rationale: the stale-note paragraph (authored
  at Wave 3 D2 to flag the ADR-0012 path-prose mismatch) is made
  redundant by ADR-0012 v0.1.1 Edit A (5 path-prose substitutions
  align the ADR to the live build output). Keeping the stale
  note after the alignment lands creates a self-contradictory
  invariant — the contract would point to a "follow-up" that
  has already happened. Per ADR-0011 D2 v0.1.1 invariant, contract
  edits and ADR edits in the same PR are atomic when they
  resolve a stale cross-reference. TC21 verifies the diff envelope
  + the new factual statement presence.
- **No other CONTRACT.md files modified.** B1a does NOT touch
  any `packages/*/CONTRACT.md`. The 8 block packages
  (`packages/block-{callout,code,image,math,pdf,jupyter,nn-viz,agent-flow}/CONTRACT.md`)
  + the heavy-block-boundary package
  (`packages/heavy-block-boundary/CONTRACT.md`) + the other 5
  workspace package CONTRACT.md files all remain byte-unchanged.
  TC30 verifies empty diff across `packages/`.

## adr_touched

- **`docs/decisions/ADR-0012-search-index-stack.md`** — **EDITED**
  (v0.1.1 Amendment per `## files` Edit A + Edit B above). Status
  field unchanged at `accepted` (line 5; B1a is an Amendment, not
  a status flip — distinct from ADR-0014's A8 promotion). Two
  coupled edits ship in the same commit:
  - Edit A: 5 path-prose substitutions `_pagefind/` → `pagefind/`
    at lines 37, 45, 46, 76, 86 (verified PLAN-time).
  - Edit B: NEW `## Amendments` section with `### v0.1.1
    (2026-05-03; Wave 4 Stage B B1a)` entry recording the Wave 3 D3
    runtime CJK-substring finding (memory
    `feedback_pagefind_query_substring.md`) + criterion 4 mitigation
    path lock (path (b) custom query parser, NOT path (a) waive) +
    apps/site mitigation surface pointer (B1a utility + B1b
    integration) + cross-references to memory + ADR-0013 D3 +
    Wave 4 plan v0.2.1 + this PR.md.

  Total ADR file delta ~80 LOC (~10 LOC for Edit A + ~70 LOC for
  Edit B); post-edit file size ~189 LOC; below 200 LOC ESLint
  warn target.

- **No other ADR files modified.** ADR-0014 (heavy-block-boundary)
  remains v0.2.1 from A8 — B7 will ship v0.3 amendment for the
  Astro hydration gap (out of scope for B1a). ADR-0011, ADR-0006,
  ADR-0007, ADR-0008, ADR-0013 + the others all stay byte-unchanged.
  TC31 verifies empty diff.

## D2 trigger judgment

Per ADR-0007 D2 row mapping for B1a (verified at PLAN time per
the locked Wave 4 plan v0.2.1 Amendment Driver 1 final paragraph
"B1a D2 trigger: Row 4 (ADR-0012 amendment) HIT + Row 1
(apps/site/CONTRACT.md path-prose stale-note removal) HIT →
stage 4 PRE-COMMIT CLAUDE REVIEW fires"):

- **Row 1 (CONTRACT.md change)**: **HIT.** B1a edits
  `apps/site/CONTRACT.md` lines 17-21 (stale-note paragraph
  removal + replacement with a single-sentence factual statement).
  Per the ADR-0011 D2 v0.1.1 trigger description, **any** modification
  to a CONTRACT.md file fires Row 1 — the change does not need to
  be a structural invariant edit. Plan-challenger C7 NOT-ABSORBED-as-stated
  verdict (archived at `docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt`)
  confirms: "Row 1 fires on any apps/site/CONTRACT.md change
  including path-prose stale-note removal, not solely Option B-2
  wholesale rewrite". TC21 evidence verifies the diff envelope.
- **Row 2 (package add / remove)**: **NO.** B1a adds zero new
  workspace packages; the new `apps/site/src/lib/word-level-match.ts`
  module is internal to the existing `@skb/site` package + the
  new test file extends the existing `apps/site/src/__tests__/`
  vitest corpus. No `package.json` edit; no `pnpm-lock.yaml`
  delta (TC29 verifies).
- **Row 3 (cross-cutting refactor)**: **NO.** B1a is doc amendment
  + small new utility + new tests + bookkeeping; no existing
  files refactored.
- **Row 4 (new ADR required)**: **HIT** (interpreted per Wave 4
  plan A8 § lines 302-303 + Pre-A3 plan-challenger Q5 absorbtion
  precedent: "promoting existing ADR is not 'new ADR creation';
  tracking via ADR's own Amendments section"). However, per the
  same Pre-A3 absorbtion precedent, **substantive Amendments**
  (ones that add a new policy / mitigation pointer / criterion
  prose update — not just a status flip) DO fire Row 4 because
  they constitute a **rev** of the decision document's effective
  scope. ADR-0012 v0.1.1 adds: (a) post-finding ratification
  prose, (b) criterion 4 mitigation path lock (path (b) custom
  query parser; rejects path (a) waive), (c) cross-reference
  to mitigation surface (B1a utility + B1b integration). This
  is broader than a pure status flip and is treated as Row 4
  HIT per the locked Wave 4 plan v0.2.1 Amendment Driver 1
  paragraph. (Contrast: A8's ADR-0014 v0.2.1 was a status flip
  + post-implementation review pointer with NO new policy /
  mitigation prose, which was treated as Row 4 NO per the A8
  PR.md `## D2 trigger judgment` Row 4 rationale.)
- **Row 5 (cross >= 3 packages)**: **NO.** B1a modifies files
  inside `apps/site/` (CONTRACT.md + new utility + new test) +
  `docs/decisions/` (ADR-0012) + `docs/plans/` (active.md +
  PR.md self-list). Cross-package scope is **1** (`apps/site`
  only); ADR + plan edits are documentation, not package-cutting.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** The new
  utility lives in a new directory `apps/site/src/lib/`; this
  is the first occupant. NO sibling-divergent pattern (no
  `apps/site/src/utils/` or `apps/site/src/helpers/` exists
  already to create a naming-divergence gap). The directory
  name `lib/` follows the pnpm/Node convention for utility
  modules + matches `packages/*/src/lib/` precedent in the
  workspace (verified via `find apps packages -type d -name lib
  | head -5`).
- **Row 7 (legacy doc resurrection)**: **NO.** ADR-0012 was
  ratified at D1b (2026-05-01) and is the current Wave 3+
  search index ADR; v0.1.1 is forward-progress (capturing a
  post-acceptance finding), not resurrection.
- **Row 8 (CI / build / deploy / auth / security)**: **NO.**
  B1a touches no `.github/workflows/`, no `Dockerfile`, no
  auth-related code paths, no security-related code paths. The
  new utility is a pure string-segmentation function with no
  network / I/O / crypto surface.

→ **Row 1 HIT + Row 4 HIT → D1 stage 4 PRE-COMMIT CLAUDE REVIEW
FIRES.** Per ADR-0011 D1 D2 row mapping, either Row 1 OR Row 4
fires stage 4; both HIT here. Pipeline: PLAN → EXECUTE → REVIEW
(codex-pr-reviewer-55) → PRE-COMMIT CLAUDE REVIEW (orchestrator
self) → COMMIT (reviewer codex per ADR-0006 D8) → ACCEPT
(pr-writer second invocation per ADR-0011 D1 stage 6).

## acceptance

1. **ADR-0012 status field unchanged at `accepted`**: line 5 of
   `docs/decisions/ADR-0012-search-index-stack.md` continues to
   read `| 状态 | accepted |` (B1a is Amendment, not status flip).
   TC18 evidence (positive grep for `accepted` count = 1 + zero
   grep for `proposed`).

2. **ADR-0012 path-prose alignment (Edit A) applied**: 5
   occurrences of `_pagefind/` in main prose at lines 37, 45, 46,
   76, 86 are replaced with `pagefind/` (semantic contract
   unchanged; pagefind 1.5+ live build path). TC17(a) evidence
   (`grep -c '_pagefind/' docs/decisions/ADR-0012-search-index-stack.md`
   returns `0`); TC17(b) evidence (`grep -c 'pagefind/'` returns
   ≥ 5).

3. **ADR-0012 Amendments § v0.1.1 entry added (Edit B)**: a new
   `## Amendments` section appended after the existing
   `## Compliance` section logs the v0.1.1 amendment with date
   (2026-05-03), Wave 4 Stage B B1a authority cross-reference
   (Wave 4 plan v0.2.1 Amendment Driver 1 + memory
   `feedback_pagefind_query_substring.md` + ADR-0013 D3),
   substring-fallback narrative, criterion 4 mitigation path
   lock (path (b), NOT path (a)), apps/site mitigation surface
   pointer (B1a utility + B1b integration), and the 4-bullet
   cross-references list. TC19 evidence (`## Amendments` header +
   `v0.1.1` token + `Wave 4 Stage B B1a` token).

4. **ADR-0012 file size below ESLint warn target**: post-edit
   file ≤ 200 LOC (PLAN-time projection ~189 LOC; safe). TC20
   evidence.

5. **`apps/site/CONTRACT.md` lines 17-21 stale-note removed +
   factual statement substituted**: post-edit `_pagefind` count
   ≤ 1 (only the variable name `current_dist_pagefind_bytes` at
   line 43 remains; the stale-note paragraph is gone); the
   factual statement (`aligned to the current dist/pagefind/ path
   ... at v0.1.1 amendment 2026-05-03`) is present. TC21
   evidence.

6. **`apps/site/src/lib/word-level-match.ts` exists** and exports
   `isWordLevelMatch(query: string, content: string, locale?: string): boolean`
   built on `Intl.Segmenter` `granularity: 'word'` with
   locale-aware policy + JSDoc explaining the policy + cite
   plan-challenger C3 verdict + cite ADR-0012 v0.1.1 + memory
   `feedback_pagefind_query_substring.md`. ~70 LOC total. TC22
   evidence.

7. **`apps/site/src/__tests__/word-level-match.test.ts` exists**
   with 12 test cases matching the TC1-TC12 corpus above; runs
   12/12 PASS under `pnpm test --filter=@skb/site -- word-level-match`.
   TC13 evidence (suite present + green).

8. **apps/site typecheck + lint clean** with the new utility +
   test file. `Intl.Segmenter` types resolve via TypeScript
   `lib.es2022.intl` (default `tsconfig.json` lib in apps/site;
   verified PLAN-time the Wave 3 D2 build already uses ES2022+).
   TC14 + TC15 evidence.

9. **apps/site build clean** with the new utility module
   (currently consumed by no Astro component, so it should NOT
   appear in any client bundle). TC16 evidence.

10. **`docs/plans/active.md` Stage B re-plan + ✅ flip
    bookkeeping applied**: lines 31-32 mandatory-scope rows
    flipped from ⏳ to ✅ (B1a closes the ADR-0012 amendment +
    path-prose alignment carry-overs); A8 row backfilled
    (`#TBD (this) | TBD` → `#38 | 4aeb279`); NEW B1a row added.
    TC23 evidence.

11. **Wave 4 plan doc `## Amendments § v0.2.1` present + complete**:
    the v0.2.1 Amendment authored PLAN-time (~150 LOC) covers
    Driver 1 (B1 split per plan-challenger C6+C10) + Driver 2
    (B7 NEW heavy block Astro hydration wiring) + re-locked
    Stage B sequence table (8 PRs) + plan-challenger audit
    cross-reference. TC24 evidence.

12. **link-check (lychee) clean**: all cross-references in the
    v0.1.1 Amendments § + new factual statement in CONTRACT.md
    + active.md ✅ flips + PR.md self-references resolve. Per
    memory `feedback_lychee_line_anchor.md` no `:line` suffix
    on relative file links; per `feedback_lychee_user_local_paths.md`
    no `~/.claude/...` links; per `feedback_lychee_npmjs_403.md`
    no `npmjs.com/package/...` links. TC25 evidence.

13. **`pnpm size-check` workspace-wide clean**: no source file
    exceeds 500 LOC hard cap. Utility ~70 LOC + test ~80 LOC +
    ADR ~189 LOC; all well below. TC26 evidence.

14. **`pnpm check` exit 0 globally** — workspace-wide regression
    baseline. B1a's doc + small utility + tests is additive; no
    existing test breaks. TC27 evidence.

15. **Stage B re-plan record (active.md + plan doc Amendment +
    ADR-0012 v0.1.1 Amendment + utility + tests + CONTRACT
    tightening + plan-challenger + R1 + R2 audit archives) ships in
    the SAME commit** per ADR-0006 D8 explicit-file-list staging
    discipline. Reviewer codex commits 10 files (the 10 in `## files`)
    in a single explicit list:
    `git reset HEAD` → `git add docs/decisions/ADR-0012-search-index-stack.md
    apps/site/CONTRACT.md apps/site/src/lib/word-level-match.ts
    apps/site/src/__tests__/word-level-match.test.ts
    docs/plans/active.md
    docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md
    docs/plans/wave-4-main/B1a-adr-0012-amendment.md
    docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt
    docs/audits/codex-runs/2026-05-03-B1a-pr-reviewer-55.txt
    docs/audits/codex-runs/2026-05-03-B1a-pr-reviewer-55-r2.txt` →
    `git diff --cached --stat` verify (10 files; lockfile NOT in
    staging) → `git commit`. Per memory
    `feedback_git_operator_explicit_stage.md` lockfile-scope
    discipline: lockfile MUST be byte-unchanged (TC29 pre-commit
    verifies).

16. **NO `apps/site/src/components/SearchBox.astro` change** (B1b
    deferred-from-B1 per plan-challenger C10 + Wave 4 plan v0.2.1
    Driver 1 split rationale). TC34 evidence (empty diff).

17. **NO `apps/site/playwright/search.spec.ts` change** (B1b
    scope; B1b restores inverse assertion + renames the test from
    "positive-only" to "paired discriminator" per plan-challenger
    C5+C11 absorbtion). TC34 evidence.

18. **NO `apps/site/src/__tests__/search-cjk.test.ts` change**
    (B1b scope; B1b updates source comments per plan-challenger
    C11 absorbtion to align with the production runtime path
    after Option B-4 hybrid mitigation lands). TC34 evidence.

19. **NO heavy-block / 5-block / 3-light-block package changes**
    (B7 + B2-B5 + B6 scope; B1a is doc + util + bookkeeping only).
    TC30 evidence (empty diff across `packages/`).

20. **NO ADR-0014 / ADR-0011 / ADR-0006 / ADR-0007 / ADR-0008 /
    ADR-0013 change** (A8 + Pre-A1+Pre-A2+Pre-A3 closed those;
    B7 will touch ADR-0014 v0.3 separately). TC31 evidence.

21. **PR.md self-listed in `## files`** per ADR-0006 D8 strict
    whitelist + Pre-A1+Pre-A2+Pre-A3+A1+A2+A3+A4+A5+A6+A7+A8
    precedent. TC28 evidence.

22. **Codex review iterations expected**: R1 + 0-1 forward-fix.
    Typical risk classes for B1a:
    (a) the v0.1.1 Amendments § prose structure — reviewer may
    request tighter cross-references or a clearer split between
    "ratification" + "criterion 4 update" + "path-prose alignment"
    sub-bullets; orchestrator-self iterates within the bounded
    ~70 LOC envelope;
    (b) the locale auto-detection policy in
    `word-level-match.ts` — reviewer may request additional
    locale fixtures (e.g., `'ja'`, `'ko'`) in the test corpus;
    PLAN-time decision is "12-case corpus is sufficient for B1a;
    additional locales deferred to Stage C user-iteration if
    surfaced"; if reviewer pushes back, orchestrator-self adds
    1-2 cases within the ~80 LOC test envelope;
    (c) the `apps/site/CONTRACT.md` factual-statement wording —
    reviewer may request a different prose form; orchestrator-self
    iterates within the bounded 1-line replacement envelope.

23. **Pre-commit Claude review (D1 stage 4) walks the diff** per
    Row 1 + Row 4 HIT trigger. Stage 4 review focuses on:
    (i) ADR-0012 path-prose substitutions are exactly 5 (no
    accidental over-flip — line 43 variable name `current_dist_pagefind_bytes`
    in CONTRACT.md MUST stay intact);
    (ii) ADR-0012 v0.1.1 Amendments § cross-references are correct
    (memory + ADR-0013 D3 + Wave 4 plan v0.2.1 + this PR.md +
    NOT a B1b PR.md placeholder link that lychee would fail on);
    (iii) `word-level-match.ts` JSDoc cite ADR-0012 v0.1.1 by
    section (`## Amendments § v0.1.1`) not by line number (per
    memory `feedback_lychee_line_anchor.md`);
    (iv) the 7-file commit list matches `## files` (no scope
    creep; ADR-0006 D8 explicit-file-list staging).

## Plan-challenger absorbtion (locked at PLAN time)

Per ADR-0011 D2 v0.1.1 R13 + Wave 4 plan v0.2.1 Amendment Driver 1
final paragraphs: the 2026-05-03 B1 plan-challenger codex run
(raw at `/tmp/codex-runs/2026-05-03-B1-plan-challenge.txt`;
truncated archive at
[`docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt`](../../audits/codex-runs/2026-05-03-B1-plan-challenge.txt))
surfaced 11 challenges (10 base + 1 plan-challenger-surfaced).
B1a absorbs the verdicts as follows:

| # | Challenge | Verdict | B1a impact |
|---|---|---|---|
| C1 | SearchBox integration option (B-1 wholesale rewrite vs B-2 vs B-3 vs B-4 hybrid) | **ABSORBED**: Option B-4 hybrid most viable | NOT B1a scope (B1b ships the integration). B1a's utility is the underlying word-level filter B-4 will consume. |
| C2 | Native PagefindUI full-result filtering | **NOT ABSORBED-as-stated**: verified PagefindUI source `process_result` mutates payload only, never `results` array | NOT B1a scope (B1b chooses DOM hide path informed by this verdict). |
| C3 | Single zh-Hans locale too narrow | **NOT ABSORBED**: locale-aware policy + mixed-content fixtures required | **B1a folds this**: utility's locale-aware policy (auto-detect CJK vs ASCII vs mixed; explicit param overrides) + 12-case corpus (CJK / mixed / ASCII / punctuation / edge / case / explicit-locale). |
| C4 | Count-fix for PagefindUI count-stale | **ABSORBED conditionally**: count-fix MANDATORY for B1b | NOT B1a scope (B1b ships the count-fix MutationObserver). |
| C5 | Test surface (unit + playwright) sufficiency | **ABSORBED-with-additions**: assert visible-output correctness too | NOT B1a scope as inverse-assertion-restore (B1b). B1a's 12-case unit corpus is the underlying word-level test surface. |
| C6 | B1 combined exceeds ≤200 LOC ADR-0011 D2 target | **NOT ABSORBED-as-combined**: split B1a + B1b | **TRIGGERED THE B1 SPLIT.** B1a is the doc-only + util-only half; B1b is the SearchBox integration half. |
| C7 | Row 1 D2 trigger interpretation | **NOT ABSORBED-as-stated**: Row 1 fires on any apps/site/CONTRACT.md change including path-prose stale-note removal | **B1a folds this**: `## D2 trigger judgment` Row 1 HIT verdict above; stage 4 PRE-COMMIT CLAUDE REVIEW fires. |
| C8 | A11y CONTRACT update if Option B-2 chosen | **ABSORBED**: B-4 chosen → no a11y CONTRACT touch | NOT B1a scope. |
| C9 | Risk register expansion | **ABSORBED**: B1b will document; B1a has small risk surface | **B1a folds this**: `## Risk register` section below documents the small B1a-specific risks (Intl.Segmenter locale gap; ADR cross-ref fragility; Stage B re-plan timing). |
| C10 | Split B1a doc-only + B1b code-integration | **ABSORBED**: cleaner sequencing | **TRIGGERED THE B1 SPLIT.** Same as C6. |
| C11 | Align source comments in `search-cjk.test.ts` + `search.spec.ts` to production runtime path | **ABSORBED**: deferred to B1b (those files don't change in B1a) | NOT B1a scope. |

## Risk register (B1a-specific)

Per plan-challenger C9 ABSORBED + Wave 4 plan v0.2.1 Amendment risk
discipline. B1a's risk surface is small (doc + small utility + tests
+ bookkeeping); the larger production-integration risk surface is
B1b. Three B1a-specific risks documented:

1. **`Intl.Segmenter` locale gap (Japanese ja / Korean ko / other
   non-CJK-non-ASCII scripts)**: the utility's auto-detect policy
   handles CJK Unified Ideograph (`\p{Script=Han}`) + ASCII +
   mixed cases. Pure Hiragana / Katakana / Hangul content is
   currently auto-detected as ASCII (no Han codepoint), which
   would route to `'en'` segmenter and produce sub-optimal
   segmentation for those languages. **Mitigation**: explicit
   `locale` param honors any BCP-47 tag (B1b's SearchBox
   integration can pass per-note frontmatter language hints if
   future Stage C user-iteration adds non-CJK-non-ASCII content).
   B1a corpus does NOT cover ja / ko cases — deferred to Stage C
   user-iteration if surfaced. Acceptable risk per the doc-flavored
   B1a scope.

2. **ADR amendment cross-reference fragility (lychee)**: the
   v0.1.1 Amendments § cites memory `feedback_pagefind_query_substring.md`
   (a tilde-path under `~/.claude/projects/...` per memory store).
   Per memory `feedback_lychee_user_local_paths.md` lychee fails
   on `~/.claude/...` markdown links. **Mitigation**: cite the
   memory **by name** in prose (e.g., "memory
   `feedback_pagefind_query_substring.md`") inside backticks, NOT
   as a markdown link. ADR-0013 D3 + Wave 4 plan v0.2.1 cross-references
   use repo-relative paths. TC25 (lychee link-check) validates
   pre-commit. EXECUTE-time pre-commit verifies `pnpm link-check`
   exit 0 before reviewer codex commits.

3. **Stage B re-plan timing (this Amendment ships INSIDE B1a same
   commit per acceptance bullet 15)**: if reviewer flags scope-creep
   concern (Wave 4 plan v0.2.1 Amendment is plan-bookkeeping, not
   directly tied to ADR-0012 amendment), alternative is splitting
   plan-amendment into a separate "Pre-B1a" bookkeeping PR.
   **Decision**: keep bundled per Stage A pattern (each PR updates
   `active.md` inside; Wave 4 plan v0.2.1 Amendment was authored
   PLAN-time before pr-writer dispatch and is **part of B1a's
   PLAN-time bookkeeping context**, not a runtime-derived prose).
   Plan-challenger C9 ABSORBED verdict supports the bundled
   approach. Reviewer pushback would trigger PR re-scope (separate
   Pre-B1a bookkeeping PR), but PLAN-time projection is bundled
   ships clean.

## executor

Per Wave 4 plan v0.2.1 Amendment Driver 1 final row (B1a executor
= orchestrator-self) + ADR-0011 D1 pipeline:

- **PLAN**: pr-writer Claude subagent (you, this dispatch). Output
  this PR.md at `docs/plans/wave-4-main/B1a-adr-0012-amendment.md`.
  SendMessage orchestrator on completion; orchestrator iterates
  0-2 rounds before lock.

- **EXECUTE**: **orchestrator-self** (doc-flavored ADR amendment
  + small utility + tests; matches Pre-A2 doc-only ADR-0014
  design-lock + A8 v0.2.1 Amendment precedent). NOT
  codex-generic-executor — the doc-policy language (criterion 4
  mitigation path lock + apps/site mitigation surface narrative)
  needs Claude reasoning depth and the utility is small enough
  to bundle. Standard ADR-0011 D1 stage 5 reviewer-codex-commit
  applies; orchestrator-self does EXECUTE only.

  TDD-front order: B1a.A test file FIRST (12-case TC1-TC12) →
  B1a.B utility body (make suite green via `pnpm test
  --filter=@skb/site -- word-level-match`) → B1a.C typecheck +
  lint + build verify → B1a.D ADR-0012 Edit A (5 path-prose
  flips) → B1a.E ADR-0012 Edit B (Amendments §) → B1a.F
  apps/site/CONTRACT.md stale-note replacement → B1a.G
  docs/plans/active.md A8 backfill + B1a row + ✅ flips →
  B1a.H verify Wave 4 plan v0.2.1 Amendment present (TC24) →
  B1a.I `pnpm link-check` + `pnpm check` workspace-wide before
  reviewer codex commits.

- **REVIEW (D1 stage 3)**: `codex-pr-reviewer-55` (`--yolo
  --profile codex-pr-reviewer-55`). ADR-0006 8-point checklist
  + ADR-0006 D8 explicit-file-list staging mandatory. Reviewer
  reads ADR-0012 at HEAD (not via PR.md excerpt) per memory
  `feedback_pr_reviewer_authority_at_head`.

- **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)**: **FORMALLY
  MANDATORY** per `## D2 trigger judgment` (Row 1 + Row 4 HIT).
  Orchestrator-self focus: (i) Edit A exactly 5 substitutions
  (no over-flip on line 43 variable name); (ii) Amendments §
  cross-references resolve (lychee pre-check); (iii) JSDoc
  cite-by-section (no `:line` suffix; backtick memory paths);
  (iv) commit list matches `## files` (no scope creep).

- **COMMIT (D1 stage 5)**: reviewer codex commits via Pre-A1
  4-step `git reset HEAD` → `git add <list>` → `git diff
  --cached --stat` verify → `git commit` (memory
  `feedback_git_operator_explicit_stage`). Lockfile MUST be
  byte-unchanged (TC29 pre-commit).

- **ACCEPT (D1 stage 6)**: pr-writer second invocation walks
  the 23 acceptance bullets against the actual diff; residue
  list returned to orchestrator for B1b PLAN seed.

- **POST-MERGE**: `gh pr merge --squash --delete-branch` per
  Wave 3 auto-merge authorization (memory `feedback_wave3_auto_merge`);
  B1a row `#TBD | TBD` backfilled at next PR (B1b) per
  one-row-per-PR cadence.

## Out of scope (deferred)

Stage B remaining 7 PRs deferred per Wave 4 plan v0.2.1 Amendment
Driver 1+2 + plan-challenger C1+C2+C4+C5+C8+C11 verdicts (canonical
roster + per-PR scope authoritative in
[`docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
`## Amendments § v0.2.1` table):

- **B1b** (Stage B PR #2): SearchBox.astro Option B-4 hybrid +
  search.spec.ts inverse assertion restore + search-cjk.test.ts
  source comment refresh + risk register expansion.
- **B2** (PR #3): sample-blocks Wave 3 cleanup (4 binary sample-assets
  + intro prose).
- **B3** (PR #4): `content/notes/__test_cjk__` relocation.
- **B4** (PR #5): Stage A retro items 2-4 (cast / UIDefault / ESLint).
- **B5** (PR #6): codex profile prefix R3 + lychee autolink memory codify.
- **B7** (PR #7; NEW per Driver 2): heavy block Astro hydration
  wiring + ADR-0014 v0.3 amendment (CRITICAL gap; MVP-blocking
  visual disaster).
- **B6** (PR #8): Wave 4 close-ceremony preparation.
- **C-stage**: open-ended Phase 1 user-iteration scope per gatekeeper
  directive #4 + MVP framework.

**B1a explicitly does NOT touch** (also enforced by TC30, TC31,
TC32, TC33, TC34 diff guards):
`apps/site/src/components/SearchBox.astro` (B1b);
`apps/site/playwright/search.spec.ts` (B1b);
`apps/site/src/__tests__/search-cjk.test.ts` (B1b);
`apps/site/astro.config.mjs` (no chunking change; utility
consumed only by B1b's client-side SearchBox script);
`packages/heavy-block-boundary/**` (A4-locked; B7 touches via
ADR-0014 v0.3); the 8 block packages (byte-unchanged from A7);
`agent-contract.md` / `CLAUDE.md` / `docs/runbooks/codex-tool-invocations.md`.

## Related

- [ADR-0011 D1 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — pipeline framework + D2 trigger row mapping
- [ADR-0012 search index stack](../../decisions/ADR-0012-search-index-stack.md) — amendment target (this PR ships v0.1.1)
- [ADR-0013 Wave 3 close](../../decisions/ADR-0013-wave-3-close.md) — D3 deferred items source (ADR-0012 amendment listed as Wave 4 carry-over)
- [ADR-0014 HeavyBlockBoundary wrapper](../../decisions/ADR-0014-heavy-block-boundary.md) — Wave 4 Stage A architectural ADR (promoted at A8; B7 will ship v0.3 amendment)
- [Wave 4 plan v0.2.1 Amendment](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — Stage B re-plan record + B1a/B1b split rationale + B7 NEW driver
- [docs/plans/active.md](../active.md) — Wave 4 PR roster + Stage B 8-PR re-locked sequence + mandatory-scope status
- [Pre-A2 PR.md](Pre-A2-adr-0014-heavy-block-boundary.md) — doc-only ADR design-lock precedent (orchestrator-self EXECUTE)
- [A8 PR.md](A8-perf-chunking-adr-0014-promote.md) — same-PR ADR Amendments § precedent (v0.2.1)
- [D1b PR.md](../wave-3-main/D1b-adr-0012-search-index-stack.md) — original ADR-0012 ratification PR
- [D3 PR.md](../wave-3-main/D3-search-index-ui.md) — Wave 3 SearchBox UI shipping (the file B1b will modify)
- 2026-05-03 B1 plan-challenger codex run — archived at [`docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt`](../../audits/codex-runs/2026-05-03-B1-plan-challenge.txt) (11 challenges; absorbtion verdicts captured in `## Plan-challenger absorbtion` above + Wave 4 plan v0.2.1 Driver 1)
- memory `feedback_pagefind_query_substring.md` — Wave 3 D3 incident 2026-05-01 source (the runtime substring fallback this Amendment ratifies)
- memory `feedback_lychee_line_anchor.md` + `feedback_lychee_user_local_paths.md` + `feedback_lychee_npmjs_403.md` — lychee discipline applied to Amendments § cross-references
- memory `feedback_soted_pr_md_discipline.md` — SOTed-PR.md authoring discipline (single-source-of-truth + cross-section reference + TDD-front + memory-cited)
- memory `feedback_git_operator_explicit_stage.md` — ADR-0006 D8 explicit-file-list staging discipline (4-step commit protocol + lockfile scope check)
- memory `feedback_pr_reviewer_authority_at_head.md` — reviewer reads authority types at HEAD before overruling codex
