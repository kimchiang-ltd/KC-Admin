// ============================================================
// KC Factory System — Code.gs
// Version: 1.4.128 — promote staging to live: showDesc2Parens default→false (all 4 builders), altHeaders default→true (TI portrait); no parens on size, portrait headers nowrap
// Version: 1.4.127 — rename all staging test functions: test[Format]Test() → stagingTest[Format](); update comment block pattern description
// Version: 1.4.126 — TI portrait: add altHeaders opt — "หน่วยละ" + white-space:nowrap on TH + colgroup col3:20→16mm, col4:18→20mm, col5:7→11mm; stagingTestTaxInvoicePortrait uses altHeaders:true
// Version: 1.4.125 — add workflow comment block above test functions explaining *Test() staging pattern
// Version: 1.4.124 — rename testTaxInvoiceLandscapeMarginTest → testTaxInvoiceLandscapeTest; drop margin opts, use showDesc2Parens:false to match pattern of other *Test() functions
// Version: 1.4.123 — DN portrait + TI portrait: add opts param (showDesc2Parens); add testDeliveryNotePortraitTest() and testTaxInvoicePortraitTest() with showDesc2Parens:false
// Version: 1.4.122 — all test functions: remove "PDF URL: " prefix from Logger.log so URL is directly copyable
// Version: 1.4.121 — TI landscape + TI portrait: add showDesc2Parens to opts (default true); TI portrait: add opts param
// Version: 1.4.120 — DN landscape: add opts param (showDesc2Parens) to buildDeliveryNoteLandscapePDF; add testDeliveryNoteLandscapeTest() with showDesc2Parens:false for layout comparison
// Version: 1.4.119 — TI landscape: add opts param (pageMargin, pageWidth) to buildTaxInvoiceLandscapePDF; add testTaxInvoiceLandscapeMarginTest() with 9mm symmetric margin for side-by-side comparison
// Version: 1.4.118 — TI landscape: field-value + field-sub font 3.5→3mm
// Version: 1.4.117 — TI landscape: font 3→2.5mm, colgroup ราคาหน่วยละ col 20→16mm, header "ราคาหน่วยละ"→"หน่วยละ"; TI landscape + TI portrait: fix border suppression — CSS class requires border-bottom:none inline override (reversed bdr/contBdr logic vs DN builders)
// Version: 1.4.116 — portrait left block width scaled by font size: DN portrait 38→44mm (font 3.5mm vs 3mm), TI portrait 38→49mm (font 3.9mm vs 3mm); prevents desc+desc2 clipping into detail text
// Version: 1.4.115 — all 4 PDF builders: remove horizontal border within the same product group; border only on last row of each group (main row if no cont, last cont row); border-right preserved on DN builders
// Version: 1.4.114 — all 4 PDF builders: alternating row color now keyed by product index (i) not rowCount; continuation rows share their parent product's background color
// Version: 1.4.113 — all 4 PDF builders: fixed-width split layout in desc cell — 38mm left block for desc+desc2, flex:1 right block for detail text; cont rows use same 38mm empty left block so detail always aligns; removes variable-indent problem
// Version: 1.4.112 — add table-layout:fixed to all 4 PDF builders so white-space:nowrap clips at column boundary instead of stretching the table; fixes horizontal template expansion from long continuation text
// Version: 1.4.111 — PDF continuation row style: remove ↳ arrow, remove () around cont text, add padding-left:5mm indent, white-space:nowrap;overflow:hidden on desc TDs (all 4 builders); () now wraps desc2 (size) not detail; fix filledItems filter for TI portrait; apply cont row split to TI portrait
// Updated: 2026-06-12
// Changelog:
//   1.4.109 - filledItems filter: add desc2||detail condition (was desc||qty||amount only) — continuation rows with only detail text were silently dropped on save
//   1.4.108 - All grid lines unified to #e0e0e0 (was #eee TI / #e0e0e0 DN / #ccc vertical); TI landscape th font 3.4→3mm, td font 3.5→3mm (uniform, remove td:first-child override); colgroup 16+19+16+7→16+20+18+7mm; mock customer name → บจ.นูเบบ (ประเทศไทย)
//   1.4.107 - Revert to border-right on td/th + :last-child{border-right:none} for all 4 formats; removes rightmost border; TI landscape colgroup narrowed to 16+19+16+7mm (description gains ~11mm); td:first-child font-size:3mm kept
//   1.4.104 - Vertical lines via background-image gradient (not border) — zero layout impact; removes table-layout:fixed from TI landscape + DN portrait
//   1.4.103 - TI landscape table font: body 3.2→3mm, header 3→2.8mm to reduce wrapping
//   1.4.102 - Switch to border-left on non-description columns (description column has no border, cannot affect its width)
//   1.4.101 - Add table-layout:fixed to TI landscape + DN portrait tables to stabilize column widths
//   1.4.100 - Column lines 0.15→0.1mm; add :last-child rules to remove rightmost border on TI portrait
//   1.4.99  - Fix footnote overflow: switch td border from all-sides to border-right only (no height added); 0.2→0.15mm; add TI portrait vertical lines
//   1.4.98  - Add vertical column lines to DN landscape/portrait + TI landscape tables; all 5 PDF URLs /preview→/view for in-browser printing
//   1.4.97  - DN portrait font: เลขที่ 3mm, invoice no 3.5mm, customer info 3.5mm, ยอดรวม 3.5mm, baht 4mm, sig labels 3.5mm, sender 4mm, footer 3.5mm
//   1.4.95  - PDF caching: landscape generate functions write URL back to sheet (col 13 DN / col 14 TI); edit clears both landscape + portrait URLs
//   1.4.94  - DN portrait font: scale up to match landscape (table 3.5mm, company 4.5mm, info 3.2mm, total 4mm); portrait URL persistence
//   1.4.93  - Portrait URL persistence: generate functions save to col 15 (DN) / col 17 (TI); load functions return portraitUrl; edit clears it
//   1.4.92  - Edit log: use _logAdded/_logDeleted from frontend in both update functions — shows actual add/delete counts instead of net
//   1.4.91 - Auto-extend sheet rows before batch write in createDeliveryNoteFromWeb + createTaxInvoiceFromWeb (safe to delete empty rows now)
//   1.4.90 - Fix row 100696 bug: createDeliveryNoteFromWeb uses getLastNonEmptyRow (getLastRow() was inflated by formulas/formatting); fix getDeliveryNotes, getTaxInvoices, getNextTaxInvoiceNumber, createTaxInvoiceFromWeb (batch writes + firstWriteRow), all PDF-from-web functions — all use getLastNonEmptyRow instead of getDataRange()
//   1.4.89 - Fix sheet reads: use getLastRow() instead of getDataRange() — sheet had 100k formatted rows causing writes at wrong row
//   1.4.88 - Fix createDeliveryNoteFromWeb: lastDataRow scans col A instead of using histRows.length (trailing empty rows caused writes to wrong row)
//   1.4.87 - Performance: createDeliveryNoteFromWeb single read + lock + batch write; updateDeliveryNoteFromWeb + updateTaxInvoiceFromWeb batch delete/update/insert, remove second sheet read
//   1.4.86 - Edit log: detect header changes (แก้ไขข้อมูล) and row value changes (แก้ไขรายการ) in both update functions
//   1.4.85 - Edit log: descriptive changes (เพิ่ม N แถว / ลบ: ... / แก้ไข) in both update functions
//   1.4.84 - Fix router: createDeliveryNote→createDeliveryNoteFromWeb, updateDeliveryNote→updateDeliveryNoteFromWeb (were still calling old names)
//   1.4.83 - Edit log for deleted rows in updateTaxInvoiceFromWeb (col P)
//   1.4.82 - #25+#28: rename router cases getInvoices→getDeliveryNotes, createInvoice→createDeliveryNote, updateInvoice→updateDeliveryNote, searchInvoices→searchDeliveryNotes
//   1.4.81 - #28: rename router case strings to match frontend (generateTaxInvoicePortraitPDF, generateDeliveryNoteLandscapePDF, generateDeliveryNotePortraitPDF)
//   1.4.80 - Fix tax invoice PDF filenames: landscape KC_TaxInvoice_→KC_TaxInvoice_L_, portrait KC_Invoice_→KC_TaxInvoice_P_
//   1.4.79 - Fix PDF router: revert 3 case strings corrupted by sed rename (buildTaxInvoicePortraitPDF→generatePortraitPDF, buildDeliveryNoteLandscapePDF→generateInvoiceLandscapePDF, buildDeliveryNotePortraitPDF→generateInvoicePortraitPDF); fixes PDF Portrait "nothing happens" bug
//   1.4.78 - Fix #21: rewrite updateTaxInvoiceFromWeb — now handles delete/update/insert of item rows (mirroring updateDeliveryNoteFromWeb); cols A–M written per row, N (pdfUrl) and O (formula) left untouched
//   1.4.77 - Code cleanup: rename all Invoice→DeliveryNote / generateXxx→buildXxx functions for clarity; delete dead legacy code (saveAndNewInvoice, generateInvoicePDF, testCreateTaxInvoice); test functions now all use hardcoded mock data (no sheet reads)
//   1.4.76 - Delivery note landscape: reduce gap above/below baht text row (4mm→2mm) to fix footnote overflow to page 2
//   1.4.75 - Delivery note landscape: +1pt (+0.35mm) on all body components (badge 3.9, customer 2.9, th 3.0, td 3.2, ยอดรวม label 3.0, total 3.4, baht label 2.9, baht value 3.2, sig labels 2.9, sig company 3.0, note 2.8)
//   1.4.74 - Delivery note landscape: font size pass — เลขที่ 2.3mm, customer box 2.5mm, table header 2.6mm, table body 2.8mm, ยอดรวม label 2.6mm, baht label 2.5mm, baht value 2.8mm, sig labels 2.5mm, sig company 2.6mm; fix (สำเนา) badge vertical-align; fix duplicate font-size on note
//   1.4.73 - Delivery note landscape: KC box 12→11mm (font 6.6→6mm), L_ prefix on landscape filename, P_ prefix on portrait filename
//   1.4.72 - Delivery note landscape: KC box 14→12mm (font 7.7→6.6mm), TH name 3.1→4mm, EN name 2.2→3mm, fix EN name blank fallback (#8)
//   1.4.71 - Landscape: baht-text font 2.8→3.5mm (match customer name)
//   1.4.70 - Landscape: baht text vertically centered inside stretched box
//   1.4.69 - Landscape: baht text box stretches to match summary height (align-items:stretch + flex:1 on baht-text)
//   1.4.68 - Landscape: header min-height 30→32mm
//   1.4.67 - Landscape: header min-height 27→30mm (right half still taller)
//   1.4.66 - Landscape: slash moved to end of line (Option B); header min-height:27mm so both halves per page align at same row positions
//   1.4.65 - Landscape: logo 9→9.5mm to match TH+EN company name block height
//   1.4.64 - Landscape: right header col max-width 44→58mm (titles were wrapping past explicit <br> breaks causing 3-4 lines)
//   1.4.63 - Landscape: title <br> at each / for controlled 2-line split; right header col max-width:44mm flex-shrink:0; left col flex:1 min-width:0; remove flex:1 from items-table (fixes sig off-page)
//   1.4.62 - Landscape: header restructured to match portrait (address at logo level, เลขที่ right+auto, flex header); docTitle/docNote/sigLabel updated to match paper set; white-space:nowrap removed from doc-title
//   1.4.61 - testTaxInvoicePortraitPDF: hardcoded 15-item mock data, calls buildTaxInvoicePortraitPDF directly (no sheet needed)
//   1.4.60 - Portrait: summary gap 4→8mm between label and amount
//   1.4.59 - Portrait: sig-row margin-top 5→15mm; testCreateTaxInvoice expanded to 15 items (full table)
//   1.4.58 - Portrait: header min-height:26mm so all pages have consistent header height; เลขที่ always at bottom via margin-top:auto
//   1.4.57 - Portrait: header align-items:stretch; summary min-width:65mm; sig 3mm; sig-row margin-top 5mm; note margin-top 1.5mm
//   1.4.56 - Portrait: doc-title line-height:1.2 to reduce top gap and align with company name
//   1.4.55 - Portrait: logo 9→10mm to match TH+EN name height; summary subtotals 3→3.9mm, total 3.5→4.5mm
//   1.4.54 - Portrait: right header div flex-column so เลขที่ always aligns to bottom across all page types
//   1.4.53 - Portrait: doc-no font 2.8→3mm (match company name EN)
//   1.4.52 - Portrait: blue copy title split to 2 lines; (ไม่ใช่ใบกำกับภาษี) font 2.8→4mm across all pages
//   1.4.51 - Portrait: doc titles/notes/sigLabels updated to match original paper set (green/yellow/white/blue); docSub removed
//   1.4.50 - Portrait: header restructure (address at logo level, เลขที่ on right), baht text below summary, font bumps (เลขที่ 2.8, subtotals 3, sig 2.8, note 2.8, baht-label 3)
//   1.4.49 - Both: remove border from baht-text box
//   1.4.48 - Both: margin-bottom between baht+summary and sig row 2mm → 4mm
//   1.4.47 - Both: Tel/Fax merged onto addrLine2 row; Portrait: full sync with landscape (header, sigLabels, bottom layout, note font, summary labels)
//   1.4.46 - Landscape: sig row moved to full-width row below summary+baht-text; summary inline divs (no table)
//   1.4.45 - Landscape: invoice no. → tax ID row; grid layout for bottom (3 rows align: label↔subtotal, box↔VAT, sig↔total); summary 2.5mm compact; sig-row margin fix
//   1.4.44 - Landscape: merge bottom section into single flex row (baht+sig left, one summary table right) so widths align; total row border-top in CSS
//   1.4.43 - Landscape: address split at จังหวัด (not อำเภอ), tax ID label → เลขประจำตัวผู้เสียภาษีอากร on own line below Tel/Fax
//   1.4.42 - Landscape: summary table-layout:auto + white-space:nowrap, remove fixed width so labels never wrap
//   1.4.41 - Landscape: sig labels ผู้รับเงิน/ผู้รับของ (remove company name), summary label จำนวนภาษีมูลค่าเพิ่ม, summary font 2.8mm, summary 44→50mm, note font 2.4mm
//   1.4.40 - Landscape: address 2-line split, เลขที่ on Tel row, sig row equal width, summary 52→44mm, remove table borders, tighten padding
//   1.4.39 - Landscape: customer box field group margin-bottom 2mm → 1.5mm
//   1.4.38 - Landscape: table padding 1.4→1mm, baht text 3.7→2.8mm, sender font 3.2→2.4mm (landscape+portrait)
//   1.4.37 - buildTaxInvoiceLandscapePDF: table body font 3.9mm → 3.5mm
//   1.4.36 - Clean up test functions: remove testFontTimeout, rename all, add testTaxInvoiceLandscapePDF
//   1.4.35 - buildTaxInvoiceLandscapePDF: fix extra </div> in half() breaking 2-up landscape layout
//   1.4.34 - buildTaxInvoiceLandscapePDF: remove width:0 from .half (fixes one-copy-only landscape render)
//   1.4.33 - Move PROMPT_FONT_CSS to Font.gs (separate file)
//   1.4.32 - Extract PROMPT_FONT_CSS to global variable (4 copies → 1); file size 737KB → 246KB
//   1.4.31 - Tax invoice portrait+landscape: sig-row aligned with total row, KC name 3.2mm, note below
//   1.4.30 - testPortraitPDF: auto-pick latest tax invoice from sheet (was hardcoded)
//   1.4.29 - Tax invoice portrait+landscape: note size↑, address match name style, baht text size↑, doc-no size match, sender align fix
//   1.4.28 - Landscape: logo align with TH+EN only, address postal code same line as อำเภอ
//   1.4.27 - Landscape: doc-title/doc-no nowrap, doc-no Prompt font, customer-box wider left column
//   1.4.26 - Add generateTaxInvoiceLandscapePDFFromWeb for re-generate landscape from detail page
//   1.4.25 - Tax invoice landscape+portrait: add ที่อยู่ label, fix signature to หจก.โรงงานกิมเชียง, fix summary font to Prompt
//   1.4.24 - buildTaxInvoiceLandscapePDF + buildTaxInvoicePortraitPDF: switch from Sarabun to Prompt font
//   1.4.23 - buildDeliveryNotePortraitPDF: rewrite to match landscape v2 design + Prompt font
//   1.4.22 - updateInvoiceFromWeb: write edit log (timestamp+email) to col N
//   1.4.21 - createInvoiceFromWeb: remove old PDF gen, add uniqueness check, fix col A; landscape PDF after save
//   1.4.20 - createInvoiceFromWeb: invoice no. from History sheet (not K2); updateInvoiceFromWeb: update items
//   1.4.19 - all PDF functions: getUrl() → /preview URL to open in Drive viewer
//   1.4.18 - buildDeliveryNoteLandscapePDF: สำเนา badge 2.2→3.5mm + วงเล็บ
//   1.4.17 - buildDeliveryNoteLandscapePDF: baht tag 1.9→2.3mm, baht text 2.3→2.6mm, remove flex:1 spacer
//   1.4.16 - buildDeliveryNoteLandscapePDF: full mockup v2 sync — address layout, sig cleanup, borders removed
//   1.4.15 - buildDeliveryNoteLandscapePDF: font size & spacing adjustments per design review
//   1.4.14 - buildDeliveryNoteLandscapePDF: embed Prompt font as base64 (thai+latin, 400/500/600/700)
//   1.4.13 - buildDeliveryNoteLandscapePDF: remove explicit font → use system font throughout
//   1.4.12 - buildDeliveryNoteLandscapePDF: switch font Prompt → Sarabun
//   1.4.11 - add testFontTimeout() to diagnose font load timing issue
//   1.4.10 - buildDeliveryNoteLandscapePDF: fix font loading @import → <link> for Prompt font
//   1.4.9 - buildDeliveryNoteLandscapePDF: modern layout — KC badge, grid customer info, 2-col signature
//   1.4.8 - buildDeliveryNoteLandscapePDF: remove min-height:192mm, table headers single-line (match mockup)
//   1.4.7 - buildDeliveryNoteLandscapePDF: Prompt font, TH/EN headers same line/size
//   1.4.6 - buildDeliveryNoteLandscapePDF: reduce font sizes (3mm→2.5mm) and padding for smaller table
//   1.4.5 - testInvoicePDF: search upward for non-empty invoiceId
//   1.4.4 - testInvoicePDF: auto-pick latest invoice from Invoice History
//   1.4.3 - buildDeliveryNoteLandscapePDF: flex:1 spacer → min-height:10mm to fix large gap
//   1.4.2 - buildDeliveryNoteLandscapePDF: rows 15→10 to fit landscape page
//   1.4.1 - buildDeliveryNoteLandscapePDF: redesign per mockup v12 (15 rows, new layout, sig padding-bottom 4mm)
//   1.4.0 - ใบส่งของ: buildDeliveryNoteLandscapePDF + buildDeliveryNotePortraitPDF (HTML-based)
//   1.3.9 - Landscape: combined 2-sheet PDF (tax+receipt), nameEN, เล่มที่/เลขที่
//   1.3.8 - buildTaxInvoicePortraitPDF: 4-page PDF (tax+receipt x2), nameEN in header, เล่มที่/เลขที่; add nameEN to getConfig/saveConfig
//   1.3.7 - PDF: company info from getConfig() (name/address/tel/taxId); add taxId to getConfig/saveConfig
//   1.3.6 - Portrait: fix satang "00" auto-fill (was missing b > 0 check)
//   1.2.0 - Add buildTaxInvoicePortraitPDF (portrait A4, 2 pages ต้นฉบับ+สำเนา)
//   1.1.9 - PDF: restore font sizes
//   1.1.8 - PDF: min-height 170mm→182mm
//   1.1.7 - PDF: padding/margin -10% further
//   1.1.6 - PDF: padding -10%, testCreateInvoice 10 mock rows
//   1.1.5 - PDF: padding -10%, page padding-top 8mm→4mm
//   1.1.4 - PDF: revert sig-row font to 2.4mm
//   1.1.3 - PDF: all font sizes +0.5mm
//   1.1.2 - PDF: restore colgroup + table-layout:auto
//   1.1.1 - PDF: remove colgroup (reverted)
//   1.1.0 - PDF: page padding-top, items font, sig-row, footer spacing
//   1.0.0 - Initial release
// ============================================================

