# Database ATHLETIX

La migration iniziale e nella cartella `supabase/migrations`. Il modello e multi-societa: ogni entita operativa e isolata da `organization_id`.

## Aree

| Area | Tabelle |
| --- | --- |
| Accesso | `profiles`, `organization_members`, `roles`, `permissions`, `member_roles` |
| Sedi e gruppi | `facilities`, `spaces`, `seasons`, `groups`, `group_schedule_slots` |
| Persone | `athletes`, `guardians`, `athlete_guardians`, `coaches` |
| Associazioni | strutture/gruppi per atleti e allenatori, con date di inizio/fine |
| Storici | tesseramenti FITA, certificati medici, categorie di peso |
| Amministrazione | quote, pagamenti, rimborsi, ricevute, sconti ed esoneri |
| Operativita | allenamenti, presenze, prove, gare, convocazioni, risultati ed eventi |
| Comunicazioni | comunicazioni, destinatari, allegati e documenti privati |

## Regole applicate

- Un gruppo ha una sola struttura e una stagione; uno spazio ha una struttura.
- Atleti e allenatori possono essere associati a piu strutture e gruppi, mantenendo lo storico.
- Il trigger su `athlete_guardians` limita a due i tutori di ogni atleta.
- Gli orari ricorrenti hanno `valid_from` e `valid_to`; il vincolo GiST evita sovrapposizioni nello stesso spazio.
- Le quote mensili sono univoche per atleta, piano e mese. `calculate_prorated_fee` supporta ingressi infra-mese.
- `refresh_monthly_fee_statuses()` porta una quota da scaduta a insoluta oltre cinque giorni dalla scadenza. Va chiamata quotidianamente da un job server-side autorizzato.
- Pagamenti, rimborsi e ricevute non sono aggiornabili o cancellabili: le rettifiche passano da annullamento o rimborso.

## Supabase

Le autenticazioni usano `auth.users`; non esistono password applicative. Tutte le tabelle applicative hanno RLS abilitata. Le policy di base permettono lettura ai membri attivi della societa e scrittura agli utenti con il permesso `organization.manage`; i ruoli mappano i permessi granulari.

I documenti hanno solo metadati e un percorso opaco in `private_documents`. Creare in Supabase Storage il bucket **privato** `private-documents` e aggiungere policy Storage coerenti con le policy RLS prima di attivare upload/download.

## Variabili

Copiare `.env.example` in `.env.local` e compilare le variabili pubbliche del progetto Supabase. La chiave service role e solo server-side: non va esposta al browser, inclusa nel codice o committata.
