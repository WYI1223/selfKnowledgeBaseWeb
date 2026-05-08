# Wave 6 hotfix — mdx-bridge `mdxFlowExpression` + per-block fault tolerance + editor schema-collision strip

> **Wave 6 Stage B post-close hotfix.** User-reported follow-up:
> after Stage B merged, `/notes/sample-blocks/edit` was still
> visibly empty (the original "/notes/<slug> 与 edit 不同步"
> reproduction). Root-cause was three layered bugs that the Stage B
> close-ceremony spec didn't catch because its `__test_smoke__/b5-roundtrip`
> fixture was prose-only and intentionally minimal. This hotfix
> closes all three so the real `sample-blocks` (and any other note
> with author comments + JSX-attr-coercion-prone blocks +
> backticks/links) loads non-empty in the editor.

## title

Three-layer fix for a single user-visible symptom (empty editor on
real-content notes):

1. `packages/mdx-bridge/src/parse.ts` — add an opt-in
   `MdxBridgeOptions.softParse` flag. When `true`: (a) drop
   block-level `mdxFlowExpression` author comments at the input
   gate; (b) wrap each remaining block in try/catch so one
   malformed block (Zod attr coercion failure on
   `<Jupyter code={`...`} />` etc.) becomes a placeholder paragraph
   carrying the failure reason instead of taking the whole `mdxToTiptap`
   call down. Default `softParse: false` preserves the historical
   fail-loud behavior the round-trip + grid-defensive contract tests
   rely on.
