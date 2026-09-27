import { db } from "@/src/db";
import { chartOfAccounts, taxRates } from "@/src/db/schema";
import { TAX_TABLE } from "@/src/lib/tax";

export const COA_SEED = [
  { code: "1000", name: "Cash", type: "asset" },
  { code: "1200", name: "Accounts Receivable", type: "asset" },
  { code: "1300", name: "Inventory", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "2150", name: "GST/HST Payable", type: "liability" },
  { code: "2160", name: "PST Payable", type: "liability" },
  { code: "2170", name: "QST Payable", type: "liability" },
  { code: "3000", name: "Opening Equity", type: "equity" },
  { code: "4000", name: "Sales Revenue", type: "revenue" },
  { code: "5000", name: "Cost of Goods Sold", type: "expense" },
  { code: "5010", name: "Operating Expenses", type: "expense" },
  { code: "5020", name: "Tax Expense", type: "expense" },
] as const;

/** Insert per-tenant CoA + 13-jurisdiction tax rows. Call once on tenant create. */
export async function seedTenant(tenantId: string) {
  await db.insert(chartOfAccounts).values(
    COA_SEED.map((a) => ({ tenantId, ...a })),
  );
  const taxRows = TAX_TABLE.flatMap((t) => {
    const rows: { tenantId: string; province: string; kind: string; rateBps: number }[] = [];
    if (t.hstBps) rows.push({ tenantId, province: t.province, kind: "HST", rateBps: t.hstBps });
    if (t.gstBps) rows.push({ tenantId, province: t.province, kind: "GST", rateBps: t.gstBps });
    if (t.pstBps)
      rows.push({ tenantId, province: t.province, kind: t.kind === "GST+QST" ? "QST" : "PST", rateBps: t.pstBps });
    return rows;
  });
  await db.insert(taxRates).values(taxRows);
}
