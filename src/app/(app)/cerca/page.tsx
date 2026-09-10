import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { getPermissions, resolvePermission } from "@/lib/auth/permissions";
import { requireActiveOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Ricerca | ATHLETIX" };

type Group = {
  label: string;
  items: { href: string; primary: string; secondary?: string }[];
};

export default async function CercaPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const org = await requireActiveOrg();
  const perms = await getPermissions(org.organizationId);
  const can = (k: Parameters<typeof resolvePermission>[1]) =>
    resolvePermission(perms, k);

  const term = (q ?? "").replace(/[%,()\\*]/g, "").trim();
  const groups: Group[] = [];

  if (term.length >= 2) {
    const supabase = await createClient();
    const like = `%${term}%`;
    const oid = org.organizationId;

    const [athletes, coaches, gruppi, gare] = await Promise.all([
      can("people.manage")
        ? supabase
            .from("athletes")
            .select("id, first_name, last_name, status")
            .eq("organization_id", oid)
            .or(`first_name.ilike.${like},last_name.ilike.${like}`)
            .limit(10)
        : Promise.resolve({ data: [] }),
      can("people.manage")
        ? supabase
            .from("coaches")
            .select("id, first_name, last_name")
            .eq("organization_id", oid)
            .or(`first_name.ilike.${like},last_name.ilike.${like}`)
            .limit(10)
        : Promise.resolve({ data: [] }),
      can("groups.manage") || can("attendance.manage")
        ? supabase
            .from("groups")
            .select("id, name")
            .eq("organization_id", oid)
            .ilike("name", like)
            .limit(10)
        : Promise.resolve({ data: [] }),
      can("competitions.manage")
        ? supabase
            .from("competitions")
            .select("id, name, starts_on")
            .eq("organization_id", oid)
            .ilike("name", like)
            .limit(10)
        : Promise.resolve({ data: [] }),
    ]);

    if ((athletes.data ?? []).length)
      groups.push({
        label: "Atleti",
        items: (athletes.data ?? []).map((a) => ({
          href: `/atleti/${a.id}`,
          primary: `${a.last_name} ${a.first_name}`,
          secondary: a.status === "active" ? undefined : "archiviato",
        })),
      });
    if ((coaches.data ?? []).length)
      groups.push({
        label: "Coach",
        items: (coaches.data ?? []).map((c) => ({
          href: `/coach/${c.id}`,
          primary: `${c.last_name} ${c.first_name}`,
        })),
      });
    if ((gruppi.data ?? []).length)
      groups.push({
        label: "Gruppi",
        items: (gruppi.data ?? []).map((g) => ({
          href: can("groups.manage") ? `/gruppi/${g.id}` : `/coach/gruppo/${g.id}`,
          primary: g.name,
        })),
      });
    if ((gare.data ?? []).length)
      groups.push({
        label: "Gare",
        items: (gare.data ?? []).map((g) => ({
          href: `/gare/${g.id}`,
          primary: g.name,
          secondary: g.starts_on,
        })),
      });
  }

  return (
    <div className="content">
      <PageHeader
        eyebrow="Ricerca"
        title={term ? `Risultati per «${term}»` : "Ricerca"}
      />

      {term.length < 2 ? (
        <p className="text-sm text-[var(--muted)]">
          Digita almeno due caratteri nella barra di ricerca in alto.
        </p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nessun risultato.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 text-sm font-bold">{g.label}</h2>
              <ul className="panel divide-y divide-[#f1f4f9]">
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[#fafbfe]"
                    >
                      <span className="font-semibold text-[var(--blue)]">
                        {it.primary}
                      </span>
                      {it.secondary ? (
                        <span className="text-xs text-[var(--muted)]">
                          {it.secondary}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
