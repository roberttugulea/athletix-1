"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { requestPasswordReset } from "@/server/actions/auth";

export function RequestResetForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  if (state?.ok) {
    return <FormMessage tone="success">{state.message}</FormMessage>;
  }

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state?.fieldErrors?.email}
      />
      {state?.message ? <FormMessage>{state.message}</FormMessage> : null}
      <SubmitButton pending={pending}>Invia il link</SubmitButton>
    </form>
  );
}
