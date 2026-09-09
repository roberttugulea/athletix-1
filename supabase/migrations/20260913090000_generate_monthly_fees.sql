-- Fase 4.1 · Generazione delle quote mensili di un piano per un mese.
-- Per ogni atleta iscritto attivo al gruppo del piano crea una monthly_fees,
-- con importo prorata se il piano lo prevede e l'atleta si è iscritto a mese
-- iniziato. Esoneri attivi → quota a 0 con stato 'exempt'. Idempotente.

create or replace function public.generate_monthly_fees(
  p_fee_plan uuid,
  p_period date
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_month date := date_trunc('month', p_period)::date;
  v_count integer;
begin
  select organization_id into v_org from public.fee_plans where id = p_fee_plan;
  if v_org is null then
    raise exception 'Piano quota inesistente';
  end if;
  if not public.has_organization_permission(v_org, 'finance.manage') then
    raise exception 'Permesso negato' using errcode = '42501';
  end if;

  with plan as (
    select * from public.fee_plans where id = p_fee_plan
  ),
  targets as (
    select
      ag.athlete_id,
      greatest(ag.starts_on, v_month) as enrolled_on
    from plan p
    join public.athlete_groups ag
      on p.group_id is not null
     and ag.group_id = p.group_id
     and ag.starts_on <= (v_month + interval '1 month - 1 day')::date
     and (ag.ends_on is null or ag.ends_on >= v_month)
  ),
  computed as (
    select
      t.athlete_id,
      t.enrolled_on,
      p.monthly_amount as base_amount,
      case when p.prorate_on_mid_month_join
           then public.calculate_prorated_fee(p.monthly_amount, t.enrolled_on, v_month)
           else p.monthly_amount end as prorated_amount,
      (select e.id from public.exemptions e
        where e.athlete_id = t.athlete_id
          and (e.fee_plan_id is null or e.fee_plan_id = p_fee_plan)
          and e.valid_from <= v_month
          and (e.valid_to is null or e.valid_to >= v_month)
        limit 1) as exemption_id,
      (v_month + (p.due_day - 1)) as due_on
    from targets t
    cross join plan p
  )
  insert into public.monthly_fees
    (organization_id, athlete_id, fee_plan_id, billing_period, due_on, enrolled_on,
     base_amount, prorated_amount, discount_amount, exemption_id, status)
  select
    v_org, c.athlete_id, p_fee_plan, v_month, c.due_on, c.enrolled_on,
    c.base_amount,
    case when c.exemption_id is not null then 0 else c.prorated_amount end,
    0,
    c.exemption_id,
    case when c.exemption_id is not null then 'exempt'::public.fee_status
         else 'due'::public.fee_status end
  from computed c
  where not exists (
    select 1 from public.monthly_fees mf
    where mf.athlete_id = c.athlete_id
      and mf.fee_plan_id = p_fee_plan
      and mf.billing_period = v_month
  );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.generate_monthly_fees(uuid, date) from public;
grant execute on function public.generate_monthly_fees(uuid, date) to authenticated;
