-- Fase 6.3 · Schede di allenamento.
-- Un coach (per i propri atleti) o la segreteria assegnano a un atleta una
-- scheda con più esercizi. L'atleta / il tutore la vedono in sola lettura.

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  coach_id uuid references public.coaches(id) on delete set null,
  title text not null,
  starts_on date not null,
  ends_on date,
  notes text,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create index workout_plans_athlete_idx on public.workout_plans (athlete_id, starts_on desc);

create table public.workout_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_index smallint not null default 1 check (day_index between 1 and 14),
  exercise text not null,
  sets smallint check (sets is null or sets between 1 and 99),
  reps text,
  load text,
  rest_seconds smallint check (rest_seconds is null or rest_seconds between 0 and 3600),
  notes text,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workout_plan_items_plan_idx on public.workout_plan_items (plan_id, day_index, sort);

-- --- Trigger --------------------------------------------------------------
create trigger workout_plans_updated before update on public.workout_plans
  for each row execute function public.set_updated_at();
create trigger workout_plans_audit after insert or update or delete on public.workout_plans
  for each row execute function public.audit_row();
create trigger workout_plan_items_updated before update on public.workout_plan_items
  for each row execute function public.set_updated_at();

-- --- RLS ----------------------------------------------------------------
alter table public.workout_plans enable row level security;
alter table public.workout_plan_items enable row level security;

create policy workout_plans_read on public.workout_plans for select using (
  public.has_organization_permission(organization_id, 'people.manage')
  or public.is_coach_of_athlete(athlete_id)
  or public.is_athlete_self(athlete_id)
  or public.is_guardian_of(athlete_id)
);

create policy workout_plans_manage on public.workout_plans for all using (
  public.has_organization_permission(organization_id, 'people.manage')
  or public.is_coach_of_athlete(athlete_id)
) with check (
  public.has_organization_permission(organization_id, 'people.manage')
  or public.is_coach_of_athlete(athlete_id)
);

create policy workout_plan_items_read on public.workout_plan_items for select using (
  exists (
    select 1 from public.workout_plans p
    where p.id = plan_id
      and (
        public.has_organization_permission(p.organization_id, 'people.manage')
        or public.is_coach_of_athlete(p.athlete_id)
        or public.is_athlete_self(p.athlete_id)
        or public.is_guardian_of(p.athlete_id)
      )
  )
);

create policy workout_plan_items_manage on public.workout_plan_items for all using (
  exists (
    select 1 from public.workout_plans p
    where p.id = plan_id
      and (
        public.has_organization_permission(p.organization_id, 'people.manage')
        or public.is_coach_of_athlete(p.athlete_id)
      )
  )
) with check (
  exists (
    select 1 from public.workout_plans p
    where p.id = plan_id
      and (
        public.has_organization_permission(p.organization_id, 'people.manage')
        or public.is_coach_of_athlete(p.athlete_id)
      )
  )
);
