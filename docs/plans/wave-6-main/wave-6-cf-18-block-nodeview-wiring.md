# PR.md — Wave 6 carry-forward #18 — Block NodeView wiring (8 blocks)

> Per ADR-0011 D2 schema. Linked from `docs/plans/active.md`.

## Title

`Wave 6 cf-18 — wire all 8 component blocks into Tiptap NodeView so the edit surface renders real components instead of "{Label} block" placeholders`

## Why

cf-15a / cf-15b / cf-16 closed the **data layer**: `mdxToTiptap` now produces correct Tiptap nodes (`{type:'pdf', attrs:{src,page,searchable}}` etc.) instead of throwing or surfacing softParse `[unsupported block <X>: ...]` placeholders. But the **render layer** never closed: `packages/editor-shell/src/registry-wire.tsx:88-114`'s `createBlockExtension` only registers a `Node.create` with a `renderHTML` returning `['div', {...}, '${option.label} block']` — a literal string placeholder. There is no `addNodeView` and no bridge to each block's existing `EditorView` React component.

User-visible result on `/notes/sample-blocks/edit`: 14 placeholder divs (`callout×4 / componentCode×1 / image×2 / math×2 / pdf×2 / jupyter×1 / nn-viz×1 / agent-flow×1`) reading "Callout block", "Pdf block", etc. — no real PDF iframe, no React Flow graph, no KaTeX, no syntax-highlighted code body, no image, no callout container.

The previous Wave 6 cf-16 Playwright lock (`assert no [unsupported block <` text) was a **weak assertion** — it passed against the placeholder divs because the placeholders don't contain that error sentinel. cf-18 replaces it with per-kind real-DOM markers.

## What

