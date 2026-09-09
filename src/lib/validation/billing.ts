import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida");

export const feePlanSchema = z.object({
  name: z.string().min(1, "Obbligatorio").max(120),
  season_id: z.uuid("Seleziona una stagione"),
  group_id: z.union([z.uuid(), z.literal("")]),
  monthly_amount: z.number().nonnegative("Non può essere negativo"),
  due_day: z
    .number()
    .int("Numero intero")
    .min(1, "Da 1 a 28")
    .max(28, "Da 1 a 28"),
  prorate_on_mid_month_join: z.boolean(),
  active_from: date,
  active_to: z.union([date, z.literal("")]),
});

export const generateFeesSchema = z.object({
  fee_plan_id: z.uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Mese non valido"),
});

export const money = (n: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);

export const FEE_STATUS_LABEL: Record<string, string> = {
  due: "Da pagare",
  overdue: "In scadenza",
  unpaid: "Insoluta",
  paid: "Pagata",
  exempt: "Esonerata",
};
