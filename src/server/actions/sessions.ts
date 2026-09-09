"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/lib/forms";
import { generateSessionsSchema } from "@/lib/validation/sessions";
import { actionCtx, dbError, zodErrors } from "./_helpers";

export async function generateSessions(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return c.state;
  const groupId = String(fd.get("group_id") ?? "");
  if (!groupId) return { message: "Gruppo non indicato." };

  const parsed = generateSessionsSchema.safeParse({
    from: fd.get("from"),
    to: fd.get("to"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase.rpc("generate_sessions_for_group", {
    p_group: groupId,
    p_from: parsed.data.from,
    p_to: parsed.data.to,
  });
  if (error) return { message: dbError(error) };

  revalidatePath(`/gruppi/${groupId}`);
  revalidatePath("/calendario");
  const n = typeof data === "number" ? data : 0;
  return {
    ok: true,
    message:
      n === 0
        ? "Nessuna nuova sessione (già presenti o nessuna fascia nell'intervallo)."
        : `${n} session${n === 1 ? "e" : "i"} create.`,
  };
}

async function setSessionStatus(
  sessionId: string,
  groupId: string,
  status: "scheduled" | "cancelled" | "completed",
): Promise<void> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return;
  await c.supabase
    .from("training_sessions")
    .update({ status })
    .eq("id", sessionId)
    .eq("organization_id", c.org.organizationId);
  revalidatePath(`/gruppi/${groupId}`);
  revalidatePath("/calendario");
  revalidatePath(`/presenze/${sessionId}`);
}

export async function cancelSession(
  sessionId: string,
  groupId: string,
): Promise<void> {
  await setSessionStatus(sessionId, groupId, "cancelled");
}

export async function reopenSession(
  sessionId: string,
  groupId: string,
): Promise<void> {
  await setSessionStatus(sessionId, groupId, "scheduled");
}

export async function deleteSession(
  sessionId: string,
  groupId: string,
): Promise<void> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return;
  const { count } = await c.supabase
    .from("attendances")
    .select("*", { count: "exact", head: true })
    .eq("training_session_id", sessionId);
  if ((count ?? 0) > 0) return; // sessione con presenze: usare l'annullamento
  await c.supabase
    .from("training_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("organization_id", c.org.organizationId);
  revalidatePath(`/gruppi/${groupId}`);
  revalidatePath("/calendario");
}
