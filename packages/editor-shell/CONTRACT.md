# `@skb/editor-shell` — Contract

Wave 3 Stage A composition layer. Composes the 8 block-* packages, 3 editor
sub-modules, kernel-registry adapters, and mdx-bridge into a usable Tiptap
editor surface. Closes the "editor-shell composition" deferral from
[ADR-0010 D7 #3](../../docs/decisions/ADR-0010-wave-2-close.md).

## Public surface

NONE — Wave 3 A1 skeleton.

`src/index.ts` is an empty barrel (`export {};`). The package exists as a
build-graph node and lockfile workspace entry so subsequent A2-A5 PRs can
populate it incrementally without each adding a new package + tsconfig
references graph entry.

## Wave 3 Stage A expansion outline

A2-A5 each Modify this CONTRACT.md as new exports land:

- **A2** — `EditorShell` React component (Tiptap `useEditor` + StarterKit
  prose extensions only; no block registry yet). Adds `@tiptap/react`,
  `@tiptap/starter-kit`, `react`, `react-dom` peer deps + `happy-dom` devDep.
- **A3** — `registerBlocks(registry)` helper. Wires the 8 block-* core +
  ui-default definitions into a `BlockRegistry` instance. Adds 8 `@skb/block-*`
  + `@skb/block-foundation` workspace deps.
- **A4** — `registerKernels(registry)` helper. Wires `PyodideAdapter` into
  `kernel-registry`. Adds `@skb/kernel-registry` + `@skb/kernel-pyodide`
  workspace deps.
- **A5** — `saveToMdx(editor)` + `loadFromMdx(editor, mdxString)`. Threads
  `blockRegistry` through `mdx-bridge`'s per-call injection (no global setter).
  Adds `@skb/mdx-bridge` workspace dep. Closes 13 expected orphan packages
  simultaneously by becoming the terminal consumer.

Until A2 lands, this package has no consumer; this is intentional and
[ADR-0008 D1](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) dead-dep
policy is satisfied trivially (zero workspace deps declared = zero TS-import
asymmetry possible).

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
