import { ChevronsUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { DirectoryProperty, NewProperty } from "../../../types";
import {
  createProperty,
  deleteProperty,
  getNextPropertyNo,
  getProperties,
  getProperty,
  updateProperty,
} from "../../../services/properties";
import type { PropertyFormValues } from "../../../services/properties";
import { FormModal } from "../../common/FormModal/FormModal";
import type { ModalField } from "../../common/FormModal/FormModal";
import { ConfirmDialog } from "../../common/ConfirmDialog/ConfirmDialog";
import { getErrorMessage } from "../../../utils/errors";
import styles from "./PropertyScreen.module.css";

const columns = [
  "Property No",
  "Category",
  "Property Name",
  "Description",
  "Price",
  "Date Acquired",
  "Condition",
];

const PROPERTY_FIELDS: ModalField[] = [
  {
    name: "category",
    label: "Category",
    placeholder: "Enter Category",
  },
  {
    name: "propertyName",
    label: "Property Name",
    required: true,
    placeholder: "Enter Property Name",
  },
  {
    name: "description",
    label: "Description",
    required: true,
    placeholder: "Enter Description",
  },
  {
    name: "acquisitionCost",
    label: "Price",
    type: "number",
    required: true,
    placeholder: "0.00",
  },
  {
    name: "acquisitionDate",
    label: "Date Acquired",
    type: "date",
  },
  {
    name: "condition",
    label: "Condition",
    type: "select",
    placeholder: "Select Condition",
    options: [
      { value: "SERVICEABLE", label: "Serviceable" },
      { value: "UNSERVICEABLE", label: "Unserviceable" },
    ],
  },
];

/** Colour the condition pill for the two known values; neutral otherwise. */
function conditionClass(condition: string): string {
  const normalized = condition.trim().toUpperCase();
  if (normalized === "SERVICEABLE") return styles.conditionOk;
  if (normalized === "UNSERVICEABLE") return styles.conditionBad;
  return styles.conditionNeutral;
}

export function PropertyScreen() {
  const [properties, setProperties] = useState<DirectoryProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<
    | { mode: "add" }
    | { mode: "edit"; id: string; values: PropertyFormValues }
    | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DirectoryProperty | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProperties(await getProperties());
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load properties."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = async (row: DirectoryProperty) => {
    setActionError(null);
    try {
      const values = await getProperty(row.id);
      setForm({ mode: "edit", id: row.id, values });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to open the property."));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteProperty(pendingDelete.id);
    await load();
  };

  const handleSubmit = async (values: Record<string, string>) => {
    const payload: NewProperty = {
      propertyNo: values.propertyNo,
      category: values.category || undefined,
      propertyName: values.propertyName,
      description: values.description,
      acquisitionCost: Number(values.acquisitionCost),
      acquisitionDate: values.acquisitionDate || undefined,
      condition: values.condition || undefined,
    };
    if (form?.mode === "edit") {
      await updateProperty(form.id, payload);
    } else {
      await createProperty(payload);
    }
    await load();
  };

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Property List</h2>

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
          Add New Property
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
                  Loading properties…
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
            {!loading && !error && properties.length === 0 && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 1}>
                  No properties yet. Add the first one.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              properties.map((row) => (
                <tr key={row.id}>
                  <td className={styles.propertyNo}>{row.propertyNo}</td>
                  <td>{row.category}</td>
                  <td className={styles.strong}>{row.propertyName}</td>
                  <td className={styles.description} title={row.description}>
                    {row.description}
                  </td>
                  <td className={styles.price}>{row.price}</td>
                  <td>{row.dateAcquired}</td>
                  <td>
                    <span
                      className={`${styles.condition} ${conditionClass(
                        row.condition,
                      )}`}
                    >
                      {row.condition}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionEdit}
                        aria-label={`Edit ${row.propertyName}`}
                        title="Edit"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionDelete}
                        aria-label={`Delete ${row.propertyName}`}
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
          title={form.mode === "edit" ? "Edit Property" : "Add New Property"}
          generated={{
            name: "propertyNo",
            label: "Property No.",
            value:
              form.mode === "edit"
                ? form.values.propertyNo
                : getNextPropertyNo(properties),
          }}
          fields={PROPERTY_FIELDS}
          initial={
            form.mode === "edit"
              ? (form.values as unknown as Record<string, string>)
              : { condition: "SERVICEABLE" }
          }
          submitLabel={form.mode === "edit" ? "Update" : "Save"}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete Property"
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>{pendingDelete.propertyName}</strong> (
              {pendingDelete.propertyNo})? This action cannot be undone.
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
