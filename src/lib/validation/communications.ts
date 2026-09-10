import { z } from "zod";

export const COMM_CHANNELS = ["in_app", "email"] as const;

export const CHANNEL_LABEL: Record<string, string> = {
  in_app: "Solo in-app",
  email: "In-app + email",
  push: "Push",
};

export const COMM_STATUS_LABEL: Record<string, string> = {
  draft: "Bozza",
  scheduled: "Programmata",
  sent: "Inviata",
  cancelled: "Annullata",
};

export const communicationSchema = z.object({
  title: z.string().min(1, "Obbligatorio").max(160),
  body: z.string().min(1, "Obbligatorio").max(5000),
  channel: z.enum(COMM_CHANNELS),
});

export const RECIPIENT_SCOPES = ["staff", "all_athletes", "group"] as const;

export const SCOPE_LABEL: Record<string, string> = {
  staff: "Tutto lo staff",
  all_athletes: "Tutti gli atleti (e tutori)",
  group: "Atleti di un gruppo (e tutori)",
};
