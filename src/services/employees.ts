import { api } from "../api/client";
import type { ItemEnvelope, ListEnvelope } from "../api/client";
import { nextSequentialNo } from "./sequence";
import { emitEmployeesChanged } from "./employeeEvents";
import type { DirectoryEmployee, MailStatus, NewEmployee } from "../types";

/**
 * Data-access seam for the employee directory, backed by the aaop-be API.
 *   list   -> GET  /employees
 *   create -> POST /employees   (persists to the Employee DB table)
 */

/** Shape returned by the backend Employee model. */
interface ApiEmployee {
  id: string;
  employeeNo: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  position?: string | null;
  officeNo?: string | null;
  office?: { officeNo: string; officeName: string } | null;
  dateOfBirth?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

// Deterministic dot color for the Office column (BE has no color field).
const OFFICE_PALETTE = [
  "#2e90fa",
  "#12b76a",
  "#f79009",
  "#f04438",
  "#eab308",
  "#6c5ce7",
];

function officeColor(office: string): string {
  let hash = 0;
  for (let i = 0; i < office.length; i += 1) {
    hash = (hash + office.charCodeAt(i)) % OFFICE_PALETTE.length;
  }
  return OFFICE_PALETTE[hash];
}

function fullName(e: ApiEmployee): string {
  return [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ");
}

/** Map a backend Employee onto the directory table's view-model. */
function toDirectoryEmployee(e: ApiEmployee): DirectoryEmployee {
  const officeName = e.office?.officeName ?? "—";
  const mailStatus: MailStatus = e.email ? "verified" : "warning";
  return {
    id: e.id,
    employeeNo: e.employeeNo,
    name: fullName(e),
    email: e.email ?? "—",
    mailStatus,
    department: officeName,
    departmentColor: officeColor(officeName),
    role: e.position ?? "—",
    status: e.isActive ? "Active" : "Inactive",
    // Use the uploaded photo when present; otherwise a deterministic placeholder.
    avatar:
      e.imageUrl ??
      `https://i.pravatar.cc/64?u=${encodeURIComponent(e.employeeNo)}`,
  };
}

export async function getDirectoryEmployees(): Promise<DirectoryEmployee[]> {
  // pageSize=100 keeps the whole directory available for display + numbering.
  const res = await api.get<ListEnvelope<ApiEmployee>>("/employees?pageSize=100");
  return res.items.map(toDirectoryEmployee);
}

/** Total number of employees stored in the DB (from the list pagination meta). */
export async function getEmployeeCount(): Promise<number> {
  const res = await api.get<ListEnvelope<ApiEmployee>>("/employees?pageSize=1");
  return res.pagination?.total ?? res.items.length;
}

/**
 * Next employee number, derived from the highest numeric value among the rows
 * currently STORED in the DB — not from any mock/count. Prefix + zero-padding
 * width are preserved (e.g. last "EMP-001" -> "EMP-002"). See nextSequentialNo.
 */
export function getNextEmployeeNo(existing: DirectoryEmployee[]): string {
  return nextSequentialNo(
    existing.map((e) => e.employeeNo),
    { prefix: "EMP-", width: 5 },
  );
}

/** Editable fields used to pre-fill the form when editing an employee. */
export interface EmployeeFormValues {
  employeeNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  officeNo: string;
  email: string;
  /** Current hosted photo URL, so the edit form can preview it. */
  imageUrl: string;
}

// Build the mutable field payload, sending optionals only when present
// (the BE rejects empty date/email strings).
function toMutablePayload(input: NewEmployee): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    firstName: input.firstName,
    lastName: input.lastName,
  };
  if (input.middleName) payload.middleName = input.middleName;
  if (input.position) payload.position = input.position;
  if (input.officeNo) payload.officeNo = input.officeNo;
  if (input.dateOfBirth) payload.dateOfBirth = input.dateOfBirth;
  if (input.email) payload.email = input.email;
  if (input.imageUrl) payload.imageUrl = input.imageUrl;
  return payload;
}

/** Persist a new employee to the DB via POST /employees. */
export async function createEmployee(input: NewEmployee): Promise<void> {
  await api.post("/employees", {
    employeeNo: input.employeeNo,
    ...toMutablePayload(input),
  });
  emitEmployeesChanged();
}

/** Fetch a single employee's editable fields for the edit form. */
export async function getEmployee(id: string): Promise<EmployeeFormValues> {
  const res = await api.get<ItemEnvelope<ApiEmployee>>(`/employees/${id}`);
  const e = res.data;
  return {
    employeeNo: e.employeeNo,
    firstName: e.firstName ?? "",
    middleName: e.middleName ?? "",
    lastName: e.lastName ?? "",
    dateOfBirth: e.dateOfBirth ? e.dateOfBirth.slice(0, 10) : "",
    position: e.position ?? "",
    officeNo: e.officeNo ?? "",
    email: e.email ?? "",
    imageUrl: e.imageUrl ?? "",
  };
}

/** Update an existing employee via PATCH /employees/:id (employeeNo is fixed). */
export async function updateEmployee(
  id: string,
  input: NewEmployee,
): Promise<void> {
  await api.patch(`/employees/${id}`, toMutablePayload(input));
  emitEmployeesChanged();
}

/** Delete an employee via DELETE /employees/:id. */
export async function deleteEmployee(id: string): Promise<void> {
  await api.del(`/employees/${id}`);
  emitEmployeesChanged();
}
