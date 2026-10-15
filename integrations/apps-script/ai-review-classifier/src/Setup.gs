/**
 * One-time setup. Run setupDemo() from the Apps Script editor of a NEW,
 * empty Google Sheet (Extensions → Apps Script). See README.md.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AI tagging')
    .addItem('Tag new reviews', 'tagNewReviews')
    .addItem('Retry error rows', 'retryErrors')
    .addSeparator()
    .addItem('Set API key…', 'promptForApiKey')
    .addItem('Apply settings (reinstall the nightly trigger)', 'applySettings')
    .addSeparator()
    .addItem('Create hand check (300 random reviews)', 'createHandCheck')
    .addItem('Compute hand-check agreement', 'computeHandCheckAgreement')
    .addToUi();
}

function setupDemo(count) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from a Google Sheet (Extensions → Apps Script) and run setupDemo() there.');
  if (ss.getSheetByName(CONFIG.SHEETS.REVIEWS)) throw new Error('This spreadsheet already has a Reviews tab. Use a new, empty Google Sheet.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  count = typeof count === 'number' ? count : 1000;

  var reviews = ss.insertSheet(CONFIG.SHEETS.REVIEWS, 0);
  var n = CONFIG.REVIEW_HEADERS.length;
  reviews.getRange(1, 1, 1, n).setValues([CONFIG.REVIEW_HEADERS]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#1f2937');
  reviews.getRange(1, CONFIG.OUTPUT_FROM, 1, CONFIG.OUTPUT_WIDTH).setBackground('#4c1d95');
  var data = makeDemoReviews(count, 2026);
  reviews.getRange(2, 1, data.length, 5).setValues(data);
  reviews.setFrozenRows(1);
  reviews.getRange('B2:B').setNumberFormat('yyyy-mm-dd');
  reviews.getRange('I2:I').setNumberFormat('0.00');
  reviews.getRange('K2:K').setNumberFormat('yyyy-mm-dd hh:mm');
  reviews.getRange('E2:E').setWrap(true);
  reviews.setColumnWidth(5, 380);
  reviews.setColumnWidth(8, 260);
  reviews.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('TRUE').setBackground('#fef3c7').setRanges([reviews.getRange('J2:J')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(CONFIG.ERROR_TOPIC).setBackground('#fee2e2').setRanges([reviews.getRange('F2:F')]).build(),
  ]);

  var runs = ss.insertSheet(CONFIG.SHEETS.RUNS);
  runs.getRange(1, 1, 1, CONFIG.RUN_HEADERS.length).setValues([CONFIG.RUN_HEADERS]).setFontWeight('bold');
  runs.getRange('A2:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  runs.setFrozenRows(1);

  var settings = ss.insertSheet(CONFIG.SHEETS.SETTINGS);
  var rows = Object.keys(CONFIG.SETTINGS_DEFAULTS).map(function (k) { return [k, CONFIG.SETTINGS_DEFAULTS[k]]; });
  settings.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]).setFontWeight('bold');
  settings.getRange(2, 1, rows.length, 2).setValues(rows);
  settings.getRange(2, 2, rows.length, 1).setBackground('#fffbea');
  settings.getRange(2, 2).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Claude', 'OpenAI'], true).build());
  settings.getRange(rows.length + 3, 1, 3, 1).setValues([
    ['API keys are saved with AI tagging → Set API key… (Script Properties). They are never stored in this sheet.'],
    ['Rows under the confidence threshold get "Needs a person" = TRUE.'],
    ['The Runs tab records the real time of every run.'],
  ]).setFontColor('#6b7280');
  settings.setColumnWidth(1, 260);
  settings.setColumnWidth(2, 220);

  ss.getSheets().forEach(function (sh) {
    if ([CONFIG.SHEETS.REVIEWS, CONFIG.SHEETS.RUNS, CONFIG.SHEETS.SETTINGS].indexOf(sh.getName()) === -1) ss.deleteSheet(sh);
  });
  ss.setActiveSheet(reviews);
  applySettings();
  onOpen();
  ss.toast(count + ' fictitious reviews added. Next: AI tagging → Set API key…', 'AI tagging', 10);
}

/** Saves the key for the current provider in Script Properties. */
function promptForApiKey() {
  var ui = SpreadsheetApp.getUi();
  var provider = parseClassifierSettings(readSettings_(getSpreadsheet_())).provider;
  var res = ui.prompt('API key for ' + provider, 'Paste the key. It is saved in this script\'s properties, not in the sheet.', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var key = res.getResponseText().trim();
  if (!key) return;
  PropertiesService.getScriptProperties().setProperty(provider === 'Claude' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY', key);
  ui.alert('Saved. Run AI tagging → Tag new reviews.');
}

/** (Re)installs the nightly trigger from Settings. */
function applySettings() {
  var s = parseClassifierSettings(readSettings_(getSpreadsheet_()));
  deleteTriggers_('tagNewReviews');
  ScriptApp.newTrigger('tagNewReviews').timeBased().everyDays(1).atHour(s.hour).create();
  toast_(SpreadsheetApp.getActiveSpreadsheet(), 'Nightly tagging installed at ' + s.hour + ':00.');
}
