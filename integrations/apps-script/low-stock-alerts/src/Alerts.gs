/**
 * Import → recalculate → email → log. Runs every morning from a trigger
 * and from the "Stock alerts" menu.
 */

/** Daily trigger (and menu item): the whole check. */
function runDailyCheck() {
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    var ss = getSpreadsheet_();
    var settings = getSettings_();
    if (String(settings['Sales CSV (Drive file ID)']).trim()) importSales_(ss, settings);
    var rows = recalculate_(ss, settings);
    var toOrder = rows.filter(function (r) { return r.status === 'NOW' || r.status === 'SOON'; });
    var recipients = parseRecipients(settings.Recipients);
    if (toOrder.length && recipients.length) {
      var mail = buildAlertEmail(toOrder, ss.getUrl());
      MailApp.sendEmail({ to: recipients.join(','), subject: mail.subject, body: mail.body, htmlBody: mail.htmlBody });
    }
    logAlerts_(ss, toOrder, recipients);
    return { checked: rows.length, toOrder: toOrder.length, emailed: toOrder.length && recipients.length ? recipients : [] };
  } finally {
    lock.releaseLock();
  }
}

/** Menu item: recalculate without importing or emailing. */
function recalculateOnly() {
  recalculate_(getSpreadsheet_(), getSettings_());
}

/** Reads the CSV from Drive and replaces the Sales tab with the last N days. */
function importSales_(ss, settings) {
  var fileId = extractDriveId_(settings['Sales CSV (Drive file ID)']);
  var csv = DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8');
  var lines = parseSalesRows(Utilities.parseCsv(csv), CONFIG.CSV_COLUMNS);
  var s = parseStockSettings(settings);
  var today = new Date();
  var start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - s.windowDays);
  var recent = lines.filter(function (l) { return l.date >= start; });

  var sh = ss.getSheetByName(CONFIG.SHEETS.SALES);
  sh.clearContents();
  sh.getRange(1, 1, 1, CONFIG.SALES_HEADERS.length).setValues([CONFIG.SALES_HEADERS]).setFontWeight('bold');
  if (recent.length) {
    sh.getRange(2, 1, recent.length, CONFIG.SALES_HEADERS.length).setValues(
      recent.map(function (l) { return [l.date, l.order, l.sku, l.product, l.quantity, l.financialStatus]; })
    );
  }
  return recent.length;
}

/** Writes columns F:L of the Stock tab and returns one object per SKU. */
function recalculate_(ss, settings) {
  var s = parseStockSettings(settings);
  var stock = ss.getSheetByName(CONFIG.SHEETS.STOCK);
  var sales = ss.getSheetByName(CONFIG.SHEETS.SALES);
  var lastSales = sales.getLastRow();
  var lines = lastSales >= 2
    ? sales.getRange(2, 1, lastSales - 1, CONFIG.SALES_HEADERS.length).getValues().map(function (r) {
        return { date: r[0] instanceof Date ? r[0] : parseExportDate(r[0]), order: r[1], sku: String(r[2]), product: r[3], quantity: Number(r[4]), financialStatus: String(r[5]).toLowerCase() };
      })
    : [];
  var sold = unitsSoldBySku(lines, new Date(), s.windowDays, CONFIG.EXCLUDED_STATUSES);

  var last = stock.getLastRow();
  if (last < 2) return [];
  var inputs = stock.getRange(2, 1, last - 1, CONFIG.STOCK_INPUT_COLS).getValues();
  var now = new Date();
  var out = [];
  var values = inputs.map(function (r) {
    var sku = String(r[0]).trim();
    if (!sku) return ['', '', '', '', '', '', ''];
    var row = computeStockRow({ leadTime: Number(r[3]), onHand: Number(r[4]), unitsSold: sold[sku] || 0 }, s);
    out.push({ sku: sku, product: r[1], leadTime: Number(r[3]), onHand: Number(r[4]), daysOfCover: row.daysOfCover, suggestedOrder: row.suggestedOrder, status: row.status });
    return [row.unitsSold, row.avgPerDay, row.daysOfCover === null ? '' : row.daysOfCover, row.reorderPoint, row.suggestedOrder || '', CONFIG.STATUS[row.status], now];
  });
  stock.getRange(2, CONFIG.STOCK_CALC_FROM, values.length, 7).setValues(values);
  return out;
}

function logAlerts_(ss, rows, recipients) {
  if (!rows.length) return;
  var log = ss.getSheetByName(CONFIG.SHEETS.LOG);
  var now = new Date();
  var to = recipients.length ? recipients.join(', ') : '(no recipients set)';
  var values = rows.map(function (r) {
    return [now, r.sku, r.product, CONFIG.STATUS[r.status], r.onHand, r.daysOfCover, r.leadTime, r.suggestedOrder, to];
  });
  log.getRange(log.getLastRow() + 1, 1, values.length, values[0].length).setValues(values);
}

function getSettings_() {
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.SETTINGS);
  var settings = {};
  Object.keys(CONFIG.SETTINGS_DEFAULTS).forEach(function (k) { settings[k] = CONFIG.SETTINGS_DEFAULTS[k]; });
  var last = sheet.getLastRow();
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
      var key = String(r[0]).trim();
      if (key && r[1] !== '') settings[key] = r[1];
    });
  }
  return settings;
}

/** Accepts a bare file ID or a Drive URL. */
function extractDriveId_(value) {
  var s = String(value).trim();
  var m = s.match(/[-\w]{25,}/);
  return m ? m[0] : s;
}

/** (Re)installs the daily trigger at the hour set in Settings. */
function applySettings() {
  var s = parseStockSettings(getSettings_());
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runDailyCheck') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runDailyCheck').timeBased().everyDays(1).atHour(s.hour).create();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) ss.toast('Daily check installed at ' + s.hour + ':00 (' + ss.getSpreadsheetTimeZone() + ')', 'Stock alerts', 8);
}

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet() ||
    SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
}
