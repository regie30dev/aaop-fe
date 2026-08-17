import {
  ChevronsUpDown,
  Eye,
  FileText,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AccountabilityStatus,
  DirectoryAccountability,
} from "../../../types";
import {
  createAccountability,
  deleteAccountability,
  downloadAccountabilityReport,
  getAccountabilities,
  getAccountability,
  getNextAccountabilityNo,
  searchAccountabilities,
  updateAccountability,
} from "../../../services/accountabilities";
import type { AccountabilityFormValues } from "../../../services/accountabilities";
import { getDirectoryEmployees } from "../../../services/employees";
import { getProperties } from "../../../services/properties";
import { FormModal } from "../../common/FormModal/FormModal";
import type { ModalField } from "../../common/FormModal/FormModal";
import { ConfirmDialog } from "../../common/ConfirmDialog/ConfirmDialog";
import { Spinner } from "../../common/Spinner/Spinner";
import { getErrorMessage } from "../../../utils/errors";
import {
  openAccountabilityReport,
  updateAccountabilityReport,
} from "../../../utils/accountabilityReport";
import styles from "./AccountabilityScreen.module.css";

/** Plain keyword filter used as a fallback when the AI search is unavailable. */
function localMatchIds(
  items: DirectoryAccountability[],
  query: string,
): Set<string> {
  const q = query.trim().toLowerCase();
  return new Set(
    items
      .filter((row) =>
        [
          row.accountabilityNo,
          row.propertyNo,
          row.property,
          String(row.qty),
          row.unit,
          row.issuedTo,
          row.office,
          row.status,
          row.remarks,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .map((row) => row.id),
  );
}

const columns = [
  "Photo",
  "Acctblty No.",
  "Qty",
  "Unit",
  "Prop No.",
  "Name and Description",
  "Issued To",
  "Office",
  "Status",
];

const STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "RETURNED", label: "Returned" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "LOST", label: "Lost" },
  { value: "DAMAGED", label: "Damaged" },
];

