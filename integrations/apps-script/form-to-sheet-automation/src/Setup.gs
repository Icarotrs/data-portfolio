/**
 * One-time setup: builds the demo spreadsheet (tabs, formulas, dropdowns,
 * formatting), creates the order form, installs the triggers and, if you
 * want, adds fictitious orders.
 *
 * Run setupDemo() once from the Apps Script editor of a NEW, empty Google
 * Sheet (Extensions → Apps Script). See README.md.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Orders automation')
    .addItem('Send the weekly report now', 'sendWeeklyReport')
    .addItem('Apply settings (reinstall triggers)', 'applySettings')
    .addSeparator()
    .addItem('Add 12 fictitious orders', 'seedDemoData')
    .addToUi();
}

// Fictitious catalog for the demo.
var DEMO_PRODUCTS_ = [
  ['Coffee beans 1 kg', 24.0],
  ['Paper cups (500)', 38.5],
  ['Oat milk (12)', 29.0],
  ['Cleaning kit', 52.0],
  ['Printer paper (5 reams)', 31.0],
  ['Tea sampler', 18.0],
  ['Reusable bottle', 14.5],
  ['Snack box (40)', 45.0],
];

function setupDemo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from a Google Sheet (Extensions → Apps Script) and run setupDemo() there.');
  if (ss.getSheetByName(CONFIG.SHEETS.ORDERS)) {
    throw new Error('This spreadsheet already has an "' + CONFIG.SHEETS.ORDERS + '" tab. Use a new, empty Google Sheet.');
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());

  var products = buildProducts_(ss);
  var orders = buildOrders_(ss, products);
  buildSummary_(ss);
  buildSettings_(ss);
  ss.getSheets().forEach(function (sh) {
    if ([CONFIG.SHEETS.ORDERS, CONFIG.SHEETS.SUMMARY, CONFIG.SHEETS.PRODUCTS, CONFIG.SHEETS.SETTINGS].indexOf(sh.getName()) === -1) {
      ss.deleteSheet(sh);
    }
  });
  ss.setActiveSheet(orders);

  var form = buildForm_(ss);
  props.setProperty('FORM_ID', form.getId());
  applySettings();
  onOpen();

  Logger.log('Sheet: ' + ss.getUrl());
  Logger.log('Form (share this link): ' + form.getPublishedUrl());
  Logger.log('Form editor: ' + form.getEditUrl());
  ss.toast('Done. Form link is in the Settings tab.', 'Orders automation', 10);
}

function buildProducts_(ss) {
  var sh = ss.insertSheet(CONFIG.SHEETS.PRODUCTS);
  sh.getRange(1, 1, 1, 2).setValues([['Product', 'Unit price']]).setFontWeight('bold');
  sh.getRange(2, 1, DEMO_PRODUCTS_.length, 2).setValues(DEMO_PRODUCTS_);
  sh.getRange('B2:B').setNumberFormat('$#,##0.00');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, 2);
  return sh;
}

function buildOrders_(ss, productsSheet) {
  var sh = ss.insertSheet(CONFIG.SHEETS.ORDERS, 0);
  var n = CONFIG.HEADERS.length;
  if (sh.getMaxColumns() > n) sh.deleteColumns(n + 1, sh.getMaxColumns() - n);
  var rows = sh.getMaxRows();

  // Header row: input headers as text, formula headers come from ARRAYFORMULA.
  // Each formula leaves empty rows truly blank (IF(…,,…)) so QUERY sees numbers.
  sh.getRange(1, 1, 1, n).setValues([CONFIG.HEADERS]);
  sh.getRange('H1').setFormula('=ARRAYFORMULA(IF(ROW(F:F)=1,"Unit price",IF(F:F="",,IFERROR(VLOOKUP(F:F,Products!A:B,2,FALSE),))))');
  sh.getRange('I1').setFormula('=ARRAYFORMULA(IF(ROW(B:B)=1,"Total",IF(B:B="",,IFERROR(G:G*H:H,))))');
  sh.getRange('M1').setFormula('=ARRAYFORMULA(IF(ROW(B:B)=1,"Week",IF(B:B="",,INT(A:A)-WEEKDAY(A:A,3))))');

  sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
  sh.setFrozenRows(1);

  // Number formats (locale-independent pattern codes)
  sh.getRange(2, 1, rows - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange(2, 8, rows - 1, 2).setNumberFormat('$#,##0.00');
  sh.getRange(2, 11, rows - 1, 1).setNumberFormat('yyyy-mm-dd');
  sh.getRange(2, 13, rows - 1, 1).setNumberFormat('yyyy-mm-dd');

  // Dropdowns. allowInvalid keeps an unknown product visible (and flagged) instead of rejecting the write.
  sh.getRange(2, 6, rows - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(productsSheet.getRange('A2:A'), true).setAllowInvalid(true).build()
  );
  sh.getRange(2, CONFIG.COL.STATUS, rows - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.STATUSES, true).setAllowInvalid(false).build()
  );

  // Conditional formatting: status colours (with the label still in the cell) and cancelled rows greyed out.
  var all = sh.getRange(2, 1, rows - 1, n);
  var status = sh.getRange(2, CONFIG.COL.STATUS, rows - 1, 1);
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$J2="Cancelled"').setFontColor('#9ca3af').setStrikethrough(true).setRanges([all]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('New').setBackground('#fef3c7').setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Confirmed').setBackground('#dbeafe').setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Shipped').setBackground('#dcfce7').setRanges([status]).build(),
  ]);

  // Formula columns: warning-only protection, so a person editing by hand is warned before breaking them.
  ['H:I', 'M:M'].forEach(function (a1) {
    sh.getRange(a1).protect().setDescription('Formula column — written by ARRAYFORMULA in row 1').setWarningOnly(true);
  });

  sh.setColumnWidths(1, n, 120);
  sh.setColumnWidth(3, 170);
  sh.setColumnWidth(4, 210);
  sh.setColumnWidth(6, 190);
  sh.setColumnWidth(12, 220);
  return sh;
}

function buildSummary_(ss) {
  var sh = ss.insertSheet(CONFIG.SHEETS.SUMMARY, 1);
  sh.getRange('A1').setValue('Orders summary').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setFormula('="Updated "&TEXT(NOW(),"yyyy-mm-dd hh:mm")').setFontColor('#6b7280');

  sh.getRange('A4').setValue('By week (last 8)').setFontWeight('bold');
  sh.getRange('A5').setFormula(
    '=QUERY(Orders!A2:M,"select M, count(B), sum(G), sum(I) where B is not null and J <> \'Cancelled\' group by M order by M desc limit 8 label M \'Week of\', count(B) \'Orders\', sum(G) \'Units\', sum(I) \'Revenue\'",0)'
  );
  sh.getRange('F4').setValue('By product').setFontWeight('bold');
  sh.getRange('F5').setFormula(
    '=QUERY(Orders!A2:M,"select F, count(B), sum(G), sum(I) where B is not null and J <> \'Cancelled\' group by F order by sum(I) desc label F \'Product\', count(B) \'Orders\', sum(G) \'Units\', sum(I) \'Revenue\'",0)'
  );
  sh.getRange('K4').setValue('By status').setFontWeight('bold');
  sh.getRange('K5').setFormula(
    '=QUERY(Orders!A2:M,"select J, count(B) where B is not null group by J label J \'Status\', count(B) \'Orders\'",0)'
  );

  sh.getRange('A6:A').setNumberFormat('yyyy-mm-dd');
  sh.getRange('D6:D').setNumberFormat('$#,##0.00');
  sh.getRange('I6:I').setNumberFormat('$#,##0.00');
  ['A5:D5', 'F5:I5', 'K5:L5'].forEach(function (a1) {
    sh.getRange(a1).setFontWeight('bold').setBorder(null, null, true, null, null, null);
  });
  sh.setColumnWidth(6, 190);
  sh.setColumnWidth(5, 24);
  sh.setColumnWidth(10, 24);
  sh.setHiddenGridlines(true);
  return sh;
}

function buildSettings_(ss) {
  var sh = ss.insertSheet(CONFIG.SHEETS.SETTINGS);
  var defaults = CONFIG.SETTINGS_DEFAULTS;
  var rows = Object.keys(defaults).map(function (k) {
    var v = defaults[k];
    if (k === 'Recipients') v = Session.getEffectiveUser().getEmail();
    return [k, v];
  });
  sh.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]).setFontWeight('bold');
  sh.getRange(2, 1, rows.length, 2).setValues(rows);
  sh.getRange(2, 2, rows.length, 1).setBackground('#fffbea');
  var dayRow = rows.map(function (r) { return r[0]; }).indexOf('Report day') + 2;
  sh.getRange(dayRow, 2).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], true)
      .build()
  );
  var note = rows.length + 3;
  sh.getRange(note, 1, 3, 1).setValues([
    ['After changing a value, run: Orders automation → Apply settings.'],
    ['Recipients: one or more emails, separated by commas.'],
    ['Form link: see below (filled by setup).'],
  ]).setFontColor('#6b7280');
  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(2, 320);
  return sh;
}

function buildForm_(ss) {
  var form = FormApp.create('Order request (demo)');
  form.setDescription('Fictitious demo form. Responses are written to "' + ss.getName() + '" by Apps Script.');
  form.addTextItem().setTitle('Your name').setRequired(true);
  form.addTextItem().setTitle('Email').setRequired(true);
  form.addTextItem().setTitle('Phone');
  form.addListItem().setTitle('Product').setChoiceValues(DEMO_PRODUCTS_.map(function (p) { return p[0]; })).setRequired(true);
  form.addTextItem().setTitle('Quantity').setRequired(true);
  form.addDateItem().setTitle('Delivery date');
  form.addParagraphTextItem().setTitle('Notes');
  // Deliberately NOT linked with setDestination(): the default link dumps raw
  // rows into a new tab. The onFormSubmit trigger writes to Orders instead.

  var settings = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  var row = settings.getLastRow() + 2;
  settings.getRange(row, 1, 2, 2).setValues([
    ['Form (share)', form.getPublishedUrl()],
    ['Form (edit)', form.getEditUrl()],
  ]);
  return form;
}

/**
 * Adds fictitious orders through the same pipeline a real response uses,
 * with typical messy input (extra spaces, lowercase names, mixed phone and
 * date formats) so the cleanup is visible. Received dates are spread over
 * the last 4 weeks. Deterministic: the same seed gives the same orders.
 */
