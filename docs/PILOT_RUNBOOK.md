# CBAMVault Pilot Runbook — v0.2.0-bridge-mvp

## Overview

CBAMVault is a compliance tool for EU Carbon Border Adjustment Mechanism (CBAM) reporting.
The Bridge MVP (`v0.2.0`) adds a full importer–exporter collaboration loop: importers invite
exporters via email, exporters submit embedded emission data, and importers accept submissions
to create verified import logs that feed directly into quarterly CBAM reports.

---

## Prerequisites

### Migrations — all four must be applied to your Supabase project

| File | Purpose |
|------|---------|
| `supabase/migrations/20260625000000_mvp_schema.sql` | Base schema (orgs, profiles, import logs, reports, storage) |
| `supabase/migrations/20260626000000_bridge_schema.sql` | Bridge tables + org type discriminators + RLS |
| `supabase/migrations/20260626000001_fix_storage_rls.sql` | Storage RLS repair (idempotent) |
| `supabase/migrations/20260627000000_fix_invitation_accept_rls.sql` | Invitation accept + exporter submit WITH CHECK fix |

### Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=         # Service role key (server-side only — invite lookup)
NEXT_PUBLIC_APP_URL=               # Your deployment URL (e.g. https://cbamvault.vercel.app)
RESEND_API_KEY=                    # Resend API key for invitation + submission emails
RESEND_FROM_EMAIL=                 # Sender address (e.g. CBAMVault <onboarding@resend.dev>)
RESEND_DEV_INBOX=                  # Optional: redirect all emails for local/pilot testing
CBAM_ETS_PRICE=80                  # ETS carbon price in EUR/tCO₂e (default: 80)
```

### Supabase Auth

- Email provider must be enabled
- **Site URL** must be set to your deployment URL
- **Redirect URLs** must include `<deployment-url>/auth/callback`

---

## Two-account setup

The bridge requires two separate accounts — one Importer and one Exporter.
Use two different browsers (or normal + incognito) to run them side by side.

| Role | Sign-up URL | Account Type |
|------|-------------|--------------|
| Importer | `/signup` | Select "Importer" |
| Exporter | `/signup` | Select "Exporter" |

The Exporter's account email **must exactly match** the email the Importer uses when
creating a shipment request and sending an invite.

---

## Importer workflow

### 1. Configure organization

1. Sign in as Importer → go to **Settings → Organization**
2. Enter company legal name, EORI number (17 alphanumeric characters), and VAT/Tax ID
3. Save profile details under **Settings → Profile** (compliance officer name, email)

### 2. Create a shipment request

1. Open **Shipments** (`/shipments`)
2. Click **New Shipment Request**
3. Fill in: material type, origin country, mass (tonnes), exporter email
4. Optionally add CN code, reference number, notes
5. Click **Send Request** — a unique invite token is created

### 3. Invite the exporter

After creating the request, CBAMVault sends an invitation email to the exporter's address.

- **If email delivery succeeds:** the exporter receives a link to `/invite/[token]`
- **If email fails (sandbox / unverified domain):** the invite link is shown on screen —
  copy it and share it manually

---

## Exporter workflow

### 1. Accept the invitation

1. Open the invite link (`/invite/[token]`) — sign in or sign up if prompted
2. Review the shipment details on the invite page
3. Click **Accept Invitation** — you are redirected to `/exporter/requests`

### 2. Submit emission data

1. Open `/exporter/requests` → find the request in **Pending** status
2. Click **Submit** → open the submission form
3. Enter:
   - **Emission Factor** (t CO₂e / tonne) — required
   - Direct Emissions (optional)
   - Indirect Emissions (optional)
   - Notes (optional)
4. Click **Submit Emission Data** — the importer receives a notification email

---

## Accept workflow (Importer)

1. Open **Shipments** (`/shipments`) — the request now shows **Submitted**
2. Click **Review** to open the review panel
3. Review the submitted emission data and exporter notes
4. Click **Accept & Create Import Log**:
   - A new import log is created with the verified emission factor
   - CBAM liability is calculated and shown in the toast
   - Click **View import log** in the toast to navigate to the log
5. Alternatively, click **Reject** to reject and enter an optional rejection reason

---

## Downstream compliance

Once a shipment request is accepted:

1. Open **Import Logs** (`/import-logs`) — the new log appears with `emission_factor` from the exporter
2. Open **Emissions Reports** → **New Report** — the accepted import is available in the import picker
3. Generate a quarterly report including the bridge-created import
4. **Export XML** — includes your EORI and organization metadata

---

## Email sandbox notes

During local development or pilot testing with unverified sending domains:

- Resend routes emails to the **Resend Sandbox** by default — they do not reach real inboxes
- Set `RESEND_DEV_INBOX` to redirect all outbound emails to a single test inbox
- The invite link is always shown in the UI as a fallback — copy it to share without email
- To send real emails, verify a custom domain in the Resend dashboard and update `RESEND_FROM_EMAIL`

---

## Production deployment checklist

- [ ] Apply all 4 migrations to the Supabase project (run SQL or `supabase db push`)
- [ ] Set all required env vars in Vercel (see Prerequisites above)
- [ ] Set `NEXT_PUBLIC_APP_URL` to the Vercel production URL
- [ ] Update Supabase Auth **Site URL** to the Vercel URL
- [ ] Add `<vercel-url>/auth/callback` to Supabase **Redirect URLs**
- [ ] Run `npm run build` locally — must pass with zero errors
- [ ] Smoke test on production URL:
  - [ ] Importer signup → dashboard loads
  - [ ] Exporter signup → exporter portal loads
  - [ ] Create shipment request → invite email sent (or link shown)
  - [ ] Exporter accepts invite → request appears in exporter portal
  - [ ] Exporter submits data → importer sees "Submitted"
  - [ ] Importer accepts → import log created → appears in reports
- [ ] Tag release `v0.2.0-bridge-mvp`

---

## Known Bridge MVP limitations

- Single organization per user (team invites are post-sprint backlog)
- Email delivery requires a verified Resend domain for production — sandbox only for pilot
- XML export is structured for compliance workflows but not validated against an official EU XSD
- No PDF export (XML only)
- No customs declaration ingest (MRN / Bill of Lading)
- No plausibility checks on exporter emission submissions
- No multi-year financial forecasting
- No Stripe billing or premium gating
- Notification toggles in Settings are saved but push/webhook delivery is not implemented

---

## Verify tenant isolation

1. Create a second importer account in a separate incognito window
2. Confirm the second account cannot see the first account's import logs, reports, or shipment requests
3. Confirm an exporter cannot call `accept` or `submit` on another org's requests (API returns 403)
