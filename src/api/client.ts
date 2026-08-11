/**
 * Thin fetch wrapper for the aaop-be API.
 *
 * Base URL comes from VITE_API_URL (see .env), defaulting to the backend's
 * local dev address + versioned prefix (PORT 4000, API_PREFIX /api/v1).
 */
export const BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data?: T;
}

/** Standard list response from the backend (crudController + paginate). */
export interface ListEnvelope<T> {
  status: string;
  items: T[];
  pagination?: { page: number; pageSize: number; total: number; totalPages: number };
}

/** Standard single-item response from the backend. */
export interface ItemEnvelope<T> {
  status: string;
  data: T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Is the backend (aaop-be) running on " +
        `${BASE_URL}?`,
    );
  }

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok) {
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
