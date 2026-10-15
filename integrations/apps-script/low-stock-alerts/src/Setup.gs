/**
 * One-time setup. Run setupDemo() from the Apps Script editor of a NEW,
 * empty Google Sheet (Extensions → Apps Script). See README.md.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Stock alerts')
    .addItem('Run the daily check now (import, recalculate, email)', 'runDailyCheck')
    .addItem('Recalculate only', 'recalculateOnly')
    .addItem('Apply settings (reinstall the daily trigger)', 'applySettings')
    .addToUi();
}

function setupDemo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from a Google Sheet (Extensions → Apps Script) and run setupDemo() there.');
  if (ss.getSheetByName(CONFIG.SHEETS.STOCK)) throw new Error('This spreadsheet already has a Stock tab. Use a new, empty Google Sheet.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());

  var demo = makeDemoStore(7, new Date(), 35);
  var csvFile = DriveApp.createFile('demo-store-orders-export.csv', toCsv(demo.csv), MimeType.CSV);

  buildStock_(ss, demo.stock);
  buildSales_(ss);
  buildLog_(ss);
  buildSettings_(ss, csvFile.getId());
  ss.getSheets().forEach(function (sh) {
    var keep = [CONFIG.SHEETS.STOCK, CONFIG.SHEETS.SALES, CONFIG.SHEETS.LOG, CONFIG.SHEETS.SETTINGS];
    if (keep.indexOf(sh.getName()) === -1) ss.deleteSheet(sh);
  });
  ss.setActiveSheet(ss.getSheetByName(CONFIG.SHEETS.STOCK));

  applySettings();
  onOpen();
  importSales_(ss, getSettings_());
  recalculate_(ss, getSettings_());
  Logger.log('Demo CSV in your Drive: ' + csvFile.getUrl());
  ss.toast('Done. Run "Stock alerts → Run the daily check now" to get the email.', 'Stock alerts', 10);
}

function buildStock_(ss, stockRows) {
  var sh = ss.insertSheet(CONFIG.SHEETS.STOCK, 0);
  var n = CONFIG.STOCK_HEADERS.length;
  sh.getRange(1, 1, 1, n).setValues([CONFIG.STOCK_HEADERS]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#1f2937');
  sh.getRange(1, CONFIG.STOCK_CALC_FROM, 1, n - CONFIG.STOCK_CALC_FROM + 1).setBackground('#374151');
  sh.getRange(2, 1, stockRows.length, CONFIG.STOCK_INPUT_COLS).setValues(stockRows);
  sh.getRange(2, 1, Math.max(stockRows.length, 1), CONFIG.STOCK_INPUT_COLS).setBackground('#fffbea');
  sh.setFrozenRows(1);
  sh.getRange('G2:G').setNumberFormat('0.0');
  sh.getRange('L2:L').setNumberFormat('yyyy-mm-dd hh:mm');

  // Status: colour AND the icon + label in the cell, so it doesn't rely on colour alone.
  var status = sh.getRange('K2:K');
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('●').setBackground('#fee2e2').setFontColor('#991b1b').setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('▲').setBackground('#fef3c7').setFontColor('#92400e').setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('✓').setBackground('#dcfce7').setFontColor('#166534').setRanges([status]).build(),
  ]);
  sh.getRange('F:L').protect().setDescription('Written by the script on every check').setWarningOnly(true);
  sh.setColumnWidths(1, n, 110);
  sh.setColumnWidth(2, 200);
  sh.setColumnWidth(3, 140);
  sh.setColumnWidth(11, 140);
  sh.getRange(stockRows.length + 3, 1).setValue('Yellow columns (A:E) are yours to edit. Columns F:L are recalculated on every check.').setFontColor('#6b7280');
}

function buildSales_(ss) {
  var sh = ss.insertSheet(CONFIG.SHEETS.SALES);
  sh.getRange(1, 1, 1, CONFIG.SALES_HEADERS.length).setValues([CONFIG.SALES_HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm');
}

function buildLog_(ss) {
  var sh = ss.insertSheet(CONFIG.SHEETS.LOG);
  sh.getRange(1, 1, 1, CONFIG.LOG_HEADERS.length).setValues([CONFIG.LOG_HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm');
}

function buildSettings_(ss, csvFileId) {
  var sh = ss.insertSheet(CONFIG.SHEETS.SETTINGS);
  var rows = Object.keys(CONFIG.SETTINGS_DEFAULTS).map(function (k) {
    var v = CONFIG.SETTINGS_DEFAULTS[k];
    if (k === 'Recipients') v = Session.getEffectiveUser().getEmail();
    if (k === 'Sales CSV (Drive file ID)') v = csvFileId;
    return [k, v];
  });
  sh.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]).setFontWeight('bold');
  sh.getRange(2, 1, rows.length, 2).setValues(rows);
  sh.getRange(2, 2, rows.length, 1).setBackground('#fffbea');
  sh.getRange(rows.length + 3, 1, 3, 1).setValues([
    ['After changing the check hour, run: Stock alerts → Apply settings.'],
    ['Sales CSV: the Drive file ID (or link) of your store\'s orders export. Replace the file each day, or point to a new one.'],
    ['Reorder now = days of cover < lead time + safety buffer. Reorder soon = within the next "Reorder soon" window.'],
  ]).setFontColor('#6b7280');
  sh.setColumnWidth(1, 240);
  sh.setColumnWidth(2, 360);
}