var CONFIG = {
  invoiceFolderId : "1pctvxLOmpmvpI7DjLUCl4fsXW6iUaAvz",
  bnFolderId      : "1zV4Gqqff3ytAUYFeS4Xt3nnRnuwKgTGv",
  invoiceSheet    : "Tax Invoice",
  invoiceHistory  : "Invoice History",
  bnTemplate      : "BN Template",
  bnHistory       : "BN History",
  configSheet     : "Config",
};

var TAX_INVOICE_SHEET = "Tax Invoice History";


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
      case "previewBillingNote":
        result = previewBillingNote(params.customer, params.invoices);
        break;
      case "confirmBillingNote":
        result = confirmBillingNote(params.customer, params.reservedBnNo, params.invStartDate, params.invEndDate);
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
      case "getBNHistory":
        result = getBNHistory();
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

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Billing Note').addItem('เปิด Billing Note', 'openBillingNoteSidebar').addToUi();
}

function openBillingNoteSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Billing Note').setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ============================================================
// SHARED HELPERS
// ============================================================

function parseBNDate(raw) {
  if (raw instanceof Date) return raw;
  var str = String(raw).trim(), parts = str.split("/");
  if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  return new Date(raw);
}

function getLastNonEmptyRow(sheet, col) {
  var colVals = sheet.getRange(col + ":" + col).getValues(), lastRow = 1;
  for (var r = colVals.length - 1; r >= 1; r--) {
    if (colVals[r][0] !== "") { lastRow = r + 1; break; }
  }
  return lastRow;
}

