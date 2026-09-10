"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { localInputToUtcISO } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { eventSchema } from "@/lib/validation/competitions";
import { actionCtx, dbError, zodErrors } from "./_helpers";

function txt(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function readEvent(fd: FormData) {
  return {
    title: String(fd.get("title") ?? "").trim(),
    description: txt(fd, "description"),
    facility_id: txt(fd, "facility_id"),
    space_id: txt(fd, "space_id"),
    starts_at: String(fd.get("starts_at") ?? ""),
    ends_at: String(fd.get("ends_at") ?? ""),
  };
}

export async function createEvent(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return c.state;
  const parsed = eventSchema.safeParse(readEvent(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("events")
    .insert({
      ...parsed.data,
      starts_at: localInputToUtcISO(parsed.data.starts_at),
      ends_at: localInputToUtcISO(parsed.data.ends_at),
      organization_id: c.org.organizationId,
    })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/eventi");
  redirect(`/eventi/${data.id}`);
}

export async function updateEvent(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = eventSchema.safeParse(readEvent(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("events")
    .update({
      ...parsed.data,
      starts_at: localInputToUtcISO(parsed.data.starts_at),
      ends_at: localInputToUtcISO(parsed.data.ends_at),
    })
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath(`/eventi/${id}`);
  return { ok: true, message: "Evento salvato." };
}

export async function deleteEvent(id: string): Promise<void> {
  const c = await actionCtx("competitions.manage");
  if (!c.ok) return;
  await c.supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  revalidatePath("/eventi");
  redirect("/eventi");
}
