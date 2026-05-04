# C-1 — Pyodide `indexURL` CDN configuration (Jupyter MVP unblock)

> **Wave 4 Stage C SECOND PR** (HIGH priority; unblocks Jupyter MVP).
> Path-(a) **CDN-only** locked by orchestrator post plan-challenger
> 15-Q absorbtion (see `## Plan-challenger absorbtion`). Threads
> `indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'`
> through the existing `PyodideAdapter({ boot: { ... } })` call site so
> Pyodide's `loadPyodide()` core download + the default `loadPackage`
> wheel resolution (`numpy` / `pandas` / `matplotlib`) all flow from
> the same CDN base. **No self-host**, **no public-asset copy**, **no
> Astro hook**, **no Vite alias**, **no CSP touch** in this PR — those
> are deferred (see `## Out of scope (deferred)`).
>
> **D2 Row 1 HIT**: `apps/site/CONTRACT.md` gains a "Pyodide CDN
> hosting" invariant clause locking the version + URL string + the
> two-place sync requirement (`apps/site/CONTRACT.md` clause ↔
> `packages/block-jupyter/src/ui-default/Jupyter.tsx` call site).
> ADR-0011 D1 stage 4 PRE-COMMIT CLAUDE REVIEW **fires**.

## title

Thread `indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'`
into the `new PyodideAdapter({ boot })` call site so Jupyter MVP boots
real Pyodide via jsdelivr CDN (core + auto `.whl` package resolution
share the same base URL); add a `apps/site/CONTRACT.md` "Pyodide CDN
hosting" invariant clause locking the version-string two-place sync
requirement; ship a CI-skipped `boot.integration.test.ts` regression
smoke that boots real Pyodide locally + executes `1+1`. PR.md
self-listed per ADR-0006 D8 + Pre-A1 → C-2 precedent.

## PLAN-time correction (orchestrator dispatch reconciliation)

The orchestrator dispatch brief listed
`apps/site/src/islands/JupyterIsland.tsx` as the modification site
under the assumption that the `new PyodideAdapter(...)` call lives in
the apps/site island. PLAN-time inspection confirms the actual call
site is **`packages/block-jupyter/src/ui-default/Jupyter.tsx:99`**
(line: `adapterRef.current = adapter ?? new PyodideAdapter({ boot: { libraries: props.libraries } });`).
The apps/site island only does the dynamic `import('@skb/block-jupyter/ui-default')`
load + wraps the `JupyterRenderView` via `makeMdxAdapter`; the
PyodideAdapter is constructed inside the block-jupyter package once
the dynamic import resolves. **Modifying `JupyterIsland.tsx` would
be a no-op for indexURL purposes** because that file does not touch
the adapter constructor. This PR therefore threads the change at the
real call site (`Jupyter.tsx`) and locks the contract clause at
`apps/site/CONTRACT.md` per orchestrator lock (apps/site is the
deployer / consumer that selects the CDN; block-jupyter remains the
agnostic building block). Reviewer + Stage 4 PRE-COMMIT CLAUDE
REVIEW: please cross-check the call-site delta against this
correction.

## files

5 canonical staged files (`Jupyter.tsx` + `boot.integration.test.ts`
+ `apps/site/CONTRACT.md` + `active.md` + this PR.md) — these are
the **explicit-file-list staging count canonical to `## executor`
Stage 5 `git diff --cached --stat`** (per ADR-0006 D8). At COMMIT
time the same staging bundle ALSO ships any C-1 codex audit archives
generated during the pipeline (`docs/audits/codex-runs/2026-05-04-C-1-*.txt`
— plan-challenger + execute + reviewer R1/R2 if any), per the
established C-2 / B6 / B7 audit-archive backfill pattern; those
archives are bundled in the same `git commit` but tracked under
the audit-log-archive convention rather than the canonical-files
list. **Canonical staged-file count = 5; final commit file count
≈ 5 + N audit archives where N = 3-5 depending on how many R-rounds
the reviewer codex needed**. Executor: `codex-generic-executor` for
the source changes (`Jupyter.tsx` + `boot.integration.test.ts`);
`orchestrator-self` for the doc syncs (`apps/site/CONTRACT.md` +
`docs/plans/active.md` + this PR.md). Per ADR-0011 D6 default
executor profile + ADR-0011 D1 stage 2 split (codex authors source;
orchestrator authors doc sync).

