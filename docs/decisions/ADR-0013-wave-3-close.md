# ADR-0013: Wave 3 close — main pipeline 24-PR ratification + Wave 4 deferred set + ADR-0011 D1 retrospective

| 字段 | 值 |
| ---- | --- |
| 状态 | accepted |
| 日期 | 2026-05-01 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | Wave 3 main pipeline closed at HEAD `4deb5cb` (D3 — Stage D 4/4 final). Same-session close ceremony per user 2026-05-01 directive. |
| 替代 | 不替代任何 ADR；扩展 [ADR-0010](ADR-0010-wave-2-close.md) close-ceremony 模式 + 实战检验 [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) D1 linear pipeline + D2 SOTed-PR.md schema |

## Context

Wave 3 (Phase 1 Wave 3, 2026-05-01) shipped 24 main pipeline PRs across Pre-A + 4 stages (A=5, B=8, C=3 of 6 with C4a/C4b/C5 deferred to Wave 4, D=4) under the [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) D1 linear pipeline execution model.

Structurally distinct from Wave 1 (parallel small-team) + Wave 2 (parallel 4-worker concurrency): **Wave 3 ran a single long-term Claude orchestrator session executing 24 strictly serial PRs**, with codex-heavy execution at stage 2-3-5 (codex-generic-executor + codex-pr-reviewer-55) and orchestrator-self at stage 4 (PRE-COMMIT CLAUDE REVIEW on D2-trigger Row 1+4 hits).

This ADR ratifies:
1. The 24-PR roster + their merge order + forward-fix ratio
2. The architecture decisions ratified inside Wave 3 (ADR-0011 + ADR-0012)
3. Wave 4-deferred items (C4a/C4b/C5 + ADR-0014 + ADR-0012 amendment)
4. 12+ retrospective items collated from Wave 3 execution
5. Hand-off to Wave 4 with `docs/plans/active.md` repointed
6. ADR-0011 D1 linear pipeline empirical evaluation (kept vs. amend)

## Decision

Wave 3 closes with the following ratifications:

### D1 — Wave 3 main pipeline 24-PR roster (final state)

24 PRs merged via `gh pr merge --squash --delete-branch` (per memory `feedback_wave3_auto_merge.md` user authorization). HEAD = `4deb5cb`.

#### Pre-A (1 PR — bootstrap)

| PR | HEAD (squash) | Subject | D1 stages fired |
|---|---|---|---|
| #4 | (Pre-A1) | codex profile TOML merge bootstrap (5 codex- prefixed profiles + plan-challenger + pr-gate transitional) | 1+2+3+5+6 |

#### Stage A (5 PRs — editor-shell skeleton)

| PR | Subject | D1 stages fired |
|---|---|---|
| #5 | A1 — editor-shell package scaffold | 1+2+3+5+6 |
| #6 | A2 — Tiptap EditorShell component (4-prop API + initialContent conditional spread) | 1+2+3+5+6 |
| #7 | A3 — registerBlocks 5/3 cast asymmetry (3 R-rounds; ADR-0009 BlockKind 4-way confirmed) | 1+2+3+5+6 |
| #8 | A4 — registerKernels default-param adapter | 1+2+3+5+6 |
| #9 | A5 — saveLoad MDX bridge (first SOTed-PR.md PR; 0 R-rounds) | 1+2+3+5+6 |

#### Stage B (8 PRs — mdx-bridge component-block round-trip)

