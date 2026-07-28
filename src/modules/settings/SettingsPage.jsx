// ============================================================
// Settings Module — ระบบ (Settings, Customer, Product, OtherPage hub)
// ============================================================
// Phase 4 (#207) — extracted from KCFactory.jsx v1.4.163 (2026-06-26)
// SettingsPage: hub for ข้อมูลบริษัท / Google Drive folders / สินค้า / ลูกค้า
// OtherPage: hub that drills into ใบเสนอราคา (QT)
// CustomerPage: customer CRUD; ProductPage: product CRUD; PlaceholderPage: "coming soon" placeholder

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FileSearch, ChevronLeft, Building, Folder, Package, Users, Lock, Unlock, CheckCircle, Loader, Save, Receipt, Wallet, BookOpen } from "lucide-react";
import { api } from '../../shared/api.jsx';
import { C } from '../../shared/constants.jsx';
import { Btn, Spinner, ErrorBox, ConfirmModal, inputStyle } from '../../shared/ui.jsx';
import { findSimilarCustomers } from '../../shared/utils.jsx';
import { QuotationPage } from '../qt/QTPage.jsx';
import { TICustomerPage, TIProductPage } from '../ti/TISettingsPage.jsx';
import { tiApi } from '../ti/tiApi.jsx';
import { VatSalesListPage } from '../reports/VatSalesBlankForm.jsx';
import { VatPurchaseListPage } from '../reports/VatPurchaseBlankForm.jsx';
import { ExpenseLogListPage, ExpenseLogPage } from '../expense/ExpenseLogPage.jsx';


// ── Settings Components ────────────────────────────────────

function OtherPage({ products, sizes, cache, updateCache, onViewChange, goListRequest }) {
  const [oView, setOView] = useState("hub"); // hub | quotation | vat-sales | vat-purchase | expense-log | expense-log-detail
  const [expensePeriod, setExpensePeriod] = useState(null);

  // #350 — clicking sidebar "อื่นๆ" resets to hub (same pattern as SettingsPage)
  useEffect(() => { if (goListRequest) { setOView("hub"); if (onViewChange) onViewChange(null); } }, [goListRequest]);

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

  if (oView === "hub") return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>อื่นๆ</div>
      {/* ── บัญชี ── */}
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.06em", marginBottom: 10 }}>บัญชี</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        <HubCard icon={<BookOpen size={20}/>} label="รายการซื้อวัตถุดิบ" desc="บันทึกการซื้อวัตถุดิบ" bg="#FFF7ED" color="#9A3412" onClick={() => { setOView("expense-log"); if (onViewChange) onViewChange("รายการซื้อวัตถุดิบ"); }} />
      </div>
      {/* ── ภาษี ── */}
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.06em", marginBottom: 10 }}>ภาษี</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        <HubCard icon={<Receipt size={20}/>} label="รายงานภาษีขาย" desc="ภ.พ.30" bg="#EEEDFE" color="#534AB7" onClick={() => { setOView("vat-sales"); if (onViewChange) onViewChange("รายงานภาษีขาย"); }} />
        <HubCard icon={<Receipt size={20}/>} label="รายงานภาษีซื้อ" desc="ภ.พ.30" bg="#E8F5E9" color="#2E7D32" onClick={() => { setOView("vat-purchase"); if (onViewChange) onViewChange("รายงานภาษีซื้อ"); }} />
      </div>
      {/* ── เอกสาร ── */}
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.06em", marginBottom: 10 }}>เอกสาร</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <HubCard icon={<FileSearch size={20}/>} label="ใบเสนอราคา" desc="สร้างและจัดการ QT" bg="#F3E8FF" color="#6B21A8" onClick={() => { setOView("quotation"); if (onViewChange) onViewChange("ใบเสนอราคา"); }} />
      </div>
    </div>
  );

  // #350 — no more < อื่นๆ button here; top breadcrumb handles navigation back to hub
  if (oView === "quotation") return (
    <QuotationPage products={products} sizes={sizes} onViewChange={onViewChange} cache={cache} updateCache={updateCache} />
  );

  if (oView === "vat-sales") return (
    <VatSalesListPage onViewChange={onViewChange} />
  );

  if (oView === "vat-purchase") return (
    <VatPurchaseListPage onViewChange={onViewChange} />
  );

  if (oView === "expense-log") return (
    <ExpenseLogListPage onViewChange={onViewChange} onSelectPeriod={(p) => {
      setExpensePeriod(p);
      setOView("expense-log-detail");
      if (onViewChange) onViewChange("รายการซื้อวัตถุดิบ");
    }} />
  );

  if (oView === "expense-log-detail") return (
    <ExpenseLogPage onViewChange={onViewChange} initialPeriod={expensePeriod}
      onBack={() => { setOView("expense-log"); setExpensePeriod(null); if (onViewChange) onViewChange("รายการซื้อวัตถุดิบ"); }} />
  );

  return null;
}

const SETTINGS_VIEW_LABELS = {
  hub: null,
  company: "ข้อมูลบริษัท",
  folders: "Google Drive folders",
  products: "สินค้า",
  customers: "ลูกค้า",
  "ti-products": "สินค้า (ใบกำกับภาษี)",
  "ti-customers": "ลูกค้า (ใบกำกับภาษี)",
  suppliers: "ผู้ขาย",
  "expense-suppliers": "Supplier List",
};

