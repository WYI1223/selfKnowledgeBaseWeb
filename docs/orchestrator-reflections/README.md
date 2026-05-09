# Orchestrator reflection log

> Self-audit by the Claude orchestrator. User reviews periodically.
> One entry per significant orchestration decision / failure / learning.
> Append-only. Never edit past entries; follow up with a new entry instead.

## Cadence

- **Per PR**: append a 1-paragraph "what surprised me" + "what I'd do differently" at the end of each PR cycle (right after merge, before moving to the next PR).
- **Per gate failure**: when a codex R-round returns FAIL, append the diagnosis (was the cause: doc drift / scope mis-judgment / missed dependency / TDD gap / supervision gap?) so patterns become visible.
- **Per user pushback**: when user explicitly corrects orchestration (not code), top-of-file note + a permanent entry.

## Format

```markdown
## YYYY-MM-DD — <PR id or topic> — <one-line headline>

**What I did**: <1-2 sentences>
**What surprised me / what I missed**: <root cause, not symptom>
**What I'd do differently**: <concrete change to my orchestration rules>
**Operational rule landed**: <if any new rule for future PRs, state it crisply>
```

## Index

- [2026-05-09 — cf-15a~cf-19 retrospective + cf-20 reset](2026-05-09-cf-15a-19-retrospective.md) — user-triggered honest audit; 4 systemic gaps identified
  - **ux-ui-lead reflection cf-20a (2026-05-09)** — chrome single-source migration; theme-tokens invariant caught drift; c3-2 spec updated to track new authority instead of degrading
  - **ux-ui-lead reflection cf-20b (2026-05-09)** — grid-layout substrate; `display: contents` selector-vs-layout-tree bug + recovery; deep-subpath import rule for Astro SSR; grid-style single-source helper across 3 consumers
  - **ux-ui-lead reflection cf-20b R1 hotfix (2026-05-09)** — mobile inline-style override; codex caught 12× horizontal overflow regression; 4-layer CSS fix (selector depth + min-width auto + heavy-skeleton inline width + overflow defense-in-depth); landed CSS-specificity layered-cause checklist + mandatory mobile-viewport regression test rule for any inline-grid-style PR
  - **ux-ui-lead reflection cf-20b R2 hotfix (2026-05-09)** — read-route structural grid-item fix; codex caught "computed style ≠ actual layout" false-positive; combined `.skb-grid` + `.skb-prose` onto single wrapper; landed mandatory dual-assertion rule (parent `display: grid` + bounding-rect width vs colSpan claim) for all CSS Grid placement Playwright specs; landed reflection-log-pre-read rule before authoring any PR.md (template-drift checklist accumulation)
  - **ux-ui-lead reflection cf-20c-2 (2026-05-09)** — drag-handle UI + DnD wire; Q7 spike confirmed HTML5 native DnD works inside ProseMirror NodeView contenteditable=false (saved ~150 LOC of pointer-events fallback); React context bridge pattern for "presentational child → distant lifecycle owner"; landed "snapshot at start, mutate at drop, NEVER mid-drag" pattern + happy-dom DnD synthetic event property-presence rule + spike-before-implement rule for any open-question PR
  - **ux-ui-lead reflection cf-20c-2 R1 hotfix (2026-05-09)** — 4-finding fix (source-lift + DropPulse mount + velocity unit + terminal-drop spec); landed ADR-derived-feature artifact-checklist rule (list ALL D-decision required artifacts before coding) + CONTRACT.md/JSDoc honesty rule (write doc claims AFTER wire verified) + Playwright React-state-driven event-chain rAF timing rule for any chained-event integration test
  - **ux-ui-lead reflection cf-20c-2 R2 hotfix (2026-05-09)** — 4-finding fix (source-lift visibility-vs-opacity + DropPulse landed-rect + strict assertion + doc drift); landed "ADR > dispatch brief > intuition" rule (when implementing a D-decision, read the ADR text verbatim; the dispatch brief is shorthand) + "never ship code that contradicts PR.md text" rule + cross-spec test fixture isolation rule (any test that writes to fs MUST register afterAll restoration) + proactive 480-LOC sibling extraction rule
  - **ux-ui-lead reflection cf-20c-2 R3 hotfix (2026-05-09)** — 3-finding fix (destructive `git checkout` safety bug in test code + race condition on rapid drops + incomplete R2 doc-drift sweep); landed "tests that touch repository files MUST snapshot bytes, NEVER use git operations" rule (snapshotBytes is bulletproof; git operations destroy uncommitted user work) + "doc-drift sweeps require mechanical grep verification" rule (R2 violated this same rule R3 catches) + dropEpoch React-key pattern for rapid-action animation isolation (cf-20d resize will reuse) + cumulative-R-round-count signal (cf-20c-2 R0+R1+R2+R3=4 R-rounds suggests R0 plan didn't enumerate enough integration constraints; complexity → R-round count correlation)
