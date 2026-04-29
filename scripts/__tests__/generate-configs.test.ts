import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  parseAgentContract,
  renderClaudeAgent,
  renderClaudeMd,
  renderAgentsMd,
  renderSettingsJson,
  renderCodexProfilesToml,
  renderReviewChecklist,
  type Agent,
  type AgentContract,
} from '../generate-configs.ts';

describe('parseAgentContract', () => {
  it('extracts agents from YAML fenced block (skips Schema example placeholder)', () => {
    const md = `# Test\n\n## Schema\n\n\`\`\`yaml\nagents:\n  - name: <kebab-case>\n    tier: 0\n    llm: claude\n    role: example\n    permissions: []\n\`\`\`\n\n## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_agents: 1\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: test\n    permissions: []\n\`\`\`\n`;
    const result = parseAgentContract(md);
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]?.name).toBe('foo');
  });

  it('parses the real agent-contract.md (27 agents)', () => {
    const real = readFileSync('agent-contract.md', 'utf8');
    const result = parseAgentContract(real);
    expect(result.agents).toHaveLength(27);
    expect(result.agents.find((a) => a.name === 'orchestrator')?.tier).toBe(0);
    expect(result.agents.find((a) => a.name === 'pr-gate')?.profile).toBe('pr-gate');
    expect(result.agents.find((a) => a.name === 'researcher')?.permissions).toContain('web_search');
    expect(result.agents.find((a) => a.name === 'git-operator')?.permissions).toContain(
      'git_commit',
    );
  });

  it('rejects YAML blocks where any agent name uses placeholder syntax <...>', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_agents: 1\nagents:\n  - name: <kebab-case>\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(/no.*authoritative.*yaml.*block/i);
  });

  it('rejects contract where metadata.total_agents disagrees with agents.length', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_agents: 99\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(/total_agents.*equal.*agents\.length/);
  });

  it('rejects contract with duplicate agent names', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_agents: 2\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\n  - name: foo\n    tier: 1\n    llm: claude\n    role: y\n    permissions: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(/duplicate agent name: foo/);
  });
});

const sampleAgent: Agent = {
  name: 'sample-agent',
  tier: 1,
  llm: 'claude',
  role: 'example role',
  permissions: ['read_repo', 'write_tests'],
  forbidden: ['edit_code'],
  description: 'Sample description.\nSecond line.',
};

const realContract = (): AgentContract =>
  parseAgentContract(readFileSync('agent-contract.md', 'utf8'));

describe('renderClaudeAgent', () => {
  it('renders frontmatter + permissions + Related links', () => {
    const out = renderClaudeAgent(sampleAgent);
    expect(out).toContain('---');
    expect(out).toContain('name: sample-agent');
    expect(out).toContain('tier: 1 (Worker)');
    expect(out).toContain('llm: claude');
    expect(out).toContain('**Role**: example role');
    expect(out).toContain('**Permissions**: read_repo, write_tests');
    expect(out).toContain('**Forbidden**: edit_code');
    expect(out).toContain('agent-contract.md');
    expect(out).toContain('Spec §3.1');
  });

  it('includes profile field for codex agents', () => {
    const codex: Agent = {
      name: 'codex-x',
      tier: 1,
      llm: 'codex',
      profile: 'scaffolder',
      role: 'r',
      permissions: ['read_repo'],
    };
    const out = renderClaudeAgent(codex);
    expect(out).toContain('profile: scaffolder');
  });
});

describe('renderClaudeMd', () => {
  it('contains generation banner, count, and all 27 agent names', () => {
    const contract = realContract();
    const out = renderClaudeMd(contract);
    expect(out).toContain('GENERATED FROM agent-contract.md');
    expect(out).toContain('27 agents');
    for (const agent of contract.agents) {
      expect(out).toContain(agent.name);
    }
  });
});

describe('renderAgentsMd', () => {
  it('contains codex profile examples and all codex agent names', () => {
    const contract = realContract();
    const out = renderAgentsMd(contract);
    expect(out).toContain('GENERATED FROM agent-contract.md');
    expect(out).toContain('codex exec --profile');
    const codexAgents = contract.agents.filter((a) => a.llm === 'codex');
    for (const agent of codexAgents) {
      expect(out).toContain(agent.name);
    }
  });
});

describe('renderSettingsJson', () => {
  it('produces valid JSON with PostToolUse + SessionStart hooks', () => {
    const out = renderSettingsJson();
    const parsed = JSON.parse(out) as {
      hooks: {
        PostToolUse: Array<{ matcher: string; command: string }>;
        SessionStart: Array<{ command: string }>;
      };
    };
    expect(parsed.hooks.PostToolUse[0]?.matcher).toBe('Edit|Write');
    expect(parsed.hooks.SessionStart[0]?.command).toContain('active.md');
  });

  it('SessionStart command tolerates missing docs/plans/active.md (existence guard)', () => {
    const out = renderSettingsJson();
    const parsed = JSON.parse(out) as {
      hooks: { SessionStart: Array<{ command: string }> };
    };
    const cmd = parsed.hooks.SessionStart[0]?.command ?? '';
    expect(cmd).toContain('[ -f docs/plans/active.md ]');
    // Semicolon ensures tsc -b --dry runs unconditionally even if active.md absent.
    expect(cmd).toMatch(/;\s*pnpm tsc -b --dry/);
  });
});

describe('renderCodexProfilesToml', () => {
  it('contains all 4 profile sections', () => {
    const out = renderCodexProfilesToml();
    expect(out).toContain('[profiles.scaffolder]');
    expect(out).toContain('[profiles.code-reviewer]');
    expect(out).toContain('[profiles.pr-gate]');
    expect(out).toContain('[profiles.plan-challenger]');
    expect(out).toContain('model = "gpt-5.3-codex-spark"');
    expect(out).toContain('model = "gpt-5.5"');
  });
});

describe('renderReviewChecklist', () => {
  it('contains all three reviewer sections + spec §3.2 link', () => {
    const out = renderReviewChecklist();
    expect(out).toContain('GENERATED FROM agent-contract.md');
    expect(out).toContain('## For code-reviewer');
    expect(out).toContain('## For pr-gate');
    expect(out).toContain('## For pr-reviewer');
    expect(out).toContain('spec §3.2');
  });
});
