import type {
  AvgWorkHoursPoint,
  Employee,
  MonthlyWorkHoursPoint,
  StatCard,
} from "../types";

export const statCards: StatCard[] = [
  {
    id: "total-employees",
    label: "Total Employees",
    value: "183",
    trend: "+15%",
    trendDirection: "up",
    comparison: "vs Last Year",
    icon: "employees",
  },
  {
    id: "departments",
    label: "Departments",
    value: "8",
    trend: "+15%",
    trendDirection: "up",
    comparison: "vs Last Year",
    icon: "departments",
  },
  {
    id: "today-presents",
    label: "Today Presents",
    value: "178",
    trend: "+5%",
    trendDirection: "up",
    comparison: "vs Yesterday",
    icon: "presents",
  },
  {
    id: "today-absents",
    label: "Today Absents",
    value: "5",
    trend: "+2%",
    trendDirection: "up",
    comparison: "vs Yesterday",
    icon: "absents",
  },
];

export const avgWorkHours: AvgWorkHoursPoint[] = [
  { label: "Aug 1", hours: 6.4 },
  { label: "Aug 2", hours: 7.1 },
  { label: "Aug 3", hours: 6.8 },
  { label: "Aug 4", hours: 7.6 },
  { label: "Aug 5", hours: 7.2 },
  { label: "Aug 6", hours: 6.9 },
  { label: "Aug 7", hours: 7.8 },
];

export const monthlyWorkHours: MonthlyWorkHoursPoint[] = [
  { label: "Week 1", workTime: 38, overtime: 6 },
  { label: "Week 2", workTime: 42, overtime: 8 },
  { label: "Week 3", workTime: 40, overtime: 5 },
  { label: "Week 4", workTime: 39, overtime: 9 },
];

export const employees: Employee[] = [
  {
    id: "1",
    employeeId: "Orac1810",
    name: "Jessica",
    email: "jessica@gmail.com",
    position: "UI Designer",
    department: "Design",
    status: "Fulltime",
    avatarColor: "#2563eb",
  },
  {
    id: "2",
    employeeId: "Aero2345",
    name: "Maria Lopez",
    email: "maria@yahoo.com",
    position: "UX Researcher",
    department: "Design",
    status: "Freelance",
    avatarColor: "#dc2626",
  },
  {
    id: "3",
    employeeId: "MediX500",
    name: "Devon Smith",
    email: "michael@hotmail.com",
    position: "Product Manager",
    department: "Marketing",
    status: "Internship",
    avatarColor: "#1e40af",
  },
  {
    id: "4",
    employeeId: "TechNova1000",
    name: "Aisha Khan",
    email: "sarah@outlook.com",
    position: "Front-end Developer",
    department: "Development",
    status: "Contract",
    avatarColor: "#ef4444",
  },
];
