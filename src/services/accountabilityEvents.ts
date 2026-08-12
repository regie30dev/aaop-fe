/**
 * Tiny pub/sub so views can react when the accountability dataset changes
 * (create / update / delete) without a page refresh or a state-management
 * library.
 *
 * The accountability service emits after a successful mutation; interested
 * views (e.g. the dashboard's Accountabilities card) subscribe and refetch.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to accountability-data changes. Returns an unsubscribe function. */
export function onAccountabilitiesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify all subscribers that the accountability dataset changed. */
export function emitAccountabilitiesChanged(): void {
  for (const listener of listeners) listener();
}
