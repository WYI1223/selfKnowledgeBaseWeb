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
 */
export function LiveAnnouncer(props: LiveAnnouncerProps): ReactElement {
  const { children } = props;
  const [message, setMessage] = useState('');
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((next: string) => {
    pendingRef.current = next;
    if (timerRef.current !== null) {
      // Reset the throttle window — only the LATEST message after
      // ANNOUNCE_THROTTLE_MS of silence wins.
      clearTimeout(timerRef.current);
    }
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
