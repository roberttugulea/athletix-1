import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import { supabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Rinfresca la sessione Supabase a ogni richiesta e restituisce sia la
 * risposta con i cookie aggiornati sia l'utente corrente (o `null`).
 *
 * Da usare in `src/proxy.ts`. Non aggiungere logica tra `createServerClient`
 * e `auth.getUser()`: un refresh mancato può disconnettere l'utente in modo
 * imprevedibile.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
