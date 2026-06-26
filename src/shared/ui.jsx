// ============================================================
// KC Admin — Shared UI Components
// Reusable presentational components shared across apps
// ============================================================

import { useEffect } from "react";
import { Loader, Search, Phone, Camera, Mic } from "lucide-react";
import { C, PAGE_SIZE } from './constants.jsx';

// ── Basic UI primitives ────────────────────────────────────

const Badge = ({ type, success, children }) => {
  const styles = {
    success: { background: C.successBg, color: C.success },
    warning: { background: C.warningBg, color: C.warning },
    info:    { background: "#d8edff",   color: C.accent },
  };
  const s = type ? styles[type] : success ? styles.success : styles.warning;
  return <span style={{ ...s, padding: "2px 9px", borderRadius: 10, fontSize: 10, fontWeight: 500 }}>{children}</span>;
};

const Btn = ({ onClick, primary, danger, small, disabled, children, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: primary ? C.accent : danger ? C.dangerBg : "white",
    color: primary ? "white" : danger ? C.danger : C.accent,
    border: primary ? "none" : danger ? `1px solid ${C.danger}` : `1px solid ${C.accent}`,
    padding: small ? "4px 10px" : "6px 14px", borderRadius: 4,
    fontSize: small ? 11 : 12, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 5,
    ...style,
  }}>{children}</button>
);

const inputStyle = { padding: "6px 10px", border: `0.5px solid rgba(0,0,0,0.2)`, borderRadius: 4, fontSize: 12, outline: "none", boxSizing: "border-box", height: 32, fontFamily: "inherit" };

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 500, color: C.accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>{children}</div>
);

// Spinner / loading state
const Spinner = ({ text = "กำลังโหลด..." }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, flexDirection: "column", gap: 12, color: C.muted }}>
    <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    <div style={{ fontSize: 13 }}>{text}</div>
  </div>
);

const ErrorBox = ({ msg, onRetry }) => (
  <div style={{ background: C.dangerBg, color: C.danger, padding: "14px 18px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <span>⚠️ {msg}</span>
    {onRetry && <Btn small danger onClick={onRetry}>ลองใหม่</Btn>}
  </div>
);

const Paginator = ({ total, page, onChange }) => {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const btnS = { background: "white", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: C.muted };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "10px 14px", borderTop: `0.5px solid ${C.border}`, fontSize: 12 }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ ...btnS, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "default" : "pointer" }}>‹ ก่อนหน้า</button>
      <span style={{ color: C.muted }}>หน้า {page} / {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ ...btnS, opacity: page === pages ? 0.4 : 1, cursor: page === pages ? "default" : "pointer" }}>ถัดไป ›</button>
    </div>
  );
};

