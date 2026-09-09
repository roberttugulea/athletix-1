import { z } from "zod";

import { hasPermission, type PermissionKey } from "@/lib/auth/permissions";
import { type Membership, requireActiveOrg } from "@/lib/auth/session";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseServerClient } from "@/lib/supabase/types";

export type FieldKind = "string" | "text" | "int" | "bool";

/** Estrae e tipizza i campi da un FormData secondo lo spec indicato. */
export function readForm(fd: FormData, spec: Record<string, FieldKind>) {
  const out: Record<string, unknown> = {};
  for (const [key, kind] of Object.entries(spec)) {
    const raw = fd.get(key);
    const s = typeof raw === "string" ? raw.trim() : "";
    if (kind === "bool") out[key] = raw === "on" || raw === "true";
    else if (kind === "int") out[key] = s === "" ? null : Number(s);
    else if (kind === "text") out[key] = s === "" ? null : s;
    else out[key] = s;
  }
  return out;
}

export function dbError(error: { message: string; code?: string }): string {
  if (error.code === "23505")
    return "Esiste già un elemento con questi dati nell'organizzazione.";
  if (error.code === "23503") return "Riferimento non valido.";
  if (error.code === "23514") return "Alcuni valori non rispettano le regole.";
  return "Operazione non riuscita. Riprova più tardi.";
}

export function zodErrors(error: z.ZodError): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors };
}

export type ActionCtx =
  | { ok: true; org: Membership; supabase: SupabaseServerClient }
  | { ok: false; state: FormState };

/** Sessione + organizzazione attiva + verifica permesso, per le Server Action. */
export async function actionCtx(permission: PermissionKey): Promise<ActionCtx> {
  const org = await requireActiveOrg();
  if (!(await hasPermission(org.organizationId, permission))) {
    return {
      ok: false,
      state: { message: "Non hai i permessi per questa operazione." },
    };
  }
  return { ok: true, org, supabase: await createClient() };
}
