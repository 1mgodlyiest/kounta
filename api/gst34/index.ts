// Slice 2: GST34 stub, scoped WHERE company_id. Sums tax_cents per company.
import { scopeByCompany } from "../../lib/auth.js";
export function gst34Summary(invoices: { company_id: string; tax_cents: number }[], company_id: string) {
  const mine = scopeByCompany(invoices, company_id); // WHERE company_id = $session_company_id
  return { company_id, invoice_count: mine.length, total_tax_cents: mine.reduce((s, i) => s + i.tax_cents, 0) };
}