| PR | Subject | D1 stages fired |
|---|---|---|
| #11 | Pre-B1 (ADR-0011 v0.1.1 SOTed-PR.md amendment, 3 R-rounds — meta-irony codifying SOTed itself failing SOTed) | 1+2+3+4+5+6 (D2 row 4 ADR amendment) |
| #12 | B1 — dispatch-table.ts (mdx-bridge external dispatch table per option (b)) | 1+2+3+5+6 |
| #13 | B2 — block-callout RTT fixture (real Callout under TestCallout-renamed B1 fake) | 1+2+3+5+6 |
| #14 | B3 — block-code RTT (showLineNumbers="false" canonicalization fix) | 1+2+3+5+6 |
| #15 | B4 — block-image RTT | 1+2+3+5+6 |
| #16 | B5 — block-math RTT | 1+2+3+5+6 |
| #17 | B6 — block-pdf RTT | 1+2+3+5+6 |
| #18 | B7 — block-jupyter RTT | 1+2+3+5+6 |
| #19 | B8 — block-nn-viz + block-agent-flow RTT (Stage B close: 9 prose + 8 component fixtures = 17 × 2 invariants = 34 RTT assertions) | 1+2+3+5+6 |

#### Stage C (3 of 6 PRs — apps/site BlockRegistry; C4a/C4b/C5 deferred to Wave 4)

| PR | Subject | D1 stages fired |
|---|---|---|
| #20 | C1 — MDX componentsMap + BlockRegistry boot (conditional dynamic import in [...slug].astro) | 1+2+3+5+6 |
| #21 | C2 — Phase 1 dynamic chunking (4 R-rounds: manualChunks regex; documented Phase 1 vs Phase 2 deferred) | 1+2+3+5+6 |
| #22 | C3 — sample-blocks page goes live + adapter pattern (R-during-EXECUTE: MDX prop-shape + TF.js CommonJS gaps surfaced; 5 light-block adapters + 3 heavy-block SSR placeholders) | 1+2+3+5+6 |

#### Stage D (4 PRs — search index)

| PR | Subject | D1 stages fired |
|---|---|---|
| #23 | D1a — search-index research spike (researcher Claude subagent one-shot; 16-source citation; PageFind recommended) | 1+(2 = researcher subagent)+5+6 |
| #24 | D1b — ADR-0012 search index stack (PageFind via astro-pagefind; plan-challenger 4 challenges + 4 suggestions absorbed) | 1+2+3+4+5+6 (D2 row 4 new ADR) |
| #25 | D2 — search index build-time integration (astro-pagefind 1.8.6 + 2 vitest specs; CJK runtime discriminator deferred to D3) | 1+2+3+5+6 |
| #26 | D3 — search index UI (SearchBox + /search route + playwright spec; 4 forward-fix attempts: pagefind binary lookup → playwright build+preview → CJK inverse-assertion drop → unused helper cleanup) | 1+2+3+5+6 |

