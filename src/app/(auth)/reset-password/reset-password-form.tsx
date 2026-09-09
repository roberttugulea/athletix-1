"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { updatePassword } from "@/server/actions/auth";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Nuova password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.fieldErrors?.password}
      />
      <Field
        label="Conferma password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.fieldErrors?.confirm}
      />
      {state?.message ? <FormMessage>{state.message}</FormMessage> : null}
      <SubmitButton pending={pending}>Salva password</SubmitButton>
    </form>
  );
}
