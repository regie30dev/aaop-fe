import { ChevronDown, LogOut, Users } from "lucide-react";
import { SCREENS, SCREEN_ORDER } from "../../../navigation/screens";
import type { ScreenId } from "../../../navigation/screens";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  activeScreen: ScreenId;
  onSelect: (id: ScreenId) => void;
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
            {SCREEN_ORDER.map((id) => {
              const { label, icon: Icon } = SCREENS[id];
              const isActive = id === activeScreen;
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect(id)}
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
