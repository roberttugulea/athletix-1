-- ATHLETIX / Supabase PostgreSQL schema. No operational data is seeded.
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.member_status as enum ('invited','active','suspended','archived');
create type public.fee_status as enum ('due','overdue','unpaid','paid','exempt');
create type public.attendance_status as enum ('present','absent','late','justified');
create type public.invitation_status as enum ('pending','accepted','declined','withdrawn');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end $$;

create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) > 1),
 legal_name text, tax_code text unique, vat_number text unique, email text, phone text,
 timezone text not null default 'Europe/Rome', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade, first_name text not null, last_name text not null,
 email text, phone text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_settings (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 private_documents_bucket text not null default 'private-documents', fee_grace_days smallint not null default 5 check (fee_grace_days between 0 and 31),
 updated_at timestamptz not null default now()
);
create table public.permissions (id uuid primary key default gen_random_uuid(), key text not null unique check (key ~ '^[a-z]+(\\.[a-z_]+)+$'), description text not null);
create table public.roles (
 id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete cascade,
 name text not null, description text, is_system boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique nulls not distinct (organization_id,name)
);
create table public.organization_members (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 profile_id uuid not null references public.profiles(id) on delete cascade, status public.member_status not null default 'invited',
 joined_at timestamptz, archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,profile_id), check ((status = 'archived') = (archived_at is not null))
);
create table public.member_roles (organization_member_id uuid references public.organization_members(id) on delete cascade, role_id uuid references public.roles(id) on delete cascade, primary key(organization_member_id,role_id));
create table public.role_permissions (role_id uuid references public.roles(id) on delete cascade, permission_id uuid references public.permissions(id) on delete cascade, primary key(role_id,permission_id));

create table public.seasons (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, starts_on date not null, ends_on date not null, is_current boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,name), check(ends_on >= starts_on)
);
create unique index seasons_one_current on public.seasons(organization_id) where is_current;
create table public.facilities (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, address_line1 text, city text, province text, postal_code text, country_code char(2) not null default 'IT',
 timezone text not null default 'Europe/Rome', active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,name)
);
create table public.spaces (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 facility_id uuid not null references public.facilities(id) on delete restrict, name text not null, capacity integer check(capacity > 0),
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(facility_id,name)
);
create table public.activity_types (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, color text check(color ~ '^#[0-9A-Fa-f]{6}$'), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,name));

create table public.athletes (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 first_name text not null, last_name text not null, birth_date date not null check(birth_date <= current_date), tax_code text, email text, phone text,
 status text not null default 'active' check(status in ('active','inactive','archived')), joined_on date not null default current_date, left_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,tax_code), check(left_on is null or left_on >= joined_on)
);
create table public.guardians (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 profile_id uuid references public.profiles(id) on delete set null, first_name text not null, last_name text not null, tax_code text, email text, phone text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,tax_code)
);
create table public.athlete_guardians (
 athlete_id uuid not null references public.athletes(id) on delete cascade, guardian_id uuid not null references public.guardians(id) on delete cascade,
 relationship text not null, is_primary boolean not null default false, created_at timestamptz not null default now(), primary key(athlete_id,guardian_id)
);
create unique index one_primary_guardian on public.athlete_guardians(athlete_id) where is_primary;
create or replace function public.enforce_guardian_limit() returns trigger language plpgsql as $$ begin
 if (select count(*) from public.athlete_guardians where athlete_id=new.athlete_id) >= 2 then raise exception 'At most two guardians per athlete'; end if; return new; end $$;
create trigger guardian_limit before insert on public.athlete_guardians for each row execute function public.enforce_guardian_limit();
create table public.coaches (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 organization_member_id uuid references public.organization_members(id) on delete set null, first_name text not null, last_name text not null,
 tax_code text, email text, phone text, qualifications jsonb not null default '[]'::jsonb, status text not null default 'active',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,tax_code)
);

