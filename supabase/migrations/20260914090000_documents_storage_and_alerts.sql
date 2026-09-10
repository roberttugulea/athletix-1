-- Fase 5 · Documenti privati (Storage) + notifiche + alert scadenze.
--
--  1. Bucket privato `private-documents` + policy su storage.objects
--     (accesso ai soli membri con `documents.manage`, tenant = 1° segmento
--     del path = organization_id).
--  2. Tabella `notifications` (feed in-app per utente).
--  3. `organization_settings`: giorni di preavviso per certificati e tessere.
--  4. `notify_expiring_documents()` — aggiorna gli stati scaduti e crea le
--     notifiche per i documenti in scadenza. Idempotente, richiamabile da cron.

-- ------------------------------------------------------------------ helper
create or replace function public.uuid_or_null(p text)
returns uuid language plpgsql immutable as $$
begin
  return p::uuid;
exception when others then
  return null;
end;
$$;

-- --------------------------------------------------------------- 1. Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-documents', 'private-documents', false, 10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
declare op text;
begin
  foreach op in array array['select', 'insert', 'update', 'delete'] loop
    execute format('drop policy if exists %I on storage.objects', 'private_documents_' || op);
  end loop;
end $$;

create policy private_documents_select on storage.objects for select to authenticated
using (
  bucket_id = 'private-documents'
  and public.has_organization_permission(
        public.uuid_or_null((storage.foldername(name))[1]), 'documents.manage')
);

create policy private_documents_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'private-documents'
  and public.has_organization_permission(
        public.uuid_or_null((storage.foldername(name))[1]), 'documents.manage')
);

create policy private_documents_update on storage.objects for update to authenticated
using (
  bucket_id = 'private-documents'
  and public.has_organization_permission(
        public.uuid_or_null((storage.foldername(name))[1]), 'documents.manage')
)
with check (
  bucket_id = 'private-documents'
  and public.has_organization_permission(
        public.uuid_or_null((storage.foldername(name))[1]), 'documents.manage')
);

create policy private_documents_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'private-documents'
  and public.has_organization_permission(
        public.uuid_or_null((storage.foldername(name))[1]), 'documents.manage')
);

-- --------------------------------------------------------- 2. notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  entity_table text,
  entity_id uuid,
  url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;

create unique index if not exists notifications_dedup_idx
  on public.notifications (user_id, kind, entity_table, entity_id)
  where read_at is null and entity_id is not null;

alter table public.notifications enable row level security;

drop policy if exists notifications_self_read on public.notifications;
create policy notifications_self_read on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- nessuna policy di insert: si popola solo via SECURITY DEFINER.

-- ------------------------------------------------- 3. settings: alert days
alter table public.organization_settings
  add column if not exists certificate_alert_days smallint not null default 30
    check (certificate_alert_days between 1 and 180),
  add column if not exists membership_alert_days smallint not null default 30
    check (membership_alert_days between 1 and 180);

-- --------------------------------------------- 4. job scadenze / notifiche
create or replace function public.notify_expiring_documents()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_n integer;
begin
  -- 4a. porta a "scaduto" ciò che è passato di data
  update public.medical_certificates
     set status = 'expired'
   where status = 'valid' and expires_on < current_date;

  update public.fita_memberships
     set status = 'expired'
   where status = 'active' and ends_on is not null and ends_on < current_date;

  -- 4b. certificati medici in scadenza
  with due as (
    select mc.id, mc.organization_id, mc.expires_on,
           a.first_name || ' ' || a.last_name as who
    from public.medical_certificates mc
    join public.athletes a on a.id = mc.athlete_id
    join public.organization_settings os on os.organization_id = mc.organization_id
    where mc.status = 'valid'
      and mc.expires_on <= current_date + os.certificate_alert_days
  ),
  recipients as (
    select distinct d.id, d.organization_id, d.expires_on, d.who, om.profile_id as user_id
    from due d
    join public.organization_members om
      on om.organization_id = d.organization_id and om.status = 'active'
    join public.member_roles mr on mr.organization_member_id = om.id
    join public.role_permissions rp on rp.role_id = mr.role_id
    join public.permissions p on p.id = rp.permission_id
    where p.key in ('documents.manage', 'people.manage', 'organization.manage')
  ),
  ins as (
    insert into public.notifications
      (organization_id, user_id, kind, title, body, entity_table, entity_id, url)
    select r.organization_id, r.user_id, 'certificate_expiring',
           'Certificato medico in scadenza',
           r.who || ' — scade il ' || to_char(r.expires_on, 'DD/MM/YYYY'),
           'medical_certificates', r.id, '/certificati/' || r.id
    from recipients r
    on conflict do nothing
    returning 1
  )
  select count(*) into v_n from ins;
  v_count := v_count + coalesce(v_n, 0);

  -- 4c. tesseramenti in scadenza
  with due as (
    select fm.id, fm.organization_id, fm.ends_on, fm.federation,
           a.first_name || ' ' || a.last_name as who
    from public.fita_memberships fm
    join public.athletes a on a.id = fm.athlete_id
    join public.organization_settings os on os.organization_id = fm.organization_id
    where fm.status = 'active'
      and fm.ends_on is not null
      and fm.ends_on <= current_date + os.membership_alert_days
  ),
  recipients as (
    select distinct d.id, d.organization_id, d.ends_on, d.federation, d.who,
           om.profile_id as user_id
    from due d
    join public.organization_members om
      on om.organization_id = d.organization_id and om.status = 'active'
    join public.member_roles mr on mr.organization_member_id = om.id
    join public.role_permissions rp on rp.role_id = mr.role_id
    join public.permissions p on p.id = rp.permission_id
    where p.key in ('people.manage', 'documents.manage', 'organization.manage')
  ),
  ins as (
    insert into public.notifications
      (organization_id, user_id, kind, title, body, entity_table, entity_id, url)
    select r.organization_id, r.user_id, 'membership_expiring',
           'Tesseramento in scadenza',
           r.who || ' (' || r.federation || ') — scade il '
             || to_char(r.ends_on, 'DD/MM/YYYY'),
           'fita_memberships', r.id, '/tesseramenti/' || r.id
    from recipients r
    on conflict do nothing
    returning 1
  )
  select count(*) into v_n from ins;
  v_count := v_count + coalesce(v_n, 0);

  return v_count;
end;
$$;

revoke all on function public.notify_expiring_documents() from public;
grant execute on function public.notify_expiring_documents() to authenticated;

-- audit + updated_at per notifications: non necessari (append-only, read_at unico update).
