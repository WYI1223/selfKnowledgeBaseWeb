# A5 — editor-shell save-load round-trip (prose-only skeleton)

> **Wave 3 main pipeline sixth PR (fifth and final of Stage A).** Adds two
> new helpers `saveToMdx(editor, options?)` + `loadFromMdx(editor, source,
> options?)` to `@skb/editor-shell` that delegate to `@skb/mdx-bridge`'s
> existing `tiptapToMdx` / `mdxToTiptap` for prose round-trip, and expose
> a forward-compat `{ blockRegistry?: BlockRegistry }` options bag at the
> public API surface so consumers can already pass the registry today.
> Internally A5 calls `mdxToTiptap(source)` + `tiptapToMdx(doc)` WITHOUT
> threading the registry — mdx-bridge does not yet accept the per-call
> `{ blockRegistry }` option (B1 adds it). The Stage A surface closes here:
> editor-shell now exports the four-helper API surface (`registerBlocks`,
> `registerKernels`, `saveToMdx`, `loadFromMdx`) plus the `EditorShell`
> component + `proseExtensions` re-export. Closes the 13 expected
> orphan-package count (locked plan line 19) by becoming the terminal
> consumer of mdx-bridge.
>
> See `## test_cases` TC3 + `## acceptance` bullet 6 for the locked-TC3-vs-
> mdx-bridge-API ambiguity resolution: TC3 is **reframed** as a
> signature-acceptance + parameter-tolerance test (not a fail-loud thread-
> through assertion). The actual thread-through assertion is owned by B1
> after mdx-bridge gains the option.

## title

Add `saveToMdx(editor: Editor, options?: { blockRegistry?: BlockRegistry }):
string` and `loadFromMdx(editor: Editor, source: string, options?: {
blockRegistry?: BlockRegistry }): void` helpers to `@skb/editor-shell` that
wrap `@skb/mdx-bridge`'s `tiptapToMdx` / `mdxToTiptap` for prose-only
round-trip; expose a forward-compat `{ blockRegistry?: BlockRegistry }`
options parameter at the public API surface (accepted-but-ignored at the
saveLoad layer until B1 extends mdx-bridge with per-call injection); add
`@skb/mdx-bridge` workspace dep; rewrite CONTRACT.md `## Wave 3 Stage A
expansion outline` A5 line from prediction-tense to past-tense and append
a `## Stage A close note` section ratifying the four-helper public API
surface for downstream Stage B / C consumers.

## files

Created (NEW — 1 source file + 1 test file):

