# Wave 6 cf-23 — Read-mode visual unification (`/notes/[slug]` aligned to v2 doc-wrap; edit + read share BaseLayout `wide` opt-in)

> Wave 6 carry-forward — closes the user-stated "edit 和正常模式
> 风格统一一下" + "其他的全部对齐 v2" gap. cf-20a already shipped
> single-source block chrome (`.skb-block-static` + `.skb-block-nodeview`
> resolve identical card geometry through `block-chrome.css`); the
> visual probe at session start confirmed the per-block surface is
> already aligned. The REMAINING gap is page-level: the BaseLayout
> the main element is `class="prose mx-auto max-w-3xl py-12 px-4"` which
> constrains BOTH routes to 768px and applies Tailwind's prose
> typography on top of v2 tokens. v2 reference contract
> (`/mnt/d/download/web/v2-styles.css:122-127`) specifies `.doc-wrap`
> = `max-width: 1180px; padding: 40px 48px 200px`. cf-23 introduces
> a `wide` opt-in on BaseLayout; both `/notes/[slug]` AND
> `/notes/[slug]/edit` pass `wide`, swapping the main element to a v2-aligned
> doc-wrap analog. Block chrome is untouched; only the page shell
> changes.

## title

Modify `apps/site/src/layouts/BaseLayout.astro` to accept an optional
`wide?: boolean` prop. When `wide`, the the main element className changes
from `prose mx-auto max-w-3xl py-12 px-4` to a v2-doc-wrap analog
`mx-auto py-10 px-4 lg:px-12` paired with an inline
`style="max-width: 1180px"` so the v2 1180px ceiling resolves on
desktop while mobile naturally collapses through `mx-auto`. Both
notes routes (`apps/site/src/pages/notes/[...slug].astro` read +
`apps/site/src/pages/notes/[...slug]/edit.astro` edit) pass
`wide`. The Tailwind `prose` class is dropped from the wide path so
v2 typography tokens (`--font-size-body 15px`, `--font-size-b-p 14.5px`,
`--line-height-body 1.55`) are not shadowed by Tailwind Typography
preset rules. Add a `notes-doc-wrap` ID class on the wide the main element
purely for Playwright selector stability and dark-theme sanity probes
(no rules attach to the class itself; tokens already cascade from
`:root`). Author NEW Playwright spec
`apps/site/playwright/sample-blocks-read-no-edit-affordances.spec.ts`
implementing the D8 zero-affordance lock: read route MUST contain ZERO
of `[data-skb-drag-handle]` / `[data-skb-resize-handle]` /
`[data-skb-kebab-block-id]` / `.skb-live-announcer` /
`.skb-block-nodeview__gutter` / `.skb-block-nodeview__kind-chip` /
`.skb-editor-content` / `.ProseMirror`. Author NEW spec
`apps/site/playwright/notes-route-width-parity.spec.ts` implementing
the D10 width-parity lock at 4 viewports (1280 / 1024 / 768 / 375)
asserting `main.getBoundingClientRect().width` is equal between read
and edit within ±2px AT EACH viewport AND each width matches the
locked target measured during cf-23 EXECUTE TDD-write phase.
EXTEND `apps/site/playwright/sample-blocks-read.spec.ts` with one
typography-token assertion (read-route a `p.b-p` paragraph font-size resolves
to `--font-size-b-p` 14.5px, NOT Tailwind prose's 18px). Amend
`docs/decisions/ADR-0018-v2-visual-migration.md` to v0.7 with a NEW
D9 section "read-route visual contract" documenting (a) BaseLayout
`wide` opt-in pattern (b) intentional 28px an `h1` heading divergence from v2
`.doc-title` 13px gray (SKB knowledge-base prioritizes
document-outline semantics) (c) outer header/nav unchanged because
v2 reference does not specify a read-only outer shell (d) scope
boundary: `/` and `/search` routes stay narrow `prose max-w-3xl` (D2.b
explicitly rejected per orchestrator approval). Update
`apps/site/CONTRACT.md` to record the new BaseLayout `wide` prop +
the doc-wrap measurement table. Emit visual archive screenshots at
4 viewports for both routes
(`docs/audits/screenshots/wave-6-cf-23-after-{read,edit}-{1280,1024,768,375}.png`).

## files

8 source files (~280 LOC net add — tiny modification PR, mostly tests
+ ADR amendment + PR.md):

1. `apps/site/src/layouts/BaseLayout.astro` — **MODIFY** (~12 LOC delta).
   Accept new optional prop `wide?: boolean = false`. When `wide`,
   render the main element with className
   `mx-auto py-10 px-4 lg:px-12 notes-doc-wrap` and inline
   `style="max-width: 1180px;"`. When unset (default), preserve the
   existing `prose mx-auto max-w-3xl py-12 px-4` className for
   non-notes routes (`/`, `/search`). The `notes-doc-wrap` className
   is selector bait for Playwright + dark-mode probes; no CSS rules
   attach. Inline `style="max-width:..."` chosen over Tailwind
   `max-w-[1180px]` arbitrary value to keep the contract source
   visible (Tailwind arbitrary values get tree-shaken differently and
   surprise reviewers).

2. `apps/site/src/pages/notes/[...slug].astro` — **MODIFY** (~2 LOC
   delta). Pass `wide` to `<BaseLayout title={...} wide>`. No other
   change — the existing `<article><h1>...</h1><div class="skb-grid
   skb-prose"><Content/></div></article>` structure already works at
   the wider container width because grid columns are `1fr`-based.

3. `apps/site/src/pages/notes/[...slug]/edit.astro` — **MODIFY** (~2
   LOC delta). Pass `wide` to `<BaseLayout title={...} wide>`. No
   other change — `EditorShellMount` is responsive to its container
   width via the cf-20b grid layout substrate. The cf-20b
   `useResponsiveCols` breakpoints (≤1024 → 6col, ≤768 → 1col) still
   trigger off viewport (not container) per
   `apps/site/src/styles/grid.css:97-110`, so the wider container
   gets the same 12-col layout at desktop with no behavior change.

4. `apps/site/CONTRACT.md` — **MODIFY** (~30 LOC delta). Add a
   "Layout shell" section documenting the BaseLayout `wide?: boolean`
   prop + the doc-wrap measurement table (1280 / 1024 / 768 / 375
   measured widths from D10 lock). Cross-reference ADR-0018 v0.7 D9.

5. `docs/decisions/ADR-0018-v2-visual-migration.md` — **MODIFY** (NEW
   D9 section, ~80 LOC delta). Amendment header bumps version v0.6
   → v0.7. D9 "read-route visual contract" documents:
   - BaseLayout `wide` opt-in pattern (the doc-wrap shell)
   - intentional 28px an `h1` heading divergence from v2 `.doc-title` 13px
   - outer header/nav unchanged (v2 has no read-only outer shell spec)
   - scope boundary explicitly listing `/` and `/search` as
     intentionally narrow per orchestrator's D2.a approval
   - the measured 4-viewport doc-wrap width table (locked Playwright
     contract)
   - sister-doc updates: `apps/site/CONTRACT.md`

6. `apps/site/playwright/sample-blocks-read-no-edit-affordances.spec.ts`
   — **NEW** (~85 LOC). D8 zero-affordance lock. Asserts read route
   `/notes/sample-blocks` contains ZERO of:
   - `[data-skb-drag-handle]`
   - `[data-skb-resize-handle]`
   - `[data-skb-kebab-block-id]`
   - `.skb-live-announcer`
   - `.skb-block-nodeview__gutter`
   - `.skb-block-nodeview__kind-chip`
   - `.skb-editor-content`
   - `.ProseMirror`
   - `.skb-block-nodeview` (the editor-only wrapper class itself)

   AND asserts at least one `.skb-block-static` is present (positive
   chrome lock). Screenshot archive →
   `docs/audits/screenshots/wave-6-cf-23-no-edit-affordances.png`.

7. `apps/site/playwright/notes-route-width-parity.spec.ts` —
   **NEW** (~120 LOC). D10 width-parity lock. For each of 4
   viewports (1280, 1024, 768, 375):
   - navigate to `/notes/sample-blocks` → measure the main element width
   - navigate to `/notes/sample-blocks/edit` → measure the main element width
   - assert `Math.abs(read - edit) <= 2`
   - assert each absolute width matches the cf-23-locked target
     (lock target table written in TDD-front phase from after-state
     measurement; current numbers populated below in §Acceptance).

   Screenshot archives →
   `docs/audits/screenshots/wave-6-cf-23-after-{read,edit}-{viewport}.png`
   (8 archives; deletes the cf-23 BEFORE-state archives so post-PR
   the only artifacts are the AFTER state).

8. `apps/site/playwright/sample-blocks-read.spec.ts` — **MODIFY**
   (~25 LOC delta). EXTEND with one typography-token assertion: the
   first `<p class="b-p">` (or first a `p` paragraph if `b-p` not emitted) under
   `.skb-grid` resolves `font-size: 14.5px` (matches `--font-size-b-p`
   token; NOT Tailwind prose's 18px which would indicate the prose
   class was not stripped from the main element). Updates the file's header
   comment to note cf-23's typography-token addition.

9. `docs/plans/wave-6-main/wave-6-cf-23-read-mode-unification.md` —
   THIS file. ADR-0011 D2 schema, ~480 LOC.

10. `apps/site/playwright/visual-smoke-baseline/wave-6-cf-23-baseline-read-route.png`
    — **NEW** screenshot (visual smoke baseline at 1280px capturing
    the wide layout post-EXECUTE).

11. `packages/editor-shell/src/BlockNodeView.css` — **MODIFY** (~28 LOC
    delta — comment-heavy). Promote `.skb-block-nodeview__gutter`
    z-index from 4 → 60. EXECUTE-stage discovery: cf-23's wider layout
    shortened block heights enough that block N's downward-opening
    kebab menu reached into block N+1's vertical territory; block N+1's
    `.gblock-handle.bottom` (z-index 5) intercepted pointer events on
    menu items because the gutter at z=4 created a stacking context that
    capped its children's effective parent-stacking layer at 4 — losing
    to z=5 from any sibling-block resize handle. Promoting gutter to
    z=60 clears the entire resize-affordance z-stack (5 base + 51
    size-tooltip / right-handle label). Caught by
    `sample-blocks-kebab-menu.spec.ts` "Change-kind action" Playwright.

12. `packages/editor-shell/src/kebab/kebab-menu.css` — **MODIFY** (~22
    LOC delta — comment-heavy). Coordinate kebab menu z-index promotion
    with the gutter promotion above (10 → 60). Defense-in-depth: if a
    future change moves the menu out of the gutter (e.g. React Portal
    extraction), the menu carries its own elevation matching the
    expected gutter elevation.

## D2 trigger judgment

- **Row 1 (CONTRACT.md change in N packages)** — HIT: 1 CONTRACT.md
  modified (`apps/site/CONTRACT.md`).
- **Row 2 (NEW deps)** — N/A.
- **Row 3 (BlockKind / propsSchema / mdx-bridge change)** — N/A.
- **Row 4 (NEW ADR or amendment)** — HIT: ADR-0018 v0.6 → v0.7
  amendment (NEW D9 section).
- **Row 5 (cross-package: ≥ 3 packages)** — N/A: only 2 packages
  (`apps/site` + `@skb/editor-shell`) carry source deltas; threshold
  is ≥ 3.
- **Row 6 (visual contract change)** — HIT: page-shell layout +
  typography contract change on /notes/* routes; explicitly the kind
  of change ux-ui-lead is dispatched to author.
- **Row 8 (CI / deploy / auth / security)** — N/A.

Per CLAUDE.md `## Review workflow` + ADR-0011 D1 stage 4,
**PRE-COMMIT CLAUDE REVIEW (stage 4) fires** on Row 1 + Row 4 + Row 6.
ux-ui-lead authored this PLAN end-to-end per the cf-22 retrospective
rule (ux-ui-lead is dispatched at PLAN, not REVIEW). Stage 3
codex-pr-reviewer-55 review still required.

## ui_touch

`true` — `apps/site/src/layouts/BaseLayout.astro` matches the
ADR-0011 D9.1 path pattern; `apps/site/src/pages/notes/**.astro`
matches; the 3 new/modified Playwright specs under
`apps/site/playwright/**.spec.ts` count as visual-surface tests.

The 4-viewport visual sweep at EXECUTE stage emits 8 AFTER
screenshots (read + edit at 1280/1024/768/375) plus 1 baseline →
satisfies D9.5 archive obligation.

## e2e_smoke

- flow: `/notes/sample-blocks` (read route) renders the same
    `.skb-block-static` chrome as cf-20a (no chrome regression) inside
    the NEW v2-aligned 1180px doc-wrap. Page-level typography resolves
    `--font-size-body 15px` on the body element and `--font-size-b-p 14.5px`
    on prose paragraphs (NOT Tailwind prose's 18px), confirming the
    `prose` className was stripped from the main element on the wide path.
    Container width on 1280px viewport is the locked target (~1180px
    capped); on mobile (375px) container collapses naturally to
    viewport width minus `px-4` padding (~343px).
  target_url: /notes/sample-blocks
  playwright_spec: apps/site/playwright/sample-blocks-read.spec.ts:"sample-blocks read route shares v2 .gblock chrome via .skb-block-static (cf-20a single source) + cf-23 typography token assertion"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20a-sample-blocks-read.png (existing) + docs/audits/screenshots/wave-6-cf-23-after-read-1280.png (NEW)
  assertions:
    - cf-20a baseline (preserved): per-kind 2px stripe + 7 unique
       computed colors + card chrome + non-transparent surface
    - cf-23 NEW: `.skb-grid p.b-p` (or first `.skb-grid > * p`)
       computed font-size === 14.5px (matches --font-size-b-p; not 18px)
    - cf-23 NEW: the page's main element resolves
       `getBoundingClientRect().width` <= 1180 + 1 at 1280px viewport
       (wide layout active)
    - cf-23 NEW: the page's main element className includes
       `notes-doc-wrap` AND does NOT include `prose` AND does NOT
       include `max-w-3xl`

- flow: `/notes/sample-blocks` MUST contain zero edit-mode
    affordances. The read route's HTML must NEVER render the editor's
    `.skb-block-nodeview` wrappers, the LiveAnnouncer (cf-22), the
    drag-handle / resize-handle / kebab-menu buttons, or any
    ProseMirror-emitted DOM. This catches the regression where a
    future change accidentally mounts EditorShellMount on the read
    route or where someone copy-pastes editor chrome rules onto the
    static wrapper.
  target_url: /notes/sample-blocks
  playwright_spec: apps/site/playwright/sample-blocks-read-no-edit-affordances.spec.ts:"read route has zero edit-mode affordances (cf-23 D8 lock)"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-23-no-edit-affordances.png
  assertions:
    - count(`[data-skb-drag-handle]`) === 0
    - count(`[data-skb-resize-handle]`) === 0
    - count(`[data-skb-kebab-block-id]`) === 0
    - count(`.skb-live-announcer`) === 0
    - count(`.skb-block-nodeview`) === 0
    - count(`.skb-block-nodeview__gutter`) === 0
    - count(`.skb-block-nodeview__kind-chip`) === 0
    - count(`.skb-editor-content`) === 0
    - count(`.ProseMirror`) === 0
    - count(`.skb-block-static`) >= 8  (positive chrome lock — the
       sample-blocks fixture renders 14 component blocks all wrapped)

- flow: BOTH `/notes/sample-blocks` AND `/notes/sample-blocks/edit`
    resolve identical the main element widths at each of 4 viewports (1280 /
    1024 / 768 / 375). The cf-23 wide opt-in is a SHARED path on
    BaseLayout — both routes use it; if a future change splits them
    (e.g. drops `wide` from one route's pageshell), this spec catches
    the divergence. Locks each viewport's absolute width to the
    measured cf-23 EXECUTE-stage AFTER value so a future BaseLayout
    edit that silently changes the breakpoint padding fails CI.
  target_url: /notes/sample-blocks (+ /edit)
  playwright_spec: apps/site/playwright/notes-route-width-parity.spec.ts:"read and edit routes have parity main widths at 4 viewports (cf-23 D10 lock)"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-23-after-{read,edit}-{1280,1024,768,375}.png (8 archives)
  assertions:
    - viewport 1280 → read.mainWidth ~ edit.mainWidth (delta <= 2px)
       AND read.innerWidth ~ edit.innerWidth (delta <= 2px)
       AND read.mainWidth in [1176, 1184] (locked = 1180; max-width
       cap forces box to 1180; mx-auto centers)
       AND read.innerWidth in [1080, 1088] (locked = 1084; lg:px-12
       padding inside box deducts 96px from mainWidth)
    - viewport 1024 → read.mainWidth ~ edit.mainWidth (delta <= 2px)
       AND read.innerWidth ~ edit.innerWidth (delta <= 2px)
       AND read.mainWidth in [1020, 1028] (locked = 1024; box fills
       viewport)
       AND read.innerWidth in [924, 932] (locked = 928; lg:px-12
       padding deducts 96px)
    - viewport 768 → read.mainWidth ~ edit.mainWidth (delta <= 2px)
       AND read.innerWidth ~ edit.innerWidth (delta <= 2px)
       AND read.mainWidth in [764, 772] (locked = 768; box fills
       viewport)
       AND read.innerWidth in [732, 740] (locked = 736; px-4 padding
       deducts 32px)
    - viewport 375 → read.mainWidth ~ edit.mainWidth (delta <= 2px)
       AND read.innerWidth ~ edit.innerWidth (delta <= 2px)
       AND read.mainWidth in [371, 379] (locked = 375; box fills
       viewport)
       AND read.innerWidth in [339, 347] (locked = 343; px-4 padding
       deducts 32px)
    NOTE: Inner widths are LOCKED per cf-23 stage 3 R0 F2 tightening.
    Inner = `<main>.clientWidth - paddingLeft - paddingRight`,
    measured per viewport. A regression that changes `lg:px-12` →
    `lg:px-8` would shrink inner by 16px while leaving outer
    mainWidth unchanged; pre-R0 the spec only asserted outer and
    would have passed silently. Both outer and inner are now band-
    locked AND parity-locked so the doc-wrap padding contract is
    enforced.
    - At each viewport, scrollWidth === viewportWidth (exact equality;
       no horizontal overflow AND no shrinking-document regression
       per cf-23 R0 F1 tightening — pre-R0 was `<= viewportWidth`
       which would have masked a too-narrow `<html>` root)

## Why (user feedback)

Verbatim user directive from cf-22 close session:

> "把 edit 和正常模式风格统一一下" + "其他的全部对齐 v2"

cf-20a delivered chrome single-source (block surfaces aligned). The
session-start visual probe at cf-23 confirmed:

- Block surface: ALREADY aligned (border, radius, hover, per-kind
  stripe identical between routes).
- Page shell: BOTH routes constrained to 768px by Tailwind
  `prose mx-auto max-w-3xl py-12 px-4` on `BaseLayout.astro` line 77.
  v2 reference (`.doc-wrap` 1180px) does not match either.
- Typography: the main element carries Tailwind `prose` class which sets
  `font-size: 16px` overriding the `--font-size-body: 15px` :root
  token; same problem on both routes.

So "edit 和正常模式风格统一一下" is mostly DONE for surfaces; the
remaining gap is "BOTH routes' page shell + typography aligned to
v2 simultaneously". cf-23 closes this gap by introducing the BaseLayout
`wide` opt-in that BOTH notes routes pass — keeping them in lockstep
at the page-shell layer the same way cf-20a kept them in lockstep at
the block-chrome layer.

D2.b (widening `/` and `/search` too) was explicitly REJECTED per
orchestrator approval at cf-23 PLAN — out of scope to change unrelated
route layouts.

## Design source

- `/mnt/d/download/web/v2-styles.css:122-127` — canonical
  `.doc-wrap` definition: `max-width: 1180px; margin: 0 auto;
  padding: 40px 48px 200px; position: relative;`. cf-23's BaseLayout
  `wide` className `mx-auto py-10 px-4 lg:px-12` paired with inline
  `style="max-width: 1180px"` consumes this contract:
  - `mx-auto` → `margin: 0 auto`
  - `py-10` → `padding-top: 40px; padding-bottom: 40px`
     (v2 has 40px top, 200px bottom; bottom shortened to keep prose
     not floating in dead space at the bottom of long notes)
  - `lg:px-12` → desktop `padding-left: 48px; padding-right: 48px`
     (matches v2 horizontal padding)
  - `px-4` → mobile `padding-left: 16px; padding-right: 16px`
     (v2 reference is desktop-only; mobile-narrow keeps content readable)
  - `style="max-width: 1180px"` → v2 1180px ceiling
- `/mnt/d/download/web/v2-styles.css:30-36` — body typography
  contract: `font-size: 15px; line-height: 1.55; font-family: Inter`.
  Already in `:root` as `--font-size-body / --line-height-body /
  --sans` (cf-19 D2 + ADR-0018 D2). cf-23 dropping the Tailwind
  `prose` class on the wide path lets these tokens cascade into
  the main element correctly (currently shadowed by Tailwind's `font-size:
  16px` rule on the prose container).
- `/mnt/d/download/web/v2-styles.css:492-495` — `.b-p` contract:
  `font-size: 14.5px; line-height: 1.62; color: var(--text)`. Already
  in `apps/site/src/styles/prose.css:1-6` consuming `--font-size-b-p
  / --line-height-b-p`. cf-23 ensures this cascade is not shadowed
  by Tailwind prose's `prose-base` rule (`font-size: 1.125rem; /* 18px */`
  on `prose p`).
- ADR-0018 v0.6 D1-D8 (existing v2 visual contract) — cf-23 extends
  with NEW D9 read-route addendum.

## Decisions

### D1. Block chrome reuse strategy — CONFIRM cf-20a, no chrome changes

Authority: `packages/editor-shell/src/block-chrome.css` (cf-20a
single source, 132 LOC). Resolution: NO changes to chrome layer.
Visual probe at cf-23 PLAN session start confirmed
`.skb-block-static` already resolves identical chrome to
`.skb-block-nodeview` (paired selectors at lines 46-47, 75-106).
Per-kind 2px top stripe ✓ border-radius 7px ✓ white surface ✓
hover lift ✓ margin-block 8px ✓ — all 5 v2 chrome contracts hold
on read route.

### D2. Page-shell width + typography mismatch (THE REAL GAP)

Resolution: D2.a wide-layout opt-in. Modify
`apps/site/src/layouts/BaseLayout.astro` to accept `wide?: boolean`
prop. When `wide`, the main element becomes
`mx-auto py-10 px-4 lg:px-12 notes-doc-wrap` with inline
`style="max-width: 1180px"`. When unset, preserves the existing
`prose mx-auto max-w-3xl py-12 px-4` for non-notes routes (`/`,
`/search`).

D2.b REJECTED per orchestrator approval — widening all routes
risks breaking `/` index typography and `/search` results layout
which are out of cf-23 scope. Future cf-NN PRs can opt other routes
into `wide` if/when their visual contracts get reviewed.

The Tailwind `prose` class is dropped from the `wide` path because:
- Tailwind's `@tailwindcss/typography` preset injects
  `font-size: 1.125rem` (18px) on `prose p` (overrides
  `--font-size-b-p: 14.5px`)
- It injects `font-size: 1rem` (16px) on the `prose` container
  itself (overrides `--font-size-body: 15px` on `body`)
- The SKB v2 typography contract lives in design-tokens; Tailwind
  prose is a parallel typography system that would force per-rule
  battles. Cleaner to opt out for the v2-aligned route.

### D3. Typography/spacing tokens — NO new tokens

Resolution: consume existing v2 tokens already in
`packages/design-tokens/src/tokens.css`:
- `--font-size-body: 15px` (line 88)
- `--font-size-h1: 28px` (line 89)
- `--font-size-h2: 20px` (line 90)
- `--font-size-h3: 16px` (line 91)
- `--font-size-b-p: 14.5px` (line 92)
- `--font-size-b-code: 12.5px` (line 93)
- `--line-height-*` family
- `--font-weight-*` family
- `--letter-spacing-*` family

These already cascade through `apps/site/src/styles/global.css:69-104`
when not shadowed by Tailwind. Dropping `prose` from the main element (D2)
is sufficient for them to take effect on /notes/* routes.

### D4. Empty-state handling

Resolution: NO empty-state UI on read route. If a note has zero
component blocks, the read route renders the prose-only MDX body. If
it has zero MDX content too, just renders the `h1` heading element
containing the title. This
matches v2 reference which has no read-mode empty state spec
(`.doc-empty` in v2-styles.css:417-433 is editor-only, shown when
the editor surface is empty).

The edit-route's mount banner (per cf-18 EditorShellMount.tsx) is
edit-only — `EditorShellMount` is not imported on the read-route
path so the banner cannot leak. Verified by reading
`apps/site/src/pages/notes/[...slug].astro:1-25` which only imports
`getCollection / render / BaseLayout`.

### D5. Image/code/component block surfaces

Resolution: ALREADY uniform per cf-20a. Visual probe across all 14
sample-blocks confirmed every kind resolves identical chrome. Inner
RenderView components (CalloutBody, CodeBody, ImageBody, etc.) are
SHARED between read and edit paths — read calls them via
`makeMdxAdapter(RenderView, kind)`, edit calls them via
`BlockNodeView` mounting the same RenderView. So inner appearance
is structurally identical by construction; only the wrapper differs
(`.skb-block-static` vs `.skb-block-nodeview`).

### D6. Mobile/tablet responsive

Resolution: Wide layout collapses naturally on mobile via
`mx-auto` + `max-width: 1180px` (when viewport < 1180, the inner
content shrinks to viewport minus padding). The cf-20b grid.css
breakpoints (`≤1024px → 6col`, `≤768px → 1col + !important
flatten`) trigger off VIEWPORT not container, so they continue to
fire correctly inside the wider doc-wrap.

`lg:px-12` Tailwind modifier ensures desktop (≥1024px) uses 48px
horizontal padding (matching v2's `.doc-wrap padding: 40px 48px`);
mobile (`<1024px`) drops to `px-4` (16px) so the prose stays readable
at narrow widths. The D10 width-parity assertion locks this collapse
behavior at 4 viewports so a regression PR fails CI.

### D7. Color tokens

Resolution: shared. Both routes consume `:root` tokens from
`@skb/design-tokens/tokens.css` (already imported in
`global.css:1`). Dark theme already wired via `tokens-dark.css`
import (`global.css:2`). No new tokens. cf-23 EXECUTE phase will
visually verify dark mode does not regress (toggle dark, re-screenshot
at 1280px) but no dark-mode source changes.

### D8. No-affordance assertion (Playwright lock)

Resolution: NEW spec
`apps/site/playwright/sample-blocks-read-no-edit-affordances.spec.ts`
asserts read route DOM contains ZERO of:
- `[data-skb-drag-handle]` (cf-20c-2 drag handle)
- `[data-skb-resize-handle]` (cf-20d resize handle)
- `[data-skb-kebab-block-id]` (cf-20e kebab menu)
- `.skb-live-announcer` (cf-22 LiveAnnouncer)
- `.skb-block-nodeview__gutter`
- `.skb-block-nodeview__kind-chip`
- `.skb-editor-content`
- `.ProseMirror`
- `.skb-block-nodeview` (the editor-only wrapper class)

AND asserts `.skb-block-static` count >= 8 (positive lock that the
read route still wraps blocks).

Catches: future regression where someone (a) accidentally mounts
EditorShellMount on the read route, or (b) copy-pastes editor chrome
selectors onto the static wrapper, or (c) the cf-22 LiveAnnouncer
gets registered globally instead of editor-mount-scoped.

### D9. Close-ceremony fixture rep (ADR-0011 v0.2.2 D9.8)

Resolution: `sample-blocks` fixture already exercises the read
route via cf-20a's `sample-blocks-read.spec.ts`. cf-23 EXTENDS the
fixture's coverage with:
- D8 zero-affordance lock (NEW spec, dedicated)
- D10 4-viewport width-parity lock (NEW spec, both routes)
- typography-token assertion in EXTENDED cf-20a spec

Production rep PASS = each viewport's read route uses v2 chrome
with no edit affordances + the main element width matches the locked target
within ±2px + prose paragraphs resolve `--font-size-b-p 14.5px`.
This is the close-ceremony obligation per ADR-0011 v0.2.2 D9.8.

### D10. Width parity assertion at 4 viewports (REFINED per orchestrator plan-challenger; tightened per stage 3 R0 F1+F2)

Resolution: NEW spec
`apps/site/playwright/notes-route-width-parity.spec.ts` measures
BOTH `main.getBoundingClientRect().width` (outer box) AND
`main.clientWidth - paddingLeft - paddingRight` (inner content
area) on BOTH routes at each of 4 viewports (1280, 1024, 768,
375). Asserts 12 invariants per viewport (3 outer + 3 inner +
2 scrollWidth + 4 band-locks = 12 × 4 viewports = 48 total
assertions in the spec):

(a) Outer parity: `Math.abs(read.mainWidth - edit.mainWidth) <= 2`
    at EACH viewport (4 paired delta assertions).

(a') Inner parity: `Math.abs(read.innerWidth - edit.innerWidth) <= 2`
    at EACH viewport (4 paired delta assertions; cf-23 R0 F2 lock
    ensures padding spec holds across both routes — pre-R0 a future
    edit-only padding override would have passed silently).

(b) Each absolute outer width matches the cf-23-locked target:
    - 1280 → read.mainWidth in [1176, 1184] (locked = 1180; max-width cap)
    - 1024 → read.mainWidth in [1020, 1028] (locked = 1024; box fills viewport)
    - 768 → read.mainWidth in [764, 772] (locked = 768; box fills viewport)
    - 375 → read.mainWidth in [371, 379] (locked = 375; box fills viewport)

(b') Each absolute inner width matches the cf-23-locked target
    (cf-23 R0 F2 lock; locks the lg:px-12 / px-4 padding spec —
    a regression like `lg:px-12` → `lg:px-8` would shrink inner
    by 16px while leaving outer mainWidth unchanged):
    - 1280 → read.innerWidth in [1080, 1088] (locked = 1084; lg:px-12 = 96 deducted)
    - 1024 → read.innerWidth in [924, 932] (locked = 928; lg:px-12 = 96 deducted)
    - 768 → read.innerWidth in [732, 740] (locked = 736; px-4 = 32 deducted)
    - 375 → read.innerWidth in [339, 347] (locked = 343; px-4 = 32 deducted)

(c) `document.documentElement.scrollWidth === window.innerWidth`
    at each viewport (cf-23 R0 F1 tightening: exact equality, NOT
    `<=`; catches both horizontal-overflow regressions per cf-20b
    R1 lesson AND shrinking-document regressions where the `<html>`
    root is narrower than the viewport).

Locked target values from EXECUTE TDD-write phase running against
the preview server. Pre-EXECUTE BEFORE state (captured for
reference) showed BOTH routes at 768px on viewports 1280/1024/768
(naive Tailwind max-w-3xl); 375px on viewport 375 (mobile collapse).

Catches: future BaseLayout regression that silently changes one
route's wrapper without the other (the cf-23 wide opt-in becomes
a TWO-line touch — both notes routes pass the prop; if a future
PR drops `wide` from one route, this spec fails CI).

## Acceptance

### AC-1: BaseLayout `wide` prop accepted and threaded through both notes routes

Verify:
- `apps/site/src/layouts/BaseLayout.astro` accepts `wide?: boolean`
  prop (TypeScript interface `Props { title: string; wide?: boolean }`)
- `apps/site/src/pages/notes/[...slug].astro` passes `wide`
- `apps/site/src/pages/notes/[...slug]/edit.astro` passes `wide`
- `apps/site/src/pages/index.astro` does NOT pass `wide` (regression
  defense — non-notes routes stay narrow; verify by grepping `wide`
  occurrences across `apps/site/src/pages/**/*.astro`)
- `apps/site/src/pages/search.astro` does NOT pass `wide` (same)

### AC-2: Wide path drops `prose` className AND adds `notes-doc-wrap` className AND inline `max-width: 1180px`

Verify via Playwright on `/notes/sample-blocks`:
- the main element's `className` includes `notes-doc-wrap`
- the main element's `className` does NOT include `prose`
- the main element's `className` does NOT include `max-w-3xl`
- the main element's `style.maxWidth === "1180px"` OR computed
  `getComputedStyle(main).maxWidth === "1180px"`

### AC-3: D8 zero-affordance lock passes

`pnpm exec playwright test sample-blocks-read-no-edit-affordances.spec.ts`
PASS — read route renders zero of the 9 forbidden selectors AND >= 8
`.skb-block-static` wrappers.

### AC-4: D10 width-parity lock passes at 4 viewports (outer + inner)

`pnpm exec playwright test notes-route-width-parity.spec.ts` PASS —
all 4 viewports pass paired delta + outer locked-target + inner
locked-target + exact-equal scrollWidth-to-viewportWidth assertions
(8 paired width assertions per viewport: 4 outer + 4 inner; ±4px
tolerance band, ±2px parity tolerance). Locked target values from
EXECUTE TDD-write phase + cf-23 stage 3 R0 F1+F2 tightening:

| Viewport | outer mainWidth (locked) | inner content width (locked, R0 F2) |
| --- | ---: | ---: |
| 1280 | 1180 ±4 (max-width cap) | 1084 ±4 (lg:px-12 inside) |
| 1024 | 1024 ±4 (box fills viewport) | 928 ±4 (lg:px-12 inside) |
| 768 | 768 ±4 (box fills viewport) | 736 ±4 (px-4 inside) |
| 375 | 375 ±4 (box fills viewport) | 343 ±4 (px-4 inside) |

scrollWidth assertion: `scrollWidth === viewport.innerWidth` (exact
equality per cf-23 R0 F1; pre-R0 was `<= innerWidth` which would
have masked a shrinking-document regression).

### AC-5: Typography-token assertion passes (no Tailwind prose shadow)

`pnpm exec playwright test sample-blocks-read.spec.ts` PASS — the
EXTENDED spec resolves `--font-size-b-p 14.5px` on the first prose
a `p` paragraph (NOT 18px which would indicate Tailwind prose still active).

### AC-6: 4-viewport AFTER-state visual archive emitted

8 screenshot files exist post-EXECUTE:
- `docs/audits/screenshots/wave-6-cf-23-after-read-1280.png`
- `docs/audits/screenshots/wave-6-cf-23-after-read-1024.png`
- `docs/audits/screenshots/wave-6-cf-23-after-read-768.png`
- `docs/audits/screenshots/wave-6-cf-23-after-read-375.png`
- `docs/audits/screenshots/wave-6-cf-23-after-edit-1280.png`
- `docs/audits/screenshots/wave-6-cf-23-after-edit-1024.png`
- `docs/audits/screenshots/wave-6-cf-23-after-edit-768.png`
- `docs/audits/screenshots/wave-6-cf-23-after-edit-375.png`

Each ≥ 5 KB (per existing visual-archive size convention).

The cf-23 BEFORE-state archives
(`docs/audits/screenshots/wave-6-cf-23/before-*.png`) MAY be retained
in PR.md history but the directory itself is deleted at COMMIT to
keep `docs/audits/screenshots/` clean. The AFTER archives live at
the top level of `docs/audits/screenshots/` with `wave-6-cf-23-`
prefix (matching the existing convention).

### AC-7: ADR-0018 amended to v0.7 with NEW D9 section

`docs/decisions/ADR-0018-v2-visual-migration.md` header bumped from
`v0.6` → `v0.7` with a NEW D9 section ≥ 60 LOC documenting:
- BaseLayout `wide` opt-in pattern
- 28px an `h1` heading divergence rationale
- Outer header/nav unchanged rationale
- D2.b explicit rejection (scope boundary)
- 4-viewport doc-wrap measurement table (locked Playwright contract)
- Sister-doc list (`apps/site/CONTRACT.md`)

### AC-8: apps/site/CONTRACT.md updated with Layout shell section

`apps/site/CONTRACT.md` includes a NEW "Layout shell" section
documenting BaseLayout `wide` prop + the doc-wrap measurement
table + cross-reference to ADR-0018 v0.7 D9.

### AC-9: pnpm check passes

`cd /home/weiyi/selfKnowledgeBaseWeb && pnpm check` PASS — lint +
typecheck + test + build + size-check all green. Strict requirement
per CLAUDE.md ## Hard rules #4.

### AC-10: pnpm link-check passes

`pnpm link-check` PASS — no broken links introduced by the ADR
amendment + PR.md + CONTRACT.md updates.

### AC-11: No regression on cf-20a chrome lock

`pnpm exec playwright test sample-blocks-read.spec.ts` cf-20a
chrome assertions still PASS (cf-23 ADDS one assertion; does not
modify the 8 existing assertions). Specifically the per-kind 2px
stripe + 7 unique colors + card chrome + non-transparent surface
all hold.

### AC-12: cf-22 keyboard a11y spec still PASSes (LiveAnnouncer regression check)

`pnpm exec playwright test sample-blocks-keyboard-a11y.spec.ts`
PASS — D8 forbidden-selector list includes `.skb-live-announcer`;
this AC-12 confirms the cf-22 announcer is still mounted ONLY on
the EDIT route (cf-23 D8 spec verifies it is NOT on the read route).

## Reflection landing

cf-23 closes the page-shell layer of "全部对齐 v2" — cf-20a closed
the block-surface layer; cf-23 closes the page-shell layer.
Remaining v2 alignment items (left-rail palette / top-bar editor
chrome at editor route) are cf-24+ territory per the
orchestrator's locked 9-PR cf-20+ sequence.

Lessons applied from prior PRs:
- **cf-20b R1 horizontal-overflow lesson**: D10 (c) asserts
  `scrollWidth === viewportWidth` at every viewport so a regression
  fails immediately. cf-20b R1 caught the 6450px overflow
  post-merge; cf-23 catches BEFORE merge. (Spec variable renamed
  `innerWidth` → `viewportWidth` in cf-23 R1 measure helper to
  disambiguate from the main element's inner-content width
  introduced by R0 F2.)
- **cf-20a single-source pattern**: cf-23 keeps the same shared-prop
  pattern — `wide` lives on BaseLayout, BOTH notes routes pass it.
  No per-route copy-paste of layout className.
- **cf-22 retrospective (ux-ui-lead at PLAN, not REVIEW)**:
  ux-ui-lead authored this PLAN end-to-end; codex-pr-reviewer-55
  reviews EXECUTE artifacts.

## Out-of-scope

Per orchestrator approval at cf-23 PLAN:

- **Dark-mode styling changes**: out. cf-23 verifies no visible
  regression but does not modify `tokens-dark.css` or any dark-mode
  rule. Future cf-NN can audit dark-mode against v2 reference if/when
  v2 adds a dark variant (current `/mnt/d/download/web/v2-styles.css`
  is light-only).
- **v2-style `.doc-title` (gray 13px label)**: out. SKB read route
  keeps the 28px `h1` heading rendering `{note.data.title}`. ADR-0018 v0.7 D9
  documents this divergence rationale (knowledge-base prioritizes
  document-outline semantics over editor-mock chrome).
- **v2-style left-rail palette + top-bar editor chrome**: out.
  cf-24+ territory per the orchestrator's 9-PR sequence. cf-23 is
  scoped to the page-shell layer ONLY.
- **`/` and `/search` route widening (D2.b)**: out. Explicitly
  rejected by orchestrator. Other routes stay narrow `prose
  max-w-3xl`. Future cf-NN can opt them in if/when their visual
  contracts get reviewed.
- **Tailwind `prose` removal from non-notes routes**: out. Only
  `/notes/*` opts out. The `prose` class still applies to `/`,
  `/search`, and any other route that uses BaseLayout without
  `wide`.
- **Touch / mobile drag implementation**: out (already out per
  ADR-0017 D9 mobile-view-only). cf-23's D8 spec confirms ZERO
  drag handles on read route across all 4 viewports.

## Related

- ADR-0018 v0.6 (v2 visual migration; cf-23 amends to v0.7)
- ADR-0017 D9 (mobile view-only contract; D8 spec confirms read-route
  zero-affordance at all viewports including 375)
- ADR-0011 v0.2.2 D9.8 (close-ceremony fixture-representativeness;
  cf-23 D9 satisfies via sample-blocks rep)
- ADR-0011 D2 (this PR.md schema)
- cf-20a (block-chrome single source — cf-23's "ALREADY aligned"
  baseline that this PR builds on)
- cf-20b (responsive grid breakpoints — cf-23 verifies they continue
  to fire correctly inside the wider doc-wrap)
- cf-22 (keyboard a11y — cf-23 D8 confirms LiveAnnouncer is
  edit-only)
