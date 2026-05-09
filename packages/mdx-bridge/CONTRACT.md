# @skb/mdx-bridge Contract

Bidirectional conversion between MDX source and a Tiptap-shaped JSON document.
Wave 1 covers prose; Wave 3 Stage B extends the walker for component blocks.

## Public surface

- `mdxToTiptap(source: string, options?: MdxBridgeOptions): TiptapDoc` — parse MDX into a Tiptap-shaped tree
- `tiptapToMdx(doc: TiptapDoc, options?: MdxBridgeOptions): string` — serialize the Tiptap-shaped tree back to MDX
- `MdxBridgeOptions { blockRegistry?: BlockRegistry; softParse?: boolean }` — per-call component block registry injection; `softParse=true` swaps a per-block parse failure for an `[unsupported block <X>: ...]` placeholder paragraph (Wave 6 hotfix). JSX expression-form attrs (`<X foo={1}>`, `<Y bar={[{...}]}>`) reach per-block `parse*` functions through `evalAttrExpression` from `@skb/block-foundation` (Wave 6 carry-forward #16, 2026-05-08); see `block-foundation/CONTRACT.md` for the supported expression node types.
- `registerJsxDispatch(entry: JsxDispatchEntry): void` / `getJsxDispatch(mdxComponent: string): JsxDispatchEntry | undefined` — mdx-bridge-local JSX dispatch table
- `TiptapDoc`, `TiptapNode`, `TiptapMark`, `JsxDispatchEntry` — shape types

`TiptapDoc.frontmatter` is the raw YAML body (without the `---` fences). Block
nodes carry an internal `_mdast` field holding the originating mdast node — this
is what makes byte-equivalent round-trip possible. Editor-only flows that
construct nodes without parsing source can omit `_mdast`; the serializer falls
back to canonical reconstruction.

## Round-trip invariant

Two byte-equivalence claims, both enforced on every fixture in
`src/__tests__/fixtures/`:

1. **Parsed-doc invariant** — for any supported MDX input `S`:

   ```
   tiptapToMdx(mdxToTiptap(S)).trim() === S.trim()
   ```

2. **Editor-built-doc invariant (canonical reconstruction)** — strip every
   `_mdast` field from a parsed doc to simulate a doc that never went through
   `parse()` (e.g. constructed by Track F's `agent-tools insert_block` /
   `edit_block` or by an editor mutation). The same equivalence must hold:
   ```
   tiptapToMdx(stripMdast(mdxToTiptap(S))).trim() === S.trim()
   ```

Violating either is a **critical bug**: `mdx-doctor` runs both checks on every
PR that touches this package or any `block-*` package. Either failure blocks
merge.

Stage B closed (post-B8 final: 9 prose + 8 component fixtures = 17 fixtures
× 2 invariants = 34 RTT assertions):

| Fixture                        | Coverage                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01-paragraph.mdx`             | frontmatter + paragraph + plain text                                                                                                                                     |
| `02-heading.mdx`               | h1 / h2 + paragraph                                                                                                                                                      |
| `03-list.mdx`                  | bullet list with nested list (loose-spread item) + ordered list                                                                                                          |
| `04-quote-and-code.mdx`        | blockquote + fenced code (with lang)                                                                                                                                     |
| `05-emphasis-link.mdx`         | inline strong / emphasis / inline code / link                                                                                                                            |
| `06-nested-inline.mdx`         | nested inline marks (multi-child strong/emphasis/link)                                                                                                                   |
| `07-link-with-title.mdx`       | link with title attribute (e.g. `[x](url "title")`)                                                                                                                      |
| `08-bold-with-break.mdx`       | hard break (`\\\n`) inside a strong span                                                                                                                                 |
| `09-link-title-comparator.mdx` | same-href links with distinct titles separated by text in a paragraph (adjacent-shape coverage lives in dedicated `marksEqual` regression tests in `round-trip.test.ts`) |
| `22-callout.mdx`               | first component block — `<Callout variant title>` exercising real `parseCallout` / `serializeCallout` from `@skb/block-callout/core` via the B1 dispatch table          |

Wave 3+ rule: every new component block (callout, math, pdf, jupyter, etc.)
must add at least one fixture exercising its MDX form, and that fixture must
satisfy both invariants, before its block PR can merge. `mdx-doctor` enforces.
Grid context attrs (Wave 5; see `## Grid context attrs (Wave 5)` below) use
the same invariants: explicit attrs round-trip byte-equivalently, while the
ADR-0016 D7 end-state lock now hard-throws on missing required grid attrs for
non-prose component blocks per Wave 5 plan v1.1 row C.2-3.5 (R14 amendment
2026-05-05).

## Implementation notes

- Parser pipeline: `unified` + `remark-parse` + `remark-frontmatter` (yaml only)
  - `remark-mdx`. Stay on this pipeline — it is the single source of truth for
    what counts as supported MDX.
- Serializer pipeline: `unified` + `remark-frontmatter` + `remark-mdx` +
  `remark-stringify` with options chosen so that `parse → stringify` is
  idempotent for canonical markdown.
- Block-level Tiptap nodes preserve the originating mdast node on `_mdast` for
  byte-exact passthrough. The serializer **also** runs the canonical
  reconstruction path on the same input via the editor-built-doc invariant
  test, so `_mdast` is a fast-path optimization, not a correctness
  requirement.
- **Inline marks live on each text leaf in outermost-first order.** Tiptap's
  native model — never a wrapper node containing multiple text children. For
  `**bold *and* italic**`, parse emits three text leaves with marks
  `[bold]`, `[bold, italic]`, `[bold]`. The serializer reconstructs nesting
  by greedily grouping adjacent leaves that share the same outermost mark
  and recursing on the group with that mark stripped. This avoids both the
  silent-content-loss class of bug (a wrapper node the serializer doesn't
  recognize) and the over-emit class (one wrapper per leaf →
  `**bold ****and****  italic**`).
- **List looseness** is preserved via `attrs.spread` on both the list and
  each list item, mirroring mdast's `spread` boolean. Without this, the
  blank line in `- item\n\n  - nested` collapses on canonical
  reconstruction.
- **Hard break inside a mark stays inside the mark.** The inline grouper
  treats `hardBreak` as transparent: a run of text leaves sharing the same
  outermost mark may include a `hardBreak` between them, so
  `**a\\\nb**` round-trips as `**a\\\nb**`, not as
  `**a**\\\n**b**`.
- **Link `title`** is preserved on the link mark's `attrs.title` (in
  addition to `attrs.href`). The serializer emits a non-null `title` only
  when the mark carries one — bare links continue to emit `title: null`,
  matching mdast canonical form.
