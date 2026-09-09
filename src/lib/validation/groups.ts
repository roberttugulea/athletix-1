import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().min(1, "Obbligatorio").max(120),
  facility_id: z.uuid("Seleziona una struttura"),
  season_id: z.uuid("Seleziona una stagione"),
  discipline_id: z.uuid().nullable(),
  capacity: z.number().int("Numero intero").positive("Deve essere > 0").nullable(),
  active: z.boolean(),
});

const time = z.string().regex(/^\d{2}:\d{2}$/, "Orario non valido (hh:mm)");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida");

export const slotSchema = z
  .object({
    space_id: z.uuid("Seleziona uno spazio"),
    weekday: z.number().int().min(0).max(6),
    starts_at: time,
    ends_at: time,
    valid_from: date,
    valid_to: date.nullable(),
  })
  .refine((v) => v.ends_at > v.starts_at, {
    path: ["ends_at"],
    message: "La fine deve essere dopo l'inizio",
  })
  .refine((v) => !v.valid_to || v.valid_to >= v.valid_from, {
    path: ["valid_to"],
    message: "La fine validità deve essere ≥ inizio",
  });

export const WEEKDAYS = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
] as const;
