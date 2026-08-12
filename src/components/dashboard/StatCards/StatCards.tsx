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
import { onEmployeesChanged } from "../../../services/employeeEvents";
import { getOfficeCount } from "../../../services/offices";
import { onOfficesChanged } from "../../../services/officeEvents";
import { getPropertyCount } from "../../../services/properties";
import { onPropertiesChanged } from "../../../services/propertyEvents";
import { getAccountabilityCount } from "../../../services/accountabilities";
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
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [officeCount, setOfficeCount] = useState<number | null>(null);
  const [propertyCount, setPropertyCount] = useState<number | null>(null);
  const [accountabilityCount, setAccountabilityCount] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    const refreshEmployees = () => {
      getEmployeeCount()
        .then((count) => {
          if (active) setEmployeeCount(count);
        })
        .catch(() => {
          /* leave the placeholder if the count can't be fetched */
        });
    };

    const refreshOffices = () => {
      getOfficeCount()
        .then((count) => {
          if (active) setOfficeCount(count);
        })
        .catch(() => {
          /* leave the placeholder if the count can't be fetched */
        });
    };

    const refreshProperties = () => {
      getPropertyCount()
        .then((count) => {
          if (active) setPropertyCount(count);
        })
        .catch(() => {
          /* leave the placeholder if the count can't be fetched */
        });
    };

    const refreshAccountabilities = () => {
      getAccountabilityCount()
        .then((count) => {
          if (active) setAccountabilityCount(count);
        })
        .catch(() => {
          /* leave the placeholder if the count can't be fetched */
        });
    };

    refreshEmployees();
    refreshOffices();
    refreshProperties();
    refreshAccountabilities();
    const unsubEmployees = onEmployeesChanged(refreshEmployees);
    const unsubOffices = onOfficesChanged(refreshOffices);
    const unsubProperties = onPropertiesChanged(refreshProperties);
    const unsubAccountabilities = onAccountabilitiesChanged(
      refreshAccountabilities,
    );

    return () => {
      active = false;
      unsubEmployees();
      unsubOffices();
      unsubProperties();
      unsubAccountabilities();
    };
  }, []);

  const cards = getStatCards().map((card) => {
    if (card.id === "total-employees") {
      return {
        ...card,
        value: employeeCount === null ? "…" : String(employeeCount),
      };
    }
    if (card.id === "departments") {
      return { ...card, value: officeCount === null ? "…" : String(officeCount) };
    }
    if (card.id === "properties") {
      return {
        ...card,
        value: propertyCount === null ? "…" : String(propertyCount),
      };
    }
    if (card.id === "accountabilities") {
      return {
        ...card,
        value:
          accountabilityCount === null ? "…" : String(accountabilityCount),
      };
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
