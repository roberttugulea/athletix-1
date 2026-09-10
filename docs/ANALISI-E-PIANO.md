# ATHLETIX — Analisi dello stato attuale, architettura e piano di implementazione

> Documento generato dall'analisi di:
> - specifica `ATHLETIX_Specifiche_Completo_per_AI.xlsx` (14 schede: 00_ISTRUZIONI → 13_PROMPT_AI)
> - stato del repository al commit `53f08ff` ("Initial ATHLETIX scaffold")
>
> Nessun codice è stato modificato. Le decisioni marcate **DA DEFINIRE** non vanno inventate: vanno confermate prima di implementare la fase relativa (vedi §12).

---

## 1. Stato attuale del repository

### 1.1 Cosa c'è

| Ambito | Dettaglio |
|---|---|
| Framework | Next.js **16.3.4**, React **19.2.8**, App Router, TypeScript `strict`, Tailwind CSS v4 (`@tailwindcss/postcss`), ESLint 9 flat config. Package manager **pnpm@11.19.0** |
| `src/app/` | `layout.tsx` (`<html lang="it">`, metadata), `page.tsx` (mockup **statico** `"use client"` della dashboard: nav hardcoded, nessun dato reale, solo empty-state), `globals.css` (~9.7 KB, stile del mockup), `favicon.ico` |
| Database | `supabase/migrations/20260904190000_athletix_schema.sql` — **schema completo** (~45 tabelle) con RLS deny-by-default, funzioni, trigger, seed dei permessi. Nessun dato operativo |
| Doc | `docs/database.md` (descrizione schema), `AGENTS.md` (avviso: Next.js 16 ha breaking changes, leggere `node_modules/next/dist/docs/` prima di scrivere codice), `CLAUDE.md` → `@AGENTS.md` |
| Config | `.env.example` (3 variabili Supabase: URL, anon key, service role key), `.gitignore` ignora `.env*` ✓, `next.config.ts` vuoto |
| Git | 1 solo commit su `main`, allineato a `origin/main`. Remote `https://github.com/roberttugulea/athletix-1.git`. User git: `roberttugulea` |

### 1.2 Cosa NON c'è — l'application layer è a ~0%

- Nessun client Supabase (`@supabase/supabase-js` / `@supabase/ssr` **non** in `package.json`).
- Nessuna autenticazione, nessun `middleware.ts`, nessuna gestione sessione.
- Nessuna route oltre `/`. Nessuna server action, nessun route handler / API.
- Nessun data layer, nessun componente riutilizzabile oltre al mockup.
- Nessun test, nessun test runner, nessuna CI.
- Nessun tipo generato dal DB.

### 1.3 Toolchain mancante sulla macchina — **BLOCCANTE per l'implementazione**

`node`, `pnpm` e `git` **non sono installati / non sono in PATH** su questo PC (è presente solo Chocolatey). Il `node_modules/` e `.next/` presenti provengono da un altro ambiente.

Tentativo di installazione via Chocolatey da questa sessione **fallito**: `choco` richiede una shell elevata (accesso negato a `C:\ProgramData\chocolatey`) e non è possibile rispondere al prompt UAC in modo non interattivo. L'installazione va fatta manualmente:

```powershell
# PowerShell APERTA COME AMMINISTRATORE
choco install -y nodejs-lts git
npm install -g pnpm@11.19.0
# poi chiudere e riaprire il terminale, verificare:
node -v ; pnpm -v ; git --version
```

In alternativa, `winget install OpenJS.NodeJS.LTS Git.Git` (accettando i prompt UAC), o installazione portable senza admin (Node zip + MinGit in una cartella utente, aggiunte al PATH).

La fase di analisi/architettura non ne ha bisogno; **tutte le fasi successive sì**.

---

## 2. Divergenza tra Excel e schema dello scaffold — **DECISIONE CHIAVE**

Lo schema SQL già presente **non è generico**: modella un club sportivo italiano reale, con orientamento a tiro con l'arco / sport a categorie di peso. Include `fita_memberships` (Federazione Italiana), `weight_categories`, `competitions` / `competition_calls` / `competition_results`, `guardians` per i minori, quote mensili con **proratazione**, **ricevute**, storico finanziario **immutabile** via trigger, vincolo **GiST** anti-sovrapposizione sugli orari.

L'Excel (schede 03_FUNZIONALITA / 04_PAGINE / 05_DATI) descrive un **impianto sportivo / centro fitness più generico**: prenotazioni self-service, area atleta con login, abbonamenti a piani, schede di allenamento.

### 2.1 Confronto dei modelli

