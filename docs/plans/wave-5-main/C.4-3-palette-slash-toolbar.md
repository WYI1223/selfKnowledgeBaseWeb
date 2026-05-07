# C.4-3 — palette + slash-menu + drag-handle + toolbar + Edit Mode banner + save indicator (canonical user-affordance-rich PR)

> **Wave 5 Stage C.4 3rd implementation PR** (per Wave 5 plan v1.3
> row C.4-3, line 716; v1.3 R14 retrofit catalog § C.4-3 lines
> 626-635, 6 e2e_smoke entries). **Closes the "看不到一点进步" 闭环点**:
> lands all 6 user-visible editor affordances missing at C.4-prelude
> + verified via 6 Playwright specs. **PRE-COMMIT CLAUDE REVIEW
> (D1 stage 4) FIRES** per `## D2 trigger judgment` (Row 1
> CONTRACT.md change in @skb/editor-shell + Row 5 cross-package).

## title

Land 6 user-visible editor affordances at `@skb/editor-shell`:
palette / slash-menu / drag-handle / toolbar / Edit Mode banner /
save state indicator. Wire all 6 into apps/site `EditorShellMount.tsx`
mount. Sister-doc-sync `packages/editor-shell/CONTRACT.md` adding
public surface section for each affordance + W5-2 invariant
update for palette+slash insertion path. 6 NEW Playwright specs at
`apps/site/src/__tests__/e2e/c4-3-{palette,slash-menu,drag-handle,toolbar,banner,save-indicator}.spec.ts`
verifying each affordance per v1.3 retrofit catalog § C.4-3.

## files

~14-18 files modified/created (~400 LOC budget per plan v1.3 row C.4-3):

1-6. `packages/editor-shell/src/palette.tsx` + `slash-menu.tsx` +
    `drag-handle.tsx` + `toolbar.tsx` + `edit-mode-banner.tsx` +
    `save-indicator.tsx` — **NEW** (each ~40-80 LOC). Minimal
    React components implementing the 6 affordances per ADR-0017
    + ADR-0018 visual specs:
   - **Palette**: opens via Ctrl/Cmd+K shortcut; renders block
     kind list (8 kinds: callout/code/image/math/pdf/jupyter/nn-viz/agent-flow);
     selecting kind inserts new block via Tiptap commands +
     mdx-bridge serialization.
   - **Slash menu**: '/' keystroke at line start opens dropdown
     listing block kinds; arrow keys navigate; Enter inserts.
   - **Drag handle**: per-block UI element (left margin) visible
     on hover; drag triggers existing C.2-5/C.2-8 drag/drop
     pipeline (DropPulse + DragGhost + outline-overlay).
   - **Toolbar**: floating toolbar with bold (B) + italic (I)
     buttons; toggles Tiptap marks; visible when text selection
     spans non-empty range.
   - **Edit Mode banner**: top-of-page banner visible only on
     `/notes/<slug>/edit` route (not on `/notes/<slug>`); cream
     accent background + "Edit Mode" prose.
   - **Save indicator**: shows "Saving..." / "Saved at HH:MM" /
     "Unsaved changes" states based on LocalStorageAdapter + 800ms
     debounce timer state.

7. `packages/editor-shell/src/registry-wire.tsx` — **NEW** (~50 LOC).
    Composition glue exposing a `wireRegistry({ blockRegistry,
    kernelRegistry, palette, slashMenu, dragHandle, toolbar,
    editModeBanner, saveIndicator })` factory that EditorShellMount
    consumes for full editor wire-up.

8. `packages/editor-shell/src/index.ts` — **MODIFY** (~10 LOC).
   Re-export 6 new affordances + registry-wire.

9. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~30 LOC).
   Append `### C.4-3 user-affordance public surface` section:
   palette / slash-menu / drag-handle / toolbar / edit-mode-banner /
   save-indicator each with brief contract.

10. `packages/editor-shell/src/__tests__/affordances.test.ts` —
    **NEW** (~80 LOC). Vitest unit suite covering 6 affordances'
    component-level rendering (without full Tiptap integration).

11. `apps/site/src/components/EditorShellMount.tsx` — **MODIFY**
    (~20 LOC). Wire all 6 affordances via `wireRegistry()`; pass
    save state from existing 800ms debounce timer; pass Edit Mode
    detection from route prop.

12-17. `apps/site/src/__tests__/e2e/c4-3-{palette,slash-menu,drag-handle,toolbar,banner,save-indicator}.spec.ts`
    — **NEW** (each ~40-60 LOC). 6 Playwright specs per v1.3
    retrofit catalog § C.4-3 entries 1-6 verbatim.

18. `docs/plans/wave-5-main/C.4-3-palette-slash-toolbar.md` —
    **NEW** (PR.md self).

19-24. `docs/audits/screenshots/wave-5-c4-3-{palette,slash-menu,drag-handle,toolbar,banner,save-indicator}.png` —
    **NEW** (6 screenshots; each ≥5KB per D9.5).

## D2 trigger judgment

Row 1 (CONTRACT.md change in @skb/editor-shell) + Row 5 (cross-package: editor-shell + apps/site). PRE-COMMIT CLAUDE REVIEW fires.

## ui_touch

`true` — `packages/editor-shell/src/**` + `apps/site/src/components/**` matches.

## e2e_smoke

Per v1.3 retrofit catalog § C.4-3 (lines 626-635 verbatim) — 6 entries (each as separate bullet block per check-e2e-coverage.ts parser shape):