create table public.facility_members (facility_id uuid references public.facilities(id) on delete cascade, organization_member_id uuid references public.organization_members(id) on delete cascade, primary key(facility_id,organization_member_id));
create table public.athlete_facilities (athlete_id uuid references public.athletes(id) on delete cascade, facility_id uuid references public.facilities(id) on delete cascade, starts_on date not null default current_date, ends_on date, primary key(athlete_id,facility_id,starts_on), check(ends_on is null or ends_on >= starts_on));
create table public.coach_facilities (coach_id uuid references public.coaches(id) on delete cascade, facility_id uuid references public.facilities(id) on delete cascade, starts_on date not null default current_date, ends_on date, primary key(coach_id,facility_id,starts_on), check(ends_on is null or ends_on >= starts_on));
create table public.groups (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 facility_id uuid not null references public.facilities(id) on delete restrict, season_id uuid not null references public.seasons(id) on delete restrict,
 activity_type_id uuid references public.activity_types(id) on delete set null, name text not null, capacity integer check(capacity > 0), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(facility_id,season_id,name)
);
create table public.athlete_groups (athlete_id uuid references public.athletes(id) on delete cascade, group_id uuid references public.groups(id) on delete cascade, starts_on date not null default current_date, ends_on date, primary key(athlete_id,group_id,starts_on), check(ends_on is null or ends_on >= starts_on));
create table public.coach_groups (coach_id uuid references public.coaches(id) on delete cascade, group_id uuid references public.groups(id) on delete cascade, starts_on date not null default current_date, ends_on date, is_lead boolean not null default false, primary key(coach_id,group_id,starts_on), check(ends_on is null or ends_on >= starts_on));
create table public.group_schedule_slots (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 group_id uuid not null references public.groups(id) on delete cascade, space_id uuid not null references public.spaces(id) on delete restrict,
 weekday smallint not null check(weekday between 0 and 6), starts_at time not null, ends_at time not null, valid_from date not null, valid_to date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at > starts_at), check(valid_to is null or valid_to >= valid_from),
 exclude using gist (space_id with =, weekday with =, tsrange((valid_from + starts_at)::timestamp,(coalesce(valid_to,'infinity'::date)+ends_at)::timestamp,'[)') with &&)
);

create table public.private_documents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 uploaded_by uuid references public.profiles(id) on delete set null, athlete_id uuid references public.athletes(id) on delete restrict,
 guardian_id uuid references public.guardians(id) on delete restrict, coach_id uuid references public.coaches(id) on delete restrict,
 kind text not null check(kind in ('identity','medical','membership','consent','payment','other')),
 storage_bucket text not null default 'private-documents', object_path text not null check(object_path !~ '(^/|\\.\\.)'),
 original_filename text not null, content_type text not null, byte_size bigint not null check(byte_size > 0), expires_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(storage_bucket,object_path),
 check(num_nonnulls(athlete_id,guardian_id,coach_id) <= 1)
);
create table public.fita_memberships (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 athlete_id uuid not null references public.athletes(id) on delete restrict, membership_number text not null, federation text not null default 'FITA',
 starts_on date not null, ends_on date, status text not null check(status in ('active','expired','suspended','cancelled')),
 document_id uuid references public.private_documents(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,federation,membership_number,starts_on), check(ends_on is null or ends_on >= starts_on)
);
create table public.medical_certificates (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 athlete_id uuid not null references public.athletes(id) on delete restrict, certificate_type text not null, issued_on date not null, expires_on date not null,
 status text not null check(status in ('valid','expired','revoked')), document_id uuid references public.private_documents(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(expires_on >= issued_on)
);
create table public.weight_categories (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, min_kg numeric(5,2), max_kg numeric(5,2), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,name), check(min_kg is null or min_kg >= 0), check(max_kg is null or max_kg >= min_kg)
);
create table public.athlete_weight_categories (
 athlete_id uuid references public.athletes(id) on delete restrict, weight_category_id uuid references public.weight_categories(id) on delete restrict,
 valid_from date not null, valid_to date, measured_kg numeric(5,2) check(measured_kg > 0), primary key(athlete_id,valid_from), check(valid_to is null or valid_to >= valid_from)
);

