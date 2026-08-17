import {
  AlertCircle,
  CheckCircle2,
  ChevronsUpDown,
  Eye,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import type {
  DirectoryEmployee,
  EmployeeListStatus,
  MailStatus,
  NewEmployee,
} from "../../../types";
import {
  createEmployee,
  deleteEmployee,
  getDirectoryEmployees,
  getEmployee,
  getNextEmployeeNo,
  searchEmployees,
  updateEmployee,
} from "../../../services/employees";
import type { EmployeeFormValues } from "../../../services/employees";
import { uploadImage } from "../../../services/uploads";
import { getOffices } from "../../../services/offices";
import { FormModal } from "../../common/FormModal/FormModal";
import type { ModalField } from "../../common/FormModal/FormModal";
import { ConfirmDialog } from "../../common/ConfirmDialog/ConfirmDialog";
import { Spinner } from "../../common/Spinner/Spinner";
import { getErrorMessage } from "../../../utils/errors";
import styles from "./EmployeeScreen.module.css";

/** Plain keyword filter used as a fallback when the AI search is unavailable. */
function localMatchIds(
  items: DirectoryEmployee[],
  query: string,
): Set<string> {
  const q = query.trim().toLowerCase();
  return new Set(
    items
      .filter((row) =>
        [row.employeeNo, row.name, row.email, row.department, row.role, row.status]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .map((row) => row.id),
  );
}

// Office is a dropdown fed from the Office table (options injected at render).
function employeeFields(
  officeOptions: { value: string; label: string }[],
): ModalField[] {
  return [
    { name: "lastName", label: "Last Name", required: true, placeholder: "Enter Last Name" },
    { name: "firstName", label: "First Name", required: true, placeholder: "Enter First Name" },
    { name: "middleName", label: "Middle Name", required: true, placeholder: "Enter Middle Name" },
    { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
    { name: "position", label: "Position", required: true, placeholder: "Enter Position" },
    {
      name: "officeNo",
      label: "Office",
      type: "select",
      required: true,
      placeholder: "Select Office",
      options: officeOptions,
    },
    { name: "email", label: "Email", type: "email", placeholder: "Enter Email" },
    { name: "imageUrl", label: "Upload Picture", type: "file" },
    { name: "isActive", label: "OP Employee", type: "checkbox" },
  ];
}

const columns = ["Employee No.", "Name", "Email", "Office", "Position", "Status"];

const statusClass: Record<EmployeeListStatus, string> = {
  Active: styles.statusActive,
  Inactive: styles.statusInactive,
  Vacation: styles.statusVacation,
};

const statusIcon: Record<EmployeeListStatus, ComponentType<{ size?: number }>> = {
  Active: CheckCircle2,
  Inactive: XCircle,
  Vacation: CheckCircle2,
};

function MailIcon({ status }: { status: MailStatus }) {
  if (status === "verified") {
    return <CheckCircle2 size={15} className={styles.mailVerified} />;
  }
  if (status === "warning") {
    return <AlertCircle size={15} className={styles.mailWarning} />;
  }
  return <AlertCircle size={15} className={styles.mailError} />;
}

const PAGE_SIZE = 8; // rows shown per page

export function EmployeeScreen() {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [officeOptions, setOfficeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal: null = closed; otherwise add mode (no id) or edit mode (with id).
  const [form, setForm] = useState<
    | { mode: "add" }
    | { mode: "edit"; id: string; values: EmployeeFormValues }
    | { mode: "view"; id: string; values: EmployeeFormValues }
    | null
  >(null);
  // Transient banner for edit-open failures (kept off the list state).
  const [actionError, setActionError] = useState<string | null>(null);
  // Row pending a delete confirmation (drives the confirmation modal).
  const [pendingDelete, setPendingDelete] = useState<DirectoryEmployee | null>(
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
      const [emps, offices] = await Promise.all([
        getDirectoryEmployees(),
        getOffices(),
      ]);
      setEmployees(emps);
      setOfficeOptions(
        offices.map((o) => ({
          value: o.officeNo,
          label: o.officeName,
        })),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load employees."));
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

  const openEdit = async (row: DirectoryEmployee) => {
    setActionError(null);
    try {
      const values = await getEmployee(row.id);
      setForm({ mode: "edit", id: row.id, values });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to open the employee."));
    }
  };

  const openView = async (row: DirectoryEmployee) => {
    setActionError(null);
    try {
      const values = await getEmployee(row.id);
      setForm({ mode: "view", id: row.id, values });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to open the employee."));
    }
  };

  // Runs when the confirmation modal's Delete is pressed; errors surface in the
  // modal itself (it stays open), so no try/catch here.
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteEmployee(pendingDelete.id);
    await load();
    // The dialog plays its exit animation and then calls onClose to unmount.
  };

  // Create or update, then refresh so rows + next number stay current.
  const handleSubmit = async (values: Record<string, string>) => {
    if (form?.mode === "view") return; // read-only: nothing to save
    const payload: NewEmployee = {
      employeeNo: values.employeeNo,
      lastName: values.lastName,
      firstName: values.firstName,
      middleName: values.middleName,
      dateOfBirth: values.dateOfBirth,
      position: values.position,
      officeNo: values.officeNo,
      email: values.email || undefined,
      // FormModal uploads a newly-picked photo and returns its URL under this key.
      // When editing without picking a new one it's absent, so the payload omits
      // imageUrl and the stored photo is left unchanged.
      imageUrl: values.imageUrl || undefined,
      isActive: values.isActive === "true",
    };
    if (form?.mode === "edit") {
      await updateEmployee(form.id, payload);
    } else {
      await createEmployee(payload);
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
      matchIds === null
        ? employees
        : employees.filter((row) => matchIds.has(row.id));
    try {
      const ids = await searchEmployees(q, corpus);
      setMatchIds(new Set(ids));
      if (ids.length === 0) setSearchNote("No employees match your search.");
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
  const visibleEmployees =
    matchIds === null
      ? employees
      : employees.filter((row) => matchIds.has(row.id));

  // Paginate the visible rows. `currentPage` is clamped so deletions/searches
  // that shrink the list can't leave us stranded past the last page.
  const totalPages = Math.max(1, Math.ceil(visibleEmployees.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  // Condensed pager: first page, an ellipsis, then the last page (once there's
  // more than one page).
  const pagerItems: (number | "gap")[] =
    totalPages <= 1 ? [1] : [1, "gap", totalPages];
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEmployees = visibleEmployees.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Employee List</h2>

      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={runSearch}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search — try “active drivers in the Protocol office”     PRESS ENTER"
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
          <UserPlus size={16} />
          Add New Employee
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
                <td className={styles.stateCell} colSpan={columns.length + 1}>
                  Loading employees…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  className={`${styles.stateCell} ${styles.stateError}`}
                  colSpan={columns.length + 1}
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && visibleEmployees.length === 0 && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 1}>
                  {matchIds !== null
                    ? "No employees match your search."
                    : "No employees yet. Add the first one."}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              pageEmployees.map((row) => {
              const StatusIcon = statusIcon[row.status];
              return (
                <tr key={row.id}>
                  <td className={styles.employeeNo}>{row.employeeNo}</td>
                  <td>
                    <div className={styles.person}>
                      <img
                        className={styles.avatar}
                        src={row.avatar}
                        alt={row.name}
                      />
                      <span className={styles.name}>{row.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.mail}>
                      <MailIcon status={row.mailStatus} />
                      <span className={styles.mailText}>{row.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.department}>
                      <span
                        className={styles.dot}
                        style={{ background: row.departmentColor }}
                      />
                      <span>{row.department}</span>
                    </div>
                  </td>
                  <td className={styles.role}>{row.role}</td>
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
                        aria-label={`View ${row.name}`}
                        title="View"
                        onClick={() => openView(row)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionEdit}
                        aria-label={`Edit ${row.name}`}
                        title="Edit"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionDelete}
                        aria-label={`Delete ${row.name}`}
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
              visibleEmployees.length > 0 &&
              Array.from({ length: PAGE_SIZE - pageEmployees.length }).map(
                (_, i) => (
                  <tr
                    key={`filler-${i}`}
                    className={styles.fillerRow}
                    aria-hidden="true"
                  >
                    <td colSpan={columns.length + 1}>&nbsp;</td>
                  </tr>
                ),
              )}
          </tbody>
        </table>
      </div>

      {!loading && !error && visibleEmployees.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {pageStart + 1}–
            {Math.min(pageStart + PAGE_SIZE, visibleEmployees.length)} of{" "}
            {visibleEmployees.length}
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
              ? "View Employee"
              : form.mode === "edit"
                ? "Edit Employee"
                : "Add New Employee"
          }
          generated={{
            name: "employeeNo",
            label: "Employee No.",
            value:
              form.mode === "add"
                ? getNextEmployeeNo(employees)
                : form.values.employeeNo,
          }}
          fields={employeeFields(officeOptions)}
          initial={
            form.mode !== "add"
              ? (form.values as unknown as Record<string, string>)
              : { isActive: "true" } // new employees default to active
          }
          submitLabel={form.mode === "edit" ? "Update" : "Save"}
          readOnly={form.mode === "view"}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
          uploadFile={uploadImage}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete Employee"
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>{pendingDelete.name}</strong> ({pendingDelete.employeeNo})?
              This action cannot be undone.
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
