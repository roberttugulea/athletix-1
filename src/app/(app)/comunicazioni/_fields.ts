import type { FieldConfig } from "@/components/ui/entity-form";
import { CHANNEL_LABEL, COMM_CHANNELS } from "@/lib/validation/communications";

export const communicationFields: FieldConfig[] = [
  { name: "title", label: "Oggetto", required: true, width: "full" },
  {
    name: "channel",
    label: "Canale",
    type: "select",
    required: true,
    options: COMM_CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] })),
  },
  {
    name: "body",
    label: "Testo",
    type: "textarea",
    required: true,
    width: "full",
  },
];
