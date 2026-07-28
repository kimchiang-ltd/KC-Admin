// ============================================================
// VatSalesBlankForm (#342b) — รายงานภาษีขาย (แบบฟอร์มเปล่า)
// ============================================================
// Blank editable ภ.พ.30 form under อื่นๆ.
// Date picker per row, customer autocomplete (auto-fill taxId/branch),
// manual subtotal, VAT auto-calc from config vatRate, add/delete rows,
// auto-sum footer, print A4 portrait.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Printer, Plus, X, Loader, RefreshCw, Trash2, Save, ChevronLeft, FileText, CheckCircle } from "lucide-react";
import { C } from "../../shared/constants.jsx";
import { Btn, Spinner, ConfirmModal } from "../../shared/ui.jsx";
import { CustomerAutocomplete } from "../../shared/autocomplete.jsx"; // #344 — shared component (handles z-index/positioning)
import { tiApi } from "../ti/tiApi.jsx";
import { api } from "../../shared/api.jsx";
import { fmtAmt } from "../../shared/utils.jsx";

const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

// #354 — generate docNo from type + subject (e.g. "กรกฎาคม 2569" → "VS-6907")
// #362 — append sequence number to avoid duplicates for same-period forms
function makeDocNo(type, subject, existingDocNos) {
  if (!subject) return "";
  const parts = (subject || "").split(" ");
  const mi = THAI_MONTHS.indexOf(parts[0]);
  const beYear = parseInt(parts[1]) || 0;
  if (mi < 0 || !beYear) return "";
  const prefix = type === "VAT_PURCHASE" ? "VP" : "VS";
  const base = prefix + "-" + String(beYear).slice(-2) + String(mi + 1).padStart(2, "0");
  let seq = 1;
  if (existingDocNos?.length) {
    for (const dn of existingDocNos) {
      if (dn === base || dn?.startsWith(base + "-")) seq++;
    }
  }
  return base + "-" + seq;
}

function fmtDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.getDate() + "/" + (d.getMonth() + 1) + "/" + ((d.getFullYear() + 543) % 100);
}

function branchLabelPrint(b) {
  if (!b) return { hq: false, branch: "" };
  if (b === "00000") return { hq: true, branch: "" };
  return { hq: false, branch: b };
}

function makeEmptyRow(month, year) {
  const date = (month !== undefined && year !== undefined)
    ? `${year}-${String(month + 1).padStart(2, "0")}-01`
    : "";
  return { id: crypto.randomUUID(), date, tiNo: "", name: "", taxId: "", branchHq: false, branch: "", subtotal: "", vat: "", vatManual: false };
}

// ── tiApi override for shared CustomerAutocomplete (#344) ──
const tiCustomerApi = { getCustomers: () => tiApi.getCustomers("") };

// ── Shared config cache (prefetched by list pages) ──────
let _configCache = null;
let _configPromise = null;

function prefetchVatConfig() {
  if (_configCache) return Promise.resolve(_configCache);
  if (_configPromise) return _configPromise;
  _configPromise = tiApi.getConfig().then(cfg => {
    _configCache = cfg;
    _configPromise = null;
    return cfg;
  }).catch(() => { _configPromise = null; return null; });
  return _configPromise;
}

function getVatConfigCache() { return _configCache; }

