import { z } from "zod";

const name = z.string().min(1, "Obbligatorio").max(80);

export const coachSchema = z.object({
  first_name: name,
  last_name: name,
  tax_code: z
    .string()
    .regex(/^[A-Z0-9]{11,16}$/, "Codice fiscale non valido")
    .nullable(),
  email: z.email("Email non valida").nullable(),
  phone: z.string().max(30).nullable(),
  qualifications: z.array(z.string().min(1)).max(20),
  status: z.enum(["active", "inactive", "archived"]),
});
