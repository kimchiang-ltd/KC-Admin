// ============================================================
// BN-TI Module — Billing Note for Tax Invoices
// Extracted from InvoiceAdmin.jsx → adapted to KC Admin shared layer
// Uses tiApi (TICode.gs backend), separate from BN-DN (invoice/InvoicePage.jsx)
// ============================================================

import { useState, useEffect, useRef, Fragment } from "react";
import QRCode from "qrcode";
import { AlertCircle, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, FileText, Loader, Pencil, Plus, Printer, QrCode, RefreshCw, Save, Smartphone, Square, Trash2 } from "lucide-react";
import { tiApi, bahtText } from "./tiApi.jsx";
import { C, PAGE_SIZE } from "../../shared/constants.jsx";
import { Btn, Badge, Spinner, ErrorBox, Paginator, ConfirmModal, CustomerFieldSyncModal, inputStyle, INSTR_STEPS, renderPhoneScreen } from "../../shared/ui.jsx";
import { toDownloadUrl, fmtAmt } from "../../shared/utils.jsx";
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
                {[["ลูกค้า", data.customer], ["วันที่", data.date], ["โทรศัพท์", data.phone || "—"], ["รวมเงิน", `${fmtAmt(data.grandTotal||0)}`]].map(([l, v]) => (
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
                      <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(Number(it.unitPrice||0))}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(Number(it.amount||0))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `0.5px solid ${C.borderLight}` }}>
                    <td colSpan={5} style={{ padding: "7px 10px", textAlign: "right", color: C.muted }}>ยอดก่อนภาษี</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(data.subtotal||0)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} style={{ padding: "7px 10px", textAlign: "right", color: C.muted }}>ภาษีมูลค่าเพิ่ม</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(data.vatAmt||0)}</td>
                  </tr>
                  <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                    <td colSpan={5} style={{ padding: "9px 10px", textAlign: "right", fontWeight: 500 }}>รวมทั้งสิ้น</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: C.accent }}>{fmtAmt(data.grandTotal||0)}</td>
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

// #268 — parse "dd/MM/yyyy" → Thai locale date string (display only)
function fmtDateThai(s) {
  if (!s) return "—";
  const p = String(s).split("/");
  if (p.length !== 3) return s;
  const d = new Date(+p[2], +p[1] - 1, +p[0]);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
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
  const [actionError, setActionError] = useState(null);
  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);
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
        tiApi.updateCustomer(customer, update).catch(e => setActionError("บันทึกที่อยู่/เบอร์ลูกค้าลงระบบไม่สำเร็จ — " + e.message)); // #284
      }
      const displayDate = dateInput ? (() => { const p = dateInput.split("-"); return `${p[2]}/${p[1]}/${p[0]}`; })() : detail.date;
      onSave({ date: displayDate, customer, address, phone, invoices, count: invoices.length, total: invoices.reduce((s, inv) => s + (parseFloat(inv.total)||0), 0) });
    } catch (e) {
      setActionError("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B" }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
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
            <textarea value={address} onChange={e => { const v = e.target.value; if (v.split("\n").length <= 3) setAddress(v); }} onBlur={() => checkFieldOnBlur('address', address)} placeholder="—" rows={2} style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
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
                <td style={{ padding: "8px 14px", color: C.muted }}>{fmtDateThai(inv.date)}</td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(inv.total||0)}</td>
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
                <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(invoices.reduce((s, inv) => s+(parseFloat(inv.total)||0), 0))}</td>
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
                  <td style={{ padding: "8px 14px", color: C.muted }}>{fmtDateThai(ti.date)}</td>
                  <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(ti.total||0)}</td>
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
  const [actionError, setActionError] = useState(null);
  useEffect(() => {
    if (!showInstructions) { setInstrStep(0); return; }
    const iv = setInterval(() => setInstrStep(s => (s + 1) % INSTR_STEPS.length), 2500);
    return () => clearInterval(iv);
  }, [showInstructions]);
  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

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
    catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
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
    } catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLsLoading(false); }
  };

  const generatePortrait = async () => {
    if (detail.pdfUrl) { window.open(detail.pdfUrl, "_blank", "noopener,noreferrer"); return; }
    setPtLoading(true);
    try {
      const res = await tiApi.generateBillingNotePortraitPDF(bnNo);
      if (res?.url) { setDetail(d => ({ ...d, pdfUrl: res.url })); window.open(res.url, "_blank", "noopener,noreferrer"); }
    } catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
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
    } catch (err) { setActionError("เกิดข้อผิดพลาด: " + err.message); }
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
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B" }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
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
          {detail?.cancelled && <Badge type="warning">ยกเลิก</Badge>}
        </div>
        {detail && !detail.cancelled && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn onClick={generateLandscape} disabled={lsLoading}>{lsLoading ? <Loader size={13}/> : <Printer size={14}/>} แบบพิมพ์</Btn>
            <Btn onClick={generatePortrait} disabled={ptLoading}>{ptLoading ? <Loader size={13}/> : <FileText size={14}/>} PDF</Btn>
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
              <div><span style={{ fontSize: 11, color: C.muted }}>รวมเงิน </span><span style={{ fontWeight: 600, fontSize: 15, color: C.accent }}>{fmtAmt(detail.total||0)}</span></div>
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
                    <td style={{ padding: "8px 14px", color: C.muted }}>{fmtDateThai(inv.date)}</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(inv.total||0)}</td>
                  </tr>
                ))}
              </tbody>
              {(detail.invoices||[]).length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: `0.5px solid ${C.border}`, background: "#f5f9f6" }}>
                    <td colSpan={2} style={{ padding: "7px 14px", fontSize: 11, color: C.muted }}>รวม {detail.invoices.length} ฉบับ</td>
                    <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(detail.total||0)}</td>
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

