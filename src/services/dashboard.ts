import {
  avgWorkHours,
  monthlyWorkHours,
  statCards,
  employees,
} from "../data/dashboardData";
import type {
  AvgWorkHoursPoint,
  DashboardEmployee,
  MonthlyWorkHoursPoint,
  StatCard,
} from "../types";

/**
 * Data-access seam for the dashboard. Presentation imports from here, not from
 * `src/data/**` directly, so swapping the mock for a real API only touches this
 * module (make these `async` + `fetch(...)` at integration time).
 */
export function getStatCards(): StatCard[] {
  return statCards;
}

export function getAvgWorkHours(): AvgWorkHoursPoint[] {
  return avgWorkHours;
}

export function getMonthlyWorkHours(): MonthlyWorkHoursPoint[] {
  return monthlyWorkHours;
}

export function getDashboardEmployees(): DashboardEmployee[] {
  return employees;
}
