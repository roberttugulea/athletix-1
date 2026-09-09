"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import { coachSchema } from "@/lib/validation/coaches";
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
  tax_code: "text",
  email: "text",
  phone: "text",
  qualifications: "text",
  status: "string",
};

function normalize(raw: Record<string, unknown>) {
  const tax = raw.tax_code;
  const quals = raw.qualifications;
  return {
    ...raw,
    tax_code:
      typeof tax === "string" ? tax.toUpperCase().replace(/\s/g, "") : null,
    qualifications:
      typeof quals === "string" && quals.length
        ? quals
            .split(",")
            .map((q) => q.trim())
            .filter(Boolean)
        : [],
    status: raw.status === "" ? "active" : raw.status,
  };
}

export async function createCoach(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const parsed = coachSchema.safeParse(normalize(readForm(fd, SPEC)));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("coaches")
    .insert({ ...parsed.data, organization_id: c.org.organizationId })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/coach");
  redirect(`/coach/${data.id}`);
}

export async function updateCoach(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = coachSchema.safeParse(normalize(readForm(fd, SPEC)));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("coaches")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/coach");
  revalidatePath(`/coach/${id}`);
  return { ok: true, message: "Modifiche salvate." };
}

async function setStatus(id: string, status: "active" | "archived") {
  const c = await actionCtx("people.manage");
  if (!c.ok) return;
  await c.supabase
    .from("coaches")
    .update({ status })
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  revalidatePath("/coach");
  revalidatePath(`/coach/${id}`);
}

export async function archiveCoach(id: string): Promise<void> {
  await setStatus(id, "archived");
  redirect(`/coach/${id}`);
}

export async function restoreCoach(id: string): Promise<void> {
  await setStatus(id, "active");
  redirect(`/coach/${id}`);
}
