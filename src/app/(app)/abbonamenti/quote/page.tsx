import { DataTable } from "@/components/ui/data-table";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { FEE_STATUS_LABEL, money } from "@/lib/validation/billing";
import { refreshFeeStatuses } from "@/server/actions/billing";

export const metadata = { title: "Quote mensili | ATHLETIX" };

type Row = {
  id: string;
  billing_period: string;
  due_on: string;
  base_amount: number;
  prorated_amount: number;
  discount_amount: number;
  status: string;
  athletes: { first_name: string; last_name: string } | null;
  fee_plans: { name: string } | null;
};

export default async function QuoteMensiliPage(props: {
  searchParams: Promise<{ mese?: string; stato?: string }>;
}) {
  const { mese, stato } = await props.searchParams;
  const org = await requirePermission("finance.manage");
  const supabase = await createClient();

  let query = supabase
    .from("monthly_fees")
    .select(
      "id, billing_period, due_on, base_amount, prorated_amount, discount_amount, status, athletes(first_name, last_name), fee_plans(name)",
    )
    .eq("organization_id", org.organizationId)
    .order("billing_period", { ascending: false })
    .order("due_on")
    .limit(300);

  const STATI = ["due", "overdue", "unpaid", "paid", "exempt"] as const;
  if (mese && /^\d{4}-\d{2}$/.test(mese)) {
    query = query.eq("billing_period", `${mese}-01`);
  }
  if (stato && (STATI as readonly string[]).includes(stato)) {
    query = query.eq("status", stato as (typeof STATI)[number]);
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const total = rows.reduce(
    (s, r) => s + Number(r.prorated_amount) - Number(r.discount_amount),
    0,
  );

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/abbonamenti", label: "Abbonamenti" },
          { label: "Quote mensili" },
        ]}
      />
      <PageHeader
        eyebrow="Amministrazione"
        title="Quote mensili"
        subtitle={`${rows.length} quote · totale ${money(total)}`}
        action={
          <form action={refreshFeeStatuses}>
            <button type="submit" className="outline-button">
              Aggiorna stati scaduti
            </button>
          </form>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="mese" className="mb-1 block text-xs font-semibold">
            Mese
          </label>
          <input
            id="mese"
            name="mese"
            type="month"
            defaultValue={mese ?? ""}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          />
        </div>
        <div>
          <label htmlFor="stato" className="mb-1 block text-xs font-semibold">
            Stato
          </label>
          <select
            id="stato"
            name="stato"
            defaultValue={stato ?? ""}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          >
            <option value="">Tutti</option>
            <option value="due">Da pagare</option>
            <option value="overdue">In scadenza</option>
            <option value="unpaid">Insolute</option>
            <option value="paid">Pagate</option>
            <option value="exempt">Esonerate</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-[#cbd9fb] bg-white px-4 py-2 text-sm font-bold text-[var(--blue)]"
        >
          Filtra
        </button>
      </form>

      <DataTable<Row>
        columns={[
          {
            key: "athlete",
            label: "Atleta",
            render: (r) =>
              `${r.athletes?.last_name ?? ""} ${r.athletes?.first_name ?? ""}`.trim() ||
              "—",
          },
          {
            key: "period",
            label: "Mese",
            render: (r) => r.billing_period.slice(0, 7),
          },
          { key: "plan", label: "Piano", render: (r) => r.fee_plans?.name ?? "—" },
          {
            key: "amount",
            label: "Importo",
            render: (r) =>
              money(Number(r.prorated_amount) - Number(r.discount_amount)),
          },
          {
            key: "due_on",
            label: "Scadenza",
            render: (r) => formatShortDate(`${r.due_on}T12:00:00`),
          },
          {
            key: "status",
            label: "Stato",
            render: (r) => FEE_STATUS_LABEL[r.status] ?? r.status,
          },
        ]}
        rows={rows}
        getKey={(r) => r.id}
        empty="Nessuna quota. Generale da un piano quota."
      />
    </div>
  );
}
