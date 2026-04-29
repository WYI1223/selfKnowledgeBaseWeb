/**
 * Renders tmp/codex-profiles.toml — manual merge into ~/.codex/config.toml.
 *
 * Spec §3.12: 4 profiles (scaffolder / code-reviewer / pr-gate / plan-challenger).
 *
 * Approval-policy decision: every profile sets approval_policy = "never". The
 * Claude orchestrator (Tier 0) is the sole human-in-the-loop checkpoint —
 * Codex workers run autonomously within their sandbox, and the orchestrator
 * reviews their output before any user-facing escalation. Spec §3.12 shows
 * scaffolder with "on-request"; that is a spec erratum (single-checkpoint
 * principle) tracked for T0.13 ADR-0001 follow-ups.
 */

const TOML = `# Generated from agent-contract.md
# Manual merge into ~/.codex/config.toml (run after pnpm generate:configs).

[profiles.scaffolder]
model = "gpt-5.3-codex-spark"
sandbox_mode = "workspace-write"
approval_policy = "never"

[profiles.code-reviewer]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"
approval_policy = "never"

[profiles.pr-gate]
model = "gpt-5.5"
sandbox_mode = "read-only"
approval_policy = "never"

[profiles.plan-challenger]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"
approval_policy = "never"
`;

export function renderCodexProfilesToml(): string {
  return TOML;
}
