import { useEffect, useRef, useState } from "react";

interface Options {
  /** Listen for Escape in the capture phase and stopImmediatePropagation,
   *  so a nested modal closes only itself (not a modal behind it). */
  captureEsc?: boolean;
  /** Whether pressing Escape closes the surface. Default true. Set false when
   *  the surface must only be dismissed by an explicit control (e.g. an X). */
  closeOnEscape?: boolean;
}

/**
 * Shared open/animate/close lifecycle for modal-like surfaces.
 * Returns `closing` (drive the exit animation class) and `close` (start it).
 * After `exitMs`, `onClose` is invoked to unmount. Also closes on Escape.
 */
export function useAnimatedClose(
  onClose: () => void,
  exitMs: number,
  opts?: Options,
) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, exitMs);
  };

  useEffect(() => {
    if (opts?.closeOnEscape === false) return;
    const capture = opts?.captureEsc ?? false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (capture) event.stopImmediatePropagation();
      close();
    };
    window.addEventListener("keydown", onKeyDown, capture);
    return () => window.removeEventListener("keydown", onKeyDown, capture);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { closing, close };
}
