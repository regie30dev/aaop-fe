import {
  Building2,
  ChevronRight,
  ClipboardCheck,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { StatCard as StatCardType } from "../../../types";
import { getStatCards } from "../../../services/dashboard";
import { getEmployeeCount } from "../../../services/employees";
import styles from "./StatCards.module.css";

const icons: Record<StatCardType["icon"], ComponentType<{ size?: number }>> = {
  employees: Users,
  departments: Building2,
  properties: Package,
  accountabilities: ClipboardCheck,
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
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getEmployeeCount()
      .then((count) => {
        if (active) setEmployeeCount(count);
      })
      .catch(() => {
        /* leave the placeholder if the count can't be fetched */
      });
    return () => {
      active = false;
    };
  }, []);

  const cards = getStatCards().map((card) =>
    card.id === "total-employees"
      ? { ...card, value: employeeCount === null ? "…" : String(employeeCount) }
      : card,
  );

  return (
    <section className={styles.grid}>
      {cards.map((card) => (
        <StatCard key={card.id} card={card} />
      ))}
    </section>
  );
}
