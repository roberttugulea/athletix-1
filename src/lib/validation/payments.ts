import { z } from "zod";

export const PAYMENT_METHODS = [
  { value: "contanti", label: "Contanti" },
  { value: "pos", label: "POS / carta" },
  { value: "bonifico", label: "Bonifico" },
  { value: "online", label: "Pagamento online" },
  { value: "altro", label: "Altro" },
];

export const PAYMENT_METHOD_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label]),
);

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida");

export const recordPaymentSchema = z.object({
  athlete_id: z.uuid("Seleziona un atleta"),
  amount: z.number().positive("L'importo deve essere maggiore di 0"),
  paid_on: date,
  method: z.string().min(1, "Indica il metodo").max(30),
  monthly_fee_id: z.union([z.uuid(), z.literal("")]),
  subscription_id: z.union([z.uuid(), z.literal("")]),
  external_reference: z.string().max(120),
  issue_receipt: z.boolean(),
});

export const recordRefundSchema = z.object({
  payment_id: z.uuid(),
  amount: z.number().positive("L'importo deve essere maggiore di 0"),
  refunded_on: date,
  reason: z.string().max(200),
});

export function parseMoney(v: FormDataEntryValue | null): number {
  const s = typeof v === "string" ? v.trim().replace(",", ".") : "";
  const n = s === "" ? NaN : Number(s);
  return Number.isFinite(n) ? n : NaN;
}
