// ============================================================
// BN Sales Export (#250) — Print (A4 PDF) + Excel export
// ============================================================
// Fetches BN (DN) + BN-TI data, merges into one list per month,
// aggregates per customer (alphabetical), renders a printable
// portrait A4 table or exports .xlsx via SheetJS.
// Payment columns (chq / bank transfer / detail) are blank for manual fill-in.
// Month picker: DateRangePicker monthOnly (same as SalesByCustomerReport).

import React, { useState, useEffect, useCallback } from "react";
import { Printer, FileSpreadsheet, RefreshCw, Loader } from "lucide-react";
import { api } from "../../shared/api.jsx";
import { C } from "../../shared/constants.jsx";
import { Btn, Spinner } from "../../shared/ui.jsx";
import { tiApi } from "../ti/tiApi.jsx";
import { DateRangePicker } from "../invoice/InvoicePage.jsx";
import { fmtAmt } from "../../shared/utils.jsx";

const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// Parse BN date "dd/MM/yyyy" → "YYYY-MM" key
function bnMonthKey(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const p = s.split("/");
  if (p.length === 3 && p[2].length === 4) return p[2] + "-" + p[1].padStart(2, "0");
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 7);
  return null;
}

// "YYYY-MM" → "มกราคม 2568" (Thai month + BE year)
function monthTitle(key) {
  const [y, m] = key.split("-").map(Number);
  return THAI_MONTHS[m - 1] + " " + (y + 543);
}
function monthShort(key) {
  const [y, m] = key.split("-").map(Number);
  return THAI_MONTHS_SHORT[m - 1] + " " + (y + 543);
}

// Aggregate: list of BNs → { "YYYY-MM": { rows: [{customer, total}], bnCount, bntiCount } } sorted A-Z
function aggregate(bnList, bntiList) {
  const byMonth = {};   // { "YYYY-MM": { customers: {name: total}, bnCount, bntiCount } }
  const addList = (list, source) => {
    for (const bn of list) {
      if (bn.cancelled) continue;
      const mk = bn.period || bnMonthKey(bn.date); // #336 — use Period col; fallback to date for old data
      if (!mk) continue;
      if (!byMonth[mk]) byMonth[mk] = { customers: {}, bnCount: 0, bntiCount: 0 };
      const name = (bn.customer || "").trim() + (source === "bnti" ? " (Vat)" : "");
      if (!name) continue;
      byMonth[mk].customers[name] = (byMonth[mk].customers[name] || 0) + (Number(bn.total) || 0);
      if (source === "bn") byMonth[mk].bnCount++; else byMonth[mk].bntiCount++;
    }
  };
  addList(bnList, "bn");
  addList(bntiList, "bnti");
  const result = {};
  for (const mk of Object.keys(byMonth).sort().reverse()) {
    const m = byMonth[mk];
    result[mk] = {
      rows: Object.entries(m.customers)
        .map(([customer, total]) => ({ customer, total }))
        .sort((a, b) => a.customer.localeCompare(b.customer, "th")),
      bnCount: m.bnCount,
      bntiCount: m.bntiCount,
    };
  }
  return result;
}

