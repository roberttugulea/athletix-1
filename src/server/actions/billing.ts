"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import { feePlanSchema, generateFeesSchema } from "@/lib/validation/billing";
import {
  actionCtx,
  dbError,
  type FieldKind,
  readForm,
  zodErrors,
} from "./_helpers";

const FEE_PLAN_SPEC: Record<string, FieldKind> = {
  name: "string",
  season_id: "string",
  group_id: "string",
  monthly_amount: "int",
  due_day: "int",
  prorate_on_mid_month_join: "bool",
  active_from: "string",
  active_to: "string",
};

function readFeePlan(fd: FormData) {
  const raw = readForm(fd, FEE_PLAN_SPEC);
  const amount = fd.get("monthly_amount");
  return {
    ...raw,
    monthly_amount:
      typeof amount === "string" && amount.trim()
        ? Number(amount.trim().replace(",", "."))
        : 0,
    group_id: raw.group_id ?? "",
    active_to: raw.active_to ?? "",
  };
}

function toDbFeePlan(data: {
  name: string;
  season_id: string;
  group_id: string;
  monthly_amount: number;
  due_day: number;
  prorate_on_mid_month_join: boolean;
  active_from: string;
  active_to: string;
}) {
  return {
    name: data.name,
    season_id: data.season_id,
    group_id: data.group_id || null,
    monthly_amount: data.monthly_amount,
    due_day: data.due_day,
    prorate_on_mid_month_join: data.prorate_on_mid_month_join,
    active_from: data.active_from,
    active_to: data.active_to || null,
  };
}

export async function createFeePlan(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return c.state;
  const parsed = feePlanSchema.safeParse(readFeePlan(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("fee_plans")
    .insert({
      ...toDbFeePlan(parsed.data),
      organization_id: c.org.organizationId,
    })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/abbonamenti/piani-quota");
  redirect(`/abbonamenti/piani-quota/${data.id}`);
}

export async function updateFeePlan(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = feePlanSchema.safeParse(readFeePlan(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("fee_plans")
    .update(toDbFeePlan(parsed.data))
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/abbonamenti/piani-quota");
  revalidatePath(`/abbonamenti/piani-quota/${id}`);
  return { ok: true, message: "Modifiche salvate." };
}

export async function generateFees(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return c.state;
  const parsed = generateFeesSchema.safeParse({
    fee_plan_id: fd.get("fee_plan_id"),
    period: fd.get("period"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase.rpc("generate_monthly_fees", {
    p_fee_plan: parsed.data.fee_plan_id,
    p_period: `${parsed.data.period}-01`,
  });
  if (error) return { message: dbError(error) };

  revalidatePath("/abbonamenti/quote");
  const n = typeof data === "number" ? data : 0;
  return {
    ok: true,
    message:
      n === 0
        ? "Nessuna nuova quota (già generate o nessun iscritto)."
        : `${n} quot${n === 1 ? "a" : "e"} generate.`,
  };
}

export async function refreshFeeStatuses(): Promise<void> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return;
  await c.supabase.rpc("refresh_monthly_fee_statuses", {
    p_organization_id: c.org.organizationId,
  });
  revalidatePath("/abbonamenti/quote");
}
