#!/usr/bin/env node
/**
 * Writes vercel.json: redirects for "/" that pick the language on Vercel's
 * edge, before any page loads.
 *   1. a saved choice (cookie "lang", set by the EN · PT · ES switch) wins;
 *   2. otherwise the visitor's country (Vercel's x-vercel-ip-country header):
 *      Portuguese- or Spanish-speaking countries get /pt/ or /es/, every
 *      other country gets /en/ (lists in src/i18n/regions.json).
 * Run it after editing regions.json:  node scripts/gen-vercel-json.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const regions = JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/regions.json"), "utf8"));
const LANGS = ["en", "pt", "es"];
const noCookie = [{ type: "cookie", key: "lang" }];

const redirects = [
  ...LANGS.map((l) => ({ source: "/", has: [{ type: "cookie", key: "lang", value: l }], destination: `/${l}/`, permanent: false })),
  ...["pt", "es"].flatMap((l) =>
    regions[l].countries.map((c) => ({
      source: "/",
      has: [{ type: "header", key: "x-vercel-ip-country", value: c }],
      missing: noCookie,
      destination: `/${l}/`,
      permanent: false,
    })),
  ),
  { source: "/", has: [{ type: "header", key: "x-vercel-ip-country" }], missing: noCookie, destination: "/en/", permanent: false },
];

const out = { $schema: "https://openapi.vercel.sh/vercel.json", redirects };
fs.writeFileSync(path.join(ROOT, "vercel.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`vercel.json: ${redirects.length} redirects`);
