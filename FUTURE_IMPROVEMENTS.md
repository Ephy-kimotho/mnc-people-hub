# MNC People Hub — Future Improvements

Internal portal for **People** (staff, leave) and **Property** (portfolio, tenants, leases, finance).

- **Status:** product parity complete; audit log live; preparing for real data and production hardening.
- **Last reviewed:** 27 November 2026.
- **Scope:** everything still open after the lease-document, gazette, compliance-payment, upload-limit and audit-log work.

## Priority guide

| Priority | Meaning |
| --- | --- |
| **P0** | Required before go-live |
| **P1** | Should be done soon after launch |
| **P2** | Nice-to-have / later improvement |

---

## 1. Go-live blockers (P0)

### 1.1 Replace demo property data with the Replit portfolio

**Done on 27 November 2026.** The property demo dataset was removed and the Replit PropertyHub dataset was imported directly through the API.

| Imported from Replit | Count |
| --- | ---: |
| Properties | 20 |
| Units | 38 |
| Tenants | 36 |
| Active leases | 36 |
| Bank accounts | 35 |
| Property owners | 20 |
| Insurance policies | 8 |

Notes on the import:

- Duplicate Replit property names (`Marigu`, `Munyo`) were disambiguated with their title numbers.
- Replit returned 40 leases, but four terminated QA leases referenced tenants that no longer exist in its API, so they were skipped.
- The property demo accounts, contacts, insurance, maintenance, payments, rent rows, alerts and demo lease document were deleted.
- The import is recorded in **Audit Log → Property data imported**.

The **People** dataset (8 staff, 10 leave requests, staff auth accounts) has not been replaced because Replit contains no staff or leave data.

**Acceptance:** property register totals match Replit; no demo property rows remain.

### 1.1a Complete the imported property data (P0)

The Replit export is structurally complete but has major missing values:

| Gap | Count |
| --- | ---: |
| Active leases missing start date | 36 of 36 |
| Active leases missing end date | 36 of 36 |
| Active leases missing KES rent | 36 of 36 |
| Active leases missing all rent (KES and USD) | 35 of 36 |
| Active leases missing service charge | 36 of 36 |
| Tenants missing phone, mobile and email | 36 of 36 |
| Tenants missing ID number | 36 of 36 |
| Bank accounts with masked-only numbers | 35 of 35 |
| Property contacts / documents / tenant documents / vehicles | 0 imported |

As a result, the dashboard shows **Ksh 0 + USD 2,500 monthly rent** and the lease register shows Ksh 0, even though Replit’s property cards show rent totals. The app derives rent from leases; Replit’s lease API does not expose those amounts.

Tasks:

- [ ] Obtain the missing lease start/end dates and rent amounts from the source records and enter them on each lease.
- [ ] Add service-charge amounts where they apply.
- [ ] Replace masked bank account numbers with full numbers; verify routing.
- [ ] Add tenant phone, email and ID details.
- [ ] Add property contacts, documents, insurance attachments and tenant documents that Replit did not expose.
- [ ] Reconcile the portfolio rent total against the source figures.

**Acceptance:** lease register shows real rents and dates; dashboard totals match the source records.

### 1.2 Remove demo logins and rotate seeded passwords

Eight demo staff auth accounts were auto-created with `must_change_password = true`; only Grace’s password is known. The seeded `admin` and `manager1` passwords are also known.

Tasks:

- [ ] Delete or deactivate demo auth accounts that do not belong to real staff.
- [ ] Rotate `admin`, `manager1` and `grace.wanjiru` passwords.
- [ ] Audit all users with `must_change_password = true`.
- [ ] Verify every active user has a unique, owner-set password.
- [ ] Consider MFA for admin accounts.

**Acceptance:** no shared or documented production credentials remain.

### 1.3 Make the R2 bucket private

Documents already use short-lived presigned URLs (900 seconds) and the API no longer exposes storage keys or public URLs. The bucket policy itself still needs locking down.

Tasks:

- [ ] Block all public access on the R2 bucket.
- [ ] Disable public bucket URLs.
- [ ] Rotate R2 access keys if they were ever exposed.
- [ ] Re-test upload, view and delete for staff, leave, property, tenant and lease documents.
- [ ] Confirm presigned URLs expire and cannot be reused after expiry.

**Acceptance:** anonymous requests to object URLs fail; the app still works through signed URLs.

### 1.4 Backups and restore drills

- [ ] Automated daily PostgreSQL backups.
- [ ] Off-site copy (separate bucket/account) with at least 30-day retention.
- [ ] R2 object versioning and lifecycle policy.
- [ ] Documented restore procedure.
- [ ] Quarterly restore test into staging; record the result.

**Acceptance:** a restore has been performed successfully, not just configured.

### 1.5 Monitoring, logging and alerting

- [ ] Uptime checks for the frontend and each `/api/*/health` endpoint.
- [ ] Error tracking for Next.js and FastAPI (Sentry or equivalent).
- [ ] Alerts to email/WhatsApp for 5xx spikes, database failures, disk usage and TLS expiry.
- [ ] Structured logs with retention and correlation IDs.
- [ ] Audit-log write failures surfaced to monitoring (currently swallowed by design).

**Acceptance:** a simulated failure produces an alert; audit failures are visible.

### 1.6 Production notifications

