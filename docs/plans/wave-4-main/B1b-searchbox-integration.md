# B1b — SearchBox integration (Option B-4 hybrid + count-fix MutationObserver) + paired-discriminator playwright restore

> **Wave 4 Stage B SECOND implementation PR** of the re-locked 8-PR
> sequence (B1a → B1b → B2 → B3 → B4 → B5 → B7 → B6; see Wave 4
> plan v0.2.1 Amendment Driver 1). Code-flavored: SearchBox.astro
> consumes the B1a-shipped `isWordLevelMatch` utility via PagefindUI
> `processTerm` + `processResult` callbacks + a DOM `MutationObserver`
> that hides substring-only-match results AND patches PagefindUI's
> stale `searchResult.results.length`-driven count display. Restores
> Wave 3 D3 inverse assertion (`'记本'` MUST NOT match `'笔记本电脑'`)
> as a runtime-correctness gate now that the app-side discriminator
> is in place; renames the existing positive-only test to
> "paired discriminator" + adds a count-correctness assertion.
> Aligns inline comments in `search-cjk.test.ts` per plan-challenger
> C11 to point at B1b as the runtime discriminator owner. **NO
> `apps/site/src/lib/word-level-match.ts` change** (B1a-shipped;
> consumed read-only). Standard ADR-0011 D1 pipeline; **PRE-COMMIT
> CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger judgment`
> below (Row 1 HIT — `apps/site/CONTRACT.md` UI-surface clause
> extension). Out of scope: see `## Out of scope (deferred)` (delegates
> to Wave 4 plan v0.2.1 roster).

## title

Wire `isWordLevelMatch` (B1a) into `apps/site/src/components/SearchBox.astro`
via `@pagefind/default-ui` `processTerm` + `processResult` callbacks
+ a `MutationObserver` on `#search .pagefind-ui__results` that
applies a `[data-skb-word-level-mismatch="true"]` attribute (CSS
`display: none`) to substring-only-match `<li>` ancestors AND
recomputes the `<.pagefind-ui__message>`-driven result-count display
to reflect VISIBLE rather than raw-result count (PagefindUI 1.5.2
`processResult` mutates payload only and CANNOT remove items from
`searchResult.results` — verified via plan-challenger C2 source-read
verdict, hence DOM-level hide + count fix-up). Restore Wave 3 D3
inverse assertion in `apps/site/playwright/search.spec.ts` (rename
`CJK indexing — positive query (...)` → `CJK indexing — paired
discriminator (ADR-0012 v0.1.1; word-level filter restored via
isWordLevelMatch)`; add inverse `'记本'` query assertion that visible
result texts do NOT contain `'笔记本电脑'`; add count-correctness
assertion that `.pagefind-ui__message` text matches the count of
`<li>` without `[data-skb-word-level-mismatch="true"]`); align inline
comment block in `apps/site/src/__tests__/search-cjk.test.ts` SCOPE
NOTE to point at B1b SearchBox integration as the runtime
discriminator owner (NO test logic change; D2 structural gate
unchanged); extend `apps/site/CONTRACT.md` `## Search index` UI-surface
clause to codify the word-level wrapper while explicitly preserving
the `@pagefind/default-ui`-default a11y guarantee (Row 1 HIT path —
RECOMMENDED YES per pr-writer briefing). Bookkeep
`docs/plans/active.md` (B1a row backfill `#TBD (this) | TBD` → `#39 |
1aa2811` + new B1b row). PR.md self-listed per ADR-0006 D8
strict-whitelist + Pre-A1 → A8 + B1a precedent.

## files

6 files (canonical count; codex-generic-executor EXECUTE for code +
tests + CONTRACT extension + bookkeeping; plan-challenger codex audit
archive shipped in B1a is NOT re-shipped — B1b inherits the 11
verdicts via cross-reference; reviewer + R1+ codex audit archives
land at COMMIT time per ADR-0006 D8 + A1 / B1a precedent and ARE
listed below as 7th/8th/etc slots when generated). NO `package.json`
/ `pnpm-lock.yaml` change (no new deps; PagefindUI 1.5.2 already
pinned; `Intl.Segmenter` consumed via existing utility). NO
`apps/site/astro.config.mjs` change (no chunking change — the new
DOM hookup logic is inline in SearchBox.astro's existing `<script>`
tag and ships in the existing search-route bundle). NO
`apps/site/src/lib/word-level-match.ts` change (B1a-shipped read-only).
PR.md self-listed per Pre-A2+A1+A2+A3+A4+A5+A6+A7+A8+B1a precedent.

