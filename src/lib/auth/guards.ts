import "server-only";

import { redirect } from "next/navigation";

import {
  hasPermission,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { type Membership, requireActiveOrg } from "@/lib/auth/session";

/**
 * Da usare in cima a una pagina server di sezione: garantisce sessione +
 * organizzazione attiva + permesso. Se il permesso manca, rimanda alla
 * dashboard con un avviso invece di sollevare un errore.
 */
export async function requirePermission(
  key: PermissionKey,
): Promise<Membership> {
  const org = await requireActiveOrg();
  if (!(await hasPermission(org.organizationId, key))) {
    redirect("/dashboard?denied=1");
  }
  return org;
}
