# Pre-A2 — ADR-0014 HeavyBlockBoundary wrapper design lock

> **Wave 4 architectural lock PR.** Authors `ADR-0014` codifying the
> unified HeavyBlockBoundary wrapper pattern for client:only heavy
> blocks (Jupyter / NnViz / AgentFlow today, plugin-extensible to
> future heavy blocks). Closes Wave 3 ADR-0013 D3 mandatory carry-over
> (ADR-0014 candidate) + gatekeeper 2026-05-02 smoke #10 design
> requirements + Wave 3 close structure-baseline §5 README index gap.
> Implementation deferred to Wave 4 Stage A.

## title

Author `docs/decisions/ADR-0014-heavy-block-boundary.md` (proposed
status; promoted to accepted on Stage A implementation completion).
Add invariant W4-1 to `packages/block-foundation/CONTRACT.md`. Refresh
`docs/decisions/README.md` ADR index (adds 0011-0014 entries; closes
Wave 3 close §5 stale-index gap). Plan-challenger codex round logged
12 absorbed challenges (per ADR-0007 D5 + R13 + ADR-0011 D2 v0.1.1).

## files

Modified (6 files):

- `docs/decisions/ADR-0014-heavy-block-boundary.md` — NEW ADR
  (proposed status). 551 lines covering:
  - D1 component API (props + branded HeavyBlockKind type per C6
    absorbtion)
  - D2 SSR rendering (a11y semantics per C2 absorbtion)
  - D3 hydration + lifecycle (mount guard + AbortController per C1
    absorbtion + retry flow per C5 absorbtion)
  - D4 plugin extensibility (RenderView vs EditorView split per Q5+C3
    absorbtion)
  - D5 dimensions ownership (per-block declaration per Q2 absorbtion)
  - D6 skeleton CSS (package-local + design-token-driven per Q4
    absorbtion)
  - D7 package ownership (NEW `@skb/heavy-block-boundary` package per
    Q1 absorbtion)
  - D8 migration of 3 existing heavy blocks (Stage A scope)
  - D9 editor consumer scope (out of scope per C3 absorbtion)
  - 15 acceptance criteria (Stage A implementation must satisfy;
    hardened per C4 absorbtion)
  - Plan-challenger absorbtion table (12/12 absorbed; per R13)
- `packages/block-foundation/CONTRACT.md` — adds W4-1 invariant
  (HeavyBlockBoundary wrapping for `kind='viz'` heavy blocks on MDX
  path; editor NodeView path explicit out-of-scope). Per ADR-0014 D9 +
  C3 absorbtion.
- `docs/decisions/README.md` — ADR index refresh: adds entries for
  0011 / 0012 / 0013 / 0014 (closes structure-2026-05-wave-3-close.md
  §5 binding follow-up (a) + ADR-0014 plan-challenger C7 absorbtion).
- `docs/audits/codex-runs/2026-05-03-Pre-A2-plan-challenge.txt` —
  truncated archive of plan-challenger codex dispatch (per R7 /tmp
  piping; full raw at `/tmp/codex-runs/2026-05-03-Pre-A2-plan-challenge.txt`).
- `docs/audits/codex-runs/2026-05-03-Pre-A1-pr-reviewer-55.txt` —
  truncated archive of Pre-A1 codex review dispatch (created post-Pre-A1
  commit; bundled into Pre-A2 since the audit log file did not exist
  when Pre-A1 was committed; small bundle is acceptable per ADR-0006
  D8 since both archives belong to Wave 4 historical record).
- `docs/plans/wave-4-main/Pre-A2-adr-0014-heavy-block-boundary.md` —
  this PR.md (self-listed per ADR-0006 D8 strict whitelist).

= **6 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `packages/heavy-block-boundary/**` — NEW package authored at Stage A,
  NOT this PR. Pre-A2 only ratifies the design via ADR.
- `apps/site/src/components.ts` — Stage A migration target (replaces
  `makeHeavyBlockPlaceholder` factory with `HeavyBlockBoundary` calls).
- Heavy block packages (`packages/block-{jupyter,nn-viz,agent-flow}/`)
  — Stage A adds `heavyBoundaryDimensions` exports + ensures
  RenderView/EditorView split is clean.
- `pnpm-lock.yaml` / `package.json` — no dep changes in Pre-A2 (new
  package addition is Stage A scope).

## test_cases

