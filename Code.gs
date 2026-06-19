// ============================================================
// KC Factory System — Code.gs
// Version: 1.4.203 — #127 createDeliveryNoteFromWeb + createTaxInvoiceFromWeb: skip autoLogCustomer_ when data.skipAutoLog=true (user chose "ไม่ ไม่ต้องเพิ่ม" on new customer prompt)
// Version: 1.4.202 — #124 confirmBillingNote/editBillingNote: persist address+phone in BN History cols M/N; getBillingNoteDetail: prefer cols M/N override over Invoice History; #125 generateBillingNotePortraitPDF: on-demand portrait PDF + cache in col H
// Version: 1.4.201 — #123 BN landscape PDF: confirmBillingNote always portrait (remove format param); generateBillingNoteLandscapePDF(bnNo) caches URL in BN History col L; editBillingNote clears col L; getBillingNotes+getBillingNoteDetail return landscapeUrl
// Version: 1.4.200 — #117 getLastNonEmptyRow perf: bound read to getLastRow() + one column (was full-grid getRange("col:col")); benefits all 23 call sites; col-A scan preserved so col O formula can't inflate result
// Version: 1.4.199 — #116 getDNDetail perf fix: drop getLastNonEmptyRow("A") (full-column getValues = the real 3–4s cost); TextFinder on A:A needs no row count
// Version: 1.4.198 — #116 getDNDetail perf: use createTextFinder on col A to read only the DN's rows (was full-sheet scan per click)
// Version: 1.4.197 — #105 BN History perf (Option B): getBillingNotes does one grouped Invoice History scan → returns per-BN invoices[] + address/phone so detail opens instantly (no per-click scan)
// Version: 1.4.196 — #110 Combined BN folder configurable: folderBNCombined in Config (getConfig folders.bnCombined + saveConfig); printCombinedBillingNotes uses it if set, else auto subfolder
// Version: 1.4.195 — #109 Combined BN PDF: save to "Combined" subfolder (getOrCreateChildFolder_) + cleanupCombinedFolder_ keeps newest 5
// Version: 1.4.194 — #108 fix thaiMonth(): parse dd/MM/yyyy (combined BN PDF date showed "NaN undefined NaN"); return raw string if unparseable
// Version: 1.4.193 — #45/#44 cleanup: trim version log to 15 (full history → CHANGELOG.md); move test*/stagingTest* functions to Staging.gs (Code.gs 3020→2404 lines)
// Version: 1.4.192 — #107 Combined BN print: extract bnPortrait/LandscapePageHTML + bnPortrait/LandscapeCSS from builders (output identical); add printCombinedBillingNotes(bnNos, format) → one PDF w/ page-breaks + router case
// Version: 1.4.191 — #106 BN print queue persistence: getBillingNotes returns printed flag (col K); add markBillingNotesPrinted(bnNos) + router case
// Version: 1.4.190 — #97 Add router cases: getDNDetail, cancelBillingNote, getUnbilledDNsForCustomer, editBillingNote
// Version: 1.4.189 — #97 Add getDNDetail(), cancelBillingNote(), getUnbilledDNsForCustomer(), editBillingNote() functions
// Version: 1.4.188 — #97 Fix getBillingNoteDetail: proper date format + address/phone pickup from Invoice History + cancelled field from col J
// Version: 1.4.187 — #97 Fix getBillingNotes: proper Utilities.formatDate for date col + cancelled field from BN History col J
// Version: 1.4.186 — #93 Add getBillingNoteDetail(bnNo): reads BN History for header + Invoice History col Q for DN list; router case "getBillingNoteDetail"
// Older versions (1.4.185 and earlier) archived in CHANGELOG.md + KC_Daily_Progress docs
// ============================================================

var VAT_RATE = 0.07; // default; overridden by Config sheet vatRate row (#64)

var CONFIG = {
  invoiceSheet    : "Tax Invoice",
  invoiceHistory  : "Invoice History",
  bnTemplate      : "BN Template",
  bnHistory       : "BN History",
  configSheet     : "Config",
  tiSheet         : "Tax Invoice History",
  customerSheet   : "Customers",
};

/**
 * Extracts a Drive folder ID from a raw ID or full Drive URL.
 * Returns empty string if input is empty or unparseable.
 * @param {string} urlOrId
 * @return {string}
 */
function extractFolderId_(urlOrId) {
  if (!urlOrId) return "";
  var s = String(urlOrId).trim();
  var m = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) return s; // already a bare ID
  return "";
}


// ============================================================
// WEB APP — Entry points (with CORS)
// ============================================================

function doGet(e) {
  var result = handleRequest(e);
  var callback = e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + result.getContent() + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return result;
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var params = {};
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      params = {};
      for (var key in e.parameter) {
        var val = e.parameter[key];
        try { params[key] = JSON.parse(val); } catch(ex) { params[key] = val; }
      }
    }

    var action = params.action;
    var result = {};

    switch (action) {
      case "getDeliveryNotes":
        result = getDeliveryNotes(params.startDate, params.endDate, params.search);
        break;
      case "createDeliveryNote":
        result = createDeliveryNoteFromWeb(params.data);
        break;
      case "updateDeliveryNote":
        result = updateDeliveryNoteFromWeb(params.id, params.data);
        break;
      case "searchDeliveryNotes":
        result = searchDeliveryNotesForBilling(params.startDate, params.endDate);
        break;
      case "confirmBillingNote":
        result = confirmBillingNote(params.customer, params.reservedBnNo, params.invoices, params.bnDate, params.address, params.phone);
        break;
      case "getTaxInvoices":
        result = getTaxInvoices(params.startDate, params.endDate, params.search);
        break;
      case "createTaxInvoice":
        result = createTaxInvoiceFromWeb(params.data);
        break;
      case "updateTaxInvoice":
        result = updateTaxInvoiceFromWeb(params.id, params.data);
        break;
      case "generateTaxInvoicePortraitPDF":
        result = generateTaxInvoicePortraitPDFFromWeb(params.id);
        break;
      case "generateTaxInvoiceLandscapePDF":
        result = generateTaxInvoiceLandscapePDFFromWeb(params.id);
        break;
      case "generateDeliveryNoteLandscapePDF":
        result = generateDeliveryNoteLandscapePDFFromWeb(params.id);
        break;
      case "generateDeliveryNotePortraitPDF":
        result = generateDeliveryNotePortraitPDFFromWeb(params.id);
        break;
      case "getBillingNotes":
        result = getBillingNotes();
        break;
      case "getBillingNoteDetail":
        result = getBillingNoteDetail(params.bnNo);
        break;
      case "getDNDetail":
        result = getDNDetail(params.dnNo);
        break;
      case "cancelBillingNote":
        result = cancelBillingNote(params.bnNo);
        break;
      case "markBillingNotesPrinted":
        result = markBillingNotesPrinted(params.bnNos);
        break;
      case "generateBillingNoteLandscapePDF":
        result = generateBillingNoteLandscapePDF(params.bnNo);
        break;
      case "generateBillingNotePortraitPDF":
        result = generateBillingNotePortraitPDF(params.bnNo);
        break;
      case "printCombinedBillingNotes":
        result = printCombinedBillingNotes(params.bnNos, params.format);
        break;
      case "getUnbilledDNsForCustomer":
        result = getUnbilledDNsForCustomer(params.customer);
        break;
      case "editBillingNote":
        result = editBillingNote(params.bnNo, params);
        break;
      case "getVersion":
        result = getAppVersion();
        break;
      case "cancelDeliveryNote":
        result = cancelDeliveryNote(params.id);
        break;
      case "restoreDeliveryNote":
        result = restoreDeliveryNote(params.id);
        break;
      case "getCancelledDeliveryNotes":
        result = getCancelledDeliveryNotes(params.search);
        break;
      case "cancelTaxInvoice":
        result = cancelTaxInvoice(params.id);
        break;
      case "restoreTaxInvoice":
        result = restoreTaxInvoice(params.id);
        break;
      case "getCancelledTaxInvoices":
        result = getCancelledTaxInvoices(params.search);
        break;
      case "getCustomers":
        result = getCustomers(params.search);
        break;
      case "createCustomer":
        result = createCustomer(params.data);
        break;
      case "updateCustomer":
        result = updateCustomer(params.originalName, params.data);
        break;
      case "deleteCustomer":
        result = deleteCustomer(params.name);
        break;
      case "addProduct":
        result = addProduct(params.name, params.type);
        break;
      case "getProducts":
        result = getProducts();
        break;
      case "updateProduct":
        result = updateProduct(params.row, params.value);
        break;
      case "deleteProduct":
        result = deleteProduct(params.row);
        break;
      case "getConfig":
        result = getConfig();
        break;
      case "saveConfig":
        result = saveConfig(params.data);
        break;
      default:
        result = { error: "Unknown action: " + action };
    }

    output.setContent(JSON.stringify({ success: true, data: result }));
  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.message }));
  }

  return output;
}

// ============================================================
// BILLING NOTE SIDEBAR (legacy — kept for sheet-side reference)
// ============================================================

// ============================================================
// BILLING NOTE SIDEBAR
// ============================================================

// ============================================================
// SHARED HELPERS
// ============================================================

function getLastNonEmptyRow(sheet, col) {
  // #117 — bound the read to getLastRow() and ONE column (was getRange("col:col") = full grid column).
  // Still scans `col` for the last non-empty cell, so trailing formula rows in OTHER columns
  // (e.g. Tax Invoice History col O year-month formula) do NOT inflate the result.
  var last = sheet.getLastRow();
  if (last < 1) return 1;
  var colVals = sheet.getRange(col + "1:" + col + last).getValues(), lastRow = 1;
  for (var r = colVals.length - 1; r >= 1; r--) {
    if (colVals[r][0] !== "") { lastRow = r + 1; break; }
  }
  return lastRow;
}

function getNextBillingNoteNumber() {
  var ss        = SpreadsheetApp.getActiveSpreadsheet();
  var bnHistory = ss.getSheetByName(CONFIG.bnHistory);
  var yearYY    = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yy");
  if (!bnHistory || bnHistory.getLastRow() <= 1) return yearYY + "-BN-000001";
  var data = bnHistory.getDataRange().getValues(), lastBN = "";
  for (var i = data.length - 1; i >= 1; i--) { if (data[i][0]) { lastBN = String(data[i][0]).trim(); break; } }
  if (!lastBN) return yearYY + "-BN-000001";
  var parts = lastBN.split("-"), lastYY = parts[0], lastNum = parseInt(parts[parts.length - 1], 10);
  var newNum = (lastYY !== yearYY || isNaN(lastNum)) ? 1 : lastNum + 1;
  return yearYY + "-BN-" + newNum.toString().padStart(6, "0");
}

// ============================================================
// INVOICE HISTORY
// ============================================================

function searchDeliveryNotesForBilling(startDate, endDate) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!sheet) return [];
  var data  = sheet.getDataRange().getValues();
  var start = new Date(startDate), end = new Date(endDate);
  start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59);
  var grouped = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var invoiceNo = String(row[0]).trim(), rowDate = new Date(row[1]), name = String(row[2]).trim(), total = row[11];
    var billedBnNo = row.length > 16 ? String(row[16] || "").trim() : "";
    if (!invoiceNo || !name) continue;
    if (rowDate < start || rowDate > end) continue;
    if (!grouped[name]) grouped[name] = {};
    if (!grouped[name][invoiceNo]) grouped[name][invoiceNo] = { no: invoiceNo, date: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "dd/MM/yyyy"), total: 0, bnNo: "" };
    if (!grouped[name][invoiceNo].total && total) grouped[name][invoiceNo].total = total;
    if (billedBnNo && !grouped[name][invoiceNo].bnNo) grouped[name][invoiceNo].bnNo = billedBnNo;
  }
  var result = [];
  for (var customer in grouped) {
    var invoices = [], allBilled = true;
    for (var inv in grouped[customer]) {
      invoices.push(grouped[customer][inv]);
      if (!grouped[customer][inv].bnNo) allBilled = false;
    }
    invoices.sort(function(a, b) { return a.no.localeCompare(b.no); });
    result.push({ customer: customer, invoices: invoices, generated: invoices.length > 0 && allBilled });
  }
  result.sort(function(a, b) { return a.customer.localeCompare(b.customer); });
  return result;
}

function getDeliveryNotes(startDate, endDate, search) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) return [];
  var data  = sheet.getRange(1, 1, lastDataRow, 16).getValues();
  var start = startDate ? new Date(startDate) : null, end = endDate ? new Date(endDate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end)   end.setHours(23, 59, 59);
  var grouped = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i], invoiceNo = String(row[0]).trim(), rowDate = new Date(row[1]), name = String(row[2]).trim();
    if (!invoiceNo || !name) continue;
    if (String(row[15]).trim() === "CANCELLED") continue;
    if (start && rowDate < start) continue;
    if (end   && rowDate > end)   continue;
    if (search) { var q = search.toLowerCase(); if (!invoiceNo.toLowerCase().includes(q) && !name.toLowerCase().includes(q)) continue; }
    if (!grouped[invoiceNo]) {
      grouped[invoiceNo] = { id: invoiceNo, date: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd"), name: name, address: String(row[3]).trim(), phone: String(row[4]).trim(), total: row[11], pdfUrl: row[12], portraitUrl: row[14] ? String(row[14]).trim() : "", billed: false, items: [] };
    }
    grouped[invoiceNo].items.push({ desc: String(row[5]).trim(), desc2: String(row[6]).trim(), detail: String(row[7]).trim(), qty: row[8], unitPrice: row[9], amount: row[10] });
  }
  var bnHistory = ss.getSheetByName(CONFIG.bnHistory);
  if (bnHistory && bnHistory.getLastRow() > 1) {
    var bnData = bnHistory.getDataRange().getValues();
    for (var b = 1; b < bnData.length; b++) {
      var bnCustomer = String(bnData[b][2]).trim();
      for (var id in grouped) { if (grouped[id].name === bnCustomer) grouped[id].billed = true; }
    }
  }
  return Object.values(grouped).sort(function(a, b) { return b.id.localeCompare(a.id); });
}

// ============================================================
// BILLING NOTE
// ============================================================

function confirmBillingNote(customer, reservedBnNo, invoices, bnDate, address, phone) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bnHistory = ss.getSheetByName(CONFIG.bnHistory) || ss.insertSheet(CONFIG.bnHistory);
  if (bnHistory.getLastRow() === 0) bnHistory.appendRow(["เลขที่ BN","วันที่ออก","ชื่อลูกค้า","จำนวนบิล","รวมเงิน","วันที่บิลเริ่มต้น","วันที่บิลสิ้นสุด","ไฟล์ PDF","เลขที่ DN"]);
  var bnNo = reservedBnNo || getNextBillingNoteNumber();
  var dateStr = bnDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  var invoiceList = invoices || [];
  var total = 0;
  for (var i = 0; i < invoiceList.length; i++) total += parseFloat(invoiceList[i].amount || invoiceList[i].total) || 0;
  var dnNosStr = invoiceList.map(function(inv) { return inv.dnNo || inv.no || ""; }).filter(Boolean).join(", ");
  var invDates = invoiceList.map(function(inv) { return inv.dnDate || inv.date || ""; }).filter(Boolean);
  var invStart = invDates.length ? invDates[0] : "";
  var invEnd   = invDates.length ? invDates[invDates.length - 1] : "";
  var data = { date: bnDate || new Date().toISOString().slice(0,10), name: customer, address: address || "", phone: phone || "", invoices: invoiceList, total: total };
  var pdfUrl = buildBillingNotePortraitPDF(bnNo, customer, data); // always portrait at creation; landscape via generateBillingNoteLandscapePDF (#123)
  var lastRow = getLastNonEmptyRow(bnHistory, "A");
  bnHistory.getRange(lastRow + 1, 1, 1, 9).setValues([[bnNo, dateStr, customer, invoiceList.length, total, invStart, invEnd, pdfUrl, dnNosStr]]);
  if (address || phone) bnHistory.getRange(lastRow + 1, 13, 1, 2).setValues([[address || "", phone || ""]]); // cols M/N (#124)
  // Mark billed DNs in Invoice History col Q (index 17, 1-based) for Link DN→BN
  var dnNosToMark = invoiceList.map(function(inv) { return String(inv.dnNo || inv.no || "").trim(); }).filter(Boolean);
  if (dnNosToMark.length > 0) {
    var invSheet = ss.getSheetByName(CONFIG.invoiceHistory);
    if (invSheet) {
      var invData = invSheet.getDataRange().getValues();
      for (var r = 1; r < invData.length; r++) {
        if (dnNosToMark.indexOf(String(invData[r][0]).trim()) !== -1) {
          invSheet.getRange(r + 1, 17).setValue(bnNo);
        }
      }
    }
  }
  return { bnNo: bnNo, pdfUrl: pdfUrl };
}

// ============================================================
// WEB APP — Invoice functions
// ============================================================

function createDeliveryNoteFromWeb(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dataSheet = ss.getSheetByName(CONFIG.invoiceHistory) || ss.insertSheet(CONFIG.invoiceHistory);
    var yearYY = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yy");
    var date = new Date(data.date), name = data.name || "", address = data.address || "", phone = data.phone || "";
    var items = data.items || [], total = data.total || 0;
    var dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");

    // Single read — scan col A backwards to find true last data row (getLastRow() may be inflated by formulas/formatting)
    var lastDataRow = getLastNonEmptyRow(dataSheet, "A");
    var histRows = dataSheet.getRange(1, 1, Math.max(lastDataRow, 1), 14).getValues();
    var lastNum = 0;
    for (var r = 1; r < histRows.length; r++) {
      var id = String(histRows[r][0]).trim();
      if (!id) continue;
      var parts = id.split("-");
      if (parts[0] === yearYY && parts.length > 1) {
        var n = parseInt(parts[1], 10);
        if (!isNaN(n) && n > lastNum) lastNum = n;
      }
    }
    var invoiceNo = yearYY + "-" + (lastNum + 1).toString().padStart(6, "0");

    // Uniqueness check — same histRows, no second read
    for (var u = 1; u < histRows.length; u++) {
      var hr = histRows[u];
      var rDate = hr[1] instanceof Date ? Utilities.formatDate(hr[1], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(hr[1]).trim();
      if (String(hr[0]).trim() === invoiceNo && String(hr[2]).trim() === name && rDate === dateStr && parseFloat(hr[11]) === parseFloat(total)) {
        throw new Error("พบรายการซ้ำ: " + invoiceNo + " ชื่อ " + name + " วันที่ " + dateStr);
      }
    }

    // Batch write all item rows at once
    var filledItems = items.filter(function(it) { return it.desc || it.qty || it.amount; });
    if (filledItems.length === 0) throw new Error("ไม่มีรายการสินค้า");
    var batchData = filledItems.map(function(it) {
      return [invoiceNo, date, name, address, phone, it.desc || "", it.desc2 || "", it.detail || "", it.qty || "", it.unitPrice || "", it.amount || "", total, "", ""];
    });
    var firstWriteRow = lastDataRow + 1;
    // Extend sheet if it doesn't have enough rows
    var neededRow = firstWriteRow + batchData.length - 1;
    if (neededRow > dataSheet.getMaxRows()) dataSheet.insertRowsAfter(dataSheet.getMaxRows(), neededRow - dataSheet.getMaxRows());
    dataSheet.getRange(firstWriteRow, 1, batchData.length, 14).setValues(batchData);

    // Generate PDF
    var pdfData = { name: name, address: address, phone: phone, date: dateStr, items: items };
    var pdfUrl = buildDeliveryNoteLandscapePDF(invoiceNo, name, pdfData);

    // Update pdfUrl — we know the exact row, no re-read needed
    dataSheet.getRange(firstWriteRow, 13).setValue(pdfUrl);

    if (!data.skipAutoLog) autoLogCustomer_(name, address, phone, "");
    return { invoiceNo: invoiceNo, pdfUrl: pdfUrl };
  } finally {
    lock.releaseLock();
  }
}

