import { useEffect } from 'react';
import type { RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { computeRowSpan, useAutoRowSpan } from '../use-auto-row-span';

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];

  readonly disconnect = vi.fn();
  readonly unobserve = vi.fn();
  private readonly callback: ResizeObserverCallback;
  private target: HTMLElement | null = null;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    TestResizeObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.target = target as HTMLElement;
  }

  emit(scrollHeight: number): void {
    if (!this.target) {
      throw new Error('ResizeObserver target was not observed');
    }
    setScrollHeight(this.target, scrollHeight);
    this.callback(
      [{ target: this.target } as unknown as ResizeObserverEntry],
      this,
    );
  }
}

let rafCallbacks: Map<number, FrameRequestCallback>;

function installAnimationFrame(): void {
  let nextFrameId = 0;
  rafCallbacks = new Map();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    nextFrameId += 1;
    rafCallbacks.set(nextFrameId, callback);
    return nextFrameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (frameId: number): void => {
    rafCallbacks.delete(frameId);
  });
}

function flushAnimationFrames(): void {
  const callbacks = [...rafCallbacks.values()];
  rafCallbacks.clear();
  for (const callback of callbacks) {
    callback(0);
  }
}

function setScrollHeight(element: HTMLElement, scrollHeight: number): void {
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  });
}

function stubFontsReady(ready: Promise<unknown>): void {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { ready },
  });
}

function createContentRef(): RefObject<HTMLElement | null> {
  return { current: document.createElement('div') };
}

function getObserver(): TestResizeObserver {
  const observer = TestResizeObserver.instances[0];
  if (!observer) {
    throw new Error('ResizeObserver was not created');
  }
  return observer;
}

function renderTrackedAutoRowSpan(ref: RefObject<HTMLElement | null>) {
  const transitions: number[] = [];
  const rendered = renderHook(() => {
    const rowSpan = useAutoRowSpan(ref);
    useEffect(() => {
      transitions.push(rowSpan);
    }, [rowSpan]);
    return rowSpan;
  });
  return { ...rendered, transitions };
}

beforeEach(() => {
  TestResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
  installAnimationFrame();
  stubFontsReady(Promise.resolve(undefined));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useAutoRowSpan empty content', () => {
  it('returns 1 for empty content on the first observer measurement', () => {
    const ref = createContentRef();
    const { result } = renderTrackedAutoRowSpan(ref);

    act(() => {
      getObserver().emit(0);
    });

    expect(result.current).toBe(1);
  });

  it('returns 1 for short single-line content', () => {
    const ref = createContentRef();
    const { result } = renderTrackedAutoRowSpan(ref);

    act(() => {
      getObserver().emit(48);
    });

    expect(result.current).toBe(1);
  });
});

describe('useAutoRowSpan computes rowSpan', () => {
  it('derives rowSpan from large scrollHeight', () => {
    const ref = createContentRef();
    const { result } = renderTrackedAutoRowSpan(ref);

    act(() => {
      getObserver().emit(358);
    });

    expect(result.current).toBe(6);
  });
});

describe('useAutoRowSpan 3-stage jitter convergence', () => {
  it('initializes immediately, coalesces one rAF window, and filters same-rowSpan noise', () => {
    const ref = createContentRef();
    const { result, transitions } = renderTrackedAutoRowSpan(ref);

    expect(result.current).toBe(1);
    expect(transitions).toEqual([1]);

    act(() => {
      getObserver().emit(60);
    });
    expect(result.current).toBe(2);

    act(() => {
      getObserver().emit(110);
      getObserver().emit(172);
    });
    expect(result.current).toBe(2);

    act(() => {
      flushAnimationFrames();
    });

    expect(result.current).toBe(3);
    expect(transitions).toEqual([1, 2, 3]);
  });

  it('ignores pixel-noise measurements that keep the same integer rowSpan', () => {
    const ref = createContentRef();
    const { result, transitions } = renderTrackedAutoRowSpan(ref);

    act(() => {
      getObserver().emit(100);
    });
    act(() => {
      getObserver().emit(105);
      flushAnimationFrames();
    });

    expect(result.current).toBe(2);
    expect(transitions).toEqual([1, 2]);
  });
});

describe('useAutoRowSpan font-loading', () => {
  it('refreshes once after document.fonts.ready resolves', async () => {
    let resolveFontsReady: (value: unknown) => void = () => {};
    const fontsReady = new Promise<unknown>((resolve) => {
      resolveFontsReady = resolve;
    });
    stubFontsReady(fontsReady);
    const ref = createContentRef();
    const { result, transitions } = renderTrackedAutoRowSpan(ref);

    act(() => {
      getObserver().emit(96);
    });
    expect(result.current).toBe(2);
    const content = ref.current;
    if (!content) {
      throw new Error('content ref was not attached');
    }
    setScrollHeight(content, 158);

    await act(async () => {
      resolveFontsReady(undefined);
      await fontsReady;
    });
    act(() => {
      flushAnimationFrames();
    });

    expect(result.current).toBe(3);
    expect(transitions).toEqual([1, 2, 3]);
  });
});

describe('useAutoRowSpan unmount cleanup', () => {
  it('disconnects ResizeObserver and ignores later observer emissions', () => {
    const ref = createContentRef();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = renderTrackedAutoRowSpan(ref);
    const observer = getObserver();

    unmount();
    observer.emit(172);
    flushAnimationFrames();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('computeRowSpan helper', () => {
  it('inverts the ADR-0016 row height formula', () => {
    expect(computeRowSpan(0, 48, 14)).toBe(1);
    expect(computeRowSpan(48, 48, 14)).toBe(1);
    expect(computeRowSpan(110, 48, 14)).toBe(2);
    expect(computeRowSpan(358, 48, 14)).toBe(6);
  });
});