function getNextBNNumber() {
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
    var row = data[i], invoiceNo = String(row[0]).trim(), rowDate = new Date(row[1]), name = String(row[2]).trim(), total = row[11];
    if (!invoiceNo || !name) continue;
    if (rowDate < start || rowDate > end) continue;
    if (!grouped[name]) grouped[name] = {};
    if (!grouped[name][invoiceNo]) grouped[name][invoiceNo] = { invoiceNo: invoiceNo, date: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "dd/MM/yyyy"), total: 0 };
    if (!grouped[name][invoiceNo].total && total) grouped[name][invoiceNo].total = total;
  }
  var bnHistory = ss.getSheetByName(CONFIG.bnHistory), generated = {};
  if (bnHistory && bnHistory.getLastRow() > 1) {
    var bnData = bnHistory.getDataRange().getValues();
    for (var b = 1; b < bnData.length; b++) {
      var bnCustomer = String(bnData[b][2]).trim(), bnStart = bnData[b][5] ? parseBNDate(bnData[b][5]) : null, bnEnd = bnData[b][6] ? parseBNDate(bnData[b][6]) : null;
      if (!bnStart || !bnEnd) continue;
      bnStart.setHours(0,0,0,0); bnEnd.setHours(0,0,0,0);
      if (bnStart <= end && bnEnd >= start) generated[bnCustomer] = true;
    }
  }
  var result = [];
  for (var customer in grouped) {
    var invoices = [];
    for (var inv in grouped[customer]) invoices.push(grouped[customer][inv]);
    invoices.sort(function(a, b) { return a.invoiceNo.localeCompare(b.invoiceNo); });
    result.push({ customer: customer, invoices: invoices, generated: generated[customer] || false });
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
  var data  = sheet.getRange(1, 1, lastDataRow, 15).getValues();
  var start = startDate ? new Date(startDate) : null, end = endDate ? new Date(endDate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end)   end.setHours(23, 59, 59);
  var grouped = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i], invoiceNo = String(row[0]).trim(), rowDate = new Date(row[1]), name = String(row[2]).trim();
    if (!invoiceNo || !name) continue;
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

