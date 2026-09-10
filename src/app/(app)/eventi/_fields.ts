import type { FieldConfig } from "@/components/ui/entity-form";

export function eventFields(
  facilities: { value: string; label: string }[],
  spaces: { value: string; label: string }[],
): FieldConfig[] {
  return [
    { name: "title", label: "Titolo", required: true, width: "full" },
    {
      name: "starts_at",
      label: "Inizio",
      type: "datetime-local",
      required: true,
    },
    { name: "ends_at", label: "Fine", type: "datetime-local", required: true },
    {
      name: "facility_id",
      label: "Struttura",
      type: "select",
      options: facilities,
    },
    { name: "space_id", label: "Spazio", type: "select", options: spaces },
    { name: "description", label: "Descrizione", type: "textarea", width: "full" },
  ];
}
