"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import {
  competitionSchema,
  resultSchema,
} from "@/lib/validation/competitions";
import { actionCtx, dbError, zodErrors } from "./_helpers";

function txt(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
function n(fd: FormData, k: string): number | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim().replace(",", ".") : "";
  return s === "" ? null : Number(s);
}

function readCompetition(fd: FormData) {
  return {
    name: String(fd.get("name") ?? "").trim(),
    season_id: txt(fd, "season_id"),
    organizer: txt(fd, "organizer"),
    location: txt(fd, "location"),
    starts_on: String(fd.get("starts_on") ?? ""),
    ends_on: String(fd.get("ends_on") ?? ""),
    registration_deadline: txt(fd, "registration_deadline"),
  };
}

export async function createCompetition(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return c.state;
  const parsed = competitionSchema.safeParse(readCompetition(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("competitions")
    .insert({ ...parsed.data, organization_id: c.org.organizationId })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/gare");
  redirect(`/gare/${data.id}`);
}

export async function updateCompetition(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = competitionSchema.safeParse(readCompetition(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("competitions")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath(`/gare/${id}`);
  return { ok: true, message: "Gara salvata." };
}

// ----------------------------------------------------------- convocazioni
async function competitionInOrg(
  supabase: SupabaseServerClient,
  competitionId: string,
  orgId: string,
) {
  const { data } = await supabase
    .from("competitions")
    .select("id")
    .eq("id", competitionId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

export async function addCall(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return c.state;
  const competitionId = String(fd.get("competition_id") ?? "");
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!competitionId || !athleteId)
    return { message: "Dati mancanti." };
  if (!(await competitionInOrg(c.supabase, competitionId, c.org.organizationId)))
    return { message: "Gara non trovata." };

  const { error } = await c.supabase
    .from("competition_calls")
    .insert({ competition_id: competitionId, athlete_id: athleteId });
  if (error) {
    if (error.code === "23505")
      return { message: "Atleta già convocato." };
    return { message: dbError(error) };
  }

  revalidatePath(`/gare/${competitionId}`);
  return { ok: true, message: "Convocazione aggiunta." };
}

export async function setCallStatus(
  callId: string,
  competitionId: string,
  status: "pending" | "accepted" | "declined" | "withdrawn",
): Promise<void> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return;
  const responded = status === "accepted" || status === "declined";
  await c.supabase
    .from("competition_calls")
    .update({
      status,
      responded_at: responded ? new Date().toISOString() : null,
    })
    .eq("id", callId);
  revalidatePath(`/gare/${competitionId}`);
}

export async function removeCall(
  callId: string,
  competitionId: string,
): Promise<void> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return;
  await c.supabase.from("competition_calls").delete().eq("id", callId);
  revalidatePath(`/gare/${competitionId}`);
}

// --------------------------------------------------------------- risultati
export async function upsertResult(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return c.state;
  const competitionId = String(fd.get("competition_id") ?? "");
  const existingId = String(fd.get("id") ?? "");
  if (!competitionId) return { message: "Gara non indicata." };
  if (!(await competitionInOrg(c.supabase, competitionId, c.org.organizationId)))
    return { message: "Gara non trovata." };

  const parsed = resultSchema.safeParse({
    athlete_id: fd.get("athlete_id"),
    discipline: txt(fd, "discipline"),
    category_id: txt(fd, "category_id"),
    placement: n(fd, "placement"),
    score: n(fd, "score"),
    notes: txt(fd, "notes"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const row = { ...parsed.data, competition_id: competitionId };
  const { error } = existingId
    ? await c.supabase
        .from("competition_results")
        .update(row)
        .eq("id", existingId)
    : await c.supabase.from("competition_results").insert(row);
  if (error) {
    if (error.code === "23505")
      return {
        message: "Esiste già un risultato per questo atleta e disciplina.",
      };
    return { message: dbError(error) };
  }

  revalidatePath(`/gare/${competitionId}`);
  return { ok: true, message: "Risultato salvato." };
}

export async function removeResult(
  resultId: string,
  competitionId: string,
): Promise<void> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return;
  await c.supabase.from("competition_results").delete().eq("id", resultId);
  revalidatePath(`/gare/${competitionId}`);
}