function previewBillingNote(customer, invoices) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), bnSheet = ss.getSheetByName(CONFIG.bnTemplate);
  if (!bnSheet) throw new Error("ไม่พบ sheet 'BN Template'");
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), previewBnNo = getNextBNNumber();
  bnSheet.getRange("G3").setValue(previewBnNo); bnSheet.getRange("C17").setValue(todayStr); bnSheet.getRange("C18").setValue(customer); bnSheet.getRange("C19").clearContent(); bnSheet.getRange("B28:G39").clearContent();
  var grandTotal = 0;
  for (var i = 0; i < invoices.length && i < 12; i++) {
    var inv = invoices[i], baht = Math.floor(inv.total), satang = Math.round((inv.total - baht) * 100), row = 28 + i;
    bnSheet.getRange("B" + row).setValue(i + 1); bnSheet.getRange("C" + row).setValue(inv.invoiceNo); bnSheet.getRange("D" + row).setValue(inv.date); bnSheet.getRange("E" + row).setValue(""); bnSheet.getRange("F" + row).setValue(baht); bnSheet.getRange("G" + row).setValue(satang > 0 ? satang : "");
    grandTotal += inv.total;
  }
  var totalBaht = Math.floor(grandTotal), totalSatang = Math.round((grandTotal - totalBaht) * 100);
  bnSheet.getRange("C40").setValue(invoices.length); bnSheet.getRange("F40").setValue(totalBaht); bnSheet.getRange("G40").setValue(totalSatang > 0 ? totalSatang : "");
  SpreadsheetApp.flush(); ss.setActiveSheet(bnSheet);
  return previewBnNo;
}