create table public.fee_plans (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 season_id uuid not null references public.seasons(id) on delete restrict, facility_id uuid references public.facilities(id) on delete restrict,
 group_id uuid references public.groups(id) on delete restrict, name text not null, monthly_amount numeric(12,2) not null check(monthly_amount >= 0),
 due_day smallint not null check(due_day between 1 and 28), prorate_on_mid_month_join boolean not null default true,
 active_from date not null, active_to date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(active_to is null or active_to >= active_from)
);
create table public.discounts (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 athlete_id uuid references public.athletes(id) on delete cascade, group_id uuid references public.groups(id) on delete cascade, name text not null,
 percentage numeric(5,2) check(percentage between 0 and 100), fixed_amount numeric(12,2) check(fixed_amount >= 0),
 valid_from date not null, valid_to date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(num_nonnulls(percentage,fixed_amount)=1), check(valid_to is null or valid_to >= valid_from)
);
create table public.exemptions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 athlete_id uuid not null references public.athletes(id) on delete restrict, fee_plan_id uuid references public.fee_plans(id) on delete restrict,
 reason text not null, valid_from date not null, valid_to date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(valid_to is null or valid_to >= valid_from)
);
create table public.monthly_fees (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 athlete_id uuid not null references public.athletes(id) on delete restrict, fee_plan_id uuid not null references public.fee_plans(id) on delete restrict,
 billing_period date not null check(date_trunc('month',billing_period)::date=billing_period), due_on date not null, enrolled_on date not null,
 base_amount numeric(12,2) not null check(base_amount>=0), prorated_amount numeric(12,2) not null check(prorated_amount>=0), discount_amount numeric(12,2) not null default 0 check(discount_amount>=0),
 exemption_id uuid references public.exemptions(id) on delete restrict, status public.fee_status not null default 'due', paid_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(athlete_id,fee_plan_id,billing_period),
 check(prorated_amount<=base_amount), check(discount_amount<=prorated_amount), check((status='paid')=(paid_at is not null)), check((status='exempt')=(exemption_id is not null))
);
create or replace function public.calculate_prorated_fee(p_amount numeric,p_joined_on date,p_period date) returns numeric language sql immutable as $$
 select round(p_amount * greatest(0,((p_period + interval '1 month')::date - greatest(p_joined_on,p_period))) / extract(day from (p_period + interval '1 month - 1 day')),2) $$;
create or replace function public.refresh_monthly_fee_statuses(p_organization_id uuid default null) returns void language plpgsql security definer set search_path=public as $$
begin update public.monthly_fees set status=case when current_date>due_on+5 then 'unpaid'::public.fee_status else 'overdue'::public.fee_status end,updated_at=now() where status in ('due','overdue') and current_date>due_on and (p_organization_id is null or organization_id=p_organization_id); end $$;
create table public.payments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 athlete_id uuid not null references public.athletes(id) on delete restrict, monthly_fee_id uuid references public.monthly_fees(id) on delete restrict,
 amount numeric(12,2) not null check(amount>0), paid_on date not null, method text not null, external_reference text, status text not null default 'confirmed' check(status in ('pending','confirmed','void')),
 void_reason text, recorded_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), unique(organization_id,external_reference), check((status='void')=(void_reason is not null))
);
create table public.refunds (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, payment_id uuid not null references public.payments(id) on delete restrict, amount numeric(12,2) not null check(amount>0), refunded_on date not null, reason text not null, recorded_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now());
create table public.receipts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, payment_id uuid not null unique references public.payments(id) on delete restrict, receipt_number text not null, issued_on date not null, document_id uuid references public.private_documents(id) on delete set null, created_at timestamptz not null default now(), unique(organization_id,receipt_number));
create or replace function public.immutable_financial_history() returns trigger language plpgsql as $$ begin if tg_op='DELETE' then raise exception 'Financial history cannot be deleted'; end if; if tg_op='UPDATE' then raise exception 'Financial history is immutable; use voids or refunds'; end if; return coalesce(new,old); end $$;
create trigger payments_immutable before update or delete on public.payments for each row execute function public.immutable_financial_history();
create trigger refunds_immutable before update or delete on public.refunds for each row execute function public.immutable_financial_history();
create trigger receipts_immutable before update or delete on public.receipts for each row execute function public.immutable_financial_history();

