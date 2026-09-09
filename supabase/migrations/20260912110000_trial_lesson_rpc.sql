-- Fase 3.4 · Prove gratuite. RPC per creare una prova convertendo la
-- data/ora locale (Europe/Rome) in timestamptz, come per le sessioni.

create or replace function public.add_trial_lesson(
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_facility uuid,
  p_group uuid,
  p_local_datetime text,
  p_notes text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  select organization_id into v_org from public.facilities where id = p_facility;
  if v_org is null then
    raise exception 'Struttura inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'people.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_contact_name, ''))) = 0 then
    raise exception 'Nome contatto obbligatorio';
  end if;

  insert into public.trial_lessons
    (organization_id, facility_id, group_id, scheduled_at, status,
     contact_name, contact_email, contact_phone, notes)
  values (
    v_org,
    p_facility,
    p_group,
    (p_local_datetime::timestamp at time zone
      (select timezone from public.organizations where id = v_org)),
    'scheduled',
    trim(p_contact_name),
    nullif(trim(coalesce(p_contact_email, '')), ''),
    nullif(trim(coalesce(p_contact_phone, '')), ''),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.add_trial_lesson(text, text, text, uuid, uuid, text, text) from public;
grant execute on function public.add_trial_lesson(text, text, text, uuid, uuid, text, text) to authenticated;
