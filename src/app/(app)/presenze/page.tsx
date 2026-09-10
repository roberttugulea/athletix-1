import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { getCoachContext } from "@/lib/auth/coach";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { addDays, formatShortDate, formatTime, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const NO_MATCH = "00000000-0000-0000-0000-000000000000";

export const metadata = { title: "Presenze | ATHLETIX" };

type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  group_id: string;
  groups: { name: string } | null;
};

const STATUS: Record<string, string> = {
  scheduled: "In programma",
  completed: "Svolta",
  cancelled: "Annullata",
};

export default async function PresenzeListPage() {
  const org = await requirePermission("attendance.manage");
  const supabase = await createClient();

  const coach = await getCoachContext(org.organizationId);
  const scopeToCoach =
    coach.isCoach &&
    !(await hasPermission(org.organizationId, "groups.manage"));
  const groupHref = (gid: string) =>
    scopeToCoach ? `/coach/gruppo/${gid}` : `/gruppi/${gid}`;

  let query = supabase
    .from("training_sessions")
    .select("id, starts_at, ends_at, status, group_id, groups(name)")
    .eq("organization_id", org.organizationId)
    .gte("starts_at", `${addDays(todayISO(), -14)}T00:00:00`)
    .lt("starts_at", `${addDays(todayISO(), 14)}T00:00:00`)
    .order("starts_at");
  if (scopeToCoach) {
    query = query.in("group_id", coach.groupIds.length ? coach.groupIds : [NO_MATCH]);
  }
  const { data } = await query;

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="content">
      <PageHeader
        eyebrow="Operatività"
        title="Presenze"
        subtitle="Sessioni delle ultime due settimane e delle prossime due."
      />
      {rows.length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <span className="empty-icon">✓</span>
            <p>
              Nessuna sessione nel periodo. Genera le sessioni dalla scheda di un
              gruppo.
            </p>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[#f1f4f9] last:border-0 hover:bg-[#fafbfe]"
                >
                  <td className="px-4 py-3 font-semibold">
                    {formatShortDate(s.starts_at)}
                  </td>
                  <td className="px-4 py-3">
                    {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={groupHref(s.group_id)}
                      className="text-[var(--blue)]"
                    >
                      {s.groups?.name ?? "Gruppo"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {STATUS[s.status] ?? s.status}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/presenze/${s.id}`}
                      className="text-xs font-semibold text-[var(--blue)]"
                    >
                      Registra
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
