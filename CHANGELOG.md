# KC Factory — Code.gs Changelog (archived)

Full version history archived from Code.gs header on 2026-06-19 (#45). Detailed per-session history lives in the KC_Daily_Progress docs. Newest first.

Version: 1.4.192 — #107 Combined BN print: extract bnPortrait/LandscapePageHTML + bnPortrait/LandscapeCSS from builders (output identical); add printCombinedBillingNotes(bnNos, format) → one PDF w/ page-breaks + router case
Version: 1.4.191 — #106 BN print queue persistence: getBillingNotes returns printed flag (col K); add markBillingNotesPrinted(bnNos) + router case
Version: 1.4.190 — #97 Add router cases: getDNDetail, cancelBillingNote, getUnbilledDNsForCustomer, editBillingNote
Version: 1.4.189 — #97 Add getDNDetail(), cancelBillingNote(), getUnbilledDNsForCustomer(), editBillingNote() functions
Version: 1.4.188 — #97 Fix getBillingNoteDetail: proper date format + address/phone pickup from Invoice History + cancelled field from col J
Version: 1.4.187 — #97 Fix getBillingNotes: proper Utilities.formatDate for date col + cancelled field from BN History col J
Version: 1.4.186 — #93 Add getBillingNoteDetail(bnNo): reads BN History for header + Invoice History col Q for DN list; router case "getBillingNoteDetail"
Version: 1.4.185 — #90 Fix bnNo/customerName in PDF builder bodies (rename missed 4 body references — root cause of "bnNo is not defined" error on BN create)
Version: 1.4.184 — #89 Rename for consistency: getBNHistory→getBillingNotes, getNextBNNumber→getNextBillingNoteNumber, buildBillingNote*PDF params bnNo/customerName→invoiceNo/name; router case updated
Version: 1.4.183 — #88 Dead code removal: onOpen(), openBillingNoteSidebar(), parseBNDate(), previewBillingNote(), _confirmBillingNote_LEGACY_DO_NOT_USE(), router case "previewBillingNote"
Version: 1.4.182 — #87 Link DN→BN: searchDeliveryNotesForBilling() fix field invoiceNo→no + read col Q (bnNo per invoice) + accurate generated flag; confirmBillingNote() marks billed DNs in Invoice History col Q
Version: 1.4.181 — #85 BN format selector: confirmBillingNote() accepts format param; branches to buildBillingNoteLandscapePDF or buildBillingNotePortraitPDF; router passes params.format
Version: 1.4.180 — #12 BN landscape: promote to live — update stagingTestBillingNoteLandscape experiment log
Version: 1.4.179 — #12 BN both: # col color match main text (remove #999); landscape: baht text 2.7→3mm, footer gap 2→4mm
Version: 1.4.178 — #12 BN landscape: restore สต. column — split amt into บาท+สต. per row; colgroup 6 cols; footer total colspan=2 merged
Version: 1.4.177 — #12 BN portrait: สต. col color fixed — remove #888, match main amount color
Version: 1.4.176 — #12 BN portrait: restore สต. column — split amt into บาท+สต. per row; colgroup 6 cols; footer total colspan=2 merged as fmt(total)
Version: 1.4.175 — #12 BN landscape: buildBillingNoteLandscapePDF() — center-lock 151.5mm, 1-page A4 landscape, ต้นฉบับ+สำเนา, 10 rows 6mm, black #111 style; testBillingNoteLandscape + stagingTestBillingNoteLandscape added
Version: 1.4.174 — #12 BN portrait: footer font sizes matched to customer info section (3.5mm Thai / 3mm English)
Version: 1.4.173 — #12 BN portrait: footer Option C — top rule + open acknowledgment text + signature lines (no box)
Version: 1.4.172 — #12 BN portrait: footer replaced — acknowledgment text + ผู้รับบิล/ให้มาติดต่อรับเงินวันที่, no bill issuer
Version: 1.4.171 — #12 BN portrait: all 10 item rows fixed height:7mm so empty rows don't collapse
Version: 1.4.170 — #12 BN portrait: empty item rows show no row number (blank # cell)
Version: 1.4.169 — #12 BN portrait: header BN number top-aligned with company name (align-items:flex-start, remove margin-top:auto); เลขที่บิล col explicit 74mm (~2/5 of 186mm table); จำนวนเงิน col takes remainder; staging address updated for wrap test
Version: 1.4.168 — #12 BN redesign: buildBillingNotePortraitPDF() HTML PDF builder (matches DN portrait style — black KC logo, #111 table header, 10 fixed rows, ครบกำหนด col blank for handwriting, Prompt font); confirmBillingNote() refactored to accept invoices array + bnDate/address/phone, builds HTML PDF, stores dnNos comma-separated in BN History col I; router updated; no BN Template sheet dependency
Version: 1.4.167 — #72 product CRUD: getProducts() returns [{type,value,row}] for all Config_Products rows; updateProduct(row,value) edits col B; deleteProduct(row) hard-deletes row; router cases added
Version: 1.4.166 — #60 customer soft-delete: deleteCustomer() writes "ลบแล้ว" to หมายเหตุ col instead of hard-deleting row; getCustomers() filters out soft-deleted rows; createCustomer() uniqueness check skips soft-deleted rows
Version: 1.4.165 — #71 addProduct(name): appends ["product", name] to Config_Products sheet; router case "addProduct"
Version: 1.4.164 — #73 getConfig() now reads products/sizes exclusively from Config_Products via getProductConfig(); removed product/size rows from Config sheet seed and saveConfig()
Version: 1.4.163 — #70 Config restructure: extractFolderId_() helper; getConfig() reads folderDN/folderTI/folderBN from Config sheet; getProductConfig() reads Config_Products sheet; all 5 PDF builders use cfg.folders.dn/.ti/.bn; remove invoiceFolderId/bnFolderId from CONFIG
Version: 1.4.162 — refactor batch #61–#69: VAT_RATE top-level const + vatRate in getConfig() + cfg.vatRate in PDF builders; remove TAX_INVOICE_SHEET/CUSTOMER_SHEET standalone vars → CONFIG.tiSheet/CONFIG.customerSheet; remove hardcoded EN company name fallback → co.nameEN || ""
Version: 1.4.161 — #55 PDF desc column overflow: add min-width:0 to all flex:1 detail divs in all 4 PDF builders so overflow:hidden clips correctly in GAS renderer
Version: 1.4.160 — #52 auto-log customer on invoice save: autoLogCustomer_() silently upserts into Customers sheet; called from createDeliveryNoteFromWeb, updateDeliveryNoteFromWeb, createTaxInvoiceFromWeb, updateTaxInvoiceFromWeb
Version: 1.4.159 — #51 customer list: CONFIG.customerSheet "Customers", getCustomers/createCustomer/updateCustomer/deleteCustomer (name as key, auto-create sheet with header); 4 router cases
Version: 1.4.158 — fix getAppVersion() hardcoded to 1.4.156 (never bumped); now returns 1.4.157→1.4.158; add Logger.log so GAS editor Run shows version in Execution log
Version: 1.4.157 — #6 soft cancel: cancelDeliveryNote/restoreDeliveryNote (col P), cancelTaxInvoice/restoreTaxInvoice (col R), getCancelledDeliveryNotes, getCancelledTaxInvoices; getDeliveryNotes+getTaxInvoices skip cancelled rows
Version: 1.4.156 — add getAppVersion() + router case "getVersion"; shows Code.gs version in web app footer
Version: 1.4.155 — DN landscape: promote center-lock to live (centerLock default true, leftHalfWidth 151.5mm, pagePaddingTop 10mm, innerGapL 5mm, innerGapR 9mm) (#46)
Version: 1.4.154 — DN landscape staging: pagePaddingTop 6→10mm (restore top spacing to 18mm total)
Version: 1.4.153 — DN landscape: add centerLock opt + stagingTestDeliveryNoteLandscapeCenterLock() (#46)
Version: 1.4.152 — TI landscape: promote gap balance to live (outerLeft:13mm, outerRight:2mm, innerGapL:5mm, innerGapR:9mm)
Version: 1.4.151 — TI landscape staging: outerLeft:13mm, innerGapL:5mm (address text clearance +0.5mm, divider holds 151.5mm)
Version: 1.4.150 — TI landscape staging: outerLeft:12.5mm, innerGapL:5.5mm (logo clearance +1mm, divider holds 151.5mm)
Version: 1.4.149 — TI landscape staging: split innerGapL/innerGapR opts; outerLeft:11.5mm, innerGapL:6.5mm, right side unchanged
Version: 1.4.148 — TI landscape staging: gap balance test (outerLeft 15→9, innerGap 3→9, outerRight 8→2)
Version: 1.4.147 — TI landscape: promote center-lock to live (centerLock default true, pageMargin 0, leftHalfWidth frozen 151.5mm) (#43)
Version: 1.4.146 — TI landscape staging: leftHalfWidth 154.5→151.5mm (overshot; 1:1 ratio for flex width)
Version: 1.4.145 — TI landscape: leftHalfWidth opt; staging tests 154.5mm (divider 3mm left × 2:1 ratio)
Version: 1.4.144 — TI landscape: divider color #aaa → #ddd (match header bottom border)
Version: 1.4.143 — TI landscape: divider solid 0.3mm grey → dotted 0.5mm #aaa (border-left)
Version: 1.4.142 — add centerLock opt to buildTaxInvoiceLandscapePDF (outerLeft/outerRight/innerGap); add stagingTestTaxInvoiceLandscapeCenterLock() (#43)
Version: 1.4.141 — staging workflow: each opts change = version bump + log entry; full experiment log added to stagingTestTaxInvoiceLandscape()
Version: 1.4.140 — add experiment log comment to stagingTestTaxInvoiceLandscape(); add per-stagingTest log rule to workflow comment block
Version: 1.4.139 — update staging workflow comment block: clarify approve-before-promote rule; staging may be identical to live when no experiment in progress
Version: 1.4.138 — stagingTestCenterLine: padding-left 129.35→130.35mm (+1mm; ~half "m" width off from paper center)
Version: 1.4.137 — stagingTestCenterLine: drop position:absolute (unsupported in GAS PDF); use padding-left:129.35mm on text chars instead
Version: 1.4.136 — stagingTestCenterLine: fix line not visible — width 0.5mm→2mm, background→background-color:red
Version: 1.4.135 — add stagingTestCenterLine(): generates PDF with vertical line at 129.35mm from .page left to verify paper center
Version: 1.4.134 — TI landscape: promote to live — pageMarginLeft default 0→1.2mm, pagePaddingTop default 3.2→10mm; fixes #40/#41/#42 (top edge, cut line centering, inner edge balance)
Version: 1.4.133 — stagingTestTaxInvoiceLandscape: pageMarginLeft 3.5→1.2mm (−2.33mm; 1 "0"-width shift based on 7mm=3"0"s empirical ratio)
Version: 1.4.132 — stagingTestTaxInvoiceLandscape: pageMarginLeft 10.5→3.5mm (−7mm; empirical 2:1 ratio to shift divider from middle of สต. to right edge = paper center)
Version: 1.4.131 — stagingTestTaxInvoiceLandscape: pageMarginLeft 17.5→10.5mm (shift .page left 7mm to align cut divider with true paper center 148.5mm)
Version: 1.4.130 — TI landscape: add pageMarginLeft opt; stagingTest uses pageMarginLeft:17.5mm (centers 262mm on A4 297mm) + pagePaddingTop:10mm to fix #40/#41/#42
Version: 1.4.129 — TI landscape: add pagePaddingTop opt (default 3.2mm); stagingTestTaxInvoiceLandscape uses symmetric pageMargin 8mm + pagePaddingTop 6mm to fix #40/#41/#42
Version: 1.4.128 — promote staging to live: showDesc2Parens default→false (all 4 builders), altHeaders default→true (TI portrait); no parens on size, portrait headers nowrap
Version: 1.4.127 — rename all staging test functions: test[Format]Test() → stagingTest[Format](); update comment block pattern description
Version: 1.4.126 — TI portrait: add altHeaders opt — "หน่วยละ" + white-space:nowrap on TH + colgroup col3:20→16mm, col4:18→20mm, col5:7→11mm; stagingTestTaxInvoicePortrait uses altHeaders:true
Version: 1.4.125 — add workflow comment block above test functions explaining *Test() staging pattern
Version: 1.4.124 — rename testTaxInvoiceLandscapeMarginTest → testTaxInvoiceLandscapeTest; drop margin opts, use showDesc2Parens:false to match pattern of other *Test() functions
Version: 1.4.123 — DN portrait + TI portrait: add opts param (showDesc2Parens); add testDeliveryNotePortraitTest() and testTaxInvoicePortraitTest() with showDesc2Parens:false
Version: 1.4.122 — all test functions: remove "PDF URL: " prefix from Logger.log so URL is directly copyable
Version: 1.4.121 — TI landscape + TI portrait: add showDesc2Parens to opts (default true); TI portrait: add opts param
Version: 1.4.120 — DN landscape: add opts param (showDesc2Parens) to buildDeliveryNoteLandscapePDF; add testDeliveryNoteLandscapeTest() with showDesc2Parens:false for layout comparison
Version: 1.4.119 — TI landscape: add opts param (pageMargin, pageWidth) to buildTaxInvoiceLandscapePDF; add testTaxInvoiceLandscapeMarginTest() with 9mm symmetric margin for side-by-side comparison
Version: 1.4.118 — TI landscape: field-value + field-sub font 3.5→3mm
Version: 1.4.117 — TI landscape: font 3→2.5mm, colgroup ราคาหน่วยละ col 20→16mm, header "ราคาหน่วยละ"→"หน่วยละ"; TI landscape + TI portrait: fix border suppression — CSS class requires border-bottom:none inline override (reversed bdr/contBdr logic vs DN builders)
Version: 1.4.116 — portrait left block width scaled by font size: DN portrait 38→44mm (font 3.5mm vs 3mm), TI portrait 38→49mm (font 3.9mm vs 3mm); prevents desc+desc2 clipping into detail text
Version: 1.4.115 — all 4 PDF builders: remove horizontal border within the same product group; border only on last row of each group (main row if no cont, last cont row); border-right preserved on DN builders
Version: 1.4.114 — all 4 PDF builders: alternating row color now keyed by product index (i) not rowCount; continuation rows share their parent product's background color
Version: 1.4.113 — all 4 PDF builders: fixed-width split layout in desc cell — 38mm left block for desc+desc2, flex:1 right block for detail text; cont rows use same 38mm empty left block so detail always aligns; removes variable-indent problem
Version: 1.4.112 — add table-layout:fixed to all 4 PDF builders so white-space:nowrap clips at column boundary instead of stretching the table; fixes horizontal template expansion from long continuation text
Version: 1.4.111 — PDF continuation row style: remove ↳ arrow, remove () around cont text, add padding-left:5mm indent, white-space:nowrap;overflow:hidden on desc TDs (all 4 builders); () now wraps desc2 (size) not detail; fix filledItems filter for TI portrait; apply cont row split to TI portrait
Updated: 2026-06-12
Changelog:
  1.4.109 - filledItems filter: add desc2||detail condition (was desc||qty||amount only) — continuation rows with only detail text were silently dropped on save
  1.4.108 - All grid lines unified to #e0e0e0 (was #eee TI / #e0e0e0 DN / #ccc vertical); TI landscape th font 3.4→3mm, td font 3.5→3mm (uniform, remove td:first-child override); colgroup 16+19+16+7→16+20+18+7mm; mock customer name → บจ.นูเบบ (ประเทศไทย)
  1.4.107 - Revert to border-right on td/th + :last-child{border-right:none} for all 4 formats; removes rightmost border; TI landscape colgroup narrowed to 16+19+16+7mm (description gains ~11mm); td:first-child font-size:3mm kept
  1.4.104 - Vertical lines via background-image gradient (not border) — zero layout impact; removes table-layout:fixed from TI landscape + DN portrait
  1.4.103 - TI landscape table font: body 3.2→3mm, header 3→2.8mm to reduce wrapping
  1.4.102 - Switch to border-left on non-description columns (description column has no border, cannot affect its width)
  1.4.101 - Add table-layout:fixed to TI landscape + DN portrait tables to stabilize column widths
  1.4.100 - Column lines 0.15→0.1mm; add :last-child rules to remove rightmost border on TI portrait
  1.4.99  - Fix footnote overflow: switch td border from all-sides to border-right only (no height added); 0.2→0.15mm; add TI portrait vertical lines
  1.4.98  - Add vertical column lines to DN landscape/portrait + TI landscape tables; all 5 PDF URLs /preview→/view for in-browser printing
  1.4.97  - DN portrait font: เลขที่ 3mm, invoice no 3.5mm, customer info 3.5mm, ยอดรวม 3.5mm, baht 4mm, sig labels 3.5mm, sender 4mm, footer 3.5mm
  1.4.95  - PDF caching: landscape generate functions write URL back to sheet (col 13 DN / col 14 TI); edit clears both landscape + portrait URLs
  1.4.94  - DN portrait font: scale up to match landscape (table 3.5mm, company 4.5mm, info 3.2mm, total 4mm); portrait URL persistence
  1.4.93  - Portrait URL persistence: generate functions save to col 15 (DN) / col 17 (TI); load functions return portraitUrl; edit clears it
  1.4.92  - Edit log: use _logAdded/_logDeleted from frontend in both update functions — shows actual add/delete counts instead of net
  1.4.91 - Auto-extend sheet rows before batch write in createDeliveryNoteFromWeb + createTaxInvoiceFromWeb (safe to delete empty rows now)
  1.4.90 - Fix row 100696 bug: createDeliveryNoteFromWeb uses getLastNonEmptyRow (getLastRow() was inflated by formulas/formatting); fix getDeliveryNotes, getTaxInvoices, getNextTaxInvoiceNumber, createTaxInvoiceFromWeb (batch writes + firstWriteRow), all PDF-from-web functions — all use getLastNonEmptyRow instead of getDataRange()
  1.4.89 - Fix sheet reads: use getLastRow() instead of getDataRange() — sheet had 100k formatted rows causing writes at wrong row
  1.4.88 - Fix createDeliveryNoteFromWeb: lastDataRow scans col A instead of using histRows.length (trailing empty rows caused writes to wrong row)
  1.4.87 - Performance: createDeliveryNoteFromWeb single read + lock + batch write; updateDeliveryNoteFromWeb + updateTaxInvoiceFromWeb batch delete/update/insert, remove second sheet read
  1.4.86 - Edit log: detect header changes (แก้ไขข้อมูล) and row value changes (แก้ไขรายการ) in both update functions
  1.4.85 - Edit log: descriptive changes (เพิ่ม N แถว / ลบ: ... / แก้ไข) in both update functions
  1.4.84 - Fix router: createDeliveryNote→createDeliveryNoteFromWeb, updateDeliveryNote→updateDeliveryNoteFromWeb (were still calling old names)
  1.4.83 - Edit log for deleted rows in updateTaxInvoiceFromWeb (col P)
  1.4.82 - #25+#28: rename router cases getInvoices→getDeliveryNotes, createInvoice→createDeliveryNote, updateInvoice→updateDeliveryNote, searchInvoices→searchDeliveryNotes
  1.4.81 - #28: rename router case strings to match frontend (generateTaxInvoicePortraitPDF, generateDeliveryNoteLandscapePDF, generateDeliveryNotePortraitPDF)
  1.4.80 - Fix tax invoice PDF filenames: landscape KC_TaxInvoice_→KC_TaxInvoice_L_, portrait KC_Invoice_→KC_TaxInvoice_P_
  1.4.79 - Fix PDF router: revert 3 case strings corrupted by sed rename (buildTaxInvoicePortraitPDF→generatePortraitPDF, buildDeliveryNoteLandscapePDF→generateInvoiceLandscapePDF, buildDeliveryNotePortraitPDF→generateInvoicePortraitPDF); fixes PDF Portrait "nothing happens" bug
  1.4.78 - Fix #21: rewrite updateTaxInvoiceFromWeb — now handles delete/update/insert of item rows (mirroring updateDeliveryNoteFromWeb); cols A–M written per row, N (pdfUrl) and O (formula) left untouched
  1.4.77 - Code cleanup: rename all Invoice→DeliveryNote / generateXxx→buildXxx functions for clarity; delete dead legacy code (saveAndNewInvoice, generateInvoicePDF, testCreateTaxInvoice); test functions now all use hardcoded mock data (no sheet reads)
  1.4.76 - Delivery note landscape: reduce gap above/below baht text row (4mm→2mm) to fix footnote overflow to page 2
  1.4.75 - Delivery note landscape: +1pt (+0.35mm) on all body components (badge 3.9, customer 2.9, th 3.0, td 3.2, ยอดรวม label 3.0, total 3.4, baht label 2.9, baht value 3.2, sig labels 2.9, sig company 3.0, note 2.8)
  1.4.74 - Delivery note landscape: font size pass — เลขที่ 2.3mm, customer box 2.5mm, table header 2.6mm, table body 2.8mm, ยอดรวม label 2.6mm, baht label 2.5mm, baht value 2.8mm, sig labels 2.5mm, sig company 2.6mm; fix (สำเนา) badge vertical-align; fix duplicate font-size on note
  1.4.73 - Delivery note landscape: KC box 12→11mm (font 6.6→6mm), L_ prefix on landscape filename, P_ prefix on portrait filename
  1.4.72 - Delivery note landscape: KC box 14→12mm (font 7.7→6.6mm), TH name 3.1→4mm, EN name 2.2→3mm, fix EN name blank fallback (#8)
  1.4.71 - Landscape: baht-text font 2.8→3.5mm (match customer name)
  1.4.70 - Landscape: baht text vertically centered inside stretched box
  1.4.69 - Landscape: baht text box stretches to match summary height (align-items:stretch + flex:1 on baht-text)
  1.4.68 - Landscape: header min-height 30→32mm
  1.4.67 - Landscape: header min-height 27→30mm (right half still taller)
  1.4.66 - Landscape: slash moved to end of line (Option B); header min-height:27mm so both halves per page align at same row positions
  1.4.65 - Landscape: logo 9→9.5mm to match TH+EN company name block height
  1.4.64 - Landscape: right header col max-width 44→58mm (titles were wrapping past explicit <br> breaks causing 3-4 lines)
  1.4.63 - Landscape: title <br> at each / for controlled 2-line split; right header col max-width:44mm flex-shrink:0; left col flex:1 min-width:0; remove flex:1 from items-table (fixes sig off-page)
  1.4.62 - Landscape: header restructured to match portrait (address at logo level, เลขที่ right+auto, flex header); docTitle/docNote/sigLabel updated to match paper set; white-space:nowrap removed from doc-title
  1.4.61 - testTaxInvoicePortraitPDF: hardcoded 15-item mock data, calls buildTaxInvoicePortraitPDF directly (no sheet needed)
  1.4.60 - Portrait: summary gap 4→8mm between label and amount
  1.4.59 - Portrait: sig-row margin-top 5→15mm; testCreateTaxInvoice expanded to 15 items (full table)
  1.4.58 - Portrait: header min-height:26mm so all pages have consistent header height; เลขที่ always at bottom via margin-top:auto
  1.4.57 - Portrait: header align-items:stretch; summary min-width:65mm; sig 3mm; sig-row margin-top 5mm; note margin-top 1.5mm
  1.4.56 - Portrait: doc-title line-height:1.2 to reduce top gap and align with company name
  1.4.55 - Portrait: logo 9→10mm to match TH+EN name height; summary subtotals 3→3.9mm, total 3.5→4.5mm
  1.4.54 - Portrait: right header div flex-column so เลขที่ always aligns to bottom across all page types
  1.4.53 - Portrait: doc-no font 2.8→3mm (match company name EN)
  1.4.52 - Portrait: blue copy title split to 2 lines; (ไม่ใช่ใบกำกับภาษี) font 2.8→4mm across all pages
  1.4.51 - Portrait: doc titles/notes/sigLabels updated to match original paper set (green/yellow/white/blue); docSub removed
  1.4.50 - Portrait: header restructure (address at logo level, เลขที่ on right), baht text below summary, font bumps (เลขที่ 2.8, subtotals 3, sig 2.8, note 2.8, baht-label 3)
  1.4.49 - Both: remove border from baht-text box
  1.4.48 - Both: margin-bottom between baht+summary and sig row 2mm → 4mm
  1.4.47 - Both: Tel/Fax merged onto addrLine2 row; Portrait: full sync with landscape (header, sigLabels, bottom layout, note font, summary labels)
  1.4.46 - Landscape: sig row moved to full-width row below summary+baht-text; summary inline divs (no table)
  1.4.45 - Landscape: invoice no. → tax ID row; grid layout for bottom (3 rows align: label↔subtotal, box↔VAT, sig↔total); summary 2.5mm compact; sig-row margin fix
  1.4.44 - Landscape: merge bottom section into single flex row (baht+sig left, one summary table right) so widths align; total row border-top in CSS
  1.4.43 - Landscape: address split at จังหวัด (not อำเภอ), tax ID label → เลขประจำตัวผู้เสียภาษีอากร on own line below Tel/Fax
  1.4.42 - Landscape: summary table-layout:auto + white-space:nowrap, remove fixed width so labels never wrap
  1.4.41 - Landscape: sig labels ผู้รับเงิน/ผู้รับของ (remove company name), summary label จำนวนภาษีมูลค่าเพิ่ม, summary font 2.8mm, summary 44→50mm, note font 2.4mm
  1.4.40 - Landscape: address 2-line split, เลขที่ on Tel row, sig row equal width, summary 52→44mm, remove table borders, tighten padding
  1.4.39 - Landscape: customer box field group margin-bottom 2mm → 1.5mm
  1.4.38 - Landscape: table padding 1.4→1mm, baht text 3.7→2.8mm, sender font 3.2→2.4mm (landscape+portrait)
  1.4.37 - buildTaxInvoiceLandscapePDF: table body font 3.9mm → 3.5mm
  1.4.36 - Clean up test functions: remove testFontTimeout, rename all, add testTaxInvoiceLandscapePDF
  1.4.35 - buildTaxInvoiceLandscapePDF: fix extra </div> in half() breaking 2-up landscape layout
  1.4.34 - buildTaxInvoiceLandscapePDF: remove width:0 from .half (fixes one-copy-only landscape render)
  1.4.33 - Move PROMPT_FONT_CSS to Font.gs (separate file)
  1.4.32 - Extract PROMPT_FONT_CSS to global variable (4 copies → 1); file size 737KB → 246KB
  1.4.31 - Tax invoice portrait+landscape: sig-row aligned with total row, KC name 3.2mm, note below
  1.4.30 - testPortraitPDF: auto-pick latest tax invoice from sheet (was hardcoded)
  1.4.29 - Tax invoice portrait+landscape: note size↑, address match name style, baht text size↑, doc-no size match, sender align fix
  1.4.28 - Landscape: logo align with TH+EN only, address postal code same line as อำเภอ
  1.4.27 - Landscape: doc-title/doc-no nowrap, doc-no Prompt font, customer-box wider left column
  1.4.26 - Add generateTaxInvoiceLandscapePDFFromWeb for re-generate landscape from detail page
  1.4.25 - Tax invoice landscape+portrait: add ที่อยู่ label, fix signature to หจก.โรงงานกิมเชียง, fix summary font to Prompt
  1.4.24 - buildTaxInvoiceLandscapePDF + buildTaxInvoicePortraitPDF: switch from Sarabun to Prompt font
  1.4.23 - buildDeliveryNotePortraitPDF: rewrite to match landscape v2 design + Prompt font
  1.4.22 - updateInvoiceFromWeb: write edit log (timestamp+email) to col N
  1.4.21 - createInvoiceFromWeb: remove old PDF gen, add uniqueness check, fix col A; landscape PDF after save
  1.4.20 - createInvoiceFromWeb: invoice no. from History sheet (not K2); updateInvoiceFromWeb: update items
  1.4.19 - all PDF functions: getUrl() → /preview URL to open in Drive viewer
  1.4.18 - buildDeliveryNoteLandscapePDF: สำเนา badge 2.2→3.5mm + วงเล็บ
  1.4.17 - buildDeliveryNoteLandscapePDF: baht tag 1.9→2.3mm, baht text 2.3→2.6mm, remove flex:1 spacer
  1.4.16 - buildDeliveryNoteLandscapePDF: full mockup v2 sync — address layout, sig cleanup, borders removed
  1.4.15 - buildDeliveryNoteLandscapePDF: font size & spacing adjustments per design review
  1.4.14 - buildDeliveryNoteLandscapePDF: embed Prompt font as base64 (thai+latin, 400/500/600/700)
  1.4.13 - buildDeliveryNoteLandscapePDF: remove explicit font → use system font throughout
  1.4.12 - buildDeliveryNoteLandscapePDF: switch font Prompt → Sarabun
  1.4.11 - add testFontTimeout() to diagnose font load timing issue
  1.4.10 - buildDeliveryNoteLandscapePDF: fix font loading @import → <link> for Prompt font
  1.4.9 - buildDeliveryNoteLandscapePDF: modern layout — KC badge, grid customer info, 2-col signature
  1.4.8 - buildDeliveryNoteLandscapePDF: remove min-height:192mm, table headers single-line (match mockup)
  1.4.7 - buildDeliveryNoteLandscapePDF: Prompt font, TH/EN headers same line/size
  1.4.6 - buildDeliveryNoteLandscapePDF: reduce font sizes (3mm→2.5mm) and padding for smaller table
  1.4.5 - testInvoicePDF: search upward for non-empty invoiceId
  1.4.4 - testInvoicePDF: auto-pick latest invoice from Invoice History
  1.4.3 - buildDeliveryNoteLandscapePDF: flex:1 spacer → min-height:10mm to fix large gap
  1.4.2 - buildDeliveryNoteLandscapePDF: rows 15→10 to fit landscape page
  1.4.1 - buildDeliveryNoteLandscapePDF: redesign per mockup v12 (15 rows, new layout, sig padding-bottom 4mm)
  1.4.0 - ใบส่งของ: buildDeliveryNoteLandscapePDF + buildDeliveryNotePortraitPDF (HTML-based)
  1.3.9 - Landscape: combined 2-sheet PDF (tax+receipt), nameEN, เล่มที่/เลขที่
  1.3.8 - buildTaxInvoicePortraitPDF: 4-page PDF (tax+receipt x2), nameEN in header, เล่มที่/เลขที่; add nameEN to getConfig/saveConfig
  1.3.7 - PDF: company info from getConfig() (name/address/tel/taxId); add taxId to getConfig/saveConfig
  1.3.6 - Portrait: fix satang "00" auto-fill (was missing b > 0 check)
  1.2.0 - Add buildTaxInvoicePortraitPDF (portrait A4, 2 pages ต้นฉบับ+สำเนา)
  1.1.9 - PDF: restore font sizes
  1.1.8 - PDF: min-height 170mm→182mm
  1.1.7 - PDF: padding/margin -10% further
  1.1.6 - PDF: padding -10%, testCreateInvoice 10 mock rows
  1.1.5 - PDF: padding -10%, page padding-top 8mm→4mm
  1.1.4 - PDF: revert sig-row font to 2.4mm
  1.1.3 - PDF: all font sizes +0.5mm
  1.1.2 - PDF: restore colgroup + table-layout:auto
  1.1.1 - PDF: remove colgroup (reverted)
  1.1.0 - PDF: page padding-top, items font, sig-row, footer spacing
  1.0.0 - Initial release
