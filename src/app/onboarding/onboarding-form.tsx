"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { provisionOrganization } from "@/server/actions/organization";

export function OnboardingForm({
  defaultFirstName,
  defaultLastName,
}: {
  defaultFirstName: string;
  defaultLastName: string;
}) {
  const [state, action, pending] = useActionState(
    provisionOrganization,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Nome organizzazione / società"
        name="name"
        required
        placeholder="Es. ASD ATHLETIX"
        errors={state?.fieldErrors?.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Il tuo nome"
          name="firstName"
          required
          defaultValue={defaultFirstName}
          errors={state?.fieldErrors?.firstName}
        />
        <Field
          label="Il tuo cognome"
          name="lastName"
          required
          defaultValue={defaultLastName}
          errors={state?.fieldErrors?.lastName}
        />
      </div>
      {state?.message ? <FormMessage>{state.message}</FormMessage> : null}
      <SubmitButton pending={pending}>Crea organizzazione</SubmitButton>
    </form>
  );
}
