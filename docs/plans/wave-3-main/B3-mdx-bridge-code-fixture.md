# B3 — mdx-bridge code fixture #23 (Stage B per-block round-trip)

> **Wave 3 Stage B 3rd PR.** Mechanical application of B2's per-block
> template (B-stage pattern locked at B2 close): real `@skb/block-code` as
> mdx-bridge devDep + `<Code language="ts" showLineNumbers>` fixture +
> dispatch registration in `beforeAll`. Per locked plan B3 entry (lines
> 442-449): "code — language + showLineNumbers attrs."

## title

Add code fixture #23 to mdx-bridge round-trip suite. Register `Code`
mdxComponent dispatch via `@skb/block-code/core` devDep import. CONTRACT
fixture-table grows 10 → 11. Pattern reusable for B4-B8.

## files

Created (NEW — 1 fixture + 1 self-listed):

- `packages/mdx-bridge/src/__tests__/fixtures/23-code.mdx` *(canonical
  Code MDX, self-closing JSX with `code` as required string prop. See
  the fixture file for the exact attribute set; `showLineNumbers` is
  set to its non-default value to preserve the attribute through
  serialize canonicalization. ~5-7 LOC.)*
- `docs/plans/wave-3-main/B3-mdx-bridge-code-fixture.md` *(this PR.md;
  ADR-0006 D8 strict whitelist; PR #1 R2 lesson, B-stage pattern.)*

Modified (4 source/config files + 1 lockfile):

- `packages/mdx-bridge/src/__tests__/round-trip.test.ts` — three
  coordinated edits mirroring B2's pattern:
  1. Add `import { codeCore, parseCode, serializeCode } from '@skb/block-code/core';`
     alongside existing callout imports.
  2. Add `ensureCodeDispatch()` helper (mirrors `ensureCalloutDispatch`)
     + extend `optionsForFixture()` to register both callout AND code
     in the returned BlockRegistry when fixture matches `2[2-9]-` OR
     source contains `<Code` / `<Callout`.
  3. Update `beforeAll` to call both `ensureCalloutDispatch()` and
     `ensureCodeDispatch()`.
  4. Bump fixture-count assertion `expect(FIXTURES.length).toBeGreaterThanOrEqual(10)` → `11`.
- `packages/mdx-bridge/CONTRACT.md` — bump fixture-count prose 10 → 11
  (single-line edit; canonicalization-rules section from B2 unchanged).
- `packages/mdx-bridge/package.json` — add `@skb/block-code` to
  `devDependencies` (NOT runtime; B-stage pattern locked at B2).
- `packages/mdx-bridge/tsconfig.json` — add `{ "path": "../block-code" }`
  to `references` array (alongside existing block-foundation +
  block-callout entries).
- `pnpm-lock.yaml` — workspace devDep edge mutation post `pnpm install`
  (B1+B2 protocol: orchestrator-side reset to main + local pnpm install
  for clean delta).

= **7 files in canonical `## files` block** (2 NEW + 5 modified
including lockfile; counts canonical here, cross-referenced as "per
`## files`" elsewhere).

**Explicitly NOT in `files:`** (verification-only, no edit):

- `packages/block-code/` — pure consumer (devDep import only). Verify
  via `git diff main -- packages/block-code/` returns empty.
- `packages/block-foundation/` — unchanged. Verify same way.
- `packages/mdx-bridge/src/__tests__/jsx-routing.test.ts` — B1
  deliverable; B2 renamed to `TestCallout`. B3 doesn't touch.
- `agent-contract.md`, root `tsconfig.json`, `pnpm-workspace.yaml` —
  unchanged.

## test_cases

Per-block template (locked plan B-stage Bx):

- **TC1** (idempotent invariant): `tiptapToMdx(mdxToTiptap(fixture, opts), opts).trim() === fixture.trim()` for the new code fixture. Driven by table-driven loop in round-trip.test.ts. Location: `round-trip.test.ts` table iteration.
- **TC2** (lossless invariant): stripping `_mdast` then serializing produces same MDX. Same loop, second `for` block.
- **TC3** (per-package vitest count): `pnpm --filter=@skb/mdx-bridge test` reports 2 files / 37 tests PASS (35 carryover B2 + 2 new code RTT).
- **TC4** (typecheck): `pnpm --filter=@skb/mdx-bridge typecheck` exit 0.
- **TC5** (pnpm check): exit 0.
- **TC6** (CONTRACT fixture-count grew exactly 1): `grep '11' packages/mdx-bridge/CONTRACT.md` shows new fixture-count prose.
- **TC7** (devDep architecture preserved): `node -e 'const p=require("./packages/mdx-bridge/package.json");console.log("dev:",Object.keys(p.devDependencies||{}).filter(k=>k.startsWith("@skb/block-")).length)'` returns 2 (block-callout + block-code; no block-* in dependencies).
- **TC8** (lockfile idempotency): second `pnpm install` produces zero new diff.

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose (single-line bump).

## adr_touched

None. B-stage pattern locked at B2; B3 is mechanical clone.

## acceptance

1. `pnpm --filter=@skb/mdx-bridge test` exits 0 — TC3 evidence (test count canonical in TC3).
2. `pnpm --filter=@skb/mdx-bridge typecheck` exits 0 — TC4.
3. `pnpm check` exits 0 — TC5.
4. CONTRACT.md fixture-count prose bumped to 11 — TC6.
5. `@skb/block-code` in devDependencies; NOT in dependencies — TC7.
6. Lockfile +N lines (workspace edge); idempotent post second install — TC8.
7. PR.md self-listed in commit (per `## files`).
8. Protected files unchanged: `git diff main -- packages/block-code/ packages/block-foundation/ packages/mdx-bridge/src/__tests__/jsx-routing.test.ts agent-contract.md` returns empty.
9. ADR-0008 D1 three-way symmetry: 1 runtime dep + 2 devDeps (block-callout + block-code) + 3 tsconfig references (foundation + callout + code) + symmetric source imports.

## executor

Path A (codex-generic-executor 3rd use; B-stage pattern). REVIEW: codex-pr-reviewer-55. PRE-COMMIT CLAUDE: orchestrator-self (D2 row 1 hit). COMMIT: orchestrator-self (transitional; same as B1+B2). ACCEPT: pr-writer subagent.

Audit logs: `.codex-runs/wave-3-main/B3-execute.txt` + `.codex-runs/wave-3-main/B3-review.txt`.

## D2 trigger judgment (orchestrator-locked at PLAN)

- Row 1 (CONTRACT.md fixture-count change): **HIT**.
- Row 2 (package add/remove): NO.
- Row 4 (new ADR): NO (B-stage pattern locked at B2).
- Row 5 (cross ≥3 packages): NO (mdx-bridge + block-code devDep + lockfile = 2 active packages).
- Row 8 (CI/build/deploy): NO.

→ D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires (Row 1).

## Out-of-scope (explicitly deferred)

- B4-B8 fixtures (image/math/pdf/jupyter/nn-viz+agent-flow).
- Production `registerJsxDispatch` calls in apps/site / editor-shell (Stage C).
- block-code source modifications (B3 is consumer-only).

## Related

- [Wave 3 plan, B3 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) — locked plan (lines 442-449).
- [B2 PR.md](./B2-mdx-bridge-callout-fixture.md) — predecessor; established B-stage pattern.
- [B1 PR.md](./B1-mdx-bridge-jsx-routing.md) — dispatch infrastructure.
- [ADR-0011 D2](../../decisions/ADR-0011-linear-pipeline-execution-model.md) v0.1.1 SOTed-PR.md discipline.
