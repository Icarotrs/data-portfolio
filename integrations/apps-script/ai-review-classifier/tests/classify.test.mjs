import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const gs = vm.createContext({});
for (const f of ["Config.gs", "Classify.gs", "Runner.gs", "DemoData.gs"]) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), gs, { filename: f });
}
const plain = (x) => JSON.parse(JSON.stringify(x));

const SETTINGS = gs.parseClassifierSettings({ ...gs.CONFIG.SETTINGS_DEFAULTS });
const batch = [
  { id: "R-1", rating: 1, text: "Box was crushed." },
  { id: "R-2", rating: 5, text: "Arrived early!" },
];

test("settings: defaults are valid; bad values are rejected", () => {
  assert.equal(SETTINGS.provider, "Claude");
  assert.equal(SETTINGS.model, "claude-opus-5-5");
  assert.equal(SETTINGS.batchSize, 25);
  assert.equal(SETTINGS.threshold, 0.8);
  const base = { ...gs.CONFIG.SETTINGS_DEFAULTS };
  assert.throws(() => gs.parseClassifierSettings({ ...base, Provider: "Gemini" }), /Provider/);
  assert.throws(() => gs.parseClassifierSettings({ ...base, Provider: "OpenAI" }), /OpenAI model is required/);
  assert.throws(() => gs.parseClassifierSettings({ ...base, "Batch size": 0 }), /Batch size/);
  assert.equal(gs.parseClassifierSettings({ ...base, Provider: "OpenAI", "OpenAI model": "my-model" }).model, "my-model");
});

test("Claude request: headers, structured output schema, fallbacks, key not in body", () => {
  const req = gs.buildClaudeRequest(batch, SETTINGS, "sk-test");
  assert.equal(req.url, "https://api.anthropic.com/v1/messages");
  assert.equal(req.headers["x-api-key"], "sk-test");
  assert.equal(req.headers["anthropic-version"], "2023-06-01");
  assert.equal(req.headers["anthropic-beta"], "server-side-fallback-2026-07-01");
  const body = JSON.parse(req.payload);
  assert.equal(body.model, "claude-opus-5-5");
  assert.equal(body.fallbacks, "default");
  assert.equal(body.output_config.effort, "low");
  assert.equal(body.output_config.format.type, "json_schema");
  const item = body.output_config.format.schema.properties.results.items;
  assert.deepEqual(item.required, ["id", "topic", "sentiment", "summary", "confidence"]);
  assert.equal(item.additionalProperties, false);
  assert.deepEqual(item.properties.topic.enum, plain(gs.CONFIG.TOPICS));
  assert.ok(!("thinking" in body), "thinking can't be disabled on this model; effort controls depth");
  assert.ok(!req.payload.includes("sk-test"));
  const reviews = JSON.parse(body.messages[0].content.split("\n\n")[1]);
  assert.deepEqual(reviews, [{ id: "R-1", rating: 1, text: "Box was crushed." }, { id: "R-2", rating: 5, text: "Arrived early!" }]);
});

test("OpenAI request: strict json_schema response format", () => {
  const s = gs.parseClassifierSettings({ ...gs.CONFIG.SETTINGS_DEFAULTS, Provider: "OpenAI", "OpenAI model": "my-model" });
  const req = gs.buildOpenAIRequest(batch, s, "sk-o");
  assert.equal(req.url, "https://api.openai.com/v1/chat/completions");
  assert.equal(req.headers.Authorization, "Bearer sk-o");
  const body = JSON.parse(req.payload);
  assert.equal(body.model, "my-model");
  assert.equal(body.response_format.type, "json_schema");
  assert.equal(body.response_format.json_schema.strict, true);
});

const good = { results: [
  { id: "R-1", topic: "Packaging", sentiment: "negative", summary: "Crushed box", confidence: 0.95 },
  { id: "R-2", topic: "Delivery time", sentiment: "positive", summary: "Arrived early", confidence: 0.62 },
] };

test("parse Claude response: success, refusal, cut-off, bad JSON, HTTP errors", () => {
  const ok = gs.parseProviderResponse("Claude", 200, JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(good) }] }));
  assert.equal(ok.results.length, 2);
  assert.match(gs.parseProviderResponse("Claude", 200, JSON.stringify({ stop_reason: "refusal", content: [] })).error, /declined/);
  assert.match(gs.parseProviderResponse("Claude", 200, JSON.stringify({ stop_reason: "max_tokens", content: [] })).error, /cut off/);
  assert.match(gs.parseProviderResponse("Claude", 200, JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: "nope" }] })).error, /not valid JSON/);
  const rl = gs.parseProviderResponse("Claude", 429, JSON.stringify({ error: { type: "rate_limit_error", message: "slow down" } }));
  assert.equal(rl.retryable, true);
  assert.match(rl.error, /429 slow down/);
  assert.equal(gs.parseProviderResponse("Claude", 529, "{}").retryable, true);
  assert.equal(gs.parseProviderResponse("Claude", 401, JSON.stringify({ error: { message: "invalid x-api-key" } })).retryable, false);
  assert.equal(gs.parseProviderResponse("Claude", 502, "<html>").retryable, true);
});

