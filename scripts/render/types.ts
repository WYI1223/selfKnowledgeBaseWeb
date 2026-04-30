/**
 * Shared types + Zod schemas for the agent-contract generator.
 *
 * Spec: docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md §3.1, §3.13
 * ADR-0007 D5: agents (Claude teammates, persistent context) split from
 * tool_patterns (codex Bash invocations, stateless).
 */
import { z } from 'zod';

export const AgentSchema = z.object({
  name: z.string(),
  tier: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  llm: z.literal('claude'),
  role: z.string(),
  permissions: z.array(z.string()),
  forbidden: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const ToolPatternSchema = z.object({
  name: z.string(),
  profile: z.enum(['scaffolder', 'code-reviewer', 'pr-gate', 'plan-challenger']),
  invocation: z.string(),
  triggered_by: z.array(z.string()),
  output_handling: z.string().optional(),
  description: z.string().optional(),
});

export const ContractSchema = z
  .object({
    metadata: z.object({
      version: z.number(),
      total_teammates: z.number(),
      total_tool_patterns: z.number(),
    }),
    agents: z.array(AgentSchema).min(1, 'agents must not be empty'),
    tool_patterns: z.array(ToolPatternSchema).min(0),
  })
  .superRefine((contract, ctx) => {
    if (contract.metadata.total_teammates !== contract.agents.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `metadata.total_teammates (${contract.metadata.total_teammates}) must equal agents.length (${contract.agents.length})`,
        path: ['metadata', 'total_teammates'],
      });
    }
    if (contract.metadata.total_tool_patterns !== contract.tool_patterns.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `metadata.total_tool_patterns (${contract.metadata.total_tool_patterns}) must equal tool_patterns.length (${contract.tool_patterns.length})`,
        path: ['metadata', 'total_tool_patterns'],
      });
    }
    const agentNames = new Set<string>();
    for (const a of contract.agents) {
      if (agentNames.has(a.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate agent name: ${a.name}`,
          path: ['agents'],
        });
      }
      agentNames.add(a.name);
    }
    const toolNames = new Set<string>();
    for (const tp of contract.tool_patterns) {
      if (toolNames.has(tp.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate tool_pattern name: ${tp.name}`,
          path: ['tool_patterns'],
        });
      }
      toolNames.add(tp.name);
      if (agentNames.has(tp.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `name collision between agents and tool_patterns: ${tp.name}`,
          path: ['tool_patterns'],
        });
      }
    }
  });

export type Agent = z.infer<typeof AgentSchema>;
export type ToolPattern = z.infer<typeof ToolPatternSchema>;
export type AgentContract = z.infer<typeof ContractSchema>;

export const TIER_NAMES = ['Orchestrator', 'Worker', 'Process', 'Audit'] as const;

export function tierName(tier: Agent['tier']): string {
  return TIER_NAMES[tier];
}