- `packages/block-jupyter/src/ui-default/Jupyter.tsx` — **MODIFIED**
  (~3 LOC delta at line 99). Change:
  `adapter ?? new PyodideAdapter({ boot: { libraries: props.libraries } })`
  → `adapter ?? new PyodideAdapter({ boot: { libraries: props.libraries, indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/' } })`.
  Hardcoded string literal (per Q7 absorbtion: not elevated to a
  prop in this PR; future PR may surface it as a constructor option
  if multi-CDN routing becomes a need). Pyodide's
  `loadPyodide({ indexURL })` causes both the core runtime download
  and the subsequent `pyodide.loadPackage([...libraries])` to resolve
  `.whl` files relative to the same `indexURL` base URL (verified
  via `node_modules/.pnpm/pyodide@0.27.7/` source). This is the
  Q4 absorbtion: **path-(a) naturally resolves loadPackage semantics
  because the default `packageBaseUrl` derives from `indexURL`**.

- `apps/site/CONTRACT.md` — **MODIFIED** (~8-10 LOC delta;
  net-add, no removal). Add a "Pyodide CDN hosting" invariant
  clause under `## Invariants`. Clause text (canonical wording for
  TC2 lock; EXECUTE writes byte-equivalent or close):

  ```text
  - **Pyodide CDN hosting (Jupyter heavy block)**: the apps/site
    Jupyter island (`src/islands/JupyterIsland.tsx` →
    `@skb/block-jupyter/ui-default` → `PyodideAdapter`) loads the
    Pyodide runtime + default libraries (`numpy` / `pandas` /
    `matplotlib`) from `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/`
    (jsdelivr CDN; Pyodide core + auto-resolved `.whl` packages
    share this base URL). The version segment `v0.27.7` is
    string-hardcoded at the `new PyodideAdapter({ boot: { indexURL } })`
    call site in `packages/block-jupyter/src/ui-default/Jupyter.tsx`
    and MUST stay byte-equal to the `pyodide` dependency range in
    `packages/kernel-pyodide/package.json`. Future Pyodide upgrades
    MUST update both places in the same PR (regression-grep:
    `cdn.jsdelivr.net/pyodide/v` literal must match the dep version).
    No CSP is configured at apps/site today; if a CSP is added later,
    `cdn.jsdelivr.net` must be allowlisted under `script-src` /
    `connect-src` (deferred to a CSP-introduction PR).
  ```

  This is the **Row 1 HIT** trigger — apps/site/CONTRACT.md is a
  high-risk surface per agent-contract.md, so ADR-0011 D1 stage 4
  PRE-COMMIT CLAUDE REVIEW fires after codex review (stage 3) and
  before reviewer codex commit (stage 5). Per Q9 absorbtion: the
  two-place sync requirement is the codified mitigation for version
  drift risk.

- `packages/kernel-pyodide/src/__tests__/boot.integration.test.ts`
  — **NEW** (~50-70 LOC). CI-skipped real-Pyodide boot smoke test.
  Pattern matches the existing
  `packages/kernel-pyodide/src/__tests__/matplotlib.test.ts`
  CI-skip precedent (per `feedback_wsl2_chromium_launch.md`
  + plan-challenger NICE 8 revision). Skeleton (canonical for TC3
  lock; EXECUTE writes byte-equivalent):

  ```ts
  import { describe, it, expect } from 'vitest';
  import { PyodideAdapter } from '../adapter';
  import type { KernelEvent } from '@skb/kernel-adapter';

  /**
   * Q14 absorbtion: real-Pyodide boot smoke. CI-skipped (per the
   * matplotlib.test.ts precedent + WSL2-chromium pattern), runs
   * locally on demand: `LOCAL_RUN_PYODIDE_INTEGRATION=1 \
   *   pnpm --filter @skb/kernel-pyodide test boot.integration`.
   * Defends against: (a) indexURL string drift vs Pyodide version
   * range in package.json, (b) CDN-base resolution breakage for
   * loadPackage default libs.
   */
  describe.skipIf(!process.env.LOCAL_RUN_PYODIDE_INTEGRATION)(
    'PyodideAdapter real-CDN boot integration',
    () => {
      it('boots Pyodide from jsdelivr CDN and runs `1+1` → 2', async () => {
        const adapter = new PyodideAdapter({
          boot: {
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
            libraries: [],
          },
        });
        const session = adapter.createSession('integration-smoke');
        const events: KernelEvent[] = [];
        for await (const e of session.execute('1 + 1')) {
          events.push(e);
        }
        const result = events.find((e) => e.type === 'result');
        expect(result).toBeDefined();
        if (result?.type !== 'result') throw new Error('expected result event');
        expect(String(result.data?.['text/plain'] ?? '')).toBe('2');
        await adapter.shutdown?.();
      }, 60_000);
    },
  );
  ```

  EXECUTOR NOTE: the exact `result` event shape comes from the
  existing `PyodideSession` runCode wrapper at
  `packages/kernel-pyodide/src/boot.ts` lines 71-82 (returns
  `{ 'text/plain': stringifyResult(value) }` for non-null values).
  If the executor finds the `KernelEvent` `result` shape differs
  from this skeleton at HEAD, write the assertion to match HEAD;
  the assertion intent is "real Pyodide returned 2" not the precise
  event-key path.