function seedDemoData(count) {
  count = typeof count === 'number' ? count : 12;
  var answers = makeDemoAnswers(count, 42, DEMO_PRODUCTS_.map(function (p) { return p[0]; }), new Date());
  answers.forEach(function (a) {
    processSubmission(a.answers, a.receivedAt);
  });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) ss.toast(count + ' fictitious orders added.', 'Orders automation', 5);
}

/** Pure generator (also used by the Node tests). */
function makeDemoAnswers(count, seed, productNames, now) {
  var state = seed >>> 0;
  function rand() {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    var t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(list) { return list[Math.floor(rand() * list.length)]; }

  var first = ['ana', 'JAMES', 'priya', 'Lucas', 'mei', 'olivia', 'Noah', 'sofia', 'liam', 'Emma'];
  var last = ['carter', 'NGUYEN', 'patel', 'de souza', 'Kim', "o'neil", 'garcia', 'brooks'];
  var domains = ['example.com', 'example.org', 'example.net'];
  var phoneStyles = [
    function (d) { return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6); },
    function (d) { return '(' + d.slice(0, 3) + ')' + d.slice(3, 6) + ' ' + d.slice(6); },
    function (d) { return '+1 ' + d; },
    function (d) { return d; },
  ];
  var out = [];
  for (var i = 0; i < count; i++) {
    var f = pick(first), l = pick(last);
    var digits = '555' + String(1000000 + Math.floor(rand() * 8999999)).slice(-7);
    var received = new Date(now.getTime() - Math.floor(rand() * 28 * 24) * 3600 * 1000);
    var delivery = new Date(received.getFullYear(), received.getMonth(), received.getDate() + 3 + Math.floor(rand() * 10));
    var mm = delivery.getMonth() + 1, dd = delivery.getDate(), yy = delivery.getFullYear();
    var dateStyles = [
      yy + '-' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd,
      mm + '/' + dd + '/' + String(yy).slice(2),
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mm - 1] + ' ' + dd + ', ' + yy,
    ];
    out.push({
      receivedAt: received,
      answers: {
        name: '  ' + f + '   ' + l + ' ',
        email: ' ' + f.toLowerCase() + '.' + l.replace(/[^a-z]/gi, '').toLowerCase() + '@' + pick(domains) + ' ',
        phone: pick(phoneStyles)(digits),
        product: rand() < 0.2 ? pick(productNames).toLowerCase() : pick(productNames),
        quantity: String(1 + Math.floor(rand() * 6)) + (rand() < 0.2 ? ' units' : ''),
        deliveryDate: pick(dateStyles),
        notes: rand() < 0.3 ? '  please   call before delivery ' : '',
      },
    });
  }
  return out.sort(function (a, b) { return a.receivedAt - b.receivedAt; });
}
