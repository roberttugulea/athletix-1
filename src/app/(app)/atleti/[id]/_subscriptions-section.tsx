import { EntityForm } from "@/components/ui/entity-form";
import type { FieldConfig } from "@/components/ui/entity-form";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  money,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/validation/billing";
import {
  activateSubscription,
  cancelSubscription,
} from "@/server/actions/billing";

type Row = {
  id: string;
  starts_on: string;
  ends_on: string;
  price: number;
  status: string;
  subscription_plans: { name: string } | null;
};

export async function SubscriptionsSection({
  athleteId,
  organizationId,
}: {
  athleteId: string;
  organizationId: string;
}) {
  const supabase = await createClient();

  const [{ data: subs }, { data: plans }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, starts_on, ends_on, price, status, subscription_plans(name)")
      .eq("athlete_id", athleteId)
      .order("starts_on", { ascending: false }),
    supabase
      .from("subscription_plans")
      .select("id, name, duration_months, price")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("name"),
  ]);

  const rows = (subs ?? []) as unknown as Row[];

  const fields: FieldConfig[] = [
    {
      name: "plan_id",
      label: "Pacchetto",
      type: "select",
      required: true,
      options: (plans ?? []).map((p) => ({
        value: p.id,
        label: `${p.name} · ${p.duration_months} mesi · ${money(Number(p.price))}`,
      })),
      width: "full",
    },
    { name: "starts_on", label: "Attivo dal", type: "date", required: true },
  ];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Pacchetti / abbonamenti</h2>

      {rows.length > 0 ? (
        <div className="panel mb-4" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[#f1f4f9] last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    {s.subscription_plans?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {s.starts_on} → {s.ends_on}
                  </td>
                  <td className="px-4 py-3">{money(Number(s.price))}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {SUBSCRIPTION_STATUS_LABEL[s.status] ?? s.status}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.status === "active" ? (
                      <form
                        action={cancelSubscription.bind(null, s.id, athleteId)}
                      >
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-600"
                        >
                          Annulla
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mb-4 text-xs text-[var(--muted)]">
          Nessun pacchetto attivo.
        </p>
      )}

      {(plans ?? []).length > 0 ? (
        <EntityForm
          action={activateSubscription}
          fields={fields}
          defaults={{ starts_on: todayISO() }}
          hidden={{ athlete_id: athleteId }}
          submitLabel="Attiva pacchetto"
        />
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Nessun piano pacchetto disponibile: creane in Abbonamenti → Piani
          pacchetto.
        </p>
      )}
    </section>
  );
}
