# C-2 — NnViz `mlp-mnist.json` hot-load fixture ship

> **Wave 4 Stage C FIRST PR** (Stage C.1 gatekeeper smoke cleanup; warm-up
> scope). Closes the gatekeeper smoke residue from B2: B2 shipped the 4
> `apps/site/public/sample-assets/{diagram-small.png,figure-1.png,whitepaper.pdf,favicon.ico}`
> placeholders but did not ship the NnViz hot-load model JSON
> referenced at `content/notes/sample-blocks/index.mdx` line 133
> (`<NnViz modelUrl="/sample-assets/models/mlp-mnist.json" ... />`).
> Result: live `/sample-blocks` page hits 404 on the URL → NnViz phase
> falls to `httpError` → `deriveLayerSpecs` retreats to declarative
> `layers` prop → user sees the inline-prop fallback path, not the
> hot-load happy-path. C-2 ships a 1–2 KB hand-rolled TF.js
> LayersModel JSON sufficient to cover the happy-path. **Standard
> ADR-0011 D1 pipeline** (no D2 row 1 / 2 / 4 / 5 / 8 trigger HIT;
> see `## D2 trigger judgment`); stage 4 PRE-COMMIT CLAUDE REVIEW
> does NOT fire. **Stage C is open-ended** per gatekeeper directive #4
> + plan-challenger Q4 absorbtion + MVP framework — no Stage C PR
> roster pre-locked; PRs go one-at-a-time. C-2 is the warm-up; C-1
> (Pyodide) / C-3 (PDF iframe black-screen) / C-4 (B7 chunk-leak) are
> deferred to subsequent Stage C PRs (see `## Out of scope (deferred)`).

## title

Ship `apps/site/public/sample-assets/models/mlp-mnist.json` (NEW
≤ 2 KB, hand-authored TF.js LayersModel JSON; Sequential 3-Dense
mirroring the inline `layers` prop at `content/notes/sample-blocks/index.mdx`
line 133); creates the NEW `apps/site/public/sample-assets/models/`
directory; backfills `docs/plans/active.md` with the merged B6 row
(`#46 / 525e6c2`) + adds the C-2 row + opens a Stage C PR roster
section. PR.md self-listed per ADR-0006 D8 + Pre-A1 → B6 precedent.

## files

4 canonical files + COMMIT-time +1–2 reviewer audit archives;
**~6 files total at commit**. `orchestrator-self` EXECUTE
(matches B2 binary-file precedent: hand-rolled data + 1-line active.md
sync; no codex tool dispatch needed for a single sub-2-KB JSON
authoring task). NO `package.json` / `pnpm-lock.yaml` change (no
new deps; JSON is hand-authored). NO `apps/site/astro.config.mjs`
change (Astro auto-serves `apps/site/public/**` as static assets at
the corresponding URL paths; same mechanism B2 leveraged for the
4 sample-assets binaries). NO `apps/site/src/` source change
(NnViz consumes the URL via the existing tfjs-bridge `loadLayersModel`
lifecycle without code-path involvement).

