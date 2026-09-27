# Kounta — Phased Build Plan (SaaS, Multi-Tenant Cloud)

Owner approval required before any build. Nothing builds until Leas signs.

## 1. Vision
Kounta = cloud-hosted business management + accounting for Canadian businesses. Single user per business (owner executive account). Operations-Driven Accounting ("Invisible Bookkeeping"): user ships/pays/collects, system writes balanced debits/credits automatically.

## 2. Stack (proposed)
- DB: PostgreSQL with Row-Level Security (RLS) on business_id
- Backend: TBD (Hephaestus to confirm) — REST API, tenant-scoped middleware, background jobs for watchdogs
- Frontend: TBD (Arachne) — dashboard-first, quote→order→ship→invoice flow
- Auth: single owner login per tenant, business_id bound at session
- Hosting: cloud Postgres + app host, env secrets, migrations

## 3. Core Tenancy Rule
Every row in tenant tables carries business_id. RLS enforces: current_business_id() = business_id. No query without tenant scope. Cross-tenant access tests must fail closed.

## 4. Schema (v1)
- businesses(id, name, province, mode_flags)
- users(id, business_id, role=owner, auth)
- ledger_entries(id, business_id, txn_id, debit_acct, credit_acct, amount_cents, created_at)
- customers, vendors, items, inventory_levels(business_id, item_id, qty, reorder_point, avg_cost_cents)
- quotes, orders, shipments, invoices, payments (all with business_id)
- taxes (province rate map), itc_records

## 5. Phases
Phase 0 — Tenancy + Ledger math: RLS policies, business_id stamping, balanced-entry guard (sum debits = sum credits, reject off-by-penny). Tests: cross-tenant invisibility, unbalanced reject.
Phase 1 — Sales pipeline: quote (province tax) → order (reserve stock) → shipment (tracking) → invoice → payment (bank balance). Tests per transition.
Phase 2 — Inventory: perpetual qty + avg cost, reorder alerts. Tests: no double-sell, reorder fires at threshold.
Phase 3 — Dashboard + Watchdogs: red/orange alerts + one-click fixes, 6-hr supplier rule, delivery check, contract expiry jobs.
Phase 4 — CRA Tax Engine: GST/PST/HST/QST map, ITC split, GST34 cheat sheet totals.

## 6. Test Gates (Momus/Janus)
No phase ships without: tenant isolation tests, ledger balance tests, migration clean, env secrets set. Janus gates main.
