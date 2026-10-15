/**
 * Tagging runs. Apps Script stops any execution after 6 minutes, so a run
 * works in parts: it tags batches until ~4.5 minutes have passed, then
 * schedules itself to resume a minute later. Progress lives in the sheet
 * itself (a row is done once column F has a value), and the run's counters
 * live in Script Properties, so a resumed part continues the same run.
 * When nothing is left, the run is written to the Runs tab with its real
 * wall-clock time.
 */

/** Menu item and nightly trigger: starts a run (or continues an open one). */
function tagNewReviews() {
  runPart_(false);
}

/** One-off trigger created by a part that ran out of time. */
function resumeTagging() {
  runPart_(true);
}

function runPart_(isResume) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_TIMEOUT_MS)) return; // another part is running
  var partStart = Date.now();
  try {
    deleteTriggers_('resumeTagging');
    var ss = getSpreadsheet_();
    var settings = parseClassifierSettings(readSettings_(ss));
    var apiKey = getApiKey_(settings.provider);
    var sheet = ss.getSheetByName(CONFIG.SHEETS.REVIEWS);
    var props = PropertiesService.getScriptProperties();

    var run = JSON.parse(props.getProperty('RUN') || 'null');
    if (!run) {
      if (isResume) return;
      run = { started: partStart, provider: settings.provider, model: settings.model, tagged: 0, errors: 0, calls: 0, scriptMs: 0, executions: 0 };
    }

    var pending = readPending_(sheet);
    var outcome = processPending(pending, settings.batchSize, partStart + CONFIG.MAX_RUN_MS, Date.now, function (batch) {
      run.calls++;
      return classifyBatch_(batch, settings, apiKey);
    }, function (batch, results) {
      writeResults_(sheet, batch, results, settings.model);
      results.forEach(function (r) { if (r.ok) run.tagged++; else run.errors++; });
    });

    run.scriptMs += Date.now() - partStart;
    run.executions++;
    if (outcome.remaining > 0) {
      props.setProperty('RUN', JSON.stringify(run));
      ScriptApp.newTrigger('resumeTagging').timeBased().after(CONFIG.RESUME_AFTER_MS).create();
      toast_(ss, run.tagged + ' tagged so far, ' + outcome.remaining + ' left. Resuming in a minute.');
    } else {
      props.deleteProperty('RUN');
      if (run.tagged + run.errors > 0) logRun_(ss, run, Date.now());
      toast_(ss, 'Done: ' + run.tagged + ' reviews tagged, ' + run.errors + ' errors.');
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * The loop, without Google services (tested in Node). Tags batches until
 * nothing is pending or the deadline would be passed, writing each batch as
 * soon as it returns. `now` is a clock function. Returns { done, remaining }.
 */
function processPending(pending, batchSize, deadline, now, classify, write) {
  var done = 0;
  var lastBatchMs = 0;
  for (var i = 0; i < pending.length; i += batchSize) {
    // Don't start a batch that probably can't finish before the deadline.
    if (now() + lastBatchMs > deadline) break;
    var t0 = now();
    var batch = pending.slice(i, i + batchSize);
    var results = classify(batch);
    write(batch, results);
    done += batch.length;
    lastBatchMs = now() - t0;
  }
  return { done: done, remaining: pending.length - done };
}

/** Calls the provider with up to 3 retries on 429/5xx; always returns one result per review. */
function classifyBatch_(batch, settings, apiKey) {
  var req = settings.provider === 'Claude' ? buildClaudeRequest(batch, settings, apiKey) : buildOpenAIRequest(batch, settings, apiKey);
  var url = req.url;
  delete req.url;
  var parsed;
  for (var attempt = 0; attempt < 4; attempt++) {
    var res = UrlFetchApp.fetch(url, req);
    parsed = parseProviderResponse(settings.provider, res.getResponseCode(), res.getContentText());
    if (!parsed.error || !parsed.retryable) break;
    Utilities.sleep(Math.pow(2, attempt) * 2000);
  }
  if (parsed.error) {
    return batch.map(function (r) { return { id: String(r.id), ok: false, error: parsed.error }; });
  }
  return validateResults(batch, parsed.results, settings.threshold);
}

/** Rows with review text and an empty Topic column → [{ row, id, rating, text }]. */
function readPending_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var values = sheet.getRange(2, 1, last - 1, CONFIG.COL.TOPIC).getValues();
  var out = [];
  values.forEach(function (v, i) {
    var text = String(v[CONFIG.COL.REVIEW - 1]).trim();
    if (text && String(v[CONFIG.COL.TOPIC - 1]).trim() === '') {
      out.push({ row: i + 2, id: String(v[CONFIG.COL.ID - 1]) || 'row-' + (i + 2), rating: v[3], text: text });
    }
  });
  return out;
}

/** Writes F:L for each review of the batch (rows may not be contiguous). */
function writeResults_(sheet, batch, results, model) {
  var now = new Date();
  results.forEach(function (r, k) {
    var row = batch[k].row;
    var values = r.ok
      ? [r.topic, r.sentiment, r.summary, r.confidence, r.needsCheck, now, model]
      : [CONFIG.ERROR_TOPIC, '', r.error, '', true, now, model];
    sheet.getRange(row, CONFIG.OUTPUT_FROM, 1, CONFIG.OUTPUT_WIDTH).setValues([values]);
  });
  SpreadsheetApp.flush();
}

/** Menu item: clears ERROR rows so the next run tags them again. */
function retryErrors() {
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.REVIEWS);
  var last = sheet.getLastRow();
  if (last < 2) return;
  var topics = sheet.getRange(2, CONFIG.COL.TOPIC, last - 1, 1).getValues();
  var n = 0;
  topics.forEach(function (t, i) {
    if (t[0] === CONFIG.ERROR_TOPIC) {
      sheet.getRange(i + 2, CONFIG.OUTPUT_FROM, 1, CONFIG.OUTPUT_WIDTH).clearContent();
      n++;
    }
  });
  toast_(SpreadsheetApp.getActiveSpreadsheet(), n + ' error rows cleared. Run "Tag new reviews" again.');
}

function logRun_(ss, run, finishedMs) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.RUNS);
  sheet.appendRow([
    new Date(run.started),
    new Date(finishedMs),
    run.provider,
    run.model,
    run.tagged,
    run.errors,
    run.calls,
    Math.round((finishedMs - run.started) / 1000),
    Math.round(run.scriptMs / 1000),
    run.executions,
  ]);
}

function readSettings_(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  var raw = {};
  Object.keys(CONFIG.SETTINGS_DEFAULTS).forEach(function (k) { raw[k] = CONFIG.SETTINGS_DEFAULTS[k]; });
  var last = sheet.getLastRow();
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
      var key = String(r[0]).trim();
      if (key && r[1] !== '') raw[key] = r[1];
    });
  }
  return raw;
}

/** API keys live in Script Properties (set from the menu), never in the code or the sheet. */
function getApiKey_(provider) {
  var name = provider === 'Claude' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
  var key = PropertiesService.getScriptProperties().getProperty(name);
  if (!key) throw new Error('No API key saved for ' + provider + '. Use the menu: AI tagging → Set API key.');
  return key;
}

function deleteTriggers_(handler) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === handler) ScriptApp.deleteTrigger(t);
  });
}

function toast_(ss, msg) {
  if (ss && ss.toast) ss.toast(msg, 'AI tagging', 8);
}

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet() ||
    SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
}
