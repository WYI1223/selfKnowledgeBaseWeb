/**
 * Renders docs/runbooks/codex-tool-invocations.md — canonical Bash invocation
 * runbook for the 8 codex tool_patterns (ADR-0007 D5).
 *
 * Each pattern gets a section with: profile, canonical bash, triggered_by,
 * output_handling (incl. audit-log path per ADR-0007 §208), description.
 */
import type { AgentContract, ToolPattern } from './types.ts';

const HEADER = `# Codex tool invocations runbook

> **GENERATED FROM agent-contract.md — DO NOT EDIT BY HAND.**
>
> Edit \`agent-contract.md\` then run \`pnpm generate:configs\`.

ADR-0007 D5 demoted 8 codex agents from team-membered teammates (persistent
context) to **stateless Bash invocation patterns** triggered by the orchestrator.
This runbook is the canonical reference for how the orchestrator invokes each
pattern: the bash command, when to trigger it, and how the orchestrator should
handle stdout (parse + audit-log).

## Single-source-of-truth lineage

- Pattern definitions: [\`agent-contract.md\`](../../agent-contract.md) → \`tool_patterns:\` block
- Codex profile config: [\`tmp/codex-profiles.toml\`](../../tmp/codex-profiles.toml) (manual merge into \`~/.codex/config.toml\`)
- Architecture decision: [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) §D5
- Audit logs: \`docs/audits/codex-runs/<date>-<task>-<pattern>.txt\` (orchestrator must save every invocation's stdout)

## Universal Bash invariants

\`\`\`bash
codex exec --profile <PROFILE> "<PROMPT>" < /dev/null > <AUDIT_LOG_PATH> 2>&1
\`\`\`

- **\`< /dev/null\` is mandatory** in non-interactive contexts. Codex CLI under Claude Code Bash blocks reading a never-closed Unix socket on fd 0 if stdin is left open. (Phase 0 regression; see memory \`feedback_codex_stdin\`.)
- **\`approval_policy = "never"\`** is set per profile in TOML; do not pass interactive approval flags.
- **stderr captures progress**, **stdout captures the final structured verdict**. Orchestrator parses stdout only.
- **\`timeout\`-wrap long runs** (e.g. \`timeout 600 codex exec --profile pr-gate ...\`) to prevent hung invocations.
- **3-strike fallback**: if a pattern's invocation fails 3× consecutively, orchestrator MUST escalate (degrade to Claude per ADR-0001 fallback or surface to user).

## ADR-0006 D8 reminder

When invocation outputs become inputs to a commit (e.g. scaffolder writes new files), the
orchestrator MUST stage \`pnpm-lock.yaml\` along with package.json edits in the same bundle
(commit \`e15ec36\` extension to D8: lockfile is generated-from-authority artifact).
`;

function patternSection(tp: ToolPattern): string {
  const lines: string[] = [];
  lines.push(`## \`${tp.name}\``);
  lines.push('');
  lines.push(`**Profile**: \`${tp.profile}\``);
  lines.push('');
  lines.push('**Canonical bash**:');
  lines.push('');
  lines.push('```bash');
  lines.push(tp.invocation);
  lines.push('```');
  lines.push('');
  lines.push('**Triggered by**:');
  lines.push('');
  for (const trigger of tp.triggered_by) {
    lines.push(`- \`${trigger}\``);
  }
  lines.push('');
  if (tp.output_handling) {
    lines.push('**Output handling**:');
    lines.push('');
    lines.push(tp.output_handling.trimEnd());
    lines.push('');
  }
  if (tp.description) {
    lines.push('**Description**:');
    lines.push('');
    lines.push(tp.description.trimEnd());
    lines.push('');
  }
  return lines.join('\n');
}

const FOOTER = `## Related

- [\`agent-contract.md\`](../../agent-contract.md) — \`tool_patterns:\` source of truth
- [ADR-0007](../decisions/ADR-0007-job-function-codex-heavy-execution.md) — D5 demotion rationale
- [ADR-0006](../decisions/ADR-0006-asymmetry-audit-checklist.md) — 8-point asymmetry audit (mandatory for code-reviewer + pr-gate profiles)
- [ADR-0001](../decisions/ADR-0001-stack-selection.md) §3.1 / §3.2 — review chain baseline
- [\`docs/runbooks/team-operations.md\`](team-operations.md) — broader team protocol context

## Footer

This file is GENERATED FROM \`agent-contract.md\`. Edits will be overwritten on the next
\`pnpm generate:configs\` run.
`;

export function renderCodexToolRunbook(contract: AgentContract): string {
  const sorted = contract.tool_patterns
    .slice()
    .sort((a, b) => a.profile.localeCompare(b.profile) || a.name.localeCompare(b.name));
  const sections = sorted.map(patternSection);
  return [HEADER, '', ...sections, FOOTER].join('\n');
}
