/**
 * Renders .claude/settings.json (PostToolUse + SessionStart hooks per spec §3.7).
 *
 * NOTE: spec §3.7's flat shape is an erratum — Claude Code's actual schema
 * requires each matcher entry to nest its commands inside a `hooks: [{type, command}]`
 * array. This renderer emits the correct nested shape; tracked for ADR in T0.13.
 */

interface HookCommand {
  type: 'command';
  command: string;
}

interface MatcherEntry {
  matcher: string;
  hooks: HookCommand[];
}

interface Settings {
  hooks: {
    PostToolUse: MatcherEntry[];
    SessionStart: MatcherEntry[];
  };
}

export function renderSettingsJson(): string {
  const settings: Settings = {
    hooks: {
      PostToolUse: [
        {
          matcher: 'Edit|Write',
          hooks: [{ type: 'command', command: 'node scripts/hooks/post-edit.mjs' }],
        },
      ],
      SessionStart: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: '[ -f docs/plans/active.md ] && cat docs/plans/active.md; pnpm tsc -b --dry',
            },
          ],
        },
      ],
    },
  };
  return JSON.stringify(settings, null, 2) + '\n';
}
