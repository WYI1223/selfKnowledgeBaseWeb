# PR.md — Wave 6 carry-forward #16 — JSX-attr expression coercion (6 blocks)

> Per ADR-0011 D2 schema. Linked from `docs/plans/active.md`.

## Title

`Wave 6 cf-16 — JSX-attr expression coercion: Pdf / Jupyter / NnViz / AgentFlow / Code / Image + shared estree-walker helper`

## Scope expansion vs. handoff-pack roster

Original Stage B handoff pack listed 4 blocks (Pdf / Jupyter / NnViz / AgentFlow). Local Playwright reproduction against the production sample-blocks fixture surfaced 2 more (Code's `code={\` template literal \`}` and Image's `width={320}` / `height={180}` numeric expressions) — same defect class. Bundled into this PR rather than spinning cf-16b/c per the user-visible regression: the editor end-state we ship needs all 6, and the shared helper amortizes across all 6 with the same risk profile.

## Why

`/notes/sample-blocks/edit` currently shows 4 blocks as
`[unsupported block <Pdf>: page attribute must be a finite number, got
{"type":"mdxJsxAttributeValueExpression",...}]` placeholder paragraphs.
Same story for `<Jupyter>`, `<NnViz>`, `<AgentFlow>`. The Wave 6 hotfix's
per-block softParse fault tolerance preserves the editor mount but the
content layer still degrades — these are the 4 blocks the user sees as
broken on the production sample-blocks fixture.

Root cause: each block's `parse*` function expects
`attr.value: string | null`, but the production fixture uses JSX expression
form (`page={1}`, `code={` template `}`, `layers={[{...}]}`, `nodes={[...]}`).
mdast emits these as `{ type: 'mdxJsxAttributeValueExpression', value: '<source>',
data: { estree: <Program> } }`, not as a string. The Wave 2 stub authors
deferred this to "Wave 3 expression-attr upgrade" but that upgrade never
shipped — the comment is stale.

## What

1. **Add shared helper `evalAttrExpression`** in `@skb/block-foundation` that
   walks the estree AST carried on every `mdxJsxAttributeValueExpression`
   and returns the static JS value. Supported expression node types:
   `Literal` / `TemplateLiteral` (no interpolations) / `ArrayExpression` /
   `ObjectExpression` / unary `+`/`-` on numeric literal / identifier
   `undefined` / `NaN` / `Infinity`. Anything else (Identifier, CallExpression,
   BinaryExpression, etc.) throws — the editor cannot statically evaluate
   dynamic expressions.

2. **Update 6 block parse paths** to consume `evalAttrExpression(attr.value)`:
   - `block-pdf` — `page={1}` → number; `searchable={true}` → boolean (in addition to string-form `"true"` and shorthand)
   - `block-jupyter` — `code={` template `}` → string; `libraries={["x","y"]}` → string[]; `runOnLoad={true}` / `showLineNumbers={true}` → boolean
   - `block-nn-viz` — `layers={[{name, units, activation}, ...]}` → LayerSpec[]; `showWeights={true}` → boolean
   - `block-agent-flow` — `nodes={[{id, label, type, position:{x,y}}]}` → AgentFlowNode[]; `edges={[{id, source, target, label?}]}` → AgentFlowEdge[]; `interactive={true}` → boolean
   - `block-code` — `code={` template literal `}` → string; `showLineNumbers={true}` → boolean (added post-discovery from sample-blocks repro)
   - `block-image` — `width={320}` → number; `height={180}` → number (added post-discovery)

3. **Update each block's `*MdastJsxElement` value type** from
   `string | null` (or `string`) to `MdastJsxAttributeValue` (the new
   shared union from block-foundation). The narrow type was a Wave 2 stub
   lie; mdast actually delivers expression form when the fixture uses
   `{...}`.

4. **Add per-block parse tests** for the expression form using fixtures
   that mirror the production sample-blocks corpus (6 blocks ×
   1-3 fixtures each).