1. **Add `makeBlockNodeView` factory** in `editor-shell` — `BlockNodeView.tsx` exports `makeBlockNodeView({registry})` returning a `ComponentType<ReactNodeViewProps>`. The component uses `@tiptap/react`'s `NodeViewWrapper`, looks up the block's `BlockUIDefinition` from the closed-over `BlockRegistry` via `registry.getUI(node.type.name)` (identity lookup — see #4), and renders `<UI.EditorView props={node.attrs} />`.

2. **Wire `createBlockExtension`** to take the registry + conditionally install `addNodeView() { return ReactNodeViewRenderer(makeBlockNodeView({registry})); }` only when a registry is present. Each block kind's Tiptap Node now renders the real React component instead of the placeholder string.

3. **Make `wireRegistry` propagate the registry** to `createBlockExtension` (closure capture of the registry passed in `RegistryWireOptions`).

4. **NodeName ↔ coreName identity**: cf-15b renamed `'code'` → `'componentCode'` for the Tiptap node name; the block's `coreName` is also `'componentCode'` (the rename was symmetric across BlockKind and the registered core). Every block now has `nodeName === coreName`, so the bridge calls `registry.getUI(node.type.name)` directly — no `getCore` indirection needed. The kebab-case kinds (`callout`, `image`, `math`, `pdf`, `jupyter`, `nn-viz`, `agent-flow`) and the camelCase one (`componentCode`) all flow through the same identity lookup.

5. **Strengthen the Playwright spec** (`apps/site/playwright/sample-blocks-edit-loads.spec.ts`):
   - assert presence of per-kind real-DOM markers (PDF iframe, image tag, KaTeX `.katex`, AgentFlow `.react-flow`, code body `pre code`)
   - assert one `[data-skb-block-host="<kind>"]` is visible per kind (8 kinds), 14 hosts total (mirrors fixture instance count)
   - assert ZERO `.skb-block-nodeview--unregistered` fallbacks (proves the registry was threaded through)
   - keep the "no `[unsupported block <` text" check from cf-16
   - **note**: `[data-skb-block-kind]` is intentionally retained on the NodeView wrapper so registry-aware Tiptap inspectors / future drag-handle wiring can target the host; the discriminator for "real component vs unregistered fallback" is now the `--unregistered` modifier class

## Files

| File | Change |
|---|---|
| `packages/editor-shell/src/BlockNodeView.tsx` | **NEW** — React bridge factory (NodeViewWrapper + registry lookup + EditorView render) |
| `packages/editor-shell/src/registry-wire.tsx` | Update `createBlockExtension` to accept registry + conditionally add `addNodeView`; thread registry through `wireRegistry` |
| `packages/editor-shell/src/index.ts` | Export `makeBlockNodeView` + `BlockNodeViewFactoryProps` |
| `apps/site/playwright/sample-blocks-edit-loads.spec.ts` | Replace cf-16 weak assertion with per-kind host + real-DOM markers (8 block kinds) |
| `packages/editor-shell/CONTRACT.md` | Document the NodeView bridge in Public surface |
| `docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png` | Regen (visual proof) |
| `docs/plans/wave-6-main/wave-6-cf-18-block-nodeview-wiring.md` | PR.md self |

Total scope: 7 files (1 new bridge + 1 wire update + 1 export bump + 1 Playwright strengthening + 1 sister-doc + 1 screenshot regen + 1 PR.md self). No new vitest unit tests — the existing 132 editor-shell tests verify the no-registry fallback path (tests don't inject a registry, so `addNodeView` is omitted and the placeholder `renderHTML` keeps them green); the Playwright spec covers the registry-injected NodeView path end-to-end.

## Decisions

**D1 — NodeView bridge in editor-shell, not per-block**: keep block packages framework-agnostic at the Tiptap layer. They already export `EditorView: ComponentType<BlockViewProps<TSchema>>`; editor-shell owns the Tiptap wiring. Each block stays free to swap UI implementations (`uiId='minimal'` etc.) without re-implementing NodeView.

**D2 — atom node, not editable content**: every component block is `atom: true`. Inline editing of the block's interior (e.g. typing into a Pdf node) is out of scope; the block's React component owns its UI. Future work could add inner editable regions via `atom: false + addNodeView` `contentDOMElementTag`.

**D3 — no HeavyBlockBoundary in editor**: HeavyBlockBoundary is for SSR zero-layout-shift on the static-render path (`apps/site/src/components.ts`). Tiptap NodeView mounts client-side; the heavy block's EditorView (which already handles its own kernel/canvas/flow lifecycle) mounts directly. Trade-off: opening `/notes/<slug>/edit` will trigger client-side load of Pyodide / TFJS / React Flow if those blocks are present. Acceptable on the edit surface; a future PR can add lazy-load gates if needed.

**D4 — registry injected at `wireRegistry` time, not at NodeView render time**: a single `BlockRegistry` per `EditorShell` mount; closure-captured into the extensions array. No prop-drilling at NodeView render time.

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1
path pattern. The strengthened sample-blocks Playwright spec satisfies
the D9.2 e2e_smoke obligation; the regen'd screenshot satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mount loads via the ApiAdapter
    chain; every Tiptap component-block node now mounts via
    `ReactNodeViewRenderer` → `makeBlockNodeView({registry})` →
    the block's registered `EditorView`. The 14 fixture instances
    materialize as real DOM (2 PDF iframes / 2 imgs / 2 KaTeX /
    1 React Flow graph / syntax-highlighted code body / NN-Viz
    SVG topology / Jupyter container / 4 callout containers)
    instead of the pre-cf-18 "{Label} block" placeholder strings.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-edit-loads.spec.ts:"sample-blocks edit route loads non-empty content (mdxFlowExpression no longer breaks)"
  screenshot_archive: docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png
  assertions:
    - editor `.ProseMirror` is visible within 15s
    - editor textContent length > 50
    - editor contains "Wave 2 close acceptance criterion"
    - editor `a` (markdown link) is visible (carry-forward #15a check)
    - editor `code` (inline) is visible (carry-forward #15b check)
    - editor `[data-skb-load-error]` count is 0
    - editor `text=/\[unsupported block </` count is 0 (carry-forward #16 check)
    - editor `[data-skb-block-host]` count is exactly 14 (carry-forward #18 fixture-instance count)
    - editor `[data-skb-block-host="<kind>"]` first match is visible for each of: callout, componentCode, image, math, pdf, jupyter, nn-viz, agent-flow (8 kinds)
    - editor `.skb-block-nodeview--unregistered` count is 0 (proves registry threaded into wireRegistry)
    - editor first `iframe` is visible (PDF EditorView mounted)
    - editor first `img` is visible (Image EditorView mounted)
    - editor first `.katex` is visible (Math EditorView mounted)
    - editor first `.react-flow` is visible within 10s (AgentFlow EditorView mounted)
    - editor first `pre code` is visible (Code EditorView mounted)
    - no console errors matching `loadFromMdx|mdx-bridge`
    - full-page screenshot regenerated to docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png

## Test plan

- [x] `pnpm --filter @skb/editor-shell test` — existing 132 tests remain green (no-registry fallback path verified)
- [x] `pnpm --filter @skb/site test:visual -- playwright/sample-blocks-edit-loads.spec.ts --reporter=list` — Playwright PASS in 2.7s (8-kind host visibility + 14-host count + 0 unregistered + per-component DOM markers)
- [x] `pnpm check` — exit 0 (41/41 tasks)
- [x] Visual regression: regen `wave-6-hotfix-sample-blocks-edit-loads.png` shows real components (PDF iframe, React Flow graph, KaTeX, syntax-highlighted code, image, callout container, Jupyter container, NN-Viz SVG)

## Acceptance

1. `packages/editor-shell/src/BlockNodeView.tsx` exports a `makeBlockNodeView({registry})` factory returning a `ComponentType<ReactNodeViewProps>` compatible with `ReactNodeViewRenderer`; the factory closes over the injected `BlockRegistry` so the rendered component can resolve UIs at every node-view mount without re-receiving props
2. `createBlockExtension(option, registry?)` conditionally installs `addNodeView() { return ReactNodeViewRenderer(makeBlockNodeView({registry})); }` only when a registry is present; without a registry `addNodeView` is omitted entirely so Tiptap falls back to the legacy `renderHTML` placeholder (preserves no-registry test mounts)
3. `wireRegistry({ blockRegistry })` propagates the registry into the extensions array via `blockKinds.map((option) => createBlockExtension(option, options.blockRegistry))`; existing 132 editor-shell tests (none of which inject a registry) stay green because they hit the fallback path
4. Sample-blocks Playwright asserts: 14 `[data-skb-block-host]` total + at least one visible host per kind across all 8 kinds + per-component real-DOM markers (`<iframe>` for PDF / `<img>` / `.katex` for math / `.react-flow` for AgentFlow / `pre code` for code body)
5. Sample-blocks Playwright asserts ZERO `.skb-block-nodeview--unregistered` fallback wrappers (proves the registry was threaded through `wireRegistry` into `createBlockExtension`)
6. `editor-shell/CONTRACT.md` documents the NodeView bridge under Public surface (lines 497-518 region)
7. `pnpm check` exit 0
8. ADR-0006 9-point sweep clean (incl. ADR-0011 D9 ui_touch / e2e_smoke metadata above)
