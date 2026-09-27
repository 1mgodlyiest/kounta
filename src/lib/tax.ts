// Canadian sales tax table, 2026. Rates in basis points (1/100 of 1%).
// HST provinces charge a single harmonized rate; the rest split GST + PST/QST.
// Source of truth for seeds (drizzle/0001) and calculateCanadianTax().
export interface ProvinceTax {
  province: string; // 2-letter code
  gstBps: number;
  pstBps: number; // PST or QST, 0 where none
  hstBps: number; // HST, 0 where split system
  kind: "HST" | "GST+PST" | "GST+QST" | "GST";
}

export const TAX_TABLE: ProvinceTax[] = [
  { province: "ON", gstBps: 0, pstBps: 0, hstBps: 1300, kind: "HST" },
  { province: "NB", gstBps: 0, pstBps: 0, hstBps: 1500, kind: "HST" },
  { province: "NS", gstBps: 0, pstBps: 0, hstBps: 1500, kind: "HST" },
  { province: "PE", gstBps: 0, pstBps: 0, hstBps: 1500, kind: "HST" },
  { province: "NL", gstBps: 0, pstBps: 0, hstBps: 1500, kind: "HST" },
  { province: "QC", gstBps: 500, pstBps: 997, hstBps: 0, kind: "GST+QST" },
  { province: "BC", gstBps: 500, pstBps: 700, hstBps: 0, kind: "GST+PST" },
  { province: "SK", gstBps: 500, pstBps: 600, hstBps: 0, kind: "GST+PST" },
  { province: "MB", gstBps: 500, pstBps: 700, hstBps: 0, kind: "GST+PST" },
  { province: "AB", gstBps: 500, pstBps: 0, hstBps: 0, kind: "GST" },
  { province: "NT", gstBps: 500, pstBps: 0, hstBps: 0, kind: "GST" },
  { province: "YT", gstBps: 500, pstBps: 0, hstBps: 0, kind: "GST" },
  { province: "NU", gstBps: 500, pstBps: 0, hstBps: 0, kind: "GST" },
];

export interface TaxBreakdown {
  gstCents: number;
  pstCents: number; // PST or QST
  hstCents: number;
  totalCents: number;
}

/** Integer-cents-only Canadian tax. Floor truncation, no floats. */
export function calculateCanadianTax(
  subtotalCents: number,
  province: string,
): TaxBreakdown {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0)
    throw new Error("subtotalCents must be a non-negative integer");
  const row = TAX_TABLE.find((t) => t.province === province);
  if (!row) throw new Error(`unknown province: ${province}`);
  // ponytail: floor truncation; switch to half-up rounding only if CRA ruling requires it
  const gstCents = Math.floor((subtotalCents * row.gstBps) / 10_000);
  const pstCents = Math.floor((subtotalCents * row.pstBps) / 10_000);
  const hstCents = Math.floor((subtotalCents * row.hstBps) / 10_000);
  return { gstCents, pstCents, hstCents, totalCents: gstCents + pstCents + hstCents };
}
