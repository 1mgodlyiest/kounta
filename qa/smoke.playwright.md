# Playwright smoke list (blocked on Pixel — steps defined, not executed)

Run once Pixel lands frontend. Minimal: `npx playwright test qa/smoke.spec.ts` (spec to be added when UI routes exist; list below is the contract).

1. **Login** — sign in as seeded tenant user; expect shop dashboard, no cross-tenant shops visible.
2. **Create shop** — new shop appears in list; reload persists.
3. **Create quote** — add 2 lines (qty × price), subtotal = sum; tax per province (try ON + QC); total = subtotal + tax.
4. **Convert quote → order** — status accepted → order open; stock reserved (available decreases); oversell qty rejected with error.
5. **Invoice + payment** — invoice from shipped order, total matches; mark paid; overdue path visible for unpaid past-due.
6. **Alert dedupe glance** — low-stock item shows exactly one VENDOR_ORDER_PENDING badge after refresh ×3.

Record: browser, tenant used, pass/fail per step, screenshot on failure. No framework bloat: single spec file, no page-object layer until >10 specs.
