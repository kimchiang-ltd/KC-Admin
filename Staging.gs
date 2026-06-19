// ============================================================
// KC Factory System — Staging.gs
// TEST / STAGING functions — run manually from the Apps Script editor.
// Relocated from Code.gs on 2026-06-19 (#44). Same GAS project = these still
// resolve as globals and call the production builders in Code.gs normally.
// ============================================================

// ============================================================
// TEST FUNCTIONS — run from Apps Script editor, all use hardcoded mock data (no sheet reads/writes)
//
// Workflow:
//   1. Any template change → implement in stagingTest[Format]() first (via opts)
//   2. Run stagingTest → print → verify output is correct
//   3. Get explicit approval → then promote values to live builder defaults
//   Staging may be identical to live when no experiment is in progress — that is fine
//
// Pattern:
//   test[Format]()              = original / production behavior (no opts override)
//   stagingTest[Format]()       = staging variant for layout experiments (opts applied)
//
// Each stagingTest[Format]() must have its own experiment log comment:
//   - every staging opts change = its own version bump + one log entry
//   - log entry format: //   vX.X.XXX: tested [what] — [result/why]
//   - mark promoted entries with → live
//   - mark current active experiment with ← testing
//   - when no experiment in progress: mark as [no active experiment]
// ============================================================

// Billing note portrait PDF (1 page, A4 portrait)
// [no active experiment]
function testBillingNotePortrait() {
  var bnNo = "BN-TEST-001";
  var name = "บริษัท PSK จำกัด";
  var data = {
    date: "2026-06-18",
    name: name,
    address: "25/9 หมู่ 10 ต.บางใหญ่ อ.บางใหญ่ จ.นนทบุรี 11140",
    phone: "02-595-0670",
    invoices: [
      { dnNo: "26-000121", dnDate: "23/04/2026", amount: 40880 },
      { dnNo: "26-000122", dnDate: "23/04/2026", amount: 245940 },
      { dnNo: "26-000124", dnDate: "24/04/2026", amount: 86600 },
      { dnNo: "26-000126", dnDate: "27/04/2026", amount: 930 }
    ],
    total: 374350
  };
  Logger.log("Testing billing note portrait: " + bnNo);
  var pdfUrl = buildBillingNotePortraitPDF(bnNo, name, data);
  Logger.log(pdfUrl);
}

function stagingTestBillingNotePortrait() {
  // Experiment log:
  //   v1.4.169: tested header top-align + เลขที่บิล 74mm col; long address to verify wrap → live
  //   v1.4.170: tested empty row # blank (no number shown) → live
  //   v1.4.171: tested fixed height:7mm on all rows → live
  //   v1.4.172: tested footer — acknowledgment + ผู้รับบิล/ให้มาติดต่อรับเงินวันที่, no issuer → live
  //   v1.4.173: tested footer Option C — top rule, open layout, no box → live
  //   v1.4.174: tested footer font sizes matched to info band (3.5mm/3mm) → live [PORTRAIT FROZEN]
  var bnNo = "BN-STAGING-001";
  var name = "บริษัท PSK จำกัด";
  var data = {
    date: "2026-06-18",
    name: name,
    address: "88/2 หมู่ 5 ถนนบางกรวย-ไทรน้อย ตำบลบางม่วง อำเภอบางใหญ่ จังหวัดนนทบุรี 11140",
    phone: "02-595-0670",
    invoices: [
      { dnNo: "26-000121", dnDate: "23/04/2026", amount: 40880 },
      { dnNo: "26-000122", dnDate: "23/04/2026", amount: 245940 },
      { dnNo: "26-000124", dnDate: "24/04/2026", amount: 86600 },
      { dnNo: "26-000126", dnDate: "27/04/2026", amount: 930 }
    ],
    total: 374350
  };
  Logger.log("Staging billing note portrait: " + bnNo);
  var pdfUrl = buildBillingNotePortraitPDF(bnNo, name, data);
  Logger.log(pdfUrl);
}

