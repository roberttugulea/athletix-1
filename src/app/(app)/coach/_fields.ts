import type { FieldConfig } from "@/components/ui/entity-form";

export const coachFields: FieldConfig[] = [
  { name: "first_name", label: "Nome", required: true },
  { name: "last_name", label: "Cognome", required: true },
  { name: "tax_code", label: "Codice fiscale" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Telefono", type: "tel" },
  {
    name: "qualifications",
    label: "Qualifiche",
    placeholder: "Istruttore FIJLKAM, Preparatore atletico…",
    help: "Separate da virgola",
    width: "full",
  },
  {
    name: "status",
    label: "Stato",
    type: "select",
    options: [
      { value: "active", label: "Attivo" },
      { value: "inactive", label: "Inattivo" },
      { value: "archived", label: "Archiviato" },
    ],
  },
];

export const coachCreateFields: FieldConfig[] = coachFields.filter(
  (f) => f.name !== "status",
);
