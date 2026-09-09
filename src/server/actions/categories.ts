"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import {
  athleteCategorySchema,
  categorySchema,
} from "@/lib/validation/categories";
import {
  actionCtx,
  dbError,
  type FieldKind,
  readForm,
  zodErrors,
} from "./_helpers";

const today = () => new Date().toISOString().slice(0, 10);

// -------------------------------------------------------------- Categorie
const CATEGORY_SPEC: Record<string, FieldKind> = {
  kind: "string",
  name: "string",
  discipline_id: "text",
  min_value: "int",
  max_value: "int",
  unit: "text",
  active: "bool",
};

function readCategory(fd: FormData) {
  const raw = readForm(fd, CATEGORY_SPEC);
  // min/max sono numerici ma possono avere decimali: rileggo come float.
  const num = (k: string) => {
    const v = fd.get(k);
    const s = typeof v === "string" ? v.trim().replace(",", ".") : "";
    return s === "" ? null : Number(s);
  };
  return { ...raw, min_value: num("min_value"), max_value: num("max_value") };
}

export async function createCategory(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const parsed = categorySchema.safeParse(readCategory(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("categories")
    .insert({ ...parsed.data, organization_id: c.org.organizationId })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/categorie");
  redirect(`/categorie/${data.id}`);
}

export async function updateCategory(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = categorySchema.safeParse(readCategory(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/categorie");
  revalidatePath(`/categorie/${id}`);
  return { ok: true, message: "Modifiche salvate." };
}

// ------------------------------------------------ Assegnazione all'atleta
export async function assignAthleteCategory(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!athleteId) return { message: "Atleta non indicato." };

  const mv = fd.get("measured_value");
  const measured =
    typeof mv === "string" && mv.trim()
      ? Number(mv.trim().replace(",", "."))
      : null;
  const parsed = athleteCategorySchema.safeParse({
    category_id: fd.get("category_id"),
    valid_from: (fd.get("valid_from") as string) || today(),
    measured_value: measured,
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { data: athlete } = await c.supabase
    .from("athletes")
    .select("id")
    .eq("id", athleteId)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!athlete) return { message: "Atleta non trovato." };

  const { error } = await c.supabase
    .from("athlete_categories")
    .insert({ ...parsed.data, athlete_id: athleteId });
  if (error) {
    if (error.code === "23505")
      return { message: "Categoria già assegnata a partire da quella data." };
    return { message: dbError(error) };
  }

  revalidatePath(`/atleti/${athleteId}`);
  return { ok: true, message: "Categoria assegnata." };
}

export async function removeAthleteCategory(
  athleteId: string,
  categoryId: string,
  validFrom: string,
): Promise<void> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return;
  await c.supabase
    .from("athlete_categories")
    .delete()
    .eq("athlete_id", athleteId)
    .eq("category_id", categoryId)
    .eq("valid_from", validFrom);
  revalidatePath(`/atleti/${athleteId}`);
}
