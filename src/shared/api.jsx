// ============================================================
// KC Admin — Shared API Layer
// All calls to Apps Script go through here
// ============================================================

// CONFIG — ใส่ Apps Script URL ที่นี่หลัง Deploy
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxq9fZSwfWpTKiQRkV_yxQnwH5dSlZK5nPkK9agqBIwbXS24KGB7syrUDuat8WFplcGDA/exec";

const _pendingCalls = {};

export async function apiCall(action, params = {}) {
  // Deduplicate — prevent same action firing twice simultaneously
  const dedupeKey = action + JSON.stringify(params);
  if (_pendingCalls[dedupeKey]) return _pendingCalls[dedupeKey];

  const url = new URL(SCRIPT_URL);
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

// Convenience API functions
export const api = {
  getDeliveryNotes:      (startDate, endDate, search) => apiCall("getDeliveryNotes", { startDate, endDate, search }),
  createDeliveryNote:    (data)                        => apiCall("createDeliveryNote", { data }),
  updateDeliveryNote:    (id, data)                    => apiCall("updateDeliveryNote", { id, data }),
  searchDeliveryNotes:   (startDate, endDate)          => apiCall("searchDeliveryNotes", { startDate, endDate }),
  confirmBN:        (customer, reservedBnNo, invoices, bnDate, address, phone) =>
                      apiCall("confirmBillingNote", { customer, reservedBnNo, invoices, bnDate, address, phone }),
  generateBillingNoteLandscapePDF: (bnNo) => apiCall("generateBillingNoteLandscapePDF", { bnNo }),
  generateBillingNotePortraitPDF:  (bnNo) => apiCall("generateBillingNotePortraitPDF",  { bnNo }),
  getBillingNotes:            ()              => apiCall("getBillingNotes"),
  getBillingNoteDetail:       (bnNo)         => apiCall("getBillingNoteDetail", { bnNo }),
  getDNDetail:                (dnNo)         => apiCall("getDNDetail", { dnNo }),
  cancelBillingNote:          (bnNo)         => apiCall("cancelBillingNote", { bnNo }),
  markBillingNotesPrinted:    (bnNos)        => apiCall("markBillingNotesPrinted", { bnNos }),
  printCombinedBillingNotes:  (bnNos, format) => apiCall("printCombinedBillingNotes", { bnNos, format }),
  getUnbilledDNsForCustomer:  (customer)     => apiCall("getUnbilledDNsForCustomer", { customer }),
  editBillingNote:            (bnNo, params) => apiCall("editBillingNote", { bnNo, ...params }),
  getConfig:        ()                            => apiCall("getConfig"),
  saveConfig:       (data)                        => apiCall("saveConfig", { data }),
  addProduct:       (name, type)                  => apiCall("addProduct", { name, type }),
  getProducts:      ()                            => apiCall("getProducts"),
  updateProduct:    (row, value)                  => apiCall("updateProduct", { row, value }),
  deleteProduct:    (row)                         => apiCall("deleteProduct", { row }),
  generateDeliveryNoteLandscapePDF:  (id) => apiCall("generateDeliveryNoteLandscapePDF", { id }),
  generateDeliveryNotePortraitPDF:   (id, includeCopy) => apiCall("generateDeliveryNotePortraitPDF", { id, includeCopy: !!includeCopy }),
  generateQuotationPDF: (data) => apiCall("generateQuotationPDF", data),
  listQuotations:       ()     => apiCall("listQuotations"),
  loadQuotation:        (id)   => apiCall("loadQuotation", { rowId: id }),
  getVersion: () => apiCall("getVersion"),
  // Cancel / restore
  cancelDeliveryNote:        (id)     => apiCall("cancelDeliveryNote",        { id }),
  restoreDeliveryNote:       (id)     => apiCall("restoreDeliveryNote",       { id }),
  getCancelledDeliveryNotes: (search) => apiCall("getCancelledDeliveryNotes", { search }),
  getCustomers:              (search) => apiCall("getCustomers",               { search }),
  createCustomer:            (data)   => apiCall("createCustomer",             { data }),
  updateCustomer:            (originalName, data) => apiCall("updateCustomer", { originalName, data }),
  deleteCustomer:            (name)   => apiCall("deleteCustomer",             { name }),
};
