import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const gs = vm.createContext({});
for (const f of ["Config.gs", "Stock.gs", "DemoData.gs"]) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), gs, { filename: f });
}
const S = { windowDays: 30, bufferDays: 7, soonDays: 7, coverDays: 45 };

test("computeStockRow: the three statuses", () => {
  // 3 units/day, lead time 14 → reorder below 14 + 7 = 21 days of cover
  const now = gs.computeStockRow({ leadTime: 14, onHand: 60, unitsSold: 90 }, S); // 20 days
  assert.equal(now.status, "NOW");
  assert.equal(now.avgPerDay, 3);
  assert.equal(now.daysOfCover, 20);
  assert.equal(now.reorderPoint, 63);
  assert.equal(now.suggestedOrder, 3 * (14 + 45) - 60); // 117

  const soon = gs.computeStockRow({ leadTime: 14, onHand: 75, unitsSold: 90 }, S); // 25 days
  assert.equal(soon.status, "SOON");
  assert.equal(soon.suggestedOrder, 177 - 75);

  const ok = gs.computeStockRow({ leadTime: 14, onHand: 90, unitsSold: 90 }, S); // 30 days ≥ 28
  assert.equal(ok.status, "OK");
  assert.equal(ok.suggestedOrder, 0);
});

test("computeStockRow: boundaries", () => {
  // exactly lead + buffer days of cover is not "now" any more
  assert.equal(gs.computeStockRow({ leadTime: 14, onHand: 63, unitsSold: 90 }, S).status, "SOON"); // 21 days
  assert.equal(gs.computeStockRow({ leadTime: 14, onHand: 84, unitsSold: 90 }, S).status, "OK"); // 28 days
  assert.equal(gs.computeStockRow({ leadTime: 14, onHand: 0, unitsSold: 90 }, S).daysOfCover, 0);
});

test("computeStockRow: no sales", () => {
  const r = gs.computeStockRow({ leadTime: 10, onHand: 40, unitsSold: 0 }, S);
  assert.equal(r.status, "NO_SALES");
  assert.equal(r.daysOfCover, null);
  assert.equal(r.suggestedOrder, 0);
});

test("parseSalesRows: Shopify layout with order fields only on the first line item", () => {
  const rows = [
    ["Name", "Financial Status", "Created at", "Lineitem quantity", "Lineitem name", "Lineitem sku"],
    ["#1001", "paid", "2026-10-01 10:15:00 -0400", "2", "Cold brew bottle 1L", "SKU-2041"],
    ["#1001", "", "", "1", "Reusable straw set", "SKU-1180"],
    ["#1002", "refunded", "2026-10-02 09:00:00 -0400", "1", "Cold brew bottle 1L", "SKU-2041"],
    ["", "", "", "", "", ""],
    ["#1003", "paid", "2026-10-03", "x", "Bad qty", "SKU-9999"],
  ];
  const lines = gs.parseSalesRows(rows, gs.CONFIG.CSV_COLUMNS);
  assert.equal(lines.length, 3);
  assert.equal(lines[1].sku, "SKU-1180");
  assert.equal(lines[1].financialStatus, "paid", "inherits the order's status");
  assert.equal(lines[1].date.getDate(), 1, "inherits the order's date");
  assert.equal(lines[2].financialStatus, "refunded");
});

test("parseSalesRows: missing column gives a clear error", () => {
  assert.throws(() => gs.parseSalesRows([["Name", "Created at"], ["#1", "2026-10-01"]], gs.CONFIG.CSV_COLUMNS), /Lineitem quantity/);
});

test("unitsSoldBySku: window excludes today, old sales and refunds", () => {
  const today = new Date(2026, 9, 14, 7);
  const L = (d, sku, q, st = "paid") => ({ date: new Date(2026, 9, d, 12), sku, quantity: q, financialStatus: st });
  const lines = [L(14, "A", 5), L(13, "A", 2), L(1, "A", 3), L(14 - 31, "A", 100), L(10, "A", 4, "refunded"), L(10, "B", 1)];
  const sold = gs.unitsSoldBySku(lines, today, 30, gs.CONFIG.EXCLUDED_STATUSES);
  assert.equal(sold.A, 5); // 13th (2) + 1st (3)
  assert.equal(sold.B, 1);
});

test("parseStockSettings validates numbers", () => {
  const ok = gs.parseStockSettings(gs.CONFIG.SETTINGS_DEFAULTS);
  assert.equal(ok.bufferDays, 7);
  assert.equal(ok.coverDays, 45);
  assert.equal(ok.hour, 7);
  assert.throws(() => gs.parseStockSettings({ ...gs.CONFIG.SETTINGS_DEFAULTS, "Daily check hour (0-23)": 25 }), /Daily check hour/);
});

test("buildAlertEmail lists now and soon, escapes HTML", () => {
  const mail = gs.buildAlertEmail(
    [
      { sku: "A", product: "Cups <500>", onHand: 4, daysOfCover: 2, leadTime: 10, suggestedOrder: 50, status: "NOW" },
      { sku: "B", product: "Tea", onHand: 40, daysOfCover: 20, leadTime: 14, suggestedOrder: 30, status: "SOON" },
    ],
    "https://sheet",
  );
  assert.equal(mail.subject, "Stock check: 1 to reorder now, 1 soon");
  assert.match(mail.htmlBody, /Cups &lt;500&gt;/);
  assert.match(mail.body, /REORDER NOW\n- A Cups <500>: 2 days of cover, lead time 10 d, order 50/);
});

test("demo store: deterministic, parseable, and shows every status", () => {
  const today = new Date(2026, 9, 14);
  const a = gs.makeDemoStore(7, today, 35);
  const b = gs.makeDemoStore(7, today, 35);
  assert.equal(gs.toCsv(a.csv), gs.toCsv(b.csv));
  const lines = gs.parseSalesRows(a.csv, gs.CONFIG.CSV_COLUMNS);
  assert.ok(lines.length > 500);
  const sold = gs.unitsSoldBySku(lines, today, 30, gs.CONFIG.EXCLUDED_STATUSES);
  const statuses = new Set(
    a.stock.map(([sku, , , lead, onHand]) => gs.computeStockRow({ leadTime: lead, onHand, unitsSold: sold[sku] || 0 }, S).status),
  );
  for (const s of ["NOW", "SOON", "OK", "NO_SALES"]) assert.ok(statuses.has(s), `missing ${s}`);
});
