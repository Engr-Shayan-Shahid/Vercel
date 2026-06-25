# Day 3 — Bridge Schema Migration

## If migration failed partway

Run the **repair script** (idempotent, adds missing columns first):

```
supabase/migrations/20260626000001_fix_storage_rls.sql
```

This adds `org_type` / `account_type` before any policy references them.

## Fresh apply (empty or never ran bridge)

```
supabase/migrations/20260626000000_bridge_schema.sql
```

Or use the repair script above — it is safe either way.

## What it adds

- `organizations.org_type` — `importer` | `exporter`
- `profiles.account_type` — mirrors signup role
- `invitations` — exporter invite tokens
- `shipment_requests` — bridge entity linking importer ↔ exporter
- Updated `handle_new_user()` — reads `account_type` from auth metadata
- RLS helpers: `user_importer_org_ids()`, `user_exporter_org_ids()`, `auth_user_email()`
- Tightened RLS: import logs, emissions reports, and proof storage are **importer-only**

## Verify after migration

```sql
-- Columns exist
select column_name from information_schema.columns
where table_name = 'organizations' and column_name = 'org_type';

select column_name from information_schema.columns
where table_name = 'profiles' and column_name = 'account_type';

-- New tables
select tablename from pg_tables
where schemaname = 'public'
  and tablename in ('invitations', 'shipment_requests');

-- RLS enabled
select tablename, rowsecurity from pg_tables
where schemaname = 'public'
  and tablename in ('invitations', 'shipment_requests');
```

## Tenant isolation test

1. Create User A (importer) and User B (importer) in the app
2. User A logs an import
3. Confirm User B cannot see User A's imports in the UI or via API

Existing users created before this migration will have `org_type = importer` and `account_type = importer` (defaults).