Pre-A2 is pure ADR + CONTRACT.md + README doc-prose; tests are
doc-acceptance assertions plus repo-hygiene gates.

- **TC1** (ADR file exists at canonical path) Input:
  `test -f docs/decisions/ADR-0014-heavy-block-boundary.md && echo OK`.
  Expected: `OK`. Location: shell at repo root.
- **TC2** (ADR contains all 9 D-list sections + Acceptance + Plan-challenger
  absorbtion table) Input:
  `grep -cE '^### D[1-9] —|^## Acceptance|^## Plan-challenger codex absorbtion' docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: `≥ 11` (D1..D9 = 9 sections, plus Acceptance heading,
  plus Plan-challenger absorbtion heading). Location: shell.
- **TC3** (ADR D7 specifies NEW package per Q1 absorbtion) Input:
  `grep -nE 'NEW package: \`@skb/heavy-block-boundary\`' docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: ≥1 hit. Location: shell.
- **TC4** (ADR D5 specifies per-block dimensions ownership per Q2
  absorbtion) Input:
  `grep -nE 'heavyBoundaryDimensions' docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: ≥3 hits (export declaration + apps/site consumption + AC#15).
  Location: shell.
- **TC5** (ADR D9 specifies editor NodeView out-of-scope per C3 absorbtion)
  Input: `grep -nE 'D9.*Editor consumer scope|out of scope|out-of-scope' docs/decisions/ADR-0014-heavy-block-boundary.md`.
  Expected: ≥1 hit. Location: shell.
- **TC6** (ADR Acceptance contains all 15 hardened criteria per C4 absorbtion)
  Input: `awk '/^## Acceptance criteria/,/^## Consequences/' docs/decisions/ADR-0014-heavy-block-boundary.md | grep -cE '^[0-9]+\\.'`.
  Expected: `15`. Location: shell.
- **TC7** (block-foundation/CONTRACT.md contains W4-1 invariant)
  Input: `grep -nE 'W4-1.*HeavyBlockBoundary' packages/block-foundation/CONTRACT.md`.
  Expected: ≥1 hit, positioned within the `## Invariants` section.
  Location: shell.
- **TC8** (W4-1 invariant references ADR-0014) Input:
  `grep -nE 'ADR-0014' packages/block-foundation/CONTRACT.md`.
  Expected: ≥1 hit (the W4-1 reference). Location: shell.
- **TC9** (docs/decisions/README.md contains 0011/0012/0013/0014 entries)
  Input: `grep -cE 'ADR-001[1234]-' docs/decisions/README.md`.
  Expected: `4`. Location: shell.
- **TC10** (Plan-challenger absorbtion table has 12 rows with verdicts)
  Input: `awk '/^## Plan-challenger codex absorbtion/,0' docs/decisions/ADR-0014-heavy-block-boundary.md | grep -cE '^\\| (Q[0-9]+|C[0-9]+) \\|'`.
  Expected: `12` (5 questions Q1-Q5 + 7 challenges C1-C7). Location: shell.
- **TC11** (Each absorbtion row is ABSORBED — orchestrator did not push
  back; per R13 logged) Input:
  `awk '/^## Plan-challenger codex absorbtion/,0' docs/decisions/ADR-0014-heavy-block-boundary.md | grep -c 'ABSORBED'`.
  Expected: `12`. Location: shell.
- **TC12** (`pnpm check` exit 0) Input: `pnpm check`. Expected: exit 0
  (no source/test changes; turbo cache hit clean). Location: shell.
- **TC13** (link-check passes via CI) Input: `.github/workflows/link-check.yml`
  on push (lychee CI-only per Wave 3 baseline + Pre-A1 TC11 precedent).
  Expected: workflow `success` conclusion. Location: GitHub Actions.
- **TC14** (`pnpm-lock.yaml` unchanged) Input:
  `git diff main -- pnpm-lock.yaml`. Expected: empty. Location: shell.
- **TC15** (Plan-challenger audit log archived) Input:
  `wc -l docs/audits/codex-runs/2026-05-03-Pre-A2-plan-challenge.txt`.
  Expected: `≤ 2000` (head-truncated per R7). Location: shell.

## contracts_affected

- `packages/block-foundation/CONTRACT.md` — adds W4-1 invariant
  (cross-package surface contract — governs how 3 heavy blocks compose
  with apps/site MDX layer; editor path explicitly out of scope).