- `packages/editor-shell/src/saveLoad.ts` *(the helper functions. Imports
  `mdxToTiptap` + `tiptapToMdx` from `@skb/mdx-bridge`, `type TiptapDoc`
  from `@skb/mdx-bridge` (for the internal `editor.getJSON()` →
  `TiptapDoc` cast that mediates between Tiptap's `JSONContent` runtime
  shape and mdx-bridge's `TiptapDoc` structural type), `type Editor`
  from `@tiptap/core` (type-only — keeps runtime import graph tight; A2
  already declared `@tiptap/core` as a peer dep so the type resolves via
  the existing peer dep), and `type BlockRegistry` from
  `@skb/block-foundation` (type-only — the `options.blockRegistry`
  parameter type; consumers pass the same registry instance they used at
  `registerBlocks(registry)` so saveLoad threads it through to mdx-bridge
  once B1 lands).
  Function bodies (literally ~25-30 LOC including imports + JSDoc):
  ```ts
  import type { Editor } from '@tiptap/core';
  import type { BlockRegistry } from '@skb/block-foundation';
  import { mdxToTiptap, tiptapToMdx, type TiptapDoc } from '@skb/mdx-bridge';

  export interface SaveLoadOptions {
    /** Forward-compat per-call BlockRegistry injection. Wave 3 Stage A:
     *  accepted-but-unused at this layer (mdx-bridge does not yet accept
     *  a `{ blockRegistry }` option; B1 adds it). Wave 3 Stage B (B1+):
     *  threaded through to mdxToTiptap / tiptapToMdx so component blocks
     *  can parse + serialize via their registered cores. Until B1, the
     *  parameter is documented forward-compat scaffolding; passing it
     *  has no runtime effect because the prose-only walker has no
     *  components to dispatch on. */
     blockRegistry?: BlockRegistry;
  }

  /** Serialize the editor's current document to MDX source. Prose-only
   *  in Stage A; component blocks throw via mdx-bridge's existing
   *  fail-loud rule until B1 extends the walker. */
  export function saveToMdx(
    editor: Editor,
    _options?: SaveLoadOptions,
  ): string {
    const doc = editor.getJSON() as TiptapDoc;
    return tiptapToMdx(doc);
  }

  /** Replace the editor's document by parsing MDX source. Prose-only in
   *  Stage A; component-block JSX throws via mdx-bridge's existing
   *  fail-loud rule until B1. */
  export function loadFromMdx(
    editor: Editor,
    source: string,
    _options?: SaveLoadOptions,
  ): void {
    const doc = mdxToTiptap(source);
    editor.commands.setContent(doc);
  }
  ```
  The `_options` underscore prefix signals to ESLint `no-unused-vars` (and
  human reviewers) that the parameter is intentionally accepted-but-unused
  at this layer — see `## acceptance` bullet 6 + `## test_cases` TC3 for
  the rationale (forward-compat for B1's mdx-bridge extension). Once B1
  lands the per-call injection on mdx-bridge, A5's saveLoad updates with
  a single-line change per call site (`mdxToTiptap(source, options)` /
  `tiptapToMdx(doc, options)`) and the underscore prefix is dropped — see
  `## Out-of-scope` "threading registry through to mdx-bridge calls".
  The `editor.getJSON()` → `TiptapDoc` cast: Tiptap's `Editor.getJSON()`
  returns its internal `JSONContent` type which is structurally compatible
  with mdx-bridge's `TiptapDoc` (both have `{ type, content[], ... }`
  shape rooted at `type === 'doc'`); the cast is the documented bridging
  point and matches mdx-bridge's CONTRACT.md "Round-trip invariant"
  definition of `TiptapDoc` as the canonical doc-root type. NO `as
  unknown as` cast is needed (single-cast is structurally sound). Total
  helper file ~30 LOC.)*
- `packages/editor-shell/src/__tests__/saveLoad.test.ts` *(TC1-TC4 — see
  `## test_cases`. Vitest happy-dom env (already set by A2's
  vitest.config.ts; no DOM is actually exercised — Tiptap Editor mounts
  without a host element in test mode). Uses `new Editor({ extensions:
  [StarterKit] })` directly — fresh editor per `it(...)` for case
  independence, same isolation pattern A3 + A4 used for BlockRegistry /
  KernelRegistry. NO `setTimeout`, NO `await Promise.resolve` — saveToMdx
  / loadFromMdx are synchronous (mdx-bridge parse + serialize are
  synchronous; `editor.commands.setContent` is synchronous). Estimated
  ~75-90 LOC including imports + 3 fixtures inline + 4 `it(...)` blocks.)*

Modified (5 files):

- `packages/editor-shell/src/index.ts` — adds 1 new export line + 1
  new type re-export line next to the existing A2 + A3 + A4 lines (without
  removing them):
  - `export { saveToMdx, loadFromMdx } from './saveLoad';`
  - `export type { SaveLoadOptions } from './saveLoad';`
  Net delta: +2 lines. Existing A2 (`EditorShell`, `EditorShellProps`),
  A3 (`registerBlocks`, `proseExtensions` re-export), A4 (`registerKernels`)
  lines unchanged. The barrel now exposes the **four-helper public API
  surface** (registerBlocks + registerKernels + saveToMdx + loadFromMdx)
  + the `EditorShell` component + `proseExtensions` re-export. See `##
  Stage A close note` in CONTRACT.md for the ratification.
- `packages/editor-shell/CONTRACT.md` — three coordinated edits:
  1. Add bullets for `saveToMdx` + `loadFromMdx` + `SaveLoadOptions` under
     `## Public surface`, with the exact signatures and a one-paragraph
     description of the prose-only-in-Stage-A behavior + the forward-compat
     options scaffolding for B1 (per `## acceptance` bullet 6).
  2. Rewrite the `**A5** —` line in `## Wave 3 Stage A expansion outline`
     from prediction-tense to past-tense ("Delivered in this PR; Stage A
     complete"). The pre-existing prediction-tense text reads:
     `'A5' — saveToMdx(editor) + loadFromMdx(editor, mdxString). Threads
     blockRegistry through mdx-bridge's per-call injection (no global
     setter). Adds @skb/mdx-bridge workspace dep. Closes 13 expected
     orphan packages simultaneously by becoming the terminal consumer.`
     The actual A5 surface narrows the "threads blockRegistry through
     mdx-bridge's per-call injection" claim to **forward-compat
     scaffolding** (the `{ blockRegistry?: BlockRegistry }` options
     parameter is exposed at saveLoad's public API, but threading it
     through to mdx-bridge is deferred to B1 — see `## test_cases` TC3
     + `## acceptance` bullet 6 + `## Out-of-scope` for the rationale).
     A5 still closes the 13-orphan count (the `@skb/mdx-bridge` workspace
     dep edge IS added; the producer-side threading is what defers).
  3. Append a new `## Stage A close note` section after the existing
     `## Wave 3 Stage A expansion outline` section:
     > "Stage A complete. The four-helper public API surface
     > (`registerBlocks`, `registerKernels`, `saveToMdx`, `loadFromMdx`)
     > + `EditorShell` component + `proseExtensions` re-export form the
     > stable consumer-facing API for Stage B / C. Component-block RTT
     > is delegated to mdx-bridge (Stage B B1+ adds the per-call
     > `{ blockRegistry }` injection that saveLoad already accepts at
     > its public API surface); apps/site integration is delegated to
     > Stage C. The `## Wave 3 Stage A expansion outline` section above
     > is informational and may be retired at Wave 3 close in favor of
     > a stable public-surface declaration (orchestrator decision)."
  4. Update the existing bottom paragraph (`[ADR-0008 D1] dead-dep
     policy is satisfied at A4 by construction…`) to reflect the post-A5
     dep totals: 13 declared deps + 13 source imports + 13 tsconfig
     references (12 from A4 + 1 new `@skb/mdx-bridge` in A5); mentions
     that saveLoad.ts adds the lone new `from '@skb/mdx-bridge'` source
     import. The exact wording extends the existing claim, not replaces
     it.
- `packages/editor-shell/package.json` — adds 1 `@skb/mdx-bridge` workspace
  dep under `dependencies`. Inserted alphabetically between `@skb/kernel-
  registry` (last `@skb/kernel-*` from A4) and `@tiptap/starter-kit`. Final
  dependencies block has 14 entries total: 9 `@skb/block-*` (from A3) +
  3 `@skb/kernel-*` (from A4) + 1 `@skb/mdx-bridge` (new) + `@tiptap/
  starter-kit` (from A2). Of those 14, 13 are `@skb/*` workspace deps —
  the count that drives the three-way symmetry (TC8). Uses `workspace:*`
  matching the established pattern. No peerDependency or devDependency
  additions.
- `packages/editor-shell/tsconfig.json` — adds 1 `references` entry
  (`{ "path": "../mdx-bridge" }`), alphabetical insertion between
  `kernel-registry` and `(end)`. Final references array length: 13 (12
  from A4 + 1 new). Insertion point:
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
    { "path": "../kernel-registry" },
    { "path": "../mdx-bridge" }
  ]
  ```
  ADR-0006 D8 "decl ↔ ref" symmetry: the new `@skb/mdx-bridge` dep MUST
  have a matching `references` entry (TS composite-project graph
  correctness; otherwise cross-package typecheck breaks with TS2307).
  Verified at TC8.c below.
- `pnpm-lock.yaml` — regenerated by `pnpm install` after `package.json`
  edits. ADR-0006 D8 sub-form C: lockfile is generated-from-authority,
  MUST stage in the same commit as authority. Delta size expectation:
  small (the `@skb/mdx-bridge` package is already in the workspace graph;
  pnpm just adds 1 new importer-graph entry under `packages/editor-shell:`'s
  deps section pointing at a workspace `link:` entry — no new resolution
  work since mdx-bridge is local).

Self-listed:

- `docs/plans/wave-3-main/A5-editor-shell-save-load.md` *(this PR.md
  itself — explicit-listed per ADR-0006 D8 strict whitelist; A1-A4
  lessons: PR.md MUST self-list in `files:` whitelist)*

**File count: 8 total** (2 NEW + 5 Modified + 1 self-listed). Same count
as A4. ADR-0008 D1 three-way symmetry at scale 13: 13 declared `@skb/*`
deps = 13 source imports = 13 tsconfig references. See `## acceptance`
bullet 9 + TC8.

**Explicitly NOT in `files:`** (verification-only, no edit):

- `tsconfig.json` (root) — A1 already added the `editor-shell` reference;
  A5 does NOT add NEW packages so the root references list stays
  unchanged. `mdx-bridge` was added at root tsconfig in its Wave 1 origin
  PR. Verify: `git diff main -- tsconfig.json` returns empty.
- `pnpm-workspace.yaml` — unchanged (existing `packages/*` glob; A5 makes
  no new package).
- `agent-contract.md` — A5 is additive consumer wiring within an
  established package; no contract surface in the single-source contract
  changes. Verify: `git diff main -- agent-contract.md` returns empty.
- `packages/editor-shell/vitest.config.ts` — A2 already set `include:
  ['src/**/*.test.{ts,tsx}']` + `environment: 'happy-dom'`; A5 inherits
  both. Verify: empty diff.
- A1-A4 deliverables — A5 modifies NEITHER `EditorShell.tsx`,
  `__tests__/EditorShell.test.tsx`, `__tests__/smoke.test.ts`,
  `registerBlocks.ts`, `__tests__/registerBlocks.test.ts`,
  `registerKernels.ts`, NOR `__tests__/registerKernels.test.ts`. Verify
  all seven paths return empty diffs:
  ```bash
  git diff main -- \
    packages/editor-shell/src/EditorShell.tsx \
    packages/editor-shell/src/__tests__/EditorShell.test.tsx \
    packages/editor-shell/src/__tests__/smoke.test.ts \
    packages/editor-shell/src/registerBlocks.ts \
    packages/editor-shell/src/__tests__/registerBlocks.test.ts \
    packages/editor-shell/src/registerKernels.ts \
    packages/editor-shell/src/__tests__/registerKernels.test.ts
  ```
- All 8 `packages/block-*` packages + `packages/block-foundation` — A5
  does not touch them. Verify: `git diff main -- 'packages/block-*'
  packages/block-foundation` empty.
- All 3 `packages/kernel-*` packages — A5 is a pure consumer; zero
  modifications. Verify: `git diff main -- 'packages/kernel-*'` empty.
- `packages/mdx-bridge/**` — A5 is a pure consumer of mdx-bridge's
  existing Wave 1 prose-only API (`mdxToTiptap` + `tiptapToMdx`); A5 does
  NOT extend mdx-bridge's API surface. Adding the `{ blockRegistry }`
  per-call injection to mdx-bridge is deferred to **B1** per locked plan
  lines 334-358 (B1's responsibility, not A5's). Verify: `git diff main
  -- 'packages/mdx-bridge/'` returns empty (modulo `pnpm-lock.yaml` which
  sits outside packages/).
- Wave 3 plan file
  `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md` —
  locked at PLAN seal time; per-PR status updates deferred to a Stage A
  closeout PR after A5 (orchestrator may run a separate doc-only PR
  rewriting Stage A entries to past-tense, or fold into B1 — out of
  scope for A5).

## test_cases

- **TC1** (prose RTT — 3 fixtures: heading + list + paragraph; per locked
  plan TC1) Input:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { saveToMdx, loadFromMdx } from '../saveLoad';

  const FIXTURES: Array<readonly [string, string]> = [
    [
      'paragraph',
      '---\ntitle: Paragraph fixture\n---\n\nHello world.\n',
    ],
    [
      'heading',
      '---\ntitle: Heading fixture\n---\n\n# Heading one\n\n## Heading two\n\nbody text.\n',
    ],
    [
      'list',
      '---\ntitle: List fixture\n---\n\n* item one\n* item two\n* item three\n',
    ],
  ];

  describe.each(FIXTURES)('prose round-trip — %s', (_name, fixture) => {
    it('loadFromMdx then saveToMdx returns the original fixture', () => {
      const editor = new Editor({ extensions: [StarterKit] });
      loadFromMdx(editor, fixture);
      const restored = saveToMdx(editor);
      expect(restored.trim()).toBe(fixture.trim());
      editor.destroy();
    });
  });
  ```
  Expected: 3 tests PASS (one per fixture; `describe.each` expands to 3
  `it` bodies). Asserts: for each prose fixture, `loadFromMdx` followed
  by `saveToMdx` reconstructs the source byte-equivalently (after `.trim()`
  to match the established mdx-bridge round-trip assertion pattern at
  `packages/mdx-bridge/src/__tests__/round-trip.test.ts:34`). The fixtures
  include frontmatter to mirror Wave 2 mdx-bridge fixture canonical form
  (e.g. `packages/mdx-bridge/src/__tests__/fixtures/01-paragraph.mdx`)
  — frontmatter passes through unchanged because mdx-bridge's
  parse/serialize already handle it. The fixture body shapes (paragraph,
  H1+H2, single-level unordered list) cover the three Tiptap StarterKit
  block kinds prose-only saveLoad can RTT today; nested lists / ordered
  lists / block quotes / code blocks are valid prose targets but locked
  plan TC1 says **3 fixtures** so we hold the line at the simplest covers
  per kind. Trim-equivalence is the established mdx-bridge invariant
  pattern and avoids spurious failures from trailing newline normalization.
  Each `it` constructs a fresh `Editor` via `new Editor({ extensions:
  [StarterKit] })` (no React mount needed; happy-dom satisfies Tiptap's
  document.createElement requirement at construction time) and calls
  `editor.destroy()` at the end to free internal handles. Location:
  `packages/editor-shell/src/__tests__/saveLoad.test.ts:N` (executor
  places at first `describe.each(...)` block).

- **TC2** (empty-editor save — locked plan TC2) Input:
  ```ts
  it('saveToMdx on empty editor returns frontmatter-less empty doc', () => {
    const editor = new Editor({ extensions: [StarterKit] });
    const out = saveToMdx(editor);
    expect(out.trim()).toBe('');
    editor.destroy();
  });
  ```
  Expected: 1 test PASS. Asserts: an editor freshly mounted with no
  `initialContent` produces an empty document whose serialization trims
  to the empty string. Tiptap's default empty doc is `{ type: 'doc',
  content: [{ type: 'paragraph' }] }` (a single empty paragraph);
  mdx-bridge's `tiptapToMdx` serializes that to either `''` or a
  paragraph-with-no-text producing whitespace-only output — both
  collapse to `''` after `.trim()`. The "frontmatter-less" framing in
  the locked plan TC2 wording is observed implicitly: an empty doc has
  no frontmatter to emit, and mdx-bridge does not synthesize one. NOTE:
  if this assertion fails (empty editor produces non-empty output), the
  failure mode is informative — investigate whether StarterKit's empty
  paragraph is being serialized to a stray newline (acceptable; trim
  catches it) or to non-trivial markdown text (would be a regression in
  mdx-bridge — out of A5 scope to fix; orchestrator would file a
  follow-up). Location: same file as TC1, fourth `it(...)` (after the 3
  TC1 `describe.each` bodies).

- **TC3** (registry-thread guard — REFRAMED per dispatch ambiguity
  resolution; signature acceptance + parameter tolerance) Input:
  ```ts
  import type { BlockRegistry } from '@skb/block-foundation';

  it('saveToMdx + loadFromMdx accept an optional `{ blockRegistry }` '
     + 'options arg without runtime effect at the saveLoad layer (Stage '
     + 'A forward-compat scaffolding; B1 will thread it through to '
     + 'mdx-bridge)', () => {
    const editor = new Editor({ extensions: [StarterKit] });
    // Construct a real BlockRegistry instance — no need to register any
    // blocks; saveLoad does not consult it (forward-compat scaffolding).
    const blockRegistry = new (
      // dynamic import keeps the test deterministic against future
      // BlockRegistry constructor changes — we only need a default-
      // constructed instance to thread.
      ((): typeof import('@skb/block-foundation').BlockRegistry => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('@skb/block-foundation').BlockRegistry;
      })()
    )();
    const fixture = '---\ntitle: TC3\n---\n\nprose only.\n';

    // (a) loadFromMdx accepts the options arg without TS errors and
    //     produces the same result as omitting it (since mdx-bridge has
    //     no components to dispatch on for prose-only content).
    loadFromMdx(editor, fixture, { blockRegistry });
    const out1 = saveToMdx(editor, { blockRegistry });
    expect(out1.trim()).toBe(fixture.trim());

    // (b) Omitting the options arg yields identical output (parameter
    //     tolerance — no required-arg surprise).
    const editor2 = new Editor({ extensions: [StarterKit] });
    loadFromMdx(editor2, fixture);
    const out2 = saveToMdx(editor2);
    expect(out2.trim()).toBe(fixture.trim());
    expect(out2).toBe(out1);  // bit-equality post-trim-equality is OK
                              // for prose-only since whitespace is fixed
                              // by mdx-bridge's deterministic emit path.

    editor.destroy();
    editor2.destroy();
  });
  ```
  Expected: 1 test PASS. **Reframed TC3 (per dispatch context's "TC3
  resolution" guidance):** the locked-plan TC3 text reads "saveToMdx +
  loadFromMdx MUST thread the editor's blockRegistry through to
  mdxToTiptap / tiptapToMdx's per-call `{ blockRegistry }` option". But
  mdx-bridge does not yet accept that option (verified at PLAN time:
  `grep 'export function mdxToTiptap\|export function tiptapToMdx'
  packages/mdx-bridge/src/parse.ts packages/mdx-bridge/src/serialize.ts`
  shows `mdxToTiptap(source: string): TiptapDoc` and `tiptapToMdx(doc:
  TiptapDoc): string` — no options arg). Locked plan B1 (lines 334-358)
  is the PR that adds `{ blockRegistry }` to mdx-bridge's per-call
  signature. **Resolution: A5 splits TC3's intent into (i) a public-API
  surface acceptance test (TC3 here — verifies saveLoad's signature
  accepts the option, and prose-RTT works regardless of whether the
  option is passed) and (ii) a B1-owned thread-through assertion (B1's
  locked TC1+TC3+TC6 already cover the producer-side per-call injection
  + state-isolation; A5's threading happens implicitly via the single-line
  `mdxToTiptap(source, options)` change at B1 commit time).** This split
  preserves the locked-plan invariant (the `{ blockRegistry }` parameter
  flows through the editor-shell saveLoad layer) while honoring mdx-
  bridge's current API surface. The reframe is documented in `##
  acceptance` bullet 6 + `## Out-of-scope` "threading registry through
  to mdx-bridge calls" so reviewer + ACCEPT have a single source of
  truth for the resolution. (Sub-asserts: (a) saveLoad accepts the option
  arg without TS errors — compile-time verified at TC5 typecheck; (b)
  prose RTT works regardless of whether the option is passed — runtime
  verified at this TC3; (c) B1 follow-up will thread the option through
  to mdx-bridge and add the producer-side injection assertion at B1's
  test surface.) Location: same file as TC1, fifth `it(...)` (after
  TC1's 3 + TC2's 1).

