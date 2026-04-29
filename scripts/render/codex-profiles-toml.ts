/**
 * Renders tmp/codex-profiles.toml — manual merge into ~/.codex/config.toml.
 *
 * Spec §3.12: 4 profiles (scaffolder / code-reviewer / pr-gate / plan-challenger).
 */

const TOML = `# Generated from agent-contract.md
# Manual merge into ~/.codex/config.toml (run after pnpm generate:configs).

[profiles.scaffolder]
model = "gpt-5.3-codex-spark"
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[profiles.code-reviewer]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"

[profiles.pr-gate]
model = "gpt-5.5"
sandbox_mode = "read-only"

[profiles.plan-challenger]
model = "gpt-5.3-codex-spark"
sandbox_mode = "read-only"
`;

export function renderCodexProfilesToml(): string {
  return TOML;
}
