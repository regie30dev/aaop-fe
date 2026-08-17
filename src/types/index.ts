export type TrendDirection = "up" | "down";

export interface StatCard {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: TrendDirection;
  comparison: string;
  icon: "employees" | "departments" | "properties" | "accountabilities";
}

export interface AvgWorkHoursPoint {
  label: string;
  hours: number;
}

export interface MonthlyWorkHoursPoint {
  label: string;
  workTime: number;
  overtime: number;
}

export type DepartmentTag = "Design" | "Marketing" | "Development" | "Product";

export type EmploymentStatus =
  | "Fulltime"
  | "Freelance"
  | "Internship"
  | "Contract";

/* Dashboard "Employee List" widget (FE_UI_1) */
export interface DashboardEmployee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  position: string;
  department: DepartmentTag;
  status: EmploymentStatus;
  avatarColor: string;
}

/* Employee List overlay screen (FE_UI_2) */
export type EmployeeListStatus = "Active" | "Inactive" | "Vacation";

export type MailStatus = "verified" | "warning" | "error";

export interface DirectoryEmployee {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  mailStatus: MailStatus;
  department: string;
  departmentColor: string;
  role: string;
  status: EmployeeListStatus;
  avatar: string;
}

/* Office directory screen + Add New Office form */
export type OfficeStatus = "Active" | "Inactive";

export interface DirectoryOffice {
  id: string;
  officeNo: string;
  officeName: string;
  function: string;
  location: string;
  status: OfficeStatus;
}

export interface NewOffice {
  officeNo: string;
  officeName: string;
  function?: string;
  location?: string;
}

/* Property directory screen + Add New Property form */
export interface DirectoryProperty {
  id: string;
  propertyNo: string;
  /** Hosted thumbnail URL, or "" when no photo has been uploaded. */
  image: string;
  category: string;
  propertyName: string;
  description: string;
  /** Acquisition cost, pre-formatted for display (e.g. "1,500.00"). */
  price: string;
  /** Acquisition date, pre-formatted for display, or "—" when unset. */
  dateAcquired: string;
  condition: string;
}

export interface NewProperty {
  propertyNo: string;
  category?: string;
  propertyName: string;
  description: string;
  acquisitionCost: number;
  acquisitionDate?: string;
  condition?: string;
  /** Hosted image URL (from the upload endpoint), stored on the property. */
  imageUrl?: string;
}

/* Accountability directory screen + Create New Accountability form */
export type AccountabilityStatus =
  | "ASSIGNED"
  | "RETURNED"
  | "TRANSFERRED"
  | "LOST"
  | "DAMAGED";

export interface DirectoryAccountability {
  id: string;
  accountabilityNo: string;
  /** The referenced property's number. */
  propertyNo: string;
  /** The referenced property's thumbnail URL, or "" when none. */
  propertyImage: string;
  /** "PROPERTY NAME, description" — name upper-cased, per spec. */
  property: string;
  /** Quantity of the item covered by this accountability. */
  qty: number;
  /** Unit of measure for the quantity (e.g. "pcs", "set"), or "" when unset. */
  unit: string;
  /** Full name of the employee the item is issued to. */
  issuedTo: string;
  /** Name of that employee's office. */
  office: string;
  /** Pre-formatted for display. */
  dateIssued: string;
  /** Pre-formatted for display, or "—" when not yet returned. */
  dateReturned: string;
  status: AccountabilityStatus;
  remarks: string;
}

/** Payload for creating an accountability (POST /accountabilities). */
export interface NewAccountability {
  employeeNo: string;
  propertyNo: string;
  qty: number;
  unit: string;
  status?: AccountabilityStatus;
  dateIssued?: string;
  remarks?: string;
}

/** Payload for updating an accountability (PATCH /accountabilities/:id). */
export interface EditAccountability {
  propertyNo?: string;
  employeeNo?: string;
  qty?: number;
  unit?: string;
  dateIssued?: string;
  status?: AccountabilityStatus;
  /** A date to record a return, or null to clear it. */
  dateReturned?: string | null;
  remarks?: string;
}

/* Payload emitted by the Add New Employee form (FE_UI_3) */
export interface NewEmployee {
  employeeNo: string;
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  position: string;
  officeNo: string;
  email?: string;
  /** Hosted image URL (from the upload endpoint), stored on the employee. */
  imageUrl?: string;
  /** Whether the person is an active OP employee. */
  isActive?: boolean;
}