function updateDeliveryNoteFromWeb(invoiceId, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), dataSheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!dataSheet) throw new Error("ไม่พบ Invoice History");
  var rows = dataSheet.getRange(1, 1, dataSheet.getLastRow(), 14).getValues(), total = data.total || 0;
  var name = data.name || "", address = data.address || "", phone = data.phone || "";
  var items = data.items || [];
  // Collect row indices that belong to this invoiceId
  var matchRows = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === invoiceId) matchRows.push(i + 1);
  }
  if (matchRows.length === 0) return { success: false, error: "ไม่พบ invoiceId" };
  var filledItems = items.filter(function(it) { return it.desc || it.qty || it.amount; });

  // Capture removed rows + batch delete
  var removedNotes = [];
  var deleteCount = matchRows.length - filledItems.length;
  if (deleteCount > 0) {
    for (var d = matchRows.length - 1; d >= filledItems.length; d--) {
      var r = rows[matchRows[d] - 1];
      var note = [r[5], r[6], r[8]].filter(Boolean).join(" ");
      if (note) removedNotes.push(note);
    }
    dataSheet.deleteRows(matchRows[filledItems.length], deleteCount);
  }

  // Batch update existing rows — one setValues call
  var updateCount = Math.min(filledItems.length, matchRows.length);
  if (updateCount > 0) {
    var updateData = [];
    for (var j = 0; j < updateCount; j++) {
      var it = filledItems[j];
      updateData.push([invoiceId, rows[matchRows[j]-1][1], name, address, phone, it.desc || "", it.desc2 || "", it.detail || "", it.qty || "", it.unitPrice || "", it.amount || "", total]);
    }
    dataSheet.getRange(matchRows[0], 1, updateCount, 12).setValues(updateData);
  }

  // Batch insert new rows — one insertRowsAfter + one setValues
  var addedCount = Math.max(0, filledItems.length - matchRows.length);
  if (addedCount > 0) {
    var lastExisting = matchRows[matchRows.length - 1];
    dataSheet.insertRowsAfter(lastExisting, addedCount);
    var insertData = [];
    for (var k = matchRows.length; k < filledItems.length; k++) {
      var it = filledItems[k];
      insertData.push([invoiceId, rows[matchRows[0]-1][1], name, address, phone, it.desc || "", it.desc2 || "", it.detail || "", it.qty || "", it.unitPrice || "", it.amount || "", total]);
    }
    dataSheet.getRange(lastExisting + 1, 1, addedCount, 12).setValues(insertData);
  }

  // Edit log — use matchRows[0] + existing rows data, no re-read
  var firstOld = rows[matchRows[0] - 1];
  var headerChanged = (String(firstOld[2]).trim() !== name || String(firstOld[3]).trim() !== address || String(firstOld[4]).trim() !== phone);
  var rowValChanged = false;
  for (var rc = 0; rc < Math.min(filledItems.length, matchRows.length); rc++) {
    var oldR = rows[matchRows[rc] - 1], newIt = filledItems[rc];
    if (String(oldR[5]).trim() !== String(newIt.desc || "").trim() ||
        String(oldR[8]).trim() !== String(newIt.qty || "").trim() ||
        String(oldR[9]).trim() !== String(newIt.unitPrice || "").trim()) { rowValChanged = true; break; }
  }
  // Use frontend-tracked add/delete counts when available (accurate), else fall back to net
  var logAddedCount  = (data._logAdded   != null) ? data._logAdded   : addedCount;
  var logDeletedList = (data._logDeleted != null) ? data._logDeleted : removedNotes;
  var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  var changes = [];
  if (logAddedCount > 0) changes.push("เพิ่ม " + logAddedCount + " แถว");
  if (logDeletedList.length > 0) changes.push("ลบ: " + logDeletedList.join(", "));
  if (rowValChanged) changes.push("แก้ไขรายการ");
  if (headerChanged) changes.push("แก้ไขข้อมูล");
  var logEntry = dateStr + ": " + (changes.length > 0 ? changes.join("; ") : "แก้ไข");
  var prevLog = firstOld[13] ? String(firstOld[13]) + " | " : "";
  dataSheet.getRange(matchRows[0], 14).setValue(prevLog + logEntry);
  // Clear both cached PDF URLs so next Print/PDF click regenerates fresh after edit
  dataSheet.getRange(matchRows[0], 13).setValue("");
  dataSheet.getRange(matchRows[0], 15).setValue("");

  autoLogCustomer_(name, address, phone, "");
  return { success: true, invoiceNo: invoiceId };
}

// ============================================================
// BN HISTORY
// ============================================================

function getBillingNotes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), bnHistory = ss.getSheetByName(CONFIG.bnHistory);
  if (!bnHistory || bnHistory.getLastRow() <= 1) return [];
  var data = bnHistory.getDataRange().getValues(), result = [];
  // #105 Option B — one grouped scan of Invoice History → per-BN DN breakdown + address/phone,
  // so the list payload carries each BN's detail and the detail view opens instantly (no per-click scan).
  var tz = Session.getScriptTimeZone(), byBn = {};
  var invSheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (invSheet && invSheet.getLastRow() > 1) {
    var inv = invSheet.getDataRange().getValues();
    for (var r = 1; r < inv.length; r++) {
      var bnRef = inv[r].length > 16 ? String(inv[r][16] || "").trim() : "";
      if (!bnRef) continue;
      var dnNo = String(inv[r][0]).trim();
      if (!dnNo) continue;
      if (!byBn[bnRef]) byBn[bnRef] = { invoices: {}, address: "", phone: "" };
      var g = byBn[bnRef];
      if (!g.invoices[dnNo]) {
        var rd = new Date(inv[r][1]);
        g.invoices[dnNo] = { no: dnNo, date: !isNaN(rd.getTime()) ? Utilities.formatDate(rd, tz, "dd/MM/yyyy") : "", total: inv[r][11] };
      }
      if (!g.address && inv[r][3]) g.address = String(inv[r][3]).trim();
      if (!g.phone  && inv[r][4]) g.phone   = String(inv[r][4]).trim();
    }
  }
  for (var i = 1; i < data.length; i++) {
    var row = data[i]; if (!row[0]) continue;
    var bnNo = String(row[0]).trim();
    var d = row[1] ? new Date(row[1]) : null;
    var grp = byBn[bnNo] || { invoices: {}, address: "", phone: "" };
    var invoices = Object.keys(grp.invoices).map(function(k) { return grp.invoices[k]; });
    invoices.sort(function(a, b) { return a.no.localeCompare(b.no); });
    result.push({ bnNo: bnNo, date: d ? Utilities.formatDate(d, tz, "dd/MM/yyyy") : String(row[1]).trim(), customer: String(row[2]).trim(), count: row[3], total: row[4], pdfUrl: String(row[7]).trim(), landscapeUrl: String(row[11] || "").trim(), cancelled: String(row[9] || "").trim() === "CANCELLED", printed: String(row[10] || "").trim() === "PRINTED", address: grp.address, phone: grp.phone, invoices: invoices });
  }
  return result.reverse();
}

// #106 — mark BNs as printed (col K) so the print queue checkbox state persists across visits
function markBillingNotesPrinted(bnNos) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bnSheet = ss.getSheetByName(CONFIG.bnHistory);
  if (!bnSheet || bnSheet.getLastRow() <= 1) return { success: true, marked: 0 };
  var list = (bnNos || []).map(function(s) { return String(s).trim(); }).filter(Boolean);
  if (!list.length) return { success: true, marked: 0 };
  var bnData = bnSheet.getDataRange().getValues(), marked = 0;
  for (var b = 1; b < bnData.length; b++) {
    if (list.indexOf(String(bnData[b][0]).trim()) >= 0) { bnSheet.getRange(b + 1, 11).setValue("PRINTED"); marked++; }
  }
  return { success: true, marked: marked };
}

// #107 — portrait CSS (no opts). Shared by single + combined builders.
function bnPortraitCSS() {
  return "<style>" + PROMPT_FONT_CSS +
    "html,body{background:white!important;font-family:Prompt,sans-serif;color:#111}" +
    "*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}" +
    "@page{size:A4 portrait;margin:0}" +
    "</style>";
}

// #107 — concatenate page HTML with a page break after every page except the last
function joinBillingNotePages(pages) {
  return pages.map(function(p, i) {
    return i < pages.length - 1 ? "<div style=\"page-break-after:always\">" + p + "</div>" : "<div>" + p + "</div>";
  }).join("");
}

// #107 — render all selected BNs into ONE combined PDF in the chosen format
function printCombinedBillingNotes(bnNos, format) {
  var list = (bnNos || []).map(function(s) { return String(s).trim(); }).filter(Boolean);
  if (!list.length) return { url: "", count: 0 };
  var cfg    = getConfig();
  // #110 — use configured combined folder if set, else auto "Combined" subfolder under BN folder
  var folder = cfg.folders.bnCombined
    ? DriveApp.getFolderById(cfg.folders.bnCombined)
    : getOrCreateChildFolder_(DriveApp.getFolderById(cfg.folders.bn), "Combined");
  var isLandscape = (format === "landscape");
  var pages = [];
  for (var i = 0; i < list.length; i++) {
    var detail = getBillingNoteDetail(list[i]);
    if (!detail || !detail.bnNo) continue;
    var data = { date: detail.date, name: detail.customer, address: detail.address || "", phone: detail.phone || "", invoices: detail.invoices || [], total: detail.total };
    pages.push(isLandscape
      ? bnLandscapePageHTML(detail.bnNo, detail.customer, data, cfg, {})
      : bnPortraitPageHTML(detail.bnNo, detail.customer, data, cfg));
  }
  if (!pages.length) return { url: "", count: 0 };
  var body = joinBillingNotePages(pages);
  var html = isLandscape
    ? "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\">" + bnLandscapeCSS({}) + "</head><body style=\"background:white\">" + body + "</body></html>"
    : "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\">" + bnPortraitCSS() + "</head><body style=\"background:white;padding:0 12mm\">" + body + "</body></html>";
  var blob    = Utilities.newBlob(html, "text/html; charset=utf-8", "bn_combined.html");
  var pdfBlob = blob.getAs("application/pdf");
  var stamp   = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
  pdfBlob.setName("KC_BN_Combined_" + (isLandscape ? "L" : "P") + "_" + stamp + ".pdf");
  var file = folder.createFile(pdfBlob);
  cleanupCombinedFolder_(folder, 5); // #109 keep newest 5, trash older combined files
  return { url: "https://drive.google.com/file/d/" + file.getId() + "/view", count: pages.length };
}

// #109 — get a child folder by name, creating it if missing
function getOrCreateChildFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// #109 — keep only the newest `keep` files in a folder; trash the rest
function cleanupCombinedFolder_(folder, keep) {
  var files = [], it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function(a, b) { return b.getDateCreated() - a.getDateCreated(); }); // newest first
  for (var i = keep; i < files.length; i++) files[i].setTrashed(true);
}

function getBillingNoteDetail(bnNo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Get BN header from BN History
  var bnSheet = ss.getSheetByName(CONFIG.bnHistory);
  var header = { bnNo: bnNo, date: "", customer: "", count: 0, total: 0, pdfUrl: "" };
  if (bnSheet && bnSheet.getLastRow() > 1) {
    var bnData = bnSheet.getDataRange().getValues();
    for (var b = 1; b < bnData.length; b++) {
      if (String(bnData[b][0]).trim() === bnNo) {
        var bd = bnData[b][1] ? new Date(bnData[b][1]) : null;
        header = { bnNo: bnNo, date: bd ? Utilities.formatDate(bd, Session.getScriptTimeZone(), "dd/MM/yyyy") : String(bnData[b][1]).trim(), customer: String(bnData[b][2]).trim(), count: bnData[b][3], total: bnData[b][4], pdfUrl: String(bnData[b][7]).trim(), landscapeUrl: String(bnData[b][11] || "").trim(), cancelled: String(bnData[b][9] || "").trim() === "CANCELLED", addressOverride: String(bnData[b][12] || "").trim(), phoneOverride: String(bnData[b][13] || "").trim() }; // cols M/N override (#124)
        break;
      }
    }
  }
  // Get DNs from Invoice History where col Q (index 16) = bnNo
  var invSheet = ss.getSheetByName(CONFIG.invoiceHistory);
  var invoicesMap = {};
  header.address = ""; header.phone = "";
  if (invSheet && invSheet.getLastRow() > 1) {
    var lastRow = getLastNonEmptyRow(invSheet, "A");
    var invData = invSheet.getRange(1, 1, lastRow, 17).getValues();
    for (var i = 1; i < invData.length; i++) {
      var row = invData[i];
      if (String(row[16]).trim() !== bnNo) continue;
      var dnNo = String(row[0]).trim();
      if (!dnNo) continue;
      if (!header.address && row[3]) header.address = String(row[3]).trim();
      if (!header.phone  && row[4]) header.phone   = String(row[4]).trim();
      if (!invoicesMap[dnNo]) {
        var d = row[1] ? new Date(row[1]) : null;
        invoicesMap[dnNo] = { no: dnNo, date: d ? Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy") : "", total: row[11] };
      }
    }
  }
  if (header.addressOverride) header.address = header.addressOverride; // BN History col M takes priority (#124)
  if (header.phoneOverride)   header.phone   = header.phoneOverride;   // BN History col N takes priority (#124)
  header.invoices = Object.keys(invoicesMap).map(function(k) { return invoicesMap[k]; });
  return header;
}

function getDNDetail(dnNo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!sheet) throw new Error("ไม่พบ Invoice History");
  // #116 — TextFinder on col A locates the DN's rows server-side; no full-column getValues
  // (the old getLastNonEmptyRow("A") read the whole column into the script — that was the 3–4s cost)
  var matches = sheet.getRange("A:A").createTextFinder(dnNo).matchEntireCell(true).findAll();
  if (!matches.length) throw new Error("ไม่พบใบส่งของ " + dnNo);
  var rowNums = matches.map(function(r) { return r.getRow(); });
  var first = Math.min.apply(null, rowNums), last = Math.max.apply(null, rowNums);
  var data = sheet.getRange(first, 1, last - first + 1, 14).getValues();
  var result = null, items = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (String(row[0]).trim() !== dnNo) continue;
    if (!result) {
      var d = row[1] ? new Date(row[1]) : null;
      result = { dnNo: dnNo, date: d ? Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy") : "", customer: String(row[2]).trim(), address: String(row[3] || "").trim(), phone: String(row[4] || "").trim(), total: row[11], pdfUrl: String(row[12] || "").trim() };
    }
    if (row[5] || row[8] || row[10]) items.push({ desc: String(row[5] || "").trim(), desc2: String(row[6] || "").trim(), detail: String(row[7] || "").trim(), qty: row[8] || "", unitPrice: row[9] || "", amount: row[10] || "" });
  }
  if (!result) throw new Error("ไม่พบใบส่งของ " + dnNo);
  result.items = items;
  return result;
}

function cancelBillingNote(bnNo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bnSheet = ss.getSheetByName(CONFIG.bnHistory);
  if (!bnSheet) throw new Error("ไม่พบ BN History");
  var bnData = bnSheet.getDataRange().getValues();
  var found = false;
  for (var b = 1; b < bnData.length; b++) {
    if (String(bnData[b][0]).trim() === bnNo) { bnSheet.getRange(b + 1, 10).setValue("CANCELLED"); found = true; break; }
  }
  if (!found) throw new Error("ไม่พบใบวางบิล " + bnNo);
  var invSheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (invSheet && invSheet.getLastRow() > 1) {
    var lastRow = getLastNonEmptyRow(invSheet, "A");
    var invData = invSheet.getRange(1, 1, lastRow, 17).getValues();
    for (var i = 1; i < invData.length; i++) {
      if (String(invData[i][16]).trim() === bnNo) invSheet.getRange(i + 1, 17).clearContent();
    }
  }
  return { success: true };
}

function getUnbilledDNsForCustomer(customer) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastRow = getLastNonEmptyRow(sheet, "A");
  var data = sheet.getRange(1, 1, lastRow, 17).getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var dnNo = String(row[0]).trim(), name = String(row[2]).trim();
    if (!dnNo || name !== customer) continue;
    if (String(row[15] || "").trim() === "CANCELLED") continue;
    if (String(row[16] || "").trim()) continue;
    if (!map[dnNo]) {
      var d = row[1] ? new Date(row[1]) : null;
      map[dnNo] = { no: dnNo, date: d ? Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy") : "", total: row[11] };
    }
  }
  return Object.keys(map).map(function(k) { return map[k]; }).sort(function(a, b) { return a.no.localeCompare(b.no); });
}

function editBillingNote(bnNo, params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bnSheet = ss.getSheetByName(CONFIG.bnHistory);
  if (!bnSheet) throw new Error("ไม่พบ BN History");
  var bnData = bnSheet.getDataRange().getValues();
  var bnRow = -1;
  for (var b = 1; b < bnData.length; b++) { if (String(bnData[b][0]).trim() === bnNo) { bnRow = b + 1; break; } }
  if (bnRow < 0) throw new Error("ไม่พบใบวางบิล " + bnNo);
  if (params.date)               bnSheet.getRange(bnRow, 2).setValue(params.date);
  if (params.customer)           bnSheet.getRange(bnRow, 3).setValue(params.customer);
  if (params.address !== undefined) bnSheet.getRange(bnRow, 13).setValue(params.address); // col M (#124)
  if (params.phone   !== undefined) bnSheet.getRange(bnRow, 14).setValue(params.phone);   // col N (#124)
  bnSheet.getRange(bnRow, 8).clearContent();  // portrait URL
  bnSheet.getRange(bnRow, 12).clearContent(); // landscape URL (#123)
  var invSheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (invSheet && invSheet.getLastRow() > 1) {
    var lastRow = getLastNonEmptyRow(invSheet, "A");
    var invData = invSheet.getRange(1, 1, lastRow, 17).getValues();
    var addSet = {}, removeSet = {};
    if (params.addDnNos) params.addDnNos.forEach(function(n) { addSet[n] = true; });
    if (params.removeDnNos) params.removeDnNos.forEach(function(n) { removeSet[n] = true; });
    for (var i = 1; i < invData.length; i++) {
      var dnNo2 = String(invData[i][0]).trim();
      if (addSet[dnNo2])    invSheet.getRange(i + 1, 17).setValue(bnNo);
      if (removeSet[dnNo2] && String(invData[i][16]).trim() === bnNo) invSheet.getRange(i + 1, 17).clearContent();
    }
    var countData = invSheet.getRange(1, 1, lastRow, 17).getValues();
    var dnSet = {}, newTotal = 0;
    for (var j = 1; j < countData.length; j++) {
      if (String(countData[j][16]).trim() !== bnNo) continue;
      var k = String(countData[j][0]).trim(); if (!k) continue;
      if (!dnSet[k]) { dnSet[k] = true; newTotal += (countData[j][11] || 0); }
    }
    var newCount = Object.keys(dnSet).length;
    bnSheet.getRange(bnRow, 4).setValue(newCount);
    bnSheet.getRange(bnRow, 5).setValue(newTotal);
  }
  return { success: true };
}

