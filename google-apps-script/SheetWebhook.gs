/**
 * Gloria Yoga Studio — webhook for site forms → Google Sheets
 *
 * Submit paths:
 * - POST JSON (text/plain body) — good for curl / server tooling
 * - GET JSONP: ?callback=NAME&payload=URL_ENCODED_JSON — required for browsers
 *   because cross-origin redirects block reading Location when chaining POST manually.
 *
 * Setup (bound to spreadsheet):
 * 1. Extensions → Apps Script → paste → Save → Deploy → Web app → Execute as Me, Anyone
 * 2. Paste URL into sheet-config.js after each script change → New deployment version
 */

var CONTACT_HEADERS = ["Timestamp", "Name", "Email", "Phone", "Program", "Message"];

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function handleSubmission(data) {
  var form = String(data.form || "").toLowerCase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (form === "contact") {
    var sh = ensureSheet(ss, "Contact", CONTACT_HEADERS);
    sh.appendRow([
      new Date(),
      String(data.name || ""),
      String(data.email || ""),
      String(data.phone || ""),
      String(data.program || ""),
      String(data.message || ""),
    ]);
  } else {
    throw new Error("unknown form");
  }
}

/** Valid JSON function name used as JSONP callback (no parentheses / injection). */
function isSafeCallbackName(name) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(String(name || ""));
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonpResponse(callbackName, obj) {
  return ContentService
    .createTextOutput(callbackName + "(" + JSON.stringify(obj) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doGet(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var callbackRaw = String(p.callback != null ? p.callback : "").trim();
    var payloadRaw = p.payload != null ? String(p.payload) : "";

    /** Browser forms: GET + JSONP (script tag). */
    if (callbackRaw && payloadRaw.length) {
      if (!isSafeCallbackName(callbackRaw)) {
        return ContentService.createTextOutput('{"ok":false,"error":"invalid callback"}')
          .setMimeType(ContentService.MimeType.JSON);
      }
      var data = JSON.parse(payloadRaw);
      handleSubmission(data);
      return jsonpResponse(callbackRaw, { ok: true });
    }

    /** Optional: plain GET with JSON payload (debug / short tools only). */
    if (payloadRaw.length) {
      var dataPlain = JSON.parse(payloadRaw);
      handleSubmission(dataPlain);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: "missing payload" });
  } catch (err) {
    var msg = String(err && err.message ? err.message : err);
    if (e && e.parameter && isSafeCallbackName(e.parameter.callback)) {
      try {
        return jsonpResponse(String(e.parameter.callback).trim(), { ok: false, error: msg });
      } catch (_) {}
    }
    return jsonResponse({ ok: false, error: msg });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "empty body" });
    }

    var data = JSON.parse(e.postData.contents);
    handleSubmission(data);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
}
