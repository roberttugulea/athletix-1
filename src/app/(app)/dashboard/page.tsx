import Link from "next/link";

import { getCoachContext } from "@/lib/auth/coach";
import { getPermissions, resolvePermission } from "@/lib/auth/permissions";
import { requireActiveOrg } from "@/lib/auth/session";
import {
  addDays,
  formatDay,
  formatShortDate,
  formatTime,
  todayISO,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/validation/billing";

export const metadata = { title: "Dashboard | ATHLETIX" };

const NO_MATCH = "00000000-0000-0000-0000-000000000000";

type SessionRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  group_id: string;
  groups: { name: string } | null;
  spaces: { name: string } | null;
};

function Stat({
  color,
  icon,
  label,
  value,
  note,
}: {
  color: "blue" | "purple" | "amber" | "green";
  icon: string;
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <article className="summary-card">
      <span className={`summary-icon ${color}`}>
        {icon}
        <i />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export default async function DashboardPage(props: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await props.searchParams;
  const org = await requireActiveOrg();
  const oid = org.organizationId;
  const perms = await getPermissions(oid);
  const can = (k: Parameters<typeof resolvePermission>[1]) =>
    resolvePermission(perms, k);
  const isAdmin = can("organization.manage");

  const coach = await getCoachContext(oid);
  const scopeToCoach = coach.isCoach && !can("groups.manage");
  const groupIds = coach.groupIds.length ? coach.groupIds : [NO_MATCH];

  const supabase = await createClient();
  const today = todayISO();
  const monthStart = `${today.slice(0, 7)}-01`;
  const since30 = `${addDays(today, -30)}T00:00:00`;

  const canSeeGroups =
    scopeToCoach || can("groups.manage") || can("people.manage") || can("attendance.manage");

  // ---------------------------------------------------------- query parallele
  const [
    settingsRes,
    athletesCount,
    groupsCount,
    sessionsRes,
    attTotal,
    attPresent,
    unreadCount,
    certRes,
    membershipRes,
    feesOpenRes,
    feesMonthRes,
    paymentsRes,
    refundsRes,
  ] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("certificate_alert_days, membership_alert_days")
      .eq("organization_id", oid)
      .maybeSingle(),

    // atleti attivi (staff: tutta l'organizzazione; coach: solo i suoi gruppi)
    (async (): Promise<number | null> => {
      if (can("people.manage")) {
        const r = await supabase
          .from("athletes")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", oid)
          .eq("status", "active");
        return r.count ?? 0;
      }
      if (scopeToCoach) {
        const r = await supabase
          .from("athlete_groups")
          .select("athlete_id")
          .in("group_id", groupIds)
          .is("ends_on", null);
        return new Set((r.data ?? []).map((x) => x.athlete_id)).size;
      }
      return null;
    })(),

    // gruppi attivi
    (async (): Promise<number | null> => {
      if (scopeToCoach) return coach.groupIds.length;
      if (!canSeeGroups) return null;
      const r = await supabase
        .from("groups")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", oid)
        .eq("active", true);
      return r.count ?? 0;
    })(),

    // sessioni dei prossimi 7 giorni
    can("attendance.manage")
      ? (() => {
          let q = supabase
            .from("training_sessions")
            .select(
              "id, starts_at, ends_at, status, group_id, groups(name), spaces(name)",
            )
            .eq("organization_id", oid)
            .gte("starts_at", `${today}T00:00:00`)
            .lt("starts_at", `${addDays(today, 7)}T00:00:00`)
            .neq("status", "cancelled")
            .order("starts_at")
            .limit(50);
          if (scopeToCoach) q = q.in("group_id", groupIds);
          return q;
        })()
      : Promise.resolve(null),

    // presenze registrate negli ultimi 30 giorni (+ quante "presente/ritardo")
    (async (): Promise<number | null> => {
      if (!can("attendance.manage")) return null;
      let q = supabase
        .from("attendances")
        .select("athlete_id, training_sessions!inner(group_id)", {
          count: "exact",
          head: true,
        })
        .gte("recorded_at", since30);
      if (scopeToCoach) q = q.in("training_sessions.group_id", groupIds);
      return (await q).count ?? 0;
    })(),
    (async (): Promise<number | null> => {
      if (!can("attendance.manage")) return null;
      let q = supabase
        .from("attendances")
        .select("athlete_id, training_sessions!inner(group_id)", {
          count: "exact",
          head: true,
        })
        .in("status", ["present", "late"])
        .gte("recorded_at", since30);
      if (scopeToCoach) q = q.in("training_sessions.group_id", groupIds);
      return (await q).count ?? 0;
    })(),

    // notifiche non lette (RLS: solo le proprie)
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)
      .then((r) => r.count ?? 0),

    // documenti
    can("documents.manage")
      ? supabase
          .from("medical_certificates")
          .select("expires_on")
          .eq("organization_id", oid)
          .eq("status", "valid")
      : Promise.resolve(null),
    can("people.manage")
      ? supabase
          .from("fita_memberships")
          .select("ends_on")
          .eq("organization_id", oid)
          .eq("status", "active")
          .not("ends_on", "is", null)
      : Promise.resolve(null),

    // economia
    can("finance.manage")
      ? supabase
          .from("monthly_fees")
          .select("status, prorated_amount")
          .eq("organization_id", oid)
          .in("status", ["overdue", "unpaid"])
      : Promise.resolve(null),
    can("finance.manage")
      ? supabase
          .from("monthly_fees")
          .select("status, prorated_amount")
          .eq("organization_id", oid)
          .eq("billing_period", monthStart)
      : Promise.resolve(null),
    can("finance.manage")
      ? supabase
          .from("payments")
          .select("amount")
          .eq("organization_id", oid)
          .gte("paid_on", monthStart)
      : Promise.resolve(null),
    can("finance.manage")
      ? supabase
          .from("refunds")
          .select("amount")
          .eq("organization_id", oid)
          .gte("refunded_on", monthStart)
      : Promise.resolve(null),
  ]);

  // ------------------------------------------------------------- derivati
  const sessions = (sessionsRes?.data ?? []) as unknown as SessionRow[];
  const attRate =
    attTotal && attPresent != null
      ? Math.round((attPresent / attTotal) * 100)
      : null;

  const certDays = settingsRes.data?.certificate_alert_days ?? 30;
  const memDays = settingsRes.data?.membership_alert_days ?? 30;
  const certLimit = addDays(today, certDays);
  const memLimit = addDays(today, memDays);
  const certAlerts = certRes
    ? (certRes.data ?? []).filter((c) => c.expires_on <= certLimit).length
    : null;
  const memAlerts = membershipRes
    ? (membershipRes.data ?? []).filter(
        (m) => m.ends_on != null && m.ends_on <= memLimit,
      ).length
    : null;

  const sum = (rows: { amount?: number; prorated_amount?: number }[] | null) =>
    (rows ?? []).reduce(
      (s, r) => s + Number(r.amount ?? r.prorated_amount ?? 0),
      0,
    );
  const feesOpen = feesOpenRes?.data ?? [];
  const feesMonth = feesMonthRes?.data ?? [];
  const paidThisMonth = sum(paymentsRes?.data ?? []) - sum(refundsRes?.data ?? []);
  const monthPaid = feesMonth.filter((f) => f.status === "paid").length;
  const monthDue = feesMonth.filter((f) => f.status === "due").length;

  const showOps =
    athletesCount != null ||
    groupsCount != null ||
    sessionsRes != null ||
    attTotal != null;
  const needsSetup =
    isAdmin && ((athletesCount ?? 1) === 0 || (groupsCount ?? 1) === 0);

  const alerts: { href: string; label: string; count: number; warn: boolean }[] = [
    {
      href: "/notifiche",
      label: "Notifiche non lette",
      count: unreadCount,
      warn: unreadCount > 0,
    },
  ];
  if (certAlerts != null)
    alerts.push({
      href: "/certificati",
      label: `Certificati medici in scadenza (${certDays} g) o scaduti`,
      count: certAlerts,
      warn: certAlerts > 0,
    });
  if (memAlerts != null)
    alerts.push({
      href: "/tesseramenti",
      label: `Tesseramenti in scadenza (${memDays} g)`,
      count: memAlerts,
      warn: memAlerts > 0,
    });
  if (feesOpenRes)
    alerts.push({
      href: "/abbonamenti/quote",
      label: `Quote scadute (${money(sum(feesOpen))})`,
      count: feesOpen.length,
      warn: feesOpen.length > 0,
    });

  return (
    <div className="content">
      {denied ? (
        <p className="mb-6 rounded-lg bg-[#fdecec] px-3 py-2 text-xs text-red-700">
          Non hai i permessi per accedere a quella sezione.
        </p>
      ) : null}

      <div className="page-heading">
        <div>
          <p className="eyebrow">PANORAMICA</p>
          <h1>{org.organizationName}</h1>
          <p className="subtitle">
            Oggi è {formatDay(`${today}T12:00:00`)}.
            {scopeToCoach ? " Ecco i tuoi gruppi e i prossimi allenamenti." : ""}
          </p>
        </div>
      </div>

      {showOps ? (
        <section className="summary-grid" aria-label="Riepilogo attività">
          {athletesCount != null ? (
            <Stat
              color="blue"
              icon="♟"
              label={scopeToCoach ? "Miei atleti" : "Atleti attivi"}
              value={athletesCount}
              note={athletesCount === 0 ? "Nessun atleta ancora" : "Iscritti attivi"}
            />
          ) : null}
          {groupsCount != null ? (
            <Stat
              color="purple"
              icon="◉"
              label={scopeToCoach ? "Miei gruppi" : "Gruppi attivi"}
              value={groupsCount}
              note={groupsCount === 0 ? "Da configurare" : "Corsi in corso"}
            />
          ) : null}
          {sessionsRes != null ? (
            <Stat
              color="amber"
              icon="▤"
              label="Allenamenti in programma"
              value={sessions.length}
              note="Prossimi 7 giorni"
            />
          ) : null}
          {attTotal != null ? (
            <Stat
              color="green"
              icon="✓"
              label="Presenze registrate"
              value={attTotal}
              note={
                attRate == null
                  ? "Ultimi 30 giorni"
                  : `Ultimi 30 giorni · ${attRate}% presenti`
              }
            />
          ) : null}
        </section>
      ) : null}

      {feesOpenRes ? (
        <section className="summary-grid" aria-label="Riepilogo economico">
          <Stat
            color="green"
            icon="€"
            label="Incassato nel mese"
            value={money(paidThisMonth)}
            note="Pagamenti meno rimborsi"
          />
          <Stat
            color="blue"
            icon="▭"
            label="Quote del mese pagate"
            value={`${monthPaid}/${feesMonth.length}`}
            note={feesMonth.length === 0 ? "Nessuna quota generata" : "Mese corrente"}
          />
          <Stat
            color="amber"
            icon="◔"
            label="Quote da incassare"
            value={monthDue}
            note="Ancora in scadenza questo mese"
          />
          <Stat
            color="purple"
            icon="!"
            label="Quote scadute"
            value={feesOpen.length}
            note={money(sum(feesOpen))}
          />
        </section>
      ) : null}

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Prossimi allenamenti</h2>
              <p>I prossimi 7 giorni</p>
            </div>
            {sessionsRes != null ? (
              <Link href="/calendario" className="text-button">
                Apri calendario →
              </Link>
            ) : null}
          </div>
          {sessionsRes == null ? (
            <div className="empty-state">
              <span className="empty-icon">▤</span>
              <p>Il calendario non è disponibile per il tuo ruolo.</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">▤</span>
              <h3>Nessun allenamento in programma</h3>
              <p>
                Genera le sessioni dalla scheda di un gruppo per vederle qui.
              </p>
            </div>
          ) : (
            <ul>
              {sessions.slice(0, 8).map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#f1f4f9] px-[22px] py-3 text-sm last:border-0"
                >
                  <span className="w-[88px] shrink-0 font-semibold">
                    {formatShortDate(s.starts_at)}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                  </span>
                  <Link
                    href={
                      scopeToCoach
                        ? `/coach/gruppo/${s.group_id}`
                        : `/gruppi/${s.group_id}`
                    }
                    className="font-semibold text-[var(--blue)]"
                  >
                    {s.groups?.name ?? "Gruppo"}
                  </Link>
                  <span className="text-[var(--muted)]">
                    {s.spaces?.name ?? ""}
                  </span>
                  <Link
                    href={`/presenze/${s.id}`}
                    className="ml-auto text-xs font-semibold text-[var(--blue)]"
                  >
                    {s.status === "completed" ? "Vedi presenze" : "Registra presenze"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Da tenere d&apos;occhio</h2>
              <p>Scadenze e avvisi</p>
            </div>
          </div>
          <ul>
            {alerts.map((a) => (
              <li key={a.href} className="border-b border-[#eef1f5] last:border-0">
                <Link
                  href={a.href}
                  className="flex items-center justify-between gap-3 px-[22px] py-3.5 text-sm hover:bg-[#fafbfe]"
                >
                  <span className="text-[#31415d]">{a.label}</span>
                  <span
                    className={`min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-bold ${
                      a.warn
                        ? "bg-[#fff1e0] text-[#b26a00]"
                        : "bg-[#f1f4f9] text-[var(--muted)]"
                    }`}
                  >
                    {a.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {needsSetup ? (
        <section className="panel onboarding">
          <div className="onboarding-copy">
            <span>✦</span>
            <div>
              <p className="eyebrow">PRIMI PASSI</p>
              <h2>Completa la configurazione iniziale</h2>
              <p>
                Aggiungi i{" "}
                <Link href="/atleti/nuovo" className="font-semibold text-[var(--blue)]">
                  primi atleti
                </Link>
                , crea un{" "}
                <Link href="/gruppi/nuovo" className="font-semibold text-[var(--blue)]">
                  gruppo
                </Link>{" "}
                con le sue fasce orarie e genera le sessioni: da quel momento
                calendario, presenze e quote iniziano a popolarsi.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
