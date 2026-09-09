-- Fase 2.6 · Categorie generali (età / peso / livello / disciplina) al posto
-- di weight_categories (solo peso). Migra i dati mantenendo gli id e
-- riaggancia la FK di competition_results. Le tabelle sorgente sono vuote in
-- questo progetto: la migrazione dati è comunque corretta per riuso futuro.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('age', 'weight', 'level', 'discipline', 'other')),
  name text not null check (length(trim(name)) > 0),
  discipline_id uuid references public.disciplines(id) on delete set null,
  min_value numeric(8, 2),
  max_value numeric(8, 2),
  unit text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, kind, name),
  check (min_value is null or max_value is null or max_value >= min_value)
);
create index categories_org_idx on public.categories(organization_id, kind) where active;

create table public.athlete_categories (
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  valid_from date not null default current_date,
  valid_to date,
  measured_value numeric(10, 2),
  primary key (athlete_id, category_id, valid_from),
  check (valid_to is null or valid_to >= valid_from)
);
create index athlete_categories_cat_idx on public.athlete_categories(category_id);

-- --- Migrazione dati -------------------------------------------------------
insert into public.categories
  (id, organization_id, kind, name, min_value, max_value, unit, created_at, updated_at)
select id, organization_id, 'weight', name, min_kg, max_kg, 'kg', created_at, updated_at
from public.weight_categories;

insert into public.athlete_categories
  (athlete_id, category_id, valid_from, valid_to, measured_value)
select athlete_id, weight_category_id, valid_from, valid_to, measured_kg
from public.athlete_weight_categories
where weight_category_id is not null;

-- --- Riaggancio di competition_results -----------------------------------
alter table public.competition_results
  drop constraint if exists competition_results_weight_category_id_fkey;
alter table public.competition_results
  rename column weight_category_id to category_id;
alter table public.competition_results
  add constraint competition_results_category_id_fkey
  foreign key (category_id) references public.categories(id) on delete set null;

-- --- Rimozione tabelle vecchie -----------------------------------------
drop table public.athlete_weight_categories;
drop table public.weight_categories;

-- --- Trigger + RLS -----------------------------------------------------
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();
create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function public.audit_row();

alter table public.categories enable row level security;
alter table public.athlete_categories enable row level security;

create policy categories_read on public.categories for select
  using (public.is_organization_member(organization_id));
create policy categories_manage on public.categories for all
  using (public.has_organization_permission(organization_id, 'people.manage'))
  with check (public.has_organization_permission(organization_id, 'people.manage'));

create policy athlete_categories_read on public.athlete_categories for select
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
create policy athlete_categories_manage on public.athlete_categories for all
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