// Billing note landscape PDF (1 page, A4 landscape, 2-up: ต้นฉบับ + สำเนา)
function testBillingNoteLandscape() {
  var bnNo = "BN-TEST-002";
  var name = "บริษัท PSK จำกัด";
  var data = {
    date: "2026-06-18",
    name: name,
    address: "88/2 หมู่ 5 ถนนบางกรวย-ไทรน้อย ตำบลบางม่วง อำเภอบางใหญ่ จังหวัดนนทบุรี 11140",
    phone: "02-595-0670",
    invoices: [
      { dnNo: "26-000121", dnDate: "23/04/2026", amount: 40880 },
      { dnNo: "26-000122", dnDate: "23/04/2026", amount: 245940 },
      { dnNo: "26-000124", dnDate: "24/04/2026", amount: 86600 },
      { dnNo: "26-000126", dnDate: "27/04/2026", amount: 930 }
    ],
    total: 374350
  };
  Logger.log("Testing billing note landscape: " + bnNo);
  var pdfUrl = buildBillingNoteLandscapePDF(bnNo, name, data);
  Logger.log(pdfUrl);
}

function stagingTestBillingNoteLandscape() {
  // Experiment log:
  //   v1.4.175: initial landscape builder — center-lock 151.5mm, 10 rows 6mm, black #111 style → live
  //   v1.4.178: restore สต. column — split amt บาท+สต., 6-col table, tfoot colspan=2 → live
  //   v1.4.179: # col color match main text; baht text 2.7→3mm; footer gap 2→4mm → live
  // [no active experiment]
  var bnNo = "BN-STAGING-002";
  var name = "บริษัท PSK จำกัด";
  var data = {
    date: "2026-06-18",
    name: name,
    address: "88/2 หมู่ 5 ถนนบางกรวย-ไทรน้อย ตำบลบางม่วง อำเภอบางใหญ่ จังหวัดนนทบุรี 11140",
    phone: "02-595-0670",
    invoices: [
      { dnNo: "26-000121", dnDate: "23/04/2026", amount: 40880 },
      { dnNo: "26-000122", dnDate: "23/04/2026", amount: 245940 },
      { dnNo: "26-000124", dnDate: "24/04/2026", amount: 86600 },
      { dnNo: "26-000126", dnDate: "27/04/2026", amount: 930 }
    ],
    total: 374350
  };
  Logger.log("Staging billing note landscape: " + bnNo);
  var pdfUrl = buildBillingNoteLandscapePDF(bnNo, name, data);
  Logger.log(pdfUrl);
}

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