- `apps/site/public/sample-assets/models/mlp-mnist.json` — **NEW**
  (~1.2 KB JSON). TF.js LayersModel canonical format. PLAN-time
  verified semantics: `packages/block-nn-viz/src/ui-default/tfjs-bridge.ts`
  invokes `tf.loadLayersModel(url)` (line 127); on resolve →
  `phase = ready` with `phase.model` = a `tf.LayersModel`; then
  `packages/block-nn-viz/src/ui-default/NnViz.tsx` line 129
  `layersFromModel(model)` iterates `model.layers` and for each layer
  calls `layer.getConfig()` extracting `units` + `activation`
  (only `units > 0` layers retained — keeps Dense layers, drops
  no-op InputLayer). Authoring approach: write the JSON by hand
  (no generator dep; verified PLAN-time via TF.js layers-model spec
  reference + the existing tfjs unit tests at
  `packages/block-nn-viz/src/__tests__/tfjs-bridge.test.ts` which
  build minimal LayersModel mocks). Canonical JSON skeleton
  PLAN-time-validated (single source of truth for TC2+TC3+TC4+TC5;
  EXECUTE writes byte-equivalent content):

  ```json
  {
    "format": "layers-model",
    "generatedBy": "skb-c2-fixture",
    "convertedBy": "hand-authored",
    "modelTopology": {
      "keras_version": "2.15.0",
      "backend": "tensorflow",
      "model_config": {
        "class_name": "Sequential",
        "config": {
          "name": "mlp-mnist",
          "layers": [
            {
              "class_name": "Dense",
              "config": {
                "name": "hidden-1",
                "trainable": true,
                "batch_input_shape": [null, 784],
                "dtype": "float32",
                "units": 128,
                "activation": "relu",
                "use_bias": true,
                "kernel_initializer": {
                  "class_name": "GlorotUniform",
                  "config": {"seed": null}
                },
                "bias_initializer": {
                  "class_name": "Zeros",
                  "config": {}
                }
              }
            },
            {
              "class_name": "Dense",
              "config": {
                "name": "hidden-2",
                "trainable": true,
                "dtype": "float32",
                "units": 64,
                "activation": "relu",
                "use_bias": true,
                "kernel_initializer": {
                  "class_name": "GlorotUniform",
                  "config": {"seed": null}
                },
                "bias_initializer": {
                  "class_name": "Zeros",
                  "config": {}
                }
              }
            },
            {
              "class_name": "Dense",
              "config": {
                "name": "output",
                "trainable": true,
                "dtype": "float32",
                "units": 10,
                "activation": "softmax",
                "use_bias": true,
                "kernel_initializer": {
                  "class_name": "GlorotUniform",
                  "config": {"seed": null}
                },
                "bias_initializer": {
                  "class_name": "Zeros",
                  "config": {}
                }
              }
            }
          ]
        }
      }
    },
    "weightsManifest": []
  }
  ```

  PLAN-time decisions on the JSON content (single source of truth;
  do not paraphrase elsewhere):

  - **`format: "layers-model"`** — required per TF.js loader
    contract (the loader checks this discriminator).
  - **`modelTopology.model_config.class_name: "Sequential"`** —
    Sequential is the canonical container; mirrors a typical
    Keras MNIST MLP. The 3 Dense layers replicate the inline
    `layers` prop's hidden-1 / hidden-2 / output rows
    (units 128 relu, 64 relu, 10 softmax). The first Dense gets
    `batch_input_shape: [null, 784]` so the model has a defined
    input shape (matches the inline `layers` prop's `input` row
    units=784, though as a `batch_input_shape` not as a
    materialized InputLayer).
  - **`weightsManifest: []`** — empty. TF.js will use each
    Dense layer's default `kernel_initializer` (GlorotUniform) +
    `bias_initializer` (Zeros) at construction time; **no `.bin`
    weight files needed**. NnViz never calls `model.predict()`
    (verified PLAN-time: no `.predict(` reference in
    `packages/block-nn-viz/src/ui-default/`); it only reads
    layer config (`getConfig().units` + `.activation`) for
    visualization, so the absence of trained weights is
    visualization-equivalent.
  - **Visualization delta vs declarative `layers` prop**:
    `model.layers` returns 3 Dense (hidden-1, hidden-2, output) —
    NOT 4 layers. The inline declarative `layers` prop has 4
    rows including a leading `input` row units=784. Per
    `deriveLayerSpecs` (NnViz.tsx line 118) the **model-driven
    list wins** when `phase.type === 'ready'` and the list is
    non-empty. So the rendered viz on hot-load shows 3 columns
    (hidden-1 / hidden-2 / output) vs the 4-column fallback
    when load fails. **This is a deliberate UI semantic
    (model-as-truth), not a defect.** If future product wants
    the input column rendered, options are: (a) add a
    `Reshape`/`Input`-equivalent layer with `units > 0` (no clean
    Keras representation), (b) augment `layersFromModel` to
    synthesize an input column from `model.inputs[0].shape` —
    that is a fwd-fix outside C-2 scope.
  - **File size budget**: ~1.2 KB on disk (hand-counted from the
    skeleton above; exact byte count varies with JSON whitespace
    formatting; well under 2 KB target).

  TC2 verifies file existence + non-zero size. TC3 verifies
  `JSON.parse` does not throw. TC4 verifies the discriminator
  fields (`format === "layers-model"` +
  `modelTopology.model_config.class_name === "Sequential"` +
  `weightsManifest` is an array). TC5 verifies layer extraction
  produces 3 specs with the expected `(units, activation)`
  triples (replays `layersFromModel`-equivalent logic over the
  parsed JSON without booting tfjs).

