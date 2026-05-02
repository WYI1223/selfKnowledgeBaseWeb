# D1a — search index research spike (Stage D opener)

> **Wave 3 Stage D 1st PR.** Research-only PR per locked plan D1a entry
> (lines 696-728). Researcher Claude subagent (sole web-access channel
> per ADR-0011 D7) compares 3 candidate static-search-index libraries
> for apps/site; recommends one + 3 ADR-0012 acceptance criteria for D1b.

## title

Land `docs/research/2026-05-search-index-spike.md` (~229 LOC research
prose) comparing PageFind / lunr.js / flexsearch against Wave 3 search
requirements (spec §4.2). Recommends **PageFind** via `astro-pagefind`
adapter; locks 3 D1b ADR-0012 acceptance criteria.

## files

Created (NEW — 1 research doc + 1 self-listed):

- `docs/research/2026-05-search-index-spike.md` *(researcher Claude
  subagent output, ~229 LOC. Compares 3 candidates across 8 axes
  (version + last-commit / bundle size / index size / query latency /
  build-vs-client / CJK / reindex / Astro integration). Special edge
  cases: non-ASCII/CJK, punctuation-heavy queries, reindex-on-update.
  Recommends PageFind 1.5.0+ via `astro-pagefind` 1.8.6 adapter.)*
- `docs/plans/wave-3-main/D1a-search-index-research.md` *(this PR.md.)*

= **2 files in canonical `## files` block** (counts canonical here).

**Explicitly NOT in `files:`** — pure research; no source / test / config
edits. No `pnpm-lock.yaml` change. No package.json change.

## test_cases

Per locked plan D1a entry — research-doc structural assertions:

- **TC1** (≥3 candidates with version + last-commit) Input: read research
  doc; expected: PageFind / lunr.js / flexsearch each have a "Version"
  + "Last commit" entry with concrete dates pulled from npm/GitHub.
  Location: `docs/research/2026-05-search-index-spike.md`.
- **TC2** (per-candidate benchmark rows) Input: each candidate section
  has bundle-size + index-size + query-latency entries. Expected: each
  field has a concrete number / qualitative bound; no "TBD" left.
  Location: same file.
- **TC3** (non-ASCII / CJK content test, per plan-challenger R2 #5)
  Input: each candidate section + the dedicated edge-cases section
  document the candidate's CJK tokenizer story. Expected: explicit
  tokenizer behavior per candidate (e.g., PageFind's `Intl.Segmenter`,
  lunr's whitespace-only, flexsearch's `Charset.CJK` character-level).
  Location: same file.
- **TC4** (recommendation is a single concrete library) Input: research
  doc `## Recommendation` section. Expected: 1 library named with
  rationale; no "depends" / "TBD" / multi-option. Recommended: PageFind
  via `astro-pagefind`.
- **TC5** (D1b ADR acceptance criteria) Input: research doc
  `## D1b ADR acceptance criteria` section. Expected: ≥3 measurable
  bullets (bundle-size budget, index-size budget, reindex-on-update
  mechanism + TC3 regression test).

## contracts_affected

None. Research-only output; no contract surface change.

## adr_touched

None at D1a (ADR-0012 lands at D1b per locked plan).

## acceptance

1. `docs/research/2026-05-search-index-spike.md` exists, ~150-250 LOC,
   structured per locked plan D1a — TC1+TC2+TC3 evidence.
2. Single concrete recommendation in `## Recommendation` — TC4 evidence.
3. ≥3 measurable D1b ADR acceptance criteria locked — TC5 evidence.
4. PR.md self-listed.
5. Protected: no source / test / config / lockfile edits. Verify
   `git diff main -- '*.ts' '*.tsx' '*.astro' 'package.json' 'pnpm-lock.yaml'`
   returns empty.
6. `pnpm check` exits 0 (no source touched; should be cache-hit clean).

## executor

- **PLAN**: orchestrator-self (small research-only PR; pr-writer subagent
  not dispatched — research scope is tightly bounded).
- **EXECUTE**: `researcher` Claude subagent (sole web-access channel per
  ADR-0011 D7; one-shot dispatch; produced the 229-LOC research doc with
  16 cited sources).
- **REVIEW**: codex-pr-reviewer-55 (light-scope review since no code
  changes; verify research-doc structural assertions pass).
- **PRE-COMMIT CLAUDE REVIEW**: NOT FIRED (D2 trigger is research-only
  → no Row 1 / Row 4 hit).
- **COMMIT**: orchestrator-self per ADR-0006 D8 explicit-file-list
  staging.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): NO — research doc, not contract surface.
- **Row 2** (package add/remove): NO.
- **Row 4** (new ADR): NO — ADR-0012 lands at D1b, not D1a.
- **Row 5** (cross ≥3 packages): NO — single research doc.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ D1 stage 4 PRE-COMMIT CLAUDE REVIEW does NOT fire (no Row 1+4 hit).

## Out-of-scope (explicitly deferred)

- ADR-0012 search index stack decision (D1b).
- PageFind dep / Astro adapter installation (D2).
- Search UI / SearchBox component (D3).
- Index integration with apps/site build (D2).

## Related

- [Wave 3 plan, D1a entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (lines 696-728).
- [research output](../../research/2026-05-search-index-spike.md).
- [spec §4.2](../../superpowers/specs/2026-04-29-self-knowledge-base-design.md) — search index requirement.
- [ADR-0011 D7](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — researcher one-shot dispatch.
