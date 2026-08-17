import { Check, ChevronDown, Package, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SelectField.module.css";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional thumbnail shown for the selected option (e.g. a property photo). */
  image?: string;
}

interface SelectFieldProps {
  id: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show a filter box inside the menu to search long option lists. */
  searchable?: boolean;
  /**
   * Allow selecting more than one option. Options render a checkbox, the
   * selection shows as removable chips, and the form value is the chosen
   * values joined by commas.
   */
  multiple?: boolean;
}

/**
 * Splits a label like "[PRP-00001] DESKTOP COMPUTER, Dell…" into its bracketed
 * leading tag and the remainder, so the tag can be colored independently.
 */
function splitPrefix(label: string): { prefix: string | null; rest: string } {
  // [\s\S] (not .) so a label whose description contains a line break still
  // matches — otherwise the whole prefix falls back to plain text.
  const match = label.match(/^(\[[^\]]+\])\s*([\s\S]*)$/);
  return match
    ? { prefix: match[1], rest: match[2].replace(/\s+/g, " ").trim() }
    : { prefix: null, rest: label };
}

/** Renders a label with any leading "[TAG]" colored blue. */
function OptionLabel({ label }: { label: string }) {
  const { prefix, rest } = splitPrefix(label);
  if (!prefix) return <>{label}</>;
  return (
    <>
      <span className={styles.prefix}>{prefix}</span>
      {rest ? ` ${rest}` : ""}
    </>
  );
}

/**
 * Custom listbox that mirrors the styling of the native FormModal selects but
 * renders rich option labels (so the bracketed "[PRP-00001]" tag can be blue,
 * which a native <option> can't do). A visually-hidden text input carries the
 * value into the surrounding <form> (FormData) and preserves `required`
 * browser validation.
 *
 * When `searchable`, the open menu shows a filter box that matches the typed
 * query against the whole label (number + name + description).
 *
 * When `multiple`, options show a checkbox and stay open on click so several
 * can be picked; the selection renders as removable chips and the hidden
 * input's value is the chosen values joined by commas.
 */
export function SelectField({
  id,
  name,
  options,
  defaultValue = "",
  placeholder = "Select…",
  required,
  disabled,
  searchable,
  multiple,
}: SelectFieldProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(() =>
    defaultValue ? defaultValue.split(",").filter(Boolean) : [],
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  // Single-select display (first/only value) vs. multi-select chips.
  const selectedOption =
    options.find((option) => option.value === selectedValues[0]) ?? null;
  const selectedOptions = options.filter((option) =>
    selectedSet.has(option.value),
  );
  // The value handed to the <form>: comma-joined for multiple, plain otherwise.
  const formValue = multiple ? selectedValues.join(",") : (selectedValues[0] ?? "");
  // When any option carries a photo, imageless options get a placeholder box so
  // every row stays aligned (mirrors the directory table's Photo column).
  const hasImages = options.some((option) => option.image);

  // Case-insensitive substring match across the full label.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const closeMenu = () => {
    setOpen(false);
    setQuery("");
  };

  // Close when clicking outside the widget.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // On open, highlight the current selection and focus the search box — but do
  // it ONLY on the open transition. `options` is a fresh array on every parent
  // render, so without this guard the effect would re-fire on each render (e.g.
  // after every multi-select toggle), yanking focus and the active highlight so
  // a follow-up click to deselect could land on the wrong row.
  const openedRef = useRef(false);
  useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true;
      setActive(
        options.findIndex((option) => option.value === selectedValues[0]),
      );
      if (searchable) searchRef.current?.focus();
    } else if (!open) {
      openedRef.current = false;
    }
  }, [open, options, selectedValues, searchable]);

  // Toggle (multiple) or set (single) a value. Multiple keeps the menu open on
  // BOTH select and deselect (explicitly re-open so nothing can close it mid-
  // click, even when a property is already selected).
  const choose = (next: string) => {
    if (multiple) {
      setSelectedValues((prev) =>
        prev.includes(next)
          ? prev.filter((value) => value !== next)
          : [...prev, next],
      );
      setOpen(true);
    } else {
      setSelectedValues([next]);
      closeMenu();
    }
  };

  const remove = (value: string) =>
    setSelectedValues((prev) => prev.filter((v) => v !== value));

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        else setActive((i) => Math.min(filtered.length - 1, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (open) setActive((i) => Math.max(0, i - 1));
        break;
      case "Enter":
        if (open && active >= 0 && active < filtered.length) {
          event.preventDefault();
          choose(filtered[active].value);
        }
        break;
      case " ":
        // Space types into the search box when searchable; otherwise it opens.
        if (!open && !searchable) {
          event.preventDefault();
          setOpen(true);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          closeMenu();
        }
        break;
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      {/* Carries the value into the form; visually hidden but focusable so
          `required` validation can focus it when empty. */}
      <input
        className={styles.hiddenInput}
        name={name}
        value={formValue}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        id={id}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={() => !disabled && (open ? closeMenu() : setOpen(true))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {multiple ? (
          selectedOptions.length ? (
            <span className={styles.chips}>
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className={styles.chip}
                  title={option.label}
                >
                  <span className={styles.chipLabel}>
                    <OptionLabel label={option.label} />
                  </span>
                  {/* A <span> (not <button>) so it isn't nested in the trigger
                      button; stops propagation so it removes without opening. */}
                  <span
                    className={styles.chipRemove}
                    role="button"
                    aria-label={`Remove ${option.label}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      remove(option.value);
                    }}
                  >
                    <X size={13} />
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )
        ) : (
          <span className={styles.valueWrap}>
            {selectedOption?.image ? (
              <img className={styles.thumb} src={selectedOption.image} alt="" />
            ) : selectedOption && hasImages ? (
              <span className={styles.thumbPlaceholder} aria-hidden="true">
                <Package size={14} />
              </span>
            ) : null}
            <span className={selectedOption ? styles.value : styles.placeholder}>
              {selectedOption ? (
                <OptionLabel label={selectedOption.label} />
              ) : (
                placeholder
              )}
            </span>
          </span>
        )}
        <ChevronDown size={16} className={styles.chevron} />
      </button>
      {open && (
        <div className={styles.menu}>
          {searchable && (
            <div className={styles.searchRow}>
              <Search size={15} className={styles.searchIcon} />
              <input
                ref={searchRef}
                className={styles.search}
                type="text"
                value={query}
                placeholder="Search…"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
          <ul className={styles.list} role="listbox" aria-multiselectable={multiple}>
            {filtered.map((option, index) => {
              const isSelected = selectedSet.has(option.value);
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${
                    index === active ? styles.optionActive : ""
                  } ${isSelected ? styles.optionSelected : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => {
                    // Keep focus on the trigger/search before we handle it.
                    event.preventDefault();
                    // In multiple mode a (de)selection must NOT close the menu.
                    // Stop the click reaching the document outside-click listener
                    // so the dropdown reliably stays open even when a property is
                    // already selected.
                    if (multiple) event.stopPropagation();
                    choose(option.value);
                  }}
                >
                  {multiple && (
                    <span
                      className={`${styles.checkbox} ${
                        isSelected ? styles.checkboxOn : ""
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </span>
                  )}
                  {option.image ? (
                    <img className={styles.optionThumb} src={option.image} alt="" />
                  ) : hasImages ? (
                    <span
                      className={styles.optionThumbPlaceholder}
                      aria-hidden="true"
                    >
                      <Package size={16} />
                    </span>
                  ) : null}
                  <span className={styles.optionLabel}>
                    <OptionLabel label={option.label} />
                  </span>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className={styles.empty}>No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
