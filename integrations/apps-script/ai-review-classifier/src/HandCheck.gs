/**
 * Hand check: a person classifies 300 random tagged reviews without seeing
 * the AI's answer, then the script measures how often they agree.
 * Only this measured number should ever be quoted as accuracy.
 */

var HAND_HEADERS_ = ['Review ID', 'Review', 'Your topic', 'Your sentiment', 'AI topic (hidden)', 'AI sentiment (hidden)'];

/** Menu item: builds the Hand check tab from tagged (non-error) reviews. */
function createHandCheck() {
  var ss = getSpreadsheet_();
  if (ss.getSheetByName(CONFIG.SHEETS.HAND_CHECK)) {
    throw new Error('A "' + CONFIG.SHEETS.HAND_CHECK + '" tab already exists. Rename or delete it to start a new check.');
  }
  var reviews = ss.getSheetByName(CONFIG.SHEETS.REVIEWS);
  var last = reviews.getLastRow();
  var rows = last < 2 ? [] : reviews.getRange(2, 1, last - 1, CONFIG.COL.TOPIC + 1).getValues();
  var tagged = rows.filter(function (r) {
    var t = String(r[CONFIG.COL.TOPIC - 1]);
    return t && t !== CONFIG.ERROR_TOPIC;
  });
  if (tagged.length < CONFIG.HAND_CHECK_SIZE) {
    throw new Error('Only ' + tagged.length + ' tagged reviews; the hand check needs ' + CONFIG.HAND_CHECK_SIZE + '. Run the tagging first.');
  }
  var sample = sampleRows(tagged, CONFIG.HAND_CHECK_SIZE, Date.now() % 100000);

  var sh = ss.insertSheet(CONFIG.SHEETS.HAND_CHECK);
  sh.getRange(1, 1, 1, HAND_HEADERS_.length).setValues([HAND_HEADERS_]).setFontWeight('bold');
  sh.getRange(2, 1, sample.length, HAND_HEADERS_.length).setValues(
    sample.map(function (r) {
      return [r[CONFIG.COL.ID - 1], r[CONFIG.COL.REVIEW - 1], '', '', r[CONFIG.COL.TOPIC - 1], r[CONFIG.COL.TOPIC]];
    })
  );
  sh.getRange(2, 3, sample.length, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.TOPICS, true).setAllowInvalid(false).build()
  );
  sh.getRange(2, 4, sample.length, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.SENTIMENTS, true).setAllowInvalid(false).build()
  );
  sh.getRange(2, 3, sample.length, 2).setBackground('#fffbea');
  sh.getRange(2, 2, sample.length, 1).setWrap(true);
  sh.setColumnWidth(2, 520);
  sh.setColumnWidths(3, 2, 150);
  sh.setFrozenRows(1);
  sh.hideColumns(5, 2); // classify blind: the AI's answers stay hidden until you compute agreement
  ss.setActiveSheet(sh);
  toast_(ss, 'Fill in "Your topic" and "Your sentiment" for each row, then run AI tagging → Compute hand-check agreement.');
}

/** Menu item: agreement between the person and the AI on the filled-in rows. */
function computeHandCheckAgreement() {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(CONFIG.SHEETS.HAND_CHECK);
  if (!sh) throw new Error('No "' + CONFIG.SHEETS.HAND_CHECK + '" tab. Create it from the menu first.');
  var last = sh.getLastRow();
  var rows = sh.getRange(2, 1, last - 1, HAND_HEADERS_.length).getValues().map(function (r) {
    return { topic: r[2], sentiment: r[3], aiTopic: r[4], aiSentiment: r[5] };
  });
  var a = computeAgreement(rows);
  var out = [
    ['Rows checked by a person', a.checked],
    ['Topic agreement (%)', a.topicAgreement],
    ['Sentiment agreement (%)', a.sentimentAgreement],
    ['Topic and sentiment both agree (%)', a.bothAgreement],
    ['Computed at', new Date()],
  ];
  sh.getRange(1, 8, out.length, 2).setValues(out);
  sh.getRange(1, 8, out.length, 1).setFontWeight('bold');
  sh.showColumns(5, 2);
  toast_(ss, a.checked + ' rows checked. Topic ' + a.topicAgreement + '%, sentiment ' + a.sentimentAgreement + '%.');
  return a;
}
