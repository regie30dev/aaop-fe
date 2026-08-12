import { api } from "../api/client";
import type { ListEnvelope } from "../api/client";

/**
 * Data-access seam for accountabilities, backed by the aaop-be API.
 * Only the dashboard count is needed today; list/get/mutations can be added
 * here (alongside an accountability screen) the same way offices/properties do.
 */

interface ApiAccountability {
  id: string;
}

/** Total number of accountabilities stored in the DB (from list pagination meta). */
export async function getAccountabilityCount(): Promise<number> {
  const res = await api.get<ListEnvelope<ApiAccountability>>(
    "/accountabilities?pageSize=1",
  );
  return res.pagination?.total ?? res.items.length;
}
