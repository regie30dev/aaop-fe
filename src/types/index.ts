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
  propertyName?: string;
  description: string;
  acquisitionCost: number;
  acquisitionDate?: string;
  condition?: string;
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
  picture?: File | null;
}
