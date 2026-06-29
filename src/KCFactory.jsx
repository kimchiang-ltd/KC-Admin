// ============================================================
// KC Factory System — Web App
// ============================================================
// Version History — full detail in docs/daily-progress/KC_Daily_Progress_YYYY-MM-DD.md
// v1.4.177 (2026-06-29) — #214 refactor to on-blur per-field pattern (iii-soft cache): replaced on-save CustomerSyncConfirmModal with per-field CustomerFieldSyncModal. Field blur → if differs from customer record AND not cached "yes" → popup "เพิ่ม/อัพเดท X?". "ใช่" cached for session (no re-prompt for same field); "ไม่" doesn't cache (re-prompt if user edits to new value). Save applies cached "yes" decisions only. Deleted diffCustomerFields helper (per-field diff now inline). 4 forms refactored (DN/TI/BN-DN/BN-TI). BN forms lazy-fetch customer record on first blur.
// v1.4.176 (2026-06-29) — #214 customer DB sync-back: DN/TI/BN-DN/BN-TI forms compare form values vs customer record on save → silent additive (fill empty fields) OR modal CustomerSyncConfirmModal on conflict (all-or-nothing overwrite). Shared helpers added: diffCustomerFields (utils.jsx), CustomerSyncConfirmModal (ui.jsx). BN forms lazy-fetch customer via api/tiApi.getCustomers since no allCustomers state. Per-field selection deferred to #220.
// v1.4.175 (2026-06-29) — #215 TaxInvoicePage loads own TI products/sizes via tiApi.getProducts (cache key tiProductList); decoupled from KC Admin Config_Products which is DN's; KCFactory tax-invoice case no longer passes products/setProducts/sizes
// v1.4.174 (2026-06-29) — #217 SettingsPage: wire onViewChange + goListRequest props → breadcrumb shows sub-view label (ลูกค้า/สินค้า/etc.); clicking active "ตั้งค่า" in sidebar resets to hub
// v1.4.173 (2026-06-29) — #218 add `pdfHeader: "#0f2942"` to C in shared/constants.jsx — fixes TIDetailPopup table header rendering with undefined background (drift from Invoice Admin's local C, identified in #211f audit)
// v1.4.172 (2026-06-29) — #216 hotfix: BNTIPage.jsx PAGE_SIZE missing from shared/constants.jsx import (regression from #211d) → BNListView pagination crashed
// v1.4.171 (2026-06-29) — #211e Phase 7e complete: wire BN-TI as nested NAV sub-item under TI (indented + smaller font); add BillingNoteTIPage import + renderPage case; HomePage hides child items from dashboard cards; breadcrumb shows parent path (เอกสาร › ใบกำกับภาษี › ใบวางบิล TI)
// v1.4.170 (2026-06-29) — #211d Phase 7d Extract BN-TI module: TIDetailPopup + 7 BN-TI components (BNEditForm, BNDetailView, BNListView, BNDetailMiniPopup, BNCustomerPanel, BNCreateView, BillingNoteTIPage) → src/modules/ti/BNTIPage.jsx (~1,227 lines). NAV wiring deferred to #211e.
// v1.4.169 (2026-06-29) — #211a/b/c Phase 7 chunks 1-3: scaffold modules/ti/ (tiApi 104L + TISettingsPage 354L + TIPage 648L); wire NAV "ใบกำกับภาษี" + renderPage case (partial #211e — TI only, BN-TI deferred to 7d/7e)
// v1.4.167 (2026-06-27) — Move APP_VERSION to shared/constants.jsx; footer reads from constant instead of hardcoded string. Future version bumps go in constants.jsx only.
// v1.4.166 (2026-06-27) — #208 Phase 5 Extract DN+BN module: DeliveryNotePage + BillingNotePage + 11 components → src/modules/invoice/InvoicePage.jsx (~2,232 lines); KCFactory.jsx 2,519 → ~285 lines (app shell only)
// v1.4.165 (2026-06-27) — #199 fix customer modal false positive: skip checkNameOnBlur when allCustomers not loaded yet (race condition with API)
// v1.4.164 (2026-06-27) — #196 product warning ยกเลิก keeps typed name (remove updateItem clear); #201 QT loading indicator when opening existing quotation (editLoading state + progress bar + disabled click); #200 QT form header sticky (position:sticky top:0 on top nav bar)
// v1.4.163 (2026-06-26) — #207 Phase 4 Extract Settings module: SettingsPage + OtherPage + CustomerPage + ProductPage + EditableList + PlaceholderPage → src/modules/settings/SettingsPage.jsx (~636 lines); KCFactory.jsx adds import from './modules/settings/SettingsPage.jsx'
// v1.4.162 (2026-06-26) — #206 Phase 3 Extract QT module: QuotationPage + QuotationPreview → src/modules/qt/QTPage.jsx (~472 lines); KCFactory.jsx adds import { QuotationPage } from './modules/qt/QTPage.jsx'
// v1.4.161 (2026-06-26) — Phase 2 shared layer extraction: api.jsx, constants.jsx, utils.jsx, hooks.jsx, ui.jsx, autocomplete.jsx; all .js→.jsx for consistency
// v1.4.160 (2026-06-26) — #190 Remove TI module (now in Invoice Admin): delete TaxInvoiceForm/Detail/Page, bahtText, EMPTY_TAX_ITEMS, TI api endpoints, NAV entry, vatRate state, folderTI in Settings, Receipt icon
// v1.4.159 (2026-06-26) — #188 guardedSave delegates to checkNameOnBlur; newCustWarning modal buttons no longer call handleSave (DN + TI forms)
// v1.4.158 (2026-06-25) — #160 customer onBlur: checkNameOnBlur runs similar→unknown checks in sequence; newCustCheckedRef prevents duplicate check on save
// v1.4.157 (2026-06-25) — #183 BNListView cancelled section: add plainThead (no sticky), overflow:hidden→clip on cancelled card
// v1.4.156 (2026-06-25) — #182 BN Create: disabled rows for billed DNs + always-visible warning + "BN ที่สร้างแล้ว" section + BNDetailMiniPopup to cancel existing BN inline; badge สร้าง X/Y
// v1.4.155 (2026-06-25) — #170 DN cancel: block if billed (check data.bnNo, show alert before modal)
// v1.4.154 (2026-06-25) — #162 tweak: DN/TI th top:90→70 (correct direction — lower top moves th up)
// v1.4.153 (2026-06-25) — #162 tweak: DN/TI th top:72→90 (header taller than estimated)
// v1.4.152 (2026-06-25) — #162 sticky thead: overflow:hidden→clip on DN/TI/BN card divs; position:sticky top:72 on DN/TI th, top:88 on BN th
// v1.4.151 (2026-06-25) — #181 sticky header regression fix: remove marginTop/paddingTop:-18/18 hack; top:-18 on DN/TI/BN title stickies; top:32 on BN search sticky — fixes bleed + restores v1.4.149 header layout
// v1.4.150 (2026-06-25) — #158 scroll bleed fix (marginTop/paddingTop:-18/18 on DN/TI/BN sticky headers); #159 topbar fonts →13px; #163 sticky customer card DN+TI; #164 sticky add-row button DN+TI; #165 BN list search bar extracted outside card; #173 outer div height accounts for zoom
// v1.4.149 (2026-06-24) — #161 DN+TI detail view: revert ↳ expansion; 1 row per item, detail shows full " | " joined string; keep filter fix (desc2+detail)
// v1.4.148 (2026-06-24) — #161 DN+TI detail view: show continuation rows (split " | " detail into ↳ rows, #f5f7ff bg); fix DN filledItems filter to include desc2+detail
// v1.4.147 (2026-06-24) — #179 BN Create handleConfirm: fix generated:true set too broadly — mark only confirmed dnNos with bnNo, recompute generated=allBilled; partial BN keeps customer open
// v1.4.146 (2026-06-24) — #177 QR rollout: extract toDownloadUrl+renderPhoneScreen to module-level; add QR button+modal+instruction panel to TaxInvoiceDetail, BNDetailView, QuotationPage
// v1.4.140–145 (2026-06-24) — #166 #175 phone mockup polish: emoji→lucide, white camera bg, Send a copy split into 2 steps — normal dropdown (top-right, fontSize 6) then zoomed dropdown (top-right, fontSize 8, "Send a copy" highlighted blue)
// v1.4.130–143 (2026-06-24) — #155 #172 LINE QR send: QR button on DN, qrcode npm, download URL, 8-step phone mockup guide (home→camera→QR detect→Drive→menu normal→menu zoom→share→LINE), auto-opens on generate
// v1.4.130 (2026-06-24) — #168 dashboard icon: NAV_ICONS to module level, remove duplicate ICON_MAP
// v1.4.125–129 (2026-06-23) — nav restructure: สินค้า/ลูกค้า→ระบบ hub, OtherPage (ใบเสนอราคา→อื่นๆ), SettingsPage lazy load, emoji→lucide (#166), scroll fixes
// v1.4.112–124 (2026-06-23) — list/UX: pagination 50/page, search box fixes, apiCall fetch() (#149), portrait split-button PDF (#150), topbar counter-zoom, BN list/cancelled, HR scope placeholder
// v1.4.108–111 (2026-06-23) — #140 DN landscape multi-page PDF: maxRows=20, page-break dividers, hard-block, DETAIL_WARN 16→15u
// v1.4.92–107 (2026-06-22/23) — #141 QuotationPage full build: form+history+live preview, ProductAutocomplete items, cache, success dialog, top-nav buttons
// v1.4.69–91 (2026-06-19) — #111 useInvoiceForm shared hook; BN refinements: month auto-load, cache, breadcrumb, DateRangePicker, PDF on-demand, new-customer prompt
// v1.4.53–68 (2026-06-18/19) — #93–#110 BillingNote core: view-based nav, BNCreateView split-pane, BNDetailView+popup+edit, print queue, combined PDF, History caching
// v1.4.22–46 (2026-06-17/18) — #6 DN/TI soft cancel/restore; #71–#83 ProductAutocomplete free-text+portal+keyboard nav; ProductPage CRUD
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { FileText, ClipboardList, FileSearch, Package, BarChart2, Home, LayoutDashboard, LayoutGrid, ArrowLeftRight, Users, Settings, Receipt } from "lucide-react";
import { api, SCRIPT_URL } from './shared/api.jsx';
import { C, SECTION_COLORS, APP_VERSION } from './shared/constants.jsx';
import { Spinner } from './shared/ui.jsx';
import { QuotationPage } from './modules/qt/QTPage.jsx';
import { SettingsPage, OtherPage, PlaceholderPage } from './modules/settings/SettingsPage.jsx';
import { DeliveryNotePage, BillingNotePage } from './modules/invoice/InvoicePage.jsx';
import { TaxInvoicePage } from './modules/ti/TIPage.jsx';
import { BillingNoteTIPage } from './modules/ti/BNTIPage.jsx';

