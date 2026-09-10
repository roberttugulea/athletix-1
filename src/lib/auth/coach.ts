import "server-only";

import { cache } from "react";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CoachContext = {
  /** L'utente corrente è un coach registrato in questa organizzazione. */
  isCoach: boolean;
  coachId: string | null;
  /** Id dei gruppi attualmente assegnati al coach (assegnazioni non scadute). */
  groupIds: string[];
};

/**
 * Identità "coach" dell'utente corrente nell'organizzazione indicata:
 * riga `coaches` collegata alla sua membership + gruppi assegnati.
 * Memoizzato per render.
 */
export const getCoachContext = cache(
  async (organizationId: string): Promise<CoachContext> => {
    const empty: CoachContext = { isCoach: false, coachId: null, groupIds: [] };
    const user = await getSessionUser();
    if (!user) return empty;

    const supabase = await createClient();

    const { data: member } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("profile_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!member) return empty;

    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("organization_member_id", member.id)
      .maybeSingle();
    if (!coach) return empty;

    const today = new Date().toISOString().slice(0, 10);
    const { data: cg } = await supabase
      .from("coach_groups")
      .select("group_id, ends_on")
      .eq("coach_id", coach.id);

    const groupIds = (cg ?? [])
      .filter((r) => !r.ends_on || r.ends_on >= today)
      .map((r) => r.group_id);

    return { isCoach: true, coachId: coach.id, groupIds };
  },
);