// #123 — generate (or serve cached) landscape PDF for a BN; stores URL in col L
function generateBillingNoteLandscapePDF(bnNo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bnSheet = ss.getSheetByName(CONFIG.bnHistory);
  if (!bnSheet) throw new Error("ไม่พบ BN History");
  var bnData = bnSheet.getDataRange().getValues();
  var bnRow = -1;
  for (var b = 1; b < bnData.length; b++) {
    if (String(bnData[b][0]).trim() === bnNo) { bnRow = b + 1; break; }
  }
  if (bnRow < 0) throw new Error("ไม่พบใบวางบิล " + bnNo);
  var cached = String(bnData[bnRow - 1][11] || "").trim();
  if (cached) return { url: cached };
  var detail = getBillingNoteDetail(bnNo);
  var data = { date: detail.date, name: detail.customer, address: detail.address || "", phone: detail.phone || "", invoices: detail.invoices || [], total: detail.total };
  var url = buildBillingNoteLandscapePDF(bnNo, detail.customer, data);
  bnSheet.getRange(bnRow, 12).setValue(url);
  return { url: url };
}

// #125 — generate (or serve cached) portrait PDF for a BN; stores URL in col H
function generateBillingNotePortraitPDF(bnNo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bnSheet = ss.getSheetByName(CONFIG.bnHistory);
  if (!bnSheet) throw new Error("ไม่พบ BN History");
  var bnData = bnSheet.getDataRange().getValues();
  var bnRow = -1;
  for (var b = 1; b < bnData.length; b++) {
    if (String(bnData[b][0]).trim() === bnNo) { bnRow = b + 1; break; }
  }
  if (bnRow < 0) throw new Error("ไม่พบใบวางบิล " + bnNo);
  var cached = String(bnData[bnRow - 1][7] || "").trim(); // col H
  if (cached) return { url: cached };
  var detail = getBillingNoteDetail(bnNo);
  var data = { date: detail.date, name: detail.customer, address: detail.address || "", phone: detail.phone || "", invoices: detail.invoices || [], total: detail.total };
  var url = buildBillingNotePortraitPDF(bnNo, detail.customer, data);
  bnSheet.getRange(bnRow, 8).setValue(url); // col H
  return { url: url };
}

// ============================================================
// CONFIG
// ============================================================

function getAppVersion() {
  var v = "1.4.203"; // bump this alongside the version header comment
  Logger.log(v);
  return v;
}

function getConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.configSheet);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.configSheet); sheet.appendRow(["type", "value"]);
    var defaults = [["company","หจก. โรงงานกิมเชียง"],["nameEN","KIMCHIANG LIMITED PARTNERSHIP"],["address","25/9 หมู่ 10 ต.ลอมแม่นาง อ.บางใหญ่ จ.นนทบุรี 11140"],["tel","02-191-8698-9"],["folderDN",""],["folderTI",""],["folderBN",""],["folderBNCombined",""],["vatRate","0.07"]];
    defaults.forEach(function(r) { sheet.appendRow(r); });
  }
  var data = sheet.getDataRange().getValues(), company = {}, folders = {}, vatRate_ = VAT_RATE;
  for (var i = 1; i < data.length; i++) {
    var type = String(data[i][0]).trim(), val = String(data[i][1]).trim();
    if      (type === "company")  company.name    = val;
    else if (type === "nameEN")   company.nameEN  = val;
    else if (type === "address")  company.address = val;
    else if (type === "tel")      company.tel     = val;
    else if (type === "taxId")    company.taxId   = val;
    else if (type === "folderDN") folders.dn = extractFolderId_(val);
    else if (type === "folderTI") folders.ti = extractFolderId_(val);
    else if (type === "folderBN") folders.bn = extractFolderId_(val);
    else if (type === "folderBNCombined") folders.bnCombined = extractFolderId_(val);
    else if (type === "vatRate")  vatRate_ = parseFloat(val) || VAT_RATE;
  }
  var pc = getProductConfig();
  return { products: pc.products, sizes: pc.sizes, company: company, folders: folders, vatRate: vatRate_ };
}

function saveConfig(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.configSheet) || ss.insertSheet(CONFIG.configSheet);
  sheet.clearContents(); sheet.appendRow(["type", "value"]);
  if (data.company) { sheet.appendRow(["company", data.company.name || ""]); sheet.appendRow(["nameEN", data.company.nameEN || ""]); sheet.appendRow(["address", data.company.address || ""]); sheet.appendRow(["tel", data.company.tel || ""]); sheet.appendRow(["taxId", data.company.taxId || ""]); }
  if (data.folders) { sheet.appendRow(["folderDN", data.folders.dn || ""]); sheet.appendRow(["folderTI", data.folders.ti || ""]); sheet.appendRow(["folderBN", data.folders.bn || ""]); sheet.appendRow(["folderBNCombined", data.folders.bnCombined || ""]); }
  return { success: true };
}

function getProductConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName("Config_Products");
  if (!sheet) return { products: [], sizes: [] };
  var data = sheet.getDataRange().getValues(), products = [], sizes = [];
  for (var i = 1; i < data.length; i++) {
    var type = String(data[i][0]).trim(), val = String(data[i][1]).trim();
    if      (type === "product") products.push(val);
    else if (type === "size")    sizes.push(val);
  }
  return { products: products, sizes: sizes };
}

function addProduct(name, type) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName("Config_Products");
  if (!sheet) { sheet = ss.insertSheet("Config_Products"); sheet.appendRow(["type", "value"]); }
  var trimmed = String(name).trim();
  if (!trimmed) return { success: false, error: "ชื่อสินค้าว่าง" };
  var rowType = (type === "size") ? "size" : "product";
  sheet.appendRow([rowType, trimmed]);
  return { success: true, name: trimmed };
}

function getProducts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName("Config_Products");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var result = [];
  for (var i = 0; i < data.length; i++) {
    var type = String(data[i][0]).trim(), value = String(data[i][1]).trim();
    if (type && value) result.push({ type: type, value: value, row: i + 2 });
  }
  return result;
}

function updateProduct(row, value) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName("Config_Products");
  if (!sheet) throw new Error("ไม่พบ Config_Products");
  var trimmed = String(value).trim();
  if (!trimmed) throw new Error("ชื่อว่าง");
  sheet.getRange(row, 2).setValue(trimmed);
  return { success: true };
}

function deleteProduct(row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName("Config_Products");
  if (!sheet) throw new Error("ไม่พบ Config_Products");
  sheet.deleteRow(row);
  return { success: true };
}

// ============================================================
// TAX INVOICE
// ============================================================

function getNextTaxInvoiceNumber() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.tiSheet), yearYY = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yy");
  if (!sheet || sheet.getLastRow() <= 1) return "IV-" + yearYY + "-000001";
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) return "IV-" + yearYY + "-000001";
  var colA = sheet.getRange(1, 1, lastDataRow, 1).getValues(), lastNo = "";
  for (var i = colA.length - 1; i >= 1; i--) { if (colA[i][0]) { lastNo = String(colA[i][0]).trim(); break; } }
  if (!lastNo) return "IV-" + yearYY + "-000001";
  var parts = lastNo.split("-"), lastYY = parts[1], lastNum = parseInt(parts[parts.length - 1], 10), newNum = (lastYY !== yearYY || isNaN(lastNum)) ? 1 : lastNum + 1;
  return "IV-" + yearYY + "-" + newNum.toString().padStart(6, "0");
}

function getTaxInvoices(startDate, endDate, search) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.tiSheet);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) return [];
  var data = sheet.getRange(1, 1, lastDataRow, 18).getValues(), start = startDate ? new Date(startDate) : null, end = endDate ? new Date(endDate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end)   end.setHours(23, 59, 59);
  var grouped = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i], invoiceNo = String(row[0]).trim();
    if (!invoiceNo) continue;
    if (String(row[17]).trim() === "CANCELLED") continue;
    var rowDate = new Date(row[1]), name = String(row[2]).trim();
    if (start && rowDate < start) continue;
    if (end   && rowDate > end)   continue;
    if (search) { var q = search.toLowerCase(); if (!invoiceNo.toLowerCase().includes(q) && !name.toLowerCase().includes(q)) continue; }
    if (!grouped[invoiceNo]) {
      grouped[invoiceNo] = { id: invoiceNo, date: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd"), name: name, address: String(row[3]).trim(), phone: String(row[4]).trim(), taxId: String(row[5]).trim(), invoiceRef: String(row[6]).trim(), pdfUrl: row[13] ? String(row[13]).trim() : "", portraitUrl: row[16] ? String(row[16]).trim() : "", items: [] };
    }
    grouped[invoiceNo].items.push({ desc: String(row[7]).trim(), desc2: String(row[8]).trim(), detail: String(row[9]).trim(), qty: row[10], unitPrice: row[11], amount: row[12] });
  }
  var result = Object.values(grouped);
  result.forEach(function(inv) {
    var sub = inv.items.reduce(function(s, it) { return s + (parseFloat(it.amount) || 0); }, 0);
    inv.subtotal = parseFloat(sub.toFixed(2)); inv.vatAmt = parseFloat((sub * VAT_RATE).toFixed(2)); inv.grandTotal = parseFloat((sub + sub * VAT_RATE).toFixed(2));
  });
  return result.sort(function(a, b) { return b.id.localeCompare(a.id); });
}

// ── Cancel / Restore ──────────────────────────────────────

function cancelDeliveryNote(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!sheet) throw new Error("ไม่พบ sheet");
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) throw new Error("ไม่พบใบส่งของ " + invoiceId);
  var colA = sheet.getRange(2, 1, lastDataRow - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]).trim() === invoiceId) sheet.getRange(i + 2, 16).setValue("CANCELLED");
  }
  return { success: true };
}

function restoreDeliveryNote(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!sheet) throw new Error("ไม่พบ sheet");
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) return { success: true };
  var colA = sheet.getRange(2, 1, lastDataRow - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]).trim() === invoiceId) sheet.getRange(i + 2, 16).clearContent();
  }
  return { success: true };
}

function getCancelledDeliveryNotes(search) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) return [];
  var data = sheet.getRange(1, 1, lastDataRow, 16).getValues();
  var grouped = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[15]).trim() !== "CANCELLED") continue;
    var invoiceNo = String(row[0]).trim(), name = String(row[2]).trim();
    if (!invoiceNo || !name) continue;
    if (search) { var q = search.toLowerCase(); if (!invoiceNo.toLowerCase().includes(q) && !name.toLowerCase().includes(q)) continue; }
    if (!grouped[invoiceNo]) {
      var rowDate = new Date(row[1]);
      grouped[invoiceNo] = { id: invoiceNo, date: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd"), name: name, address: String(row[3]).trim(), phone: String(row[4]).trim(), total: row[11], pdfUrl: row[12] ? String(row[12]).trim() : "", portraitUrl: row[14] ? String(row[14]).trim() : "", cancelled: true, items: [] };
    }
    grouped[invoiceNo].items.push({ desc: String(row[5]).trim(), desc2: String(row[6]).trim(), detail: String(row[7]).trim(), qty: row[8], unitPrice: row[9], amount: row[10] });
  }
  return Object.values(grouped).sort(function(a, b) { return b.id.localeCompare(a.id); });
}

function cancelTaxInvoice(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.tiSheet);
  if (!sheet) throw new Error("ไม่พบ sheet");
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) throw new Error("ไม่พบใบกำกับภาษี " + invoiceId);
  var colA = sheet.getRange(2, 1, lastDataRow - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]).trim() === invoiceId) sheet.getRange(i + 2, 18).setValue("CANCELLED");
  }
  return { success: true };
}

function restoreTaxInvoice(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.tiSheet);
  if (!sheet) throw new Error("ไม่พบ sheet");
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) return { success: true };
  var colA = sheet.getRange(2, 1, lastDataRow - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]).trim() === invoiceId) sheet.getRange(i + 2, 18).clearContent();
  }
  return { success: true };
}

function getCancelledTaxInvoices(search) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.tiSheet);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) return [];
  var data = sheet.getRange(1, 1, lastDataRow, 18).getValues();
  var grouped = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[17]).trim() !== "CANCELLED") continue;
    var invoiceNo = String(row[0]).trim(), name = String(row[2]).trim();
    if (!invoiceNo || !name) continue;
    if (search) { var q = search.toLowerCase(); if (!invoiceNo.toLowerCase().includes(q) && !name.toLowerCase().includes(q)) continue; }
    if (!grouped[invoiceNo]) {
      var rowDate = new Date(row[1]);
      grouped[invoiceNo] = { id: invoiceNo, date: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd"), name: name, address: String(row[3]).trim(), phone: String(row[4]).trim(), taxId: String(row[5]).trim(), invoiceRef: String(row[6]).trim(), pdfUrl: row[13] ? String(row[13]).trim() : "", portraitUrl: row[16] ? String(row[16]).trim() : "", cancelled: true, items: [] };
    }
    grouped[invoiceNo].items.push({ desc: String(row[7]).trim(), desc2: String(row[8]).trim(), detail: String(row[9]).trim(), qty: row[10], unitPrice: row[11], amount: row[12] });
  }
  var result = Object.values(grouped);
  result.forEach(function(inv) {
    var sub = inv.items.reduce(function(s, it) { return s + (parseFloat(it.amount) || 0); }, 0);
    inv.subtotal = parseFloat(sub.toFixed(2)); inv.vatAmt = parseFloat((sub * VAT_RATE).toFixed(2)); inv.grandTotal = parseFloat((sub + sub * VAT_RATE).toFixed(2));
  });
  return result.sort(function(a, b) { return b.id.localeCompare(a.id); });
}

// ============================================================
// CUSTOMER LIST
// ============================================================

function getCustomerSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.customerSheet);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.customerSheet);
    sheet.appendRow(["ชื่อลูกค้า", "ที่อยู่", "โทรศัพท์", "เลขภาษี", "หมายเหตุ"]);
  }
  return sheet;
}

function getCustomers(search) {
  var sheet = getCustomerSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var q = search ? search.toLowerCase() : "";
  return data
    .filter(function(r) { return r[0] && String(r[0]).trim() && String(r[4]).trim() !== "ลบแล้ว"; })
    .filter(function(r) {
      if (!q) return true;
      return String(r[0]).toLowerCase().includes(q) || String(r[1]).toLowerCase().includes(q) || String(r[2]).toLowerCase().includes(q);
    })
    .map(function(r) {
      return { name: String(r[0]).trim(), address: String(r[1]).trim(), phone: String(r[2]).trim(), taxId: String(r[3]).trim(), note: String(r[4]).trim() };
    });
}

function createCustomer(data) {
  var sheet = getCustomerSheet_();
  var name = String(data.name || "").trim();
  if (!name) throw new Error("ชื่อลูกค้าห้ามว่าง");
  // Check uniqueness
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var existing = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    for (var i = 0; i < existing.length; i++) {
      if (String(existing[i][0]).trim().toLowerCase() === name.toLowerCase() && String(existing[i][4]).trim() !== "ลบแล้ว") throw new Error("ชื่อ \"" + name + "\" มีอยู่แล้ว");
    }
  }
  sheet.appendRow([name, data.address || "", data.phone || "", data.taxId || "", data.note || ""]);
  return { success: true };
}

function updateCustomer(originalName, data) {
  var sheet = getCustomerSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("ไม่พบลูกค้า " + originalName);
  var rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var newName = String(data.name || "").trim();
  if (!newName) throw new Error("ชื่อลูกค้าห้ามว่าง");
  var targetRow = -1;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === String(originalName).trim().toLowerCase()) { targetRow = i + 2; break; }
  }
  if (targetRow === -1) throw new Error("ไม่พบลูกค้า " + originalName);
  // Check uniqueness if name is changing
  if (newName.toLowerCase() !== String(originalName).trim().toLowerCase()) {
    for (var j = 0; j < rows.length; j++) {
      if (j + 2 === targetRow) continue;
      if (String(rows[j][0]).trim().toLowerCase() === newName.toLowerCase()) throw new Error("ชื่อ \"" + newName + "\" มีอยู่แล้ว");
    }
  }
  sheet.getRange(targetRow, 1, 1, 5).setValues([[newName, data.address || "", data.phone || "", data.taxId || "", data.note || ""]]);
  return { success: true };
}

function deleteCustomer(name) {
  var sheet = getCustomerSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("ไม่พบลูกค้า " + name);
  var rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === String(name).trim().toLowerCase() && String(rows[i][4]).trim() !== "ลบแล้ว") {
      sheet.getRange(i + 2, 5).setValue("ลบแล้ว"); // soft-delete: preserve row for audit history
      return { success: true };
    }
  }
  throw new Error("ไม่พบลูกค้า " + name);
}

// Auto-log customer from invoice save — silently upserts (skips if name already exists)
function autoLogCustomer_(name, address, phone, taxId) {
  try {
    name = String(name || "").trim();
    if (!name) return;
    var sheet = getCustomerSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i][0]).trim().toLowerCase() === name.toLowerCase()) return; // already exists
      }
    }
    sheet.appendRow([name, address || "", phone || "", taxId || "", ""]);
  } catch (e) {
    // Never throw — invoice save must not fail because of customer logging
    Logger.log("autoLogCustomer_ error: " + e.message);
  }
}

// ============================================================

function createTaxInvoiceFromWeb(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.tiSheet);
  if (!sheet) throw new Error("ไม่พบ sheet '" + CONFIG.tiSheet + "'");

  // Duplicate prevention lock
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch(e) { throw new Error("ระบบกำลังประมวลผล กรุณารอสักครู่"); }

  var invoiceNo = getNextTaxInvoiceNumber(), date = new Date(data.date), name = data.name || "", address = data.address || "", phone = data.phone || "", taxId = data.taxId || "", invRef = data.invoiceRef || "", items = data.items || [];
  if (sheet.getLastRow() === 0) sheet.appendRow(["เลขที่","วันที่","ชื่อลูกค้า","ที่อยู่","โทรศัพท์","เลขภาษี","อ้างอิงใบส่งของ","รายการ","ขนาด","รายละเอียด","จำนวน","ราคาหน่วยละ","จำนวนเงิน","File"]);
  var filledItems = items.filter(function(it) { return it.desc || it.qty || it.amount; });
  if (filledItems.length === 0) throw new Error("ไม่มีรายการสินค้า");
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  var firstWriteRow = lastDataRow + 1;
  var batchData = filledItems.map(function(it) {
    return [invoiceNo, date, name, address, phone, taxId, invRef, it.desc || "", it.desc2 || "", it.detail || "", it.qty || "", it.unitPrice || "", it.amount || "", ""];
  });
  // Extend sheet if it doesn't have enough rows
  var neededRow = firstWriteRow + batchData.length - 1;
  if (neededRow > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), neededRow - sheet.getMaxRows());
  sheet.getRange(firstWriteRow, 1, batchData.length, 14).setValues(batchData);
  lock.releaseLock();
  // Generate PDF outside lock — use firstWriteRow directly, no re-read
  var pdfUrl = buildTaxInvoiceLandscapePDF(invoiceNo, name, data);
  sheet.getRange(firstWriteRow, 14).setValue(pdfUrl);
  if (!data.skipAutoLog) autoLogCustomer_(name, address, phone, taxId);
  return { invoiceNo: invoiceNo, pdfUrl: pdfUrl };
}

