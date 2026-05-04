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

const BOUNDARIES = `## Permission boundaries (ADR-0011 D1+D4+D7; enforced by orchestrator + every codex profile)

These three invariants come from \`agent-contract.md\` and apply to every Codex tool invocation too:

1. **Git mutation discipline (ADR-0011 D1+D4)**: \`git commit / branch / rebase / push\`
   only at D1 stage 5 (reviewer codex commit phase) or by orchestrator self for bootstrap
   scope. Codex tool invocations (scaffolder / codex-generic-executor / codex-structure-auditor /
   codex-perf-auditor / codex-mdx-doctor / plan-challenger) MUST NOT call git mutating commands at
   any other point. Hand the diff back to the orchestrator.
2. **Web access discipline (ADR-0011 D7)**: only the \`researcher\` Claude subagent
   (one-shot per dispatch) may run \`web_search\` / \`web_fetch\`. If a Codex tool needs
   external info, the orchestrator must dispatch researcher — not curl/wget.
3. **Cross-package move discipline (ADR-0011 D7)**: only the \`refactorer\` Claude
   subagent may move/rename files across \`packages/*\` or \`apps/*\` boundaries. Codex
   tools MUST NOT cross package boundaries. Mechanical refactors run through
   \`scripts/refactor-move.ts\` under refactorer dispatch + ADR.

Spec: §3.1 (agent roster) + §3.2 (review workflow boundaries). ADR-0007 D5 (tool
patterns) + ADR-0011 D1/D4/D7 (linear pipeline + boundary refresh).
`;

const PROFILE_TABLE = mdTable(
  ['Profile', 'Model', 'Sandbox', 'Use case'],
  [
    ['`scaffolder`', 'gpt-5.3-codex-spark', 'workspace-write', 'Cheap, fast scaffolding (5 patterns)'],
    ['`plan-challenger`', 'gpt-5.3-codex-spark', 'read-only', 'Challenge plans before lock'],
    ['`codex-pr-reviewer-55`', 'gpt-5.5', 'read-only', 'D1 stage 3 default reviewer (replaces pr-gate; ADR-0011 D6)'],
    ['`codex-generic-executor`', 'gpt-5.5', 'workspace-write', 'D1 stage 2 default executor (NEW Wave 3)'],
    ['`codex-structure-auditor`', 'gpt-5.3-codex-spark', 'read-only', 'Per-PR + Wave-close audit (NEW Wave 3)'],
    ['`codex-perf-auditor`', 'gpt-5.3-codex-spark', 'read-only', 'Bundle-affecting PR + Wave-close (NEW Wave 3)'],
    ['`codex-mdx-doctor`', 'gpt-5.3-codex-spark', 'read-only', 'mdx-bridge fixture change PR (NEW Wave 3)'],
  ],
);

const PROFILE_USAGE = `## Codex profile usage

After running \`pnpm generate:configs\`, manually merge \`tmp/codex-profiles.toml\` into
\`~/.codex/config.toml\`. Then invoke a profile via:

\`\`\`bash
codex exec --yolo --profile scaffolder            "scaffold packages/block-code from block-callout template" < /dev/null
codex exec --yolo --profile plan-challenger       "challenge docs/plans/wave-3-…/plan.md before lock" < /dev/null
codex exec --yolo --profile codex-pr-reviewer-55  "review the staged diff (D1 stage 3 default)" < /dev/null
codex exec --yolo --profile codex-generic-executor      "implement PR.md test_cases first then impl" < /dev/null
codex exec --yolo --profile codex-structure-auditor     "scan workspace topology + ADR-0008 D1 dead-dep + drift" < /dev/null
codex exec --yolo --profile codex-perf-auditor          "Lighthouse / size-limit / chunk-size baseline" < /dev/null
codex exec --yolo --profile codex-mdx-doctor            "run all RTT fixtures + parse-equiv invariants" < /dev/null
\`\`\`

\`< /dev/null\` is mandatory in non-interactive contexts (Phase 0 stdin-hang regression);
see \`feedback_codex_stdin\` memory. \`--yolo\` is mandatory Wave 4+ (gatekeeper
2026-05-02 directive); resolves R9 sandbox EAI_AGAIN + R4 user-dotfile mechanical-fix
friction at flag level. Pipe stdout to \`/tmp/codex-runs/\` first then \`head -2000\`
truncate into \`docs/audits/codex-runs/\` (R7 self-recursion mitigation; see
\`feedback_codex_audit_log_recursion\` memory + \`docs/runbooks/codex-tool-invocations.md\`
"Universal Bash invariants").

The legacy \`code-reviewer\` (5.3-spark) and \`pr-gate\` profiles are deprecated post
ADR-0011 D6 — \`codex-pr-reviewer-55\` is the unified Wave 3+ default reviewer.

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