- `docs/plans/active.md` — **MODIFIED** (~6 LOC delta, append-only).
  C-2 row backfill (`#47 / 49557d2` — to be confirmed by
  orchestrator at COMMIT time per active.md backfill convention)
  + new C-1 row (TBD/TBD); Stage C section bullet update flipping
  C-1 from "tracked in orchestrator session backlog" to
  "in-flight (this PR)". Match the C-2 row format (PR # / squash
  HEAD / Stage / Subject).

- `docs/plans/wave-4-main/C-1-pyodide-indexurl-cdn.md` — **NEW**
  (this PR.md, self-listed per ADR-0006 D8 + Pre-A1 → C-2 precedent;
  ~400 LOC target due to embedded plan-challenger 15-Q absorbtion
  table + canonical clause/skeleton wording).

## test_cases

TDD-front per ADR-0011 D1 stage 2: tests authored OR grep-locked
**before** source change; non-empty mandatory. ALL 12 must pass at
COMMIT time (TC13 is a manual local-only verification — see note).

- **TC1** — call-site indexURL grep:
  `grep -F "cdn.jsdelivr.net/pyodide/v0.27.7/full/" packages/block-jupyter/src/ui-default/Jupyter.tsx`
  exits 0 with ≥1 hit. Locks the literal URL string at the
  `new PyodideAdapter({ boot: { ..., indexURL } })` call site.

- **TC2** — apps/site CONTRACT clause grep:
  `grep -F "Pyodide" apps/site/CONTRACT.md` and
  `grep -F "jsdelivr" apps/site/CONTRACT.md` and
  `grep -F "v0.27.7" apps/site/CONTRACT.md` each exit 0 with ≥1
  hit. Locks the contract clause keywords (avoids autolink-in-backticks
  trap per `feedback_lychee_autolink_in_backticks.md` — clause uses
  plain prose + URL-as-text inside the existing markdown structure,
  no angle-bracket-wrapped placeholder syntax inside backticks).

- **TC3** — integration test file existence + skip-pattern + CDN
  literal:
  `test -f packages/kernel-pyodide/src/__tests__/boot.integration.test.ts`
  exits 0; AND
  `grep -F "describe.skipIf" packages/kernel-pyodide/src/__tests__/boot.integration.test.ts`
  (or `it.skipIf`, whichever pattern the executor chooses to match
  the matplotlib.test.ts precedent) exits 0; AND
  `grep -F "cdn.jsdelivr.net/pyodide/v0.27.7/full/" packages/kernel-pyodide/src/__tests__/boot.integration.test.ts`
  exits 0. Locks the CI-skip flag + the mirrored URL literal (regression
  defends Q9 version-drift across both call site + smoke).

- **TC4** — kernel-pyodide vitest still green (mocked tests
  unchanged; integration test SKIPPED in vitest run by default):
  `pnpm --filter @skb/kernel-pyodide test` exits 0. The 3 existing
  test files (`adapter.test.ts` + `matplotlib.test.ts` +
  `session.test.ts`) plus the new integration test (skipped)
  must report all PASS / SKIP — no FAIL.

- **TC5** — apps/site vitest still green (10 existing corpora
  must not regress): `pnpm --filter @skb/site test` exits 0.

- **TC6** — active.md sync sub-greps:
  `grep -F "C-1" docs/plans/active.md` exits 0 with ≥1 hit
  (Stage C bullet + roster row); `grep -F "C-2" docs/plans/active.md`
  exits 0 (C-2 row backfilled with squash HEAD by orchestrator at
  COMMIT time).

- **TC7** — full-repo `pnpm check` exits 0 (lint + typecheck +
  test + build + size-check).

- **TC8** — `pnpm size-check` exits 0 (all source files under
  500 LOC hard fail; Jupyter.tsx delta is ~3 LOC, safely under
  cap).

- **TC9** — apps/site build exits 0:
  `pnpm --filter @skb/site build`. Static-build-only invariant
  preserved (no SSR introduction; Pyodide CDN load is runtime
  client-side, not build-time).