| Concetto | Excel (05_DATI) | Schema dello scaffold |
|---|---|---|
| RBAC | `profiles.role` enum (`admin`/`secretary`/`coach`/`athlete`) | `permissions` + `roles` + `member_roles` + `role_permissions` (permission key granulari) |
| Legame multi-tenant | `organization_id` sulle tabelle + `profiles.organization_id` | `organization_members` (un profilo in più org); `profiles` **senza** `organization_id` |
| Corsi | `courses` + `course_sessions` | `groups` + `group_schedule_slots` + `training_sessions` (+ `seasons`, `facilities`, `spaces`, `activity_types`) |
| Prenotazioni | `bookings` + `attendance` (l'atleta prenota la sessione) | **nessuna tabella `bookings`**; solo `attendances`; l'atleta è assegnato al gruppo via `athlete_groups` |
| Abbonamenti | `subscription_plans` + `subscriptions` (inizio/fine/stato) | `fee_plans` + `monthly_fees` (periodi mensili, proratazione) + `discounts` + `exemptions` |
| Pagamenti | `payments` + `refunds` | `payments` + `refunds` + `receipts` + trigger di immutabilità |
| Tesseramenti | `memberships` generico | `fita_memberships` (specifico federazione) |
| Certificati | `certificates` generico | `medical_certificates` |
| Categorie | `categories` + `athlete_categories` (generiche) | `weight_categories` + `athlete_weight_categories` (solo peso) |
| Schede allenamento | `workout_plans` | **assente** |
| Notifiche | `notifications` (feed in-app per utente) | `communications` + `communication_recipients` (broadcast; nessun feed per-utente) |
| Tutori / minori | assente | `guardians` + `athlete_guardians` (max 2, trigger) |
| Gare | assente | `competitions` + `competition_calls` + `competition_results` |
| Prove gratuite | assente (coperto da F07) | `trial_lessons` |
| Eventi | assente | `events` + `event_attendees` |
| Atleta ↔ account | l'Excel implica login atleta (F23 area atleta, `role='athlete'`) | gli `athletes` **non** sono collegati a `profiles`/`auth.users`: nessun percorso di login per l'atleta |

### 2.2 Conseguenza — due strade

**Opzione A (RACCOMANDATA) — Estendere lo schema dello scaffold.**
Lo schema esistente è più maturo, più corretto per il contesto italiano e già dotato di RLS/trigger/audit. Si tiene come backbone e si aggiungono **solo** i pezzi mancanti dell'Excel, tutti con migration **additive**:
- `bookings` (prenotazione self-service a `training_sessions`, capienza, waitlist) — **solo se** le regole di prenotazione servono davvero (DA DEFINIRE C06);
- `workout_plans` + `workout_plan_items` (F15);
- `notifications` per-utente (feed in-app, F16) accanto a `communications` (broadcast);
- collegamento **atleta ↔ account** (`athletes.profile_id` nullable) per abilitare area atleta/tutore (F23);
- mapping ruoli Excel → bundle di permission key (ruoli di sistema "Amministratore / Segreteria / Coach / Atleta").
- `subscription_plans` / `subscriptions` **non** servono: `fee_plans` + `monthly_fees` li coprono meglio (da confermare).

Costo: **basso-medio**. Rischio: **basso**. Nessuna riscrittura.

**Opzione B — Rifare lo schema aderente all'Excel (scheda 05_DATI).**
Si scarta gran parte dello schema e si ricostruiscono ~25 tabelle come da foglio DATI.
Costo: **alto**. Rischio: **alto** — si perdono proratazione, ricevute, immutabilità, gestione minori, competizioni, vincolo GiST anti-overlap già scritti. Va contro la regola "preserva il lavoro funzionante" (scheda 01 / 13).

> **DECISIONE PRESA (2026-09-09):** si procede con **Opzione A estesa**.
> Contesto reale confermato dal committente: centro **polisportivo multi-disciplina**; abbonamenti **misti** (quota mensile ricorrente + pacchetti a durata + carnet a ingressi); **nessuna** prenotazione self-service alle singole sessioni (solo iscrizione ai gruppi). Vedi §2.3.

### 2.3 Cosa comporta l'Opzione A estesa

Si tiene il backbone dello scaffold (RBAC a permessi, `seasons`/`facilities`/`spaces`/`groups`/`group_schedule_slots`, storico finanziario immutabile, audit, `guardians`, vincolo GiST). Si **generalizza** ciò che è troppo specifico e si **aggiunge** il modello di billing misto. Tutte migration **additive**.

| Intervento | Da | A |
|---|---|---|
| Tesseramenti | `fita_memberships` (FITA-centrico) | rinominata `federation_memberships`; campo `federation` libero + tabella `federations` per organizzazione (multi-federazione) |
| Categorie | `weight_categories` + `athlete_weight_categories` (solo peso) | `categories(kind: age\|weight\|discipline\|level\|other, name, min_value, max_value, unit, discipline_id)` + `athlete_categories(valid_from, valid_to, measured_value)`; dati peso migrati; FK `competition_results` aggiornata |
| Discipline | implicite in `activity_types` | `disciplines` per organizzazione; `groups.discipline_id`, `categories.discipline_id` |
| Abbonamenti | solo `fee_plans` + `monthly_fees` (quota mensile) | **+** `subscription_plans` + `subscriptions` (pacchetti a durata) **+** `pass_plans` + `athlete_passes` (carnet a ingressi, decremento su presenza/iscrizione) |
| Pagamenti | `payments.monthly_fee_id` unico aggancio | aggancio generalizzato: `monthly_fee_id` \| `subscription_id` \| `athlete_pass_id` (check: al più uno) |
| Prenotazioni | previste `bookings` | **non si fanno**: iscrizione ad `athlete_groups`; nessuna tabella `bookings` |
| Atleta ↔ account | non collegati | `athletes.profile_id` nullable → area atleta/tutore |
| Schede allenamento | assenti | `workout_plans` + `workout_plan_items` |
| Notifiche per-utente | solo `communications` broadcast | **+** `notifications(user_id, ...)` feed in-app |

Cosa **non** cambia e resta un valore dello scaffold: proratazione (`calculate_prorated_fee`), ricevute immutabili, gestione minori/tutori (max 2), gare/convocazioni/risultati, `trial_lessons`, `events`, anti-sovrapposizione oraria GiST, audit, RLS deny-by-default.

---

## 3. Architettura proposta (Opzione A estesa)

### 3.1 Librerie da aggiungere

| Scopo | Scelta proposta |
|---|---|
| Client Supabase | `@supabase/ssr` + `@supabase/supabase-js` (auth via cookie, server + browser) |
| Validazione | `zod` (schema condivisi client/server) |
| Data fetching | **Server Components** + **server actions** per le mutation. Niente client fetching finché non serve; `@tanstack/react-query` solo se emergerà un bisogno |
| Form | `useActionState` (Next 16) + `zod`. `react-hook-form` opzionale per i form complessi |
| UI | Componenti propri su Tailwind v4. Primitivi accessibili con `@radix-ui/react-*` (Dialog, Dropdown, Popover, Tabs) |
| Date/timezone | `date-fns` + `date-fns-tz` (`Europe/Rome`) |
| Test | `vitest` + `@testing-library/react` (unit/componenti); `@playwright/test` (e2e sui flussi critici); test RLS con script anon-key vs service-key |
| Format | `prettier` (opzionale) |

### 3.2 Struttura cartelle target

```
src/
  app/
    (auth)/            login/  recupera-password/  reset-password/
    auth/callback/route.ts
    (app)/             layout con sidebar per ruolo + guardia sessione
      dashboard/
      atleti/                  [id]/
      coach/                   [id]/
      gruppi/                  [id]/        (= "corsi" dell'Excel)
      calendario/
      presenze/
      quote/                                (fee_plans + monthly_fees; label UI "Abbonamenti/Quote")
      pagamenti/               [id]/
      tesseramenti/
      certificati/
      categorie/
      gare-eventi/
      comunicazioni/
      report/
      impostazioni/            organizzazione/  utenti/  strutture/  spazi/  stagioni/
    (athlete)/         area-atleta/...        layout separato, atleta/tutore
    (coach)/           area-coach/...         opzionale se serve UI distinta dall'area (app)
    api/                                      solo dove serve (webhook pagamenti, cron)
  components/ui/        components/<dominio>/
  lib/
    supabase/          server.ts  client.ts  middleware.ts
    auth/              session.ts  permissions.ts   (RBAC helper server-side)
    validation/        <entità>.ts               (schema zod)
    db/                query helper tipizzati
  server/actions/      <entità>.ts               (server action: assertPermission → zod → mutation → revalidate)
  types/               database.types.ts         (generato: supabase gen types)
middleware.ts                                    (refresh sessione + redirect non autenticati)
supabase/migrations/                             (nuove migration numerate; NON editare la 20260904190000)
```

### 3.3 Multi-tenant & sessione

- Autenticazione con **Supabase Auth** (email/password + recupero password).
- Un `profile` può avere più righe in `organization_members` → serve un **selettore organizzazione** e un `organization_id` "attivo" per la sessione. Proposta: cookie `athletix-org`, **validato server-side a ogni richiesta** contro le `organization_members` attive dell'utente.
- Ogni server action prende l'org attiva dal context server, **mai dal client**.
- RLS resta l'ultima linea di difesa; i controlli di permesso lato server sono **in aggiunta**, non in sostituzione (scheda 09).

### 3.4 RBAC — mapping ruoli Excel → permessi dello scaffold

Permission key già presenti nello schema:
`organization.manage`, `facilities.manage`, `people.manage`, `groups.manage`, `finance.manage`, `attendance.manage`, `competitions.manage`, `communications.manage`, `reports.read`, `documents.manage`.

4 **ruoli di sistema** come bundle:

| Ruolo (Excel 02_RUOLI) | Permessi assegnati |
|---|---|
| Amministratore/Titolare | `organization.manage` (implica tutto negli helper) |
| Segreteria/Operatore | `people.manage`, `groups.manage`, `finance.manage`, `attendance.manage`, `communications.manage`, `documents.manage`, `reports.read`, `facilities.manage` (configurabile dall'admin) |
| Coach/Istruttore | `attendance.manage` + **lettura ristretta** a gruppi/atleti assegnati via `coach_groups` / `coach_facilities` (nessun dato finanziario) |
| Atleta/Cliente (o Tutore) | nessun permesso org; accesso ai **propri** dati via policy `*_self` basate su `athletes.profile_id` / `guardians.profile_id` |

> **Problema RLS attuale da correggere (lavoro principale della Fase 1):** le policy generate `<t>_read` fanno `using (is_organization_member(organization_id))`. Effetto: un **Coach** vede *tutti* gli atleti/pagamenti dell'org; un **Atleta** (che non è `organization_member`) non vede *nulla*. Va:
> - ristretta la lettura operativa per chi ha solo il permesso coach;
> - aggiunte policy `self` per Atleta/Tutore;
> - aggiunte funzioni `is_athlete_self(uuid)`, `is_guardian_of(uuid)`, `is_coach_of_group(uuid)`, `is_coach_of_athlete(uuid)`;
> - aggiunta policy di lettura su `audit_logs` (oggi ha solo `enable`, nessuna policy).

### 3.5 Storico immutabile & audit

Già implementati: trigger `immutable_financial_history` su `payments`/`refunds`/`receipts`; `audit_row()` su 16 tabelle; `set_updated_at()` ovunque. Da fare: policy di lettura audit; eventuale estensione audit a `fee_plans`, `discounts`, `exemptions`, `weight_categories`, `group_schedule_slots` (scheda 09).

---

## 4. Schema DB — interventi (tutte migration **additive**, numerate dopo `20260904190000`)

| Migration (nome indicativo) | Contenuto |
|---|---|
| `20260910_rbac_system_roles.sql` | funzione `provision_organization()` (org + settings + 4 ruoli di sistema + primo admin, in transazione); funzioni `is_athlete_self`, `is_guardian_of`, `is_coach_of_group`, `is_coach_of_athlete` |
| `20260910_athlete_account_link.sql` | `athletes.profile_id uuid null references profiles(id)` + unique parziale; policy self-read su `athletes`, `monthly_fees`, `payments`/`subscriptions`/`athlete_passes` (solo propri), `medical_certificates`, `federation_memberships`, `attendances`, `athlete_groups`, `training_sessions` dei propri gruppi, `communication_recipients` |
| `20260910_coach_scope.sql` | restringe la lettura operativa per il solo permesso coach a ciò che è collegato via `coach_groups`; nega i dati finanziari |
| `20260910_audit_read.sql` | policy `select` su `audit_logs` per `organization.manage` |
| `20260911_disciplines_categories.sql` | `disciplines` per organizzazione; `categories` + `athlete_categories` generali (`kind`); migra i dati `weight_categories` → `categories`, aggiorna la FK di `competition_results`; `groups.discipline_id` |
| `20260911_federation_memberships.sql` | rename `fita_memberships` → `federation_memberships`; tabella `federations` per organizzazione; il campo `federation` diventa configurabile |
| `20260912_subscriptions.sql` | `subscription_plans` (durata, prezzo, ambito disciplina/gruppo) + `subscriptions` (atleta, piano, `starts_on`/`ends_on`, stato, importo) |
| `20260912_passes.sql` | `pass_plans` (n. ingressi, prezzo, validità) + `athlete_passes` (`entries_total`/`entries_used`/`expires_on`/stato) + azione di decremento su presenza/iscrizione |
| `20260912_payments_payable.sql` | aggiunge a `payments` le colonne nullable `subscription_id`, `athlete_pass_id` + check "al più un payable" (`monthly_fee_id` \| `subscription_id` \| `athlete_pass_id`) |
| `20260913_workout_plans.sql` | `workout_plans(id, organization_id, athlete_id, coach_id, title, starts_on, ends_on, notes, status)` + `workout_plan_items(id, plan_id, day_index, exercise, sets, reps, load, rest_seconds, notes, sort)`; RLS coach assegnato + atleta self |
| `20260913_notifications.sql` | `notifications(id, organization_id, user_id → profiles, type, title, body, entity_table, entity_id, read_at, created_at)`; policy `user_id = auth.uid()` |
| `20260913_settings_and_jobs.sql` | estende `organization_settings`: `certificate_alert_days`, `membership_alert_days`, `receipt_number_format` (**DA DEFINIRE**); funzione `notify_expiring_documents()` |

Dopo **ogni** migration: `supabase gen types typescript` → `src/types/database.types.ts`.

---

## 5. Pagine / route — mappa Excel P01–P18 → target

| Excel | Route target | Note |
|---|---|---|
| P01 Login | `/(auth)/login` | + `/recupera-password`, `/reset-password` |
| P02 Dashboard | `/(app)/dashboard` | KPI e widget filtrati per ruolo/organizzazione |
| P03 Atleti | `/(app)/atleti` | lista, ricerca, filtri, archivia |
| P04 Scheda atleta | `/(app)/atleti/[id]` | anagrafica, tutori, quote, certificati, tessera, gruppi, presenze, storico |
| P05 Coach | `/(app)/coach` , `/coach/[id]` | anagrafica + associazioni |
| P06 Corsi | `/(app)/gruppi` , `/gruppi/[id]` | "corsi" = `groups`; capienza, coach, slot orari |
| P07 Calendario | `/(app)/calendario` | vista giorno/settimana/mese; presenze secondo ruolo. Nessuna prenotazione: iscrizione ai gruppi |
| P08 Abbonamenti | `/(app)/abbonamenti` | quote mensili (`fee_plans`/`monthly_fees`), pacchetti a durata (`subscriptions`), carnet a ingressi (`athlete_passes`); atleta in sola lettura nell'area atleta |
| P09 Pagamenti | `/(app)/pagamenti` , `/pagamenti/[id]` | registra, void, rimborso; storico append-only |
| P10 Tesseramenti | `/(app)/tesseramenti` | `fita_memberships` + scadenze |
| P11 Certificati | `/(app)/certificati` | `medical_certificates`; documento su bucket privato |
| P12 Categorie | `/(app)/categorie` | `categories` generali (età/peso/disciplina/livello) + `disciplines` |
| P13 Presenze | `/(app)/presenze` | registro per sessione; bulk; audit |
| P14 Area Coach | `/(coach)/area-coach` o sezione in `(app)` | solo gruppi/atleti/sessioni/presenze/schede propri |
| P15 Area Atleta | `/(athlete)/area-atleta` | profilo, quote, prenotazioni/calendario propri, certificati, tessera, comunicazioni |
| P16 Report | `/(app)/report` | KPI, grafici, filtri periodo, export CSV/Excel |
| P17 Utenti e ruoli | `/(app)/impostazioni/utenti` | invito, disattiva, assegna ruolo, protezione ultimo admin |
| P18 Impostazioni impianto | `/(app)/impostazioni/organizzazione` | dati org, `organization_settings`, regole |
| *(extra dallo schema)* | `/impostazioni/strutture`, `/spazi`, `/stagioni`, `/(app)/gare-eventi`, `/comunicazioni` | richiesti da `facilities`/`spaces`/`seasons`/`competitions`/`events`/`communications` |

Le voci di menu non autorizzate **non vengono renderizzate** (scheda 08).

---

## 6. Server actions / API per dominio

Ogni action: `assertPermission(orgAttiva, key)` → `zod.parse(input)` → mutation → (audit automatico via trigger) → `revalidatePath`.

| Dominio | Azioni |
|---|---|
| Auth | `signIn`, `signOut`, `requestPasswordReset`, `updatePassword` |
| Organizzazione | `switchOrganization`, `provisionOrganization`, `updateOrgSettings` |
| Persone | atleti: `create`/`update`/`archive`/`linkAccount`; guardiani: CRUD + `attachToAthlete`; coach: CRUD + `assignToGroup`/`assignToFacility` |
| Struttura sportiva | `facilities`/`spaces`/`seasons`/`disciplines` CRUD; `groups` CRUD; `groupScheduleSlots` create/update con gestione conflitto GiST (23P01 → messaggio chiaro) |
| Iscrizioni | `enrollAthleteInGroup(groupId, startsOn)`, `endEnrollment(ends_on)` su `athlete_groups` con controllo capienza gruppo |
| Calendario | `generateSessionsFromSlots(range)`, `cancelSession`, `rescheduleSession` |
| Presenze | `upsertAttendanceBulk(sessionId, righe)` (decrementa il carnet ingressi se applicabile) |
| Billing – quote | `feePlans` CRUD, `discounts`/`exemptions` CRUD, `generateMonthlyFees(period)`, `runFeeStatusRefresh()` |
| Billing – pacchetti | `subscriptionPlans` CRUD, `createSubscription`, `renewSubscription`, `cancelSubscription` |
| Billing – carnet | `passPlans` CRUD, `sellPass`, `consumeEntry`, `refundPass` |
| Pagamenti | `recordPayment` (→ immutabile, aggancio quota\|pacchetto\|carnet), `voidPayment(reason)`, `createRefund`, `issueReceipt` |
| Documenti | `uploadPrivateDocument` (bucket privato, path opaco), `attachDocumentTo(entity)` |
| Tesseramenti / Certificati | CRUD + cambio stato + collegamento documento; `federations` CRUD |
| Categorie / discipline | `disciplines` CRUD, `categories` CRUD (per `kind`), `assignAthleteCategory(validFrom, measuredValue?)` |
| Gare | `competitions` CRUD, `competitionCalls` invite/respond, `competitionResults` upsert; `events` + `eventAttendees` |
| Comunicazioni | `createCommunication`, `setRecipients`, `sendCommunication` (email → provider DA DEFINIRE) |
| Notifiche | `markNotificationRead`, `markAllRead` |
| Report | query aggregate read-only + `exportCsv(dataset, filtri)` |
| Utenti/ruoli | `inviteUser`, `assignRole`, `deactivateMember`, con guardia **"non rimuovere l'ultimo admin"** |
| Import | `importCsv(dataset)` con validazione e report errori, transazione tutto-o-niente |

---

## 7. Flussi principali (Excel 06_FLUSSI) — note sul comportamento

| Flusso | Note rispetto allo schema attuale |
|---|---|
| FL01 Login | Supabase Auth; dopo login carica membership → org attiva → ruolo/permessi |
| FL02 Creazione atleta | `athletes` nel tenant attivo; validazione zod; audit automatico |
| FL03 Iscrizione a gruppo | il centro fa **solo iscrizione al gruppo**: `enroll` su `athlete_groups` con controllo capienza; nessuna prenotazione della singola sessione |
| FL04 Registrazione pagamento | `payments.status='confirmed'` solo su conferma reale; `void` con motivo, mai delete/update (trigger già presente) |
| FL05 Rimborso | `refunds` collegato al pagamento; pagamento originario invariato ✓ (già garantito dal trigger) |
| FL06 Scadenza certificato | job `notify_expiring_documents()` → `notifications` (+ email se provider configurato); soglia giorni **DA DEFINIRE** |
| FL07 Rinnovo abbonamento | nuovo `fee_plan`/periodo o nuova `monthly_fees`; storico conservato |
| FL08 Presenza | `attendances` upsert; accesso negato a sessioni non proprie (Coach); audit |
| FL09 Cambio ruolo | `member_roles`; **protezione ultimo admin** da implementare |
| FL10 Isolamento tenant | RLS + org attiva risolta server-side; nessun `organization_id` dal client |

---

## 8. Sicurezza — mappa scheda 09 → stato

| Requisito | Stato scaffold | Azione |
|---|---|---|
| Account sicuri (Supabase Auth) | assente | Fase 1 |
| RBAC ruoli granulari | parziale (permessi seed) | mapping ruoli + helper — Fase 1 |
| Isolamento multi-tenant RLS | presente ma **troppo largo** per coach/atleta | restringere + org attiva server-side — Fase 1 |
| RLS deny-by-default | ✓ presente | mantenere; policy per ogni nuova tabella |
| Privacy dati sensibili (certificati) | tabelle pronte, bucket no | creare bucket privato `private-documents` + policy Storage — Fase 5 |
| Storico finanziario append-only | ✓ trigger presenti | estendere audit dove richiesto |
| Audit log | ✓ presente | + policy di lettura |
| Segreti fuori dal repo | ✓ `.env.example` + `.gitignore` | mantenere; `.env.local` solo locale |
| Validazione input client+server | assente | `zod` ovunque — da Fase 1 |
| Backup / logging / rate-limit | assente | dipende da hosting — **DA DEFINIRE** |

---

## 9. Test — mappa scheda 11 (T01–T12)

| Test Excel | Tipo | File / approccio |
|---|---|---|
| T01 Login valido | e2e | `e2e/auth.spec.ts` |
| T02 Password errata | e2e | `e2e/auth.spec.ts` |
| T03 Accesso cross-tenant negato | integration RLS | `tests/rls/tenant-isolation.test.ts` (anon-key con utente org A che interroga dati org B) |
| T04 Creazione atleta valida | integration + e2e | `tests/actions/athletes.test.ts`, `e2e/atleti.spec.ts` |
| T05 Gruppo pieno | integration | controllo capienza in `enrollAthleteInGroup` |
| T06 Pagamento registrato | integration | `tests/actions/payments.test.ts` (stato coerente, immutabilità) |
| T07 Rimborso parziale | integration | pagamento invariato, refund creato |
| T08 Certificato in scadenza | integration | `notify_expiring_documents()` genera la notifica giusta |
| T09 Coach apre pagamenti | integration RLS | accesso negato / nessun dato finanziario |
| T10 Atleta apre profilo | integration RLS + e2e | vede solo i propri dati |
| T11 Responsive smartphone | e2e | Playwright viewport mobile su tutte le sezioni |
| T12 Build produzione | CI | `pnpm lint && pnpm build && pnpm test` |

Unit aggiuntivi: `calculate_prorated_fee`, helper permessi, schema zod.
CI: GitHub Actions su push/PR → lint + build + vitest (+ Playwright opzionale).

---

## 10. Piano a incrementi

Regola per ogni incremento: **piccolo e verificabile** → `pnpm lint` + `pnpm build` + test pertinenti → **commit chiaro** (push solo a progetto verificato e senza segreti).

### Fase 0 — Prerequisiti ✅ *(2026-09-09)*
- 0.1 ✅ Node 24.20.0 + pnpm 11.19.0 + Git 2.55. `pnpm install` / `lint` / `build` ok.
- 0.2 ✅ `.env.local` compilato (chiavi `sb_publishable_` / `sb_secret_`).
- 0.3 ✅ `supabase link` + `db push`: schema + 4 migration Fase 1 applicate sul progetto `imxoapuijojhvowcstmo`. Durante il push corretti **2 bug latenti** dello schema scaffold (`competition_results` senza `organization_id`; regex `CHECK` di `permissions.key` con `\\.`). *(bucket `private-documents`: rinviato alla Fase 5)*
- 0.4 ✅ `pnpm db:types` → `src/types/database.types.ts` rigenerato dal progetto reale (2611 righe).

### Fase 1 — Infrastruttura: auth + tenant + RBAC *(il cuore, come da "PRIORITÀ" scheda 13)* ✅
Codice completo (commit `397c478`…`a6e2bfe`), `pnpm lint` + `pnpm build` + `pnpm test` verdi.
**Verificato a runtime (2026-09-09):** login → (nessuna org) → `/onboarding` → `provision_organization` → `/dashboard` con sidebar completa per admin → navigazione a `/atleti` (gate permesso ok) → logout. Nessun errore in console. Corretto un bug UI (sidebar non scrollava sotto una certa altezza schermo).
- 1.1 ✅ `@supabase/ssr`: client server/browser + `src/proxy.ts` (in Next 16 `middleware`→`proxy`, runtime Node) che rinfresca la sessione.
- 1.2 ✅ `/login`, `/recupera-password`, `/reset-password`, `/auth/callback`, logout — `useActionState` + zod.
- 1.3 ✅ Migration `provision_organization()` + `/onboarding` (crea org, settings, 4 ruoli di sistema, primo admin).
- 1.4 ✅ Cookie `athletix-org` validato server-side + `my_permissions` RPC + `assertPermission` / `requirePermission`.
- 1.5 ✅ Migration: funzioni self/coach/guardian, riscrittura policy di scrittura per permesso, restrizione letture sensibili, lettura audit ai soli admin.
- 1.6 ✅ Layout `(app)` con `AppShell` per ruolo (voci non autorizzate nascoste), selettore organizzazione, dashboard segnaposto, 13 stub di sezione con gate permesso.
- 1.7 ◑ Unit test (permessi, schemi auth) verdi. Matrice RLS automatizzata + e2e Playwright: **rinviati** (necessitano un secondo utente con ruolo limitato e un test runner e2e — Fase 2/7).
- ⏳ Push su GitHub: non ancora fatto (in attesa di conferma).

### Fase 2 — Anagrafiche & struttura sportiva
- 2.1 ✅ `e72b899` — Strutture, Spazi, Stagioni, **Discipline**. CRUD (list + `[id]`) sotto `/impostazioni`, permesso `facilities.manage`. Kit riusabile `DataTable` / `EntityForm` / `Breadcrumb`. Migration `20260911090000` (`disciplines` + `groups.discipline_id`).
- 2.2 ✅ `42823f2` — Atleti: list con ricerca + filtro stato (form GET, zero JS), `/atleti/nuovo`, `/atleti/[id]` scheda (modifica + archivia/ripristina). Helper condivisi `src/server/actions/_helpers.ts`. `ListToolbar`.
- 2.3 ✅ `77427de` — Tutori nella scheda atleta: aggiunta/rimozione, referente unico, limite 2 (trigger). Migration `20260911120000` (policy RLS `athlete_guardians`).
- 2.4 ✅ `3aea19d` — Coach: CRUD speculare agli atleti; qualifiche come lista separata da virgola.
- 2.5 ✅ `f234397` — Gruppi: `/gruppi` list (ricerca + filtro stagione), `/gruppi/nuovo`, `/gruppi/[id]` con sezioni **Fasce orarie** (vincolo GiST anti-overlap → 23P01 intercettato), **Coach** (`is_lead`), **Atleti** (controllo capienza). Migration `20260911140000` (policy RLS `athlete_groups` / `coach_groups`).
- 2.6 ✅ `cef83e8` — Categorie: migration `20260911160000` sostituisce `weight_categories` con `categories` generali (`kind`) + `athlete_categories`, migra i dati, riaggancia `competition_results.category_id`. CRUD `/categorie` + sezione "Categorie" nella scheda atleta.
- **Fase 2 completa.** Tutti gli incrementi verificati a runtime; commit + push per incremento.
- ⚠️ Nota Turbopack: svuotare `.next/` quando si aggiungono route sotto un segmento che prima aveva solo `page.tsx` (il dev server con cache filesystem non le rileva; `pnpm build` non è affetto).

### Fase 3 — Calendario, iscrizioni, presenze ✅
- 3.1 ✅ `48eb40b` — RPC `generate_sessions_for_group` (DST-aware, dedup); sezione "Sessioni" nella scheda gruppo; `/calendario` agenda settimanale con navigazione. Migration `20260912090000`.
- 3.2 ✅ — Iscrizione atleti ai gruppi con capienza: già realizzata in 2.5.
- 3.3 ✅ `48eb40b` — `/presenze` (lista sessioni ±2 settimane) e `/presenze/[id]` (registro Presente/Assente/Ritardo/Giustificato, salva → sessione "completed"). Migration `20260912100000` (policy RLS `attendances`: staff o coach del gruppo).
- 3.4 ✅ `a42da47` — `/prove`: lezioni di prova per potenziali iscritti, con stato presentato/iscritto/annullata. Migration `20260912110000` (RPC `add_trial_lesson`).
- **Fase 3 completa.** Tutto verificato a runtime.

### Fase 4 — Amministrazione economica (billing misto)
Decisioni committente: quota **mensile** + **pacchetti a durata (3 e 9 mesi)**; **niente carnet a ingressi**; tutti i metodi di pagamento (contanti/POS/bonifico/online, esito online registrato a mano per ora); ricevute a **progressivo annuo** (`n/AAAA`); valuta **EUR**.
- 4.1 ✅ `2e8eba0` — Quote mensili: `fee_plans` CRUD, RPC `generate_monthly_fees` (rateo + esoneri), `/abbonamenti/quote`. Migration `20260913090000`.
- 4.2 ✅ `0b85ec2` — Pacchetti a durata: tabelle `subscription_plans` + `subscriptions`, RPC `create_subscription` (`ends_on` = inizio + durata − 1g, prezzo congelato). `/abbonamenti/piani-pacchetto` + sezione nella scheda atleta. Migration `20260913100000`.
- 4.3 ~~Carnet a ingressi~~ — escluso dal committente.
- 4.4 / 4.5 / 4.6 ✅ `5ccfc8a` — Pagamenti (`/pagamenti`, precompilato da quota o pacchetto), rimborsi (parziali, pagamento originale invariato), ricevute a **progressivo annuo `n/AAAA`** (contatore per organizzazione). RPC `record_payment` / `record_refund` / `issue_receipt`. Migration `20260913110000`.
- **Fase 4 completa.** Tutto verificato a runtime. Metodi: contanti / POS / bonifico / online / altro. Valuta EUR.
- Test T06 (pagamento tracciato) e T07 (rimborso parziale, originale invariato): coperti dai test manuali; da automatizzare.

### Fase 5 — Documenti & scadenze ✅
Migration `20260914090000_documents_storage_and_alerts.sql`. Tutto verificato a runtime.
- 5.1 ✅ Bucket privato `private-documents` creato **via SQL** (`storage.buckets` + 4 policy su `storage.objects`): accesso ai soli membri con `documents.manage`, tenant = 1° segmento del path (`<organization_id>/<anno>/<uuid>.<ext>`). Helper `uuid_or_null`. Upload da server action (`uploadPrivateDocument`), download con **signed URL** a 5 minuti. Verificato: upload nella cartella di un'altra org **respinto** dalla RLS; solo il prefisso della propria org è visibile.
- 5.2 ✅ Certificati medici: `/certificati` (list con badge «in scadenza»/«scaduto», filtro stato, ricerca), `/certificati/nuovo` (atleta + tipo + date + allegato PDF/immagine ≤ 10 MB), `/certificati/[id]` (modifica, sostituzione allegato, elimina cert+allegato). Sezione nella scheda atleta.
- 5.3 ✅ Tesseramenti: stessa struttura su `fita_memberships` (tabella scaffold mantenuta; campo `federation` reso **testo libero** — FITA/FIN/CONI/UISP… — invece della rinomina a `federation_memberships` prevista in §2.3, rinviata per non toccare 3 migration + tipi + audit per un guadagno UI nullo). `/tesseramenti` + `nuovo` + `[id]` + sezione scheda atleta.
- 5.4 ✅ `notify_expiring_documents()` (SECURITY DEFINER): porta a «scaduto» ciò che è oltre data, poi inserisce in `notifications` (nuova tabella, feed per-utente, RLS `user_id = auth.uid()`, indice unico anti-duplicato sugli avvisi non letti) un avviso per ogni membro con `documents.manage`/`people.manage`/`organization.manage`. Richiamabile da cron; esposta anche via pulsante «Ricalcola scadenze». Verificato: genera l'avviso corretto per il certificato in scadenza.
- 5.5 ✅ `/impostazioni/organizzazione`: form `updateOrgSettings` per `fee_grace_days` + i nuovi `certificate_alert_days` / `membership_alert_days` (default 30). `EntityForm` esteso con il tipo campo `file`; `PageHeader.subtitle` ora accetta `ReactNode`.
- Test T08: coperto da verifica manuale (notifica generata); da automatizzare.
- Feed notifiche in-app (pagina `/notifiche` + widget dashboard): rinviato alla **Fase 7.2** come da piano.

### Fase 6 — Aree self-service
Decisione committente (2026-09-10): **atleti maggiorenni → login proprio; minori di 18 → accesso solo tramite un tutore.**
- 6.1 ✅ **Area atleta/tutore**.
  - Provisioning account (`src/server/actions/access.ts`): da scheda atleta/tutore, `grantAthleteAccess` / `grantGuardianAccess` (permesso `people.manage`) creano/riusano l'utente auth via **client di servizio** (`src/lib/supabase/admin.ts`, chiave `SUPABASE_SERVICE_ROLE_KEY`, bypassa RLS) + riga `profiles`, poi collegano `athletes.profile_id` / `guardians.profile_id`. Password provvisoria mostrata **una sola volta** nel messaggio del form (nessun provider email: si comunica a voce/altro). `grantAthleteAccess` blocca i minorenni. `revoke*` azzerano `profile_id`.
  - Routing: `src/lib/auth/portal.ts` `getPortalIdentity()` (atleti self + minori in tutela). `(app)/layout` e `/onboarding` ora deviano i non-staff su `/area`. Nuovo route group `(portal)` con shell leggera.
  - Pagine: `/area` (elenco persone), `/area/atleta/[id]` (sola lettura: anagrafica, gruppi, prossimi allenamenti, quote, pagamenti, certificati, tesseramenti — con badge scadenze), `/area/password` (**cambio password da loggato**, `changeMyPassword` — non serve email; link nell'header del portale).
  - Migration `20260914120000_portal_read_access.sql`: estende le letture RLS di `organizations` / `groups` / `training_sessions` / `attendances` a atleta-self e tutore (prima erano solo `is_organization_member`).
  - Verificato a runtime: grant per Mario Rossi (21 anni) → password provvisoria → login come atleta → redirect `/area` → scheda con tutti i dati reali via RLS; `/dashboard` e `/atleti` reindirizzano l'atleta su `/area`; id atleta non proprio → 404; cambio password dal portale ok.
  - **Rinviato (non erano parte di 6.1):** comunicazioni ricevute nell'area → **Fase 7.1/7.2** (manca il modulo comunicazioni); stato accesso / invito nella scheda coach → **Fase 7.5** (i coach accedono come `organization_members` con ruolo Coach, quindi è gestione utenti/ruoli, non `coaches.profile_id`); azioni self di modifica dati → **fuori scope** (nessun self-service oltre alla consultazione, da decisione committente).
- 6.2 ✅ **Area coach** (usa l'app `(app)` con nav ridotta, permesso `attendance.manage`, non un portale separato).
  - `src/lib/auth/coach.ts` `getCoachContext(orgId)` → `{isCoach, coachId, groupIds}` (riga `coaches` collegata alla membership + `coach_groups` non scaduti).
  - `/coach/area` — "I miei gruppi" (nome, stagione, n. atleti, prossima sessione); `/coach/gruppo/[id]` — roster + sessioni ±(7/21)g con link a `/presenze/[id]`; guard `groupIds.includes(id) || groups.manage`.
  - `/calendario` e `/presenze`: se l'utente è coach **e non** ha `groups.manage`, le query `training_sessions` sono filtrate su `groupIds` e i link al gruppo puntano a `/coach/gruppo/[id]` invece che a `/gruppi/[id]`. `/presenze/[id]` nega (404) le sessioni fuori dai propri gruppi.
  - Voce nav "Area coach" (`attendance.manage`); per staff non-coach mostra un avviso "non sei collegato a un'anagrafica coach".
  - Verificato a runtime con utente coach di test (`coach.test@athletix.local`, membership + ruolo Coach + `coaches.organization_member_id` + `coach_groups` → Judo Ragazzi): nav ridotta (Dashboard/Calendario/Presenze/Area coach); `/coach/area` e `/coach/gruppo` mostrano solo il suo gruppo; salvataggio presenze ok (RLS `is_coach_of_group`); `/atleti` `/gruppi` `/abbonamenti` → redirect denied; gruppo altrui → 404; l'admin continua a vedere tutto con link a `/gruppi/[id]`.
- 6.3 ✅ **Schede di allenamento**. Migration `20260914150000_workout_plans.sql`: `workout_plans` (athlete, coach, titolo, date, stato draft/active/archived, note) + `workout_plan_items` (day_index 1–14, exercise, sets, reps, load, rest_seconds, notes, sort). RLS: lettura a `people.manage` / coach dell'atleta / atleta-self / tutore; scrittura a `people.manage` / `is_coach_of_athlete`. Server actions `src/server/actions/workouts.ts` (guard `attendance.manage`, la RLS restringe il coach ai propri atleti). Route `(app)/schede/[athleteId]` (elenco + crea) e `/schede/[athleteId]/[planId]` (meta scheda + esercizi per giorno con `<details>` inline edit + rimuovi). Link dalla scheda atleta staff (`_workouts-section.tsx`) e dal roster `/coach/gruppo/[id]`. Pannello **sola lettura** nell'area personale (`/area/atleta/[id]`).
  - Verificato a runtime: admin crea scheda + esercizio; coach crea scheda per un proprio atleta (RLS `is_coach_of_athlete` ok); atleta la vede in sola lettura nell'area personale.
- **Fase 6 completa** (6.1 + 6.2 + 6.3).
- Test T09, T10: coperti da verifica manuale; da automatizzare.

### Fase 7 — Comunicazione, gare, report, utenti
Committente (2026-09-10): "può partire tutto"; email provider = **Resend** (I04).
Ordine di lavoro adottato: **7.5 → 7.1 → 7.2 → 7.3 → 7.4 → 7.6 → 7.7** (utenti/ruoli prima perché fondamento di comunicazioni e test).
- 7.5 ✅ Gestione utenti e ruoli. Migration `20260914170000_user_management.sql`: RPC `list_org_members` (supera `profiles_self`), `add_org_member`, `set_member_roles`, `set_member_status` (SECURITY DEFINER, guard `organization.manage`), `org_admin_count`/`member_is_admin` per la **protezione ultimo amministratore attivo** (nessuna azione può togliere/sospendere l'unico admin). `src/server/actions/members.ts` (`inviteMember` usa `createAdminClient` + `ensureAccount` estratto in `src/lib/auth/provision.ts`, poi `add_org_member`; password provvisoria mostrata una volta). Pagina `/impostazioni/utenti` (elenco con ruoli/stato, `<details>` modifica ruoli, sospendi/riattiva; l'unico admin mostra "Unico amministratore" senza pulsante). Verificato a runtime: invito, cambio ruoli, guard ultimo admin, sospendi/riattiva non-admin.
- `src/lib/email/index.ts` — `sendEmail()` via Resend (fetch a `api.resend.com`), no-op se `RESEND_API_KEY`/`EMAIL_FROM` mancano. `.env.example` aggiornato.
- 7.1 ✅ Comunicazioni. Migration `20260914190000` (RLS `communication_recipients`/`_attachments`; lettura `communications` anche al destinatario) + `20260914191000` (RPC `populate_communication_recipients` per ambito staff/tutti_atleti/gruppo — SECURITY DEFINER perché `communications.manage` ≠ `people.manage`; `communication_recipient_emails`) + `20260914192000` (fix ricorsione RLS via `is_communication_recipient()` SECURITY DEFINER). `send_communication(p_comm)` genera una `notifications` per ogni destinatario risolto a un login e marca `sent`. `src/server/actions/communications.ts` (+ invio email Reside se canale `email`). `/comunicazioni` list + `/nuova` + `/[id]` (bozza: testo, destinatari per ambito, invia/annulla). `EntityForm` esteso col tipo `textarea`. **Scheduling (status `scheduled` + cron) rinviato.**
- 7.2 ✅ Feed notifiche in-app. `src/components/notifications-list.tsx` + `src/server/actions/notifications.ts` (`markNotificationRead`, `markAllNotificationsRead`). Pagine `/notifiche` (staff, voce nav) e `/area/notifiche` (portale, link nell'header); RLS `notifications_self`.
- Verificato a runtime: bozza → destinatari "tutti gli atleti" (2) → invia → notifica in-app all'atleta nel portale (`/area/notifiche`), marca letta ok; staff `/notifiche` mostra gli alert scadenze di Fase 5.
- 7.3 ✅ Gare ed eventi. Migration `20260914200000_competitions_events.sql`: RLS `competition_calls` / `event_attendees` (erano deny-all; lettura anche ad atleta/tutore); `events_manage` allineato a `competitions.manage`. `src/server/actions/competitions.ts` (gara CRUD, `addCall`/`setCallStatus`/`removeCall` con `responded_at`, `upsertResult`/`removeResult`) + `src/server/actions/events.ts`. `/gare` list + `/nuova` + `/[id]` (dati gara + sezioni **Convocazioni** e **Risultati**). `/eventi` list + `/nuovo` + `/[id]`. Nav "Gare" + "Eventi" (`competitions.manage`). **`src/lib/format.ts`: `localInputToUtcISO` / `utcISOToLocalInput`** — conversione `datetime-local` ⇄ UTC DST-aware e indipendente dal fuso della macchina (via `Intl.formatToParts`). Verificato a runtime: gara + convocazione (confermata) + risultato; evento 17:00–20:00 round-trip corretto (CET e CEST).
- 7.4 Report/KPI + export CSV.
- 7.6 Ricerca globale. 7.7 Viewer audit log. Import controllato.
- Test T12 (build), coerenza report.

### Fase 8 — Lancio
Checklist scheda 12: build + lint puliti; tutte le migration applicate; matrice RLS verificata; test verdi; bucket privato + policy; backup Supabase; monitoring/hosting (**DA DEFINIRE**); dominio (**DA DEFINIRE**); `.env` solo nomi nel repo. Riepilogo finale: modifiche, test, rischi, prossimi passi.

---

## 11. Rischi

- **Toolchain assente**: nessun avanzamento reale finché Node/pnpm/Git non sono installati (§1.3). Chocolatey richiede shell elevata.
- **RLS troppo larga** per coach/atleta nello scaffold: rischio privacy finché non ristretta (Fase 1.5).
- **Billing misto** (§2.3): tre modelli di pagamento (quota mensile / pacchetto / carnet) da mantenere coerenti su `payments` e nei report — complessità concentrata in Fase 4.
- **Atleti non collegati ad account**: l'area atleta richiede la migration di collegamento; se molti atleti sono minori, l'accesso è tutto sui tutori — regola per età da confermare.
- **Migrazione `weight_categories` → `categories`**: le tabelle dello scaffold non hanno dati seed, ma la FK di `competition_results` va aggiornata con attenzione.
- **Next.js 16 breaking changes**: seguire `node_modules/next/dist/docs/` (`AGENTS.md`). Alcune API già diverse (`params` async, `LayoutProps`).
- **Provider email / gateway pagamenti non scelti**: notifiche email e pagamenti online restano stub.
- **Job schedulati**: `refresh_monthly_fee_statuses` e alert scadenze richiedono uno scheduler (Supabase scheduled functions / Vercel Cron / GitHub Actions) — dipende dall'hosting.

---

## 12. DA DEFINIRE

| Rif. | Decisione | Serve per |
|---|---|---|
| ✅ §2 | Modello dati: **Opzione A estesa** — *deciso 2026-09-09* | — |
| ✅ C06 | Prenotazioni self-service: **no**, solo iscrizione ai gruppi — *deciso* | — |
| C05 | Elenco **discipline** del centro e **categorie** per disciplina (età/peso/livello) | Fase 2.6 |
| D41 / C07 | Valuta (EUR?) e metodi di pagamento reali (contanti/POS/bonifico/online) | Fase 4 |
| C04 | Importi quote mensili, prezzi pacchetti a durata, tagli e prezzi carnet ingressi (dati, non codice) | Fase 4 |
| — | Il carnet ingressi si decrementa sulla **presenza** o sulla **prenotazione/iscrizione**? Scadenza carnet? | Fase 4.3 |
| ✅ FL06 | Giorni di preavviso alert certificati / tesseramenti: **configurabile per organizzazione, default 30** (`/impostazioni/organizzazione`) — *deciso Fase 5* | — |
| §4 | Formato numero ricevuta (progressivo annuo? per struttura?) | Fase 4.6 |
| ✅ I04 | Provider email: **Resend** (il più semplice) — *deciso 2026-09-10*. Astrazione `src/lib/email/` attiva solo se `RESEND_API_KEY` + `EMAIL_FROM` sono in `.env.local`, altrimenti gli invii sono registrati senza spedizione. | Fase 7.1 |
| I05 | Serve pagamento online? quale gateway | Fase 7 (opz.) |
| Scheda 12 | Hosting (Vercel?), dominio, backup, monitoring, scheduler cron | Fase 8 |
| C01 | Logo definitivo | rifinitura UI |
| ✅ — | Atleti maggiorenni: **login proprio**. Minori di 18: **accesso solo via tutore**. — *deciso 2026-09-10* | — |
| — | Ruoli di sistema globali (`organization_id = null`) o duplicati per organizzazione? | Fase 1.5 |
