/**
 * Pure stock math and CSV parsing — no Google services, tested in Node
 * (tests/stock.test.mjs).
 *
 * Definitions (per SKU, sales window = 30 days by default):
 *   avg/day         = units sold in the window ÷ window days
 *   days of cover   = on hand ÷ avg/day
 *   reorder point   = avg/day × (lead time + safety buffer), rounded up
 *   status          = Reorder now   if days of cover < lead time + buffer
 *                     Reorder soon  if days of cover < lead time + buffer + soon window
 *                     OK            otherwise
 *   suggested order = enough for the lead time plus N days (45 by default),
 *                     minus what is on hand, rounded up — only when not OK
 */

/**
 * Store export rows (array of arrays, first row = headers) → sale lines
 * { date, order, sku, product, quantity, financialStatus }.
 * Throws a clear error when a required column is missing.
 */
function parseSalesRows(rows, columns) {
  if (!rows.length) return [];
  var header = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var idx = {};
  Object.keys(columns).forEach(function (key) {
    idx[key] = header.indexOf(String(columns[key]).toLowerCase());
  });
  ['date', 'quantity', 'sku'].forEach(function (key) {
    if (idx[key] === -1) throw new Error('The sales CSV has no "' + columns[key] + '" column.');
  });
  var lines = [];
  var lastOrder = null, lastDate = null, lastStatus = '';
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    if (!row || row.every(function (c) { return String(c).trim() === ''; })) continue;
    var get = function (key) { return idx[key] === -1 || idx[key] === undefined ? '' : String(row[idx[key]] === undefined ? '' : row[idx[key]]).trim(); };
    // Shopify repeats order-level fields only on the first line item of each order.
    var order = get('order') || lastOrder;
    var dateText = get('date');
    var date = dateText ? parseExportDate(dateText) : (order === lastOrder ? lastDate : null);
    var status = get('financialStatus') || (order === lastOrder ? lastStatus : '');
    var sku = get('sku');
    var qty = parseInt(get('quantity'), 10);
    lastOrder = order; lastDate = date; lastStatus = status;
    if (!sku || !date || !(qty > 0)) continue;
    lines.push({ date: date, order: order, sku: sku, product: get('product'), quantity: qty, financialStatus: status.toLowerCase() });
  }
  return lines;
}

/** "2026-10-01 14:03:22 -0400" or "2026-10-01" → Date (local, time kept if present). */
function parseExportDate(text) {
  var m = String(text).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
}

/** Units sold per SKU in the `windowDays` days before `today` (today excluded). */
function unitsSoldBySku(lines, today, windowDays, excludedStatuses) {
  var end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - windowDays);
  var totals = {};
  lines.forEach(function (l) {
    if (l.date < start || l.date >= end) return;
    if (excludedStatuses.indexOf(l.financialStatus) !== -1) return;
    totals[l.sku] = (totals[l.sku] || 0) + l.quantity;
  });
  return totals;
}

/**
 * One SKU's numbers. `p` = { leadTime, onHand, unitsSold },
 * `s` = { windowDays, bufferDays, soonDays, coverDays }.
 */
function computeStockRow(p, s) {
  var avg = p.unitsSold / s.windowDays;
  if (!(avg > 0)) {
    return { unitsSold: p.unitsSold, avgPerDay: 0, daysOfCover: null, reorderPoint: 0, suggestedOrder: 0, status: 'NO_SALES' };
  }
  var cover = p.onHand / avg;
  var reorderPoint = Math.ceil(avg * (p.leadTime + s.bufferDays));
  var status = 'OK';
  if (cover < p.leadTime + s.bufferDays) status = 'NOW';
  else if (cover < p.leadTime + s.bufferDays + s.soonDays) status = 'SOON';
  var suggested = status === 'OK' ? 0 : Math.max(0, Math.ceil(avg * (p.leadTime + s.coverDays) - p.onHand));
  return {
    unitsSold: p.unitsSold,
    avgPerDay: Math.round(avg * 100) / 100,
    daysOfCover: Math.floor(cover),
    reorderPoint: reorderPoint,
    suggestedOrder: suggested,
    status: status,
  };
}

/** Settings values → numbers, with clear errors. */
function parseStockSettings(settings) {
  function num(key, min, max) {
    var v = Number(settings[key]);
    if (!(v >= min && v <= max && Math.floor(v) === v)) {
      throw new Error('Settings › ' + key + ' must be a whole number from ' + min + ' to ' + max);
    }
    return v;
  }
  return {
    bufferDays: num('Safety buffer (days)', 0, 90),
    soonDays: num('"Reorder soon" window (days)', 0, 90),
    coverDays: num('Order covers (days)', 1, 365),
    windowDays: num('Sales window (days)', 7, 90),
    hour: num('Daily check hour (0-23)', 0, 23),
  };
}

function parseRecipients(value) {
  return String(value || '')
    .split(/[,;\n]/)
    .map(function (s) { return s.trim().toLowerCase(); })
    .filter(function (s) { return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(s); });
}

/** Plain-text + HTML email body for the SKUs that need ordering. */
function buildAlertEmail(rows, sheetUrl) {
  var now = rows.filter(function (r) { return r.status === 'NOW'; });
  var soon = rows.filter(function (r) { return r.status === 'SOON'; });
  var subject = 'Stock check: ' + now.length + ' to reorder now, ' + soon.length + ' soon';
  function table(list) {
    return (
      '<table cellpadding="6" style="border-collapse:collapse;font:14px Arial">' +
      '<tr style="background:#f3f4f6"><th align="left">SKU</th><th align="left">Product</th><th align="right">On hand</th><th align="right">Days of cover</th><th align="right">Lead time</th><th align="right">Suggested order</th></tr>' +
      list.map(function (r) {
        return '<tr><td>' + esc_(r.sku) + '</td><td>' + esc_(r.product) + '</td><td align="right">' + r.onHand + '</td><td align="right">' + r.daysOfCover + '</td><td align="right">' + r.leadTime + ' d</td><td align="right"><b>' + r.suggestedOrder + '</b></td></tr>';
      }).join('') +
      '</table>'
    );
  }
  function text(list) {
    return list.map(function (r) { return '- ' + r.sku + ' ' + r.product + ': ' + r.daysOfCover + ' days of cover, lead time ' + r.leadTime + ' d, order ' + r.suggestedOrder; }).join('\n');
  }
  var html = '';
  var body = '';
  if (now.length) { html += '<h3>● Reorder now</h3>' + table(now); body += 'REORDER NOW\n' + text(now) + '\n\n'; }
  if (soon.length) { html += '<h3>▲ Reorder soon</h3>' + table(soon); body += 'REORDER SOON\n' + text(soon) + '\n\n'; }
  html += '<p style="font:13px Arial;color:#6b7280">Open the sheet: <a href="' + sheetUrl + '">' + sheetUrl + '</a></p>';
  body += 'Open the sheet: ' + sheetUrl;
  return { subject: subject, htmlBody: html, body: body };
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