- **TC10** — link-check (CI canonical): `pnpm link-check` exits 0.
  Lychee 4-discipline pre-flight per memory:
  - **No** `path:N` line-anchor suffix on relative file links.
  - **No** angle-bracket-wrapped autolink syntax inside backticks
    (pre-empt grep before commit:
    `grep -nE '\`[^\`]*<\w+>[^\`]*\`' docs/plans/wave-4-main/C-1-pyodide-indexurl-cdn.md`
    must return empty).
  - **No** direct `npmjs.com/package/` URLs (use GitHub repo URL
    if citing a package).
  - **No** user-local `~/.claude/...` paths in markdown link form
    (use prose + tilde-path inside backticks).

- **TC11** — byte-unchanged guards across Wave 4 shipped scope
  (similar to C-2 TC8 pattern). The Jupyter.tsx delta is the only
  source change; verify Stage A + Stage B shipped surfaces are
  unchanged: `git diff --stat origin/main -- apps/site/public/sample-assets/ apps/site/src/components.ts apps/site/src/components/Jupyter.astro apps/site/src/islands/JupyterIsland.tsx packages/heavy-block-boundary/ packages/kernel-pyodide/src/adapter.ts packages/kernel-pyodide/src/boot.ts` reports zero modified files (note: `apps/site/CONTRACT.md` IS expected modified; not in this list).

- **TC12** — PR.md self-listed:
  `grep -F "wave-4-main/C-1-pyodide-indexurl-cdn.md" docs/plans/wave-4-main/C-1-pyodide-indexurl-cdn.md`
  exits 0 with ≥1 hit (the `## files` block lists this file —
  ADR-0006 D8 + Pre-A1 + C-2 precedent).

- **TC13** *(optional, manual local verification — NOT enforced
  at CI / commit time; documented for orchestrator + reviewer
  human gate)*: `LOCAL_RUN_PYODIDE_INTEGRATION=1 pnpm --filter @skb/kernel-pyodide test boot.integration`
  exits 0 + stdout contains "1 + 1" output and the test PASS line.
  Reviewer / orchestrator runs this locally once before approving
  the PR to confirm real-CDN boot still works at HEAD; see Q14
  absorbtion. WSL2 caveat: real Pyodide boot from npm + jsdelivr
  works under Node.js (no chromium dependency); this is a Node-side
  vitest run, not a Playwright run, so WSL2 chromium issues do not
  apply.

## contracts_affected

- `apps/site/CONTRACT.md` — **NET ADD** "Pyodide CDN hosting"
  invariant clause (~8-10 LOC). **Row 1 HIT**.

No other CONTRACT.md is modified. Specifically:
- `packages/block-jupyter/CONTRACT.md` is NOT modified — the change
  is a constructor-call-site argument addition (already-supported
  `boot.indexURL` option), not a contract-shape change.
- `packages/kernel-pyodide/CONTRACT.md` is NOT modified — the
  `boot.indexURL?: string` option is already declared at line 22
  (`boot?: { indexURL?: string; libraries?: readonly string[] };`).
  This PR exercises the existing surface; no new public API.

## adr_touched

None. Row 4 NO. The CDN choice is an apps/site deployment
configuration concern, not an architectural decision; the existing
ADR-0014 (heavy-block boundary) already covers the Jupyter island
hydration pattern. Future ADR may be drafted if (1) self-host /
hybrid CDN strategy becomes needed (e.g. offline-first MVP), or
(2) CSP introduction requires policy codification — but neither
applies in this PR's scope.

## D2 trigger judgment

Per ADR-0007 D2 8-row table:

| Row | Trigger | C-1 status |
|---|---|---|
| 1 | CONTRACT.md change | **HIT** — `apps/site/CONTRACT.md` adds "Pyodide CDN hosting" invariant clause (~8-10 LOC net add) |
| 2 | Package add / remove | NO — no new package, no removal; `pyodide@0.27.7` already in `packages/kernel-pyodide/package.json` |
| 3 | Type-public-surface change | NO — `boot.indexURL?: string` option is pre-existing in `PyodideBootOptions` |
| 4 | New ADR required | NO — see `## adr_touched` reasoning |
| 5 | Schema / migration | NO — no data schema, no DB |
| 6 | Cross-package move | NO — no file moves |
| 7 | Test-only / doc-only | NO — has source change at `Jupyter.tsx` |
| 8 | CI / deploy / auth / security | NO — apps/site has no CSP today; Pyodide CDN load is runtime client-side via `loadPyodide` (Pyodide internal `import()` of WebAssembly + JS chunks); no CI/CD pipeline change |

