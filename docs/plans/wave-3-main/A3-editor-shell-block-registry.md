# A3 — editor-shell BlockRegistry boot

> **Wave 3 main pipeline fourth PR (third of Stage A).** Wires the 8 `block-*`
> core + ui-default definitions into a `BlockRegistry` instance via a new
> `registerBlocks(registry)` helper, and re-exports `proseExtensions` from
> `@skb/block-foundation` so future `EditorShell` consumers can swap the
> hard-coded `[StarterKit]` list for the foundation-curated prose extension
> set. NO kernel-* registration (A4), NO mdx-bridge save/load (A5). A3 is the
> first PR where editor-shell takes a workspace dep — adds 9 `@skb/*` deps in
> one shot (1 foundation + 8 blocks). Closes the A1 + A2 CONTRACT.md
> "Wave 3 Stage A expansion outline" prediction for A3 verbatim — any
> deviation from that prediction at A3 is scope drift.

## title

Add `registerBlocks(registry: BlockRegistry): void` helper to `@skb/editor-shell`
that registers the 8 block-* cores + ui-defaults (callout, code, image, math,
pdf, jupyter, nn-viz, agent-flow — kind distribution 3 component + 2 render +
3 viz per ADR-0009 D1) into a passed-in `BlockRegistry` instance, and
re-exports `proseExtensions` from `@skb/block-foundation` to enable foundation-
curated prose composition in A3+ consumers; CONTRACT.md updates `## Public
surface` to declare the new helper + re-export.

## files

Created (NEW — 1 source file + 1 test file):

- `packages/editor-shell/src/registerBlocks.ts` *(the helper function. Imports
  each of the 8 `<x>Core` symbols from `@skb/<block-*>/core` subpath and each
  of the 8 `<x>U[Ii]Default` symbols from `@skb/<block-*>/ui-default` subpath
  — uniform subpath import strategy across all 8, see `## acceptance` bullet
  3 for rationale and the exact symbol list. Calls `registry.registerCore(...)`
  for each of 8 cores in the locked plan order, then `registry.registerUI(...)`
  for each of 8 ui-defaults in the same order. **EXECUTE-time discovered
  cast asymmetry**: 5 of 8 ui-defaults require `as unknown as BlockUIDefinition`
  cast (callout / code / image / math / pdf), the remaining 3 need NO cast
  (jupyter / nn-viz / agent-flow). PLAN-time prediction expected only the
  3 explicitly-annotated callout/code/image to need the cast; EXECUTE found
  math/pdf also need it (TS narrows via `defineUI`'s generic). ESLint's
  `no-unnecessary-type-assertion` flagged the speculative jupyter/nn-viz/agent-flow
  casts as no-ops, leading to the final 5-cast/3-no-cast pattern. The 5 cast
  call sites mirror the pattern in
  `packages/block-callout/src/__tests__/ui-default.test.tsx:26`. The 3 no-cast
  sites pass to registerUI
  directly without a cast, same as already done in
  `packages/block-nn-viz/src/__tests__/registry-integration.test.ts:23` +
  `packages/block-agent-flow/src/__tests__/registry-integration.test.ts:23`.
  Function is `void`-returning; throw responsibility delegated to BlockRegistry's
  own register methods — no try/catch wrapping. Estimated ~80-100 LOC including
  imports.)*
- `packages/editor-shell/src/__tests__/registerBlocks.test.ts` *(TC1-TC3 — locked-plan-only TCs from
  the locked plan A3 entry. happy-dom env (already set by
  A2 vitest.config.ts; no DOM is actually needed for this test, but vitest
  config is per-package so we inherit happy-dom). Uses
  `BlockRegistry` from `@skb/block-foundation` directly — test creates a
  fresh registry per `it(...)` to keep each case independent. NO `setTimeout`,
  NO arbitrary waitFor; everything in registerBlocks is synchronous.)*

Modified (5 files):

- `packages/editor-shell/src/index.ts` — adds 2 new exports next to the existing
  A2 lines (without removing them):
  - `export { registerBlocks } from './registerBlocks';`
  - `export { proseExtensions } from '@skb/block-foundation';` (re-export so
    A3+ consumers can `import { EditorShell, registerBlocks, proseExtensions }
    from '@skb/editor-shell'` from the single editor-shell barrel without
    needing a separate block-foundation import — this is the "also handles
    prose via `proseExtensions` from block-foundation" half of the locked
    plan A3 entry, see `## acceptance` bullet 5 for the exact rationale).
  Net delta: +2 lines. Existing A2 lines (`EditorShell` + `EditorShellProps`)
  unchanged.
- `packages/editor-shell/CONTRACT.md` — three coordinated edits to the
  `## Public surface` section + the `## Wave 3 Stage A expansion outline`
  section:
  1. Add bullet for `registerBlocks(registry: BlockRegistry): void` under
     `## Public surface`, with the exact signature and a one-paragraph
     description of what it registers (8 cores + 8 ui-defaults; kind
     distribution 3 component + 2 render + 3 viz; locked plan order).
  2. Add bullet for `proseExtensions` re-export under `## Public surface`,
     noting it's the same array exported by `@skb/block-foundation` and
     pointing consumers to the foundation package as the authority.
  3. Rewrite the `**A3** —` line in `## Wave 3 Stage A expansion outline`
     from prediction-tense to past-tense ("Delivered in this PR"); A4 + A5
     entries stay as-is. The pre-existing prediction-tense text says:
     `'A3' — registerBlocks(registry) helper. Wires the 8 block-* core +
     ui-default definitions into a BlockRegistry instance. Adds 8 @skb/block-*
     + @skb/block-foundation workspace deps. May expose a proseExtensions
     prop on EditorShell if registry-driven extension composition requires
     it.` The actual A3 surface drops the speculative "may expose a
     proseExtensions prop on EditorShell" half (no `EditorShell` props change
     in A3 — `proseExtensions` is a barrel re-export, not a prop) and adds
     the clarifying sentence about the prose re-export semantics; reviewer
     should pattern-match the past-tense rewrite to the actual delivered
     surface.