5. **Update sample-blocks Playwright spec** to assert there are no
   `[unsupported block <` placeholder paragraphs in the editor — this
   becomes the user-visible end-state regression lock.

6. **Sister docs**: `block-foundation/CONTRACT.md` adds the new export;
   each block CONTRACT.md updates the `expression-attr` mention from
   "deferred to Wave 3" to "live post-#16".

## Files

| File | Change |
|---|---|
| `packages/block-foundation/src/eval-attr-expression.ts` | **NEW** — estree walker + `evalAttrExpression` + `MdastJsxAttributeValue` union |
| `packages/block-foundation/src/index.ts` | export the new helper + type |
| `packages/block-foundation/src/__tests__/eval-attr-expression.test.ts` | **NEW** — covers Literal / TemplateLiteral / ArrayExpression / ObjectExpression / nested / unary / unsupported |
| `packages/block-pdf/src/core/parse.ts` | adopt `evalAttrExpression`; accept expression-form `page={N}` and `searchable={true}` |
| `packages/block-pdf/src/core/serialize.ts` | widen `value` type to `MdastJsxAttributeValue` |
| `packages/block-pdf/src/__tests__/core.test.ts` | add expression-form fixtures |
| `packages/block-jupyter/src/core/parse.ts` | adopt helper; template-literal `code`, array-literal `libraries`, expression `runOnLoad` / `showLineNumbers` |
| `packages/block-jupyter/src/core/serialize.ts` | widen `value` type |
| `packages/block-jupyter/src/__tests__/core.test.ts` | add expression-form fixtures (mirrors production sample-blocks Jupyter fixture) |
| `packages/block-nn-viz/src/core/parse.ts` | adopt helper; array-of-objects `layers` |
| `packages/block-nn-viz/src/core/serialize.ts` | widen `value` type |
| `packages/block-nn-viz/src/__tests__/core.test.ts` | add expression-form fixtures |
| `packages/block-agent-flow/src/core/parse.ts` | adopt helper; nested object-arrays `nodes` / `edges` |
| `packages/block-agent-flow/src/core/serialize.ts` | widen `value` type |
| `packages/block-agent-flow/src/__tests__/core.test.ts` | add expression-form fixtures |
| `packages/block-code/src/core/parse.ts` | adopt helper; template-literal `code` |
| `packages/block-code/src/core/serialize.ts` | widen `value` type |
| `packages/block-code/src/__tests__/core.test.ts` | add expression-form fixtures |
| `packages/block-image/src/core/parse.ts` | adopt helper; numeric `width` / `height` expressions |
| `packages/block-image/src/core/serialize.ts` | widen `value` type |
| `packages/block-image/src/__tests__/core.test.ts` | add expression-form fixtures |
| `apps/site/playwright/sample-blocks-edit-loads.spec.ts` | assert no `[unsupported block <` placeholders |
| `packages/block-foundation/CONTRACT.md` | document `evalAttrExpression` export |
| `packages/block-pdf/CONTRACT.md` | mark expression-form `page` / `searchable` live |
| `packages/block-jupyter/CONTRACT.md` | mark expression-form `code` / `libraries` / booleans live |
| `packages/block-nn-viz/CONTRACT.md` | mark expression-form `layers` / `showWeights` live |
| `packages/block-agent-flow/CONTRACT.md` | mark expression-form `nodes` / `edges` / `interactive` live |
| `packages/block-code/CONTRACT.md` | mark expression-form `code` template literal live |
| `packages/block-image/CONTRACT.md` | mark expression-form `width` / `height` live |
| `packages/mdx-bridge/CONTRACT.md` | brief cross-ref to block-foundation helper |
| `packages/block-foundation/package.json` + 6 block `package.json` | add `unified` / `remark-parse` / `remark-mdx` (+ `@types/estree` / `@types/mdast` on block-foundation) as devDeps so test fixtures can round-trip through the real mdast parser |

Total scope: ~30 files (1 new helper + 1 helper test + 6 parse fixes + 6 serialize type widenings + 6 block tests + 1 Playwright spec + 8 CONTRACT/PR docs + 7 package.json devDep additions).

