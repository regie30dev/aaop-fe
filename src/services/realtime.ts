import { BASE_URL } from "../api/client";
import { emitEmployeesChanged } from "./employeeEvents";
import { emitOfficesChanged } from "./officeEvents";
import { emitPropertiesChanged } from "./propertyEvents";
import { emitAccountabilitiesChanged } from "./accountabilityEvents";

/**
 * Realtime client: subscribes to the backend's Server-Sent Events stream
 * (`GET /events`) and forwards server-pushed domain events into the app's
 * local pub/sub. This gives true cross-client updates — an employee created
 * in one browser is broadcast to every connected browser, no refresh needed.
 *
 * The browser's EventSource reconnects automatically if the connection drops
 * (e.g. backend restart), so there's no manual retry logic to maintain.
 */
let source: EventSource | null = null;

export function connectRealtime(): () => void {
  // Guard for SSR / non-browser environments.
  if (typeof EventSource === "undefined") return () => {};

  // Close any prior connection so a re-connect can't orphan an EventSource.
  source?.close();

  const es = new EventSource(`${BASE_URL}/events`);
  source = es;

  // A server-pushed employee change → nudge the same local signal the UI
  // already listens to (StatCards, etc.). Payload is unused; it's just a "refetch" cue.
  es.addEventListener("employees.changed", () => emitEmployeesChanged());
  es.addEventListener("offices.changed", () => emitOfficesChanged());
  es.addEventListener("properties.changed", () => emitPropertiesChanged());
  es.addEventListener("accountabilities.changed", () =>
    emitAccountabilitiesChanged(),
  );

  // Close exactly the instance this call opened; only clear the shared handle
  // if it still points at it (guards against out-of-order teardown).
  return () => {
    es.close();
    if (source === es) source = null;
  };
}
