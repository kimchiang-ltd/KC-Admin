// ============================================================
// VAT Sales Report (#338c) — รายงานภาษีขาย
// ============================================================
// Monthly VAT sales report per Thai Revenue Department format.
// Data: TI list from tiApi.getTaxInvoices (Invoice Admin backend).
// Customer taxId + branch: tiApi.getCustomers lookup.
// Company info (name, taxId): tiApi.getConfig().company.
// Interactive fill-in: missing taxId/branch → modal → tiApi.updateCustomer.
// Print: A4 portrait matching the ภ.พ.30 template.

import React, { useState, useEffect, useCallback } from "react";
import { Printer, RefreshCw, Loader, X } from "lucide-react";
import { C } from "../../shared/constants.jsx";
import { Btn, Spinner } from "../../shared/ui.jsx";
import { tiApi } from "../ti/tiApi.jsx";
import { DateRangePicker } from "../invoice/InvoicePage.jsx";
import { fmtAmt } from "../../shared/utils.jsx";

const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

// "yyyy-MM-dd" → "d/M/พ.ศ.สองหลัก" e.g. "2026-07-01" → "1/7/69"
function fmtDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.getDate() + "/" + (d.getMonth() + 1) + "/" + ((d.getFullYear() + 543) % 100);
}

// Branch display: "" → "", "00000" → "สนญ.", else "สาขา NNNNN"
function branchLabel(b) {
  if (!b) return "";
  if (b === "00000") return "สนญ.";
  return "สาขา " + b;
}
function branchLabelPrint(b) {
  if (!b) return { hq: false, branch: "" };
  if (b === "00000") return { hq: true, branch: "" };
  return { hq: false, branch: b };
}

