import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseServiceEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase con chiave di servizio: **bypassa la RLS**.
 * Da usare SOLO in server action, per operazioni privilegiate che non si
 * possono esprimere con una policy — in pratica il provisioning degli account
 * atleta/tutore (creazione utente auth + riga `profiles` per conto di altri).
 * Non importare mai in un componente client.
 */
export function createAdminClient() {
  const { url, serviceKey } = supabaseServiceEnv();
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
