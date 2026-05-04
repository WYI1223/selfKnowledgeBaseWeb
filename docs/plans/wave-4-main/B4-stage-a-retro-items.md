# B4 — Stage A retrospective items 2 + 3 + 4 (cast asymmetry codify + UIDefault casing rename + ESLint argsIgnorePattern)

> **Wave 4 Stage B FIFTH implementation PR** of the re-locked 8-PR
> sequence (B1a → B1b → B2 → B3 → **B4** → B5 → B7 → B6; see Wave 4
> plan v0.2.1 Amendment Driver 1+2 + active.md roster). B1a (squash
> `1aa2811`; PR #39), B1b (squash `5ec7123`; PR #40), B2 (squash
> `317dda3`; PR #41), B3 (squash `5d49240`; PR #42) merged 2026-05-03;
> B4 batches 3 of the 6 Stage A retrospective items (items 2 + 3 + 4;
> items 5 + 6 already closed in Wave 3 per Wave 4 plan v0.2.1 Driver 1
> retro roster). **D2 row 1 trigger HIT** (`packages/editor-shell/CONTRACT.md`
> change codifying the 5/3 cast asymmetry as a first-class type-variance
> note; `## D2 trigger judgment` below); stage 4 PRE-COMMIT CLAUDE
> REVIEW **DOES** fire (similar to B1a + B1b structure). Out of scope:
> see `## Out of scope (deferred)` — B5 + B7 + B6 PRs all deferred per
> Wave 4 plan v0.2.1 roster.

## title

Codify Wave 3 Stage A A3 R3 / R4 / R6 retrospective items 2-4 in a
single small batch PR:

1. **Item 2 — Cast asymmetry codify (editor-shell CONTRACT.md)**:
   the existing JSDoc on `packages/editor-shell/src/registerBlocks.ts`
   lines 20-27 (5 cast / 3 no-cast asymmetry between the 8 block
   ui-defaults under `exactOptionalPropertyTypes:true`) is **today
   only documented inline at the call site**. B4 promotes this from
   inline JSDoc to a first-class "Type variance note" section in
   `packages/editor-shell/CONTRACT.md` so future contributors find
   it during contract review (the canonical pattern reference that
   all 8 block-* packages would link to). The asymmetry: 5 of 8
   ui-defaults (`callout` / `code` / `image` / `math` / `pdf`) need
   `XxxUiDefault as unknown as BlockUIDefinition` because their
   `BlockUIDefinition<typeof xxxCore.propsSchema>` narrow-schema
   ComponentType isn't assignable to `BlockUIDefinition` (wide-schema
   `ZodTypeAny`) due to React `ComponentType` contravariance under
   `exactOptionalPropertyTypes:true`; the remaining 3 (`jupyter` /
   `nn-viz` / `agent-flow`) use a wider component-type signature
   that satisfies the variance directly — no cast required (ESLint's
   `no-unnecessary-type-assertion` would flag any cast added there
   as a no-op). Documented as a **structural property** of the 8
   blocks' EditorView/RenderView signatures, not a workaround.

2. **Item 3 — UIDefault casing coordinated rename (3 packages →
   majority `Ui` form)**: today the 8 block packages mix two casing
   conventions for their default ui export — 5 use lowercase `Ui`
   (`mathUiDefault` / `pdfUiDefault` / `jupyterUiDefault` /
   `nnVizUiDefault` / `agentFlowUiDefault`); 3 use uppercase `UI`
   (`calloutUIDefault` / `codeUIDefault` / `imageUIDefault`). Wave
   3 A3 retrospective surfaced the inconsistency at R6; Wave 4 B4
   picks the **majority `Ui` form** as the canonical casing and
   migrates the 3 minority uppercase exports to it. Cross-package
   coordination: 3 source `index.ts` exports + 3 block-* test files
   (`__tests__/ui-default.test.tsx` × 3) + 3 block-* CONTRACT.md
   prose lines + `packages/editor-shell/src/registerBlocks.ts`
   imports + usages. Verified PLAN-time NO `apps/site` references
   (grep returned 0) and NO `apps/api` / `scripts/` references
   (grep returned 0). The `packages/block-foundation/src/__tests__/registry.test.ts`
   declares a LOCAL `const calloutUIDefault = defineUI(...)` test
   fixture (NOT a consumer of the renamed export) — out of scope;
   stays unchanged. The `packages/block-foundation/RFC.md` is an
   archival design doc — out of scope; stays unchanged.

3. **Item 4 — ESLint `argsIgnorePattern: '^_'`**: today the root
   `eslint.config.js` does NOT set
   `@typescript-eslint/no-unused-vars` explicitly, falling back to
   `tseslint.configs.recommendedTypeChecked` defaults. This means
   common JS/TS conventions like `function fn(_unused, used) { ... }`
   to silence intentionally-unused arg warnings do NOT work as
   convention expects (TS no-unused-vars defaults match `_` only
   when explicitly configured via `argsIgnorePattern: '^_'`). B4
   adds an explicit
   `@typescript-eslint/no-unused-vars: ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }]`
   rule to the type-aware files block at `eslint.config.js`. This
   is a **purely additive lint UX improvement** — no existing code
   today uses `_`-prefix args (verified PLAN-time grep), so the
   rule is forward-compatible with no migration cost.

Backfill `docs/plans/active.md` B3 row (`#42 | 5d49240 | B3 |
__test_cjk__ partial relocation (notes index filter; preserve
PageFind coupling)`) + add B4 row. PR.md self-listed per ADR-0006
D8 + Pre-A1 → B3 precedent.

## files

12 canonical files + COMMIT-time +B3-orphan-leftover (1; B3 stage 5
commit log not committed in B3 PR per orphan-back-fill precedent
established at B1b/B2/B3) + B4 reviewer audit archives (1-2; R1 always;
R2 if needed); **13-14 files total at commit**. orchestrator-self
EXECUTE for the small batch + cross-package rename + JSDoc/CONTRACT
prose (matches B3's small-batch precedent; modest cross-package fan-out
+ no plan-challenger absorbtion needed because the brief is concrete).
NO `package.json` / `pnpm-lock.yaml` change (no new deps; pure rename
+ ESLint rule addition + CONTRACT prose). NO `apps/site/astro.config.mjs`
change. NO `apps/api/` change.

