import { api } from "../api/client";
import type { ItemEnvelope } from "../api/client";

/**
 * Dashboard summary counts, fetched in a single request from the backend's
 * aggregate `/stats` endpoint. This replaces four separate `?pageSize=1` count
 * calls (one per resource) with one round-trip — the StatCards' fan-out was a
 * big contributor to tripping the API rate limiter.
 */
export interface DashboardStats {
  employees: number;
  properties: number;
  offices: number;
  accountabilities: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<ItemEnvelope<DashboardStats>>("/stats");
  return res.data;
}