**Stage 4 PRE-COMMIT CLAUDE REVIEW: FIRES** (Row 1 HIT per
ADR-0011 D1). Other stages run normally:
1. PLAN (this PR.md, you reading it now)
2. EXECUTE (`codex-generic-executor` for source; `orchestrator-self`
   for doc sync)
3. REVIEW (`codex-pr-reviewer-55` 8-point checklist)
4. PRE-COMMIT CLAUDE REVIEW (orchestrator-self; mitigates
   same-model echo chamber on the contract clause wording +
   indexURL string)
5. COMMIT (reviewer codex; ADR-0006 D8 explicit-file-list staging)
6. ACCEPT (pr-writer second invocation; this file's `acceptance`
   block is the verification source of truth)

## acceptance

Reviewer + Stage 4 PRE-COMMIT CLAUDE REVIEW + Stage 6 ACCEPT use
this list as the canonical verification gate. Each line maps to one
or more `test_cases` entries above; Stage 6 ACCEPT runs the
`test_cases` greps + commands directly against the post-COMMIT diff.

1. **Path-(a) CDN-only locked**: the diff modifies exactly one
   source file (`packages/block-jupyter/src/ui-default/Jupyter.tsx`)
   for the indexURL thread; no `apps/site/public/pyodide/` directory,
   no `apps/site/astro.config.mjs` changes, no `vite.config.*` alias,
   no Astro hook or copy script. (Q1 + Q5 + Q8 + Q13 absorbtion
   verification.)

2. **CDN URL canonical literal**: the literal string
   `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/` appears at:
   (a) `packages/block-jupyter/src/ui-default/Jupyter.tsx` (the
   `new PyodideAdapter` call site); (b) `apps/site/CONTRACT.md`
   (the new "Pyodide CDN hosting" clause); (c)
   `packages/kernel-pyodide/src/__tests__/boot.integration.test.ts`
   (the integration smoke). Three places, byte-equal. (TC1 + TC2
   + TC3.)

3. **Version-string two-place sync codified**: the new
   `apps/site/CONTRACT.md` clause explicitly states the requirement
   that `cdn.jsdelivr.net/pyodide/v0.27.7/full/` must stay byte-equal
   to the **resolved `pyodide` version of the `packages/kernel-pyodide`
   package** (currently `pyodide@0.27.7` per `pnpm-lock.yaml`); future
   Pyodide upgrade PRs must touch both places. The `package.json`
   range (`^0.27.0`) is the upper-bound contract, NOT the authority
   for the literal CDN segment — the CONTRACT clause uses the
   lockfile-resolved version as authority. (Q9 absorbtion verification.)

4. **`boot.indexURL` option threaded, not surfaced as a prop**:
   the change is at the `new PyodideAdapter({ boot })` call site
   inside `Jupyter.tsx`; no new prop on `JupyterRenderView` or
   `JupyterIsland`. Future PR may surface as a prop if multi-CDN
   routing becomes a need; not in this PR. (Q7 absorbtion: minimal
   scope.)

5. **Pyodide auto loadPackage CDN base resolution preserved**:
   no override of `packageBaseUrl` or any related option; relying
   on Pyodide 0.27.x default behavior where `loadPyodide({ indexURL })`
   sets the same base for both core download + `loadPackage` `.whl`
   resolution. Verification: TC13 manual local run successfully
   loads `numpy` / `pandas` / `matplotlib` (default libs at
   `DEFAULT_LIBS` in `packages/kernel-pyodide/src/boot.ts:12`). (Q4
   absorbtion verification.)

6. **CI-skipped integration smoke shipped**: new file
   `packages/kernel-pyodide/src/__tests__/boot.integration.test.ts`
   exists; uses the `describe.skipIf(!process.env.LOCAL_RUN_PYODIDE_INTEGRATION)`
   pattern (or equivalent `it.skipIf` matching the matplotlib.test.ts
   precedent); does NOT run in default vitest invocation; runs
   locally with the env flag. (TC3 + TC4 + Q14 absorbtion.)

7. **No CSP touch**: no `apps/site/astro.config.mjs` CSP additions
   or `<meta http-equiv="Content-Security-Policy">` injections;
   the contract clause documents that future CSP introduction must
   allowlist `cdn.jsdelivr.net` but defers the policy itself.
   (Q10 absorbtion verification.)

8. **No bundle-byte drift on prose-only routes**: TC11 byte-unchanged
   guards confirm Stage A + Stage B shipped scope (heavy-block
   boundary core, apps/site components map, lazy-chunking grep test
   surfaces) untouched. The Jupyter chunk gains a string literal
   (~50 bytes); prose-only routes do NOT load this chunk per
   ADR-0014 v0.3 D10 hydration boundary.

