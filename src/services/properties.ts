import { api } from "../api/client";
import type { ItemEnvelope, ListEnvelope } from "../api/client";
import { nextSequentialNo } from "./sequence";
import { emitPropertiesChanged } from "./propertyEvents";
import type { DirectoryProperty, NewProperty } from "../types";

/**
 * Data-access seam for properties, backed by the aaop-be API.
 *   list/get -> /properties, /properties/:id
 *   create/update/delete -> POST/PATCH/DELETE /properties[/:id]
 */

interface ApiProperty {
  id: string;
  propertyNo: string;
  propertyName?: string | null;
  description: string;
  category?: string | null;
  // Prisma Decimal serializes to a string over JSON (e.g. "1500.00").
  acquisitionCost: string | number;
  acquisitionDate?: string | null;
  condition: string;
}

/** Editable fields used to pre-fill the form when editing a property. */
export interface PropertyFormValues {
  propertyNo: string;
  category: string;
  propertyName: string;
  description: string;
  acquisitionCost: string;
  acquisitionDate: string;
  condition: string;
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "1,500.00" for display; "—" when the amount is missing/unparseable. */
function formatPrice(cost: string | number): string {
  const value = typeof cost === "number" ? cost : Number.parseFloat(cost);
  return Number.isFinite(value) ? priceFormatter.format(value) : "—";
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

/** ISO timestamp -> "YYYY-MM-DD" for a <input type="date"> value. */
function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toDirectoryProperty(p: ApiProperty): DirectoryProperty {
  return {
    id: p.id,
    propertyNo: p.propertyNo,
    category: p.category ?? "—",
    propertyName: p.propertyName ?? "—",
    description: p.description,
    price: formatPrice(p.acquisitionCost),
    dateAcquired: formatDate(p.acquisitionDate),
    condition: p.condition,
  };
}

function toMutablePayload(input: NewProperty): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    description: input.description,
    acquisitionCost: input.acquisitionCost,
  };
  if (input.category) payload.category = input.category;
  if (input.propertyName) payload.propertyName = input.propertyName;
  if (input.acquisitionDate) payload.acquisitionDate = input.acquisitionDate;
  if (input.condition) payload.condition = input.condition;
  return payload;
}

export async function getProperties(): Promise<DirectoryProperty[]> {
  const res = await api.get<ListEnvelope<ApiProperty>>(
    "/properties?pageSize=100",
  );
  return res.items.map(toDirectoryProperty);
}

/** Total number of properties stored in the DB (from the list pagination meta). */
export async function getPropertyCount(): Promise<number> {
  const res = await api.get<ListEnvelope<ApiProperty>>("/properties?pageSize=1");
  return res.pagination?.total ?? res.items.length;
}

/** Next property number, derived from the highest stored one (e.g. PRP-00002).
 *  Seeds "PRP-00001" when the directory is empty; the prefix + 5-digit width
 *  then carry forward automatically via nextSequentialNo. */
export function getNextPropertyNo(existing: DirectoryProperty[]): string {
  return nextSequentialNo(
    existing.map((p) => p.propertyNo),
    { prefix: "PRP-", width: 5 },
  );
}

export async function getProperty(id: string): Promise<PropertyFormValues> {
  const res = await api.get<ItemEnvelope<ApiProperty>>(`/properties/${id}`);
  const p = res.data;
  return {
    propertyNo: p.propertyNo,
    category: p.category ?? "",
    propertyName: p.propertyName ?? "",
    description: p.description ?? "",
    acquisitionCost:
      p.acquisitionCost == null ? "" : String(p.acquisitionCost),
    acquisitionDate: toDateInput(p.acquisitionDate),
    condition: p.condition ?? "",
  };
}

export async function createProperty(input: NewProperty): Promise<void> {
  await api.post("/properties", {
    propertyNo: input.propertyNo,
    ...toMutablePayload(input),
  });
  emitPropertiesChanged();
}

export async function updateProperty(
  id: string,
  input: NewProperty,
): Promise<void> {
  await api.patch(`/properties/${id}`, toMutablePayload(input));
  emitPropertiesChanged();
}

export async function deleteProperty(id: string): Promise<void> {
  await api.del(`/properties/${id}`);
  emitPropertiesChanged();
}
