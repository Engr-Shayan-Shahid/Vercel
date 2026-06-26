-- Enable PostgREST embed: organization_members -> profiles (user_id)
-- Signup must create profile before organization_members for the FK.

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

  insert into public.profiles (user_id, email, compliance_officer_name, account_type)
  values (new.id, coalesce(new.email, ''), display_name, acct_type);

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

alter table public.organization_members
  drop constraint if exists organization_members_user_id_profiles_fkey;

alter table public.organization_members
  add constraint organization_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(user_id);