- `docs/plans/active.md` — **MODIFIED** (~6 LOC delta):

  - **B6 row backfill** (line 30 at HEAD; squash HEAD `525e6c2`,
    PR `#46` per the recent commit log): existing
    `| #TBD (this) | TBD | B6 | Wave 4 close-ceremony preparation ... |`
    →
    `| #46 | 525e6c2 | B6 | Wave 4 close-ceremony preparation (3 audit codex dispatches + 3 curated summaries + Stage A+B PR roster) |`.
  - **Stage A summary line nudge**: change line 31 from
    `| **Stage A** | ✅ **DONE** (8/8 PRs) | A | A1-A8 merged 2026-05-03 ... |`
    to add a parallel **Stage B DONE** row right after it:
    `| **Stage B** | ✅ **DONE** (8/8 PRs) | B | B1a-B6 merged 2026-05-03/04 (HEAD 525e6c2 from PR #46); audit-on-close artifacts shipped at B6 |`.
    Stage A row stays byte-unchanged.
  - **Stage C row update**: line 33 currently
    `| Stage C | open-ended | C | Phase 1 user-iteration scope (per gatekeeper directive #4 + MVP framework) |`
    stays. Append a new row **above** it (so PR roster table
    reads chronologically):
    `| #TBD (this) | TBD | C-2 | NnViz mlp-mnist.json hot-load fixture ship (Stage C.1 gatekeeper smoke cleanup; warm-up) |`.
  - **Open Stage C section header** (NEW; immediately after the
    Stage C row at line 33; ~2 LOC):

    ```
    Stage C PRs (open-ended; one-at-a-time per plan-challenger Q4 absorbtion):
    ```

    Plus a placeholder bullet noting C-1 / C-3 / C-4 are tracked
    but not pre-locked.

  No mandatory-scope ✅ flips needed (B6's audit-on-close ships do
  not change the canonical-task ✅ states; Wave 4 mandatory scope
  bullets stay byte-unchanged). TC6 verifies the four edits
  enumerated above.

- `docs/plans/wave-4-main/C-2-nn-viz-mlp-mnist-fixture.md` —
  **NEW** (this PR.md, self-listed per ADR-0006 D8 + Pre-A1 → B6
  precedent; ~310 LOC final, well under the ~700 LOC B2 reference
  size because C-2 is a warm-up Stage C PR with a single small
  data-file ship + minimal active.md sync + no D2 row 1 / 4 trigger
  + no plan-challenger absorbtion table).

- **NEW directory** `apps/site/public/sample-assets/models/` —
  created implicitly by the JSON file ship (the directory does
  not exist at HEAD; verified PLAN-time `ls apps/site/public/sample-assets/`
  showed exactly 3 files: diagram-small.png + figure-1.png +
  whitepaper.pdf, no `models/` subdir). git tracks files not
  directories; placement of `mlp-mnist.json` materializes the
  directory naturally with no `.gitkeep`-style scaffolding.

COMMIT-time additions (post stage 3 review):
- `docs/audits/codex-runs/2026-05-04-C-2-pr-reviewer-55.txt` —
  C-2 R1 audit raw archive (head-2000 truncate per ADR-0011 D6 R7).
- (R2 audit if codex flags an iteration round.)
- `docs/audits/codex-runs/2026-05-04-B6-commit.txt` — already
  present at HEAD as `??` per `git status` snapshot; will be
  staged with C-2 if not yet committed via B6 (per the committed
  HEAD `525e6c2` log this would be a back-fill matching the
  established orphan-archive pattern across B1b → B7).

## test_cases

C-2 ships **0 NEW vitest unit suites** (data-file ship + minimal
active.md sync; the existing
`packages/block-nn-viz/src/__tests__/tfjs-bridge.test.ts` covers
loader lifecycle with mocks; the URL-resolution layer is the new
guarantee, validated via shell-level placement checks). TDD-front
discipline (per ADR-0011 D1 stage 2 + memory
`feedback_soted_pr_md_discipline`) for a data-file ship means
**verifying the existing tests stay GREEN with the new file in
place** AND running shell-level placement + JSON-shape checks
(TC1-TC6 below) before commit. Order: TC1 directory presence →
TC2 file presence + size → TC3 JSON parse → TC4 discriminator
fields → TC5 layer extraction → TC6 active.md sync → TC7
`pnpm --filter @skb/site test` GREEN → TC8 byte-unchanged
guards → TC9 `pnpm --filter @skb/site build` clean + dist copy →
TC10 `pnpm size-check` → TC11 `pnpm link-check` (CI canonical) →
TC12 `pnpm check` workspace-wide.

