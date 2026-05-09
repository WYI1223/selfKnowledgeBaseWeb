# Wave 6 cf-20e — Kebab menu (per-block actions: Delete / Duplicate / Change kind…) inside `.skb-block-nodeview__gutter`

> Wave 6 carry-forward — composes a NEW per-block kebab button in the
> cf-19 gutter shell + a floating menu with 3 actions: Delete /
> Duplicate / Change kind…. Mirrors the cf-20c-2 drag-handle button
> pattern (presentational component + React context to lifecycle
> owner). All Tiptap mutations route through the consumer
> (`EditorShellMount.tsx`) which closures over the live editor —
> the kebab components stay editor-agnostic for testability.
>
> Per orchestrator-decision Q1: change-kind IS in scope (no defer).
> Per Q3: change-kind attr translation = drop-and-default + preserve
> grid attrs only. Per Q4: silent delete (Tiptap history Cmd+Z undo).

## title

NEW `packages/editor-shell/src/kebab/kebab-button.tsx` (~95 LOC)
emitting a single `<button class="skb-block-nodeview__kebab"
aria-label="Block actions">⋮</button>` inside the cf-19 gutter shell;
NEW `kebab/kebab-menu.tsx` (~165 LOC) floating menu with Delete /
Duplicate / Change kind sub-menu — local React state for open +
click-outside detection + Esc-to-close; NEW `kebab/kebab-context.tsx`
(~50 LOC) React context bridging per-block buttons to the consumer's
imperative editor actions; NEW `kebab/change-kind-attrs.ts` (~75
LOC) pure helper that builds the new-kind's attrs from the source
node by preserving only the universal grid fields per cf-20e D3
drop-and-default decision; NEW `kebab/kebab-menu.css` (~120 LOC) —
button + floating menu + sub-menu visuals (gutter-tinted background,
8px shadow, accent rule on focus). MODIFY
`packages/editor-shell/src/BlockNodeView.tsx` (~10 LOC delta) to
render `<KebabButton blockId={...}>` next to the cf-20c-2 drag handle.
MODIFY `packages/editor-shell/src/index.ts` to barrel-export the new
public surface (5 new exports). MODIFY
`packages/editor-shell/package.json` to add `./kebab-menu.css`
exports map entry. MODIFY
`apps/site/src/components/EditorShellMount.tsx` (~50 LOC delta) to
wire `<KebabProvider>` with imperative `onDelete` / `onDuplicate` /
`onChangeKind` callbacks that operate on the live Tiptap editor +
reuse the cf-20c-2 dropEpoch infrastructure for the success-pulse on
duplicate (positional change visual feedback). MODIFY
`apps/site/src/styles/global.css` to import `kebab-menu.css`. NEW
`apps/site/playwright/sample-blocks-kebab-menu.spec.ts` (~250 LOC,
4 tests: button visibility / delete commit / duplicate commit /
change-kind commit) consuming the cf-20c-2 byte-snapshot fixture
isolation pattern. NEW vitest unit
`packages/editor-shell/src/__tests__/kebab/change-kind-attrs.test.ts`
covering the pure attr-translation logic. Update `editor-shell/CONTRACT.md`
+ `apps/site/CONTRACT.md` per ADR-0006 #6 sister-doc rule.

## files

13 source files (~970 LOC net add; simpler than cf-20d because no
pipeline lifecycle owner — kebab actions are imperative one-shot
callbacks):

1. `packages/editor-shell/src/kebab/kebab-button.tsx` — **NEW** (~95
   LOC). Per-block presentational component renders a single
   `<button class="skb-block-nodeview__kebab" aria-label="Block
   actions" data-skb-kebab-block-id={blockId}>⋮</button>`. Local
   useState for menu-open. On click toggles open; Esc + click-outside
   close. Renders `<KebabMenu>` inside a `position: absolute` wrapper
   when open. Pointer-events: auto (cf-19 gutter precedent).

2. `packages/editor-shell/src/kebab/kebab-menu.tsx` — **NEW** (~165
   LOC). Floating menu component. Props: `{blockId, kinds, onClose}`.
   Renders 3 menu items (Delete / Duplicate / Change kind…). Click
   on each calls the corresponding `KebabContext` callback then
   `onClose()`. "Change kind…" expands an inline sub-menu listing the
   8 BlockKind options with their friendly labels (sourced from
   `BLOCK_KIND_OPTIONS` per the cf-15b registry-wire authority); each
   sub-menu item, on click, calls `context.onChangeKind(blockId,
   kind)` then `onClose()`. Keyboard: ArrowDown/ArrowUp to move focus,
   Enter to activate (cf-22 a11y polish; cf-20e ships baseline
   pointer-only — keyboard nav is a future cf-22 enhancement noted in
   out-of-scope).

