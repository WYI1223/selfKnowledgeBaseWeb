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
  renderCodexToolRunbook,
  type Agent,
  type AgentContract,
} from '../generate-configs.ts';

const FIXTURE_VALID_MIN = `# Test\n\n## Schema\n\n\`\`\`yaml\nagents:\n  - name: <kebab-case>\n    tier: 0\n    llm: claude\n    role: example\n    permissions: []\ntool_patterns:\n  - name: <pattern-id>\n    profile: scaffolder\n    invocation: 'x'\n    triggered_by: []\n\`\`\`\n\n## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_teammates: 1\n  total_tool_patterns: 1\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: test\n    permissions: []\ntool_patterns:\n  - name: bar\n    profile: scaffolder\n    invocation: 'codex exec --profile scaffolder < /dev/null'\n    triggered_by: [some_trigger]\n\`\`\`\n`;

describe('parseAgentContract', () => {
  it('extracts agents + tool_patterns from YAML fenced block (skips Schema example placeholder)', () => {
    const result = parseAgentContract(FIXTURE_VALID_MIN);
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]?.name).toBe('foo');
    expect(result.tool_patterns).toHaveLength(1);
    expect(result.tool_patterns[0]?.name).toBe('bar');
  });

  it('parses the real agent-contract.md post ADR-0011 (5 teammates + 11 tool_patterns)', () => {
    const real = readFileSync('agent-contract.md', 'utf8');
    const result = parseAgentContract(real);
    expect(result.agents).toHaveLength(5);
    expect(result.tool_patterns).toHaveLength(11);
    expect(result.agents.find((a) => a.name === 'orchestrator')?.tier).toBe(0);
    expect(result.agents.find((a) => a.name === 'ux-ui-lead')?.tier).toBe(2);
    expect(result.agents.find((a) => a.name === 'pr-writer')?.tier).toBe(2);
    expect(result.tool_patterns.find((tp) => tp.name === 'codex-pr-reviewer-55')?.profile).toBe(
      'codex-pr-reviewer-55',
    );
    expect(result.tool_patterns.find((tp) => tp.name === 'codex-block-generator')?.profile).toBe(
      'scaffolder',
    );
    expect(result.tool_patterns.find((tp) => tp.name === 'codex-generic-executor')?.profile).toBe(
      'generic-executor',
    );
    expect(result.agents.find((a) => a.name === 'researcher')?.permissions).toContain('web_search');
  });

  it('Tier 1 long-term workers retired (ADR-0011 D3); Tier 3 audits codex-ized (D5); git-operator absorbed (D4)', () => {
    const real = readFileSync('agent-contract.md', 'utf8');
    const result = parseAgentContract(real);
    for (const a of result.agents) {
      expect(a.llm).toBe('claude');
    }
    // Retired Tier 1 workers no longer present as agents
    const retiredWorkers = [
      'api-builder',
      'block-foundation-eng',
      'simple-block-eng',
      'render-block-eng',
      'viz-block-eng',
      'editor-eng',
      'editor-integrator',
      'kernel-architect',
      'kernel-pyodide-eng',
      'mdx-bridge-eng',
    ];
    for (const name of retiredWorkers) {
      expect(result.agents.find((a) => a.name === name)).toBeUndefined();
    }
    // git-operator + pr-reviewer absorbed; structure-auditor / performance-auditor / mdx-doctor / link-checker codex-ized
    const retiredProcessAndAudit = [
      'git-operator',
      'pr-reviewer',
      'structure-auditor',
      'performance-auditor',
      'mdx-doctor',
      'link-checker',
    ];
    for (const name of retiredProcessAndAudit) {
      expect(result.agents.find((a) => a.name === name)).toBeUndefined();
    }
    // Surviving agents = exactly 5 (orchestrator + 4 subagents)
    const survivors = ['orchestrator', 'pr-writer', 'ux-ui-lead', 'refactorer', 'researcher'];
    for (const name of survivors) {
      expect(result.agents.find((a) => a.name === name)).toBeDefined();
    }
    // 8 codex tool_patterns from ADR-0007 D5 carried over (5 scaffolders + plan-challenger),
    // plus codex-pr-reviewer-55 (replaces pr-gate), plus 4 NEW (generic-executor / structure-auditor / perf-auditor / mdx-doctor) = 11.
    const toolNames = [
      'codex-block-generator',
      'codex-test-scaffolder',
      'codex-script-builder',
      'codex-api-crud-builder',
      'codex-css-stylist',
      'plan-challenger',
      'codex-pr-reviewer-55',
      'codex-generic-executor',
      'codex-structure-auditor',
      'codex-perf-auditor',
      'codex-mdx-doctor',
    ];
    for (const name of toolNames) {
      expect(result.agents.find((a) => a.name === name)).toBeUndefined();
      expect(result.tool_patterns.find((tp) => tp.name === name)).toBeDefined();
    }
    // Wave 2 deprecated profiles no longer present as tool_patterns
    expect(result.tool_patterns.find((tp) => tp.name === 'code-reviewer')).toBeUndefined();
    expect(result.tool_patterns.find((tp) => tp.name === 'pr-gate')).toBeUndefined();
  });

  it('rejects YAML blocks where any agent name uses placeholder syntax <...>', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_teammates: 1\n  total_tool_patterns: 0\nagents:\n  - name: <kebab-case>\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\ntool_patterns: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(/no.*authoritative.*yaml.*block/i);
  });

  it('rejects contract where metadata.total_teammates disagrees with agents.length', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_teammates: 99\n  total_tool_patterns: 0\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\ntool_patterns: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(/total_teammates.*equal.*agents\.length/);
  });

  it('rejects contract where metadata.total_tool_patterns disagrees with tool_patterns.length', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_teammates: 1\n  total_tool_patterns: 99\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\ntool_patterns:\n  - name: bar\n    profile: scaffolder\n    invocation: 'x'\n    triggered_by: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(
      /total_tool_patterns.*equal.*tool_patterns\.length/,
    );
  });

  it('rejects contract with duplicate agent names', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_teammates: 2\n  total_tool_patterns: 0\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\n  - name: foo\n    tier: 1\n    llm: claude\n    role: y\n    permissions: []\ntool_patterns: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(/duplicate agent name: foo/);
  });

  it('rejects name collision between agents and tool_patterns', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_teammates: 1\n  total_tool_patterns: 1\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\ntool_patterns:\n  - name: foo\n    profile: scaffolder\n    invocation: 'x'\n    triggered_by: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(/name collision.*foo/);
  });

  it('rejects duplicate names within tool_patterns (distinct from cross-collision message)', () => {
    const md = `## Agents\n\n\`\`\`yaml\nmetadata:\n  version: 1\n  total_teammates: 1\n  total_tool_patterns: 2\nagents:\n  - name: foo\n    tier: 0\n    llm: claude\n    role: x\n    permissions: []\ntool_patterns:\n  - name: bar\n    profile: scaffolder\n    invocation: 'x'\n    triggered_by: []\n  - name: bar\n    profile: scaffolder\n    invocation: 'y'\n    triggered_by: []\n\`\`\`\n`;
    expect(() => parseAgentContract(md)).toThrow(/duplicate tool_pattern name: bar/);
  });

  it('every tool_pattern.invocation contains "< /dev/null" (memory feedback_codex_stdin; ADR-0007 §pre-task-0-followup obs #3)', () => {
    const real = readFileSync('agent-contract.md', 'utf8');
    const result = parseAgentContract(real);
    expect(result.tool_patterns.length).toBeGreaterThan(0);
    for (const tp of result.tool_patterns) {
      expect(tp.invocation, `tool_pattern ${tp.name}.invocation must include '< /dev/null'`).toMatch(
        /<\s*\/dev\/null\b/,
      );
    }
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

  it('emits description field in frontmatter (Claude Code dispatcher requirement)', () => {
    const agent: Agent = {
      name: 'foo-eng',
      tier: 1,
      llm: 'claude',
      role: 'test role',
      permissions: ['read_repo'],
    };
    const out = renderClaudeAgent(agent);
    expect(out).toMatch(/^---\nname: foo-eng\ndescription: "test role"\n/);
  });

  it('escapes embedded double-quotes and backslashes in description', () => {
    const agent: Agent = {
      name: 'bar-eng',
      tier: 1,
      llm: 'claude',
      role: 'has "quote" and \\ backslash',
      permissions: ['read_repo'],
    };
    const out = renderClaudeAgent(agent);
    expect(out).toContain('description: "has \\"quote\\" and \\\\ backslash"');
  });
});

