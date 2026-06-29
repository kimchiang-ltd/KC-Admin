// ============================================================
// Invoice Module — ใบส่งของ (DN) + ใบวางบิล (BN)
// ============================================================
// Phase 5 (#208) — extracted from KCFactory.jsx v1.4.165 (2026-06-27)
// DeliveryNoteForm, DeliveryNoteDetail, DateRangePicker, DeliveryNotePage
// BNPreviewModal, DNDetailPopup, BNEditForm, BNDetailView, BNListView,
// BNDetailMiniPopup, BNCustomerPanel, BNCreateView, BillingNotePage

import React, { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { FileText, ClipboardList, Calendar, Check, CheckCircle, Square, Pencil, Save, Search, RefreshCw, Loader, Plus, ChevronLeft, ChevronRight, ChevronDown, Printer, QrCode, Smartphone, AlertCircle, Eye } from "lucide-react";
import { api } from '../../shared/api.jsx';
import { C, SECTION_COLORS, PAGE_SIZE, ITEMS_COUNT, DN_MAX_ROWS, emptyItem, DESC_MAX, DETAIL_WARN, DETAIL_MAX, SIMILARITY_THRESHOLD, DN_ZERO_WIDTH, DESC_MAX_DN_L, DETAIL_WARN_DN_L, DETAIL_MAX_DN_L } from '../../shared/constants.jsx';
import { descWidth, descWidthV2, getDescText, customerSimilarity, findSimilarCustomers, collapseItems, toDownloadUrl } from '../../shared/utils.jsx';
import { useInvoiceForm, initInvoiceItems } from '../../shared/hooks.jsx';
import { Badge, Btn, inputStyle, SectionTitle, Spinner, ErrorBox, Paginator, ConfirmModal, CustomerFieldSyncModal, INSTR_STEPS, renderPhoneScreen } from '../../shared/ui.jsx';
import { CustomerAutocomplete, ProductAutocomplete } from '../../shared/autocomplete.jsx';

function DeliveryNoteForm({ initial, onSave, onCancel, isEdit, products, setProducts, sizes }) {
  const [date, setDate]       = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [name, setName]       = useState(initial?.name || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [phone, setPhone]     = useState(initial?.phone || "");
  const {
    items, removedOrigItems, saving, error, pendingDelete, setPendingDelete,
    rowEditMode, setRowEditMode, allCustomers, setAllCustomers,
    custWarning, setCustWarning, newCustWarning, setNewCustWarning,
    productWarning, setProductWarning, addingProduct, setAddingProduct,
    custConfirmedRef, skipCustomerLogRef, nameSelectedFromListRef,
    checkProductName, checkNameSimilarity, checkNameOnBlur, updateItem, updateDetail,
    addRow, addContinuationRow, removeRow, cellInput, guardedSave,
    newCustCheckedRef,
  } = useInvoiceForm({ initial, isEdit, products, detailAttr: "data-detail-idx", maxRows: DN_MAX_ROWS });

  const total = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

  // #214 — per-field on-blur customer sync (iii-soft: cache "yes" only; "no" doesn't suppress re-prompt)
  const [syncDecisions, setSyncDecisions] = useState({}); // { address: 'yes', phone: 'yes', ... }
  const [pendingField, setPendingField]   = useState(null); // { field, oldValue, newValue } | null

  const findCustomerRecord = () => allCustomers.find(c => (c.name||"").trim().toLowerCase() === (name||"").trim().toLowerCase());

  const checkFieldOnBlur = (field, val) => {
    if (syncDecisions[field] === 'yes') return; // already opted in
    const record = findCustomerRecord();
    if (!record) return; // new customer or not in DB — skip
    const cur = (val || "").trim();
    const old = (record[field] || "").trim();
    if (!cur || cur === old) return;
    setPendingField({ field, oldValue: old, newValue: cur });
  };

  const handleFieldConfirm = () => { setSyncDecisions(d => ({ ...d, [pendingField.field]: 'yes' })); setPendingField(null); };
  const handleFieldSkip    = () => { setPendingField(null); }; // soft mode — don't cache "no"

  // reset cached decisions when customer name changes (different customer = different record)
  useEffect(() => { setSyncDecisions({}); }, [name]);

  const handleSave = () => guardedSave(name, async ({ filled, cleanItems, skipLog }) => {
    const payload = {
      date, name, address, phone, items: cleanItems, total,
      ...(isEdit ? { _logAdded: filled.filter(it => !it._orig).length, _logDeleted: removedOrigItems } : { skipAutoLog: skipLog })
    };
    const result = isEdit
      ? await api.updateDeliveryNote(initial.id, payload)
      : await api.createDeliveryNote(payload);
    // #214 — apply cached "yes" decisions to customer record (fire-and-forget)
    const yesFields = Object.keys(syncDecisions).filter(f => syncDecisions[f] === 'yes');
    if (yesFields.length > 0) {
      const record = findCustomerRecord();
      if (record) {
        const update = { ...record };
        const formValues = { address, phone };
        for (const f of yesFields) update[f] = formValues[f];
        api.updateCustomer(name, update).catch(() => {});
      }
    }
    onSave({ ...payload, id: result.invoiceNo || initial?.id, pdfUrl: result.pdfUrl || initial?.pdfUrl });
  });

  return (
    <>
    {pendingField && <CustomerFieldSyncModal name={name} field={pendingField.field} oldValue={pendingField.oldValue} newValue={pendingField.newValue} onConfirm={handleFieldConfirm} onCancel={handleFieldSkip} />}
    {pendingDelete !== null && <ConfirmModal message="ยืนยันลบ?" onConfirm={() => { removeRow(pendingDelete); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} enterConfirm />}
    {/* #135 — "ใช่ ใช้ชื่อนี้" auto-fills name/address/phone from matched customer; "ไม่ ใช้ชื่อที่พิมพ์" proceeds with typed name */}
    {custWarning && <ConfirmModal
      message={`พบชื่อที่คล้ายกันในระบบ:\n"${custWarning.map(c => c.name).join('", "')}"\n\nหมายถึงลูกค้านี้ใช่ไหม?`}
      onConfirm={() => { const m = custWarning[0]; setName(m.name); setAddress(m.address || ""); setPhone(m.phone || ""); custConfirmedRef.current = true; setCustWarning(null); }}
      secondaryLabel="ไม่ ใช้ชื่อที่พิมพ์"
      onSecondary={() => {
        custConfirmedRef.current = true; setCustWarning(null);
        // #160 — user confirmed typed name; now check if it's unknown
        const isKnown = allCustomers.some(c => (c.name || "").trim().toLowerCase() === name.trim().toLowerCase());
        if (!isKnown && name.trim()) setNewCustWarning(name.trim());
        else newCustCheckedRef.current = true;
      }}
      onCancel={() => setCustWarning(null)}
      confirmLabel="ใช่ ใช้ชื่อนี้"
    />}
    {newCustWarning && <ConfirmModal
      message={`ลูกค้า "${newCustWarning}" ยังไม่มีในระบบ — บันทึกเป็นลูกค้าใหม่ด้วยหรือไม่?`}
      onConfirm={() => { newCustCheckedRef.current = true; custConfirmedRef.current = true; setNewCustWarning(null); }}
      secondaryLabel="ไม่ ไม่ต้องเพิ่ม"
      onSecondary={() => { newCustCheckedRef.current = true; custConfirmedRef.current = true; skipCustomerLogRef.current = true; setNewCustWarning(null); }}
      onCancel={() => setNewCustWarning(null)}
      confirmLabel="ใช่ เพิ่มลูกค้าใหม่"
    />}
    {productWarning && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        <div style={{ background: "white", borderRadius: 10, padding: "24px 28px", minWidth: 300, maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>ไม่พบ "{productWarning.name}" ในรายการสินค้า</div>
          {productWarning.similar.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>สินค้าที่ใกล้เคียง:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {productWarning.similar.map((s, i) => (
                  <button key={i} onMouseDown={e => { e.preventDefault(); updateItem(productWarning.rowIndex, "desc", s); setProductWarning(null); }}
                    style={{ padding: "5px 12px", borderRadius: 4, border: `1px solid ${C.accent}`, background: "#EEF2FF", cursor: "pointer", fontSize: 12, color: C.accent, fontWeight: 500 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {productWarning.similar.length === 0 && <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>ต้องการเพิ่มสินค้านี้เข้า Config_Products หรือยกเลิก?</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { setProductWarning(null); }} style={{ padding: "7px 16px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "white", cursor: "pointer", fontSize: 13 }}>ยกเลิก</button>
            <button disabled={addingProduct} onClick={async () => { setAddingProduct(true); try { await api.addProduct(productWarning.name); setProducts(prev => [...prev, productWarning.name]); } catch(e){} setAddingProduct(false); setProductWarning(null); }}
              style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: C.accent, cursor: addingProduct ? "not-allowed" : "pointer", fontSize: 13, color: "white", fontWeight: 500, opacity: addingProduct ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {addingProduct && <Loader size={13}/>}เพิ่มสินค้าใหม่
            </button>
          </div>
        </div>
      </div>
    )}
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <SectionTitle>ข้อมูลลูกค้า</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่</div><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อลูกค้า</div>
            <CustomerAutocomplete
              value={name}
              onChange={v => { setName(v); nameSelectedFromListRef.current = false; custConfirmedRef.current = false; newCustCheckedRef.current = false; }}
              onSelect={c => { setName(c.name); setAddress(c.address); setPhone(c.phone); nameSelectedFromListRef.current = true; custConfirmedRef.current = true; }}
              onCustomersLoaded={setAllCustomers}
              onBlur={() => { if (!nameSelectedFromListRef.current) checkNameOnBlur(name); }}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>โทรศัพท์</div><input value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => checkFieldOnBlur('phone', phone)} placeholder="เบอร์โทร" style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><input value={address} onChange={e => setAddress(e.target.value)} onBlur={() => checkFieldOnBlur('address', address)} placeholder="ที่อยู่" style={{ ...inputStyle, width: "100%" }} /></div>
      </div>

      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ marginBottom: 6 }}>
          <SectionTitle>รายการสินค้า <span style={{ fontSize: 10, fontWeight: 400, color: items.length >= DN_MAX_ROWS ? C.danger : items.length >= DN_MAX_ROWS - 2 ? C.warning : C.muted }}>({items.length}/{DN_MAX_ROWS} แถว · หน้าที่ {Math.ceil(items.length / 10) || 1}/{Math.ceil(DN_MAX_ROWS / 10)})</span></SectionTitle>
          <div><button onClick={() => setRowEditMode(m => !m)} style={{ fontSize: 12, color: rowEditMode ? "#2a7a3b" : C.danger, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{rowEditMode ? "เสร็จ" : "ลบ"}</button></div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.sidebar }}>
                <th style={{ padding: "7px 6px", width: 28 }}></th>
                {[{ l: "#", w: 32, a: "center" }, { l: "รายการ / Description", w: 170, a: "left" }, { l: "ขนาด", w: 90, a: "left" }, { l: "รายละเอียด", w: "auto", a: "left" }, { l: "จำนวน QTY", w: 80, a: "right" }, { l: "หน่วยละ", w: 90, a: "right" }, { l: "จำนวนเงิน", w: 100, a: "right" }].map((h, idx) => (
                  <th key={idx} style={{ padding: "7px 10px", color: "white", fontWeight: 500, fontSize: 11, textAlign: h.a, width: h.w }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.flatMap((it, i) => {
                const dw = descWidthV2(it.desc || ""); // #140: DN landscape desc 33mm col; descWidthV2 mirrors Code.gs
                const detailW = descWidthV2(it.detail || "");
                const atWarn  = detailW >= DETAIL_WARN_DN_L;
                const atLimit = dw >= DESC_MAX_DN_L || detailW >= DETAIL_MAX_DN_L;
                const rows = [];
                // Page-break divider between every 10 rows
                if (i > 0 && i % 10 === 0) {
                  const pageNum = Math.floor(i / 10) + 1;
                  rows.push(
                    <tr key={`divider-${i}`}>
                      <td colSpan={8} style={{ padding: "5px 10px", background: "#e8eeff", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.accent, borderTop: `1.5px dashed ${C.accent}`, borderBottom: `1.5px dashed ${C.accent}` }}>
                        ── หน้าที่ {pageNum} ──
                      </td>
                    </tr>
                  );
                }
                rows.push(
                <tr key={i} style={{ background: it._cont ? "#f5f7ff" : i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}`, borderLeft: atLimit ? `3px solid ${C.danger}` : atWarn ? `3px solid ${C.warning}` : it._cont ? `3px solid ${C.accent}` : "3px solid transparent" }}>
                  <td style={{ padding: "3px 4px", textAlign: "center" }}>
                    {rowEditMode && <button onClick={() => setPendingDelete(i)} title="ลบแถว" style={{ width: 14, height: 14, borderRadius: "50%", border: "none", background: "#e5534b", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0, fontWeight: 700 }}>−</button>}
                  </td>
                  <td style={{ padding: "3px 6px", color: C.muted, textAlign: "center", fontSize: 11 }}>
                    {it._cont ? <span style={{ color: C.accent, fontSize: 13 }}>↳</span> : i + 1}
                  </td>
                  <td style={{ padding: "3px 6px" }}>
                    {!it._cont && <ProductAutocomplete value={it.desc} onChange={v => updateItem(i, "desc", v)} onBlur={() => checkProductName(i, it.desc)} products={products} />}
                  </td>
                  <td style={{ padding: "3px 6px" }}>
                    {!it._cont && <select value={it.desc2} onChange={e => updateItem(i, "desc2", e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", cursor: "pointer" }}>
                      <option value="">— ขนาด —</option>
                      {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>}
                  </td>
                  <td style={{ padding: "3px 6px" }}>
                    {cellInput(i, "detail", "left", {
                      "data-detail-idx": i,
                      onChange: e => { if (descWidthV2(e.target.value) < DETAIL_MAX_DN_L) updateDetail(i, e.target.value); },
                      onKeyDown: e => { if (e.key === "Enter") { e.preventDefault(); addContinuationRow(i); } }
                    })}
                    {detailW >= DETAIL_MAX_DN_L - 1.1 && <div style={{ fontSize: 11, color: C.danger, marginTop: 1 }}>เต็มแล้ว — กด Enter เพื่อขึ้นบรรทัดใหม่</div>}
                    {detailW < DETAIL_MAX_DN_L - 1.1 && atWarn && <div style={{ fontSize: 11, color: C.warning, marginTop: 1 }}>ใกล้จะเต็ม — พิจารณากด Enter ขึ้นบรรทัดใหม่</div>}
                  </td>
                  <td style={{ padding: "3px 6px" }}>{!it._cont && cellInput(i, "qty", "right")}</td>
                  <td style={{ padding: "3px 6px" }}>{!it._cont && cellInput(i, "unitPrice", "right")}</td>
                  <td style={{ padding: "4px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: it.amount ? C.text : C.muted }}>
                    {!it._cont && (it.amount ? Number(it.amount).toLocaleString() : "—")}
                  </td>
                </tr>
                );
                return rows;
              })}
              <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                <td colSpan={7} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 500 }}>ยอดรวม</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: C.accent, fontSize: 13 }}>฿{total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ position: "sticky", bottom: 0, background: C.pageBg, paddingTop: 6, paddingBottom: 6 }}>
          <button onClick={addRow} disabled={items.length >= DN_MAX_ROWS} style={{ fontSize: 11, color: items.length >= DN_MAX_ROWS ? C.muted : C.accent, background: "none", border: `0.5px dashed ${items.length >= DN_MAX_ROWS ? C.muted : C.accent}`, borderRadius: 4, padding: "4px 12px", cursor: items.length >= DN_MAX_ROWS ? "not-allowed" : "pointer", width: "100%", opacity: items.length >= DN_MAX_ROWS ? 0.5 : 1 }}>+ เพิ่มแถว (สินค้าใหม่) {items.length >= DN_MAX_ROWS ? `— เต็ม ${DN_MAX_ROWS} แถวแล้ว` : ""}</button>
        </div>
      </div>

      {error && <div style={{ margin: "0 16px 8px", padding: "8px 12px", background: C.dangerBg, color: C.danger, borderRadius: 6, fontSize: 12 }}>⚠️ {error}</div>}

      <div style={{ padding: "10px 16px", background: "#fafafa", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn onClick={onCancel}>ยกเลิก</Btn>
        <Btn primary onClick={handleSave} disabled={saving || !name}>
          {saving ? <><Loader size={13}/> กำลังบันทึก...</> : (<><Save size={14}/> {isEdit ? "บันทึก" : "บันทึกและสร้าง PDF"}</>)}
        </Btn>
      </div>
    </div>
    </>
  );
}

// INSTR_STEPS, renderPhoneScreen — extracted to shared/ui.jsx
// toDownloadUrl — extracted to shared/utils.js

function DeliveryNoteDetail({ invoice, onBack, onSaved, products, setProducts, sizes, isCancelled }) {
  const [editing, setEditing]         = useState(false);
  const [data, setData]               = useState(invoice);
  const [lsLoading, setLsLoading]     = useState(false);
  const [ptLoading, setPtLoading]     = useState(false);
  const [ptMode, setPtMode]           = useState("original"); // "original" | "withCopy"
  const [ptDropOpen, setPtDropOpen]   = useState(false);
  const [portraitCopyUrl, setPortraitCopyUrl] = useState(""); // 2-page cache, session-only (not persisted)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading]         = useState(false);
  const [showQr, setShowQr]                       = useState(false);
  const [qrLoading, setQrLoading]                 = useState(false);
  const [qrUrl, setQrUrl]                         = useState("");
  const [qrDataUrl, setQrDataUrl]                 = useState("");
  const [showInstructions, setShowInstructions]   = useState(false);
  const [instrStep, setInstrStep]                 = useState(0);
  useEffect(() => {
    if (!showInstructions) { setInstrStep(0); return; }
    const iv = setInterval(() => setInstrStep(s => (s + 1) % INSTR_STEPS.length), 2500);
    return () => clearInterval(iv);
  }, [showInstructions]);

  const handleSave = (updated) => {
    setData({ ...data, ...updated, pdfUrl: "", portraitUrl: "" }); // clear so both PDFs regenerate after edit
    setPortraitCopyUrl(""); // clear 2-page cache too
    setEditing(false);
    onSaved?.(); // invalidate list cache + reload
  };

  const generateLandscape = async () => {
    // #4: use cached pdfUrl if available — skip backend call
    if (data.pdfUrl) {
      const a = document.createElement("a");
      a.href = data.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    setLsLoading(true);
    try {
      const result = await api.generateDeliveryNoteLandscapePDF(data.id);
      if (result.pdfUrl) {
        setData(d => ({ ...d, pdfUrl: result.pdfUrl }));
        const a = document.createElement("a");
        a.href = result.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setLsLoading(false); }
  };

  const generatePortrait = async (mode) => {
    const withCopy = (mode || ptMode) === "withCopy";
    const cached = withCopy ? portraitCopyUrl : data.portraitUrl;
    if (cached) {
      const a = document.createElement("a");
      a.href = cached; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    setPtLoading(true);
    try {
      const result = await api.generateDeliveryNotePortraitPDF(data.id, withCopy);
      if (result.pdfUrl) {
        if (withCopy) setPortraitCopyUrl(result.pdfUrl);
        else setData(d => ({ ...d, portraitUrl: result.pdfUrl }));
        const a = document.createElement("a");
        a.href = result.pdfUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setPtLoading(false); }
  };

  const handleQr = async () => {
    const url = data.portraitUrl || null;
    const generate = async (pdfUrl) => {
      const dlUrl = toDownloadUrl(pdfUrl);
      const dataUrl = await QRCode.toDataURL(dlUrl, { width: 280, margin: 2 });
      setQrUrl(dlUrl); setQrDataUrl(dataUrl); setShowQr(true); setShowInstructions(true);
    };
    if (url) { await generate(url); return; }
    setQrLoading(true);
    try {
      const result = await api.generateDeliveryNotePortraitPDF(data.id, false);
      if (result.pdfUrl) {
        setData(d => ({ ...d, portraitUrl: result.pdfUrl }));
        await generate(result.pdfUrl);
      }
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setQrLoading(false); }
  };

  const handleCancelInvoice = async () => {
    setCancelLoading(true);
    try { await api.cancelDeliveryNote(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); setShowCancelConfirm(false); }
  };
  const handleRestoreInvoice = async () => {
    setCancelLoading(true);
    try { await api.restoreDeliveryNote(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); }
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {data.id}</span>
      </div>
      <DeliveryNoteForm initial={data} onSave={handleSave} onCancel={() => setEditing(false)} isEdit products={products} setProducts={setProducts} sizes={sizes} />
    </div>
  );

  const filledItems = (data.items || []).filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
  return (
    <div>
      {showCancelConfirm && <ConfirmModal message={`ยืนยันยกเลิก ${data.id}?`} confirmLabel="ยืนยันยกเลิก" onConfirm={handleCancelInvoice} onCancel={() => setShowCancelConfirm(false)} loading={cancelLoading} enterConfirm />}
      {showQr && qrUrl && (
        <>
          {/* Backdrop */}
          <div onClick={() => { setShowQr(false); setShowInstructions(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200 }} />
          {/* QR Modal */}
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
          {/* Instruction Panel */}
          {showInstructions && (
            <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "33vw", minWidth: 320, background: "white", zIndex: 202, boxShadow: "-4px 0 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
              <style>{`@keyframes kc-pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.9}50%{transform:translate(-50%,-50%) scale(1.6);opacity:1}} @keyframes kc-fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>วิธีส่ง LINE บนมือถือ</span>
                <button onClick={() => setShowInstructions(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.muted, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
                {/* Phone mockup */}
                <div style={{ width: 200, height: 370, borderRadius: 30, border: "6px solid #222", background: "#222", position: "relative", boxShadow: "0 8px 36px rgba(0,0,0,0.35)", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 42, height: 4, background: "#444", borderRadius: 2 }} />
                  <div style={{ position: "absolute", top: 11, right: 22, width: 6, height: 6, background: "#444", borderRadius: "50%", border: "1px solid #555" }} />
                  {/* Screen */}
                  <div style={{ position: "absolute", top: 26, left: 5, right: 5, bottom: 34, borderRadius: 14, overflow: "hidden", background: "white" }}>
                    {renderPhoneScreen(instrStep)}
                    {/* Cursor dot */}
                    <div style={{ position: "absolute", left: INSTR_STEPS[instrStep].cx + "%", top: INSTR_STEPS[instrStep].cy + "%", width: 16, height: 16, borderRadius: "50%", background: "rgba(0,180,80,0.9)", border: "2px solid white", boxShadow: "0 1px 6px rgba(0,0,0,0.4)", animation: "kc-pulse 0.75s ease-in-out infinite", transition: "left 0.55s cubic-bezier(.4,0,.2,1), top 0.55s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                  {/* Android nav */}
                  <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                    {["▐▌", "○", "◁"].map((s, i) => <span key={i} style={{ fontSize: 10, color: "#777" }}>{s}</span>)}
                  </div>
                </div>
                {/* Step label */}
                <div key={instrStep} style={{ marginTop: 22, textAlign: "center", animation: "kc-fadein 0.3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ background: C.accent, color: "white", borderRadius: 10, fontSize: 11, padding: "2px 8px", flexShrink: 0 }}>{instrStep + 1}/{INSTR_STEPS.length}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{INSTR_STEPS[instrStep].label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted }}>{INSTR_STEPS[instrStep].sub}</div>
                </div>
                {/* Dots */}
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
          <span style={{ fontSize: 14, fontWeight: 500 }}>{data.id}</span>
          <Badge success={data.billed}>{data.billed ? "วางบิลแล้ว" : "รอวางบิล"}</Badge>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isCancelled ? (
            <Btn onClick={handleRestoreInvoice} disabled={cancelLoading}>{cancelLoading ? <Loader size={13}/> : null} กู้คืน</Btn>
          ) : (
            <>
              <Btn onClick={generateLandscape} disabled={lsLoading}>{lsLoading ? <Loader size={13}/> : <Printer size={14}/>} พิมพ์</Btn>
              <div style={{ position: "relative", display: "inline-flex" }}>
                {ptDropOpen && <div onClick={() => setPtDropOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />}
                <button onClick={() => generatePortrait()} disabled={ptLoading} style={{ background: "white", color: C.accent, border: `1px solid ${C.accent}`, borderRight: "none", padding: "6px 10px", borderRadius: "4px 0 0 4px", fontSize: 12, cursor: ptLoading ? "not-allowed" : "pointer", opacity: ptLoading ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  {ptLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF{ptMode === "withCopy" ? " +สำเนา" : ""}
                </button>
                <button onClick={() => setPtDropOpen(o => !o)} disabled={ptLoading} style={{ background: "white", color: C.accent, border: `1px solid ${C.accent}`, padding: "6px 7px", borderRadius: "0 4px 4px 0", fontSize: 11, cursor: ptLoading ? "not-allowed" : "pointer", opacity: ptLoading ? 0.6 : 1, lineHeight: 1 }}>▾</button>
                {ptDropOpen && (
                  <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 100, background: "white", border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: 160, marginTop: 3 }}>
                    {[{ value: "original", label: "ต้นฉบับ" }, { value: "withCopy", label: "ต้นฉบับ + สำเนา" }].map(opt => (
                      <div key={opt.value} onClick={() => { setPtMode(opt.value); setPtDropOpen(false); generatePortrait(opt.value); }} style={{ padding: "9px 14px", fontSize: 13, cursor: "pointer", background: ptMode === opt.value ? "#e8f3fc" : "white", color: ptMode === opt.value ? C.accent : C.text, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 12, color: C.accent }}>{ptMode === opt.value ? "✓" : ""}</span>{opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Btn onClick={handleQr} disabled={qrLoading}>{qrLoading ? <Loader size={13}/> : <QrCode size={14}/>} QR</Btn>
              <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
              <Btn danger onClick={() => { if (data.billed) { alert(`ใบส่งของนี้อยู่ใน ${data.bnNo || "BN"} แล้ว\nกรุณายกเลิก BN นั้นก่อน`); return; } setShowCancelConfirm(true); }} disabled={cancelLoading}>ยกเลิกใบนี้</Btn>
            </>
          )}
        </div>
      </div>
      {isCancelled && <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>ใบนี้ถูกยกเลิกแล้ว</div>}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[["เลขที่", data.id], ["วันที่", data.date ? new Date(data.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"], ["ชื่อลูกค้า", data.name], ["โทรศัพท์", data.phone || "—"]].map(([label, val]) => (
              <div key={label}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div></div>
            ))}
          </div>
          {data.address && <div style={{ marginTop: 12 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><div style={{ fontSize: 13 }}>{data.address}</div></div>}
        </div>
        <div style={{ padding: 16 }}>
          <SectionTitle>รายการสินค้า</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.sidebar }}>
                {["#", "รายการ", "ขนาด", "รายละเอียด", "จำนวน QTY", "หน่วยละ", "จำนวนเงิน"].map((h, i) => (
                  <th key={i} style={{ padding: "7px 12px", color: "white", fontWeight: 500, fontSize: 11, textAlign: i >= 4 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filledItems.map((it, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "8px 12px", color: C.muted, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ padding: "8px 12px" }}>{it.desc}</td>
                  <td style={{ padding: "8px 12px", color: C.muted }}>{it.desc2}</td>
                  <td style={{ padding: "8px 12px", color: C.muted }}>{it.detail}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>{it.qty}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.unitPrice).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{Number(it.amount).toLocaleString()}</td>
                </tr>
              ))}
              <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                <td colSpan={6} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 500 }}>ยอดรวมทั้งสิ้น</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: C.accent, fontSize: 14 }}>฿{(data.total || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// #122 — shared date filter: เดือน/ทั้งปี + year nav + month grid + optional custom range.
// Collapsed button shows current selection; click expands the panel inline (no portal → no clip).
// onApply(startDate, endDate) with "yyyy-MM-dd" (or "","" for all). monthOnly hides ทั้งปี/custom.
function DateRangePicker({ startDate, endDate, onApply, monthOnly }) {
  const mFull = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const mAbbr = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const now = new Date();
  const [open, setOpen]         = useState(false);
  const [mode, setMode]         = useState("month");
  const [year, setYear]         = useState(startDate ? new Date(startDate).getFullYear() : now.getFullYear());
  const [customOpen, setCustomOpen] = useState(false);
  const [cs, setCs]             = useState(startDate || "");
  const [ce, setCe]             = useState(endDate || "");

  const pad = n => String(n).padStart(2, "0");
  const monthRange = (y, m) => [`${y}-${pad(m+1)}-01`, `${y}-${pad(m+1)}-${pad(new Date(y, m+1, 0).getDate())}`];

  const labelFor = (s, e) => {
    if (monthOnly) { const d = s ? new Date(s) : now; return mFull[d.getMonth()] + " " + d.getFullYear(); }
    if (!s && !e) return "ทั้งหมด";
    const sd = s ? new Date(s) : null;
    if (sd && e) {
      const [ms, me] = monthRange(sd.getFullYear(), sd.getMonth());
      if (s === ms && e === me) return mFull[sd.getMonth()] + " " + sd.getFullYear();
      if (s === `${sd.getFullYear()}-01-01` && e === `${sd.getFullYear()}-12-31`) return "ทั้งปี " + sd.getFullYear();
    }
    return (s || "…") + " – " + (e || "…");
  };

  const fire      = (s, e) => { onApply(s, e); setOpen(false); };
  const pickMonth = (m)    => fire(...monthRange(year, m));
  const navBtn    = { width: 28, height: 28, borderRadius: "50%", border: `0.5px solid ${C.border}`, background: "white", cursor: "pointer", color: C.muted, fontSize: 14, lineHeight: 1 };
  const dIn       = { padding: "5px 8px", border: `0.5px solid ${C.border}`, borderRadius: 4, fontSize: 12, fontFamily: "inherit" };

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", border: `0.5px solid ${C.border}`, borderRadius: 4, background: "white", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.text }}>
        <Calendar size={13}/> {labelFor(startDate, endDate)} <ChevronDown size={12} style={{ color: C.muted }}/>
      </button>
      {open && (
        <div style={{ marginTop: 8, width: 290, background: "white", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.10)" }}>
          {!monthOnly && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[["month","เดือน"],["year","ทั้งปี"]].map(([v,l]) => (
                <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 12, cursor: "pointer", border: `0.5px solid ${mode===v?C.accent:C.border}`, background: mode===v?C.accent:"white", color: mode===v?"white":C.muted }}>{l}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => setYear(y => y-1)} style={navBtn} aria-label="ปีก่อน">‹</button>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{year}</span>
            <button onClick={() => { if (year < now.getFullYear()) setYear(y => y+1); }} style={navBtn} aria-label="ปีถัดไป">›</button>
          </div>
          {(monthOnly || mode === "month") && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {mAbbr.map((m, i) => {
                const future = year > now.getFullYear() || (year === now.getFullYear() && i > now.getMonth());
                const sel = startDate && new Date(startDate).getFullYear() === year && new Date(startDate).getMonth() === i;
                return <button key={i} disabled={future} onClick={() => pickMonth(i)} style={{ padding: "10px 0", borderRadius: 6, fontSize: 12, border: `0.5px solid ${sel?C.accent:C.borderLight}`, background: sel?C.accent:"white", color: sel?"white":(future?C.muted:C.text), cursor: future?"default":"pointer", opacity: future?0.4:1 }}>{m}</button>;
              })}
            </div>
          )}
          {!monthOnly && mode === "year" && (
            <button onClick={() => fire(`${year}-01-01`, `${year}-12-31`)} style={{ width: "100%", padding: "10px 0", borderRadius: 6, fontSize: 13, border: "none", background: C.accent, color: "white", cursor: "pointer" }}>เลือกทั้งปี {year}</button>
          )}
          {!monthOnly && (
            <div style={{ marginTop: 10, borderTop: `0.5px solid ${C.borderLight}`, paddingTop: 10 }}>
              <button onClick={() => setCustomOpen(o => !o)} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", padding: 0 }}>ระบุช่วงวันที่ (ไม่บังคับ)</button>
              {customOpen && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                  <input type="date" value={cs} onChange={e => setCs(e.target.value)} style={dIn}/>
                  <span style={{ fontSize: 12, color: C.muted }}>ถึง</span>
                  <input type="date" value={ce} onChange={e => setCe(e.target.value)} style={dIn}/>
                  <button onClick={() => fire(cs, ce)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "white", fontSize: 12, cursor: "pointer" }}>ใช้</button>
                </div>
              )}
              <button onClick={() => fire("", "")} style={{ display: "block", marginTop: 8, background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", padding: 0 }}>แสดงทั้งหมด</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeliveryNotePage({ products, setProducts, sizes, cache, updateCache, onViewChange, goListRequest }) {
  const [view, setView_]            = useState("list");
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  useEffect(() => { if (goListRequest) setView("list", null); }, [goListRequest]);
  const [selected, setSelected]     = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [startDate, setStartDate]   = useState(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); // #121 default = last 3 months
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [hovered, setHovered] = useState(null);
  // Cancelled section
  const [cancelSectionOpen, setCancelSectionOpen] = useState(false);
  const [cancelSearch,      setCancelSearch]      = useState("");
  const [cancelLoading,     setCancelLoading]     = useState(false);
  const [cancelledList,     setCancelledList]     = useState([]);
  const [page,              setPage]              = useState(1);
  useEffect(() => setPage(1), [search, startDate, endDate]);

  const cacheKey = "invoices_" + startDate + "_" + endDate;
  const invoices = cache[cacheKey] || [];

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getDeliveryNotes(startDate, endDate, search);
      const list = Array.isArray(data) ? data : [];
      updateCache(cacheKey, list);
      // #116 — seed shared DN store so opening any of these DNs (e.g. from BN) is instant, no getDNDetail fetch
      list.forEach(dn => { if (dn && dn.id) _dnStore[dn.id] = { dnNo: dn.id, date: dn.date, customer: dn.name, address: dn.address || "", phone: dn.phone || "", total: dn.total, pdfUrl: dn.pdfUrl, items: dn.items || [] }; });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, search]);

  useEffect(() => { if (!cache[cacheKey]) loadInvoices(); }, [cacheKey]);

  const loadCancelled = useCallback(async () => {
    setCancelLoading(true);
    try {
      const data = await api.getCancelledDeliveryNotes(cancelSearch);
      setCancelledList(Array.isArray(data) ? data : []);
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setCancelLoading(false); }
  }, [cancelSearch]);

  // #147 auto-load all cancelled items when section is expanded
  useEffect(() => { if (cancelSectionOpen) loadCancelled(); }, [cancelSectionOpen]);

  const handleSelect    = (inv) => { setSelected(inv); setView("detail", inv.id); };
  const handleCreateNew = () => { setSelected(null); setView("create", "สร้างใหม่"); };
  const handleSaveNew   = (result) => {
    setSuccessMsg(`สร้างใบส่งของ ${result.id} สำเร็จ!`);
    setSelected(result);
    setView("detail");
    loadInvoices();
    setTimeout(() => { setSuccessMsg(""); }, 2500);
  };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return !q || (inv.id || "").toLowerCase().includes(q) || (inv.name || "").toLowerCase().includes(q);
  });
  const pagedDN = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {successMsg && <div style={{ background: C.successBg, color: C.success, padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{successMsg}</div>}

      {view === "list" && (
        <div>
          <div style={{ position: "sticky", top: -18, zIndex: 10, background: C.pageBg }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}><FileText size={15}/> ใบส่งของ</div>
              <Btn primary onClick={handleCreateNew}>+ สร้างใบส่งของใหม่</Btn>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", border: `0.5px solid ${C.border}`, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap", borderRadius: "8px 8px 0 0" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาลูกค้า / เลขที่..."
                style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 200, height: 30, boxSizing: "border-box" }} />
              <DateRangePicker startDate={startDate} endDate={endDate} onApply={(s, e) => { setStartDate(s); setEndDate(e); }} />
              {loading && <Loader size={14}/>}
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {filtered.length} รายการ</span>
            </div>
          </div>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "clip", marginBottom: 14 }}>
            {error && <div style={{ padding: 14 }}><ErrorBox msg={error} onRetry={loadInvoices} /></div>}
            {loading && <Spinner />}
            {!loading && !error && (
              <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>{["เลขที่ใบส่งของ", "วันที่", "ชื่อลูกค้า", "รายการ", "ยอดรวม", "สถานะ"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 14px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", position: "sticky", top: 70, zIndex: 1 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบข้อมูล</td></tr>
                  ) : pagedDN.map(inv => (
                    <tr key={inv.id} onMouseEnter={() => setHovered(inv.id)} onMouseLeave={() => setHovered(null)}
                      style={{ background: hovered === inv.id ? C.rowHover : "white", borderBottom: `0.5px solid ${C.borderLight}` }}>
                      <td style={{ padding: "9px 14px" }}>
                        <a onClick={() => handleSelect(inv)} style={{ color: C.accent, cursor: "pointer", fontWeight: 500 }}>{inv.id}</a>
                      </td>
                      <td style={{ padding: "9px 14px", color: C.muted }}>
                        {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "9px 14px" }}>{inv.name}</td>
                      <td style={{ padding: "9px 14px", color: C.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(inv.items || []).filter(it => it.desc).map(it => it.desc + (it.desc2 ? " " + it.desc2 : "")).join(", ")}
                      </td>
                      <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(inv.total || 0).toLocaleString()}</td>
                      <td style={{ padding: "9px 14px" }}><Badge success={inv.billed}>{inv.billed ? "วางบิลแล้ว" : "รอวางบิล"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Paginator total={filtered.length} page={page} onChange={setPage} />
              </>
            )}
          </div>

          {/* Cancelled invoices section */}
          <div style={{ marginTop: 14 }}>
            <button onClick={() => setCancelSectionOpen(o => !o)}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
              {cancelSectionOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>} ใบที่ยกเลิก
            </button>
            {cancelSectionOpen && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
                <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>
                  <input value={cancelSearch} onChange={e => setCancelSearch(e.target.value)} placeholder="ค้นหาเลขที่ / ชื่อลูกค้า..."
                    onKeyDown={e => e.key === "Enter" && loadCancelled()}
                    style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 220 }} />
                  <Btn primary small onClick={loadCancelled} disabled={cancelLoading}>
                    {cancelLoading ? <Loader size={13}/> : <><Search size={13}/> ค้นหา</>}
                  </Btn>
                </div>
                {cancelLoading && <Spinner />}
                {!cancelLoading && cancelledList.length === 0 && (
                  <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 12 }}>กรอกชื่อลูกค้าหรือเลขที่แล้วกด ค้นหา</div>
                )}
                {!cancelLoading && cancelledList.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["เลขที่ใบส่งของ", "วันที่", "ชื่อลูกค้า", "ยอดรวม"].map((h, i) => (
                        <th key={i} style={{ padding: "8px 14px", textAlign: i === 3 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {cancelledList.map(inv => (
                        <tr key={inv.id} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                          <td style={{ padding: "9px 14px" }}>
                            <a onClick={() => { setSelected(inv); setView("cancelledDetail", inv.id); }} style={{ color: C.danger, cursor: "pointer", fontWeight: 500 }}>{inv.id}</a>
                          </td>
                          <td style={{ padding: "9px 14px", color: C.muted }}>
                            {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td style={{ padding: "9px 14px" }}>{inv.name}</td>
                          <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(inv.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {view === "detail" && selected && (
        <DeliveryNoteDetail invoice={selected} onBack={() => setView("list", null)} onSaved={() => { updateCache(cacheKey, null); loadInvoices(); }} products={products} setProducts={setProducts} sizes={sizes} />
      )}

      {view === "cancelledDetail" && selected && (
        <DeliveryNoteDetail invoice={selected} isCancelled={true} onBack={() => setView("list", null)}
          onSaved={() => { updateCache(cacheKey, null); loadInvoices(); setCancelledList(list => list.filter(i => i.id !== selected.id)); }}
          products={products} setProducts={setProducts} sizes={sizes} />
      )}

      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setView("list", null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> รายการใบส่งของ</button>
            <span style={{ color: C.muted }}>›</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>สร้างใบส่งของใหม่</span>
          </div>
          <DeliveryNoteForm onSave={handleSaveNew} onCancel={() => setView("list", null)} products={products} setProducts={setProducts} sizes={sizes} />
        </div>
      )}
    </div>
  );
}

// ── BN Preview Modal ───────────────────────────────────────

function BNPreviewModal({ customer, onClose, onConfirm, nextBnNo }) {
  const today = new Date().toISOString().slice(0, 10);
  const [bnDate, setBnDate]   = useState(today);
  const [address, setAddress] = useState(customer.address || "");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [format, setFormat]   = useState("portrait");
  const [rows, setRows]       = useState(
    customer.invoices.map((inv, i) => ({ ...inv, idx: i, checked: true }))
  );

  const addRow    = () => setRows([...rows, { no: "", date: "", total: "", idx: Date.now(), checked: true }]);
  const removeRow = (idx) => setRows(rows.filter(r => r.idx !== idx));
  const updateRow = (idx, field, val) => setRows(rows.map(r => r.idx === idx ? { ...r, [field]: val } : r));
  const toggleRow = (idx) => setRows(rows.map(r => r.idx === idx ? { ...r, checked: !r.checked } : r));

  const selectedRows = rows.filter(r => r.checked);
  const grandTotal   = selectedRows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const baht         = Math.floor(grandTotal);
  const satang       = Math.round((grandTotal - baht) * 100);

  // Compute invoice date range from selected rows for the API
  const getDateRange = () => {
    const dates = selectedRows.map(r => r.date).filter(Boolean).map(d => {
      // handle dd/MM/yyyy
      if (d.includes("/")) {
        const [dd, mm, yyyy] = d.split("/");
        return new Date(`${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`);
      }
      return new Date(d);
    }).filter(d => !isNaN(d));
    if (!dates.length) return { start: "", end: "" };
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    return {
      start: min.toISOString().slice(0, 10),
      end:   max.toISOString().slice(0, 10),
    };
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      const invoices = selectedRows.map(r => ({ dnNo: r.no, dnDate: r.date, amount: r.total }));
      const result = await api.confirmBN(customer.customer, nextBnNo, invoices, bnDate, address, customer.phone || "", format);
      onConfirm({ bnDate, address, dueDate, rows: selectedRows, grandTotal, bnNo: result.bnNo, pdfUrl: result.pdfUrl });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "20px 0" }}>
      <div style={{ background: "white", borderRadius: 10, width: 680, margin: "auto", overflow: "hidden" }}>

        <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.sidebar }}>
          <div style={{ color: "white", fontWeight: 500, fontSize: 14 }}>
            <><ClipboardList size={14}/> ตัวอย่างใบวางบิล — {customer.customer}</>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{nextBnNo}</span>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>✕ ปิด</button>
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${C.border}`, background: "#f8f9ff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่ออกบิล</div>
              <input type="date" value={bnDate} onChange={e => setBnDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="ที่อยู่ลูกค้า" style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันครบกำหนดชำระ</div>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: C.muted }}>รูปแบบ:</span>
            {["portrait", "landscape"].map(f => (
              <button key={f} onClick={() => setFormat(f)}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, cursor: "pointer", border: `1px solid ${format === f ? C.accent : C.border}`, background: format === f ? C.accent : "white", color: format === f ? "white" : C.text, fontWeight: format === f ? 500 : 400 }}>
                {f === "portrait" ? <><FileText size={12}/> PDF</> : <><Printer size={12}/> แบบพิมพ์</>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>KC</div>
              <div style={{ fontSize: 11, color: C.muted }}>หจก. โรงงานกิมเชียง</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12 }}>
              <div style={{ color: C.muted, fontSize: 11 }}>เลขที่</div>
              <div style={{ fontWeight: 500, color: C.accent }}>{nextBnNo}</div>
            </div>
          </div>

          <div style={{ background: "#555", color: "white", padding: "8px 14px", borderRadius: 4, marginBottom: 14, fontSize: 14, fontWeight: 500 }}>
            ใบวางบิล &nbsp;<span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Billing Note</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 12 }}>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: C.muted, minWidth: 40 }}>นาม</span><span style={{ fontWeight: 500 }}>{customer.customer}</span></div>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: C.muted, minWidth: 40 }}>ที่อยู่</span><span>{address || "—"}</span></div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
            <thead>
              <tr style={{ background: "#f0f4ff" }}>
                {["", "✓", "#", "เลขที่บิล", "วันที่บิล", "วันครบกำหนด", "บาท", "สต."].map((h, i) => (
                  <th key={i} style={{ padding: "6px 8px", textAlign: i >= 6 ? "right" : "left", fontWeight: 500, fontSize: 11, color: C.muted, borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const total  = parseFloat(row.total) || 0;
                const b      = Math.floor(total);
                const s      = Math.round((total - b) * 100);
                return (
                  <tr key={row.idx} style={{ background: row.checked ? "white" : "#fafafa", borderBottom: `0.5px solid ${C.borderLight}` }}>
                    <td style={{ padding: "4px 4px", textAlign: "center", width: 24 }}>
                      <button onClick={() => removeRow(row.idx)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: "0 2px", lineHeight: 1 }} title="ลบแถว">✕</button>
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <input type="checkbox" checked={row.checked} onChange={() => toggleRow(row.idx)} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center", color: C.muted, fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: "4px 8px" }}>
                      <input value={row.no} onChange={e => updateRow(row.idx, "no", e.target.value)}
                        style={{ border: "none", background: "transparent", fontSize: 12, width: "100%", outline: "none" }}
                        onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
                        onBlur={e => e.target.style.outline = "none"} />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <input value={row.date} onChange={e => updateRow(row.idx, "date", e.target.value)}
                        style={{ border: "none", background: "transparent", fontSize: 12, width: "100%", textAlign: "center", outline: "none" }}
                        onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
                        onBlur={e => e.target.style.outline = "none"} />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center", color: C.muted, fontSize: 11 }}>
                      {dueDate ? new Date(dueDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      <input value={row.total} onChange={e => updateRow(row.idx, "total", e.target.value)}
                        style={{ border: "none", background: "transparent", fontSize: 12, width: "100%", textAlign: "right", fontFamily: "monospace", outline: "none" }}
                        onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
                        onBlur={e => e.target.style.outline = "none"} />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: s > 0 ? C.text : C.muted }}>
                      {s > 0 ? String(s).padStart(2, "0") : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button onClick={addRow} style={{ fontSize: 11, color: C.accent, background: "none", border: `0.5px dashed ${C.accent}`, borderRadius: 4, padding: "4px 12px", cursor: "pointer", marginBottom: 12, width: "100%" }}>
            + เพิ่มแถว
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f0f4ff", borderRadius: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: C.muted }}>รวม <strong style={{ color: C.text }}>{selectedRows.length}</strong> ฉบับ</div>
            <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500, fontSize: 15, color: C.accent }}>
              รวมเงิน ฿{baht.toLocaleString()}{satang > 0 ? "." + String(satang).padStart(2, "0") : ""}
            </div>
          </div>
        </div>

        {error && <div style={{ margin: "0 20px 8px" }}><ErrorBox msg={error} /></div>}

        <div style={{ padding: "12px 20px", borderTop: `0.5px solid ${C.border}`, background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>{selectedRows.length} บิล · ฿{baht.toLocaleString()} · {nextBnNo}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={onClose}>ยกเลิก</Btn>
            <Btn primary onClick={handleConfirm} disabled={saving || selectedRows.length === 0}>
              {saving ? <><Loader size={13}/> กำลังสร้าง PDF...</> : <><Check size={13}/> ยืนยันและสร้าง PDF</>}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DN Detail Popup ─────────────────────────────────────────

// #116 — session-wide DN detail cache, shared across all popups (survives navigation).
// First open of a DN hits the backend once; every later open (anywhere) is instant.
const _dnStore = {};

function DNDetailPopup({ dnNo, onClose, cachedData, onCached }) {
  const seed = cachedData || _dnStore[dnNo] || null;
  const [data, setData]       = useState(seed);
  const [loading, setLoading] = useState(!seed);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (seed) return; // already have it (prop or session store)
    api.getDNDetail(dnNo)
      .then(d => { _dnStore[dnNo] = d; setData(d); onCached?.(dnNo, d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dnNo]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 10, width: 620, maxWidth: "92vw", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `0.5px solid ${C.border}`, position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.accent }}>{dnNo}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 22, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          {loading && <Spinner />}
          {error && <ErrorBox msg={error} />}
          {data && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 14 }}>
                {[["ลูกค้า", data.customer], ["วันที่", data.date], ["โทรศัพท์", data.phone || "—"], ["รวมเงิน", `฿${(data.total||0).toLocaleString()}`]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
                ))}
              </div>
              {data.address && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>ที่อยู่</div><div style={{ fontSize: 13 }}>{data.address}</div></div>}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.sidebar }}>
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
                  <tr style={{ background: "#f0f4ff", borderTop: `1px solid ${C.border}` }}>
                    <td colSpan={5} style={{ padding: "9px 10px", textAlign: "right", fontWeight: 500 }}>ยอดรวม</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: C.accent }}>฿{(data.total||0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              {data.pdfUrl && (
                <div style={{ marginTop: 14, textAlign: "right" }}>
                  <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: C.accent, border: `0.5px solid ${C.accent}`, borderRadius: 4, padding: "5px 12px", textDecoration: "none" }}>
                    <FileText size={12} style={{ verticalAlign: "middle", marginRight: 3 }}/> เปิด PDF
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
    api.getUnbilledDNsForCustomer(detail.customer || "")
      .then(d => setUnbilled(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setUBL(false));
  }, []);

  // reset cached decisions when customer name changes
  useEffect(() => { setSyncDecisions({}); setCustRecord(null); custFetchedRef.current = false; }, [customer]);

  const ensureCustRecord = async () => {
    if (custRecord) return custRecord;
    if (custFetchedRef.current) return null;
    custFetchedRef.current = true;
    try {
      const list = await api.getCustomers(customer);
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

  const removeDN = (no) => setInvoices(prev => prev.filter(inv => inv.no !== no));
  const addDN    = (dn) => {
    if (invoices.find(inv => inv.no === dn.no)) return;
    setInvoices(prev => [...prev, dn]);
  };
  const available = unbilled.filter(d => !invoices.find(inv => inv.no === d.no));

  const handleSave = async () => {
    setSaving(true);
    try {
      const origNos     = new Set((detail.invoices||[]).map(inv => inv.no));
      const newNos      = new Set(invoices.map(inv => inv.no));
      const addDnNos    = [...newNos].filter(n => !origNos.has(n));
      const removeDnNos = [...origNos].filter(n => !newNos.has(n));
      await api.editBillingNote(detail.bnNo, { date: dateInput, customer, address, phone, addDnNos, removeDnNos });
      // #214 — apply cached "yes" decisions
      const yesFields = Object.keys(syncDecisions).filter(f => syncDecisions[f] === 'yes');
      if (yesFields.length > 0 && custRecord) {
        const update = { ...custRecord };
        const formValues = { address, phone };
        for (const f of yesFields) update[f] = formValues[f];
        api.updateCustomer(customer, update).catch(() => {});
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
        {/* address + phone override (#124) */}
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
        <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500 }}>รายการใบส่งของในใบวางบิลนี้</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["เลขที่ DN", "วันที่", "รวมเงิน", ""].map((h, i) => (
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
                  <button onClick={() => removeDN(inv.no)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 18, lineHeight: 1 }} title="ลบออก">×</button>
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
          เพิ่มใบส่งของ (ยังไม่วางบิล) {unbilledLoading && <Loader size={11}/>}
        </div>
        {!unbilledLoading && available.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: C.muted, fontSize: 12 }}>ไม่มีใบส่งของที่รอวางบิล</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {available.map((dn, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td style={{ padding: "8px 14px", color: C.accent, fontWeight: 500 }}>{dn.no}</td>
                  <td style={{ padding: "8px 14px", color: C.muted }}>{dn.date}</td>
                  <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(dn.total||0).toLocaleString()}</td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }}>
                    <Btn small onClick={() => addDN(dn)}><Plus size={11}/> เพิ่ม</Btn>
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
  const [dnPopup, setDnPopup]             = useState(null);
  const [dnCache, setDnCache]             = useState({});
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
    if (cachedDetail) return; // use cache
    setLoading(true); setError("");
    api.getBillingNoteDetail(bnNo)
      .then(d => { setDetail(d); onDetailCached?.(bnNo, d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadDetail, [bnNo]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try { await api.cancelBillingNote(bnNo); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); setShowCC(false); }
  };

  const handleSaveEdit = (updated) => {
    setDetail(prev => ({ ...prev, ...updated, landscapeUrl: "", pdfUrl: "" })); // edit clears both PDF caches (#123, #125)
    setEditing(false);
    onSaved?.();
  };

  const generateLandscape = async () => {
    if (detail.landscapeUrl) {
      window.open(detail.landscapeUrl, "_blank", "noopener,noreferrer"); return;
    }
    setLsLoading(true);
    try {
      const res = await api.generateBillingNoteLandscapePDF(bnNo);
      if (res?.url) { setDetail(d => ({ ...d, landscapeUrl: res.url })); window.open(res.url, "_blank", "noopener,noreferrer"); }
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLsLoading(false); }
  };

  const generatePortrait = async () => {
    if (detail.pdfUrl) { window.open(detail.pdfUrl, "_blank", "noopener,noreferrer"); return; }
    setPtLoading(true);
    try {
      const res = await api.generateBillingNotePortraitPDF(bnNo);
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
      const res = await api.generateBillingNotePortraitPDF(bnNo);
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
      {dnPopup && <DNDetailPopup dnNo={dnPopup} onClose={() => setDnPopup(null)} cachedData={dnCache[dnPopup]} onCached={(no, d) => setDnCache(prev => ({ ...prev, [no]: d }))} />}
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

      {/* breadcrumb + actions */}
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
            <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
              ใบนี้ถูกยกเลิกแล้ว
            </div>
          )}

          {/* info card */}
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

          {/* DN table — click row for popup */}
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, fontWeight: 500 }}>รายการใบส่งของ — คลิกเพื่อดูรายละเอียด</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["เลขที่ DN","วันที่","รวมเงิน"].map((h,i) => (
                    <th key={i} style={{ padding: "7px 14px", textAlign: i===2?"right":"left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.invoices||[]).length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: C.muted }}>ไม่พบรายการ</td></tr>
                ) : (detail.invoices||[]).map((inv,i) => (
                  <tr key={i}
                    onClick={() => setDnPopup(inv.no)}
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
  const [search, setSearch]           = useState("");
  const [hovered, setHovered]         = useState(null);
  const [dStart, setDStart]           = useState(""); // #122 BN history date filter (client-side)
  const [dEnd, setDEnd]               = useState("");
  const [cancelOpen, setCancelOpen]   = useState(false);
  const [cancelHovered, setCancelHovered] = useState(null);
  const [page, setPage]               = useState(1);
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
            <FileText size={11} style={{ verticalAlign: "middle", marginRight: 3 }}/> PDF
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

      {/* Cancelled BN section */}
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

// ── BN Customer Panel (right pane) ─────────────────────────

// #182 — BN detail mini-popup: load detail + cancel BN inline, used from BNCustomerPanel
function BNDetailMiniPopup({ bnNo, onClose, onCancelled }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [confirming, setConf]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.getBillingNoteDetail(bnNo)
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bnNo]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.cancelBillingNote(bnNo);
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
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>รายการใบส่งของ</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    {["เลขที่ DN", "วันที่", "รวมเงิน"].map((h, i) => (
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
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>{bnNo} จะถูกยกเลิก และ DN ทั้งหมดในใบนี้จะถูกปลดออก — สามารถรวมใน BN ใหม่ได้ทันที</div>
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

function BNCustomerPanel({ cust, nextBnNo, onConfirm }) {
  const today = new Date().toISOString().slice(0, 10);
  const [bnDate, setBnDate]   = useState(today);
  const [confirming, setConf] = useState(false);
  const [error, setError]     = useState("");
  const [rows, setRows]       = useState(
    (cust.invoices || []).map((inv, i) => ({ ...inv, idx: i, checked: !inv.bnNo }))
  );
  const [dnPopup, setDnPopup] = useState(null);
  const [dnCache, setDnCache] = useState({});
  const [bnPopup, setBnPopup] = useState(null); // #182
  const [address, setAddress] = useState(cust.address || "");
  const [phone, setPhone]     = useState(cust.phone || "");

  // reset on customer switch (key prop handles unmount, but keep for safety)
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
      const invoices = selectedRows.map(r => ({ dnNo: r.no, dnDate: r.date, amount: r.total }));
      const result = await api.confirmBN(cust.customer, nextBnNo, invoices, bnDate, address, phone);
      onConfirm({ bnNo: result.bnNo, pdfUrl: result.pdfUrl, customer: cust.customer, count: selectedRows.length, total: grandTotal, date: bnDate, dnNos: selectedRows.map(r => r.no) });
    } catch (e) {
      setError(e.message); setConf(false);
    }
  };

  return (
    <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "10px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{cust.customer}</span>
        <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{nextBnNo}</span>
      </div>
      {/* #182 — BN ที่สร้างแล้วในเดือนนี้ */}
      {(cust.invoices || []).some(inv => inv.bnNo) && (() => {
        const bnGroups = {};
        (cust.invoices || []).forEach(inv => { if (inv.bnNo) { if (!bnGroups[inv.bnNo]) bnGroups[inv.bnNo] = []; bnGroups[inv.bnNo].push(inv.no); } });
        return (
          <div style={{ background: "#f8faff", borderBottom: `0.5px solid ${C.borderLight}` }}>
            <div style={{ padding: "5px 14px 3px", fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
              <FileText size={11}/> BN ที่สร้างแล้วในเดือนนี้
            </div>
            {Object.entries(bnGroups).map(([bNo, dnNos]) => (
              <div key={bNo} style={{ padding: "3px 14px 6px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", borderTop: `0.5px solid ${C.borderLight}` }}>
                <span onClick={() => setBnPopup(bNo)} style={{ fontSize: 11, fontWeight: 500, color: C.accent, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{bNo} →</span>
                <span style={{ fontSize: 10, color: C.muted }}>{dnNos.length} ฉบับ</span>
                {dnNos.map(no => <span key={no} style={{ fontSize: 9, background: "#eaf3de", color: "#3b6d11", padding: "1px 5px", borderRadius: 3 }}>{no}</span>)}
              </div>
            ))}
          </div>
        );
      })()}
      {/* customer info — per-BN override for address/phone (#115) */}
      <div style={{ padding: "8px 14px", borderBottom: `0.5px solid ${C.borderLight}`, display: "grid", gridTemplateColumns: "60px 1fr", gap: "6px 10px", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.muted }}>ที่อยู่</span>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%", fontSize: 11 }} />
        <span style={{ fontSize: 11, color: C.muted }}>โทรศัพท์</span>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="—" style={{ ...inputStyle, width: "100%", fontSize: 11 }} />
      </div>
      {/* date — single col now that format toggle removed (#123) */}
      <div style={{ padding: "10px 14px", borderBottom: `0.5px solid ${C.borderLight}` }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่ออกใบวางบิล</div>
        <input type="date" value={bnDate} onChange={e => setBnDate(e.target.value)} style={{ ...inputStyle, width: 190 }} />
      </div>
      {/* DN table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: "7px 14px", width: 32, background: "#fafafa", borderBottom: `0.5px solid ${C.border}` }}>
              <input type="checkbox" checked={rows.every(r => r.checked)} onChange={toggleAll} />
            </th>
            {["เลขที่ DN", "วันที่", "รวมเงิน"].map((h, i) => (
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
                  <span onClick={() => setDnPopup(row.no)} style={{ color: row.bnNo ? C.muted : C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{row.no}</span>
                </td>
                <td style={{ padding: "8px 14px", color: C.muted }}>{row.date}</td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>฿{(parseFloat(row.total)||0).toLocaleString()}</td>
              </tr>
              {row.bnNo && (
                <tr style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <div style={{ background: "#fff8e1", borderTop: `0.5px solid #fac775`, padding: "5px 10px 5px 36px", fontSize: 10, color: "#633806", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <AlertCircle size={11} style={{ color: "#854f0b", flexShrink: 0, marginLeft: -20 }}/>
                      {row.no} อยู่ใน {row.bnNo} แล้ว — ถ้าต้องการรวม DN นี้ ให้
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
      {/* DN detail popup */}
      {dnPopup && (
        <DNDetailPopup
          dnNo={dnPopup}
          cachedData={dnCache[dnPopup]}
          onCached={(no, d) => setDnCache(prev => ({ ...prev, [no]: d }))}
          onClose={() => setDnPopup(null)}
        />
      )}
      {/* #182 — BN detail mini-popup (cancel existing BN to unlock DN) */}
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
  const [printFormat, setPrintFormat] = useState("portrait"); // #107 combined-print format
  const [printing, setPrinting]       = useState(false);
  const [dnPopup, setDnPopup]         = useState(null); // #101 DN popup from done-state list
  const [dnCacheBN, setDnCacheBN]     = useState({});
  const [monthCache, setMonthCache]   = useState({}); // #118 per-month search cache (key "y-m")
  const [ptLoading, setPtLoading]     = useState(false); // #134 on-demand PDF for done state

  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

  const goMonth = (dir) => {
    let m = month + dir, y = year;
    if (m < 1)  { m = 12; y = y - 1; }
    if (m > 12) { m = 1;  y = y + 1; }
    setMonth(m); setYear(y); setSelectedIdx(null);
    handleSearch(m, y); // #99 auto-load when changing month
  };

  const handleSearch = async (mArg = month, yArg = year, force = false) => {
    const cacheKey = `${yArg}-${mArg}`;
    if (!force && monthCache[cacheKey]) { // #118 — instant revisit, no refetch
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
      const data = await api.searchDeliveryNotes(startDate, endDate);
      // BN history lookup — restores created state on revisit (#104)
      let bnByNo = {}, nextBn = nextBnNo;
      try {
        const hist = await api.getBillingNotes();
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
      // #106 — seed print queue with all created BNs; checked only if not yet printed
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

  // #129b — auto-search current month on first open (mirrors goMonth behaviour)
  useEffect(() => { handleSearch(); }, []);

  const handleConfirm = (result) => {
    setCustomers(prev => prev.map((c, i) => {
      if (i !== selectedIdx) return c;
      const confirmedSet = new Set(result.dnNos || []);
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
    // #118 — invalidate this month's cache so a later revisit reflects the new BN
    setMonthCache(prev => { const n = { ...prev }; delete n[`${year}-${month}`]; return n; });
    // auto-advance to next pending
    setCustomers(prev => {
      const nextPending = prev.findIndex((c, i) => i > selectedIdx && !c.generated);
      if (nextPending >= 0) setSelectedIdx(nextPending);
      return prev;
    });
  };

  // #134 — on-demand portrait PDF for done state (mirrors BNDetailView generatePortrait)
  const handleGenBnPdf = async () => {
    const bnNo = selectedCust?.createdBnNo;
    if (!bnNo) return;
    if (selectedCust.createdPdfUrl) { window.open(selectedCust.createdPdfUrl, "_blank", "noopener,noreferrer"); return; }
    setPtLoading(true);
    try {
      const res = await api.generateBillingNotePortraitPDF(bnNo);
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
  // #107 — generate ONE combined PDF (chosen format) for all checked BNs, open it, mark printed
  const printNow = async () => {
    const toPrint = printQueue.filter(q => q.checked);
    const bnNos = toPrint.map(q => q.bnNo).filter(Boolean);
    if (!bnNos.length) return;
    setPrinting(true);
    try {
      const res = await api.printCombinedBillingNotes(bnNos, printFormat);
      if (res && res.url) {
        const a = document.createElement("a");
        a.href = res.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      // #106 — persist printed flag so these stay unchecked on future visits
      setPrintQueue(prev => prev.map(q => bnNos.includes(q.bnNo) ? { ...q, checked: false, printed: true } : q));
      try { await api.markBillingNotesPrinted(bnNos); } catch (_) {}
    } catch (err) {
      setError(err.message || "พิมพ์ไม่สำเร็จ");
    } finally {
      setPrinting(false);
    }
  };

  const done         = customers.filter(c => c.generated).length;
  const pending      = customers.filter(c => !c.generated).length;
  const selectedCust = selectedIdx !== null ? customers[selectedIdx] : null;

  // fixed height for split pane — subtract top bars (~160px)
  const PANE_H = "calc(100vh - 175px)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* top bar */}
      <div style={{ flexShrink: 0, padding: "0 0 10px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={13}/> กลับ
          </button>
          <span style={{ fontSize: 15, fontWeight: 500 }}>สร้างใบวางบิล</span>
        </div>
        {/* month navigator */}
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
        {loading && <div style={{ marginTop: 8 }}><Spinner text="กำลังดึงข้อมูลใบส่งของ..." /></div>}
      </div>

      {/* split pane — both sides scroll independently */}
      {!loading && searched && customers.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>ไม่พบใบส่งของในเดือนนี้</div>
      )}
      {!loading && searched && customers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, flex: 1, minHeight: 0 }}>
          {/* left: scrollable customer list */}
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
                      if (cust.generated) return <Badge type="success" style={{ fontSize: 9 }}><CheckCircle size={8}/> สร้างแล้ว</Badge>;
                      if (billedCnt > 0) return <Badge type="info" style={{ fontSize: 9 }}>สร้าง {billedCnt}/{totalCnt}</Badge>;
                      return <Badge type="warning" style={{ fontSize: 9 }}>ยังไม่สร้าง</Badge>;
                    })()}
                  </div>
                  {cust.generated && cust.createdBnNo
                    ? <div style={{ fontSize: 10, color: C.accent }}>{cust.createdBnNo}</div>
                    : <div style={{ fontSize: 10, color: C.muted }}>{cust.invoices.length} ฉบับ · ฿{total.toLocaleString()}</div>}
                </div>
              );
            })}
          </div>

          {/* right: panel (scrolls) + print queue (pinned bottom, #103) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
           {/* scrollable region — panel / done / placeholder; sizes to content so queue sits right below (not pinned to bottom), but shrinks+scrolls when tall. stable gutter so width never shifts (#100) */}
           <div style={{ flex: "0 1 auto", minHeight: 0, overflowY: "auto", scrollbarGutter: "stable", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* creation panel */}
            {selectedCust && !selectedCust.generated && (
              <BNCustomerPanel
                key={selectedCust.customer}
                cust={selectedCust}
                nextBnNo={nextBnNo}
                onConfirm={handleConfirm}
              />
            )}
            {/* done state — shows BN details + PDF link */}
            {selectedCust && selectedCust.generated && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", background: "#e8f5e9", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={14} style={{ color: C.success }}/>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedCust.customer}</span>
                  <span style={{ fontSize: 11, color: C.accent, background: "#e3f0ff", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{selectedCust.createdBnNo}</span>
                </div>
                <div style={{ padding: "12px 14px", display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12 }}>
                  <div>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>วันที่</div>
                    <div>{selectedCust.createdDate || "-"}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>จำนวนบิล</div>
                    <div>{selectedCust.createdCount} ฉบับ</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>รวมเงิน</div>
                    <div style={{ fontWeight: 600, color: C.accent }}>฿{(selectedCust.createdTotal||0).toLocaleString()}</div>
                  </div>
                  {/* #134 — always show PDF button; generates on-demand if not cached */}
                  <div style={{ alignSelf: "flex-end" }}>
                    <Btn small onClick={handleGenBnPdf} disabled={ptLoading}>
                      {ptLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF
                    </Btn>
                  </div>
                </div>
                {/* #101 — billed DN list, clickable → DNDetailPopup */}
                {(selectedCust.invoices || []).length > 0 && (
                  <div style={{ borderTop: `0.5px solid ${C.borderLight}` }}>
                    <div style={{ padding: "6px 14px", fontSize: 11, color: C.muted, background: "#fafafa" }}>ใบส่งของในใบวางบิลนี้</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <tbody>
                        {selectedCust.invoices.map((inv, i) => (
                          <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                            <td style={{ padding: "7px 14px" }}>
                              <span onClick={() => setDnPopup(inv.no)} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>{inv.no}</span>
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
            {/* placeholder when nothing selected */}
            {!selectedCust && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
                เลือกลูกค้าจากรายการทางซ้าย
              </div>
            )}
           </div>{/* end scrollable region */}
            {/* print queue — pinned at bottom of right pane (#103) */}
            {printQueue.length > 0 && (
              <div style={{ flexShrink: 0, maxHeight: "42%", display: "flex", flexDirection: "column", background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: "#fafafa", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                    <Printer size={13}/> คิวพิมพ์ ({printQueue.filter(q=>q.checked).length}/{printQueue.length})
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>รูปแบบ</span>
                      {[["portrait", null, "PDF"],["landscape", null, "แบบพิมพ์"]].map(([v,,l]) => (
                        <button key={v} onClick={() => setPrintFormat(v)} disabled={printing}
                          style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, cursor: printing ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 3,
                            border: `0.5px solid ${printFormat===v ? C.accent : C.border}`,
                            background: printFormat===v ? "#e3f0ff" : "white",
                            color: printFormat===v ? C.accent : C.muted, fontWeight: printFormat===v ? 600 : 400 }}>{v === "portrait" ? <FileText size={11}/> : <Printer size={11}/>} {l}
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
                </div>{/* end queue table scroll */}
              </div>
            )}
          </div>
        </div>
      )}
      {/* #101 DN detail popup from done-state list */}
      {dnPopup && (
        <DNDetailPopup dnNo={dnPopup} cachedData={dnCacheBN[dnPopup]} onCached={(no, d) => setDnCacheBN(prev => ({ ...prev, [no]: d }))} onClose={() => setDnPopup(null)} />
      )}
    </div>
  );
}

// ── Main BN Page ───────────────────────────────────────────

function BillingNotePage({ cache, updateCache, goListRequest, onViewChange }) {
  const [view, setView_]              = useState("list"); // "list" | "create" | "detail"
  const [selectedBnNo, setSelectedBnNo] = useState(null);
  // #120 — push breadcrumb suffix (BN no / สร้าง) like DN/TI
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  // #119 — clicking the ใบวางบิล nav (active) bumps goListRequest → return to list view (matches DN/TI)
  useEffect(() => { if (goListRequest) setView("list"); }, [goListRequest]);
  // #105 — list + detail live in app-level cache so they survive navigation (like DN/TI)
  const bnList = cache["bnList"] || [];
  const [listLoading, setListLoading] = useState(!cache["bnList"]);
  const [listError, setListError]     = useState("");
  const detailKey = no => "bnDetail_" + no;

  const loadBnList = async () => {
    setListLoading(true);
    setListError("");
    try {
      const data = await api.getBillingNotes();
      updateCache("bnList", Array.isArray(data) ? data : []);
    } catch (err) {
      setListError(err.message);
    } finally {
      setListLoading(false);
    }
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

export { DeliveryNotePage, BillingNotePage, DateRangePicker };
