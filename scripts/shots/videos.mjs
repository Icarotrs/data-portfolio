/**
 * Demo videos: each project plays its mock-up screens as a short scripted
 * walkthrough (cursor, typing, rows arriving, charts growing, captions).
 * Rendered by scripts/render-videos.mjs to public/projects/<slug>/demo.mp4.
 *
 * A video = { scenes: [{ html, prep }], play(v) }.
 *   prep: helper calls run on the scene before it is shown, e.g.
 *         ["hide", ".toast"] or ["growPrep", "svg rect"].
 *   play: the script, using the `v` API from render-videos.mjs:
 *         v.scene(i) · v.caption(text) · v.move(sel, opts) · v.click()
 *         v.type(sel, text) · v.tip(text) · v.f(helper, sel, opts) · v.wait(ms)
 */
import { C, page } from "./kit.mjs";
import { shots } from "./projects.mjs";

const html = (slug, file) => shots[slug].find((s) => s.file === file).html;
const ORANGE = C.orange;

// A Google Forms–style page for the order form.
const orderForm = page(
  `<div class="gf"><div class="col">
    <div class="card head"><h1>Order request</h1><p>Fill in your order and we'll confirm it the same day.</p><div class="req">* Required</div></div>
    <div class="card q"><label>Business name *</label><div class="in" id="biz"></div></div>
    <div class="card q"><label>Product *</label><div class="in sel" id="product"><span class="ph">Choose</span><i>▾</i></div></div>
    <div class="card q"><label>Quantity *</label><div class="in" id="qty"></div></div>
    <div class="actions"><span class="btn" id="submit">Submit</span><span class="clear">Clear form</span></div>
    <div class="card done" id="done"><h1>Order request</h1><p>Thanks! Your order was received.<br>You'll get a confirmation email shortly.</p></div>
  </div></div>`,
  `
  .gf { height: 100%; background: #f0ebf8; display: flex; justify-content: center; padding-top: 40px; font-family: Inter, Roboto, Arial, sans-serif; }
  .col { width: 760px; display: flex; flex-direction: column; gap: 14px; position: relative; }
  .card { background: #fff; border-radius: 10px; border: 1px solid #dadce0; padding: 26px 28px; }
  .head { border-top: 10px solid #673ab7; } .head h1 { font-size: 32px; font-weight: 400; } .head p { margin-top: 12px; font-size: 15px; color: #202124; }
  .req { margin-top: 18px; color: #d93025; font-size: 14px; }
  .q label { display: block; font-size: 16px; margin-bottom: 18px; }
  .in { height: 36px; border-bottom: 1px solid #dadce0; width: 50%; font-size: 15px; display: flex; align-items: center; }
  .in.sel { width: 260px; border: 1px solid #dadce0; border-radius: 4px; padding: 0 12px; justify-content: space-between; }
  .ph { color: #5f6368; } .in i { font-style: normal; color: #5f6368; }
  .actions { display: flex; justify-content: space-between; align-items: center; }
  .btn { background: #673ab7; color: #fff; padding: 10px 24px; border-radius: 4px; font-weight: 500; }
  .clear { color: #673ab7; font-weight: 500; }
  .done { position: absolute; top: 0; left: 0; right: 0; border-top: 10px solid #673ab7; opacity: 0; }
  .done h1 { font-size: 32px; font-weight: 400; } .done p { margin-top: 14px; font-size: 15px; line-height: 1.6; }
  `,
);

