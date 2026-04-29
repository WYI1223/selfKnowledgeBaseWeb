/**
 * Renders one .claude/agents/<name>.md file from an Agent record.
 */
import type { Agent } from './types.ts';
import { tierName } from './types.ts';

export function renderClaudeAgent(agent: Agent): string {
  const lines: string[] = [
    '---',
    `name: ${agent.name}`,
    `tier: ${agent.tier} (${tierName(agent.tier)})`,
    `llm: ${agent.llm}`,
  ];
  if (agent.profile) lines.push(`profile: ${agent.profile}`);
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
