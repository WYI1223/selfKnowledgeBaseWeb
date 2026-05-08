# Wave 6 carry-forward #15b — Rename block-Code Tiptap node out of `code` namespace + re-enable inline-code mark

> Wave 6 Stage B post-close carry-forward (handoff pack §"Post-close
> carry-forwards"). Closes the deferred half of #15: rename
> `codeCore.name` from `'code'` to `'componentCode'` so the
> ProseMirror node/mark namespace collision with StarterKit's
> inline `code` MARK is gone. Re-enable StarterKit's inline `code`
> mark in `EditorShell.tsx` and empty out
> `EDITOR_UNSUPPORTED_MARKS` (was `['code']` after #15a removed
> `'link'`). Inline backtick formatting in markdown now renders as
> real `<code>` elements in the edit surface and round-trips
> losslessly through save.

## title

Rename block-Code internal BlockKind identifier from `'code'` to
`'componentCode'` across `packages/block-code/src/core/{core-definition,parse,serialize}.ts`,
`packages/editor-shell/src/registry-wire.tsx`
(`BlockAffordanceKind` union + `BLOCK_KIND_OPTIONS` + `jsxDispatches`
tuple + `defaultBlockAttrs` Record key), and 6 test files asserting
the BlockKind literal. `packages/block-code/CONTRACT.md` § Public
surface and `packages/editor-shell/CONTRACT.md` § Public surface
both updated to document the new name + rationale. Re-enable
StarterKit's inline `code` mark in `EditorShell.tsx` (was
`.configure({ code: false })`); empty out
`EDITOR_UNSUPPORTED_MARKS` in `saveLoad.ts`. New vitest case proves
inline backtick text round-trips through `loadFromMdx → saveToMdx`
losslessly. Strengthen `apps/site/playwright/sample-blocks-edit-loads.spec.ts`
to assert `editor.locator('code').first()` is visible (proves
inline-code mark renders as a real anchor in the live edit surface).

## files

18 source files (~150 LOC; mostly mechanical literal swap):

1. `packages/block-code/src/core/core-definition.ts` — **MODIFY**
   (~10 LOC). `codeCore.name: 'code'` → `'componentCode'` + JSDoc
   comment recording the rename rationale. `mdxComponent: 'Code'`
   stays (the MDX tag is unchanged); `kind: 'component'` stays.

2. `packages/block-code/src/core/parse.ts` — **MODIFY** (~1 LOC).
   `parseCode` return `type: 'code'` → `'componentCode'`.

3. `packages/block-code/src/core/serialize.ts` — **MODIFY** (~5
   LOC). `CodeTiptapNode.type` literal `'code'` → `'componentCode'`
   + JSDoc rewrite from "Wave 2 阶段仅暴露稳定签名" stub-era prose
   to current Wave 6 routing semantics + carry-forward #15b note.

4. `packages/block-code/src/__tests__/core.test.ts` — **MODIFY**
   (~1 LOC). `expect(codeCore.name).toBe('code')` → `'componentCode'`.

5. `packages/block-code/src/__tests__/registry-integration.test.ts` —
   **MODIFY** (~1 LOC). `reg.getCore('code')` → `'componentCode'`.

6. `packages/block-code/src/__tests__/ui-default.test.tsx` —
   **MODIFY** (~3 LOC). `codeUiDefault.coreName` assertion +
   2 `reg.getUI('code')` calls all updated to `'componentCode'`.
   The HTML `querySelector('code')` calls (lines 94/128 testing
   the rendered `<code>` element) stay — those are HTML element
   selectors, not BlockKind IDs.

7. `packages/block-code/CONTRACT.md` — **MODIFY** (~10 LOC).
   § Public surface `codeCore.name` declared = `'componentCode'`;
   § Invariants `coreName='componentCode'` (camelCase post-#15b;
   sibling block kinds retain kebab-case naming — documented as
   intentional asymmetry) + carry-forward #15b cross-reference.

