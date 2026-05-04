# B6 — Wave 4 close-ceremony preparation (3 audit codex dispatches + curated summaries + Stage A+B PR roster)

> **Wave 4 Stage B FINAL implementation PR** (Stage B 8/8). Closes Stage B
> with the 3 mandatory audit codex dispatches per ADR-0011 D5 + Wave 4 plan
> v0.2.1 Stage B B6 row: `codex-structure-auditor` (workspace topology +
> dead-dep + monitoring) + `codex-perf-auditor` (bundle baseline +
> Lighthouse-skipped-with-rationale + B7 chunk-leak quantification +
> Stage C optimization scope hint) + `codex-mdx-doctor` (RTT round-trip
> contract). Standard PR (no D2 row 1+4 trigger). NOT the Wave 4 close
> ADR itself (that opens fresh session post Stage C close per
> plan-challenger C9 absorbtion).

## title

Dispatch 3 audit codex (`codex-structure-auditor`, `codex-perf-auditor`,
`codex-mdx-doctor`) per ADR-0011 D5 audit-on-close cadence. Author
3 curated summary docs:
[`docs/audits/structure-2026-05-wave-4-prep.md`](../../audits/structure-2026-05-wave-4-prep.md),
[`docs/audits/perf-2026-05-wave-4-prep.md`](../../audits/perf-2026-05-wave-4-prep.md),
[`docs/audits/mdx-2026-05-wave-4-prep.md`](../../audits/mdx-2026-05-wave-4-prep.md).
Bookkeep `docs/plans/active.md` B7 row backfill (`#45 / 8b6e2d8`) +
B6 TBD row addition. PR.md self-listed per ADR-0006 D8 + B1a-B7
precedent.

## files

8 canonical files + COMMIT-time +1-2 reviewer audit archives;
**~10 files total at commit**. Curates 3 raw audit codex stdout
captures into 3 in-tree summary docs; the raw `/tmp/codex-runs/...txt`
archives ship via `head -2000` truncation per ADR-0011 D6 R7 mitigation.

- `docs/audits/structure-2026-05-wave-4-prep.md` — **NEW** (~80 LOC).
  Curated structure-auditor summary. Headline: TOTAL_VIOLATIONS=0 dead-deps;
  0 true orphans; 22 packages + 2 apps; ADR-0011 D8 long-term Claude
  session monitoring within target (1 = orchestrator).
- `docs/audits/perf-2026-05-wave-4-prep.md` — **NEW** (~70 LOC).
  Curated perf-auditor summary. Headline: B7 chunk-leak confirmed as
  Stage C scope; AC#5 zero-layout-shift preserved; lazy-chunking.test.ts
  contract maintained (DIRECT route HTML refs only); Stage C optimization
  scope informed.
- `docs/audits/mdx-2026-05-wave-4-prep.md` — **NEW** (~50 LOC).
  Curated mdx-doctor summary. Headline: ALL RTT invariants PASS; per-call
  BlockRegistry injection working; no Wave 4 mdx-bridge regressions.
- `docs/audits/codex-runs/2026-05-04-B6-structure-auditor.txt` — **NEW**
  (~2000 LOC; head-2000 truncate per ADR-0011 D6 R7).
- `docs/audits/codex-runs/2026-05-04-B6-perf-auditor.txt` — **NEW**.
- `docs/audits/codex-runs/2026-05-04-B6-mdx-doctor.txt` — **NEW**.
- `docs/plans/active.md` — **MODIFIED** (~3 LOC). B7 row backfill
  (`#45 / 8b6e2d8`) + B6 TBD row.
- `docs/plans/wave-4-main/B6-close-ceremony-prep.md` — **NEW**
  (PR.md self-listed; ~250 LOC).

COMMIT-time additions:
- `docs/audits/codex-runs/2026-05-04-B7-commit.txt` — B7 commit-leftover
  orphan back-fill per established pattern (B1b/B2/B3/B4/B5/B7 precedent).
- `docs/audits/codex-runs/2026-05-04-B6-pr-reviewer-55.txt` — B6 R1 audit.
- (R2 if needed.)

## test_cases

B6 ships 3 NEW doc files + 3 NEW audit raw archives + bookkeeping; no
new vitest tests authored (audit-class PR; functional correctness
verified via `pnpm check` regression-free).

- **TC1** (3 curated summary files exist): `test -f docs/audits/structure-2026-05-wave-4-prep.md`,
  `test -f docs/audits/perf-2026-05-wave-4-prep.md`,
  `test -f docs/audits/mdx-2026-05-wave-4-prep.md` all exit 0.
- **TC2** (3 raw audit archives exist + each ≤ 2000 LOC):
  `test -f docs/audits/codex-runs/2026-05-04-B6-{structure-auditor,perf-auditor,mdx-doctor}.txt`
  + `wc -l` ≤ 2000 per file.
- **TC3** (active.md backfill): B7 row `#45 | 8b6e2d8`; B6 TBD row added.
- **TC4** (workspace check pass): `pnpm check` exit 0; 40/40 PASS.
- **TC5-TC10** byte-unchanged guards: B1a/B1b/B2/B3/B4/B5/B7 shipped
  files unchanged; ADR files unchanged; lockfile + package.json unchanged;
  Wave 4 plan doc unchanged; B7-scope (apps/site/src/components.ts +
  apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro +
  apps/site/src/islands/) unchanged.