- **TC4** (per-package vitest count) Input:
  `pnpm --filter=@skb/editor-shell test`. Expected: exit 0; vitest reports
  `5 files passed (5)` (`smoke.test.ts` from A1 + `EditorShell.test.tsx`
  from A2 + `registerBlocks.test.ts` from A3 + `registerKernels.test.ts`
  from A4 + `saveLoad.test.ts` new) and `14 passed (14)` total tests
  (1 A1 smoke + 2 A2 EditorShell + 3 A3 registerBlocks + 3 A4
  registerKernels + 5 A5 saveLoad = 14; A5's 5 = TC1's 3 fixtures via
  `describe.each` + TC2's 1 + TC3's 1). Locked at PLAN time so reviewer
  + ACCEPT can pattern-match against the actual vitest output. Location:
  shell at repo root.

- **TC5** (per-package typecheck) Input:
  `pnpm --filter=@skb/editor-shell typecheck`. Expected: exit 0. Validates
  `saveLoad.ts` + `saveLoad.test.ts` compile under `strict: true` +
  `exactOptionalPropertyTypes: true` from `tsconfig.base.json` with the
  new `@skb/mdx-bridge` workspace dep's types resolving via composite
  project references. Specifically catches: (a) the missing
  `references` entry in tsconfig.json would surface as TS2307 "Cannot
  find module '@skb/mdx-bridge'"; (b) the `editor.getJSON() as TiptapDoc`
  cast is structurally sound — TS2352 if Tiptap's `JSONContent` and
  mdx-bridge's `TiptapDoc` had no overlap (they do — both are root-typed
  `{ type: 'doc', content: ... }` documents); (c) the `SaveLoadOptions`
  interface compiles with `blockRegistry?: BlockRegistry` under
  `exactOptionalPropertyTypes: true` (the `?` syntax permits undefined-
  but-not-explicit-undefined per A2's standing pattern; consumers may
  pass `{}` or omit the arg entirely; passing `{ blockRegistry: undefined
  }` would be rejected — acceptable, documented behavior); (d) TC3's
  `BlockRegistry` import + `new BlockRegistry()` construction compiles
  (verifies the type-only `import type { BlockRegistry }` in saveLoad.ts
  vs the runtime `import { BlockRegistry }` in saveLoad.test.ts both
  resolve through the composite reference). NO `as unknown as` cast is
  expected anywhere in saveLoad.ts or its test — single-step `as
  TiptapDoc` is structurally direct. If a double-cast appears, reviewer
  rejects. Location: shell at repo root.

