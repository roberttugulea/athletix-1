import { z } from "zod";

const name = z.string().min(1, "Obbligatorio").max(80);

export const guardianSchema = z.object({
  first_name: name,
  last_name: name,
  relationship: z.string().min(1, "Indica il rapporto (es. Madre, Padre, Tutore)").max(40),
  tax_code: z
    .string()
    .regex(/^[A-Z0-9]{11,16}$/, "Codice fiscale non valido")
    .nullable(),
  email: z.email("Email non valida").nullable(),
  phone: z.string().max(30).nullable(),
  is_primary: z.boolean(),
});
