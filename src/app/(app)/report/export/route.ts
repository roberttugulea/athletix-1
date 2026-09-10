import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/permissions";
import { getActiveOrg } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { FEE_STATUS_LABEL } from "@/lib/validation/billing";
import { PAYMENT_METHOD_LABEL } from "@/lib/validation/payments";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const org = await getActiveOrg();
  if (!org) return new NextResponse("Non autenticato", { status: 401 });
  if (!(await hasPermission(org.organizationId, "reports.read")))
    return new NextResponse("Permesso negato", { status: 403 });

  const url = new URL(request.url);
  const dataset = url.searchParams.get("dataset") ?? "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const fromOk = from && DATE_RE.test(from) ? from : null;
  const toOk = to && DATE_RE.test(to) ? to : null;

  const supabase = await createClient();
  let csv = "";
  let name = "report";

  if (dataset === "payments") {
    name = "pagamenti";
    let q = supabase
      .from("payments")
      .select(
        "paid_on, amount, method, external_reference, athletes(first_name, last_name)",
      )
      .eq("organization_id", org.organizationId)
      .order("paid_on");
    if (fromOk) q = q.gte("paid_on", fromOk);
    if (toOk) q = q.lte("paid_on", toOk);
    const { data } = await q;
    csv = toCsv(
      (data ?? []).map((p) => {
        const a = p.athletes as
          | { first_name: string; last_name: string }
          | null;
        return {
          data: p.paid_on,
          atleta: a ? `${a.last_name} ${a.first_name}` : "",
          metodo: PAYMENT_METHOD_LABEL[p.method] ?? p.method,
          importo: Number(p.amount).toFixed(2),
          riferimento: p.external_reference ?? "",
        };
      }),
      [
        { key: "data", label: "Data" },
        { key: "atleta", label: "Atleta" },
        { key: "metodo", label: "Metodo" },
        { key: "importo", label: "Importo" },
        { key: "riferimento", label: "Riferimento" },
      ],
    );
  } else if (dataset === "fees") {
    name = "quote";
    let q = supabase
      .from("monthly_fees")
      .select(
        "billing_period, due_on, prorated_amount, status, athletes(first_name, last_name)",
      )
      .eq("organization_id", org.organizationId)
      .order("billing_period");
    if (fromOk) q = q.gte("billing_period", fromOk.slice(0, 7) + "-01");
    if (toOk) q = q.lte("billing_period", toOk.slice(0, 7) + "-01");
    const { data } = await q;
    csv = toCsv(
      (data ?? []).map((f) => {
        const a = f.athletes as
          | { first_name: string; last_name: string }
          | null;
        return {
          periodo: String(f.billing_period).slice(0, 7),
          atleta: a ? `${a.last_name} ${a.first_name}` : "",
          scadenza: f.due_on,
          importo: Number(f.prorated_amount).toFixed(2),
          stato: FEE_STATUS_LABEL[f.status] ?? f.status,
        };
      }),
      [
        { key: "periodo", label: "Periodo" },
        { key: "atleta", label: "Atleta" },
        { key: "scadenza", label: "Scadenza" },
        { key: "importo", label: "Importo" },
        { key: "stato", label: "Stato" },
      ],
    );
  } else if (dataset === "athletes") {
    name = "atleti";
    const { data } = await supabase
      .from("athletes")
      .select(
        "first_name, last_name, birth_date, tax_code, email, phone, status, joined_on",
      )
      .eq("organization_id", org.organizationId)
      .order("last_name");
    csv = toCsv(
      (data ?? []).map((a) => ({
        cognome: a.last_name,
        nome: a.first_name,
        nascita: a.birth_date ?? "",
        codice_fiscale: a.tax_code ?? "",
        email: a.email ?? "",
        telefono: a.phone ?? "",
        stato: a.status,
        iscritto_dal: a.joined_on ?? "",
      })),
      [
        { key: "cognome", label: "Cognome" },
        { key: "nome", label: "Nome" },
        { key: "nascita", label: "Data di nascita" },
        { key: "codice_fiscale", label: "Codice fiscale" },
        { key: "email", label: "Email" },
        { key: "telefono", label: "Telefono" },
        { key: "stato", label: "Stato" },
        { key: "iscritto_dal", label: "Iscritto dal" },
      ],
    );
  } else {
    return new NextResponse("Dataset non valido", { status: 400 });
  }

  const stamp = formatShortDate(`${new Date().toISOString().slice(0, 10)}T12:00:00`)
    .replace(/\//g, "-");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="athletix-${name}-${stamp}.csv"`,
    },
  });
}
