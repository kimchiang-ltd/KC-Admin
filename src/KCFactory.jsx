// ============================================================
// KC Factory System — Web App
// ============================================================
// Version History
// v1.4.17 (2026-06-12) — Bug #32 Option A: join _cont rows into parent detail with " | " on save; split on load to reconstruct _cont rows; updateItem/upd guard blocks non-detail changes on _cont rows; TaxInvoiceDetail fi filter expanded to include desc2/detail
// v1.4.16 (2026-06-12) — Fix ลบ button position: back to below section title, left-aligned (both forms); was pushed right by space-between flex container introduced in v1.4.14
// v1.4.15 (2026-06-12) — Hard block UX: start with 1 row; Enter creates ↳ continuation row (detail-only, no product/size/qty/price, _cont flag); typing hard-blocked at DESC_MAX; Enter+addRow both blocked at 10 rows; _cont stripped on save
// v1.4.14 (2026-06-12) — Description overflow UX: ITEMS_COUNT=10, Enter in detail creates continuation row (both forms), row counter X/10, red left-border + warning when desc exceeds DESC_MAX=48 weighted units, addRow disabled at 10; fix filter to include desc2/detail in both forms
// v1.4.13 (2026-06-12) — Fix save button label: edit shows "บันทึก" not "บันทึกและอัพเดท PDF" (no PDF generated on edit save)
// v1.4.12 (2026-06-12) — Cache portrait PDF (PDF button) same as landscape (Print button): check data.portraitUrl first, store on first generate, clear on edit save — both DeliveryNote and TaxInvoice
// v1.4.11 (2026-06-12) — Edit log fix: track add/delete counts in frontend (_orig marker, removedOrigItems), pass _logAdded/_logDeleted to backend for both DeliveryNote and TaxInvoice; shows "เพิ่ม 2 แถว; ลบ: item" instead of net
// v1.4.10 (2026-06-12) — Fix cache stale after edit: pass onSaved from Page→Detail, invalidate cache+reload on edit save; #4 PDF caching: use data.pdfUrl if available (skip backend); clear pdfUrl after edit so regenerates; filter empty items from payload on save (fix pre-filled rows in edit)
// v1.4.9 (2026-06-12) — Rename TaxDeliveryNoteForm→TaxInvoiceForm, TaxDeliveryNoteDetail→TaxInvoiceDetail, TaxDeliveryNotePage→TaxInvoicePage
// v1.4.8 (2026-06-12) — ลบ/เสร็จ toggle: below section title, red/dark-green, left-aligned with table
// v1.4.7 (2026-06-12) — Move toggle to left of section title, rename แก้ไข→ลบ (red when active→เสร็จ)
// v1.4.6 (2026-06-12) — Move แก้ไข/เสร็จ toggle outside table, next to รายการสินค้า title
// v1.4.5 (2026-06-12) — iPhone-style "แก้ไข/เสร็จ" toggle in table header reveals − buttons; hidden by default in both forms
// v1.4.4 (2026-06-12) — #24: simplify TaxInvoiceDetail buttons to 3 (พิมพ์/PDF/แก้ไข); พิมพ์=landscape, PDF=portrait
// v1.4.3 (2026-06-12) — #25+#28: rename InvoiceForm→DeliveryNoteForm, InvoiceDetail→DeliveryNoteDetail, InvoicePage→DeliveryNotePage; rename api.getInvoices/createInvoice/updateInvoice/searchInvoices to DeliveryNote equivalents; update Code.gs router
// v1.4.2 (2026-06-12) — #28: rename api calls to match backend (generateTaxInvoicePortraitPDF, generateDeliveryNoteLandscapePDF, generateDeliveryNotePortraitPDF); update Code.gs router strings to match
// v1.4.1 (2026-06-12) — Change ConfirmModal message to "ยืนยันลบ?"
// v1.4.0 (2026-06-12) — Replace window.confirm with centered ConfirmModal for row delete; add fragment wrappers to both forms
// v1.3.9 (2026-06-12) — Shrink remove-row button to 14px; add confirm dialog before delete
// v1.3.8 (2026-06-12) — Restyle remove-row button: red filled circle (iOS style), 16px, white minus
// v1.3.7 (2026-06-12) — Remove footer total sum from tax invoice list (keep only record count); remove unused footerTotal var
// v1.3.6 (2026-06-12) — Style remove-row button as circle-minus icon (outlined circle with − inside) in both forms
// v1.3.5 (2026-06-12) — Restore ยอดสุทธิ column to tax invoice list (wrongly removed in v1.2.8); fix colgroup to 5 cols
// v1.3.4 (2026-06-12) — Add "−" remove-row button as first column in both DeliveryNoteForm and TaxInvoiceForm; fix colspan on total row
// v1.3.3 (2026-06-12) — Fix #23: add "+ เพิ่มแถว" button to both DeliveryNoteForm (delivery note) and
//                        TaxInvoiceForm so users can add new line items when editing
// v1.3.2 (2026-06-12) — Remove sidebar collapse; all NAV icons now Lucide (no emoji); icon
//                        style consistent across all sidebar/home items
// v1.3.1 (2026-06-12) — Fix home page card sizes (fixed width, no stretch); KC logo navigates
//                        home; hamburger icon added for sidebar collapse
// v1.3.0 (2026-06-12) — Add home page (dynamic from NAV); หน้าหลัก breadcrumb navigates home;
//                        app starts on home page
// v1.2.9 (2026-06-12) — Fix breadcrumb module link not navigating back to list
// v1.2.8 (2026-06-12) — Remove จัดการ column from all lists; remove amount columns
//                        from tax invoice list; breadcrumb now updates on detail/create;
//                        remove redundant internal mini-breadcrumbs
// v1.2.7 (2026-06-12) — Fix font inconsistency (tabular-nums); remove
//                        PDF/print icons from list views; KC favicon + Prompt font
// v1.2.6              — (previous release)
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { FileText, ClipboardList, Receipt, Package, BarChart2, Printer, Pencil, Save, Search, RefreshCw, Loader, CheckCircle, Square, Eye, Folder, Home, Check, LayoutDashboard, ArrowLeftRight, Users, Settings } from "lucide-react";
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
  confirmBN:        (customer, reservedBnNo, invStartDate, invEndDate) =>
                      apiCall("confirmBillingNote", { customer, reservedBnNo, invStartDate, invEndDate }),
  getBNHistory:     ()                            => apiCall("getBNHistory"),
  getConfig:        ()                            => apiCall("getConfig"),
  saveConfig:       (data)                        => apiCall("saveConfig", { data }),
  // Tax Invoice
  getTaxInvoices:      (startDate, endDate, search)  => apiCall("getTaxInvoices", { startDate, endDate, search }),
  createTaxInvoice:    (data)                        => apiCall("createTaxInvoice", { data }),
  updateTaxInvoice:    (id, data)                    => apiCall("updateTaxInvoice", { id, data }),
  generateTaxInvoicePortraitPDF:          (id) => apiCall("generateTaxInvoicePortraitPDF", { id }),
  generateTaxInvoiceLandscapePDF: (id) => apiCall("generateTaxInvoiceLandscapePDF", { id }),
  generateDeliveryNoteLandscapePDF:  (id) => apiCall("generateDeliveryNoteLandscapePDF", { id }),
  generateDeliveryNotePortraitPDF:   (id) => apiCall("generateDeliveryNotePortraitPDF", { id }),
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

