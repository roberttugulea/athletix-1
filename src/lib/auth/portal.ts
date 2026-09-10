import "server-only";

import { cache } from "react";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type PortalAthlete = {
  id: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organizationName: string;
  relation: "self" | "guardian";
};

export type PortalIdentity = {
  isPortalUser: boolean;
  athletes: PortalAthlete[];
};

/**
 * Atleti a cui l'utente corrente ha accesso dall'area personale:
 * sé stesso (`athletes.profile_id`) e i minori di cui è tutore
 * (`athlete_guardians` → `guardians.profile_id`). Memoizzato per render.
 */
export const getPortalIdentity = cache(async (): Promise<PortalIdentity> => {
  const user = await getSessionUser();
  if (!user) return { isPortalUser: false, athletes: [] };

  const supabase = await createClient();

  const [selfRes, guardRes] = await Promise.all([
    supabase
      .from("athletes")
      .select("id, first_name, last_name, organization_id, organizations(name)")
      .eq("profile_id", user.id),
    supabase
      .from("athlete_guardians")
      .select(
        "athletes(id, first_name, last_name, organization_id, organizations(name)), guardians!inner(profile_id)",
      )
      .eq("guardians.profile_id", user.id),
  ]);

  const byId = new Map<string, PortalAthlete>();

  for (const a of selfRes.data ?? []) {
    const org = a.organizations as { name: string } | null;
    byId.set(a.id, {
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      organizationId: a.organization_id,
      organizationName: org?.name ?? "Società",
      relation: "self",
    });
  }

  for (const row of guardRes.data ?? []) {
    const a = row.athletes as {
      id: string;
      first_name: string;
      last_name: string;
      organization_id: string;
      organizations: { name: string } | null;
    } | null;
    if (!a || byId.has(a.id)) continue;
    byId.set(a.id, {
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      organizationId: a.organization_id,
      organizationName: a.organizations?.name ?? "Società",
      relation: "guardian",
    });
  }

  const athletes = [...byId.values()].sort((x, y) =>
    `${x.lastName} ${x.firstName}`.localeCompare(`${y.lastName} ${y.firstName}`),
  );

  return { isPortalUser: athletes.length > 0, athletes };
});
