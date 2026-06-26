// ============================================================
// Settings Module — ระบบ (Settings, Customer, Product, OtherPage hub)
// ============================================================
// Phase 4 (#207) — extracted from KCFactory.jsx v1.4.163 (2026-06-26)
// SettingsPage: hub for ข้อมูลบริษัท / Google Drive folders / สินค้า / ลูกค้า
// OtherPage: hub that drills into ใบเสนอราคา (QT)
// CustomerPage: customer CRUD; ProductPage: product CRUD; EditableList: helper; PlaceholderPage: "coming soon" placeholder

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, Pencil, FileSearch, ChevronLeft, Building, Folder, Package, Users, Lock, Unlock, CheckCircle, Loader, Save } from "lucide-react";
import { api } from '../../shared/api.jsx';
import { C } from '../../shared/constants.jsx';
import { Btn, Spinner, ErrorBox, ConfirmModal, inputStyle } from '../../shared/ui.jsx';
import { findSimilarCustomers } from '../../shared/utils.jsx';
import { QuotationPage } from '../qt/QTPage.jsx';


// ── Settings Components ────────────────────────────────────

function EditableList({ title, icon, items, setItems, placeholder }) {
  const [newVal, setNewVal]   = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  const handleAdd      = () => { if (!newVal.trim()) return; setItems([...items, newVal.trim()]); setNewVal(""); };
  const handleDelete   = (i) => setItems(items.filter((_, idx) => idx !== i));
  const handleEdit     = (i) => { setEditIdx(i); setEditVal(items[i]); };
  const handleSaveEdit = () => { if (!editVal.trim()) return; setItems(items.map((v, i) => i === editIdx ? editVal.trim() : v)); setEditIdx(null); };

  return (
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span style={{ color: C.accent }}>{icon}</span>{title}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={placeholder} onKeyDown={e => e.key === "Enter" && handleAdd()}
          style={{ flex: 1, padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12 }} />
        <Btn primary small onClick={handleAdd}>+ เพิ่ม</Btn>
      </div>
      <div style={{ border: `0.5px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
        {items.length === 0 && <div style={{ padding: 16, textAlign: "center", color: C.muted, fontSize: 12 }}>ยังไม่มีรายการ</div>}
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: i < items.length - 1 ? `0.5px solid ${C.borderLight}` : "none", background: i % 2 === 0 ? "white" : "#fafbff" }}>
            {editIdx === i ? (
              <div style={{ display: "flex", gap: 6, flex: 1, marginRight: 8 }}>
                <input value={editVal} onChange={e => setEditVal(e.target.value)} style={{ flex: 1, padding: "4px 8px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12 }} />
                <Btn primary small onClick={handleSaveEdit}><Check size={13}/></Btn>
                <Btn small onClick={() => setEditIdx(null)}>✕</Btn>
              </div>
            ) : <span style={{ fontSize: 13 }}>{item}</span>}
            {editIdx !== i && (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => handleEdit(i)} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}><Pencil size={13}/></button>
                <button onClick={() => handleDelete(i)} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: C.danger, fontSize: 11 }}>🗑</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: C.muted }}>{items.length} รายการ</div>
    </div>
  );
}

function OtherPage({ products, sizes, cache, updateCache, onViewChange, goListRequest }) {
  const [oView, setOView] = useState("hub"); // hub | quotation

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

  if (oView === "hub") return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>อื่นๆ</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <HubCard icon={<FileSearch size={20}/>} label="ใบเสนอราคา" desc="สร้างและจัดการ QT" bg="#F3E8FF" color="#6B21A8" onClick={() => { setOView("quotation"); if (onViewChange) onViewChange(""); }} />
      </div>
    </div>
  );

  if (oView === "quotation") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setOView("hub"); if (onViewChange) onViewChange(""); }} style={{ fontSize: 12, padding: "4px 10px", border: `0.5px solid ${C.border}`, borderRadius: 5, background: C.pageBg, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={14}/> อื่นๆ
        </button>
        <span style={{ color: C.muted, fontSize: 12 }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>ใบเสนอราคา</span>
      </div>
      <QuotationPage products={products} sizes={sizes} onViewChange={onViewChange} cache={cache} updateCache={updateCache} />
    </div>
  );

  return null;
}

function SettingsPage({ onConfigSaved, cache, updateCache }) {
  const [sView, setSView]       = useState("hub"); // hub | company | folders | products | customers
  const [company, setCompany]   = useState("หจก. โรงงานกิมเชียง");
  const [nameEN,  setNameEN]    = useState("KIMCHIANG LIMITED PARTNERSHIP");
  const [address, setAddress]   = useState("25/9 หมู่ 10 ต.ลอมแม่นาง อ.บางใหญ่ จ.นนทบุรี 11140");
  const [tel, setTel]           = useState("02-191-8698-9");
  const [taxId, setTaxId]       = useState("0103506007938");
  const [folderDN, setFolderDN] = useState("");
  const [folderBN, setFolderBN] = useState("");
  const [folderBNCombined, setFolderBNCombined] = useState("");
  const [folderQT, setFolderQT] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false); // hub loads nothing; only load when entering company/folders
  const [locked, setLocked]     = useState(true);
  const origFolders = useRef({ dn: "", bn: "", bnCombined: "", qt: "" });
  const configFetched = useRef(false);

  const applyConfig = (cfg) => {
    const toUrl = id => id && !id.startsWith("http") ? `https://drive.google.com/drive/folders/${id}` : (id || "");
    if (cfg.company?.name)    setCompany(cfg.company.name);
    if (cfg.company?.nameEN)  setNameEN(cfg.company.nameEN);
    if (cfg.company?.address) setAddress(cfg.company.address);
    if (cfg.company?.tel)     setTel(cfg.company.tel);
    if (cfg.company?.taxId)   setTaxId(cfg.company.taxId);
    const dn = toUrl(cfg.folders?.dn); setFolderDN(dn);
    const bn = toUrl(cfg.folders?.bn); setFolderBN(bn);
    const bnCombined = toUrl(cfg.folders?.bnCombined); setFolderBNCombined(bnCombined);
    const qt = toUrl(cfg.folders?.qt); setFolderQT(qt);
    origFolders.current = { dn, bn, bnCombined, qt };
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

  const handleFolderBlur = async (key, value, label) => {
    if (locked) return;
    if (value === origFolders.current[key]) return;
    if (!window.confirm(`บันทึก Folder URL สำหรับ ${label} ใหม่?`)) return;
    setSaving(true);
    setError("");
    try {
      const newFolders = { dn: folderDN, bn: folderBN, bnCombined: folderBNCombined, qt: folderQT, [key]: value };
      await api.saveConfig({
        company: { name: company, nameEN, address, tel, taxId },
        folders: newFolders,
      });
      origFolders.current = { ...origFolders.current, [key]: value };
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
      });
      if (updateCache) updateCache("settingsConfig", { company: { name: company, nameEN, address, tel, taxId }, folders: { dn: folderDN, bn: folderBN, bnCombined: folderBNCombined, qt: folderQT } });
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
    <div onClick={onClick} style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "20px 16px", cursor: "pointer", textAlign: "center" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 20, color }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{label}</div>
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
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>⚙ ระบบ</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <HubCard icon={<Building size={20}/>} label="ข้อมูลบริษัท" desc="ชื่อ ที่อยู่ เลขภาษี" bg="#E6F1FB" color="#185FA5" onClick={() => setSView("company")} />
        <HubCard icon={<Folder size={20}/>} label="Google Drive" desc="folder URLs ทุก doc type" bg="#FAEEDA" color="#854F0B" onClick={() => setSView("folders")} />
        <HubCard icon={<Package size={20}/>} label="สินค้า" desc="จัดการรายการสินค้า / ขนาด" bg="#EAF3DE" color="#3B6D11" onClick={() => setSView("products")} />
        <HubCard icon={<Users size={20}/>} label="ลูกค้า" desc="รายชื่อและข้อมูลลูกค้า" bg="#EEEDFE" color="#534AB7" onClick={() => setSView("customers")} />
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
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบส่งของ (DN)</div><input value={folderDN} onChange={e => setFolderDN(e.target.value)} onBlur={e => handleFolderBlur("dn", e.target.value, "DN")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบวางบิล (BN)</div><input value={folderBN} onChange={e => setFolderBN(e.target.value)} onBlur={e => handleFolderBlur("bn", e.target.value, "BN")} disabled={locked} placeholder="https://drive.google.com/drive/folders/..." style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>BN รวมพิมพ์ <span style={{ color: C.muted, opacity: 0.7 }}>— เว้นว่าง = subfolder อัตโนมัติ</span></div><input value={folderBNCombined} onChange={e => setFolderBNCombined(e.target.value)} onBlur={e => handleFolderBlur("bnCombined", e.target.value, "BN Combined")} disabled={locked} placeholder="(เว้นว่างได้)" style={monoS} /></div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ใบเสนอราคา (QT) <span style={{ color: C.muted, opacity: 0.7 }}>— เว้นว่าง = My Drive root</span></div><input value={folderQT} onChange={e => setFolderQT(e.target.value)} onBlur={e => handleFolderBlur("qt", e.target.value, "QT")} disabled={locked} placeholder="(เว้นว่างได้)" style={monoS} /></div>
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0f4ff", borderRadius: 6, fontSize: 11, color: C.muted }}>
          💡 วาง URL จาก Google Drive ได้เลย — ระบบจะดึง Folder ID ให้อัตโนมัติ
        </div>
      </div>
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
  const formRef             = useRef(null);
  const similarConfirmedRef = useRef(false);

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
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setListLoading(false); }
  }, []);

  useEffect(() => { load(""); }, []);

  const EMPTY = { name: "", address: "", phone: "", taxId: "", note: "" };

  const doSave = async () => {
    setSimilarWarning(null);
    setSaving(true);
    try {
      if (form.mode === "add") { await api.createCustomer(form.data); }
      else { await api.updateCustomer(form.originalName, form.data); }
      setForm(null);
      await load(search);
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.data.name.trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; }
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
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const fldStyle = { ...inputStyle, width: "100%", height: 30, fontSize: 13 };
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
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
                <th style={thS}>หมายเหตุ</th>
                <th style={{ ...thS, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.muted }}>
                  {search ? `ไม่พบลูกค้าที่ตรงกับ "${search}"` : "ยังไม่มีข้อมูลลูกค้า"}
                </td></tr>
              ) : customers.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdS, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ ...tdS, color: C.muted }}>{c.address}</td>
                  <td style={tdS}>{c.phone}</td>
                  <td style={{ ...tdS, fontFamily: "monospace", fontSize: 12 }}>{c.taxId}</td>
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
  const formRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getProducts();
      setItems(result);
      updateCache?.("productList", result);
    }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (cache?.["productList"]) { setItems(cache["productList"]); setLoading(false); }
    else { load(); }
  }, []);
  useEffect(() => { if (form && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [form]);

  const visible = items.filter(it => it.type === tab);

  const handleSave = async () => {
    if (!form.value.trim()) { alert("กรุณากรอกชื่อ"); return; }
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
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
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
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setDeleteLoading(false); }
  };

  const tabLabel = tab === "product" ? "สินค้า" : "ขนาด";
  const thS = { padding: "8px 10px", fontWeight: 500, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdS = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle" };

  return (
    <div>
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

export { SettingsPage, OtherPage, PlaceholderPage, EditableList, CustomerPage, ProductPage };
