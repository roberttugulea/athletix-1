import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getPortalIdentity } from "@/lib/auth/portal";
import { getMemberships, requireUser } from "@/lib/auth/session";
import { signOut } from "@/server/actions/auth";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const portal = await getPortalIdentity();

  if (!portal.isPortalUser) {
    const memberships = await getMemberships();
    redirect(memberships.length > 0 ? "/dashboard" : "/onboarding");
  }

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "Area personale";

  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <header className="flex items-center justify-between border-b border-[var(--line)] bg-white px-5 py-3">
        <Link
          href="/area"
          className="flex items-center gap-2 text-sm font-extrabold tracking-[0.12em]"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#4c7bff] text-white">
            A
          </span>
          ATHLETIX
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--muted)]">{name}</span>
          <Link
            href="/area/notifiche"
            className="font-semibold text-[var(--blue)]"
          >
            Notifiche
          </Link>
          <Link
            href="/area/password"
            className="font-semibold text-[var(--blue)]"
          >
            Cambia password
          </Link>
          <form action={signOut}>
            <button type="submit" className="font-semibold text-[var(--blue)]">
              Esci
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  );
}
