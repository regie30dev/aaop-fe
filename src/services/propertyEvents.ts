/**
 * Tiny pub/sub so views can react when the property dataset changes (create /
 * update / delete) without a page refresh or a state-management library.
 *
 * The property service emits after a successful mutation; interested views
 * (e.g. the dashboard's Properties card) subscribe and refetch.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to property-data changes. Returns an unsubscribe function. */
export function onPropertiesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify all subscribers that the property dataset changed. */
export function emitPropertiesChanged(): void {
  for (const listener of listeners) listener();
}
