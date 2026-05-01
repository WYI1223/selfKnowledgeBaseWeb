# B8 — mdx-bridge nn-viz + agent-flow combined fixtures (Stage B close)

> **Wave 3 Stage B 8th and FINAL PR.** Combined per-block fixture for the
> last two viz blocks (block-nn-viz + block-agent-flow). Per locked plan
> B8 entry (line 454): "combined PR for nn-viz + agent-flow (shorter
> blocks; both have expression-attr arrays; bundled to keep total wave PR
> count at 21 per user spec). Two fixtures (28 + 29) committed together."

## title

Add nn-viz fixture #28 + agent-flow fixture #29 to mdx-bridge round-trip
suite. Register `NnViz` + `AgentFlow` mdxComponent dispatch via
`@skb/block-nn-viz/core` + `@skb/block-agent-flow/core` devDeps. CONTRACT
fixture-table grows 15 → 17. **Closes Stage B.**

## files

Created (NEW — 2 fixtures + 1 self-listed):

- `packages/mdx-bridge/src/__tests__/fixtures/28-nn-viz.mdx` *(canonical
  NnViz MDX, self-closing JSX with modelUrl + layers (JSON-string-encoded
  empty array) + showWeights. serializeNnViz always emits all 3 attrs.)*
- `packages/mdx-bridge/src/__tests__/fixtures/29-agent-flow.mdx` *(canonical
  AgentFlow MDX, self-closing JSX with nodes (JSON-string-encoded empty
  array) + edges (same) + interactive. serializeAgentFlow always emits all
  3 attrs.)*
- `docs/plans/wave-3-main/B8-mdx-bridge-nn-viz-agent-flow.md` *(this PR.md.)*

Modified (4 source/config files + 1 lockfile):

- `packages/mdx-bridge/src/__tests__/round-trip.test.ts` — extends
  combined pattern to register both nn-viz + agent-flow:
  imports nnVizCore/parseNnViz/serializeNnViz +
  agentFlowCore/parseAgentFlow/serializeAgentFlow; new
  ensureNnVizDispatch + ensureAgentFlowDispatch helpers;
  buildComponentBlockOptions registers all 8 component cores;
  optionsForFixture detects `<NnViz` + `<AgentFlow` source; beforeAll
  calls all 8 ensureXDispatch; fixture-count assertion 15 → 17.
- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose updated to
  Stage B close form: "Stage B closed (post-B8 final: 9 prose + 8
  component fixtures = 17 fixtures × 2 invariants = 34 RTT assertions)".
- `packages/mdx-bridge/package.json` — add `@skb/block-nn-viz` +
  `@skb/block-agent-flow` devDeps (alphabetically placed).
- `packages/mdx-bridge/tsconfig.json` — add 2 references (block-nn-viz +
  block-agent-flow).
- `pnpm-lock.yaml` — workspace devDep edges.

= **8 files in canonical `## files` block** (counts canonical here).

## test_cases

- **TC1** idempotent RTT for nn-viz fixture.
- **TC2** lossless `_mdast`-stripped serialize for nn-viz.
- **TC3** idempotent RTT for agent-flow fixture.
- **TC4** lossless `_mdast`-stripped serialize for agent-flow.
- **TC5** vitest exit 0 (test count canonical here).
- **TC6** typecheck exit 0.
- **TC7** pnpm check exit 0.
- **TC8** CONTRACT fixture-count grew exactly 2 (15 → 17).
- **TC9** devDep architecture preserved (both blocks only in devDependencies).
- **TC10** lockfile idempotency.

## contracts_affected

- `packages/mdx-bridge/CONTRACT.md` — fixture-count prose updated to Stage B close form.

## adr_touched

None.

## acceptance

1. `pnpm --filter=@skb/mdx-bridge test` exits 0 — TC5.
2. `pnpm --filter=@skb/mdx-bridge typecheck` exits 0 — TC6.
3. `pnpm check` exits 0 — TC7.
4. CONTRACT.md fixture-count bumped 15 → 17 with Stage B close prose — TC8.
5. block-nn-viz + block-agent-flow in devDependencies only — TC9.
6. Lockfile clean delta + idempotent — TC10.
7. PR.md self-listed.
8. Protected files unchanged (block-nn-viz + block-agent-flow + others).
9. ADR-0008 D1 three-way: 1 runtime + 8 devDeps + 9 tsconfig refs (Stage B final state).
10. Stage B close ceremony: all 8 Wave 2 component blocks now have RTT fixtures in mdx-bridge round-trip suite.

## executor

Path B (orchestrator-self EXECUTE; combined Stage B close PR). REVIEW: codex-pr-reviewer-55. PRE-COMMIT CLAUDE: orchestrator-self. COMMIT: orchestrator-self.

## D2 trigger judgment

- Row 1 (CONTRACT.md fixture-count + Stage B close prose): **HIT**.
- Row 2 (package add/remove): NO.
- Row 4 (new ADR): NO.
- Row 5 (cross ≥3 packages): NO (mdx-bridge + 2 sibling devDeps + lockfile).
- Row 8 (CI/build/deploy): NO.

→ D1 stage 4 fires.

## Stage B close note

This PR closes Wave 3 Stage B. Full RTT coverage for all 8 Wave 2
component blocks:

| # | Fixture | Block | kind | PR |
|---|---|---|---|---|
| 22 | callout | block-callout | component | B2 |
| 23 | code | block-code | component | B3 |
| 24 | image | block-image | component | B4 |
| 25 | math | block-math | render | B5 |
| 26 | pdf | block-pdf | render | B6 |
| 27 | jupyter | block-jupyter | viz | B7 |
| 28 | nn-viz | block-nn-viz | viz | B8 |
| 29 | agent-flow | block-agent-flow | viz | B8 |

Per ADR-0009 D1 distribution: 3 component + 2 render + 3 viz = 8 ✓.

mdx-bridge devDep architecture (Stage B final): 8 block-* devDeps (one
per block) + 1 runtime block-foundation dep = 9 `@skb/*` workspace deps
total. tsconfig references graph: 9 entries. Three-way symmetry holds.

ADR-0011 v0.1.1 SOTed-PR.md discipline applied throughout Stage B (zero
R-rounds for B4 + B5 + B6 + B7; 2 R-rounds for B2 + 1 each for B1+B3).

## Out-of-scope

- Production registerJsxDispatch wiring (Stage C).
- block-* source modifications.
- Expression-attr array support in mdx-bridge (Wave 4 candidate; Stage B uses Wave 2 stub JSON-string encoding for layers/nodes/edges).

## Related

- [Wave 3 plan, B8 entry](../../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) (line 454).
- [B7 PR.md](./B7-mdx-bridge-jupyter-fixture.md) — predecessor.
- [B1 PR.md](./B1-mdx-bridge-jsx-routing.md) — Stage B opener (dispatch infrastructure).
- [B2 PR.md](./B2-mdx-bridge-callout-fixture.md) — B-stage pattern source.
- [ADR-0011 D2 v0.1.1](../../decisions/ADR-0011-linear-pipeline-execution-model.md).
- [ADR-0009 D1](../../decisions/ADR-0009-block-kind-union-expansion.md) — 3+2+3 BlockKind distribution.