1. `packages/editor-shell/CONTRACT.md` — **MODIFIED** (~30 LOC
   delta; item 2). EXECUTE adds a NEW `## Type variance note`
   section between the existing `## Public surface` and `## Wave 3
   Stage A expansion outline` sections, codifying the 5/3 cast
   asymmetry between the 8 block ui-defaults. Section content
   (canonical prose; load-bearing for item 2):
   - Lists the 5 cast-required blocks (callout / code / image /
     math / pdf) with the canonical cast form
     `XxxUiDefault as unknown as BlockUIDefinition`.
   - Lists the 3 no-cast blocks (jupyter / nn-viz / agent-flow)
     using a wider component-type signature that satisfies
     `BlockUIDefinition<ZodTypeAny>` directly.
   - Cites the **root cause**: React `ComponentType` contravariance
     on the `props` parameter under `exactOptionalPropertyTypes:true`
     — narrow-schema `BlockUIDefinition<typeof xxxCore.propsSchema>`
     isn't structurally assignable to wide-schema
     `BlockUIDefinition` (which uses `ZodTypeAny` per
     `block-foundation`'s public surface).
   - Notes the **invariant**: ESLint's
     `no-unnecessary-type-assertion` would flag any cast added to
     the 3 no-cast blocks as a no-op — so the 5/3 split is
     enforced by lint, not just convention. TC8 verifies the
     `## Type variance note` section is present + load-bearing
     prose strings appear.

2. `packages/block-callout/src/ui-default/index.ts` — **MODIFIED**
   (item 3; ~1 LOC delta). EXECUTE renames the named export
   `calloutUIDefault` → `calloutUiDefault` (lowercase `i`).
   Line 6 today: `export const calloutUIDefault: BlockUIDefinition<...>=`
   becomes `export const calloutUiDefault: BlockUIDefinition<...>=`.
   No other file in `packages/block-callout/src/ui-default/`
   references this export by name (verified PLAN-time;
   `EditorView.tsx` / `RenderView.tsx` / `CalloutBody.tsx` /
   `variant-tokens.ts` / `icons.ts` import other named exports
   only; the const name is local to `index.ts` definition + 1
   downstream test consumer + 1 cross-package consumer at
   `editor-shell/registerBlocks.ts`).

3. `packages/block-callout/src/__tests__/ui-default.test.tsx` —
   **MODIFIED** (item 3 consumer; ~7 LOC delta). EXECUTE renames
   8 in-test references to `calloutUIDefault` → `calloutUiDefault`:
   - line 6 (named import)
   - line 15 (describe block label)
   - lines 17-20 (4× `calloutUIDefault.coreName` etc.)
   - line 26 (`reg.registerUI(calloutUIDefault as unknown as ...)`)
   - lines 27-28 (`expect(reg.getUI('callout')).toBe(calloutUIDefault)`)

4. `packages/block-callout/CONTRACT.md` — **MODIFIED** (item 3
   doc consumer; ~2 LOC delta). EXECUTE renames 2 in-CONTRACT
   prose references:
   - line 17 (Public surface bullet:
     `calloutUIDefault: BlockUIDefinition<typeof calloutCore.propsSchema>` →
     `calloutUiDefault: BlockUIDefinition<typeof calloutCore.propsSchema>`)
   - line 53 (Invariants bullet:
     `calloutUIDefault.uiId === 'default'` →
     `calloutUiDefault.uiId === 'default'`)

5. `packages/block-code/src/ui-default/index.ts` — **MODIFIED**
   (item 3; ~1 LOC delta). EXECUTE renames `codeUIDefault` →
   `codeUiDefault` at line 6.

6. `packages/block-code/src/__tests__/ui-default.test.tsx` —
   **MODIFIED** (item 3 consumer; ~7 LOC delta). EXECUTE renames
   8 in-test references to `codeUIDefault` → `codeUiDefault`
   (parallel structure to file #3).

7. `packages/block-code/CONTRACT.md` — **MODIFIED** (item 3 doc
   consumer; ~1 LOC delta). EXECUTE renames 1 in-CONTRACT prose
   reference at line 16 (Public surface bullet:
   `codeUIDefault: BlockUIDefinition<...>` →
   `codeUiDefault: BlockUIDefinition<...>`).

8. `packages/block-image/src/ui-default/index.ts` — **MODIFIED**
   (item 3; ~1 LOC delta). EXECUTE renames `imageUIDefault` →
   `imageUiDefault` at line 6.

9. `packages/block-image/src/__tests__/ui-default.test.tsx` —
   **MODIFIED** (item 3 consumer; ~7 LOC delta). EXECUTE renames
   8 in-test references to `imageUIDefault` → `imageUiDefault`
   (parallel structure to file #3).

10. `packages/block-image/CONTRACT.md` — **MODIFIED** (item 3
    doc consumer; ~2 LOC delta). EXECUTE renames 2 in-CONTRACT
    prose references at lines 17 + 44.

11. `packages/editor-shell/src/registerBlocks.ts` — **MODIFIED**
    (item 3 cross-package consumer; ~6 LOC delta). EXECUTE renames
    3 imports + 3 usages:
    - line 3: `import { calloutUIDefault } from '@skb/block-callout/ui-default'`
      → `import { calloutUiDefault } from '@skb/block-callout/ui-default'`
    - line 5: `codeUIDefault` → `codeUiDefault`
    - line 7: `imageUIDefault` → `imageUiDefault`
    - line 29: `registry.registerUI(calloutUIDefault as unknown as BlockUIDefinition)`
      → `registry.registerUI(calloutUiDefault as unknown as BlockUIDefinition)`
    - line 32: `codeUIDefault` → `codeUiDefault`
    - line 35: `imageUIDefault` → `imageUiDefault`

12. `eslint.config.js` — **MODIFIED** (item 4; ~3 LOC delta).
    EXECUTE adds an explicit
    `@typescript-eslint/no-unused-vars` rule to the type-aware
    files block (the existing `rules:` object inside the
    `apps/**/*.{ts,tsx}` / `packages/**/*.{ts,tsx}` /
    `scripts/**/*.ts` block, alongside `max-lines` + `no-console`):
    ```js
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],
    ```
    Single rule addition; no existing rule overridden; no other
    eslint config block touched.

13. `docs/plans/active.md` — **MODIFIED** (~3 LOC delta).
    - **B3 row backfill**: existing
      `| #TBD (this) | TBD | B3 | content/notes/__test_cjk__
      relocation (notes index filter; partial impl of ADR-0013 D3;
      preserves PageFind coupling for B1b paired discriminator
      test) |` row at line 26 →
      `| #42 | 5d49240 | B3 | content/notes/__test_cjk__ relocation
      (notes index filter; partial impl of ADR-0013 D3; preserves
      PageFind coupling for B1b paired discriminator test) |`
      (B3 PR #42 squash `5d49240` per the conversation context;
      orchestrator verifies the canonical PR# + commit-hash by
      running `gh pr list --state merged --limit 5` + `git log
      --oneline -5` at EXECUTE-time before backfilling).
    - **NEW B4 row**: append after B3 row + before Stage A summary
      row: `| #TBD (this) | TBD | B4 | Stage A retro items 2 + 3
      + 4 (cast asymmetry codify + UIDefault casing rename + ESLint
      argsIgnorePattern) |` (backfilled at NEXT PR per the
      one-row-per-PR cadence).

14. `docs/plans/wave-4-main/B4-stage-a-retro-items.md` — **NEW**
    (this PR.md, self-listed per ADR-0006 D8 + Pre-A1 → B3
    precedent; pr-writer must include the PR.md in the canonical
    `## files` list at PLAN time). ~600 LOC final (PR.md exempt
    from the 200 LOC target per ADR-0011 D2 v0.1.1 + memory
    `feedback_soted_pr_md_discipline`).

15. `docs/audits/codex-runs/2026-05-03-B3-commit.txt` — **NEW**
    (B3 stage 5 commit log; B3-leftover orphan back-fill per
    B1b/B2/B3 precedent established at Stage B mid-PR cadence).
    Truncated head -2000 archive of the B3 reviewer-codex commit
    transcript.

> Files 1-14 are PLAN-canonical (12 listed in orchestrator brief
> + active.md + this PR.md self-list); file 15 is the B3-leftover
> orphan (matches B3's identical pattern with 2026-05-03-B2-commit.txt).
> COMMIT adds 1-2 audit archives (B4 reviewer R1; R2 if needed)
> for **13-14 files total at commit**. The 3 block-* CONTRACT.md
> files (#4, #7, #10) are PLAN-time additions to the orchestrator
> brief's canonical 12 — pre-empting the predictable reviewer
> R1 push-back ("if you renamed the const, also rename the doc
> reference") and saving 1 R2 round.

## test_cases

B4 ships **0 NEW vitest unit suites** (a casing rename + JSDoc
promotion + ESLint rule addition do not require new test code;
the existing test suite at the 3 affected block packages already
covers the regression surface — the 3 `__tests__/ui-default.test.tsx`
files import + assert the renamed exports, so a successful test
run after the rename verifies both the rename consistency AND the
unchanged behavior). TDD-front discipline (per ADR-0011 D1 stage 2
+ memory `feedback_soted_pr_md_discipline`) for a rename PR means
**verifying the existing tests pass against the renamed exports**
+ **typecheck workspace-wide validates cross-package import
resolution** before committing. Order: TC1 grep rename completeness
→ TC2-TC3 type/lint workspace-wide → TC4 test all packages → TC5
build clean → TC6 workspace check → TC7-TC10 byte-unchanged guards
→ TC11 PR.md self-listed → TC12 ESLint rule effect → TC13 CONTRACT
section presence.

Test verification triplets (input → expected → location):

- **TC1** (rename completeness — no `UIDefault` references remain
  in source / tests across the 3 affected packages + editor-shell):
  Input:
  `grep -rn "calloutUIDefault\|codeUIDefault\|imageUIDefault"
  packages/block-callout/src/ packages/block-code/src/
  packages/block-image/src/ packages/editor-shell/src/`.
  Expected: 0 matches. Location: shell at repo root. Confirms the
  rename is **complete** across the 3 source ui-default exports +
  3 test files + 1 cross-package consumer (`registerBlocks.ts`).
  **Negative-form check** (rename actually applied): 
  `grep -rn "calloutUiDefault\|codeUiDefault\|imageUiDefault"
  packages/block-callout/src/ packages/block-code/src/
  packages/block-image/src/ packages/editor-shell/src/` returns
  ≥ 13 matches (3 source defs + 8 per-test-file × 3 = 24 + 3
  imports + 3 usages in registerBlocks). Adjusted lower bound:
  ≥ 30 matches across affected files.

- **TC2** (apps/site + workspace typecheck clean — load-bearing
  for cross-package import resolution): Input: `pnpm typecheck`
  (workspace-wide, including apps/site `astro check && tsc
  --noEmit`). Expected: exit 0. Location: same. Confirms (a) the
  3 renamed exports resolve at their consumer call site
  (`registerBlocks.ts`); (b) the 3 in-test imports resolve at the
  3 test files; (c) no other workspace consumer breaks (verified
  PLAN-time via cross-package grep returning 0 apps/site matches
  + 0 apps/api matches + 0 scripts/ matches). The cross-package
  `@skb/block-callout/ui-default` / `@skb/block-code/ui-default`
  / `@skb/block-image/ui-default` subpath exports continue to
  resolve identically (the ui-default subpath maps to
  `src/ui-default/index.ts`; only the named export inside
  changed; the package.json `exports` field is unaffected).

- **TC3** (workspace lint clean — verifies item 4 ESLint rule
  addition compiles + no new violations + no unused-vars
  regression on existing code): Input: `pnpm lint`. Expected:
  exit 0. Location: same. Confirms (a) the new
  `@typescript-eslint/no-unused-vars` rule loads + parses without
  error (the `eslint.config.js` syntax accepts the rule object);
  (b) no existing source file fails the new rule (no unused-args
  + no unused-vars at warn-level; verified PLAN-time the
  workspace has no `_unused` arg patterns yet — so the rule is
  purely forward-compat). If a hidden unused arg surfaces during
  EXECUTE TC3, orchestrator either prepends `_` to the arg name
  inline (ESLint convention) OR adds an inline
  `// eslint-disable-next-line @typescript-eslint/no-unused-vars`
  with prose justification — forward-fix scope ≤ 5 LOC.

- **TC4** (workspace test suite regression-free): Input:
  `pnpm test` (workspace-wide). Expected: exit 0. Location: same.
  Confirms (a) the 3 affected block packages' `ui-default.test.tsx`
  suites pass against the renamed exports; (b) the
  `@skb/block-foundation/src/__tests__/registry.test.ts` passes
  unchanged (its local `calloutUIDefault` test fixture is
  out of scope; the rename does NOT touch
  `block-foundation/src/__tests__/registry.test.ts` — verified
  PLAN-time the local const declaration at line 19 is independent
  of the renamed cross-package exports); (c) no other test file
  in the workspace references the 3 renamed exports (verified
  PLAN-time grep returned 0 apps/site / scripts / docs matches
  for both old + new names).

- **TC5** (workspace build clean): Input: `pnpm build`. Expected:
  exit 0. Location: same. Confirms the 3 affected block packages'
  `dist/` builds (tsup) emit the renamed export at the same
  subpath, AND `editor-shell/dist/` builds with the renamed
  imports. apps/site Astro build emits unchanged (no apps/site
  consumer references the 3 renamed exports).

- **TC6** (workspace check exit 0 globally — workspace-wide
  regression baseline): Input: `pnpm check`. Expected: exit 0
  (lint + typecheck + test + build + size-check workspace-wide;
  40/40 PASS). Location: same. B4's deltas are surgical (3 source
  rename + 3 test rename + 3 doc rename + 1 cross-package
  consumer rename + 1 ESLint rule addition + 1 CONTRACT section
  promotion); no other package's test breaks.

- **TC7** (B1a + B1b + B2 + B3 shipped files byte-unchanged):
  Input:
  `git diff main -- apps/site/src/lib/word-level-match.ts
  apps/site/src/__tests__/word-level-match.test.ts
  apps/site/src/components/SearchBox.astro
  apps/site/playwright/search.spec.ts
  apps/site/src/__tests__/search-cjk.test.ts
  apps/site/CONTRACT.md
  docs/decisions/ADR-0012-search-index-stack.md
  apps/site/public/sample-assets/diagram-small.png
  apps/site/public/sample-assets/figure-1.png
  apps/site/public/sample-assets/whitepaper.pdf
  apps/site/public/favicon.ico
  content/notes/sample-blocks/index.mdx
  apps/site/src/pages/index.astro`.
  Expected: empty diff. B4 must NOT regress any earlier Stage B
  PR; explicitly includes the B3-shipped index-page filter
  byte-unchanged guard.

- **TC8** (CONTRACT.md `## Type variance note` section presence
  + load-bearing prose strings — verifies item 2 codification
  applied): Input:
  `grep -c "## Type variance note" packages/editor-shell/CONTRACT.md`
  ≥ 1 AND
  `grep -c "ComponentType contravariance" packages/editor-shell/CONTRACT.md`
  ≥ 1 AND
  `grep -c "exactOptionalPropertyTypes" packages/editor-shell/CONTRACT.md`
  ≥ 1 AND
  `grep -cE "5 of 8|five of eight" packages/editor-shell/CONTRACT.md`
  ≥ 1. Expected: each grep returns ≥ 1. Location: same. Confirms
  the new section lands with the load-bearing prose strings (root
  cause + structural cardinality).

- **TC9** (active.md B3 backfill + B4 row insertion):
  (a) `grep -c '#42' docs/plans/active.md` ≥ 1;
  (b) `grep -c '5d49240' docs/plans/active.md` ≥ 1;
  (c) `grep -c '| B3 |' docs/plans/active.md` ≥ 1 (the row exists
  at HEAD post-B3-merge; B4 only flips PR# + commit hash);
  (d) `grep -c '| B4 |' docs/plans/active.md` ≥ 1 (NEW row);
  (e) the count of rows in the Wave 4 PR roster table grew by
  exactly 1 vs main HEAD pre-B4.

- **TC10** (B5 + B7 + B6 scope files byte-unchanged + lockfile +
  package.json):
  Input:
  `git diff main -- apps/site/src/components/Jupyter.astro
  apps/site/src/components/NnViz.astro
  apps/site/src/components/AgentFlow.astro
  apps/site/src/islands/
  apps/site/src/components.ts
  apps/site/playwright/heavy-block-layout-shift.spec.ts
  pnpm-lock.yaml apps/site/package.json
  packages/editor-shell/package.json
  packages/block-callout/package.json
  packages/block-code/package.json
  packages/block-image/package.json
  packages/block-foundation/RFC.md
  packages/block-foundation/src/__tests__/registry.test.ts
  agent-contract.md docs/runbooks/codex-tool-invocations.md`.
  Expected: empty diff. The 3 `.astro` wrappers at
  `apps/site/src/components/` do NOT exist at main HEAD (NEW in
  B7); the diff command verifies they remain absent post-B4
  (no scope creep into B7's territory). The 5 `package.json`
  files stay byte-unchanged (the rename is purely a named export
  inside the file body — no `exports` field key change).
  `block-foundation/RFC.md` + `block-foundation/registry.test.ts`
  stay byte-unchanged (their `calloutUIDefault` references are
  archival doc / local test fixture respectively, both
  intentionally out of scope per `## title` item 3 framing).
  `agent-contract.md` + `codex-tool-invocations.md` byte-unchanged
  (B4 is process-neutral).

- **TC11** (PR.md self-listed): Input:
  `grep -c 'B4-stage-a-retro-items.md'
  docs/plans/wave-4-main/B4-stage-a-retro-items.md`. Expected:
  ≥ 2 (self-reference in `## files` + `## Related` sections per
  Pre-A1 → B3 precedent).

- **TC12** (ESLint argsIgnorePattern rule actually loaded —
  verifies item 4 takes effect): Input:
  ```bash
  cat > /tmp/B4-eslint-probe.ts <<'EOF'
  function probe(_unused: number, used: number): number { return used; }
  export { probe };
  EOF
  cd packages/editor-shell &&
  pnpm exec eslint --no-eslintrc \
    --config ../../eslint.config.js /tmp/B4-eslint-probe.ts
  ```
  Expected: exit 0 + zero `no-unused-vars` warnings (the `_unused`
  arg is silenced by the new `argsIgnorePattern: '^_'`). Location:
  shell at repo root. **Negative control**: same probe with the
  arg renamed to `unused` (no `_` prefix) → exit code 0 with **1**
  warning matching `'unused' is defined but never used` (verifies
  the rule is actually evaluating the arg pattern, not silently
  no-op). This dual probe confirms item 4 is functional, not just
  syntactically present in `eslint.config.js`.

- **TC13** (lint workspace-wide stays clean post-rule-addition —
  no existing code regresses): Input: `pnpm lint`. Expected:
  exit 0 + ZERO new `no-unused-vars` warnings vs main HEAD
  baseline. Location: same. Same as TC3 but separately tracked
  for post-rule-addition regression. Forward-fix path if any
  unused arg surfaces: rename to `_arg` (1-token edit per arg)
  OR add inline `// eslint-disable-next-line` with prose.

## contracts_affected

- **`packages/editor-shell/CONTRACT.md`** — **MODIFIED** (item 2
  cast asymmetry codify; ~30 LOC delta). NEW `## Type variance
  note` section between `## Public surface` and `## Wave 3 Stage A
  expansion outline`. **D2 row 1 trigger HIT** (`*/CONTRACT.md`
  change). TC8 verifies presence of the section + load-bearing
  prose strings.

- **`packages/block-callout/CONTRACT.md`** — **MODIFIED** (item 3
  doc consumer; ~2 LOC delta — two prose references renamed).
  Same logical content, lowercase casing only. **D2 row 1 trigger
  HIT** but as a **mechanical-rename consequence** of item 3's
  source rename, not a substantive contract change. The contract
  surface (export shape + invariants + uiId reservation) stays
  semantically identical.

- **`packages/block-code/CONTRACT.md`** — **MODIFIED** (item 3
  doc consumer; ~1 LOC delta). Same mechanical-rename
  consequence.

- **`packages/block-image/CONTRACT.md`** — **MODIFIED** (item 3
  doc consumer; ~2 LOC delta). Same mechanical-rename
  consequence.

→ **4 CONTRACT files touched**, but only **1 is a substantive
contract change** (`editor-shell/CONTRACT.md` adds a new
`## Type variance note` section codifying invariant cross-package
behavior). The other 3 are mechanical doc renames following item
3's source rename for prose consistency. D2 row 1 fires once; the
PRE-COMMIT CLAUDE REVIEW (stage 4) reviews the substantive item
2 codification + verifies the 3 mechanical renames are byte-faithful
to the source rename (no semantic drift).

## adr_touched

- **NONE.** B4 touches no `docs/decisions/ADR-*.md` file. The 5/3
  cast asymmetry codification at `editor-shell/CONTRACT.md` is a
  **package-local invariant**, not an architectural decision —
  CONTRACT.md is the canonical home (per ADR-0010 D7 #3 + ADR-0011
  D2 row 1 contract-vs-architecture split). The UIDefault casing
  rename is a **convention alignment**, not an architectural
  pivot — no ADR record needed; the rename is documented inline
  in this PR.md + the 3 block-* CONTRACT.md prose updates. The
  ESLint argsIgnorePattern rule is a **lint UX improvement**, not
  an architectural decision — root `eslint.config.js` is the
  canonical home. TC10 verifies `docs/decisions/` byte-unchanged
  (transitively guaranteed by the diff guard). If future work
  amends ADR-0009 (BlockKind 4-way union) or ADR-0010 (Wave 2
  close) to cite the variance note as a structural property,
  that PR may then add an ADR cross-reference; B4 stays
  ADR-neutral.

## D2 trigger judgment

Per ADR-0007 D2 row mapping for B4 (verified at PLAN time per the
locked Wave 4 plan v0.2.1 Amendment B4 row "D2 trigger judgment:
row 1 HIT (CONTRACT change)" + the orchestrator-refined row-by-row
analysis below):

- **Row 1 (CONTRACT.md change)**: **YES — HIT**.
  `packages/editor-shell/CONTRACT.md` adds the substantive
  `## Type variance note` section (item 2). 3 block-* CONTRACT.md
  files also change but as mechanical doc renames following item
  3 (still counts as touched). PRE-COMMIT CLAUDE REVIEW (stage 4)
  fires.
- **Row 2 (package add / remove)**: **NO.** B4 adds zero new
  workspace packages. No `package.json` edit; no `pnpm-lock.yaml`
  delta (TC10 verifies).
- **Row 3 (cross-cutting refactor)**: **NO.** B4 is a casing
  rename (mechanical) + JSDoc promotion + ESLint rule addition
  — no semantic refactor of existing files.
- **Row 4 (new ADR required)**: **NO.** B4 touches no ADR.
  TC10 transitively verifies `docs/decisions/` byte-unchanged.
  Per `## adr_touched` reasoning, the 3 sub-items are all
  package-local / convention / lint-UX, not architectural.
- **Row 5 (cross >= 3 packages)**: **YES — but absorbed**. B4
  modifies files inside 4 packages: `packages/block-callout/`,
  `packages/block-code/`, `packages/block-image/`,
  `packages/editor-shell/` (cross-package scope = 4). Per Pre-A3
  plan-challenger Q5 absorbtion + ADR-0011 D1 row mapping clarity:
  **row 5 alone does NOT fire stage 4 PRE-COMMIT CLAUDE REVIEW**
  (the trigger-set is row 1 + row 4 only; row 5 is a heightened
  reviewer-scrutiny signal within stage 3, not a stage 4
  fire-trigger). Row 5 IS HIT here, but stage 4 fires from row
  1 anyway, so the practical effect is the same.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** Item 3's
  rename **resolves** an existing 5/3 sibling-pattern asymmetry
  (3 packages with uppercase casing) by aligning them to the
  majority lowercase casing — a sibling-pattern **harmonization**,
  not a new asymmetry introduction. Item 2 **codifies** the 5/3
  cast asymmetry as a structural property (with explicit type-system
  root cause), again harmonizing rather than introducing.
- **Row 7 (legacy doc resurrection)**: **NO.** B4 ADDS forward-state
  prose (CONTRACT type variance note + ESLint rule comment); the
  `block-foundation/RFC.md` is intentionally NOT touched per `##
  title` item 3 framing (archival doc, out of scope).
- **Row 8 (CI / build / deploy / auth / security)**: **NO.** B4
  touches no `.github/workflows/`, no `Dockerfile`, no
  auth-related code paths, no security-related code paths. The
  ESLint rule addition is a **dev-time lint config**, not a
  CI/build pipeline change (the CI job command `pnpm lint`
  is unchanged; it just executes against an additional rule).

→ **Row 1 HIT + Row 5 HIT (absorbed) → standard PR + stage 4
PRE-COMMIT CLAUDE REVIEW fires**. Pipeline: PLAN → EXECUTE →
REVIEW (codex-pr-reviewer-55) → **stage 4 PRE-COMMIT CLAUDE
REVIEW (orchestrator self)** → COMMIT (reviewer codex per ADR-0006
D8) → ACCEPT (pr-writer second invocation per ADR-0011 D1 stage 6).
Stage 4 fires per ADR-0011 D1 row 1 mapping. Heightened
reviewer-scrutiny on row 5 fan-out within stage 3 (4-package
cross-cutting rename consistency check) — reviewer verifies
TC1 negative-form match count meets the lower bound + verifies
no orphan uppercase reference in any of the 4 affected packages'
src/ + tests + CONTRACT prose.

## acceptance

1. **Item 2 codified**: `packages/editor-shell/CONTRACT.md`
   contains a NEW `## Type variance note` section between
   `## Public surface` and `## Wave 3 Stage A expansion outline`,
   listing (a) the 5 cast-required blocks
   (callout / code / image / math / pdf) with the canonical
   `XxxUiDefault as unknown as BlockUIDefinition` form;
   (b) the 3 no-cast blocks (jupyter / nn-viz / agent-flow);
   (c) the root cause (React `ComponentType` contravariance under
   `exactOptionalPropertyTypes:true`); (d) the
   `no-unnecessary-type-assertion` lint invariant for the 3
   no-cast blocks. TC8 evidence (≥ 4 grep hits on load-bearing
   prose strings).

2. **Item 3 source rename complete**: 3 block packages' source
   ui-default exports renamed:
   - `packages/block-callout/src/ui-default/index.ts`:
     `calloutUIDefault` → `calloutUiDefault`
   - `packages/block-code/src/ui-default/index.ts`:
     `codeUIDefault` → `codeUiDefault`
   - `packages/block-image/src/ui-default/index.ts`:
     `imageUIDefault` → `imageUiDefault`
   TC1 evidence (negative-form grep ≥ 30 matches; positive-form
   grep returns 0).

3. **Item 3 test rename complete**: 3 block packages' ui-default
   test files renamed all in-test references (8 each = 24 total).
   TC1 evidence covers; TC4 verifies tests pass against renamed
   exports.

4. **Item 3 CONTRACT prose rename complete**: 3 block packages'
   CONTRACT.md prose references renamed (2 + 1 + 2 = 5 total).
   TC1 evidence covers; TC8 indirectly verifies via the
   `editor-shell/CONTRACT.md` substantive change passing.

5. **Item 3 cross-package consumer rename complete**:
   `packages/editor-shell/src/registerBlocks.ts` 3 imports + 3
   usages renamed (6 references). TC1 + TC2 evidence.

6. **Item 4 ESLint rule added**: `eslint.config.js` type-aware
   files block contains explicit
   `@typescript-eslint/no-unused-vars: ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }]`.
   TC12 evidence (functional probe with `_unused` arg + negative
   control).

7. **Workspace typecheck clean**: `pnpm typecheck` → exit 0. The
   3 renamed cross-package exports resolve at all call sites.
   TC2 evidence.

8. **Workspace lint clean**: `pnpm lint` → exit 0. The new ESLint
   rule loads + parses without error; no existing code regresses
   under the `^_`-prefix-allowed convention. TC3 + TC13 evidence.

9. **Workspace test clean**: `pnpm test` → exit 0. The 3 affected
   block packages' `ui-default.test.tsx` suites pass against the
   renamed exports; no other test regressed. TC4 evidence.

10. **Workspace build clean**: `pnpm build` → exit 0. The 3
    affected block packages' `dist/` builds emit the renamed
    exports; `editor-shell/dist/` builds with the renamed
    imports. TC5 evidence.

11. **`pnpm check` exit 0 globally** — workspace-wide regression
    baseline. B4's deltas are surgical; no other package's test
    breaks. TC6 evidence.

12. **NO B1a / B1b / B2 / B3 shipped files regressed** (the
    13-file list at TC7). TC7 evidence.

13. **NO B5 / B7 / B6 scope files created or touched** + **NO
    package.json / lockfile / RFC.md / block-foundation
    registry.test.ts / agent-contract.md /
    codex-tool-invocations.md change**. TC10 evidence.

14. **`docs/plans/active.md` B3 row backfill applied** + **NEW
    B4 row added**: B3 `#TBD | TBD` → `#42 | 5d49240`; new B4
    row appended with subject "Stage A retro items 2 + 3 + 4
    (cast asymmetry codify + UIDefault casing rename + ESLint
    argsIgnorePattern)" + `#TBD (this) | TBD | B4 | ...`. TC9
    evidence.

15. **PR.md self-listed in `## files`** per ADR-0006 D8 strict
    whitelist + Pre-A1 → B3 precedent. TC11 evidence.

16. **Stage 4 PRE-COMMIT CLAUDE REVIEW fires** per `## D2 trigger
    judgment` row 1 HIT. Orchestrator-self runs the 8-point ADR-0006
    checklist on the substantive `editor-shell/CONTRACT.md` change
    + spot-checks the 3 mechanical block-* CONTRACT renames for
    byte-faithfulness to the source rename (no semantic drift).
    Reviewer iterations expected: R1 + 0-1 forward-fix; risk
    classes for B4: (a) reviewer may push back on the
    `## Type variance note` placement (between `## Public surface`
    and `## Wave 3 Stage A expansion outline` — orchestrator
    decision; alternative placement is post-`## Stage A close
    note`. PLAN-time decision: place near `## Public surface`
    because the cast asymmetry is a **structural property of the
    public surface**, not a Stage A historical artifact). (b)
    Reviewer may push back on the 3 block-* CONTRACT renames as
    scope creep beyond the orchestrator brief's canonical 12
    files — forward-fix path: orchestrator cites this PR.md's
    `## files` entries #4 + #7 + #10 prose ("pre-empting the
    predictable reviewer R1 push-back") + the rename-consistency
    invariant (if the const renames but the doc doesn't, the
    block-* CONTRACT prose drifts). (c) Reviewer may push back
    on the ESLint rule addition as out-of-scope vs items 2 + 3
    (the brief frames items 2 + 3 + 4 as a single batch; the
    `_`-prefix convention is a separate concern). PLAN-time
    decision: keep batched — items 2 + 3 + 4 are all "Stage A
    retro items" per Wave 4 plan v0.2.1; splitting now would
    add 2 extra PR overheads to deliver 3 independent ~5-LOC
    deltas. (d) Reviewer may push back on the casing direction
    (lowercase `Ui` chosen over uppercase `UI`) — orchestrator
    decision is **majority-rule** (5 of 8 already use lowercase;
    minimizes total rename scope). Forward-fix if reviewer
    insists on the opposite direction would migrate 5 packages
    instead of 3; the cost asymmetry alone keeps the
    PLAN-time decision robust.

17. **Codex commit (D1 stage 5)** uses ADR-0006 D8
    explicit-file-list staging: reviewer codex commits 13-14
    files (12 canonical from `## files` + 1 B3-orphan-leftover
    audit + 1-2 B4 reviewer audit archives) in a single explicit
    list:
    `git reset HEAD` → `git add packages/editor-shell/CONTRACT.md
    packages/block-callout/src/ui-default/index.ts
    packages/block-callout/src/__tests__/ui-default.test.tsx
    packages/block-callout/CONTRACT.md
    packages/block-code/src/ui-default/index.ts
    packages/block-code/src/__tests__/ui-default.test.tsx
    packages/block-code/CONTRACT.md
    packages/block-image/src/ui-default/index.ts
    packages/block-image/src/__tests__/ui-default.test.tsx
    packages/block-image/CONTRACT.md
    packages/editor-shell/src/registerBlocks.ts
    eslint.config.js
    docs/plans/active.md
    docs/plans/wave-4-main/B4-stage-a-retro-items.md
    docs/audits/codex-runs/2026-05-03-B3-commit.txt
    docs/audits/codex-runs/2026-05-03-B4-pr-reviewer-55.txt
    [docs/audits/codex-runs/2026-05-03-B4-pr-reviewer-55-r2.txt]` →
    `git diff --cached --stat` verify (16-17 files; lockfile NOT
    in staging) → `git commit`. Per memory
    `feedback_git_operator_explicit_stage.md` lockfile-scope
    discipline: lockfile MUST be byte-unchanged (TC10 pre-commit
    verifies).

## Risk register (B4-specific)

B4's risk surface is moderate (cross-4-package mechanical rename
+ substantive CONTRACT codify + ESLint rule addition; D2 row 1
HIT; stage 4 PRE-COMMIT CLAUDE REVIEW fires). Four B4-specific
risks documented:

1. **Cross-package rename incompleteness — orphan uppercase
   reference left behind**. The rename touches 4 packages × 3
   surfaces (source / test / CONTRACT) = 12 named-export sites
   plus 6 cross-package consumer sites in `editor-shell/registerBlocks.ts`.
   Risk: orchestrator misses one site → typecheck fails (TC2)
   OR test fails (TC4) OR — worst case — a stale reference
   lingers in CONTRACT prose only and TC1 misses it. **Mitigation**:
   TC1 grep is **conjunctive** (negative-form positive-form pair):
   `grep -rn "calloutUIDefault\|codeUIDefault\|imageUIDefault"
   packages/` → expected 0 matches across `src/` + `*/CONTRACT.md`
   (excluding `block-foundation/RFC.md` + `block-foundation/registry.test.ts`
   which are intentionally out of scope per `## title` item 3).
   The `pnpm typecheck` + `pnpm test` + `pnpm lint` triple-check
   in TC2-TC4 catches any missed import + any in-string reference
   (test descriptions). PLAN-time-recorded out-of-scope set:
   `block-foundation/RFC.md` (archival; line 100 + 149 + 153 +
   156 + 176 + 182 + 185 + 186 = 8 references — stay unchanged)
   AND `block-foundation/src/__tests__/registry.test.ts` (local
   test fixture at line 19; lines 19, 64, 65, 70, 76, 77, 79,
   87, 88, 94, 96 = 11 references — stay unchanged) AND
   `docs/audits/structure-2026-05.md` (archival audit; line 100
   + 101 + 102 = 3 references — stay unchanged) AND
   `docs/audits/codex-runs/2026-04-30-task-C2-code-review.txt`
   + `docs/audits/codex-runs/2026-04-30-task-C3-code-review.txt`
   (archival reviewer transcripts — stay unchanged). Verified
   PLAN-time these 5 archival/test-fixture/structure-audit files
   contain ALL the remaining uppercase references; the workspace-wide
   substantive rename touches **only** the 4 packages' src/ +
   tests + CONTRACT prose listed in `## files`.

2. **CONTRACT.md `## Type variance note` placement / framing
   pushback**. Reviewer may prefer a different section position
   OR a different prose framing (e.g., "Cast invariant" vs
   "Type variance note"). **Mitigation**: PLAN-time decision is
   placed near `## Public surface` (the cast asymmetry IS a
   public-surface property). If reviewer escalates, forward-fix
   is a section-rename or section-reorder ≤ 5 LOC + zero
   semantic content change; TC8 grep can be rewritten to match
   the new section name. **Acceptance fallback**: if the reviewer
   strongly prefers `Cast invariant` or `Variance note`,
   orchestrator accepts the rename and re-runs TC8 with adjusted
   pattern.

3. **ESLint rule addition causes hidden unused-var regression**.
   The new `@typescript-eslint/no-unused-vars` rule **upgrades**
   the warn-level handling from the
   `tseslint.configs.recommendedTypeChecked` default (which IS
   already warn-level for unused vars; verified PLAN-time the
   `pnpm lint` baseline is exit 0). Risk: a hidden unused arg
   pattern in a file that the recommended config tolerated but
   the explicit rule flags. **Mitigation**: the new rule is
   **purely additive** (`argsIgnorePattern: '^_'` only widens the
   tolerance — args matching `_*` are silenced where previously
   they triggered warnings; other args still warn at the same
   level). TC3 + TC13 verify `pnpm lint` exit 0 post-rule
   addition; if any regression surfaces, forward-fix is a
   1-token rename (`unused` → `_unused`) per warning OR an
   inline `// eslint-disable-next-line` with prose justification.
   Realistic regression scope: ≤ 5 sites workspace-wide based
   on the existing baseline cleanliness.

4. **Item 3 casing direction reversal pressure**. Reviewer may
   argue the **uppercase** `UI` form is more idiomatic (since
   `UI` is an initialism). PLAN-time decision: **majority-rule**
   (5 of 8 use lowercase; rename minority of 3 instead of 5).
   **Mitigation**: if reviewer insists on uppercase, forward-fix
   migrates 5 packages instead of 3:
   `mathUiDefault` / `pdfUiDefault` / `jupyterUiDefault` /
   `nnVizUiDefault` / `agentFlowUiDefault` →
   `mathUIDefault` / etc. Cost asymmetry (5 vs 3 packages) +
   the existing JSDoc on `registerBlocks.ts` line 23 already
   uses `UiDefault` form — so the in-source convention also
   leans lowercase. PLAN-time decision robust; reviewer
   pushback unlikely but the forward-fix path is mechanical.

## executor

Per Wave 4 plan v0.2.1 Amendment B4 row (`executor:
orchestrator-self (small batch + cross-package rename + JSDoc
promotion + ESLint rule addition)` + active.md gatekeeper-aligned
roster):

- **PLAN**: pr-writer Claude subagent (you, this dispatch).
  Output this PR.md at
  `docs/plans/wave-4-main/B4-stage-a-retro-items.md`. SendMessage
  orchestrator on completion; orchestrator iterates 0-2 rounds
  before lock.

- **EXECUTE**: **orchestrator-self** (small batch + cross-package
  file rename + JSDoc/CONTRACT prose; matches B3's small-batch
  precedent). NOT codex-generic-executor — the change set is
  surgical (~12 file edits + ~50 LOC total content delta) +
  contains a substantive CONTRACT codification (item 2) that
  warrants direct orchestrator authorship per memory
  `feedback_pr_reviewer_authority_at_head` discipline (orchestrator
  reads source at HEAD before writing the variance note prose).
  Standard ADR-0011 D1 stage 5 reviewer-codex-commit applies;
  orchestrator-self does EXECUTE only.

  EXECUTE order (TDD-front discipline per memory
  `feedback_soted_pr_md_discipline`):
  - **B4.A** apply item 2 (CONTRACT codify): write
    `## Type variance note` section to
    `packages/editor-shell/CONTRACT.md` → verify TC8 grep returns
    ≥ 4 hits.
  - **B4.B** apply item 3 source renames (3 files: index.ts ×3)
    → verify each export line shows lowercase form.
  - **B4.C** apply item 3 test renames (3 files:
    __tests__/ui-default.test.tsx ×3) → verify 8 references
    each renamed.
  - **B4.D** apply item 3 CONTRACT prose renames (3 files:
    block-callout / block-code / block-image CONTRACT.md) →
    verify 5 references total renamed.
  - **B4.E** apply item 3 cross-package consumer rename:
    `editor-shell/registerBlocks.ts` 6 references → verify
    grep.
  - **B4.F** apply item 4 ESLint rule: append
    `@typescript-eslint/no-unused-vars` rule to type-aware
    files block in `eslint.config.js`.
  - **B4.G** TC1 (rename completeness conjunctive grep) →
    expected 0 uppercase + ≥30 lowercase across 4 packages'
    src/ + tests + CONTRACT.
  - **B4.H** TC2 `pnpm typecheck` → exit 0.
  - **B4.I** TC3 `pnpm lint` → exit 0.
  - **B4.J** TC4 `pnpm test` → exit 0.
  - **B4.K** TC5 `pnpm build` → exit 0.
  - **B4.L** TC12 (ESLint argsIgnorePattern functional probe
    with `_unused` arg + negative control) → exit 0 + 0
    warnings positive / 1 warning negative.
  - **B4.M** TC6 `pnpm check` workspace-wide → exit 0.
  - **B4.N** active.md B3 backfill (`#TBD | TBD` → `#42 |
    5d49240`) + B4 row insertion → TC9 verifies.
  - **B4.O** TC7 + TC10 + TC11 byte-unchanged guards → all
    pass.
  - **B4.P** reviewer codex commits per `## acceptance`
    bullet 17.

- **REVIEW (D1 stage 3)**: `codex-pr-reviewer-55` (`--yolo
  --profile codex-pr-reviewer-55`). ADR-0006 8-point checklist +
  ADR-0006 D8 explicit-file-list staging mandatory. Reviewer
  reads `packages/editor-shell/CONTRACT.md` + the 3 block-* `src/ui-default/index.ts`
  + `packages/editor-shell/src/registerBlocks.ts` at HEAD per
  memory `feedback_pr_reviewer_authority_at_head`. Reviewer
  verifies (a) the new CONTRACT section accurately reflects the
  source-code reality (5 cast lines + 3 no-cast lines in
  registerBlocks.ts); (b) the rename consistency across 4
  packages (TC1 conjunctive grep); (c) the ESLint rule loads +
  fires correctly (TC12 dual probe).

- **PRE-COMMIT CLAUDE REVIEW (D1 stage 4)**: **DOES FIRE** per
  `## D2 trigger judgment` row 1 HIT. Orchestrator-self runs the
  ADR-0006 8-point checklist focused on the substantive
  `editor-shell/CONTRACT.md` codification (item 2):
  - Asymmetry: 5/3 cast split structurally accurate vs source
  - Cross-file: section coexists with `## Public surface` +
    `## Wave 3 Stage A expansion outline` without prose conflict
  - Spec-match: cast invariant matches existing JSDoc on
    `registerBlocks.ts` lines 20-27 (codification, not new
    behavior)
  - 8th-class hunt: any sibling-pattern blocks beyond the 8 we
    enumerate? No — the 8-block roster is locked at ADR-0009
    BlockKind 4-way + Wave 2 close.
  - Doc consistency: 3 mechanical block-* CONTRACT renames
    byte-faithful to source rename
  - ESLint rule scope: type-aware files block placement (not
    universal); `argsIgnorePattern` + `varsIgnorePattern` +
    `ignoreRestSiblings` triple is the standard convention bundle
  - Lint-actually-fires: TC12 dual probe (positive + negative
    control)
  - Review of the review: orchestrator's checklist run is logged
    as the stage 4 audit before COMMIT proceeds.

- **COMMIT (D1 stage 5)**: reviewer codex commits via Pre-A1
  4-step `git reset HEAD` → `git add <list>` → `git diff
  --cached --stat` verify → `git commit` (memory
  `feedback_git_operator_explicit_stage`). Lockfile MUST be
  byte-unchanged (TC10 pre-commit). 13-14 files in canonical
  commit list (12 source/doc + active.md + PR.md self-list +
  B3-orphan-leftover audit + 1-2 B4 audit archives).

- **ACCEPT (D1 stage 6)**: pr-writer second invocation walks
  the 17 acceptance bullets against the actual diff; residue
  list returned to orchestrator for B5 PLAN seed.

- **POST-MERGE**: `gh pr merge --squash --delete-branch` per
  Wave 3 auto-merge authorization (memory
  `feedback_wave3_auto_merge`); B4 row `#TBD | TBD` backfilled
  at next PR (B5) per one-row-per-PR cadence.

## Plan-challenger

**NOT dispatched.** B4 is a small-batch standard PR (3 sub-items
totaling ~50 LOC content delta + ~10 mechanical rename diffs;
D2 row 1 HIT but the trigger is mechanical-rename-driven, not
architectural; no plan-challenger absorbtion table to maintain).
The 3 sub-items are concrete + non-controversial Stage A retro
items per Wave 4 plan v0.2.1 Driver 1; the brief enumerates them
in full. Matches B2 + B3 small-standard-PR precedent (both
skipped plan-challenger). Stage 4 PRE-COMMIT CLAUDE REVIEW fires
per row 1, but that's a **post-EXECUTE** orchestrator self-review
(not a PLAN-time challenger dispatch).

## Out of scope (deferred)

B4 explicitly does NOT touch the following surfaces (also
enforced by TC7, TC10 diff guards):

- **Stage A retro items 5 + 6** (already closed in Wave 3 per
  Wave 4 plan v0.2.1 Driver 1 retro roster — items 5 + 6 were
  closed as part of Wave 3 D-stage; B4 only batches the
  remaining 3 of 6 items).

- **`packages/block-foundation/RFC.md`** (archival design doc;
  line 100 + 149 + 153 + 156 + 176 + 182 + 185 + 186 contain 8
  uppercase `calloutUIDefault` references — RFC was authored
  pre-rename and stays unchanged as historical record). TC10
  verifies byte-unchanged.

- **`packages/block-foundation/src/__tests__/registry.test.ts`**
  (local test fixture at line 19 declares its OWN
  `const calloutUIDefault = defineUI(...)` — independent of the
  3 cross-package renamed exports; the test verifies the
  registry behavior with a locally-named fixture, not the
  cross-package consumer surface). TC10 verifies byte-unchanged.

- **`docs/audits/structure-2026-05.md`** (archival audit
  baseline; lines 100 + 101 + 102 reference uppercase exports
  as the historical state). Snapshot of the pre-rename
  workspace; intentionally not renamed because the audit is
  a historical diff target. TC10 verifies byte-unchanged.

- **`docs/audits/codex-runs/2026-04-30-task-C{2,3}-code-review.txt`**
  (archival reviewer transcripts from Wave 2 era; references
  uppercase exports as the historical state). TC10 transitively
  verifies via `docs/audits/` not appearing in the diff guard
  list — but explicitly out of scope. Touching the archival
  reviewer transcripts would defeat their value as immutable
  historical records.

- **5 lowercase-already block packages** (math / pdf / jupyter
  / nn-viz / agent-flow): NO rename needed; their ui-default
  exports already use lowercase `Ui` form. Item 3 only migrates
  the 3 minority uppercase packages.

- **B5-scope files** (codex profile prefix R3 work +
  `agent-contract.md` codex profile name flips +
  `docs/runbooks/codex-tool-invocations.md` profile-prefix
  renames + memory `feedback_lychee_*` codification). TC10
  verifies `agent-contract.md` + `codex-tool-invocations.md`
  byte-unchanged.

- **B7-scope files** (`apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`
  + `apps/site/src/islands/**` + `apps/site/src/components.ts`
  componentsMap heavy entries +
  `apps/site/playwright/heavy-block-layout-shift.spec.ts`
  AC#16 expansion + ADR-0014 v0.3 amendment +
  `apps/site/CONTRACT.md` heavy block taxonomy section). B7 is
  the CRITICAL Astro hydration wiring PR (Wave 4 plan v0.2.1
  Driver 2; gatekeeper-surfaced 2026-05-03). TC10 verifies B4
  stays out.

- **B6-scope files** (Wave 4 close-ceremony preparation: ADR-0015
  Wave 4 close authoring + agent-contract.md final-state lock +
  Wave 4 retrospective items table). All deferred to B6.

- **B1a + B1b + B2 + B3 shipped files** (utility + tests +
  SearchBox + search.spec.ts + search-cjk.test.ts +
  `apps/site/CONTRACT.md` + ADR-0012 + 4 binary sample-assets
  + favicon + sample-blocks MDX + `apps/site/src/pages/index.astro`
  byte-unchanged from squash `1aa2811` + `5ec7123` + `317dda3`
  + `5d49240`). TC7 verifies.

- **All ADR files** (B4 cites ADR-0006 + ADR-0007 + ADR-0009 +
  ADR-0010 + ADR-0011 by markdown link for read; touches none
  for write). Per `## adr_touched`: items 2 + 3 + 4 are all
  package-local / convention / lint-UX, not architectural.

- **Wave 4 plan doc** (v0.2.1 Amendment authored at B1a; B4
  does NOT amend further).

- **8 block packages NOT in scope** (block-math + block-pdf +
  block-jupyter + block-nn-viz + block-agent-flow +
  block-foundation + heavy-block-boundary): no rename, no
  CONTRACT change. The 5 lowercase-already block-* packages
  stay byte-unchanged at HEAD (no item 3 work needed there).

- **`agent-contract.md` / `CLAUDE.md` /
  `docs/runbooks/codex-tool-invocations.md`** (Wave 4 process
  documents; no change for B4). TC10 verifies.

- **Stage C** — open-ended Phase 1 user-iteration scope per
  gatekeeper directive #4 + MVP framework. Items beyond the 6
  Stage A retro items are Stage C territory.

## Related

- [ADR-0011 D1 linear pipeline execution model](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — pipeline framework + D2 trigger row mapping (row 1 HIT for B4 → stage 4 fires)
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md) — staging discipline for the 16-17-file commit + 8-point checklist applied at stage 4
- [ADR-0007 D2 trigger judgment](../../decisions/ADR-0007-job-function-codex-heavy-execution.md) — row-by-row mapping authority
- [ADR-0009 BlockKind 4-way union](../../decisions/ADR-0009-block-kind-union-expansion.md) — 8-block roster locked (3 component + 2 render + 3 viz); the 5/3 cast asymmetry codified at B4 derives from this 8-block partition (5 narrow-schema render targets vs 3 wider-signature viz targets)
- [ADR-0010 D7 Wave 2 close](../../decisions/ADR-0010-wave-2-close.md) — editor-shell composition deferral; #3 was closed by Wave 3 Stage A; B4 codifies the cast invariant left implicit at Stage A close
- [Wave 4 plan v0.2.1 Amendment](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md) — Stage B re-locked sequence + B4 row scope authority (3 of 6 Stage A retro items batched)
- [docs/plans/active.md](../active.md) — Wave 4 PR roster + B3 backfill target + B4 NEW row insertion target
- [B1a PR.md](B1a-adr-0012-amendment.md) — squash `1aa2811`; PR #39; doc-flavored ADR amendment + utility precedent (orchestrator-self EXECUTE)
- [B1b PR.md](B1b-searchbox-integration.md) — squash `5ec7123`; PR #40
- [B2 PR.md](B2-sample-blocks-cleanup.md) — squash `317dda3`; PR #41; small-standard-PR precedent (orchestrator-self EXECUTE; no plan-challenger; PR.md self-list)
- [B3 PR.md](B3-test-cjk-relocation.md) — squash `5d49240`; PR #42; B3 backfill target in active.md + small-batch precedent (orchestrator-self EXECUTE)
- [packages/editor-shell/CONTRACT.md](../../../packages/editor-shell/CONTRACT.md) — item 2 codify target
- [packages/editor-shell/src/registerBlocks.ts](../../../packages/editor-shell/src/registerBlocks.ts) — JSDoc lines 20-27 + 45-49 are the SOURCE of truth for the cast asymmetry that B4 promotes to CONTRACT
- [packages/block-foundation/CONTRACT.md](../../../packages/block-foundation/CONTRACT.md) — registry consumer pattern + `BlockUIDefinition` wide-schema type definition (the contravariance partner)
- memory `feedback_soted_pr_md_discipline.md` — SOTed-PR.md authoring discipline (single-source-of-truth + cross-section reference + TDD-front + memory-cited)
- memory `feedback_lychee_line_anchor.md` + `feedback_lychee_user_local_paths.md` + `feedback_lychee_npmjs_403.md` — lychee discipline applied to PR.md cross-references (B5 will codify)
- memory `feedback_pr_reviewer_authority_at_head.md` — reviewer reads source at HEAD, not via PR.md excerpt (load-bearing for stage 4 PRE-COMMIT CLAUDE REVIEW)
- memory `feedback_git_operator_explicit_stage.md` — 16-17-file explicit-file-list commit at D1 stage 5
- memory `feedback_wave3_auto_merge.md` — `gh pr merge --squash --delete-branch` post-merge cadence
