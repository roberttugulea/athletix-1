import { redirect } from "next/navigation";

import { getActiveOrg, requireUser } from "@/lib/auth/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Crea organizzazione | ATHLETIX" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const org = await getActiveOrg();
  if (org) redirect("/dashboard");

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--canvas)] p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--line)] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-sm font-extrabold tracking-[0.12em]">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#4c7bff] text-white">
            A
          </span>
          ATHLETIX
        </div>
        <h1 className="mb-1 text-lg font-bold">Crea la tua organizzazione</h1>
        <p className="mb-6 text-xs text-[var(--muted)]">
          Non risulti associato a nessuna società. Creane una per iniziare: ne
          diventerai l&apos;amministratore.
        </p>
        <OnboardingForm
          defaultFirstName={user.firstName ?? ""}
          defaultLastName={user.lastName ?? ""}
        />
      </div>
    </div>
  );
}