// ── ConfirmModal ────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "ลบ", loading = false, enterConfirm = false, onSecondary, secondaryLabel }) {
  useEffect(() => {
    if (!enterConfirm) return;
    const handler = e => {
      if (e.key === "Enter" && !loading) { e.preventDefault(); onConfirm(); }
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enterConfirm, loading, onConfirm, onCancel]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "white", borderRadius: 10, padding: "24px 28px", minWidth: 260, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 20 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} disabled={loading} style={{ padding: "7px 20px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: C.text, opacity: loading ? 0.5 : 1 }}>ยกเลิก</button>
          {onSecondary && secondaryLabel && (
            <button onClick={onSecondary} disabled={loading} style={{ padding: "7px 20px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#f5f5f5", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: C.text, opacity: loading ? 0.5 : 1 }}>{secondaryLabel}</button>
          )}
          <button onClick={onConfirm} disabled={loading} style={{ padding: "7px 20px", borderRadius: 6, border: "none", background: "#e5534b", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: "white", fontWeight: 500, opacity: loading ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {loading && <Loader size={13}/>}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QR instruction screens ─────────────────────────────────

const INSTR_STEPS = [
  { label: "เปิด Camera app บนมือถือ", sub: "กดที่ไอคอนกล้องบน Home screen", cx: 75, cy: 88 },
  { label: "ส่องกล้องไปที่ QR บนจอ PC", sub: "ใช้กล้องปกติ ไม่ใช่ LINE scanner", cx: 50, cy: 45 },
  { label: "กด link ที่โผล่ขึ้นมา", sub: "drive.google.com จะขึ้นที่ด้านล่าง", cx: 50, cy: 88 },
  { label: "PDF เปิดใน Google Drive", sub: "กด ⋮ มุมขวาบน", cx: 92, cy: 7 },
  { label: "เมนูเด้งขึ้นมุมขวาบน", sub: "เลื่อนลงหา Send a copy", cx: 70, cy: 28 },
  { label: 'กด "Send a copy"', sub: "รายการที่ไฮไลต์สีฟ้า", cx: 62, cy: 48 },
  { label: "เลือก LINE", sub: "จาก share menu ที่เด้งขึ้น", cx: 35, cy: 80 },
  { label: "เลือก contact → กด Share", sub: "ส่งให้ลูกค้าได้เลย! 🎉", cx: 88, cy: 7 },
];

const renderPhoneScreen = (step) => {
  const abs = { position: "absolute", inset: 0 };
  // Step 0: Home screen
  if (step === 0) return (
    <div style={{ ...abs, background: "linear-gradient(160deg,#7ec8f7 0%,#4a8fd4 100%)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", fontSize: 6, color: "white" }}><span>13:40</span><span>▊ WiFi</span></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 20, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4, width: "80%" }}>
          <span style={{ fontSize: 9, color: "#4285F4", fontWeight: "bold" }}>G</span>
          <div style={{ flex: 1, height: 1 }} />
          <Mic size={8} color="#888" /><Camera size={8} color="#888" />
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: "10px 10px 0 0", padding: "6px 0 4px", display: "flex", justifyContent: "space-around" }}>
        {[{ bg: "#34A853", l: <Phone size={10} color="white" /> }, { bg: "#4285F4", l: "C" }, { bg: "#00B900", l: "L" }, { bg: "#607D8B", l: <Camera size={10} color="white" /> }].map((a, i) => (
          <div key={i} style={{ width: 26, height: 26, borderRadius: 8, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, outline: i === 3 ? "2px solid white" : "none" }}>{a.l}</div>
        ))}
      </div>
    </div>
  );
  // Step 1: Camera open - QR viewfinder (white bg, black frame + QR)
  if (step === 1) return (
    <div style={{ ...abs, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 60, height: 60 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 12, height: 12, borderTop: "2px solid #222", borderLeft: "2px solid #222" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 12, height: 12, borderTop: "2px solid #222", borderRight: "2px solid #222" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderBottom: "2px solid #222", borderLeft: "2px solid #222" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderBottom: "2px solid #222", borderRight: "2px solid #222" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "grid", gridTemplateColumns: "repeat(7, 5px)", gap: "0.5px" }}>
          {[1,1,1,0,1,1,1, 1,0,1,1,1,0,1, 1,1,1,0,1,1,1, 0,1,0,1,0,1,0, 1,1,1,0,1,0,1, 1,0,0,1,1,0,1, 1,1,0,0,0,1,1].map((cell, i) => (
            <div key={i} style={{ width: 5, height: 5, background: cell ? "#222" : "transparent" }} />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12, fontSize: 6, color: "#bbb" }}>
        <span>PORTRAIT</span><span style={{ color: "#333", borderBottom: "1px solid #333" }}>PHOTO</span><span>VIDEO</span>
      </div>
    </div>
  );
  // Step 2: QR detected → drive.google.com link appears
  if (step === 2) return (
    <div style={{ ...abs, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 60, height: 60 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 12, height: 12, borderTop: "2px solid #00c853", borderLeft: "2px solid #00c853" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 12, height: 12, borderTop: "2px solid #00c853", borderRight: "2px solid #00c853" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderBottom: "2px solid #00c853", borderLeft: "2px solid #00c853" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderBottom: "2px solid #00c853", borderRight: "2px solid #00c853" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "grid", gridTemplateColumns: "repeat(7, 5px)", gap: "0.5px" }}>
          {[1,1,1,0,1,1,1, 1,0,1,1,1,0,1, 1,1,1,0,1,1,1, 0,1,0,1,0,1,0, 1,1,1,0,1,0,1, 1,0,0,1,1,0,1, 1,1,0,0,0,1,1].map((cell, i) => (
            <div key={i} style={{ width: 5, height: 5, background: cell ? "#222" : "transparent" }} />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 6, right: 6, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <div style={{ background: "rgba(40,40,40,0.92)", borderRadius: 12, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
          <div style={{ width: 7, height: 7, border: "1.5px solid #aaa", borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 6, color: "white", flex: 1 }}>drive.google.com</span>
          <span style={{ fontSize: 6, color: "#aaa" }}>∧</span>
        </div>
        <div style={{ background: "rgba(60,60,60,0.9)", borderRadius: 10, padding: "3px 14px", fontSize: 6, color: "white" }}>Scan</div>
      </div>
    </div>
  );
  // Step 3: PDF open in Drive
  if (step === 3) return (
    <div style={{ ...abs, background: "#f1f3f4" }}>
      <div style={{ background: "white", padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 8, color: "#555" }}>←</span>
        <span style={{ fontSize: 6, color: "#333", flex: 1 }}>KC_Delivery...</span>
        <span style={{ fontSize: 7, color: "#555" }}>✦</span><span style={{ fontSize: 7, color: "#555" }}>≡</span><Search size={7} color="#555" />
        <span style={{ fontSize: 11, color: "#555", fontWeight: "bold", lineHeight: 1 }}>⋮</span>
      </div>
      <div style={{ margin: "4px 5px", background: "white", borderRadius: 3, padding: "5px 6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, background: "#222", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 5, color: "white", fontWeight: "bold" }}>KC</span></div>
          <div><div style={{ fontSize: 5, fontWeight: "bold", color: "#111" }}>ห้างหุ้นส่วนจำกัด</div><div style={{ fontSize: 4, color: "#888" }}>KIMCHIANG LIMITED</div></div>
        </div>
        <div style={{ fontSize: 5, color: "#333", fontWeight: "bold", marginBottom: 3 }}>ใบส่งของชั่วคราว</div>
        {[70, 40, 80, 35, 55, 40, 65, 30].map((w, i) => <div key={i} style={{ height: 2, background: "#e8e8e8", borderRadius: 1, width: w + "%", marginBottom: 2 }} />)}
      </div>
    </div>
  );
  // Step 4: Dropdown from top-right corner — normal size
  if (step === 4) return (
    <div style={{ ...abs, background: "#f1f3f4" }}>
      <div style={{ background: "white", padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 8, color: "#555" }}>←</span>
        <span style={{ fontSize: 6, color: "#333", flex: 1 }}>KC_Delivery...</span>
        <span style={{ fontSize: 7, color: "#555" }}>✦</span><span style={{ fontSize: 7, color: "#555" }}>≡</span><Search size={7} color="#555" />
        <span style={{ fontSize: 11, color: "#555", fontWeight: "bold", lineHeight: 1 }}>⋮</span>
      </div>
      <div style={{ margin: "4px 5px", background: "white", borderRadius: 3, padding: "5px 6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", opacity: 0.4 }}>
        {[70, 40, 80, 35, 55, 40].map((w, i) => <div key={i} style={{ height: 2, background: "#e8e8e8", borderRadius: 1, width: w + "%", marginBottom: 3 }} />)}
      </div>
      <div style={{ position: "absolute", top: 22, right: 3, background: "white", borderRadius: 4, boxShadow: "0 2px 10px rgba(0,0,0,0.25)", width: 100, zIndex: 10, overflow: "hidden" }}>
        {[["Share",""], ["Manage access",""], ["Add to starred",""], ["Make available offline",""], ["Summarise this file","New"], ["Copy link",""], ["Make a copy",""], ["Send a copy",""], ["Open with",""], ["Download",""]].map(([item, tag], i) => (
          <div key={i} style={{ padding: "3px 8px", fontSize: 6, color: "#333", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{item}</span>
            {tag === "New" && <span style={{ background: "#4CAF50", color: "white", fontSize: 4, padding: "1px 2px", borderRadius: 2 }}>New</span>}
          </div>
        ))}
      </div>
    </div>
  );
  // Step 5: Dropdown from top-right — zoomed, Send a copy highlighted
  if (step === 5) return (
    <div style={{ ...abs, background: "#f1f3f4" }}>
      <div style={{ background: "white", padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 8, color: "#555" }}>←</span>
        <span style={{ fontSize: 6, color: "#333", flex: 1 }}>KC_Delivery...</span>
        <span style={{ fontSize: 7, color: "#555" }}>✦</span><span style={{ fontSize: 7, color: "#555" }}>≡</span><Search size={7} color="#555" />
        <span style={{ fontSize: 11, color: "#555", fontWeight: "bold", lineHeight: 1 }}>⋮</span>
      </div>
      <div style={{ margin: "4px 5px", background: "white", borderRadius: 3, padding: "5px 6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", opacity: 0.4 }}>
        {[70, 40, 80, 35, 55, 40].map((w, i) => <div key={i} style={{ height: 2, background: "#e8e8e8", borderRadius: 1, width: w + "%", marginBottom: 3 }} />)}
      </div>
      <div style={{ position: "absolute", top: 22, right: 3, background: "white", borderRadius: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.28)", width: 130, zIndex: 10, overflow: "hidden" }}>
        {[["Share",""], ["Manage access",""], ["Add to starred",""], ["Make available offline",""], ["Summarise this file","New"], ["Copy link",""], ["Make a copy",""], ["Send a copy","highlight"], ["Open with",""], ["Download",""]].map(([item, tag], i) => (
          <div key={i} style={{ padding: "4px 10px", fontSize: 8, color: tag === "highlight" ? "#1976d2" : "#333", background: tag === "highlight" ? "#e3f2fd" : "transparent", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{item}</span>
            {tag === "New" && <span style={{ background: "#4CAF50", color: "white", fontSize: 5, padding: "1px 3px", borderRadius: 2 }}>New</span>}
          </div>
        ))}
      </div>
    </div>
  );
  // Step 6: Android share sheet
  if (step === 6) return (
    <div style={{ ...abs, background: "#f1f3f4" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "10px 10px 0 0", padding: "6px 6px 4px" }}>
        <div style={{ fontSize: 7, fontWeight: "bold", color: "#111", marginBottom: 4 }}>1 item</div>
        <div style={{ background: "#f5f5f5", borderRadius: 6, padding: "5px 6px", marginBottom: 5, display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ width: 22, height: 28, background: "white", border: "1px solid #ddd", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 6, fontWeight: "bold", color: "#333" }}>PDF</span>
          </div>
          <span style={{ fontSize: 5, color: "#555", wordBreak: "break-all" }}>KC_DeliveryNote...</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 5, overflowX: "hidden" }}>
          {["#4CAF50","#2196F3","#FF9800","#9C27B0","#607D8B"].map((c, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: c, flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[{ l: "Q", color: "#607D8B", name: "Quick\nShare" }, { l: "L", color: "#00B900", name: "LINE" }, { l: "M", color: "#4285F4", name: "Msg" }, { l: "G", color: "#EA4335", name: "Gmail" }].map((a, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <div style={{ width: 22, height: 22, borderRadius: 8, background: a.color, display: "flex", alignItems: "center", justifyContent: "center", outline: i === 1 ? "2px solid #00B900" : "none" }}>
                <span style={{ fontSize: 9, color: "white", fontWeight: "bold" }}>{a.l}</span>
              </div>
              <span style={{ fontSize: 4, color: "#555", textAlign: "center", whiteSpace: "pre" }}>{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  // Step 7: LINE contact picker
  if (step === 7) return (
    <div style={{ ...abs, background: "white" }}>
      <div style={{ background: "white", padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 6, color: "#333" }}>✕  1 selected</span>
        <span style={{ fontSize: 7, color: "#00B900", fontWeight: "bold" }}>Share</span>
      </div>
      <div style={{ padding: "3px 6px", background: "#f7f7f7", borderBottom: "1px solid #eee" }}>
        <div style={{ background: "white", borderRadius: 8, padding: "2px 5px", fontSize: 5, color: "#999", display: "flex", alignItems: "center", gap: 3 }}><Search size={6} color="#bbb" /> Search by name</div>
      </div>
      <div style={{ padding: "3px 6px 2px", fontSize: 5, color: "#888", fontWeight: "bold" }}>Recently shared with</div>
      {[{ name: "ลูกค้า A", color: "#4CAF50", selected: true }, { name: "Powpow", color: "#2196F3", selected: false }, { name: "กลุ่มทีม KC", color: "#FF9800", selected: false }].map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 6px", borderBottom: "1px solid #f5f5f5" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: c.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 6, color: "white" }}>{c.name[0]}</span>
          </div>
          <span style={{ fontSize: 6, color: "#333", flex: 1 }}>{c.name}</span>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: c.selected ? "#00B900" : "transparent", border: c.selected ? "none" : "1px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {c.selected && <span style={{ fontSize: 6, color: "white" }}>✓</span>}
          </div>
        </div>
      ))}
    </div>
  );
  return null;
};

export { Badge, Btn, inputStyle, SectionTitle, Spinner, ErrorBox, Paginator, ConfirmModal, INSTR_STEPS, renderPhoneScreen };
