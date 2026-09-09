import type { FieldConfig } from "@/components/ui/entity-form";

type Opt = { value: string; label: string };

export function groupFields(
  facilities: Opt[],
  seasons: Opt[],
  disciplines: Opt[],
): FieldConfig[] {
  return [
    { name: "name", label: "Nome gruppo", required: true, width: "full" },
    {
      name: "facility_id",
      label: "Struttura",
      type: "select",
      required: true,
      options: facilities,
    },
    {
      name: "season_id",
      label: "Stagione",
      type: "select",
      required: true,
      options: seasons,
    },
    {
      name: "discipline_id",
      label: "Disciplina",
      type: "select",
      options: disciplines,
    },
    { name: "capacity", label: "Capienza", type: "number" },
    { name: "active", label: "Attivo", type: "checkbox" },
  ];
}

const WEEKDAY_OPTIONS: Opt[] = [
  { value: "1", label: "Lunedì" },
  { value: "2", label: "Martedì" },
  { value: "3", label: "Mercoledì" },
  { value: "4", label: "Giovedì" },
  { value: "5", label: "Venerdì" },
  { value: "6", label: "Sabato" },
  { value: "0", label: "Domenica" },
];

export function slotFields(spaces: Opt[]): FieldConfig[] {
  return [
    {
      name: "space_id",
      label: "Spazio",
      type: "select",
      required: true,
      options: spaces,
      width: "full",
    },
    {
      name: "weekday",
      label: "Giorno",
      type: "select",
      required: true,
      options: WEEKDAY_OPTIONS,
    },
    { name: "starts_at", label: "Dalle", type: "time", required: true },
    { name: "ends_at", label: "Alle", type: "time", required: true },
    { name: "valid_from", label: "Valida dal", type: "date", required: true },
    { name: "valid_to", label: "Valida fino al", type: "date" },
  ];
}
