// ============================================================
// Invoice Admin — Web App (fork of KCFactory.jsx — TI + BN-TI only)
// ============================================================
// v0.1.6 (2026-06-26) — #193 Fix favicon color: #032d60 → #0891b2 (cyan) in dynamic useEffect SVG
// v0.1.5 (2026-06-26) — #192 Move Google auth inside App() — auth was not making it into bundle via App.jsx wrapper
// v0.1.4 (2026-06-26) — #191 Light theme: white sidebar, cyan accent; all sidebar colors via C constants
// v0.1.3 (2026-06-26) — #188 Add missing FileText + Package to lucide import (TaxInvoiceDetail + SettingsPage crash fix)
// v0.1.2 (2026-06-26) — #187 Remove company section from Settings (IA doesn't own company data); fix dnNos→tiNos in BNCustomerPanel/BNCreateView
// v0.1.1 (2026-06-26) — #186 Customer validation moved to field blur only; guardedSave delegates to checkNameOnBlur
// v0.1.0 (2026-06-25) — #185 Initial build: TI + BN-TI standalone system
// ============================================================

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { ClipboardList, Receipt, Printer, Pencil, Save, Search, RefreshCw, Loader, CheckCircle, Square, Eye, Folder, Check, Users, Settings, Plus, ChevronLeft, ChevronRight, ChevronDown, Calendar, Lock, Unlock, QrCode, Mic, Camera, Phone, Smartphone, AlertCircle, FileText, Package } from "lucide-react";

// ============================================================
// CONFIG — ใส่ Apps Script URL ที่นี่หลัง Deploy TICode.gs
// ============================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzT_r_hzNLJFFulWDgd9PU_txxmZEOcpLeE_4AVnYeuHoo1B8RF46EhZx1Y-bNJjXnceQ/exec";

// ============================================================
// API Layer
// ============================================================
const _pendingCalls = {};

async function apiCall(action, params = {}) {
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

const api = {
  // Tax Invoice
  getTaxInvoices:                  (startDate, endDate, search) => apiCall("getTaxInvoices", { startDate, endDate, search }),
  createTaxInvoice:                (data)                       => apiCall("createTaxInvoice", { data }),
  updateTaxInvoice:                (id, data)                   => apiCall("updateTaxInvoice", { id, data }),
  generateTaxInvoicePortraitPDF:   (id)                         => apiCall("generateTaxInvoicePortraitPDF", { id }),
  generateTaxInvoiceLandscapePDF:  (id)                         => apiCall("generateTaxInvoiceLandscapePDF", { id }),
  cancelTaxInvoice:                (id)                         => apiCall("cancelTaxInvoice", { id }),
  restoreTaxInvoice:               (id)                         => apiCall("restoreTaxInvoice", { id }),
  getCancelledTaxInvoices:         (search)                     => apiCall("getCancelledTaxInvoices", { search }),
  getTIDetail:                     (tiNo)                       => apiCall("getTIDetail", { tiNo }),
  // Billing Note (TI-linked)
  searchTaxInvoicesForBilling:     (startDate, endDate)         => apiCall("searchTaxInvoices", { startDate, endDate }),
  confirmBN:        (customer, reservedBnNo, invoices, bnDate, address, phone) =>
                      apiCall("confirmBillingNote", { customer, reservedBnNo, invoices, bnDate, address, phone }),
  getBillingNotes:                 ()                           => apiCall("getBillingNotes"),
  getBillingNoteDetail:            (bnNo)                       => apiCall("getBillingNoteDetail", { bnNo }),
  cancelBillingNote:               (bnNo)                       => apiCall("cancelBillingNote", { bnNo }),
  markBillingNotesPrinted:         (bnNos)                      => apiCall("markBillingNotesPrinted", { bnNos }),
  generateBillingNoteLandscapePDF: (bnNo)                       => apiCall("generateBillingNoteLandscapePDF", { bnNo }),
  generateBillingNotePortraitPDF:  (bnNo)                       => apiCall("generateBillingNotePortraitPDF", { bnNo }),
  printCombinedBillingNotes:       (bnNos, format)              => apiCall("printCombinedBillingNotes", { bnNos, format }),
  getUnbilledTIsForCustomer:       (customer)                   => apiCall("getUnbilledTIsForCustomer", { customer }),
  editBillingNote:                 (bnNo, params)               => apiCall("editBillingNote", { bnNo, ...params }),
  // Config / Products / Customers
  getConfig:     ()                        => apiCall("getConfig"),
  saveConfig:    (data)                    => apiCall("saveConfig", { data }),
  addProduct:    (name, type)              => apiCall("addProduct", { name, type }),
  getProducts:   ()                        => apiCall("getProducts"),
  updateProduct: (row, value)              => apiCall("updateProduct", { row, value }),
  deleteProduct: (row)                     => apiCall("deleteProduct", { row }),
  getCustomers:  (search)                  => apiCall("getCustomers", { search }),
  createCustomer:(data)                    => apiCall("createCustomer", { data }),
  updateCustomer:(originalName, data)      => apiCall("updateCustomer", { originalName, data }),
  deleteCustomer:(name)                    => apiCall("deleteCustomer", { name }),
  getVersion:    ()                        => apiCall("getVersion"),
};

// ── Constants ──────────────────────────────────────────────

const C = {
  sidebar: "#ffffff",
  sidebarActive: "#e8f4f8",
  sidebarActiveBorder: "#0891b2",
  sidebarBorder: "#cce8ef",
  sidebarText: "#0c2d3d",
  sidebarMuted: "#4a7a8a",
  sidebarSection: "#8ab0bc",
  pdfHeader: "#0f2942",
  accent: "#0891b2",
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
  { key: "taxinvoice", label: "ใบกำกับภาษี", icon: "Receipt",       section: "เอกสาร" },
  { key: "billing",    label: "ใบวางบิล",     icon: "ClipboardList", section: "เอกสาร" },
  { key: "settings",   label: "ตั้งค่า",       icon: "Settings",      section: "ระบบ" },
];

const SECTION_COLORS = {
  "เอกสาร": { bg: "#E6F1FB", color: "#185FA5" },
  "ระบบ":   { bg: "#F1EFE8", color: "#5F5E5A" },
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

const PAGE_SIZE = 50;
const Paginator = ({ total, page, onChange }) => {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const btnS = { background: "white", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: C.muted };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "10px 14px", borderTop: `0.5px solid ${C.border}`, fontSize: 12 }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ ...btnS, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "default" : "pointer" }}>‹ ก่อนหน้า</button>
      <span style={{ color: C.muted }}>หน้า {page} / {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ ...btnS, opacity: page === pages ? 0.4 : 1, cursor: page === pages ? "default" : "pointer" }}>ถัดไป ›</button>
    </div>
  );
};

// ── Invoice Components ─────────────────────────────────────

const ITEMS_COUNT = 10;
const emptyItem  = () => ({ desc: "", desc2: "", detail: "", qty: "", unitPrice: "", amount: "" });

const DESC_MAX   = 42;
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

function initInvoiceItems(initial, isEdit) {
  if (!isEdit || !initial?.items) return [emptyItem()];
  const rows = [];
  initial.items.filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount).forEach(it => {
    const parts = (it.detail || "").split(" | ");
    rows.push({ ...it, _orig: true, detail: parts[0] || "" });
    for (let j = 1; j < parts.length; j++) rows.push({ ...emptyItem(), _cont: true, detail: parts[j] });
  });
  return rows;
}

