"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/ui/form";
import { SCOPE_LABEL } from "@/lib/validation/communications";
import { setCommunicationRecipients } from "@/server/actions/communications";

export function RecipientsForm({
  id,
  groups,
}: {
  id: string;
  groups: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    setCommunicationRecipients,
    undefined,
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="scope" className="mb-1 block text-xs font-semibold">
          Ambito
        </label>
        <select
          id="scope"
          name="scope"
          defaultValue="staff"
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        >
          {Object.entries(SCOPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="group_id" className="mb-1 block text-xs font-semibold">
          Gruppo (solo per «Atleti di un gruppo»)
        </label>
        <select
          id="group_id"
          name="group_id"
          defaultValue=""
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-[#cbd9fb] bg-white px-4 py-2 text-sm font-bold text-[var(--blue)] disabled:opacity-60"
      >
        {pending ? "Attendere…" : "Imposta destinatari"}
      </button>
      {state?.message ? (
        <div className="w-full">
          <FormMessage tone={state.ok ? "success" : "error"}>
            {state.message}
          </FormMessage>
        </div>
      ) : null}
    </form>
  );
}
