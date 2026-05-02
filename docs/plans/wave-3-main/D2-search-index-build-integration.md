# D2 — search index build-time integration (Stage D)

> **Wave 3 Stage D 3rd PR.** Implements ADR-0012 acceptance criteria
> 1-5 by integrating `astro-pagefind` into apps/site build pipeline:
> dep declaration + integration register + CONTRACT surface + CJK
> discriminator test + reindex regression test + size measurement.
> Per locked plan D2 entry (lines 759-805).

## title

Install `astro-pagefind` ≥ 1.8.6 in apps/site; register
`astroPagefind()` integration in `astro.config.mjs`; surface search
index in `apps/site/CONTRACT.md`; add CJK + reindex regression tests
per ADR-0012 acceptance criteria 3+4. **No UI** — D3 ships
SearchBox + /search route.

## files

Created (NEW — 3):

- `apps/site/src/__tests__/search-cjk.test.ts` *(NEW; vitest. Implements
  ADR-0012 acceptance criterion 4 paired CJK discriminator. After
  `pnpm --filter=@skb/site build`, parses `dist/_pagefind/`
  `pagefind-entry.json` and per-fragment data; asserts (a) `中文笔记测试`
  fragment indexed under stem `笔记`; (b) `笔记本电脑` fragment NOT
  indexed under stem `记本`. ~80 LOC.)*
- `apps/site/src/__tests__/search-reindex.test.ts` *(NEW; vitest.
  Implements ADR-0012 acceptance criterion 3 content-hash reindex
  test. Build #1 → capture `_pagefind/fragment/<note-hash>.pf_fragment`
  hash. Mutate test-only MDX fixture → build #2 → assert hash
  changed. Cleanup: revert mutation, build #3 → assert original
  hash restored. ~120 LOC.)*
- `docs/plans/wave-3-main/D2-search-index-build-integration.md`
  *(this PR.md.)*

Modified (4):

- `apps/site/package.json` — add `astro-pagefind: "^1.8.6"` to
  `dependencies`. (Per ADR-0012 acceptance criterion 5; D2-explicit
  Row 2 D2 trigger hit.)
- `apps/site/astro.config.mjs` — `import pagefind from
  'astro-pagefind';` + register `pagefind()` in `integrations: []`
  array. Adapter scans `dist/` post-build and emits `dist/_pagefind/`.
- `apps/site/CONTRACT.md` — add `## Search index` section documenting:
  (a) PageFind 1.5.0+ via `astro-pagefind` 1.8.6+; (b) acceptance
  criterion 1 measurement (post-build `_pagefind/` size + first-paint
  bundle gzip; reproducible script command); (c) acceptance criterion 2
  measurement (current corpus index size + 100-note projection
  formula); (d) cache-bust mechanism (PageFind content-hash chunk
  filenames automatic); (e) D3 referenced for UI.
- `pnpm-lock.yaml` — locks `astro-pagefind` at 1.8.6+ + transitive
  `pagefind` runtime + `@pagefind/default-ui` (carried but D3 use).

= **7 files in canonical `## files` block** (3 NEW + 4 modified +
PR.md self; counts canonical here).

**Explicitly NOT in `files:`**:

- `apps/site/src/components/SearchBox.astro` — D3 scope.
- `apps/site/src/pages/search.astro` — D3 scope.
- `apps/site/playwright.config.ts` — D3 scope (visual-smoke test).
- `apps/site/src/components.ts` — unchanged (search is route-level not
  block-level).
- `content/notes/*.mdx` — D2 adds **test-only** fixture for reindex
  test if needed; existing live notes untouched.
- `packages/**` — apps/site-only change; no contract surface in any
  block-* package.

## test_cases

Per locked plan D2 entry — implementation PR with concrete tests:

- **TC1** (apps/site `pnpm --filter=@skb/site build` exits 0 with
  `astro-pagefind` integration) Input: shell command at repo root.
  Expected: `dist/_pagefind/pagefind-entry.json` exists post-build.
  Location: shell + filesystem assertion.
- **TC2** (CJK discriminator paired assertion — ADR-0012 criterion 4)
  Input: post-build `dist/_pagefind/` artifacts + test-only MDX
  fixtures `中文笔记测试` + `笔记本电脑`. Expected: positive (`笔记`
  → `中文笔记测试` match) AND negative (`记本` → `笔记本电脑` MUST NOT
  match). Location:
  `apps/site/src/__tests__/search-cjk.test.ts`.
- **TC3** (reindex content-hash test — ADR-0012 criterion 3) Input:
  build #1 → capture chunk hash → mutate MDX fixture → build #2 →
  assert hash changed → revert + build #3 → assert original hash
  restored. Expected: 3 builds emit deterministically distinct hashes
  per content-state. Location:
  `apps/site/src/__tests__/search-reindex.test.ts`.
