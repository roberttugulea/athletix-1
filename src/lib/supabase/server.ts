import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { supabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase per Server Component, Server Action e Route Handler.
 * Legge/scrive i cookie di sessione tramite l'API `cookies()` di Next.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Invocato da un Server Component: la scrittura dei cookie è gestita
          // dal proxy (`src/proxy.ts`), quindi qui si può ignorare.
        }
      },
    },
  });
}
