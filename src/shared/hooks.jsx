// ============================================================
// KC Admin — Shared Hooks
// React hooks shared across apps
// ============================================================

import { useState, useRef } from "react";
import { emptyItem, ITEMS_COUNT, C } from './constants.jsx';
import { findSimilarCustomers, collapseItems } from './utils.jsx';

// Build initial item rows from an existing invoice (edit mode): split " | " continuation
// parts into _cont rows, mark originals _orig. Shared by DN + TI forms via useInvoiceForm.
export function initInvoiceItems(initial, isEdit) {
  if (!isEdit || !initial?.items) return [emptyItem()];
  const rows = [];
  initial.items.filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount).forEach(it => {
    const parts = (it.detail || "").split(" | ");
    rows.push({ ...it, _orig: true, detail: parts[0] || "" });
    for (let j = 1; j < parts.length; j++) rows.push({ ...emptyItem(), _cont: true, detail: parts[j] });
  });
  return rows;
}

// #111 Phase 1 — shared form logic for DeliveryNoteForm + TaxInvoiceForm.
// Owns item rows, all warning/edit state + refs, and every handler that was byte-identical
// between the two forms. Each form keeps its OWN customer-info card, items table, summary,
// payload shape, and api call (those differ per document type — intentionally not shared).
// detailAttr: the data-* attribute used to refocus a new continuation row ("data-detail-idx"
// for DN, "data-ti-detail-idx" for TI) — keeps the two forms' DOM namespaces separate.
export function useInvoiceForm({ initial, isEdit, products, detailAttr, maxRows = ITEMS_COUNT }) {
  const [items,            setItems]            = useState(() => initInvoiceItems(initial, isEdit));
  const [removedOrigItems, setRemovedOrigItems] = useState([]);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState("");
  const [pendingDelete,    setPendingDelete]    = useState(null);
  const [rowEditMode,      setRowEditMode]      = useState(false);
  const [allCustomers,     setAllCustomers]     = useState([]);
  const [custWarning,      setCustWarning]      = useState(null);
  const [newCustWarning,   setNewCustWarning]   = useState(null); // #127 — name string if customer not in system
  const [productWarning,   setProductWarning]   = useState(null); // { rowIndex, name, similar }
  const [addingProduct,    setAddingProduct]    = useState(false);
  const custConfirmedRef        = useRef(false);
  const skipCustomerLogRef      = useRef(false); // #127 — set true when user picks "ไม่ ไม่ต้องเพิ่ม"
  const nameSelectedFromListRef = useRef(false);
  const newCustCheckedRef       = useRef(false); // #160 — true when blur already ran unknown check (customer known, no modal needed)

  const checkProductName = (i, val) => {
    const trimmed = val.trim();
    if (!trimmed || products.includes(trimmed)) return;
    const similar = findSimilarCustomers(trimmed, products.map(p => ({ name: p })));
    setProductWarning({ rowIndex: i, name: trimmed, similar });
  };

  const checkNameSimilarity = (nameVal) => {
    if (isEdit || !nameVal.trim() || custConfirmedRef.current) return;
    const similar = findSimilarCustomers(nameVal, allCustomers);
    if (similar.length > 0) setCustWarning(similar);
  };

  // #160 — onBlur: run similar check then unknown check in sequence
  const checkNameOnBlur = (nameVal) => {
    if (isEdit || !nameVal.trim() || custConfirmedRef.current) return;
    if (allCustomers.length === 0) return; // #199 — API not loaded yet, skip check
    const similar = findSimilarCustomers(nameVal, allCustomers);
    if (similar.length > 0) { setCustWarning(similar); return; }
    const isKnown = allCustomers.some(c => (c.name || "").trim().toLowerCase() === nameVal.trim().toLowerCase());
    if (!isKnown && nameVal.trim()) { setNewCustWarning(nameVal.trim()); }
    else { newCustCheckedRef.current = true; } // customer known — guardedSave can skip unknown check
  };

  const updateItem = (i, field, val) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== i || (it._cont && field !== "detail")) return it;
      const updated = { ...it, [field]: val };
      if (field === "qty" || field === "unitPrice") {
        const q = parseFloat(field === "qty" ? val : it.qty) || 0;
        const p = parseFloat(field === "unitPrice" ? val : it.unitPrice) || 0;
        updated.amount = q * p || "";
      }
      return updated;
    }));
  };
  const updateDetail = (i, val) => {
    updateItem(i, "detail", val); // #133: no hard cap — PDF clips via overflow:hidden in nested table
  };

  const addRow = () => { if (items.length < maxRows) setItems([...items, emptyItem()]); };
  const addContinuationRow = (afterIndex) => {
    if (items.length >= maxRows) return;
    const next = [...items];
    next.splice(afterIndex + 1, 0, { ...emptyItem(), _cont: true });
    setItems(next);
    setTimeout(() => {
      const inputs = document.querySelectorAll(`[${detailAttr}]`);
      const target = [...inputs].find(el => el.getAttribute(detailAttr) === String(afterIndex + 1));
      if (target) target.focus();
    }, 30);
  };
  const removeRow = (i) => {
    if (items[i]?._orig) {
      const it = items[i];
      const note = [it.desc, it.desc2, it.qty].filter(Boolean).join(" ");
      if (note) setRemovedOrigItems(prev => [...prev, note]);
    }
    setItems(items.filter((_, idx) => idx !== i));
  };

  const cellInput = (i, field, align, extra = {}) => (
    <input value={items[i][field]} onChange={e => updateItem(i, field, e.target.value)}
      style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", outline: "none", textAlign: align || "left" }}
      onFocus={e => e.target.style.outline = `1px solid ${C.accent}`}
      onBlur={e => e.target.style.outline = "none"}
      {...extra}
    />
  );

  // Runs the new-invoice customer-similarity / unknown-customer guards, then (if cleared)
  // sets saving state and calls the form-supplied doSave({ filled, cleanItems, skipLog }).
  const guardedSave = async (name, doSave) => {
    // #188 — delegate all customer validation to checkNameOnBlur; never run checks here
    if (!isEdit && !custConfirmedRef.current && !newCustCheckedRef.current) {
      checkNameOnBlur(name);
      return;
    }
    custConfirmedRef.current = false;
    newCustCheckedRef.current = false;
    setCustWarning(null);
    setSaving(true);
    setError("");
    try {
      const { filled, cleanItems } = collapseItems(items);
      const skipLog = skipCustomerLogRef.current;
      skipCustomerLogRef.current = false;
      await doSave({ filled, cleanItems, skipLog });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return {
    items, setItems, removedOrigItems, setRemovedOrigItems,
    saving, error, setError, pendingDelete, setPendingDelete,
    rowEditMode, setRowEditMode, allCustomers, setAllCustomers,
    custWarning, setCustWarning, newCustWarning, setNewCustWarning,
    productWarning, setProductWarning, addingProduct, setAddingProduct,
    custConfirmedRef, skipCustomerLogRef, nameSelectedFromListRef,
    checkProductName, checkNameSimilarity, checkNameOnBlur, updateItem, updateDetail,
    addRow, addContinuationRow, removeRow, cellInput, guardedSave,
    newCustCheckedRef,
  };
}