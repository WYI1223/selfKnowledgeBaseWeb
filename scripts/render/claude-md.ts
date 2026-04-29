/**
 * Renders the project-root CLAUDE.md (Claude Code entry point).
 *
 * Spec §3.1 + §3.2 (workflow) + §3.6 (file size limits) + §3.13 (single source).
 */
import type { Agent, AgentContract } from './types.ts';
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
`;

const HARD_RULES = `## Hard rules

1. **File size**: 200 lines (target) / 300 lines (ESLint \`max-lines\` warn) / 500 lines
   (\`pnpm size-check\` hard fail). Spec §3.6.
2. **Cross-file references**: every doc/code change must keep doc cross-references and
   contract files in sync (\`packages/*/CONTRACT.md\`, \`agent-contract.md\`).
3. **Lychee link-check**: broken markdown links block merge. Run \`pnpm link-check\` locally.
4. **\`pnpm check\` is mandatory before requesting review** (lint + typecheck + test + build + size).
5. **No direct git from workers**: only \`git-operator\` may commit / branch / rebase / push.
6. **No web access from workers**: only \`researcher\` may \`web_search\` / \`web_fetch\`.
7. **No cross-package moves from workers**: only \`refactorer\` may reorganize packages,
   and every reorganization requires an ADR under \`docs/decisions/\`.
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

const WORKFLOW = `## Review workflow (spec §3.2)

\`\`\`
worker (writes code)
   │
   ▼
code-reviewer  (Codex 5.3-spark, line-level rigor, cheap default)
   │
   ├── if high-risk → pr-gate (Codex 5.5, deep scan)
   │
   ▼
pr-reviewer    (Claude, spec match + regression + arch consistency)
   │
   ▼
git-operator   (Claude, only authorized git surface, runs \`pnpm check\` once more)
\`\`\`

High-risk triggers (force \`pr-gate\`): contract change, package add/remove, core arch
touch, ADR-required PR, CI/deploy/auth/security touch.
`;

function tierBadge(tier: Agent['tier']): string {
  return `T${tier} ${tierName(tier)}`;
}

function rosterTable(contract: AgentContract): string {
  const rows = contract.agents
    .slice()
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
    .map((a) => {
      const llm = a.llm === 'codex' && a.profile ? `codex (${a.profile})` : a.llm;
      const role = a.role.replace(/\|/g, '\\|');
      return [tierBadge(a.tier), `\`${a.name}\``, llm, role];
    });
  return [
    `## Agent roster (${contract.agents.length} agents)`,
    '',
    mdTable(['Tier', 'Name', 'LLM', 'Role'], rows),
  ].join('\n');
}

const FOOTER = `## Footer

This file is GENERATED FROM \`agent-contract.md\`. Edits to this file will be overwritten
on the next \`pnpm generate:configs\` run.
`;

export function renderClaudeMd(contract: AgentContract): string {
  return [HEADER, HARD_RULES, COMMANDS, WORKFLOW, rosterTable(contract), '', FOOTER].join('\n');
}