// ── A4 Print ─────────────────────────────────────────────
function printA4(rows, monthIdx, year, company) {
  const beYear = year + 543;
  const monthName = THAI_MONTHS[monthIdx];
  const taxIdDigits = (company.taxId || "").replace(/\D/g, "").padEnd(13, " ");
  const sumSubtotal = rows.reduce((s, r) => s + (parseFloat(r.subtotal) || 0), 0);
  const sumVat = rows.reduce((s, r) => s + (parseFloat(r.vat) || 0), 0);

  const taxIdBoxes = (digits) => digits.split("").map((d, i) =>
    `<span style="display:inline-block;width:16px;height:18px;border:1px solid #333;${i > 0 ? "border-left:none;" : ""}text-align:center;font-size:11px;font-weight:600;line-height:18px;">${d.trim()}</span>`
  ).join("");

  const MIN_ROWS = 20;
  let rowNum = 0;
  const dataRows = rows.filter(r => r.date || r.tiNo || r.name || r.subtotal).map(r => {
    rowNum++;
    const bp = branchLabelPrint(r.branchHq ? "00000" : r.branch);
    return `<tr>
      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:9pt;">${rowNum}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:center;">${fmtDateShort(r.date)}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:center;font-size:9pt;">${r.tiNo || ""}</td>
      <td style="border:1px solid #333;padding:3px 4px;">${r.name || ""}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:center;font-size:9pt;">${r.taxId || ""}</td>
      <td style="border:1px solid #333;padding:3px 2px;text-align:center;">${bp.hq ? "✓" : ""}</td>
      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:9pt;">${bp.branch}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:right;font-variant-numeric:tabular-nums;">${fmtAmt(parseFloat(r.subtotal) || 0)}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:right;font-variant-numeric:tabular-nums;">${fmtAmt(parseFloat(r.vat) || 0)}</td>
    </tr>`;
  }).join("\n");

  const filledCount = rows.filter(r => r.date || r.tiNo || r.name || r.subtotal).length;
  const emptyRows = Array.from({ length: Math.max(0, MIN_ROWS - filledCount) }, () =>
    `<tr><td style="border:1px solid #333;padding:5px 3px;">&nbsp;</td><td style="border:1px solid #333;"></td><td style="border:1px solid #333;"></td><td style="border:1px solid #333;"></td><td style="border:1px solid #333;"></td><td style="border:1px solid #333;"></td><td style="border:1px solid #333;"></td><td style="border:1px solid #333;"></td><td style="border:1px solid #333;"></td></tr>`
  ).join("\n");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@page { size: A4 portrait; margin: 14mm 10mm 10mm 10mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Sarabun", "Prompt", sans-serif; font-size: 10pt; color: #111; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
td { word-break: break-word; }
th { font-weight: 600; }
</style></head><body>

<div style="text-align:center;margin-bottom:8px;">
  <div style="font-size:15pt;font-weight:700;">รายงานภาษีขาย</div>
  <div style="font-size:11pt;margin-top:3px;">
    เดือนภาษี <u>&nbsp;${monthName}&nbsp;</u> ปี <u>&nbsp;พ.ศ. ${beYear}&nbsp;</u>
  </div>
</div>

<div style="font-size:10pt;margin-bottom:2px;">
  ชื่อผู้ประกอบการ&nbsp;&nbsp;&nbsp;<b>${company.name || ""}</b>
</div>
<div style="font-size:10pt;margin-bottom:2px;display:flex;align-items:center;">
  เลขประจำตัวผู้เสียภาษีอากร&nbsp;${taxIdBoxes(taxIdDigits)}
</div>
<div style="font-size:10pt;margin-bottom:10px;display:flex;align-items:center;flex-wrap:wrap;">
  ชื่อสถานประกอบการ&nbsp;&nbsp;${company.name || ""}&nbsp;&nbsp;&nbsp;
  <span style="display:inline-flex;gap:0;">
    ${taxIdBoxes("     ")}
  </span>
  &nbsp;&nbsp;สำนักงานใหญ่&nbsp;<span style="display:inline-block;width:12px;height:12px;border:1px solid #333;vertical-align:-1px;"></span>
  &nbsp;&nbsp;สาขา&nbsp;<span style="display:inline-block;width:12px;height:12px;border:1px solid #333;vertical-align:-1px;"></span>
</div>

<table style="font-size:9pt;">
  <thead>
    <tr>
      <th rowspan="2" style="border:1px solid #333;padding:3px 2px;text-align:center;vertical-align:middle;width:4%;font-size:8pt;line-height:1.3;">ลำดับ<br>ที่</th>
      <th colspan="2" style="border:1px solid #333;padding:3px 2px;text-align:center;vertical-align:middle;">ใบกำกับภาษี</th>
      <th rowspan="2" style="border:1px solid #333;padding:3px 2px;text-align:center;vertical-align:middle;width:25%;">ชื่อผู้ซื้อสินค้า<br>ผู้รับบริการ</th>
      <th rowspan="2" style="border:1px solid #333;padding:3px 2px;text-align:center;vertical-align:middle;width:16%;font-size:8pt;line-height:1.3;">เลขประจำตัวผู้เสีย<br>ภาษีอากรของผู้ซื้อ<br>สินค้าผู้รับบริการ</th>
      <th colspan="2" style="border:1px solid #333;padding:3px 2px;text-align:center;vertical-align:middle;">สถานประกอบการ</th>
      <th rowspan="2" style="border:1px solid #333;padding:3px 2px;text-align:center;vertical-align:middle;width:13%;font-size:8.5pt;line-height:1.3;">มูลค่าสินค้า<br>หรือบริการ</th>
      <th rowspan="2" style="border:1px solid #333;padding:3px 2px;text-align:center;vertical-align:middle;width:11%;font-size:8.5pt;line-height:1.3;">จำนวนเงิน<br>ภาษีมูลค่าเพิ่ม</th>
    </tr>
    <tr>
      <th style="border:1px solid #333;padding:2px;text-align:center;font-size:8pt;width:9%;line-height:1.3;">วัน เดือน ปี</th>
      <th style="border:1px solid #333;padding:2px;text-align:center;font-size:8pt;width:10%;line-height:1.3;">เล่มที่ /<br>เลขที่</th>
      <th style="border:1px solid #333;padding:2px;text-align:center;font-size:8pt;width:6%;line-height:1.2;">สำนักงาน<br>ใหญ่</th>
      <th style="border:1px solid #333;padding:2px;text-align:center;font-size:8pt;width:6%;">สาขา</th>
    </tr>
  </thead>
  <tbody>
    ${dataRows}
    ${emptyRows}
    <tr>
      <td colspan="7" style="border:1px solid #333;padding:4px 3px;text-align:center;font-weight:700;">รวม</td>
      <td style="border:1px solid #333;padding:4px 3px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">${fmtAmt(sumSubtotal)}</td>
      <td style="border:1px solid #333;padding:4px 3px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">${fmtAmt(sumVat)}</td>
    </tr>
  </tbody>
</table>
</body></html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

// ── Main Component ───────────────────────────────────────
function VatSalesBlankForm({ rowId: initialRowId, onBack }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()); // 0-based for THAI_MONTHS index
  const [year, setYear]   = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [deleting, setDeleting] = useState(false);   // #365
  const [deleteConfirm, setDeleteConfirm] = useState(false); // #365
  const [rowId, setRowId]     = useState(initialRowId || null); // #345 — track saved row

  const [company, setCompany]       = useState({});
  const [vatRate, setVatRate]       = useState(0.07);
  const [rows, setRows]             = useState(() => [makeEmptyRow(now.getMonth(), now.getFullYear())]);

  // Load config (from prefetch cache if available) + existing doc if editing
  useEffect(() => {
    (async () => {
      const needsDocLoad = !!initialRowId;
      if (needsDocLoad) { setLoading(true); setError(""); }
      else { setLoading(false); }
      try {
        // Config: use cache (prefetched by list page), or fetch if not yet cached
        const cfg = _configCache || await prefetchVatConfig();
        if (cfg) {
          setCompany(cfg.company || {});
          if (typeof cfg.vatRate === "number" && cfg.vatRate > 0) setVatRate(cfg.vatRate);
        }

        // #345 — load existing doc for edit
        if (initialRowId) {
          const doc = await api.loadOtherDoc(initialRowId);
          if (doc.items && doc.items.length > 0) {
            setRows(doc.items.map(item => ({ ...makeEmptyRow(), ...item })));
          }
          if (doc.subject) {
            const parts = doc.subject.split(" ");
            const mi = THAI_MONTHS.indexOf(parts[0]);
            if (mi >= 0) setMonth(mi);
            if (parts[1]) { const be = parseInt(parts[1]); if (be > 2500) setYear(be - 543); }
          }
        }
      } catch (e) { setError(e.message || "โหลดข้อมูลไม่สำเร็จ"); }
      finally { setLoading(false); }
    })();
  }, [initialRowId]);

  const updateRow = useCallback((id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // Auto-calc VAT when subtotal changes (unless user has manually edited VAT)
      if (field === "subtotal" && !r.vatManual) {
        const sub = parseFloat(value) || 0;
        updated.vat = sub > 0 ? (sub * vatRate).toFixed(2) : "";
      }
      // If user manually edits VAT, flag it
      if (field === "vat") {
        updated.vatManual = true;
      }
      // Reset vatManual if subtotal changes after manual VAT edit
      if (field === "subtotal") {
        updated.vatManual = false;
        const sub = parseFloat(value) || 0;
        updated.vat = sub > 0 ? (sub * vatRate).toFixed(2) : "";
      }
      // Branch logic: if branchHq toggled on, clear branch number
      if (field === "branchHq" && value) {
        updated.branch = "";
      }
      return updated;
    }));
  }, [vatRate]);

  const confirmVatManual = useCallback((id) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    const sub = parseFloat(row.subtotal) || 0;
    const autoVat = sub > 0 ? (sub * vatRate).toFixed(2) : "";
    const manualVat = row.vat;
    if (!manualVat || manualVat === autoVat) return;
    setVatConfirm({ id, autoVat, manualVat });
  }, [vatRate, rows]);

  // #357 — track loaded customers for new-customer detection on blur
  const customersRef = useRef([]);

  const selectCustomer = useCallback((id, cust) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        name: cust.name || "",
        taxId: cust.taxId || "",
        branchHq: cust.branch === "00000",
        branch: cust.branch && cust.branch !== "00000" ? cust.branch : "",
      };
    }));
  }, []);

  // #363 — rowsRef stays in sync so blur handlers read latest state (not stale closure)
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

  // #363 — styled modal for new customer prompt (replaces window.confirm)
  const promptedRowsRef = useRef(new Set());
  const [newContactPrompt, setNewContactPrompt] = useState(null); // { id, name, taxId, branch }
  const [actionError, setActionError] = useState(null);
  const [vatConfirm, setVatConfirm] = useState(null); // { id, autoVat, manualVat }

  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

  const checkNewCustomer = useCallback((id) => {
    if (promptedRowsRef.current.has(id)) return;
    // Use setTimeout to let React flush the latest onChange before reading
    setTimeout(() => {
      const row = rowsRef.current.find(r => r.id === id);
      if (!row || !row.name.trim()) return;
      const name = row.name.trim();
      const exists = customersRef.current.some(c => c.name.toLowerCase() === name.toLowerCase());
      if (exists) return;
      if (!row.taxId && !row.branchHq && !row.branch) return;
      promptedRowsRef.current.add(id);
      const branch = row.branchHq ? "00000" : (row.branch || "");
      setNewContactPrompt({ id, name, taxId: row.taxId || "", branch });
    }, 50);
  }, []);

  const handleContactConfirm = () => {
    if (!newContactPrompt) return;
    // Re-read latest row state at confirm time (user may have filled branch after prompt appeared)
    const row = rowsRef.current.find(r => r.id === newContactPrompt.id);
    const name = newContactPrompt.name;
    const taxId = row?.taxId || newContactPrompt.taxId;
    const branch = row?.branchHq ? "00000" : (row?.branch || newContactPrompt.branch);
    tiApi.createCustomer({ name, taxId, branch }).then(() => {
      tiApi.getCustomers("").then(list => { customersRef.current = list; });
    }).catch(e => setActionError("เพิ่มลูกค้าไม่สำเร็จ: " + (e.message || e)));
    setNewContactPrompt(null);
  };
  const handleContactCancel = () => setNewContactPrompt(null);

  const addRow = () => setRows(prev => [...prev, makeEmptyRow(month, year)]);
  const deleteRow = (id) => setRows(prev => prev.filter(r => r.id !== id));

  const sumSubtotal = rows.reduce((s, r) => s + (parseFloat(r.subtotal) || 0), 0);
  const sumVat = rows.reduce((s, r) => s + (parseFloat(r.vat) || 0), 0);

  const handlePrint = () => {
    const filled = rows.filter(r => r.date || r.tiNo || r.name || r.subtotal);
    if (filled.length === 0) return;
    printA4(rows, month, year, company);
  };

  // #345 — save to Other Docs sheet
  const handleSave = async () => {
    const filled = rows.filter(r => r.date || r.tiNo || r.name || r.subtotal);
    if (filled.length === 0) return;
    setSaving(true);
    try {
      const beYear = year + 543;
      const subject = THAI_MONTHS[month] + " " + beYear;
      const result = await api.saveOtherDoc({
        rowId: rowId || undefined,
        type: "VAT",
        date: year + "-" + String(month + 1).padStart(2, "0") + "-01", // first of month
        subject,
        items: rows.map(r => ({ date: r.date, tiNo: r.tiNo, name: r.name, taxId: r.taxId, branchHq: r.branchHq, branch: r.branch, subtotal: r.subtotal, vat: r.vat, vatManual: r.vatManual })),
        remarks: "",
      });
      if (result?.rowId) setRowId(result.rowId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setActionError("บันทึกไม่สำเร็จ: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  // #365 — delete from form view
  const handleDelete = async () => {
    setDeleteConfirm(false);
    setDeleting(true);
    try {
      await api.deleteOtherDoc(rowId, "VAT");
      setDeleting(false);
      setSaved(false);
      onBack();
    } catch (e) {
      setActionError("ลบไม่สำเร็จ: " + (e.message || e));
      setDeleting(false);
    }
  };

  // Month/year controls
  // #358b — update rows with default date (1st of old month) to 1st of new month
  const updateDefaultDates = (oldM, oldY, newM, newY) => {
    const oldDefault = `${oldY}-${String(oldM + 1).padStart(2, "0")}-01`;
    const newDefault = `${newY}-${String(newM + 1).padStart(2, "0")}-01`;
    setRows(prev => prev.map(r => r.date === oldDefault ? { ...r, date: newDefault } : r));
  };

  const beYear = year + 543;
  const monthLabel = THAI_MONTHS[month] + " " + beYear;
  const prevMonth = () => {
    const newM = month === 0 ? 11 : month - 1;
    const newY = month === 0 ? year - 1 : year;
    updateDefaultDates(month, year, newM, newY);
    setMonth(newM); if (month === 0) setYear(y => y - 1);
  };
  const nextMonth = () => {
    const n = new Date();
    if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth())) return;
    const newM = month === 11 ? 0 : month + 1;
    const newY = month === 11 ? year + 1 : year;
    updateDefaultDates(month, year, newM, newY);
    setMonth(newM); if (month === 11) setYear(y => y + 1);
  };

  const cellInput = { padding: "4px 6px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, boxSizing: "border-box", fontFamily: "inherit" };

  if (loading) return <div style={{ padding: 20, textAlign: "center" }}><Spinner /></div>;
  if (error) return <div style={{ padding: 20 }}><div style={{ color: C.danger, marginBottom: 8 }}>{error}</div><Btn onClick={() => window.location.reload()}><RefreshCw size={13}/> ลองใหม่</Btn></div>;

  return (
    <div style={{ position: "relative" }}>
      {/* ── Saving / Deleting overlay ── */}
      {(saving || deleting) && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.cardBg, padding: "12px 24px", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: 14, fontWeight: 500 }}>
            <Loader size={16} className="spin"/> {deleting ? "กำลังลบ..." : "กำลังบันทึก..."}
          </div>
        </div>
      )}
      {/* #365 — delete confirm modal */}
      {deleteConfirm && (
        <ConfirmModal
          message="ต้องการลบแบบฟอร์มนี้หรือไม่? ข้อมูลจะถูกลบอย่างถาวร"
          confirmLabel="ลบ"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
      {/* #338 — VAT manual confirm modal (replaces window.confirm) */}
      {vatConfirm && (
        <ConfirmModal
          message={`ภาษีมูลค่าเพิ่มถูกแก้ไขเอง\nคำนวณอัตโนมัติ = ${vatConfirm.autoVat}\nค่าที่กรอก = ${vatConfirm.manualVat}\n\nต้องการใช้ค่าที่กรอกเองใช่ไหม?`}
          confirmLabel="ใช้ค่าที่กรอก"
          onConfirm={() => setVatConfirm(null)}
          onCancel={() => {
            setRows(prev => prev.map(r => r.id !== vatConfirm.id ? r : { ...r, vat: vatConfirm.autoVat, vatManual: false }));
            setVatConfirm(null);
          }}
        />
      )}
      {/* #338 — action error toast */}
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B" }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
      {/* ── Action bar ── */}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.text, padding: "2px 6px" }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 500, minWidth: 140, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.text, padding: "2px 6px" }}>›</button>
        </div>
        <span style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: C.muted }}>VAT {+(vatRate * 100).toFixed(2)}%</span>
        <Btn small onClick={handleSave} disabled={saving} style={saved ? { background: "#DEF7EC", color: "#03543F", borderColor: "#A7F3D0" } : undefined}>
          {saving ? <><Loader size={13} className="spin"/> บันทึก</> : saved ? <><CheckCircle size={13}/> บันทึกแล้ว</> : <><Save size={13}/> บันทึก</>}
        </Btn>
        <Btn small primary onClick={handlePrint}>
          <Printer size={13}/> พิมพ์ A4
        </Btn>
        {rowId && (
          <Btn small onClick={() => setDeleteConfirm(true)} style={{ color: C.danger, borderColor: C.danger }}>
            <Trash2 size={13}/> ลบ
          </Btn>
        )}
      </div>

      {/* ── Editable table ── */}
      <div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f8f8f8" }}>
              <th style={{ padding: "8px 4px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 32 }}>#</th>
              <th style={{ padding: "8px 4px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 110 }}>วันที่</th>
              <th style={{ padding: "8px 4px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 100 }}>เลขที่</th>
              <th style={{ padding: "8px 4px", textAlign: "left", border: `0.5px solid ${C.border}`, fontWeight: 500, minWidth: 160 }}>ชื่อผู้ซื้อสินค้า/ผู้รับบริการ</th>
              <th style={{ padding: "8px 4px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 140, fontSize: 11, lineHeight: 1.3 }}>เลขประจำตัว<br/>ผู้เสียภาษีอากร</th>
              <th style={{ padding: "8px 4px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 50, fontSize: 11, lineHeight: 1.3 }}>สำนักงาน<br/>ใหญ่</th>
              <th style={{ padding: "8px 4px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 60 }}>สาขา</th>
              <th style={{ padding: "8px 4px", textAlign: "right", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 110, fontSize: 11, lineHeight: 1.3 }}>มูลค่าสินค้า<br/>หรือบริการ</th>
              <th style={{ padding: "8px 4px", textAlign: "right", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 100, fontSize: 11, lineHeight: 1.3 }}>ภาษี<br/>มูลค่าเพิ่ม</th>
              <th style={{ padding: "8px 4px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ padding: "4px", textAlign: "center", border: `0.5px solid ${C.border}`, color: C.muted, fontSize: 11 }}>{i + 1}</td>
                <td style={{ padding: "3px 4px", border: `0.5px solid ${C.border}` }}>
                  <input type="date" value={r.date} onChange={e => updateRow(r.id, "date", e.target.value)}
                    style={{ ...cellInput, width: "100%" }} />
                </td>
                <td style={{ padding: "3px 4px", border: `0.5px solid ${C.border}` }}>
                  <input value={r.tiNo} onChange={e => updateRow(r.id, "tiNo", e.target.value)}
                    placeholder="TI-XXXX" style={{ ...cellInput, width: "100%" }} />
                </td>
                <td style={{ padding: "3px 4px", border: `0.5px solid ${C.border}` }}>
                  <CustomerAutocomplete
                    value={r.name}
                    onChange={v => updateRow(r.id, "name", v)}
                    onSelect={c => selectCustomer(r.id, c)}
                    onCustomersLoaded={list => { customersRef.current = list; }}
                    apiOverride={tiCustomerApi}
                    style={{ width: "100%", padding: "4px 6px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, boxSizing: "border-box" }}
                  />
                </td>
                <td style={{ padding: "3px 4px", border: `0.5px solid ${C.border}` }}>
                  <input value={r.taxId} onChange={e => updateRow(r.id, "taxId", e.target.value.replace(/\D/g, "").slice(0, 13))}
                    inputMode="numeric" maxLength={13} placeholder="0000000000000"
                    style={{ ...cellInput, width: "100%", letterSpacing: 1, fontVariantNumeric: "tabular-nums" }} />
                </td>
                <td style={{ padding: "3px 4px", border: `0.5px solid ${C.border}`, textAlign: "center" }}>
                  <input type="checkbox" checked={r.branchHq}
                    onChange={e => { updateRow(r.id, "branchHq", e.target.checked); setTimeout(() => checkNewCustomer(r.id), 0); }}
                    style={{ cursor: "pointer" }} />
                </td>
                <td style={{ padding: "3px 4px", border: `0.5px solid ${C.border}` }}>
                  <input value={r.branch} onChange={e => updateRow(r.id, "branch", e.target.value.replace(/\D/g, "").slice(0, 5))}
                    onBlur={() => checkNewCustomer(r.id)}
                    disabled={r.branchHq} inputMode="numeric" maxLength={5}
                    placeholder={r.branchHq ? "" : "00001"}
                    style={{ ...cellInput, width: "100%", opacity: r.branchHq ? 0.3 : 1 }} />
                </td>
                <td style={{ padding: "3px 4px", border: `0.5px solid ${C.border}` }}>
                  <input value={r.subtotal} onChange={e => updateRow(r.id, "subtotal", e.target.value)}
                    inputMode="decimal" placeholder="0.00"
                    style={{ ...cellInput, width: "100%", textAlign: "right", fontVariantNumeric: "tabular-nums" }} />
                </td>
                <td style={{ padding: "3px 4px", border: `0.5px solid ${C.border}` }}>
                  <input value={r.vat} onChange={e => updateRow(r.id, "vat", e.target.value)}
                    onBlur={() => confirmVatManual(r.id)}
                    inputMode="decimal" placeholder="0.00"
                    style={{ ...cellInput, width: "100%", textAlign: "right", fontVariantNumeric: "tabular-nums", color: r.vatManual ? C.text : C.muted }}
                    title={r.vatManual ? "แก้ไขเอง" : `คำนวณอัตโนมัติ ${+(vatRate * 100).toFixed(2)}%`} />
                </td>
                <td style={{ padding: "3px 2px", border: `0.5px solid ${C.border}`, textAlign: "center" }}>
                  {rows.length > 1 && (
                    <button onClick={() => deleteRow(r.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = C.danger}
                      onMouseLeave={e => e.currentTarget.style.color = C.muted}
                      title="ลบแถว">
                      <X size={14}/>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {/* Footer sum */}
            <tr style={{ background: "#fef3c7", fontWeight: 500 }}>
              <td colSpan={7} style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}` }}>รวม</td>
              <td style={{ padding: "8px 6px", textAlign: "right", border: `0.5px solid ${C.border}`, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(sumSubtotal)}</td>
              <td style={{ padding: "8px 6px", textAlign: "right", border: `0.5px solid ${C.border}`, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(sumVat)}</td>
              <td style={{ border: `0.5px solid ${C.border}` }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Bottom add row ── */}
      <div style={{ marginTop: 8 }}>
        <Btn small onClick={addRow}><Plus size={13}/> เพิ่มแถว</Btn>
      </div>

      {/* #363 — styled new-customer prompt */}
      {newContactPrompt && (
        <ConfirmModal
          message={`ไม่พบ "${newContactPrompt.name}" ในรายชื่อลูกค้า\nต้องการเพิ่มเป็นลูกค้าใหม่ไหม?`}
          confirmLabel="ใช่ เพิ่มลูกค้า"
          onConfirm={handleContactConfirm}
          onCancel={handleContactCancel}
        />
      )}
    </div>
  );
}

// ── #345 VAT Form List (DN-style) ───────────────────────
let _vatDocsCache = null;

function VatSalesListPage({ onViewChange }) {
  const [docs, setDocs]       = useState(_vatDocsCache || []);
  const [loading, setLoading] = useState(!_vatDocsCache);
  const [error, setError]     = useState("");
  const [view, setView]       = useState("list"); // "list" | "form"
  const [editId, setEditId]   = useState(null);

  const loadList = async (silent) => {
    if (!silent) { setLoading(true); }
    setError("");
    try {
      const res = await api.listOtherDocs("VAT");
      const rows = res?.rows || [];
      _vatDocsCache = rows;
      setDocs(rows);
    } catch (e) { if (!silent) setError(e.message || "โหลดไม่สำเร็จ"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadList(_vatDocsCache ? true : false); prefetchVatConfig(); }, []);

  // #350 — update breadcrumb when entering/leaving form view
  const handleCreate = () => { setEditId(null); setView("form"); if (onViewChange) onViewChange("สร้างรายงานภาษีขาย"); };
  const handleEdit   = (id) => { setEditId(id); setView("form"); if (onViewChange) onViewChange("แก้ไขรายงานภาษีขาย"); };
  const handleBack   = () => { setView("list"); setEditId(null); loadList(true); if (onViewChange) onViewChange("รายงานภาษีขาย"); };

  if (view === "form") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button onClick={handleBack} style={{ fontSize: 12, padding: "4px 10px", border: `0.5px solid ${C.border}`, borderRadius: 5, background: C.pageBg, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={14}/> กลับ
        </button>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{editId ? "แก้ไขรายงานภาษีขาย" : "สร้างรายงานภาษีขาย"}</span>
      </div>
      <VatSalesBlankForm rowId={editId} onBack={handleBack} />
    </div>
  );

  // List view
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 500, flex: 1 }}><FileText size={15}/> รายงานภาษีขาย</div>
        <Btn primary onClick={handleCreate}>+ สร้างรายงานภาษีขายใหม่</Btn>
      </div>

      {loading && <div style={{ padding: 20, textAlign: "center" }}><Spinner /></div>}
      {error && <div style={{ padding: 12, color: C.danger, fontSize: 12 }}>{error} <Btn small onClick={loadList}><RefreshCw size={12}/> ลองใหม่</Btn></div>}

      {!loading && !error && docs.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>
          ยังไม่มีรายงาน — กด "+ สร้าง" เพื่อเริ่มต้น
        </div>
      )}

      {!loading && docs.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f8f8f8" }}>
              <th style={{ padding: "8px 6px", textAlign: "left", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 90 }}>เลขที่</th>
              <th style={{ padding: "8px 6px", textAlign: "left", border: `0.5px solid ${C.border}`, fontWeight: 500 }}>เดือน/ปี</th>
              <th style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 80 }}>จำนวนแถว</th>
              <th style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 140 }}>สร้างเมื่อ</th>
              <th style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 140 }}>แก้ไขล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d, i) => {
              let itemCount = 0;
              try { const items = typeof d.items === "string" ? JSON.parse(d.items) : d.items; itemCount = Array.isArray(items) ? items.filter(r => r.date || r.tiNo || r.name || r.subtotal).length : 0; } catch {}
              return (
                <tr key={d.id} style={{ cursor: "pointer", background: i % 2 === 0 ? "white" : "#fafafa" }}
                  onClick={() => handleEdit(d.id)}
                  onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafafa"}>
                  <td style={{ padding: "8px 6px", border: `0.5px solid ${C.border}`, fontWeight: 500, color: C.accent }}>{d.docNo || makeDocNo("VAT", d.subject, docs.slice(i + 1).map(x => x.docNo || ""))}</td>
                  <td style={{ padding: "8px 6px", border: `0.5px solid ${C.border}`, fontWeight: 500 }}>{d.subject || "—"}</td>
                  <td style={{ padding: "8px 6px", border: `0.5px solid ${C.border}`, textAlign: "center" }}>{itemCount} รายการ</td>
                  <td style={{ padding: "8px 6px", border: `0.5px solid ${C.border}`, textAlign: "center", color: C.muted }}>{d.createdAt}</td>
                  <td style={{ padding: "8px 6px", border: `0.5px solid ${C.border}`, textAlign: "center", color: C.muted }}>{d.updatedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export { VatSalesBlankForm, VatSalesListPage, prefetchVatConfig, getVatConfigCache, makeDocNo };
