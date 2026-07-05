// ============================================================
// KC Factory System — Web App
// ============================================================
// Version History — full detail in docs/daily-progress/KC_Daily_Progress_YYYY-MM-DD.md
// v1.4.308 (2026-07-05) — #310c single BN create inline DN edit: expanding a not-yet-billed DN now shows "แก้ไขใบส่งของ" → reuses DNInlineEditor (#301) in place. On save updates the DN's total live in the row + footer + header + #310a left metric cards (via onDnEdited), clears the DN pdfUrl so re-print regenerates (#309), drops _dnStore (#282). Customer locked, date preserved; billed DNs stay read-only (#296). Threads products/sizes BillingNotePage→BNCreateView→BNCustomerPanel. Completes the #310 group
// v1.4.307 (2026-07-05) — #326 BN create split-button dropdown now lists BOTH modes (สร้างแบบรวม → batch · สร้างทีละราย → single); #327 single BN create pre-fetches the selected customer's DN line items in PARALLEL on select (mirrors batch #251) so สินค้า counts appear at once + expand is instant instead of one-by-one round-trips (shows "…" while prefetching)
// v1.4.306 (2026-07-05) — #310b (pass 2 of 2) single BN create right panel: added the "แก้ไขรายการ" edit-mode toggle (mirrors batch #252d) to BNCustomerPanel — off = clean DN list (all unbilled included), on = per-DN checkboxes + select-all appear, unchecked rows grey out with line-through and drop from the total, footer shows "· ข้าม N". Exclusions persist after exiting edit mode. #310b complete
// v1.4.305 (2026-07-05) — #310b (pass 1 of 2) single BN create right panel (BNCustomerPanel): Design B refresh — header now shows DN count + customer total; DN table dropped the always-on checkbox column, added a สินค้า column (lazy getDNDetail → "สินค้า N รายการ") with click-to-expand line-item table (reuses dnCache). Scroll fix #325: removed the panel's fixed maxHeight + inner overflow so the whole panel scrolls in the right-column region (DN table no longer collapses to a sliver on fully-billed customers). Pass 2 = "แก้ไขรายการ" edit-mode toggle + exclusion checkboxes (mirror batch #252d)
// v1.4.304 (2026-07-05) — #310a single BN create left-panel: added 3 summary metric cards (ลูกค้า/ใบส่งของ/รวม) above the customer list + widened the column 220→280px (Design B). Layout only — billing logic unchanged; #310b (right-panel refresh) + #310c (inline DN edit) next
// v1.4.303 (2026-07-04) — #314 block editing a billed TI (mirror #296): TaxInvoiceDetail edit button guards on data.billed → alerts "ต้องยกเลิกใบวางบิลก่อน" instead of opening the editor, so editing a TI already on a BN-TI can't leave the parent BN-TI total/count stale
// v1.4.302 (2026-07-04) — #318 redeploy trigger only (no code change): version bump to force a fresh gh-pages commit + new "pages build and deployment" run, to supersede a wedged/Queued Pages deploy that left the live site stuck on v1.4.297. Once live shows 1.4.302, re-enable ENFORCE_AUTH on both backends (#318)
// v1.4.301 (2026-07-04) — #299e session-expiry UX: onAuthReject now shows a dedicated "เซสชันหมดอายุ / กรุณาเข้าสู่ระบบใหม่" modal with a single Google re-login button (one click satisfies the OAuth popup gesture) instead of a generic error code — a mid-session midnight-exp is benign re-auth, not a failure. Silent refresh intentionally not attempted (popup flow needs a user gesture). NOTE: only visible once #299b ENFORCE_AUTH is live
// v1.4.300 (2026-07-04) — #299c frontend auth plumbing (needs backend #299a deployed to function): apiCall + tiApiCall migrated GET→POST with text/plain body {…params, action, token} (avoids GAS CORS preflight; also resolves #288 URL-length); shared session-token store in api.jsx (setAuthToken/getAuthToken/clearAuthToken, localStorage kc_token stamped to #244 midnight); App.jsx calls api.login after Google sign-in → stores token, mounts app only on success; setOnAuthReject → drops session + re-login on backend "unauthorized" (fires once #299b live); logout clears token. tiApi shares the same token (ignored by TICode until #299d). NOTE: GAS cross-origin POST behavior to confirm on first real deploy
// v1.4.299 (2026-07-04) — #311 login error hardening: all 3 App.jsx failure paths (not-allowed / Google onError / userinfo fetch) now show ONE identical generic message "เกิดข้อผิดพลาด กรุณาลองใหม่ (รหัส NNN)" so an unauthorized user can't tell why login failed; the (รหัส NNN) is an internal-only diagnostic code (449 not-allowlisted · 491 sign-in failed · 492 userinfo error). Was: not-allowed path leaked the email + "ไม่มีสิทธิ์เข้าใช้งาน"
// v1.4.298 (2026-07-04) — audit cleanup batch: #290 delete dead EditableList component (+ its Check/Pencil imports & 🗑 emoji); #291 folder-URL save uses styled ConfirmModal instead of native window.confirm (Settings); #306 BN-TI detail VAT label drops hardcoded "7%" → "ภาษีมูลค่าเพิ่ม" (BN-TI can mix per-TI frozen rates)
// v1.4.297 (2026-07-03) — #292 single auth gate: main.jsx now renders <App/> directly (deleted the duplicate AuthWrapper + its ALLOWED_EMAILS + login screen). Fixes double-login on first sign-in (AuthWrapper stored kc_user without #244 _loginDate stamp, which App.jsx then rejected); ALLOWED_EMAILS now lives only in App.jsx
// v1.4.296 (2026-07-03) — #309 inline DN edit now mirrors the DN page: on save clears the DN's pdfUrl/portraitUrl, and the batch "เปิด PDF" button regenerates the landscape PDF (api.generateDeliveryNoteLandscapePDF) when the url was cleared → re-print after an edit gives the fresh PDF
// v1.4.295 (2026-07-03) — #301 edit DN inline from BN batch create: expand a not-yet-billed DN → "แก้ไขใบส่งของ" turns its item table into an in-place editor (reuses useInvoiceForm; customer locked; date preserved); save updates the row total + summary cards live and drops _dnStore cache. Threads products/sizes into BillingNotePage→BNBatchCreateView
// v1.4.294 (2026-07-03) — #305 TI detail VAT% label uses the TI's frozen rate (data.vatRate from backend col T) instead of the global rate — old 7% TIs no longer show an "8%" label next to a 7% amount
// v1.4.293 (2026-07-03) — #302 VAT propagation: SettingsPage keeps vatRate in settingsConfig cache (Settings no longer reverts to 7); KCFactory passes onConfigSaved→refreshVatRate so TI form/list update after a Settings save without app reload
// v1.4.292 (2026-07-03) — #295c VAT single-source: TaxInvoicePage fed vatRate from config; TI form/detail label + list total (#285) use vatRate; Settings VAT (%) field
// v1.4.289 (2026-07-03) — #296 block editing a billed DN (guard edit button like cancel); must cancel the BN first
// v1.4.288 (2026-07-03) — #284 customer field-sync failures now surface a non-blocking alert (was silent .catch) in DN/BN/TI/BN-TI forms (4 spots)
// v1.4.287 (2026-07-03) — #279 DN/TI list: stop sending search to backend (full range cached, client-side filtered) — fixes search-cache poisoning
// v1.4.286 (2026-07-03) — Tier-1 audit batch: #287 null-name guard (utils+autocomplete), #283 NaN ‖0 guard (DN+TI detail), #289 zero-amount shows 0, #281 select-all counts unbilled only (BN+BN-TI), #293 UI font Sarabun→Prompt, #280 fmtDateThai handles yyyy-MM-dd + DN popup date, #282 _dnStore invalidated on DN edit
// v1.4.283 (2026-07-03) — #276 fix hardcoded "26" BN year fallback: derive yy from current year in InvoicePage + BNTIPage (fallbacks + useState initial)
// v1.4.281 (2026-07-03) — #273 fix silent DN/TI save when customer list fails to load: guardedSave no longer blocks when allCustomers empty; CustomerAutocomplete auto-retries once + shows visible error/retry
// v1.4.280 (2026-07-03) — #184 DN list: add "สร้างเมื่อ" timestamp column (YYYY/MM/DD HH:mm:ss)
// v1.4.279 (2026-07-03) — #272 fix React.Fragment → Fragment import in BNTIPage (BN-TI batch create crash)
// v1.4.278 (2026-07-03) — #263 BN-TI create button: default to batch, dropdown for single (mirror BN #262)
// v1.4.277 (2026-07-03) — #263 BN-TI batch create: mirrors BN batch flow (summary cards, review/edit modes, confirm dialog, batch print, all-done view)
// v1.4.276 (2026-07-02) — #248 TI save button: Save icon for edit mode, Receipt for create. #232 TI list refresh button
// v1.4.275 (2026-07-02) — #271 BN create (single+batch): address/phone from Config_Customers (source of truth), user edits preserved
// v1.4.270–273 (2026-07-02) — #265–#268 list/detail polish: BN/BN-TI cache separation (#265), remove ฿ from tables (#266), 2-decimal alignment (#267), Thai date format (#268)
// v1.4.253–268 (2026-07-02) — #251–#262 BN batch create: full UX redesign (summary cards, review/edit modes, confirm dialog), cached DN details, batch print with selection, scroll fix, default batch button
// v1.4.233–252 (2026-06-30/07-01) — #226–#244 Reports redesign (SalesByCustomer filter+KPI+sparklines), BN list polish, sortable columns, BN batch create flow, TI 1/4-page dropdown, daily re-login, Drive folder settings
// v1.4.169–182 (2026-06-29) — #211–#225 Phase 7 TI/BN-TI module extraction (tiApi+TIPage+BNTIPage+TISettingsPage), customer sync-back (#214), Reports Phase A (#221), breadcrumb+hotfixes
// v1.4.160–167 (2026-06-26/27) — #190–#208 Phase 2–5 code reorganization: shared layer extraction, QT/Settings/DN+BN module split, TI removal, APP_VERSION to constants.jsx
// v1.4.130–159 (2026-06-23/25) — #155–#183 LINE QR send+phone mockup, sticky headers, BN create billed-DN guards, customer onBlur, nav restructure, pagination, DN landscape multi-page
// v1.4.69–129 (2026-06-18/23) — #93–#141 BN core (create/detail/edit/print/combined PDF), useInvoiceForm hook, QuotationPage full build, nav+UX polish
// v1.4.22–68 (2026-06-17/19) — #6–#110 DN/TI cancel/restore, ProductAutocomplete, ProductPage CRUD, BillingNote foundation
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
import { ReportsPage } from './modules/reports/ReportsPage.jsx';

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
  const [vatRate, setVatRate]     = useState(0.07); // #295c — from shared Config sheet
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
      if (typeof cfg.vatRate === "number" && cfg.vatRate > 0) setVatRate(cfg.vatRate); // #295c
      setConfigLoaded(true);
    }).catch(() => {
      setProducts(["Product A", "Product B", "Product C", "Product D"]);
      setSizes(["S", "M", "L", "XL", "XXL", "XXXL"]);
      setConfigLoaded(true);
    });
  }, []);

  // #302 B — re-fetch vatRate after a Settings save so TI form/list pick up the new rate without an app reload
  const refreshVatRate = () => {
    if (SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") return;
    api.getConfig().then(cfg => {
      if (typeof cfg.vatRate === "number" && cfg.vatRate > 0) setVatRate(cfg.vatRate);
    }).catch(() => {});
  };

  const sections = [...new Set(NAV.filter(n => n.section).map(n => n.section))];

  const renderPage = () => {
    if (!configLoaded) return <Spinner text="กำลังเริ่มต้นระบบ..." />;
    switch (active) {
      case "home":       return <HomePage onNavigate={setActive} />;
      case "invoice":    return <DeliveryNotePage products={products} setProducts={setProducts} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "billing":    return <BillingNotePage products={products} setProducts={setProducts} sizes={sizes} cache={cache} updateCache={updateCache} goListRequest={goListRequest} onViewChange={handleViewChange} />;
      case "tax-invoice":return <TaxInvoicePage vatRate={vatRate} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "bn-ti":      return <BillingNoteTIPage cache={cache} updateCache={updateCache} goListRequest={goListRequest} onViewChange={handleViewChange} />;
      case "other":      return <OtherPage products={products} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "reports":    return <ReportsPage cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "settings":   return <SettingsPage onConfigSaved={refreshVatRate} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
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
    <div style={{ display: "flex", height: `${100/fontScale}vh`, fontFamily: "Prompt, sans-serif" }}>
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
                {activeItem?.section && activeItem.section !== activeItem.label && <><span>›</span><span>{activeItem.section}</span></>}
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