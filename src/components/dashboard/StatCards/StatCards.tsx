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
import { getDashboardStats } from "../../../services/stats";
import type { DashboardStats } from "../../../services/stats";
import { onEmployeesChanged } from "../../../services/employeeEvents";
import { onOfficesChanged } from "../../../services/officeEvents";
import { onPropertiesChanged } from "../../../services/propertyEvents";
import { onAccountabilitiesChanged } from "../../../services/accountabilityEvents";
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
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // One request pulls all four counts (see backend GET /stats).
    const refresh = () => {
      getDashboardStats()
        .then((next) => {
          if (active) setStats(next);
        })
        .catch(() => {
          /* keep the last-known values if the fetch fails */
        });
    };

    // Any single mutation emits its own "*.changed" event, and a bulk action
    // can emit several in quick succession. Coalesce them into one refetch so
    // a burst of events doesn't fan out into a burst of requests.
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    };

    refresh();
    const unsubscribers = [
      onEmployeesChanged(scheduleRefresh),
      onOfficesChanged(scheduleRefresh),
      onPropertiesChanged(scheduleRefresh),
      onAccountabilitiesChanged(scheduleRefresh),
    ];

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, []);

  const valueFor = (count: number | undefined): string =>
    count === undefined ? "…" : String(count);

  const cards = getStatCards().map((card) => {
    if (card.id === "total-employees") {
      return { ...card, value: valueFor(stats?.employees) };
    }
    if (card.id === "departments") {
      return { ...card, value: valueFor(stats?.offices) };
    }
    if (card.id === "properties") {
      return { ...card, value: valueFor(stats?.properties) };
    }
    if (card.id === "accountabilities") {
      return { ...card, value: valueFor(stats?.accountabilities) };
    }
    return card;
  });

  return (
    <section className={styles.grid}>
      {cards.map((card) => (
        <StatCard key={card.id} card={card} />
      ))}
    </section>
  );
}
