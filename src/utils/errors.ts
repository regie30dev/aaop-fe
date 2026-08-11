/**
 * Shared error helpers.
 *
 * Extracted because `error instanceof Error ? error.message : fallback` was
 * copy-pasted across every async handler (screens, modals). One place to change
 * how thrown values become user-facing messages.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
