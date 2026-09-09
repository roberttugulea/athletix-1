-- Fase 1 · Restringimento delle letture RLS sulle tabelle sensibili.
--
-- Nello scaffold ogni `<t>_read` permetteva la lettura a QUALSIASI membro
-- attivo: un Coach vedeva tutti i pagamenti, un Atleta (non membro) non vedeva
-- nulla. Qui le tabelle sensibili diventano leggibili solo da chi ha il
-- permesso o è l'interessato (atleta stesso / tutore / coach del gruppo).
--
-- Le tabelle di configurazione (seasons, facilities, spaces, activity_types,
-- groups, group_schedule_slots, coaches, weight_categories, training_sessions,
-- competitions, competition_results, events) mantengono la lettura a tutti i
-- membri attivi: non contengono dati personali sensibili.

-- --- Finanziario ----------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['fee_plans', 'discounts', 'exemptions'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format(
      'create policy %I on public.%I for select using '
      || '(public.has_organization_permission(organization_id, ''finance.manage''))',
      t || '_read', t
    );
  end loop;
end $$;

drop policy if exists monthly_fees_read on public.monthly_fees;
create policy monthly_fees_read on public.monthly_fees for select using (
  public.has_organization_permission(organization_id, 'finance.manage')
  or public.is_athlete_self(athlete_id)
  or public.is_guardian_of(athlete_id)
);

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select using (
  public.has_organization_permission(organization_id, 'finance.manage')
  or public.is_athlete_self(athlete_id)
  or public.is_guardian_of(athlete_id)
);

drop policy if exists refunds_read on public.refunds;
create policy refunds_read on public.refunds for select using (
  public.has_organization_permission(organization_id, 'finance.manage')
  or exists (
    select 1 from public.payments p
    where p.id = payment_id
      and (public.is_athlete_self(p.athlete_id) or public.is_guardian_of(p.athlete_id))
  )
);

drop policy if exists receipts_read on public.receipts;
create policy receipts_read on public.receipts for select using (
  public.has_organization_permission(organization_id, 'finance.manage')
  or exists (
    select 1 from public.payments p
    where p.id = payment_id
      and (public.is_athlete_self(p.athlete_id) or public.is_guardian_of(p.athlete_id))
  )
);

-- --- Persone ------------------------------------------------------------
drop policy if exists athletes_read on public.athletes;
create policy athletes_read on public.athletes for select using (
  public.has_organization_permission(organization_id, 'people.manage')
  or public.is_athlete_self(id)
  or public.is_guardian_of(id)
  or public.is_coach_of_athlete(id)
);

drop policy if exists guardians_read on public.guardians;
create policy guardians_read on public.guardians for select using (
  public.has_organization_permission(organization_id, 'people.manage')
  or profile_id = auth.uid()
);

drop policy if exists trial_lessons_read on public.trial_lessons;
create policy trial_lessons_read on public.trial_lessons for select using (
  public.has_organization_permission(organization_id, 'people.manage')
);

-- --- Documenti / certificati / tesseramenti ---------------------------
drop policy if exists private_documents_read on public.private_documents;
create policy private_documents_read on public.private_documents for select using (
  public.has_organization_permission(organization_id, 'documents.manage')
  or (athlete_id is not null
      and (public.is_athlete_self(athlete_id) or public.is_guardian_of(athlete_id)))
  or (guardian_id is not null
      and exists (select 1 from public.guardians g
                  where g.id = guardian_id and g.profile_id = auth.uid()))
);

drop policy if exists medical_certificates_read on public.medical_certificates;
create policy medical_certificates_read on public.medical_certificates for select using (
  public.has_organization_permission(organization_id, 'documents.manage')
  or public.has_organization_permission(organization_id, 'people.manage')
  or public.is_athlete_self(athlete_id)
  or public.is_guardian_of(athlete_id)
);

drop policy if exists fita_memberships_read on public.fita_memberships;
create policy fita_memberships_read on public.fita_memberships for select using (
  public.has_organization_permission(organization_id, 'people.manage')
  or public.is_athlete_self(athlete_id)
  or public.is_guardian_of(athlete_id)
);

-- --- Comunicazioni ---------------------------------------------------
-- Solo chi le gestisce. I destinatari le vedranno tramite
-- communication_recipients (Fase 7).
drop policy if exists communications_read on public.communications;
create policy communications_read on public.communications for select using (
  public.has_organization_permission(organization_id, 'communications.manage')
);

-- --- Audit log -----------------------------------------------------
drop policy if exists audit_logs_read on public.audit_logs;
create policy audit_logs_read on public.audit_logs for select using (
  public.has_organization_permission(organization_id, 'organization.manage')
);
