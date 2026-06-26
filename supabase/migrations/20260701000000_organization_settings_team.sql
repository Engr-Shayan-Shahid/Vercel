-- Organization settings + team invites for multi-user workspace

alter table public.organizations
  add column if not exists registered_country text not null default '',
  add column if not exists contact_email text not null default '',
  add column if not exists ets_price_override numeric check (ets_price_override is null or ets_price_override > 0),
  add column if not exists default_calculation_method text not null default 'actual'
    check (default_calculation_method in ('actual', 'default_fallback')),
  add column if not exists reporting_period_mode text not null default 'auto'
    check (reporting_period_mode in ('auto', 'manual')),
  add column if not exists reporting_year integer,
  add column if not exists reporting_quarter text
    check (reporting_quarter is null or reporting_quarter in ('Q1', 'Q2', 'Q3', 'Q4'));

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  token text not null unique,
  role text not null default 'member' check (role in ('owner', 'member')),
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_team_invites_org_status
  on public.team_invites (organization_id, status, created_at desc);

create index if not exists idx_team_invites_token
  on public.team_invites (token) where status = 'pending';

alter table public.team_invites enable row level security;

-- Team members can read all members in their org
create policy "members read org teammates"
  on public.organization_members for select
  using (organization_id in (select public.user_organization_ids()));

-- Owners may remove other members from their org
create policy "owners delete org members"
  on public.organization_members for delete
  using (
    user_id <> auth.uid()
    and organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- Org members may read teammate profiles (name + email for team table)
create policy "org members read teammate profiles"
  on public.profiles for select
  using (
    user_id in (
      select om2.user_id
      from public.organization_members om1
      join public.organization_members om2
        on om1.organization_id = om2.organization_id
      where om1.user_id = auth.uid()
    )
  );

-- All org members can see pending invites in the team table
create policy "members read team invites"
  on public.team_invites for select
  using (organization_id in (select public.user_organization_ids()));

-- Team invite policies (importer org owners)
create policy "owners read team invites"
  on public.team_invites for select
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "owners insert team invites"
  on public.team_invites for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "owners update team invites"
  on public.team_invites for update
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "owners delete team invites"
  on public.team_invites for delete
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- Signup: join existing org when invited via team_invite_token metadata
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
  invite_token text;
  invite_row public.team_invites%rowtype;
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

  invite_token := nullif(trim(new.raw_user_meta_data->>'team_invite_token'), '');

  if invite_token is not null then
    select * into invite_row
    from public.team_invites
    where token = invite_token
      and status = 'pending'
      and expires_at > now()
      and lower(email) = lower(coalesce(new.email, ''))
    limit 1;

    if invite_row.id is not null then
      insert into public.profiles (user_id, email, compliance_officer_name, account_type)
      values (new.id, coalesce(new.email, ''), display_name, 'importer');

      insert into public.organization_members (organization_id, user_id, role)
      values (invite_row.organization_id, new.id, invite_row.role);

      update public.team_invites
      set status = 'accepted'
      where id = invite_row.id;

      return new;
    end if;
  end if;

  insert into public.organizations (name, org_type)
  values ('', acct_type)
  returning id into new_org_id;

  insert into public.profiles (user_id, email, compliance_officer_name, account_type)
  values (new.id, coalesce(new.email, ''), display_name, acct_type);

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;
