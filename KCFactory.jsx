// ============================================================
// KC Factory System — Web App
// ============================================================
// Version History (last 15 — full log in KC_Daily_Progress_2026-06-18.md)
// v1.4.76 (2026-06-19) — #122 shared DateRangePicker (เดือน/ทั้งปี + year nav + month grid + custom range, collapsed dropdown); replaces date inputs in DN+TI lists; BN Create month-grid nav (monthOnly); BN History date filter
// v1.4.75 (2026-06-19) — #121 DN list default = last 3 months (was current month) + "ทั้งหมด" button (clears date range → loads all); wider default seeds _dnStore so more BN DN-opens are instant
// v1.4.74 (2026-06-19) — #120 BN breadcrumb: BillingNotePage setView pushes suffix (BN no / สร้างใบวางบิล) via onViewChange → top path shows Home › เอกสาร › ใบวางบิล › <BN> like DN/TI
// v1.4.73 (2026-06-19) — #119 fix: clicking ใบวางบิล nav now returns to BN list (goListRequest wired to BillingNotePage; was missing — only DN/TI had it)
// v1.4.72 (2026-06-19) — #116 cross-reuse: DN list load seeds shared _dnStore (id→detail w/ items) so opening those DNs from BN is instant (no getDNDetail fetch)
// v1.4.71 (2026-06-19) — #118 BN Create month cache: handleSearch caches results per "y-m" (instant revisit on month nav); ค้นหา forces refresh; create invalidates current month
// v1.4.70 (2026-06-19) — #116 DN popup: session-wide _dnStore cache shared across all DNDetailPopup uses (survives navigation) — each DN fetched once, later opens instant
// v1.4.69 (2026-06-19) — #99 BN Create: month nav ‹ › auto-loads the list (handleSearch(m,y)); no ค้นหา click needed
// v1.4.68 (2026-06-19) — #103 refine: print queue sits right under content (scroll region flex 0 1 auto) instead of pinned to viewport bottom; still shrinks+scrolls when content tall
// v1.4.67 (2026-06-19) — #100/#101/#103 BN Create fixes: scrollbar-gutter stable (date/format row no longer shifts); print queue pinned to bottom of right pane (no jump); done state shows clickable DN list (→ DNDetailPopup)
// v1.4.66 (2026-06-19) — #105 BN History caching: BillingNotePage uses app-level cache for list + detail (survives navigation, instant on return); detail seeded from enriched list row (Option B) so first open is instant too
// v1.4.65 (2026-06-19) — #110 Settings: add BN Combined folder URL field (blank = auto subfolder); saved via saveConfig folders.bnCombined
// v1.4.64 (2026-06-19) — #107 BN print queue: พิมพ์เลย generates ONE combined PDF in chosen format (รูปแบบ แนวตั้ง/แนวนอน picker) via printCombinedBillingNotes; opens single file + marks printed (was one tab per BN)
// v1.4.63 (2026-06-19) — #106 BN print queue: seed from all created BNs on search (shows even w/ nothing created this visit); checked = !printed; พิมพ์เลย marks printed in DB (col K) so rows stay unchecked on revisit
// v1.4.62 (2026-06-19) — #104 fix: BN Create restores created state on revisit — reads backend generated flag + fills BN no/date/count/total/PDF from getBillingNotes() (was hardcoded generated:false)
// v1.4.61 (2026-06-19) — #95 dead code cleanup: remove _REMOVED_CreateBNTab_placeholder + BNHistoryTab (~251 lines)
// v1.4.60 (2026-06-19) — #96 fix: left list independent scroll; date/format fixed grid; done state shows BN+PDF; print queue in right pane; DN popup in panel
// v1.4.59 (2026-06-18) — #96 BNCreateView redesign: split-pane; BNCustomerPanel with checkbox DN table, date picker, format toggle, inline confirm; print queue
// v1.4.58 (2026-06-18) — #97 fix: BNDetailView cache — bnDetailCache in BillingNotePage; first open fetches+stores; onSaved busts cache
// v1.4.57 (2026-06-18) — #97 fix: DNDetailPopup cache — dnCache in BNDetailView; re-open same DN instant
// v1.4.56 (2026-06-18) — #97 BNDetailView redesign: breadcrumb+status badge+action buttons; DNDetailPopup; BNEditForm; cancelBillingNote; BNListView cancelled badge; 4 new api methods
// v1.4.55 (2026-06-18) — #93 fix: customer.name → customer.customer field mismatch in BNCreateView + BNPreviewModal
// v1.4.54 (2026-06-18) — #93 fix: add Plus + ChevronLeft to lucide-react import
// v1.4.53 (2026-06-18) — #93 BillingNotePage view-based (list/create/detail); BNListView clickable rows; BNDetailView; api.getBillingNoteDetail
// v1.4.46 (2026-06-18) — #83 ProductAutocomplete keyboard nav (ArrowUp/Down/Enter/Escape)
// v1.4.45 (2026-06-18) — #72 ProductPage: CRUD for Config_Products; api.getProducts/updateProduct/deleteProduct/addProduct
// v1.4.41 (2026-06-18) — #82 ProductAutocomplete dropdown: fixed positioning via createPortal + body zoom fix
// v1.4.36 (2026-06-18) — #71 ProductAutocomplete: free-text autocomplete replacing <select> in DN+TI forms
// v1.4.29 (2026-06-17) — #54 similar name warning in DN+TI save; custWarning ConfirmModal
// v1.4.22 (2026-06-17) — #6 soft cancel/restore for DN+TI; 6 new api methods; ConfirmModal confirmLabel prop
// ============================================================

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FileText, ClipboardList, Receipt, Package, BarChart2, Printer, Pencil, Save, Search, RefreshCw, Loader, CheckCircle, Square, Eye, Folder, Home, Check, LayoutDashboard, ArrowLeftRight, Users, Settings, Plus, ChevronLeft, Calendar, ChevronDown } from "lucide-react";
// ============================================================
// CONFIG — ใส่ Apps Script URL ที่นี่หลัง Deploy
// ============================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxq9fZSwfWpTKiQRkV_yxQnwH5dSlZK5nPkK9agqBIwbXS24KGB7syrUDuat8WFplcGDA/exec";
// ตัวอย่าง: "https://script.google.com/macros/s/AKfycb.../exec"

// ============================================================
// API Layer — ทุก call ไป Apps Script ผ่านที่นี่
// ============================================================
const _pendingCalls = {};

async function apiCall(action, params = {}) {
  // Deduplicate — prevent same action firing twice simultaneously
  const dedupeKey = action + JSON.stringify(params);
  if (_pendingCalls[dedupeKey]) return _pendingCalls[dedupeKey];

  const promise = new Promise((resolve, reject) => {
    const callbackName = "gc_" + Math.random().toString(36).slice(2);
    const url = new URL(SCRIPT_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("callback", callbackName);
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));
    });

    window[callbackName] = (json) => {
      delete window[callbackName];
      delete _pendingCalls[dedupeKey];
      try { document.head.removeChild(script); } catch(e) {}
      if (!json.success) reject(new Error(json.error || "API error"));
      else resolve(json.data);
    };

    const script = document.createElement("script");
    script.src = url.toString();
    script.onerror = () => {
      delete window[callbackName];
      delete _pendingCalls[dedupeKey];
      try { document.head.removeChild(script); } catch(e) {}
      reject(new Error("Failed to load script"));
    };
    document.head.appendChild(script);
  });

  _pendingCalls[dedupeKey] = promise;
  return promise;
}

// Convenience API functions
const api = {
  getDeliveryNotes:      (startDate, endDate, search) => apiCall("getDeliveryNotes", { startDate, endDate, search }),
  createDeliveryNote:    (data)                        => apiCall("createDeliveryNote", { data }),
  updateDeliveryNote:    (id, data)                    => apiCall("updateDeliveryNote", { id, data }),
  searchDeliveryNotes:   (startDate, endDate)          => apiCall("searchDeliveryNotes", { startDate, endDate }),
  confirmBN:        (customer, reservedBnNo, invoices, bnDate, address, phone, format) =>
                      apiCall("confirmBillingNote", { customer, reservedBnNo, invoices, bnDate, address, phone, format }),
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
  // Tax Invoice
  getTaxInvoices:      (startDate, endDate, search)  => apiCall("getTaxInvoices", { startDate, endDate, search }),
  createTaxInvoice:    (data)                        => apiCall("createTaxInvoice", { data }),
  updateTaxInvoice:    (id, data)                    => apiCall("updateTaxInvoice", { id, data }),
  generateTaxInvoicePortraitPDF:          (id) => apiCall("generateTaxInvoicePortraitPDF", { id }),
  generateTaxInvoiceLandscapePDF: (id) => apiCall("generateTaxInvoiceLandscapePDF", { id }),
  generateDeliveryNoteLandscapePDF:  (id) => apiCall("generateDeliveryNoteLandscapePDF", { id }),
  generateDeliveryNotePortraitPDF:   (id) => apiCall("generateDeliveryNotePortraitPDF", { id }),
  getVersion: () => apiCall("getVersion"),
  // Cancel / restore
  cancelDeliveryNote:        (id)     => apiCall("cancelDeliveryNote",        { id }),
  restoreDeliveryNote:       (id)     => apiCall("restoreDeliveryNote",       { id }),
  getCancelledDeliveryNotes: (search) => apiCall("getCancelledDeliveryNotes", { search }),
  cancelTaxInvoice:          (id)     => apiCall("cancelTaxInvoice",          { id }),
  restoreTaxInvoice:         (id)     => apiCall("restoreTaxInvoice",         { id }),
  getCancelledTaxInvoices:   (search) => apiCall("getCancelledTaxInvoices",   { search }),
  getCustomers:              (search) => apiCall("getCustomers",               { search }),
  createCustomer:            (data)   => apiCall("createCustomer",             { data }),
  updateCustomer:            (originalName, data) => apiCall("updateCustomer", { originalName, data }),
  deleteCustomer:            (name)   => apiCall("deleteCustomer",             { name }),
};

// ── Constants ──────────────────────────────────────────────

const C = {
  sidebar: "#032d60",
  sidebarActive: "rgba(1,118,211,0.25)",
  sidebarActiveBorder: "#0176d3",
  accent: "#0176d3",
  pageBg: "#f3f3f3",
  cardBg: "#ffffff",
  text: "#181818",
  muted: "#6b6b6b",
  border: "rgba(0,0,0,0.1)",
  borderLight: "rgba(0,0,0,0.07)",
  success: "#2e844a",
  successBg: "#cdefc4",
  warning: "#a96404",
  warningBg: "#fdefc4",
  rowHover: "#f8f9ff",
  danger: "#c23934",
  dangerBg: "#fdecea",
};

const NAV = [
  { key: "dashboard",  label: "แดชบอร์ด",         icon: "LayoutDashboard", section: null },
  { key: "invoice",    label: "ใบส่งของ",           icon: "FileText",        section: "เอกสาร" },
  { key: "billing",    label: "ใบวางบิล",           icon: "ClipboardList",   section: "เอกสาร" },
  { key: "taxinvoice", label: "ใบกำกับภาษี",        icon: "Receipt",         section: "เอกสาร" },
  { key: "stock",      label: "สินค้า",             icon: "Package",         section: "คลังสินค้า" },
  { key: "stockmove",  label: "เคลื่อนไหวสต็อก",   icon: "ArrowLeftRight",  section: "คลังสินค้า" },
  { key: "customers",  label: "รายชื่อลูกค้า",      icon: "Users",           section: "ลูกค้า" },
  { key: "reports",    label: "รายงาน",             icon: "BarChart2",       section: "รายงาน" },
  { key: "settings",   label: "ตั้งค่า",             icon: "Settings",        section: "ระบบ" },
];

const SECTION_COLORS = {
  null:       { bg: "#E6F1FB", color: "#185FA5" },
  "เอกสาร":   { bg: "#E6F1FB", color: "#185FA5" },
  "คลังสินค้า":{ bg: "#EAF3DE", color: "#3B6D11" },
  "ลูกค้า":   { bg: "#EEEDFE", color: "#534AB7" },
  "รายงาน":   { bg: "#FAEEDA", color: "#854F0B" },
  "ระบบ":     { bg: "#F1EFE8", color: "#5F5E5A" },
};

// ── Shared UI ──────────────────────────────────────────────

const Badge = ({ type, success, children }) => {
  const styles = {
    success: { background: C.successBg, color: C.success },
    warning: { background: C.warningBg, color: C.warning },
    info:    { background: "#d8edff",   color: C.accent },
  };
  const s = type ? styles[type] : success ? styles.success : styles.warning;
  return <span style={{ ...s, padding: "2px 9px", borderRadius: 10, fontSize: 10, fontWeight: 500 }}>{children}</span>;
};

const Btn = ({ onClick, primary, danger, small, disabled, children, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: primary ? C.accent : danger ? C.dangerBg : "white",
    color: primary ? "white" : danger ? C.danger : C.accent,
    border: primary ? "none" : danger ? `1px solid ${C.danger}` : `1px solid ${C.accent}`,
    padding: small ? "4px 10px" : "6px 14px", borderRadius: 4,
    fontSize: small ? 11 : 12, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 5,
    ...style,
  }}>{children}</button>
);

const inputStyle = { padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, outline: "none", boxSizing: "border-box", height: 32, fontFamily: "inherit" };

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 500, color: C.accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>{children}</div>
);

// Spinner / loading state
const Spinner = ({ text = "กำลังโหลด..." }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, flexDirection: "column", gap: 12, color: C.muted }}>
    <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    <div style={{ fontSize: 13 }}>{text}</div>
  </div>
);

const ErrorBox = ({ msg, onRetry }) => (
  <div style={{ background: C.dangerBg, color: C.danger, padding: "14px 18px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <span>⚠️ {msg}</span>
    {onRetry && <Btn small danger onClick={onRetry}>ลองใหม่</Btn>}
  </div>
);

// ── Invoice Components ─────────────────────────────────────

const ITEMS_COUNT = 10;
const emptyItem  = () => ({ desc: "", desc2: "", detail: "", qty: "", unitPrice: "", amount: "" });

// Description width estimator — Thai chars count 1.5x (wider glyphs), others 1x
// DESC_MAX = landscape limit (~64mm col / 3mm font). Warns user before PDF overflows.
// DETAIL_MAX = right block of desc col (~38.5mm at 2.5mm font). GAS PDF expands row height for overflow — only fix is a hard cap.
// DETAIL_WARN = soft yellow warning threshold; DETAIL_MAX = hard red block threshold.
const DESC_MAX   = 48;
const DETAIL_WARN = 25;
const DETAIL_MAX  = 34;
const SIMILARITY_THRESHOLD = 0.75;
function descWidth(text) {
  let w = 0;
  for (let j = 0; j < text.length; j++) {
    const c = text.charCodeAt(j);
    w += (c >= 0x0E00 && c <= 0x0E7F) ? 1.5 : 1;
  }
  return w;
}
function getDescText(it) {
  return (it.desc || "") + (it.desc2 ? " " + it.desc2 : "") + (it.detail ? " (" + it.detail + ")" : "");
}

function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "ลบ", loading = false, enterConfirm = false }) {
  useEffect(() => {
    if (!enterConfirm) return;
    const handler = e => {
      if (e.key === "Enter" && !loading) { e.preventDefault(); onConfirm(); }
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enterConfirm, loading, onConfirm, onCancel]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "white", borderRadius: 10, padding: "24px 28px", minWidth: 260, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 20 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} disabled={loading} style={{ padding: "7px 20px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: C.text, opacity: loading ? 0.5 : 1 }}>ยกเลิก</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: "7px 20px", borderRadius: 6, border: "none", background: "#e5534b", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: "white", fontWeight: 500, opacity: loading ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {loading && <Loader size={13}/>}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Customer similarity check (#20) ───────────────────────
// Returns 0–1: 1 = identical, 0 = nothing in common.
// Normalizes before comparing (lowercase, strip spaces + punctuation).
function customerSimilarity(a, b) {
  const norm = s => s.toLowerCase().replace(/[\s\-_.]/g, "");
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) { dp[i] = [i]; }
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return 1 - dp[m][n] / Math.max(m, n, 1);
}

// ── findSimilarCustomers (#61) ────────────────────────────
// Returns names from list that are suspiciously similar to nameVal.
// Used by DN form, TI form, and CustomerPage (checkNameSimilarity / handleSave safety nets).
const _simNorm = s => s.toLowerCase().replace(/[\s\-_.]/g, "");
const _COMMON_PREFIXES = new Set(["คุณ","นาย","นาง","นางสาว","บริษัท","ห้างหุ้นส่วน","หจก","บจก"]);
function findSimilarCustomers(nameVal, list) {
  const trimmed = nameVal.trim().toLowerCase();
  if (!trimmed) return [];
  const normTyped = _simNorm(nameVal.trim());
  return list.filter(c => {
    if (c.name.toLowerCase() === trimmed) return false;
    const normC = _simNorm(c.name);
    if (!_COMMON_PREFIXES.has(normTyped) && normC.length >= 3 && normTyped.length >= 3 && (normC.includes(normTyped) || normTyped.includes(normC))) return true;
    return customerSimilarity(c.name, nameVal.trim()) >= SIMILARITY_THRESHOLD;
  }).map(c => c.name);
}

// ── collapseItems (#62) ───────────────────────────────────
// Merges _cont (continuation) rows into their parent's detail field, strips internal flags.
// Used in DN and TI handleSave.
function collapseItems(items) {
  const collapsed = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i]._cont) continue;
    const it = { ...items[i] };
    const contParts = [];
    let j = i + 1;
    while (j < items.length && items[j]._cont) {
      if (items[j].detail) contParts.push(items[j].detail);
      j++;
    }
    if (contParts.length > 0) it.detail = [it.detail || "", ...contParts].filter(Boolean).join(" | ");
    collapsed.push(it);
  }
  const filled = collapsed.filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
  return { filled, cleanItems: filled.map(({ _orig, _cont, ...it }) => it) };
}

// ── Customer name autocomplete (#19) ──────────────────────
// Shared by DeliveryNoteForm and TaxInvoiceForm.
// Loads all customers once on mount, filters locally as user types.
// onSelect(customer) called when user picks a suggestion — caller fills address/phone/taxId.

