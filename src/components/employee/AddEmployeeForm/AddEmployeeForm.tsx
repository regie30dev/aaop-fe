import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ReactNode } from "react";
import { useAnimatedClose } from "../../../hooks/useAnimatedClose";
import type { NewEmployee } from "../../../types";
import styles from "./AddEmployeeForm.module.css";

// Keep in sync with the exit animation duration in AddEmployeeForm.module.css.
const EXIT_DURATION_MS = 320;

interface EmployeeFormInitial {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  position?: string;
  office?: string;
  email?: string;
}

interface AddEmployeeFormProps {
  employeeNo: string;
  mode?: "add" | "edit";
  initial?: EmployeeFormInitial;
  onClose: () => void;
  onSubmit?: (employee: NewEmployee) => void | Promise<void>;
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className={styles.label} htmlFor={htmlFor}>
      {children}
      {required && <span className={styles.req}>*</span>}
    </label>
  );
}

export function AddEmployeeForm({
  employeeNo,
  mode = "add",
  initial,
  onClose,
  onSubmit,
}: AddEmployeeFormProps) {
  const isEdit = mode === "edit";
  const { closing, close: handleClose } = useAnimatedClose(
    onClose,
    EXIT_DURATION_MS,
    { captureEsc: true },
  );

  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock background scroll, focus the first field, and trap Tab focus.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstField =
      formRef.current?.querySelector<HTMLElement>("input:not([disabled])");
    firstField?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab" || !formRef.current) return;
    const focusables = Array.from(
      formRef.current.querySelectorAll<HTMLElement>(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    const payload: NewEmployee = {
      employeeNo, // disabled field: taken from the generated prop, not FormData
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      middleName: String(data.get("middleName") ?? ""),
      dateOfBirth: String(data.get("dateOfBirth") ?? ""),
      position: String(data.get("position") ?? ""),
      office: String(data.get("office") ?? ""),
      email: String(data.get("email") ?? "") || undefined,
      picture: (data.get("picture") as File) ?? null,
    };
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit?.(payload);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employee.");
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className={`${styles.backdrop} ${closing ? styles.backdropClosing : ""}`}>
      <form
        ref={formRef}
        className={`${styles.card} ${closing ? styles.cardClosing : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-employee-title"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      >
        <h2 id="add-employee-title" className={styles.title}>
          {isEdit ? "Edit Employee" : "Add New Employee"}
        </h2>

        <div className={styles.field}>
          <Label htmlFor="employeeNo">Employee No.</Label>
          <input
            id="employeeNo"
            name="employeeNo"
            className={styles.input}
            type="text"
            value={employeeNo}
            disabled
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="lastName" required>
            Last Name
          </Label>
          <input
            id="lastName"
            name="lastName"
            className={styles.input}
            type="text"
            placeholder="Enter Last Name"
            defaultValue={initial?.lastName ?? ""}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="firstName" required>
            First Name
          </Label>
          <input
            id="firstName"
            name="firstName"
            className={styles.input}
            type="text"
            placeholder="Enter First Name"
            defaultValue={initial?.firstName ?? ""}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="middleName" required>
            Middle Name
          </Label>
          <input
            id="middleName"
            name="middleName"
            className={styles.input}
            type="text"
            placeholder="Enter Middle Name"
            defaultValue={initial?.middleName ?? ""}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="dateOfBirth" required>
            Date of Birth
          </Label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            className={styles.input}
            type="date"
            placeholder="Select Date of Birth"
            defaultValue={initial?.dateOfBirth ?? ""}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="position" required>
            Position
          </Label>
          <input
            id="position"
            name="position"
            className={styles.input}
            type="text"
            placeholder="Enter Position"
            defaultValue={initial?.position ?? ""}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="office" required>
            Office
          </Label>
          <input
            id="office"
            name="office"
            className={styles.input}
            type="text"
            placeholder="Enter Office"
            defaultValue={initial?.office ?? ""}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="email">Email</Label>
          <input
            id="email"
            name="email"
            className={styles.input}
            type="email"
            placeholder="Enter Email"
            defaultValue={initial?.email ?? ""}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="picture">Upload Picture</Label>
          <input
            id="picture"
            name="picture"
            className={styles.file}
            type="file"
            accept="image/*"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submit}
            disabled={submitting}
          >
            {submitting && <span className={styles.spinner} aria-hidden="true" />}
            {submitting ? "Saving…" : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
