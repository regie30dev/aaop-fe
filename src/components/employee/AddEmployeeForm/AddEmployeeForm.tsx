import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ReactNode } from "react";
import { useAnimatedClose } from "../../../hooks/useAnimatedClose";
import type { NewEmployee } from "../../../types";
import styles from "./AddEmployeeForm.module.css";

// Keep in sync with the exit animation duration in AddEmployeeForm.module.css.
const EXIT_DURATION_MS = 320;

interface AddEmployeeFormProps {
  employeeNo: string;
  onClose: () => void;
  onSubmit?: (employee: NewEmployee) => void;
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
  onClose,
  onSubmit,
}: AddEmployeeFormProps) {
  const { closing, close: handleClose } = useAnimatedClose(
    onClose,
    EXIT_DURATION_MS,
    { captureEsc: true },
  );

  const formRef = useRef<HTMLFormElement>(null);

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit?.({
      employeeNo, // disabled field: taken from the generated prop, not FormData
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      middleName: String(data.get("middleName") ?? ""),
      dateOfBirth: String(data.get("dateOfBirth") ?? ""),
      position: String(data.get("position") ?? ""),
      office: String(data.get("office") ?? ""),
      email: String(data.get("email") ?? "") || undefined,
      picture: (data.get("picture") as File) ?? null,
    });
    handleClose();
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
          Add New Employee
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
          <Label htmlFor="firstName" required>
            First Name
          </Label>
          <input
            id="firstName"
            name="firstName"
            className={styles.input}
            type="text"
            placeholder="Enter First Name"
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

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submit}>
            Save
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