- `packages/editor-shell/package.json` — adds 9 `@skb/*` workspace deps under
  `dependencies` (not peer; cores + ui-defaults are direct runtime imports of
  the helper):
  - `@skb/block-foundation: workspace:*`
  - `@skb/block-callout: workspace:*`
  - `@skb/block-code: workspace:*`
  - `@skb/block-image: workspace:*`
  - `@skb/block-math: workspace:*`
  - `@skb/block-pdf: workspace:*`
  - `@skb/block-jupyter: workspace:*`
  - `@skb/block-nn-viz: workspace:*`
  - `@skb/block-agent-flow: workspace:*`
  All 9 use `workspace:*` (matches the workspace pattern across the repo,
  e.g. `packages/block-callout/package.json` already uses `workspace:*` for
  `@skb/block-foundation`). Order in JSON: alphabetical within `dependencies`
  block (foundation first by alphabetic sort, then `block-agent-flow`,
  `block-callout`, `block-code`, `block-image`, `block-jupyter`, `block-math`,
  `block-nn-viz`, `block-pdf`). The pre-existing
  `@tiptap/starter-kit: ^2.10.0` dependency stays — A2's bare-mount surface
  still imports it; A3 does NOT remove it (deferred to A3+ refactor where the
  EditorShell can opt to use `proseExtensions` instead of the inline
  `[StarterKit]`). No peerDependency or devDependency additions; A3 only adds
  `@skb/*` workspace deps.
- `packages/editor-shell/tsconfig.json` — adds 9 `references` entries (one per
  workspace dep), alphabetical order matching the package.json `dependencies`
  alphabetical order:
  ```jsonc
  "references": [
    { "path": "../block-agent-flow" },
    { "path": "../block-callout" },
    { "path": "../block-code" },
    { "path": "../block-foundation" },
    { "path": "../block-image" },
    { "path": "../block-jupyter" },
    { "path": "../block-math" },
    { "path": "../block-nn-viz" },
    { "path": "../block-pdf" }
  ]
  ```
  A1 + A2 left `references: []`; A3 populates it with all 9 workspace deps.
  ADR-0006 D8 "decl ↔ ref" symmetry: every `dependencies` entry MUST have a
  matching `references` entry (TS project-graph correctness; otherwise
  cross-package typecheck breaks under composite). Verified at TC8 below.
- `pnpm-lock.yaml` — regenerated by `pnpm install` after `package.json` edits.
  ADR-0006 D8 sub-form C: lockfile is generated-from-authority, MUST stage in
  the same commit as authority. Delta size expectation: small (the 9
  `@skb/*` packages are already in the workspace graph; pnpm just adds 9 new
  importer-graph entries under `packages/editor-shell:`'s deps section pointing
  at workspace `link:` entries — no new resolution work since all 9 are local).

Self-listed:

