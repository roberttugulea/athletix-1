"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/lib/forms";
import { actionCtx, dbError, zodErrors } from "./_helpers";

const trialSchema = z.object({
  contact_name: z.string().min(1, "Obbligatorio").max(120),
  contact_email: z.string().email("Email non valida").or(z.literal("")),
  contact_phone: z.string().max(30),
  facility_id: z.uuid("Seleziona una struttura"),
  group_id: z.union([z.uuid(), z.literal("")]),
  scheduled_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Data/ora non valida"),
  notes: z.string().max(500),
});

export async function addTrial(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;

  const parsed = trialSchema.safeParse({
    contact_name: (fd.get("contact_name") as string) ?? "",
    contact_email: (fd.get("contact_email") as string) ?? "",
    contact_phone: (fd.get("contact_phone") as string) ?? "",
    facility_id: (fd.get("facility_id") as string) ?? "",
    group_id: (fd.get("group_id") as string) ?? "",
    scheduled_at: (fd.get("scheduled_at") as string) ?? "",
    notes: (fd.get("notes") as string) ?? "",
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase.rpc("add_trial_lesson", {
    p_contact_name: parsed.data.contact_name,
    p_contact_email: parsed.data.contact_email || "",
    p_contact_phone: parsed.data.contact_phone || "",
    p_facility: parsed.data.facility_id,
    p_group: (parsed.data.group_id || null) as string,
    p_local_datetime: parsed.data.scheduled_at,
    p_notes: parsed.data.notes || "",
  });
  if (error) return { message: dbError(error) };

  revalidatePath("/prove");
  return { ok: true, message: "Prova registrata." };
}

export async function setTrialStatus(
  trialId: string,
  status: "scheduled" | "attended" | "cancelled" | "converted",
): Promise<void> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return;
  await c.supabase
    .from("trial_lessons")
    .update({ status })
    .eq("id", trialId)
    .eq("organization_id", c.org.organizationId);
  revalidatePath("/prove");
}
