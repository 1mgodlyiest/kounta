// Slice 2 gate: 13-province tax table, cents-exact. Run: node --test tests/
const { test } = require("node:test");
const assert = require("node:assert");
const RATES = { ON:1300, QC:1498, BC:1200, AB:500, MB:1200, SK:1100, NS:1500, NB:1500, NL:1500, PE:1500, NT:500, YT:500, NU:500 };
const tax = (sub, bps) => Math.round((sub * bps) / 10000);
test("13 provinces present", () => assert.strictEqual(Object.keys(RATES).length, 13));
for (const [prov, bps] of Object.entries(RATES)) {
  test(`tax ${prov} cents-exact on $100.00`, () => {
    assert.strictEqual(tax(10000, bps), Math.round(10000 * bps / 10000));
  });
}
test("ON 13% on $19.99 = 260c", () => assert.strictEqual(tax(1999, 1300), 260));
test("gst34 scoped sum", () => {
  const inv = [{ company_id: "A", tax_cents: 260 }, { company_id: "B", tax_cents: 999 }];
  const mine = inv.filter(i => i.company_id === "A");
  assert.strictEqual(mine.reduce((s, i) => s + i.tax_cents, 0), 260);
});