describe('renderClaudeMd', () => {
  it('contains generation banner, teammate count (5 post ADR-0011), and all teammate names', () => {
    const contract = realContract();
    const out = renderClaudeMd(contract);
    expect(out).toContain('GENERATED FROM agent-contract.md');
    expect(out).toContain('Claude teammates (5)');
    for (const agent of contract.agents) {
      expect(out).toContain(agent.name);
    }
  });

  it('contains tool_patterns table with all 11 patterns linked to runbook', () => {
    const contract = realContract();
    const out = renderClaudeMd(contract);
    expect(out).toContain('Codex tool patterns (11)');
    expect(out).toContain('docs/runbooks/codex-tool-invocations.md');
    for (const tp of contract.tool_patterns) {
      expect(out).toContain(tp.name);
    }
  });

  it('does NOT list codex tool_patterns in the teammate roster', () => {
    const contract = realContract();
    const out = renderClaudeMd(contract);
    const teammateSection = out.split('## Claude teammates')[1]?.split('## Codex tool')[0] ?? '';
    expect(teammateSection).not.toContain('| `codex-pr-reviewer-55` |');
    expect(teammateSection).not.toContain('| `codex-generic-executor` |');
    expect(teammateSection).not.toContain('| `plan-challenger` |');
  });
});

