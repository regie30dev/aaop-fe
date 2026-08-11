import { api } from "../api/client";
import type { ItemEnvelope, ListEnvelope } from "../api/client";
import { nextSequentialNo } from "./sequence";
import { emitOfficesChanged } from "./officeEvents";
import type { DirectoryOffice, NewOffice } from "../types";

/**
 * Data-access seam for offices, backed by the aaop-be API.
 *   list/get -> /offices, /offices/:id
 *   create/update/delete -> POST/PATCH/DELETE /offices[/:id]
 */

interface ApiOffice {
  id: string;
  officeNo: string;
  officeName: string;
  function?: string | null;
  location?: string | null;
  isActive: boolean;
}


/** Editable fields used to pre-fill the form when editing an office. */
export interface OfficeFormValues {
  officeNo: string;
  officeName: string;
  function: string;
  location: string;
}

function toDirectoryOffice(o: ApiOffice): DirectoryOffice {
  return {
    id: o.id,
    officeNo: o.officeNo,
    officeName: o.officeName,
    function: o.function ?? "—",
    location: o.location ?? "—",
    status: o.isActive ? "Active" : "Inactive",
  };
}

function toMutablePayload(input: NewOffice): Record<string, unknown> {
  const payload: Record<string, unknown> = { officeName: input.officeName };
  if (input.function) payload.function = input.function;
  if (input.location) payload.location = input.location;
  return payload;
}

export async function getOffices(): Promise<DirectoryOffice[]> {
  const res = await api.get<ListEnvelope<ApiOffice>>("/offices?pageSize=100");
  return res.items.map(toDirectoryOffice);
}

/** Total number of offices stored in the DB (from the list pagination meta). */
export async function getOfficeCount(): Promise<number> {
  const res = await api.get<ListEnvelope<ApiOffice>>("/offices?pageSize=1");
  return res.pagination?.total ?? res.items.length;
}

/** Next office number, derived from the highest stored one (e.g. OFC-00002).
 *  Seeds "OFC-00001" when the directory is empty; the prefix + 5-digit width
 *  then carry forward automatically via nextSequentialNo. */
export function getNextOfficeNo(existing: DirectoryOffice[]): string {
  return nextSequentialNo(
    existing.map((o) => o.officeNo),
    { prefix: "OFC-", width: 5 },
  );
}

export async function getOffice(id: string): Promise<OfficeFormValues> {
  const res = await api.get<ItemEnvelope<ApiOffice>>(`/offices/${id}`);
  const o = res.data;
  return {
    officeNo: o.officeNo,
    officeName: o.officeName ?? "",
    function: o.function ?? "",
    location: o.location ?? "",
  };
}

export async function createOffice(input: NewOffice): Promise<void> {
  await api.post("/offices", {
    officeNo: input.officeNo,
    ...toMutablePayload(input),
  });
  emitOfficesChanged();
}

export async function updateOffice(id: string, input: NewOffice): Promise<void> {
  await api.patch(`/offices/${id}`, toMutablePayload(input));
  emitOfficesChanged();
}

export async function deleteOffice(id: string): Promise<void> {
  await api.del(`/offices/${id}`);
  emitOfficesChanged();
}
