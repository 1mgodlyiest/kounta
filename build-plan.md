# Kounta — Build Plan (Milestones + Acceptance)

## M0 Tenancy walls
- Tasks: add business_id to all tenant tables, enable RLS, session binding middleware.
- Accept: test A creates 2 businesses, A cannot SELECT B rows; unauthenticated gets zero rows.

## M1 Invisible ledger
- Tasks: txn writer writes balanced entries (cents integer), DB CHECK sum=0 per txn, app-level reject.
- Accept: unbalanced insert fails; penny-off fails; happy path creates audit trail.

## M2 Sales pipeline
- Tasks: quotes with province tax calc → orders reserve stock → shipments with tracking → invoices → payments.
- Accept: quote→order→ship→invoice→pay e2e passes; double-sell prevented (stock reservation).

## M3 Inventory
- Tasks: perpetual levels, avg cost, reorder_point alerts.
- Accept: sell drops qty; at reorder_point-1 alert fires.

## M4 Dashboard + Watchdogs
- Tasks: red/orange feed, one-click actions (reminder email), cron: 6-hr supplier check, delivery check, contract expiry.
- Accept: jobs fire on schedule in staging; buttons resolve alerts without nav.

## M5 CRA tax
- Tasks: rate map per province, ITC split on expenses, GST34 report (sales, tax collected, ITCs, owing).
- Accept: sample Ontario/Quebec invoices match expected HST/QST; GST34 totals reconcile to ledger.

## Git
All to main via Janus gate after Momus review + tests green + Leas approval.
