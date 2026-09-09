"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import {
  disciplineSchema,
  facilitySchema,
  seasonSchema,
  spaceSchema,
} from "@/lib/validation/config";
import {
  actionCtx as ctx,
  type ActionCtx as Ctx,
  dbError,
  type FieldKind,
  readForm as read,
  zodErrors as fieldErrors,
} from "./_helpers";

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
