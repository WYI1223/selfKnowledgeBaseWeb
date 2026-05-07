# Wave 6 Stage B.2 — apps/site Node adapter + per-route `prerender = false` endpoint + filesystem write-back (sidecar state.json)

> **Wave 6 Stage B 2nd PR** per ADR-0018 v0.6 D14 sequence (B.1
> ADR amendment merged at squash `fc7689f`; this is B.2). Adds
> `@astrojs/node` dep + adds `adapter: node({ mode: 'standalone' })`
> to `astro.config.mjs` + creates `apps/site/src/pages/api/notes/[...slug].ts`
> server endpoint with GET (load NoteState from MDX file + sidecar)
> + POST (write back to MDX file preserving frontmatter; persist
> `{lastModified, version}` to a sibling `state.json` sidecar so
> `@skb/content-types` frontmatter schema does NOT drift). **D2 row
> 4 fires** (NEW ADR-0011 D9.1 amendment surfaced at R5 — see
> `## D2 trigger judgment`). Row 1 (CONTRACT.md change in apps/site)
> + Row 2 (NEW dep) + Row 4 (ADR-0011 v0.3 amendment) + Row 5
> (cross-package: apps/site + content/notes filesystem surface +
> 3 sibling CI gate scripts) all fire → **PRE-COMMIT CLAUDE REVIEW
> required** per Row 1+4.
>
> **Astro 5.18 reality note**: the canonical `output: 'hybrid'` value
> was removed in Astro 5.x. The supported pattern is `output: 'static'`
> (default) plus per-route `export const prerender = false` opt-out
> for server-only routes. The `@astrojs/node` adapter is still required
> to host those non-prerendered routes. ADR-0018 v0.6 D10 prose was
> drafted before this Astro 5.18 deprecation surfaced; PR.md acceptance
> + ADR-0018 D10 are aligned to the actual API at this PR.
>
> **R5 ui_touch correction (2026-05-07)**: R5 surfaced an authority
> mismatch — `apps/site/src/pages/**` matched the D9.1 ui_touch path
> patterns even for server-only API routes that have no rendered
> HTML / no Playwright-meaningful flow. Folded a minimal D9.1
> amendment into this PR (ADR-0011 D9.1 + 3 sibling CI gate
> scripts) excluding `apps/site/src/pages/api/**` from ui_touch.
> With the exclusion in effect, `check-ui-touch.ts` against this
> diff returns `ui_touch=false`; `e2e_smoke` is consequently not
> required. Cross-route end-to-end edit ↔ read flow lands at B.5
> per Decision 5 + ADR-0018 v0.6 D14.

## title

Add `@astrojs/node` adapter dep to apps/site; add
`adapter: node({ mode: 'standalone' })` to `astro.config.mjs`
(keeping the existing `output: 'static'` value, which under Astro
5.18 supports mixed prerendered pages + non-prerendered server
endpoints via per-route `prerender = false`); create new server
endpoint at `apps/site/src/pages/api/notes/[...slug].ts` with
`export const prerender = false` + GET handler reading
`content/notes/<slug>/index.mdx` (plus optional sibling
`state.json` sidecar) returning NoteState JSON + POST handler
accepting NoteState JSON, writing the body back to the MDX file
(preserving frontmatter verbatim) AND writing
`{lastModified, version}` to a `state.json` sidecar so the
`@skb/content-types` frontmatter schema is NOT extended. Vitest
unit suite covering frontmatter preservation + sidecar roundtrip +
error paths (404 / 500 / invalid JSON). Sister-doc-sync
`apps/site/CONTRACT.md` (1) adding `### Server endpoints (Wave 6
Stage B path-(b))` subsection under `## Runtime persistence` and
(2) amending the `Static build only` invariant to a static-first +
carved-out-endpoint formulation.

## files

21 files (~520-680 LOC). Trajectory:

- pre-R5 draft: 7-9 files (initial endpoint + sister-doc set)
- R5 +4: ADR-0011 D9.1 amendment + 3 sibling CI gate scripts
  (`scripts/check-{ui-touch,e2e-coverage,screenshot-archive}.ts`)
  to resolve the API-route ui_touch authority mismatch surfaced by
  the codex reviewer
- R6 +1: ADR-0006 item #9 v0.2.1 cross-ref-only amendment that
  defers to ADR-0011 D9.1 instead of inlining the path list
