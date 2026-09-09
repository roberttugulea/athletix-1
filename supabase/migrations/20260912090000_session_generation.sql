-- Fase 3.1 · Generazione delle sessioni di allenamento dalle fasce orarie
-- ricorrenti di un gruppo, in un intervallo di date. DST-aware via AT TIME ZONE.

create or replace function public.generate_sessions_for_group(
  p_group uuid,
  p_from date,
  p_to date
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_count integer;
begin
  select organization_id into v_org from public.groups where id = p_group;
  if v_org is null then
    raise exception 'Gruppo inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'attendance.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;
  if p_to < p_from then
    raise exception 'Intervallo di date non valido';
  end if;
  if p_to - p_from > 400 then
    raise exception 'Intervallo troppo ampio (max ~13 mesi)';
  end if;

  with slot_dates as (
    select
      s.space_id,
      ((d::timestamp + s.starts_at) at time zone o.timezone) as starts_at,
      ((d::timestamp + s.ends_at) at time zone o.timezone) as ends_at
    from public.group_schedule_slots s
    join public.organizations o on o.id = v_org
    cross join generate_series(p_from, p_to, interval '1 day') as gs(d)
    where s.group_id = p_group
      and extract(dow from gs.d) = s.weekday
      and gs.d >= s.valid_from
      and (s.valid_to is null or gs.d <= s.valid_to)
  )
  insert into public.training_sessions
    (organization_id, group_id, space_id, starts_at, ends_at, status, created_by)
  select v_org, p_group, sd.space_id, sd.starts_at, sd.ends_at, 'scheduled', auth.uid()
  from slot_dates sd
  where not exists (
    select 1 from public.training_sessions ts
    where ts.group_id = p_group and ts.starts_at = sd.starts_at
  );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.generate_sessions_for_group(uuid, date, date) from public;
grant execute on function public.generate_sessions_for_group(uuid, date, date) to authenticated;