function thaiMonth(dateStr) {
  var months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  var s = String(dateStr || "");
  if (!s) return "";
  var d;
  if (s.indexOf("/") >= 0) {            // dd/MM/yyyy (e.g. from getBillingNoteDetail)
    var p = s.split("/");
    d = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
  } else {
    d = new Date(s);                    // yyyy-MM-dd or other native-parseable
  }
  if (isNaN(d.getTime())) return s;
  return d.getDate() + " " + months[d.getMonth()] + " " + (d.getFullYear() + 543);
}

function bahtTextGS(amount) {
  if (!amount || amount === 0) return "ศูนย์บาทถ้วน";
  var ones = ["","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"];
  var places = ["","สิบ","ร้อย","พัน","หมื่น","แสน"];
  function rg(n) {
    if (n === 0) return "";
    var r = "", s = String(n).split("").reverse();
    for (var i = 0; i < s.length; i++) {
      var di = parseInt(s[i]); if (di === 0) continue;
      if (i===1&&di===1) r="สิบ"+r; else if(i===1&&di===2) r="ยี่สิบ"+r;
      else if(i===0&&di===1&&s.length>1) r="เอ็ด"+r; else r=ones[di]+places[i]+r;
    }
    return r;
  }
  var parts = amount.toFixed(2).split(".");
  var iv = parseInt(parts[0]), sv = parseInt(parts[1]);
  var r = iv >= 1000000 ? rg(Math.floor(iv/1000000))+"ล้าน"+(iv%1000000>0?rg(iv%1000000):"") : rg(iv);
  return r + "บาท" + (sv > 0 ? rg(sv) + "สตางค์" : "ถ้วน");
}

function buildTaxInvoiceLandscapePDF(invoiceNo, name, data, opts) {
  opts = opts || {};
  var pageMargin      = opts.pageMargin      || "8mm 8mm 8mm 0";
  var pageWidth       = opts.pageWidth       || "262mm";
  var pagePaddingTop  = opts.pagePaddingTop  || "10mm";
  var pageMarginLeft  = opts.pageMarginLeft  || "1.2mm";
  var showDesc2Parens = opts.showDesc2Parens === true;
  var centerLock      = opts.centerLock !== false; // default true — center-lock is live (#43)
  var outerLeft       = opts.outerLeft  || "13mm";   // promoted v1.4.152 (staged v1.4.149–151)
  var outerRight      = opts.outerRight || "2mm";    // promoted v1.4.152
  var innerGap        = opts.innerGap   || "3mm";
  var innerGapL       = opts.innerGapL  || "5mm";    // promoted v1.4.152 — left inner gap (independent of innerGapR)
  var innerGapR       = opts.innerGapR  || "9mm";    // promoted v1.4.152 — right inner gap
  // CALIBRATED — divider frozen at paper center (empirical 2026-06-17, @page left:0, 1:1 flex ratio)
  // Only change via staging re-calibration; do not expose as a user opt
  var leftHalfWidth   = opts.leftHalfWidth || "151.5mm";
  var cfg    = getConfig();
  var folder = DriveApp.getFolderById(cfg.folders.ti);
  var co     = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var coNameEN = co.nameEN || "";
  var coAddr   = co.address || "";
  var coTel    = co.tel     || "";
  var coTaxId  = co.taxId   || "";
  var items  = data.items || [];
  var sub    = 0;
  for (var i = 0; i < items.length; i++) sub += parseFloat(items[i].amount) || 0;
  var vat   = parseFloat((sub * (cfg.vatRate || VAT_RATE)).toFixed(2));
  var total = parseFloat((sub + vat).toFixed(2));

  // Format address: split into 2 lines at จังหวัด
  function fmtAddr(addr) {
    var m = addr.match(/^(.*?)\s*(จังหวัด.*)/);
    if (m) return [m[1].trim(), m[2].trim()];
    return [addr.trim(), ''];
  }
  var addrParts = fmtAddr(coAddr);
  var addrLine1 = addrParts[0];
  var addrLine2 = addrParts[1];

  function fmt(n) { return parseFloat(n).toLocaleString("th-TH", {minimumFractionDigits:2, maximumFractionDigits:2}); }

  var filledItems = items.filter(function(it){ return it.desc || it.desc2 || it.detail || it.qty || it.amount; });
  var itemRows = "";
  var rowCount = 0;
  for (var i = 0; i < filledItems.length; i++) {
    var it = filledItems[i];
    var parts = (it.detail || "").split(" | ");
    var b = Math.floor(Number(it.amount) || 0);
    var s = Math.round((Number(it.amount||0) - b) * 100);
    var even = i % 2 === 0;
    var descLeft = (it.desc||"") + (it.desc2 ? (showDesc2Parens ? " ("+it.desc2+")" : " "+it.desc2) : "");
    var descRight = parts[0] || "";
    var lastContIdx = -1;
    for (var k = 1; k < parts.length; k++) { if (parts[k]) lastContIdx = k; }
    var bdr = lastContIdx >= 0 ? "border-bottom:none;" : "";
    itemRows += "<tr style=\"background:" + (even?"white":"#fafbff") + "\">" +
      "<td style=\"" + bdr + "color:#181818;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:38mm;flex-shrink:0;white-space:nowrap;overflow:hidden\">" + descLeft + "</div><div style=\"flex:1;min-width:0;white-space:nowrap;overflow:hidden\">" + descRight + "</div></div></td>" +
      "<td style=\"" + bdr + "text-align:center;color:#181818\">" + (it.qty||"") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;color:#181818\">" + (it.unitPrice ? parseFloat(it.unitPrice).toLocaleString("th-TH") : "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;font-weight:500;color:#181818\">" + (b > 0 ? b.toLocaleString("th-TH") : "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;color:#181818\">" + (b > 0 ? (s > 0 ? String(s).padStart(2,"0") : "00") : "") + "</td></tr>";
    rowCount++;
    for (var j = 1; j < parts.length; j++) {
      if (parts[j]) {
        var contBdr = j === lastContIdx ? "" : "border-bottom:none;";
        itemRows += "<tr style=\"background:" + (even?"white":"#fafbff") + "\">" +
          "<td style=\"" + contBdr + "color:#181818;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:38mm;flex-shrink:0\"></div><div style=\"flex:1;min-width:0;white-space:nowrap;overflow:hidden\">" + parts[j] + "</div></div></td>" +
          "<td style=\"" + contBdr + "\"></td>" +
          "<td style=\"" + contBdr + "\"></td>" +
          "<td style=\"" + contBdr + "\"></td>" +
          "<td style=\"" + contBdr + "\"></td></tr>";
        rowCount++;
      }
    }
  }
  for (var i = rowCount; i < 10; i++) {
    itemRows += "<tr style=\"background:" + (i%2===0?"white":"#fafbff") + "\"><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>";
  }

  // type = "tax" | "receipt"
  // Titles/notes/sigs match original paper set (same logic as portrait page())
  function half(type, isOriginal) {
    var docTitle, docNote, sigLabel;
    if (type === "tax" && isOriginal) {
      docTitle = "ต้นฉบับใบกำกับภาษี/<br>ใบส่งสินค้า";
      docNote  = "";
      sigLabel = "ผู้ส่งของ";
    } else if (type === "tax" && !isOriginal) {
      docTitle = "สำเนาใบกำกับภาษี/<br>สำเนาใบส่งสินค้า";
      docNote  = "<div style=\"font-size:2.5mm;color:#c23934;text-align:right;margin-top:0.5mm\">(ไม่ใช่ใบกำกับภาษี)</div>";
      sigLabel = "ผู้ส่งของ";
    } else if (type === "receipt" && isOriginal) {
      docTitle = "ใบเสร็จรับเงิน";
      docNote  = "<div style=\"font-size:2.5mm;color:#c23934;text-align:right;margin-top:0.5mm\">(ไม่ใช่ใบกำกับภาษี)</div>";
      sigLabel = "ผู้รับเงิน";
    } else {
      docTitle = "สำเนาใบกำกับภาษี/<br>สำเนาใบส่งสินค้า/<br>สำเนาใบเสร็จรับเงิน";
      docNote  = "<div style=\"font-size:2.5mm;color:#c23934;text-align:right;margin-top:0.5mm\">(ไม่ใช่ใบกำกับภาษี)</div>";
      sigLabel = "ผู้ส่งของ";
    }
    return "<div class=\"half" + (centerLock ? (isOriginal ? " left-h" : " right-h") : "") + "\">" +
      "<div class=\"header\">" +
        "<div style=\"flex:1;min-width:0\">" +
          "<div style=\"display:flex;align-items:flex-start;gap:2.5mm\">" +
            "<div class=\"kc-logo\">KC</div>" +
            "<div>" +
              "<div class=\"company-name\">" + coName + "</div>" +
              "<div class=\"company-name-en\">" + coNameEN + "</div>" +
            "</div>" +
          "</div>" +
          "<div class=\"company-sub\" style=\"margin-top:0.8mm\">" + addrLine1 + "</div>" +
          "<div class=\"company-sub\">" + (addrLine2 ? addrLine2 + " &nbsp; " : "") + "Tel/Fax : " + coTel + "</div>" +
          "<div class=\"company-sub\" style=\"margin-top:0.3mm\">" + (coTaxId ? "เลขประจำตัวผู้เสียภาษีอากร " + coTaxId : "") + "</div>" +
        "</div>" +
        "<div style=\"text-align:right;display:flex;flex-direction:column;align-self:stretch;max-width:58mm;flex-shrink:0;margin-left:2mm\">" +
          "<div>" +
            "<div class=\"doc-title\">" + docTitle + "</div>" +
            docNote +
          "</div>" +
          "<div class=\"doc-no\" style=\"margin-top:auto\">เลขที่ " + invoiceNo + "</div>" +
        "</div>" +
      "</div>" +
      "<div class=\"customer-box\">" +
        "<div><div class=\"field-label\">ชื่อลูกค้า / บริษัท</div>" +
        "<div class=\"field-value\">" + (data.name||"") + "</div>" +
        "<div class=\"field-label\" style=\"margin-top:1.5mm\">ที่อยู่</div>" +
        "<div class=\"field-sub\">" + (data.address||"") + "</div></div>" +
        "<div style=\"text-align:right\">" +
          "<div style=\"margin-bottom:1.5mm\"><div class=\"field-label\">วันที่</div><div class=\"field-value\">" + thaiMonth(data.date) + "</div></div>" +
          "<div style=\"margin-bottom:1.5mm\"><div class=\"field-label\">เลขประจำตัวผู้เสียภาษีอากร</div><div class=\"field-value mono\" style=\"letter-spacing:0.05em\">" + (data.taxId||"—") + "</div></div>" +
          "<div><div class=\"field-label\">อ้างอิงใบส่งของเลขที่</div><div class=\"field-value accent\">" + (data.invoiceRef||"—") + "</div></div>" +
        "</div>" +
      "</div>" +
      "<table class=\"items-table\">" +
        "<colgroup><col><col style=\"width:16mm\"><col style=\"width:16mm\"><col style=\"width:18mm\"><col style=\"width:7mm\"></colgroup>" +
        "<thead><tr><th>รายการ / Description</th><th style=\"text-align:center\">จำนวน</th><th style=\"text-align:right\">หน่วยละ</th><th style=\"text-align:right\">จำนวนเงิน</th><th style=\"text-align:right\">สต.</th></tr></thead>" +
        "<tbody>" + itemRows + "</tbody>" +
      "</table>" +
      "<div style=\"margin-top:auto\">" +
        "<div style=\"display:flex;align-items:stretch;gap:2.7mm;margin-bottom:4mm\">" +
          "<div style=\"flex:1;min-width:0;display:flex;flex-direction:column\">" +
            "<div class=\"baht-text-label\">จำนวนเงิน (ตัวอักษร)</div>" +
            "<div class=\"baht-text\" style=\"flex:1\">(" + bahtTextGS(total) + ")</div>" +
          "</div>" +
          "<div style=\"flex-shrink:0;white-space:nowrap\">" +
            "<div style=\"display:flex;justify-content:space-between;gap:4mm;font-size:2.5mm;padding:0.5mm 0\"><span style=\"color:#6b6b6b\">รวมมูลค่าสินค้า</span><span style=\"font-family:Prompt,sans-serif\">" + fmt(sub) + "</span></div>" +
            "<div style=\"display:flex;justify-content:space-between;gap:4mm;font-size:2.5mm;padding:0.5mm 0\"><span style=\"color:#6b6b6b\">จำนวนภาษีมูลค่าเพิ่ม 7%</span><span style=\"font-family:Prompt,sans-serif\">" + fmt(vat) + "</span></div>" +
            "<div style=\"display:flex;justify-content:space-between;gap:4mm;border-top:0.4mm solid #032d60;padding-top:1.2mm;margin-top:0.5mm\"><span style=\"font-size:3.5mm;font-weight:500\">รวมทั้งสิ้น</span><span style=\"font-size:3.5mm;font-weight:500;color:#0176d3;font-family:Prompt,sans-serif\">฿" + fmt(total) + "</span></div>" +
          "</div>" +
        "</div>" +
        "<div class=\"sig-row\">" +
          "<span style=\"font-size:2.4mm;color:#6b6b6b;display:flex;align-items:flex-end;flex:1;min-width:0\">ลงชื่อ&nbsp;<span style=\"flex:1;border-bottom:0.3mm solid #eee;height:3mm;display:inline-block\"></span>&nbsp;" + sigLabel + "</span>" +
          "<span style=\"font-size:2.4mm;color:#6b6b6b;display:flex;align-items:flex-end;flex:1;min-width:0\">ลงชื่อ&nbsp;<span style=\"flex:1;border-bottom:0.3mm solid #eee;height:3mm;display:inline-block\"></span>&nbsp;ผู้รับของ</span>" +
        "</div>" +
        "<div class=\"note\">ได้รับสินค้าตามรายการข้างบนนี้ไว้ถูกต้องแล้ว</div>" +
      "</div>" +
    "</div>";
  }

  var fontCss = PROMPT_FONT_CSS;
  var css = "<style>" + fontCss +
    "html,body{background:white!important;color:#181818!important;font-family:Prompt,sans-serif;-webkit-font-smoothing:antialiased;font-kerning:none;text-rendering:optimizeLegibility;}" +
    "*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}" +
    "body{font-family:Prompt,sans-serif}" +
    "@page{size:A4 landscape;margin:" + pageMargin + "}" +
    (centerLock
      ? ".page{background:white;width:297mm;min-height:182mm;display:flex;gap:0;padding:" + pagePaddingTop + " 0 0 0;margin-left:0}" +
        ".half{display:flex;flex-direction:column}" +
        ".half.left-h{flex-shrink:0;width:" + leftHalfWidth + ";padding-left:" + outerLeft + ";padding-right:" + innerGapL + "}" +
        ".half.right-h{flex:1;min-width:0;padding-left:" + innerGapR + ";padding-right:" + outerRight + "}"
      : ".page{background:white;width:" + pageWidth + ";min-height:182mm;display:flex;gap:5.4mm;padding:" + pagePaddingTop + " 0 0 0;margin-left:" + pageMarginLeft + "}" +
        ".half{flex:1;min-width:0;display:flex;flex-direction:column}"
    ) +
    ".page-break{page-break-after:always}" +
    ".divider{width:0;border-left:0.5mm dotted #ddd;flex-shrink:0}" +
    ".header{display:flex;justify-content:space-between;min-height:32mm;margin-bottom:2.9mm;padding-bottom:2.2mm;border-bottom:0.3mm solid #ddd}" +
    ".kc-logo{width:9.5mm;height:9.5mm;background:#032d60;border-radius:1.5mm;text-align:center;line-height:9.5mm;font-weight:700;font-size:5mm;color:white;display:inline-block;vertical-align:middle;flex-shrink:0}" +
    ".company-name{font-size:3.8mm;font-weight:600;color:#181818}" +
    ".company-name-en{font-size:2.8mm;font-weight:500;color:#181818;margin-top:0.3mm}" +
    ".company-sub{font-size:2.6mm;color:#6b6b6b;margin-top:0.4mm}" +
    ".doc-title{font-size:5.5mm;font-weight:500;color:#032d60;text-align:right;line-height:1.2}" +
    ".doc-sub{font-size:3mm;color:#6b6b6b;text-align:right}" +
    ".doc-no-label{font-size:3mm;color:#6b6b6b;text-align:right;margin-top:1.4mm}" +
    ".doc-no{font-size:2.6mm;font-weight:500;font-family:Prompt,sans-serif;white-space:nowrap}" +
    ".customer-box{background:#f0f4ff;border-radius:1.4mm;padding:1.8mm 2.2mm;margin-bottom:2.2mm;display:grid;grid-template-columns:3fr 2fr;gap:2.2mm}" +
    ".field-label{font-size:2.7mm;color:#6b6b6b;margin-bottom:0.5mm}" +
    ".field-value{font-size:3mm;font-weight:500;color:#181818}" +
    ".field-sub{font-size:3mm;font-weight:500;color:#181818;margin-top:0.5mm}" +
    ".items-table{width:100%;border-collapse:collapse;margin-bottom:2.2mm;table-layout:fixed}" +
    ".items-table thead tr{background:#032d60}" +
    ".items-table th{padding:1.2mm 1.4mm;font-size:2.5mm;font-weight:500;color:white;text-align:left;border-right:0.1mm solid rgba(255,255,255,0.25)}" +
    ".items-table th:last-child{border-right:none}" +
    ".items-table td{padding:1mm 1.4mm;font-size:2.5mm;border-bottom:0.2mm solid #e0e0e0;color:#181818;vertical-align:middle;border-right:0.1mm solid #e0e0e0}" +
    ".items-table td:last-child{border-right:none}" +
    ".footer{display:flex;align-items:flex-end;gap:2.7mm;margin-top:auto;width:100%}" +
    ".footer-left{flex:1;min-width:0}" +
    ".baht-text-label{font-size:2.7mm;color:#6b6b6b;margin-bottom:0.7mm}" +
    ".baht-text{font-size:3.5mm;padding:2.2mm 2.9mm;background:#f0f4ff;border-radius:0.9mm;border:none;display:flex;align-items:center}" +
    ".sig-row{display:flex;gap:5.4mm;align-items:flex-end;margin-top:2mm;margin-bottom:0}" +
    ".note{font-size:2.4mm;color:#888;margin-top:0.7mm;text-align:center}" +
    ".summary{flex-shrink:0}" +
    ".summary-table{border-collapse:collapse;table-layout:auto}" +
    ".summary-table td{padding:1mm 0;font-size:2.8mm;vertical-align:middle;color:#181818;white-space:nowrap}" +
    ".summary-table td.num{text-align:right;padding-left:4mm;font-family:Prompt,sans-serif}" +
    ".summary-table tr.total td{border-top:0.4mm solid #032d60;border-bottom:none;font-size:3.7mm;font-weight:500;padding-top:1.5mm}" +
    ".muted{color:#6b6b6b}.accent{color:#0176d3}.mono{font-family:Prompt,sans-serif}" +
    "</style>";

  var html = "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\">" +
    "<meta name=\"color-scheme\" content=\"light\"><style>:root{color-scheme:light;}</style>" +
    css + "</head><body style=\"background:white;color:#181818;\">" +
    "<div class=\"page page-break\">" + half("tax", true) + "<div class=\"divider\"></div>" + half("tax", false) + "</div>" +
    "<div class=\"page\">" + half("receipt", true) + "<div class=\"divider\"></div>" + half("receipt", false) + "</div>" +
    "</body></html>";

  var blob    = Utilities.newBlob(html, "text/html; charset=utf-8", invoiceNo + ".html");
  var pdfBlob = blob.getAs("application/pdf");
  pdfBlob.setName("KC_TaxInvoice_L_" + invoiceNo + "_" + name + ".pdf");
  var file = folder.createFile(pdfBlob);
  return "https://drive.google.com/file/d/" + file.getId() + "/view";
}
function updateTaxInvoiceFromWeb(invoiceId, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.tiSheet);
  if (!sheet) throw new Error("ไม่พบ sheet '" + CONFIG.tiSheet + "'");
  var rows = sheet.getRange(1, 1, sheet.getLastRow(), 16).getValues();
  var name = data.name || "", address = data.address || "", phone = data.phone || "";
  var taxId = data.taxId || "", invRef = data.invoiceRef || "";
  var items = data.items || [];

  // Collect row indices that belong to this invoiceId
  var matchRows = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === invoiceId) matchRows.push(i + 1);
  }
  if (matchRows.length === 0) return { success: false, error: "ไม่พบ invoiceId" };

  var filledItems = items.filter(function(it) { return it.desc || it.qty || it.amount; });

  // Capture removed rows + batch delete
  var removedNotes = [];
  var deleteCount = matchRows.length - filledItems.length;
  if (deleteCount > 0) {
    for (var d = matchRows.length - 1; d >= filledItems.length; d--) {
      var r = rows[matchRows[d] - 1];
      var note = [r[7], r[8], r[10]].filter(Boolean).join(" ");
      if (note) removedNotes.push(note);
    }
    sheet.deleteRows(matchRows[filledItems.length], deleteCount);
  }

  // Batch update existing rows — one setValues call; leave N (pdfUrl) and O (formula) untouched
  var updateCount = Math.min(filledItems.length, matchRows.length);
  if (updateCount > 0) {
    var updateData = [];
    for (var j = 0; j < updateCount; j++) {
      var it = filledItems[j];
      updateData.push([invoiceId, rows[matchRows[j]-1][1], name, address, phone, taxId, invRef,
        it.desc || "", it.desc2 || "", it.detail || "", it.qty || "", it.unitPrice || "", it.amount || ""]);
    }
    sheet.getRange(matchRows[0], 1, updateCount, 13).setValues(updateData);
  }

  // Batch insert new rows — one insertRowsAfter + one setValues
  var addedCount = Math.max(0, filledItems.length - matchRows.length);
  if (addedCount > 0) {
    var lastExisting = matchRows[matchRows.length - 1];
    sheet.insertRowsAfter(lastExisting, addedCount);
    var insertData = [];
    for (var k = matchRows.length; k < filledItems.length; k++) {
      var it = filledItems[k];
      insertData.push([invoiceId, rows[matchRows[0]-1][1], name, address, phone, taxId, invRef,
        it.desc || "", it.desc2 || "", it.detail || "", it.qty || "", it.unitPrice || "", it.amount || ""]);
    }
    sheet.getRange(lastExisting + 1, 1, addedCount, 13).setValues(insertData);
  }

  // Edit log — use matchRows[0] + existing rows data, no re-read; col P (16)
  var firstOld = rows[matchRows[0] - 1];
  var headerChanged = (String(firstOld[2]).trim() !== name || String(firstOld[3]).trim() !== address ||
    String(firstOld[4]).trim() !== phone || String(firstOld[5]).trim() !== taxId || String(firstOld[6]).trim() !== invRef);
  var rowValChanged = false;
  for (var rc = 0; rc < Math.min(filledItems.length, matchRows.length); rc++) {
    var oldR = rows[matchRows[rc] - 1], newIt = filledItems[rc];
    if (String(oldR[7]).trim() !== String(newIt.desc || "").trim() ||
        String(oldR[10]).trim() !== String(newIt.qty || "").trim() ||
        String(oldR[11]).trim() !== String(newIt.unitPrice || "").trim()) { rowValChanged = true; break; }
  }
  // Use frontend-tracked add/delete counts when available (accurate), else fall back to net
  var logAddedCount  = (data._logAdded   != null) ? data._logAdded   : addedCount;
  var logDeletedList = (data._logDeleted != null) ? data._logDeleted : removedNotes;
  var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  var changes = [];
  if (logAddedCount > 0) changes.push("เพิ่ม " + logAddedCount + " แถว");
  if (logDeletedList.length > 0) changes.push("ลบ: " + logDeletedList.join(", "));
  if (rowValChanged) changes.push("แก้ไขรายการ");
  if (headerChanged) changes.push("แก้ไขข้อมูล");
  var logEntry = dateStr + ": " + (changes.length > 0 ? changes.join("; ") : "แก้ไข");
  var prevLog = firstOld[15] ? String(firstOld[15]) + " | " : "";
  sheet.getRange(matchRows[0], 16).setValue(prevLog + logEntry);
  // Clear both cached PDF URLs so next Print/PDF click regenerates fresh after edit
  sheet.getRange(matchRows[0], 14).setValue("");
  sheet.getRange(matchRows[0], 17).setValue("");

  autoLogCustomer_(name, address, phone, taxId);
  return { success: true, invoiceNo: invoiceId };
}


