import { cleanup, act, render, fireEvent } from '@testing-library/react';
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

  it('AC#7 - rejected load path renders error UI + retry button + onLoadError telemetry', async () => {
    const errorObj = new Error('boom');
    const load = vi.fn(() => Promise.reject(errorObj));
    const onLoadError = vi.fn();

    const { getByText, getByRole, queryByRole } = render(
      createElement(HeavyBlockBoundary<Record<string, never>>, {
        kind: 'jupyter',
        dims: { width: 600, height: 400 },
        load,
        childProps: {},
        onLoadError,
      }),
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getByText('Failed to load jupyter')).toBeTruthy();
    const retryBtn = getByRole('button', { name: 'Retry' });
    expect(retryBtn).toBeTruthy();
    expect((retryBtn as HTMLButtonElement).disabled).toBe(false);
    expect(onLoadError).toHaveBeenCalledTimes(1);
    expect(onLoadError).toHaveBeenCalledWith(errorObj, 1);
    expect(queryByRole('status')?.querySelector('[data-loaded]')).toBeFalsy();
  });

  it('AC#8 - retry click constructs new AbortController and re-runs load', async () => {
    let callCount = 0;
    const Loaded: ComponentType<{ name: string }> = ({ name }) =>
      createElement('div', { 'data-loaded': 'true' }, name);
    const signals: AbortSignal[] = [];
    const load = vi.fn((init?: { signal?: AbortSignal }) => {
      callCount += 1;
      if (init?.signal) signals.push(init.signal);
      if (callCount === 1) return Promise.reject(new Error('first-fail'));
      return Promise.resolve({ default: Loaded });
    });
    const onLoadError = vi.fn();

    const { getByRole, getByText } = render(
      createElement(HeavyBlockBoundary<{ name: string }>, {
        kind: 'jupyter',
        dims: { width: 600, height: 400 },
        load,
        childProps: { name: 'A3-OK' },
        onLoadError,
      }),
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(load).toHaveBeenCalledTimes(1);
    const retryBtn = getByRole('button', { name: 'Retry' });

    await act(async () => {
      fireEvent.click(retryBtn);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(load).toHaveBeenCalledTimes(2);
    expect(signals.length).toBe(2);
    const firstSignal = signals[0];
    const secondSignal = signals[1];
    if (!firstSignal || !secondSignal) {
      throw new Error('Expected two AbortSignal instances');
    }
    expect(firstSignal).not.toBe(secondSignal);
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);
    expect(getByText('A3-OK')).toBeTruthy();
    expect(onLoadError).toHaveBeenCalledTimes(1);
    expect(onLoadError).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it('AC#9 - maxRetries bound disables retry button after exhaustion', async () => {
    const load = vi.fn(() => Promise.reject(new Error('always-fail')));
    const onLoadError = vi.fn();

    const { getByRole } = render(
      createElement(HeavyBlockBoundary<Record<string, never>>, {
        kind: 'jupyter',
        dims: { width: 1, height: 1 },
        load,
        childProps: {},
        onLoadError,
        maxRetries: 2,
      }),
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(1);
    expect(onLoadError).toHaveBeenLastCalledWith(expect.any(Error), 1);

    let retryBtn = getByRole('button', { name: 'Retry' }) as HTMLButtonElement;
    expect(retryBtn.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(retryBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(2);
    expect(onLoadError).toHaveBeenLastCalledWith(expect.any(Error), 2);

    retryBtn = getByRole('button', { name: 'Retry' }) as HTMLButtonElement;
    expect(retryBtn.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(retryBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(3);
    expect(onLoadError).toHaveBeenLastCalledWith(expect.any(Error), 3);

    retryBtn = getByRole('button', { name: 'Retry' }) as HTMLButtonElement;
    expect(retryBtn.disabled).toBe(true);

    await act(async () => {
      fireEvent.click(retryBtn);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(3);
    expect(onLoadError).toHaveBeenCalledTimes(3);
  });
});
