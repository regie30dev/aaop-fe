export type TrendDirection = "up" | "down";

export interface StatCard {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: TrendDirection;
  comparison: string;
  icon: "employees" | "departments" | "presents" | "absents";
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

export interface Employee {
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

export interface EmployeeListRow {
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
