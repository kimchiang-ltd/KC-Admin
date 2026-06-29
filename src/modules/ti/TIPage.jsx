// ============================================================
// TI Module — Tax Invoice Page
// Extracted from InvoiceAdmin.jsx → adapted to KC Admin shared layer
// Uses tiApi (TICode.gs backend), NOT KC Admin's api (Config.gs/Code.gs)
// ============================================================

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { Receipt, FileText, Printer, Pencil, Loader, ChevronLeft, ChevronRight, ChevronDown, QrCode, Smartphone, Search } from "lucide-react";
import { tiApi, bahtText } from "./tiApi.jsx";
import { C, ITEMS_COUNT, PAGE_SIZE, DESC_MAX, DETAIL_WARN, DETAIL_MAX } from "../../shared/constants.jsx";
import { descWidth, toDownloadUrl } from "../../shared/utils.jsx";
import { useInvoiceForm } from "../../shared/hooks.jsx";
import { Btn, SectionTitle, Spinner, Paginator, ConfirmModal, CustomerFieldSyncModal, inputStyle, INSTR_STEPS, renderPhoneScreen } from "../../shared/ui.jsx";
import { CustomerAutocomplete, ProductAutocomplete } from "../../shared/autocomplete.jsx";
import { DateRangePicker } from "../invoice/InvoicePage.jsx";

// ── Tax Invoice Form ──────────────────────────────────────

