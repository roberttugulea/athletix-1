import Link from "next/link";

import { getPortalIdentity } from "@/lib/auth/portal";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Area personale | ATHLETIX" };

export default async function AreaHomePage() {
  const user = await requireUser();
  const { athletes } = await getPortalIdentity();

  const hello = user.firstName ? `Ciao ${user.firstName}` : "Ciao";

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
        Area personale
      </p>
      <h1 className="mb-1 text-xl font-bold">{hello}</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        {athletes.length === 1
          ? "Qui trovi i dati sportivi, le quote e i documenti."
          : "Seleziona una persona per vederne dati sportivi, quote e documenti."}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {athletes.map((a) => (
          <Link
            key={a.id}
            href={`/area/atleta/${a.id}`}
            className="rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[#cbd9fb]"
          >
            <strong className="block text-sm">
              {a.firstName} {a.lastName}
            </strong>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              {a.organizationName}
              {a.relation === "guardian" ? " · come tutore" : ""}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