- **TC6** (full repo check still green) Input: `pnpm check`. Expected:
  exit 0 (lint + typecheck + test + build + size-check across all 22
  packages — no new packages added; same 22 packages as A4). Confirms no
  sibling regression from the 1 new workspace-graph edge (editor-shell
  now also depends on mdx-bridge; the dep flow is acyclic — mdx-bridge
  does NOT depend on editor-shell, verified at PLAN time by `grep -l
  '@skb/editor-shell' packages/mdx-bridge/package.json packages/mdx-
  bridge/src/**/*.ts` returning empty). Location: shell at repo root.

- **TC7** (CONTRACT.md updated public surface — in-PR doc-acceptance)
  Input:
  ```bash
  grep -E '^- ?`?(saveToMdx|loadFromMdx|SaveLoadOptions)' \
    packages/editor-shell/CONTRACT.md
  ```
  Expected: ≥3 hits (one bullet each for saveToMdx + loadFromMdx +
  SaveLoadOptions under `## Public surface`). Pattern-matches the A4 TC7
  form. Location: shell at repo root.

  Also: Stage A close note ratification:
  ```bash
  grep -c '^## Stage A close note' packages/editor-shell/CONTRACT.md
  ```
  Expected: 1 (the new section ratifying the four-helper public API
  surface).

- **TC8** (ADR-0008 D1 dead-dep policy + ADR-0006 D8 decl ↔ source-import
  + decl ↔ reference symmetry — three-way at scale 13). Input:
  ```bash
  # 8.a — package.json declares 13 @skb/* workspace deps
  node -e 'const p=require("./packages/editor-shell/package.json");const all={...p.dependencies,...p.peerDependencies,...p.devDependencies,...p.optionalDependencies};console.log(Object.keys(all).filter(k=>k.startsWith("@skb/")).length)'
  # Expected: 13

  # 8.b — registerBlocks.ts + registerKernels.ts + saveLoad.ts together
  #       source-import all 13
  for pkg in block-foundation block-callout block-code block-image \
             block-math block-pdf block-jupyter block-nn-viz block-agent-flow \
             kernel-adapter kernel-pyodide kernel-registry mdx-bridge; do
    if grep -q "from '@skb/$pkg" \
       packages/editor-shell/src/registerBlocks.ts \
       packages/editor-shell/src/registerKernels.ts \
       packages/editor-shell/src/saveLoad.ts; then
      echo "OK: $pkg"
    else
      echo "MISSING: $pkg"
    fi
  done
  # Expected: 13 OK, 0 MISSING

  # 8.c — tsconfig.json references 13 sibling packages
  node -e 'const t=require("./packages/editor-shell/tsconfig.json");console.log(t.references.length)'
  # Expected: 13
  ```
  Expected: 13 / 13 OK / 13. Three-way symmetry holds: declared deps
  (13) = source imports (13) = tsconfig references (13). The grep loop
  spans BOTH A3-A4 source files AND A5's new saveLoad.ts per the
  established multi-file pattern — A5's lone new import (`@skb/mdx-
  bridge`) lives in saveLoad.ts; A4's 3 live in registerKernels.ts; A3's
  9 live in registerBlocks.ts; the loop OR's over all three. ADR-0008
  D1 dead-dep violations (declared-but-not-imported) impossible by
  construction. ADR-0006 D8 decl ↔ ref symmetry holds via 8.a vs 8.c.
  Node one-liner over actual dep blocks (not naive `grep '@skb/'`) per
  A2-A4 TC8 lesson. Location: shell at repo root.

- **TC9** (lockfile idempotency post-install — ADR-0006 D8 sub-form C
  invariant) Input: from a clean `git status`, run `pnpm install` and
  then `git diff -- pnpm-lock.yaml`. Expected: empty diff (the lockfile
  committed with this PR is the canonical solve for the new `@skb/mdx-
  bridge` workspace dep; a follow-up `pnpm install` produces zero new
  entries / no reordering). Location: shell at repo root. Same-shape
  assertion as A3 + A4 TC9.

## contracts_affected

- `packages/editor-shell/CONTRACT.md` — Modified: `## Public surface`
  adds three new bullets:
  - `saveToMdx(editor: Editor, options?: SaveLoadOptions): string` —
    serializes the editor's current document to MDX source via
    `@skb/mdx-bridge`'s `tiptapToMdx`. Prose-only in Stage A; component
    blocks throw via mdx-bridge's existing fail-loud rule until B1
    extends the walker. The optional `options.blockRegistry` parameter
    is forward-compat scaffolding (accepted-but-unused at the saveLoad
    layer until B1).
  - `loadFromMdx(editor: Editor, source: string, options?: SaveLoadOptions):
    void` — replaces the editor's document by parsing MDX source via
    `@skb/mdx-bridge`'s `mdxToTiptap` + `editor.commands.setContent`.
    Prose-only in Stage A; component-block JSX throws via mdx-bridge's
    existing fail-loud rule until B1.
  - `SaveLoadOptions` — public options type:
    ```ts
    export interface SaveLoadOptions {
      /** Forward-compat per-call BlockRegistry injection. Wave 3 Stage
       *  A: accepted-but-unused at this layer (mdx-bridge does not yet
       *  accept a `{ blockRegistry }` option; B1 adds it). Wave 3
       *  Stage B (B1+): threaded through to mdxToTiptap / tiptapToMdx
       *  so component blocks can parse + serialize via their registered
       *  cores. */
       blockRegistry?: BlockRegistry;
    }
    ```
    `BlockRegistry` type imported from `@skb/block-foundation`.

  And: the `## Wave 3 Stage A expansion outline` section's `**A5** —`
  bullet is rewritten from prediction-tense to past-tense ("Delivered
  in this PR; Stage A complete"; notes the forward-compat narrowing of
  the original "threads blockRegistry through" claim).

  And: a new `## Stage A close note` section is appended ratifying the
  four-helper public API surface for downstream Stage B / C consumers.

  And: the bottom paragraph (`[ADR-0008 D1] dead-dep policy is satisfied
  at A4 by construction…`) is updated to reflect the post-A5 scale: 13
  declared deps + 13 source imports + 13 tsconfig references; mentions
  saveLoad.ts adds the lone new `@skb/mdx-bridge` source import.