- R8 +6: 3 render templates
  `scripts/render/{review-checklist,claude-md,codex-tool-runbook}.ts`
  plus their 3 regenerated consumer docs (`docs/review-checklist.md`,
  `CLAUDE.md`, `docs/runbooks/codex-tool-invocations.md`) to land
  the 8→9 point language across all generated surfaces
- R9 +2: `agent-contract.md` (root authority — `8th-class hunt` →
  `9th-class hunt`) and `docs/runbooks/team-operations.md` (active
  runbook — `pr-gate` row updated to current `codex-pr-reviewer-55`
  surface with `9th-class hunt`)

1. `apps/site/package.json` — **MODIFY**. Add `@astrojs/node` to
   `dependencies` (or `devDependencies`; deciding at EXECUTE).
   Run `pnpm install` to update lockfile.

2. `pnpm-lock.yaml` — **MODIFY** (auto-update from `pnpm install`).

3. `apps/site/astro.config.mjs` — **MODIFY** (~5-10 LOC). Add
   `import node from '@astrojs/node'`; add
   `adapter: node({ mode: 'standalone' })`. Keep
   `output: 'static'` (Astro 5.18 removed the `'hybrid'` literal —
   under 5.x, `output: 'static'` plus per-route
   `export const prerender = false` is the supported equivalent of
   the legacy hybrid mode). Inline comment documents the Astro 5.18
   behavior. Existing manualChunks + integrations preserved.

4. `apps/site/src/pages/api/notes/[...slug].ts` — **NEW** (~150
   LOC). Server endpoint with `export const prerender = false`:
   - GET handler: read `content/notes/<slug>/index.mdx` via `fs`;
     split frontmatter from body via a local regex helper;
     read sibling `state.json` sidecar if present; return JSON
     `{ mdxSource, lastModified, version }` (NoteState shape per
     ADR-0018 D8). `lastModified` falls back to file `mtimeMs` and
     `version` falls back to `1` when no sidecar exists; 404 if the
     `.mdx` file is not found.
   - POST handler: parse request JSON body as NoteState; read
     existing MDX (if any) and preserve its frontmatter VERBATIM
     (no schema mutation); rewrite the file as
     `{frontmatter}{body=state.mdxSource}`; write
     `{lastModified, version}` to the sibling `state.json`
     sidecar; return `{ ok: true }`; 500 on IO error; 400 on
     invalid body. Sidecar isolation keeps the
     `@skb/content-types` frontmatter authority intact (no
     `lastModified` / `version` fields added there).
   - Slug guard rejects empty / `.` / `..` / backslash segments and
     enforces that resolved paths stay under `content/notes/`.
   - All errors return JSON `{ ok: false, error: string }`.

5. `apps/site/src/pages/api/notes/__tests__/notes-endpoint.test.ts`
   — **NEW** (~150 LOC). Vitest suite covering:
   - GET 200 returns NoteState for existing slug (no sidecar; falls
     back to mtime + version 1)
   - GET 404 for missing slug
   - POST 200 writes mdx + sidecar; mdx frontmatter preserved
     verbatim with no `lastModified` / `version` fields injected
   - POST 400 on missing `mdxSource` field
   - POST 500 on filesystem permission error (mock fs)
   - Roundtrip: POST then GET returns the same NoteState (sidecar
     supplies the metadata)

6. `apps/site/CONTRACT.md` — **MODIFY** (~25 LOC). (a) Append
   `### Server endpoints (Wave 6 Stage B path-(b))` subsection under
   `## Runtime persistence`: documents `/api/notes/[...slug]` GET/POST
   contract, the sidecar `state.json` location, references ADR-0018
   v0.6 D11+D12, and flags apps/api separate-server (path-(a)) as
   Phase 3+ alternative. (b) Amend the `Static build only` invariant
   to a static-first + carved-out-endpoint formulation that
   acknowledges the new server route while keeping all note pages
   prerendered.

7. `docs/plans/wave-6-main/wave-6-stage-b-2-astro-hybrid-endpoint.md` — **NEW** (PR.md self).

