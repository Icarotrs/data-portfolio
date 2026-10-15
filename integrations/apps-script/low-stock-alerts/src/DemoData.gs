/**
 * Fictitious store data: a small home-goods catalog and 30+ days of orders
 * in Shopify's "Export orders" CSV layout. Pure and deterministic (same
 * seed → same data); used by setupDemo() and by scripts/make-demo-csv.mjs.
 */

var DEMO_CATALOG_ = [
  // sku, product, supplier, lead time (days), units per day (average demand)
  ['SKU-2041', 'Cold brew bottle 1L', 'Northwind Glass', 12, 6.0],
  ['SKU-1180', 'Reusable straw set', 'GreenPack', 10, 4.0],
  ['SKU-3302', 'Glass meal-prep box (3)', 'Northwind Glass', 14, 3.8],
  ['SKU-1007', 'Ceramic pour-over', 'Clayworks', 21, 3.0],
  ['SKU-2210', 'Bamboo utensil kit', 'GreenPack', 10, 5.8],
  ['SKU-4401', 'Insulated tumbler 500ml', 'SteelCo', 14, 2.4],
  ['SKU-0915', 'Beeswax wraps (pack 3)', 'Hive & Co', 12, 6.5],
  ['SKU-3017', 'Lunch box steel 2-tier', 'SteelCo', 21, 1.9],
  ['SKU-1555', 'Silicone food bags (4)', 'GreenPack', 14, 1.1],
  ['SKU-2880', 'Cotton produce bags', 'Loom Supply', 7, 7.4],
  ['SKU-0420', 'Travel cutlery case', 'Loom Supply', 10, 0.8],
  ['SKU-3760', 'Glass water bottle', 'Northwind Glass', 21, 3.3],
  ['SKU-1993', 'Coffee filter (metal)', 'SteelCo', 14, 1.4],
  ['SKU-2604', 'Spice jar set (6)', 'Clayworks', 21, 0.6],
  ['SKU-5120', 'Linen tea towels (2)', 'Loom Supply', 7, 0.0],
];

function demoRandom_(seed) {
  var state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    var t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Poisson sample (Knuth), fine for small means. */
function demoPoisson_(rand, mean) {
  if (mean <= 0) return 0;
  var L = Math.exp(-mean), k = 0, p = 1;
  do { k++; p *= rand(); } while (p > L);
  return k - 1;
}

/**
 * Returns { stock: [[sku, product, supplier, leadTime, onHand], …],
 *           csv:   [[header…], [row…], …] }   for the `days` days before `today`.
 * On-hand levels are spread so the demo shows every status.
 */
function makeDemoStore(seed, today, days) {
  days = days || 35;
  var rand = demoRandom_(seed);
  var coverTargets = [3, 8, 13, 32, 24, 19, 18, 39, 30, 45, 60, 37, 41, 25, 20];
  var stock = DEMO_CATALOG_.map(function (c, i) {
    var onHand = Math.round(c[4] * coverTargets[i % coverTargets.length]) || 20;
    return [c[0], c[1], c[2], c[3], onHand];
  });

  var header = ['Name', 'Email', 'Financial Status', 'Created at', 'Lineitem quantity', 'Lineitem name', 'Lineitem price', 'Lineitem sku'];
  var rows = [header];
  var orderNo = 1001;
  var start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  for (var d = 0; d < days; d++) {
    var day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d);
    // Units sold per SKU this day, then grouped into orders of 1–3 line items.
    var units = [];
    DEMO_CATALOG_.forEach(function (c) {
      var n = demoPoisson_(rand, c[4]);
      for (var k = 0; k < n; k++) units.push(c);
    });
    while (units.length) {
      var lines = Math.min(units.length, 1 + Math.floor(rand() * 3));
      var name = '#' + orderNo++;
      var hh = 8 + Math.floor(rand() * 14), mm = Math.floor(rand() * 60);
      var created = fmtDate_(day) + ' ' + pad2_(hh) + ':' + pad2_(mm) + ':00 -0400';
      var status = rand() < 0.03 ? 'refunded' : 'paid';
      var byItem = {};
      for (var i = 0; i < lines; i++) {
        var item = units.splice(Math.floor(rand() * units.length), 1)[0];
        byItem[item[0]] = byItem[item[0]] || { item: item, qty: 0 };
        byItem[item[0]].qty++;
      }
      Object.keys(byItem).forEach(function (sku, j) {
        var it = byItem[sku];
        // Like Shopify: order-level fields only on the first line item.
        rows.push([
          name,
          j === 0 ? 'customer' + name.slice(1) + '@example.com' : '',
          j === 0 ? status : '',
          j === 0 ? created : '',
          it.qty,
          it.item[1],
          (9 + (it.item[0].charCodeAt(5) % 30)).toFixed(2),
          sku,
        ]);
      });
    }
  }
  return { stock: stock, csv: rows };
}

function fmtDate_(d) { return d.getFullYear() + '-' + pad2_(d.getMonth() + 1) + '-' + pad2_(d.getDate()); }
function pad2_(n) { return (n < 10 ? '0' : '') + n; }

/** Array of rows → CSV text (quotes only when needed). */
function toCsv(rows) {
  return rows.map(function (r) {
    return r.map(function (v) {
      var s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',');
  }).join('\n') + '\n';
}
