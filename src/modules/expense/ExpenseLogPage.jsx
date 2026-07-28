// ============================================================
// Expense Log Module — รายการซื้อวัตถุดิบ
// ============================================================
// #367c — Entry panel: supplier chips, day picker, amount/note, entry list
// #367d — Grid view: paper-style day×supplier grid with inline edit, auto-sum, sticky cols
// #369  — Month list page: year sections + 6-col cards + cache

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, Plus, Trash2, Save, CheckCircle, Loader, Pencil, ArrowLeft, Table2, List, Search, UserCheck, X, Printer, AlertCircle, Calendar, ChevronDown } from "lucide-react";
import { api } from '../../shared/api.jsx';
import { C } from '../../shared/constants.jsx';
import { Btn, Spinner, ErrorBox, ConfirmModal } from '../../shared/ui.jsx';
import { fmtAmt } from '../../shared/utils.jsx';

const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

// ── Module-level cache ───────────────────────────────────────
let _periodsCache = null;
let _entriesCache = {}; // #379 — per-period entries cache (keyed by "YYYY-MM")

// ── Month List Page ──────────────────────────────────────────

export function ExpenseLogListPage({ onViewChange, onSelectPeriod }) {
  const [periods, setPeriods] = useState(_periodsCache);
  const [loading, setLoading] = useState(!_periodsCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!_periodsCache) setLoading(true);
      setError(null);
      try {
        const res = await api.getExpenseLogPeriods();
        const data = Array.isArray(res) ? res : [];
        _periodsCache = data;
        if (mounted) { setPeriods(data); setLoading(false); }
      } catch (e) {
        if (mounted) { setError(e.message || "โหลดข้อมูลไม่สำเร็จ"); setLoading(false); }
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleCreate = () => {
    const now = new Date();
    const p = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    onSelectPeriod(p);
  };

  const handleSelect = (period) => {
    onSelectPeriod(period);
  };

  // Group periods by year (CE → BE for display)
  const byYear = {};
  (periods || []).forEach(p => {
    const [yearStr] = p.period.split("-");
    const yr = Number(yearStr);
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(p);
  });
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a); // newest first

  if (loading) return <Spinner text="กำลังโหลดรายการซื้อวัตถุดิบ..." />;
  if (error) return <ErrorBox msg={error} onRetry={() => { _periodsCache = null; window.location.reload(); }} />;

  const hasData = years.length > 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={18} color={C.accent} />
          <span style={{ fontSize: 15, fontWeight: 500 }}>รายการซื้อวัตถุดิบ</span>
        </div>
        <Btn onClick={handleCreate} style={{ padding: "8px 18px", borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
          <Plus size={14} /> สร้างเดือนใหม่
        </Btn>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
          <BookOpen size={36} color={C.border} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, marginBottom: 6 }}>ยังไม่มีข้อมูลรายการซื้อวัตถุดิบ</div>
          <div style={{ fontSize: 12 }}>กด "+ สร้างเดือนใหม่" เพื่อเริ่มบันทึกค่าใช้จ่าย</div>
        </div>
      )}

      {/* Year sections — only months with data */}
      {years.map(yr => {
        const beYear = yr + 543;
        const monthData = byYear[yr] || [];

        return (
          <div key={yr} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#444", marginBottom: 12 }}>
              พ.ศ. {beYear}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {monthData.map(pd => {
                const m = Number(pd.period.split("-")[1]) - 1; // 0-based
                return (
                  <div key={pd.period} onClick={() => handleSelect(pd.period)}
                    style={{ ...monthCardBase, cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(1,118,211,0.18)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{THAI_MONTHS[m]}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 14, fontVariantNumeric: "tabular-nums" }}>
                      ฿{fmtAmt(pd.totalAmount)}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                      {pd.entryCount} รายการ
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const monthCardBase = {
  background: C.cardBg, border: `0.5px solid ${C.border}`,
  borderLeft: `3px solid ${C.accent}`, borderRadius: "0 10px 10px 0",
  aspectRatio: "1", textAlign: "center",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  transition: "box-shadow 0.15s",
};

const DAY_HEADERS = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function daysInMonth(month, year) { // month 0-based, year CE
  return new Date(year, month + 1, 0).getDate();
}
function firstDow(month, year) { // 0=Sun
  return new Date(year, month, 1).getDay();
}
function makePeriod(month, year) { // month 0-based, year CE → "YYYY-MM"
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// ── Main Component ─────────────────────────────────────────

export function ExpenseLogPage({ onViewChange, onBack, initialPeriod }) {
  // Parse initial period "YYYY-MM" → month (0-based) + year
  const parsePeriod = (p) => {
    if (p) {
      const [y, m] = p.split("-").map(Number);
      if (y && m) return { m: m - 1, y };
    }
    const now = new Date();
    return { m: now.getMonth(), y: now.getFullYear() };
  };
  const init = parsePeriod(initialPeriod);
  const [month, setMonth] = useState(init.m); // 0-based
  const [year, setYear]   = useState(init.y);

  // Data
  const [entries, setEntries]     = useState([]);
  const [suppliers, setSuppliers] = useState([]); // from Expense_Suppliers sheet
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Form state
  const [selSupplier, setSelSupplier] = useState("");
  const [selDay, setSelDay]           = useState(null);
  const [lastDay, setLastDay]         = useState(null); // #382 — last saved day highlight
  const [amount, setAmount]           = useState("");
  const [note, setNote]               = useState("");
  const [editingId, setEditingId]     = useState(null); // null = new, number = editing existing
  const [previewId, setPreviewId]     = useState(null); // #382 — viewing existing entry read-only
  const [multiTxnList, setMultiTxnList] = useState(null); // #401 — array of entries when day+supplier has >1 txn
  const [saving]                      = useState(false); // #380 kept for button disabled — always false (optimistic save)
  const [saved, setSaved]             = useState(false);

  // #380 — optimistic save: temp id counter + pending status tracking
  const tempIdCounter = useRef(-1); // negative ids = temp, won't collide with real ids

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // New supplier prompt
  const [newSupplierName, setNewSupplierName] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [addingSupplier, setAddingSupplier]   = useState(false);

  // Action error toast (replaces alert())
  const [actionError, setActionError] = useState(null);
  const actionErrorTimer = useRef(null);
  const showError = (msg) => {
    setActionError(msg);
    if (actionErrorTimer.current) clearTimeout(actionErrorTimer.current);
    actionErrorTimer.current = setTimeout(() => setActionError(null), 4000);
  };

  // Supplier search filter
  const [supplierSearch, setSupplierSearch] = useState("");

  // Layout toggle: "entries" (default) or "grid"
  const [rightPanel, setRightPanel] = useState("entries");

  // Month picker popup
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(year); // year shown in picker popup
  const monthPickerRef = useRef(null);

  // Grid inline edit state
  const [gridEditCell, setGridEditCell] = useState(null); // { day, supplier, value }
  // gridSaving removed by #380 — cell status now driven by entry._status
  const [gridSavedCell, setGridSavedCell] = useState(null); // "day-supplier" key for flash

  const amountRef    = useRef(null);
  const calendarRef  = useRef(null); // #381 — for post-save pulse
  const noteRef      = useRef(null);
  const supplierRef  = useRef(null);
  const gridInputRef = useRef(null);

  const period = makePeriod(month, year);
  const beYear = year + 543;
  const monthLabel = THAI_MONTHS[month] + " " + beYear;
  const totalDays = daysInMonth(month, year);

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    // #379 — use cached entries if available (skip fetch on month nav back)
    const cached = _entriesCache[period];
    if (!cached) setLoading(true);
    setError(null);
    try {
      if (cached) {
        setEntries(cached);
        const supRes = await api.getExpenseSuppliers();
        setSuppliers(Array.isArray(supRes) ? supRes : (supRes.suppliers || []));
      } else {
        const [logRes, supRes] = await Promise.all([
          api.getExpenseLog(period),
          api.getExpenseSuppliers()
        ]);
        const ents = logRes.entries || [];
        _entriesCache[period] = ents;
        setEntries(ents);
        setSuppliers(Array.isArray(supRes) ? supRes : (supRes.suppliers || []));
      }
    } catch (e) {
      setError(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Period navigation ──────────────────────────────────────
  const changeMonth = (delta) => {
    let m = month + delta, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
    clearForm();
  };

  const selectMonthFromPicker = (m) => {
    setMonth(m);
    setYear(pickerYear);
    setShowMonthPicker(false);
    clearForm();
  };

  // Close month picker on click outside
  useEffect(() => {
    if (!showMonthPicker) return;
    const handler = (e) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) setShowMonthPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMonthPicker]);

  // ── Form helpers ───────────────────────────────────────────
  const clearForm = () => {
    setSelSupplier("");
    setSupplierSearch("");
    setSelDay(null);
    setAmount("");
    setNote("");
    setEditingId(null);
    setPreviewId(null); // #382
    setMultiTxnList(null); // #401
  };

  // #401 — helper: load entries for day+supplier, handle single vs multi
  const loadDaySupplier = (supplierName, day) => {
    const matches = entries.filter(e => e.supplier === supplierName && e.day === day);
    setMultiTxnList(null);
    if (matches.length > 1) {
      // Multiple txn — show list, don't load any into form
      setMultiTxnList(matches);
      setAmount("");
      setNote("");
      setEditingId(null);
      setPreviewId(null);
    } else if (matches.length === 1) {
      setAmount(String(matches[0].amount));
      setNote(matches[0].note || "");
      setPreviewId(matches[0].id);
      setEditingId(null);
    } else {
      setAmount("");
      setNote("");
      setEditingId(null);
      setPreviewId(null);
    }
    return matches.length;
  };

  // #401 — pick one txn from the multi-txn list to edit
  const pickTxnFromList = (entry) => {
    setMultiTxnList(null);
    setAmount(String(entry.amount));
    setNote(entry.note || "");
    setPreviewId(entry.id);
    setEditingId(null);
  };

  // #401 — start new txn from multi-txn list or preview
  const startNewTxnSameDay = () => {
    setMultiTxnList(null);
    setAmount("");
    setNote("");
    setEditingId(null);
    setPreviewId(null);
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  const selectSupplierChip = (name) => {
    setSelSupplier(name);
    if (selDay) {
      const count = loadDaySupplier(name, selDay);
      if (count === 0) setTimeout(() => amountRef.current?.focus(), 50);
    }
  };

  const selectDay = (d) => {
    setSelDay(d);
    setLastDay(null); // clear last-saved highlight
    if (selSupplier) {
      const count = loadDaySupplier(selSupplier, d);
      if (count === 0) {
        // #381 — don't reset amount when switching to empty day; preserve user-typed value
        setTimeout(() => amountRef.current?.focus(), 50);
      }
    }
  };

  // #382 — clicking entry from list → preview mode (read-only until แก้ไข clicked)
  const editEntry = (entry) => {
    setSelSupplier(entry.supplier);
    setSelDay(entry.day);
    setAmount(String(entry.amount));
    setNote(entry.note || "");
    setPreviewId(entry.id);
    setEditingId(null);
  };

  // ── Save (#380 — optimistic, non-blocking) ─────────────────
  const handleSave = () => {
    if (!selSupplier) { supplierRef.current?.focus(); return; }
    if (!selDay) return;
    const numAmt = parseFloat(String(amount).replace(/,/g, ""));
    if (!numAmt || numAmt <= 0) { amountRef.current?.focus(); return; }

    const isEdit = !!editingId;
    const data = { period, day: selDay, supplier: selSupplier, amount: numAmt, note: note.trim() };
    if (isEdit) data.id = editingId;

    // Optimistic update — show entry immediately
    const tempId = isEdit ? editingId : (tempIdCounter.current--);
    const optimistic = { id: tempId, period, day: selDay, supplier: selSupplier, amount: numAmt, note: note.trim(), _status: "pending" };

    setEntries(prev => {
      if (isEdit) return prev.map(e => e.id === editingId ? optimistic : e);
      return [...prev, optimistic];
    });

    // Clear form immediately — user can enter next
    setLastDay(selDay); // #382 — highlight last saved day
    setSelDay(null);
    setAmount("");
    setNote("");
    setEditingId(null);
    setPreviewId(null);
    setMultiTxnList(null); // #401
    // #381 — pulse calendar to guide user to pick next day (amount disabled until day selected)
    if (calendarRef.current) {
      calendarRef.current.style.boxShadow = `0 0 0 2px ${C.accent}`;
      setTimeout(() => { if (calendarRef.current) calendarRef.current.style.boxShadow = "none"; }, 1500);
    }

    // Fire API in background
    api.saveExpenseEntry(data).then(res => {
      // Success — replace temp with real id, clear status
      setEntries(prev => {
        const updated = prev.map(e => e.id === tempId ? { ...e, id: res.id, _status: null } : e);
        _entriesCache[period] = updated.filter(e => !e._status); // cache only confirmed
        return updated;
      });
      _periodsCache = null;
    }).catch(err => {
      // Failed — mark entry red
      setEntries(prev => prev.map(e => e.id === tempId ? { ...e, _status: "failed", _saveData: data } : e));
      showError("บันทึกไม่สำเร็จ: " + (err.message || "ลองใหม่อีกครั้ง"));
    });
  };

  // #380 — retry a failed save
  const retrySave = (entry) => {
    const data = entry._saveData;
    if (!data) return;
    const tempId = entry.id;
    setEntries(prev => prev.map(e => e.id === tempId ? { ...e, _status: "pending" } : e));
    api.saveExpenseEntry(data).then(res => {
      setEntries(prev => {
        const updated = prev.map(e => e.id === tempId ? { ...e, id: res.id, _status: null, _saveData: undefined } : e);
        _entriesCache[period] = updated.filter(e => !e._status);
        return updated;
      });
      _periodsCache = null;
    }).catch(err => {
      setEntries(prev => prev.map(e => e.id === tempId ? { ...e, _status: "failed" } : e));
      showError("บันทึกไม่สำเร็จ: " + (err.message || "ลองใหม่อีกครั้ง"));
    });
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteExpenseEntry(deleteTarget.id);
      const logRes = await api.getExpenseLog(period);
      const ents = logRes.entries || [];
      _entriesCache[period] = ents;
      setEntries(ents);
      _periodsCache = null;
      setDeleteTarget(null);
      // If we were editing this entry, clear form
      if (editingId === deleteTarget.id) clearForm();
    } catch (e) {
      showError("ลบไม่สำเร็จ: " + (e.message || "ลองใหม่อีกครั้ง"));
    } finally {
      setDeleting(false);
    }
  };

  // ── Add new supplier ───────────────────────────────────────
  const handleAddSupplier = async () => {
    const name = newSupplierName.trim();
    if (!name) return;
    if (suppliers.some(s => s.name === name)) { setShowAddSupplier(false); setNewSupplierName(""); return; }
    setAddingSupplier(true);
    try {
      await api.createExpenseSupplier({ name });
      const supRes = await api.getExpenseSuppliers();
      setSuppliers(Array.isArray(supRes) ? supRes : (supRes.suppliers || []));
      setSelSupplier(name); // Auto-select so user can start entering amounts
      setShowAddSupplier(false);
      setNewSupplierName("");
      // Focus amount field so user can immediately type an entry
      setTimeout(() => amountRef.current?.focus(), 100);
    } catch (e) {
      showError("เพิ่มผู้ขายไม่สำเร็จ: " + (e.message || "ลองใหม่อีกครั้ง"));
    } finally {
      setAddingSupplier(false);
    }
  };

  // ── Grid cell save ──────────────────────────────────────────
  // #380 — optimistic grid cell save (non-blocking)
  const handleGridCellSave = (day, supplier, rawVal) => {
    const val = parseFloat(String(rawVal).replace(/,/g, ""));
    const cellKey = `${day}-${supplier}`;
    const existing = entries.find(e => e.day === day && e.supplier === supplier);

    // Empty or zero → delete existing entry
    if (!val || val <= 0) {
      setGridEditCell(null);
      if (existing) {
        // Optimistic delete — remove from state immediately
        const deletedId = existing.id;
        setEntries(prev => prev.filter(e => e.id !== deletedId));
        api.deleteExpenseEntry(deletedId).then(() => {
          setEntries(prev => { _entriesCache[period] = prev; return prev; });
          _periodsCache = null;
        }).catch(err => {
          // Restore entry on failure
          setEntries(prev => { const restored = [...prev, { ...existing, _status: "failed" }]; _entriesCache[period] = restored; return restored; });
          showError("ลบไม่สำเร็จ: " + (err.message || "ลองใหม่อีกครั้ง"));
        });
      }
      return;
    }

    // Same value — no-op
    if (existing && existing.amount === val) { setGridEditCell(null); return; }

    setGridEditCell(null);
    const data = { period, day, supplier, amount: val, note: existing?.note || "" };
    const isEdit = !!existing;
    if (isEdit) data.id = existing.id;
    const tempId = isEdit ? existing.id : (tempIdCounter.current--);

    // Optimistic update — show value immediately with pending status
    const optimistic = { id: tempId, period, day, supplier, amount: val, note: existing?.note || "", _status: "pending" };
    setEntries(prev => {
      if (isEdit) return prev.map(e => e.id === existing.id ? optimistic : e);
      return [...prev, optimistic];
    });

    api.saveExpenseEntry(data).then(res => {
      setEntries(prev => {
        const updated = prev.map(e => e.id === tempId ? { ...e, id: res.id, _status: null } : e);
        _entriesCache[period] = updated.filter(e => !e._status);
        return updated;
      });
      _periodsCache = null;
      // Flash green briefly
      setGridSavedCell(cellKey);
      setTimeout(() => setGridSavedCell(null), 1200);
    }).catch(err => {
      setEntries(prev => prev.map(e => e.id === tempId ? { ...e, _status: "failed", _saveData: data } : e));
      showError("บันทึกไม่สำเร็จ: " + (err.message || "ลองใหม่อีกครั้ง"));
    });
  };

  const startGridEdit = (day, supplier, currentVal) => {
    setGridEditCell({ day, supplier, value: currentVal ? String(currentVal) : "" });
    setTimeout(() => gridInputRef.current?.focus(), 30);
  };

  // ── Keyboard: Enter saves ──────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  // ── Derived data ───────────────────────────────────────────
  const daysWithEntries = new Set(
    entries.filter(e => e.supplier === selSupplier).map(e => e.day)
  );
  const sortedEntries = [...entries].sort((a, b) => {
    if (b.day !== a.day) return b.day - a.day;
    return (a.supplier || "").localeCompare(b.supplier || "");
  });
  const totalAmount = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Grid: columns derived from entries only — each month starts blank, columns appear when entries exist
  const masterNames = suppliers.map(s => s.name);
  const entrySupplierNames = [...new Set(entries.map(e => e.supplier))];
  // Order: master-list order first (for known suppliers), then ad-hoc names alphabetically
  const knownInEntries = masterNames.filter(n => entrySupplierNames.includes(n));
  const adHocInEntries = entrySupplierNames.filter(n => !masterNames.includes(n)).sort();
  const gridSuppliers = [...knownInEntries, ...adHocInEntries];

  // #401 — Lookup map: "day-supplier" → array of entries (supports multi-txn)
  const entryLookup = {};
  entries.forEach(e => {
    const key = `${e.day}-${e.supplier}`;
    if (!entryLookup[key]) entryLookup[key] = [];
    entryLookup[key].push(e);
  });

  // Column sums & row sums
  const colSums = {};
  gridSuppliers.forEach(s => { colSums[s] = 0; });
  const rowSums = {};
  let grandTotal = 0;
  entries.forEach(e => {
    colSums[e.supplier] = (colSums[e.supplier] || 0) + (Number(e.amount) || 0);
    rowSums[e.day] = (rowSums[e.day] || 0) + (Number(e.amount) || 0);
    grandTotal += (Number(e.amount) || 0);
  });

  // ── Render ─────────────────────────────────────────────────
  if (loading) return <Spinner text="กำลังโหลดรายการซื้อวัตถุดิบ..." />;
  if (error) return <ErrorBox msg={error} onRetry={loadData} />;

  const printMode = rightPanel === "grid" ? "landscape" : "portrait";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }} data-expense-page>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: ${printMode}; margin: 10mm; }
          body > * { visibility: hidden !important; }
          [data-expense-page], [data-expense-page] * { visibility: visible !important; }
          [data-expense-page] {
            position: absolute !important; left: 0; top: 0; width: 100% !important;
            height: auto !important; overflow: visible !important;
          }
          [data-print-hide] { display: none !important; }
          [data-expense-page] table { font-size: 11px !important; }
          [data-expense-page] table th, [data-expense-page] table td {
            border: 0.5px solid #ccc !important; padding: 3px 6px !important;
          }
        }
      `}</style>
      {/* Header card */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 10, padding: "14px 18px",
        background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 10,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && (
              <button data-print-hide onClick={onBack} style={{
                background: "none", border: "none", cursor: "pointer", color: C.muted,
                padding: 4, display: "flex", alignItems: "center", borderRadius: 4,
              }}
                onMouseEnter={e => e.currentTarget.style.color = C.accent}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                <ArrowLeft size={16} />
              </button>
            )}
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: "#E6F1FB",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BookOpen size={20} color={C.accent} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>รายการซื้อวัตถุดิบ</div>
          </div>
          {/* Month picker dropdown — aligned with icon (back btn 24px + gap 10px) */}
          <div style={{ position: "relative", marginLeft: onBack ? 34 : 0 }} ref={monthPickerRef}>
            <button data-print-hide onClick={() => { setPickerYear(year); setShowMonthPicker(v => !v); }} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
              border: `1px solid ${C.accent}`, borderRadius: 6, background: C.cardBg,
              color: C.accent, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>
              <Calendar size={14} />
              {monthLabel}
              <ChevronDown size={13} />
            </button>
            {showMonthPicker && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
                background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10,
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)", padding: 12, width: 260,
              }}>
                {/* Year nav */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <button onClick={() => setPickerYear(y => y - 1)} style={{ ...periodBtnStyle, width: 28, height: 28 }}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{pickerYear + 543}</span>
                  <button onClick={() => setPickerYear(y => y + 1)} style={{ ...periodBtnStyle, width: 28, height: 28 }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
                {/* Month grid 4×3 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {THAI_MONTHS_SHORT.map((mLabel, i) => {
                    const isCurrent = i === month && pickerYear === year;
                    return (
                      <button key={i} onClick={() => selectMonthFromPicker(i)} style={{
                        padding: "8px 4px", border: isCurrent ? `1px solid ${C.accent}` : `0.5px solid ${C.border}`,
                        borderRadius: 6, background: isCurrent ? C.accent : C.cardBg,
                        color: isCurrent ? "#fff" : C.text, fontSize: 13, fontWeight: isCurrent ? 600 : 400,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                        onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
                        onMouseLeave={e => { if (!isCurrent) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; } }}>
                        {mLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Print + Stats */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <button onClick={() => window.print()} data-print-hide style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
            border: `1px solid ${C.accent}`, borderRadius: 6, background: C.cardBg,
            color: C.accent, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#E6F1FB"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.cardBg; }}>
            <Printer size={14} /> พิมพ์
          </button>
          {entries.length > 0 && (
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.text, background: C.pageBg, padding: "3px 8px", borderRadius: 6 }}>
                {entries.length} รายการ
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: "#E6F1FB", padding: "3px 8px", borderRadius: 6 }}>
                ฿{fmtAmt(totalAmount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action error toast */}
      {actionError && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 8,
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
          color: "#991B1B", fontSize: 13, animation: "fadeIn 0.2s",
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{
            background: "none", border: "none", color: "#991B1B", cursor: "pointer",
            padding: 2, display: "flex", opacity: 0.6,
          }}><X size={14} /></button>
        </div>
      )}

      {/* Content: form + (entry list OR grid) with toggle */}
      <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0, position: "relative" }}>
        {/* Entry Form — flex:1 (50% in state 1, 25% in state 2 via flex:1 vs flex:3) */}
        <div data-print-hide style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ ...cardStyle, flex: 1, borderRadius: 10, display: "flex", flexDirection: "column", overflow: "auto" }}>
            <div style={cardHeaderStyle}>
              <span>บันทึกค่าใช้จ่าย</span>
              {saved && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.success, fontSize: 12 }}>
                  <CheckCircle size={14} /> บันทึกแล้ว
                </span>
              )}
            </div>
            <div style={{ padding: 16 }}>
              {/* Supplier chips */}
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>ผู้ขาย</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {(supplierSearch
                    ? suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                    : suppliers
                  ).map(s => (
                    <button key={s.id} onClick={() => { selectSupplierChip(s.name); setSupplierSearch(""); }}
                      style={{ ...chipStyle, ...(selSupplier === s.name ? chipSelectedStyle : {}) }}>
                      {s.name}
                      {selSupplier === s.name && (
                        <span style={{
                          position: "absolute", right: -5, top: -5, width: 16, height: 16,
                          borderRadius: "50%", background: C.success, color: "#fff",
                          fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
                          lineHeight: 1,
                        }}>✓</span>
                      )}
                    </button>
                  ))}
                  <button onClick={() => setShowAddSupplier(true)} style={chipAddStyle}>
                    <Plus size={12} /> เพิ่ม
                  </button>
                </div>
                {/* Search bar (no selection) or Status bar (selected) */}
                {selSupplier ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", background: "#E6F1FB",
                    borderRadius: 8, border: "1px solid rgba(1,118,211,0.2)",
                  }}>
                    <UserCheck size={16} color={C.accent} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.accent, flex: 1 }}>{selSupplier}</span>
                    <button onClick={() => { setSelSupplier(""); setSupplierSearch(""); }}
                      style={{
                        width: 20, height: 20, borderRadius: "50%", border: "none",
                        background: "rgba(1,118,211,0.15)", color: C.accent,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 0, fontFamily: "inherit",
                      }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
                    <input ref={supplierRef} value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="ค้นหาผู้ขาย..."
                      style={{ ...formInputStyle, fontFamily: "inherit", paddingLeft: 30 }} />
                  </div>
                )}
              </div>

              {/* Day picker */}
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>วันที่</div>
                <div ref={calendarRef} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, borderRadius: 8, transition: "box-shadow 0.3s", padding: 2 }}>
                  {/* Day-of-week headers */}
                  {DAY_HEADERS.map((h, i) => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 600, color: (i === 0 || i === 6) ? C.danger : C.muted, textAlign: "center", paddingBottom: 4 }}>
                      {h}
                    </div>
                  ))}
                  {/* Empty cells before day 1 */}
                  {Array.from({ length: firstDow(month, year) }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {/* Day cells */}
                  {Array.from({ length: totalDays }, (_, i) => {
                    const d = i + 1;
                    const dow = (firstDow(month, year) + i) % 7;
                    const isWe = dow === 0 || dow === 6;
                    const isSel = selDay === d;
                    const isLast = lastDay === d && !isSel; // #382 — last saved day
                    const hasEntry = daysWithEntries.has(d);
                    return (
                      <button key={d} onClick={() => selectDay(d)}
                        style={{
                          height: 30,
                          border: isLast ? `2px dashed ${C.accent}` : `0.5px solid ${isSel ? C.accent : C.borderLight}`,
                          borderRadius: 5,
                          background: isSel ? C.accent : isLast ? "rgba(1,118,211,0.06)" : C.cardBg,
                          color: isSel ? "#fff" : isWe ? C.danger : C.text,
                          fontSize: 12, fontWeight: isSel ? 600 : hasEntry ? 500 : 400,
                          cursor: "pointer", position: "relative",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontVariantNumeric: "tabular-nums", fontFamily: "inherit",
                        }}>
                        {d}
                        {hasEntry && (
                          <span style={{
                            position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: "50%",
                            background: isSel ? "rgba(255,255,255,0.8)" : C.accent
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* #401 — Multi-txn list: shown when day+supplier has >1 entry */}
              {multiTxnList ? (
                <div>
                  <div style={{ background: C.pageBg, borderRadius: 8, border: `0.5px solid ${C.border}`, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: C.muted, padding: "8px 10px 4px", fontWeight: 500 }}>
                      {multiTxnList.length} รายการ — เลือกเพื่อแก้ไข
                    </div>
                    <div style={{ padding: "4px 6px" }}>
                      {multiTxnList.map(txn => (
                        <div key={txn.id} onClick={() => pickTxnFromList(txn)}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                            border: `0.5px solid ${C.border}`, marginBottom: 4, background: C.cardBg,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>฿{fmtAmt(txn.amount)}</div>
                            {txn.note && <div style={{ fontSize: 11, color: C.muted }}>{txn.note}</div>}
                          </div>
                          <ChevronRight size={14} color={C.muted} />
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: "4px 6px 8px" }}>
                      <button onClick={startNewTxnSameDay} style={{
                        width: "100%", padding: 7, border: `1px dashed ${C.accent}`, borderRadius: 6,
                        background: "none", color: C.accent, fontSize: 12, fontWeight: 500,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        fontFamily: "inherit",
                      }}>
                        <Plus size={13} /> เพิ่มรายการใหม่
                      </button>
                    </div>
                  </div>
                  <button onClick={clearForm} style={{ width: "100%", height: 32, border: `0.5px solid ${C.border}`, borderRadius: 6, background: C.cardBg, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    ยกเลิก
                  </button>
                </div>
              ) : (
              <>
              {/* Amount */}
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>จำนวนเงิน (฿)</div>
                <input ref={amountRef} value={amount}
                  disabled={!selDay || !!previewId}
                  onChange={e => setAmount(e.target.value)}
                  onBlur={e => {
                    const v = parseFloat(e.target.value.replace(/,/g, ""));
                    if (!isNaN(v) && v > 0) setAmount(fmtAmt(v));
                  }}
                  onFocus={e => {
                    // Remove formatting on focus for editing
                    const v = parseFloat(e.target.value.replace(/,/g, ""));
                    if (!isNaN(v)) setAmount(String(v));
                  }}
                  onKeyDown={handleKeyDown}
                  inputMode="decimal" placeholder={selDay ? "0.00" : "กรุณาเลือกวันที่"}
                  style={{ ...formInputStyle, fontSize: 20, fontWeight: 600, textAlign: "right", height: 46, fontFamily: "inherit", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", opacity: (!selDay || previewId) ? 0.4 : 1, background: (!selDay || previewId) ? C.pageBg : C.cardBg }}
                />
              </div>

              {/* Note */}
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>หมายเหตุ (ไม่บังคับ)</div>
                <input ref={noteRef} value={note} onChange={e => setNote(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  style={{ ...formInputStyle, fontFamily: "inherit" }} />
              </div>

              {/* #382 — Preview: unlock edit button / Edit: save button / New: save button */}
              {previewId ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditingId(previewId); setPreviewId(null); setTimeout(() => amountRef.current?.focus(), 50); }}
                    style={{
                      flex: 1, height: 40, border: `1.5px solid ${C.accent}`, borderRadius: 6,
                      background: C.cardBg, color: C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                    <Pencil size={14} /> แก้ไข
                  </button>
                  {/* #401 — add new txn for same day+supplier */}
                  <button onClick={startNewTxnSameDay}
                    style={{
                      flex: 1, height: 40, border: `1px dashed ${C.accent}`, borderRadius: 6,
                      background: "none", color: C.accent, fontSize: 13, fontWeight: 500, cursor: "pointer",
                      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}>
                    <Plus size={14} /> เพิ่มรายการใหม่
                  </button>
                </div>
              ) : (
                <button onClick={handleSave} disabled={saving || !selSupplier || !selDay}
                  style={{
                    width: "100%", height: 40, border: "none", borderRadius: 6,
                    background: (!selSupplier || !selDay) ? C.border : C.accent,
                    color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    opacity: saving ? 0.7 : 1,
                    boxShadow: (!selSupplier || !selDay) ? "none" : "0 2px 8px rgba(1,118,211,0.25)",
                  }}>
                  {saving ? <Loader size={15} style={{ animation: "spin 0.8s linear infinite" }} /> :
                   <><Save size={14} /> บันทึก</>}
                </button>
              )}
              {(editingId || previewId) && (
                <button onClick={() => { clearForm(); setPreviewId(null); }} style={{ width: "100%", marginTop: 6, height: 32, border: `0.5px solid ${C.border}`, borderRadius: 6, background: C.cardBg, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  ยกเลิก
                </button>
              )}
              <div style={{ textAlign: "center", fontSize: 10, color: C.muted, marginTop: 8 }}>
                เลือกผู้ขาย → คลิกวัน → พิมพ์จำนวน → Enter บันทึก
              </div>
              </>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — entry list OR grid */}
        <div style={{ flex: rightPanel === "grid" ? 3 : 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ ...cardStyle, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", borderRadius: 10 }}>

            {/* Entry List content */}
            {rightPanel === "entries" && (
            <>
            <div style={{ padding: "8px 14px", borderBottom: `0.5px solid ${C.borderLight}`, fontWeight: 600, fontSize: 13 }}>
              รายการที่บันทึก ({entries.length})
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 14px" }}>
              {sortedEntries.length === 0 ? (
                <div style={{ textAlign: "center", color: C.muted, padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <BookOpen size={28} color={C.border} />
                  <div style={{ fontSize: 13, fontWeight: 500 }}>ยังไม่มีรายการเดือนนี้</div>
                  <div style={{ fontSize: 11 }}>เลือกผู้ขาย → คลิกวัน → พิมพ์จำนวน → Enter</div>
                </div>
              ) : sortedEntries.map(e => (
                <div key={e.id} onClick={() => { if (e._status === "failed") { retrySave(e); return; } editEntry(e); }}
                  style={{
                    display: "flex", alignItems: "center", padding: "8px 4px",
                    borderBottom: `0.5px solid ${C.borderLight}`, cursor: "pointer",
                    borderRadius: 4, margin: "0 -4px",
                    background: editingId === e.id ? "#E6F1FB" : "transparent",
                  }}
                  onMouseEnter={ev => { if (editingId !== e.id) ev.currentTarget.style.background = C.rowHover; }}
                  onMouseLeave={ev => { if (editingId !== e.id) ev.currentTarget.style.background = "transparent"; }}>
                  {/* #380 — status dot: green check / amber spinner / red X */}
                  {e._status === "pending" ? (
                    <Loader size={12} style={{ color: "#d29922", animation: "spin 0.8s linear infinite", marginRight: 6, flexShrink: 0 }} />
                  ) : e._status === "failed" ? (
                    <span title="คลิกเพื่อลองใหม่" style={{ color: "#cf222e", marginRight: 6, fontSize: 13, lineHeight: 1, flexShrink: 0, cursor: "pointer" }}>✕</span>
                  ) : (
                    <Check size={12} style={{ color: "#2da44e", marginRight: 6, flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 12, color: C.text }}>{e.supplier}</span>
                  <span style={{ width: 32, textAlign: "center", color: C.muted, fontSize: 11, background: C.pageBg, borderRadius: 4, padding: "2px 0", marginRight: 8 }}>{e.day}</span>
                  <span style={{ fontWeight: 500, fontSize: 12, fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 80, color: C.text }}>{fmtAmt(e.amount)}</span>
                  <button data-print-hide onClick={ev => { ev.stopPropagation(); setDeleteTarget(e); }}
                    style={{ background: "none", border: "none", color: "rgba(0,0,0,0.15)", cursor: "pointer", marginLeft: 4, padding: 4 }}
                    onMouseEnter={ev => ev.currentTarget.style.color = C.danger}
                    onMouseLeave={ev => ev.currentTarget.style.color = "rgba(0,0,0,0.15)"}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            </>
            )}

            {/* Grid view content */}
            {rightPanel === "grid" && (
            <>
              <div style={{ padding: "8px 14px", borderBottom: `0.5px solid ${C.borderLight}`, fontWeight: 600, fontSize: 13 }}>
                ตารางสรุป
              </div>

            {/* Grid table */}
            {gridSuppliers.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 12, gap: 8, padding: 20 }}>
                <BookOpen size={28} color={C.border} />
                <span>ยังไม่มีข้อมูลเดือนนี้</span>
                <span style={{ fontSize: 11 }}>บันทึกค่าใช้จ่ายจากแผงซ้าย แล้วตารางจะแสดงอัตโนมัติ</span>
              </div>
            ) : (
              <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr>
                      <th style={gridThDay}>วัน</th>
                      {gridSuppliers.map(s => (
                        <th key={s} style={gridTh}>{s}</th>
                      ))}
                      <th style={gridThSum}>รวม/วัน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: totalDays }, (_, i) => {
                      const d = i + 1;
                      const dow = (firstDow(month, year) + i) % 7;
                      const isWe = dow === 0 || dow === 6;
                      const isOdd = i % 2 === 0;
                      const rowBg = isOdd ? C.cardBg : "#f9fafb";
                      const rs = rowSums[d] || 0;

                      return (
                        <tr key={d}
                          onMouseEnter={ev => { ev.currentTarget.querySelectorAll("td").forEach(td => td.style.background = "#E6F1FB"); }}
                          onMouseLeave={ev => {
                            const bg = isOdd ? C.cardBg : "#f9fafb";
                            ev.currentTarget.querySelectorAll("td").forEach((td, idx) => {
                              td.style.background = bg;
                            });
                          }}>
                          {/* Day column — sticky left */}
                          <td style={{ ...gridTdDay, background: rowBg, color: isWe ? C.danger : C.muted }}>{d}</td>

                          {/* Supplier cells — #401 supports multi-txn */}
                          {gridSuppliers.map(s => {
                            const cellKey = `${d}-${s}`;
                            const cellEntries = entryLookup[cellKey] || [];
                            const isMulti = cellEntries.length > 1;
                            const entry = cellEntries[0] || null; // first entry (for single-txn compat)
                            const val = cellEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                            const isEditing = !isMulti && gridEditCell && gridEditCell.day === d && gridEditCell.supplier === s;
                            const justSaved = gridSavedCell === cellKey;

                            if (isEditing) {
                              return (
                                <td key={s} style={{ ...gridTdData, background: rowBg, padding: 3 }}>
                                  <input ref={gridInputRef}
                                    value={gridEditCell.value}
                                    onChange={ev => setGridEditCell({ ...gridEditCell, value: ev.target.value })}
                                    onKeyDown={ev => {
                                      if (ev.key === "Enter") { ev.preventDefault(); handleGridCellSave(d, s, gridEditCell.value); }
                                      if (ev.key === "Escape") { ev.preventDefault(); setGridEditCell(null); }
                                      if (ev.key === "Tab") { ev.preventDefault(); handleGridCellSave(d, s, gridEditCell.value); }
                                    }}
                                    onBlur={() => handleGridCellSave(d, s, gridEditCell.value)}
                                    inputMode="decimal"
                                    style={gridCellInputStyle}
                                  />
                                </td>
                              );
                            }

                            // #380 — status from entry's _status field (for multi, check any pending/failed)
                            const cellStatus = isMulti
                              ? (cellEntries.some(e => e._status === "failed") ? "failed" : cellEntries.some(e => e._status === "pending") ? "pending" : null)
                              : entry?._status;
                            const cellBg = cellStatus === "failed" ? C.dangerBg : justSaved ? C.successBg : rowBg;

                            // #401 — multi-txn click: switch to form mode with list
                            const handleCellClick = () => {
                              if (isMulti) {
                                setSelSupplier(s);
                                setSelDay(d);
                                setMultiTxnList(cellEntries);
                                setAmount("");
                                setNote("");
                                setEditingId(null);
                                setPreviewId(null);
                                setRightPanel("entries"); // switch to form+list view
                                return;
                              }
                              if (cellStatus === "failed" && entry?._saveData) { retrySave(entry); return; }
                              startGridEdit(d, s, entry ? Number(entry.amount) : 0);
                            };

                            return (
                              <td key={s}
                                onClick={handleCellClick}
                                style={{
                                  ...gridTdData, background: cellBg,
                                  color: val ? C.text : "transparent", fontWeight: val ? 400 : 300,
                                  cursor: "pointer", transition: "background 0.3s",
                                  position: "relative", verticalAlign: "top",
                                }}
                                onMouseEnter={ev => { if (val) ev.currentTarget.style.background = cellStatus === "failed" ? C.dangerBg : "#E6F1FB"; }}
                                onMouseLeave={ev => { ev.currentTarget.style.background = cellBg; }}
                                title={isMulti ? `${cellEntries.length} รายการ — คลิกเพื่อดู` : cellStatus === "pending" ? "กำลังบันทึก..." : cellStatus === "failed" ? "คลิกเพื่อลองใหม่" : val ? "คลิกเพื่อแก้ไข" : "คลิกเพื่อเพิ่ม"}>
                                {isMulti
                                  ? cellEntries.map((ce, idx) => <div key={ce.id || idx} style={{ lineHeight: 1.4 }}>{fmtAmt(Number(ce.amount))}</div>)
                                  : (val ? fmtAmt(val) : "—")
                                }
                                {cellStatus === "pending" && <Loader size={10} style={{ position: "absolute", top: 3, right: 3, color: "#d29922", animation: "spin 0.8s linear infinite" }} />}
                                {cellStatus === "failed" && <span style={{ position: "absolute", top: 1, right: 4, color: "#cf222e", fontSize: 10, lineHeight: 1 }}>✕</span>}
                              </td>
                            );
                          })}

                          {/* Row total — sticky right */}
                          <td style={{ ...gridTdSum, background: rowBg }}>{rs ? fmtAmt(rs) : ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Sum footer row */}
                  <tfoot>
                    <tr>
                      <td style={gridFootDay}>รวม</td>
                      {gridSuppliers.map(s => (
                        <td key={s} style={gridFootData}>{colSums[s] ? fmtAmt(colSums[s]) : ""}</td>
                      ))}
                      <td style={gridFootGrand}>{grandTotal ? fmtAmt(grandTotal) : ""}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Keyboard hint */}
            <div data-print-hide style={{ padding: "8px 16px", borderTop: `0.5px solid ${C.borderLight}`, fontSize: 11, color: C.muted, display: "flex", gap: 14 }}>
              <span>คลิกช่องเพื่อแก้ไข</span>
              <span><kbd style={kbdStyle}>Enter</kbd> บันทึก</span>
              <span><kbd style={kbdStyle}>Esc</kbd> ยกเลิก</span>
            </div>
            </>
            )}

          </div>
        </div>

        {/* Floating pill toggle — same top-right position in both states */}
        <button data-print-hide onClick={() => setRightPanel(rightPanel === "entries" ? "grid" : "entries")}
          style={{
            position: "absolute", right: -6, top: -6, zIndex: 2,
            background: C.accent, color: "#fff", border: "none",
            padding: "6px 14px", borderRadius: 8, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
            boxShadow: "0 2px 8px rgba(1,118,211,0.3)",
            fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          {rightPanel === "entries" ? <><Table2 size={15} /> ตาราง</> : <><List size={15} /> รายการ</>}
        </button>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <ConfirmModal
          message={`ลบรายการ "${deleteTarget.supplier}" วันที่ ${deleteTarget.day} จำนวน ฿${fmtAmt(deleteTarget.amount)}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel="ลบ"
          loading={deleting}
        />
      )}

      {/* Add supplier modal */}
      {showAddSupplier && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "white", borderRadius: 10, padding: "24px 28px", minWidth: 280, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>เพิ่มผู้ขายใหม่</div>
            <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddSupplier(); if (e.key === "Escape") { setShowAddSupplier(false); setNewSupplierName(""); } }}
              placeholder="ชื่อผู้ขาย..."
              autoFocus
              style={{ ...formInputStyle, width: "100%", marginBottom: 16, fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={() => { setShowAddSupplier(false); setNewSupplierName(""); }}
                style={{ padding: "7px 18px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "white", color: C.text }}>
                ยกเลิก
              </Btn>
              <Btn primary onClick={handleAddSupplier} disabled={addingSupplier || !newSupplierName.trim()}
                style={{ padding: "7px 18px", borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
                {addingSupplier && <Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} />}
                เพิ่ม
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Spin keyframe (for Loader icon) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); }} @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); }}`}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────

const cardStyle = {
  background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 10,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  overflow: "hidden",
};

const cardHeaderStyle = {
  padding: "12px 16px", borderBottom: `0.5px solid ${C.borderLight}`,
  fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between",
};

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.03em",
};

const formInputStyle = {
  width: "100%", height: 36, border: `0.5px solid ${C.border}`, borderRadius: 6,
  padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box",
  background: C.cardBg, color: C.text,
};

const chipStyle = {
  padding: "5px 12px", borderRadius: 16, fontSize: 12, border: `0.5px solid ${C.border}`,
  background: C.cardBg, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
  fontWeight: 400, color: C.text,
};

const chipSelectedStyle = {
  background: C.accent, color: "#fff", borderColor: C.accent, fontWeight: 600,
  boxShadow: "0 2px 8px rgba(1,118,211,0.25)",
  padding: "7px 16px", fontSize: 14, borderRadius: 18, position: "relative",
};

const chipAddStyle = {
  ...chipStyle, borderStyle: "dashed", color: C.muted, borderColor: "rgba(0,0,0,0.15)",
  display: "inline-flex", alignItems: "center", gap: 3,
};

const periodBtnStyle = {
  width: 28, height: 28, border: `0.5px solid ${C.accent}`, borderRadius: 6,
  background: "#E6F1FB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  color: C.accent, fontFamily: "inherit",
};

// ── Grid styles ──────────────────────────────────────────────

const gridBtnStyle = {
  padding: "5px 12px", border: `0.5px solid ${C.border}`, borderRadius: 6,
  background: C.cardBg, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
  color: C.muted, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500,
};

const gridThBase = {
  padding: "10px 12px", fontWeight: 600, color: C.muted, borderBottom: `2px solid #e2e5ea`,
  textAlign: "center", whiteSpace: "nowrap", fontSize: 12, background: C.cardBg,
  position: "sticky", top: 0, zIndex: 2,
};
const gridThDay = { ...gridThBase, textAlign: "center", width: 48, minWidth: 48, position: "sticky", top: 0, left: 0, zIndex: 3 };
const gridTh = { ...gridThBase };
const gridThSum = { ...gridThBase, position: "sticky", top: 0, right: 0, zIndex: 3, color: C.accent };

const gridTdBase = {
  padding: "8px 12px", borderBottom: `1px solid #f0f1f3`, textAlign: "right",
  fontSize: 13, fontVariantNumeric: "tabular-nums",
};
const gridTdDay = {
  ...gridTdBase, textAlign: "center", fontWeight: 600, fontSize: 12,
  position: "sticky", left: 0, zIndex: 1, borderRight: `1px solid #eceef1`, minWidth: 48, cursor: "default",
};
const gridTdData = { ...gridTdBase };
const gridTdSum = {
  ...gridTdBase, position: "sticky", right: 0, zIndex: 1, fontWeight: 600,
  color: C.accent, borderLeft: `1px solid #eceef1`, cursor: "default",
};

const gridFootBase = {
  padding: "10px 12px", fontWeight: 700, borderTop: `2px solid #d0dff0`,
  borderBottom: "none", textAlign: "right", fontSize: 13,
  position: "sticky", bottom: 0, zIndex: 2, background: "#E6F1FB",
};
const gridFootDay = { ...gridFootBase, textAlign: "center", position: "sticky", left: 0, bottom: 0, zIndex: 3, color: C.accent, fontWeight: 600 };
const gridFootData = { ...gridFootBase, color: C.text };
const gridFootGrand = { ...gridFootBase, position: "sticky", right: 0, bottom: 0, zIndex: 3, color: C.accent, fontWeight: 800, fontSize: 14, background: "#d4e6f9" };

const gridCellInputStyle = {
  width: "100%", height: 30, border: `2px solid ${C.accent}`, borderRadius: 5,
  textAlign: "right", fontSize: 14, fontWeight: 600, padding: "0 8px",
  fontFamily: "inherit", outline: "none", fontVariantNumeric: "tabular-nums",
  boxShadow: `0 0 0 3px rgba(1,118,211,0.12)`, boxSizing: "border-box",
};

const kbdStyle = {
  display: "inline-block", padding: "1px 5px", border: `0.5px solid ${C.border}`,
  borderRadius: 3, fontSize: 10, background: C.pageBg, fontFamily: "monospace",
};