- [ ] Confirm WhatsApp and email credentials, sender identity and templates.
- [ ] Test leave submitted, approved, rejected and recalled messages.
- [ ] Test welcome messages for new staff.
- [ ] Test reminders and birthday/anniversary notifications.
- [ ] Add rate limiting, retries and failure visibility.

**Acceptance:** real test messages are delivered to real numbers/inboxes.

### 1.7 Real-device mobile QA

Responsive layouts are implemented but only checked at desktop sizes.

- [ ] iPhone and Android at ~390 px width.
- [ ] Property register and property detail.
- [ ] Draft/edit lease dialog and lease document actions.
- [ ] Mobile lease/rent/deposit cards.
- [ ] Leave requests, submit-leave form, month calendar and mobile agenda.
- [ ] Audit log and audit value expansion.

**Acceptance:** no horizontal scrolling, clipped dialogs or unusable form controls.

### 1.8 Automated tests and CI reliability

CI currently builds images but runs no application tests.

- [ ] Backend API tests for authentication, RBAC, properties, leases, leave, document signing and upload limits.
- [ ] Frontend smoke tests with Playwright for login, property/tenant/lease CRUD and audit log.
- [ ] Run tests on every PR and block deploys on failure.
- [ ] Improve Docker build caching so image builds are not routinely slow.
- [ ] Deploy automatically after green CI instead of dispatching manually.

**Acceptance:** CI must pass before deploy; a failing test blocks release.

---

## 2. Product improvements

### 2.1 Audit log filters and CSV export (P1)

The audit log is populated and admin-only, but currently supports pagination only.

- [ ] Server-side filters: user, entity, action, date range and free-text search.
- [ ] CSV export of the filtered log.
- [ ] Preserve stable ordering by timestamp and ID.

Relevant files:

- `components/audit/audit-view.tsx`
- `services/mnc/app/api/mnc.py`
- `services/mnc/app/repositories/mnc.py`

**Acceptance:** an admin can find and export a specific user’s property changes.

### 2.2 Full old → new coverage in the audit log (P2)

Staff and leave edits store before/after values. Property, unit, tenant, lease and bank-account updates currently store only the new values.

- [ ] Fetch a before-snapshot in each update handler and pass `old_value` to `log_mnc`.
- [ ] Keep before/after data admin-only.

**Acceptance:** every update entry shows `old → new`, and unchanged fields stay hidden.

### 2.3 Compliance payment automation (P1)

Land rent and county rates status is manual. A payment does not automatically mark the account “Paid” because there is no amount-due or period model, so partial payments cannot be evaluated.

- [ ] Add amount due / period (or an obligations table) for land rent and county rates.
- [ ] Calculate outstanding balances and support partial payments.
- [ ] Auto-update status to `Paid` / `In Arrears` only when fully settled.
- [ ] Show outstanding amounts on the Compliance card.

**Acceptance:** logging a payment updates status correctly; partial payments remain outstanding.

### 2.4 Gazette status in the completeness score (P2)

Gazette status is stored, editable and displayed, but it does not affect the property completeness percentage.

- [ ] Add gazette status to the completeness checks with a sensible default.
- [ ] Update the completeness explanation if one is shown.

**Acceptance:** a property missing gazette information cannot show 100% complete.

### 2.5 Combined audit view (P2)

Auth events (login, user creation, password reset) live on **Auth Audit**, while business changes live on **Audit Log**. The pages link to each other.

- [ ] Decide whether admins need a single combined feed.
- [ ] If yes, add an `include_auth` filter or merge the two APIs.

**Acceptance:** admins can see the full history in one place without duplicating entries.

### 2.6 Audit retention and archive policy (P2)

`mnc.audit_log` is immutable and will grow indefinitely.

- [ ] Define a retention period (for example, seven years).
- [ ] Archive older entries to R2 as CSV/JSON.
- [ ] Document who can access the archive.
- [ ] Never allow edits; deletions only through a documented retention job.

**Acceptance:** retention is documented and an archive job exists.

---

## 3. Recently completed (for context)

Do not re-open these unless a regression is found:

- Lease agreement **upload / view / delete** on existing leases, with private signed URLs.
- **Gazette status** in the property API, form and compliance card.
- **Land rent / county rates payment history** with logging and deletion.
- **Lease document original filename** stored and displayed.
- **15 MB server-side upload limit** on all upload endpoints, with 413 responses.
- **Audit log** populated across Staff, Leave, Property and Workspace changes, including old/new values and stable ordering.
- **Property demo replaced with the Replit portfolio** — 20 properties, 38 units, 36 tenants, 36 active leases, 35 bank accounts, 20 owners and 8 insurance policies.
- Leave edit `Decimal - float` crash fixed.

---

## 4. Go-live checklist

Use this as the final release gate:

- [x] Property demo replaced with the Replit import (27 Nov 2026).
- [ ] Lease dates, rents, service charges, tenant contacts and bank account numbers completed.
- [ ] People demo data replaced with the real HR source.
- [ ] Demo accounts removed; admin/manager/demo passwords rotated.
- [ ] R2 bucket private; signed document access re-tested.
- [ ] Database backup restored successfully in staging.
- [ ] Uptime, error tracking and alerting active.
- [ ] WhatsApp/email notifications tested in production configuration.
- [ ] Mobile QA passed on real iOS and Android devices.
- [ ] CI runs tests and blocks failing deploys.
- [ ] Audit log checked after the go-live smoke test.
