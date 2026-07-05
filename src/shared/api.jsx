// ============================================================
// KC Admin — Shared API Layer
// All calls to Apps Script go through here
// ============================================================

// CONFIG — ใส่ Apps Script URL ที่นี่หลัง Deploy
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxq9fZSwfWpTKiQRkV_yxQnwH5dSlZK5nPkK9agqBIwbXS24KGB7syrUDuat8WFplcGDA/exec";

// #299c — session token (minted by the backend `login` action, sent in the POST
// body on every call). Kept in memory + localStorage ("kc_token"), stamped with
// the #244 daily date so it's dropped at local midnight like kc_user.
const _todayStr = () => new Date().toDateString();
let _authToken = null;
try {
  const s = JSON.parse(localStorage.getItem("kc_token") || "null");
  if (s && s.token && s._loginDate === _todayStr()) _authToken = s.token;
  else localStorage.removeItem("kc_token");
} catch { _authToken = null; }

export function setAuthToken(token) {
  _authToken = token || null;
  if (token) localStorage.setItem("kc_token", JSON.stringify({ token, _loginDate: _todayStr() }));
  else localStorage.removeItem("kc_token");
}
export function getAuthToken() { return _authToken; }
export function clearAuthToken() { _authToken = null; localStorage.removeItem("kc_token"); }

// Re-login hook — App.jsx registers a handler; fired when the backend rejects a
// call as "unauthorized" (only happens once #299b enforcement is live).
let _onAuthReject = null;
export function setOnAuthReject(fn) { _onAuthReject = fn; }
export function notifyAuthReject() { if (_onAuthReject) _onAuthReject(); }

const _pendingCalls = {};

export async function apiCall(action, params = {}) {
  // Deduplicate — prevent same action firing twice simultaneously
  const dedupeKey = action + JSON.stringify(params);
  if (_pendingCalls[dedupeKey]) return _pendingCalls[dedupeKey];

  // #299c — POST as a "simple request" (text/plain) so no CORS preflight is
  // triggered (GAS can't answer OPTIONS). Backend reads e.postData.contents.
  // action + token last so params can never override them.
  const body = JSON.stringify({ ...params, action, token: _authToken || "" });

  const promise = fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  })
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(json => {
      delete _pendingCalls[dedupeKey];
      if (!json.success) {
        if (json.error === "unauthorized") notifyAuthReject();
        throw new Error(json.error || "API error");
      }
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
  login: (accessToken) => apiCall("login", { accessToken }), // #299c/#299a — verify Google token → mint session token
  // Cancel / restore
  cancelDeliveryNote:        (id)     => apiCall("cancelDeliveryNote",        { id }),
  restoreDeliveryNote:       (id)     => apiCall("restoreDeliveryNote",       { id }),
  getCancelledDeliveryNotes: (search) => apiCall("getCancelledDeliveryNotes", { search }),
  getCustomers:              (search) => apiCall("getCustomers",               { search }),
  createCustomer:            (data)   => apiCall("createCustomer",             { data }),
  updateCustomer:            (originalName, data) => apiCall("updateCustomer", { originalName, data }),
  deleteCustomer:            (name)   => apiCall("deleteCustomer",             { name }),
};
