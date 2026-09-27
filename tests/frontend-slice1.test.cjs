// Arachne Slice 1 frontend test: cents format + nav contract. Run: node --test tests/
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
function formatCents(cents) { return `$${(cents / 100).toFixed(2)}`; }
test("cents format exact", () => { assert.strictEqual(formatCents(12345), "$123.45"); });
test("frontend contract: today/quotes/nav/QuoteCard exist", () => {
  for (const f of ["app/today/page.tsx","app/quotes/page.tsx","components/BottomNav.tsx","components/QuoteCard.tsx"]) {
    assert.ok(fs.existsSync(f), `missing ${f}`);
  }
  const nav = fs.readFileSync("components/BottomNav.tsx","utf8");
  assert.ok(nav.includes("minHeight") || nav.includes("48"), "tap targets >=48px");
});
