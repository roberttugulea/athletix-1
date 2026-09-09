import type { FieldConfig } from "@/components/ui/entity-form";

export const facilityFields: FieldConfig[] = [
  { name: "name", label: "Nome struttura", required: true, width: "full" },
  { name: "address_line1", label: "Indirizzo", width: "full" },
  { name: "city", label: "Città" },
  { name: "province", label: "Provincia", placeholder: "es. TO" },
  { name: "postal_code", label: "CAP" },
  { name: "active", label: "Attiva", type: "checkbox" },
];

export const seasonFields: FieldConfig[] = [
  { name: "name", label: "Nome stagione", required: true, width: "full", placeholder: "es. 2025/2026" },
  { name: "starts_on", label: "Inizio", type: "date", required: true },
  { name: "ends_on", label: "Fine", type: "date", required: true },
  { name: "is_current", label: "Stagione corrente", type: "checkbox" },
];

export const disciplineFields: FieldConfig[] = [
  { name: "name", label: "Nome disciplina", required: true, width: "full" },
  { name: "color", label: "Colore", placeholder: "#1a2b3c", help: "Esadecimale a 6 cifre (opzionale)" },
  { name: "active", label: "Attiva", type: "checkbox" },
];

export function spaceFields(
  facilities: { value: string; label: string }[],
): FieldConfig[] {
  return [
    {
      name: "facility_id",
      label: "Struttura",
      type: "select",
      required: true,
      options: facilities,
      width: "full",
    },
    { name: "name", label: "Nome spazio", required: true, placeholder: "es. Palestra A" },
    { name: "capacity", label: "Capienza", type: "number" },
    { name: "active", label: "Attivo", type: "checkbox" },
  ];
}
