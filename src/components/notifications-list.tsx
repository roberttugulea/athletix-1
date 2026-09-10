import Link from "next/link";

import { formatShortDate, formatTime } from "@/lib/format";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/actions/notifications";

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsList({ rows }: { rows: NotificationRow[] }) {
  const unread = rows.filter((r) => !r.read_at).length;

  if (rows.length === 0) {
    return (
      <p className="panel p-5 text-sm text-[var(--muted)]">
        Nessuna notifica.
      </p>
    );
  }

  return (
    <>
      {unread > 0 ? (
        <form action={markAllNotificationsRead} className="mb-3">
          <button
            type="submit"
            className="text-xs font-semibold text-[var(--blue)]"
          >
            Segna tutte come lette ({unread})
          </button>
        </form>
      ) : null}

      <ul className="panel divide-y divide-[#f1f4f9]">
        {rows.map((n) => (
          <li
            key={n.id}
            className={`flex items-start gap-3 p-4 text-sm ${
              n.read_at ? "" : "bg-[#f5f8ff]"
            }`}
          >
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                n.read_at ? "bg-transparent" : "bg-[var(--blue)]"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{n.title}</p>
              {n.body ? (
                <p className="text-[var(--muted)]">{n.body}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {formatShortDate(n.created_at)} {formatTime(n.created_at)}
                {n.url ? (
                  <>
                    {" · "}
                    <Link href={n.url} className="text-[var(--blue)]">
                      apri
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            {!n.read_at ? (
              <form action={markNotificationRead.bind(null, n.id)}>
                <button
                  type="submit"
                  className="text-[11px] font-semibold text-[var(--blue)]"
                >
                  Letta
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
