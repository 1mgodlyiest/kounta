// Slice 2: jobs API stub, scoped WHERE company_id. No secrets.
import { scopeByCompany } from "../../lib/auth.js";
export function listJobs(rows: { company_id: string }[], company_id: string) {
  return scopeByCompany(rows, company_id); // WHERE company_id = $session_company_id
}
