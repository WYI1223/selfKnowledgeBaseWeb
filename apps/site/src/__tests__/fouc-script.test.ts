/*
 * FOUC algorithm equivalence regression test.
 *
 * BaseLayout.astro ships an inline `<script>` that runs before any module
 * loads (and therefore can't import @skb/design-tokens). The script must
 * derive the boot theme via byte-equivalent logic to `getInitialTheme()`
 * from @skb/design-tokens — in BOTH happy-path AND exception handling.
 *
 * The test reads the actual BaseLayout.astro from disk, extracts the IIFE,
 * evaluates it against a stubbed (localStorage + matchMedia + document)
 * environment for:
 *   1. a corpus of saved-value × system-preference combinations (16 rows)
 *   2. storage-throws scenarios (Safari Private Mode / iOS WebView pattern)
 * and asserts the FOUC-applied theme matches `getInitialTheme()`'s answer
 * for every row. If anyone reverts the strict-whitelist algorithm OR widens
 * the try/catch scope, the relevant row fails immediately.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getInitialTheme } from '@skb/design-tokens';

const here = dirname(fileURLToPath(import.meta.url));
const baseLayoutPath = resolve(here, '../layouts/BaseLayout.astro');

function extractFoucIife(src: string): string {
  const startMarker = '(function () {';
  const endMarker = '})();';
  const startIdx = src.indexOf(startMarker);
  const endIdx = src.indexOf(endMarker, startIdx);
  if (startIdx < 0 || endIdx < 0) {
    throw new Error('Could not locate FOUC IIFE in BaseLayout.astro');
  }
  return src.slice(startIdx, endIdx + endMarker.length);
}

interface FakeStorage {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
}

function makeFakeStorage(initial: string | null): FakeStorage {
  let value = initial;
  return {
    getItem: (k: string) => (k === 'skb-theme' ? value : null),
    setItem: (k: string, v: string) => {
      if (k === 'skb-theme') value = v;
    },
    removeItem: (k: string) => {
      if (k === 'skb-theme') value = null;
    },
  };
}

function makeThrowingStorage(): FakeStorage {
  const err = new Error('storage unavailable');
  return {
    getItem: () => {
      throw err;
    },
    setItem: () => {
      throw err;
    },
    removeItem: () => {
      throw err;
    },
  };
}

type FakeMatchMedia = (q: string) => { matches: boolean };

function runFoucWith(
  iife: string,
  storage: FakeStorage,
  matchMedia: FakeMatchMedia,
): 'dark' | 'light' {
  let dataTheme: string | null = null;
  const fakeDocument = {
    documentElement: {
      setAttribute: (k: string, v: string) => {
        if (k === 'data-theme') dataTheme = v;
      },
      removeAttribute: (k: string) => {
        if (k === 'data-theme') dataTheme = null;
      },
    },
  };
  const fakeWindow = { matchMedia };
  // The whole point of this test is to evaluate the IIFE source extracted
  // from BaseLayout.astro against a mocked environment, byte-equivalent to
  // the browser's. `new Function` is the controlled way to do that.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function('localStorage', 'window', 'document', iife);
  fn(storage, fakeWindow, fakeDocument);
  return dataTheme === 'dark' ? 'dark' : 'light';
}

function runGetInitialThemeWith(
  storage: FakeStorage,
  matchMedia: FakeMatchMedia,
): 'dark' | 'light' {
  const originalLocalStorage = window.localStorage;
  const originalMatchMedia = window.matchMedia;
  // happy-dom's window properties are configurable; swap them for the call.
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  // @ts-expect-error overriding for the controlled call
  window.matchMedia = matchMedia;
  try {
    return getInitialTheme();
  } finally {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    });
    window.matchMedia = originalMatchMedia;
  }
}

const corpus: ReadonlyArray<{ saved: string | null; systemDark: boolean }> = [
  { saved: null, systemDark: false },
  { saved: null, systemDark: true },
  { saved: 'light', systemDark: false },
  { saved: 'light', systemDark: true },
  { saved: 'dark', systemDark: false },
  { saved: 'dark', systemDark: true },
  { saved: 'invalid', systemDark: false },
  { saved: 'invalid', systemDark: true },
  { saved: 'Dark', systemDark: false },
  { saved: 'Dark', systemDark: true },
  { saved: '', systemDark: false },
  { saved: '', systemDark: true },
  { saved: 'INVALID', systemDark: false },
  { saved: 'INVALID', systemDark: true },
  { saved: 'theme-dark', systemDark: false },
  { saved: 'theme-dark', systemDark: true },
];

describe('FOUC inline script vs getInitialTheme()', () => {
  const src = readFileSync(baseLayoutPath, 'utf8');
  const iife = extractFoucIife(src);

  it('extracts the IIFE from BaseLayout.astro', () => {
    expect(iife).toContain("localStorage.getItem('skb-theme')");
    expect(iife).toContain("matchMedia('(prefers-color-scheme: dark)')");
  });

  it.each(corpus)(
    'agrees with getInitialTheme() for saved=$saved systemDark=$systemDark',
    ({ saved, systemDark }) => {
      const matchMedia: FakeMatchMedia = () => ({ matches: systemDark });
      const fouc = runFoucWith(iife, makeFakeStorage(saved), matchMedia);
      const hook = runGetInitialThemeWith(makeFakeStorage(saved), matchMedia);
      expect(fouc).toBe(hook);
    },
  );

  it('uses STRICT whitelist (regression: truthy-coerce divergence)', () => {
    // The old truthy-coerce algorithm (`saved ? saved === 'dark' : ...`) gave
    // light for saved='invalid' + systemDark=true. The strict whitelist
    // falls through to matchMedia, yielding dark. This is the canonical
    // saved-value failure case the v2 rewrite eliminated.
    const matchMedia: FakeMatchMedia = () => ({ matches: true });
    expect(runFoucWith(iife, makeFakeStorage('invalid'), matchMedia)).toBe('dark');
    expect(runGetInitialThemeWith(makeFakeStorage('invalid'), matchMedia)).toBe('dark');
  });

  it('agrees with getInitialTheme() when localStorage.getItem throws + systemDark=true', () => {
    // Safari Private Mode / iOS WebView with disabled storage: getItem throws.
    // A wide-scope try/catch in the IIFE swallows matchMedia + DOM apply,
    // producing light when system pref is dark — hydration flash on first paint.
    // The narrow try/catch (wrapping ONLY getItem) treats `saved` as null,
    // falls through to matchMedia, and produces dark — matching getInitialTheme.
    const matchMedia: FakeMatchMedia = () => ({ matches: true });
    expect(runFoucWith(iife, makeThrowingStorage(), matchMedia)).toBe('dark');
    expect(runGetInitialThemeWith(makeThrowingStorage(), matchMedia)).toBe('dark');
  });

  it('agrees with getInitialTheme() when localStorage.getItem throws + systemDark=false', () => {
    const matchMedia: FakeMatchMedia = () => ({ matches: false });
    expect(runFoucWith(iife, makeThrowingStorage(), matchMedia)).toBe('light');
    expect(runGetInitialThemeWith(makeThrowingStorage(), matchMedia)).toBe('light');
  });
});
