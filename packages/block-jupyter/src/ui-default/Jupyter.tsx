import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { BlockViewProps } from '@skb/block-foundation';
import type { KernelAdapter, KernelEvent } from '@skb/kernel-adapter';
import { PyodideAdapter } from '@skb/kernel-pyodide';
import { jupyterCore } from '../core/core-definition';
import { createKernelBridge, type KernelBridge, type KernelPhase } from './kernel-bridge';

/**
 * JupyterView — Tiptap NodeView for `kind='viz'` jupyter cell. Renders
 *   - editable code textarea (line-numbered when `showLineNumbers`)
 *   - status indicator driven by KernelPhase
 *   - Run button (gated on phase ∈ {ready, finished, execError, kernelError})
 *   - output panel: stdout/stderr stream + execute_result + display_data
 *
 * `optionalAdapter` lets tests inject a fake KernelAdapter; production code
 * leaves it undefined and a per-mount PyodideAdapter is constructed (lazy
 * — startSession is not called until either runOnLoad or user click).
 *
 * Mirrors MathView's "no explicit BlockUIDefinition<typeof ...> annotation"
 * pattern (ADR-0003 inference rule; see math.ui.ts comment).
 */

interface OutputState {
  readonly entries: ReadonlyArray<{
    readonly id: number;
    readonly stream: 'stdout' | 'stderr' | 'result' | 'display' | 'error';
    readonly text: string;
  }>;
  readonly nextId: number;
}

const EMPTY_OUTPUT: OutputState = { entries: [], nextId: 0 };

type OutputAction = { type: 'append'; event: KernelEvent } | { type: 'reset' };

function outputReducer(state: OutputState, action: OutputAction): OutputState {
  if (action.type === 'reset') return EMPTY_OUTPUT;
  const event = action.event;
  if (event.type === 'stdout' || event.type === 'stderr') {
    return {
      entries: [
        ...state.entries,
        { id: state.nextId, stream: event.type, text: event.text },
      ],
      nextId: state.nextId + 1,
    };
  }
  if (event.type === 'execute_result' || event.type === 'display_data') {
    const text = formatMime(event.data);
    return {
      entries: [
        ...state.entries,
        {
          id: state.nextId,
          stream: event.type === 'execute_result' ? 'result' : 'display',
          text,
        },
      ],
      nextId: state.nextId + 1,
    };
  }
  if (event.type === 'error') {
    const text = `${event.ename}: ${event.evalue}\n${event.traceback.join('\n')}`;
    return {
      entries: [
        ...state.entries,
        { id: state.nextId, stream: 'error', text },
      ],
      nextId: state.nextId + 1,
    };
  }
  return state;
}

function formatMime(data: Record<string, unknown>): string {
  const text = data['text/plain'];
  if (typeof text === 'string') return text;
  return JSON.stringify(data);
}

export interface JupyterViewProps
  extends BlockViewProps<typeof jupyterCore.propsSchema> {
  /** Override the adapter (test injection). */
  readonly adapter?: KernelAdapter;
}

export function JupyterView({ props, adapter }: JupyterViewProps): JSX.Element {
  const [phase, setPhase] = useReducer(
    (_prev: KernelPhase, next: KernelPhase) => next,
    { type: 'idle' } as KernelPhase,
  );
  const [output, dispatchOutput] = useReducer(outputReducer, EMPTY_OUTPUT);
  const bridgeRef = useRef<KernelBridge | null>(null);
  const codeRef = useRef(props.code);
  codeRef.current = props.code;

  const adapterRef = useRef<KernelAdapter | null>(null);
  if (adapterRef.current === null) {
    adapterRef.current = adapter ?? new PyodideAdapter({ boot: { libraries: props.libraries } });
  }
  const liveAdapter = adapterRef.current;
  const runOnLoadAtMount = useRef(props.runOnLoad);

  useEffect(() => {
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter: liveAdapter,
      sessionId: `jupyter-${cryptoRandomId()}`,
      signal: controller.signal,
      onPhase: setPhase,
      onEvent: (event) => dispatchOutput({ type: 'append', event }),
    });
    bridgeRef.current = bridge;
    if (runOnLoadAtMount.current) {
      void bridge.run(codeRef.current);
    }
    return () => {
      controller.abort();
      bridgeRef.current = null;
    };
  }, [liveAdapter]);

  const onRun = useCallback(() => {
    dispatchOutput({ type: 'reset' });
    void bridgeRef.current?.run(props.code);
  }, [props.code]);

  const lines = useMemo(() => splitLines(props.code), [props.code]);

  const runDisabled =
    phase.type === 'starting' || phase.type === 'running';
  const statusLabel = describePhase(phase);

  return (
    <div data-block="jupyter" data-phase={phase.type}>
      <div className="skb-jupyter-toolbar">
        <button
          type="button"
          className="skb-jupyter-run"
          onClick={onRun}
          disabled={runDisabled}
          aria-label="Run cell"
        >
          {phase.type === 'running' ? 'Running…' : 'Run'}
        </button>
        <span className="skb-jupyter-status" role="status">
          {statusLabel}
        </span>
      </div>
      <pre
        className="skb-jupyter-code"
        data-line-numbers={props.showLineNumbers ? 'true' : 'false'}
      >
        {props.showLineNumbers ? (
          lines.map((line, i) => (
            <span key={i} className="skb-jupyter-line">
              <span className="skb-jupyter-lineno" aria-hidden="true">
                {i + 1}
              </span>
              <code>{line}</code>
            </span>
          ))
        ) : (
          <code>{props.code}</code>
        )}
      </pre>
      {output.entries.length > 0 && (
        <div className="skb-jupyter-output" aria-live="polite">
          {output.entries.map((entry) => (
            <pre key={entry.id} data-stream={entry.stream}>
              {entry.text}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}

function describePhase(phase: KernelPhase): string {
  switch (phase.type) {
    case 'idle':
      return 'Idle';
    case 'starting':
      return 'Loading kernel…';
    case 'ready':
      return 'Ready';
    case 'running':
      return 'Running';
    case 'finished':
      return 'Finished';
    case 'execError':
      return `Error: ${phase.ename}`;
    case 'kernelError':
      return `Kernel error: ${phase.message}`;
  }
}

function splitLines(code: string): string[] {
  if (code === '') return [''];
  return code.split('\n');
}

function cryptoRandomId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export const JupyterEditorView = JupyterView;
export const JupyterRenderView = JupyterView;
