# Kounta – PLAN (lean)

Shared repo: `/mnt/storage/Creators Courts/Creator Court - shared/kounta`, branch `main`.

## Stack
Keep existing repo stack. Add tests per step. No secrets in repo.

## Schema (Step 2: company_id)
- Every business table gets `company_id` (FK → companies.id, indexed, not null where applicable).
- Migration-first, test-first.

## File tasks
1. Vitruvius: this PLAN.md (done)
2. Thoth: CHANGELOG.md entry
3. Hephaestus: models + migrations + APIs for company_id, with tests
4. Arachne: UI for company switch / list filtering, with tests
5. Momus: review each drop
6. Janus: gate + commit + push every step

## Test criteria / gates
- Tests prove done. No merge to main without Momus approval + Janus gate.
- Clean `git status`, no secrets.

Owner approval needed to build off this drawing.
