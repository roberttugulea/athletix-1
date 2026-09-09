"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import { groupSchema, slotSchema } from "@/lib/validation/groups";
import {
  actionCtx,
  dbError,
  type FieldKind,
  readForm,
  zodErrors,
} from "./_helpers";

const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- Gruppo
const GROUP_SPEC: Record<string, FieldKind> = {
  name: "string",
  facility_id: "string",
  season_id: "string",
  discipline_id: "text",
  capacity: "int",
  active: "bool",
};

export async function createGroup(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("groups.manage");
  if (!c.ok) return c.state;
  const parsed = groupSchema.safeParse(readForm(fd, GROUP_SPEC));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("groups")
    .insert({ ...parsed.data, organization_id: c.org.organizationId })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/gruppi");
  redirect(`/gruppi/${data.id}`);
}

export async function updateGroup(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("groups.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = groupSchema.safeParse(readForm(fd, GROUP_SPEC));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("groups")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/gruppi");
  revalidatePath(`/gruppi/${id}`);
  return { ok: true, message: "Modifiche salvate." };
}

// ------------------------------------------------------------ Fasce orarie
const SLOT_SPEC: Record<string, FieldKind> = {
  space_id: "string",
  weekday: "int",
  starts_at: "string",
  ends_at: "string",
  valid_from: "string",
  valid_to: "text",
};

async function assertGroupInOrg(
  c: Extract<Awaited<ReturnType<typeof actionCtx>>, { ok: true }>,
  groupId: string,
): Promise<boolean> {
  const { data } = await c.supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  return Boolean(data);
}

export async function addSlot(_p: FormState, fd: FormData): Promise<FormState> {
  const c = await actionCtx("groups.manage");
  if (!c.ok) return c.state;
  const groupId = String(fd.get("group_id") ?? "");
  if (!groupId || !(await assertGroupInOrg(c, groupId)))
    return { message: "Gruppo non trovato." };

  const parsed = slotSchema.safeParse(readForm(fd, SLOT_SPEC));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase.from("group_schedule_slots").insert({
    ...parsed.data,
    group_id: groupId,
    organization_id: c.org.organizationId,
  });
  if (error) {
    if (error.code === "23P01")
      return {
        message:
          "Sovrapposizione: nello stesso spazio esiste già una fascia oraria che si accavalla in quel giorno.",
      };
    return { message: dbError(error) };
  }

  revalidatePath(`/gruppi/${groupId}`);
  return { ok: true, message: "Fascia oraria aggiunta." };
}

export async function removeSlot(
  slotId: string,
  groupId: string,
): Promise<void> {
  const c = await actionCtx("groups.manage");
  if (!c.ok) return;
  await c.supabase
    .from("group_schedule_slots")
    .delete()
    .eq("id", slotId)
    .eq("organization_id", c.org.organizationId);
  revalidatePath(`/gruppi/${groupId}`);
}

// ------------------------------------------------------------------- Coach
export async function assignCoach(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("groups.manage");
  if (!c.ok) return c.state;
  const groupId = String(fd.get("group_id") ?? "");
  const coachId = String(fd.get("coach_id") ?? "");
  const isLead = fd.get("is_lead") === "on";
  if (!groupId || !coachId) return { message: "Dati incompleti." };
  if (!(await assertGroupInOrg(c, groupId)))
    return { message: "Gruppo non trovato." };

  const { error } = await c.supabase.from("coach_groups").insert({
    coach_id: coachId,
    group_id: groupId,
    is_lead: isLead,
    starts_on: today(),
  });
  if (error) {
    if (error.code === "23505")
      return { message: "Questo coach è già assegnato al gruppo." };
    return { message: dbError(error) };
  }

  revalidatePath(`/gruppi/${groupId}`);
  return { ok: true, message: "Coach assegnato." };
}

export async function unassignCoach(
  coachId: string,
  groupId: string,
): Promise<void> {
  const c = await actionCtx("groups.manage");
  if (!c.ok) return;
  await c.supabase
    .from("coach_groups")
    .delete()
    .eq("coach_id", coachId)
    .eq("group_id", groupId);
  revalidatePath(`/gruppi/${groupId}`);
}

// ------------------------------------------------------------------ Atleti
export async function enrollAthlete(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("groups.manage");
  if (!c.ok) return c.state;
  const groupId = String(fd.get("group_id") ?? "");
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!groupId || !athleteId) return { message: "Dati incompleti." };

  const { data: group } = await c.supabase
    .from("groups")
    .select("capacity")
    .eq("id", groupId)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!group) return { message: "Gruppo non trovato." };

  const { data: existing } = await c.supabase
    .from("athlete_groups")
    .select("athlete_id")
    .eq("group_id", groupId)
    .eq("athlete_id", athleteId)
    .is("ends_on", null)
    .maybeSingle();
  if (existing) return { message: "Atleta già iscritto al gruppo." };

  if (group.capacity != null) {
    const { count } = await c.supabase
      .from("athlete_groups")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .is("ends_on", null);
    if ((count ?? 0) >= group.capacity)
      return { message: `Gruppo al completo (capienza ${group.capacity}).` };
  }

  const { error } = await c.supabase.from("athlete_groups").insert({
    athlete_id: athleteId,
    group_id: groupId,
    starts_on: today(),
  });
  if (error) {
    if (error.code === "23505")
      return { message: "Iscrizione già registrata per oggi." };
    return { message: dbError(error) };
  }

  revalidatePath(`/gruppi/${groupId}`);
  return { ok: true, message: "Atleta iscritto." };
}

export async function unenrollAthlete(
  athleteId: string,
  groupId: string,
): Promise<void> {
  const c = await actionCtx("groups.manage");
  if (!c.ok) return;
  await c.supabase
    .from("athlete_groups")
    .update({ ends_on: today() })
    .eq("athlete_id", athleteId)
    .eq("group_id", groupId)
    .is("ends_on", null);
  revalidatePath(`/gruppi/${groupId}`);
}
