# `@skb/editor-shell` — Contract

Wave 3 Stage A composition layer. Composes the 8 block-* packages, 3 editor
sub-modules, kernel-registry adapters, and mdx-bridge into a usable Tiptap
editor surface. Closes the "editor-shell composition" deferral from
[ADR-0010 D7 #3](../../docs/decisions/ADR-0010-wave-2-close.md).

## Public surface

- `EditorShell` — functional React component. Mounts a Tiptap editor via
  `@tiptap/react`'s `useEditor` with `[StarterKit]` prose extensions only.
  No block-* extensions yet (A3 adds the registry boot).
- `EditorShellProps` — public props type:
  ```ts
  export interface EditorShellProps {
    /** Optional initial editor content (Tiptap doc JSON or HTML string).
     *  Defaults to an empty paragraph. */
    initialContent?: object | string;
    /** Optional change callback fired on each Tiptap update event. */
    onChange?: (editor: Editor) => void;
    /** Optional className applied to the EditorContent root for
     *  consumer-controlled styling. */
    className?: string;
    /** Optional creation hook: invoked once with the constructed editor
     *  instance after mount. Used by tests + future A3 wrappers needing
     *  imperative editor access. */
    onCreate?: (editor: Editor) => void;
  }
  ```
  `Editor` type re-exported transitively from `@tiptap/core` via
  `@tiptap/react`.
- `registerBlocks(registry: BlockRegistry): void` — wires the 8 Wave 2
  block-* core + ui-default definitions into the supplied `BlockRegistry`
  instance. Idempotent at consumer scope (each registerBlocks call expects a
  fresh registry; calling twice on the same registry throws "Duplicate core
  name" per BlockRegistry contract). Insertion order = locked-plan order:
  callout, code, image (component), math, pdf (render), jupyter, nn-viz,
  agent-flow (viz). Per ADR-0009 D1: 3 component + 2 render + 3 viz = 8.
- `proseExtensions` — Tiptap Extension array re-exported from
  `@skb/block-foundation`. Consumers wire into `useEditor({ extensions: [...] })`
  alongside `StarterKit` for prose-block-aware editing. A2's `EditorShell`
  does NOT consume this yet (StarterKit-only); A3+ wrappers may.
- `registerKernels(registry: KernelRegistry, adapter?: KernelAdapter): void`
  — wires `PyodideAdapter` (default) into the supplied `KernelRegistry`
  instance. `adapter` parameter lets consumers override with a custom
  `KernelAdapter` implementation. PyodideAdapter constructor is cheap
  (no Pyodide boot until `startSession()`). `KernelAdapter` type imported
  from `@skb/kernel-adapter` (3rd workspace dep added at A4).

The component does NOT include a `'use client'` pragma — consumers (Stage C
apps/site) decide the client/server boundary at integration time.

## Wave 3 Stage A expansion outline

A2-A5 each Modify this CONTRACT.md as new exports land:

- **A2** — `EditorShell` React component delivered in this PR (Tiptap
  `useEditor` + StarterKit prose extensions only; 4-prop API surface above).
  Adds `@tiptap/{core,react,starter-kit}`, `react`, `react-dom` peer/runtime
  deps + happy-dom + @testing-library/react devDeps.
- **A3** — `registerBlocks(registry)` helper delivered in this PR. Wires the
  8 block-* core + ui-default definitions into a `BlockRegistry` instance.
  Added 8 `@skb/block-*` + `@skb/block-foundation` workspace deps + 9
  composite-project tsconfig references. Also re-exports `proseExtensions`
  from block-foundation as a barrel convenience. `proseExtensions` is NOT
  exposed as an `EditorShell` prop in A3 (the speculative A2-outline form);
  consumers compose it directly into their `useEditor` extensions array.
- **A4** — `registerKernels(registry, adapter?)` helper delivered in this
  PR. Wires `PyodideAdapter` (default) into `kernel-registry`. Added
  `@skb/kernel-registry` + `@skb/kernel-pyodide` + `@skb/kernel-adapter`
  workspace deps (3 not 2 — `KernelAdapter` type lives in `@skb/kernel-adapter`,
  not re-exported by registry/pyodide).
- **A5** — `saveToMdx(editor)` + `loadFromMdx(editor, mdxString)`. Threads
  `blockRegistry` through `mdx-bridge`'s per-call injection (no global setter).
  Adds `@skb/mdx-bridge` workspace dep. Closes 13 expected orphan packages
  simultaneously by becoming the terminal consumer.

[ADR-0008 D1](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) dead-dep
policy is satisfied at A4 by construction: every declared `@skb/*` workspace
dep has at least one `from '@skb/<pkg>'` source import in
`src/registerBlocks.ts` / `src/registerKernels.ts` / `src/index.ts`. The 12
declared deps + 12 source imports + 12 tsconfig references hold three-way
exact-match symmetry.

## Modifying this file

Each A2-A5 PR Modifies this file to extend "Public surface" as exports land.
The "Wave 3 Stage A expansion outline" section is informational; once A5
closes Stage A, that section may be retired in favor of a stable public-surface
declaration (orchestrator decision at Stage A close ceremony).

## Related

- [ADR-0010 D7 #3](../../docs/decisions/ADR-0010-wave-2-close.md) — editor-shell composition deferral closed by Stage A
- [ADR-0011 D1+D6](../../docs/decisions/ADR-0011-linear-pipeline-execution-model.md) — pipeline + codex profiles
- [Wave 3 plan, Stage A](../../docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) — locked Stage A scope
- [packages/block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md) — registry consumer pattern A3 will use
- [packages/mdx-bridge/CONTRACT.md](../mdx-bridge/CONTRACT.md) — per-call injection pattern A5 will use