function confirmBillingNote(customer, reservedBnNo, invStartDate, invEndDate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), bnSheet = ss.getSheetByName(CONFIG.bnTemplate), bnHistory = ss.getSheetByName(CONFIG.bnHistory) || ss.insertSheet(CONFIG.bnHistory);
  if (!bnSheet) throw new Error("ไม่พบ sheet 'BN Template'");
  if (bnHistory.getLastRow() === 0) bnHistory.appendRow(["เลขที่ BN","วันที่ออก","ชื่อลูกค้า","จำนวนบิล","รวมเงิน","วันที่บิลเริ่มต้น","วันที่บิลสิ้นสุด","ไฟล์ PDF"]);
  var bnNo = reservedBnNo || getNextBNNumber(), todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  bnSheet.getRange("G3").setValue(bnNo); SpreadsheetApp.flush();
  var itemCount = bnSheet.getRange("C40").getValue(), totalBaht = bnSheet.getRange("F40").getValue(), totalSatang = bnSheet.getRange("G40").getValue(), grandTotal = totalBaht + (totalSatang > 0 ? totalSatang / 100 : 0);
  var folder = DriveApp.getFolderById(CONFIG.bnFolderId), pdfName = "BN_" + bnNo + "_" + customer, sheetId = bnSheet.getSheetId(), exportRange = bnSheet.getRange("A1:V48");
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=pdf&size=A4&portrait=false&fitw=true&fith=true&top_margin=0.4&bottom_margin=0.4&left_margin=0.4&right_margin=0.4&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=false&gid=' + sheetId + '&range=' + exportRange.getA1Notation();
  var response = UrlFetchApp.fetch(url, { headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() } });
  var file = folder.createFile(response.getBlob()).setName(pdfName + ".pdf"), pdfUrl = "https://drive.google.com/file/d/" + file.getId() + "/view";
  var invStart = "", invEnd = "";
  try { var dp1 = invStartDate.split("-"); invStart = new Date(parseInt(dp1[0]), parseInt(dp1[1]) - 1, parseInt(dp1[2])); var dp2 = invEndDate.split("-"); invEnd = new Date(parseInt(dp2[0]), parseInt(dp2[1]) - 1, parseInt(dp2[2])); } catch(e) {}
  var lastRow = getLastNonEmptyRow(bnHistory, "A");
  bnHistory.getRange(lastRow + 1, 1, 1, 8).setValues([[bnNo, todayStr, customer, itemCount, grandTotal, invStart, invEnd, pdfUrl]]);
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

  return { success: true, invoiceNo: invoiceId };
}

// ============================================================
// BN HISTORY
// ============================================================

function getBNHistory() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), bnHistory = ss.getSheetByName(CONFIG.bnHistory);
  if (!bnHistory || bnHistory.getLastRow() <= 1) return [];
  var data = bnHistory.getDataRange().getValues(), result = [];
  for (var i = 1; i < data.length; i++) { var row = data[i]; if (!row[0]) continue; result.push({ bnNo: String(row[0]).trim(), date: String(row[1]).trim(), customer: String(row[2]).trim(), count: row[3], total: row[4], pdfUrl: String(row[7]).trim() }); }
  return result.reverse();
}

// ============================================================
// CONFIG
// ============================================================

function getConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.configSheet);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.configSheet); sheet.appendRow(["type", "value"]);
    var defaults = [["product","Product A"],["product","Product B"],["product","Product C"],["product","Product D"],["size","S"],["size","M"],["size","L"],["size","XL"],["size","XXL"],["size","XXXL"],["company","หจก. โรงงานกิมเชียง"],["nameEN","KIMCHIANG LIMITED PARTNERSHIP"],["address","25/9 หมู่ 10 ต.ลอมแม่นาง อ.บางใหญ่ จ.นนทบุรี 11140"],["tel","02-191-8698-9"],["invoiceFolder",CONFIG.invoiceFolderId],["bnFolder",CONFIG.bnFolderId]];
    defaults.forEach(function(r) { sheet.appendRow(r); });
  }
  var data = sheet.getDataRange().getValues(), products = [], sizes = [], company = {}, folders = {};
  for (var i = 1; i < data.length; i++) {
    var type = String(data[i][0]).trim(), val = String(data[i][1]).trim();
    if      (type === "product")       products.push(val);
    else if (type === "size")          sizes.push(val);
    else if (type === "company")       company.name    = val;
    else if (type === "nameEN")        company.nameEN  = val;
    else if (type === "address")       company.address = val;
    else if (type === "tel")           company.tel     = val;
    else if (type === "taxId")         company.taxId   = val;
    else if (type === "invoiceFolder") folders.invoice = val;
    else if (type === "bnFolder")      folders.bn      = val;
  }
  return { products: products, sizes: sizes, company: company, folders: folders };
}