export const videos = {
  // ── 01 ─────────────────────────────────────────────────────
  "ecommerce-profit-dashboard": {
    scenes: [
      { html: html("ecommerce-profit-dashboard", "overview"), prep: [["growPrep", "svg path, svg rect"], ["countPrep", ".kpi .value"]] },
      {
        html: html("ecommerce-profit-dashboard", "products"),
        prep: [["hide", "tbody tr"], ["countPrep", ".kpi:nth-child(-n+2) .value"]],
      },
    ],
    async play(v) {
      v.caption("Every order, fee and freight cost in one profit report");
      await v.scene(0);
      await Promise.all([v.f("grow", "svg path, svg rect"), v.f("countUp", ".kpi .value")]);
      await v.move(`svg rect[fill="${ORANGE}"]`, { fx: 0.4 });
      v.tip("Office furniture · −6.3% net margin");
      await v.wait(2200);
      v.tip(null);
      await v.move(".tabs span:nth-child(2)");
      await v.click();
      v.caption("312 products were selling at a loss — mostly because of freight");
      await v.scene(1);
      await Promise.all([v.f("reveal", "tbody tr", { stagger: 70 }), v.f("countUp", ".kpi:nth-child(-n+2) .value")]);
      await v.move("tbody tr:first-child td:nth-child(7)");
      v.tip("Sold at a loss after fees and freight");
      await v.wait(2600);
    },
  },

  // ── 02 ─────────────────────────────────────────────────────
  "form-to-sheet-automation": {
    scenes: [
      { html: orderForm, prep: [] },
      {
        html: html("form-to-sheet-automation", "sheet"),
        prep: [
          ["setText", "tr.hl td:nth-of-type(3)", { text: "Maple Bakery" }],
          ["setText", "tr.hl td:nth-of-type(4)", { text: "Coffee beans 1kg" }],
          ["setText", "tr.hl td:nth-of-type(5)", { text: "4" }],
          ["setText", "tr.hl td:nth-of-type(6)", { text: "$24.00" }],
          ["setText", "tr.hl td:nth-of-type(7)", { text: "$96.00" }],
          ["hide", "tr.hl", { x: -30, y: 0 }],
          ["hide", ".toast"],
        ],
      },
      { html: html("form-to-sheet-automation", "weekly-report"), prep: [["growPrep", "svg path"]] },
    ],
    async play(v) {
      v.caption("1 · A customer sends the order form");
      await v.scene(0);
      await v.move("#biz", { fx: 0.1 });
      await v.click();
      await v.type("#biz", "Maple Bakery");
      await v.move("#product");
      await v.click();
      await v.f("setText", "#product", { text: "Coffee beans 1kg ▾" });
      await v.move("#qty", { fx: 0.1 });
      await v.click();
      await v.type("#qty", "4");
      await v.move("#submit");
      await v.click();
      await v.f("reveal", "#done");
      await v.wait(1200);
      v.caption("2 · Apps Script writes it to the sheet — formulas and formatting kept");
      await v.scene(1);
      await v.wait(500);
      await v.f("reveal", "tr.hl", { dur: 700 });
      await v.move("tr.hl td:nth-of-type(7)");
      await v.f("reveal", ".toast");
      await v.wait(2600);
      v.caption("3 · Every Monday a PDF summary is emailed to the team");
      await v.scene(2);
      await v.f("grow", "svg path");
      await v.wait(2800);
    },
  },

  // ── 03 ─────────────────────────────────────────────────────
  "messy-data-importer": {
    scenes: [
      { html: html("messy-data-importer", "before-after"), prep: [["hide", ".clean tr:not(:first-child), .fixes"]] },
      { html: html("messy-data-importer", "run-log"), prep: [["termPrep", "pre"]] },
    ],
    async play(v) {
      v.caption("Four supplier files, four different formats");
      await v.scene(0);
      await v.move(".raw pre span.bad:nth-of-type(3)", { fx: 0.3 });
      v.tip('Mixed dates · "R$" text prices · duplicates');
      await v.wait(2400);
      v.tip(null);
      v.caption("A Python script reads, fixes and merges them");
      await v.scene(1);
      await v.f("term", "pre");
      await v.wait(1200);
      v.caption("One clean table in Google Sheets, with a log of every fix");
      await v.scene(0);
      await v.f("reveal", ".clean tr:not(:first-child)", { stagger: 90 });
      await v.f("reveal", ".fixes");
      await v.move(".fixes", { fx: 0.25 });
      await v.wait(2600);
    },
  },

  // ── 04 ─────────────────────────────────────────────────────
  "inventory-reorder-alerts": {
    scenes: [
      {
        html: html("inventory-reorder-alerts", "stock-sheet"),
        prep: [["growPrep", 'td span[style*="height:12px"]'], ["hide", ".chip, .toast"]],
      },
      { html: html("inventory-reorder-alerts", "alert-email"), prep: [["hide", ".msg tr, .btn"]] },
    ],
    async play(v) {
      v.caption("Every morning the sheet works out how many days of stock are left");
      await v.scene(0);
      await v.f("grow", 'td span[style*="height:12px"]', { stagger: 60 });
      await v.f("reveal", ".chip", { stagger: 80 });
      await v.move(".chip.bad");
      v.tip("Runs out before a new order can arrive");
      await v.wait(2000);
      v.tip(null);
      v.caption("Products about to run out are flagged…");
      await v.f("reveal", ".toast");
      await v.wait(2000);
      v.caption("…and purchasing gets an email with what to order");
      await v.scene(1);
      await v.f("reveal", ".msg tr", { stagger: 90 });
      await v.f("reveal", ".btn");
      await v.move(".btn");
      await v.wait(2400);
    },
  },

  // ── 05 ─────────────────────────────────────────────────────
  "marketing-roas-dashboard": {
    scenes: [
      {
        html: html("marketing-roas-dashboard", "overview"),
        prep: [["growPrep", "svg rect"], ["countPrep", ".kpi .value"], ["hide", ".chip, .note"]],
      },
      {
        html: html("marketing-roas-dashboard", "trend"),
        prep: [["growPrep", "svg path"], ["hide", ".canvas > div > div:last-child > .card"]],
      },
    ],
    async play(v) {
      v.caption("Spend and sales from every ad channel, side by side");
      await v.scene(0);
      await Promise.all([v.f("grow", "svg rect"), v.f("countUp", ".kpi .value")]);
      await v.f("reveal", ".chip", { stagger: 120 });
      await v.move(`svg rect[fill="${ORANGE}"]`, { fx: 0.6 });
      v.tip("Return under 3× the spend");
      await v.wait(1800);
      v.tip(null);
      v.caption("A clear recommendation, not just charts");
      await v.f("reveal", ".note");
      await v.move(".note", { fx: 0.3 });
      await v.wait(2200);
      await v.move(".tabs span:nth-child(2)");
      await v.click();
      v.caption("Weekly trend: where the money is growing");
      await v.scene(1);
      await v.f("grow", "svg path");
      await v.f("reveal", ".canvas > div > div:last-child > .card", { stagger: 220 });
      await v.wait(2400);
    },
  },

  // ── 06 ─────────────────────────────────────────────────────
  "review-insights-ai": {
    scenes: [
      {
        html: html("review-insights-ai", "tagged-sheet"),
        prep: [["clear", "tbody tr:not(:first-child) td:nth-of-type(n+4):nth-of-type(-n+7)"], ["hide", ".toast"]],
      },
      { html: html("review-insights-ai", "topics"), prep: [["growPrep", "svg rect", { rightFill: ORANGE }], ["countPrep", ".kpi .value"]] },
    ],
    async play(v) {
      v.caption("AI reads each review and tags topic, sentiment and a summary");
      await v.scene(0);
      await v.move("tbody tr:nth-child(2) td:nth-of-type(4)");
      await v.f("fillRows", "tbody tr:not(:first-child)", { from: 4, to: 7 });
      await v.f("reveal", ".toast");
      v.caption("Low-confidence rows go to a person for a quick check");
      await v.wait(2200);
      v.caption("The result: what customers complain about most");
      await v.scene(1);
      await Promise.all([v.f("grow", "svg rect", { stagger: 50 }), v.f("countUp", ".kpi .value")]);
      await v.move(`svg rect[fill="${ORANGE}"]`, { fx: 0.3 });
      v.tip("Delivery time · 41% negative");
      await v.wait(2600);
    },
  },
};