// ============================================================
// LANDSCAPE PDF FROM WEB — re-generate tax invoice landscape
// ============================================================

function generateTaxInvoiceLandscapePDFFromWeb(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.tiSheet);
  if (!sheet) throw new Error("ไม่พบ sheet '" + CONFIG.tiSheet + "'");

  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  var rows = sheet.getRange(1, 1, Math.max(lastDataRow, 1), 16).getValues();
  var invoiceNo = "", name = "", address = "", phone = "", taxId = "", invRef = "", date = "", items = [];
  var firstRowIdx = -1;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== invoiceId) continue;
    if (!invoiceNo) {
      invoiceNo = String(rows[i][0]).trim();
      date      = rows[i][1];
      name      = String(rows[i][2]).trim();
      address   = String(rows[i][3]).trim();
      phone     = String(rows[i][4]).trim();
      taxId     = String(rows[i][5]).trim();
      invRef    = String(rows[i][6]).trim();
      firstRowIdx = i + 1;
    }
    if (rows[i][7]) items.push({ desc: String(rows[i][7]).trim(), desc2: String(rows[i][8]).trim(), detail: String(rows[i][9]).trim(), qty: rows[i][10], unitPrice: rows[i][11], amount: rows[i][12] });
  }
  if (!invoiceNo) throw new Error("ไม่พบใบกำกับภาษีเลขที่ " + invoiceId);

  var dateStr = date instanceof Date ? Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(date);
  var data = { name: name, address: address, phone: phone, taxId: taxId, invoiceRef: invRef, date: dateStr, items: items };
  var pdfUrl = buildTaxInvoiceLandscapePDF(invoiceNo, name, data);
  // Save landscape URL back to col 14 (N) so reload always gets the latest
  if (firstRowIdx > 0) sheet.getRange(firstRowIdx, 14).setValue(pdfUrl);
  return { pdfUrl: pdfUrl };
}

// ============================================================
// PORTRAIT PDF — 2 pages (ต้นฉบับ + สำเนา)
// ============================================================

function generateTaxInvoicePortraitPDFFromWeb(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.tiSheet);
  if (!sheet) throw new Error("ไม่พบ sheet '" + CONFIG.tiSheet + "'");

  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  var rows = sheet.getRange(1, 1, Math.max(lastDataRow, 1), 16).getValues();
  var invoiceNo = "", name = "", address = "", phone = "", taxId = "", invRef = "", date = "", items = [];
  var firstRowIdx = -1;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== invoiceId) continue;
    if (!invoiceNo) {
      invoiceNo = String(rows[i][0]).trim();
      date      = rows[i][1];
      name      = String(rows[i][2]).trim();
      address   = String(rows[i][3]).trim();
      phone     = String(rows[i][4]).trim();
      taxId     = String(rows[i][5]).trim();
      invRef    = String(rows[i][6]).trim();
      firstRowIdx = i + 1;
    }
    if (rows[i][7]) items.push({ desc: String(rows[i][7]).trim(), desc2: String(rows[i][8]).trim(), detail: String(rows[i][9]).trim(), qty: rows[i][10], unitPrice: rows[i][11], amount: rows[i][12] });
  }
  if (!invoiceNo) throw new Error("ไม่พบใบกำกับภาษีเลขที่ " + invoiceId);

  var dateStr = date instanceof Date ? Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(date);
  var data = { name: name, address: address, phone: phone, taxId: taxId, invoiceRef: invRef, date: dateStr, items: items };
  var pdfUrl = buildTaxInvoicePortraitPDF(invoiceNo, name, data);
  // Save portrait URL to col 17 (Q) of first row — persists across sessions/devices
  if (firstRowIdx > 0) sheet.getRange(firstRowIdx, 17).setValue(pdfUrl);
  return { pdfUrl: pdfUrl };
}

function buildTaxInvoicePortraitPDF(invoiceNo, name, data, opts) {
  opts = opts || {};
  var showDesc2Parens = opts.showDesc2Parens === true;
  var altHeaders      = opts.altHeaders !== false;
  var hdrUnitPrice    = altHeaders ? "หน่วยละ" : "ราคาหน่วยละ";
  var thNoWrap        = altHeaders ? "white-space:nowrap;overflow:hidden;" : "";
  var colW3           = altHeaders ? "16mm" : "20mm";
  var colW4           = altHeaders ? "20mm" : "18mm";
  var colW5           = altHeaders ? "11mm" : "7mm";
  var cfg    = getConfig();
  var folder = DriveApp.getFolderById(cfg.folders.ti);
  var co     = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var coNameEN = co.nameEN || "";
  var coAddr   = co.address || "";
  var coTel    = co.tel     || "";
  var coTaxId  = co.taxId   || "";
  var am = coAddr.match(/^(.*?)\s*(จังหวัด.*)/);
  var addrLine1 = am ? am[1].trim() : coAddr.trim();
  var addrLine2 = am ? am[2].trim() : '';
  var items  = data.items || [];
  var sub    = 0;
  for (var i = 0; i < items.length; i++) sub += parseFloat(items[i].amount) || 0;
  var vat   = parseFloat((sub * (cfg.vatRate || VAT_RATE)).toFixed(2));
  var total = parseFloat((sub + vat).toFixed(2));

  function fmt(n) { return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  var filledItems = items.filter(function(it) { return it.desc || it.desc2 || it.detail || it.qty || it.amount; });
  var itemRows = "";
  var rowCount = 0;
  for (var i = 0; i < filledItems.length; i++) {
    var it = filledItems[i];
    var parts = (it.detail || "").split(" | ");
    var b = Math.floor(Number(it.amount) || 0);
    var s = Math.round((Number(it.amount || 0) - b) * 100);
    var even = i % 2 === 0;
    var descLeft = (it.desc || "") + (it.desc2 ? (showDesc2Parens ? " (" + it.desc2 + ")" : " " + it.desc2) : "");
    var descRight = parts[0] || "";
    var lastContIdx = -1;
    for (var k = 1; k < parts.length; k++) { if (parts[k]) lastContIdx = k; }
    var bdr = lastContIdx >= 0 ? "border-bottom:none;" : "";
    itemRows += "<tr style=\"background:" + (even ? "white" : "#fafbff") + "\">" +
      "<td style=\"" + bdr + "color:#181818;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:49mm;flex-shrink:0;white-space:nowrap;overflow:hidden\">" + descLeft + "</div><div style=\"flex:1;min-width:0;white-space:nowrap;overflow:hidden\">" + descRight + "</div></div></td>" +
      "<td style=\"" + bdr + "text-align:center;color:#181818\">" + (it.qty || "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;color:#181818\">" + (it.unitPrice ? parseFloat(it.unitPrice).toLocaleString("th-TH") : "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;font-weight:500;color:#181818\">" + (b > 0 ? b.toLocaleString("th-TH") : "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;color:#181818\">" + (b > 0 ? (s > 0 ? String(s).padStart(2, "0") : "00") : "") + "</td></tr>";
    rowCount++;
    for (var j = 1; j < parts.length; j++) {
      if (parts[j]) {
        var contBdr = j === lastContIdx ? "" : "border-bottom:none;";
        itemRows += "<tr style=\"background:" + (even ? "white" : "#fafbff") + "\">" +
          "<td style=\"" + contBdr + "color:#181818;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:49mm;flex-shrink:0\"></div><div style=\"flex:1;min-width:0;white-space:nowrap;overflow:hidden\">" + parts[j] + "</div></div></td>" +
          "<td style=\"" + contBdr + "\"></td>" +
          "<td style=\"" + contBdr + "\"></td>" +
          "<td style=\"" + contBdr + "\"></td>" +
          "<td style=\"" + contBdr + "\"></td></tr>";
        rowCount++;
      }
    }
  }
  for (var i = rowCount; i < 10; i++) {
    itemRows += "<tr style=\"background:" + (i % 2 === 0 ? "white" : "#fafbff") + "\"><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>";
  }

  // type = "tax" | "receipt"
  function page(type, isOriginal) {
    // Titles, notes, and sig labels based on original paper invoice set:
    // Green  = tax original  : ต้นฉบับใบกำกับภาษี/ใบส่งสินค้า, no note, ผู้ส่งของ
    // Yellow = tax copy      : สำเนาใบกำกับภาษี/สำเนาใบส่งสินค้า, (ไม่ใช่ฯ), ผู้ส่งของ
    // White  = receipt orig  : ใบเสร็จรับเงิน, (ไม่ใช่ฯ), ผู้รับเงิน
    // Blue   = receipt copy  : สำเนาใบกำกับภาษี/สำเนาใบส่งสินค้า / สำเนาใบเสร็จรับเงิน (2 lines), (ไม่ใช่ฯ), ผู้ส่งของ
    var docTitle, docNote, sigLabel;
    if (type === "tax" && isOriginal) {
      docTitle  = "ต้นฉบับใบกำกับภาษี/ใบส่งสินค้า";
      docNote   = "";
      sigLabel  = "ผู้ส่งของ";
    } else if (type === "tax" && !isOriginal) {
      docTitle  = "สำเนาใบกำกับภาษี/สำเนาใบส่งสินค้า";
      docNote   = "<div style=\"font-size:4mm;color:#c23934;text-align:right;margin-top:0.8mm\">(ไม่ใช่ใบกำกับภาษี)</div>";
      sigLabel  = "ผู้ส่งของ";
    } else if (type === "receipt" && isOriginal) {
      docTitle  = "ใบเสร็จรับเงิน";
      docNote   = "<div style=\"font-size:4mm;color:#c23934;text-align:right;margin-top:0.8mm\">(ไม่ใช่ใบกำกับภาษี)</div>";
      sigLabel  = "ผู้รับเงิน";
    } else {
      docTitle  = "สำเนาใบกำกับภาษี/สำเนาใบส่งสินค้า<br>/สำเนาใบเสร็จรับเงิน";
      docNote   = "<div style=\"font-size:4mm;color:#c23934;text-align:right;margin-top:0.8mm\">(ไม่ใช่ใบกำกับภาษี)</div>";
      sigLabel  = "ผู้ส่งของ";
    }
    return "<div class=\"page\">" +
      "<div class=\"header\">" +
        "<div>" +
          "<div style=\"display:flex;align-items:flex-start;gap:2.5mm\">" +
            "<div class=\"kc-logo\">KC</div>" +
            "<div>" +
              "<div class=\"company-name\">" + coName + "</div>" +
              "<div class=\"company-name-en\">" + coNameEN + "</div>" +
            "</div>" +
          "</div>" +
          "<div class=\"company-sub\" style=\"margin-top:0.7mm\">" + addrLine1 + "</div>" +
          "<div class=\"company-sub\">" + (addrLine2 ? addrLine2 + " &nbsp; " : "") + "Tel/Fax : " + coTel + "</div>" +
          "<div class=\"company-sub\" style=\"margin-top:0.3mm\">" + (coTaxId ? "เลขประจำตัวผู้เสียภาษีอากร " + coTaxId : "") + "</div>" +
        "</div>" +
        "<div style=\"text-align:right;display:flex;flex-direction:column;align-self:stretch\">" +
          "<div>" +
            "<div class=\"doc-title\">" + docTitle + "</div>" +
            docNote +
          "</div>" +
          "<div class=\"doc-no\" style=\"margin-top:auto\">เลขที่ " + invoiceNo + "</div>" +
        "</div>" +
      "</div>" +
      "<div class=\"customer-box\">" +
        "<div><div class=\"field-label\">ชื่อลูกค้า / บริษัท</div>" +
        "<div class=\"field-value\">" + (data.name || "") + "</div>" +
        "<div class=\"field-label\" style=\"margin-top:1.5mm\">ที่อยู่</div>" +
        "<div class=\"field-sub\">" + (data.address || "") + "</div></div>" +
        "<div style=\"text-align:right\">" +
          "<div style=\"margin-bottom:2mm\"><div class=\"field-label\">วันที่</div><div class=\"field-value\">" + thaiMonth(data.date) + "</div></div>" +
          "<div style=\"margin-bottom:2mm\"><div class=\"field-label\">เลขประจำตัวผู้เสียภาษีอากร</div><div class=\"field-value\">" + (data.taxId || "—") + "</div></div>" +
          "<div><div class=\"field-label\">อ้างอิงใบส่งของเลขที่</div><div class=\"field-value accent\">" + (data.invoiceRef || "—") + "</div></div>" +
        "</div>" +
      "</div>" +
      "<table class=\"items-table\">" +
        "<colgroup><col><col style=\"width:16mm\"><col style=\"width:" + colW3 + "\"><col style=\"width:" + colW4 + "\"><col style=\"width:" + colW5 + "\"></colgroup>" +
        "<thead><tr><th style=\"" + thNoWrap + "\">รายการ / Description</th><th style=\"text-align:center;" + thNoWrap + "\">จำนวน</th><th style=\"text-align:right;" + thNoWrap + "\">" + hdrUnitPrice + "</th><th style=\"text-align:right;" + thNoWrap + "\">จำนวนเงิน</th><th style=\"text-align:right;" + thNoWrap + "\">สต.</th></tr></thead>" +
        "<tbody>" + itemRows + "</tbody>" +
      "</table>" +
      "<div style=\"margin-top:auto\">" +
        "<div style=\"display:flex;justify-content:flex-end;margin-bottom:2mm\">" +
          "<div style=\"flex-shrink:0;white-space:nowrap;min-width:65mm\">" +
            "<div style=\"display:flex;justify-content:space-between;gap:8mm;font-size:3.9mm;padding:0.5mm 0\"><span style=\"color:#6b6b6b\">รวมมูลค่าสินค้า</span><span style=\"font-family:Prompt,sans-serif\">" + fmt(sub) + "</span></div>" +
            "<div style=\"display:flex;justify-content:space-between;gap:8mm;font-size:3.9mm;padding:0.5mm 0\"><span style=\"color:#6b6b6b\">จำนวนภาษีมูลค่าเพิ่ม 7%</span><span style=\"font-family:Prompt,sans-serif\">" + fmt(vat) + "</span></div>" +
            "<div style=\"display:flex;justify-content:space-between;gap:8mm;border-top:0.4mm solid #032d60;padding-top:1.2mm;margin-top:0.5mm\"><span style=\"font-size:4.5mm;font-weight:500\">รวมทั้งสิ้น</span><span style=\"font-size:4.5mm;font-weight:500;color:#0176d3;font-family:Prompt,sans-serif\">฿" + fmt(total) + "</span></div>" +
          "</div>" +
        "</div>" +
        "<div style=\"margin-bottom:4mm\">" +
          "<div class=\"baht-text-label\">จำนวนเงิน (ตัวอักษร)</div>" +
          "<div class=\"baht-text\">(" + bahtTextGS(total) + ")</div>" +
        "</div>" +
        "<div class=\"sig-row\">" +
          "<span style=\"font-size:3mm;color:#6b6b6b;display:flex;align-items:flex-end;flex:1;min-width:0\">ลงชื่อ&nbsp;<span style=\"flex:1;border-bottom:0.3mm solid #eee;height:3mm;display:inline-block\"></span>&nbsp;" + sigLabel + "</span>" +
          "<span style=\"font-size:3mm;color:#6b6b6b;display:flex;align-items:flex-end;flex:1;min-width:0\">ลงชื่อ&nbsp;<span style=\"flex:1;border-bottom:0.3mm solid #eee;height:3mm;display:inline-block\"></span>&nbsp;ผู้รับของ</span>" +
        "</div>" +
        "<div class=\"note\">ได้รับสินค้าตามรายการข้างบนนี้ไว้ถูกต้องแล้ว</div>" +
      "</div>" +
      "</div>" +
    "</div>";
  }

  var fontCss = PROMPT_FONT_CSS;
  var css = "<style>" + fontCss +
    "html,body{background:white!important;color:#181818!important;font-family:Prompt,sans-serif;}" +
    "*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}" +
    "@page{size:A4 portrait;margin:10mm 12mm}" +
    ".page{background:white;width:186mm;display:flex;flex-direction:column;padding:3mm 0}" +
    ".page-break{page-break-after:always}" +
    ".header{display:flex;justify-content:space-between;align-items:stretch;min-height:26mm;margin-bottom:3.6mm;padding-bottom:2.7mm;border-bottom:0.3mm solid #ddd}" +
    ".kc-logo{width:10mm;height:10mm;background:#032d60;border-radius:1.5mm;text-align:center;line-height:10mm;font-weight:700;font-size:5.5mm;color:white;display:inline-block;vertical-align:middle;flex-shrink:0}" +
    ".company-name{font-size:4mm;font-weight:600;color:#181818}" +
    ".company-name-en{font-size:3mm;font-weight:500;color:#181818;margin-top:0.3mm}" +
    ".company-sub{font-size:2.8mm;color:#6b6b6b;margin-top:0.5mm}" +
    ".doc-title{font-size:5.5mm;font-weight:500;color:#032d60;text-align:right;line-height:1.2}" +
    ".doc-sub{font-size:3mm;color:#6b6b6b;text-align:right}" +
    ".doc-no-label{font-size:3mm;color:#6b6b6b;text-align:right;margin-top:1.4mm}" +
    ".doc-no{font-size:3mm;font-weight:500;font-family:Prompt,sans-serif;white-space:nowrap}" +
    ".customer-box{background:#f0f4ff;border-radius:1.4mm;padding:2mm 2.5mm;margin-bottom:3mm;display:grid;grid-template-columns:1fr 1fr;gap:2.5mm}" +
    ".field-label{font-size:2.7mm;color:#6b6b6b;margin-bottom:0.5mm}" +
    ".field-value{font-size:3.5mm;font-weight:500;color:#181818}" +
    ".field-sub{font-size:3.5mm;font-weight:500;color:#181818;margin-top:0.5mm}" +
    ".items-table{width:100%;border-collapse:collapse;margin-bottom:3mm;table-layout:fixed}" +
    ".items-table thead tr{background:#032d60}" +
    ".items-table th{padding:1.5mm 2mm;font-size:3.4mm;font-weight:500;color:white;text-align:left;border-right:0.1mm solid rgba(255,255,255,0.25)}" +
    ".items-table th:last-child{border-right:none}" +
    ".items-table td{padding:1.2mm 2mm;font-size:3.9mm;border-bottom:0.2mm solid #e0e0e0;color:#181818;vertical-align:middle;border-right:0.1mm solid #e0e0e0}" +
    ".items-table td:last-child{border-right:none}" +
    ".footer{display:flex;align-items:flex-end;gap:3mm;margin-top:4mm;width:100%}" +
    ".footer-left{flex:1;min-width:0;display:flex;flex-direction:column}" +
    ".baht-text-label{font-size:3mm;color:#6b6b6b;margin-bottom:0.9mm}" +
    ".baht-text{font-size:3.7mm;padding:2.5mm 3mm;background:#f0f4ff;border-radius:1mm;border:none}" +
    ".sig-row{display:flex;gap:5mm;align-items:flex-end;margin-top:15mm;margin-bottom:0}" +
    ".note{font-size:2.8mm;color:#888;margin-top:1.5mm;text-align:center}" +
    ".summary{width:60mm;flex-shrink:0}" +
    ".summary-table{width:60mm;border-collapse:collapse;table-layout:fixed}" +
    ".summary-table td{padding:2mm 0;border-bottom:0.2mm solid #eee;font-size:3mm;vertical-align:middle;color:#181818}" +
    ".summary-table td.num{text-align:right;width:30mm;font-family:Prompt,sans-serif;white-space:nowrap}" +
    ".summary-table tr.total td{border-bottom:none;font-size:3.7mm;font-weight:500;padding-top:2mm}" +
    ".muted{color:#6b6b6b}.accent{color:#0176d3}" +
    "</style>";

  var html = "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\">" +
    "<meta name=\"color-scheme\" content=\"light\">" + css +
    "</head><body style=\"background:white;color:#181818;\">" +
    "<div class=\"page-break\">" + page("tax", true)  + "</div>" +
    "<div class=\"page-break\">" + page("tax", false) + "</div>" +
    "<div class=\"page-break\">" + page("receipt", true)  + "</div>" +
    page("receipt", false) +
    "</body></html>";

  var blob    = Utilities.newBlob(html, "text/html; charset=utf-8", invoiceNo + "_4page.html");
  var pdfBlob = blob.getAs("application/pdf");
  pdfBlob.setName("KC_TaxInvoice_P_" + invoiceNo + "_" + name + ".pdf");
  var file = folder.createFile(pdfBlob);
  return "https://drive.google.com/file/d/" + file.getId() + "/view";
}
// ============================================================
// INVOICE HTML PDF (ใบส่งของชั่วคราว)
// ============================================================

function generateDeliveryNoteLandscapePDFFromWeb(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!dataSheet) throw new Error("ไม่พบ Invoice History");
  var lastDataRow = getLastNonEmptyRow(dataSheet, "A");
  var rows = dataSheet.getRange(1, 1, Math.max(lastDataRow, 1), 14).getValues();
  var invoiceNo, date, name, address, phone, items = [], total = 0, firstRowIdx = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === invoiceId) {
      if (!invoiceNo) {
        invoiceNo = String(rows[i][0]).trim();
        date      = rows[i][1];
        name      = String(rows[i][2]).trim();
        address   = String(rows[i][3]).trim();
        phone     = String(rows[i][4]).trim();
        total     = rows[i][11];
        firstRowIdx = i + 1;
      }
      items.push({ desc: String(rows[i][5]).trim(), desc2: String(rows[i][6]).trim(), detail: String(rows[i][7]).trim(), qty: rows[i][8], unitPrice: rows[i][9], amount: rows[i][10] });
    }
  }
  if (!invoiceNo) throw new Error("ไม่พบใบส่งของเลขที่ " + invoiceId);
  var dateStr = date instanceof Date ? Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(date);
  var data = { name: name, address: address, phone: phone, date: dateStr, items: items };
  var pdfUrl = buildDeliveryNoteLandscapePDF(invoiceNo, name, data);
  // Save landscape URL back to col 13 (M) so reload always gets the latest
  if (firstRowIdx > 0) dataSheet.getRange(firstRowIdx, 13).setValue(pdfUrl);
  return { pdfUrl: pdfUrl };
}

function generateDeliveryNotePortraitPDFFromWeb(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheetByName(CONFIG.invoiceHistory);
  if (!dataSheet) throw new Error("ไม่พบ Invoice History");
  var lastDataRow = getLastNonEmptyRow(dataSheet, "A");
  var rows = dataSheet.getRange(1, 1, Math.max(lastDataRow, 1), 14).getValues();
  var invoiceNo, date, name, address, phone, items = [], total = 0, firstRowIdx = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === invoiceId) {
      if (!invoiceNo) {
        invoiceNo = String(rows[i][0]).trim();
        date      = rows[i][1];
        name      = String(rows[i][2]).trim();
        address   = String(rows[i][3]).trim();
        phone     = String(rows[i][4]).trim();
        total     = rows[i][11];
        firstRowIdx = i + 1;
      }
      items.push({ desc: String(rows[i][5]).trim(), desc2: String(rows[i][6]).trim(), detail: String(rows[i][7]).trim(), qty: rows[i][8], unitPrice: rows[i][9], amount: rows[i][10] });
    }
  }
  if (!invoiceNo) throw new Error("ไม่พบใบส่งของเลขที่ " + invoiceId);
  var dateStr = date instanceof Date ? Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(date);
  var data = { name: name, address: address, phone: phone, date: dateStr, items: items };
  var pdfUrl = buildDeliveryNotePortraitPDF(invoiceNo, name, data);
  // Save portrait URL to col 15 (O) of first row — persists across sessions/devices
  if (firstRowIdx > 0) dataSheet.getRange(firstRowIdx, 15).setValue(pdfUrl);
  return { pdfUrl: pdfUrl };
}