- **`marksEqual` compares link `href` AND `title` verbatim.** Two `link`
  marks with the same href but different titles are treated as DISTINCT —
  the grouper will not merge them under one wrapper. Without the title
  comparison, `[a](url "A")[b](url "B")` would canonicalize to
  `[ab](url "A")` (title B silently dropped + leaves merged); with it,
  both shapes round-trip distinctly. Same-href same-title pairs do still
  merge under one wrapper, identical to the documented adjacent-same-mark
  over-bridge case for `**a****b**` → `**ab**` (Wave 1 acceptable
  canonicalization, Wave 2 trip-hazard catalogued).

### Fail-loud rule

Every default branch in parse.ts and serialize.ts MUST throw with a message
of the form `mdx-bridge: unsupported {block,inline,mark} type "<type>". Add
a fixture and a parse + serialize case before introducing this <kind>.`

Silent fallbacks (returning empty text, dropping siblings, defaulting to a
paragraph stub) are forbidden — they produced two production-class bugs in
earlier review rounds: an `_inlineGroup` wrapper whose siblings vanished,
and a default `wrapMark` branch that dropped the second-onwards leaves of
any unknown mark. The fail-loud rule converts "I forgot to wire up
strikethrough" from "your content disappears" to "your build breaks
loudly." The `mdx-doctor` audit (Wave 2+) and a planned
structure-auditor pass (Erratum 15 candidate) enforce this rule across
the package.

There are seven logical fail-loud points in Wave 3 post-B1 (consolidated to
5 physical `throw new Error` statements in `parse.ts` + `serialize.ts` via
shared `unsupportedBlock` / `unsupportedInline` / `unsupportedMark` helpers
+ 1 in `dispatch-table.ts` = 6 physical statements; `grep -cE "throw new Error"
packages/mdx-bridge/src/*.ts` returns 6):

- `parse.ts mdastBlockToTiptap` default → calls `unsupportedBlock(type)`
- `parse.ts mdastBlockToTiptap` `mdxJsxFlowElement` unknown-name (registry-absent
  OR registry-present-no-match) → calls `unsupportedBlock(type)` (shared helper)
- `parse.ts mdastInlineToTiptap` default
- `serialize.ts tiptapToMdastBlock` default → calls `unsupportedBlock(type)`
- `serialize.ts tiptapToMdastBlock` unknown-component-type → calls
  `unsupportedBlock(type)` (shared helper)
- `serialize.ts wrapMark` default
- `serialize.ts leafInlineToMdast` when `_mdast` is missing

Regression tests assert these in `src/__tests__/round-trip.test.ts` and
`src/__tests__/jsx-routing.test.ts`.

## Component block dispatch (Wave 3+)

Component block routing is per-call state, not global state. Callers pass
`options.blockRegistry` to `mdxToTiptap` / `tiptapToMdx`; mdx-bridge must not
grow a global `setBlockRegistry` setter. This keeps parallel parse/serialize
calls isolated even when they use different `BlockRegistry` instances.

`@skb/block-foundation` owns `BlockCoreDefinition` and `BlockRegistry`, but it
does not own MDX parse/serialize hooks. mdx-bridge owns a small external
dispatch table in `src/dispatch-table.ts`, keyed by the PascalCase
`BlockCoreDefinition.mdxComponent` string. Block packages register their MDX
bridge by convention:

- `mdxComponent: 'Callout'`
- `blockType: 'callout'`
- `parse` function named `parseCallout`
- `serialize` function named `serializeCallout`