function SettingsPage({ onConfigSaved, cache, updateCache, onViewChange, goListRequest }) {
  const [sView, setSView]       = useState("hub"); // hub | company | folders | products | customers | ti-products | ti-customers | suppliers | expense-suppliers
  // #217 — call onViewChange when sView changes so breadcrumb shows the sub-view label
  useEffect(() => { onViewChange?.(SETTINGS_VIEW_LABELS[sView] ?? null); }, [sView]);
  // #217 — react to goListRequest: clicking active "ตั้งค่า" in sidebar resets to hub
  useEffect(() => { if (goListRequest) setSView("hub"); }, [goListRequest]);
  const [company, setCompany]   = useState("หจก. โรงงานกิมเชียง");
  const [nameEN,  setNameEN]    = useState("KIMCHIANG LIMITED PARTNERSHIP");
  const [address, setAddress]   = useState("25/9 หมู่ 10 ต.ลอมแม่นาง อ.บางใหญ่ จ.นนทบุรี 11140");
  const [tel, setTel]           = useState("02-191-8698-9");
  const [taxId, setTaxId]       = useState("0103506007938");
  const [vatPct, setVatPct]     = useState("7"); // #295c — VAT % (stored as decimal on the shared Config sheet)
  const [folderDN, setFolderDN] = useState("");
  const [folderBN, setFolderBN] = useState("");
  const [folderBNCombined, setFolderBNCombined] = useState("");
  const [folderQT, setFolderQT] = useState("");
  // #240 — TI backend (TICode.gs / Invoice Admin) folders: separate deployment, own getConfig/saveConfig
  const [tiFolderTI, setTiFolderTI] = useState("");
  const [tiFolderBN, setTiFolderBN] = useState("");
  const [tiFolderBNCombined, setTiFolderBNCombined] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false); // hub loads nothing; only load when entering company/folders
  const [locked, setLocked]     = useState(true);
  const origFolders = useRef({ dn: "", bn: "", bnCombined: "", qt: "" });
  const origTiFolders = useRef({ ti: "", bn: "", bnCombined: "" });
  const [folderConfirm, setFolderConfirm] = useState(null); // #291 — { kind:'dn'|'ti', key, value, label } — replaces window.confirm on folder-URL blur
  const configFetched = useRef(false);
  const tiConfigFetched = useRef(false);

  const applyConfig = (cfg) => {
    const toUrl = id => id && !id.startsWith("http") ? `https://drive.google.com/drive/folders/${id}` : (id || "");
    if (cfg.company?.name)    setCompany(cfg.company.name);
    if (cfg.company?.nameEN)  setNameEN(cfg.company.nameEN);
    if (cfg.company?.address) setAddress(cfg.company.address);
    if (cfg.company?.tel)     setTel(cfg.company.tel);
    if (cfg.company?.taxId)   setTaxId(cfg.company.taxId);
    if (cfg.vatRate)          setVatPct(String(+(cfg.vatRate * 100).toFixed(2))); // #295c
    const dn = toUrl(cfg.folders?.dn); setFolderDN(dn);
    const bn = toUrl(cfg.folders?.bn); setFolderBN(bn);
    const bnCombined = toUrl(cfg.folders?.bnCombined); setFolderBNCombined(bnCombined);
    const qt = toUrl(cfg.folders?.qt); setFolderQT(qt);
    origFolders.current = { dn, bn, bnCombined, qt };
  };

  // #240 — TI backend has its own getConfig/saveConfig (separate deployment, same underlying spreadsheet)
  const applyTiConfig = (cfg) => {
    const toUrl = id => id && !id.startsWith("http") ? `https://drive.google.com/drive/folders/${id}` : (id || "");
    const ti = toUrl(cfg.folders?.ti); setTiFolderTI(ti);
    const bn = toUrl(cfg.folders?.bn); setTiFolderBN(bn);
    const bnCombined = toUrl(cfg.folders?.bnCombined); setTiFolderBNCombined(bnCombined);
    origTiFolders.current = { ti, bn, bnCombined };
  };

  useEffect(() => {
    if (sView !== "company" && sView !== "folders") return;
    if (configFetched.current) return;
    if (cache?.["settingsConfig"]) { applyConfig(cache["settingsConfig"]); configFetched.current = true; return; }
    setLoading(true);
    setError("");
    (async () => {
      try {
        const cfg = await api.getConfig();
        applyConfig(cfg);
        if (updateCache) updateCache("settingsConfig", cfg);
        configFetched.current = true;
      } catch (err) {
        setError("โหลดการตั้งค่าไม่สำเร็จ: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sView]);

  useEffect(() => {
    if (sView !== "folders") return;
    if (tiConfigFetched.current) return;
    if (cache?.["tiSettingsConfig"]) { applyTiConfig(cache["tiSettingsConfig"]); tiConfigFetched.current = true; return; }
    (async () => {
      try {
        const cfg = await tiApi.getConfig();
        applyTiConfig(cfg);
        if (updateCache) updateCache("tiSettingsConfig", cfg);
        tiConfigFetched.current = true;
      } catch (err) {
        setError(prev => prev || ("โหลดการตั้งค่า TI ไม่สำเร็จ: " + err.message));
      }
    })();
  }, [sView]);

  // #291 — blur just opens the styled ConfirmModal; actual save runs in doFolderSave on confirm
  const handleTiFolderBlur = (key, value, label) => {
    if (locked) return;
    if (value === origTiFolders.current[key]) return;
    setFolderConfirm({ kind: "ti", key, value, label });
  };

  const handleFolderBlur = (key, value, label) => {
    if (locked) return;
    if (value === origFolders.current[key]) return;
    setFolderConfirm({ kind: "dn", key, value, label });
  };

  const doFolderSave = async () => {
    const pend = folderConfirm;
    if (!pend) return;
    setFolderConfirm(null);
    setSaving(true);
    setError("");
    try {
      if (pend.kind === "ti") {
        const newTiFolders = { ti: tiFolderTI, bn: tiFolderBN, bnCombined: tiFolderBNCombined, [pend.key]: pend.value };
        await tiApi.saveConfig({ folders: newTiFolders });
        origTiFolders.current = { ...origTiFolders.current, [pend.key]: pend.value };
      } else {
        const newFolders = { dn: folderDN, bn: folderBN, bnCombined: folderBNCombined, qt: folderQT, [pend.key]: pend.value };
        await api.saveConfig({
          company: { name: company, nameEN, address, tel, taxId },
          folders: newFolders,
        });
        origFolders.current = { ...origFolders.current, [pend.key]: pend.value };
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    try {
      await api.saveConfig({
        company: { name: company, nameEN, address, tel, taxId },
        folders: { dn: folderDN, bn: folderBN, bnCombined: folderBNCombined, qt: folderQT },
        vatRate: (parseFloat(vatPct) || 7) / 100, // #295c
      });
      if (updateCache) updateCache("settingsConfig", { company: { name: company, nameEN, address, tel, taxId }, folders: { dn: folderDN, bn: folderBN, bnCombined: folderBNCombined, qt: folderQT }, vatRate: (parseFloat(vatPct) || 7) / 100 }); // #302 A — keep vatRate in cache so re-opening Settings shows the saved rate (not default 7)
      // #240 — also persist TI backend folders (separate deployment) when saving from the folders view
      if (sView === "folders") {
        const newTiFolders = { ti: tiFolderTI, bn: tiFolderBN, bnCombined: tiFolderBNCombined };
        await tiApi.saveConfig({ folders: newTiFolders });
        origTiFolders.current = newTiFolders;
        if (updateCache) updateCache("tiSettingsConfig", { folders: newTiFolders });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setLocked(true);
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner text="กำลังโหลดการตั้งค่า..." />;

  const inpS  = { ...inputStyle, width: "100%",   ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };
  const taS   = { ...inputStyle, width: "100%",   resize: "vertical", ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };
  const monoS = { ...inputStyle, width: "100%",   fontFamily: "monospace", fontSize: 11, ...(locked ? { opacity: 0.65, cursor: "not-allowed" } : {}) };

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

  const BackHeader = ({ title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <button onClick={() => setSView("hub")} style={{ fontSize: 12, padding: "4px 10px", border: `0.5px solid ${C.border}`, borderRadius: 5, background: C.pageBg, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <ChevronLeft size={14}/> ระบบ
      </button>
      <span style={{ color: C.muted, fontSize: 12 }}>/</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
    </div>
  );

  if (sView === "hub") return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>⚙ ระบบ</div>

      {/* ── ทั่วไป ── */}
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.06em", marginBottom: 10 }}>ทั่วไป</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        <HubCard icon={<Building size={20}/>} label="ข้อมูลบริษัท" desc="ชื่อ ที่อยู่ เลขภาษี" bg="#E6F1FB" color="#1A5FA4" onClick={() => setSView("company")} />
        <HubCard icon={<Folder size={20}/>} label="Google Drive" desc="folder URLs ทุก doc type" bg="#EBF4FD" color="#2B6CB0" onClick={() => setSView("folders")} />
        <HubCard icon={<Package size={20}/>} label="สินค้า" desc="จัดการรายการสินค้า / ขนาด" bg="#DFEAFA" color="#1E4E8C" onClick={() => setSView("products")} />
        <HubCard icon={<Users size={20}/>} label="ลูกค้า" desc="รายชื่อและข้อมูลลูกค้า" bg="#F0F5FC" color="#3664A8" onClick={() => setSView("customers")} />
      </div>

      {/* ── ภาษี ── */}
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.06em", marginBottom: 10 }}>ภาษี</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <HubCard icon={<Package size={20}/>} label={<>รายชื่อสินค้าสำหรับ<span style={{ whiteSpace: "nowrap" }}>ใบกำกับภาษี</span> (VAT)</>} desc="สินค้าสำหรับใบกำกับภาษี" bg="#E1F5EE" color="#0F6E56" onClick={() => setSView("ti-products")} />
        <HubCard icon={<Users size={20}/>} label={<>รายชื่อลูกค้าสำหรับ<span style={{ whiteSpace: "nowrap" }}>ใบกำกับภาษี</span> (VAT)</>} desc="ลูกค้าสำหรับใบกำกับภาษี" bg="#E8F8F0" color="#1A7A4C" onClick={() => setSView("ti-customers")} />
        <HubCard icon={<Users size={20}/>} label={<>รายชื่อ supplier สำหรับ<span style={{ whiteSpace: "nowrap" }}>รายงานภาษีซื้อ</span> (VAT)</>} desc="รายชื่อผู้ขาย/ผู้ให้บริการ" bg="#DFFBE9" color="#276749" onClick={() => setSView("suppliers")} />
      </div>

      {/* ── ค่าใช้จ่าย (#367b) ── */}
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.06em", marginBottom: 10, marginTop: 24 }}>ค่าใช้จ่าย</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <HubCard icon={<Wallet size={20}/>} label="Supplier List" desc="รายชื่อผู้ขายวัตถุดิบ" bg="#FFF7ED" color="#9A3412" onClick={() => setSView("expense-suppliers")} />
      </div>
    </div>
  );

  if (sView === "company") return (
    <div>
      <BackHeader title="ข้อมูลบริษัท" />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setLocked(l => !l)} style={{ background: locked ? C.pageBg : "#fff9e6", border: `0.5px solid ${locked ? C.border : "#f0a500"}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: locked ? C.muted : "#b87800", display: "flex", alignItems: "center", gap: 5 }}>
          {locked ? <><Lock size={12}/> ล็อค</> : <><Unlock size={12}/> กำลังแก้ไข</>}
        </button>
        {!locked && <Btn primary onClick={handleSaveAll} disabled={saving}>{saving ? <><Loader size={13}/> กำลังบันทึก...</> : saved ? <><CheckCircle size={13}/> บันทึกแล้ว</> : <><Save size={13}/> บันทึกทั้งหมด</>}</Btn>}
      </div>
      {error && <div style={{ marginBottom: 14 }}><ErrorBox msg={error} /></div>}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, maxWidth: 480 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อบริษัท</div><input value={company} onChange={e => setCompany(e.target.value)} disabled={locked} style={inpS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อภาษาอังกฤษ</div><input value={nameEN} onChange={e => setNameEN(e.target.value)} disabled={locked} placeholder="COMPANY NAME IN ENGLISH" style={inpS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เลขประจำตัวผู้เสียภาษี</div><input value={taxId} onChange={e => setTaxId(e.target.value)} disabled={locked} placeholder="0000000000000" maxLength={13} style={{ ...inpS, fontFamily: "monospace", letterSpacing: "0.06em" }} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><textarea value={address} onChange={e => setAddress(e.target.value)} disabled={locked} rows={2} style={taS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>โทรศัพท์ / แฟกซ์</div><input value={tel} onChange={e => setTel(e.target.value)} disabled={locked} style={inpS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>VAT (%) <span style={{ color: C.muted, opacity: 0.7 }}>— ใช้กับใบกำกับภาษี</span></div><input type="number" min="0" step="0.01" value={vatPct} onChange={e => setVatPct(e.target.value)} disabled={locked} placeholder="7" style={{ ...inpS, width: 120 }} /></div>
        </div>
      </div>
    </div>
  );

  if (sView === "folders") return (
    <div>
      <BackHeader title="Google Drive folders" />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setLocked(l => !l)} style={{ background: locked ? C.pageBg : "#fff9e6", border: `0.5px solid ${locked ? C.border : "#f0a500"}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: locked ? C.muted : "#b87800", display: "flex", alignItems: "center", gap: 5 }}>
          {locked ? <><Lock size={12}/> ล็อค</> : <><Unlock size={12}/> กำลังแก้ไข</>}
        </button>
        {!locked && <Btn primary onClick={handleSaveAll} disabled={saving}>{saving ? <><Loader size={13}/> กำลังบันทึก...</> : saved ? <><CheckCircle size={13}/> บันทึกแล้ว</> : <><Save size={13}/> บันทึกทั้งหมด</>}</Btn>}
      </div>
      {error && <div style={{ marginBottom: 14 }}><ErrorBox msg={error} /></div>}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, maxWidth: 520 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}><Folder size={13}/> Google Drive Folder URLs</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบส่งของ</div><input value={folderDN} onChange={e => setFolderDN(e.target.value)} onBlur={e => handleFolderBlur("dn", e.target.value, "DN")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบวางบิล</div><input value={folderBN} onChange={e => setFolderBN(e.target.value)} onBlur={e => handleFolderBlur("bn", e.target.value, "BN")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบวางบิล แบบ พิมพ์รวม <span style={{ color: C.muted, opacity: 0.7 }}>— เว้นว่าง = subfolder อัตโนมัติ</span></div><input value={folderBNCombined} onChange={e => setFolderBNCombined(e.target.value)} onBlur={e => handleFolderBlur("bnCombined", e.target.value, "BN Combined")} disabled={locked} placeholder="(เว้นว่างได้)" style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบเสนอราคา <span style={{ color: C.muted, opacity: 0.7 }}>— เว้นว่าง = My Drive root</span></div><input value={folderQT} onChange={e => setFolderQT(e.target.value)} onBlur={e => handleFolderBlur("qt", e.target.value, "QT")} disabled={locked} placeholder="(เว้นว่างได้)" style={monoS} /></div>
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0f4ff", borderRadius: 6, fontSize: 11, color: C.muted }}>
          💡 วาง URL จาก Google Drive ได้เลย — ระบบจะดึง Folder ID ให้อัตโนมัติ
        </div>
      </div>
      {/* #240 — TI backend (TICode.gs / Invoice Admin deployment) — separate script, same underlying spreadsheet */}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, maxWidth: 520, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}><Folder size={13}/> Google Drive Folder URLs — ใบกำกับภาษี</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 11 }}>ระบบ TI ใช้ backend แยก (TICode.gs) — บันทึกที่นี่แทนแอป Invoice Admin</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบกำกับภาษี</div><input value={tiFolderTI} onChange={e => setTiFolderTI(e.target.value)} onBlur={e => handleTiFolderBlur("ti", e.target.value, "TI")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบวางบิลสำหรับใบกำกับภาษี</div><input value={tiFolderBN} onChange={e => setTiFolderBN(e.target.value)} onBlur={e => handleTiFolderBlur("bn", e.target.value, "BN-TI")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบวางบิลสำหรับใบกำกับภาษี แบบ พิมพ์รวม <span style={{ color: C.muted, opacity: 0.7 }}>— เว้นว่าง = subfolder อัตโนมัติ</span></div><input value={tiFolderBNCombined} onChange={e => setTiFolderBNCombined(e.target.value)} onBlur={e => handleTiFolderBlur("bnCombined", e.target.value, "BN-TI Combined")} disabled={locked} placeholder="(เว้นว่างได้)" style={monoS} /></div>
        </div>
      </div>
      {folderConfirm && (
        <ConfirmModal
          message={`บันทึก Folder URL สำหรับ ${folderConfirm.label} ใหม่?`}
          confirmLabel="บันทึก"
          loading={saving}
          onConfirm={doFolderSave}
          onCancel={() => setFolderConfirm(null)}
        />
      )}
    </div>
  );

  if (sView === "products") return (
    <div>
      <BackHeader title="สินค้า" />
      <ProductPage cache={cache} updateCache={updateCache} />
    </div>
  );

  if (sView === "customers") return (
    <div>
      <BackHeader title="ลูกค้า" />
      <CustomerPage />
    </div>
  );

  if (sView === "ti-products") return (
    <div>
      <BackHeader title="สินค้า (ใบกำกับภาษี)" />
      <TIProductPage cache={cache} updateCache={updateCache} />
    </div>
  );

  if (sView === "ti-customers") return (
    <div>
      <BackHeader title="ลูกค้า (ใบกำกับภาษี)" />
      <TICustomerPage />
    </div>
  );

  if (sView === "suppliers") return (
    <div>
      <BackHeader title="ผู้ขาย" />
      <SupplierPage />
    </div>
  );

  if (sView === "expense-suppliers") return (
    <div>
      <BackHeader title="Supplier List" />
      <ExpenseSupplierPage />
    </div>
  );

  return null;
}

// ── Customer List ──────────────────────────────────────────

function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState(null); // null | { mode:"add"|"edit", data:{}, originalName? }
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [similarWarning, setSimilarWarning] = useState(null); // [names] when similar names found
  const [actionError, setActionError] = useState(null);
  const formRef             = useRef(null);
  const similarConfirmedRef = useRef(false);
  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

  const checkCPSimilarity = (nameVal) => {
    if (!nameVal.trim() || similarConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, customers);
    if (similar.length > 0) setSimilarWarning(similar);
  };

  useEffect(() => {
    if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [form]);

  const load = useCallback(async (q) => {
    setListLoading(true);
    try { setCustomers(await api.getCustomers(q ?? "")); }
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setListLoading(false); }
  }, []);

  useEffect(() => { load(""); }, []);

  const EMPTY = { name: "", address: "", phone: "", taxId: "", note: "", branch: "" }; // #338b +branch

  const doSave = async () => {
    setSimilarWarning(null);
    setSaving(true);
    try {
      if (form.mode === "add") { await api.createCustomer(form.data); }
      else { await api.updateCustomer(form.originalName, form.data); }
      setForm(null);
      await load(search);
    } catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.data.name.trim()) { setActionError("กรุณากรอกชื่อลูกค้า"); return; }
    // Similarity check — only on add, skip if already confirmed on blur
    if (form.mode === "add" && !similarConfirmedRef.current) {
      const similar = findSimilarCustomers(form.data.name, customers);
      if (similar.length > 0) { setSimilarWarning(similar); return; }
    }
    similarConfirmedRef.current = false;
    await doSave();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try { await api.deleteCustomer(deleteTarget); setDeleteTarget(null); await load(search); }
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const fldStyle = { ...inputStyle, width: "100%", height: 30, fontSize: 13 };
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B" }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>👤 รายชื่อลูกค้า</span>
        <Btn primary onClick={() => setForm({ mode: "add", data: { ...EMPTY } })}>+ เพิ่มลูกค้าใหม่</Btn>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(search)}
          placeholder="ค้นหาชื่อ / ที่อยู่ / เบอร์โทร..."
          style={{ ...inputStyle, flex: 1, height: 32 }} />
        <Btn primary onClick={() => load(search)}>ค้นหา</Btn>
        {search && <Btn onClick={() => { setSearch(""); load(""); }}>ล้าง</Btn>}
      </div>

      {/* Add / Edit form */}
      {form && (
        <div ref={formRef} style={{ background: "#F8FAFF", border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>{form.mode === "add" ? "เพิ่มลูกค้าใหม่" : "แก้ไขข้อมูลลูกค้า"}</div>
          {[
            { key: "name",    label: "ชื่อลูกค้า *", placeholder: "ชื่อบริษัท / ชื่อลูกค้า" },
            { key: "address", label: "ที่อยู่",        placeholder: "ที่อยู่" },
            { key: "phone",   label: "โทรศัพท์",       placeholder: "เบอร์โทรศัพท์" },
            { key: "taxId",   label: "เลขภาษี",        placeholder: "เลขประจำตัวผู้เสียภาษี 13 หลัก" },
            { key: "note",    label: "หมายเหตุ",       placeholder: "หมายเหตุ" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{label}</div>
              <input
                value={form.data[key]}
                onChange={e => {
                  if (key === "name") similarConfirmedRef.current = false;
                  setForm(f => ({ ...f, data: { ...f.data, [key]: e.target.value } }));
                }}
                onBlur={key === "name" ? () => { if (form.mode === "add") checkCPSimilarity(form.data.name); } : undefined}
                placeholder={placeholder}
                style={fldStyle} />
            </div>
          ))}
          {/* #338b — สาขา (branch): "" = ไม่ระบุ, "00000" = สำนักงานใหญ่, "00001"+ = สาขาเลขที่ N */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>สาขา (สำหรับรายงานภาษีขาย)</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={form.data.branch === "" ? "" : form.data.branch === "00000" ? "main" : "branch"}
                onChange={e => {
                  const v = e.target.value;
                  const nb = v === "" ? "" : v === "main" ? "00000" : "00001";
                  setForm(f => ({ ...f, data: { ...f.data, branch: nb } }));
                }}
                style={{ ...fldStyle, width: 180 }}>
                <option value="">— ไม่ระบุ —</option>
                <option value="main">สำนักงานใหญ่</option>
                <option value="branch">สาขาเลขที่...</option>
              </select>
              {form.data.branch && form.data.branch !== "00000" && (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.data.branch}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setForm(f => ({ ...f, data: { ...f.data, branch: v } }));
                  }}
                  onBlur={e => {
                    // pad to 5 digits on blur if non-empty and not "00000"
                    const v = e.target.value.replace(/\D/g, "");
                    if (v && v !== "00000") {
                      const padded = ("00000" + v).slice(-5);
                      setForm(f => ({ ...f, data: { ...f.data, branch: padded } }));
                    }
                  }}
                  placeholder="00001"
                  style={{ ...fldStyle, width: 90, fontFamily: "monospace", letterSpacing: "0.05em" }} />
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn primary onClick={handleSave} disabled={saving}>
              {saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}
            </Btn>
            <Btn onClick={() => setForm(null)} disabled={saving}>ยกเลิก</Btn>
          </div>
        </div>
      )}

      {/* Table */}
      {listLoading ? <Spinner text="กำลังโหลด..." /> : (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr>
                <th style={thS}>ชื่อลูกค้า</th>
                <th style={thS}>ที่อยู่</th>
                <th style={thS}>โทรศัพท์</th>
                <th style={thS}>เลขภาษี</th>
                <th style={thS}>สาขา</th>{/* #338b */}
                <th style={thS}>หมายเหตุ</th>
                <th style={{ ...thS, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: C.muted }}>{/* #338b: 6→7 cols */}
                  {search ? `ไม่พบลูกค้าที่ตรงกับ "${search}"` : "ยังไม่มีข้อมูลลูกค้า"}
                </td></tr>
              ) : customers.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdS, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ ...tdS, color: C.muted }}>{c.address}</td>
                  <td style={tdS}>{c.phone}</td>
                  <td style={{ ...tdS, fontFamily: "monospace", fontSize: 12 }}>{c.taxId}</td>
                  {/* #338b — branch display: "" → dim "—" · "00000" → "สำนักงานใหญ่" · else → "สาขา NNNNN" */}
                  <td style={{ ...tdS, fontSize: 12, color: !c.branch ? C.muted : undefined }}>
                    {!c.branch ? "—" : c.branch === "00000" ? "สำนักงานใหญ่" : `สาขา ${c.branch}`}
                  </td>
                  <td style={{ ...tdS, color: C.muted }}>{c.note}</td>
                  <td style={{ ...tdS, display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setForm({ mode: "edit", data: { ...c }, originalName: c.name })}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#E0E7FF", color: "#3730A3", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c.name)}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`ลบ "${deleteTarget}" ออกจากรายชื่อลูกค้าใช่ไหม?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading} enterConfirm />
      )}

      {similarWarning && form && (
        <ConfirmModal
          message={`พบชื่อที่คล้ายกันในระบบ:\n"${similarWarning.join('", "')}"\n\nยืนยันเพิ่ม "${form.data.name}" เป็นลูกค้าใหม่ใช่ไหม?`}
          onConfirm={() => { similarConfirmedRef.current = true; setSimilarWarning(null); }}
          onCancel={() => setSimilarWarning(null)}
          confirmLabel="ใช่ เพิ่มใหม่"
        />
      )}
    </div>
  );
}

// ── Supplier List (#356) ──────────────────────────────────

function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [similarWarning, setSimilarWarning] = useState(null);
  const [actionError, setActionError] = useState(null);
  const formRef             = useRef(null);
  const similarConfirmedRef = useRef(false);
  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

  const checkSimilarity = (nameVal) => {
    if (!nameVal.trim() || similarConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, suppliers);
    if (similar.length > 0) setSimilarWarning(similar);
  };

  useEffect(() => {
    if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [form]);

  const load = useCallback(async (q) => {
    setListLoading(true);
    try { setSuppliers(await api.getSuppliers(q ?? "")); }
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setListLoading(false); }
  }, []);

  useEffect(() => { load(""); }, []);

  const EMPTY = { name: "", address: "", phone: "", taxId: "", note: "", branch: "" };

  const doSave = async () => {
    setSimilarWarning(null);
    setSaving(true);
    try {
      if (form.mode === "add") { await api.createSupplier(form.data); }
      else { await api.updateSupplier(form.originalName, form.data); }
      setForm(null);
      await load(search);
    } catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.data.name.trim()) { setActionError("กรุณากรอกชื่อผู้ขาย"); return; }
    if (form.mode === "add" && !similarConfirmedRef.current) {
      const similar = findSimilarCustomers(form.data.name, suppliers);
      if (similar.length > 0) { setSimilarWarning(similar); return; }
    }
    similarConfirmedRef.current = false;
    await doSave();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try { await api.deleteSupplier(deleteTarget); setDeleteTarget(null); await load(search); }
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const fldStyle = { ...inputStyle, width: "100%", height: 30, fontSize: 13 };
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B" }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>🏪 รายชื่อผู้ขาย / ผู้ให้บริการ</span>
        <Btn primary onClick={() => setForm({ mode: "add", data: { ...EMPTY } })}>+ เพิ่มผู้ขายใหม่</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(search)}
          placeholder="ค้นหาชื่อ / ที่อยู่ / เบอร์โทร..."
          style={{ ...inputStyle, flex: 1, height: 32 }} />
        <Btn primary onClick={() => load(search)}>ค้นหา</Btn>
        {search && <Btn onClick={() => { setSearch(""); load(""); }}>ล้าง</Btn>}
      </div>

      {form && (
        <div ref={formRef} style={{ background: "#FFFBEB", border: `1px solid #F59E0B44`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>{form.mode === "add" ? "เพิ่มผู้ขายใหม่" : "แก้ไขข้อมูลผู้ขาย"}</div>
          {[
            { key: "name",    label: "ชื่อผู้ขาย *", placeholder: "ชื่อบริษัท / ชื่อผู้ขาย" },
            { key: "address", label: "ที่อยู่",        placeholder: "ที่อยู่" },
            { key: "phone",   label: "โทรศัพท์",       placeholder: "เบอร์โทรศัพท์" },
            { key: "taxId",   label: "เลขภาษี",        placeholder: "เลขประจำตัวผู้เสียภาษี 13 หลัก" },
            { key: "note",    label: "หมายเหตุ",       placeholder: "หมายเหตุ" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{label}</div>
              <input
                value={form.data[key]}
                onChange={e => {
                  if (key === "name") similarConfirmedRef.current = false;
                  setForm(f => ({ ...f, data: { ...f.data, [key]: e.target.value } }));
                }}
                onBlur={key === "name" ? () => { if (form.mode === "add") checkSimilarity(form.data.name); } : undefined}
                placeholder={placeholder}
                style={fldStyle} />
            </div>
          ))}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>สาขา</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={form.data.branch === "" ? "" : form.data.branch === "00000" ? "main" : "branch"}
                onChange={e => {
                  const v = e.target.value;
                  const nb = v === "" ? "" : v === "main" ? "00000" : "00001";
                  setForm(f => ({ ...f, data: { ...f.data, branch: nb } }));
                }}
                style={{ ...fldStyle, width: 180 }}>
                <option value="">— ไม่ระบุ —</option>
                <option value="main">สำนักงานใหญ่</option>
                <option value="branch">สาขาเลขที่...</option>
              </select>
              {form.data.branch && form.data.branch !== "00000" && (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.data.branch}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setForm(f => ({ ...f, data: { ...f.data, branch: v } }));
                  }}
                  onBlur={e => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v && v !== "00000") {
                      const padded = ("00000" + v).slice(-5);
                      setForm(f => ({ ...f, data: { ...f.data, branch: padded } }));
                    }
                  }}
                  placeholder="00001"
                  style={{ ...fldStyle, width: 90, fontFamily: "monospace", letterSpacing: "0.05em" }} />
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn primary onClick={handleSave} disabled={saving}>
              {saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}
            </Btn>
            <Btn onClick={() => setForm(null)} disabled={saving}>ยกเลิก</Btn>
          </div>
        </div>
      )}

      {listLoading ? <Spinner text="กำลังโหลด..." /> : (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr>
                <th style={thS}>ชื่อผู้ขาย</th>
                <th style={thS}>ที่อยู่</th>
                <th style={thS}>โทรศัพท์</th>
                <th style={thS}>เลขภาษี</th>
                <th style={thS}>สาขา</th>
                <th style={thS}>หมายเหตุ</th>
                <th style={{ ...thS, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: C.muted }}>
                  {search ? `ไม่พบผู้ขายที่ตรงกับ "${search}"` : "ยังไม่มีข้อมูลผู้ขาย"}
                </td></tr>
              ) : suppliers.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdS, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ ...tdS, color: C.muted }}>{c.address}</td>
                  <td style={tdS}>{c.phone}</td>
                  <td style={{ ...tdS, fontFamily: "monospace", fontSize: 12 }}>{c.taxId}</td>
                  <td style={{ ...tdS, fontSize: 12, color: !c.branch ? C.muted : undefined }}>
                    {!c.branch ? "—" : c.branch === "00000" ? "สำนักงานใหญ่" : `สาขา ${c.branch}`}
                  </td>
                  <td style={{ ...tdS, color: C.muted }}>{c.note}</td>
                  <td style={{ ...tdS, display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setForm({ mode: "edit", data: { ...c }, originalName: c.name })}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEF3C7", color: "#92400E", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c.name)}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`ลบ "${deleteTarget}" ออกจากรายชื่อผู้ขายใช่ไหม?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading} enterConfirm />
      )}

      {similarWarning && form && (
        <ConfirmModal
          message={`พบชื่อที่คล้ายกันในระบบ:\n"${similarWarning.join('", "')}"\n\nยืนยันเพิ่ม "${form.data.name}" เป็นผู้ขายใหม่ใช่ไหม?`}
          onConfirm={() => { similarConfirmedRef.current = true; setSimilarWarning(null); }}
          onCancel={() => setSimilarWarning(null)}
          confirmLabel="ใช่ เพิ่มใหม่"
        />
      )}
    </div>
  );
}

// ── Expense Supplier List (#367b) ─────────────────────────

function ExpenseSupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [form, setForm]           = useState(null); // null | { mode:"add"|"edit", data:{} }
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [similarWarning, setSimilarWarning] = useState(null);
  const [actionError, setActionError] = useState(null);
  const formRef             = useRef(null);
  const similarConfirmedRef = useRef(false);
  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

  const checkSimilarity = (nameVal) => {
    if (!nameVal.trim() || similarConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, suppliers);
    if (similar.length > 0) setSimilarWarning(similar);
  };

  useEffect(() => {
    if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [form]);

  const load = useCallback(async () => {
    setListLoading(true);
    try { setSuppliers(await api.getExpenseSuppliers()); }
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setListLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const EMPTY = { name: "" };

  const doSave = async () => {
    setSimilarWarning(null);
    setSaving(true);
    try {
      if (form.mode === "add") { await api.createExpenseSupplier({ name: form.data.name }); }
      else { await api.updateExpenseSupplier({ id: form.data.id, name: form.data.name }); }
      setForm(null);
      await load();
    } catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.data.name.trim()) { setActionError("กรุณากรอกชื่อผู้ขาย"); return; }
    if (form.mode === "add" && !similarConfirmedRef.current) {
      const similar = findSimilarCustomers(form.data.name, suppliers);
      if (similar.length > 0) { setSimilarWarning(similar); return; }
    }
    similarConfirmedRef.current = false;
    await doSave();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try { await api.deleteExpenseSupplier({ id: deleteTarget.id }); setDeleteTarget(null); await load(); }
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const fldStyle = { ...inputStyle, width: "100%", height: 30, fontSize: 13 };
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B" }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Supplier List</span>
        <Btn primary onClick={() => setForm({ mode: "add", data: { ...EMPTY } })}>+ เพิ่มผู้ขายใหม่</Btn>
      </div>

      {form && (
        <div ref={formRef} style={{ background: "#FFFBEB", border: `1px solid #F59E0B44`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>{form.mode === "add" ? "เพิ่มผู้ขายใหม่" : "แก้ไขข้อมูลผู้ขาย"}</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อผู้ขาย *</div>
            <input
              value={form.data.name}
              onChange={e => { similarConfirmedRef.current = false; setForm(f => ({ ...f, data: { ...f.data, name: e.target.value } })); }}
              onBlur={() => { if (form.mode === "add") checkSimilarity(form.data.name); }}
              placeholder="ชื่อร้าน / ชื่อผู้ขาย"
              style={fldStyle} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn primary onClick={handleSave} disabled={saving}>
              {saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}
            </Btn>
            <Btn onClick={() => setForm(null)} disabled={saving}>ยกเลิก</Btn>
          </div>
        </div>
      )}

      {listLoading ? <Spinner text="กำลังโหลด..." /> : (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr>
                <th style={thS}>#</th>
                <th style={thS}>ชื่อผู้ขาย</th>
                <th style={{ ...thS, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 32, textAlign: "center", color: C.muted }}>
                  ยังไม่มีผู้ขายวัตถุดิบ
                </td></tr>
              ) : [...suppliers].sort((a, b) => a.name.localeCompare(b.name, "th")).map((s, i) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdS, width: 40, textAlign: "center", color: C.muted }}>{i + 1}</td>
                  <td style={{ ...tdS, fontWeight: 500 }}>{s.name}</td>
                  <td style={{ ...tdS, display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setForm({ mode: "edit", data: { id: s.id, name: s.name } })}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEF3C7", color: "#92400E", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                      style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`ลบ "${deleteTarget.name}" ออกจากรายชื่อผู้ขายวัตถุดิบใช่ไหม?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading} enterConfirm />
      )}

      {similarWarning && form && (
        <ConfirmModal
          message={`พบชื่อที่คล้ายกันในระบบ:\n"${similarWarning.join('", "')}"\n\nยืนยันเพิ่ม "${form.data.name}" เป็นผู้ขายใหม่ใช่ไหม?`}
          onConfirm={() => { similarConfirmedRef.current = true; setSimilarWarning(null); }}
          onCancel={() => setSimilarWarning(null)}
          confirmLabel="ใช่ เพิ่มใหม่"
        />
      )}
    </div>
  );
}

// ── Product Management Page ────────────────────────────────

function ProductPage({ cache, updateCache }) {
  const [items, setItems]           = useState([]); // [{type,value,row}]
  const [loading, setLoading]       = useState(true);
  const [locked, setLocked]         = useState(true);
  const [tab, setTab]               = useState("product"); // "product" | "size"
  const [form, setForm]             = useState(null); // null | { mode:"add"|"edit", row?:number, value:"" }
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {row, value}
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const formRef = useRef(null);
  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getProducts();
      setItems(result);
      updateCache?.("productList", result);
    }
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (cache?.["productList"]) { setItems(cache["productList"]); setLoading(false); }
    else { load(); }
  }, []);
  useEffect(() => { if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [form]);

  const visible = items.filter(it => it.type === tab);

  const handleSave = async () => {
    if (!form.value.trim()) { setActionError("กรุณากรอกชื่อ"); return; }
    setSaving(true);
    try {
      if (form.mode === "add") {
        await api.addProduct(form.value.trim(), tab);
      } else {
        await api.updateProduct(form.row, form.value);
      }
      setForm(null);
      updateCache?.("productList", null);
      await load();
    } catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.deleteProduct(deleteTarget.row);
      setDeleteTarget(null);
      updateCache?.("productList", null);
      await load();
    }
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const tabLabel = tab === "product" ? "สินค้า" : "ขนาด";
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B" }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Package size={16}/> จัดการสินค้า</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => { setLocked(l => !l); if (!locked) setForm(null); }}
            style={{ background: locked ? C.pageBg : "#fff9e6", border: `0.5px solid ${locked ? C.border : "#f0a500"}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: locked ? C.muted : "#b87800", display: "flex", alignItems: "center", gap: 5 }}>
            {locked ? <><Lock size={12}/> ล็อค</> : <><Unlock size={12}/> กำลังแก้ไข</>}
          </button>
          {!locked && <Btn primary onClick={() => setForm({ mode: "add", value: "" })}>+ เพิ่ม{tabLabel}ใหม่</Btn>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[["product","สินค้า"],["size","ขนาด"]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setForm(null); }} style={{
            padding: "6px 18px", fontSize: 13, borderRadius: 6, cursor: "pointer", border: "none",
            background: tab === key ? C.accent : C.pageBg,
            color: tab === key ? "#fff" : C.text,
            fontFamily: "Prompt, sans-serif", fontWeight: tab === key ? 500 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* Add / Edit form */}
      {form && !locked && (
        <div ref={formRef} style={{ background: "#F8FAFF", border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>{form.mode === "add" ? `เพิ่ม${tabLabel}ใหม่` : `แก้ไข${tabLabel}`}</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อ{tabLabel}</div>
            <input
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder={`ชื่อ${tabLabel}`}
              autoFocus
              style={{ ...inputStyle, width: "100%", height: 30, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn primary onClick={handleSave} disabled={saving}>
              {saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}
            </Btn>
            <Btn onClick={() => setForm(null)} disabled={saving}>ยกเลิก</Btn>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <Spinner text="กำลังโหลด..." /> : (
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr>
                <th style={{ ...thS, width: 50, textAlign: "center" }}>#</th>
                <th style={thS}>ชื่อ{tabLabel}</th>
                <th style={{ ...thS, width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 32, textAlign: "center", color: C.muted }}>ยังไม่มี{tabLabel}</td></tr>
              ) : visible.map((it, i) => (
                <tr key={it.row} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdS, textAlign: "center", color: C.muted, fontSize: 12 }}>{i + 1}</td>
                  <td style={{ ...tdS, fontWeight: 500 }}>{it.value}</td>
                  <td style={{ ...tdS, display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    {!locked && <>
                      <button onClick={() => setForm({ mode: "edit", row: it.row, value: it.value })}
                        style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#E0E7FF", color: "#3730A3", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>แก้ไข</button>
                      <button onClick={() => setDeleteTarget(it)}
                        style={{ padding: "3px 10px", fontSize: 12, border: "none", borderRadius: 4, background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontFamily: "Prompt, sans-serif" }}>ลบ</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`ลบ "${deleteTarget.value}" ออกจากรายการ${tabLabel}ใช่ไหม?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading} enterConfirm />
      )}
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

export { SettingsPage, OtherPage, PlaceholderPage, CustomerPage, ProductPage };
