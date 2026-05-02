# D1b — ADR-0012 search index stack decision (Stage D)

> **Wave 3 Stage D 2nd PR.** Ratifies D1a researcher recommendation
> (PageFind via astro-pagefind) into ADR-0012 with 5 measurable
> acceptance criteria for D2 implementation. Per locked plan D1b entry
> (lines 729-758).

## title

Land `docs/decisions/ADR-0012-search-index-stack.md` (~120 LOC ADR)
ratifying PageFind 1.5.0+ via `astro-pagefind` 1.8.6+ as Wave 3 search
stack. Locks 5 acceptance criteria (3 from D1a research +
2 D1b additions: CJK regression test + lib version lower-bound).

## files

Created (NEW — 1 ADR + 1 self-listed):

- `docs/decisions/ADR-0012-search-index-stack.md` *(NEW; ~120 LOC. Cites
  D1a research as evidence base. Locks 5 acceptance criteria for D2:
  bundle-size budget ≤ 120 kB gzip / index-size budget ≤ 300 kB at
  100-note projection / reindex-on-update via post-build hook + content-
  hash regression test / CJK regression test indexing `"中文笔记测试"` +
  query `"笔记"` / `astro-pagefind` ≥ 1.8.6 lower-bound. Documents
  alternatives considered (lunr.js + flexsearch + MiniSearch all
  driven from D1a evidence) with explicit reject rationales. Compliance
  section ties to ADR-0008 D1 / ADR-0011 D7 / ADR-0009 separation.)*
- `docs/plans/wave-3-main/D1b-adr-0012-search-index-stack.md` *(this PR.md.)*

= **2 files in canonical `## files` block** (counts canonical here).

**Explicitly NOT in `files:`** — D1b is decision-only:

- `apps/site/package.json` — no dep added at D1b. D2 is the implementation
  PR; `astro-pagefind` lands there.
- `apps/site/astro.config.mjs` — no integration registered at D1b; D2's
  scope.
- `apps/site/CONTRACT.md` — surface change at D2 (per ADR-0012 acceptance
  criterion 1 mandate).
- `pnpm-lock.yaml` — no dep change at D1b; should be byte-identical to
  main after merge.
- `docs/plans/active.md` — left as-is; pointer to Wave 3 plan still
  current.

## test_cases

Per locked plan D1b entry — ADR structural assertions:

- **TC1** (ADR file structurally complete) Input: read
  `docs/decisions/ADR-0012-search-index-stack.md`. Expected: contains
  Status table / Context / Decision / Acceptance criteria / Consequences /
  Alternatives considered / Compliance / Related sections (matches
  ADR-0008/ADR-0009/ADR-0010/ADR-0011 template).
- **TC2** (cites D1a research) Input: ADR. Expected: links to
  `docs/research/2026-05-search-index-spike.md` (relative path) at least
  3 times (Status table 触发 row, Context evidence subsection, Related
  section).
- **TC3** (≥3 D1a-locked acceptance criteria preserved) Input: ADR
  `## Acceptance criteria` section. Expected: 3 criteria from D1a
  research summary preserved verbatim or paraphrased equivalently
  (bundle / index / reindex).
- **TC4** (≥2 D1b-new acceptance criteria) Input: same section.
  Expected: criterion 4 (CJK regression test) + criterion 5
  (`astro-pagefind` ≥ 1.8.6) present.
- **TC5** (`astro-pagefind` version lower-bound is concrete number)
  Input: ADR. Expected: literal `1.8.6` string appears in acceptance
  criterion 5.
- **TC6** (alternatives considered ≥3 candidates) Input: ADR
  `## Alternatives considered` section. Expected: ≥3 alternative
  candidates documented with reject rationale (lunr.js / flexsearch /
  MiniSearch).
