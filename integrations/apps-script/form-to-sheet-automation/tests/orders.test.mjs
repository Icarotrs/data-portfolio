import { test } from "node:test";
import assert from "node:assert/strict";
import { FakeSheet, load } from "./harness.mjs";

const COLS = 13;
const FORMULA = "=FORMULA"; // stands in for the ARRAYFORMULA output in H, I, M

function setup(rows = 6) {
  const orders = new FakeSheet("Orders", rows, COLS);
  orders.values[0] = ["Received", "Order ID", "Customer", "Email", "Phone", "Product", "Quantity", "Unit price", "Total", "Status", "Delivery date", "Notes", "Week"];
  for (let r = 1; r < rows; r++) {
    orders.values[r][7] = FORMULA;
    orders.values[r][8] = FORMULA;
    orders.values[r][12] = FORMULA;
  }
  const products = new FakeSheet("Products", 4, 2);
  products.values = [["Product", "Unit price"], ["Tea sampler", 18], ["Paper cups (500)", 38.5], ["", ""]];
  const gs = load({ sheets: { Orders: orders, Products: products } });
  return { gs, orders };
}

const answers = (over = {}) => ({
  name: " ana  carter ",
  email: "ana@example.com",
  phone: "555 123 4567",
  product: "tea sampler",
  quantity: "2",
  deliveryDate: "2026-10-30",
  notes: "",
  ...over,
});

test("writes only input columns; formula columns stay untouched", () => {
  const { gs, orders } = setup();
  const res = gs.processSubmission(answers(), new Date(2026, 9, 14, 9));
  assert.equal(res.row, 2);
  assert.equal(res.orderId, "ORD-0001");
  const row = orders.values[1];
  assert.equal(row[1], "ORD-0001");
  assert.equal(row[2], "Ana Carter");
  assert.equal(row[5], "Tea sampler");
  assert.equal(row[6], 2);
  assert.equal(row[9], "New");
  assert.equal(row[7], FORMULA);
  assert.equal(row[8], FORMULA);
  assert.equal(row[12], FORMULA);
  // Every write landed in A:G or J:L
  for (const w of orders.writes) {
    const cols = Array.from({ length: w.width }, (_, i) => w.col + i);
    assert.ok(cols.every((c) => (c >= 1 && c <= 7) || (c >= 10 && c <= 12)), `wrote to columns ${cols}`);
  }
});

test("consecutive submissions get consecutive rows and IDs", () => {
  const { gs, orders } = setup();
  const r1 = gs.processSubmission(answers(), new Date());
  const r2 = gs.processSubmission(answers({ name: "james kim" }), new Date());
  const r3 = gs.processSubmission(answers({ name: "mei patel" }), new Date());
  assert.deepEqual([r1.row, r2.row, r3.row], [2, 3, 4]);
  assert.deepEqual([r1.orderId, r2.orderId, r3.orderId], ["ORD-0001", "ORD-0002", "ORD-0003"]);
  assert.equal(orders.values[3][2], "Mei Patel");
});

test("continues after the highest existing ID, even with gaps", () => {
  const { gs, orders } = setup();
  orders.values[1][1] = "ORD-0007";
  orders.values[2][1] = "ORD-0003";
  const r = gs.processSubmission(answers(), new Date());
  assert.equal(r.row, 4);
  assert.equal(r.orderId, "ORD-0008");
});

test("adds rows when the table is full", () => {
  const { gs, orders } = setup(3); // header + 2 rows
  gs.processSubmission(answers(), new Date());
  gs.processSubmission(answers(), new Date());
  const r = gs.processSubmission(answers(), new Date());
  assert.equal(r.row, 4);
  assert.ok(orders.getMaxRows() > 3);
  assert.equal(orders.values[3][1], "ORD-0003");
});

test("problems are written as a note on the Order ID cell", () => {
  const { gs, orders } = setup();
  const r = gs.processSubmission(answers({ product: "Unicorn", quantity: "lots" }), new Date());
  assert.equal(r.problems.length, 2);
  assert.match(orders.notes[`${r.row},2`], /Unknown product: "Unicorn"; Quantity is not a whole number/);
});

test("the lock is always released, even when writing fails", () => {
  const { gs } = setup();
  gs.processSubmission(answers(), new Date());
  assert.equal(gs.__lock.acquired, 1);
  assert.equal(gs.__lock.released, 1);

  const broken = load({ sheets: { Orders: null, Products: null } });
  assert.throws(() => broken.processSubmission(answers(), new Date()));
  assert.equal(broken.__lock.held, false);
  assert.equal(broken.__lock.released, 1);
});

test("a submission that can't get the lock is not written", () => {
  const orders = new FakeSheet("Orders", 4, COLS);
  const products = new FakeSheet("Products", 2, 2);
  const gs = load({
    sheets: { Orders: orders, Products: products },
    lock: { waitLock() { throw new Error("Lock timeout"); }, releaseLock() {} },
  });
  assert.throws(() => gs.processSubmission(answers(), new Date()), /Lock timeout/);
  assert.equal(orders.writes.length, 0);
});
