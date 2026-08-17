import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useAnimatedClose } from "../../../hooks/useAnimatedClose";
import { getErrorMessage } from "../../../utils/errors";
import { Spinner } from "../Spinner/Spinner";
import styles from "./ConfirmDialog.module.css";

// Keep in sync with the exit animation duration in ConfirmDialog.module.css.
const EXIT_DURATION_MS = 220;

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  /** "danger" (red, default) for destructive actions, "primary" (blue) otherwise. */
  confirmVariant?: "danger" | "primary";
  /** Focus the confirm button on open so Enter triggers it. */
  autoFocusConfirm?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  autoFocusConfirm = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { closing, close } = useAnimatedClose(onClose, EXIT_DURATION_MS, {
    captureEsc: true,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (autoFocusConfirm) confirmRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [autoFocusConfirm]);

  const handleConfirm = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await onConfirm();
      close();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong."));
      setPending(false);
    }
  };

  return createPortal(
    <div
      className={`${styles.backdrop} ${closing ? styles.backdropClosing : ""}`}
      onClick={() => {
        if (!pending) close();
      }}
    >
      <div
        className={`${styles.card} ${closing ? styles.cardClosing : ""}`}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.iconWrap}>
          <AlertTriangle size={22} />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.message}>{message}</div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={close}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`${styles.confirm} ${
              confirmVariant === "primary" ? styles.confirmPrimary : ""
            }`}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending && <Spinner />}
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