3. `packages/editor-shell/src/kebab/kebab-context.tsx` — **NEW** (~50
   LOC). React context bridging per-block kebab actions to the
   lifecycle owner. Mirrors cf-20c-2 `DragDropContext` /
   cf-20d `ResizeContext` shape. Provider value:
   `{onDelete(blockId), onDuplicate(blockId), onChangeKind(blockId,
   newKind), kinds: BlockKindOption[]}`. Default null = degraded mode
   (button renders but onClick is no-op).

4. `packages/editor-shell/src/kebab/change-kind-attrs.ts` — **NEW**
   (~75 LOC). Pure helper:
   - `buildChangeKindAttrs(sourceAttrs: Record<string, unknown>,
     targetKind: BlockAffordanceKind, targetDefaults: Record<string,
     unknown>): Record<string, unknown>` — returns the new-kind attr
     object preserving ONLY the universal grid fields `{col, row?,
     colSpan, rowSpan}` from sourceAttrs; all other fields come from
     `targetDefaults` (the new kind's `defaultBlockAttrs[targetKind]`
     per cf-20e D3 drop-and-default decision). The helper takes
     defaults as a parameter (NOT imported from registry-wire) so the
     pure-helper module stays free of the registry-wire dependency
     graph; consumer wires the defaults at call site.

5. `packages/editor-shell/src/kebab/kebab-menu.css` — **NEW** (~120
   LOC). Visual contract:
   - `.skb-block-nodeview__kebab` button — same 22×22 geometry as the
     cf-20c-2 drag handle (matches the gutter row). `cursor: pointer`
     (NOT grab); `font-size: 14px` (slightly larger so `⋮` is legible);
     hover/focus mirrors drag handle (panel bg + accent outline).
   - `.skb-kebab-menu` floating container — `position: absolute; top:
     calc(100% + 4px); left: 0; min-width: 160px; background: var(--surface);
     border: 1px solid var(--border); border-radius: 6px; box-shadow: 0
     4px 12px rgba(0,0,0,0.12); z-index: 10; padding: 4px 0`. The
     `top: calc(100% + 4px)` anchors below the kebab button; the
     container is RELATIVE to the kebab button's parent (the kebab
     wrapper `position: relative`).
   - `.skb-kebab-menu__item` — `display: block; width: 100%; padding:
     6px 12px; text-align: left; border: none; background: transparent;
     font-size: 13px; color: var(--text); cursor: pointer`. Hover →
     `background: var(--panel)`. Focus → `outline: 2px solid var(--accent)`.
   - `.skb-kebab-menu__item--danger` (for Delete) — `color:
     var(--accent-danger, oklch(55% 0.18 25))`.
   - `.skb-kebab-menu__submenu` — sub-list inside the change-kind menu
     item; same item styles + 8px left padding indentation.
   - `@media (max-width: 768px)` mobile — `.skb-block-nodeview__kebab,
     .skb-kebab-menu { display: none }` per ADR-0017 D9 mobile view-
     only contract (matches cf-20c-2 drag handle + cf-20d resize
     handles patterns).

6. `packages/editor-shell/src/BlockNodeView.tsx` — **MODIFY** (~10
   LOC delta). Renders `<KebabButton blockId={blockId} />` inside
   `.skb-block-nodeview__gutter` immediately after the cf-20c-2
   `<DragHandleButton>` (sits in the gutter row alongside the drag
   handle + kind chip).

7. `packages/editor-shell/src/index.ts` — **MODIFY** (~10 LOC delta).
   Adds barrel exports for `KebabButton`, `KebabMenu`, `KebabContext`,
   `KebabProvider`, `KebabContextValue`, `buildChangeKindAttrs`.

8. `packages/editor-shell/package.json` — **MODIFY** (+1 LOC). Adds
   `"./kebab-menu.css": "./src/kebab/kebab-menu.css"` exports map
   entry.

