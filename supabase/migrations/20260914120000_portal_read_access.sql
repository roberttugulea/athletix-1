-- Fase 6.1 · Letture per l'area personale (atleta / tutore).
--
-- Gli atleti e i tutori NON sono `organization_members`: le policy `_read`
-- basate su `is_organization_member(...)` li escludono. Qui si estendono le
-- letture strettamente necessarie all'area personale a chi è l'atleta stesso
-- o un suo tutore, limitatamente ai gruppi in cui l'atleta è iscritto.

-- organizations: nome della società visibile a chi ne ha un atleta collegato
drop policy if exists organizations_read on public.organizations;
create policy organizations_read on public.organizations for select using (
  public.is_organization_member(id)
  or exists (
    select 1 from public.athletes a
    where a.organization_id = organizations.id
      and (public.is_athlete_self(a.id) or public.is_guardian_of(a.id))
  )
);

-- groups: visibili all'atleta/tutore se l'atleta vi è iscritto
drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select using (
  public.is_organization_member(organization_id)
  or exists (
    select 1
    from public.athlete_groups ag
    join public.athletes a on a.id = ag.athlete_id
    where ag.group_id = groups.id
      and (public.is_athlete_self(a.id) or public.is_guardian_of(a.id))
  )
);

-- training_sessions: idem, sulle sessioni dei gruppi dell'atleta
drop policy if exists training_sessions_read on public.training_sessions;
create policy training_sessions_read on public.training_sessions for select using (
  public.is_organization_member(organization_id)
  or exists (
    select 1
    from public.athlete_groups ag
    join public.athletes a on a.id = ag.athlete_id
    where ag.group_id = training_sessions.group_id
      and (public.is_athlete_self(a.id) or public.is_guardian_of(a.id))
  )
);

-- attendances: il tutore vede quelle del minore (prima solo l'atleta stesso)
drop policy if exists attendances_read on public.attendances;
create policy attendances_read on public.attendances for select using (
  public.is_athlete_self(athlete_id)
  or public.is_guardian_of(athlete_id)
  or exists (
    select 1 from public.training_sessions ts
    where ts.id = training_session_id
      and (
        public.has_organization_permission(ts.organization_id, 'attendance.manage')
        or public.is_coach_of_group(ts.group_id)
      )
  )
);