## adr_touched

- `docs/decisions/ADR-0014-heavy-block-boundary.md` — NEW ADR
  (proposed status). See `## D2 trigger judgment` for row 4 verdict
  (canonical).

## acceptance

1. ADR-0014 lives at `docs/decisions/ADR-0014-heavy-block-boundary.md`
   with proposed status — TC1 + TC2 evidence.
2. ADR D-list contains all 9 decisions (D1 API, D2 SSR, D3 hydration,
   D4 plugin extensibility, D5 dimensions ownership, D6 CSS, D7 package
   ownership, D8 migration, D9 editor scope) — TC2 evidence.
3. ADR D7 specifies NEW package `@skb/heavy-block-boundary` per
   plan-challenger Q1 absorbtion — TC3 evidence.
4. ADR D5 specifies per-block `heavyBoundaryDimensions` ownership per
   plan-challenger Q2 absorbtion — TC4 evidence.
5. ADR D9 explicitly scopes boundary to MDX/static path; editor
   NodeView consumption out of scope per plan-challenger C3
   absorbtion — TC5 evidence.
6. ADR Acceptance criteria has 15 hardened test items (SSR/hydration
   byte-equivalence, exact CSS, T0/T1 layout-shift, success/reject
   paths, retry, maxRetries bound, mount guard, AbortSignal, a11y,
   plugin extensibility, reduced-motion, dimensions sourced) per
   plan-challenger C4 absorbtion — TC6 evidence.
7. block-foundation/CONTRACT.md `## Invariants` section has W4-1
   bullet referencing ADR-0014 — TC7 + TC8 evidence.
8. docs/decisions/README.md ADR index includes ADR-0011, ADR-0012,
   ADR-0013, ADR-0014 entries (closes structure-2026-05-wave-3-close.md
   §5 follow-up (a) + plan-challenger C7) — TC9 evidence.
9. Plan-challenger absorbtion table has 12 rows (Q1-Q5 + C1-C7), all
   marked ABSORBED — TC10 + TC11 evidence.
10. Plan-challenger raw audit log truncated to
    `docs/audits/codex-runs/2026-05-03-Pre-A2-plan-challenge.txt` per
    R7 piping; archive `≤ 2000` lines — TC15 evidence.
11. `pnpm check` returns exit 0 — TC12 evidence. No source/test/lockfile
    changes beyond doc prose; turbo cache should be clean for
    typecheck/test.
12. Link-check passes via CI workflow on push — TC13 evidence.
13. PR.md (`docs/plans/wave-4-main/Pre-A2-adr-0014-heavy-block-boundary.md`)
    is self-listed in the staged file list at commit time per ADR-0006
    D8 strict whitelist (PR #1 R2 lesson; carried through Wave 3 + Pre-A1).
14. Pre-A1 audit log archive
    (`docs/audits/codex-runs/2026-05-03-Pre-A1-pr-reviewer-55.txt`)
    is bundled into this PR commit since the file did not exist at
    Pre-A1 commit time (orchestrator created the truncated archive
    after Pre-A1 commit). Acceptable per ADR-0006 D8 small-bundle rule
    (both archives are Wave 4 historical record; ≤ 2000 lines each).
15. **No collateral regen drift** — `pnpm generate:configs` is NOT run
    by Pre-A2 (no agent-contract.md change). `git diff` after pre-commit
    is bounded to the 6 files in `## files`.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT/ADR change): **HIT** — `packages/block-foundation/CONTRACT.md`
  gains W4-1 invariant.
- **Row 2** (package add/remove): NO — Pre-A2 doesn't add the new
  package; Stage A does.
- **Row 4** (new ADR required): **HIT** — ADR-0014 is new.
- **Row 5** (cross ≥3 packages): NO — only block-foundation CONTRACT
  touched at package level; ADR + README + audit logs are docs.
- **Row 8** (CI/build/deploy/auth/security): NO.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 1 + Row 4 HIT;
mitigates same-model echo chamber on a meta-class architectural change
that defines how all subsequent heavy block work integrates).

## executor

Bootstrap-flavored doc-only PR; same pattern as Pre-A1 + Pre-B1 (Wave 3).

- **PLAN**: orchestrator-self (this PR.md). pr-writer subagent NOT
  dispatched because (a) scope is doc/ADR-only, (b) Pre-A1 + Pre-B1
  precedent, (c) authoring requires the cross-cutting context already
  loaded in this orchestrator session (Wave 3 close materials +
  plan-challenger absorbtion + apps/site / heavy block source code).