9. `apps/site/src/components/EditorShellMount.tsx` — **MODIFY** (~50
   LOC delta). Wires `<KebabProvider value={{onDelete, onDuplicate,
   onChangeKind, kinds}}>` nested inside the existing
   `<DragDropProvider>` + `<ResizeProvider>` so per-block components
   read all 3 contexts independently. The 3 callbacks operate on the
   live Tiptap editor via closure:
   - `onDelete(blockId)` — find live PM position via the
     `liveBlockPositions` snapshot pattern (reuses the cf-20c-2
     pipeline-snapshot helper); dispatch
     `editor.chain().command(({tr, state}) => { const pos = ...; const
     node = tr.doc.nodeAt(pos); tr.delete(pos, pos + node.nodeSize);
     return true }).run()`.
   - `onDuplicate(blockId)` — find live PM position; capture
     `node.toJSON()`; dispatch
     `editor.chain().insertContentAt(pos + node.nodeSize, nodeJson).run()`.
     Optionally fire success-pulse via `pipeline.setLastDroppedFromExternal`
     after 2-rAF re-measure (cf-20c-2 R3 dropEpoch pattern reuse).
   - `onChangeKind(blockId, newKind)` — find live PM position; resolve
     new node type via `editor.schema.nodes[newKind]`; build new
     attrs via `buildChangeKindAttrs(node.attrs, newKind,
     defaultBlockAttrs[newKind])`; dispatch
     `editor.chain().command(({tr}) => { tr.setNodeMarkup(pos,
     newNodeType, newAttrs); return true }).run()`.

10. `apps/site/src/styles/global.css` — **MODIFY** (+7 LOC). Adds
    `@import '@skb/editor-shell/kebab-menu.css'` after the cf-20d
    `resize-handles.css` import.

11. `packages/editor-shell/src/__tests__/kebab/change-kind-attrs.test.ts`
    — **NEW** (~110 LOC). Vitest covering the pure
    `buildChangeKindAttrs` helper:
    - Universal grid attrs preserved (col/row/colSpan/rowSpan).
    - Source-only attrs dropped (e.g. callout's `variant`/`title`
      dropped when target = code).
    - Target defaults applied (e.g. code's `language`/`code`/
      `showLineNumbers` set from target defaults).
    - Identity case: source kind === target kind → returns target
      defaults + preserved grid (NOT a no-op; the change-kind action
      can be a "reset to defaults" path; document this as side-effect).
    - Missing grid attrs case: source has no `row` → result has no
      `row`.

12. `apps/site/playwright/sample-blocks-kebab-menu.spec.ts` — **NEW**
    (~250 LOC, 4 integration tests):
    - **Test 1 (button visibility + open/close)**: 14 NodeView
      wrappers each render 1 `.skb-block-nodeview__kebab`. Click
      first → menu opens (3 items present). Click outside → menu
      closes. Esc → menu closes. Mobile (375×812) → button has
      `display: none` per @media rule.
    - **Test 2 (delete)**: capture pre-delete block count;
      click first kebab → click "Delete" → assert block count
      decreased by 1 + the previously-second block is now first.
    - **Test 3 (duplicate)**: capture pre-duplicate; click first
      kebab → click "Duplicate" → assert block count increased by 1
      + duplicated block has same `data-skb-block-kind` attribute as
      the source.
    - **Test 4 (change-kind)**: pre-change first block kind is
      `callout` (from sample-blocks fixture); click kebab → "Change
      kind…" → "Code" → assert first block now has
      `data-skb-block-kind="componentCode"` AND grid attrs preserved
      (`gridColumn === '1 / span 12'`).
    Spec uses `test.beforeAll(snapshotMdxBytes)` +
    `test.afterAll(restoreMdxBytes)` per cf-20c-2 R3 F1 — NEVER `git
    checkout`.

13. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~50 LOC delta).
    Adds Kebab subsection in the editor-shell Public surface block
    documenting `KebabButton` / `KebabMenu` / `KebabContext` /
    `KebabProvider` / `buildChangeKindAttrs` public surface +
    drop-and-default attr translation contract + Mobile view-only
    @media path.

14. `apps/site/CONTRACT.md` — **MODIFY** (~25 LOC delta). Adds
    "Kebab menu wire (Wave 6 cf-20e)" bullet to the Edit route
    section describing the provider mount + 3 callbacks (delete /
    duplicate / change-kind) + mobile-hidden contract + dropEpoch
    reuse for duplicate success-pulse.

