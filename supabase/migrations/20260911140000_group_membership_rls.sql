-- Fase 2.5 · Policy RLS per athlete_groups e coach_groups (Fase 1 aveva
-- abilitato RLS senza policy → deny-all). Tenant risolto via athletes / coaches.

create policy athlete_groups_read on public.athlete_groups for select
  using (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_id
        and (
          public.has_organization_permission(a.organization_id, 'people.manage')
          or public.has_organization_permission(a.organization_id, 'groups.manage')
          or public.is_athlete_self(a.id)
          or public.is_guardian_of(a.id)
          or public.is_coach_of_group(group_id)
        )
    )
  );

create policy athlete_groups_manage on public.athlete_groups for all
  using (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_id
        and public.has_organization_permission(a.organization_id, 'groups.manage')
    )
  )
  with check (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_id
        and public.has_organization_permission(a.organization_id, 'groups.manage')
    )
  );

create policy coach_groups_read on public.coach_groups for select
  using (
    exists (
      select 1 from public.coaches c
      where c.id = coach_id
        and public.is_organization_member(c.organization_id)
    )
  );

create policy coach_groups_manage on public.coach_groups for all
  using (
    exists (
      select 1 from public.coaches c
      where c.id = coach_id
        and public.has_organization_permission(c.organization_id, 'groups.manage')
    )
  )
  with check (
    exists (
      select 1 from public.coaches c
      where c.id = coach_id
        and public.has_organization_permission(c.organization_id, 'groups.manage')
    )
  );
