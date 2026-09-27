import { scopeByCompany } from "../../lib/auth";
// GET /api/quotes — always scoped WHERE company_id = session
export function listQuotes(rows: { company_id: string }[], session_company_id: string) {
  return scopeByCompany(rows as any, session_company_id);
}
