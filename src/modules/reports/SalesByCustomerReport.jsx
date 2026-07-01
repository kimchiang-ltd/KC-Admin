// ============================================================
// Sales by Customer Report (#221b Phase 10A → #226a UI redesign)
// ============================================================
// Multi-month pivot: each customer × month grid. Click row → full customer detail page.
// Period: 4 mode buttons (1/3/6/12) + range nav (arrows for 3/6/12) or month-grid picker (1mo).
// anchorMonth = END month of the range; can be shifted to view any past period.
// #226a: UI redesign — pill filters, rank badges, proportion bars, CSS grid layout.
// #226b: KPI cards row with previous-period delta comparison.
// #226c: Multi-month sparkline column — inline SVG area chart per customer row.
// #226d: Full customer detail page — click row → detail view with stats + DN list.

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search, TrendingUp, Users, PieChart, BarChart3, RefreshCw } from "lucide-react";
import { api } from "../../shared/api.jsx";
import { C } from "../../shared/constants.jsx";
import { Btn, Spinner, ErrorBox } from "../../shared/ui.jsx";
import { DateRangePicker } from "../invoice/InvoicePage.jsx";

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const fmt = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// Compute startDate/endDate from anchor month + mode (N months ending at anchor)
function rangeFromAnchor(anchor, n) {
  const end = new Date(anchor.y, anchor.m, 0); // last day of anchor month (anchor.m is 1-indexed)
  const start = new Date(anchor.y, anchor.m - n, 1); // first day of (anchor - n + 1)
  return { start: fmt(start), end: fmt(end) };
}

