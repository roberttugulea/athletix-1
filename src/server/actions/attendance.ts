"use server";

import { revalidatePath } from "next/cache";

import { isAttendanceStatus } from "@/lib/validation/attendance";
import type { FormState } from "@/lib/forms";
import { actionCtx, dbError } from "./_helpers";

export async function saveAttendance(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("attendance.manage");
  if (!c.ok) return c.state;

  const sessionId = String(fd.get("session_id") ?? "");
  if (!sessionId) return { message: "Sessione non indicata." };

  const {
    data: { user },
  } = await c.supabase.auth.getUser();
  const recordedAt = new Date().toISOString();

  const rows: {
    training_session_id: string;
    athlete_id: string;
    status: "present" | "absent" | "late" | "justified";
    recorded_by: string | null;
    recorded_at: string;
  }[] = [];

  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("att_")) continue;
    if (!isAttendanceStatus(value)) continue;
    rows.push({
      training_session_id: sessionId,
      athlete_id: key.slice(4),
      status: value,
      recorded_by: user?.id ?? null,
      recorded_at: recordedAt,
    });
  }

  if (rows.length === 0) return { ok: true, message: "Nessuna presenza indicata." };

  const { error } = await c.supabase
    .from("attendances")
    .upsert(rows, { onConflict: "training_session_id,athlete_id" });
  if (error) return { message: dbError(error) };

  await c.supabase
    .from("training_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId)
    .eq("organization_id", c.org.organizationId)
    .neq("status", "cancelled");

  revalidatePath(`/presenze/${sessionId}`);
  revalidatePath("/presenze");
  return { ok: true, message: "Presenze salvate." };
}
