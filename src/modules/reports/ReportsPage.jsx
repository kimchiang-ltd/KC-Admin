// ============================================================
// Reports Module — Hub (#221a Phase 10A)
// ============================================================
// Hub for analytics/reporting. Sub-views drill into specific reports.
// View state machine: hub | sales-by-customer | unbilled-dn
// Pattern matches SettingsPage (HubCard grid + BackHeader + onViewChange/goListRequest)

import React, { useState, useEffect } from "react";
import { BarChart2, ChevronLeft, Users, ClipboardList, FileSpreadsheet, Receipt } from "lucide-react";
import { C } from "../../shared/constants.jsx";
import { SalesByCustomerReport } from "./SalesByCustomerReport.jsx";
import { UnbilledDNReport } from "./UnbilledDNReport.jsx";
import { BNSalesExport } from "./BNSalesExport.jsx";
import { VatSalesReport } from "./VatSalesReport.jsx";

const VIEW_LABELS = {
  hub: null,
  "sales-by-customer": "ยอดขายตามลูกค้า",
  "unbilled-dn": "ใบส่งของที่ยังไม่วางบิล",
  "bn-sales-export": "รายงานยอดขายรายเดือน",
  "vat-sales": "รายงานภาษีขาย",
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
    <div onClick={onClick} style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "20px 12px 16px", width: 140, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3, wordBreak: "keep-all" }}>{label}</div>
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <HubCard icon={<Users size={20}/>} label="ยอดขายตามลูกค้า" desc="รวมยอดขายใบส่งของของแต่ละลูกค้า" bg="#E6F1FB" color="#185FA5" onClick={() => setRView("sales-by-customer")} />
        <HubCard icon={<ClipboardList size={20}/>} label="ใบส่งของที่ยังไม่วางบิล" desc="ดูรายการใบส่งของที่ยังไม่ได้รวมเข้าใบวางบิล" bg="#FAEEDA" color="#854F0B" onClick={() => setRView("unbilled-dn")} />
        <HubCard icon={<FileSpreadsheet size={20}/>} label="รายงานยอดขายรายเดือน" desc="พิมพ์ A4 หรือ Excel" bg="#E8F5E9" color="#2E7D32" onClick={() => setRView("bn-sales-export")} />
        <HubCard icon={<Receipt size={20}/>} label="รายงานภาษีขาย" desc="ภ.พ.30 รายเดือน" bg="#EEEDFE" color="#534AB7" onClick={() => setRView("vat-sales")} />
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
      <BackHeader title="ใบส่งของที่ยังไม่วางบิล" />
      <UnbilledDNReport cache={cache} updateCache={updateCache} />
    </div>
  );

  if (rView === "bn-sales-export") return (
    <div>
      <BackHeader title="รายงานยอดขายรายเดือน" />
      <BNSalesExport cache={cache} updateCache={updateCache} />
    </div>
  );

  if (rView === "vat-sales") return (
    <div>
      <BackHeader title="รายงานภาษีขาย" />
      <VatSalesReport cache={cache} updateCache={updateCache} />
    </div>
  );

  return null;
}

export { ReportsPage };