8. `packages/editor-shell/src/registry-wire.tsx` — **MODIFY** (~5
   LOC across 4 sites). `BlockAffordanceKind` union literal
   `'code'` → `'componentCode'`; `BLOCK_KIND_OPTIONS` `kind: 'code'`
   tuple → `'componentCode'`; `jsxDispatches` 2nd-element string
   tuple `'code'` → `'componentCode'`; `defaultBlockAttrs` Record
   key `code:` → `componentCode:`. The `label: 'Code'` and
   `mdxComponent: 'Code'` user-facing strings stay.

9. `packages/editor-shell/src/EditorShell.tsx` — **MODIFY** (~5
   LOC). `StarterKit.configure({ code: false })` → `StarterKit`
   (no configure call needed; inline `code` mark enabled by
   default). Comment block updated to record the rename closure
   + remove the "pending #15b" stale forward-ref.

10. `packages/editor-shell/src/saveLoad.ts` — **MODIFY** (~10 LOC
    comment + 1 LOC code). `EDITOR_UNSUPPORTED_MARKS` set narrowed
    from `Set(['code'])` to `Set()` (empty). The set is preserved
    as a forward-compat hook for any future
    mdx-bridge-mark-emits-ahead-of-editor-schema-registration
    scenario. Comment block records both #15a (link) and #15b
    (code) closures.

11. `packages/editor-shell/src/__tests__/saveLoad.test.ts` —
    **MODIFY** (~25 LOC). `makeEditorWithLink` helper updated to
    use `StarterKit` (no `.configure({ code: false })`) so the
    test fixture mirrors the live editor schema. NEW test case
    "round-trips inline backticks" asserts that
    `'use \`pnpm --filter @skb/site test\` here.\n'` round-trips
    through `loadFromMdx → saveToMdx` with backticks intact.

12. `packages/editor-shell/src/__tests__/affordances.test.ts` —
    **MODIFY** (~2 LOC). 2 `expect(onInsert).toHaveBeenCalledWith('code')`
    → `'componentCode'`. The `getByRole('button', { name: 'Code' })`
    DOM query stays (label is unchanged).

13. `packages/editor-shell/src/__tests__/registerBlocks.test.ts` —
    **MODIFY** (~3 LOC). `EXPECTED_NAMES` array literal
    `'code'` → `'componentCode'`; `byKind.component` sort assertion
    `['callout', 'code', 'image']` → `['callout', 'componentCode', 'image']`.

14. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~10 LOC).
    § Public surface `EditorShell` extension stack — `StarterKit`
    no longer `code: false`; comment records #15b closure. Stage A
    composition note (line 503) — same update.

15. `packages/mdx-bridge/src/__tests__/round-trip.test.ts` —
    **MODIFY** (~1 LOC). `blockType: 'code'` →
    `blockType: 'componentCode'` in the dispatch fixture for
    `<Code>` MDX components.

16. `apps/site/src/__tests__/e2e/c4-2-block-registry.spec.ts` —
    **MODIFY** (~1 LOC). `registeredBlocks` tuple
    `['code', 'codeCore', 'codeUiDefault']` →
    `['componentCode', 'codeCore', 'codeUiDefault']`.

17. `apps/site/playwright/sample-blocks-edit-loads.spec.ts` —
    **MODIFY** (~10 LOC). Add a NEW assertion
    `editor.locator('code').first()` is visible — proves
    StarterKit's inline `code` mark renders as a real `<code>`
    element on the live edit surface (sample-blocks intro
    contains many backticked terms like `mdx-bridge` /
    `apps/site` / `@skb/heavy-block-boundary`).

18. `docs/plans/wave-6-main/wave-6-cf-15b-block-code-rename.md` —
    **NEW** (PR.md self).

