"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import {
  parseMoney,
  recordPaymentSchema,
  recordRefundSchema,
} from "@/lib/validation/payments";
import { actionCtx, dbError, zodErrors } from "./_helpers";

export async function recordPayment(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return c.state;

  const parsed = recordPaymentSchema.safeParse({
    athlete_id: fd.get("athlete_id"),
    amount: parseMoney(fd.get("amount")),
    paid_on: fd.get("paid_on"),
    method: fd.get("method"),
    monthly_fee_id: fd.get("monthly_fee_id") ?? "",
    subscription_id: fd.get("subscription_id") ?? "",
    external_reference: (fd.get("external_reference") as string) ?? "",
    issue_receipt: fd.get("issue_receipt") === "on",
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { data, error } = await c.supabase.rpc("record_payment", {
    p_athlete: parsed.data.athlete_id,
    p_amount: parsed.data.amount,
    p_paid_on: parsed.data.paid_on,
    p_method: parsed.data.method,
    p_monthly_fee: (parsed.data.monthly_fee_id || null) as string,
    p_subscription: (parsed.data.subscription_id || null) as string,
    p_external_ref: parsed.data.external_reference || "",
    p_issue_receipt: parsed.data.issue_receipt,
  });
  if (error || !data) return { message: dbError(error ?? { message: "" }) };

  revalidatePath("/pagamenti");
  revalidatePath("/abbonamenti/quote");
  revalidatePath(`/atleti/${parsed.data.athlete_id}`);
  redirect(`/pagamenti/${data as string}`);
}

export async function recordRefund(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return c.state;

  const parsed = recordRefundSchema.safeParse({
    payment_id: fd.get("payment_id"),
    amount: parseMoney(fd.get("amount")),
    refunded_on: fd.get("refunded_on"),
    reason: (fd.get("reason") as string) ?? "",
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { error } = await c.supabase.rpc("record_refund", {
    p_payment: parsed.data.payment_id,
    p_amount: parsed.data.amount,
    p_refunded_on: parsed.data.refunded_on,
    p_reason: parsed.data.reason || "",
  });
  if (error) return { message: dbError(error) };

  revalidatePath(`/pagamenti/${parsed.data.payment_id}`);
  return { ok: true, message: "Rimborso registrato." };
}

export async function issueReceipt(paymentId: string): Promise<void> {
  const c = await actionCtx("finance.manage");
  if (!c.ok) return;
  await c.supabase.rpc("issue_receipt", { p_payment: paymentId });
  revalidatePath(`/pagamenti/${paymentId}`);
}