// ── Constants (app-specific) ──────────────────────────────

const NAV = [
  { key: "dashboard",  label: "แดชบอร์ด",         icon: "LayoutDashboard", section: null },
  { key: "invoice",    label: "ใบส่งของ",           icon: "FileText",        section: "เอกสาร" },
  { key: "billing",    label: "ใบวางบิล",           icon: "ClipboardList",   section: "เอกสาร" },
  { key: "tax-invoice",label: "ใบกำกับภาษี",        icon: "Receipt",         section: "เอกสาร" },
  { key: "bn-ti",      label: "ใบวางบิล TI",         icon: "ClipboardList",   section: "เอกสาร", parent: "tax-invoice" },
  { key: "other",      label: "อื่นๆ",               icon: "LayoutGrid",      section: "เอกสาร" },
  { key: "stockmove",  label: "เคลื่อนไหวสต็อก",   icon: "ArrowLeftRight",  section: "คลังสินค้า" },
  { key: "hr",         label: "เอกสาร HR",          icon: "FileSearch",      section: "HR" },
  { key: "reports",    label: "รายงาน",             icon: "BarChart2",       section: "รายงาน" },
  { key: "settings",   label: "ตั้งค่า",             icon: "Settings",        section: "ระบบ" },
];

// ── Shared UI — extracted to shared/ui.jsx ──
// ── Invoice (DN+BN) — extracted to modules/invoice/InvoicePage.jsx (Phase 5, #208) ──


