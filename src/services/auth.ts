import { api } from "../api/client";

/**
 * Validates credentials against the backend AccessControl table.
 * Resolves on success; throws with the server's message on failure
 * (401 for bad credentials, 400 for missing fields).
 */
export async function login(username: string, password: string): Promise<void> {
  await api.post("/auth/login", { username, password });
}
