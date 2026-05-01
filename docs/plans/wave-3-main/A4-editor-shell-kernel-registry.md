# A4 — editor-shell kernel-registry boot

> **Wave 3 main pipeline fifth PR (fourth of Stage A).** Wires `PyodideAdapter`
> into a `KernelRegistry` instance via a new `registerKernels(registry, adapter?)`
> helper, with a default-param override hook so consumers can inject an
> alternative `KernelAdapter` (e.g. a mock at test time, or a future
> non-Pyodide adapter). NO mdx-bridge save/load wiring (A5). A4 mirrors A3's
> consumer-side workspace-graph mutation pattern at smaller scope: 3 new
> `@skb/kernel-*` deps vs A3's 9. Closes A3's
> "Wave 3 Stage A expansion outline" prediction for A4 verbatim — any
> deviation from that prediction at A4 is scope drift.

## title

Add `registerKernels(registry: KernelRegistry, adapter?: KernelAdapter): void`
helper to `@skb/editor-shell` that registers `PyodideAdapter` (default-param
constructed) into a passed-in `KernelRegistry` instance, with optional
`adapter` override for consumers that want to inject a custom `KernelAdapter`;
CONTRACT.md updates `## Public surface` to declare the new helper and
rewrites the `## Wave 3 Stage A expansion outline` `**A4** —` line from
prediction-tense to past-tense.

## files

Created (NEW — 1 source file + 1 test file):

- `packages/editor-shell/src/registerKernels.ts` *(the helper function. Imports
  `KernelRegistry` from `@skb/kernel-registry`, `PyodideAdapter` from
  `@skb/kernel-pyodide`, and `type KernelAdapter` from `@skb/kernel-adapter`.
  See `## acceptance` bullet 5 for the rationale on why three workspace deps
  are needed (the dispatch's initial "2 new" undercounted the type-only
  `@skb/kernel-adapter` import — `KernelAdapter` is NOT re-exported by either
  kernel-registry or kernel-pyodide; verified at PLAN time via grep of those
  packages' `src/index.ts` files). Function uses TypeScript default-param
  syntax to expose the override hook canonically:
  ```ts
  import type { KernelAdapter } from '@skb/kernel-adapter';
  import { KernelRegistry } from '@skb/kernel-registry';
  import { PyodideAdapter } from '@skb/kernel-pyodide';

  export function registerKernels(
    registry: KernelRegistry,
    adapter: KernelAdapter = new PyodideAdapter(),
  ): void {
    registry.register(adapter);
  }
  ```
  `KernelRegistry` is imported as a value (used in the test file's `instanceof`
  / construction; in `registerKernels.ts` itself it is a type position only,
  but TypeScript's `import { KernelRegistry }` works for both type-position
  and runtime use, and a value import keeps the import shape uniform).
  `KernelAdapter` is `import type` because it is type-only at the function
  signature; this keeps the runtime import graph tighter and avoids loading
  `@skb/kernel-adapter` value bindings at consumer load time.
  `new PyodideAdapter()` is **cheap** at instantiation per
  `packages/kernel-pyodide/src/adapter.ts:32-34` (constructor only stores a
  factory closure — no Pyodide load happens until `startSession()`); so the
  default-param eager construction has no measurable cost at editor-shell
  consumer mount time. Function is `void`-returning; throw responsibility
  delegated to `KernelRegistry.register`'s own duplicate-id check
  (`packages/kernel-registry/src/registry.ts:7-9` throws on duplicate id).
  Estimated ~20-30 LOC including imports.)*
- `packages/editor-shell/src/__tests__/registerKernels.test.ts` *(TC1-TC3 — see
  `## test_cases`. Vitest happy-dom env (already set by A2's vitest.config.ts;
  no DOM is actually exercised, inherited config). Uses `KernelRegistry` from
  `@skb/kernel-registry` directly — fresh registry per `it(...)` for case
  independence, same pattern A3 used for `BlockRegistry`. NO `setTimeout`,
  NO `await Promise.resolve` — registerKernels + KernelRegistry.register +
  KernelRegistry.list are all synchronous; only `KernelRegistry.startSession`
  is async, and A4 does NOT exercise startSession (TC2 verifies the
  registered instance via `instanceof PyodideAdapter` without calling
  startSession; TC3 uses a mock adapter object literal whose startSession is
  never called either). Estimated ~30-40 LOC including imports.)*

Modified (5 files):

- `packages/editor-shell/src/index.ts` — adds 1 new export next to the existing
  A2 + A3 lines (without removing them):
  - `export { registerKernels } from './registerKernels';`
  Net delta: +1 line. Existing A2 + A3 lines (`EditorShell`, `EditorShellProps`,
  `registerBlocks`, `proseExtensions` re-export) unchanged.
- `packages/editor-shell/CONTRACT.md` — three coordinated edits:
  1. Add bullet for `registerKernels(registry: KernelRegistry, adapter?: KernelAdapter): void`
     under `## Public surface`, with the exact signature and a one-paragraph
     description of what it registers (default = `PyodideAdapter`; consumer
     override via the optional second param; throws via `KernelRegistry.register`
     on duplicate id).
  2. Rewrite the `**A4** —` line in `## Wave 3 Stage A expansion outline`
     from prediction-tense to past-tense ("Delivered in this PR"); A5 entry
     stays as-is. The pre-existing prediction-tense text reads:
     `'A4' — registerKernels(registry) helper. Wires PyodideAdapter into
     kernel-registry. Adds @skb/kernel-registry + @skb/kernel-pyodide
     workspace deps.` The actual A4 surface adds the `adapter?:
     KernelAdapter = new PyodideAdapter()` override hook (locked plan said
     "consumers can override", which is operationalized as a default-param
     in this PR — see `## acceptance` bullet 3 for why default-param is the
     canonical override shape) and adds a third workspace dep
     `@skb/kernel-adapter` for the type-only `KernelAdapter` import (the A3
     CONTRACT.md outline's "2 deps" prediction was an undercount; this PR's
     3-dep delivery is a narrowing-of-scope insofar as it's the minimum
     needed to type the override surface).
  3. Update the bottom paragraph (`[ADR-0008 D1] dead-dep policy is satisfied
     at A3 by construction…`) to reflect the post-A4 dep totals: 12 declared
     deps + 12 source imports + 12 tsconfig references (9 from A3 + 3 new in
     A4). The exact wording extends the existing claim, not replaces it.
- `packages/editor-shell/package.json` — adds 3 `@skb/kernel-*` workspace deps
  under `dependencies` (not peer; kernel-registry + kernel-pyodide are direct
  runtime imports of the helper; kernel-adapter is type-only but still a
  declared workspace dep per ADR-0008 D1 dead-dep policy — type-only imports
  count toward the dep declaration just as runtime imports do, and the source
  import in `registerKernels.ts` is the lone reason it appears under
  dependencies):
  - `@skb/kernel-adapter: workspace:*`
  - `@skb/kernel-pyodide: workspace:*`
  - `@skb/kernel-registry: workspace:*`
  All 3 use `workspace:*` matching the pattern across the workspace
  (e.g. `packages/block-callout/package.json` uses `workspace:*` for
  `@skb/block-foundation`). Order in JSON: alphabetical within `dependencies`
  block — these 3 slot between the existing `@skb/block-pdf` (last `block-*`)
  and `@tiptap/starter-kit` entries. Final dependencies block has 13 entries
  total: 9 `@skb/block-*` (from A3) + 3 `@skb/kernel-*` (new) +
  `@tiptap/starter-kit` (from A2). No peerDependency or devDependency
  additions. The `@tiptap/starter-kit` dep stays per A3 + A2 reasoning
  (deferred to a future StarterKit→proseExtensions refactor PR; out of scope
  for A4).
- `packages/editor-shell/tsconfig.json` — adds 3 `references` entries (one per
  workspace dep), alphabetical order matching the package.json. Final
  references array length: 12 (9 from A3 + 3 new). Insertion points:
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
    { "path": "../block-pdf" },
    { "path": "../kernel-adapter" },
    { "path": "../kernel-pyodide" },
    { "path": "../kernel-registry" }
  ]
  ```
  ADR-0006 D8 "decl ↔ ref" symmetry: every `@skb/*` `dependencies` entry MUST
  have a matching `references` entry (TS composite-project graph correctness;
  otherwise cross-package typecheck breaks). Verified at TC8 below.
- `pnpm-lock.yaml` — regenerated by `pnpm install` after `package.json` edits.
  ADR-0006 D8 sub-form C: lockfile is generated-from-authority, MUST stage in
  the same commit as authority. Delta size expectation: small (the 3
  `@skb/kernel-*` packages are already in the workspace graph; pnpm just
  adds 3 new importer-graph entries under `packages/editor-shell:`'s deps
  section pointing at workspace `link:` entries — no new resolution work
  since all 3 are local).

Self-listed:

- `docs/plans/wave-3-main/A4-editor-shell-kernel-registry.md` *(this PR.md
  itself — explicit-listed per ADR-0006 D8 strict whitelist; A1-A3 +
  PR #1 R2 lessons: PR.md MUST self-list in `files:` whitelist)*

**Explicitly NOT in `files:`** (verification-only, no edit):

- `tsconfig.json` (root) — A1 already added the `editor-shell` reference; A4
  does NOT add NEW packages so the root references list stays unchanged.
  The 3 `kernel-*` packages were added at root tsconfig in their respective
  Wave 2 origin PRs. Verify: `git diff main -- tsconfig.json` returns empty.
- `pnpm-workspace.yaml` — unchanged (existing `packages/*` glob; A4 makes no
  new package).
- `agent-contract.md` — A4 is additive consumer wiring within an established
  package; no contract surface in the single-source contract changes. Verify:
  `git diff main -- agent-contract.md` returns empty.
- `packages/editor-shell/vitest.config.ts` — A2 already set `include:
  ['src/**/*.test.{ts,tsx}']` + `environment: 'happy-dom'`; A4 inherits both.
  Verify: empty diff.
