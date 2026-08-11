import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import styles from "./AddEmployeeForm.module.css";

// Keep in sync with the exit animation duration in AddEmployeeForm.module.css.
const EXIT_DURATION_MS = 320;

interface AddEmployeeFormProps {
  onClose: () => void;
}

function Label({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className={styles.label}>
      {children}
      {required && <span className={styles.req}>*</span>}
    </label>
  );
}

export function AddEmployeeForm({ onClose }: AddEmployeeFormProps) {
  const [closing, setClosing] = useState(false);

  // Play the exit animation, then unmount via onClose.
  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, EXIT_DURATION_MS);
  };

  // Close on Escape.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleClose();
  };

  return (
    <div
      className={`${styles.backdrop} ${closing ? styles.backdropClosing : ""}`}
      onClick={handleClose}
    >
      <form
        className={`${styles.card} ${closing ? styles.cardClosing : ""}`}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className={styles.title}>Add New Employee</h2>

        <div className={styles.field}>
          <Label required>First Name</Label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter First Name"
          />
        </div>

        <div className={styles.field}>
          <Label required>Last Name</Label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter Last Name"
          />
        </div>

        <div className={styles.field}>
          <Label required>Middle Name</Label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter Middle Name"
          />
        </div>

        <div className={styles.field}>
          <Label required>Position</Label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter Position"
          />
        </div>

        <div className={styles.field}>
          <Label required>Office</Label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter Office"
          />
        </div>

        <div className={styles.field}>
          <Label>Email</Label>
          <input
            className={styles.input}
            type="email"
            placeholder="Enter Email"
          />
        </div>

        <div className={styles.field}>
          <Label>Upload Picture</Label>
          <input className={styles.file} type="file" accept="image/*" />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submit}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
