#!/usr/bin/env tsx
/**
 * Derives from agent-contract.md:
 *   - CLAUDE.md / AGENTS.md (root)
 *   - .claude/agents/<name>.md × N (Claude teammates only post ADR-0007 D5)
 *   - .claude/settings.json
 *   - tmp/codex-profiles.toml (manual merge into ~/.codex/config.toml)
 *   - docs/review-checklist.md
 *   - docs/runbooks/codex-tool-invocations.md (ADR-0007 D5 — codex tool patterns)
 *
 * Spec: docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md §3.13
 *
 * Idempotent: running twice produces no diff. CI in
 * .github/workflows/agent-contract-check.yml fails on drift.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ContractSchema, type AgentContract } from './render/types.ts';
import { renderClaudeAgent } from './render/claude-agent.ts';
import { renderClaudeMd } from './render/claude-md.ts';
import { renderAgentsMd } from './render/agents-md.ts';
import { renderSettingsJson } from './render/settings-json.ts';
import { renderCodexProfilesToml } from './render/codex-profiles-toml.ts';
import { renderReviewChecklist } from './render/review-checklist.ts';
import { renderCodexToolRunbook } from './render/codex-tool-runbook.ts';

export type { Agent, ToolPattern, AgentContract } from './render/types.ts';
export { renderClaudeAgent } from './render/claude-agent.ts';
export { renderClaudeMd } from './render/claude-md.ts';
export { renderAgentsMd } from './render/agents-md.ts';
export { renderSettingsJson } from './render/settings-json.ts';
export { renderCodexProfilesToml } from './render/codex-profiles-toml.ts';
export { renderReviewChecklist } from './render/review-checklist.ts';
export { renderCodexToolRunbook } from './render/codex-tool-runbook.ts';

const PLACEHOLDER_PATTERN = /<[^>]+>/;

export function parseAgentContract(markdown: string): AgentContract {
  const matches = [...markdown.matchAll(/```yaml\n([\s\S]*?)\n```/g)];
  if (matches.length === 0) {
    throw new Error('No YAML fenced block in agent-contract.md');
  }

  for (const m of matches) {
    const raw = m[1];
    if (!raw) continue;
    let candidate: unknown;
    try {
      candidate = parseYaml(raw);
    } catch {
      // Pseudo-YAML schema-example blocks may not parse; skip them.
      continue;
    }
    if (
      candidate &&
      typeof candidate === 'object' &&
      'agents' in candidate &&
      Array.isArray(candidate.agents)
    ) {
      const agents = candidate.agents as Array<{ name?: unknown }>;
      const tps =
        'tool_patterns' in candidate && Array.isArray(candidate.tool_patterns)
          ? (candidate.tool_patterns as Array<{ name?: unknown }>)
          : [];
      const namesWithPlaceholder = [...agents, ...tps].some(
        (a) => typeof a?.name === 'string' && PLACEHOLDER_PATTERN.test(a.name),
      );
      if (!namesWithPlaceholder) {
        return ContractSchema.parse(candidate);
      }
    }
  }
  throw new Error('No authoritative YAML block with agents found (placeholder block was skipped)');
}

export function generateClaudeAgents(contract: AgentContract): void {
  const dir = '.claude/agents';
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const sorted = [...contract.agents].sort((a, b) => a.name.localeCompare(b.name));
  for (const agent of sorted) {
    writeFileSync(join(dir, `${agent.name}.md`), renderClaudeAgent(agent));
  }
}

function main(): void {
  const contract = parseAgentContract(readFileSync('agent-contract.md', 'utf8'));

  generateClaudeAgents(contract);

  writeFileSync('CLAUDE.md', renderClaudeMd(contract));
  writeFileSync('AGENTS.md', renderAgentsMd(contract));

  mkdirSync('.claude', { recursive: true });
  writeFileSync('.claude/settings.json', renderSettingsJson());

  mkdirSync('tmp', { recursive: true });
  writeFileSync('tmp/codex-profiles.toml', renderCodexProfilesToml());

  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/review-checklist.md', renderReviewChecklist());

  mkdirSync('docs/runbooks', { recursive: true });
  writeFileSync('docs/runbooks/codex-tool-invocations.md', renderCodexToolRunbook(contract));

  console.log(
    `Generated configs from agent-contract.md (${contract.agents.length} teammates + ${contract.tool_patterns.length} tool_patterns).`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
