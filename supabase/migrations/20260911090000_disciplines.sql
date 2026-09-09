-- Fase 2.1 · Discipline sportive (centro polisportivo).
-- Tabella nuova + collegamento opzionale da groups.

create table public.disciplines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index disciplines_org_idx on public.disciplines(organization_id) where active;

create trigger disciplines_updated before update on public.disciplines
  for each row execute function public.set_updated_at();
create trigger disciplines_audit after insert or update or delete on public.disciplines
  for each row execute function public.audit_row();

alter table public.disciplines enable row level security;

create policy disciplines_read on public.disciplines for select
  using (public.is_organization_member(organization_id));
create policy disciplines_manage on public.disciplines for all
  using (public.has_organization_permission(organization_id, 'facilities.manage'))
  with check (public.has_organization_permission(organization_id, 'facilities.manage'));

alter table public.groups
  add column if not exists discipline_id uuid references public.disciplines(id) on delete set null;