function buildDeliveryNoteLandscapePDF(invoiceNo, name, data, opts) {
  opts = opts || {};
  var showDesc2Parens = opts.showDesc2Parens === true;
  var centerLock     = opts.centerLock !== false; // default true — center-lock live (#46)
  var outerLeft      = opts.outerLeft      || "13mm";
  var outerRight     = opts.outerRight     || "2mm";
  var innerGap       = opts.innerGap       || "3mm";
  var innerGapL      = opts.innerGapL      || "5mm";  // promoted v1.4.155
  var innerGapR      = opts.innerGapR      || "9mm";  // promoted v1.4.155
  var pagePaddingTop = opts.pagePaddingTop || "10mm"; // promoted v1.4.155
  // CALIBRATED — divider frozen at paper center (empirical 2026-06-17, @page left:0, 1:1 flex ratio, same printer as TI)
  // Only change via staging re-calibration; do not expose as a user opt
  var leftHalfWidth  = opts.leftHalfWidth  || "151.5mm";
  var cfg    = getConfig();
  var folder = DriveApp.getFolderById(cfg.folders.dn);
  var co     = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var items  = data.items || [];
  var total  = 0;
  for (var i = 0; i < items.length; i++) total += parseFloat(items[i].amount) || 0;

  function fmt(n) { return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  var filledItems = items.filter(function(it) { return it.desc || it.desc2 || it.detail || it.qty || it.amount; });
  var itemRows = "";
  var rowCount = 0;
  for (var i = 0; i < filledItems.length; i++) {
    var it = filledItems[i];
    var parts = (it.detail || "").split(" | ");
    var even = i % 2 === 0;
    var descLeft = (it.desc || "") + (it.desc2 ? (showDesc2Parens ? " (" + it.desc2 + ")" : " " + it.desc2) : "");
    var descRight = parts[0] || "";
    var lastContIdx = -1;
    for (var k = 1; k < parts.length; k++) { if (parts[k]) lastContIdx = k; }
    var bdr = lastContIdx < 0 ? "border-bottom:0.2mm solid #e0e0e0;" : "";
    itemRows += "<tr style=\"background:" + (even ? "white" : "#f8f8f8") + "\">" +
      "<td style=\"padding:0.9mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:38mm;flex-shrink:0;white-space:nowrap;overflow:hidden\">" + descLeft + "</div><div style=\"flex:1;min-width:0;white-space:nowrap;overflow:hidden\">" + descRight + "</div></div></td>" +
      "<td style=\"padding:0.9mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;text-align:center\">" + (it.qty || "") + "</td>" +
      "<td style=\"padding:0.9mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;text-align:right\">" + (it.unitPrice ? parseFloat(it.unitPrice).toLocaleString("th-TH", {minimumFractionDigits:2}) : "") + "</td>" +
      "<td style=\"padding:0.9mm 1.5mm;" + bdr + "text-align:right;font-weight:500\">" + (it.amount ? fmt(it.amount) : "") + "</td>" +
      "</tr>";
    rowCount++;
    for (var j = 1; j < parts.length; j++) {
      if (parts[j]) {
        var contBdr = j === lastContIdx ? "border-bottom:0.2mm solid #e0e0e0;" : "";
        itemRows += "<tr style=\"background:" + (even ? "white" : "#f8f8f8") + "\">" +
          "<td style=\"padding:0.9mm 1.5mm;" + contBdr + "border-right:0.1mm solid #e0e0e0;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:38mm;flex-shrink:0\"></div><div style=\"flex:1;min-width:0;white-space:nowrap;overflow:hidden\">" + parts[j] + "</div></div></td>" +
          "<td style=\"padding:0.9mm 1.5mm;" + contBdr + "border-right:0.1mm solid #e0e0e0\"></td>" +
          "<td style=\"padding:0.9mm 1.5mm;" + contBdr + "border-right:0.1mm solid #e0e0e0\"></td>" +
          "<td style=\"padding:0.9mm 1.5mm;" + contBdr + "\"></td>" +
          "</tr>";
        rowCount++;
      }
    }
  }
  for (var i = rowCount; i < 10; i++) {
    itemRows += "<tr style=\"background:" + (i % 2 === 0 ? "white" : "#f8f8f8") + "\"><td style=\"padding:0.9mm 1.5mm;border-bottom:0.2mm solid #e0e0e0;border-right:0.1mm solid #e0e0e0\">&nbsp;</td><td style=\"border-bottom:0.2mm solid #e0e0e0;border-right:0.1mm solid #e0e0e0\"></td><td style=\"border-bottom:0.2mm solid #e0e0e0;border-right:0.1mm solid #e0e0e0\"></td><td style=\"border-bottom:0.2mm solid #e0e0e0\"></td></tr>";
  }

  function half(isOriginal) {
    var copyBadge = isOriginal ? "" : "<span style=\"font-size:3.9mm;color:#888;font-weight:400;margin-left:2mm;vertical-align:middle\">(สำเนา)</span>";
    var coNameEN = co.nameEN || "";
    return "<div class=\"half" + (centerLock ? (isOriginal ? " left-h" : " right-h") : "") + "\">" +
      "<div style=\"display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:5mm;padding-bottom:3.5mm;border-bottom:0.5mm solid #111\">" +
        "<div style=\"display:flex;align-items:center;gap:3mm\">" +
          "<div style=\"background:#111;color:white;font-size:6mm;font-weight:700;width:11mm;height:11mm;display:flex;align-items:center;justify-content:center;letter-spacing:-0.3mm;border-radius:1.2mm;flex-shrink:0\">KC</div>" +
          "<div style=\"display:flex;flex-direction:column;justify-content:center\">" +
            "<div style=\"font-size:4mm;font-weight:600;color:#111;line-height:1.3\">" + coName + "</div>" +
            "<div style=\"font-size:3mm;color:#888;font-weight:400;margin-top:0.3mm\">" + coNameEN + "</div>" +
          "</div>" +
        "</div>" +
        "<div style=\"text-align:right\">" +
          "<div style=\"font-size:2.3mm;color:#999;letter-spacing:0.3mm\">เลขที่</div>" +
          "<div style=\"font-size:2.3mm;font-weight:600;color:#111;letter-spacing:0.3mm\">" + invoiceNo + "</div>" +
        "</div>" +
      "</div>" +
      "<div style=\"font-size:5.5mm;font-weight:600;color:#111;margin-bottom:4mm\">ใบส่งของชั่วคราว" + copyBadge + "</div>" +
      "<div style=\"display:flex;gap:0;margin-bottom:4.5mm;font-size:2.9mm;background:#fafafa;border-radius:1mm;padding:2mm 2.5mm\">" +
        "<div style=\"display:grid;grid-template-columns:auto 1fr;gap:1mm 2mm;width:40%;flex-shrink:0\">" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">วันที่</span><span style=\"color:#111\">" + thaiMonth(data.date) + "</span>" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">ชื่อ</span><span style=\"color:#111\">" + (data.name || "") + "</span>" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">โทรศัพท์</span><span style=\"color:#111\">" + (data.phone || "") + "</span>" +
        "</div>" +
        "<div style=\"display:grid;grid-template-columns:auto 1fr;gap:1mm 2mm;width:60%;min-width:0;padding-left:3mm;align-content:start\">" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">ที่อยู่</span><span style=\"color:#111;word-break:break-word;line-height:1.6\">" + (data.address || "") + "</span>" +
        "</div>" +
      "</div>" +
      "<table style=\"width:100%;border-collapse:collapse;font-size:3mm;margin-bottom:4mm;table-layout:fixed\">" +
        "<thead><tr style=\"background:#111;color:white\">" +
          "<th style=\"padding:1.5mm 1.5mm;text-align:left;font-weight:500;font-size:2.8mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">รายการ / Description</th>" +
          "<th style=\"padding:1.5mm 1.5mm;text-align:center;width:12mm;font-weight:500;font-size:2.8mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">จำนวน / QTY</th>" +
          "<th style=\"padding:1.5mm 1.5mm;text-align:right;width:18mm;font-weight:500;font-size:2.8mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">หน่วยละ / Unit Price</th>" +
          "<th style=\"padding:1.5mm 1.5mm;text-align:right;width:19mm;font-weight:500;font-size:2.8mm\">จำนวนเงิน / Amount</th>" +
        "</tr></thead>" +
        "<tbody>" + itemRows + "</tbody>" +
        "<tfoot><tr>" +
          "<td colspan=\"3\" style=\"border-top:0.6mm solid #111;padding:1.5mm 1.5mm;text-align:right;font-weight:600;font-size:3mm;color:#555\">ยอดรวม</td>" +
          "<td style=\"border-top:0.6mm solid #111;padding:1.5mm 1.5mm;text-align:right;font-weight:600;font-size:3.4mm\">" + fmt(total) + "</td>" +
        "</tr></tfoot>" +
      "</table>" +
      "<div style=\"margin-top:2mm;margin-bottom:2mm;display:flex;align-items:center;gap:2mm\">" +
        "<span style=\"font-size:2.9mm;color:#999;white-space:nowrap\">จำนวนเงิน (ตัวอักษร)</span>" +
        "<span style=\"flex:1;font-size:3.2mm;padding:1mm 1.5mm;background:#f5f5f5;border-radius:0.8mm;color:#333\">(" + bahtTextGS(total) + ")</span>" +
      "</div>" +
      "<div style=\"min-height:2mm\"></div>" +
      "<div style=\"padding-top:2mm;padding-bottom:2mm\">" +
        "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:6mm\">" +
          "<div style=\"display:flex;flex-direction:column;align-items:center;gap:1mm\">" +
            "<div style=\"width:100%;border-bottom:0.3mm solid #bbb;height:6mm\"></div>" +
            "<div style=\"font-size:2.9mm;color:#999;margin-top:1mm\">ผู้รับของ</div>" +
          "</div>" +
          "<div style=\"display:flex;flex-direction:column;align-items:center;gap:1mm\">" +
            "<div style=\"width:100%;height:6mm;display:flex;align-items:center;justify-content:center;border-bottom:0.3mm solid #bbb;font-size:3mm;font-style:italic;color:#032d60;font-weight:500\">" + coName + "</div>" +
            "<div style=\"font-size:2.9mm;color:#999;margin-top:1mm\">ผู้ส่งของ</div>" +
          "</div>" +
        "</div>" +
        "<div style=\"font-size:2.8mm;color:#bbb;text-align:center;margin-top:1mm\">ได้รับสิ่งของตามรายการข้างบนนี้ไว้ถูกต้องแล้ว</div>" +
      "</div>" +
    "</div>";
  }

  var fontCss = PROMPT_FONT_CSS;
  var css = "<style>" + fontCss +
    "html,body{background:white!important;font-family:Prompt,sans-serif;color:#111}" +
    "*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}" +
    (centerLock
      ? "@page{size:A4 landscape;margin:8mm 8mm 8mm 0}" +
        ".page{width:297mm;display:flex;gap:0;padding-top:" + pagePaddingTop + ";margin-left:0}" +
        ".half{display:flex;flex-direction:column}" +
        ".half.left-h{flex-shrink:0;width:" + leftHalfWidth + ";padding-left:" + outerLeft + ";padding-right:" + innerGapL + "}" +
        ".half.right-h{flex:1;min-width:0;padding-left:" + innerGapR + ";padding-right:" + outerRight + "}" +
        ".vdivider{width:0;border-left:0.5mm dotted #ddd;flex-shrink:0}"
      : "@page{size:A4 landscape;margin:12mm 9mm 9mm 9mm}" +
        ".page{width:277mm;display:flex;gap:6mm;padding-top:6mm}" +
        ".half{flex:1;min-width:0;display:flex;flex-direction:column}" +
        ".vdivider{width:0.3mm;background:#ccc;flex-shrink:0}"
    ) +
    "</style>";

  var html = "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\">" + css +
    "</head><body style=\"background:white\">" +
    "<div class=\"page\">" + half(true) + "<div class=\"vdivider\"></div>" + half(false) + "</div>" +
    "</body></html>";

  var blob    = Utilities.newBlob(html, "text/html; charset=utf-8", invoiceNo + "_invoice_landscape.html");
  var pdfBlob = blob.getAs("application/pdf");
  pdfBlob.setName("KC_DeliveryNote_L_" + invoiceNo + "_" + name + ".pdf");
  var file = folder.createFile(pdfBlob);
  var fileId = file.getId();
  return "https://drive.google.com/file/d/" + fileId + "/view";
}
function buildDeliveryNotePortraitPDF(invoiceNo, name, data, opts) {
  opts = opts || {};
  var showDesc2Parens = opts.showDesc2Parens === true;
  var cfg    = getConfig();
  var folder = DriveApp.getFolderById(cfg.folders.dn);
  var co     = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var coNameEN = co.nameEN || "";
  var items  = data.items || [];
  var total  = 0;
  for (var i = 0; i < items.length; i++) total += parseFloat(items[i].amount) || 0;

  function fmt(n) { return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  var filledItems = items.filter(function(it) { return it.desc || it.desc2 || it.detail || it.qty || it.amount; });
  var itemRows = "";
  var rowCount = 0;
  for (var i = 0; i < filledItems.length; i++) {
    var it = filledItems[i];
    var parts = (it.detail || "").split(" | ");
    var even = i % 2 === 0;
    var descLeft = (it.desc || "") + (it.desc2 ? (showDesc2Parens ? " (" + it.desc2 + ")" : " " + it.desc2) : "");
    var descRight = parts[0] || "";
    var lastContIdx = -1;
    for (var k = 1; k < parts.length; k++) { if (parts[k]) lastContIdx = k; }
    var bdr = lastContIdx < 0 ? "border-bottom:0.2mm solid #e0e0e0;" : "";
    itemRows += "<tr style=\"background:" + (even ? "white" : "#f8f8f8") + "\">" +
      "<td style=\"padding:1.2mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:44mm;flex-shrink:0;white-space:nowrap;overflow:hidden\">" + descLeft + "</div><div style=\"flex:1;min-width:0;white-space:nowrap;overflow:hidden\">" + descRight + "</div></div></td>" +
      "<td style=\"padding:1.2mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;text-align:center\">" + (it.qty || "") + "</td>" +
      "<td style=\"padding:1.2mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;text-align:right\">" + (it.unitPrice ? parseFloat(it.unitPrice).toLocaleString("th-TH", {minimumFractionDigits:2}) : "") + "</td>" +
      "<td style=\"padding:1.2mm 1.5mm;" + bdr + "text-align:right;font-weight:500\">" + (it.amount ? fmt(it.amount) : "") + "</td>" +
      "</tr>";
    rowCount++;
    for (var j = 1; j < parts.length; j++) {
      if (parts[j]) {
        var contBdr = j === lastContIdx ? "border-bottom:0.2mm solid #e0e0e0;" : "";
        itemRows += "<tr style=\"background:" + (even ? "white" : "#f8f8f8") + "\">" +
          "<td style=\"padding:1.2mm 1.5mm;" + contBdr + "border-right:0.1mm solid #e0e0e0;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:44mm;flex-shrink:0\"></div><div style=\"flex:1;min-width:0;white-space:nowrap;overflow:hidden\">" + parts[j] + "</div></div></td>" +
          "<td style=\"padding:1.2mm 1.5mm;" + contBdr + "border-right:0.1mm solid #e0e0e0\"></td>" +
          "<td style=\"padding:1.2mm 1.5mm;" + contBdr + "border-right:0.1mm solid #e0e0e0\"></td>" +
          "<td style=\"padding:1.2mm 1.5mm;" + contBdr + "\"></td>" +
          "</tr>";
        rowCount++;
      }
    }
  }
  for (var i = rowCount; i < 15; i++) {
    itemRows += "<tr style=\"background:" + (i % 2 === 0 ? "white" : "#f8f8f8") + "\"><td style=\"padding:1.2mm 1.5mm;border-bottom:0.2mm solid #e0e0e0;border-right:0.1mm solid #e0e0e0\">&nbsp;</td><td style=\"border-bottom:0.2mm solid #e0e0e0;border-right:0.1mm solid #e0e0e0\"></td><td style=\"border-bottom:0.2mm solid #e0e0e0;border-right:0.1mm solid #e0e0e0\"></td><td style=\"border-bottom:0.2mm solid #e0e0e0\"></td></tr>";
  }

  function page(isOriginal) {
    var copyBadge = isOriginal ? "" : "<span style=\"font-size:4.2mm;color:#888;font-weight:400;margin-left:2mm;vertical-align:middle\">(สำเนา)</span>";
    return "<div style=\"width:186mm;display:flex;flex-direction:column;padding:12mm 0 9mm 0\">" +
      "<div style=\"display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:5mm;padding-bottom:3.5mm;border-bottom:0.5mm solid #111\">" +
        "<div style=\"display:flex;align-items:center;gap:3mm\">" +
          "<div style=\"background:#111;color:white;font-size:8mm;font-weight:700;width:15mm;height:15mm;display:flex;align-items:center;justify-content:center;letter-spacing:-0.3mm;border-radius:1.5mm;flex-shrink:0\">KC</div>" +
          "<div style=\"display:flex;flex-direction:column;justify-content:center\">" +
            "<div style=\"font-size:5.5mm;font-weight:600;color:#111;line-height:1.3\">" + coName + "</div>" +
            "<div style=\"font-size:4.1mm;color:#888;font-weight:400;margin-top:0.3mm\">" + coNameEN + "</div>" +
          "</div>" +
        "</div>" +
        "<div style=\"text-align:right\">" +
          "<div style=\"font-size:3mm;color:#999;letter-spacing:0.3mm\">เลขที่</div>" +
          "<div style=\"font-size:3.5mm;font-weight:600;color:#111;letter-spacing:0.3mm\">" + invoiceNo + "</div>" +
        "</div>" +
      "</div>" +
      "<div style=\"font-size:6mm;font-weight:600;color:#111;margin-bottom:4mm\">ใบส่งของชั่วคราว" + copyBadge + "</div>" +
      "<div style=\"display:flex;gap:0;margin-bottom:4.5mm;font-size:3.5mm;background:#fafafa;border-radius:1mm;padding:2mm 2.5mm\">" +
        "<div style=\"display:grid;grid-template-columns:auto 1fr;gap:1mm 2mm;width:40%;flex-shrink:0\">" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">วันที่</span><span style=\"color:#111\">" + thaiMonth(data.date) + "</span>" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">ชื่อ</span><span style=\"color:#111\">" + (data.name || "") + "</span>" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">โทรศัพท์</span><span style=\"color:#111\">" + (data.phone || "") + "</span>" +
        "</div>" +
        "<div style=\"display:grid;grid-template-columns:auto 1fr;gap:1mm 2mm;width:60%;min-width:0;padding-left:3mm;align-content:start\">" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">ที่อยู่</span><span style=\"color:#111;word-break:break-word;line-height:1.6\">" + (data.address || "") + "</span>" +
        "</div>" +
      "</div>" +
      "<table style=\"width:100%;border-collapse:collapse;font-size:3.5mm;margin-bottom:4mm;table-layout:fixed\">" +
        "<thead><tr style=\"background:#111;color:white\">" +
          "<th style=\"padding:1.5mm 1.5mm;text-align:left;font-weight:500;font-size:3.2mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">รายการ / Description</th>" +
          "<th style=\"padding:1.5mm 1.5mm;text-align:center;width:15mm;font-weight:500;font-size:3.2mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">จำนวน / QTY</th>" +
          "<th style=\"padding:1.5mm 1.5mm;text-align:right;width:28mm;font-weight:500;font-size:3.2mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">หน่วยละ / Unit Price</th>" +
          "<th style=\"padding:1.5mm 1.5mm;text-align:right;width:30mm;font-weight:500;font-size:3.2mm\">จำนวนเงิน / Amount</th>" +
        "</tr></thead>" +
        "<tbody>" + itemRows + "</tbody>" +
        "<tfoot><tr>" +
          "<td colspan=\"3\" style=\"border-top:0.6mm solid #111;padding:1.5mm 1.5mm;text-align:right;font-weight:600;font-size:3.5mm;color:#555\">ยอดรวม</td>" +
          "<td style=\"border-top:0.6mm solid #111;padding:1.5mm 1.5mm;text-align:right;font-weight:600;font-size:4mm\">" + fmt(total) + "</td>" +
        "</tr></tfoot>" +
      "</table>" +
      "<div style=\"margin-top:4mm;margin-bottom:3mm;display:flex;align-items:center;gap:2mm\">" +
        "<span style=\"font-size:3.5mm;color:#999;white-space:nowrap\">จำนวนเงิน (ตัวอักษร)</span>" +
        "<span style=\"flex:1;font-size:4mm;padding:1mm 1.5mm;background:#f5f5f5;border-radius:0.8mm;color:#333\">(" + bahtTextGS(total) + ")</span>" +
      "</div>" +
      "<div style=\"min-height:4mm\"></div>" +
      "<div style=\"padding-top:2mm;padding-bottom:2mm\">" +
        "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:6mm\">" +
          "<div style=\"display:flex;flex-direction:column;align-items:center;gap:1mm\">" +
            "<div style=\"width:100%;border-bottom:0.3mm solid #bbb;height:6mm\"></div>" +
            "<div style=\"font-size:3.5mm;color:#999;margin-top:1mm\">ผู้รับของ</div>" +
          "</div>" +
          "<div style=\"display:flex;flex-direction:column;align-items:center;gap:1mm\">" +
            "<div style=\"width:100%;height:6mm;display:flex;align-items:center;justify-content:center;border-bottom:0.3mm solid #bbb;font-size:4mm;font-style:italic;color:#032d60;font-weight:500\">" + coName + "</div>" +
            "<div style=\"font-size:3.5mm;color:#999;margin-top:1mm\">ผู้ส่งของ</div>" +
          "</div>" +
        "</div>" +
        "<div style=\"font-size:3.5mm;color:#bbb;text-align:center;margin-top:1mm\">ได้รับสิ่งของตามรายการข้างบนนี้ไว้ถูกต้องแล้ว</div>" +
      "</div>" +
    "</div>";
  }

  var fontCss = PROMPT_FONT_CSS;
  var css = "<style>" + fontCss +
    "html,body{background:white!important;font-family:Prompt,sans-serif;color:#111}" +
    "*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}" +
    "@page{size:A4 portrait;margin:0}" +
    ".page-break{page-break-after:always}" +
    "</style>";

  var html = "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\">" + css +
    "</head><body style=\"background:white;padding:0 12mm\">" +
    "<div class=\"page-break\">" + page(true)  + "</div>" +
    page(false) +
    "</body></html>";

  var blob    = Utilities.newBlob(html, "text/html; charset=utf-8", invoiceNo + "_invoice_portrait.html");
  var pdfBlob = blob.getAs("application/pdf");
  pdfBlob.setName("KC_DeliveryNote_P_" + invoiceNo + "_" + name + ".pdf");
  var file = folder.createFile(pdfBlob);
  return "https://drive.google.com/file/d/" + file.getId() + "/view";
}

// ============================================================
// BILLING NOTE HTML PDF (ใบวางบิล) — Portrait
// ============================================================

function buildBillingNotePortraitPDF(invoiceNo, name, data) {
  var cfg    = getConfig();
  var folder = DriveApp.getFolderById(cfg.folders.bn);
  var page   = bnPortraitPageHTML(invoiceNo, name, data, cfg);
  var html = "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\">" + bnPortraitCSS() +
    "</head><body style=\"background:white;padding:0 12mm\">" + page + "</body></html>";
  var blob    = Utilities.newBlob(html, "text/html; charset=utf-8", invoiceNo + "_billing_portrait.html");
  var pdfBlob = blob.getAs("application/pdf");
  pdfBlob.setName("KC_BillingNote_P_" + invoiceNo + "_" + name + ".pdf");
  var file = folder.createFile(pdfBlob);
  return "https://drive.google.com/file/d/" + file.getId() + "/view";
}

// #107 — page-only HTML (no wrapper/save) so combined print can concatenate multiple BNs
function bnPortraitPageHTML(invoiceNo, name, data, cfg) {
  var co       = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var coNameEN = co.nameEN || "";
  var coAddr   = co.address || "";
  var coTel    = co.tel     || "";
  var am = coAddr.match(/^(.*?)\s*(จังหวัด.*)/);
  var addrLine1 = am ? am[1].trim() : coAddr.trim();
  var addrLine2 = am ? am[2].trim() : "";

  var invoices = data.invoices || [];
  var total    = parseFloat(data.total) || 0;

  function fmt(n) { return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // Handle dd/MM/yyyy or yyyy-MM-dd → short Thai: "23 เม.ย. 68"
  function thaiShort(d) {
    if (!d) return "";
    var months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
    var dd, mm, yyyy;
    if (String(d).indexOf("/") >= 0) {
      var p = String(d).split("/"); dd = parseInt(p[0]); mm = parseInt(p[1]); yyyy = parseInt(p[2]);
    } else if (String(d).indexOf("-") >= 0) {
      var p = String(d).split("-"); yyyy = parseInt(p[0]); mm = parseInt(p[1]); dd = parseInt(p[2]);
    } else { return String(d); }
    return dd + " " + months[mm - 1] + " " + String(yyyy + 543).slice(2);
  }

  // 10 fixed rows
  var itemRows = "";
  for (var i = 0; i < 10; i++) {
    var inv  = invoices[i] || null;
    var even = i % 2 === 0;
    var bg   = even ? "white" : "#f8f8f8";
    var bdr  = "border-bottom:0.2mm solid #e0e0e0;";
    var bdrR = "border-right:0.1mm solid #e0e0e0;";
    if (inv) {
      var dnDate = inv.dnDate || inv.date || "";
      var amt    = parseFloat(inv.amount || inv.total) || 0;
      var b = Math.floor(amt);
      var s = Math.round((amt - b) * 100);
      itemRows +=
        "<tr style=\"background:" + bg + ";height:7mm\">" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "text-align:center\">" + (i + 1) + "</td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "font-weight:500\">" + (inv.dnNo || inv.no || "") + "</td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "text-align:center\">" + thaiShort(dnDate) + "</td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "text-align:right;font-weight:500\">" + (b > 0 ? b.toLocaleString("th-TH") : "") + "</td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + "text-align:center\">" + (b > 0 ? String(s).padStart(2,"0") : "") + "</td>" +
        "</tr>";
    } else {
      itemRows +=
        "<tr style=\"background:" + bg + ";height:7mm\">" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1.2mm 1.5mm;" + bdr + "\"></td>" +
        "</tr>";
    }
  }

  var page =
    "<div style=\"width:186mm;display:flex;flex-direction:column;padding:12mm 0 9mm 0\">" +
    // ── Header ──────────────────────────────────────────────
    "<div style=\"display:flex;justify-content:space-between;align-items:flex-start;min-height:22mm;margin-bottom:3.6mm;padding-bottom:2.7mm;border-bottom:0.3mm solid #ddd\">" +
      "<div>" +
        "<div style=\"display:flex;align-items:flex-start;gap:2.5mm\">" +
          "<div style=\"background:#111;color:white;font-size:5.5mm;font-weight:700;width:10mm;height:10mm;display:flex;align-items:center;justify-content:center;letter-spacing:-0.3mm;border-radius:1.5mm;flex-shrink:0\">KC</div>" +
          "<div>" +
            "<div style=\"font-size:4mm;font-weight:600;color:#111\">" + coName + "</div>" +
            "<div style=\"font-size:3mm;font-weight:500;color:#111;margin-top:0.3mm\">" + coNameEN + "</div>" +
          "</div>" +
        "</div>" +
        (addrLine1 ? "<div style=\"font-size:2.8mm;color:#6b6b6b;margin-top:0.7mm\">" + addrLine1 + "</div>" : "") +
        (addrLine2 ? "<div style=\"font-size:2.8mm;color:#6b6b6b\">" + addrLine2 + (coTel ? " &nbsp; Tel/Fax : " + coTel : "") + "</div>" : (coTel ? "<div style=\"font-size:2.8mm;color:#6b6b6b\">Tel/Fax : " + coTel + "</div>" : "")) +
      "</div>" +
      "<div style=\"text-align:right;flex-shrink:0;margin-left:5mm\">" +
        "<div style=\"font-size:3mm;color:#6b6b6b\">เลขที่</div>" +
        "<div style=\"font-size:3mm;font-weight:500;color:#111;white-space:nowrap\">" + invoiceNo + "</div>" +
      "</div>" +
    "</div>" +
    // ── Doc title ───────────────────────────────────────────
    "<div style=\"font-size:6mm;font-weight:600;color:#111;margin-bottom:4mm\">ใบวางบิล</div>" +
    // ── Info band ───────────────────────────────────────────
    "<div style=\"display:flex;gap:0;margin-bottom:4mm;font-size:3.5mm;background:#fafafa;border-radius:1mm;padding:2mm 2.5mm\">" +
      "<div style=\"display:grid;grid-template-columns:auto 1fr;gap:1mm 2mm;width:40%;flex-shrink:0\">" +
        "<span style=\"color:#999;font-weight:500;white-space:nowrap\">วันที่</span><span style=\"color:#111\">" + thaiMonth(data.date) + "</span>" +
        "<span style=\"color:#999;font-weight:500;white-space:nowrap\">ชื่อ</span><span style=\"color:#111;font-weight:500\">" + (data.name || "") + "</span>" +
        "<span style=\"color:#999;font-weight:500;white-space:nowrap\">โทรศัพท์</span><span style=\"color:#111\">" + (data.phone || "") + "</span>" +
      "</div>" +
      "<div style=\"display:grid;grid-template-columns:auto 1fr;gap:1mm 2mm;width:60%;min-width:0;padding-left:3mm;align-content:start\">" +
        "<span style=\"color:#999;font-weight:500;white-space:nowrap\">ที่อยู่</span><span style=\"color:#111;word-break:break-word;line-height:1.6\">" + (data.address || "") + "</span>" +
      "</div>" +
    "</div>" +
    // ── Sub-text ────────────────────────────────────────────
    "<div style=\"font-size:3mm;color:#888;margin-bottom:3mm\">ได้รับใบวางบิลตามรายการข้างล่างนี้แล้ว เพื่อตรวจสอบและพร้อมชำระเงินไม่เกินกว่านี้</div>" +
    // ── Invoice table ───────────────────────────────────────
    "<table style=\"width:100%;border-collapse:collapse;font-size:3.5mm;margin-bottom:4mm;table-layout:fixed\">" +
      "<colgroup><col style=\"width:8mm\"><col style=\"width:74mm\"><col style=\"width:26mm\"><col style=\"width:26mm\"><col><col style=\"width:10mm\"></colgroup>" +
      "<thead><tr style=\"background:#111;color:white\">" +
        "<th style=\"padding:1.5mm 1.5mm;text-align:center;font-weight:500;font-size:3.2mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">#</th>" +
        "<th style=\"padding:1.5mm 1.5mm;text-align:left;font-weight:500;font-size:3.2mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">เลขที่บิล</th>" +
        "<th style=\"padding:1.5mm 1.5mm;text-align:center;font-weight:500;font-size:3.2mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">วันที่บิล</th>" +
        "<th style=\"padding:1.5mm 1.5mm;text-align:center;font-weight:500;font-size:3.2mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">ครบกำหนด</th>" +
        "<th style=\"padding:1.5mm 1.5mm;text-align:right;font-weight:500;font-size:3.2mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">จำนวนเงิน</th>" +
        "<th style=\"padding:1.5mm 1.5mm;text-align:center;font-weight:500;font-size:3.2mm\">สต.</th>" +
      "</tr></thead>" +
      "<tbody>" + itemRows + "</tbody>" +
      "<tfoot><tr>" +
        "<td colspan=\"3\" style=\"border-top:0.6mm solid #111;padding:1.5mm 1.5mm;font-size:3.2mm;color:#666\">รวม <strong style=\"color:#111\">" + invoices.length + "</strong> ฉบับ</td>" +
        "<td style=\"border-top:0.6mm solid #111;padding:1.5mm 1.5mm;text-align:right;font-weight:600;font-size:3.2mm;color:#555\">รวมเงินทั้งสิ้น</td>" +
        "<td colspan=\"2\" style=\"border-top:0.6mm solid #111;padding:1.5mm 1.5mm;text-align:right;font-weight:700;font-size:4mm\">" + fmt(total) + "</td>" +
      "</tr></tfoot>" +
    "</table>" +
    // ── Baht text ───────────────────────────────────────────
    "<div style=\"margin-top:4mm;margin-bottom:3mm;display:flex;align-items:center;gap:2mm\">" +
      "<span style=\"font-size:3.5mm;color:#999;white-space:nowrap\">จำนวนเงิน (ตัวอักษร)</span>" +
      "<span style=\"flex:1;font-size:4mm;padding:1mm 1.5mm;background:#f5f5f5;border-radius:0.8mm;color:#333\">(" + bahtTextGS(total) + ")</span>" +
    "</div>" +
    "<div style=\"min-height:4mm\"></div>" +
    // ── Footer / acknowledgment + signature ─────────────────
    "<div style=\"border-top:0.3mm solid #bbb;padding-top:3mm;margin-top:2mm\">" +
      "<div style=\"font-size:3.5mm;font-weight:500;color:#111;margin-bottom:0.5mm\">ข้าพเจ้าได้รับบิลตามรายการข้างต้นไว้ถูกต้องเรียบร้อยแล้ว</div>" +
      "<div style=\"font-size:3mm;color:#999;margin-bottom:4mm\">I have received the above billing amount in good order</div>" +
      "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:6mm\">" +
        "<div>" +
          "<div style=\"font-size:3.5mm;font-weight:500;color:#111\">ผู้รับบิล</div>" +
          "<div style=\"font-size:3mm;color:#999\">Bill receiver</div>" +
          "<div style=\"width:100%;border-bottom:0.3mm solid #bbb;height:8mm;margin-top:2mm\"></div>" +
        "</div>" +
        "<div>" +
          "<div style=\"font-size:3.5mm;font-weight:500;color:#111\">ให้มาติดต่อรับเงินวันที่</div>" +
          "<div style=\"font-size:3mm;color:#999\">Date of collecting</div>" +
          "<div style=\"width:100%;border-bottom:0.3mm solid #bbb;height:8mm;margin-top:2mm\"></div>" +
        "</div>" +
      "</div>" +
    "</div>" +
    "</div>";

  return page;
}

// ============================================================
// Billing note landscape PDF (1 page, A4 landscape, 2-up fold-and-cut: ต้นฉบับ + สำเนา)
// Center-lock architecture — divider frozen at physical paper center (same as TI/DN landscape)
// CALIBRATED leftHalfWidth: 151.5mm (borrowed from TI/DN — same printer HP DeskJet 2800, same @page settings)
// Re-calibrate via stagingTestBillingNoteLandscape() if printer or @page margins change
// ============================================================
function buildBillingNoteLandscapePDF(invoiceNo, name, data, opts) {
  opts = opts || {};
  var cfg    = getConfig();
  var folder = DriveApp.getFolderById(cfg.folders.bn);
  var page   = bnLandscapePageHTML(invoiceNo, name, data, cfg, opts);
  var html   = "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\">" + bnLandscapeCSS(opts) +
    "</head><body style=\"background:white\">" + page + "</body></html>";
  var blob    = Utilities.newBlob(html, "text/html; charset=utf-8", invoiceNo + "_billing_landscape.html");
  var pdfBlob = blob.getAs("application/pdf");
  pdfBlob.setName("KC_BillingNote_L_" + invoiceNo + "_" + name + ".pdf");
  var file = folder.createFile(pdfBlob);
  return "https://drive.google.com/file/d/" + file.getId() + "/view";
}

// #107 — landscape CSS (opts-aware; calibrated divider). Shared by single + combined builders.
function bnLandscapeCSS(opts) {
  opts = opts || {};
  var outerLeft      = opts.outerLeft      || "13mm";   // min safe for HP DeskJet 2800 non-printable zone
  var outerRight     = opts.outerRight     || "2mm";
  var innerGapL      = opts.innerGapL      || "5mm";
  var innerGapR      = opts.innerGapR      || "9mm";
  var pagePaddingTop = opts.pagePaddingTop || "10mm";
  var leftHalfWidth  = opts.leftHalfWidth  || "151.5mm"; // CALIBRATED — divider at paper center; change only via staging re-calibration
  return "<style>" + PROMPT_FONT_CSS +
    "html,body{background:white!important;font-family:Prompt,sans-serif;color:#111}" +
    "*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}" +
    "@page{size:A4 landscape;margin:8mm 8mm 8mm 0}" +
    ".page{width:297mm;display:flex;gap:0;padding-top:" + pagePaddingTop + ";margin-left:0}" +
    ".half{display:flex;flex-direction:column}" +
    ".half.left-h{flex-shrink:0;width:" + leftHalfWidth + ";padding-left:" + outerLeft + ";padding-right:" + innerGapL + "}" +
    ".half.right-h{flex:1;min-width:0;padding-left:" + innerGapR + ";padding-right:" + outerRight + "}" +
    ".divider{width:0;border-left:0.5mm dotted #ddd;flex-shrink:0}" +
    "</style>";
}

// #107 — page-only HTML (no wrapper/save) so combined print can concatenate multiple BNs
function bnLandscapePageHTML(invoiceNo, name, data, cfg, opts) {
  opts = opts || {};
  var centerLock = opts.centerLock !== false; // default true
  var co     = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var coNameEN = co.nameEN || "";
  var coAddr   = co.address || "";
  var coTel    = co.tel     || "";
  var am = coAddr.match(/^(.*?)\s*(จังหวัด.*)/);
  var addrLine1 = am ? am[1].trim() : coAddr.trim();
  var addrLine2 = am ? am[2].trim() : "";

  var invoices = data.invoices || [];
  var total    = parseFloat(data.total) || 0;

  function fmt(n) { return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function thaiShort(d) {
    if (!d) return "";
    var months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
    var dd, mm, yyyy;
    if (String(d).indexOf("/") >= 0) {
      var p = String(d).split("/"); dd = parseInt(p[0]); mm = parseInt(p[1]); yyyy = parseInt(p[2]);
    } else if (String(d).indexOf("-") >= 0) {
      var p = String(d).split("-"); yyyy = parseInt(p[0]); mm = parseInt(p[1]); dd = parseInt(p[2]);
    } else { return String(d); }
    return dd + " " + months[mm - 1] + " " + String(yyyy + 543).slice(2);
  }

  // 10 fixed rows, height:6mm (narrower half — smaller than portrait's 7mm)
  var itemRows = "";
  for (var i = 0; i < 10; i++) {
    var inv  = invoices[i] || null;
    var even = i % 2 === 0;
    var bg   = even ? "white" : "#f8f8f8";
    var bdr  = "border-bottom:0.2mm solid #e0e0e0;";
    var bdrR = "border-right:0.1mm solid #e0e0e0;";
    if (inv) {
      var dnDate = inv.dnDate || inv.date || "";
      var amt    = parseFloat(inv.amount || inv.total) || 0;
      var b = Math.floor(amt);
      var s = Math.round((amt - b) * 100);
      itemRows +=
        "<tr style=\"background:" + bg + ";height:6mm\">" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "text-align:center;font-size:2.5mm\">" + (i + 1) + "</td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "font-weight:500;font-size:2.7mm\">" + (inv.dnNo || inv.no || "") + "</td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "text-align:center;font-size:2.5mm\">" + thaiShort(dnDate) + "</td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "text-align:right;font-weight:500;font-size:2.7mm\">" + (b > 0 ? b.toLocaleString("th-TH") : "") + "</td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + "text-align:center;font-size:2.5mm\">" + (b > 0 ? String(s).padStart(2,"0") : "") + "</td>" +
        "</tr>";
    } else {
      itemRows +=
        "<tr style=\"background:" + bg + ";height:6mm\">" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + bdrR + "\"></td>" +
        "<td style=\"padding:1mm 1.5mm;" + bdr + "\"></td>" +
        "</tr>";
    }
  }

  function half(isOriginal) {
    var copyBadge = isOriginal ? "" :
      "<span style=\"font-size:3.2mm;color:#888;font-weight:400;margin-left:2mm;vertical-align:middle\">(สำเนา)</span>";
    return "<div class=\"half" + (centerLock ? (isOriginal ? " left-h" : " right-h") : "") + "\">" +
      // ── Header ──────────────────────────────────────────────
      "<div style=\"display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:2.2mm;border-bottom:0.3mm solid #ddd;margin-bottom:2.5mm\">" +
        "<div>" +
          "<div style=\"display:flex;align-items:flex-start;gap:2mm;margin-bottom:0.8mm\">" +
            "<div style=\"background:#111;color:white;font-size:4.5mm;font-weight:700;width:8.5mm;height:8.5mm;display:flex;align-items:center;justify-content:center;letter-spacing:-0.3mm;border-radius:1.2mm;flex-shrink:0\">KC</div>" +
            "<div>" +
              "<div style=\"font-size:3.2mm;font-weight:600;color:#111\">" + coName + "</div>" +
              "<div style=\"font-size:2.4mm;font-weight:500;color:#111;margin-top:0.2mm\">" + coNameEN + "</div>" +
            "</div>" +
          "</div>" +
          (addrLine1 ? "<div style=\"font-size:2.2mm;color:#6b6b6b\">" + addrLine1 + "</div>" : "") +
          (addrLine2 ? "<div style=\"font-size:2.2mm;color:#6b6b6b\">" + addrLine2 + (coTel ? " &nbsp; Tel/Fax : " + coTel : "") + "</div>" : (coTel ? "<div style=\"font-size:2.2mm;color:#6b6b6b\">Tel/Fax : " + coTel + "</div>" : "")) +
        "</div>" +
        "<div style=\"text-align:right;flex-shrink:0;margin-left:3mm\">" +
          "<div style=\"font-size:2.2mm;color:#6b6b6b\">เลขที่</div>" +
          "<div style=\"font-size:2.2mm;font-weight:500;color:#111;white-space:nowrap\">" + invoiceNo + "</div>" +
        "</div>" +
      "</div>" +
      // ── Doc title ───────────────────────────────────────────
      "<div style=\"font-size:4.5mm;font-weight:600;color:#111;margin-bottom:2.5mm\">ใบวางบิล" + copyBadge + "</div>" +
      // ── Info band ───────────────────────────────────────────
      "<div style=\"display:flex;gap:0;margin-bottom:2.5mm;font-size:2.7mm;background:#fafafa;border-radius:1mm;padding:1.5mm 2mm\">" +
        "<div style=\"display:grid;grid-template-columns:auto 1fr;gap:0.7mm 1.5mm;width:40%;flex-shrink:0;align-content:start\">" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">วันที่</span><span style=\"color:#111\">" + thaiMonth(data.date) + "</span>" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">ชื่อ</span><span style=\"color:#111;font-weight:500\">" + (data.name || "") + "</span>" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">โทรศัพท์</span><span style=\"color:#111\">" + (data.phone || "") + "</span>" +
        "</div>" +
        "<div style=\"display:grid;grid-template-columns:auto 1fr;gap:0.7mm 1.5mm;width:60%;min-width:0;padding-left:2.5mm;align-content:start\">" +
          "<span style=\"color:#999;font-weight:500;white-space:nowrap\">ที่อยู่</span><span style=\"color:#111;word-break:break-word;line-height:1.5\">" + (data.address || "") + "</span>" +
        "</div>" +
      "</div>" +
      // ── Sub-text ────────────────────────────────────────────
      "<div style=\"font-size:2.2mm;color:#888;margin-bottom:2mm\">ได้รับใบวางบิลตามรายการข้างล่างนี้แล้ว เพื่อตรวจสอบและพร้อมชำระเงินไม่เกินกว่านี้</div>" +
      // ── Invoice table ───────────────────────────────────────
      "<table style=\"width:100%;border-collapse:collapse;font-size:2.7mm;margin-bottom:2.5mm;table-layout:fixed\">" +
        "<colgroup><col style=\"width:6mm\"><col style=\"width:40%\"><col style=\"width:18mm\"><col style=\"width:18mm\"><col><col style=\"width:8mm\"></colgroup>" +
        "<thead><tr style=\"background:#111;color:white\">" +
          "<th style=\"padding:1.2mm 1.5mm;text-align:center;font-weight:500;font-size:2.5mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">#</th>" +
          "<th style=\"padding:1.2mm 1.5mm;text-align:left;font-weight:500;font-size:2.5mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">เลขที่บิล</th>" +
          "<th style=\"padding:1.2mm 1.5mm;text-align:center;font-weight:500;font-size:2.5mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">วันที่บิล</th>" +
          "<th style=\"padding:1.2mm 1.5mm;text-align:center;font-weight:500;font-size:2.5mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">ครบกำหนด</th>" +
          "<th style=\"padding:1.2mm 1.5mm;text-align:right;font-weight:500;font-size:2.5mm;border-right:0.1mm solid rgba(255,255,255,0.25)\">จำนวนเงิน</th>" +
          "<th style=\"padding:1.2mm 1.5mm;text-align:center;font-weight:500;font-size:2.5mm\">สต.</th>" +
        "</tr></thead>" +
        "<tbody>" + itemRows + "</tbody>" +
        "<tfoot><tr>" +
          "<td colspan=\"3\" style=\"border-top:0.5mm solid #111;padding:1.2mm 1.5mm;font-size:2.4mm;color:#666\">รวม <strong style=\"color:#111\">" + invoices.length + "</strong> ฉบับ</td>" +
          "<td style=\"border-top:0.5mm solid #111;padding:1.2mm 1.5mm;text-align:right;font-size:2.4mm;font-weight:600\">รวมเงินทั้งสิ้น</td>" +
          "<td colspan=\"2\" style=\"border-top:0.5mm solid #111;padding:1.2mm 1.5mm;text-align:right;font-weight:700;font-size:3.5mm\">" + fmt(total) + "</td>" +
        "</tr></tfoot>" +
      "</table>" +
      // ── Baht text ───────────────────────────────────────────
      "<div style=\"display:flex;align-items:center;gap:1.5mm;margin-bottom:2mm\">" +
        "<span style=\"font-size:2.4mm;color:#999;white-space:nowrap\">จำนวนเงิน (ตัวอักษร)</span>" +
        "<span style=\"flex:1;font-size:3mm;padding:0.8mm 1.2mm;background:#f5f5f5;border-radius:0.7mm;color:#333\">(" + bahtTextGS(total) + ")</span>" +
      "</div>" +
      // ── Footer ──────────────────────────────────────────────
      "<div style=\"border-top:0.3mm solid #bbb;padding-top:4mm;margin-top:auto\">" +
        "<div style=\"font-size:2.7mm;font-weight:500;color:#111;margin-bottom:0.5mm\">ข้าพเจ้าได้รับบิลตามรายการข้างต้นไว้ถูกต้องเรียบร้อยแล้ว</div>" +
        "<div style=\"font-size:2.3mm;color:#999;margin-bottom:3mm\">I have received the above billing amount in good order</div>" +
        "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:4mm\">" +
          "<div>" +
            "<div style=\"font-size:2.7mm;font-weight:500;color:#111\">ผู้รับบิล</div>" +
            "<div style=\"font-size:2.3mm;color:#999\">Bill receiver</div>" +
            "<div style=\"width:100%;border-bottom:0.3mm solid #bbb;height:6mm;margin-top:1.5mm\"></div>" +
          "</div>" +
          "<div>" +
            "<div style=\"font-size:2.7mm;font-weight:500;color:#111\">ให้มาติดต่อรับเงินวันที่</div>" +
            "<div style=\"font-size:2.3mm;color:#999\">Date of collecting</div>" +
            "<div style=\"width:100%;border-bottom:0.3mm solid #bbb;height:6mm;margin-top:1.5mm\"></div>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  return "<div class=\"page\">" + half(true) + "<div class=\"divider\"></div>" + half(false) + "</div>";
}

// ============================================================
// TEST / STAGING functions moved to Staging.gs (#44, 2026-06-19)
// All test*() / stagingTest*() run manually from the Apps Script editor.
// ============================================================
