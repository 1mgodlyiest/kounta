# Kounta QA Gate — risk-based test plan (Rigel, QA owner)

Scope: SaaS rebuild, branch `main` (empty). Context read from `origin/hephaestus/m3-inventory` (M0–M3 SQL + `backend/sales/flow.py`, `backend/ledger/writer.py`). No billing in scope. Lin = backend, Pixel = frontend, Rigel = gate. Gate rule: **nothing merges to main unless P0 checks pass; P1 failures block release notes at minimum.**

## P0 — must pass before any release

### 1. Tenant isolation (cross-tenant read must fail)
- Set `current_business_id()` to tenant A, insert row; switch to tenant B, `SELECT` must return 0 rows; direct `INSERT` with A's `business_id` while bound to B must fail (RLS WITH CHECK).
- Repeat per table: businesses-scoped tables incl `order_items`, `reservations`, `ledger_entries`, `inventory_levels`, reorder-alerts view (`security_invoker` — verify B sees no A rows through the view).
- Negative: no session binding (`current_business_id()` unset) → fail-closed (uuid cast guard from M0).

### 2. Ledger invariant (unbalanced rejected)
- Covered by deferred constraint trigger `ledger_balance_check` (scoped per touched `txn_id`, checked at COMMIT).
- Cases: balanced multi-row insert commits; single-leg insert fails at commit; 1-cent-off fails; update that unbalances fails; pre-existing M1 seed txn untouched by write still commits (scoped trigger, no full-table scan).
- Runnable: `qa/sql/ledger_tax_checks.sql` (plain psql, no pgTAP dependency).

### 3. 13-province tax matrix (QC QST on base + NS rate)
2026 combined single-rate bps applied as `floor(subtotal * bps / 10000)` (`tax_for` in `backend/sales/flow.py`). Matrix (subtotal $100.00 → expected tax cents):

| Prov | HST/GST+PST | bps | $100 tax |
|------|-------------|-----|----------|
| ON 13% HST | 1300 | 1300 |
| NB/NS/NL/PEI 15% HST | 1500 | 1500 |
| QC GST 5% + QST 9.975% on **base** (not compounded) = 14.975% | 1498* | 1497 |
| MB 5% GST + 7% PST | 1200 | 1200 |
| SK 5% + 6% | 1100 | 1100 |
| BC 5% + 7% | 1200 | 1200 |
| AB/NT/NU/YT 5% GST | 500 | 500 |

\* QC stored as single combined bps 1498 → floor(10000*1498/10000)=1498, but true QST-on-base = 500+997=1497. **Known 1-cent QC rounding risk:** gate requires taxes-table row per component (GST row + QST-on-base row) rather than single combined bps for QC; runnable check asserts `tax_for(10000 QC combined) ∈ {1497,1498}` and flags which. NS rate = 1500 (15% HST since 2016) — assert explicitly, do not accept 1300 fallback.
- Edge: subtotal 1 cent × highest rate → 0 (floor); negative subtotal/rate raises; `FALLBACK_TAX_BPS` only when taxes table has no row — fail test if fallback used for a province that has a row.

### 4. Quote → Order → Invoice → Payment flow
- Legal: draft→sent→accepted; open→reserved→shipped; unpaid→paid|overdue. Illegal jumps (draft→accepted, open→shipped, shipped→cancelled, paid→unpaid) must raise.
- `reserve_stock` proc: oversell refused (held+p_qty > on_hand), re-reserve re-checked after upsert, qty≤0 rejected, missing inventory row → FK error. Never raw-INSERT reservations.
- End-to-end: create quote (lines sum = `quote_total`), accept → order → reserve → ship → `invoice_total(subtotal+tax)` → pay. Money integer cents only, no floats.

### 5. Alert dedupe (no duplicate VENDOR_ORDER_PENDING when is_dismissed=0)
- Seed low-stock item (level < reorder_point, `is_dismissed=0`): exactly 1 active `VENDOR_ORDER_PENDING` alert row per (business, item).
- Re-run reorder check 3×: still 1 row (upsert/no-op, no duplicate insert).
- Dismiss (`is_dismissed=1`) → re-breach creates new alert; resolve (level back above point) → no active alert.

### 6. Backup/restore drill (Postgres on VPS)
1. `pg_dump -Fc kounta > kounta-$(date +%F).dump` on VPS; record size + sha256.
2. Restore to scratch DB: `pg_restore -d kounta_restore`; run `qa/sql/ledger_tax_checks.sql` read-only asserts + row counts per tenant table.
3. Point-in-time: confirm WAL archiving on; test-restore latest base + WAL to T-15min, verify newest `orders.created_at` ≤ expected.
4. Rollback: keep previous dump + migration down/forward-fix note; RTO target <30min, RPO <15min. Drill monthly, log date in release notes.

## P1 — release-note blockers
- Oversell under concurrency (two simultaneous `reserve_stock` on last unit → exactly one wins; relies on `FOR UPDATE` row lock).
- Expired quote cannot convert; cancelled order releases reservation.
- RLS on future tables: any new tenant table without `FORCE RLS` + `tenant_isolation` policy fails gate review.

## What passes now vs blocked
- **Passes now (no DB needed):** pure-domain checks mirrored in `qa/sql/ledger_tax_checks.sql` comments + `flow.py` logic reviewed (transitions, floor tax, reservation guard shape).
- **Blocked on Lin (backend/DB live):** runnable SQL against real Postgres (ledger trigger at COMMIT, RLS session binding, `reserve_stock` oversell, alert dedupe, backup/restore drill).
- **Blocked on Pixel (frontend):** Playwright smoke list in `qa/smoke.playwright.md` (login, create shop, quote, convert, invoice) — steps defined, not yet executed.

## Rollback / migration notes
- Migrations 001–004 are additive (`IF NOT EXISTS`); rollback = restore pre-migration dump, no destructive down-migration claimed.
- If live DB holds unbalanced M1 seed txn, Janus must delete/rebalance it before M2 trigger enforces at commit (trigger is scoped, but new writes to that txn will fail).
