import {
  CheckCircle2,
  ChevronsUpDown,
  Pencil,
  Plus,
  Search,
  Trash2,
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
  updateOffice,
} from "../../../services/offices";
import type { OfficeFormValues } from "../../../services/offices";
import { FormModal } from "../../common/FormModal/FormModal";
import type { ModalField } from "../../common/FormModal/FormModal";
import { ConfirmDialog } from "../../common/ConfirmDialog/ConfirmDialog";
import { getErrorMessage } from "../../../utils/errors";
import styles from "./OfficeScreen.module.css";

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

export function OfficeScreen() {
  const [offices, setOffices] = useState<DirectoryOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<
    | { mode: "add" }
    | { mode: "edit"; id: string; values: OfficeFormValues }
    | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DirectoryOffice | null>(
    null,
  );

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

  const openEdit = async (row: DirectoryOffice) => {
    setActionError(null);
    try {
      const values = await getOffice(row.id);
      setForm({ mode: "edit", id: row.id, values });
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

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Office List</h2>

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
          Add New Office
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
                  Loading offices…
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
            {!loading && !error && offices.length === 0 && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 1}>
                  No offices yet. Add the first one.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              offices.map((row) => {
                const StatusIcon = statusIcon[row.status];
                return (
                  <tr key={row.id}>
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
          </tbody>
        </table>
      </div>

      {form && (
        <FormModal
          key={form.mode === "edit" ? form.id : "add"}
          title={form.mode === "edit" ? "Edit Office" : "Add New Office"}
          generated={{
            name: "officeNo",
            label: "Office No.",
            value:
              form.mode === "edit"
                ? form.values.officeNo
                : getNextOfficeNo(offices),
          }}
          fields={OFFICE_FIELDS}
          initial={
            form.mode === "edit"
              ? (form.values as unknown as Record<string, string>)
              : undefined
          }
          submitLabel={form.mode === "edit" ? "Update" : "Save"}
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
