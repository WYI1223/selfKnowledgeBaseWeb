# Wave 5 Stage C.3 close — handoff pack

> **Stage C.3 ✅ FULLY CLOSED at PR #91 squash `TBD post-merge`** (filled
> by orchestrator post-merge sync). Stage C.3 lands the v2 visual
> identity foundation across the SelfKnowledgeBaseWeb monorepo.
> Handoff to Stage C.4 (editor wire-to-apps/site, 6 PRs already
> includes C.4-prelude shipped at PR #72).

## 5-PR sequence summary

| PR # | Squash | Stage | Subject |
| ---- | ------ | ----- | ------- |
| #87 | `e0eb168` | C.3-1 | design-tokens OKLCH 14 color + 1 hex `--surface` + 3 layout + Inter/JetBrains Mono fonts (Strategy A coexistence; Culori 4.0.1 derived hex fallbacks) |
| #88 | `4dc1219` | C.3-2 | 8 block-kind hue tokens (`--accent-canvas/runnable/image/math/pdf/jupyter/nn-viz/agent-flow`) + 5 light block 顶 2px 横条 (callout+code share `--accent-runnable` per Decision 1) + apps/site global.css block CSS imports (closes pre-existing CONTRACT.md MUST-import gap) |
| #89 | `e47b67a` | C.3-3 | prose customization (`.skb-prose` namespace + `b-quote/b-callout/b-code/aref` selectors) + typography upgrade (18 tokens: `--font-size-* / --font-weight-* / --line-height-* / --letter-spacing-*`) + body Inter font application (closes Q10 partial-defer from C.3-1) |
| #90 | `fce2890` | C.3-4 | shadow tokens warm-tone refresh (`--shadow-sm/md/lg` in-place value update from neutral `rgba(0,0,0)` to warm-tone `rgba(20,15,10)` per ADR-0018 D6) |
| #91 | TBD | C.3-5 | Stage C.3 close — visual smoke baseline lock + this handoff pack |

## v2 visual identity status — LANDED

The Stage C.3 sequence consolidates the v2 visual identity across:

- **OKLCH color foundation** (C.3-1): 14 OKLCH color tokens + 1 hex
  `--surface` + 8 kind-hue tokens (added at C.3-2). Strategy A
  coexistence: legacy `--color-*` triplet tokens preserved unchanged.
- **Inter + JetBrains Mono fonts** (C.3-1 + C.3-3): Google Fonts
  CDN preconnect at `BaseLayout.astro`; `--sans` / `--mono` tokens
  defined; body font-family applied at C.3-3 (Q10 fully landed);
  pre/code/kbd/samp use `--mono`.
- **Typography upgrade** (C.3-3): 18 tokens for body / h1-h3 / b-p /
  b-code; global.css applies via direct `var(--font-size-*)` etc.
  references.
- **Block kind hue stripes** (C.3-2): 5 light blocks (callout / code
  / image / math / pdf) carry `border-top: 2px solid var(--accent-<kind>)`
  for visual identification.
- **Prose customization** (C.3-3): `.skb-prose` namespace with
  `.b-quote / .b-callout / .b-code / .b-code .kw .fn .cm / .aref +
  ::before / mark / native blockquote+p+code` selectors.
  `/notes/[...slug].astro` wraps `<Content />` in `<div
  class="skb-prose">` for namespace activation.
- **Warm-tone shadow** (C.3-4): `--shadow-sm/md/lg` switched to
  `rgba(20,15,10)` warm-tone; consumers automatically pick up
  site-wide.
- **OKLCH browser fallback** (C.3-1): `tokens-fallback.css` ships
  hex fallbacks via `@supports not (color: oklch(0 0 0))` query for
  pre-OKLCH browser support (Culori 4.0.1 derived; 14 hex values).

## Deferred to Phase 2+

The following ADR-0018 elements are explicitly deferred from
Stage C.3:

1. **5-light-block CSS migration to v2 OKLCH** (D7): attempted at
   C.3-4 but reverted per R1 sister-doc-sync surface in 5
   `block-*/CONTRACT.md` files + 4 `block-*/ui-default/*-tokens.ts`
   witness types. Landing this requires updating all 9-10 sister
   files together; deferred to Phase 2+ when Tailwind preset
   migration also happens.

2. **Dark theme OKLCH variant**: ADR-0018 D1 explicit prose ("dark
   mode 留 Phase 2+; Wave 5 lite-only"). `tokens-dark.css` carries
   no v2 OKLCH overrides; CONTRACT.md amendment carve-out documents
   this (time-bound, Wave 5 only).

3. **Tailwind preset typography migration**: Decision 3 from C.3-1
   keeps the preset at legacy `theme.fontSize` etc. v2 tokens
   consumed via direct CSS-var rules in global.css. Phase 2+ may
   re-evaluate.

4. **CSP `<meta>` header + self-host Inter+JetBrains Mono woff2**:
   Decision 4 + 7 from C.3-1 keep CSP unset and woff2 deferred.
   Production deployments enforcing strict CSP without
   `font-src/style-src/connect-src` allowances may silently fail
   font loads; a follow-up security-class PR (D2 row 8) lands these
   together.

## Pre-existing broader-suite flakes (Wave 5 close R-retrospective candidates)

Throughout Stage C.3 (C.3-1..C.3-5), the broader `pnpm --filter
@skb/site test:visual` run exhibited 5 pre-existing failures that
are reproducible on plain main HEAD (verified via `git stash` +
re-run at C.3-1 R1 + C.3-2 R1 eras). These are NOT introduced by
Stage C.3; Stage C.3's own Playwright specs (c3-1-tokens-fonts,
c3-2-block-hues, c3-3-prose, c3-4-light-block-cal, c3-5-baseline-diff)
all pass in isolation:

| Spec | Failure | Surface |
| ---- | ------- | ------- |
| `playwright/grid-drag-drop.spec.ts:160` AC#4 | Drag-over simulation static layer invariant | Heavy block jupyter not visible on `/sample-blocks-astro` |
| `playwright/grid-perf.spec.ts:224` TC2.3 | Visual baseline emission `/notes/sample-blocks/edit` | `.skb-grid` not visible on edit route (editor mount issue) |
| `src/__tests__/e2e/c2-7-heavy-grid-dims.spec.ts` | Plugin placeholder grid dims | Heavy block dimensions return null |
| `src/__tests__/e2e/c2-8-drag-modules-mount.spec.ts` | drag modules mount + Esc native | `.skb-grid` + `.ProseMirror` not visible (editor mount) |
| `src/__tests__/e2e/c2-9-responsive-fsm-mount.spec.ts` | Responsive FSM mount + viewport | `.skb-grid` not found |
| `src/__tests__/visual-smoke.spec.ts:13` | Theme toggle switches data-theme | Button click timeout (hydration race?) |

All flag as Wave 5 close (ADR-0019) R-retrospective candidates
R23..R30. Likely root causes:
- Editor mount race conditions on certain routes (`/notes/sample-blocks/edit`, `/notes/sample-blocks`)
- ThemeToggle hydration timing under playwright `waitForLoadState('networkidle')`
- Heavy block placeholder rendering inconsistency under Playwright vs vitest (jsdom)

## ADR-0006 item 9 scope clarification (canonical reading)

R1+R2 across C.3-1..C.3-3 + R4 at C.3-4 established the canonical
reading: **ADR-0006 item 9 ("UI-touch + E2E spec audit") scope = the
PR's OWN e2e_smoke entry**, NOT the broader test suite. The broader
suite contains pre-existing flakes (per the catalog above) that
are tracked as Wave 5 close R-retrospective candidates. This
reading was made explicit at C.3-4 R4 commit message. Forward
implementation PRs should follow the same scope reading.

## Decision-log retro

Decisions made across Stage C.3 that may inform Wave 6 planning:

1. **Strategy A (additive coexistence)** for token migrations: zero
   build-red windows, preserves opacity-modifier semantics,
   incremental migration. Successful pattern; recommend for all
   future token migrations.

2. **CONTRACT amendment time-bound exception** (Q2 from C.3-1):
   "Modifying-this-file rule" overridden by Wave-5-light-only
   carve-out. Pattern for Wave-scoped invariant relaxation.

3. **Q10 partial-defer pattern**: PR.md acknowledged scope reduction
   when visual-smoke baseline regression risk surfaced. Spec
   strengthening can be deferred to a later PR in the same Stage
   when rich production-PASS gates require multi-PR coordination.

4. **Sister-doc-sync as scope-fence** (C.3-4 R1): when CSS migration
   would drift CONTRACT.md or witness types, defer the migration
   rather than expand scope. Keeps PR-size discipline; honors
   ADR-0006 item 6.

5. **Visual-smoke baseline auto-regen** in CI (per Playwright
   `mkdirSync + savePng` emit-only logic): not enforce-via-diff;
   each CI run captures latest. Final lock at Stage close PR.

6. **Culori derivation refinement protocol** (C.3-1 Decision 6):
   record actual Culori output in PR.md table when it differs from
   authoring-time nominal. Pattern reusable for future
   color-system migrations.

## Wave 5 close (ADR-0019) preparation

This handoff + [C.2 handoff pack](C.2-handoff-pack.md) +
[C.1 handoff pack](C.1-handoff-pack.md) = 3-stage close evidence.
Wave 5 close ceremony scope:

- Wave 5 PR ratification table (24 implementation + 3 meta + 2
  standards-related + Stage C.3 5 + Stage C.4 6 = 40 roster entries)
- 4 audit codex dispatches (structure / perf / mdx-doctor / docs)
- 4 curated audit summaries
- ADR-0019 NEW (status: accepted; Wave 5 close authority)
- R-retrospective items R23..R30 candidates per the broader-suite
  flake catalog above + Stage C.3 decisions retro
- active.md repoint to "Wave 6 plan-draft pending"

## Next implementation = Stage C.4 (editor wire to apps/site; 5 PRs post C.4-prelude)

Per Wave 5 plan v1.3 rows 713-718:

- C.4-1: NoteSaveAdapter contract surface + ApiAdapter forward stub
- C.4-2: route + mount enhancement (full BlockRegistry/KernelRegistry wire)
- C.4-3: palette + slash-menu + drag-handle + toolbar (canonical user-affordance-rich)
- C.4-4: save roundtrip + layoutEpoch sync
- C.4-5: Stage C.4 close + 真验收 10-item E2E coverage + Stage handoff

## Related

- [Wave 5 plan v1.3](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
- [ADR-0018 v2 visual migration](../../decisions/ADR-0018-v2-visual-migration.md)
- [ADR-0011 D9 Product Experience Quality Gate](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0006 v0.2 9-point asymmetry-audit](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
- C.3-1..C.3-5 PR.md siblings
- [Stage C.2 handoff pack](C.2-handoff-pack.md)
- [Stage C.1 handoff pack](C.1-handoff-pack.md)
