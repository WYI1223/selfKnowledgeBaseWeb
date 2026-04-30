import { describe, expect, it } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import type {
  KernelAdapter,
  KernelEvent,
  KernelSession,
} from '@skb/kernel-adapter';
import { jupyterCore } from '../core/core-definition';
import {
  jupyterUiDefault,
  JupyterEditorView,
  JupyterRenderView,
  JupyterView,
  JUPYTER_TOKENS,
} from '../ui-default';

/**
 * UI surface contract tests + a smoke render for the React NodeView.
 * Mirrors block-callout's ui-default.test.tsx shape (sister-doc invariant
 * per ADR-0006 #6) but stays in `.tsx` because JupyterView is a real React
 * component with state.
 *
 * The Pyodide adapter is heavy (loads WASM); these tests inject a mock
 * KernelAdapter via the JupyterView's `adapter` prop — the production
 * `JupyterEditorView` accepts the same prop optionally.
 */

function makeAsyncIterable<T>(items: readonly T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      let i = 0;
      return {
        next(): Promise<IteratorResult<T>> {
          if (i < items.length) {
            const value = items[i++] as T;
            return Promise.resolve({ value, done: false });
          }
          return Promise.resolve({ value: undefined as unknown as T, done: true });
        },
      };
    },
  };
}

function makeMockAdapter(events: readonly KernelEvent[]): KernelAdapter {
  const session: KernelSession = {
    execute(code: string): AsyncIterable<KernelEvent> {
      void code;
      return makeAsyncIterable(events);
    },
    interrupt: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  };
  return {
    id: 'mock-pyodide',
    capabilities: { libraries: [], gpu: false, persistentState: true },
    startSession: () => Promise.resolve(session),
  };
}

/**
 * `findByText` normalizes whitespace + does not match strings containing newlines.
 * Output entries (`<pre data-stream="...">`) often contain trailing `\n`, so we
 * poll the DOM directly for the entry's textContent prefix instead.
 */
async function waitForOutputEntry(
  container: HTMLElement,
  stream: string,
  textPrefix: string,
): Promise<HTMLElement> {
  return waitFor(() => {
    const entries = container.querySelectorAll(
      `.skb-jupyter-output pre[data-stream="${stream}"]`,
    );
    for (const entry of entries) {
      if ((entry.textContent ?? '').startsWith(textPrefix)) {
        return entry as HTMLElement;
      }
    }
    throw new Error(
      `no output entry stream=${stream} startsWith=${JSON.stringify(textPrefix)}`,
    );
  });
}

describe('jupyterUiDefault registration shape', () => {
  it('exposes BlockUIDefinition shape with coreName + uiId="default"', () => {
    expect(jupyterUiDefault.coreName).toBe(jupyterCore.name);
    expect(jupyterUiDefault.coreName).toBe('jupyter');
    expect(jupyterUiDefault.uiId).toBe('default');
  });

  it('EditorView and RenderView identity matches Jupyter.tsx exports', () => {
    expect(jupyterUiDefault.EditorView).toBe(JupyterEditorView);
    expect(jupyterUiDefault.RenderView).toBe(JupyterRenderView);
  });

  it('JUPYTER_TOKENS witnesses the @skb/design-tokens ColorTokenName surface', () => {
    expect(JUPYTER_TOKENS.fgToken).toBe('fg');
    expect(JUPYTER_TOKENS.errorToken).toBe('error');
    expect(JUPYTER_TOKENS.mutedToken).toBe('muted');
    expect(JUPYTER_TOKENS.accentToken).toBe('accent');
  });
});

