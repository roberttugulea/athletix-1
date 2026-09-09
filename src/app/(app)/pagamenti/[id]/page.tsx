import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/validation/billing";
import { PAYMENT_METHOD_LABEL } from "@/lib/validation/payments";
import { issueReceipt, recordRefund } from "@/server/actions/payments";

export const metadata = { title: "Pagamento | ATHLETIX" };

export default async function PagamentoDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("finance.manage");
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("payments")
    .select(
      "id, amount, paid_on, method, external_reference, monthly_fee_id, subscription_id, athletes(first_name, last_name), receipts(receipt_number, issued_on)",
    )
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!p) notFound();

  const { data: refunds } = await supabase
    .from("refunds")
    .select("id, amount, refunded_on, reason")
    .eq("payment_id", id)
    .order("refunded_on");

  const ath = p.athletes as { first_name: string; last_name: string } | null;
  const receipt = Array.isArray(p.receipts) ? p.receipts[0] : p.receipts;
  const refundedTotal = (refunds ?? []).reduce(
    (s, r) => s + Number(r.amount),
    0,
  );
  const residual = Number(p.amount) - refundedTotal;

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/pagamenti", label: "Pagamenti" },
          { label: `${ath?.last_name ?? ""} ${ath?.first_name ?? ""}`.trim() },
        ]}
      />
      <PageHeader
        eyebrow="Amministrazione"
        title={money(Number(p.amount))}
        subtitle={`${ath?.last_name ?? ""} ${ath?.first_name ?? ""} · ${formatShortDate(
          `${p.paid_on}T12:00:00`,
        )} · ${PAYMENT_METHOD_LABEL[p.method] ?? p.method}${
          p.external_reference ? ` · rif. ${p.external_reference}` : ""
        }`}
      />

      <section className="panel mb-8 p-5 text-sm">
        <p>
          Collegato a:{" "}
          <strong>
            {p.monthly_fee_id
              ? "Quota mensile"
              : p.subscription_id
                ? "Pacchetto"
                : "Nessuna voce (pagamento libero)"}
          </strong>
        </p>
        <p className="mt-1">
          Ricevuta:{" "}
          {receipt ? (
            <strong>
              n. {receipt.receipt_number} del{" "}
              {formatShortDate(`${receipt.issued_on}T12:00:00`)}
            </strong>
          ) : (
            <span className="text-[var(--muted)]">non emessa</span>
          )}
        </p>
        <p className="mt-1">
          Rimborsato: <strong>{money(refundedTotal)}</strong> · residuo{" "}
          <strong>{money(residual)}</strong>
        </p>
        {!receipt ? (
          <form action={issueReceipt.bind(null, p.id)} className="mt-3">
            <button type="submit" className="outline-button">
              Emetti ricevuta
            </button>
          </form>
        ) : null}
      </section>

      <h2 className="mb-3 text-sm font-bold">Rimborsi</h2>
      {(refunds ?? []).length > 0 ? (
        <div className="panel mb-4" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {(refunds ?? []).map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    {money(Number(r.amount))}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {formatShortDate(`${r.refunded_on}T12:00:00`)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mb-4 text-xs text-[var(--muted)]">Nessun rimborso.</p>
      )}

      {residual > 0 ? (
        <EntityForm
          action={recordRefund}
          fields={[
            {
              name: "amount",
              label: `Importo (max ${money(residual)})`,
              type: "number",
              required: true,
            },
            {
              name: "refunded_on",
              label: "Data rimborso",
              type: "date",
              required: true,
            },
            { name: "reason", label: "Motivo", width: "full" },
          ]}
          defaults={{ refunded_on: todayISO(), amount: residual }}
          hidden={{ payment_id: p.id }}
          submitLabel="Registra rimborso"
        />
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Pagamento interamente rimborsato.
        </p>
      )}
    </div>
  );
}