- A1-A3 deliverables — A4 modifies NEITHER `EditorShell.tsx`,
  `__tests__/EditorShell.test.tsx`, `__tests__/smoke.test.ts`,
  `registerBlocks.ts`, nor `__tests__/registerBlocks.test.ts`. Verify all
  five paths return empty diffs:
  ```bash
  git diff main -- \
    packages/editor-shell/src/EditorShell.tsx \
    packages/editor-shell/src/__tests__/EditorShell.test.tsx \
    packages/editor-shell/src/__tests__/smoke.test.ts \
    packages/editor-shell/src/registerBlocks.ts \
    packages/editor-shell/src/__tests__/registerBlocks.test.ts
  ```
- All 8 `packages/block-*` packages + `packages/block-foundation` — A4 does
  not touch them; A3 was the producer wiring. Verify:
  `git diff main -- 'packages/block-*' packages/block-foundation` empty.
- All 3 `packages/kernel-*` packages (`kernel-adapter`, `kernel-registry`,
  `kernel-pyodide`) — A4 is a pure consumer; zero modifications to producers.
  Verify: `git diff main -- 'packages/kernel-*'` returns empty (modulo
  `pnpm-lock.yaml` which sits outside packages/).
- Wave 3 plan file
  `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md` — locked
  at PLAN seal time; per-PR status updates deferred to a Stage A closeout PR
  after A5.

## test_cases

