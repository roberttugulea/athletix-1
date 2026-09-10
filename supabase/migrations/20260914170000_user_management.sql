-- Fase 7.5 · Gestione utenti e ruoli.
-- RPC SECURITY DEFINER: elenco membri (per superare profiles_self), aggiunta
-- membro, cambio ruoli, cambio stato. Tutte protette da `organization.manage`.
-- Vincolo: l'organizzazione deve sempre avere almeno un amministratore attivo.

create or replace function public.org_admin_count(p_org uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct om.id)::int
  from public.organization_members om
  join public.member_roles mr on mr.organization_member_id = om.id
  join public.role_permissions rp on rp.role_id = mr.role_id
  join public.permissions p on p.id = rp.permission_id
  where om.organization_id = p_org
    and om.status = 'active'
    and p.key = 'organization.manage';
$$;

create or replace function public.member_is_admin(p_member uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.member_roles mr
    join public.role_permissions rp on rp.role_id = mr.role_id
    join public.permissions p on p.id = rp.permission_id
    where mr.organization_member_id = p_member
      and p.key = 'organization.manage'
  );
$$;

-- ------------------------------------------------------------ elenco membri
create or replace function public.list_org_members(p_org uuid)
returns table (
  member_id uuid,
  profile_id uuid,
  first_name text,
  last_name text,
  email text,
  status public.member_status,
  role_ids uuid[],
  role_names text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    om.id,
    pr.id,
    pr.first_name,
    pr.last_name,
    pr.email,
    om.status,
    coalesce(array_agg(r.id) filter (where r.id is not null), '{}'),
    coalesce(array_agg(r.name order by r.name) filter (where r.name is not null), '{}')
  from public.organization_members om
  join public.profiles pr on pr.id = om.profile_id
  left join public.member_roles mr on mr.organization_member_id = om.id
  left join public.roles r on r.id = mr.role_id
  where om.organization_id = p_org
    and public.has_organization_permission(p_org, 'organization.manage')
  group by om.id, pr.id, pr.first_name, pr.last_name, pr.email, om.status
  order by pr.last_name, pr.first_name;
$$;

revoke all on function public.list_org_members(uuid) from public;
grant execute on function public.list_org_members(uuid) to authenticated;

-- --------------------------------------------------------- aggiunta membro
create or replace function public.add_org_member(
  p_org uuid,
  p_profile uuid,
  p_role_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid;
  v_bad int;
begin
  if not public.has_organization_permission(p_org, 'organization.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;

  select count(*) into v_bad
  from unnest(p_role_ids) rid
  where not exists (
    select 1 from public.roles r where r.id = rid and r.organization_id = p_org
  );
  if v_bad > 0 then
    raise exception 'Ruolo non valido per questa organizzazione';
  end if;

  insert into public.organization_members (organization_id, profile_id, status, joined_at)
  values (p_org, p_profile, 'active', now())
  on conflict (organization_id, profile_id)
  do update set status = 'active', archived_at = null
  returning id into v_member;

  delete from public.member_roles where organization_member_id = v_member;
  insert into public.member_roles (organization_member_id, role_id)
  select v_member, rid from unnest(p_role_ids) rid;

  return v_member;
end;
$$;

revoke all on function public.add_org_member(uuid, uuid, uuid[]) from public;
grant execute on function public.add_org_member(uuid, uuid, uuid[]) to authenticated;

-- ------------------------------------------------------------ cambio ruoli
create or replace function public.set_member_roles(
  p_member uuid,
  p_role_ids uuid[]
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_bad int;
  v_new_is_admin boolean;
begin
  select organization_id into v_org from public.organization_members where id = p_member;
  if v_org is null then
    raise exception 'Membro inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'organization.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;

  select count(*) into v_bad
  from unnest(p_role_ids) rid
  where not exists (
    select 1 from public.roles r where r.id = rid and r.organization_id = v_org
  );
  if v_bad > 0 then
    raise exception 'Ruolo non valido per questa organizzazione';
  end if;

  select exists (
    select 1
    from unnest(p_role_ids) rid
    join public.role_permissions rp on rp.role_id = rid
    join public.permissions p on p.id = rp.permission_id
    where p.key = 'organization.manage'
  ) into v_new_is_admin;

  if public.member_is_admin(p_member)
     and not v_new_is_admin
     and public.org_admin_count(v_org) <= 1 then
    raise exception 'Deve restare almeno un amministratore attivo';
  end if;

  delete from public.member_roles where organization_member_id = p_member;
  insert into public.member_roles (organization_member_id, role_id)
  select p_member, rid from unnest(p_role_ids) rid;
end;
$$;

revoke all on function public.set_member_roles(uuid, uuid[]) from public;
grant execute on function public.set_member_roles(uuid, uuid[]) to authenticated;

-- ------------------------------------------------------------ cambio stato
create or replace function public.set_member_status(
  p_member uuid,
  p_status text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_cur public.member_status;
begin
  if p_status not in ('active', 'suspended') then
    raise exception 'Stato non ammesso';
  end if;

  select organization_id, status into v_org, v_cur
  from public.organization_members where id = p_member;
  if v_org is null then
    raise exception 'Membro inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'organization.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;

  if p_status <> 'active'
     and v_cur = 'active'
     and public.member_is_admin(p_member)
     and public.org_admin_count(v_org) <= 1 then
    raise exception 'Deve restare almeno un amministratore attivo';
  end if;

  update public.organization_members
     set status = p_status::public.member_status
   where id = p_member;
end;
$$;

revoke all on function public.set_member_status(uuid, text) from public;
grant execute on function public.set_member_status(uuid, text) to authenticated;
