-- Fase 8 · Lancio: i job schedulati (Vercel Cron) girano con la chiave di
-- servizio, senza un utente autenticato. `notify_expiring_documents()` era
-- stata concessa solo ad `authenticated`: si aggiunge `service_role`.
-- (`refresh_monthly_fee_statuses` non ha mai avuto un `revoke`, quindi resta
-- eseguibile da tutti i ruoli per privilegio di default su PUBLIC.)

grant execute on function public.notify_expiring_documents() to service_role;
