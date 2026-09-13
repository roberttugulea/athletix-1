# ATHLETIX — Guida al deploy su Vercel

Il repository è già pronto per Vercel: `vercel.json` configura il job
giornaliero, `next.config.ts` non richiede impostazioni particolari,
`.vercel` è ignorato da Git. Il codice non ha bisogno di modifiche — restano
solo passaggi da fare **nel browser**, con il tuo account.

## 1. Importa il progetto su Vercel

1. Vai su https://vercel.com/new e accedi (con GitHub è più comodo: collega
   automaticamente il repo).
2. **Add New Project** → seleziona `roberttugulea/athletix-1`.
3. Framework: Vercel riconosce **Next.js** da solo. Non serve toccare build
   command / output directory.
4. **Prima di premere Deploy**, apri "Environment Variables" e inserisci le
   variabili del punto 2 — altrimenti il primo deploy va in errore quando
   prova a leggere Supabase.

## 2. Variabili d'ambiente da impostare su Vercel

Stessi nomi di `.env.local` (mai committarlo: qui li inserisci nel pannello
Vercel, che li tiene cifrati):

| Variabile | Obbligatoria | Dove trovarla |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sì | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sì | Supabase → Project Settings → API (chiave `anon`/`publishable`) |
| `SUPABASE_SERVICE_ROLE_KEY` | sì | Supabase → Project Settings → API (chiave `service_role`/`secret` — **mai** esporla come `NEXT_PUBLIC_*`) |
| `CRON_SECRET` | sì (per il job giornaliero) | generala tu: `openssl rand -hex 32` (o qualunque stringa lunga a caso) |
| `RESEND_API_KEY` | no | https://resend.com/api-keys — senza, le comunicazioni restano registrate ma non vengono spedite via email |
| `EMAIL_FROM` | no (ha un default nel codice solo se imposti anche la chiave sopra) | es. `ATHLETIX <onboarding@resend.dev>` per iniziare, poi un tuo dominio verificato su Resend |

Imposta tutte le variabili per l'ambiente **Production** (e anche **Preview**
se vuoi che le anteprime dei branch funzionino contro lo stesso progetto
Supabase).

## 3. Configura Supabase per il dominio di produzione

Supabase Auth deve sapere quale dominio può ricevere i redirect di login e
reset password (altrimenti li rifiuta). Su **Supabase → Authentication →
URL Configuration**:

- **Site URL**: `https://<il-tuo-progetto>.vercel.app` (o il dominio
  personalizzato, quando lo colleghi — punto 6).
- **Redirect URLs**: aggiungi `https://<il-tuo-progetto>.vercel.app/**`
  (il wildcard copre `/auth/callback` e `/reset-password`).

Senza questo passaggio, "Password dimenticata" e la conferma email
falliscono silenziosamente in produzione.

## 4. Primo deploy

Premi **Deploy**. Al termine avrai un URL tipo
`https://athletix-1.vercel.app`. Apri `/login` e verifica che carichi senza
errori in console (se Supabase non è raggiungibile, la pagina lo segnala).

## 5. Verifica il job giornaliero

`vercel.json` registra `/api/cron/daily` alle 04:00 UTC. Su **Vercel →
Project → Cron Jobs** lo vedi elencato; puoi anche eseguirlo a mano da lì
("Run") per un test immediato. La route risponde con un JSON
`{ ok, feeStatuses, documentAlerts }`: se `ok` è `false`, guarda i campi
`error` per capire cosa non ha funzionato (di solito una variabile
d'ambiente mancante).

## 6. Dominio personalizzato (facoltativo)

**Vercel → Project → Settings → Domains** → aggiungi il tuo dominio e segui
le istruzioni DNS (CNAME o A record). Una volta attivo, aggiorna **Site
URL**/**Redirect URLs** su Supabase (punto 3) con il nuovo dominio — il
dominio `*.vercel.app` può restare come alias secondario.

## 7. Aggiornamenti successivi

Ogni `git push origin main` fa un nuovo deploy automatico. Le migrazioni
Supabase **non** vengono applicate da Vercel: restano un passo separato
(`npx supabase db push --linked`) da fare quando si aggiunge una migrazione,
prima o dopo il deploy del codice a seconda che sia additiva o meno — in
questo progetto sono sempre additive, quindi l'ordine non è critico.

## 8. Backup e monitoraggio

- **Backup**: Supabase fa backup automatici giornalieri su tutti i piani a
  pagamento (su quello gratuito la history dei backup è più corta). Da
  **Supabase → Database → Backups** puoi vedere la pianificazione attuale e,
  se serve una copertura maggiore, passare a un piano con Point-in-Time
  Recovery.
- **Monitoraggio applicazione**: Vercel mostra log ed errori runtime in
  **Project → Logs** senza configurazione aggiuntiva. Per alert attivi
  (es. su email) valuta Vercel Monitoring o un servizio esterno (Sentry) —
  non incluso in questa fase.

## Checklist di lancio (scheda 12)

- [x] `pnpm lint` / `pnpm build` / `pnpm test` verdi
- [x] Tutte le migrazioni applicate al progetto Supabase collegato
- [x] Bucket privato `private-documents` + policy Storage attivi
- [x] `.env` solo nomi nel repo, nessun segreto committato
- [x] Variabili d'ambiente impostate su Vercel (punto 2)
- [x] Site URL / Redirect URLs Supabase aggiornati (punto 3)
- [x] Primo deploy verificato (punto 4) — in produzione su `https://athletix-2.vercel.app`
- [x] Job cron verificato (punto 5) — chiamata reale di Vercel Cron confermata con esito 200
- [ ] Dominio personalizzato (punto 6, facoltativo) — non richiesto, resta su `*.vercel.app`
- [ ] Piano di backup rivisto (punto 8) — da valutare più avanti se serve Point-in-Time Recovery

**Lancio completato il 2026-09-13.** Durante l'attivazione del cron è emerso e corretto un bug:
il proxy di autenticazione (`src/proxy.ts`) rimandava a `/login` anche `/api/cron/daily`,
impedendo di fatto al job giornaliero di girare — vedi commit `32044e8`.
