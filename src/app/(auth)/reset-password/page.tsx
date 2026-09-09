import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Nuova password | ATHLETIX" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-lg font-bold">Imposta una nuova password</h1>
      <p className="mb-6 text-xs text-[var(--muted)]">
        Scegli una password di almeno 8 caratteri.
      </p>
      <ResetPasswordForm />
    </>
  );
}
