"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureAccount, tempPasswordMessage } from "@/lib/auth/provision";
import type { FormState } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionCtx, zodErrors } from "./_helpers";

const LAST_ADMIN = "Deve restare almeno un amministratore attivo";

const inviteSchema = z.object({
  email: z.email("Email non valida"),
  first_name: z.string().min(1, "Obbligatorio").max(80),
  last_name: z.string().min(1, "Obbligatorio").max(80),
  role_ids: z.array(z.uuid()).min(1, "Assegna almeno un ruolo"),
});

export async function inviteMember(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("organization.manage");
  if (!c.ok) return c.state;

  const parsed = inviteSchema.safeParse({
    email: fd.get("email"),
    first_name: fd.get("first_name"),
    last_name: fd.get("last_name"),
    role_ids: fd.getAll("role_ids").map(String),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  // I ruoli devono appartenere all'organizzazione attiva.
  const { data: roles } = await c.supabase
    .from("roles")
    .select("id")
    .eq("organization_id", c.org.organizationId)
    .in("id", parsed.data.role_ids);
  if (!roles || roles.length !== parsed.data.role_ids.length)
    return { message: "Ruolo non valido." };

  const admin = createAdminClient();
  const acc = await ensureAccount(
    admin,
    parsed.data.email,
    parsed.data.first_name,
    parsed.data.last_name,
  );
  if (!acc.ok) return { message: acc.message };

  const { error } = await c.supabase.rpc("add_org_member", {
    p_org: c.org.organizationId,
    p_profile: acc.userId,
    p_role_ids: parsed.data.role_ids,
  });
  if (error) return { message: "Aggiunta del membro non riuscita." };

  revalidatePath("/impostazioni/utenti");
  return {
    ok: true,
    message: `${parsed.data.first_name} ${parsed.data.last_name} aggiunto. ${tempPasswordMessage(acc.tempPassword)}`,
  };
}

export async function setMemberRoles(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("organization.manage");
  if (!c.ok) return c.state;

  const memberId = String(fd.get("member_id") ?? "");
  const roleIds = fd.getAll("role_ids").map(String);
  if (!memberId) return { message: "Membro non indicato." };
  if (roleIds.length === 0) return { message: "Assegna almeno un ruolo." };

  const { error } = await c.supabase.rpc("set_member_roles", {
    p_member: memberId,
    p_role_ids: roleIds,
  });
  if (error) {
    return { message: error.message.includes(LAST_ADMIN) ? LAST_ADMIN + "." : "Modifica non riuscita." };
  }

  revalidatePath("/impostazioni/utenti");
  return { ok: true, message: "Ruoli aggiornati." };
}

export async function setMemberStatus(
  memberId: string,
  status: "active" | "suspended",
): Promise<void> {
  const c = await actionCtx("organization.manage");
  if (!c.ok) return;
  await c.supabase.rpc("set_member_status", {
    p_member: memberId,
    p_status: status,
  });
  revalidatePath("/impostazioni/utenti");
}
