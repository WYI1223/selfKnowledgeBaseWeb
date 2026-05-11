/**
 * @skb/editor-shell useTheme — React hook for the grid-themes
 * resolution + storage layer (ADR-0020 D7-D9).
 *
 * Wave 7 Phase 2C — wires `@skb/grid-themes` into the editor mount.
 * Caller passes the optional `frontmatterTheme` (per-doc MDX
 * frontmatter `theme:` field per ADR-0020 D8 precedence rule); the
 * hook resolves frontmatter > localStorage > 'lego-studs' default,
 * returns the active theme + a setter that persists to localStorage.
 *
 * Persistence: `setTheme` writes to `localStorage['skb.grid.theme']`
 * via `@skb/grid-themes/setUserTheme`. SSR-safe — `getUserTheme`
 * returns `undefined` outside the browser.
 *
 * Why a hook (not a context): the theme is read at the editor root
 * + threaded down via the `style` prop on `GridContainer` (cssVars
 * inject) + `<ThemeSwitcher>` consumer. A context would add
 * indirection without unblocking any nested consumer.
 */
import { useCallback, useState } from 'react';
import {
  DEFAULT_THEME,
  getTheme,
  resolveTheme,
  setUserTheme,
  type GridTheme,
  type ThemeKey,
} from '@skb/grid-themes';

export interface UseThemeOptions {
  /** Per-doc MDX frontmatter `theme:` field; takes precedence over
   *  localStorage + default per ADR-0020 D8. */
  readonly frontmatterTheme?: string | undefined;
}

export interface UseThemeReturn {
  /** The active ThemeKey after applying precedence rules. */
  readonly themeKey: ThemeKey;
  /** The resolved `GridTheme` object (registry lookup; always populated
   *  for the 3 built-in keys). */
  readonly theme: GridTheme;
  /** Switch the active theme + persist to localStorage. */
  readonly setTheme: (next: ThemeKey) => void;
}

export function useTheme(options?: UseThemeOptions): UseThemeReturn {
  const initialKey = resolveTheme({
    frontmatterTheme: options?.frontmatterTheme,
  });
  const [themeKey, setThemeKey] = useState<ThemeKey>(initialKey);
  const setTheme = useCallback((next: ThemeKey) => {
    setUserTheme(next);
    setThemeKey(next);
  }, []);
  const theme = getTheme(themeKey);
  return { themeKey, theme, setTheme };
}

export { DEFAULT_THEME };
export type { ThemeKey, GridTheme };