9. **Wave 3 worker-host migration NOT addressed**: this PR does not
   touch `packages/kernel-pyodide/src/host.ts`,
   `boot.ts:wrapPyodide`, or any worker-related plumbing; the
   matplotlib.test.ts comment at line 84-85
   ("Wave 3 worker-isolated host will implement SharedArrayBuffer
   interrupt") is unchanged. (Q11 + Q15 absorbtion: out of scope.)

10. **`pnpm check` green at HEAD**: full pipeline (lint + typecheck
    + test + build + size-check) PASS post-merge; per
    `feedback_verification_fresh_state.md`, run with `--force`
    if turbo cache is suspected stale. (TC7 + TC8 + TC9.)

11. **Lychee 4-discipline clean**: PR.md links pass `pnpm link-check`;
    no `path:N` suffix, no angle-bracket autolink in backticks, no
    `npmjs.com/package/` URL, no user-local `~/...` markdown link.
    (TC10.)

12. **active.md sync**: `docs/plans/active.md` updated with C-2
    row backfill (orchestrator fills `#47 / 49557d2` at COMMIT) +
    new C-1 row (TBD/TBD initially); Stage C bullets reflect C-1
    in-flight status. (TC6.)

13. **PR.md self-listed**: this file appears in `## files` block.
    (TC12; ADR-0006 D8 + Pre-A1 + C-2 precedent.)

14. **plan-challenger 15-Q absorbtion table preserved verbatim**:
    `## Plan-challenger absorbtion` block in this PR.md is not
    rewritten or summarized post-PLAN; orchestrator-locked
    verdicts remain canonical. ACCEPT cross-checks the table is
    intact in the merged PR.md. (Stage 6 ACCEPT pattern.)

15. **Future enhancement hooks deferred, not deleted**:
    `## Out of scope (deferred)` block enumerates path-(b) /
    path-(c) self-host (offline-first), Wave 3 worker-host
    migration, CSP introduction, and JupyterRenderView prop
    surface elevation — all left as open backlog for subsequent
    Stage C / Wave 5 PRs. None of these are silently shipped or
    silently dropped.

## executor

- **Stage 2 EXECUTE**:
  - `codex-generic-executor` (per ADR-0011 D6 default executor for
    source change) authors:
    - `packages/block-jupyter/src/ui-default/Jupyter.tsx` delta
      (~3 LOC).
    - `packages/kernel-pyodide/src/__tests__/boot.integration.test.ts`
      NEW file.
  - `orchestrator-self` authors (matches Pre-A1 + C-2 precedent
    where orchestrator handles single-line doc sync directly):
    - `apps/site/CONTRACT.md` "Pyodide CDN hosting" clause add.
    - `docs/plans/active.md` row + bullet sync.
    - `docs/plans/wave-4-main/C-1-pyodide-indexurl-cdn.md` (this
      PR.md, already authored by `pr-writer` at PLAN; orchestrator
      may iterate post-lock).

- **Stage 3 REVIEW**: `codex-pr-reviewer-55` 8-point checklist
  (ADR-0006). Heightened scrutiny on:
  - Class 1: contract clause wording byte-exact + line-count under
    300-LOC ESLint warn.
  - Class 5: regression smoke pattern matches matplotlib.test.ts
    precedent (consistency).
  - Class 8: CDN URL byte-equality across all 3 shipped places.

- **Stage 4 PRE-COMMIT CLAUDE REVIEW** (Row 1 HIT — fires):
  orchestrator-self reads contract clause wording at HEAD vs.
  the canonical clause text in `## files` block; verifies
  `## acceptance` items 2 + 3 + 7 pre-commit; per
  `feedback_pr_reviewer_authority_at_head.md` reads the live
  defining file at HEAD (no quote-from-stale-PR.md cite).

- **Stage 5 COMMIT** (reviewer codex; ADR-0006 D8 explicit-file-list
  staging per `feedback_git_operator_explicit_stage.md`):
  ```
  git reset HEAD
  git add packages/block-jupyter/src/ui-default/Jupyter.tsx \
          packages/kernel-pyodide/src/__tests__/boot.integration.test.ts \
          apps/site/CONTRACT.md \
          docs/plans/active.md \
          docs/plans/wave-4-main/C-1-pyodide-indexurl-cdn.md
  git diff --cached --stat   # verify count == 5; lockfile NOT staged
  git commit -m "Wave 4 C-1 — Pyodide indexURL jsdelivr CDN (Jupyter MVP unblock)"
  ```
  Pre-push: uncached `pnpm typecheck` per
  `feedback_git_operator_ci_verification.md` (turbo cache + vitest
  miss tsc errors).

- **Stage 6 ACCEPT** (`pr-writer` second invocation;
  this PR.md's `## acceptance` block is the verification source of
  truth).

## Plan-challenger absorbtion

Plan-challenger 15-Q absorbtion table (orchestrator-locked verdicts).
Raw + truncated dispatch artifacts:
`/tmp/codex-runs/2026-05-04-C-1-plan-challenge.txt` (2.6 MB raw) +
`docs/audits/codex-runs/2026-05-04-C-1-plan-challenge.txt`
(273 KB truncated archive, lychee-piping per
`feedback_codex_audit_log_recursion.md`). Plan-challenger originally
recommended path-(c) hybrid (MODIFY of orchestrator's pre-rec);
orchestrator instead **locked path-(a) CDN-only** absorbing Q1 + Q4
high-strength challenges and treating MVP framing (single-user dev
flow; offline-first non-MVP) as the correct lens for path selection.

| Q | One-line | Strength | plan-challenger verdict | Orchestrator absorbtion verdict |
|---|---|---|---|---|
| Q1 | path-(a) CDN dismissal premature for single-user dev MVP | high | PARTIALLY-ABSORBED | **ABSORBED + LOCK PATH-(a)**: single-user dev flow; offline-first not an MVP requirement; defer (b)/(c) to a future PR if real need surfaces |
| Q2 | self-host Turborepo determinism unproven | high | ABSORBED | **N/A** (path-(a) does not self-host) |
| Q3 | gitignore vs commit unresolved | mid | ABSORBED | **N/A** (path-(a) does not ship assets to public/) |
| Q4 | loadPackage semantics unclear with self-host | high | ABSORBED | **ABSORBED + RESOLVED**: path-(a) naturally resolves — Pyodide indexURL CDN base covers core + `.whl` packages (default `packageBaseUrl` derives from `indexURL`) |
| Q5 | Astro hook vs site script ambiguous | mid | PARTIALLY-ABSORBED | **N/A** (path-(a) needs no copy script and no Astro hook) |
| Q6 | AC#16 does not verify Pyodide boot | mid | PARTIALLY-ABSORBED | **PARTIALLY-ABSORBED**: AC#16 hydration scope retained; Pyodide boot moved to Q14 absorbed local integration smoke (CI-skipped) |
| Q7 | indexURL typed contract input | high | ABSORBED | **PARTIALLY-ABSORBED**: this PR hardcodes the CDN URL inside `Jupyter.tsx` (minimal scope; apps-local decision); future PR can surface as a prop if multi-CDN routing surfaces as a real need |
| Q8 | bundle drift untested | low | ABSORBED | **N/A** (path-(a) adds zero `dist/` bytes; only a string literal in the Jupyter chunk source) |
| Q9 | version drift risk | high | ABSORBED | **ABSORBED**: indexURL string hardcodes `v0.27.7`; PR.md acceptance includes a "future Pyodide upgrade must sync indexURL string" cross-reference; codified in the new `apps/site/CONTRACT.md` clause |
| Q10 | CSP / SRI policy if CDN | mid | ABSORBED | **ABSORBED**: apps/site has no CSP today; the contract clause documents that future CSP hardening must allowlist `cdn.jsdelivr.net`; this PR makes NO CSP touch |
| Q11 | Wave 3 worker-host alignment | high | PARTIALLY-ABSORBED | **NOT-ABSORBED**: worker-host migration is an independent ADR scope (Q15 reasoning agreed by plan-challenger NOT-ABSORBED) |
| Q12 | LOC estimate understated | mid-high | ABSORBED | **ABSORBED + REVISED**: path-(a) actual ~80-120 LOC (not 5; not 120-175) — includes integration test + active.md + PR.md |
| Q13 | path-(d) Vite alias eval | mid | PARTIALLY-ABSORBED | **NOT-ABSORBED**: path-(a) is simple enough to not need an alias; alias is a path-(b) optimization; C-1 does not evaluate it |
| Q14 | local integration smoke for real loadPyodide | mid | ABSORBED | **ABSORBED**: NEW `packages/kernel-pyodide/src/__tests__/boot.integration.test.ts` (`describe.skipIf` matching matplotlib.test.ts pattern; main-thread boot Pyodide via CDN indexURL → run simple Python `1+1`) |
| Q15 | C-1 does not solve worker-host migration | low | NOT-ABSORBED | **NOT-ABSORBED** (orchestrator agrees with plan-challenger — worker-host migration is OUT OF SCOPE for C-1; reopen as separate ADR per Q11 + Wave 5 scope) |

## Out of scope (deferred)

The following are explicitly NOT shipped in this PR; each is a known
backlog item that may open a future Stage C / Wave 5 PR if real need
surfaces:

- **path-(b) self-host (full)**: copy `node_modules/.pnpm/pyodide@0.27.7/`
  assets to `apps/site/public/pyodide/` via Astro hook or Vite plugin;
  serve from same-origin. Reasons deferred: requires offline-first
  to be MVP; introduces Turborepo determinism question (Q2) +
  gitignore-vs-commit (Q3); larger LOC + CI surface impact. Reopen
  trigger: user asks for offline-first OR jsdelivr availability
  becomes a measured pain point.

- **path-(c) hybrid (CDN with self-host fallback)**: plan-challenger's
  recommended path. Reasons deferred: same as (b), plus extra
  fallback-routing complexity. Reopen trigger: jsdelivr outage
  becomes a real incident OR multi-region deployment requires
  per-region CDN selection.

- **CSP / SRI introduction at apps/site**: today no CSP is set; if a
  future PR adds CSP, `cdn.jsdelivr.net` must be allowlisted under
  `script-src` + `connect-src` (clause documents this requirement).

- **Wave 3 worker-host migration**: `packages/kernel-pyodide/src/boot.ts`
  `wrapPyodide` runs Pyodide on the main thread; SharedArrayBuffer
  interrupt + Worker isolation deferred to a dedicated ADR + PR
  (per Q11 + Q15 absorbtion).

- **JupyterRenderView prop surface elevation**: surfacing
  `indexURL` as a `JupyterRenderView` / `JupyterIsland` prop with
  type contract validation. Deferred until multi-CDN routing or
  per-instance override becomes a measured need (Q7 absorbtion).

- **C-3 / C-4 Stage C PRs**: PDF iframe black-screen investigation
  (C-3) + B7 chunk-leak measure & decide-optimize (C-4) — tracked
  in orchestrator session backlog; one-at-a-time per Stage C
  open-ended convention (plan-challenger Q4 absorbtion at Pre-A3).

## Related

- ADR-0006 explicit-file-list staging + 8-point reviewer checklist:
  `docs/decisions/ADR-0006-pr-gate-checklist-and-staging.md`
- ADR-0007 D2 trigger 8-row table:
  `docs/decisions/ADR-0007-job-function-codex-heavy-execution.md`
- ADR-0011 D1 linear pipeline + D6 default executor:
  `docs/decisions/ADR-0011-linear-pipeline-execution-model.md`
- ADR-0014 v0.3 heavy-block hydration boundary (Jupyter island
  context): `docs/decisions/ADR-0014-heavy-block-skeleton-states.md`
- C-2 PR.md (Stage C precedent for self-listed PR.md + active.md
  backfill row pattern):
  `docs/plans/wave-4-main/C-2-nn-viz-mlp-mnist-fixture.md`
- Pre-A1 PR.md (Pre-A → Stage C self-listed PR.md root precedent):
  `docs/plans/wave-4-main/Pre-A1-codex-runbook-yolo-tmp-piping.md`
- `apps/site/CONTRACT.md` (modification target):
  `apps/site/CONTRACT.md`
- `packages/kernel-pyodide/CONTRACT.md` (sister authority,
  unmodified): `packages/kernel-pyodide/CONTRACT.md`
- `packages/block-jupyter/CONTRACT.md` (call-site owner,
  unmodified): `packages/block-jupyter/CONTRACT.md`
- agent-contract.md single source: `agent-contract.md`
- Spec §1.8 + §3.6 + §3.12: `docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md`
- Memory `feedback_codex_audit_log_recursion.md` (audit-log
  truncation rationale for `docs/audits/codex-runs/2026-05-04-C-1-plan-challenge.txt`)
- Memory `feedback_lychee_autolink_in_backticks.md` (TC10 grep
  pre-flight pattern)
- Memory `feedback_git_operator_explicit_stage.md` (Stage 5 COMMIT
  4-step protocol)
- Memory `feedback_git_operator_ci_verification.md` (pre-push
  uncached typecheck)
- Memory `feedback_pr_reviewer_authority_at_head.md` (Stage 4
  read-at-HEAD discipline)
- Memory `feedback_verification_fresh_state.md` (`pnpm check --force`
  if turbo cache stale)
- Memory `feedback_wsl2_chromium_launch.md` (precedent for
  CI-skipped integration tests)