8. `docs/decisions/ADR-0018-v2-visual-migration.md` — **MODIFY**
   (~10 LOC). v0.6 amendment alignment fix only:
   D10 prose updated to acknowledge the Astro 5.18 deprecation of
   `output: 'hybrid'` and codify the supported pattern (`output: 'static'`
   + per-route `prerender = false` + Node adapter); D14 sequence row
   B.2 updated to match the implementation actually shipped in this PR
   (sidecar `state.json`; `output: 'static'` retained); D12 server
   endpoint contract rewritten to the two-file (index.mdx + sidecar
   state.json) model with edit-only POST + 404-on-missing semantics;
   ADR-0006 cross-reference upgraded to "9-point asymmetry audit
   (v0.2)" with item #9 acknowledged. No other D-section content
   modified; v0.6 status unchanged at `accepted`.

9. `docs/decisions/ADR-0011-linear-pipeline-execution-model.md` —
   **MODIFY** (~25 LOC). D9.1 amendment surfaced at R5: server-only
   API routes under `apps/site/src/pages/api/**` excluded from
   ui_touch path patterns. Server endpoint contract correctness lives
   in vitest; the product-experience gate does not apply to JSON
   responses with no rendered HTML. D9.1 prose adds an `Exclusion`
   paragraph + cross-reference to the 3 sibling scripts that mirror
   the exclusion. No other D-section modified.

10. `scripts/check-ui-touch.ts` — **MODIFY** (~10 LOC). Add
    `UI_TOUCH_EXCLUDE_PATTERNS = [/^apps\/site\/src\/pages\/api\//]`
    + `classifyFile` returns `null` when the file matches any
    exclusion. Header comment + JSDoc updated to document the
    Wave 6 Stage B.2 amendment.

11. `scripts/check-e2e-coverage.ts` — **MODIFY** (~7 LOC). Mirror
    the same `UI_TOUCH_EXCLUDE_PATTERNS` constant + apply in
    `isUiTouch`. Per ADR-0006 #5 algorithm-replication invariant the
    set must be byte-equal across the 3 scripts.

12. `scripts/check-screenshot-archive.ts` — **MODIFY** (~7 LOC).
    Mirror the same `UI_TOUCH_EXCLUDE_PATTERNS` + apply in
    `isUiTouch` (script already gates on `ui_touch=false` skip-fast).

13. `docs/decisions/ADR-0006-asymmetry-audit-checklist.md` —
    **MODIFY** (~5 LOC). v0.2.1 cross-ref-only amendment (R6
    fold-in): item #9 inline path list (`apps/site/src/{pages,components,styles}/**`
    etc.) replaced with a reference to ADR-0011 D9.1 as the single
    authority source. This prevents the authority-vs-consumer drift
    that item #8 itself warns against. Item #9 prose otherwise
    unchanged. **R8 fold-in additions** (~3 LOC): `8-point` →
    `9-point` and `8 items` → `9 items` swept in Costs +
    Worker-pre-flight prose; ADR-0011 cross-references on the same
    issue swept (lines 347 + 423) so authority + consumer both
    declare 9 items uniformly.

14. `scripts/render/review-checklist.ts` — **MODIFY** (~3 LOC).
    Generator template for `docs/review-checklist.md`. R8 fold-in:
    `items {1..8}` → `items {1..9}`; add a new `[ ] **#9 UI-touch +
    E2E spec audit (v0.2 amendment, ADR-0011 D9)**` checklist row
    that defers to ADR-0011 D9.1 as canonical (matches item #9 prose
    in `ADR-0006-asymmetry-audit-checklist.md`); `8th-class hunt` →
    `9th-class hunt`.

