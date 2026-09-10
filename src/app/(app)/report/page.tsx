import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { addDays, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { FEE_STATUS_LABEL, money } from "@/lib/validation/billing";

export const metadata = { title: "Report | ATHLETIX" };

function monthStart(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export default async function ReportPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await props.searchParams;
  const org = await requirePermission("reports.read");
  const supabase = await createClient();

  const today = todayISO();
  const from =
    sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : monthStart(today);
  const to = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : today;

  const [
    athletesActive,
    groupsCount,
    feesMonth,
    paymentsPeriod,
    refundsPeriod,
    attendance30,
    certsExpiring,
    membershipsExpiring,
  ] = await Promise.all([
    supabase
      .from("athletes")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.organizationId)
      .eq("status", "active"),
    supabase
      .from("groups")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.organizationId),
    supabase
      .from("monthly_fees")
      .select("status, prorated_amount")
      .eq("organization_id", org.organizationId)
      .eq("billing_period", monthStart(today)),
    supabase
      .from("payments")
      .select("amount")
      .eq("organization_id", org.organizationId)
      .gte("paid_on", from)
      .lte("paid_on", to),
    supabase
      .from("refunds")
      .select("amount")
      .eq("organization_id", org.organizationId)
      .gte("refunded_on", from)
      .lte("refunded_on", to),
    supabase
      .from("attendances")
      .select("status, recorded_at")
      .gte("recorded_at", `${addDays(today, -30)}T00:00:00`),
    supabase
      .from("medical_certificates")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.organizationId)
      .eq("status", "valid")
      .lte("expires_on", addDays(today, 30)),
    supabase
      .from("fita_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.organizationId)
      .eq("status", "active")
      .lte("ends_on", addDays(today, 30)),
  ]);

  const fees = feesMonth.data ?? [];
  const feeByStatus = fees.reduce<Record<string, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + 1;
    return acc;
  }, {});
  const feeDue = fees
    .filter((f) => f.status === "due" || f.status === "overdue")
    .reduce((s, f) => s + Number(f.prorated_amount), 0);

  const cashed =
    (paymentsPeriod.data ?? []).reduce((s, p) => s + Number(p.amount), 0) -
    (refundsPeriod.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const att = attendance30.data ?? [];
  const attPresent = att.filter(
    (a) => a.status === "present" || a.status === "late",
  ).length;
  const attRate = att.length
    ? Math.round((attPresent / att.length) * 100)
    : null;

  const qs = `from=${from}&to=${to}`;

  const tiles = [
    { label: "Atleti attivi", value: athletesActive.count ?? 0 },
    { label: "Gruppi", value: groupsCount.count ?? 0 },
    {
      label: "Quote mese corrente",
      value: `${feeByStatus["paid"] ?? 0}/${fees.length} pagate`,
    },
    { label: "Da incassare (quote mese)", value: money(feeDue) },
    { label: `Incassato ${from} → ${to}`, value: money(cashed) },
    {
      label: "Presenze ultimi 30g",
      value: attRate == null ? "—" : `${attRate}%`,
    },
    { label: "Certificati in scadenza (30g)", value: certsExpiring.count ?? 0 },
    {
      label: "Tesseramenti in scadenza (30g)",
      value: membershipsExpiring.count ?? 0,
    },
  ];

  return (
    <div className="content">
      <PageHeader
        eyebrow="Analisi"
        title="Report"
        subtitle="Indicatori sintetici ed export CSV."
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="mb-1 block text-xs font-semibold">
            Dal
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-xs font-semibold">
            Al
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-[#cbd9fb] bg-white px-4 py-2 text-sm font-bold text-[var(--blue)]"
        >
          Aggiorna
        </button>
      </form>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="panel p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              {t.label}
            </p>
            <p className="mt-1 text-lg font-bold">{t.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold">Quote mese corrente per stato</h2>
        <div className="panel" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {Object.entries(feeByStatus).length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    Nessuna quota generata per il mese corrente.
                  </td>
                </tr>
              ) : (
                Object.entries(feeByStatus).map(([s, n]) => (
                  <tr
                    key={s}
                    className="border-b border-[#f1f4f9] last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold">
                      {FEE_STATUS_LABEL[s] ?? s}
                    </td>
                    <td className="px-4 py-3">{n}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold">Export CSV</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/report/export?dataset=payments&${qs}`}
            className="rounded-lg border border-[#cbd9fb] bg-white px-4 py-2 text-sm font-bold text-[var(--blue)]"
          >
            Pagamenti del periodo
          </Link>
          <Link
            href={`/report/export?dataset=fees&${qs}`}
            className="rounded-lg border border-[#cbd9fb] bg-white px-4 py-2 text-sm font-bold text-[var(--blue)]"
          >
            Quote del periodo
          </Link>
          <Link
            href="/report/export?dataset=athletes"
            className="rounded-lg border border-[#cbd9fb] bg-white px-4 py-2 text-sm font-bold text-[var(--blue)]"
          >
            Anagrafica atleti
          </Link>
        </div>
      </section>
    </div>
  );
}