// ── Print A4 ───────────────────────────────────────────────
function printMonth(monthKey, rows) {
  const title = monthTitle(monthKey);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@page { size: A4 portrait; margin: 12mm 10mm 10mm 10mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Prompt", "Sarabun", sans-serif; font-size: 11pt; color: #222; }
h1 { font-size: 18pt; font-weight: 700; margin-bottom: 6mm; color: #8B0000; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #888; padding: 2.5mm 3mm; font-size: 10pt; }
th { background: #f5e6e8; font-weight: 600; text-align: center; }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
td.ctr { text-align: center; }
tr.total td { font-weight: 700; background: #fef3c7; }
.pay-hdr { background: #eef0ff; }
</style></head><body>
<h1>${title}</h1>
<table>
<thead>
  <tr>
    <th rowspan="2" style="width:8%">#</th>
    <th rowspan="2" style="width:28%">ลูกค้า</th>
    <th rowspan="2" style="width:3%"></th>
    <th rowspan="2" style="width:17%">ยอดขาย</th>
    <th colspan="3" class="pay-hdr">ชำระเงิน</th>
  </tr>
  <tr>
    <th class="pay-hdr" style="width:14%">เช็ค</th>
    <th class="pay-hdr" style="width:16%">โอน</th>
    <th class="pay-hdr" style="width:14%">หมายเหตุ</th>
  </tr>
</thead>
<tbody>
${rows.map((r, i) => `  <tr><td class="ctr">${i + 1}</td><td>${r.customer}</td><td></td><td class="num">${fmtAmt(r.total)}</td><td></td><td></td><td></td></tr>`).join("\n")}
  <tr class="total"><td colspan="2" style="text-align:center">รวม</td><td></td><td class="num">${fmtAmt(grandTotal)}</td><td></td><td></td><td></td></tr>
</tbody>
</table>
</body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

// ── Excel export ───────────────────────────────────────────
async function exportExcel(monthKey, rows) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const title = monthTitle(monthKey);
  const aoa = [
    [title],
    [],
    ["#", "ลูกค้า", "", "ยอดขาย", "เช็ค", "โอน", "หมายเหตุ"],
  ];
  rows.forEach((r, i) => aoa.push([i + 1, r.customer, "", r.total, "", "", ""]));
  aoa.push(["", "รวม", "", grandTotal, "", "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 5 }, { wch: 28 }, { wch: 2 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
  ];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  for (let r = 3; r < 3 + rows.length + 1; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 3 })];
    if (cell) cell.z = "#,##0.00";
  }
  const sheetName = monthShort(monthKey).replace(/\./g, "");
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `BN_Sales_${monthKey}.xlsx`);
}

// ── Component ──────────────────────────────────────────────
function BNSalesExport({ cache, updateCache }) {
  const now = new Date();
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [data, setData]           = useState({}); // { "YYYY-MM": [{customer, total}] }
  const [anchor, setAnchor]       = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [bnList, bntiList] = await Promise.all([
        api.getBillingNotes(),
        tiApi.getBillingNotes().catch(() => []),
      ]);
      setData(aggregate(bnList || [], bntiList || []));
    } catch (e) { setError(e.message || "โหลดข้อมูลไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // Current selected month key
  const monthKey = anchor.y + "-" + String(anchor.m).padStart(2, "0");
  const monthData = data[monthKey] || { rows: [], bnCount: 0, bntiCount: 0 };
  const rows = monthData.rows;
  const total = rows.reduce((s, r) => s + r.total, 0);
  const bnCount = monthData.bnCount;
  const bntiCount = monthData.bntiCount;

  const handlePrint = () => {
    if (rows.length === 0) return;
    printMonth(monthKey, rows);
  };

  const handleExcel = async () => {
    if (rows.length === 0) return;
    setExporting(true);
    try { await exportExcel(monthKey, rows); }
    catch (e) { setActionError("ส่งออกไม่สำเร็จ: " + e.message); }
    finally { setExporting(false); }
  };

  if (loading) return <div style={{ padding: 20, textAlign: "center" }}><Spinner /></div>;
  if (error) return <div style={{ padding: 20 }}><div style={{ color: C.danger, marginBottom: 8 }}>{error}</div><Btn onClick={load}><RefreshCw size={13}/> ลองใหม่</Btn></div>;

  return (
    <div>
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B" }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
      {/* ── Month picker (mirrors SalesByCustomerReport) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>เดือน</span>
        <DateRangePicker
          monthOnly
          startDate={`${anchor.y}-${String(anchor.m).padStart(2, "0")}-01`}
          endDate=""
          onApply={(s) => {
            if (!s) return;
            const [y, m] = s.split("-").map(Number);
            setAnchor({ y, m });
          }}
        />
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12 }}>
        <div style={{ padding: "8px 14px", background: "#f0f4ff", borderRadius: 6 }}>
          <span style={{ color: C.muted }}>ลูกค้า:</span> <strong>{rows.length}</strong>
        </div>
        <div style={{ padding: "8px 14px", background: "#f0f4ff", borderRadius: 6 }}>
          <span style={{ color: C.muted }}>ยอดรวม:</span> <strong>{fmtAmt(total)}</strong>
        </div>
      </div>

      {/* ── Preview table ── */}
      {rows.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden", maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: "6px 8px", textAlign: "center", borderBottom: `1px solid ${C.border}`, width: 40 }}>#</th>
                  <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>ลูกค้า</th>
                  <th style={{ padding: "6px 10px", textAlign: "right", borderBottom: `1px solid ${C.border}`, width: 120 }}>ยอดขาย</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                    <td style={{ padding: "5px 8px", textAlign: "center", color: C.muted }}>{i + 1}</td>
                    <td style={{ padding: "5px 10px" }}>{r.customer}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(r.total)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#fef3c7", fontWeight: 600 }}>
                  <td colSpan={2} style={{ padding: "6px 10px", textAlign: "center" }}>รวม</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 13, marginBottom: 16 }}>
          ไม่มีข้อมูล BN ในเดือนนี้
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn primary onClick={handlePrint} disabled={rows.length === 0}>
          <Printer size={14}/> พิมพ์ (A4)
        </Btn>
        <Btn onClick={handleExcel} disabled={rows.length === 0 || exporting}>
          {exporting ? <><Loader size={13} style={{ animation: "spin .8s linear infinite" }}/> กำลังส่งออก...</> : <><FileSpreadsheet size={14}/> ส่งออก Excel</>}
        </Btn>
      </div>
    </div>
  );
}

export { BNSalesExport };
