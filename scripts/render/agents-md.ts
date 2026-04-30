/**
 * Renders the project-root AGENTS.md (Codex CLI entry point per spec §3.12).
 *
 * ADR-0007 D5: codex agents are tool_patterns (orchestrator-direct Bash) not
 * teammates. AGENTS.md focuses on profile usage + tool_pattern listing; for the
 * full Bash invocation cookbook see docs/runbooks/codex-tool-invocations.md.
 */
import type { AgentContract, ToolPattern } from './types.ts';
import { mdTable } from './md-table.ts';

const HEADER = `# AGENTS.md

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit \`agent-contract.md\` then run \`pnpm generate:configs\`. CI fails if drift detected.

This file is the Codex CLI entry point for **SelfKnowledgeBaseWeb**. For the deeper project
authority (rules, workflow, roster) read [CLAUDE.md](CLAUDE.md). This file focuses on
Codex-specific usage: which profiles to invoke and which tool patterns the orchestrator
calls via direct Bash invocation (ADR-0007 D5).

- Spec: [docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md](docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- Single source: [agent-contract.md](agent-contract.md)
- Codex profile TOML (manual merge): [tmp/codex-profiles.toml](tmp/codex-profiles.toml)
- Tool invocation runbook: [docs/runbooks/codex-tool-invocations.md](docs/runbooks/codex-tool-invocations.md)
`;

const BOUNDARIES = `## Permission boundaries (enforced by orchestrator + all teammates)

These three invariants come from \`agent-contract.md\` and apply to every Codex tool invocation too:

1. **\`git-operator\` is the SOLE agent authorized to run \`git commit / branch / rebase / push\`.**
   Codex tool invocations (scaffolder / review profiles) MUST NOT call git mutating commands.
   Hand the diff back to the orchestrator.
2. **\`researcher\` is the SOLE agent authorized for \`web_search\` / \`web_fetch\`.**
   If a Codex tool needs external info, the orchestrator must dispatch researcher — not curl/wget.
3. **\`refactorer\` is the SOLE agent authorized for cross-package moves / renames.**
   Codex tools MUST NOT move files across \`packages/*\` or \`apps/*\` boundaries. Mechanical
   refactors go through \`scripts/refactor-move.ts\` under refactorer dispatch.

Spec: §3.1 (agent roster) + §3.2 (review workflow boundaries). ADR-0007 D5 (tool patterns).
`;

const PROFILE_TABLE = mdTable(
  ['Profile', 'Model', 'Sandbox', 'Use case'],
  [
    ['`scaffolder`', 'gpt-5.3-codex-spark', 'workspace-write', 'Cheap, fast scaffolding'],
    ['`code-reviewer`', 'gpt-5.3-codex-spark', 'read-only', 'Line-level review (default)'],
    ['`pr-gate`', 'gpt-5.5', 'read-only', 'Deep review for high-risk PRs'],
    ['`plan-challenger`', 'gpt-5.3-codex-spark', 'read-only', 'Challenge plans before lock'],
  ],
);

const PROFILE_USAGE = `## Codex profile usage

After running \`pnpm generate:configs\`, manually merge \`tmp/codex-profiles.toml\` into
\`~/.codex/config.toml\`. Then invoke a profile via:

\`\`\`bash
codex exec --profile scaffolder       "scaffold packages/block-code from block-callout template" < /dev/null
codex exec --profile code-reviewer    "review the staged diff" < /dev/null
codex exec --profile pr-gate          "deep review the staged diff (high-risk PR)" < /dev/null
codex exec --profile plan-challenger  "challenge docs/plans/active.md before lock" < /dev/null
\`\`\`

\`< /dev/null\` is mandatory in non-interactive contexts (Phase 0 stdin-hang regression);
see \`feedback_codex_stdin\` memory.

${PROFILE_TABLE}
`;

function toolPatternsTable(contract: AgentContract): string {
  if (contract.tool_patterns.length === 0) return '_(no tool patterns)_';
  const rows = contract.tool_patterns
    .slice()
    .sort((a, b) => a.profile.localeCompare(b.profile) || a.name.localeCompare(b.name))
    .map((tp: ToolPattern) => {
      const summary = (tp.description ?? '').split('\n')[0]?.trim().replace(/\|/g, '\\|') ?? '';
      const triggers = tp.triggered_by.slice(0, 2).join(', ');
      return [`\`${tp.name}\``, `\`${tp.profile}\``, triggers, summary];
    });
  return [
    `## Tool patterns (${contract.tool_patterns.length})`,
    '',
    mdTable(['Name', 'Profile', 'Top triggers', 'Summary'], rows),
  ].join('\n');
}

const FOOTER = `## Footer

This file is GENERATED FROM \`agent-contract.md\`. Edits to this file will be overwritten
on the next \`pnpm generate:configs\` run.
`;

export function renderAgentsMd(contract: AgentContract): string {
  return [HEADER, BOUNDARIES, PROFILE_USAGE, toolPatternsTable(contract), '', FOOTER].join('\n');
}
