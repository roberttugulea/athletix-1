"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import {
  activateSubscriptionSchema,
  feePlanSchema,
  generateFeesSchema,
  subscriptionPlanSchema,
} from "@/lib/validation/billing";
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

// -------------------------------------------------------- Piani pacchetto
const SUB_PLAN_SPEC: Record<string, FieldKind> = {
  name: "string",
  duration_months: "int",
  discipline_id: "string",
  active: "bool",
};

function readSubPlan(fd: FormData) {
  const raw = readForm(fd, SUB_PLAN_SPEC);
  const price = fd.get("price");
  return {
    ...raw,
    discipline_id: raw.discipline_id ?? "",
    price:
      typeof price === "string" && price.trim()
        ? Number(price.trim().replace(",", "."))
        : 0,
  };
}

function toDbSubPlan(d: {
  name: string;
  duration_months: number;
  price: number;
  discipline_id: string;
  active: boolean;
}) {
  return {
    name: d.name,
    duration_months: d.duration_months,
    price: d.price,
    discipline_id: d.discipline_id || null,
    active: d.active,
  };
}

export async function createSubscriptionPlan(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return c.state;
  const parsed = subscriptionPlanSchema.safeParse(readSubPlan(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase
    .from("subscription_plans")
    .insert({
      ...toDbSubPlan(parsed.data),
      organization_id: c.org.organizationId,
    })
    .select("id")
    .single();
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/abbonamenti/piani-pacchetto");
  redirect(`/abbonamenti/piani-pacchetto/${data.id}`);
}

export async function updateSubscriptionPlan(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };
  const parsed = subscriptionPlanSchema.safeParse(readSubPlan(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase
    .from("subscription_plans")
    .update(toDbSubPlan(parsed.data))
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/abbonamenti/piani-pacchetto");
  revalidatePath(`/abbonamenti/piani-pacchetto/${id}`);
  return { ok: true, message: "Modifiche salvate." };
}

// ------------------------------------------------ Abbonamenti dell'atleta
export async function activateSubscription(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return c.state;
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!athleteId) return { message: "Atleta non indicato." };

  const parsed = activateSubscriptionSchema.safeParse({
    plan_id: fd.get("plan_id"),
    starts_on: fd.get("starts_on"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase.rpc("create_subscription", {
    p_athlete: athleteId,
    p_plan: parsed.data.plan_id,
    p_starts_on: parsed.data.starts_on,
  });
  if (error) return { message: dbError(error) };

  revalidatePath(`/atleti/${athleteId}`);
  return { ok: true, message: "Pacchetto attivato." };
}

export async function cancelSubscription(
  subscriptionId: string,
  athleteId: string,
): Promise<void> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return;
  await c.supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId)
    .eq("organization_id", c.org.organizationId);
  revalidatePath(`/atleti/${athleteId}`);
}
