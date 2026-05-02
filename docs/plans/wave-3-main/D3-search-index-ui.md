# D3 — search index UI (Stage D close)

> **Wave 3 Stage D 4th + final PR.** Implements the apps/site search
> UI: SearchBox component + /search route + visual-smoke playwright
> regression. Closes Stage D + Wave 3 spec §4.2 search index
> requirement. Per locked plan D3 entry.

## title

Add `apps/site/src/components/SearchBox.astro` + `apps/site/src/pages/search.astro` consuming the D2-installed PageFind index. Add WSL2-skip playwright a11y smoke test (CI-only). PageFind UI integration via `@pagefind/default-ui` (D3 PLAN choice over hand-roll — minimal LOC, solves keyboard a11y out-of-box).

## files

Created (NEW — 4):

- `apps/site/src/components/SearchBox.astro` — top-of-page search box with PageFind autocomplete. Uses `@pagefind/default-ui` runtime; auto-loads index from `/pagefind/pagefind.js` (pagefind 1.5+ canonical path; the historical `_pagefind/` underscore-prefix was dropped pre-1.5). Includes lazy-load (script with `is:inline` + `defer`) so initial paint isn't blocked. ~50-80 LOC. Fallback "search loading…" string while PageFind UI fetches. **Important**: SearchBox MUST not block SSR rendering — lazy-load via `<script>` defer ensures `/search` HTML emits during `astro build` before `dist/pagefind/` exists (ADR-0012 out-of-scope #C4(a) D3 contract).
- `apps/site/src/pages/search.astro` — dedicated `/search` route with full-page search experience. Layout extends existing apps/site layout. Embeds SearchBox component + visible result list. ~40-60 LOC.
- `apps/site/src/__tests__/search-ui.test.ts` — vitest assertions on built HTML at `apps/site/dist/search/index.html`: contains `<div id="search">` mount point + `pagefind-default-ui` class hooks + lazy script tag. ~50 LOC.
- `apps/site/playwright/search.spec.ts` — playwright spec navigating to `/search`, typing a query, asserting result list populates. WSL2 detection skip per WE-005 + memory feedback_wsl2_chromium_launch.md. CI-only execution. ~60 LOC.

Modified (3):

- `apps/site/package.json` — add `@pagefind/default-ui: "^1.5.0"` (D2 already pulled it transitively via astro-pagefind; D3 makes it an explicit declared dep for ADR-0008 D1 dead-dep symmetry — the SearchBox imports from `@pagefind/default-ui`).
- `apps/site/CONTRACT.md` — extend `## Search index` (D2 added) with UI subsection: SearchBox + /search route surface; A11y guarantees (keyboard nav, ARIA labels via default-ui); /search SSR-before-index render-safety per ADR-0012 out-of-scope #C4(a) — confirms lazy-load satisfies the contract.
- (existing) `apps/site/src/pages/index.astro` OR site nav layout — link to `/search` from the home / nav. (Executor determines which file based on existing site structure.)

= **8 files in canonical `## files` block** (4 NEW + 3 modified + PR.md self).

## test_cases

- **TC1** (search.astro route exists) Input: post-build. Expected: `apps/site/dist/search/index.html` exists.
- **TC2** (SearchBox HTML markup) Input: built HTML at `apps/site/dist/search/index.html`. Expected: contains `<div id="search">` + `data-pagefind-ui` mount selectors + lazy script tag pointing at `/pagefind/pagefind-ui.js` (pagefind 1.5+ path). Location: `apps/site/src/__tests__/search-ui.test.ts`.
- **TC3** (visual-smoke playwright a11y + word-level CJK discriminator, CI-only). **Escalated from D2** — D2 deferred ADR-0012 criterion 4 runtime discriminator to D3 since pagefind.js requires browser fetch() runtime. D3 playwright spec MUST exercise:
  - **Sub-TC3a** (a11y): navigate `/search`, focus SearchBox via Tab, type "callout", await result list populates with ≥1 hit.
  - **Sub-TC3b** (CJK paired discriminator — ADR-0012 criterion 4): seed test corpus with two CJK fixtures (`'中文笔记测试'` page + `'笔记本电脑'` page) — fixtures must be in `content/notes/__test_cjk__/` or per-test-only mount path that survives `astro build`. Then in playwright: navigate `/search`, type `'笔记'`, assert at least one result text contains `中文笔记测试`. Then clear input, type `'记本'`, assert NO result contains `笔记本电脑`. This is the canonical word-level vs character-level discriminator location per ADR-0012 criterion 4 (D2 cleared structural gate; D3 owns runtime gate).
  - WSL2 detection skip pattern preserved (memory feedback_wsl2_chromium_launch.md).
  - Location: `apps/site/playwright/search.spec.ts`.
- **TC4** (bundle-size budget per ADR-0012 criterion 1 RE-ASSERT) Input: post-build measure first-paint gzip on `/search`. Expected: ≤ 120 kB gzip (D2 PR established baseline; D3 must not regress).
- **TC5** (`@pagefind/default-ui` declared dep — ADR-0008 D1 symmetry) Input: read package.json. Expected: `dependencies` contains `"@pagefind/default-ui": "^1.5.0"` (or matching D2 transitive version).
- **TC6** (per-package vitest count) Input: `pnpm --filter=@skb/site test`. Expected: previous count + 1 new (search-ui).
- **TC7** (per-package typecheck + build + root pnpm check) Standard.

## contracts_affected

- `apps/site/CONTRACT.md` — UI subsection added under D2's `## Search index`. Surface growth only.

## adr_touched

None. ADR-0012 already ratified. ADR-0014 (heavy-block client:only) is Wave 4 territory.

## acceptance

1. `/search` route ships (TC1).
2. SearchBox renders (TC2).
3. Playwright a11y smoke + CJK paired discriminator PASS on CI (TC3a + TC3b, WSL2-skip locally). **Sub-TC3b is the canonical ADR-0012 criterion 4 verification** — must FAIL (negative assertion) if pagefind tokenizer regresses to character-level.
4. Bundle ≤ 120 kB gzip (TC4 — ADR-0012 criterion 1 RE-ASSERT).
5. `@pagefind/default-ui` declared in package.json (TC5 — ADR-0008 D1 symmetry).
6. `pnpm check` exits 0.
7. PR.md self-listed.

## executor

Path A: codex-generic-executor for implementation. ux-ui-lead Claude subagent for SearchBox.astro styling if visual polish needed. REVIEW: codex-pr-reviewer-55 (Row 8 heightened scrutiny — UI + build artifact). PRE-COMMIT NOT FIRED (no Row 1+4).

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — apps/site CONTRACT surface-only growth (UI subsection).
- **Row 2** (package add `@pagefind/default-ui`): **HIT** — but transitive via D2 already; explicit declaration only.
- **Row 4** (new ADR): NO.
- **Row 5** (cross ≥3 packages): NO — apps/site only.
- **Row 8** (CI/build/visual): **HIT** — playwright spec + new `/search` route emit + dist artifact shape.

→ D1 stage 4 PRE-COMMIT CLAUDE REVIEW does NOT fire (only Rows 1+4 fire stage 4 per ADR-0011 D1; Rows 2+8 elevate stage 3 reviewer scrutiny).

## Out-of-scope

- ADR-0014 heavy-block client:only (Wave 4).
- Multi-language ranking / search analytics.
- Offline / service-worker integration.

## Related

- [ADR-0012](../../decisions/ADR-0012-search-index-stack.md)
- [D2 PR.md](./D2-search-index-build-integration.md)
- [Wave 3 plan, D3 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md)
