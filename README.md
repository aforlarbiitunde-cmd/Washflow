# WashFlow SaaS starter

A mobile-first car-wash SaaS foundation using Next.js App Router, Supabase Auth/Postgres/RLS, and Vercel.

## Implemented
- Public landing page and business account registration/login/email verification/password reset
- Business workspace and daily KPI dashboard
- Customer CRM: create/list customer records
- Vehicles: register vehicles to customers
- POS transaction recording: service, amount, customer/vehicle and payment method
- Memberships: issue wash-count or time-limited memberships
- One-time membership token issuance with locally rendered QR code (raw token displayed after creation; SHA-256 hash stored)
- Membership redemption RPC with membership row lock, tenant-member check, active-date check, remaining-wash decrement, and redemption history
- SaaS admin directory, subscription plans, status suspend/reactivate, and plan pricing controls (requires platform-admin bootstrap)
- RLS tenant isolation on customer, vehicle, membership, transaction and redemption data

## Not production-complete
- Camera scanning (QR code is generated; token entry redemption works)
- Staff invitations/role management UI
- Branches, booking calendar, inventory, WhatsApp, payment gateway integration, invoicing and analytics exports
- Subscription payment collection/automated billing; admin plan controls currently update metadata only
- End-to-end tests and full build validation (npm install/build could not complete in this environment)
- Terms/privacy documents require review for the operator's actual jurisdiction and practices

## Setup
1. Use Node.js 20.9+.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
3. Install dependencies with `npm install`.
4. Apply SQL migrations in order in Supabase SQL editor: `001_initial.sql`, `002_membership_redemption.sql`, `003_subscriptions_and_admin.sql`, `004_foreign_key_indexes.sql`, `005_admin_functions_invoker.sql`.
5. In Supabase Auth, configure the site URL and redirect URLs (local and production) and SMTP before launch.
6. Start locally with `npm run dev`; run `npm run typecheck` and `npm run build` before deploying.

## Platform admin bootstrap
After the first owner account signs up and verifies email, obtain that account's UUID from Supabase Auth users. Run this SQL once from the Supabase SQL editor:

```sql
insert into public.platform_admins(user_id)
values ('REPLACE_WITH_AUTH_USER_UUID')
on conflict do nothing;
```

Only users in `platform_admins` can use the `/admin` console. A ready-to-edit bootstrap script is provided at `supabase/admin-bootstrap.sql`. Never expose this table or grant admin access through user-editable metadata.

## Security notes
- Supabase publishable key is intended for browser use; never add service-role keys to `NEXT_PUBLIC_*` variables.
- Membership tokens are random, one-time displayed, and stored as SHA-256 hashes. Keep the token private.
- The membership-redemption RPC is `SECURITY DEFINER` with a fixed search path and explicit caller/business validation because it performs controlled atomic updates. Admin RPCs are `SECURITY INVOKER` and protected by admin RLS policies. Supabase Security Advisor flags the redemption RPC for review; validate it with abuse-case tests before launch.
- Verify Supabase RLS, security advisor findings, authentication settings, rate limits, and backups before production.
