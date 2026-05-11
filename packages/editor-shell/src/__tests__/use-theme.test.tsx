/**
 * Wave 7 Phase 2C — useTheme hook contract tests.
 *
 * Covers ADR-0020 D8 precedence (frontmatter > localStorage >
 * 'lego-studs' default) + persist-on-set behavior + theme resolution
 * via the grid-themes registry.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { act, render } from '@testing-library/react';
import { useTheme, type ThemeKey } from '../use-theme';

const STORAGE_KEY = 'skb.grid.theme';

function ThemeProbe({
  frontmatterTheme,
  onState,
}: {
  frontmatterTheme?: string;
  onState: (state: ReturnType<typeof useTheme>) => void;
}) {
  const state = useTheme({ frontmatterTheme });
  onState(state);
  return (
    <div
      data-testid="probe"
      data-theme-key={state.themeKey}
      data-slot-size={state.theme.slotSize}
    />
  );
}

describe('useTheme precedence (ADR-0020 D8)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  test('returns DEFAULT_THEME when nothing set', () => {
    let captured!: ReturnType<typeof useTheme>;
    render(<ThemeProbe onState={(s) => (captured = s)} />);
    expect(captured.themeKey).toBe('lego-studs');
    expect(captured.theme.displayName).toBe('LEGO studs');
  });

  test('respects localStorage when no frontmatter', () => {
    window.localStorage.setItem(STORAGE_KEY, 'graph-paper');
    let captured!: ReturnType<typeof useTheme>;
    render(<ThemeProbe onState={(s) => (captured = s)} />);
    expect(captured.themeKey).toBe('graph-paper');
  });

  test('frontmatter takes precedence over localStorage', () => {
    window.localStorage.setItem(STORAGE_KEY, 'graph-paper');
    let captured!: ReturnType<typeof useTheme>;
    render(
      <ThemeProbe
        frontmatterTheme="bento-canvas"
        onState={(s) => (captured = s)}
      />,
    );
    expect(captured.themeKey).toBe('bento-canvas');
  });

  test('invalid frontmatter falls through to localStorage', () => {
    window.localStorage.setItem(STORAGE_KEY, 'graph-paper');
    let captured!: ReturnType<typeof useTheme>;
    render(
      <ThemeProbe
        frontmatterTheme="typo-theme"
        onState={(s) => (captured = s)}
      />,
    );
    expect(captured.themeKey).toBe('graph-paper');
  });
});

describe('useTheme.setTheme persists + re-resolves', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  test('setTheme updates state + writes to localStorage', () => {
    let captured!: ReturnType<typeof useTheme>;
    render(<ThemeProbe onState={(s) => (captured = s)} />);
    expect(captured.themeKey).toBe('lego-studs');

    act(() => {
      captured.setTheme('graph-paper' satisfies ThemeKey);
    });
    expect(captured.themeKey).toBe('graph-paper');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('graph-paper');
  });

  test('theme object switches when key switches', () => {
    let captured!: ReturnType<typeof useTheme>;
    render(<ThemeProbe onState={(s) => (captured = s)} />);
    const initialSlot = captured.theme.slotSize;
    act(() => {
      captured.setTheme('bento-canvas' satisfies ThemeKey);
    });
    expect(captured.theme.slotSize).toBe(100); // bento-canvas slot size
    expect(captured.theme.slotSize).not.toBe(initialSlot);
  });
});
