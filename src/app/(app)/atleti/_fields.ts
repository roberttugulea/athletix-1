import type { FieldConfig } from "@/components/ui/entity-form";

export const athleteFields: FieldConfig[] = [
  { name: "first_name", label: "Nome", required: true },
  { name: "last_name", label: "Cognome", required: true },
  { name: "birth_date", label: "Data di nascita", type: "date", required: true },
  {
    name: "tax_code",
    label: "Codice fiscale",
    placeholder: "RSSMRA90A01H501U",
  },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Telefono", type: "tel" },
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

export const athleteCreateFields: FieldConfig[] = athleteFields.filter(
  (f) => f.name !== "status",
);

export const guardianFields: FieldConfig[] = [
  { name: "first_name", label: "Nome", required: true },
  { name: "last_name", label: "Cognome", required: true },
  {
    name: "relationship",
    label: "Rapporto",
    required: true,
    placeholder: "Madre, Padre, Tutore…",
  },
  { name: "tax_code", label: "Codice fiscale" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Telefono", type: "tel" },
  { name: "is_primary", label: "Referente principale", type: "checkbox" },
];
