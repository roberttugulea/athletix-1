"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendEmail } from "@/lib/email";
import type { FormState } from "@/lib/forms";
import {
  communicationSchema,
  RECIPIENT_SCOPES,
} from "@/lib/validation/communications";
import { actionCtx, dbError, zodErrors } from "./_helpers";

function readComm(fd: FormData) {
  return {
    title: String(fd.get("title") ?? "").trim(),
    body: String(fd.get("body") ?? "").trim(),
    channel: String(fd.get("channel") ?? "in_app"),
  };
}

export async function createCommunication(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("communications.manage");
  if (!c.ok) return c.state;

  const parsed = communicationSchema.safeParse(readComm(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("communications")
    .insert({
      ...parsed.data,
      organization_id: c.org.organizationId,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/comunicazioni");
  redirect(`/comunicazioni/${data.id}`);
}

export async function updateCommunication(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("communications.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };

  const parsed = communicationSchema.safeParse(readComm(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("communications")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId)
    .eq("status", "draft");
  if (error) return { message: dbError(error) };

  revalidatePath(`/comunicazioni/${id}`);
  return { ok: true, message: "Bozza salvata." };
}

export async function setCommunicationRecipients(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("communications.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  const scope = String(fd.get("scope") ?? "");
  const groupId = String(fd.get("group_id") ?? "") || null;
  if (!id) return { message: "Identificativo mancante." };
  if (!(RECIPIENT_SCOPES as readonly string[]).includes(scope))
    return { message: "Ambito non valido." };
  if (scope === "group" && !groupId)
    return { message: "Seleziona un gruppo." };

  const { data, error } = await c.supabase.rpc(
    "populate_communication_recipients",
    { p_comm: id, p_scope: scope, p_group: groupId ?? undefined },
  );
  if (error) return { message: "Impossibile impostare i destinatari." };

  revalidatePath(`/comunicazioni/${id}`);
  return { ok: true, message: `${data ?? 0} destinatari impostati.` };
}

export async function sendCommunication(id: string): Promise<void> {
  const c = await actionCtx("communications.manage");
  if (!c.ok) return;

  const { data: comm } = await c.supabase
    .from("communications")
    .select("id, channel, title, body, status")
    .eq("id", id)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!comm || comm.status !== "draft") return;

  const { error } = await c.supabase.rpc("send_communication", { p_comm: id });
  if (error) return;

  if (comm.channel === "email") {
    const { data: emails } = await c.supabase.rpc(
      "communication_recipient_emails",
      { p_comm: id },
    );
    const list = (emails ?? []) as string[];
    if (list.length > 0) {
      await sendEmail({
        to: list,
        subject: comm.title,
        text: comm.body,
      });
    }
  }

  revalidatePath("/comunicazioni");
  revalidatePath(`/comunicazioni/${id}`);
}

export async function cancelCommunication(id: string): Promise<void> {
  const c = await actionCtx("communications.manage");
  if (!c.ok) return;
  await c.supabase
    .from("communications")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("organization_id", c.org.organizationId)
    .in("status", ["draft", "scheduled"]);
  revalidatePath("/comunicazioni");
  revalidatePath(`/comunicazioni/${id}`);
}