- `docs/plans/wave-3-main/A3-editor-shell-block-registry.md` *(this PR.md
  itself — explicit-listed per ADR-0006 D8 strict whitelist; A1 + A2 R-lessons
  + PR #1 R2 lesson: PR.md MUST self-list in `files:` whitelist)*

**Explicitly NOT in `files:`** (verification-only, no edit):

- `tsconfig.json` (root) — A1 already added the `editor-shell` reference at
  position 22 of the references array; A3 does NOT add NEW packages so the
  root references list stays unchanged. Verify: `git diff main -- tsconfig.json`
  returns empty.
- `pnpm-workspace.yaml` — unchanged (existing `packages/*` glob; A3 makes no
  new package).
- `agent-contract.md` — A3 is additive consumer wiring within an established
  package; no contract surface in the single-source contract changes. Verify:
  `git diff main -- agent-contract.md` returns empty.
- `packages/editor-shell/vitest.config.ts` — A2 already set `include:
  ['src/**/*.test.{ts,tsx}']` + `environment: 'happy-dom'`; A3 inherits both.
  Verify: `git diff main -- packages/editor-shell/vitest.config.ts` returns
  empty.
- `packages/editor-shell/src/EditorShell.tsx` — A2 deliverable; A3 does NOT
  modify the component (no `proseExtensions` prop yet, deferred to A3+
  refactor that will swap inline StarterKit for foundation-curated prose
  list when registry-driven composition lands). Verify: `git diff main --
  packages/editor-shell/src/EditorShell.tsx` returns empty.
- `packages/editor-shell/src/__tests__/EditorShell.test.tsx` — A2 deliverable;
  A3 leaves it untouched. Verify: empty diff.
- `packages/editor-shell/src/__tests__/smoke.test.ts` — A1 deliverable; A3
  leaves it untouched. Verify: empty diff.
- All 8 `packages/block-*` packages + `packages/block-foundation` — A3 is a
  pure consumer; zero modifications to the producer side. Verify:
  `git diff main -- 'packages/block-*' 'packages/block-foundation'` returns
  empty (modulo `pnpm-lock.yaml` which sits outside packages/).
- Wave 3 plan file
  `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md` — locked
  at PLAN seal time; per-PR status updates deferred to a Stage A closeout PR
  after A5 lands.

## test_cases

- **TC1** (8-core registration in locked plan order — the literal new test
  case in `registerBlocks.test.ts`)
  Input:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { BlockRegistry } from '@skb/block-foundation';
  import { registerBlocks } from '../registerBlocks';

  it('registers exactly 8 cores in locked plan order', () => {
    const reg = new BlockRegistry();
    registerBlocks(reg);
    const names = reg.listCores().map((c) => c.name);
    expect(names).toEqual([
      'callout', 'code', 'image',           // 3 component blocks
      'math', 'pdf',                         // 2 render blocks
      'jupyter', 'nn-viz', 'agent-flow',    // 3 viz blocks
    ]);
  });
  ```
  Expected: 1 test PASS. Asserts: (a) registerBlocks registers exactly 8 cores;
  (b) `listCores()` returns insertion order (Map iteration is insertion-order
  per ECMAScript spec; `BlockRegistry` uses `Map<string, BlockCoreDefinition>`
  internally per `packages/block-foundation/src/registry.ts:56`); (c) the
  registration order matches the locked plan A3 entry's TC1 list — kind-grouped
  (3 component, 2 render, 3 viz) NOT alphabetical. The `.toEqual` deep-array
  match is intentional: array equality with exact order. Location:
  `packages/editor-shell/src/__tests__/registerBlocks.test.ts:N` (executor
  places at the first `it(...)` in the new file).

- **TC2** (ui-default lookup for each of 8 names) Input:
  ```ts
  it('registers ui-default for each of 8 cores; default lookup resolves', () => {
    const reg = new BlockRegistry();
    registerBlocks(reg);
    const names = ['callout', 'code', 'image', 'math', 'pdf',
                   'jupyter', 'nn-viz', 'agent-flow'] as const;
    for (const name of names) {
      const ui = reg.getUI(name);
      expect(ui).toBeDefined();
      expect(ui!.coreName).toBe(name);
      expect(ui!.uiId).toBe('default');
    }
  });
  ```
  Expected: 1 test PASS. Asserts: (a) each of 8 cores has a corresponding ui
  registered; (b) `getUI(name)` without a uiId returns the first-registered
  UI (per BlockRegistry contract — see `packages/block-foundation/src/registry.ts:88-94`
  + RFC §2 "first-registered = default"); (c) each ui has `uiId === 'default'`
  matching the convention from `packages/block-foundation/RFC.md:103-108`.
  Location: same file as TC1, second `it(...)`.

- **TC3** (BlockKind distribution per ADR-0009 D1) Input:
  ```ts
  it('BlockKind distribution: 3 component + 2 render + 3 viz', () => {
    const reg = new BlockRegistry();
    registerBlocks(reg);
    const byKind = reg.listCores().reduce<Record<string, number>>((acc, c) => {
      acc[c.kind] = (acc[c.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(byKind).toEqual({
      component: 3,
      render: 2,
      viz: 3,
    });
    // Per-block kind verification (catches a swap mistake):
    const byName = Object.fromEntries(
      reg.listCores().map((c) => [c.name, c.kind]),
    );
    expect(byName).toEqual({
      callout: 'component',
      code: 'component',
      image: 'component',
      math: 'render',
      pdf: 'render',
      jupyter: 'viz',
      'nn-viz': 'viz',
      'agent-flow': 'viz',
    });
  });
  ```
  Expected: 1 test PASS. Asserts: (a) the distribution sums match ADR-0009 D1
  (3 component + 2 render + 3 viz = 8 total); (b) each block's `kind` matches
  its source-of-truth `core-definition.ts` declaration; (c) `'prose'` does
  NOT appear (no prose-kind block-* package per ADR-0009 D1). The two
  assertions catch different defects: the first catches "wrong total" (a
  block silently dropped); the second catches "right total, wrong assignment"
  (e.g. someone mis-classifies math as component). Location: same file as
  TC1, third `it(...)`.

- **TC4** (per-package vitest count) Input:
  `pnpm --filter=@skb/editor-shell test`. Expected: exit 0; vitest reports
  `3 files` (`smoke.test.ts` from A1 + `EditorShell.test.tsx` from A2 +
  `registerBlocks.test.ts` new), `6 tests passed` (1 A1 smoke + 2 A2 + 3
  A3 TC1-TC3 = 6). Location: shell at repo root.

- **TC5** (per-package typecheck) Input:
  `pnpm --filter=@skb/editor-shell typecheck`. Expected: exit 0. Validates
  `registerBlocks.ts` + `registerBlocks.test.ts` compile under `strict: true`
  + `exactOptionalPropertyTypes: true` from `tsconfig.base.json` with the new
  9 workspace `@skb/*` deps' types resolving via composite project references.
  Specifically catches: (a) missing `as unknown as BlockUIDefinition` cast
  on 5 of 8 ui-default exports (TS2345 from ComponentType-contravariance +
  exactOptionalPropertyTypes); the 5 = `calloutUIDefault`, `codeUIDefault`,
  `imageUIDefault` (annotated `BlockUIDefinition<NarrowSchema>`) + math /
  pdf (inference-default but TSC narrows via `defineUI`'s generic). The
  remaining 3 (jupyter / nn-viz / agent-flow) require NO cast — verified at
  EXECUTE time both via TSC PASS and `@typescript-eslint/no-unnecessary-type-assertion`
  flagging the cast as a no-op. Cause: their EditorView/RenderView use a
  wider component-type signature that satisfies `ComponentType<BlockViewProps<ZodTypeAny>>`
  variance directly. (b) any missing `references` entry in tsconfig.json
  (would surface as TS2307 "Cannot find module '@skb/block-X'" or similar).
  Location: shell at repo root.

- **TC6** (full repo check still green) Input: `pnpm check`. Expected: exit 0
  (lint + typecheck + test + build + size-check across all 22 packages — no
  new packages added; same 22 packages as A2). Confirms no sibling regression
  from the workspace-graph mutation: the 9 NEW edges from editor-shell to
  foundation + 8 blocks don't introduce circular references (all 9 producers
  are leaves from editor-shell's POV — none of them depend on editor-shell).
  Location: shell at repo root.

- **TC7** (CONTRACT.md updated public surface — in-PR doc-acceptance) Input:
  ```bash
  grep -E '^- ?`?registerBlocks' packages/editor-shell/CONTRACT.md
  grep -E '^- ?`?proseExtensions' packages/editor-shell/CONTRACT.md
  ```
  Expected: ≥1 hit per grep (one bullet for each new export under
  `## Public surface`). Location: shell at repo root.

- **TC8** (ADR-0008 D1 dead-dep policy + decl ↔ source-import + decl ↔
  reference symmetry — the 3-way verification A2 set up the Node template
  for) Input:
  ```bash
  # 9.a — package.json declares 9 @skb/* workspace deps
  node -e 'const p=require("./packages/editor-shell/package.json");const all={...p.dependencies,...p.peerDependencies,...p.devDependencies,...p.optionalDependencies};console.log(Object.keys(all).filter(k=>k.startsWith("@skb/")).length)'
  # Expected: 9

  # 9.b — registerBlocks.ts source-imports all 9
  for pkg in block-foundation block-callout block-code block-image \
             block-math block-pdf block-jupyter block-nn-viz block-agent-flow; do
    grep -q "from '@skb/$pkg" packages/editor-shell/src/registerBlocks.ts \
      && echo "OK: $pkg" || echo "MISSING: $pkg"
  done
  # Expected: 9 OK, 0 MISSING

  # 9.c — tsconfig.json references 9 sibling packages
  node -e 'const t=require("./packages/editor-shell/tsconfig.json");console.log(t.references.length)'
  # Expected: 9
  ```
  Expected: 9 / 9 OK / 9. Three-way symmetry holds: declared deps (9) =
  source imports (9) = tsconfig references (9). ADR-0008 D1 dead-dep
  violations (declared-but-not-imported) are impossible by construction —
  the 9.b grep loop confirms each declared dep has at least one source
  import. ADR-0006 D8 decl ↔ ref symmetry holds via 9.a vs 9.c. The Node
  one-liner over actual dep blocks (not naive `grep '@skb/'`) per A2 TC8
  lesson — naive grep would false-positive on the `"name": "@skb/editor-shell"`
  field. Location: shell at repo root.

- **TC9** (lockfile idempotency post-install — ADR-0006 D8 sub-form C
  invariant) Input: from a clean `git status`, run `pnpm install` and then
  `git diff -- pnpm-lock.yaml`. Expected: empty diff (the lockfile committed
  with this PR is the canonical solve for the 9 new workspace deps; a follow-up
  `pnpm install` produces zero new entries / no reordering). Location: shell
  at repo root. Same-shape assertion as A1 TC6 + A2 TC7.

## contracts_affected

- `packages/editor-shell/CONTRACT.md` — Modified: `## Public surface` adds
  two new bullets:
  1. `registerBlocks(registry: BlockRegistry): void` helper, with a
     one-paragraph description: registers the 8 block-* cores + ui-defaults
     into the passed-in registry; locked plan order (callout, code, image,
     math, pdf, jupyter, nn-viz, agent-flow); kind distribution 3 component
     + 2 render + 3 viz per ADR-0009 D1; throws on duplicate-name /
     unknown-core / duplicate-ui (delegated to BlockRegistry's own register
     methods — see `packages/block-foundation/CONTRACT.md` §Invariants
     "Idempotent register").
  2. `proseExtensions` — re-export from `@skb/block-foundation`; same
     identity (Tiptap extension array providing prose-level markdown
     behavior — paragraph / heading / list / quote / code / link / emphasis /
     typography / task-list / markdown serialization). The authority lives in
     `packages/block-foundation/src/prose.ts`; editor-shell's re-export is a
     pure barrel convenience so consumers (Stage C apps/site) can import
     `EditorShell + registerBlocks + proseExtensions` from one package.

  And: the `## Wave 3 Stage A expansion outline` section's `**A3** —` bullet
  is rewritten from prediction-tense to past-tense ("Delivered in this PR";
  drops the speculative `proseExtensions`-prop-on-EditorShell half — that
  speculative half is NOT delivered, only the barrel re-export is). A4 + A5
  entries stay as-is.

## adr_touched

None. A3 implements the previously locked Wave 3 plan entry (lines 194-235
of `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`) and the
A2 CONTRACT.md prediction (with the speculative prop-API drop — see
`## contracts_affected` above; that drop is a narrowing, NOT an expansion, of
the predicted surface, so no new architecture decision needs codification).
The dispatch context confirms: locked plan A3 row 4 = NO; A2 CONTRACT.md
outline anticipates this exact dep set (9 `@skb/*` workspace deps); ADR-0011
D2 row 4 trigger does not fire.

## acceptance

1. `pnpm --filter=@skb/editor-shell typecheck` exits 0 — TC5 evidence.
   Specifically validates: (a) **5 of 8** `as unknown as BlockUIDefinition`
   casts at registerUI call sites for callout / code / image / math / pdf
   (without them, TS2345 fires per the ComponentType-contravariance trip-hazard
   under `exactOptionalPropertyTypes:true`); (b) the 3 NO-cast registerUI
   call sites for jupyter / nn-viz / agent-flow — adding casts here triggers
   ESLint `@typescript-eslint/no-unnecessary-type-assertion` errors (their
   ui-defaults' EditorView/RenderView use a wider component-type signature
   that satisfies variance directly); (c) the new tsconfig `references` array
   contains all 9 entries (else TS composite project resolution fails with
   TS2307 "Cannot find module").

2. `pnpm --filter=@skb/editor-shell test` exits 0 with `6 passed` (1 A1 smoke +
   2 A2 EditorShell + 3 A3 registerBlocks: TC1+TC2+TC3). TC4 evidence.

3. `packages/editor-shell/CONTRACT.md` `## Public surface` heading body lists
   `registerBlocks` (with signature) + `proseExtensions` (with re-export
   note pointing at `@skb/block-foundation`). The exact signature MUST be
   (locked at PLAN time so reviewer + ACCEPT can pattern-match):
   ```ts
   /** Wires the 8 block-* core + ui-default definitions into a
    *  BlockRegistry instance. Locked order (callout, code, image, math,
    *  pdf, jupyter, nn-viz, agent-flow) — kind-grouped per ADR-0009 D1
    *  (3 component + 2 render + 3 viz). Throws via BlockRegistry's own
    *  register methods on duplicate-name / unknown-core / duplicate-ui. */
   export function registerBlocks(registry: BlockRegistry): void;
   ```
   The exact import strategy (uniform subpath from `@skb/<block>/core` +
   `@skb/<block>/ui-default`) is implementation detail and NOT part of the
   public surface — but the 9 declared workspace deps are. Reviewer rejects
   any PR that:
   - drops `proseExtensions` re-export (locked plan says "also handles prose")
   - adds props to `EditorShell` in this PR (`proseExtensions` is a barrel
     re-export, NOT an EditorShell prop — that's deferred per
     `## Out-of-scope` below)
   - changes the `registerBlocks` signature (e.g. returns `BlockRegistry`
     instead of `void`, or takes a list-of-cores parameter — both deviate
     from locked plan A3 entry "takes registry as argument so consumers can
     use a custom registry" with implicit void return).
   TC7 evidence (grep) + visual review.

4. `pnpm check` exits 0 across all 22 packages — TC6 evidence. No sibling
   regression from the 9 new workspace-graph edges (editor-shell now
   transitively depends on every block-* + foundation; the dep flow is
   acyclic — none of the 9 producers depend on editor-shell, verified at
   PLAN time by grep over each `packages/block-*/package.json` for
   `@skb/editor-shell` returning empty).

5. `proseExtensions` re-export semantics: `import { proseExtensions } from
   '@skb/editor-shell'` MUST resolve to the **same array identity** as
   `import { proseExtensions } from '@skb/block-foundation'`. Verify at
   review time (informal): the editor-shell re-export uses
   `export { proseExtensions } from '@skb/block-foundation'` (a re-export,
   not a deep copy or wrapper); identity is preserved by the ES module
   spec. No runtime test covers this because it's a build-time re-export
   shape; reviewer line-verifies at stage 3.

6. `pnpm-lock.yaml` is regenerated and staged in the same commit as
   `packages/editor-shell/package.json` per ADR-0006 D8 sub-form C; second
   `pnpm install` post-commit produces zero diff (idempotency holds —
   TC9 evidence). Verify staged-pair via `git diff --cached --stat` at
   commit time. Since all 9 new deps are workspace-local (`workspace:*`),
   the lockfile delta is small — only new importer-graph entries under
   `packages/editor-shell:`'s deps section pointing at workspace `link:`
   entries; no new resolution work.

7. The PR.md (`docs/plans/wave-3-main/A3-editor-shell-block-registry.md`) is
   present in the staged file list at commit time per ADR-0006 D8 strict
   whitelist (A1 + A2 lessons + PR #1 R2 lesson).

8. **9 unchanged-files protected**: `pnpm-workspace.yaml`, `agent-contract.md`,
   root `tsconfig.json`, `packages/editor-shell/vitest.config.ts`,
   `packages/editor-shell/src/EditorShell.tsx`,
   `packages/editor-shell/src/__tests__/EditorShell.test.tsx`,
   `packages/editor-shell/src/__tests__/smoke.test.ts`, all 8
   `packages/block-*` directories, `packages/block-foundation/` (entire
   directory) — verified at review time:
   `git diff main -- pnpm-workspace.yaml agent-contract.md tsconfig.json
   packages/editor-shell/vitest.config.ts packages/editor-shell/src/EditorShell.tsx
   packages/editor-shell/src/__tests__/EditorShell.test.tsx
   packages/editor-shell/src/__tests__/smoke.test.ts 'packages/block-*'
   packages/block-foundation` returns empty (modulo nothing in those paths
   should change). A3 only modifies editor-shell's package.json + tsconfig.json
   + CONTRACT.md + src/index.ts (+1 export) + adds 2 new files (registerBlocks.ts
   + registerBlocks.test.ts) + lockfile + this PR.md. The `packages/editor-shell/src/index.ts`
   diff is exactly +2 lines (the 2 new exports), with the 2 A2 lines unchanged.

9. **ADR-0008 D1 dead-dep policy + ADR-0006 D8 decl ↔ ref symmetry**: 9 declared
   workspace deps in package.json AND 9 source imports in registerBlocks.ts
   AND 9 references in tsconfig.json — three-way exact-9 match. TC8 evidence
   (the .a + .b + .c sub-checks). F3-class violations
   (declared-but-not-imported) impossible by construction — the loop in
   TC8.b is the verification.

10. **BlockKind distribution per ADR-0009 D1**: 3 component (callout, code,
    image) + 2 render (math, pdf) + 3 viz (jupyter, nn-viz, agent-flow) = 8
    cores total; `'prose'` does NOT appear (no prose-kind block-* package).
    TC3 evidence (the `byKind` + `byName` dual assertion).

11. **Structure-auditor orphan reduction**: pre-A3, structure-auditor reports
    13 expected orphans (8 block-* + block-foundation + editor-shell + 3
    kernel-* — see Wave 2 close audit log). Post-A3, the 9 new edges from
    editor-shell consume foundation + 8 block-* — those 9 are no longer
    orphans (they have a workspace consumer in editor-shell). editor-shell
    itself remains orphan until A5's mdx-bridge wiring + Stage C apps/site
    consumption. The 3 kernel-* remain orphan until A4's registerKernels.ts.
    Net: orphan count drops from 13 to 4 (editor-shell + 3 kernel-*) post-A3.
    NOT a hard test (orphan reporting is informational; structure-auditor
    runs at Wave 3 close ceremony, not per-PR), but reviewer + ACCEPT note
    the expected number for cross-validation when the audit fires later.

## executor

Transitional dual-path policy continued from A1 + A2. The user has not yet
merged `tmp/codex-profiles.toml` → `~/.codex/config.toml` (Pre-A1 documents
the merge step but does not enforce it). Orchestrator decides at lock time
which path is live by checking `grep -c '^\[profiles\.generic-executor\]'
~/.codex/config.toml`. Same dual-path framing as A1 + A2.

- **PLAN**: `pr-writer` Claude subagent (this dispatch).
- **EXECUTE**:
  - **Path A (preferred — TOML merged)**: `codex-generic-executor` (gpt-5.5,
    workspace-write sandbox per ADR-0011 D6). One-shot dispatch creates the
    1 NEW source file + 1 NEW test file, modifies the 4 non-self in-package
    files (package.json, tsconfig.json, CONTRACT.md, src/index.ts);
    orchestrator runs `pnpm install` after to regenerate `pnpm-lock.yaml`.
    Audit log:
    `.codex-runs/wave-3-main/A3-execute-codex-generic-executor.txt`. The
    locked plan A3 entry's `**executor:** \`codex-generic-executor\`` cue
    (line 224) confirms this path is the canonical choice; no
    `codex-test-scaffolder` split is needed because the 4 test cases share a
    single fixture (a fresh `BlockRegistry` per `it`) and total ~70 LOC.
  - **Path B (transitional — TOML not merged)**: `orchestrator-self`. The 6
    files total ~150 LOC of well-patterned code (registerBlocks.ts mirrors
    block-callout's
    `__tests__/registry-integration.test.ts` cast pattern + block-nn-viz's
    `__tests__/registry-integration.test.ts` direct-pass pattern; test mirrors
    `packages/block-foundation/src/__tests__/registry.test.ts` + RFC §3
    "Consumer-side test template"; package.json mirrors
    `packages/block-callout/package.json`'s `workspace:*` deps pattern;
    tsconfig.json mirrors `packages/block-callout/tsconfig.json`'s
    `references` block); within orchestrator-direct edit scope. Path B is a
    fallback only if Path A is not yet activated. Audit log:
    `.codex-runs/wave-3-main/A3-execute-orchestrator.txt` (Claude
    self-narrated; no codex stdout to capture).
- **REVIEW**:
  - **Path A**: `codex-pr-reviewer-55` (5.5; ADR-0006 8-point checklist
    mandatory; ADR-0006 D8 explicit-file-list staging rules apply at stage 5;
    Row 5 elevated-scrutiny sub-rule applies — the diff touches 10 packages
    transitively via the workspace graph mutation, even though only
    editor-shell has source-file edits). Audit log:
    `.codex-runs/wave-3-main/A3-codex-pr-reviewer-55.txt`. Reviewer must
    specifically verify: (a) the registerBlocks signature matches acceptance
    bullet 3 verbatim (not a different return type, not a different parameter
    list); (b) the 3 component-block ui-defaults have the
    `as unknown as BlockUIDefinition` cast at registerUI; (c) the 5
    render/viz-block ui-defaults pass directly without a cast; (d) all 9
    `@skb/*` deps are at `workspace:*` (not `^0.0.0` or any other resolution
    string); (e) tsconfig `references` length is exactly 9, alphabetical,
    matching the package.json deps list; (f) `proseExtensions` is a
    re-export not a re-definition (`export { proseExtensions } from
    '@skb/block-foundation'`, NOT `export const proseExtensions = [...]`);
    (g) the 7-test count in the vitest output (1 A1 + 2 A2 + 4 A3) — if
    the A2 vitest config's `.tsx` glob regression sneaks in, TC1-TC3 silently
    skip and the run falsely reports "3 passed"; reviewer + ACCEPT both
    verify the count, not just exit-0.
  - **Path B**: transitional `pr-gate` profile (read-only) for line-level
    review; orchestrator-self handles the 8-point checklist + spec-match
    cross-check that `pr-gate` (the older 5.3 profile) under-covers. Audit
    log: `.codex-runs/wave-3-main/A3-pr-gate.txt`.
- **PRE-COMMIT CLAUDE REVIEW** (D1 stage 4 — fires per D2 row 1 trigger
  judgment below): `orchestrator-self`. Mitigates same-model echo-chamber
  risk on the CONTRACT.md public-surface change (the central new-surface
  declaration: 2 new exports). Specifically inspects: (1) the
  `registerBlocks(registry: BlockRegistry): void` signature is identical to
  acceptance bullet 3; (2) `registerBlocks` + `proseExtensions` both exported
  from the editor-shell barrel; (3) the locked plan order (callout, code,
  image, math, pdf, jupyter, nn-viz, agent-flow) is preserved in
  registerBlocks.ts source-line ordering — kind-grouped, NOT alphabetical;
  (4) the `## Wave 3 Stage A expansion outline` A3 line is rewritten to
  past-tense and the speculative `proseExtensions`-prop-on-EditorShell
  half is dropped (matches what's actually delivered).
- **COMMIT**:
  - **Path A**: reviewer codex `codex-pr-reviewer-55` per ADR-0011 D1 stage
    5 + ADR-0006 D8 explicit-file-list staging. Exact stage:
    ```bash
    git reset HEAD
    git add \
      packages/editor-shell/package.json \
      packages/editor-shell/tsconfig.json \
      packages/editor-shell/CONTRACT.md \
      packages/editor-shell/src/index.ts \
      packages/editor-shell/src/registerBlocks.ts \
      packages/editor-shell/src/__tests__/registerBlocks.test.ts \
      pnpm-lock.yaml \
      docs/plans/wave-3-main/A3-editor-shell-block-registry.md
    git diff --cached --stat   # verify exactly 8 files
    git commit
    ```
  - **Path B**: orchestrator-self runs the same 4-step explicit stage. Either
    path commits exactly 8 files; any deviation (notably accidental
    `tsconfig.json` (root) or `agent-contract.md` inclusion via `git add -A`
    or accidental `block-*` modification escaping into the stage list) is
    rejected at stage 5.
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per ADR-0011 D1
  stage 6). Reads PR.md `acceptance:` block + `git diff main..HEAD` and
  verifies each of the 11 acceptance bullets is met; emits ACCEPT or
  REJECT-with-residue.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT.md change): **HIT**.
  `packages/editor-shell/CONTRACT.md` `## Public surface` body changes from
  the A2-locked single-bullet (EditorShell + EditorShellProps) to a 3-bullet
  surface (adds registerBlocks helper + proseExtensions re-export) — a
  substantive contract surface expansion.
- **Row 2** (package add/remove): **NO**. No new workspace package; A3
  adds workspace **deps** to an existing package, not a new package.
- **Row 4** (new ADR required): **NO**. Locked plan line 221 confirms
  `**adr_touched:** None`. A3 implements a previously-sealed plan entry +
  A2's predicted CONTRACT.md outline (with a narrowing, not an expansion);
  the BlockKind 4-way classification was already authorized by ADR-0009 D1;
  no architecture decision needs codification.
- **Row 5** (cross ≥ 3 packages): **HIT**. The diff itself touches one source
  package (`packages/editor-shell`) plus `pnpm-lock.yaml` plus this PR.md.
  But the **workspace-graph mutation** (9 new dep edges from editor-shell to
  foundation + 8 blocks) transitively involves 10 packages, and any compile
  failure on the producer side would cascade. ADR-0011 D2 row 5
  ("cross ≥ 3 packages") is interpreted to include workspace-graph mutations
  of this size, NOT just files-modified across packages — locked plan line
  226-228 explicitly calls out row 5 hit.
- **Row 8** (CI / build / deploy / auth / security): **NO**. No
  `.github/workflows/*.yml`, no deploy/auth/security config touched.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 1 hit; orchestrator-self,
mitigates codex same-model echo-chamber risk on the CONTRACT.md public-surface
change). Row 5 elevates reviewer scrutiny within stage 3 (per ADR-0011 D2 row
5 sub-rule); reviewer's 8-point checklist coverage of cross-package symmetry
+ peer-dep discipline is mandatory.

## Out-of-scope (explicitly deferred)

- **kernel-registry / kernel-adapter / kernel-pyodide workspace deps** — A4
  adds via `registerKernels.ts` plumbing. A3 stays foundation + 8 blocks;
  any kernel imports here would be scope creep.
- **mdx-bridge workspace dep** — A5 adds via `saveLoad.ts` round-trip glue.
- **`proseExtensions` prop on `EditorShell`** — A3 ships `proseExtensions`
  as a barrel re-export only; it does NOT add a `proseExtensions` prop to
  `EditorShell` (the speculative prop in A2's outline is dropped — see
  `## contracts_affected`). The current A2-delivered `EditorShell.tsx`
  hard-codes `[StarterKit]` in its `useEditor({ extensions: [StarterKit] })`
  call; switching to `proseExtensions` would change the editor's prose
  behavior surface (adds Typography, TaskList, Markdown — see
  `packages/block-foundation/src/prose.ts:14-20`) and is a behavior change,
  not a wiring change. Deferred to A3+ refactor PR (orchestrator decision)
  if + when the editor-shell consumer ergonomics demand it. At A3,
  `proseExtensions` is a re-export consumers can use to compose their own
  Tiptap extension list around `<EditorShell />`.
- **`registerBlocks` returning `BlockRegistry` for chaining** — A3 returns
  `void` per locked plan A3 entry "takes registry as argument so consumers
  can use a custom registry" (implicit void return — chaining was not
  proposed). If a consumer wants chaining, they wrap:
  `const reg = new BlockRegistry(); registerBlocks(reg); return reg;`. No
  real cost.
- **A `registerProse(registry)` separate helper** — `BlockRegistry` has no
  `registerProse` method (per `packages/block-foundation/src/registry.ts`
  inspection). `proseExtensions` is consumed by Tiptap directly via the
  `extensions: [...]` argument, not registered into a registry. A3 ships
  the re-export to give consumers the import; consumers wire it into their
  own `useEditor({ extensions: [...proseExtensions] })` call. Future ADR
  may add a `registerProse` method to `BlockRegistry` if the wiring needs
  centralization, but that's an ADR-level decision (BlockRegistry is part
  of block-foundation's frozen public surface per ADR-0008 D2).
- **Naming inconsistency `xUIDefault` vs `xUiDefault`** — the 3 component
  blocks (block-callout, block-code, block-image) export `calloutUIDefault`
  / `codeUIDefault` / `imageUIDefault` (all-caps "UI"); the 5 render/viz
  blocks (block-math, block-pdf, block-jupyter, block-nn-viz, block-agent-flow)
  export `mathUiDefault` / `pdfUiDefault` / `jupyterUiDefault` /
  `nnVizUiDefault` / `agentFlowUiDefault` (camel "Ui"). This is a Wave 2
  artifact: callout/code/image were authored before the naming convention
  solidified (see git log on those packages' early commits) and adopted
  the `UIDefault` form; the later 5 adopted `UiDefault`. A3 does NOT
  fix this in either direction — pure consumption only. Forward-fix
  candidate for Wave 3 close ceremony cleanup; would be a one-line per-
  package rename touching 5 (or 3) ui-default/index.ts files + their
  consumers in `__tests__/*.tsx` + `registerBlocks.ts` (this A3 PR's
  output) — minor mechanical work, but cross-package and so deferred to
  a coordinated rename PR. Same-package consistency (per-block `xCore`
  always lowercase first-letter, `xU[Ii]Default` matching) is preserved
  by the existing form.
- **Cast-removal refactor** — the `as unknown as BlockUIDefinition` casts
  on 5 of 8 ui-defaults (callout/code/image/math/pdf) are a working-around-
  TS2345 pattern (ComponentType contravariance + `exactOptionalPropertyTypes`
  vs the `<TSchema extends ZodTypeAny>` generic in `BlockUIDefinition`).
  EXECUTE-time discovery: jupyter/nn-viz/agent-flow ui-defaults satisfy
  variance directly without cast (their EditorView/RenderView use a wider
  ComponentType signature). A proper fix is to type-narrow `BlockUIDefinition`'s
  generic to
  `ZodObject<...>` (Wave 3 deferral noted in `packages/block-foundation/CONTRACT.md`
  § Invariants — Schema strictness "type-narrow to ZodObject deferred to
  Wave 3"). That ADR-level change touches the foundation public surface
  and would be a separate ADR PR; A3 stays consumer-only and uses the
  same cast that the existing `__tests__/ui-default.test.tsx` files already
  use.
- **Real `<EditorShell />` consumer** — no apps/site wiring at A3. The first
  consumer that imports `EditorShell` + `registerBlocks` lands at Wave 3
  Stage C (apps/site routing). Until then, ADR-0008 D1 allows a package
  with a declared public surface but zero importers — `editor-shell` itself
  remains orphan from the structure-auditor POV until A5 + Stage C lands.
  See `## acceptance` bullet 11.
- **Visual / a11y testing of the wired blocks** — no Playwright, no axe-core
  on the registered ui-defaults. happy-dom + Vitest is sufficient at A3 to
  prove the registration contract; per-block visual + a11y testing already
  lives in each `block-*` package's own test suite (e.g.
  `packages/block-callout/src/__tests__/ui-default.test.tsx` covers
  CalloutEditorView's a11y attrs). No duplication needed at editor-shell.

## Risk grid (Wave 3 main pipeline standing)

Mirrors A2's grid; A3 specifics:

- Lockfile delta — small (all 9 deps are workspace-local `link:` entries).
  If Path A reviewer sees a 1000+ line lockfile diff, that's a flag —
  investigate before commit (likely an external resolution drift unrelated
  to A3, NOT a workspace dep addition).
- Test silently passing — A2 already locked the `vitest.config.ts` `.tsx`
  glob; A3's test file is `.ts` (no React render needed; pure logic test
  against `BlockRegistry`). The glob covers `.test.{ts,tsx}` so both work.
  TC4 acceptance check (`6 passed`) catches a silent skip; reviewer +
  ACCEPT both verify the count.
- TS2345 from missed cast — 5 of 8 ui-defaults (callout/code/image/math/pdf)
  require `as unknown as BlockUIDefinition` cast at registerUI; missing the
  cast fires TS2345 at typecheck (not silent — TC5 catches it). The
  remaining 3 (jupyter/nn-viz/agent-flow) need NO cast — adding one
  triggers ESLint `no-unnecessary-type-assertion` error. Reviewer +
  ACCEPT bullet 1 sub-clause (a) explicitly verifies this 5-cast/3-no-cast
  asymmetry.
- Same-model echo chamber — mitigated by D1 stage 4 PRE-COMMIT CLAUDE
  REVIEW (Row 1 hit). orchestrator-self specifically inspects the
  registerBlocks signature + the 9 dep declarations vs 9 source imports
  vs 9 references three-way symmetry.
- Cross-package compile-failure cascade (Row 5 elevated scrutiny) — if any
  of the 9 producers had a typecheck regression at HEAD, A3's `pnpm check`
  TC6 would surface it (the new edges force foundation + 8 blocks to
  re-typecheck transitively). Pre-PLAN check: `pnpm
  --filter=@skb/block-foundation typecheck` + per-block typechecks all
  PASS at HEAD `4350071` (verified before locking this PR.md).
- A2 `EditorShell.tsx` regression — A3 explicitly does NOT modify
  `EditorShell.tsx`. The acceptance bullet 8 grep ensures it. If the
  executor accidentally edits EditorShell.tsx (e.g. to wire
  `proseExtensions` as a prop — which is OUT OF SCOPE per
  `## Out-of-scope`), reviewer rejects.

## Related

- [ADR-0011 D1+D2+D6](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pipeline + PR.md schema this PR follows; D6 introduces the codex profiles
  this PR's executor block conditionally selects.
- [ADR-0006 D8](../../decisions/ADR-0006-asymmetry-audit-checklist.md) —
  explicit-file-list staging + sub-form C lockfile rule (the lockfile-blob
  invariant cited in COMMIT block + acceptance bullet 6) + decl ↔ ref
  symmetry rule (acceptance bullet 9 + TC8.c).
- [ADR-0008 D1](../../decisions/ADR-0008-wave-2-entry-policies.md) — dead-dep
  policy (tighten); A3 ships 9 workspace deps, all 9 source-imported in
  registerBlocks.ts (TC8.b verifies).
- [ADR-0008 D2](../../decisions/ADR-0008-wave-2-entry-policies.md) —
  block-foundation public surface freeze authority (registerCore /
  registerUI / BlockRegistry shape A3 consumes).
- [ADR-0009 D1](../../decisions/ADR-0009-block-kind-union-expansion.md) —
  BlockKind 2→4 expansion authority (the 3 component + 2 render + 3 viz
  distribution A3 TC3 verifies).
- [ADR-0010 D7 #3](../../decisions/ADR-0010-wave-2-close.md) —
  "editor-shell composition" deferral that Stage A closes; A3 is the third
  step (after A1 skeleton + A2 Tiptap container) toward closing it.
- [ADR-0003 D1+D2](../../decisions/ADR-0003-headless-presentational-split.md)
  — core / UI 双层 split; the 8 cores A3 registers all conform to this
  split (no React in core, schema in core, view components in ui-default).
- [Wave 3 plan, A3 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md)
  — locked plan entry (lines 194-235), Stage A intro (lines 111-117).
- [A1 PR.md](./A1-editor-shell-skeleton.md) — predecessor PR (created the
  empty package).
- [A2 PR.md](./A2-editor-shell-tiptap-container.md) — immediate predecessor
  PR (just merged `4350071`); created the EditorShell component whose
  CONTRACT.md `## Wave 3 Stage A expansion outline` section A3's
  package.json + CONTRACT.md changes deliver verbatim.
- [Pre-A1 PR.md](./Pre-A1-codex-profile-toml-merge.md) — bootstrap predecessor
  that documented the codex-profile TOML merge that Path A EXECUTE depends on.
- [packages/block-foundation/CONTRACT.md](../../../packages/block-foundation/CONTRACT.md)
  — public API surface A3 consumes (BlockRegistry, registerCore, registerUI,
  proseExtensions).
- [packages/block-foundation/RFC.md](../../../packages/block-foundation/RFC.md)
  — RFC §1+§2 walkthrough A3 mirrors; §2 "first-registered = default"
  convention TC2 verifies.
- [packages/block-foundation/src/registry.ts](../../../packages/block-foundation/src/registry.ts)
  — implementation of BlockRegistry; A3's registerBlocks is the first
  multi-block consumer.
- [packages/block-foundation/src/prose.ts](../../../packages/block-foundation/src/prose.ts)
  — `proseExtensions` source of truth A3's barrel re-export points at.
- [packages/block-callout/src/__tests__/ui-default.test.tsx](../../../packages/block-callout/src/__tests__/ui-default.test.tsx)
  — typed-UIDefault cast pattern (`as unknown as BlockUIDefinition` at
  registerUI line 26) A3's registerBlocks.ts mirrors for 5 of 8 blocks
  (callout/code/image/math/pdf).
- [packages/block-nn-viz/src/__tests__/registry-integration.test.ts](../../../packages/block-nn-viz/src/__tests__/registry-integration.test.ts)
  — inferred-UiDefault direct-pass pattern (no cast at registerUI line 23)
  A3's registerBlocks.ts mirrors for jupyter/nn-viz/agent-flow.
- [packages/block-math/src/ui-default/math.ui.ts](../../../packages/block-math/src/ui-default/math.ui.ts)
  — analysis of WHY the inferred form skips the explicit
  `BlockUIDefinition<typeof xCore.propsSchema>` annotation (lines 5-15);
  background for acceptance bullet 1 sub-clause (a).
- [packages/block-foundation/src/__tests__/registry.test.ts](../../../packages/block-foundation/src/__tests__/registry.test.ts)
  — registry-mechanics tests (defensive copy + idempotent register) the
  authoritative source for invariants A3 consumes (defensive-copy regression deferred to a future cleanup PR per locked-plan TDD-front strict scope; the real defensive-copy test lives in `packages/block-foundation/src/__tests__/registry.test.ts`).
