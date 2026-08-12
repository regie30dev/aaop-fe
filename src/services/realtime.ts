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

  source = new EventSource(`${BASE_URL}/events`);

  // A server-pushed employee change → nudge the same local signal the UI
  // already listens to (StatCards, etc.). Payload is unused; it's just a "refetch" cue.
  source.addEventListener("employees.changed", () => emitEmployeesChanged());
  source.addEventListener("offices.changed", () => emitOfficesChanged());
  source.addEventListener("properties.changed", () => emitPropertiesChanged());
  source.addEventListener("accountabilities.changed", () =>
    emitAccountabilitiesChanged(),
  );

  return () => {
    source?.close();
    source = null;
  };
}
