-- CBAMVault Supabase schema
-- Run in Supabase SQL Editor or via supabase db push

create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  material_type text not null,
  mass numeric not null check (mass > 0),
  origin_country text not null,
  emission_factor numeric not null check (emission_factor >= 0),
  embedded_emissions numeric not null,
  benchmark numeric not null,
  free_allocation numeric not null,
  foreign_price numeric not null default 0,
  foreign_carbon_price_deduction numeric not null default 0,
  ets_price numeric not null,
  tax_liability numeric not null,
  proof_of_payment_file_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.emissions_reports (
  id uuid primary key default gen_random_uuid(),
  report_id text not null unique,
  period text not null,
  year integer not null,
  quarter text not null check (quarter in ('Q1', 'Q2', 'Q3', 'Q4')),
  total_goods numeric not null,
  embedded_emissions numeric not null,
  emissions_subject_to_cbam numeric not null,
  liability numeric not null,
  ets_price numeric not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'accepted')),
  import_ids uuid[] not null default '{}',
  aggregated_rows jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_emissions_reports_created_at
  on public.emissions_reports (created_at desc);

create index if not exists idx_import_logs_created_at
  on public.import_logs (created_at desc);

alter table public.import_logs enable row level security;
alter table public.emissions_reports enable row level security;

create policy "Allow public read import_logs"
  on public.import_logs for select using (true);

create policy "Allow public insert import_logs"
  on public.import_logs for insert with check (true);

create policy "Allow public update import_logs"
  on public.import_logs for update using (true);

create policy "Allow public delete import_logs"
  on public.import_logs for delete using (true);

create policy "Allow public read emissions_reports"
  on public.emissions_reports for select using (true);

create policy "Allow public insert emissions_reports"
  on public.emissions_reports for insert with check (true);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_key text not null unique default 'default',
  compliance_officer_name text not null default 'Alex Morgan',
  email text not null default '',
  company_legal_name text not null default '',
  eori_number text not null default '',
  vat_tax_id text not null default '',
  new_eu_regulation_alerts boolean not null default true,
  quarterly_report_reminders boolean not null default true,
  security_alerts boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint profiles_eori_format check (
    eori_number = '' or eori_number ~ '^[A-Za-z0-9]{17}$'
  )
);

alter table public.profiles enable row level security;

create policy "Allow public read profiles"
  on public.profiles for select using (true);

create policy "Allow public insert profiles"
  on public.profiles for insert with check (true);

create policy "Allow public update profiles"
  on public.profiles for update using (true);
