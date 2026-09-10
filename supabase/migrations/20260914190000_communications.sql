-- Fase 7.1 · Comunicazioni: RLS destinatari, lettura per il destinatario,
-- RPC di invio che genera le notifiche in-app.

-- --- communication_recipients / _attachments: RLS (erano deny-all) --------
create policy communication_recipients_read on public.communication_recipients
  for select using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and public.has_organization_permission(c.organization_id, 'communications.manage')
    )
  );

create policy communication_recipients_manage on public.communication_recipients
  for all using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and public.has_organization_permission(c.organization_id, 'communications.manage')
    )
  ) with check (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and public.has_organization_permission(c.organization_id, 'communications.manage')
    )
  );

create policy communication_attachments_read on public.communication_attachments
  for select using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and public.has_organization_permission(c.organization_id, 'communications.manage')
    )
  );

create policy communication_attachments_manage on public.communication_attachments
  for all using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and public.has_organization_permission(c.organization_id, 'communications.manage')
    )
  ) with check (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and public.has_organization_permission(c.organization_id, 'communications.manage')
    )
  );

-- --- communications: leggibile anche dal destinatario -------------------
drop policy if exists communications_read on public.communications;
create policy communications_read on public.communications for select using (
  public.has_organization_permission(organization_id, 'communications.manage')
  or exists (
    select 1 from public.communication_recipients cr
    left join public.athletes a on a.id = cr.athlete_id
    left join public.guardians g on g.id = cr.guardian_id
    where cr.communication_id = communications.id
      and (
        cr.profile_id = auth.uid()
        or a.profile_id = auth.uid()
        or g.profile_id = auth.uid()
        or (cr.athlete_id is not null and public.is_guardian_of(cr.athlete_id))
      )
  )
);

-- --- RPC di invio -----------------------------------------------------
create or replace function public.send_communication(p_comm uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status text;
  v_title text;
  v_body text;
  v_count integer;
begin
  select organization_id, status, title, body
    into v_org, v_status, v_title, v_body
  from public.communications where id = p_comm;

  if v_org is null then
    raise exception 'Comunicazione inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'communications.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;
  if v_status not in ('draft', 'scheduled') then
    raise exception 'La comunicazione è già stata inviata o annullata';
  end if;

  -- destinatari risolti a un account (profile) con login
  with targets as (
    select distinct coalesce(cr.profile_id, a.profile_id, g.profile_id) as uid
    from public.communication_recipients cr
    left join public.athletes a on a.id = cr.athlete_id
    left join public.guardians g on g.id = cr.guardian_id
    where cr.communication_id = p_comm
  ),
  ins as (
    insert into public.notifications
      (organization_id, user_id, kind, title, body, entity_table, entity_id, url)
    select v_org, t.uid, 'communication', v_title, left(v_body, 300),
           'communications', p_comm, '/notifiche'
    from targets t
    where t.uid is not null
    on conflict do nothing
    returning 1
  )
  select count(*) into v_count from ins;

  update public.communication_recipients
     set delivery_status = 'sent', delivered_at = now()
   where communication_id = p_comm and delivery_status = 'pending';

  update public.communications
     set status = 'sent', sent_at = now(), scheduled_for = null
   where id = p_comm;

  return v_count;
end;
$$;

revoke all on function public.send_communication(uuid) from public;
grant execute on function public.send_communication(uuid) to authenticated;
