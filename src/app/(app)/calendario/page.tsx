import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { getCoachContext } from "@/lib/auth/coach";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import {
  addDays,
  dayKey,
  formatDay,
  formatTime,
  mondayOf,
  todayISO,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const NO_MATCH = "00000000-0000-0000-0000-000000000000";

export const metadata = { title: "Calendario | ATHLETIX" };

type SessionRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  group_id: string;
  groups: { name: string } | null;
  spaces: { name: string } | null;
};

const STATUS: Record<string, string> = {
  scheduled: "In programma",
  completed: "Svolta",
  cancelled: "Annullata",
};

export default async function CalendarioPage(props: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await props.searchParams;
  const org = await requirePermission("attendance.manage");
  const supabase = await createClient();

  const monday = mondayOf(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : todayISO());
  const sunday = addDays(monday, 6);
  const rangeStart = `${monday}T00:00:00`;
  const rangeEnd = `${addDays(monday, 7)}T00:00:00`;

  const coach = await getCoachContext(org.organizationId);
  const scopeToCoach =
    coach.isCoach &&
    !(await hasPermission(org.organizationId, "groups.manage"));
  const groupHref = (gid: string) =>
    scopeToCoach ? `/coach/gruppo/${gid}` : `/gruppi/${gid}`;

  let query = supabase
    .from("training_sessions")
    .select(
      "id, starts_at, ends_at, status, group_id, groups(name), spaces(name)",
    )
    .eq("organization_id", org.organizationId)
    .gte("starts_at", rangeStart)
    .lt("starts_at", rangeEnd)
    .order("starts_at");
  if (scopeToCoach) {
    query = query.in("group_id", coach.groupIds.length ? coach.groupIds : [NO_MATCH]);
  }
  const { data } = await query;

  const rows = (data ?? []) as unknown as SessionRow[];
  const byDay = new Map<string, SessionRow[]>();
  for (let i = 0; i < 7; i++) byDay.set(addDays(monday, i), []);
  for (const s of rows) {
    const k = dayKey(s.starts_at);
    if (byDay.has(k)) byDay.get(k)!.push(s);
  }

  return (
    <div className="content">
      <PageHeader
        eyebrow="Operatività"
        title="Calendario"
        subtitle={`Settimana ${monday} – ${sunday}`}
      />

      <div className="mb-4 flex items-center gap-3 text-sm">
        <Link
          href={`/calendario?week=${addDays(monday, -7)}`}
          className="rounded-lg border border-[#cbd9fb] bg-white px-3 py-1.5 font-semibold text-[var(--blue)]"
        >
          ← Settimana precedente
        </Link>
        <Link
          href="/calendario"
          className="text-xs font-semibold text-[var(--muted)]"
        >
          Oggi
        </Link>
        <Link
          href={`/calendario?week=${addDays(monday, 7)}`}
          className="rounded-lg border border-[#cbd9fb] bg-white px-3 py-1.5 font-semibold text-[var(--blue)]"
        >
          Settimana successiva →
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <span className="empty-icon">□</span>
            <p>
              Nessuna sessione questa settimana. Genera le sessioni dalla scheda
              di un gruppo.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {[...byDay.entries()].map(([day, sessions]) => (
            <div key={day} className="panel p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                {formatDay(`${day}T12:00:00`)}
              </p>
              {sessions.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">—</p>
              ) : (
                <ul className="space-y-1.5">
                  {sessions.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold tabular-nums">
                        {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                      </span>
                      <Link
                        href={groupHref(s.group_id)}
                        className="text-[var(--blue)]"
                      >
                        {s.groups?.name ?? "Gruppo"}
                      </Link>
                      <span className="text-[var(--muted)]">
                        {s.spaces?.name ?? ""}
                      </span>
                      {s.status !== "scheduled" ? (
                        <span className="rounded bg-[#f1f4f9] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                          {(STATUS[s.status] ?? s.status).toUpperCase()}
                        </span>
                      ) : null}
                      <Link
                        href={`/presenze/${s.id}`}
                        className="ml-auto text-xs font-semibold text-[var(--blue)]"
                      >
                        Presenze
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
