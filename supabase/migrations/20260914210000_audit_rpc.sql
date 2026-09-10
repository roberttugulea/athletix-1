-- Fase 7.7 · Lettura del log di audit per l'amministratore.
-- SECURITY DEFINER: `audit_logs.actor_id` punta a `profiles`, leggibile solo
-- dal proprietario (`profiles_self`).

create or replace function public.list_audit_logs(
  p_org uuid,
  p_limit integer default 100
)
returns table (
  id bigint,
  created_at timestamptz,
  actor text,
  table_name text,
  action text,
  record_id uuid,
  summary text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    al.id,
    al.created_at,
    coalesce(nullif(trim(pr.first_name || ' ' || pr.last_name), ''), '—') as actor,
    al.table_name,
    al.action,
    al.record_id,
    case
      when al.action = 'UPDATE' then (
        select string_agg(k, ', ' order by k)
        from jsonb_object_keys(coalesce(al.new_data, '{}'::jsonb)) as k
        where (al.new_data ->> k) is distinct from (al.old_data ->> k)
          and k not in ('updated_at')
      )
      else null
    end as summary
  from public.audit_logs al
  left join public.profiles pr on pr.id = al.actor_id
  where al.organization_id = p_org
    and public.has_organization_permission(p_org, 'organization.manage')
  order by al.id desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.list_audit_logs(uuid, integer) from public;
grant execute on function public.list_audit_logs(uuid, integer) to authenticated;