15. `docs/review-checklist.md` — **MODIFY** (regenerated by `pnpm
    generate:configs` from #14). DO NOT EDIT BY HAND. Per ADR-0006
    item #8 lockfile-class evidence, the regenerated output rides
    the same commit as the template change.

16. `scripts/render/claude-md.ts` — **MODIFY** (~2 LOC). Generator
    template for `CLAUDE.md`. R8 fold-in: `ADR-0006 8-point checklist
    mandatory` → `ADR-0006 9-point checklist mandatory` and
    `8-point checklist 8th-class hunt` → `9-point checklist
    9th-class hunt` to match the authority ADR-0006 v0.2 amendment.

17. `CLAUDE.md` — **MODIFY** (regenerated from #16). DO NOT EDIT BY
    HAND. Same commit per ADR-0006 #8 invariant.

18. `scripts/render/codex-tool-runbook.ts` — **MODIFY** (~1 LOC).
    Generator template for `docs/runbooks/codex-tool-invocations.md`.
    R8 fold-in: `ADR-0006 — 8-point asymmetry audit (mandatory for
    code-reviewer + pr-gate profiles)` → `ADR-0006 — 9-point
    asymmetry audit (mandatory for codex-pr-reviewer-55 profile)`
    to match both the ADR-0006 v0.2 9-point amendment AND the
    ADR-0011 D6 reviewer-profile rename (Wave 1+2 era
    `code-reviewer + pr-gate` → Wave 3+ unified
    `codex-pr-reviewer-55`).

19. `docs/runbooks/codex-tool-invocations.md` — **MODIFY**
    (regenerated from #18). DO NOT EDIT BY HAND. Same commit per
    ADR-0006 #8 invariant.

20. `agent-contract.md` — **MODIFY** (~2 LOC). R9 fold-in: root
    authority for the codex tool patterns. The
    `codex-pr-reviewer-55` profile description had two stale
    `8th-class hunt` strings that propagated to
    `docs/runbooks/codex-tool-invocations.md` via
    `pnpm generate:configs` — both swept to `9th-class hunt`.
    Regenerated runbook is item #19.

21. `docs/runbooks/team-operations.md` — **MODIFY** (~1 row in
    "Tier 2 reviewer" table, ~150 LOC of cell content).
    R9 fold-in: the historical `pr-gate (tool)` row (held as Wave
    1+2 reference per the section banner) is updated to the current
    Wave 3+ surface — profile name `codex-pr-reviewer-55` per
    ADR-0011 D6, asymmetry-audit reference `9-point checklist
    (v0.2 + v0.2.1 cross-ref) + 9th-class hunt`. Section banner
    above the table already documents the historical-reference
    intent and is not changed.

## D2 trigger judgment

Row 1 (CONTRACT.md change in apps/site) + Row 2 (NEW dep
`@astrojs/node`) + **Row 4 (TWO ADR amendments: ADR-0011 v0.3 D9.1
amendment folded in at R5 + ADR-0006 v0.2.1 item-#9 cross-ref-only
amendment folded in at R6 — both resolve the API-route ui_touch
authority mismatch surfaced at R5)** + Row 5 (cross-package:
apps/site + content/notes filesystem surface + 3 sibling CI gate
scripts). PRE-COMMIT CLAUDE REVIEW fires per Row 1+4.

## ui_touch

`false` — `apps/site/src/pages/api/**` is excluded from ui_touch
path patterns per the ADR-0011 D9.1 amendment shipped in this PR.
Verified locally:

```bash
pnpm exec tsx scripts/check-ui-touch.ts \
  --files apps/site/CONTRACT.md apps/site/astro.config.mjs \
          apps/site/package.json pnpm-lock.yaml \
          'apps/site/src/pages/api/notes/[...slug].ts' \
          'apps/site/src/pages/api/notes/__tests__/notes-endpoint.test.ts' \
          docs/decisions/ADR-0006-asymmetry-audit-checklist.md \
          docs/decisions/ADR-0011-linear-pipeline-execution-model.md \
          docs/decisions/ADR-0018-v2-visual-migration.md \
          docs/plans/wave-6-main/wave-6-stage-b-2-astro-hybrid-endpoint.md \
          scripts/check-ui-touch.ts scripts/check-e2e-coverage.ts \
          scripts/check-screenshot-archive.ts
# verdict: ui_touch=false
```

## e2e_smoke

(omitted — `ui_touch: false`)

## decision-log

### Decision 1 — Adapter choice: @astrojs/node standalone

Astro 5.18 mixed-mode (per-route `prerender = false`) requires a
deployment adapter. Choices: Node / Cloudflare / Vercel / Netlify /
Deno. Wave 6 Stage B targets dev + preview locally; @astrojs/node
`mode: 'standalone'` works for both `astro dev` (built-in dev server)
AND `astro preview` (post `astro build` + `node dist/server/entry.mjs`).
Simplest. Production adapter selection is Phase 3+ user choice.

### Decision 2 — Frontmatter parse: local regex helper (no new dep)

The endpoint only needs to split YAML frontmatter (`---\n...\n---\n`)
from body bytes — no field-level parsing. A 3-line regex helper
(`/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/`) is sufficient and avoids
a new runtime dependency. The endpoint never inspects, validates,
or rewrites fields inside the frontmatter block; that authority stays
with `@skb/content-types` per the apps/site Static-first build invariant.

### Decision 3 — Endpoint path

Astro file-based routing: `apps/site/src/pages/api/notes/[...slug].ts`
maps to URL `/api/notes/<slug>` (rest parameter handles nested
slugs like `__test_cjk__/laptop`). Matches ApiAdapter `/api/notes/<slug>`
URL pattern from v0.6 D11 contract.

### Decision 4 — Filesystem write semantics + sidecar `state.json`

POST is **edit-only**: it writes back to an existing
`content/notes/<slug>/index.mdx` and refuses new-note creation. When
the MDX file is missing, POST returns HTTP 404 — a body-only POST
cannot supply the `title` / `date` / `tags` / `draft` frontmatter
required by the `@skb/content-types` schema, and silently creating
a frontmatter-less file would break the next content sync /
`astro build`. New-note creation is out of Wave 6 Stage B scope.

When the MDX file exists, frontmatter is preserved verbatim
(re-serialized byte-equal to its read bytes); only the body is
replaced with `state.mdxSource`. **Persistence metadata is NOT
written into the frontmatter** — `lastModified` + `version` are
written to a sibling `state.json` sidecar at
`content/notes/<slug>/state.json`. This preserves the
`@skb/content-types` frontmatter authority (no new fields → no
schema drift → no consumer-side updates). On GET, the endpoint
reads both files and falls back to `mtimeMs` + `version: 1` when
the sidecar is absent (e.g., notes that have never been edited
through the API). Atomic write via temp-file + rename is left to a
follow-up if/when partial-write corruption surfaces in real
environments; the unit suite does not require it.

### Decision 5 — Vitest over Playwright at B.2

Server endpoint contract is testable via vitest with mocked fs +
mocked Request/Response. No browser needed at B.2; full e2e
(Playwright) lands at B.5 close after B.4 wires EditorShellMount
to ApiAdapter.

## acceptance

```bash
# AC-1: ui_touch authority gate. Per the ADR-0011 D9.1 amendment shipped
# in this PR, server-only API routes under apps/site/src/pages/api/**
# are excluded from ui_touch path patterns. The full B.2 file set (13
# files) must yield ui_touch=false; D9.2 e2e_smoke obligation is then
# correctly skipped per D9.6 / check-e2e-coverage.ts ui_touch=false
# fast-skip + check-screenshot-archive.ts symmetric ui_touch=false skip.
pnpm exec tsx scripts/check-ui-touch.ts \
  --files apps/site/CONTRACT.md apps/site/astro.config.mjs \
          apps/site/package.json pnpm-lock.yaml \
          'apps/site/src/pages/api/notes/[...slug].ts' \
          'apps/site/src/pages/api/notes/__tests__/notes-endpoint.test.ts' \
          docs/decisions/ADR-0006-asymmetry-audit-checklist.md \
          docs/decisions/ADR-0011-linear-pipeline-execution-model.md \
          docs/decisions/ADR-0018-v2-visual-migration.md \
          docs/plans/wave-6-main/wave-6-stage-b-2-astro-hybrid-endpoint.md \
          scripts/check-ui-touch.ts scripts/check-e2e-coverage.ts \
          scripts/check-screenshot-archive.ts 2>&1 | tail -1
# Expected: ui_touch=false
```

```bash
# AC-2: @astrojs/node added + Node standalone adapter configured.
# Astro 5.18 reality: 'output: hybrid' was removed; 'output: static'
# now supports mixed prerendered + non-prerendered routes via
# per-route 'export const prerender = false' (asserted in AC-3).
grep -cE '"@astrojs/node"' apps/site/package.json
# Expected: ≥1
grep -cE "output:\s*'static'" apps/site/astro.config.mjs
# Expected: 1
grep -cE "adapter:\s*node\(" apps/site/astro.config.mjs
# Expected: 1
```

```bash
# AC-3: server endpoint file exists with prerender=false
test -f apps/site/src/pages/api/notes/\[...slug\].ts
grep -cE "export const prerender = false" apps/site/src/pages/api/notes/\[...slug\].ts
# Expected: 1
```

```bash
# AC-4: GET + POST handlers exported
grep -cE "export (async )?function (GET|POST)" apps/site/src/pages/api/notes/\[...slug\].ts
# Expected: ≥2 (GET + POST)
```

```bash
# AC-5: vitest endpoint suite passes
pnpm --filter @skb/site test 2>&1 | grep 'Tests'
# Expected: existing 70 + 5+ new endpoint tests
```

```bash
# AC-6: pnpm check exit 0
pnpm check
```

```bash
# AC-7a: CONTRACT.md sister-doc adds the new server endpoints subsection
grep -cE 'Server endpoints \(Wave 6 Stage B path-\(b\)\)' apps/site/CONTRACT.md
# Expected: 1
```

```bash
# AC-7b: CONTRACT.md "Static build only" invariant amended to a
# static-first + carve-out formulation (no contradictory "must not
# introduce SSR" prose).
grep -cE 'must not introduce SSR' apps/site/CONTRACT.md
# Expected: 0
grep -cE 'Static-first build with carved-out server endpoints' apps/site/CONTRACT.md
# Expected: 1
```

```bash
# AC-7c: endpoint preserves @skb/content-types frontmatter authority.
# Frontmatter must NOT carry persistence metadata; sidecar state.json carries it.
grep -cE 'state.json' apps/site/src/pages/api/notes/\[...slug\].ts
# Expected: ≥1
grep -cE 'lastModified' packages/content-types/src/frontmatter.ts
# Expected: 0 (no schema drift)
```

```bash
# AC-8a: scope-fence — exactly 21 source files. Trajectory:
#   pre-R5: 7-9 (initial draft)
#   R5:    +4 (ADR-0011 D9.1 + 3 sibling scripts)        → 12
#   R6:    +1 (ADR-0006 v0.2.1 item #9 cross-ref-only)   → 13
#   R8:    +6 (3 render templates + 3 regenerated docs)  → 19
#   R9:    +2 (agent-contract.md + team-operations.md)   → 21
git diff --name-only main..HEAD -- ':!docs/audits/codex-runs/' | sort | wc -l
# Expected: 21
```

```bash
# AC-8b: audit-log archives (R7 mitigation; one per codex R-round).
# Count varies by review depth; ≥3 expected (R2 + later rounds).
git diff --name-only main..HEAD -- 'docs/audits/codex-runs/' | wc -l
# Expected: ≥3
```

```bash
# AC-9: anti-leak (char-class [:]). With ui_touch=false (per AC-1) the
# leak window narrows: PR.md self may still mention the keys in narrative
# prose; the diff outside PR.md must NOT add e2e_smoke entries.
git diff main..HEAD -- ':!docs/plans/wave-6-main/wave-6-stage-b-2-astro-hybrid-endpoint.md' | grep -cE '^\+.*(playwright_spec[:]|screenshot_archive[:]|e2e_smoke[:])' || true
# Expected: 0
```

```bash
# AC-10: ADR-0011 D9.1 amendment authority + script mirror.
# (a) D9.1 prose adds Exclusion paragraph for apps/site/src/pages/api/**;
# (b) all 3 sibling scripts carry the same UI_TOUCH_EXCLUDE_PATTERNS set.
grep -cE 'apps/site/src/pages/api' docs/decisions/ADR-0011-linear-pipeline-execution-model.md
# Expected: ≥1
grep -cE 'UI_TOUCH_EXCLUDE_PATTERNS' scripts/check-ui-touch.ts scripts/check-e2e-coverage.ts scripts/check-screenshot-archive.ts | wc -l
# Expected: 3 (one match per script)
```

## Out-of-scope

- **B.3 ApiAdapter implementation**: next PR per v0.6 D14 sequence.
- **B.4 EditorShellMount wire to ApiAdapter primary**: B.4 scope.
- **B.5 close + e2e Playwright spec**: B.5 scope.
- **Production deployment adapter**: Phase 3+ (Cloudflare / Vercel / Netlify).
- **Multi-user auth boundary**: Phase 3+.
- **Atomic write via tmpfile rename**: best-effort at B.2; refinement deferred if needed.

## Related

- [ADR-0018 v0.6 amendment](../../decisions/ADR-0018-v2-visual-migration.md) D11+D12 — endpoint contract authority
- [B.1 PR.md](wave-6-stage-b-1-adr-0018-amendment.md) — ADR amendment merged at squash `fc7689f`
- Sister: B.3 (ApiAdapter impl), B.4 (mount wire), B.5 (close)
