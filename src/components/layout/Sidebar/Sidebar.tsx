import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Building2,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import styles from "./Sidebar.module.css";

interface NavItem {
  label: string;
  icon: ComponentType<{ size?: number }>;
}

const mainMenu: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Accountability", icon: Wrench },
  { label: "Property", icon: Home },
  { label: "Employee", icon: UserRound },
  { label: "Department", icon: Building2 },
];

interface SidebarProps {
  isOpen: boolean;
  activeScreen: string;
  onSelect: (label: string) => void;
  onClose: () => void;
}

export function Sidebar({ isOpen, activeScreen, onSelect }: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <Users size={18} />
        </span>
        <span className={styles.brandName}>OP Assets</span>
      </div>

      <button className={styles.profile} type="button">
        <img
          className={styles.avatar}
          src="https://i.pravatar.cc/80?img=13"
          alt="Sebastian L."
        />
        <span className={styles.profileText}>
          <span className={styles.profileName}>Sebastian L.</span>
          <span className={styles.profileRole}>HR Manager</span>
        </span>
        <ChevronDown size={16} className={styles.profileChevron} />
      </button>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <p className={styles.sectionTitle}>MAIN MENU</p>
          <ul>
            {mainMenu.map(({ label, icon: Icon }) => {
              const isActive = label === activeScreen;
              return (
                <li key={label}>
                  <button
                    type="button"
                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect(label)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <button className={styles.logout} type="button">
        <LogOut size={18} />
        <span>Log Out</span>
      </button>
    </aside>
  );
}