- **TC7** (reindex-on-update contract per plan-challenger R2 #13)
  Input: ADR acceptance criterion 3. Expected: explicitly forbids
  client-side reindex AND mandates content-hash regression test on
  MDX edit.
- **TC8** (root pnpm check) Input: `pnpm check` from repo root.
  Expected: exit 0 (cache-hit clean — no source change). Location:
  shell command at `/home/weiyi/selfKnowledgeBaseWeb/`. plan-challenger
  D1b #C2 absorbed (location triple tightened).
- **TC9** (lychee link-check on the new ADR file) Input: `pnpm link-check`
  from repo root with the lychee glob covering `./**/*.md`. Expected:
  0 broken relative or HTTP links specifically in
  `docs/decisions/ADR-0012-search-index-stack.md`. Location:
  `docs/decisions/ADR-0012-search-index-stack.md`. plan-challenger
  D1b #C2 absorbed.
- **TC10** (CJK discriminator absorbed at criterion 4) Input: ADR
  `## Acceptance criteria` criterion 4 text. Expected: contains both
  the positive assertion (`"中文笔记测试"` + `"笔记"`) AND the inverse
  discriminator assertion (`"笔记本电脑"` + `"记本"` MUST NOT match).
  Location: `docs/decisions/ADR-0012-search-index-stack.md` `##
  Acceptance criteria` section. plan-challenger D1b #C3 absorbed.

## contracts_affected

None at D1b. ADR ratifies a stack decision; no `packages/*/CONTRACT.md`
or `apps/site/CONTRACT.md` change. D2 will surface acceptance results
in `apps/site/CONTRACT.md` per criterion 1 mandate.

## adr_touched

- `docs/decisions/ADR-0012-search-index-stack.md` — **NEW (created)**.

## acceptance

1. ADR file exists at `docs/decisions/ADR-0012-search-index-stack.md`,
   matches template — TC1 evidence.
2. Cites D1a research ≥ 3x — TC2 evidence.
3. ≥3 D1a-locked criteria preserved + ≥2 D1b-new criteria added (5 total)
   — TC3+TC4 evidence.
4. `astro-pagefind` 1.8.6 version lower-bound concrete in criterion 5
   — TC5 evidence.
5. Alternatives section documents ≥3 rejected candidates — TC6 evidence.
6. Reindex-on-update contract forbids client-side path AND mandates
   content-hash regression test — TC7 evidence.
7. `pnpm check` exits 0 — TC8 evidence.
8. `pnpm link-check` over new ADR returns 0 broken links — TC9 evidence.
9. PR.md self-listed.
10. Protected: no source / test / config / lockfile / package.json edits;
    verify `git diff main -- '*.ts' '*.tsx' '*.astro' 'package.json' 'pnpm-lock.yaml'`
    returns empty.

## Plan-challenger codex absorbtion (per ADR-0007 D5 + ADR-0011 D6)

plan-challenger codex dispatched 2026-05-01 (audit log:
`docs/audits/codex-runs/2026-05-01-d1b-plan-challenge.txt`). 4 challenges
+ 4 suggestions. Triage:

- **C1 LOC=264** (158 PR.md + 106 ADR exceeds 200 strict gate):
  **NOT ABSORBED**. ADR-0011 D2 LOC budget targets code/test PRs;
  decision-only PRs follow precedent of ADR-0010 (276 LOC) +
  ADR-0011 (275 LOC) — prose-heavy ADRs at this PR are an explicit
  exception to the LOC target since the artifact IS prose. PR.md
  documents this rationale.
- **C2 TC8/TC9 location triples weak**: **ABSORBED** — TC8 + TC9
  rewritten with explicit `location:` paths (shell cwd + ADR file
  path); new TC10 added with precise location.
- **C3 CJK discriminator weakness** (positive-only assertion can pass
  on character-level tokenizer): **ABSORBED** — ADR criterion 4
  upgraded with paired positive (`笔记` matches `中文笔记测试`) +
  inverse discriminator (`记本` must NOT match `笔记本电脑` since
  `Intl.Segmenter` segments to `["笔记本", "电脑"]` while
  character-level over-matches).
- **C4(a) /search SSR-before-index lock missing**: **PARTIAL ABSORB**
  — added Out-of-scope note in ADR pointing forward to D3 PLAN
  responsibility.
- **C4(b) CDN/proxy stale-cache acceptance missing**: **ABSORBED** —
  added cache-bust mechanism note to ADR criterion 3 (PageFind
  emits content-hash chunk filenames; D2 PR documents in CONTRACT).

## executor

- **PLAN**: orchestrator-self (small ADR; pr-writer not dispatched —
  ADR drafting is orchestrator-canonical work, ADR-0008/0009/0010/0011
  precedent).
- **plan-challenger codex MUST run before lock** per ADR-0007 D5
  (locked plan D1b explicit requirement). Challenge categories: ADR
  template fidelity / acceptance criteria measurability / alternatives
  rejection rationale strength / compliance section completeness.
- **EXECUTE**: orchestrator-self drafted ADR-0012 inline (already done
  pre-PR.md as part of D1b prep).
- **REVIEW**: codex-pr-reviewer-55 — light scope (decision-only PR;
  no code).
- **PRE-COMMIT CLAUDE REVIEW**: **FIRES** per D2 row 4 (new ADR).
  orchestrator-self executes; mitigates same-model echo chamber on the
  ADR drafting itself.
- **COMMIT**: orchestrator-self per ADR-0006 D8 explicit-file-list
  staging.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — no contract file modified.
- **Row 2** (package add/remove): NO — D2's scope.
- **Row 4** (new ADR): **HIT** — ADR-0012 introduced.
- **Row 5** (cross ≥3 packages): NO — single ADR, single concept.
- **Row 8** (CI/build/deploy/auth/security): NO at D1b (D2 will hit).

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW FIRES** (Row 4 hit). Required.

## Out-of-scope (explicitly deferred)

- D2: PageFind dep + Astro adapter integration + `_pagefind/` post-build
  output verification + 5 acceptance regression tests + CONTRACT.md
  surface update + perf measurement scripts.
- D3: SearchBox + /search route + visual-smoke playwright + UI styling
  (use `@pagefind/default-ui` or hand-roll TBD by D3 PLAN).
- Server-side / API-based search (out of Wave 3 scope; would need a
  separate ADR if ever introduced).
- Multi-language ranking tuning beyond PageFind defaults (defer until
  rank quality complaint surfaces).

## Related

- [Wave 3 plan, D1b entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (lines 729-758).
- [D1a PR.md](./D1a-search-index-research.md) — predecessor research PR.
- [D1a research spike](../../research/2026-05-search-index-spike.md) — evidence base.
- [ADR-0012](../../decisions/ADR-0012-search-index-stack.md) — the artifact this PR lands.
- [ADR-0011 D7](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — researcher subagent dispatch boundary.
- [spec §4.2](../../superpowers/specs/2026-04-29-self-knowledge-base-design.md) — search requirement source.
