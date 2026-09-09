import { z } from "zod";

const email = z.email("Email non valida");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Inserisci la password"),
});

export const passwordResetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
    confirm: z.string().min(1, "Conferma la password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Le password non coincidono",
    path: ["confirm"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
