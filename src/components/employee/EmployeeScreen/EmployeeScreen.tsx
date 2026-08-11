import {
  AlertCircle,
  CheckCircle2,
  ChevronsUpDown,
  Pencil,
  Search,
  Trash2,
  UserPlus,
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
  updateEmployee,
} from "../../../services/employees";
import type { EmployeeFormValues } from "../../../services/employees";
import { AddEmployeeForm } from "../AddEmployeeForm/AddEmployeeForm";
import { ConfirmDialog } from "../../common/ConfirmDialog/ConfirmDialog";
import styles from "./EmployeeScreen.module.css";

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

export function EmployeeScreen() {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal: null = closed; otherwise add mode (no id) or edit mode (with id).
  const [form, setForm] = useState<
    | { mode: "add" }
    | { mode: "edit"; id: string; values: EmployeeFormValues }
    | null
  >(null);
  // Transient banner for edit-open failures (kept off the list state).
  const [actionError, setActionError] = useState<string | null>(null);
  // Row pending a delete confirmation (drives the confirmation modal).
  const [pendingDelete, setPendingDelete] = useState<DirectoryEmployee | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEmployees(await getDirectoryEmployees());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = async (row: DirectoryEmployee) => {
    setActionError(null);
    try {
      const values = await getEmployee(row.id);
      setForm({ mode: "edit", id: row.id, values });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to open the employee.",
      );
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
  const handleSubmit = async (employee: NewEmployee) => {
    if (form?.mode === "edit") {
      await updateEmployee(form.id, employee);
    } else {
      await createEmployee(employee);
    }
    await load();
  };

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Employee List</h2>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search"
          />
        </div>
        <button
          className={styles.addNew}
          type="button"
          onClick={() => setForm({ mode: "add" })}
        >
          <UserPlus size={16} />
          Add New Employee
        </button>
      </div>

      {actionError && <p className={styles.actionBanner}>{actionError}</p>}

      <div className={styles.tableWrap}>
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
            {!loading && !error && employees.length === 0 && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 1}>
                  No employees yet. Add the first one.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              employees.map((row) => {
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
          </tbody>
        </table>
      </div>

      {form && (
        <AddEmployeeForm
          key={form.mode === "edit" ? form.id : "add"}
          mode={form.mode}
          employeeNo={
            form.mode === "edit"
              ? form.values.employeeNo
              : getNextEmployeeNo(employees)
          }
          initial={form.mode === "edit" ? form.values : undefined}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
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
