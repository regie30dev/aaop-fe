/**
 * Tiny pub/sub so views can react when the office dataset changes (create /
 * update / delete) without a page refresh or a state-management library.
 *
 * The office service emits after a successful mutation; interested views
 * (e.g. the dashboard's Offices card) subscribe and refetch.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to office-data changes. Returns an unsubscribe function. */
export function onOfficesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify all subscribers that the office dataset changed. */
export function emitOfficesChanged(): void {
  for (const listener of listeners) listener();
}
