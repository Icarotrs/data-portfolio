#!/usr/bin/env node
// Writes the fictitious store data to demo-data/ (same generator as setupDemo):
//   demo-data/orders-export.csv   35 days of orders in Shopify's export layout
//   demo-data/stock.csv           the Stock tab inputs (SKU … On hand)
//
//   node scripts/make-demo-csv.mjs [--seed=7] [--today=2026-10-14]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const seed = Number(arg("seed", 7));
const [y, m, d] = arg("today", new Date().toISOString().slice(0, 10)).split("-").map(Number);

const gs = vm.createContext({});
for (const f of ["Config.gs", "DemoData.gs"]) vm.runInContext(fs.readFileSync(path.join(ROOT, "src", f), "utf8"), gs);
const demo = gs.makeDemoStore(seed, new Date(y, m - 1, d), 35);

const out = path.join(ROOT, "demo-data");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "orders-export.csv"), gs.toCsv(demo.csv));
fs.writeFileSync(path.join(out, "stock.csv"), gs.toCsv([["SKU", "Product", "Supplier", "Lead time (days)", "On hand"], ...demo.stock]));
console.log(`demo-data/orders-export.csv  ${demo.csv.length - 1} line items`);
console.log(`demo-data/stock.csv          ${demo.stock.length} products`);
