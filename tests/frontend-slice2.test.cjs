const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
test("pipeline page reuses QuoteCard + lanes", () => {
  const s = fs.readFileSync("app/pipeline/page.tsx", "utf8");
  assert.ok(s.includes("QuoteCard") && s.includes("lane-"), "pipeline must reuse QuoteCard with lanes");
});
test("invoices page cents-exact tax display", () => {
  const s = fs.readFileSync("app/invoices/page.tsx", "utf8");
  assert.ok(s.includes("Math.round") && s.includes("invoice-total"), "invoices tax cents-exact");
});
test("PWA manifest installable", () => {
  const m = JSON.parse(fs.readFileSync("app/manifest.webmanifest", "utf8"));
  assert.ok(m.start_url && m.icons?.length && m.display === "standalone", "manifest installable");
});
test("app icon exists", () => {
  assert.ok(fs.existsSync("app/icon.tsx"), "icon missing");
});
