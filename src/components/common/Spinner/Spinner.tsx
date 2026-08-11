import styles from "./Spinner.module.css";

interface SpinnerProps {
  /** Diameter in px. */
  size?: number;
}

/**
 * Shared loading spinner. Inherits the current text color (`currentColor`), so
 * it reads correctly on any button/surface. One definition = consistent
 * loading indicator across FormModal, ConfirmDialog, etc.
 */
export function Spinner({ size = 15 }: SpinnerProps) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