- **TC4** (bundle-size budget — ADR-0012 criterion 1) Input: post-build
  measure first-paint gzip on the (placeholder D3) search route.
  Expected: ≤ 120 kB gzip. Note: D2 has no `/search` route yet; TC4
  measures the PageFind runtime chunk that any consumer of the search
  API would download. D3 PR re-asserts after UI integration. Location:
  `apps/site/CONTRACT.md` `## Search index` measurement table +
  reproducible script (e.g.,
  `apps/site/scripts/measure-search-bundle.sh`).
- **TC5** (index-size budget — ADR-0012 criterion 2) Input: post-build
  `du -sb dist/_pagefind/`. Expected: current corpus ≤ 30 kB; 100-note
  projection ≤ 300 kB (formula or empirical extrapolation in
  CONTRACT). Location: `apps/site/CONTRACT.md` measurement table.
- **TC6** (`astro-pagefind` ≥ 1.8.6 lower-bound — ADR-0012 criterion 5)
  Input: read `apps/site/package.json`. Expected: `dependencies` block
  contains `"astro-pagefind": "^1.8.6"` (or `~1.8.6`/`>=1.8.6`).
  Location: `apps/site/package.json`.
- **TC7** (per-package vitest count) Input:
  `pnpm --filter=@skb/site test`. Expected: previous count + 2 new
  (search-cjk + search-reindex). Location: shell command at repo
  root.
- **TC8** (per-package typecheck) Input:
  `pnpm --filter=@skb/site typecheck`. Expected: exit 0. Location:
  shell command at repo root.
- **TC9** (root pnpm check) Input: `pnpm check` from repo root.
  Expected: exit 0. Location: shell command at repo root.
- **TC10** (lockfile scope) Input: `git diff main -- pnpm-lock.yaml`.
  Expected: only `astro-pagefind` + transitive deps added; no other
  package version churn (per ADR-0006 D8 lockfile scope discipline).
  Location: `pnpm-lock.yaml`.

## contracts_affected

- `apps/site/CONTRACT.md` — adds `## Search index` section. Surface
  growth only (no removal); ADR-0008 D1 cross-package consumer pattern
  unaffected (apps/site is end-of-chain).

## adr_touched

None (ADR-0012 ratified at D1b; D2 is implementation).

## acceptance

1. `astro-pagefind` ≥ 1.8.6 in `apps/site/package.json` — TC6.
2. `astroPagefind()` registered in `astro.config.mjs` integrations —
   shell-grep verifiable.
3. Post-build `dist/_pagefind/pagefind-entry.json` exists — TC1.
4. CJK discriminator test passes paired positive + inverse — TC2.
5. Reindex test passes 3-build deterministic hash sequence — TC3.
6. CONTRACT documents bundle + index measurements with reproducible
   script — TC4 + TC5.
7. `pnpm --filter=@skb/site test` exits 0 — TC7.
8. `pnpm --filter=@skb/site typecheck` exits 0 — TC8.
9. `pnpm check` exits 0 — TC9.
10. Lockfile scope discipline (only astro-pagefind family) — TC10.
11. PR.md self-listed.

## executor

- **PLAN**: orchestrator-self (this PR.md).
- **EXECUTE**: codex-generic-executor (TDD-front: write 2 test files
  first → install dep + register integration → CONTRACT update →
  vitest all PASS).
- **REVIEW**: codex-pr-reviewer-55. Heightened scrutiny per Row 2 +
  Row 8 hits (ADR-0006 D8 8-point checklist).
- **PRE-COMMIT CLAUDE REVIEW**: NOT FIRED (D2 trigger has no Row 1 / no
  Row 4; only Rows 1+4 fire stage 4 per ADR-0011 D1).
- **COMMIT**: reviewer codex commits per ADR-0006 D8 explicit-file-list
  staging.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — apps/site/CONTRACT.md is
  surface-only growth; not a foundation contract change.
- **Row 2** (package add): **HIT** — `astro-pagefind` added.
- **Row 4** (new ADR): NO — ADR-0012 ratified at D1b.
- **Row 5** (cross ≥3 packages): NO — apps/site only.
- **Row 8** (CI / build / deploy): **HIT** — astro-pagefind post-build
  hook changes build pipeline + dist artifact shape.

→ D1 stage 4 PRE-COMMIT CLAUDE REVIEW does NOT fire (only Rows 1+4 fire
stage 4 per ADR-0011 D1; Rows 2+8 elevate stage 3 reviewer scrutiny).

## Out-of-scope (explicitly deferred)

- D3 SearchBox + /search route + visual-smoke playwright + UI styling.
- `@pagefind/default-ui` CSS / theming (D3 decides hand-roll vs default-
  ui consumption).
- Search analytics / observability hooks.
- Multi-language ranking tuning.

## Related

- [Wave 3 plan, D2 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (lines 759-805).
- [ADR-0012](../../decisions/ADR-0012-search-index-stack.md) — stack ratification + acceptance criteria 1-5.
- [D1a research](../../research/2026-05-search-index-spike.md) — bundle/index baseline expectations.
- [D1b PR.md](./D1b-adr-0012-search-index-stack.md) — predecessor ADR PR.
- [astro-pagefind adapter](https://github.com/shishkin/astro-pagefind) — implementation reference.
- [PageFind site](https://pagefind.app) — runtime docs.
