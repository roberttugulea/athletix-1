import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida");

export const competitionSchema = z
  .object({
    name: z.string().min(1, "Obbligatorio").max(160),
    season_id: z.uuid().nullable(),
    organizer: z.string().max(160).nullable(),
    location: z.string().max(200).nullable(),
    starts_on: isoDate,
    ends_on: isoDate,
    registration_deadline: isoDate.nullable(),
  })
  .refine((v) => v.ends_on >= v.starts_on, {
    path: ["ends_on"],
    message: "La fine deve essere ≥ dell'inizio",
  })
  .refine(
    (v) =>
      v.registration_deadline == null ||
      v.registration_deadline <= v.starts_on,
    { path: ["registration_deadline"], message: "Deve precedere l'inizio" },
  );

export const CALL_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "withdrawn",
] as const;

export const CALL_STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  accepted: "Confermato",
  declined: "Rifiutato",
  withdrawn: "Ritirato",
};

export const resultSchema = z.object({
  athlete_id: z.uuid("Seleziona un atleta"),
  discipline: z.string().max(80).nullable(),
  category_id: z.uuid().nullable(),
  placement: z
    .number()
    .int("Numero intero")
    .positive("Deve essere > 0")
    .nullable(),
  score: z.number().nullable(),
  notes: z.string().max(400).nullable(),
});

export const eventSchema = z
  .object({
    title: z.string().min(1, "Obbligatorio").max(160),
    description: z.string().max(2000).nullable(),
    facility_id: z.uuid().nullable(),
    space_id: z.uuid().nullable(),
    starts_at: z.string().min(1, "Obbligatorio"),
    ends_at: z.string().min(1, "Obbligatorio"),
  })
  .refine((v) => v.ends_at > v.starts_at, {
    path: ["ends_at"],
    message: "La fine deve essere successiva all'inizio",
  });
