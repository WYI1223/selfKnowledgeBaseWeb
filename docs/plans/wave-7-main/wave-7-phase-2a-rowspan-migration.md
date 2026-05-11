# Wave 7 Phase 2A — `rowSpan='auto'` → discrete integer migration

> Migrates the cf-25 prose `rowSpan='auto'` sentinel to a discrete
> integer (default 1) per [ADR-0020](../../decisions/ADR-0020-grid-engine-contract.md)
> D1. Markdown content overflow now scrolls inside the block instead
> of growing the block height. Byte-equivalent round-trip preserved
> for new files; legacy `rowSpan='auto'` attrs are one-time normalized
> to 1 on first parse/save (intentional per design-doc §5).

## title

Replace `'auto'` rowSpan literal with discrete integer across the
entire stack (block-foundation types + helpers, block-markdown Zod
schema + UI default, mdx-bridge parse/serialize/chunking,
editor-shell grid-style + drag-drop snapshots, apps/site read-route
adapter, grid.css overflow). Delete the unused `useAutoRowSpan` hook
+ its tests. Markdown default = 12 × 1; content overflow scrolls
inside the block via `overflow-y: auto`.

## files

### block-foundation

- `packages/block-foundation/src/types.ts` —
  - Drop `RowSpanSemantic` type (no longer relevant)
  - Replace `proseGridDefaults.rowSpanSemantic: 'auto'` with `defaultRowSpan: 1`
  - `BlockGridPosition.rowSpan` narrowed from `number | 'auto'` to `number`
- `packages/block-foundation/src/grid-math.ts` —
  - Delete `effectiveRowSpan` (no auto path to substitute)
  - Delete `isAutoRowSpan` (no semantic discriminator left)
  - Simplify `validateGridPosition` (drop 'auto' branch)
- `packages/block-foundation/src/registry.ts` —
  - Remove `rowSpanSemantic?` field from `BlockUIDefinition`
- `packages/block-foundation/src/__tests__/grid-math.test.ts` —
  - Update prose defaults test for new shape; drop auto-related cases
- `packages/block-foundation/src/__tests__/registry.test.ts` —
  - Drop `rowSpanSemantic` round-trip case

### block-markdown

- `packages/block-markdown/src/core/core-definition.ts` —
  - Replace `z.union([z.number().int().positive(), z.literal('auto')])` with `z.number().int().positive()`
- `packages/block-markdown/src/ui-default/index.ts` —
  - Drop `rowSpanSemantic: 'auto'` from UI definition
- `packages/block-markdown/src/__tests__/parse-serialize.test.ts` —
  - Update schema cases: integer-only; add explicit "rejects 'auto' literal" case

### mdx-bridge

- `packages/mdx-bridge/src/parse.ts` —
  - `GridAttrs.rowSpan` narrowed from `number | 'auto'` to `number`
  - `parseRowSpan`: missing attr on prose → 1 (was 'auto'); legacy `'auto'` literal on prose → 1; non-prose 'auto' still throws
- `packages/mdx-bridge/src/serialize.ts` —
  - Prose isProse branch: emit rowSpan only when ≠ 1 (the new default); legacy 'auto' attrs normalize to 1
  - Non-prose: still hard-throw on 'auto'
- `packages/mdx-bridge/src/markdown-chunking.ts` —
  - Update comments to reflect rowSpan=1 default
  - `markdownAttrsAreDefault`: rowSpan absent OR rowSpan=1 → wrapper unwraps to bare prose

### editor-shell

- `packages/editor-shell/src/grid-style.ts` —
  - Drop `'auto'` from `GridPlacementInput.rowSpan` type union
  - Delete `GridPlacementOptions` + `autoRowSpan` option
  - Simplify formula (no substitution)
  - `extractGridPosition`: defensive `'auto'` → 1 normalization for legacy read paths
- `packages/editor-shell/src/registry-wire.tsx` —
  - `proseGridAttrs.rowSpan: 'auto' as const` → `1`
- `packages/editor-shell/src/drag-drop/pipeline-snapshot.ts` —
  - Add `normalizeRowSpan` helper; snapshot blocks always carry integer rowSpan
- `packages/editor-shell/src/drag-drop/apply-drop-mode.ts` —
  - Simplify `hostRowSpan = typeof host.rowSpan === 'number' ? ... : 1` to direct read
- `packages/editor-shell/src/use-auto-row-span.ts` — **DELETED**
- `packages/editor-shell/src/__tests__/use-auto-row-span.test.ts` — **DELETED**
- `packages/editor-shell/src/index.ts` —
  - Remove `useAutoRowSpan` export
  - Remove `GridPlacementOptions` export

### apps/site

- `apps/site/src/components.ts` —
  - `MarkdownReadView`: default missing rowSpan to 1 (was 'auto')