create table public.training_sessions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, group_id uuid not null references public.groups(id) on delete restrict, space_id uuid references public.spaces(id) on delete restrict, starts_at timestamptz not null, ends_at timestamptz not null, status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')), notes text, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at));
create table public.attendances (training_session_id uuid references public.training_sessions(id) on delete cascade, athlete_id uuid references public.athletes(id) on delete restrict, status public.attendance_status not null, recorded_by uuid references public.profiles(id) on delete set null, recorded_at timestamptz not null default now(), notes text, primary key(training_session_id,athlete_id));
create table public.trial_lessons (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, athlete_id uuid references public.athletes(id) on delete set null, facility_id uuid not null references public.facilities(id) on delete restrict, group_id uuid references public.groups(id) on delete set null, scheduled_at timestamptz not null, status text not null default 'scheduled' check(status in ('scheduled','attended','cancelled','converted')), contact_name text not null, contact_email text, contact_phone text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.competitions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, season_id uuid references public.seasons(id) on delete set null, name text not null, organizer text, location text, starts_on date not null, ends_on date not null, registration_deadline date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_on>=starts_on), check(registration_deadline is null or registration_deadline<=starts_on));
create table public.competition_calls (id uuid primary key default gen_random_uuid(), competition_id uuid not null references public.competitions(id) on delete cascade, athlete_id uuid not null references public.athletes(id) on delete restrict, status public.invitation_status not null default 'pending', invited_at timestamptz not null default now(), responded_at timestamptz, notes text, unique(competition_id,athlete_id), check((status in ('accepted','declined'))=(responded_at is not null)));
create table public.competition_results (id uuid primary key default gen_random_uuid(), competition_id uuid not null references public.competitions(id) on delete cascade, athlete_id uuid not null references public.athletes(id) on delete restrict, discipline text, weight_category_id uuid references public.weight_categories(id) on delete set null, placement integer check(placement>0), score numeric(12,3), notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(competition_id,athlete_id,discipline));
create table public.events (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, facility_id uuid references public.facilities(id) on delete set null, space_id uuid references public.spaces(id) on delete set null, title text not null, description text, starts_at timestamptz not null, ends_at timestamptz not null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at));
create table public.event_attendees (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, athlete_id uuid references public.athletes(id) on delete cascade, organization_member_id uuid references public.organization_members(id) on delete cascade, response public.invitation_status not null default 'pending', responded_at timestamptz, created_at timestamptz not null default now(), check(num_nonnulls(athlete_id,organization_member_id)=1));
create unique index event_attendee_once on public.event_attendees(event_id,coalesce(athlete_id,organization_member_id));
create table public.communications (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, title text not null, body text not null, channel text not null default 'in_app' check(channel in ('in_app','email','push')), status text not null default 'draft' check(status in ('draft','scheduled','sent','cancelled')), scheduled_for timestamptz, sent_at timestamptz, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check((status='scheduled')=(scheduled_for is not null)),check((status='sent')=(sent_at is not null)));
create table public.communication_recipients (id uuid primary key default gen_random_uuid(), communication_id uuid not null references public.communications(id) on delete cascade, profile_id uuid references public.profiles(id) on delete cascade, athlete_id uuid references public.athletes(id) on delete cascade, guardian_id uuid references public.guardians(id) on delete cascade, delivery_status text not null default 'pending' check(delivery_status in ('pending','sent','failed','read')), delivered_at timestamptz, read_at timestamptz, check(num_nonnulls(profile_id,athlete_id,guardian_id)=1));
create unique index communication_recipient_once on public.communication_recipients(communication_id,coalesce(profile_id,athlete_id,guardian_id));
create table public.communication_attachments (communication_id uuid references public.communications(id) on delete cascade, document_id uuid references public.private_documents(id) on delete restrict, primary key(communication_id,document_id));
create table public.audit_logs (id bigint generated always as identity primary key, organization_id uuid references public.organizations(id) on delete set null, actor_id uuid references public.profiles(id) on delete set null, table_name text not null, record_id uuid, action text not null check(action in ('INSERT','UPDATE','DELETE')), old_data jsonb, new_data jsonb, created_at timestamptz not null default now());
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $$
declare payload jsonb:=coalesce(to_jsonb(new),to_jsonb(old)); begin
 insert into public.audit_logs(organization_id,actor_id,table_name,record_id,action,old_data,new_data)
 values(nullif(payload->>'organization_id','')::uuid,auth.uid(),tg_table_name,nullif(payload->>'id','')::uuid,tg_op,
 case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
 return coalesce(new,old); end $$;

create index athletes_org_idx on public.athletes(organization_id,status);
create index spaces_facility_idx on public.spaces(facility_id);
create index group_schedule_group_idx on public.group_schedule_slots(group_id,valid_from);
create index medical_expiry_idx on public.medical_certificates(athlete_id,expires_on);
create index memberships_history_idx on public.fita_memberships(athlete_id,starts_on desc);
create index fees_collection_idx on public.monthly_fees(organization_id,status,due_on);
create index payments_athlete_idx on public.payments(athlete_id,paid_on desc);
create index sessions_group_idx on public.training_sessions(group_id,starts_at);
create index competitions_org_idx on public.competitions(organization_id,starts_on);
create index audit_org_idx on public.audit_logs(organization_id,created_at desc);

do $$ declare t text; begin foreach t in array array['organizations','profiles','organization_settings','roles','seasons','facilities','spaces','activity_types','athletes','guardians','coaches','groups','group_schedule_slots','private_documents','fita_memberships','medical_certificates','weight_categories','fee_plans','discounts','exemptions','monthly_fees','training_sessions','trial_lessons','competitions','competition_results','events','communications'] loop execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',t||'_updated',t); end loop; end $$;
do $$ declare t text; begin foreach t in array array['organizations','organization_members','facilities','spaces','athletes','guardians','coaches','groups','fita_memberships','medical_certificates','private_documents','monthly_fees','training_sessions','competitions','events','communications'] loop execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row()',t||'_audit',t); end loop; end $$;

create or replace function public.is_organization_member(p_org uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.organization_members where organization_id=p_org and profile_id=auth.uid() and status='active') $$;
create or replace function public.has_organization_permission(p_org uuid,p_key text) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.organization_members om join public.member_roles mr on mr.organization_member_id=om.id join public.role_permissions rp on rp.role_id=mr.role_id join public.permissions p on p.id=rp.permission_id where om.organization_id=p_org and om.profile_id=auth.uid() and om.status='active' and p.key in (p_key,'organization.manage')) $$;

