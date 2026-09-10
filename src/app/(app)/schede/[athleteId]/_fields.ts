import type { FieldConfig } from "@/components/ui/entity-form";
import {
  WORKOUT_STATUS_LABEL,
  WORKOUT_STATUSES,
} from "@/lib/validation/workouts";

const statusOptions = WORKOUT_STATUSES.map((s) => ({
  value: s,
  label: WORKOUT_STATUS_LABEL[s],
}));

export const planFields: FieldConfig[] = [
  { name: "title", label: "Titolo", required: true, width: "full" },
  { name: "status", label: "Stato", type: "select", required: true, options: statusOptions },
  { name: "starts_on", label: "Dal", type: "date", required: true },
  { name: "ends_on", label: "Al (facoltativo)", type: "date" },
  { name: "notes", label: "Note", width: "full" },
];

export const itemFields: FieldConfig[] = [
  { name: "day_index", label: "Giorno (1–14)", type: "number", required: true },
  { name: "sort", label: "Ordine", type: "number" },
  { name: "exercise", label: "Esercizio", required: true, width: "full" },
  { name: "sets", label: "Serie", type: "number" },
  { name: "reps", label: "Ripetizioni", placeholder: "8-12, AMRAP…" },
  { name: "load", label: "Carico", placeholder: "40 kg, corpo libero…" },
  { name: "rest_seconds", label: "Recupero (s)", type: "number" },
  { name: "notes", label: "Note", width: "full" },
];
