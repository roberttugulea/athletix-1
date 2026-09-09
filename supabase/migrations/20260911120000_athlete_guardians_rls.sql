-- Fase 2.3 · Policy RLS per athlete_guardians (Fase 1 aveva abilitato RLS
-- senza policy → deny-all). Il tenant si risolve via athletes.

create policy athlete_guardians_read on public.athlete_guardians for select
  using (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_id
        and (
          public.has_organization_permission(a.organization_id, 'people.manage')
          or public.is_athlete_self(a.id)
          or public.is_guardian_of(a.id)
          or public.is_coach_of_athlete(a.id)
        )
    )
  );

create policy athlete_guardians_manage on public.athlete_guardians for all
  using (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_id
        and public.has_organization_permission(a.organization_id, 'people.manage')
    )
  )
  with check (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_id
        and public.has_organization_permission(a.organization_id, 'people.manage')
    )
  );
