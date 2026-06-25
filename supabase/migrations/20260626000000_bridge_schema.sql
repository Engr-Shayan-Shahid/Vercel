-- CBAMVault Bridge schema: importer/exporter org types, invitations, shipment requests

-- ---------------------------------------------------------------------------
-- Org + profile type discriminators
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column if not exists org_type text not null default 'importer';

alter table public.organizations
  drop constraint if exists organizations_org_type_check;

alter table public.organizations
  add constraint organizations_org_type_check
  check (org_type in ('importer', 'exporter'));

alter table public.profiles
  add column if not exists account_type text not null default 'importer';

alter table public.profiles
  drop constraint if exists profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check
  check (account_type in ('importer', 'exporter'));

-- ---------------------------------------------------------------------------
-- Invitations (importer invites exporter by email)
-- ---------------------------------------------------------------------------

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  importer_org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_invitations_importer_org
  on public.invitations (importer_org_id);

create index if not exists idx_invitations_email
  on public.invitations (lower(email));

create index if not exists idx_invitations_token
  on public.invitations (token);

-- ---------------------------------------------------------------------------
-- Shipment requests (bridge entity linking importer ↔ exporter)
-- ---------------------------------------------------------------------------

create table if not exists public.shipment_requests (
  id uuid primary key default gen_random_uuid(),
  importer_org_id uuid not null references public.organizations(id) on delete cascade,
  exporter_org_id uuid references public.organizations(id) on delete set null,
  invitation_id uuid references public.invitations(id) on delete set null,
  exporter_email text not null,
  material_type text not null,
  mass numeric not null check (mass > 0),
  origin_country text not null,
  cn_code text,
  reference_number text,
  notes text,
  emission_factor numeric check (emission_factor is null or emission_factor >= 0),
  direct_emissions numeric check (direct_emissions is null or direct_emissions >= 0),
  indirect_emissions numeric check (indirect_emissions is null or indirect_emissions >= 0),
  submission_notes text,
  status text not null default 'pending_exporter'
    check (status in (
      'pending_exporter', 'submitted', 'accepted', 'rejected', 'cancelled'
    )),
  submitted_at timestamptz,
  accepted_at timestamptz,
  import_log_id uuid references public.import_logs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shipment_requests_importer_org
  on public.shipment_requests (importer_org_id, created_at desc);

create index if not exists idx_shipment_requests_exporter_org
  on public.shipment_requests (exporter_org_id, created_at desc)
  where exporter_org_id is not null;

create index if not exists idx_shipment_requests_exporter_email
  on public.shipment_requests (lower(exporter_email));

create index if not exists idx_shipment_requests_status
  on public.shipment_requests (status);

-- ---------------------------------------------------------------------------
-- Signup bootstrap: respect account_type from auth metadata
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  display_name text;
  acct_type text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  acct_type := coalesce(
    nullif(trim(new.raw_user_meta_data->>'account_type'), ''),
    'importer'
  );

  if acct_type not in ('importer', 'exporter') then
    acct_type := 'importer';
  end if;

  insert into public.organizations (name, org_type)
  values ('', acct_type)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  insert into public.profiles (user_id, email, compliance_officer_name, account_type)
  values (new.id, coalesce(new.email, ''), display_name, acct_type);

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_importer_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select om.organization_id
  from public.organization_members om
  join public.organizations o on o.id = om.organization_id
  where om.user_id = auth.uid()
    and o.org_type = 'importer';
$$;

create or replace function public.user_exporter_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select om.organization_id
  from public.organization_members om
  join public.organizations o on o.id = om.organization_id
  where om.user_id = auth.uid()
    and o.org_type = 'exporter';
$$;

create or replace function public.auth_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- ---------------------------------------------------------------------------
-- Tighten import_logs + emissions_reports to importer orgs only
-- ---------------------------------------------------------------------------

drop policy if exists "members read import_logs" on public.import_logs;
drop policy if exists "members insert import_logs" on public.import_logs;
drop policy if exists "members update import_logs" on public.import_logs;
drop policy if exists "members delete import_logs" on public.import_logs;

create policy "importers read import_logs"
  on public.import_logs for select
  using (organization_id in (select public.user_importer_org_ids()));

create policy "importers insert import_logs"
  on public.import_logs for insert
  with check (organization_id in (select public.user_importer_org_ids()));

create policy "importers update import_logs"
  on public.import_logs for update
  using (organization_id in (select public.user_importer_org_ids()));

create policy "importers delete import_logs"
  on public.import_logs for delete
  using (organization_id in (select public.user_importer_org_ids()));

drop policy if exists "members read emissions_reports" on public.emissions_reports;
drop policy if exists "members insert emissions_reports" on public.emissions_reports;
drop policy if exists "members update emissions_reports" on public.emissions_reports;
drop policy if exists "members delete emissions_reports" on public.emissions_reports;

create policy "importers read emissions_reports"
  on public.emissions_reports for select
  using (organization_id in (select public.user_importer_org_ids()));

create policy "importers insert emissions_reports"
  on public.emissions_reports for insert
  with check (organization_id in (select public.user_importer_org_ids()));

create policy "importers update emissions_reports"
  on public.emissions_reports for update
  using (organization_id in (select public.user_importer_org_ids()));

create policy "importers delete emissions_reports"
  on public.emissions_reports for delete
  using (organization_id in (select public.user_importer_org_ids()));

-- Storage: importer orgs only for proof documents
drop policy if exists "members read proof documents" on storage.objects;
drop policy if exists "members upload proof documents" on storage.objects;
drop policy if exists "members update proof documents" on storage.objects;
drop policy if exists "members delete proof documents" on storage.objects;

create policy "importers read proof documents"
  on storage.objects for select
  using (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] in (
      select om.organization_id::text
      from public.organization_members om
      join public.organizations o on o.id = om.organization_id
      where om.user_id = auth.uid()
        and o.org_type = 'importer'
    )
  );

