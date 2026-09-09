import { z } from "zod";

export const CATEGORY_KINDS = [
  "age",
  "weight",
  "level",
  "discipline",
  "other",
] as const;

export const KIND_LABEL: Record<string, string> = {
  age: "Età",
  weight: "Peso",
  level: "Livello",
  discipline: "Disciplina",
  other: "Altro",
};

export const categorySchema = z
  .object({
    kind: z.enum(CATEGORY_KINDS),
    name: z.string().min(1, "Obbligatorio").max(120),
    discipline_id: z.uuid().nullable(),
    min_value: z.number().nonnegative("Non può essere negativo").nullable(),
    max_value: z.number().nonnegative("Non può essere negativo").nullable(),
    unit: z.string().max(20).nullable(),
    active: z.boolean(),
  })
  .refine(
    (v) =>
      v.min_value == null ||
      v.max_value == null ||
      v.max_value >= v.min_value,
    { path: ["max_value"], message: "Il massimo deve essere ≥ del minimo" },
  );

export const athleteCategorySchema = z.object({
  category_id: z.uuid("Seleziona una categoria"),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida"),
  measured_value: z.number().nonnegative().nullable(),
});
