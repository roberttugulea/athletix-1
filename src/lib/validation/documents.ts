import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida");

// ------------------------------------------------------- Certificati medici
export const CERTIFICATE_TYPES = [
  "Agonistico",
  "Non agonistico",
  "Attività ludico-motoria",
  "Altro",
] as const;

export const CERTIFICATE_STATUSES = ["valid", "expired", "revoked"] as const;

export const CERTIFICATE_STATUS_LABEL: Record<string, string> = {
  valid: "Valido",
  expired: "Scaduto",
  revoked: "Revocato",
};

export const certificateSchema = z
  .object({
    athlete_id: z.uuid("Seleziona un atleta"),
    certificate_type: z.enum(CERTIFICATE_TYPES),
    issued_on: isoDate,
    expires_on: isoDate,
    status: z.enum(CERTIFICATE_STATUSES),
  })
  .refine((v) => v.expires_on >= v.issued_on, {
    path: ["expires_on"],
    message: "La scadenza deve essere successiva al rilascio",
  });

// ----------------------------------------------------------- Tesseramenti
export const MEMBERSHIP_STATUSES = [
  "active",
  "expired",
  "suspended",
  "cancelled",
] as const;

export const MEMBERSHIP_STATUS_LABEL: Record<string, string> = {
  active: "Attivo",
  expired: "Scaduto",
  suspended: "Sospeso",
  cancelled: "Annullato",
};

export const membershipSchema = z
  .object({
    athlete_id: z.uuid("Seleziona un atleta"),
    federation: z.string().min(1, "Obbligatorio").max(60),
    membership_number: z.string().min(1, "Obbligatorio").max(60),
    starts_on: isoDate,
    ends_on: isoDate.nullable(),
    status: z.enum(MEMBERSHIP_STATUSES),
  })
  .refine((v) => v.ends_on == null || v.ends_on >= v.starts_on, {
    path: ["ends_on"],
    message: "La scadenza deve essere successiva all'inizio",
  });

// ------------------------------------------------------------------ Upload
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
export const UPLOAD_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

/** Restituisce un messaggio d'errore se il file non è valido, altrimenti null. */
export function checkUpload(file: File): string | null {
  if (file.size <= 0) return "Il file è vuoto.";
  if (file.size > MAX_UPLOAD_BYTES) return "Il file supera i 10 MB.";
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type))
    return "Formato non ammesso: usa PDF, PNG, JPG o WEBP.";
  return null;
}

/** Giorni residui alla scadenza (negativo se già scaduta). */
export function daysUntil(iso: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
}
