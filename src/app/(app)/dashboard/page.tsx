import { getPermissions, resolvePermission } from "@/lib/auth/permissions";
import { requireActiveOrg } from "@/lib/auth/session";

export const metadata = { title: "Dashboard | ATHLETIX" };

const STATS = [
  { color: "blue", icon: "♟", label: "Atleti", note: "Nessun dato ancora" },
  { color: "purple", icon: "◉", label: "Gruppi attivi", note: "Da configurare" },
  { color: "amber", icon: "▤", label: "Attività in programma", note: "Calendario da configurare" },
  { color: "green", icon: "✓", label: "Presenze registrate", note: "In attesa di rilevazioni" },
];

export default async function DashboardPage(props: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await props.searchParams;
  const org = await requireActiveOrg();
  const permissions = await getPermissions(org.organizationId);
  const isAdmin = resolvePermission(permissions, "organization.manage");

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
            {isAdmin
              ? "Completa la configurazione iniziale per iniziare a lavorare."
              : "Benvenuto in ATHLETIX."}
          </p>
        </div>
      </div>

      <section className="summary-grid" aria-label="Riepilogo organizzazione">
        {STATS.map((s) => (
          <article key={s.label} className="summary-card">
            <span className={`summary-icon ${s.color}`}>
              {s.icon}
              <i />
            </span>
            <div>
              <p>{s.label}</p>
              <strong>—</strong>
              <small>{s.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="panel onboarding">
        <div className="onboarding-copy">
          <span>✦</span>
          <div>
            <p className="eyebrow">PRIMI PASSI</p>
            <h2>La tua organizzazione è pronta</h2>
            <p>
              L&apos;infrastruttura di accesso, ruoli e isolamento multi-organizzazione
              è attiva. I moduli operativi (atleti, gruppi, calendario, pagamenti…)
              arriveranno nei prossimi incrementi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
