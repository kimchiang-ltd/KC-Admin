// ============================================================
// QT Module — ใบเสนอราคา (Quotation)
// ============================================================
// Phase 3 (#206) — extracted from KCFactory.jsx v1.4.162 (2026-06-26)
// QuotationPage: list + form view, calls api.{listQuotations, loadQuotation, generateQuotationPDF, getConfig}
// QuotationPreview: live A4 PDF preview rendered in browser
// Cache key: "qtList" — managed via cache + updateCache props

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { FileSearch, ChevronLeft, FileText, QrCode, Smartphone, Loader } from "lucide-react";
import { api } from '../../shared/api.jsx';
import { C, PAGE_SIZE } from '../../shared/constants.jsx';
import { Btn, Paginator, INSTR_STEPS, renderPhoneScreen } from '../../shared/ui.jsx';
import { toDownloadUrl } from '../../shared/utils.jsx';
import { ProductAutocomplete } from '../../shared/autocomplete.jsx';

// ── #141 QuotationPage ─────────────────────────────────────
function QuotationPage({ products, sizes, onViewChange, cache, updateCache }) {
  const UNITS    = ["ชิ้น", "โหล", "กล่อง", "อัน", "แพ็ค", "ถุง"];
  const MAX_ROWS = 15;
  const emptyItem = () => ({ desc: "", desc2: "", price: "", unit: "ชิ้น" });
  const rowRefs  = useRef([]);

  const [view,       setView_]      = useState("list");
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };

  const QT_CACHE = "qtList";
  const [histLoad,   setHistLoad]   = useState(false);
  const [search,     setSearch]     = useState("");
  const history = cache?.[QT_CACHE] || [];

  const [date,       setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [to,         setTo]         = useState("");
  const [subject,    setSubject]    = useState("");
  const [items,      setItems]      = useState(() => Array.from({ length: MAX_ROWS }, emptyItem));
  const [remarks,    setRemarks]    = useState("");
  const [signerName, setSignerName] = useState("");
  const [editRowId,  setEditRowId]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [pdfUrl,     setPdfUrl]     = useState(null);
  const [error,      setError]      = useState("");
  const [company,    setCompany]    = useState(null);
  const [successUrl, setSuccessUrl] = useState(null); // triggers success dialog
  const [alertMsg,   setAlertMsg]   = useState("");   // validation/error alert
  const [page,       setPage]       = useState(1);
  useEffect(() => setPage(1), [search]);
  const [showQr, setShowQr]         = useState(false);
  const [qrLoading, setQrLoading]   = useState(false);
  const [qrUrl, setQrUrl]           = useState("");
  const [qrDataUrl, setQrDataUrl]   = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [instrStep, setInstrStep]   = useState(0);
  const [editLoading, setEditLoading] = useState(false);
  useEffect(() => {
    if (!showInstructions) { setInstrStep(0); return; }
    const iv = setInterval(() => setInstrStep(s => (s + 1) % INSTR_STEPS.length), 2500);
    return () => clearInterval(iv);
  }, [showInstructions]);

  const handleQrQT = async () => {
    if (!pdfUrl) return;
    const dlUrl = toDownloadUrl(pdfUrl);
    const dataUrl = await QRCode.toDataURL(dlUrl, { width: 280, margin: 2 });
    setQrUrl(dlUrl); setQrDataUrl(dataUrl); setShowQr(true); setShowInstructions(true);
  };

  const updateItem = (idx, field, val) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));

  const loadHistory = async () => {
    setHistLoad(true);
    try { const res = await api.listQuotations(); updateCache?.(QT_CACHE, res.rows || []); } catch (_) {}
    setHistLoad(false);
  };

  useEffect(() => { if (!cache?.[QT_CACHE]) loadHistory(); }, []);

  const openCreate = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setTo(""); setSubject("");
    setItems(Array.from({ length: MAX_ROWS }, emptyItem));
    setRemarks(""); setSignerName("");
    setEditRowId(null); setPdfUrl(null); setError("");
    setView("form", "สร้างใหม่");
    if (!company) api.getConfig().then(cfg => setCompany(cfg.company || {})).catch(() => {});
  };

  const openEdit = async (id) => {
    setEditLoading(true);
    try {
      const res = await api.loadQuotation(id);
      setDate(res.date || new Date().toISOString().slice(0, 10));
      setTo(res.to || ""); setSubject(res.subject || "");
      const loaded = res.items || [];
      setItems(Array.from({ length: MAX_ROWS }, (_, i) => loaded[i]
        ? { desc: loaded[i].name || "", desc2: "", price: loaded[i].price || "", unit: loaded[i].unit || "ชิ้น" }
        : emptyItem()));
      setRemarks(res.remarks || ""); setSignerName(res.signerName || "");
      setEditRowId(res.rowId); setPdfUrl(res.pdfUrl || null); setError("");
      setView("form", qtNo(id));
      if (!company) api.getConfig().then(cfg => setCompany(cfg.company || {})).catch(() => {});
    } catch (err) { alert(err.message); }
    setEditLoading(false);
  };

  const handleGenerate = async () => {
    if (!to.trim())      { setAlertMsg("กรุณากรอกชื่อผู้รับ (เรียน)"); return; }
    if (!subject.trim()) { setAlertMsg("กรุณากรอกเรื่อง"); return; }
    const filledItems = items
      .filter(it => it.desc || it.price)
      .map(it => ({ name: [it.desc, it.desc2].filter(Boolean).join(" "), price: it.price, unit: it.unit }));
    if (!filledItems.length) { setAlertMsg("กรุณากรอกรายการสินค้าอย่างน้อย 1 รายการ"); return; }
    setLoading(true); setPdfUrl(null); setError("");
    try {
      const res = await api.generateQuotationPDF({ date, to, subject, items: filledItems, remarks, signerName, rowId: editRowId });
      setPdfUrl(res.url); setEditRowId(res.rowId);
      updateCache?.(QT_CACHE, null); loadHistory();
      setSuccessUrl(res.url);
    } catch (err) { setAlertMsg("เกิดข้อผิดพลาด: " + err.message); setError(err.message); }
    finally { setLoading(false); }
  };

  const labelS = { fontSize: 11, color: C.muted, marginBottom: 3 };
  const cellS  = { border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 8px", fontSize: 13, width: "100%", boxSizing: "border-box", background: "white", fontFamily: "inherit" };

  const qtNo = id => `QT-${String(id).padStart(6, "0")}`;
  const fmtHistDate = d => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
  };
  const q = search.trim().toLowerCase();
  const filtered = q
    ? history.filter(h => h.to?.toLowerCase().includes(q) || h.subject?.toLowerCase().includes(q) || qtNo(h.id).toLowerCase().includes(q))
    : history;
  const pagedQT = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── LIST VIEW ──────────────────────────────────────────────
  if (view === "list") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}><FileSearch size={15}/> ใบเสนอราคา</div>
        <Btn primary onClick={openCreate}>+ สร้างใบเสนอราคาใหม่</Btn>
      </div>
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", position: "relative" }}>
        {editLoading && <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 5, height: 2, background: C.accent, animation: "qtLoadBar 1.2s ease-in-out infinite" }}><style>{`@keyframes qtLoadBar{0%{width:0;margin-left:0}50%{width:60%}100%{width:0;margin-left:100%}}`}</style></div>}
        <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาลูกค้า / เลขที่..."
            style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 200, height: 30, fontFamily: "inherit", boxSizing: "border-box" }} />
          {histLoad && <Loader size={14}/>}
          <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>
            {histLoad ? "กำลังโหลด..." : `พบ ${filtered.length} รายการ`}
          </span>
        </div>
        {!histLoad && history.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>
            ยังไม่มีรายการ — กด "สร้างใบเสนอราคาใหม่" เพื่อเริ่มต้น
          </div>
        )}
        {!histLoad && history.length > 0 && (
          <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["เลขที่ใบเสนอราคา", "วันที่", "เรียน", "เรื่อง", ""].map((h, i) => (
                  <th key={i} style={{ padding: "8px 14px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedQT.map(h => (
                <tr key={h.id} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "9px 14px" }}>
                    <span onClick={() => { if (!editLoading) openEdit(h.id); }} style={{ color: C.accent, cursor: editLoading ? "wait" : "pointer", fontWeight: 500, opacity: editLoading ? 0.6 : 1 }}>{qtNo(h.id)}</span>
                  </td>
                  <td style={{ padding: "9px 14px", color: C.muted }}>{fmtHistDate(h.date)}</td>
                  <td style={{ padding: "9px 14px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.to}</td>
                  <td style={{ padding: "9px 14px", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.subject}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right" }}>
                    {h.pdfUrl && <a href={h.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.muted, fontSize: 12 }}>PDF</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginator total={filtered.length} page={page} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );

  // ── FORM VIEW (create / edit) ──────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {showQr && qrUrl && (
        <>
          <div onClick={() => { setShowQr(false); setShowInstructions(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200 }} />
          <div style={{ position: "fixed", zIndex: 201, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "white", borderRadius: 14, padding: "24px 24px 20px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxWidth: 300, width: "85vw" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: C.text }}>ส่ง PDF ให้ลูกค้าทาง LINE</div>
            <img src={qrDataUrl} alt="QR" style={{ width: 220, height: 220, display: "block", margin: "0 auto", borderRadius: 8 }} />
            <button onClick={() => setShowInstructions(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, margin: "14px auto 0", background: showInstructions ? C.accent : C.pageBg, border: `1px solid ${showInstructions ? C.accent : C.border}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", color: showInstructions ? "white" : C.accent }}>
              <Smartphone size={13} /> วิธีส่งบนมือถือ
            </button>
            <button onClick={() => { setShowQr(false); setShowInstructions(false); }}
              style={{ display: "block", margin: "10px auto 0", background: C.accent, color: "white", border: "none", borderRadius: 6, padding: "7px 28px", fontSize: 13, cursor: "pointer" }}>ปิด</button>
          </div>
          {showInstructions && (
            <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "33vw", minWidth: 320, background: "white", zIndex: 202, boxShadow: "-4px 0 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
              <style>{`@keyframes kc-pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.9}50%{transform:translate(-50%,-50%) scale(1.6);opacity:1}} @keyframes kc-fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>วิธีส่ง LINE บนมือถือ</span>
                <button onClick={() => setShowInstructions(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.muted, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
                <div style={{ width: 200, height: 370, borderRadius: 30, border: "6px solid #222", background: "#222", position: "relative", boxShadow: "0 8px 36px rgba(0,0,0,0.35)", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 42, height: 4, background: "#444", borderRadius: 2 }} />
                  <div style={{ position: "absolute", top: 11, right: 22, width: 6, height: 6, background: "#444", borderRadius: "50%", border: "1px solid #555" }} />
                  <div style={{ position: "absolute", top: 26, left: 5, right: 5, bottom: 34, borderRadius: 14, overflow: "hidden", background: "white" }}>
                    {renderPhoneScreen(instrStep)}
                    <div style={{ position: "absolute", left: INSTR_STEPS[instrStep].cx + "%", top: INSTR_STEPS[instrStep].cy + "%", width: 16, height: 16, borderRadius: "50%", background: "rgba(0,180,80,0.9)", border: "2px solid white", boxShadow: "0 1px 6px rgba(0,0,0,0.4)", animation: "kc-pulse 0.75s ease-in-out infinite", transition: "left 0.55s cubic-bezier(.4,0,.2,1), top 0.55s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                  <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                    {["▐▌", "○", "◁"].map((s, i) => <span key={i} style={{ fontSize: 10, color: "#777" }}>{s}</span>)}
                  </div>
                </div>
                <div key={instrStep} style={{ marginTop: 22, textAlign: "center", animation: "kc-fadein 0.3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ background: C.accent, color: "white", borderRadius: 10, fontSize: 11, padding: "2px 8px", flexShrink: 0 }}>{instrStep + 1}/{INSTR_STEPS.length}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{INSTR_STEPS[instrStep].label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted }}>{INSTR_STEPS[instrStep].sub}</div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                  {INSTR_STEPS.map((_, i) => (
                    <div key={i} onClick={() => setInstrStep(i)}
                      style={{ width: i === instrStep ? 22 : 8, height: 8, borderRadius: 4, background: i === instrStep ? C.accent : "#ddd", transition: "all 0.3s", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Top nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, position: "sticky", top: 0, zIndex: 10, background: "white" }}>
        <button onClick={() => setView("list", null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, padding: 0, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> รายการใบเสนอราคา</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{editRowId ? `แก้ไข ${qtNo(editRowId)}` : "สร้างใบเสนอราคาใหม่"}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {error && <span style={{ color: C.danger, fontSize: 12 }}>{error}</span>}
          {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent }}><FileText size={12} style={{ verticalAlign: "middle", marginRight: 3 }}/> เปิด PDF</a>}
          {pdfUrl && <Btn onClick={handleQrQT}><QrCode size={14}/> QR</Btn>}
          <Btn onClick={() => setView("list", null)}>ยกเลิก</Btn>
          <Btn primary onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader size={12} style={{ animation: "spin 1s linear infinite", marginRight: 5 }} />กำลังสร้าง...</> : editRowId ? "อัพเดท PDF" : "สร้าง PDF"}
          </Btn>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Form panel */}
        <div style={{ width: 500, flexShrink: 0, padding: "16px 24px", overflowY: "auto", borderRight: `1px solid ${C.border}` }}>
          <div style={{ marginBottom: 10 }}>
            <div style={labelS}>วันที่</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={cellS} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={labelS}>เรียน</div>
            <input value={to} onChange={e => setTo(e.target.value)} style={cellS} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={labelS}>เรื่อง</div>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={cellS} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>รายการสินค้า</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 10 }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
                <th style={{ width: 18, padding: "3px 2px", color: C.muted, fontWeight: 500, fontSize: 10 }}>#</th>
                <th style={{ padding: "3px 4px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 10 }}>สินค้า</th>
                <th style={{ width: 62, padding: "3px 4px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 10 }}>ขนาด</th>
                <th style={{ width: 68, padding: "3px 4px", textAlign: "right", color: C.muted, fontWeight: 500, fontSize: 10 }}>ราคา/หน่วย</th>
                <th style={{ width: 60, padding: "3px 4px", textAlign: "center", color: C.muted, fontWeight: 500, fontSize: 10 }}>หน่วย</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: "2px 2px", textAlign: "center", color: C.muted, fontSize: 10 }}>{i+1}</td>
                  <td style={{ padding: "2px 2px" }}>
                    <div ref={el => rowRefs.current[i] = el}>
                      <ProductAutocomplete
                        value={it.desc}
                        onChange={v => updateItem(i, "desc", v)}
                        products={products}
                        onEnter={() => { const next = rowRefs.current[i+1]?.querySelector("input"); if (next) next.focus(); }}
                        style={{ fontSize: 12, padding: "3px 2px" }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: "2px 2px" }}>
                    <select value={it.desc2} onChange={e => updateItem(i, "desc2", e.target.value)}
                      style={{ width: "100%", border: "none", background: "transparent", outline: "none", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "3px 2px" }}>
                      <option value="">—</option>
                      {(sizes || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "2px 4px" }}>
                    <input type="number" min="0" step="0.01" value={it.price}
                      onChange={e => updateItem(i, "price", e.target.value)}
                      style={{ width: "100%", border: "none", padding: "3px 0", background: "transparent", outline: "none", fontSize: 12, textAlign: "right", fontFamily: "inherit" }} />
                  </td>
                  <td style={{ padding: "2px 2px" }}>
                    <select value={it.unit} onChange={e => updateItem(i, "unit", e.target.value)}
                      style={{ width: "100%", border: "none", background: "transparent", outline: "none", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginBottom: 10 }}>
            <div style={labelS}>หมายเหตุ / เงื่อนไข</div>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
              style={{ ...cellS, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div>
            <div style={labelS}>ชื่อผู้เสนอราคา</div>
            <input value={signerName} onChange={e => setSignerName(e.target.value)} style={cellS} />
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ flex: 1, background: "#d8d8d8", overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 10, color: "#888" }}>ตัวอย่าง (approximate)</div>
          <QuotationPreview date={date} to={to} subject={subject} items={items} remarks={remarks} signerName={signerName} company={company} />
        </div>
      </div>

      {/* Alert dialog (validation / API errors) */}
      {alertMsg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "white", borderRadius: 10, padding: "24px 28px", minWidth: 260, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: C.text, marginBottom: 20 }}>{alertMsg}</div>
            <button onClick={() => setAlertMsg("")}
              style={{ padding: "7px 28px", borderRadius: 6, border: "none", background: C.accent, color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Success dialog */}
      {successUrl && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "white", borderRadius: 10, padding: "28px 32px", minWidth: 280, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{editRowId ? "อัพเดท PDF สำเร็จแล้ว" : "สร้าง PDF สำเร็จแล้ว"}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 22 }}>ต้องการเปิด PDF หรือกลับไปรายการ?</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => { setSuccessUrl(null); setView("list", null); }}
                style={{ padding: "8px 20px", borderRadius: 6, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", fontSize: 13, color: C.text }}>
                กลับรายการ
              </button>
              <button onClick={() => { window.open(successUrl, "_blank"); setSuccessUrl(null); setView("list", null); }}
                style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: C.accent, cursor: "pointer", fontSize: 13, color: "white", fontWeight: 500 }}>
                <FileText size={12} style={{ verticalAlign: "middle", marginRight: 3 }}/> เปิด PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── QuotationPreview — live PDF preview (browser-rendered) ──
function QuotationPreview({ date, to, subject, items, remarks, signerName, company }) {
  const co        = company || {};
  const coName    = co.name    || "หจก. โรงงานกิมเชียง";
  const coNameEN  = co.nameEN  || "KIMCHIANG LIMITED PARTNERSHIP";
  const coAddress = co.address || "";
  const coTel     = co.tel     || "";
  const am        = coAddress.match(/^(.*?)\s*(จังหวัด.*)/);
  const addrLine1 = am ? am[1].trim() : coAddress.trim();
  const addrLine2 = am ? am[2].trim() : "";

  const MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const fmtDate = d => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    if (!y || !m || !day) return d;
    return `${parseInt(day)} ${MONTHS[parseInt(m)-1]} ${parseInt(y)+543}`;
  };
  const fmtPrice = n => {
    const v = parseFloat(n);
    if (isNaN(v) || !String(n).trim()) return "";
    return v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filled = items
    .filter(it => it.desc || it.name || it.price)
    .map(it => ({ ...it, _display: it.desc !== undefined ? [it.desc, it.desc2].filter(Boolean).join(" ") : (it.name || "") }));
  const scale  = 0.85;
  const A4W    = 794;
  const A4H    = 1123;
  const px     = mm => Math.round(mm * 3.7795);

  return (
    <div style={{ width: A4W * scale, height: A4H * scale, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.25)", flexShrink: 0 }}>
      <div style={{ width: A4W, height: A4H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div style={{ width: A4W, minHeight: A4H, boxSizing: "border-box", padding: `${px(12)}px ${px(14)}px ${px(9)}px`, background: "white", fontFamily: "sans-serif", fontSize: px(3.5), color: "#111" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: px(1) }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: px(2.5) }}>
              <div style={{ background: "#111", color: "white", fontSize: px(5.5), fontWeight: 700, width: px(10), height: px(10), display: "flex", alignItems: "center", justifyContent: "center", borderRadius: px(1.5), flexShrink: 0 }}>KC</div>
              <div>
                <div style={{ fontSize: px(4), fontWeight: 600 }}>{coName}</div>
                <div style={{ fontSize: px(3), fontWeight: 500, marginTop: px(0.3) }}>{coNameEN}</div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: px(5), fontSize: px(2.8), color: "#6b6b6b" }}>
              {addrLine1 && <div>{addrLine1}</div>}
              {addrLine2 && <div>{addrLine2}</div>}
              {coTel && <div>Tel/Fax : {coTel}</div>}
            </div>
          </div>

          {/* Doc title */}
          <div style={{ fontSize: px(6), fontWeight: 600, color: "#111", marginBottom: px(4) }}>ใบเสนอราคา</div>

          {/* Info band */}
          <div style={{ marginBottom: px(4), fontSize: px(3.5), background: "#fafafa", borderRadius: px(2), padding: `${px(3)}px ${px(2.5)}px`, height: px(22), overflow: "hidden", display: "grid", gridTemplateColumns: "auto 1fr", gap: `${px(1)}px ${px(2)}px`, alignContent: "start" }}>
            <span style={{ color: "#999", fontWeight: 500, whiteSpace: "nowrap" }}>วันที่</span><span style={{ color: "#111" }}>{fmtDate(date)}</span>
            <span style={{ color: "#999", fontWeight: 500, whiteSpace: "nowrap" }}>เรียน</span><span style={{ color: "#111", fontWeight: 500 }}>{to}</span>
            <span style={{ color: "#999", fontWeight: 500, whiteSpace: "nowrap" }}>เรื่อง</span><span style={{ color: "#111", fontWeight: 500 }}>{subject}</span>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `${px(0.5)}px solid #111` }}>
                <th style={{ fontSize: px(3.3), fontWeight: 600, padding: `${px(1.5)}px ${px(2)}px`, color: "#666", textAlign: "center", width: px(8) }}>#</th>
                <th style={{ fontSize: px(3.3), fontWeight: 600, padding: `${px(1.5)}px ${px(2)}px`, color: "#666", textAlign: "left" }}>รายการสินค้า</th>
                <th style={{ fontSize: px(3.3), fontWeight: 600, padding: `${px(1.5)}px ${px(2)}px`, color: "#666", textAlign: "right", width: px(24) }}>ราคา/หน่วย</th>
                <th style={{ fontSize: px(3.3), fontWeight: 600, padding: `${px(1.5)}px ${px(2)}px`, color: "#666", textAlign: "center", width: px(16) }}>หน่วย</th>
              </tr>
            </thead>
            <tbody>
              {filled.map((it, i) => (
                <tr key={i}>
                  <td style={{ fontSize: px(2.9), color: "#bbb", padding: `${px(1.4)}px ${px(2)}px`, borderBottom: `0.7px solid #e0e0e0`, textAlign: "center" }}>{i+1}</td>
                  <td style={{ fontSize: px(3.5), padding: `${px(1.4)}px ${px(2)}px`, borderBottom: "0.7px solid #e0e0e0" }}>{it._display}</td>
                  <td style={{ fontSize: px(3.5), padding: `${px(1.4)}px ${px(2)}px`, borderBottom: "0.7px solid #e0e0e0", textAlign: "right" }}>{fmtPrice(it.price)}</td>
                  <td style={{ fontSize: px(3.5), padding: `${px(1.4)}px ${px(2)}px`, borderBottom: "0.7px solid #e0e0e0", textAlign: "center" }}>{it.unit}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 15 - filled.length) }).map((_, i) => (
                <tr key={"e"+i} style={{ height: px(6) }}>
                  <td style={{ padding: `${px(1.4)}px ${px(2)}px` }}>&nbsp;</td>
                  <td /><td /><td />
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: "1.1px solid #ccc" }} />
          <div style={{ fontSize: px(3.3), color: "#888", marginTop: px(2), marginBottom: px(6) }}>* ราคานี้ยังไม่รวมภาษีมูลค่าเพิ่ม (VAT 7%)</div>
          <div style={{ fontSize: px(3.3), fontWeight: 600, color: "#555", letterSpacing: 1, marginBottom: px(1.5) }}>หมายเหตุ / เงื่อนไข</div>
          <div style={{ background: "#fafafa", borderRadius: px(2), padding: `${px(2.5)}px ${px(3)}px`, fontSize: px(3.5), minHeight: px(24), whiteSpace: "pre-wrap" }}>{remarks || ""}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: px(4) }}>
            <div style={{ textAlign: "center", width: px(58.5) }}>
              <div style={{ marginTop: px(8), borderTop: "0.75px solid #888", paddingTop: px(1.5) }}>
                {signerName && <div style={{ fontSize: px(3.5), color: "#111", marginBottom: px(0.5) }}>{signerName}</div>}
                <div style={{ fontSize: px(3.3), color: "#888" }}>ผู้เสนอราคา</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export { QuotationPage, QuotationPreview };