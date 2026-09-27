import { describe, expect, it } from "vitest";
import { calculateCanadianTax, TAX_TABLE } from "@/src/lib/tax";

describe("tax matrix", () => {
  it("covers 13 jurisdictions", () => {
    expect(TAX_TABLE).toHaveLength(13);
  });
  it("ON HST 13% on $100.00", () => {
    expect(calculateCanadianTax(10000, "ON").totalCents).toBe(1300);
  });
  it("QC GST+QST stacks", () => {
    const r = calculateCanadianTax(10000, "QC");
    expect(r.gstCents).toBe(500);
    expect(r.pstCents).toBe(997);
    expect(r.totalCents).toBe(1497);
  });
  it("AB GST-only 5%", () => {
    expect(calculateCanadianTax(10000, "AB").totalCents).toBe(500);
  });
  it("cents-only: 1 cent truncates to 0", () => {
    expect(calculateCanadianTax(1, "ON").totalCents).toBe(0);
  });
  it("rejects unknown province + negative subtotal", () => {
    expect(() => calculateCanadianTax(100, "XX")).toThrow();
    expect(() => calculateCanadianTax(-1, "ON")).toThrow();
  });
});