test("parse OpenAI response", () => {
  const ok = gs.parseProviderResponse("OpenAI", 200, JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(good) } }] }));
  assert.equal(ok.results.length, 2);
  assert.match(gs.parseProviderResponse("OpenAI", 200, JSON.stringify({ choices: [{ message: { refusal: "no" } }] })).error, /declined/);
  assert.match(gs.parseProviderResponse("OpenAI", 200, JSON.stringify({ choices: [{ finish_reason: "length", message: {} }] })).error, /cut off/);
});

test("validateResults: low confidence flagged, missing and invalid items become errors", () => {
  const v = plain(gs.validateResults(batch, good.results, 0.8));
  assert.equal(v[0].ok, true);
  assert.equal(v[0].needsCheck, false);
  assert.equal(v[1].needsCheck, true, "0.62 < 0.8");

  const missing = plain(gs.validateResults(batch, [good.results[0]], 0.8));
  assert.equal(missing[1].ok, false);
  assert.match(missing[1].error, /No result/);

  const bad = plain(gs.validateResults(batch, [
    { id: "R-1", topic: "Weather", sentiment: "angry", summary: "", confidence: 87 },
    { id: "R-2", topic: "Other", sentiment: "neutral", summary: "x".repeat(200), confidence: 0.9 },
  ], 0.8));
  assert.equal(bad[0].ok, false);
  assert.match(bad[0].error, /unknown topic.*unknown sentiment.*confidence out of range.*empty summary/);
  assert.equal(bad[1].summary.length, 138);
});

test("processPending: stops before the deadline and reports what is left", () => {
  const pending = Array.from({ length: 100 }, (_, i) => ({ id: `R-${i}`, row: i + 2 }));
  let clock = 0;
  const now = () => clock;
  const written = [];
  // each batch takes 60 s; deadline 4.5 min → batches start at 0, 60, 120, 180 → 4 batches (the 5th would end at 300 > 270)
  const out = plain(gs.processPending(pending, 25, 270_000, now, (b) => { clock += 60_000; return b.map((r) => ({ id: r.id, ok: true })); }, (b) => written.push(b.length)));
  assert.deepEqual(out, { done: 100, remaining: 0 });

  clock = 0;
  const many = Array.from({ length: 250 }, (_, i) => ({ id: `R-${i}` }));
  const part = plain(gs.processPending(many, 25, 270_000, now, (b) => { clock += 60_000; return []; }, () => {}));
  assert.deepEqual(part, { done: 100, remaining: 150 });
});

test("processPending: nothing pending", () => {
  assert.deepEqual(plain(gs.processPending([], 25, 1, () => 0, () => assert.fail(), () => assert.fail())), { done: 0, remaining: 0 });
});

test("computeAgreement skips rows a person left empty", () => {
  const a = plain(gs.computeAgreement([
    { aiTopic: "Packaging", aiSentiment: "negative", topic: "Packaging", sentiment: "negative" },
    { aiTopic: "Packaging", aiSentiment: "negative", topic: "Product quality", sentiment: "negative" },
    { aiTopic: "Other", aiSentiment: "neutral", topic: "Other", sentiment: "Mixed" },
    { aiTopic: "Other", aiSentiment: "neutral", topic: "", sentiment: "" },
  ]));
  assert.deepEqual(a, { checked: 3, topicAgreement: 66.7, sentimentAgreement: 66.7, bothAgreement: 33.3 });
  assert.equal(gs.computeAgreement([]).topicAgreement, null);
});

test("sampleRows: deterministic, no duplicates, right size", () => {
  const items = Array.from({ length: 1000 }, (_, i) => i);
  const a = plain(gs.sampleRows(items, 300, 7));
  assert.equal(a.length, 300);
  assert.equal(new Set(a).size, 300);
  assert.deepEqual(a, plain(gs.sampleRows(items, 300, 7)));
  assert.notDeepEqual(a, plain(gs.sampleRows(items, 300, 8)));
});

test("demo reviews: deterministic, unique IDs, valid ratings", () => {
  const a = gs.makeDemoReviews(1000, 2026);
  assert.equal(JSON.stringify(a), JSON.stringify(gs.makeDemoReviews(1000, 2026)));
  assert.equal(new Set(a.map((r) => r[0])).size, 1000);
  assert.ok(a.every((r) => r[3] >= 1 && r[3] <= 5 && r[4].length > 0));
});
