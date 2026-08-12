import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useAnimatedClose } from "../../../hooks/useAnimatedClose";
import { getErrorMessage } from "../../../utils/errors";
import { Spinner } from "../Spinner/Spinner";
import uploadPhoto from "../../../assets/upload-photo.svg";
import styles from "./FormModal.module.css";

// Keep in sync with the exit animation duration in FormModal.module.css.
const EXIT_DURATION_MS = 320;

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "file"
  | "select";

export interface ModalField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Options for a `select` field. */
  options?: { value: string; label: string }[];
}

/** A read-only, system-generated field shown first (e.g. Employee No / Office No). */
export interface GeneratedField {
  name: string;
  label: string;
  value: string;
}

interface FormModalProps {
  title: string;
  generated?: GeneratedField;
  fields: ModalField[];
  initial?: Record<string, string>;
  submitLabel: string;
  pendingLabel?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  /**
   * Optional uploader for `file` fields. When provided, a picked file is
   * uploaded on submit and its returned URL is passed to `onSubmit` as the
   * field's string value (e.g. values.picture = "https://…").
   */
  uploadFile?: (file: File) => Promise<string>;
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

/**
 * Clickable photo uploader: shows the "Upload your photo" placeholder until an
 * image is picked, then previews the selection. Clicking the image opens the
 * native file picker (the real input is kept hidden). Pinned to the modal's
 * upper-right corner by the caller.
 */
function PhotoField({
  field,
  initialUrl,
}: {
  field: ModalField;
  initialUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Free the object URL when the preview changes or the modal unmounts.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  // A freshly-picked file wins; otherwise show the existing (edit) photo, else
  // the placeholder. Only `preview` is an object URL that needs revoking.
  const shownPhoto = preview ?? (initialUrl || null);

  return (
    <div className={styles.fileField}>
      <button
        type="button"
        className={styles.photoButton}
        onClick={() => inputRef.current?.click()}
        aria-label={field.label}
        title={field.label}
      >
        <img
          className={`${styles.photo} ${shownPhoto ? styles.photoFilled : ""}`}
          src={shownPhoto ?? uploadPhoto}
          alt={shownPhoto ? "Selected photo" : field.label}
        />
      </button>
      <input
        ref={inputRef}
        id={field.name}
        name={field.name}
        className={styles.hiddenFile}
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
    </div>
  );
}

/**
 * Generic, reusable form modal driven by a field config. Owns all the modal
 * chrome (portal, animated open/close, focus trap, scroll lock, spinner,
 * inline errors); callers supply the fields and an async `onSubmit`.
 */
export function FormModal({
  title,
  generated,
  fields,
  initial,
  submitLabel,
  pendingLabel = "Saving…",
  onClose,
  onSubmit,
  uploadFile,
}: FormModalProps) {
  // Dismiss only via the explicit X (no outside-click, no Escape).
  const { closing, close: handleClose } = useAnimatedClose(
    onClose,
    EXIT_DURATION_MS,
    { captureEsc: true, closeOnEscape: false },
  );

  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File fields (e.g. Upload Picture) are pinned to the modal's upper-right
  // corner; everything else flows down the form in order.
  const fileFields = fields.filter((field) => field.type === "file");
  const flowFields = fields.filter((field) => field.type !== "file");

  // Lock background scroll and focus the first editable field.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstField = formRef.current?.querySelector<HTMLElement>(
      "input:not([disabled]):not([type='file'])",
    );
    firstField?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Keep Tab focus inside the dialog.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab" || !formRef.current) return;
    const focusable = Array.from(
      formRef.current.querySelectorAll<HTMLElement>(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
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
    const values: Record<string, string> = {};
    if (generated) values[generated.name] = generated.value;
    for (const field of fields) {
      if (field.type === "file") continue; // handled separately below
      values[field.name] = String(data.get(field.name) ?? "");
    }
    setError(null);
    setSubmitting(true);
    try {
      // Upload any picked file(s) first; pass each resulting URL as the field value.
      if (uploadFile) {
        for (const field of fileFields) {
          const picked = data.get(field.name);
          if (picked instanceof File && picked.size > 0) {
            values[field.name] = await uploadFile(picked);
          }
        }
      }
      await onSubmit(values);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong."));
      setSubmitting(false);
    }
  };

  const titleId = "form-modal-title";

  const generatedField = generated ? (
    <div className={styles.field}>
      <Label htmlFor={generated.name}>{generated.label}</Label>
      <input
        id={generated.name}
        name={generated.name}
        className={styles.input}
        type="text"
        value={generated.value}
        disabled
      />
    </div>
  ) : null;

  return createPortal(
    <div className={`${styles.backdrop} ${closing ? styles.backdropClosing : ""}`}>
      <form
        ref={formRef}
        className={`${styles.card} ${closing ? styles.cardClosing : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={handleClose}
        >
          <X size={18} />
        </button>

        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>

        {fileFields.length > 0 ? (
          <div className={styles.topRow}>
            <div className={styles.topRowMain}>{generatedField}</div>
            <div className={styles.fileCorner}>
              {fileFields.map((field) => (
                <PhotoField
                  key={field.name}
                  field={field}
                  initialUrl={initial?.[field.name]}
                />
              ))}
            </div>
          </div>
        ) : (
          generatedField
        )}

        {flowFields.map((field) => (
          <div className={styles.field} key={field.name}>
            <Label htmlFor={field.name} required={field.required}>
              {field.label}
            </Label>
            {field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                className={styles.input}
                defaultValue={initial?.[field.name] ?? ""}
                required={field.required}
              >
                <option value="" disabled>
                  {field.placeholder ?? "Select…"}
                </option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                name={field.name}
                className={styles.input}
                type={field.type ?? "text"}
                step={field.type === "number" ? "any" : undefined}
                placeholder={field.placeholder}
                defaultValue={initial?.[field.name] ?? ""}
                required={field.required}
              />
            )}
          </div>
        ))}

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
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting && <Spinner />}
            {submitting ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
