"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { signIn } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state?.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state?.fieldErrors?.password}
      />
      {state?.message ? <FormMessage>{state.message}</FormMessage> : null}
      <SubmitButton pending={pending}>Accedi</SubmitButton>
      <p className="text-center text-xs">
        <Link href="/recupera-password" className="text-[var(--blue)]">
          Password dimenticata?
        </Link>
      </p>
    </form>
  );
}
