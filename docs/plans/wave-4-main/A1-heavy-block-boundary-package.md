# A1 — `@skb/heavy-block-boundary` package creation

> **Wave 4 Stage A first implementation PR.** Creates the
> `packages/heavy-block-boundary/` package shell (package.json /
> tsconfig.json / CONTRACT.md / src barrel + placeholder component +
> skeleton vitest). Implements the package boundary mandated by
> [ADR-0014 D7](../../decisions/ADR-0014-heavy-block-boundary.md) and
> the consumer-side surface for [block-foundation invariant W4-1](../../../packages/block-foundation/CONTRACT.md).
> Component **body** (useEffect / AbortController / retry / a11y) is
> deferred to A2; this PR ships the shell + ADR-0014 D1 prop signature
> only. First non-bootstrap Wave 4 PR — standard ADR-0011 D1 pipeline
> (codex-generic-executor EXECUTE; codex-pr-reviewer-55 REVIEW;
> orchestrator-self PRE-COMMIT REVIEW; reviewer-codex COMMIT).

## title

Author `packages/heavy-block-boundary/` package shell — `package.json`
(name `@skb/heavy-block-boundary`, version `0.1.0`, peerDeps
`react >= 18` / `react-dom >= 18`; `@skb/design-tokens` peer dep
**deferred to A4** when CSS lands per ADR-0008 D1 dead-dep policy —
optional peer with no source import is dead per ADR-0008 D1
strict reading; codex review R1 absorbtion),
`tsconfig.json` (extends `../../tsconfig.base.json`), `CONTRACT.md`
(public surface per ADR-0014 D1 + W4-1 cross-link), `src/index.ts`
barrel exporting `HeavyBlockBoundary` + types, `src/HeavyBlockBoundary.tsx`
placeholder body (D1 signature + ADR-0014 D2 SSR skeleton DOM shape;
NO useEffect / load / retry / a11y polish — that's A2/A3 scope per
locked Wave 4 plan; `// TODO(A2)` comment marks defer point),
`src/__tests__/skeleton.test.ts` (1 trivial vitest assertion proving
harness wired) + per-package `vitest.config.ts` (graduated post-EXECUTE
per workspace precedent). Add `@skb/heavy-block-boundary`
to `apps/site/package.json` `dependencies` + 1 stub import in apps/site
source so ADR-0008 D1 dead-dep auditor sees the package as live.

## files

