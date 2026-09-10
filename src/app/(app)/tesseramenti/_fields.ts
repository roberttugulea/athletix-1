import type { FieldConfig } from "@/components/ui/entity-form";
import {
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUSES,
  UPLOAD_ACCEPT,
} from "@/lib/validation/documents";

const statusOptions = MEMBERSHIP_STATUSES.map((s) => ({
  value: s,
  label: MEMBERSHIP_STATUS_LABEL[s],
}));

/**
 * @param athletes  elenco atleti selezionabili; se omesso l'atleta è fissato
 *                  a monte (scheda atleta) e il campo non viene mostrato.
 */
export function membershipFields(
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
      name: "federation",
      label: "Federazione / ente",
      required: true,
      placeholder: "FITA, FIN, CONI, UISP…",
    },
    { name: "membership_number", label: "Numero tessera", required: true },
    { name: "status", label: "Stato", type: "select", required: true, options: statusOptions },
    { name: "starts_on", label: "Valida dal", type: "date", required: true },
    { name: "ends_on", label: "Scade il", type: "date" },
    {
      name: "document",
      label: "Documento (PDF/immagine, max 10 MB)",
      type: "file",
      accept: UPLOAD_ACCEPT,
      width: "full",
      help: "Facoltativo. Serve il permesso Documenti. Un nuovo file sostituisce quello esistente.",
    },
  );
  return fields;
}