## adr_touched

None. A5 implements the previously locked Wave 3 plan entry (lines
283-322 of `docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md`)
plus the A4 CONTRACT.md prediction (with one **narrowing** — see `##
acceptance` bullet 6 on the TC3 reframe + the forward-compat options
parameter). No new architecture decision needs codification:

- The `{ blockRegistry?: BlockRegistry }` forward-compat options
  parameter is canonical TypeScript surface scaffolding, not an
  architectural decision. The architectural decision (per-call injection
  vs global setter) was already made by plan-challenger R2 #9 + locked
  plan B1 line 339 (`per-call injection per plan-challenger #9; NO
  global setter`); A5 honors that decision at the public-API surface
  ahead of B1's producer-side implementation.
- The `editor.getJSON() as TiptapDoc` cast is the documented bridging
  point between Tiptap's `JSONContent` runtime type and mdx-bridge's
  `TiptapDoc` structural type. mdx-bridge's CONTRACT.md "Round-trip
  invariant" defines `TiptapDoc` as the canonical doc-root type; the
  cast is the canonical adapter between Tiptap runtime and mdx-bridge
  type. Not an ADR-level decision.
- The TC3 reframe (signature-acceptance + parameter-tolerance vs locked-
  plan's fail-loud thread-through) is a **documented narrowing** within
  the existing locked plan — A5 cannot fail-loud on a not-yet-existing
  mdx-bridge option. The reframe defers the fail-loud assertion to B1
  (which adds the option + the producer-side fail-loud rule per locked
  plan B1 TC2). No new ADR required because the deferral is internal
  to a single locked plan's stage transition.
- mdx-bridge's existing prose-only API (`mdxToTiptap` + `tiptapToMdx`)
  is governed by Wave 1 origin contracts in `packages/mdx-bridge/CONTRACT.md`
  and not redefined here.

The dispatch context confirms: locked plan A5 row 4 = NO; A4 CONTRACT.md
outline anticipated this dep set (the `@skb/mdx-bridge` dep was predicted
in A4's `**A5** —` outline line); ADR-0011 D2 row 4 trigger does not fire.

## acceptance

1. `pnpm --filter=@skb/editor-shell typecheck` exits 0 — TC5 evidence.
   Specifically validates: (a) the `editor.getJSON() as TiptapDoc` cast
   compiles without `as unknown as` (single-step cast structurally sound
   between Tiptap `JSONContent` and mdx-bridge `TiptapDoc`); (b) the new
   tsconfig `references` array contains all 13 entries (else TS
   composite project resolution fails with TS2307 "Cannot find module
   '@skb/mdx-bridge'"); (c) the test file's `BlockRegistry` import +
   construction at TC3 compiles directly against the
   `@skb/block-foundation` interface (catches drift if BlockRegistry's
   constructor signature changes mid-flight); (d) the `SaveLoadOptions`
   interface compiles under `exactOptionalPropertyTypes: true` with the
   `blockRegistry?: BlockRegistry` optional shape (consumers can pass
   `{}` or omit; explicit `undefined` is rejected — documented behavior).

2. `pnpm --filter=@skb/editor-shell test` exits 0 with the exact counts
   `5 files passed (5)` and `14 passed (14)` — TC4 evidence. The 14 = 1
   A1 smoke + 2 A2 EditorShell + 3 A3 registerBlocks + 3 A4
   registerKernels + 5 A5 saveLoad. The A5's 5 = TC1's 3 fixtures via
   `describe.each` + TC2's 1 + TC3's 1. See `## test_cases` TC4 for the
   locked count rationale.

3. `packages/editor-shell/CONTRACT.md` `## Public surface` heading body
   lists `saveToMdx` + `loadFromMdx` + `SaveLoadOptions` with the exact
   signatures locked at PLAN (so reviewer + ACCEPT can pattern-match):
   ```ts
   /** Serialize the editor's current document to MDX source. Prose-only
    *  in Stage A; component blocks throw via mdx-bridge's existing
    *  fail-loud rule until B1. */
   export function saveToMdx(
     editor: Editor,
     options?: SaveLoadOptions,
   ): string;

   /** Replace the editor's document by parsing MDX source. Prose-only
    *  in Stage A; component-block JSX throws via mdx-bridge's existing
    *  fail-loud rule until B1. */
   export function loadFromMdx(
     editor: Editor,
     source: string,
     options?: SaveLoadOptions,
   ): void;

   export interface SaveLoadOptions {
     blockRegistry?: BlockRegistry;
   }
   ```
   Reviewer rejects any PR that:
   - drops the `options?` parameter from either helper (forward-compat
     scaffolding for B1; locked at PLAN per `## acceptance` bullet 6)
   - changes the return types (string for save, void for load)
   - moves the helpers into a class wrapper (`class SaveLoadHelper`) —
     A5 is locked as free-function form matching A3's `registerBlocks`
     + A4's `registerKernels` shape
   - adds eager registry-thread-through to mdx-bridge calls before B1
     extends mdx-bridge's signature (would be a phantom-API call —
     mdx-bridge does not accept the option yet; TS2554 too-many-args
     would surface immediately)

4. `pnpm check` exits 0 across all 22 packages — TC6 evidence. No
   sibling regression from the 1 new workspace-graph edge (editor-shell
   to mdx-bridge; the dep flow is acyclic — mdx-bridge does NOT depend
   on editor-shell, verified at PLAN time).

5. **Stage A close note ratification**: `packages/editor-shell/CONTRACT.md`
   contains a new `## Stage A close note` section that names the four-
   helper public API surface (registerBlocks + registerKernels +
   saveToMdx + loadFromMdx) + the `EditorShell` component +
   `proseExtensions` re-export, declares Stage A complete, and points
   at Stage B (B1+) for component-block RTT and Stage C for apps/site
   integration. TC7 verifies the section header presence.

6. **TC3 reframe — registry-thread guard split between A5 + B1**: A5
   ships the **public-API surface acceptance** (saveLoad's signature
   accepts `{ blockRegistry?: BlockRegistry }` via TC3 + TC5 evidence
   + acceptance bullet 3 verbatim signature); A5 does NOT ship the
   producer-side fail-loud thread-through assertion because mdx-bridge
   does not yet accept the option (verified at PLAN time:
   `mdxToTiptap(source: string)` + `tiptapToMdx(doc: TiptapDoc)`
   signatures at HEAD have no options arg — see `packages/mdx-bridge/src/parse.ts:43`
   + `packages/mdx-bridge/src/serialize.ts:48`). B1 (locked plan lines
   334-358) extends mdx-bridge with the per-call `{ blockRegistry }`
   option AND adds the producer-side fail-loud thread-through assertion
   AND updates A5's saveLoad.ts call sites with a one-line change per
   site (`mdxToTiptap(source, options)` / `tiptapToMdx(doc, options)`)
   — that B1-side update is documented in `## Out-of-scope`. The split
   honors the locked-plan TC3 invariant (the registry parameter flows
   through saveLoad to mdx-bridge) while respecting mdx-bridge's
   current API surface; `## test_cases` TC3 + `## adr_touched` document
   the resolution as a single source of truth.

7. **One workspace dep**: A5 declares **1** new `@skb/*` workspace dep
   in `packages/editor-shell/package.json` — `@skb/mdx-bridge`. The
   single `import { mdxToTiptap, tiptapToMdx, type TiptapDoc } from
   '@skb/mdx-bridge'` source import in `saveLoad.ts` is the anchor for
   the declared dep per ADR-0008 D1. Total post-A5 `@skb/*` deps: 13
   (9 block-* + 3 kernel-* + 1 mdx-bridge). The `@tiptap/core`,
   `@tiptap/react`, `@tiptap/starter-kit`, and React peer/runtime/dev
   deps from A2 carry forward unchanged. No peerDependency or
   devDependency additions at A5.

8. `pnpm-lock.yaml` is regenerated and staged in the same commit as
   `packages/editor-shell/package.json` per ADR-0006 D8 sub-form C;
   second `pnpm install` post-commit produces zero diff (idempotency
   holds — TC9 evidence). Verify staged-pair via `git diff --cached
   --stat` at commit time. The new dep is workspace-local
   (`workspace:*`), so the lockfile delta is small — only one new
   importer-graph entry under `packages/editor-shell:`'s deps section
   pointing at a workspace `link:` entry; no new resolution work.

9. The PR.md (`docs/plans/wave-3-main/A5-editor-shell-save-load.md`) is
   present in the staged file list at commit time per ADR-0006 D8
   strict whitelist (A1-A4 lessons + PR #1 R2 lesson).

10. **Unchanged-files protected** (the `## files` "Explicitly NOT in
    `files:`" subsection): A1-A4 deliverables, all 8 `block-*`,
    `block-foundation`, all 3 `kernel-*`, `mdx-bridge` source/test/
    contract, root `tsconfig.json`, `pnpm-workspace.yaml`,
    `agent-contract.md`, vitest.config.ts, Wave 3 plan file — all
    return empty diffs. See `## files` for the exact verify command set.

11. **ADR-0008 D1 dead-dep policy + ADR-0006 D8 decl ↔ ref symmetry**:
    13 declared `@skb/*` workspace deps in package.json AND 13 source
    imports across registerBlocks.ts + registerKernels.ts + saveLoad.ts
    AND 13 references in tsconfig.json — three-way exact-13 match. TC8
    evidence (the .a + .b + .c sub-checks). F3-class violations
    (declared-but-not-imported) impossible by construction — the loop
    in TC8.b is the verification.

12. **Structure-auditor orphan reduction — terminal-consumer claim**:
    pre-A5, structure-auditor reports 1 expected orphan (editor-shell
    only) per A4's bullet 11 wrap-up. Post-A5, the new edge from
    editor-shell consumes mdx-bridge — mdx-bridge becomes consumed by
    editor-shell (was previously only consumed by Wave 1 internal
    test fixtures, no Wave 2+ workspace consumer). editor-shell itself
    remains orphan until Stage C apps/site consumption. Locked plan
    line 19 frames A5 as "the terminal consumer that closes 13 of 13
    expected orphans simultaneously" — this is the **A5 milestone
    claim**: 13 declared deps × 1 consumer (editor-shell) saturates the
    workspace graph at the editor-shell node; structure-auditor's
    "expected orphans" count drops to its post-A5 floor. Same
    informational status as A3 + A4 bullets 11 (not a hard test;
    reviewer + ACCEPT note the expected number for cross-validation
    when the audit fires later).

## executor

Transitional dual-path policy continued from A1-A4. The user has not yet
merged `tmp/codex-profiles.toml` → `~/.codex/config.toml` (Pre-A1
documents the merge but does not enforce). Orchestrator decides at lock
time which path is live. Same dual-path framing as A4.

- **PLAN**: `pr-writer` Claude subagent (this dispatch).
- **EXECUTE**:
  - **Path A (preferred — TOML merged)**: `codex-generic-executor`
    (gpt-5.5, workspace-write sandbox per ADR-0011 D6). One-shot
    dispatch creates the 1 NEW source file + 1 NEW test file, modifies
    the 4 non-self in-package files (package.json, tsconfig.json,
    CONTRACT.md, src/index.ts); orchestrator runs `pnpm install` after
    to regenerate `pnpm-lock.yaml`. Audit log:
    `.codex-runs/wave-3-main/A5-execute-codex-generic-executor.txt`.
    The locked plan A5 entry's `**executor:** \`codex-generic-executor\``
    cue confirms this path is the canonical choice; no test-scaffolder
    split needed because the 5 test cases share a unified shape (fresh
    `Editor` + StarterKit fixture inline) and total ~75-90 LOC.
  - **Path B (transitional — TOML not merged)**: `orchestrator-self`.
    The 6 files total ~100-120 LOC of well-patterned code (saveLoad.ts
    is two ~5-line bodies; test file mirrors A3 + A4's vitest.test.ts
    structure; package.json + tsconfig.json mirror A4's 3-of-12 pattern
    at 1-of-13 scale; CONTRACT.md edits mirror A4's two-section pattern
    plus the new `## Stage A close note` section). Within orchestrator-
    direct edit scope. Path B is a fallback only if Path A is not yet
    activated. Audit log:
    `.codex-runs/wave-3-main/A5-execute-orchestrator.txt` (Claude self-
    narrated; no codex stdout to capture).
- **REVIEW**:
  - **Path A**: `codex-pr-reviewer-55` (5.5; ADR-0006 8-point checklist
    mandatory; ADR-0006 D8 explicit-file-list staging rules apply at
    stage 5). Audit log:
    `.codex-runs/wave-3-main/A5-codex-pr-reviewer-55.txt`. Reviewer
    must specifically verify: (a) the saveToMdx + loadFromMdx
    signatures match acceptance bullet 3 verbatim (return types `string`
    + `void`, optional third+second `options?: SaveLoadOptions`
    parameters); (b) the `@skb/mdx-bridge` dep at `workspace:*` (not
    `^0.0.0` or other resolution); (c) tsconfig `references` length is
    exactly 13, alphabetical, matching package.json deps; (d) NO `as
    unknown as` cast anywhere in saveLoad.ts (the single `as TiptapDoc`
    cast is the locked pattern; double-cast presence indicates a
    divergent type drift to investigate); (e) the 14-test count in
    vitest output (1 A1 + 2 A2 + 3 A3 + 3 A4 + 5 A5); if the test glob
    regression sneaks in, A5's tests silently skip and the run falsely
    reports 9 passed — reviewer + ACCEPT both verify the count, not
    just exit-0; (f) the saveLoad.ts file does NOT pass the `options`
    argument through to mdxToTiptap / tiptapToMdx (would be a phantom
    API call — TS2554 surfaces immediately, but reviewer pattern-matches
    the source for the underscore-prefixed `_options` parameter as the
    visual locked pattern); (g) the new `## Stage A close note` section
    in CONTRACT.md is present and ratifies the four-helper public API
    surface.
  - **Path B**: transitional `pr-gate` profile (read-only) for line-
    level review; orchestrator-self handles the 8-point checklist +
    spec-match cross-check. Audit log:
    `.codex-runs/wave-3-main/A5-pr-gate.txt`.
- **PRE-COMMIT CLAUDE REVIEW** (D1 stage 4 — fires per `## D2 trigger
  judgment` Row 1 hit): `orchestrator-self`. Mitigates same-model echo-
  chamber risk on the CONTRACT.md public-surface change (3 new export
  bullets + outline rewrite + new `## Stage A close note` section + dep-
  count-paragraph update). Specifically inspects: (1) the
  `saveToMdx(editor, options?)` + `loadFromMdx(editor, source, options?)`
  signatures are identical to acceptance bullet 3; (2) `saveToMdx` +
  `loadFromMdx` + `SaveLoadOptions` exported from the editor-shell
  barrel (verifies `src/index.ts` `+2` lines); (3) the underscore-
  prefixed `_options` parameter is present in saveLoad.ts (the locked
  forward-compat pattern; non-underscore form would imply registry-
  thread-through is being attempted — phantom API call); (4) the `##
  Wave 3 Stage A expansion outline` A5 line is rewritten to past-tense
  AND notes the forward-compat options narrowing (per `## acceptance`
  bullet 6); (5) the new `## Stage A close note` section ratifies the
  four-helper API surface verbatim per `## acceptance` bullet 5.
- **COMMIT**:
  - **Path A**: reviewer codex `codex-pr-reviewer-55` per ADR-0011 D1
    stage 5 + ADR-0006 D8 explicit-file-list staging. Exact stage:
    ```bash
    git reset HEAD
    git add \
      packages/editor-shell/package.json \
      packages/editor-shell/tsconfig.json \
      packages/editor-shell/CONTRACT.md \
      packages/editor-shell/src/index.ts \
      packages/editor-shell/src/saveLoad.ts \
      packages/editor-shell/src/__tests__/saveLoad.test.ts \
      pnpm-lock.yaml \
      docs/plans/wave-3-main/A5-editor-shell-save-load.md
    git diff --cached --stat   # verify exactly 8 files
    git commit
    ```
  - **Path B**: orchestrator-self runs the same 4-step explicit stage.
    Either path commits exactly 8 files; any deviation (notably
    accidental `tsconfig.json` (root) or `agent-contract.md` inclusion
    via `git add -A`, or accidental block-* / kernel-* / mdx-bridge /
    A1-A4-deliverable modification escaping into the stage list) is
    rejected at stage 5.
- **ACCEPT**: `pr-writer` Claude subagent (second invocation per ADR-0011
  D1 stage 6). Reads PR.md `acceptance:` block + `git diff main..HEAD`
  and verifies each of the 12 acceptance bullets is met; emits ACCEPT
  or REJECT-with-residue. **Stage A close ceremony note**: after A5
  ACCEPTs, orchestrator runs the post-Stage-A user-checkpoint review
  (per dispatch context "After ACCEPT + CI green, user will checkpoint
  review before B-stage starts").

## D2 trigger judgment (orchestrator-locked at PLAN)

- **Row 1** (CONTRACT.md change): **HIT**.
  `packages/editor-shell/CONTRACT.md` `## Public surface` body changes
  from the A4-locked 5-bullet surface (EditorShell + EditorShellProps +
  registerBlocks + proseExtensions + registerKernels) to an 8-bullet
  surface (adds saveToMdx + loadFromMdx + SaveLoadOptions). Plus a new
  `## Stage A close note` section is appended. Substantive contract
  surface expansion + Stage A close ratification.
- **Row 2** (package add/remove): **NO**. No new workspace package; A5
  adds 1 workspace **dep** to an existing package.
- **Row 4** (new ADR required): **NO**. Locked plan line 310 confirms
  `**adr_touched:** None`. A5 implements a previously-sealed plan entry
  + A4's predicted CONTRACT.md outline (with the TC3 reframe + forward-
  compat options narrowing detailed in `## acceptance` bullet 6 — a
  narrowing of producer-side responsibility from A5 to B1 within the
  existing locked plan, not an architecture decision). The forward-compat
  options pattern is canonical TS surface, not an ADR-level decision.
- **Row 5** (cross ≥ 3 packages): **NO**. The diff touches one source
  package (`packages/editor-shell`) plus `pnpm-lock.yaml` plus this
  PR.md. The workspace-graph mutation is **1 new dep edge** (editor-
  shell to mdx-bridge) — smaller than A4's 3-edge mutation. Per the
  established Row 5 interpretation (multi-package source-file modification,
  not workspace-graph mutation alone), Row 5 is NO at A5 — A5 is purely
  consumer-side at one package.
- **Row 8** (CI / build / deploy / auth / security): **NO**. No
  `.github/workflows/*.yml`, no deploy/auth/security config touched.

→ **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** (Row 1 hit; orchestrator-
self, mitigates codex same-model echo-chamber risk on the CONTRACT.md
public-surface change + the new `## Stage A close note` section's
four-helper-API ratification). Row 5 NO so no elevated-scrutiny sub-rule
applies within stage 3.

## Out-of-scope (explicitly deferred)

- **Threading registry through to mdx-bridge calls** — deferred to **B1**
  per locked plan lines 334-358. B1 extends mdx-bridge with the per-call
  `{ blockRegistry }` option, adds the producer-side fail-loud thread-
  through assertion, AND updates A5's saveLoad.ts call sites with a
  single-line change per call site (`mdxToTiptap(source, options)` /
  `tiptapToMdx(doc, options)`). The B1-side update is small (~2 lines)
  and is the natural completion of A5's forward-compat scaffolding —
  the underscore-prefixed `_options` parameter loses the underscore at
  B1 commit time, the source-import line stays unchanged, and TC3's
  signature-acceptance assertion remains valid (B1 adds a producer-
  side TC of the thread-through invariant). See `## test_cases` TC3 +
  `## acceptance` bullet 6.
- **Component-block round-trip** — deferred to Stage B (B1+B2-B8). Per
  locked plan §326-410: B1 adds the mdx-bridge dispatch infrastructure
  (`mdxJsxFlowElement` parsing + serialization via blockRegistry); B2-
  B8 add per-block fixture + parse/serialize routing for all 8 block
  kinds. A5's saveLoad currently throws via mdx-bridge's existing
  fail-loud rule on `mdxJsxFlowElement` — see `packages/mdx-bridge/src/__tests__/round-trip.test.ts:101-156`
  for the existing fail-loud regression tests. Consumers attempting to
  save an editor with component blocks at Stage A close get a clear
  "unsupported block type" error from mdx-bridge — desired behavior;
  Stage B unlocks the support.
- **apps/site integration** — deferred to Stage C (C1-C5). A5 ships the
  saveLoad helper API at editor-shell scope; apps/site's MDX integration
  (route handlers, BlockRegistry routing, dynamic chunking) is Stage
  C's responsibility. Stage A's `## Stage A close note` ratifies the
  four-helper public API surface as the stable consumer-facing API for
  Stage C to consume.
- **Locked-plan A4-edge-case kernel-session-collision sub-test** —
  locked plan line 247-248 stipulates "kernel-session-collision.test.ts
  in A4 + A5 sub-test of saveLoad in A5". A4 did not include this
  regression (A4 PR.md silently elided it; orchestrator did not block).
  A5 likewise does NOT include the kernel-session-collision test
  because: (a) saveLoad.ts has zero kernel-startSession surface (it
  delegates to mdx-bridge's prose-only walker, which has no kernel
  awareness — the kernel-bridge logic lives in `packages/block-jupyter/src/__tests__/kernel-bridge.test.ts`
  at the producer side); (b) the regression test is naturally the
  producer (kernel-pyodide / block-jupyter) side's responsibility, not
  the editor-shell composition layer's; (c) the original locked-plan
  pairing of "A4 + A5 sub-test of saveLoad" was speculative — the
  saveLoad layer has no kernel surface to regress against. **Residue
  flag**: orchestrator may decide to file the kernel-session-collision
  regression as a follow-up cleanup PR at producer side (block-jupyter
  or kernel-pyodide); A5 ACCEPT will note this as residue if so. The
  decision is orchestrator's, not pr-writer's; flagged here for
  transparency.
- **`saveAsMdxFile` / `loadFromMdxFile` filesystem-aware variants** —
  Node-side filesystem helpers (read MDX from disk, write to disk) are
  consumer concerns and out of editor-shell's scope. Stage C apps/site
  may add wrapper helpers; A5 ships only the in-memory string-form
  helpers per locked plan.
- **`onSaveError` / `onLoadError` callbacks** — error handling for
  fail-loud mdx-bridge throws is consumer-side via try/catch around
  `saveToMdx` / `loadFromMdx`. A5 does NOT wrap mdx-bridge errors in
  consumer-friendly callback signatures; that's a Stage C ergonomic
  layer. Locked plan A5 entry implies bare-throw passthrough.
- **`Editor`-as-class-import barrel re-export** — A5 ships saveLoad
  helpers that take `Editor` as a parameter type; consumers needing
  to construct an `Editor` still import directly from `@tiptap/core`.
  A future ergonomics-pass PR may add a barrel re-export here, but
  A5 stays minimal.
- **Multi-document save (MDX manifest)** — the saveToMdx + loadFromMdx
  helpers operate on a single Tiptap editor instance. Multi-document
  workflows (e.g. notebook-style multi-page editing) are Stage C+
  scope; A5 ships single-document semantics only.

## Risk grid (Wave 3 main pipeline standing)

A5 specifics:

- **Lockfile delta** — small (1 dep is workspace-local `link:` entry).
  If reviewer sees a 1000+ line lockfile diff, that's a flag —
  investigate before commit (likely external resolution drift unrelated
  to A5, NOT a workspace dep addition).
- **Test silently passing** — A2 already locked the `vitest.config.ts`
  `.tsx` glob; A5's test file is `.ts` (no React render needed; Tiptap
  Editor mounts in pure JS via happy-dom). The glob covers `.test.{ts,tsx}`
  so both work. TC4 acceptance check (`14 passed (14)`) catches a silent
  skip; reviewer + ACCEPT verify the count, not just exit-0.
- **Cast appearance regression** — A5 expects exactly ONE single-step
  cast in `saveLoad.ts` (`editor.getJSON() as TiptapDoc`). NO `as
  unknown as` double-cast. If executor inserts a double-cast, that's a
  flag — investigate (likely a divergent type or stale reference).
  Acceptance bullet 1 sub-clause (a) + reviewer specific-verify (d)
  both pin this down.
- **Phantom API call regression** — A5 must NOT pass `options` argument
  through to `mdxToTiptap` / `tiptapToMdx` because mdx-bridge does not
  yet accept it; if executor forgets the underscore-prefix and threads
  through naively, TS2554 ("Expected 1 arguments, but got 2") fires at
  TC5 — informative failure but reviewer-side patch (revert to
  underscore-prefix). Acceptance bullet 6 + reviewer specific-verify
  (f) pin this down.
- **Trim-equivalence fragility** — TC1's `expect(restored.trim()).toBe(fixture.trim())`
  matches mdx-bridge's established invariant (round-trip.test.ts:34). If
  a fixture happens to round-trip with a structural change (e.g. nested
  list normalization, frontmatter key reordering), the test fails
  informatively. Locked plan TC1 specifies 3 simple fixtures (heading +
  list + paragraph) chosen specifically to avoid these edge cases —
  single-level lists, simple H1+H2 headings, single-paragraph body. If
  a fixture surprises with a non-trim-equivalent RTT, residue: investigate
  whether mdx-bridge has a normalization pass (acceptable; document)
  or a round-trip bug (file follow-up; out of A5 scope).
- **Same-model echo chamber** — mitigated by D1 stage 4 PRE-COMMIT
  CLAUDE REVIEW (Row 1 hit). orchestrator-self specifically inspects
  saveLoad signatures + the 13 dep declarations vs 13 source imports vs
  13 references three-way symmetry + the new `## Stage A close note`
  section's four-helper-API ratification.
- **Cross-package compile-failure** — if mdx-bridge had a typecheck
  regression at HEAD, A5's `pnpm check` TC6 would surface it (the new
  edge forces mdx-bridge to re-typecheck transitively). Pre-PLAN check:
  `pnpm --filter=@skb/mdx-bridge typecheck` PASS at HEAD `4d418dd`
  (assumed clean from A4 merge; full repo typecheck assumed clean).
- **A1-A4 deliverable regression** — A5 explicitly does NOT modify
  EditorShell.tsx, smoke.test.ts, registerBlocks.ts, registerKernels.ts,
  the A2-A4 test files. The acceptance bullet 10 grep set ensures it.
  If executor accidentally edits any (e.g. to wire saveLoad into
  EditorShell — which is OUT OF SCOPE per `## Out-of-scope`'s "apps/
  site integration" line + "Editor-as-class-import barrel re-export"
  line), reviewer rejects.
- **TC3 reframe drift** — the dispatch context's TC3-resolution-or-drop
  framing leaves room for the alternative "drop TC3 entirely from A5
  and defer to B1". A5 chose **reframe** (signature-acceptance + parameter-
  tolerance test at saveLoad layer; producer-side fail-loud thread-
  through deferred to B1) over drop because: (i) the reframe preserves
  the locked-plan TC3 invariant ("registry parameter flows through
  saveLoad to mdx-bridge") at compile-time + runtime in A5 scope; (ii)
  drop would lose the public-API signature lock (consumers couldn't
  rely on saveLoad's signature being stable across B1's transition);
  (iii) the reframe's runtime test (omitting registry yields identical
  prose-RTT output) is a useful tolerance assertion independent of B1.
  If reviewer considers the reframe insufficient, the alternative is
  to drop TC3 + leave a TODO in `## Out-of-scope` pointing at B1's
  TC1+TC3+TC6 — orchestrator-side decision. Same-model echo chamber
  mitigation: D1 stage 4 PRE-COMMIT CLAUDE REVIEW specifically inspects
  TC3's reframe legitimacy.

## Related

- [ADR-0011 D1+D2+D6](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pipeline + PR.md schema; D6 introduces the codex profiles this PR's
  executor block conditionally selects.
- [ADR-0006 D8](../../decisions/ADR-0006-asymmetry-audit-checklist.md) —
  explicit-file-list staging + sub-form C lockfile rule (`## acceptance`
  bullet 8) + decl ↔ ref symmetry rule (`## acceptance` bullet 11 +
  TC8.c).
- [ADR-0008 D1](../../decisions/ADR-0008-wave-2-entry-policies.md) —
  dead-dep policy (tighten); A5 ships 1 new workspace dep, source-imported
  in saveLoad.ts (TC8.b verifies — `import` for `mdxToTiptap` +
  `tiptapToMdx`, `import type` for `TiptapDoc` — both count toward the
  dep declaration).
- [ADR-0010 D7 #3](../../decisions/ADR-0010-wave-2-close.md) —
  "editor-shell composition" deferral that Stage A closes; A5 is the
  fifth and final step closing it. The `## Stage A close note` in
  CONTRACT.md ratifies the four-helper public API surface as the
  consumer-facing API for Stage B / C.
- [Wave 3 plan, A5 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md)
  — locked plan entry (lines 283-322), Stage A intro (lines 12-26
  framing the "13 expected orphans" terminal-consumer claim).
- [Wave 3 plan, B1 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md)
  — B1 (lines 334-358) is the producer-side companion that adds
  mdx-bridge's per-call `{ blockRegistry }` option and updates A5's
  saveLoad.ts call sites with a one-line thread-through change. See
  `## acceptance` bullet 6 + `## Out-of-scope` for the A5↔B1 split.
- [A1 PR.md](./A1-editor-shell-skeleton.md) — predecessor (created the
  empty package).
- [A2 PR.md](./A2-editor-shell-tiptap-container.md) — predecessor (Tiptap
  container + Editor type integration).
- [A3 PR.md](./A3-editor-shell-block-registry.md) — predecessor
  (BlockRegistry boot — A5 type-imports `BlockRegistry` from the same
  source for the SaveLoadOptions parameter type).
- [A4 PR.md](./A4-editor-shell-kernel-registry.md) — immediate
  predecessor (just merged `4d418dd`); created `registerKernels` whose
  helper-shape pattern A5 mirrors at saveLoad scope.
- [Pre-A1 PR.md](./Pre-A1-codex-profile-toml-merge.md) — bootstrap
  predecessor that documented the codex-profile TOML merge that Path A
  EXECUTE depends on.
- [packages/mdx-bridge/CONTRACT.md](../../../packages/mdx-bridge/CONTRACT.md)
  — public API surface A5 consumes (`mdxToTiptap` + `tiptapToMdx` +
  `TiptapDoc` type). Wave 1 contract; A5 does NOT modify it.
- [packages/mdx-bridge/src/parse.ts](../../../packages/mdx-bridge/src/parse.ts)
  — implementation of `mdxToTiptap`; line 43 confirms current signature
  `(source: string): TiptapDoc` with no options arg (the basis for the
  TC3 reframe at `## acceptance` bullet 6).
- [packages/mdx-bridge/src/serialize.ts](../../../packages/mdx-bridge/src/serialize.ts)
  — implementation of `tiptapToMdx`; line 48 confirms current signature
  `(doc: TiptapDoc): string` with no options arg.
- [packages/mdx-bridge/src/__tests__/round-trip.test.ts](../../../packages/mdx-bridge/src/__tests__/round-trip.test.ts)
  — established prose RTT test pattern A5's TC1 follows (`expect(restored.trim()).toBe(original.trim())`
  at line 34); also confirms mdx-bridge's existing fail-loud rule on
  unknown block types (lines 101-156) which gates A5's component-block
  deferral.
- [packages/block-foundation/CONTRACT.md](../../../packages/block-foundation/CONTRACT.md)
  — `BlockRegistry` type authority A5 imports (type-only) for the
  SaveLoadOptions parameter type.
