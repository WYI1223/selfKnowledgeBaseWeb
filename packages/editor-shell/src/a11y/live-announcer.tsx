/**
 * @skb/editor-shell <LiveAnnouncer/> — shared aria-live="polite"
 * region for cf-22 keyboard/screen-reader status messages.
 *
 * Wave 6 cf-22 (2026-05-09) — single shared element rendered ONCE
 * at the editor mount level (per cf-22 D6 decision). All pipelines
 * (drag / resize / kebab) push messages via the `useAnnounce()`
 * hook + React context. The announcer maintains a 100ms quiet
 * window so rapid arrow-key spam during keyboard-drag/keyboard-
 * resize doesn't flood AT — only the LATEST message after 100ms
 * of silence is rendered.
 *
 * Per WCAG 4.1.3 (Status Messages, Level AA): "Status messages can
 * be programmatically determined through role or properties such
 * that they can be presented to the user by assistive technologies
 * without receiving focus." `aria-live="polite"` + `aria-atomic="true"`
 * is the canonical implementation — the entire region is re-read
 * by AT each time its contents change, after the current AT speech
 * finishes (NOT interrupting).
 *
 * Visual: the region is `sr-only` (screen-reader-only) — visually
 * hidden via the standard sr-only class but reachable by AT. cf-22
 * inlines the sr-only styles to avoid depending on a tailwind utility
 * (the apps/site Tailwind config doesn't import @tailwindcss/forms
 * which provides .sr-only by default; we ship our own).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

const ANNOUNCE_THROTTLE_MS = 100;

export interface LiveAnnouncerContextValue {
  readonly announce: (message: string) => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(
  null,
);

export interface LiveAnnouncerProps {
  readonly children?: ReactNode;
}

/**
 * Mount once at the editor root. Provides `useAnnounce` context to
 * descendants and renders a single sr-only region whose textContent
 * is announced by AT.
 *
 * # cf-24 R2 — LEADING-EDGE throttle (2026-05-10)
 *
 * Pre-cf-24-R2 used pure trailing-edge throttling: every announce()
 * scheduled a setTimeout(100ms) that commits the LATEST message after
 * the timer fires. That works for arrow-key spam during keyboard-drag
 * (last-position-wins; correct UX). It FAILS for one-shot discrete
 * actions (palette click → insert → announce; AT user expects the
 * message immediately, not after 100ms of "silence detection"). cf-24
 * AC3-7 surfaced this as Playwright textContent-poll flake (the test
 * polls every 100ms; if the throttle setTimeout collides with the
 * test's polling interval, the message's setMessage commit gets
 * delayed enough to look like "no announce ever fired" within a
 * 5-second test budget).
 *
 * Fix: LEADING-EDGE in a quiet period — first announce commits
 * SYNCHRONOUSLY (no setTimeout). Subsequent announces within
 * ANNOUNCE_THROTTLE_MS still throttle to last-wins via the trailing
 * timer (preserves cf-22 keyboard-drag arrow-key spam UX). The two
 * regimes match the WCAG 4.1.3 user-intent split:
 *   - Discrete one-shot action: announce immediately
 *   - High-frequency stream: announce LATEST after a quiet window
 *
 * Implementation invariant: the FIRST announce after `timerRef.current
 * === null` (i.e. quiet period) commits synchronously via setMessage.
 * Subsequent announces within the 100ms window populate pendingRef +
 * the trailing timer eventually commits the latest pending message.
 * The trailing timer is reset on each subsequent announce (so the
 * 100ms silence window is measured from the LAST announce, not the
 * first).
 */
export function LiveAnnouncer(props: LiveAnnouncerProps): ReactElement {
  const { children } = props;
  const [message, setMessage] = useState('');
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((next: string) => {
    if (timerRef.current === null) {
      // LEADING EDGE: first announce in a quiet period — commit
      // synchronously so AT users (and Playwright's textContent
      // polls) see the message immediately, not after 100ms of
      // throttle silence detection. Open the quiet-window timer
      // so subsequent announces within 100ms throttle to last-wins.
      setMessage(next);
      pendingRef.current = null;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const final = pendingRef.current;
        pendingRef.current = null;
        // Only commit the trailing-edge pending if it differs from
        // the leading-edge message (avoid redundant re-render that
        // would re-trigger AT speech for the same content).
        if (final !== null && final !== next) setMessage(final);
      }, ANNOUNCE_THROTTLE_MS);
      return;
    }
    // TRAILING EDGE: an announce already fired in this quiet
    // window. Buffer the latest into pendingRef + reset the
    // window timer so 100ms of silence from this announce
    // commits the latest pending message.
    pendingRef.current = next;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const final = pendingRef.current;
      pendingRef.current = null;
      if (final !== null) setMessage(final);
    }, ANNOUNCE_THROTTLE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        data-skb-live-announcer=""
        className="skb-live-announcer-srOnly"
        // Inline sr-only styles so this works without any Tailwind
        // utility presence. Per WebAIM canonical sr-only recipe.
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {message}
      </div>
      <LiveAnnouncerContext.Provider value={{ announce }}>
        {children}
      </LiveAnnouncerContext.Provider>
    </>
  );
}

/**
 * Hook returning the stable `announce(message)` callback. Returns a
 * no-op when called outside `<LiveAnnouncer/>` (degraded mode for
 * stand-alone NodeView mounts in tests).
 */
export function useAnnounce(): (message: string) => void {
  const ctx = useContext(LiveAnnouncerContext);
  return ctx?.announce ?? noopAnnounce;
}

function noopAnnounce(): void {
  // intentional no-op when LiveAnnouncer is not mounted
}