-- Default RLS: all tables are deny-by-default. Org tables offer member read/admin write.
do $$ declare t text; begin foreach t in array array['organizations','profiles','organization_settings','permissions','roles','organization_members','member_roles','role_permissions','seasons','facilities','spaces','activity_types','athletes','guardians','athlete_guardians','coaches','facility_members','athlete_facilities','coach_facilities','groups','athlete_groups','coach_groups','group_schedule_slots','private_documents','fita_memberships','medical_certificates','weight_categories','athlete_weight_categories','fee_plans','discounts','exemptions','monthly_fees','payments','refunds','receipts','training_sessions','attendances','trial_lessons','competitions','competition_calls','competition_results','events','event_attendees','communications','communication_recipients','communication_attachments','audit_logs'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
do $$ declare t text; begin foreach t in array array['organization_settings','roles','seasons','facilities','spaces','activity_types','athletes','guardians','coaches','groups','group_schedule_slots','private_documents','fita_memberships','medical_certificates','weight_categories','fee_plans','discounts','exemptions','monthly_fees','payments','refunds','receipts','training_sessions','trial_lessons','competitions','events','communications','audit_logs'] loop execute format('create policy %I on public.%I for select using (public.is_organization_member(organization_id))',t||'_read',t); execute format('create policy %I on public.%I for all using (public.has_organization_permission(organization_id,''organization.manage'')) with check (public.has_organization_permission(organization_id,''organization.manage''))',t||'_manage',t); end loop; end $$;
-- competition_results non ha organization_id: il tenant si risolve via competitions.
create policy competition_results_read on public.competition_results for select using (exists (select 1 from public.competitions c where c.id = competition_id and public.is_organization_member(c.organization_id)));
create policy competition_results_manage on public.competition_results for all using (exists (select 1 from public.competitions c where c.id = competition_id and public.has_organization_permission(c.organization_id,'organization.manage'))) with check (exists (select 1 from public.competitions c where c.id = competition_id and public.has_organization_permission(c.organization_id,'organization.manage')));
create policy organizations_read on public.organizations for select using(public.is_organization_member(id));
create policy organizations_manage on public.organizations for update using(public.has_organization_permission(id,'organization.manage')) with check(public.has_organization_permission(id,'organization.manage'));
create policy profiles_self on public.profiles for select using(id=auth.uid());
create policy profiles_update_self on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy memberships_read on public.organization_members for select using(public.is_organization_member(organization_id));
create policy memberships_manage on public.organization_members for all using(public.has_organization_permission(organization_id,'organization.manage')) with check(public.has_organization_permission(organization_id,'organization.manage'));
create policy permissions_read on public.permissions for select using(auth.role()='authenticated');

insert into public.permissions(key,description) values
 ('organization.manage','Manage organization and roles'),('facilities.manage','Manage facilities and spaces'),('people.manage','Manage athletes, guardians and coaches'),('groups.manage','Manage groups and schedules'),('finance.manage','Manage fees and payments'),('attendance.manage','Manage sessions and attendance'),('competitions.manage','Manage competitions'),('communications.manage','Manage communications'),('reports.read','Read reports'),('documents.manage','Manage private documents')
on conflict(key) do update set description=excluded.description;
