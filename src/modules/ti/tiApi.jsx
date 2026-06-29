// ============================================================
// TI Module — API Layer
// Calls TICode.gs (Invoice Admin backend) — separate from KC Admin's Config.gs/Code.gs
// Same backend as standalone Invoice Admin app
// ============================================================

const SCRIPT_URL_TI = "https://script.google.com/macros/s/AKfycbzT_r_hzNLJFFulWDgd9PU_txxmZEOcpLeE_4AVnYeuHoo1B8RF46EhZx1Y-bNJjXnceQ/exec";

const _pendingCalls = {};

async function tiApiCall(action, params = {}) {
  const dedupeKey = action + JSON.stringify(params);
  if (_pendingCalls[dedupeKey]) return _pendingCalls[dedupeKey];

  const url = new URL(SCRIPT_URL_TI);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));
  });

  const promise = fetch(url.toString())
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(json => {
      delete _pendingCalls[dedupeKey];
      if (!json.success) throw new Error(json.error || "API error");
      return json.data;
    })
    .catch(err => {
      delete _pendingCalls[dedupeKey];
      throw err;
    });

  _pendingCalls[dedupeKey] = promise;
  return promise;
}

// ── TI API endpoints ─────────────────────────────────────────
export const tiApi = {
  // TI CRUD
  getTaxInvoices:                  (startDate, endDate, search) => tiApiCall("getTaxInvoices", { startDate, endDate, search }),
  createTaxInvoice:                (data)                       => tiApiCall("createTaxInvoice", { data }),
  updateTaxInvoice:                (id, data)                   => tiApiCall("updateTaxInvoice", { id, data }),
  getTIDetail:                     (tiNo)                       => tiApiCall("getTIDetail", { tiNo }),
  cancelTaxInvoice:                (id)                         => tiApiCall("cancelTaxInvoice", { id }),
  restoreTaxInvoice:               (id)                         => tiApiCall("restoreTaxInvoice", { id }),
  getCancelledTaxInvoices:         (search)                     => tiApiCall("getCancelledTaxInvoices", { search }),
  // TI PDF
  generateTaxInvoicePortraitPDF:   (id)                         => tiApiCall("generateTaxInvoicePortraitPDF", { id }),
  generateTaxInvoiceLandscapePDF:  (id)                         => tiApiCall("generateTaxInvoiceLandscapePDF", { id }),
  // BN-TI
  searchTaxInvoicesForBilling:     (startDate, endDate)          => tiApiCall("searchTaxInvoices", { startDate, endDate }),
  confirmBN:                       (customer, reservedBnNo, invoices, bnDate, address, phone) =>
                                     tiApiCall("confirmBillingNote", { customer, reservedBnNo, invoices, bnDate, address, phone }),
  getBillingNotes:                 ()                            => tiApiCall("getBillingNotes"),
  getBillingNoteDetail:            (bnNo)                        => tiApiCall("getBillingNoteDetail", { bnNo }),
  cancelBillingNote:               (bnNo)                        => tiApiCall("cancelBillingNote", { bnNo }),
  editBillingNote:                 (bnNo, params)                => tiApiCall("editBillingNote", { bnNo, ...params }),
  markBillingNotesPrinted:         (bnNos)                       => tiApiCall("markBillingNotesPrinted", { bnNos }),
  generateBillingNoteLandscapePDF: (bnNo)                        => tiApiCall("generateBillingNoteLandscapePDF", { bnNo }),
  generateBillingNotePortraitPDF:  (bnNo)                        => tiApiCall("generateBillingNotePortraitPDF", { bnNo }),
  printCombinedBillingNotes:       (bnNos, format)               => tiApiCall("printCombinedBillingNotes", { bnNos, format }),
  getUnbilledTIsForCustomer:       (customer)                    => tiApiCall("getUnbilledTIsForCustomer", { customer }),
  // Settings — customer/product (TI-specific, separate from KC Admin)
  getConfig:        ()                            => tiApiCall("getConfig"),
  saveConfig:       (data)                        => tiApiCall("saveConfig", { data }),
  getCustomers:     (search)                      => tiApiCall("getCustomers", { search }),
  createCustomer:   (data)                        => tiApiCall("createCustomer", { data }),
  updateCustomer:   (originalName, data)          => tiApiCall("updateCustomer", { originalName, data }),
  deleteCustomer:   (name)                        => tiApiCall("deleteCustomer", { name }),
  getProducts:      ()                            => tiApiCall("getProducts"),
  addProduct:       (name, type)                  => tiApiCall("addProduct", { name, type }),
  updateProduct:    (row, value)                  => tiApiCall("updateProduct", { row, value }),
  deleteProduct:    (row)                         => tiApiCall("deleteProduct", { row }),
  getVersion:       ()                            => tiApiCall("getVersion"),
};

// ── bahtText — Thai number to text ───────────────────────────
export function bahtText(amount) {
  if (!amount || amount === 0) return "ศูนย์บาทถ้วน";
  const ones   = ["","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"];
  const places = ["","สิบ","ร้อย","พัน","หมื่น","แสน"];
  function rg(n) {
    if (n === 0) return "";
    let r = "", s = String(n).split("").reverse();
    s.forEach((d, i) => {
      const di = parseInt(d);
      if (di === 0) return;
      if      (i === 1 && di === 1) r = "สิบ" + r;
      else if (i === 1 && di === 2) r = "ยี่สิบ" + r;
      else if (i === 0 && di === 1 && s.length > 1) r = "เอ็ด" + r;
      else r = ones[di] + places[i] + r;
    });
    return r;
  }
  const [is, ds] = amount.toFixed(2).split(".");
  const iv = parseInt(is), sv = parseInt(ds);
  let r = iv >= 1000000
    ? rg(Math.floor(iv / 1000000)) + "ล้าน" + (iv % 1000000 > 0 ? rg(iv % 1000000) : "")
    : rg(iv);
  return r + "บาท" + (sv > 0 ? rg(sv) + "สตางค์" : "ถ้วน");
}
