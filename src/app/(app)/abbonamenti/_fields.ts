import type { FieldConfig } from "@/components/ui/entity-form";

type Opt = { value: string; label: string };

export function feePlanFields(seasons: Opt[], groups: Opt[]): FieldConfig[] {
  return [
    { name: "name", label: "Nome piano", required: true, width: "full" },
    {
      name: "season_id",
      label: "Stagione",
      type: "select",
      required: true,
      options: seasons,
    },
    {
      name: "group_id",
      label: "Gruppo (facoltativo)",
      type: "select",
      options: groups,
      help: "Se indicato, la quota vale per gli iscritti a quel gruppo",
    },
    {
      name: "monthly_amount",
      label: "Importo mensile (€)",
      type: "number",
      required: true,
    },
    {
      name: "due_day",
      label: "Giorno di scadenza (1–28)",
      type: "number",
      required: true,
    },
    {
      name: "prorate_on_mid_month_join",
      label: "Rateo per iscrizione a mese iniziato",
      type: "checkbox",
      width: "full",
    },
    { name: "active_from", label: "Attivo dal", type: "date", required: true },
    { name: "active_to", label: "Attivo fino al", type: "date" },
  ];
}
