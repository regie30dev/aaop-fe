import { Topbar } from "../../components/layout/Topbar/Topbar";
import { StatCards } from "../../components/dashboard/StatCards/StatCards";
import { AvgWorkHoursChart } from "../../components/dashboard/AvgWorkHoursChart/AvgWorkHoursChart";
import { WorkHoursMonthChart } from "../../components/dashboard/WorkHoursMonthChart/WorkHoursMonthChart";
import { EmployeeTable } from "../../components/dashboard/EmployeeTable/EmployeeTable";
import styles from "./Dashboard.module.css";

interface DashboardProps {
  onMenuClick: () => void;
}

export function Dashboard({ onMenuClick }: DashboardProps) {
  return (
    <div className={styles.dashboard}>
      <Topbar title="Dashboard" onMenuClick={onMenuClick} />

      <div className={styles.stack}>
        <StatCards />

        <div className={styles.charts}>
          <AvgWorkHoursChart />
          <WorkHoursMonthChart />
        </div>

        <EmployeeTable />
      </div>
    </div>
  );
}
