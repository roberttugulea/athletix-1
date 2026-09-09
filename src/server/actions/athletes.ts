"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import { athleteSchema } from "@/lib/validation/athletes";
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
  birth_date: "string",
  tax_code: "text",
  email: "text",
  phone: "text",
  status: "string",
};

function normalize(data: Record<string, unknown>) {
  const taxRaw = data.tax_code;
  return {
    ...data,
    tax_code:
      typeof taxRaw === "string" ? taxRaw.toUpperCase().replace(/\s/g, "") : null,
    status: data.status === "" ? "active" : data.status,
  };
}

export async function createAthlete(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const parsed = athleteSchema.safeParse(normalize(readForm(fd, SPEC)));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("athletes")
    .insert({ ...parsed.data, organization_id: c.org.organizationId })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/atleti");
  redirect(`/atleti/${data.id}`);
}

export async function updateAthlete(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = athleteSchema.safeParse(normalize(readForm(fd, SPEC)));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("athletes")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/atleti");
  revalidatePath(`/atleti/${id}`);
  return { ok: true, message: "Modifiche salvate." };
}

async function setStatus(
  id: string,
  status: "active" | "archived",
): Promise<void> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return;
  await c.supabase
    .from("athletes")
    .update({
      status,
      left_on: status === "archived" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  revalidatePath("/atleti");
  revalidatePath(`/atleti/${id}`);
}

export async function archiveAthlete(id: string): Promise<void> {
  await setStatus(id, "archived");
  redirect(`/atleti/${id}`);
}

export async function restoreAthlete(id: string): Promise<void> {
  await setStatus(id, "active");
  redirect(`/atleti/${id}`);
}