The parse path receives an `mdxJsxFlowElement`, finds the core whose
`mdxComponent` matches `node.name`, then calls the registered parse function.
The serialize path receives a component-typed Tiptap node, finds the core by
`node.type`, then calls the registered serialize function. Nested component
blocks round-trip through the same per-block parse/serialize functions; no
hidden mdx-bridge registry state is involved.

Fail-loud behavior remains mandatory. With no `options.blockRegistry`, JSX
blocks fall through to the historical unsupported `mdxJsxFlowElement` branch.
With a registry present but no matching `mdxComponent`, parse throws
`unsupported block type "{ComponentName}"`. With a registry present but an
unknown component-typed Tiptap node, serialize throws
`unsupported block type "{typeName}"`.

Per [ADR-0008](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) D1
(dead-dep policy = tighten), the `@skb/block-foundation` workspace dependency,
`tsconfig.json#references` edge, and source import must stay in three-way
symmetry.

## Grid context attrs (Wave 5)

Component blocks carry grid context attrs `{col, row?, colSpan, rowSpan}` per
ADR-0016 D2 (single schema authority). W5-1 is the authoritative
grid-dimension invariant per ADR-0016 D9; see
[block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md) `## Invariants`
(W5-1 lands there in Wave 5 Stage C.2-2 per ADR-0016 §502 Sister-document
sync). mdx-bridge owns only the MDX serialize boundary for these attrs.

ADR-0016 D7 serializes grid attrs as MDX expression attrs in canonical order:
`col`, optional `row`, `colSpan`, then non-prose `rowSpan`; block-specific attrs
follow.

```mdx
<Canvas col={7} row={2} colSpan={6} rowSpan={6} title="Neuron map" />
<Code col={1} colSpan={6} rowSpan={4} language="python" code="print(1)" />
<Image col={7} colSpan={6} rowSpan={3} src="cat.png" alt="A cat" />
```

Parse validates `col` in `[1,12]`, `colSpan` in `COL_SNAPS = [2,3,4,6,8,12]`,
`col + colSpan - 1 <= 12`, optional `row >= 1`, and `rowSpan >= 1` for
non-prose blocks. Prose-shaped `Markdown` uses `rowSpan='auto'`, and serialize
omits `rowSpan` for it per ADR-0016 D3.

ADR-0016 D7 end-state lock (post Wave 5 plan v1.1 row C.2-3.5; R14 amendment
2026-05-05): parse hard-throws on missing required grid attrs (`col` and
`colSpan` for non-prose blocks; `rowSpan` for non-prose blocks). Markdown
`rowSpan='auto'` continues to derive-not-emit per ADR-0016 D3. The C.2-1-era
transitional marker has been removed; both parse-emission and serialize-gating
paths are gone.

Pinned hard-throw errors:

```text
mdx-bridge: required grid attrs col + colSpan missing on block "{type}"; per ADR-0016 D7 end-state invariant (Wave 5 plan v1.1 row C.2-3.5; R14 amendment 2026-05-05).
mdx-bridge: required grid attr rowSpan missing on block "{type}"; per ADR-0016 D7 end-state invariant (Wave 5 plan v1.1 row C.2-3.5; R14 amendment 2026-05-05).
```

The v0.1 prose discriminator is `mdxComponent === 'Markdown'`. C.2-2 lands
`BlockUIDefinition.gridKind`, `rowSpanSemantic`, and `proseGridDefaults`; this
path must switch to that schema-owned discriminator without importing
block-foundation UI types here.

## Canonicalization rules

- **List bullets**: input `-` / `+` bullets canonicalize to `*` output through
  the serializer's `remark-stringify` options. The existing `03-list.mdx`
  fixture records the canonical `*` form.
- **Adjacent same-mark merging**: equivalent adjacent marks merge during
  canonical reconstruction, e.g. `**a****b**` emits as `**ab**`. See the
  inline-grouper notes above and the inline-prose fixtures
  `05-emphasis-link.mdx` / `06-nested-inline.mdx`.
- **Stripped `_mdast` invariant**: canonical reconstruction after dropping
  `_mdast` must still satisfy byte-equivalent fixture output. See
  `## Round-trip invariant`, especially invariant 2.

## Modifying this file / package

- **Adding a new node type** (block or inline): write a fixture first, watch it
  fail, add the parse + serialize branches, watch it pass. No ADR required.
- **Changing `TiptapDoc` / `TiptapNode` shape**: this is a contract break and
  requires an ADR plus synchronized updates in `editor-commands`,
  `editor-shell`, and any block package consuming the shape.
- **Loosening the round-trip invariant**: not allowed without an ADR. The
  invariant is the load-bearing reason `mdx-doctor` exists.
- **Major upgrade of `unified` / `remark-*` / `mdast` types**: a major-version
  bump can change canonical stringification and break byte-equivalence on
  existing fixtures. Treat as a contract-touching change — requires an ADR
  and a re-baseline run on every fixture. Patch / minor bumps proceed
  through the normal `mdx-doctor` PR check.

## Related

- [Spec §1.4 (file structure) / §2.5 (block model)](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md)
- [agent-contract.md `mdx-doctor` / `mdx-bridge-eng`](../../agent-contract.md)