## Decisions

**D1 — helper home**: `@skb/block-foundation`. block-foundation is the
shared dep all 4 blocks already pull in; mdx-bridge → block-foundation
edge is also pre-existing. Putting the helper in mdx-bridge would force
each block to take a new dep on mdx-bridge (creating a cycle: mdx-bridge
already imports block-foundation transitively via the `BlockRegistry`
type).

**D2 — estree walker not source-text JSON.parse**: The production fixture
`<NnViz layers={[{name:"input", units:784, activation:"linear"}]} />` is
JS literal, not JSON — keys are unquoted. JSON.parse fails. JSON5 fails
on template literals (backtick form). Walking the estree handles every
form mdast actually emits, with no extra runtime dependency
(`@types/estree` types-only import; estree AST is already attached to
every `mdxJsxAttributeValueExpression` by `remark-mdx`).

**D3 — fail-loud on unsupported expression nodes**: `Identifier` (other
than `undefined` / `NaN` / `Infinity`), `CallExpression`,
`BinaryExpression`, etc. throw. The editor cannot statically evaluate
dynamic expressions; a placeholder via mdx-bridge softParse is the
correct degradation path.

**D4 — keep existing string-form paths**: Each block still accepts
string-form values (`searchable="true"`, `page="2"`, JSON-stringified
`libraries`). The new expression-form path is additive. Round-trip
serialize continues to emit string form per existing invariants — no
serialize changes (only type widening on the parser-side input type).

## Test plan

- [x] `pnpm --filter @skb/block-foundation test` — new `eval-attr-expression.test.ts` green (52/52)
- [x] `pnpm --filter @skb/block-pdf test` — new expression-form fixtures green (36/36)
- [x] `pnpm --filter @skb/block-jupyter test` — new expression-form fixtures green incl. template literal `code` (46/46)
- [x] `pnpm --filter @skb/block-nn-viz test` — new expression-form fixtures green (65/65)
- [x] `pnpm --filter @skb/block-agent-flow test` — new expression-form fixtures green (59/59)
- [x] `pnpm --filter @skb/block-code test` — new expression-form fixtures green (21/21)
- [x] `pnpm --filter @skb/block-image test` — new expression-form fixtures green (21/21)
- [x] `pnpm --filter @skb/site test:e2e -- sample-blocks-edit-loads` — Playwright PASS (0 `[unsupported block <` placeholders; 1/1 in 20.7s)
- [x] `pnpm check` — exit 0 (41/41 tasks)

## Acceptance

1. `evalAttrExpression` walks Literal / TemplateLiteral (no interpolations) / ArrayExpression / ObjectExpression / unary `±` numeric / `undefined`/`NaN`/`Infinity` identifier; throws on dynamic forms with a message naming the node type
2. block-foundation `index.ts` re-exports `evalAttrExpression` + `MdastJsxAttributeValue`
3. block-foundation CONTRACT.md documents the new export under "Public surface"
4. each of pdf / jupyter / nn-viz / agent-flow / code / image `parse*` calls `evalAttrExpression(attr.value)` and validates the returned shape
5. each block's `*MdastJsxElement` value-field type widens to `MdastJsxAttributeValue`
6. each block's `__tests__/core.test.ts` includes at least one expression-form fixture exercising the shape used in `content/notes/sample-blocks/index.mdx`
7. each block CONTRACT.md updates the "expression-attr" mention from "Wave 3 deferred" to "live post-cf-16"
8. mdx-bridge CONTRACT.md briefly cross-references the block-foundation helper
9. sample-blocks Playwright spec asserts `editor.locator('text=/\\[unsupported block </').count()` is 0
10. heavy-block-boundary SSR skeletons render for Jupyter / NnViz / AgentFlow rather than placeholder paragraphs (visual proof in the Playwright screenshot)
11. `pnpm check` exit 0
12. ADR-0006 9-point sweep clean
