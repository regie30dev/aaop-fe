import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SelectField.module.css";

export interface SelectOption {
  value: string;
  label: string;
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
}

/**
 * Splits a label like "[PRP-00001] DESKTOP COMPUTER, Dell…" into its bracketed
 * leading tag and the remainder, so the tag can be colored independently.
 */
function splitPrefix(label: string): { prefix: string | null; rest: string } {
  const match = label.match(/^(\[[^\]]+\])\s*(.*)$/);
  return match ? { prefix: match[1], rest: match[2] } : { prefix: null, rest: label };
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
 * query against the whole label (number + name + description), so a long list
 * can be narrowed by any of those.
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
}: SelectFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value) ?? null;

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

  // On open, highlight the current selection and focus the search box.
  useEffect(() => {
    if (!open) return;
    setActive(options.findIndex((option) => option.value === value));
    if (searchable) searchRef.current?.focus();
  }, [open, options, value, searchable]);

  const choose = (next: string) => {
    setValue(next);
    closeMenu();
  };

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
        value={value}
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
        <span className={selected ? styles.value : styles.placeholder}>
          {selected ? <OptionLabel label={selected.label} /> : placeholder}
        </span>
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
          <ul className={styles.list} role="listbox">
            {filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`${styles.option} ${
                  index === active ? styles.optionActive : ""
                } ${option.value === value ? styles.optionSelected : ""}`}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => {
                  // Keep focus on the trigger/search before we handle it.
                  event.preventDefault();
                  choose(option.value);
                }}
              >
                <OptionLabel label={option.label} />
              </li>
            ))}
            {filtered.length === 0 && (
              <li className={styles.empty}>No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
