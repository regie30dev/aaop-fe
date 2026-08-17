import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useAnimatedClose } from "../../../hooks/useAnimatedClose";
import { getErrorMessage } from "../../../utils/errors";
import { Spinner } from "../Spinner/Spinner";
import { SelectField } from "../SelectField/SelectField";
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
  | "select"
  | "textarea"
  | "checkbox";

export interface ModalField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Options for a `select` field. `image` shows a thumbnail for the selection. */
  options?: { value: string; label: string; image?: string }[];
  /** For a `select` field: show a filter box to search long option lists. */
  searchable?: boolean;
  /** For a `select` field: allow choosing multiple options (comma-joined value). */
  multiple?: boolean;
  /** Placeholder artwork for a `file` field (defaults to the person icon). */
  image?: string;
  /** Render read-only (e.g. contextual info that the BE won't accept changes to). */
  disabled?: boolean;
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
  /** Widen the modal (e.g. to fit a two-column multi-select). */
  size?: "default" | "wide";
  /** Read-only view: every field is disabled and only a "Close" button shows. */
  readOnly?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  /**
   * Optional uploader for `file` fields. When provided, a picked file is
   * uploaded on submit and its returned URL is passed to `onSubmit` as the
   * field's string value (e.g. values.picture = "https://…").
   */
  uploadFile?: (file: File) => Promise<string>;
  /**
   * Optional secondary submit button (e.g. "Create ×N"). It validates and
   * collects the same values as the primary submit, then calls `onSubmit`.
   * `countField` names a numeric field whose live value feeds `label(count)`.
   */
  extraAction?: {
    countField?: string;
    label: (count: number) => string;
    onSubmit: (values: Record<string, string>) => void | Promise<void>;
  };
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
  readOnly,
}: {
  field: ModalField;
  initialUrl?: string;
  readOnly?: boolean;
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
  // the field's placeholder artwork. Only `preview` is an object URL to revoke.
  const shownPhoto = preview ?? (initialUrl || null);
  const placeholder = field.image ?? uploadPhoto;

  return (
    <div className={styles.fileField}>
      <button
        type="button"
        className={styles.photoButton}
        onClick={() => !readOnly && inputRef.current?.click()}
        disabled={readOnly}
        aria-label={field.label}
        title={field.label}
      >
        <img
          className={`${styles.photo} ${shownPhoto ? styles.photoFilled : ""}`}
          src={shownPhoto ?? placeholder}
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
  size = "default",
  readOnly = false,
  onClose,
  onSubmit,
  uploadFile,
  extraAction,
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
  // Live value of the extra action's count field, for its button label.
  const [extraCount, setExtraCount] = useState(() => {
    const raw = extraAction?.countField
      ? initial?.[extraAction.countField]
      : undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 1;
  });

  // File fields (e.g. Upload Picture) are pinned to the modal's upper-right
  // corner; everything else flows down the form in order.
  const fileFields = fields.filter((field) => field.type === "file");
  // Checkboxes render next to the generated field (top of the form); everything
  // else that isn't a file flows down in order.
  const checkboxFields = fields.filter((field) => field.type === "checkbox");
  const flowFields = fields.filter(
    (field) => field.type !== "file" && field.type !== "checkbox",
  );

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

  // Collect the non-file field values from the form.
  const buildValues = (data: FormData): Record<string, string> => {
    const values: Record<string, string> = {};
    if (generated) values[generated.name] = generated.value;
    for (const field of fields) {
      if (field.type === "file") continue; // handled separately below
      if (field.type === "checkbox") {
        // Unchecked boxes are absent from FormData; normalize to "true"/"false".
        values[field.name] = data.get(field.name) != null ? "true" : "false";
        continue;
      }
      values[field.name] = String(data.get(field.name) ?? "");
    }
    return values;
  };

  // Upload any picked file(s), writing each returned URL onto its field value.
  const applyUploads = async (data: FormData, values: Record<string, string>) => {
    if (!uploadFile) return;
    for (const field of fileFields) {
      const picked = data.get(field.name);
      if (picked instanceof File && picked.size > 0) {
        values[field.name] = await uploadFile(picked);
      }
    }
  };

  // Shared submit runner: collect values, upload files, hand off, then close.
  const runSubmit = async (
    handler: (values: Record<string, string>) => void | Promise<void>,
  ) => {
    if (submitting || !formRef.current) return;
    const data = new FormData(formRef.current);
    const values = buildValues(data);
    setError(null);
    setSubmitting(true);
    try {
      await applyUploads(data, values);
      await handler(values);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong."));
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSubmit(onSubmit);
  };

  // Secondary action (e.g. "Create ×N"): validate the native form first, then
  // run the same collect/upload path against the extra handler.
  const runExtra = () => {
    if (!extraAction || !formRef.current) return;
    if (!formRef.current.reportValidity()) return;
    void runSubmit(extraAction.onSubmit);
  };

  // Keep the extra button's count label in sync with its field as it's typed.
  const handleFormInput = (event: FormEvent<HTMLFormElement>) => {
    if (!extraAction?.countField) return;
    const target = event.target as HTMLInputElement;
    if (target?.name !== extraAction.countField) return;
    const n = Number(target.value);
    setExtraCount(Number.isFinite(n) && n > 0 ? n : 1);
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

  const checkboxGroup =
    checkboxFields.length > 0 ? (
      <div className={styles.checkboxGroup}>
        {checkboxFields.map((field) => (
          <label key={field.name} className={styles.checkboxField}>
            <input
              id={field.name}
              name={field.name}
              className={styles.checkbox}
              type="checkbox"
              value="true"
              defaultChecked={initial?.[field.name] === "true"}
              disabled={field.disabled || readOnly}
            />
            <span>{field.label}</span>
          </label>
        ))}
      </div>
    ) : null;

  return createPortal(
    <div className={`${styles.backdrop} ${closing ? styles.backdropClosing : ""}`}>
      <form
        ref={formRef}
        className={`${styles.card} ${size === "wide" ? styles.cardWide : ""} ${
          closing ? styles.cardClosing : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onInput={handleFormInput}
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
            <div className={styles.topRowMain}>
              {generatedField}
              {checkboxGroup}
            </div>
            <div className={styles.fileCorner}>
              {fileFields.map((field) => (
                <PhotoField
                  key={field.name}
                  field={field}
                  initialUrl={initial?.[field.name]}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {generatedField}
            {checkboxGroup}
          </>
        )}

        {flowFields.map((field) => (
          <div className={styles.field} key={field.name}>
            <Label htmlFor={field.name} required={field.required}>
              {field.label}
            </Label>
            {field.type === "select" ? (
              <SelectField
                id={field.name}
                name={field.name}
                options={field.options ?? []}
                defaultValue={initial?.[field.name] ?? ""}
                placeholder={field.placeholder}
                required={field.required}
                disabled={field.disabled || readOnly}
                searchable={field.searchable}
                multiple={field.multiple}
              />
            ) : field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                className={`${styles.input} ${styles.textarea}`}
                rows={3}
                placeholder={field.placeholder}
                defaultValue={initial?.[field.name] ?? ""}
                required={field.required}
                disabled={field.disabled || readOnly}
              />
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
                disabled={field.disabled || readOnly}
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
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && extraAction && (
            <button
              type="button"
              className={styles.extra}
              onClick={runExtra}
              disabled={submitting}
            >
              {extraAction.label(extraCount)}
            </button>
          )}
          {!readOnly && (
            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting && <Spinner />}
              {submitting ? pendingLabel : submitLabel}
            </button>
          )}
        </div>
      </form>
    </div>,
    document.body,
  );
}
