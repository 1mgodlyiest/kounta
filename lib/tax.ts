// Slice 2: 13-province Canadian tax, cents-exact. rateBps = basis points (e.g. 500 = 5%).
export const TAX_TABLE: Record<string, { name: string; rateBps: number }> = {
  ON: { name: "Ontario", rateBps: 1300 },
  QC: { name: "Quebec", rateBps: 1498 },
  BC: { name: "British Columbia", rateBps: 1200 },
  AB: { name: "Alberta", rateBps: 500 },
  MB: { name: "Manitoba", rateBps: 1200 },
  SK: { name: "Saskatchewan", rateBps: 1100 },
  NS: { name: "Nova Scotia", rateBps: 1500 },
  NB: { name: "New Brunswick", rateBps: 1500 },
  NL: { name: "Newfoundland and Labrador", rateBps: 1500 },
  PE: { name: "Prince Edward Island", rateBps: 1500 },
  NT: { name: "Northwest Territories", rateBps: 500 },
  YT: { name: "Yukon", rateBps: 500 },
  NU: { name: "Nunavut", rateBps: 500 },
};
export function taxCents(subtotalCents: number, province: string): number {
  const row = TAX_TABLE[province];
  if (!row) throw new Error(`unknown province ${province}`);
  return Math.round((subtotalCents * row.rateBps) / 10000);
}
export function totalWithTax(subtotalCents: number, province: string): number {
  return subtotalCents + taxCents(subtotalCents, province);
}
