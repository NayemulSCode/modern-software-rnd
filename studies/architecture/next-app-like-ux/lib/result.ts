/**
 * Every Server Action in this app returns one of these two shapes instead of
 * throwing. A thrown error in an action surfaces as a generic error boundary;
 * a returned error lets the UI show a specific message and roll back cleanly.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T) {
  return { ok: true as const, data };
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