function saveConfig(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(CONFIG.configSheet) || ss.insertSheet(CONFIG.configSheet);
  sheet.clearContents(); sheet.appendRow(["type", "value"]);
  (data.products || []).forEach(function(p) { sheet.appendRow(["product", p]); });
  (data.sizes    || []).forEach(function(s) { sheet.appendRow(["size",    s]); });
  if (data.company) { sheet.appendRow(["company", data.company.name || ""]); sheet.appendRow(["nameEN", data.company.nameEN || ""]); sheet.appendRow(["address", data.company.address || ""]); sheet.appendRow(["tel", data.company.tel || ""]); sheet.appendRow(["taxId", data.company.taxId || ""]); }
  if (data.folders) { sheet.appendRow(["invoiceFolder", data.folders.invoice || ""]); sheet.appendRow(["bnFolder", data.folders.bn || ""]); }
  return { success: true };
}

// ============================================================
// TAX INVOICE
// ============================================================

function getNextTaxInvoiceNumber() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(TAX_INVOICE_SHEET), yearYY = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yy");
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
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(TAX_INVOICE_SHEET);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastDataRow = getLastNonEmptyRow(sheet, "A");
  if (lastDataRow <= 1) return [];
  var data = sheet.getRange(1, 1, lastDataRow, 17).getValues(), start = startDate ? new Date(startDate) : null, end = endDate ? new Date(endDate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end)   end.setHours(23, 59, 59);
  var grouped = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i], invoiceNo = String(row[0]).trim();
    if (!invoiceNo) continue;
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
    inv.subtotal = parseFloat(sub.toFixed(2)); inv.vatAmt = parseFloat((sub * 0.07).toFixed(2)); inv.grandTotal = parseFloat((sub + sub * 0.07).toFixed(2));
  });
  return result.sort(function(a, b) { return b.id.localeCompare(a.id); });
}

function createTaxInvoiceFromWeb(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(TAX_INVOICE_SHEET);
  if (!sheet) throw new Error("ไม่พบ sheet '" + TAX_INVOICE_SHEET + "'");

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
  return { invoiceNo: invoiceNo, pdfUrl: pdfUrl };
}

