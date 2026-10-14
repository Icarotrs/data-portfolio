#!/usr/bin/env node
/**
 * Sends the sample Shopify orders in ./test-orders to the workflow's webhook,
 * the same way Shopify would. Needs Node 18+ (built-in fetch).
 *
 *   node send-test-orders.mjs http://localhost:5678/webhook-test/shopify-order
 */
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node send-test-orders.mjs <webhook URL>");
  process.exit(1);
}
const dir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "test-orders");

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const body = fs.readFileSync(path.join(dir, file), "utf8");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shopify-topic": "orders/create",
      "x-shopify-shop-domain": "your-store.myshopify.com",
    },
    body,
  });
  console.log(`${file}: ${res.status} ${res.statusText}`);
}
