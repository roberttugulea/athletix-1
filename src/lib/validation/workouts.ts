import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida");

export const WORKOUT_STATUSES = ["draft", "active", "archived"] as const;

export const WORKOUT_STATUS_LABEL: Record<string, string> = {
  draft: "Bozza",
  active: "Attiva",
  archived: "Archiviata",
};

export const workoutPlanSchema = z
  .object({
    title: z.string().min(1, "Obbligatorio").max(120),
    starts_on: isoDate,
    ends_on: isoDate.nullable(),
    status: z.enum(WORKOUT_STATUSES),
    notes: z.string().max(2000).nullable(),
  })
  .refine((v) => v.ends_on == null || v.ends_on >= v.starts_on, {
    path: ["ends_on"],
    message: "La fine deve essere successiva all'inizio",
  });

export const workoutItemSchema = z.object({
  day_index: z
    .number()
    .int("Numero intero")
    .min(1, "Minimo 1")
    .max(14, "Massimo 14"),
  exercise: z.string().min(1, "Obbligatorio").max(160),
  sets: z
    .number()
    .int("Numero intero")
    .min(1, "Minimo 1")
    .max(99, "Massimo 99")
    .nullable(),
  reps: z.string().max(40).nullable(),
  load: z.string().max(40).nullable(),
  rest_seconds: z
    .number()
    .int("Numero intero")
    .min(0, "Minimo 0")
    .max(3600, "Massimo 3600")
    .nullable(),
  notes: z.string().max(400).nullable(),
  sort: z.number().int().min(0).max(999),
});