- `apps/site/src/styles/grid.css` —
  - Add `overflow-y: auto` rule on `.skb-block-static[data-skb-block-kind='markdown']` + `.skb-block-nodeview[data-skb-block-kind='markdown']` so content scrolls inside the block when taller than its integer rowSpan

### Playwright

- `apps/site/playwright/grid-drag-drop.spec.ts` —
  - AC#8 (useAutoRowSpan re-measure) → skipped with REMOVED-IN-WAVE-7-PHASE-2A marker
- `apps/site/playwright/grid-resize-responsive.spec.ts` —
  - AC#10 useAutoRowSpan responsive switch → skipped with same marker

## ui_touch

`true` — `apps/site/src/components.ts` + `apps/site/src/styles/grid.css`
modified. UI surface unchanged for fresh files; visible difference is
that very-tall markdown content now scrolls inside the block instead
of growing the block height. Existing `.mdx` files with no
`rowSpan='auto'` literal: zero visual diff.

## e2e_smoke

- flow: load `/notes/sample-blocks` → verify markdown blocks render
  at integer rowSpan=1 with `overflow-y: auto` chrome; long markdown
  content shows a scrollbar inside the block.
  target_url: /notes/sample-blocks
  playwright_spec: existing `sample-blocks-markdown-blocks-behavior.spec.ts` coverage
  assertions:
    - Markdown blocks have `overflow-y: auto` computed style
    - No `rowSpan='auto'` literal in serialized .mdx after editor save
    - Block height = rowSpan integer × (row-h + gap) (no auto-grow)

## Acceptance

executor: orchestrator-self (no codex needed — surgical type narrow + delete-dead-code)
reviewer: CI gates (lint + typecheck + test + build + size-check + lychee)
contract_changes:
  - `BlockGridPosition.rowSpan: number | 'auto'` → `number`
  - `markdownCore.propsSchema.rowSpan`: integer only
  - `mdx-bridge` serialize emits rowSpan attr for prose only when ≠ 1
  - `mdx-bridge` parse defaults missing prose rowSpan to 1 (was 'auto')
  - Legacy `rowSpan='auto'` literal in attrs/.mdx normalized to 1 on first read
  - `useAutoRowSpan` + `computeRowSpan` + `GridPlacementOptions` removed from public surface
new_adr: NONE — ADR-0020 D1 already locks the discrete-integer contract; this PR implements it
risk_class: D2 row 1 (cross-module contract narrow) + D2 row 4 effect (ADR-0020 D1 enforcement). The change is type-level + behavior preserves byte-equivalent round-trip for new files; PRE-COMMIT CLAUDE REVIEW skipped per bootstrap-scope rule.

## Out of scope

- Editor drag-resize controls to grow markdown blocks → Phase 2B (PR #125)
- Replacing `applyDropMode` with grid-engine ops → Phase 2B
- Wiring `@skb/grid-themes` into the editor → Phase 2C (PR #126)
- Theme-driven slot size (60/80/100px) → Phase 2C
- Deleting `/grid-prototype` + ADR-0017 amendment → Phase 3 (PR #127)
- Fixture .mdx migration sweep (no fixture currently uses `rowSpan='auto'` literal; the cf-25 unwrap pass already keeps `<Markdown>` wrappers out of bare-prose files)

## Honest scope

24 files modified + 2 files deleted, ~+205 / -350 net LOC. Largest
single delta is the use-auto-row-span.ts (118 LOC) + its test (290
LOC) deletion. Type surface is strictly narrower; behavior of fresh
files unchanged; legacy `rowSpan='auto'` attrs migrate one-time to 1.

## Process

1. ✓ User design-doc §5 already locked: parse-time `'auto'` → 1
   normalization + fixed slot heights with overflow scroll
2. ✓ Scope map across 4 packages + apps/site + playwright
3. ✓ Layer-by-layer migration (block-foundation → block-markdown →
   mdx-bridge → editor-shell → apps/site → grid.css)
4. ✓ 29 + 14 + 111 + 315 + 78 tests pass; full `pnpm check` 46/46
5. **THIS PR** — commit + CI gate

## Byte-equivalent round-trip preservation

- Fresh file with bare prose `# hello` → parse → Markdown wrapper
  (rowSpan=1) → serialize → unwrap-on-default detects rowSpan=1 as
  prose default + col=1 + colSpan=12 → emits bare prose → identical bytes ✓
- User resizes markdown to rowSpan=3 → serialize emits
  `<Markdown col={1} colSpan={12} rowSpan={3}>...</Markdown>` →
  wrapper preserved → next parse reads rowSpan=3 → identical bytes ✓
- Legacy file with `<Markdown rowSpan="auto">...</Markdown>` →
  one-time normalize to rowSpan=1 → first serialize unwraps to bare
  prose → bytes change once, stable thereafter (intentional per
  design-doc §5)
