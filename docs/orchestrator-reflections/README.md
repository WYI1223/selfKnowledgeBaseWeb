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
