// ============================================================
// BN-TI Module — Billing Note for Tax Invoices
// Extracted from InvoiceAdmin.jsx → adapted to KC Admin shared layer
// Uses tiApi (TICode.gs backend), separate from BN-DN (invoice/InvoicePage.jsx)
// ============================================================

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { AlertCircle, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Loader, Pencil, Plus, Printer, QrCode, RefreshCw, Smartphone, Square } from "lucide-react";
import { tiApi, bahtText } from "./tiApi.jsx";
import { C, PAGE_SIZE } from "../../shared/constants.jsx";
import { Btn, Badge, Spinner, ErrorBox, Paginator, ConfirmModal, CustomerFieldSyncModal, inputStyle, INSTR_STEPS, renderPhoneScreen } from "../../shared/ui.jsx";
import { toDownloadUrl } from "../../shared/utils.jsx";
import { DateRangePicker } from "../invoice/InvoicePage.jsx";

const _tiStore = {};

function TIDetailPopup({ tiNo, onClose, cachedData, onCached }) {
  const seed = cachedData || _tiStore[tiNo] || null;
  const [data, setData]       = useState(seed);
  const [loading, setLoading] = useState(!seed);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (seed) return;
    tiApi.getTIDetail(tiNo)
      .then(d => { _tiStore[tiNo] = d; setData(d); onCached?.(tiNo, d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tiNo]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 10, width: 620, maxWidth: "92vw", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `0.5px solid ${C.border}`, position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.accent }}>{tiNo}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 22, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          {loading && <Spinner />}
          {error && <ErrorBox msg={error} />}
          {data && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 14 }}>
                {[["ลูกค้า", data.customer], ["วันที่", data.date], ["โทรศัพท์", data.phone || "—"], ["รวมเงิน", `฿${(data.grandTotal||0).toLocaleString()}`]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
                ))}
              </div>
              {data.address && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>ที่อยู่</div><div style={{ fontSize: 13 }}>{data.address}</div></div>}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.pdfHeader }}>
                    {["#", "รายการ", "ขนาด", "จำนวน", "หน่วยละ", "จำนวนเงิน"].map((h, i) => (
                      <th key={i} style={{ padding: "7px 10px", color: "white", fontWeight: 500, textAlign: i >= 3 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.items||[]).filter(it => it.desc||it.qty||it.amount).map((it, i) => (
                    <tr key={i} style={{ background: i%2===0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}` }}>
                      <td style={{ padding: "7px 10px", color: C.muted, textAlign: "center" }}>{i+1}</td>
                      <td style={{ padding: "7px 10px" }}>{it.desc}</td>
                      <td style={{ padding: "7px 10px", color: C.muted }}>{it.desc2}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right" }}>{it.qty}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.unitPrice||0).toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{Number(it.amount||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `0.5px solid ${C.borderLight}` }}>
                    <td colSpan={5} style={{ padding: "7px 10px", textAlign: "right", color: C.muted }}>ยอดก่อนภาษี</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>฿{(data.subtotal||0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} style={{ padding: "7px 10px", textAlign: "right", color: C.muted }}>ภาษีมูลค่าเพิ่ม 7%</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>฿{(data.vatAmt||0).toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                    <td colSpan={5} style={{ padding: "9px 10px", textAlign: "right", fontWeight: 500 }}>รวมทั้งสิ้น</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: C.accent }}>฿{(data.grandTotal||0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              {data.pdfUrl && (
                <div style={{ marginTop: 14, textAlign: "right" }}>
                  <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: C.accent, border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "5px 12px", textDecoration: "none" }}>
                    เปิด PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BN Edit Form ─────────────────────────────────────────────

function BNEditForm({ detail, onSave, onCancel }) {
  function toInputDate(s) {
    if (!s) return "";
    const p = String(s).split("/");
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : "";
  }
  const [dateInput, setDateInput]   = useState(toInputDate(detail.date));
  const [customer, setCustomer]     = useState(detail.customer || "");
  const [address, setAddress]       = useState(detail.address || "");
  const [phone, setPhone]           = useState(detail.phone   || "");
  const [invoices, setInvoices]     = useState(detail.invoices || []);
  const [unbilled, setUnbilled]     = useState([]);
  const [unbilledLoading, setUBL]   = useState(false);
  const [saving, setSaving]         = useState(false);
  // #214 — per-field on-blur sync (lazy fetch customer record on first blur)
  const [syncDecisions, setSyncDecisions] = useState({});
  const [pendingField, setPendingField]   = useState(null);
  const [custRecord, setCustRecord]       = useState(null);
  const custFetchedRef                    = useRef(false);

  useEffect(() => {
    setUBL(true);
    tiApi.getUnbilledTIsForCustomer(detail.customer || "")
      .then(d => setUnbilled(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setUBL(false));
  }, []);

  useEffect(() => { setSyncDecisions({}); setCustRecord(null); custFetchedRef.current = false; }, [customer]);

  const ensureCustRecord = async () => {
    if (custRecord) return custRecord;
    if (custFetchedRef.current) return null;
    custFetchedRef.current = true;
    try {
      const list = await tiApi.getCustomers(customer);
      const found = (Array.isArray(list) ? list : []).find(c => (c.name||"").trim().toLowerCase() === customer.trim().toLowerCase());
      if (found) setCustRecord(found);
      return found || null;
    } catch { return null; }
  };

  const checkFieldOnBlur = async (field, val) => {
    if (syncDecisions[field] === 'yes') return;
    const record = await ensureCustRecord();
    if (!record) return;
    const cur = (val || "").trim();
    const old = (record[field] || "").trim();
    if (!cur || cur === old) return;
    setPendingField({ field, oldValue: old, newValue: cur });
  };

  const handleFieldConfirm = () => { setSyncDecisions(d => ({ ...d, [pendingField.field]: 'yes' })); setPendingField(null); };
  const handleFieldSkip    = () => { setPendingField(null); };

  const removeTI = (no) => setInvoices(prev => prev.filter(inv => inv.no !== no));
  const addTI    = (ti) => {
    if (invoices.find(inv => inv.no === ti.no)) return;
    setInvoices(prev => [...prev, ti]);
  };
  const available = unbilled.filter(d => !invoices.find(inv => inv.no === d.no));

  const handleSave = async () => {
    setSaving(true);
    try {
      const origNos     = new Set((detail.invoices||[]).map(inv => inv.no));
      const newNos      = new Set(invoices.map(inv => inv.no));
      const addTiNos    = [...newNos].filter(n => !origNos.has(n));
      const removeTiNos = [...origNos].filter(n => !newNos.has(n));
      await tiApi.editBillingNote(detail.bnNo, { date: dateInput, customer, address, phone, addTiNos, removeTiNos });
      // #214 — apply cached "yes" decisions
      const yesFields = Object.keys(syncDecisions).filter(f => syncDecisions[f] === 'yes');
      if (yesFields.length > 0 && custRecord) {
        const update = { ...custRecord };
        const formValues = { address, phone };
        for (const f of yesFields) update[f] = formValues[f];
        tiApi.updateCustomer(customer, update).catch(() => {});
      }
      const displayDate = dateInput ? (() => { const p = dateInput.split("-"); return `${p[2]}/${p[1]}/${p[0]}`; })() : detail.date;
      onSave({ date: displayDate, customer, address, phone, invoices, count: invoices.length, total: invoices.reduce((s, inv) => s + (parseFloat(inv.total)||0), 0) });
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {pendingField && <CustomerFieldSyncModal name={customer} field={pendingField.field} oldValue={pendingField.oldValue} newValue={pendingField.newValue} onConfirm={handleFieldConfirm} onCancel={handleFieldSkip} />}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>วันที่ออกใบวางบิล</label>
            <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>ชื่อลูกค้า</label>
            <input value={customer} onChange={e => setCustomer(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>ที่อยู่</label>
            <input value={address} onChange={e => setAddress(e.target.value)} onBlur={() => checkFieldOnBlur('address', address)} placeholder="—" style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>โทรศัพท์</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => checkFieldOnBlur('phone', phone)} placeholder="—" style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>* เปลี่ยนชื่อลูกค้าจะไม่กระทบบันทึกอื่น ใช้เฉพาะใบนี้</div>
      </div>

      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500 }}>รายการใบกำกับภาษีในใบวางบิลนี้</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["เลขที่ TI", "วันที่", "รวมเงิน", ""].map((h, i) => (
                <th key={i} style={{ padding: "7px 14px", textAlign: i===2 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: C.muted }}>ไม่มีรายการ</td></tr>
            ) : invoices.map((inv, i) => (
              <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                <td style={{ padding: "8px 14px", color: C.accent, fontWeight: 500 }}>{inv.no}</td>
                <td style={{ padding: "8px 14px", color: C.muted }}>{inv.date}</td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(inv.total||0).toLocaleString()}</td>
                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                  <button onClick={() => removeTI(inv.no)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 18, lineHeight: 1 }} title="ลบออก">×</button>
                </td>
              </tr>
            ))}
          </tbody>
          {invoices.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: `0.5px solid ${C.border}`, background: "#f5f9f6" }}>
                <td colSpan={2} style={{ padding: "7px 14px", fontSize: 11, color: C.muted }}>รวม {invoices.length} ฉบับ</td>
                <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>฿{invoices.reduce((s, inv) => s+(parseFloat(inv.total)||0), 0).toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          เพิ่มใบกำกับภาษี (ยังไม่วางบิล) {unbilledLoading && <Loader size={11}/>}
        </div>
        {!unbilledLoading && available.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: C.muted, fontSize: 12 }}>ไม่มีใบกำกับภาษีที่รอวางบิล</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {available.map((ti, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "8px 14px", color: C.accent, fontWeight: 500 }}>{ti.no}</td>
                  <td style={{ padding: "8px 14px", color: C.muted }}>{ti.date}</td>
                  <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(ti.total||0).toLocaleString()}</td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }}>
                    <Btn small onClick={() => addTI(ti)}><Plus size={11}/> เพิ่ม</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn onClick={onCancel} disabled={saving}>ยกเลิก</Btn>
        <Btn primary onClick={handleSave} disabled={saving}>{saving ? <><Loader size={13}/> กำลังบันทึก...</> : "บันทึก"}</Btn>
      </div>
    </div>
  );
}

// ── BN Detail View ───────────────────────────────────────────

function BNDetailView({ bnNo, onBack, onSaved, cachedDetail, onDetailCached }) {
  const [detail, setDetail]               = useState(cachedDetail || null);
  const [loading, setLoading]             = useState(!cachedDetail);
  const [error, setError]                 = useState("");
  const [editing, setEditing]             = useState(false);
  const [showCancelConfirm, setShowCC]    = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [lsLoading, setLsLoading]         = useState(false);
  const [ptLoading, setPtLoading]         = useState(false);
  const [tiPopup, setTiPopup]             = useState(null);
  const [tiCache, setTiCache]             = useState({});
  const [hovered, setHovered]             = useState(null);
  const [showQr, setShowQr]               = useState(false);
  const [qrLoading, setQrLoading]         = useState(false);
  const [qrUrl, setQrUrl]                 = useState("");
  const [qrDataUrl, setQrDataUrl]         = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [instrStep, setInstrStep]         = useState(0);
  useEffect(() => {
    if (!showInstructions) { setInstrStep(0); return; }
    const iv = setInterval(() => setInstrStep(s => (s + 1) % INSTR_STEPS.length), 2500);
    return () => clearInterval(iv);
  }, [showInstructions]);

  const loadDetail = () => {
    if (cachedDetail) return;
    setLoading(true); setError("");
    tiApi.getBillingNoteDetail(bnNo)
      .then(d => { setDetail(d); onDetailCached?.(bnNo, d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadDetail, [bnNo]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try { await tiApi.cancelBillingNote(bnNo); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); setShowCC(false); }
  };

  const handleSaveEdit = (updated) => {
    setDetail(prev => ({ ...prev, ...updated, landscapeUrl: "", pdfUrl: "" }));
    setEditing(false);
    onSaved?.();
  };

  const generateLandscape = async () => {
    if (detail.landscapeUrl) { window.open(detail.landscapeUrl, "_blank", "noopener,noreferrer"); return; }
    setLsLoading(true);
    try {
      const res = await tiApi.generateBillingNoteLandscapePDF(bnNo);
      if (res?.url) { setDetail(d => ({ ...d, landscapeUrl: res.url })); window.open(res.url, "_blank", "noopener,noreferrer"); }
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLsLoading(false); }
  };

  const generatePortrait = async () => {
    if (detail.pdfUrl) { window.open(detail.pdfUrl, "_blank", "noopener,noreferrer"); return; }
    setPtLoading(true);
    try {
      const res = await tiApi.generateBillingNotePortraitPDF(bnNo);
      if (res?.url) { setDetail(d => ({ ...d, pdfUrl: res.url })); window.open(res.url, "_blank", "noopener,noreferrer"); }
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setPtLoading(false); }
  };

  const handleQrBN = async () => {
    const generate = async (pdfUrl) => {
      const dlUrl = toDownloadUrl(pdfUrl);
      const dataUrl = await QRCode.toDataURL(dlUrl, { width: 280, margin: 2 });
      setQrUrl(dlUrl); setQrDataUrl(dataUrl); setShowQr(true); setShowInstructions(true);
    };
    if (detail?.pdfUrl) { await generate(detail.pdfUrl); return; }
    setQrLoading(true);
    try {
      const res = await tiApi.generateBillingNotePortraitPDF(bnNo);
      if (res?.url) { setDetail(d => ({ ...d, pdfUrl: res.url })); await generate(res.url); }
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setQrLoading(false); }
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {bnNo}</span>
      </div>
      <BNEditForm detail={detail} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
    </div>
  );

  return (
    <div>
      {showCancelConfirm && <ConfirmModal message={`ยืนยันยกเลิกใบวางบิล ${bnNo}?`} confirmLabel="ยืนยันยกเลิก" onConfirm={handleCancel} onCancel={() => setShowCC(false)} loading={cancelLoading} enterConfirm />}
      {tiPopup && <TIDetailPopup tiNo={tiPopup} onClose={() => setTiPopup(null)} cachedData={tiCache[tiPopup]} onCached={(no, d) => setTiCache(prev => ({ ...prev, [no]: d }))} />}
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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> รายการ</button>
          <span style={{ color: C.muted }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{bnNo}</span>
          {detail && <Badge type={detail.cancelled ? "warning" : "success"}>{detail.cancelled ? "ยกเลิก" : "ปกติ"}</Badge>}
        </div>
        {detail && !detail.cancelled && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn onClick={generateLandscape} disabled={lsLoading}>{lsLoading ? <Loader size={13}/> : <Printer size={14}/>} แบบพิมพ์</Btn>
            <Btn onClick={generatePortrait} disabled={ptLoading}>{ptLoading ? <Loader size={13}/> : null} PDF</Btn>
            <Btn onClick={handleQrBN} disabled={qrLoading}>{qrLoading ? <Loader size={13}/> : <QrCode size={14}/>} QR</Btn>
            <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
            <Btn danger onClick={() => setShowCC(true)} disabled={cancelLoading}>ยกเลิกใบนี้</Btn>
          </div>
        )}
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox msg={error} />}

      {detail && (
        <div>
          {detail.cancelled && (
            <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>ใบนี้ถูกยกเลิกแล้ว</div>
          )}
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: detail.address ? 12 : 0 }}>
                {[["เลขที่", detail.bnNo], ["วันที่", detail.date||"—"], ["ชื่อลูกค้า", detail.customer||"—"], ["โทรศัพท์", detail.phone||"—"]].map(([l,v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
                ))}
              </div>
              {detail.address && (
                <div style={{ borderTop: `0.5px solid ${C.borderLight}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div>
                  <div style={{ fontSize: 13 }}>{detail.address}</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 20, padding: "10px 16px", background: "#f5f9f6", borderTop: `0.5px solid ${C.borderLight}`, alignItems: "center" }}>
              <div><span style={{ fontSize: 11, color: C.muted }}>รวมเงิน </span><span style={{ fontWeight: 600, fontSize: 15, color: C.accent }}>฿{(detail.total||0).toLocaleString()}</span></div>
              <div style={{ fontSize: 11, color: C.muted }}>{detail.count} ฉบับ</div>
            </div>
          </div>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500 }}>รายการใบกำกับภาษี — คลิกเพื่อดูรายละเอียด</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["เลขที่ TI","วันที่","รวมเงิน"].map((h,i) => (
                    <th key={i} style={{ padding: "7px 14px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.invoices||[]).length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: C.muted }}>ไม่พบรายการ</td></tr>
                ) : (detail.invoices||[]).map((inv,i) => (
                  <tr key={i}
                    onClick={() => setTiPopup(inv.no)}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                    style={{ borderBottom: `0.5px solid ${C.borderLight}`, cursor: "pointer", background: hovered===i ? C.rowHover : "white" }}>
                    <td style={{ padding: "8px 14px", color: C.accent, fontWeight: 500 }}>{inv.no}</td>
                    <td style={{ padding: "8px 14px", color: C.muted }}>{inv.date}</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(inv.total||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              {(detail.invoices||[]).length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: `0.5px solid ${C.border}`, background: "#f5f9f6" }}>
                    <td colSpan={2} style={{ padding: "7px 14px", fontSize: 11, color: C.muted }}>รวม {detail.invoices.length} ฉบับ</td>
                    <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>฿{(detail.total||0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BN List View ───────────────────────────────────────────

function BNListView({ bnList, loading, error, onRefresh, onRowClick }) {
  const [search, setSearch]               = useState("");
  const [hovered, setHovered]             = useState(null);
  const [dStart, setDStart]               = useState("");
  const [dEnd, setDEnd]                   = useState("");
  const [cancelOpen, setCancelOpen]       = useState(false);
  const [cancelHovered, setCancelHovered] = useState(null);
  const [page, setPage]                   = useState(1);
  useEffect(() => setPage(1), [search, dStart, dEnd]);

  const parseThai = d => { if (!d) return null; const p = String(d).split("/"); return p.length === 3 ? new Date(+p[2], +p[1]-1, +p[0]) : new Date(d); };

  const applyFilters = (list) => list.filter(bn => {
    const q = search.toLowerCase();
    if (q && !((bn.bnNo || "").toLowerCase().includes(q) || (bn.customer || "").toLowerCase().includes(q))) return false;
    if (dStart || dEnd) {
      const bd = parseThai(bn.date);
      if (bd) {
        if (dStart && bd < new Date(dStart)) return false;
        if (dEnd && bd > new Date(dEnd + "T23:59:59")) return false;
      }
    }
    return true;
  });

  const active    = applyFilters(bnList.filter(bn => !bn.cancelled));
  const cancelled = bnList.filter(bn => bn.cancelled);
  const pagedBN   = active.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const BNRow = ({ bn, i, isHov, setHov }) => (
    <tr onClick={() => onRowClick(bn)} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
      style={{ background: isHov ? C.rowHover : "white", borderBottom: `0.5px solid ${C.borderLight}`, cursor: "pointer" }}>
      <td style={{ padding: "9px 14px", color: C.accent, fontWeight: 500 }}>{bn.bnNo}</td>
      <td style={{ padding: "9px 14px", color: C.muted }}>{bn.date}</td>
      <td style={{ padding: "9px 14px" }}>{bn.customer}</td>
      <td style={{ padding: "9px 14px" }}>{bn.count} ฉบับ</td>
      <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(bn.total || 0).toLocaleString()}</td>
      <td style={{ padding: "9px 14px", textAlign: "center" }}>
        {bn.pdfUrl ? (
          <a href={bn.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, color: C.accent, textDecoration: "none", border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "3px 8px", whiteSpace: "nowrap" }}>
            PDF
          </a>
        ) : <span style={{ fontSize: 11, color: C.muted }}>—</span>}
      </td>
    </tr>
  );

  const thead = (
    <thead>
      <tr>
        {["เลขที่ BN", "วันที่ออก", "ชื่อลูกค้า", "จำนวนบิล", "รวมเงิน", ""].map((h, i) => (
          <th key={i} style={{ padding: "8px 14px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", position: "sticky", top: 88, zIndex: 1 }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
  const plainThead = (
    <thead>
      <tr>
        {["เลขที่ BN", "วันที่ออก", "ชื่อลูกค้า", "จำนวนบิล", "รวมเงิน", ""].map((h, i) => (
          <th key={i} style={{ padding: "8px 14px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div>
      <div style={{ position: "sticky", top: 32, zIndex: 9, background: C.pageBg, paddingBottom: 6 }}>
        <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", background: "#fafafa", border: `0.5px solid ${C.border}`, borderRadius: "8px 8px 0 0", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเลขที่ / ลูกค้า..."
            style={{ ...inputStyle, width: 200, height: 30 }} />
          <DateRangePicker startDate={dStart} endDate={dEnd} onApply={(s, e) => { setDStart(s); setDEnd(e); }} />
          <Btn small onClick={onRefresh}><RefreshCw size={14}/> รีเฟรช</Btn>
          <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {active.length} รายการ</span>
        </div>
      </div>
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: "0 0 8px 8px", overflow: "clip", borderTop: "none" }}>
        {error && <div style={{ padding: 14 }}><ErrorBox msg={error} onRetry={onRefresh} /></div>}
        {loading && <Spinner />}
        {!loading && !error && (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              {thead}
              <tbody>
                {active.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบข้อมูล</td></tr>
                ) : pagedBN.map((bn, i) => (
                  <BNRow key={i} bn={bn} i={i} isHov={hovered === i} setHov={setHovered} />
                ))}
              </tbody>
            </table>
            <Paginator total={active.length} page={page} onChange={setPage} />
          </>
        )}
      </div>
      {!loading && cancelled.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button onClick={() => setCancelOpen(o => !o)}
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
            {cancelOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>} ใบที่ยกเลิก ({cancelled.length})
          </button>
          {cancelOpen && (
            <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "clip", marginTop: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                {plainThead}
                <tbody>
                  {cancelled.map((bn, i) => (
                    <BNRow key={i} bn={bn} i={i} isHov={cancelHovered === i} setHov={setCancelHovered} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── BN Detail Mini Popup ────────────────────────────────────

function BNDetailMiniPopup({ bnNo, onClose, onCancelled }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [confirming, setConf]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    tiApi.getBillingNoteDetail(bnNo)
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bnNo]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await tiApi.cancelBillingNote(bnNo);
      onCancelled(bnNo);
    } catch (e) {
      setError(e.message); setCancelling(false); setConf(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 10, width: 480, maxWidth: "92vw", maxHeight: "80vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `0.5px solid ${C.border}`, position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>{bnNo}</span>
            {data && !data.cancelled && <span style={{ fontSize: 10, background: "#eaf3de", color: "#3b6d11", padding: "1px 6px", borderRadius: 7, fontWeight: 500 }}>ปกติ</span>}
            {data?.cancelled && <span style={{ fontSize: 10, background: "#fdf0ef", color: "#c0392b", padding: "1px 6px", borderRadius: 7, fontWeight: 500 }}>ยกเลิกแล้ว</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 22, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "14px 16px" }}>
          {loading && <Spinner />}
          {error && <ErrorBox msg={error} />}
          {data && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 12 }}>
                {[["ลูกค้า", data.customer], ["วันที่", data.date], ["จำนวน", `${data.count} ฉบับ`], ["รวมเงิน", `฿${(data.total||0).toLocaleString()}`]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 10, color: C.muted, marginBottom: 1 }}>{l}</div><div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div></div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>TI ทั้งหมดในใบนี้</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    {["เลขที่ TI", "วันที่", "รวมเงิน"].map((h, i) => (
                      <th key={i} style={{ padding: "6px 10px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.invoices || []).map((inv, i) => (
                    <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                      <td style={{ padding: "7px 10px", color: C.accent, fontWeight: 500 }}>{inv.no}</td>
                      <td style={{ padding: "7px 10px", color: C.muted }}>{inv.date}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 500 }}>฿{(parseFloat(inv.total)||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.cancelled && !confirming && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Btn danger small onClick={() => setConf(true)}>ยกเลิก BN นี้</Btn>
                </div>
              )}
              {!data.cancelled && confirming && (
                <div style={{ background: "#fdf7f7", border: `0.5px solid ${C.danger}`, borderRadius: 7, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, color: C.danger }}>ยืนยันยกเลิก {bnNo}?</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>{bnNo} จะถูกยกเลิก และ TI ทั้งหมดในใบนี้จะถูกปลดออก — สามารถรวมใน BN ใหม่ได้ทันที</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <Btn small onClick={() => setConf(false)} disabled={cancelling}>ยกเลิก</Btn>
                    <Btn danger small onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? <><Loader size={11}/> กำลังยกเลิก...</> : "ยืนยันยกเลิก BN"}
                    </Btn>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BN Customer Panel ──────────────────────────────────────

function BNCustomerPanel({ cust, nextBnNo, onConfirm }) {
  const today = new Date().toISOString().slice(0, 10);
  const [bnDate, setBnDate]   = useState(today);
  const [confirming, setConf] = useState(false);
  const [error, setError]     = useState("");
  const [rows, setRows]       = useState(
    (cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: !inv.bnNo }))
  );
  const [tiPopup, setTiPopup] = useState(null);
  const [tiCache, setTiCache] = useState({});
  const [bnPopup, setBnPopup] = useState(null);
  const [address, setAddress] = useState(cust.address || "");
  const [phone, setPhone]     = useState(cust.phone || "");

  useEffect(() => {
    setBnDate(today); setError("");
    setRows((cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: !inv.bnNo })));
    setAddress(cust.address || ""); setPhone(cust.phone || "");
  }, [cust.customer]);

  const toggleRow = (idx) => setRows(prev => prev.map(r => r.idx === idx && !r.bnNo ? { ...r, checked: !r.checked } : r));
  const toggleAll = () => {
    const unbilled = rows.filter(r => !r.bnNo);
    const allChecked = unbilled.length > 0 && unbilled.every(r => r.checked);
    setRows(prev => prev.map(r => r.bnNo ? r : { ...r, checked: !allChecked }));
  };

  const selectedRows = rows.filter(r => r.checked);
  const grandTotal   = selectedRows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

  const handleConfirm = async () => {
    if (selectedRows.length === 0) return;
    setConf(true); setError("");
    try {
      const invoices = selectedRows.map(r => ({ no: r.no, date: r.date, total: r.total }));
      const result = await tiApi.confirmBN(cust.customer, nextBnNo, invoices, bnDate, address, phone);
      onConfirm({ bnNo: result.bnNo, pdfUrl: result.pdfUrl, customer: cust.customer, count: selectedRows.length, total: grandTotal, date: bnDate, tiNos: selectedRows.map(r => r.no) });
    } catch (e) {
      setError(e.message); setConf(false);
    }
  };

  return (
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{cust.customer}</span>
        <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{nextBnNo}</span>
      </div>
      {(cust.invoices || []).some(inv => inv.bnNo) && (() => {
        const bnGroups = {};
        (cust.invoices || []).forEach(inv => { if (inv.bnNo) { if (!bnGroups[inv.bnNo]) bnGroups[inv.bnNo] = []; bnGroups[inv.bnNo].push(inv.no); } });
        return (
          <div style={{ background: "#f8faff", borderBottom: `0.5px solid ${C.borderLight}` }}>
            <div style={{ padding: "5px 14px 3px", fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
              BN ที่สร้างแล้วในเดือนนี้
            </div>
            {Object.entries(bnGroups).map(([bNo, tiNos]) => (
              <div key={bNo} style={{ padding: "3px 14px 6px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", borderTop: `0.5px solid ${C.borderLight}` }}>
                <span onClick={() => setBnPopup(bNo)} style={{ fontSize: 11, fontWeight: 500, color: C.accent, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{bNo} →</span>
                <span style={{ fontSize: 10, color: C.muted }}>{tiNos.length} ฉบับ</span>
                {tiNos.map(no => <span key={no} style={{ fontSize: 9, background: "#eaf3de", color: "#3b6d11", padding: "1px 5px", borderRadius: 3 }}>{no}</span>)}
              </div>
            ))}
          </div>
        );
      })()}
      <div style={{ padding: "8px 14px", borderBottom: `0.5px solid ${C.borderLight}`, display: "grid", gridTemplateColumns: "60px 1fr", gap: "6px 10px", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.muted }}>ที่อยู่</span>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%", fontSize: 11 }} />
        <span style={{ fontSize: 11, color: C.muted }}>โทรศัพท์</span>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%", fontSize: 11 }} />
      </div>
      <div style={{ padding: "10px 14px", borderBottom: `0.5px solid ${C.borderLight}` }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่ออกใบวางบิล</div>
        <input type="date" value={bnDate} onChange={e => setBnDate(e.target.value)} style={{ ...inputStyle, width: 190 }} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: "7px 14px", width: 32, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>
              <input type="checkbox" checked={rows.every(r => r.checked)} onChange={toggleAll} />
            </th>
            {["เลขที่ TI", "วันที่", "รวมเงิน"].map((h, i) => (
              <th key={i} style={{ padding: "7px 14px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <React.Fragment key={row.idx}>
              <tr style={{ borderBottom: row.bnNo ? "none" : `0.5px solid ${C.borderLight}`, background: row.bnNo ? "#fafafa" : (row.checked ? "white" : "#fafafa"), opacity: row.bnNo ? 0.5 : (row.checked ? 1 : 0.55) }}>
                <td style={{ padding: "8px 14px", opacity: row.bnNo ? 1 : undefined }}>
                  <input type="checkbox" checked={row.checked} disabled={!!row.bnNo} onChange={() => toggleRow(row.idx)} style={{ cursor: row.bnNo ? "not-allowed" : "pointer" }} />
                </td>
                <td style={{ padding: "8px 14px" }}>
                  <span onClick={() => setTiPopup(row.no)} style={{ color: row.bnNo ? C.muted : C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{row.no}</span>
                </td>
                <td style={{ padding: "8px 14px", color: C.muted }}>{row.date}</td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(parseFloat(row.total)||0).toLocaleString()}</td>
              </tr>
              {row.bnNo && (
                <tr style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <div style={{ background: "#fff8e1", borderTop: `0.5px solid #fac775`, padding: "5px 10px 5px 36px", fontSize: 10, color: "#633806", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <AlertCircle size={11} style={{ color: "#854f0b", flexShrink: 0, marginLeft: -20 }}/>
                      {row.no} อยู่ใน {row.bnNo} แล้ว — ถ้าต้องการรวม TI นี้ ให้
                      <span onClick={() => setBnPopup(row.bnNo)} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>ยกเลิก {row.bnNo} →</span>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: `0.5px solid ${C.border}`, background: "#f5f9f6" }}>
            <td colSpan={3} style={{ padding: "7px 14px", fontSize: 11, color: C.muted }}>รวม {selectedRows.length} ฉบับ</td>
            <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>฿{grandTotal.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      {error && <div style={{ padding: "8px 14px" }}><ErrorBox msg={error} /></div>}
      <div style={{ padding: "10px 14px", display: "flex", justifyContent: "flex-end" }}>
        <Btn primary onClick={handleConfirm} disabled={confirming || selectedRows.length === 0}>
          {confirming ? <><Loader size={13}/> กำลังสร้าง...</> : <><Check size={13}/> ออกใบวางบิล</>}
        </Btn>
      </div>
      {tiPopup && (
        <TIDetailPopup
          tiNo={tiPopup}
          cachedData={tiCache[tiPopup]}
          onCached={(no, d) => setTiCache(prev => ({ ...prev, [no]: d }))}
          onClose={() => setTiPopup(null)}
        />
      )}
      {bnPopup && (
        <BNDetailMiniPopup
          bnNo={bnPopup}
          onClose={() => setBnPopup(null)}
          onCancelled={(cancelledBnNo) => {
            setRows(prev => prev.map(r => r.bnNo === cancelledBnNo ? { ...r, bnNo: "", checked: true } : r));
            setBnPopup(null);
          }}
        />
      )}
    </div>
  );
}

// ── BN Create View ─────────────────────────────────────────

function BNCreateView({ onBack }) {
  const now = new Date();
  const [month, setMonth]             = useState(now.getMonth() + 1);
  const [year, setYear]               = useState(now.getFullYear());
  const [searched, setSearched]       = useState(false);
  const [customers, setCustomers]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [nextBnNo, setNextBnNo]       = useState("26-BN-000001");
  const [printQueue, setPrintQueue]   = useState([]);
  const [printFormat, setPrintFormat] = useState("portrait");
  const [printing, setPrinting]       = useState(false);
  const [tiPopup, setTiPopup]         = useState(null);
  const [tiCacheBN, setTiCacheBN]     = useState({});
  const [monthCache, setMonthCache]   = useState({});
  const [ptLoading, setPtLoading]     = useState(false);

  const goMonth = (dir) => {
    let m = month + dir, y = year;
    if (m < 1)  { m = 12; y = y - 1; }
    if (m > 12) { m = 1;  y = y + 1; }
    setMonth(m); setYear(y); setSelectedIdx(null);
    handleSearch(m, y);
  };

  const handleSearch = async (mArg = month, yArg = year, force = false) => {
    const cacheKey = `${yArg}-${mArg}`;
    if (!force && monthCache[cacheKey]) {
      const c = monthCache[cacheKey];
      setCustomers(c.customers); setPrintQueue(c.printQueue); setNextBnNo(c.nextBnNo);
      setSearched(true); setSelectedIdx(c.customers.length > 0 ? 0 : null);
      setError(""); setLoading(false);
      return;
    }
    setLoading(true); setError(""); setPrintQueue([]);
    const m = String(mArg).padStart(2, "0");
    const days = new Date(yArg, mArg, 0).getDate();
    const startDate = `${yArg}-${m}-01`;
    const endDate   = `${yArg}-${m}-${String(days).padStart(2, "0")}`;
    try {
      const data = await tiApi.searchTaxInvoicesForBilling(startDate, endDate);
      let bnByNo = {}, nextBn = nextBnNo;
      try {
        const hist = await tiApi.getBillingNotes();
        (hist || []).forEach(h => { if (h && h.bnNo && !h.cancelled) bnByNo[h.bnNo] = h; });
        if (hist && hist.length > 0) {
          const parts = hist[0].bnNo.split("-");
          const lastNum = parseInt(parts[parts.length-1], 10) || 0;
          const yy = new Date().getFullYear().toString().slice(-2);
          nextBn = `${yy}-BN-${String(lastNum+1).padStart(6,"0")}`;
          setNextBnNo(nextBn);
        }
      } catch (_) {}
      const mapped = (Array.isArray(data) ? data : []).map(cust => {
        if (cust.generated) {
          const billedInv = (cust.invoices || []).find(inv => inv.bnNo);
          const bnNo = billedInv ? billedInv.bnNo : null;
          const rec  = bnNo ? bnByNo[bnNo] : null;
          return { ...cust, generated: true, createdBnNo: bnNo,
            createdDate:  rec ? rec.date  : null,
            createdCount: rec ? rec.count : (cust.invoices || []).length,
            createdTotal: rec ? rec.total : 0,
            createdPdfUrl: rec ? rec.pdfUrl : null };
        }
        return { ...cust, generated: false, createdBnNo: null, createdPdfUrl: null };
      });
      setCustomers(mapped);
      setSearched(true);
      if (mapped.length > 0) setSelectedIdx(0);
      const queueSeed = mapped.filter(c => c.generated && c.createdBnNo).map(c => {
        const rec = bnByNo[c.createdBnNo];
        return { bnNo: c.createdBnNo, customer: c.customer, count: c.createdCount, total: c.createdTotal,
          pdfUrl: c.createdPdfUrl, date: c.createdDate, printed: rec ? !!rec.printed : false, checked: rec ? !rec.printed : true };
      });
      setPrintQueue(queueSeed);
      setMonthCache(prev => ({ ...prev, [cacheKey]: { customers: mapped, printQueue: queueSeed, nextBnNo: nextBn } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleSearch(); }, []);

  const handleConfirm = (result) => {
    setCustomers(prev => prev.map((c, i) => {
      if (i !== selectedIdx) return c;
      const confirmedSet = new Set(result.tiNos || []);
      const updatedInvoices = (c.invoices || []).map(inv =>
        confirmedSet.has(inv.no) ? { ...inv, bnNo: result.bnNo } : inv
      );
      const allBilled = updatedInvoices.length > 0 && updatedInvoices.every(inv => inv.bnNo);
      return { ...c, generated: allBilled, invoices: updatedInvoices, createdBnNo: result.bnNo, createdPdfUrl: result.pdfUrl, createdCount: result.count, createdTotal: result.total, createdDate: result.date };
    }));
    const parts = result.bnNo.split("-");
    const n = parseInt(parts[parts.length-1], 10) + 1;
    const yy = new Date().getFullYear().toString().slice(-2);
    setNextBnNo(`${yy}-BN-${String(n).padStart(6,"0")}`);
    setPrintQueue(prev => [...prev, { ...result, checked: true }]);
    setMonthCache(prev => { const n = { ...prev }; delete n[`${year}-${month}`]; return n; });
    setCustomers(prev => {
      const nextPending = prev.findIndex((c, i) => i > selectedIdx && !c.generated);
      if (nextPending >= 0) setSelectedIdx(nextPending);
      return prev;
    });
  };

  const handleGenBnPdf = async () => {
    const bnNo = selectedCust?.createdBnNo;
    if (!bnNo) return;
    if (selectedCust.createdPdfUrl) { window.open(selectedCust.createdPdfUrl, "_blank", "noopener,noreferrer"); return; }
    setPtLoading(true);
    try {
      const res = await tiApi.generateBillingNotePortraitPDF(bnNo);
      if (res?.url) {
        setCustomers(prev => prev.map((c, i) => i === selectedIdx ? { ...c, createdPdfUrl: res.url } : c));
        window.open(res.url, "_blank", "noopener,noreferrer");
      }
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setPtLoading(false); }
  };

  const togglePrintItem = (i) => setPrintQueue(prev => prev.map((q, j) => j===i ? { ...q, checked: !q.checked } : q));
  const toggleAllPrint  = () => {
    const allChecked = printQueue.every(q => q.checked);
    setPrintQueue(prev => prev.map(q => ({ ...q, checked: !allChecked })));
  };
  const printNow = async () => {
    const toPrint = printQueue.filter(q => q.checked);
    const bnNos = toPrint.map(q => q.bnNo).filter(Boolean);
    if (!bnNos.length) return;
    setPrinting(true);
    try {
      const res = await tiApi.printCombinedBillingNotes(bnNos, printFormat);
      if (res && res.url) {
        const a = document.createElement("a");
        a.href = res.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      setPrintQueue(prev => prev.map(q => bnNos.includes(q.bnNo) ? { ...q, checked: false, printed: true } : q));
      try { await tiApi.markBillingNotesPrinted(bnNos); } catch (_) {}
    } catch (err) {
      setError(err.message || "พิมพ์ไม่สำเร็จ");
    } finally {
      setPrinting(false);
    }
  };

  const done         = customers.filter(c => c.generated).length;
  const pending      = customers.filter(c => !c.generated).length;
  const selectedCust = selectedIdx !== null ? customers[selectedIdx] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "0 0 10px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={13}/> กลับ
          </button>
          <span style={{ fontSize: 15, fontWeight: 500 }}>สร้างใบวางบิล</span>
        </div>
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <DateRangePicker monthOnly startDate={`${year}-${String(month).padStart(2,"0")}-01`} endDate=""
            onApply={(s) => { if (!s) return; const d = new Date(s); const m1 = d.getMonth()+1, y = d.getFullYear(); setMonth(m1); setYear(y); setSelectedIdx(null); handleSearch(m1, y); }} />
          <Btn small onClick={() => handleSearch(month, year, true)} disabled={loading} title="โหลดใหม่">
            {loading ? <Loader size={13}/> : <RefreshCw size={13}/>}
          </Btn>
          {searched && customers.length > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted, display: "flex", gap: 12, alignItems: "center" }}>
              {done > 0 && <span style={{ color: C.success, display: "flex", alignItems: "center", gap: 3 }}><CheckCircle size={11}/> {done} สร้างแล้ว</span>}
              {pending > 0 && <span style={{ color: C.warning, display: "flex", alignItems: "center", gap: 3 }}><Square size={11}/> {pending} ยังไม่สร้าง</span>}
            </span>
          )}
        </div>
        {error && <div style={{ marginTop: 8 }}><ErrorBox msg={error} onRetry={() => handleSearch()} /></div>}
        {loading && <div style={{ marginTop: 8 }}><Spinner text="กำลังดึงข้อมูลใบกำกับภาษี..." /></div>}
      </div>

      {!loading && searched && customers.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>ไม่พบใบกำกับภาษีในเดือนนี้</div>
      )}
      {!loading && searched && customers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, flex: 1, minHeight: 0 }}>
          <div style={{ overflowY: "auto", scrollbarGutter: "stable", display: "flex", flexDirection: "column", gap: 6, paddingRight: 2 }}>
            {customers.map((cust, i) => {
              const total      = cust.invoices.reduce((s, inv) => s + (parseFloat(inv.total)||0), 0);
              const isSelected = selectedIdx === i;
              return (
                <div key={i} onClick={() => setSelectedIdx(i)}
                  style={{ background: C.cardBg, border: `0.5px solid ${isSelected ? C.accent : C.border}`, borderLeft: `3px solid ${isSelected ? C.accent : cust.generated ? C.success : C.borderLight}`, borderRadius: "0 6px 6px 0", padding: "9px 10px", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{cust.customer}</span>
                    {(() => {
                      const billedCnt = (cust.invoices || []).filter(inv => inv.bnNo).length;
                      const totalCnt  = (cust.invoices || []).length;
                      if (cust.generated) return <Badge type="success"><CheckCircle size={8}/> สร้างแล้ว</Badge>;
                      if (billedCnt > 0) return <Badge type="info">สร้าง {billedCnt}/{totalCnt}</Badge>;
                      return <Badge type="warning">ยังไม่สร้าง</Badge>;
                    })()}
                  </div>
                  {cust.generated && cust.createdBnNo
                    ? <div style={{ fontSize: 10, color: C.accent }}>{cust.createdBnNo}</div>
                    : <div style={{ fontSize: 10, color: C.muted }}>{cust.invoices.length} ฉบับ · ฿{total.toLocaleString()}</div>}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
           <div style={{ flex: "0 1 auto", minHeight: 0, overflowY: "auto", scrollbarGutter: "stable", display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedCust && !selectedCust.generated && (
              <BNCustomerPanel
                key={selectedCust.customer}
                cust={selectedCust}
                nextBnNo={nextBnNo}
                onConfirm={handleConfirm}
              />
            )}
            {selectedCust && selectedCust.generated && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", background: "#e8f5e9", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={14} style={{ color: C.success }}/>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedCust.customer}</span>
                  <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{selectedCust.createdBnNo}</span>
                </div>
                <div style={{ padding: "12px 14px", display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12 }}>
                  <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>วันที่</div><div>{selectedCust.createdDate || "-"}</div></div>
                  <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>จำนวนบิล</div><div>{selectedCust.createdCount} ฉบับ</div></div>
                  <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>รวมเงิน</div><div style={{ fontWeight: 600, color: C.accent }}>฿{(selectedCust.createdTotal||0).toLocaleString()}</div></div>
                  <div style={{ alignSelf: "flex-end" }}>
                    <Btn small onClick={handleGenBnPdf} disabled={ptLoading}>
                      {ptLoading ? <Loader size={13}/> : null} PDF
                    </Btn>
                  </div>
                </div>
                {(selectedCust.invoices || []).length > 0 && (
                  <div style={{ borderTop: `0.5px solid ${C.borderLight}` }}>
                    <div style={{ padding: "6px 14px", fontSize: 11, color: C.muted, background: "#fafafa" }}>ใบกำกับภาษีในใบวางบิลนี้</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <tbody>
                        {selectedCust.invoices.map((inv, i) => (
                          <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                            <td style={{ padding: "7px 14px" }}>
                              <span onClick={() => setTiPopup(inv.no)} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{inv.no}</span>
                            </td>
                            <td style={{ padding: "7px 14px", color: C.muted }}>{inv.date}</td>
                            <td style={{ padding: "7px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(parseFloat(inv.total)||0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ padding: "8px 14px", borderTop: `0.5px solid ${C.borderLight}`, display: "flex", justifyContent: "flex-end" }}>
                  <Btn small onClick={() => setCustomers(prev => prev.map((c, i) => i === selectedIdx ? { ...c, generated: false, createdBnNo: null, createdPdfUrl: null } : c))}>
                    <RefreshCw size={12}/> สร้างใหม่
                  </Btn>
                </div>
              </div>
            )}
            {!selectedCust && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
                เลือกลูกค้าจากรายการทางซ้าย
              </div>
            )}
           </div>
            {printQueue.length > 0 && (
              <div style={{ flexShrink: 0, maxHeight: "42%", display: "flex", flexDirection: "column", background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                    <Printer size={13}/> คิวพิมพ์ ({printQueue.filter(q=>q.checked).length}/{printQueue.length})
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>รูปแบบ</span>
                      {[["portrait", "PDF"],["landscape", "แบบพิมพ์"]].map(([v,l]) => (
                        <button key={v} onClick={() => setPrintFormat(v)} disabled={printing}
                          style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, cursor: printing ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 3,
                            border: `0.5px solid ${printFormat===v ? C.accent : C.border}`,
                            background: printFormat===v ? "#e3f0ff" : "white",
                            color: printFormat===v ? C.accent : C.muted, fontWeight: printFormat===v ? 600 : 400 }}>{l}
                        </button>
                      ))}
                    </div>
                    <Btn small onClick={printNow} disabled={printing || printQueue.filter(q=>q.checked).length===0}>
                      {printing ? <Loader size={13}/> : <Printer size={13}/>} {printing ? "กำลังสร้าง..." : "พิมพ์เลย"}
                    </Btn>
                  </div>
                </div>
                <div style={{ overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "5px 12px", width: 32, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>
                        <input type="checkbox" checked={printQueue.every(q=>q.checked)} onChange={toggleAllPrint}/>
                      </th>
                      {["เลขที่ BN","ลูกค้า","ฉบับ","รวมเงิน"].map((h, i) => (
                        <th key={i} style={{ padding: "5px 12px", textAlign: i===3?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {printQueue.map((q, i) => (
                      <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}`, opacity: q.checked ? 1 : 0.55 }}>
                        <td style={{ padding: "6px 12px" }}><input type="checkbox" checked={q.checked} onChange={() => togglePrintItem(i)}/></td>
                        <td style={{ padding: "6px 12px" }}>
                          {q.pdfUrl
                            ? <a href={q.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontWeight: 500, textDecoration: "none" }}>{q.bnNo}</a>
                            : <span style={{ color: C.accent, fontWeight: 500 }}>{q.bnNo}</span>}
                        </td>
                        <td style={{ padding: "6px 12px", fontSize: 11 }}>{q.customer}</td>
                        <td style={{ padding: "6px 12px", fontSize: 11 }}>{q.count}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(q.total||0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {tiPopup && (
        <TIDetailPopup tiNo={tiPopup} cachedData={tiCacheBN[tiPopup]} onCached={(no, d) => setTiCacheBN(prev => ({ ...prev, [no]: d }))} onClose={() => setTiPopup(null)} />
      )}
    </div>
  );
}

// ── Billing Note Page ──────────────────────────────────────

function BillingNoteTIPage({ cache, updateCache, goListRequest, onViewChange }) {
  const [view, setView_]              = useState("list");
  const [selectedBnNo, setSelectedBnNo] = useState(null);
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  useEffect(() => { if (goListRequest) setView("list"); }, [goListRequest]);
  const bnList = cache["bnList"] || [];
  const [listLoading, setListLoading] = useState(!cache["bnList"]);
  const [listError, setListError]     = useState("");
  const detailKey = no => "bnDetail_" + no;

  const loadBnList = async () => {
    setListLoading(true); setListError("");
    try {
      const data = await tiApi.getBillingNotes();
      updateCache("bnList", Array.isArray(data) ? data : []);
    } catch (err) { setListError(err.message); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (!cache?.["bnList"]) loadBnList(); }, []);

  if (view === "create") return <BNCreateView onBack={() => { updateCache("bnList", null); loadBnList(); setView("list"); }} />;
  if (view === "detail") return <BNDetailView bnNo={selectedBnNo} onBack={() => setView("list")}
    cachedDetail={cache[detailKey(selectedBnNo)]}
    onDetailCached={(no, d) => updateCache(detailKey(no), d)}
    onSaved={() => { updateCache(detailKey(selectedBnNo), null); updateCache("bnList", null); loadBnList(); }} />;

  return (
    <div>
      <div style={{ position: "sticky", top: -18, zIndex: 10, background: C.pageBg, paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}><ClipboardList size={15}/> ใบวางบิล</div>
          <Btn primary onClick={() => setView("create", "สร้างใบวางบิล")}>+ สร้างใบวางบิล</Btn>
        </div>
      </div>
      <BNListView
        bnList={bnList}
        loading={listLoading}
        error={listError}
        onRefresh={loadBnList}
        onRowClick={bn => { updateCache(detailKey(bn.bnNo), bn); setSelectedBnNo(bn.bnNo); setView("detail", bn.bnNo); }}
      />
    </div>
  );
}


export { BillingNoteTIPage };
