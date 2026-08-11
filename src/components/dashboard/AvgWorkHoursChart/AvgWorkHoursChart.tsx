import { ChevronDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { avgWorkHours } from "../../../data/dashboardData";
import styles from "./AvgWorkHoursChart.module.css";

export function AvgWorkHoursChart() {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Avg Work Hours</p>
          <p className={styles.subtitle}>
            Track the average working hours per day
          </p>
        </div>
        <button className={styles.dropdown} type="button">
          Last 7 Days <ChevronDown size={14} />
        </button>
      </div>

      <div className={styles.metric}>
        <span className={styles.value}>7,8 hours</span>
        <span className={styles.trend}>
          <TrendingUp size={13} />
          +15%
        </span>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={avgWorkHours}
            margin={{ top: 20, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="avgHoursFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-primary)", strokeDasharray: "4 4" }}
              contentStyle={{
                borderRadius: 10,
                border: "none",
                boxShadow: "var(--shadow-md)",
                fontSize: 12,
              }}
              formatter={(value) => [`${value} h`, "Avg"]}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#avgHoursFill)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