Test verification triplets (input → expected → location):

- **TC1** (models/ directory created): Input:
  `test -d apps/site/public/sample-assets/models`. Expected:
  exit 0. Location: shell at repo root.
- **TC2** (mlp-mnist.json placed + non-zero size + ≤ 2 KB):
  Input: `test -f apps/site/public/sample-assets/models/mlp-mnist.json
  && wc -c < apps/site/public/sample-assets/models/mlp-mnist.json`.
  Expected: exit 0 + byte count > 0 AND ≤ 2048. Location: same.
- **TC3** (JSON parses): Input:
  `node -e 'JSON.parse(require("node:fs").readFileSync("apps/site/public/sample-assets/models/mlp-mnist.json","utf8"))'`.
  Expected: exit 0 (no throw). Location: same.
- **TC4** (TF.js LayersModel discriminator fields): Input:
  `node -e 'const m=JSON.parse(require("node:fs").readFileSync("apps/site/public/sample-assets/models/mlp-mnist.json","utf8")); if (m.format!=="layers-model") process.exit(1); if (m.modelTopology?.model_config?.class_name!=="Sequential") process.exit(2); if (!Array.isArray(m.weightsManifest)) process.exit(3); process.exit(0);'`.
  Expected: exit 0. Location: same.
- **TC5** (layer extraction yields 3 specs with expected
  `(units, activation)` triples — replays the
  `layersFromModel`-equivalent logic over the parsed JSON without
  booting tfjs): Input: a small Node one-liner (or vitest one-shot)
  reading `modelTopology.model_config.config.layers`, filtering
  `class_name === "Dense" && config.units > 0`, mapping to
  `{name, units, activation}`. Expected: exactly 3 entries:
  `[{name:"hidden-1",units:128,activation:"relu"}, {name:"hidden-2",units:64,activation:"relu"}, {name:"output",units:10,activation:"softmax"}]`.
  Location: same.
- **TC6** (active.md edits): (a) `grep -c '#46' docs/plans/active.md` ≥ 1;
  (b) `grep -c '525e6c2' docs/plans/active.md` ≥ 1;
  (c) `grep -c '| C-2 |' docs/plans/active.md` ≥ 1;
  (d) `grep -c 'Stage B.*✅.*DONE' docs/plans/active.md` ≥ 1
  (Stage B summary line added);
  (e) `grep -c 'open-ended' docs/plans/active.md` ≥ 1
  (Stage C row preserved + Stage C section header added).
- **TC7** (apps/site test suite regression-free):
  `pnpm --filter @skb/site test` → exit 0; existing 11 corpora
  (`components-map / dims-source / fouc-script / lazy-chunking /
  sample-blocks-page / sample-blocks-astro-page / search-cjk /
  search-reindex / search-ui / visual-smoke / word-level-match`)
  PASS unchanged. The data file ship is additive; no source-code
  path changes.
- **TC8** (byte-unchanged guards across Wave 4 shipped scope):
  `git diff main -- apps/site/src/ apps/site/public/sample-assets/diagram-small.png
  apps/site/public/sample-assets/figure-1.png apps/site/public/sample-assets/whitepaper.pdf
  apps/site/public/favicon.ico content/notes/sample-blocks/index.mdx
  apps/site/CONTRACT.md docs/decisions/ packages/block-nn-viz/
  packages/heavy-block-boundary/ packages/block-callout/ packages/block-code/
  packages/block-image/ packages/block-math/ packages/block-pdf/
  packages/block-jupyter/ packages/block-agent-flow/
  apps/site/astro.config.mjs apps/site/package.json pnpm-lock.yaml
  docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md` →
  empty diff (C-2 must NOT regress B1a / B1b / B2 / B3 / B4 /
  B5 / B6 / B7 / Stage A; must NOT touch any ADR; must NOT touch
  any package source; must NOT touch the Wave 4 plan doc).