- flow: palette opens via shortcut + lists block kinds
  target_url: /notes/<slug>/edit
  playwright_spec: apps/site/src/__tests__/e2e/c4-3-palette.spec.ts:"palette opens via shortcut + lists block kinds"
  screenshot_archive: docs/audits/screenshots/wave-5-c4-3-palette.png

- flow: slash menu (/) opens + selecting kind inserts new block
  target_url: /notes/<slug>/edit
  playwright_spec: apps/site/src/__tests__/e2e/c4-3-slash-menu.spec.ts:"slash menu (/) opens + insert block on kind select"
  screenshot_archive: docs/audits/screenshots/wave-5-c4-3-slash-menu.png

- flow: drag-handle visible per block + drag triggers grid drop preview
  target_url: /notes/<slug>/edit
  playwright_spec: apps/site/src/__tests__/e2e/c4-3-drag-handle.spec.ts:"drag-handle visible per block + drag triggers grid drop preview"
  screenshot_archive: docs/audits/screenshots/wave-5-c4-3-drag-handle.png

- flow: toolbar bold/italic buttons toggle Tiptap marks
  target_url: /notes/<slug>/edit
  playwright_spec: apps/site/src/__tests__/e2e/c4-3-toolbar.spec.ts:"toolbar bold/italic toggles Tiptap marks"
  screenshot_archive: docs/audits/screenshots/wave-5-c4-3-toolbar.png

- flow: Edit Mode banner visible distinguishing /notes/<slug>/edit from /notes/<slug>
  target_url: /notes/<slug>/edit
  playwright_spec: apps/site/src/__tests__/e2e/c4-3-banner.spec.ts:"Edit Mode banner visible on /notes/<slug>/edit not on /notes/<slug>"
  screenshot_archive: docs/audits/screenshots/wave-5-c4-3-banner.png

- flow: save state indicator shows saving → saved transitions on edit
  target_url: /notes/<slug>/edit
  playwright_spec: apps/site/src/__tests__/e2e/c4-3-save-indicator.spec.ts:"save state indicator transitions saving → saved on edit"
  screenshot_archive: docs/audits/screenshots/wave-5-c4-3-save-indicator.png

## decision-log

### Decision 1 — Affordance scope minimal-but-functional

Each of the 6 affordances ships at MINIMUM functional level: components mount + basic interactions work + Playwright spec asserts visible behavior. Polish (animation tuning / a11y refinement / mobile layout) deferred to Phase 2+ unless trivially achievable inside the LOC budget.

### Decision 2 — Tiptap integration via existing EditorShell

palette + slash-menu + toolbar consume Tiptap editor instance from existing EditorShell.tsx via React context OR explicit prop drilling. drag-handle wires into existing C.2-5/C.2-8 drag/drop pipeline. save-indicator reads from existing 800ms debounce timer state. Edit Mode banner reads from a new `editMode: boolean` prop on EditorShellMount.

### Decision 3 — Visual baseline regen at C.4-3

Adding 6 visible affordances changes /notes/<slug>/edit visual baseline. Visual-smoke baselines regen automatically per Playwright emit-only spec; final lock at C.4-5 Stage close per ADR-0018 AC#8.

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts
pnpm exec tsx scripts/check-e2e-coverage.ts
# Expected: ui_touch=true; 6 e2e entries verified
```

```bash
# AC-2: 6 affordance components exist
for f in palette.tsx slash-menu.tsx drag-handle.tsx toolbar.tsx edit-mode-banner.tsx save-indicator.tsx; do
  test -f "packages/editor-shell/src/$f" || { echo "MISSING $f"; exit 1; }
done
echo "all 6 affordances present"
```

```bash
# AC-3: 6 Playwright specs exist
for s in palette slash-menu drag-handle toolbar banner save-indicator; do
  test -f "apps/site/src/__tests__/e2e/c4-3-$s.spec.ts" || { echo "MISSING c4-3-$s.spec.ts"; exit 1; }
done
echo "all 6 specs present"
```

```bash
# AC-4: 6 screenshots present + each ≥5KB
for s in palette slash-menu drag-handle toolbar banner save-indicator; do
  test -s "docs/audits/screenshots/wave-5-c4-3-$s.png" || { echo "MISSING $s screenshot"; exit 1; }
  bytes=$(stat -c '%s' "docs/audits/screenshots/wave-5-c4-3-$s.png")
  [ "$bytes" -ge 5120 ] || { echo "$s screenshot too small: $bytes bytes"; exit 1; }
done
echo "all 6 screenshots ≥5KB"
```

```bash
# AC-5: pnpm check exit 0
pnpm check
```

```bash
# AC-6: anti-leak (char-class [:])
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.4-3-palette-slash-toolbar.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **Save roundtrip e2e**: deferred to C.4-4 (full save/load wire + layoutEpoch sync).
- **真验收 10-item E2E coverage**: deferred to C.4-5 Stage close.
- **Mobile/responsive layout polish**: Phase 2+.
- **a11y / keyboard navigation full audit**: Phase 2+.
- **Animation tuning / 60fps perf**: Phase 2+ (per ADR-0017 D11+).

## Related

- [Wave 5 plan v1.3 row C.4-3](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) line 716
- [v1.3 retrofit catalog § C.4-3 (6 e2e_smoke entries)](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) lines 626-635
- [ADR-0017 drag/drop UX](../../decisions/ADR-0017-drag-drop-ux.md)
- [ADR-0018 D4 prose customization (toolbar styling)](../../decisions/ADR-0018-v2-visual-migration.md)
- [C.4-prelude PR.md](C.4-prelude-editor-scaffold.md)
- Sister PRs: C.4-4 (save roundtrip), C.4-5 (Stage C.4 close + 10-item E2E)
