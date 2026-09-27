// Province tax preview for UI (float dollars). Rate source of truth is
// src/lib/tax.ts (Lin, integer-cents); PROVINCES derives from it — keep both.
import { TAX_TABLE } from "../src/lib/tax";

export type Province = "ON" | "QC" | "BC" | "AB" | "MB" | "SK" | "NS" | "NB" | "NL" | "PE" | "NT" | "YT" | "NU";

export const PROVINCES: Province[] = TAX_TABLE.map((t) => t.province as Province);

export interface TaxBreakdown {
  lines: { label: string; rate: number; amount: number }[];
  total: number;
}

export function taxFor(subtotal: number, province: Province): TaxBreakdown {
  const r = (n: number) => Math.round(n * 100) / 100;
  switch (province) {
    case "ON": return { lines: [{ label: "HST 13%", rate: 0.13, amount: r(subtotal * 0.13) }], total: r(subtotal * 1.13) };
    case "QC": {
      const gst = r(subtotal * 0.05), qst = r(subtotal * 0.09975);
      return { lines: [{ label: "GST 5%", rate: 0.05, amount: gst }, { label: "QST 9.975%", rate: 0.09975, amount: qst }], total: r(subtotal + gst + qst) };
    }
    case "BC": case "MB": case "SK": {
      const gst = r(subtotal * 0.05);
      const pstRate = province === "BC" ? 0.07 : province === "MB" ? 0.07 : 0.06;
      const pst = r(subtotal * pstRate);
      return { lines: [{ label: "GST 5%", rate: 0.05, amount: gst }, { label: `PST ${pstRate * 100}%`, rate: pstRate, amount: pst }], total: r(subtotal + gst + pst) };
    }
    case "AB": case "NT": case "YT": case "NU":
      return { lines: [{ label: "GST 5%", rate: 0.05, amount: r(subtotal * 0.05) }], total: r(subtotal * 1.05) };
    default: {
      const hstRate = 0.15;
      return { lines: [{ label: `HST 15%`, rate: hstRate, amount: r(subtotal * hstRate) }], total: r(subtotal * (1 + hstRate)) };
    }
  }
}

export function demo(): void {
  const t = taxFor(100, "ON");
  console.assert(t.total === 113, "ON HST failed");
  const q = taxFor(100, "QC");
  console.assert(Math.abs(q.total - 114.98) < 0.01, "QC failed");
}
