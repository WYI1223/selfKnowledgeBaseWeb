import { cleanup, act, render } from '@testing-library/react';
import { createElement, type ComponentType } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HeavyBlockBoundary } from '../index';

afterEach(() => {
  cleanup();
});

describe('HeavyBlockBoundary', () => {
  it('AC#1 - exported as a function from the package barrel', () => {
    expect(HeavyBlockBoundary).toBeDefined();
    expect(typeof HeavyBlockBoundary).toBe('function');
  });

  it('AC#3 - SSR/hydration byte-equivalence (no React mismatch warning)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const props = {
      kind: 'jupyter' as const,
      dims: { width: 600, height: 400 },
      load: () => new Promise<{ default: ComponentType<Record<string, never>> }>(() => {}),
      childProps: {} as Record<string, never>,
    };
    const ssrHtml = renderToString(
      createElement(HeavyBlockBoundary<Record<string, never>>, props),
    );
    const container = document.createElement('div');
    container.innerHTML = ssrHtml;
    document.body.appendChild(container);

    let root: ReturnType<typeof hydrateRoot> | undefined;
    act(() => {
      root = hydrateRoot(
        container,
        createElement(HeavyBlockBoundary<Record<string, never>>, props),
      );
    });

    const calls = errorSpy.mock.calls.flat().map((arg) => String(arg));
    const hasMismatch = calls.some(
      (msg) => msg.includes('Hydration') || msg.includes('did not match'),
    );
    expect(hasMismatch).toBe(false);

    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
    errorSpy.mockRestore();
  });

  it('AC#6 - successful load path forwards childProps', async () => {
    const Loaded: ComponentType<{ name: string }> = ({ name }) =>
      createElement('div', { 'data-loaded': 'true' }, name);
    const load = vi.fn(() => Promise.resolve({ default: Loaded }));

    const { getByText, queryByText } = render(
      createElement(HeavyBlockBoundary<{ name: string }>, {
        kind: 'jupyter',
        dims: { width: 600, height: 400 },
        load,
        childProps: { name: 'A2-OK' },
      }),
    );

    expect(queryByText('A2-OK')).toBeNull();
    await act(async () => {
      await Promise.resolve();
    });
    expect(getByText('A2-OK')).toBeTruthy();
    expect(document.querySelector('[data-block="jupyter"]')).toBeTruthy();
  });

  it('AC#10 - mount guard suppresses post-unmount setState warning', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let resolveFn: ((mod: { default: ComponentType<Record<string, never>> }) => void) | undefined;
    const load = () =>
      new Promise<{ default: ComponentType<Record<string, never>> }>((resolve) => {
        resolveFn = resolve;
      });

    const { unmount } = render(
      createElement(HeavyBlockBoundary<Record<string, never>>, {
        kind: 'jupyter',
        dims: { width: 1, height: 1 },
        load,
        childProps: {},
      }),
    );
    unmount();
    await act(async () => {
      resolveFn?.({ default: () => createElement('div') });
      await Promise.resolve();
    });

    const calls = errorSpy.mock.calls.flat().map((arg) => String(arg));
    const hasUnmountWarning = calls.some(
      (msg) =>
        msg.includes('state update on an unmounted') ||
        msg.includes('memory leak') ||
        msg.includes('unmounted React'),
    );
    expect(hasUnmountWarning).toBe(false);
    errorSpy.mockRestore();
  });

  it('AC#11 - load called with AbortSignal; signal.aborted=true after unmount', () => {
    let capturedSignal: AbortSignal | undefined;
    const load = vi.fn((init?: { signal?: AbortSignal }) => {
      capturedSignal = init?.signal;
      return new Promise<{ default: ComponentType<Record<string, never>> }>(() => {});
    });
    const { unmount } = render(
      createElement(HeavyBlockBoundary<Record<string, never>>, {
        kind: 'jupyter',
        dims: { width: 1, height: 1 },
        load,
        childProps: {},
      }),
    );
    expect(load).toHaveBeenCalledTimes(1);
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
    expect(load).toHaveBeenCalledWith({ signal: capturedSignal });
    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
