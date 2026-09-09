import type { FieldConfig } from "@/components/ui/entity-form";

const KIND_OPTIONS = [
  { value: "age", label: "Età" },
  { value: "weight", label: "Peso" },
  { value: "level", label: "Livello" },
  { value: "discipline", label: "Disciplina" },
  { value: "other", label: "Altro" },
];

export function categoryFields(
  disciplines: { value: string; label: string }[],
): FieldConfig[] {
  return [
    {
      name: "kind",
      label: "Tipo",
      type: "select",
      required: true,
      options: KIND_OPTIONS,
    },
    { name: "name", label: "Nome", required: true },
    {
      name: "discipline_id",
      label: "Disciplina (facoltativa)",
      type: "select",
      options: disciplines,
      width: "full",
    },
    { name: "min_value", label: "Valore minimo", type: "number" },
    { name: "max_value", label: "Valore massimo", type: "number" },
    { name: "unit", label: "Unità", placeholder: "kg, anni…" },
    { name: "active", label: "Attiva", type: "checkbox" },
  ];
}
