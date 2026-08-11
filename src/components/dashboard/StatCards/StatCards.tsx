import {
  Building2,
  ChevronRight,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import type { StatCard as StatCardType } from "../../../types";
import { statCards } from "../../../data/dashboardData";
import styles from "./StatCards.module.css";

const icons: Record<StatCardType["icon"], ComponentType<{ size?: number }>> = {
  employees: Users,
  departments: Building2,
  presents: UserCheck,
  absents: UserMinus,
};

function StatCard({ card }: { card: StatCardType }) {
  const Icon = icons[card.icon];
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <span className={styles.iconWrap}>
          <Icon size={18} />
        </span>
        <span className={styles.label}>{card.label}</span>
      </div>

      <div className={styles.value}>{card.value}</div>

      <div className={styles.footer}>
        <span className={styles.trend}>
          <TrendingUp size={13} />
          {card.trend}
        </span>
        <span className={styles.comparison}>{card.comparison}</span>
        <a href="#" className={styles.details}>
          Details <ChevronRight size={13} />
        </a>
      </div>
    </article>
  );
}

export function StatCards() {
  return (
    <section className={styles.grid}>
      {statCards.map((card) => (
        <StatCard key={card.id} card={card} />
      ))}
    </section>
  );
}