- **TC9** (apps/site build clean + JSON shipped to dist):
  `pnpm --filter @skb/site build` → exit 0 + post-build
  verification `test -f apps/site/dist/sample-assets/models/mlp-mnist.json`
  → exit 0 (Astro copies `apps/site/public/**` byte-identical to
  `dist/**` per the same mechanism B2 verified for the 4
  sample-assets binaries).
- **TC10** (size-check workspace-wide): `pnpm size-check` → exit 0.
  The JSON file is data, not source; PR.md is exempt from the 200
  LOC target per ADR-0011 D2 v0.1.1 + memory
  `feedback_soted_pr_md_discipline`.
- **TC11** (lychee link-check; CI canonical):
  `pnpm link-check` runs in CI. Pre-commit memory disciplines
  followed: `feedback_lychee_line_anchor` no `:line` suffix on
  relative file links (PR.md uses prose like
  "`content/notes/sample-blocks/index.mdx` line 133", not
  `path:line` link form); `feedback_lychee_user_local_paths` no
  `~/.claude/...` links; `feedback_lychee_npmjs_403` no
  `npmjs.com/package/...` links;
  `feedback_lychee_autolink_in_backticks` no
  `<` plus identifier plus `>` autolink shapes inside backticks
  (PR.md uses prose references like "the URL"; no
  backticked angle-bracket-identifier-style autolink-trigger
  sequences in markdown link contexts).
- **TC12** (workspace-wide regression): `pnpm check` → exit 0
  (lint + typecheck + test + build + size-check all PASS).
- **TC13** (PR.md self-listed): `grep -c 'C-2-nn-viz-mlp-mnist-fixture.md'
  docs/plans/wave-4-main/C-2-nn-viz-mlp-mnist-fixture.md` → ≥ 2
  (self-reference in `## files` + `## Related` sections per
  Pre-A1 → B6 precedent).

## contracts_affected

- **NONE.** C-2 modifies no `*/CONTRACT.md` file. The
  `packages/block-nn-viz/CONTRACT.md` stays byte-unchanged
  (the contract spec for `loadLayersModel` lifecycle is correctly
  authored independent of this fixture; TC8 verifies empty diff).
  `apps/site/CONTRACT.md` stays byte-unchanged. Standard PR per
  ADR-0007 D2 row 1 NO.

## adr_touched

- **NONE.** C-2 touches no `docs/decisions/ADR-*.md` file.
  Standard PR per ADR-0007 D2 row 4 NO.

## D2 trigger judgment

Per ADR-0007 D2 row mapping for C-2 (verified at PLAN time):

- **Row 1 (CONTRACT.md change)**: **NO.** Verified empty diff
  across all CONTRACT files (TC8).
- **Row 2 (package add / remove)**: **NO.** Zero new workspace
  packages; the JSON is a static asset under `apps/site/public/`,
  not a new package. No `package.json` edit; no `pnpm-lock.yaml`
  delta (TC8 verifies).
- **Row 3 (cross-cutting refactor)**: **NO.** Single new data
  file + active.md row sync + PR.md self-list.
- **Row 4 (new ADR required)**: **NO.** Touches no ADR (TC8
  verifies empty diff across `docs/decisions/`).
- **Row 5 (cross ≥ 3 packages)**: **NO.** Modifies files inside
  `apps/site/public/sample-assets/models/` (1 NEW data file) +
  `docs/plans/` (active.md + this PR.md self-list). Cross-package
  scope is **1** (`apps/site` only); plan/doc edits are not
  package-cutting.
- **Row 6 (asymmetric / sibling-pattern)**: **NO.** The new
  `models/` subdirectory is the first occupant matching the URL
  convention (`/sample-assets/models/...`) referenced by the
  existing NnViz fixture. No sibling-divergent pattern; mirrors
  B2's `sample-assets/` placement convention (B2 shipped 3 files
  + favicon at root; C-2 adds 1 file under one new subdirectory).
- **Row 7 (legacy doc resurrection)**: **NO.** New file authored
  fresh; no deprecated content revived.
- **Row 8 (CI / build / deploy / auth / security)**: **NO.**
  Touches no `.github/workflows/`, no `Dockerfile`, no auth code,
  no security code. Static-asset JSON is passive content served
  by Astro's existing `public/**` → `dist/**` copy mechanism.

