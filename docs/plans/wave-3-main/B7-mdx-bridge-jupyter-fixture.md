# B7 — mdx-bridge jupyter fixture #27 (Stage B per-block round-trip)

> **Wave 3 Stage B 7th PR.** Mechanical clone of B6 pattern for
> block-jupyter (FIRST viz block). Per locked plan B7 entry (line 453):
> "jupyter — code attr + libraries array (JSON-encoded expression-attr)."

## title

Add jupyter fixture #27 to mdx-bridge round-trip suite. Register `Jupyter`
mdxComponent dispatch via `@skb/block-jupyter/core` devDep. CONTRACT
fixture-table grows 14 → 15. First viz-kind fixture.

## files

Created (NEW — 1 fixture + 1 self-listed):

- `packages/mdx-bridge/src/__tests__/fixtures/27-jupyter.mdx` *(canonical
  Jupyter MDX, self-closing JSX with code/runOnLoad/showLineNumbers/libraries.
  serializeJupyter always emits all 4 attrs; libraries is JSON-stringified
  array — fixture uses `libraries="[]"` (empty array) for round-trip
  predictability without expression-attr complexity.)*
- `docs/plans/wave-3-main/B7-mdx-bridge-jupyter-fixture.md` *(this PR.md.)*

Modified (4 source/config files + 1 lockfile):

- `packages/mdx-bridge/src/__tests__/round-trip.test.ts` — mirror B6
  pattern: imports jupyterCore + parseJupyter + serializeJupyter; new
  ensureJupyterDispatch helper; buildComponentBlockOptions registers all
  6 component cores (callout/code/image/math/pdf/jupyter); optionsForFixture
  detects `<Jupyter` source; beforeAll calls all six ensureXDispatch;
  fixture-count assertion 14 → 15.
- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose 14 → 15.
- `packages/mdx-bridge/package.json` — add `@skb/block-jupyter` devDep.
- `packages/mdx-bridge/tsconfig.json` — add block-jupyter reference.
- `pnpm-lock.yaml` — workspace devDep edge.

= **7 files in canonical `## files` block** (counts canonical here).

## test_cases

- **TC1** idempotent RTT for jupyter fixture.
- **TC2** lossless `_mdast`-stripped serialize.
- **TC3** vitest exit 0.
- **TC4** typecheck exit 0.
- **TC5** pnpm check exit 0.
- **TC6** CONTRACT fixture-count grew exactly 1.
- **TC7** devDep architecture preserved.
- **TC8** lockfile idempotency.

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose bump.

## adr_touched

None.

## acceptance

1. `pnpm --filter=@skb/mdx-bridge test` exits 0 — TC3.
2. `pnpm --filter=@skb/mdx-bridge typecheck` exits 0 — TC4.
3. `pnpm check` exits 0 — TC5.
4. CONTRACT.md fixture-count bumped — TC6.
5. block-jupyter in devDependencies only — TC7.
6. Lockfile clean delta + idempotent — TC8.
7. PR.md self-listed.
8. Protected files unchanged.
9. ADR-0008 D1 three-way: 1 runtime + 6 devDeps + 7 tsconfig refs.

## executor

Path B (orchestrator-self EXECUTE; mechanical clone). REVIEW: codex-pr-reviewer-55.

## D2 trigger judgment

- Row 1: **HIT**.
- Rows 2/4/5/8: NO.

→ D1 stage 4 fires.

## Out-of-scope

- B8 fixture (nn-viz + agent-flow combined).
- Production registerJsxDispatch.
- block-jupyter source modifications.
- Expression-attr arrays (Wave 3 mdx-bridge has only string-attr support; Jupyter `libraries` uses JSON-string-encoded array per Wave 2 stub).

## Related

- [Wave 3 plan, B7 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (line 453).
- [B6 PR.md](./B6-mdx-bridge-pdf-fixture.md) — predecessor.
- [ADR-0011 D2 v0.1.1](../../decisions/ADR-0011-linear-pipeline-execution-model.md).