function BNListView({ bnList, loading, error, onRefresh, onRowClick, onCreateSingle, onCreateBatch }) {
  const [search, setSearch]               = useState("");
  const [hovered, setHovered]             = useState(null);
  const [dStart, setDStart]               = useState("");
  const [dEnd, setDEnd]                   = useState("");
  const [cancelOpen, setCancelOpen]       = useState(false);
  const [cancelHovered, setCancelHovered] = useState(null);
  const [page, setPage]                   = useState(1);
  const [createDrop, setCreateDrop]       = useState(false);
  const [sortCol, setSortCol]             = useState("tiMonth"); // #378 default sort by TI month (mirrors BN-DN)
  const [sortDir, setSortDir]             = useState("desc");
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

  // #378 — TI period label (mirrors BN-DN's dnPeriodLabel)
  const THAI_M_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const tiPeriodLabel = (invoices) => {
    if (!invoices || invoices.length === 0) return "—";
    const months = new Set();
    invoices.forEach(inv => { if (!inv.date) return; const p = String(inv.date).split("/"); if (p.length === 3) months.add(+p[2] * 100 + +p[1]); });
    if (months.size === 0) return "—";
    const sorted = [...months].sort((a, b) => a - b);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const fM = (first % 100) - 1, fY = Math.floor(first / 100);
    if (sorted.length === 1) return THAI_M_SHORT[fM] + " " + fY;
    const lM = (last % 100) - 1, lY = Math.floor(last / 100);
    if (fY === lY) return THAI_M_SHORT[fM] + " – " + THAI_M_SHORT[lM] + " " + lY;
    return THAI_M_SHORT[fM] + " " + fY + " – " + THAI_M_SHORT[lM] + " " + lY;
  };
  const tiMonthKey = bn => {
    const dates = (bn.invoices || []).map(inv => { if (!inv.date) return 0; const p = String(inv.date).split("/"); return p.length === 3 ? +p[2] * 100 + +p[1] : 0; }).filter(Boolean);
    return dates.length > 0 ? Math.min(...dates) : 0;
  };

  // #233 — sort helpers
  const parseDateDMY = d => { if (!d) return 0; const p = String(d).split("/"); return p.length === 3 ? +p[2] * 10000 + +p[1] * 100 + +p[0] : 0; };
  const sortFn = (a, b) => {
    let va, vb;
    switch (sortCol) {
      case "bnNo":     va = a.bnNo || ""; vb = b.bnNo || ""; break;
      case "tiMonth":  va = tiMonthKey(a); vb = tiMonthKey(b); break;
      case "date":     va = parseDateDMY(a.date); vb = parseDateDMY(b.date); break;
      case "customer": va = (a.customer || "").toLowerCase(); vb = (b.customer || "").toLowerCase(); break;
      case "count":    va = a.count || 0; vb = b.count || 0; break;
      case "total":    va = a.total || 0; vb = b.total || 0; break;
      default:         return 0;
    }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  };
  const handleSort = (col) => { if (col === sortCol) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("desc"); } };

  const filtered = applyFilters(bnList.filter(bn => !bn.cancelled));
  const active   = [...filtered].sort(sortFn);
  const cancelled = bnList.filter(bn => bn.cancelled);
  const pagedBN   = active.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const BNRow = ({ bn, i, isHov, setHov }) => (
    <tr onClick={() => onRowClick(bn)} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
      style={{ background: isHov ? C.rowHover : "white", borderBottom: `0.5px solid ${C.borderLight}`, cursor: "pointer" }}>
      <td style={{ padding: "9px 14px", color: C.accent, fontWeight: 500 }}>{bn.bnNo}</td>
      <td style={{ padding: "9px 14px", fontWeight: 500, fontSize: 11.5 }}>{tiPeriodLabel(bn.invoices)}</td>
      <td style={{ padding: "9px 14px", color: C.muted }}>{fmtDateThai(bn.date)}</td>
      <td style={{ padding: "9px 14px" }}>{bn.customer}</td>
      <td style={{ padding: "9px 14px" }}>{bn.count} ฉบับ</td>
      <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(bn.total || 0)}</td>
    </tr>
  );

  const cols = [
    { key: "bnNo", label: "เลขที่ใบวางบิล" }, { key: "tiMonth", label: "เดือนที่เปิดใบกำกับภาษี" }, { key: "date", label: "วันที่ออก" }, { key: "customer", label: "ชื่อลูกค้า" },
    { key: "count", label: "จำนวนบิล" }, { key: "total", label: "รวมเงิน", align: "right" },
  ];
  const sortArrow = (col) => sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";
  const thead = (
    <thead>
      <tr>
        {cols.map((c, i) => (
          <th key={i} onClick={c.key ? () => handleSort(c.key) : undefined}
            style={{ padding: "8px 14px", textAlign: c.align || "left", color: sortCol === c.key ? C.accent : C.muted, fontWeight: sortCol === c.key ? 600 : 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", position: "sticky", top: 70, zIndex: 2, boxShadow: "0 1px 0 rgba(0,0,0,0.06)", cursor: c.key ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap" }}>
            {c.label}{c.key ? sortArrow(c.key) : ""}
          </th>
        ))}
      </tr>
    </thead>
  );
  const plainThead = (
    <thead>
      <tr>
        {cols.map((c, i) => (
          <th key={i} style={{ padding: "8px 14px", textAlign: c.align || "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{c.label}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div>
      <div style={{ position: "sticky", top: -18, zIndex: 10, background: C.pageBg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}><ClipboardList size={15}/> ใบวางบิล (VAT)</div>
          {onCreateBatch && (
            <div style={{ position: "relative", display: "inline-flex" }}>
              <button onClick={() => { onCreateBatch(); }} style={{ background: C.accent, color: "white", border: "none", borderRadius: "6px 0 0 6px", padding: "6px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                + สร้างใบวางบิล
              </button>
              <button onClick={() => setCreateDrop(p => !p)} style={{ background: C.accent, color: "white", border: "none", borderLeft: "1px solid rgba(255,255,255,0.3)", borderRadius: "0 6px 6px 0", padding: "6px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <ChevronDown size={13}/>
              </button>
              {createDrop && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setCreateDrop(false)} />
                  <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "white", border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 180, overflow: "hidden" }}>
                    {/* #376b — dropdown lists BOTH modes (matching BN #326) */}
                    <div onClick={() => { setCreateDrop(false); onCreateBatch(); }} style={{ padding: "9px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, borderBottom: `0.5px solid ${C.borderLight}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.rowHover} onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <Plus size={13}/> สร้างแบบรวม
                    </div>
                    <div onClick={() => { setCreateDrop(false); onCreateSingle(); }} style={{ padding: "9px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = C.rowHover} onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <Plus size={13}/> สร้างทีละราย
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", background: "#fafafa", border: `0.5px solid ${C.border}`, borderRadius: "8px 8px 0 0", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเลขที่ / ลูกค้า..."
            style={{ ...inputStyle, width: 200, height: 30 }} />
          <DateRangePicker startDate={dStart} endDate={dEnd} onApply={(s, e) => { setDStart(s); setDEnd(e); }} />
          <Btn small primary onClick={onRefresh}><RefreshCw size={14}/> รีเฟรช</Btn>
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
                {[["ลูกค้า", data.customer], ["วันที่", data.date], ["จำนวน", `${data.count} ฉบับ`], ["รวมเงิน", `${fmtAmt(data.total||0)}`]].map(([l, v]) => (
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
                      <td style={{ padding: "7px 10px", color: C.muted }}>{fmtDateThai(inv.date)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 500 }}>{fmtAmt(parseFloat(inv.total)||0)}</td>
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

function BNCustomerPanel({ cust, nextBnNo, onConfirm, onTiEdited }) {
  const today = new Date().toISOString().slice(0, 10);
  const [bnDate, setBnDate]   = useState(today);
  const [confirming, setConf] = useState(false);
  const [error, setError]     = useState("");
  const [rows, setRows]       = useState(
    (cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: !inv.bnNo }))
  );
  const [tiCache, setTiCache]     = useState({});
  const [editMode, setEditMode]   = useState(false); // #376b — gate checkboxes behind edit mode
  const [bnPopup, setBnPopup]     = useState(null);
  const [address, setAddress]     = useState(cust.address || "");
  const [phone, setPhone]         = useState(cust.phone || "");
  const [expandedTi, setExpandedTi] = useState(null);   // #308 — inline TI detail expand
  const [tiLoading, setTiLoading]   = useState(null);
  const [prefetching, setPrefetching] = useState(false); // #308 — parallel TI-detail prefetch
  const [editingTi, setEditingTi]   = useState(null);   // #308 — inline TI editor

  useEffect(() => {
    setBnDate(today); setError(""); setExpandedTi(null); setEditMode(false); setEditingTi(null);
    setRows((cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: !inv.bnNo })));
    setAddress(cust.address || ""); setPhone(cust.phone || "");
  }, [cust.customer]);

  // #308 — pre-fetch TI line items in parallel on customer select (mirrors BN #327)
  useEffect(() => {
    const nos = (cust.invoices || []).map(inv => inv.no).filter(no => !tiCache[no]);
    if (nos.length === 0) return;
    let cancelled = false;
    setPrefetching(true);
    Promise.all(nos.map(no => tiApi.getTIDetail(no).then(d => [no, d]).catch(() => null)))
      .then(results => {
        if (cancelled) return;
        const add = {};
        results.forEach(r => { if (r) add[r[0]] = r[1]; });
        if (Object.keys(add).length) setTiCache(prev => ({ ...prev, ...add }));
      })
      .finally(() => { if (!cancelled) setPrefetching(false); });
    return () => { cancelled = true; };
  }, [cust.customer]);

  const toggleRow = (idx) => setRows(prev => prev.map(r => r.idx === idx && !r.bnNo ? { ...r, checked: !r.checked } : r));
  const toggleAll = () => {
    const unbilled = rows.filter(r => !r.bnNo);
    const allChecked = unbilled.length > 0 && unbilled.every(r => r.checked);
    setRows(prev => prev.map(r => r.bnNo ? r : { ...r, checked: !allChecked }));
  };

  // #308 — lazy-load a TI's line items for สินค้า count + inline expand
  const toggleTiDetail = async (tiNo) => {
    setEditingTi(null);
    if (expandedTi === tiNo) { setExpandedTi(null); return; }
    setExpandedTi(tiNo);
    if (tiCache[tiNo]) return;
    setTiLoading(tiNo);
    try { const d = await tiApi.getTIDetail(tiNo); setTiCache(prev => ({ ...prev, [tiNo]: d })); } catch (_) {}
    finally { setTiLoading(null); }
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
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{cust.customer}</span>
        <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{nextBnNo}</span>
        {rows.some(r => !r.bnNo) && (
          <span style={{ marginLeft: "auto" }}>
            <Btn small onClick={() => setEditMode(!editMode)} style={editMode ? { background: "#eef2ff", border: `1px solid ${C.accent}`, color: C.accent } : {}}>
              <Pencil size={12}/> {editMode ? "เสร็จสิ้น" : "แก้ไขรายการ"}
            </Btn>
          </span>
        )}
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
        <textarea value={address} onChange={e => { const v = e.target.value; if (v.split("\n").length <= 3) setAddress(v); }} placeholder="—" rows={2} style={{ ...inputStyle, width: "100%", fontSize: 11, resize: "vertical" }} />
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
            {editMode && (
              <th style={{ padding: "7px 14px", width: 32, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>
                <input type="checkbox" checked={(() => { const u = rows.filter(r => !r.bnNo); return u.length > 0 && u.every(r => r.checked); })()} onChange={toggleAll} />
              </th>
            )}
            {["เลขที่ TI", "วันที่", "สินค้า", "รวมเงิน"].map((h, i) => (
              <th key={i} style={{ padding: "7px 14px", textAlign: i===3?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const det       = tiCache[row.no];
            const itemCount = det && det.items ? det.items.length : null;
            const isExp     = expandedTi === row.no;
            const excluded = editMode && !row.bnNo && !row.checked;
            return (
            <Fragment key={row.idx}>
              <tr onClick={() => toggleTiDetail(row.no)} style={{ borderBottom: row.bnNo ? "none" : `0.5px solid ${C.borderLight}`, background: row.bnNo ? "#fafafa" : "white", opacity: row.bnNo ? 0.5 : (excluded ? 0.4 : 1), cursor: "pointer" }}>
                {editMode && (
                  <td style={{ padding: "8px 14px" }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={row.checked} disabled={!!row.bnNo} onChange={() => toggleRow(row.idx)} style={{ cursor: row.bnNo ? "not-allowed" : "pointer" }} />
                  </td>
                )}
                <td style={{ padding: "8px 14px", textDecoration: excluded ? "line-through" : "none" }}>
                  <span style={{ color: row.bnNo ? C.muted : C.accent, fontWeight: 500 }}>{row.no}</span>
                </td>
                <td style={{ padding: "8px 14px", color: C.muted }}>{fmtDateThai(row.date)}</td>
                <td style={{ padding: "8px 14px", color: C.muted, fontSize: 11 }}>
                  {(tiLoading === row.no || (prefetching && itemCount == null)) ? "…" : itemCount != null ? `สินค้า ${itemCount} รายการ ${isExp ? "▼" : "▸"}` : "ดู ▸"}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(parseFloat(row.total)||0)}</td>
              </tr>
              {isExp && (
                <tr>
                  <td colSpan={editMode ? 5 : 4} style={{ padding: 0, borderBottom: `0.5px solid ${C.borderLight}`, background: "#fafafa" }}>
                    <div style={{ padding: "8px 12px 12px" }} onClick={e => e.stopPropagation()}>
                      {!det && <div style={{ fontSize: 11, color: C.muted, padding: "4px 0" }}>กำลังโหลด…</div>}
                      {det && det.items && editingTi !== row.no && (
                        <>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                            <thead>
                              <tr>{["รายการ", "ขนาด", "จำนวน", "หน่วยละ", "จำนวนเงิน"].map((h, hi) => (
                                <th key={hi} style={{ padding: "4px 10px", textAlign: hi>=2?"right":"left", color: C.muted, fontWeight: 500 }}>{h}</th>
                              ))}</tr>
                            </thead>
                            <tbody>
                              {(det.items || []).map((it, ii) => (
                                <tr key={ii}>
                                  <td style={{ padding: "4px 10px" }}>{it.desc || ""}</td>
                                  <td style={{ padding: "4px 10px", color: C.muted }}>{it.desc2 || ""}</td>
                                  <td style={{ padding: "4px 10px", textAlign: "right" }}>{it.qty || ""}</td>
                                  <td style={{ padding: "4px 10px", textAlign: "right" }}>{it.unitPrice !== "" && it.unitPrice != null ? fmtAmt(Number(it.unitPrice||0)) : ""}</td>
                                  <td style={{ padding: "4px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(Number(it.amount||0))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {!row.bnNo && (
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                              <button onClick={() => setEditingTi(row.no)} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.accent, border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "4px 10px", background: "none", cursor: "pointer" }}>
                                <Pencil size={11}/> แก้ไขใบกำกับภาษี
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {det && editingTi === row.no && (
                        <TIInlineEditor tiData={det}
                          onCancel={() => setEditingTi(null)}
                          onSaved={(u) => {
                            setTiCache(prev => ({ ...prev, [row.no]: { ...(prev[row.no] || {}), items: u.items, subtotal: u.subtotal, vatAmt: u.vatAmt, grandTotal: u.grandTotal, pdfUrl: "" } }));
                            setRows(prev => prev.map(r => r.no === row.no ? { ...r, total: u.grandTotal } : r));
                            onTiEdited?.(row.no, u.grandTotal);
                            setEditingTi(null);
                          }} />
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {row.bnNo && (
                <tr style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td colSpan={editMode ? 5 : 4} style={{ padding: 0 }}>
                    <div style={{ background: "#fff8e1", borderTop: `0.5px solid #fac775`, padding: "5px 10px 5px 36px", fontSize: 10, color: "#633806", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <AlertCircle size={11} style={{ color: "#854f0b", flexShrink: 0, marginLeft: -20 }}/>
                      {row.no} อยู่ใน {row.bnNo} แล้ว — ถ้าต้องการรวม TI นี้ ให้
                      <span onClick={(e) => { e.stopPropagation(); setBnPopup(row.bnNo); }} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>ยกเลิก {row.bnNo} →</span>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );})}
        </tbody>
      </table>
      {/* #376a — sticky footer: total + create button always visible */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: "#f5f9f6" }}>
        <div style={{ padding: "7px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: C.muted }}>รวม {selectedRows.length} ฉบับ{(() => { const ex = rows.filter(r => !r.bnNo && !r.checked).length; return editMode && ex > 0 ? ` · ข้าม ${ex}` : ""; })()}</span>
          <span style={{ fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>{fmtAmt(grandTotal)}</span>
        </div>
        {error && <div style={{ padding: "4px 14px 8px" }}><ErrorBox msg={error} /></div>}
        <div style={{ padding: "6px 14px 10px", display: "flex", justifyContent: "flex-end" }}>
          <Btn primary onClick={handleConfirm} disabled={confirming || selectedRows.length === 0}>
            {confirming ? <><Loader size={13}/> กำลังสร้าง...</> : <><Check size={13}/> ออกใบวางบิล</>}
          </Btn>
        </div>
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

// ── TI Inline Editor (#308) — edit TI items in-place within BNCustomerPanel ──

function TIInlineEditor({ tiData, onSaved, onCancel }) {
  const [items, setItems]   = useState(() => (tiData.items || []).map(it => ({ ...it, _orig: true })));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const updateItem = (idx, field, val) => setItems(prev => prev.map((it, i) => {
    if (i !== idx) return it;
    const next = { ...it, [field]: val };
    if (field === "qty" || field === "unitPrice") {
      next.amount = String((parseFloat(next.qty) || 0) * (parseFloat(next.unitPrice) || 0));
    }
    return next;
  }));

  const removeAt = (idx) => setItems(prev => { const n = prev.filter((_, i) => i !== idx); return n.length ? n : [{ desc: "", desc2: "", qty: "", unitPrice: "", amount: "" }]; });
  const addRow   = () => setItems(prev => [...prev, { desc: "", desc2: "", qty: "", unitPrice: "", amount: "" }]);

  const filled   = items.filter(it => it.desc || it.qty || it.unitPrice);
  const subtotal = filled.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const vatRate  = tiData.vatRate ?? 7;
  const vatAmt   = Math.round(subtotal * vatRate / 100 * 100) / 100;
  const gt       = subtotal + vatAmt;

  const save = async () => {
    if (filled.length === 0) { setError("ไม่มีรายการสินค้า"); return; }
    setSaving(true); setError("");
    try {
      const cleanItems = filled.map(({ _orig, ...rest }) => rest);
      const logAdded   = filled.filter(it => !it._orig).length;
      const logDeleted = (tiData.items || []).filter(orig => !items.some(it => it._orig && it.desc === orig.desc && it.qty === orig.qty)).map(it => [it.desc, it.desc2, it.qty].filter(Boolean).join(" "));
      const payload = {
        date: tiData.date, name: tiData.customer || tiData.name, address: tiData.address || "",
        taxId: tiData.taxId || "", phone: tiData.phone || "", invoiceRef: tiData.invoiceRef || "",
        items: cleanItems, subtotal, vatAmt, grandTotal: gt,
        _logAdded: logAdded, _logDeleted: logDeleted,
      };
      await tiApi.updateTaxInvoice(tiData.id || tiData.tiNo, payload);
      onSaved({ items: cleanItems, subtotal, vatAmt, grandTotal: gt });
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const cell = (idx, field, align) => (
    <input value={items[idx][field] ?? ""} onChange={e => updateItem(idx, field, e.target.value)}
      style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 4, background: "white", fontSize: 11.5, padding: "4px 6px", outline: "none", textAlign: align || "left", boxSizing: "border-box" }} />
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.muted, marginBottom: 8 }}>
        <Save size={12}/> แก้ไขรายการสินค้า — "{tiData.customer || tiData.name}"
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, marginBottom: 8 }}>
        <thead>
          <tr style={{ background: C.sidebar }}>
            {["#", "รายการ", "ขนาด", "จำนวน", "หน่วยละ", "จำนวนเงิน", ""].map((h, hi) => (
              <th key={hi} style={{ padding: "6px 8px", color: "white", fontWeight: 500, textAlign: (hi >= 3 && hi <= 5) ? "right" : "left", fontSize: 10.5, width: hi === 6 ? 34 : undefined }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f5f7ff", borderBottom: `0.5px solid ${C.borderLight}` }}>
              <td style={{ padding: "4px 6px", color: C.muted, textAlign: "center" }}>{ri + 1}</td>
              <td style={{ padding: "4px 6px" }}>{cell(ri, "desc", "left")}</td>
              <td style={{ padding: "4px 6px", width: 74 }}>{cell(ri, "desc2", "left")}</td>
              <td style={{ padding: "4px 6px", width: 72 }}>{cell(ri, "qty", "right")}</td>
              <td style={{ padding: "4px 6px", width: 86 }}>{cell(ri, "unitPrice", "right")}</td>
              <td style={{ padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(Number(it.amount || 0))}</td>
              <td style={{ padding: "4px 6px", textAlign: "center" }}>
                <button aria-label="ลบแถว" onClick={() => removeAt(ri)} style={{ border: "none", background: "none", cursor: "pointer", color: C.danger, display: "inline-flex" }}><Trash2 size={13}/></button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#eef2ff" }}>
            <td colSpan={5} style={{ padding: "5px 8px", textAlign: "right", fontSize: 11, color: C.muted }}>ยอดก่อน VAT</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(subtotal)}</td>
            <td></td>
          </tr>
          <tr style={{ background: "#eef2ff" }}>
            <td colSpan={5} style={{ padding: "5px 8px", textAlign: "right", fontSize: 11, color: C.muted }}>VAT {vatRate}%</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(vatAmt)}</td>
            <td></td>
          </tr>
          <tr style={{ background: "#eef2ff", borderTop: `1px solid ${C.border}` }}>
            <td colSpan={5} style={{ padding: "7px 8px", textAlign: "right", fontWeight: 500 }}>ยอดรวม</td>
            <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: C.accent }}>{fmtAmt(gt)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      {error && <div style={{ color: C.danger, fontSize: 11.5, marginBottom: 6 }}>{error}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={addRow}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: C.accent, border: `0.5px dashed ${C.accent}`, borderRadius: 4, padding: "5px 10px", background: "none", cursor: "pointer" }}>
          <Plus size={12}/> เพิ่มรายการ
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small onClick={onCancel} disabled={saving}>ยกเลิก</Btn>
          <Btn small primary onClick={save} disabled={saving}>{saving ? <Loader size={12}/> : <Check size={12}/>} บันทึก</Btn>
        </div>
      </div>
    </div>
  );
}

// ── BN-TI Batch Create View (#263) ────────────────────────

function BNTIBatchCreateView({ onBack }) {
  const now = new Date();
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [year, setYear]           = useState(now.getFullYear());
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [customers, setCustomers] = useState([]); // [{customer, invoices, address, phone, checked, generated}]
  const [searched, setSearched]   = useState(false);
  const [expanded, setExpanded]   = useState({}); // { customerName: true/false }
  const [creating, setCreating]   = useState(false);
  const [progress, setProgress]   = useState({ done: 0, total: 0, current: "" });
  const [results, setResults]     = useState([]); // [{ customer, bnNo, success, error }]
  const [nextBnNo, setNextBnNo]   = useState(null);
  const [expandedTi, setExpandedTi] = useState(null); // inline TI detail
  const [tiCache, setTiCache]       = useState({});
  const [tiLoading, setTiLoading]   = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [batchPrinting, setBatchPrinting] = useState(false);
  const [batchPrintFormat, setBatchPrintFormat] = useState("portrait");
  const [printMode, setPrintMode] = useState(false);
  const [printSel, setPrintSel] = useState(new Set());
  const [actionError, setActionError] = useState(null);
  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

  const handleSearch = async (mArg = month, yArg = year) => {
    setLoading(true); setError("");
    const m = String(mArg).padStart(2, "0");
    const days = new Date(yArg, mArg, 0).getDate();
    try {
      const data = await tiApi.searchTaxInvoicesForBilling(`${yArg}-${m}-01`, `${yArg}-${m}-${String(days).padStart(2, "0")}`);
      const mapped = (Array.isArray(data) ? data : []).map(cust => ({
        ...cust,
        checked: !cust.generated,
        invoices: (cust.invoices || []).map(inv => ({ ...inv, checked: !inv.bnNo })),
      }));
      setCustomers(mapped);
      setSearched(true);
      setResults([]);
      setExpandedTi(null); setTiCache({});
      const exp = {};
      mapped.forEach(c => { if (!c.generated) exp[c.customer] = true; });
      setExpanded(exp);
      // batch-fetch all TI details in background
      const allTiNos = mapped.flatMap(c => (c.invoices || []).map(inv => inv.no)).filter(Boolean);
      if (allTiNos.length > 0) {
        Promise.all(allTiNos.map(no => tiApi.getTIDetail(no).then(d => ({ no, d })).catch(() => null)))
          .then(results => {
            const cache = {};
            results.forEach(r => { if (r) cache[r.no] = r.d; });
            setTiCache(cache);
          });
      }
      // fetch next BN number
      try {
        const hist = await tiApi.getBillingNotes();
        if (hist && hist.length > 0) {
          const parts = hist[0].bnNo.split("-");
          const lastNum = parseInt(parts[parts.length - 1], 10) || 0;
          const yy = new Date().getFullYear().toString().slice(-2);
          setNextBnNo(`${yy}-BN-${String(lastNum + 1).padStart(6, "0")}`);
        } else { setNextBnNo(`${new Date().getFullYear().toString().slice(-2)}-BN-000001`); }
      } catch (_) { setNextBnNo(`${new Date().getFullYear().toString().slice(-2)}-BN-000001`); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { handleSearch(); }, []);

  const toggleCustomer = (idx) => setCustomers(prev => prev.map((c, i) => {
    if (i !== idx) return c;
    const newChecked = !c.checked;
    return { ...c, checked: newChecked, invoices: c.invoices.map(inv => inv.bnNo ? inv : { ...inv, checked: newChecked }) };
  }));

  const toggleTI = (custIdx, tiIdx) => setCustomers(prev => prev.map((c, ci) => {
    if (ci !== custIdx) return c;
    const newInv = c.invoices.map((inv, di) => di === tiIdx && !inv.bnNo ? { ...inv, checked: !inv.checked } : inv);
    const anyChecked = newInv.some(inv => inv.checked && !inv.bnNo);
    return { ...c, invoices: newInv, checked: anyChecked };
  }));

  const toggleExpand = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  const pendingCustomers = customers.filter(c => !c.generated);
  const selectedCustomers = pendingCustomers.filter(c => c.checked);
  const totalTIs = selectedCustomers.reduce((s, c) => s + c.invoices.filter(inv => inv.checked && !inv.bnNo).length, 0);
  const grandTotal = selectedCustomers.reduce((s, c) => s + c.invoices.filter(inv => inv.checked && !inv.bnNo).reduce((t, inv) => t + (parseFloat(inv.total) || 0), 0), 0);

  const selectAll = () => {
    const allChecked = pendingCustomers.every(c => c.checked);
    setCustomers(prev => prev.map(c => c.generated ? c : { ...c, checked: !allChecked, invoices: c.invoices.map(inv => inv.bnNo ? inv : { ...inv, checked: !allChecked }) }));
  };

  // inline TI detail expand
  const toggleTiDetail = async (tiNo) => {
    if (expandedTi === tiNo) { setExpandedTi(null); return; }
    setExpandedTi(tiNo);
    if (tiCache[tiNo]) return;
    setTiLoading(tiNo);
    try {
      const d = await tiApi.getTIDetail(tiNo);
      setTiCache(prev => ({ ...prev, [tiNo]: d }));
    } catch (_) {}
    finally { setTiLoading(null); }
  };

  const incrementBn = (bnNo) => {
    const parts = bnNo.split("-");
    const num = parseInt(parts[parts.length - 1], 10) || 0;
    const yy = parts[0];
    return `${yy}-BN-${String(num + 1).padStart(6, "0")}`;
  };

  const handleBatchCreate = async () => {
    if (!nextBnNo || selectedCustomers.length === 0) return;
    setCreating(true);
    setResults([]);
    const today = new Date().toISOString().slice(0, 10);
    const total = selectedCustomers.length;
    setProgress({ done: 0, total, current: "" });

    let currentBn = nextBnNo;
    const batchResults = [];

    for (const cust of selectedCustomers) {
      setProgress(prev => ({ ...prev, current: cust.customer }));
      const checkedTIs = cust.invoices.filter(inv => inv.checked && !inv.bnNo);
      const invoices = checkedTIs.map(inv => ({ no: inv.no, date: inv.date, total: inv.total }));
      try {
        const result = await tiApi.confirmBN(cust.customer, currentBn, invoices, today, cust.address || "", cust.phone || "");
        const custAmount = checkedTIs.reduce((s, inv) => s + (parseFloat(inv.total) || 0), 0);
        batchResults.push({ customer: cust.customer, bnNo: result.bnNo, pdfUrl: result.pdfUrl, success: true, count: checkedTIs.length, amount: custAmount });
        currentBn = incrementBn(currentBn);
      } catch (err) {
        batchResults.push({ customer: cust.customer, success: false, error: err.message });
      }
      setProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }

    setResults(batchResults);
    setCreating(false);
    setNextBnNo(currentBn);
  };

  // ── Result view ──
  if (results.length > 0) {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalTIsCreated = results.filter(r => r.success).reduce((s, r) => s + (r.count || 0), 0);
    const totalAmount = results.filter(r => r.success).reduce((s, r) => s + (r.amount || 0), 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, paddingBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <button onClick={onBack} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
              <ChevronLeft size={13}/> กลับ
            </button>
            <span style={{ fontSize: 15, fontWeight: 500 }}>ผลการสร้างใบวางบิล</span>
          </div>
          <div style={{ background: failCount === 0 ? C.successBg : C.warningBg, border: `1px solid ${failCount === 0 ? C.success : C.warning}`, borderRadius: 8, padding: "14px 18px", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: failCount === 0 ? C.success : C.warning }}>
              {failCount === 0 ? "สร้างใบวางบิลสำเร็จทั้งหมด" : `สำเร็จ ${successCount} ราย · ไม่สำเร็จ ${failCount} ราย`}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              สร้าง {successCount} ใบวางบิล · รวม {totalTIsCreated} ฉบับ TI · ยอดรวม {fmtAmt(totalAmount)}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f0f4f8" }}>
                <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: C.muted }}>ลูกค้า</th>
                <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: C.muted }}>เลขที่ใบวางบิล</th>
                <th style={{ padding: "8px 14px", textAlign: "center", fontSize: 11, fontWeight: 500, color: C.muted }}>สถานะ</th>
                <th style={{ padding: "8px 14px", textAlign: "center", fontSize: 11, fontWeight: 500, color: C.muted }}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "8px 14px", fontWeight: 500 }}>{r.customer}</td>
                  <td style={{ padding: "8px 14px", color: C.accent }}>{r.success ? r.bnNo : "—"}</td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }}>
                    {r.success
                      ? <span style={{ color: C.success, fontSize: 12 }}><Check size={14}/> สำเร็จ</span>
                      : <span style={{ color: C.danger, fontSize: 12 }}>✕ {r.error}</span>}
                  </td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }}>
                    {r.success && r.pdfUrl && (
                      <a href={r.pdfUrl} target="_blank" rel="noreferrer" style={{ color: C.accent, fontSize: 12, textDecoration: "none" }}>ดู PDF</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flexShrink: 0, padding: "14px 0", display: "flex", alignItems: "center", gap: 10 }}>
          {successCount > 0 && (
            <>
              <div style={{ display: "inline-flex", gap: 2 }}>
                {[["portrait", "PDF"], ["landscape", "แบบพิมพ์"]].map(([v, label]) => (
                  <button key={v} onClick={() => setBatchPrintFormat(v)} disabled={batchPrinting}
                    style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, cursor: batchPrinting ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 3,
                      background: batchPrintFormat === v ? C.accent : "white", color: batchPrintFormat === v ? "white" : C.muted,
                      border: `0.5px solid ${batchPrintFormat === v ? C.accent : C.border}` }}>
                    {v === "portrait" ? <FileText size={10}/> : <Printer size={10}/>} {label}
                  </button>
                ))}
              </div>
              <Btn small onClick={async () => {
                const bnNos = results.filter(r => r.success).map(r => r.bnNo).filter(Boolean);
                if (!bnNos.length) return;
                setBatchPrinting(true);
                try {
                  const res = await tiApi.printCombinedBillingNotes(bnNos, batchPrintFormat);
                  if (res && res.url) {
                    const a = document.createElement("a"); a.href = res.url; a.target = "_blank"; a.rel = "noopener noreferrer";
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  }
                  try { await tiApi.markBillingNotesPrinted(bnNos); } catch (_) {}
                } catch (err) { setActionError("พิมพ์ไม่สำเร็จ: " + err.message); }
                finally { setBatchPrinting(false); }
              }} disabled={batchPrinting}>
                {batchPrinting ? <Loader size={13}/> : <Printer size={13}/>} {batchPrinting ? "กำลังสร้าง..." : `พิมพ์ทั้งหมด (${successCount})`}
              </Btn>
            </>
          )}
          <span style={{ marginLeft: "auto" }}/>
          <Btn small onClick={() => { setResults([]); handleSearch(month, year); }}>
            <RefreshCw size={13}/> สร้างเพิ่ม
          </Btn>
          <Btn small primary onClick={onBack}>
            กลับหน้ารายการ
          </Btn>
        </div>

        {batchPrinting && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
            <Loader size={28} style={{ color: C.accent, animation: "spin 1s linear infinite" }}/>
            <div style={{ fontSize: 15, fontWeight: 500 }}>กำลังสร้าง PDF สำหรับพิมพ์...</div>
            <div style={{ fontSize: 13, color: C.muted }}>{printSel.size || results.filter(r => r.success).length} ใบวางบิล</div>
          </div>
        )}
      </div>
    );
  }

  // ── Main review / All-done ──
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B", flexShrink: 0 }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
      {/* top bar + summary cards */}
      <div style={{ flexShrink: 0, paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={13}/> กลับ
          </button>
          <span style={{ fontSize: 15, fontWeight: 500 }}>สร้างใบวางบิลแบบรวม</span>
        </div>

        {/* summary cards */}
        {searched && pendingCustomers.length > 0 && (() => {
          const totalCust = pendingCustomers.length;
          const selCust = selectedCustomers.length;
          const allTiCount = pendingCustomers.reduce((s, c) => s + c.invoices.filter(inv => !inv.bnNo).length, 0);
          const selTiCount = totalTIs;
          const allTotal = pendingCustomers.reduce((s, c) => s + c.invoices.filter(inv => !inv.bnNo).reduce((t, inv) => t + (parseFloat(inv.total) || 0), 0), 0);
          const selTotal = grandTotal;
          const hasExclusions = editMode && (selCust < totalCust || selTiCount < allTiCount);
          return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ background: C.cardBg, border: `0.5px solid ${hasExclusions ? C.accent : C.border}`, borderRadius: 10, padding: "14px 20px" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>ลูกค้า</div>
              {hasExclusions && selCust < totalCust
                ? <div style={{ fontSize: 26, fontWeight: 500 }}>{selCust}<span style={{ fontSize: 16, color: C.muted, fontWeight: 400 }}>/{totalCust}</span> <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>ราย</span></div>
                : <div style={{ fontSize: 26, fontWeight: 500 }}>{totalCust} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>ราย</span></div>
              }
            </div>
            <div style={{ background: C.cardBg, border: `0.5px solid ${hasExclusions ? C.accent : C.border}`, borderRadius: 10, padding: "14px 20px" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>ใบกำกับภาษี</div>
              {hasExclusions && selTiCount < allTiCount
                ? <div style={{ fontSize: 26, fontWeight: 500 }}>{selTiCount}<span style={{ fontSize: 16, color: C.muted, fontWeight: 400 }}>/{allTiCount}</span> <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>ฉบับ</span></div>
                : <div style={{ fontSize: 26, fontWeight: 500 }}>{allTiCount} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>ฉบับ</span></div>
              }
            </div>
            <div style={{ background: C.cardBg, border: `0.5px solid ${hasExclusions ? C.accent : C.border}`, borderRadius: 10, padding: "14px 20px" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>ยอดรวม</div>
              {hasExclusions && selTotal < allTotal
                ? <div><div style={{ fontSize: 26, fontWeight: 500, color: C.accent }}>{fmtAmt(selTotal)}</div><div style={{ fontSize: 11, color: C.muted, textDecoration: "line-through" }}>{fmtAmt(allTotal)}</div></div>
                : <div style={{ fontSize: 26, fontWeight: 500, color: C.accent }}>{fmtAmt(allTotal)}</div>
              }
            </div>
          </div>
          );
        })()}

        {/* action bar */}
        <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <DateRangePicker monthOnly startDate={`${year}-${String(month).padStart(2,"0")}-01`} endDate=""
            onApply={(s) => { if (!s) return; const d = new Date(s); setMonth(d.getMonth()+1); setYear(d.getFullYear()); handleSearch(d.getMonth()+1, d.getFullYear()); }} />
          <Btn small primary onClick={() => handleSearch(month, year)} disabled={loading}>
            {loading ? <Loader size={13}/> : <RefreshCw size={13}/>} รีเฟรช
          </Btn>
          {searched && pendingCustomers.length > 0 && (
            <>
              <span style={{ marginLeft: "auto" }}/>
              <Btn small onClick={() => setEditMode(!editMode)} style={editMode ? { background: "#eef2ff", border: `1px solid ${C.accent}`, color: C.accent } : {}}>
                <Pencil size={12}/> {editMode ? "เสร็จสิ้น" : "แก้ไขรายการ"}
              </Btn>
              <Btn small primary onClick={() => setShowConfirm(true)} disabled={creating || selectedCustomers.length === 0}>
                <Check size={13}/> {editMode ? `สร้าง ${selectedCustomers.length} ราย` : `สร้างทั้งหมด (${pendingCustomers.length} ราย)`}
              </Btn>
            </>
          )}
        </div>
        {error && <div style={{ marginTop: 8 }}><ErrorBox msg={error} onRetry={() => handleSearch()} /></div>}
      </div>

      {/* loading */}
      {loading && <Spinner text="กำลังดึงข้อมูลใบกำกับภาษี..." />}
      {!loading && searched && pendingCustomers.length === 0 && customers.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>ไม่มีใบกำกับภาษีในเดือนนี้</div>
      )}

      {/* all-done view */}
      {!loading && searched && pendingCustomers.length === 0 && customers.length > 0 && (() => {
        const generatedCustomers = customers.filter(c => c.generated);
        const allBnNos = [...new Set(generatedCustomers.flatMap(c => (c.invoices || []).map(inv => inv.bnNo).filter(Boolean)))];
        const allTiCount = generatedCustomers.reduce((s, c) => s + (c.invoices || []).length, 0);
        const allAmount = generatedCustomers.reduce((s, c) => s + (c.invoices || []).reduce((t, inv) => t + (parseFloat(inv.total) || 0), 0), 0);
        const enterPrintMode = () => { setPrintSel(new Set(allBnNos)); setPrintMode(true); };
        const exitPrintMode = () => { setPrintMode(false); };
        const togglePrintSel = (bn) => setPrintSel(prev => { const s = new Set(prev); s.has(bn) ? s.delete(bn) : s.add(bn); return s; });
        const togglePrintAll = () => setPrintSel(prev => prev.size === allBnNos.length ? new Set() : new Set(allBnNos));
        return (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {/* summary cards — all done */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "14px 20px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>ลูกค้า</div>
                <div style={{ fontSize: 26, fontWeight: 500 }}>{generatedCustomers.length} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>ราย</span></div>
              </div>
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "14px 20px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>ใบวางบิล</div>
                <div style={{ fontSize: 26, fontWeight: 500 }}>{allBnNos.length} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>ฉบับ</span></div>
              </div>
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "14px 20px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>ยอดรวม</div>
                <div style={{ fontSize: 26, fontWeight: 500, color: C.accent }}>{fmtAmt(allAmount)}</div>
              </div>
            </div>

            {/* done banner */}
            <div style={{ background: C.successBg, border: `1px solid ${C.success}`, borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontSize: 13, color: C.success, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span><CheckCircle size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>วางบิลครบทุกรายแล้ว — {allBnNos.length} ใบวางบิล รวม {allTiCount} ฉบับ TI</span>
              {!printMode && (
                <Btn small onClick={enterPrintMode} style={{ flexShrink: 0 }}>
                  <Printer size={13}/> พิมพ์
                </Btn>
              )}
            </div>

            {/* generated customer list */}
            <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f0f4f8" }}>
                    {printMode && (
                      <th style={{ padding: "8px 10px", width: 36, textAlign: "center" }}>
                        <input type="checkbox" checked={printSel.size === allBnNos.length} onChange={togglePrintAll} style={{ cursor: "pointer" }} />
                      </th>
                    )}
                    <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: C.muted }}>ลูกค้า</th>
                    <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: C.muted }}>เลขที่ใบวางบิล</th>
                    <th style={{ padding: "8px 14px", textAlign: "center", fontSize: 11, fontWeight: 500, color: C.muted }}>จำนวน TI</th>
                    <th style={{ padding: "8px 16px", textAlign: "right", fontSize: 11, fontWeight: 500, color: C.muted }}>ยอดรวม</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedCustomers.map((cust, i) => {
                    const bnNo = (cust.invoices || []).find(inv => inv.bnNo)?.bnNo || "—";
                    const tiCount = (cust.invoices || []).length;
                    const amount = (cust.invoices || []).reduce((s, inv) => s + (parseFloat(inv.total) || 0), 0);
                    const isSelected = printMode && printSel.has(bnNo);
                    return (
                      <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}`, opacity: printMode && !isSelected ? 0.4 : 1, transition: "opacity 0.15s" }}>
                        {printMode && (
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>
                            <input type="checkbox" checked={isSelected} onChange={() => togglePrintSel(bnNo)} style={{ cursor: "pointer" }} />
                          </td>
                        )}
                        <td style={{ padding: "8px 16px", fontWeight: 500 }}>{cust.customer}</td>
                        <td style={{ padding: "8px 14px", color: C.accent }}>{bnNo}</td>
                        <td style={{ padding: "8px 14px", textAlign: "center", color: C.muted }}>{tiCount}</td>
                        <td style={{ padding: "8px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>

            {/* print mode footer */}
            {printMode && (
              <div style={{ flexShrink: 0, padding: "14px 0", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "inline-flex", gap: 2 }}>
                  {[["portrait", "PDF"], ["landscape", "แบบพิมพ์"]].map(([v, label]) => (
                    <button key={v} onClick={() => setBatchPrintFormat(v)} disabled={batchPrinting}
                      style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, cursor: batchPrinting ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 3,
                        background: batchPrintFormat === v ? C.accent : "white", color: batchPrintFormat === v ? "white" : C.muted,
                        border: `0.5px solid ${batchPrintFormat === v ? C.accent : C.border}` }}>
                      {v === "portrait" ? <FileText size={10}/> : <Printer size={10}/>} {label}
                    </button>
                  ))}
                </div>
                <Btn small primary onClick={async () => {
                  const bnNos = [...printSel].filter(Boolean);
                  if (!bnNos.length) return;
                  setBatchPrinting(true);
                  try {
                    const res = await tiApi.printCombinedBillingNotes(bnNos, batchPrintFormat);
                    if (res && res.url) {
                      const a = document.createElement("a"); a.href = res.url; a.target = "_blank"; a.rel = "noopener noreferrer";
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    }
                    try { await tiApi.markBillingNotesPrinted(bnNos); } catch (_) {}
                    exitPrintMode();
                  } catch (err) { setActionError("พิมพ์ไม่สำเร็จ: " + err.message); }
                  finally { setBatchPrinting(false); }
                }} disabled={batchPrinting || printSel.size === 0}>
                  {batchPrinting ? <Loader size={13}/> : <Printer size={13}/>} {batchPrinting ? "กำลังสร้าง..." : `พิมพ์ที่เลือก (${printSel.size})`}
                </Btn>
                <Btn small onClick={exitPrintMode} disabled={batchPrinting}>ยกเลิก</Btn>
              </div>
            )}
          </div>
        );
      })()}

      {/* pending customers — main review list */}
      {!loading && searched && pendingCustomers.length > 0 && (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {/* select all row (edit mode only) */}
            {editMode && (
              <div style={{ padding: "8px 16px", background: "#f8f9fb", borderBottom: `0.5px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={pendingCustomers.every(c => c.checked)} onChange={selectAll} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: C.muted }}>เลือกทั้งหมด ({pendingCustomers.length} ราย)</span>
                {selectedCustomers.length < pendingCustomers.length && (
                  <span style={{ fontSize: 11, color: "#e67700", marginLeft: "auto" }}>ข้าม {pendingCustomers.length - selectedCustomers.length} ราย</span>
                )}
              </div>
            )}
            {customers.map((cust, ci) => {
              if (cust.generated) return null;
              const unbilled = cust.invoices.filter(inv => !inv.bnNo);
              const custTotal = unbilled.reduce((s, inv) => s + (parseFloat(inv.total) || 0), 0);
              const isExpanded = expanded[cust.customer];
              const excluded = editMode && !cust.checked;
              return (
                <div key={ci} style={{ borderBottom: `0.5px solid ${C.borderLight}`, opacity: excluded ? 0.4 : 1, transition: "opacity 0.15s" }}>
                  {/* customer header */}
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                    onClick={() => toggleExpand(cust.customer)}>
                    {editMode && (
                      <input type="checkbox" checked={cust.checked} onChange={() => toggleCustomer(ci)} onClick={e => e.stopPropagation()} style={{ cursor: "pointer", flexShrink: 0 }} />
                    )}
                    <ChevronDown size={14} style={{ color: C.muted, flexShrink: 0, transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}/>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, textDecoration: excluded ? "line-through" : "none" }}>{cust.customer}</div>
                    <span style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{unbilled.length} ฉบับ</span>
                    <span style={{ fontSize: 12, fontWeight: 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmtAmt(custTotal)}</span>
                  </div>

                  {/* TI list (expanded) */}
                  {isExpanded && (
                    <div style={{ background: "#fafbfd", borderTop: `0.5px solid ${C.borderLight}` }}>
                      {/* already-billed TIs */}
                      {cust.invoices.filter(inv => inv.bnNo).length > 0 && (
                        <div style={{ padding: "4px 16px 4px 42px", fontSize: 10, color: C.muted, background: "#f5f5f5" }}>
                          วางบิลแล้ว: {cust.invoices.filter(inv => inv.bnNo).map(inv => inv.no).join(", ")}
                        </div>
                      )}
                      {/* unbilled TIs */}
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#f0f4f8" }}>
                            {editMode && <th style={{ width: 36, padding: "6px 10px" }}></th>}
                            <th style={{ padding: editMode ? "6px 14px" : "6px 16px 6px 42px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 500 }}>เลขที่ TI</th>
                            <th style={{ padding: "6px 14px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 500 }}>วันที่</th>
                            <th style={{ padding: "6px 16px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 500 }}>รวมเงิน</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unbilled.map((inv, di) => {
                            const origIdx = cust.invoices.indexOf(inv);
                            const isTiExp = expandedTi === inv.no;
                            const tiData = tiCache[inv.no] || null;
                            const tiItemCount = tiData ? (tiData.items||[]).filter(it => it.desc||it.qty||it.amount).length : null;
                            const tiExcluded = editMode && !inv.checked;
                            return (
                              <Fragment key={di}>
                                <tr style={{ borderBottom: isTiExp ? "none" : `0.5px solid ${C.borderLight}`, cursor: "pointer", background: isTiExp ? "#f0f6ff" : "white", opacity: tiExcluded ? 0.4 : 1, transition: "opacity 0.15s" }}
                                  onClick={() => toggleTiDetail(inv.no)}>
                                  {editMode && (
                                    <td style={{ padding: "6px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                                      <input type="checkbox" checked={inv.checked} onChange={() => toggleTI(ci, origIdx)} style={{ cursor: "pointer" }} />
                                    </td>
                                  )}
                                  <td style={{ padding: editMode ? "6px 14px" : "6px 16px 6px 42px", color: C.accent, fontWeight: 500, textDecoration: tiExcluded ? "line-through" : "none" }}>
                                    <ChevronDown size={11} style={{ verticalAlign: "middle", marginRight: 4, transform: isTiExp ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}/>{inv.no}
                                    {!isTiExp && tiItemCount != null && <span style={{ fontSize: 10.5, color: C.muted, fontWeight: 400, marginLeft: 8 }}>สินค้า {tiItemCount} รายการ</span>}
                                    {isTiExp && tiItemCount != null && <span style={{ fontSize: 10.5, color: C.muted, fontWeight: 400, marginLeft: 8 }}>{tiItemCount} รายการ ▼</span>}
                                  </td>
                                  <td style={{ padding: "6px 14px", color: C.muted }}>{fmtDateThai(inv.date)}</td>
                                  <td style={{ padding: "6px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(parseFloat(inv.total) || 0)}</td>
                                </tr>
                                {isTiExp && (
                                  <tr>
                                    <td colSpan={editMode ? 4 : 3} style={{ padding: 0, borderBottom: `0.5px solid ${C.borderLight}` }}>
                                      <div style={{ background: "#f8faff", padding: "10px 18px 14px" }}>
                                        {tiLoading === inv.no && <Spinner />}
                                        {tiData && (
                                          <>
                                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, marginBottom: 8 }}>
                                              <thead>
                                                <tr style={{ background: C.sidebar }}>
                                                  {["#", "รายการ", "ขนาด", "จำนวน", "หน่วยละ", "จำนวนเงิน"].map((h, hi) => (
                                                    <th key={hi} style={{ padding: "6px 8px", color: "white", fontWeight: 500, textAlign: hi >= 3 ? "right" : "left", fontSize: 10.5 }}>{h}</th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {(tiData.items||[]).filter(it => it.desc||it.qty||it.amount).map((it, ii) => (
                                                  <tr key={ii} style={{ background: ii%2===0 ? "white" : "#f5f7ff", borderBottom: `0.5px solid ${C.borderLight}` }}>
                                                    <td style={{ padding: "5px 8px", color: C.muted, textAlign: "center" }}>{ii+1}</td>
                                                    <td style={{ padding: "5px 8px" }}>{it.desc}</td>
                                                    <td style={{ padding: "5px 8px", color: C.muted }}>{it.desc2}</td>
                                                    <td style={{ padding: "5px 8px", textAlign: "right" }}>{it.qty}</td>
                                                    <td style={{ padding: "5px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(Number(it.unitPrice||0))}</td>
                                                    <td style={{ padding: "5px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(Number(it.amount||0))}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                              <tfoot>
                                                <tr style={{ background: "#eef2ff", borderTop: `1px solid ${C.border}` }}>
                                                  <td colSpan={5} style={{ padding: "7px 8px", textAlign: "right", fontWeight: 500 }}>รวมทั้งสิ้น</td>
                                                  <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: C.accent }}>{fmtAmt(tiData.grandTotal||0)}</td>
                                                </tr>
                                              </tfoot>
                                            </table>
                                            {tiData.pdfUrl && (
                                              <div style={{ textAlign: "right" }}>
                                                <a href={tiData.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                                  style={{ fontSize: 11, color: C.accent, border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "4px 10px", textDecoration: "none" }}>
                                                  <FileText size={11} style={{ verticalAlign: "middle", marginRight: 3 }}/> เปิด PDF
                                                </a>
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* confirm dialog */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowConfirm(false)}>
          <div style={{ background: "white", borderRadius: 12, padding: "28px 32px", width: 420, maxWidth: "90vw", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>ยืนยันการสร้างใบวางบิล</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
              <div>ลูกค้า: <strong>{selectedCustomers.length} ราย</strong></div>
              <div>ใบกำกับภาษี: <strong>{totalTIs} ฉบับ</strong></div>
              <div>ยอดรวม: <strong style={{ color: C.accent }}>{fmtAmt(grandTotal)}</strong></div>
              {editMode && selectedCustomers.length < pendingCustomers.length && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff8e6", borderRadius: 6, fontSize: 12, color: "#946200" }}>
                  ข้าม {pendingCustomers.length - selectedCustomers.length} ราย: {pendingCustomers.filter(c => !c.checked).map(c => c.customer).join(", ")}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn small onClick={() => setShowConfirm(false)}>ยกเลิก</Btn>
              <Btn small primary onClick={() => { setShowConfirm(false); handleBatchCreate(); }}>
                <Check size={13}/> ยืนยัน — สร้าง {selectedCustomers.length} ราย
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* progress overlay */}
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
          <Loader size={28} style={{ color: C.accent, animation: "spin 1s linear infinite" }}/>
          <div style={{ fontSize: 15, fontWeight: 500 }}>กำลังสร้างใบวางบิล...</div>
          <div style={{ fontSize: 13, color: C.muted }}>{progress.done}/{progress.total} — {progress.current}</div>
          <div style={{ width: 240, height: 6, background: C.borderLight, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`, height: "100%", background: C.accent, borderRadius: 3, transition: "width 0.3s" }}/>
          </div>
        </div>
      )}

      {/* batch print overlay */}
      {batchPrinting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
          <Loader size={28} style={{ color: C.accent, animation: "spin 1s linear infinite" }}/>
          <div style={{ fontSize: 15, fontWeight: 500 }}>กำลังสร้าง PDF สำหรับพิมพ์...</div>
          <div style={{ fontSize: 13, color: C.muted }}>{printSel.size || results.filter(r => r.success).length} ใบวางบิล</div>
        </div>
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
  const [nextBnNo, setNextBnNo]       = useState(() => `${new Date().getFullYear().toString().slice(-2)}-BN-000001`);
  const [printQueue, setPrintQueue]   = useState([]);
  const [printFormat, setPrintFormat] = useState("portrait");
  const [printing, setPrinting]       = useState(false);
  const [tiPopup, setTiPopup]         = useState(null);
  const [tiCacheBN, setTiCacheBN]     = useState({});
  const [monthCache, setMonthCache]   = useState({});
  const [ptLoading, setPtLoading]     = useState(false);
  const [configCustomers, setConfigCustomers] = useState([]); // #376b — for address/phone enrichment
  const [actionError, setActionError] = useState(null);
  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 5000);
    return () => clearTimeout(t);
  }, [actionError]);

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
        // #376b — enrich with TI customer master address/phone
        const cfg = configCustomers.find(c => c.name === cust.customer);
        const enriched = { ...cust, address: cfg ? cfg.address || "" : cust.address || "", phone: cfg ? cfg.phone || "" : cust.phone || "" };
        if (enriched.generated) {
          const billedInv = (enriched.invoices || []).find(inv => inv.bnNo);
          const bnNo = billedInv ? billedInv.bnNo : null;
          const rec  = bnNo ? bnByNo[bnNo] : null;
          return { ...enriched, generated: true, createdBnNo: bnNo,
            createdDate:  rec ? rec.date  : null,
            createdCount: rec ? rec.count : (enriched.invoices || []).length,
            createdTotal: rec ? rec.total : 0,
            createdPdfUrl: rec ? rec.pdfUrl : null };
        }
        return { ...enriched, generated: false, createdBnNo: null, createdPdfUrl: null };
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
  // #376b — fetch TI customers once on mount for address/phone enrichment
  useEffect(() => { tiApi.getCustomers("").then(list => setConfigCustomers(list || [])).catch(() => {}); }, []);

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
    } catch (e) { setActionError("เกิดข้อผิดพลาด: " + e.message); }
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
      {actionError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#991B1B", flexShrink: 0 }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 600, fontSize: 15 }}>×</button>
        </div>
      )}
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
          <Btn small primary onClick={() => handleSearch(month, year, true)} disabled={loading}>
            {loading ? <Loader size={13}/> : <RefreshCw size={13}/>} รีเฟรช
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
                    : <div style={{ fontSize: 10, color: C.muted }}>{cust.invoices.length} ฉบับ · {fmtAmt(total)}</div>}
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
                onTiEdited={(tiNo, newTotal) => setCustomers(prev => prev.map((c, i) => i === selectedIdx ? { ...c, invoices: (c.invoices || []).map(v => v.no === tiNo ? { ...v, total: newTotal } : v) } : c))}
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
                  <div><div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>รวมเงิน</div><div style={{ fontWeight: 600, color: C.accent }}>{fmtAmt(selectedCust.createdTotal||0)}</div></div>
                  <div style={{ alignSelf: "flex-end" }}>
                    <Btn small onClick={handleGenBnPdf} disabled={ptLoading}>
                      {ptLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF
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
                            <td style={{ padding: "7px 14px", color: C.muted }}>{fmtDateThai(inv.date)}</td>
                            <td style={{ padding: "7px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(parseFloat(inv.total)||0)}</td>
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
                      {["เลขที่ใบวางบิล","ลูกค้า","ฉบับ","รวมเงิน"].map((h, i) => (
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
                        <td style={{ padding: "6px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtAmt(q.total||0)}</td>
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
  const bnList = cache["bntiList"] || [];
  const [listLoading, setListLoading] = useState(!cache["bntiList"]);
  const [listError, setListError]     = useState("");
  const detailKey = no => "bntiDetail_" + no;

  const loadBnList = async () => {
    setListLoading(true); setListError("");
    try {
      const data = await tiApi.getBillingNotes();
      updateCache("bntiList", Array.isArray(data) ? data : []);
    } catch (err) { setListError(err.message); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (!cache?.["bntiList"]) loadBnList(); }, []);

  if (view === "create") return <BNCreateView onBack={() => { updateCache("bntiList", null); loadBnList(); setView("list"); }} />;
  if (view === "batchCreate") return <BNTIBatchCreateView onBack={() => { updateCache("bntiList", null); loadBnList(); setView("list"); }} />;
  if (view === "detail") return <BNDetailView bnNo={selectedBnNo} onBack={() => setView("list")}
    cachedDetail={cache[detailKey(selectedBnNo)]}
    onDetailCached={(no, d) => updateCache(detailKey(no), d)}
    onSaved={() => { updateCache(detailKey(selectedBnNo), null); updateCache("bntiList", null); loadBnList(); }} />;

  return (
    <BNListView
      bnList={bnList}
      loading={listLoading}
      error={listError}
      onRefresh={loadBnList}
      onCreateSingle={() => setView("create", "สร้างใบวางบิล")}
      onCreateBatch={() => setView("batchCreate", "สร้างแบบรวม")}
      onRowClick={bn => { updateCache(detailKey(bn.bnNo), bn); setSelectedBnNo(bn.bnNo); setView("detail", bn.bnNo); }}
    />
  );
}


export { BillingNoteTIPage };