15. `docs/plans/wave-6-main/wave-6-cf-20e-kebab-menu.md` — **NEW**
    (PR.md self; this file).

Plus 1 NEW screenshot artifact:
`docs/audits/screenshots/wave-6-cf-20e-kebab-menu.png` emitted by
the new Playwright spec.

## D2 trigger judgment

- **Row 1 (CONTRACT.md change in N packages)** — HIT: 2 CONTRACT.md
  files modified (`@skb/editor-shell` + `apps/site`).
- **Row 2 (NEW deps)** — N/A (no new deps; the kebab uses pure React
  + existing Tiptap commands + the cf-20c-2 pipeline-snapshot helper).
- **Row 4 (NEW ADR or amendment)** — N/A (consumes ADR-0017 D9 +
  cf-20c-2 / cf-20d patterns + the existing `BLOCK_KIND_OPTIONS`
  authority from registry-wire).
- **Row 5 (cross-package: ≥ 3 packages)** — HIT: `@skb/editor-shell`
  + `apps/site` + the cf-20c-2 dropEpoch field consumer (same
  package) + ADR-0017 D9 mobile @media path.

Per CLAUDE.md `## Review workflow` + ADR-0011 D1 stage 4 +
2026-05-09 retrospective rule "ux-ui-lead is dispatched at PLAN",
**PRE-COMMIT CLAUDE REVIEW (stage 4) fires** on Row 1 + Row 5.
ux-ui-lead authored this PLAN end-to-end. Stage 3
codex-pr-reviewer-55 review still required.

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1
path pattern (NEW `kebab/{kebab-button.tsx, kebab-menu.tsx,
kebab-context.tsx, change-kind-attrs.ts, kebab-menu.css}`, MODIFY
`BlockNodeView.tsx`); `apps/site/src/**` matches as well
(`components/EditorShellMount.tsx`, `styles/global.css`, new
Playwright spec).

The new `sample-blocks-kebab-menu.spec.ts` (4 integration tests)
satisfies the D9.2 e2e_smoke obligation; the emitted screenshot
satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mount loads via the ApiAdapter
    chain (cf-18 NodeView wiring + cf-19 chrome + cf-20a single
    source + cf-20b grid + cf-20c-2 drag wire + cf-20d resize wire +
    cf-20e kebab wire). Each of 14 NodeView wrappers renders 1
    `.skb-block-nodeview__kebab` button inside the gutter shell at
    the absolute-positioned location. Hover on the gutter raises
    opacity per cf-19 gutter rule. Click on the first kebab opens
    `.skb-kebab-menu` (3 items: Delete / Duplicate / Change kind…).
    Click "Delete" reduces block count by 1; "Duplicate" increases
    by 1; "Change kind… → Code" mutates first block's
    `data-skb-block-kind` from `callout` to `componentCode` while
    preserving grid attrs. Esc closes the menu without action.
    Click outside closes the menu without action.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-kebab-menu.spec.ts:"sample-blocks edit route — cf-20e kebab-menu wire (button visibility + delete + duplicate + change-kind lifecycle)"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20e-kebab-menu.png
  assertions:
    - .ProseMirror visible within 15s
    - first .skb-block-nodeview visible within 10s
    - 14 `.skb-block-nodeview__kebab` rendered (one per NodeView wrapper)
    - first kebab has `aria-label="Block actions"` + computed `cursor: pointer`
    - pre-click: 0 `.skb-kebab-menu` mounted
    - click first kebab: 1 `.skb-kebab-menu` mounted with 3 `.skb-kebab-menu__item` elements
    - menu items text: "Delete", "Duplicate", "Change kind…"
    - Esc: menu unmounts (0 `.skb-kebab-menu`)
    - click first kebab → click "Delete": block count decreases by 1
    - click first kebab → click "Duplicate": block count increases by 1; new block matches source's `data-skb-block-kind`
    - click first kebab → click "Change kind…" → "Code": first block's `data-skb-block-kind === "componentCode"`; gridColumn unchanged (`1 / span 12`)