// Shift anchor by delta months (positive = forward, negative = back)
function shiftAnchor(anchor, delta) {
  const d = new Date(anchor.y, anchor.m - 1 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

// Parse DN date → YYYY-MM key. Backend returns "yyyy-MM-dd" (Code.gs:36) but
// be defensive: support "dd/MM/yyyy" fallback in case format ever changes.
function dnMonthKey(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 7); // "yyyy-MM-dd" → "yyyy-MM"
  const p = s.split("/");
  if (p.length === 3) return p[2] + "-" + p[1].padStart(2, "0"); // "dd/MM/yyyy" fallback
  return null;
}

// Build ordered list of YYYY-MM strings between start (inclusive) and end (inclusive)
function monthRange(startDate, endDate) {
  const [sy, sm] = startDate.split("-").map(Number);
  const [ey, em] = endDate.split("-").map(Number);
  const out = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(y + "-" + String(m).padStart(2, "0"));
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return THAI_MONTHS_SHORT[m - 1] + " " + y;
};

// ── Style constants (ported from mockup) ────────────────────
const S = {
  card: { background: "#fff", border: "1px solid #e9eef5", borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.05)", overflow: "hidden" },
  headerRow: { padding: "11px 22px", background: "#f8fafc", borderBottom: "1px solid #eef2f7", fontSize: 11.5, color: "#64748b", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" },
  dataRow: { padding: "13px 22px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.12s" },
  footerRow: { padding: "15px 22px", background: "#f8fafc", borderTop: "2px solid #e2e8f0" },
};

// Grid columns for single-month mode
const GRID_1M = "64px 1.4fr 2fr 150px 110px";
// Grid columns for multi-month mode (dynamic, built in render)

// #226c — Inline SVG sparkline (ported from mockup)
const Sparkline = ({ series, width = 60, height = 30, color }) => {
  if (!series || series.length < 2) return null;
  const pad = 4;
  const min = Math.min(...series), max = Math.max(...series);
  const rng = (max - min) || 1;
  const pts = series.map((v, i) => {
    const x = pad + (i / (series.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((v - min) / rng) * (height - 2 * pad);
    return [x, y];
  });
  const last = pts[pts.length - 1];
  const area = `${pad},${height - pad} ` + pts.map(p => p.join(",")).join(" ") + ` ${width - pad},${height - pad}`;
  const gradId = "sg" + Math.round(series[0] * 7 + series.length * 13);
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} stroke="none" />
      <polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.8" fill={color} />
    </svg>
  );
};

function SalesByCustomerReport({ cache, updateCache, expanded, setExpanded }) {
  const now = new Date();
  const [mode, setMode]             = useState(3); // 1 | 3 | 6 | 12 (number of months)
  const [anchor, setAnchor]         = useState({ y: now.getFullYear(), m: now.getMonth() + 1 }); // END month
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  // expanded + setExpanded lifted to ReportsPage (#226d) for breadcrumb sync
  const [query, setQuery]           = useState("");   // #226a search filter

  const { start: startDate, end: endDate } = rangeFromAnchor(anchor, mode);

  // #226b — previous period for KPI delta comparison
  const prevAnchor = shiftAnchor(anchor, -mode);
  const { start: prevStartDate, end: prevEndDate } = rangeFromAnchor(prevAnchor, mode);

  const cacheKey     = "report-sales-by-customer_" + startDate + "_" + endDate;
  const prevCacheKey = "report-sales-by-customer_" + prevStartDate + "_" + prevEndDate;

  // Always fetch 12-month range from current anchor — covers all narrower modes + their previous periods
  const { start: fetch12Start, end: fetch12End } = rangeFromAnchor(anchor, 12);
  const fetch12Key = "report-sales-by-customer_" + fetch12Start + "_" + fetch12End;

  // Find a broader cached range that covers the requested dates
  const PREFIX = "report-sales-by-customer_";
  const findCovering = useCallback((start, end) => {
    for (const key of Object.keys(cache)) {
      if (!key.startsWith(PREFIX)) continue;
      const parts = key.slice(PREFIX.length).split("_");
      if (parts.length !== 2) continue;
      const [cs, ce] = parts;
      if (cs <= start && ce >= end) {
        return cache[key].filter(dn => dn.date >= start && dn.date <= end);
      }
    }
    return null;
  }, [cache]);

  // Derive from broader cache or use exact cache
  const dns     = cache[cacheKey] || findCovering(startDate, endDate) || [];
  const prevDns = cache[prevCacheKey] || findCovering(prevStartDate, prevEndDate) || [];

  const load = useCallback(async (force) => {
    const has12 = !force && (cache[fetch12Key] || findCovering(fetch12Start, fetch12End));
    const hasPrev = !force && (cache[prevCacheKey] || findCovering(prevStartDate, prevEndDate));
    if (has12 && hasPrev) return;
    setLoading(true); setError("");
    try {
      const [d, pd] = await Promise.all([
        !has12 ? api.getDeliveryNotes(fetch12Start, fetch12End, "") : null,
        !hasPrev ? api.getDeliveryNotes(prevStartDate, prevEndDate, "") : null,
      ]);
      if (d != null) updateCache(fetch12Key, Array.isArray(d) ? d : []);
      if (pd != null) updateCache(prevCacheKey, Array.isArray(pd) ? pd : []);
    } catch (e) { setError("โหลดไม่สำเร็จ: " + e.message); }
    finally { setLoading(false); }
  }, [anchor, prevStartDate, prevEndDate, cache, findCovering]);

  useEffect(() => { load(false); }, [load]);

  // Aggregate: customer name → { perMonth: {YYYY-MM: total}, grandTotal, dns: [...] }
  const months = monthRange(startDate, endDate);
  const byCustomer = (() => {
    const map = new Map();
    for (const dn of dns) {
      const key = (dn.name || "—").trim();
      const mKey = dnMonthKey(dn.date);
      const total = parseFloat(dn.total) || 0;
      if (!map.has(key)) map.set(key, { name: key, perMonth: {}, grandTotal: 0, dns: [] });
      const row = map.get(key);
      if (mKey) row.perMonth[mKey] = (row.perMonth[mKey] || 0) + total;
      row.grandTotal += total;
      row.dns.push(dn);
    }
    return Array.from(map.values()).sort((a, b) => b.grandTotal - a.grandTotal);
  })();

  // Apply search filter
  const q = query.trim().toLowerCase();
  const filtered = q ? byCustomer.filter(c => c.name.toLowerCase().includes(q)) : byCustomer;

  // Footer monthly subtotals
  const monthlyTotals = months.map(mKey => byCustomer.reduce((s, c) => s + (c.perMonth[mKey] || 0), 0));
  const grandTotal = byCustomer.reduce((s, c) => s + c.grandTotal, 0);
  const maxTotal = Math.max(...byCustomer.map(c => c.grandTotal), 1);

  const fmtBaht = (v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtBaht0 = (v) => Math.round(v).toLocaleString("en-US");
  const kfmt = (n) => { if (n >= 1e6) return (n / 1e6).toFixed(2) + "M"; if (n >= 1e3) return Math.round(n / 1e3).toLocaleString("en-US") + "k"; return String(Math.round(n)); };

  // #226b — Previous period aggregation for KPI deltas
  const prevGrandTotal = prevDns.reduce((s, dn) => s + (parseFloat(dn.total) || 0), 0);
  const prevCustomerCount = new Set(prevDns.map(dn => (dn.name || "—").trim())).size;

  // #226d — Previous period per-customer totals (for customer insight MoM)
  const prevByCustomer = (() => {
    const map = new Map();
    for (const dn of prevDns) {
      const key = (dn.name || "—").trim();
      const total = parseFloat(dn.total) || 0;
      map.set(key, (map.get(key) || 0) + total);
    }
    return map;
  })();

  const pctDelta = (curr, prev) => {
    if (!prev) return null;
    return ((curr - prev) / prev * 100);
  };
  const salesDelta       = pctDelta(grandTotal, prevGrandTotal);
  const customerDelta    = byCustomer.length - prevCustomerCount; // absolute diff
  const topCustomer      = byCustomer[0];
  const topShare         = grandTotal ? (topCustomer?.grandTotal / grandTotal * 100) : 0;
  const avgPerCustomer   = byCustomer.length ? grandTotal / byCustomer.length : 0;
  const prevAvg          = prevCustomerCount ? prevGrandTotal / prevCustomerCount : 0;
  const avgDelta         = pctDelta(avgPerCustomer, prevAvg);

  // Range label
  const rangeLabel = (() => {
    const endM = anchor.m, endY = anchor.y;
    const startD = new Date(endY, endM - mode, 1);
    const sM = startD.getMonth() + 1, sY = startD.getFullYear();
    const endStr   = THAI_MONTHS_SHORT[endM - 1] + " " + endY;
    if (mode === 1) return endStr;
    const startStr = THAI_MONTHS_SHORT[sM - 1] + (sY !== endY ? " " + sY : "");
    return startStr + " – " + endStr;
  })();

  // Single-month vs multi-month
  const isSingle = mode === 1;

  // Multi-month grid columns (#226c: added 70px sparkline column)
  const useCompact = mode >= 12;
  const monthCol = useCompact ? "minmax(58px,1fr)" : "minmax(82px,1fr)";
  const gridColsMulti = `64px minmax(140px,1.3fr) repeat(${months.length}, ${monthCol}) 70px 150px`;

  // ── Render helpers ──────────────────────────────────────────

  const RankBadge = ({ rank }) => {
    const top = rank <= 3;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 26, height: 26, padding: "0 6px", borderRadius: 7,
        fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        background: top ? "#1d4ed8" : "#eef2f7",
        color: top ? "#ffffff" : "#64748b",
      }}>{rank}</span>
    );
  };

  // ── Period button (pill style from mockup) ──────────────────
  const PeriodBtn = ({ value, label }) => {
    const active = mode === value;
    return (
      <button onClick={() => setMode(value)} style={{
        padding: "6px 14px", borderRadius: 8, border: "none",
        background: active ? "#ffffff" : "transparent",
        color: active ? "#0f172a" : "#64748b",
        fontSize: 12.5, fontWeight: active ? 600 : 500,
        cursor: "pointer", fontFamily: "inherit",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
        transition: "all 0.15s",
      }}>{label}</button>
    );
  };

  // ── Main render ─────────────────────────────────────────────
  return (
    <div>
      {/* ── FILTER BAR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>ช่วงเวลา</span>
        <div style={{ display: "inline-flex", background: "#e7ecf3", padding: 4, borderRadius: 11, gap: 2 }}>
          <PeriodBtn value={1}  label="1 เดือน" />
          <PeriodBtn value={3}  label="3 เดือน" />
          <PeriodBtn value={6}  label="6 เดือน" />
          <PeriodBtn value={12} label="12 เดือน" />
        </div>

        {mode === 1 ? (
          <DateRangePicker
            monthOnly
            startDate={`${anchor.y}-${String(anchor.m).padStart(2,"0")}-01`}
            endDate=""
            onApply={(s) => {
              if (!s) return;
              const [y, m] = s.split("-").map(Number);
              setAnchor({ y, m });
            }}
          />
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setAnchor(a => shiftAnchor(a, -1))} title="ย้อนหลัง 1 เดือน" style={{
              padding: 0, width: 30, height: 30, borderRadius: 7, border: "1px solid #dbe3ee",
              background: "#fff", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><ChevronLeft size={14}/></button>
            <span style={{ fontSize: 13, color: "#334155", fontWeight: 500, minWidth: 160, textAlign: "center", padding: "0 6px", fontVariantNumeric: "tabular-nums" }}>{rangeLabel}</span>
            <button onClick={() => setAnchor(a => shiftAnchor(a, 1))} title="ถัดไป 1 เดือน" style={{
              padding: 0, width: 30, height: 30, borderRadius: 7, border: "1px solid #dbe3ee",
              background: "#fff", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><ChevronRight size={14}/></button>
          </div>
        )}

        <Btn small primary onClick={() => load(true)} disabled={loading}><RefreshCw size={14}/> รีเฟรช</Btn>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={14} style={{ position: "absolute", left: 13, color: "#94a3b8" }} />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหาลูกค้า…"
            style={{
              width: 230, padding: "10px 14px 10px 34px", border: "1px solid #dbe3ee",
              borderRadius: 10, fontSize: 13.5, background: "#fff", outline: "none",
              fontFamily: "inherit", color: "#0f172a",
            }}
          />
        </div>
      </div>

      {error && <div style={{ marginBottom: 14 }}><ErrorBox msg={error} onRetry={load} /></div>}

      {/* ── CUSTOMER DETAIL PAGE (#226d) ── */}
      {expanded && (() => {
        const cust = byCustomer.find(c => c.name === expanded);
        if (!cust) return null;
        const rank = byCustomer.indexOf(cust) + 1;
        const prevTotal = prevByCustomer.get(cust.name) || 0;
        const mom = pctDelta(cust.grandTotal, prevTotal);
        const momLabel = mode === 1 ? "เทียบเดือนก่อน" : `เทียบ ${mode} เดือนก่อน`;
        const monthValues = months.map(mKey => cust.perMonth[mKey] || 0);
        const maxMonth = Math.max(...monthValues, 1);
        const bestIdx = monthValues.indexOf(Math.max(...monthValues));
        const dnCount = cust.dns.length;
        const avgPerDN = dnCount ? cust.grandTotal / dnCount : 0;
        const billedCount = cust.dns.filter(dn => (dn.bnNo || "").trim()).length;
        const billedPct = dnCount ? (billedCount / dnCount * 100) : 0;
        const bestMonthKey = months[bestIdx];
        const bestMonthLabel = bestMonthKey ? monthLabel(bestMonthKey) : "—";
        const sortedDns = cust.dns.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

        return (
          <div>
            {/* ── Header: back + name + total ── */}
            <div style={{ background: "#fff", border: "1px solid #d7e3f7", borderRadius: 16, boxShadow: "0 4px 18px rgba(37,99,235,0.08)", padding: "20px 24px 22px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 30, height: 30, padding: "0 9px", borderRadius: 8,
                    fontSize: 13, fontWeight: 700, background: "#1d4ed8", color: "#fff",
                    fontVariantNumeric: "tabular-nums",
                  }}>{rank}</span>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 700, color: "#0f172a" }}>{cust.name}</div>
                    <div style={{ fontSize: 12.5, color: "#94a3b8" }}>ข้อมูลเชิงลึกลูกค้า · {rangeLabel}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 27, fontWeight: 700, color: "#0f172a", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>฿{fmtBaht(cust.grandTotal)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end", marginTop: 7 }}>
                    {mom != null && (
                      <span style={{
                        fontSize: 12.5, fontWeight: 700,
                        color: mom >= 0 ? "#15803d" : "#b91c1c",
                        background: mom >= 0 ? "#ecfdf3" : "#fef2f2",
                        padding: "2px 9px", borderRadius: 6, fontVariantNumeric: "tabular-nums",
                      }}>{(mom >= 0 ? "▲ " : "▼ ") + Math.abs(mom).toFixed(1) + "%"}</span>
                    )}
                    <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{momLabel}</span>
                  </div>
                </div>
              </div>

              {/* ── Bar chart + stats ── */}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(230px, 0.9fr) 2fr", gap: 26, alignItems: "stretch" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 13, padding: "16px 18px" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 14 }}>แนวโน้มรายเดือน · MoM</div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: months.length > 6 ? 8 : 18, height: 140 }}>
                    {monthValues.map((v, idx) => {
                      const peak = idx === bestIdx;
                      const barH = Math.max(5, Math.round(v / maxMonth * 100)) + "%";
                      const prevIdx = idx - 1;
                      const prevV = prevIdx >= 0 ? monthValues[prevIdx] : 0;
                      const barMom = prevV ? ((v - prevV) / prevV * 100) : 0;
                      const mKey = months[idx];
                      const [, mm] = mKey.split("-").map(Number);
                      return (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end", minWidth: 0 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: peak ? "#1d4ed8" : "#64748b", fontVariantNumeric: "tabular-nums" }}>{kfmt(v)}</span>
                          <div style={{ width: months.length > 6 ? 28 : 38, minHeight: 5, borderRadius: "6px 6px 0 0", background: peak ? "linear-gradient(180deg,#3b82f6,#1d4ed8)" : "#c3d6f7", height: barH }} />
                          <span style={{ fontSize: 11, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{THAI_MONTHS_SHORT[mm - 1]}</span>
                          {idx > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: barMom >= 0 ? "#15803d" : "#b91c1c", fontVariantNumeric: "tabular-nums" }}>{(barMom >= 0 ? "+" : "") + barMom.toFixed(0) + "%"}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "จำนวน DN", value: String(dnCount) + " ใบ", sub: rangeLabel, color: "#0f172a" },
                    { label: "ยอดเฉลี่ยต่อใบ", value: "฿" + fmtBaht0(avgPerDN), sub: "ต่อ DN", color: "#0f172a" },
                    { label: "วางบิลแล้ว", value: billedPct.toFixed(0) + "%", sub: `${billedCount} จาก ${dnCount} ใบ`, color: billedPct >= 80 ? "#15803d" : billedPct >= 50 ? "#ea580c" : "#b91c1c" },
                    { label: "เดือนสูงสุด", value: bestMonthLabel, sub: "฿" + fmtBaht0(monthValues[bestIdx] || 0), color: "#1d4ed8" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 13, padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 23, fontWeight: 700, color: s.color, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                      <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── DN List ── */}
            <div style={S.card}>
              <div style={{ padding: "18px 22px 16px", borderBottom: "1px solid #eef2f7" }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: "#0f172a" }}>รายการ DN</div>
                <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 2 }}>{dnCount} ใบ · {rangeLabel}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 120px 1fr 150px 140px", alignItems: "center", ...S.headerRow }}>
                <div>เลขที่ DN</div><div>วันที่</div><div>รายละเอียด</div><div style={{ textAlign: "right" }}>ยอด ฿</div><div style={{ textAlign: "right" }}>สถานะ BN</div>
              </div>
              {sortedDns.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>ไม่มี DN ในช่วงเวลานี้</div>
              ) : sortedDns.map((dn, i) => {
                const billed = (dn.bnNo || "").trim();
                return (
                  <div key={dn.id || i} style={{ display: "grid", gridTemplateColumns: "140px 120px 1fr 150px 140px", alignItems: "center", ...S.dataRow, cursor: "default" }}>
                    <span style={{ color: "#2563eb", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{dn.id}</span>
                    <span style={{ color: "#475569", fontVariantNumeric: "tabular-nums" }}>{dn.date}</span>
                    <span style={{ color: "#64748b", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dn.items?.[0]?.desc || "—"}</span>
                    <span style={{ textAlign: "right", color: "#0f172a", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>฿{fmtBaht(parseFloat(dn.total) || 0)}</span>
                    <span style={{ textAlign: "right" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 6,
                        fontSize: 12, fontWeight: 600,
                        background: billed ? "#ecfdf3" : "#fef2f2",
                        color: billed ? "#15803d" : "#c2410b",
                      }}>{billed ? `วางบิลแล้ว` : "ยังไม่วางบิล"}</span>
                    </span>
                  </div>
                );
              })}
              {sortedDns.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "140px 120px 1fr 150px 140px", alignItems: "center", ...S.footerRow }}>
                  <div /><div /><div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>รวม {dnCount} ใบ</div>
                  <div style={{ textAlign: "right", fontSize: 16, fontWeight: 700, color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>฿{fmtBaht(cust.grandTotal)}</div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>{billedCount}/{dnCount} วางบิลแล้ว</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── OVERVIEW: KPI + Table ── */}
      {!expanded && (
        <>
          {/* KPI Cards (#226b) */}
          {dns.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 18 }}>
              {[
                {
                  label: "ยอดขายรวม", icon: <TrendingUp size={17} />,
                  iconBg: "#eff4ff", iconColor: "#2563eb",
                  value: "฿" + fmtBaht0(grandTotal),
                  delta: salesDelta, deltaLabel: salesDelta != null ? ((salesDelta >= 0 ? "▲ " : "▼ ") + Math.abs(salesDelta).toFixed(1) + "%") : "—",
                  sub: "เทียบช่วงก่อน",
                },
                {
                  label: "จำนวนลูกค้า", icon: <Users size={17} />,
                  iconBg: "#f3f0ff", iconColor: "#7c3aed",
                  value: String(byCustomer.length),
                  delta: customerDelta, deltaLabel: (customerDelta >= 0 ? "▲ " : "▼ ") + Math.abs(customerDelta),
                  sub: "ราย active",
                },
                {
                  label: "ลูกค้าสูงสุด", icon: <PieChart size={17} />,
                  iconBg: "#fff7ed", iconColor: "#ea580c",
                  value: topCustomer?.name || "—",
                  delta: 1, deltaLabel: topShare.toFixed(1) + "%",
                  sub: "ของยอดขายรวม", alwaysBlue: true,
                },
                {
                  label: "ค่าเฉลี่ยต่อราย", icon: <BarChart3 size={17} />,
                  iconBg: "#ecfeff", iconColor: "#0891b2",
                  value: "฿" + fmtBaht0(avgPerCustomer),
                  delta: avgDelta, deltaLabel: avgDelta != null ? ((avgDelta >= 0 ? "▲ " : "▼ ") + Math.abs(avgDelta).toFixed(1) + "%") : "—",
                  sub: "เทียบช่วงก่อน",
                },
              ].map((k, i) => {
                const up = k.delta != null && k.delta >= 0;
                const deltaColor = k.alwaysBlue ? "#1d4ed8" : (up ? "#15803d" : "#b91c1c");
                const deltaBg    = k.alwaysBlue ? "#eff4ff" : (up ? "#ecfdf3" : "#fef2f2");
                return (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e9eef5", borderRadius: 15, padding: "18px 20px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>{k.label}</span>
                      <span style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, background: k.iconBg, color: k.iconColor }}>{k.icon}</span>
                    </div>
                    <div style={{ fontSize: 25, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.value}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 11 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: deltaColor, background: deltaBg, padding: "2px 7px", borderRadius: 6, fontVariantNumeric: "tabular-nums" }}>{k.deltaLabel}</span>
                      <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{k.sub}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

      {loading && dns.length === 0 ? <Spinner /> : (
        <div style={S.card}>
          {/* ── Table header bar ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 16px", borderBottom: "1px solid #eef2f7" }}>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: "#0f172a" }}>รายชื่อลูกค้า</div>
              <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 2 }}>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{filtered.length}</span> ราย · {rangeLabel} · เรียงตามยอดขายสูงสุด
              </div>
            </div>
            {isSingle && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#2563eb", display: "inline-block" }} /> สัดส่วนยอดขาย
              </div>
            )}
          </div>

          {/* ── SINGLE MONTH MODE ── */}
          {isSingle && (
            <>
              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: GRID_1M, alignItems: "center", ...S.headerRow }}>
                <div>อันดับ</div>
                <div>ลูกค้า</div>
                <div>สัดส่วน</div>
                <div style={{ textAlign: "right" }}>ยอดขาย ฿</div>
                <div style={{ textAlign: "right" }}>% รวม</div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>ไม่มีข้อมูลในช่วงเวลานี้</div>
              ) : filtered.map((row) => {
                const rank = byCustomer.indexOf(row) + 1;
                const top3 = rank <= 3;
                const share = grandTotal ? (row.grandTotal / grandTotal * 100) : 0;
                const barWidth = (row.grandTotal / maxTotal * 100).toFixed(1) + "%";
                return (
                  <div
                    key={row.name}
                    onClick={() => setExpanded(row.name)}
                    style={{ display: "grid", gridTemplateColumns: GRID_1M, alignItems: "center", ...S.dataRow }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                  >
                    <div><RankBadge rank={rank} /></div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 14 }}>{row.name}</div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ flex: 1, height: 9, background: "#eef2f7", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: barWidth, borderRadius: 6, background: top3 ? "linear-gradient(90deg,#1d4ed8,#3b82f6)" : "#93b4f5", transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>฿{fmtBaht(row.grandTotal)}</div>
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 500, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{share.toFixed(1)}%</div>
                  </div>
                );
              })}

              {/* Grand total footer */}
              {filtered.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: GRID_1M, alignItems: "center", ...S.footerRow }}>
                  <div />
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>ยอดขายรวมทั้งหมด</div>
                  <div />
                  <div style={{ textAlign: "right", fontSize: 16, fontWeight: 700, color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>฿{fmtBaht(grandTotal)}</div>
                  <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>100%</div>
                </div>
              )}
            </>
          )}

          {/* ── MULTI-MONTH MODE ── */}
          {!isSingle && (
            <>
              {/* Column headers */}
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: months.length * (useCompact ? 64 : 90) + 400 }}>
                  <div style={{ display: "grid", gridTemplateColumns: gridColsMulti, alignItems: "center", ...S.headerRow }}>
                    <div>อันดับ</div>
                    <div>ลูกค้า</div>
                    {months.map(mKey => (
                      <div key={mKey} style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{monthLabel(mKey)}</div>
                    ))}
                    <div style={{ textAlign: "center" }}>แนวโน้ม</div>
                    <div style={{ textAlign: "right" }}>รวม ฿</div>
                  </div>

                  {filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>ไม่มีข้อมูลในช่วงเวลานี้</div>
                  ) : filtered.map((row) => {
                    const rank = byCustomer.indexOf(row) + 1;
                    const top3 = rank <= 3;
                    const sparkSeries = months.map(mKey => row.perMonth[mKey] || 0);
                    const sparkColor = top3 ? "#1d4ed8" : "#7c97c9";
                    return (
                      <div
                        key={row.name}
                        onClick={() => setExpanded(row.name)}
                        style={{ display: "grid", gridTemplateColumns: gridColsMulti, alignItems: "center", ...S.dataRow }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                      >
                        <div><RankBadge rank={rank} /></div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 14 }}>{row.name}</div>
                        {months.map(mKey => {
                          const v = row.perMonth[mKey];
                          const monthMax = Math.max(...byCustomer.map(c => c.perMonth[mKey] || 0));
                          const isMax = v && v === monthMax;
                          return (
                            <div key={mKey} style={{ textAlign: "right", fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: v ? (isMax ? "#1d4ed8" : "#475569") : "#cbd5e1" }}>
                              {v ? fmtBaht0(v) : "—"}
                            </div>
                          );
                        })}
                        <div style={{ display: "flex", justifyContent: "center" }}><Sparkline series={sparkSeries} color={sparkColor} /></div>
                        <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>฿{fmtBaht(row.grandTotal)}</div>
                      </div>
                    );
                  })}

                  {/* Grand total footer */}
                  {filtered.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: gridColsMulti, alignItems: "center", ...S.footerRow }}>
                      <div />
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>รวมทั้งหมด</div>
                      {monthlyTotals.map((v, i) => (
                        <div key={i} style={{ textAlign: "right", fontSize: 12.5, fontWeight: 700, color: "#334155", fontVariantNumeric: "tabular-nums" }}>{v ? fmtBaht0(v) : "—"}</div>
                      ))}
                      <div />
                      <div style={{ textAlign: "right", fontSize: 16, fontWeight: 700, color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>฿{fmtBaht(grandTotal)}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer info */}
      <div style={{ textAlign: "center", fontSize: 11.5, color: "#aab4c4", marginTop: 18 }}>
        แสดง {filtered.length} จาก {byCustomer.length} ราย
      </div>
        </>
      )}
    </div>
  );
}

export { SalesByCustomerReport };