- `apps/site/src/components/SearchBox.astro` — **MODIFIED**
  (~120 LOC delta; current 8 LOC → ~128 LOC post-edit). Current
  state verified PLAN-time via `Read`:

  ```astro
  <link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
  <div id="search" class="skb-search"></div>

  <script>
    import { PagefindUI } from '@pagefind/default-ui';

    new PagefindUI({ element: '#search', baseUrl: '/', resetStyles: false });
  </script>
  ```

  Post-B1b structure (final body authored EXECUTE-time per
  TDD-front: write playwright spec FIRST → run + observe red →
  implement SearchBox integration → run + observe green):

  - **Stylesheet `<link>` line stays byte-unchanged** (line 1).
  - **Mount `<div id="search">` stays byte-unchanged** (line 2).
  - **NEW `<style>` block** (~3 LOC) at top OR bottom of file
    (executor-discretion; precedent `BaseLayout.astro` puts inline
    styles at bottom). Body:
    ```css
    [data-skb-word-level-mismatch="true"] {
      display: none;
    }
    ```
    Astro scopes `<style>` per component by default; the attribute
    selector is global-flavored (no class hash collision risk because
    the attribute namespace `data-skb-*` is project-local). PLAN-time
    decision: **use `<style is:global>`** to guarantee the rule
    applies to PagefindUI's runtime-rendered `<li>` elements which
    Astro scoping does NOT see at build time. TC1 (build artifact
    grep) verifies the inline rule survives to `dist/`.
  - **Extended `<script>` block** (~115 LOC delta from 4 LOC
    current). Implementation contract:

    ```typescript
    import { PagefindUI } from '@pagefind/default-ui';
    import { isWordLevelMatch } from '../lib/word-level-match';

    // Sentinel attribute applied to <li> ancestors of substring-only
    // matches; CSS rule above hides them. Per plan-challenger C2
    // NOT-ABSORBED-as-stated: PagefindUI 1.5.2 processResult mutates
    // result payload but CANNOT remove items from
    // searchResult.results — DOM-level hide is the only viable path.
    const MISMATCH_ATTR = 'data-skb-word-level-mismatch';
    const SENTINEL_CLASS = 'skb-word-level-mismatch-marker';

    new PagefindUI({
      element: '#search',
      baseUrl: '/',
      resetStyles: false,
      processTerm: (term) => term.trim().toLowerCase(),
      processResult: (result) => {
        // result.excerpt is HTML-with-<mark>; query the unmarked
        // content from result.meta.title + result.excerpt stripped.
        // result.sub_results may be undefined on top-level result.
        const term = window.__skbLastSearchTerm ?? '';
        if (!term) return result;
        const haystack = stripHtml(result.excerpt) + ' ' + (result.meta?.title ?? '');
        if (!isWordLevelMatch(term, haystack)) {
          // Inject a hidden marker the DOM observer reads; PagefindUI
          // emits result.excerpt as innerHTML on the <li> .pagefind-ui__result-excerpt.
          result.excerpt = result.excerpt + `<span class="${SENTINEL_CLASS}" hidden></span>`;
        }
        return result;
      },
    });

    // processTerm runs on every keystroke; capture the live term so
    // processResult can read it (PagefindUI does NOT pass the term
    // into processResult per 1.5.2 source).
    const searchInput = document.querySelector('#search input[type="text"], #search input[type="search"]');
    if (searchInput instanceof HTMLInputElement) {
      searchInput.addEventListener('input', () => {
        window.__skbLastSearchTerm = searchInput.value.trim().toLowerCase();
      });
    }

    // MutationObserver: watch result list additions; on each <li>
    // append, check for the sentinel marker and apply the
    // mismatch attribute + recompute the visible-count display.
    const resultsRoot = document.querySelector('#search');
    if (resultsRoot) {
      const observer = new MutationObserver((mutations) => {
        let touched = false;
        for (const m of mutations) {
          for (const node of Array.from(m.addedNodes)) {
            if (node instanceof HTMLElement) {
              const lis = node.matches('li.pagefind-ui__result')
                ? [node]
                : Array.from(node.querySelectorAll<HTMLElement>('li.pagefind-ui__result'));
              for (const li of lis) {
                if (li.querySelector(`.${SENTINEL_CLASS}`)) {
                  li.setAttribute(MISMATCH_ATTR, 'true');
                  touched = true;
                }
              }
            }
          }
        }
        if (touched) scheduleCountFixup();
      });
      observer.observe(resultsRoot, { subtree: true, childList: true });
    }

    // requestAnimationFrame-debounced count fix-up so rapid mutations
    // coalesce into one DOM read+write pass per frame (per
    // plan-challenger C9 risk #2 async/debounce re-render races).
    let rafId: number | null = null;
    function scheduleCountFixup() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const message = document.querySelector('#search .pagefind-ui__message');
        const allLis = document.querySelectorAll('#search li.pagefind-ui__result');
        const visibleLis = document.querySelectorAll(
          `#search li.pagefind-ui__result:not([${MISMATCH_ATTR}="true"])`,
        );
        if (message && allLis.length > 0) {
          // Format follows PagefindUI's "Showing N results for "term""
          // pattern; preserve the existing trailing-clause structure
          // by replacing only the leading number.
          const visible = visibleLis.length;
          const total = allLis.length;
          const original = message.textContent ?? '';
          // Replace the first integer in the message with `${visible}/${total}`.
          message.textContent = original.replace(/\d+/, `${visible}/${total}`);
        }
      });
    }

    function stripHtml(html: string): string {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent ?? '';
    }

    // Type augmentation for window storage of the live search term.
    declare global {
      interface Window {
        __skbLastSearchTerm?: string;
      }
    }
    ```

    Notes for executor:

    (a) **`isWordLevelMatch` import path** is relative
    `../lib/word-level-match` (Astro `<script>` blocks transpile via
    Vite + resolve relative to the .astro file's parent dir; verified
    against existing patterns in the workspace). NO `.ts` extension
    in import per repo TS config.

    (b) **PagefindUI source check (verify EXECUTE-time)**: open
    `node_modules/.pnpm/@pagefind+default-ui@1.5.2/.../ui-core.js`
    + grep for `processResult` + `searchResult.results.length` to
    confirm the per-result mutation contract + count-display element
    selector. Plan-challenger C2 verdict cited PagefindUI 1.5.2
    `process_result` mutates payload only — re-verify before
    writing the implementation; if PagefindUI ships a different
    count-display selector than `.pagefind-ui__message`, update the
    implementation accordingly + record the actual selector in
    JSDoc + acceptance bullet 3 + TC5.

    (c) **`window.__skbLastSearchTerm` global pattern**: PagefindUI
    1.5.2's `processResult(result)` signature does NOT pass the
    live search term as an argument. Capturing via input `'input'`
    event listener + window-scoped global is the simplest viable
    bridge. Risk: race between input event firing and processResult
    invocation (a sub-frame stale read could let one query's results
    leak through with a previous term's filter). Mitigation:
    `processTerm` callback (also passed to PagefindUI constructor)
    runs synchronously BEFORE PagefindUI's debounced search, so
    we additionally write `__skbLastSearchTerm` inside `processTerm`
    for an extra synchronization point. Plan-challenger C9 risk #2
    is the documented async race; the dual-write pattern is the
    mitigation.

    (d) **HTML stripping** uses `document.createElement('div')` +
    `innerHTML` + `textContent`. This is the standard browser-side
    approach + does NOT execute scripts (innerHTML on a detached
    `<div>` element does not execute embedded `<script>`).

    (e) **`<style is:global>` choice**: Astro scopes `<style>` by
    default via class hashing; PagefindUI's runtime-rendered `<li>`
    elements do NOT carry the scope hash. `is:global` ensures the
    `[data-skb-word-level-mismatch="true"] { display: none; }` rule
    applies to PagefindUI's DOM. This is the single global rule
    introduced by B1b — narrowly scoped to the project-local
    attribute namespace `data-skb-*` (no risk of style bleed
    beyond search results).

    (f) **Per-result performance budget**: `isWordLevelMatch`
    runs O(n_segments(haystack)) per result × n_results per query.
    For typical 10-result page × ~200 char excerpt = ~50 segments
    per result × 10 results = ~500 segmenter ops per query.
    `Intl.Segmenter` is C++-backed in V8; per-segment cost is sub-µs.
    Total per query well under 10ms even on slow hardware. Plan-
    challenger C9 risk #4 documents this; perf-auditor flag-only
    mitigation (no proactive optimization).

    (g) **`searchInput` query-selector duplication**: the playwright
    spec uses `'#search input[type="text"], #search input[type="search"]'`;
    SearchBox.astro must use the SAME selector to ensure the input
    event listener attaches to the actual PagefindUI input. PagefindUI
    1.5.2 emits `<input class="pagefind-ui__search-input" ...>`
    without an explicit `type="search"` (verified PLAN-time against
    existing search.spec.ts a11y test that uses the dual selector).
    Implementation must defer the selector lookup until PagefindUI
    has rendered (use `MutationObserver` on `#search` for input
    appearance, OR a polling fallback, OR `setTimeout(..., 0)` after
    PagefindUI constructor — executor decides). PLAN-time
    recommendation: **observe `#search` for input element appearance
    via the same MutationObserver instance** (DRY) OR use a
    secondary `IntersectionObserver` / `setTimeout(0)` to hook the
    input after PagefindUI's synchronous mount. Final approach
    decided EXECUTE-time; TC2 (input listener wired) verifies via
    playwright `page.keyboard.press('Tab') → pressSequentially('记本')`
    sequence triggering the filter.

  Total post-edit file size ~128 LOC; well below 200 LOC ESLint
  warn target; safe.

