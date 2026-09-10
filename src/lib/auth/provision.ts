import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword } from "@/lib/validation/access";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Cerca un utente auth per email scorrendo le pagine (cap a 20 pagine). */
export async function findAuthUserByEmail(
  admin: AdminClient,
  email: string,
): Promise<{ id: string } | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) return null;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return { id: hit.id };
    if (data.users.length < 200) break;
  }
  return null;
}

export type EnsureAccountResult =
  | { ok: true; userId: string; tempPassword: string | null }
  | { ok: false; message: string };

/**
 * Crea (o riusa) un account auth per l'email indicata, garantisce la riga
 * `profiles`, e restituisce l'id utente + l'eventuale password provvisoria
 * (valorizzata solo se l'utente è stato creato ora).
 */
export async function ensureAccount(
  admin: AdminClient,
  email: string,
  firstName: string,
  lastName: string,
): Promise<EnsureAccountResult> {
  const existing = await findAuthUserByEmail(admin, email);
  let userId: string;
  let tempPassword: string | null = null;

  if (existing) {
    userId = existing.id;
  } else {
    tempPassword = generateTempPassword();
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password: tempPassword,
      email_confirm: true,
    });
    if (error || !data.user) {
      return {
        ok: false,
        message: error?.message?.includes("already registered")
          ? "Esiste già un account con questa email."
          : "Creazione dell'account non riuscita.",
      };
    }
    userId = data.user.id;
  }

  const { error: pErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      first_name: firstName || "—",
      last_name: lastName || "—",
      email: email.trim(),
    },
    { onConflict: "id" },
  );
  if (pErr) return { ok: false, message: "Impossibile creare il profilo." };

  return { ok: true, userId, tempPassword };
}

export function tempPasswordMessage(tempPassword: string | null): string {
  return tempPassword
    ? `Password provvisoria: ${tempPassword} — comunicala all'interessato. Al primo accesso potrà cambiarla da «Area personale → Cambia password».`
    : "Account già esistente: collegato con le credenziali che l'utente usa già.";
}
