-- Fase 3.3 · Policy RLS per attendances (Fase 1 aveva RLS ON senza policy →
-- deny-all). Tenant e permessi risolti via training_sessions → groups.
-- Chi gestisce le presenze o è coach del gruppo può leggere e scrivere;
-- l'atleta vede le proprie.

create policy attendances_read on public.attendances for select
  using (
    public.is_athlete_self(athlete_id)
    or exists (
      select 1 from public.training_sessions ts
      where ts.id = training_session_id
        and (
          public.has_organization_permission(ts.organization_id, 'attendance.manage')
          or public.is_coach_of_group(ts.group_id)
        )
    )
  );

create policy attendances_manage on public.attendances for all
  using (
    exists (
      select 1 from public.training_sessions ts
      where ts.id = training_session_id
        and (
          public.has_organization_permission(ts.organization_id, 'attendance.manage')
          or public.is_coach_of_group(ts.group_id)
        )
    )
  )
  with check (
    exists (
      select 1 from public.training_sessions ts
      where ts.id = training_session_id
        and (
          public.has_organization_permission(ts.organization_id, 'attendance.manage')
          or public.is_coach_of_group(ts.group_id)
        )
    )
  );
