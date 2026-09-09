import Link from "next/link";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createGroup } from "@/server/actions/groups";
import { groupFields } from "../_fields";

export const metadata = { title: "Nuovo gruppo | ATHLETIX" };

export default async function NuovoGruppoPage() {
  const org = await requirePermission("groups.manage");
  const supabase = await createClient();

  const [{ data: facilities }, { data: seasons }, { data: disciplines }] =
    await Promise.all([
      supabase
        .from("facilities")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .eq("active", true)
        .order("name"),
      supabase
        .from("seasons")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .order("starts_on", { ascending: false }),
      supabase
        .from("disciplines")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .eq("active", true)
        .order("name"),
    ]);

  const missing = !facilities?.length || !seasons?.length;

  return (
    <div className="content">
      <Breadcrumb
        items={[{ href: "/gruppi", label: "Gruppi" }, { label: "Nuovo" }]}
      />
      <PageHeader eyebrow="Struttura sportiva" title="Nuovo gruppo" />
      {missing ? (
        <div className="panel">
          <div className="empty-state">
            <span className="empty-icon">◦</span>
            <p>
              Servono almeno una{" "}
              <Link className="text-[var(--blue)]" href="/impostazioni/strutture">
                struttura
              </Link>{" "}
              e una{" "}
              <Link className="text-[var(--blue)]" href="/impostazioni/stagioni">
                stagione
              </Link>
              .
            </p>
          </div>
        </div>
      ) : (
        <EntityForm
          action={createGroup}
          fields={groupFields(
            (facilities ?? []).map((f) => ({ value: f.id, label: f.name })),
            (seasons ?? []).map((s) => ({ value: s.id, label: s.name })),
            (disciplines ?? []).map((d) => ({ value: d.id, label: d.name })),
          )}
          defaults={{ active: true }}
          submitLabel="Crea gruppo"
        />
      )}
    </div>
  );
}
