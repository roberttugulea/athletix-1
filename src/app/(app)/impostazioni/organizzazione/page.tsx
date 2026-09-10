import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateOrgSettings } from "@/server/actions/organization";

export const metadata = { title: "Organizzazione | ATHLETIX" };

const fields: FieldConfig[] = [
  {
    name: "fee_grace_days",
    label: "Giorni di tolleranza pagamento quote",
    type: "number",
    required: true,
    help: "Dopo la scadenza, prima che la quota risulti «scaduta» (0–31).",
  },
  {
    name: "certificate_alert_days",
    label: "Preavviso scadenza certificati (giorni)",
    type: "number",
    required: true,
    help: "Un certificato entro questa soglia è segnalato «in scadenza» (1–180).",
  },
  {
    name: "membership_alert_days",
    label: "Preavviso scadenza tesseramenti (giorni)",
    type: "number",
    required: true,
    help: "Un tesseramento entro questa soglia è segnalato «in scadenza» (1–180).",
  },
];

export default async function OrganizzazioneSettingsPage() {
  const org = await requirePermission("organization.manage");
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("organization_settings")
    .select("fee_grace_days, certificate_alert_days, membership_alert_days")
    .eq("organization_id", org.organizationId)
    .maybeSingle();

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/impostazioni", label: "Impostazioni" },
          { label: "Organizzazione" },
        ]}
      />
      <PageHeader
        eyebrow="Configurazione"
        title="Parametri dell'organizzazione"
        subtitle="Tolleranza pagamenti e preavvisi di scadenza per certificati e tessere."
      />
      <EntityForm
        action={updateOrgSettings}
        fields={fields}
        defaults={{
          fee_grace_days: settings?.fee_grace_days ?? 5,
          certificate_alert_days: settings?.certificate_alert_days ?? 30,
          membership_alert_days: settings?.membership_alert_days ?? 30,
        }}
        submitLabel="Salva impostazioni"
      />
    </div>
  );
}