- **Plan-challenger codex round (PRE-LOCK)**: dispatched 2026-05-03 via
  `codex exec --yolo --profile plan-challenger ...`; 12 challenges
  raised + 7 high-strength + Recommend NOT lock as-is. **All 12
  absorbed**; ADR-0014 v0.1 → v0.2 between dispatch and lock. Audit log
  archived per R7. See `## Plan-challenger codex absorbtion` table in
  ADR-0014 for per-row verdicts.
- **EXECUTE**: orchestrator-self (this same session). ~600 LOC across
  ADR (551 lines) + block-foundation/CONTRACT.md (~10 lines) + README
  (~4 rows) + audit log archives (binary copies). No code in scope.
- **REVIEW**: codex `codex-pr-reviewer-55`. Audit log:
  `/tmp/codex-runs/2026-05-03-Pre-A2-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-03-Pre-A2-pr-reviewer-55.txt`
  truncated archive (per Pre-A1's just-codified Wave 4+ R7 piping
  flow).
- **PRE-COMMIT CLAUDE REVIEW**: orchestrator-self (D2 row 1 + 4 HIT).
  Independent walk against `## acceptance` bullets 1-15; verify TC1-TC15
  pass; specifically confirm plan-challenger absorbtion alignment per
  bullet 9.
- **COMMIT**: orchestrator-self per ADR-0006 D8 explicit-file-list
  staging (`git reset HEAD` → `git add` per `## files` list →
  `git diff --cached --stat` verify staged count → `git commit` →
  `git push`). Bootstrap-flavored exception per ADR-0011 D1 (Pre-A1 +
  Pre-B1 precedent).
- **ACCEPT**: pr-writer Claude subagent (second invocation; verifies
  the diff matches the locked acceptance + scope creep / drop check).

## Out-of-scope (explicitly deferred to Stage A)

- Actual `@skb/heavy-block-boundary` package creation + implementation
  (TypeScript code + tests + CSS + CONTRACT.md per D7).
- Migration of 3 heavy blocks in `apps/site/src/components.ts`
  (replace `makeHeavyBlockPlaceholder` calls with `HeavyBlockBoundary`
  per D8).
- `heavyBoundaryDimensions` export from each heavy block ui-default
  (per D5).
- Acceptance test implementation (vitest #1-#13, playwright #5).
- Phase 2 selective per-block chunking + perf baseline (C5 carry-over).
- ADR-0014 status transition `proposed` → `accepted` (occurs at Stage A
  close once all 15 acceptance criteria are verified; small docs PR).
- Editor (Tiptap NodeView) heavy-block lazy-load (D9 explicit out-of-scope;
  separate ADR if/when needed).
- Per-token CSS variable additions to `@skb/design-tokens` (D6 leaves
  this as a Stage A discretionary contribution; not pre-locked).

## Related

- [ADR-0014 (this PR)](../../decisions/ADR-0014-heavy-block-boundary.md)
  — the architectural decision being locked.
- [ADR-0013 D3 Wave 4 deferred items](../../decisions/ADR-0013-wave-3-close.md)
  — explicit authorization for ADR-0014 carry-over.
- [structure-2026-05-wave-3-close.md §5 + Wave 4 follow-ups](../../audits/structure-2026-05-wave-3-close.md)
  — README index gap closed by this PR.
- [ADR-0011 D2 v0.1.1 SOTed-PR.md amendment](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — schema discipline applied to this PR.md.
- [ADR-0007 D5 + memory `feedback_soted_pr_md_discipline`](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
  — plan-challenger codex round + R13 absorbtion-doc protocol.
- [Pre-A1 PR.md](./Pre-A1-codex-runbook-yolo-tmp-piping.md) — Wave 4
  bootstrap PR precedent (codex --yolo + R7 piping + pipefail; merged
  at HEAD `9836d67`).
- [apps/site/src/components.ts:32-52](../../../apps/site/src/components.ts)
  — Wave 3 C3 placeholder being replaced at Stage A.
- [packages/block-jupyter/src/ui-default/Jupyter.astro](../../../packages/block-jupyter/src/ui-default/Jupyter.astro)
  — orphan SSR variant (still relevant for direct Astro consumers post-Stage A).
