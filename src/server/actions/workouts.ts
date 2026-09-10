"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import {
  workoutItemSchema,
  workoutPlanSchema,
} from "@/lib/validation/workouts";
import { actionCtx, dbError, zodErrors } from "./_helpers";

function num(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim().replace(",", ".") : "";
  return s === "" ? null : Number(s);
}
function text(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

async function athleteInOrg(
  supabase: SupabaseServerClient,
  athleteId: string,
  orgId: string,
) {
  const { data } = await supabase
    .from("athletes")
    .select("id")
    .eq("id", athleteId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

// ===================================================== Schede (piani) ===
export async function createWorkoutPlan(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return c.state;
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!athleteId) return { message: "Atleta non indicato." };
  if (!(await athleteInOrg(c.supabase, athleteId, c.org.organizationId)))
    return { message: "Atleta non trovato." };

  const parsed = workoutPlanSchema.safeParse({
    title: fd.get("title"),
    starts_on: fd.get("starts_on"),
    ends_on: text(fd, "ends_on"),
    status: fd.get("status"),
    notes: text(fd, "notes"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("workout_plans")
    .insert({
      ...parsed.data,
      athlete_id: athleteId,
      organization_id: c.org.organizationId,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "42501")
      return { message: "Puoi creare schede solo per i tuoi atleti." };
    return { message: dbError(error ?? { message: "" }) };
  }

  revalidatePath(`/schede/${athleteId}`);
  redirect(`/schede/${athleteId}/${data.id}`);
}

export async function updateWorkoutPlan(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!id) return { message: "Identificativo mancante." };

  const parsed = workoutPlanSchema.safeParse({
    title: fd.get("title"),
    starts_on: fd.get("starts_on"),
    ends_on: text(fd, "ends_on"),
    status: fd.get("status"),
    notes: text(fd, "notes"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("workout_plans")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath(`/schede/${athleteId}`);
  revalidatePath(`/schede/${athleteId}/${id}`);
  return { ok: true, message: "Scheda salvata." };
}

export async function deleteWorkoutPlan(
  id: string,
  athleteId: string,
): Promise<void> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return;
  await c.supabase
    .from("workout_plans")
    .delete()
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  revalidatePath(`/schede/${athleteId}`);
  redirect(`/schede/${athleteId}`);
}

// ===================================================== Esercizi (items) ===
export async function addWorkoutItem(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return c.state;
  const planId = String(fd.get("plan_id") ?? "");
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!planId) return { message: "Scheda non indicata." };

  const parsed = workoutItemSchema.safeParse({
    day_index: num(fd, "day_index") ?? 1,
    exercise: fd.get("exercise"),
    sets: num(fd, "sets"),
    reps: text(fd, "reps"),
    load: text(fd, "load"),
    rest_seconds: num(fd, "rest_seconds"),
    notes: text(fd, "notes"),
    sort: num(fd, "sort") ?? 0,
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("workout_plan_items")
    .insert({ ...parsed.data, plan_id: planId });
  if (error) {
    if (error.code === "42501")
      return { message: "Non puoi modificare questa scheda." };
    return { message: dbError(error) };
  }

  revalidatePath(`/schede/${athleteId}/${planId}`);
  return { ok: true, message: "Esercizio aggiunto." };
}

export async function updateWorkoutItem(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  const planId = String(fd.get("plan_id") ?? "");
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!id) return { message: "Identificativo mancante." };

  const parsed = workoutItemSchema.safeParse({
    day_index: num(fd, "day_index") ?? 1,
    exercise: fd.get("exercise"),
    sets: num(fd, "sets"),
    reps: text(fd, "reps"),
    load: text(fd, "load"),
    rest_seconds: num(fd, "rest_seconds"),
    notes: text(fd, "notes"),
    sort: num(fd, "sort") ?? 0,
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("workout_plan_items")
    .update(parsed.data)
    .eq("id", id)
    .eq("plan_id", planId);
  if (error) return { message: dbError(error) };

  revalidatePath(`/schede/${athleteId}/${planId}`);
  return { ok: true, message: "Esercizio salvato." };
}

export async function removeWorkoutItem(
  id: string,
  planId: string,
  athleteId: string,
): Promise<void> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return;
  await c.supabase
    .from("workout_plan_items")
    .delete()
    .eq("id", id)
    .eq("plan_id", planId);
  revalidatePath(`/schede/${athleteId}/${planId}`);
}