- flow: `/notes/sample-blocks/edit` at viewport 375×812 (mobile per
    ADR-0017 D9). All `.skb-block-nodeview__kebab` rendered in the
    React tree but each has computed `display === 'none'` per the
    cf-20e mobile @media rule. Click on the kebab area does not open
    the menu (button is display:none — pointer events route through).
  target_url: /notes/sample-blocks/edit (at 375×812 viewport)
  playwright_spec: apps/site/playwright/sample-blocks-kebab-menu.spec.ts:"cf-20e kebab hidden on mobile (≤768px) per ADR-0017 D9"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20e-kebab-menu.png
  assertions:
    - viewport set to 375×812
    - .skb-block-nodeview__kebab count > 0 in DOM (React tree unchanged)
    - first .skb-block-nodeview__kebab computed `display === 'none'`

## Why (user feedback)

cf-20e is PR 6 of 9 in the locked cf-20 sequence. User directive
2026-05-09 (verbatim, dispatched as cf-20a + carried through):

> "全部做，不允许 defer，必须保质保量，出现问题会直接让你推翻重写。
>  ... 全部对齐 v2."

cf-20d closed the resize half. cf-20e closes the per-block actions
half — Delete / Duplicate / Change-kind are the canonical block
operations in any block-editor (Notion / Tiptap reference UI both
have them in a kebab menu). Pre-cf-20e the editor had no per-block
delete or duplicate UI (user had to select the block via keyboard
+ Tiptap default keymap, which is unintuitive); change-kind required
direct MDX file editing.

## Design source

- v2-design-granularity does NOT specify kebab visuals (cf-20e
  designs minimal-Notion-like floating menu inline; the visual
  contract is documented in `kebab-menu.css` JSDoc + cf-20e D2
  decision below).
- ADR-0017 D9 mobile view-only contract — kebab hidden via @media
  matching cf-20c-2 drag-handle + cf-20d resize handles.
- ADR-0011 D9.1 BlockKind union expansion — the 8-kind enumeration
  for the change-kind sub-menu is sourced from `BLOCK_KIND_OPTIONS`
  in `registry-wire.tsx` (cf-15b authority).
- cf-20c-2 DragDropContext + drag-handle-button.tsx pattern — kebab
  follows the same React-context-to-presentational-component shape.
- cf-20c-2 R3 dropEpoch infrastructure — duplicate's success-pulse
  reuses the dropEpoch field via `setLastDroppedFromExternal` per
  the cf-20d D3 pattern (canonical "rapid-action animation isolation"
  generalized; duplicate is the third action that fires the pulse,
  joining drag-commit + resize-commit).
- cf-20d byte-snapshot fixture isolation — cf-20e Playwright spec
  uses the same `readFileSync` / `writeFileSync` snapshot pattern.

## Decisions

### D1 — Kebab on prose blocks: NOT visible (architectural, not behavioral)

**Open question Q1 from dispatch brief**: should kebab be visible
on prose blocks? Recommendation: yes for delete/duplicate, no for
change-kind.

**Architectural reality**: prose blocks (paragraphs, headings,
lists) render as native ProseMirror nodes — they do NOT pass through
`BlockNodeView`. The kebab button is rendered INSIDE
`.skb-block-nodeview__gutter`, which prose blocks never enter.
Therefore the question is moot at the implementation level: prose
blocks naturally don't get a kebab.

For future reference: if cf-20e+ adds a "prose-block-toolbar" with
its own delete/duplicate UI, that's a separate component (out of
cf-20e scope). Tiptap's built-in keyboard commands (Backspace at
empty paragraph deletes the paragraph; Cmd+D in some editor
configurations duplicates) cover the prose case for now.

**Decision**: cf-20e ships kebab ONLY on `.skb-block-nodeview`
(non-prose component blocks). Documented as the answer to Q1.

### D2 — Floating menu rendered inline (no React Portal); position: absolute relative to button

