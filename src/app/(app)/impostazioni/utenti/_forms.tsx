"use client";

import { useActionState } from "react";

import { FormMessage, SubmitButton } from "@/components/ui/form";
import { inviteMember, setMemberRoles } from "@/server/actions/members";

type Role = { id: string; name: string };

function RoleChecks({
  roles,
  selected,
}: {
  roles: Role[];
  selected: Set<string>;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {roles.map((r) => (
        <label key={r.id} className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="role_ids"
            value={r.id}
            defaultChecked={selected.has(r.id)}
          />
          {r.name}
        </label>
      ))}
    </div>
  );
}

export function InviteMemberForm({ roles }: { roles: Role[] }) {
  const [state, action, pending] = useActionState(inviteMember, undefined);

  return (
    <form action={action} className="panel space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="first_name" className="mb-1 block text-xs font-semibold">
            Nome *
          </label>
          <input
            id="first_name"
            name="first_name"
            required
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          />
          {state?.fieldErrors?.first_name?.map((e) => (
            <p key={e} className="mt-1 text-xs text-red-600">
              {e}
            </p>
          ))}
        </div>
        <div>
          <label htmlFor="last_name" className="mb-1 block text-xs font-semibold">
            Cognome *
          </label>
          <input
            id="last_name"
            name="last_name"
            required
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          />
          {state?.fieldErrors?.last_name?.map((e) => (
            <p key={e} className="mt-1 text-xs text-red-600">
              {e}
            </p>
          ))}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-semibold">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          />
          {state?.fieldErrors?.email?.map((e) => (
            <p key={e} className="mt-1 text-xs text-red-600">
              {e}
            </p>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold">Ruoli *</p>
        <RoleChecks roles={roles} selected={new Set()} />
        {state?.fieldErrors?.role_ids?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-600">
            {e}
          </p>
        ))}
      </div>

      {state?.message ? (
        <FormMessage tone={state.ok ? "success" : "error"}>
          {state.message}
        </FormMessage>
      ) : null}

      <div className="w-48">
        <SubmitButton pending={pending}>Aggiungi membro</SubmitButton>
      </div>
    </form>
  );
}

export function MemberRolesForm({
  memberId,
  roles,
  currentRoleIds,
}: {
  memberId: string;
  roles: Role[];
  currentRoleIds: string[];
}) {
  const [state, action, pending] = useActionState(setMemberRoles, undefined);

  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="member_id" value={memberId} />
      <RoleChecks roles={roles} selected={new Set(currentRoleIds)} />
      {state?.message ? (
        <FormMessage tone={state.ok ? "success" : "error"}>
          {state.message}
        </FormMessage>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-[#cbd9fb] bg-white px-3 py-1.5 text-xs font-bold text-[var(--blue)] disabled:opacity-60"
      >
        {pending ? "Attendere…" : "Salva ruoli"}
      </button>
    </form>
  );
}
