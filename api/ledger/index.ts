import { scopeByCompany } from "../../lib/auth";
export function listLedger(rows: { company_id: string }[], session_company_id: string) {
  return scopeByCompany(rows as any, session_company_id);
}