create policy "importers upload proof documents"
  on storage.objects for insert
  with check (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] in (
      select om.organization_id::text
      from public.organization_members om
      join public.organizations o on o.id = om.organization_id
      where om.user_id = auth.uid()
        and o.org_type = 'importer'
    )
  );

create policy "importers update proof documents"
  on storage.objects for update
  using (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] in (
      select om.organization_id::text
      from public.organization_members om
      join public.organizations o on o.id = om.organization_id
      where om.user_id = auth.uid()
        and o.org_type = 'importer'
    )
  );

create policy "importers delete proof documents"
  on storage.objects for delete
  using (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] in (
      select om.organization_id::text
      from public.organization_members om
      join public.organizations o on o.id = om.organization_id
      where om.user_id = auth.uid()
        and o.org_type = 'importer'
    )
  );

-- ---------------------------------------------------------------------------
-- Invitations RLS
-- ---------------------------------------------------------------------------

alter table public.invitations enable row level security;

create policy "importers read invitations"
  on public.invitations for select
  using (importer_org_id in (select public.user_importer_org_ids()));

create policy "importers insert invitations"
  on public.invitations for insert
  with check (importer_org_id in (select public.user_importer_org_ids()));

create policy "importers update invitations"
  on public.invitations for update
  using (importer_org_id in (select public.user_importer_org_ids()));

create policy "exporters read own invitations"
  on public.invitations for select
  using (lower(email) = public.auth_user_email());

create policy "exporters accept invitations"
  on public.invitations for update
  using (
    lower(email) = public.auth_user_email()
    and status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- Shipment requests RLS
-- ---------------------------------------------------------------------------

alter table public.shipment_requests enable row level security;

create policy "importers read shipment_requests"
  on public.shipment_requests for select
  using (importer_org_id in (select public.user_importer_org_ids()));

create policy "importers insert shipment_requests"
  on public.shipment_requests for insert
  with check (importer_org_id in (select public.user_importer_org_ids()));

create policy "importers update shipment_requests"
  on public.shipment_requests for update
  using (importer_org_id in (select public.user_importer_org_ids()));

create policy "importers delete shipment_requests"
  on public.shipment_requests for delete
  using (importer_org_id in (select public.user_importer_org_ids()));

create policy "exporters read shipment_requests"
  on public.shipment_requests for select
  using (
    exporter_org_id in (select public.user_exporter_org_ids())
    or (
      lower(exporter_email) = public.auth_user_email()
      and status in ('pending_exporter', 'submitted', 'accepted', 'rejected')
    )
  );

create policy "exporters update shipment_requests"
  on public.shipment_requests for update
  using (
    exporter_org_id in (select public.user_exporter_org_ids())
    or (
      lower(exporter_email) = public.auth_user_email()
      and status in ('pending_exporter', 'submitted')
    )
  );
