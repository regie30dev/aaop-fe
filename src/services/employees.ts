import { employeeList } from "../data/employeeList";
import type { DirectoryEmployee } from "../types";

/**
 * Data-access seam for the employee directory (Employee overlay screen).
 * Presentation imports from here, not from `src/data/**` directly, so the
 * mock → API swap is confined to this module (make it `async` + `fetch(...)`).
 */
export function getDirectoryEmployees(): DirectoryEmployee[] {
  return employeeList;
}

const EMPLOYEE_NO_PREFIX = "EMP-";

/**
 * System-generated next employee number, derived from the highest numeric
 * suffix currently stored (e.g. last "EMP-1008" -> "EMP-1009"). Falls back to
 * EMP-1001 when the directory is empty.
 */
export function getNextEmployeeNo(): string {
  const numbers = getDirectoryEmployees()
    .map((e) => Number.parseInt(e.employeeNo.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const last = numbers.length > 0 ? Math.max(...numbers) : 1000;
  return `${EMPLOYEE_NO_PREFIX}${last + 1}`;
}
