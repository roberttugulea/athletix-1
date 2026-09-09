import Link from "next/link";

import { RequestResetForm } from "./request-reset-form";

export const metadata = { title: "Recupera password | ATHLETIX" };

export default function RecuperaPasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-lg font-bold">Recupera password</h1>
      <p className="mb-6 text-xs text-[var(--muted)]">
        Inserisci la tua email: ti invieremo un link per reimpostarla.
      </p>
      <RequestResetForm />
      <p className="mt-4 text-center text-xs">
        <Link href="/login" className="text-[var(--blue)]">
          Torna all&apos;accesso
        </Link>
      </p>
    </>
  );
}
