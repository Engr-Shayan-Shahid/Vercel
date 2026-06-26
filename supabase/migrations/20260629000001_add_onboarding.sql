-- Onboarding tracking on profiles
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

-- Primary commodity preference on organizations
alter table public.organizations
  add column if not exists primary_commodity text;

-- All users who existed before this migration have already completed setup
update public.profiles set onboarding_completed = true;
