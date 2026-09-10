"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword, isMinor } from "@/lib/validation/access";
import { actionCtx } from "./_helpers";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Cerca un utente auth per email scorrendo le pagine (cap a 20 pagine). */
async function findAuthUserByEmail(
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

/**
 * Crea (o riusa) un account auth per l'email indicata, garantisce la riga
 * `profiles`, e restituisce l'id utente + l'eventuale password provvisoria.
 */
async function ensureAccount(
  admin: AdminClient,
  email: string,
  firstName: string,
  lastName: string,
): Promise<
  { ok: true; userId: string; tempPassword: string | null } | { ok: false; message: string }
> {
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
        message:
          error?.message?.includes("already registered")
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

function accessResultMessage(tempPassword: string | null): string {
  return tempPassword
    ? `Accesso creato. Password provvisoria: ${tempPassword} — comunicala all'interessato. Al primo accesso potrà cambiarla da «Area personale → Cambia password».`
    : "Account già esistente: collegato correttamente. L'interessato accede con le credenziali che già usa.";
}

// ============================================================ Atleta ===
export async function grantAthleteAccess(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!athleteId) return { message: "Atleta non indicato." };

  const { data: athlete } = await c.supabase
    .from("athletes")
    .select("id, first_name, last_name, email, birth_date, profile_id")
    .eq("id", athleteId)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!athlete) return { message: "Atleta non trovato." };
  if (athlete.profile_id)
    return { message: "Questo atleta ha già un accesso attivo." };
  if (!athlete.email)
    return { message: "Aggiungi prima un'email nella scheda dell'atleta." };
  if (isMinor(athlete.birth_date))
    return {
      message:
        "L'atleta è minorenne: l'accesso va dato a un tutore, non all'atleta.",
    };

  const admin = createAdminClient();
  const acc = await ensureAccount(
    admin,
    athlete.email,
    athlete.first_name,
    athlete.last_name,
  );
  if (!acc.ok) return { message: acc.message };

  const { error } = await c.supabase
    .from("athletes")
    .update({ profile_id: acc.userId })
    .eq("id", athleteId)
    .eq("organization_id", c.org.organizationId);
  if (error) {
    if (error.code === "23505")
      return { message: "Questo account è già collegato a un altro atleta." };
    return { message: "Collegamento dell'account non riuscito." };
  }

  // Nessun revalidatePath: la password provvisoria va mostrata una sola volta
  // nel messaggio del form. Al prossimo caricamento la sezione mostrerà "ATTIVO".
  return { ok: true, message: accessResultMessage(acc.tempPassword) };
}

export async function revokeAthleteAccess(athleteId: string): Promise<void> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return;
  await c.supabase
    .from("athletes")
    .update({ profile_id: null })
    .eq("id", athleteId)
    .eq("organization_id", c.org.organizationId);
  revalidatePath(`/atleti/${athleteId}`);
}

// =========================================================== Tutore ===
export async function grantGuardianAccess(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const guardianId = String(fd.get("guardian_id") ?? "");
  const athleteId = String(fd.get("athlete_id") ?? "");
  if (!guardianId) return { message: "Tutore non indicato." };

  const { data: guardian } = await c.supabase
    .from("guardians")
    .select("id, first_name, last_name, email, profile_id")
    .eq("id", guardianId)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!guardian) return { message: "Tutore non trovato." };
  if (guardian.profile_id)
    return { message: "Questo tutore ha già un accesso attivo." };
  if (!guardian.email)
    return { message: "Aggiungi prima un'email al tutore." };

  const admin = createAdminClient();
  const acc = await ensureAccount(
    admin,
    guardian.email,
    guardian.first_name,
    guardian.last_name,
  );
  if (!acc.ok) return { message: acc.message };

  const { error } = await c.supabase
    .from("guardians")
    .update({ profile_id: acc.userId })
    .eq("id", guardianId)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: "Collegamento dell'account non riuscito." };

  // vedi nota in grantAthleteAccess: niente revalidate, password mostrata qui.
  void athleteId;
  return { ok: true, message: accessResultMessage(acc.tempPassword) };
}

export async function revokeGuardianAccess(
  guardianId: string,
  athleteId: string,
): Promise<void> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return;
  await c.supabase
    .from("guardians")
    .update({ profile_id: null })
    .eq("id", guardianId)
    .eq("organization_id", c.org.organizationId);
  if (athleteId) revalidatePath(`/atleti/${athleteId}`);
}
