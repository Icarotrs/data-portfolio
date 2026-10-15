import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const gs = load();
const ymd = (d) => (d ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` : null);

test("cleanText trims and collapses spaces", () => {
  assert.equal(gs.cleanText("  a   b \n c "), "a b c");
  assert.equal(gs.cleanText(null), "");
  assert.equal(gs.cleanText(42), "42");
});

test("titleCaseName", () => {
  assert.equal(gs.titleCaseName("  maria   DE souza "), "Maria de Souza");
  assert.equal(gs.titleCaseName("o'neil"), "O'Neil");
  assert.equal(gs.titleCaseName("ANNE-marie smith"), "Anne-Marie Smith");
  assert.equal(gs.titleCaseName("de la cruz"), "De la Cruz"); // a particle at the start is capitalized
});

test("normalizeEmail", () => {
  assert.equal(gs.normalizeEmail("  Ana.Carter@Example.COM "), "ana.carter@example.com");
  assert.equal(gs.normalizeEmail("not an email"), "");
  assert.equal(gs.normalizeEmail("a@b"), "");
});

test("normalizePhone: US formats become (555) 123-4567", () => {
  for (const input of ["555-123-4567", "(555)123 4567", "+1 5551234567", "5551234567", "1 555 123 4567"]) {
    assert.equal(gs.normalizePhone(input), "(555) 123-4567", input);
  }
  assert.equal(gs.normalizePhone("+44 20 7946 0958"), "+442079460958");
  assert.equal(gs.normalizePhone("123"), "");
});

test("normalizeDate: mixed formats", () => {
  assert.equal(ymd(gs.normalizeDate("2026-10-21")), "2026-10-21");
  assert.equal(ymd(gs.normalizeDate("10/21/2026")), "2026-10-21");
  assert.equal(ymd(gs.normalizeDate("10/21/26")), "2026-10-21");
  assert.equal(ymd(gs.normalizeDate("Oct 21, 2026")), "2026-10-21");
  assert.equal(ymd(gs.normalizeDate("October 21st 2026")), "2026-10-21");
  assert.equal(ymd(gs.normalizeDate("21 Oct 2026")), "2026-10-21");
  assert.equal(ymd(gs.normalizeDate(new Date(2026, 9, 21, 15, 30))), "2026-10-21");
  assert.equal(gs.normalizeDate("02/31/2026"), null, "overflow rejected");
  assert.equal(gs.normalizeDate("next tuesday"), null);
  assert.equal(gs.normalizeDate(""), null);
});

test("parseQuantity", () => {
  assert.equal(gs.parseQuantity("3"), 3);
  assert.equal(gs.parseQuantity(" 3 units"), 3);
  assert.equal(gs.parseQuantity(7), 7);
  assert.equal(gs.parseQuantity("0"), null);
  assert.equal(gs.parseQuantity("three"), null);
  assert.equal(gs.parseQuantity("-2"), null);
});

test("cleanSubmission: messy but valid input has no problems", () => {
  const { record, problems } = gs.cleanSubmission(
    {
      name: "  priya   PATEL ",
      email: " Priya.Patel@Example.com",
      phone: "555.123.4567",
      product: "coffee beans 1 kg",
      quantity: "2 units",
      deliveryDate: "11/02/26",
      notes: "  call   first ",
    },
    ["Coffee beans 1 kg", "Tea sampler"],
  );
  assert.deepEqual([...problems], []);
  assert.equal(record.name, "Priya Patel");
  assert.equal(record.email, "priya.patel@example.com");
  assert.equal(record.phone, "(555) 123-4567");
  assert.equal(record.product, "Coffee beans 1 kg", "matched to the catalog's spelling");
  assert.equal(record.quantity, 2);
  assert.equal(ymd(record.deliveryDate), "2026-11-2");
  assert.equal(record.notes, "call first");
});

test("cleanSubmission: bad values are kept and reported", () => {
  const { record, problems } = gs.cleanSubmission(
    { name: "", email: "nope", phone: "12", product: "Unicorn", quantity: "lots", deliveryDate: "soon" },
    ["Tea sampler"],
  );
  assert.equal(problems.length, 6);
  assert.equal(record.email, "nope", "raw value kept so nothing is lost");
  assert.equal(record.quantity, "lots");
});

test("parseRecipients and parseSchedule", () => {
  assert.deepEqual([...gs.parseRecipients("a@x.com, bad; B@Y.org\nc@z.net")], ["a@x.com", "b@y.org", "c@z.net"]);
  const s = gs.parseSchedule({ "Report day": "monday", "Report hour (0-23)": 8 });
  assert.equal(s.dayName, "MONDAY");
  assert.equal(s.hour, 8);
  assert.throws(() => gs.parseSchedule({ "Report day": "Funday", "Report hour (0-23)": 8 }));
  assert.throws(() => gs.parseSchedule({ "Report day": "MONDAY", "Report hour (0-23)": 24 }));
});

test("makeDemoAnswers is deterministic and every answer cleans without problems", () => {
  const products = ["Coffee beans 1 kg", "Paper cups (500)", "Tea sampler"];
  const now = new Date(2026, 9, 14, 12);
  const a = gs.makeDemoAnswers(50, 42, products, now);
  const b = gs.makeDemoAnswers(50, 42, products, now);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(a.length, 50);
  for (const { answers, receivedAt } of a) {
    assert.ok(receivedAt <= now && now - receivedAt <= 28 * 24 * 3600 * 1000);
    const { problems } = gs.cleanSubmission(answers, products);
    assert.deepEqual([...problems], [], JSON.stringify(answers));
  }
});