- **TC11** PR.md self-listed (≥ 2).

## contracts_affected

NONE.

## adr_touched

NONE.

## D2 trigger judgment

- Row 1 (CONTRACT change): NO
- Row 4 (ADR amendment): NO
- Row 8 (CI/build/security touch): NO
- → STANDARD PR; D1 stage 4 NOT triggered.

## acceptance

1. 3 curated summary docs exist with headline findings + cross-references.
2. 3 raw audit archives shipped at `docs/audits/codex-runs/2026-05-04-B6-*.txt`.
3. Structure audit headline: TOTAL_VIOLATIONS=0 dead-deps + 0 true orphans
   + ADR-0011 D8 long-term session within target.
4. Perf audit headline: B7 chunk-leak confirmed Stage C scope + AC#5 preserved
   + lazy-chunking.test.ts contract maintained.
5. mdx-doctor headline: ALL RTT invariants PASS; no Wave 4 regressions.
6. active.md B7 row backfilled + B6 TBD row added.
7. `pnpm check` workspace-wide PASS.
8. 5 byte-unchanged guards 0 diff (B1a/B1b/B2/B3/B4/B5/B7 + ADR + Wave 4
   plan + lockfile + package.json + B7-scope).
9. PR.md self-listed.
10. NO scope creep beyond the 8 canonical + 1-2 reviewer audit archives
    + B7 commit-leftover orphan.

## executor

orchestrator-self for the 3 audit codex dispatches + 3 curated summary
authoring + active.md bookkeeping. Standard small batch matching B3+B4+B5
pattern.

## Out of scope (deferred)

- **Wave 4 close ADR (potential ADR-0015)**: explicit OUT-OF-SCOPE per
  Wave 4 plan v0.2.1 + Pre-A3 plan-challenger C9 absorbtion. Close
  ceremony begins fresh session AFTER Stage C closes (when user MVP
  judgment fires) per gatekeeper directive #4 + plan-challenger Q4
  absorbtion.
- **Stage C optimization PRs**: chunk-leak fix (per perf-auditor
  scope hint), ja/ko Intl.Segmenter coverage (per B1a Risk register #1),
  full-content CJK discriminator notes (per B3 partial-implementation).
  All deferred to Stage C user-iteration scope; NOT pre-locked here.

## Related

- [ADR-0011 D5 audit-on-close cadence](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [Wave 4 plan v0.2.1 Stage B B6 row](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
- [Stage B PR roster](../active.md) — B1a / B1b / B2 / B3 / B4 / B5 / B7 / **B6 (this)**
- This PR.md: [`docs/plans/wave-4-main/B6-close-ceremony-prep.md`](B6-close-ceremony-prep.md) (self-listed per ADR-0006 D8)

## Stage A + Stage B PR roster summary (informational; for future ADR-0015 close ceremony reference)

| Stage | PR | Squash HEAD | Subject |
| --- | --- | --- | --- |
| Pre-A | #28 | `9836d67` | codex runbook --yolo + R7 piping (Pre-A1) |
| Pre-A | #29 | `876d700` | ADR-0014 design lock (Pre-A2) |
| Pre-A | #30 | `3e2a4a9` | Wave 4 plan-draft lock (Pre-A3) |
| A | #31 | `f765968` | A1 — `@skb/heavy-block-boundary` package shell |
| A | #32 | `1d2f324` | A2 — HeavyBlockBoundary core hydration lifecycle |
| A | #33 | `92c8751` | A3 — retry + maxRetries + onLoadError |
| A | #34 | `5f360a6` | A4 — CSS + a11y + prefers-reduced-motion |
| A | #35 | `59a93c0` | A5 — apps/site dims migration |
| A | #36 | `95ba33b` | A6 — playwright T0/T1 zero-layout-shift |
| A | #37 | `87d0b32` | A7 — 5×.astro variants consolidation |
| A | #38 | `4aeb279` | A8 — Stage A close + ADR-0014 promote `proposed → accepted` |
| B | #39 | `1aa2811` | B1a — ADR-0012 v0.1.1 amendment + isWordLevelMatch utility |
| B | #40 | `5ec7123` | B1b — SearchBox Option B-4 hybrid integration + paired discriminator |
| B | #41 | `317dda3` | B2 — sample-blocks Wave 3 cleanup (sample-assets + intro prose) |
| B | #42 | `5d49240` | B3 — content/notes/__test_cjk__ relocation (notes index filter; partial ADR-0013 D3) |
| B | #43 | `dc216ab` | B4 — Stage A retro items 2 + 3 + 4 (cast / UIDefault / ESLint) |
| B | #44 | `794cd5d` | B5 — codex profile prefix R3 + lychee autolink memory codify |
| B | #45 | `8b6e2d8` | B7 — heavy block Astro hydration + ADR-0014 v0.3 (CRITICAL gap) |
| B | #TBD | TBD | **B6 — close-ceremony prep (this PR)** |

**Total Wave 4 main pipeline PRs**: 3 Pre-A + 8 Stage A + 8 Stage B = **19 PRs**.

**Stage C**: open-ended (per gatekeeper directive #4 + plan-challenger Q4 absorbtion); opens after Stage B B6 merges; closes when user MVP-judgment fires (per 2026-05-02 framework).

**Wave 4 close ceremony**: future fresh session post Stage C close; ADR-0015 (Wave 4 close) authoring begins then per plan-challenger C9 absorbtion.
