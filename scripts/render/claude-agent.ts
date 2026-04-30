/**
 * Renders one .claude/agents/<name>.md file from an Agent record.
 *
 * ADR-0007 D5: only Claude teammates produce .claude/agents/<name>.md.
 * Codex tool_patterns are documented in docs/runbooks/codex-tool-invocations.md
 * by render/codex-tool-runbook.ts.
 */
import type { Agent } from './types.ts';
import { tierName } from './types.ts';

/**
 * Quote a YAML scalar with double-quotes, escaping internal `"` and `\`.
 * Newlines should never appear in agent.role; we don't try to handle them.
 * Robust against accidental special chars in the corpus (Chinese plain text).
 */
function escapeYamlString(s: string): string {
  const escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

export function renderClaudeAgent(agent: Agent): string {
  const lines: string[] = [
    '---',
    `name: ${agent.name}`,
    `description: ${escapeYamlString(agent.role)}`,
    `tier: ${agent.tier} (${tierName(agent.tier)})`,
    `llm: ${agent.llm}`,
  ];
  lines.push(`role: ${agent.role}`);
  if (agent.triggers && agent.triggers.length) {
    lines.push('triggers:');
    for (const t of agent.triggers) lines.push(`  - ${t}`);
  }
  lines.push('---', '', `# ${agent.name}`, '');
  lines.push(`**Role**: ${agent.role}`, '');
  lines.push(`**Permissions**: ${agent.permissions.join(', ')}`);
  if (agent.forbidden && agent.forbidden.length) {
    lines.push(`**Forbidden**: ${agent.forbidden.join(', ')}`);
  }
  if (agent.triggers && agent.triggers.length) {
    lines.push(`**Triggers**: ${agent.triggers.join(', ')}`);
  }
  lines.push('', '## Description', '');
  lines.push(agent.description ? agent.description.trimEnd() : '(no description)');
  lines.push('', '## Related');
  lines.push('- [agent-contract.md](../../agent-contract.md) — single source');
  lines.push(
    '- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)',
  );
  lines.push('');
  return lines.join('\n');
}
