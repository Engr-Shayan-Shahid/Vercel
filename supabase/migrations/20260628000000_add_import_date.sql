-- Add import_date to import_logs for CBAM quarterly reporting period assignment

alter table public.import_logs
  add column if not exists import_date date;

update public.import_logs
set import_date = created_at::date
where import_date is null;

alter table public.import_logs
  alter column import_date set not null,
  alter column import_date set default current_date;

create index if not exists idx_import_logs_org_import_date
  on public.import_logs (organization_id, import_date desc);
