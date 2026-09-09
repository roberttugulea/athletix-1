import { LoginForm } from "./login-form";

export const metadata = { title: "Accedi | ATHLETIX" };

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await props.searchParams;

  return (
    <>
      <h1 className="mb-1 text-lg font-bold">Accedi</h1>
      <p className="mb-6 text-xs text-[var(--muted)]">
        Entra nel gestionale ATHLETIX.
      </p>
      {error === "auth" && (
        <p className="mb-4 rounded-lg bg-[#fdecec] px-3 py-2 text-xs text-red-700">
          Sessione non valida o scaduta. Effettua di nuovo l&apos;accesso.
        </p>
      )}
      <LoginForm next={next} />
    </>
  );
}
