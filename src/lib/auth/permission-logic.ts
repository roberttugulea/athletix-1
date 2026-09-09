/**
 * Logica dei permessi, senza dipendenze da server/DB così da essere testabile
 * in isolamento. Le funzioni con accesso ai dati stanno in `permissions.ts`.
 */

export type PermissionKey =
  | "organization.manage"
  | "facilities.manage"
  | "people.manage"
  | "groups.manage"
  | "finance.manage"
  | "attendance.manage"
  | "competitions.manage"
  | "communications.manage"
  | "reports.read"
  | "documents.manage";

/** Un utente con `organization.manage` ha implicitamente ogni permesso. */
export function resolvePermission(
  granted: Iterable<string>,
  key: PermissionKey,
): boolean {
  const set = granted instanceof Set ? granted : new Set(granted);
  return set.has("organization.manage") || set.has(key);
}
