-- Fase 4.2 · Pacchetti a durata (es. 3 e 9 mesi). Tabelle nuove.

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  duration_months smallint not null check (duration_months between 1 and 36),
  price numeric(12, 2) not null check (price >= 0),
  discipline_id uuid references public.disciplines(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  starts_on date not null,
  ends_on date not null,
  price numeric(12, 2) not null check (price >= 0),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index subscriptions_athlete_idx on public.subscriptions(athlete_id, starts_on desc);

create trigger subscription_plans_updated before update on public.subscription_plans
  for each row execute function public.set_updated_at();
create trigger subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger subscription_plans_audit after insert or update or delete on public.subscription_plans
  for each row execute function public.audit_row();
create trigger subscriptions_audit after insert or update or delete on public.subscriptions
  for each row execute function public.audit_row();

alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;

create policy subscription_plans_read on public.subscription_plans for select
  using (public.is_organization_member(organization_id));
create policy subscription_plans_manage on public.subscription_plans for all
  using (public.has_organization_permission(organization_id, 'finance.manage'))
  with check (public.has_organization_permission(organization_id, 'finance.manage'));

create policy subscriptions_read on public.subscriptions for select using (
  public.has_organization_permission(organization_id, 'finance.manage')
  or public.is_athlete_self(athlete_id)
  or public.is_guardian_of(athlete_id)
);
create policy subscriptions_manage on public.subscriptions for all
  using (public.has_organization_permission(organization_id, 'finance.manage'))
  with check (public.has_organization_permission(organization_id, 'finance.manage'));

-- Attivazione: calcola ends_on = starts_on + durata - 1 giorno e congela il prezzo.
create or replace function public.create_subscription(
  p_athlete uuid,
  p_plan uuid,
  p_starts_on date
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_months smallint;
  v_price numeric(12, 2);
  v_athlete_org uuid;
  v_id uuid;
begin
  select organization_id, duration_months, price
    into v_org, v_months, v_price
  from public.subscription_plans where id = p_plan;
  if v_org is null then
    raise exception 'Piano pacchetto inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'finance.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;
  select organization_id into v_athlete_org from public.athletes where id = p_athlete;
  if v_athlete_org is distinct from v_org then
    raise exception 'Atleta non appartenente all''organizzazione';
  end if;

  insert into public.subscriptions
    (organization_id, athlete_id, plan_id, starts_on, ends_on, price, status)
  values (
    v_org, p_athlete, p_plan, p_starts_on,
    (p_starts_on + (v_months || ' months')::interval - interval '1 day')::date,
    v_price, 'active'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_subscription(uuid, uuid, date) from public;
grant execute on function public.create_subscription(uuid, uuid, date) to authenticated;
