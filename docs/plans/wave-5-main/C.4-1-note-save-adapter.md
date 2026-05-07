# C.4-1 — NoteSaveAdapter contract hardening + adapter contract tests + ApiAdapter forward-stub COMMENT

> **Wave 5 Stage C.4 1st implementation PR** of the locked 5-PR
> sequence (post-C.4-prelude PR #72; per Wave 5 plan v1.3 row C.4-1,
> line 714; v1.3 R14 retrofit catalog § C.4-1 lines 607-615).
> Hardens the `NoteSaveAdapter` interface (impl already shipped at
> C.4-prelude); adds adapter contract test suite; adds ApiAdapter
> forward-stub COMMENT-only per v1.3 sub-edit e absorbtion. **PRE-COMMIT
> CLAUDE REVIEW (D1 stage 4) FIRES** per `## D2 trigger judgment`
> (Row 1 CONTRACT.md change + Row 5 cross-package).

## title

Land NoteSaveAdapter interface contract hardening at
`packages/editor-shell/src/save-adapter.ts` (interface + types only;
LocalStorageAdapter impl preserved from C.4-prelude); adapter
contract tests at `packages/editor-shell/src/__tests__/save-adapter.test.ts`
verifying interface shape + LocalStorageAdapter behavior; ApiAdapter
forward-stub COMMENT-only at `save-adapter.ts` per v1.3 R14 sub-edit
e (`// TODO Phase 2+ ApiAdapter implementing NoteSaveAdapter for /api/notes endpoint`
+ commented-import scaffold for IDE discoverability; NO executable
class/interface/import). Sister-doc-sync `packages/editor-shell/CONTRACT.md`
adding W5-2 invariant + NoteSaveAdapter public surface section.

## files

5-7 files modified/created (~150 LOC budget per plan v1.3 row C.4-1):

1. `packages/editor-shell/src/save-adapter.ts` — **MODIFY** (~25 LOC).
   - Strengthen JSDoc on `NoteSaveAdapter` interface (load/save
     contract) per ADR-0018 D8 verbatim
   - Strengthen `NoteState` field JSDoc (mdxSource / tiptapState /
     lastModified / version)
   - Add ApiAdapter forward-stub COMMENT block (per v1.3 R14
     sub-edit e):
     ```
     // TODO Phase 2+ ApiAdapter implementing NoteSaveAdapter for /api/notes endpoint
     // import { ApiAdapter } from './api-adapter';  // Phase 2+ scaffold (commented; no runtime import)
     // export class ApiAdapter implements NoteSaveAdapter { ... }  // Phase 2+ impl (commented stub)
     ```
   - LocalStorageAdapter impl UNCHANGED from C.4-prelude
   - NO executable `class\s+ApiAdapter|interface\s+ApiAdapter|export\s+(const|function|class|interface)\s+ApiAdapter|import.*ApiAdapter\s+from` per v1.3 sub-edit e + Q3 plan-challenger absorbtion AC#14-equivalent gate

2. `packages/editor-shell/src/__tests__/save-adapter.test.ts` —
   **NEW** (~80 LOC). Adapter contract test suite:
   - `it('NoteSaveAdapter interface allows LocalStorageAdapter MVP')`:
     instantiate + assert shape (slug / load / save methods present
     + types correct)
   - `it('LocalStorageAdapter.load returns null for new slug')`
   - `it('LocalStorageAdapter.save + load round-trip preserves NoteState')`
   - `it('LocalStorageAdapter.save handles SecurityError gracefully')` —
     mock localStorage to throw; assert ok: false + error
   - `it('LocalStorageAdapter.save rejects oversized state (> 2MB)')` —
     synthesize large state; assert ok: false + error
   - `it('ApiAdapter forward-stub is COMMENT-only (no executable class/import/interface)')` —
     read save-adapter.ts source; assert `class\s+ApiAdapter`
     pattern is ONLY in comment context (per AC#14-equivalent
     gate from v1.3 sub-edit e)

3. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~25 LOC).
   - Promote W5-2 invariant from "future reducer" to "shipped at
     C.2-8 + adapter wired at C.4-1"
   - Add NoteSaveAdapter public surface section: interface contract
     + LocalStorageAdapter MVP + ApiAdapter Phase 2+ stub language

4. `apps/site/src/__tests__/e2e/c4-1-note-save-adapter.spec.ts` —
   **NEW** (~70 LOC). Playwright spec navigating to
   `/notes/<slug>/edit` (or fallback `/notes/sample-blocks/edit`):
   - Light-theme guard
   - Verify NoteSaveAdapter is wired (via DOM-side `window.__skbAdapter` test hook OR observable behavior — e.g., type → wait debounce → reload → content persists)
   - Assert LocalStorageAdapter MVP load + save roundtrip
   - Assert ApiAdapter forward-stub commented (test reads runtime
     bundle has no executable ApiAdapter class)
   - Screenshot to `docs/audits/screenshots/wave-5-c4-1-note-save-adapter.png`

5. `docs/plans/wave-5-main/C.4-1-note-save-adapter.md` — **NEW**
   (PR.md self).

