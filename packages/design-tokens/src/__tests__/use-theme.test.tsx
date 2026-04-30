import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, getInitialTheme, applyThemeDOM } from '../use-theme';

function mockMatchMedia(matches: boolean): void {
  const mql: MediaQueryList = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('getInitialTheme', () => {
  it('defaults to light when no localStorage and prefers-color-scheme: light', () => {
    mockMatchMedia(false);
    expect(getInitialTheme()).toBe('light');
  });

  it('honors prefers-color-scheme: dark', () => {
    mockMatchMedia(true);
    expect(getInitialTheme()).toBe('dark');
  });

  it('localStorage value wins over prefers-color-scheme', () => {
    localStorage.setItem('skb-theme', 'light');
    mockMatchMedia(true);
    expect(getInitialTheme()).toBe('light');
  });
});

describe('applyThemeDOM', () => {
  it('is idempotent and clears the attribute when set back to light', () => {
    applyThemeDOM('dark');
    applyThemeDOM('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applyThemeDOM('light');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('does NOT touch localStorage', () => {
    applyThemeDOM('dark');
    expect(localStorage.getItem('skb-theme')).toBeNull();
    applyThemeDOM('light');
    expect(localStorage.getItem('skb-theme')).toBeNull();
  });
});

describe('useTheme', () => {
  it('fresh mount with empty localStorage + matchMedia dark does NOT persist (regression: ADR-0003 D6)', () => {
    mockMatchMedia(true);
    localStorage.clear();
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('skb-theme')).toBeNull();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('fresh mount with empty localStorage + matchMedia light does NOT persist', () => {
    mockMatchMedia(false);
    localStorage.clear();
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('skb-theme')).toBeNull();
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('toggle flips theme and writes localStorage + data-theme', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('skb-theme')).toBeNull();
    act(() => result.current.toggle());
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('skb-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    act(() => result.current.toggle());
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('skb-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('setTheme writes both storage and DOM', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('skb-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('setTheme matching system preference still persists (manual override of default-equal intent)', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('skb-theme')).toBeNull();
    act(() => result.current.setTheme('dark'));
    expect(localStorage.getItem('skb-theme')).toBe('dark');
  });
});