→ **No row HIT → standard PR.** Pipeline: PLAN → EXECUTE → REVIEW
(`codex-pr-reviewer-55`) → COMMIT (reviewer codex per ADR-0006 D8) →
ACCEPT (pr-writer second invocation per ADR-0011 D1 stage 6).
Stage 4 PRE-COMMIT CLAUDE REVIEW does **NOT** fire.

## acceptance

1. **`apps/site/public/sample-assets/models/` directory created**
   (first occupant; TC1 evidence).

2. **`apps/site/public/sample-assets/models/mlp-mnist.json` placed**
   at the canonical fixture-referenced path
   (`content/notes/sample-blocks/index.mdx` line 133
   `<NnViz modelUrl="/sample-assets/models/mlp-mnist.json" ... />`);
   non-zero size; ≤ 2 KB. TC2 evidence.

3. **JSON parses** without throw (`JSON.parse` exit 0). TC3 evidence.

4. **TF.js LayersModel discriminator fields present**:
   `format === "layers-model"` AND
   `modelTopology.model_config.class_name === "Sequential"` AND
   `Array.isArray(weightsManifest)`. TC4 evidence.

5. **3 Dense layers materialize the expected topology**:
   replaying `layersFromModel`-equivalent extraction
   yields exactly 3 specs:
   `[{name:"hidden-1",units:128,activation:"relu"}, {name:"hidden-2",units:64,activation:"relu"}, {name:"output",units:10,activation:"softmax"}]` —
   matching the inline `layers` prop's hidden-1 / hidden-2 / output
   rows. **The leading `input` row at units=784 is NOT visualized
   from the model** (intentional per `deriveLayerSpecs`
   model-as-truth semantic; documented in `## files` JSON-decision
   notes; future fwd-fix optional). TC5 evidence.

6. **`weightsManifest: []`** (empty array) — no `.bin` weight
   files needed; NnViz only reads layer config, never invokes
   `model.predict()`. TC4 partial evidence (the array-shape check)
   + design-rationale captured under `## files`.

7. **`docs/plans/active.md` synced**: B6 row backfilled
   (`#46 / 525e6c2`); Stage B DONE summary row added; Stage C
   section header opened; C-2 TBD row added. TC6 evidence (5 sub-greps).

8. **NO source-code change**: empty diff across
   `apps/site/src/`, all 8 block packages
   (`packages/block-callout/`, `packages/block-code/`,
   `packages/block-image/`, `packages/block-math/`,
   `packages/block-pdf/`, `packages/block-jupyter/`,
   `packages/block-nn-viz/`, `packages/block-agent-flow/`),
   `packages/heavy-block-boundary/`, `apps/site/astro.config.mjs`,
   `apps/site/package.json`, `pnpm-lock.yaml`. TC8 evidence.

9. **NO ADR change**: empty diff across `docs/decisions/`. TC8
   evidence.

10. **NO Wave 4 plan change**: empty diff against
    `docs/superpowers/plans/2026-05-03-phase-1-wave-4-integration.md`.
    TC8 evidence.

11. **NO B1a–B7 shipped-file regression**: empty diff against
    the 4 B2 sample-assets binaries + `apps/site/CONTRACT.md` +
    `content/notes/sample-blocks/index.mdx`. TC8 evidence.

12. **`pnpm --filter @skb/site test`** GREEN — 11 existing
    corpora unchanged. TC7 evidence.

13. **`pnpm --filter @skb/site build`** clean + JSON shipped to
    `apps/site/dist/sample-assets/models/mlp-mnist.json`. TC9 evidence.

14. **`pnpm size-check`** PASS workspace-wide. TC10 evidence.

15. **`pnpm link-check`** (CI canonical) PASS — all 4 lychee
    memory disciplines respected. TC11 evidence.

16. **`pnpm check`** PASS workspace-wide. TC12 evidence.

17. **PR.md self-listed** in `## files` + `## Related`
    (≥ 2 grep hits). TC13 evidence.

## executor

