-- Fase 7.1 · RPC per popolare i destinatari di una comunicazione in base a un
-- ambito (tutto lo staff / tutti gli atleti / un gruppo). SECURITY DEFINER:
-- chi ha `communications.manage` non ha necessariamente `people.manage`.

create or replace function public.populate_communication_recipients(
  p_comm uuid,
  p_scope text,
  p_group uuid default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status text;
  v_count integer;
begin
  select organization_id, status into v_org, v_status
  from public.communications where id = p_comm;
  if v_org is null then
    raise exception 'Comunicazione inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'communications.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;
  if v_status <> 'draft' then
    raise exception 'I destinatari si modificano solo in bozza';
  end if;
  if p_scope not in ('staff', 'all_athletes', 'group') then
    raise exception 'Ambito non valido';
  end if;
  if p_scope = 'group' and p_group is null then
    raise exception 'Gruppo non indicato';
  end if;

  delete from public.communication_recipients where communication_id = p_comm;

  if p_scope = 'staff' then
    insert into public.communication_recipients (communication_id, profile_id)
    select p_comm, om.profile_id
    from public.organization_members om
    where om.organization_id = v_org and om.status = 'active'
    on conflict (communication_id, coalesce(profile_id, athlete_id, guardian_id))
    do nothing;
  else
    -- atleti in ambito
    with scoped as (
      select a.id
      from public.athletes a
      where a.organization_id = v_org
        and a.status = 'active'
        and (
          p_scope = 'all_athletes'
          or exists (
            select 1 from public.athlete_groups ag
            where ag.athlete_id = a.id
              and ag.group_id = p_group
              and (ag.ends_on is null or ag.ends_on >= current_date)
          )
        )
    )
    insert into public.communication_recipients (communication_id, athlete_id)
    select p_comm, s.id from scoped s
    on conflict (communication_id, coalesce(profile_id, athlete_id, guardian_id))
    do nothing;

    -- tutori degli atleti in ambito
    with scoped as (
      select a.id
      from public.athletes a
      where a.organization_id = v_org
        and a.status = 'active'
        and (
          p_scope = 'all_athletes'
          or exists (
            select 1 from public.athlete_groups ag
            where ag.athlete_id = a.id
              and ag.group_id = p_group
              and (ag.ends_on is null or ag.ends_on >= current_date)
          )
        )
    )
    insert into public.communication_recipients (communication_id, guardian_id)
    select distinct p_comm, ag.guardian_id
    from public.athlete_guardians ag
    join scoped s on s.id = ag.athlete_id
    on conflict (communication_id, coalesce(profile_id, athlete_id, guardian_id))
    do nothing;
  end if;

  select count(*) into v_count
  from public.communication_recipients where communication_id = p_comm;
  return v_count;
end;
$$;

revoke all on function public.populate_communication_recipients(uuid, text, uuid) from public;
grant execute on function public.populate_communication_recipients(uuid, text, uuid) to authenticated;

-- Email dei destinatari (per il canale email); solo `communications.manage`.
create or replace function public.communication_recipient_emails(p_comm uuid)
returns setof text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.communications where id = p_comm;
  if v_org is null
     or not public.has_organization_permission(v_org, 'communications.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;

  return query
    select distinct e.email
    from (
      select pr.email
      from public.communication_recipients cr
      join public.profiles pr on pr.id = cr.profile_id
      where cr.communication_id = p_comm
      union
      select a.email
      from public.communication_recipients cr
      join public.athletes a on a.id = cr.athlete_id
      where cr.communication_id = p_comm
      union
      select g.email
      from public.communication_recipients cr
      join public.guardians g on g.id = cr.guardian_id
      where cr.communication_id = p_comm
    ) e
    where e.email is not null and e.email <> '';
end;
$$;

revoke all on function public.communication_recipient_emails(uuid) from public;
grant execute on function public.communication_recipient_emails(uuid) to authenticated;