// Experiment log — stagingTestDeliveryNoteLandscapeCenterLock:
//   v1.4.153: tested centerLock:true, leftHalfWidth:151.5mm, pagePaddingTop:6mm — content too close to top (8mm @page + 6mm padding = 14mm vs original 18mm)
//   v1.4.154: tested pagePaddingTop:10mm — top spacing correct ✓ → live (v1.4.155)
function stagingTestDeliveryNoteLandscapeCenterLock() {
  var invoiceNo = "DN-TEST-003";
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
  Logger.log("Testing DN landscape center-lock (#46): " + invoiceNo);
  var pdfUrl = buildDeliveryNoteLandscapePDF(invoiceNo, name, data, {
    showDesc2Parens: false,
    centerLock: true,
    leftHalfWidth: "151.5mm",
    pagePaddingTop: "10mm",
    outerLeft: "13mm",
    outerRight: "2mm",
    innerGapL: "5mm",
    innerGapR: "9mm"
  });
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

// TEST ONLY — generates a single vertical line at calculated center (129.35mm from .page left)
// Print and fold paper in half — line should align exactly with fold
function stagingTestCenterLine() {
  var html =
    "<style>" +
    "@page{size:A4 landscape;margin:8mm 8mm 8mm 15mm}" +
    "html,body{margin:0;padding:0;background:white}" +
    ".page{width:262mm;height:190mm;margin-left:1.2mm;padding-top:10mm;box-sizing:border-box}" +
    "p{font-family:sans-serif;font-size:8mm;margin:0;color:red;padding-left:130.35mm;}" +
    "</style>" +
    "<div class='page'>" +
      "<p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p><p>|</p>" +
      "<p style='font-size:3mm;color:#888;padding-left:0'>^ 129.35mm from .page left | pageMarginLeft:1.2mm | pageWidth:262mm</p>" +
    "</div>";

  var cfg = getConfig();
  var folder = DriveApp.getFolderById(cfg.folders.ti || cfg.folders.dn);
  var blob = Utilities.newBlob(html, 'text/html', 'CenterLineTest.html');
  var pdf = blob.getAs('application/pdf');
  var file = folder.createFile(pdf.setName('CenterLineTest.pdf'));
  Logger.log(file.getUrl());
}

// Experiment log — stagingTestTaxInvoiceLandscape:
//   v1.4.129: tested pageMargin symmetric 8mm + pagePaddingTop:6mm — logo cut ❌
//   v1.4.130: tested pageMarginLeft:17.5mm + pagePaddingTop:10mm — divider off center
//   v1.4.131: tested pageMarginLeft:10.5mm — divider still off center
//   v1.4.132: tested pageMarginLeft:3.5mm — divider closer
//   v1.4.133: tested pageMarginLeft:1.2mm — divider at paper center ✓
//   v1.4.134: → live: pageMarginLeft:1.2mm + pagePaddingTop:10mm (#40/#41/#42)
//   [no active experiment] — staging = live defaults, #43 pending
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

// Experiment log — stagingTestTaxInvoiceLandscapeCenterLock:
//   v1.4.142: tested centerLock:true, @page left:0, outerLeft:15mm, outerRight:8mm, innerGap:3mm (#43)
//   v1.4.143: tested dotted divider (border-left:0.5mm dotted #aaa) — color too dark
//   v1.4.144: tested divider color #aaa → #ddd (match header bottom border) → live
//   v1.4.145: tested leftHalfWidth:154.5mm — overshot, divider 3mm RIGHT of center; flex width ratio = 1:1 (not 2:1)
//   v1.4.146: tested leftHalfWidth:151.5mm — divider at paper center ✓ → live
//   v1.4.148: tested gap balance: outerLeft 15→9mm, innerGap 3→9mm (both sides), outerRight 8→2mm — logo clipped
//   v1.4.149: tested outerLeft:11.5mm, innerGapL:6.5mm — logo clear, address text left edge slightly clipped
//   v1.4.150: tested outerLeft:12.5mm, innerGapL:5.5mm — logo clear, lines 2–3 address still clip 1 char
//   v1.4.151: tested outerLeft:13mm, innerGapL:5mm — all text clear ✓ → live (v1.4.152)
function stagingTestTaxInvoiceLandscapeCenterLock() {
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
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 1 คละสี 2",                                          qty: 3,  unitPrice: 2590, amount: 7770  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXL",  detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1",                           qty: 4,  unitPrice: 2155, amount: 8620  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ฟ้า 1 เขียว 1 ขาว 1 คละสี 1 | พรเจริญ ลป. จาก ทีเอส",  qty: 3,  unitPrice: 1900, amount: 5700  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XL",   detail: "ขาว 2 คละสี 8 | นัวอรุณ ซม. จาก ทีเอส",                qty: 10, unitPrice: 1900, amount: 19000 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "L",    detail: "",                                                        qty: 10, unitPrice: 1030, amount: 10300 },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "M",    detail: "เค เอส ระนอง จาก คุณลักษณ์",                             qty: 10, unitPrice: 930,  amount: 9300  },
      { desc: "ซันฟลาวเวอร์  (SF)", desc2: "XXXL", detail: "ฟ้า 3 ซม 2 เขียว 2 ขาว 5 | ชิงหงัวว อ. ฝาง จาก วรพจน์", qty: 1, unitPrice: 2590, amount: 2590  }
    ]
  };
  Logger.log("Testing TI landscape center-lock (#43): " + invoiceNo);
  var pdfUrl = buildTaxInvoiceLandscapePDF(invoiceNo, name, data, {
    showDesc2Parens: false,
    centerLock: true,
    pageMargin: "8mm 8mm 8mm 0",
    outerLeft: "13mm",
    outerRight: "2mm",
    innerGap: "9mm",
    innerGapL: "5mm",
    leftHalfWidth: "151.5mm"
  });
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