- `apps/site/playwright/search.spec.ts` — **MODIFIED** (~60 LOC
  delta; current 73 LOC → ~133 LOC post-edit). Three edits:

  **Edit A (test rename + inverse assertion restore + comment block
  rewrite)**: at line 48, the existing test
  `'CJK indexing — positive query (ADR-0012 criterion 4 partial; runtime D3 finding amends inverse)'`
  becomes
  `'CJK indexing — paired discriminator (ADR-0012 v0.1.1; word-level filter restored via isWordLevelMatch)'`.
  The inline comment block (lines 49-64; 14 lines of "D3 runtime
  CI revealed... Wave 4 may amend ADR-0012 criterion 4..." narrative)
  is rewritten to ~10 lines pointing at:
  - ADR-0012 v0.1.1 amendment (B1a; HEAD `1aa2811`).
  - `apps/site/src/lib/word-level-match.ts` as the app-side
    discriminator (B1a-shipped, B1b-consumed).
  - SearchBox.astro Option B-4 hybrid integration (this PR; cite
    plan-challenger C1 ABSORBED via verdict path).
  - The paired discriminator (positive `'笔记'` matches
    `'中文笔记测试'` AND inverse `'记本'` does NOT match
    `'笔记本电脑'`) is now enforced as a RUNTIME discriminator
    via the SearchBox word-level filter.

  Body keeps the existing positive assertion (lines 65-72; pageGoto +
  focus + pressSequentially `'笔记'` + expect.poll
  `.toContain('中文笔记测试')`); ADDS a SECOND poll with inverse:

  ```typescript
  // Inverse assertion (restored): query '记本' must NOT surface
  // the '笔记本电脑' fragment now that the word-level filter
  // (apps/site/src/lib/word-level-match.ts) hides substring-only
  // matches in SearchBox.astro.
  await searchInput.fill('');
  await searchInput.pressSequentially('记本');
  await expect
    .poll(async () => (await visibleResultTexts(page)).join('\n'), { timeout: 10_000 })
    .not.toContain('笔记本电脑');
  ```

  The `searchInput.fill('')` clears between queries; PLAN-time
  verification via `@playwright/test` 1.49+ docs confirms `fill('')`
  is the recommended clear pattern for input elements with
  `pressSequentially` precedent.

  **Edit B (NEW count-correctness assertion TC5)**: appended after
  Edit A's inverse assertion within the same `test()` block:

  ```typescript
  // TC5 count-display correctness: PagefindUI's <.pagefind-ui__message>
  // is driven by searchResult.results.length and stays stale under
  // CSS-only hide. SearchBox.astro's MutationObserver re-derives
  // the visible count and replaces the leading integer with
  // `${visible}/${total}`. Assert the visible count matches the
  // count of <li> without [data-skb-word-level-mismatch="true"].
  const visibleCount = await page.locator(
    '#search li.pagefind-ui__result:not([data-skb-word-level-mismatch="true"])'
  ).count();
  const totalCount = await page.locator('#search li.pagefind-ui__result').count();
  const messageText = await page.locator('#search .pagefind-ui__message').textContent();
  expect(messageText).toContain(`${visibleCount}/${totalCount}`);
  ```

  **Edit C (NEW helper `visibleResultTexts`)**: replaces the existing
  `resultTexts(page: Page)` helper (lines 34-37) with two helpers:
  the original `resultTexts` retained for the a11y smoke test
  (returns ALL `<li>.pagefind-ui__result` text contents — no filtering)
  + a new `visibleResultTexts(page: Page)` that filters by selector
  `:not([data-skb-word-level-mismatch="true"])`. The a11y smoke
  test (lines 39-46) stays byte-unchanged.

  WSL2 chromium skip pattern at line 17 (`test.skip(isWsl2(), ...)`)
  preserved; PLAN-time decision is to KEEP the WSL2 skip (per memory
  `feedback_wsl2_chromium_launch.md`) since CI runs the playwright
  suite via Linux runners with chromium installed.

- `apps/site/src/__tests__/search-cjk.test.ts` — **MODIFIED** (~10
  LOC delta; current 145 LOC → ~144 LOC post-edit; net -1 LOC). The
  SCOPE NOTE comment block at lines 5-17 is updated to point at B1b's
  SearchBox integration as the runtime discriminator owner (the
  current text "deferred to D3's playwright spec" is stale post-B1b
  + carries the Wave 3 D3 partial-discriminator hedge). New text
  (final prose authored EXECUTE-time):

  ```text
  // SCOPE NOTE (D2; updated Wave 4 Stage B B1b 2026-05-03): this
  // test verifies PageFind successfully indexes CJK content under
  // the temp corpus and emits the canonical 1.5+ artifact set
  // (pagefind-entry.json + at least one .pf_meta + at least one
  // fragment file). The full ADR-0012 criterion 4 word-level vs
  // character-level RUNTIME discriminator (querying '笔记' must
  // match '中文笔记测试' AND '记本' must NOT match '笔记本电脑')
  // is enforced app-side by apps/site/src/lib/word-level-match.ts
  // (Wave 4 B1a) wired into apps/site/src/components/SearchBox.astro
  // (Wave 4 B1b; Option B-4 hybrid PagefindUI processResult
  // callback + DOM MutationObserver). The runtime discriminator
  // assertion lives in apps/site/playwright/search.spec.ts
  // (paired discriminator test) — real browser, real fetch,
  // exercising /search end-to-end. D2's gate here is "PageFind
  // ran on CJK content + emitted index" — strictly weaker than
  // ADR-0012 criterion 4 but the strongest D2 can give without
  // serving the browser stack.
  ```

  Test logic + corpus stay byte-identical. TC8 verifies the `'记本'`
  string still surfaces in the fixture corpus + the 12 vitest
  invocations remain unchanged.

- `apps/site/CONTRACT.md` — **MODIFIED** (~10 LOC net delta;
  current 111 LOC → ~121 LOC post-edit). The `## Search index`
  section's `UI surface:` clause (lines 21-25) is extended to
  codify the word-level wrapper + reaffirm the
  `@pagefind/default-ui`-default a11y guarantee. The
  `A11y guarantee:` clause (lines 26-30) is extended to explicitly
  call out that the word-level wrapper does NOT replace the
  default UI. Edit pattern (final prose authored EXECUTE-time):

  Insert after the existing `UI surface:` paragraph (lines 21-25)
  and BEFORE the `A11y guarantee:` paragraph (line 26):

  > - Word-level result filter: `apps/site/src/lib/word-level-match.ts`
  >   exposes `isWordLevelMatch(query, content, locale?)`; SearchBox.astro
  >   wires it via `@pagefind/default-ui` `processTerm` + `processResult`
  >   callbacks + a `MutationObserver` that applies
  >   `[data-skb-word-level-mismatch="true"]` to substring-only-match
  >   `<li>` ancestors (CSS `display: none`) and patches the
  >   `<.pagefind-ui__message>` count display. This restores the
  >   ADR-0012 v0.1.1 criterion 4 paired discriminator at runtime;
  >   PagefindUI's index-time tokenization is unchanged.

  Append to the existing `A11y guarantee:` paragraph (line 30, after
  "must not replace those defaults with a custom UI..."):

  > The B1b word-level wrapper is post-render result filtering only
  > (DOM `data-*` attribute + CSS `display: none`); it does not
  > replace any `@pagefind/default-ui` ARIA, keyboard, or screen-
  > reader behavior. Hidden mismatched results are removed from the
  > visible result count via `<.pagefind-ui__message>` text
  > replacement so screen readers do not announce stale totals.

  All other prose in `apps/site/CONTRACT.md` stays byte-unchanged
  (lines 1-20 + 31-end). TC4 verifies the diff envelope.

  PLAN-time decision: **YES extend** (Row 1 HIT path; per pr-writer
  briefing recommendation + plan-challenger C7 absorbtion at B1a).
  Rationale: codifying the word-level wrapper in the contract
  prevents future regressions where a downstream agent might
  remove the wrapper assuming PagefindUI handles word-level
  matching natively. The a11y clause extension explicitly states
  the wrapper does not replace default UI behavior — protecting
  the existing a11y invariant.

- `docs/plans/active.md` — **MODIFIED** (~5 LOC delta). Three small
  edits:

  - **B1a row backfill**: existing `| #TBD (this) | TBD | B1a | ADR-0012 v0.1.1 amendment ...`
    row → `| #39 | 1aa2811 | B1a | ADR-0012 v0.1.1 amendment ...`
    (the squash HEAD `1aa2811` is verified live HEAD of `main` per
    pr-writer briefing; PR #39 per Stage B sequencing).
  - **NEW B1b row**: append after B1a row + before Stage A summary
    row: `| #TBD (this) | TBD | B1b | SearchBox integration (Option B-4 hybrid) + paired-discriminator playwright restore |`
    (backfilled at NEXT PR per the one-row-per-PR cadence).
  - **NO mandatory-scope ✅ flips**: B1a already flipped lines
    31-32 (ADR-0012 amendment + path-prose alignment). B1b is the
    integration follow-up that consumes B1a's deliverables; the
    mandatory-scope rows are already CLOSED. No additional flip
    is required. TC9 verifies the lines 31-32 stay byte-unchanged.

- `docs/plans/wave-4-main/B1b-searchbox-integration.md` — **NEW**
  (this PR.md, self-listed per ADR-0006 D8 + Pre-A1+Pre-A2+Pre-A3+A1+A2+A3+A4+A5+A6+A7+A8+B1a
  precedent; pr-writer must include the PR.md in the canonical
  `## files` list at PLAN time). ~750 LOC final (PR.md exempt from
  the 200 LOC target per ADR-0011 D2 v0.1.1 + memory
  `feedback_soted_pr_md_discipline`; comparable to A1-A8 PR.md sizes
  range 468-1687 LOC + B1a's 971 LOC).

**Codex audit archives shipped at COMMIT-time** — per B1a precedent
(squash `1aa2811`) which set the new pattern of committing audit
archives, B1b commits **10 files total**: 5 modified + 1 PR.md +
4 audit archives:
- `docs/audits/codex-runs/2026-05-03-B1b-execute.txt` (B1b stage 2
  codex-generic-executor archive; head -2000 truncate of raw /tmp log
  per ADR-0011 D6 universal Bash invariant R7-mitigation flow)
- `docs/audits/codex-runs/2026-05-03-B1b-pr-reviewer-55.txt` (B1b
  stage 3 R1 reviewer archive; PASS verdict 0 issues clear stage 4)
- `docs/audits/codex-runs/2026-05-03-B1a-accept.txt` (B1a stage 6
  ACCEPT pr-writer second-invocation verdict archive; orphan
  artifact from B1a stage 6 that was generated post-commit and is
  back-filled here per the ship-when-natural convention)
- `docs/audits/codex-runs/2026-05-03-B1a-commit.txt` (B1a stage 5
  commit archive; same orphan-back-fill rationale)
PLAN-time projected 6 canonical + COMMIT-time +4 audit archives = 10
final. Reviewer R2 (if dispatched) would extend to 11; PLAN-time
projection assumes R1 PASS clears stage 3 cleanly (no R2 dispatch).

## test_cases

B1b ships 0 NEW vitest unit suites (per plan-challenger C5
ABSORBED-with-additions: PagefindUI callback layer is hard to
mock without spinning up real PagefindUI; playwright covers the
behavior contract) + 3 NEW playwright assertions inside the
existing renamed `'CJK indexing — paired discriminator'` test
+ 1 SCOPE NOTE comment update in `search-cjk.test.ts` (NO test
logic change) + 1 CONTRACT.md UI-surface extension + bookkeeping
+ this PR.md self-listed. TDD-front discipline (per ADR-0011 D1
stage 2 + memory `feedback_soted_pr_md_discipline`): **write
the playwright spec FIRST** (TC4 + TC5 + TC6) → run and observe
RED (inverse assertion fails because SearchBox doesn't filter
yet) → write SearchBox.astro processResult callback + DOM
observer + count fix-up → run and observe GREEN (visibly hidden
substring-only result + count display matches visible count) →
run `pnpm test --filter=@skb/site` clean → run `pnpm typecheck
--filter=@skb/site` clean → run `pnpm lint --filter=@skb/site`
clean → apply CONTRACT + active.md + search-cjk.test.ts comment
edits → run `pnpm link-check` clean → run `pnpm check`
workspace-wide clean.

Test triplets (input → expected → location):

- **TC1** (build artifact: SearchBox `<style>` survives) Input:
  `pnpm --filter @skb/site build` then `grep 'data-skb-word-level-mismatch'
  apps/site/dist/search/index.html` (or any HTML that embeds
  SearchBox). Expected: ≥ 1 match (the inline `<style is:global>`
  rule survives Astro's compile to the static HTML output).
  Location: shell at repo root post-build.

- **TC2** (SearchBox import: `isWordLevelMatch` wired) Input:
  `grep -c "from '../lib/word-level-match'" apps/site/src/components/SearchBox.astro`.
  Expected: ≥ 1. Location: shell at repo root.

- **TC3** (SearchBox structure: PagefindUI options + observer present)
  Input: 3 grep checks against `apps/site/src/components/SearchBox.astro`:
  (a) `grep -c 'processTerm' ...` ≥ 1; (b) `grep -c 'processResult' ...`
  ≥ 1; (c) `grep -c 'MutationObserver' ...` ≥ 1; (d) `grep -c
  'requestAnimationFrame' ...` ≥ 1. Expected: 4/4 ≥ 1. Location:
  shell at repo root.

- **TC4** (playwright positive — RETAINED from Wave 3 D3) Input:
  search input pressSequentially `'笔记'` on `/search` route,
  await visible result list, poll `resultTexts(page).join('\n')`
  for `'中文笔记测试'`. Expected: contains `'中文笔记测试'`.
  Location: `apps/site/playwright/search.spec.ts` per
  `test('CJK indexing — paired discriminator (ADR-0012 v0.1.1; word-level filter restored via isWordLevelMatch)', ...)`.

- **TC5** (playwright inverse — RESTORED Wave 3 D3 removal; ADR-0012
  v0.1.1 criterion 4 runtime discriminator) Input: search input
  fill `''` then pressSequentially `'记本'` on `/search` route,
  await visible result list (empty or non-`笔记本电脑`-bearing),
  poll `visibleResultTexts(page).join('\n')` for absence of
  `'笔记本电脑'`. Expected: does NOT contain `'笔记本电脑'`.
  Location: same playwright file, same renamed test body.

- **TC6** (playwright count-display correctness — NEW per
  plan-challenger C5 ABSORBED-with-additions) Input: after the
  TC5 `'记本'` query settles, count `<li>.pagefind-ui__result`
  total + `<li>.pagefind-ui__result:not([data-skb-word-level-mismatch="true"])`
  visible; read `<.pagefind-ui__message>` textContent. Expected:
  message text contains `${visibleCount}/${totalCount}` (e.g.,
  `0/1` or `0/2`). Location: same playwright file, same renamed
  test body. PLAN-time fallback if PagefindUI ships a different
  count-display selector than `.pagefind-ui__message`: EXECUTE-time
  verify selector against `node_modules/.pnpm/@pagefind+default-ui@1.5.2/.../ui-core.js`
  + update both implementation + assertion accordingly + record
  in TC6 expected text.

- **TC7** (playwright a11y smoke — RETAINED byte-unchanged from
  Wave 3 D3) Input: pressSequentially `'callout'` on `/search`
  route via Tab-focused input, await visible result list. Expected:
  first `<li>.pagefind-ui__result` visible (existing a11y assertion
  unchanged; verifies the wrapper preserves keyboard navigation
  + ARIA result emission). Location: same playwright file per
  `test('a11y smoke', ...)` (existing test).

Verification regression baselines (no new tests; grep + diff envelope;
all `Location: shell at repo root` unless noted):

- **TC8** (`search-cjk.test.ts` SCOPE NOTE prose updated): (a)
  `grep -c 'Wave 4 Stage B B1b' apps/site/src/__tests__/search-cjk.test.ts`
  → ≥ 1; (b) `grep -c 'deferred to D3' ...` → `0` (stale text
  removed); (c) `grep -c 'apps/site/src/lib/word-level-match.ts' ...`
  → ≥ 1; (d) `grep -c 'word-level discriminator' ...` → ≥ 1.
- **TC9** (`docs/plans/active.md` B1a row backfilled + B1b row
  added + lines 31-32 byte-unchanged): (a) `grep -c '#39.*1aa2811.*B1a'
  docs/plans/active.md` → ≥ 1; (b) `grep -c '| B1b |' ...` → ≥ 1;
  (c) `grep -c '✅ ADR-0012 amendment' ...` → ≥ 1 (B1a-flipped
  unchanged); (d) `grep -c '✅ Path-prose alignment' ...` → ≥ 1
  (B1a-flipped unchanged).
- **TC10** (`apps/site/CONTRACT.md` UI-surface clause extended): (a)
  `grep -c 'Word-level result filter' apps/site/CONTRACT.md` → ≥ 1;
  (b) `grep -c 'isWordLevelMatch' apps/site/CONTRACT.md` → ≥ 1;
  (c) `grep -c 'data-skb-word-level-mismatch' apps/site/CONTRACT.md`
  → ≥ 1; (d) `grep -c 'must not replace those defaults' ...` → ≥ 1
  (a11y clause unchanged); (e) `grep -c 'B1b word-level wrapper is
  post-render' ...` → ≥ 1 (a11y clause extension).
- **TC11** apps/site test suite regression: `pnpm --filter @skb/site
  test` → exit 0; existing 10 corpora (`components-map / dims-source /
  fouc-script / lazy-chunking / sample-blocks-page /
  sample-blocks-astro-page / search-cjk / search-reindex /
  search-ui / word-level-match`) PASS unchanged.
- **TC12** apps/site typecheck clean: `pnpm typecheck --filter
  @skb/site` → exit 0. The new SearchBox.astro `<script>` block uses
  ES2022+ features (optional chaining + nullish coalescing) +
  declares `Window.__skbLastSearchTerm?: string` via `declare global`.
  Verify TS resolves the augmentation.
- **TC13** apps/site lint clean: `pnpm lint --filter @skb/site` →
  exit 0; no `max-lines` warning on `SearchBox.astro` (~128 LOC <
  200).
- **TC14** apps/site build clean: `pnpm --filter @skb/site build`
  → exit 0. The new utility consumption is bundled into the
  search-route chunk; lazy-chunking.test.ts MUST still PASS (no
  pyodide/tensorflow/reactflow leakage; the search route is a
  light route).
- **TC15** size-check: `pnpm size-check` → exit 0 (no source file
  > 500 LOC; SearchBox ~128 LOC; playwright spec ~133 LOC).
- **TC16** lychee link-check: `pnpm link-check` → exit 0. Per
  memory `feedback_lychee_line_anchor` no `:line` suffix; per
  `feedback_lychee_user_local_paths` no `~/.claude/...` links;
  per `feedback_lychee_npmjs_403` cite npm via GitHub repo URL only.
- **TC17** workspace-wide regression: `pnpm check` → exit 0 (lint
  + typecheck + test + build + size-check all PASS).
- **TC18** PR.md self-listed: `grep -c 'B1b-searchbox-integration.md'
  docs/plans/wave-4-main/B1b-searchbox-integration.md` → ≥ 2.
- **TC19** lockfile + package.json byte-unchanged: `git diff main
  -- pnpm-lock.yaml apps/site/package.json` → empty diff (B1b
  adds NO deps; PagefindUI 1.5.2 already pinned at Wave 3 D3).
- **TC20** ADR-0012 byte-unchanged: `git diff main --
  docs/decisions/ADR-0012-search-index-stack.md` → empty diff
  (B1a-shipped at HEAD `1aa2811`; B1b consumes only).
- **TC21** word-level-match.ts + test byte-unchanged: `git diff
  main -- apps/site/src/lib/word-level-match.ts apps/site/src/__tests__/word-level-match.test.ts`
  → empty diff (B1a-shipped; B1b consumes read-only).
- **TC22** heavy-block-boundary + 8 block packages byte-unchanged:
  `git diff main -- packages/heavy-block-boundary/ packages/block-callout/
  packages/block-code/ packages/block-image/ packages/block-math/
  packages/block-pdf/ packages/block-jupyter/ packages/block-nn-viz/
  packages/block-agent-flow/` → empty diff.
- **TC23** other 13 ADR files + README byte-unchanged: `git diff
  main -- docs/decisions/ADR-{0001,0002,0003,0004,0005,0006,0007,0008,0009,0010,0011,0013,0014}*.md
  docs/decisions/README.md` → empty diff (B1b touches no ADR).
- **TC24** prior wave-4-main PR.md files byte-unchanged: `git diff
  main -- docs/plans/wave-4-main/{A1,A2,A3,A4,A5,A6,A7,A8,Pre-A1,Pre-A2,Pre-A3,B1a}-*.md`
  → empty diff (only the new B1b PR.md is added).
- **TC25** agent-contract / CLAUDE / runbook byte-unchanged: `git
  diff main -- agent-contract.md CLAUDE.md
  docs/runbooks/codex-tool-invocations.md` → empty diff.
- **TC26** B7-scope files byte-unchanged: `git diff main --
  apps/site/src/components.ts packages/block-jupyter/
  packages/block-nn-viz/ packages/block-agent-flow/` → empty diff
  (B7 scope; B1b is search-only).
- **TC27** astro.config.mjs byte-unchanged: `git diff main --
  apps/site/astro.config.mjs` → empty diff (no chunking change;
  the new logic ships in the existing search-route bundle).
- **TC28** `search-ui.test.ts` byte-unchanged unless EXECUTE-time
  finds the new inline `<style>` block alters the dist HTML in a
  way that breaks existing assertions. PLAN-time projection: NO
  change required (the existing test asserts `<div id="search"`
  + `pagefind-ui` references + NO `_pagefind/`; B1b adds an inline
  `<style>` block + extended `<script>` but neither breaks any
  existing assertion). If EXECUTE-time finds a breakage, fix the
  test minimally + log in `## acceptance` bullet 22 risk class.
  TC28 (a): `git diff main -- apps/site/src/__tests__/search-ui.test.ts`
  → empty diff (PLAN-time projection).

## contracts_affected

- **`apps/site/CONTRACT.md`** — **EDITED**. The `## Search index`
  section's `UI surface:` clause is extended with a new bullet
  codifying the word-level result filter wrapper (cite
  `apps/site/src/lib/word-level-match.ts` + SearchBox.astro
  integration mechanism + DOM `[data-skb-word-level-mismatch="true"]`
  attribute + count fix-up). The `A11y guarantee:` clause is
  extended with explicit prose stating the wrapper is post-render
  result filtering only (DOM `data-*` + CSS `display: none`) and
  does NOT replace any `@pagefind/default-ui` ARIA / keyboard /
  screen-reader behavior. Rationale: per plan-challenger C7
  absorbtion at B1a, any apps/site/CONTRACT.md change fires Row 1.
  PLAN-time RECOMMEND YES extend (per pr-writer briefing): codifying
  the wrapper prevents future regressions and explicitly preserves
  the existing a11y invariant. TC10 verifies the diff envelope +
  the new prose presence + a11y clause not weakened.
- **No other CONTRACT.md files modified.** B1b does NOT touch any
  `packages/*/CONTRACT.md`. The 8 block packages
  (`packages/block-{callout,code,image,math,pdf,jupyter,nn-viz,agent-flow}/CONTRACT.md`)
  + the heavy-block-boundary package
  (`packages/heavy-block-boundary/CONTRACT.md`) + the other 5
  workspace package CONTRACT.md files all remain byte-unchanged.
  TC22 verifies empty diff across `packages/`.

## adr_touched

- **No ADR files modified.** ADR-0012 was amended at B1a (HEAD
  `1aa2811`); B1b is the integration follow-up that consumes
  the v0.1.1 mitigation surface (`apps/site/src/lib/word-level-match.ts`)
  and ships the SearchBox wiring. The Amendment narrative at
  ADR-0012 v0.1.1 already documents B1b's scope ("B1b (follow-up;
  not this PR) ships SearchBox integration via Option B-4 hybrid
  per plan-challenger C1 absorbtion"); B1b realizes that pointer
  but does NOT re-amend the ADR. TC20 verifies ADR-0012 empty diff.
- ADR-0014 (heavy-block-boundary) remains v0.2.1 from A8 — B7 will
  ship v0.3 amendment for the Astro hydration gap (out of scope for
  B1b). ADR-0011, ADR-0006, ADR-0007, ADR-0008, ADR-0013 + the
  others all stay byte-unchanged. TC23 verifies empty diff.

## D2 trigger judgment

Per ADR-0007 D2 row mapping for B1b (verified at PLAN time per
the locked Wave 4 plan v0.2.1 Amendment Driver 1 final paragraph
"B1b D2 trigger: Row 1 (apps/site/CONTRACT.md UI-surface clause
extension) HIT → stage 4 PRE-COMMIT CLAUDE REVIEW fires"):

- **Row 1 (CONTRACT.md change)**: **HIT.** B1b extends
  `apps/site/CONTRACT.md` `## Search index` `UI surface:` clause
  with a new word-level filter bullet + extends the `A11y guarantee:`
  clause with explicit no-replacement-of-defaults prose. Per
  plan-challenger C7 absorbtion at B1a, any apps/site/CONTRACT.md
  change including prose extension fires Row 1 — the change does
  not need to be a structural invariant edit. PLAN-time decision
  is YES extend (per pr-writer briefing recommendation +
  forward-looking regression protection). TC10 evidence verifies
  the diff envelope.
- **Row 2 (package add / remove)**: **NO.** B1b adds zero new
  workspace packages; the SearchBox.astro modification is internal
  to the existing `@skb/site` package. No `package.json` edit; no
  `pnpm-lock.yaml` delta (TC19 verifies).
- **Row 3 (cross-cutting refactor)**: **NO.** B1b is single-file
  code change (SearchBox.astro) + single-file test change
  (search.spec.ts) + single-file comment refresh (search-cjk.test.ts)
  + small CONTRACT.md extension + bookkeeping; no existing files
  refactored at scale.
- **Row 4 (new ADR required)**: **NO.** B1b realizes the B1a v0.1.1
  Amendment's mitigation surface pointer; the ADR was amended
  at B1a, not B1b. Per the Pre-A3 plan-challenger Q5 absorbtion
  precedent: realizing an ADR amendment's mitigation pointer is
  NOT a "new ADR creation" or "ADR rev"; it is the ratified
  implementation. TC20 verifies ADR-0012 byte-unchanged.
- **Row 5 (cross >= 3 packages)**: **NO.** B1b modifies files
  inside `apps/site/` (SearchBox.astro + playwright spec +
  search-cjk.test.ts comment + CONTRACT.md) + `docs/plans/`
  (active.md + this PR.md). Cross-package scope is **1**
  (`apps/site` only); plan + PR.md edits are documentation, not
  package-cutting.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** SearchBox.astro
  is a single component file; the `processResult` callback
  pattern is the conventional `@pagefind/default-ui` extension
  pattern (per `@pagefind/default-ui` README).
- **Row 7 (legacy doc resurrection)**: **NO.** `apps/site/CONTRACT.md`
  is the current Wave 3+ contract for `@skb/site`; the UI-surface
  extension is forward-progress (capturing the B1a-shipped
  mitigation surface in the contract), not resurrection.
- **Row 8 (CI / build / deploy / auth / security)**: **NO.** B1b
  touches no `.github/workflows/`, no `Dockerfile`, no auth-related
  code paths, no security-related code paths. The DOM observer +
  CSS `display: none` is a pure UI surface change with no network
  / I/O / crypto exposure (the `stripHtml` helper uses detached
  `<div>.innerHTML` which does NOT execute embedded scripts per
  DOM spec).

→ **Row 1 HIT → D1 stage 4 PRE-COMMIT CLAUDE REVIEW FIRES.** Per
ADR-0011 D1 D2 row mapping, Row 1 alone fires stage 4. Pipeline:
PLAN → EXECUTE → REVIEW (codex-pr-reviewer-55) → PRE-COMMIT CLAUDE
REVIEW (orchestrator self) → COMMIT (reviewer codex per ADR-0006
D8) → ACCEPT (pr-writer second invocation per ADR-0011 D1 stage 6).

## acceptance

1. **`apps/site/src/components/SearchBox.astro` imports `isWordLevelMatch`**
   from `'../lib/word-level-match'` — TC2 evidence
   (`grep -c "from '../lib/word-level-match'" ...` ≥ 1).

2. **SearchBox.astro registers PagefindUI with `processTerm` +
   `processResult` callbacks** — TC3(a) + TC3(b) evidence
   (each grep ≥ 1).

3. **SearchBox.astro embeds a `MutationObserver` on the result list
   with `requestAnimationFrame`-debounced count-fixup** — TC3(c)
   + TC3(d) evidence (each grep ≥ 1). The observer applies
   `[data-skb-word-level-mismatch="true"]` to substring-only-match
   `<li>` ancestors and re-derives the visible count for the
   `<.pagefind-ui__message>` text (selector verified EXECUTE-time
   against PagefindUI 1.5.2 source; if different, executor updates
   the implementation + this acceptance bullet's selector reference).

4. **SearchBox.astro embeds an inline `<style is:global>` rule
   `[data-skb-word-level-mismatch="true"] { display: none; }`** —
   TC1 evidence (post-build HTML grep ≥ 1; the rule survives
   Astro's compile to dist).

5. **`apps/site/playwright/search.spec.ts` test renamed to
   "paired discriminator"** — verify via:
   - `grep -c 'paired discriminator' apps/site/playwright/search.spec.ts`
     → ≥ 1.
   - `grep -c 'positive query (ADR-0012 criterion 4 partial' ...`
     → `0` (old name removed).
   - `grep -c 'ADR-0012 v0.1.1' ...` → ≥ 1.

6. **Inverse assertion present**: `'记本'` query → visible results
   do NOT contain `'笔记本电脑'` — TC5 evidence (playwright assertion
   `expect.poll(...).not.toContain('笔记本电脑')` present in the
   renamed test body; pressSequentially `'记本'` in same `test()`).

7. **Count-display correctness assertion present (TC6)**: after
   `'记本'` query, `<.pagefind-ui__message>` text contains the
   string `${visibleCount}/${totalCount}` where `visibleCount`
   counts `<li>.pagefind-ui__result:not([data-skb-word-level-mismatch="true"])`
   and `totalCount` counts `<li>.pagefind-ui__result` — TC6
   evidence (assertion present in the renamed test body).

8. **`apps/site/src/__tests__/search-cjk.test.ts` SCOPE NOTE
   comment block updated** with no test logic / corpus change —
   TC8 evidence ((a) `Wave 4 Stage B B1b` token present; (b)
   stale `deferred to D3` text removed; (c) `apps/site/src/lib/word-level-match.ts`
   reference present; (d) `word-level discriminator` token
   present). The 12 vitest invocations + temp-corpus fixture +
   PageFind CLI invocation + artifact-set assertions stay
   byte-identical.

9. **`apps/site/CONTRACT.md` UI-surface clause extended** with the
   word-level filter bullet (cite `apps/site/src/lib/word-level-match.ts`
   + DOM mechanism + count fix-up) AND the A11y guarantee clause
   extended with explicit no-replacement-of-defaults prose — TC10
   evidence ((a) `Word-level result filter` present; (b)
   `isWordLevelMatch` present; (c) `data-skb-word-level-mismatch`
   present; (d) existing `must not replace those defaults` clause
   stays present — a11y not weakened; (e) `B1b word-level wrapper
   is post-render` extension present).

10. **`pnpm test --filter=@skb/site` PASS** — no regression in 10
    existing test files (`components-map / dims-source /
    fouc-script / lazy-chunking / sample-blocks-page /
    sample-blocks-astro-page / search-cjk / search-reindex /
    search-ui / word-level-match`). TC11 evidence.

11. **`pnpm typecheck --filter=@skb/site` clean** — `Window.__skbLastSearchTerm?: string`
    augmentation resolves; PagefindUI options + callback types resolve
    via `@pagefind/default-ui` exports. TC12 evidence.

12. **`pnpm lint --filter=@skb/site` clean** — no `max-lines`
    warning on SearchBox.astro (~128 LOC < 200) or playwright spec
    (~133 LOC < 200). TC13 evidence.

13. **`pnpm check` workspace-wide PASS** — lint + typecheck + test
    + build + size-check all green. TC17 evidence.

14. **`pnpm link-check` clean** (lychee canonical). TC16 evidence.
    Per memory `feedback_lychee_line_anchor` no `:line` suffix;
    per `feedback_lychee_user_local_paths` no `~/.claude/...`
    links; per `feedback_lychee_npmjs_403` cite npm via GitHub
    repo URL only.

15. **CI playwright workflow GREEN** — paired-discriminator test
    runs in CI (real chromium via Linux GitHub-Actions runner; the
    WSL2 skip in `search.spec.ts` line 17 is local-dev-only per
    memory `feedback_wsl2_chromium_launch.md`). The 3 NEW
    playwright assertions (TC4 retained + TC5 inverse + TC6 count)
    PASS. The existing a11y smoke test (TC7) PASSES byte-unchanged.

16. **lockfile + `apps/site/package.json` byte-unchanged** — B1b
    adds NO deps. TC19 evidence (empty diff).

17. **PR.md self-listed in `## files`** per ADR-0006 D8 strict
    whitelist + Pre-A1+Pre-A2+Pre-A3+A1+A2+A3+A4+A5+A6+A7+A8+B1a
    precedent. TC18 evidence (`grep -c 'B1b-searchbox-integration.md'
    docs/plans/wave-4-main/B1b-searchbox-integration.md` ≥ 2).

18. **NO scope creep beyond canonical file whitelist** — only the
    6 files in `## files` are touched. TC22, TC23, TC24, TC25,
    TC26, TC27 verify byte-unchanged across `packages/`, other
    ADRs, prior wave-4-main PR.md files, agent-contract /
    CLAUDE / runbook, B7-scope files, and astro.config.mjs.

19. **NO touch to B7-scope files** (`apps/site/src/components.ts`,
    `packages/block-jupyter/`, `packages/block-nn-viz/`,
    `packages/block-agent-flow/`). TC26 evidence (empty diff).

20. **NO touch to B1a-shipped utility** (`apps/site/src/lib/word-level-match.ts`,
    `apps/site/src/__tests__/word-level-match.test.ts`). B1b
    consumes the B1a-shipped utility read-only. TC21 evidence
    (empty diff).

21. **`docs/plans/active.md` B1a row backfilled (`#TBD (this) | TBD`
    → `#39 | 1aa2811`) + new B1b row added; lines 31-32 (mandatory-
    scope ✅ flips) byte-unchanged** (B1a closed those; B1b is
    integration follow-up not requiring new flip). TC9 evidence.

22. **Codex review iterations expected**: R1 + 0-1 forward-fix.
    Typical risk classes for B1b:
    (a) PagefindUI internal selector drift (PagefindUI 1.5.2
    `<.pagefind-ui__message>` count-display selector verified
    EXECUTE-time against `node_modules/.pnpm/@pagefind+default-ui@1.5.2/.../ui-core.js`;
    if 1.6+ ships a different selector, executor adjusts the
    implementation + acceptance bullet 3 + TC6); reviewer may
    push back if the actual selector differs from PLAN-time
    projection;
    (b) `window.__skbLastSearchTerm` global pattern — reviewer
    may flag the global as a code smell; PLAN-time projection
    is "narrowly-scoped project-local global with `declare global`
    typed augmentation; the dual-write pattern (input event +
    processTerm callback) is the documented mitigation for
    plan-challenger C9 risk #2 async race; alternative is a
    closure-based bridge but PagefindUI's processResult signature
    forces the global-or-closure choice"; if reviewer pushes back,
    orchestrator can refactor to closure capture inside the
    PagefindUI constructor's options object;
    (c) `<style is:global>` choice — reviewer may suggest scoped
    `<style>` instead; PLAN-time rationale is "PagefindUI's
    runtime-rendered `<li>` elements do not carry Astro's scope
    hash; `is:global` is the only viable choice for the selector
    rule to apply"; if reviewer pushes back, alternative is to
    move the rule to a project-global stylesheet (e.g.,
    `apps/site/src/styles/global.css`) — both achieve the same
    outcome.
    (d) playwright count-correctness assertion — reviewer may
    request additional assertions (e.g., assert the exact
    `${visible}/${total}` ratio for a known fixture); PLAN-time
    decision is "TC6 covers the substring-contains check which is
    the minimum verifiable contract; tighter assertions risk
    flakiness if PagefindUI's debounce timing changes"; if reviewer
    pushes back, orchestrator adds a `await page.waitForTimeout(500)`
    + exact-match assertion within the bounded TC6 envelope.

23. **Pre-commit Claude review (D1 stage 4) walks the diff** per
    Row 1 HIT trigger. Stage 4 review focuses on:
    (i) `apps/site/CONTRACT.md` extension is purely additive (does
    NOT remove any existing prose; the existing `must not replace
    those defaults` clause is preserved + extended);
    (ii) the SearchBox `<script>` block does NOT introduce any
    network fetch / I/O / crypto surface — pure DOM manipulation
    + Intl.Segmenter (via `isWordLevelMatch`) only;
    (iii) the playwright inverse assertion timeout (`{ timeout:
    10_000 }`) matches the existing positive assertion timeout —
    no flakiness regression introduced;
    (iv) the 6-file commit list matches `## files` (no scope
    creep; ADR-0006 D8 explicit-file-list staging);
    (v) the SCOPE NOTE comment update in `search-cjk.test.ts`
    is comment-only — verify no test logic / corpus / fixture
    drift via line-by-line diff of the import block + describe /
    it / expect call sites.

## Plan-challenger absorbtion (B1 archive inherited; B1b-relevant verdicts)

Per ADR-0011 D2 v0.1.1 R13 + Wave 4 plan v0.2.1 Amendment Driver 1
final paragraphs: the 2026-05-03 B1 plan-challenger codex run
(raw at `/tmp/codex-runs/2026-05-03-B1-plan-challenge.txt`;
truncated archive at
[`docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt`](../../audits/codex-runs/2026-05-03-B1-plan-challenge.txt)
shipped at B1a HEAD `1aa2811`) surfaced 11 challenges (10 base + 1
plan-challenger-surfaced). B1a absorbed C3 + C7 + C9 + C6 + C10
directly; B1b absorbs the remaining B1b-relevant verdicts:

| # | Challenge | Verdict | B1b impact |
|---|---|---|---|
| C1 | SearchBox integration option (B-1 wholesale rewrite vs B-2 vs B-3 vs B-4 hybrid) | **ABSORBED**: Option B-4 hybrid most viable | **B1b implements**: SearchBox.astro PagefindUI `processTerm` + `processResult` callbacks + DOM `MutationObserver` + count fix-up. CSS `display: none` via `[data-skb-word-level-mismatch="true"]` attribute. Preserves `@pagefind/default-ui`-default a11y. |
| C2 | Native PagefindUI full-result filtering | **NOT ABSORBED-as-stated**: PagefindUI 1.5.2 `process_result` mutates payload only; CANNOT remove items from `searchResult.results` array | **B1b respects**: implementation uses DOM hide path (sentinel marker injected in `processResult` mutation; observer reads marker + applies attribute). Acceptance bullet 3 + TC3 verify the observer presence. |
| C4 | Count-fix for PagefindUI count-stale | **ABSORBED conditionally**: count-fix MANDATORY for B1b | **B1b implements**: `requestAnimationFrame`-debounced `<.pagefind-ui__message>` text re-derivation (`${visible}/${total}` replace of leading integer). TC6 verifies. |
| C5 | Test surface (unit + playwright) sufficiency | **ABSORBED-with-additions**: assert visible-output correctness too | **B1b implements**: 3 NEW playwright assertions inside the renamed `'paired discriminator'` test (TC4 retained + TC5 inverse + TC6 count-correctness). NO vitest unit suite for SearchBox callbacks (PagefindUI internal `result` shape hard to mock; playwright covers the contract). |
| C8 | A11y CONTRACT update if Option B-2 chosen | **ABSORBED**: B-4 chosen → no a11y CONTRACT touch (decision flipped at B1b) | **B1b RE-EVALUATES**: per pr-writer briefing recommendation, B1b extends apps/site/CONTRACT.md UI-surface clause + A11y guarantee clause to codify the wrapper while preserving a11y invariant. The original C8 verdict assumed minimal CONTRACT touch; B1b's recommendation flip is justified by forward-looking regression protection. |
| C9 | Risk register expansion | **ABSORBED**: B1b documents | **B1b implements**: `## Risk register` section below documents PagefindUI internal markup drift / async race / locale gaps / bundle paint cost. |
| C11 | Align source comments in `search-cjk.test.ts` + `search.spec.ts` to production runtime path | **ABSORBED**: B1b implements | **B1b implements**: SCOPE NOTE in `search-cjk.test.ts` updated to point at B1b SearchBox integration as runtime discriminator owner; `search.spec.ts` test renamed `positive query` → `paired discriminator` + comment block rewritten to cite ADR-0012 v0.1.1 + word-level-match.ts + Option B-4 hybrid. |

Other verdicts (C3 / C6 / C7 / C10) absorbed at B1a; not B1b-relevant
(C3 locale-aware policy + C6/C10 split + C7 Row 1 trigger).

## Risk register (B1b-specific per plan-challenger C9)

Per plan-challenger C9 ABSORBED + Wave 4 plan v0.2.1 Amendment risk
discipline. B1b's risk surface is larger than B1a's (production-
integration code + DOM observer + browser runtime); 4 risks documented:

1. **PagefindUI internal markup drift (PagefindUI 1.5.2 → 1.6+)**:
   the implementation depends on PagefindUI 1.5.2 selectors:
   `.pagefind-ui__results` (result list root), `li.pagefind-ui__result`
   (per-result `<li>`), `.pagefind-ui__message` (count display),
   `.pagefind-ui__search-input` (input). If PagefindUI 1.6+ renames
   any of these, B1b's MutationObserver + observer queries break +
   the count-display assertion fails. **Mitigation**: pin
   `@pagefind/default-ui ^1.5.2` (already pinned in
   `apps/site/package.json`); EXECUTE-time verify selectors against
   `node_modules/.pnpm/@pagefind+default-ui@1.5.2/.../ui-core.js`;
   monitor at `pnpm update`; CI playwright run catches the breakage
   on next dependency rev. Acceptable risk per PagefindUI's
   stable-API commitment in their changelog.

2. **Async race / debounce re-render (rapid consecutive queries)**:
   rapid keystrokes during PagefindUI's debounced search trigger
   multiple `processResult` invocations + multiple MutationObserver
   callbacks. The `window.__skbLastSearchTerm` global may carry a
   stale term value if `processResult` reads it BEFORE the next
   input event fires. **Mitigation**: dual-write the term in BOTH
   the input event listener AND the `processTerm` callback (which
   PagefindUI calls synchronously before the search runs). The
   `requestAnimationFrame` debounce on count fix-up coalesces
   rapid mutations into one frame-aligned read+write pass. TC5 +
   TC6 + TC7 playwright assertions in CI catch any visible race
   regression.

3. **Intl.Segmenter locale gaps (ja / ko / mixed-script content)**:
   B1a's utility's auto-detect policy handles CJK Unified Ideograph
   (`\p{Script=Han}`) + ASCII + mixed cases. Pure Hiragana / Katakana
   / Hangul content is currently auto-detected as ASCII (no Han
   codepoint), routing to `'en'` segmenter and producing sub-optimal
   segmentation for those languages. **Mitigation**: explicit
   `locale` param honors any BCP-47 tag (B1b's SearchBox can pass
   per-note frontmatter language hints if future Stage C user-iteration
   adds non-CJK-non-ASCII content; B1b does NOT add per-note locale
   plumbing — deferred to Stage C user-iteration).

4. **Bundle / paint cost per result**: word-level filter runs
   O(n_segments(haystack)) per result × n_results per query. For
   typical 10-result page × ~200 char excerpt = ~50 segments per
   result × 10 results = ~500 segmenter ops per query.
   `Intl.Segmenter` is C++-backed in V8; per-segment cost is sub-µs;
   total per query well under 10ms even on slow hardware. **Mitigation**:
   profile via Chrome DevTools post-merge; perf-auditor flag-only
   mitigation (no proactive optimization). If perf-auditor flags
   regression in Stage C, optimize via memoization of segmenter
   instances per locale (currently constructed per-result).

## executor

Per Wave 4 plan v0.2.1 Amendment Driver 1 final row (B1b executor
= codex-generic-executor) + ADR-0011 D1 pipeline + ADR-0011 D6 NEW
Wave 3 default executor:

- **PLAN**: pr-writer Claude subagent (you, this dispatch). Output
  this PR.md at `docs/plans/wave-4-main/B1b-searchbox-integration.md`.
  SendMessage orchestrator on completion; orchestrator iterates 0-2
  rounds before lock.

- **EXECUTE**: **`codex-generic-executor`** (per Wave 4 plan v0.2.1
  Driver 1 final row B1b executor mapping). Code-flavored work;
  codex 5.5 + workspace-write sandbox handles SearchBox.astro
  refactor + playwright spec authoring + apps/site/CONTRACT.md
  prose extension + bookkeeping. Orchestrator dispatches via
  `codex exec --yolo --profile generic-executor` per
  [docs/runbooks/codex-tool-invocations.md](../../runbooks/codex-tool-invocations.md)
  Universal Bash invariants (Pre-A1: `set -o pipefail` + `2>&1
  | tee /tmp/codex-runs/<X>.txt` raw + `head -2000 >
  docs/audits/codex-runs/<X>.txt` archive).

  TDD-front order: B1b.A `apps/site/playwright/search.spec.ts`
  Edit A + B + C FIRST (test rename + inverse assertion +
  count-correctness assertion + helper) → B1b.B run playwright
  locally (CI if WSL2 skip applies) and observe RED on TC5
  (inverse fails because SearchBox doesn't filter yet) and TC6
  (count fails because PagefindUI emits stale count) → B1b.C
  SearchBox.astro implementation (style block + script block
  + processTerm + processResult + MutationObserver + count
  fix-up + dual-write term capture) → B1b.D run playwright +
  observe GREEN on TC4 + TC5 + TC6 + TC7 → B1b.E run
  `pnpm test --filter=@skb/site` clean → B1b.F run
  `pnpm typecheck --filter=@skb/site` clean → B1b.G run
  `pnpm lint --filter=@skb/site` clean → B1b.H apply
  `apps/site/CONTRACT.md` extension → B1b.I apply
  `apps/site/src/__tests__/search-cjk.test.ts` SCOPE NOTE update
  → B1b.J apply `docs/plans/active.md` B1a backfill + B1b row
  → B1b.K run `pnpm link-check` clean → B1b.L run `pnpm check`
  workspace-wide before reviewer codex commits.

- **REVIEW (D1 stage 3)**: `codex-pr-reviewer-55` (`--yolo
  --profile codex-pr-reviewer-55`). ADR-0006 8-point checklist
  + ADR-0006 D8 explicit-file-list staging mandatory. Reviewer
  reads `apps/site/CONTRACT.md` + `apps/site/src/lib/word-level-match.ts`
  at HEAD (not via PR.md excerpt) per memory
  `feedback_pr_reviewer_authority_at_head`. Plan-challenger C2
  verdict's PagefindUI source claim should be cross-verified by
  reviewer against `node_modules/.pnpm/@pagefind+default-ui@1.5.2/.../ui-core.js`
  before challenging the implementation's DOM hide approach.

- **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)**: **FORMALLY MANDATORY**
  per `## D2 trigger judgment` (Row 1 HIT). Orchestrator-self
  focus: (i) `apps/site/CONTRACT.md` extension is purely additive
  + a11y clause not weakened; (ii) SearchBox.astro `<script>` has
  NO new network / I/O / crypto surface; (iii) the global
  `window.__skbLastSearchTerm` pattern uses `declare global`
  typed augmentation (no untyped global pollution); (iv) commit
  list matches `## files` (no scope creep).

- **COMMIT (D1 stage 5)**: reviewer codex commits via Pre-A1
  4-step `git reset HEAD` → `git add <list>` → `git diff
  --cached --stat` verify (10 files staged; lockfile NOT in staging) →
  `git commit` (memory `feedback_git_operator_explicit_stage`).
  Lockfile MUST be byte-unchanged (TC19 pre-commit). Explicit
  file list (10 files; 6 canonical + 4 audit archives per B1a
  precedent and `## files` "Codex audit archives shipped at
  COMMIT-time" slot above):
  `git add apps/site/src/components/SearchBox.astro
  apps/site/playwright/search.spec.ts
  apps/site/src/__tests__/search-cjk.test.ts
  apps/site/CONTRACT.md
  docs/plans/active.md
  docs/plans/wave-4-main/B1b-searchbox-integration.md
  docs/audits/codex-runs/2026-05-03-B1b-execute.txt
  docs/audits/codex-runs/2026-05-03-B1b-pr-reviewer-55.txt
  docs/audits/codex-runs/2026-05-03-B1a-accept.txt
  docs/audits/codex-runs/2026-05-03-B1a-commit.txt`

- **ACCEPT (D1 stage 6)**: pr-writer second invocation walks the
  23 acceptance bullets against the actual diff; residue list
  returned to orchestrator for B2 PLAN seed.

- **POST-MERGE**: `gh pr merge --squash --delete-branch` per
  Wave 3 auto-merge authorization (memory
  `feedback_wave3_auto_merge`); B1b row `#TBD | TBD` backfilled
  at next PR (B2) per one-row-per-PR cadence.

## Out of scope (deferred)

Stage B remaining 6 PRs deferred per Wave 4 plan v0.2.1 Amendment
Driver 1+2 + plan-challenger verdicts (canonical roster +
per-PR scope authoritative in
[`docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
`## Amendments § v0.2.1` table):

- **B2** (Stage B PR #3): sample-blocks Wave 3 cleanup (4 binary
  sample-assets + intro prose).
- **B3** (PR #4): `content/notes/__test_cjk__` relocation.
- **B4** (PR #5): Stage A retro items 2-4 (cast / UIDefault / ESLint).
- **B5** (PR #6): codex profile prefix R3 + lychee autolink memory codify.
- **B7** (PR #7; NEW per Driver 2): heavy block Astro hydration
  wiring + ADR-0014 v0.3 amendment (CRITICAL gap; MVP-blocking
  visual disaster).
- **B6** (PR #8): Wave 4 close-ceremony preparation.
- **C-stage**: open-ended Phase 1 user-iteration scope per gatekeeper
  directive #4 + MVP framework. Includes deferred ja / ko locale
  fixtures for `isWordLevelMatch`; per-note frontmatter language
  hint plumbing in SearchBox; perf-auditor profiling of the
  word-level filter under realistic note corpus.

**B1b explicitly does NOT touch** (also enforced by TC20, TC21,
TC22, TC23, TC24, TC25, TC26, TC27 diff guards):
`apps/site/src/lib/word-level-match.ts` (B1a-shipped read-only);
`apps/site/src/__tests__/word-level-match.test.ts` (B1a-shipped read-only);
`docs/decisions/ADR-0012-search-index-stack.md` (B1a-amended at v0.1.1);
`docs/decisions/ADR-0014-heavy-block-boundary.md` (A8-promoted; B7 will touch);
`apps/site/src/components.ts` (B7 scope);
`apps/site/astro.config.mjs` (no chunking change);
`packages/heavy-block-boundary/**` (A4-locked; B7 v0.3 amendment);
the 8 block packages (byte-unchanged from A7);
`agent-contract.md` / `CLAUDE.md` / `docs/runbooks/codex-tool-invocations.md`.

## Related

- [ADR-0011 D1 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — pipeline framework + D2 trigger row mapping
- [ADR-0012 search index stack](../../decisions/ADR-0012-search-index-stack.md) — v0.1.1 Amendment ratifies the runtime word-level discriminator B1b realizes; criterion 4 mitigation surface pointer (B1a utility + B1b integration)
- [ADR-0013 Wave 3 close](../../decisions/ADR-0013-wave-3-close.md) — D3 deferred items source (ADR-0012 amendment listed as Wave 4 carry-over; B1b realizes the integration follow-up)
- [ADR-0014 HeavyBlockBoundary wrapper](../../decisions/ADR-0014-heavy-block-boundary.md) — Wave 4 Stage A architectural ADR (promoted at A8; B7 will ship v0.3 amendment) — out of B1b scope
- [Wave 4 plan v0.2.1 Amendment](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — Stage B re-plan record + B1a/B1b split rationale + Driver 1 B1b executor mapping
- [docs/plans/active.md](../active.md) — Wave 4 PR roster + Stage B 8-PR re-locked sequence + mandatory-scope status
- [B1a PR.md](B1a-adr-0012-amendment.md) — sibling PR; doc + utility + bookkeeping half of the original B1; the integration follow-up is this PR
- [Pre-A2 PR.md](Pre-A2-adr-0014-heavy-block-boundary.md) — doc-only ADR design-lock precedent (orchestrator-self EXECUTE; B1b is code-flavored codex-generic-executor)
- [A4 PR.md](A4-heavy-block-boundary-css-a11y.md) — code + CSS + test + CONTRACT.md pattern at apps/site layer (precedent for B1b's CSS + script + CONTRACT extension pattern)
- [D1b PR.md](../wave-3-main/D1b-adr-0012-search-index-stack.md) — original ADR-0012 ratification PR
- [D3 PR.md](../wave-3-main/D3-search-index-ui.md) — Wave 3 SearchBox UI shipping (the file B1b modifies)
- 2026-05-03 B1 plan-challenger codex run — archived at [`docs/audits/codex-runs/2026-05-03-B1-plan-challenge.txt`](../../audits/codex-runs/2026-05-03-B1-plan-challenge.txt) (11 challenges; B1b inherits C1+C2+C4+C5+C8+C9+C11 verdicts directly relevant to integration scope)
- memory `feedback_pagefind_query_substring.md` — Wave 3 D3 incident 2026-05-01 source (the runtime substring fallback this integration filters)
- memory `feedback_lychee_line_anchor.md` + `feedback_lychee_user_local_paths.md` + `feedback_lychee_npmjs_403.md` — lychee discipline applied to CONTRACT extension cross-references
- memory `feedback_soted_pr_md_discipline.md` — SOTed-PR.md authoring discipline (single-source-of-truth + cross-section reference + TDD-front + memory-cited)
- memory `feedback_git_operator_explicit_stage.md` — ADR-0006 D8 explicit-file-list staging discipline (4-step commit protocol + lockfile scope check)
- memory `feedback_pr_reviewer_authority_at_head.md` — reviewer reads authority types at HEAD before overruling codex
- memory `feedback_wsl2_chromium_launch.md` — WSL2 chromium launch failure mitigation (test.skip(isWsl2()) preserved at search.spec.ts line 17)
- memory `feedback_wave3_auto_merge.md` — `gh pr merge --squash --delete-branch` post-merge convention
