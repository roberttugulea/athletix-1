"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/lib/forms";
import { guardianSchema } from "@/lib/validation/guardians";
import {
  actionCtx,
  dbError,
  type FieldKind,
  readForm,
  zodErrors,
} from "./_helpers";

const SPEC: Record<string, FieldKind> = {
  first_name: "string",
  last_name: "string",
  relationship: "string",
  tax_code: "text",
  email: "text",
  phone: "text",
  is_primary: "bool",
};

export async function addGuardian(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;

  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!athleteId) return { message: "Atleta non indicato." };

  const raw = readForm(fd, SPEC);
  const tax = raw.tax_code;
  const parsed = guardianSchema.safeParse({
    ...raw,
    tax_code:
      typeof tax === "string" ? tax.toUpperCase().replace(/\s/g, "") : null,
  });
  if (!parsed.success) return zodErrors(parsed.error);

  // L'atleta deve appartenere all'organizzazione attiva.
  const { data: athlete } = await c.supabase
    .from("athletes")
    .select("id")
    .eq("id", athleteId)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!athlete) return { message: "Atleta non trovato." };

  const { relationship, is_primary, ...guardianData } = parsed.data;

  const { data: guardian, error: gErr } = await c.supabase
    .from("guardians")
    .insert({ ...guardianData, organization_id: c.org.organizationId })
    .select("id")
    .single();
  if (gErr || !guardian) return { message: dbError(gErr ?? { message: "" }) };

  if (is_primary) {
    await c.supabase
      .from("athlete_guardians")
      .update({ is_primary: false })
      .eq("athlete_id", athleteId);
  }

  const { error: linkErr } = await c.supabase
    .from("athlete_guardians")
    .insert({
      athlete_id: athleteId,
      guardian_id: guardian.id,
      relationship,
      is_primary,
    });

  if (linkErr) {
    // Rollback del guardian orfano; il trigger limita a 2 tutori per atleta.
    await c.supabase.from("guardians").delete().eq("id", guardian.id);
    if (linkErr.message.toLowerCase().includes("two guardians")) {
      return { message: "Un atleta può avere al massimo due tutori." };
    }
    return { message: dbError(linkErr) };
  }

  revalidatePath(`/atleti/${athleteId}`);
  return { ok: true, message: "Tutore aggiunto." };
}

export async function removeGuardian(
  athleteId: string,
  guardianId: string,
): Promise<void> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return;
  await c.supabase
    .from("athlete_guardians")
    .delete()
    .eq("athlete_id", athleteId)
    .eq("guardian_id", guardianId);
  revalidatePath(`/atleti/${athleteId}`);
}
