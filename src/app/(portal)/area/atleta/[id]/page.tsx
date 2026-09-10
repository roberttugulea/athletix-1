import Link from "next/link";
import { notFound } from "next/navigation";

import { getPortalIdentity } from "@/lib/auth/portal";
import { formatShortDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { FEE_STATUS_LABEL, money } from "@/lib/validation/billing";
import {
  CERTIFICATE_STATUS_LABEL,
  daysUntil,
  MEMBERSHIP_STATUS_LABEL,
} from "@/lib/validation/documents";
import { PAYMENT_METHOD_LABEL } from "@/lib/validation/payments";

export const metadata = { title: "Scheda | ATHLETIX" };

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

function expiryNote(iso: string | null, active: boolean) {
  if (!iso) return null;
  if (!active) return null;
  const d = daysUntil(iso);
  if (d < 0)
    return <span className="ml-2 font-semibold text-red-600">scaduto</span>;
  if (d <= 30)
    return (
      <span className="ml-2 font-semibold text-[#b26a00]">tra {d} g</span>
    );
  return null;
}

export default async function PortalAthletePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { athletes } = await getPortalIdentity();
  const identity = athletes.find((a) => a.id === id);
  if (!identity) notFound();

  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [
    { data: athlete },
    { data: groups },
    { data: fees },
    { data: payments },
    { data: certs },
    { data: memberships },
    { data: workouts },
  ] = await Promise.all([
    supabase
      .from("athletes")
      .select("first_name, last_name, birth_date, email, phone, joined_on")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("athlete_groups")
      .select("group_id, starts_on, ends_on, groups(name)")
      .eq("athlete_id", id)
      .order("starts_on", { ascending: false }),
    supabase
      .from("monthly_fees")
      .select("id, billing_period, due_on, prorated_amount, status")
      .eq("athlete_id", id)
      .order("billing_period", { ascending: false })
      .limit(12),
    supabase
      .from("payments")
      .select("id, paid_on, amount, method, status")
      .eq("athlete_id", id)
      .order("paid_on", { ascending: false })
      .limit(12),
    supabase
      .from("medical_certificates")
      .select("id, certificate_type, expires_on, status")
      .eq("athlete_id", id)
      .order("expires_on", { ascending: false }),
    supabase
      .from("fita_memberships")
      .select("id, federation, membership_number, ends_on, status")
      .eq("athlete_id", id)
      .order("starts_on", { ascending: false }),
    supabase
      .from("workout_plans")
      .select("id, title, starts_on, ends_on, workout_plan_items(day_index, exercise, sets, reps, load, rest_seconds)")
      .eq("athlete_id", id)
      .eq("status", "active")
      .order("starts_on", { ascending: false }),
  ]);

  if (!athlete) notFound();

  const groupIds = (groups ?? []).map((g) => g.group_id);
  const { data: sessions } = groupIds.length
    ? await supabase
        .from("training_sessions")
        .select("id, starts_at, ends_at, status, group_id, groups(name)")
        .in("group_id", groupIds)
        .gte("starts_at", `${todayIso}T00:00:00`)
        .neq("status", "cancelled")
        .order("starts_at", { ascending: true })
        .limit(8)
    : { data: [] };

  return (
    <div>
      <Link href="/area" className="text-xs text-[var(--blue)]">
        ← Area personale
      </Link>
      <h1 className="mt-2 text-xl font-bold">
        {athlete.first_name} {athlete.last_name}
      </h1>
      <p className="text-sm text-[var(--muted)]">
        {identity.organizationName} · iscritto dal{" "}
        {formatShortDate(`${athlete.joined_on}T12:00:00`)}
      </p>

      <Panel title="Anagrafica">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-[var(--muted)]">Data di nascita</dt>
          <dd>
            {athlete.birth_date
              ? formatShortDate(`${athlete.birth_date}T12:00:00`)
              : "—"}
          </dd>
          <dt className="text-[var(--muted)]">Email</dt>
          <dd>{athlete.email ?? "—"}</dd>
          <dt className="text-[var(--muted)]">Telefono</dt>
          <dd>{athlete.phone ?? "—"}</dd>
        </dl>
      </Panel>

      <Panel title="Gruppi">
        {(groups ?? []).length ? (
          <ul className="text-sm">
            {(groups ?? []).map((g) => (
              <li
                key={g.group_id}
                className="border-b border-[#f1f4f9] py-2 last:border-0"
              >
                <span className="font-semibold">
                  {(g.groups as { name: string } | null)?.name ?? "Gruppo"}
                </span>
                <span className="ml-2 text-[var(--muted)]">
                  dal {formatShortDate(`${g.starts_on}T12:00:00`)}
                  {g.ends_on
                    ? ` al ${formatShortDate(`${g.ends_on}T12:00:00`)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--muted)]">Nessun gruppo assegnato.</p>
        )}
      </Panel>

      <Panel title="Prossimi allenamenti">
        {(sessions ?? []).length ? (
          <ul className="text-sm">
            {(sessions ?? []).map((s) => (
              <li
                key={s.id}
                className="border-b border-[#f1f4f9] py-2 last:border-0"
              >
                <span className="font-semibold">
                  {formatShortDate(s.starts_at)}
                </span>{" "}
                <span className="text-[var(--muted)]">
                  {formatTime(s.starts_at)}–{formatTime(s.ends_at)} ·{" "}
                  {(s.groups as { name: string } | null)?.name ?? "Gruppo"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessun allenamento in programma.
          </p>
        )}
      </Panel>

      <Panel title="Quote">
        {(fees ?? []).length ? (
          <ul className="text-sm">
            {(fees ?? []).map((f) => (
              <li
                key={f.id}
                className="flex justify-between border-b border-[#f1f4f9] py-2 last:border-0"
              >
                <span>
                  {formatShortDate(`${f.billing_period}T12:00:00`).slice(3)}
                  <span className="ml-2 text-[var(--muted)]">
                    scad. {formatShortDate(`${f.due_on}T12:00:00`)}
                  </span>
                </span>
                <span>
                  {money(Number(f.prorated_amount))}
                  <span
                    className={`ml-2 font-semibold ${
                      f.status === "paid"
                        ? "text-[#1f7a3d]"
                        : f.status === "overdue"
                          ? "text-red-600"
                          : "text-[var(--muted)]"
                    }`}
                  >
                    {FEE_STATUS_LABEL[f.status] ?? f.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--muted)]">Nessuna quota registrata.</p>
        )}
      </Panel>

      <Panel title="Pagamenti">
        {(payments ?? []).length ? (
          <ul className="text-sm">
            {(payments ?? []).map((p) => (
              <li
                key={p.id}
                className="flex justify-between border-b border-[#f1f4f9] py-2 last:border-0"
              >
                <span>
                  {formatShortDate(`${p.paid_on}T12:00:00`)}
                  <span className="ml-2 text-[var(--muted)]">
                    {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                  </span>
                </span>
                <span className="font-semibold">
                  {money(Number(p.amount))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessun pagamento registrato.
          </p>
        )}
      </Panel>

      <Panel title="Certificati medici">
        {(certs ?? []).length ? (
          <ul className="text-sm">
            {(certs ?? []).map((c) => (
              <li
                key={c.id}
                className="border-b border-[#f1f4f9] py-2 last:border-0"
              >
                <span className="font-semibold">{c.certificate_type}</span>
                <span className="ml-2 text-[var(--muted)]">
                  scad. {formatShortDate(`${c.expires_on}T12:00:00`)}
                </span>
                <span className="ml-2 text-[var(--muted)]">
                  {CERTIFICATE_STATUS_LABEL[c.status] ?? c.status}
                </span>
                {expiryNote(c.expires_on, c.status === "valid")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessun certificato caricato.
          </p>
        )}
      </Panel>

      <Panel title="Tesseramenti">
        {(memberships ?? []).length ? (
          <ul className="text-sm">
            {(memberships ?? []).map((m) => (
              <li
                key={m.id}
                className="border-b border-[#f1f4f9] py-2 last:border-0"
              >
                <span className="font-semibold">{m.federation}</span>
                <span className="ml-2 text-[var(--muted)]">
                  n. {m.membership_number}
                </span>
                {m.ends_on ? (
                  <span className="ml-2 text-[var(--muted)]">
                    scad. {formatShortDate(`${m.ends_on}T12:00:00`)}
                  </span>
                ) : null}
                <span className="ml-2 text-[var(--muted)]">
                  {MEMBERSHIP_STATUS_LABEL[m.status] ?? m.status}
                </span>
                {expiryNote(m.ends_on, m.status === "active")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessun tesseramento registrato.
          </p>
        )}
      </Panel>

      <Panel title="Schede di allenamento">
        {(workouts ?? []).length ? (
          (workouts ?? []).map((w) => {
            const items = (w.workout_plan_items ?? []) as {
              day_index: number;
              exercise: string;
              sets: number | null;
              reps: string | null;
              load: string | null;
              rest_seconds: number | null;
            }[];
            const byDay = new Map<number, typeof items>();
            for (const it of [...items].sort(
              (a, b) => a.day_index - b.day_index,
            )) {
              if (!byDay.has(it.day_index)) byDay.set(it.day_index, []);
              byDay.get(it.day_index)!.push(it);
            }
            return (
              <div key={w.id} className="mb-4 last:mb-0">
                <p className="text-sm font-semibold">{w.title}</p>
                <p className="mb-2 text-xs text-[var(--muted)]">
                  dal {formatShortDate(`${w.starts_on}T12:00:00`)}
                  {w.ends_on
                    ? ` al ${formatShortDate(`${w.ends_on}T12:00:00`)}`
                    : ""}
                </p>
                {[...byDay.entries()].map(([day, list]) => (
                  <div key={day} className="mb-2">
                    <p className="text-xs font-bold text-[var(--muted)]">
                      Giorno {day}
                    </p>
                    <ul className="text-sm">
                      {list.map((it, i) => (
                        <li key={i} className="py-1">
                          <span className="font-semibold">{it.exercise}</span>
                          <span className="ml-2 text-[var(--muted)]">
                            {[
                              it.sets != null ? `${it.sets} serie` : null,
                              it.reps ? `${it.reps} rip` : null,
                              it.load,
                              it.rest_seconds != null
                                ? `rec ${it.rest_seconds}s`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Nessuna scheda attiva.
          </p>
        )}
      </Panel>
    </div>
  );
}
