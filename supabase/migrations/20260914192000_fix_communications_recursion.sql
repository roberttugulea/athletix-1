-- Fase 7.1 · Fix ricorsione RLS: `communications_read` interrogava
-- `communication_recipients` la cui policy interroga `communications` →
-- 42P17. Si sposta il controllo "sono un destinatario" in una funzione
-- SECURITY DEFINER (niente RLS al suo interno).

create or replace function public.is_communication_recipient(p_comm uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communication_recipients cr
    left join public.athletes a on a.id = cr.athlete_id
    left join public.guardians g on g.id = cr.guardian_id
    where cr.communication_id = p_comm
      and (
        cr.profile_id = auth.uid()
        or a.profile_id = auth.uid()
        or g.profile_id = auth.uid()
        or (cr.athlete_id is not null and public.is_guardian_of(cr.athlete_id))
      )
  );
$$;

drop policy if exists communications_read on public.communications;
create policy communications_read on public.communications for select using (
  public.has_organization_permission(organization_id, 'communications.manage')
  or public.is_communication_recipient(id)
);
