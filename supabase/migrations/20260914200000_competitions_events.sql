-- Fase 7.3 · Gare (convocazioni, risultati) ed eventi.
-- RLS per `competition_calls` e `event_attendees` (erano deny-all) + allineo
-- la scrittura degli eventi al permesso `competitions.manage`.

-- --- competition_calls ------------------------------------------------
create policy competition_calls_read on public.competition_calls for select using (
  exists (
    select 1 from public.competitions c
    where c.id = competition_id
      and (
        public.is_organization_member(c.organization_id)
        or public.is_athlete_self(athlete_id)
        or public.is_guardian_of(athlete_id)
      )
  )
);

create policy competition_calls_manage on public.competition_calls for all using (
  exists (
    select 1 from public.competitions c
    where c.id = competition_id
      and public.has_organization_permission(c.organization_id, 'competitions.manage')
  )
) with check (
  exists (
    select 1 from public.competitions c
    where c.id = competition_id
      and public.has_organization_permission(c.organization_id, 'competitions.manage')
  )
);

-- --- event_attendees -----------------------------------------------
create policy event_attendees_read on public.event_attendees for select using (
  exists (
    select 1 from public.events e
    where e.id = event_id
      and (
        public.is_organization_member(e.organization_id)
        or (athlete_id is not null and (
          public.is_athlete_self(athlete_id) or public.is_guardian_of(athlete_id)
        ))
      )
  )
);

create policy event_attendees_manage on public.event_attendees for all using (
  exists (
    select 1 from public.events e
    where e.id = event_id
      and public.has_organization_permission(e.organization_id, 'competitions.manage')
  )
) with check (
  exists (
    select 1 from public.events e
    where e.id = event_id
      and public.has_organization_permission(e.organization_id, 'competitions.manage')
  )
);

-- --- events: scrittura a `competitions.manage` (era communications.manage) -
drop policy if exists events_manage on public.events;
create policy events_manage on public.events for all
  using (public.has_organization_permission(organization_id, 'competitions.manage'))
  with check (public.has_organization_permission(organization_id, 'competitions.manage'));
