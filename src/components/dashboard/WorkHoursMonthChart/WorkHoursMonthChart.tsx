import { ChevronDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monthlyWorkHours } from "../../../data/dashboardData";
import styles from "./WorkHoursMonthChart.module.css";

export function WorkHoursMonthChart() {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <p className={styles.title}>Work Hours For Month</p>
        <button className={styles.dropdown} type="button">
          This Month <ChevronDown size={14} />
        </button>
      </div>

      <ul className={styles.legend}>
        <li>
          <span className={`${styles.dot} ${styles.dotWork}`} />
          <span className={styles.legendLabel}>Work-Time</span>
          <span className={styles.legendValue}>159h 25m</span>
        </li>
        <li>
          <span className={`${styles.dot} ${styles.dotOver}`} />
          <span className={styles.legendLabel}>Overtime</span>
          <span className={styles.legendValue}>27h 28m</span>
        </li>
      </ul>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyWorkHours}
            barGap={6}
            margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text-faint)", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text-faint)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(108, 92, 231, 0.06)" }}
              contentStyle={{
                borderRadius: 10,
                border: "none",
                boxShadow: "var(--shadow-md)",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="workTime"
              name="Work-Time"
              fill="#2563eb"
              radius={[6, 6, 0, 0]}
              barSize={14}
            />
            <Bar
              dataKey="overtime"
              name="Overtime"
              fill="#dc2626"
              radius={[6, 6, 0, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