Two architectural choices for the menu floating layer:
- **Option A**: React Portal to `document.body` + manual coordinate
  computation (anchored to the button's `getBoundingClientRect()`).
  Robust against parent overflow:hidden / transform; standard for
  popovers in production UIs.
- **Option B**: render inline within the kebab button's React tree
  + `position: absolute` relative to `.skb-block-nodeview__kebab-wrapper`.
  No portal mount complexity; coordinates handled by CSS.

**Decision**: Option B for cf-20e MVP. Rationale:
1. cf-20e is dependency-light (no portal library, no manual
   `getBoundingClientRect` math).
2. The cf-19 gutter shell is `position: absolute; top: 4px` already;
   the kebab button + its menu inherit this positioning context
   naturally.
3. The menu's `z-index: 10` lifts it above adjacent blocks; the
   `.skb-grid .ProseMirror` editor surface doesn't have
   `overflow: hidden` so the menu is not clipped.
4. Future cf-22 / cf-23 may switch to Option A (portal) if cross-
   block menu overflow becomes an issue (e.g. menu near grid edge
   gets clipped); cf-20e ships the simpler version.

**Risk**: a menu near the bottom of the editor surface may render
below the viewport. Acceptable for cf-20e (user can scroll); cf-22
will add edge-detection + flip-up logic if needed.

### D3 — Change-kind attr translation: drop-and-default + preserve grid attrs only

**Open question Q3 from dispatch brief**: drop-and-default vs
preserve-compatible-fields.

**Decision**: drop-and-default + preserve grid attrs only. Rationale:
1. Cross-kind attr translation is meaningful only for SOME pairs.
   Examples: callout↔code share semantic "title-like" fields
   (title vs filename); pdf↔image share spatial fields (src,
   width, height) but not semantic ones (page vs alt). Most pairs
   share NOTHING (math expression vs jupyter code, nn-viz layers
   vs agent-flow nodes/edges, etc.).
2. A general N×N translation table is high-effort to maintain
   correctly + introduces silent data corruption when pairs added
   later forget translation entries. Drop-and-default is
   structurally simpler + the user can copy-paste useful content
   from the previous block before changing kind if needed.
3. Grid attrs (`col`, `row?`, `colSpan`, `rowSpan`) are universal
   across ALL block kinds + represent the user's spatial intent
   that survives a kind change. Preserving them keeps the
   visually-placed block at the same spot post-change.

**Implementation**: pure helper `buildChangeKindAttrs(sourceAttrs,
targetKind, targetDefaults)`:
- Start with `{...targetDefaults}` (the new kind's defaults).
- Override with the source's `col`, `colSpan`, `rowSpan`, `row`
  (only if defined) — these 4 fields preserved.
- All other source fields dropped silently.

**Side effect**: if user picks "Change kind… → same kind" (e.g.
callout → callout), the result is the target kind's defaults +
preserved grid — a "reset to defaults" path. Document as an
intended affordance (the user CAN use it to reset block content
without changing kind).

### D4 — Silent delete (no confirm dialog); user can Cmd+Z to undo

**Open question Q4 from dispatch brief**: confirm-on-delete vs
silent.

**Decision**: silent. Rationale:
1. Matches Notion / Tiptap default behavior — no friction-adding
   confirmation for routine block operations.
2. Tiptap's built-in `history` extension (part of StarterKit)
   provides Cmd+Z / Cmd+Shift+Z undo/redo; deleted blocks recover
   via Cmd+Z (typically a single keypress).
3. Confirm dialogs are cf-22 a11y / UX-polish scope; cf-20e ships
   the minimal action set.

Documented in PR.md + CONTRACT.md so future a11y review can amend
if user testing reveals confirm-dialog need.

### D5 — Imperative actions via React context (consumer closures over Tiptap editor)

The kebab button is presentational; the actual Tiptap mutations
(deleteNode / insertContent / setNodeMarkup) need the live editor.
Two architectural choices:
- **Option A**: pass `editor` directly to `<KebabButton editor={...}>`
  via prop drilling. Requires `BlockNodeView` to receive the
  editor (it has access via Tiptap's `props.editor` from
  `ReactNodeViewProps`).
- **Option B**: React context `KebabContext` exposes
  `{onDelete(blockId), onDuplicate(blockId), onChangeKind(blockId,
  newKind)}` callbacks; the consumer (`EditorShellMount.tsx`)
  closures over `editor` and provides the context value. Mirrors
  cf-20c-2 `DragDropContext` + cf-20d `ResizeContext` pattern
  exactly.

**Decision**: Option B — consistency with cf-20c-2 + cf-20d
patterns + keeps `KebabButton` editor-agnostic for testability.
The consumer is the single owner of editor mutations across all 3
contexts (drag, resize, kebab); the per-block components stay
purely presentational.

### D6 — Duplicate fires success-pulse via cf-20c-2 dropEpoch reuse (Option B from cf-20d D3)

Per cf-20c-2 R3 reflection ("the dropEpoch pattern is the canonical
'rapid-action animation isolation' pattern. cf-20d resize will
adopt the same pattern for its own resize-success pulse"), cf-20e
duplicate ALSO routes the success-pulse through
`pipeline.setLastDroppedFromExternal(blockId, rect)`. The pulse
visually anchors at the duplicated block's bounding rect after
2-rAF re-measure (post-Tiptap commit + browser layout). Delete +
change-kind do NOT fire pulses (delete removes the block; change-
kind keeps the block in place — no positional change to celebrate).

### D7 — `node.toJSON()` for duplicate (Tiptap canonical pattern); fresh PM positions assigned automatically

Tiptap's `node.toJSON()` returns the canonical serialized
representation; `editor.chain().insertContentAt(pos + nodeSize,
nodeJson).run()` re-creates a structurally identical node at the
new position with fresh ProseMirror positions (the inserted node
gets a new `pos` per ProseMirror's internal indexing). Future
cf-20e+ schema-mod PRs that introduce stable UUID attrs will need
to clear those at duplicate (so the duplicate doesn't have the
SAME UUID as the source — that would break drop-pulse anchoring +
any other UUID-keyed state). cf-20e doesn't have stable UUIDs yet
(cf-20c-2 D2 path A uses pos-as-id), so no clearing needed. Future
PR amendment.

### D8 — Click-outside detection via `useEffect` mousedown listener on `document` (no library)

The floating menu must close on click-outside-the-menu. Standard
React pattern: `useEffect` adds a mousedown listener to `document`;
the handler checks if `event.target` is inside the menu's
`useRef` container; if NOT, closes the menu. Esc-to-close is a
parallel `keydown` listener on `document` (matches cf-20c-2
`useEscCancel` pattern but simpler — kebab doesn't need focus
restoration since it's a click action, not a keyboard gesture).

## Acceptance

```bash
# AC-1: ADR-0011 D9 ui_touch detects on the right files
pnpm exec tsx scripts/check-ui-touch.ts \
  --files packages/editor-shell/src/kebab/kebab-button.tsx \
          packages/editor-shell/src/kebab/kebab-menu.tsx \
          packages/editor-shell/src/kebab/change-kind-attrs.ts \
          packages/editor-shell/src/BlockNodeView.tsx \
          apps/site/src/components/EditorShellMount.tsx \
          apps/site/src/styles/global.css 2>&1 | tail -3
# Expected: ui_touch=true
```

```bash
# AC-2: editor-shell + apps/site test suites green
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 245+ passed (cf-20d carried 241 + cf-20e change-kind-attrs unit cases ~5)
pnpm --filter @skb/site test 2>&1 | grep -E 'Tests'
# Expected: 78 passed | 1 skipped (carried)
```

```bash
# AC-3: targeted Playwright passes (kebab spec + carried)
pnpm --filter @skb/site exec playwright test \
  playwright/sample-blocks-kebab-menu.spec.ts \
  playwright/sample-blocks-resize-handles.spec.ts \
  playwright/sample-blocks-drag-handle.spec.ts \
  playwright/sample-blocks-edit-loads.spec.ts \
  --reporter=line --workers=1 2>&1 | tail -3
# Expected: 14 passed (4 new cf-20e + 6 cf-20d + 3 cf-20c-2 + 1 edit-loads)
```

```bash
# AC-4: full apps/site Playwright suite passes
pnpm --filter @skb/site exec playwright test --reporter=line --workers=1 2>&1 | tail -3
# Expected: 67 passed | 14 skipped | 0 failed (was 63 in cf-20d; +4 new kebab specs)
```

```bash
# AC-5: pnpm check exit 0
pnpm check
# Expected: all 41 tasks successful
```

```bash
# AC-6: cf-20e source surface lands at the expected paths
test -f packages/editor-shell/src/kebab/kebab-button.tsx && echo OK
test -f packages/editor-shell/src/kebab/kebab-menu.tsx && echo OK
test -f packages/editor-shell/src/kebab/kebab-context.tsx && echo OK
test -f packages/editor-shell/src/kebab/change-kind-attrs.ts && echo OK
test -f packages/editor-shell/src/kebab/kebab-menu.css && echo OK
# Expected: 5× "OK"
```

```bash
# AC-7: barrel exports the new public surface
grep -cE 'KebabButton|KebabMenu|KebabProvider|KebabContext|buildChangeKindAttrs' packages/editor-shell/src/index.ts
# Expected: ≥ 5
```

```bash
# AC-8: kebab on prose NOT visible (architectural; prose has no .skb-block-nodeview wrapper)
# This is structural; verified by absence of kebab in any prose-only fixture.
# Sample-blocks fixture has all 14 blocks as non-prose component blocks → all 14 get kebabs.
grep -cE 'data-skb-block-kind' apps/site/playwright/sample-blocks-kebab-menu.spec.ts
# Expected: ≥ 1 (the change-kind assertion uses the data-attr)
```

```bash
# AC-9: cf-20c-2 chrome single source still holds
grep -lE 'border-top: 2px solid var\(--accent-' \
  $(find packages apps -name '*.css' -not -path '*/node_modules/*' -not -path '*/dist/*')
# Expected: exactly packages/editor-shell/src/block-chrome.css
```

```bash
# AC-10: ADR-0017 D9 mobile view-only path locked for kebab
grep -cE '@media \(max-width: 768px\).*display: none|@media \(max-width: 768px\)' packages/editor-shell/src/kebab/kebab-menu.css
# Expected: ≥ 1 (the mobile @media rule hiding kebab per ADR-0017 D9)
```

```bash
# AC-11: cf-20c-2 R3 dropEpoch reuse for duplicate (NOT a separate kebabEpoch)
grep -cE 'setLastDroppedFromExternal' packages/editor-shell/src/kebab/ apps/site/src/components/EditorShellMount.tsx 2>/dev/null
# Expected: ≥ 1 (consumer-side onDuplicate wires to setLastDroppedFromExternal per cf-20d D3 pattern)
```

```bash
# AC-12: byte-snapshot fixture isolation (cf-20c-2 R3 F1 pattern; NEVER git checkout)
grep -cE 'execSync|git checkout|git restore|git reset' apps/site/playwright/sample-blocks-kebab-menu.spec.ts
# Expected: 0
grep -cE 'readFileSync|writeFileSync' apps/site/playwright/sample-blocks-kebab-menu.spec.ts
# Expected: ≥ 2
```

## Reflection landing

This PR appends one entry to
`docs/orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md`
per the 2026-05-09 retrospective process rule. The entry documents
what surprised ux-ui-lead during cf-20e (kebab simplicity vs cf-20d
complexity — no pipeline lifecycle, just imperative one-shot
callbacks; the change-kind drop-and-default decision; the dropEpoch
reuse for duplicate confirms the pattern is generalized correctly
across 3 actions: drag-drop, resize-commit, duplicate).

## Out-of-scope

Items NOT in cf-20e scope but referenced for context:
- **Confirm-on-delete dialog**: per D4 silent baseline; cf-22 a11y
  may amend.
- **Keyboard navigation in menu**: cf-22 a11y scope (ArrowDown /
  ArrowUp / Enter / Esc baseline already in cf-20e Esc; full
  arrow-key nav future).
- **Menu edge-detection + flip-up** when near grid edge: cf-22 /
  cf-23 polish.
- **Stable UUID attrs for duplicate** (so duplicates have unique
  IDs): cf-20c-2 D2 path B deferred; not needed for cf-20e because
  pos-as-id resolves freshly post-insert.
- **Cross-kind attr translation table** (preserve compatible
  fields): per D3 explicit decision drop-and-default; future PR
  may amend if user testing reveals need.
- **Prose-block actions toolbar** (delete/duplicate UI for prose
  paragraphs/headings): per D1 architectural decision out of cf-20e
  scope; future cf-21+ "prose-toolbar" PR.

## Related

- [cf-20d PR.md](wave-6-cf-20d-resize-handles.md) — resize wire +
  dropEpoch reuse pattern + R3 normalize-overflow defense.
- [cf-20c-2 PR.md](wave-6-cf-20c-2-drag-handle-wire.md) — drag wire
  + DragDropContext pattern that cf-20e mirrors.
- [cf-19 PR.md](wave-6-cf-19-editor-block-visual-identity.md) —
  shipped the gutter shell that cf-20e adds the kebab button to.
- [ADR-0017 D9](../../decisions/ADR-0017-drag-drop-ux.md) — mobile
  view-only @media path inherited by kebab.
- [ADR-0011 D9](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pre-commit Claude review trigger (Row 1 + Row 5 hit) +
  ui_touch / e2e_smoke gates.
- [orchestrator-reflections 2026-05-09](../../orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md)
  — process rules applied (artifact-checklist, doc-honesty,
  byte-snapshot tests, dropEpoch reuse, mechanical doc-drift grep,
  multi-field invariant enumeration).