- **TC1** (default-param registration — registry.list() length 1, id 'pyodide')
  Input:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { KernelRegistry } from '@skb/kernel-registry';
  import { PyodideAdapter } from '@skb/kernel-pyodide';
  import { registerKernels } from '../registerKernels';

  it('registers PyodideAdapter under id "pyodide" by default', () => {
    const r = new KernelRegistry();
    registerKernels(r);
    const ids = r.list().map((a) => a.id);
    expect(ids).toEqual(['pyodide']);
  });
  ```
  Expected: 1 test PASS. Asserts: (a) registerKernels with no second arg
  registers exactly one adapter; (b) that adapter's `id === 'pyodide'`
  (literal `id` field on `PyodideAdapter` per
  `packages/kernel-pyodide/src/adapter.ts:23`); (c) `r.list()` returns
  insertion-order array (Map iteration order per ECMAScript spec; verified
  by `KernelRegistry.list` returning `[...this.#adapters.values()]` per
  `packages/kernel-registry/src/registry.ts:17-19`). Location:
  `packages/editor-shell/src/__tests__/registerKernels.test.ts:N` (executor
  places at first `it(...)` in new file).

- **TC2** (`registry.get('pyodide')` returns a PyodideAdapter instance)
  Input:
  ```ts
  it('registry.get("pyodide") returns a PyodideAdapter instance', () => {
    const r = new KernelRegistry();
    registerKernels(r);
    const adapter = r.get('pyodide');
    expect(adapter).toBeInstanceOf(PyodideAdapter);
  });
  ```
  Expected: 1 test PASS. Asserts: the registered adapter is the actual
  `PyodideAdapter` class instance (constructed via the default-param
  `new PyodideAdapter()`), NOT a different KernelAdapter subclass or
  duck-typed substitute. The `instanceof` check is the strongest available
  assertion that the default-param branch fired (vs the consumer-override
  branch which TC3 covers). Note: `r.get('pyodide')` returns
  `KernelAdapter | undefined` per `packages/kernel-registry/src/registry.ts:13`;
  `toBeInstanceOf(PyodideAdapter)` narrows past undefined and verifies the
  concrete class. Per
  `packages/kernel-pyodide/src/adapter.ts:32-34`, the constructor does NOT
  boot Pyodide — it only stores a factory closure — so this test is cheap
  (no async, no real WASM load). Location: same file as TC1, second `it(...)`.

- **TC3** (consumer override — second-arg adapter is registered, default is NOT)
  Input:
  ```ts
  import type { KernelAdapter, KernelCapabilities } from '@skb/kernel-adapter';

  it('consumer-override path: passes adapter wins; PyodideAdapter NOT registered', () => {
    const capabilities: KernelCapabilities = {
      libraries: [],
      gpu: false,
      persistentState: false,
    };
    const mock: KernelAdapter = {
      id: 'mock-kernel',
      capabilities,
      startSession: () => Promise.reject(new Error('mock startSession not exercised')),
    };
    const r = new KernelRegistry();
    registerKernels(r, mock);
    const ids = r.list().map((a) => a.id);
    expect(ids).toEqual(['mock-kernel']);
    expect(r.get('mock-kernel')).toBe(mock);
    expect(r.get('pyodide')).toBeUndefined();
  });
  ```
  Expected: 1 test PASS. Asserts: (a) when a second-arg adapter is supplied,
  it replaces the default — `mock-kernel` registers, `pyodide` does NOT;
  (b) the registered reference is identity-equal (`toBe(mock)`) to the
  passed-in object — registerKernels does NOT clone or wrap the adapter;
  (c) the default-param branch is skipped entirely when an explicit adapter
  is provided (witness: `r.get('pyodide')` returns `undefined`). The mock
  adapter's `startSession` rejects with a clear error if accidentally
  invoked, but TC3 never calls startSession — registration is the only
  surface under test. Location: same file as TC1, third `it(...)`.

- **TC4** (per-package vitest count) Input:
  `pnpm --filter=@skb/editor-shell test`. Expected: exit 0; vitest reports
  `4 files passed (4)` (`smoke.test.ts` from A1 + `EditorShell.test.tsx`
  from A2 + `registerBlocks.test.ts` from A3 + `registerKernels.test.ts`
  new) and `9 passed (9)` total tests (1 A1 smoke + 2 A2 EditorShell + 3 A3
  registerBlocks + 3 A4 registerKernels = 9). Locked at PLAN time so reviewer
  + ACCEPT can pattern-match against the actual vitest output. Location:
  shell at repo root.

