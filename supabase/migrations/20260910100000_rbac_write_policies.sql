-- Fase 1 · Policy di scrittura RLS per permesso.
--
-- Nello scaffold ogni policy `<t>_manage` verificava solo `organization.manage`,
-- quindi la sola Amministrazione poteva scrivere. Qui si sostituisce con il
-- permesso granulare corretto per ciascuna area. `has_organization_permission`
-- tratta comunque `organization.manage` come super-permesso.

do $$
declare
  m record;
begin
  for m in
    select tbl, perm from (values
      ('organization_settings', 'organization.manage'),
      ('seasons',               'facilities.manage'),
      ('facilities',            'facilities.manage'),
      ('spaces',                'facilities.manage'),
      ('activity_types',        'facilities.manage'),
      ('athletes',              'people.manage'),
      ('guardians',             'people.manage'),
      ('coaches',               'people.manage'),
      ('groups',                'groups.manage'),
      ('group_schedule_slots',  'groups.manage'),
      ('private_documents',     'documents.manage'),
      ('fita_memberships',      'people.manage'),
      ('medical_certificates',  'documents.manage'),
      ('weight_categories',     'people.manage'),
      ('fee_plans',             'finance.manage'),
      ('discounts',             'finance.manage'),
      ('exemptions',            'finance.manage'),
      ('monthly_fees',          'finance.manage'),
      ('payments',              'finance.manage'),
      ('refunds',               'finance.manage'),
      ('receipts',              'finance.manage'),
      ('training_sessions',     'attendance.manage'),
      ('trial_lessons',         'people.manage'),
      ('competitions',          'competitions.manage'),
      ('competition_results',   'competitions.manage'),
      ('events',                'communications.manage'),
      ('communications',        'communications.manage')
    ) as t(tbl, perm)
  loop
    execute format('drop policy if exists %I on public.%I', m.tbl || '_manage', m.tbl);
    execute format(
      'create policy %I on public.%I for all '
      || 'using (public.has_organization_permission(organization_id, %L)) '
      || 'with check (public.has_organization_permission(organization_id, %L))',
      m.tbl || '_manage', m.tbl, m.perm, m.perm
    );
  end loop;
end $$;