Plus `docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png`
re-emits with slightly different bytes (the editor now renders
inline `<code>` styling that wasn't there pre-#15b). Counts as a
diff artifact, not a numbered file.

## D2 trigger judgment

Row 1 (CONTRACT.md change in 2 packages: `@skb/block-code` +
`@skb/editor-shell`) + Row 5 (cross-package: 4 packages touched —
block-code + mdx-bridge + editor-shell + apps/site). Per CLAUDE.md
`## Review workflow` + ADR-0011 D1 stage 4, **PRE-COMMIT CLAUDE
REVIEW fires on rows 1+4** — Row 1 hit, so stage 4 triggered.
Row 4 N/A (no NEW ADR or amendment); Row 2 N/A (no NEW deps).

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1
path pattern. The strengthened sample-blocks Playwright spec at
file 17 satisfies the D9.2 e2e_smoke obligation; the regen'd
screenshot satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mount loads via the
    ApiAdapter chain; the editor's prose surface now renders
    inline backticked terms as real `<code>` elements (in
    addition to the markdown-link anchors from #15a) after the
    block-Code Tiptap node rename freed StarterKit's inline
    `code` mark from the ProseMirror namespace collision
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-edit-loads.spec.ts:"sample-blocks edit route loads non-empty content (mdxFlowExpression no longer breaks)"
  screenshot_archive: docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png
  assertions:
    - .ProseMirror editor element is visible within 15s
    - editor textContent length is > 50 within 10s
    - editor contains the stable fixture phrase "Wave 2 close acceptance criterion"
    - editor.locator('a').first() is visible (#15a anchor preservation)
    - editor.locator('code').first() is visible (NEW — #15b inline-code mark restoration)
    - the [data-skb-load-error] banner is NOT present
    - no `loadFromMdx`/`mdx-bridge` page console errors observed

## decision-log

### Decision 1 — Name choice: `componentCode`

`'componentCode'` is descriptive (signals this is the MDX-component
"Code" block, distinct from StarterKit's `codeBlock` markdown-fenced
block and the `code` inline mark) and won't collide with anything
in StarterKit's schema. Alternatives considered:

- `codeBox`: short but ambiguous
- `mdxCode`: redundant since all 8 component blocks are MDX-origin
- `codeBlock`: COLLIDES with StarterKit's existing `codeBlock` node
  (the markdown ``` ```...``` ``` fenced block). Rejected.
- `embedCode`: vague semantic
- `snippet`: too generic

`componentCode` won.

### Decision 2 — Rename the BlockKind ID, not just the Tiptap node name

An alternative path: keep `BlockAffordanceKind = 'code'` everywhere
in the public type union, but give the Tiptap node a different
internal name via a new `BlockKindOption.tiptapNodeName?` override
field. That would have:
- Less test churn (test assertions on `'code'` kind unchanged)
- More architectural complexity (asymmetric — 1 of 8 kinds has a
  different Tiptap name, breaking the 1:1 BlockKind↔Tiptap-node
  mapping)
- Required mdx-bridge to learn the override too (round-trip
  serialize)

The straightforward rename keeps the architecture symmetric (every
BlockKind has its `kind` literal as its Tiptap node name); the
test churn is mostly mechanical find-and-replace and is contained.

### Decision 3 — `'componentCode'` camelCase vs sibling `'nn-viz'` / `'agent-flow'` kebab-case

Sibling BlockKind names are kebab-case (`nn-viz`, `agent-flow`).
`componentCode` is camelCase. The asymmetry is documented in
`packages/block-code/CONTRACT.md` § Invariants. Reasoning: keeping
sibling kinds kebab-case avoids touching their `BlockKindOption`
literals + their CONTRACT.md surface + their respective test
assertions — minimum-surface change. A future Wave could
re-canonicalize all 8 to one convention (kebab or camel), but
that's beyond #15b scope.

### Decision 4 — Empty `EDITOR_UNSUPPORTED_MARKS` set retained as forward-compat hook

The set is now `new Set()` (empty). It could have been deleted
along with `stripUnsupportedMarks`. Keeping the hook costs ~5 LOC
of inert code but provides a labeled forward-compat seam: any
future mdx-bridge mark surface that lands ahead of its editor
schema registration can be added here as a temporary strip
without re-introducing the full sanitizer scaffold.

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts \
  --files packages/block-code/CONTRACT.md \
          packages/block-code/src/__tests__/core.test.ts \
          packages/block-code/src/__tests__/registry-integration.test.ts \
          packages/block-code/src/__tests__/ui-default.test.tsx \
          packages/block-code/src/core/core-definition.ts \
          packages/block-code/src/core/parse.ts \
          packages/block-code/src/core/serialize.ts \
          packages/editor-shell/CONTRACT.md \
          packages/editor-shell/src/EditorShell.tsx \
          packages/editor-shell/src/__tests__/affordances.test.ts \
          packages/editor-shell/src/__tests__/registerBlocks.test.ts \
          packages/editor-shell/src/__tests__/saveLoad.test.ts \
          packages/editor-shell/src/registry-wire.tsx \
          packages/editor-shell/src/saveLoad.ts \
          packages/mdx-bridge/src/__tests__/round-trip.test.ts \
          apps/site/src/__tests__/e2e/c4-2-block-registry.spec.ts \
          apps/site/playwright/sample-blocks-edit-loads.spec.ts \
          docs/plans/wave-6-main/wave-6-cf-15b-block-code-rename.md 2>&1 | tail -1
# Expected: ui_touch=true (packages/editor-shell/src/** matches D9.1)
```

```bash
# AC-2: codeCore.name renamed
grep -cE "name: 'componentCode'" packages/block-code/src/core/core-definition.ts
# Expected: 1
grep -cE "name: 'code'" packages/block-code/src/core/core-definition.ts
# Expected: 0
```

```bash
# AC-3: BlockKind union + BLOCK_KIND_OPTIONS + jsxDispatches all carry new literal
grep -cE "'componentCode'" packages/editor-shell/src/registry-wire.tsx
# Expected: 4 (union + BLOCK_KIND_OPTIONS + jsxDispatches + defaultBlockAttrs)
grep -cE "kind: 'code'" packages/editor-shell/src/registry-wire.tsx
# Expected: 0
```

```bash
# AC-4: StarterKit inline code mark re-enabled
grep -cE "StarterKit\.configure\(\{ code: false \}\)" packages/editor-shell/src/EditorShell.tsx
# Expected: 0
grep -cE "EDITOR_UNSUPPORTED_MARKS:.*Set\(\)" packages/editor-shell/src/saveLoad.ts
# Expected: 1 (empty set)
```

```bash
# AC-5: block-code suite passes (4 files / 19 tests; assertions updated)
pnpm --filter @skb/block-code test 2>&1 | grep -E 'Tests'
# Expected: 19 passed
```

```bash
# AC-6: editor-shell suite passes (8 saveLoad now incl. inline-code roundtrip)
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 132 passed (was 131; +1 inline-code roundtrip)
```

```bash
# AC-7: mdx-bridge suite passes (round-trip test updated)
pnpm --filter @skb/mdx-bridge test 2>&1 | grep -E 'Tests'
# Expected: 98 passed
```

```bash
# AC-8: sample-blocks edit-route Playwright passes (with the new
# inline-code assertion)
pnpm --filter @skb/site exec playwright test playwright/sample-blocks-edit-loads.spec.ts --reporter=line --workers=1 2>&1 | tail -3
# Expected: 1 passed
```

```bash
# AC-9: pnpm check exit 0
pnpm check
```

```bash
# AC-10: full visual suite passes under CI retry budget
pnpm --filter @skb/site exec playwright test --retries=2 2>&1 | tail -3
# Expected: exit 0
```

```bash
# AC-11: scope-fence — exactly 18 source files (excl. screenshot regen)
git diff --name-only main..HEAD -- ':!docs/audits/codex-runs/' ':!docs/audits/screenshots/' | sort | wc -l
# Expected: 18
```

## Out-of-scope

- **#16** — per-block-attr coercion fixes for Jupyter / Pdf /
  NnViz / AgentFlow. 4 sub-PRs (one per block-package). Unchanged
  by #15b — the per-block parse failures are JSX-attr coercion
  bugs, not BlockKind name issues.

## Related

- [Wave 6 cf-15a PR.md](wave-6-cf-15a-link-extension.md) — sister
  carry-forward; closed Link mark sanitizer half
- [Wave 6 hotfix PR.md](wave-6-hotfix-mdx-bridge-flowexpression.md) —
  origin of the `EDITOR_UNSUPPORTED_MARKS` sanitizer that #15b
  empties out
- [Stage B handoff pack](stage-b-handoff-pack.md) §"Post-close
  carry-forwards"