Modified (canonical count in line below; 2 graduated post-EXECUTE per ADR-0011 D2 v0.1.1 SOTed-discipline collateral-drift protocol: (a) `packages/heavy-block-boundary/vitest.config.ts` — codex-generic-executor surfaced that the root vitest config doesn't pick up per-package tests without a co-located `vitest.config.ts`, matching workspace precedent in all 21 existing packages; (b) `docs/plans/wave-4-main/A1-heavy-block-boundary-package.md` — PR.md self-listed per ADR-0006 D8 + Pre-A1+A2+A3 precedent that pr-writer initially omitted):

- `packages/heavy-block-boundary/package.json` — NEW. `name:
  @skb/heavy-block-boundary`, `version: 0.1.0`, `private: true`, `type:
  module`, `main: ./src/index.ts`, `types: ./src/index.ts`, `exports:
  { ".": "./src/index.ts" }`, `scripts: { build, lint, typecheck, test
  }` matching block-foundation/kernel-registry convention,
  `peerDependencies: { react: ">=18", react-dom: ">=18" }` (NO
  `@skb/design-tokens` peer in A1; deferred to A4 when CSS lands per
  ADR-0008 D1 dead-dep policy + codex review R1 Fix 2 absorbtion),
  `devDependencies: { @types/react, react, typescript ~5.6.0, vitest
  ^4.1.5 }`.
- `packages/heavy-block-boundary/tsconfig.json` — NEW. Extends
  `../../tsconfig.base.json` with `rootDir: "."` + `outDir: "dist"` +
  `include: ["src/**/*", "vitest.config.ts"]` + `references: []`
  (no workspace deps required for the shell; A4 may add `@skb/design-tokens`
  ref when CSS lands).
- `packages/heavy-block-boundary/CONTRACT.md` — NEW. Public surface
  per ADR-0014 D1: `HeavyBlockBoundary<P>` component, `HeavyBlockKindRegistry`
  interface (with `jupyter` / `nn-viz` / `agent-flow` known kinds),
  `HeavyBlockKind` branded-widening type per C6 absorbtion,
  `HeavyBlockDimensions` interface, `HeavyBlockBoundaryProps<P>`
  interface (kind / dims / load / loadingText / errorText / retryLabel
  / maxRetries / childProps / fallback / onLoadError per ADR-0014 D1).
  Invariants section is a placeholder noting "full invariants land at
  A2-A4 (mount guard / AbortSignal / SSR byte-equivalence / a11y
  semantics / reduced-motion); Wave 4 Stage A close gates them per
  ADR-0014 acceptance criteria #3-#15". Cross-link to
  `packages/block-foundation/CONTRACT.md` W4-1 invariant. Cross-link
  to ADR-0014 D1 (component API) + D7 (package ownership) + D9 (editor
  out-of-scope).
- `packages/heavy-block-boundary/src/index.ts` — NEW. Barrel:
  `export { HeavyBlockBoundary } from './HeavyBlockBoundary';` +
  `export type { HeavyBlockBoundaryProps, HeavyBlockKind,
  HeavyBlockKindRegistry, HeavyBlockDimensions } from
  './HeavyBlockBoundary';`.
- `packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx` — NEW.
  Defines all D1 types per the ADR-0014 D1 verbatim signature
  (HeavyBlockKindRegistry / HeavyBlockKind branded-widening /
  HeavyBlockDimensions / HeavyBlockBoundaryProps<P>). The
  `HeavyBlockBoundary` function component is a placeholder: render-time
  body returns the D2 SSR skeleton container DOM (matching ADR-0014 D2
  HTML shape so A2 fwd-fix doesn't churn DOM tests) WITHOUT lifecycle
  / load / retry / a11y polish. A `// TODO(A2): implement useEffect +
  AbortController + retry + a11y per ADR-0014 D3` comment marks the
  defer point. The placeholder body MUST type-check against
  `HeavyBlockBoundaryProps<P>` so consumers (A5) can already type
  against the eventual signature.
- `packages/heavy-block-boundary/src/__tests__/skeleton.test.ts` —
  NEW. 1 vitest test: `import { HeavyBlockBoundary } from '../index'`
  + `expect(HeavyBlockBoundary).toBeDefined()` + `expect(typeof
  HeavyBlockBoundary).toBe('function')`. Proves the package's vitest
  harness is wired + the barrel + the named export resolve.
- `packages/heavy-block-boundary/vitest.config.ts` — NEW. Per-package
  vitest config (`include: ['src/**/*.test.ts']`); required because
  the root vitest config defaults to `scripts/__tests__/**/*.test.ts`
  and would error "No test files found" without a per-package include.
  Matches workspace precedent (all 21 existing packages have a
  per-package `vitest.config.ts`). Surfaced by codex-generic-executor
  during A1 EXECUTE.
- `apps/site/package.json` — adds `@skb/heavy-block-boundary:
  workspace:*` to `dependencies` (alphabetically between
  `@skb/design-tokens` and `astro` per existing ordering). Required
  per ADR-0008 D1 dead-dep policy: workspace dep declared AND used.
- `apps/site/src/components.ts` — adds value import + `__A1_HEAVY_BLOCK_BOUNDARY_REF`
  module-level export (runtime reference that survives tree-shake;
  required for ironclad ADR-0008 D1 dead-dep evidence per codex
  review R1 absorbtion). A5 substitutes `makeHeavyBlockPlaceholder`
  calls with real `<HeavyBlockBoundary>` per ADR-0014 D8 and removes
  this evidence-export.
- `docs/plans/wave-4-main/A1-heavy-block-boundary-package.md` — this
  PR.md (self-listed per ADR-0006 D8 strict whitelist; PR #1 R2 lesson
  carried Wave 1+2+3 → Wave 4 Pre-A1+A2+A3).

= **10 files total** (canonical: this `## files` section).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `pnpm-lock.yaml` — auto-updated by `pnpm install` post `apps/site/package.json`
  edit + new package on workspace; expected diff bounded to (a) new
  `@skb/heavy-block-boundary` workspace project entry, (b) `apps/site`
  dep listing add. TC4 verifies. **MUST be staged at commit time per
  ADR-0006 D8** (lockfile blob discipline; explicit add per protocol).
- `packages/heavy-block-boundary/dist/**` — build output; gitignored.
- `packages/heavy-block-boundary/.turbo/**` — turbo cache; gitignored.
- (vitest.config.ts was originally listed here as "deferred"; codex
  EXECUTE found root config doesn't pick up per-package tests, so it
  GRADUATED to `## files` per acceptance bullet 11 collateral-drift
  protocol — see canonical entry in `## files` above. NOT excluded.)
- `pnpm-workspace.yaml` — already lists `packages/*` glob; no edit
  needed for new package to register.
- `tsconfig.json` (workspace root) — references via `packages/*/tsconfig.json`
  glob OR explicit list; if explicit, executor adds new entry under
  same `## files` collateral-drift protocol. Pre-flight: per
  block-foundation / kernel-registry precedent the root tsconfig does
  NOT enumerate `references` per package — verify at execute time.
- `docs/plans/active.md` — Wave 4 PR roster updated post-merge by
  orchestrator (ROUTINE post-merge bookkeeping; not part of the A1
  diff).
- `agent-contract.md` / generated configs — no agent-contract.md
  change in A1; no `pnpm generate:configs` regen.

## test_cases

A1 is package-shell creation; tests are build-system + harness
wiring + dead-dep evidence + canonical CONTRACT.md content checks.

- **TC1** (Package builds clean) Input:
  `pnpm --filter @skb/heavy-block-boundary build`. Expected: exit 0
  (`tsc -b` produces dist/ outputs without diagnostics). Location:
  shell at repo root.
- **TC2** (vitest skeleton test runs + passes) Input:
  `pnpm --filter @skb/heavy-block-boundary test`. Expected: exit 0
  with 1 passing test in `skeleton.test.ts`. Location: shell.
- **TC3** (Typecheck clean) Input:
  `pnpm --filter @skb/heavy-block-boundary typecheck`. Expected: exit 0
  (`tsc -b` no diagnostics). Location: shell.
- **TC4** (`pnpm-lock.yaml` change bounded to new package + apps/site
  dep) Input: `git diff main -- pnpm-lock.yaml`. Expected: diff
  contains exactly the new `@skb/heavy-block-boundary` workspace
  project entry + `apps/site` dependencies addition; no other dep
  versions move. Location: shell. Verification:
  `git diff main -- pnpm-lock.yaml | grep -E '^\+.*workspace:' | wc -l`
  ≥ 1 + manual scan for unrelated `+` lines.
- **TC5** (ADR-0008 D1 dead-dep evidence: declared AND used with
  tree-shake survival per codex review R1 absorbtion) Input (a):
  `grep -E '"@skb/heavy-block-boundary"' apps/site/package.json`.
  Expected: ≥ 1 hit under `dependencies`. Input (b):
  `grep -rE "from '@skb/heavy-block-boundary'" apps/site/src`.
  Expected: ≥ 1 hit (value import in `components.ts`). Input (c):
  `grep -nE '__A1_HEAVY_BLOCK_BOUNDARY_REF' apps/site/src/components.ts`.
  Expected: ≥ 1 hit (the module-level export that survives tree-shake;
  A5 removes when migrating to real consumer use). Location: shell.
- **TC6** (`package.json` declares peerDeps per ADR-0014 D7) Input:
  `grep -A6 '"peerDependencies"' packages/heavy-block-boundary/package.json | grep -cE 'react|react-dom'`.
  Expected: `≥ 2` (react + react-dom both pinned to `>=18`).
  Location: shell.
- **TC7** (CONTRACT.md cross-references ADR-0014 D1 + W4-1) Input
  (a): `grep -cE 'ADR-0014' packages/heavy-block-boundary/CONTRACT.md`.
  Expected: ≥ 2 (D1 reference + D7 / D9 reference). Input (b):
  `grep -E 'W4-1|block-foundation/CONTRACT.md' packages/heavy-block-boundary/CONTRACT.md | wc -l`.
  Expected: ≥ 1. Location: shell.
- **TC8** (`pnpm check` exit 0 globally) Input: `pnpm check`.
  Expected: exit 0 (lint + typecheck + test + build + size-check all
  pass). Location: shell.
- **TC9** (`src/index.ts` barrel exports D1 surfaces) Input:
  `grep -cE 'export (\\{ HeavyBlockBoundary|type \\{)' packages/heavy-block-boundary/src/index.ts`.
  Expected: ≥ 2 (1 value export + ≥ 1 type export line covering all 4
  types: HeavyBlockBoundaryProps / HeavyBlockKind /
  HeavyBlockKindRegistry / HeavyBlockDimensions). Location: shell.
- **TC10** (`HeavyBlockBoundary.tsx` D1 props signature present) Input:
  `grep -cE 'HeavyBlockBoundaryProps<P>|interface HeavyBlockBoundaryProps' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 1. Input (b): `grep -cE '__heavyBlockKind' packages/heavy-block-boundary/src/HeavyBlockBoundary.tsx`.
  Expected: ≥ 1 (branded widening per ADR-0014 C6 absorbtion).
  Location: shell.
- **TC11** (Idempotent install) Input: `pnpm install` × 2 (back to
  back). Expected: `git status -s pnpm-lock.yaml` after second run is
  empty. Location: shell.
- **TC12** (Link-check passes via CI) Input:
  `.github/workflows/link-check.yml` on push to feature branch
  (lychee CI-only per Wave 3 baseline). Expected: workflow `success`
  conclusion. Location: GitHub Actions.
- **TC13** (Size-check clean — package shell stays under hard limits)
  Input: `pnpm size-check`. Expected: exit 0; no file in
  `packages/heavy-block-boundary/src/` exceeds 500 LOC (placeholder
  component + tests are far under limit). Location: shell.
- **TC14** (codex-structure-auditor post-commit dead-dep audit reports
  TOTAL_VIOLATIONS = 0 for A1 PR's diff) Input: orchestrator dispatches
  `codex exec --yolo --profile codex-structure-auditor ...` post-commit
  per locked Wave 4 plan A1 `## post-PR codex audits`. Expected: audit
  log line `TOTAL_VIOLATIONS 0` (no new dead deps; new
  `@skb/heavy-block-boundary` is live in apps/site). Location: audit
  log archived to `docs/audits/codex-runs/2026-05-03-A1-structure-auditor.txt`.

## contracts_affected

- `packages/heavy-block-boundary/CONTRACT.md` — **NEW** public surface
  contract for the package mandated by ADR-0014 D7. States the D1
  component API as canonical; cross-links W4-1 invariant in
  `block-foundation/CONTRACT.md` (the partner-side invariant
  governing how heavy `kind='viz'` blocks compose with this boundary
  on the MDX/static path; editor path explicit out-of-scope per
  ADR-0014 D9). This is the **D2 row 1 trigger** for D1 stage 4
  PRE-COMMIT CLAUDE REVIEW.

## adr_touched

- None edited. **ADR-0014 referenced** (D1 component API; D7 package
  ownership; D9 editor out-of-scope; W4-1 invariant cross-link) but
  not modified. ADR-0014 status remains `proposed`; promotion
  `proposed → accepted` happens at A8 per locked Wave 4 plan Stage A
  close criterion #1.
- Per gatekeeper directive 2026-05-03 #1, this `adr_touched` field
  explicitly lists ADR-0014 even though no edits occur, since A1 is
  the first implementation PR materially advancing the ADR-0014
  acceptance criteria. Reviewers verify A1 diff aligns with ADR-0014
  D1 + D7 + D9 surface declarations.

## acceptance

1. `packages/heavy-block-boundary/` directory exists with the 7 NEW
   package files (`package.json` / `tsconfig.json` / `CONTRACT.md` /
   `vitest.config.ts` / `src/index.ts` / `src/HeavyBlockBoundary.tsx`
   / `src/__tests__/skeleton.test.ts`) — file existence verifiable
   via `ls`; TC1+TC2+TC3 also implicitly require all 7.
2. `package.json` conforms to ADR-0014 D7 contract — `name:
   @skb/heavy-block-boundary`, `version: 0.1.0`, `peerDependencies:
   { react: ">=18", react-dom: ">=18" }` (design-tokens peer deferred
   to A4 per ADR-0008 D1 dead-dep + codex review R1), scripts
   (`build` / `lint` / `typecheck` / `test`) match block-foundation
   / kernel-registry convention — TC6 evidence.
3. `tsconfig.json` extends `../../tsconfig.base.json` — inherits
   strict mode + `jsx: react-jsx` + `composite: true` for tsc -b
   refs; `references: []` in A1 (no workspace dep yet); A4 may
   add `@skb/design-tokens` reference when CSS lands.
4. `CONTRACT.md` declares the ADR-0014 D1 public surface as canonical
   (component + 4 types) + cross-references the W4-1 invariant in
   block-foundation; invariants section explicitly marks the deep
   invariants (mount guard / AbortSignal / SSR byte-eq / a11y /
   reduced-motion per ADR-0014 D3+D6) as placeholder pending A2-A4
   implementation — TC7 evidence.
5. `src/index.ts` barrel exports `HeavyBlockBoundary` value + 4 D1
   types (`HeavyBlockBoundaryProps` / `HeavyBlockKind` /
   `HeavyBlockKindRegistry` / `HeavyBlockDimensions`) — TC9 evidence.
6. `src/HeavyBlockBoundary.tsx` defines D1 types verbatim (especially
   the C6 branded widening `HeavyBlockKind = keyof
   HeavyBlockKindRegistry | (string & { __heavyBlockKind?: never })`)
   and the placeholder component is type-safe against
   `HeavyBlockBoundaryProps<P>` — TC10 evidence. Body returns
   ADR-0014 D2 SSR skeleton DOM shape (no lifecycle / no load /
   no a11y polish — TODO marker for A2).
7. `src/__tests__/skeleton.test.ts` is a passing vitest suite (1
   trivial test that imports the barrel + asserts the named export
   exists) — TC2 evidence. Proves the harness is wired so A2 can
   add the deep tests without infrastructure rework.
8. `apps/site/package.json` declares `@skb/heavy-block-boundary:
   workspace:*` in `dependencies` AND `apps/site/src/components.ts`
   has a value import + module-level export
   (`__A1_HEAVY_BLOCK_BOUNDARY_REF`) that survives tree-shake — per
   codex review R1 absorbtion, ADR-0008 D1 dead-dep policy (declared
   AND used) is satisfied with ironclad runtime evidence. Full
   consumption (replacing `makeHeavyBlockPlaceholder` with
   `<HeavyBlockBoundary>`) is **A5 scope** per ADR-0014 D8 + locked
   Wave 4 plan; A5 removes the `__A1_HEAVY_BLOCK_BOUNDARY_REF` export
   when it migrates to real consumer use — TC5 evidence.
9. Idempotent `pnpm install` — running twice produces no incremental
   `pnpm-lock.yaml` diff after the first run — TC11 evidence.
10. `pnpm check` exit 0 globally; `pnpm-lock.yaml` diff bounded to
    new package + apps/site dep entries (no unrelated dep version
    drift) — TC4 + TC8 evidence. CI link-check + agent-contract-check
    + main CI workflows all conclude `success` per Pre-A1 baseline —
    TC12 evidence.
11. **No collateral regen drift** — `git diff` after EXECUTE is
    bounded to the files canonical in `## files` (count: see canonical
    line in `## files` end-marker). Iteration log:
    - **Resolved at EXECUTE**: `packages/heavy-block-boundary/vitest.config.ts`
      graduated into `## files` (executor found root vitest config
      doesn't pick up per-package tests; matches workspace precedent
      in all 21 existing packages)
    - **Resolved at REVIEW R1**: `docs/plans/wave-4-main/A1-heavy-block-boundary-package.md`
      graduated into `## files` (codex review R1 noted PR.md
      self-listing absent per ADR-0006 D8; pr-writer omitted)
    - Workspace root `tsconfig.json` `references` not touched (verified
      EXECUTE; per block-foundation / kernel-registry precedent the
      root does not enumerate packages explicitly)
    - `pnpm-workspace.yaml` not touched (already includes `packages/*`;
      verified post-install)
12. **Post-commit codex-structure-auditor dispatch**: orchestrator
    dispatches `codex exec --yolo --profile codex-structure-auditor`
    per locked Wave 4 plan A1 `## post-PR codex audits`; audit log
    archived per Pre-A1 R7 piping (`/tmp/codex-runs/...` raw +
    `docs/audits/codex-runs/2026-05-03-A1-structure-auditor.txt`
    truncated head -2000); audit reports `TOTAL_VIOLATIONS 0` —
    TC14 evidence.
13. PR.md (`docs/plans/wave-4-main/A1-heavy-block-boundary-package.md`)
    is self-listed in the staged file list at commit time per
    ADR-0006 D8 strict whitelist (PR #1 R2 lesson; carried through
    Wave 3 + Pre-A1+A2+A3).
14. Post-merge orchestrator updates `docs/plans/active.md` Wave 4 PR
    roster (A1 row from TODO → done); ROUTINE bookkeeping NOT in the
    A1 diff per locked plan structure.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT change): **HIT** — `packages/heavy-block-boundary/CONTRACT.md`
  is NEW (the public-surface contract for ADR-0014 W4-1 invariant
  consumer-side). This is the **D1 stage 4 PRE-COMMIT CLAUDE REVIEW
  trigger**.
- **Row 2** (package add/remove): **flag-only** — A1 adds the
  `@skb/heavy-block-boundary` package (workspace count 22→23). Per
  ADR-0011 D1 + locked Wave 4 plan + plan-challenger Q5 absorbtion,
  Stage 4 is NOT triggered by Row 2 in isolation; the flag is
  recorded in this section so codex-pr-reviewer-55 + ADR-0008 D1
  dead-dep auditor can apply heightened scrutiny within stage 3
  (package addition class) without escalating to stage 4.
- **Row 4** (new ADR required): **NO** — ADR-0014 was already locked
  at Pre-A2 (proposed status); no new ADR. Promotion to accepted is
  A8 scope.
- **Row 5** (cross ≥ 3 packages): **NO** — A1 touches the new
  `packages/heavy-block-boundary/` package + `apps/site/` dep
  declaration + 1-line stub import (= 2 packages). Below threshold.
- **Row 8** (CI / build / deploy / auth / security): **NO** — pure
  package shell + dep wiring; no CI workflow / deploy / auth / security
  surface change.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 1 HIT, NEW
CONTRACT.md is the meta-class architectural surface mandating
mitigation against same-model echo-chamber on the package-public-API
boundary that defines Wave 4 Stage A consumer integration).

