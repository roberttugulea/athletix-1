import { DataTable } from "@/components/ui/data-table";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/validation/billing";
import { PAYMENT_METHOD_LABEL } from "@/lib/validation/payments";

export const metadata = { title: "Pagamenti | ATHLETIX" };

type Row = {
  id: string;
  amount: number;
  paid_on: string;
  method: string;
  monthly_fee_id: string | null;
  subscription_id: string | null;
  athletes: { first_name: string; last_name: string } | null;
  receipts: { receipt_number: string }[] | { receipt_number: string } | null;
};

function receiptNumber(r: Row): string {
  const rec = Array.isArray(r.receipts) ? r.receipts[0] : r.receipts;
  return rec?.receipt_number ?? "—";
}

export default async function PagamentiListPage(props: {
  searchParams: Promise<{ q?: string; metodo?: string }>;
}) {
  const { q, metodo } = await props.searchParams;
  const org = await requirePermission("finance.manage");
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select(
      "id, amount, paid_on, method, monthly_fee_id, subscription_id, athletes(first_name, last_name), receipts(receipt_number)",
    )
    .eq("organization_id", org.organizationId)
    .order("paid_on", { ascending: false })
    .limit(200);

  if (metodo) query = query.eq("method", metodo);

  const { data } = await query;
  let rows = (data ?? []) as unknown as Row[];

  const term = (q ?? "").replace(/[%,()\\*]/g, "").trim().toLowerCase();
  if (term) {
    rows = rows.filter((r) =>
      `${r.athletes?.last_name ?? ""} ${r.athletes?.first_name ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="content">
      <PageHeader
        eyebrow="Amministrazione"
        title="Pagamenti"
        subtitle={`${rows.length} pagamenti · totale ${money(total)}`}
        action={{ href: "/pagamenti/nuovo", label: "Registra pagamento" }}
      />
      <ListToolbar
        q={q}
        filters={[
          {
            name: "metodo",
            value: metodo,
            options: [
              { value: "", label: "Tutti i metodi" },
              { value: "contanti", label: "Contanti" },
              { value: "pos", label: "POS / carta" },
              { value: "bonifico", label: "Bonifico" },
              { value: "online", label: "Online" },
              { value: "altro", label: "Altro" },
            ],
          },
        ]}
      />
      <DataTable<Row>
        columns={[
          {
            key: "athlete",
            label: "Atleta",
            render: (r) =>
              `${r.athletes?.last_name ?? ""} ${r.athletes?.first_name ?? ""}`.trim() ||
              "—",
          },
          { key: "amount", label: "Importo", render: (r) => money(Number(r.amount)) },
          {
            key: "paid_on",
            label: "Data",
            render: (r) => formatShortDate(`${r.paid_on}T12:00:00`),
          },
          {
            key: "method",
            label: "Metodo",
            render: (r) => PAYMENT_METHOD_LABEL[r.method] ?? r.method,
          },
          {
            key: "link",
            label: "Causale",
            render: (r) =>
              r.monthly_fee_id
                ? "Quota mensile"
                : r.subscription_id
                  ? "Pacchetto"
                  : "Libero",
          },
          { key: "receipt", label: "Ricevuta", render: receiptNumber },
        ]}
        rows={rows}
        getKey={(r) => r.id}
        rowHref={(r) => `/pagamenti/${r.id}`}
        empty="Nessun pagamento registrato."
      />
    </div>
  );
}
