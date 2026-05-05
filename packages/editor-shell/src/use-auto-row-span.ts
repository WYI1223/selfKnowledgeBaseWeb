import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * ADR-0016 D3 auto-rowSpan hook.
 *
 * Markdown `rowSpan="auto"` is rendering-derived: the host measures
 * `scrollHeight`, inverts the grid row formula from ADR-0016 D4, and returns
 * an integer rowSpan without committing persistent document state. Defaults
 * match the scoped grid CSS variables from ADR-0016 D5: `--row-h: 48px` and
 * `--gap: 14px`.
 */
export function computeRowSpan(scrollHeight: number, rowHeightPx = 48, gapPx = 14): number {
  const rowUnit = rowHeightPx + gapPx;
  if (rowUnit <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil((scrollHeight + gapPx) / rowUnit));
}

type FontReadyDocument = Document & {
  fonts?: {
    ready?: Promise<unknown>;
  };
};

function getFontsReady(): Promise<unknown> | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return (document as FontReadyDocument).fonts?.ready;
}

export function useAutoRowSpan(
  contentRef: RefObject<HTMLElement | null>,
  rowHeightPx = 48,
  gapPx = 14,
): number {
  const [rowSpan, setRowSpan] = useState(1);
  const lastRowSpanRef = useRef(1);
  const firstRoFiredRef = useRef(false);
  const pendingFrameRef = useRef<number | null>(null);
  const pendingRowSpanRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    mountedRef.current = true;
    firstRoFiredRef.current = false;
    pendingRowSpanRef.current = null;

    const commitRowSpan = (nextRowSpan: number): void => {
      if (!mountedRef.current) {
        return;
      }
      if (Math.abs(nextRowSpan - lastRowSpanRef.current) < 1) {
        return;
      }
      lastRowSpanRef.current = nextRowSpan;
      setRowSpan(nextRowSpan);
    };

    const scheduleRowSpan = (nextRowSpan: number): void => {
      if (!mountedRef.current) {
        return;
      }
      if (!firstRoFiredRef.current) {
        firstRoFiredRef.current = true;
        commitRowSpan(nextRowSpan);
        return;
      }

      pendingRowSpanRef.current = nextRowSpan;
      if (pendingFrameRef.current !== null) {
        return;
      }

      pendingFrameRef.current = requestAnimationFrame(() => {
        pendingFrameRef.current = null;
        const pendingRowSpan = pendingRowSpanRef.current;
        pendingRowSpanRef.current = null;
        if (pendingRowSpan !== null) {
          commitRowSpan(pendingRowSpan);
        }
      });
    };

    const measureElement = (): void => {
      scheduleRowSpan(computeRowSpan(el.scrollHeight, rowHeightPx, gapPx));
    };

    const ro = new ResizeObserver((entries) => {
      const target = entries[0]?.target;
      const scrollHeight = target instanceof HTMLElement ? target.scrollHeight : el.scrollHeight;
      scheduleRowSpan(computeRowSpan(scrollHeight, rowHeightPx, gapPx));
    });

    ro.observe(el);
    void getFontsReady()?.then(measureElement);

    return () => {
      mountedRef.current = false;
      if (pendingFrameRef.current !== null) {
        cancelAnimationFrame(pendingFrameRef.current);
        pendingFrameRef.current = null;
      }
      pendingRowSpanRef.current = null;
      ro.disconnect();
    };
  }, [contentRef, rowHeightPx, gapPx]);

  return rowSpan;
}
