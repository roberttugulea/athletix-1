import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Impostazioni | ATHLETIX" };

const SECTIONS = [
  { href: "/impostazioni/organizzazione", title: "Organizzazione", desc: "Tolleranza pagamenti e preavvisi di scadenza" },
  { href: "/impostazioni/strutture", title: "Strutture", desc: "Sedi e impianti dell'organizzazione" },
  { href: "/impostazioni/spazi", title: "Spazi", desc: "Palestre, campi e sale delle strutture" },
  { href: "/impostazioni/stagioni", title: "Stagioni", desc: "Annate sportive; una sola corrente" },
  { href: "/impostazioni/discipline", title: "Discipline", desc: "Sport praticati nel centro polisportivo" },
  { href: "/impostazioni/utenti", title: "Utenti e ruoli", desc: "Membri del gestionale, ruoli e accessi" },
  { href: "/impostazioni/audit", title: "Registro attività", desc: "Storico delle modifiche ai dati" },
];

export default async function ImpostazioniPage() {
  await requirePermission("facilities.manage");

  return (
    <div className="content">
      <PageHeader
        eyebrow="Configurazione"
        title="Impostazioni"
        subtitle="Struttura sportiva e parametri dell'organizzazione."
      />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="panel block p-5 transition hover:border-[#cbd9fb]"
          >
            <strong className="block text-sm">{s.title}</strong>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              {s.desc}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
