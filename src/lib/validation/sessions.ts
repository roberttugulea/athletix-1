import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida");

export const generateSessionsSchema = z
  .object({ from: date, to: date })
  .refine((v) => v.to >= v.from, {
    path: ["to"],
    message: "La data finale deve essere ≥ iniziale",
  });
