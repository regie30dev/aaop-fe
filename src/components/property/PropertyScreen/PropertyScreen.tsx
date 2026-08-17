import {
  ChevronsUpDown,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { DirectoryProperty, NewProperty } from "../../../types";
import {
  createProperty,
  createPropertyBatch,
  deleteProperty,
  getNextPropertyNo,
  getProperties,
  getProperty,
  searchProperties,
  updateProperty,
} from "../../../services/properties";
import type { PropertyFormValues } from "../../../services/properties";
import { uploadImage } from "../../../services/uploads";
import { FormModal } from "../../common/FormModal/FormModal";
import type { ModalField } from "../../common/FormModal/FormModal";
import { ConfirmDialog } from "../../common/ConfirmDialog/ConfirmDialog";
import { Spinner } from "../../common/Spinner/Spinner";
import { getErrorMessage } from "../../../utils/errors";
import uploadProperty from "../../../assets/upload-property.svg";
import styles from "./PropertyScreen.module.css";

/** Plain keyword filter used as a fallback when the AI search is unavailable. */
function localMatchIds(
  items: DirectoryProperty[],
  query: string,
): Set<string> {
  const q = query.trim().toLowerCase();
  return new Set(
    items
      .filter((row) =>
        [
          row.propertyNo,
          row.category,
          row.propertyName,
          row.description,
          row.price,
          row.dateAcquired,
          row.condition,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .map((row) => row.id),
  );
}

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
    type: "textarea",
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
  {
    name: "imageUrl",
    label: "Upload Photo",
    type: "file",
    image: uploadProperty,
  },
];

/** Colour the condition pill for the two known values; neutral otherwise. */
function conditionClass(condition: string): string {
  const normalized = condition.trim().toUpperCase();
  if (normalized === "SERVICEABLE") return styles.conditionOk;
  if (normalized === "UNSERVICEABLE") return styles.conditionBad;
  return styles.conditionNeutral;
}

const PAGE_SIZE = 8; // rows shown per page

export function PropertyScreen() {
  const [properties, setProperties] = useState<DirectoryProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<
    | { mode: "add" }
    | { mode: "edit"; id: string; values: PropertyFormValues }
    | { mode: "view"; id: string; values: PropertyFormValues }
    | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DirectoryProperty | null>(
    null,
  );
  // "Create Times X" flow: captured form values awaiting a copy-count, and the
  // count the user types into the confirmation box.
  const [bulkValues, setBulkValues] = useState<Record<string, string> | null>(
    null,
  );
  const [bulkCount, setBulkCount] = useState("2");

  // AI natural-language search. `matchIds` null = no active filter (show all);
  // a Set = only rows whose id is in it. `note` explains a fallback/empty result.
  const [query, setQuery] = useState("");
  const [matchIds, setMatchIds] = useState<Set<string> | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);

  // Client-side pagination over the currently-shown rows.
  const [page, setPage] = useState(1);

  // Returns the freshly-fetched records so callers can act on them immediately
  // (state updates are async, so `properties` is still stale right after this).
  const load = useCallback(async (): Promise<DirectoryProperty[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const records = await getProperties();
      setProperties(records);
      return records;
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load properties."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // After a create, refresh in the background (so the modal/dialog closes
  // immediately, not held on the reload) and, if a search filter is active,
  // optimistically add the just-created record(s) to it — existing rows keep
  // their ids and prior matches, so the new rows just get unioned in and show
  // without a manual re-search or an AI round-trip.
  const refreshWithOptimisticFilter = (
    prevIds: Set<string>,
    activeFilter: Set<string> | null,
  ) => {
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
  };

  useEffect(() => {
    load();
  }, [load]);

  // Reset to the first page whenever the active search filter changes.
  useEffect(() => {
    setPage(1);
  }, [matchIds]);

  const openEdit = async (row: DirectoryProperty) => {
    setActionError(null);
    try {
      const values = await getProperty(row.id);
      setForm({ mode: "edit", id: row.id, values });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to open the property."));
    }
  };

  const openView = async (row: DirectoryProperty) => {
    setActionError(null);
    try {
      const values = await getProperty(row.id);
      setForm({ mode: "view", id: row.id, values });
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
    if (form?.mode === "view") return; // read-only: nothing to save
    const payload: NewProperty = {
      propertyNo: values.propertyNo,
      category: values.category || undefined,
      propertyName: values.propertyName,
      description: values.description,
      acquisitionCost: Number(values.acquisitionCost),
      acquisitionDate: values.acquisitionDate || undefined,
      condition: values.condition || undefined,
      // FormModal uploads a newly-picked photo and returns its URL under this key.
      // When editing without picking a new one it's absent, so the payload omits
      // imageUrl and the stored photo is left unchanged.
      imageUrl: values.imageUrl || undefined,
    };
    if (form?.mode === "edit") {
      await updateProperty(form.id, payload);
      await load();
    } else {
      await createProperty(payload);
      // Persisted — close the modal now; refresh (and keep the filter) in the
      // background.
      refreshWithOptimisticFilter(
        new Set(properties.map((row) => row.id)),
        matchIds,
      );
    }
  };

  // "Create Times X": the modal has validated + uploaded; capture its values and
  // open the confirmation box that asks how many copies to make.
  const openBulkPrompt = (values: Record<string, string>) => {
    setBulkCount("2");
    setBulkValues(values);
  };

  // Confirm handler for the copy-count box. Throws (so the box shows the error
  // and stays open) unless the count is a whole number greater than 1.
  const confirmBulkCreate = async () => {
    const count = Number(bulkCount);
    if (!Number.isInteger(count) || count <= 1) {
      throw new Error("Please enter a whole number greater than 1.");
    }
    const v = bulkValues;
    if (!v) return;
    await createPropertyBatch(
      {
        category: v.category || undefined,
        propertyName: v.propertyName,
        description: v.description,
        acquisitionCost: Number(v.acquisitionCost),
        acquisitionDate: v.acquisitionDate || undefined,
        condition: v.condition || undefined,
        imageUrl: v.imageUrl || undefined,
      },
      Math.min(100, count),
    );
    // Same as single create: close the dialog now, refresh in the background,
    // and optimistically union the new copies into any active search filter.
    refreshWithOptimisticFilter(
      new Set(properties.map((row) => row.id)),
      matchIds,
    );
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
        ? properties
        : properties.filter((row) => matchIds.has(row.id));
    try {
      const ids = await searchProperties(q, corpus);
      setMatchIds(new Set(ids));
      if (ids.length === 0) setSearchNote("No properties match your search.");
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
  const visibleProperties =
    matchIds === null
      ? properties
      : properties.filter((row) => matchIds.has(row.id));

  // Paginate the visible rows. `currentPage` is clamped so deletions/searches
  // that shrink the list can't leave us stranded past the last page.
  const totalPages = Math.max(1, Math.ceil(visibleProperties.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  // Condensed pager: first page, an ellipsis, then the last page (once there's
  // more than one page).
  const pagerItems: (number | "gap")[] =
    totalPages <= 1 ? [1] : [1, "gap", totalPages];
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageProperties = visibleProperties.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Property List</h2>

      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={runSearch}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search — try “serviceable laptops costing above 100,000”     PRESS ENTER"
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
          Add New Property
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
              <th>
                <span className={styles.th}>Photo</span>
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
                <td className={styles.stateCell} colSpan={columns.length + 3}>
                  Loading properties…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  className={`${styles.stateCell} ${styles.stateError}`}
                  colSpan={columns.length + 3}
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && visibleProperties.length === 0 && (
              <tr>
                <td className={styles.stateCell} colSpan={columns.length + 3}>
                  {matchIds !== null
                    ? "No properties match your search."
                    : "No properties yet. Add the first one."}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              pageProperties.map((row, index) => (
                <tr key={row.id}>
                  <td className={styles.rowNo}>{pageStart + index + 1}.</td>
                  <td>
                    {row.image ? (
                      <img
                        className={styles.thumb}
                        src={row.image}
                        alt={row.propertyName}
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
                  <td className={styles.propertyNo}>{row.propertyNo}</td>
                  <td>{row.category}</td>
                  <td className={styles.strong}>{row.propertyName}</td>
                  <td className={styles.description}>
                    <div
                      className={styles.descriptionText}
                      title={row.description}
                    >
                      {row.description}
                    </div>
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
                        className={styles.actionView}
                        aria-label={`View ${row.propertyName}`}
                        title="View"
                        onClick={() => openView(row)}
                      >
                        <Eye size={16} />
                      </button>
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
            {/* Pad the last page to 8 rows so the pager stays at the bottom. */}
            {!loading &&
              !error &&
              visibleProperties.length > 0 &&
              Array.from({ length: PAGE_SIZE - pageProperties.length }).map(
                (_, i) => (
                  <tr
                    key={`filler-${i}`}
                    className={styles.fillerRow}
                    aria-hidden="true"
                  >
                    <td colSpan={columns.length + 3}>&nbsp;</td>
                  </tr>
                ),
              )}
          </tbody>
        </table>
      </div>

      {!loading && !error && visibleProperties.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {pageStart + 1}–
            {Math.min(pageStart + PAGE_SIZE, visibleProperties.length)} of{" "}
            {visibleProperties.length}
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
              ? "View Property"
              : form.mode === "edit"
                ? "Edit Property"
                : "Add New Property"
          }
          generated={{
            name: "propertyNo",
            label: "Prop No.",
            value:
              form.mode === "add"
                ? getNextPropertyNo(properties)
                : form.values.propertyNo,
          }}
          fields={PROPERTY_FIELDS}
          initial={
            form.mode !== "add"
              ? (form.values as unknown as Record<string, string>)
              : { condition: "SERVICEABLE" }
          }
          submitLabel={form.mode === "edit" ? "Update" : "Save"}
          readOnly={form.mode === "view"}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
          uploadFile={uploadImage}
          extraAction={
            form.mode === "add"
              ? {
                  label: () => "Create Times X",
                  onSubmit: openBulkPrompt,
                }
              : undefined
          }
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

      {bulkValues && !form && (
        <ConfirmDialog
          title="Create Multiple Copies"
          message={
            <>
              How many times should this property be created?
              <input
                type="number"
                min={2}
                step={1}
                autoFocus
                className={styles.bulkInput}
                value={bulkCount}
                onChange={(event) => setBulkCount(event.target.value)}
              />
              <span className={styles.bulkHint}>Must be greater than 1.</span>
            </>
          }
          confirmLabel="Create"
          pendingLabel="Creating…"
          confirmVariant="primary"
          onConfirm={confirmBulkCreate}
          onClose={() => setBulkValues(null)}
        />
      )}
    </div>
  );
}
