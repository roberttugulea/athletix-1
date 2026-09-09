/**
 * Accesso centralizzato e validato alle variabili d'ambiente pubbliche di Supabase.
 * Il throw è dentro la funzione (non a livello di modulo) così `next build`
 * non fallisce quando `.env.local` non è ancora stato compilato.
 */
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseEnv(): { url: string; anonKey: string } {
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Configurazione Supabase mancante: imposta NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (vedi .env.example).",
    );
  }
  return {
    url: NEXT_PUBLIC_SUPABASE_URL,
    anonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}
