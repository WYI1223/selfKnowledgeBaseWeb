/**
 * Shared types + Zod schemas for the agent-contract generator.
 *
 * Spec: docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md §3.1, §3.13
 */
import { z } from 'zod';

export const AgentSchema = z.object({
  name: z.string(),
  tier: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  llm: z.enum(['claude', 'codex']),
  profile: z.enum(['scaffolder', 'code-reviewer', 'pr-gate', 'plan-challenger']).optional(),
  role: z.string(),
  permissions: z.array(z.string()),
  forbidden: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const ContractSchema = z
  .object({
    metadata: z.object({
      version: z.number(),
      total_agents: z.number(),
    }),
    agents: z.array(AgentSchema).min(1, 'agents must not be empty'),
  })
  .superRefine((contract, ctx) => {
    if (contract.metadata.total_agents !== contract.agents.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `metadata.total_agents (${contract.metadata.total_agents}) must equal agents.length (${contract.agents.length})`,
        path: ['metadata', 'total_agents'],
      });
    }
    const seen = new Set<string>();
    for (const a of contract.agents) {
      if (seen.has(a.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate agent name: ${a.name}`,
          path: ['agents'],
        });
      }
      seen.add(a.name);
    }
  });

export type Agent = z.infer<typeof AgentSchema>;
export type AgentContract = z.infer<typeof ContractSchema>;

export const TIER_NAMES = ['Orchestrator', 'Worker', 'Process', 'Audit'] as const;

export function tierName(tier: Agent['tier']): string {
  return TIER_NAMES[tier];
}
