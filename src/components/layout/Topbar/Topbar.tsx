import { Bell, Menu, Search, Settings } from "lucide-react";
import styles from "./Topbar.module.css";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.titleGroup}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.actions}>
        <div className={styles.search}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search here"
          />
          <kbd className={styles.kbd}>⌘K</kbd>
        </div>

        <button className={styles.iconButton} type="button" aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.badge} />
        </button>
        <button className={styles.iconButton} type="button" aria-label="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
