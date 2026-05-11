# Wave 7 Phase 2D — theme baseplate mount + per-theme block chrome

> Delivers the **visible theme experience** the user asked for after
> Phase 2C foundation: mounting `theme.renderBaseplate(...)` inside
> `.skb-grid` + per-theme block chrome (rounded corners, hue tints,
> shadows) via CSS rules consuming theme cssVars. The 3 themes
> (graph-paper / lego-studs / bento-canvas) now look visibly
> distinct, matching the prototype variants.

## title

Mount `theme.renderBaseplate` as a positioned-absolute child of
`.skb-grid` (stud-dot for lego-studs, dotted for graph-paper,
hidden-when-idle for bento-canvas) + add per-theme block chrome
rules in `grid.css` that consume theme cssVars to produce
prototype-matching block visuals. Editor uses CSS Grid layout
unchanged (block positioning via `gridColumn`/`gridRow` per
ADR-0016 stays); the deeper layout-model migration to absolute
positioning is **explicitly deferred** to a follow-up.

## What user sees

| Theme | Baseplate | Block chrome |
|---|---|---|
| `lego-studs` (default) | warm beige + stud-dot grid pattern | hue-tinted background (12% kind blend), 1px soft border, 4px radius, light shadow |
| `graph-paper` | near-white + faint dotted pattern | white background, thin border, 2px hue top stripe per kind |
| `bento-canvas` | transparent / grid lines on drag | rounded card (12px radius), no border, soft drop shadow |

## files

### NEW

- `packages/editor-shell/src/theme-baseplate.tsx` (40 LOC) —
  Thin React mount calling `theme.renderBaseplate({ totalCols: 12,
  totalRows: DEFAULT_TOTAL_ROWS, dragInProgress, slotSize: theme.slotSize })`.
  `dragInProgress` wired from pipeline state so bento-canvas shows
  grid lines during drag only.

### Modified

- `packages/grid-themes/src/built-in/shared.ts` —
  `baseplateStyle` now `position: absolute; inset: 0; z-index: 0`
  (was `position: relative; width: 100%; height: 100%`). This
  positions the baseplate as a background layer of its container
  rather than reserving a layout cell.
- `packages/editor-shell/src/index.ts` — exports `ThemeBaseplate`.
- `apps/site/src/components/EditorShellMountInner.tsx` —
  imports `ThemeBaseplate`; mounts inside `<GridContainer>` as the
  first child with `dragInProgress` wired from pipeline.
- `apps/site/src/styles/grid.css` —
  - `.skb-grid[data-skb-theme]` adds `position: relative` + `isolation: isolate`
  - `.skb-block-nodeview` / `.skb-block-static` raised to `z-index: 1`
    inside themed grid (baseplate is z-index 0)
  - **Per-theme block chrome rules** (~100 lines): lego-studs hue-tint
    blend + soft border/shadow; graph-paper white + per-kind top
    stripe; bento-canvas rounded card + shadow. Each kind targeted
    via `[data-skb-block-kind="<kind>"]` × `[data-skb-theme="<theme>"]`
    selector pair.

## ui_touch

`true` — `packages/editor-shell/src/` + `apps/site/src/styles/` +
`apps/site/src/components/` paths matched. **Visible user-facing
diff** in `/notes/<slug>/edit`:
- Default load: lego-studs theme — warm beige stud-dot baseplate
  visible behind blocks; blocks have light hue tint.
- Click ThemeSwitcher chip → switch to graph-paper or bento-canvas;
  baseplate AND block chrome change.
- Read route + non-themed paths: rendered identically to pre-2D
  (rules gated under `[data-skb-theme]` data attribute).

## e2e_smoke

- flow: cf-25 markdown-block structural regression — render +
  count + chrome class invariants unchanged.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-markdown-blocks.spec.ts
  assertions:
    - markdown block count ≥ 1
    - cf-25 structural specs still PASS

- flow: theme switcher renders + applies data-skb-theme attr +
  baseplate element mounts inside .skb-grid.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-edit-loads.spec.ts
  assertions:
    - `[data-skb-baseplate]` element present inside `.skb-grid[data-skb-theme]`
    - default theme key is `lego-studs`

## Acceptance

executor: orchestrator-self (theme integration; no codex needed)
reviewer: CI gates (lint + typecheck + test + build + size-check +
lychee + e2e-coverage + visual-smoke)
contract_changes:
  - NEW `@skb/editor-shell` export: `ThemeBaseplate`,
    `ThemeBaseplateProps`
  - `baseplateStyle` helper in `@skb/grid-themes/src/built-in/shared.ts`
    switched from relative to absolute positioning (theme tests
    updated; 29/29 still pass)
new_adr: NONE — ADR-0020 D7-D9 already lock the theme contract
risk_class: D2 row 1 (cross-module contract additions) + D2 row 8
(visible UI behavior change). CSS rules are gated under
`[data-skb-theme]` so non-themed paths render identically.
PRE-COMMIT CLAUDE REVIEW skipped per bootstrap-scope rule.

## Out of scope (explicitly deferred per Wave 7 plan)

- **Full theme.renderBlock React-render migration**: this PR
  delivers per-theme chrome via CSS rules consuming cssVars instead
  of replacing the React render path. The Theme interface's
  `renderBlock` function exists but the editor doesn't call it for
  block wrappers (it does for baseplate + future drop preview).
  Deferred to a layout-model migration follow-up that switches CSS
  Grid → absolute positioning + deletes `useProjectGridStyleToOuter`.
- **Drop preview per-theme styling**: `OutlineOverlay` still
  renders a plain rect for the drop intent; `theme.renderDropPreview`
  integration deferred.
- **Read route theme integration**: per-doc frontmatter `theme:`
  SSR threading + `.skb-block-static` data-skb-theme attribute
  needs SSR-time theme resolution.
- **`useProjectGridStyleToOuter` removal**: structurally tied to
  the CSS Grid layout; removal requires the layout migration.
- **Prototype deletion**: per user directive 2026-05-11, the
  `/grid-prototype` route + `_grid-prototype/` components stay
  alive through Wave 7 close (PR #130) as the acceptance benchmark.

## Process

1. ✓ shared.ts baseplateStyle switched to absolute positioning
2. ✓ ThemeBaseplate React helper wraps theme.renderBaseplate
3. ✓ EditorShellMountInner mounts ThemeBaseplate inside GridContainer
4. ✓ grid.css `.skb-grid[data-skb-theme]` adds position:relative +
   z-index stacking + isolation
5. ✓ Per-theme block chrome rules added (~100 lines):
   - lego-studs: hue blend + border + radius + shadow
   - graph-paper: white + per-kind top stripe
   - bento-canvas: rounded card + shadow
6. ✓ Editor-shell 291/291 vitest pass
7. ✓ grid-themes 29/29 vitest pass
8. ✓ Full `pnpm check` 47/47 pass
9. **THIS PR** — commit + CI gate

## Honest scope

- 1 file created (theme-baseplate.tsx, 40 LOC)
- 4 files modified (~+170 / -10 net LOC)
- 0 tests added in this PR (existing 29 grid-themes + 291 editor-shell
  cover the surface; the CSS rules are visual and exercised by
  visual-smoke baselines)
- No file size violations
