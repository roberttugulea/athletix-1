import { notFound } from "next/navigation";

import { EntityForm } from "@/components/ui/entity-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  CHANNEL_LABEL,
  COMM_STATUS_LABEL,
} from "@/lib/validation/communications";
import {
  cancelCommunication,
  sendCommunication,
  updateCommunication,
} from "@/server/actions/communications";
import { communicationFields } from "../_fields";
import { RecipientsForm } from "./_recipients-form";

export const metadata = { title: "Comunicazione | ATHLETIX" };

export default async function ComunicazioneDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const org = await requirePermission("communications.manage");
  const supabase = await createClient();

  const [{ data: comm }, { data: recipients }, { data: groups }] =
    await Promise.all([
      supabase
        .from("communications")
        .select("id, title, body, channel, status, sent_at")
        .eq("id", id)
        .eq("organization_id", org.organizationId)
        .maybeSingle(),
      supabase
        .from("communication_recipients")
        .select("id, delivery_status")
        .eq("communication_id", id),
      supabase
        .from("groups")
        .select("id, name")
        .eq("organization_id", org.organizationId)
        .order("name"),
    ]);

  if (!comm) notFound();

  const count = recipients?.length ?? 0;
  const isDraft = comm.status === "draft";

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { href: "/comunicazioni", label: "Comunicazioni" },
          { label: comm.title },
        ]}
      />
      <PageHeader
        eyebrow="Comunicazione"
        title={comm.title}
        subtitle={`${COMM_STATUS_LABEL[comm.status] ?? comm.status} · ${
          CHANNEL_LABEL[comm.channel] ?? comm.channel
        } · ${count} destinatari${
          comm.sent_at ? ` · inviata il ${formatShortDate(comm.sent_at)}` : ""
        }`}
      />

      {isDraft ? (
        <>
          <EntityForm
            action={updateCommunication}
            fields={communicationFields}
            defaults={{
              title: comm.title,
              channel: comm.channel,
              body: comm.body,
            }}
            hidden={{ id: comm.id }}
            submitLabel="Salva bozza"
          />

          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold">Destinatari</h2>
            <RecipientsForm id={comm.id} groups={groups ?? []} />
          </section>

          <section className="mt-8 flex items-center gap-4">
            <form action={sendCommunication.bind(null, comm.id)}>
              <button
                type="submit"
                disabled={count === 0}
                className="rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Invia ora ({count})
              </button>
            </form>
            <form action={cancelCommunication.bind(null, comm.id)}>
              <button
                type="submit"
                className="text-xs font-semibold text-red-600"
              >
                Annulla comunicazione
              </button>
            </form>
          </section>
          {count === 0 ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Imposta prima i destinatari.
            </p>
          ) : null}
        </>
      ) : (
        <div className="panel whitespace-pre-wrap p-5 text-sm">{comm.body}</div>
      )}
    </div>
  );
}
