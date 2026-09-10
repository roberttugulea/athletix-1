"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  revalidatePath("/notifiche");
  revalidatePath("/area/notifiche");
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead(): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  revalidatePath("/notifiche");
  revalidatePath("/area/notifiche");
  revalidatePath("/dashboard");
}
