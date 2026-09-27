# Kounta — description.md

Kounta is a multi-tenant cloud business management + accounting SaaS built for Canadian businesses.

Single login from anywhere. Single dedicated executive account per business. Shared high-performance Postgres, strictly partitioned by `business_id` — you only ever see your tenant.

Core philosophy: Invisible Bookkeeping (Operations-Driven Accounting).
You ship, pay vendors, get paid — Kounta writes balanced debits/credits in the background. Won't save if off by a penny.

What you get:
- What-To-Do Today command center: Red critical / Orange high alerts with one-click fixes.
- Business modes: Physical Goods (warehouses, shipping, inventory) / Service Contracts (retainers, milestones, renewals).
- Sales pipeline: Quote (auto provincial GST/PST/HST/QST) → Order (reserves stock) → Ship (FedEx/Canada Post tracking) → Invoice & Payment.
- Smart inventory: perpetual, landed cost, reorder-point alerts.
- Watchdogs: 6-hour supplier order rule, delivery check-ins, contract expirations.
- Canadian tax engine: GST/PST/HST/QST map, ITC tracking on expenses, CRA GST34-ready helper.

Build order: tenancy walls + ledger math first, then sales → inventory → dashboard/watchdogs → tax.
