/**
 * Tiny pub/sub so views can react when the employee dataset changes (create /
 * update / delete) without a page refresh or a state-management library.
 *
 * The employee service emits after a successful mutation; interested views
 * (e.g. the dashboard's Total Employees card) subscribe and refetch.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to employee-data changes. Returns an unsubscribe function. */
export function onEmployeesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify all subscribers that the employee dataset changed. */
export function emitEmployeesChanged(): void {
  for (const listener of listeners) listener();
}
