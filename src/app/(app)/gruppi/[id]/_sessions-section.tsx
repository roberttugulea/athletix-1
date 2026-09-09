import Link from "next/link";

import { EntityForm } from "@/components/ui/entity-form";
import {
  addDays,
  formatShortDate,
  formatTime,
  todayISO,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  cancelSession,
  deleteSession,
  generateSessions,
  reopenSession,
} from "@/server/actions/sessions";

type SessionRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  spaces: { name: string } | null;
};

const STATUS: Record<string, string> = {
  scheduled: "In programma",
  completed: "Svolta",
  cancelled: "Annullata",
};

export async function SessionsSection({ groupId }: { groupId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_sessions")
    .select("id, starts_at, ends_at, status, spaces(name)")
    .eq("group_id", groupId)
    .gte("starts_at", `${addDays(todayISO(), -1)}T00:00:00`)
    .order("starts_at")
    .limit(30);

  const rows = (data ?? []) as unknown as SessionRow[];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold">Sessioni di allenamento</h2>

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
                    {formatShortDate(s.starts_at)}
                  </td>
                  <td className="px-4 py-3">
                    {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {s.spaces?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {STATUS[s.status] ?? s.status}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/presenze/${s.id}`}
                      className="text-xs font-semibold text-[var(--blue)]"
                    >
                      Presenze
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.status === "cancelled" ? (
                      <div className="flex justify-end gap-3">
                        <form action={reopenSession.bind(null, s.id, groupId)}>
                          <button
                            type="submit"
                            className="text-xs font-semibold text-[var(--blue)]"
                          >
                            Riapri
                          </button>
                        </form>
                        <form action={deleteSession.bind(null, s.id, groupId)}>
                          <button
                            type="submit"
                            className="text-xs font-semibold text-red-600"
                          >
                            Elimina
                          </button>
                        </form>
                      </div>
                    ) : (
                      <form action={cancelSession.bind(null, s.id, groupId)}>
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-600"
                        >
                          Annulla
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mb-4 text-xs text-[var(--muted)]">
          Nessuna sessione. Generale dalle fasce orarie qui sotto.
        </p>
      )}

      <EntityForm
        action={generateSessions}
        fields={[
          {
            name: "from",
            label: "Dal",
            type: "date",
            required: true,
          },
          {
            name: "to",
            label: "Al",
            type: "date",
            required: true,
          },
        ]}
        defaults={{ from: todayISO(), to: addDays(todayISO(), 30) }}
        hidden={{ group_id: groupId }}
        submitLabel="Genera sessioni"
      />
    </section>
  );
}