## executor

Standard ADR-0011 D1 pipeline (NOT bootstrap-flavored). First
non-bootstrap Wave 4 PR — codex-generic-executor handles EXECUTE per
locked Wave 4 plan A1 `executor:` field + ADR-0011 D6 default.

- **PLAN**: `pr-writer` Claude subagent (this PR.md authored by
  pr-writer first invocation; orchestrator iterates 0-2 rounds before
  lock per ADR-0011 D1 stage 1 standard flow).
- **EXECUTE**: `codex-generic-executor` (gpt-5.5 + workspace-write
  sandbox per ADR-0011 D6 + Pre-A1-codified `--yolo` flag + R7 piping).
  Dispatch invocation:
  `codex exec --yolo --profile generic-executor "<prompt referencing
  this PR.md>" < /dev/null 2>&1 | tee /tmp/codex-runs/2026-05-03-A1-generic-executor.txt`.
  Audit log archived per Pre-A1 R7 flow (head -2000 → `docs/audits/codex-runs/`).
  Executor reads PR.md `## files` + `## test_cases` + `## acceptance`,
  authors the files (canonical count in `## files`), runs vitest +
  typecheck + build + lint locally, reports back with TC1-TC11 + TC13
  results.
- **REVIEW**: `codex-pr-reviewer-55` (ADR-0011 D1 stage 3 default
  reviewer; ADR-0006 8-point checklist mandatory). Audit log:
  `/tmp/codex-runs/2026-05-03-A1-pr-reviewer-55.txt` raw +
  `docs/audits/codex-runs/2026-05-03-A1-pr-reviewer-55.txt`
  truncated. Reviewer hunts especially for: (a) ADR-0008 D1 dead-dep
  evidence (TC5), (b) ADR-0014 D1 prop signature byte-equivalence
  with the ADR text, (c) C6 branded-widening type structure, (d)
  W4-1 cross-link in CONTRACT.md, (e) Row 2 package-add class blast
  radius scan per ADR-0011 D1 high-risk-class addendum.
