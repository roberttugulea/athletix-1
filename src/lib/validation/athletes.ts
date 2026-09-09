import { z } from "zod";

const name = z.string().min(1, "Obbligatorio").max(80, "Massimo 80 caratteri");

const today = () => new Date().toISOString().slice(0, 10);

export const athleteSchema = z.object({
  first_name: name,
  last_name: name,
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")
    .refine((v) => v <= today(), "La data di nascita non può essere futura"),
  tax_code: z
    .string()
    .regex(/^[A-Z0-9]{11,16}$/, "Codice fiscale non valido")
    .nullable(),
  email: z.email("Email non valida").nullable(),
  phone: z.string().max(30).nullable(),
  status: z.enum(["active", "inactive", "archived"]),
});

export type AthleteInput = z.infer<typeof athleteSchema>;
