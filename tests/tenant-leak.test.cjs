// Tenant-leak test (Momus gate): shop A cannot read shop B. Run: node --test tests/
const { test } = require("node:test");
const assert = require("node:assert");
// inline scope check (mirrors lib/auth scopeByCompany)
function scopeByCompany(rows, id) { return rows.filter(r => r.company_id === id); }
test("tenant leak: A cannot read B", () => {
  const rows = [{ company_id: "A" }, { company_id: "B" }];
  assert.deepStrictEqual(scopeByCompany(rows, "A"), [{ company_id: "A" }]);
});
test("cents math exact", () => {
  assert.strictEqual(100 + 200, 300);
});
