-- Fase 1 · Collegamento atleta ↔ account utente.
-- Abilita l'area atleta/tutore: un `athletes` può essere associato a un
-- `profiles` (auth.users). Additiva.

alter table public.athletes
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

create unique index if not exists athletes_profile_unique
  on public.athletes(profile_id) where profile_id is not null;

create index if not exists athletes_profile_idx on public.athletes(profile_id);

-- ---------------------------------------------------------------------------
-- Funzioni di scope per le policy RLS (atleta / tutore)
-- ---------------------------------------------------------------------------
create or replace function public.is_athlete_self(p_athlete uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.athletes a
    where a.id = p_athlete and a.profile_id = auth.uid()
  );
$$;

create or replace function public.is_guardian_of(p_athlete uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.athlete_guardians ag
    join public.guardians g on g.id = ag.guardian_id
    where ag.athlete_id = p_athlete
      and g.profile_id = auth.uid()
  );
$$;
