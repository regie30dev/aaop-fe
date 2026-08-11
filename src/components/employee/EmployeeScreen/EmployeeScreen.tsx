import {
  AlertCircle,
  CheckCircle2,
  ChevronsUpDown,
  Search,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";
import type { EmployeeListStatus, MailStatus } from "../../../types";
import { employeeList } from "../../../data/employeeList";
import { AddEmployeeForm } from "../AddEmployeeForm/AddEmployeeForm";
import styles from "./EmployeeScreen.module.css";

const columns = ["Employee No.", "Name", "Email", "Office", "Position", "Status"];

const statusClass: Record<EmployeeListStatus, string> = {
  Active: styles.statusActive,
  Inactive: styles.statusInactive,
  Vacation: styles.statusVacation,
};

const statusIcon: Record<EmployeeListStatus, ComponentType<{ size?: number }>> = {
  Active: CheckCircle2,
  Inactive: XCircle,
  Vacation: CheckCircle2,
};

function MailIcon({ status }: { status: MailStatus }) {
  if (status === "verified") {
    return <CheckCircle2 size={15} className={styles.mailVerified} />;
  }
  if (status === "warning") {
    return <AlertCircle size={15} className={styles.mailWarning} />;
  }
  return <AlertCircle size={15} className={styles.mailError} />;
}

export function EmployeeScreen() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Employee List</h2>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search"
          />
        </div>
        <button
          className={styles.addNew}
          type="button"
          onClick={() => setShowAddForm(true)}
        >
          <UserPlus size={16} />
          Add New Employee
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>
                  <span className={styles.th}>
                    {column}
                    <ChevronsUpDown size={14} className={styles.sortIcon} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employeeList.map((row) => {
              const StatusIcon = statusIcon[row.status];
              return (
                <tr key={row.id}>
                  <td className={styles.employeeNo}>{row.employeeNo}</td>
                  <td>
                    <div className={styles.person}>
                      <img
                        className={styles.avatar}
                        src={row.avatar}
                        alt={row.name}
                      />
                      <span className={styles.name}>{row.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.mail}>
                      <MailIcon status={row.mailStatus} />
                      <span className={styles.mailText}>{row.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.department}>
                      <span
                        className={styles.dot}
                        style={{ background: row.departmentColor }}
                      />
                      <span>{row.department}</span>
                    </div>
                  </td>
                  <td className={styles.role}>{row.role}</td>
                  <td>
                    <span
                      className={`${styles.status} ${statusClass[row.status]}`}
                    >
                      <StatusIcon size={13} />
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <AddEmployeeForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}
