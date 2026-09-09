"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasPermission, type PermissionKey } from "@/lib/auth/permissions";
import { type Membership, requireActiveOrg } from "@/lib/auth/session";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import {
  disciplineSchema,
  facilitySchema,
  seasonSchema,
  spaceSchema,
} from "@/lib/validation/config";

type FieldKind = "string" | "text" | "int" | "bool";

/** Estrae e tipizza i campi da un FormData secondo lo spec indicato. */
function read(fd: FormData, spec: Record<string, FieldKind>) {
  const out: Record<string, unknown> = {};
  for (const [key, kind] of Object.entries(spec)) {
    const raw = fd.get(key);
    const s = typeof raw === "string" ? raw.trim() : "";
    if (kind === "bool") out[key] = raw === "on" || raw === "true";
    else if (kind === "int") out[key] = s === "" ? null : Number(s);
    else if (kind === "text") out[key] = s === "" ? null : s;
    else out[key] = s;
  }
  return out;
}

function dbError(error: { message: string; code?: string }): string {
  if (error.code === "23505")
    return "Esiste già un elemento con questo nome nell'organizzazione.";
  if (error.code === "23503") return "Riferimento non valido.";
  return "Operazione non riuscita. Riprova più tardi.";
}

type Ctx =
  | { ok: true; org: Membership; supabase: SupabaseServerClient }
  | { ok: false; state: FormState };

async function ctx(permission: PermissionKey): Promise<Ctx> {
  const org = await requireActiveOrg();
  if (!(await hasPermission(org.organizationId, permission))) {
    return {
      ok: false,
      state: { message: "Non hai i permessi per questa operazione." },
    };
  }
  return { ok: true, org, supabase: await createClient() };
}

function fieldErrors(error: z.ZodError): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors };
}

// ---------------------------------------------------------------- Strutture
const FACILITY_SPEC: Record<string, FieldKind> = {
  name: "string",
  address_line1: "text",
  city: "text",
  province: "text",
  postal_code: "text",
  active: "bool",
};

export async function createFacility(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await ctx("facilities.manage");
  if (!c.ok) return c.state;
  const parsed = facilitySchema.safeParse(read(fd, FACILITY_SPEC));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { error } = await c.supabase
    .from("facilities")
    .insert({ ...parsed.data, organization_id: c.org.organizationId });
  if (error) return { message: dbError(error) };
  revalidatePath("/impostazioni/strutture");
  redirect("/impostazioni/strutture");
}

export async function updateFacility(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await ctx("facilities.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = facilitySchema.safeParse(read(fd, FACILITY_SPEC));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { error } = await c.supabase
    .from("facilities")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };
  revalidatePath("/impostazioni/strutture");
  redirect("/impostazioni/strutture");
}

// ------------------------------------------------------------------- Spazi
const SPACE_SPEC: Record<string, FieldKind> = {
  facility_id: "string",
  name: "string",
  capacity: "int",
  active: "bool",
};

export async function createSpace(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await ctx("facilities.manage");
  if (!c.ok) return c.state;
  const parsed = spaceSchema.safeParse(read(fd, SPACE_SPEC));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { error } = await c.supabase
    .from("spaces")
    .insert({ ...parsed.data, organization_id: c.org.organizationId });
  if (error) return { message: dbError(error) };
  revalidatePath("/impostazioni/spazi");
  redirect("/impostazioni/spazi");
}

export async function updateSpace(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await ctx("facilities.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = spaceSchema.safeParse(read(fd, SPACE_SPEC));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { error } = await c.supabase
    .from("spaces")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };
  revalidatePath("/impostazioni/spazi");
  redirect("/impostazioni/spazi");
}

// --------------------------------------------------------------- Stagioni
const SEASON_SPEC: Record<string, FieldKind> = {
  name: "string",
  starts_on: "string",
  ends_on: "string",
  is_current: "bool",
};

async function clearCurrentSeason(c: Extract<Ctx, { ok: true }>) {
  await c.supabase
    .from("seasons")
    .update({ is_current: false })
    .eq("organization_id", c.org.organizationId)
    .eq("is_current", true);
}

export async function createSeason(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await ctx("facilities.manage");
  if (!c.ok) return c.state;
  const parsed = seasonSchema.safeParse(read(fd, SEASON_SPEC));
  if (!parsed.success) return fieldErrors(parsed.error);
  if (parsed.data.is_current) await clearCurrentSeason(c);
  const { error } = await c.supabase
    .from("seasons")
    .insert({ ...parsed.data, organization_id: c.org.organizationId });
  if (error) return { message: dbError(error) };
  revalidatePath("/impostazioni/stagioni");
  redirect("/impostazioni/stagioni");
}

export async function updateSeason(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await ctx("facilities.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = seasonSchema.safeParse(read(fd, SEASON_SPEC));
  if (!parsed.success) return fieldErrors(parsed.error);
  if (parsed.data.is_current) await clearCurrentSeason(c);
  const { error } = await c.supabase
    .from("seasons")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };
  revalidatePath("/impostazioni/stagioni");
  redirect("/impostazioni/stagioni");
}

// --------------------------------------------------------------- Discipline
const DISCIPLINE_SPEC: Record<string, FieldKind> = {
  name: "string",
  color: "text",
  active: "bool",
};

export async function createDiscipline(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await ctx("facilities.manage");
  if (!c.ok) return c.state;
  const parsed = disciplineSchema.safeParse(read(fd, DISCIPLINE_SPEC));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { error } = await c.supabase
    .from("disciplines")
    .insert({ ...parsed.data, organization_id: c.org.organizationId });
  if (error) return { message: dbError(error) };
  revalidatePath("/impostazioni/discipline");
  redirect("/impostazioni/discipline");
}

export async function updateDiscipline(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await ctx("facilities.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = disciplineSchema.safeParse(read(fd, DISCIPLINE_SPEC));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { error } = await c.supabase
    .from("disciplines")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };
  revalidatePath("/impostazioni/discipline");
  redirect("/impostazioni/discipline");
}
