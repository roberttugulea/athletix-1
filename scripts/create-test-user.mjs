// Crea (o aggiorna) un utente di test tramite l'Admin API di Supabase.
// Uso: node scripts/create-test-user.mjs [email] [password]
// Legge NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY da .env.local.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const email = process.argv[2] ?? "test@athletix.local";
const password = process.argv[3] ?? "athletix-test-1234";

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list } = await admin.auth.admin.listUsers();
const existing = list?.users?.find((u) => u.email === email);

if (existing) {
  await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  console.log(`Aggiornato utente esistente: ${email}`);
} else {
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Errore:", error.message);
    process.exit(1);
  }
  console.log(`Creato utente: ${email}`);
}
console.log(`Password: ${password}`);
