import { api, BASE_URL } from "../api/client";
import type { ItemEnvelope, ListEnvelope } from "../api/client";
import { emitAccountabilitiesChanged } from "./accountabilityEvents";
import type {
  AccountabilityStatus,
  DirectoryAccountability,
  EditAccountability,
  NewAccountability,
} from "../types";

/**
 * Data-access seam for accountabilities, backed by the aaop-be API.
 *   list/get -> /accountabilities, /accountabilities/:id
 *   create/update/delete -> POST/PATCH/DELETE /accountabilities[/:id]
 *
 * The record links a property to the employee accountable for it; the API
 * embeds both parties (and the employee's office) so the table can display
 * names without extra round-trips.
 */

interface ApiEmployeeRef {
  employeeNo: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  office?: { officeNo: string; officeName: string } | null;
}

interface ApiPropertyRef {
  propertyNo: string;
  propertyName: string;
  description: string;
  imageUrl?: string | null;
}

interface ApiAccountability {
  id: string;
  accountabilityNo: string;
  employeeNo: string;
  employee?: ApiEmployeeRef | null;
  propertyNo: string;
  property?: ApiPropertyRef | null;
  qty: number;
  unit?: string | null;
  status: AccountabilityStatus;
  dateIssued: string;
  dateReturned?: string | null;
  remarks?: string | null;
}

/** Fields used to pre-fill the form when editing an accountability. */
export interface AccountabilityFormValues {
  accountabilityNo: string;
  /** Read-only context: the linked property's number. */
  propertyNo: string;
  /** Read-only context: the accountable employee's number. */
  employeeNo: string;
  /** Quantity (kept as a string for the number input). */
  qty: string;
  /** Unit of measure for the quantity. */
  unit: string;
  /** Date the item was issued, as "YYYY-MM-DD" for the date input. */
  dateIssued: string;
  status: AccountabilityStatus;
  dateReturned: string;
  remarks: string;
}

/** ISO timestamp -> "MMM D, YYYY" for display; "—" when unset. */
function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** ISO timestamp -> "YYYY-MM-DD" for an <input type="date"> value. */
function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function employeeName(e?: ApiEmployeeRef | null): string {
  if (!e) return "—";
  const name = [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ");
  return name || "—";
}

/** "PROPERTY NAME, description" — name upper-cased, per spec. */
function propertyLabel(p?: ApiPropertyRef | null): string {
  if (!p) return "—";
  return `${p.propertyName.toUpperCase()}, ${p.description}`;
}

function toDirectoryAccountability(a: ApiAccountability): DirectoryAccountability {
  return {
    id: a.id,
    accountabilityNo: a.accountabilityNo,
    propertyNo: a.propertyNo,
    propertyImage: a.property?.imageUrl ?? "",
    property: propertyLabel(a.property),
    qty: a.qty ?? 1,
    unit: a.unit ?? "",
    issuedTo: employeeName(a.employee),
    office: a.employee?.office?.officeName ?? "—",
    dateIssued: formatDate(a.dateIssued),
    dateReturned: formatDate(a.dateReturned),
    status: a.status,
    remarks: a.remarks ?? "—",
  };
}

export async function getAccountabilities(): Promise<DirectoryAccountability[]> {
  const res = await api.get<ListEnvelope<ApiAccountability>>(
    "/accountabilities?pageSize=100",
  );
  return res.items.map(toDirectoryAccountability);
}

/** Preview the next auto-generated accountability number (server sequence peek). */
export async function getNextAccountabilityNo(): Promise<string> {
  const res = await api.get<ItemEnvelope<{ accountabilityNo: string }>>(
    "/accountabilities/next-no",
  );
  return res.data.accountabilityNo;
}

export async function getAccountability(
  id: string,
): Promise<AccountabilityFormValues> {
  const res = await api.get<ItemEnvelope<ApiAccountability>>(
    `/accountabilities/${id}`,
  );
  const a = res.data;
  return {
    accountabilityNo: a.accountabilityNo,
    propertyNo: a.propertyNo,
    employeeNo: a.employeeNo,
    qty: a.qty == null ? "" : String(a.qty),
    unit: a.unit ?? "",
    dateIssued: toDateInput(a.dateIssued),
    status: a.status,
    dateReturned: toDateInput(a.dateReturned),
    remarks: a.remarks ?? "",
  };
}

export async function createAccountability(
  input: NewAccountability,
): Promise<void> {
  const payload: Record<string, unknown> = {
    employeeNo: input.employeeNo,
    propertyNo: input.propertyNo,
  };
  if (input.qty != null) payload.qty = input.qty;
  if (input.unit) payload.unit = input.unit;
  if (input.status) payload.status = input.status;
  if (input.dateIssued) payload.dateIssued = input.dateIssued;
  if (input.remarks) payload.remarks = input.remarks;
  await api.post("/accountabilities", payload);
  emitAccountabilitiesChanged();
}

export async function updateAccountability(
  id: string,
  input: EditAccountability,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (input.propertyNo) payload.propertyNo = input.propertyNo;
  if (input.employeeNo) payload.employeeNo = input.employeeNo;
  if (input.qty != null) payload.qty = input.qty;
  if (input.unit !== undefined) payload.unit = input.unit;
  if (input.dateIssued) payload.dateIssued = input.dateIssued;
  if (input.status) payload.status = input.status;
  // null is meaningful here (clears the return date), so guard on undefined.
  if (input.dateReturned !== undefined) payload.dateReturned = input.dateReturned;
  if (input.remarks !== undefined) payload.remarks = input.remarks;
  await api.patch(`/accountabilities/${id}`, payload);
  emitAccountabilitiesChanged();
}

export async function deleteAccountability(id: string): Promise<void> {
  await api.del(`/accountabilities/${id}`);
  emitAccountabilitiesChanged();
}

/**
 * AI natural-language search. Sends the prompt AND the records exactly as
 * presented in the Accountability List so Claude reasons over that data and
 * context — the on-screen list is the source of truth, filtered or not. Returns
 * the ids of the matching accountabilities.
 */
export async function searchAccountabilities(
  prompt: string,
  records: DirectoryAccountability[],
): Promise<string[]> {
  // Mirror the columns the user sees (drop the image blob) as search context.
  const context = records.map((r) => ({
    id: r.id,
    accountabilityNo: r.accountabilityNo,
    qty: r.qty,
    unit: r.unit,
    propertyNo: r.propertyNo,
    nameAndDescription: r.property,
    issuedTo: r.issuedTo,
    office: r.office,
    status: r.status,
    dateIssued: r.dateIssued,
    dateReturned: r.dateReturned,
    remarks: r.remarks,
  }));
  const res = await api.post<ItemEnvelope<{ matchingIds: string[] }>>(
    "/accountabilities/search",
    { prompt, records: context },
  );
  return res.data.matchingIds;
}

/**
 * Request the .xlsx report (built server-side with embedded photos) for the
 * given accountability ids and trigger its download in the browser.
 */
export async function downloadAccountabilityReport(
  ids: string[],
): Promise<void> {
  const res = await fetch(`${BASE_URL}/accountabilities/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    let message = `Report failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* response wasn't JSON */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Accountability-List.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