const inputStyle = { padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, outline: "none", boxSizing: "border-box", height: 32 };

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
const emptyItems = () => Array(ITEMS_COUNT).fill(null).map(emptyItem);

// Description width estimator — Thai chars count 1.5x (wider glyphs), others 1x
// DESC_MAX = landscape limit (~64mm col / 3mm font). Warns user before PDF overflows.
const DESC_MAX = 48;
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

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "white", borderRadius: 10, padding: "24px 28px", minWidth: 260, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 20 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} style={{ padding: "7px 20px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "white", cursor: "pointer", fontSize: 13, color: C.text }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ padding: "7px 20px", borderRadius: 6, border: "none", background: "#e5534b", cursor: "pointer", fontSize: 13, color: "white", fontWeight: 500 }}>ลบ</button>
        </div>
      </div>
    </div>
  );
}

function DeliveryNoteForm({ initial, onSave, onCancel, isEdit, products, sizes }) {
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
    if (descWidth(getDescText(testIt)) <= DESC_MAX) updateItem(i, "detail", val);
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
    setSaving(true);
    setError("");
    try {
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
        if (contParts.length > 0) {
          it.detail = [it.detail || "", ...contParts].filter(Boolean).join(" | ");
        }
        collapsed.push(it);
      }
      const filled = collapsed.filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
      const cleanItems = filled.map(({ _orig, _cont, ...it }) => it);
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
    {pendingDelete !== null && <ConfirmModal message="ยืนยันลบ?" onConfirm={() => { removeRow(pendingDelete); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} />}
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <SectionTitle>ข้อมูลลูกค้า</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่</div><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อลูกค้า</div><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อลูกค้า" style={{ ...inputStyle, width: "100%" }} /></div>
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
                {[{ l: "#", w: 32, a: "center" }, { l: "รายการ / Description", w: "auto", a: "left" }, { l: "ขนาด", w: 90, a: "left" }, { l: "รายละเอียด", w: 130, a: "left" }, { l: "จำนวน QTY", w: 80, a: "right" }, { l: "หน่วยละ", w: 90, a: "right" }, { l: "จำนวนเงิน", w: 100, a: "right" }].map((h, idx) => (
                  <th key={idx} style={{ padding: "7px 10px", color: "white", fontWeight: 500, fontSize: 11, textAlign: h.a, width: h.w }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const dw = descWidth(getDescText(it));
                const atLimit = dw >= DESC_MAX;
                return (
                <tr key={i} style={{ background: it._cont ? "#f5f7ff" : i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}`, borderLeft: atLimit ? `3px solid ${C.danger}` : it._cont ? `3px solid ${C.accent}` : "3px solid transparent" }}>
                  <td style={{ padding: "3px 4px", textAlign: "center" }}>
                    {rowEditMode && <button onClick={() => setPendingDelete(i)} title="ลบแถว" style={{ width: 14, height: 14, borderRadius: "50%", border: "none", background: "#e5534b", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0, fontWeight: 700 }}>−</button>}
                  </td>
                  <td style={{ padding: "3px 6px", color: C.muted, textAlign: "center", fontSize: 11 }}>
                    {it._cont ? <span style={{ color: C.accent, fontSize: 13 }}>↳</span> : i + 1}
                  </td>
                  <td style={{ padding: "3px 6px" }}>
                    {!it._cont && <select value={it.desc} onChange={e => updateItem(i, "desc", e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", cursor: "pointer" }}>
                      <option value="">— เลือกสินค้า —</option>
                      {products.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>}
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
                    {atLimit && <div style={{ fontSize: 9, color: C.danger, marginTop: 1 }}>ถึงขีดจำกัด — กด Enter เพื่อขึ้นบรรทัดใหม่</div>}
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

function DeliveryNoteDetail({ invoice, onBack, onSaved, products, sizes }) {
  const [editing, setEditing]         = useState(false);
  const [data, setData]               = useState(invoice);
  const [lsLoading, setLsLoading]     = useState(false);
  const [ptLoading, setPtLoading]     = useState(false);
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

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {data.id}</span>
      </div>
      <DeliveryNoteForm initial={data} onSave={handleSave} onCancel={() => setEditing(false)} isEdit products={products} sizes={sizes} />
    </div>
  );

  const filledItems = (data.items || []).filter(it => it.desc || it.qty || it.amount);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการ</button>
          <span style={{ color: C.muted }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{data.id}</span>
          <Badge success={data.billed}>{data.billed ? "วางบิลแล้ว" : "รอวางบิล"}</Badge>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={generateLandscape} disabled={lsLoading}>{lsLoading ? <Loader size={13}/> : <Printer size={14}/>} พิมพ์</Btn>
          <Btn onClick={generatePortrait} disabled={ptLoading}>{ptLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF</Btn>
          <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
        </div>
      </div>
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

function DeliveryNotePage({ products, sizes, cache, updateCache, onViewChange, goListRequest }) {
  const [view, setView_]            = useState("list");
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  useEffect(() => { if (goListRequest) setView("list", null); }, [goListRequest]);
  const [selected, setSelected]     = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [startDate, setStartDate]   = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [hovered, setHovered] = useState(null);

  const cacheKey = "invoices_" + startDate + "_" + endDate;
  const invoices = cache[cacheKey] || [];

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getDeliveryNotes(startDate, endDate, search);
      updateCache(cacheKey, Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, search]);

  useEffect(() => { if (!cache[cacheKey]) loadInvoices(); }, [cacheKey]);

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
            <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาลูกค้า / เลขที่..."
                style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 200 }} />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12 }} />
              <span style={{ color: C.muted, fontSize: 11 }}>ถึง</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12 }} />
              <Btn primary small onClick={loadInvoices} disabled={loading}>
                {loading ? <Loader size={13}/> : <><Search size={13}/> ค้นหา</>}
              </Btn>
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
        </div>
      )}

      {view === "detail" && selected && (
        <DeliveryNoteDetail invoice={selected} onBack={() => setView("list", null)} onSaved={() => { updateCache(cacheKey, null); loadInvoices(); }} products={products} sizes={sizes} />
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setView("list", null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการใบส่งของ</button>
            <span style={{ color: C.muted }}>›</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>สร้างใบส่งของใหม่</span>
          </div>
          <DeliveryNoteForm onSave={handleSaveNew} onCancel={() => setView("list", null)} products={products} sizes={sizes} />
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

function SettingsPage({ products, setProducts, sizes, setSizes, onConfigSaved }) {
  const [company, setCompany]     = useState("หจก. โรงงานกิมเชียง");
  const [nameEN,  setNameEN]      = useState("KIMCHIANG LIMITED PARTNERSHIP");
  const [address, setAddress]     = useState("25/9 หมู่ 10 ต.ลอมแม่นาง อ.บางใหญ่ จ.นนทบุรี 11140");
  const [tel, setTel]             = useState("02-191-8698-9");
  const [taxId, setTaxId]         = useState("0103506007938");
  const [invFolder, setInvFolder] = useState("1Ojou6ppaMDN1vQ4qM7ZEtquPEnV5QAO_");
  const [bnFolder, setBnFolder]   = useState("1zV4Gqqff3ytAUYFeS4Xt3nnRnuwKgTGv");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(true);

  // Load config from API on mount
  useEffect(() => {
    (async () => {
      try {
        const cfg = await api.getConfig();
        if (cfg.products?.length) setProducts(cfg.products);
        if (cfg.sizes?.length)    setSizes(cfg.sizes);
        if (cfg.company?.name)    setCompany(cfg.company.name);
        if (cfg.company?.nameEN)  setNameEN(cfg.company.nameEN);
        if (cfg.company?.address) setAddress(cfg.company.address);
        if (cfg.company?.tel)     setTel(cfg.company.tel);
        if (cfg.company?.taxId)   setTaxId(cfg.company.taxId);
        if (cfg.folders?.invoice) setInvFolder(cfg.folders.invoice);
        if (cfg.folders?.bn)      setBnFolder(cfg.folders.bn);
      } catch (err) {
        setError("โหลดการตั้งค่าไม่สำเร็จ: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    try {
      await api.saveConfig({
        products,
        sizes,
        company: { name: company, nameEN, address, tel, taxId },
        folders: { invoice: invFolder, bn: bnFolder },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner text="กำลังโหลดการตั้งค่า..." />;

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>⚙ ตั้งค่า</span>
        <Btn primary onClick={handleSaveAll} disabled={saving}>
          {saving ? <><Loader size={13}/> กำลังบันทึก...</> : saved ? <><CheckCircle size={13}/> บันทึกแล้ว</> : <><Save size={13}/> บันทึกทั้งหมด</>}
        </Btn>
      </div>
      {error && <div style={{ marginBottom: 14 }}><ErrorBox msg={error} /></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <EditableList title="รายการสินค้า" icon="Package" items={products} setItems={setProducts} placeholder="ชื่อสินค้า เช่น Product A" />
          <EditableList title="ขนาดสินค้า"   icon="📐" items={sizes}    setItems={setSizes}    placeholder="ขนาด เช่น XL, XXL" />
        </div>
        <div>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>🏢 ข้อมูลบริษัท</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อบริษัท</div><input value={company} onChange={e => setCompany(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อภาษาอังกฤษ</div><input value={nameEN} onChange={e => setNameEN(e.target.value)} placeholder="COMPANY NAME IN ENGLISH" style={{ ...inputStyle, width: "100%" }} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เลขประจำตัวผู้เสียภาษี</div><input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="0000000000000" maxLength={13} style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.06em" }} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} style={{ ...inputStyle, width: "100%", resize: "vertical" }} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>โทรศัพท์ / แฟกซ์</div><input value={tel} onChange={e => setTel(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
            </div>
          </div>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}><Folder size={13}/> Google Drive Folder IDs</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Invoice Folder ID</div><input value={invFolder} onChange={e => setInvFolder(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11, width: "100%" }} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Billing Note Folder ID</div><input value={bnFolder} onChange={e => setBnFolder(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11, width: "100%" }} /></div>
            </div>
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0f4ff", borderRadius: 6, fontSize: 11, color: C.muted }}>
              💡 Folder ID คือส่วนท้ายของ URL เช่น drive.google.com/drive/folders/<strong style={{ color: C.accent }}>ID</strong>
            </div>
          </div>
        </div>
      </div>
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
      const { start, end } = getDateRange();
      const result = await api.confirmBN(customer.name, nextBnNo, start, end);
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
            <><ClipboardList size={14}/> ตัวอย่างใบวางบิล — {customer.name}</>
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
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: C.muted, minWidth: 40 }}>นาม</span><span style={{ fontWeight: 500 }}>{customer.name}</span></div>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: C.muted, minWidth: 40 }}>ที่อยู่</span><span>{address || "—"}</span></div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
            <thead>
              <tr style={{ background: "#f0f4ff" }}>
                {["✓", "#", "เลขที่บิล", "วันที่บิล", "วันครบกำหนด", "บาท", "สต.", ""].map((h, i) => (
                  <th key={i} style={{ padding: "6px 8px", textAlign: i >= 5 ? "right" : "left", fontWeight: 500, fontSize: 11, color: C.muted, borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
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
                    <td style={{ padding: "4px 8px", textAlign: "center", fontVariantNumeric: "tabular-nums", color: s > 0 ? C.text : C.muted }}>
                      {s > 0 ? String(s).padStart(2, "0") : ""}
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <button onClick={() => removeRow(row.idx)} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, fontSize: 14, padding: "0 4px" }}>×</button>
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

// ── Create BN Tab ──────────────────────────────────────────

function CreateBNTab() {
  const [month, setMonth]         = useState(String(new Date().getMonth() + 1));
  const [year, setYear]           = useState(String(new Date().getFullYear()));
  const [searched, setSearched]   = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [preview, setPreview]     = useState(null);
  const [toast, setToast]         = useState("");
  const [nextBnNo, setNextBnNo]   = useState("26-BN-000001");

  const done    = customers.filter(c => c.generated).length;
  const pending = customers.length - done;

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    const m    = String(month).padStart(2, "0");
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const startDate = `${year}-${m}-01`;
    const endDate   = `${year}-${m}-${String(daysInMonth).padStart(2, "0")}`;
    try {
      const data = await api.searchDeliveryNotes(startDate, endDate);
      // data from searchInvoices is grouped by customer
      const mapped = (Array.isArray(data) ? data : []).map(cust => ({
        ...cust,
        generated: false,
      }));
      setCustomers(mapped);
      setSearched(true);

      // Get next BN number from last BN history item
      try {
        const hist = await api.getBNHistory();
        if (hist.length > 0) {
          const lastBnNo = hist[0].bnNo; // newest first
          const parts = lastBnNo.split("-");
          const lastNum = parseInt(parts[parts.length - 1], 10) || 0;
          const yy = new Date().getFullYear().toString().slice(-2);
          setNextBnNo(`${yy}-BN-${String(lastNum + 1).padStart(6, "0")}`);
        }
      } catch (_) {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (data) => {
    setCustomers(prev => prev.map(c => c.name === preview.name ? { ...c, generated: true } : c));
    // Bump next BN number
    const parts = nextBnNo.split("-");
    const n = parseInt(parts[parts.length - 1], 10) + 1;
    const yy = new Date().getFullYear().toString().slice(-2);
    setNextBnNo(`${yy}-BN-${String(n).padStart(6, "0")}`);
    setPreview(null);
    setToast(`สร้าง ${data.bnNo} สำเร็จ! — ${preview.name}`);
    setTimeout(() => setToast(""), 3000);
  };

  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

  return (
    <div>
      {toast && (
        <div style={{ background: C.successBg, color: C.success, padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>
          {toast}
        </div>
      )}

      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เดือน</div>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle, width: 140 }}>
            {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ปี</div>
          <select value={year} onChange={e => setYear(e.target.value)} style={{ ...inputStyle, width: 90 }}>
            {[2026, 2025, 2024].map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <div style={{ alignSelf: "flex-end" }}>
          <Btn primary onClick={handleSearch} disabled={loading}>{loading ? <><Loader size={13}/> กำลังโหลด...</> : <><Search size={13}/> ค้นหา</>}</Btn>
        </div>
      </div>

      {error && <div style={{ marginBottom: 14 }}><ErrorBox msg={error} onRetry={handleSearch} /></div>}
      {loading && <Spinner text="กำลังดึงข้อมูลใบส่งของ..." />}

      {!loading && searched && (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontSize: 13, color: C.success, fontWeight: 500 }}><CheckCircle size={13}/> {done} ราย สร้างแล้ว</span>
            <span style={{ fontSize: 13, color: C.warning, fontWeight: 500 }}><Square size={13}/> {pending} ราย ยังไม่สร้าง</span>
          </div>
          <span style={{ fontSize: 11, color: C.muted }}>พบ {customers.length} ลูกค้า · {months[parseInt(month) - 1]} {year}</span>
        </div>
      )}

      {!loading && searched && customers.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>ไม่พบใบส่งของในเดือนนี้</div>
      )}

      {!loading && searched && customers.map((cust, i) => {
        const total = cust.invoices.reduce((s, inv) => s + (parseFloat(inv.total) || 0), 0);
        return (
          <div key={i} style={{ background: C.cardBg, border: `0.5px solid ${cust.generated ? "#a5d6a7" : C.border}`, borderRadius: 8, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", background: cust.generated ? "#e8f5e9" : "#e8f0eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{cust.generated ? <CheckCircle size={14}/> : <Square size={14}/>}</span>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{cust.name}</span>
                <span style={{ background: "#c8e6c9", color: C.success, padding: "1px 8px", borderRadius: 10, fontSize: 10, fontWeight: 500 }}>{cust.invoices.length} บิล</span>
                <Badge type={cust.generated ? "success" : "warning"}>{cust.generated ? "สร้างแล้ว" : "ยังไม่สร้าง"}</Badge>
              </div>
              <Btn small primary={!cust.generated} onClick={() => setPreview(cust)}>
                {cust.generated ? <><RefreshCw size={13}/> สร้างใหม่</> : <><Eye size={13}/> ดูตัวอย่าง</>}
              </Btn>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["เลขที่บิล", "วันที่บิล", "บาท", "สต."].map((h, j) => (
                    <th key={j} style={{ padding: "5px 12px", textAlign: j >= 2 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 10, background: "#fafafa", borderBottom: `0.5px solid ${C.borderLight}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cust.invoices.map((inv, j) => {
                  const b = Math.floor(parseFloat(inv.total) || 0);
                  const s = Math.round(((parseFloat(inv.total) || 0) - b) * 100);
                  return (
                    <tr key={j} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                      <td style={{ padding: "6px 12px", color: C.accent, fontWeight: 500 }}>{inv.no}</td>
                      <td style={{ padding: "6px 12px", color: C.muted }}>{inv.date}</td>
                      <td style={{ padding: "6px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{b.toLocaleString()}</td>
                      <td style={{ padding: "6px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: s > 0 ? C.text : C.muted }}>{s > 0 ? String(s).padStart(2, "0") : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ padding: "7px 12px", background: "#f5f9f6", display: "flex", justifyContent: "space-between", borderTop: `0.5px solid ${C.borderLight}`, fontSize: 12 }}>
              <span style={{ color: C.muted }}>รวม {cust.invoices.length} ฉบับ</span>
              <span style={{ fontWeight: 500, color: C.accent, fontVariantNumeric: "tabular-nums" }}>฿{total.toLocaleString()}</span>
            </div>
          </div>
        );
      })}

      {preview && (
        <BNPreviewModal
          customer={preview}
          onClose={() => setPreview(null)}
          onConfirm={handleConfirm}
          nextBnNo={nextBnNo}
        />
      )}
    </div>
  );
}

// ── BN History Tab ─────────────────────────────────────────

function BNHistoryTab() {
  const [search, setSearch]   = useState("");
  const [hovered, setHovered] = useState(null);
  const [bnList, setBnList]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getBNHistory();
      setBnList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const filtered = bnList.filter(bn => {
    const q = search.toLowerCase();
    return !q || (bn.bnNo || "").toLowerCase().includes(q) || (bn.customer || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเลขที่ / ลูกค้า..."
            style={{ ...inputStyle, width: 240 }} />
          <Btn small onClick={loadHistory}><RefreshCw size={14}/> รีเฟรช</Btn>
          <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {filtered.length} รายการ</span>
        </div>

        {error && <div style={{ padding: 14 }}><ErrorBox msg={error} onRetry={loadHistory} /></div>}
        {loading && <Spinner />}
        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["เลขที่ BN", "วันที่ออก", "ชื่อลูกค้า", "จำนวนบิล", "รวมเงิน"].map((h, i) => (
                  <th key={i} style={{ padding: "8px 14px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบข้อมูล</td></tr>
              ) : filtered.map((bn, i) => (
                <tr key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                  style={{ background: hovered === i ? C.rowHover : "white", borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "9px 14px", color: C.accent, fontWeight: 500 }}>{bn.bnNo}</td>
                  <td style={{ padding: "9px 14px", color: C.muted }}>{bn.date}</td>
                  <td style={{ padding: "9px 14px" }}>{bn.customer}</td>
                  <td style={{ padding: "9px 14px" }}>{bn.count} ฉบับ</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(bn.total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main BN Page ───────────────────────────────────────────

function BillingNotePage() {
  const [tab, setTab] = useState("create");
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}><ClipboardList size={15}/> ใบวางบิล</div>
      <div style={{ display: "flex", gap: 0, borderBottom: `0.5px solid ${C.border}`, marginBottom: 16, background: C.cardBg, borderRadius: "8px 8px 0 0", overflow: "hidden", border: `0.5px solid ${C.border}` }}>
        {[["create", "สร้างใบวางบิล"], ["history", "ประวัติใบวางบิล"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "12px 20px", border: "none", background: tab === key ? "white" : "#fafafa",
            color: tab === key ? C.accent : C.muted, fontWeight: tab === key ? 500 : 400,
            fontSize: 13, cursor: "pointer", borderBottom: tab === key ? `2px solid ${C.accent}` : "2px solid transparent",
          }}>{label}</button>
        ))}
      </div>
      {tab === "create"  && <CreateBNTab />}
      {tab === "history" && <BNHistoryTab />}
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
function TaxInvoiceForm({ initial, onSave, onCancel, isEdit, products, sizes }) {
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

  const upd = (i, f, v) => setItems(items.map((it, idx) => {
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
    if (descWidth(getDescText(testIt)) <= DESC_MAX) upd(i, "detail", val);
  };
  const addRow    = () => { if (items.length < ITEMS_COUNT) setItems([...items, { desc: "", desc2: "", detail: "", qty: "", unitPrice: "", amount: "" }]); };
  const addContinuationRowTI = (afterIndex) => {
    if (items.length >= ITEMS_COUNT) return;
    const next = [...items];
    next.splice(afterIndex + 1, 0, { desc: "", desc2: "", detail: "", qty: "", unitPrice: "", amount: "", _cont: true });
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
  const vat = parseFloat((sub * 0.07).toFixed(2));
  const gt  = parseFloat((sub + vat).toFixed(2));

  const ci = (i, f, a, extra = {}) => (
    <input value={items[i][f]} onChange={e => upd(i, f, e.target.value)}
      style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", outline: "none", textAlign: a || "left" }}
      onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
      onBlur={e => e.target.style.outline = "none"}
      {...extra} />
  );

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
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
        if (contParts.length > 0) {
          it.detail = [it.detail || "", ...contParts].filter(Boolean).join(" | ");
        }
        collapsed.push(it);
      }
      const filled = collapsed.filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
      const cleanItems = filled.map(({ _orig, _cont, ...it }) => it);
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
    {pendingDelete !== null && <ConfirmModal message="ยืนยันลบ?" onConfirm={() => { removeRow(pendingDelete); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} />}
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>

      {/* Customer info */}
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <SectionTitle>ข้อมูลลูกค้า</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 140px", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่</div><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อลูกค้า / บริษัท</div><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อลูกค้า" style={{ ...inputStyle, width: "100%" }} /></div>
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
              <col style={{ width: 28 }} /><col style={{ width: 60 }} /><col /><col style={{ width: 80 }} />
              <col style={{ width: 110 }} /><col style={{ width: 80 }} />
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
                const atLimit = dw >= DESC_MAX;
                return (
                  <tr key={i} style={{ background: it._cont ? "#f5f7ff" : i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}`, borderLeft: atLimit ? `3px solid ${C.danger}` : it._cont ? `3px solid ${C.accent}` : "3px solid transparent" }}>
                    <td style={{ padding: "3px 4px", textAlign: "center" }}>
                      {rowEditMode && <button onClick={() => setPendingDelete(i)} title="ลบแถว" style={{ width: 14, height: 14, borderRadius: "50%", border: "none", background: "#e5534b", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0, fontWeight: 700 }}>−</button>}
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "center" }}>{!it._cont && ci(i, "qty", "center")}</td>
                    <td style={{ padding: "3px 6px" }}>
                      {!it._cont && <select value={it.desc} onChange={e => upd(i, "desc", e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px" }}>
                        <option value="">— เลือกสินค้า —</option>
                        {products.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>}
                      {it._cont && <span style={{ color: C.accent, fontSize: 13, paddingLeft: 4 }}>↳</span>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>
                      {!it._cont && <select value={it.desc2} onChange={e => upd(i, "desc2", e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px" }}>
                        <option value="">—</option>
                        {sizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                      </select>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>
                      {ci(i, "detail", "left", {
                        "data-ti-detail-idx": i,
                        onChange: e => updateDetailTI(i, e.target.value),
                        onKeyDown: e => { if (e.key === "Enter") { e.preventDefault(); addContinuationRowTI(i); } }
                      })}
                      {atLimit && <div style={{ fontSize: 9, color: C.danger, marginTop: 1 }}>ถึงขีดจำกัด — กด Enter เพื่อขึ้นบรรทัดใหม่</div>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>{!it._cont && ci(i, "unitPrice", "right")}</td>
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
function TaxInvoiceDetail({ invoice, onBack, onSaved, products, sizes }) {
  const [editing, setEditing] = useState(false);
  const [data,    setData]    = useState(invoice);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fi  = (data.items || []).filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
  const sub = data.subtotal   ?? fi.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const vat = data.vatAmt     ?? parseFloat((sub * 0.07).toFixed(2));
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
        onCancel={() => setEditing(false)} isEdit products={products} sizes={sizes} />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการ</button>
          <span style={{ color: C.muted }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{data.id}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => generateLandscapePDF(data)} disabled={lsPdfLoading}>{lsPdfLoading ? <Loader size={13}/> : <Printer size={14}/>} พิมพ์</Btn>
          <Btn onClick={() => generateTaxInvoicePortraitPDF(data)} disabled={pdfLoading}>{pdfLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF</Btn>
          <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
        </div>
      </div>

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
function TaxInvoicePage({ products, sizes, cache, updateCache, onViewChange, goListRequest }) {
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
            <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
                placeholder="ค้นหา..." style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 200 }} />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12 }} />
              <span style={{ color: C.muted, fontSize: 11 }}>ถึง</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12 }} />
              <Btn primary small onClick={load} disabled={loading}>{loading ? <Loader size={13}/> : <><Search size={13}/> ค้นหา</>}</Btn>
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
        </div>
      )}

      {view === "detail" && selected && (
        <TaxInvoiceDetail invoice={selected} onBack={() => setView("list", null)} onSaved={() => { updateCache(cacheKey, null); load(); }} products={products} sizes={sizes} />
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setView("list", null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13 }}>← รายการ</button>
            <span style={{ color: C.muted }}>›</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>สร้างใหม่</span>
          </div>
          <TaxInvoiceForm onSave={handleSaveNew} onCancel={() => setView("list", null)}
            savingExternal={saving} products={products} sizes={sizes} />
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
  const [configLoaded, setConfigLoaded] = useState(false);
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
      case "invoice":    return <DeliveryNotePage products={products} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={setBreadcrumbSuffix} goListRequest={goListRequest} />;
      case "billing":    return <BillingNotePage cache={cache} updateCache={updateCache} />;
      case "taxinvoice": return <TaxInvoicePage products={products} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={setBreadcrumbSuffix} goListRequest={goListRequest} />;
      case "settings":   return <SettingsPage products={products} setProducts={setProducts} sizes={sizes} setSizes={setSizes} />;
      default:           return <PlaceholderPage title={NAV.find(n => n.key === active)?.label} icon={NAV.find(n => n.key === active)?.icon} />;
    }
  };

  const NAV_ICONS = { FileText, ClipboardList, Receipt, Package, BarChart2, Users, Settings, ArrowLeftRight, LayoutDashboard };

  const NavItem = ({ item }) => (
    <div onClick={() => setActive(item.key)} style={{
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
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>v1.4.17</span>
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