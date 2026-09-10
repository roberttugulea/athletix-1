"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { changeMyPassword } from "@/server/actions/auth";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeMyPassword, undefined);

  return (
    <form action={action} className="max-w-sm space-y-4">
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
      {state?.message ? (
        <FormMessage tone={state.ok ? "success" : "error"}>
          {state.message}
        </FormMessage>
      ) : null}
      <SubmitButton pending={pending}>Salva password</SubmitButton>
    </form>
  );
}