- **TC5** (per-package typecheck) Input:
  `pnpm --filter=@skb/editor-shell typecheck`. Expected: exit 0. Validates
  `registerKernels.ts` + `registerKernels.test.ts` compile under
  `strict: true` + `exactOptionalPropertyTypes: true` from `tsconfig.base.json`
  with the new 3 workspace `@skb/kernel-*` deps' types resolving via
  composite project references. Specifically catches: (a) any missing
  `references` entry in tsconfig.json (would surface as TS2307 "Cannot find
  module '@skb/kernel-X'"); (b) the default-param assignability — TS2322
  if `PyodideAdapter` did NOT structurally satisfy `KernelAdapter` (it does,
  per the `class PyodideAdapter implements KernelAdapter` declaration at
  `packages/kernel-pyodide/src/adapter.ts:22`); (c) TC3's mock-adapter
  literal compiling against the `KernelAdapter` interface (catches drift if
  `@skb/kernel-adapter`'s shape changes mid-flight). NO `as unknown as`
  cast is expected anywhere in registerKernels.ts or its test — the
  PyodideAdapter→KernelAdapter assignment is direct (subtype via `implements`),
  and the mock adapter is annotated `: KernelAdapter` which TS structurally
  validates against the interface. If a cast appears in the executor's
  output, reviewer rejects (potential symptom of accidentally importing a
  divergent type). Location: shell at repo root.

- **TC6** (full repo check still green) Input: `pnpm check`. Expected: exit 0
  (lint + typecheck + test + build + size-check across all 22 packages — no
  new packages added; same 22 packages as A3). Confirms no sibling regression
  from the 3 new workspace-graph edges (editor-shell now transitively also
  depends on kernel-adapter + kernel-pyodide + kernel-registry; the dep flow
  is acyclic — none of the 3 producers depend on editor-shell, verified at
  PLAN time by grep over each `packages/kernel-*/package.json` for
  `@skb/editor-shell` returning empty). Location: shell at repo root.

- **TC7** (CONTRACT.md updated public surface — in-PR doc-acceptance) Input:
  ```bash
  grep -E '^- ?`?registerKernels' packages/editor-shell/CONTRACT.md
  ```
  Expected: ≥1 hit (one bullet for `registerKernels` under `## Public
  surface`). Pattern-matches the A3 TC7 form. Location: shell at repo root.

- **TC8** (ADR-0008 D1 dead-dep policy + ADR-0006 D8 decl ↔ source-import +
  decl ↔ reference symmetry — three-way at scale 12). Input:
  ```bash
  # 8.a — package.json declares 12 @skb/* workspace deps
  node -e 'const p=require("./packages/editor-shell/package.json");const all={...p.dependencies,...p.peerDependencies,...p.devDependencies,...p.optionalDependencies};console.log(Object.keys(all).filter(k=>k.startsWith("@skb/")).length)'
  # Expected: 12

  # 8.b — registerBlocks.ts + registerKernels.ts together source-import all 12
  for pkg in block-foundation block-callout block-code block-image \
             block-math block-pdf block-jupyter block-nn-viz block-agent-flow \
             kernel-adapter kernel-pyodide kernel-registry; do
    if grep -q "from '@skb/$pkg" \
       packages/editor-shell/src/registerBlocks.ts \
       packages/editor-shell/src/registerKernels.ts; then
      echo "OK: $pkg"
    else
      echo "MISSING: $pkg"
    fi
  done
  # Expected: 12 OK, 0 MISSING

  # 8.c — tsconfig.json references 12 sibling packages
  node -e 'const t=require("./packages/editor-shell/tsconfig.json");console.log(t.references.length)'
  # Expected: 12
  ```
  Expected: 12 / 12 OK / 12. Three-way symmetry holds: declared deps (12) =
  source imports (12) = tsconfig references (12). The grep loop spans BOTH
  source files (registerBlocks.ts + registerKernels.ts) per the dispatch
  context's "per-dep grep loop spanning BOTH source files" cue — A4's 3 new
  imports live in registerKernels.ts; A3's 9 live in registerBlocks.ts; the
  loop OR's over both. ADR-0008 D1 dead-dep violations
  (declared-but-not-imported) impossible by construction. ADR-0006 D8 decl ↔
  ref symmetry holds via 8.a vs 8.c. Node one-liner over actual dep blocks
  (not naive `grep '@skb/'`) per A2 + A3 TC8 lesson — naive grep would
  false-positive on the `"name": "@skb/editor-shell"` field. Location: shell
  at repo root.

- **TC9** (lockfile idempotency post-install — ADR-0006 D8 sub-form C
  invariant) Input: from a clean `git status`, run `pnpm install` and then
  `git diff -- pnpm-lock.yaml`. Expected: empty diff (the lockfile committed
  with this PR is the canonical solve for the 3 new workspace deps; a
  follow-up `pnpm install` produces zero new entries / no reordering).
  Location: shell at repo root. Same-shape assertion as A3 TC9.

## contracts_affected

- `packages/editor-shell/CONTRACT.md` — Modified: `## Public surface` adds
  one new bullet:
  - `registerKernels(registry: KernelRegistry, adapter?: KernelAdapter): void`
    — wires a `KernelAdapter` into the supplied `KernelRegistry` instance.
    Default behavior: registers a fresh `PyodideAdapter` (constructed via
    `new PyodideAdapter()` — cheap; the heavy Pyodide WASM load is deferred
    to `KernelRegistry.startSession('pyodide', sessionId)`). Override
    behavior: passing a second `adapter` arg replaces the default — registers
    that adapter instead, and `PyodideAdapter` is NOT instantiated. Throws
    via `KernelRegistry.register` on duplicate id (delegated; see
    `packages/kernel-registry/CONTRACT.md`).

  And: the `## Wave 3 Stage A expansion outline` section's `**A4** —` bullet
  is rewritten from prediction-tense to past-tense ("Delivered in this PR";
  notes the `adapter?` override hook + the third workspace dep
  `@skb/kernel-adapter`). A5 entry stays as-is.

  And: the bottom paragraph (`[ADR-0008 D1] dead-dep policy is satisfied at
  A3 by construction…`) is updated to reflect the post-A4 scale: 12 declared
  deps + 12 source imports + 12 tsconfig references; mentions that
  registerKernels.ts + registerBlocks.ts together cover all 12.

## adr_touched

None. A4 implements the previously locked Wave 3 plan entry (lines 250-281
of `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`) and the
A3 CONTRACT.md prediction (with one narrowing — see `## acceptance` bullet 5
on the third workspace dep). No new architecture decision needs codification:
- The default-param override pattern (`adapter: KernelAdapter = new
  PyodideAdapter()`) is canonical TypeScript surface, not an architectural
  decision.
- Adding a third workspace dep `@skb/kernel-adapter` follows ADR-0008 D1
  (declared deps must be source-imported) — the `import type` from
  `@skb/kernel-adapter` is a real source import, so the declared dep is
  required.
- KernelRegistry / PyodideAdapter / KernelAdapter shapes are governed by
  Wave 2 origin contracts in `packages/kernel-{registry,pyodide,adapter}/CONTRACT.md`
  and not redefined here.

The dispatch context confirms: locked plan A4 row 4 = NO; A3 CONTRACT.md
outline anticipates this dep set (with the count-correction noted above);
ADR-0011 D2 row 4 trigger does not fire.

## acceptance

1. `pnpm --filter=@skb/editor-shell typecheck` exits 0 — TC5 evidence.
   Specifically validates: (a) `PyodideAdapter` structurally satisfies
   `KernelAdapter` at the default-param assignment site without a cast (per
   `class PyodideAdapter implements KernelAdapter` in
   `packages/kernel-pyodide/src/adapter.ts:22`); (b) the new tsconfig
   `references` array contains all 12 entries (else TS composite project
   resolution fails with TS2307 "Cannot find module"); (c) the test file's
   mock adapter literal at TC3 compiles directly against the
   `KernelAdapter` interface annotation — no `as` cast.

2. `pnpm --filter=@skb/editor-shell test` exits 0 with the exact counts
   `4 files passed (4)` and `9 passed (9)` — TC4 evidence. The 9 = 1 A1
   smoke + 2 A2 EditorShell + 3 A3 registerBlocks + 3 A4 registerKernels.
   See `## test_cases` TC4 for the locked count rationale.

3. `packages/editor-shell/CONTRACT.md` `## Public surface` heading body lists
   `registerKernels` with the exact signature locked at PLAN (so reviewer +
   ACCEPT can pattern-match):
   ```ts
   /** Wires a KernelAdapter into the supplied KernelRegistry. Default
    *  behavior: registers `new PyodideAdapter()` (cheap — the heavy
    *  Pyodide WASM load is deferred to KernelRegistry.startSession).
    *  Override: passing `adapter` registers that adapter instead;
    *  PyodideAdapter is NOT instantiated. Throws via KernelRegistry.register
    *  on duplicate id. */
   export function registerKernels(
     registry: KernelRegistry,
     adapter?: KernelAdapter,
   ): void;
   ```
   The exact override mechanism is **TypeScript default-param syntax in the
   implementation** (`adapter: KernelAdapter = new PyodideAdapter()`); the
   public signature exposes it as `adapter?: KernelAdapter` (canonical
   TS-doc form for an optional param with internal default). Reviewer
   rejects any PR that:
   - drops the `adapter?` override hook (locked plan said "consumers can
     override")
   - changes the override mechanism to a second helper
     (`registerKernelsWith(registry, adapter)`) instead of a default-param
     overload — overload form is rejected for clutter; the default-param
     form is locked
   - changes the return type from `void` to e.g. `KernelRegistry` for
     chaining — A4 returns `void` matching A3's `registerBlocks` shape.

4. `pnpm check` exits 0 across all 22 packages — TC6 evidence. No sibling
   regression from the 3 new workspace-graph edges (editor-shell now
   transitively depends on kernel-adapter + kernel-pyodide + kernel-registry;
   the dep flow is acyclic — none of those 3 producers depend on
   editor-shell, verified at PLAN time).

5. **Three workspace deps NOT two**: A4 declares **3** new `@skb/kernel-*`
   workspace deps in `packages/editor-shell/package.json` —
   `@skb/kernel-adapter`, `@skb/kernel-pyodide`, `@skb/kernel-registry`.
   The third (`@skb/kernel-adapter`) is required because `KernelAdapter`
   is NOT re-exported by either `@skb/kernel-registry` or
   `@skb/kernel-pyodide` (verified at PLAN: their `src/index.ts` files do
   not re-export `KernelAdapter`); the `import type { KernelAdapter } from
   '@skb/kernel-adapter'` source import in `registerKernels.ts` is the
   anchor for the declared dep per ADR-0008 D1. The dispatch's initial
   "2 deps" framing was an undercount; this PR's 3-dep delivery is the
   minimum that satisfies the locked override-hook signature without
   further changes to producer packages (re-exporting `KernelAdapter` from
   `@skb/kernel-pyodide` would be a Wave 2 producer-side change and out of
   scope at A4).

6. `pnpm-lock.yaml` is regenerated and staged in the same commit as
   `packages/editor-shell/package.json` per ADR-0006 D8 sub-form C; second
   `pnpm install` post-commit produces zero diff (idempotency holds — TC9
   evidence). Verify staged-pair via `git diff --cached --stat` at commit
   time. All 3 new deps are workspace-local (`workspace:*`), so the
   lockfile delta is small — only new importer-graph entries under
   `packages/editor-shell:`'s deps section pointing at workspace `link:`
   entries; no new resolution work.

7. The PR.md (`docs/plans/wave-3-main/A4-editor-shell-kernel-registry.md`)
   is present in the staged file list at commit time per ADR-0006 D8 strict
   whitelist (A1-A3 lessons + PR #1 R2 lesson).

8. **Unchanged-files protected** (the `## files` "Explicitly NOT in
   `files:`" subsection): A1-A3 deliverables, all 8 `block-*`,
   `block-foundation`, all 3 `kernel-*`, root `tsconfig.json`,
   `pnpm-workspace.yaml`, `agent-contract.md`, vitest.config.ts —
   all return empty diffs. See `## files` for the exact verify command set.

9. **ADR-0008 D1 dead-dep policy + ADR-0006 D8 decl ↔ ref symmetry**: 12
   declared workspace deps in package.json AND 12 source imports across
   registerBlocks.ts + registerKernels.ts AND 12 references in
   tsconfig.json — three-way exact-12 match. TC8 evidence (the .a + .b + .c
   sub-checks). F3-class violations (declared-but-not-imported) impossible
   by construction — the loop in TC8.b is the verification.

10. **Default-param branching witness via TC1+TC2 vs TC3 contrast**: the
    test triple proves both code paths exercise. TC1+TC2 hit the
    default-param `new PyodideAdapter()` branch (pyodide id observed,
    `instanceof PyodideAdapter` confirmed). TC3 hits the consumer-override
    branch (mock id observed, `r.get('pyodide')` returns undefined
    confirming PyodideAdapter is NOT constructed when an override is
    passed). See `## test_cases` TC1-TC3.

11. **Structure-auditor orphan reduction**: pre-A4, structure-auditor
    reports 4 expected orphans (editor-shell + 3 kernel-*) per A3's bullet
    11 prediction. Post-A4, the 3 new edges from editor-shell consume
    kernel-adapter + kernel-pyodide + kernel-registry — those 3 are no
    longer orphans (they have a workspace consumer in editor-shell).
    editor-shell itself remains orphan until A5's mdx-bridge wiring +
    Stage C apps/site consumption. Net: orphan count drops from 4 to 1
    (editor-shell only) post-A4. Same informational status as A3 bullet 11
    (not a hard test; reviewer + ACCEPT note the expected number for
    cross-validation when the audit fires later).

## executor

Transitional dual-path policy continued from A1-A3. The user has not yet
merged `tmp/codex-profiles.toml` → `~/.codex/config.toml` (Pre-A1 documents
the merge but does not enforce). Orchestrator decides at lock time which
path is live by checking `grep -c '^\[profiles\.generic-executor\]'
~/.codex/config.toml`. Same dual-path framing as A3.

- **PLAN**: `pr-writer` Claude subagent (this dispatch).
- **EXECUTE**:
  - **Path A (preferred — TOML merged)**: `codex-generic-executor` (gpt-5.5,
    workspace-write sandbox per ADR-0011 D6). One-shot dispatch creates the
    1 NEW source file + 1 NEW test file, modifies the 4 non-self in-package
    files (package.json, tsconfig.json, CONTRACT.md, src/index.ts);
    orchestrator runs `pnpm install` after to regenerate `pnpm-lock.yaml`.
    Audit log:
    `.codex-runs/wave-3-main/A4-execute-codex-generic-executor.txt`. The
    locked plan A4 entry's `**executor:** \`codex-generic-executor\`` cue
    confirms this path is the canonical choice; no test-scaffolder split
    needed because the 3 test cases share a single fixture (a fresh
    `KernelRegistry` per `it`) and total ~30-40 LOC.
  - **Path B (transitional — TOML not merged)**: `orchestrator-self`. The 6
    files total ~80-100 LOC of well-patterned code (registerKernels.ts is a
    one-line body wrapping `registry.register(adapter)`; test file mirrors
    A3's registerBlocks.test.ts structure with KernelRegistry replacing
    BlockRegistry; package.json + tsconfig.json mirror A3's 3-of-9
    pattern at smaller scale; CONTRACT.md edits mirror A3's two-section
    pattern). Within orchestrator-direct edit scope. Path B is a fallback
    only if Path A is not yet activated. Audit log:
    `.codex-runs/wave-3-main/A4-execute-orchestrator.txt` (Claude
    self-narrated; no codex stdout to capture).
- **REVIEW**:
  - **Path A**: `codex-pr-reviewer-55` (5.5; ADR-0006 8-point checklist
    mandatory; ADR-0006 D8 explicit-file-list staging rules apply at
    stage 5). Audit log:
    `.codex-runs/wave-3-main/A4-codex-pr-reviewer-55.txt`. Reviewer must
    specifically verify: (a) the registerKernels signature matches
    acceptance bullet 3 verbatim (return type `void`, optional second
    `adapter?: KernelAdapter` param, default-param implementation
    `new PyodideAdapter()`); (b) all 3 `@skb/kernel-*` deps at
    `workspace:*` (not `^0.0.0` or other resolution); (c) tsconfig
    `references` length is exactly 12, alphabetical, matching package.json
    deps; (d) NO `as unknown as` cast anywhere in registerKernels.ts (the
    direct `implements`-driven structural assignability is the locked
    pattern; cast presence indicates a divergent type drift to investigate);
    (e) the 9-test count in vitest output (1 A1 + 2 A2 + 3 A3 + 3 A4); if
    the test glob regression sneaks in, TC1-TC3 silently skip and the run
    falsely reports 6 passed — reviewer + ACCEPT both verify the count,
    not just exit-0.
  - **Path B**: transitional `pr-gate` profile (read-only) for line-level
    review; orchestrator-self handles the 8-point checklist + spec-match
    cross-check. Audit log:
    `.codex-runs/wave-3-main/A4-pr-gate.txt`.
- **PRE-COMMIT CLAUDE REVIEW** (D1 stage 4 — fires per `## D2 trigger
  judgment` Row 1 hit): `orchestrator-self`. Mitigates same-model
  echo-chamber risk on the CONTRACT.md public-surface change (1 new export
  bullet + outline rewrite + dep-count-paragraph update). Specifically
  inspects: (1) the `registerKernels(registry, adapter?)` signature is
  identical to acceptance bullet 3; (2) `registerKernels` exported from
  the editor-shell barrel (verifies `src/index.ts` `+1` line); (3) the
  default-param + override branching matches `## acceptance` bullet 10
  (TC1+TC2 vs TC3 contrast); (4) the `## Wave 3 Stage A expansion outline`
  A4 line is rewritten to past-tense and notes the 3-dep delivery (with
  `@skb/kernel-adapter` callout per `## acceptance` bullet 5).
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
      packages/editor-shell/src/registerKernels.ts \
      packages/editor-shell/src/__tests__/registerKernels.test.ts \
      pnpm-lock.yaml \
      docs/plans/wave-3-main/A4-editor-shell-kernel-registry.md
    git diff --cached --stat   # verify exactly 8 files
    git commit
    ```
  - **Path B**: orchestrator-self runs the same 4-step explicit stage.
    Either path commits exactly 8 files; any deviation (notably accidental
    `tsconfig.json` (root) or `agent-contract.md` inclusion via
    `git add -A` or accidental block-* / kernel-* / A1-A3-deliverable
    modification escaping into the stage list) is rejected at stage 5.
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per ADR-0011
  D1 stage 6). Reads PR.md `acceptance:` block + `git diff main..HEAD` and
  verifies each of the 11 acceptance bullets is met; emits ACCEPT or
  REJECT-with-residue.

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT.md change): **HIT**.
  `packages/editor-shell/CONTRACT.md` `## Public surface` body changes from
  the A3-locked 4-bullet surface (EditorShell + EditorShellProps +
  registerBlocks + proseExtensions) to a 5-bullet surface (adds
  registerKernels). Substantive contract surface expansion.
- **Row 2** (package add/remove): **NO**. No new workspace package; A4
  adds workspace **deps** to an existing package.
- **Row 4** (new ADR required): **NO**. Locked plan line 271 confirms
  `**adr_touched:** None`. A4 implements a previously-sealed plan entry +
  A3's predicted CONTRACT.md outline (with the 3-dep narrowing detailed
  in `## acceptance` bullet 5 — a count correction, not an architecture
  decision). The default-param override pattern is canonical TS surface,
  not an ADR-level decision.
- **Row 5** (cross ≥ 3 packages): **NO**. The diff touches one source
  package (`packages/editor-shell`) plus `pnpm-lock.yaml` plus this PR.md.
  The workspace-graph mutation is **3 new dep edges** (editor-shell to
  kernel-adapter + kernel-pyodide + kernel-registry) — smaller than A3's
  9-edge mutation. Per the dispatch context's explicit Row 5 judgment
  ("only editor-shell + 2 kernel-* + lockfile = 4 packages, NOT ≥3
  cross-touch in the row 5 sense"), Row 5 is NO at A4. The interpretation:
  Row 5 fires on **multi-package source-file modification**, not on
  workspace-graph mutation alone; A3's Row 5 hit was elevated by its
  larger 9-edge graph mutation that transitively involved 10 packages.
  A4's smaller 3-edge graph mutation does not meet the Row 5 elevation
  threshold.
- **Row 8** (CI / build / deploy / auth / security): **NO**. No
  `.github/workflows/*.yml`, no deploy/auth/security config touched.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 1 hit; orchestrator-self,
mitigates codex same-model echo-chamber risk on the CONTRACT.md
public-surface change). Row 5 NO so no elevated-scrutiny sub-rule applies
within stage 3 (vs A3's Row 5 hit).

## Out-of-scope (explicitly deferred)

- **mdx-bridge workspace dep** — A5 adds via `saveLoad.ts` round-trip glue.
- **Real Pyodide kernel boot test** — A4 verifies registration via
  `instanceof PyodideAdapter` (TC2) without calling `startSession`. A real
  Pyodide WASM load is too heavy for unit test (multi-second WASM init);
  Wave 3 separate integration smoke covers it (see locked plan TC2 line
  267 reference). The block-jupyter package's existing
  `__tests__/kernel-bridge.test.ts` exercises the consumer pattern via
  a mocked hostFactory at the producer side; A4's editor-shell consumer
  inherits that coverage transitively.
- **Multiple-adapter registration in a single registerKernels call** — A4
  ships single-adapter registration only (default OR override-of-one).
  Multi-adapter scenarios (e.g. PyodideAdapter + Wasm-Lite + Remote-Jupyter)
  are deferred — consumer would call `registerKernels(r); r.register(otherAdapter)`
  manually, or a future `registerKernels` overload accepts an array.
  Locked plan A4 entry implies single-adapter at this milestone.
- **`registerKernels` returning `KernelRegistry` for chaining** — A4
  returns `void` matching A3's `registerBlocks` shape and locked plan
  "takes registry as argument so consumers can use a custom registry"
  (implicit void return). Chaining is wrap-callable:
  `const r = new KernelRegistry(); registerKernels(r); return r;`.
- **Re-exporting `KernelAdapter` / `KernelRegistry` / `PyodideAdapter` types
  from editor-shell barrel** — A4 ships the helper only; consumers needing
  the types still import from `@skb/kernel-adapter` etc. directly. A future
  ergonomics-pass PR may add a barrel re-export here, but A4 stays minimal.
- **`adapter` parameter accepting a factory** — A4 takes a constructed
  `KernelAdapter`, not a `() => KernelAdapter`. The factory variant would
  enable lazy instantiation (avoiding `new PyodideAdapter()` evaluation
  when an override path is taken; the default-param form evaluates eagerly
  even when overridden — though TC3's mock-override test confirms the
  override branch's actual registration). However, the locked plan
  signature is `registerKernels(registry, adapter)` not
  `registerKernels(registry, adapterFactory)`, and `new PyodideAdapter()`
  is documented cheap (constructor-only factory-closure storage; no WASM
  load), so no measurable cost. Factory variant deferred to future
  ergonomics-pass if measured cost surfaces.
- **A `registerKernel` (singular) helper as a per-adapter convenience**
  — `KernelRegistry.register(adapter)` already covers the singular case
  directly; `registerKernels` is the editor-shell convenience layer
  bundling the default. Singular helper would duplicate `registry.register`.
- **Naming variance vs A3's `registerBlocks`** — A3's helper is plural
  (`registerBlocks`, registers 8 cores + 8 ui-defaults = 16 things).
  A4's is also plural (`registerKernels`) for symmetry, even though it
  registers exactly 1 adapter by default. The plural form leaves room
  for future multi-adapter-by-default expansion without rename. Locked
  plan A4 entry uses `registerKernels` verbatim.

## Risk grid (Wave 3 main pipeline standing)

A4 specifics:

- **Lockfile delta** — small (all 3 deps are workspace-local `link:`
  entries). If reviewer sees a 1000+ line lockfile diff, that's a flag —
  investigate before commit (likely external resolution drift unrelated
  to A4, NOT a workspace dep addition).
- **Test silently passing** — A2 already locked the
  `vitest.config.ts` `.tsx` glob; A4's test file is `.ts` (no React render
  needed). The glob covers `.test.{ts,tsx}` so both work. TC4 acceptance
  check (`9 passed (9)`) catches a silent skip; reviewer + ACCEPT verify
  the count, not just exit-0.
- **Cast appearance regression** — unlike A3 where 5 of 8 ui-defaults
  required `as unknown as BlockUIDefinition`, A4 expects ZERO casts in
  `registerKernels.ts`. `PyodideAdapter` directly `implements
  KernelAdapter` (`packages/kernel-pyodide/src/adapter.ts:22`), so the
  default-param assignment is structurally direct. If executor inserts a
  cast, that's a flag — investigate (likely a divergent type or stale
  reference). Acceptance bullet 1 sub-clause (a) + reviewer specific-
  verify (d) both pin this down.
- **Same-model echo chamber** — mitigated by D1 stage 4 PRE-COMMIT CLAUDE
  REVIEW (Row 1 hit). orchestrator-self specifically inspects
  registerKernels signature + the 12 dep declarations vs 12 source imports
  vs 12 references three-way symmetry.
- **Cross-package compile-failure** — if any of the 3 producers had a
  typecheck regression at HEAD, A4's `pnpm check` TC6 would surface it
  (the new edges force kernel-adapter + kernel-pyodide + kernel-registry
  to re-typecheck transitively). Pre-PLAN check: `pnpm
  --filter=@skb/kernel-{adapter,registry,pyodide} typecheck` PASS at HEAD
  `bc2616b` (verified before locking this PR.md via direct file inspection
  of the producer source — full repo typecheck assumed clean from A3
  merge).
- **A1-A3 deliverable regression** — A4 explicitly does NOT modify
  EditorShell.tsx, smoke.test.ts, registerBlocks.ts, the A2 + A3 test
  files. The acceptance bullet 8 grep set ensures it. If executor
  accidentally edits any (e.g. to wire kernels into EditorShell — which
  is OUT OF SCOPE per `## Out-of-scope`), reviewer rejects.
- **3-dep undercount risk** — the dispatch's "2 new deps" framing nearly
  led to a missing `@skb/kernel-adapter` declaration which would have
  surfaced as TS2307 "Cannot find module '@skb/kernel-adapter'" at TC5
  + an ADR-0008 D1 violation. The PLAN-time grep over kernel-registry +
  kernel-pyodide src/index.ts caught the absence of `KernelAdapter`
  re-export and locked the 3-dep delivery. Reviewer + ACCEPT specifically
  verify the count via `## acceptance` bullet 5.

## Related

- [ADR-0011 D1+D2+D6](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pipeline + PR.md schema; D6 introduces the codex profiles this PR's
  executor block conditionally selects.
- [ADR-0006 D8](../../decisions/ADR-0006-asymmetry-audit-checklist.md) —
  explicit-file-list staging + sub-form C lockfile rule (`## acceptance`
  bullet 6) + decl ↔ ref symmetry rule (`## acceptance` bullet 9 + TC8.c).
- [ADR-0008 D1](../../decisions/ADR-0008-wave-2-entry-policies.md) —
  dead-dep policy (tighten); A4 ships 3 new workspace deps, all 3
  source-imported in registerKernels.ts (TC8.b verifies — `import` for
  KernelRegistry + PyodideAdapter, `import type` for KernelAdapter — both
  count toward the dep declaration).
- [ADR-0010 D7 #3](../../decisions/ADR-0010-wave-2-close.md) —
  "editor-shell composition" deferral that Stage A closes; A4 is the
  fourth step (after A1 skeleton + A2 Tiptap container + A3 BlockRegistry
  boot) toward closing it.
- [Wave 3 plan, A4 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md)
  — locked plan entry (lines 250-281), Stage A intro.
- [A1 PR.md](./A1-editor-shell-skeleton.md) — predecessor (created the
  empty package).
- [A2 PR.md](./A2-editor-shell-tiptap-container.md) — predecessor (Tiptap
  container).
- [A3 PR.md](./A3-editor-shell-block-registry.md) — immediate predecessor
  (just merged `bc2616b`); created `registerBlocks` whose pattern A4
  mirrors at smaller scale (3 deps vs 9, 1 helper vs 2 helpers, 3 TCs
  vs 3 TCs).
- [Pre-A1 PR.md](./Pre-A1-codex-profile-toml-merge.md) — bootstrap
  predecessor that documented the codex-profile TOML merge that Path A
  EXECUTE depends on.
- [packages/kernel-registry/CONTRACT.md](../../../packages/kernel-registry/CONTRACT.md)
  — public API surface A4 consumes (`KernelRegistry.register`,
  `KernelRegistry.get`, `KernelRegistry.list`).
- [packages/kernel-registry/src/registry.ts](../../../packages/kernel-registry/src/registry.ts)
  — implementation (the 26-line class A4 wraps).
- [packages/kernel-pyodide/CONTRACT.md](../../../packages/kernel-pyodide/CONTRACT.md)
  — public API surface A4 consumes (`PyodideAdapter` constructor +
  optional `PyodideAdapterOptions`).
- [packages/kernel-pyodide/src/adapter.ts](../../../packages/kernel-pyodide/src/adapter.ts)
  — implementation; line 32-34 documents the cheap-constructor invariant
  A4's default-param relies on.
- [packages/kernel-adapter/CONTRACT.md](../../../packages/kernel-adapter/CONTRACT.md)
  — `KernelAdapter` interface authority A4 imports (type-only).
- [packages/block-jupyter/src/__tests__/kernel-bridge.test.ts](../../../packages/block-jupyter/src/__tests__/kernel-bridge.test.ts)
  — existing real-world consumer pattern that uses `PyodideAdapter` via a
  mocked hostFactory; A4's TC3 mock-adapter pattern is the same
  technique at registry-helper scale.
