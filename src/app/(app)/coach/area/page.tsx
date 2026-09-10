import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { getCoachContext } from "@/lib/auth/coach";
import { addDays, formatShortDate, formatTime, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Area coach | ATHLETIX" };

export default async function CoachAreaPage() {
  const org = await requirePermission("attendance.manage");
  const coach = await getCoachContext(org.organizationId);
  const supabase = await createClient();

  if (!coach.isCoach) {
    return (
      <div className="content">
        <PageHeader eyebrow="Operatività" title="Area coach" />
        <p className="panel p-4 text-sm text-[var(--muted)]">
          Il tuo account non è collegato a un&apos;anagrafica coach. Chiedi alla
          segreteria di associarti dalla sezione Coach.
        </p>
      </div>
    );
  }

  const ids = coach.groupIds;
  const [{ data: groups }, { data: enrollments }, { data: sessions }] =
    ids.length
      ? await Promise.all([
          supabase
            .from("groups")
            .select("id, name, seasons(name)")
            .in("id", ids)
            .order("name"),
          supabase
            .from("athlete_groups")
            .select("group_id")
            .in("group_id", ids)
            .is("ends_on", null),
          supabase
            .from("training_sessions")
            .select("id, starts_at, ends_at, status, group_id")
            .in("group_id", ids)
            .gte("starts_at", `${todayISO()}T00:00:00`)
            .lt("starts_at", `${addDays(todayISO(), 8)}T00:00:00`)
            .neq("status", "cancelled")
            .order("starts_at"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  type SessionRow = {
    id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    group_id: string;
  };

  const countByGroup = new Map<string, number>();
  for (const e of enrollments ?? [])
    countByGroup.set(e.group_id, (countByGroup.get(e.group_id) ?? 0) + 1);

  const nextByGroup = new Map<string, SessionRow>();
  for (const s of (sessions ?? []) as SessionRow[])
    if (!nextByGroup.has(s.group_id)) nextByGroup.set(s.group_id, s);

  return (
    <div className="content">
      <PageHeader
        eyebrow="Operatività"
        title="Area coach"
        subtitle="I gruppi che ti sono stati assegnati."
      />

      {(groups ?? []).length === 0 ? (
        <p className="panel p-4 text-sm text-[var(--muted)]">
          Non hai gruppi assegnati al momento.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(groups ?? []).map((g) => {
            const next = nextByGroup.get(g.id);
            return (
              <Link
                key={g.id}
                href={`/coach/gruppo/${g.id}`}
                className="panel block p-5 transition hover:border-[#cbd9fb]"
              >
                <strong className="block text-sm">{g.name}</strong>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {(g.seasons as { name: string } | null)?.name ?? "—"} ·{" "}
                  {countByGroup.get(g.id) ?? 0} atleti
                </span>
                <span className="mt-2 block text-xs">
                  {next ? (
                    <>
                      Prossimo:{" "}
                      <span className="font-semibold">
                        {formatShortDate(next.starts_at)} {formatTime(next.starts_at)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[var(--muted)]">
                      Nessuna sessione nei prossimi 7 giorni
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