function TaxInvoiceForm({ initial, onSave, onCancel, isEdit, products, setProducts, sizes, vatRate = 0.07 }) {
  const [date,       setDate]       = useState(initial?.date       || new Date().toISOString().slice(0, 10));
  const [name,       setName]       = useState(initial?.name       || "");
  const [address,    setAddress]    = useState(initial?.address    || "");
  const [taxId,      setTaxId]      = useState(initial?.taxId      || "");
  const [phone,      setPhone]      = useState(initial?.phone      || "");
  const [invoiceRef, setInvoiceRef] = useState(initial?.invoiceRef || "");
  const {
    items, removedOrigItems, saving, error, pendingDelete, setPendingDelete,
    rowEditMode, setRowEditMode, allCustomers, setAllCustomers,
    custWarning, setCustWarning, newCustWarning, setNewCustWarning,
    productWarning, setProductWarning, addingProduct, setAddingProduct,
    custConfirmedRef, skipCustomerLogRef, nameSelectedFromListRef,
    checkProductName, checkNameSimilarity, checkNameOnBlur, updateItem, updateDetail,
    addRow, addContinuationRow, removeRow, cellInput, guardedSave,
    newCustCheckedRef,
  } = useInvoiceForm({ initial, isEdit, products, detailAttr: "data-ti-detail-idx" });

  const sub = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const vat = parseFloat((sub * vatRate).toFixed(2));
  const gt  = parseFloat((sub + vat).toFixed(2));

  // #214 — per-field on-blur customer sync (iii-soft)
  const [syncDecisions, setSyncDecisions] = useState({});
  const [pendingField, setPendingField]   = useState(null);

  const findCustomerRecord = () => allCustomers.find(c => (c.name||"").trim().toLowerCase() === (name||"").trim().toLowerCase());

  const checkFieldOnBlur = (field, val) => {
    if (syncDecisions[field] === 'yes') return;
    const record = findCustomerRecord();
    if (!record) return;
    const cur = (val || "").trim();
    const old = (record[field] || "").trim();
    if (!cur || cur === old) return;
    setPendingField({ field, oldValue: old, newValue: cur });
  };

  const handleFieldConfirm = () => { setSyncDecisions(d => ({ ...d, [pendingField.field]: 'yes' })); setPendingField(null); };
  const handleFieldSkip    = () => { setPendingField(null); };

  useEffect(() => { setSyncDecisions({}); }, [name]);

  const handleSave = () => guardedSave(name, async ({ filled, cleanItems, skipLog }) => {
    const payload = {
      date, name, address, taxId, phone, invoiceRef, items: cleanItems, subtotal: sub, vatAmt: vat, grandTotal: gt,
      ...(isEdit ? { _logAdded: filled.filter(it => !it._orig).length, _logDeleted: removedOrigItems } : { skipAutoLog: skipLog })
    };
    const result = isEdit
      ? await tiApi.updateTaxInvoice(initial.id, payload)
      : await tiApi.createTaxInvoice(payload);
    // #214 — apply cached "yes" decisions
    const yesFields = Object.keys(syncDecisions).filter(f => syncDecisions[f] === 'yes');
    if (yesFields.length > 0) {
      const record = findCustomerRecord();
      if (record) {
        const update = { ...record };
        const formValues = { address, phone, taxId };
        for (const f of yesFields) update[f] = formValues[f];
        tiApi.updateCustomer(name, update).catch(() => {});
      }
    }
    onSave({ ...payload, id: result.invoiceNo || initial?.id, pdfUrl: result.pdfUrl || initial?.pdfUrl });
  });

  return (
    <>
    {pendingField && <CustomerFieldSyncModal name={name} field={pendingField.field} oldValue={pendingField.oldValue} newValue={pendingField.newValue} onConfirm={handleFieldConfirm} onCancel={handleFieldSkip} />}
    {pendingDelete !== null && <ConfirmModal message="ยืนยันลบ?" onConfirm={() => { removeRow(pendingDelete); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} enterConfirm />}
    {custWarning && <ConfirmModal
      message={`พบชื่อที่คล้ายกันในระบบ:\n"${custWarning.map(c => c.name).join('", "')}"\n\nหมายถึงลูกค้านี้ใช่ไหม?`}
      onConfirm={() => { const m = custWarning[0]; setName(m.name); setAddress(m.address || ""); setPhone(m.phone || ""); custConfirmedRef.current = true; setCustWarning(null); }}
      secondaryLabel="ไม่ ใช้ชื่อที่พิมพ์"
      onSecondary={() => {
        custConfirmedRef.current = true; setCustWarning(null);
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
                {productWarning.similar.map((s, idx) => (
                  <button key={idx} onMouseDown={e => { e.preventDefault(); updateItem(productWarning.rowIndex, "desc", s); setProductWarning(null); }}
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
            <button disabled={addingProduct} onClick={async () => { setAddingProduct(true); try { await tiApi.addProduct(productWarning.name); setProducts(prev => [...prev, productWarning.name]); } catch(e){} setAddingProduct(false); setProductWarning(null); }}
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
        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 140px", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>วันที่</div><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ชื่อลูกค้า / บริษัท</div>
            <CustomerAutocomplete
              value={name}
              onChange={v => { setName(v); nameSelectedFromListRef.current = false; custConfirmedRef.current = false; newCustCheckedRef.current = false; }}
              onSelect={c => { setName(c.name); setAddress(c.address); setPhone(c.phone); setTaxId(c.taxId); nameSelectedFromListRef.current = true; custConfirmedRef.current = true; }}
              onCustomersLoaded={setAllCustomers}
              onBlur={() => { if (!nameSelectedFromListRef.current) checkNameOnBlur(name); }}
              style={{ ...inputStyle, width: "100%" }}
              apiOverride={tiApi}
            />
          </div>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>โทรศัพท์</div><input value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => checkFieldOnBlur('phone', phone)} placeholder="เบอร์โทร" style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เลขประจำตัวผู้เสียภาษีอากร</div>
            <input value={taxId} onChange={e => setTaxId(e.target.value)} onBlur={() => checkFieldOnBlur('taxId', taxId)} placeholder="0000000000000" maxLength={13}
              style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.06em" }} />
          </div>
          <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><input value={address} onChange={e => setAddress(e.target.value)} onBlur={() => checkFieldOnBlur('address', address)} placeholder="ที่อยู่" style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>อ้างอิงใบส่งของเลขที่</div>
          <input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} placeholder="26-000165" style={inputStyle} />
        </div>
      </div>
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ marginBottom: 6 }}>
          <SectionTitle>รายการสินค้า <span style={{ fontSize: 10, fontWeight: 400, color: items.length >= ITEMS_COUNT ? C.danger : items.length >= ITEMS_COUNT - 2 ? C.warning : C.muted }}>({items.length}/{ITEMS_COUNT} แถว)</span></SectionTitle>
          <div><button onClick={() => setRowEditMode(m => !m)} style={{ fontSize: 12, color: rowEditMode ? "#2a7a3b" : C.danger, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{rowEditMode ? "เสร็จ" : "ลบ"}</button></div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <colgroup>
              <col style={{ width: 28 }} /><col style={{ width: 60 }} /><col style={{ width: 170 }} /><col style={{ width: 80 }} />
              <col /><col style={{ width: 80 }} /><col style={{ width: 100 }} /><col style={{ width: 50 }} />
            </colgroup>
            <thead>
              <tr style={{ background: C.sidebar }}>
                <th style={{ padding: "7px 6px", width: 28 }}></th>
                {[{ l: "จำนวน", a: "center" }, { l: "รายการ", a: "left" }, { l: "ขนาด", a: "left" }, { l: "รายละเอียด", a: "left" }, { l: "ราคาหน่วยละ", a: "right" }, { l: "จำนวนเงิน", a: "right", cs: 2 }].map((h, idx) => (
                  <th key={idx} colSpan={h.cs || 1} style={{ padding: "7px 8px", color: "white", fontWeight: 500, fontSize: 11, textAlign: h.a }}>{h.l}</th>
                ))}
                <th style={{ padding: "7px 8px", color: "white", fontWeight: 500, fontSize: 11, textAlign: "right" }}>สต.</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const b = it.amount ? Math.floor(Number(it.amount)) : null;
                const s = it.amount ? Math.round((Number(it.amount) - Math.floor(Number(it.amount))) * 100) : null;
                const dw = descWidth(it.desc || "");
                const detailW = descWidth(it.detail || "");
                const atWarn  = detailW >= DETAIL_WARN;
                const atLimit = dw >= DESC_MAX || detailW >= DETAIL_MAX;
                return (
                  <tr key={i} style={{ background: it._cont ? "#f5f7ff" : i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}`, borderLeft: atLimit ? `3px solid ${C.danger}` : atWarn ? `3px solid ${C.warning}` : it._cont ? `3px solid ${C.accent}` : "3px solid transparent" }}>
                    <td style={{ padding: "3px 4px", textAlign: "center" }}>
                      {rowEditMode && <button onClick={() => setPendingDelete(i)} title="ลบแถว" style={{ width: 14, height: 14, borderRadius: "50%", border: "none", background: "#e5534b", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0, fontWeight: 700 }}>−</button>}
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "center" }}>{!it._cont && cellInput(i, "qty", "center")}</td>
                    <td style={{ padding: "3px 6px" }}>
                      {!it._cont && <ProductAutocomplete value={it.desc} onChange={v => updateItem(i, "desc", v)} onBlur={() => checkProductName(i, it.desc)} products={products} />}
                      {it._cont && <span style={{ color: C.accent, fontSize: 13, paddingLeft: 4 }}>↳</span>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>
                      {!it._cont && <select value={it.desc2} onChange={e => updateItem(i, "desc2", e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px" }}>
                        <option value="">—</option>
                        {sizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                      </select>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>
                      {cellInput(i, "detail", "left", {
                        "data-ti-detail-idx": i,
                        onChange: e => updateDetail(i, e.target.value),
                        onKeyDown: e => { if (e.key === "Enter") { e.preventDefault(); addContinuationRow(i); } }
                      })}
                      {atLimit && <div style={{ fontSize: 11, color: C.danger, marginTop: 1 }}>ถึงขีดจำกัด — กด Enter เพื่อขึ้นบรรทัดใหม่</div>}
                      {!atLimit && atWarn && <div style={{ fontSize: 11, color: C.warning, marginTop: 1 }}>ใกล้จะเต็ม — พิจารณากด Enter ขึ้นบรรทัดใหม่</div>}
                    </td>
                    <td style={{ padding: "3px 6px" }}>{!it._cont && cellInput(i, "unitPrice", "right")}</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: b ? C.text : C.muted }}>{!it._cont && (b ? b.toLocaleString() : "—")}</td>
                    <td style={{ padding: "4px 4px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 11, color: C.muted }}>{!it._cont && (s > 0 ? String(s).padStart(2, "0") : "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ position: "sticky", bottom: 0, background: C.pageBg, paddingTop: 6, paddingBottom: 6 }}>
          <button onClick={addRow} disabled={items.length >= ITEMS_COUNT} style={{ fontSize: 11, color: items.length >= ITEMS_COUNT ? C.muted : C.accent, background: "none", border: `0.5px dashed ${items.length >= ITEMS_COUNT ? C.muted : C.accent}`, borderRadius: 4, padding: "4px 12px", cursor: items.length >= ITEMS_COUNT ? "not-allowed" : "pointer", width: "100%", opacity: items.length >= ITEMS_COUNT ? 0.5 : 1 }}>+ เพิ่มแถว (สินค้าใหม่) {items.length >= ITEMS_COUNT ? "— เต็ม 10 แถวแล้ว" : ""}</button>
        </div>
      </div>
      <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>จำนวนเงิน (ตัวอักษร)</div>
          <div style={{ fontSize: 12, padding: "8px 12px", background: "#f8f9ff", borderRadius: 6, border: `0.5px solid ${C.border}` }}>({bahtText(gt)})</div>
        </div>
        <div style={{ minWidth: 280 }}>
          {[["รวมมูลค่าสินค้า", sub], ["จำนวนภาษีมูลค่าเพิ่ม 7%", vat]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `0.5px solid ${C.borderLight}`, fontSize: 12 }}>
              <span style={{ color: C.muted }}>{l}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 500 }}>
            <span>จำนวนเงินรวมทั้งสิ้น</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: C.accent }}>฿{gt.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
      {error && <div style={{ margin: "0 16px 8px", padding: "8px 12px", background: C.dangerBg, color: C.danger, borderRadius: 6, fontSize: 12 }}>⚠️ {error}</div>}
      <div style={{ padding: "10px 16px", background: "#fafafa", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn onClick={onCancel}>ยกเลิก</Btn>
        <Btn primary onClick={handleSave} disabled={saving || !name}>
          {saving ? <><Loader size={13}/> กำลังบันทึก...</> : (<><Receipt size={14}/> {isEdit ? "บันทึก" : "บันทึกและสร้าง PDF"}</>)}
        </Btn>
      </div>
    </div>
    </>
  );
}

// ── Tax Invoice Detail ────────────────────────────────────

function TaxInvoiceDetail({ invoice, onBack, onSaved, products, setProducts, sizes, isCancelled, vatRate = 0.07 }) {
  const [editing, setEditing] = useState(false);
  const [data,    setData]    = useState(invoice);
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [lsPdfLoading, setLsPdfLoading] = useState(false);
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

  const fi  = (data.items || []).filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
  const sub = data.subtotal   ?? fi.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const vat = data.vatAmt     ?? parseFloat((sub * vatRate).toFixed(2));
  const gt  = data.grandTotal ?? parseFloat((sub + vat).toFixed(2));

  const openUrl = (url) => { const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; document.body.appendChild(a); a.click(); document.body.removeChild(a); };

  const generatePortraitPDF = async () => {
    if (data.portraitUrl) { openUrl(data.portraitUrl); return; }
    setPdfLoading(true);
    try { const r = await tiApi.generateTaxInvoicePortraitPDF(data.id); if (r.pdfUrl) { setData(d => ({ ...d, portraitUrl: r.pdfUrl })); openUrl(r.pdfUrl); } }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setPdfLoading(false); }
  };

  const generateLandscapePDF = async () => {
    if (data.pdfUrl) { openUrl(data.pdfUrl); return; }
    setLsPdfLoading(true);
    try { const r = await tiApi.generateTaxInvoiceLandscapePDF(data.id); if (r.pdfUrl) { setData(d => ({ ...d, pdfUrl: r.pdfUrl })); openUrl(r.pdfUrl); } }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLsPdfLoading(false); }
  };

  const handleCancelTI = async () => {
    setCancelLoading(true);
    try { await tiApi.cancelTaxInvoice(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); setShowCancelConfirm(false); }
  };

  const handleRestoreTI = async () => {
    setCancelLoading(true);
    try { await tiApi.restoreTaxInvoice(data.id); onSaved?.(); onBack(); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); }
  };

  const handleQrTI = async () => {
    const generate = async (pdfUrl) => {
      const dlUrl = toDownloadUrl(pdfUrl);
      const dataUrl = await QRCode.toDataURL(dlUrl, { width: 280, margin: 2 });
      setQrUrl(dlUrl); setQrDataUrl(dataUrl); setShowQr(true); setShowInstructions(true);
    };
    if (data.portraitUrl) { await generate(data.portraitUrl); return; }
    setQrLoading(true);
    try { const r = await tiApi.generateTaxInvoicePortraitPDF(data.id); if (r.pdfUrl) { setData(d => ({ ...d, portraitUrl: r.pdfUrl })); await generate(r.pdfUrl); } }
    catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    finally { setQrLoading(false); }
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> กลับ</button>
        <span style={{ color: C.muted }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>แก้ไข {data.id}</span>
      </div>
      <TaxInvoiceForm initial={data}
        onSave={u => { setData({ ...data, ...u, pdfUrl: "", portraitUrl: "" }); setEditing(false); onSaved?.(); }}
        onCancel={() => setEditing(false)} isEdit products={products} setProducts={setProducts} sizes={sizes} vatRate={vatRate} />
    </div>
  );

  return (
    <div>
      {showCancelConfirm && <ConfirmModal message={`ยืนยันยกเลิก ${data.id}?`} confirmLabel="ยืนยันยกเลิก" onConfirm={handleCancelTI} onCancel={() => setShowCancelConfirm(false)} loading={cancelLoading} enterConfirm />}
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
          <span style={{ fontSize: 14, fontWeight: 500 }}>{data.id}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isCancelled ? (
            <Btn onClick={handleRestoreTI} disabled={cancelLoading}>{cancelLoading ? <Loader size={13}/> : null} กู้คืน</Btn>
          ) : (
            <>
              <Btn onClick={generateLandscapePDF} disabled={lsPdfLoading}>{lsPdfLoading ? <Loader size={13}/> : <Printer size={14}/>} พิมพ์</Btn>
              <Btn onClick={generatePortraitPDF} disabled={pdfLoading}>{pdfLoading ? <Loader size={13}/> : <FileText size={13}/>} PDF</Btn>
              <Btn onClick={handleQrTI} disabled={qrLoading}>{qrLoading ? <Loader size={13}/> : <QrCode size={14}/>} QR</Btn>
              <Btn primary onClick={() => setEditing(true)}><Pencil size={14}/> แก้ไข</Btn>
              <Btn danger onClick={() => setShowCancelConfirm(true)} disabled={cancelLoading}>ยกเลิกใบนี้</Btn>
            </>
          )}
        </div>
      </div>
      {isCancelled && <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>ใบนี้ถูกยกเลิกแล้ว</div>}
      <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 12 }}>
            {[["เลขที่", data.id], ["วันที่", data.date ? new Date(data.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"], ["ชื่อลูกค้า", data.name], ["โทรศัพท์", data.phone || "—"]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            {data.address && <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>ที่อยู่</div><div style={{ fontSize: 12 }}>{data.address}</div></div>}
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>เลขประจำตัวผู้เสียภาษีอากร</div><div style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>{data.taxId || "—"}</div></div>
            {data.invoiceRef && <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>อ้างอิงใบส่งของ</div><div style={{ fontSize: 12, color: C.accent }}>{data.invoiceRef}</div></div>}
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.sidebar }}>
                {[{ l: "จำนวน", a: "center" }, { l: "รายการ", a: "left" }, { l: "ขนาด", a: "left" }, { l: "รายละเอียด", a: "left" }, { l: "ราคาหน่วยละ", a: "right" }, { l: "จำนวนเงิน", a: "right", cs: 2 }].map((h, i) => (
                  <th key={i} colSpan={h.cs || 1} style={{ padding: "7px 10px", color: "white", fontWeight: 500, fontSize: 11, textAlign: h.a }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fi.map((it, i) => {
                const b = Math.floor(Number(it.amount));
                const s = Math.round((Number(it.amount) - b) * 100);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafbff", borderBottom: `0.5px solid ${C.borderLight}` }}>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>{it.qty}</td>
                    <td style={{ padding: "8px 10px" }}>{it.desc}</td>
                    <td style={{ padding: "8px 10px", color: C.muted }}>{it.desc2}</td>
                    <td style={{ padding: "8px 10px", color: C.muted }}>{it.detail}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(it.unitPrice).toLocaleString()}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{b.toLocaleString()}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 11, color: C.muted }}>{s > 0 ? String(s).padStart(2, "0") : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0 16px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>จำนวนเงิน (ตัวอักษร)</div>
            <div style={{ fontSize: 12, padding: "8px 12px", background: "#f8f9ff", borderRadius: 6, border: `0.5px solid ${C.border}` }}>({bahtText(gt)})</div>
          </div>
          <div style={{ minWidth: 280 }}>
            {[["รวมมูลค่าสินค้า", sub], ["จำนวนภาษีมูลค่าเพิ่ม 7%", vat]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `0.5px solid ${C.borderLight}`, fontSize: 12 }}>
                <span style={{ color: C.muted }}>{l}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 500 }}>
              <span>จำนวนเงินรวมทั้งสิ้น</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: C.accent }}>฿{gt.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tax Invoice Page (list + routing) ─────────────────────

function TaxInvoicePage({ vatRate = 0.07, cache, updateCache, onViewChange, goListRequest }) {
  const [view,     setView_]    = useState("list");
  const setView = (v, label) => { setView_(v); onViewChange?.(label ?? null); };
  useEffect(() => { if (goListRequest) setView("list", null); }, [goListRequest]);

  // #215 — TI products/sizes come from Invoice Admin spreadsheet (separate from KC Admin Config_Products which is DN's)
  const [tiProducts, setTiProducts] = useState([]);
  const [tiSizes, setTiSizes]       = useState([]);
  useEffect(() => {
    const apply = (items) => {
      setTiProducts(items.filter(it => it.type === "product").map(it => it.value));
      setTiSizes(items.filter(it => it.type === "size").map(it => it.value));
    };
    const cached = cache["tiProductList"];
    if (cached) { apply(cached); return; }
    tiApi.getProducts().then(items => { updateCache("tiProductList", items); apply(items); }).catch(() => {});
  }, []);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState("");
  const [ok,       setOk]       = useState("");
  const [search,   setSearch]   = useState("");
  const [hovered,  setHovered]  = useState(null);
  const [cancelSectionOpen, setCancelSectionOpen] = useState(false);
  const [cancelSearch, setCancelSearch]       = useState("");
  const [cancelLoading, setCancelLoading]     = useState(false);
  const [cancelledList, setCancelledList]     = useState([]);

  const now = new Date();
  const [startDate, setStartDate] = useState(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-01");
  const [endDate,   setEndDate]   = useState(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0"));
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [search, startDate, endDate]);

  const cacheKey = "taxinvoices_" + startDate + "_" + endDate;
  const invoices = cache[cacheKey] || [];

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { const d = await tiApi.getTaxInvoices(startDate, endDate, search); updateCache(cacheKey, Array.isArray(d) ? d : []); }
    catch (e) { setErr("โหลดไม่สำเร็จ: " + e.message); }
    finally { setLoading(false); }
  }, [startDate, endDate, search]);

  useEffect(() => { if (!cache[cacheKey]) load(); }, [cacheKey]);

  const loadCancelledTI = useCallback(async () => {
    setCancelLoading(true);
    try { const d = await tiApi.getCancelledTaxInvoices(cancelSearch); setCancelledList(Array.isArray(d) ? d : []); }
    catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    finally { setCancelLoading(false); }
  }, [cancelSearch]);
  useEffect(() => { if (cancelSectionOpen) loadCancelledTI(); }, [cancelSectionOpen]);

  const handleSaveNew = (result) => {
    setOk("สร้าง " + result.id + " สำเร็จ!");
    setSelected(result); setView("detail", result.id);
    updateCache(cacheKey, null); load();
    setTimeout(() => setOk(""), 2500);
  };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return !q || (inv.id || "").toLowerCase().includes(q) || (inv.name || "").toLowerCase().includes(q);
  });
  const pagedTI = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {ok  && <div style={{ background: C.successBg, color: C.success, padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{ok}</div>}
      {err && <div style={{ background: C.dangerBg,  color: C.danger,  padding: "10px 16px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{err}</div>}

      {view === "list" && (
        <div>
          <div style={{ position: "sticky", top: -18, zIndex: 10, background: C.pageBg }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}><Receipt size={15}/> ใบกำกับภาษี</div>
              <Btn primary onClick={() => setView("create", "สร้างใหม่")}>+ สร้างใบกำกับภาษีใหม่</Btn>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", border: `0.5px solid ${C.border}`, background: "#fafafa", flexWrap: "wrap", borderRadius: "8px 8px 0 0" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
                placeholder="ค้นหาลูกค้า / เลขที่..." style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 200, height: 30, boxSizing: "border-box" }} />
              <DateRangePicker startDate={startDate} endDate={endDate} onApply={(s, e) => { setStartDate(s); setEndDate(e); }} />
              {loading && <Loader size={14}/>}
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>พบ {filtered.length} รายการ</span>
            </div>
          </div>
          <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "clip", marginBottom: 14 }}>
            {loading && <Spinner />}
            {!loading && filtered.length === 0 && <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>ไม่พบรายการ</div>}
            {!loading && filtered.length > 0 && (
              <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 150 }} /><col style={{ width: 95 }} /><col />
                  <col style={{ width: 150 }} /><col style={{ width: 120 }} />
                </colgroup>
                <thead>
                  <tr>{["เลขที่", "วันที่", "ชื่อลูกค้า", "เลขภาษี", "ยอดสุทธิ"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: i === 4 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa", position: "sticky", top: 70, zIndex: 1 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {pagedTI.map(inv => {
                    const s = inv.subtotal ?? (inv.items || []).reduce((a, it) => a + (parseFloat(it.amount) || 0), 0);
                    const g = inv.grandTotal ?? parseFloat((s * 1.07).toFixed(2));
                    return (
                      <tr key={inv.id} onMouseEnter={() => setHovered(inv.id)} onMouseLeave={() => setHovered(null)}
                        style={{ background: hovered === inv.id ? C.rowHover : "white", borderBottom: `0.5px solid ${C.borderLight}` }}>
                        <td style={{ padding: "9px 10px" }}>
                          <a onClick={() => { setSelected(inv); setView("detail", inv.id); }} style={{ color: C.accent, cursor: "pointer", fontWeight: 500 }}>{inv.id}</a>
                        </td>
                        <td style={{ padding: "9px 10px", color: C.muted }}>
                          {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td style={{ padding: "9px 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.name}</td>
                        <td style={{ padding: "9px 10px", fontVariantNumeric: "tabular-nums", fontSize: 11, color: C.muted }}>{inv.taxId || "—"}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                          {g ? `฿${g.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Paginator total={filtered.length} page={page} onChange={setPage} />
              </>
            )}
            <div style={{ padding: "8px 12px", background: "#fafafa", borderTop: `0.5px solid ${C.border}`, display: "flex", justifyContent: "flex-end", fontSize: 12 }}>
              <span style={{ color: C.muted }}>รวม {filtered.length} รายการ</span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button onClick={() => setCancelSectionOpen(o => !o)}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
              {cancelSectionOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>} ใบที่ยกเลิก
            </button>
            {cancelSectionOpen && (
              <div style={{ background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
                <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>
                  <input value={cancelSearch} onChange={e => setCancelSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadCancelledTI()}
                    placeholder="ค้นหาเลขที่ / ชื่อลูกค้า..."
                    style={{ padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, width: 220 }} />
                  <Btn primary small onClick={loadCancelledTI} disabled={cancelLoading}>{cancelLoading ? <Loader size={13}/> : <><Search size={13}/> ค้นหา</>}</Btn>
                </div>
                {cancelLoading && <Spinner />}
                {!cancelLoading && cancelledList.length === 0 && <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 12 }}>กรอกชื่อลูกค้าหรือเลขที่แล้วกด ค้นหา</div>}
                {!cancelLoading && cancelledList.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["เลขที่", "วันที่", "ชื่อลูกค้า", "ยอดสุทธิ"].map((h, i) => (
                        <th key={i} style={{ padding: "8px 14px", textAlign: i === 3 ? "right" : "left", color: C.muted, fontWeight: 500, fontSize: 11, borderBottom: `0.5px solid ${C.border}`, background: "#fafafa" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {cancelledList.map(inv => {
                        const s = inv.subtotal ?? (inv.items || []).reduce((a, it) => a + (parseFloat(it.amount) || 0), 0);
                        const g = inv.grandTotal ?? parseFloat((s * 1.07).toFixed(2));
                        return (
                          <tr key={inv.id} style={{ borderBottom: `0.5px solid ${C.borderLight}` }}>
                            <td style={{ padding: "9px 14px" }}>
                              <a onClick={() => { setSelected(inv); setView("cancelledDetail", inv.id); }} style={{ color: C.danger, cursor: "pointer", fontWeight: 500 }}>{inv.id}</a>
                            </td>
                            <td style={{ padding: "9px 14px", color: C.muted }}>
                              {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </td>
                            <td style={{ padding: "9px 14px" }}>{inv.name}</td>
                            <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                              {g ? `฿${g.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {view === "detail" && selected && (
        <TaxInvoiceDetail invoice={selected} onBack={() => setView("list", null)} onSaved={() => { updateCache(cacheKey, null); load(); }} products={tiProducts} setProducts={setTiProducts} sizes={tiSizes} vatRate={vatRate} />
      )}
      {view === "cancelledDetail" && selected && (
        <TaxInvoiceDetail invoice={selected} isCancelled onBack={() => setView("list", null)}
          onSaved={() => { updateCache(cacheKey, null); load(); setCancelledList(list => list.filter(i => i.id !== selected.id)); }}
          products={tiProducts} setProducts={setTiProducts} sizes={tiSizes} vatRate={vatRate} />
      )}
      {view === "create" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setView("list", null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}><ChevronLeft size={14}/> รายการ</button>
            <span style={{ color: C.muted }}>›</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>สร้างใหม่</span>
          </div>
          <TaxInvoiceForm onSave={handleSaveNew} onCancel={() => setView("list", null)}
            products={tiProducts} setProducts={setTiProducts} sizes={tiSizes} vatRate={vatRate} />
        </div>
      )}
    </div>
  );
}

export { TaxInvoiceForm, TaxInvoiceDetail, TaxInvoicePage };
