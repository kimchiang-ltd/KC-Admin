// ============================================================
// Reports Module — Hub (#221a Phase 10A)
// ============================================================
// Hub for analytics/reporting. Sub-views drill into specific reports.
// View state machine: hub | sales-by-customer | unbilled-dn
// Pattern matches SettingsPage (HubCard grid + BackHeader + onViewChange/goListRequest)

import React, { useState, useEffect } from "react";
import { BarChart2, ChevronLeft, Users, ClipboardList } from "lucide-react";
import { C } from "../../shared/constants.jsx";
import { SalesByCustomerReport } from "./SalesByCustomerReport.jsx";
import { UnbilledDNReport } from "./UnbilledDNReport.jsx";

const VIEW_LABELS = {
  hub: null,
  "sales-by-customer": "ยอดขายตามลูกค้า",
  "unbilled-dn": "DN ที่ยังไม่วางบิล",
};

function ReportsPage({ cache, updateCache, onViewChange, goListRequest }) {
  const [rView, setRView] = useState("hub");
  const [customerDetail, setCustomerDetail] = useState(null); // #226d — lifted from SalesByCustomerReport

  // #217 pattern — sync breadcrumb suffix with sub-view label
  // #226d — append customer name when drilling into detail
  useEffect(() => {
    const base = VIEW_LABELS[rView] ?? null;
    onViewChange?.(customerDetail ? base + " / " + customerDetail : base);
  }, [rView, customerDetail]);
  // Clicking active "รายงาน" in sidebar resets to hub
  useEffect(() => { if (goListRequest) { setCustomerDetail(null); setRView("hub"); } }, [goListRequest]);

  const HubCard = ({ icon, label, desc, color, bg, onClick }) => (
    <div onClick={onClick} style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "20px 16px", cursor: "pointer", textAlign: "center" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.muted }}>{desc}</div>
    </div>
  );

  const BackHeader = ({ title, detail, onBackToList }) => {
    const goBack = detail ? onBackToList : () => setRView("hub");
    return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <button onClick={goBack} style={{ fontSize: 13, padding: "5px 14px", border: `1px solid ${C.accent}`, borderRadius: 6, background: "#fff", color: C.accent, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <ChevronLeft size={14}/> กลับ
      </button>
      <span style={{ color: C.muted, fontSize: 12 }}>/</span>
      {detail ? (
        <>
          <span onClick={onBackToList} style={{ fontSize: 14, fontWeight: 500, color: C.accent, cursor: "pointer" }}>{title}</span>
          <span style={{ color: C.muted, fontSize: 12 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{detail}</span>
        </>
      ) : (
        <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
      )}
    </div>
  );};

  if (rView === "hub") return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <BarChart2 size={18} /> รายงาน
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <HubCard icon={<Users size={20}/>} label="ยอดขายตามลูกค้า" desc="รวมยอดขาย DN ของแต่ละลูกค้า" bg="#E6F1FB" color="#185FA5" onClick={() => setRView("sales-by-customer")} />
        <HubCard icon={<ClipboardList size={20}/>} label="DN ที่ยังไม่วางบิล" desc="DN ที่ยังไม่ได้อยู่ในใบวางบิล" bg="#FAEEDA" color="#854F0B" onClick={() => setRView("unbilled-dn")} />
      </div>
    </div>
  );

  if (rView === "sales-by-customer") return (
    <div>
      <BackHeader title="ยอดขายตามลูกค้า" detail={customerDetail} onBackToList={() => setCustomerDetail(null)} />
      <SalesByCustomerReport cache={cache} updateCache={updateCache} expanded={customerDetail} setExpanded={setCustomerDetail} />
    </div>
  );

  if (rView === "unbilled-dn") return (
    <div>
      <BackHeader title="DN ที่ยังไม่วางบิล" />
      <UnbilledDNReport cache={cache} updateCache={updateCache} />
    </div>
  );

  return null;
}

export { ReportsPage };
