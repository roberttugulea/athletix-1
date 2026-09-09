import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase per i Client Component (browser).
 * Va invocato solo lato client.
 */
export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
