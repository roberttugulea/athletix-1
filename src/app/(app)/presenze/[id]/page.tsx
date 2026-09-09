import { notFound } from "next/navigation";

import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/lib/validation/attendance";
import { AttendanceForm, type AthleteAttendance } from "../_attendance-form";

export const metadata = { title: "Registro presenze | ATHLETIX" };

type EnrollRow = {
  athlete_id: string;
  athletes: { first_name: string; last_name: string } | null;
};

export default async function PresenzeSessionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("attendance.manage");
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("training_sessions")
    .select("id, starts_at, ends_at, status, group_id, groups(name), spaces(name)")
    .eq("organization_id", org.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();
  const group = session.groups as { name: string } | null;
  const space = session.spaces as { name: string } | null;

  const [{ data: enrolled }, { data: existing }] = await Promise.all([
    supabase
      .from("athlete_groups")
      .select("athlete_id, athletes(first_name, last_name)")
      .eq("group_id", session.group_id)
      .is("ends_on", null),
    supabase
      .from("attendances")
      .select("athlete_id, status")
      .eq("training_session_id", id),
  ]);

  const current = new Map<string, AttendanceStatus>(
    (existing ?? []).map((a) => [a.athlete_id, a.status as AttendanceStatus]),
  );

  const athletes: AthleteAttendance[] = ((enrolled ?? []) as unknown as EnrollRow[])
    .map((e) => ({
      athleteId: e.athlete_id,
      name: `${e.athletes?.last_name ?? ""} ${e.athletes?.first_name ?? ""}`.trim(),
      current: current.get(e.athlete_id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/presenze", label: "Presenze" },
          { label: group?.name ?? "Sessione" },
        ]}
      />
      <PageHeader
        eyebrow="Operatività"
        title={`${group?.name ?? "Sessione"} · ${formatShortDate(session.starts_at)}`}
        subtitle={`${formatTime(session.starts_at)}–${formatTime(session.ends_at)}${
          space?.name ? ` · ${space.name}` : ""
        }`}
      />

      {session.status === "cancelled" ? (
        <p className="mb-4 rounded-lg bg-[#fff5e5] px-3 py-2 text-xs text-[#8a5a12]">
          Sessione annullata.
        </p>
      ) : null}

      {athletes.length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <span className="empty-icon">♟</span>
            <p>Nessun atleta iscritto a questo gruppo.</p>
          </div>
        </div>
      ) : (
        <AttendanceForm sessionId={session.id} athletes={athletes} />
      )}
    </div>
  );
}
