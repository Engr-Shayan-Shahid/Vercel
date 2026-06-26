-- Add CN code to import_logs for CBAM goods classification
alter table public.import_logs
  add column if not exists cn_code text;

update public.import_logs
set cn_code = case material_type
  when 'Steel' then '7208'
  when 'Aluminum' then '7601'
  when 'Cement' then '2523'
  when 'Fertilizer' then '3102'
  else null
end
where cn_code is null;

alter table public.import_logs
  alter column cn_code set not null;

create index if not exists idx_import_logs_org_cn_code
  on public.import_logs (organization_id, cn_code);
