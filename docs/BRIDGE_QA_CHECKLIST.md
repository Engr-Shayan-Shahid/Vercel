# Bridge QA Checklist — v0.2.0-bridge-mvp

Use this checklist for repeatable pilot testing of the importer–exporter loop.
Run locally against CBAMVaults first, then repeat on the production Vercel URL.

**Setup:** Two browsers (normal + incognito). Importer account in one, Exporter in the other.

---

## Auth & routing

- [ ] Importer signup → lands on importer dashboard (`/`)
- [ ] Exporter signup → lands on exporter portal (`/exporter`)
- [ ] Importer cannot access `/exporter` (redirected by middleware)
- [ ] Exporter cannot access `/` importer dashboard (redirected)

## Invite + request flow

- [ ] Importer creates shipment on `/shipments` → request appears in table as **Pending**
- [ ] Invitation email is sent to exporter email (or invite link shown as fallback)
- [ ] Exporter opens `/invite/[token]` → sees shipment details
- [ ] Exporter accepts invite → redirected to `/exporter/requests` → request shows as **Pending**
- [ ] No RLS error on invitation accept

## Submission loop

- [ ] Exporter opens request → submits emission factor → status changes to **Submitted**
- [ ] Importer `/shipments` shows the request as **Submitted** with **Review** button
- [ ] Importer dashboard **Bridge Activity** shows the request
- [ ] Importer receives submission notification email (or dev sandbox redirect)

## Accept + import log

- [ ] Importer clicks **Review** → review panel opens with submitted data
- [ ] Importer clicks **Accept & Create Import Log** → toast shows CBAM liability + "View import log" link
- [ ] New row appears on `/import-logs` with the exporter's `emission_factor`
- [ ] Shipment request shows **Accepted** with **Import log** link in table
- [ ] Importer rejects a separate submitted request → exporter sees **Rejected**

## Downstream compliance

- [ ] Accepted import appears in **Emissions Reports** import picker
- [ ] Quarterly report can be generated including the bridge-created import
- [ ] XML export includes org EORI and metadata from Settings

## Security & isolation

- [ ] Importer A cannot see Importer B's requests, imports, or reports
- [ ] Exporter cannot call `action=accept` on a request (API returns 403)
- [ ] Importer cannot call `action=submit` on a request (API returns 403)
- [ ] Exporter cannot view another exporter's requests

## Build

- [ ] `npm run build` passes with zero errors
