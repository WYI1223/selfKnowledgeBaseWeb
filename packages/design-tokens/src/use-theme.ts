import { useCallback, useEffect, useState } from 'react';

export const themeNames = ['light', 'dark'] as const;
export type ThemeName = (typeof themeNames)[number];

/**
 * localStorage key — kept literally in sync with the inline FOUC script in
 * apps/site/src/layouts/BaseLayout.astro. Renaming this constant is a
 * cross-package contract break.
 */
export const STORAGE_KEY = 'skb-theme';

export function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* localStorage unavailable; fall through to system preference */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * DOM-only theme application. Idempotent and safe to call on every mount /
 * effect — does NOT touch localStorage. Persistence is intentionally split out
 * so first-mount system-preference reads don't clobber future OS theme
 * changes (ADR-0003 D6: localStorage write is coupled to manual user action).
 */
export function applyThemeDOM(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function persistTheme(theme: ThemeName): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* swallow: localStorage unavailable (quota / private mode) */
  }
}

export interface UseThemeResult {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggle: () => void;
}

export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    applyThemeDOM(theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeName) => {
    persistTheme(t);
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeName = current === 'light' ? 'dark' : 'light';
      persistTheme(next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
