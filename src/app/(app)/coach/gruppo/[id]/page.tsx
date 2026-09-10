import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { getCoachContext } from "@/lib/auth/coach";
import { hasPermission } from "@/lib/auth/permissions";
import {
  addDays,
  formatShortDate,
  formatTime,
  todayISO,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Gruppo | ATHLETIX" };

type EnrollRow = {
  athlete_id: string;
  athletes: { first_name: string; last_name: string } | null;
};

const STATUS: Record<string, string> = {
  scheduled: "In programma",
  completed: "Svolta",
  cancelled: "Annullata",
};

export default async function CoachGroupPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("attendance.manage");
  const coach = await getCoachContext(org.organizationId);
  const canManageGroups = await hasPermission(org.organizationId, "groups.manage");

  if (!coach.groupIds.includes(id) && !canManageGroups) notFound();

  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, capacity, seasons(name), disciplines(name)")
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();
  if (!group) notFound();

  const [{ data: enrolled }, { data: sessions }] = await Promise.all([
    supabase
      .from("athlete_groups")
      .select("athlete_id, athletes(first_name, last_name)")
      .eq("group_id", id)
      .is("ends_on", null),
    supabase
      .from("training_sessions")
      .select("id, starts_at, ends_at, status")
      .eq("group_id", id)
      .gte("starts_at", `${addDays(todayISO(), -7)}T00:00:00`)
      .lt("starts_at", `${addDays(todayISO(), 21)}T00:00:00`)
      .order("starts_at"),
  ]);

  const athletes = ((enrolled ?? []) as unknown as EnrollRow[])
    .map((e) => ({
      id: e.athlete_id,
      name: `${e.athletes?.last_name ?? ""} ${e.athletes?.first_name ?? ""}`.trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/coach/area", label: "Area coach" },
          { label: group.name },
        ]}
      />
      <PageHeader
        eyebrow="Operatività"
        title={group.name}
        subtitle={[
          (group.disciplines as { name: string } | null)?.name,
          (group.seasons as { name: string } | null)?.name,
          `${athletes.length} atleti${group.capacity ? ` / ${group.capacity}` : ""}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <section className="mt-2">
        <h2 className="mb-3 text-sm font-bold">Atleti iscritti</h2>
        {athletes.length ? (
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {athletes.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[#f1f4f9] last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold">{a.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/schede/${a.id}`}
                        className="text-xs font-semibold text-[var(--blue)]"
                      >
                        Schede allenamento
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessun atleta iscritto a questo gruppo.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold">Sessioni</h2>
        {(sessions ?? []).length ? (
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {(sessions ?? []).map((s) => (
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
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {STATUS[s.status] ?? s.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "cancelled" ? (
                        <span className="text-xs text-[var(--muted)]">—</span>
                      ) : (
                        <Link
                          href={`/presenze/${s.id}`}
                          className="text-xs font-semibold text-[var(--blue)]"
                        >
                          Presenze
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessuna sessione nel periodo.
          </p>
        )}
      </section>
    </div>
  );
}
