import { useTheme } from './use-theme';

/**
 * Default theme switcher button. Open-source consumers may either reuse this
 * component verbatim or build their own button on top of `useTheme`.
 *
 * Styling intentionally minimal: only border / padding / hover surface, all
 * routed through the design-tokens Tailwind preset. The toggle itself does
 * not own typography or layout.
 */
export function ThemeToggle(): JSX.Element {
  const { theme, toggle } = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="rounded-md border border-border px-3 py-1 text-fg hover:bg-surface-1 transition-colors duration-fast"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
