-- Audit trail table to track all significant actions in the platform
create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete set null,
  action          text not null,
  entity_type     text not null,
  entity_id       text not null,
  old_values      jsonb,
  new_values      jsonb,
  ip_address      text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created
  on public.audit_logs (organization_id, created_at desc);

create index if not exists idx_audit_logs_org_action
  on public.audit_logs (organization_id, action);

alter table public.audit_logs enable row level security;

-- Org members can read their own org's audit logs
create policy "audit_logs_select_org_members"
  on public.audit_logs
  for select
  using (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Authenticated org members can insert audit log entries (API routes act on behalf of user)
create policy "audit_logs_insert_org_members"
  on public.audit_logs
  for insert
  with check (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
    )
  );