function thaiMonth(dateStr) {
  var months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  var d = new Date(dateStr);
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
  var pageMargin = opts.pageMargin || "8mm 8mm 8mm 15mm";
  var pageWidth  = opts.pageWidth  || "262mm";
  var showDesc2Parens = opts.showDesc2Parens === true;
  var folder = DriveApp.getFolderById(CONFIG.invoiceFolderId);
  var cfg    = getConfig();
  var co     = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var coNameEN = co.nameEN || "KIMCHIANG LIMITED PARTNERSHIP";
  var coAddr   = co.address || "";
  var coTel    = co.tel     || "";
  var coTaxId  = co.taxId   || "";
  var items  = data.items || [];
  var sub    = 0;
  for (var i = 0; i < items.length; i++) sub += parseFloat(items[i].amount) || 0;
  var vat   = parseFloat((sub * 0.07).toFixed(2));
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
      "<td style=\"" + bdr + "color:#181818;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:38mm;flex-shrink:0;white-space:nowrap;overflow:hidden\">" + descLeft + "</div><div style=\"flex:1;white-space:nowrap;overflow:hidden\">" + descRight + "</div></div></td>" +
      "<td style=\"" + bdr + "text-align:center;color:#181818\">" + (it.qty||"") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;color:#181818\">" + (it.unitPrice ? parseFloat(it.unitPrice).toLocaleString("th-TH") : "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;font-weight:500;color:#181818\">" + (b > 0 ? b.toLocaleString("th-TH") : "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;color:#181818\">" + (b > 0 ? (s > 0 ? String(s).padStart(2,"0") : "00") : "") + "</td></tr>";
    rowCount++;
    for (var j = 1; j < parts.length; j++) {
      if (parts[j]) {
        var contBdr = j === lastContIdx ? "" : "border-bottom:none;";
        itemRows += "<tr style=\"background:" + (even?"white":"#fafbff") + "\">" +
          "<td style=\"" + contBdr + "color:#181818;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:38mm;flex-shrink:0\"></div><div style=\"flex:1;white-space:nowrap;overflow:hidden\">" + parts[j] + "</div></div></td>" +
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
    return "<div class=\"half\">" +
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
    ".page{background:white;width:" + pageWidth + ";min-height:182mm;display:flex;gap:5.4mm;padding:3.2mm 0 0 0}" +
    ".page-break{page-break-after:always}" +
    ".half{flex:1;min-width:0;display:flex;flex-direction:column}" +
    ".divider{width:0.3mm;background:#ccc;flex-shrink:0}" +
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
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(TAX_INVOICE_SHEET);
  if (!sheet) throw new Error("ไม่พบ sheet '" + TAX_INVOICE_SHEET + "'");
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

  return { success: true, invoiceNo: invoiceId };
}


// ============================================================
// LANDSCAPE PDF FROM WEB — re-generate tax invoice landscape
// ============================================================

function generateTaxInvoiceLandscapePDFFromWeb(invoiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(TAX_INVOICE_SHEET);
  if (!sheet) throw new Error("ไม่พบ sheet '" + TAX_INVOICE_SHEET + "'");

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
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(TAX_INVOICE_SHEET);
  if (!sheet) throw new Error("ไม่พบ sheet '" + TAX_INVOICE_SHEET + "'");

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
  var folder = DriveApp.getFolderById(CONFIG.invoiceFolderId);
  var cfg    = getConfig();
  var co     = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var coNameEN = co.nameEN || "KIMCHIANG LIMITED PARTNERSHIP";
  var coAddr   = co.address || "";
  var coTel    = co.tel     || "";
  var coTaxId  = co.taxId   || "";
  var am = coAddr.match(/^(.*?)\s*(จังหวัด.*)/);
  var addrLine1 = am ? am[1].trim() : coAddr.trim();
  var addrLine2 = am ? am[2].trim() : '';
  var items  = data.items || [];
  var sub    = 0;
  for (var i = 0; i < items.length; i++) sub += parseFloat(items[i].amount) || 0;
  var vat   = parseFloat((sub * 0.07).toFixed(2));
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
      "<td style=\"" + bdr + "color:#181818;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:49mm;flex-shrink:0;white-space:nowrap;overflow:hidden\">" + descLeft + "</div><div style=\"flex:1;white-space:nowrap;overflow:hidden\">" + descRight + "</div></div></td>" +
      "<td style=\"" + bdr + "text-align:center;color:#181818\">" + (it.qty || "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;color:#181818\">" + (it.unitPrice ? parseFloat(it.unitPrice).toLocaleString("th-TH") : "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;font-weight:500;color:#181818\">" + (b > 0 ? b.toLocaleString("th-TH") : "") + "</td>" +
      "<td style=\"" + bdr + "text-align:right;color:#181818\">" + (b > 0 ? (s > 0 ? String(s).padStart(2, "0") : "00") : "") + "</td></tr>";
    rowCount++;
    for (var j = 1; j < parts.length; j++) {
      if (parts[j]) {
        var contBdr = j === lastContIdx ? "" : "border-bottom:none;";
        itemRows += "<tr style=\"background:" + (even ? "white" : "#fafbff") + "\">" +
          "<td style=\"" + contBdr + "color:#181818;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:49mm;flex-shrink:0\"></div><div style=\"flex:1;white-space:nowrap;overflow:hidden\">" + parts[j] + "</div></div></td>" +
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
  var folder = DriveApp.getFolderById(CONFIG.invoiceFolderId);
  var cfg    = getConfig();
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
      "<td style=\"padding:0.9mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:38mm;flex-shrink:0;white-space:nowrap;overflow:hidden\">" + descLeft + "</div><div style=\"flex:1;white-space:nowrap;overflow:hidden\">" + descRight + "</div></div></td>" +
      "<td style=\"padding:0.9mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;text-align:center\">" + (it.qty || "") + "</td>" +
      "<td style=\"padding:0.9mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;text-align:right\">" + (it.unitPrice ? parseFloat(it.unitPrice).toLocaleString("th-TH", {minimumFractionDigits:2}) : "") + "</td>" +
      "<td style=\"padding:0.9mm 1.5mm;" + bdr + "text-align:right;font-weight:500\">" + (it.amount ? fmt(it.amount) : "") + "</td>" +
      "</tr>";
    rowCount++;
    for (var j = 1; j < parts.length; j++) {
      if (parts[j]) {
        var contBdr = j === lastContIdx ? "border-bottom:0.2mm solid #e0e0e0;" : "";
        itemRows += "<tr style=\"background:" + (even ? "white" : "#f8f8f8") + "\">" +
          "<td style=\"padding:0.9mm 1.5mm;" + contBdr + "border-right:0.1mm solid #e0e0e0;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:38mm;flex-shrink:0\"></div><div style=\"flex:1;white-space:nowrap;overflow:hidden\">" + parts[j] + "</div></div></td>" +
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
    var coNameEN  = co.nameEN || "KIMCHIANG LIMITED PARTNERSHIP";
    return "<div class=\"half\">" +
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
    "@page{size:A4 landscape;margin:12mm 9mm 9mm 9mm}" +
    ".page{width:277mm;display:flex;gap:6mm;padding-top:6mm}" +
    ".half{flex:1;min-width:0;display:flex;flex-direction:column}" +
    ".vdivider{width:0.3mm;background:#ccc;flex-shrink:0}" +
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
  var folder = DriveApp.getFolderById(CONFIG.invoiceFolderId);
  var cfg    = getConfig();
  var co     = cfg.company || {};
  var coName   = co.name   || "หจก. โรงงานกิมเชียง";
  var coNameEN = co.nameEN || "KIMCHIANG LIMITED PARTNERSHIP";
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
      "<td style=\"padding:1.2mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:44mm;flex-shrink:0;white-space:nowrap;overflow:hidden\">" + descLeft + "</div><div style=\"flex:1;white-space:nowrap;overflow:hidden\">" + descRight + "</div></div></td>" +
      "<td style=\"padding:1.2mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;text-align:center\">" + (it.qty || "") + "</td>" +
      "<td style=\"padding:1.2mm 1.5mm;" + bdr + "border-right:0.1mm solid #e0e0e0;text-align:right\">" + (it.unitPrice ? parseFloat(it.unitPrice).toLocaleString("th-TH", {minimumFractionDigits:2}) : "") + "</td>" +
      "<td style=\"padding:1.2mm 1.5mm;" + bdr + "text-align:right;font-weight:500\">" + (it.amount ? fmt(it.amount) : "") + "</td>" +
      "</tr>";
    rowCount++;
    for (var j = 1; j < parts.length; j++) {
      if (parts[j]) {
        var contBdr = j === lastContIdx ? "border-bottom:0.2mm solid #e0e0e0;" : "";
        itemRows += "<tr style=\"background:" + (even ? "white" : "#f8f8f8") + "\">" +
          "<td style=\"padding:1.2mm 1.5mm;" + contBdr + "border-right:0.1mm solid #e0e0e0;overflow:hidden\"><div style=\"display:flex\"><div style=\"width:44mm;flex-shrink:0\"></div><div style=\"flex:1;white-space:nowrap;overflow:hidden\">" + parts[j] + "</div></div></td>" +
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
// TEST FUNCTIONS — run from Apps Script editor, all use hardcoded mock data (no sheet reads/writes)
//
// Workflow:
//   1. All template changes go into the *Test() variant first (via opts parameter)
//   2. Run *Test() → verify PDF output looks correct
//   3. Only after confirmed → apply the change to the original builder and deploy
//
// Pattern:
//   test[Format]()              = original / production behavior (no opts override)
//   stagingTest[Format]()       = staging variant for layout experiments (opts applied)
// ============================================================

// Delivery note portrait PDF (2 pages: ต้นฉบับ + สำเนา, A4 portrait)
function testDeliveryNotePortrait() {
  var invoiceNo = "DN-TEST-002";
  var name = "ตงเชิง";
  var data = {
    date: "2026-06-05",
    name: name,
    address: "",
    phone: "",
    items: [
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                    qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                    qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส", qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",          qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                  qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                      qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1, unitPrice: 2590, amount: 2590 }
    ]
  };
  Logger.log("Testing delivery note portrait: " + invoiceNo);
  var pdfUrl = buildDeliveryNotePortraitPDF(invoiceNo, name, data);
  Logger.log(pdfUrl);
}

// TEST ONLY — same data as testDeliveryNotePortrait but without () around desc2 (size) for layout comparison
function stagingTestDeliveryNotePortrait() {
  var invoiceNo = "DN-TEST-002";
  var name = "ตงเชิง";
  var data = {
    date: "2026-06-05",
    name: name,
    address: "",
    phone: "",
    items: [
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                    qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                    qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส", qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",          qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                  qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                      qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1, unitPrice: 2590, amount: 2590 }
    ]
  };
  Logger.log("Testing delivery note portrait (no parens): " + invoiceNo);
  var pdfUrl = buildDeliveryNotePortraitPDF(invoiceNo, name, data, { showDesc2Parens: false });
  Logger.log(pdfUrl);
}

// Delivery note landscape PDF (2 copies side-by-side, A4 landscape)
function testDeliveryNoteLandscape() {
  var invoiceNo = "DN-TEST-002";
  var name = "ตงเชิง";
  var data = {
    date: "2026-06-05",
    name: name,
    address: "",
    phone: "",
    items: [
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                    qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                    qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส", qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",          qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                  qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                      qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1, unitPrice: 2590, amount: 2590 }
    ]
  };
  Logger.log("Testing delivery note landscape: " + invoiceNo);
  var pdfUrl = buildDeliveryNoteLandscapePDF(invoiceNo, name, data);
  Logger.log(pdfUrl);
}

// TEST ONLY — same data as testDeliveryNoteLandscape but without () around desc2 (size) for layout comparison
function stagingTestDeliveryNoteLandscape() {
  var invoiceNo = "DN-TEST-002";
  var name = "ตงเชิง";
  var data = {
    date: "2026-06-05",
    name: name,
    address: "",
    phone: "",
    items: [
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                    qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                    qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส", qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",          qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                  qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                      qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1, unitPrice: 2590, amount: 2590 }
    ]
  };
  Logger.log("Testing delivery note landscape (no parens): " + invoiceNo);
  var pdfUrl = buildDeliveryNoteLandscapePDF(invoiceNo, name, data, { showDesc2Parens: false });
  Logger.log(pdfUrl);
}

// Tax invoice landscape PDF (2 copies side-by-side, A4 landscape) — uses hardcoded mock data, no sheet required
function testTaxInvoiceLandscape() {
  var invoiceNo = "IV-26-000099";
  var name = "ตงเชิง";
  var data = {
    date: "2026-06-05",
    name: name,
    address: "",
    phone: "",
    taxId: "",
    invoiceRef: "DN-TEST-002",
    items: [
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                       qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                        qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส", qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",              qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                     qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                          qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1,  unitPrice: 2590, amount: 2590  }
    ]
  };
  Logger.log("Testing tax invoice landscape: " + invoiceNo);
  var pdfUrl = buildTaxInvoiceLandscapePDF(invoiceNo, name, data);
  Logger.log(pdfUrl);
}

// TEST ONLY — same data as testTaxInvoiceLandscape but without () around desc2 (size) for layout comparison
function stagingTestTaxInvoiceLandscape() {
  var invoiceNo = "IV-26-000099";
  var name = "ตงเชิง";
  var data = {
    date: "2026-06-05",
    name: name,
    address: "",
    phone: "",
    taxId: "",
    invoiceRef: "DN-TEST-002",
    items: [
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                       qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                        qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส", qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",              qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                     qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                          qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1,  unitPrice: 2590, amount: 2590  }
    ]
  };
  Logger.log("Testing TI landscape (no parens): " + invoiceNo);
  var pdfUrl = buildTaxInvoiceLandscapePDF(invoiceNo, name, data, { showDesc2Parens: false });
  Logger.log(pdfUrl);
}

// Tax invoice portrait PDF (4 pages: tax+receipt x ต้นฉบับ+สำเนา) — uses hardcoded mock data, no sheet required
function testTaxInvoicePortrait() {
  var invoiceNo = "IV-26-000039";
  var name = "ตงเชิง";
  var data = {
    date: "2026-06-05",
    name: name,
    address: "",
    phone: "",
    taxId: "",
    invoiceRef: "DN-TEST-002",
    items: [
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                       qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                        qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส", qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",              qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                     qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                          qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1,  unitPrice: 2590, amount: 2590  }
    ]
  };
  Logger.log("Testing tax invoice portrait: " + invoiceNo);
  var pdfUrl = buildTaxInvoicePortraitPDF(invoiceNo, name, data);
  Logger.log(pdfUrl);
}

// TEST ONLY — same data as testTaxInvoicePortrait but without () around desc2 (size) for layout comparison
function stagingTestTaxInvoicePortrait() {
  var invoiceNo = "IV-26-000039";
  var name = "ตงเชิง";
  var data = {
    date: "2026-06-05",
    name: name,
    address: "",
    phone: "",
    taxId: "",
    invoiceRef: "DN-TEST-002",
    items: [
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                       qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                        qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส", qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",              qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                     qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                          qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1,  unitPrice: 2590, amount: 2590  }
    ]
  };
  Logger.log("Testing tax invoice portrait (no parens, alt headers): " + invoiceNo);
  var pdfUrl = buildTaxInvoicePortraitPDF(invoiceNo, name, data, { showDesc2Parens: false, altHeaders: true });
  Logger.log(pdfUrl);
}
