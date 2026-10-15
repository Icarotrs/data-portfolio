/**
 * Weekly PDF summary, settings and triggers.
 */

/** Settings tab → { Recipients: '…', 'Report day': 'MONDAY', … } */
function getSettings() {
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.SETTINGS);
  var settings = {};
  Object.keys(CONFIG.SETTINGS_DEFAULTS).forEach(function (k) {
    settings[k] = CONFIG.SETTINGS_DEFAULTS[k];
  });
  var last = sheet.getLastRow();
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
      var key = String(r[0]).trim();
      if (key && r[1] !== '') settings[key] = r[1];
    });
  }
  return settings;
}

/** Validated schedule from the settings: { day: ScriptApp.WeekDay, hour: 0-23 }. */
function parseSchedule(settings) {
  var dayName = String(settings['Report day']).trim().toUpperCase();
  var days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  if (days.indexOf(dayName) === -1) throw new Error('Settings › Report day must be one of ' + days.join(', '));
  var hour = Number(settings['Report hour (0-23)']);
  if (!(hour >= 0 && hour <= 23 && Math.floor(hour) === hour)) throw new Error('Settings › Report hour must be a whole number from 0 to 23');
  return { dayName: dayName, hour: hour };
}

/** Recipients cell → list of addresses (comma, semicolon or newline separated). */
function parseRecipients(value) {
  return String(value || '')
    .split(/[,;\n]/)
    .map(function (s) { return normalizeEmail(s); })
    .filter(String);
}

/** The Summary tab as a one-page-wide PDF blob. */
function exportSummaryPdf_() {
  var ss = getSpreadsheet_();
  var summary = ss.getSheetByName(CONFIG.SHEETS.SUMMARY);
  var url =
    'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export' +
    '?format=pdf&gid=' + summary.getSheetId() +
    '&size=letter&portrait=true&fitw=true&gridlines=false&printtitle=false' +
    '&sheetnames=false&pagenum=UNDEFINED&fzr=false';
  var response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('PDF export failed (' + response.getResponseCode() + ')');
  }
  var stamp = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  return response.getBlob().setName('Orders summary ' + stamp + '.pdf');
}

/** Time-driven trigger (and menu item): emails the Summary tab as a PDF. */
function sendWeeklyReport() {
  var settings = getSettings();
  var recipients = parseRecipients(settings.Recipients);
  if (!recipients.length) throw new Error('Settings › Recipients is empty or invalid');
  var ss = getSpreadsheet_();
  var pdf = exportSummaryPdf_();
  MailApp.sendEmail({
    to: recipients.join(','),
    subject: String(settings['Email subject']),
    body:
      'Attached: this week\'s orders summary (PDF).\n\n' +
      'Open the sheet: ' + ss.getUrl() + '\n\n' +
      'Sent automatically by Apps Script. Change recipients or schedule in the Settings tab, then run "Apply settings".',
    attachments: [pdf],
  });
}

/**
 * (Re)installs the two triggers from the current settings:
 *   - onFormSubmit on the linked form,
 *   - sendWeeklyReport every week on the chosen day and hour.
 * Run it from the menu after changing Settings.
 */
function applySettings() {
  var schedule = parseSchedule(getSettings());
  var handlers = ['onFormSubmit', 'sendWeeklyReport'];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (handlers.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });

  var formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (formId) {
    ScriptApp.newTrigger('onFormSubmit').forForm(FormApp.openById(formId)).onFormSubmit().create();
  }
  ScriptApp.newTrigger('sendWeeklyReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay[schedule.dayName])
    .atHour(schedule.hour)
    .everyWeeks(1)
    .create();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) ss.toast('Triggers installed: form submissions + weekly report on ' + schedule.dayName + ' at ' + schedule.hour + ':00', 'Orders automation', 8);
}

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId_());
}
