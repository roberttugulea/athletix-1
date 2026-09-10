import type { FieldConfig } from "@/components/ui/entity-form";
import {
  CERTIFICATE_STATUSES,
  CERTIFICATE_STATUS_LABEL,
  CERTIFICATE_TYPES,
  UPLOAD_ACCEPT,
} from "@/lib/validation/documents";

const typeOptions = CERTIFICATE_TYPES.map((t) => ({ value: t, label: t }));
const statusOptions = CERTIFICATE_STATUSES.map((s) => ({
  value: s,
  label: CERTIFICATE_STATUS_LABEL[s],
}));

/**
 * @param athletes  elenco atleti selezionabili; se omesso l'atleta è fissato
 *                  a monte (scheda atleta) e il campo non viene mostrato.
 */
export function certificateFields(
  athletes?: { value: string; label: string }[],
): FieldConfig[] {
  const fields: FieldConfig[] = [];
  if (athletes) {
    fields.push({
      name: "athlete_id",
      label: "Atleta",
      type: "select",
      required: true,
      options: athletes,
      width: "full",
    });
  }
  fields.push(
    {
      name: "certificate_type",
      label: "Tipo",
      type: "select",
      required: true,
      options: typeOptions,
    },
    {
      name: "status",
      label: "Stato",
      type: "select",
      required: true,
      options: statusOptions,
    },
    { name: "issued_on", label: "Rilasciato il", type: "date", required: true },
    { name: "expires_on", label: "Scade il", type: "date", required: true },
    {
      name: "document",
      label: "Documento (PDF/immagine, max 10 MB)",
      type: "file",
      accept: UPLOAD_ACCEPT,
      width: "full",
      help: "Facoltativo. Caricando un nuovo file sostituisci quello esistente.",
    },
  );
  return fields;
}
