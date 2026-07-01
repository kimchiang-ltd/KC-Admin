// ============================================================
// KC Admin — Shared Constants
// Colors, limits, thresholds shared across apps
// ============================================================

// ── App Version ──────────────────────────────────────────
export const APP_VERSION = "1.4.247";

// ── Colors ────────────────────────────────────────────────
export const C = {
  sidebar: "#032d60",
  sidebarActive: "rgba(1,118,211,0.25)",
  sidebarActiveBorder: "#0176d3",
  accent: "#0176d3",
  pageBg: "#f3f3f3",
  cardBg: "#ffffff",
  text: "#181818",
  muted: "#6b6b6b",
  border: "rgba(0,0,0,0.1)",
  borderLight: "rgba(0,0,0,0.07)",
  success: "#2e844a",
  successBg: "#cdefc4",
  warning: "#a96404",
  warningBg: "#fdefc4",
  rowHover: "#f8f9ff",
  danger: "#c23934",
  dangerBg: "#fdecea",
  pdfHeader: "#0f2942",  // #218 — dark navy for TIDetailPopup table header
};

export const SECTION_COLORS = {
  null:       { bg: "#E6F1FB", color: "#185FA5" },
  "เอกสาร":   { bg: "#E6F1FB", color: "#185FA5" },
  "คลังสินค้า":{ bg: "#EAF3DE", color: "#3B6D11" },
  "HR":       { bg: "#E5F5F0", color: "#1A6B50" },
  "รายงาน":   { bg: "#FAEEDA", color: "#854F0B" },
  "ระบบ":     { bg: "#F1EFE8", color: "#5F5E5A" },
};

// ── Pagination ────────────────────────────────────────────
export const PAGE_SIZE = 50;

// ── Invoice row limits ────────────────────────────────────
export const ITEMS_COUNT = 10;            // default item row cap (useInvoiceForm default)
export const DN_MAX_ROWS = 20;            // DN landscape cap (2 pages × 10 rows, matches Code.gs MAX_ITEM_ROWS_V2)
export const emptyItem  = () => ({ desc: "", desc2: "", detail: "", qty: "", unitPrice: "", amount: "" });

// ── Description width limits (DN portrait) ────────────────
export const DESC_MAX   = 42;
export const DETAIL_WARN = 25;
export const DETAIL_MAX  = 34;

// ── Customer similarity ───────────────────────────────────
export const SIMILARITY_THRESHOLD = 0.75;

// ── DN landscape width limits ─────────────────────────────
// Thai base = 1.0u, non-Thai = 1.1u, space = 4/15u
// Zero-width diacritics (ั ิ ี ึ ื ุ ู ็ ่ ้ ๊ ๋ ์ ํ) = 0u
export const DN_ZERO_WIDTH = new Set([0x0E31,0x0E34,0x0E35,0x0E36,0x0E37,0x0E38,0x0E39,0x0E47,0x0E48,0x0E49,0x0E4A,0x0E4B,0x0E4C,0x0E4D]);
export const DESC_MAX_DN_L   = 17;
export const DETAIL_WARN_DN_L = 15;
export const DETAIL_MAX_DN_L  = 20;
