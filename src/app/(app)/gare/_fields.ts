import type { FieldConfig } from "@/components/ui/entity-form";

export function competitionFields(
  seasons: { value: string; label: string }[],
): FieldConfig[] {
  return [
    { name: "name", label: "Nome", required: true, width: "full" },
    {
      name: "season_id",
      label: "Stagione",
      type: "select",
      options: seasons,
    },
    { name: "organizer", label: "Organizzatore" },
    { name: "location", label: "Luogo" },
    { name: "starts_on", label: "Dal", type: "date", required: true },
    { name: "ends_on", label: "Al", type: "date", required: true },
    {
      name: "registration_deadline",
      label: "Scadenza iscrizioni",
      type: "date",
    },
  ];
}
