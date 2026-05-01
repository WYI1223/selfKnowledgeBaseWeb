/**
 * Renders the project-root CLAUDE.md (Claude Code entry point).
 *
 * Spec §3.1 + §3.2 (workflow) + §3.6 (file size limits) + §3.13 (single source).
 * ADR-0007 D5: roster splits into Claude teammates (agents:) +
 * codex tool_patterns (linked to docs/runbooks/codex-tool-invocations.md).
 */
import type { Agent, AgentContract, ToolPattern } from './types.ts';
import { tierName } from './types.ts';
import { mdTable } from './md-table.ts';

const HEADER = `# CLAUDE.md

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit \`agent-contract.md\` then run \`pnpm generate:configs\`. CI fails if drift detected.

This file is the Claude Code entry point for the **SelfKnowledgeBaseWeb** monorepo. It tells
every Claude session what the project is, the hard rules, the agent roster, and the workflow.

- Spec: [docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md](docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- Active plan: [docs/plans/active.md](docs/plans/active.md)
- Single source for agents: [agent-contract.md](agent-contract.md)
- Codex tool invocations: [docs/runbooks/codex-tool-invocations.md](docs/runbooks/codex-tool-invocations.md)
`;

const HARD_RULES = `## Hard rules

1. **File size**: 200 lines (target) / 300 lines (ESLint \`max-lines\` warn) / 500 lines
   (\`pnpm size-check\` hard fail). Spec §3.6.
2. **Cross-file references**: every doc/code change must keep doc cross-references and
   contract files in sync (\`packages/*/CONTRACT.md\`, \`agent-contract.md\`).
3. **Lychee link-check**: broken markdown links block merge. Run \`pnpm link-check\` locally.
4. **\`pnpm check\` is mandatory before review** (lint + typecheck + test + build + size).
5. **Git mutation discipline (ADR-0011 D1+D4)**: \`git commit / branch / rebase / push\`
   only at D1 stage 5 (reviewer codex commit phase) or by orchestrator self for bootstrap
   scope. Subagents (pr-writer / ux-ui-lead / refactorer / researcher) never run mutating
   git commands.
6. **Web access discipline (ADR-0011 D7)**: only the \`researcher\` Claude subagent (one-shot
   per dispatch) may run \`web_search\` / \`web_fetch\`.
7. **Cross-package moves (ADR-0011 D7)**: only the \`refactorer\` Claude subagent may
   reorganize packages, and every reorganization requires an ADR under \`docs/decisions/\`.
`;

const COMMANDS_TABLE = mdTable(
  ['Command', 'Purpose'],
  [
    ['`pnpm install`', 'Install workspace dependencies'],
    ['`pnpm dev`', 'Run all `dev` scripts (parallel)'],
    ['`pnpm check`', 'Lint + typecheck + test + build + size-check'],
    ['`pnpm check:affected`', 'Same, scoped to packages affected since `origin/main`'],
    ['`pnpm size-check`', 'Hard 500-line limit on every source file'],
    ['`pnpm link-check`', 'Lychee scan over `./**/*.md`'],
    ['`pnpm generate:configs`', 'Re-derive everything from `agent-contract.md`'],
    ['`pnpm format`', 'Prettier write across the repo'],
  ],
);

const COMMANDS = `## Commands cheat-sheet\n\n${COMMANDS_TABLE}\n`;

const WORKFLOW = `## Review workflow (ADR-0011 D1 linear pipeline; supersedes Wave 1+2 tree workflow)

Per PR (PRs run strictly serial; the next PR's PLAN waits for the previous PR's ACCEPT):

\`\`\`
1. PLAN              pr-writer Claude subagent ↔ orchestrator → lock PR.md (D2 schema)
       │
       ▼
2. EXECUTE           codex \`generic-executor\` (or specialized scaffolder; or
                     \`ux-ui-lead\` Claude subagent for UI/UX). TDD-front:
                     write tests → write impl → vitest all PASS.
       │
       ▼
3. REVIEW            codex \`codex-pr-reviewer-55\` (5.5) — line-level + spec-match.
                     ADR-0006 8-point checklist mandatory. PASS → next stage.
       │
       ├── (D2 row 1+4 hit) → 4. PRE-COMMIT CLAUDE REVIEW   orchestrator self.
       │                          Mitigates same-model echo chamber.
       │
       ▼
5. COMMIT (+ push)   reviewer codex commits. Per ADR-0006 D8 explicit-file-list
                     staging (\`git reset HEAD\` → \`git add <list>\` →
                     \`git diff --cached --stat\` verify → \`git commit\`).
       │
       ▼
6. ACCEPT            pr-writer Claude subagent (second invocation): verify the
                     PR's diff actually meets PR.md's \`acceptance:\` block.
\`\`\`

D2 trigger judgment (ADR-0007 D2 rows; locked by orchestrator at PLAN):
- **D1 stage 4 PRE-COMMIT CLAUDE REVIEW fires** on D2 rows 1+4 (contract change OR new
  ADR required). Other rows skip this stage but still go through codex review.
- **High-risk classes** (rows 2 package add/remove, row 8 CI/deploy/auth/security) also
  receive heightened reviewer scrutiny within stage 3 — ADR-0006 D8 staging discipline +
  ADR-0006 8-point checklist 8th-class hunt.

See [ADR-0011](docs/decisions/ADR-0011-linear-pipeline-execution-model.md) D1-D8 +
[ADR-0007 D2](docs/decisions/ADR-0007-job-function-codex-heavy-execution.md).

Codex tools (11 patterns: 5 scaffolders + plan-challenger + codex-pr-reviewer-55 +
4 audit/exec profiles) are
[orchestrator-direct Bash invocations](docs/runbooks/codex-tool-invocations.md) post
ADR-0007 D5 + ADR-0011 D6.
`;

function tierBadge(tier: Agent['tier']): string {
  return `T${tier} ${tierName(tier)}`;
}

function teammateRosterTable(contract: AgentContract): string {
  const rows = contract.agents
    .slice()
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
    .map((a) => {
      const role = a.role.replace(/\|/g, '\\|');
      return [tierBadge(a.tier), `\`${a.name}\``, role];
    });
  return [
    `## Claude teammates (${contract.agents.length})`,
    '',
    mdTable(['Tier', 'Name', 'Role'], rows),
  ].join('\n');
}

function toolPatternTable(contract: AgentContract): string {
  const rows = contract.tool_patterns
    .slice()
    .sort((a, b) => a.profile.localeCompare(b.profile) || a.name.localeCompare(b.name))
    .map((tp: ToolPattern) => {
      const role = (tp.description ?? '').split('\n')[0]?.trim().replace(/\|/g, '\\|') ?? '';
      return [`\`${tp.name}\``, `\`${tp.profile}\``, role];
    });
  return [
    `## Codex tool patterns (${contract.tool_patterns.length})`,
    '',
    'orchestrator-direct Bash invocations (ADR-0007 D5). Full canonical bash + triggers + audit-log paths in [docs/runbooks/codex-tool-invocations.md](docs/runbooks/codex-tool-invocations.md).',
    '',
    mdTable(['Pattern', 'Profile', 'Summary'], rows),
  ].join('\n');
}

const FOOTER = `## Footer

This file is GENERATED FROM \`agent-contract.md\`. Edits to this file will be overwritten
on the next \`pnpm generate:configs\` run.
`;

export function renderClaudeMd(contract: AgentContract): string {
  return [
    HEADER,
    HARD_RULES,
    COMMANDS,
    WORKFLOW,
    teammateRosterTable(contract),
    '',
    toolPatternTable(contract),
    '',
    FOOTER,
  ].join('\n');
}
