-- Fase 1 · RBAC: ruoli di sistema per organizzazione, provisioning e funzioni
-- di supporto per le policy RLS. Additiva: non modifica lo schema esistente.

-- ---------------------------------------------------------------------------
-- Provisioning di una nuova organizzazione
-- Crea org + impostazioni + 4 ruoli di sistema + primo membro amministratore
-- in un'unica transazione. L'utente che invoca la funzione diventa l'admin.
-- ---------------------------------------------------------------------------
create or replace function public.provision_organization(
  p_name text,
  p_admin_first_name text,
  p_admin_last_name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_member uuid;
  v_role_admin uuid;
  v_role_secretary uuid;
  v_role_coach uuid;
  v_role_athlete uuid;
begin
  if v_uid is null then
    raise exception 'Autenticazione richiesta' using errcode = '28000';
  end if;
  if length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Nome organizzazione non valido';
  end if;

  insert into public.profiles (id, first_name, last_name)
  values (
    v_uid,
    coalesce(nullif(trim(p_admin_first_name), ''), 'Amministratore'),
    coalesce(nullif(trim(p_admin_last_name), ''), 'ATHLETIX')
  )
  on conflict (id) do nothing;

  insert into public.organizations (name) values (trim(p_name)) returning id into v_org;
  insert into public.organization_settings (organization_id) values (v_org);

  insert into public.roles (organization_id, name, description, is_system)
    values (v_org, 'Amministratore', 'Accesso completo alla propria organizzazione', true)
    returning id into v_role_admin;
  insert into public.roles (organization_id, name, description, is_system)
    values (v_org, 'Segreteria', 'Gestione operativa e amministrativa', true)
    returning id into v_role_secretary;
  insert into public.roles (organization_id, name, description, is_system)
    values (v_org, 'Coach', 'Gestione allenamenti e presenze dei propri gruppi', true)
    returning id into v_role_coach;
  insert into public.roles (organization_id, name, description, is_system)
    values (v_org, 'Atleta', 'Accesso alla propria area personale', true)
    returning id into v_role_athlete;

  insert into public.role_permissions (role_id, permission_id)
  select v_role_admin, p.id from public.permissions p where p.key = 'organization.manage';

  insert into public.role_permissions (role_id, permission_id)
  select v_role_secretary, p.id from public.permissions p
  where p.key in (
    'people.manage', 'groups.manage', 'finance.manage', 'attendance.manage',
    'communications.manage', 'documents.manage', 'reports.read', 'facilities.manage'
  );

  insert into public.role_permissions (role_id, permission_id)
  select v_role_coach, p.id from public.permissions p where p.key = 'attendance.manage';

  -- Il ruolo Atleta non ha permessi a livello di organizzazione:
  -- l'accesso ai propri dati passa dalle policy "self".

  insert into public.organization_members (organization_id, profile_id, status, joined_at)
  values (v_org, v_uid, 'active', now())
  returning id into v_member;

  insert into public.member_roles (organization_member_id, role_id)
  values (v_member, v_role_admin);

  return v_org;
end;
$$;

revoke all on function public.provision_organization(text, text, text) from public;
grant execute on function public.provision_organization(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Permessi effettivi dell'utente corrente in una organizzazione
-- ---------------------------------------------------------------------------
create or replace function public.my_permissions(p_org uuid)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct p.key
  from public.organization_members om
  join public.member_roles mr on mr.organization_member_id = om.id
  join public.role_permissions rp on rp.role_id = mr.role_id
  join public.permissions p on p.id = rp.permission_id
  where om.organization_id = p_org
    and om.profile_id = auth.uid()
    and om.status = 'active';
$$;

-- ---------------------------------------------------------------------------
-- Funzioni di scope per le policy RLS (coach)
-- ---------------------------------------------------------------------------
create or replace function public.is_coach_of_group(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.coach_groups cg
    join public.coaches c on c.id = cg.coach_id
    join public.organization_members om on om.id = c.organization_member_id
    where cg.group_id = p_group
      and om.profile_id = auth.uid()
      and om.status = 'active'
      and (cg.ends_on is null or cg.ends_on >= current_date)
  );
$$;

create or replace function public.is_coach_of_athlete(p_athlete uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.athlete_groups ag
    join public.coach_groups cg on cg.group_id = ag.group_id
    join public.coaches c on c.id = cg.coach_id
    join public.organization_members om on om.id = c.organization_member_id
    where ag.athlete_id = p_athlete
      and om.profile_id = auth.uid()
      and om.status = 'active'
      and (ag.ends_on is null or ag.ends_on >= current_date)
      and (cg.ends_on is null or cg.ends_on >= current_date)
  );
$$;