// ── Fill-in Modal ─────────────────────────────────────────
function FillModal({ type, customerName, currentValue, onSave, onClose }) {
  // type = "taxId" | "branch"
  const [value, setValue] = useState(currentValue || "");
  const [branchMode, setBranchMode] = useState(currentValue && currentValue !== "00000" ? "branch" : "main");
  const [branchNum, setBranchNum] = useState(currentValue && currentValue !== "00000" ? currentValue : "00001");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      let payload = {};
      if (type === "taxId") {
        const v = value.replace(/\D/g, "");
        if (v.length !== 13) { setErr("ต้องเป็นตัวเลข 13 หลัก"); setSaving(false); return; }
        payload.taxId = v;
      } else {
        payload.branch = branchMode === "main" ? "00000" : branchNum.padStart(5, "0");
      }
      payload.name = customerName; // backend requires data.name on every update
      await tiApi.updateCustomer(customerName, payload);
      onSave(payload);
    } catch (e) { setErr(e.message || "บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 10, width: 380, maxWidth: "92vw", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `0.5px solid ${C.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{type === "taxId" ? "กรอกเลขประจำตัว 13 หลัก" : "เลือกสาขา"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 20, lineHeight: 1, padding: "0 4px" }}><X size={18}/></button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>ลูกค้า: <strong style={{ color: C.text }}>{customerName}</strong></div>
          {type === "taxId" ? (
            <input
              value={value}
              onChange={e => setValue(e.target.value.replace(/\D/g, "").slice(0, 13))}
              placeholder="0000000000000"
              inputMode="numeric"
              maxLength={13}
              style={{ width: "100%", padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 15, letterSpacing: 2, fontVariantNumeric: "tabular-nums", boxSizing: "border-box" }}
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name="bmode" checked={branchMode === "main"} onChange={() => setBranchMode("main")} /> สำนักงานใหญ่
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name="bmode" checked={branchMode === "branch"} onChange={() => setBranchMode("branch")} /> สาขาเลขที่
                {branchMode === "branch" && (
                  <input
                    value={branchNum}
                    onChange={e => setBranchNum(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    inputMode="numeric"
                    maxLength={5}
                    style={{ width: 70, padding: "4px 8px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, letterSpacing: 1 }}
                    autoFocus
                    onBlur={e => { const v = e.target.value; if (v && v.length < 5) setBranchNum(v.padStart(5, "0")); }}
                  />
                )}
              </label>
            </div>
          )}
          {err && <div style={{ color: C.danger, fontSize: 12, marginTop: 6 }}>{err}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: `0.5px solid ${C.border}` }}>
          <Btn onClick={onClose}>ยกเลิก</Btn>
          <Btn primary onClick={handleSave} disabled={saving}>{saving ? <Loader size={13}/> : null} บันทึก</Btn>
        </div>
      </div>
    </div>
  );
}

// ── A4 Print ──────────────────────────────────────────────
function printA4(rows, monthIdx, year, company, customerMap) {
  const beYear = year + 543;
  const monthName = THAI_MONTHS[monthIdx];
  const taxIdDigits = (company.taxId || "").replace(/\D/g, "").padEnd(13, " ");
  const sumSubtotal = rows.reduce((s, r) => s + (r.subtotal || 0), 0);
  const sumVat = rows.reduce((s, r) => s + (r.vatAmt || 0), 0);

  // Render tax ID boxes
  const taxIdBoxes = (digits) => digits.split("").map((d, i) =>
    `<span style="display:inline-block;width:16px;height:18px;border:1px solid #333;${i > 0 ? "border-left:none;" : ""}text-align:center;font-size:11px;font-weight:600;line-height:18px;">${d.trim()}</span>`
  ).join("");

  // Min rows to fill page
  const MIN_ROWS = 20;
  const dataRows = rows.map((r, i) => {
    const cust = customerMap[r.name] || {};
    const bp = branchLabelPrint(cust.branch);
    return `<tr>
      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:9pt;">${i + 1}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:center;">${fmtDateShort(r.date)}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:center;font-size:9pt;">${r.id || ""}</td>
      <td style="border:1px solid #333;padding:3px 4px;">${r.name || ""}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:center;font-size:9pt;">${cust.taxId || ""}</td>
      <td style="border:1px solid #333;padding:3px 2px;text-align:center;">${bp.hq ? "✓" : ""}</td>
      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:9pt;">${bp.branch}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:right;font-variant-numeric:tabular-nums;">${fmtAmt(r.subtotal)}</td>
      <td style="border:1px solid #333;padding:3px 4px;text-align:right;font-variant-numeric:tabular-nums;">${fmtAmt(r.vatAmt)}</td>
    </tr>`;
  }).join("\n");

  const emptyRows = Array.from({ length: Math.max(0, MIN_ROWS - rows.length) }, () =>
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

// ── Component ─────────────────────────────────────────────
function VatSalesReport({ cache, updateCache }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [year, setYear]   = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [tiList, setTiList]         = useState([]);
  const [customerMap, setCustomerMap] = useState({}); // name → {taxId, branch}
  const [company, setCompany]       = useState({});   // {name, taxId}

  // Modal state
  const [modal, setModal] = useState(null); // { type: "taxId"|"branch", customerName, currentValue }

  const load = useCallback(async (m, y) => {
    setLoading(true); setError("");
    try {
      const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const endDay = new Date(y, m, 0).getDate();
      const endDate = `${y}-${String(m).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

      const [tiData, custData, cfg] = await Promise.all([
        tiApi.getTaxInvoices(startDate, endDate),
        tiApi.getCustomers(""),
        tiApi.getConfig(),
      ]);

      // Build customer map: name → {taxId, branch}
      const cMap = {};
      for (const c of (custData || [])) {
        cMap[(c.name || "").trim()] = { taxId: c.taxId || "", branch: c.branch || "" };
      }
      setCustomerMap(cMap);
      setCompany(cfg?.company || {});

      // Sort: date asc → TI number asc (getTaxInvoices returns desc, reverse + stable sort)
      const sorted = (tiData || []).slice().sort((a, b) => {
        const da = a.date || "", db = b.date || "";
        if (da < db) return -1;
        if (da > db) return 1;
        return (a.id || "").localeCompare(b.id || "");
      });
      setTiList(sorted);
    } catch (e) { setError(e.message || "โหลดข้อมูลไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(month, year); }, []);

  const rows = tiList; // already sorted, already excludes cancelled (backend filters)
  const sumSubtotal = rows.reduce((s, r) => s + (r.subtotal || 0), 0);
  const sumVat = rows.reduce((s, r) => s + (r.vatAmt || 0), 0);

  const handleMonthChange = (s) => {
    if (!s) return;
    const [y, m] = s.split("-").map(Number);
    setMonth(m); setYear(y);
    load(m, y);
  };

  const handlePrint = () => {
    if (rows.length === 0) return;
    printA4(rows, month - 1, year, company, customerMap);
  };

  const handleFillSave = (payload) => {
    // Update local customer map
    const name = modal.customerName;
    setCustomerMap(prev => ({
      ...prev,
      [name]: { ...prev[name], ...payload },
    }));
    setModal(null);
  };

  if (loading) return <div style={{ padding: 20, textAlign: "center" }}><Spinner /></div>;
  if (error) return <div style={{ padding: 20 }}><div style={{ color: C.danger, marginBottom: 8 }}>{error}</div><Btn onClick={() => load(month, year)}><RefreshCw size={13}/> ลองใหม่</Btn></div>;

  return (
    <div>
      {modal && (
        <FillModal
          type={modal.type}
          customerName={modal.customerName}
          currentValue={modal.currentValue}
          onSave={handleFillSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Action bar ── */}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <DateRangePicker
          monthOnly
          startDate={`${year}-${String(month).padStart(2, "0")}-01`}
          endDate=""
          onApply={handleMonthChange}
        />
        <Btn small primary onClick={() => load(month, year)} disabled={loading}>
          {loading ? <Loader size={13}/> : <RefreshCw size={13}/>} รีเฟรช
        </Btn>
        <span style={{ flex: 1 }}/>
        <span style={{ fontSize: 12, color: C.muted }}>{rows.length} รายการ</span>
        <Btn small primary onClick={handlePrint} disabled={rows.length === 0}>
          <Printer size={13}/> พิมพ์ A4
        </Btn>
      </div>

      {/* ── Info hint ── */}
      {rows.some(r => { const c = customerMap[r.name]; return !c?.taxId || !c?.branch; }) && (
        <div style={{ padding: "8px 14px", background: "#eef3ff", borderRadius: 6, fontSize: 12, color: C.accent, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span>ℹ</span>
          <span>ลูกค้าที่ยังไม่มีเลข 13 หลัก / สาขา — คลิกในตารางเพื่อบันทึก (จำครั้งเดียว ใช้ได้ทุกเดือน)</span>
        </div>
      )}

      {/* ── Table ── */}
      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>ไม่มี TI ในเดือนนี้</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                <th style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 36 }}>#</th>
                <th style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 76 }}>วัน เดือน ปี</th>
                <th style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 110 }}>เลขที่</th>
                <th style={{ padding: "8px 6px", textAlign: "left", border: `0.5px solid ${C.border}`, fontWeight: 500 }}>ชื่อผู้ซื้อสินค้า</th>
                <th style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 120 }}>เลขประจำตัว 13 หลัก</th>
                <th style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 90 }}>สถานประกอบการ</th>
                <th style={{ padding: "8px 6px", textAlign: "right", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 100 }}>มูลค่าสินค้า</th>
                <th style={{ padding: "8px 6px", textAlign: "right", border: `0.5px solid ${C.border}`, fontWeight: 500, width: 90 }}>จำนวนภาษี</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const cust = customerMap[r.name] || {};
                return (
                  <tr key={r.id + "-" + i} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "7px 6px", textAlign: "center", border: `0.5px solid ${C.border}` }}>{i + 1}</td>
                    <td style={{ padding: "7px 6px", textAlign: "center", border: `0.5px solid ${C.border}` }}>{fmtDateShort(r.date)}</td>
                    <td style={{ padding: "7px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, color: C.accent, fontWeight: 500, whiteSpace: "nowrap" }}>{r.id}</td>
                    <td style={{ padding: "7px 6px", border: `0.5px solid ${C.border}` }}>{r.name}</td>
                    <td style={{ padding: "7px 6px", textAlign: "center", border: `0.5px solid ${C.border}`, fontVariantNumeric: "tabular-nums" }}>
                      {cust.taxId ? cust.taxId : (
                        <span onClick={() => setModal({ type: "taxId", customerName: r.name, currentValue: cust.taxId })}
                          style={{ fontSize: 11, color: C.accent, cursor: "pointer", borderBottom: `1px dashed ${C.accent}` }}>
                          กรอกเลข 13 หลัก
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "7px 6px", textAlign: "center", border: `0.5px solid ${C.border}` }}>
                      {cust.branch ? branchLabel(cust.branch) : (
                        <span onClick={() => setModal({ type: "branch", customerName: r.name, currentValue: cust.branch })}
                          style={{ fontSize: 11, color: C.accent, cursor: "pointer", borderBottom: `1px dashed ${C.accent}` }}>
                          เลือกสาขา
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "7px 6px", textAlign: "right", border: `0.5px solid ${C.border}`, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(r.subtotal)}</td>
                    <td style={{ padding: "7px 6px", textAlign: "right", border: `0.5px solid ${C.border}`, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(r.vatAmt)}</td>
                  </tr>
                );
              })}
              {/* Footer */}
              <tr style={{ background: "#fef3c7", fontWeight: 500 }}>
                <td colSpan={6} style={{ padding: "8px 6px", textAlign: "center", border: `0.5px solid ${C.border}` }}>รวม</td>
                <td style={{ padding: "8px 6px", textAlign: "right", border: `0.5px solid ${C.border}`, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(sumSubtotal)}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", border: `0.5px solid ${C.border}`, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(sumVat)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { VatSalesReport };
