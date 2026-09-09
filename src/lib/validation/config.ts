import { z } from "zod";

const shortName = z.string().min(1, "Obbligatorio").max(120, "Massimo 120 caratteri");

export const facilitySchema = z.object({
  name: shortName,
  address_line1: z.string().max(200).nullable(),
  city: z.string().max(120).nullable(),
  province: z.string().max(4, "Sigla di 2 lettere").nullable(),
  postal_code: z.string().max(10).nullable(),
  active: z.boolean(),
});

export const spaceSchema = z.object({
  facility_id: z.uuid("Seleziona una struttura"),
  name: shortName,
  capacity: z
    .number()
    .int("Numero intero")
    .positive("Deve essere maggiore di 0")
    .nullable(),
  active: z.boolean(),
});

export const seasonSchema = z
  .object({
    name: shortName,
    starts_on: z.string().min(1, "Obbligatorio"),
    ends_on: z.string().min(1, "Obbligatorio"),
    is_current: z.boolean(),
  })
  .refine((v) => v.ends_on >= v.starts_on, {
    path: ["ends_on"],
    message: "La data di fine deve essere successiva o uguale all'inizio",
  });

export const disciplineSchema = z.object({
  name: shortName,
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Usa un colore esadecimale, es. #1a2b3c")
    .nullable(),
  active: z.boolean(),
});
