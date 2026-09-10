"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ACTIVE_ORG_COOKIE, getMemberships } from "@/lib/auth/session";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { orgSettingsSchema } from "@/lib/validation/config";
import { actionCtx, dbError, zodErrors } from "./_helpers";

const ORG_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function switchOrganization(organizationId: string): Promise<void> {
  const memberships = await getMemberships();
  if (!memberships.some((m) => m.organizationId === organizationId)) {
    throw new Error("Organizzazione non disponibile per questo utente.");
  }
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, ORG_COOKIE_OPTIONS);
  redirect("/dashboard");
}

const provisionSchema = z.object({
  name: z.string().trim().min(2, "Il nome deve avere almeno 2 caratteri"),
  firstName: z.string().trim().min(1, "Inserisci il nome"),
  lastName: z.string().trim().min(1, "Inserisci il cognome"),
});

export async function provisionOrganization(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = provisionSchema.safeParse({
    name: formData.get("name"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("provision_organization", {
    p_name: parsed.data.name,
    p_admin_first_name: parsed.data.firstName,
    p_admin_last_name: parsed.data.lastName,
  });

  if (error || !data) {
    return {
      message: "Impossibile creare l'organizzazione. Riprova più tardi.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, data as string, ORG_COOKIE_OPTIONS);
  redirect("/dashboard");
}

export async function updateOrgSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const c = await actionCtx("organization.manage");
  if (!c.ok) return c.state;

  const parsed = orgSettingsSchema.safeParse({
    fee_grace_days: Number(formData.get("fee_grace_days")),
    certificate_alert_days: Number(formData.get("certificate_alert_days")),
    membership_alert_days: Number(formData.get("membership_alert_days")),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("organization_settings")
    .update(parsed.data)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/impostazioni/organizzazione");
  revalidatePath("/certificati");
  revalidatePath("/tesseramenti");
  return { ok: true, message: "Impostazioni salvate." };
}