`orchestrator-self`. Matches the B2 binary-file precedent: a
single small data-file ship (~1.2 KB hand-authored JSON) + a
small active.md sync (~6 LOC) + this PR.md (~310 LOC) is well
within direct-edit scope. Rationale: (a) JSON authoring is
declarative + the canonical skeleton is locked in `## files`
above as single source of truth; the executor copies the
skeleton verbatim and confirms byte count ≤ 2048; (b) no
codebase-wide refactor or design judgment is required; (c)
codex dispatch overhead (profile setup + audit-log piping +
review-round latency) is disproportionate for a sub-50 LOC
deliverable; (d) memory `feedback_codex_audit_log_recursion`
(D3 incident 2026-05-01: 49 MB log, codex self-recursion) is
avoided entirely by orchestrator-self path. The reviewer codex
(`codex-pr-reviewer-55`) at ADR-0011 D1 stage 3 still runs
unchanged, providing the standard line-level + spec-match audit.

## Out of scope (deferred)

Stage C is **open-ended** per gatekeeper directive #4 +
plan-challenger Q4 absorbtion + MVP framework — Stage C PRs go
one-at-a-time without a pre-locked roster. The following gatekeeper
smoke residues + Stage C scope items are tracked in the orchestrator
task list (TaskCreate), NOT pre-locked here:

- **C-1 (HIGH): Pyodide assets `indexURL` configuration —
  Jupyter MVP unblock**. Deferred to a later Stage C PR; requires
  decisions on Pyodide CDN vs vendored `pyodide-*.whl` placement
  + `apps/site/public/pyodide/` directory bootstrap + Jupyter
  block-jupyter MVP smoke wiring. Out of scope for C-2 warm-up.
- **C-3 (MID): PDF iframe black-screen display investigation +
  fix**. Live `/sample-blocks` shows the whitepaper.pdf iframe
  rendering as a black rectangle (B2 shipped a valid 3-page
  hand-authored PDF; the visual defect is a separate
  rendering-layer concern: PDF.js / iframe sandbox / CSS
  height-stretch interaction). Investigation deferred. Out of
  scope for C-2.
- **C-4 (MID): B7 chunk-leak measure + decide optimization**.
  B7 deliverable + perf-auditor B6 surfaced the chunk-leak
  evidence; quantification + Stage C optimization decision
  deferred per Wave 4 plan A8 D10 + B6 perf-auditor curation.
  Out of scope for C-2.
- **NnViz inline `input` column visualization fwd-fix**: today's
  `layersFromModel` filter drops the input layer from the viz
  on hot-load (only Dense `units > 0` retained). Showing the
  input column would require either a synthetic LayerSpec
  derivation from `model.inputs[0].shape` or a `class_name:
  "InputLayer"` config branch. Optional fwd-fix; not needed for
  C-2's gatekeeper smoke closure (the 3-Dense viz is
  semantically correct + visually meaningful).
- **NnViz weight-overlay realism (`showWeights` prop)**: the
  fixture uses `weightsManifest: []` so no trained weights
  ship; the `showWeights` overlay therefore renders against
  the on-the-fly GlorotUniform initialization (random small
  values). Visually plausible; if future product wants
  pretrained weight rendering, ship `mlp-mnist.weights.bin` +
  populate `weightsManifest`. Optional fwd-fix.
- **Wave 4 close ADR (potential ADR-0015)**: explicit OUT-OF-SCOPE
  per Wave 4 plan v0.2.1 + Pre-A3 plan-challenger C9 absorbtion +
  B6 deferral. Close ceremony begins fresh session AFTER Stage C
  closes (when user MVP judgment fires).

## Related

- [ADR-0011 D1 linear pipeline](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
- [ADR-0007 D2 trigger matrix](../../decisions/ADR-0007-job-function-codex-heavy-execution.md)
- [ADR-0006 D8 explicit-file-list staging](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
- [B2 sample-blocks Wave 3 cleanup PR.md](B2-sample-blocks-cleanup.md) — direct precedent for binary/data-file ship discipline
- [B6 close-ceremony prep PR.md](B6-close-ceremony-prep.md) — Stage B FINAL; HEAD at C-2 start
- [Wave 4 plan v0.2.1](../../superpowers/plans/2026-05-03-phase-1-wave-4-integration.md)
- [block-nn-viz CONTRACT.md](../../../packages/block-nn-viz/CONTRACT.md) — `loadLayersModel` lifecycle authority
- [Stage C PR roster (live)](../active.md) — C-2 (this) + tracked C-1 / C-3 / C-4 deferred
- This PR.md: [`docs/plans/wave-4-main/C-2-nn-viz-mlp-mnist-fixture.md`](C-2-nn-viz-mlp-mnist-fixture.md) (self-listed per ADR-0006 D8)