describe('renderAgentsMd', () => {
  it('contains codex profile examples and all tool_pattern names', () => {
    const contract = realContract();
    const out = renderAgentsMd(contract);
    expect(out).toContain('GENERATED FROM agent-contract.md');
    expect(out).toContain('codex exec --yolo --profile');
    expect(out).toContain('< /dev/null');
    for (const tp of contract.tool_patterns) {
      expect(out).toContain(tp.name);
    }
  });

  it('lists tool_patterns count + cross-link to runbook', () => {
    const contract = realContract();
    const out = renderAgentsMd(contract);
    expect(out).toContain('Tool patterns (11)');
    expect(out).toContain('docs/runbooks/codex-tool-invocations.md');
  });
});

describe('renderSettingsJson', () => {
  type ParsedSettings = {
    hooks: {
      PostToolUse: Array<{
        matcher: string;
        hooks: Array<{ type: string; command: string }>;
      }>;
      SessionStart: Array<{
        matcher: string;
        hooks: Array<{ type: string; command: string }>;
      }>;
    };
  };

  it('produces valid JSON with nested-shape PostToolUse hook (matcher + hooks[])', () => {
    const out = renderSettingsJson();
    const parsed = JSON.parse(out) as ParsedSettings;
    const entry = parsed.hooks.PostToolUse[0];
    expect(entry?.matcher).toBe('Edit|Write');
    expect(Array.isArray(entry?.hooks)).toBe(true);
    expect(entry?.hooks[0]?.type).toBe('command');
    expect(entry?.hooks[0]?.command).toBe('node scripts/hooks/post-edit.mjs');
  });

  it('produces nested-shape SessionStart hook with empty-string matcher', () => {
    const out = renderSettingsJson();
    const parsed = JSON.parse(out) as ParsedSettings;
    const entry = parsed.hooks.SessionStart[0];
    expect(entry?.matcher).toBe('');
    expect(Array.isArray(entry?.hooks)).toBe(true);
    expect(entry?.hooks[0]?.type).toBe('command');
  });

  it('SessionStart command tolerates missing docs/plans/active.md (existence guard)', () => {
    const out = renderSettingsJson();
    const parsed = JSON.parse(out) as ParsedSettings;
    const cmd = parsed.hooks.SessionStart[0]?.hooks[0]?.command ?? '';
    expect(cmd).toContain('[ -f docs/plans/active.md ]');
    expect(cmd).toMatch(/;\s*pnpm tsc -b --dry/);
  });

  it('round-trips through JSON.stringify(_, null, 2) + trailing newline (idempotent)', () => {
    const out = renderSettingsJson();
    const parsed = JSON.parse(out) as ParsedSettings;
    expect(JSON.stringify(parsed, null, 2) + '\n').toBe(out);
  });
});

