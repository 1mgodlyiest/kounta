import { scopeByCompany } from "../../lib/auth";
export function listInvoices(rows: { company_id: string }[], session_company_id: string) {
  return scopeByCompany(rows as any, session_company_id);
}
export function centsAdd(a: number, b: number) { return Math.round(a) + Math.round(b); } // cents math exact
