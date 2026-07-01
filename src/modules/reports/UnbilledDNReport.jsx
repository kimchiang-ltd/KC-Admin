// ============================================================
// Unbilled DN Report (#221c Phase 10A)
// ============================================================
// Lists DNs where col Q (BN number) is empty AND DN not cancelled.
// Helps owner see cash flow exposure: which DNs haven't been billed yet.
// Default date range: last 90 days (catches dragging-on cases).

import React, { useState, useEffect, useCallback } from "react";
import { Loader, Search } from "lucide-react";
import { api } from "../../shared/api.jsx";
import { C } from "../../shared/constants.jsx";
import { Spinner, ErrorBox, inputStyle } from "../../shared/ui.jsx";
import { DateRangePicker } from "../invoice/InvoicePage.jsx";

// Parse DN date "dd/MM/yyyy" → Date object (avoids "Invalid Date" trap from new Date(dd/MM/yyyy))
function parseDateStr(s) {
  if (!s) return null;
  const p = String(s).split("/");
  if (p.length !== 3) return null;
  const [d, m, y] = p.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function daysSince(dateStr) {
  const d = parseDateStr(dateStr);
  if (!d) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function UnbilledDNReport({ cache, updateCache }) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

  const [startDate, setStartDate] = useState(fmt(ninetyDaysAgo));
  const [endDate, setEndDate]     = useState(fmt(now));
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const cacheKey = "report-unbilled-dn_" + startDate + "_" + endDate;
  const dns      = cache[cacheKey] || [];

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await api.getDeliveryNotes(startDate, endDate, "");
      updateCache(cacheKey, Array.isArray(d) ? d : []);
    } catch (e) { setError("โหลดไม่สำเร็จ: " + e.message); }
    finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  // Filter: bnNo empty + customer search
  const rows = dns
    .filter(dn => !(dn.bnNo || "").trim()) // unbilled = no BN number in col Q
    .filter(dn => {
      if (!search.trim()) return true;
      const s = search.trim().toLowerCase();
      return (dn.name || "").toLowerCase().includes(s) || (dn.id || "").toLowerCase().includes(s);
    })
    .map(dn => ({ ...dn, age: daysSince(dn.date) }))
    .sort((a, b) => b.age - a.age); // oldest first

  const grandTotal = rows.reduce((s, dn) => s + (parseFloat(dn.total) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <DateRangePicker startDate={startDate} endDate={endDate} onApply={(s, e) => { setStartDate(s); setEndDate(e); }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "white", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "0 8px", height: 32 }}>
          <Search size={12} color={C.muted} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา DN/ลูกค้า..." style={{ border: "none", outline: "none", fontSize: 12, width: 200, background: "transparent" }} />
        </div>
        {loading && <span style={{ fontSize: 12, color: C.muted, display: "inline-flex", alignItems: "center", gap: 4 }}><Loader size={12}/> กำลังโหลด...</span>}
      </div>

      {error && <div style={{ marginBottom: 14 }}><ErrorBox msg={error} onRetry={load} /></div>}

      {loading && dns.length === 0 ? <Spinner /> : (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "clip" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: "9px 14px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, width: 110, background: "#fafafa", position: "sticky", top: 0, zIndex: 1 }}>เลขที่ DN</th>
                <th style={{ padding: "9px 14px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, width: 100, background: "#fafafa", position: "sticky", top: 0, zIndex: 1 }}>วันที่</th>
                <th style={{ padding: "9px 14px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", position: "sticky", top: 0, zIndex: 1 }}>ลูกค้า</th>
                <th style={{ padding: "9px 14px", textAlign: "right", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, width: 130, background: "#fafafa", position: "sticky", top: 0, zIndex: 1 }}>ยอด ฿</th>
                <th style={{ padding: "9px 14px", textAlign: "right", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, width: 80, background: "#fafafa", position: "sticky", top: 0, zIndex: 1 }}>อายุ (วัน)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่มี DN ที่ยังไม่วางบิลในช่วงเวลานี้ — ทุกใบวางบิลแล้ว</td></tr>
              ) : rows.map((dn, i) => {
                const ageColor = dn.age >= 60 ? C.danger : dn.age >= 30 ? C.warning : C.muted;
                return (
                  <tr key={dn.id || i} style={{ background: i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}` }}>
                    <td style={{ padding: "9px 14px", color: C.accent, fontWeight: 500 }}>{dn.id}</td>
                    <td style={{ padding: "9px 14px", color: C.muted }}>{dn.date}</td>
                    <td style={{ padding: "9px 14px" }}>{dn.name}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(parseFloat(dn.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: ageColor, fontWeight: dn.age >= 60 ? 600 : 400 }}>{dn.age}</td>
                  </tr>
                );
              })}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                  <td colSpan={3} style={{ padding: "10px 14px", fontWeight: 600, fontSize: 12 }}>รวม {rows.length} ใบ</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: C.accent }}>฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: C.muted, fontSize: 10 }}>≥60 = แดง · ≥30 = เหลือง</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

export { UnbilledDNReport };
