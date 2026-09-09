import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const ACTIVE_ORG_COOKIE = "athletix-org";

export type SessionUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type Membership = {
  memberId: string;
  organizationId: string;
  organizationName: string;
  status: string;
};

/** Utente autenticato + profilo, memoizzato per render. `null` se non loggato. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Organizzazioni di cui l'utente è membro attivo. */
export const getMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("id, status, organization_id")
    .eq("profile_id", user.id)
    .eq("status", "active");

  if (!members || members.length === 0) return [];

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name")
    .in(
      "id",
      members.map((m) => m.organization_id),
    );

  const nameById = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  return members.map((m) => ({
    memberId: m.id,
    organizationId: m.organization_id,
    organizationName: nameById.get(m.organization_id) ?? "Organizzazione",
    status: m.status,
  }));
});

/** Organizzazione attiva: cookie `athletix-org` validato, altrimenti la prima. */
export const getActiveOrg = cache(async (): Promise<Membership | null> => {
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  return (
    memberships.find((m) => m.organizationId === preferred) ?? memberships[0]
  );
});

export async function requireActiveOrg(): Promise<Membership> {
  await requireUser();
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");
  return org;
}
