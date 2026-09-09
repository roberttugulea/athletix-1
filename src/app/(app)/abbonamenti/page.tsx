import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Abbonamenti | ATHLETIX" };

const SECTIONS = [
  {
    href: "/abbonamenti/piani-quota",
    title: "Piani quota mensile",
    desc: "Importi ricorrenti per gruppo, con scadenza e rateo",
  },
  {
    href: "/abbonamenti/quote",
    title: "Quote mensili",
    desc: "Quote generate: stato, scadenze, pagamenti",
  },
];

export default async function AbbonamentiPage() {
  await requirePermission("finance.manage");

  return (
    <div className="content">
      <PageHeader
        eyebrow="Amministrazione"
        title="Abbonamenti e quote"
        subtitle="Quote mensili ricorrenti dell'organizzazione."
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