- **PRE-COMMIT CLAUDE REVIEW**: `orchestrator-self` (D2 row 1 HIT —
  NEW CONTRACT.md). Independent walk against `## acceptance` bullets
  1-14; verify TC1-TC14 pass; specifically confirm CONTRACT.md
  cross-link to W4-1 + ADR-0014 D1 prop signature alignment with the
  ADR text + branded-widening syntax.
- **COMMIT (+ push)**: **reviewer codex** commits per ADR-0011 D1
  stage 5 (NOT orchestrator-self per ADR-0011 D1 + plan-challenger C6
  absorbtion). Reviewer applies ADR-0006 D8 explicit-file-list staging
  (`git reset HEAD` → `git add <files per ## files canonical list +
  pnpm-lock.yaml>` → `git diff --cached --stat` verify staged count
  matches `## files` canonical + 1 (lockfile) → `git commit` →
  `git push`). Reviewer is responsible for ensuring
  pnpm-lock.yaml is staged (TC4 lockfile blob discipline; memory
  `feedback_git_operator_explicit_stage`).
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per
  ADR-0011 D1 stage 6). Verifies the actual diff against the locked
  `## acceptance` block; flags scope creep (extra files) or scope drop
  (missing files); outputs ACCEPT or REJECT-with-residue. Residue
  list flows back to orchestrator for follow-up sequencing.

