/**
 * Renders .claude/settings.json (PostToolUse + SessionStart hooks per spec §3.7).
 *
 * The contract isn't currently consulted but the call signature accepts it for
 * forward compatibility (e.g. per-agent hook variants).
 */

interface Hook {
  matcher?: string;
  command: string;
}

interface Settings {
  hooks: {
    PostToolUse: Hook[];
    SessionStart: Hook[];
  };
}

export function renderSettingsJson(): string {
  const settings: Settings = {
    hooks: {
      PostToolUse: [
        {
          matcher: 'Edit|Write',
          command: 'node scripts/hooks/post-edit.mjs',
        },
      ],
      SessionStart: [
        {
          command: '[ -f docs/plans/active.md ] && cat docs/plans/active.md; pnpm tsc -b --dry',
        },
      ],
    },
  };
  return JSON.stringify(settings, null, 2) + '\n';
}
