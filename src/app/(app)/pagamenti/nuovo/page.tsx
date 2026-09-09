import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/validation/billing";
import { PAYMENT_METHODS } from "@/lib/validation/payments";
import { recordPayment } from "@/server/actions/payments";

export const metadata = { title: "Registra pagamento | ATHLETIX" };

const methodField: FieldConfig = {
  name: "method",
  label: "Metodo",
  type: "select",
  required: true,
  options: PAYMENT_METHODS,
};

export default async function NuovoPagamentoPage(props: {
  searchParams: Promise<{ fee?: string; sub?: string; atleta?: string }>;
}) {
  const { fee, sub } = await props.searchParams;
  const org = await requirePermission("finance.manage");
  const supabase = await createClient();

  let hidden: Record<string, string> = {};
  let fields: FieldConfig[] = [];
  let defaults: Record<string, unknown> = {
    paid_on: todayISO(),
    method: "contanti",
  };
  let context: string | null = null;

  if (fee) {
    const { data } = await supabase
      .from("monthly_fees")
      .select(
        "id, athlete_id, prorated_amount, discount_amount, billing_period, fee_plans(name), athletes(first_name, last_name)",
      )
      .eq("organization_id", org.organizationId)
      .eq("id", fee)
      .maybeSingle();
    if (data) {
      const amount = Number(data.prorated_amount) - Number(data.discount_amount);
      const ath = data.athletes as { first_name: string; last_name: string } | null;
      const plan = data.fee_plans as { name: string } | null;
      hidden = {
        athlete_id: data.athlete_id,
        monthly_fee_id: data.id,
        subscription_id: "",
      };
      defaults = { ...defaults, amount };
      context = `Quota ${plan?.name ?? ""} · ${data.billing_period.slice(0, 7)} · ${ath?.last_name ?? ""} ${ath?.first_name ?? ""} · ${money(amount)}`;
      fields = [
        { name: "amount", label: "Importo (€)", type: "number", required: true },
        methodField,
        { name: "paid_on", label: "Data pagamento", type: "date", required: true },
        { name: "external_reference", label: "Riferimento (facoltativo)" },
        { name: "issue_receipt", label: "Emetti ricevuta", type: "checkbox" },
      ];
    }
  } else if (sub) {
    const { data } = await supabase
      .from("subscriptions")
      .select(
        "id, athlete_id, price, subscription_plans(name), athletes(first_name, last_name)",
      )
      .eq("organization_id", org.organizationId)
      .eq("id", sub)
      .maybeSingle();
    if (data) {
      const ath = data.athletes as { first_name: string; last_name: string } | null;
      const plan = data.subscription_plans as { name: string } | null;
      hidden = {
        athlete_id: data.athlete_id,
        subscription_id: data.id,
        monthly_fee_id: "",
      };
      defaults = { ...defaults, amount: Number(data.price) };
      context = `Pacchetto ${plan?.name ?? ""} · ${ath?.last_name ?? ""} ${ath?.first_name ?? ""} · ${money(Number(data.price))}`;
      fields = [
        { name: "amount", label: "Importo (€)", type: "number", required: true },
        methodField,
        { name: "paid_on", label: "Data pagamento", type: "date", required: true },
        { name: "external_reference", label: "Riferimento (facoltativo)" },
        { name: "issue_receipt", label: "Emetti ricevuta", type: "checkbox" },
      ];
    }
  }

  if (fields.length === 0) {
    // Pagamento libero.
    const { data: athletes } = await supabase
      .from("athletes")
      .select("id, first_name, last_name")
      .eq("organization_id", org.organizationId)
      .eq("status", "active")
      .order("last_name");
    hidden = { monthly_fee_id: "", subscription_id: "" };
    fields = [
      {
        name: "athlete_id",
        label: "Atleta",
        type: "select",
        required: true,
        options: (athletes ?? []).map((a) => ({
          value: a.id,
          label: `${a.last_name} ${a.first_name}`,
        })),
        width: "full",
      },
      { name: "amount", label: "Importo (€)", type: "number", required: true },
      methodField,
      { name: "paid_on", label: "Data pagamento", type: "date", required: true },
      { name: "external_reference", label: "Riferimento (facoltativo)" },
      { name: "issue_receipt", label: "Emetti ricevuta", type: "checkbox" },
    ];
  }

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/pagamenti", label: "Pagamenti" },
          { label: "Nuovo" },
        ]}
      />
      <PageHeader eyebrow="Amministrazione" title="Registra pagamento" />
      {context ? (
        <p className="mb-4 rounded-lg bg-[#eaf0ff] px-3 py-2 text-xs text-[#2b467c]">
          {context}
        </p>
      ) : null}
      <EntityForm
        action={recordPayment}
        fields={fields}
        defaults={defaults}
        hidden={hidden}
        submitLabel="Registra pagamento"
      />
    </div>
  );
}
