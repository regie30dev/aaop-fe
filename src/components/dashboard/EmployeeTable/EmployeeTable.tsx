import { ChevronDown, Eye, Maximize2 } from "lucide-react";
import type { DepartmentTag, EmploymentStatus } from "../../../types";
import { employees } from "../../../data/dashboardData";
import styles from "./EmployeeTable.module.css";

const filters = ["All Status", "All Department", "Last 14 Days"];

const departmentClass: Record<DepartmentTag, string> = {
  Design: styles.tagDesign,
  Marketing: styles.tagMarketing,
  Development: styles.tagDevelopment,
  Product: styles.tagNeutral,
};

const statusClass: Record<EmploymentStatus, string> = {
  Fulltime: styles.statusFulltime,
  Freelance: styles.statusFreelance,
  Internship: styles.statusInternship,
  Contract: styles.statusContract,
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function EmployeeTable() {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <p className={styles.title}>Employee List</p>
        <div className={styles.filters}>
          {filters.map((filter) => (
            <button key={filter} className={styles.filter} type="button">
              {filter} <ChevronDown size={14} />
            </button>
          ))}
          <button
            className={styles.expand}
            type="button"
            aria-label="Expand table"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkCol}>
                <input type="checkbox" aria-label="Select all" />
              </th>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Departments</th>
              <th>Status</th>
              <th className={styles.actionCol} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className={styles.checkCol}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${employee.name}`}
                  />
                </td>
                <td className={styles.muted}>{employee.employeeId}</td>
                <td>
                  <div className={styles.person}>
                    <span
                      className={styles.avatar}
                      style={{ background: employee.avatarColor }}
                    >
                      {initials(employee.name)}
                    </span>
                    <span className={styles.personName}>{employee.name}</span>
                  </div>
                </td>
                <td className={styles.muted}>{employee.email}</td>
                <td>
                  <div className={styles.department}>
                    <span className={styles.position}>{employee.position}</span>
                    <span
                      className={`${styles.tag} ${departmentClass[employee.department]}`}
                    >
                      {employee.department}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    className={`${styles.status} ${statusClass[employee.status]}`}
                  >
                    {employee.status}
                  </span>
                </td>
                <td className={styles.actionCol}>
                  <button
                    className={styles.view}
                    type="button"
                    aria-label={`View ${employee.name}`}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