2. `packages/editor-shell/src/saveLoad.ts:loadFromMdx` — opt into
   `softParse: true` AND strip Tiptap-schema-unsupported marks
   (`code`, `link`) from the doc before `setContent`. ProseMirror
   forbids the same name on both a node and a mark ("RangeError:
   code can not be both a node and a mark"); the apps/site editor
   registers a block-Code NODE named `code` and does NOT register
   `@tiptap/extension-link`, so both marks must be stripped at the
   editor boundary or `setContent` rejects the entire doc.
3. `apps/site/src/components/EditorShellMount.tsx:handleCreate` —
   replace the silent `catch { return }` (the immediate cause of
   the user-visible empty editor: a single throw was swallowed
   leaving the indicator stuck at "saved") with an explicit error
   path: `console.error` for operators, `setSaveStatus('error')`
   for the indicator, and a new `[data-skb-load-error]` banner
   above the editor showing the failure reason + a hint pointing
   at the source MDX file. ADR-0011 D9.7 "vitest unit PASS ≠
   product-experience PASS" reverberation — without this
   visibility the next class-of-bug failure regresses just as
   silently.

## files

7 source files (~280-330 LOC) + 1 screenshot:

1. `packages/mdx-bridge/src/parse.ts` — **MODIFY** (~40 LOC).
   `MdxBridgeOptions` gains `softParse?: boolean`. When set, the
   `tree.children` walk filters out `mdxFlowExpression` and the
   `blocks.map` is replaced by a `flatMap` with try/catch +
   placeholder-paragraph emission. Default branch is unchanged.

2. `packages/editor-shell/src/saveLoad.ts` — **MODIFY** (~50 LOC).
   `loadFromMdx` calls `mdxToTiptap` with `softParse: true` and
   pipes the result through a new `stripUnsupportedMarks` helper
   that recursively walks the doc and removes any mark whose
   `type` is in the `EDITOR_UNSUPPORTED_MARKS` set (`code`,
   `link`). Constants documented inline.

3. `packages/editor-shell/src/EditorShell.tsx` — **MODIFY** (~10 LOC
   comment-only). Update the `StarterKit.configure({ code: false })`
   comment to point at the new `loadFromMdx` sanitizer + record
   the proper-fix Stage B carry-forward (rename block-Code node;
   register `@tiptap/extension-link`).

4. `apps/site/src/components/EditorShellMount.tsx` — **MODIFY**
   (~25 LOC). New `loadError: string | null` state; the
   `handleCreate` catch sets the state + emits `console.error` +
   `setSaveStatus('error')`; a new `[data-skb-load-error]` banner
   renders above `<GridContainer>` when `loadError !== null`,
   showing the failure reason + a pointer at the source MDX file.

5. `packages/mdx-bridge/src/__tests__/mdx-flow-expression.test.ts` —
   **NEW** (~110 LOC). 5 vitest cases covering both branches:
   - softParse=true: minimal `{/* ... */}` does not throw + the
     expression text does not survive into any Tiptap node
   - softParse=true: prose interleaved with multiple `{/* ... */}`
     yields exactly the expected heading/paragraph sequence
   - softParse=false (default): the same input still throws the
     historical `unsupported block type "mdxFlowExpression"` error
   - softParse=true: an unsupported `<Foo />` JSX block (no
     blockRegistry) becomes a placeholder paragraph with the
     reason text + `__skb_parse_error` attr; surrounding prose
     survives
   - softParse=false: the same JSX input still throws the
     historical `unsupported block type "mdxJsxFlowElement"` error

6. `apps/site/playwright/sample-blocks-edit-loads.spec.ts` —
   **NEW** (~60 LOC). Real-server regression spec against the
   `/notes/sample-blocks/edit` route — exactly the URL the user
   reported empty. Asserts: `.ProseMirror` is visible within 15s,
   editor textContent is > 50 chars within 10s, contains the
   stable phrase "Wave 2 close acceptance criterion" from the
   fixture body, the load-error banner is NOT present (the happy
   path, not the regression-banner path), and no
   `loadFromMdx`-pattern errors hit the page console. Captures a
   D9.5 screenshot to `docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png`.

7. `docs/plans/wave-6-main/wave-6-hotfix-mdx-bridge-flowexpression.md` —
   **NEW** (PR.md self).

8. `docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png` —
   **NEW** (D9.5 archive; ~280KB; emitted by the regression spec).

## D2 trigger judgment

Row 5 (cross-package: mdx-bridge + editor-shell + apps/site editor
mount + new contract surface for `softParse`). Row 1 NOT fired —
no CONTRACT.md change in this PR; the Stage B handoff pack already
documents the read-route static-build caveat and the affected
forward-refs are accurate. Row 2 NOT fired — no NEW deps.
Row 4 NOT fired — no ADR change; the hotfix is a Stage B
carry-forward implementation, not a new architectural decision.
PRE-COMMIT CLAUDE REVIEW required per Row 5 + the user-reported
regression class.

## ui_touch

`true` — `apps/site/src/components/EditorShellMount.tsx` matches
ADR-0011 D9.1 path pattern `apps/site/src/components/**`;
`packages/editor-shell/src/**` also matches the editor-shell
pattern. The Playwright regression spec at file 6 satisfies the
D9.2 e2e_smoke obligation; screenshot at file 8 satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mounts the editor and loads
    the persisted MDX body via the ApiAdapter chain — pre-hotfix
    this surface was visibly empty because `mdxToTiptap` threw on
    the first `{/* fixture-N */}` author comment and the throw
    was swallowed by `EditorShellMount`'s `handleCreate` catch
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-edit-loads.spec.ts:"sample-blocks edit route loads non-empty content (mdxFlowExpression no longer breaks)"
  screenshot_archive: docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png
  assertions:
    - .ProseMirror editor element is visible within 15s
    - editor textContent length is > 50 within 10s (proves the doc actually loaded; pre-hotfix this was 0)
    - editor contains the stable fixture phrase "Wave 2 close acceptance criterion"
    - the [data-skb-load-error] banner is NOT present (happy path; the banner only renders when handleCreate's catch fires)
    - no `loadFromMdx`/`mdx-bridge` page console errors observed during mount
    - screenshot saved to docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png with size ≥ 5KB

## decision-log

### Decision 1 — `softParse` opt-in over global behavior change

mdx-bridge's existing round-trip + grid-defensive tests pin the
fail-loud behavior on purpose: silent block drops would mask
authoring mistakes that the round-trip authority cares about
(`<Callout col=... colSpan=... />` missing `rowSpan` etc.). Making
fault tolerance a runtime opt-in (`softParse: true`) keeps those
17 contracts intact while letting the editor consumer (where a
single bad block taking the editor down is much worse than a
quietly-dropped block) choose leniency.

### Decision 2 — Sanitizer at the editor boundary, not in mdx-bridge

The `code` mark / `link` mark schema collisions are properties of
the **editor's** Tiptap schema, not of mdx-bridge's output. Pushing
the strip into mdx-bridge would lose round-trip fidelity for all
consumers (the existing 25 round-trip tests would fail). Putting
the strip in `loadFromMdx` keeps mdx-bridge schema-agnostic — any
consumer with a schema that DOES register `code`/`link` marks can
call `mdxToTiptap` directly and keep them.

### Decision 3 — Visible error banner over silent recovery

ADR-0011 D9.7 codified the lesson "vitest unit PASS ≠
production user-visible PASS" after C.4-prelude shipped a fully
mounted-but-empty editor. The original `handleCreate` catch
re-introduced exactly that class: a thrown exception was reduced
to a UI state of "saved + empty editor". The new banner makes
future class regressions self-announcing — the next time
`loadFromMdx` throws against a real note, the user sees the
failure reason on screen instead of an empty page.

### Decision 4 — No StarterKit re-enable; no @tiptap/extension-link add

The clean architectural fix is to rename the block-Code Tiptap
node out of the `code` namespace AND register
`@tiptap/extension-link` so the marks become first-class. Both
are out of hotfix scope (renaming a Tiptap node is a cross-package
contract change requiring `@skb/block-code/CONTRACT.md` +
mdx-bridge dispatch table + serialize round-trip parity audit).
Tracked as Stage B carry-forward items.

## acceptance

```bash
# AC-1: ui_touch + e2e gates PASS
pnpm exec tsx scripts/check-ui-touch.ts \
  --files apps/site/src/components/EditorShellMount.tsx \
          packages/editor-shell/src/EditorShell.tsx \
          packages/editor-shell/src/saveLoad.ts \
          packages/mdx-bridge/src/parse.ts \
          packages/mdx-bridge/src/__tests__/mdx-flow-expression.test.ts \
          apps/site/playwright/sample-blocks-edit-loads.spec.ts \
          docs/plans/wave-6-main/wave-6-hotfix-mdx-bridge-flowexpression.md 2>&1 | tail -1
# Expected: ui_touch=true (apps/site/src/components/** + packages/editor-shell/src/** match D9.1)
```

```bash
# AC-2: mdx-bridge regression suite passes (5 new + 93 pre-existing)
pnpm --filter @skb/mdx-bridge test 2>&1 | grep -E 'Tests'
# Expected: 98 passed
```

```bash
# AC-3: editor-shell suite passes (no regression in 129 pre-existing)
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 129 passed
```

```bash
# AC-4: sample-blocks edit-route Playwright regression passes
pnpm --filter @skb/site exec playwright test playwright/sample-blocks-edit-loads.spec.ts --reporter=line --workers=1 2>&1 | tail -3
# Expected: 1 passed
```

```bash
# AC-5: pnpm check exit 0
pnpm check
```

```bash
# AC-6: full visual suite passes under CI retry budget (regression
# check; the hotfix touches both the editor mount and the load chain
# so all C.4-* + Stage B specs need to keep working)
pnpm --filter @skb/site exec playwright test --retries=2 2>&1 | tail -3
# Expected: exit 0
```

```bash
# AC-7: softParse contract — mdx-bridge default branch still throws
# loud on unsupported input (round-trip + grid-defensive contracts
# preserved). Easiest probe: grep the test file for both the
# softParse=true and softParse=false assertions.
grep -cE 'softParse: true' packages/mdx-bridge/src/__tests__/mdx-flow-expression.test.ts
# Expected: ≥ 4
grep -cE 'softParse=false' packages/mdx-bridge/src/__tests__/mdx-flow-expression.test.ts
# Expected: ≥ 2
```

```bash
# AC-8: scope-fence — exactly 7 source files (excl. screenshot)
git diff --name-only main..HEAD -- ':!docs/audits/codex-runs/' ':!docs/audits/screenshots/' | sort | wc -l
# Expected: 7
```

```bash
# AC-9: screenshot archive exists with size ≥ 5KB
test -f docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png
test "$(stat -c '%s' docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png)" -ge 5120
```

## Out-of-scope (Stage B carry-forward)

- **Rename block-Code Tiptap node** out of the `code` namespace so
  StarterKit's inline `code` mark can be re-enabled and round-trips
  cleanly. Cross-package contract change.
- **Register `@tiptap/extension-link`** so markdown links survive
  the edit surface unmodified. Editor-shell extension surface change.
- **Static-build read-route freshness** (already documented in the
  Stage B handoff pack §"What is NOT closed").
- **Per-block-attr coercion fixes** (`Jupyter` `code` template
  literal → string; `Pdf` `page` JSX expression → number;
  `NnViz/AgentFlow` JSON-literal-as-attr) — each is its own
  block-package fix; the hotfix's per-block fault tolerance
  contains the blast radius without solving them.

## Related

- [Stage B handoff pack](stage-b-handoff-pack.md) — Wave 6 Stage B close evidence
- [ADR-0011 D9.7](../../decisions/ADR-0011-linear-pipeline-execution-model.md) — "vitest unit PASS ≠ product-experience PASS" lesson
- [B.5 PR.md](wave-6-stage-b-5-close.md) — close-ceremony spec; this hotfix demonstrates that the close-ceremony fixture was not representative of real notes
