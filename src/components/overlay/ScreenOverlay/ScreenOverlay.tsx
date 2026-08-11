import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useAnimatedClose } from "../../../hooks/useAnimatedClose";
import styles from "./ScreenOverlay.module.css";

// Keep in sync with the exit animation duration in ScreenOverlay.module.css.
const EXIT_DURATION_MS = 380;

interface ScreenOverlayProps {
  title: string;
  onClose: () => void;
  children?: ReactNode;
}

export function ScreenOverlay({ title, onClose, children }: ScreenOverlayProps) {
  const { closing, close: handleClose } = useAnimatedClose(
    onClose,
    EXIT_DURATION_MS,
  );

  return (
    <div
      className={`${styles.backdrop} ${closing ? styles.backdropClosing : ""}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.panel} ${closing ? styles.panelClosing : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={handleClose}
        >
          <X size={18} />
        </button>
        {children ? (
          <div className={styles.body}>{children}</div>
        ) : (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