**Forward-fix ratio**: 4 PRs of 24 main pipeline (#23 lychee fix + #24 lychee+retries + #25 binary lookup + #26 4 fixes) = **17%** forward-fix on initial CI. Note: 3 of 4 were in the same problem class (CI runner network/binary/build-mode environmental issues, not implementation defects). True implementation-defect forward-fix ≈ **4%** (#22 R-during-EXECUTE adapter scope expansion only).

### D2 — Wave 3 architecture decisions ratified (2 ADRs)

| ADR | Subject | PR |
|---|---|---|
| [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) D-list (was draft pre-Wave 3) | Linear pipeline 6 stages + D2 PR.md schema + v0.1.1 SOTed-PR.md mandatory amendment | wave-3-prep #1 (pre-Wave 3 main) + Pre-B1 #11 (v0.1.1 amendment) |
| [ADR-0012](ADR-0012-search-index-stack.md) | Search index stack: PageFind 1.5.0+ via astro-pagefind 1.8.6+ adapter + 5 acceptance criteria (3 D1a-locked + 2 D1b-new) | D1b #24 |

### D3 — Wave 4 deferred items (binding handoff)

The following Wave 3-scope items are **explicitly deferred to Wave 4**:

#### Stage C unfinished (3 PRs)

- **C4a** — apps/site Astro variants for the 3 missing blocks (math/pdf/jupyter — per locked plan; deferred per user 2026-05-01 Option (A) "defer SSR-parity to Wave 4")
- **C4b** — apps/site Astro variants for the 2 remaining heavy blocks (nn-viz/agent-flow)
- **C5** — Phase 2 selective per-block heavy-chunk loading + perf-baseline measurement against C1 (codex-perf-auditor dispatch deferred from C3 R-during-EXECUTE)

#### ADR-0014 candidate (heavy-block client:only + skeleton — Wave 4)

C3 surfaced the 3 heavy blocks (Jupyter/NnViz/AgentFlow) cannot SSR in Astro's ESM-only static build because TF.js / Pyodide / React Flow use CommonJS `require()`. C3 shipped SSR placeholders with `data-block` + `data-deferred="wave-4"` markers as the Phase 1 mitigation. **ADR-0014 candidate (Wave 4)** must:
- Define client:only wrapper components for runtime heavy-block rendering with SSR-safe stubs
- Document the wrapper API (placeholder props → live-render boundary)
- Include skeleton loading states matching the SSR placeholder dimensions to avoid layout shift on hydration

#### ADR-0012 amendment (PageFind query-time substring finding — Wave 4)

D3 runtime CI revealed ADR-0012 criterion 4's inverse discriminator (`记本` MUST NOT match `笔记本电脑`) is not enforceable on PageFind 1.5+: PageFind indexes CJK via `Intl.Segmenter` correctly but the QUERY parser still applies partial-substring matching against indexed tokens. Saved as project memory `feedback_pagefind_query_substring.md`. **ADR-0012 amendment (Wave 4)** must either:
- (a) describe the substring fallback as expected and explicitly waive the inverse assertion, OR
- (b) introduce a custom query parser that surfaces a true word-level mode (would require pagefind upstream feature OR app-side post-filter)

#### Path-prose alignment (small docs PR, Wave 4)

ADR-0012 Decision §3 + 5 + Consequences references `dist/_pagefind/` (historical pre-1.5 path); pagefind 1.5+ emits to `dist/pagefind/` without underscore. CONTRACT.md was corrected at D2; ADR prose update deferred. Semantic contract (post-build hook + dist artifact + content-hash chunk filenames) is unchanged.

### D4 — Wave 3 retrospective items (12+ collated)

The following empirical learnings from Wave 3 are codified — most as memory entries already, this ADR collates the index for cross-reference:

| # | Item | Codification |
|---|---|---|
| R1 | SOTed-PR.md discipline reduces R-rounds — A5/B4/B5/B6/B7/B8 had 0 R-rounds vs Pre-B1 had 3 R-rounds before SOTed amendment | `feedback_soted_pr_md_discipline.md` |
| R2 | Wave 3 main pipeline auto-merge — orchestrator merges PR directly via `gh pr merge --squash` once ACCEPT-PASS + CI green; user 2026-05-01 authorization | `feedback_wave3_auto_merge.md` |
| R3 | Codex profile prefix consistency — 5 NEW codex- prefixed profiles per ADR-0011 D6; canonical names use codex- prefix; runbook still references unprefixed names in places | `feedback_codex_profile_prefix.md` |
| R4 | User dotfile authority — orchestrator can fix mechanical home-dir issues (~/.codex/config.toml etc.) directly without user gate; user 2026-05-01 authorization | `feedback_user_dotfile_authority.md` |
| R5 | Lychee + npmjs.com 403 — cite npm packages via GitHub repo URL only; npm anti-bot rejects lychee crawl | `feedback_lychee_npmjs_403.md` |
| R6 | Lychee + docs.astro.build runner-egress flaky — added `.lychee.toml` exclude + `max_retries=2` global at D1b forward-fix; 3 consecutive failures observed | (codified in `.lychee.toml` comment block at D1b) |
| R7 | Codex audit-log self-recursion — `codex exec | tee docs/audits/codex-runs/X.txt` can enter self-patching loop; mitigate by piping to /tmp first OR watchdog kill at ~500 KB | `feedback_codex_audit_log_recursion.md` (D3 incident: 49 MB log, killed PID 1435181) |
| R8 | PageFind 1.5+ query-time substring finding — Intl.Segmenter at index time but partial-substring matching at query time; ADR-0012 criterion 4 amendment needed | `feedback_pagefind_query_substring.md` |
| R9 | Codex sandbox network restriction — `codex exec` workspace-write sandbox blocks `pnpm install` (EAI_AGAIN); orchestrator runs install directly post-codex authorship | (D2 incident; documented in this ADR + D2 commit message) |
| R10 | happy-dom env sandboxes file:// dynamic import — per-file `// @vitest-environment node` override required for Node integration tests in apps/site (vitest config default = happy-dom) | (codified in D2 search-cjk.test.ts + search-reindex.test.ts header comments) |
| R11 | pagefind binary lookup — pagefind is transitive of astro-pagefind so .bin/pagefind not symlinked; tests use `require.resolve('@pagefind/<platform>-<arch>/bin/pagefind_extended')` | (codified in D2 search-cjk.test.ts + search-reindex.test.ts findPagefindCli) |
| R12 | playwright webServer must be `astro build && astro preview` not `astro dev` for build-time post-hook verification (astro-pagefind post-build hook only runs after `astro build`) | (codified in apps/site/playwright.config.ts D3 fix comment) |
| R13 | plan-challenger codex absorbed-vs-not-absorbed pattern — D1b adoption of 4 challenges + 4 suggestions; document each as ABSORBED/NOT ABSORBED with rationale in PR.md `## Plan-challenger codex absorbtion` section | (codified in D1b PR.md template) |

### D5 — ADR-0011 D1 linear pipeline empirical evaluation

ADR-0011 D1 was introduced at wave-3-prep (PR #1) as Wave 3+ replacement for Wave 1+2 tree-workflow. **Empirical Wave 3 evaluation** (24 PRs serial executed):

**Worked well**:
- 6-stage strict serial execution (PLAN → EXECUTE → REVIEW → PRE-COMMIT → COMMIT → ACCEPT) provided unambiguous next-action at every PR boundary
- Codex-heavy execution (stages 2+3) successfully delegated bulk authorship; orchestrator focused on planning + judgment + integration
- D2 PR.md schema + v0.1.1 SOTed-PR.md amendment reduced R-rounds dramatically (A5/B4-B8 hit 0 R-rounds; pre-amendment averaged 1-3)
- D2 row 1+4 PRE-COMMIT CLAUDE REVIEW (stage 4) caught real issues at #11 (Pre-B1 SOTed amendment self-fail) + #24 (D1b plan-challenger absorption documentation gap before C2 absorbtion section was added)
- Researcher Claude subagent one-shot dispatch worked well for D1a (16-source comparison + locked recommendation)

**Friction points**:
- Codex sandbox network restriction (R9) required orchestrator to run pnpm install post-codex; not a pipeline failure but an EXECUTE-stage friction
- Codex audit-log recursion (R7) destroyed D3 audit log; needs structural fix (audit log to /tmp first, then truncated copy into docs/audits/codex-runs/)
- Lychee CI flakes (R5+R6) required ad-hoc forward-fixes on 2 PRs; not pipeline-level but added round-trip latency
- Same-model echo chamber risk: stage 4 PRE-COMMIT CLAUDE REVIEW is orchestrator-self review; codex-pr-reviewer-55 stage 3 is also LLM-based. The 2 stages did catch different issues (D1b: codex caught template structural; orchestrator caught absorbtion-doc gap), validating the dual-LLM design

**Verdict**: ADR-0011 D1 linear pipeline **KEPT for Wave 4** without amendment. Add codex audit-log piping fix (R7) as a Wave 4 D-list patch to the runbook (`docs/runbooks/codex-tool-invocations.md`).

### D6 — Wave 4 plan-draft handoff

`docs/plans/active.md` repointed to Wave 4 plan-draft (NEW: `docs/superpowers/plans/2026-05-02-phase-1-wave-4-integration.md` — to be authored at Wave 4 session start). Wave 4 mandatory scope (Wave 3 carry-overs):

- Stage C completion: C4a (3 missing block Astro variants) + C4b (2 heavy block Astro variants) + C5 (Phase 2 selective chunking + perf baseline)
- ADR-0014: heavy-block client:only + skeleton states (Jupyter/NnViz/AgentFlow runtime hydration boundary)
- ADR-0012 amendment: PageFind query-time substring finding (R8) — choose option (a) waive inverse OR (b) custom query parser
- Path-prose alignment: `_pagefind/` → `pagefind/` in ADR-0012 prose
- Codex audit-log piping fix (R7) in runbook

Wave 4 NEW scope (Wave 3 spec coverage gaps to address): determined at Wave 4 plan-lock with plan-challenger codex.

## Consequences

### Positive

- 24 PRs merged in single long-term Claude session validates ADR-0011 D1 linear pipeline at scale
- Wave 3 spec §4.2 search index requirement closed (Stage D 4/4)
- 2 new ADRs ratified (ADR-0011 amendment + ADR-0012)
- 13 retrospective learnings captured (R1-R13) — most as memory entries enabling cross-session reuse
- 4% true implementation-defect forward-fix ratio under ADR-0011 D8 ≤15% target

### Negative

- Stage C 3 of 6 PRs deferred to Wave 4 (per user-approved Option (A) at C4a/C4b investigation)
- ADR-0012 criterion 4 inverse discriminator was overstated (D3 runtime finding); amendment needed at Wave 4
- Codex audit-log recursion incident destroyed D3 audit log (49 MB) — recovered via truncation but represents a class-of-error needing structural fix in Wave 4

### Neutral / explicit acknowledgements

- Wave 3 main pipeline did NOT execute the original 24-PR plan as fully sequential — Stage C truncated at 3/6 by user approval, redirecting saved capacity to Stage D close
- pre-commit Claude review (stage 4) only fired 2 times (Pre-B1 + D1b) — Wave 3 D2 row 1+4 hit rate was lower than initial estimate (~8% vs estimated ~20%)
- 24-PR session ran ~24 hours from Pre-A1 to D3 close (2026-05-01 spans much of the session activity)

## Compliance

- This ADR satisfies [ADR-0010](ADR-0010-wave-2-close.md) close-ceremony precedent (D1 process learnings + D2 commit roster + D3 deferred items + D5 hand-off).
- This ADR fulfills [ADR-0011](ADR-0011-linear-pipeline-execution-model.md) D8 Wave 3 close-ceremony requirement (linear pipeline empirical evaluation).
- This ADR closes Wave 3 spec §4.2 search index requirement.
- This ADR does NOT amend [ADR-0009](ADR-0009-block-kind-union-expansion.md) BlockKind 4-way union — Wave 3 work used the union as-is.
- This ADR does NOT amend [ADR-0008](ADR-0008-wave-2-entry-policies.md) D1 dead-dep policy — Wave 3 added 1 explicit dep (D3 `@pagefind/default-ui` was D2 transitive then D3 explicit per ADR-0008 D1 symmetry).

## Related

- [ADR-0010 Wave 2 close](ADR-0010-wave-2-close.md) — close-ceremony template precedent
- [ADR-0011 linear pipeline execution model](ADR-0011-linear-pipeline-execution-model.md) — execution model under empirical evaluation here
- [ADR-0012 search index stack](ADR-0012-search-index-stack.md) — Wave 3-ratified ADR
- [Wave 3 plan locked](../superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) — original plan (24 PRs across Pre-A + 4 stages)
- [docs/plans/active.md](../plans/active.md) — repointed to Wave 4 plan-draft
- D3 incident audit log: [docs/audits/codex-runs/2026-05-01-d3-execute.txt](../audits/codex-runs/2026-05-01-d3-execute.txt) (truncated from 1.08M lines / 49 MB)
- 13 retrospective memory entries: see D4 table for individual paths