6. `docs/audits/screenshots/wave-5-c4-1-note-save-adapter.png` —
   **NEW**.

## D2 trigger judgment

Row 1 (CONTRACT.md change in @skb/editor-shell) + Row 5 (cross-package: editor-shell + apps/site = 2 packages, but the plan v1.3 row C.4-1 D2 column declares Row 5 by predeclared cross-package surface authority per ADR-0018 D8 NoteSaveAdapter 接口冻结 → editor-shell + apps/site editor mount + LocalStorageAdapter consumer).

PRE-COMMIT CLAUDE REVIEW fires.

## ui_touch

`true` — `packages/editor-shell/src/**` matches.

## e2e_smoke

Per v1.3 catalog § C.4-1 (lines 607-615 verbatim):

- flow: /notes/[slug]/edit route mounts LocalStorageAdapter MVP per ADR-0018 D8 (existing C.4-prelude wire) + ApiAdapter Phase 2+ stub strictly COMMENT-only in source (// TODO Phase 2+ ApiAdapter implementing NoteSaveAdapter for /api/notes endpoint; 0 executable class/interface/import). Full load + roundtrip end-to-end coverage deferred to C.4-4 (save roundtrip wire) + C.4-5 真验收 10-item E2E. C.4-1 spec scope = interface contract gate + COMMENT-only enforcement.
  target_url: /notes/[slug]/edit
  playwright_spec: apps/site/src/__tests__/e2e/c4-1-note-save-adapter.spec.ts:"/notes/[slug]/edit mounts; ApiAdapter forward-stub COMMENT-only enforcement"
  screenshot_archive: docs/audits/screenshots/wave-5-c4-1-note-save-adapter.png

## decision-log

### Decision 1 — ApiAdapter forward-stub strictly COMMENT-only

Per v1.3 R14 sub-edit e + Q3 plan-challenger absorbtion: ApiAdapter
appears in save-adapter.ts ONLY as comment-form. Hard AC#14-style
mechanical gate enforces ZERO executable patterns:
`class\s+ApiAdapter|interface\s+ApiAdapter|export\s+(const|function|class|interface)\s+ApiAdapter|import.*ApiAdapter\s+from`. Only `//` comment-form
allowed. Intent: forward-pointer signaling LocalStorageAdapter is
not the end-state; prevents Phase 2+ scope-creep into Wave 5.

### Decision 2 — LocalStorageAdapter impl UNCHANGED at C.4-1

Impl already shipped at C.4-prelude (PR #72 squash `4f49be0`).
C.4-1 hardens the interface contract + adds tests. Modifying impl
would expand scope.

### Decision 3 — W5-2 invariant promoted

W5-2 ("editor-shell layoutReducer + layoutEpoch single-source
mutation") shipped at C.2-8 (PR #80 squash `2cdcebb`); CONTRACT.md
prose updated from "future reducer" to "shipped + adapter wired
at C.4-1".

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts
pnpm exec tsx scripts/check-e2e-coverage.ts
```

```bash
# AC-2: ApiAdapter executable patterns absent in save-adapter.ts (only COMMENT-form allowed)
grep -cE 'class\s+ApiAdapter|interface\s+ApiAdapter|export\s+(const|function|class|interface)\s+ApiAdapter|import.*ApiAdapter\s+from' packages/editor-shell/src/save-adapter.ts
# Expected: 0 (no executable forms; comment-only TODO line allowed)
grep -cE '//\s*TODO\s+Phase\s+2\+\s+ApiAdapter' packages/editor-shell/src/save-adapter.ts
# Expected: ≥1
```

```bash
# AC-3: editor-shell adapter contract tests pass
pnpm --filter @skb/editor-shell test 2>&1 | grep 'Tests'
# Expected: includes new save-adapter tests (≥6)
```

```bash
# AC-4: pnpm check exit 0
pnpm check
```

```bash
# AC-5: scope-fence
git diff --name-only main..HEAD | sort
# Expected: 5-7 files
```

```bash
# AC-6: anti-leak (char-class [:])
git diff main..HEAD -- ':!docs/plans/wave-5-main/C.4-1-note-save-adapter.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

## Out-of-scope

- **ApiAdapter implementation**: Phase 2+ scope. C.4-1 only adds
  COMMENT-form forward-stub.
- **Save/load wire to apps/site UI**: deferred to C.4-2 (route +
  mount enhancement) + C.4-4 (save roundtrip wire).
- **Drag-handle / palette / slash-menu / toolbar**: deferred to
  C.4-3.
- **真验收 10-item E2E coverage**: deferred to C.4-5 Stage close.

## Related

- [Wave 5 plan v1.3 row C.4-1](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md) line 714
- [ADR-0018 D8 NoteSaveAdapter interface 冻结](../../decisions/ADR-0018-v2-visual-migration.md)
- [C.4-prelude PR.md](C.4-prelude-editor-scaffold.md) — LocalStorageAdapter MVP impl
- Sister PRs: C.4-2 (route + mount), C.4-3 (palette/slash/drag-handle/toolbar), C.4-4 (save roundtrip), C.4-5 (Stage C.4 close + 10-item E2E)