// ── Home Page ─────────────────────────────────────────────
const NAV_ICONS = { FileText, ClipboardList, FileSearch, Package, BarChart2, Users, Settings, ArrowLeftRight, LayoutDashboard, LayoutGrid, Receipt };

function HomePage({ onNavigate }) {
  const sections = [...new Set(NAV.filter(n => n.key !== "dashboard" && n.section).map(n => n.section))];
  const dashboard = NAV.find(n => n.key === "dashboard");

  const IconBox = ({ item }) => {
    const col = SECTION_COLORS[item.section] || SECTION_COLORS[null];
    const Ic = NAV_ICONS[item.icon];
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
            {NAV.filter(n => n.section === section && !n.parent).map(item => (
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
  const contentRef = useRef(null);
  const scrollToTop = () => { if (contentRef.current) contentRef.current.scrollTop = 0; };
  const setActive = (key) => { setActive_(key); setBreadcrumbSuffix(null); scrollToTop(); };
  // handleViewChange: used as onViewChange for page components — scrolls to top when entering detail view
  const handleViewChange = (label) => { setBreadcrumbSuffix(label ?? null); if (label) scrollToTop(); };
  const [products, setProducts]   = useState([]);
  const [sizes, setSizes]         = useState([]);
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
      case "invoice":    return <DeliveryNotePage products={products} setProducts={setProducts} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "billing":    return <BillingNotePage cache={cache} updateCache={updateCache} goListRequest={goListRequest} onViewChange={handleViewChange} />;
      case "tax-invoice":return <TaxInvoicePage cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "bn-ti":      return <BillingNoteTIPage cache={cache} updateCache={updateCache} goListRequest={goListRequest} onViewChange={handleViewChange} />;
      case "other":      return <OtherPage products={products} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "settings":   return <SettingsPage cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      default:           return <PlaceholderPage title={NAV.find(n => n.key === active)?.label} icon={NAV.find(n => n.key === active)?.icon} />;
    }
  };

  const NavItem = ({ item }) => (
    <div onClick={() => { if (item.key === active) setGoListRequest(n => n + 1); else setActive(item.key); }} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: item.parent ? "7px 16px 7px 32px" : "9px 16px",
      cursor: "pointer",
      color: active === item.key ? "white" : "rgba(255,255,255,0.7)",
      background: active === item.key ? C.sidebarActive : "transparent",
      borderLeft: active === item.key ? `3px solid ${C.sidebarActiveBorder}` : "3px solid transparent",
      fontSize: item.parent ? 12 : 13, transition: "background 0.15s",
    }}>
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {NAV_ICONS[item.icon] ? React.createElement(NAV_ICONS[item.icon], { size: item.parent ? 14 : 16 }) : item.icon}
      </span>
      {item.label}
    </div>
  );

  const isDevMode = SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE";

  return (
    <div style={{ display: "flex", height: `${100/fontScale}vh`, fontFamily: "Sarabun, sans-serif" }}>
      <style>{`html, body { margin: 0; padding: 0; overflow: hidden; } body { zoom: ${fontScale}; }`}</style>

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
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>app v{APP_VERSION}{gsVersion ? <span>  ·  gs v{gsVersion}</span> : null}</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.pageBg, minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ background: "white", borderBottom: `0.5px solid ${C.border}`, padding: "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zoom: 1/fontScale }}>
          <div style={{ fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <Home size={14}/>
            <span style={{ color: active === "home" ? C.text : C.accent, cursor: active === "home" ? "default" : "pointer" }}
              onClick={() => active !== "home" && setActive("home")}>หน้าหลัก</span>
            {(() => {
              const activeItem = NAV.find(n => n.key === active);
              const parentItem = activeItem?.parent ? NAV.find(n => n.key === activeItem.parent) : null;
              return <>
                {activeItem?.section && <><span>›</span><span>{activeItem.section}</span></>}
                {parentItem && <><span>›</span>
                  <span style={{ color: C.accent, cursor: "pointer" }} onClick={() => setActive(parentItem.key)}>
                    {parentItem.label}
                  </span></>}
                {activeItem?.label && <><span>›</span>
                  <span style={{ color: breadcrumbSuffix ? C.accent : C.text, cursor: breadcrumbSuffix ? "pointer" : "default" }}
                    onClick={() => { if (breadcrumbSuffix) { setBreadcrumbSuffix(null); setGoListRequest(n => n + 1); } }}>
                    {activeItem.label}
                  </span></>}
                {breadcrumbSuffix && <><span>›</span><span style={{ color: C.text }}>{breadcrumbSuffix}</span></>}
              </>;
            })()}
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
            {userName && <span style={{ fontSize: 13, color: C.muted }}>{userName}</span>}
            {onLogout && (
              <button onClick={onLogout} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: C.muted }}>
                ออกจากระบบ
              </button>
            )}
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