## Out-of-scope (explicitly deferred)

- **A2** — `HeavyBlockBoundary` core lifecycle: `useEffect` mount /
  `AbortController` + `mountedRef` mount-guard / load() resolve+reject
  paths / state machine (skeleton → loaded → error). A1 ships only
  the D1 prop signature + placeholder body returning ADR-0014 D2 SSR
  shape.
- **A3** — Retry flow: retry button + maxRetries bound + skeleton
  restoration between attempts + `onLoadError(err, attempt)` telemetry
  hook wiring. ADR-0014 D3 + AC#7-#9 covered at A3.
- **A4** — CSS / a11y polish: `heavy-block-skeleton.css` consuming
  `@skb/design-tokens` CSS variables (D6) + `role="status"` /
  `aria-busy` / `aria-live="polite"` semantics (D2 + C2 absorbtion) +
  `prefers-reduced-motion` rule (AC#14). May add `@skb/design-tokens`
  to package-level deps + tsconfig refs at A4.
- **A5** — apps/site migration: replace `makeHeavyBlockPlaceholder`
  factory calls with `<HeavyBlockBoundary>` invocations + import
  `heavyBoundaryDimensions` from each heavy block ui-default per
  ADR-0014 D5 + D8.
- **A6** — Playwright T0/T1 layout-shift validation per AC#5
  (gatekeeper smoke #10 core mandate).
- **A7** — `*.astro` SSR variants 5× consolidation (Wave 3 C4a/C4b
  carry-over).
- **A8** — Phase 2 selective per-block chunking + perf baseline
  (C5 carry-over) **+ ADR-0014 promotion `proposed` → `accepted`**
  in same A8 commit (Stage A close gate per gatekeeper directive #3).
- **Heavy block side**: `heavyBoundaryDimensions: HeavyBlockDimensions`
  exports from each `packages/block-{jupyter,nn-viz,agent-flow}/`
  ui-default per ADR-0014 D5. **A5 scope**, not A1.
- **Editor (Tiptap NodeView) consumption**: ADR-0014 D9 explicit
  out-of-scope; editor stays unwrapped unless caller opts in. CONTRACT.md
  notes this.
- **Pre-wrapped helper exports** (`<Kind>RenderViewWithBoundary`)
  from heavy block packages per ADR-0014 D4 — discretionary future
  contribution; not pre-locked.
- **Per-token CSS variable additions** to `@skb/design-tokens` —
  ADR-0014 D6 leaves discretionary; A4 may add 1-2 (skeleton-bg /
  spinner-track / spinner-fg) if not already present.

## Related

- [ADR-0014 D1 + D7 + D9 + W4-1](../../decisions/ADR-0014-heavy-block-boundary.md)
  — the ADR mandating this package shell; D1 = component API canonical
  source; D7 = NEW package ownership; D9 = editor consumer scope
  out-of-scope explicit language; W4-1 = invariant cross-link target
  in block-foundation/CONTRACT.md.
- [packages/block-foundation/CONTRACT.md W4-1 invariant](../../../packages/block-foundation/CONTRACT.md)
  — partner-side invariant from Pre-A2; A1 CONTRACT.md cross-references
  this for the consumer-side surface contract.
- [Locked Wave 4 plan Stage A § A1](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
  — the planning source-of-truth for A1 scope (file-count and
  D2-trigger-row state per `## files` + `## D2 trigger judgment`
  canonical sections of this PR.md).
- [ADR-0011 D1 standard pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — A1 is the first non-bootstrap Wave 4 PR exercising the standard
  D1 stages 1-6 (PLAN pr-writer / EXECUTE codex-generic-executor /
  REVIEW codex-pr-reviewer-55 / PRE-COMMIT CLAUDE REVIEW orchestrator
  / COMMIT reviewer-codex / ACCEPT pr-writer).
- [ADR-0011 D2 v0.1.1 SOTed-PR.md amendment](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — schema discipline applied to this PR.md (single canonical fact
  per section; cross-reference rather than duplicate).
- [ADR-0008 D1 dead-dep policy = tighten](../../decisions/ADR-0008-wave-2-entry-policies.md)
  — TC5 + acceptance bullet 8 evidence target; the apps/site stub
  import + dep declaration honors this policy.
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — reviewer-codex commit phase staging discipline for A1.
- [Pre-A2 PR.md](./Pre-A2-adr-0014-heavy-block-boundary.md) — locked
  ADR-0014 + W4-1 in block-foundation; A1 implements the consumer-side.
- [Pre-A3 PR.md](./Pre-A3-plan-lock.md) — locked Wave 4 plan; A1 is
  the first PR after bootstrap that the plan unlocked.
- [Pre-A1 PR.md](./Pre-A1-codex-runbook-yolo-tmp-piping.md) — codified
  `--yolo` + `/tmp` piping + `set -o pipefail` disciplines applied
  to all A1 codex dispatches (executor + reviewer + post-commit
  structure auditor).
