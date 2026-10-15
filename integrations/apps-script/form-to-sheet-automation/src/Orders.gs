/**
 * Writing form responses into the formatted Orders table.
 */

/**
 * Installable trigger: runs on every form submission (installed by
 * setupDemo() / applySettings() on the form, not on the sheet).
 */
function onFormSubmit(e) {
  var answers = answersFromResponse_(e.response);
  processSubmission(answers, new Date());
}

/** Form response → { name, email, … } using CONFIG.QUESTIONS. */
function answersFromResponse_(response) {
  var answers = {};
  response.getItemResponses().forEach(function (itemResponse) {
    var field = CONFIG.QUESTIONS[itemResponse.getItem().getTitle()];
    if (field) answers[field] = itemResponse.getResponse();
  });
  return answers;
}

/**
 * Cleans one submission and appends it, holding a script lock so two
 * submissions arriving together never get the same row or order ID.
 * Returns { row, orderId, problems }.
 */
function processSubmission(answers, receivedAt) {
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS); // throws if it can't get the lock in time
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId_());
    var orders = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
    var products = readProducts_(ss.getSheetByName(CONFIG.SHEETS.PRODUCTS));
    var cleaned = cleanSubmission(answers, products);
    var result = appendOrder(orders, cleaned.record, receivedAt, cleaned.problems);
    SpreadsheetApp.flush();
    return { row: result.row, orderId: result.orderId, problems: cleaned.problems };
  } finally {
    lock.releaseLock();
  }
}

/** Product names from column A of the Products tab (row 1 is the header). */
function readProducts_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet
    .getRange(2, 1, last - 1, 1)
    .getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(String);
}

/**
 * Writes the record into the first empty row of the table. Only the input
 * columns are written; formula columns (H, I, M) are left alone, and the new
 * row inherits the column's validation and conditional formatting.
 * Problems (if any) are added as a note on the Order ID cell.
 */
function appendOrder(sheet, record, receivedAt, problems) {
  var next = findNextRowAndId_(sheet);
  if (next.row > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), 50);
  }
  var orderId = CONFIG.ORDER_ID_PREFIX + ('000' + next.number).slice(-Math.max(4, String(next.number).length));

  var values = {
    1: receivedAt,
    2: orderId,
    3: record.name,
    4: record.email,
    5: record.phone,
    6: record.product,
    7: record.quantity,
    10: 'New',
    11: record.deliveryDate,
    12: record.notes,
  };
  CONFIG.INPUT_BLOCKS.forEach(function (block) {
    var row = [];
    for (var c = block.from; c <= block.to; c++) row.push(values[c] === undefined ? '' : values[c]);
    sheet.getRange(next.row, block.from, 1, row.length).setValues([row]);
  });

  var idCell = sheet.getRange(next.row, CONFIG.COL.ORDER_ID);
  if (problems && problems.length) idCell.setNote('Check: ' + problems.join('; '));
  return { row: next.row, orderId: orderId };
}

/**
 * The next free row is the one after the last non-empty Order ID (column B).
 * getLastRow() can't be used: the ARRAYFORMULA columns make every row count
 * as "used". The next number is the highest existing ORD-#### + 1.
 */
function findNextRowAndId_(sheet) {
  var height = sheet.getMaxRows() - 1;
  var ids = height > 0 ? sheet.getRange(2, CONFIG.COL.ORDER_ID, height, 1).getValues() : [];
  var lastRow = 1;
  var maxNumber = 0;
  for (var i = 0; i < ids.length; i++) {
    var id = String(ids[i][0]);
    if (!id) continue;
    lastRow = i + 2;
    var n = parseInt(id.replace(CONFIG.ORDER_ID_PREFIX, ''), 10);
    if (n > maxNumber) maxNumber = n;
  }
  return { row: lastRow + 1, number: maxNumber + 1 };
}

/** The spreadsheet ID saved by setupDemo(), for triggers that run without an active sheet. */
function getSpreadsheetId_() {
  return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
}
