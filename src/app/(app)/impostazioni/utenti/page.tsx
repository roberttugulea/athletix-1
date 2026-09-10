import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { setMemberStatus } from "@/server/actions/members";
import { InviteMemberForm, MemberRolesForm } from "./_forms";

export const metadata = { title: "Utenti e ruoli | ATHLETIX" };

const ROLE_ORDER = ["Amministratore", "Segreteria", "Coach", "Atleta"];

type MemberRow = {
  member_id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  status: string;
  role_ids: string[];
  role_names: string[];
};

const STATUS_LABEL: Record<string, string> = {
  active: "Attivo",
  suspended: "Sospeso",
  invited: "Invitato",
  archived: "Archiviato",
};

export default async function UtentiPage() {
  const org = await requirePermission("organization.manage");
  const supabase = await createClient();

  const [{ data: rolesRaw }, { data: membersRaw }] = await Promise.all([
    supabase
      .from("roles")
      .select("id, name")
      .eq("organization_id", org.organizationId),
    supabase.rpc("list_org_members", { p_org: org.organizationId }),
  ]);

  const roles = [...(rolesRaw ?? [])].sort(
    (a, b) => ROLE_ORDER.indexOf(a.name) - ROLE_ORDER.indexOf(b.name),
  );
  const members = (membersRaw ?? []) as MemberRow[];
  const activeAdminCount = members.filter(
    (m) => m.status === "active" && m.role_names.includes("Amministratore"),
  ).length;
  const isLastAdmin = (m: MemberRow) =>
    m.status === "active" &&
    m.role_names.includes("Amministratore") &&
    activeAdminCount <= 1;

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/impostazioni", label: "Impostazioni" },
          { label: "Utenti e ruoli" },
        ]}
      />
      <PageHeader
        eyebrow="Configurazione"
        title="Utenti e ruoli"
        subtitle="Chi accede al gestionale e con quali permessi. Deve restare sempre almeno un amministratore attivo."
      />

      <div className="panel mb-8" style={{ overflowX: "auto" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#eef1f5] text-left">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Persona
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Ruoli
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Stato
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.member_id}
                className="border-b border-[#f1f4f9] align-top last:border-0"
              >
                <td className="px-4 py-3">
                  <span className="font-semibold">
                    {m.last_name} {m.first_name}
                  </span>
                  <br />
                  <span className="text-xs text-[var(--muted)]">{m.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[var(--muted)]">
                    {m.role_names.join(", ") || "—"}
                  </span>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs font-semibold text-[var(--blue)]">
                      Modifica ruoli
                    </summary>
                    <MemberRolesForm
                      memberId={m.member_id}
                      roles={roles}
                      currentRoleIds={m.role_ids}
                    />
                  </details>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {STATUS_LABEL[m.status] ?? m.status}
                </td>
                <td className="px-4 py-3 text-right">
                  {isLastAdmin(m) ? (
                    <span className="text-[11px] text-[var(--muted)]">
                      Unico amministratore
                    </span>
                  ) : m.status === "active" ? (
                    <form
                      action={setMemberStatus.bind(
                        null,
                        m.member_id,
                        "suspended",
                      )}
                    >
                      <button
                        type="submit"
                        className="text-xs font-semibold text-red-600"
                      >
                        Sospendi
                      </button>
                    </form>
                  ) : (
                    <form
                      action={setMemberStatus.bind(
                        null,
                        m.member_id,
                        "active",
                      )}
                    >
                      <button
                        type="submit"
                        className="text-xs font-semibold text-[var(--blue)]"
                      >
                        Riattiva
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-bold">Aggiungi un membro</h2>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Se la persona non ha ancora un account viene creato con una password
        provvisoria (mostrata una sola volta). Con un provider email configurato
        potrà in futuro ricevere l&apos;invito via email.
      </p>
      <InviteMemberForm roles={roles} />
    </div>
  );
}
