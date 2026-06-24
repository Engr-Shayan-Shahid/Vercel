-- CBAMVault MVP schema: multi-tenant organizations, auth, RLS, storage

-- Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  eori_number text not null default '',
  vat_tax_id text not null default '',
  created_at timestamptz not null default now(),
  constraint organizations_eori_format check (
    eori_number = '' or eori_number ~ '^[A-Za-z0-9]{17}$'
  )
);

-- Organization membership
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists idx_organization_members_user_id
  on public.organization_members (user_id);

-- User profiles (notification + officer info; org identifiers live on organizations)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  compliance_officer_name text not null default '',
  email text not null default '',
  new_eu_regulation_alerts boolean not null default true,
  quarterly_report_reminders boolean not null default true,
  security_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Import logs
create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
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
  proof_of_payment_storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists idx_import_logs_org_created
  on public.import_logs (organization_id, created_at desc);

-- Emissions reports
create table if not exists public.emissions_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id text not null,
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
  created_at timestamptz not null default now(),
  unique (organization_id, report_id)
);

create index if not exists idx_emissions_reports_org_created
  on public.emissions_reports (organization_id, created_at desc);

-- Bootstrap org + profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  insert into public.organizations (name)
  values ('')
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  insert into public.profiles (user_id, email, compliance_officer_name)
  values (new.id, coalesce(new.email, ''), display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.profiles enable row level security;
alter table public.import_logs enable row level security;
alter table public.emissions_reports enable row level security;

-- Helper: org IDs for current user
create or replace function public.user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.organization_members where user_id = auth.uid();
$$;

-- Organizations
create policy "members read organizations"
  on public.organizations for select
  using (id in (select public.user_organization_ids()));

create policy "owners update organizations"
  on public.organizations for update
  using (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- Organization members
create policy "members read own membership"
  on public.organization_members for select
  using (user_id = auth.uid());

-- Profiles
create policy "users read own profile"
  on public.profiles for select
  using (user_id = auth.uid());

create policy "users insert own profile"
  on public.profiles for insert
  with check (user_id = auth.uid());

create policy "users update own profile"
  on public.profiles for update
  using (user_id = auth.uid());

-- Import logs
create policy "members read import_logs"
  on public.import_logs for select
  using (organization_id in (select public.user_organization_ids()));

create policy "members insert import_logs"
  on public.import_logs for insert
  with check (organization_id in (select public.user_organization_ids()));

create policy "members update import_logs"
  on public.import_logs for update
  using (organization_id in (select public.user_organization_ids()));

create policy "members delete import_logs"
  on public.import_logs for delete
  using (organization_id in (select public.user_organization_ids()));

-- Emissions reports
create policy "members read emissions_reports"
  on public.emissions_reports for select
  using (organization_id in (select public.user_organization_ids()));

create policy "members insert emissions_reports"
  on public.emissions_reports for insert
  with check (organization_id in (select public.user_organization_ids()));

create policy "members update emissions_reports"
  on public.emissions_reports for update
  using (organization_id in (select public.user_organization_ids()));

create policy "members delete emissions_reports"
  on public.emissions_reports for delete
  using (organization_id in (select public.user_organization_ids()));

-- Storage bucket for proof documents
insert into storage.buckets (id, name, public)
values ('proof-documents', 'proof-documents', false)
on conflict (id) do nothing;

create policy "members read proof documents"
  on storage.objects for select
  using (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] in (
      select organization_id::text from public.organization_members where user_id = auth.uid()
    )
  );

create policy "members upload proof documents"
  on storage.objects for insert
  with check (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] in (
      select organization_id::text from public.organization_members where user_id = auth.uid()
    )
  );

create policy "members update proof documents"
  on storage.objects for update
  using (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] in (
      select organization_id::text from public.organization_members where user_id = auth.uid()
    )
  );

create policy "members delete proof documents"
  on storage.objects for delete
  using (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] in (
      select organization_id::text from public.organization_members where user_id = auth.uid()
    )
  );
