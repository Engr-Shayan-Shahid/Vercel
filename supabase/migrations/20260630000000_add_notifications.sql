-- Notifications table for in-app alerts (deadline reminders, supplier data, report ready)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in ('deadline', 'supplier_data', 'missing_supplier_data', 'report_ready')),
  message text not null,
  read boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_org_unread
  on public.notifications (organization_id, read, created_at desc);

alter table public.notifications enable row level security;

-- Importers can read their own org's notifications
create policy "importers read notifications"
  on public.notifications for select
  using (organization_id in (select public.user_importer_org_ids()));

-- Importers can insert notifications for their own org (used server-side via authenticated session)
create policy "importers insert notifications"
  on public.notifications for insert
  with check (organization_id in (select public.user_importer_org_ids()));

-- Importers can update (mark as read) their own org's notifications
create policy "importers update notifications"
  on public.notifications for update
  using (organization_id in (select public.user_importer_org_ids()));

-- Importers can delete their own org's notifications
create policy "importers delete notifications"
  on public.notifications for delete
  using (organization_id in (select public.user_importer_org_ids()));
