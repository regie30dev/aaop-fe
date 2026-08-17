import { LogOut } from "lucide-react";
import { SCREENS, SCREEN_ORDER } from "../../../navigation/screens";
import type { ScreenId } from "../../../navigation/screens";
import opLogo from "../../../assets/op-logo.png";
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
          <img
            className={styles.brandLogo}
            src={opLogo}
            alt="Office of the President"
          />
        </span>
        <span className={styles.brandName}>OP Assets</span>
      </div>

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
