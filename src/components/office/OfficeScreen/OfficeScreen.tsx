import {
  CheckCircle2,
  ChevronsUpDown,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { DirectoryOffice, NewOffice, OfficeStatus } from "../../../types";
import {
  createOffice,
  deleteOffice,
  getNextOfficeNo,
  getOffice,
  getOffices,
  searchOffices,
  updateOffice,
} from "../../../services/offices";
import type { OfficeFormValues } from "../../../services/offices";
import { FormModal } from "../../common/FormModal/FormModal";
import type { ModalField } from "../../common/FormModal/FormModal";
import { ConfirmDialog } from "../../common/ConfirmDialog/ConfirmDialog";
import { Spinner } from "../../common/Spinner/Spinner";
import { getErrorMessage } from "../../../utils/errors";
import styles from "./OfficeScreen.module.css";

/** Plain keyword filter used as a fallback when the AI search is unavailable. */
function localMatchIds(items: DirectoryOffice[], query: string): Set<string> {
  const q = query.trim().toLowerCase();
  return new Set(
    items
      .filter((row) =>
        [row.officeNo, row.officeName, row.function, row.location, row.status]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .map((row) => row.id),
  );
}

const columns = [
  "Office No",
  "Office Name",
  "Function of the Office",
  "Location of the Office",
  "Status",
];

const OFFICE_FIELDS: ModalField[] = [
  {
    name: "officeName",
    label: "Office Name",
    required: true,
    placeholder: "Enter Office Name",
  },
  {
    name: "function",
    label: "Function of the Office",
    placeholder: "Enter Function of the Office",
  },
  {
    name: "location",
    label: "Location of the Office",
    placeholder: "Enter Location of the Office",
  },
];

const statusClass: Record<OfficeStatus, string> = {
  Active: styles.statusActive,
  Inactive: styles.statusInactive,
};

const statusIcon: Record<OfficeStatus, ComponentType<{ size?: number }>> = {
  Active: CheckCircle2,
  Inactive: XCircle,
};

const PAGE_SIZE = 8; // rows shown per page

export function OfficeScreen() {
  const [offices, setOffices] = useState<DirectoryOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<
    | { mode: "add" }
    | { mode: "edit"; id: string; values: OfficeFormValues }
    | { mode: "view"; id: string; values: OfficeFormValues }
    | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DirectoryOffice | null>(
    null,
  );

  // AI natural-language search. `matchIds` null = no active filter (show all);
  // a Set = only rows whose id is in it. `note` explains a fallback/empty result.
  const [query, setQuery] = useState("");
  const [matchIds, setMatchIds] = useState<Set<string> | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);

  // Client-side pagination over the currently-shown rows.
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOffices(await getOffices());
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load offices."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to the first page whenever the active search filter changes.
  useEffect(() => {
    setPage(1);
  }, [matchIds]);

  const openEdit = async (row: DirectoryOffice) => {
    setActionError(null);
    try {
      const values = await getOffice(row.id);
      setForm({ mode: "edit", id: row.id, values });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to open the office."));
    }
  };

  const openView = async (row: DirectoryOffice) => {
    setActionError(null);
    try {
      const values = await getOffice(row.id);
      setForm({ mode: "view", id: row.id, values });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to open the office."));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteOffice(pendingDelete.id);
    await load();
  };

  const handleSubmit = async (values: Record<string, string>) => {
    if (form?.mode === "view") return; // read-only: nothing to save
    const payload: NewOffice = {
      officeNo: values.officeNo,
      officeName: values.officeName,
      function: values.function || undefined,
      location: values.location || undefined,
    };
    if (form?.mode === "edit") {
      await updateOffice(form.id, payload);
    } else {
      await createOffice(payload);
    }
    await load();
  };

  const runSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setMatchIds(null);
      setSearchNote(null);
      return;
    }
    setSearching(true);
    setSearchNote(null);
    // Search within the records currently on screen (the result of any prior
    // search) so successive queries refine the same visible set. Clearing the
    // search resets the corpus back to all loaded records.
    const corpus =
      matchIds === null ? offices : offices.filter((row) => matchIds.has(row.id));
    try {
      const ids = await searchOffices(q, corpus);
      setMatchIds(new Set(ids));
      if (ids.length === 0) setSearchNote("No offices match your search.");
    } catch {
      // AI unavailable → fall back to a plain keyword filter so search still works.
      setMatchIds(localMatchIds(corpus, q));
      setSearchNote("AI search unavailable — showing keyword matches.");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setMatchIds(null);
    setSearchNote(null);
  };

  // Rows to display: everything, or only those the active search matched.
  const visibleOffices =
    matchIds === null ? offices : offices.filter((row) => matchIds.has(row.id));

  // Paginate the visible rows. `currentPage` is clamped so deletions/searches
  // that shrink the list can't leave us stranded past the last page.
  const totalPages = Math.max(1, Math.ceil(visibleOffices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  // Condensed pager: first page, an ellipsis, then the last page (once there's
  // more than one page).
  const pagerItems: (number | "gap")[] =
    totalPages <= 1 ? [1] : [1, "gap", totalPages];
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageOffices = visibleOffices.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Office List</h2>

      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={runSearch}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search — try “active offices handling procurement in Manila”     PRESS ENTER"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={loading}
          />
          {searching && <Spinner />}
          {!searching && matchIds !== null && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </form>
        <button
          className={styles.addNew}
          type="button"
          onClick={() => setForm({ mode: "add" })}
          disabled={loading || searching}
        >
          <Plus size={16} />
          Add New Office
        </button>
      </div>

      {(searching || searchNote) && (
        <p
          className={`${styles.searchNote} ${searching ? styles.searchingNote : ""}`}
        >
          {searching ? "Finding records…" : searchNote}
        </p>
      )}
      {actionError && <p className={styles.actionBanner}>{actionError}</p>}

      <div
        className={`${styles.tableWrap} ${searching ? styles.tableWrapSearching : ""}`}
        aria-busy={searching}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <span className={styles.th}>No.</span>
              </th>
              {columns.map((column) => (
                <th key={column}>
                  <span className={styles.th}>
                    {column}
                    <ChevronsUpDown size={14} className={styles.sortIcon} />
                  </span>
                </th>
              ))}
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 2}>
                  <span className={styles.loadingState}>
                    <Spinner size={18} />
                    Loading offices…
                  </span>
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  className={`${styles.stateCell} ${styles.stateError}`}
                  colSpan={columns.length + 2}
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && visibleOffices.length === 0 && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 2}>
                  {matchIds !== null
                    ? "No offices match your search."
                    : "No offices yet. Add the first one."}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              pageOffices.map((row, index) => {
                const StatusIcon = statusIcon[row.status];
                return (
                  <tr key={row.id}>
                    <td className={styles.rowNo}>{pageStart + index + 1}.</td>
                    <td className={styles.officeNo}>{row.officeNo}</td>
                    <td className={styles.strong}>{row.officeName}</td>
                    <td>{row.function}</td>
                    <td>{row.location}</td>
                    <td>
                      <span
                        className={`${styles.status} ${statusClass[row.status]}`}
                      >
                        <StatusIcon size={13} />
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionView}
                          aria-label={`View ${row.officeName}`}
                          title="View"
                          onClick={() => openView(row)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionEdit}
                          aria-label={`Edit ${row.officeName}`}
                          title="Edit"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionDelete}
                          aria-label={`Delete ${row.officeName}`}
                          title="Delete"
                          onClick={() => setPendingDelete(row)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {/* Pad the last page to 8 rows so the pager stays at the bottom. */}
            {!loading &&
              !error &&
              visibleOffices.length > 0 &&
              Array.from({ length: PAGE_SIZE - pageOffices.length }).map(
                (_, i) => (
                  <tr
                    key={`filler-${i}`}
                    className={styles.fillerRow}
                    aria-hidden="true"
                  >
                    <td colSpan={columns.length + 2}>&nbsp;</td>
                  </tr>
                ),
              )}
          </tbody>
        </table>
      </div>

      {!loading && !error && visibleOffices.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {pageStart + 1}–
            {Math.min(pageStart + PAGE_SIZE, visibleOffices.length)} of{" "}
            {visibleOffices.length}
          </span>
          <div className={styles.pageNav}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage(currentPage - 1)}
              disabled={searching || currentPage === 1}
            >
              Prev
            </button>
            {pagerItems.map((item, idx) =>
              item === "gap" ? (
                <span key={`gap-${idx}`} className={styles.pageEllipsis}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`${styles.pageBtn} ${
                    item === currentPage ? styles.pageBtnActive : ""
                  }`}
                  onClick={() => setPage(item)}
                  disabled={searching}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage(currentPage + 1)}
              disabled={searching || currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {form && (
        <FormModal
          key={form.mode === "add" ? "add" : form.id}
          title={
            form.mode === "view"
              ? "View Office"
              : form.mode === "edit"
                ? "Edit Office"
                : "Add New Office"
          }
          generated={{
            name: "officeNo",
            label: "Office No.",
            value:
              form.mode === "add"
                ? getNextOfficeNo(offices)
                : form.values.officeNo,
          }}
          fields={OFFICE_FIELDS}
          initial={
            form.mode !== "add"
              ? (form.values as unknown as Record<string, string>)
              : undefined
          }
          submitLabel={form.mode === "edit" ? "Update" : "Save"}
          readOnly={form.mode === "view"}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete Office"
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>{pendingDelete.officeName}</strong> (
              {pendingDelete.officeNo})? This action cannot be undone.
            </>
          }
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
