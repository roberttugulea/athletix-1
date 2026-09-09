-- Fase 4.4/4.5/4.6 · Pagamenti agganciabili a quota o pacchetto, rimborsi,
-- ricevute con numero progressivo annuo per organizzazione.
-- payments/refunds/receipts sono immutabili (trigger esistente): niente
-- update/delete; l'annullamento è un rimborso.

alter table public.payments
  add column if not exists subscription_id uuid references public.subscriptions(id) on delete restrict;
alter table public.payments
  drop constraint if exists payments_one_payable;
alter table public.payments
  add constraint payments_one_payable
  check (num_nonnulls(monthly_fee_id, subscription_id) <= 1);

create table public.receipt_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  year integer not null,
  last_number integer not null default 0,
  primary key (organization_id, year)
);
alter table public.receipt_counters enable row level security;
-- Nessuna policy: si tocca solo tramite issue_receipt (SECURITY DEFINER).

-- ------------------------------------------------------ Registra pagamento
create or replace function public.record_payment(
  p_athlete uuid,
  p_amount numeric,
  p_paid_on date,
  p_method text,
  p_monthly_fee uuid,
  p_subscription uuid,
  p_external_ref text,
  p_issue_receipt boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_payment uuid;
  v_year integer := extract(year from p_paid_on)::int;
  v_num integer;
begin
  select organization_id into v_org from public.athletes where id = p_athlete;
  if v_org is null then
    raise exception 'Atleta inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'finance.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Importo non valido';
  end if;
  if num_nonnulls(p_monthly_fee, p_subscription) > 1 then
    raise exception 'Un pagamento può essere collegato a una sola voce';
  end if;

  insert into public.payments
    (organization_id, athlete_id, monthly_fee_id, subscription_id, amount,
     paid_on, method, external_reference, status, recorded_by)
  values (
    v_org, p_athlete, p_monthly_fee, p_subscription, p_amount,
    p_paid_on, coalesce(nullif(trim(p_method), ''), 'contanti'),
    nullif(trim(coalesce(p_external_ref, '')), ''), 'confirmed', auth.uid()
  )
  returning id into v_payment;

  if p_monthly_fee is not null then
    update public.monthly_fees
      set status = 'paid', paid_at = now()
      where id = p_monthly_fee and organization_id = v_org and status <> 'paid';
  end if;

  if coalesce(p_issue_receipt, false) then
    insert into public.receipt_counters (organization_id, year, last_number)
    values (v_org, v_year, 1)
    on conflict (organization_id, year)
      do update set last_number = public.receipt_counters.last_number + 1
    returning last_number into v_num;

    insert into public.receipts
      (organization_id, payment_id, receipt_number, issued_on)
    values (v_org, v_payment, v_num || '/' || v_year, p_paid_on);
  end if;

  return v_payment;
end;
$$;

revoke all on function public.record_payment(uuid, numeric, date, text, uuid, uuid, text, boolean) from public;
grant execute on function public.record_payment(uuid, numeric, date, text, uuid, uuid, text, boolean) to authenticated;

-- ------------------------------------------------------ Emetti ricevuta
create or replace function public.issue_receipt(p_payment uuid) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_paid_on date;
  v_year integer;
  v_num integer;
  v_number text;
begin
  select organization_id, paid_on into v_org, v_paid_on
  from public.payments where id = p_payment;
  if v_org is null then
    raise exception 'Pagamento inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'finance.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;
  if exists (select 1 from public.receipts where payment_id = p_payment) then
    raise exception 'Ricevuta già emessa';
  end if;

  v_year := extract(year from v_paid_on)::int;
  insert into public.receipt_counters (organization_id, year, last_number)
  values (v_org, v_year, 1)
  on conflict (organization_id, year)
    do update set last_number = public.receipt_counters.last_number + 1
  returning last_number into v_num;

  v_number := v_num || '/' || v_year;
  insert into public.receipts (organization_id, payment_id, receipt_number, issued_on)
  values (v_org, p_payment, v_number, v_paid_on);

  return v_number;
end;
$$;

revoke all on function public.issue_receipt(uuid) from public;
grant execute on function public.issue_receipt(uuid) to authenticated;

-- ------------------------------------------------------ Registra rimborso
create or replace function public.record_refund(
  p_payment uuid,
  p_amount numeric,
  p_refunded_on date,
  p_reason text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_paid numeric;
  v_refunded numeric;
  v_id uuid;
begin
  select organization_id, amount into v_org, v_paid
  from public.payments where id = p_payment;
  if v_org is null then
    raise exception 'Pagamento inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'finance.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Importo non valido';
  end if;

  select coalesce(sum(amount), 0) into v_refunded
  from public.refunds where payment_id = p_payment;

  if p_amount > (v_paid - v_refunded) then
    raise exception 'Importo superiore al rimborsabile residuo (%).', (v_paid - v_refunded);
  end if;

  insert into public.refunds
    (organization_id, payment_id, amount, refunded_on, reason, recorded_by)
  values (
    v_org, p_payment, p_amount, p_refunded_on,
    coalesce(nullif(trim(p_reason), ''), 'Rimborso'), auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_refund(uuid, numeric, date, text) from public;
grant execute on function public.record_refund(uuid, numeric, date, text) to authenticated;