// Create: pick the property + the employee it's issued to, plus issue details.
function createFields(
  properties: { value: string; label: string; image?: string }[],
  employees: { value: string; label: string }[],
): ModalField[] {
  return [
    {
      name: "propertyNo",
      label: "Property Name and Description",
      type: "select",
      required: true,
      placeholder: "Select Property",
      options: properties,
      searchable: true,
      multiple: true,
    },
    {
      name: "employeeNo",
      label: "Accountability Issued To",
      type: "select",
      required: true,
      placeholder: "Select Employee",
      options: employees,
      searchable: true,
    },
    {
      name: "qty",
      label: "Quantity",
      type: "number",
      required: true,
      placeholder: "1",
    },
    {
      name: "unit",
      label: "Unit",
      required: true,
      placeholder: "e.g. pcs, set, box",
    },
    { name: "dateIssued", label: "Date Issued", type: "date" },
    { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { name: "remarks", label: "Remarks", placeholder: "Enter Remarks" },
  ];
}

// Edit: the property and employee are re-selectable (saved on Update); the
// issue date stays read-only for context.
function editFields(
  properties: { value: string; label: string; image?: string }[],
  employees: { value: string; label: string }[],
): ModalField[] {
  return [
    {
      name: "propertyNo",
      label: "Property",
      type: "select",
      required: true,
      placeholder: "Select Property",
      options: properties,
      searchable: true,
    },
    {
      name: "employeeNo",
      label: "Employee",
      type: "select",
      required: true,
      placeholder: "Select Employee",
      options: employees,
      searchable: true,
    },
    {
      name: "qty",
      label: "Quantity",
      type: "number",
      required: true,
      placeholder: "1",
    },
    {
      name: "unit",
      label: "Unit",
      required: true,
      placeholder: "e.g. pcs, set, box",
    },
    { name: "dateIssued", label: "Date Issued", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: STATUS_OPTIONS,
    },
    { name: "dateReturned", label: "Date Returned", type: "date" },
    { name: "remarks", label: "Remarks", placeholder: "Enter Remarks" },
  ];
}

const statusClass: Record<AccountabilityStatus, string> = {
  ASSIGNED: styles.statusAssigned,
  RETURNED: styles.statusReturned,
  TRANSFERRED: styles.statusTransferred,
  LOST: styles.statusLost,
  DAMAGED: styles.statusDamaged,
};

/** "ASSIGNED" -> "Assigned" for display. */
function statusLabel(status: AccountabilityStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/** Scope key for the report: one printable form per employee (name + office). */
function employeeKey(row: DirectoryAccountability): string {
  return `${row.issuedTo}||${row.office}`;
}

const PAGE_SIZE = 8; // rows shown per page

export function AccountabilityScreen() {
  const [items, setItems] = useState<DirectoryAccountability[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<
    { value: string; label: string; image?: string }[]
  >([]);
  const [employeeOptions, setEmployeeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  // Employee numbers that are currently active ("OP Employee"). Only these can
  // be issued a new accountability.
  const [activeEmployeeNos, setActiveEmployeeNos] = useState<Set<string>>(
    new Set(),
  );
  // Property acquisition cost keyed by propertyNo — the report's "Cost" column
  // (the accountability records themselves don't carry cost).
  const [priceByPropertyNo, setPriceByPropertyNo] = useState<
    Record<string, string>
  >({});
  const [nextNo, setNextNo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<
    | { mode: "add"; initial: Record<string, string> }
    | { mode: "edit"; id: string; values: AccountabilityFormValues }
    | { mode: "view"; id: string; values: AccountabilityFormValues }
    | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<DirectoryAccountability | null>(null);
  // After a successful create, holds the just-entered values (minus property)
  // to power the "Create another?" prompt; null means no prompt.
  const [createAnother, setCreateAnother] = useState<Record<
    string,
    string
  > | null>(null);

  // Opens a fresh "add" form with the given field values pre-filled.
  const openCreate = (initial: Record<string, string>) =>
    setForm({ mode: "add", initial });

  // AI natural-language search. `matchIds` null = no active filter (show all);
  // a Set = only rows whose id is in it. `note` explains a fallback/empty result.
  const [query, setQuery] = useState("");
  const [matchIds, setMatchIds] = useState<Set<string> | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);

  // Client-side pagination over the currently-shown rows.
  const [page, setPage] = useState(1);

  // Live report popup: keep the window handle so we can push real-time updates
  // into it, plus the scope it was opened with (a set of employee keys, or null
  // for "all employees") so re-renders show the same person(s) — including any
  // newly-added record for them — without a manual refresh.
  const reportWinRef = useRef<Window | null>(null);
  const reportScopeRef = useRef<Set<string> | null>(null);

  // Property numbers currently held under an ASSIGNED accountability — these
  // can't be issued again, so they're removed from the "create" picker.
  const assignedPropertyNos = useMemo(
    () =>
      new Set(
        items
          .filter((item) => item.status === "ASSIGNED")
          .map((item) => item.propertyNo),
      ),
    [items],
  );

  // Returns the freshly-fetched records so callers can act on them immediately
  // (state updates are async, so `items` is still stale right after this runs).
  const load = useCallback(async (): Promise<
    DirectoryAccountability[] | null
  > => {
    setLoading(true);
    setError(null);
    try {
      const [records, employees, properties, next] = await Promise.all([
        getAccountabilities(),
        getDirectoryEmployees(),
        getProperties(),
        // Best-effort preview of the next number; a failure just falls back to a label.
        getNextAccountabilityNo().catch(() => null),
      ]);
      setItems(records);
      setNextNo(next);
      setEmployeeOptions(
        employees.map((e) => ({ value: e.employeeNo, label: e.name })),
      );
      setActiveEmployeeNos(
        new Set(
          employees
            .filter((e) => e.status === "Active")
            .map((e) => e.employeeNo),
        ),
      );
      setPropertyOptions(
        properties.map((p) => ({
          value: p.propertyNo,
          label: `[${p.propertyNo}] ${p.propertyName.toUpperCase()}, ${p.description}`,
          image: p.image || undefined,
        })),
      );
      setPriceByPropertyNo(
        Object.fromEntries(properties.map((p) => [p.propertyNo, p.price])),
      );
      return records;
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load accountabilities."));
      return null;
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

  // Keep an open report window in sync in real time: whenever the data changes
  // (e.g. a new accountability is created), re-render the report from the
  // current records scoped to the same employee(s) it was opened for.
  useEffect(() => {
    const win = reportWinRef.current;
    if (!win || win.closed) return;
    const scope = reportScopeRef.current;
    const reportItems =
      scope === null ? items : items.filter((row) => scope.has(employeeKey(row)));
    updateAccountabilityReport(win, reportItems, priceByPropertyNo, () =>
      downloadAccountabilityReport(reportItems.map((row) => row.id)),
    );
  }, [items, priceByPropertyNo]);

  const openEdit = async (row: DirectoryAccountability) => {
    setActionError(null);
    try {
      const values = await getAccountability(row.id);
      setForm({ mode: "edit", id: row.id, values });
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Failed to open the accountability."),
      );
    }
  };

  const openView = async (row: DirectoryAccountability) => {
    setActionError(null);
    try {
      const values = await getAccountability(row.id);
      setForm({ mode: "view", id: row.id, values });
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Failed to open the accountability."),
      );
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteAccountability(pendingDelete.id);
    await load();
  };

  const handleSubmit = async (values: Record<string, string>) => {
    if (form?.mode === "view") return; // read-only: nothing to save
    if (form?.mode === "edit") {
      await updateAccountability(form.id, {
        propertyNo: values.propertyNo || undefined,
        employeeNo: values.employeeNo || undefined,
        qty: values.qty ? Number(values.qty) : undefined,
        unit: values.unit,
        dateIssued: values.dateIssued || undefined,
        status: (values.status as AccountabilityStatus) || undefined,
        // Empty clears the value: send null for the date, "" for remarks.
        dateReturned: values.dateReturned || null,
        remarks: values.remarks,
      });
      await load();
    } else {
      // The property picker is multi-select: its value is a comma-joined list.
      // Issue one accountability per chosen property (same employee/qty/unit).
      // Sequentially, so the server's sequential Acctblty No. can't collide.
      const propertyNos = values.propertyNo
        .split(",")
        .map((no) => no.trim())
        .filter(Boolean);
      for (const propertyNo of propertyNos) {
        await createAccountability({
          employeeNo: values.employeeNo,
          propertyNo,
          qty: Number(values.qty),
          unit: values.unit,
          status: (values.status as AccountabilityStatus) || undefined,
          dateIssued: values.dateIssued || undefined,
          remarks: values.remarks || undefined,
        });
      }
      // Keep everything the user typed except the property, ready to offer a
      // "Create another?" prompt once this modal closes.
      const retained = { ...values };
      delete retained.propertyNo;
      setCreateAnother(retained);
      // The record is persisted at this point — don't hold the modal's "Saving…"
      // state on the follow-up refresh. Reload the list in the background; the
      // modal closes immediately once createAccountability resolves.
      //
      // Keeping the active search filter is instant: instead of asking the AI
      // whether the new record matches, we optimistically add the just-created
      // record(s) to the filter. Existing rows keep their ids (and prior
      // matches), so we only union in the new ids — no extra network round-trip.
      const prevIds = new Set(items.map((row) => row.id));
      const activeFilter = matchIds;
      void (async () => {
        const records = await load();
        if (!records || !activeFilter) return;
        const addedIds = records
          .filter((row) => !prevIds.has(row.id))
          .map((row) => row.id);
        if (addedIds.length === 0) return;
        setMatchIds((prev) => {
          const next = new Set(prev ?? []);
          addedIds.forEach((id) => next.add(id));
          return next;
        });
      })();
    }
  };

  // Runs the AI search for `q` over `corpus` and installs the resulting filter.
  // Shared by the search box and the post-create re-run.
  const applySearch = useCallback(
    async (q: string, corpus: DirectoryAccountability[]) => {
      setSearching(true);
      setSearchNote(null);
      try {
        const ids = await searchAccountabilities(q, corpus);
        setMatchIds(new Set(ids));
        if (ids.length === 0) setSearchNote("No records match your search.");
      } catch {
        // AI unavailable → fall back to a plain keyword filter so search still works.
        setMatchIds(localMatchIds(corpus, q));
        setSearchNote("AI search unavailable — showing keyword matches.");
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  const runSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setMatchIds(null);
      setSearchNote(null);
      return;
    }
    // Search within the records currently on screen (the result of any prior
    // search) so successive queries refine the same visible set. Clearing the
    // search resets the corpus back to all loaded records.
    const corpus =
      matchIds === null ? items : items.filter((row) => matchIds.has(row.id));
    await applySearch(q, corpus);
  };

  const clearSearch = () => {
    setQuery("");
    setMatchIds(null);
    setSearchNote(null);
  };

  // Rows to display: everything, or only those the active search matched.
  const visibleItems =
    matchIds === null ? items : items.filter((row) => matchIds.has(row.id));

  // Open the printable report and remember its window + scope so the effect
  // above can keep it live. Scope = the employee(s) currently shown (null when
  // unfiltered, i.e. every employee).
  const openReport = () => {
    reportScopeRef.current =
      matchIds === null ? null : new Set(visibleItems.map(employeeKey));
    reportWinRef.current = openAccountabilityReport(
      visibleItems,
      priceByPropertyNo,
      () => downloadAccountabilityReport(visibleItems.map((row) => row.id)),
    );
  };

  // Paginate the visible rows. `currentPage` is clamped so deletions/searches
  // that shrink the list can't leave us stranded past the last page.
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  // Condensed pager: first page, an ellipsis, then the last page (once there's
  // more than one page).
  const pagerItems: (number | "gap")[] =
    totalPages <= 1 ? [1] : [1, "gap", totalPages];
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = visibleItems.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Accountability List</h2>

      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={runSearch}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search — try “assigned pickups in Protocol not yet returned”     PRESS ENTER"
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
          className={styles.reports}
          type="button"
          onClick={openReport}
          disabled={loading || searching || visibleItems.length === 0}
        >
          <FileText size={16} />
          Reports
        </button>
        <button
          className={styles.addNew}
          type="button"
          onClick={() => openCreate({ status: "ASSIGNED", qty: "1" })}
          disabled={loading || searching}
        >
          <Plus size={16} />
          Create New Accountability
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
                    {column !== "Photo" && (
                      <ChevronsUpDown size={14} className={styles.sortIcon} />
                    )}
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
                  Loading accountabilities…
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
            {!loading && !error && visibleItems.length === 0 && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 2}>
                  {matchIds !== null
                    ? "No records match your search."
                    : "No accountabilities yet. Create the first one."}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              pageItems.map((row, index) => (
                <tr key={row.id}>
                  <td className={styles.rowNo}>{pageStart + index + 1}.</td>
                  <td>
                    {row.propertyImage ? (
                      <img
                        className={styles.thumb}
                        src={row.propertyImage}
                        alt={row.property}
                      />
                    ) : (
                      <span
                        className={styles.thumbPlaceholder}
                        aria-label="No photo"
                      >
                        <Package size={18} />
                      </span>
                    )}
                  </td>
                  <td className={styles.accountabilityNo}>
                    {row.accountabilityNo}
                  </td>
                  <td>{row.qty}</td>
                  <td>{row.unit || "—"}</td>
                  <td className={styles.propertyNo}>{row.propertyNo}</td>
                  <td className={styles.property}>
                    <div className={styles.descriptionText} title={row.property}>
                      {row.property}
                    </div>
                  </td>
                  <td className={styles.strong}>{row.issuedTo}</td>
                  <td>{row.office}</td>
                  <td>
                    <span
                      className={`${styles.status} ${statusClass[row.status]}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionView}
                        aria-label={`View ${row.accountabilityNo}`}
                        title="View"
                        onClick={() => openView(row)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionEdit}
                        aria-label={`Edit ${row.accountabilityNo}`}
                        title="Edit"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionDelete}
                        aria-label={`Delete ${row.accountabilityNo}`}
                        title="Delete"
                        onClick={() => setPendingDelete(row)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {/* Pad the last page to 8 rows so the pager stays at the bottom. */}
            {!loading &&
              !error &&
              visibleItems.length > 0 &&
              Array.from({ length: PAGE_SIZE - pageItems.length }).map(
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

      {!loading && !error && visibleItems.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {pageStart + 1}–
            {Math.min(pageStart + PAGE_SIZE, visibleItems.length)} of{" "}
            {visibleItems.length}
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
              ? "View Accountability"
              : form.mode === "edit"
                ? "Edit Accountability"
                : "Create New Accountability"
          }
          generated={{
            name: "accountabilityNo",
            label: "Acctblty No.",
            value:
              form.mode === "add"
                ? (nextNo ?? "Auto-generated")
                : form.values.accountabilityNo,
          }}
          fields={
            form.mode !== "add"
              ? editFields(
                  // Hide other assigned properties, but keep this record's own.
                  propertyOptions.filter(
                    (option) =>
                      !assignedPropertyNos.has(option.value) ||
                      option.value === form.values.propertyNo,
                  ),
                  // Only active employees, but keep this record's own.
                  employeeOptions.filter(
                    (option) =>
                      activeEmployeeNos.has(option.value) ||
                      option.value === form.values.employeeNo,
                  ),
                )
              : createFields(
                  propertyOptions.filter(
                    (option) => !assignedPropertyNos.has(option.value),
                  ),
                  // Only active employees can be issued a new accountability.
                  employeeOptions.filter((option) =>
                    activeEmployeeNos.has(option.value),
                  ),
                )
          }
          initial={
            form.mode !== "add"
              ? (form.values as unknown as Record<string, string>)
              : form.initial
          }
          submitLabel={form.mode === "edit" ? "Update" : "Create"}
          readOnly={form.mode === "view"}
          size="wide"
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
        />
      )}

      {createAnother && !form && (
        <ConfirmDialog
          title="Create Another Accountability?"
          message="The accountability was saved. Add another with the same details? You'll select a new property."
          confirmLabel="Yes"
          cancelLabel="No"
          confirmVariant="primary"
          autoFocusConfirm
          onConfirm={() => {
            const initial = createAnother;
            setCreateAnother(null);
            openCreate(initial);
          }}
          onClose={() => setCreateAnother(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete Accountability"
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>{pendingDelete.accountabilityNo}</strong> (
              {pendingDelete.issuedTo})? This action cannot be undone.
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
