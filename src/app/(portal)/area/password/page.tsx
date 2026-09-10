import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Cambia password | ATHLETIX" };

export default async function PortalPasswordPage() {
  await requireUser();

  return (
    <div>
      <Link href="/area" className="text-xs text-[var(--blue)]">
        ← Area personale
      </Link>
      <h1 className="mt-2 mb-1 text-xl font-bold">Cambia password</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Scegli una password di almeno 8 caratteri. Se stai usando una password
        provvisoria, cambiala ora.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
