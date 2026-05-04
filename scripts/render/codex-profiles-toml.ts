/**
 * Renders tmp/codex-profiles.toml — manual merge into ~/.codex/config.toml.
 *
 * Spec §3.12 baseline (4 profiles) extended by ADR-0011 D6 to 7 active profiles:
 * scaffolder / plan-challenger / codex-pr-reviewer-55 / codex-generic-executor /
  * codex-structure-auditor / codex-perf-auditor / codex-mdx-doctor. The legacy `code-reviewer`
 * (5.3-spark) and `pr-gate` profiles are removed (deprecated per ADR-0011 D6 —
 * codex-pr-reviewer-55 is the unified default reviewer at D1 stage 3).
 *
 * ADR-0007 D5 note: the source of truth for which patterns use which profile is
 * `tool_patterns:` in agent-contract.md. The profile sections below are static
 * (codex CLI requires fixed profile section headers); their contents (model /
 * sandbox / approval) are codex CLI configuration, not derived per-pattern.
 * Adding a new pattern that uses one of these profiles needs no change here.
 *
 * Approval-policy decision: every profile sets approval_policy = "never". The
 * Claude orchestrator (Tier 0) is the sole human-in-the-loop checkpoint —
 * Codex tool invocations run autonomously within their sandbox, and the orchestrator
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

[profiles.plan-challenger]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"
approval_policy = "never"

[profiles.codex-pr-reviewer-55]
# Workspace-write: ADR-0011 D1 stage 5 (COMMIT) is bundled into this profile.
# After stage 3 review PASS, the same invocation runs explicit-file-list
# 'git add' + 'git commit' + 'git push' (per ADR-0006 D8 staging). Keep prompt
# boundaries strict so review-only runs don't accidentally mutate.
model = "gpt-5.5"
sandbox_mode = "workspace-write"
approval_policy = "never"

[profiles.codex-generic-executor]
model = "gpt-5.5"
sandbox_mode = "workspace-write"
approval_policy = "never"

[profiles.codex-structure-auditor]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"
approval_policy = "never"

[profiles.codex-perf-auditor]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"
approval_policy = "never"

[profiles.codex-mdx-doctor]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"
approval_policy = "never"
`;

export function renderCodexProfilesToml(): string {
  return TOML;
}