function useInvoiceForm({ initial, isEdit, products, detailAttr, maxRows = ITEMS_COUNT }) {
  const [items,            setItems]            = useState(() => initInvoiceItems(initial, isEdit));
  const [removedOrigItems, setRemovedOrigItems] = useState([]);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState("");
  const [pendingDelete,    setPendingDelete]    = useState(null);
  const [rowEditMode,      setRowEditMode]      = useState(false);
  const [allCustomers,     setAllCustomers]     = useState([]);
  const [custWarning,      setCustWarning]      = useState(null);
  const [newCustWarning,   setNewCustWarning]   = useState(null);
  const [productWarning,   setProductWarning]   = useState(null);
  const [addingProduct,    setAddingProduct]    = useState(false);
  const custConfirmedRef        = useRef(false);
  const skipCustomerLogRef      = useRef(false);
  const nameSelectedFromListRef = useRef(false);
  const newCustCheckedRef       = useRef(false);

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

  const checkNameOnBlur = (nameVal) => {
    if (isEdit || !nameVal.trim() || custConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, allCustomers);
    if (similar.length > 0) { setCustWarning(similar); return; }
    const isKnown = allCustomers.some(c => (c.name || "").trim().toLowerCase() === nameVal.trim().toLowerCase());
    if (!isKnown && nameVal.trim()) { setNewCustWarning(nameVal.trim()); }
    else { newCustCheckedRef.current = true; }
  };

  const updateItem = (i, field, val) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== i || (it._cont && field !== "detail")) return it;
      const updated = { ...it, [field]: val };
      if (field === "qty" || field === "unitPrice") {
        const q = parseFloat(field === "qty" ? val : it.qty) || 0;
        const p = parseFloat(field === "unitPrice" ? val : it.unitPrice) || 0;
        updated.amount = q * p || "";
      }
      return updated;
    }));
  };
  const updateDetail = (i, val) => { updateItem(i, "detail", val); };

  const addRow = () => { if (items.length < maxRows) setItems([...items, emptyItem()]); };
  const addContinuationRow = (afterIndex) => {
    if (items.length >= maxRows) return;
    const next = [...items];
    next.splice(afterIndex + 1, 0, { ...emptyItem(), _cont: true });
    setItems(next);
    setTimeout(() => {
      const inputs = document.querySelectorAll(`[${detailAttr}]`);
      const target = [...inputs].find(el => el.getAttribute(detailAttr) === String(afterIndex + 1));
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

  const cellInput = (i, field, align, extra = {}) => (
    <input value={items[i][field]} onChange={e => updateItem(i, field, e.target.value)}
      style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", outline: "none", textAlign: align || "left" }}
      onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
      onBlur={e => e.target.style.outline = "none"}
      {...extra}
    />
  );

  const guardedSave = async (name, doSave) => {
    if (!isEdit && !custConfirmedRef.current && !newCustCheckedRef.current) {
      checkNameOnBlur(name);
      return;
    }
    custConfirmedRef.current = false;
    newCustCheckedRef.current = false;
    setCustWarning(null);
    setSaving(true);
    setError("");
    try {
      const { filled, cleanItems } = collapseItems(items);
      const skipLog = skipCustomerLogRef.current;
      skipCustomerLogRef.current = false;
      await doSave({ filled, cleanItems, skipLog });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return {
    items, setItems, removedOrigItems, setRemovedOrigItems,
    saving, error, setError, pendingDelete, setPendingDelete,
    rowEditMode, setRowEditMode, allCustomers, setAllCustomers,
    custWarning, setCustWarning, newCustWarning, setNewCustWarning,
    productWarning, setProductWarning, addingProduct, setAddingProduct,
    custConfirmedRef, skipCustomerLogRef, nameSelectedFromListRef,
    checkProductName, checkNameSimilarity, checkNameOnBlur, updateItem, updateDetail,
    addRow, addContinuationRow, removeRow, cellInput, guardedSave,
    newCustCheckedRef,
  };
}

function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "ลบ", loading = false, enterConfirm = false, onSecondary, secondaryLabel }) {
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
          {onSecondary && secondaryLabel && (
            <button onClick={onSecondary} disabled={loading} style={{ padding: "7px 20px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#f5f5f5", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: C.text, opacity: loading ? 0.5 : 1 }}>{secondaryLabel}</button>
          )}
          <button onClick={onConfirm} disabled={loading} style={{ padding: "7px 20px", borderRadius: 6, border: "none", background: "#e5534b", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: "white", fontWeight: 500, opacity: loading ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {loading && <Loader size={13}/>}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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

function ProductAutocomplete({ value, onChange, onBlur, onEnter, products, style }) {
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
          if (e.key === "Enter") {
            if (open && highlightedIndex >= 0 && filtered.length > 0) {
              e.preventDefault(); onChange(filtered[highlightedIndex]); setOpen(false);
            } else if (onEnter) { e.preventDefault(); onEnter(); }
            return;
          }
          if (!open || filtered.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(i => Math.max(i - 1, 0));
          }
        }}
        onBlur={() => { setOpen(false); if (onBlur) onBlur(); }}
        placeholder="— เลือกหรือพิมพ์สินค้า —"
        style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", ...style }}
      />
      {open && filtered.length > 0 && rect && (
        <div ref={dropdownRef} style={{ position: "fixed", top: rect.bottom + 2, left: rect.left, width: rect.width, zIndex: 9000, background: "white", border: `1px solid ${C.border}`, borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 180, overflowY: "auto" }}>
          {filtered.map((p, i) => (
            <div key={i}
              onMouseDown={e => { e.preventDefault(); onChange(p); setOpen(false); }}
              onMouseEnter={() => setHighlightedIndex(i)}
              onMouseLeave={() => setHighlightedIndex(-1)}
              style={{ padding: "6px 10px", fontSize: 12, cursor: "pointer", borderBottom: `0.5px solid ${C.borderLight}`, background: highlightedIndex === i ? "#C7D7FF" : "white" }}
            >{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── QR / LINE Sharing ──────────────────────────────────────

const INSTR_STEPS = [
  { label: "เปิด Camera app บนมือถือ", sub: "กดที่ไอคอนกล้องบน Home screen", cx: 75, cy: 88 },
  { label: "ส่องกล้องไปที่ QR บนจอ PC", sub: "ใช้กล้องปกติ ไม่ใช่ LINE scanner", cx: 50, cy: 45 },
  { label: "กด link ที่โผล่ขึ้นมา", sub: "drive.google.com จะขึ้นที่ด้านล่าง", cx: 50, cy: 88 },
  { label: "PDF เปิดใน Google Drive", sub: "กด ⋮ มุมขวาบน", cx: 92, cy: 7 },
  { label: "เมนูเด้งขึ้นมุมขวาบน", sub: "เลื่อนลงหา Send a copy", cx: 70, cy: 28 },
  { label: 'กด "Send a copy"', sub: "รายการที่ไฮไลต์สีฟ้า", cx: 62, cy: 48 },
  { label: "เลือก LINE", sub: "จาก share menu ที่เด้งขึ้น", cx: 35, cy: 80 },
  { label: "เลือก contact → กด Share", sub: "ส่งให้ลูกค้าได้เลย! 🎉", cx: 88, cy: 7 },
];

const toDownloadUrl = (driveUrl) => {
  const m = driveUrl.match(/\/file\/d\/([^/]+)/);
  return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : driveUrl;
};

const renderPhoneScreen = (step) => {
  const abs = { position: "absolute", inset: 0 };
  if (step === 0) return (
    <div style={{ ...abs, background: "linear-gradient(160deg,#7ec8f7 0%,#4a8fd4 100%)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", fontSize: 6, color: "white" }}><span>13:40</span><span>▊ WiFi</span></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 20, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4, width: "80%" }}>
          <span style={{ fontSize: 9, color: "#4285F4", fontWeight: "bold" }}>G</span>
          <div style={{ flex: 1, height: 1 }} />
          <Mic size={8} color="#888" /><Camera size={8} color="#888" />
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: "10px 10px 0 0", padding: "6px 0 4px", display: "flex", justifyContent: "space-around" }}>
        {[{ bg: "#34A853", l: <Phone size={10} color="white" /> }, { bg: "#4285F4", l: "C" }, { bg: "#00B900", l: "L" }, { bg: "#607D8B", l: <Camera size={10} color="white" /> }].map((a, i) => (
          <div key={i} style={{ width: 26, height: 26, borderRadius: 8, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, outline: i === 3 ? "2px solid white" : "none" }}>{a.l}</div>
        ))}
      </div>
    </div>
  );
  if (step === 1) return (
    <div style={{ ...abs, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 60, height: 60 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 12, height: 12, borderTop: "2px solid #222", borderLeft: "2px solid #222" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 12, height: 12, borderTop: "2px solid #222", borderRight: "2px solid #222" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderBottom: "2px solid #222", borderLeft: "2px solid #222" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderBottom: "2px solid #222", borderRight: "2px solid #222" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "grid", gridTemplateColumns: "repeat(7, 5px)", gap: "0.5px" }}>
          {[1,1,1,0,1,1,1, 1,0,1,1,1,0,1, 1,1,1,0,1,1,1, 0,1,0,1,0,1,0, 1,1,1,0,1,0,1, 1,0,0,1,1,0,1, 1,1,0,0,0,1,1].map((cell, i) => (
            <div key={i} style={{ width: 5, height: 5, background: cell ? "#222" : "transparent" }} />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12, fontSize: 6, color: "#bbb" }}>
        <span>PORTRAIT</span><span style={{ color: "#333", borderBottom: "1px solid #333" }}>PHOTO</span><span>VIDEO</span>
      </div>
    </div>
  );
  if (step === 2) return (
    <div style={{ ...abs, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 60, height: 60 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 12, height: 12, borderTop: "2px solid #00c853", borderLeft: "2px solid #00c853" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 12, height: 12, borderTop: "2px solid #00c853", borderRight: "2px solid #00c853" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderBottom: "2px solid #00c853", borderLeft: "2px solid #00c853" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderBottom: "2px solid #00c853", borderRight: "2px solid #00c853" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "grid", gridTemplateColumns: "repeat(7, 5px)", gap: "0.5px" }}>
          {[1,1,1,0,1,1,1, 1,0,1,1,1,0,1, 1,1,1,0,1,1,1, 0,1,0,1,0,1,0, 1,1,1,0,1,0,1, 1,0,0,1,1,0,1, 1,1,0,0,0,1,1].map((cell, i) => (
            <div key={i} style={{ width: 5, height: 5, background: cell ? "#222" : "transparent" }} />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 6, right: 6, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <div style={{ background: "rgba(40,40,40,0.92)", borderRadius: 12, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
          <div style={{ width: 7, height: 7, border: "1.5px solid #aaa", borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 6, color: "white", flex: 1 }}>drive.google.com</span>
          <span style={{ fontSize: 6, color: "#aaa" }}>∧</span>
        </div>
        <div style={{ background: "rgba(60,60,60,0.9)", borderRadius: 10, padding: "3px 14px", fontSize: 6, color: "white" }}>Scan</div>
      </div>
    </div>
  );
  if (step === 3) return (
    <div style={{ ...abs, background: "#f1f3f4" }}>
      <div style={{ background: "white", padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 8, color: "#555" }}>←</span>
        <span style={{ fontSize: 6, color: "#333", flex: 1 }}>KC_TaxInvoice...</span>
        <span style={{ fontSize: 7, color: "#555" }}>✦</span><span style={{ fontSize: 7, color: "#555" }}>≡</span><Search size={7} color="#555" />
        <span style={{ fontSize: 11, color: "#555", fontWeight: "bold", lineHeight: 1 }}>⋮</span>
      </div>
      <div style={{ margin: "4px 5px", background: "white", borderRadius: 3, padding: "5px 6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, background: "#222", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 5, color: "white", fontWeight: "bold" }}>IA</span></div>
          <div><div style={{ fontSize: 5, fontWeight: "bold", color: "#111" }}>ห้างหุ้นส่วนจำกัด</div><div style={{ fontSize: 4, color: "#888" }}>KIMCHIANG LIMITED</div></div>
        </div>
        <div style={{ fontSize: 5, color: "#333", fontWeight: "bold", marginBottom: 3 }}>ใบกำกับภาษีอย่างย่อ</div>
        {[70, 40, 80, 35, 55, 40, 65, 30].map((w, i) => <div key={i} style={{ height: 2, background: "#e8e8e8", borderRadius: 1, width: w + "%", marginBottom: 2 }} />)}
      </div>
    </div>
  );
  if (step === 4) return (
    <div style={{ ...abs, background: "#f1f3f4" }}>
      <div style={{ background: "white", padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 8, color: "#555" }}>←</span>
        <span style={{ fontSize: 6, color: "#333", flex: 1 }}>KC_TaxInvoice...</span>
        <span style={{ fontSize: 7, color: "#555" }}>✦</span><span style={{ fontSize: 7, color: "#555" }}>≡</span><Search size={7} color="#555" />
        <span style={{ fontSize: 11, color: "#555", fontWeight: "bold", lineHeight: 1 }}>⋮</span>
      </div>
      <div style={{ margin: "4px 5px", background: "white", borderRadius: 3, padding: "5px 6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", opacity: 0.4 }}>
        {[70, 40, 80, 35, 55, 40].map((w, i) => <div key={i} style={{ height: 2, background: "#e8e8e8", borderRadius: 1, width: w + "%", marginBottom: 3 }} />)}
      </div>
      <div style={{ position: "absolute", top: 22, right: 3, background: "white", borderRadius: 4, boxShadow: "0 2px 10px rgba(0,0,0,0.25)", width: 100, zIndex: 10, overflow: "hidden" }}>
        {[["Share",""], ["Manage access",""], ["Add to starred",""], ["Make available offline",""], ["Summarise this file","New"], ["Copy link",""], ["Make a copy",""], ["Send a copy",""], ["Open with",""], ["Download",""]].map(([item, tag], i) => (
          <div key={i} style={{ padding: "3px 8px", fontSize: 6, color: "#333", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{item}</span>
            {tag === "New" && <span style={{ background: "#4CAF50", color: "white", fontSize: 4, padding: "1px 2px", borderRadius: 2 }}>New</span>}
          </div>
        ))}
      </div>
    </div>
  );
  if (step === 5) return (
    <div style={{ ...abs, background: "#f1f3f4" }}>
      <div style={{ background: "white", padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 8, color: "#555" }}>←</span>
        <span style={{ fontSize: 6, color: "#333", flex: 1 }}>KC_TaxInvoice...</span>
        <span style={{ fontSize: 7, color: "#555" }}>✦</span><span style={{ fontSize: 7, color: "#555" }}>≡</span><Search size={7} color="#555" />
        <span style={{ fontSize: 11, color: "#555", fontWeight: "bold", lineHeight: 1 }}>⋮</span>
      </div>
      <div style={{ margin: "4px 5px", background: "white", borderRadius: 3, padding: "5px 6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", opacity: 0.4 }}>
        {[70, 40, 80, 35, 55, 40].map((w, i) => <div key={i} style={{ height: 2, background: "#e8e8e8", borderRadius: 1, width: w + "%", marginBottom: 3 }} />)}
      </div>
      <div style={{ position: "absolute", top: 22, right: 3, background: "white", borderRadius: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.28)", width: 130, zIndex: 10, overflow: "hidden" }}>
        {[["Share",""], ["Manage access",""], ["Add to starred",""], ["Make available offline",""], ["Summarise this file","New"], ["Copy link",""], ["Make a copy",""], ["Send a copy","highlight"], ["Open with",""], ["Download",""]].map(([item, tag], i) => (
          <div key={i} style={{ padding: "4px 10px", fontSize: 8, color: tag === "highlight" ? "#1976d2" : "#333", background: tag === "highlight" ? "#e3f2fd" : "transparent", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{item}</span>
            {tag === "New" && <span style={{ background: "#4CAF50", color: "white", fontSize: 5, padding: "1px 3px", borderRadius: 2 }}>New</span>}
          </div>
        ))}
      </div>
    </div>
  );
  if (step === 6) return (
    <div style={{ ...abs, background: "#f1f3f4" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "10px 10px 0 0", padding: "6px 6px 4px" }}>
        <div style={{ fontSize: 7, fontWeight: "bold", color: "#111", marginBottom: 4 }}>1 item</div>
        <div style={{ background: "#f5f5f5", borderRadius: 6, padding: "5px 6px", marginBottom: 5, display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ width: 22, height: 28, background: "white", border: "1px solid #ddd", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 6, fontWeight: "bold", color: "#333" }}>PDF</span>
          </div>
          <span style={{ fontSize: 5, color: "#555", wordBreak: "break-all" }}>KC_TaxInvoice...</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 5, overflowX: "hidden" }}>
          {["#4CAF50","#2196F3","#FF9800","#9C27B0","#607D8B"].map((c, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: c, flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[{ l: "Q", color: "#607D8B", name: "Quick\nShare" }, { l: "L", color: "#00B900", name: "LINE" }, { l: "M", color: "#4285F4", name: "Msg" }, { l: "G", color: "#EA4335", name: "Gmail" }].map((a, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <div style={{ width: 22, height: 22, borderRadius: 8, background: a.color, display: "flex", alignItems: "center", justifyContent: "center", outline: i === 1 ? "2px solid #00B900" : "none" }}>
                <span style={{ fontSize: 9, color: "white", fontWeight: "bold" }}>{a.l}</span>
              </div>
              <span style={{ fontSize: 4, color: "#555", textAlign: "center", whiteSpace: "pre" }}>{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (step === 7) return (
    <div style={{ ...abs, background: "white" }}>
      <div style={{ background: "white", padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 6, color: "#333" }}>✕  1 selected</span>
        <span style={{ fontSize: 7, color: "#00B900", fontWeight: "bold" }}>Share</span>
      </div>
      <div style={{ padding: "3px 6px", background: "#f7f7f7", borderBottom: "1px solid #eee" }}>
        <div style={{ background: "white", borderRadius: 8, padding: "2px 5px", fontSize: 5, color: "#999", display: "flex", alignItems: "center", gap: 3 }}><Search size={6} color="#bbb" /> Search by name</div>
      </div>
      <div style={{ padding: "3px 6px 2px", fontSize: 5, color: "#888", fontWeight: "bold" }}>Recently shared with</div>
      {[{ name: "ลูกค้า A", color: "#4CAF50", selected: true }, { name: "Powpow", color: "#2196F3", selected: false }, { name: "กลุ่มทีม KC", color: "#FF9800", selected: false }].map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 6px", borderBottom: "1px solid #f5f5f5" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: c.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 6, color: "white" }}>{c.name[0]}</span>
          </div>
          <span style={{ fontSize: 6, color: "#333", flex: 1 }}>{c.name}</span>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: c.selected ? "#00B900" : "transparent", border: c.selected ? "none" : "1px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {c.selected && <span style={{ fontSize: 6, color: "white" }}>✓</span>}
          </div>
        </div>
      ))}
    </div>
  );
  return null;
};

// ── DateRangePicker ────────────────────────────────────────

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

// ── TI Detail Popup ─────────────────────────────────────────
// Session-wide TI detail cache (survives navigation)
const _tiStore = {};

function TIDetailPopup({ tiNo, onClose, cachedData, onCached }) {
  const seed = cachedData || _tiStore[tiNo] || null;
  const [data, setData]       = useState(seed);
  const [loading, setLoading] = useState(!seed);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (seed) return;
    api.getTIDetail(tiNo)
      .then(d => { _tiStore[tiNo] = d; setData(d); onCached?.(tiNo, d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tiNo]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 10, width: 620, maxWidth: "92vw", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `0.5px solid ${C.border}`, position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.accent }}>{tiNo}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 22, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          {loading && <Spinner />}
          {error && <ErrorBox msg={error} />}
          {data && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 14 }}>
                {[["ลูกค้า", data.customer], ["วันที่", data.date], ["โทรศัพท์", data.phone || "—"], ["รวมเงิน", `฿${(data.grandTotal||0).toLocaleString()}`]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
                ))}
              </div>
              {data.address && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>ที่อยู่</div><div style={{ fontSize: 13 }}>{data.address}</div></div>}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.pdfHeader }}>
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
                  <tr style={{ borderTop: `0.5px solid ${C.borderLight}` }}>
                    <td colSpan={5} style={{ padding: "7px 10px", textAlign: "right", color: C.muted }}>ยอดก่อนภาษี</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>฿{(data.subtotal||0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} style={{ padding: "7px 10px", textAlign: "right", color: C.muted }}>ภาษีมูลค่าเพิ่ม 7%</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>฿{(data.vatAmt||0).toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                    <td colSpan={5} style={{ padding: "9px 10px", textAlign: "right", fontWeight: 500 }}>รวมทั้งสิ้น</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: C.accent }}>฿{(data.grandTotal||0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              {data.pdfUrl && (
                <div style={{ marginTop: 14, textAlign: "right" }}>
                  <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: C.accent, border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "5px 12px", textDecoration: "none" }}>
                    เปิด PDF
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
  const [address, setAddress]       = useState(detail.address || "");
  const [phone, setPhone]           = useState(detail.phone   || "");
  const [invoices, setInvoices]     = useState(detail.invoices || []);
  const [unbilled, setUnbilled]     = useState([]);
  const [unbilledLoading, setUBL]   = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    setUBL(true);
    api.getUnbilledTIsForCustomer(detail.customer || "")
      .then(d => setUnbilled(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setUBL(false));
  }, []);

  const removeTI = (no) => setInvoices(prev => prev.filter(inv => inv.no !== no));
  const addTI    = (ti) => {
    if (invoices.find(inv => inv.no === ti.no)) return;
    setInvoices(prev => [...prev, ti]);
  };
  const available = unbilled.filter(d => !invoices.find(inv => inv.no === d.no));

  const handleSave = async () => {
    setSaving(true);
    try {
      const origNos     = new Set((detail.invoices||[]).map(inv => inv.no));
      const newNos      = new Set(invoices.map(inv => inv.no));
      const addTiNos    = [...newNos].filter(n => !origNos.has(n));
      const removeTiNos = [...origNos].filter(n => !newNos.has(n));
      await api.editBillingNote(detail.bnNo, { date: dateInput, customer, address, phone, addTiNos, removeTiNos });
      const displayDate = dateInput ? (() => { const p = dateInput.split("-"); return `${p[2]}/${p[1]}/${p[0]}`; })() : detail.date;
      onSave({ date: displayDate, customer, address, phone, invoices, count: invoices.length, total: invoices.reduce((s, inv) => s + (parseFloat(inv.total)||0), 0) });
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>ที่อยู่</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>โทรศัพท์</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>* เปลี่ยนชื่อลูกค้าจะไม่กระทบบันทึกอื่น ใช้เฉพาะใบนี้</div>
      </div>

      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500 }}>รายการใบกำกับภาษีในใบวางบิลนี้</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["เลขที่ TI", "วันที่", "รวมเงิน", ""].map((h, i) => (
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
                  <button onClick={() => removeTI(inv.no)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 18, lineHeight: 1 }} title="ลบออก">×</button>
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
          เพิ่มใบกำกับภาษี (ยังไม่วางบิล) {unbilledLoading && <Loader size={11}/>}
        </div>
        {!unbilledLoading && available.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: C.muted, fontSize: 12 }}>ไม่มีใบกำกับภาษีที่รอวางบิล</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {available.map((ti, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "8px 14px", color: C.accent, fontWeight: 500 }}>{ti.no}</td>
                  <td style={{ padding: "8px 14px", color: C.muted }}>{ti.date}</td>
                  <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(ti.total||0).toLocaleString()}</td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }}>
                    <Btn small onClick={() => addTI(ti)}><Plus size={11}/> เพิ่ม</Btn>
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
  const [lsLoading, setLsLoading]         = useState(false);
  const [ptLoading, setPtLoading]         = useState(false);
  const [tiPopup, setTiPopup]             = useState(null);
  const [tiCache, setTiCache]             = useState({});
  const [hovered, setHovered]             = useState(null);
  const [showQr, setShowQr]               = useState(false);
  const [qrLoading, setQrLoading]         = useState(false);
  const [qrUrl, setQrUrl]                 = useState("");
  const [qrDataUrl, setQrDataUrl]         = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [instrStep, setInstrStep]         = useState(0);
  useEffect(() => {
    if (!showInstructions) { setInstrStep(0); return; }
    const iv = setInterval(() => setInstrStep(s => (s + 1) % INSTR_STEPS.length), 2500);
    return () => clearInterval(iv);
  }, [showInstructions]);

  const loadDetail = () => {
    if (cachedDetail) return;
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
    setDetail(prev => ({ ...prev, ...updated, landscapeUrl: "", pdfUrl: "" }));
    setEditing(false);
    onSaved?.();
  };

  const generateLandscape = async () => {
    if (detail.landscapeUrl) { window.open(detail.landscapeUrl, "_blank", "noopener,noreferrer"); return; }
    setLsLoading(true);
    try {
      const res = await api.generateBillingNoteLandscapePDF(bnNo);
      if (res?.url) { setDetail(d => ({ ...d, landscapeUrl: res.url })); window.open(res.url, "_blank", "noopener,noreferrer"); }
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLsLoading(false); }
  };

  const generatePortrait = async () => {
    if (detail.pdfUrl) { window.open(detail.pdfUrl, "_blank", "noopener,noreferrer"); return; }
    setPtLoading(true);
    try {
      const res = await api.generateBillingNotePortraitPDF(bnNo);
      if (res?.url) { setDetail(d => ({ ...d, pdfUrl: res.url })); window.open(res.url, "_blank", "noopener,noreferrer"); }
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setPtLoading(false); }
  };

  const handleQrBN = async () => {
    const generate = async (pdfUrl) => {
      const dlUrl = toDownloadUrl(pdfUrl);
      const dataUrl = await QRCode.toDataURL(dlUrl, { width: 280, margin: 2 });
      setQrUrl(dlUrl); setQrDataUrl(dataUrl); setShowQr(true); setShowInstructions(true);
    };
    if (detail?.pdfUrl) { await generate(detail.pdfUrl); return; }
    setQrLoading(true);
    try {
      const res = await api.generateBillingNotePortraitPDF(bnNo);
      if (res?.url) { setDetail(d => ({ ...d, pdfUrl: res.url })); await generate(res.url); }
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setQrLoading(false); }
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {bnNo}</span>
      </div>
      <BNEditForm detail={detail} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
    </div>
  );

  return (
    <div>
      {showCancelConfirm && <ConfirmModal message={`ยืนยันยกเลิกใบวางบิล ${bnNo}?`} confirmLabel="ยืนยันยกเลิก" onConfirm={handleCancel} onCancel={() => setShowCC(false)} loading={cancelLoading} enterConfirm />}
      {tiPopup && <TIDetailPopup tiNo={tiPopup} onClose={() => setTiPopup(null)} cachedData={tiCache[tiPopup]} onCached={(no, d) => setTiCache(prev => ({ ...prev, [no]: d }))} />}
      {showQr && qrUrl && (
        <>
          <div onClick={() => { setShowQr(false); setShowInstructions(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200 }} />
          <div style={{ position: "fixed", zIndex: 201, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "white", borderRadius: 14, padding: "24px 24px 20px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxWidth: 300, width: "85vw" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: C.text }}>ส่ง PDF ให้ลูกค้าทาง LINE</div>
            <img src={qrDataUrl} alt="QR" style={{ width: 220, height: 220, display: "block", margin: "0 auto", borderRadius: 8 }} />
            <button onClick={() => setShowInstructions(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, margin: "14px auto 0", background: showInstructions ? C.accent : C.pageBg, border: `1px solid ${showInstructions ? C.accent : C.border}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", color: showInstructions ? "white" : C.accent }}>
              <Smartphone size={13} /> วิธีส่งบนมือถือ
            </button>
            <button onClick={() => { setShowQr(false); setShowInstructions(false); }}
              style={{ display: "block", margin: "10px auto 0", background: C.accent, color: "white", border: "none", borderRadius: 6, padding: "7px 28px", fontSize: 13, cursor: "pointer" }}>ปิด</button>
          </div>
          {showInstructions && (
            <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "33vw", minWidth: 320, background: "white", zIndex: 202, boxShadow: "-4px 0 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
              <style>{`@keyframes kc-pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.9}50%{transform:translate(-50%,-50%) scale(1.6);opacity:1}} @keyframes kc-fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>วิธีส่ง LINE บนมือถือ</span>
                <button onClick={() => setShowInstructions(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.muted, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
                <div style={{ width: 200, height: 370, borderRadius: 30, border: "6px solid #222", background: "#222", position: "relative", boxShadow: "0 8px 36px rgba(0,0,0,0.35)", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 42, height: 4, background: "#444", borderRadius: 2 }} />
                  <div style={{ position: "absolute", top: 11, right: 22, width: 6, height: 6, background: "#444", borderRadius: "50%", border: "1px solid #555" }} />
                  <div style={{ position: "absolute", top: 26, left: 5, right: 5, bottom: 34, borderRadius: 14, overflow: "hidden", background: "white" }}>
                    {renderPhoneScreen(instrStep)}
                    <div style={{ position: "absolute", left: INSTR_STEPS[instrStep].cx + "%", top: INSTR_STEPS[instrStep].cy + "%", width: 16, height: 16, borderRadius: "50%", background: "rgba(0,180,80,0.9)", border: "2px solid white", boxShadow: "0 1px 6px rgba(0,0,0,0.4)", animation: "kc-pulse 0.75s ease-in-out infinite", transition: "left 0.55s cubic-bezier(.4,0,.2,1), top 0.55s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                  <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                    {["▐▌", "○", "◁"].map((s, i) => <span key={i} style={{ fontSize: 10, color: "#777" }}>{s}</span>)}
                  </div>
                </div>
                <div key={instrStep} style={{ marginTop: 22, textAlign: "center", animation: "kc-fadein 0.3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ background: C.accent, color: "white", borderRadius: 10, fontSize: 11, padding: "2px 8px", flexShrink: 0 }}>{instrStep + 1}/{INSTR_STEPS.length}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{INSTR_STEPS[instrStep].label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted }}>{INSTR_STEPS[instrStep].sub}</div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                  {INSTR_STEPS.map((_, i) => (
                    <div key={i} onClick={() => setInstrStep(i)}
                      style={{ width: i === instrStep ? 22 : 8, height: 8, borderRadius: 4, background: i === instrStep ? C.accent : "#ddd", transition: "all 0.3s", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> รายการ</button>
          <span style={{ color: C.muted }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{bnNo}</span>
          {detail && <Badge type={detail.cancelled ? "warning" : "success"}>{detail.cancelled ? "ยกเลิก" : "ปกติ"}</Badge>}
        </div>
        {detail && !detail.cancelled && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn onClick={generateLandscape} disabled={lsLoading}>{lsLoading ? <Loader size={13}/> : <Printer size={14}/>} แบบพิมพ์</Btn>
            <Btn onClick={generatePortrait} disabled={ptLoading}>{ptLoading ? <Loader size={13}/> : null} PDF</Btn>
            <Btn onClick={handleQrBN} disabled={qrLoading}>{qrLoading ? <Loader size={13}/> : <QrCode size={14}/>} QR</Btn>
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
            <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>ใบนี้ถูกยกเลิกแล้ว</div>
          )}
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
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500 }}>รายการใบกำกับภาษี — คลิกเพื่อดูรายละเอียด</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["เลขที่ TI","วันที่","รวมเงิน"].map((h,i) => (
                    <th key={i} style={{ padding: "7px 14px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.invoices||[]).length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: C.muted }}>ไม่พบรายการ</td></tr>
                ) : (detail.invoices||[]).map((inv,i) => (
                  <tr key={i}
                    onClick={() => setTiPopup(inv.no)}
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
  const [search, setSearch]               = useState("");
  const [hovered, setHovered]             = useState(null);
  const [dStart, setDStart]               = useState("");
  const [dEnd, setDEnd]                   = useState("");
  const [cancelOpen, setCancelOpen]       = useState(false);
  const [cancelHovered, setCancelHovered] = useState(null);
  const [page, setPage]                   = useState(1);
  useEffect(() => setPage(1), [search, dStart, dEnd]);

  const parseThai = d => { if (!d) return null; const p = String(d).split("/"); return p.length === 3 ? new Date(+p[2], +p[1]-1, +p[0]) : new Date(d); };

  const applyFilters = (list) => list.filter(bn => {
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

  const active    = applyFilters(bnList.filter(bn => !bn.cancelled));
  const cancelled = bnList.filter(bn => bn.cancelled);
  const pagedBN   = active.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const BNRow = ({ bn, i, isHov, setHov }) => (
    <tr onClick={() => onRowClick(bn)} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
      style={{ background: isHov ? C.rowHover : "white", borderBottom: `0.5px solid ${C.borderLight}`, cursor: "pointer" }}>
      <td style={{ padding: "9px 14px", color: C.accent, fontWeight: 500 }}>{bn.bnNo}</td>
      <td style={{ padding: "9px 14px", color: C.muted }}>{bn.date}</td>
      <td style={{ padding: "9px 14px" }}>{bn.customer}</td>
      <td style={{ padding: "9px 14px" }}>{bn.count} ฉบับ</td>
      <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(bn.total || 0).toLocaleString()}</td>
      <td style={{ padding: "9px 14px", textAlign: "center" }}>
        {bn.pdfUrl ? (
          <a href={bn.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, color: C.accent, textDecoration: "none", border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "3px 8px", whiteSpace: "nowrap" }}>
            PDF
          </a>
        ) : <span style={{ fontSize: 11, color: C.muted }}>—</span>}
      </td>
    </tr>
  );

  const thead = (
    <thead>
      <tr>
        {["เลขที่ BN", "วันที่ออก", "ชื่อลูกค้า", "จำนวนบิล", "รวมเงิน", ""].map((h, i) => (
          <th key={i} style={{ padding: "8px 14px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", position: "sticky", top: 88, zIndex: 1 }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
  const plainThead = (
    <thead>
      <tr>
        {["เลขที่ BN", "วันที่ออก", "ชื่อลูกค้า", "จำนวนบิล", "รวมเงิน", ""].map((h, i) => (
          <th key={i} style={{ padding: "8px 14px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div>
      <div style={{ position: "sticky", top: 32, zIndex: 9, background: C.pageBg, paddingBottom: 6 }}>
        <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", background: "#fafafa", border: `0.5px solid ${C.border}`, borderRadius: "8px 8px 0 0", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเลขที่ / ลูกค้า..."
            style={{ ...inputStyle, width: 200, height: 30 }} />
          <DateRangePicker startDate={dStart} endDate={dEnd} onApply={(s, e) => { setDStart(s); setDEnd(e); }} />
          <Btn small onClick={onRefresh}><RefreshCw size={14}/> รีเฟรช</Btn>
          <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {active.length} รายการ</span>
        </div>
      </div>
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: "0 0 8px 8px", overflow: "clip", borderTop: "none" }}>
        {error && <div style={{ padding: 14 }}><ErrorBox msg={error} onRetry={onRefresh} /></div>}
        {loading && <Spinner />}
        {!loading && !error && (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              {thead}
              <tbody>
                {active.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบข้อมูล</td></tr>
                ) : pagedBN.map((bn, i) => (
                  <BNRow key={i} bn={bn} i={i} isHov={hovered === i} setHov={setHovered} />
                ))}
              </tbody>
            </table>
            <Paginator total={active.length} page={page} onChange={setPage} />
          </>
        )}
      </div>
      {!loading && cancelled.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button onClick={() => setCancelOpen(o => !o)}
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
            {cancelOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>} ใบที่ยกเลิก ({cancelled.length})
          </button>
          {cancelOpen && (
            <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "clip", marginTop: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                {plainThead}
                <tbody>
                  {cancelled.map((bn, i) => (
                    <BNRow key={i} bn={bn} i={i} isHov={cancelHovered === i} setHov={setCancelHovered} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── BN Detail Mini Popup ────────────────────────────────────

function BNDetailMiniPopup({ bnNo, onClose, onCancelled }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [confirming, setConf]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.getBillingNoteDetail(bnNo)
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bnNo]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.cancelBillingNote(bnNo);
      onCancelled(bnNo);
    } catch (e) {
      setError(e.message); setCancelling(false); setConf(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 10, width: 480, maxWidth: "92vw", maxHeight: "80vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `0.5px solid ${C.border}`, position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>{bnNo}</span>
            {data && !data.cancelled && <span style={{ fontSize: 10, background: "#eaf3de", color: "#3b6d11", padding: "1px 6px", borderRadius: 7, fontWeight: 500 }}>ปกติ</span>}
            {data?.cancelled && <span style={{ fontSize: 10, background: "#fdf0ef", color: "#c0392b", padding: "1px 6px", borderRadius: 7, fontWeight: 500 }}>ยกเลิกแล้ว</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 22, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "14px 16px" }}>
          {loading && <Spinner />}
          {error && <ErrorBox msg={error} />}
          {data && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 12 }}>
                {[["ลูกค้า", data.customer], ["วันที่", data.date], ["จำนวน", `${data.count} ฉบับ`], ["รวมเงิน", `฿${(data.total||0).toLocaleString()}`]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 10, color: C.muted, marginBottom: 1 }}>{l}</div><div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div></div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>TI ทั้งหมดในใบนี้</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    {["เลขที่ TI", "วันที่", "รวมเงิน"].map((h, i) => (
                      <th key={i} style={{ padding: "6px 10px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.invoices || []).map((inv, i) => (
                    <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                      <td style={{ padding: "7px 10px", color: C.accent, fontWeight: 500 }}>{inv.no}</td>
                      <td style={{ padding: "7px 10px", color: C.muted }}>{inv.date}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 500 }}>฿{(parseFloat(inv.total)||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.cancelled && !confirming && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Btn danger small onClick={() => setConf(true)}>ยกเลิก BN นี้</Btn>
                </div>
              )}
              {!data.cancelled && confirming && (
                <div style={{ background: "#fdf7f7", border: `0.5px solid ${C.danger}`, borderRadius: 7, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, color: C.danger }}>ยืนยันยกเลิก {bnNo}?</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>{bnNo} จะถูกยกเลิก และ TI ทั้งหมดในใบนี้จะถูกปลดออก — สามารถรวมใน BN ใหม่ได้ทันที</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <Btn small onClick={() => setConf(false)} disabled={cancelling}>ยกเลิก</Btn>
                    <Btn danger small onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? <><Loader size={11}/> กำลังยกเลิก...</> : "ยืนยันยกเลิก BN"}
                    </Btn>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BN Customer Panel ──────────────────────────────────────

function BNCustomerPanel({ cust, nextBnNo, onConfirm }) {
  const today = new Date().toISOString().slice(0, 10);
  const [bnDate, setBnDate]   = useState(today);
  const [confirming, setConf] = useState(false);
  const [error, setError]     = useState("");
  const [rows, setRows]       = useState(
    (cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: !inv.bnNo }))
  );
  const [tiPopup, setTiPopup] = useState(null);
  const [tiCache, setTiCache] = useState({});
  const [bnPopup, setBnPopup] = useState(null);
  const [address, setAddress] = useState(cust.address || "");
  const [phone, setPhone]     = useState(cust.phone || "");

  useEffect(() => {
    setBnDate(today); setError("");
    setRows((cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: !inv.bnNo })));
    setAddress(cust.address || ""); setPhone(cust.phone || "");
  }, [cust.customer]);

  const toggleRow = (idx) => setRows(prev => prev.map(r => r.idx === idx && !r.bnNo ? { ...r, checked: !r.checked } : r));
  const toggleAll = () => {
    const unbilled = rows.filter(r => !r.bnNo);
    const allChecked = unbilled.length > 0 && unbilled.every(r => r.checked);
    setRows(prev => prev.map(r => r.bnNo ? r : { ...r, checked: !allChecked }));
  };

  const selectedRows = rows.filter(r => r.checked);
  const grandTotal   = selectedRows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

  const handleConfirm = async () => {
    if (selectedRows.length === 0) return;
    setConf(true); setError("");
    try {
      const invoices = selectedRows.map(r => ({ no: r.no, date: r.date, total: r.total }));
      const result = await api.confirmBN(cust.customer, nextBnNo, invoices, bnDate, address, phone);
      onConfirm({ bnNo: result.bnNo, pdfUrl: result.pdfUrl, customer: cust.customer, count: selectedRows.length, total: grandTotal, date: bnDate, tiNos: selectedRows.map(r => r.no) });
    } catch (e) {
      setError(e.message); setConf(false);
    }
  };

  return (
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{cust.customer}</span>
        <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{nextBnNo}</span>
      </div>
      {(cust.invoices || []).some(inv => inv.bnNo) && (() => {
        const bnGroups = {};
        (cust.invoices || []).forEach(inv => { if (inv.bnNo) { if (!bnGroups[inv.bnNo]) bnGroups[inv.bnNo] = []; bnGroups[inv.bnNo].push(inv.no); } });
        return (
          <div style={{ background: "#f8faff", borderBottom: `0.5px solid ${C.borderLight}` }}>
            <div style={{ padding: "5px 14px 3px", fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
              BN ที่สร้างแล้วในเดือนนี้
            </div>
            {Object.entries(bnGroups).map(([bNo, tiNos]) => (
              <div key={bNo} style={{ padding: "3px 14px 6px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", borderTop: `0.5px solid ${C.borderLight}` }}>
                <span onClick={() => setBnPopup(bNo)} style={{ fontSize: 11, fontWeight: 500, color: C.accent, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{bNo} →</span>
                <span style={{ fontSize: 10, color: C.muted }}>{tiNos.length} ฉบับ</span>
                {tiNos.map(no => <span key={no} style={{ fontSize: 9, background: "#eaf3de", color: "#3b6d11", padding: "1px 5px", borderRadius: 3 }}>{no}</span>)}
              </div>
            ))}
          </div>
        );
      })()}
      <div style={{ padding: "8px 14px", borderBottom: `0.5px solid ${C.borderLight}`, display: "grid", gridTemplateColumns: "60px 1fr", gap: "6px 10px", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.muted }}>ที่อยู่</span>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%", fontSize: 11 }} />
        <span style={{ fontSize: 11, color: C.muted }}>โทรศัพท์</span>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%", fontSize: 11 }} />
      </div>
      <div style={{ padding: "10px 14px", borderBottom: `0.5px solid ${C.borderLight}` }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่ออกใบวางบิล</div>
        <input type="date" value={bnDate} onChange={e => setBnDate(e.target.value)} style={{ ...inputStyle, width: 190 }} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: "7px 14px", width: 32, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>
              <input type="checkbox" checked={rows.every(r => r.checked)} onChange={toggleAll} />
            </th>
            {["เลขที่ TI", "วันที่", "รวมเงิน"].map((h, i) => (
              <th key={i} style={{ padding: "7px 14px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <React.Fragment key={row.idx}>
              <tr style={{ borderBottom: row.bnNo ? "none" : `0.5px solid ${C.borderLight}`, background: row.bnNo ? "#fafafa" : (row.checked ? "white" : "#fafafa"), opacity: row.bnNo ? 0.5 : (row.checked ? 1 : 0.55) }}>
                <td style={{ padding: "8px 14px", opacity: row.bnNo ? 1 : undefined }}>
                  <input type="checkbox" checked={row.checked} disabled={!!row.bnNo} onChange={() => toggleRow(row.idx)} style={{ cursor: row.bnNo ? "not-allowed" : "pointer" }} />
                </td>
                <td style={{ padding: "8px 14px" }}>
                  <span onClick={() => setTiPopup(row.no)} style={{ color: row.bnNo ? C.muted : C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{row.no}</span>
                </td>
                <td style={{ padding: "8px 14px", color: C.muted }}>{row.date}</td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(parseFloat(row.total)||0).toLocaleString()}</td>
              </tr>
              {row.bnNo && (
                <tr style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <div style={{ background: "#fff8e1", borderTop: `0.5px solid #fac775`, padding: "5px 10px 5px 36px", fontSize: 10, color: "#633806", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <AlertCircle size={11} style={{ color: "#854f0b", flexShrink: 0, marginLeft: -20 }}/>
                      {row.no} อยู่ใน {row.bnNo} แล้ว — ถ้าต้องการรวม TI นี้ ให้
                      <span onClick={() => setBnPopup(row.bnNo)} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>ยกเลิก {row.bnNo} →</span>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
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
      {tiPopup && (
        <TIDetailPopup
          tiNo={tiPopup}
          cachedData={tiCache[tiPopup]}
          onCached={(no, d) => setTiCache(prev => ({ ...prev, [no]: d }))}
          onClose={() => setTiPopup(null)}
        />
      )}
      {bnPopup && (
        <BNDetailMiniPopup
          bnNo={bnPopup}
          onClose={() => setBnPopup(null)}
          onCancelled={(cancelledBnNo) => {
            setRows(prev => prev.map(r => r.bnNo === cancelledBnNo ? { ...r, bnNo: "", checked: true } : r));
            setBnPopup(null);
          }}
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
  const [printFormat, setPrintFormat] = useState("portrait");
  const [printing, setPrinting]       = useState(false);
  const [tiPopup, setTiPopup]         = useState(null);
  const [tiCacheBN, setTiCacheBN]     = useState({});
  const [monthCache, setMonthCache]   = useState({});
  const [ptLoading, setPtLoading]     = useState(false);

  const goMonth = (dir) => {
    let m = month + dir, y = year;
    if (m < 1)  { m = 12; y = y - 1; }
    if (m > 12) { m = 1;  y = y + 1; }
    setMonth(m); setYear(y); setSelectedIdx(null);
    handleSearch(m, y);
  };

  const handleSearch = async (mArg = month, yArg = year, force = false) => {
    const cacheKey = `${yArg}-${mArg}`;
    if (!force && monthCache[cacheKey]) {
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
      const data = await api.searchTaxInvoicesForBilling(startDate, endDate);
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

  useEffect(() => { handleSearch(); }, []);

  const handleConfirm = (result) => {
    setCustomers(prev => prev.map((c, i) => {
      if (i !== selectedIdx) return c;
      const confirmedSet = new Set(result.tiNos || []);
      const updatedInvoices = (c.invoices || []).map(inv =>
        confirmedSet.has(inv.no) ? { ...inv, bnNo: result.bnNo } : inv
      );
      const allBilled = updatedInvoices.length > 0 && updatedInvoices.every(inv => inv.bnNo);
      return { ...c, generated: allBilled, invoices: updatedInvoices, createdBnNo: result.bnNo, createdPdfUrl: result.pdfUrl, createdCount: result.count, createdTotal: result.total, createdDate: result.date };
    }));
    const parts = result.bnNo.split("-");
    const n = parseInt(parts[parts.length-1], 10) + 1;
    const yy = new Date().getFullYear().toString().slice(-2);
    setNextBnNo(`${yy}-BN-${String(n).padStart(6,"0")}`);
    setPrintQueue(prev => [...prev, { ...result, checked: true }]);
    setMonthCache(prev => { const n = { ...prev }; delete n[`${year}-${month}`]; return n; });
    setCustomers(prev => {
      const nextPending = prev.findIndex((c, i) => i > selectedIdx && !c.generated);
      if (nextPending >= 0) setSelectedIdx(nextPending);
      return prev;
    });
  };

  const handleGenBnPdf = async () => {
    const bnNo = selectedCust?.createdBnNo;
    if (!bnNo) return;
    if (selectedCust.createdPdfUrl) { window.open(selectedCust.createdPdfUrl, "_blank", "noopener,noreferrer"); return; }
    setPtLoading(true);
    try {
      const res = await api.generateBillingNotePortraitPDF(bnNo);
      if (res?.url) {
        setCustomers(prev => prev.map((c, i) => i === selectedIdx ? { ...c, createdPdfUrl: res.url } : c));
        window.open(res.url, "_blank", "noopener,noreferrer");
      }
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setPtLoading(false); }
  };

  const togglePrintItem = (i) => setPrintQueue(prev => prev.map((q, j) => j===i ? { ...q, checked: !q.checked } : q));
  const toggleAllPrint  = () => {
    const allChecked = printQueue.every(q => q.checked);
    setPrintQueue(prev => prev.map(q => ({ ...q, checked: !allChecked })));
  };
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "0 0 10px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={13}/> กลับ
          </button>
          <span style={{ fontSize: 15, fontWeight: 500 }}>สร้างใบวางบิล</span>
        </div>
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
        {loading && <div style={{ marginTop: 8 }}><Spinner text="กำลังดึงข้อมูลใบกำกับภาษี..." /></div>}
      </div>

      {!loading && searched && customers.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>ไม่พบใบกำกับภาษีในเดือนนี้</div>
      )}
      {!loading && searched && customers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, flex: 1, minHeight: 0 }}>
          <div style={{ overflowY: "auto", scrollbarGutter: "stable", display: "flex", flexDirection: "column", gap: 6, paddingRight: 2 }}>
            {customers.map((cust, i) => {
              const total      = cust.invoices.reduce((s, inv) => s + (parseFloat(inv.total)||0), 0);
              const isSelected = selectedIdx === i;
              return (
                <div key={i} onClick={() => setSelectedIdx(i)}
                  style={{ background: C.cardBg, border: `0.5px solid ${isSelected ? C.accent : C.border}`, borderLeft: `3px solid ${isSelected ? C.accent : cust.generated ? C.success : C.borderLight}`, borderRadius: "0 6px 6px 0", padding: "9px 10px", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{cust.customer}</span>
                    {(() => {
                      const billedCnt = (cust.invoices || []).filter(inv => inv.bnNo).length;
                      const totalCnt  = (cust.invoices || []).length;
                      if (cust.generated) return <Badge type="success"><CheckCircle size={8}/> สร้างแล้ว</Badge>;
                      if (billedCnt > 0) return <Badge type="info">สร้าง {billedCnt}/{totalCnt}</Badge>;
                      return <Badge type="warning">ยังไม่สร้าง</Badge>;
                    })()}
                  </div>
                  {cust.generated && cust.createdBnNo
                    ? <div style={{ fontSize: 10, color: C.accent }}>{cust.createdBnNo}</div>
                    : <div style={{ fontSize: 10, color: C.muted }}>{cust.invoices.length} ฉบับ · ฿{total.toLocaleString()}</div>}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
           <div style={{ flex: "0 1 auto", minHeight: 0, overflowY: "auto", scrollbarGutter: "stable", display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedCust && !selectedCust.generated && (
              <BNCustomerPanel
                key={selectedCust.customer}
                cust={selectedCust}
                nextBnNo={nextBnNo}
                onConfirm={handleConfirm}
              />
            )}
            {selectedCust && selectedCust.generated && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", background: "#e8f5e9", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={14} style={{ color: C.success }}/>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedCust.customer}</span>
                  <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{selectedCust.createdBnNo}</span>
                </div>
                <div style={{ padding: "12px 14px", display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12 }}>
                  <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>วันที่</div><div>{selectedCust.createdDate || "-"}</div></div>
                  <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>จำนวนบิล</div><div>{selectedCust.createdCount} ฉบับ</div></div>
                  <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>รวมเงิน</div><div style={{ fontWeight: 600, color: C.accent }}>฿{(selectedCust.createdTotal||0).toLocaleString()}</div></div>
                  <div style={{ alignSelf: "flex-end" }}>
                    <Btn small onClick={handleGenBnPdf} disabled={ptLoading}>
                      {ptLoading ? <Loader size={13}/> : null} PDF
                    </Btn>
                  </div>
                </div>
                {(selectedCust.invoices || []).length > 0 && (
                  <div style={{ borderTop: `0.5px solid ${C.borderLight}` }}>
                    <div style={{ padding: "6px 14px", fontSize: 11, color: C.muted, background: "#fafafa" }}>ใบกำกับภาษีในใบวางบิลนี้</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <tbody>
                        {selectedCust.invoices.map((inv, i) => (
                          <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                            <td style={{ padding: "7px 14px" }}>
                              <span onClick={() => setTiPopup(inv.no)} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{inv.no}</span>
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
            {!selectedCust && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
                เลือกลูกค้าจากรายการทางซ้าย
              </div>
            )}
           </div>
            {printQueue.length > 0 && (
              <div style={{ flexShrink: 0, maxHeight: "42%", display: "flex", flexDirection: "column", background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                    <Printer size={13}/> คิวพิมพ์ ({printQueue.filter(q=>q.checked).length}/{printQueue.length})
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>รูปแบบ</span>
                      {[["portrait", "PDF"],["landscape", "แบบพิมพ์"]].map(([v,l]) => (
                        <button key={v} onClick={() => setPrintFormat(v)} disabled={printing}
                          style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, cursor: printing ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 3,
                            border: `0.5px solid ${printFormat===v ? C.accent : C.border}`,
                            background: printFormat===v ? "#e3f0ff" : "white",
                            color: printFormat===v ? C.accent : C.muted, fontWeight: printFormat===v ? 600 : 400 }}>{l}
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
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {tiPopup && (
        <TIDetailPopup tiNo={tiPopup} cachedData={tiCacheBN[tiPopup]} onCached={(no, d) => setTiCacheBN(prev => ({ ...prev, [no]: d }))} onClose={() => setTiPopup(null)} />
      )}
    </div>
  );
}

// ── Billing Note Page ──────────────────────────────────────

function BillingNotePage({ cache, updateCache, goListRequest, onViewChange }) {
  const [view, setView_]              = useState("list");
  const [selectedBnNo, setSelectedBnNo] = useState(null);
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  useEffect(() => { if (goListRequest) setView("list"); }, [goListRequest]);
  const bnList = cache["bnList"] || [];
  const [listLoading, setListLoading] = useState(!cache["bnList"]);
  const [listError, setListError]     = useState("");
  const detailKey = no => "bnDetail_" + no;

  const loadBnList = async () => {
    setListLoading(true); setListError("");
    try {
      const data = await api.getBillingNotes();
      updateCache("bnList", Array.isArray(data) ? data : []);
    } catch (err) { setListError(err.message); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (!cache?.["bnList"]) loadBnList(); }, []);

  if (view === "create") return <BNCreateView onBack={() => { updateCache("bnList", null); loadBnList(); setView("list"); }} />;
  if (view === "detail") return <BNDetailView bnNo={selectedBnNo} onBack={() => setView("list")}
    cachedDetail={cache[detailKey(selectedBnNo)]}
    onDetailCached={(no, d) => updateCache(detailKey(no), d)}
    onSaved={() => { updateCache(detailKey(selectedBnNo), null); updateCache("bnList", null); loadBnList(); }} />;

  return (
    <div>
      <div style={{ position: "sticky", top: -18, zIndex: 10, background: C.pageBg, paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}><ClipboardList size={15}/> ใบวางบิล</div>
          <Btn primary onClick={() => setView("create", "สร้างใบวางบิล")}>+ สร้างใบวางบิล</Btn>
        </div>
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

// ── bahtText ───────────────────────────────────────────────

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
  const {
    items, removedOrigItems, saving, error, pendingDelete, setPendingDelete,
    rowEditMode, setRowEditMode, allCustomers, setAllCustomers,
    custWarning, setCustWarning, newCustWarning, setNewCustWarning,
    productWarning, setProductWarning, addingProduct, setAddingProduct,
    custConfirmedRef, skipCustomerLogRef, nameSelectedFromListRef,
    checkProductName, checkNameSimilarity, checkNameOnBlur, updateItem, updateDetail,
    addRow, addContinuationRow, removeRow, cellInput, guardedSave,
    newCustCheckedRef,
  } = useInvoiceForm({ initial, isEdit, products, detailAttr: "data-ti-detail-idx" });

  const sub = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const vat = parseFloat((sub * vatRate).toFixed(2));
  const gt  = parseFloat((sub + vat).toFixed(2));

  const handleSave = () => guardedSave(name, async ({ filled, cleanItems, skipLog }) => {
    const payload = {
      date, name, address, taxId, phone, invoiceRef, items: cleanItems, subtotal: sub, vatAmt: vat, grandTotal: gt,
      ...(isEdit ? { _logAdded: filled.filter(it => !it._orig).length, _logDeleted: removedOrigItems } : { skipAutoLog: skipLog })
    };
    const result = isEdit
      ? await api.updateTaxInvoice(initial.id, payload)
      : await api.createTaxInvoice(payload);
    onSave({ ...payload, id: result.invoiceNo || initial?.id, pdfUrl: result.pdfUrl || initial?.pdfUrl });
  });

  return (
    <>
    {pendingDelete !== null && <ConfirmModal message="ยืนยันลบ?" onConfirm={() => { removeRow(pendingDelete); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} enterConfirm />}
    {custWarning && <ConfirmModal
      message={`พบชื่อที่คล้ายกันในระบบ:\n"${custWarning.map(c => c.name).join('", "')}"\n\nหมายถึงลูกค้านี้ใช่ไหม?`}
      onConfirm={() => { const m = custWarning[0]; setName(m.name); setAddress(m.address || ""); setPhone(m.phone || ""); custConfirmedRef.current = true; setCustWarning(null); }}
      secondaryLabel="ไม่ ใช้ชื่อที่พิมพ์"
      onSecondary={() => {
        custConfirmedRef.current = true; setCustWarning(null);
        const isKnown = allCustomers.some(c => (c.name || "").trim().toLowerCase() === name.trim().toLowerCase());
        if (!isKnown && name.trim()) setNewCustWarning(name.trim());
        else newCustCheckedRef.current = true;
      }}
      onCancel={() => setCustWarning(null)}
      confirmLabel="ใช่ ใช้ชื่อนี้"
    />}
    {newCustWarning && <ConfirmModal
      message={`ลูกค้า "${newCustWarning}" ยังไม่มีในระบบ — บันทึกเป็นลูกค้าใหม่ด้วยหรือไม่?`}
      onConfirm={() => { newCustCheckedRef.current = true; custConfirmedRef.current = true; setNewCustWarning(null); }}
      secondaryLabel="ไม่ ไม่ต้องเพิ่ม"
      onSecondary={() => { newCustCheckedRef.current = true; custConfirmedRef.current = true; skipCustomerLogRef.current = true; setNewCustWarning(null); }}
      onCancel={() => setNewCustWarning(null)}
      confirmLabel="ใช่ เพิ่มลูกค้าใหม่"
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
            <button onClick={() => { setProductWarning(null); }} style={{ padding: "7px 16px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "white", cursor: "pointer", fontSize: 13 }}>ยกเลิก</button>
            <button disabled={addingProduct} onClick={async () => { setAddingProduct(true); try { await api.addProduct(productWarning.name); setProducts(prev => [...prev, productWarning.name]); } catch(e){} setAddingProduct(false); setProductWarning(null); }}
              style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: C.accent, cursor: addingProduct ? "not-allowed" : "pointer", fontSize: 13, color: "white", fontWeight: 500, opacity: addingProduct ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {addingProduct && <Loader size={13}/>}เพิ่มสินค้าใหม่
            </button>
          </div>
        </div>
      </div>
    )}
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <SectionTitle>ข้อมูลลูกค้า</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 140px", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่</div><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อลูกค้า / บริษัท</div>
            <CustomerAutocomplete
              value={name}
              onChange={v => { setName(v); nameSelectedFromListRef.current = false; custConfirmedRef.current = false; newCustCheckedRef.current = false; }}
              onSelect={c => { setName(c.name); setAddress(c.address); setPhone(c.phone); setTaxId(c.taxId); nameSelectedFromListRef.current = true; custConfirmedRef.current = true; }}
              onCustomersLoaded={setAllCustomers}
              onBlur={() => { if (!nameSelectedFromListRef.current) checkNameOnBlur(name); }}
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
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ marginBottom: 6 }}>
          <SectionTitle>รายการสินค้า <span style={{ fontSize: 10, fontWeight: 400, color: items.length >= ITEMS_COUNT ? C.danger : items.length >= ITEMS_COUNT - 2 ? C.warning : C.muted }}>({items.length}/{ITEMS_COUNT} แถว)</span></SectionTitle>
          <div><button onClick={() => setRowEditMode(m => !m)} style={{ fontSize: 12, color: rowEditMode ? "#2a7a3b" : C.danger, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{rowEditMode ? "เสร็จ" : "ลบ"}</button></div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <colgroup>
              <col style={{ width: 28 }} /><col style={{ width: 60 }} /><col style={{ width: 170 }} /><col style={{ width: 80 }} />
              <col /><col style={{ width: 80 }} /><col style={{ width: 100 }} /><col style={{ width: 50 }} />
            </colgroup>
            <thead>
              <tr style={{ background: C.pdfHeader }}>
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
                const dw = descWidth(it.desc || "");
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
                      {!it._cont && <ProductAutocomplete value={it.desc} onChange={v => updateItem(i, "desc", v)} onBlur={() => checkProductName(i, it.desc)} products={products} />}
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
                        onChange: e => updateDetail(i, e.target.value),
                        onKeyDown: e => { if (e.key === "Enter") { e.preventDefault(); addContinuationRow(i); } }
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
        <div style={{ position: "sticky", bottom: 0, background: C.pageBg, paddingTop: 6, paddingBottom: 6 }}>
          <button onClick={addRow} disabled={items.length >= ITEMS_COUNT} style={{ fontSize: 11, color: items.length >= ITEMS_COUNT ? C.muted : C.accent, background: "none", border: `0.5px dashed ${items.length >= ITEMS_COUNT ? C.muted : C.accent}`, borderRadius: 4, padding: "4px 12px", cursor: items.length >= ITEMS_COUNT ? "not-allowed" : "pointer", width: "100%", opacity: items.length >= ITEMS_COUNT ? 0.5 : 1 }}>+ เพิ่มแถว (สินค้าใหม่) {items.length >= ITEMS_COUNT ? "— เต็ม 10 แถวแล้ว" : ""}</button>
        </div>
      </div>
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>จำนวนเงิน (ตัวอักษร)</div>
          <div style={{ fontSize: 12, padding: "8px 12px", background: "#f8f9ff", borderRadius: 6, border: `0.5px solid ${C.border}` }}>({bahtText(gt)})</div>
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
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [lsPdfLoading, setLsPdfLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading]         = useState(false);
  const [showQr, setShowQr]                       = useState(false);
  const [qrLoading, setQrLoading]                 = useState(false);
  const [qrUrl, setQrUrl]                         = useState("");
  const [qrDataUrl, setQrDataUrl]                 = useState("");
  const [showInstructions, setShowInstructions]   = useState(false);
  const [instrStep, setInstrStep]                 = useState(0);
  useEffect(() => {
    if (!showInstructions) { setInstrStep(0); return; }
    const iv = setInterval(() => setInstrStep(s => (s + 1) % INSTR_STEPS.length), 2500);
    return () => clearInterval(iv);
  }, [showInstructions]);

  const fi  = (data.items || []).filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
  const sub = data.subtotal   ?? fi.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const vat = data.vatAmt     ?? parseFloat((sub * vatRate).toFixed(2));
  const gt  = data.grandTotal ?? parseFloat((sub + vat).toFixed(2));

  const openUrl = (url) => { const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; document.body.appendChild(a); a.click(); document.body.removeChild(a); };

  const generatePortraitPDF = async () => {
    if (data.portraitUrl) { openUrl(data.portraitUrl); return; }
    setPdfLoading(true);
    try { const r = await api.generateTaxInvoicePortraitPDF(data.id); if (r.pdfUrl) { setData(d => ({ ...d, portraitUrl: r.pdfUrl })); openUrl(r.pdfUrl); } }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setPdfLoading(false); }
  };

  const generateLandscapePDF = async () => {
    if (data.pdfUrl) { openUrl(data.pdfUrl); return; }
    setLsPdfLoading(true);
    try { const r = await api.generateTaxInvoiceLandscapePDF(data.id); if (r.pdfUrl) { setData(d => ({ ...d, pdfUrl: r.pdfUrl })); openUrl(r.pdfUrl); } }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLsPdfLoading(false); }
  };

  const handleCancelTI = async () => {
    setCancelLoading(true);
    try { await api.cancelTaxInvoice(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); setShowCancelConfirm(false); }
  };

  const handleRestoreTI = async () => {
    setCancelLoading(true);
    try { await api.restoreTaxInvoice(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); }
  };

  const handleQrTI = async () => {
    const generate = async (pdfUrl) => {
      const dlUrl = toDownloadUrl(pdfUrl);
      const dataUrl = await QRCode.toDataURL(dlUrl, { width: 280, margin: 2 });
      setQrUrl(dlUrl); setQrDataUrl(dataUrl); setShowQr(true); setShowInstructions(true);
    };
    if (data.portraitUrl) { await generate(data.portraitUrl); return; }
    setQrLoading(true);
    try { const r = await api.generateTaxInvoicePortraitPDF(data.id); if (r.pdfUrl) { setData(d => ({ ...d, portraitUrl: r.pdfUrl })); await generate(r.pdfUrl); } }
    catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setQrLoading(false); }
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {data.id}</span>
      </div>
      <TaxInvoiceForm initial={data}
        onSave={u => { setData({ ...data, ...u, pdfUrl: "", portraitUrl: "" }); setEditing(false); onSaved?.(); }}
        onCancel={() => setEditing(false)} isEdit products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} />
    </div>
  );

  return (
    <div>
      {showCancelConfirm && <ConfirmModal message={`ยืนยันยกเลิก ${data.id}?`} confirmLabel="ยืนยันยกเลิก" onConfirm={handleCancelTI} onCancel={() => setShowCancelConfirm(false)} loading={cancelLoading} enterConfirm />}
      {showQr && qrUrl && (
        <>
          <div onClick={() => { setShowQr(false); setShowInstructions(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200 }} />
          <div style={{ position: "fixed", zIndex: 201, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "white", borderRadius: 14, padding: "24px 24px 20px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxWidth: 300, width: "85vw" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: C.text }}>ส่ง PDF ให้ลูกค้าทาง LINE</div>
            <img src={qrDataUrl} alt="QR" style={{ width: 220, height: 220, display: "block", margin: "0 auto", borderRadius: 8 }} />
            <button onClick={() => setShowInstructions(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, margin: "14px auto 0", background: showInstructions ? C.accent : C.pageBg, border: `1px solid ${showInstructions ? C.accent : C.border}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", color: showInstructions ? "white" : C.accent }}>
              <Smartphone size={13} /> วิธีส่งบนมือถือ
            </button>
            <button onClick={() => { setShowQr(false); setShowInstructions(false); }}
              style={{ display: "block", margin: "10px auto 0", background: C.accent, color: "white", border: "none", borderRadius: 6, padding: "7px 28px", fontSize: 13, cursor: "pointer" }}>ปิด</button>
          </div>
          {showInstructions && (
            <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "33vw", minWidth: 320, background: "white", zIndex: 202, boxShadow: "-4px 0 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
              <style>{`@keyframes kc-pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.9}50%{transform:translate(-50%,-50%) scale(1.6);opacity:1}} @keyframes kc-fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>วิธีส่ง LINE บนมือถือ</span>
                <button onClick={() => setShowInstructions(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.muted, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
                <div style={{ width: 200, height: 370, borderRadius: 30, border: "6px solid #222", background: "#222", position: "relative", boxShadow: "0 8px 36px rgba(0,0,0,0.35)", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 42, height: 4, background: "#444", borderRadius: 2 }} />
                  <div style={{ position: "absolute", top: 11, right: 22, width: 6, height: 6, background: "#444", borderRadius: "50%", border: "1px solid #555" }} />
                  <div style={{ position: "absolute", top: 26, left: 5, right: 5, bottom: 34, borderRadius: 14, overflow: "hidden", background: "white" }}>
                    {renderPhoneScreen(instrStep)}
                    <div style={{ position: "absolute", left: INSTR_STEPS[instrStep].cx + "%", top: INSTR_STEPS[instrStep].cy + "%", width: 16, height: 16, borderRadius: "50%", background: "rgba(0,180,80,0.9)", border: "2px solid white", boxShadow: "0 1px 6px rgba(0,0,0,0.4)", animation: "kc-pulse 0.75s ease-in-out infinite", transition: "left 0.55s cubic-bezier(.4,0,.2,1), top 0.55s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                  <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                    {["▐▌", "○", "◁"].map((s, i) => <span key={i} style={{ fontSize: 10, color: "#777" }}>{s}</span>)}
                  </div>
                </div>
                <div key={instrStep} style={{ marginTop: 22, textAlign: "center", animation: "kc-fadein 0.3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ background: C.accent, color: "white", borderRadius: 10, fontSize: 11, padding: "2px 8px", flexShrink: 0 }}>{instrStep + 1}/{INSTR_STEPS.length}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{INSTR_STEPS[instrStep].label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted }}>{INSTR_STEPS[instrStep].sub}</div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                  {INSTR_STEPS.map((_, i) => (
                    <div key={i} onClick={() => setInstrStep(i)}
                      style={{ width: i === instrStep ? 22 : 8, height: 8, borderRadius: 4, background: i === instrStep ? C.accent : "#ddd", transition: "all 0.3s", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> รายการ</button>
          <span style={{ color: C.muted }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{data.id}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isCancelled ? (
            <Btn onClick={handleRestoreTI} disabled={cancelLoading}>{cancelLoading ? <Loader size={13}/> : null} กู้คืน</Btn>
          ) : (
            <>
              <Btn onClick={generateLandscapePDF} disabled={lsPdfLoading}>{lsPdfLoading ? <Loader size={13}/> : <Printer size={14}/>} พิมพ์</Btn>
              <Btn onClick={generatePortraitPDF} disabled={pdfLoading}>{pdfLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF</Btn>
              <Btn onClick={handleQrTI} disabled={qrLoading}>{qrLoading ? <Loader size={13}/> : <QrCode size={14}/>} QR</Btn>
              <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
              <Btn danger onClick={() => setShowCancelConfirm(true)} disabled={cancelLoading}>ยกเลิกใบนี้</Btn>
            </>
          )}
        </div>
      </div>
      {isCancelled && <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>ใบนี้ถูกยกเลิกแล้ว</div>}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 12 }}>
            {[["เลขที่", data.id], ["วันที่", data.date ? new Date(data.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"], ["ชื่อลูกค้า", data.name], ["โทรศัพท์", data.phone || "—"]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            {data.address && <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><div style={{ fontSize: 12 }}>{data.address}</div></div>}
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เลขประจำตัวผู้เสียภาษีอากร</div><div style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>{data.taxId || "—"}</div></div>
            {data.invoiceRef && <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>อ้างอิงใบส่งของ</div><div style={{ fontSize: 12, color: C.accent }}>{data.invoiceRef}</div></div>}
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.pdfHeader }}>
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
        <div style={{ padding: "0 16px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>จำนวนเงิน (ตัวอักษร)</div>
            <div style={{ fontSize: 12, padding: "8px 12px", background: "#f8f9ff", borderRadius: 6, border: `0.5px solid ${C.border}` }}>({bahtText(gt)})</div>
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
  const [err,      setErr]      = useState("");
  const [ok,       setOk]       = useState("");
  const [search,   setSearch]   = useState("");
  const [hovered,  setHovered]  = useState(null);
  const [cancelSectionOpen, setCancelSectionOpen] = useState(false);
  const [cancelSearch, setCancelSearch]       = useState("");
  const [cancelLoading, setCancelLoading]     = useState(false);
  const [cancelledList, setCancelledList]     = useState([]);

  const now = new Date();
  const [startDate, setStartDate] = useState(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-01");
  const [endDate,   setEndDate]   = useState(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0"));
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [search, startDate, endDate]);

  const cacheKey = "taxinvoices_" + startDate + "_" + endDate;
  const invoices = cache[cacheKey] || [];

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { const d = await api.getTaxInvoices(startDate, endDate, search); updateCache(cacheKey, Array.isArray(d) ? d : []); }
    catch (e) { setErr("โหลดไม่สำเร็จ: " + e.message); }
    finally { setLoading(false); }
  }, [startDate, endDate, search]);

  useEffect(() => { if (!cache[cacheKey]) load(); }, [cacheKey]);

  const loadCancelledTI = useCallback(async () => {
    setCancelLoading(true);
    try { const d = await api.getCancelledTaxInvoices(cancelSearch); setCancelledList(Array.isArray(d) ? d : []); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); }
  }, [cancelSearch]);
  useEffect(() => { if (cancelSectionOpen) loadCancelledTI(); }, [cancelSectionOpen]);

  const handleSaveNew = (result) => {
    setOk("สร้าง " + result.id + " สำเร็จ!");
    setSelected(result); setView("detail", result.id);
    updateCache(cacheKey, null); load();
    setTimeout(() => setOk(""), 2500);
  };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return !q || (inv.id || "").toLowerCase().includes(q) || (inv.name || "").toLowerCase().includes(q);
  });
  const pagedTI = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {ok  && <div style={{ background: C.successBg, color: C.success, padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{ok}</div>}
      {err && <div style={{ background: C.dangerBg,  color: C.danger,  padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{err}</div>}

      {view === "list" && (
        <div>
          <div style={{ position: "sticky", top: -18, zIndex: 10, background: C.pageBg }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}><Receipt size={15}/> ใบกำกับภาษี</div>
              <Btn primary onClick={() => setView("create", "สร้างใหม่")}>+ สร้างใบกำกับภาษีใหม่</Btn>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", border: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap", borderRadius: "8px 8px 0 0" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
                placeholder="ค้นหาลูกค้า / เลขที่..." style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 200, height: 30, boxSizing: "border-box" }} />
              <DateRangePicker startDate={startDate} endDate={endDate} onApply={(s, e) => { setStartDate(s); setEndDate(e); }} />
              {loading && <Loader size={14}/>}
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {filtered.length} รายการ</span>
            </div>
          </div>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "clip", marginBottom: 14 }}>
            {loading && <Spinner />}
            {!loading && filtered.length === 0 && <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบรายการ</div>}
            {!loading && filtered.length > 0 && (
              <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 150 }} /><col style={{ width: 95 }} /><col />
                  <col style={{ width: 150 }} /><col style={{ width: 120 }} />
                </colgroup>
                <thead>
                  <tr>{["เลขที่", "วันที่", "ชื่อลูกค้า", "เลขภาษี", "ยอดสุทธิ"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", position: "sticky", top: 70, zIndex: 1 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {pagedTI.map(inv => {
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
              <Paginator total={filtered.length} page={page} onChange={setPage} />
              </>
            )}
            <div style={{ padding: "8px 12px", background: "#fafafa", borderTop: `0.5px solid ${C.border}`, display: "flex", justifyContent: "flex-end", fontSize: 12 }}>
              <span style={{ color: C.muted }}>รวม {filtered.length} รายการ</span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button onClick={() => setCancelSectionOpen(o => !o)}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
              {cancelSectionOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>} ใบที่ยกเลิก
            </button>
            {cancelSectionOpen && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
                <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>
                  <input value={cancelSearch} onChange={e => setCancelSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadCancelledTI()}
                    placeholder="ค้นหาเลขที่ / ชื่อลูกค้า..."
                    style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 220 }} />
                  <Btn primary small onClick={loadCancelledTI} disabled={cancelLoading}>{cancelLoading ? <Loader size={13}/> : <><Search size={13}/> ค้นหา</>}</Btn>
                </div>
                {cancelLoading && <Spinner />}
                {!cancelLoading && cancelledList.length === 0 && <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 12 }}>กรอกชื่อลูกค้าหรือเลขที่แล้วกด ค้นหา</div>}
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
        <TaxInvoiceDetail invoice={selected} isCancelled onBack={() => setView("list", null)}
          onSaved={() => { updateCache(cacheKey, null); load(); setCancelledList(list => list.filter(i => i.id !== selected.id)); }}
          products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} />
      )}
      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setView("list", null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> รายการ</button>
            <span style={{ color: C.muted }}>›</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>สร้างใหม่</span>
          </div>
          <TaxInvoiceForm onSave={handleSaveNew} onCancel={() => setView("list", null)}
            products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} />
        </div>
      )}
    </div>
  );
}

// ── Customer Page ──────────────────────────────────────────

function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [similarWarning, setSimilarWarning] = useState(null);
  const formRef             = useRef(null);
  const similarConfirmedRef = useRef(false);

  const checkCPSimilarity = (nameVal) => {
    if (!nameVal.trim() || similarConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, customers);
    if (similar.length > 0) setSimilarWarning(similar);
  };

  useEffect(() => { if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [form]);

  const load = useCallback(async (q) => {
    setListLoading(true);
    try { setCustomers(await api.getCustomers(q ?? "")); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setListLoading(false); }
  }, []);
  useEffect(() => { load(""); }, []);

  const EMPTY = { name: "", address: "", phone: "", taxId: "", note: "" };

  const doSave = async () => {
    setSimilarWarning(null); setSaving(true);
    try {
      if (form.mode === "add") await api.createCustomer(form.data);
      else await api.updateCustomer(form.originalName, form.data);
      setForm(null); await load(search);
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.data.name.trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; }
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
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load(search)}
          placeholder="ค้นหาชื่อ / ที่อยู่ / เบอร์โทร..." style={{ ...inputStyle, flex: 1, height: 32 }} />
        <Btn primary onClick={() => load(search)}>ค้นหา</Btn>
        {search && <Btn onClick={() => { setSearch(""); load(""); }}>ล้าง</Btn>}
      </div>
      {form && (
        <div ref={formRef} style={{ background: "#F8FAFF", border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>{form.mode === "add" ? "เพิ่มลูกค้าใหม่" : "แก้ไขข้อมูลลูกค้า"}</div>
          {[{ key: "name", label: "ชื่อลูกค้า *", placeholder: "ชื่อบริษัท / ชื่อลูกค้า" }, { key: "address", label: "ที่อยู่", placeholder: "ที่อยู่" }, { key: "phone", label: "โทรศัพท์", placeholder: "เบอร์โทรศัพท์" }, { key: "taxId", label: "เลขภาษี", placeholder: "เลขประจำตัวผู้เสียภาษี 13 หลัก" }, { key: "note", label: "หมายเหตุ", placeholder: "หมายเหตุ" }].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{label}</div>
              <input value={form.data[key]}
                onChange={e => { if (key === "name") similarConfirmedRef.current = false; setForm(f => ({ ...f, data: { ...f.data, [key]: e.target.value } })); }}
                onBlur={key === "name" ? () => { if (form.mode === "add") checkCPSimilarity(form.data.name); } : undefined}
                placeholder={placeholder} style={fldStyle} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn primary onClick={handleSave} disabled={saving}>{saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}</Btn>
            <Btn onClick={() => setForm(null)} disabled={saving}>ยกเลิก</Btn>
          </div>
        </div>
      )}
      {listLoading ? <Spinner text="กำลังโหลด..." /> : (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr>
                <th style={thS}>ชื่อลูกค้า</th><th style={thS}>ที่อยู่</th><th style={thS}>โทรศัพท์</th><th style={thS}>เลขภาษี</th><th style={thS}>หมายเหตุ</th>
                <th style={{ ...thS, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.muted }}>{search ? `ไม่พบลูกค้าที่ตรงกับ "${search}"` : "ยังไม่มีข้อมูลลูกค้า"}</td></tr>
              ) : customers.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdS, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ ...tdS, color: C.muted }}>{c.address}</td>
                  <td style={tdS}>{c.phone}</td>
                  <td style={{ ...tdS, fontFamily: "monospace", fontSize: 12 }}>{c.taxId}</td>
                  <td style={{ ...tdS, color: C.muted }}>{c.note}</td>
                  <td style={{ ...tdS, display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button onClick={() => setForm({ mode: "edit", data: { ...c }, originalName: c.name })}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#E0E7FF", color: "#3730A3", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>แก้ไข</button>
                    <button onClick={() => setDeleteTarget(c.name)}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleteTarget && <ConfirmModal message={`ลบ "${deleteTarget}" ออกจากรายชื่อลูกค้าใช่ไหม?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} enterConfirm />}
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

// ── Product Page ───────────────────────────────────────────

function ProductPage({ cache, updateCache }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [locked, setLocked]     = useState(true);
  const [tab, setTab]           = useState("product");
  const [form, setForm]         = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const formRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.getProducts(); setItems(r); updateCache?.("productList", r); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (cache?.["productList"]) { setItems(cache["productList"]); setLoading(false); } else { load(); } }, []);
  useEffect(() => { if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [form]);

  const visible = items.filter(it => it.type === tab);

  const handleSave = async () => {
    if (!form.value.trim()) { alert("กรุณากรอกชื่อ"); return; }
    setSaving(true);
    try {
      if (form.mode === "add") await api.addProduct(form.value.trim(), tab);
      else await api.updateProduct(form.row, form.value);
      setForm(null); updateCache?.("productList", null); await load();
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try { await api.deleteProduct(deleteTarget.row); setDeleteTarget(null); updateCache?.("productList", null); await load(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const tabLabel = tab === "product" ? "สินค้า" : "ขนาด";
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Package size={16}/> จัดการสินค้า</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => { setLocked(l => !l); if (!locked) setForm(null); }}
            style={{ background: locked ? C.pageBg : "#fff9e6", border: `0.5px solid ${locked ? C.border : "#f0a500"}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: locked ? C.muted : "#b87800", display: "flex", alignItems: "center", gap: 5 }}>
            {locked ? <><Lock size={12}/> ล็อค</> : <><Unlock size={12}/> กำลังแก้ไข</>}
          </button>
          {!locked && <Btn primary onClick={() => setForm({ mode: "add", value: "" })}>+ เพิ่ม{tabLabel}ใหม่</Btn>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[["product","สินค้า"],["size","ขนาด"]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setForm(null); }} style={{
            padding: "6px 18px", fontSize: 13, borderRadius: 6, cursor: "pointer", border: "none",
            background: tab === key ? C.accent : C.pageBg, color: tab === key ? "#fff" : C.text,
            fontFamily: "Prompt, sans-serif", fontWeight: tab === key ? 500 : 400 }}>{label}</button>
        ))}
      </div>
      {form && !locked && (
        <div ref={formRef} style={{ background: "#F8FAFF", border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>{form.mode === "add" ? `เพิ่ม${tabLabel}ใหม่` : `แก้ไข${tabLabel}`}</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อ{tabLabel}</div>
            <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder={`ชื่อ${tabLabel}`} autoFocus style={{ ...inputStyle, width: "100%", height: 30, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn primary onClick={handleSave} disabled={saving}>{saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}</Btn>
            <Btn onClick={() => setForm(null)} disabled={saving}>ยกเลิก</Btn>
          </div>
        </div>
      )}
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
                    {!locked && <>
                      <button onClick={() => setForm({ mode: "edit", row: it.row, value: it.value })}
                        style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#E0E7FF", color: "#3730A3", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>แก้ไข</button>
                      <button onClick={() => setDeleteTarget(it)}
                        style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>ลบ</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleteTarget && <ConfirmModal message={`ลบ "${deleteTarget.value}" ออกจากรายการ${tabLabel}ใช่ไหม?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} enterConfirm />}
    </div>
  );
}

// ── Settings Page (IA — TI/BN folders only) ────────────────

function SettingsPage({ onConfigSaved, cache, updateCache }) {
  const [sView, setSView]       = useState("hub");
  const [folderTI, setFolderTI] = useState("");
  const [folderBN, setFolderBN] = useState("");
  const [folderBNCombined, setFolderBNCombined] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [locked, setLocked]     = useState(true);
  const origFolders  = useRef({ ti: "", bn: "", bnCombined: "" });
  const configFetched = useRef(false);

  const applyConfig = (cfg) => {
    const toUrl = id => id && !id.startsWith("http") ? `https://drive.google.com/drive/folders/${id}` : (id || "");
    const ti = toUrl(cfg.folders?.ti); setFolderTI(ti);
    const bn = toUrl(cfg.folders?.bn); setFolderBN(bn);
    const bnCombined = toUrl(cfg.folders?.bnCombined); setFolderBNCombined(bnCombined);
    origFolders.current = { ti, bn, bnCombined };
  };

  useEffect(() => {
    if (sView !== "folders") return;
    if (configFetched.current) return;
    if (cache?.["settingsConfig"]) { applyConfig(cache["settingsConfig"]); configFetched.current = true; return; }
    setLoading(true); setError("");
    api.getConfig().then(cfg => { applyConfig(cfg); updateCache?.("settingsConfig", cfg); configFetched.current = true; })
      .catch(e => setError("โหลดการตั้งค่าไม่สำเร็จ: " + e.message))
      .finally(() => setLoading(false));
  }, [sView]);

  const handleSaveAll = async () => {
    setSaving(true); setError("");
    try {
      await api.saveConfig({ folders: { ti: folderTI, bn: folderBN, bnCombined: folderBNCombined } });
      updateCache?.("settingsConfig", { folders: { ti: folderTI, bn: folderBN, bnCombined: folderBNCombined } });
      setSaved(true); setTimeout(() => setSaved(false), 2500); setLocked(true);
      if (onConfigSaved) onConfigSaved();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner text="กำลังโหลดการตั้งค่า..." />;

  const inpS  = { ...inputStyle, width: "100%", ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };
  const taS   = { ...inputStyle, width: "100%", resize: "vertical", ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };
  const monoS = { ...inputStyle, width: "100%", fontFamily: "monospace", fontSize: 11, ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };

  const HubCard = ({ icon, label, desc, color, bg, onClick }) => (
    <div onClick={onClick} style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "20px 16px", cursor: "pointer", textAlign: "center" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 20, color }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.muted }}>{desc}</div>
    </div>
  );

  const BackHeader = ({ title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <button onClick={() => setSView("hub")} style={{ fontSize: 12, padding: "4px 10px", border: `0.5px solid ${C.border}`, borderRadius: 5, background: C.pageBg, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <ChevronLeft size={14}/> ระบบ
      </button>
      <span style={{ color: C.muted, fontSize: 12 }}>/</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
    </div>
  );

  const LockBtn = () => (
    <button onClick={() => setLocked(l => !l)} style={{ background: locked ? C.pageBg : "#fff9e6", border: `0.5px solid ${locked ? C.border : "#f0a500"}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: locked ? C.muted : "#b87800", display: "flex", alignItems: "center", gap: 5 }}>
      {locked ? <><Lock size={12}/> ล็อค</> : <><Unlock size={12}/> กำลังแก้ไข</>}
    </button>
  );

  if (sView === "hub") return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>⚙ ระบบ</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <HubCard icon={<Folder size={20}/>} label="Google Drive" desc="folder URLs (TI / BN)" bg="#FAEEDA" color="#854F0B" onClick={() => setSView("folders")} />
        <HubCard icon={<Package size={20}/>} label="สินค้า" desc="จัดการรายการสินค้า / ขนาด" bg="#EAF3DE" color="#3B6D11" onClick={() => setSView("products")} />
        <HubCard icon={<Users size={20}/>} label="ลูกค้า" desc="รายชื่อและข้อมูลลูกค้า" bg="#EEEDFE" color="#534AB7" onClick={() => setSView("customers")} />
      </div>
    </div>
  );

  if (sView === "folders") return (
    <div>
      <BackHeader title="Google Drive folders" />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <LockBtn />
        {!locked && <Btn primary onClick={handleSaveAll} disabled={saving}>{saving ? <><Loader size={13}/> กำลังบันทึก...</> : saved ? <><CheckCircle size={13}/> บันทึกแล้ว</> : <><Save size={13}/> บันทึกทั้งหมด</>}</Btn>}
      </div>
      {error && <div style={{ marginBottom: 14 }}><ErrorBox msg={error} /></div>}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, maxWidth: 520 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}><Folder size={13}/> Google Drive Folder URLs</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบกำกับภาษี (TI)</div><input value={folderTI} onChange={e => setFolderTI(e.target.value)} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบวางบิล (BN)</div><input value={folderBN} onChange={e => setFolderBN(e.target.value)} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>BN รวมพิมพ์ <span style={{ color: C.muted, opacity: 0.7 }}>— เว้นว่าง = subfolder อัตโนมัติ</span></div><input value={folderBNCombined} onChange={e => setFolderBNCombined(e.target.value)} disabled={locked} placeholder="(เว้นว่างได้)" style={monoS} /></div>
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0f4ff", borderRadius: 6, fontSize: 11, color: C.muted }}>
          💡 วาง URL จาก Google Drive ได้เลย — ระบบจะดึง Folder ID ให้อัตโนมัติ
        </div>
      </div>
    </div>
  );

  if (sView === "products") return <div><BackHeader title="สินค้า" /><ProductPage cache={cache} updateCache={updateCache} /></div>;
  if (sView === "customers") return <div><BackHeader title="ลูกค้า" /><CustomerPage /></div>;
  return null;
}

// ── Main App ───────────────────────────────────────────────

const IA_NAV_ICONS = { Receipt, ClipboardList, Settings };

export default function App({ userName, onLogout }) {

  useEffect(() => {
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
    document.body.style.fontFamily = "'Prompt', sans-serif";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0891b2"/><text x="16" y="22" font-family="sans-serif" font-weight="700" font-size="14" fill="white" text-anchor="middle">IA</text></svg>`;
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement("link");
    favicon.type = "image/svg+xml"; favicon.rel = "shortcut icon";
    favicon.href = "data:image/svg+xml," + encodeURIComponent(svg);
    document.head.appendChild(favicon);
  }, []);

  const [breadcrumbSuffix, setBreadcrumbSuffix] = useState(null);
  const [goListRequest, setGoListRequest]       = useState(0);
  const [active, setActive_]                    = useState("taxinvoice");
  const contentRef = useRef(null);
  const scrollToTop = () => { if (contentRef.current) contentRef.current.scrollTop = 0; };
  const setActive = (key) => { setActive_(key); setBreadcrumbSuffix(null); scrollToTop(); };
  const handleViewChange = (label) => { setBreadcrumbSuffix(label ?? null); if (label) scrollToTop(); };

  const [products, setProducts]   = useState([]);
  const [sizes, setSizes]         = useState([]);
  const [vatRate, setVatRate]     = useState(0.07);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [gsVersion, setGsVersion] = useState(null);
  const [fontScale, setFontScale] = useState(() => {
    try { return parseFloat(localStorage.getItem("ia_fontScale") || "1"); } catch { return 1; }
  });
  const changeFontScale = (delta) => setFontScale(prev => {
    const next = Math.min(1.4, Math.max(0.8, parseFloat((prev + delta).toFixed(1))));
    try { localStorage.setItem("ia_fontScale", next); } catch {}
    return next;
  });

  const [cache, setCache] = useState({});
  const updateCache = (key, data) => setCache(prev => ({ ...prev, [key]: data }));

  useEffect(() => { api.getVersion().then(v => { if (typeof v === "string") setGsVersion(v); }).catch(() => {}); }, []);

  useEffect(() => {
    if (SCRIPT_URL === "PASTE_TICODE_GS_DEPLOY_URL_HERE") {
      setProducts(["Product A", "Product B"]); setSizes(["S", "M", "L", "XL"]);
      setConfigLoaded(true); return;
    }
    api.getConfig().then(cfg => {
      if (cfg.products?.length) setProducts(cfg.products); else setProducts(["Product A", "Product B"]);
      if (cfg.sizes?.length)    setSizes(cfg.sizes);       else setSizes(["S", "M", "L", "XL"]);
      if (cfg.vatRate)          setVatRate(cfg.vatRate);
      setConfigLoaded(true);
    }).catch(() => { setProducts(["Product A", "Product B"]); setSizes(["S", "M", "L", "XL"]); setConfigLoaded(true); });
  }, []);

  const sections = [...new Set(NAV.filter(n => n.section).map(n => n.section))];

  const renderPage = () => {
    if (!configLoaded) return <Spinner text="กำลังเริ่มต้นระบบ..." />;
    switch (active) {
      case "taxinvoice": return <TaxInvoicePage products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "billing":    return <BillingNotePage cache={cache} updateCache={updateCache} goListRequest={goListRequest} onViewChange={handleViewChange} />;
      case "settings":   return <SettingsPage cache={cache} updateCache={updateCache} onConfigSaved={() => { updateCache("productList", null); }} />;
      default:           return <div style={{ padding: 40, color: C.muted }}>ไม่พบหน้า</div>;
    }
  };

  const NavItem = ({ item }) => (
    <div onClick={() => { if (item.key === active) setGoListRequest(n => n + 1); else setActive(item.key); }}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", cursor: "pointer",
        color: active === item.key ? C.sidebarText : C.sidebarMuted,
        background: active === item.key ? C.sidebarActive : "transparent",
        borderLeft: active === item.key ? `3px solid ${C.sidebarActiveBorder}` : "3px solid transparent",
        fontSize: 13, transition: "background 0.15s" }}>
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {IA_NAV_ICONS[item.icon] ? React.createElement(IA_NAV_ICONS[item.icon], { size: 16 }) : item.icon}
      </span>
      {item.label}
    </div>
  );

  const isDevMode = SCRIPT_URL === "PASTE_TICODE_GS_DEPLOY_URL_HERE";
  const activeNav = NAV.find(n => n.key === active);

  return (
    <div style={{ display: "flex", height: `${100/fontScale}vh`, fontFamily: "Sarabun, sans-serif" }}>
      <style>{`html, body { margin: 0; padding: 0; overflow: hidden; } body { zoom: ${fontScale}; }`}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: C.sidebar, borderRight: `0.5px solid ${C.sidebarBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "14px 10px", borderBottom: `0.5px solid ${C.sidebarBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => setActive("taxinvoice")} style={{ width: 32, height: 32, background: C.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "white", flexShrink: 0, cursor: "pointer" }}>IA</div>
          <div><div style={{ color: C.sidebarText, fontSize: 13, fontWeight: 500 }}>Invoice Admin</div><div style={{ color: C.sidebarMuted, fontSize: 10 }}>ระบบออกใบกำกับภาษี</div></div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {sections.map(section => (
            <div key={section}>
              <div style={{ padding: "12px 16px 4px", fontSize: 10, color: C.sidebarSection, textTransform: "uppercase", letterSpacing: "0.08em" }}>{section}</div>
              {NAV.filter(n => n.section === section).map(item => <NavItem key={item.key} item={item} />)}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: `0.5px solid ${C.sidebarBorder}` }}>
          <span style={{ fontSize: 10, color: C.sidebarSection }}>
            app v0.1.6{gsVersion ? <span>  ·  gs v{gsVersion}</span> : null}
          </span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.pageBg, minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ background: "white", borderBottom: `0.5px solid ${C.border}`, padding: "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zoom: 1/fontScale }}>
          <div style={{ fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
            {activeNav?.section && <><span>{activeNav.section}</span><span>›</span></>}
            {activeNav?.label && (
              <span style={{ color: breadcrumbSuffix ? C.accent : C.text, cursor: breadcrumbSuffix ? "pointer" : "default" }}
                onClick={() => { if (breadcrumbSuffix) { setBreadcrumbSuffix(null); setGoListRequest(n => n + 1); } }}>
                {activeNav.label}
              </span>
            )}
            {breadcrumbSuffix && <><span>›</span><span style={{ color: C.text }}>{breadcrumbSuffix}</span></>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button onClick={() => changeFontScale(-0.1)} style={{ background: C.pageBg, border: `0.5px solid ${C.border}`, color: C.muted, borderRadius: 4, width: 26, height: 26, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A-</button>
              <button onClick={() => changeFontScale(0.1)} style={{ background: C.pageBg, border: `0.5px solid ${C.border}`, color: C.muted, borderRadius: 4, width: 26, height: 26, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A+</button>
            </div>
            {isDevMode && <div style={{ background: C.warningBg, color: C.warning, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 500 }}>⚠️ Dev Mode — ยังไม่ได้ตั้งค่า SCRIPT_URL</div>}
            {userName && <span style={{ fontSize: 13, color: C.muted }}>{userName}</span>}
            {onLogout && <button onClick={onLogout} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: C.muted }}>ออกจากระบบ</button>}
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, padding: "18px 22px", overflowY: "auto" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}