describe('JupyterView render', () => {
  it('renders code with line numbers when showLineNumbers is true', () => {
    const adapter = makeMockAdapter([]);
    const { container, unmount } = render(
      <JupyterView
        props={{
          code: 'a = 1\nb = 2',
          runOnLoad: false,
          showLineNumbers: true,
          libraries: [],
        }}
        adapter={adapter}
      />,
    );
    const linenos = container.querySelectorAll('.skb-jupyter-lineno');
    expect(linenos).toHaveLength(2);
    expect(linenos[0]?.textContent).toBe('1');
    expect(linenos[1]?.textContent).toBe('2');
    unmount();
  });

  it('renders code without line numbers when showLineNumbers is false', () => {
    const adapter = makeMockAdapter([]);
    const { container, unmount } = render(
      <JupyterView
        props={{
          code: 'x',
          runOnLoad: false,
          showLineNumbers: false,
          libraries: [],
        }}
        adapter={adapter}
      />,
    );
    expect(container.querySelectorAll('.skb-jupyter-lineno')).toHaveLength(0);
    expect(container.querySelector('code')?.textContent).toBe('x');
    unmount();
  });

  it('exposes data-block="jupyter" + initial data-phase="idle" before kernel boot', () => {
    const adapter = makeMockAdapter([]);
    const { container, unmount } = render(
      <JupyterView
        props={{
          code: 'x',
          runOnLoad: false,
          showLineNumbers: true,
          libraries: [],
        }}
        adapter={adapter}
      />,
    );
    const root = container.querySelector('[data-block="jupyter"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-phase')).toBe('idle');
    unmount();
  });

  it('shows Run button labeled "Run" by default and aria-label="Run cell"', () => {
    const adapter = makeMockAdapter([]);
    const { getByRole, unmount } = render(
      <JupyterView
        props={{
          code: 'x',
          runOnLoad: false,
          showLineNumbers: true,
          libraries: [],
        }}
        adapter={adapter}
      />,
    );
    const button = getByRole('button', { name: 'Run cell' });
    expect(button.textContent).toBe('Run');
    unmount();
  });

  it('runs code on mount when runOnLoad=true and renders stdout output', async () => {
    const events: KernelEvent[] = [
      { type: 'status', state: 'busy' },
      { type: 'stdout', text: 'hello\n' },
      { type: 'status', state: 'idle' },
    ];
    const adapter = makeMockAdapter(events);
    const { container, unmount } = render(
      <JupyterView
        props={{
          code: 'print("hello")',
          runOnLoad: true,
          showLineNumbers: true,
          libraries: [],
        }}
        adapter={adapter}
      />,
    );
    const stdout = await waitForOutputEntry(container, 'stdout', 'hello');
    expect(stdout).not.toBeNull();
    await waitFor(() => {
      const root = container.querySelector('[data-block="jupyter"]');
      expect(root?.getAttribute('data-phase')).toBe('finished');
    });
    unmount();
  });

  it('renders execError phase when error event arrives', async () => {
    const events: KernelEvent[] = [
      { type: 'status', state: 'busy' },
      {
        type: 'error',
        ename: 'ZeroDivisionError',
        evalue: 'division by zero',
        traceback: ['line 1: 1/0'],
      },
      { type: 'status', state: 'idle' },
    ];
    const adapter = makeMockAdapter(events);
    const { container, unmount } = render(
      <JupyterView
        props={{
          code: '1/0',
          runOnLoad: true,
          showLineNumbers: false,
          libraries: [],
        }}
        adapter={adapter}
      />,
    );
    const errEntry = await waitForOutputEntry(container, 'error', 'ZeroDivisionError');
    expect(errEntry.textContent).toContain('division by zero');
    await waitFor(() => {
      const root = container.querySelector('[data-block="jupyter"]');
      expect(root?.getAttribute('data-phase')).toBe('execError');
    });
    unmount();
  });

  it('clears prior output when Run is clicked again', async () => {
    let events: KernelEvent[] = [
      { type: 'status', state: 'busy' },
      { type: 'stdout', text: 'first run\n' },
      { type: 'status', state: 'idle' },
    ];
    let runCount = 0;
    const session: KernelSession = {
      execute(code: string): AsyncIterable<KernelEvent> {
        void code;
        runCount++;
        return makeAsyncIterable(events);
      },
      interrupt: () => Promise.resolve(),
      shutdown: () => Promise.resolve(),
    };
    const adapter: KernelAdapter = {
      id: 'mock-pyodide',
      capabilities: { libraries: [], gpu: false, persistentState: true },
      startSession: () => Promise.resolve(session),
    };
    const { container, getByRole, unmount } = render(
      <JupyterView
        props={{
          code: 'print(1)',
          runOnLoad: true,
          showLineNumbers: false,
          libraries: [],
        }}
        adapter={adapter}
      />,
    );
    await waitForOutputEntry(container, 'stdout', 'first run');
    events = [
      { type: 'status', state: 'busy' },
      { type: 'stdout', text: 'second run\n' },
      { type: 'status', state: 'idle' },
    ];
    await act(async () => {
      getByRole('button', { name: 'Run cell' }).click();
      await Promise.resolve();
    });
    await waitForOutputEntry(container, 'stdout', 'second run');
    // first-run output was cleared on reset
    const stdoutEntries = container.querySelectorAll(
      '.skb-jupyter-output pre[data-stream="stdout"]',
    );
    expect(stdoutEntries).toHaveLength(1);
    expect(runCount).toBe(2);
    unmount();
  });
});
