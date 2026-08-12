import {
  ChevronsUpDown,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  AccountabilityStatus,
  DirectoryAccountability,
} from "../../../types";
import {
  createAccountability,
  deleteAccountability,
  getAccountabilities,
  getAccountability,
  getNextAccountabilityNo,
  updateAccountability,
} from "../../../services/accountabilities";
import type { AccountabilityFormValues } from "../../../services/accountabilities";
import { getDirectoryEmployees } from "../../../services/employees";
import { getProperties } from "../../../services/properties";
import { FormModal } from "../../common/FormModal/FormModal";
import type { ModalField } from "../../common/FormModal/FormModal";
import { ConfirmDialog } from "../../common/ConfirmDialog/ConfirmDialog";
import { getErrorMessage } from "../../../utils/errors";
import styles from "./AccountabilityScreen.module.css";

const columns = [
  "Acctblty No.",
  "Prop No.",
  "Photo",
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
  properties: { value: string; label: string }[],
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
    { name: "dateIssued", label: "Date Issued", type: "date" },
    { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { name: "remarks", label: "Remarks", placeholder: "Enter Remarks" },
  ];
}

// Edit: the property and employee are re-selectable (saved on Update); the
// issue date stays read-only for context.
function editFields(
  properties: { value: string; label: string }[],
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

export function AccountabilityScreen() {
  const [items, setItems] = useState<DirectoryAccountability[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [employeeOptions, setEmployeeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [nextNo, setNextNo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<
    | { mode: "add" }
    | { mode: "edit"; id: string; values: AccountabilityFormValues }
    | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<DirectoryAccountability | null>(null);

  const load = useCallback(async () => {
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
      setPropertyOptions(
        properties.map((p) => ({
          value: p.propertyNo,
          label: `[${p.propertyNo}] ${p.propertyName.toUpperCase()}, ${p.description}`,
        })),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load accountabilities."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteAccountability(pendingDelete.id);
    await load();
  };

  const handleSubmit = async (values: Record<string, string>) => {
    if (form?.mode === "edit") {
      await updateAccountability(form.id, {
        propertyNo: values.propertyNo || undefined,
        employeeNo: values.employeeNo || undefined,
        dateIssued: values.dateIssued || undefined,
        status: (values.status as AccountabilityStatus) || undefined,
        // Empty clears the value: send null for the date, "" for remarks.
        dateReturned: values.dateReturned || null,
        remarks: values.remarks,
      });
    } else {
      await createAccountability({
        employeeNo: values.employeeNo,
        propertyNo: values.propertyNo,
        status: (values.status as AccountabilityStatus) || undefined,
        dateIssued: values.dateIssued || undefined,
        remarks: values.remarks || undefined,
      });
    }
    await load();
  };

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Accountability List</h2>

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
          <Plus size={16} />
          Create New Accountability
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
                <td className={styles.stateCell} colSpan={columns.length + 1}>
                  Loading accountabilities…
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
            {!loading && !error && items.length === 0 && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 1}>
                  No accountabilities yet. Create the first one.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              items.map((row) => (
                <tr key={row.id}>
                  <td className={styles.accountabilityNo}>
                    {row.accountabilityNo}
                  </td>
                  <td className={styles.propertyNo}>{row.propertyNo}</td>
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
                  <td className={styles.property} title={row.property}>
                    {row.property}
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
          </tbody>
        </table>
      </div>

      {form && (
        <FormModal
          key={form.mode === "edit" ? form.id : "add"}
          title={
            form.mode === "edit"
              ? "Edit Accountability"
              : "Create New Accountability"
          }
          generated={{
            name: "accountabilityNo",
            label: "Acctblty No.",
            value:
              form.mode === "edit"
                ? form.values.accountabilityNo
                : (nextNo ?? "Auto-generated"),
          }}
          fields={
            form.mode === "edit"
              ? editFields(propertyOptions, employeeOptions)
              : createFields(propertyOptions, employeeOptions)
          }
          initial={
            form.mode === "edit"
              ? (form.values as unknown as Record<string, string>)
              : { status: "ASSIGNED" }
          }
          submitLabel={form.mode === "edit" ? "Update" : "Create"}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
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
