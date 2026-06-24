# CBAMVault Pilot Runbook

## Prerequisites

1. Supabase project with the MVP migration applied (`supabase/migrations/20260625000000_mvp_schema.sql`)
2. Vercel deployment with environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CBAM_ETS_PRICE` (optional)
3. Supabase Auth email provider enabled

## Sign up and configure organization

1. Open the deployed URL and click **Sign up**
2. Create an account with email and password (minimum 8 characters)
3. On first signup, Supabase creates your organization, membership, and profile automatically
4. Go to **Settings → Organization** and enter:
   - Company legal name
   - EORI number (17 alphanumeric characters)
   - VAT/Tax ID
5. Save profile details under **Settings → Profile**

## Log an import

1. Open **Dashboard** or **Import Logs**
2. Select material type, origin country, mass (tonnes), and emission factor
3. Optionally enter foreign carbon price — if greater than zero, upload proof of payment
4. Click **Calculate & Submit** — liability is computed via the CBAM engine

## Generate a quarterly report

1. Open **Emissions Reports**
2. Click **New Report**, select year/quarter and import logs
3. Review aggregated CN code × origin rows
4. Click **Mark as Submitted** when ready
5. Click **Export XML** — file includes your EORI and organization metadata

## Verify tenant isolation

1. Create a second test account in an incognito window
2. Confirm the second account cannot see the first account's imports or reports

## Known MVP limitations

- Single organization per user (no team invites yet)
- No supplier/exporter collaborative bridge
- No Stripe billing or premium gating
- XML export is structured for compliance workflows but not validated against an official EU XSD
- PDF export is not included in MVP (XML only)
- Notifications toggles are saved but delivery is not implemented

## Production deployment checklist

- [ ] Run migration on production Supabase
- [ ] Set Vercel env vars
- [ ] Disable open/public RLS policies from legacy schema if upgrading an existing project
- [ ] Smoke test signup → import → report → XML export
- [ ] Tag release `v0.1.0-mvp`
