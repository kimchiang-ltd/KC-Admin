// ============================================================
// KC Admin — Shared Autocomplete Components
// Customer and Product autocomplete dropdowns
// ============================================================

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { C } from './constants.jsx';
import { api } from './api.jsx';

// ── Customer name autocomplete (#19) ──────────────────────
// Shared by DeliveryNoteForm and TaxInvoiceForm.
// Loads all customers once on mount, filters locally as user types.
// onSelect(customer) called when user picks a suggestion — caller fills address/phone/taxId.

function CustomerAutocomplete({ value, onChange, onSelect, onCustomersLoaded, onBlur, style }) {
  const [customers, setCustomers] = useState([]);
  const [open, setOpen]           = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    api.getCustomers("").then(list => {
      const result = Array.isArray(list) ? list : [];
      setCustomers(result);
      if (onCustomersLoaded) onCustomersLoaded(result);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const q = value.toLowerCase();
  const filtered = q.length === 0
    ? customers
    : customers.filter(c => c.name.toLowerCase().includes(q));

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
        onBlur={onBlur}
        placeholder="ชื่อลูกค้า"
        style={style}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
          background: "white", border: `1px solid ${C.border}`, borderRadius: 4,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto"
        }}>
          {filtered.map((c, i) => (
            <div key={i}
              onMouseDown={e => { e.preventDefault(); onSelect(c); setOpen(false); }}
              style={{ padding: "8px 10px", fontSize: 12, cursor: "pointer", borderBottom: `0.5px solid ${C.borderLight}` }}
              onMouseEnter={e => e.currentTarget.style.background = "#EEF2FF"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              <div style={{ fontWeight: 500 }}>{c.name}</div>
              {c.address && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{c.address}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductAutocomplete({ value, onChange, onBlur, onEnter, products, style }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) &&
          (!dropdownRef.current || !dropdownRef.current.contains(e.target))) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useLayoutEffect(() => {
    if (open && inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      // Chrome 128+: body { zoom } creates a new fixed-positioning containing block.
      // getBoundingClientRect() returns viewport coords; divide by zoom to get body-local coords.
      const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      setRect({ bottom: r.bottom / zoom, left: r.left / zoom, width: r.width / zoom });
    }
  }, [open]);

  const openDropdown = () => { setOpen(true); setHighlightedIndex(-1); };

  const q = value.toLowerCase();
  const filtered = q.length === 0
    ? products
    : products.filter(p => p.toLowerCase().includes(q));

  return (
    <div ref={wrapRef}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); openDropdown(); }}
        onFocus={openDropdown}
        onKeyDown={e => {
          if (e.key === "Escape") { setOpen(false); return; }
          if (e.key === "Enter") {
            if (open && highlightedIndex >= 0 && filtered.length > 0) {
              e.preventDefault(); onChange(filtered[highlightedIndex]); setOpen(false);
            } else if (onEnter) { e.preventDefault(); onEnter(); }
            return;
          }
          if (!open || filtered.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(i => Math.max(i - 1, 0));
          }
        }}
        onBlur={() => { setOpen(false); if (onBlur) onBlur(); }}
        placeholder="— เลือกหรือพิมพ์สินค้า —"
        style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "3px 4px", ...style }}
      />
      {open && filtered.length > 0 && rect && (
        <div ref={dropdownRef} style={{ position: "fixed", top: rect.bottom + 2, left: rect.left, width: rect.width, zIndex: 9000, background: "white", border: `1px solid ${C.border}`, borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 180, overflowY: "auto" }}>
          {filtered.map((p, i) => (
            <div key={i}
              onMouseDown={e => { e.preventDefault(); onChange(p); setOpen(false); }}
              onMouseEnter={() => setHighlightedIndex(i)}
              onMouseLeave={() => setHighlightedIndex(-1)}
              style={{ padding: "6px 10px", fontSize: 12, cursor: "pointer", borderBottom: `0.5px solid ${C.borderLight}`, background: highlightedIndex === i ? "#C7D7FF" : "white" }}
            >{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export { CustomerAutocomplete, ProductAutocomplete };