describe('renderCodexProfilesToml', () => {
  it('contains all 7 profile sections post ADR-0011 D6', () => {
    const out = renderCodexProfilesToml();
    expect(out).toContain('[profiles.scaffolder]');
    expect(out).toContain('[profiles.plan-challenger]');
    expect(out).toContain('[profiles.codex-pr-reviewer-55]');
    expect(out).toContain('[profiles.generic-executor]');
    expect(out).toContain('[profiles.structure-auditor]');
    expect(out).toContain('[profiles.perf-auditor]');
    expect(out).toContain('[profiles.mdx-doctor]');
    expect(out).toContain('model = "gpt-5.3-codex-spark"');
    expect(out).toContain('model = "gpt-5.5"');
  });

  it('Wave 2 deprecated profiles (code-reviewer / pr-gate) removed from generated TOML', () => {
    const out = renderCodexProfilesToml();
    expect(out).not.toContain('[profiles.code-reviewer]');
    expect(out).not.toContain('[profiles.pr-gate]');
  });

  it('every profile sets approval_policy = "never" (orchestrator-driven)', () => {
    const out = renderCodexProfilesToml();
    const profileSections = out.split(/\n\[profiles\./).slice(1);
    expect(profileSections).toHaveLength(7);
    for (const section of profileSections) {
      expect(section).toContain('approval_policy = "never"');
      expect(section).not.toContain('approval_policy = "on-request"');
    }
  });
});

describe('renderReviewChecklist', () => {
  it('contains the unified codex-pr-reviewer-55 section + Claude pre-commit section + ADR-0011 references', () => {
    const out = renderReviewChecklist();
    expect(out).toContain('GENERATED FROM agent-contract.md');
    expect(out).toContain('## For `codex-pr-reviewer-55`');
    expect(out).toContain('## For Claude pre-commit review');
    expect(out).toContain('ADR-0011');
    expect(out).toContain('ADR-0006');
  });
});

describe('renderCodexToolRunbook', () => {
  it('contains a section per tool_pattern with canonical bash + triggers', () => {
    const contract = realContract();
    const out = renderCodexToolRunbook(contract);
    expect(out).toContain('GENERATED FROM agent-contract.md');
    expect(out).toContain('codex exec --yolo --profile');
    for (const tp of contract.tool_patterns) {
      expect(out).toContain(`## \`${tp.name}\``);
      expect(out).toContain(tp.invocation);
      for (const trig of tp.triggered_by) {
        expect(out).toContain(`\`${trig}\``);
      }
    }
  });

  it('cites ADR-0007 D5 + ADR-0006 + lockfile (commit e15ec36) reminder', () => {
    const contract = realContract();
    const out = renderCodexToolRunbook(contract);
    expect(out).toContain('ADR-0007');
    expect(out).toContain('ADR-0006');
    expect(out).toContain('pnpm-lock.yaml');
    expect(out).toContain('< /dev/null');
  });
});