function CustomerAutocomplete({ value, onChange, onSelect, onCustomersLoaded, onBlur, style }) {
  const [customers, setCustomers] = useState([]);
  const [open, setOpen]           = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    api.getCustomers("").then(list => {
      const result = Array.isArray(list) ? list : [];
      setCustomers(result);
      if (onCustomersLoaded) onCustomersLoaded(result);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const q = value.toLowerCase();
  const filtered = q.length === 0
    ? customers
    : customers.filter(c => c.name.toLowerCase().includes(q));

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
        onBlur={onBlur}
        placeholder="ชื่อลูกค้า"
        style={style}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
          background: "white", border: `1px solid ${C.border}`, borderRadius: 4,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto"
        }}>
          {filtered.map((c, i) => (
            <div key={i}
              onMouseDown={e => { e.preventDefault(); onSelect(c); setOpen(false); }}
              style={{ padding: "8px 10px", fontSize: 12, cursor: "pointer", borderBottom: `0.5px solid ${C.borderLight}` }}
              onMouseEnter={e => e.currentTarget.style.background = "#EEF2FF"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              <div style={{ fontWeight: 500 }}>{c.name}</div>
              {c.address && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{c.address}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductAutocomplete({ value, onChange, onBlur, products, style }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) &&
          (!dropdownRef.current || !dropdownRef.current.contains(e.target))) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useLayoutEffect(() => {
    if (open && inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      // Chrome 128+: body { zoom } creates a new fixed-positioning containing block.
      // getBoundingClientRect() returns viewport coords; divide by zoom to get body-local coords.
      const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      setRect({ bottom: r.bottom / zoom, left: r.left / zoom, width: r.width / zoom });
    }
  }, [open]);

  const openDropdown = () => { setOpen(true); setHighlightedIndex(-1); };

  const q = value.toLowerCase();
  const filtered = q.length === 0
    ? products
    : products.filter(p => p.toLowerCase().includes(q));

  return (
    <div ref={wrapRef}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); openDropdown(); }}
        onFocus={openDropdown}
        onKeyDown={e => {
          if (e.key === "Escape") { setOpen(false); return; }
          if (!open || filtered.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(i => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && highlightedIndex >= 0) {
            e.preventDefault();
            onChange(filtered[highlightedIndex]);
            setOpen(false);
          }
        }}
        onBlur={() => { setOpen(false); if (onBlur) onBlur(); }}
        placeholder="— เลือกหรือพิมพ์สินค้า —"
        style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", ...style }}
      />
      {open && filtered.length > 0 && rect && createPortal(
        <div ref={dropdownRef} style={{ position: "fixed", top: rect.bottom + 2, left: rect.left, width: rect.width, zIndex: 9000, background: "white", border: `1px solid ${C.border}`, borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 180, overflowY: "auto" }}>
          {filtered.map((p, i) => (
            <div key={i}
              onMouseDown={e => { e.preventDefault(); onChange(p); setOpen(false); }}
              onMouseEnter={() => setHighlightedIndex(i)}
              onMouseLeave={() => setHighlightedIndex(-1)}
              style={{ padding: "6px 10px", fontSize: 12, cursor: "pointer", borderBottom: `0.5px solid ${C.borderLight}`, background: highlightedIndex === i ? "#EEF2FF" : "white" }}
            >{p}</div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function DeliveryNoteForm({ initial, onSave, onCancel, isEdit, products, setProducts, sizes }) {
  const [date, setDate]       = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [name, setName]       = useState(initial?.name || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [phone, setPhone]     = useState(initial?.phone || "");
  const [items,         setItems]         = useState(() => {
    if (!isEdit || !initial?.items) return [emptyItem()];
    const rows = [];
    initial.items.filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount).forEach(it => {
      const parts = (it.detail || "").split(" | ");
      rows.push({ ...it, _orig: true, detail: parts[0] || "" });
      for (let j = 1; j < parts.length; j++) {
        rows.push({ ...emptyItem(), _cont: true, detail: parts[j] });
      }
    });
    return rows;
  });
  const [removedOrigItems, setRemovedOrigItems] = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [rowEditMode,   setRowEditMode]   = useState(false);
  const [allCustomers,  setAllCustomers]  = useState([]);
  const [custWarning,   setCustWarning]   = useState(null);
  const [productWarning, setProductWarning] = useState(null); // { rowIndex, name, similar }
  const [addingProduct,  setAddingProduct]  = useState(false);
  const custConfirmedRef        = useRef(false);
  const nameSelectedFromListRef = useRef(false);

  const checkProductName = (i, val) => {
    const trimmed = val.trim();
    if (!trimmed || products.includes(trimmed)) return;
    const similar = findSimilarCustomers(trimmed, products.map(p => ({ name: p })));
    setProductWarning({ rowIndex: i, name: trimmed, similar });
  };

  const checkNameSimilarity = (nameVal) => {
    if (isEdit || !nameVal.trim() || custConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, allCustomers);
    if (similar.length > 0) setCustWarning(similar);
  };

  const updateItem = (i, field, val) => {
    const next = items.map((it, idx) => {
      if (idx !== i || (it._cont && field !== "detail")) return it;
      const updated = { ...it, [field]: val };
      if (field === "qty" || field === "unitPrice") {
        const q = parseFloat(field === "qty" ? val : it.qty) || 0;
        const p = parseFloat(field === "unitPrice" ? val : it.unitPrice) || 0;
        updated.amount = q * p || "";
      }
      return updated;
    });
    setItems(next);
  };
  const updateDetailItem = (i, val) => {
    const it = items[i];
    const testIt = { ...it, detail: val };
    if (descWidth(getDescText(testIt)) <= DESC_MAX && descWidth(val) <= DETAIL_MAX) updateItem(i, "detail", val);
  };

  const addRow = () => { if (items.length < ITEMS_COUNT) setItems([...items, emptyItem()]); };
  const addContinuationRow = (afterIndex) => {
    if (items.length >= ITEMS_COUNT) return;
    const next = [...items];
    next.splice(afterIndex + 1, 0, { ...emptyItem(), _cont: true });
    setItems(next);
    setTimeout(() => {
      const inputs = document.querySelectorAll("[data-detail-idx]");
      const target = [...inputs].find(el => el.dataset.detailIdx === String(afterIndex + 1));
      if (target) target.focus();
    }, 30);
  };
  const removeRow = (i) => {
    if (items[i]?._orig) {
      const it = items[i];
      const note = [it.desc, it.desc2, it.qty].filter(Boolean).join(" ");
      if (note) setRemovedOrigItems(prev => [...prev, note]);
    }
    setItems(items.filter((_, idx) => idx !== i));
  };

  const total = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

  const handleSave = async () => {
    // Similar name check (new invoices only; skip if user already confirmed)
    if (!isEdit && !custConfirmedRef.current) {
      const similar = findSimilarCustomers(name, allCustomers);
      if (similar.length > 0) { setCustWarning(similar); return; }
    }
    custConfirmedRef.current = false;
    setCustWarning(null);
    setSaving(true);
    setError("");
    try {
      const { filled, cleanItems } = collapseItems(items);
      const payload = {
        date, name, address, phone, items: cleanItems, total,
        ...(isEdit ? { _logAdded: filled.filter(it => !it._orig).length, _logDeleted: removedOrigItems } : {})
      };
      const result = isEdit
        ? await api.updateDeliveryNote(initial.id, payload)
        : await api.createDeliveryNote(payload);
      onSave({ ...payload, id: result.invoiceNo || initial?.id, pdfUrl: result.pdfUrl || initial?.pdfUrl });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const cellInput = (i, field, align, extra = {}) => (
    <input value={items[i][field]} onChange={e => updateItem(i, field, e.target.value)}
      style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", outline: "none", textAlign: align || "left" }}
      onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
      onBlur={e => e.target.style.outline = "none"}
      {...extra}
    />
  );

  return (
    <>
    {pendingDelete !== null && <ConfirmModal message="ยืนยันลบ?" onConfirm={() => { removeRow(pendingDelete); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} enterConfirm />}
    {custWarning && <ConfirmModal
      message={`พบชื่อที่คล้ายกันในระบบ:\n"${custWarning.join('", "')}"\n\nดำเนินการบันทึกด้วยชื่อ "${name}" ต่อใช่ไหม?`}
      onConfirm={() => { custConfirmedRef.current = true; setCustWarning(null); }}
      onCancel={() => setCustWarning(null)}
      confirmLabel="ใช่ บันทึก"
    />}
    {productWarning && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        <div style={{ background: "white", borderRadius: 10, padding: "24px 28px", minWidth: 300, maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>ไม่พบ "{productWarning.name}" ในรายการสินค้า</div>
          {productWarning.similar.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>สินค้าที่ใกล้เคียง:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {productWarning.similar.map((s, i) => (
                  <button key={i} onMouseDown={e => { e.preventDefault(); updateItem(productWarning.rowIndex, "desc", s); setProductWarning(null); }}
                    style={{ padding: "5px 12px", borderRadius: 4, border: `1px solid ${C.accent}`, background: "#EEF2FF", cursor: "pointer", fontSize: 12, color: C.accent, fontWeight: 500 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {productWarning.similar.length === 0 && <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>ต้องการเพิ่มสินค้านี้เข้า Config_Products หรือยกเลิก?</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { updateItem(productWarning.rowIndex, "desc", ""); setProductWarning(null); }} style={{ padding: "7px 16px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "white", cursor: "pointer", fontSize: 13 }}>ยกเลิก</button>
            <button disabled={addingProduct} onClick={async () => { setAddingProduct(true); try { await api.addProduct(productWarning.name); setProducts(prev => [...prev, productWarning.name]); } catch(e){} setAddingProduct(false); setProductWarning(null); }}
              style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: C.accent, cursor: addingProduct ? "not-allowed" : "pointer", fontSize: 13, color: "white", fontWeight: 500, opacity: addingProduct ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {addingProduct && <Loader size={13}/>}เพิ่มสินค้าใหม่
            </button>
          </div>
        </div>
      </div>
    )}
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <SectionTitle>ข้อมูลลูกค้า</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่</div><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อลูกค้า</div>
            <CustomerAutocomplete
              value={name}
              onChange={v => { setName(v); nameSelectedFromListRef.current = false; custConfirmedRef.current = false; }}
              onSelect={c => { setName(c.name); setAddress(c.address); setPhone(c.phone); nameSelectedFromListRef.current = true; custConfirmedRef.current = true; }}
              onCustomersLoaded={setAllCustomers}
              onBlur={() => { if (!nameSelectedFromListRef.current) checkNameSimilarity(name); }}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>โทรศัพท์</div><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="เบอร์โทร" style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><input value={address} onChange={e => setAddress(e.target.value)} placeholder="ที่อยู่" style={{ ...inputStyle, width: "100%" }} /></div>
      </div>

      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ marginBottom: 6 }}>
          <SectionTitle>รายการสินค้า <span style={{ fontSize: 10, fontWeight: 400, color: items.length >= ITEMS_COUNT ? C.danger : items.length >= ITEMS_COUNT - 2 ? C.warning : C.muted }}>({items.length}/{ITEMS_COUNT} แถว)</span></SectionTitle>
          <div><button onClick={() => setRowEditMode(m => !m)} style={{ fontSize: 12, color: rowEditMode ? "#2a7a3b" : C.danger, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{rowEditMode ? "เสร็จ" : "ลบ"}</button></div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.sidebar }}>
                <th style={{ padding: "7px 6px", width: 28 }}></th>
                {[{ l: "#", w: 32, a: "center" }, { l: "รายการ / Description", w: 170, a: "left" }, { l: "ขนาด", w: 90, a: "left" }, { l: "รายละเอียด", w: "auto", a: "left" }, { l: "จำนวน QTY", w: 80, a: "right" }, { l: "หน่วยละ", w: 90, a: "right" }, { l: "จำนวนเงิน", w: 100, a: "right" }].map((h, idx) => (
                  <th key={idx} style={{ padding: "7px 10px", color: "white", fontWeight: 500, fontSize: 11, textAlign: h.a, width: h.w }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const dw = descWidth(getDescText(it));
                const detailW = descWidth(it.detail || "");
                const atWarn  = detailW >= DETAIL_WARN;
                const atLimit = dw >= DESC_MAX || detailW >= DETAIL_MAX;
                return (
                <tr key={i} style={{ background: it._cont ? "#f5f7ff" : i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}`, borderLeft: atLimit ? `3px solid ${C.danger}` : atWarn ? `3px solid ${C.warning}` : it._cont ? `3px solid ${C.accent}` : "3px solid transparent" }}>
                  <td style={{ padding: "3px 4px", textAlign: "center" }}>
                    {rowEditMode && <button onClick={() => setPendingDelete(i)} title="ลบแถว" style={{ width: 14, height: 14, borderRadius: "50%", border: "none", background: "#e5534b", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0, fontWeight: 700 }}>−</button>}
                  </td>
                  <td style={{ padding: "3px 6px", color: C.muted, textAlign: "center", fontSize: 11 }}>
                    {it._cont ? <span style={{ color: C.accent, fontSize: 13 }}>↳</span> : i + 1}
                  </td>
                  <td style={{ padding: "3px 6px" }}>
                    {!it._cont && <ProductAutocomplete value={it.desc} onChange={v => updateItem(i, "desc", v)} onBlur={() => checkProductName(i, it.desc)} products={products} />}
                  </td>
                  <td style={{ padding: "3px 6px" }}>
                    {!it._cont && <select value={it.desc2} onChange={e => updateItem(i, "desc2", e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", cursor: "pointer" }}>
                      <option value="">— ขนาด —</option>
                      {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>}
                  </td>
                  <td style={{ padding: "3px 6px" }}>
                    {cellInput(i, "detail", "left", {
                      "data-detail-idx": i,
                      onChange: e => updateDetailItem(i, e.target.value),
                      onKeyDown: e => { if (e.key === "Enter") { e.preventDefault(); addContinuationRow(i); } }
                    })}
                    {atLimit && <div style={{ fontSize: 11, color: C.danger, marginTop: 1 }}>ถึงขีดจำกัด — กด Enter เพื่อขึ้นบรรทัดใหม่</div>}
                    {!atLimit && atWarn && <div style={{ fontSize: 11, color: C.warning, marginTop: 1 }}>ใกล้จะเต็ม — พิจารณากด Enter ขึ้นบรรทัดใหม่</div>}
                  </td>
                  <td style={{ padding: "3px 6px" }}>{!it._cont && cellInput(i, "qty", "right")}</td>
                  <td style={{ padding: "3px 6px" }}>{!it._cont && cellInput(i, "unitPrice", "right")}</td>
                  <td style={{ padding: "4px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: it.amount ? C.text : C.muted }}>
                    {!it._cont && (it.amount ? Number(it.amount).toLocaleString() : "—")}
                  </td>
                </tr>
                );
              })}
              <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                <td colSpan={7} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 500 }}>ยอดรวม</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: C.accent, fontSize: 13 }}>฿{total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={addRow} disabled={items.length >= ITEMS_COUNT} style={{ fontSize: 11, color: items.length >= ITEMS_COUNT ? C.muted : C.accent, background: "none", border: `0.5px dashed ${items.length >= ITEMS_COUNT ? C.muted : C.accent}`, borderRadius: 4, padding: "4px 12px", cursor: items.length >= ITEMS_COUNT ? "not-allowed" : "pointer", marginTop: 8, width: "100%", opacity: items.length >= ITEMS_COUNT ? 0.5 : 1 }}>+ เพิ่มแถว (สินค้าใหม่) {items.length >= ITEMS_COUNT ? "— เต็ม 10 แถวแล้ว" : ""}</button>
      </div>

      {error && <div style={{ margin: "0 16px 8px", padding: "8px 12px", background: C.dangerBg, color: C.danger, borderRadius: 6, fontSize: 12 }}>⚠️ {error}</div>}

      <div style={{ padding: "10px 16px", background: "#fafafa", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn onClick={onCancel}>ยกเลิก</Btn>
        <Btn primary onClick={handleSave} disabled={saving || !name}>
          {saving ? <><Loader size={13}/> กำลังบันทึก...</> : (<><Save size={14}/> {isEdit ? "บันทึก" : "บันทึกและสร้าง PDF"}</>)}
        </Btn>
      </div>
    </div>
    </>
  );
}

function DeliveryNoteDetail({ invoice, onBack, onSaved, products, setProducts, sizes, isCancelled }) {
  const [editing, setEditing]         = useState(false);
  const [data, setData]               = useState(invoice);
  const [lsLoading, setLsLoading]     = useState(false);
  const [ptLoading, setPtLoading]     = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading]         = useState(false);
  const handleSave = (updated) => {
    setData({ ...data, ...updated, pdfUrl: "", portraitUrl: "" }); // clear so both PDFs regenerate after edit
    setEditing(false);
    onSaved?.(); // invalidate list cache + reload
  };

  const generateLandscape = async () => {
    // #4: use cached pdfUrl if available — skip backend call
    if (data.pdfUrl) {
      const a = document.createElement("a");
      a.href = data.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    setLsLoading(true);
    try {
      const result = await api.generateDeliveryNoteLandscapePDF(data.id);
      if (result.pdfUrl) {
        setData(d => ({ ...d, pdfUrl: result.pdfUrl }));
        const a = document.createElement("a");
        a.href = result.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setLsLoading(false); }
  };

  const generatePortrait = async () => {
    if (data.portraitUrl) {
      const a = document.createElement("a");
      a.href = data.portraitUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    setPtLoading(true);
    try {
      const result = await api.generateDeliveryNotePortraitPDF(data.id);
      if (result.pdfUrl) {
        setData(d => ({ ...d, portraitUrl: result.pdfUrl }));
        const a = document.createElement("a");
        a.href = result.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setPtLoading(false); }
  };

  const handleCancelInvoice = async () => {
    setCancelLoading(true);
    try { await api.cancelDeliveryNote(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); setShowCancelConfirm(false); }
  };
  const handleRestoreInvoice = async () => {
    setCancelLoading(true);
    try { await api.restoreDeliveryNote(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); }
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {data.id}</span>
      </div>
      <DeliveryNoteForm initial={data} onSave={handleSave} onCancel={() => setEditing(false)} isEdit products={products} setProducts={setProducts} sizes={sizes} />
    </div>
  );

  const filledItems = (data.items || []).filter(it => it.desc || it.qty || it.amount);
  return (
    <div>
      {showCancelConfirm && <ConfirmModal message={`ยืนยันยกเลิก ${data.id}?`} confirmLabel="ยืนยันยกเลิก" onConfirm={handleCancelInvoice} onCancel={() => setShowCancelConfirm(false)} loading={cancelLoading} enterConfirm />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการ</button>
          <span style={{ color: C.muted }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{data.id}</span>
          <Badge success={data.billed}>{data.billed ? "วางบิลแล้ว" : "รอวางบิล"}</Badge>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isCancelled ? (
            <Btn onClick={handleRestoreInvoice} disabled={cancelLoading}>{cancelLoading ? <Loader size={13}/> : null} กู้คืน</Btn>
          ) : (
            <>
              <Btn onClick={generateLandscape} disabled={lsLoading}>{lsLoading ? <Loader size={13}/> : <Printer size={14}/>} พิมพ์</Btn>
              <Btn onClick={generatePortrait} disabled={ptLoading}>{ptLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF</Btn>
              <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
              <Btn danger onClick={() => setShowCancelConfirm(true)} disabled={cancelLoading}>ยกเลิกใบนี้</Btn>
            </>
          )}
        </div>
      </div>
      {isCancelled && <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>ใบนี้ถูกยกเลิกแล้ว</div>}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[["เลขที่", data.id], ["วันที่", data.date ? new Date(data.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"], ["ชื่อลูกค้า", data.name], ["โทรศัพท์", data.phone || "—"]].map(([label, val]) => (
              <div key={label}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div></div>
            ))}
          </div>
          {data.address && <div style={{ marginTop: 12 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><div style={{ fontSize: 13 }}>{data.address}</div></div>}
        </div>
        <div style={{ padding: 16 }}>
          <SectionTitle>รายการสินค้า</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.sidebar }}>
                {["#", "รายการ", "ขนาด", "รายละเอียด", "จำนวน QTY", "หน่วยละ", "จำนวนเงิน"].map((h, i) => (
                  <th key={i} style={{ padding: "7px 12px", color: "white", fontWeight: 500, fontSize: 11, textAlign: i >= 4 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filledItems.map((it, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "8px 12px", color: C.muted, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ padding: "8px 12px" }}>{it.desc}</td>
                  <td style={{ padding: "8px 12px", color: C.muted }}>{it.desc2}</td>
                  <td style={{ padding: "8px 12px", color: C.muted }}>{it.detail}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>{it.qty}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.unitPrice).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{Number(it.amount).toLocaleString()}</td>
                </tr>
              ))}
              <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                <td colSpan={6} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 500 }}>ยอดรวมทั้งสิ้น</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: C.accent, fontSize: 14 }}>฿{(data.total || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// #122 — shared date filter: เดือน/ทั้งปี + year nav + month grid + optional custom range.
// Collapsed button shows current selection; click expands the panel inline (no portal → no clip).
// onApply(startDate, endDate) with "yyyy-MM-dd" (or "","" for all). monthOnly hides ทั้งปี/custom.
function DateRangePicker({ startDate, endDate, onApply, monthOnly }) {
  const mFull = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const mAbbr = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const now = new Date();
  const [open, setOpen]         = useState(false);
  const [mode, setMode]         = useState("month");
  const [year, setYear]         = useState(startDate ? new Date(startDate).getFullYear() : now.getFullYear());
  const [customOpen, setCustomOpen] = useState(false);
  const [cs, setCs]             = useState(startDate || "");
  const [ce, setCe]             = useState(endDate || "");

  const pad = n => String(n).padStart(2, "0");
  const monthRange = (y, m) => [`${y}-${pad(m+1)}-01`, `${y}-${pad(m+1)}-${pad(new Date(y, m+1, 0).getDate())}`];

  const labelFor = (s, e) => {
    if (monthOnly) { const d = s ? new Date(s) : now; return mFull[d.getMonth()] + " " + d.getFullYear(); }
    if (!s && !e) return "ทั้งหมด";
    const sd = s ? new Date(s) : null;
    if (sd && e) {
      const [ms, me] = monthRange(sd.getFullYear(), sd.getMonth());
      if (s === ms && e === me) return mFull[sd.getMonth()] + " " + sd.getFullYear();
      if (s === `${sd.getFullYear()}-01-01` && e === `${sd.getFullYear()}-12-31`) return "ทั้งปี " + sd.getFullYear();
    }
    return (s || "…") + " – " + (e || "…");
  };

  const fire      = (s, e) => { onApply(s, e); setOpen(false); };
  const pickMonth = (m)    => fire(...monthRange(year, m));
  const navBtn    = { width: 28, height: 28, borderRadius: "50%", border: `0.5px solid ${C.border}`, background: "white", cursor: "pointer", color: C.muted, fontSize: 14, lineHeight: 1 };
  const dIn       = { padding: "5px 8px", border: `0.5px solid ${C.border}`, borderRadius: 4, fontSize: 12, fontFamily: "inherit" };

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", border: `0.5px solid ${C.border}`, borderRadius: 4, background: "white", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.text }}>
        <Calendar size={13}/> {labelFor(startDate, endDate)} <ChevronDown size={12} style={{ color: C.muted }}/>
      </button>
      {open && (
        <div style={{ marginTop: 8, width: 290, background: "white", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.10)" }}>
          {!monthOnly && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[["month","เดือน"],["year","ทั้งปี"]].map(([v,l]) => (
                <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 12, cursor: "pointer", border: `0.5px solid ${mode===v?C.accent:C.border}`, background: mode===v?C.accent:"white", color: mode===v?"white":C.muted }}>{l}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => setYear(y => y-1)} style={navBtn} aria-label="ปีก่อน">‹</button>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{year}</span>
            <button onClick={() => { if (year < now.getFullYear()) setYear(y => y+1); }} style={navBtn} aria-label="ปีถัดไป">›</button>
          </div>
          {(monthOnly || mode === "month") && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {mAbbr.map((m, i) => {
                const future = year > now.getFullYear() || (year === now.getFullYear() && i > now.getMonth());
                const sel = startDate && new Date(startDate).getFullYear() === year && new Date(startDate).getMonth() === i;
                return <button key={i} disabled={future} onClick={() => pickMonth(i)} style={{ padding: "10px 0", borderRadius: 6, fontSize: 12, border: `0.5px solid ${sel?C.accent:C.borderLight}`, background: sel?C.accent:"white", color: sel?"white":(future?C.muted:C.text), cursor: future?"default":"pointer", opacity: future?0.4:1 }}>{m}</button>;
              })}
            </div>
          )}
          {!monthOnly && mode === "year" && (
            <button onClick={() => fire(`${year}-01-01`, `${year}-12-31`)} style={{ width: "100%", padding: "10px 0", borderRadius: 6, fontSize: 13, border: "none", background: C.accent, color: "white", cursor: "pointer" }}>เลือกทั้งปี {year}</button>
          )}
          {!monthOnly && (
            <div style={{ marginTop: 10, borderTop: `0.5px solid ${C.borderLight}`, paddingTop: 10 }}>
              <button onClick={() => setCustomOpen(o => !o)} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", padding: 0 }}>ระบุช่วงวันที่ (ไม่บังคับ)</button>
              {customOpen && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                  <input type="date" value={cs} onChange={e => setCs(e.target.value)} style={dIn}/>
                  <span style={{ fontSize: 12, color: C.muted }}>ถึง</span>
                  <input type="date" value={ce} onChange={e => setCe(e.target.value)} style={dIn}/>
                  <button onClick={() => fire(cs, ce)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "white", fontSize: 12, cursor: "pointer" }}>ใช้</button>
                </div>
              )}
              <button onClick={() => fire("", "")} style={{ display: "block", marginTop: 8, background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", padding: 0 }}>แสดงทั้งหมด</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeliveryNotePage({ products, setProducts, sizes, cache, updateCache, onViewChange, goListRequest }) {
  const [view, setView_]            = useState("list");
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  useEffect(() => { if (goListRequest) setView("list", null); }, [goListRequest]);
  const [selected, setSelected]     = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [startDate, setStartDate]   = useState(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); // #121 default = last 3 months
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [hovered, setHovered] = useState(null);
  // Cancelled section
  const [cancelSectionOpen, setCancelSectionOpen] = useState(false);
  const [cancelSearch,      setCancelSearch]      = useState("");
  const [cancelLoading,     setCancelLoading]     = useState(false);
  const [cancelledList,     setCancelledList]     = useState([]);

  const cacheKey = "invoices_" + startDate + "_" + endDate;
  const invoices = cache[cacheKey] || [];

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getDeliveryNotes(startDate, endDate, search);
      const list = Array.isArray(data) ? data : [];
      updateCache(cacheKey, list);
      // #116 — seed shared DN store so opening any of these DNs (e.g. from BN) is instant, no getDNDetail fetch
      list.forEach(dn => { if (dn && dn.id) _dnStore[dn.id] = { dnNo: dn.id, date: dn.date, customer: dn.name, address: dn.address || "", phone: dn.phone || "", total: dn.total, pdfUrl: dn.pdfUrl, items: dn.items || [] }; });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, search]);

  useEffect(() => { if (!cache[cacheKey]) loadInvoices(); }, [cacheKey]);

  const loadCancelled = useCallback(async () => {
    setCancelLoading(true);
    try {
      const data = await api.getCancelledDeliveryNotes(cancelSearch);
      setCancelledList(Array.isArray(data) ? data : []);
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setCancelLoading(false); }
  }, [cancelSearch]);

  const handleSelect    = (inv) => { setSelected(inv); setView("detail", inv.id); };
  const handleCreateNew = () => { setSelected(null); setView("create", "สร้างใหม่"); };
  const handleSaveNew   = (result) => {
    setSuccessMsg(`สร้างใบส่งของ ${result.id} สำเร็จ!`);
    setSelected(result);
    setView("detail");
    loadInvoices();
    setTimeout(() => { setSuccessMsg(""); }, 2500);
  };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return !q || (inv.id || "").toLowerCase().includes(q) || (inv.name || "").toLowerCase().includes(q);
  });

  return (
    <div>
      {successMsg && <div style={{ background: C.successBg, color: C.success, padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{successMsg}</div>}

      {view === "list" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}><FileText size={15}/> ใบส่งของ</div>
            <Btn primary onClick={handleCreateNew}>+ สร้างใบส่งของใหม่</Btn>
          </div>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาลูกค้า / เลขที่..."
                style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 200, height: 30 }} />
              <DateRangePicker startDate={startDate} endDate={endDate} onApply={(s, e) => { setStartDate(s); setEndDate(e); }} />
              {loading && <Loader size={14}/>}
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {filtered.length} รายการ</span>
            </div>

            {error && <div style={{ padding: 14 }}><ErrorBox msg={error} onRetry={loadInvoices} /></div>}
            {loading && <Spinner />}
            {!loading && !error && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>{["เลขที่ใบส่งของ", "วันที่", "ชื่อลูกค้า", "รายการ", "ยอดรวม", "สถานะ"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 14px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบข้อมูล</td></tr>
                  ) : filtered.map(inv => (
                    <tr key={inv.id} onMouseEnter={() => setHovered(inv.id)} onMouseLeave={() => setHovered(null)}
                      style={{ background: hovered === inv.id ? C.rowHover : "white", borderBottom: `0.5px solid ${C.borderLight}` }}>
                      <td style={{ padding: "9px 14px" }}>
                        <a onClick={() => handleSelect(inv)} style={{ color: C.accent, cursor: "pointer", fontWeight: 500 }}>{inv.id}</a>
                      </td>
                      <td style={{ padding: "9px 14px", color: C.muted }}>
                        {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "9px 14px" }}>{inv.name}</td>
                      <td style={{ padding: "9px 14px", color: C.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(inv.items || []).filter(it => it.desc).map(it => it.desc + (it.desc2 ? " " + it.desc2 : "")).join(", ")}
                      </td>
                      <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(inv.total || 0).toLocaleString()}</td>
                      <td style={{ padding: "9px 14px" }}><Badge success={inv.billed}>{inv.billed ? "วางบิลแล้ว" : "รอวางบิล"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cancelled invoices section */}
          <div style={{ marginTop: 14 }}>
            <button onClick={() => setCancelSectionOpen(o => !o)}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
              {cancelSectionOpen ? "▼" : "▶"} ใบที่ยกเลิก
            </button>
            {cancelSectionOpen && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
                <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>
                  <input value={cancelSearch} onChange={e => setCancelSearch(e.target.value)} placeholder="ค้นหาเลขที่ / ชื่อลูกค้า..."
                    onKeyDown={e => e.key === "Enter" && loadCancelled()}
                    style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 220 }} />
                  <Btn primary small onClick={loadCancelled} disabled={cancelLoading}>
                    {cancelLoading ? <Loader size={13}/> : <><Search size={13}/> ค้นหา</>}
                  </Btn>
                </div>
                {cancelLoading && <Spinner />}
                {!cancelLoading && cancelledList.length === 0 && (
                  <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 12 }}>กรอกชื่อลูกค้าหรือเลขที่แล้วกด ค้นหา</div>
                )}
                {!cancelLoading && cancelledList.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["เลขที่ใบส่งของ", "วันที่", "ชื่อลูกค้า", "ยอดรวม"].map((h, i) => (
                        <th key={i} style={{ padding: "8px 14px", textAlign: i === 3 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {cancelledList.map(inv => (
                        <tr key={inv.id} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                          <td style={{ padding: "9px 14px" }}>
                            <a onClick={() => { setSelected(inv); setView("cancelledDetail", inv.id); }} style={{ color: C.danger, cursor: "pointer", fontWeight: 500 }}>{inv.id}</a>
                          </td>
                          <td style={{ padding: "9px 14px", color: C.muted }}>
                            {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td style={{ padding: "9px 14px" }}>{inv.name}</td>
                          <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(inv.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {view === "detail" && selected && (
        <DeliveryNoteDetail invoice={selected} onBack={() => setView("list", null)} onSaved={() => { updateCache(cacheKey, null); loadInvoices(); }} products={products} setProducts={setProducts} sizes={sizes} />
      )}

      {view === "cancelledDetail" && selected && (
        <DeliveryNoteDetail invoice={selected} isCancelled={true} onBack={() => setView("list", null)}
          onSaved={() => { updateCache(cacheKey, null); loadInvoices(); setCancelledList(list => list.filter(i => i.id !== selected.id)); }}
          products={products} setProducts={setProducts} sizes={sizes} />
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setView("list", null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการใบส่งของ</button>
            <span style={{ color: C.muted }}>›</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>สร้างใบส่งของใหม่</span>
          </div>
          <DeliveryNoteForm onSave={handleSaveNew} onCancel={() => setView("list", null)} products={products} setProducts={setProducts} sizes={sizes} />
        </div>
      )}
    </div>
  );
}

// ── Settings Components ────────────────────────────────────

function EditableList({ title, icon, items, setItems, placeholder }) {
  const [newVal, setNewVal]   = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  const handleAdd      = () => { if (!newVal.trim()) return; setItems([...items, newVal.trim()]); setNewVal(""); };
  const handleDelete   = (i) => setItems(items.filter((_, idx) => idx !== i));
  const handleEdit     = (i) => { setEditIdx(i); setEditVal(items[i]); };
  const handleSaveEdit = () => { if (!editVal.trim()) return; setItems(items.map((v, i) => i === editIdx ? editVal.trim() : v)); setEditIdx(null); };

  return (
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span style={{ color: C.accent }}>{icon}</span>{title}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={placeholder} onKeyDown={e => e.key === "Enter" && handleAdd()}
          style={{ flex: 1, padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12 }} />
        <Btn primary small onClick={handleAdd}>+ เพิ่ม</Btn>
      </div>
      <div style={{ border: `0.5px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
        {items.length === 0 && <div style={{ padding: 16, textAlign: "center", color: C.muted, fontSize: 12 }}>ยังไม่มีรายการ</div>}
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: i < items.length - 1 ? `0.5px solid ${C.borderLight}` : "none", background: i % 2 === 0 ? "white" : "#fafbff" }}>
            {editIdx === i ? (
              <div style={{ display: "flex", gap: 6, flex: 1, marginRight: 8 }}>
                <input value={editVal} onChange={e => setEditVal(e.target.value)} style={{ flex: 1, padding: "4px 8px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12 }} />
                <Btn primary small onClick={handleSaveEdit}><Check size={13}/></Btn>
                <Btn small onClick={() => setEditIdx(null)}>✕</Btn>
              </div>
            ) : <span style={{ fontSize: 13 }}>{item}</span>}
            {editIdx !== i && (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => handleEdit(i)} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}><Pencil size={13}/></button>
                <button onClick={() => handleDelete(i)} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: C.danger, fontSize: 11 }}>🗑</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: C.muted }}>{items.length} รายการ</div>
    </div>
  );
}

function SettingsPage({ onConfigSaved }) {
  const [company, setCompany]   = useState("หจก. โรงงานกิมเชียง");
  const [nameEN,  setNameEN]    = useState("KIMCHIANG LIMITED PARTNERSHIP");
  const [address, setAddress]   = useState("25/9 หมู่ 10 ต.ลอมแม่นาง อ.บางใหญ่ จ.นนทบุรี 11140");
  const [tel, setTel]           = useState("02-191-8698-9");
  const [taxId, setTaxId]       = useState("0103506007938");
  const [folderDN, setFolderDN] = useState("");
  const [folderTI, setFolderTI] = useState("");
  const [folderBN, setFolderBN] = useState("");
  const [folderBNCombined, setFolderBNCombined] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [locked, setLocked]     = useState(true);
  const origFolders = useRef({ dn: "", ti: "", bn: "", bnCombined: "" });

  useEffect(() => {
    (async () => {
      try {
        const cfg = await api.getConfig();
        if (cfg.company?.name)    setCompany(cfg.company.name);
        if (cfg.company?.nameEN)  setNameEN(cfg.company.nameEN);
        if (cfg.company?.address) setAddress(cfg.company.address);
        if (cfg.company?.tel)     setTel(cfg.company.tel);
        if (cfg.company?.taxId)   setTaxId(cfg.company.taxId);
        const toUrl = id => id && !id.startsWith("http") ? `https://drive.google.com/drive/folders/${id}` : (id || "");
        const dn = toUrl(cfg.folders?.dn); setFolderDN(dn);
        const ti = toUrl(cfg.folders?.ti); setFolderTI(ti);
        const bn = toUrl(cfg.folders?.bn); setFolderBN(bn);
        const bnCombined = toUrl(cfg.folders?.bnCombined); setFolderBNCombined(bnCombined);
        origFolders.current = { dn, ti, bn, bnCombined };
      } catch (err) {
        setError("โหลดการตั้งค่าไม่สำเร็จ: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFolderBlur = async (key, value, label) => {
    if (locked) return;
    if (value === origFolders.current[key]) return;
    if (!window.confirm(`บันทึก Folder URL สำหรับ ${label} ใหม่?`)) return;
    setSaving(true);
    setError("");
    try {
      const newFolders = { dn: folderDN, ti: folderTI, bn: folderBN, bnCombined: folderBNCombined, [key]: value };
      await api.saveConfig({
        company: { name: company, nameEN, address, tel, taxId },
        folders: newFolders,
      });
      origFolders.current = { ...origFolders.current, [key]: value };
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    try {
      await api.saveConfig({
        company: { name: company, nameEN, address, tel, taxId },
        folders: { dn: folderDN, ti: folderTI, bn: folderBN, bnCombined: folderBNCombined },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setLocked(true);
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner text="กำลังโหลดการตั้งค่า..." />;

  const inpS  = { ...inputStyle, width: "100%",   ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };
  const taS   = { ...inputStyle, width: "100%",   resize: "vertical", ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };
  const monoS = { ...inputStyle, width: "100%",   fontFamily: "monospace", fontSize: 11, ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>⚙ ตั้งค่า</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setLocked(l => !l)} style={{ background: locked ? C.pageBg : "#fff9e6", border: `0.5px solid ${locked ? C.border : "#f0a500"}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: locked ? C.muted : "#b87800", display: "flex", alignItems: "center", gap: 5 }}>
            {locked ? "🔒 ล็อค" : "🔓 กำลังแก้ไข"}
          </button>
          {!locked && (
            <Btn primary onClick={handleSaveAll} disabled={saving}>
              {saving ? <><Loader size={13}/> กำลังบันทึก...</> : saved ? <><CheckCircle size={13}/> บันทึกแล้ว</> : <><Save size={13}/> บันทึกทั้งหมด</>}
            </Btn>
          )}
        </div>
      </div>
      {error && <div style={{ marginBottom: 14 }}><ErrorBox msg={error} /></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>🏢 ข้อมูลบริษัท</div>
          <div style={{ display: "grid", gap: 10 }}>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อบริษัท</div><input value={company} onChange={e => setCompany(e.target.value)} disabled={locked} style={inpS} /></div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อภาษาอังกฤษ</div><input value={nameEN} onChange={e => setNameEN(e.target.value)} disabled={locked} placeholder="COMPANY NAME IN ENGLISH" style={inpS} /></div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เลขประจำตัวผู้เสียภาษี</div><input value={taxId} onChange={e => setTaxId(e.target.value)} disabled={locked} placeholder="0000000000000" maxLength={13} style={{ ...inpS, fontFamily: "monospace", letterSpacing: "0.06em" }} /></div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><textarea value={address} onChange={e => setAddress(e.target.value)} disabled={locked} rows={2} style={taS} /></div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>โทรศัพท์ / แฟกซ์</div><input value={tel} onChange={e => setTel(e.target.value)} disabled={locked} style={inpS} /></div>
          </div>
        </div>
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}><Folder size={13}/> Google Drive Folder URLs</div>
          <div style={{ display: "grid", gap: 10 }}>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบส่งของ (DN) Folder URL</div><input value={folderDN} onChange={e => setFolderDN(e.target.value)} onBlur={e => handleFolderBlur("dn", e.target.value, "DN")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบกำกับภาษี (TI) Folder URL</div><input value={folderTI} onChange={e => setFolderTI(e.target.value)} onBlur={e => handleFolderBlur("ti", e.target.value, "TI")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบวางบิล (BN) Folder URL</div><input value={folderBN} onChange={e => setFolderBN(e.target.value)} onBlur={e => handleFolderBlur("bn", e.target.value, "BN")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบวางบิลรวมพิมพ์ (BN Combined) Folder URL <span style={{ color: C.muted, opacity: 0.7 }}>— เว้นว่าง = ใช้โฟลเดอร์ย่อย "Combined" อัตโนมัติ</span></div><input value={folderBNCombined} onChange={e => setFolderBNCombined(e.target.value)} onBlur={e => handleFolderBlur("bnCombined", e.target.value, "BN Combined")} disabled={locked} placeholder="(เว้นว่างได้)" style={monoS} /></div>
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0f4ff", borderRadius: 6, fontSize: 11, color: C.muted }}>
            💡 วาง URL จาก Google Drive ได้เลย — ระบบจะดึง Folder ID ให้อัตโนมัติ
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Customer List ──────────────────────────────────────────

function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState(null); // null | { mode:"add"|"edit", data:{}, originalName? }
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [similarWarning, setSimilarWarning] = useState(null); // [names] when similar names found
  const formRef             = useRef(null);
  const similarConfirmedRef = useRef(false);

  const checkCPSimilarity = (nameVal) => {
    if (!nameVal.trim() || similarConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, customers);
    if (similar.length > 0) setSimilarWarning(similar);
  };

  useEffect(() => {
    if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [form]);

  const load = useCallback(async (q) => {
    setListLoading(true);
    try { setCustomers(await api.getCustomers(q ?? "")); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setListLoading(false); }
  }, []);

  useEffect(() => { load(""); }, []);

  const EMPTY = { name: "", address: "", phone: "", taxId: "", note: "" };

  const doSave = async () => {
    setSimilarWarning(null);
    setSaving(true);
    try {
      if (form.mode === "add") { await api.createCustomer(form.data); }
      else { await api.updateCustomer(form.originalName, form.data); }
      setForm(null);
      await load(search);
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.data.name.trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; }
    // Similarity check — only on add, skip if already confirmed on blur
    if (form.mode === "add" && !similarConfirmedRef.current) {
      const similar = findSimilarCustomers(form.data.name, customers);
      if (similar.length > 0) { setSimilarWarning(similar); return; }
    }
    similarConfirmedRef.current = false;
    await doSave();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try { await api.deleteCustomer(deleteTarget); setDeleteTarget(null); await load(search); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const fldStyle = { ...inputStyle, width: "100%", height: 30, fontSize: 13 };
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>👤 รายชื่อลูกค้า</span>
        <Btn primary onClick={() => setForm({ mode: "add", data: { ...EMPTY } })}>+ เพิ่มลูกค้าใหม่</Btn>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(search)}
          placeholder="ค้นหาชื่อ / ที่อยู่ / เบอร์โทร..."
          style={{ ...inputStyle, flex: 1, height: 32 }} />
        <Btn primary onClick={() => load(search)}>ค้นหา</Btn>
        {search && <Btn onClick={() => { setSearch(""); load(""); }}>ล้าง</Btn>}
      </div>

      {/* Add / Edit form */}
      {form && (
        <div ref={formRef} style={{ background: "#F8FAFF", border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>{form.mode === "add" ? "เพิ่มลูกค้าใหม่" : "แก้ไขข้อมูลลูกค้า"}</div>
          {[
            { key: "name",    label: "ชื่อลูกค้า *", placeholder: "ชื่อบริษัท / ชื่อลูกค้า" },
            { key: "address", label: "ที่อยู่",        placeholder: "ที่อยู่" },
            { key: "phone",   label: "โทรศัพท์",       placeholder: "เบอร์โทรศัพท์" },
            { key: "taxId",   label: "เลขภาษี",        placeholder: "เลขประจำตัวผู้เสียภาษี 13 หลัก" },
            { key: "note",    label: "หมายเหตุ",       placeholder: "หมายเหตุ" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{label}</div>
              <input
                value={form.data[key]}
                onChange={e => {
                  if (key === "name") similarConfirmedRef.current = false;
                  setForm(f => ({ ...f, data: { ...f.data, [key]: e.target.value } }));
                }}
                onBlur={key === "name" ? () => { if (form.mode === "add") checkCPSimilarity(form.data.name); } : undefined}
                placeholder={placeholder}
                style={fldStyle} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn primary onClick={handleSave} disabled={saving}>
              {saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}
            </Btn>
            <Btn onClick={() => setForm(null)} disabled={saving}>ยกเลิก</Btn>
          </div>
        </div>
      )}

      {/* Table */}
      {listLoading ? <Spinner text="กำลังโหลด..." /> : (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr>
                <th style={thS}>ชื่อลูกค้า</th>
                <th style={thS}>ที่อยู่</th>
                <th style={thS}>โทรศัพท์</th>
                <th style={thS}>เลขภาษี</th>
                <th style={thS}>หมายเหตุ</th>
                <th style={{ ...thS, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.muted }}>
                  {search ? `ไม่พบลูกค้าที่ตรงกับ "${search}"` : "ยังไม่มีข้อมูลลูกค้า"}
                </td></tr>
              ) : customers.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdS, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ ...tdS, color: C.muted }}>{c.address}</td>
                  <td style={tdS}>{c.phone}</td>
                  <td style={{ ...tdS, fontFamily: "monospace", fontSize: 12 }}>{c.taxId}</td>
                  <td style={{ ...tdS, color: C.muted }}>{c.note}</td>
                  <td style={{ ...tdS, display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setForm({ mode: "edit", data: { ...c }, originalName: c.name })}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#E0E7FF", color: "#3730A3", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c.name)}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`ลบ "${deleteTarget}" ออกจากรายชื่อลูกค้าใช่ไหม?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading} enterConfirm />
      )}

      {similarWarning && form && (
        <ConfirmModal
          message={`พบชื่อที่คล้ายกันในระบบ:\n"${similarWarning.join('", "')}"\n\nยืนยันเพิ่ม "${form.data.name}" เป็นลูกค้าใหม่ใช่ไหม?`}
          onConfirm={() => { similarConfirmedRef.current = true; setSimilarWarning(null); }}
          onCancel={() => setSimilarWarning(null)}
          confirmLabel="ใช่ เพิ่มใหม่"
        />
      )}
    </div>
  );
}

// ── Product Management Page ────────────────────────────────

function ProductPage() {
  const [items, setItems]           = useState([]); // [{type,value,row}]
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("product"); // "product" | "size"
  const [form, setForm]             = useState(null); // null | { mode:"add"|"edit", row?:number, value:"" }
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {row, value}
  const [deleteLoading, setDeleteLoading] = useState(false);
  const formRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.getProducts()); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [form]);

  const visible = items.filter(it => it.type === tab);

  const handleSave = async () => {
    if (!form.value.trim()) { alert("กรุณากรอกชื่อ"); return; }
    setSaving(true);
    try {
      if (form.mode === "add") {
        await api.addProduct(form.value.trim(), tab);
      } else {
        await api.updateProduct(form.row, form.value);
      }
      setForm(null);
      await load();
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try { await api.deleteProduct(deleteTarget.row); setDeleteTarget(null); await load(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const tabLabel = tab === "product" ? "สินค้า" : "ขนาด";
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>📦 จัดการสินค้า</span>
        <Btn primary onClick={() => setForm({ mode: "add", value: "" })}>+ เพิ่ม{tabLabel}ใหม่</Btn>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[["product","สินค้า"],["size","ขนาด"]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setForm(null); }} style={{
            padding: "6px 18px", fontSize: 13, borderRadius: 6, cursor: "pointer", border: "none",
            background: tab === key ? C.accent : C.pageBg,
            color: tab === key ? "#fff" : C.text,
            fontFamily: "Prompt, sans-serif", fontWeight: tab === key ? 500 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* Add / Edit form */}
      {form && (
        <div ref={formRef} style={{ background: "#F8FAFF", border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>{form.mode === "add" ? `เพิ่ม${tabLabel}ใหม่` : `แก้ไข${tabLabel}`}</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อ{tabLabel}</div>
            <input
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder={`ชื่อ${tabLabel}`}
              autoFocus
              style={{ ...inputStyle, width: "100%", height: 30, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn primary onClick={handleSave} disabled={saving}>
              {saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}
            </Btn>
            <Btn onClick={() => setForm(null)} disabled={saving}>ยกเลิก</Btn>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <Spinner text="กำลังโหลด..." /> : (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr>
                <th style={{ ...thS, width: 50, textAlign: "center" }}>#</th>
                <th style={thS}>ชื่อ{tabLabel}</th>
                <th style={{ ...thS, width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 32, textAlign: "center", color: C.muted }}>ยังไม่มี{tabLabel}</td></tr>
              ) : visible.map((it, i) => (
                <tr key={it.row} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdS, textAlign: "center", color: C.muted, fontSize: 12 }}>{i + 1}</td>
                  <td style={{ ...tdS, fontWeight: 500 }}>{it.value}</td>
                  <td style={{ ...tdS, display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button onClick={() => setForm({ mode: "edit", row: it.row, value: it.value })}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#E0E7FF", color: "#3730A3", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>แก้ไข</button>
                    <button onClick={() => setDeleteTarget(it)}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`ลบ "${deleteTarget.value}" ออกจากรายการ${tabLabel}ใช่ไหม?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading} enterConfirm />
      )}
    </div>
  );
}

// ── Placeholder ────────────────────────────────────────────

const PlaceholderPage = ({ title, icon }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, color: C.muted, gap: 12 }}>
    <div style={{ fontSize: 48 }}>{icon}</div>
    <div style={{ fontSize: 18, fontWeight: 500, color: C.text }}>{title}</div>
    <div style={{ fontSize: 13 }}>กำลังพัฒนา — เร็วๆ นี้</div>
  </div>
);

// ── BN Preview Modal ───────────────────────────────────────

function BNPreviewModal({ customer, onClose, onConfirm, nextBnNo }) {
  const today = new Date().toISOString().slice(0, 10);
  const [bnDate, setBnDate]   = useState(today);
  const [address, setAddress] = useState(customer.address || "");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [format, setFormat]   = useState("portrait");
  const [rows, setRows]       = useState(
    customer.invoices.map((inv, i) => ({ ...inv, idx: i, checked: true }))
  );

  const addRow    = () => setRows([...rows, { no: "", date: "", total: "", idx: Date.now(), checked: true }]);
  const removeRow = (idx) => setRows(rows.filter(r => r.idx !== idx));
  const updateRow = (idx, field, val) => setRows(rows.map(r => r.idx === idx ? { ...r, [field]: val } : r));
  const toggleRow = (idx) => setRows(rows.map(r => r.idx === idx ? { ...r, checked: !r.checked } : r));

  const selectedRows = rows.filter(r => r.checked);
  const grandTotal   = selectedRows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const baht         = Math.floor(grandTotal);
  const satang       = Math.round((grandTotal - baht) * 100);

  // Compute invoice date range from selected rows for the API
  const getDateRange = () => {
    const dates = selectedRows.map(r => r.date).filter(Boolean).map(d => {
      // handle dd/MM/yyyy
      if (d.includes("/")) {
        const [dd, mm, yyyy] = d.split("/");
        return new Date(`${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`);
      }
      return new Date(d);
    }).filter(d => !isNaN(d));
    if (!dates.length) return { start: "", end: "" };
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    return {
      start: min.toISOString().slice(0, 10),
      end:   max.toISOString().slice(0, 10),
    };
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      const invoices = selectedRows.map(r => ({ dnNo: r.no, dnDate: r.date, amount: r.total }));
      const result = await api.confirmBN(customer.customer, nextBnNo, invoices, bnDate, address, customer.phone || "", format);
      onConfirm({ bnDate, address, dueDate, rows: selectedRows, grandTotal, bnNo: result.bnNo, pdfUrl: result.pdfUrl });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "20px 0" }}>
      <div style={{ background: "white", borderRadius: 10, width: 680, margin: "auto", overflow: "hidden" }}>

        <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.sidebar }}>
          <div style={{ color: "white", fontWeight: 500, fontSize: 14 }}>
            <><ClipboardList size={14}/> ตัวอย่างใบวางบิล — {customer.customer}</>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{nextBnNo}</span>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>✕ ปิด</button>
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${C.border}`, background: "#f8f9ff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่ออกบิล</div>
              <input type="date" value={bnDate} onChange={e => setBnDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="ที่อยู่ลูกค้า" style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันครบกำหนดชำระ</div>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: C.muted }}>รูปแบบ PDF:</span>
            {["portrait", "landscape"].map(f => (
              <button key={f} onClick={() => setFormat(f)}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, cursor: "pointer", border: `1px solid ${format === f ? C.accent : C.border}`, background: format === f ? C.accent : "white", color: format === f ? "white" : C.text, fontWeight: format === f ? 500 : 400 }}>
                {f === "portrait" ? "📄 แนวตั้ง" : "🖼 แนวนอน"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>KC</div>
              <div style={{ fontSize: 11, color: C.muted }}>หจก. โรงงานกิมเชียง</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12 }}>
              <div style={{ color: C.muted, fontSize: 11 }}>เลขที่</div>
              <div style={{ fontWeight: 500, color: C.accent }}>{nextBnNo}</div>
            </div>
          </div>

          <div style={{ background: "#555", color: "white", padding: "8px 14px", borderRadius: 4, marginBottom: 14, fontSize: 14, fontWeight: 500 }}>
            ใบวางบิล &nbsp;<span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Billing Note</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 12 }}>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: C.muted, minWidth: 40 }}>นาม</span><span style={{ fontWeight: 500 }}>{customer.customer}</span></div>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: C.muted, minWidth: 40 }}>ที่อยู่</span><span>{address || "—"}</span></div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
            <thead>
              <tr style={{ background: "#f0f4ff" }}>
                {["", "✓", "#", "เลขที่บิล", "วันที่บิล", "วันครบกำหนด", "บาท", "สต."].map((h, i) => (
                  <th key={i} style={{ padding: "6px 8px", textAlign: i >= 6 ? "right" : "left", fontWeight: 500, fontSize: 11, color: C.muted, borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const total  = parseFloat(row.total) || 0;
                const b      = Math.floor(total);
                const s      = Math.round((total - b) * 100);
                return (
                  <tr key={row.idx} style={{ background: row.checked ? "white" : "#fafafa", borderBottom: `0.5px solid ${C.borderLight}` }}>
                    <td style={{ padding: "4px 4px", textAlign: "center", width: 24 }}>
                      <button onClick={() => removeRow(row.idx)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: "0 2px", lineHeight: 1 }} title="ลบแถว">✕</button>
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <input type="checkbox" checked={row.checked} onChange={() => toggleRow(row.idx)} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center", color: C.muted, fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: "4px 8px" }}>
                      <input value={row.no} onChange={e => updateRow(row.idx, "no", e.target.value)}
                        style={{ border: "none", background: "transparent", fontSize: 12, width: "100%", outline: "none" }}
                        onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
                        onBlur={e => e.target.style.outline = "none"} />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <input value={row.date} onChange={e => updateRow(row.idx, "date", e.target.value)}
                        style={{ border: "none", background: "transparent", fontSize: 12, width: "100%", textAlign: "center", outline: "none" }}
                        onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
                        onBlur={e => e.target.style.outline = "none"} />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center", color: C.muted, fontSize: 11 }}>
                      {dueDate ? new Date(dueDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      <input value={row.total} onChange={e => updateRow(row.idx, "total", e.target.value)}
                        style={{ border: "none", background: "transparent", fontSize: 12, width: "100%", textAlign: "right", fontFamily: "monospace", outline: "none" }}
                        onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
                        onBlur={e => e.target.style.outline = "none"} />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: s > 0 ? C.text : C.muted }}>
                      {s > 0 ? String(s).padStart(2, "0") : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button onClick={addRow} style={{ fontSize: 11, color: C.accent, background: "none", border: `0.5px dashed ${C.accent}`, borderRadius: 4, padding: "4px 12px", cursor: "pointer", marginBottom: 12, width: "100%" }}>
            + เพิ่มแถว
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f0f4ff", borderRadius: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: C.muted }}>รวม <strong style={{ color: C.text }}>{selectedRows.length}</strong> ฉบับ</div>
            <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500, fontSize: 15, color: C.accent }}>
              รวมเงิน ฿{baht.toLocaleString()}{satang > 0 ? "." + String(satang).padStart(2, "0") : ""}
            </div>
          </div>
        </div>

        {error && <div style={{ margin: "0 20px 8px" }}><ErrorBox msg={error} /></div>}

        <div style={{ padding: "12px 20px", borderTop: `0.5px solid ${C.border}`, background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>{selectedRows.length} บิล · ฿{baht.toLocaleString()} · {nextBnNo}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={onClose}>ยกเลิก</Btn>
            <Btn primary onClick={handleConfirm} disabled={saving || selectedRows.length === 0}>
              {saving ? <><Loader size={13}/> กำลังสร้าง PDF...</> : <><Check size={13}/> ยืนยันและสร้าง PDF</>}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DN Detail Popup ─────────────────────────────────────────

// #116 — session-wide DN detail cache, shared across all popups (survives navigation).
// First open of a DN hits the backend once; every later open (anywhere) is instant.
const _dnStore = {};

function DNDetailPopup({ dnNo, onClose, cachedData, onCached }) {
  const seed = cachedData || _dnStore[dnNo] || null;
  const [data, setData]       = useState(seed);
  const [loading, setLoading] = useState(!seed);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (seed) return; // already have it (prop or session store)
    api.getDNDetail(dnNo)
      .then(d => { _dnStore[dnNo] = d; setData(d); onCached?.(dnNo, d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dnNo]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 10, width: 620, maxWidth: "92vw", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `0.5px solid ${C.border}`, position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.accent }}>{dnNo}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 22, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          {loading && <Spinner />}
          {error && <ErrorBox msg={error} />}
          {data && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 14 }}>
                {[["ลูกค้า", data.customer], ["วันที่", data.date], ["โทรศัพท์", data.phone || "—"], ["รวมเงิน", `฿${(data.total||0).toLocaleString()}`]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
                ))}
              </div>
              {data.address && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>ที่อยู่</div><div style={{ fontSize: 13 }}>{data.address}</div></div>}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.sidebar }}>
                    {["#", "รายการ", "ขนาด", "จำนวน", "หน่วยละ", "จำนวนเงิน"].map((h, i) => (
                      <th key={i} style={{ padding: "7px 10px", color: "white", fontWeight: 500, textAlign: i >= 3 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.items||[]).filter(it => it.desc||it.qty||it.amount).map((it, i) => (
                    <tr key={i} style={{ background: i%2===0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}` }}>
                      <td style={{ padding: "7px 10px", color: C.muted, textAlign: "center" }}>{i+1}</td>
                      <td style={{ padding: "7px 10px" }}>{it.desc}</td>
                      <td style={{ padding: "7px 10px", color: C.muted }}>{it.desc2}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right" }}>{it.qty}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.unitPrice||0).toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{Number(it.amount||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                    <td colSpan={5} style={{ padding: "9px 10px", textAlign: "right", fontWeight: 500 }}>ยอดรวม</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: C.accent }}>฿{(data.total||0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              {data.pdfUrl && (
                <div style={{ marginTop: 14, textAlign: "right" }}>
                  <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: C.accent, border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "5px 12px", textDecoration: "none" }}>
                    📄 เปิด PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BN Edit Form ─────────────────────────────────────────────

function BNEditForm({ detail, onSave, onCancel }) {
  function toInputDate(s) {
    if (!s) return "";
    const p = String(s).split("/");
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : "";
  }
  const [dateInput, setDateInput]   = useState(toInputDate(detail.date));
  const [customer, setCustomer]     = useState(detail.customer || "");
  const [invoices, setInvoices]     = useState(detail.invoices || []);
  const [unbilled, setUnbilled]     = useState([]);
  const [unbilledLoading, setUBL]   = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    setUBL(true);
    api.getUnbilledDNsForCustomer(detail.customer || "")
      .then(d => setUnbilled(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setUBL(false));
  }, []);

  const removeDN = (no) => setInvoices(prev => prev.filter(inv => inv.no !== no));
  const addDN    = (dn) => {
    if (invoices.find(inv => inv.no === dn.no)) return;
    setInvoices(prev => [...prev, dn]);
  };
  const available = unbilled.filter(d => !invoices.find(inv => inv.no === d.no));

  const handleSave = async () => {
    setSaving(true);
    try {
      const origNos     = new Set((detail.invoices||[]).map(inv => inv.no));
      const newNos      = new Set(invoices.map(inv => inv.no));
      const addDnNos    = [...newNos].filter(n => !origNos.has(n));
      const removeDnNos = [...origNos].filter(n => !newNos.has(n));
      await api.editBillingNote(detail.bnNo, { date: dateInput, customer, addDnNos, removeDnNos });
      const displayDate = dateInput ? (() => { const p = dateInput.split("-"); return `${p[2]}/${p[1]}/${p[0]}`; })() : detail.date;
      onSave({ date: displayDate, customer, invoices, count: invoices.length, total: invoices.reduce((s, inv) => s + (parseFloat(inv.total)||0), 0) });
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>วันที่ออกใบวางบิล</label>
            <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>ชื่อลูกค้า</label>
            <input value={customer} onChange={e => setCustomer(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>* เปลี่ยนชื่อลูกค้าจะไม่กระทบบันทึกอื่น ใช้เฉพาะใบนี้</div>
      </div>

      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500 }}>รายการใบส่งของในใบวางบิลนี้</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["เลขที่ DN", "วันที่", "รวมเงิน", ""].map((h, i) => (
                <th key={i} style={{ padding: "7px 14px", textAlign: i===2 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: C.muted }}>ไม่มีรายการ</td></tr>
            ) : invoices.map((inv, i) => (
              <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                <td style={{ padding: "8px 14px", color: C.accent, fontWeight: 500 }}>{inv.no}</td>
                <td style={{ padding: "8px 14px", color: C.muted }}>{inv.date}</td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(inv.total||0).toLocaleString()}</td>
                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                  <button onClick={() => removeDN(inv.no)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 18, lineHeight: 1 }} title="ลบออก">×</button>
                </td>
              </tr>
            ))}
          </tbody>
          {invoices.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: `0.5px solid ${C.border}`, background: "#f5f9f6" }}>
                <td colSpan={2} style={{ padding: "7px 14px", fontSize: 11, color: C.muted }}>รวม {invoices.length} ฉบับ</td>
                <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>฿{invoices.reduce((s, inv) => s+(parseFloat(inv.total)||0), 0).toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          เพิ่มใบส่งของ (ยังไม่วางบิล) {unbilledLoading && <Loader size={11}/>}
        </div>
        {!unbilledLoading && available.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: C.muted, fontSize: 12 }}>ไม่มีใบส่งของที่รอวางบิล</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {available.map((dn, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "8px 14px", color: C.accent, fontWeight: 500 }}>{dn.no}</td>
                  <td style={{ padding: "8px 14px", color: C.muted }}>{dn.date}</td>
                  <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(dn.total||0).toLocaleString()}</td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }}>
                    <Btn small onClick={() => addDN(dn)}><Plus size={11}/> เพิ่ม</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn onClick={onCancel} disabled={saving}>ยกเลิก</Btn>
        <Btn primary onClick={handleSave} disabled={saving}>{saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}</Btn>
      </div>
    </div>
  );
}

// ── BN Detail View ───────────────────────────────────────────

function BNDetailView({ bnNo, onBack, onSaved, cachedDetail, onDetailCached }) {
  const [detail, setDetail]               = useState(cachedDetail || null);
  const [loading, setLoading]             = useState(!cachedDetail);
  const [error, setError]                 = useState("");
  const [editing, setEditing]             = useState(false);
  const [showCancelConfirm, setShowCC]    = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [dnPopup, setDnPopup]             = useState(null);
  const [dnCache, setDnCache]             = useState({});
  const [hovered, setHovered]             = useState(null);

  const loadDetail = () => {
    if (cachedDetail) return; // use cache
    setLoading(true); setError("");
    api.getBillingNoteDetail(bnNo)
      .then(d => { setDetail(d); onDetailCached?.(bnNo, d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadDetail, [bnNo]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try { await api.cancelBillingNote(bnNo); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); setShowCC(false); }
  };

  const handleSaveEdit = (updated) => {
    setDetail(prev => ({ ...prev, ...updated }));
    setEditing(false);
    onSaved?.();
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {bnNo}</span>
      </div>
      <BNEditForm detail={detail} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
    </div>
  );

  return (
    <div>
      {showCancelConfirm && <ConfirmModal message={`ยืนยันยกเลิกใบวางบิล ${bnNo}?`} confirmLabel="ยืนยันยกเลิก" onConfirm={handleCancel} onCancel={() => setShowCC(false)} loading={cancelLoading} enterConfirm />}
      {dnPopup && <DNDetailPopup dnNo={dnPopup} onClose={() => setDnPopup(null)} cachedData={dnCache[dnPopup]} onCached={(no, d) => setDnCache(prev => ({ ...prev, [no]: d }))} />}

      {/* breadcrumb + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการ</button>
          <span style={{ color: C.muted }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{bnNo}</span>
          {detail && <Badge type={detail.cancelled ? "warning" : "success"}>{detail.cancelled ? "ยกเลิก" : "ปกติ"}</Badge>}
        </div>
        {detail && !detail.cancelled && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {detail.pdfUrl && (
              <a href={detail.pdfUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: C.accent, border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "5px 12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                📄 PDF
              </a>
            )}
            <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
            <Btn danger onClick={() => setShowCC(true)} disabled={cancelLoading}>ยกเลิกใบนี้</Btn>
          </div>
        )}
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox msg={error} />}

      {detail && (
        <div>
          {detail.cancelled && (
            <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
              ใบนี้ถูกยกเลิกแล้ว
            </div>
          )}

          {/* info card */}
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: detail.address ? 12 : 0 }}>
                {[["เลขที่", detail.bnNo], ["วันที่", detail.date||"—"], ["ชื่อลูกค้า", detail.customer||"—"], ["โทรศัพท์", detail.phone||"—"]].map(([l,v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
                ))}
              </div>
              {detail.address && (
                <div style={{ borderTop: `0.5px solid ${C.borderLight}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div>
                  <div style={{ fontSize: 13 }}>{detail.address}</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 20, padding: "10px 16px", background: "#f5f9f6", borderTop: `0.5px solid ${C.borderLight}`, alignItems: "center" }}>
              <div><span style={{ fontSize: 11, color: C.muted }}>รวมเงิน </span><span style={{ fontWeight: 600, fontSize: 15, color: C.accent }}>฿{(detail.total||0).toLocaleString()}</span></div>
              <div style={{ fontSize: 11, color: C.muted }}>{detail.count} ฉบับ</div>
            </div>
          </div>

          {/* DN table — click row for popup */}
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500 }}>รายการใบส่งของ — คลิกเพื่อดูรายละเอียด</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["เลขที่ DN","วันที่","รวมเงิน"].map((h,i) => (
                    <th key={i} style={{ padding: "7px 14px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.invoices||[]).length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: C.muted }}>ไม่พบรายการ</td></tr>
                ) : (detail.invoices||[]).map((inv,i) => (
                  <tr key={i}
                    onClick={() => setDnPopup(inv.no)}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                    style={{ borderBottom: `0.5px solid ${C.borderLight}`, cursor: "pointer", background: hovered===i ? C.rowHover : "white" }}>
                    <td style={{ padding: "8px 14px", color: C.accent, fontWeight: 500 }}>{inv.no}</td>
                    <td style={{ padding: "8px 14px", color: C.muted }}>{inv.date}</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(inv.total||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              {(detail.invoices||[]).length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: `0.5px solid ${C.border}`, background: "#f5f9f6" }}>
                    <td colSpan={2} style={{ padding: "7px 14px", fontSize: 11, color: C.muted }}>รวม {detail.invoices.length} ฉบับ</td>
                    <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>฿{(detail.total||0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BN List View ───────────────────────────────────────────

function BNListView({ bnList, loading, error, onRefresh, onRowClick }) {
  const [search, setSearch]   = useState("");
  const [hovered, setHovered] = useState(null);
  const [dStart, setDStart]   = useState(""); // #122 BN history date filter (client-side)
  const [dEnd, setDEnd]       = useState("");

  const parseThai = d => { if (!d) return null; const p = String(d).split("/"); return p.length === 3 ? new Date(+p[2], +p[1]-1, +p[0]) : new Date(d); };
  const filtered = bnList.filter(bn => {
    const q = search.toLowerCase();
    if (q && !((bn.bnNo || "").toLowerCase().includes(q) || (bn.customer || "").toLowerCase().includes(q))) return false;
    if (dStart || dEnd) {
      const bd = parseThai(bn.date);
      if (bd) {
        if (dStart && bd < new Date(dStart)) return false;
        if (dEnd && bd > new Date(dEnd + "T23:59:59")) return false;
      }
    }
    return true;
  });

  return (
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเลขที่ / ลูกค้า..."
          style={{ ...inputStyle, width: 240, height: 30 }} />
        <DateRangePicker startDate={dStart} endDate={dEnd} onApply={(s, e) => { setDStart(s); setDEnd(e); }} />
        <Btn small onClick={onRefresh}><RefreshCw size={14}/> รีเฟรช</Btn>
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {filtered.length} รายการ</span>
      </div>

      {error && <div style={{ padding: 14 }}><ErrorBox msg={error} onRetry={onRefresh} /></div>}
      {loading && <Spinner />}
      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["เลขที่ BN", "วันที่ออก", "ชื่อลูกค้า", "จำนวนบิล", "รวมเงิน", ""].map((h, i) => (
                <th key={i} style={{ padding: "8px 14px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบข้อมูล</td></tr>
            ) : filtered.map((bn, i) => (
              <tr key={i}
                onClick={() => onRowClick(bn)}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                style={{ background: hovered === i ? C.rowHover : bn.cancelled ? "#fafafa" : "white", borderBottom: `0.5px solid ${C.borderLight}`, cursor: "pointer", opacity: bn.cancelled ? 0.65 : 1 }}>
                <td style={{ padding: "9px 14px", color: C.accent, fontWeight: 500 }}>
                  {bn.bnNo}
                  {bn.cancelled && <span style={{ marginLeft: 6, fontSize: 9, background: C.warningBg, color: C.warning, borderRadius: 8, padding: "1px 6px", fontWeight: 500 }}>ยกเลิก</span>}
                </td>
                <td style={{ padding: "9px 14px", color: C.muted }}>{bn.date}</td>
                <td style={{ padding: "9px 14px" }}>{bn.customer}</td>
                <td style={{ padding: "9px 14px" }}>{bn.count} ฉบับ</td>
                <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(bn.total || 0).toLocaleString()}</td>
                <td style={{ padding: "9px 14px", textAlign: "center" }}>
                  {bn.pdfUrl ? (
                    <a href={bn.pdfUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 11, color: C.accent, textDecoration: "none", border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "3px 8px", whiteSpace: "nowrap" }}>
                      📄 PDF
                    </a>
                  ) : <span style={{ fontSize: 11, color: C.muted }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── BN Customer Panel (right pane) ─────────────────────────

function BNCustomerPanel({ cust, nextBnNo, onConfirm }) {
  const today = new Date().toISOString().slice(0, 10);
  const [bnDate, setBnDate]   = useState(today);
  const [format, setFormat]   = useState("portrait");
  const [confirming, setConf] = useState(false);
  const [error, setError]     = useState("");
  const [rows, setRows]       = useState(
    (cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: true }))
  );
  const [dnPopup, setDnPopup] = useState(null);
  const [dnCache, setDnCache] = useState({});

  // reset on customer switch (key prop handles unmount, but keep for safety)
  useEffect(() => {
    setBnDate(today); setFormat("portrait"); setError("");
    setRows((cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: true })));
  }, [cust.customer]);

  const toggleRow = (idx) => setRows(prev => prev.map(r => r.idx === idx ? { ...r, checked: !r.checked } : r));
  const toggleAll = () => {
    const allChecked = rows.every(r => r.checked);
    setRows(prev => prev.map(r => ({ ...r, checked: !allChecked })));
  };

  const selectedRows = rows.filter(r => r.checked);
  const grandTotal   = selectedRows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

  const handleConfirm = async () => {
    if (selectedRows.length === 0) return;
    setConf(true); setError("");
    try {
      const invoices = selectedRows.map(r => ({ dnNo: r.no, dnDate: r.date, amount: r.total }));
      const result = await api.confirmBN(cust.customer, nextBnNo, invoices, bnDate, cust.address || "", cust.phone || "", format);
      onConfirm({ bnNo: result.bnNo, pdfUrl: result.pdfUrl, customer: cust.customer, count: selectedRows.length, total: grandTotal, date: bnDate, dnNos: selectedRows.map(r => r.no) });
    } catch (e) {
      setError(e.message); setConf(false);
    }
  };

  return (
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "10px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{cust.customer}</span>
        <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{nextBnNo}</span>
      </div>
      {/* date + format — fixed 2-col grid so position never shifts */}
      <div style={{ padding: "10px 14px", borderBottom: `0.5px solid ${C.borderLight}`, display: "grid", gridTemplateColumns: "190px 1fr", gap: 16, alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่ออกใบวางบิล</div>
          <input type="date" value={bnDate} onChange={e => setBnDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>รูปแบบ PDF</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["portrait", "landscape"].map(f => (
              <button key={f} onClick={() => setFormat(f)}
                style={{ fontSize: 11, padding: "5px 10px", borderRadius: 4, cursor: "pointer", border: `1px solid ${format===f ? C.accent : C.border}`, background: format===f ? C.accent : "white", color: format===f ? "white" : C.text, whiteSpace: "nowrap" }}>
                {f === "portrait" ? "📄 แนวตั้ง" : "🖼 แนวนอน"}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* DN table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: "7px 14px", width: 32, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>
              <input type="checkbox" checked={rows.every(r => r.checked)} onChange={toggleAll} />
            </th>
            {["เลขที่ DN", "วันที่", "รวมเงิน"].map((h, i) => (
              <th key={i} style={{ padding: "7px 14px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.idx} style={{ borderBottom: `0.5px solid ${C.borderLight}`, background: row.checked ? "white" : "#fafafa", opacity: row.checked ? 1 : 0.55 }}>
              <td style={{ padding: "8px 14px" }}><input type="checkbox" checked={row.checked} onChange={() => toggleRow(row.idx)} /></td>
              <td style={{ padding: "8px 14px" }}>
                <span onClick={() => setDnPopup(row.no)} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{row.no}</span>
              </td>
              <td style={{ padding: "8px 14px", color: C.muted }}>{row.date}</td>
              <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(parseFloat(row.total)||0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: `0.5px solid ${C.border}`, background: "#f5f9f6" }}>
            <td colSpan={3} style={{ padding: "7px 14px", fontSize: 11, color: C.muted }}>รวม {selectedRows.length} ฉบับ</td>
            <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>฿{grandTotal.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      {error && <div style={{ padding: "8px 14px" }}><ErrorBox msg={error} /></div>}
      <div style={{ padding: "10px 14px", display: "flex", justifyContent: "flex-end" }}>
        <Btn primary onClick={handleConfirm} disabled={confirming || selectedRows.length === 0}>
          {confirming ? <><Loader size={13}/> กำลังสร้าง...</> : <><Check size={13}/> ออกใบวางบิล</>}
        </Btn>
      </div>
      {/* DN detail popup */}
      {dnPopup && (
        <DNDetailPopup
          dnNo={dnPopup}
          cachedData={dnCache[dnPopup]}
          onCached={(no, d) => setDnCache(prev => ({ ...prev, [no]: d }))}
          onClose={() => setDnPopup(null)}
        />
      )}
    </div>
  );
}

// ── BN Create View ─────────────────────────────────────────

function BNCreateView({ onBack }) {
  const now = new Date();
  const [month, setMonth]             = useState(now.getMonth() + 1);
  const [year, setYear]               = useState(now.getFullYear());
  const [searched, setSearched]       = useState(false);
  const [customers, setCustomers]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [nextBnNo, setNextBnNo]       = useState("26-BN-000001");
  const [printQueue, setPrintQueue]   = useState([]);
  const [printFormat, setPrintFormat] = useState("portrait"); // #107 combined-print format
  const [printing, setPrinting]       = useState(false);
  const [dnPopup, setDnPopup]         = useState(null); // #101 DN popup from done-state list
  const [dnCacheBN, setDnCacheBN]     = useState({});
  const [monthCache, setMonthCache]   = useState({}); // #118 per-month search cache (key "y-m")

  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

  const goMonth = (dir) => {
    let m = month + dir, y = year;
    if (m < 1)  { m = 12; y = y - 1; }
    if (m > 12) { m = 1;  y = y + 1; }
    setMonth(m); setYear(y); setSelectedIdx(null);
    handleSearch(m, y); // #99 auto-load when changing month
  };

  const handleSearch = async (mArg = month, yArg = year, force = false) => {
    const cacheKey = `${yArg}-${mArg}`;
    if (!force && monthCache[cacheKey]) { // #118 — instant revisit, no refetch
      const c = monthCache[cacheKey];
      setCustomers(c.customers); setPrintQueue(c.printQueue); setNextBnNo(c.nextBnNo);
      setSearched(true); setSelectedIdx(c.customers.length > 0 ? 0 : null);
      setError(""); setLoading(false);
      return;
    }
    setLoading(true); setError(""); setPrintQueue([]);
    const m = String(mArg).padStart(2, "0");
    const days = new Date(yArg, mArg, 0).getDate();
    const startDate = `${yArg}-${m}-01`;
    const endDate   = `${yArg}-${m}-${String(days).padStart(2, "0")}`;
    try {
      const data = await api.searchDeliveryNotes(startDate, endDate);
      // BN history lookup — restores created state on revisit (#104)
      let bnByNo = {}, nextBn = nextBnNo;
      try {
        const hist = await api.getBillingNotes();
        (hist || []).forEach(h => { if (h && h.bnNo && !h.cancelled) bnByNo[h.bnNo] = h; });
        if (hist && hist.length > 0) {
          const parts = hist[0].bnNo.split("-");
          const lastNum = parseInt(parts[parts.length-1], 10) || 0;
          const yy = new Date().getFullYear().toString().slice(-2);
          nextBn = `${yy}-BN-${String(lastNum+1).padStart(6,"0")}`;
          setNextBnNo(nextBn);
        }
      } catch (_) {}
      const mapped = (Array.isArray(data) ? data : []).map(cust => {
        if (cust.generated) {
          const billedInv = (cust.invoices || []).find(inv => inv.bnNo);
          const bnNo = billedInv ? billedInv.bnNo : null;
          const rec  = bnNo ? bnByNo[bnNo] : null;
          return { ...cust, generated: true, createdBnNo: bnNo,
            createdDate:  rec ? rec.date  : null,
            createdCount: rec ? rec.count : (cust.invoices || []).length,
            createdTotal: rec ? rec.total : 0,
            createdPdfUrl: rec ? rec.pdfUrl : null };
        }
        return { ...cust, generated: false, createdBnNo: null, createdPdfUrl: null };
      });
      setCustomers(mapped);
      setSearched(true);
      if (mapped.length > 0) setSelectedIdx(0);
      // #106 — seed print queue with all created BNs; checked only if not yet printed
      const queueSeed = mapped.filter(c => c.generated && c.createdBnNo).map(c => {
        const rec = bnByNo[c.createdBnNo];
        return { bnNo: c.createdBnNo, customer: c.customer, count: c.createdCount, total: c.createdTotal,
          pdfUrl: c.createdPdfUrl, date: c.createdDate, printed: rec ? !!rec.printed : false, checked: rec ? !rec.printed : true };
      });
      setPrintQueue(queueSeed);
      setMonthCache(prev => ({ ...prev, [cacheKey]: { customers: mapped, printQueue: queueSeed, nextBnNo: nextBn } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (result) => {
    setCustomers(prev => prev.map((c, i) => i === selectedIdx
      ? { ...c, generated: true, createdBnNo: result.bnNo, createdPdfUrl: result.pdfUrl, createdCount: result.count, createdTotal: result.total, createdDate: result.date }
      : c
    ));
    const parts = result.bnNo.split("-");
    const n = parseInt(parts[parts.length-1], 10) + 1;
    const yy = new Date().getFullYear().toString().slice(-2);
    setNextBnNo(`${yy}-BN-${String(n).padStart(6,"0")}`);
    setPrintQueue(prev => [...prev, { ...result, checked: true }]);
    // #118 — invalidate this month's cache so a later revisit reflects the new BN
    setMonthCache(prev => { const n = { ...prev }; delete n[`${year}-${month}`]; return n; });
    // auto-advance to next pending
    setCustomers(prev => {
      const nextPending = prev.findIndex((c, i) => i > selectedIdx && !c.generated);
      if (nextPending >= 0) setSelectedIdx(nextPending);
      return prev;
    });
  };

  const togglePrintItem = (i) => setPrintQueue(prev => prev.map((q, j) => j===i ? { ...q, checked: !q.checked } : q));
  const toggleAllPrint  = () => {
    const allChecked = printQueue.every(q => q.checked);
    setPrintQueue(prev => prev.map(q => ({ ...q, checked: !allChecked })));
  };
  // #107 — generate ONE combined PDF (chosen format) for all checked BNs, open it, mark printed
  const printNow = async () => {
    const toPrint = printQueue.filter(q => q.checked);
    const bnNos = toPrint.map(q => q.bnNo).filter(Boolean);
    if (!bnNos.length) return;
    setPrinting(true);
    try {
      const res = await api.printCombinedBillingNotes(bnNos, printFormat);
      if (res && res.url) {
        const a = document.createElement("a");
        a.href = res.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      // #106 — persist printed flag so these stay unchecked on future visits
      setPrintQueue(prev => prev.map(q => bnNos.includes(q.bnNo) ? { ...q, checked: false, printed: true } : q));
      try { await api.markBillingNotesPrinted(bnNos); } catch (_) {}
    } catch (err) {
      setError(err.message || "พิมพ์ไม่สำเร็จ");
    } finally {
      setPrinting(false);
    }
  };

  const done         = customers.filter(c => c.generated).length;
  const pending      = customers.filter(c => !c.generated).length;
  const selectedCust = selectedIdx !== null ? customers[selectedIdx] : null;

  // fixed height for split pane — subtract top bars (~160px)
  const PANE_H = "calc(100vh - 175px)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* top bar */}
      <div style={{ flexShrink: 0, padding: "0 0 10px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={13}/> กลับ
          </button>
          <span style={{ fontSize: 15, fontWeight: 500 }}>สร้างใบวางบิล</span>
        </div>
        {/* month navigator */}
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <DateRangePicker monthOnly startDate={`${year}-${String(month).padStart(2,"0")}-01`} endDate=""
            onApply={(s) => { if (!s) return; const d = new Date(s); const m1 = d.getMonth()+1, y = d.getFullYear(); setMonth(m1); setYear(y); setSelectedIdx(null); handleSearch(m1, y); }} />
          <Btn small onClick={() => handleSearch(month, year, true)} disabled={loading} title="โหลดใหม่">
            {loading ? <Loader size={13}/> : <RefreshCw size={13}/>}
          </Btn>
          {searched && customers.length > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted, display: "flex", gap: 12, alignItems: "center" }}>
              {done > 0 && <span style={{ color: C.success, display: "flex", alignItems: "center", gap: 3 }}><CheckCircle size={11}/> {done} สร้างแล้ว</span>}
              {pending > 0 && <span style={{ color: C.warning, display: "flex", alignItems: "center", gap: 3 }}><Square size={11}/> {pending} ยังไม่สร้าง</span>}
            </span>
          )}
        </div>
        {error && <div style={{ marginTop: 8 }}><ErrorBox msg={error} onRetry={() => handleSearch()} /></div>}
        {loading && <div style={{ marginTop: 8 }}><Spinner text="กำลังดึงข้อมูลใบส่งของ..." /></div>}
      </div>

      {/* split pane — both sides scroll independently */}
      {!loading && searched && customers.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>ไม่พบใบส่งของในเดือนนี้</div>
      )}
      {!loading && searched && customers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, flex: 1, minHeight: 0 }}>
          {/* left: scrollable customer list */}
          <div style={{ overflowY: "auto", scrollbarGutter: "stable", display: "flex", flexDirection: "column", gap: 6, paddingRight: 2 }}>
            {customers.map((cust, i) => {
              const total      = cust.invoices.reduce((s, inv) => s + (parseFloat(inv.total)||0), 0);
              const isSelected = selectedIdx === i;
              return (
                <div key={i} onClick={() => setSelectedIdx(i)}
                  style={{ background: C.cardBg, border: `0.5px solid ${isSelected ? C.accent : C.border}`, borderLeft: `3px solid ${isSelected ? C.accent : cust.generated ? C.success : C.borderLight}`, borderRadius: "0 6px 6px 0", padding: "9px 10px", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{cust.customer}</span>
                    {cust.generated
                      ? <Badge type="success" style={{ fontSize: 9 }}><CheckCircle size={8}/> สร้างแล้ว</Badge>
                      : <Badge type="warning" style={{ fontSize: 9 }}>ยังไม่สร้าง</Badge>}
                  </div>
                  {cust.generated && cust.createdBnNo
                    ? <div style={{ fontSize: 10, color: C.accent }}>{cust.createdBnNo}</div>
                    : <div style={{ fontSize: 10, color: C.muted }}>{cust.invoices.length} ฉบับ · ฿{total.toLocaleString()}</div>}
                </div>
              );
            })}
          </div>

          {/* right: panel (scrolls) + print queue (pinned bottom, #103) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
           {/* scrollable region — panel / done / placeholder; sizes to content so queue sits right below (not pinned to bottom), but shrinks+scrolls when tall. stable gutter so width never shifts (#100) */}
           <div style={{ flex: "0 1 auto", minHeight: 0, overflowY: "auto", scrollbarGutter: "stable", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* creation panel */}
            {selectedCust && !selectedCust.generated && (
              <BNCustomerPanel
                key={selectedCust.customer}
                cust={selectedCust}
                nextBnNo={nextBnNo}
                onConfirm={handleConfirm}
              />
            )}
            {/* done state — shows BN details + PDF link */}
            {selectedCust && selectedCust.generated && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", background: "#e8f5e9", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={14} style={{ color: C.success }}/>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedCust.customer}</span>
                  <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{selectedCust.createdBnNo}</span>
                </div>
                <div style={{ padding: "12px 14px", display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12 }}>
                  <div>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>วันที่</div>
                    <div>{selectedCust.createdDate || "-"}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>จำนวนบิล</div>
                    <div>{selectedCust.createdCount} ฉบับ</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>รวมเงิน</div>
                    <div style={{ fontWeight: 600, color: C.accent }}>฿{(selectedCust.createdTotal||0).toLocaleString()}</div>
                  </div>
                  {selectedCust.createdPdfUrl && (
                    <div style={{ alignSelf: "flex-end" }}>
                      <a href={selectedCust.createdPdfUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "white", background: C.accent, padding: "5px 12px", borderRadius: 4, textDecoration: "none", fontWeight: 500 }}>
                        <FileText size={13}/> เปิด PDF
                      </a>
                    </div>
                  )}
                </div>
                {/* #101 — billed DN list, clickable → DNDetailPopup */}
                {(selectedCust.invoices || []).length > 0 && (
                  <div style={{ borderTop: `0.5px solid ${C.borderLight}` }}>
                    <div style={{ padding: "6px 14px", fontSize: 11, color: C.muted, background: "#fafafa" }}>ใบส่งของในใบวางบิลนี้</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <tbody>
                        {selectedCust.invoices.map((inv, i) => (
                          <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                            <td style={{ padding: "7px 14px" }}>
                              <span onClick={() => setDnPopup(inv.no)} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{inv.no}</span>
                            </td>
                            <td style={{ padding: "7px 14px", color: C.muted }}>{inv.date}</td>
                            <td style={{ padding: "7px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(parseFloat(inv.total)||0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ padding: "8px 14px", borderTop: `0.5px solid ${C.borderLight}`, display: "flex", justifyContent: "flex-end" }}>
                  <Btn small onClick={() => setCustomers(prev => prev.map((c, i) => i === selectedIdx ? { ...c, generated: false, createdBnNo: null, createdPdfUrl: null } : c))}>
                    <RefreshCw size={12}/> สร้างใหม่
                  </Btn>
                </div>
              </div>
            )}
            {/* placeholder when nothing selected */}
            {!selectedCust && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
                เลือกลูกค้าจากรายการทางซ้าย
              </div>
            )}
           </div>{/* end scrollable region */}
            {/* print queue — pinned at bottom of right pane (#103) */}
            {printQueue.length > 0 && (
              <div style={{ flexShrink: 0, maxHeight: "42%", display: "flex", flexDirection: "column", background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                    <Printer size={13}/> คิวพิมพ์ ({printQueue.filter(q=>q.checked).length}/{printQueue.length})
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>รูปแบบ</span>
                      {[["portrait","แนวตั้ง"],["landscape","แนวนอน"]].map(([v,l]) => (
                        <button key={v} onClick={() => setPrintFormat(v)} disabled={printing}
                          style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, cursor: printing ? "default" : "pointer",
                            border: `0.5px solid ${printFormat===v ? C.accent : C.border}`,
                            background: printFormat===v ? "#e3f0ff" : "white",
                            color: printFormat===v ? C.accent : C.muted, fontWeight: printFormat===v ? 600 : 400 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <Btn small onClick={printNow} disabled={printing || printQueue.filter(q=>q.checked).length===0}>
                      {printing ? <Loader size={13}/> : <Printer size={13}/>} {printing ? "กำลังสร้าง..." : "พิมพ์เลย"}
                    </Btn>
                  </div>
                </div>
                <div style={{ overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "5px 12px", width: 32, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>
                        <input type="checkbox" checked={printQueue.every(q=>q.checked)} onChange={toggleAllPrint}/>
                      </th>
                      {["เลขที่ BN","ลูกค้า","ฉบับ","รวมเงิน"].map((h, i) => (
                        <th key={i} style={{ padding: "5px 12px", textAlign: i===3?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {printQueue.map((q, i) => (
                      <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}`, opacity: q.checked ? 1 : 0.55 }}>
                        <td style={{ padding: "6px 12px" }}><input type="checkbox" checked={q.checked} onChange={() => togglePrintItem(i)}/></td>
                        <td style={{ padding: "6px 12px" }}>
                          {q.pdfUrl
                            ? <a href={q.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontWeight: 500, textDecoration: "none" }}>{q.bnNo}</a>
                            : <span style={{ color: C.accent, fontWeight: 500 }}>{q.bnNo}</span>}
                        </td>
                        <td style={{ padding: "6px 12px", fontSize: 11 }}>{q.customer}</td>
                        <td style={{ padding: "6px 12px", fontSize: 11 }}>{q.count}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(q.total||0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>{/* end queue table scroll */}
              </div>
            )}
          </div>
        </div>
      )}
      {/* #101 DN detail popup from done-state list */}
      {dnPopup && (
        <DNDetailPopup dnNo={dnPopup} cachedData={dnCacheBN[dnPopup]} onCached={(no, d) => setDnCacheBN(prev => ({ ...prev, [no]: d }))} onClose={() => setDnPopup(null)} />
      )}
    </div>
  );
}

// ── Main BN Page ───────────────────────────────────────────

function BillingNotePage({ cache, updateCache, goListRequest, onViewChange }) {
  const [view, setView_]              = useState("list"); // "list" | "create" | "detail"
  const [selectedBnNo, setSelectedBnNo] = useState(null);
  // #120 — push breadcrumb suffix (BN no / สร้าง) like DN/TI
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  // #119 — clicking the ใบวางบิล nav (active) bumps goListRequest → return to list view (matches DN/TI)
  useEffect(() => { if (goListRequest) setView("list"); }, [goListRequest]);
  // #105 — list + detail live in app-level cache so they survive navigation (like DN/TI)
  const bnList = cache["bnList"] || [];
  const [listLoading, setListLoading] = useState(!cache["bnList"]);
  const [listError, setListError]     = useState("");
  const detailKey = no => "bnDetail_" + no;

  const loadBnList = async () => {
    setListLoading(true);
    setListError("");
    try {
      const data = await api.getBillingNotes();
      updateCache("bnList", Array.isArray(data) ? data : []);
    } catch (err) {
      setListError(err.message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { if (!cache["bnList"]) loadBnList(); }, []);

  if (view === "create") return <BNCreateView onBack={() => { updateCache("bnList", null); loadBnList(); setView("list"); }} />;
  if (view === "detail") return <BNDetailView bnNo={selectedBnNo} onBack={() => setView("list")}
    cachedDetail={cache[detailKey(selectedBnNo)]}
    onDetailCached={(no, d) => updateCache(detailKey(no), d)}
    onSaved={() => { updateCache(detailKey(selectedBnNo), null); updateCache("bnList", null); loadBnList(); }} />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}><ClipboardList size={15}/> ใบวางบิล</div>
        <Btn primary small onClick={() => setView("create", "สร้างใบวางบิล")}><Plus size={13}/> สร้างใบวางบิล</Btn>
      </div>
      <BNListView
        bnList={bnList}
        loading={listLoading}
        error={listError}
        onRefresh={loadBnList}
        onRowClick={bn => { updateCache(detailKey(bn.bnNo), bn); setSelectedBnNo(bn.bnNo); setView("detail", bn.bnNo); }}
      />
    </div>
  );
}

// ============================================================
// TAX INVOICE MODULE — ใบกำกับภาษี
// ============================================================

// ── Thai Baht Text (จำนวนเงินเป็นตัวอักษร) ────────────────
function bahtText(amount) {
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

const EMPTY_TAX_ITEMS = () => Array(ITEMS_COUNT).fill(null).map(() => ({
  desc: "", desc2: "", detail: "", qty: "", unitPrice: "", amount: ""
}));

// ── Tax Invoice Form ───────────────────────────────────────
function TaxInvoiceForm({ initial, onSave, onCancel, isEdit, products, setProducts, sizes, vatRate = 0.07 }) {
  const [date,       setDate]       = useState(initial?.date       || new Date().toISOString().slice(0, 10));
  const [name,       setName]       = useState(initial?.name       || "");
  const [address,    setAddress]    = useState(initial?.address    || "");
  const [taxId,      setTaxId]      = useState(initial?.taxId      || "");
  const [phone,      setPhone]      = useState(initial?.phone      || "");
  const [invoiceRef, setInvoiceRef] = useState(initial?.invoiceRef || "");
  const [items,      setItems]      = useState(() => {
    if (!isEdit || !initial?.items) return [{ desc: "", desc2: "", detail: "", qty: "", unitPrice: "", amount: "" }];
    const rows = [];
    initial.items.filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount).forEach(it => {
      const parts = (it.detail || "").split(" | ");
      rows.push({ ...it, _orig: true, detail: parts[0] || "" });
      for (let j = 1; j < parts.length; j++) {
        rows.push({ desc: "", desc2: "", detail: parts[j], qty: "", unitPrice: "", amount: "", _cont: true });
      }
    });
    return rows;
  });
  const [removedOrigItems, setRemovedOrigItems] = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [rowEditMode,   setRowEditMode]   = useState(false);
  const [allCustomers,  setAllCustomers]  = useState([]);
  const [custWarning,   setCustWarning]   = useState(null);
  const [productWarning, setProductWarning] = useState(null); // { rowIndex, name, similar }
  const [addingProduct,  setAddingProduct]  = useState(false);
  const custConfirmedRef        = useRef(false);
  const nameSelectedFromListRef = useRef(false);

  const checkProductNameTI = (i, val) => {
    const trimmed = val.trim();
    if (!trimmed || products.includes(trimmed)) return;
    const similar = findSimilarCustomers(trimmed, products.map(p => ({ name: p })));
    setProductWarning({ rowIndex: i, name: trimmed, similar });
  };

  const checkNameSimilarity = (nameVal) => {
    if (isEdit || !nameVal.trim() || custConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, allCustomers);
    if (similar.length > 0) setCustWarning(similar);
  };

  const updateItem = (i, f, v) => setItems(items.map((it, idx) => {
    if (idx !== i || (it._cont && f !== "detail")) return it;
    const u = { ...it, [f]: v };
    if (f === "qty" || f === "unitPrice") {
      const q = parseFloat(f === "qty" ? v : it.qty) || 0;
      const p = parseFloat(f === "unitPrice" ? v : it.unitPrice) || 0;
      u.amount = q * p || "";
    }
    return u;
  }));

  const updateDetailTI = (i, val) => {
    const it = items[i];
    const testIt = { ...it, detail: val };
    if (descWidth(getDescText(testIt)) <= DESC_MAX && descWidth(val) <= DETAIL_MAX) updateItem(i, "detail", val);
  };
  const addRow    = () => { if (items.length < ITEMS_COUNT) setItems([...items, emptyItem()]); };
  const addContinuationRowTI = (afterIndex) => {
    if (items.length >= ITEMS_COUNT) return;
    const next = [...items];
    next.splice(afterIndex + 1, 0, { ...emptyItem(), _cont: true });
    setItems(next);
    setTimeout(() => {
      const inputs = document.querySelectorAll("[data-ti-detail-idx]");
      const target = [...inputs].find(el => el.dataset.tiDetailIdx === String(afterIndex + 1));
      if (target) target.focus();
    }, 30);
  };
  const removeRow = (i) => {
    if (items[i]?._orig) {
      const it = items[i];
      const note = [it.desc, it.desc2, it.qty].filter(Boolean).join(" ");
      if (note) setRemovedOrigItems(prev => [...prev, note]);
    }
    setItems(items.filter((_, idx) => idx !== i));
  };

  const sub = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const vat = parseFloat((sub * vatRate).toFixed(2));
  const gt  = parseFloat((sub + vat).toFixed(2));

  const cellInput = (i, f, a, extra = {}) => (
    <input value={items[i][f]} onChange={e => updateItem(i, f, e.target.value)}
      style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", outline: "none", textAlign: a || "left" }}
      onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
      onBlur={e => e.target.style.outline = "none"}
      {...extra} />
  );

  const handleSave = async () => {
    // Similar name check (new invoices only; skip if user already confirmed)
    if (!isEdit && !custConfirmedRef.current) {
      const similar = findSimilarCustomers(name, allCustomers);
      if (similar.length > 0) { setCustWarning(similar); return; }
    }
    custConfirmedRef.current = false;
    setCustWarning(null);
    setSaving(true);
    setError("");
    try {
      const { filled, cleanItems } = collapseItems(items);
      const payload = {
        date, name, address, taxId, phone, invoiceRef, items: cleanItems, subtotal: sub, vatAmt: vat, grandTotal: gt,
        ...(isEdit ? { _logAdded: filled.filter(it => !it._orig).length, _logDeleted: removedOrigItems } : {})
      };
      const result = isEdit
        ? await api.updateTaxInvoice(initial.id, payload)
        : await api.createTaxInvoice(payload);
      onSave({ ...payload, id: result.invoiceNo || initial?.id, pdfUrl: result.pdfUrl || initial?.pdfUrl });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
    {pendingDelete !== null && <ConfirmModal message="ยืนยันลบ?" onConfirm={() => { removeRow(pendingDelete); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} enterConfirm />}
    {custWarning && <ConfirmModal
      message={`พบชื่อที่คล้ายกันในระบบ:\n"${custWarning.join('", "')}"\n\nดำเนินการบันทึกด้วยชื่อ "${name}" ต่อใช่ไหม?`}
      onConfirm={() => { custConfirmedRef.current = true; setCustWarning(null); }}
      onCancel={() => setCustWarning(null)}
      confirmLabel="ใช่ บันทึก"
    />}
    {productWarning && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        <div style={{ background: "white", borderRadius: 10, padding: "24px 28px", minWidth: 300, maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>ไม่พบ "{productWarning.name}" ในรายการสินค้า</div>
          {productWarning.similar.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>สินค้าที่ใกล้เคียง:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {productWarning.similar.map((s, idx) => (
                  <button key={idx} onMouseDown={e => { e.preventDefault(); updateItem(productWarning.rowIndex, "desc", s); setProductWarning(null); }}
                    style={{ padding: "5px 12px", borderRadius: 4, border: `1px solid ${C.accent}`, background: "#EEF2FF", cursor: "pointer", fontSize: 12, color: C.accent, fontWeight: 500 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {productWarning.similar.length === 0 && <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>ต้องการเพิ่มสินค้านี้เข้า Config_Products หรือยกเลิก?</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { updateItem(productWarning.rowIndex, "desc", ""); setProductWarning(null); }} style={{ padding: "7px 16px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "white", cursor: "pointer", fontSize: 13 }}>ยกเลิก</button>
            <button disabled={addingProduct} onClick={async () => { setAddingProduct(true); try { await api.addProduct(productWarning.name); setProducts(prev => [...prev, productWarning.name]); } catch(e){} setAddingProduct(false); setProductWarning(null); }}
              style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: C.accent, cursor: addingProduct ? "not-allowed" : "pointer", fontSize: 13, color: "white", fontWeight: 500, opacity: addingProduct ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {addingProduct && <Loader size={13}/>}เพิ่มสินค้าใหม่
            </button>
          </div>
        </div>
      </div>
    )}
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>

      {/* Customer info */}
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <SectionTitle>ข้อมูลลูกค้า</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 140px", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่</div><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อลูกค้า / บริษัท</div>
            <CustomerAutocomplete
              value={name}
              onChange={v => { setName(v); nameSelectedFromListRef.current = false; custConfirmedRef.current = false; }}
              onSelect={c => { setName(c.name); setAddress(c.address); setPhone(c.phone); setTaxId(c.taxId); nameSelectedFromListRef.current = true; custConfirmedRef.current = true; }}
              onCustomersLoaded={setAllCustomers}
              onBlur={() => { if (!nameSelectedFromListRef.current) checkNameSimilarity(name); }}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>โทรศัพท์</div><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="เบอร์โทร" style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เลขประจำตัวผู้เสียภาษีอากร</div>
            <input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="0000000000000" maxLength={13}
              style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.06em" }} />
          </div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><input value={address} onChange={e => setAddress(e.target.value)} placeholder="ที่อยู่" style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>อ้างอิงใบส่งของเลขที่</div>
          <input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} placeholder="26-000165" style={inputStyle} />
        </div>
      </div>

      {/* Line items */}
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ marginBottom: 6 }}>
          <SectionTitle>รายการสินค้า <span style={{ fontSize: 10, fontWeight: 400, color: items.length >= ITEMS_COUNT ? C.danger : items.length >= ITEMS_COUNT - 2 ? C.warning : C.muted }}>({items.length}/{ITEMS_COUNT} แถว)</span></SectionTitle>
          <div><button onClick={() => setRowEditMode(m => !m)} style={{ fontSize: 12, color: rowEditMode ? "#2a7a3b" : C.danger, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{rowEditMode ? "เสร็จ" : "ลบ"}</button></div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <colgroup>
              <col style={{ width: 28 }} /><col style={{ width: 60 }} /><col style={{ width: 170 }} /><col style={{ width: 80 }} />
              <col /><col style={{ width: 80 }} />
              <col style={{ width: 100 }} /><col style={{ width: 50 }} />
            </colgroup>
            <thead>
              <tr style={{ background: C.sidebar }}>
                <th style={{ padding: "7px 6px", width: 28 }}></th>
                {[{ l: "จำนวน", a: "center" }, { l: "รายการ", a: "left" }, { l: "ขนาด", a: "left" }, { l: "รายละเอียด", a: "left" }, { l: "ราคาหน่วยละ", a: "right" }, { l: "จำนวนเงิน", a: "right", cs: 2 }].map((h, idx) => (
                  <th key={idx} colSpan={h.cs || 1} style={{ padding: "7px 8px", color: "white", fontWeight: 500, fontSize: 11, textAlign: h.a }}>{h.l}</th>
                ))}
                <th style={{ padding: "7px 8px", color: "white", fontWeight: 500, fontSize: 11, textAlign: "right" }}>สต.</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const b = it.amount ? Math.floor(Number(it.amount)) : null;
                const s = it.amount ? Math.round((Number(it.amount) - Math.floor(Number(it.amount))) * 100) : null;
                const dw = descWidth(getDescText(it));
                const detailW = descWidth(it.detail || "");
                const atWarn  = detailW >= DETAIL_WARN;
                const atLimit = dw >= DESC_MAX || detailW >= DETAIL_MAX;
                return (
                  <tr key={i} style={{ background: it._cont ? "#f5f7ff" : i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}`, borderLeft: atLimit ? `3px solid ${C.danger}` : atWarn ? `3px solid ${C.warning}` : it._cont ? `3px solid ${C.accent}` : "3px solid transparent" }}>
                    <td style={{ padding: "3px 4px", textAlign: "center" }}>
                      {rowEditMode && <button onClick={() => setPendingDelete(i)} title="ลบแถว" style={{ width: 14, height: 14, borderRadius: "50%", border: "none", background: "#e5534b", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0, fontWeight: 700 }}>−</button>}
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "center" }}>{!it._cont && cellInput(i, "qty", "center")}</td>
                    <td style={{ padding: "3px 6px" }}>
                      {!it._cont && <ProductAutocomplete value={it.desc} onChange={v => updateItem(i, "desc", v)} onBlur={() => checkProductNameTI(i, it.desc)} products={products} />}
                      {it._cont && <span style={{ color: C.accent, fontSize: 13, paddingLeft: 4 }}>↳</span>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>
                      {!it._cont && <select value={it.desc2} onChange={e => updateItem(i, "desc2", e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px" }}>
                        <option value="">—</option>
                        {sizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                      </select>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>
                      {cellInput(i, "detail", "left", {
                        "data-ti-detail-idx": i,
                        onChange: e => updateDetailTI(i, e.target.value),
                        onKeyDown: e => { if (e.key === "Enter") { e.preventDefault(); addContinuationRowTI(i); } }
                      })}
                      {atLimit && <div style={{ fontSize: 11, color: C.danger, marginTop: 1 }}>ถึงขีดจำกัด — กด Enter เพื่อขึ้นบรรทัดใหม่</div>}
                      {!atLimit && atWarn && <div style={{ fontSize: 11, color: C.warning, marginTop: 1 }}>ใกล้จะเต็ม — พิจารณากด Enter ขึ้นบรรทัดใหม่</div>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>{!it._cont && cellInput(i, "unitPrice", "right")}</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: b ? C.text : C.muted }}>{!it._cont && (b ? b.toLocaleString() : "—")}</td>
                    <td style={{ padding: "4px 4px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 11, color: C.muted }}>{!it._cont && (s > 0 ? String(s).padStart(2, "0") : "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addRow} disabled={items.length >= ITEMS_COUNT} style={{ fontSize: 11, color: items.length >= ITEMS_COUNT ? C.muted : C.accent, background: "none", border: `0.5px dashed ${items.length >= ITEMS_COUNT ? C.muted : C.accent}`, borderRadius: 4, padding: "4px 12px", cursor: items.length >= ITEMS_COUNT ? "not-allowed" : "pointer", marginTop: 8, width: "100%", opacity: items.length >= ITEMS_COUNT ? 0.5 : 1 }}>+ เพิ่มแถว (สินค้าใหม่) {items.length >= ITEMS_COUNT ? "— เต็ม 10 แถวแล้ว" : ""}</button>
      </div>

      {/* VAT Summary */}
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>จำนวนเงิน (ตัวอักษร)</div>
          <div style={{ fontSize: 12, padding: "8px 12px", background: "#f8f9ff", borderRadius: 6, border: `0.5px solid ${C.border}` }}>
            ({bahtText(gt)})
          </div>
        </div>
        <div style={{ minWidth: 280 }}>
          {[["รวมมูลค่าสินค้า", sub], ["จำนวนภาษีมูลค่าเพิ่ม 7%", vat]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `0.5px solid ${C.borderLight}`, fontSize: 12 }}>
              <span style={{ color: C.muted }}>{l}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 500 }}>
            <span>จำนวนเงินรวมทั้งสิ้น</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: C.accent }}>฿{gt.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {error && <div style={{ margin: "0 16px 8px", padding: "8px 12px", background: C.dangerBg, color: C.danger, borderRadius: 6, fontSize: 12 }}>⚠️ {error}</div>}

      {/* Actions */}
      <div style={{ padding: "10px 16px", background: "#fafafa", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn onClick={onCancel}>ยกเลิก</Btn>
        <Btn primary onClick={handleSave} disabled={saving || !name}>
          {saving ? <><Loader size={13}/> กำลังบันทึก...</> : (<><Receipt size={14}/> {isEdit ? "บันทึก" : "บันทึกและสร้าง PDF"}</>)}
        </Btn>
      </div>
    </div>
    </>
  );
}

// ── Tax Invoice Detail ─────────────────────────────────────
function TaxInvoiceDetail({ invoice, onBack, onSaved, products, setProducts, sizes, isCancelled, vatRate = 0.07 }) {
  const [editing, setEditing] = useState(false);
  const [data,    setData]    = useState(invoice);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading]         = useState(false);

  const fi  = (data.items || []).filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
  const sub = data.subtotal   ?? fi.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const vat = data.vatAmt     ?? parseFloat((sub * vatRate).toFixed(2));
  const gt  = data.grandTotal ?? parseFloat((sub + vat).toFixed(2));

  const generateTaxInvoicePortraitPDF = async (inv) => {
    if (data.portraitUrl) {
      const a = document.createElement("a");
      a.href = data.portraitUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    setPdfLoading(true);
    try {
      const result = await api.generateTaxInvoicePortraitPDF(inv.id);
      if (result.pdfUrl) {
        setData(d => ({ ...d, portraitUrl: result.pdfUrl }));
        const a = document.createElement("a");
        a.href = result.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const [lsPdfLoading, setLsPdfLoading] = useState(false);
  const generateLandscapePDF = async (inv) => {
    // #4: use cached pdfUrl if available — skip backend call
    if (data.pdfUrl) {
      const a = document.createElement("a");
      a.href = data.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    setLsPdfLoading(true);
    try {
      const result = await api.generateTaxInvoiceLandscapePDF(inv.id);
      if (result.pdfUrl) {
        setData(d => ({ ...d, pdfUrl: result.pdfUrl }));
        const a = document.createElement("a");
        a.href = result.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setLsPdfLoading(false);
    }
  };

  const handleCancelTaxInvoice = async () => {
    setCancelLoading(true);
    try { await api.cancelTaxInvoice(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); setShowCancelConfirm(false); }
  };
  const handleRestoreTaxInvoice = async () => {
    setCancelLoading(true);
    try { await api.restoreTaxInvoice(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); }
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {data.id}</span>
      </div>
      <TaxInvoiceForm initial={data} onSave={u => {
        setData({ ...data, ...u, pdfUrl: "", portraitUrl: "" }); // clear so both PDFs regenerate after edit
        setEditing(false);
        onSaved?.(); // invalidate list cache + reload
      }}
        onCancel={() => setEditing(false)} isEdit products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} />
    </div>
  );

  return (
    <div>
      {showCancelConfirm && <ConfirmModal message={`ยืนยันยกเลิก ${data.id}?`} confirmLabel="ยืนยันยกเลิก" onConfirm={handleCancelTaxInvoice} onCancel={() => setShowCancelConfirm(false)} loading={cancelLoading} enterConfirm />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการ</button>
          <span style={{ color: C.muted }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{data.id}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isCancelled ? (
            <Btn onClick={handleRestoreTaxInvoice} disabled={cancelLoading}>{cancelLoading ? <Loader size={13}/> : null} กู้คืน</Btn>
          ) : (
            <>
              <Btn onClick={() => generateLandscapePDF(data)} disabled={lsPdfLoading}>{lsPdfLoading ? <Loader size={13}/> : <Printer size={14}/>} พิมพ์</Btn>
              <Btn onClick={() => generateTaxInvoicePortraitPDF(data)} disabled={pdfLoading}>{pdfLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF</Btn>
              <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
              <Btn danger onClick={() => setShowCancelConfirm(true)} disabled={cancelLoading}>ยกเลิกใบนี้</Btn>
            </>
          )}
        </div>
      </div>
      {isCancelled && <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>ใบนี้ถูกยกเลิกแล้ว</div>}

      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        {/* Header info */}
        <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 12 }}>
            {[["เลขที่", data.id], ["วันที่", data.date ? new Date(data.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"], ["ชื่อลูกค้า", data.name], ["โทรศัพท์", data.phone || "—"]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            {data.address && <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><div style={{ fontSize: 12 }}>{data.address}</div></div>}
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เลขประจำตัวผู้เสียภาษีอากร</div>
              <div style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>{data.taxId || "—"}</div>
            </div>
            {data.invoiceRef && (
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>อ้างอิงใบส่งของ</div>
                <div style={{ fontSize: 12, color: C.accent }}>{data.invoiceRef}</div>
              </div>
            )}
          </div>
        </div>

        {/* Items table */}
        <div style={{ padding: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.sidebar }}>
                {[{ l: "จำนวน", a: "center" }, { l: "รายการ", a: "left" }, { l: "ขนาด", a: "left" }, { l: "รายละเอียด", a: "left" }, { l: "ราคาหน่วยละ", a: "right" }, { l: "จำนวนเงิน", a: "right", cs: 2 }].map((h, i) => (
                  <th key={i} colSpan={h.cs || 1} style={{ padding: "7px 10px", color: "white", fontWeight: 500, fontSize: 11, textAlign: h.a }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fi.map((it, i) => {
                const b = Math.floor(Number(it.amount));
                const s = Math.round((Number(it.amount) - b) * 100);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}` }}>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>{it.qty}</td>
                    <td style={{ padding: "8px 10px" }}>{it.desc}</td>
                    <td style={{ padding: "8px 10px", color: C.muted }}>{it.desc2}</td>
                    <td style={{ padding: "8px 10px", color: C.muted }}>{it.detail}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.unitPrice).toLocaleString()}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{b.toLocaleString()}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 11, color: C.muted }}>{s > 0 ? String(s).padStart(2, "0") : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* VAT summary */}
        <div style={{ padding: "0 16px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>จำนวนเงิน (ตัวอักษร)</div>
            <div style={{ fontSize: 12, padding: "8px 12px", background: "#f8f9ff", borderRadius: 6, border: `0.5px solid ${C.border}` }}>
              ({bahtText(gt)})
            </div>
          </div>
          <div style={{ minWidth: 280 }}>
            {[["รวมมูลค่าสินค้า", sub], ["จำนวนภาษีมูลค่าเพิ่ม 7%", vat]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `0.5px solid ${C.borderLight}`, fontSize: 12 }}>
                <span style={{ color: C.muted }}>{l}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 500 }}>
              <span>จำนวนเงินรวมทั้งสิ้น</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: C.accent }}>฿{gt.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tax Invoice Page ───────────────────────────────────────
function TaxInvoicePage({ products, setProducts, sizes, vatRate = 0.07, cache, updateCache, onViewChange, goListRequest }) {
  const [view,     setView_]    = useState("list");
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  useEffect(() => { if (goListRequest) setView("list", null); }, [goListRequest]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [ok,       setOk]       = useState("");
  const [search,   setSearch]   = useState("");
  const [hovered,  setHovered]  = useState(null);
  // Cancelled section
  const [cancelSectionOpen, setCancelSectionOpen] = useState(false);
  const [cancelSearch,      setCancelSearch]      = useState("");
  const [cancelLoading,     setCancelLoading]     = useState(false);
  const [cancelledList,     setCancelledList]     = useState([]);

  const now = new Date();
  const [startDate, setStartDate] = useState(
    now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-01"
  );
  const [endDate, setEndDate] = useState(
    now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")
  );

  const cacheKey = "taxinvoices_" + startDate + "_" + endDate;
  const invoices = cache[cacheKey] || [];

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const d = await api.getTaxInvoices(startDate, endDate, search);
      updateCache(cacheKey, Array.isArray(d) ? d : []);
    } catch (e) {
      setErr("โหลดไม่สำเร็จ: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, search]);

  useEffect(() => { if (!cache[cacheKey]) load(); }, [cacheKey]);

  const loadCancelledTI = useCallback(async () => {
    setCancelLoading(true);
    try {
      const d = await api.getCancelledTaxInvoices(cancelSearch);
      setCancelledList(Array.isArray(d) ? d : []);
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); }
  }, [cancelSearch]);

  const handleSaveNew = (result) => {
    setOk("สร้าง " + result.id + " สำเร็จ!");
    setSaving(false);
    setSelected(result);
    setView("detail", result.id);
    updateCache(cacheKey, null);
    load();
    setTimeout(() => { setOk(""); }, 2500);
  };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return !q || (inv.id || "").toLowerCase().includes(q) || (inv.name || "").toLowerCase().includes(q);
  });


  return (
    <div>
      {ok  &&<div style={{ background: C.successBg, color: C.success, padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{ok}</div>}
      {err && <div style={{ background: C.dangerBg,  color: C.danger,  padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{err}</div>}

      {/* List */}
      {view === "list" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}><Receipt size={15}/> ใบกำกับภาษี</div>
            <Btn primary onClick={() => setView("create", "สร้างใหม่")}>+ สร้างใบกำกับภาษีใหม่</Btn>
          </div>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {/* Filters */}
            <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
                placeholder="ค้นหา..." style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 200, height: 30 }} />
              <DateRangePicker startDate={startDate} endDate={endDate} onApply={(s, e) => { setStartDate(s); setEndDate(e); }} />
              {loading && <Loader size={14}/>}
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {filtered.length} รายการ</span>
            </div>

            {loading && <Spinner />}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบรายการ</div>
            )}
            {!loading && filtered.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 150 }} /><col style={{ width: 95 }} /><col />
                  <col style={{ width: 150 }} /><col style={{ width: 120 }} />
                </colgroup>
                <thead>
                  <tr>{["เลขที่", "วันที่", "ชื่อลูกค้า", "เลขภาษี", "ยอดสุทธิ"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.map(inv => {
                    const s = inv.subtotal ?? (inv.items || []).reduce((a, it) => a + (parseFloat(it.amount) || 0), 0);
                    const g = inv.grandTotal ?? parseFloat((s * 1.07).toFixed(2));
                    return (
                      <tr key={inv.id} onMouseEnter={() => setHovered(inv.id)} onMouseLeave={() => setHovered(null)}
                        style={{ background: hovered === inv.id ? C.rowHover : "white", borderBottom: `0.5px solid ${C.borderLight}` }}>
                        <td style={{ padding: "9px 10px" }}>
                          <a onClick={() => { setSelected(inv); setView("detail", inv.id); }} style={{ color: C.accent, cursor: "pointer", fontWeight: 500 }}>{inv.id}</a>
                        </td>
                        <td style={{ padding: "9px 10px", color: C.muted }}>
                          {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td style={{ padding: "9px 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.name}</td>
                        <td style={{ padding: "9px 10px", fontVariantNumeric: "tabular-nums", fontSize: 11, color: C.muted }}>{inv.taxId || "—"}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                          {g ? `฿${g.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div style={{ padding: "8px 12px", background: "#fafafa", borderTop: `0.5px solid ${C.border}`, display: "flex", justifyContent: "flex-end", fontSize: 12 }}>
              <span style={{ color: C.muted }}>รวม {filtered.length} รายการ</span>
            </div>
          </div>

          {/* Cancelled invoices section */}
          <div style={{ marginTop: 14 }}>
            <button onClick={() => setCancelSectionOpen(o => !o)}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
              {cancelSectionOpen ? "▼" : "▶"} ใบที่ยกเลิก
            </button>
            {cancelSectionOpen && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
                <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>
                  <input value={cancelSearch} onChange={e => setCancelSearch(e.target.value)} placeholder="ค้นหาเลขที่ / ชื่อลูกค้า..."
                    onKeyDown={e => e.key === "Enter" && loadCancelledTI()}
                    style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 220 }} />
                  <Btn primary small onClick={loadCancelledTI} disabled={cancelLoading}>
                    {cancelLoading ? <Loader size={13}/> : <><Search size={13}/> ค้นหา</>}
                  </Btn>
                </div>
                {cancelLoading && <Spinner />}
                {!cancelLoading && cancelledList.length === 0 && (
                  <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 12 }}>กรอกชื่อลูกค้าหรือเลขที่แล้วกด ค้นหา</div>
                )}
                {!cancelLoading && cancelledList.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["เลขที่", "วันที่", "ชื่อลูกค้า", "ยอดสุทธิ"].map((h, i) => (
                        <th key={i} style={{ padding: "8px 14px", textAlign: i === 3 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {cancelledList.map(inv => {
                        const s = inv.subtotal ?? (inv.items || []).reduce((a, it) => a + (parseFloat(it.amount) || 0), 0);
                        const g = inv.grandTotal ?? parseFloat((s * 1.07).toFixed(2));
                        return (
                          <tr key={inv.id} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                            <td style={{ padding: "9px 14px" }}>
                              <a onClick={() => { setSelected(inv); setView("cancelledDetail", inv.id); }} style={{ color: C.danger, cursor: "pointer", fontWeight: 500 }}>{inv.id}</a>
                            </td>
                            <td style={{ padding: "9px 14px", color: C.muted }}>
                              {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </td>
                            <td style={{ padding: "9px 14px" }}>{inv.name}</td>
                            <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                              {g ? `฿${g.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {view === "detail" && selected && (
        <TaxInvoiceDetail invoice={selected} onBack={() => setView("list", null)} onSaved={() => { updateCache(cacheKey, null); load(); }} products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} />
      )}

      {view === "cancelledDetail" && selected && (
        <TaxInvoiceDetail invoice={selected} isCancelled={true} onBack={() => setView("list", null)}
          onSaved={() => { updateCache(cacheKey, null); load(); setCancelledList(list => list.filter(i => i.id !== selected.id)); }}
          products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} />
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setView("list", null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการ</button>
            <span style={{ color: C.muted }}>›</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>สร้างใหม่</span>
          </div>
          <TaxInvoiceForm onSave={handleSaveNew} onCancel={() => setView("list", null)}
            savingExternal={saving} products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} />
        </div>
      )}
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────
function HomePage({ onNavigate }) {
  const ICON_MAP = { FileText, ClipboardList, Receipt, Package, BarChart2, LayoutDashboard, ArrowLeftRight, Users, Settings };
  const sections = [...new Set(NAV.filter(n => n.key !== "dashboard" && n.section).map(n => n.section))];
  const dashboard = NAV.find(n => n.key === "dashboard");

  const IconBox = ({ item }) => {
    const col = SECTION_COLORS[item.section] || SECTION_COLORS[null];
    const Ic = ICON_MAP[item.icon];
    return (
      <div style={{ width: 44, height: 44, borderRadius: 8, background: col.bg, color: col.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
        {Ic ? <Ic size={22} /> : item.icon}
      </div>
    );
  };

  const cardBase = { background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer" };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div onClick={() => onNavigate(dashboard.key)}
          style={{ ...cardBase, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}
          onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
          onMouseLeave={e => e.currentTarget.style.background = C.cardBg}>
          <IconBox item={dashboard} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{dashboard.label}</div>
            <div style={{ fontSize: 12, color: C.muted }}>ภาพรวมของระบบทั้งหมด</div>
          </div>
        </div>
      </div>

      {sections.map(section => (
        <div key={section} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>{section}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {NAV.filter(n => n.section === section).map(item => (
              <div key={item.key} onClick={() => onNavigate(item.key)}
                style={{ ...cardBase, width: 140, padding: "20px 12px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = C.cardBg}>
                <IconBox item={item} />
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────

export default function App({ userEmail, userName, onLogout }) {
  // ── Inject Prompt font + KC favicon on mount ──
  useEffect(() => {
    // Font
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
    // Apply globally
    document.body.style.fontFamily = "'Prompt', sans-serif";
    // Favicon — KC blue square matching sidebar badge
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#032d60"/><text x="16" y="22" font-family="sans-serif" font-weight="700" font-size="14" fill="white" text-anchor="middle">KC</text></svg>`;
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement("link");
    favicon.type = "image/svg+xml";
    favicon.rel = "shortcut icon";
    favicon.href = "data:image/svg+xml," + encodeURIComponent(svg);
    document.head.appendChild(favicon);
  }, []);

  const [breadcrumbSuffix, setBreadcrumbSuffix] = useState(null);
  const [goListRequest, setGoListRequest] = useState(0);
  const [active, setActive_]      = useState("home");
  const setActive = (key) => { setActive_(key); setBreadcrumbSuffix(null); };
  const [products, setProducts]   = useState([]);
  const [sizes, setSizes]         = useState([]);
  const [vatRate, setVatRate]     = useState(0.07);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [gsVersion, setGsVersion] = useState(null);
  const [fontScale, setFontScale] = useState(() => {
    try { return parseFloat(localStorage.getItem("kc_fontScale") || "1"); } catch { return 1; }
  });
  const changeFontScale = (delta) => setFontScale(prev => {
    const next = Math.min(1.4, Math.max(0.8, parseFloat((prev + delta).toFixed(1))));
    try { localStorage.setItem("kc_fontScale", next); } catch {}
    return next;
  });

  // ── Global data cache — persists across tab switches ──
  const [cache, setCache] = useState({});
  const updateCache = (key, data) => setCache(prev => ({ ...prev, [key]: data }));

  // Load Code.gs version on startup
  useEffect(() => { api.getVersion().then(v => { if (typeof v === "string") setGsVersion(v); }).catch(() => {}); }, []);

  // Load config once on startup for products/sizes
  useEffect(() => {
    if (SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
      // Dev mode — use defaults
      setProducts(["Product A", "Product B", "Product C", "Product D"]);
      setSizes(["S", "M", "L", "XL", "XXL", "XXXL"]);
      setConfigLoaded(true);
      return;
    }
    api.getConfig().then(cfg => {
      if (cfg.products?.length) setProducts(cfg.products);
      else setProducts(["Product A", "Product B", "Product C", "Product D"]);
      if (cfg.sizes?.length)    setSizes(cfg.sizes);
      else setSizes(["S", "M", "L", "XL", "XXL", "XXXL"]);
      if (cfg.vatRate)          setVatRate(cfg.vatRate);
      setConfigLoaded(true);
    }).catch(() => {
      setProducts(["Product A", "Product B", "Product C", "Product D"]);
      setSizes(["S", "M", "L", "XL", "XXL", "XXXL"]);
      setConfigLoaded(true);
    });
  }, []);

  const sections = [...new Set(NAV.filter(n => n.section).map(n => n.section))];

  const renderPage = () => {
    if (!configLoaded) return <Spinner text="กำลังเริ่มต้นระบบ..." />;
    switch (active) {
      case "home":       return <HomePage onNavigate={setActive} />;
      case "invoice":    return <DeliveryNotePage products={products} setProducts={setProducts} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={setBreadcrumbSuffix} goListRequest={goListRequest} />;
      case "billing":    return <BillingNotePage cache={cache} updateCache={updateCache} goListRequest={goListRequest} onViewChange={setBreadcrumbSuffix} />;
      case "taxinvoice": return <TaxInvoicePage products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} cache={cache} updateCache={updateCache} onViewChange={setBreadcrumbSuffix} goListRequest={goListRequest} />;
      case "settings":   return <SettingsPage />;
      case "customers":  return <CustomerPage />;
      case "stock":      return <ProductPage />;
      default:           return <PlaceholderPage title={NAV.find(n => n.key === active)?.label} icon={NAV.find(n => n.key === active)?.icon} />;
    }
  };

  const NAV_ICONS = { FileText, ClipboardList, Receipt, Package, BarChart2, Users, Settings, ArrowLeftRight, LayoutDashboard };

  const NavItem = ({ item }) => (
    <div onClick={() => { if (item.key === active) setGoListRequest(n => n + 1); else setActive(item.key); }} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 16px",
      cursor: "pointer",
      color: active === item.key ? "white" : "rgba(255,255,255,0.7)",
      background: active === item.key ? C.sidebarActive : "transparent",
      borderLeft: active === item.key ? `3px solid ${C.sidebarActiveBorder}` : "3px solid transparent",
      fontSize: 13, transition: "background 0.15s",
    }}>
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {NAV_ICONS[item.icon] ? React.createElement(NAV_ICONS[item.icon], { size: 16 }) : item.icon}
      </span>
      {item.label}
    </div>
  );

  const isDevMode = SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE";

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Sarabun, sans-serif" }}>
      <style>{`body { zoom: ${fontScale}; }`}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => setActive("home")} style={{ width: 32, height: 32, background: C.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "white", flexShrink: 0, cursor: "pointer" }}>KC</div>
          <div><div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>KC Factory</div><div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>ระบบจัดการโรงงาน</div></div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {NAV.filter(n => !n.section).map(item => <NavItem key={item.key} item={item} />)}
          {sections.map(section => (
            <div key={section}>
              <div style={{ padding: "12px 16px 4px", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{section}</div>
              {NAV.filter(n => n.section === section).map(item => <NavItem key={item.key} item={item} />)}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>app v1.4.76{gsVersion ? <span>  ·  gs v{gsVersion}</span> : null}</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.pageBg, minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ background: "white", borderBottom: `0.5px solid ${C.border}`, padding: "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <Home size={14}/>
            <span style={{ color: active === "home" ? C.text : C.accent, cursor: active === "home" ? "default" : "pointer" }}
              onClick={() => active !== "home" && setActive("home")}>หน้าหลัก</span>
            {NAV.find(n => n.key === active)?.section && <><span>›</span><span>{NAV.find(n => n.key === active)?.section}</span></>}
            {NAV.find(n => n.key === active)?.label && <><span>›</span>
              <span style={{ color: breadcrumbSuffix ? C.accent : C.text, cursor: breadcrumbSuffix ? "pointer" : "default" }}
                onClick={() => { if (breadcrumbSuffix) { setBreadcrumbSuffix(null); setGoListRequest(n => n + 1); } }}>
                {NAV.find(n => n.key === active)?.label}
              </span></>}
            {breadcrumbSuffix && <><span>›</span><span style={{ color: C.text }}>{breadcrumbSuffix}</span></>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button onClick={() => changeFontScale(-0.1)} style={{ background: C.pageBg, border: `0.5px solid ${C.border}`, color: C.muted, borderRadius: 4, width: 26, height: 26, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A-</button>
              <button onClick={() => changeFontScale(0.1)} style={{ background: C.pageBg, border: `0.5px solid ${C.border}`, color: C.muted, borderRadius: 4, width: 26, height: 26, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A+</button>
            </div>
            {isDevMode && (
              <div style={{ background: C.warningBg, color: C.warning, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 500 }}>
                ⚠️ Dev Mode — ยังไม่ได้ตั้งค่า SCRIPT_URL
              </div>
            )}
            {userName && <span style={{ fontSize: 12, color: C.muted }}>{userName}</span>}
            {onLogout && (
              <button onClick={onLogout} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: C.muted }}>
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "18px 22px", overflowY: "auto" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}