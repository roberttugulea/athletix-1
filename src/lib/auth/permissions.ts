import "server-only";

import { cache } from "react";

import { PermissionError } from "@/lib/auth/errors";
import {
  type PermissionKey,
  resolvePermission,
} from "@/lib/auth/permission-logic";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export { resolvePermission };
export type { PermissionKey };

/** Permessi dell'utente corrente nell'organizzazione indicata. Memoizzato per render. */
export const getPermissions = cache(
  async (organizationId: string): Promise<Set<string>> => {
    const user = await getSessionUser();
    if (!user) return new Set();

    const supabase = await createClient();
    const { data } = await supabase.rpc("my_permissions", {
      p_org: organizationId,
    });

    return new Set((data ?? []) as string[]);
  },
);

export async function hasPermission(
  organizationId: string,
  key: PermissionKey,
): Promise<boolean> {
  return resolvePermission(await getPermissions(organizationId), key);
}

export async function assertPermission(
  organizationId: string,
  key: PermissionKey,
): Promise<void> {
  if (!(await hasPermission(organizationId, key))) {
    throw new PermissionError(key);
  }
}
